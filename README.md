# pageslice 📄⚡

> **Zero-glue document parser & AI extraction toolkit for Node.js & TypeScript.**  
> Slice any **PDF**, **DOCX**, **XLSX**, **TXT**, or **Markdown** into raw text or **guaranteed typed JSON** using Zod schemas.

[![npm version](https://img.shields.io/npm/v/pageslice.svg)](https://www.npmjs.com/package/pageslice)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Native Dependencies](https://img.shields.io/badge/dependencies-pure%20JS%20(no%20node--gyp)-green.svg)]()

---

## Why `pageslice`?

Every developer building document AI in JavaScript/TypeScript knows the pain:
- Installing `pdf-parse`, `mammoth`, and fighting `node-gyp` / C++ native build errors in Next.js, Vercel, and Docker.
- Writing 80+ lines of glue code to handle file formats, buffers, and clean whitespace.
- Dealing with LLMs returning broken JSON or missing schema fields.

**`pageslice` eliminates all of that.** One single package. Zero native C++ dependencies. Pure JavaScript. Works offline for text parsing, and supports **OpenAI**, **Google Gemini**, **OpenRouter**, or local **Ollama** for AI.

---

## Key Features

- 📦 **All-in-One**: PDF, DOCX, XLSX/XLS (Excel), TXT, MD, CSV, JSON support out of the box.
- 🔓 **0 API Keys Needed for Text**: Extract text from PDF, Word, or Excel docs 100% offline with zero setup.
- ⚡ **Zero Native C++ Dependencies**: No `node-gyp`, `canvas`, or `poppler`. Runs cleanly on **Next.js**, **Vercel Serverless**, **AWS Lambda**, and **Bun**.
- 📊 **Smart Excel → Markdown Tables**: Converts spreadsheet sheets into clean markdown tables for optimal LLM comprehension and structured extraction.
- 🎯 **Guaranteed Type-Safe JSON**: Built-in Zod schema validation.
- 🔄 **Self-Healing Retries**: If an LLM returns invalid JSON or misses fields, `pageslice` automatically reprompts with the validation errors and fixes it.
- 🔑 **Bring Your Own Key (BYOK)**: Supports OpenAI, OpenRouter (100+ models), Google Gemini, and any custom OpenAI-compatible endpoint.
- 🌐 **Universal Inputs**: Accepts file paths, Node `Buffer`, `Uint8Array`, web `URL`, and browser `Blob`/`File`.
- 🧩 **Zod Re-exported**: Use `import { z } from 'zod'` or `import { z } from 'pageslice'` — both work seamlessly.

---

## Installation

```bash
npm install pageslice
# or
pnpm add pageslice
# or
bun add pageslice
```

---

## ⚡ Instant CLI Commands (Zero Code Required)

You don't even need to write a line of code to test or parse documents. You can run `pageslice` directly from your terminal using `npx`:

### 1. Run Live Diagnostic Test (See Real Files Parsed Live)
Runs built-in parsers on real PDF, DOCX, and XLSX files and prints the **entire extracted text and markdown tables** right on your screen:

```bash
npx pageslice test
```

### 2. Parse Any File Directly from Your Terminal
Extract and inspect text or tables from any local document in 50ms:

```bash
# Parse a PDF file
npx pageslice ./resume.pdf

# Parse an Excel spreadsheet into Markdown tables
npx pageslice ./sales.xlsx

# Parse a Word document
npx pageslice ./contract.docx
```

---

## Code Quickstart

### 1. Plain Text Extraction (NO API Keys Required, 100% Offline)

If you just want the raw text from any PDF, Word doc, Excel spreadsheet, or text file:

```typescript
import { parse } from 'pageslice';

// Works instantly, offline, zero API keys required!
const document = await parse('./contract.pdf'); // or .docx, .xlsx, .txt, .json

console.log(document.text);       // Full extracted text
console.log(document.pages);      // Array of text per page (or per sheet for Excel)
console.log(document.totalPages); // e.g. 5
```

### Excel Parsing (Automatic Markdown Table Conversion)

Excel files are automatically converted into clean markdown tables — perfect for LLM comprehension:

```typescript
import { parse } from 'pageslice';

const spreadsheet = await parse('./sales-data.xlsx');

console.log(spreadsheet.text);
// Output:
// ## Sheet: Q1 Sales
//
// | Product | Units | Revenue |
// | --- | --- | --- |
// | Widget A | 1200 | 45000 |
// | Widget B | 800 | 32000 |
//
// ## Sheet: Q2 Sales
// ...

console.log(spreadsheet.totalPages);  // Number of sheets
console.log(spreadsheet.metadata);    // { sheetNames: ['Q1 Sales', 'Q2 Sales'], totalSheets: 2 }
```

---

### 2. AI Q&A & Guaranteed Typed JSON (Zod)

When you want AI Q&A or structured JSON extraction:

```typescript
import { doc, z } from 'pageslice'; // or import { z } from 'zod'

// 1. Load document (auto-detects format)
const document = await doc('./invoice.pdf', {
  provider: 'openrouter', // or 'openai' | 'gemini' | 'custom'
  apiKey: process.env.OPENROUTER_API_KEY,
});

// 2. Ask any freeform question
const answer = await document.ask('What are the payment terms?');
console.log(answer);

// 3. Extract guaranteed typed data using Zod
const { data } = await document.extract({
  prompt: 'Extract vendor details and totals',
  schema: z.object({
    vendorName: z.string(),
    invoiceNumber: z.string(),
    totalAmount: z.number(),
    lineItems: z.array(
      z.object({
        description: z.string(),
        price: z.number(),
      })
    ),
  }),
});

// 100% typed & autocompleted in TypeScript!
console.log(data.vendorName, data.totalAmount);
```

---

## All AI Provider Setup Examples

### 1. OpenAI Setup
```typescript
import { doc } from 'pageslice';

const document = await doc('./invoice.pdf', {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini', // default is 'gpt-4o-mini', can also use 'gpt-4o'
});
```

### 2. Google Gemini Setup
```typescript
import { doc } from 'pageslice';

const document = await doc('./invoice.pdf', {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-1.5-flash', // or 'gemini-2.5-flash'
});
```

### 3. OpenRouter Setup (100+ Models: Claude 3.5 Sonnet, Llama 3, DeepSeek)
```typescript
import { doc } from 'pageslice';

const document = await doc('./invoice.pdf', {
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3.5-sonnet', // or 'google/gemini-2.5-flash'
});
```

### 4. Local Ollama / vLLM / Custom Setup (Free & Offline AI)
```typescript
import { doc } from 'pageslice';

const document = await doc('./file.pdf', {
  provider: 'custom',
  baseURL: 'http://localhost:11434/v1', // local Ollama server
  model: 'llama3',
});
```

### 5. Environment Variable Auto-Detection (Zero Config)
If you put `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` in your `.env` file, **you don't even need to pass options**:

```typescript
import { doc } from 'pageslice';

// Automatically detects process.env.OPENROUTER_API_KEY or OPENAI_API_KEY!
const document = await doc('./file.pdf');
const answer = await document.ask('What is this file about?');
```

---

## Universal Input Support

`pageslice` handles any input type without requiring manual conversions:

```typescript
// Local file path
await doc('./contract.docx');

// Multer / Express / Next.js file upload Buffer
await doc(req.file.buffer, { format: 'pdf' });

// Web URL (automatically fetches and parses)
await doc('https://example.com/invoice.pdf');

// Browser / FormData Blob / File
await doc(fileBlob);

// Raw text string
await doc('Company policy notes...');
```

---

## Backend Integration Examples

### Next.js (App Router Route Handler)

```typescript
// app/api/parse-doc/route.ts
import { NextResponse } from 'next/server';
import { doc, z } from 'pageslice';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('document') as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  const document = await doc(buffer, {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const { data } = await document.extract({
    prompt: 'Extract document summary and metrics',
    schema: z.object({
      title: z.string(),
      summary: z.string(),
    }),
  });

  return NextResponse.json({ data });
}
```

### Express.js (Node.js API with Multer)

```typescript
import express from 'express';
import multer from 'multer';
import { doc, z } from 'pageslice';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/parse', upload.single('document'), async (req, res) => {
  const document = await doc(req.file.buffer);

  const { data } = await document.extract({
    schema: z.object({ vendor: z.string(), amount: z.number() }),
  });

  res.json({ data });
});
```

---

## Reusable Client (`createDocClient`)

Configure your provider once at the top of your app and use it across multiple API routes:

```typescript
// lib/docClient.ts
import { createDocClient } from 'pageslice';

export const client = createDocClient({
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3.5-sonnet',
});

// In any server action or route:
import { client } from '@/lib/docClient';
import { z } from 'zod';

export async function processUpload(fileBuffer: Buffer) {
  const document = await client.load(fileBuffer);
  
  return await document.extractData({
    schema: z.object({ title: z.string(), total: z.number() }),
  });
}
```

---

## Comparison

| Feature | LangChain JS | Raw `pdf-parse` / `mammoth` | **`pageslice`** |
| :--- | :--- | :--- | :--- |
| **npm packages required** | 6 to 8 | 3 to 5 | **Just 1 (`pageslice`)** |
| **Native C++ build issues?** | Frequently | Frequently | **Zero (`pure JS`)** |
| **Instant CLI testing** | ❌ No | ❌ No | **✅ Yes (`npx pageslice test`)** |
| **Direct terminal file parser** | ❌ No | ❌ No | **✅ Yes (`npx pageslice <file>`)** |
| **Text parsing offline (No API key)** | ❌ No | ✅ Yes | **✅ Yes (`parse()`)** |
| **Supported formats** | Separate loaders per format | PDF or DOCX only | **PDF, DOCX, XLSX, TXT, MD, CSV, JSON** |
| **Excel → Markdown tables** | ❌ No | ❌ No | **✅ Auto-converts sheets to tables** |
| **Guaranteed Zod JSON** | Verbose LCEL Chains | Manual | **Built-in with Self-Healing** |
| **Next.js & Vercel Ready** | ⚠️ Cold starts | ⚠️ Node-gyp errors | **✅ Edge & Serverless Ready** |

---

## 🧪 Run Test Suite

You can clone the repository and run the test suite:

```bash
npm test
# or
npm run pageslice:test
```

All tests run **100% offline in pure JavaScript** without requiring any API keys or internet connection.

---

## License

MIT © [pageslice Contributors](LICENSE)
