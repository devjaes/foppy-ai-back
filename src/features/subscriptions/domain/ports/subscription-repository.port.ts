import { ISubscription } from "../entities/ISubscription";

export interface ISubscriptionRepository {
  findByUserId(userId: number): Promise<ISubscription | null>;
  findById(id: number): Promise<ISubscription | null>;
  create(subscription: Omit<ISubscription, "id" | "createdAt" | "updatedAt">): Promise<ISubscription>;
  update(id: number, subscription: Partial<ISubscription>): Promise<ISubscription>;
  cancel(id: number, retirementDate: Date): Promise<ISubscription>;
}

