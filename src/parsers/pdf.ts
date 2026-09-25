import { extractText, getMeta } from 'unpdf';
import { ParsedDocument, ParseOptions } from '../types.js';

export async function parsePdf(
  buffer: Buffer,
  options?: ParseOptions
): Promise<ParsedDocument> {
  // Convert Node Buffer to Uint8Array for unpdf
  const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const { totalPages, text: pageTexts } = await extractText(data, {
    mergePages: false,
  });

  const fullText = (pageTexts as string[])
    .map((pageText, idx) => `--- [Page ${idx + 1}] ---\n${pageText.trim()}`)
    .join('\n\n');

  let metadata: Record<string, unknown> | undefined;
  try {
    const meta = await getMeta(data);
    metadata = {
      ...meta.info,
      totalPages,
    };
  } catch {
    // If metadata extraction fails, we still have the text
    metadata = { totalPages };
  }

  return {
    text: fullText,
    pages: pageTexts as string[],
    totalPages,
    format: 'pdf',
    metadata,
  };
}
