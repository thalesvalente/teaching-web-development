/** QA Web: trabalho em equipe, sem exigir matrícula ou turma. */
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
const fake='https://script.google.com/macros/s/WEB-QA-MOCK-2026/exec';
async function enabled(page,active=true){
  await page.route('**/entrega-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WebEntregaConfig=Object.freeze({endpoint:'"+fake+
      "',activity:'WEB-AULA05-2026',activated:"+active+"});"
  }));
}
async function enter(page){
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await page.locator('#evidence-open').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
}
async function fillTeam(page,names=['Ana Exemplo','Bia Exemplo']){
  await page.locator('#team-open-evidence').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await page.locator('#web-team').fill('Equipe Ipê');
  await page.locator('#web-member-0-name').fill(names[0]);
  for(let i=1;i<names.length;i++){
    await page.locator('#web-add-member').click();
    await page.locator('#web-member-'+i+'-name').fill(names[i]);
  }
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
}
function hash(text){return crypto.createHash('sha256').update(text,'utf8').digest('hex');}
function mockReceipt(snapshot,nonce,grade=null){
  return {
    ok:true,channel:'web-entrega-aula05',nonce,
    activity:'WEB-AULA05-2026',instrument:'laboratorio-vivo-tsx-equipe',
    teamId:snapshot.identity.teamId,memberCount:snapshot.identity.members.length,
    receiptId:'WEB-QA-20261023-aabbccdd',
    receivedAt:'2026-10-23T14:00:00.000Z',answersSha256:'a'.repeat(64),
    codeSha256:hash(snapshot.evidence.codigoFonteCompleto),
    signature:'b'.repeat(64),xpReported:snapshot.evidence.xp,
    grade,status:'RECEBIDO_PENDENTE_VALIDACAO'
  };
}
function mockHtml(data){
  return '<!doctype html><meta charset="utf-8"><script>top.postMessage('+
    JSON.stringify(data)+',"*");</scr'+'ipt>';
}
test('formulário de equipe pede somente nome da equipe e nomes completos',async({page})=>{
  await enter(page);
  await expect(page.locator('#web-student-id')).toHaveCount(0);
  await expect(page.locator('#web-class')).toHaveCount(0);
  await fillTeam(page,['Ana Exemplo','Bia Exemplo','Caio Exemplo']);
  await expect(page.locator('#web-team-summary')).toContainText('Equipe Ipê');
  await expect(page.locator('#web-team-summary')).toContainText('Ana Exemplo; Bia Exemplo; Caio Exemplo');
  const ident=await page.evaluate(()=>window.WebTeam.getIdentity());
  expect(ident.team).toBe('Equipe Ipê');
  expect(ident.members.map(m=>m.name)).toEqual(['Ana Exemplo','Bia Exemplo','Caio Exemplo']);
  expect(ident.teamId).toMatch(/^[\da-f]{8}-/);
  expect(ident).not.toHaveProperty('enrollment');
  expect(ident).not.toHaveProperty('classGroup');
  await page.reload();
  await expect(page.locator('#team-count')).toContainText('3 nomes');
  const saved=await page.evaluate(()=>window.WebTeam.snapshot());
  expect(saved.teamId).toBe(ident.teamId);
  expect(saved.members).toHaveLength(3);
});
test('adicionar e remover membros mantém uma só equipe e não perde o primeiro nome',async({page})=>{
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Cedro');
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Bia Exemplo');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-2-name').fill('Caio Exemplo');
  await page.locator('[data-remove="1"]').click();
  await expect(page.locator('#web-member-1-name')).toHaveValue('Caio Exemplo');
  const value=await page.evaluate(()=>window.WebTeam.snapshot());
  expect(value.members.map(m=>m.name)).toEqual(['Ana Exemplo','Caio Exemplo']);
  await page.locator('#team-done').click();
  await expect(page.locator('#web-team-summary')).toContainText('Ana Exemplo; Caio Exemplo');
});
test('JSON de continuidade preserva equipe, nomes e XP em outro navegador',async({browser})=>{
  const one=await browser.newContext({acceptDownloads:true});
  const p=await one.newPage();
  await enter(p);
  await fillTeam(p,['Ana Exemplo','Bia Exemplo']);
  await p.locator('[data-close-dialog="evidence-dialog"]').click();
  await p.locator('#mission-select').selectOption('run');
  await p.locator('#guide-check').click();
  await expect(p.locator('#xp-top')).toHaveText('5');
  const firstIdentity=await p.evaluate(()=>window.WebTeam.getIdentity());
  const [download]=await Promise.all([p.waitForEvent('download'),p.locator('#save-progress').click()]);
  const raw=await readFile(await download.path(),'utf8');
  const save=JSON.parse(raw);
  expect(save.team).toEqual(firstIdentity);
  expect(save.xp).toBe(5);
  const two=await browser.newContext({acceptDownloads:true});
  const next=await two.newPage();
  await next.goto('/index.html');
  await expect(next.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  next.once('dialog',d=>d.accept());
  await next.locator('#progress-file').setInputFiles({
    name:'equipe.json',mimeType:'application/json',buffer:Buffer.from(raw)
  });
  await expect(next.locator('#xp-top')).toHaveText('5');
  const restored=await next.evaluate(()=>window.WebTeam.getIdentity());
  expect(restored).toEqual(firstIdentity);
  await next.locator('#team-open').click();
  await expect(next.locator('#web-member-1-name')).toHaveValue('Bia Exemplo');
  await one.close();await two.close();
});
test('endpoint cadastrado mas não homologado bloqueia POST e preserva exportações',async({page})=>{
  await enabled(page,false);
  let calls=0;
  await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await expect(page.locator('#web-submit')).toBeDisabled();
  await expect(page.locator('#web-delivery-status')).toContainText('homologação');
  expect(calls).toBe(0);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  const data=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(data.exercicios).toHaveLength(14);
  expect(data.maximoXp).toBe(100);
});
test('POST ativado rejeita nomes incompletos e duplicados antes de enviar',async({page})=>{
  await enabled(page);
  let calls=0;await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Ipê');
  await page.locator('#web-member-0-name').fill('Ana');
  await page.locator('[data-close-dialog="team-dialog"]').click();
  await page.locator('#evidence-open').click();
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO CONFIRMADO');
  expect(calls).toBe(0);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Ána Exemplo');
  await page.locator('[data-close-dialog="team-dialog"]').click();
  await page.locator('#evidence-open').click();
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('Integrante repetido');
  expect(calls).toBe(0);
});
test('recibo coletivo emulado: JSON da equipe e estado pendente, nunca nota oficial',async({page})=>{
  await enabled(page);
  let received=null;
  await page.route(fake,route=>{
    const params=new URLSearchParams(route.request().postData()||'');
    received=JSON.parse(params.get('payload'));
    return route.fulfill({status:200,contentType:'text/html',
      body:mockHtml(mockReceipt(received,params.get('nonce')))});
  });
  await enter(page);
  await fillTeam(page,['Ana Exemplo','Bia Exemplo']);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#web-submit').click()]);
  expect(download.suggestedFilename()).toBe('WEB_Aula05_Evidencia_Equipe.json');
  await expect(page.locator('#web-delivery-status')).toContainText('EVIDÊNCIA RECEBIDA',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).toContainText('Ana Exemplo; Bia Exemplo');
  await expect(page.locator('#web-delivery-status')).toContainText('não são nota');
  expect(received.identity).toEqual(await page.evaluate(()=>window.WebTeam.getIdentity()));
  expect(received.identity.members).toHaveLength(2);
  expect(received.identity).not.toHaveProperty('enrollment');
  const saved=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(saved.identity).toEqual(received.identity);
  expect(saved.evidence.codigoFonteCompleto).toBe(received.evidence.codigoFonteCompleto);
});
test('recibo que inventa nota oficial é recusado mesmo para equipe válida',async({page})=>{
  await enabled(page);
  await page.route(fake,route=>{
    const params=new URLSearchParams(route.request().postData()||'');
    const data=JSON.parse(params.get('payload'));
    return route.fulfill({status:200,contentType:'text/html',
      body:mockHtml(mockReceipt(data,params.get('nonce'),10))});
  });
  await enter(page);await fillTeam(page,['Ana Exemplo','Bia Exemplo']);
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO CONFIRMADO',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).not.toContainText('EVIDÊNCIA RECEBIDA');
});
