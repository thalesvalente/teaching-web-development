import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const preview = '/previews/aula05-mobile-20261027/';
const artifactDir = path.resolve(process.cwd(), 'test-artifacts/preview-responsive');
fs.mkdirSync(artifactDir, { recursive: true });

for (const target of [
  { name: '320x640', width: 320, height: 640 },
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  // Emula browser touch que solicita layout de desktop, como nas capturas.
  { name: 'touch-desktop-980', width: 980, height: 1960 }
]) {
  test('mobile focado em ' + target.name, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:8766',
      viewport: { width: target.width, height: target.height },
      screen: { width: target.name === 'touch-desktop-980' ? 360 : target.width, height: target.height },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    try {
      await page.goto(preview, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.mobile-stage-nav')).toBeVisible();
      await expect(page.locator('.app-header .header-tools')).toBeHidden();
      await expect(page.locator('#missao-atual')).toBeVisible();
      await expect(page.locator('#code-panel')).toBeHidden();
      await page.screenshot({ path: path.join(artifactDir, target.name + '-mission.png') });

      await page.locator('#mobile-tab-code').click();
      await expect(page.locator('#code-panel')).toBeVisible();
      await expect(page.locator('#missao-atual')).toBeHidden();
      await expect(page.locator('#result-panel')).toBeHidden();
      await expect(page.locator('#code')).toBeVisible();
      const editor = await page.evaluate(() => {
        const rect = document.querySelector('#code').getBoundingClientRect();
        return {
          width: rect.width, height: rect.height,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          horizontalScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          fontSize: getComputedStyle(document.querySelector('#code')).fontSize
        };
      });
      expect(editor.width, JSON.stringify(editor)).toBeGreaterThan(editor.viewportWidth * 0.88);
      if(target.name==='touch-desktop-980'){
        const viewportFix=await page.evaluate(()=>({
          active:document.documentElement.classList.contains('a05-touch-desktop-viewport'),
          scale:Number(getComputedStyle(document.documentElement).getPropertyValue('--a05-touch-scale')),
          shellWidth:document.querySelector('.app-shell').getBoundingClientRect().width,
          screenWidth:screen.width
        }));
        expect(viewportFix.active).toBe(true);
        expect(viewportFix.scale).toBeGreaterThan(2.0);
        expect(viewportFix.shellWidth).toBeGreaterThan(editor.viewportWidth*0.96);
      }
      expect(editor.height, JSON.stringify(editor)).toBeGreaterThan(editor.viewportHeight * 0.40);
      expect(editor.horizontalScroll, JSON.stringify(editor)).toBeLessThanOrEqual(2);
      expect(parseFloat(editor.fontSize)).toBeLessThanOrEqual(14);
      await expect(page.locator('#mobile-run-code')).toBeVisible();
      await expect(page.locator('#mobile-editor-focus')).toBeVisible();
      await page.screenshot({ path: path.join(artifactDir, target.name + '-code.png') });
      await page.locator('#mobile-tab-preview').click();
      await expect(page.locator('#result-panel')).toBeVisible();
      await expect(page.locator('#code-panel')).toBeHidden();
    } finally {
      await context.close();
    }
  });
}

test('desktop com mouse mantém a bancada sem abas móveis', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:8766', viewport: { width: 1440, height: 800 }, hasTouch: false });
  const page = await context.newPage();
  try {
    await page.goto(preview, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.mobile-stage-nav')).toBeHidden();
    await expect(page.locator('#missao-atual')).toBeVisible();
    await expect(page.locator('#code-panel')).toBeVisible();
    await expect(page.locator('#result-panel')).toBeVisible();
    await page.screenshot({ path: path.join(artifactDir, 'desktop-1440.png') });
  } finally {
    await context.close();
  }
});
