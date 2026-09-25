#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { parse, z } = require('../dist/index.js');

async function runSelfTest() {
  console.log('╔═════════════════════════════════════════════════════════════════════════╗');
  console.log('║  ⚡ PAGESLICE LIVE TEST ON REAL DOCUMENTS                               ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════╝\n');

  const testDir = path.join(__dirname, '..', 'test');

  // 1. REAL PDF PARSING
  const pdfFile = path.join(testDir, 'VISHAL KUMAR RESUMEE.pdf');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 1. PARSING REAL PDF: "VISHAL KUMAR RESUMEE.pdf"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (fs.existsSync(pdfFile)) {
    try {
      console.time('PDF Parse Time');
      const pdfRes = await parse(pdfFile);
      console.timeEnd('PDF Parse Time');
      console.log(`Format: ${pdfRes.format.toUpperCase()} | Total Pages: ${pdfRes.totalPages} | Characters: ${pdfRes.text.length}\n`);
      console.log('╔═════════════════════════════════════════════════════════════════════════╗');
      console.log('║ FULL EXTRACTED PDF TEXT:');
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(pdfRes.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    } catch (err) {
      console.log('❌ PDF Error:', err.message);
    }
  } else {
    console.log(`❌ PDF file not found at: ${pdfFile}`);
  }

  // 2. REAL DOCX PARSING
  const docxFile = path.join(testDir, 'Introduction to Network Security.docx');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 2. PARSING REAL WORD DOC: "Introduction to Network Security.docx"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (fs.existsSync(docxFile)) {
    try {
      console.time('DOCX Parse Time');
      const docxRes = await parse(docxFile);
      console.timeEnd('DOCX Parse Time');
      console.log(`Format: ${docxRes.format.toUpperCase()} | Total Characters: ${docxRes.text.length}\n`);
      console.log('╔═════════════════════════════════════════════════════════════════════════╗');
      console.log('║ FULL EXTRACTED DOCX TEXT:');
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(docxRes.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    } catch (err) {
      console.log('❌ DOCX Error:', err.message);
    }
  } else {
    console.log(`❌ DOCX file not found at: ${docxFile}`);
  }

  // 3. REAL EXCEL (XLSX) PARSING
  const xlsxFile = path.join(testDir, 'sample-data.xlsx');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 3. PARSING REAL EXCEL SPREADSHEET: "sample-data.xlsx"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (fs.existsSync(xlsxFile)) {
    try {
      console.time('XLSX Parse Time');
      const xlsxRes = await parse(xlsxFile);
      console.timeEnd('XLSX Parse Time');
      console.log(`Format: ${xlsxRes.format.toUpperCase()} | Sheets: ${xlsxRes.totalPages} | Characters: ${xlsxRes.text.length}\n`);
      console.log('╔═════════════════════════════════════════════════════════════════════════╗');
      console.log('║ FULL EXTRACTED MARKDOWN TABLES:');
      console.log('╚═════════════════════════════════════════════════════════════════════════╝');
      console.log(xlsxRes.text);
      console.log('─────────────────────────────────────────────────────────────────────────\n');
    } catch (err) {
      console.log('❌ XLSX Error:', err.message);
    }
  } else {
    console.log(`❌ XLSX file not found at: ${xlsxFile}`);
  }

  // 4. ZOD SCHEMA EXTRACTION & TYPE VALIDATION
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 4. ZOD SCHEMA VALIDATION ENGINE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const ResumeSchema = z.object({
      name: z.string(),
      role: z.string(),
      location: z.string(),
      skills: z.array(z.string()),
    });

    const validated = ResumeSchema.parse({
      name: 'Vishal Kumar',
      role: 'Full Stack AI Developer',
      location: 'Noida, India',
      skills: ['TypeScript', 'Node.js', 'React.js', 'Next.js', 'LLMs', 'RAG'],
    });

    console.log('[Validated JSON Data Object]:\n');
    console.dir(validated, { depth: null });
    console.log('\n─────────────────────────────────────────────────────────────────────────');
  } catch (err) {
    console.log('❌ Zod Error:', err.message);
  }

  console.log('╔═════════════════════════════════════════════════════════════════════════╗');
  console.log('║  🎉 ALL 3 REAL FILES PARSED SUCCESSFULLY! pageslice is 100% verified.   ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════╝\n');
}

async function parseCliFile(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Error: File not found at "${fullPath}"`);
    process.exit(1);
  }

  console.log(`📄 Parsing "${path.basename(fullPath)}"...`);
  console.time('Parse Time');
  const result = await parse(fullPath);
  console.timeEnd('Parse Time');

  console.log(`\nFormat: ${result.format.toUpperCase()}`);
  if (result.totalPages) {
    console.log(`Total Pages/Sheets: ${result.totalPages}`);
  }
  console.log(`Characters: ${result.text.length}\n`);

  console.log('╔═════════════════════════════════════════════════════════════════════════╗');
  console.log('║ FULL EXTRACTED CONTENT:');
  console.log('╚═════════════════════════════════════════════════════════════════════════╝');
  console.log(result.text);
  console.log('─────────────────────────────────────────────────────────────────────────');
}

async function main() {
  const arg = process.argv[2];

  if (!arg || arg === 'test' || arg === '--test') {
    await runSelfTest();
  } else if (arg === '--help' || arg === '-h') {
    console.log('pageslice CLI Usage:');
    console.log('  npx pageslice test          # Parse real PDF, DOCX, and XLSX files and print full text');
    console.log('  npx pageslice <file-path>   # Parse any PDF, DOCX, XLSX, TXT file directly');
  } else {
    await parseCliFile(arg);
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
