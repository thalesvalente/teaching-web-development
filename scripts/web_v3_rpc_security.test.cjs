'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture,TASKS}=require('../tests/web-a05-id03/harness-v3.cjs');
const admin=['prepararIntegracaoNotasV3','statusIntegracaoNotasV3','consultarConflitoDocenteV3','cadastrarAtividadeNotasV3','bloquearRecebimentoNotasV3','encerrarAtividadeNotasV3','encerrarAula05ParaCorrecaoV3','liberarRecebimentoQAWebV3','verificarStatusWebV3','rotacionarChaveQAWebV3'];
const script=fs.readFileSync(path.join(__dirname,'../integrations/web-appscript-v3-qa/HomologacaoV3.gs'),'utf8');
function load(f){vm.runInContext(script,f.ctx);return f;}
const publicFns=f=>Object.keys(f.ctx).filter(k=>typeof f.ctx[k]==='function'&&!k.endsWith('_')).sort();
test('RPC surface só contém HTTP e fachadas administrativas; helpers não são globais',()=>{
 const f=load(fixture({exposeInternals:false}));
 assert.deepEqual(publicFns(f),[...admin,'executarHomologacaoMatriculasV3','doGet','doPost'].sort());
 for(const n of ['notasSecret','notasStore','notasSign','webReturn','notasReadBook','notasAuditSign']){
  assert.equal(f.ctx[n],undefined,n+' não deve ser RPC global');assert.equal(typeof f.ctx.WEB_V3_PRIVATE_[n],'function');
 }
 assert.equal(Object.isFrozen(f.ctx.WEB_V3_PRIVATE_),true);
});
for(const [label,active,effective]of [['anônimo','','owner@example.test'],['outro aluno','student@example.test','owner@example.test'],['ambos vazios','',''],['efetivo vazio','owner@example.test','']]){
 test('Nenhuma administração por '+label+' — sem escrita, leitura ou mudança de flags',()=>{
  const f=load(fixture({activeEmail:active,effectiveEmail:effective}));
  const sheet=f.snapshot(),props=JSON.stringify([...f.props]),reads=f.reads();
  for(const n of [...admin,'executarHomologacaoMatriculasV3'])assert.throws(()=>f.ctx[n]('WEB-AULA05-2026','tentativa'),/ADMIN_NAO_AUTORIZADO/,n);
  assert.equal(f.snapshot(),sheet);assert.equal(JSON.stringify([...f.props]),props);assert.equal(f.batches(),0);assert.equal(f.reads(),reads);assert.equal(f.locks(),0);
 });
}
test('Proprietário só inicializa identidade via preparação, não por leitura ou liberação',()=>{
 const f=fixture();f.props.delete('WEB_NOTAS_V3_ADMIN_EMAIL');assert.throws(()=>f.ctx.statusIntegracaoNotasV3(),/ADMIN_NAO_AUTORIZADO/);
 assert.equal(f.props.has('WEB_NOTAS_V3_ADMIN_EMAIL'),false);
 f.ctx.prepararIntegracaoNotasV3();assert.equal(f.props.get('WEB_NOTAS_V3_ADMIN_EMAIL'),'owner@example.test');assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');
});
test('Mesmo usuário ativo/efetivo é rejeitado se não é o administrador vinculado',()=>{
 const f=fixture({activeEmail:'other@example.test',effectiveEmail:'other@example.test'});const p=JSON.stringify([...f.props]);
 assert.throws(()=>f.ctx.prepararIntegracaoNotasV3(),/ADMIN_NAO_AUTORIZADO/);assert.equal(JSON.stringify([...f.props]),p);
});
test('Falha de Session nega administração sem tocar secret, flags ou Sheet',()=>{
 const f=fixture();f.ctx.Session.getActiveUser=()=>{throw Error('unavailable');};const p=JSON.stringify([...f.props]);
 assert.throws(()=>f.ctx.liberarRecebimentoQAWebV3(),/ADMIN_NAO_AUTORIZADO/);assert.equal(JSON.stringify([...f.props]),p);assert.equal(f.reads(),0);
});
test('Sem segurança preparada até flag global true continua bloqueada para POST',()=>{
 const f=fixture();f.props.delete('WEB_NOTAS_V3_SECURITY_READY');const before=f.snapshot();
 assert.throws(()=>f.ctx.liberarRecebimentoQAWebV3(),/ROTACAO_QA_PENDENTE/);
 assert.equal(f.receive(f.event()).ok,false);assert.match(f.ctx.doGet().text,/recebimento bloqueado/);assert.equal(f.snapshot(),before);
});
test('Rotação mantém assinatura QA 3.0.1 e assina novas tentativas com chave nova',()=>{
 const f=fixture(),event=f.event(['run']);assert.equal(f.receive(event).ok,true);
 f.set('Auditoria',2,14,'web-notas-3.0.1-candidata');
 const row=Array.from({length:28},(_,i)=>f.value('Auditoria',2,i+1));f.set('Auditoria',2,10,f.ctx.notasAuditSign(row));
 f.props.delete('WEB_NOTAS_V3_SECURITY_READY');f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
 const oldKey=f.props.get('WEB_NOTAS_V3_HMAC_SECRET'),before=f.snapshot(),sig=f.value('Auditoria',2,10);
 const result=f.ctx.rotacionarChaveQAWebV3();assert.equal(result.status,'ROTACAO_QA_CONCLUIDA');
 assert.equal(f.snapshot(),before);assert.equal(f.props.get('WEB_NOTAS_V3_HMAC_LEGACY_301'),oldKey);
 assert.notEqual(f.props.get('WEB_NOTAS_V3_HMAC_SECRET'),oldKey);assert.ok(!JSON.stringify(result).includes(oldKey));
 assert.equal(f.ctx.rotacionarChaveQAWebV3().status,'ROTACAO_QA_JA_REALIZADA');
 f.ctx.liberarRecebimentoQAWebV3();assert.equal(f.receive(event).signature,sig);
 assert.equal(f.receive(f.event(TASKS.map(t=>t[0]))).ok,true);assert.equal(f.value('4º Bimestre',2,4),10);
 assert.equal(f.value('Auditoria',3,14),'web-notas-3.0.2-candidata');
});
test('Rotação recusa recepção aberta ou auditoria 3.0.2 sem registro de rotação',()=>{
 const f=fixture();f.props.delete('WEB_NOTAS_V3_SECURITY_READY');assert.throws(()=>f.ctx.rotacionarChaveQAWebV3(),/BLOQUEIE/);
 const g=fixture();assert.equal(g.receive(g.event()).ok,true);g.props.delete('WEB_NOTAS_V3_SECURITY_READY');g.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
 assert.throws(()=>g.ctx.rotacionarChaveQAWebV3(),/ROTACAO_EXIGE/);assert.equal(g.locks(),0);
});
test('Rotação interrompida antes de READY permanece bloqueada e pode ser retomada',()=>{
 const f=fixture();f.props.delete('WEB_NOTAS_V3_SECURITY_READY');f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
 const original=f.ctx.PropertiesService.getScriptProperties;let crash=true;
 f.ctx.PropertiesService.getScriptProperties=()=>{const p=original();return{...p,setProperty(k,v){if(crash&&k==='WEB_NOTAS_V3_SECURITY_READY')throw Error('interrupted');return p.setProperty(k,v);}};};
 assert.throws(()=>f.ctx.rotacionarChaveQAWebV3(),/interrupted/);assert.equal(f.props.has('WEB_NOTAS_V3_SECURITY_READY'),false);assert.equal(f.locks(),0);
 assert.equal(f.receive(f.event()).ok,false);crash=false;assert.equal(f.ctx.rotacionarChaveQAWebV3().status,'ROTACAO_QA_CONCLUIDA');
});
test('Manifesto declara apenas Sheets e identidade de usuário necessários',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../integrations/web-appscript-v3-qa/appsscript.json'),'utf8'));
 assert.deepEqual(manifest.oauthScopes.sort(),['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/userinfo.email'].sort());
});
