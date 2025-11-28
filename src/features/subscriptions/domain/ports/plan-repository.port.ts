import { IPlan } from "../entities/IPlan";

export interface IPlanRepository {
  findAll(): Promise<IPlan[]>;
  findById(id: number): Promise<IPlan | null>;
  findByName(name: string): Promise<IPlan | null>;
}

