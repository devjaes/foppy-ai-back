import { IGoal } from "../../domain/entities/IGoal";
import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { NotificationType } from "@/notifications/domain/entities/INotification";
import { PgGoalContributionRepository } from "@/goals/infrastucture/adapters/goal-contribution.repository";

export class GoalSuggestionService {
  private static instance: GoalSuggestionService;
  private notificationUtils: NotificationUtilsService;
  private contributionRepository: PgGoalContributionRepository;

  private constructor() {
    const notificationRepository = PgNotificationRepository.getInstance();
    this.notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );
    this.contributionRepository = PgGoalContributionRepository.getInstance();
  }

  public static getInstance(): GoalSuggestionService {
    if (!GoalSuggestionService.instance) {
      GoalSuggestionService.instance = new GoalSuggestionService();
    }
    return GoalSuggestionService.instance;
  }

  /**
   * Calcula y envía sugerencia de ahorro semanal/mensual
   */
  async suggestWeeklySaving(goal: IGoal): Promise<void> {
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((goal.endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    );

    // Si no quedan días o la meta está cumplida, no sugerir
    if (daysRemaining === 0 || goal.currentAmount >= goal.targetAmount) {
      return;
    }

    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    const amountRemaining = goal.targetAmount - goal.currentAmount;
    const weeklySavingSuggestion = amountRemaining / weeksRemaining;
    const monthlySavingSuggestion = (amountRemaining / daysRemaining) * 30;

    // Enviar notificación con la sugerencia
    await this.notificationUtils.createSuggestionNotification(
      goal.userId,
      `Ahorro recomendado para: ${goal.name}`,
      `Para alcanzar tu meta "${
        goal.name
      }" a tiempo, te sugerimos ahorrar $${weeklySavingSuggestion.toFixed(
        2
      )} por semana o $${monthlySavingSuggestion.toFixed(
        2
      )} por mes. Ajusta tus aportes según esta recomendación para cumplir tu objetivo.`,
      false // Sin correo electrónico por defecto
    );
  }

  /**
   * Detecta y notifica cuando una meta está en riesgo
   */
  async checkGoalAtRisk(goal: IGoal): Promise<void> {
    const now = new Date();
    const goalCreationDate =
      goal.createdAt || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Si no hay fecha de creación, asumimos 30 días atrás
    const endDate = new Date(goal.endDate);

    // Calcular el ahorro semanal ideal original
    const originalTotalDays = Math.ceil(
      (endDate.getTime() - goalCreationDate.getTime()) / (1000 * 3600 * 24)
    );
    const originalWeeks = Math.ceil(originalTotalDays / 7);
    const originalWeeklySaving = goal.targetAmount / originalWeeks;

    // Calcular el ahorro semanal necesario actual
    const remainingDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    );
    const remainingWeeks = Math.max(1, Math.ceil(remainingDays / 7));
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const currentWeeklySaving = remainingAmount / remainingWeeks;

    // Verificar si está en riesgo (necesita más del doble)
    if (currentWeeklySaving > originalWeeklySaving * 2) {
      await this.notificationUtils.createWarningNotification(
        goal.userId,
        `¡Meta en riesgo! ${goal.name}`,
        `Necesitas aumentar tus aportes`,
        `Tu meta "${
          goal.name
        }" está en riesgo. Inicialmente necesitabas ahorrar $${originalWeeklySaving.toFixed(
          2
        )} por semana, pero ahora necesitas $${currentWeeklySaving.toFixed(
          2
        )} por semana para alcanzarla a tiempo. Considera aumentar tus aportes o ajustar tu fecha límite.`,
        true // Enviar por correo también
      );
    }
  }

  /**
   * Detecta y notifica inactividad en aportes
   */
  async checkInactivity(goal: IGoal): Promise<void> {
    const contributions = await this.contributionRepository.findByGoalId(
      goal.id
    );

    if (contributions.length === 0) {
      // No hay aportes registrados aún
      const goalCreationDate = goal.createdAt || new Date();
      const daysSinceCreation = Math.ceil(
        (new Date().getTime() - new Date(goalCreationDate).getTime()) /
          (1000 * 3600 * 24)
      );

      if (daysSinceCreation >= 7) {
        await this.notificationUtils.createWarningNotification(
          goal.userId,
          `Sin aportes en tu meta: ${goal.name}`,
          `No has hecho aportes esta semana`,
          `No has registrado ningún aporte a tu meta "${goal.name}" desde su creación. Considera hacer tu primer aporte para comenzar a avanzar hacia tu objetivo.`,
          false
        );
      }

      return;
    }

    // Ordenar contribuciones por fecha, de más reciente a más antigua
    contributions.sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    const lastContribution = contributions[0];
    const daysSinceLastContribution = Math.ceil(
      (new Date().getTime() - new Date(lastContribution.createdAt!).getTime()) /
        (1000 * 3600 * 24)
    );

    if (daysSinceLastContribution > 7) {
      await this.notificationUtils.createWarningNotification(
        goal.userId,
        `Sin aportes recientes en tu meta: ${goal.name}`,
        `No has hecho aportes esta semana`,
        `No has registrado aportes a tu meta "${goal.name}" en ${daysSinceLastContribution} días. Considera actualizar tu plan para lograr tu meta a tiempo.`,
        false
      );
    }
  }

  /**
   * Sugiere optimización del plan de ahorro
   */
  async suggestOptimizedSaving(goal: IGoal): Promise<void> {
    const contributions = await this.contributionRepository.findByGoalId(
      goal.id
    );

    if (contributions.length < 3) {
      // No hay suficientes datos para analizar patrones
      return;
    }

    // Calcular el promedio de aportes
    const totalContributed = contributions.reduce(
      (sum, contribution) => sum + Number(contribution.amount),
      0
    );
    const averageContribution = totalContributed / contributions.length;

    // Calcular la frecuencia promedio entre aportes (en días)
    contributions.sort(
      (a, b) =>
        new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );

    let totalDaysBetween = 0;
    for (let i = 1; i < contributions.length; i++) {
      const daysBetween = Math.ceil(
        (new Date(contributions[i].createdAt!).getTime() -
          new Date(contributions[i - 1].createdAt!).getTime()) /
          (1000 * 3600 * 24)
      );
      totalDaysBetween += daysBetween;
    }

    const averageDaysBetween = totalDaysBetween / (contributions.length - 1);

    // Determinar frecuencia sugerida (semanal, quincenal, mensual)
    let suggestedFrequency: string;
    let suggestedAmount: number;

    if (averageDaysBetween <= 9) {
      // Sugerir aporte semanal
      suggestedFrequency = "semanal";
      suggestedAmount = averageContribution * (7 / averageDaysBetween);
    } else if (averageDaysBetween <= 20) {
      // Sugerir aporte quincenal
      suggestedFrequency = "quincenal";
      suggestedAmount = averageContribution * (15 / averageDaysBetween);
    } else {
      // Sugerir aporte mensual
      suggestedFrequency = "mensual";
      suggestedAmount = averageContribution * (30 / averageDaysBetween);
    }

    await this.notificationUtils.createSuggestionNotification(
      goal.userId,
      `Optimiza tu plan de ahorro para: ${goal.name}`,
      `Basado en tus hábitos de ahorro, te sugerimos hacer aportes de $${suggestedAmount.toFixed(
        2
      )} con frecuencia ${suggestedFrequency} para tu meta "${
        goal.name
      }". Este plan se adapta a tu patrón de ahorro y te ayudará a alcanzar tu objetivo de manera más efectiva.`,
      false
    );
  }
}
