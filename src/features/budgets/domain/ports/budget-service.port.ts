import {
	CreateRoute,
	DeleteRoute,
	GetByIdRoute,
	GetTransactionsRoute,
	ListByMonthRoute,
	ListByUserRoute,
	ListRoute,
	ListSharedRoute,
	UpdateAmountRoute,
	UpdateRoute,
} from "@/budgets/infrastructure/controllers/budget.routes";
import { AppRouteHandler } from "@/core/infrastructure/types/app-types";

export interface IBudgetService {
	getAll: AppRouteHandler<ListRoute>;
	getById: AppRouteHandler<GetByIdRoute>;
	getByUserId: AppRouteHandler<ListByUserRoute>;
	getByUserIdAndMonth: AppRouteHandler<ListByMonthRoute>;
	getSharedWithUser: AppRouteHandler<ListSharedRoute>;
	create: AppRouteHandler<CreateRoute>;
	update: AppRouteHandler<UpdateRoute>;
	delete: AppRouteHandler<DeleteRoute>;
	updateAmount: AppRouteHandler<UpdateAmountRoute>;
	getTransactions: AppRouteHandler<GetTransactionsRoute>;
}
