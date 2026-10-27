/** QA do laboratório v3: a missão, a execução e o resultado estão juntos. */
import { test, expect } from '@playwright/test';

// Historical v2 identity fixture. Roster 3.2 runs separately in roster-320.spec.mjs.
test.beforeEach(async({page})=>{await page.route('**/entrega-config.js*',route=>route.fulfill({contentType:'application/javascript',body:"window.WebEntregaConfig=Object.freeze({endpoint:'',activated:false,schema:'web-a05-submission-v2',activity:'WEB-AULA05-2026'});"}));});
import { readFile } from 'node:fs/promises';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const frameFor = page => page.frameLocator('#preview');
async function open(page) {
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado', { timeout: 30000 });
  const frame=frameFor(page);
  // Em telas estreitas, a aba Código inicia aberta e o iframe fica oculto;
  // React continua montado. Visibilidade só deve ser exigida quando a aba
  // Resultado estiver selecionada, não durante o carregamento inicial.
  await expect(frame.locator('#web-root [data-testid="app-universal"]')).toHaveCount(1);
  await expect(frame.locator('#mobile-root [data-testid="app-universal"]')).toHaveCount(1);
  return frame;
}
async function mission(page,id) {
  await page.locator('#mission-select').selectOption(id);
  return page.locator('#missao-atual');
}
async function runSource(page,source) {
  await page.locator('#code').fill(source);
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:20000});
}
async function checkCode(page,id) {
  await mission(page,id);
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Aprovado',{timeout:20000});
}
async function answer(page,id,first='a',second='b') {
  await mission(page,id);
  await page.locator(`#quiz-bank input[name="${id}-q1"][value="${first}"]`).check();
  await page.locator(`#quiz-bank input[name="${id}-q2"][value="${second}"]`).check();
  await page.locator('#guide-check').click();
}

test('uma missão por vez: não há cartões distantes e selecionar muda só o enunciado',async({page})=>{
  await open(page);
  await expect(page.locator('#mission-select option')).toHaveCount(14);
  await expect(page.locator('#guide-title')).toContainText('Primeiro contato');
  await expect(page.locator('.challenge-card')).toHaveCount(0);
  await mission(page,'limit');
  await expect(page.locator('#guide-title')).toHaveText('Valide o limite mínimo');
  await expect(page.locator('#guide-number')).toContainText('CICLO 2');
  await expect(page.locator('#guide-do')).toContainText('MINIMO_CARACTERES');
  await expect(page.locator('#guide-observe')).toContainText('Seis');
  const offset=await page.evaluate(()=>document.scrollingElement.scrollTop);
  expect(offset).toBe(0);
});

test('localizar código seleciona linha no editor sem scroll de página',async({page})=>{
  await open(page);
  await mission(page,'limit');
  await page.locator('#guide-locate').click();
  const selected=await page.locator('#code').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));
  expect(selected).toBe('export const MINIMO_CARACTERES');
  await expect(page.locator('#guide-line')).toContainText('destacada');
  expect(await page.evaluate(()=>document.scrollingElement.scrollTop)).toBe(0);
  await page.locator('#guide-next').click();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
});

test('código integral, Vue e rota Expo ficam disponíveis na mesma bancada',async({page})=>{
  await open(page);
  const source=await page.locator('#code').inputValue();
  expect(source).toContain('// [01] IMPORTAÇÕES');
  expect(source).toContain('// [07] ESTILOS');
  await page.locator('#tab-vue').click();
  await expect(page.locator('#readonly-code')).toContainText('v-model');
  await expect(page.locator('#code')).toBeHidden();
  await page.locator('#tab-route').click();
  await expect(page.locator('#readonly-code')).toContainText('ProjetoUniversal');
  await page.locator('#guide-locate').click();
  await expect(page.locator('#code')).toBeVisible();
});

