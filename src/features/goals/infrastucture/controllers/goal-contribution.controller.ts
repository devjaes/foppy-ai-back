import { createRouter } from "@/core/infrastructure/lib/create-app";
import { GoalContributionService } from "@/goals/application/services/goal-contribution.service";
import { PgGoalContributionRepository } from "../adapters/goal-contribution.repository";
import { PgGoalRepository } from "../adapters/goal.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import * as routes from "./goal-contribution.route";
import { GoalUtilsService } from "@/goals/application/services/goal-utils.service";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";
import { PgPaymentMethodRepository } from "@/payment-methods/infrastructure/adapters/payment-method.repository";

const goalContributionRepository = PgGoalContributionRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();
const userRepository = PgUserRepository.getInstance();
const goalUtils = GoalUtilsService.getInstance(goalRepository, userRepository);
const paymentMethodRepository = PgPaymentMethodRepository.getInstance();
const goalContributionService = GoalContributionService.getInstance(
  goalContributionRepository,
  goalRepository,
  transactionRepository,
  goalUtils,
  paymentMethodRepository
);

const router = createRouter()
  .openapi(routes.list, goalContributionService.getAll)
  .openapi(routes.getById, goalContributionService.getById)
  .openapi(routes.listByGoal, goalContributionService.getByGoalId)
  .openapi(routes.create, goalContributionService.create)
  .openapi(routes.delete_, goalContributionService.delete);

export default router;