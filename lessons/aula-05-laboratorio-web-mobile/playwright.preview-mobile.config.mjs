import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['preview-responsive.spec.mjs'],
  timeout: 45000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8766',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    command: 'python3 -m http.server 8766 --bind 127.0.0.1 --directory ../..',
    url: 'http://127.0.0.1:8766/',
    reuseExistingServer: false,
    timeout: 15000
  }
});
