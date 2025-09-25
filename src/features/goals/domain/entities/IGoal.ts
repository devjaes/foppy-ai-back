import { ICategory } from "@/categories/domain/entities/ICategory";

export interface IGoal {
	id: number;
	userId: number;
	sharedUserId?: number | null;
	name: string;
	targetAmount: number;
	currentAmount: number;
	endDate: Date;
	categoryId?: number | null;
	category?: ICategory | null;
	contributionFrequency?: number | null;
	contributionAmount?: number | null;
	createdAt: Date;
	updatedAt: Date;
}
