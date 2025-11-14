import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IPlanRepository } from "@/subscriptions/domain/ports/plan-repository.port";
import { ISubscriptionRepository } from "@/subscriptions/domain/ports/subscription-repository.port";
import {
  ListPlansRoute,
  SetPlanRoute,
  CancelPlanRoute,
  GetUserSubscriptionRoute,
} from "@/subscriptions/infrastructure/controllers/subscription.routes";
import { SubscriptionApiAdapter } from "@/subscriptions/infrastructure/adapters/subscription-api.adapter";
import { IUserRepository } from "@/users/domain/ports/user-repository.port";

export class SubscriptionService {
  private static instance: SubscriptionService;

  constructor(
    private readonly planRepository: IPlanRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly userRepository: IUserRepository
  ) {}

  public static getInstance(
    planRepository: IPlanRepository,
    subscriptionRepository: ISubscriptionRepository,
    userRepository: IUserRepository
  ): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService(
        planRepository,
        subscriptionRepository,
        userRepository
      );
    }
    return SubscriptionService.instance;
  }

  listPlans = createHandler<ListPlansRoute>(async (c) => {
    const plans = await this.planRepository.findAll();
    return c.json(
      {
        success: true,
        data: SubscriptionApiAdapter.planToApiResponseList(plans),
        message: "Plans retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });

  setPlan = createHandler<SetPlanRoute>(async (c) => {
    const data = c.req.valid("json");

    const user = await this.userRepository.findById(data.userId);
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

    const plan = await this.planRepository.findById(data.planId);
    if (!plan) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Plan not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.subscriptionRepository.create({
      userId: data.userId,
      planId: data.planId,
      frequency: data.frequency,
      startDate,
      endDate,
      active: true,
    });

    return c.json(
      {
        success: true,
        data: SubscriptionApiAdapter.toApiResponse(subscription),
        message: "Plan set successfully",
      },
      HttpStatusCodes.CREATED
    );
  });

  cancelPlan = createHandler<CancelPlanRoute>(async (c) => {
    const subscriptionId = c.req.param("id");

    const subscription = await this.subscriptionRepository.findById(
      Number(subscriptionId)
    );
    if (!subscription) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Subscription not found",
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const cancelled = await this.subscriptionRepository.cancel(
      subscription.id,
      subscription.endDate
    );

    return c.json(
      {
        success: true,
        data: SubscriptionApiAdapter.toApiResponse(cancelled),
        message: "Plan cancelled successfully",
      },
      HttpStatusCodes.OK
    );
  });

  getUserSubscription = createHandler<GetUserSubscriptionRoute>(async (c) => {
    const userId = c.req.param("userId");

    const subscription = await this.subscriptionRepository.findByUserId(
      Number(userId)
    );

    return c.json(
      {
        success: true,
        data: subscription
          ? SubscriptionApiAdapter.toApiResponse(subscription)
          : null,
        message: "User subscription retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  });
}

