import { eq, and } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { subscriptions, plans } from "@/schema";
import { ISubscriptionRepository } from "@/subscriptions/domain/ports/subscription-repository.port";
import { ISubscription } from "@/subscriptions/domain/entities/ISubscription";
import { IPlan } from "@/subscriptions/domain/entities/IPlan";

export class PgSubscriptionRepository implements ISubscriptionRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgSubscriptionRepository;

  private constructor() {}

  public static getInstance(): PgSubscriptionRepository {
    if (!PgSubscriptionRepository.instance) {
      PgSubscriptionRepository.instance = new PgSubscriptionRepository();
    }
    return PgSubscriptionRepository.instance;
  }

  async findByUserId(userId: number): Promise<ISubscription | null> {
    const result = await this.db
      .select({
        id: subscriptions.id,
        user_id: subscriptions.user_id,
        plan_id: subscriptions.plan_id,
        plan: {
          id: plans.id,
          name: plans.name,
          duration_days: plans.duration_days,
          price: plans.price,
          frequency: plans.frequency,
          created_at: plans.created_at,
          updated_at: plans.updated_at,
        },
        frequency: subscriptions.frequency,
        start_date: subscriptions.start_date,
        end_date: subscriptions.end_date,
        retirement_date: subscriptions.retirement_date,
        active: subscriptions.active,
        created_at: subscriptions.created_at,
        updated_at: subscriptions.updated_at,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.plan_id, plans.id))
      .where(
        and(
          eq(subscriptions.user_id, userId),
          eq(subscriptions.active, true)
        )
      )
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findById(id: number): Promise<ISubscription | null> {
    const result = await this.db
      .select({
        id: subscriptions.id,
        user_id: subscriptions.user_id,
        plan_id: subscriptions.plan_id,
        plan: {
          id: plans.id,
          name: plans.name,
          duration_days: plans.duration_days,
          price: plans.price,
          frequency: plans.frequency,
          created_at: plans.created_at,
          updated_at: plans.updated_at,
        },
        frequency: subscriptions.frequency,
        start_date: subscriptions.start_date,
        end_date: subscriptions.end_date,
        retirement_date: subscriptions.retirement_date,
        active: subscriptions.active,
        created_at: subscriptions.created_at,
        updated_at: subscriptions.updated_at,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.plan_id, plans.id))
      .where(eq(subscriptions.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async create(
    subscriptionData: Omit<ISubscription, "id" | "createdAt" | "updatedAt">
  ): Promise<ISubscription> {
    const existing = await this.findByUserId(subscriptionData.userId);
    if (existing) {
      await this.db
        .update(subscriptions)
        .set({ active: false })
        .where(eq(subscriptions.id, existing.id));
    }

    const result = await this.db
      .insert(subscriptions)
      .values({
        user_id: subscriptionData.userId,
        plan_id: subscriptionData.planId,
        frequency: subscriptionData.frequency,
        start_date: subscriptionData.startDate,
        end_date: subscriptionData.endDate,
        retirement_date: subscriptionData.retirementDate || null,
        active: subscriptionData.active,
      })
      .returning();

    const planResult = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, subscriptionData.planId))
      .limit(1);

    return this.mapToEntity({
      ...result[0],
      plan: planResult[0] || null,
    });
  }

  async update(
    id: number,
    subscriptionData: Partial<ISubscription>
  ): Promise<ISubscription> {
    const updateData: Record<string, any> = {};

    if (subscriptionData.planId !== undefined)
      updateData.plan_id = subscriptionData.planId;
    if (subscriptionData.frequency !== undefined)
      updateData.frequency = subscriptionData.frequency;
    if (subscriptionData.startDate !== undefined)
      updateData.start_date = subscriptionData.startDate;
    if (subscriptionData.endDate !== undefined)
      updateData.end_date = subscriptionData.endDate;
    if (subscriptionData.retirementDate !== undefined)
      updateData.retirement_date = subscriptionData.retirementDate;
    if (subscriptionData.active !== undefined)
      updateData.active = subscriptionData.active;

    const result = await this.db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();

    const planResult = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, result[0].plan_id))
      .limit(1);

    return this.mapToEntity({
      ...result[0],
      plan: planResult[0] || null,
    });
  }

  async cancel(id: number, retirementDate: Date): Promise<ISubscription> {
    const result = await this.db
      .update(subscriptions)
      .set({
        retirement_date: retirementDate,
        active: false,
      })
      .where(eq(subscriptions.id, id))
      .returning();

    const planResult = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, result[0].plan_id))
      .limit(1);

    return this.mapToEntity({
      ...result[0],
      plan: planResult[0] || null,
    });
  }

  private mapToEntity(raw: any): ISubscription {
    return {
      id: raw.id,
      userId: raw.user_id,
      planId: raw.plan_id,
      plan: raw.plan
        ? {
            id: raw.plan.id,
            name: raw.plan.name,
            durationDays: raw.plan.duration_days,
            price: Number(raw.plan.price),
            frequency: raw.plan.frequency,
            createdAt: raw.plan.created_at,
            updatedAt: raw.plan.updated_at,
          }
        : null,
      frequency: raw.frequency,
      startDate: new Date(raw.start_date),
      endDate: new Date(raw.end_date),
      retirementDate: raw.retirement_date ? new Date(raw.retirement_date) : null,
      active: raw.active,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}

