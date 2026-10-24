#!/usr/bin/env python3
"""Gera a variante PROD a partir do núcleo QA homologado, sem alterar o QA.
Não usa rede, não toca planilhas e não habilita implantações.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'integrations/web-appscript-v3-qa/Code.gs'
DEST=ROOT/'integrations/web-appscript-production'
SHEET='1cPQD_ie3cEqt11fLXT398DPQIi5bnqkmTqfl9yk8a_Q'
s=QA.read_text()
def once(a,b):
    global s
    if s.count(a)!=1:raise ValueError('Precondition failed: '+a[:90])
    s=s.replace(a,b)
def block(start,end,new):
    global s
    a=s.index(start);b=s.index(end,a)
    s=s[:a]+new+'\n'+s[b:]
s=s.replace('WEB_NOTAS_V3_','WEB_NOTAS_PROD_').replace('web-notas-3.0.2-candidata','web-notas-3.1.0')
s=s.replace('1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE',SHEET)
s=s.replace('QA_DECLARADO','DECLARADO').replace('NOTAS_V3_QA','NOTAS_V3_PROD')
s=s.replace('3.0.2 CANDIDATA QA, NÃO IMPLANTADA.','3.1.0 — PRODUÇÃO; ativação explícita do proprietário.')
s=s.replace('SOMENTE Desenvolvimento Web. Destino fixo: NOVA CÓPIA V3 sintética.','SOMENTE Desenvolvimento Web. Destino fixo: boletim novo e privado da turma.')
s=s.replace('SEM identificação real de estudantes, SEM servidor público habilitado.','Identificação declarada sem login; administração autenticada e recepção bloqueada por padrão.')
s=s.replace('// Produção BLOQUEADA até validação do formato SUAP/autenticação.','// Identificação declarada: não consulta SUAP nem autentica o estudante.')
s=s.replace('// QA: somente caracteres numéricos ASCII, 1 a 32; NÃO afirma comprimento institucional.','// Limite técnico: 1 a 32 algarismos ASCII, sem presumir comprimento institucional.')
s=s.replace('Confira a matrícula diretamente no SUAP.','Confira a matrícula digitada; em caso de dúvida, procure o professor.')
block('function notasConfig() {','function notasSecret()',r'''function notasConfig() {
  var p=PropertiesService.getScriptProperties();
  var id=p.getProperty('WEB_NOTAS_PROD_SPREADSHEET_ID')||WEB_CFG.spreadsheetId;
  notasAssert(id===WEB_CFG.spreadsheetId,'Destino de produção não autorizado.');
  var mode=p.getProperty('WEB_NOTAS_PROD_MODE')||'PROD';
  notasAssert(mode==='PROD','Ambiente de produção inválido.');
  return {id:id,mode:mode,enabled:p.getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')==='true'&&
    p.getProperty('WEB_NOTAS_PROD_SECURITY_READY')==='true'};
}''')
block('function notasIdentityAllowed(identity,config){','function notasNormalize(payload){',r'''function notasIdentityAllowed(identity,config){
  notasAssert(config.mode==='PROD','Ambiente de produção inválido.');
  // Campos já validados por webIdentity; não exige cadastro ou conta institucional.
  notasAssert(identity.members.length>=1&&identity.members.length<=8,'Integrantes inválidos.');
}
/** Limites de uso de melhor esforço. CacheService não é identidade nem proteção DDoS. */
function notasRateLimit_(identity){
  var cache=CacheService.getScriptCache(),minute=Math.floor(Date.now()/60000),hour=Math.floor(Date.now()/3600000);
  var keys=[['prod:global:'+minute,180,120],['prod:team:'+hour+':'+webSha256(identity.teamId),40,3600]];
  identity.members.forEach(function(m){keys.push(['prod:member:'+hour+':'+webSha256(m.enrollment),30,3600]);});
  keys.forEach(function(k){var n=Number(cache.get(k[0])||0);
    if(!Number.isFinite(n)||n>=k[1])notasErr('LIMITE_TEMPORARIO',null,null,
      'Limite temporário de tentativas. Aguarde antes de tentar novamente.','Suas respostas foram preservadas. Procure o professor se o problema persistir.');
  });
  keys.forEach(function(k){cache.put(k[0],String(Number(cache.get(k[0])||0)+1),k[2]);});
}''')
once("  var n=notasNormalize(payload);notasIdentityAllowed(n.identity,config);notasSecret();",
     "  notasAssert(payload&&payload.environment==='PROD','Cliente de produção não confirmado. Atualize a página.');\n  var n=notasNormalize(payload);notasIdentityAllowed(n.identity,config);notasSecret();notasRateLimit_(n.identity);")
block('  var legacy=PropertiesService.getScriptProperties()', 'function notasVerifyAudit(sheet,i){', r'''  return webHex(Utilities.computeHmacSha256Signature(JSON.stringify(data),notasSecret()));
}''')
s=s.replace('Recebimento QA V3 bloqueado.','Recebimento de atividades bloqueado pelo professor.')
block('function doGet(){','function doPost(e){',r'''function doGet(e){
  var c=notasConfig();
  if(e&&e.parameter&&e.parameter.action==='health'){
    var nonce=String(e.parameter.nonce||'');
    if(!/^[A-Za-z0-9-]{12,90}$/.test(nonce))return ContentService.createTextOutput('Requisição inválida.').setMimeType(ContentService.MimeType.TEXT);
    var active=false;
    try{if(c.enabled){var b=notasReadBook(c,['Atividades']),a=notasCatalog(b.sheets.Atividades)[WEB_CFG.activity];
      active=!!(a&&a.enabled&&!PropertiesService.getScriptProperties().getProperty(notasClosedKeyV3(WEB_CFG.activity)));}}
    catch(error){active=false;}
    return webReturn({ok:true,channel:'web-status-aula05',nonce:nonce,version:WEB_CFG.version,
      mode:'PROD',enabled:active,activity:WEB_CFG.activity});
  }
  return ContentService.createTextOutput('Web '+WEB_CFG.version+' — PROD — recebimento '+
    (c.enabled?'habilitado':'bloqueado')+' — nome, matrícula e equipe; notas 0–10 e maior nota')
    .setMimeType(ContentService.MimeType.TEXT);
}''')
start=s.index('/** Effective user alone identifies')
s=s[:start]+r'''/** Nenhuma identidade efetiva isolada autoriza administração remota. */
function webAdminIdentityV3_(bootstrap){
  var active='',effective='';
  try{active=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
      effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();}catch(e){}
  if(!active||!effective||active!==effective)throw new Error('ADMIN_NAO_AUTORIZADO');
  var p=PropertiesService.getScriptProperties(),saved=p.getProperty('WEB_NOTAS_PROD_ADMIN_EMAIL');
  if(saved?active!==saved:!bootstrap)throw new Error('ADMIN_NAO_AUTORIZADO');
  if(!saved)p.setProperty('WEB_NOTAS_PROD_ADMIN_EMAIL',active);
}
function webAdminExecV3_(name,args){webAdminIdentityV3_(false);return WEB_V3_PRIVATE_[name].apply(null,Array.prototype.slice.call(args));}
function doGet(e){return WEB_V3_PRIVATE_.doGet(e);}
function doPost(e){return WEB_V3_PRIVATE_.doPost(e);}
function bloquearRecebimentoProducaoWeb(){return webAdminExecV3_('bloquearRecebimentoNotasV3',arguments);}
function verificarStatusProducaoWeb(){return webAdminExecV3_('verificarStatusWebV3',arguments);}
function consultarConflitoDocenteV3(){return webAdminExecV3_('consultarConflitoDocenteV3',arguments);}
function cadastrarAtividadeNotasV3(){return webAdminExecV3_('cadastrarAtividadeNotasV3',arguments);}
function encerrarAtividadeNotasV3(){return webAdminExecV3_('encerrarAtividadeNotasV3',arguments);}
function encerrarAula05ParaCorrecaoV3(){return webAdminExecV3_('encerrarAula05ParaCorrecaoV3',arguments);}
function bloquearRecebimentoNotasV3(){return bloquearRecebimentoProducaoWeb();}
/** Executar uma vez no editor do proprietário; repetir é seguro e não apaga notas. */
function ativarProducaoWeb(){
  webAdminIdentityV3_(true);
  var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
  p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
  try{
    lock.waitLock(20000);held=true;
    var api=WEB_V3_PRIVATE_,cfg=api.notasConfig();
    var book=api.notasReadBook(cfg,['Atividades','Auditoria','Equipes','Alunos','Resultados',
      '1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre']);
    api.notasHeaders(book.sheets.Auditoria,api.AU_HEADERS);api.notasHeaders(book.sheets.Equipes,api.T_HEADERS);
    api.notasHeaders(book.sheets.Alunos,api.A_HEADERS);api.notasHeaders(book.sheets.Resultados,api.R_HEADERS);
    api.notasCheckCatalog(book);
    var hasAudit=book.sheets.Auditoria.rows.some(function(r,i){return i>0&&r&&!api.notasBlank(r[7]);});
    var key=p.getProperty('WEB_NOTAS_PROD_HMAC_SECRET');
    if(!key){if(hasAudit)throw new Error('CHAVE_AUSENTE_COM_HISTORICO: não gerar outra chave.');
      key=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
      p.setProperty('WEB_NOTAS_PROD_HMAC_SECRET',key);}
    api.notasSecret();
    book.sheets.Auditoria.rows.forEach(function(r,i){if(i>0&&r&&!api.notasBlank(r[7]))api.notasVerifyAudit(book.sheets.Auditoria,i);});
    var catalog=api.notasCatalog(book.sheets.Atividades);
    if(!Object.keys(catalog).some(function(id){return catalog[id].enabled&&!p.getProperty(api.notasClosedKeyV3(id));}))
      throw new Error('NENHUMA_ATIVIDADE_ABERTA');
    p.setProperty('WEB_NOTAS_PROD_SPREADSHEET_ID',api.WEB_CFG.spreadsheetId);
    p.setProperty('WEB_NOTAS_PROD_MODE','PROD');
    p.setProperty('WEB_NOTAS_PROD_SECURITY_READY','true');
    p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','true');
    var result={status:'WEB_PRODUCAO_ATIVADA',version:api.WEB_CFG.version,mode:'PROD',enabled:true,
      spreadsheetId:api.WEB_CFG.spreadsheetId,studentLogin:false};
    console.log('WEB_PRODUCAO '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
'''
s=s.replace("mode:'QA'","mode:'PROD'").replace("production:false","production:true")
DEST.mkdir(parents=True,exist_ok=True)
(DEST/'Code.gs').write_text(s)
(DEST/'HomologacaoV3.gs').write_text('''/** Não executar ensaios fictícios no boletim da turma. */
function executarHomologacaoMatriculasV3(){
  throw new Error('AMBIENTE_PRODUCAO: homologação preservada na cópia QA. Use verificarStatusProducaoWeb.');
}
''')
(DEST/'appsscript.json').write_text((ROOT/'integrations/web-appscript-v3-qa/appsscript.json').read_text())
h=(ROOT/'tests/web-a05-id03/harness-v3.cjs').read_text()
h=h.replace('web-appscript-v3-qa/Code.gs','web-appscript-production/Code.gs').replace('1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE',SHEET)
h=h.replace('WEB_NOTAS_V3_','WEB_NOTAS_PROD_')
h=h.replace('let model={},batches=0','const cache=new Map();\n  let model={},batches=0')
h=h.replace('PropertiesService:{getScriptProperties:',"CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)})},\n    PropertiesService:{getScriptProperties:")
h=h.replace("schema:'web-a05-submission-v2',activity:","environment:'PROD',schema:'web-a05-submission-v2',activity:")
h=h.replace("schema:'web-notas-submission-v3',activity:","environment:'PROD',schema:'web-notas-submission-v3',activity:")
h=h.replace('return {ctx,props:p,identity','return {ctx,props:p,cache,identity')
p=ROOT/'tests/web-production';p.mkdir(parents=True,exist_ok=True);(p/'harness.cjs').write_text(h)
print('Generated PROD source and isolated harness; QA source untouched.')
