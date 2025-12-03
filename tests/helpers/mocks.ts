/**
 * Mocks para servicios externos
 */

export const mockEmailService = {
  sendEmail: async (to: string, subject: string, body: string) => {
    // Mock implementation - no envía emails reales
    return { success: true };
  },
  sendPasswordResetEmail: async (email: string, token: string) => {
    return { success: true };
  },
};

export const mockNotificationService = {
  create: async (notification: any) => {
    return { id: 1, ...notification };
  },
  findByUserId: async (userId: number) => {
    return [];
  },
};

/**
 * Mock para servicios de IA/LLM
 */
export const mockLLMService = {
  generateRecommendation: async (prompt: string) => {
    return "Mock recommendation";
  },
  transcribeAudio: async (audio: Buffer) => {
    return "Mock transcription";
  },
};
