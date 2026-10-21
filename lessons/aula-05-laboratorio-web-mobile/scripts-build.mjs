import { build } from 'esbuild';
import { mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

mkdirSync(resolve('assets'), { recursive: true });
await build({
  entryPoints: [resolve('src/vendor-entry.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  conditions: ['browser'],
  outfile: resolve('assets/vendor.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'global': 'globalThis' },
  logLevel: 'info',
});
console.log('Fornecedor local: React 19.2.3, React Native Web 0.21.2, Babel 7.29.10.');
