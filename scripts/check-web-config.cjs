'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-config.js','utf8');
function load(origin){const ctx=vm.createContext({window:{location:{origin}}});new vm.Script(source).runInContext(ctx,{timeout:1000});return ctx.window.WebEntregaConfig;}
for(const origin of ['http://127.0.0.1:8765','https://example.invalid','https://thalesvalente.github.io.evil.invalid']){
  const c=load(origin);assert.equal(c.activated,false);assert.equal(c.endpoint,'');assert.equal(c.schema,'web-a05-submission-v3');
}
const c=load('https://thalesvalente.github.io');assert.equal(c.activated,true);assert.equal(c.requiredMode,'PROD');assert.equal(c.requiredVersion,'web-notas-3.2.0');
assert.equal(c.activity,'WEB-AULA05-2026');assert.match(c.endpoint,/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/);
const backend=fs.readFileSync('integrations/web-appscript-production/Code.gs','utf8');
assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')==='true'"));
assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SECURITY_READY')==='true'"));
assert.ok(backend.includes("payload.environment==='PROD'"));
assert.ok(backend.includes('function notasCommit_'));
const send=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-appscript.js','utf8');
assert.ok(send.includes('await window.WebProductionGate.ensureReady(config)'));
console.log('WEB CONFIG PASS: domínio oficial exige PROD 3.2, roster read-only e health; demais origens offline. Zero rede.');
