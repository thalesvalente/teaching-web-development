/** E2E: recebimento Web emulado sem tocar no Apps Script/Sheets reais. */
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
const fake='https://script.google.com/macros/s/WEB-QA-MOCK-2026/exec';
async function enabled(page){
  await page.route('**/entrega-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WebEntregaConfig=Object.freeze({endpoint:'"+fake+"',activity:'WEB-AULA05-2026',activated:true});"
  }));
}
async function enter(page){
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await page.locator('#evidence-open').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
}
test('com Apps Script cadastrado mas não ativado o botão fica desabilitado, JSON e PDF independentes',async({page})=>{
  await enter(page);
  await expect(page.locator('#web-submit')).toBeDisabled();
  await expect(page.locator('#web-delivery-status')).toContainText('homologação');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  const file=await readFile(await download.path(),'utf8');
  const data=JSON.parse(file);
  expect(data.schema).toBe('ifma-web-aula05-lab-v4');
  expect(data.exercicios).toHaveLength(14);
  expect(data.maximoXp).toBe(100);
  expect(data.tipo).toBe('formativo-nao-e-nota');
});
test('nome ou matrícula inválidos impedem o POST configurado de teste',async({page})=>{
  await enabled(page);
  let posts=0;
  await page.route(fake,route=>{posts++;return route.abort();});
  await enter(page);
  await expect(page.locator('#web-submit')).toBeEnabled();
  await page.locator('#web-student-name').fill('Ana');
  await page.locator('#web-student-id').fill('2');
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO CONFIRMADO');
  expect(posts).toBe(0);
});
test('recibo legítimo emulado: download JSON + confirmação apenas pendente de revisão',async({page})=>{
  await enabled(page);
  let received=null;
  await page.route(fake,route=>{
    const params=new URLSearchParams(route.request().postData()||'');
    const snapshot=JSON.parse(params.get('payload'));
    received=snapshot;
    const nonce=params.get('nonce');
    const codeHash=crypto.createHash('sha256')
      .update(snapshot.evidence.codigoFonteCompleto,'utf8').digest('hex');
    const mock={
      ok:true,channel:'web-entrega-aula05',nonce,
      receiptId:'WEB-QA-20261022-aaaaaaaa',
      activity:'WEB-AULA05-2026',instrument:'laboratorio-vivo-tsx',
      receivedAt:'2026-10-22T14:00:00.000Z',
      answersSha256:'a'.repeat(64),codeSha256:codeHash,
      signature:'b'.repeat(64),xpReported:snapshot.evidence.xp,
      grade:null,status:'RECEBIDO_PENDENTE_VALIDACAO'
    };
    return route.fulfill({status:200,contentType:'text/html',
      body:'<!doctype html><meta charset="utf-8"><script>top.postMessage('+
      JSON.stringify(mock)+',"*");</scr'+'ipt>'});
  });
  await enter(page);
  await page.locator('#web-student-name').fill('Ana Exemplo');
  await page.locator('#web-student-id').fill('20260001');
  await page.locator('#web-team').fill('Web');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#web-submit').click()]);
  expect(download.suggestedFilename()).toBe('WEB_Aula05_Evidencia_Individual.json');
  await expect(page.locator('#web-delivery-status')).toContainText('EVIDÊNCIA RECEBIDA',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).toContainText('AGUARDANDO CONFERÊNCIA DOCENTE');
  await expect(page.locator('#web-delivery-status')).toContainText('não são nota');
  expect(received?.activity).toBe('WEB-AULA05-2026');
  expect(received?.identity?.enrollment).toBe('20260001');
  const saved=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(saved.evidence.codigoFonteCompleto).toBe(received.evidence.codigoFonteCompleto);
});
test('recibo emulado que inventa nota oficial é rejeitado',async({page})=>{
  await enabled(page);
  await page.route(fake,route=>{
    const params=new URLSearchParams(route.request().postData()||'');
    const x=JSON.parse(params.get('payload'));
    const bad={
      ok:true,channel:'web-entrega-aula05',nonce:params.get('nonce'),
      receiptId:'WEB-QA-20261022-bbbbbbbb',
      activity:'WEB-AULA05-2026',instrument:'laboratorio-vivo-tsx',
      codeSha256:crypto.createHash('sha256').update(x.evidence.codigoFonteCompleto).digest('hex'),
      answersSha256:'a'.repeat(64),signature:'b'.repeat(64),
      xpReported:x.evidence.xp,grade:10,status:'RECEBIDO_PENDENTE_VALIDACAO',
      receivedAt:'2026-10-22T14:00:00.000Z'
    };
    return route.fulfill({status:200,contentType:'text/html',
      body:'<script>top.postMessage('+JSON.stringify(bad)+',"*");</scr'+'ipt>'});
  });
  await enter(page);
  await page.locator('#web-student-name').fill('Ana Exemplo');
  await page.locator('#web-student-id').fill('20260001');
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO CONFIRMADO',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).not.toContainText('EVIDÊNCIA RECEBIDA');
});

test('endpoint /exec preenchido mas não homologado mantém botão bloqueado',async({page})=>{
  await page.route('**/entrega-config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WebEntregaConfig=Object.freeze({endpoint:'"+
      fake+"',activity:'WEB-AULA05-2026',activated:false});"
  }));
  let calls=0;
  await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await expect(page.locator('#web-submit')).toBeDisabled();
  await expect(page.locator('#web-delivery-status')).toContainText('homologação');
  expect(calls).toBe(0);
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export-json').click()
  ]);
  const data=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(data.maximoXp).toBe(100);
  expect(data.exercicios).toHaveLength(14);
});