test('as duas renderizações reagem a digitação e preservam estados independentes',async({page})=>{
  const frame=await open(page);
  const web=frame.locator('#web-root'), mobile=frame.locator('#mobile-root');
  await web.locator('[data-testid="campo-titulo"]').fill('abc');
  await web.locator('[data-testid="botao-registrar"]').click();
  await expect(web.locator('[data-testid="erro-titulo"]')).toBeVisible();
  await expect(web.locator('[data-testid="contador"]')).toHaveText('0');
  await web.locator('[data-testid="campo-titulo"]').fill('  Memória  fictícia  ');
  await expect(web.locator('[data-testid="erro-titulo"]')).toHaveCount(0);
  await web.locator('[data-testid="botao-registrar"]').click();
  await expect(web.locator('[data-testid="contador"]')).toHaveText('1');
  await expect(web.locator('[data-testid="ultima-memoria"]')).toHaveText('Memória  fictícia');
  await expect(mobile.locator('[data-testid="contador"]')).toHaveText('0');
  await mobile.locator('[data-testid="campo-titulo"]').fill('Outra memória');
  await mobile.locator('[data-testid="botao-registrar"]').click();
  await expect(mobile.locator('[data-testid="contador"]')).toHaveText('1');
  await expect(web.locator('[data-testid="contador"]')).toHaveText('1');
});

test('todas as verificações somam 100 XP com feedback contextual e sem duplicação',async({page})=>{
  test.setTimeout(120000);
  await open(page);
  const editor=page.locator('#code');
  const source=await editor.inputValue();
  const newCode=source
    .replace("TITULO_APLICACAO = 'Memórias do campus'", "TITULO_APLICACAO = 'Memórias do IFMA'")
    .replace("DICA_CAMPO = 'Ex.: Feira de ciências'", "DICA_CAMPO = 'Ex.: Biblioteca escolar'")
    .replace('MINIMO_CARACTERES = 5','MINIMO_CARACTERES = 7')
    .replace('MAXIMO_CARACTERES = 60','MAXIMO_CARACTERES = 30')
    .replace("TEXTO_BOTAO = 'Registrar memória'", "TEXTO_BOTAO = 'Salvar registro de memória'")
    .replace("PREFIXO_ERRO = 'Informe pelo menos'", "PREFIXO_ERRO = 'Título curto: digite no mínimo'")
    .replace("MENSAGEM_SUCESSO = 'Memória registrada nesta sessão.'", "MENSAGEM_SUCESSO = 'Registro validado nesta sessão.'")
    .replace("COR_BOTAO = '#096b44'", "COR_BOTAO = '#1f4f83'");
  expect(newCode).not.toBe(source);
  await runSource(page,newCode);
  await answer(page,'map');
  for(const id of ['run','title','placeholder','limit','maximum','button','error','success','color','trim','invalid','isolation']) await checkCode(page,id);
  await answer(page,'quiz');
  await expect(page.locator('#xp-top')).toHaveText('100');
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow','100');
  await checkCode(page,'run');
  await expect(page.locator('#xp-top')).toHaveText('100');
});

test('quizzes aparecem NO painel de missão, sem rolagem ou caça a cartão',async({page})=>{
  await open(page);
  await mission(page,'map');
  await expect(page.locator('#quiz-bank')).toBeVisible();
  await expect(page.locator('#quiz-bank fieldset:visible')).toHaveCount(2);
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Responda');
  await answer(page,'map','c','c');
  await expect(page.locator('#xp-top')).toHaveText('0');
  await expect(page.locator('#guide-feedback')).toContainText('Revise');
  await answer(page,'map','a','b');
  await expect(page.locator('#xp-top')).toHaveText('5');
  await mission(page,'limit');
  await expect(page.locator('#quiz-bank')).toBeHidden();
  await mission(page,'map');
  await expect(page.locator('#quiz-bank input[name="map-q1"][value="a"]')).toBeChecked();
  expect(await page.evaluate(()=>document.scrollingElement.scrollTop)).toBe(0);
});

test('editar e executar mantêm XP conquistados sem apagar respostas conceituais',async({page})=>{
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  await expect(page.locator('#xp-top')).toHaveText('10');
  const editor=page.locator('#code');
  await editor.fill((await editor.inputValue())+'\n// alteração sem quebrar sintaxe');
  await expect(page.locator('#xp-top')).toHaveText('10');
  await mission(page,'run');
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Primeiro clique Executar');
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado');
  await checkCode(page,'run');
  await expect(page.locator('#xp-top')).toHaveText('10');
});

