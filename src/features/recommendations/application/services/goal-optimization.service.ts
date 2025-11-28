import {
  IAnalysisService,
  AnalysisResult,
} from "../../domain/ports/analysis.service.interface";
import { RecommendationPriority } from "../../domain/entities/recommendation.types";
import { PgGoalRepository } from "@/goals/infrastucture/adapters/goal.repository";
import { PgGoalContributionRepository } from "@/goals/infrastucture/adapters/goal-contribution.repository";
import { IGoal } from "@/goals/domain/entities/IGoal";

interface GoalAnalysis {
  goal: IGoal;
  daysRemaining: number;
  amountRemaining: number;
  dailyRequiredContribution: number;
  averageContribution: number;
  isUnrealistic: boolean;
  realismRatio: number;
}

export class GoalOptimizationService implements IAnalysisService {
  private static instance: GoalOptimizationService;
  private goalRepository: PgGoalRepository;
  private contributionRepository: PgGoalContributionRepository;
  private readonly UNREALISTIC_THRESHOLD = 2;
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

  private constructor() {
    this.goalRepository = PgGoalRepository.getInstance();
    this.contributionRepository = PgGoalContributionRepository.getInstance();
  }

  public static getInstance(): GoalOptimizationService {
    if (!GoalOptimizationService.instance) {
      GoalOptimizationService.instance = new GoalOptimizationService();
    }
    return GoalOptimizationService.instance;
  }

  async analyze(userId: number): Promise<AnalysisResult | null> {
    try {
      const unrealisticGoal = await this.findUnrealisticGoal(userId);

      if (!unrealisticGoal) {
        return null;
      }

      const aiSuggestion = await this.getAISuggestion(unrealisticGoal);

      const priority = this.calculatePriority(unrealisticGoal.realismRatio);

      const suggestedValues = this.calculateSuggestedValues(unrealisticGoal);

      return {
        shouldGenerate: true,
        priority,
        title: `Meta "${unrealisticGoal.goal.name}" necesita ajuste`,
        description: aiSuggestion.reasoning,
        data: {
          goalId: unrealisticGoal.goal.id,
          goalName: unrealisticGoal.goal.name,
          daysRemaining: unrealisticGoal.daysRemaining,
          amountRemaining: unrealisticGoal.amountRemaining,
          dailyRequired: unrealisticGoal.dailyRequiredContribution,
          averageContribution: unrealisticGoal.averageContribution,
          realismRatio: unrealisticGoal.realismRatio,
          suggestionType: aiSuggestion.suggestion,
          suggestedNewValue: aiSuggestion.newValue,
          suggestedTargetAmount: suggestedValues.targetAmount,
          suggestedEndDate: suggestedValues.endDate,
        },
        actions: [
          {
            label: "Ajustar meta",
            path: `/management/goals/${unrealisticGoal.goal.id}/edit`,
            prefilledData:
              aiSuggestion.suggestion === "extend"
                ? {
                    endDate: suggestedValues.endDate,
                  }
                : {
                    targetAmount: suggestedValues.targetAmount,
                  },
          },
          {
            label: "Ver contribuciones",
            path: `/management/goals/${unrealisticGoal.goal.id}`,
            prefilledData: {},
          },
        ],
      };
    } catch (error) {
      console.error("Error in GoalOptimizationService:", error);
      return null;
    }
  }

