/**
 * Генерация PDF из HTML-инструкций (ru / en / cz).
 * Запуск из Frontend/Frontend3:
 *   node scripts/generate-seller-docs-pdf.mjs
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, '../../../docs/seller-buyer-mismatch');
const PDF_DIR = path.join(DOCS_ROOT, 'pdf');

const LOCALES = ['ru', 'en', 'cz'];

const SOURCES = [
  {
    html: '01-novaya-registraciya-prodavca.html',
    pdfBase: '01-novaya-registraciya-prodavca',
  },
  {
    html: '02-uzhe-est-akkaunt-pokupatelya.html',
    pdfBase: '02-uzhe-est-akkaunt-pokupatelya',
  },
  {
    html: '03-vykladka-tovarov.html',
    pdfBase: '03-vykladka-tovarov',
  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const locale of LOCALES) {
    console.log(`\n=== PDF locale: ${locale} ===`);
    for (const { html, pdfBase } of SOURCES) {
      const pdf = `${pdfBase}-${locale}.pdf`;
      const htmlPath = path.join(PDF_DIR, locale, html);
      const pdfPath = path.join(PDF_DIR, locale, pdf);
      const fileUrl = `file://${htmlPath}`;

      await page.goto(fileUrl, { waitUntil: 'load' });
      await page.waitForFunction(() => {
        const images = Array.from(document.images);
        return images.length === 0 || images.every((img) => img.complete && img.naturalWidth > 0);
      }, { timeout: 30_000 });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      console.log(`  ✓ ${locale}/${pdf}`);
    }
  }

  await browser.close();
  console.log(`\nPDF files saved under ${PDF_DIR}/{ru,en,cz}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
