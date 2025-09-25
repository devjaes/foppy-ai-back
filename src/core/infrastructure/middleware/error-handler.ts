import { Context } from "hono";
import { StatusCode } from "hono/utils/http-status";
import { AppBindings } from "../types/app-types";

/**
 * Middleware personalizado para manejar errores y registrar stack traces
 * @returns Middleware para manejar errores
 */
export function errorHandler() {
  return async (err: Error, c: Context<AppBindings>) => {
    // Registrar el error con el stack trace completo
    console.error("Error ocurrido:", {
      message: err.message,
      stack: err.stack,
      path: c.req.path,
      method: c.req.method,
    });

    // Si es un error con statusCode, usar ese código
    const statusCode = (err as any).statusCode as StatusCode || 500;
    
    // Devolver respuesta JSON con detalles del error
    return c.json(
      {
        message: err.message,
        error: true,
        path: c.req.path,
        statusCode,
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  };
}
