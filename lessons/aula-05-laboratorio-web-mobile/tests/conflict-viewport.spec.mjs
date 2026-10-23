import {test,expect} from '@playwright/test';
const ENDPOINT='https://script.google.com/macros/s/WEB-SCROLL-QA-MOCK/exec';
const names=['Ana Teste Ficticio','Bruno Teste Ficticio','Carla Teste Ficticio','Diana Teste Ficticio','Eduardo Teste Ficticio','Fabio Teste Ficticio','Gabriela Teste Ficticio','Helena Teste Ficticio'];
for(const size of [{width:320,height:650},{width:1440,height:900}]){
 test('conflito do oitavo integrante fica dentro da área visível em '+size.width+'px',async({page})=>{
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/entrega-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.WebEntregaConfig=Object.freeze('+JSON.stringify({schema:'web-a05-submission-v2',endpoint:ENDPOINT,activity:'WEB-AULA05-2026',activated:true})+');'}));
  await page.route(ENDPOINT,route=>{
   const p=new URLSearchParams(route.request().postData()||'');
   const r={ok:false,channel:'web-entrega-aula05',nonce:p.get('nonce'),code:'MATRICULA_NOME_DIVERGENTE',memberIndex:7,field:'enrollment',message:'Matrícula vinculada a um nome diferente.',action:'Confira a matrícula do integrante 8.'};
   return route.fulfill({status:200,contentType:'text/html',body:'<script>top.postMessage('+JSON.stringify(r)+',"*")</script>'});
  });
  await page.goto('/index.html');await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await page.evaluate(names=>window.WebTeam.restore({teamId:'aaaa1111-bbbb-4444-8888-cccc11112222',team:'Equipe QA Visibilidade',members:names.map((name,i)=>({name,enrollment:String(1000+i).padStart(8,'0')}))}),names);
  await page.locator('#team-open').click();await page.locator('.team-panel-body').evaluate(el=>{el.scrollTop=0;});
  await page.locator('[data-close-dialog="team-dialog"]').click();
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
  const field=page.locator('#web-member-7-enrollment');
  await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');
  await expect.poll(()=>field.evaluate(el=>{
   const r=el.getBoundingClientRect(),p=el.closest('.team-panel-body').getBoundingClientRect();
   return r.top>=Math.max(0,p.top)-1&&r.bottom<=Math.min(innerHeight,p.bottom)+1&&r.left>=0&&r.right<=innerWidth+1;
  })).toBe(true);
  await expect(page.locator('#team-feedback')).toContainText('Helena Teste Ficticio');
  await expect(page.locator('#team-feedback')).toContainText('00001007');
  await expect(page.locator('#evidence-dialog')).not.toBeVisible();
 });
}