  private async findUnrealisticGoal(
    userId: number
  ): Promise<GoalAnalysis | null> {
    const activeGoals = await this.goalRepository.findAllActive();

    const userGoals = activeGoals.filter(
      (goal) => goal.userId === userId || goal.sharedUserId === userId
    );

    if (userGoals.length === 0) {
      return null;
    }

    const goalAnalyses: GoalAnalysis[] = [];

    for (const goal of userGoals) {
      const contributions = await this.contributionRepository.findByGoalId(
        goal.id
      );

      if (contributions.length === 0) continue;

      const daysRemaining = Math.ceil(
        (goal.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 0) continue;

      const amountRemaining = goal.targetAmount - goal.currentAmount;

      if (amountRemaining <= 0) continue;

      const dailyRequiredContribution = amountRemaining / daysRemaining;

      const totalContributions = contributions.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      const firstContribution = contributions[contributions.length - 1];
      const daysSinceStart = Math.ceil(
        (Date.now() - firstContribution.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      const averageContribution =
        daysSinceStart > 0 ? totalContributions / daysSinceStart : 0;

      if (averageContribution === 0) continue;

      const realismRatio = dailyRequiredContribution / averageContribution;

      const isUnrealistic = realismRatio > this.UNREALISTIC_THRESHOLD;

      if (isUnrealistic) {
        goalAnalyses.push({
          goal,
          daysRemaining,
          amountRemaining,
          dailyRequiredContribution,
          averageContribution,
          isUnrealistic,
          realismRatio,
        });
      }
    }

    if (goalAnalyses.length === 0) {
      return null;
    }

    goalAnalyses.sort((a, b) => b.realismRatio - a.realismRatio);

    return goalAnalyses[0];
  }

  private async getAISuggestion(
    analysis: GoalAnalysis
  ): Promise<{ suggestion: "extend" | "reduce"; newValue: number; reasoning: string }> {
    const prompt = `La meta "${analysis.goal.name}" del usuario requiere ahorrar $${analysis.dailyRequiredContribution.toFixed(2)}/día durante los próximos ${analysis.daysRemaining} días para alcanzar $${analysis.amountRemaining.toFixed(2)} faltantes.

Su contribución promedio histórica es de $${analysis.averageContribution.toFixed(2)}/día, lo cual hace esta meta ${Math.round(analysis.realismRatio)}x más exigente de lo que ha logrado mantener.

Sugiere:
1. Extender la fecha límite (¿cuántos días más necesitaría manteniendo su ritmo actual?)
2. Reducir el monto objetivo (¿a qué monto realista podría llegar con su ritmo actual en el tiempo restante?)

Proporciona un razonamiento breve (2-3 oraciones) y la recomendación específica.

Responde SOLO con un JSON válido en este formato:
{
  "suggestion": "extend" o "reduce",
  "newValue": número (días adicionales si extend, o nuevo monto objetivo si reduce),
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
                  "Eres un asesor financiero experto en establecimiento de metas realistas. Proporciona consejos motivadores y prácticos en español.",
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

      const daysNeeded = Math.ceil(
        analysis.amountRemaining / analysis.averageContribution
      );
      const additionalDays = daysNeeded - analysis.daysRemaining;

      return {
        suggestion: additionalDays > 0 ? "extend" : "reduce",
        newValue:
          additionalDays > 0
            ? additionalDays
            : Math.floor(
                analysis.averageContribution * analysis.daysRemaining
              ),
        reasoning:
          "Tu ritmo de ahorro actual sugiere que necesitas ajustar tu meta para hacerla más alcanzable. Esto te ayudará a mantener la motivación y el progreso constante.",
      };
    }
  }

  private calculateSuggestedValues(analysis: GoalAnalysis): {
    targetAmount: number;
    endDate: string;
  } {
    const daysNeeded = Math.ceil(
      analysis.amountRemaining / analysis.averageContribution
    );

    const realisticAmount = Math.floor(
      analysis.goal.currentAmount +
        analysis.averageContribution * analysis.daysRemaining
    );

    const extendedDate = new Date(analysis.goal.endDate);
    extendedDate.setDate(extendedDate.getDate() + (daysNeeded - analysis.daysRemaining));

    return {
      targetAmount: realisticAmount,
      endDate: extendedDate.toISOString(),
    };
  }

  private calculatePriority(realismRatio: number): RecommendationPriority {
    if (realismRatio >= 3) {
      return RecommendationPriority.HIGH;
    } else if (realismRatio >= 2) {
      return RecommendationPriority.MEDIUM;
    }
    return RecommendationPriority.LOW;
  }
}
