import {readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
export const QA_ORIGIN='https://thalesvalente.github.io';
export const QA_PATH='/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/';
export const QA_SHEET='1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE';
export const LAB=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const STATIC_FILES=Object.freeze(['index.html','style.css','identity-http.css','entrega-config.js','report-print.js','equipe.js','lab.js','entrega-appscript.js','preview.html','preview.js','assets/vendor.js','shared/ProjetoUniversal.tsx']);
const LEGACY_IDS=['AKfycbyDC9tGFBTOjZXau4m2vWQVPoYa3gZKMldc1NjAMZCUstHx0SICMG8Z4ekAWvLfnmlc','AKfycbwnOk069GNPktfrv6r1zb9TsLxQfKPgjvr4EPfZLRHe-OhhSSJUrxnjyYFgo1sBYNP5'];
export function loadLiveSettings(env=process.env){
  const endpoint=env.WEB_QA_V3_EXEC_URL||'';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))
    throw Error('HTTP_QA_BLOCKED: informe WEB_QA_V3_EXEC_URL (/exec V3 verificado); nenhuma requisição foi autorizada.');
  if(LEGACY_IDS.some(id=>endpoint.includes('/'+id+'/')))throw Error('HTTP_QA_BLOCKED: receptor legado não pode ser usado.');
  if(env.WEB_QA_SHEET_ID!==QA_SHEET)throw Error('HTTP_QA_BLOCKED: destino QA V3 não confirmado.');
  const phase=env.WEB_QA_PHASE;
  if(!['blocked','open','closed'].includes(phase))throw Error('HTTP_QA_BLOCKED: fase deve ser blocked, open ou closed.');
  if(env.WEB_QA_AUTHORIZATION!=='FICTICIOS_WEB_V3')throw Error('HTTP_QA_BLOCKED: autorização explícita do ensaio ausente.');
  if(phase==='open' && env.WEB_QA_BACKUP_CONFIRMED!=='true')throw Error('HTTP_QA_BLOCKED: confirme backup e baseline antes do POST habilitado.');
  const runId=env.WEB_QA_RUN_ID||'';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(runId))throw Error('HTTP_QA_BLOCKED: WEB_QA_RUN_ID deve ser UUID e não deve ser reutilizado para repetir cegamente uma execução incerta.');
  return Object.freeze({endpoint,phase,runId,spreadsheetId:QA_SHEET});
}
export function expectedGet(text,phase){
  const state=phase==='open'?'habilitado QA':'bloqueado';
  return String(text).trim()===`Web web-notas-3.0.2-candidata — QA — recebimento ${state} — matrícula obrigatória, maior nota, média automática`;
}
export function staticName(rawUrl){
  const u=new URL(rawUrl);
  if(u.origin!==QA_ORIGIN||!u.pathname.startsWith(QA_PATH))return null;
  let name;try{name=decodeURIComponent(u.pathname.slice(QA_PATH.length))||'index.html';}catch{return null;}
  if(name.includes('..')||name.includes('\\')||name.includes('\0')||!STATIC_FILES.includes(name))return null;
  return name;
}
export async function mountCandidate(context,settings){
  const root=await realpath(LAB),hashes={};
  await context.route(QA_ORIGIN+'/**',async route=>{
    const name=staticName(route.request().url());
    if(!name||route.request().method()!=='GET')return route.abort('blockedbyclient');
    if(name==='entrega-config.js')return route.fulfill({contentType:'application/javascript',body:
      'window.WebEntregaConfig=Object.freeze('+JSON.stringify({endpoint:settings.endpoint,activated:true,schema:'web-a05-submission-v2',activity:'WEB-AULA05-2026'})+');'});
    const file=await realpath(path.join(root,name));
    if(!file.startsWith(root+path.sep))return route.abort('blockedbyclient');
    const content=await readFile(file);hashes[name]=createHash('sha256').update(content).digest('hex');
    const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.tsx':'text/plain'}[path.extname(name)];
    await route.fulfill({status:200,contentType:mime+'; charset=utf-8',body:content});
  });
  return hashes;
}
export const fictionalMembers=()=>[{name:'Ana Teste Ficticio',enrollment:'00001234'},{name:'Bruno Teste Ficticio',enrollment:'00005678'}];
export async function watchMessages(page){
  await page.addInitScript(()=>{
    window.__webHttpQaMessages=[];
    window.addEventListener('message',event=>{
      const good=event.origin==='https://script.google.com'||/^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin)||/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(event.origin);
      if(good&&event.data?.channel==='web-entrega-aula05')window.__webHttpQaMessages.push({origin:event.origin,data:event.data});
    });
    window.print=()=>{};
  });
}
export async function waitMessage(page,nonce){
  await page.waitForFunction(n=>window.__webHttpQaMessages.some(m=>m.data.nonce===n),nonce,{timeout:55000});
  return page.evaluate(n=>window.__webHttpQaMessages.find(m=>m.data.nonce===n),nonce);
}
export async function postAgain(page,endpoint,form){
  await page.evaluate(({endpoint,form})=>{
    window.__webHttpQaMessages=[];
    const frame=document.createElement('iframe');frame.hidden=true;frame.name='qa-replay-'+crypto.randomUUID();
    const node=document.createElement('form');node.hidden=true;node.method='POST';node.action=endpoint;node.target=frame.name;
    for(const [name,value]of Object.entries(form)){const input=document.createElement('input');input.name=name;input.value=value;node.append(input);}
    document.body.append(frame,node);node.submit();
  },{endpoint,form});
  return waitMessage(page,form.nonce);
}
export function privateSurfacePass(s){
  return s?.bridgePresent===true&&s.statusFacadePresent===true&&s.secretHelperVisible===false&&
    s.writeHelperVisible===false&&s.signHelperVisible===false&&s.readHelperVisible===false&&s.nonexistentVisible===false;
}
export async function verifyRpcBoundary(page,endpoint){
  // No valid submission, no secret access or mutating administrative RPC.
  const rejected=await postAgain(page,endpoint,{nonce:'qa-rpc-'+randomUUID(),payload:'{}'});
  if(rejected.data.ok!==false)throw Error('RPC_PREFLIGHT_INVALID_REQUEST_NOT_REJECTED');
  for(const frame of page.frames()){
    if(frame.url()==='about:blank')continue;
    const s=await frame.evaluate(()=>{
      const r=window.google?.script?.run;
      return {bridgePresent:!!r,statusFacadePresent:typeof r?.statusIntegracaoNotasV3==='function',
        secretHelperVisible:typeof r?.notasSecret==='function',writeHelperVisible:typeof r?.notasStore==='function',
        signHelperVisible:typeof r?.notasSign==='function',readHelperVisible:typeof r?.notasReadBook==='function',
        nonexistentVisible:typeof r?.qaNonexistentFunction987654321==='function'};
    }).catch(()=>null);
    if(!s?.bridgePresent)continue;
    if(!privateSurfacePass(s))throw Error('RPC_HELPERS_EXPOSED');
    // Read-only status call: only constant ADMIN_NAO_AUTORIZADO counts as denial.
    // The returned value is discarded on accidental success, never logged.
    const denied=await frame.evaluate(()=>new Promise(resolve=>{
      let finished=false;const timer=setTimeout(()=>done(false),15000);
      function done(v){if(finished)return;finished=true;clearTimeout(timer);resolve(v);}
      try{window.google.script.run.withSuccessHandler(()=>done(false))
        .withFailureHandler(e=>done(String(e?.message||'').includes('ADMIN_NAO_AUTORIZADO')))
        .statusIntegracaoNotasV3();}catch{done(false);}
    }));
    if(!denied)throw Error('RPC_ADMIN_DENIAL_NOT_CONFIRMED');
    return {status:'RPC_BOUNDARY_PASS_SCOPED',helperNamesHidden:true,anonymousReadOnlyAdminDenied:true};
  }
  throw Error('RPC_BRIDGE_NOT_OBSERVED');
}
