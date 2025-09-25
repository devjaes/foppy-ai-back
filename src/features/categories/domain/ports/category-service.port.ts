import { ListRoute, GetByIdRoute, CreateRoute, UpdateRoute, DeleteRoute } from "@/categories/infrastructure/controllers/category.routes";
import { AppRouteHandler } from "@/core/infrastructure/types/app-types";

export interface ICategoryService {
  getAll: AppRouteHandler<ListRoute>;
  getById: AppRouteHandler<GetByIdRoute>;
  create: AppRouteHandler<CreateRoute>;
  update: AppRouteHandler<UpdateRoute>;
  delete: AppRouteHandler<DeleteRoute>; 
}