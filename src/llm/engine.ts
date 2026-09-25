import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LLMClient, ChatMessage } from './client.js';
import { DEFAULT_ASK_SYSTEM_PROMPT, DEFAULT_EXTRACT_SYSTEM_PROMPT } from './prompts.js';
import { AskOptions, ExtractOptions, ExtractResult } from '../types.js';

/**
 * Strips markdown code blocks (```json ... ```) from model responses if present
 */
function cleanJsonOutput(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

/**
 * Execute a freeform Q&A prompt against document text
 */
export async function executeAsk(
  client: LLMClient,
  documentText: string,
  question: string,
  options: AskOptions = {}
): Promise<string> {
  const systemPrompt = options.systemPrompt || DEFAULT_ASK_SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `<DOCUMENT>\n${documentText}\n</DOCUMENT>\n\n<QUESTION>\n${question}\n</QUESTION>`,
    },
  ];

  const response = await client.chatCompletion({
    messages,
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });

  return response.content.trim();
}

/**
 * Extract guaranteed structured JSON conforming to a Zod schema
 * Includes automated self-healing retries upon schema validation failure.
 */
export async function executeExtract<T extends z.ZodTypeAny>(
  client: LLMClient,
  documentText: string,
  options: ExtractOptions<T>
): Promise<ExtractResult<z.infer<T>>> {
  const rawSchema = zodToJsonSchema(options.schema, 'targetSchema');
  const targetSchema = (rawSchema.definitions?.targetSchema || rawSchema) as Record<string, unknown>;

  // Strip meta fields to conserve tokens and reduce LLM confusion
  delete targetSchema['$schema'];

  const systemPrompt = options.systemPrompt || DEFAULT_EXTRACT_SYSTEM_PROMPT;

  let userPrompt = `<DOCUMENT>\n${documentText}\n</DOCUMENT>\n\n`;
  if (options.prompt) {
    userPrompt += `<INSTRUCTION>\n${options.prompt}\n</INSTRUCTION>\n\n`;
  }
  userPrompt += `<REQUIRED_JSON_SCHEMA>\n${JSON.stringify(targetSchema, null, 2)}\n</REQUIRED_JSON_SCHEMA>`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const maxRetries = options.retries ?? 2;
  let lastRawContent = '';
  let lastError: Error | null = null;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await client.chatCompletion({
      messages,
      model: options.model,
      temperature: options.temperature ?? 0.0,
      maxTokens: options.maxTokens,
      responseFormatJson: true,
    });

    lastRawContent = response.content;
    if (response.usage) {
      totalPromptTokens += response.usage.promptTokens || 0;
      totalCompletionTokens += response.usage.completionTokens || 0;
    }

    try {
      const cleaned = cleanJsonOutput(response.content);
      const jsonObject = JSON.parse(cleaned);

      const parsed = options.schema.safeParse(jsonObject);

      if (parsed.success) {
        return {
          data: parsed.data,
          rawText: lastRawContent,
          usage: {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: totalPromptTokens + totalCompletionTokens,
          },
        };
      } else {
        // Schema mismatch - prepare self-healing corrective prompt
        const errorDetails = parsed.error.issues
          .map((issue) => `Path "${issue.path.join('.')}": ${issue.message}`)
          .join('\n');

        lastError = new Error(`Schema validation failed:\n${errorDetails}`);

        if (attempt < maxRetries) {
          messages.push({ role: 'assistant', content: response.content });
          messages.push({
            role: 'user',
            content: `The response did not match the expected schema. Validation errors:\n${errorDetails}\n\nPlease correct these errors and return ONLY the valid JSON object conforming to the required schema.`,
          });
        }
      }
    } catch (parseErr) {
      const syntaxError = parseErr instanceof Error ? parseErr.message : String(parseErr);
      lastError = new Error(`JSON syntax error: ${syntaxError}`);

      if (attempt < maxRetries) {
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: `Your output was not valid JSON: ${syntaxError}. Please return ONLY a valid, properly escaped JSON object conforming to the schema.`,
        });
      }
    }
  }

  throw new Error(
    `[wparser] Extraction failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}\nRaw Output: ${lastRawContent}`
  );
}
