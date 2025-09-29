# Sistema de Agentes de IA

Este módulo implementa un sistema de agentes de IA para procesar comandos de voz y crear automáticamente transacciones, metas de ahorro y presupuestos.

## Arquitectura

### Componentes Principales

1. **VoiceOrchestratorService**: Orquestador principal que coordina todos los agentes
2. **Agentes Especializados**:
   - `TransactionAgentService`: Maneja creación de gastos e ingresos
   - `GoalAgentService`: Maneja creación de metas de ahorro
   - `BudgetAgentService`: Maneja creación de presupuestos
   - `ValidationAgentService`: Valida y corrige datos extraídos

### Flujo de Procesamiento

1. **Audio Input** → El usuario graba un comando de voz
2. **Transcripción** → OpenAI Whisper convierte audio a texto
3. **Clasificación de Intención** → LLM determina el tipo de comando
4. **Extracción de Datos** → LLM extrae entidades relevantes
5. **Procesamiento por Agente** → El agente especializado procesa los datos
6. **Validación** → Se validan y corrigen los datos extraídos
7. **Respuesta** → Se devuelve la respuesta estructurada al frontend

## Configuración

### Variables de Entorno

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Endpoint

```
POST /voice-command
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- audio: File (audio/wav)
```

### Respuesta

```json
{
  "success": true,
  "intent": "CREATE_TRANSACTION",
  "extractedData": {
    "user_id": 1,
    "amount": 25.50,
    "type": "EXPENSE",
    "description": "Almuerzo en restaurante",
    "category_id": null,
    "payment_method_id": null,
    "date": "2024-01-15T10:30:00.000Z"
  },
  "confidence": 0.95,
  "message": "He identificado una transacción: Gasto de $25.5 en Almuerzo en restaurante",
  "validationErrors": [],
  "suggestedCorrections": {}
}
```

## Ejemplos de Comandos de Voz

### Transacciones
- "Gasté 25 dólares en comida"
- "Recibí 500 dólares de mi trabajo"
- "Pagué 80 dólares en gasolina con mi tarjeta de crédito"

### Metas de Ahorro
- "Quiero ahorrar 1000 dólares para vacaciones hasta diciembre"
- "Crear una meta de 500 dólares para emergencias"
- "Ahorrar para un auto, necesito 15000 dólares"

### Presupuestos
- "Crear un presupuesto de 300 dólares para comida este mes"
- "Quiero limitar mis gastos en entretenimiento a 100 dólares"
- "Presupuesto de 200 dólares para transporte"

## Extensibilidad

Para agregar nuevos tipos de comandos:

1. Agregar nueva intención en `CommandIntent`
2. Crear nuevo agente especializado
3. Agregar lógica en `VoiceOrchestratorService`
4. Actualizar prompts en `OpenAILLMAdapter`
5. Agregar validaciones en `ValidationAgentService` 