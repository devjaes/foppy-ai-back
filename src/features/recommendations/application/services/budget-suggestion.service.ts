import {
  IAnalysisService,
  AnalysisResult,
} from "../../domain/ports/analysis.service.interface";
import { RecommendationPriority } from "../../domain/entities/recommendation.types";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { PgBudgetRepository } from "@/budgets/infrastructure/adapters/budget.repository";
import { PgCategoryRepository } from "@/categories/infrastructure/adapters/category.repository";

interface CategoryWithoutBudget {
  categoryId: number;
  categoryName: string;
  averageMonthlySpending: number;
}

export class BudgetSuggestionService implements IAnalysisService {
  private static instance: BudgetSuggestionService;
  private transactionRepository: PgTransactionRepository;
  private budgetRepository: PgBudgetRepository;
  private categoryRepository: PgCategoryRepository;
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  private readonly MIN_AVERAGE_SPENDING = 50;

  private constructor() {
    this.transactionRepository = PgTransactionRepository.getInstance();
    this.budgetRepository = PgBudgetRepository.getInstance();
    this.categoryRepository = PgCategoryRepository.getInstance();
  }

  public static getInstance(): BudgetSuggestionService {
    if (!BudgetSuggestionService.instance) {
      BudgetSuggestionService.instance = new BudgetSuggestionService();
    }
    return BudgetSuggestionService.instance;
  }

  async analyze(userId: number): Promise<AnalysisResult | null> {
    try {
      const categoryNeedingBudget = await this.findCategoryNeedingBudget(
        userId
      );

      if (!categoryNeedingBudget) {
        return null;
      }

      const aiSuggestion = await this.getAISuggestion(categoryNeedingBudget);

      const priority = this.calculatePriority(
        categoryNeedingBudget.averageMonthlySpending
      );

      return {
        shouldGenerate: true,
        priority,
        title: `Crear presupuesto para ${categoryNeedingBudget.categoryName}`,
        description: aiSuggestion.reasoning,
        data: {
          categoryId: categoryNeedingBudget.categoryId,
          categoryName: categoryNeedingBudget.categoryName,
          averageSpending: categoryNeedingBudget.averageMonthlySpending,
          suggestedBudget: aiSuggestion.suggestedBudget,
        },
        actions: [
          {
            label: "Crear presupuesto",
            path: "/management/budgets/create",
            prefilledData: {
              categoryId: categoryNeedingBudget.categoryId,
              limitAmount: aiSuggestion.suggestedBudget,
              month: this.getCurrentMonthString(),
            },
          },
          {
            label: "Ver gastos",
            path: "/management/transactions",
            prefilledData: {
              categoryId: categoryNeedingBudget.categoryId,
              type: "EXPENSE",
            },
          },
        ],
      };
    } catch (error) {
      console.error("Error in BudgetSuggestionService:", error);
      return null;
    }
  }

  private async findCategoryNeedingBudget(
    userId: number
  ): Promise<CategoryWithoutBudget | null> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentExpenses = await this.transactionRepository.findByFilters(
      userId,
      {
        type: "EXPENSE",
        startDate: threeMonthsAgo.toISOString(),
        endDate: new Date().toISOString(),
      }
    );

    const currentMonthBudgets =
      await this.budgetRepository.findByUserIdAndMonth(
        userId,
        new Date(this.getCurrentMonthString())
      );

    console.log(
      `[BudgetSuggestion] User ${userId}: Found ${recentExpenses.length} expenses in last 3 months, ${currentMonthBudgets.length} budgets this month`
    );

    const budgetedCategoryIds = new Set(
      currentMonthBudgets.map((b) => b.categoryId).filter((id) => id !== null)
    );

    const spendingByCategory: Record<number, { name: string; total: number }> =
      {};

