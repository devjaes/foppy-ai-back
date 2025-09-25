import { PgDebtRepository } from '@/debts/infrastructure/adapters/debt.repository';
import { PgNotificationRepository } from '@/notifications/infrastructure/adapters/notification.repository';
import { NotificationUtilsService } from '@/notifications/application/services/notification-utils.service';

let isRunning = false;

/**
 * Check debts and generate notifications for due dates approaching
 */
const checkDebtsForNotifications = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    console.log('Running debt notifications check...');

    const debtRepository = PgDebtRepository.getInstance();
    const notificationRepository = PgNotificationRepository.getInstance();
    const notificationUtils = NotificationUtilsService.getInstance(notificationRepository);

    const now = new Date();
    // Get all unpaid debts
    const pendingDebts = await debtRepository.findByStatus(false);

    let notificationsCreated = 0;

    for (const debt of pendingDebts) {
      const daysUntilDue = Math.ceil(
        (debt.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      );

      // Notifications for approaching due dates (7 days, 3 days, 1 day before)
      if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1) {
        await notificationUtils.createDebtNotification(
          debt.userId,
          debt.description,
          debt.dueDate,
          `Tu deuda "${debt.description}" por ${debt.pendingAmount} vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}. Recuerda realizar el pago a tiempo.`
        );
        notificationsCreated++;
      }

      // Notifications for overdue debts (every 7 days)
      if (daysUntilDue < 0 && Math.abs(daysUntilDue) % 7 === 0) {
        const daysOverdue = Math.abs(daysUntilDue);
        await notificationUtils.createWarningNotification(
          debt.userId,
          `Deuda vencida: ${debt.description}`,
          `Vencida hace ${daysOverdue} días`,
          `Tu deuda "${debt.description}" por ${debt.pendingAmount} está vencida hace ${daysOverdue} días. Por favor, realiza el pago lo antes posible para evitar posibles recargos.`
        );
        notificationsCreated++;
      }
    }

    console.log(`Created ${notificationsCreated} debt notifications`);
  } catch (error) {
    console.error('Error checking debts for notifications:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the debt notifications job
 */
export const startDebtNotificationsJob = () => {
  // Run daily at 9 AM
  const scheduleCheck = () => {
    const now = new Date();
    const scheduledHour = 9;
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
    console.log(`Scheduled debt notifications check at ${nextRun.toISOString()}`);

    setTimeout(() => {
      checkDebtsForNotifications().then(() => {
        scheduleCheck(); // Reschedule for the next day
      });
    }, delay);
  };

  // Run once immediately at startup
  checkDebtsForNotifications();

  // Schedule recurring checks
  scheduleCheck();
};
