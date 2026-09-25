import { DocInput, ParseOptions, ParsedDocument } from '../types.js';
import { resolveInput } from './detector.js';
import { parsePdf } from './pdf.js';
import { parseDocx } from './docx.js';
import { parseExcel } from './excel.js';
import { parseText } from './text.js';

export * from './detector.js';
export * from './pdf.js';
export * from './docx.js';
export * from './excel.js';
export * from './text.js';

/**
 * Universal document parser for PDF, DOCX, XLSX, XLS, TXT, MD, CSV, JSON
 */
export async function parseDocument(
  input: DocInput,
  options?: ParseOptions
): Promise<ParsedDocument> {
  const { buffer, format } = await resolveInput(input, options?.format);

  switch (format) {
    case 'pdf':
      return parsePdf(buffer, options);
    case 'docx':
      return parseDocx(buffer, options);
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer, format, options);
    case 'txt':
    case 'md':
    case 'csv':
    case 'json':
    default:
      return parseText(buffer, format, options);
  }
}
