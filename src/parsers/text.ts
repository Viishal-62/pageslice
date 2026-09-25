import { ParsedDocument, ParseOptions, SupportedFormat } from '../types.js';

export async function parseText(
  buffer: Buffer,
  format: SupportedFormat = 'txt',
  _options?: ParseOptions
): Promise<ParsedDocument> {
  const text = buffer.toString('utf-8').trim();

  let metadata: Record<string, unknown> = {
    characterCount: text.length,
    lineCount: text.split('\n').length,
  };

  if (format === 'json') {
    try {
      const parsed = JSON.parse(text);
      metadata = {
        ...metadata,
        isJsonObject: typeof parsed === 'object' && parsed !== null,
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [],
      };
    } catch {
      // Keep original text even if invalid json
    }
  }

  return {
    text,
    pages: [text],
    totalPages: 1,
    format,
    metadata,
  };
}
