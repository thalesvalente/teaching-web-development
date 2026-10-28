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

test('código da prévia usa fonte compacta sem modificar a tipografia das instruções',()=>{
  const css=read('style.css');
  const html=read('index.html');
  const mobile=[
    '  .lab-grid .code-panel .source-container textarea,',
    '  .lab-grid .code-panel .readonly-source{',
    '    width:100%;height:100%;min-height:0;padding:11px 13px;',
    '    font-size:14px;line-height:1.45;'
  ].join(String.fromCharCode(10));
  const narrow=[
    '@media screen and (max-width:365px){',
    '  .lab-grid .code-panel .source-container textarea,',
    '  .lab-grid .code-panel .readonly-source{',
    '    font-size:13px;'
  ].join(String.fromCharCode(10));
  assert.ok(css.includes(mobile),'regra móvel de 14px não encontrada');
  assert.ok(css.includes(narrow),'regra móvel estreita de 13px não encontrada');
  assert.ok(html.includes('./style.css?v=web-mobile-layout-05'),'CSS sem atualização de cache');
  assert.match(html,/id="code"/);
  assert.match(html,/id="readonly-code"/);
  assert.match(html,/id="legacy-recovery"/);
  assert.match(read('lab.js'),/ifma-web-aula05-lab-v4/);
});

test('bancada e resultado usam mesma media query para toque e viewport amplo',()=>{
  const css=read('style.css');
  const preview=read('preview.html');
  const lab=read('lab.js');
  const query='screen and (pointer:coarse) and (max-width:1100px)';
  assert.equal(css.split(query).length-1,2,'ambos os blocos mobile da bancada');
  assert.match(preview,/pointer:coarse/);
  assert.ok(lab.includes("(pointer:coarse) and (max-width:1100px)"),'JS deve concordar com CSS');
  assert.ok(read('index.html').includes('./lab.js?v=web-mobile-layout-05'));
  assert.ok(read('index.html').includes('./preview.html?v=web-mobile-layout-05'));
  assert.match(read('entrega-config.js'),/activated:false/);
});


test('prévia nunca apresenta o botão como envio real de notas',()=>{
  const html=read('index.html');
  const config=read('entrega-config.js');
  assert.match(html,/Gerar PDF \(sem envio\)/);
  assert.match(html,/Prévia — arquivos locais, sem Google Sheets/);
  assert.match(html,/nomes não são consultados nem confirmados/);
  assert.doesNotMatch(html,/Gerar PDF e Enviar/);
  assert.match(config,/activated:false/);
  assert.match(config,/endpoint:''/);
  assert.match(config,/configureQa:async\(\)=>false/);
});
