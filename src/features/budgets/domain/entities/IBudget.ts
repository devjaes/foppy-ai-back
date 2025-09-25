import { ICategory } from "@/categories/domain/entities/ICategory";

export interface IBudget {
	id: number;
	userId: number;
	sharedUserId?: number | null;
	categoryId: number;
	category?: ICategory | null;
	limitAmount: number;
	currentAmount: number;
	month: Date;
	createdAt: Date;
	updatedAt: Date;
}

