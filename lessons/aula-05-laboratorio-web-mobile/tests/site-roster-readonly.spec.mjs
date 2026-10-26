import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const endpoint='https://script.google.com/macros/s/QA320_UI_FIXTURE_ONLY/exec';
const enrollment='20999999.ITA9001';

async function openWithMockedQa(page,{stable=false}={}){
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
          confirmationToken:stable?'v2.'+'a'.repeat(64):(Date.now()+15*60*1000)+'.'+'a'.repeat(64)}
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


test('SITE-V3-04: própria ficha configura QA e consulta a matrícula digitada após erro offline, sem recriar interface',async({page})=>{
  // Use exactly the same configuration script, with official-origin guard and fingerprint
  // replaced only in this local-browser fixture. Never contact a real Google endpoint.
  const {readFile}=await import('node:fs/promises');
  const {createHash}=await import('node:crypto');
  const fixtureUrl='https://script.google.com/macros/s/ROSTER_320_UI_LOCAL_FIXTURE/exec';
  const fingerprint=createHash('sha256').update(fixtureUrl,'utf8').digest('hex');
  const source=await readFile(new URL('../entrega-config.js',import.meta.url),'utf8');
  const fixture=source
    .replace("window.location.origin==='https://thalesvalente.github.io'","window.location.origin===window.location.origin")
    .replace(/QA_SHA256='[0-9a-f]{64}'/,"QA_SHA256='"+fingerprint+"'");
  await page.route('**/entrega-config.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:fixture}));
  const requests=[];
  await page.route(fixtureUrl+'**',async route=>{
    const req=route.request(),form=new URLSearchParams(req.method()==='GET'?new URL(req.url()).search:req.postData()||'');
    const n=form.get('nonce'),payload=form.get('payload')?JSON.parse(form.get('payload')):null;
    requests.push(payload?.operation||'health');
    const d=payload?.operation==='lookupStudent'
      ?{ok:true,channel:'web-roster-lookup-aula05',nonce:n,version:'web-notas-3.2.0',
        name:'Estudante Teste Alfa',enrollmentCanonical:enrollment,
        confirmationToken:String(Date.now()+15*60*1000)+'.'+'a'.repeat(64)}
      :{ok:true,channel:'web-status-aula05',nonce:n,version:'web-notas-3.2.0',
        mode:'PROD',enabled:true,activity:'WEB-AULA05-2026'};
    await route.fulfill({status:200,contentType:'text/html; charset=utf-8',
      body:'<!doctype html><meta charset="utf-8"><script>top.postMessage('+
        JSON.stringify(d)+',"*");</script>'});
  });
  await page.goto('/index.html?qa=1');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await page.locator('#team-open').click();
  await expect(page.locator('#qa-endpoint-section')).toBeVisible();
  await page.locator('#web-team').fill('Equipe Sintética QA');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await expect(page.locator('#web-member-0-enrollment-error')).toContainText('offline');
  await page.locator('#qa-appscript-url').fill('https://script.google.com/macros/s/UNAPPROVED_FIXTURE/exec');
  await page.locator('#qa-endpoint-activate').click();
  await expect(page.locator('#qa-endpoint-status')).toContainText('URL recusada');
  await expect.poll(()=>page.evaluate(()=>window.WebEntregaConfig.activated)).toBe(false);
  await page.locator('#qa-appscript-url').fill(fixtureUrl);
  await page.locator('#qa-endpoint-activate').click();
  await expect(page.locator('#qa-endpoint-status')).toContainText('QA conectada');
  await expect(page.locator('#qa-lab-notice')).toContainText('somente matrículas fictícias');
  await expect(page.locator('#qa-appscript-url')).toHaveValue('');
  await expect(page.locator('#web-member-0-enrollment')).toHaveValue(enrollment);
  expect(await page.evaluate(()=>window.WebEntregaConfig.qaMode)).toBe(true);
  expect(await page.evaluate(()=>window.WebTeam.onlineEnabled)).toBe(true);
  expect(await page.evaluate(()=>window.WebEntrega.ativado)).toBe(true);
  await page.locator('#web-member-0-lookup').click();
  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await expect(page.locator('#web-member-0-confirm')).toBeVisible();
  await page.locator('#web-member-0-confirm').check();
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  expect(requests).toContain('health');
  expect(requests).toContain('lookupStudent');
  expect(requests).not.toContain('submitTeam');
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('ROSTER_320_UI_LOCAL_FIXTURE');
});

test('SITE-V3-05: nome confirmado não expira durante a sessão se o cadastro não mudar',async({page})=>{
  const ops=await openWithMockedQa(page,{stable:true});
  await page.locator('#web-team').fill('Equipe Sintética QA');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await page.locator('#web-member-0-confirm').check();
  await page.evaluate(()=>{window.__originalTime=Date.now;Date.now=()=>window.__originalTime()+48*60*60*1000;});
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  await page.locator('#team-open').click();
  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await expect(page.locator('#web-member-0-confirm')).toBeChecked();
  expect(ops.filter(x=>x==='lookupStudent')).toHaveLength(1);
  await page.evaluate(()=>{Date.now=window.__originalTime;delete window.__originalTime;});
});
test('SITE-V3-06: JSON da equipe pode ser baixado duas vezes sem enviar dados nem tokens',async({page})=>{
  const ops=await openWithMockedQa(page,{stable:true});
  await page.locator('#web-team').fill('Equipe Sintética QA');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await page.locator('#web-member-0-confirm').check();
  await page.locator('#team-done').click();
  await page.locator('#evidence-open').click();
  for(let attempt=0;attempt<2;attempt++){
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-team-json').click()]);
    expect(download.suggestedFilename()).toBe('WEB_Aula05_Evidencia_Equipe.json');
    const json=JSON.parse(await readFile(await download.path(),'utf8'));
    expect(json.identity.members[0]).toEqual({enrollment,name:'Estudante Teste Alfa'});
    expect(json.evidence.schema).toBe('ifma-web-aula05-lab-v4');
    expect(JSON.stringify(json)).not.toContain('confirmationToken');
  }
  expect(ops.filter(x=>x==='lookupStudent')).toHaveLength(1);
  expect(ops).not.toContain('submitTeam');
});
test('SITE-V3-07: clique em Gerar PDF e Enviar dispara backup JSON antes de HTTPS assíncrono',async({page})=>{
  await openWithMockedQa(page,{stable:true});
  await page.locator('#web-team').fill('Equipe Sintética QA');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await page.locator('#web-member-0-confirm').check();
  await page.locator('#team-done').click();
  await page.locator('#evidence-open').click();
  await page.evaluate(()=>{window.print=()=>{};});
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#web-submit').click()]);
  expect(download.suggestedFilename()).toBe('WEB_Aula05_Evidencia_Equipe.json');
  const json=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(json.identity.members[0].enrollment).toBe(enrollment);
});


test('SITE-V3-08: a única ação alterna consulta e nova consulta, sem botões redundantes',async({page})=>{
  const calls=await openWithMockedQa(page,{stable:true});
  const button=page.locator('#web-member-0-lookup');
  await expect(button).toHaveText('Consultar matrícula');
  await expect(button).toHaveAttribute('data-mode','lookup');
  await expect(page.locator('#web-members .roster-reset, #web-members .roster-dispute')).toHaveCount(0);
  await expect(page.locator('#web-members button:not(.team-remove-member)')).toHaveCount(1);
  await page.locator('#web-team').fill('Equipe QA Consulta Única');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await button.click();

  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await expect(button).toHaveText('Nova consulta');
  await expect(button).toHaveAttribute('data-mode','renew');
  const advice=page.locator('#web-member-0-name-advice');
  await expect(advice).toHaveText(/Nome incorreto\? Não confirme\. Procure o professor/);
  expect(await advice.evaluate(element=>element.tagName)).toBe('P');
  await expect(page.locator('#web-members button:not(.team-remove-member)')).toHaveCount(1);
  await expect(page.locator('#web-member-0-confirm')).toHaveAttribute(
    'aria-describedby','web-member-0-name-advice web-member-0-confirm-hint');
  await page.locator('#web-member-0-confirm').check();

  await button.click();
  await expect(page.locator('#web-member-0-enrollment')).toHaveValue(enrollment);
  await expect(page.locator('#web-member-0-enrollment')).toBeFocused();
  expect(await page.locator('#web-member-0-enrollment').evaluate(element=>element.readOnly)).toBe(false);
  await expect(button).toHaveText('Consultar matrícula');
  await expect(page.locator('#web-member-0-name')).toHaveText('Nome não consultado');
  await expect(page.locator('#web-member-0-confirm')).toHaveCount(0);
  await expect(advice).toHaveCount(0);
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#team-feedback')).toContainText('Consulte a matrícula');

  await button.click();
  await expect(page.locator('#web-member-0-name')).toHaveText('Estudante Teste Alfa');
  await expect(page.locator('#web-member-0-confirm')).not.toBeChecked();
  expect(calls.filter(operation=>operation==='lookupStudent')).toHaveLength(2);
  expect(calls).not.toContain('submitTeam');
});

test('SITE-V3-09: consulta primária e nova consulta respeitam tema, toque e foco no celular',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await openWithMockedQa(page,{stable:true});
  const button=page.locator('#web-member-0-lookup');
  await expect(button).toHaveCSS('background-color','rgb(8, 116, 67)');
  await expect(button).toHaveCSS('color','rgb(255, 255, 255)');
  const primary=await button.evaluate(el=>{
    const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();
    return {height:a.height,width:a.width,maxWidth:b.width};
  });
  expect(primary.height).toBeGreaterThanOrEqual(44);
  expect(primary.width).toBeLessThanOrEqual(primary.maxWidth+1);
  await page.locator('#web-member-0-enrollment').focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  const outline=await button.evaluate(el=>getComputedStyle(el).outlineWidth);
  expect(parseFloat(outline)).toBeGreaterThanOrEqual(3);

  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await button.click();
  await expect(button).toHaveText('Nova consulta');
  await expect(button).toHaveCSS('background-color','rgb(233, 245, 237)');
  await expect(button).toHaveCSS('color','rgb(10, 93, 56)');
  const advice=page.locator('#web-member-0-name-advice');
  await expect(advice).toBeVisible();
  const secondary=await button.boundingBox();
  expect(secondary.height).toBeGreaterThanOrEqual(44);
  // Codex P2: pressionar Espaço sem hover não pode gerar texto verde sobre verde escuro.
  await page.mouse.move(1,1);
  await button.focus();
  await page.keyboard.down('Space');
  await expect(button).toHaveCSS('background-color','rgb(198, 229, 208)');
  await expect(button).toHaveCSS('color','rgb(10, 93, 56)');
  await page.keyboard.up('Space');
  // Ao soltar Espaço, o botão efetivamente inicia Nova consulta e limpa a identidade.
  await expect(button).toHaveText('Consultar matrícula');
  await expect(advice).toHaveCount(0);
  await expect(page.locator('#web-member-0-name')).toHaveText('Nome não consultado');
  await expect(page.locator('#web-member-0-enrollment')).toBeFocused();
});

test('SITE-V3-10: conflito remoto limpa nome e comprovante sem permitir correção cadastral local',async({page})=>{
  await openWithMockedQa(page,{stable:true});
  await page.locator('#web-team').fill('Equipe QA Conflito');
  await page.locator('#web-member-0-enrollment').fill(enrollment);
  await page.locator('#web-member-0-lookup').click();
  await page.locator('#web-member-0-confirm').check();
  await page.evaluate(()=>window.WebTeam.showRemoteConflict({
    memberIndex:0,field:'enrollment',
    message:'Cadastro atualizado pelo professor. Consulte a matrícula novamente.'
  }));
  await expect(page.locator('#web-member-0-name')).toHaveText('Nome não consultado');
  await expect(page.locator('#web-member-0-confirm')).toHaveCount(0);
  await expect(page.locator('#web-member-0-name-advice')).toHaveCount(0);
  await expect(page.locator('#web-member-0-lookup')).toHaveText('Consultar matrícula');
  await expect(page.locator('#web-member-0-lookup')).toBeEnabled();
  await expect(page.locator('#web-member-0-enrollment')).toHaveValue(enrollment);
  await expect(page.locator('#web-member-0-enrollment-error')).toContainText('Cadastro atualizado');
});