    for (const expense of recentExpenses) {
      if (!expense.categoryId) continue;

      if (budgetedCategoryIds.has(expense.categoryId)) continue;

      if (!spendingByCategory[expense.categoryId]) {
        spendingByCategory[expense.categoryId] = {
          name: expense.category?.name || "Sin nombre",
          total: 0,
        };
      }

      spendingByCategory[expense.categoryId].total += expense.amount;
    }

    const categoriesNeedingBudget: CategoryWithoutBudget[] = [];

    for (const [categoryIdStr, data] of Object.entries(spendingByCategory)) {
      const categoryId = Number(categoryIdStr);
      const averageMonthlySpending = data.total / 3;

      if (averageMonthlySpending >= this.MIN_AVERAGE_SPENDING) {
        categoriesNeedingBudget.push({
          categoryId,
          categoryName: data.name,
          averageMonthlySpending: Math.round(averageMonthlySpending),
        });
      }
    }

    if (categoriesNeedingBudget.length === 0) {
      console.log(
        `[BudgetSuggestion] User ${userId}: No categories needing budget (all categories either have budgets or spend <$${this.MIN_AVERAGE_SPENDING}/month)`
      );
      return null;
    }

    categoriesNeedingBudget.sort(
      (a, b) => b.averageMonthlySpending - a.averageMonthlySpending
    );

    console.log(
      `[BudgetSuggestion] User ${userId}: Category "${categoriesNeedingBudget[0].categoryName}" needs budget (avg: $${categoriesNeedingBudget[0].averageMonthlySpending}/month)`
    );

    return categoriesNeedingBudget[0];
  }

  private async getAISuggestion(
    category: CategoryWithoutBudget
  ): Promise<{ suggestedBudget: number; reasoning: string }> {
    // Use fallback logic if no API key is configured
    if (!this.OPENAI_API_KEY || this.OPENAI_API_KEY === "") {
      console.log(
        "OpenAI API key not configured, using fallback logic for budget suggestion"
      );
      return this.getFallbackSuggestion(category);
    }

    const prompt = `El usuario gasta en promedio $${category.averageMonthlySpending.toFixed(
      2
    )}/mes en "${
      category.categoryName
    }" pero no tiene un presupuesto establecido para esta categoría.

Sugiere un presupuesto mensual razonable que:
1. Incluya un buffer del 10-20% para flexibilidad
2. Sea realista basado en su patrón de gasto actual
3. Le ayude a controlar sus gastos sin ser demasiado restrictivo

Proporciona un razonamiento breve (2-3 oraciones) sobre por qué este presupuesto es apropiado.

Responde SOLO con un JSON válido en este formato:
{
  "suggestedBudget": número (monto sugerido para el presupuesto mensual),
  "reasoning": "explicación breve sobre el presupuesto sugerido"
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
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "system",
                content:
                  "Eres un asesor financiero experto en presupuestos personales. Proporciona recomendaciones prácticas y motivadoras en español.",
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
        const errorBody = await response.text();
        console.error(`OpenAI API error: ${response.status} - ${errorBody}`);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error calling OpenAI API, using fallback:", error);
      return this.getFallbackSuggestion(category);
    }
  }

  private getFallbackSuggestion(category: CategoryWithoutBudget): {
    suggestedBudget: number;
    reasoning: string;
  } {
    const suggestedBudget = Math.ceil(category.averageMonthlySpending * 1.15);

    return {
      suggestedBudget,
      reasoning: `Basado en tu gasto promedio de $${category.averageMonthlySpending.toFixed(
        2
      )}, te sugerimos un presupuesto de $${suggestedBudget.toFixed(
        2
      )} mensual que incluye un 15% de flexibilidad para imprevistos en ${
        category.categoryName
      }.`,
    };
  }

  private calculatePriority(averageSpending: number): RecommendationPriority {
    if (averageSpending >= 500) {
      return RecommendationPriority.HIGH;
    } else if (averageSpending >= 200) {
      return RecommendationPriority.MEDIUM;
    }
    return RecommendationPriority.LOW;
  }

  private getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
}
