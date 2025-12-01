import { RecommendationPriority } from "../entities/recommendation.types";
import { QuickAction } from "../entities/recommendation.entity";

export interface AnalysisResult {
  shouldGenerate: boolean;
  priority: RecommendationPriority;
  title: string;
  description: string;
  data?: any;
  actions?: QuickAction[];
}

export interface IAnalysisService {
  analyze(userId: number): Promise<AnalysisResult | null>;
}
