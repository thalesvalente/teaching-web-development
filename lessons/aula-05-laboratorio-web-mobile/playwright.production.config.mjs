import base from './playwright.config.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'production-gate.spec.mjs',
  projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName}}))
});
