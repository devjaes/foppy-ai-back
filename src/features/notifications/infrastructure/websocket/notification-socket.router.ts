import { Hono } from 'hono';
import { NotificationSocketService } from './notification-socket.service';
import { createRouter } from '@/core/infrastructure/lib/create-app';
import * as openapi from './notification-socket.openapi';

// Create router for WebSocket endpoints
const router = createRouter();
const notificationSocketService = NotificationSocketService.getInstance();

// WebSocket endpoint for notifications
const { upgrade } = notificationSocketService.createWebSocketMiddleware();
router.get('/notifications/ws', upgrade);

// Endpoint to get WebSocket connection statistics (for monitoring/debugging)
router.openapi(openapi.wsStats, async (c) => {
  return c.json({
    success: true,
    data: {
      totalConnections: notificationSocketService.getTotalConnectionCount(),
    },
    message: 'WebSocket statistics retrieved successfully',
  });
});

export default router;
