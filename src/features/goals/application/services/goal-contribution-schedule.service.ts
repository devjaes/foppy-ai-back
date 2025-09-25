import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IGoalContributionScheduleRepository } from "@/goals/domain/ports/goal-contribution-schedule-repository.port";
import { IGoalRepository } from "@/goals/domain/ports/goal-repository.port";
import { IGoalContributionScheduleService } from "@/goals/domain/ports/goal-contribution-schedule-service.port";
import { GoalContributionScheduleApiAdapter } from "@/goals/infrastucture/adapters/goal-contribution-schedule-api.adapter";
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
import { IUserRepository } from "@/users/domain/ports/user-repository.port";

export class GoalContributionScheduleService implements IGoalContributionScheduleService {
  private static instance: GoalContributionScheduleService;

  constructor(
    private readonly scheduleRepository: IGoalContributionScheduleRepository,
    private readonly goalRepository: IGoalRepository,
    private readonly userRepository: IUserRepository
  ) {}

  public static getInstance(
    scheduleRepository: IGoalContributionScheduleRepository,
    goalRepository: IGoalRepository,
    userRepository: IUserRepository
  ): GoalContributionScheduleService {
    if (!GoalContributionScheduleService.instance) {
      GoalContributionScheduleService.instance = new GoalContributionScheduleService(
        scheduleRepository,
        goalRepository,
        userRepository
      );
    }
    return GoalContributionScheduleService.instance;
  }

  getAll = createHandler<ListRoute>(async (c) => {
    const schedules = await this.scheduleRepository.findAll();
    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponseList(schedules),
        message: "Goal contribution schedules retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getById = createHandler<GetByIdRoute>(async (c) => {
    const id = c.req.param("id");
    const schedule = await this.scheduleRepository.findById(Number(id));

    if (!schedule) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution schedule not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponse(schedule),
        message: "Goal contribution schedule retrieved successfully",
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

    const schedules = await this.scheduleRepository.findByGoalId(Number(goalId));
    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponseList(schedules),
        message: "Goal contribution schedules retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getByUserId = createHandler<ListByUserRoute>(async (c) => {
    const userId = c.req.param("userId");
    
    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const schedules = await this.scheduleRepository.findByUserId(Number(userId));
    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponseList(schedules),
        message: "User goal contribution schedules retrieved successfully",
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

    const user = await this.userRepository.findById(data.user_id);
    if (!user) {
      return c.json(
        {
          success: false,
          data: null,
          message: "User not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const schedule = await this.scheduleRepository.create({
      goalId: data.goal_id,
      userId: data.user_id,
      scheduledDate: new Date(data.scheduled_date),
      amount: data.amount,
      status: data.status || "pending",
      contributionId: null,
    });

    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponse(schedule),
        message: "Goal contribution schedule created successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  update = createHandler<UpdateRoute>(async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const schedule = await this.scheduleRepository.findById(Number(id));
    if (!schedule) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution schedule not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const updateData: any = {};
    if (data.scheduled_date) updateData.scheduledDate = new Date(data.scheduled_date);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.status) updateData.status = data.status;

    const updatedSchedule = await this.scheduleRepository.update(Number(id), updateData);

    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponse(updatedSchedule),
        message: "Goal contribution schedule updated successfully",
      },
      HttpStatusCodes.OK
    );
  });

  delete = createHandler<DeleteRoute>(async (c) => {
    const id = c.req.param("id");
    
    const schedule = await this.scheduleRepository.findById(Number(id));
    if (!schedule) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution schedule not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const deleted = await this.scheduleRepository.delete(Number(id));
    return c.json(
      {
        success: true,
        data: { deleted },
        message: "Goal contribution schedule deleted successfully",
      },
      HttpStatusCodes.OK
    );
  });

  markAsCompleted = createHandler<MarkAsCompletedRoute>(async (c) => {
    const id = c.req.param("id");
    const { contribution_id } = c.req.valid("json");
    
    const schedule = await this.scheduleRepository.findById(Number(id));
    if (!schedule) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution schedule not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const updatedSchedule = await this.scheduleRepository.markAsCompleted(Number(id), contribution_id);

    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponse(updatedSchedule),
        message: "Goal contribution schedule marked as completed successfully",
      },
      HttpStatusCodes.OK
    );
  });

  markAsSkipped = createHandler<MarkAsSkippedRoute>(async (c) => {
    const id = c.req.param("id");
    
    const schedule = await this.scheduleRepository.findById(Number(id));
    if (!schedule) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Goal contribution schedule not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const updatedSchedule = await this.scheduleRepository.markAsSkipped(Number(id));

    return c.json(
      {
        success: true,
        data: GoalContributionScheduleApiAdapter.toApiResponse(updatedSchedule),
        message: "Goal contribution schedule marked as skipped successfully",
      },
      HttpStatusCodes.OK
    );
  });
}