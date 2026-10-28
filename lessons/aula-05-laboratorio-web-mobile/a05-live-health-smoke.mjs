import { chromium } from 'playwright';
const url='https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const observed=[];
 page.on('console',m=>{if(m.type()==='error')observed.push({type:'console-error',message:m.text().slice(0,160)});});
 page.on('pageerror',e=>observed.push({type:'page-error',name:e.name,message:String(e.message).slice(0,160)}));
 page.on('framenavigated',f=>{if(f!==page.mainFrame())observed.push({type:'frame',host:(()=>{try{return new URL(f.url()).hostname}catch{return 'invalid'}})()});});
 await page.addInitScript(()=>{
  window.__a05HealthEvents=[];
  window.addEventListener('message',ev=>{
   const d=ev.data;
   if(d&&typeof d==='object'&&d.channel==='web-status-aula05'){
    window.__a05HealthEvents.push({origin:ev.origin,channel:d.channel,ok:d.ok,version:d.version,enabled:d.enabled,nonceLength:String(d.nonce||'').length});
   }
  });
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.WebProductionGate&&!!window.WebEntregaConfig,{timeout:15000});
 const state=await page.evaluate(async()=>{
  const c=window.WebEntregaConfig;
  let result;
  try{await window.WebProductionGate.ensureReady(c);result='READY'}catch(e){result='ERROR: '+String(e.message);}
  return {result,activated:c.activated,requiredMode:c.requiredMode,events:window.__a05HealthEvents};
 });
 console.log('A05_LIVE_HEALTH '+JSON.stringify(state));
 console.log('A05_BROWSER_DIAG '+JSON.stringify(observed.slice(-20)));
 if(state.result!=='READY')process.exitCode=2;
}finally{await browser.close();}
