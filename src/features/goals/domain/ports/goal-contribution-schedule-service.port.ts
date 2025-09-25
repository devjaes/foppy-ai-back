import { AppRouteHandler } from "@/core/infrastructure/types/app-types";
import {
  ListRoute,
  GetByIdRoute,
  ListByGoalRoute,
  ListByUserRoute,
  CreateRoute,
  UpdateRoute,
  DeleteRoute,
  MarkAsCompletedRoute,
  MarkAsSkippedRoute,
} from "@/goals/infrastucture/controllers/goal-contribution-schedule.routes";

export interface IGoalContributionScheduleService {
  getAll: AppRouteHandler<ListRoute>;
  getById: AppRouteHandler<GetByIdRoute>;
  getByGoalId: AppRouteHandler<ListByGoalRoute>;
  getByUserId: AppRouteHandler<ListByUserRoute>;
  create: AppRouteHandler<CreateRoute>;
  update: AppRouteHandler<UpdateRoute>;
  delete: AppRouteHandler<DeleteRoute>;
  markAsCompleted: AppRouteHandler<MarkAsCompletedRoute>;
  markAsSkipped: AppRouteHandler<MarkAsSkippedRoute>;
}