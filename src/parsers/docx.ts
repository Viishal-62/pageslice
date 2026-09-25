import mammoth from 'mammoth';
import { ParsedDocument, ParseOptions } from '../types.js';

export async function parseDocx(
  buffer: Buffer,
  _options?: ParseOptions
): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value.trim();

  // Split into rough sections/paragraphs for pages array
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    text: rawText,
    pages: [rawText], // DOCX doesn't have fixed pagination in raw xml
    totalPages: 1,
    format: 'docx',
    metadata: {
      paragraphCount: paragraphs.length,
      warnings: result.messages.map((m) => m.message),
    },
  };
}
