import { DocInput, LLMConfig, ParseOptions, ParsedDocument } from './types.js';
import { parseDocument } from './parsers/index.js';
import { WDocument } from './document.js';
import { LLMClient } from './llm/client.js';

export * from './types.js';
export * from './document.js';
export * from './parsers/index.js';
export * from './llm/index.js';

// Re-export Zod for zero-extra-install convenience
export { z } from 'zod';

export type DocOptions = ParseOptions & LLMConfig;

/**
 * Load any document (PDF, DOCX, TXT, MD, CSV, JSON) from a file path, Buffer, URL, or Blob.
 *
 * @example
 * ```ts
 * import { doc, z } from 'wparser';
 *
 * const document = await doc('./invoice.pdf', {
 *   provider: 'openrouter',
 *   apiKey: process.env.OPENROUTER_API_KEY
 * });
 *
 * const answer = await document.ask('What is the total amount?');
 *
 * const { data } = await document.extract({
 *   schema: z.object({ total: z.number(), vendor: z.string() })
 * });
 * ```
 */
export async function doc(
  input: DocInput,
  options?: DocOptions
): Promise<WDocument> {
  const parsed = await parseDocument(input, options);
  return new WDocument(parsed, options);
}

/**
 * Parse a document into raw text and metadata without initializing an LLM.
 * Fast, pure JavaScript, zero external network calls.
 *
 * @example
 * ```ts
 * import { parse } from 'wparser';
 *
 * const { text, totalPages, format } = await parse('./resume.docx');
 * console.log(text);
 * ```
 */
export async function parse(
  input: DocInput,
  options?: ParseOptions
): Promise<ParsedDocument> {
  return parseDocument(input, options);
}

/**
 * Create a reusable Wparser client with fixed provider and API key configuration.
 *
 * @example
 * ```ts
 * import { createDocClient } from 'wparser';
 *
 * const wparser = createDocClient({
 *   provider: 'gemini',
 *   apiKey: process.env.GEMINI_API_KEY
 * });
 *
 * const myDoc = await wparser.load('./contract.pdf');
 * const summary = await myDoc.ask('Summarize key obligations');
 * ```
 */
export function createDocClient(config?: LLMConfig) {
  const llmClient = new LLMClient(config || {});

  return {
    /**
     * Load a document using the configured LLM client
     */
    async load(input: DocInput, options?: ParseOptions): Promise<WDocument> {
      const parsed = await parseDocument(input, options);
      return new WDocument(parsed, llmClient);
    },

    /**
     * Parse document text directly without LLM
     */
    async parse(input: DocInput, options?: ParseOptions): Promise<ParsedDocument> {
      return parseDocument(input, options);
    },

    /**
     * Access the underlying LLM client
     */
    llm: llmClient,
  };
}

export default doc;
