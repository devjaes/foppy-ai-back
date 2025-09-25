import { CronJob } from "cron";
import { PgGoalRepository } from "../../../features/goals/infrastucture/adapters/goal.repository";
import { GoalSuggestionService } from "../../../features/goals/application/services/goal-suggestion.service";

let isRunning = false;

/**
 * Generate goal suggestions weekly
 */
const generateGoalSuggestions = async () => {
  if (isRunning) return;

  try {
    isRunning = true;
    console.log("Running weekly goal suggestions...");

    const goalRepository = PgGoalRepository.getInstance();
    const goalSuggestionService = GoalSuggestionService.getInstance();

    // Get all active goals
    const goals = await goalRepository.findAllActive();
    console.log(`Found ${goals.length} active goals to check for suggestions`);

    for (const goal of goals) {
      // Generate weekly saving suggestion for all active goals
      await goalSuggestionService.suggestWeeklySaving(goal);
      
      // Check for optimized saving patterns for goals with multiple contributions
      await goalSuggestionService.suggestOptimizedSaving(goal);
    }

    console.log("Weekly goal suggestions completed");
  } catch (error) {
    console.error("Error generating goal suggestions:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the goal suggestions job
 */
export const startGoalSuggestionsJob = () => {
  // Run weekly on Monday at 9 AM
  const scheduleCheck = () => {
    const now = new Date();
    const targetDay = 1; // Monday
    const targetHour = 9; // 9 AM
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
      `Scheduled goal suggestions for ${nextRun.toISOString()}`
    );

    setTimeout(() => {
      generateGoalSuggestions().then(() => {
        scheduleCheck(); // Reschedule for the next week
      });
    }, delay);
  };

  // Schedule recurring checks
  scheduleCheck();
};