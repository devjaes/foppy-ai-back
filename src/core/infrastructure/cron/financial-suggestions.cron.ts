import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { PgCategoryRepository } from "@/categories/infrastructure/adapters/category.repository";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";
import { PgNotificationRepository } from "@/notifications/infrastructure/adapters/notification.repository";
import { NotificationUtilsService } from "@/notifications/application/services/notification-utils.service";

let isRunning = false;

/**
 * Generate financial suggestions based on transaction patterns
 */
const generateFinancialSuggestions = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    console.log("Generating financial suggestions...");

    const transactionRepository = PgTransactionRepository.getInstance();
    const categoryRepository = PgCategoryRepository.getInstance();
    const userRepository = PgUserRepository.getInstance();
    const notificationRepository = PgNotificationRepository.getInstance();
    const notificationUtils = NotificationUtilsService.getInstance(
      notificationRepository
    );

    // Get active users
    const users = await userRepository.findAllActive();
    let notificationsCreated = 0;

    for (const user of users) {
      // Get user's transactions for the past month
      const today = new Date();
      const lastMonthDate = new Date(today);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      const transactions = await transactionRepository.findByUserIdAndDateRange(
        user.id,
        lastMonthDate,
        today
      );

      // Skip if not enough transactions for meaningful analysis
      if (transactions.length < 5) continue;

      // Group transactions by category
      const categoryMap = new Map();
      let totalExpenses = 0;
      let highestCategory = { id: 0, amount: 0, name: "" };

      for (const transaction of transactions) {
        // Skip income transactions
        if (transaction.type === "INCOME") continue;

        // Only consider expenses
        if (transaction.type === "EXPENSE") {
          totalExpenses += Number(transaction.amount);

          if (!categoryMap.has(transaction.categoryId)) {
            const category = await categoryRepository.findById(
              transaction.categoryId!
            );
            categoryMap.set(transaction.categoryId, {
              amount: 0,
              name: category ? category.name : "Sin categoría",
            });
          }

          const categoryData = categoryMap.get(transaction.categoryId);
          categoryData.amount += Number(transaction.amount);
          categoryMap.set(transaction.categoryId, categoryData);

          // Track highest spending category
          if (categoryData.amount > highestCategory.amount) {
            highestCategory = {
              id: transaction.categoryId!,
              amount: categoryData.amount,
              name: categoryData.name,
            };
          }
        }
      }

      // Generate suggestions based on analysis
      const suggestions = [];

      // Check for high spending in a single category
      if (highestCategory.id && highestCategory.amount > totalExpenses * 0.4) {
        suggestions.push({
          title: `Alto gasto en ${highestCategory.name}`,
          message:
            `Has gastado ${highestCategory.amount} en ${highestCategory.name} este mes, ` +
            `lo que representa más del 40% de tus gastos totales. Considera reducir tus gastos en esta categoría.`,
        });
      }

      // Check for transaction patterns
      const dayMap = new Map();
      transactions.forEach((tx) => {
        const day = tx.date.getDay();
        if (!dayMap.has(day)) dayMap.set(day, 0);
        dayMap.set(day, dayMap.get(day) + 1);
      });

      // Find days with highest transaction frequency
      let highestDay = { day: 0, count: 0 };
      dayMap.forEach((count, day) => {
        if (count > highestDay.count) {
          highestDay = { day, count };
        }
      });

      if (highestDay.count > transactions.length * 0.3) {
        const dayNames = [
          "domingo",
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
        ];
        suggestions.push({
          title: `Patrón de gastos detectado`,
          message:
            `Realizas la mayoría de tus transacciones los días ${
              dayNames[highestDay.day]
            }. ` +
            `Considerar planificar mejor tus gastos y distribuirlos a lo largo de la semana puede ayudarte a tener mejor control financiero.`,
        });
      }

      // Send notifications for each suggestion
      for (const suggestion of suggestions) {
        await notificationUtils.createSuggestionNotification(
          user.id,
          suggestion.title,
          suggestion.message,
          true // Send email
        );
        notificationsCreated++;
      }
    }

    console.log(
      `Created ${notificationsCreated} financial suggestion notifications`
    );
  } catch (error) {
    console.error("Error generating financial suggestions:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the financial suggestions job
 */
export const startFinancialSuggestionsJob = () => {
  // Run weekly on Sunday at 5 PM
  const scheduleCheck = () => {
    const now = new Date();
    const targetDay = 0; // Sunday
    const targetHour = 17; // 5 PM
    const targetMinute = 0;

    let daysToAdd = (targetDay - now.getDay() + 7) % 7;
    if (
      daysToAdd === 0 &&
      (now.getHours() > targetHour ||
        (now.getHours() === targetHour && now.getMinutes() >= targetMinute))
    ) {
      daysToAdd = 7; // If it's already past the time today, schedule for next week
    }

    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysToAdd,
      targetHour,
      targetMinute,
      0
    );

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `Scheduled financial suggestions check at ${nextRun.toISOString()}`
    );

    setTimeout(() => {
      generateFinancialSuggestions().then(() => {
        scheduleCheck(); // Reschedule for the next week
      });
    }, delay);
  };

  // Schedule recurring checks
  scheduleCheck();
};
