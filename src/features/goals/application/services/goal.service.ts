import { IGoalRepository } from "@/goals/domain/ports/goal-repository.port";
import { IGoalService } from "@/goals/domain/ports/goal-service.port";
import { GoalUtilsService } from "./goal-utils.service";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  CreateRoute,
  DeleteRoute,
  GetByIdRoute,
  GetTransactionsRoute,
  ListByUserRoute,
  ListRoute,
  ListSharedRoute,
  UpdateProgressRoute,
  UpdateRoute,
} from "@/goals/infrastucture/controllers/goal.routes";
import { GoalApiAdapter } from "@/goals/infrastucture/adapters/goal-api.adapter";
import { GoalScheduleGeneratorService } from "./goal-schedule-generator.service";
import { PgGoalContributionScheduleRepository } from "@/goals/infrastucture/adapters/goal-contribution-schedule.repository";
import { IGoal } from "@/goals/domain/entities/IGoal";
import { TransactionApiAdapter } from "@/transactions/infrastructure/adapters/transaction-api.adapter";
import { IGoalContributionRepository } from "@/goals/domain/ports/goal-contribution-repository.port";
import { ITransactionRepository } from "@/transactions/domain/ports/transaction-repository.port";
import { GoalNotificationService } from "./goal-notification.service";

export class GoalService implements IGoalService {
  private static instance: GoalService;
  private goalNotificationService: GoalNotificationService;

  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalUtils: GoalUtilsService,
    private readonly goalContributionRepository: IGoalContributionRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {
    this.goalNotificationService = GoalNotificationService.getInstance();
  }

