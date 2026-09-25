import process from 'node:process';
import { LLMConfig, LLMProvider } from '../types.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export class LLMClient {
  private provider: LLMProvider;
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: LLMConfig = {}) {
    // 1. Resolve Provider
    if (config.provider) {
      this.provider = config.provider;
    } else if (config.apiKey && config.apiKey.startsWith('sk-or-')) {
      this.provider = 'openrouter';
    } else if (process.env.OPENROUTER_API_KEY) {
      this.provider = 'openrouter';
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = 'openai';
    } else if (process.env.GEMINI_API_KEY) {
      this.provider = 'gemini';
    } else {
      this.provider = 'openai'; // default fallback
    }

    // 2. Resolve API Key
    this.apiKey =
      config.apiKey ||
      (this.provider === 'openrouter'
        ? process.env.OPENROUTER_API_KEY || ''
        : this.provider === 'gemini'
        ? process.env.GEMINI_API_KEY || ''
        : process.env.OPENAI_API_KEY || '');

    // 3. Resolve Base URL & Default Model
    switch (this.provider) {
      case 'openrouter':
        this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1';
        this.defaultModel = config.model || 'openai/gpt-4o-mini';
        break;
      case 'gemini':
        this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta/openai';
        this.defaultModel = config.model || 'gemini-1.5-flash';
        break;
      case 'custom':
        this.baseURL = config.baseURL || 'http://localhost:11434/v1';
        this.defaultModel = config.model || 'llama3';
        break;
      case 'openai':
      default:
        this.baseURL = config.baseURL || 'https://api.openai.com/v1';
        this.defaultModel = config.model || 'gpt-4o-mini';
        break;
    }

    if (config.model) {
      this.defaultModel = config.model;
    }

    // 4. Default Headers
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...(this.provider === 'openrouter'
        ? {
            'HTTP-Referer': 'https://github.com/wparser/wparser',
            'X-Title': 'Wparser Document AI',
          }
        : {}),
      ...(config.headers || {}),
    };
  }

  public getProvider(): LLMProvider {
    return this.provider;
  }

  public getModel(): string {
    return this.defaultModel;
  }

  /**
   * Send chat completion request to the provider
   */
  async chatCompletion(params: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormatJson?: boolean;
  }): Promise<CompletionResponse> {
    if (!this.apiKey && this.provider !== 'custom') {
      const envKey =
        this.provider === 'openrouter'
          ? 'OPENROUTER_API_KEY'
          : this.provider === 'gemini'
          ? 'GEMINI_API_KEY'
          : 'OPENAI_API_KEY';
      throw new Error(
        `[wparser] Missing API key for provider "${this.provider}". Please set the ${envKey} environment variable or pass { apiKey: "..." } to wparser.`
      );
    }

    const endpoint = `${this.baseURL.replace(/\/+$/, '')}/chat/completions`;
    const model = params.model || this.defaultModel;

    const payload: Record<string, unknown> = {
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.1,
    };

    if (params.maxTokens) {
      payload.max_tokens = params.maxTokens;
    }

    if (params.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMsg = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorText;
      } catch {
        // use raw errorText
      }
      throw new Error(`[wparser] API Error (${res.status} from ${this.provider}): ${errorMsg}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }
}
