import { CronJob } from "cron";
import { PgGoalContributionRepository } from "../../../features/goals/infrastucture/adapters/goal-contribution.repository";
import { EmailService } from "../../../features/email/application/services/email.service";
import { PgUserRepository } from "../../../features/users/infrastructure/adapters/user.repository";
import { PgGoalRepository } from "../../../features/goals/infrastucture/adapters/goal.repository";
import { GoalSuggestionService } from "../../../features/goals/application/services/goal-suggestion.service";
import { NotificationUtilsService } from "../../../features/notifications/application/services/notification-utils.service";
import { PgNotificationRepository } from "../../../features/notifications/infrastructure/adapters/notification.repository";
import { NotificationType } from "../../../features/notifications/domain/entities/INotification";

// Recalculate contribution amount cron job that runs every day at 8am UTC-5
export const recalculateContributionAmountCron = new CronJob(
  // runs every 2 minutes
  "*/1 * * * *",
  async () => {
    try {
      console.log("Starting contribution amount recalculation job");

      // Inicializar servicios
      const goalSuggestionService = GoalSuggestionService.getInstance();
      const notificationUtils = NotificationUtilsService.getInstance(
        PgNotificationRepository.getInstance()
      );

      // Find goals where last contribution was more than 1 week ago
      const goalsToUpdate =
        await PgGoalRepository.getInstance().findAllWithLastContributionWithMoreThanOneWeekAgo();

      console.log(`Found ${goalsToUpdate.length} goals to update`);

      // Check all active goals for other suggestions
      const allActiveGoals =
        await PgGoalRepository.getInstance().findAllActive();
      console.log(
        `Found ${allActiveGoals.length} active goals to check for suggestions`
      );

      // Process all active goals for suggestions
      for (const goal of allActiveGoals) {
        // Check for goal at risk
        await goalSuggestionService.checkGoalAtRisk(goal);

        // Check for inactivity
        await goalSuggestionService.checkInactivity(goal);

        // Weekly saving suggestion (only for goals that haven't been updated in contribution amount)
        if (!goalsToUpdate.some((g) => g.id === goal.id)) {
          await goalSuggestionService.suggestWeeklySaving(goal);
        }

        // Optimize saving plan suggestion (run less frequently, e.g. after 5+ contributions)
        const contributions =
          await PgGoalContributionRepository.getInstance().findByGoalId(
            goal.id
          );
        if (contributions.length >= 5) {
          // Check if we've sent this suggestion recently (in the last 14 days)
          const recentSuggestions =
            await PgNotificationRepository.getInstance().findByUserIdAndType(
              goal.userId,
              NotificationType.SUGGESTION,
              new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            );

          const hasSentOptimizationRecently = recentSuggestions.some(
            (notification) =>
              notification.title.includes("Optimiza tu plan de ahorro") &&
              notification.title.includes(goal.name)
          );

          if (!hasSentOptimizationRecently) {
            await goalSuggestionService.suggestOptimizedSaving(goal);
          }
        }
      }

      // Now process the original recalculation logic
      for (const goal of goalsToUpdate) {
        // Get the latest contribution for this goal
        const latestContribution =
          await PgGoalContributionRepository.getInstance().findLatestContribution(
            goal.id
          );

        const lastContributionDate = latestContribution?.date;

        // Check if the last contribution was more than a week ago or if there's no contribution yet
        if (lastContributionDate) {
          // Recalculate the contribution amount based on remaining amount, time, and frequency
          const today = new Date();
          const daysRemaining = Math.ceil(
            (goal.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Adjust for contribution frequency (e.g., 7 for weekly, 30 for monthly)
          const contributionFrequency = goal.contributionFrequency || 7; // Default to weekly if not set
          const contributionsRemaining = Math.ceil(
            daysRemaining / contributionFrequency
          );

          if (contributionsRemaining <= 0) {
            console.log(
              `Goal ${goal.id} has no contributions remaining, skipping recalculation`
            );
            continue;
          }

          const amountRemaining =
            Number(goal.targetAmount) - Number(goal.currentAmount);
          const newContributionAmount =
            amountRemaining / contributionsRemaining;

          // Update the goal with the new contribution amount
          await PgGoalRepository.getInstance().update(goal.id, {
            contributionAmount: Number(newContributionAmount.toFixed(2)),
          });

          // Create notification using the notification utils service
          await notificationUtils.createSuggestionNotification(
            goal.userId,
            `Meta: ${goal.name} - Aporte recalculado`,
            `No has realizado aportes a tu meta "${
              goal.name
            }" en más de una semana. Tu monto de aporte sugerido ha sido recalculado a $${newContributionAmount.toFixed(
              2
            )} para que puedas alcanzar tu objetivo a tiempo. Monto restante: $${amountRemaining.toFixed(
              2
            )}.`,
            true // Send email
          );

          console.log(
            `Recalculated contribution for goal ${
              goal.id
            } to $${newContributionAmount.toFixed(2)}`
          );
        }
      }

      console.log("Contribution amount recalculation job completed");
    } catch (error) {
      console.error("Error in contribution amount recalculation job:", error);
    }
  },
  null, // onComplete
  false, // start
  "America/Bogota" // Timezone UTC-5
);

// Helper function to get user email from user ID
async function getUserEmail(userId: number): Promise<string> {
  const result = await PgUserRepository.getInstance().findById(userId);
  return result?.email || "";
}
