import { eq, and, lt } from "drizzle-orm";
import DatabaseConnection from "@/core/infrastructure/database";
import { notifications } from "@/schema";
import { INotification, NotificationType } from "../../domain/entities/INotification";
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
    const result = await this.db.select().from(notifications);
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
      .where(eq(notifications.user_id, userId));

    return result.map(this.mapToEntity);
  }

  async findUnreadByUserId(userId: number): Promise<INotification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.read, false)
        )
      );

    return result.map(this.mapToEntity);
  }

  async create(notificationData: Omit<INotification, "id" | "createdAt">): Promise<INotification> {
    const result = await this.db
      .insert(notifications)
      .values({
        user_id: notificationData.userId,
        title: notificationData.title,
        subtitle: notificationData.subtitle || null,
        message: notificationData.message,
        read: notificationData.read,
        type: notificationData.type,
        expires_at: notificationData.expiresAt || null,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: number, notificationData: Partial<INotification>): Promise<INotification> {
    const updateData: Record<string, any> = {};

    if (notificationData.title !== undefined) updateData.title = notificationData.title;
    if (notificationData.subtitle !== undefined) updateData.subtitle = notificationData.subtitle;
    if (notificationData.message !== undefined) updateData.message = notificationData.message;
    if (notificationData.read !== undefined) updateData.read = notificationData.read;
    if (notificationData.type !== undefined) updateData.type = notificationData.type;
    if (notificationData.expiresAt !== undefined) updateData.expires_at = notificationData.expiresAt;

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
        and(
          eq(notifications.user_id, userId),
          eq(notifications.read, false)
        )
      )
      .returning();

    return result.length > 0;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(notifications)
      .where(
        and(
          lt(notifications.expires_at, now)
        )
      )
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
      conditions = and(
        conditions,
        lt(notifications.created_at, afterDate)
      );
    }
    
    const result = await this.db
      .select()
      .from(notifications)
      .where(conditions);

    return result.map(this.mapToEntity);
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
