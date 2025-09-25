import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "@/budgets/infrastructure/controllers/budget.routes";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";
import { BudgetUtilsService } from "@/budgets/application/services/budget-utils.service";
import { BudgetService } from "@/budgets/application/services/budget.service";
import { PgBudgetRepository } from "../adapters/budget.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { PgPaymentMethodRepository } from "@/payment-methods/infrastructure/adapters/payment-method.repository";
import { BudgetNotificationService } from "@/budgets/application/services/budget-notification.service";

const userRepository = PgUserRepository.getInstance();
const budgetRepository = PgBudgetRepository.getInstance();
const budgetUtils = BudgetUtilsService.getInstance(
  budgetRepository,
  userRepository
);
const budgetNotificationService = BudgetNotificationService.getInstance();
const paymentMethodRepository = PgPaymentMethodRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();
const budgetService = BudgetService.getInstance(
  budgetRepository,
  budgetUtils,
  transactionRepository,
  paymentMethodRepository,
  budgetNotificationService
);

const router = createRouter()
  .openapi(routes.list, budgetService.getAll)
  .openapi(routes.create, budgetService.create)
  .openapi(routes.update, budgetService.update)
  .openapi(routes.delete_, budgetService.delete)
  .openapi(routes.getById, budgetService.getById)
  .openapi(routes.listByUser, budgetService.getByUserId)
  .openapi(routes.listByMonth, budgetService.getByUserIdAndMonth)
  .openapi(routes.listShared, budgetService.getSharedWithUser)
  .openapi(routes.updateAmount, budgetService.updateAmount)
  .openapi(routes.createBudgetTransaction, budgetService.createTransaction)
  .openapi(routes.getTransactions, budgetService.getTransactions);

export default router;
