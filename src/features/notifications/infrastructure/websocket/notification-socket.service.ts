import { Hono } from "hono";
import { verifyToken } from "@/shared/utils/jwt.util";
import { INotification } from "../../domain/entities/INotification";
import { NotificationApiAdapter } from "../adapters/notification-api.adapter";
type CreateBunWebSocket = typeof import("hono/bun").createBunWebSocket;

const isBunRuntime =
  typeof (globalThis as any).Bun !== "undefined" &&
  typeof (globalThis as any).Bun?.serve === "function";

let createBunWebSocketFn: CreateBunWebSocket | null = null;

if (isBunRuntime) {
  const bunModule = await import("hono/bun");
  createBunWebSocketFn = bunModule.createBunWebSocket;
}

/**
 * Service for managing WebSocket connections for real-time notifications
 */
export class NotificationSocketService {
  private static instance: NotificationSocketService;
  // Use a more generic type for WebSocket to work with Bun
  private connections: Map<number, Set<any>> = new Map();

  private constructor() {}

  public static getInstance(): NotificationSocketService {
    if (!NotificationSocketService.instance) {
      NotificationSocketService.instance = new NotificationSocketService();
    }
    return NotificationSocketService.instance;
  }

  /**
   * Create WebSocket middleware for Hono with Bun
   */
  public createWebSocketMiddleware(): {
    upgrade: any;
    websocket?: any;
  } {
    if (!createBunWebSocketFn) {
      const fallback = (c: any) =>
        c.json(
          {
            success: false,
            message:
              "WebSocket no disponible en este entorno (requiere runtime Bun)",
          },
          501
        );
      return { upgrade: fallback };
    }

    const { upgradeWebSocket, websocket } = createBunWebSocketFn();

    // Using bind to preserve 'this' context in the callback
    const upgrade = upgradeWebSocket((c) => {
      let userId: number | null = null;
      const self = this; // Store reference to the class instance

      return {
        onOpen(event, ws) {
          console.log("WebSocket connection established");
        },

        onMessage: async (event, ws) => {
          try {
            const message = JSON.parse(event.data.toString());

            // Handle authentication message
            if (message.type === "auth") {
              const token = message.token;
              try {
                // Use the verifyToken utility function
                const payload = await verifyToken(token);

                if (!payload) {
                  throw new Error("Invalid token");
                }

                userId = payload.id;

                // Add connection to the user's set of connections
                if (!self.connections.has(userId!)) {
                  self.connections.set(userId!, new Set());
                }
                self.connections.get(userId!)?.add(ws);

                // Send acknowledgment
                ws.send(
                  JSON.stringify({
                    type: "auth",
                    status: "success",
                    message: "Authentication successful",
                  })
                );

                console.log(`User ${userId} authenticated on WebSocket`);
              } catch (error) {
                console.error("WebSocket authentication failed:", error);
                ws.send(
                  JSON.stringify({
                    type: "auth",
                    status: "error",
                    message: "Authentication failed",
                  })
                );
              }
            }
          } catch (error) {
            console.error("Error processing WebSocket message:", error);
          }
        },

        onClose: (event, ws) => {
          if (userId) {
            // Remove connection from user's connections
            const userConnections = self.connections.get(userId);
            if (userConnections) {
              userConnections.delete(ws);
              if (userConnections.size === 0) {
                self.connections.delete(userId);
              }
            }
            console.log(`WebSocket connection closed for user ${userId}`);
          } else {
            console.log("WebSocket connection closed (unauthenticated)");
          }
        },
      };
    });

    // Return both the upgradeWebSocket middleware and the websocket handler
    return { upgrade, websocket };
  }

  /**
   * Register WebSocket route on a Hono app
   * @param app Hono app instance
   * @param path WebSocket endpoint path
   * @returns The websocket handler to be exported as part of the app
   */
  public registerWebSocketRoute(
    app: Hono,
    path: string = "/notifications"
  ): any {
    const { upgrade, websocket } = this.createWebSocketMiddleware();

    // Register the WebSocket route with the app
    app.get(path, upgrade);

    // Return the websocket handler that should be exported as part of the app
    return websocket;
  }

  /**
   * Broadcast a notification to a specific user via WebSocket
   * @param userId The user ID to send the notification to
   * @param notification The notification to broadcast
   */
  public broadcastNotification(
    userId: number,
    notification: INotification
  ): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return; // No active connections for this user
    }

    const payload = JSON.stringify({
      type: "notification",
      data: NotificationApiAdapter.toApiResponse(notification),
    });

    userConnections.forEach((connection) => {
      // In Bun WebSocket, 1 represents OPEN state
      if (connection.readyState === 1) {
        connection.send(payload);
      }
    });
  }

  /**
   * Get the number of active connections for a user
   * @param userId The user ID to check
   * @returns The number of active connections
   */
  public getConnectionCount(userId: number): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get the total number of active connections
   * @returns The total number of active connections
   */
  public getTotalConnectionCount(): number {
    let total = 0;
    this.connections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }
}
