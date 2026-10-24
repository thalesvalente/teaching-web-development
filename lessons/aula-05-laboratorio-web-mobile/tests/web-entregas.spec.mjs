/** QA Web: matrícula por integrante em homologação. */
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
const fake='https://script.google.com/macros/s/WEB-QA-MOCK-2026/exec';
async function enabled(page,active=true){
  await page.route('**/entrega-config.js*',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.WebEntregaConfig=Object.freeze({schema:'web-a05-submission-v2',endpoint:'"+fake+
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
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  for(let i=1;i<names.length;i++){
    await page.locator('#web-add-member').click();
    await page.locator('#web-member-'+i+'-name').fill(names[i]);
    await page.locator('#web-member-'+i+'-enrollment').fill(String(1000+i).padStart(8,'0'));
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
    grade,status:'RECEBIDO_PENDENTE_VALIDACAO',
    gradeReceived:snapshot.evidence.xp/10,bestGrades:snapshot.identity.members.map(()=>snapshot.evidence.xp/10)
  };
}
function mockHtml(data){
  return '<!doctype html><meta charset="utf-8"><script>top.postMessage('+
    JSON.stringify(data)+',"*");</scr'+'ipt>';
}
test('formulário da equipe exige matrícula no envio online',async({page})=>{
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
  expect(ident.members.every(m=>/^\d+$/.test(m.enrollment))).toBe(true);
  expect(ident).not.toHaveProperty('classGroup');
  await page.reload();
  await expect(page.locator('#team-count')).toContainText('3 nomes');
  const saved=await page.evaluate(()=>window.WebTeam.snapshot());
  expect(saved.teamId).toBe(ident.teamId);
  expect(saved.members).toHaveLength(3);
  expect(saved.members.every(m=>m.enrollment==='')).toBe(true);
});
test('adicionar e remover membros mantém uma só equipe e não perde o primeiro nome',async({page})=>{
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Cedro');
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Bia Exemplo');
  await page.locator('#web-member-1-enrollment').fill('00001001');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-2-name').fill('Caio Exemplo');
  await page.locator('#web-member-2-enrollment').fill('00001002');
  page.once('dialog',dialog=>dialog.accept());
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
  await expect(page.locator('#web-submit')).toBeEnabled();
  await expect(page.locator('#web-delivery-status')).toContainText('homologação');
  await expect(page.locator('#quick-pdf')).toHaveText('Gerar PDF e Enviar');
  await expect(page.locator('#web-submit')).toHaveText('Gerar PDF e Enviar');
  expect(calls).toBe(0);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  const data=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(data.exercicios).toHaveLength(14);
  expect(data.maximoXp).toBe(100);
});
test('POST ativado rejeita nomes incompletos e duplicados antes de gerar PDF ou enviar',async({page})=>{
  await enabled(page);
  let calls=0;await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
  await page.locator('#web-submit').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#team-feedback')).toContainText('nome da equipe');
  expect(calls).toBe(0);
  expect(await page.evaluate(()=>window.__prints)).toBe(0);
  await page.locator('#web-team').fill('Equipe Ipê');
  await page.locator('#web-member-0-name').fill('Ana');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('nome e sobrenome');
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Ána Exemplo');
  await page.locator('#web-member-1-enrollment').fill('00001001');
  await page.locator('[data-close-dialog="team-dialog"]').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.locator('#web-submit').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#team-feedback')).toContainText('Nome duplicado');
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO REALIZADO');
  expect(calls).toBe(0);
  expect(await page.evaluate(()=>window.__prints)).toBe(0);
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
  await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#web-submit').click()]);
  expect(download.suggestedFilename()).toBe('WEB_Aula05_Evidencia_Equipe.json');
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO CONFIRMADO! NOTA RECEBIDA',{timeout:10000});
  await expect(page.locator('#web-delivery-status')).toBeVisible();
  await expect(page.locator('#web-delivery-status')).toContainText('Recibo: WEB-QA-20261023-aabbccdd');
  expect(await page.evaluate(()=>window.__prints)).toBe(1);
  await expect(page.locator('#web-delivery-status')).toContainText('Ana Exemplo; Bia Exemplo');
  await expect(page.locator('#web-delivery-status')).toContainText('Nota recebida:');
  expect(received.identity).toEqual(await page.evaluate(()=>window.WebTeam.getIdentity()));
  expect(received.identity.members).toHaveLength(2);
  expect(received.identity.members.every(m=>/^\d+$/.test(m.enrollment))).toBe(true);
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


test('painel visual: hierarquia, contagem dinâmica, foco e CTA em desktop e mobile',async({page})=>{
  for(const size of [{width:1440,height:900},{width:390,height:844},{width:320,height:650}]){
    await page.setViewportSize(size);
    await page.goto('/index.html');
    // Cada tamanho de tela é testado com um rascunho novo, sem herdar
    // participantes da resolução testada antes.
    await page.evaluate(()=>localStorage.removeItem('ifma-web-aula05-equipe-v3'));
    await page.reload();
    await page.locator('#team-open').click();
    await expect(page.locator('#team-dialog')).toBeVisible();
    await expect(page.locator('#team-title')).toHaveText('Identificação da equipe');
    await expect(page.locator('#team-members-count')).toHaveText('0/8');
    await expect(page.locator('#team-progress')).toHaveAttribute('aria-valuenow','0');
    await expect(page.locator('#team-done')).toBeVisible();
    const panel=await page.locator('#team-dialog').evaluate(el=>{
      const r=el.getBoundingClientRect(),d=document.documentElement;
      const button=el.querySelector('#team-done').getBoundingClientRect();
      return {width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        buttonBottom:button.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,
        docWidth:d.scrollWidth};
    });
    expect(panel.left).toBeGreaterThanOrEqual(-1);
    expect(panel.right).toBeLessThanOrEqual(size.width+1);
    expect(panel.buttonBottom).toBeLessThanOrEqual(size.height+1);
    expect(panel.docWidth).toBeLessThanOrEqual(size.width+1);
    await page.locator('#web-team').fill('Equipe Horizonte');
    await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-member-0-enrollment').fill('00001000');
    await expect(page.locator('#team-progress')).toHaveAttribute('aria-valuenow','100');
    await expect(page.locator('#team-progress-label')).toContainText('Pronto para concluir');
    await page.locator('#web-add-member').click();
    await expect(page.locator('#team-members-count')).toHaveText('1/8');
    await expect(page.locator('#team-progress')).not.toHaveAttribute('aria-valuenow','100');
    await page.locator('#web-member-1-name').fill('Bia Exemplo');
  await page.locator('#web-member-1-enrollment').fill('00001001');
    await expect(page.locator('#team-progress')).toHaveAttribute('aria-valuenow','100');
    const inputBounds=await page.locator('#web-member-1-name').boundingBox();
    expect(inputBounds?.width).toBeGreaterThanOrEqual(150);
    await page.locator('#team-done').click();
    await expect(page.locator('#team-dialog')).toBeHidden();
    await expect(page.locator('#team-count')).toContainText('2 nomes');
  }
});
test('painel compacto acomoda matrícula e preserva remoção confirmada',async({page})=>{
  await page.setViewportSize({width:375,height:667});
  await page.goto('/index.html');
  await page.locator('#team-open').click();
  await page.locator('#web-team').fill('Equipe Bacuri');
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Bia Exemplo');
  await page.locator('#web-member-1-enrollment').fill('00001001');
  await expect(page.locator('.team-member-number')).toHaveCount(2);
  await expect(page.locator('.team-remove-member')).toHaveCount(2);
  page.once('dialog',d=>d.accept());
  await page.locator('.team-remove-member:not(:disabled)').last().click();
  await expect(page.locator('#team-members-count')).toHaveText('1/8');
  await expect(page.locator('#team-progress')).toHaveAttribute('aria-valuenow','100');
  await expect(page.locator('#web-student-id')).toHaveCount(0);
  await expect(page.locator('#web-class')).toHaveCount(0);
});

test('CTA superior gera PDF parcial mas avisa quando endpoint não permite envio',async({page})=>{
  await enabled(page,false);
  let calls=0;await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await fillTeam(page,['Ana Exemplo','Bia Exemplo']);
  await page.locator('[data-close-dialog="evidence-dialog"]').click();
  await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
  await page.locator('#quick-pdf').click();
  await expect(page.locator('#web-delivery-status')).toBeVisible();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO REALIZADO');
  await expect(page.locator('#print-report')).toContainText('Ana Exemplo; Bia Exemplo');
  expect(await page.evaluate(()=>window.__prints)).toBe(1);
  expect(calls).toBe(0);
});

test('integrante adicional vazio bloqueia exportação+POST e foca o nome ausente',async({page})=>{
  await enabled(page);
  let calls=0;await page.route(fake,route=>{calls++;return route.abort();});
  await enter(page);
  await fillTeam(page,['Ana Exemplo','Bia Exemplo']);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-add-member').click();
  await page.locator('[data-close-dialog="team-dialog"]').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.evaluate(()=>{window.__prints=0;window.print=()=>window.__prints++;});
  await page.locator('#web-submit').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#web-member-2-name')).toBeFocused();
  await expect(page.locator('#team-feedback')).toContainText('nome e sobrenome do integrante 3');
  expect(calls).toBe(0);
  expect(await page.evaluate(()=>window.__prints)).toBe(0);
});

test('sobrenome abreviado não é nome completo; aceita sobrenome composto',async({page})=>{
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Lagoa');
  await page.locator('#web-member-0-name').fill('Ana B');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('nome e sobrenome');
  await page.locator('#web-member-0-name').fill('Ana de Souza');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  expect((await page.evaluate(()=>window.WebTeam.getIdentity())).members[0].name).toBe('Ana de Souza');
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-member-0-name').fill("João D'Ávila");
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#team-done').click();
  expect((await page.evaluate(()=>window.WebTeam.getIdentity())).members[0].name).toBe("João D'Ávila");
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-member-0-name').fill("Ana O'Connor");
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#team-done').click();
  expect((await page.evaluate(()=>window.WebTeam.getIdentity())).members[0].name).toBe("Ana O'Connor");
});

test('cancelar a identificação obrigatória restaura o diálogo de evidências e o foco',async({page})=>{
  await enabled(page);
  await enter(page);
  await page.locator('#web-submit').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#team-dialog')).toBeHidden();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await expect(page.locator('#web-submit')).toBeFocused();
});
test('editar um integrante limpa marcações inválidas antigas de outros membros',async({page})=>{
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Juçara');
  await page.locator('#web-member-0-name').fill('Ana Sousa');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Ána Sousa');
  await page.locator('#web-member-1-enrollment').fill('00001001');
  await page.locator('#team-done').click();
  await expect(page.locator('#web-member-1-name')).toHaveAttribute('aria-invalid','true');
  await page.locator('#web-member-0-name').fill('Lia Marques');
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await expect(page.locator('#web-member-1-name')).not.toHaveAttribute('aria-invalid','true');
  await page.locator('#team-done').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
});
test('botão do formulário gera PDF mesmo offline, mas não envia registros',async({page})=>{
  await enabled(page,false);
  let posts=0;await page.route(fake,route=>{posts++;return route.abort();});
  await enter(page);
  await fillTeam(page,['Ana Exemplo']);
  await page.evaluate(()=>{window.__printedCount=0;window.print=()=>window.__printedCount++;});
  await page.locator('#web-submit').click();
  await expect(page.locator('#web-delivery-status')).toContainText('ENVIO NÃO REALIZADO');
  expect(await page.evaluate(()=>window.__printedCount)).toBe(1);
  expect(posts).toBe(0);
});


test('duplicidade com apostrofos tipograficos distintos bloqueia a equipe',async({page})=>{
  await enter(page);
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Cedro');
  await page.locator('#web-member-0-name').fill("Ana O'Connor");
  await page.locator('#web-member-0-enrollment').fill('00001000');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill("Ana O’Connor");
  await page.locator('#web-member-1-enrollment').fill('00001001');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('Nome duplicado');
  await expect(page.locator('#web-member-1-name')).toHaveAttribute('aria-invalid','true');
});


test('ativos de validação possuem versão para evitar cache anterior no GitHub Pages',async({page})=>{
  await page.goto('/index.html');
  for(const name of ['equipe.js','report-print.js','entrega-appscript.js']) {
    await expect(page.locator('script[src="./'+name+'?v=web-prod-310"]')).toHaveCount(1);
  }
  await expect(page.locator('script[src="./lab.js?v=web-prod-310"]')).toHaveCount(1);
  await expect(page.locator('link[href="./style.css?v=web-prod-310"]')).toHaveCount(1);
});


test('origem real do iframe HtmlService é permitida sem abrir wildcard de googleusercontent',async({page})=>{
  await page.goto('/index.html');
  const verdict=await page.evaluate(()=>{
    const permit=window.WebEntrega?.origemReciboPermitida;
    return ['https://script.google.com',
      'https://script.googleusercontent.com',
      'https://n-opgh3dctzfsahigmepgnbilm6pnxp4akr5ejfpy-0lu-script.googleusercontent.com',
      'https://evil.googleusercontent.com','https://fake-script.googleusercontent.com.evil.org',
      'https://example.org','null'].map(origin=>permit(origin));
  });
  expect(verdict).toEqual([true,true,true,false,false,false,false]);
});
