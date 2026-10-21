/** Testes reais do laboratório e dos cenários das 14 tarefas (sem simular a UI). */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const frameFor = page => page.frameLocator('#preview');
const stage = (page, id) => page.locator(`[data-mission="${id}"]`);

async function open(page) {
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado', { timeout: 30000 });
  const frame=frameFor(page);
  await expect(frame.locator('#web-root [data-testid="app-universal"]')).toBeVisible();
  await expect(frame.locator('#mobile-root [data-testid="app-universal"]')).toBeVisible();
  await expect(stage(page,'quiz')).toBeVisible({ timeout: 10000 });
  return frame;
}

async function runSource(page, source) {
  await page.locator('#code').fill(source);
  await expect(page.locator('#xp-top')).toHaveText('0');
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado', { timeout: 20000 });
}
async function checkCode(page,id) {
  await stage(page,id).locator('[data-check]').click();
  await expect(page.locator(`[data-feedback="${id}"]`)).toContainText('Concluído', { timeout: 20000 });
}
async function answer(page,id,first='a',second='b') {
  const card=stage(page,id);
  await card.locator(`input[name="${id}-q1"][value="${first}"]`).check();
  await card.locator(`input[name="${id}-q2"][value="${second}"]`).check();
  await card.locator('[data-check]').click();
}

test('14 exercícios carregam em 3 ciclos e guia localiza blocos no código completo', async ({page}) => {
  await open(page);
  await expect(page.locator('.challenge-card')).toHaveCount(14);
  await expect(page.locator('.chapter')).toHaveCount(3);
  await expect(page.locator('#xp-top')).toHaveText('0');
  const complete=await page.locator('#code').inputValue();
  expect(complete).toContain('// [01] IMPORTAÇÕES');
  expect(complete).toContain('// [07] ESTILOS');
  await page.locator('#guide-locate').click();
  const selection=await page.locator('#code').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));
  expect(selection).toBe('// [06] INTERFACE');
  await page.locator('#guide-next').click();
  await expect(page.locator('#guide-title')).toHaveText('Encontre o caminho do estado');
  await page.locator('#guide-locate').click();
  const nextSelection=await page.locator('#code').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));
  expect(nextSelection).toBe('// [04] COMPONENTE');
  await stage(page,'maximum').locator('[data-open]').click();
  await expect(page.locator('#guide-title')).toContainText('limite máximo');
  await expect(page.locator('#guide-number')).toContainText('CICLO 2');
});

