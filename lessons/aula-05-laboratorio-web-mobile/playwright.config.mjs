import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: ['*.spec.mjs'],
  // A prévia isolada usa servidor/porta 8766 em playwright.preview-mobile.config.mjs.
  // Não execute esse caso na suíte oficial (porta 8765).
  testIgnore: ['preview-responsive.spec.mjs'],
  workers: 2,
  retries: 0,
  timeout: 45000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:8765', browserName: 'chromium', headless: true },
  webServer: { command: 'python3 -m http.server 8765 --bind 127.0.0.1', url: 'http://127.0.0.1:8765/', reuseExistingServer: false, timeout: 15000 },
});
