import { eq, and, lt, desc } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { notifications } from "@/schema";
import {
  INotification,
  NotificationType,
} from "../../domain/entities/INotification";
import { INotificationRepository } from "../../domain/ports/notification-repository.port";

export class PgNotificationRepository implements INotificationRepository {
  private db = DatabaseConnection.getInstance().db;
  private static instance: PgNotificationRepository;

  private constructor() {}

  public static getInstance(): PgNotificationRepository {
    if (!PgNotificationRepository.instance) {
      PgNotificationRepository.instance = new PgNotificationRepository();
    }
    return PgNotificationRepository.instance;
  }

  async findAll(): Promise<INotification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.created_at))
      .limit(500); // Limit to last 500 notifications for admin purposes
    return result.map(this.mapToEntity);
  }

  async findById(id: number): Promise<INotification | null> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUserId(userId: number): Promise<INotification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at))
      .limit(100); // Limit to last 100 notifications

    return result.map(this.mapToEntity);
  }

  async findUnreadByUserId(userId: number): Promise<INotification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.user_id, userId), eq(notifications.read, false))
      )
      .orderBy(desc(notifications.created_at))
      .limit(50); // Limit to last 50 unread notifications

    return result.map(this.mapToEntity);
  }

  async create(
    notificationData: Omit<
      INotification,
      "id" | "createdAt" | "updatedAt" | "read"
    >
  ): Promise<INotification> {
    const result = await this.db
      .insert(notifications)
      .values({
        user_id: notificationData.userId,
        title: notificationData.title,
        subtitle: notificationData.subtitle || null,
        message: notificationData.message,
        read: false,
        type: notificationData.type,
        expires_at: notificationData.expiresAt || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(
    id: number,
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    const updateData: Record<string, any> = {};

    if (notificationData.title !== undefined)
      updateData.title = notificationData.title;
    if (notificationData.subtitle !== undefined)
      updateData.subtitle = notificationData.subtitle;
    if (notificationData.message !== undefined)
      updateData.message = notificationData.message;
    if (notificationData.read !== undefined)
      updateData.read = notificationData.read;
    if (notificationData.type !== undefined)
      updateData.type = notificationData.type;
    if (notificationData.expiresAt !== undefined)
      updateData.expires_at = notificationData.expiresAt;

    const result = await this.db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();

    return result.length > 0;
  }

  async markAsRead(id: number): Promise<INotification> {
    const result = await this.db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    return this.mapToEntity(result[0]);
  }

  async markAllAsRead(userId: number): Promise<boolean> {
    const result = await this.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.user_id, userId), eq(notifications.read, false))
      )
      .returning();

    return result.length > 0;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(notifications)
      .where(and(lt(notifications.expires_at, now)))
      .returning();

    return result.length;
  }

  async findByUserIdAndType(
    userId: number,
    type: NotificationType,
    afterDate?: Date
  ): Promise<INotification[]> {
    let conditions = and(
      eq(notifications.user_id, userId),
      eq(notifications.type, type)
    );

    if (afterDate) {
      conditions = and(conditions, lt(notifications.created_at, afterDate));
    }

    const result = await this.db.select().from(notifications).where(conditions);

    return result.map(this.mapToEntity);
  }

  /**
   * Find notifications by user, type and title pattern created after a specific date
   * Used to prevent duplicate notifications
   */
  async findRecentByUserTypeAndTitle(
    userId: number,
    type: NotificationType,
    titlePattern: string,
    afterDate: Date
  ): Promise<INotification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.user_id, userId), eq(notifications.type, type))
      );

    // Filter by date and title pattern in memory
    return result
      .map(this.mapToEntity)
      .filter(
        (n) => n.createdAt >= afterDate && n.title.includes(titlePattern)
      );
  }

  private mapToEntity(raw: any): INotification {
    return {
      id: raw.id,
      userId: raw.user_id,
      title: raw.title,
      subtitle: raw.subtitle,
      message: raw.message,
      read: raw.read,
      type: raw.type as NotificationType,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      expiresAt: raw.expires_at,
    };
  }
}
