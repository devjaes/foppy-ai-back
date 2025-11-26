import { eq } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { plans } from "@/schema";
import { IPlanRepository } from "@/subscriptions/domain/ports/plan-repository.port";
import { IPlan } from "@/subscriptions/domain/entities/IPlan";

export class PgPlanRepository implements IPlanRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgPlanRepository;

  private constructor() {}

  public static getInstance(): PgPlanRepository {
    if (!PgPlanRepository.instance) {
      PgPlanRepository.instance = new PgPlanRepository();
    }
    return PgPlanRepository.instance;
  }

  async findAll(): Promise<IPlan[]> {
    const result = await this.db.select().from(plans);
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<IPlan | null> {
    const result = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByName(name: string): Promise<IPlan | null> {
    const result = await this.db
      .select()
      .from(plans)
      .where(eq(plans.name, name))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  private mapToEntity(raw: any): IPlan {
    return {
      id: raw.id,
      name: raw.name,
      durationDays: raw.duration_days,
      price: Number(raw.price),
      frequency: raw.frequency,
      description: raw.description,
      features: raw.features,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}