test('erro de compilação mostra feedback na própria bancada e permite evidência incompleta',async({page})=>{
  await open(page);
  const editor=page.locator('#code');
  await editor.fill((await editor.inputValue()).replace('export default function ProjetoUniversal()','export default function ProjetoUniversal('));
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Erro no código');
  await expect(page.locator('#xp-top')).toHaveText('0');
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Primeiro clique Executar');
  await page.locator('#evidence-open').click();
  await page.locator('#observacao').fill('Parcial: preciso rever a sintaxe.');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Laboratorio_Evidencia_v4.json');
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(payload.xp).toBe(0);
  expect(payload.maximoXp).toBe(100);
  expect(payload.exercicios).toHaveLength(14);
  expect(payload.exercicios.every(item=>item.estado==='PENDENTE')).toBe(true);
  expect(payload.observacao).toContain('Parcial');
  expect(payload.codigoFonteCompleto).toContain('ProjetoUniversal(');
});

test('evidências e explicação Vue/React aparecem em janelas acessíveis e retornam ao posto',async({page})=>{
  await open(page);
  await mission(page,'maximum');
  await page.locator('#help-open').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#help-dialog')).toContainText('useState');
  await page.locator('[data-close-dialog="help-dialog"]').click();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
  await page.locator('#evidence-open').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.locator('#observacao').fill('Alterei uma linha no mesmo componente.');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-md').click()]);
  expect(await readFile(await download.path(),'utf8')).toContain('PENDENTE');
  await page.locator('[data-close-dialog="evidence-dialog"]').click();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
});

test('uma tela 1440×800 mantém missão, execução, editor e resultado no viewport',async({page})=>{
  await page.setViewportSize({width:1440,height:800});
  await open(page);
  await mission(page,'limit');
  const ids=['#guide-title','#guide-check','#run','#code','#preview'];
  for(const id of ids){
    const r=await page.locator(id).boundingBox();
    expect(r,`Não visível: ${id}`).not.toBeNull();
    expect(r.y,`${id} está fora da tela`).toBeGreaterThanOrEqual(0);
    expect(r.y+r.height,`${id} passou da tela`).toBeLessThanOrEqual(801);
  }
  expect(await page.evaluate(()=>document.scrollingElement.scrollHeight)).toBeLessThanOrEqual(801);
});

test('notebook 1024 permite alternar Código/Resultado sem perder a missão',async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await open(page);
  await mission(page,'maximum');
  await expect(page.locator('#code-panel')).toBeVisible();
  await expect(page.locator('#result-panel')).toBeHidden();
  await page.locator('#view-preview').click();
  await expect(page.locator('#result-panel')).toBeVisible();
  await page.locator('#view-code').click();
  await expect(page.locator('#code-panel')).toBeVisible();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
  expect(await page.evaluate(()=>document.scrollingElement.scrollTop)).toBe(0);
});

test('smartphone: MISSÃO, CÓDIGO e RESULTADO usam áreas inteiras sem esmagar a edição',async({page})=>{
  test.setTimeout(120000);
  for(const size of [{width:320,height:640},{width:360,height:740},
                     {width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(size);
    const frame=await open(page);
    await mission(page,'limit');
    const nav=page.locator('.mobile-stage-nav');
    await expect(nav).toBeVisible();
    for(const button of ['#mobile-tab-mission','#mobile-tab-code','#mobile-tab-preview']){
      const box=await page.locator(button).boundingBox();
      expect(box.height,button).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator('#missao-atual')).toBeVisible();
    await expect(page.locator('#laboratorio')).toBeHidden();
    await expect(page.locator('#mobile-tab-mission')).toHaveAttribute('aria-selected','true');
    const copy=await page.locator('#mission-copy').boundingBox();
    expect(copy.height,'Missão comprimida em '+size.width+'×'+size.height).toBeGreaterThanOrEqual(190);
    const dims=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
      viewportW:innerWidth,viewportH:innerHeight
    }));
    expect(dims.width).toBeLessThanOrEqual(dims.viewportW+1);
    expect(dims.height).toBeLessThanOrEqual(dims.viewportH+1);
    await page.locator('#mobile-tab-code').click();
    await expect(page.locator('#missao-atual')).toBeHidden();
    await expect(page.locator('#code')).toBeVisible();
    const code=await page.locator('#code').boundingBox();
    expect(code.height,'Editor muito baixo em '+size.width+'×'+size.height).toBeGreaterThanOrEqual(210);
    const run=await page.locator('#mobile-run-code').boundingBox();
    expect(run.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('#mobile-editor-actions > summary')).toBeVisible();
    await expect(page.locator('#download-code')).toBeHidden();
    await page.locator('#mobile-tab-preview').click();
    await expect(page.locator('#result-panel')).toBeVisible();
    await expect(page.locator('#code-panel')).toBeHidden();
    const preview=await page.locator('#preview').boundingBox();
    expect(preview.height,'Prévia muito baixa em '+size.width+'×'+size.height).toBeGreaterThanOrEqual(260);
    await expect(frame.locator('#preview-device-web')).toBeVisible();
    await expect(frame.locator('#web-display')).toBeVisible();
    await expect(frame.locator('#mobile-display')).toBeHidden();
    await frame.locator('#preview-device-mobile').click();
    await expect(frame.locator('#mobile-display')).toBeVisible();
    await expect(frame.locator('#web-display')).toBeHidden();
    await expect(frame.locator('#web-root [data-testid="app-universal"]')).toHaveCount(1);
    await expect(frame.locator('#mobile-root [data-testid="app-universal"]')).toHaveCount(1);
  }
});

