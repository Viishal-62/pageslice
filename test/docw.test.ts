import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { parse, doc, z } from '../src/index.js';
import { detectFormatFromBytes, detectFormatFromExtension } from '../src/parsers/detector.js';

const testDir = path.join(process.cwd(), 'test');

describe('1. Format & Magic Byte Detection', () => {
  test('detects all supported extensions correctly', () => {
    assert.equal(detectFormatFromExtension('report.pdf'), 'pdf');
    assert.equal(detectFormatFromExtension('contract.docx'), 'docx');
    assert.equal(detectFormatFromExtension('data.xlsx'), 'xlsx');
    assert.equal(detectFormatFromExtension('data.xls'), 'xls');
    assert.equal(detectFormatFromExtension('notes.txt'), 'txt');
    assert.equal(detectFormatFromExtension('README.md'), 'md');
    assert.equal(detectFormatFromExtension('table.csv'), 'csv');
    assert.equal(detectFormatFromExtension('config.json'), 'json');
  });

  test('detects formats from magic bytes (no file extension)', () => {
    // PDF: %PDF
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    assert.equal(detectFormatFromBytes(pdfBytes), 'pdf');

    // DOCX / ZIP: PK\x03\x04
    const docxBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    assert.equal(detectFormatFromBytes(docxBytes), 'docx');

    // JSON
    const jsonBytes = Buffer.from('{"key": "value"}');
    assert.equal(detectFormatFromBytes(jsonBytes), 'json');
  });
});

describe('2. Plain Text & Buffer Parsing (0 API Keys Required)', () => {
  test('parses raw text string instantly', async () => {
    const raw = 'Invoice #1001\nTotal: $500.00\nStatus: Paid';
    const result = await parse(raw);
    assert.equal(result.format, 'txt');
    assert.equal(result.text, raw);
    assert.equal(result.totalPages, 1);
  });

  test('parses Buffer with doc()', async () => {
    const buf = Buffer.from('Project Plan 2026');
    const d = await doc(buf, { format: 'txt' });
    assert.equal(d.format, 'txt');
    assert.equal(d.text, 'Project Plan 2026');
  });
});

describe('3. Real Document Parsing (Offline, Pure JS)', () => {
  const pdfFile = path.join(testDir, 'VISHAL KUMAR RESUMEE.pdf');
  if (fs.existsSync(pdfFile)) {
    test('parses real PDF file (VISHAL KUMAR RESUMEE.pdf)', async () => {
      const result = await parse(pdfFile);
      assert.equal(result.format, 'pdf');
      assert.ok(result.totalPages >= 1, 'Should have at least 1 page');
      assert.ok(result.text.length > 50, 'Should extract resume text');
      assert.ok(result.pages.length === result.totalPages);

      console.log('\n╔═════════════════════════════════════════════════════════════════════════╗');
      console.log(`║ 📄 FULL EXTRACTED TEXT FROM PDF (${result.text.length} chars, ${result.totalPages} page)`);
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(result.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    });
  }

  const docxFile = path.join(testDir, 'Introduction to Network Security.docx');
  if (fs.existsSync(docxFile)) {
    test('parses real DOCX file (Introduction to Network Security.docx)', async () => {
      const result = await parse(docxFile);
      assert.equal(result.format, 'docx');
      assert.ok(result.text.length > 50, 'Should extract docx text');
      assert.ok(result.totalPages >= 1);

      console.log('\n╔═════════════════════════════════════════════════════════════════════════╗');
      console.log(`║ 📝 FULL EXTRACTED TEXT FROM DOCX (${result.text.length} chars)`);
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(result.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    });
  }

  const xlsxFile = path.join(testDir, 'sample-data.xlsx');
  if (fs.existsSync(xlsxFile)) {
    test('parses real XLSX spreadsheet into markdown tables (sample-data.xlsx)', async () => {
      const result = await parse(xlsxFile);
      assert.equal(result.format, 'xlsx');
      assert.ok(result.totalPages >= 1, 'Should have sheets');
      assert.ok(result.text.includes('|'), 'Should format as markdown table');
      assert.ok(result.text.includes('Sheet:'), 'Should include sheet headers');

      console.log('\n╔═════════════════════════════════════════════════════════════════════════╗');
      console.log(`║ 📊 FULL EXTRACTED TEXT FROM XLSX (${result.totalPages} sheets, ${result.text.length} chars)`);
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(result.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    });
  }
});

describe('4. Schema & Zod Re-export', () => {
  test('zod is exported directly and validates schemas', () => {
    const Schema = z.object({
      name: z.string(),
      score: z.number(),
      active: z.boolean().default(true),
    });

    const parsed = Schema.parse({ name: 'docw', score: 100 });
    assert.equal(parsed.name, 'docw');
    assert.equal(parsed.score, 100);
    assert.equal(parsed.active, true);
  });
});
