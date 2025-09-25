import { AppRouteHandler } from "@/core/infrastructure/types/app-types";
import {
  CreateRoute,
  DeleteRoute,
  GetByIdRoute,
  ListByUserRoute,
  ListUnreadByUserRoute,
  ListRoute,
  MarkAsReadRoute,
  MarkAllAsReadRoute,
  UpdateRoute
} from "../../infrastructure/controllers/notification.routes";

export interface INotificationService {
  getAll: AppRouteHandler<ListRoute>;
  getById: AppRouteHandler<GetByIdRoute>;
  getByUserId: AppRouteHandler<ListByUserRoute>;
  getUnreadByUserId: AppRouteHandler<ListUnreadByUserRoute>;
  create: AppRouteHandler<CreateRoute>;
  update: AppRouteHandler<UpdateRoute>;
  delete: AppRouteHandler<DeleteRoute>;
  markAsRead: AppRouteHandler<MarkAsReadRoute>;
  markAllAsRead: AppRouteHandler<MarkAllAsReadRoute>;
}
