import { PgBudgetRepository } from '@/budgets/infrastructure/adapters/budget.repository';
import { PgCategoryRepository } from '@/categories/infrastructure/adapters/category.repository';
import { PgNotificationRepository } from '@/notifications/infrastructure/adapters/notification.repository';
import { NotificationUtilsService } from '@/notifications/application/services/notification-utils.service';

let isRunning = false;

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
 * Start the budget summary notifications job
 */
export const startBudgetSummaryJob = () => {
  // Run on the last day of each month at 6 PM
  const scheduleCheck = () => {
    const now = new Date();
    
    // Last day of current month
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(18, 0, 0, 0); // 6 PM
    
    // If it's already past 6 PM on the last day, schedule for next month
    if (now > lastDayOfMonth) {
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    }
    
    const delay = lastDayOfMonth.getTime() - now.getTime();
    console.log(`Scheduled budget summary notifications for ${lastDayOfMonth.toISOString()}`);
    
    setTimeout(() => {
      generateBudgetSummaries().then(() => {
        scheduleCheck(); // Reschedule for the next month
      });
    }, delay);
  };
  
  // Schedule recurring checks
  scheduleCheck();
};

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
