/** Proteção da prévia isolada Aula 05: nunca envia notas nem matrículas. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../../previews/aula05-mobile-20261027');
const read=(file)=>fs.readFileSync(path.join(base,file),'utf8');

test('prévia mobile tem os assets completos sem alterar o laboratório oficial',()=>{
  const html=read('index.html');
  assert.match(html,/mobile-stage-nav/);
  assert.match(html,/mobile-tools-menu/);
  assert.match(html,/\[PRÉVIA DE TESTE\]/);
  const files=[...html.matchAll(/(?:src|href)="\.\/([^"?]+)/g)].map(match=>match[1]);
  assert.ok(files.length>=10);
  for(const item of files)assert.ok(fs.existsSync(path.join(base,item)),item+' ausente');
  assert.ok(fs.existsSync(path.join(base,'shared/ProjetoUniversal.tsx')));
  assert.ok(fs.existsSync(path.join(base,'docs/GUIA_ALUNO.md')));
  assert.match(read('lab.js'),/setMobileStage/);
  assert.match(read('preview.html'),/preview-device-mobile/);
  assert.match(read('preview.html'),/\.\.\/\.\.\/lessons\/aula-05-laboratorio-web-mobile\/assets\/vendor\.js/);
  const vendor=path.resolve(base,'../../lessons/aula-05-laboratorio-web-mobile/assets/vendor.js');
  assert.ok(fs.statSync(vendor).size>3000000);
});

test('prévia desliga Apps Script inclusive em ?qa=1',()=>{
  const cfg=read('entrega-config.js');
  assert.match(cfg,/activated:false/);
  assert.match(cfg,/qaMode:false/);
  assert.match(cfg,/qaRequested:false/);
  assert.match(cfg,/endpoint:''/);
  assert.match(cfg,/configureQa:async\(\)=>false/);
  assert.doesNotMatch(cfg,/https:\/\/script\.google\.com/);
  assert.doesNotMatch(cfg,/WEB_NOTAS_PROD/);
});

test('snapshot corresponde à versão mobile candidata, sem dependência de URLs de produção',()=>{
  assert.match(read('PREVIEW_README.md'),/8229a2b198ae9f3059bce7374d42c347402dc66d/);
  assert.match(read('style.css'),/MOBILE-STAGE-2026-10-27/);
  assert.match(read('preview.html'),/data-active-preview="web"/);
  assert.ok(!read('index.html').includes('https://script.google.com/macros/'));
  assert.match(read('index.html'),/id="mobile-editor-focus"/);
  assert.match(read('index.html'),/id="mobile-editor-actions"/);
  assert.match(read('index.html'),/id="legacy-recovery"/);
  assert.doesNotMatch(read('index.html'),/id="migration-note"/);
  assert.match(read('style.css'),/mobile-editor-focus/);
  assert.match(read('lab.js'),/mobile-editor-focus/);
  assert.match(read('index.html'),/web-mobile-editor-03/);
});
