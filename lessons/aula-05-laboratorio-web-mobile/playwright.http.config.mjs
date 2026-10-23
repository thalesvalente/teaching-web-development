import {defineConfig} from '@playwright/test';
import {loadLiveSettings} from './tests-live/http-qa-support.mjs';
// Falha de preflight é erro (não skip): nunca produz PASS sem URL/autorização.
loadLiveSettings();
export default defineConfig({
  testDir:'./tests-live',testMatch:'http-real-qa.spec.mjs',workers:1,retries:0,timeout:240000,
  reporter:[['list']],outputDir:'test-results/http-real-qa',
  use:{browserName:'chromium',headless:true,serviceWorkers:'block',trace:'off',screenshot:'off',video:'off'}
});
