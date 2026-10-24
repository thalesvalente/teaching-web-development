import base from './playwright.config.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,
  testMatch:['http-site-identity.spec.mjs','matricula-v3.spec.mjs','conflict-viewport.spec.mjs'],
  projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName}}))
});
