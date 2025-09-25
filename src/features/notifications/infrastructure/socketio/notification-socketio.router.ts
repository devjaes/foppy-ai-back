import { createRouter } from "@/core/infrastructure/lib/create-app";
import { NotificationSocketIOService } from "./notification-socketio.service";

// Crear router para los endpoints de Socket.IO
const router = createRouter();

// Endpoint para obtener estadísticas de conexiones Socket.IO
router.get("/socketio/stats", async (c) => {
  const socketIoService = NotificationSocketIOService.getInstance();
  return c.json({
    success: true,
    data: {
      totalConnections: socketIoService.getTotalConnectionCount(),
    },
    message: "Socket.IO statistics retrieved successfully",
  });
});

export default router;
