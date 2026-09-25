import { z } from 'zod';

export type SupportedFormat = 'pdf' | 'docx' | 'xlsx' | 'xls' | 'txt' | 'md' | 'csv' | 'json' | 'auto';

export type DocInput =
  | string
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | Blob
  | URL;

export interface ParseOptions {
  format?: SupportedFormat;
  password?: string; // for protected PDFs
}

export interface ParsedDocument {
  text: string;
  pages: string[];
  totalPages: number;
  format: SupportedFormat;
  metadata?: Record<string, unknown>;
}

export type LLMProvider = 'openai' | 'gemini' | 'openrouter' | 'custom';

export interface LLMConfig {
  provider?: LLMProvider;
  apiKey?: string;
  model?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
}

export interface AskOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ExtractOptions<T extends z.ZodTypeAny = z.ZodTypeAny> {
  schema: T;
  prompt?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
}

export interface ExtractResult<T> {
  data: T;
  rawText: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
