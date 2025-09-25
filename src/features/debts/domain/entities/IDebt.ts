import { ICategory } from "@/categories/domain/entities/ICategory";
import { IUser } from "@/users/domain/entities/IUser";

export interface IDebt {
	id: number;
	userId: number;
	description: string;
	originalAmount: number;
	pendingAmount: number;
	dueDate: Date;
	paid: boolean;
	creditorId?: number | null;
	categoryId?: number | null;
	category?: ICategory | null;
	creditor?: IUser | null;
	createdAt: Date;
	updatedAt: Date;
}
