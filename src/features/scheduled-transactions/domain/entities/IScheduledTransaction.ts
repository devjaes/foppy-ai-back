export interface IScheduledTransaction {
	id: number;
	userId: number;
	name: string;
	amount: number;
	categoryId?: number | null;
	category?: {
		id: number;
		name: string;
		description?: string | null;
	} | null;
	description?: string | null;
	paymentMethodId?: number | null;
	frequency: string;
	nextExecutionDate: Date;
	active: boolean;
}
