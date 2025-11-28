import { IPlan } from "./IPlan";

export interface ISubscription {
  id: number;
  userId: number;
  planId: number;
  plan?: IPlan | null;
  frequency: string;
  startDate: Date;
  endDate: Date;
  retirementDate?: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

