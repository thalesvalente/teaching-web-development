'use strict';

// Guardas de G7/G9 para a PREPARAÇÃO da homologação. Estes testes são
// locais/sintéticos: nenhum deles faz uma chamada HTTP ao Google.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {fixture}=require('./harness.cjs');

function registration(f){return JSON.stringify(f.state().Alunos);}
function confirmedRequest(f){return f.event([],f.confirmed());}
function health(f){
  const result=f.ctx.doGet({parameter:{action:'health',nonce:randomUUID()}});
  assert.equal(typeof result.html,'string');
  const hit=result.html.match(/top\.postMessage\((\{.*\}),"https:\/\/thalesvalente\.github\.io"\)/);
  assert.ok(hit,'G7: retorno da verificação HTTP deve ser um envelope de postMessage reconhecível');
  return JSON.parse(hit[1]);
}

test('G7 preflight: bloqueio desabilita GET de prontidão e recusa entrega, sem tocar cadastro',()=>{
  const f=fixture(),request=confirmedRequest(f),before=registration(f),book=f.snapshot();
  f.props.set('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
  const get=health(f);
  assert.equal(get.version,'web-notas-3.2.0');
  assert.equal(get.enabled,false);
  assert.equal(get.mode,'PROD'); // contrato interno; não é prova de destino de produção
  const post=f.receive(request);
  assert.equal(post.ok,false);
  assert.equal(f.batches(),0);
  assert.equal(registration(f),before);
  assert.equal(f.snapshot(),book);
});

test('G7 preflight: catálogo legado bloqueia prontidão mesmo com flag global ativa',()=>{
  const f=fixture(),before=registration(f);
  f.set('Atividades',3,5,'web-a05-submission-v2');
  const result=health(f);
  assert.equal(result.enabled,false);
  assert.equal(f.batches(),0);
  assert.equal(registration(f),before);
});

test('G7 isolamento: propriedade de destino por si só não autoriza retarget de QA',()=>{
  const f=fixture(),master=f.ctx.WEB_V3_PRIVATE_.WEB_CFG.spreadsheetId;
  assert.equal(f.ctx.WEB_V3_PRIVATE_.notasConfig().id,master);
  const snapshot=f.snapshot();
  f.props.set('WEB_NOTAS_PROD_SPREADSHEET_ID','qa-isolada-exemplo-sem-acesso');
  // Defesa atual é ainda mais restritiva: notasConfig recusa outra planilha
  // antes de montar requisições. Para QA exige projeto novo + WEB_CFG isolado.
  assert.throws(()=>f.ctx.WEB_V3_PRIVATE_.notasConfig(),/Destino de produção não autorizado/);
  assert.equal(f.snapshot(),snapshot);
  assert.equal(f.batches(),0);
});

test('G9: endpoint fictício de mutação nunca escreve nem altera matrícula',()=>{
  const f=fixture(),before=registration(f);
  const e={parameter:{nonce:randomUUID(),payload:JSON.stringify({
    operation:'updateEnrollment',environment:'PROD',enrollment:'20999999.ITA9001',
    newEnrollment:'20999999.ITA9999'
  })}};
  const result=f.receive(e);
  assert.equal(result.ok,false);
  assert.equal(result.code,'OPERACAO_NAO_PERMITIDA');
  assert.equal(f.batches(),0);
  assert.equal(registration(f),before);
});
