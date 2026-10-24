#!/usr/bin/env python3
"""One-shot source-pinned hardening. Only four allowlisted files may change."""
import hashlib
import json
from pathlib import Path
import re
import sys
ROOT = Path(__file__).resolve().parents[1]
ADMIN = ['prepararIntegracaoNotasV3','statusIntegracaoNotasV3','consultarConflitoDocenteV3','cadastrarAtividadeNotasV3','bloquearRecebimentoNotasV3','encerrarAtividadeNotasV3','encerrarAula05ParaCorrecaoV3','liberarRecebimentoQAWebV3','verificarStatusWebV3']
PATH = 'integrations/web-appscript-v3-qa/'
EXPECTED = {'Code.gs':'2cb660f440c2c8659775e28b93e56d3e82e95e05','HomologacaoV3.gs':'3693b8ce2fdaa7c11d334b8c7742e4dc0dc5c44e','appsscript.json':'7b45b118ef217007ebaeb9949e55b25641227e2e'}
HARNESS_BLOB='eeeb85784607b7e21a933b9fc2dfbe8c34285fd7'
def blob(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def transform(root):
    original={name:(root/PATH/name).read_bytes() for name in EXPECTED}
    for name,data in original.items():
        if blob(data)!=EXPECTED[name]:raise RuntimeError('Source changed; refusing overwrite: '+name)
    hpath=root/'tests/web-a05-id03/harness-v3.cjs'
    if blob(hpath.read_bytes())!=HARNESS_BLOB:raise RuntimeError('Harness changed; refusing overwrite')
    code=original['Code.gs'].decode()
    funcs=re.findall(r'^function (\w+)\(',code,re.M)
    constants=re.findall(r'^var ([A-Z_]+)\s*=',code,re.M)
    if len(funcs)!=62 or not set(ADMIN).issubset(funcs):raise RuntimeError('Unexpected API surface')
    code=code.replace('3.0.1 CANDIDATA QA','3.0.2 CANDIDATA QA').replace("version:'web-notas-3.0.1-candidata'", "version:'web-notas-3.0.2-candidata'")
    old="enabled:p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true'"
    if code.count(old)!=1:raise RuntimeError('Config precondition')
    code=code.replace(old,old+"&&p.getProperty('WEB_NOTAS_V3_SECURITY_READY')==='true'")
    old="return notasSign(JSON.stringify(data));"
    new="""var legacy=PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301');
  var historical=['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata'].includes(row[13]);
  var key=historical&&legacy?legacy:notasSecret();
  return webHex(Utilities.computeHmacSha256Signature(JSON.stringify(data),key));"""
    if code.count(old)!=1:raise RuntimeError('Signing precondition')
    code=code.replace(old,new)
    exports=','.join(f'{n}:{n}' for n in constants+funcs)
    wrapped='''/** V3.0.2: only HTTP handlers and authenticated administrative facades are public.
 * Helpers live inside a closure; no secret, store or signature helper is a top-level RPC.
 * Do not reintroduce top-level aliases from test harnesses in this project.
 */
var WEB_V3_PRIVATE_ = (function(){
'''+code+'\nreturn Object.freeze({'+exports+'});\n})();\n'
    wrapped+='''
/** Effective user alone identifies the deployment owner, not the caller. Fail closed. */
function webAdminIdentityV3_(bootstrap){
  var active='',effective='';
  try{active=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
      effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();}catch(e){}
  if(!active||!effective||active!==effective)throw new Error('ADMIN_NAO_AUTORIZADO');
  var p=PropertiesService.getScriptProperties(),saved=p.getProperty('WEB_NOTAS_V3_ADMIN_EMAIL');
  if(saved?active!==saved:!bootstrap)throw new Error('ADMIN_NAO_AUTORIZADO');
  if(!saved)p.setProperty('WEB_NOTAS_V3_ADMIN_EMAIL',active);
}
function webAdminExecV3_(name,args,bootstrap){
  webAdminIdentityV3_(bootstrap===true);
  if(name==='prepararIntegracaoNotasV3')WEB_V3_PRIVATE_.bloquearRecebimentoNotasV3();
  if(name==='liberarRecebimentoQAWebV3'&&PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_V3_SECURITY_READY')!=='true')
    throw new Error('ROTACAO_QA_PENDENTE: arquive implantações anteriores e execute rotacionarChaveQAWebV3.');
  return WEB_V3_PRIVATE_[name].apply(null,Array.prototype.slice.call(args));
}
function doGet(){return WEB_V3_PRIVATE_.doGet();}
function doPost(e){return WEB_V3_PRIVATE_.doPost(e);}
'''
    for name in ADMIN:
        wrapped+=f"function {name}(){{return webAdminExecV3_('{name}',arguments,{str(name=='prepararIntegracaoNotasV3').lower()});}}\n"
    wrapped+='''
/** Run only AFTER archiving ALL older deployments of this Web script project.
 * Keeps the old QA key solely to read existing receipts; never prints either key.
 */
function rotacionarChaveQAWebV3(){
  webAdminIdentityV3_(false);
  var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  if(p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true')throw new Error('BLOQUEIE_RECEBIMENTO_ANTES');
  try{lock.waitLock(20000);held=true;
    if(p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true')throw new Error('BLOQUEIE_RECEBIMENTO_ANTES');
    var c=WEB_V3_PRIVATE_.notasConfig();
    if(p.getProperty('WEB_NOTAS_V3_SECURITY_READY')==='true'){
      if(!p.getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301'))throw new Error('ESTADO_ROTACAO_INCONSISTENTE');
      return {status:'ROTACAO_QA_JA_REALIZADA',enabled:false,version:'web-notas-3.0.2-candidata'};
    }
    var book=WEB_V3_PRIVATE_.notasReadBook(c,['Auditoria']);
    book.sheets.Auditoria.rows.forEach(function(row,i){
      if(i>0&&row&&!WEB_V3_PRIVATE_.notasBlank(row[7])){
        if(!['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata'].includes(row[13]))throw new Error('ROTACAO_EXIGE_CONFERENCIA_DOCENTE');
        WEB_V3_PRIVATE_.notasVerifyAudit(book.sheets.Auditoria,i);
      }
    });
    var legacy=p.getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301');
    if(!legacy){legacy=WEB_V3_PRIVATE_.notasSecret();p.setProperty('WEB_NOTAS_V3_HMAC_LEGACY_301',legacy);}
    // READY written last: interrupted rotation stays blocked and may be resumed.
    var key=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
    p.setProperty('WEB_NOTAS_V3_HMAC_SECRET',key);
    p.setProperty('WEB_NOTAS_V3_SECURITY_ROTATED_AT',new Date().toISOString());
    p.setProperty('WEB_NOTAS_V3_SECURITY_READY','true');
    var result={status:'ROTACAO_QA_CONCLUIDA',enabled:false,version:'web-notas-3.0.2-candidata',historicalSignatures:'PRESERVADAS'};
    console.log('WEB_V3_SEGURANCA '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
'''
    homolog=original['HomologacaoV3.gs'].decode()
    target='function executarHomologacaoMatriculasV3(){'
    if homolog.count(target)!=1:raise RuntimeError('Homologation precondition')
    helpers=[n for n in constants+funcs if n not in ADMIN+['doGet','doPost'] and re.search(r'\b'+n+r'\b',homolog)]
    alias='\n  var '+','.join(f'{n}=WEB_V3_PRIVATE_.{n}' for n in helpers)+';\n'
    homolog=homolog.replace(target,target+'\n  webAdminIdentityV3_(false);'+alias)
    manifest=json.loads(original['appsscript.json'])
    manifest['oauthScopes'].append('https://www.googleapis.com/auth/userinfo.email')
    h=hpath.read_text()
    h=h.replace('function fixture(){','function fixture(options={}){')
    h=h.replace("  let model={}","  p.set('WEB_NOTAS_V3_ADMIN_EMAIL','owner@example.test');\n  p.set('WEB_NOTAS_V3_SECURITY_READY','true');\n  let model={}")
    h=h.replace('const ctx=vm.createContext({console,Utilities:utilities,',"""const ctx=vm.createContext({console,Utilities:utilities,
    Session:{getActiveUser:()=>({getEmail:()=>options.activeEmail===undefined?'owner@example.test':options.activeEmail}),
      getEffectiveUser:()=>({getEmail:()=>options.effectiveEmail===undefined?'owner@example.test':options.effectiveEmail})},""")
    insert="new vm.Script(source,{filename:'Code.gs'}).runInContext(ctx);"
    h=h.replace(insert,insert+"""
  // Test-only access to lexical helpers. NEVER copy these aliases into Apps Script.
  const internal=ctx.WEB_V3_PRIVATE_;
  if(options.exposeInternals!==false)for(const [name,value]of Object.entries(internal))if(!(name in ctx))ctx[name]=value;
""")
    for n in constants:h=h.replace('ctx.'+n,'internal.'+n)
    h=h.replace('mode:v=>{failMode=v},model:', 'session:(active,effective)=>{options.activeEmail=active;options.effectiveEmail=effective;},mode:v=>{failMode=v},model:')
    result={root/PATH/'Code.gs':wrapped,root/PATH/'HomologacaoV3.gs':homolog,root/PATH/'appsscript.json':json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',hpath:h}
    for p,text in result.items():p.write_text(text)
    return list(result)
if __name__=='__main__':
    root=Path(sys.argv[1]).resolve() if len(sys.argv)==2 else ROOT
    paths=transform(root)
    print('HARDENED_FILES',*[str(p.relative_to(root)) for p in paths],sep='\n')
