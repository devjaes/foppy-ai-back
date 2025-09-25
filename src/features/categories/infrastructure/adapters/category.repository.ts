import { eq } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { categories } from "@/schema";
import { ICategoryRepository } from "../../domain/ports/category-repository.port";
import { ICategory } from "../../domain/entities/ICategory";

export class PgCategoryRepository implements ICategoryRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgCategoryRepository;

  private constructor() {}

  public static getInstance(): PgCategoryRepository {
    if (!PgCategoryRepository.instance) {
      PgCategoryRepository.instance = new PgCategoryRepository();
    }
    return PgCategoryRepository.instance;
  }

  async findAll(): Promise<ICategory[]> {
    const result = await this.db.select().from(categories);
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<ICategory | null> {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByName(name: string): Promise<ICategory | null> {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.name, name));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async create(categoryData: Omit<ICategory, "id">): Promise<ICategory> {
    const result = await this.db
      .insert(categories)
      .values({
        name: categoryData.name,
        description: categoryData.description || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: number, categoryData: Partial<ICategory>): Promise<ICategory> {
    const updateData: Record<string, any> = {};

    if (categoryData.name !== undefined) updateData.name = categoryData.name;
    if (categoryData.description !== undefined) updateData.description = categoryData.description;

    const result = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return result.length > 0;
  }

  private mapToEntity(raw: any): ICategory {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
    };
  }
}