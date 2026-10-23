/** Execução única de QA contra o receptor real, equipe exclusivamente fictícia. */
import { chromium } from '@playwright/test';
import {readFileSync} from 'node:fs';
const endpoint='https://script.google.com/macros/s/AKfycbyDC9tGFBTOjZXau4m2vWQVPoYa3gZKMldc1NjAMZCUstHx0SICMG8Z4ekAWvLfnmlc/exec';
const url='https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/?qa-live=20261023';
const js=readFileSync(new URL('./entrega-appscript.js',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({acceptDownloads:true});
const page=await ctx.newPage();
const failures=[];
page.on('requestfailed',request=>{
  const addr=new URL(request.url());
  if(['script.google.com','script.googleusercontent.com'].some(n=>addr.hostname.endsWith(n)))failures.push(addr.hostname+' '+String(request.failure()?.errorText||'').slice(0,160));
});
try {
  await page.route('**/entrega-config.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',
    body:"window.WebEntregaConfig=Object.freeze({endpoint:"+JSON.stringify(endpoint)+",activated:true,activity:'WEB-AULA05-2026',schema:'web-a05-submission-v1'});"
  }));
  await page.route('**/entrega-appscript.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',body:js
  }));
  await page.addInitScript(()=>{
    window.__qaReceived=[];
    window.addEventListener('message',e=>{
      if(e.data?.channel==='web-entrega-aula05')window.__qaReceived.push({
        origin:e.origin,ok:e.data.ok===true,hasReceipt:!!e.data.receiptId,
        error:e.data.error?String(e.data.error).slice(0,150):''
      });
    });
  });
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.WebTeam?.restore&&window.WebEntrega?.ativado&&window.WebLabEvidence?.printPartial,{timeout:30000});
  await page.evaluate(()=>{
    window.WebTeam.restore({
      teamId:'fa4e2212-5141-4f1e-9b45-35e772dcc2c0',
      team:'Equipe QA FICTICIA',
      members:[{name:'Ana Teste Ficticio'},{name:'Bruno Teste Ficticio'}]
    });
    window.__qaPrinted=false;
    window.print=()=>{window.__qaPrinted=true;};
  });
  await page.locator('#quick-pdf').click();
  let timedOut=false;
  try {
    await page.waitForFunction(()=>{
      const s=document.getElementById('web-delivery-status')?.textContent||'';
      return s.includes('ENVIO CONFIRMADO') || s.includes('ENVIO NÃO CONFIRMADO') || s.includes('ENVIO NÃO REALIZADO');
    },null,{timeout:52000});
  }catch{timedOut=true;}
  const result=await page.evaluate(()=>({
    status:document.getElementById('web-delivery-status')?.textContent?.slice(0,400),
    kind:document.getElementById('web-delivery-status')?.dataset.kind||'',
    modal:document.getElementById('evidence-dialog')?.open,
    printed:!!window.__qaPrinted,
    events:window.__qaReceived||[]
  }));
  console.log('QA_BROWSER_RESULT',JSON.stringify({timedOut,...result,failures}));
  if(timedOut||!result.status?.includes('ENVIO CONFIRMADO'))process.exitCode=1;
}finally{await browser.close();}