  public static getInstance(
    goalRepository: IGoalRepository,
    goalUtils: GoalUtilsService,
    goalContributionRepository: IGoalContributionRepository,
    transactionRepository: ITransactionRepository
  ): GoalService {
    if (!GoalService.instance) {
      GoalService.instance = new GoalService(
        goalRepository,
        goalUtils,
        goalContributionRepository,
        transactionRepository
      );
    }
    return GoalService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const goals = await this.goalRepository.findAll();
    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponseList(goals),
        message: "Goals retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const goal = await this.goalRepository.findById(Number(id));

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

    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponse(goal),
        message: "Goal retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByUserId = createHandler<ListByUserRoute>(async (c) => {
    const userId = c.req.param("userId");

    const userValidation = await this.goalUtils.validateUser(Number(userId));
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

    const goals = await this.goalRepository.findByUserId(Number(userId));
    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponseList(goals),
        message: "User goals retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getSharedWithUser = createHandler<ListSharedRoute>(async (c) => {
    const userId = c.req.param("userId");

    const userValidation = await this.goalUtils.validateUser(Number(userId));
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

    const goals = await this.goalRepository.findSharedWithUser(Number(userId));
    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponseList(goals),
        message: "Shared goals retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  create = createHandler<CreateRoute>(async (c) => {
    const data = c.req.valid("json");

    const userValidation = await this.goalUtils.validateUser(data.user_id);
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
      const sharedUserValidation = await this.goalUtils.validateUser(
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

		const goal = await this.goalRepository.create({
			userId: data.user_id,
			sharedUserId: data.shared_user_id || null,
			name: data.name,
			targetAmount: Number(data.target_amount),
			currentAmount: Number(data.current_amount || 0),
			endDate: new Date(data.end_date),
			contributionFrequency: data.contribution_frequency || 0,
			contributionAmount: data.contribution_amount || 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

    const scheduleGenerator = GoalScheduleGeneratorService.getInstance(
      PgGoalContributionScheduleRepository.getInstance()
    );

    await scheduleGenerator.generateSchedules(goal);

    // Send notification for newly created goal
    try {
      if (goal.sharedUserId) {
        await this.goalNotificationService.notifyGoalShared(
          goal,
          goal.sharedUserId
        );
      }
    } catch (error) {
      console.error("Error sending goal notification:", error);
    }

    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponse(goal),
        message: "Goal created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  update = createHandler<UpdateRoute>(async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const goal = await this.goalRepository.findById(Number(id));
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

    if (data.shared_user_id !== undefined) {
      if (data.shared_user_id !== null) {
        const validation = await this.goalUtils.validateSharing(
          Number(id),
          goal.userId,
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

    const updateData: Partial<IGoal> = {
      categoryId: data.category_id,
      contributionFrequency: data.contribution_frequency,
      contributionAmount: data.contribution_amount,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.target_amount !== undefined)
      updateData.targetAmount = Number(data.target_amount);
    if (data.current_amount !== undefined)
      updateData.currentAmount = Number(data.current_amount);
    if (data.end_date !== undefined)
      updateData.endDate = new Date(data.end_date);
    if (data.shared_user_id !== undefined)
      updateData.sharedUserId = data.shared_user_id;

    const updatedGoal = await this.goalRepository.update(
      Number(id),
      updateData
    );

    if (
      data.target_amount !== undefined ||
      data.current_amount !== undefined ||
      data.contribution_frequency !== undefined ||
      data.contribution_amount !== undefined ||
      data.end_date !== undefined
    ) {
      const scheduleGenerator = GoalScheduleGeneratorService.getInstance(
        PgGoalContributionScheduleRepository.getInstance()
      );
      await scheduleGenerator.recalculateSchedules(updatedGoal);
    }

    // Send notification if the goal is now shared with someone new
    try {
      if (
        data.shared_user_id !== undefined &&
        data.shared_user_id !== null &&
        goal.sharedUserId !== data.shared_user_id
      ) {
        await this.goalNotificationService.notifyGoalShared(
          updatedGoal,
          data.shared_user_id
        );
      }

      // Check deadline approaching
      if (data.end_date !== undefined) {
        await this.goalNotificationService.checkDeadlineApproaching(
          updatedGoal
        );
      }

      // Check progress milestones if current amount was updated
      if (
        data.current_amount !== undefined &&
        goal.currentAmount !== Number(data.current_amount)
      ) {
        await this.goalNotificationService.checkProgressMilestones(
          updatedGoal,
          goal.currentAmount
        );
      }
    } catch (error) {
      console.error("Error sending goal update notification:", error);
    }

    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponse(updatedGoal),
        message: "Goal updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    const goal = await this.goalRepository.findById(Number(id));

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

    const deleted = await this.goalRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Goal deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });

  updateProgress = createHandler<UpdateProgressRoute>(async (c) => {
    const id = c.req.param("id");
    const userId = c.req.param("userId");
    const { amount } = c.req.valid("json");

    const validation = await this.goalUtils.validateProgress(
      Number(id),
      Number(userId),
      amount
    );

    if (!validation.isValid) {
      return c.json(
        {
          success: false,
          data: null,
          message: validation.message || "Invalid progress update",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Get the goal before update to have the previous amount
    const goal = await this.goalRepository.findById(Number(id));
    const previousAmount = goal ? goal.currentAmount : 0;

    const updatedGoal = await this.goalRepository.updateProgress(
      Number(id),
      amount
    );

    // Check and send progress milestone notifications
    try {
      await this.goalNotificationService.checkProgressMilestones(
        updatedGoal,
        previousAmount
      );
    } catch (error) {
      console.error("Error sending goal progress notification:", error);
    }

    return c.json(
      {
        success: true,
        data: GoalApiAdapter.toApiResponse(updatedGoal),
        message: "Goal progress updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getTransactions = createHandler<GetTransactionsRoute>(async (c) => {
    const id = c.req.param("id");

    const goal = await this.goalRepository.findById(Number(id));
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
      Number(id)
    );
    const contributionIds = contributions.map(
      (contribution) => contribution.id
    );

    const transactions = [];
    for (const contributionId of contributionIds) {
      const contributionTransactions =
        await this.transactionRepository.findByContributionId(contributionId);
      transactions.push(...contributionTransactions);
    }

    return c.json(
      {
        success: true,
        data: TransactionApiAdapter.toApiResponseList(transactions),
        message: "Goal transactions retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });
}
