import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "./goal-contribution-schedule.routes";
import { GoalContributionScheduleService } from "@/goals/application/services/goal-contribution-schedule.service";
import { PgGoalContributionScheduleRepository } from "../adapters/goal-contribution-schedule.repository";
import { PgGoalRepository } from "../adapters/goal.repository";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";

const scheduleRepository = PgGoalContributionScheduleRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const userRepository = PgUserRepository.getInstance();

const goalContributionScheduleService = GoalContributionScheduleService.getInstance(
  scheduleRepository,
  goalRepository,
  userRepository
);

const router = createRouter()
  .openapi(routes.list, goalContributionScheduleService.getAll)
  .openapi(routes.getById, goalContributionScheduleService.getById)
  .openapi(routes.listByGoal, goalContributionScheduleService.getByGoalId)
  .openapi(routes.listByUser, goalContributionScheduleService.getByUserId)
  .openapi(routes.create, goalContributionScheduleService.create)
  .openapi(routes.update, goalContributionScheduleService.update)
  .openapi(routes.delete_, goalContributionScheduleService.delete)
  .openapi(routes.markAsCompleted, goalContributionScheduleService.markAsCompleted)
  .openapi(routes.markAsSkipped, goalContributionScheduleService.markAsSkipped);

export default router;