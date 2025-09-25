import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";

let isRunning = false;

const cleanExpiredNotifications = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    const notificationRepository = PgNotificationRepository.getInstance();
    const notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );

    const deleted = await notificationUtils.deleteExpiredNotifications();
    console.log(`Deleted ${deleted} expired notifications`);
  } catch (error) {
    console.error("Error cleaning expired notifications:", error);
  } finally {
    isRunning = false;
  }
};

export const startNotificationsCleanupJob = () => {
  // Ejecutar la limpieza diariamente a las 3 AM
  const scheduleCleanup = () => {
    const now = new Date();
    const scheduledHour = 3; // 3 AM
    const scheduledMinute = 0;

    let nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      scheduledHour,
      scheduledMinute,
      0
    );

    // Si ya pasó la hora programada para hoy, programar para mañana
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();

    console.log(`Scheduled notification cleanup at ${nextRun.toISOString()}`);

    setTimeout(() => {
      cleanExpiredNotifications().then(() => {
        scheduleCleanup(); // Reprogramar para el siguiente día
      });
    }, delay);
  };

  // Ejecutar una vez al inicio para limpiar notificaciones vencidas existentes
  cleanExpiredNotifications();

  // Programar el trabajo recurrente
  scheduleCleanup();
};
