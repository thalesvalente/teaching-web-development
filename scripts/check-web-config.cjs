'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-config.js','utf8');
const QA='https://script.google.com/macros/s/ROSTER_320_QA_ONLY_123456789/exec';
const LEGACY='https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec';
function load(origin,search='',answer=''){
  const window={location:{origin,search},prompt:()=>answer};
  const ctx=vm.createContext({window});new vm.Script(source).runInContext(ctx,{timeout:1000});
  return window.WebEntregaConfig;
}
for(const origin of ['http://127.0.0.1:8765','https://example.invalid','https://thalesvalente.github.io.evil.invalid']){
  const c=load(origin,'?qa=1',QA);
  assert.equal(c.activated,false);assert.equal(c.endpoint,'');assert.equal(c.qaMode,false);
  assert.equal(c.schema,'web-a05-submission-v3');
}
const regular=load('https://thalesvalente.github.io');
assert.equal(regular.activated,false);assert.equal(regular.endpoint,'');
assert.equal(regular.qaMode,false);assert.equal(regular.schema,'web-a05-submission-v3');
assert.equal(regular.activity,'WEB-AULA05-2026');
assert.equal(regular.requiredVersion,'web-notas-3.2.0');
const qa=load('https://thalesvalente.github.io','?qa=1',QA);
assert.equal(qa.activated,true);assert.equal(qa.qaMode,true);
assert.equal(qa.endpoint,QA);assert.equal(qa.requiredMode,'PROD');
for(const input of ['',LEGACY,'https://evil.invalid/exec']){
  const c=load('https://thalesvalente.github.io','?qa=1',input);
  assert.equal(c.activated,false);assert.equal(c.endpoint,'');assert.equal(c.qaMode,false);
}
const backend=fs.readFileSync('integrations/web-appscript-production/Code.gs','utf8');
assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')==='true'"));
assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SECURITY_READY')==='true'"));
assert.ok(backend.includes("payload.environment==='PROD'"));
const send=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-appscript.js','utf8');
assert.ok(send.includes('await window.WebProductionGate.ensureReady(config)'));
console.log('WEB CONFIG PASS: formulário 3.2 no site, envio real bloqueado; QA somente por adesão explícita. Zero rede.');