test('smartphone: localizar linha abre CÓDIGO, executar abre RESULTADO sem apagar fonte e XP',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await open(page);
  await mission(page,'limit');
  await page.locator('#guide-locate').click();
  await expect(page.locator('#mobile-tab-code')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#code')).toBeVisible();
  const before=await page.locator('#code').inputValue();
  expect(before).toContain('export const MINIMO_CARACTERES');
  await page.locator('#mobile-run-code').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await expect(page.locator('#mobile-tab-preview')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#mobile-tab-preview')).toBeFocused();
  await expect(page.locator('#preview')).toBeVisible();
  await page.locator('#mobile-tab-code').click();
  expect(await page.locator('#code').inputValue()).toBe(before);
  await page.locator('#code').focus();
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('#mobile-tab-preview')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#mobile-tab-preview')).toBeFocused();
  await expect(page.locator('#xp-top')).toHaveText('0');
});

test('smartphone: restaurar JSON enquanto Resultado está aberto exibe Código e mantém fonte',async({page})=>{
  await page.setViewportSize({width:360,height:740});
  await open(page);
  const original=await page.locator('#code').inputValue();
  const evidence=await page.evaluate(()=>window.WebLabEvidence.snapshot());
  await page.locator('#mobile-tab-preview').click();
  await expect(page.locator('#code')).toBeHidden();
  await page.evaluate(()=>{window.confirm=()=>true;});
  await page.locator('#progress-file').setInputFiles({
    name:'aula05-checkpoint-local.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(evidence))
  });
  await expect(page.locator('#mobile-tab-code')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#mobile-tab-code')).toBeFocused();
  await expect(page.locator('#code')).toBeVisible();
  await expect(page.locator('#result-panel')).toBeHidden();
  await expect(page.locator('#progress-status')).toContainText('Progresso retomado');
  expect(await page.locator('#code').inputValue()).toBe(original);
});


test('smartphone: barra compacta deixa espaço para editar mesmo com rascunho de versão antiga',async({page})=>{
  await page.setViewportSize({width:320,height:640});
  await page.addInitScript(()=>{
    localStorage.setItem('ifma-web-aula05-lab-v2',JSON.stringify({code:'// cópia de versão anterior\nexport const MINIMO_CARACTERES = 9;'}));
  });
  await open(page);
  await page.locator('#mobile-tab-code').click();
  await expect(page.locator('#migration-note')).toHaveCount(0);
  const buttons=['#mobile-run-code','#mobile-editor-focus','#mobile-editor-actions > summary'];
  const positions=[];
  for(const selector of buttons){
    const box=await page.locator(selector).boundingBox();
    expect(box.height,selector).toBeGreaterThanOrEqual(44);
    positions.push(box.y);
  }
  expect(Math.max(...positions)-Math.min(...positions)).toBeLessThanOrEqual(2);
  await expect(page.locator('#legacy-export')).not.toBeVisible();
  await expect(page.locator('#code-panel > .panel-caption')).toBeHidden();
  await expect(page.locator('#editor-context')).toBeHidden();
  const editor=page.locator('#code');
  const normal=(await editor.boundingBox()).height;
  expect(normal).toBeGreaterThanOrEqual(300);
  await page.locator('#mobile-editor-focus').click();
  await expect(page.locator('#mobile-editor-focus')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#code-panel .file-tabs')).toBeHidden();
  const focused=(await editor.boundingBox()).height;
  expect(focused).toBeGreaterThan(normal+30);
  await page.locator('#mobile-editor-focus').click();
  await expect(page.locator('#mobile-editor-focus')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#code-panel .file-tabs')).toBeVisible();
  expect((await editor.boundingBox()).height).toBeGreaterThanOrEqual(normal-2);
  await page.locator('#mobile-editor-actions > summary').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-editor-action="download-code"]').click()
  ]);
  expect(download.suggestedFilename()).toBe('ProjetoUniversal.tsx');
  const src=await editor.inputValue();
  expect(await readFile(await download.path(),'utf8')).toBe(src);
});

test('smartphone: backup de versão antiga não aparece para quem não tem rascunho legado',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await open(page);
  await page.locator('#mobile-tab-code').click();
  await expect(page.locator('#legacy-export')).not.toBeVisible();
  await page.locator('#mobile-editor-actions > summary').click();
  const reset=page.locator('[data-editor-action="reset"]');
  await expect(reset).toBeVisible();
  await page.locator('#mobile-editor-actions > summary').click();
  await page.locator('#mobile-tab-mission').click();
  await page.locator('#mobile-tools-menu > summary').click();
  await page.locator('[data-forward-action="evidence-open"]').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await expect(page.locator('#legacy-recovery')).toBeHidden();
});

