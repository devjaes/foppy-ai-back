import { Recommendation } from "../entities/recommendation.entity";

export interface IRecommendationOrchestrator {
  generateDailyRecommendation(userId: number): Promise<Recommendation | null>;
}
