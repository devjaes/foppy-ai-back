import { Hono } from "hono";
import { ProcessVoiceCommandUseCase } from "../../application/use-cases/process-voice-command.use-case";
import { VoiceOrchestratorService } from "../../application/services/voice-orchestrator.service";
import { TransactionAgentService } from "../../application/services/transaction-agent.service";
import { GoalAgentService } from "../../application/services/goal-agent.service";
import { BudgetAgentService } from "../../application/services/budget-agent.service";
import { ValidationAgentService } from "../../application/services/validation-agent.service";
import { OpenAITranscriptionAdapter } from "../adapters/openai-transcription.adapter";
import { OpenAILLMAdapter } from "../adapters/openai-llm.adapter";
import { verifyToken } from "@/shared/utils/jwt.util";

const app = new Hono();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const transcriptionService = new OpenAITranscriptionAdapter(OPENAI_API_KEY);
const llmService = new OpenAILLMAdapter(OPENAI_API_KEY);
const transactionAgent = new TransactionAgentService();
const goalAgent = new GoalAgentService();
const budgetAgent = new BudgetAgentService();
const validationAgent = new ValidationAgentService();

const voiceOrchestrator = new VoiceOrchestratorService(
  transcriptionService,
  llmService,
  transactionAgent,
  goalAgent,
  budgetAgent,
  validationAgent
);

const processVoiceCommandUseCase = new ProcessVoiceCommandUseCase(voiceOrchestrator);

app.post("/voice-command", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: "Token de autorización requerido"
      }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return c.json({
        success: false,
        message: "Token inválido"
      }, 401);
    }

 return c.json({
    "success": true,
    "intent": "CREATE_TRANSACTION", 
    "extractedData": {
        "user_id": 1,
        "amount": 25,
        "type": "EXPENSE",
        "description": "desayuno",
        "category_id": null,
        "payment_method_id": null,
        "date": "2025-10-07T13:18:32.623Z"
    },
    "confidence": 0.95,
    "message": "He identificado una transacción: Gasto de $25 en desayuno"
});

    // const user = payload as { id: number; email: string };
    // const body = await c.req?.formData();
    // const audioFile = body?.get("audio") as File;

    // if (!audioFile) {
    //   return c.json({
    //     success: false,
    //     message: "No se recibió archivo de audio"
    //   }, 400);
    // }

    // const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
    //   type: audioFile.type || 'audio/wav' 
    // });

    // const result = await processVoiceCommandUseCase.execute({
    //   audioBlob,
    //   userId: user.id
    // });

    // return c.json({
    //   success: result.success,
    //   intent: result.intent,
    //   extractedData: result.extractedData,
    //   confidence: result.confidence,
    //   message: result.message,
    //   validationErrors: result.validationErrors,
    //   suggestedCorrections: result.suggestedCorrections
    // });

  } catch (error) {
    console.error("Error processing voice command:", error);
    return c.json({
      success: false,
      message: "Error interno del servidor"
    }, 500);
  }
});

export default app; 