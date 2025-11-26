export interface IPlan {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  frequency: string;
  description: string | null;
  features: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

