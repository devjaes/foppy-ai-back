import { db } from "@/db";
import { recommendations } from "@/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { IRecommendationRepository } from "../../domain/ports/recommendation.repository.interface";
import {
  Recommendation,
  QuickAction,
} from "../../domain/entities/recommendation.entity";
import {
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "../../domain/entities/recommendation.types";
import { CreateRecommendationData } from "../../domain/ports/recommendation.repository.interface";

export class PgRecommendationRepository implements IRecommendationRepository {
  private static instance: PgRecommendationRepository;

  private constructor() {}

  public static getInstance(): PgRecommendationRepository {
    if (!PgRecommendationRepository.instance) {
      PgRecommendationRepository.instance = new PgRecommendationRepository();
    }
    return PgRecommendationRepository.instance;
  }

  async create(data: CreateRecommendationData): Promise<Recommendation> {
    const expiresAt =
      data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [recommendation] = await db
      .insert(recommendations)
      .values({
        user_id: data.userId,
        type: data.type,
        priority: data.priority,
        title: data.title,
        description: data.description,
        data: data.data,
        actionable: data.actionable,
        actions: data.actions as any,
        status: RecommendationStatus.PENDING,
        expires_at: expiresAt,
      })
      .returning();

    return this.mapToEntity(recommendation);
  }

  async findById(id: number): Promise<Recommendation | null> {
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id))
      .limit(1);

    if (!recommendation) {
      return null;
    }

    return this.mapToEntity(recommendation);
  }

  async findPendingByUserId(userId: number): Promise<Recommendation[]> {
    const now = new Date();

    const results = await db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.user_id, userId),
          eq(recommendations.status, RecommendationStatus.PENDING),
          gt(recommendations.expires_at, now)
        )
      )
      .orderBy(recommendations.created_at);

    return results.map((rec) => this.mapToEntity(rec));
  }

  async markAsViewed(id: number): Promise<void> {
    await db
      .update(recommendations)
      .set({
        status: RecommendationStatus.VIEWED,
        viewed_at: new Date(),
      })
      .where(eq(recommendations.id, id));
  }

  async markAsDismissed(id: number): Promise<void> {
    await db
      .update(recommendations)
      .set({
        status: RecommendationStatus.DISMISSED,
        dismissed_at: new Date(),
      })
      .where(eq(recommendations.id, id));
  }

  async markAsActed(id: number): Promise<void> {
    await db
      .update(recommendations)
      .set({
        status: RecommendationStatus.ACTED,
        acted_at: new Date(),
      })
      .where(eq(recommendations.id, id));
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();

    const result = await db
      .delete(recommendations)
      .where(lt(recommendations.expires_at, now));

    return result.rowCount || 0;
  }

  private mapToEntity(dbRec: any): Recommendation {
    return {
      id: dbRec.id,
      userId: dbRec.user_id,
      type: dbRec.type as RecommendationType,
      priority: dbRec.priority as RecommendationPriority,
      title: dbRec.title,
      description: dbRec.description,
      data: dbRec.data,
      actionable: dbRec.actionable,
      actions: dbRec.actions as QuickAction[] | undefined,
      status: dbRec.status as RecommendationStatus,
      createdAt: dbRec.created_at,
      expiresAt: dbRec.expires_at || undefined,
      viewedAt: dbRec.viewed_at || undefined,
      dismissedAt: dbRec.dismissed_at || undefined,
      actedAt: dbRec.acted_at || undefined,
    };
  }
}
