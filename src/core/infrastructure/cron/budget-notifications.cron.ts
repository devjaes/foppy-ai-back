import { CronJob } from 'cron';
import { PgBudgetRepository } from '@/budgets/infrastructure/adapters/budget.repository';
import { PgCategoryRepository } from '@/categories/infrastructure/adapters/category.repository';
import { PgNotificationRepository } from '@/notifications/infrastructure/adapters/notification.repository';
import { NotificationUtilsService } from '@/notifications/application/services/notification-utils.service';
import { NotificationType } from '@/notifications/domain/entities/INotification';

let isRunning = false;

// Cache to track sent notifications and prevent duplicates
const sentNotificationsCache = new Map<string, Date>();

/**
 * Check if a notification was sent recently to prevent duplicates
 * @param cacheKey Unique key for the notification
 * @returns True if notification was sent recently
 */
function hasRecentNotification(cacheKey: string): boolean {
  const lastSent = sentNotificationsCache.get(cacheKey);
  if (!lastSent) return false;

  const hoursSinceLastNotification = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastNotification < 24; // Don't send more than once per day
}

/**
 * Record that a notification was sent
 * @param cacheKey Unique key for the notification
 */
function recordNotificationSent(cacheKey: string): void {
  sentNotificationsCache.set(cacheKey, new Date());
}

/**
 * Get the name of a month in Spanish
 * @param monthIndex Month index (0-11)
 * @returns Month name in Spanish
 */
function getMonthName(monthIndex: number): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return months[monthIndex];
}

/**
 * Check budgets for monthly summary and generate notifications
 */
const generateBudgetSummaries = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    console.log('Generating monthly budget summaries...');

    const budgetRepository = PgBudgetRepository.getInstance();
    const categoryRepository = PgCategoryRepository.getInstance();
    const notificationRepository = PgNotificationRepository.getInstance();
    const notificationUtils = NotificationUtilsService.getInstance(notificationRepository);

    // Get all active budgets for the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const budgets = await budgetRepository.findByDateRange(firstDayOfMonth, lastDayOfMonth);
    
    // Group budgets by user
    const userBudgets = new Map();
    for (const budget of budgets) {
      if (!userBudgets.has(budget.userId)) {
        userBudgets.set(budget.userId, []);
      }
      userBudgets.get(budget.userId).push(budget);
    }
    
    let notificationsCreated = 0;
    
    // Generate summary notifications for each user
    for (const [userId, userBudgetList] of userBudgets.entries()) {
      // Check if notification was already sent for this user and month
      const monthKey = `${userId}_${now.getFullYear()}_${now.getMonth()}`;
      const cacheKey = `BUDGET_SUMMARY_${monthKey}`;
      
      // Check in-memory cache first
      if (hasRecentNotification(cacheKey)) {
        console.log(`Skipping budget summary for user ${userId} - already sent this month (cache)`);
        continue;
      }
      
      // Check in database for existing notifications in the last 25 days
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const existingNotifications = await notificationRepository.findRecentByUserTypeAndTitle(
        userId,
        NotificationType.SUGGESTION,
        `Resumen mensual de presupuestos: ${getMonthName(now.getMonth())}`,
        startOfMonth
      );
      
      if (existingNotifications.length > 0) {
        console.log(`Skipping budget summary for user ${userId} - already sent this month (database)`);
        recordNotificationSent(cacheKey);
        continue;
      }
      
      const overBudgetItems = [];
      const nearLimitItems = [];
      const underBudgetItems = [];
      
      for (const budget of userBudgetList) {
        const category = await categoryRepository.findById(budget.categoryId);
        const categoryName = category ? category.name : 'Categoría desconocida';
        const percentUsed = Math.round((budget.currentAmount / budget.limitAmount) * 100);
        
        const budgetItem = {
          category: categoryName,
          limit: budget.limitAmount,
          current: budget.currentAmount,
          percentage: percentUsed
        };
        
        if (percentUsed >= 100) {
          overBudgetItems.push(budgetItem);
        } else if (percentUsed >= 80) {
          nearLimitItems.push(budgetItem);
        } else {
          underBudgetItems.push(budgetItem);
        }
      }
      
      // Create the summary message
      let message = `Resumen de presupuestos del mes de ${getMonthName(now.getMonth())}:\n\n`;
      
      if (overBudgetItems.length > 0) {
        message += `🔴 Presupuestos excedidos:\n`;
        overBudgetItems.forEach(item => {
          message += `- ${item.category}: ${item.current} de ${item.limit} (${item.percentage}%)\n`;
        });
        message += '\n';
      }
      
      if (nearLimitItems.length > 0) {
        message += `🟠 Presupuestos cerca del límite:\n`;
        nearLimitItems.forEach(item => {
          message += `- ${item.category}: ${item.current} de ${item.limit} (${item.percentage}%)\n`;
        });
        message += '\n';
      }
      
      if (underBudgetItems.length > 0) {
        message += `🟢 Presupuestos en buen estado:\n`;
        underBudgetItems.forEach(item => {
          message += `- ${item.category}: ${item.current} de ${item.limit} (${item.percentage}%)\n`;
        });
      }
      
      // Add recommendations
      message += '\nRecomendaciones:';
      if (overBudgetItems.length > 0) {
        message += '\n- Ajusta tus gastos en las categorías excedidas para el próximo mes.';
      }
      if (nearLimitItems.length > 0) {
        message += '\n- Controla tus gastos en las categorías cerca del límite.';
      }
      if (underBudgetItems.some(item => item.percentage < 50)) {
        message += '\n- Considera redistribuir el presupuesto para categorías con bajo uso.';
      }
      
      // Generate the notification
      await notificationUtils.createSuggestionNotification(
        userId,
        `Resumen mensual de presupuestos: ${getMonthName(now.getMonth())}`,
        message,
        true // Send email
      );
      
      // Record that notification was sent
      recordNotificationSent(cacheKey);
      notificationsCreated++;
    }
    
    console.log(`Created ${notificationsCreated} budget summary notifications`);
  } catch (error) {
    console.error('Error generating budget summaries:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Cron job for monthly budget summaries
 * Runs on the 28th of each month at 6 PM
 * (Using 28th instead of last day to avoid date calculation issues)
 */
const budgetSummaryJob = new CronJob(
  '0 18 28 * *', // At 6:00 PM on day 28 of every month
  async () => {
    await generateBudgetSummaries();
  },
  null,
  false,
  'America/New_York'
);

/**
 * Start the budget summary notifications job
 */
export const startBudgetSummaryJob = () => {
  budgetSummaryJob.start();
  console.log('Budget summary job started (runs at 6 PM on the 28th of each month)');
};

/**
 * Stop the budget summary notifications job
 */
export const stopBudgetSummaryJob = () => {
  budgetSummaryJob.stop();
  console.log('Budget summary job stopped');
};
