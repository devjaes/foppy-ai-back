import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "./goal.routes";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";
import { GoalUtilsService } from "@/goals/application/services/goal-utils.service";
import { GoalService } from "@/goals/application/services/goal.service";
import { PgGoalRepository } from "../adapters/goal.repository";
import { PgGoalContributionRepository } from "../adapters/goal-contribution.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";

const userRepository = PgUserRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const goalUtils = GoalUtilsService.getInstance(goalRepository, userRepository);
const goalContributionRepository = PgGoalContributionRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();
const goalService = GoalService.getInstance(goalRepository, goalUtils, goalContributionRepository, transactionRepository);

const router = createRouter()
	.openapi(routes.list, goalService.getAll)
	.openapi(routes.create, goalService.create)
	.openapi(routes.update, goalService.update)
	.openapi(routes.delete_, goalService.delete)
	.openapi(routes.getById, goalService.getById)
	.openapi(routes.listByUser, goalService.getByUserId)
	.openapi(routes.listShared, goalService.getSharedWithUser)
	.openapi(routes.updateProgress, goalService.updateProgress)
	.openapi(routes.getTransactions, goalService.getTransactions);

export default router;
