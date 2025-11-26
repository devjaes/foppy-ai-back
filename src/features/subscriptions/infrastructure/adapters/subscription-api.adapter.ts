import { ISubscription } from "@/subscriptions/domain/entities/ISubscription";
import { IPlan } from "@/subscriptions/domain/entities/IPlan";

export class SubscriptionApiAdapter {
  static toApiResponse(subscription: ISubscription) {
    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      plan: subscription.plan ? this.planToApiResponse(subscription.plan) : null,
      frequency: subscription.frequency,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      retirementDate: subscription.retirementDate || null,
      active: subscription.active,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  static planToApiResponse(plan: IPlan) {
    return {
      id: plan.id,
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price,
      frequency: plan.frequency,
      description: plan.description,
      features: plan.features,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  static planToApiResponseList(plans: IPlan[]) {
    return plans.map(this.planToApiResponse);
  }
}

