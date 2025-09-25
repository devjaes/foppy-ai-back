import { INotification } from "../entities/INotification";

export interface INotificationRepository {
  findAll(): Promise<INotification[]>;
  findById(id: number): Promise<INotification | null>;
  findByUserId(userId: number): Promise<INotification[]>;
  findUnreadByUserId(userId: number): Promise<INotification[]>;
  create(notification: Omit<INotification, "id" | "createdAt">): Promise<INotification>;
  update(id: number, notification: Partial<INotification>): Promise<INotification>;
  delete(id: number): Promise<boolean>;
  markAsRead(id: number): Promise<INotification>;
  markAllAsRead(userId: number): Promise<boolean>;
  deleteExpired(): Promise<number>;
}
