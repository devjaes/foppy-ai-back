// src/features/goals/application/services/goal-contribution.service.ts
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IGoalContributionRepository } from "@/goals/domain/ports/goal-contribution-repository.port";
import { IGoalRepository } from "@/goals/domain/ports/goal-repository.port";
import { IGoalContributionService } from "@/goals/domain/ports/goal-contribution-service.port";
import {
  ListRoute,
  GetByIdRoute,
  ListByGoalRoute,
  CreateRoute,
  DeleteRoute,
} from "@/goals/infrastucture/controllers/goal-contribution.route";
import { ITransactionRepository } from "@/transactions/domain/ports/transaction-repository.port";
import { GoalContributionApiAdapter } from "@/goals/infrastucture/adapters/goal-contribution-api.adapter";
import { GoalUtilsService } from "./goal-utils.service";
import { IPaymentMethodRepository } from "@/payment-methods/domain/ports/payment-method-repository.port";
import { GoalNotificationService } from "./goal-notification.service";
import { GoalSuggestionService } from "./goal-suggestion.service";

export class GoalContributionService implements IGoalContributionService {
  private static instance: GoalContributionService;
  private goalNotificationService: GoalNotificationService;
  private goalSuggestionService: GoalSuggestionService;

  constructor(
    private readonly goalContributionRepository: IGoalContributionRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly goalUtils: GoalUtilsService,
    private readonly paymentMethodRepository: IPaymentMethodRepository
  ) {
    this.goalNotificationService = GoalNotificationService.getInstance();
    this.goalSuggestionService = GoalSuggestionService.getInstance();
  }

  public static getInstance(
    goalContributionRepository: IGoalContributionRepository,
    goalRepository: IGoalRepository,
    transactionRepository: ITransactionRepository,
    goalUtils: GoalUtilsService,
    paymentMethodRepository: IPaymentMethodRepository
  ): GoalContributionService {
    if (!GoalContributionService.instance) {
      GoalContributionService.instance = new GoalContributionService(
        goalContributionRepository,
        goalRepository,
        transactionRepository,
        goalUtils,
        paymentMethodRepository
      );
    }
    return GoalContributionService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const contributions = await this.goalContributionRepository.findAll();
    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponseList(contributions),
        message: "Goal contributions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const contribution = await this.goalContributionRepository.findById(
      Number(id)
    );

    if (!contribution) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponse(contribution),
        message: "Goal contribution retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByGoalId = createHandler<ListByGoalRoute>(async (c) => {
    const goalId = c.req.param("goalId");

    const goal = await this.goalRepository.findById(Number(goalId));
    if (!goal) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const contributions = await this.goalContributionRepository.findByGoalId(
      Number(goalId)
    );
    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponseList(contributions),
        message: "Goal contributions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");

    const goal = await this.goalRepository.findById(data.goal_id);
    if (!goal) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    if (data.payment_method_id) {
      const paymentMethodValid = await this.goalUtils.validatePaymentMethod(
        data.payment_method_id,
        data.user_id
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

    const contribution = await this.goalContributionRepository.create({
      goalId: data.goal_id,
      userId: data.user_id,
      amount: data.amount,
    });

    // Store the previous amount before updating the goal
    const previousAmount = goal.currentAmount;

    // Update the goal progress
    const updatedGoal = await this.goalRepository.updateProgress(
      goal.id,
      data.amount
    );

    // Check and send progress milestone notifications
    try {
      await this.goalNotificationService.checkProgressMilestones(
        updatedGoal,
        previousAmount
      );

      // Generar sugerencias actualizadas después de crear un aporte
      await this.goalSuggestionService.suggestWeeklySaving(updatedGoal);

      // Verificar si la meta está en riesgo
      await this.goalSuggestionService.checkGoalAtRisk(updatedGoal);
    } catch (error) {
      console.error(
        "Error sending goal progress notification or suggestions:",
        error
      );
    }

    const transaction = await this.transactionRepository.create({
      userId: data.user_id,
      amount: data.amount,
      type: "INCOME",
      description: data.description || `Contribution to goal: ${goal.name}`,
      paymentMethodId: data.payment_method_id || null,
      contributionId: contribution.id,
      categoryId: goal.categoryId || null,
      category: goal.category || null,
      paymentMethod: data.payment_method_id
        ? await this.paymentMethodRepository.findById(data.payment_method_id)
        : null,
    });

    return c.json(
      {
        success: true,
        data: GoalContributionApiAdapter.toApiResponse(contribution),
        message: "Goal contribution created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    const contribution = await this.goalContributionRepository.findById(
      Number(id)
    );

    if (!contribution) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const deleted = await this.goalContributionRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Goal contribution deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });
}
