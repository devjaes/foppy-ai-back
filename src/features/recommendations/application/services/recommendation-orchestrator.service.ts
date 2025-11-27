import { IRecommendationOrchestrator } from "../../domain/ports/orchestrator.service.interface";
import { IRecommendationRepository } from "../../domain/ports/recommendation.repository.interface";
import { IAnalysisService } from "../../domain/ports/analysis.service.interface";
import { Recommendation } from "../../domain/entities/recommendation.entity";
import { RecommendationType } from "../../domain/entities/recommendation.types";
import { SpendingAnalysisService } from "./spending-analysis.service";
import { GoalOptimizationService } from "./goal-optimization.service";
import { BudgetSuggestionService } from "./budget-suggestion.service";
import { DebtReminderService } from "./debt-reminder.service";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { NotificationType } from "@/notifications/domain/entities/INotification";
import { db } from "@/db";
import { users } from "@/schema";
import { eq, and, gte } from "drizzle-orm";

export class RecommendationOrchestratorService
  implements IRecommendationOrchestrator
{
  private static instance: RecommendationOrchestratorService;
  private services: Map<RecommendationType, IAnalysisService>;
  private notificationRepository: PgNotificationRepository;

  private constructor(
    private readonly recommendationRepository: IRecommendationRepository
  ) {
    this.services = new Map<RecommendationType, IAnalysisService>([
      [
        RecommendationType.SPENDING_ANALYSIS,
        SpendingAnalysisService.getInstance(),
      ],
      [
        RecommendationType.GOAL_OPTIMIZATION,
        GoalOptimizationService.getInstance(),
      ],
      [
        RecommendationType.BUDGET_SUGGESTION,
        BudgetSuggestionService.getInstance(),
      ],
      [RecommendationType.DEBT_REMINDER, DebtReminderService.getInstance()],
    ]);

    this.notificationRepository = PgNotificationRepository.getInstance();
  }

  public static getInstance(
    recommendationRepository: IRecommendationRepository
  ): RecommendationOrchestratorService {
    if (!RecommendationOrchestratorService.instance) {
      RecommendationOrchestratorService.instance =
        new RecommendationOrchestratorService(recommendationRepository);
    }
    return RecommendationOrchestratorService.instance;
  }

  async generateDailyRecommendation(
    userId: number
  ): Promise<Recommendation | null> {
    try {
      const isEnabled = await this.checkUserRecommendationsEnabled(userId);
      if (!isEnabled) {
        console.log(
          `User ${userId} does not have recommendations enabled. Skipping.`
        );
        return null;
      }

      const hasRecentRecommendation = await this.checkRecentRecommendation(
        userId
      );
      if (hasRecentRecommendation) {
        console.log(
          `User ${userId} already has a pending recommendation from today. Skipping.`
        );
        return null;
      }

      const randomType = this.selectRandomType();
      console.log(
        `Selected recommendation type for user ${userId}: ${randomType}`
      );

      const service = this.services.get(randomType);
      if (!service) {
        console.error(`No service found for type: ${randomType}`);
        return null;
      }

      const analysisResult = await service.analyze(userId);
      if (!analysisResult || !analysisResult.shouldGenerate) {
        console.log(
          `No recommendation generated for user ${userId} with type ${randomType}`
        );
        return null;
      }

      const recommendation = await this.recommendationRepository.create({
        userId,
        type: randomType,
        priority: analysisResult.priority,
        title: analysisResult.title,
        description: analysisResult.description,
        data: analysisResult.data,
        actionable:
          !!analysisResult.actions && analysisResult.actions.length > 0,
        actions: analysisResult.actions,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      await this.createNotification(recommendation);

      console.log(
        `Successfully created recommendation ${recommendation.id} for user ${userId}`
      );

      return recommendation;
    } catch (error) {
      console.error(
        `Error generating daily recommendation for user ${userId}:`,
        error
      );
      return null;
    }
  }

  private async checkUserRecommendationsEnabled(
    userId: number
  ): Promise<boolean> {
    try {
      const [user] = await db
        .select({ recommendationsEnabled: users.recommendations_enabled })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user?.recommendationsEnabled || false;
    } catch (error) {
      console.error(
        `Error checking recommendations_enabled for user ${userId}:`,
        error
      );
      return false;
    }
  }

  private async checkRecentRecommendation(userId: number): Promise<boolean> {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const pendingRecommendations =
        await this.recommendationRepository.findPendingByUserId(userId);

      const hasRecentRecommendation = pendingRecommendations.some(
        (rec) => rec.createdAt >= todayStart
      );

      return hasRecentRecommendation;
    } catch (error) {
      console.error(
        `Error checking recent recommendations for user ${userId}:`,
        error
      );
      return false;
    }
  }

  private selectRandomType(): RecommendationType {
    const types = Object.values(RecommendationType);
    const randomIndex = Math.floor(Math.random() * types.length);
    return types[randomIndex];
  }

  private async createNotification(
    recommendation: Recommendation
  ): Promise<void> {
    try {
      await this.notificationRepository.create({
        userId: recommendation.userId,
        title: recommendation.title,
        subtitle: this.getTypeLabel(recommendation.type),
        message: recommendation.description,
        type: NotificationType.SUGGESTION,
        expiresAt: recommendation.expiresAt || undefined,
      });
    } catch (error) {
      console.error(
        `Error creating notification for recommendation ${recommendation.id}:`,
        error
      );
    }
  }

  private getTypeLabel(type: RecommendationType): string {
    const labels: Record<RecommendationType, string> = {
      [RecommendationType.SPENDING_ANALYSIS]: "Análisis de Gastos",
      [RecommendationType.GOAL_OPTIMIZATION]: "Optimización de Metas",
      [RecommendationType.BUDGET_SUGGESTION]: "Sugerencia de Presupuesto",
      [RecommendationType.DEBT_REMINDER]: "Recordatorio de Deuda",
    };

    return labels[type];
  }
}
