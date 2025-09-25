import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { IGoal } from "../../domain/entities/IGoal";
import { NotificationType } from "@/notifications/domain/entities/INotification";

/**
 * Service for handling goal-related notifications
 */
export class GoalNotificationService {
  private static instance: GoalNotificationService;
  private notificationUtils: NotificationUtilsService;

  private constructor() {
    const notificationRepository = PgNotificationRepository.getInstance();
    this.notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );
  }

  public static getInstance(): GoalNotificationService {
    if (!GoalNotificationService.instance) {
      GoalNotificationService.instance = new GoalNotificationService();
    }
    return GoalNotificationService.instance;
  }

  /**
   * Check progress and send appropriate notifications
   * @param goal The goal to check
   * @param previousAmount Previous amount before update
   */
  async checkProgressMilestones(
    goal: IGoal,
    previousAmount: number
  ): Promise<void> {
    // Calculate previous and new progress percentages
    const previousProgress = Math.floor(
      (previousAmount / goal.targetAmount) * 100
    );

    const newProgress = Math.floor(
      (goal.currentAmount / goal.targetAmount) * 100
    );

    // If no significant progress change, do nothing
    if (Math.floor(previousProgress / 5) === Math.floor(newProgress / 5)) {
      return;
    }


    // Check for milestone notifications
    if (newProgress >= 25 && previousProgress < 25) {
      await this.notificationUtils.createGoalNotification(
        goal.userId,
        goal.name,
        25,
        `¡Has alcanzado el 25% de tu meta ${goal.name}! Continúa así para lograr tu objetivo.`
      );
    } else if (newProgress >= 50 && previousProgress < 50) {
      console.warn(
        `¡Felicidades! Has alcanzado el 50% de tu meta ${goal.name}.`
      );
      await this.notificationUtils.createGoalNotification(
        goal.userId,
        goal.name,
        50,
        `¡Felicidades! Has alcanzado el 50% de tu meta ${goal.name}. Vas por buen camino.`
      );
    } else if (newProgress >= 75 && previousProgress < 75) {
      await this.notificationUtils.createGoalNotification(
        goal.userId,
        goal.name,
        75,
        `¡Excelente progreso! Has alcanzado el 75% de tu meta ${goal.name}. ¡Ya casi lo logras!`
      );
    } else if (newProgress >= 100 && previousProgress < 100) {
      await this.notificationUtils.createCongratulationNotification(
        goal.userId,
        `Meta completada: ${goal.name}`,
        `¡Felicidades! Has alcanzado tu meta de ahorro ${goal.name} por completo. ¡Objetivo cumplido!`
      );
    }

    // If the goal is shared, send notifications to the shared user as well
    if (goal.sharedUserId) {
      if (newProgress >= 25 && previousProgress < 25) {
        await this.notificationUtils.createGoalNotification(
          goal.sharedUserId,
          goal.name,
          25,
          `Meta compartida: Se ha alcanzado el 25% de la meta ${goal.name}.`
        );
      } else if (newProgress >= 50 && previousProgress < 50) {
        await this.notificationUtils.createGoalNotification(
          goal.sharedUserId,
          goal.name,
          50,
          `Meta compartida: Se ha alcanzado el 50% de la meta ${goal.name}.`
        );
      } else if (newProgress >= 75 && previousProgress < 75) {
        await this.notificationUtils.createGoalNotification(
          goal.sharedUserId,
          goal.name,
          75,
          `Meta compartida: Se ha alcanzado el 75% de la meta ${goal.name}.`
        );
      } else if (newProgress >= 100 && previousProgress < 100) {
        await this.notificationUtils.createCongratulationNotification(
          goal.sharedUserId,
          `Meta compartida completada: ${goal.name}`,
          `¡Meta compartida completada! La meta de ahorro ${goal.name} ha sido alcanzada en su totalidad.`
        );
      }
    }
  }

  /**
   * Notify about a goal being shared with a user
   * @param goal The goal being shared
   * @param sharedUserId The user ID with whom the goal is shared
   */
  async notifyGoalShared(goal: IGoal, sharedUserId: number): Promise<void> {
    // Notify the target user
    await this.notificationUtils.createNotification(
      sharedUserId,
      `Nueva meta compartida`,
      `${goal.name}`,
      `Se ha compartido contigo la meta de ahorro "${goal.name}" con un objetivo de ${goal.targetAmount}. Ahora puedes contribuir y seguir el progreso de esta meta.`,
      NotificationType.GOAL,
      null, // No expiration
      true // Send email
    );
  }

  /**
   * Notify about approaching goal deadline
   * @param goal The goal to check
   */
  async checkDeadlineApproaching(goal: IGoal): Promise<void> {
    const now = new Date();
    const daysUntilEnd = Math.ceil(
      (goal.endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );

    // Only notify at specific intervals (30, 14, 7 days before)
    if (![30, 14, 7].includes(daysUntilEnd)) {
      return;
    }

    const progressPercentage = Math.floor(
      (goal.currentAmount / goal.targetAmount) * 100
    );
    const remaining = goal.targetAmount - goal.currentAmount;

    // If progress is less than 70%, send a more urgent reminder
    if (progressPercentage < 70) {
      await this.notificationUtils.createWarningNotification(
        goal.userId,
        `Meta: ${goal.name} - Fecha límite aproximándose`,
        `Faltan ${daysUntilEnd} días, progreso: ${progressPercentage}%`,
        `Tu meta "${goal.name}" tiene fecha límite en ${daysUntilEnd} días y has alcanzado solo el ${progressPercentage}%. ` +
          `Te faltan ${remaining} para completar tu objetivo. Considera aumentar tus contribuciones para alcanzar la meta a tiempo.`,
        true // Send email
      );

      // Notify shared user if applicable
      if (goal.sharedUserId) {
        await this.notificationUtils.createWarningNotification(
          goal.sharedUserId,
          `Meta compartida: ${goal.name} - Fecha límite aproximándose`,
          `Faltan ${daysUntilEnd} días, progreso: ${progressPercentage}%`,
          `La meta compartida "${goal.name}" tiene fecha límite en ${daysUntilEnd} días y ha alcanzado solo el ${progressPercentage}%. ` +
            `Faltan ${remaining} para completar el objetivo. Consideren aumentar las contribuciones para alcanzar la meta a tiempo.`,
          true // Send email
        );
      }
    }
    // If progress is good but deadline is approaching
    else {
      await this.notificationUtils.createGoalNotification(
        goal.userId,
        goal.name,
        progressPercentage,
        `Tu meta "${goal.name}" tiene fecha límite en ${daysUntilEnd} días y has alcanzado el ${progressPercentage}%. ` +
          `Te faltan ${remaining} para completar tu objetivo. ¡Continúa con el buen progreso!`
      );

      // Notify shared user if applicable
      if (goal.sharedUserId) {
        await this.notificationUtils.createGoalNotification(
          goal.sharedUserId,
          goal.name,
          progressPercentage,
          `La meta compartida "${goal.name}" tiene fecha límite en ${daysUntilEnd} días y ha alcanzado el ${progressPercentage}%. ` +
            `Faltan ${remaining} para completar el objetivo. ¡Continúen con el buen progreso!`
        );
      }
    }
  }
}
