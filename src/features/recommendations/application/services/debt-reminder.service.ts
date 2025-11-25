import {
  IAnalysisService,
  AnalysisResult,
} from "../../domain/ports/analysis.service.interface";
import { RecommendationPriority } from "../../domain/entities/recommendation.types";
import { PgDebtRepository } from "@/debts/infrastructure/adapters/debt.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { IDebt } from "@/debts/domain/entities/IDebt";

interface DebtOpportunity {
  debt: IDebt;
  daysUntilDue: number;
  availableBalance: number;
  suggestedPayment: number;
  canPayFull: boolean;
}

export class DebtReminderService implements IAnalysisService {
  private static instance: DebtReminderService;
  private debtRepository: PgDebtRepository;
  private transactionRepository: PgTransactionRepository;
  private readonly DAYS_AHEAD_THRESHOLD = 15;
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

  private constructor() {
    this.debtRepository = PgDebtRepository.getInstance();
    this.transactionRepository = PgTransactionRepository.getInstance();
  }

  public static getInstance(): DebtReminderService {
    if (!DebtReminderService.instance) {
      DebtReminderService.instance = new DebtReminderService();
    }
    return DebtReminderService.instance;
  }

  async analyze(userId: number): Promise<AnalysisResult | null> {
    try {
      const debtOpportunity = await this.findPaymentOpportunity(userId);

      if (!debtOpportunity) {
        return null;
      }

      const aiSuggestion = await this.getAISuggestion(debtOpportunity);

      const priority = this.calculatePriority(debtOpportunity.daysUntilDue);

      return {
        shouldGenerate: true,
        priority,
        title: `Oportunidad de pago: ${debtOpportunity.debt.description}`,
        description: aiSuggestion.reasoning,
        data: {
          debtId: debtOpportunity.debt.id,
          debtName: debtOpportunity.debt.description,
          pendingAmount: debtOpportunity.debt.pendingAmount,
          daysUntilDue: debtOpportunity.daysUntilDue,
          dueDate: debtOpportunity.debt.dueDate.toISOString(),
          availableBalance: debtOpportunity.availableBalance,
          suggestedPayment: aiSuggestion.suggestedPayment,
          canPayFull: debtOpportunity.canPayFull,
        },
        actions: [
          {
            label: debtOpportunity.canPayFull
              ? "Pagar deuda completa"
              : "Hacer pago parcial",
            path: `/management/debts/${debtOpportunity.debt.id}/pay`,
            prefilledData: {
              amount: aiSuggestion.suggestedPayment,
            },
          },
          {
            label: "Ver detalles de deuda",
            path: `/management/debts/${debtOpportunity.debt.id}`,
            prefilledData: {},
          },
        ],
      };
    } catch (error) {
      console.error("Error in DebtReminderService:", error);
      return null;
    }
  }

  private async findPaymentOpportunity(
    userId: number
  ): Promise<DebtOpportunity | null> {
    const userDebts = await this.debtRepository.findByUserId(userId);

    const activeDebts = userDebts.filter(
      (debt) => !debt.paid && debt.pendingAmount > 0
    );

    if (activeDebts.length === 0) {
      return null;
    }

    const now = new Date();
    const upcomingDebts = activeDebts.filter((debt) => {
      const daysUntilDue = Math.ceil(
        (debt.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue > 0 && daysUntilDue <= this.DAYS_AHEAD_THRESHOLD;
    });

    if (upcomingDebts.length === 0) {
      return null;
    }

    const availableBalance = await this.calculateAvailableBalance(userId);

    if (availableBalance <= 0) {
      return null;
    }

    const opportunities: DebtOpportunity[] = [];

    for (const debt of upcomingDebts) {
      const daysUntilDue = Math.ceil(
        (debt.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const canPayFull = availableBalance >= debt.pendingAmount;

      const suggestedPayment = canPayFull
        ? debt.pendingAmount
        : Math.min(
            Math.floor(availableBalance * 0.5),
            debt.pendingAmount
          );

      if (suggestedPayment > 0) {
        opportunities.push({
          debt,
          daysUntilDue,
          availableBalance,
          suggestedPayment,
          canPayFull,
        });
      }
    }

    if (opportunities.length === 0) {
      return null;
    }

    opportunities.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return opportunities[0];
  }

  private async calculateAvailableBalance(userId: number): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyBalance = await this.transactionRepository.getMonthlyBalance(
      userId,
      firstDayOfMonth
    );

    return monthlyBalance.balance;
  }

  private async getAISuggestion(
    opportunity: DebtOpportunity
  ): Promise<{ suggestedPayment: number; reasoning: string }> {
    const prompt = `El usuario tiene disponible $${opportunity.availableBalance.toFixed(2)} este mes. La deuda "${opportunity.debt.description}" de $${opportunity.debt.pendingAmount.toFixed(2)} vence en ${opportunity.daysUntilDue} días.

${
  opportunity.canPayFull
    ? "Tiene suficiente para pagar la deuda completa."
    : `No puede pagar la deuda completa, pero puede hacer un pago parcial significativo.`
}

Sugiere cuánto debería pagar ahora considerando:
1. El monto disponible
2. Los días restantes hasta el vencimiento
3. Mantener un colchón de emergencia (no usar todo el balance disponible)
4. ${opportunity.canPayFull ? "Beneficios de liquidar la deuda completa" : "Reducir el saldo pendiente para evitar intereses"}

Proporciona un razonamiento motivador (2-3 oraciones) sobre por qué es importante hacer este pago ahora.

Responde SOLO con un JSON válido en este formato:
{
  "suggestedPayment": número (monto sugerido para pagar),
  "reasoning": "explicación breve y motivadora"
}`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "Eres un asesor financiero experto en gestión de deudas. Proporciona consejos prácticos y motivadores en español.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 300,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);

      const suggestedPayment = opportunity.canPayFull
        ? opportunity.debt.pendingAmount
        : Math.floor(opportunity.availableBalance * 0.4);

      return {
        suggestedPayment,
        reasoning: opportunity.canPayFull
          ? `Tienes suficiente saldo para liquidar esta deuda de $${opportunity.debt.pendingAmount.toFixed(2)}. Pagarla ahora te liberará de esta obligación y evitará posibles cargos por intereses.`
          : `Con tu saldo actual, puedes hacer un pago de $${suggestedPayment.toFixed(2)} que reducirá significativamente tu deuda. Esto te acercará a liquidarla y minimizará los intereses acumulados.`,
      };
    }
  }

  private calculatePriority(daysUntilDue: number): RecommendationPriority {
    if (daysUntilDue <= 5) {
      return RecommendationPriority.HIGH;
    } else if (daysUntilDue <= 10) {
      return RecommendationPriority.MEDIUM;
    }
    return RecommendationPriority.LOW;
  }
}
