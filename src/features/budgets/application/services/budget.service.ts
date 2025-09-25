import { IBudgetRepository } from "@/budgets/domain/ports/budget-repository.port";
import { IBudgetService } from "@/budgets/domain/ports/budget-service.port";
import { BudgetUtilsService } from "./budget-utils.service";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  CreateBudgetTransactionRoute,
  CreateRoute,
  DeleteRoute,
  GetByIdRoute,
  GetTransactionsRoute,
  ListByMonthRoute,
  ListByUserRoute,
  ListRoute,
  ListSharedRoute,
  UpdateAmountRoute,
  UpdateRoute,
} from "@/budgets/infrastructure/controllers/budget.routes";
import { BudgetApiAdapter } from "@/budgets/infrastructure/adapters/budget-api.adapter";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { TransactionApiAdapter } from "@/transactions/infrastructure/adapters/transaction-api.adapter";
import { ITransactionRepository } from "@/transactions/domain/ports/transaction-repository.port";
import { IPaymentMethodRepository } from "@/payment-methods/domain/ports/payment-method-repository.port";
import { BudgetNotificationService } from "./budget-notification.service";

export class BudgetService implements IBudgetService {
  private static instance: BudgetService;

  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly budgetUtils: BudgetUtilsService,
    private readonly transactionRepository: ITransactionRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly budgetNotificationService: BudgetNotificationService
  ) {}

  public static getInstance(
    budgetRepository: IBudgetRepository,
    budgetUtils: BudgetUtilsService,
    transactionRepository: ITransactionRepository,
    paymentMethodRepository: IPaymentMethodRepository,
    budgetNotificationService: BudgetNotificationService
  ): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService(
        budgetRepository,
        budgetUtils,
        transactionRepository,
        paymentMethodRepository,
        budgetNotificationService
      );
    }
    return BudgetService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const budgets = await this.budgetRepository.findAll();
    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponseList(budgets),
        message: "Budgets retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const budget = await this.budgetRepository.findById(Number(id));

    if (!budget) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Budget not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponse(budget),
        message: "Budget retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByUserId = createHandler<ListByUserRoute>(async (c) => {
    const userId = c.req.param("userId");

    const userValidation = await this.budgetUtils.validateUser(Number(userId));
    if (!userValidation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const budgets = await this.budgetRepository.findByUserId(Number(userId));
    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponseList(budgets),
        message: "User budgets retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByUserIdAndMonth = createHandler<ListByMonthRoute>(async (c) => {
    const userId = c.req.param("userId");
    const { month } = c.req.valid("query");

    const userValidation = await this.budgetUtils.validateUser(Number(userId));
    if (!userValidation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const budgets = await this.budgetRepository.findByUserIdAndMonth(
      Number(userId),
      new Date(month)
    );
    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponseList(budgets),
        message: "User budgets for month retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getSharedWithUser = createHandler<ListSharedRoute>(async (c) => {
    const userId = c.req.param("userId");

    const userValidation = await this.budgetUtils.validateUser(Number(userId));
    if (!userValidation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const budgets = await this.budgetRepository.findSharedWithUser(
      Number(userId)
    );
    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponseList(budgets),
        message: "Shared budgets retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");

    const userValidation = await this.budgetUtils.validateUser(data.user_id);
    if (!userValidation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    if (data.shared_user_id) {
      const sharedUserValidation = await this.budgetUtils.validateUser(
        data.shared_user_id
      );
      if (!sharedUserValidation.isValid) {
        return c.json(
          {
            success: false,
            data: null,
            message: "Shared user not found",
          },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    const budget = await this.budgetRepository.create({
      userId: data.user_id,
      sharedUserId: data.shared_user_id || null,
      categoryId: data.category_id,
      limitAmount: Number(data.limit_amount),
      currentAmount: Number(data.current_amount || 0),
      month: new Date(data.month),
    });

    // Send notification if budget is shared
    try {
      if (budget.sharedUserId) {
        await BudgetNotificationService.getInstance().notifyBudgetShared(
          budget,
          budget.sharedUserId
        );
      }
    } catch (error) {
      console.error("Error sending budget notification:", error);
    }

    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponse(budget),
        message: "Budget created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  update = createHandler<UpdateRoute>(async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const budget = await this.budgetRepository.findById(Number(id));
    if (!budget) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Budget not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    if (data.shared_user_id !== undefined) {
      if (data.shared_user_id !== null) {
        const validation = await this.budgetUtils.validateSharing(
          Number(id),
          budget.userId,
          data.shared_user_id
        );

        if (!validation.isValid) {
          return c.json(
            {
              success: false,
              data: null,
              message: validation.message || "Invalid sharing configuration",
            },
            HttpStatusCodes.BAD_REQUEST
          );
        }
      }
    }

    const updateData: Partial<any> = {};

    if (data.category_id !== undefined)
      updateData.categoryId = data.category_id;
    if (data.limit_amount !== undefined)
      updateData.limitAmount = Number(data.limit_amount);
    if (data.current_amount !== undefined)
      updateData.currentAmount = Number(data.current_amount);
    if (data.month !== undefined) updateData.month = new Date(data.month);
    if (data.shared_user_id !== undefined)
      updateData.sharedUserId = data.shared_user_id;

    const updatedBudget = await this.budgetRepository.update(
      Number(id),
      updateData
    );

    // Send notifications for relevant updates
    try {
      // Notify if the budget is now shared with someone new
      if (
        data.shared_user_id !== undefined &&
        data.shared_user_id !== null &&
        budget.sharedUserId !== data.shared_user_id
      ) {
        await this.budgetNotificationService.notifyBudgetShared(
          updatedBudget,
          data.shared_user_id
        );
      }

      // Check budget limits if amount changed
      if (
        data.current_amount !== undefined &&
        budget.currentAmount !== Number(data.current_amount)
      ) {
        await this.budgetNotificationService.checkBudgetLimits(
          updatedBudget,
          budget.currentAmount
        );
      }
    } catch (error) {
      console.error("Error sending budget update notification:", error);
    }

    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponse(updatedBudget),
        message: "Budget updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    const budget = await this.budgetRepository.findById(Number(id));

    if (!budget) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Budget not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const deleted = await this.budgetRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Budget deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });

  updateAmount = createHandler<UpdateAmountRoute>(async (c) => {
    const id = c.req.param("id");
    const userId = c.req.param("userId");
    const { amount } = c.req.valid("json");

    const validation = await this.budgetUtils.validateAmount(
      Number(id),
      Number(userId),
      amount
    );

    if (!validation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: validation.message || "Invalid amount update",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Get the budget before update to have the previous amount
    const budget = await this.budgetRepository.findById(Number(id));
    const previousAmount = budget ? budget.currentAmount : 0;

    const updatedBudget = await this.budgetRepository.updateAmount(
      Number(id),
      amount
    );

    // Check and send budget limit notifications
    try {
      await this.budgetNotificationService.checkBudgetLimits(
        updatedBudget,
        previousAmount
      );
    } catch (error) {
      console.error("Error sending budget limits notification:", error);
    }

    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponse(updatedBudget),
        message: "Budget amount updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  createTransaction = createHandler<CreateBudgetTransactionRoute>(async (c) => {
    const budgetId = c.req.param("id");
    const userId = c.req.param("userId");
    const data = c.req.valid("json");

    const budget = await this.budgetRepository.findById(Number(budgetId));
    if (!budget) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Budget not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Validar que el usuario tiene acceso a este presupuesto
    if (!(await this.budgetUtils.canAccess(Number(budgetId), Number(userId)))) {
      return c.json(
        {
          success: false,
          data: null,
          message: "You don't have access to this budget",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Validar método de pago si se proporciona
    if (data.payment_method_id) {
      const paymentMethodValid = await this.budgetUtils.validatePaymentMethod(
        data.payment_method_id,
        Number(userId)
      );

      if (!paymentMethodValid) {
        return c.json(
          {
            success: false,
            data: null,
            message: "Invalid payment method",
          },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    const categoryId = data.category_id || budget.categoryId;

    const transactionRepository = PgTransactionRepository.getInstance();
    const transaction = await transactionRepository.create({
      userId: Number(userId),
      amount: data.amount,
      type: data.type,
      categoryId: categoryId,
      description: data.description || `Transacción: ${budget.id}`,
      paymentMethodId: data.payment_method_id || null,
      budgetId: Number(budgetId),
      category: budget.category || null,
      paymentMethod: data.payment_method_id
        ? await this.paymentMethodRepository.findById(data.payment_method_id)
        : null,
    });

    if (data.type === "EXPENSE") {
      await this.budgetRepository.updateAmount(Number(budgetId), data.amount);
    } else if (data.type === "INCOME") {
      await this.budgetRepository.updateLimitAmount(
        Number(budgetId),
        (budget.limitAmount || 0) + data.amount
      );
    }

    return c.json(
      {
        success: true,
        data: BudgetApiAdapter.toApiResponse(budget),
        message: "Transaction created and budget updated successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  getTransactions = createHandler<GetTransactionsRoute>(async (c) => {
    const id = c.req.param("id");

    // Verificar que el presupuesto existe
    const budget = await this.budgetRepository.findById(Number(id));
    if (!budget) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Budget not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const transactions = await this.transactionRepository.findByBudgetId(
      Number(id)
    );

    return c.json(
      {
        success: true,
        data: TransactionApiAdapter.toApiResponseList(transactions),
        message: "Budget transactions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });
}
