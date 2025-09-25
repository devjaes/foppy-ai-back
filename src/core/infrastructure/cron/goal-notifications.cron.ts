import { PgGoalRepository } from "@/goals/infrastucture/adapters/goal.repository";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";

let isRunning = false;

/**
 * Check financial goals and generate notifications
 */
const checkGoalsForNotifications = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    console.log("Running goal notifications check...");

    const goalRepository = PgGoalRepository.getInstance();
    const notificationRepository = PgNotificationRepository.getInstance();
    const notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );

    const now = new Date();
    // Get all active goals
    const goals = await goalRepository.findAll();

    let notificationsCreated = 0;

    for (const goal of goals) {
      // Calculate days until goal end date
      const daysUntilEnd = Math.ceil(
        (goal.endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      );

      // Calculate progress percentage
      const progressPercentage = Math.round(
        (goal.currentAmount / goal.targetAmount) * 100
      );

      // Check for approaching deadlines with insufficient progress
      if (
        (daysUntilEnd === 30 || daysUntilEnd === 14 || daysUntilEnd === 7) &&
        progressPercentage < 90
      ) {
        const expectedProgress =
          100 - (daysUntilEnd / getDaysBetween(goal.endDate, new Date())) * 100;

        if (progressPercentage < expectedProgress * 0.7) {
          // Progress is significantly behind
          await notificationUtils.createWarningNotification(
            goal.userId,
            `Meta atrasada: ${goal.name}`,
            `Progreso: ${progressPercentage}%, faltan ${daysUntilEnd} días`,
            `Tu meta "${goal.name}" está atrasada. Has completado solo el ${progressPercentage}% ` +
              `y quedan ${daysUntilEnd} días para la fecha límite. Para alcanzar tu objetivo, ` +
              `necesitas aumentar tus contribuciones. Considera hacer aportes adicionales para ponerte al día.`,
            true
          );
          notificationsCreated++;
        } else if (progressPercentage < expectedProgress) {
          // Progress is slightly behind
          await notificationUtils.createGoalNotification(
            goal.userId,
            goal.name,
            progressPercentage,
            `Tu meta "${goal.name}" está avanzando, pero un poco por debajo de lo esperado. ` +
              `Has completado el ${progressPercentage}% y quedan ${daysUntilEnd} días para la fecha límite. ` +
              `Mantén la constancia en tus aportes para alcanzar tu objetivo a tiempo.`,
            true
          );
          notificationsCreated++;
        }
      }

      // Check for approaching end date with good progress
      if (
        daysUntilEnd <= 7 &&
        progressPercentage >= 90 &&
        progressPercentage < 100
      ) {
        await notificationUtils.createGoalNotification(
          goal.userId,
          goal.name,
          progressPercentage,
          `¡Estás muy cerca de alcanzar tu meta "${goal.name}"! Has completado el ${progressPercentage}% ` +
            `y solo quedan ${daysUntilEnd} días. Un pequeño esfuerzo más y lo lograrás.`,
          true
        );
        notificationsCreated++;
      }

      // Goal expired without completion
      if (daysUntilEnd < 0 && progressPercentage < 100) {
        const daysOverdue = Math.abs(daysUntilEnd);
        if (daysOverdue === 1) {
          // Only notify on the first day after expiration
          await notificationUtils.createWarningNotification(
            goal.userId,
            `Meta vencida: ${goal.name}`,
            `Progreso alcanzado: ${progressPercentage}%`,
            `La fecha límite para tu meta "${goal.name}" ha pasado y has alcanzado el ${progressPercentage}%. ` +
              `Puedes considerar extender la fecha límite o ajustar el monto objetivo para adaptarlo a tu situación actual.`,
            true
          );
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} goal notifications`);
  } catch (error) {
    console.error("Error checking goals for notifications:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the goal notifications job
 */
export const startGoalNotificationsJob = () => {
  // Run daily at 10 AM
  const scheduleCheck = () => {
    const now = new Date();
    const scheduledHour = 10;
    const scheduledMinute = 0;

    let nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      scheduledHour,
      scheduledMinute,
      0
    );

    // If scheduled time already passed today, schedule for tomorrow
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `Scheduled goal notifications check at ${nextRun.toISOString()}`
    );

    setTimeout(() => {
      checkGoalsForNotifications().then(() => {
        scheduleCheck(); // Reschedule for the next day
      });
    }, delay);
  };

  // Run once immediately at startup
  checkGoalsForNotifications();

  // Schedule recurring checks
  scheduleCheck();
};

/**
 * Calculate number of days between two dates
 * @param endDate The end date
 * @param startDate The start date
 * @returns Number of days between dates
 */
function getDaysBetween(endDate: Date, startDate: Date): number {
  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
  );
}
