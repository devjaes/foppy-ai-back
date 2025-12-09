import { ILLMService } from "../../domain/ports/transcription.port";
import { OpenAILLMAdapter } from "../adapters/openai-llm.adapter";
import { OpenRouterLLMAdapter } from "../adapters/openrouter-llm.adapter";

export type LLMProvider = "openai" | "openrouter";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
}

/**
 * Factory para crear instancias de servicios LLM según el proveedor
 * Implementa el patrón Strategy para permitir cambiar entre diferentes proveedores
 */
export class LLMFactory {
  /**
   * Crea una instancia del servicio LLM según el proveedor especificado
   * @param config - Configuración con el proveedor y API key
   * @returns Instancia del servicio LLM
   * @throws Error si el proveedor no es válido o falta la API key
   */
  static create(config: LLMConfig): ILLMService {
    if (!config.apiKey) {
      throw new Error(`API key is required for ${config.provider}`);
    }

    switch (config.provider) {
      case "openai":
        return new OpenAILLMAdapter(config.apiKey);

      case "openrouter":
        return new OpenRouterLLMAdapter(config.apiKey);

      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }

  /**
   * Crea una instancia con fallback automático
   * Intenta usar el proveedor primario, y si falla, usa el secundario
   * @param primaryConfig - Configuración del proveedor primario
   * @param fallbackConfig - Configuración del proveedor de respaldo
   * @returns Instancia del servicio LLM
   */
  static createWithFallback(
    primaryConfig: LLMConfig,
    fallbackConfig: LLMConfig
  ): ILLMService {
    try {
      return this.create(primaryConfig);
    } catch (error) {
      console.warn(
        `Failed to create primary LLM provider (${primaryConfig.provider}), using fallback (${fallbackConfig.provider})`,
        error
      );
      return this.create(fallbackConfig);
    }
  }
}
