import OpenAI from "openai";

export class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI;

  private constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  async generateRecommendation(prompt: string): Promise<any> {
    try {
      const response = await this.client.chat.completions.create(
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a financial advisor assistant. Provide concise, actionable advice in Spanish. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        },
        {
          timeout: 30000,
        }
      );

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }
}

export const openAIClient = OpenAIClient.getInstance();
