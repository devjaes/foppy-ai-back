import { verifyToken } from "@/shared/utils/jwt.util";
import { INotification } from "../../domain/entities/INotification";
import { NotificationApiAdapter } from "../adapters/notification-api.adapter";
import { Server } from "socket.io";

export class NotificationSocketIOService {
  private static instance: NotificationSocketIOService;
  private io: Server | null = null;
  private userSockets: Map<number, string[]> = new Map();

  private constructor() {}

  public static getInstance(): NotificationSocketIOService {
    if (!NotificationSocketIOService.instance) {
      NotificationSocketIOService.instance = new NotificationSocketIOService();
    }
    return NotificationSocketIOService.instance;
  }

  public initialize(server: any): void {
    if (this.io) return;

    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:3001", "http://localhost:3000", "*"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    console.log("Socket.IO server initialized with CORS settings");
  }

  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log("New socket connection:", socket.id);

      socket.on("authenticate", async (token: string) => {
        try {
          const payload = await verifyToken(token);
          
          if (!payload) {
            socket.emit("auth_error", "Invalid token");
            return;
          }

          const userId = payload.id;

          socket.data.userId = userId;
          
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, []);
          }
          this.userSockets.get(userId)?.push(socket.id);

          socket.emit("authenticated", {
            success: true,
            message: "Authentication successful"
          });

          console.log(`User ${userId} authenticated on Socket.IO`);
        } catch (error) {
          console.error("Socket.IO authentication failed:", error);
          socket.emit("auth_error", "Authentication failed");
        }
      });

      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        
        if (userId) {
          const userSocketIds = this.userSockets.get(userId) || [];
          const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);
          
          if (updatedSocketIds.length > 0) {
            this.userSockets.set(userId, updatedSocketIds);
          } else {
            this.userSockets.delete(userId);
          }
          
          console.log(`Socket disconnected for user ${userId}`);
        } else {
          console.log("Socket disconnected (unauthenticated)");
        }
      });
    });
  }

  public broadcastNotification(userId: number, notification: INotification): void {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    const socketIds = this.userSockets.get(userId) || [];
    if (socketIds.length === 0) {
      return;
    }

    const payload = {
      type: "notification",
      data: NotificationApiAdapter.toApiResponse(notification)
    };

    socketIds.forEach(socketId => {
      this.io?.to(socketId).emit("notification", payload);
    });
  }

  public getConnectionCount(userId: number): number {
    return this.userSockets.get(userId)?.length || 0;
  }

  public getTotalConnectionCount(): number {
    let total = 0;
    this.userSockets.forEach(socketIds => {
      total += socketIds.length;
    });
    return total;
  }
}