test('smartphone: menu de ferramentas mantém acesso a equipe, evidências e ajuda',async({page})=>{
  await page.setViewportSize({width:320,height:640});
  await open(page);
  await expect(page.locator('#team-open')).toBeHidden();
  const menu=page.locator('#mobile-tools-menu');
  const trigger=menu.locator('summary');
  await trigger.click();
  await expect(menu).toHaveAttribute('open','');
  for(const item of ['team-open','save-progress','load-progress','evidence-open',
                     'review-xp','quick-pdf','component-open','help-open']){
    const btn=menu.locator('[data-forward-action="'+item+'"]');
    const rect=await btn.boundingBox();
    expect(rect.height,item).toBeGreaterThanOrEqual(44);
  }
  await menu.locator('[data-forward-action="team-open"]').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await trigger.click();
  await menu.locator('[data-forward-action="evidence-open"]').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await trigger.click();
  await menu.locator('[data-forward-action="help-open"]').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
});

test('acessibilidade estrutural: foco, nome de campo, diálogo, contraste de avisos e redução de movimento',async({page})=>{
  await open(page);
  await expect(page.locator('#mission-select')).toHaveAttribute('aria-label',/14 exercícios/);
  await expect(page.locator('#guide-feedback')).toHaveAttribute('aria-live','polite');
  await expect(page.locator('#compiler-status')).toHaveAttribute('role','status');
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow','0');
  await expect(page.locator('#preview')).toHaveAttribute('sandbox','allow-scripts');
  await page.locator('#help-open').click();
  await expect(page.locator('#help-dialog')).toHaveAttribute('open','');
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toHaveAttribute('open','');
});

test('ambas as prévias ficam lado a lado no iframe do desktop, não uma escondida abaixo',async({page})=>{
  await page.setViewportSize({width:1440,height:800});
  const frame=await open(page);
  const cards=frame.locator('.display');
  await expect(cards).toHaveCount(2);
  const web=await cards.nth(0).boundingBox();
  const mobile=await cards.nth(1).boundingBox();
  expect(web).not.toBeNull();expect(mobile).not.toBeNull();
  expect(Math.abs(web.y-mobile.y)).toBeLessThan(4);
  expect(mobile.x).toBeGreaterThan(web.x+web.width-3);
  // Ampliar resultado sem sair da missão, retornando ao editor pelo mesmo controle.
  await mission(page,'maximum');
  await page.locator('#expand-preview').click();
  await expect(page.locator('#code-panel')).toBeHidden();
  await expect(page.locator('#result-panel')).toBeVisible();
  await page.locator('#expand-preview').click();
  await expect(page.locator('#code-panel')).toBeVisible();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
});


