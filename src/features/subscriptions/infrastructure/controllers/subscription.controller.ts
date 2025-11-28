import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "@/subscriptions/infrastructure/controllers/subscription.routes";
import { SubscriptionService } from "@/subscriptions/application/services/subscription.service";
import { PgPlanRepository } from "@/subscriptions/infrastructure/adapters/plan.repository";
import { PgSubscriptionRepository } from "@/subscriptions/infrastructure/adapters/subscription.repository";
import { PgUserRepository } from "@/users/infrastructure/adapters/user.repository";

const planRepository = PgPlanRepository.getInstance();
const subscriptionRepository = PgSubscriptionRepository.getInstance();
const userRepository = PgUserRepository.getInstance();
const subscriptionService = SubscriptionService.getInstance(
  planRepository,
  subscriptionRepository,
  userRepository
);

const router = createRouter()
  .openapi(routes.listPlans, subscriptionService.listPlans)
  .openapi(routes.setPlan, subscriptionService.setPlan)
  .openapi(routes.cancelPlan, subscriptionService.cancelPlan)
  .openapi(routes.getUserSubscription, subscriptionService.getUserSubscription);

export default router;

