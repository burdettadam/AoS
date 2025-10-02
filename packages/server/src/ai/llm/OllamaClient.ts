import { logger } from "../../utils/logger";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel: string = "deepseek-r1:7b") {
    // Use environment variable for Docker, fallback to localhost for development
    this.baseUrl =
      baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.defaultModel = defaultModel;
  }

  /**
   * Generate a response using Ollama chat API
   */
  async chat(
    messages: OllamaMessage[],
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    },
  ): Promise<string> {
    const model = options?.model || this.defaultModel;

    const request: OllamaGenerateRequest = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 500,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaResponse;
      return data.message.content.trim();
    } catch (error) {
      logger.error("Failed to get response from Ollama:", error);
      throw error;
    }
  }

  /**
   * Check if Ollama server is available and model is loaded
   */
  async healthCheck(model?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;

      const data = (await response.json()) as {
        models: Array<{ name: string }>;
      };
      const models = data.models?.map((m) => m.name) || [];

      const targetModel = model || this.defaultModel;
      const isModelAvailable = models.some((m: string) =>
        m.includes(targetModel.split(":")[0]),
      );

      logger.info(
        `Ollama health check - Available models: ${models.join(", ")}`,
      );
      return isModelAvailable;
    } catch (error) {
      logger.error("Ollama health check failed:", error);
      return false;
    }
  }

  /**
   * Pull a model if it's not already available
   */
  async ensureModel(model?: string): Promise<boolean> {
    const targetModel = model || this.defaultModel;

    try {
      // Check if model exists first
      const isAvailable = await this.healthCheck(targetModel);
      if (isAvailable) {
        logger.info(`Model ${targetModel} is already available`);
        return true;
      }

      logger.info(`Pulling model ${targetModel}...`);
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: targetModel }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      // Wait for pull to complete (this is a simplified approach)
      // In production, you'd want to handle the streaming response properly
      await new Promise((resolve) => setTimeout(resolve, 10000));

      return await this.healthCheck(targetModel);
    } catch (error) {
      logger.error(`Failed to ensure model ${targetModel}:`, error);
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = (await response.json()) as {
        models: Array<{ name: string }>;
      };
      return data.models?.map((m) => m.name) || [];
    } catch (error) {
      logger.error("Failed to list models:", error);
      return [];
    }
  }
}