test('Laboratório Vivo: placeholder é exemplo, regra é visível e contador usa trim()',async({page})=>{
  const frame=await open(page);
  await expect(page).toHaveTitle(/Laboratório Vivo/);
  await mission(page,'placeholder');
  await expect(page.locator('#guide-concept')).toContainText('accessibilityHint');
  await expect(page.locator('#guide-test')).toContainText('5–60');
  const web=frame.locator('#web-root');
  const mobile=frame.locator('#mobile-root');
  for(const view of [web,mobile]){
    await expect(view.locator('[data-testid="campo-titulo"]')).toHaveAttribute('placeholder','Ex.: Feira de ciências');
    await expect(view.locator('[data-testid="ajuda-titulo"]')).toHaveText('Digite de 5 a 60 caracteres. Espaços nas extremidades não contam.');
    await expect(view.locator('[data-testid="contador-caracteres"]')).toContainText('0');
  }
  const input=web.locator('[data-testid="campo-titulo"]');
  await input.fill('  1  ');
  await expect(web.locator('[data-testid="contador-caracteres"]')).toContainText('1');
  await expect(web.locator('[data-testid="ajuda-titulo"]')).toBeVisible();
  await web.locator('[data-testid="botao-registrar"]').click();
  await expect(web.locator('[data-testid="erro-titulo"]')).toHaveText('Informe pelo menos 5 caracteres.');
  await expect(web.locator('[data-testid="ajuda-titulo"]')).toContainText('5 a 60');
  await input.fill('  Memória escolar  ');
  await expect(web.locator('[data-testid="erro-titulo"]')).toHaveCount(0);
  await expect(web.locator('[data-testid="contador-caracteres"]')).toContainText('15');
});

test('alterar minimo e maximo atualiza simultaneamente regra visível nas duas prévias',async({page})=>{
  const frame=await open(page);
  const original=await page.locator('#code').inputValue();
  const next=original.replace('MINIMO_CARACTERES = 5','MINIMO_CARACTERES = 7').replace('MAXIMO_CARACTERES = 60','MAXIMO_CARACTERES = 30');
  await runSource(page,next);
  for(const selector of ['#web-root','#mobile-root']){
    const root=frame.locator(selector);
    await expect(root.locator('[data-testid="ajuda-titulo"]')).toContainText('7 a 30');
    await root.locator('[data-testid="campo-titulo"]').fill('123456');
    await root.locator('[data-testid="botao-registrar"]').click();
    await expect(root.locator('[data-testid="erro-titulo"]')).toContainText('7 caracteres');
  }
  await mission(page,'limit');
  await expect(page.locator('#guide-concept')).toContainText('orientação visível');
  await expect(page.locator('#guide-test')).toContainText('7–60');
});

test('novo tutorial preserva e permite exportar rascunho v3 sem substituí-lo automaticamente',async({page})=>{
  const prior="// trabalho do estudante v3\nexport const MINIMO_CARACTERES = 9;";
  await page.addInitScript(text=>{
    localStorage.setItem('ifma-web-aula05-lab-v2', JSON.stringify({code:text}));
  },prior);
  await open(page);
  // A área de código fica limpa; a cópia antiga só aparece em Recuperação
  // opcional dentro de Evidências e nunca substitui o TSX atual.
  await expect(page.locator('#migration-note')).toHaveCount(0);
  const editor=await page.locator('#code').inputValue();
  expect(editor).toContain('testID="ajuda-titulo"');
  expect(editor).not.toContain('MINIMO_CARACTERES = 9');
  await page.locator('#evidence-open').click();
  const recovery=page.locator('#legacy-recovery');
  await expect(recovery).toBeVisible();
  await expect(recovery).not.toHaveAttribute('open','');
  await recovery.locator('summary').click();
  await expect(recovery).toContainText('Só baixe essa cópia se quiser');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#legacy-export').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Rascunho_v3_Backup.tsx');
  expect(await readFile(await download.path(),'utf8')).toBe(prior);
});


