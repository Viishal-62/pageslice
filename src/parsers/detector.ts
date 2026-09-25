import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DocInput, SupportedFormat } from '../types.js';

export interface ResolvedInput {
  buffer: Buffer;
  format: SupportedFormat;
  sourceName?: string;
}

/**
 * Inspect magic bytes from a buffer to identify format
 */
export function detectFormatFromBytes(buffer: Uint8Array): SupportedFormat {
  if (buffer.length >= 4) {
    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return 'pdf';
    }

    // DOCX / ZIP: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    if (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      return 'docx';
    }
  }

  // Check if it might be JSON
  const sample = Buffer.from(buffer.slice(0, 50)).toString('utf-8').trim();
  if (sample.startsWith('{') || sample.startsWith('[')) {
    return 'json';
  }

  return 'txt';
}

/**
 * Determine format from file path or URL extension
 */
export function detectFormatFromExtension(filepathOrUrl: string): SupportedFormat | null {
  try {
    const cleanPath = filepathOrUrl.split('?')[0].split('#')[0];
    const ext = path.extname(cleanPath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return 'pdf';
      case '.docx':
      case '.doc':
        return 'docx';
      case '.xlsx':
        return 'xlsx';
      case '.xls':
        return 'xls';
      case '.txt':
        return 'txt';
      case '.md':
      case '.markdown':
        return 'md';
      case '.csv':
        return 'csv';
      case '.json':
        return 'json';
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Resolves any valid DocInput into a normalized Buffer and detected format
 */
export async function resolveInput(
  input: DocInput,
  explicitFormat?: SupportedFormat
): Promise<ResolvedInput> {
  let buffer: Buffer;
  let sourceName: string | undefined;
  let detectedFormat: SupportedFormat | null = null;

  // 1. Web URL or URL object
  const isUrl =
    input instanceof URL ||
    (typeof input === 'string' &&
      (input.startsWith('http://') || input.startsWith('https://')));

  if (isUrl) {
    const urlString = input.toString();
    sourceName = urlString;
    detectedFormat = detectFormatFromExtension(urlString);

    const res = await fetch(urlString);
    if (!res.ok) {
      throw new Error(`Failed to fetch document from ${urlString}: ${res.statusText} (${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }
  // 2. Blob
  else if (typeof Blob !== 'undefined' && input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    if (input.type) {
      if (input.type.includes('pdf')) detectedFormat = 'pdf';
      else if (input.type.includes('word') || input.type.includes('officedocument')) detectedFormat = 'docx';
      else if (input.type.includes('json')) detectedFormat = 'json';
      else if (input.type.includes('csv')) detectedFormat = 'csv';
      else if (input.type.includes('markdown')) detectedFormat = 'md';
    }
  }
  // 3. Buffer / Uint8Array / ArrayBuffer
  else if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input instanceof Uint8Array) {
    buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input);
  }
  // 4. File path string
  else if (typeof input === 'string') {
    sourceName = input;
    detectedFormat = detectFormatFromExtension(input);

    // If file exists on disk, read it
    if (existsSync(input)) {
      buffer = await fs.readFile(input);
    } else {
      // If it doesn't exist on disk, check if it's raw text content
      if (!detectedFormat || detectedFormat === 'txt' || detectedFormat === 'md') {
        buffer = Buffer.from(input, 'utf-8');
        detectedFormat = detectedFormat || 'txt';
      } else {
        throw new Error(`File not found at path: "${input}"`);
      }
    }
  } else {
    throw new Error('Unsupported input type provided to wparser.');
  }

  // Determine final format: explicit > extension > magic bytes
  const finalFormat: SupportedFormat =
    explicitFormat && explicitFormat !== 'auto'
      ? explicitFormat
      : detectedFormat || detectFormatFromBytes(buffer);

  return {
    buffer,
    format: finalFormat,
    sourceName,
  };
}
