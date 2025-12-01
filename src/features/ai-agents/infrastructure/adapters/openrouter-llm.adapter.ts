import { ILLMService } from "../../domain/ports/transcription.port";

export class OpenRouterLLMAdapter implements ILLMService {
  private apiKey: string;
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async classifyIntent(transcription: string): Promise<{ intent: string; confidence: number }> {
    const prompt = `
Analiza el siguiente texto y determina la intención del usuario. Las opciones son:
- CREATE_TRANSACTION: Para crear gastos o ingresos
- CREATE_GOAL: Para crear metas de ahorro
- CREATE_BUDGET: Para crear presupuestos
- UNKNOWN: Si no es claro

Texto: "${transcription}"

Responde SOLO con un JSON en este formato:
{"intent": "CREATE_TRANSACTION", "confidence": 0.95}
`;

    try {
      const response = await this.callOpenRouter(prompt);
      const result = JSON.parse(response);
      return {
        intent: result.intent || 'UNKNOWN',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Error classifying intent:', error);
      return { intent: 'UNKNOWN', confidence: 0 };
    }
  }

  async extractData(transcription: string, intent: string): Promise<{ data: Record<string, any>; confidence: number }> {
    let prompt = 'category_id=1,comida;2,viajes;3,education;4,otro\n';

    switch (intent) {
      case 'CREATE_TRANSACTION':
        prompt = `
Extrae los datos de transacción del siguiente texto:
"${transcription}"

Responde SOLO con un JSON con estos campos:
{
  "amount": número,
  "type": "INCOME" o "EXPENSE",
  "description": "descripción",
  "category_id": "nombre de categoría si se menciona",
  "payment_method": "método de pago si se menciona",
  "confidence": 0.0-1.0
}
`;
        break;

      case 'CREATE_GOAL':
        prompt = `
Extrae los datos de meta de ahorro del siguiente texto:
"${transcription}"

Responde SOLO con un JSON con estos campos:
{
  "name": "nombre de la meta",
  "target_amount": número,
  "end_date": "fecha en formato ISO si se menciona",
  "contribution_amount": número si se menciona,
  "confidence": 0.0-1.0
}
`;
        break;

      case 'CREATE_BUDGET':
        prompt = `
Extrae los datos de presupuesto del siguiente texto:
"${transcription}"

Responde SOLO con un JSON con estos campos:
{
  "limit_amount": número,
  "category": "nombre de categoría",
  "month": "mes/año si se menciona",
  "confidence": 0.0-1.0,
  "category_id": id de la categoria segun corresponda
}
`;
        break;

      default:
        return { data: {}, confidence: 0 };
    }

    try {
      const response = await this.callOpenRouter(prompt);
      const result = JSON.parse(response);
      const confidence = result.confidence || 0.8;
      delete result.confidence;
      
      return {
        data: result,
        confidence
      };
    } catch (error) {
      console.error('Error extracting data:', error);
      return { data: {}, confidence: 0 };
    }
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const systemPrompt = 'Eres un asistente especializado en finanzas personales. Responde siempre con JSON válido.';
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://foppy.app', // Optional: your app URL
        'X-Title': 'Foppy Finance Assistant', // Optional: your app name
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free', // Free Grok model from X.AI
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content?.trim() || '{}';
  }
}
