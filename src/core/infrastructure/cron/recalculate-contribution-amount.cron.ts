import { CronJob } from "cron";
import { PgGoalContributionRepository } from "../../../features/goals/infrastucture/adapters/goal-contribution.repository";
import { PgGoalRepository } from "../../../features/goals/infrastucture/adapters/goal.repository";
import { GoalSuggestionService } from "../../../features/goals/application/services/goal-suggestion.service";
import { NotificationUtilsService } from "../../../features/notifications/application/services/notification-utils.service";
import { PgNotificationRepository } from "../../../features/notifications/infrastructure/adapters/notification.repository";
import { NotificationType } from "../../../features/notifications/domain/entities/INotification";

let isRunning = false;

/**
 * Recalculate contribution amount for inactive goals and generate suggestions.
 * Runs once per day at 8 AM (America/Bogota).
 */
export const recalculateContributionAmountCron = new CronJob(
  "0 8 * * *",
  async () => {
    if (isRunning) {
      return;
    }

    try {
      isRunning = true;
      console.log("Starting contribution amount recalculation job");

      const goalSuggestionService = GoalSuggestionService.getInstance();
      const notificationRepository = PgNotificationRepository.getInstance();
      const notificationUtils = NotificationUtilsService.getInstance(
        notificationRepository
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
        await goalSuggestionService.checkGoalAtRisk(goal);
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
            await notificationRepository.findByUserIdAndType(
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

      // Process recalculation logic and notifications for inactive goals
      for (const goal of goalsToUpdate) {
        const latestContribution =
          await PgGoalContributionRepository.getInstance().findLatestContribution(
            goal.id
          );

        const lastContributionDate = latestContribution?.date;

        if (!lastContributionDate) {
          continue;
        }

        // Recalculate the contribution amount based on remaining amount, time, and frequency
        const today = new Date();
        const daysRemaining = Math.ceil(
          (goal.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

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
        const newContributionAmount = amountRemaining / contributionsRemaining;

        // Update the goal with the new contribution amount
        await PgGoalRepository.getInstance().update(goal.id, {
          contributionAmount: Number(newContributionAmount.toFixed(2)),
        });

        // Avoid sending duplicate recalculation suggestions too frequently
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentRecalculationSuggestions =
          await notificationRepository.findByUserIdAndType(
            goal.userId,
            NotificationType.SUGGESTION,
            oneDayAgo
          );

        const hasRecentRecalculationSuggestion =
          recentRecalculationSuggestions.some(
            (notification) =>
              notification.title.includes("Meta:") &&
              notification.title.includes(goal.name) &&
              notification.title.includes("Aporte recalculado")
          );

        if (hasRecentRecalculationSuggestion) {
          console.log(
            `Skipping recalculation notification for goal ${goal.id} (already sent recently)`
          );
          continue;
        }

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
          true
        );

        console.log(
          `Recalculated contribution for goal ${
            goal.id
          } to $${newContributionAmount.toFixed(2)}`
        );
      }

      console.log("Contribution amount recalculation job completed");
    } catch (error) {
      console.error("Error in contribution amount recalculation job:", error);
    } finally {
      isRunning = false;
    }
  },
  null,
  false,
  "America/Bogota"
);
