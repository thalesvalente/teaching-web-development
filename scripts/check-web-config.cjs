'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const source=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-config.js','utf8');
const QA='https://script.google.com/macros/s/ROSTER_320_SYNTHETIC_QA_ONLY/exec';
const OTHER='https://script.google.com/macros/s/ANOTHER_UNAPPROVED/exec';
const QA_HASH=createHash('sha256').update(QA,'utf8').digest('hex');
// Synthetic, never a real deployment: inject the fixture's fingerprint only for this test.
assert.match(source,/QA_SHA256='[a-f0-9]{64}'/);
const prodExpected='https://script.google.com/macros/s/AKfycbwCaZlTbUCEw_fr6N7yQ29uyBx1RiSFM7sUX1zRnKlunUE7n8Vb5aAKMuOkpxzKVE11/exec';
assert.ok(source.includes("PROD_ENDPOINT='"+prodExpected+"'"),'URL de implantação PROD precisa corresponder ao receptor aprovado');
assert.match(source,/PROD_RELEASE_ENABLED=true;/,'gate de publicação PROD habilitado após ativação docente');
const fixtureSource=source.replace(/QA_SHA256='[a-f0-9]{64}'/,"QA_SHA256='"+QA_HASH+"'");
function load(origin,search='',inputSource=fixtureSource,pathname='/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/'){
  const window={location:{origin,search,pathname},crypto:webcrypto};
  vm.runInNewContext(inputSource,{window,TextEncoder,Uint8Array},{timeout:1000});
  return window.WebEntregaConfig;
}
async function main(){
  for(const origin of ['http://127.0.0.1:8765','https://example.invalid','https://thalesvalente.github.io.evil.invalid']){
    const c=load(origin,'?qa=1');
    assert.equal(c.qaRequested,false);assert.equal(await c.configureQa(QA),false);
    assert.equal(c.activated,false);assert.equal(c.endpoint,'');
  }
  const normal=load('https://thalesvalente.github.io');
  assert.equal(normal.qaRequested,false);assert.equal(normal.activated,true);
  assert.equal(normal.endpoint,prodExpected);assert.equal(normal.requiredMode,'PROD');assert.equal(normal.schema,'web-a05-submission-v3');
  assert.equal(normal.activity,'WEB-AULA05-2026');
  assert.equal(normal.requiredVersion,'web-notas-3.2.0');
  assert.equal(await normal.configureQa(QA),false);
  const outside=load('https://thalesvalente.github.io','',fixtureSource,'/teaching-web-development/');
  assert.equal(outside.activated,false);assert.equal(outside.endpoint,'');
  const qa=load('https://thalesvalente.github.io','?qa=1&utm_source=fixture');
  assert.equal(qa.qaRequested,true);assert.equal(qa.activated,false);
  assert.equal(await qa.configureQa(OTHER),false);
  assert.equal(await qa.configureQa('https://other.invalid/exec'),false);
  assert.equal(qa.endpoint,'');
  assert.equal(await qa.configureQa(QA),true);
  assert.equal(await qa.configureQa(QA),true); // idempotent
  assert.equal(await qa.configureQa(OTHER),false); // cannot change destination
  assert.equal(qa.activated,true);assert.equal(qa.qaMode,true);
  assert.equal(qa.endpoint,QA);assert.equal(qa.requiredMode,'PROD');
  assert.equal(Object.isFrozen(qa),true);
  const backend=fs.readFileSync('integrations/web-appscript-production/Code.gs','utf8');
  assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')==='true'"));
  assert.ok(backend.includes("getProperty('WEB_NOTAS_PROD_SECURITY_READY')==='true'"));
  assert.ok(backend.includes("payload.environment==='PROD'"));
  const send=fs.readFileSync('lessons/aula-05-laboratorio-web-mobile/entrega-appscript.js','utf8');
  assert.ok(send.includes('await window.WebProductionGate.ensureReady(config)'));
  console.log('WEB CONFIG PASS: PROD ativo apenas no caminho oficial, demais caminhos offline, QA isolado e URL protegida; zero rede.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
