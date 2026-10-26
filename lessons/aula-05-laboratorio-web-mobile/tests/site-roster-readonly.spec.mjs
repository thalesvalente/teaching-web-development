import {test,expect} from '@playwright/test';

const endpoint='https://script.google.com/macros/s/QA320_UI_FIXTURE_ONLY/exec';
const enrollment='20999999.ITA9001';

async function openWithMockedQa(page){
  await page.route('**/entrega-config.js*',route=>route.fulfill({
    status:200,contentType:'application/javascript; charset=utf-8',
    body:'window.WebEntregaConfig=Object.freeze('+JSON.stringify({
      schema:'web-a05-submission-v3',endpoint,activated:true,qaMode:true,
      activity:'WEB-AULA05-2026',requiredMode:'PROD',requiredVersion:'web-notas-3.2.0'
    })+');'
  }));
  const operations=[];
  await page.route(endpoint+'**',async route=>{
    const request=route.request();
    const params=new URLSearchParams(request.method()==='GET'?new URL(request.url()).search:(request.postData()||''));
    const payload=params.get('payload')?JSON.parse(params.get('payload')):null;
    const nonce=params.get('nonce');
    const response=request.method()==='GET'
      ?{ok:true,channel:'web-status-aula05',nonce,version:'web-notas-3.2.0',
        mode:'PROD',enabled:true,activity:'WEB-AULA05-2026'}
      :payload?.operation==='lookupStudent'&&payload.enrollment===enrollment
        ?{ok:true,channel:'web-roster-lookup-aula05',nonce,version:'web-notas-3.2.0',
          enrollmentCanonical:enrollment,name:'Estudante Teste Alfa',
          confirmationToken:(Date.now()+15*60*1000)+'.'+'a'.repeat(64)}
        :{ok:false,channel:'web-roster-lookup-aula05',nonce,
          code:'MATRICULA_NAO_DISPONIVEL',message:'Matrícula não encontrada ou indisponível.'};
    operations.push(payload?.operation||'health');
    await route.fulfill({
      status:200,contentType:'text/html; charset=utf-8',
      body:'<!doctype html><meta charset="utf-8"><script>top.postMessage('+
        JSON.stringify(response).replace(/</g,'\\u003c')+',"*");</script>'
    });
  });
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await page.locator('#team-open').click();
  return operations;
}

test('SITE-V3-01: formulário padrão do laboratório não aceita nome digitado nem envia para produção',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await expect(page.locator('#team-open')).toBeVisible();
  await page.locator('#team-open').click();
  await expect(page.locator('#web-members input[type="text"]')).toHaveCount(1);
  const inputs=await page.locator('#team-dialog input:visible').evaluateAll(xs=>xs.map(x=>x.id));
  expect(inputs).toEqual(['web-team','web-member-0-enrollment']);
  await expect(page.locator('#web-member-0-name')).toHaveText('Nome não consultado');
  const cfg=await page.evaluate(()=>window.WebEntregaConfig);
  expect(cfg.schema).toBe('web-a05-submission-v3');
  expect(cfg.activated).toBe(false);
  expect(cfg.endpoint).toBe('');
});

test('SITE-V3-02: no próprio formulário QA a matrícula consulta o nome e exige confirmação, sem entrada editável de nome',async({page})=>{
  const ops=await openWithMockedQa(page);
  await expect(page.locator('#qa-lab-notice')).toContainText('somente matrículas fictícias');
  await page.locator('#web-team').fill('Equipe Fictícia QA');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await expect(page.locator('#web-member-0-confirm')).toBeVisible();
  await expect(page.locator('#web-member-0-confirm')).not.toBeChecked();
  await expect(page.locator('#web-members input[id$="-name"]')).toHaveCount(0);
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await page.locator('#web-member-0-confirm').check();
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  expect(ops).toContain('health');
  expect(ops).toContain('lookupStudent');
  expect(ops).not.toContain('submitTeam');
});

test('SITE-V3-03: matrícula não cadastrada bloqueia confirmação, sem inserir integrante automaticamente',async({page})=>{
  const ops=await openWithMockedQa(page);
  await page.locator('#web-team').fill('Equipe Fictícia QA');
  await page.locator('#web-member-0-enrollment').fill('20999999.ITA9999');
  await page.locator('#web-member-0-lookup').click();
  await expect(page.locator('#web-member-0-enrollment-error')).toContainText('não encontrada');
  await expect(page.locator('#web-member-0-confirm')).toHaveCount(0);
  await expect(page.locator('#web-member-0-name')).toHaveText('Nome não consultado');
  expect(ops).not.toContain('submitTeam');
});
