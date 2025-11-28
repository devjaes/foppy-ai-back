import { Recommendation } from "../entities/recommendation.entity";
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "../entities/recommendation.types";
import { QuickAction } from "../entities/recommendation.entity";

export interface CreateRecommendationData {
  userId: number;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  data?: any;
  actionable: boolean;
  actions?: QuickAction[];
  expiresAt?: Date;
}

export interface IRecommendationRepository {
  create(data: CreateRecommendationData): Promise<Recommendation>;
  findById(id: number): Promise<Recommendation | null>;
  findPendingByUserId(userId: number): Promise<Recommendation[]>;
  markAsViewed(id: number): Promise<void>;
  markAsDismissed(id: number): Promise<void>;
  markAsActed(id: number): Promise<void>;
  deleteExpired(): Promise<number>;
}
