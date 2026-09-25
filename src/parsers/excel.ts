import * as XLSX from 'xlsx';
import { ParsedDocument, ParseOptions, SupportedFormat } from '../types.js';

export async function parseExcel(
  buffer: Buffer,
  format: SupportedFormat = 'xlsx',
  _options?: ParseOptions
): Promise<ParsedDocument> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetTexts: string[] = [];
  const sheetNames = workbook.SheetNames;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to markdown table for best LLM comprehension
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    }) as unknown as unknown[][];

    if (!jsonData || jsonData.length === 0) {
      sheetTexts.push(`## Sheet: ${sheetName}\n(Empty sheet)`);
      continue;
    }

    // Build a clean markdown table
    const headers = (jsonData[0] as unknown[]).map((h) => String(h || '').trim());
    const divider = headers.map(() => '---');

    const rows = jsonData.slice(1).map((row) =>
      (row as unknown[]).map((cell) => String(cell ?? '').trim())
    );

    let tableText = `## Sheet: ${sheetName}\n\n`;
    tableText += `| ${headers.join(' | ')} |\n`;
    tableText += `| ${divider.join(' | ')} |\n`;

    for (const row of rows) {
      // Skip completely empty rows
      if (row.every((cell) => cell === '')) continue;
      tableText += `| ${row.join(' | ')} |\n`;
    }

    sheetTexts.push(tableText.trim());
  }

  const fullText = sheetTexts.join('\n\n');

  return {
    text: fullText,
    pages: sheetTexts, // Each sheet = 1 "page"
    totalPages: sheetNames.length,
    format,
    metadata: {
      sheetNames,
      totalSheets: sheetNames.length,
    },
  };
}
