import { createRouter } from "@/core/infrastructure/lib/create-app";
import * as routes from "./notification.routes";
import { NotificationService } from "../../application/services/notification.service";
import { PgNotificationRepository } from "../adapters/notification.repository";

const notificationRepository = PgNotificationRepository.getInstance();
const notificationService = NotificationService.getInstance(notificationRepository);

const router = createRouter()
  .openapi(routes.list, notificationService.getAll)
  .openapi(routes.getById, notificationService.getById)
  .openapi(routes.listByUser, notificationService.getByUserId)
  .openapi(routes.listUnreadByUser, notificationService.getUnreadByUserId)
  .openapi(routes.create, notificationService.create)
  .openapi(routes.update, notificationService.update)
  .openapi(routes.delete_, notificationService.delete)
  .openapi(routes.markAsRead, notificationService.markAsRead)
  .openapi(routes.markAllAsRead, notificationService.markAllAsRead);

export default router;
