import {
  IAnalysisService,
  AnalysisResult,
} from "../../domain/ports/analysis.service.interface";
import { RecommendationPriority } from "../../domain/entities/recommendation.types";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { sql } from "drizzle-orm";

interface CategorySpending {
  categoryId: number | null;
  categoryName: string;
  currentMonthTotal: number;
  threeMonthAverage: number;
  percentageIncrease: number;
}

export class SpendingAnalysisService implements IAnalysisService {
  private static instance: SpendingAnalysisService;
  private transactionRepository: PgTransactionRepository;
  private readonly THRESHOLD_PERCENTAGE = 20;
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

  private constructor() {
    this.transactionRepository = PgTransactionRepository.getInstance();
  }

  public static getInstance(): SpendingAnalysisService {
    if (!SpendingAnalysisService.instance) {
      SpendingAnalysisService.instance = new SpendingAnalysisService();
    }
    return SpendingAnalysisService.instance;
  }

  async analyze(userId: number): Promise<AnalysisResult | null> {
    try {
      const unusualSpending = await this.findUnusualSpending(userId);

      if (!unusualSpending) {
        return null;
      }

      const aiInsight = await this.getAIInsight(unusualSpending);

      const priority = this.calculatePriority(
        unusualSpending.percentageIncrease
      );

      return {
        shouldGenerate: true,
        priority,
        title: `Gasto inusual en ${unusualSpending.categoryName}`,
        description: aiInsight.insight,
        data: {
          categoryId: unusualSpending.categoryId,
          categoryName: unusualSpending.categoryName,
          currentAmount: unusualSpending.currentMonthTotal,
          averageAmount: unusualSpending.threeMonthAverage,
          percentageIncrease: unusualSpending.percentageIncrease,
          suggestion: aiInsight.suggestion,
        },
        actions: [
          {
            label: "Ver transacciones",
            path: "/management/transactions",
            prefilledData: {
              categoryId: unusualSpending.categoryId,
              startDate: this.getFirstDayOfCurrentMonth(),
              endDate: new Date().toISOString(),
            },
          },
          {
            label: "Crear presupuesto",
            path: "/management/budgets/create",
            prefilledData: {
              categoryId: unusualSpending.categoryId,
              limitAmount: Math.ceil(unusualSpending.threeMonthAverage * 1.1),
            },
          },
        ],
      };
    } catch (error) {
      console.error("Error in SpendingAnalysisService:", error);
      return null;
    }
  }

  private async findUnusualSpending(
    userId: number
  ): Promise<CategorySpending | null> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      1
    );
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const currentMonthExpenses = await this.transactionRepository.findByFilters(
      userId,
      {
        type: "EXPENSE",
        startDate: currentMonthStart.toISOString(),
        endDate: now.toISOString(),
      }
    );

    const previousThreeMonthsExpenses =
      await this.transactionRepository.findByFilters(userId, {
        type: "EXPENSE",
        startDate: threeMonthsAgo.toISOString(),
        endDate: previousMonthStart.toISOString(),
      });

    const currentMonthByCategory = this.groupByCategory(currentMonthExpenses);
    const previousMonthsByCategory = this.groupByCategory(
      previousThreeMonthsExpenses
    );

    const categoryAnalysis: CategorySpending[] = [];

    for (const [categoryKey, currentTotal] of Object.entries(
      currentMonthByCategory
    )) {
      const [categoryId, categoryName] = categoryKey.split("|");
      const previousTotal = previousMonthsByCategory[categoryKey] || 0;
      const threeMonthAverage = previousTotal / 3;

      if (threeMonthAverage === 0) continue;

      const percentageIncrease =
        ((currentTotal - threeMonthAverage) / threeMonthAverage) * 100;

      if (percentageIncrease > this.THRESHOLD_PERCENTAGE) {
        categoryAnalysis.push({
          categoryId: categoryId ? Number(categoryId) : null,
          categoryName: categoryName || "Sin categoría",
          currentMonthTotal: currentTotal,
          threeMonthAverage: threeMonthAverage,
          percentageIncrease: Math.round(percentageIncrease),
        });
      }
    }

    if (categoryAnalysis.length === 0) {
      return null;
    }

    categoryAnalysis.sort(
      (a, b) => b.percentageIncrease - a.percentageIncrease
    );

    return categoryAnalysis[0];
  }

  private groupByCategory(
    transactions: any[]
  ): Record<string, number> {
    return transactions.reduce((acc, tx) => {
      const key = `${tx.categoryId || "null"}|${tx.category?.name || "Sin categoría"}`;
      acc[key] = (acc[key] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getAIInsight(
    spending: CategorySpending
  ): Promise<{ insight: string; suggestion: string }> {
    const prompt = `El usuario ha gastado $${spending.currentMonthTotal.toFixed(2)} en "${spending.categoryName}" este mes, lo cual es ${spending.percentageIncrease}% más que su promedio de 3 meses de $${spending.threeMonthAverage.toFixed(2)}.

Proporciona:
1. Un análisis breve (2-3 oraciones) sobre este patrón de gasto
2. Una sugerencia accionable para el usuario

Responde SOLO con un JSON válido en este formato:
{
  "insight": "análisis del patrón",
  "suggestion": "sugerencia accionable"
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
                  "Eres un asesor financiero experto. Proporciona análisis claros y sugerencias prácticas en español.",
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

      return {
        insight: `Has incrementado tu gasto en ${spending.categoryName} en un ${spending.percentageIncrease}% comparado con tu promedio mensual. Este cambio significativo merece atención.`,
        suggestion:
          "Revisa tus transacciones recientes en esta categoría para identificar gastos innecesarios y considera establecer un presupuesto mensual.",
      };
    }
  }

  private calculatePriority(
    percentageIncrease: number
  ): RecommendationPriority {
    if (percentageIncrease >= 50) {
      return RecommendationPriority.HIGH;
    } else if (percentageIncrease >= 30) {
      return RecommendationPriority.MEDIUM;
    }
    return RecommendationPriority.LOW;
  }

  private getFirstDayOfCurrentMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
}
