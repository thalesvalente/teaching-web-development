import {test,expect} from '@playwright/test';
const ENDPOINT='https://script.google.com/macros/s/QA-ID03-HTTP-MOCK/exec';
const names=['Ana Teste Ficticio','Bruno Teste Ficticio'];
const members=names.map((name,i)=>({name,enrollment:i?'00005678':'00001234'}));
async function open(page,activated=true,seed=false){
  await page.route('**/entrega-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',
    body:'window.WebEntregaConfig=Object.freeze('+JSON.stringify({endpoint:ENDPOINT,activated,schema:'web-a05-submission-v2',activity:'WEB-AULA05-2026'})+');'}));
  if(seed)await page.addInitScript(()=>localStorage.setItem('ifma-web-aula05-equipe-v3',JSON.stringify({teamId:'aaaa1111-bbbb-4444-8888-cccc11112222',team:'Equipe QA HTTP',members:[{name:'Ana Teste Ficticio'}]})));
  await page.goto('/index.html');await expect(page.locator('#compiler-status')).toContainText('Executado');
}
async function fill(page,values=members){
  await page.evaluate(m=>window.WebTeam.restore({teamId:'aaaa1111-bbbb-4444-8888-cccc11112222',team:'Equipe QA HTTP',members:m}),values);
}
async function submit(page){
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
}
async function receiptRoute(page,mutate=''){
  await page.route(ENDPOINT,async route=>{
    const p=new URLSearchParams(route.request().postData()),v=JSON.parse(p.get('payload'));
    const crypto=await import('node:crypto');
    const d={ok:true,channel:'web-entrega-aula05',nonce:p.get('nonce'),activity:'WEB-AULA05-2026',
      instrument:'laboratorio-vivo-tsx-equipe',codeSha256:crypto.createHash('sha256').update(v.evidence.codigoFonteCompleto).digest('hex'),
      gradeReceived:v.evidence.xp/10,bestGrades:v.identity.members.map(()=>10),teamId:v.identity.teamId,memberCount:v.identity.members.length,
      grade:null,status:'RECEBIDO_PENDENTE_VALIDACAO',receiptId:'WEB-QA-MOCK',answersSha256:'a'.repeat(64),signature:'b'.repeat(64),receivedAt:'2026-10-23T20:00:00Z'};
    return route.fulfill({status:200,contentType:'text/html',body:'<script>const d='+JSON.stringify(d)+';'+mutate+';top.postMessage(d,"*");</script>'});
  });
}
test('UI-01 default não referencia receptor legado e não ativa POST',async({page})=>{
  await page.goto('/index.html');
  expect(await page.evaluate(()=>window.WebEntregaConfig)).toMatchObject({endpoint:'',activated:false,schema:'web-a05-submission-v2'});
  expect(await page.evaluate(()=>window.WebEntrega.ativado)).toBe(false);
});
test('UI-02 restauração inicial online exige matrícula mesmo antes de WebEntrega inicializar',async({page})=>{
  await open(page,true,true);await page.locator('#team-open').click();
  await expect(page.locator('#web-member-0-enrollment')).toHaveAttribute('aria-required','true');
  await expect(page.locator('#team-progress')).not.toHaveAttribute('aria-valuenow','100');
  await expect(page.locator('#team-summary-title')).toContainText('andamento');
});
test('UI-03 erros locais múltiplos são exibidos juntos e vinculados aos campos',async({page})=>{
  await open(page);await fill(page,[{name:'Ana',enrollment:''},{name:names[1],enrollment:'AB-123'}]);
  await page.locator('#team-open').click();await page.locator('#team-done').click();
  const status=page.locator('#team-feedback');
  await expect(status).toContainText('Matrícula obrigatória');await expect(status).toContainText('AB-123');
  await expect(status).toContainText('nome e sobrenome do integrante 1');
  await expect(page.locator('#web-member-0-name')).toBeFocused();
  for(const id of ['web-member-0-name','web-member-0-enrollment','web-member-1-enrollment']){
    await expect(page.locator('#'+id)).toHaveAttribute('aria-invalid','true');
    await expect(page.locator('#'+id+'-error')).toBeVisible();
    await expect(page.locator('#'+id)).toHaveAttribute('aria-describedby',new RegExp(id+'-error'));
  }
  await expect(page.locator('#web-member-1-name')).not.toHaveAttribute('aria-invalid','true');
});
test('UI-03 offline não marca matrícula vazia como erro ao corrigir outro nome',async({page})=>{
  await open(page,false);await fill(page,[{name:'Ana',enrollment:''}]);
  await page.locator('#team-open').click();await page.locator('#team-done').click();
  await expect(page.locator('#web-member-0-enrollment')).toHaveAttribute('aria-required','false');
  await expect(page.locator('#web-member-0-enrollment')).not.toHaveAttribute('aria-invalid','true');
});
test('UI-05 recibo relaciona nomes, matrículas e maiores notas',async({page})=>{
  await open(page);await receiptRoute(page);await fill(page);await submit(page);
  const status=page.locator('#web-delivery-status');await expect(status).toContainText('ENVIO CONFIRMADO');
  await expect(status).toContainText('Ana Teste Ficticio — Matrícula: 00001234 — 10.0/10');
  await expect(status).toContainText('Bruno Teste Ficticio — Matrícula: 00005678 — 10.0/10');
});
test('UI-07 PDF inclui matrícula textual preenchida e continua parcial sem ela',async({page})=>{
  await open(page,false);await fill(page);
  await page.evaluate(()=>{window.print=()=>{};window.WebLabEvidence.printPartial();});
  await expect(page.locator('#print-report')).toContainText('Ana Teste Ficticio — Matrícula: 00001234');
  await fill(page,[{name:names[0],enrollment:''}]);
  await page.evaluate(()=>window.WebLabEvidence.printPartial());
  await expect(page.locator('#print-report')).toContainText('não informada (PDF local)');
});
test('UI-07 PDF rejeita matrícula diferente da identidade validada',async({page})=>{
  await open(page,false);await fill(page);
  expect(await page.evaluate(()=>{
    const identity=window.WebTeam.getIdentity();identity.members[0].enrollment='99990000';
    try{window.WebLabReport.prepare(document.getElementById('print-report'),window.WebLabEvidence.snapshot(),identity);return false;}catch{return true;}
  })).toBe(true);
});
for(const [label,mutation] of [['NaN','d.gradeReceived=NaN'],['infinito','d.bestGrades[0]=Infinity'],['nota divergente','d.gradeReceived=9.5'],['ok não booleano','d.ok="true"'],['data inválida','d.receivedAt="data-invalida"']]){
  test('UI-09 recusa recibo com '+label,async({page})=>{
    await open(page);await receiptRoute(page,mutation);await fill(page);await submit(page);
    await expect(page.locator('#web-delivery-status')).toContainText('Recibo de recebimento incompatível');
    await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');
  });
}
test('UI-09 mensagem de nonce errado não encerra envio pendente nem duplica POST',async({page})=>{
  await open(page);let requests=0;
  await page.route(ENDPOINT,route=>{requests++;return route.fulfill({status:200,contentType:'text/html',body:'<script>top.postMessage({ok:true,channel:"web-entrega-aula05",nonce:"ERRADO"},"*")</script>'});});
  await fill(page);await submit(page);
  await expect(page.locator('#web-submit')).toBeDisabled();
  await page.evaluate(()=>document.getElementById('web-submit').dispatchEvent(new Event('click')));
  expect(requests).toBe(1);await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');
});
for(const width of [320,360,390,768,1024,1440]){
  test('UI-08 campos e controles sem overflow horizontal em '+width+'px',async({page},testInfo)=>{
    await page.setViewportSize({width,height:800});await open(page);await fill(page);
    await page.locator('#team-open').click();
    const dimensions=await page.locator('#team-dialog').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client+1);
    if(width===320)await page.screenshot({path:testInfo.outputPath('matricula-320.png')});
    for(const id of ['web-member-0-enrollment','web-member-1-enrollment']){
      const r=await page.locator('#'+id).boundingBox();expect(r.width).toBeGreaterThan(80);
      // O DOMRect usa ponto flutuante; o alvo CSS continua sendo 44 px.
      expect(r.height).toBeGreaterThanOrEqual(43.99);
    }
  });
}