test('mesmo componente em dois painéis, validação e estados independentes reais', async ({ page }) => {
  const frame=await open(page);
  const web=frame.locator('#web-root');const mobile=frame.locator('#mobile-root');
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

test('14 tarefas: 12 verificações técnicas + 2 quizzes somam exatamente 100 XP', async ({page}) => {
  test.setTimeout(120000);
  await open(page);
  const editor=page.locator('#code');const src=await editor.inputValue();
  const replacement = src
    .replace("TITULO_APLICACAO = 'Memórias do campus'", "TITULO_APLICACAO = 'Memórias do IFMA'")
    .replace("DICA_CAMPO = 'Ex.: Feira de ciências'", "DICA_CAMPO = 'Ex.: Biblioteca escolar'")
    .replace('MINIMO_CARACTERES = 5','MINIMO_CARACTERES = 7')
    .replace('MAXIMO_CARACTERES = 60','MAXIMO_CARACTERES = 30')
    .replace("TEXTO_BOTAO = 'Registrar memória'", "TEXTO_BOTAO = 'Salvar registro de memória'")
    .replace("PREFIXO_ERRO = 'Informe pelo menos'", "PREFIXO_ERRO = 'Título curto: digite no mínimo'")
    .replace("MENSAGEM_SUCESSO = 'Memória registrada nesta sessão.'", "MENSAGEM_SUCESSO = 'Registro validado nesta sessão.'")
    .replace("COR_BOTAO = '#096b44'", "COR_BOTAO = '#1f4f83'");
  expect(replacement).not.toBe(src);
  for(const original of ["TITULO_APLICACAO = 'Memórias do campus'", 'MINIMO_CARACTERES = 5','MAXIMO_CARACTERES = 60',"COR_BOTAO = '#096b44'"])
    expect(replacement).not.toContain(original);
  await runSource(page,replacement);
  const frame=frameFor(page);
  for(const root of ['web-root','mobile-root']) {
    await expect(frame.locator(`#${root} [data-testid="botao-registrar"]`)).toHaveText('Salvar registro de memória');
    await expect(frame.locator(`#${root} [data-testid="campo-titulo"]`)).toHaveAttribute('placeholder','Ex.: Biblioteca escolar');
  }
  await answer(page,'map');
  await expect(page.locator('#xp-top')).toHaveText('5');
  const codeIds=['run','title','placeholder','limit','maximum','button','error','success','color','trim','invalid','isolation'];
  for(const id of codeIds) await checkCode(page,id);
  await answer(page,'quiz');
  await expect(page.locator('#xp-top')).toHaveText('100');
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow','100');
  await expect(page.locator('.challenge-card.passed')).toHaveCount(14);
  await stage(page,'run').locator('[data-check]').click();
  await expect(page.locator('#xp-top')).toHaveText('100'); // idempotência
});

test('editar invalida conquistas técnicas, mas preserva explicações verificadas', async ({page}) => {
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  await expect(page.locator('#xp-top')).toHaveText('10');
  const editor=page.locator('#code');
  await editor.fill((await editor.inputValue()) + '\n// Alteração didática sem quebrar a sintaxe');
  await expect(page.locator('#xp-top')).toHaveText('5');
  await stage(page,'run').locator('[data-check]').click();
  await expect(page.locator('[data-feedback="run"]')).toContainText('Execute', {timeout: 8000});
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado');
  await checkCode(page,'run');
  await expect(page.locator('#xp-top')).toHaveText('10');
});

test('código inválido não recebe XP, erro legível e exportação parcial mantém pendências', async ({page}) => {
  await open(page);
  const editor=page.locator('#code');
  await editor.fill((await editor.inputValue()).replace('export default function ProjetoUniversal()', 'export default function ProjetoUniversal('));
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Erro de compilação');
  await expect(page.locator('#xp-top')).toHaveText('0');
  await stage(page,'run').locator('[data-check]').click();
  await expect(page.locator('[data-feedback="run"]')).toContainText('Execute');
  await page.locator('#observacao').fill('Parcial: preciso rever a sintaxe.');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Laboratorio_Evidencia_v2.json');
  const payload=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(payload.xp).toBe(0);
  expect(payload.maximoXp).toBe(100);
  expect(payload.exercicios).toHaveLength(14);
  expect(payload.exercicios.every(item=>item.estado==='PENDENTE')).toBe(true);
  expect(payload.codigoFonteCompleto).toContain('export default function ProjetoUniversal(');
  expect(payload.observacao).toContain('Parcial');
});

test('quizzes incorretos ou em branco não ganham XP, respostas corrigidas sim',async({page})=>{
  await open(page);
  await stage(page,'map').locator('[data-check]').click();
  await expect(page.locator('#xp-top')).toHaveText('0');
  await answer(page,'map','c','c');
  await expect(page.locator('#xp-top')).toHaveText('0');
  await expect(page.locator('[data-feedback="map"]')).toContainText('seção');
  await answer(page,'map','a','b');
  await expect(page.locator('#xp-top')).toHaveText('5');
  await answer(page,'quiz','a','b');
  await expect(page.locator('#xp-top')).toHaveText('10');
  await stage(page,'quiz').locator('input[name="quiz-q2"][value="a"]').check();
  await expect(page.locator('#xp-top')).toHaveText('5');
});

test('rascunho v1 é preservado, exportável, mas nunca sobrepõe a fonte comentada',async({page})=>{
  await page.addInitScript(() => localStorage.setItem('ifma-web-aula05-lab-v1',JSON.stringify({code:'// CÓDIGO DO ALUNO V1'})));
  await open(page);
  const editor=await page.locator('#code').inputValue();
  expect(editor).toContain('// [01] IMPORTAÇÕES');
  expect(editor).not.toContain('CÓDIGO DO ALUNO V1');
  await expect(page.locator('#legacy-export')).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#legacy-export').click()]);
  expect(download.suggestedFilename()).toContain('Backup');
  expect(await readFile(await download.path(),'utf8')).toContain('CÓDIGO DO ALUNO V1');
});

test('arquivo completo e evidências Markdown continuam disponíveis com respostas parciais',async({page})=>{
  await open(page);
  await page.locator('#observacao').fill('Alterei uma propriedade no componente.');
  await checkCode(page,'run');
  const [md]=await Promise.all([page.waitForEvent('download'),page.locator('#export-md').click()]);
  const report=await readFile(await md.path(),'utf8');
  expect(report).toContain('5/100');
  expect(report).toContain('PENDENTE');
  expect(report).toContain('## Arquivo completo entregue');
  expect(report).toContain('useState');
  await page.evaluate(() => {window.print=()=>{};});
  await page.locator('#print').click();
  await expect(page.locator('#print-report')).toContainText('Exercícios');
  await expect(page.locator('#print-report')).toContainText('PENDENTE');
});

test('layout responsivo não gera barra horizontal, inclusive com os 14 cartões',async({page})=>{
  for(const width of [360,390,768,1280,1600]) {
    await page.setViewportSize({width,height:900});
    await open(page);
    const body=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    expect(body.scroll,`overflow em ${width}px`).toBeLessThanOrEqual(body.client+1);
  }
});
