import { AppRouteHandler } from "@/core/infrastructure/types/app-types";
import {
  ListRoute,
  GetByIdRoute,
  ListByGoalRoute,
  CreateRoute,
  DeleteRoute,
} from "@/goals/infrastucture/controllers/goal-contribution.route";

export interface IGoalContributionService {
  getAll: AppRouteHandler<ListRoute>;
  getById: AppRouteHandler<GetByIdRoute>;
  getByGoalId: AppRouteHandler<ListByGoalRoute>;
  create: AppRouteHandler<CreateRoute>;
  delete: AppRouteHandler<DeleteRoute>;
}