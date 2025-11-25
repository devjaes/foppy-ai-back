import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "./recommendation.types";

export interface QuickAction {
  label: string;
  path: string;
  prefilledData?: Record<string, any>;
}

export interface Recommendation {
  id: number;
  userId: number;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  data?: any;
  actionable: boolean;
  actions?: QuickAction[];
  status: RecommendationStatus;
  createdAt: Date;
  expiresAt?: Date;
  viewedAt?: Date;
  dismissedAt?: Date;
  actedAt?: Date;
}
