import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { IBudget } from "../../domain/entities/IBudget";
import { PgCategoryRepository } from "@/categories/infrastructure/adapters/category.repository";
import { NotificationType } from "@/notifications/domain/entities/INotification";

/**
 * Service for handling budget-related notifications
 */
export class BudgetNotificationService {
  private static instance: BudgetNotificationService;
  private notificationUtils: NotificationUtilsService;
  private categoryRepository: PgCategoryRepository;

  // Cache to prevent duplicate notifications
  private notificationCache: Map<string, Date> = new Map();

  private constructor() {
    const notificationRepository = PgNotificationRepository.getInstance();
    this.notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );
    this.categoryRepository = PgCategoryRepository.getInstance();
  }

  public static getInstance(): BudgetNotificationService {
    if (!BudgetNotificationService.instance) {
      BudgetNotificationService.instance = new BudgetNotificationService();
    }
    return BudgetNotificationService.instance;
  }

  /**
   * Check budget usage percentage and send appropriate notifications
   * @param budget The budget to check
   * @param previousAmount Previous amount before update
   */
  async checkBudgetLimits(
    budget: IBudget,
    previousAmount: number
  ): Promise<void> {
    const previousPercentage = Math.floor(
      (previousAmount / budget.limitAmount) * 100
    );
    const currentPercentage = Math.floor(
      (budget.currentAmount / budget.limitAmount) * 100
    );

    // Get category name
    const category = await this.categoryRepository.findById(budget.categoryId);
    const categoryName = category ? category.name : "Categoría sin nombre";

    // Check for budget threshold notifications
    if (
      currentPercentage >= 80 &&
      previousPercentage < 80 &&
      !this.hasRecentNotification(budget.userId, "BUDGET_80", budget.id)
    ) {
      await this.notificationUtils.createWarningNotification(
        budget.userId,
        `Presupuesto al 80%: ${categoryName}`,
        `Has utilizado el ${currentPercentage}% de tu presupuesto`,
        `Has alcanzado el 80% de tu presupuesto para ${categoryName} este mes. Considera revisar tus gastos para no exceder el límite.`,
        true // Send email
      );
      this.storeNotificationSent(budget.userId, "BUDGET_80", budget.id);

      // Notify shared user if applicable
      if (budget.sharedUserId) {
        await this.notificationUtils.createWarningNotification(
          budget.sharedUserId,
          `Presupuesto compartido al 80%: ${categoryName}`,
          `Se ha utilizado el ${currentPercentage}% del presupuesto`,
          `El presupuesto compartido para ${categoryName} ha alcanzado el 80% del límite este mes. Consideren revisar los gastos para no exceder el límite.`,
          true // Send email
        );
      }
    } else if (
      currentPercentage >= 90 &&
      previousPercentage < 90 &&
      !this.hasRecentNotification(budget.userId, "BUDGET_90", budget.id)
    ) {
      await this.notificationUtils.createWarningNotification(
        budget.userId,
        `Presupuesto al 90%: ${categoryName}`,
        `Has utilizado el ${currentPercentage}% de tu presupuesto`,
        `¡Atención! Has alcanzado el 90% de tu presupuesto para ${categoryName} este mes. Te queda muy poco margen antes de exceder el límite.`,
        true // Send email
      );
      this.storeNotificationSent(budget.userId, "BUDGET_90", budget.id);

      // Notify shared user if applicable
      if (budget.sharedUserId) {
        await this.notificationUtils.createWarningNotification(
          budget.sharedUserId,
          `Presupuesto compartido al 90%: ${categoryName}`,
          `Se ha utilizado el ${currentPercentage}% del presupuesto`,
          `¡Atención! El presupuesto compartido para ${categoryName} ha alcanzado el 90% del límite este mes. Queda muy poco margen antes de exceder el límite.`,
          true // Send email
        );
      }
    } else if (
      currentPercentage >= 100 &&
      previousPercentage < 100 &&
      !this.hasRecentNotification(budget.userId, "BUDGET_100", budget.id)
    ) {
      await this.notificationUtils.createWarningNotification(
        budget.userId,
        `Presupuesto excedido: ${categoryName}`,
        `Has excedido tu presupuesto`,
        `Has excedido tu presupuesto para ${categoryName} este mes. Considera ajustar tus gastos en esta categoría o revisar el límite establecido para el próximo mes.`,
        true // Send email
      );
      this.storeNotificationSent(budget.userId, "BUDGET_100", budget.id);

      // Notify shared user if applicable
      if (budget.sharedUserId) {
        await this.notificationUtils.createWarningNotification(
          budget.sharedUserId,
          `Presupuesto compartido excedido: ${categoryName}`,
          `Se ha excedido el presupuesto`,
          `El presupuesto compartido para ${categoryName} ha sido excedido este mes. Consideren ajustar los gastos en esta categoría o revisar el límite establecido para el próximo mes.`,
          true // Send email
        );
      }
    }
  }

  /**
   * Notify about a budget being shared with a user
   * @param budget The budget being shared
   * @param sharedUserId The user ID with whom the budget is shared
   */
  async notifyBudgetShared(
    budget: IBudget,
    sharedUserId: number
  ): Promise<void> {
    // Get category name
    const category = await this.categoryRepository.findById(budget.categoryId);
    const categoryName = category ? category.name : "Categoría sin nombre";

    // Format month for display
    const month = new Date(budget.month);
    const monthName = this.getMonthName(month.getMonth());
    const year = month.getFullYear();

    // Notify the target user
    await this.notificationUtils.createNotification(
      sharedUserId,
      `Nuevo presupuesto compartido`,
      `${categoryName} - ${monthName} ${year}`,
      `Se ha compartido contigo un presupuesto para la categoría "${categoryName}" con un límite de ${budget.limitAmount} para ${monthName} de ${year}.`,
      NotificationType.SUGGESTION,
      null, // No expiration
      true // Send email
    );
  }

  /**
   * Check if a notification has been sent recently to avoid duplicates
   * @param userId User ID
   * @param type Notification type identifier
   * @param entityId ID of the related entity (budget)
   * @returns Boolean indicating if a notification was sent recently
   */
  private hasRecentNotification(
    userId: number,
    type: string,
    entityId: number
  ): boolean {
    const key = `${userId}_${type}_${entityId}`;
    const lastSent = this.notificationCache.get(key);
    if (!lastSent) return false;

    const hoursSinceLastNotification =
      (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastNotification < 24; // Don't send more than once per day
  }

  /**
   * Record that a notification has been sent
   * @param userId User ID
   * @param type Notification type identifier
   * @param entityId ID of the related entity (budget)
   */
  private storeNotificationSent(
    userId: number,
    type: string,
    entityId: number
  ): void {
    const key = `${userId}_${type}_${entityId}`;
    this.notificationCache.set(key, new Date());
  }

  /**
   * Get the name of a month in Spanish
   * @param monthIndex Month index (0-11)
   * @returns Month name in Spanish
   */
  private getMonthName(monthIndex: number): string {
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return months[monthIndex];
  }
}
