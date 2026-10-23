import {test,expect} from '@playwright/test';

const ENDPOINT='https://script.google.com/macros/s/WEB-A05-ID03-QA-MOCK/exec';
async function open(page,activated=true){
  await page.route('**/entrega-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WebEntregaConfig=Object.freeze({endpoint:'"+ENDPOINT+
      "',activity:'WEB-AULA05-2026',activated:"+activated+"});"
  }));
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
}
async function team(page,names=['Ana Teste Ficticio','Bruno Teste Ficticio']){
  await page.locator('#team-open').click();
  await page.locator('#web-team').fill('Equipe QA FICTICIA');
  for(let i=0;i<names.length;i++){
    if(i)await page.locator('#web-add-member').click();
    await page.locator('#web-member-'+i+'-name').fill(names[i]);
    await page.locator('#web-member-'+i+'-enrollment').fill(i?'00005678':'00001234');
  }
}
test('matrícula ausente bloqueia envio e indica integrante e campo',async({page})=>{
  await open(page,true);
  let requests=0;await page.route(ENDPOINT,route=>{requests++;return route.abort();});
  await team(page,['Ana Teste Ficticio']);
  await page.locator('#web-member-0-enrollment').fill('');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('Matrícula obrigatória');
  await expect(page.locator('#web-member-0-enrollment')).toBeFocused();
  await expect(page.locator('#web-member-0-enrollment')).toHaveAttribute('aria-invalid','true');
  expect(requests).toBe(0);
});
test('matrícula duplicada identifica dois integrantes e marca ambos os campos',async({page})=>{
  await open(page,true);
  await team(page);
  await page.locator('#web-member-1-enrollment').fill('00001234');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('integrantes 1');
  await expect(page.locator('#team-feedback')).toContainText('Ana Teste Ficticio');
  await expect(page.locator('#team-feedback')).toContainText('Bruno Teste Ficticio');
  await expect(page.locator('#team-feedback')).toContainText('00001234');
  await expect(page.locator('#web-member-0-enrollment')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#web-member-1-enrollment')).toHaveAttribute('aria-invalid','true');
});
test('conflito remoto detalha nome/matrícula digitados, nunca cadastro de terceiros',async({page})=>{
  await open(page,true);
  let requests=0,posted=null;
  await page.route(ENDPOINT,route=>{
    requests++;
    const params=new URLSearchParams(route.request().postData()||'');
    posted=JSON.parse(params.get('payload'));
    const response={ok:false,channel:'web-entrega-aula05',nonce:params.get('nonce'),
      code:'MATRICULA_NOME_DIVERGENTE',memberIndex:0,field:'enrollment',
      message:'A matrícula informada já está vinculada a um nome diferente.',
      action:'Confira os dois campos e solicite validação do professor.'};
    return route.fulfill({status:200,contentType:'text/html',
      body:'<!doctype html><script>top.postMessage('+JSON.stringify(response)+',"*")</script>'});
  });
  await team(page,['Ana Teste Ficticio']);
  await page.locator('#team-done').click();
  await page.evaluate(()=>{window.print=()=>{};});
  await page.locator('#evidence-open').click();
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('MATRICULA_NOME_DIVERGENTE',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).toContainText('Ana Teste Ficticio');
  await expect(page.locator('#web-delivery-status')).toContainText('00001234');
  await expect(page.locator('#web-delivery-status')).not.toContainText('Nome anterior oculto');
  await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#evidence-dialog')).not.toBeVisible();
  await expect(page.locator('#team-feedback')).toContainText('Nome informado: Ana Teste Ficticio');
  await expect(page.locator('#team-feedback')).toContainText('Matrícula informada: 00001234');
  await expect(page.locator('#web-member-0-enrollment')).toBeFocused();
  await expect(page.locator('#web-member-0-enrollment')).toHaveAttribute('aria-invalid','true');
  expect(requests).toBe(1);
  expect(posted?.identity?.members?.[0]?.enrollment).toBe('00001234');
});
test('modo offline mantém PDF parcial e matrícula não é exigida no botão de identificação',async({page})=>{
  await open(page,false);
  await page.locator('#team-open').click();
  await page.locator('#web-team').fill('Equipe QA FICTICIA');
  await page.locator('#web-member-0-name').fill('Ana Teste Ficticio');
  await expect(page.locator('#web-member-0-enrollment')).toHaveValue('');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  const identity=await page.evaluate(()=>window.WebTeam.getIdentity({requireEnrollment:false}));
  expect(identity.members[0].name).toBe('Ana Teste Ficticio');
  expect(identity.members[0].enrollment).toBe('');
});

test('cache novo impede persistência automática de matrícula pelo lab.js antigo',async({page})=>{
  let legacyRequests=0;
  await page.route('**/lab.js?v=20261023-qa02',route=>{legacyRequests++;return route.abort();});
  await open(page,false);await team(page,['Ana Teste Ficticio']);await page.locator('#team-done').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  expect(download.suggestedFilename()).toContain('Continuar');
  const values=await page.evaluate(()=>Object.values(localStorage));
  expect(values.join('')).not.toContain('00001234');expect(legacyRequests).toBe(0);
});
test('atividade encerrada mostra bloqueio específico, não recibo de sucesso',async({page})=>{
  await open(page,true);
  await page.route(ENDPOINT,route=>{
    const p=new URLSearchParams(route.request().postData()||'');
    const r={ok:false,channel:'web-entrega-aula05',nonce:p.get('nonce'),code:'ATIVIDADE_ENCERRADA',
      message:'A atividade WEB-AULA05-2026 está fechada para envios.',action:'O professor encerrou o recebimento.'};
    return route.fulfill({status:200,contentType:'text/html',body:'<script>top.postMessage('+JSON.stringify(r)+',"*")</script>'});
  });
  await team(page,['Ana Teste Ficticio']);await page.locator('#team-done').click();
  await page.evaluate(()=>{window.print=()=>{};});await page.locator('#evidence-open').click();await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ATIVIDADE ENCERRADA');
  await expect(page.locator('#web-delivery-status')).toContainText('Suas respostas foram preservadas.');
  await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');
});
