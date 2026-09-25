import { z } from 'zod';
import {
  AskOptions,
  ExtractOptions,
  ExtractResult,
  LLMConfig,
  ParsedDocument,
  SupportedFormat,
} from './types.js';
import { LLMClient } from './llm/client.js';
import { executeAsk, executeExtract } from './llm/engine.js';

export class WDocument {
  public readonly text: string;
  public readonly pages: string[];
  public readonly totalPages: number;
  public readonly format: SupportedFormat;
  public readonly metadata?: Record<string, unknown>;

  private llmClient: LLMClient;

  constructor(parsed: ParsedDocument, llmConfig?: LLMConfig | LLMClient) {
    this.text = parsed.text;
    this.pages = parsed.pages;
    this.totalPages = parsed.totalPages;
    this.format = parsed.format;
    this.metadata = parsed.metadata;

    if (llmConfig instanceof LLMClient) {
      this.llmClient = llmConfig;
    } else {
      this.llmClient = new LLMClient(llmConfig || {});
    }
  }

  /**
   * Ask any freeform question about the document
   * @param question - The prompt or question to answer
   * @param options - Optional override for model, temperature, system prompt
   */
  async ask(question: string, options: AskOptions = {}): Promise<string> {
    return executeAsk(this.llmClient, this.text, question, options);
  }

  /**
   * Extract guaranteed structured JSON validated with a Zod schema
   * @param options - Extraction configuration including Zod schema, custom prompt, retries
   * @returns Object containing validated { data, rawText, usage }
   */
  async extract<T extends z.ZodTypeAny>(
    options: ExtractOptions<T>
  ): Promise<ExtractResult<z.infer<T>>> {
    return executeExtract(this.llmClient, this.text, options);
  }

  /**
   * Convenience method to extract and directly return only the validated data
   */
  async extractData<T extends z.ZodTypeAny>(
    options: ExtractOptions<T>
  ): Promise<z.infer<T>> {
    const res = await this.extract(options);
    return res.data;
  }
}
