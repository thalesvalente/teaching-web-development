import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
const ENDPOINT='https://script.google.com/macros/s/PRODUCTION-MOCK/exec';
async function setup(page,health={}){
  let posts=0,payload=null;
  await page.route('**/entrega-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.WebEntregaConfig='+JSON.stringify({endpoint:ENDPOINT,activated:true,requiredMode:'PROD',activity:'WEB-AULA05-2026',schema:'web-a05-submission-v2'})+';'}));
  await page.route(ENDPOINT+'**',route=>{
    const req=route.request();
    if(req.method()==='GET'){
      const u=new URL(req.url());
      const d={ok:true,channel:'web-status-aula05',nonce:u.searchParams.get('nonce'),version:'web-notas-3.1.0',mode:'PROD',enabled:true,activity:'WEB-AULA05-2026',...health};
      return route.fulfill({contentType:'text/html',body:'<script>top.postMessage('+JSON.stringify(d)+',"*")</script>'});
    }
    posts++;
    const p=new URLSearchParams(req.postData());payload=JSON.parse(p.get('payload'));
    const d={ok:true,channel:'web-entrega-aula05',nonce:p.get('nonce'),activity:'WEB-AULA05-2026',instrument:'laboratorio-vivo-tsx-equipe',
      codeSha256:createHash('sha256').update(payload.evidence.codigoFonteCompleto).digest('hex'),gradeReceived:payload.evidence.xp/10,
      bestGrades:[10],teamId:payload.identity.teamId,memberCount:1,grade:null,status:'RECEBIDO_PENDENTE_VALIDACAO',receiptId:'WEB-PROD-MOCK',
      answersSha256:'a'.repeat(64),signature:'b'.repeat(64),receivedAt:'2026-10-24T04:00:00Z'};
    return route.fulfill({contentType:'text/html',body:'<script>top.postMessage('+JSON.stringify(d)+',"*")</script>'});
  });
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado');
  await page.evaluate(()=>{window.print=()=>{};window.WebTeam.restore({teamId:'aaaa1111-bbbb-4444-8888-cccc11112222',team:'Equipe Horizonte',members:[{name:'Maria Silva',enrollment:'000123456789'}]});});
  return {posts:()=>posts,payload:()=>payload};
}
for(const [name,health] of [
  ['receptor QA',{mode:'QA'}],['versão antiga',{version:'web-notas-3.0.2-candidata'}],['recepção fechada',{enabled:false}],
  ['booleano inválido',{enabled:'true'}],['atividade diferente',{activity:'WEB-AULA06-2026'}]
])test('produção não transmite dados ao '+name,async({page})=>{
  const r=await setup(page,health);await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO REALIZADO');expect(r.posts()).toBe(0);
  await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');
});
test('produção habilitada envia ambiente PROD, nome matrícula equipe e conserva maior nota',async({page})=>{
  const r=await setup(page);await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO CONFIRMADO');
  expect(r.posts()).toBe(1);expect(r.payload().environment).toBe('PROD');
  expect(r.payload().identity.members).toEqual([{name:'Maria Silva',enrollment:'000123456789'}]);
  await expect(page.locator('#web-delivery-status')).toContainText('Maria Silva — Matrícula: 000123456789 — 10.0/10');
});
test('arquivo de verificação ausente falha fechado sem POST',async({page})=>{
  const r=await setup(page);await page.evaluate(()=>{window.WebProductionGate=undefined;});
  await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('Verificação de produção indisponível');expect(r.posts()).toBe(0);
});
