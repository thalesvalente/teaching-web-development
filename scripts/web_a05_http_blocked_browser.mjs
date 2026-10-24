/** Prova HTTP de bloqueio: somente payload {}, nunca entrega acadêmica válida. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ENDPOINT='https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec';
export const TOP_ORIGIN='https://thalesvalente.github.io';
export const BLOCKED='Web web-notas-3.0.1-candidata — QA — recebimento bloqueado — matrícula obrigatória, maior nota, média automática';
export const isExpectedGet=text=>typeof text==='string'&&text.trim()===BLOCKED;
export const validOrigin=origin=>typeof origin==='string'&&(origin==='https://script.google.com'||/^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin)||/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin));
export function isBlockedReply(message,nonce){
  const d=message?.data;
  return validOrigin(message?.origin)&&d?.ok===false&&d.channel==='web-entrega-aula05'&&
    d.nonce===nonce&&d.message==='Recebimento QA V3 bloqueado.'&&
    d.code==='ENVIO_SEM_CONFIRMACAO'&&d.retryable===false;
}
export function htmlDiagnostics(text){
  return {bytes:Buffer.byteLength(text),literalEnvelope:text.includes('top.postMessage('),
    literalFalse:/"ok"\s*:\s*false/.test(text),
    sandbox:/userHtml|sandboxFrame|htmlService|iframe/i.test(text),
    escapedMarkup:/\\(?:x3[cC]|u003[cC])/.test(text)};
}
export async function main(){
  const require=createRequire(new URL('../lessons/aula-05-laboratorio-web-mobile/package.json',import.meta.url));
  const {chromium}=require('@playwright/test');
  const nonce='qa-blocked-'+randomUUID(),pending=[];
  const summary={status:'HTTP_BLOCKED_FAIL',sha:process.env.GITHUB_SHA||null,
    startedAt:new Date().toISOString(),payload:'EMPTY_OBJECT_ONLY',validStudentSubmission:false,
    production:false,getBefore:false,getAfter:false,postRequests:0,replyVerified:false,
    sheetReadback:'PENDENTE_LEITURA_CONECTOR',diagnostics:[]};
  let browser,context,page,failed=false;
  const checkGet=async()=>{
    const r=await context.request.get(ENDPOINT,{timeout:30000,maxRedirects:5});
    return r.status()===200&&isExpectedGet(await r.text());
  };
  try{
    browser=await chromium.launch();context=await browser.newContext({serviceWorkers:'block'});
    summary.getBefore=await checkGet();assert.equal(summary.getBefore,true,'GET inicial não confirmou V3 QA bloqueado');
    page=await context.newPage();
    const topUrl=TOP_ORIGIN+'/__qa__/web-v3-blocked-probe';
    // Só a página de topo do instrumento é local. Google e seu POST não são mockados.
    await page.route(topUrl,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body>QA Web V3 — bloqueio</body></html>'}));
    await page.addInitScript(()=>{
      window.__qaReplies=[];
      window.addEventListener('message',event=>{
        if(event.data?.channel==='web-entrega-aula05')window.__qaReplies.push({origin:event.origin,data:event.data});
      });
    });
    page.on('request',request=>{if(request.url()===ENDPOINT&&request.method()==='POST')summary.postRequests++;});
    page.on('response',response=>{
      if(response.request().url()!==ENDPOINT||response.request().method()!=='POST')return;
      pending.push((async()=>{
        const text=await response.text();
        summary.diagnostics.push({status:response.status(),host:new URL(response.url()).hostname,
          contentType:(response.headers()['content-type']||'').split(';')[0],...htmlDiagnostics(text)});
      })().catch(()=>summary.diagnostics.push({bodyMetadataUnavailable:true})));
    });
    await page.goto(topUrl);assert.equal(await page.evaluate(()=>location.origin),TOP_ORIGIN);
    await page.evaluate(({url,nonce})=>{
      const frame=document.createElement('iframe');frame.name='blocked-'+nonce;frame.hidden=true;
      const form=document.createElement('form');form.method='POST';form.action=url;form.target=frame.name;
      for(const [key,value]of Object.entries({nonce,payload:'{}'})){
        const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.append(input);
      }
      document.body.append(frame,form);form.submit();
    },{url:ENDPOINT,nonce});
    await page.waitForFunction(n=>window.__qaReplies.some(m=>m.data?.nonce===n),nonce,{timeout:60000});
    const reply=await page.evaluate(n=>window.__qaReplies.find(m=>m.data?.nonce===n),nonce);
    summary.replyVerified=isBlockedReply(reply,nonce);
    summary.replyOrigin=reply.origin;summary.replyCode=reply.data?.code;
    assert.equal(summary.replyVerified,true,'Resposta real não comprova bloqueio com nonce/canal/origem corretos');
    assert.equal(summary.postRequests,1,'Quantidade de POSTs inesperada');
  }catch(error){failed=true;summary.errorType=error.name;}
  finally{
    if(context){try{summary.getAfter=await checkGet();}catch{summary.getAfter=false;failed=true;}}
    await Promise.all(pending);
    if(page)summary.frameOrigins=page.frames().map(f=>{try{return new URL(f.url()).origin;}catch{return 'unknown';}});
    if(!summary.getAfter)failed=true;
    if(!failed&&summary.replyVerified&&summary.getBefore)summary.status='HTTP_BLOCKED_BROWSER_PASS_SCOPED';
    summary.finishedAt=new Date().toISOString();
    if(context)await context.close();if(browser)await browser.close();
    const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../artifacts');await mkdir(root,{recursive:true});
    await writeFile(path.join(root,'web-v3-http-blocked.json'),JSON.stringify(summary,null,2)+'\n');
    console.log('WEB_HTTP_BLOCKED_RESULT '+JSON.stringify(summary));
  }
  return summary.status==='HTTP_BLOCKED_BROWSER_PASS_SCOPED'?0:1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().then(code=>{process.exitCode=code;}).catch(error=>{console.error('HTTP_PROBE_SETUP_FAIL',error.name);process.exitCode=1;});
}
