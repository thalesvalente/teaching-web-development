/** Regressão XP cumulativo: 14 missões sem refazer as anteriores. */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const codeTasks = [
  ['title',"TITULO_APLICACAO = 'Memórias do campus'","TITULO_APLICACAO = 'Memórias do IFMA'",6],
  ['placeholder',"DICA_CAMPO = 'Ex.: Feira de ciências'","DICA_CAMPO = 'Ex.: Biblioteca escolar'",6],
  ['limit','MINIMO_CARACTERES = 5','MINIMO_CARACTERES = 7',12],
  ['maximum','MAXIMO_CARACTERES = 60','MAXIMO_CARACTERES = 30',10],
  ['button',"TEXTO_BOTAO = 'Registrar memória'","TEXTO_BOTAO = 'Salvar registro de memória'",7],
  ['error',"PREFIXO_ERRO = 'Informe pelo menos'","PREFIXO_ERRO = 'Título curto: digite no mínimo'",7],
  ['success',"MENSAGEM_SUCESSO = 'Memória registrada nesta sessão.'","MENSAGEM_SUCESSO = 'Registro validado nesta sessão.'",7],
  ['color',"COR_BOTAO = '#096b44'","COR_BOTAO = '#1f4f83'",6]
];
async function open(page) {
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
}
async function select(page,id) { await page.locator('#mission-select').selectOption(id); }
async function check(page,id) {
  await select(page,id);
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Aprovado',{timeout:20000});
}
async function quiz(page,id) {
  await select(page,id);
  await page.locator('#quiz-bank input[name="'+id+'-q1"][value="a"]').check();
  await page.locator('#quiz-bank input[name="'+id+'-q2"][value="b"]').check();
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Aprovado');
}
async function run(page,source) {
  await page.locator('#code').fill(source);
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
}
async function waitXp(page,xp) { await expect(page.locator('#xp-top')).toHaveText(String(xp),{timeout:20000}); }
function finalSource(source) {
  for (const [id,original,update] of codeTasks) {
    if(!source.includes(original))throw Error('Aula 05 mudou o critério '+id);
    source=source.replace(original,update);
  }
  return source;
}
test('BUG relatado: avançar pelas 14 missões com oito edições nunca faz XP diminuir',async({page})=>{
  test.setTimeout(120000);
  await open(page);
  let xp=0;
  await check(page,'run');xp+=5;await waitXp(page,xp);
  await quiz(page,'map');xp+=5;await waitXp(page,xp);
  let source=await page.locator('#code').inputValue();
  for(const [id,original,update,earned] of codeTasks){
    expect(source).toContain(original);
    source=source.replace(original,update);
    // Editar o TSX preserva os XP anteriores, mesmo antes de executar.
    await page.locator('#code').fill(source);
    await waitXp(page,xp);
    await page.locator('#run').click();
    await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
    await waitXp(page,xp);
    await check(page,id);
    xp+=earned;
    await waitXp(page,xp);
    // Avançar ao próximo enunciado não altera pontos anteriores.
    await select(page,id==='color'?'trim':codeTasks[(codeTasks.findIndex(t=>t[0]===id)+1)%codeTasks.length][0]);
    await waitXp(page,xp);
  }
  for(const [id,earned] of [['trim',8],['invalid',8],['isolation',8]]){
    await check(page,id);xp+=earned;await waitXp(page,xp);
  }
  await quiz(page,'quiz');xp+=5;
  expect(xp).toBe(100);
  await waitXp(page,100);
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow','100');
  // Testar novamente a mesma missão não duplica nem cancela XP.
  await check(page,'run');await waitXp(page,100);
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado');
  await waitXp(page,100);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  const content=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(content.xp).toBe(100);
  expect(content.completed).toHaveLength(14);
  await page.reload();
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await waitXp(page,100);
});

test('Conferir novamente uma missão já aprovada, mesmo com falha atual, preserva XP',async({page})=>{
  await open(page);
  await check(page,'run');await waitXp(page,5);
  let source=await page.locator('#code').inputValue();
  source=source.replace('MINIMO_CARACTERES = 5','MINIMO_CARACTERES = 7');
  await run(page,source);await waitXp(page,5);
  await check(page,'limit');await waitXp(page,17);
  source=source.replace('MINIMO_CARACTERES = 7','MINIMO_CARACTERES = 5');
  await run(page,source);await waitXp(page,17);
  await select(page,'limit');
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Revisar código atual',{timeout:20000});
  await expect(page.locator('#guide-feedback')).toContainText('12 XP conquistados preservados');
  await waitXp(page,17);
  const xpBeforeReview=Number(await page.locator('#xp-top').textContent());
  await page.locator('#review-xp').click();
  await expect(page.locator('#review-status')).toContainText('Conferência concluída',{timeout:60000});
  // No TSX atual, trim/invalid/isolation passam, somando 24 XP legítimos.
  // A prova correta é nunca SUBTRAIR conquistas anteriores e creditar novos PASS.
  await expect(page.locator('#review-status')).toContainText('+24 XP');
  await waitXp(page,41);
  expect(Number(await page.locator('#xp-top').textContent())).toBeGreaterThanOrEqual(xpBeforeReview);
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow','41');
});

test('Conferir progresso recupera XP de critérios efetivamente presentes no TSX em uma operação',async({page})=>{
  test.setTimeout(90000);
  await open(page);
  const source=finalSource(await page.locator('#code').inputValue());
  await run(page,source);
  await quiz(page,'map');await quiz(page,'quiz');
  await waitXp(page,10);
  await page.locator('#review-xp').click();
  await expect(page.locator('#review-status')).toContainText('Conferência concluída',{timeout:60000});
  await expect(page.locator('#review-status')).toContainText('12/12 missões técnicas aprovadas');
  await expect(page.locator('#review-status')).toContainText('+90 XP');
  await waitXp(page,100);
  await page.locator('#review-xp').click();
  await expect(page.locator('#review-status')).toContainText('Conferência concluída',{timeout:60000});
  await expect(page.locator('#review-status')).toContainText('+0 XP');
  await waitXp(page,100);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  const saved=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(saved.xp).toBe(100);
  expect(saved.completed).toHaveLength(14);
});

test('mudar respostas depois de obter XP conceituais não subtrai pontuação',async({page})=>{
  await open(page);
  await quiz(page,'map');await waitXp(page,5);
  await page.locator('#quiz-bank input[name="map-q1"][value="c"]').check();
  await waitXp(page,5);
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Revisar resposta atual');
  await waitXp(page,5);
});

test('compilação inválida após conquista bloqueia novas missões, mas não elimina histórico',async({page})=>{
  await open(page);
  await check(page,'run');
  await quiz(page,'map');
  await waitXp(page,10);
  const good=await page.locator('#code').inputValue();
  await page.locator('#code').fill(good.replace('export default function ProjetoUniversal()', 'export default function ProjetoUniversal('));
  await waitXp(page,10);
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Erro no código',{timeout:20000});
  await waitXp(page,10);
  await select(page,'title');
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Primeiro clique Executar');
  await waitXp(page,10);
  const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#save-progress').click()]);
  const saved=JSON.parse(await readFile(await d.path(),'utf8'));
  expect(saved.xp).toBe(10);
  await page.reload();
  await expect(page.locator('#compiler-status')).toContainText('Erro no código',{timeout:30000});
  await waitXp(page,10);
});
