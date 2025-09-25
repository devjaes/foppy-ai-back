import { ICategory } from "../entities/ICategory";

export interface ICategoryRepository {
  findAll(): Promise<ICategory[]>;
  findById(id: number): Promise<ICategory | null>;
  findByName(name: string): Promise<ICategory | null>;
  create(category: Omit<ICategory, "id">): Promise<ICategory>;
  update(id: number, category: Partial<ICategory>): Promise<ICategory>;
  delete(id: number): Promise<boolean>;
}