#!/usr/bin/env node
// take-screenshots.mjs
// README用スクショを Vercel公開URLから撮ってpublic/screenshots/に保存。
// 使い方：NODE_PATH="D:/work/sales-report-app/node_modules" node scripts/take-screenshots.mjs

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'screenshots');
const URL_BASE = 'https://process-manager-demo.vercel.app';

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const shots = [
    { name: 'list-desktop.png', path: '/', viewport: { width: 1280, height: 900 }, wait: 1500, clip: null },
    { name: 'dashboard.png', path: '/dashboard', viewport: { width: 1280, height: 900 }, wait: 2500, clip: null },
    { name: 'list-mobile.png', path: '/', viewport: { width: 390, height: 844 }, wait: 1500, clip: null },
    { name: 'job-detail.png', path: '/job/j4', viewport: { width: 1280, height: 900 }, wait: 1500, clip: null },
  ];

  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${URL_BASE}${s.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(s.wait);
    const outPath = join(OUT_DIR, s.name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`✓ ${s.name} → ${outPath}`);
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
