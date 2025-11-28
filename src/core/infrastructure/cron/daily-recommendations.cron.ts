import cron from "cron";
import { db } from "@/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import { RecommendationOrchestratorService } from "@/features/recommendations/application/services/recommendation-orchestrator.service";
import { PgRecommendationRepository } from "@/features/recommendations/infrastructure/adapters/pg-recommendation.repository";

const recommendationRepository = PgRecommendationRepository.getInstance();
const orchestrator = RecommendationOrchestratorService.getInstance(
  recommendationRepository
);

const dailyRecommendationsJob = new cron.CronJob(
  "0 6 * * *",
  async () => {
    console.log("Running daily recommendations job...");

    try {
      const enabledUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.recommendations_enabled, true));

      console.log(
        `Found ${enabledUsers.length} users with recommendations enabled`
      );

      let successCount = 0;
      let errorCount = 0;

      for (const user of enabledUsers) {
        try {
          const recommendation = await orchestrator.generateDailyRecommendation(
            user.id
          );

          if (recommendation) {
            console.log(
              `Generated recommendation for user ${user.id}: ${recommendation.type}`
            );
            successCount++;
          } else {
            console.log(
              `No recommendation generated for user ${user.id} (already has one or no insights found)`
            );
          }
        } catch (error) {
          console.error(
            `Failed to generate recommendation for user ${user.id}:`,
            error
          );
          errorCount++;
        }
      }

      console.log(
        `Daily recommendations job completed: ${successCount} successful, ${errorCount} errors`
      );
    } catch (error) {
      console.error("Error in daily recommendations job:", error);
    }
  },
  null,
  false,
  "America/New_York"
);

export function startDailyRecommendationsJob() {
  dailyRecommendationsJob.start();
  console.log("Daily recommendations job started (runs at 6 AM daily)");
}

export function stopDailyRecommendationsJob() {
  dailyRecommendationsJob.stop();
  console.log("Daily recommendations job stopped");
}