test('atalhos de PDF e salvar/retomar aparecem no cabeçalho e no diálogo',async({page})=>{
  await open(page);
  for(const id of ['save-progress','load-progress','quick-pdf']) await expect(page.locator('#'+id)).toBeVisible();
  await page.locator('#evidence-open').click();
  for(const id of ['dialog-save-progress','dialog-load-progress','dialog-pdf']) await expect(page.locator('#'+id)).toBeVisible();
  await expect(page.locator('#evidence-dialog')).toContainText('Pode manter exercícios e reflexões');
});
test('recarregar mantém código, missão, quiz e XP formativos da sessão',async({page})=>{
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  const code=await page.locator('#code').inputValue();
  await mission(page,'limit');
  await expect(page.locator('#xp-top')).toHaveText('10');
  await page.reload();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await expect(page.locator('#xp-top')).toHaveText('10');
  await expect(page.locator('#mission-select')).toHaveValue('limit');
  await expect(page.locator('#code')).toHaveValue(code);
  await mission(page,'map');
  await expect(page.locator('#quiz-bank input[name="map-q1"][value="a"]')).toBeChecked();
});
test('JSON de continuidade parcial pode ser carregado em outra sessão sem concluir missões pendentes',async({page})=>{
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  await mission(page,'limit');
  const source=await page.locator('#code').inputValue();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Continuar_Depois.json');
  const raw=await readFile(await download.path(),'utf8');
  const saved=JSON.parse(raw);
  expect(saved.schema).toBe('ifma-web-aula05-checkpoint-v1');
  expect(saved.xp).toBe(10);
  expect(saved.completed).toEqual(['run','map']);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await expect(page.locator('#xp-top')).toHaveText('0');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#progress-file').setInputFiles({name:'retomar.json',mimeType:'application/json',buffer:Buffer.from(raw)});
  await expect(page.locator('#progress-status')).toContainText('Progresso retomado');
  await expect(page.locator('#xp-top')).toHaveText('10');
  await expect(page.locator('#code')).toHaveValue(source);
  await expect(page.locator('#mission-select')).toHaveValue('limit');
  await expect(page.locator('#evidence-count')).toContainText('12 pendentes');
});
test('PDF parcial usa pontuação corrente e preserva perguntas não respondidas',async({page})=>{
  await page.addInitScript(()=>{window.print=()=>{window.__printed= document.getElementById('print-report').textContent;}});
  await open(page);
  await checkCode(page,'run');
  await page.locator('#team-open').click();
  await page.locator('#web-team').fill('Equipe Sabiá');
  await page.locator('#web-member-0-name').fill('Lia Martins');
  await page.locator('#team-done').click();
  await page.locator('#quick-pdf').click();
  const report=await page.evaluate(()=>window.__printed);
  expect(report).toContain('5 / 100 XP');
  expect(report).toContain('Equipe Sabiá');
  expect(report).toContain('Lia Martins');
  expect(report).toContain('13 pendentes');
  expect(report).toContain('Pendente');
});


test('componentes básicos podem ser vistos e localizados no código completo',async({page})=>{
  await open(page);
  await expect(page.locator('#component-open')).toBeVisible();
  await page.locator('#component-open').click();
  await expect(page.locator('#component-dialog')).toBeVisible();
  await expect(page.locator('#component-name')).toContainText('View');
  for(const [id,fragment] of [['Text','<Text style={styles.titulo}>'],['TextInput','<TextInput'],['Pressable','<Pressable'],['View','<View style={styles.pagina}']]){
    await page.locator('[data-component="'+id+'"]').click();
    await expect(page.locator('#component-fragment')).toHaveText(fragment);
    await page.locator('#component-locate').click();
    await expect(page.locator('#component-dialog')).toBeHidden();
    const selected=await page.locator('#code').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));
    expect(selected).toBe(fragment);
    await expect(page.locator('#compiler-status')).toContainText('Componente '+id);
    await page.locator('#component-open').click();
  }
  await page.locator('[data-close-dialog="component-dialog"]').click();
  await expect(page.locator('#xp-top')).toHaveText('0');
  await expect(page.locator('#mission-select option')).toHaveCount(14);
});

test('salvar e restaurar progresso preserva código e respostas sem obrigar a concluir a aula',async({page})=>{
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  await mission(page,'limit');
  const code=await page.locator('#code').inputValue();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  const data=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(data.schema).toBe('ifma-web-aula05-checkpoint-v1');
  expect(data.xp).toBe(10);
  expect(data.activeTask).toBe('limit');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  page.once('dialog',d=>d.accept());
  await page.locator('#progress-file').setInputFiles({name:'progresso.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.locator('#xp-top')).toHaveText('10');
  await expect(page.locator('#code')).toHaveValue(code);
  await expect(page.locator('#mission-select')).toHaveValue('limit');
  await expect(page.locator('#evidence-count')).toContainText('12 pendentes');
});
