/** QA adversarial de continuidade: arquivos reais JSON, sessões distintas e pendências. */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function open(page){
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
}
async function check(page,id='run'){
  await page.locator('#mission-select').selectOption(id);
  await page.locator('#guide-check').click();
  await expect(page.locator('#guide-feedback')).toContainText('Aprovado',{timeout:20000});
}
async function mapQuiz(page){
  await page.locator('#mission-select').selectOption('map');
  await page.locator('#quiz-bank input[name="map-q1"][value="a"]').check();
  await page.locator('#quiz-bank input[name="map-q2"][value="b"]').check();
  await page.locator('#guide-check').click();
  await expect(page.locator('#xp-top')).toHaveText('10');
}
async function saveFile(page){
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.locator('#save-progress').click()
  ]);
  expect(download.suggestedFilename()).toBe('Aula05_Continuar_Depois.json');
  return await readFile(await download.path(),'utf8');
}
function selectedFile(data){
  return {name:'progresso-aula05.json',mimeType:'application/json',
    buffer:Buffer.from(typeof data==='string'?data:JSON.stringify(data),'utf8')};
}
test('salvar JSON e retomar em OUTRO contexto preserva TSX, quiz, observações, missão e XP',async({browser})=>{
  const ctx1=await browser.newContext({acceptDownloads:true});
  const first=await ctx1.newPage();
  await open(first);
  const original=await first.locator('#code').inputValue();
  const edited=original+'\n// anotação da turma: teste UTF-8 e continuidade';
  await first.locator('#code').fill(edited);
  await first.locator('#run').click();
  await expect(first.locator('#compiler-status')).toContainText('Executado');
  await check(first);
  await mapQuiz(first);
  await first.locator('#mission-select').selectOption('maximum');
  await first.locator('#evidence-open').click();
  await first.locator('#observacao').fill('Ajustei o exemplo e comparei as duas prévias.\nRegistro parcial.');
  await first.locator('#limite-real').fill('Validar teclado e leitor de tela em Android real.');
  await first.locator('[data-close-dialog="evidence-dialog"]').click();
  const raw=await saveFile(first);
  const data=JSON.parse(raw);
  expect(data.schema).toBe('ifma-web-aula05-checkpoint-v1');
  expect(data.code).toBe(edited);
  expect(data.completed).toEqual(['run','map']);
  expect(data.xp).toBe(10);
  expect(data.activeTask).toBe('maximum');
  expect(data.answers).toMatchObject({'map-q1':'a','map-q2':'b'});
  expect(data.note).toContain('Registro parcial.');
  expect(data.nativeNote).toContain('Android real');
  const ctx2=await browser.newContext({acceptDownloads:true});
  const second=await ctx2.newPage();
  await open(second);
  await expect(second.locator('#xp-top')).toHaveText('0');
  second.once('dialog',dialog=>dialog.accept());
  await second.locator('#progress-file').setInputFiles(selectedFile(raw));
  await expect(second.locator('#progress-status')).toContainText('Progresso retomado',{timeout:15000});
  await expect(second.locator('#xp-top')).toHaveText('10');
  await expect(second.locator('#code')).toHaveValue(edited);
  await expect(second.locator('#mission-select')).toHaveValue('maximum');
  await second.locator('#evidence-open').click();
  await expect(second.locator('#observacao')).toHaveValue(data.note);
  await expect(second.locator('#limite-real')).toHaveValue(data.nativeNote);
  await second.locator('[data-close-dialog="evidence-dialog"]').click();
  await second.locator('#mission-select').selectOption('map');
  await expect(second.locator('#quiz-bank input[name="map-q1"][value="a"]')).toBeChecked();
  await second.reload();
  await expect(second.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
  await expect(second.locator('#xp-top')).toHaveText('10');
  await expect(second.locator('#code')).toHaveValue(edited);
  await ctx1.close();await ctx2.close();
});
test('pergunta parcialmente respondida continua pendente, mantendo a alternativa assinalada',async({page})=>{
  await open(page);
  await check(page);
  await page.locator('#mission-select').selectOption('map');
  await page.locator('#quiz-bank input[name="map-q1"][value="a"]').check();
  await expect(page.locator('#xp-top')).toHaveText('5');
  const raw=await saveFile(page);
  const data=JSON.parse(raw);
  expect(data.completed).toEqual(['run']);
  expect(data.answers['map-q1']).toBe('a');
  expect(data.answers['map-q2']).toBeUndefined();
  await page.evaluate(()=>localStorage.clear());
  await page.reload();await expect(page.locator('#xp-top')).toHaveText('0');
  page.once('dialog',d=>d.accept());
  await page.locator('#progress-file').setInputFiles(selectedFile(raw));
  await expect(page.locator('#xp-top')).toHaveText('5');
  await expect(page.locator('#evidence-count')).toContainText('13 pendentes');
  await page.locator('#mission-select').selectOption('map');
  await expect(page.locator('#quiz-bank input[name="map-q1"][value="a"]')).toBeChecked();
  expect(await page.locator('#quiz-bank input[name="map-q2"]:checked').count()).toBe(0);
});
test('JSON inválido, pontuação adulterada e IDs repetidos não apagam progresso existente',async({page})=>{
  await open(page);
  await check(page);
  const code=await page.locator('#code').inputValue();
  const correct=JSON.parse(await saveFile(page));
  const variants=[
    ['não é JSON','sintaxe inválida'],
    [{...correct,schema:'outra-aula-v1'},'não é um progresso'],
    [{...correct,xp:100},'Pontuação inconsistente'],
    [{...correct,completed:['run','run']},'Lista de exercícios inválida'],
    [{...correct,code:''},'não contém código TSX válido']
  ];
  for(const [value,expected] of variants){
    await page.locator('#progress-file').setInputFiles(selectedFile(value));
    await expect(page.locator('#progress-status')).toContainText('Não foi possível retomar');
    await expect(page.locator('#progress-status')).toContainText(expected,{timeout:5000});
    await expect(page.locator('#xp-top')).toHaveText('5');
    await expect(page.locator('#code')).toHaveValue(code);
  }
});
test('cancelar importação conserva todo o progresso atual',async({page})=>{
  await open(page);
  await check(page);
  const old=await saveFile(page);
  await mapQuiz(page);
  await expect(page.locator('#xp-top')).toHaveText('10');
  page.once('dialog',d=>d.dismiss());
  await page.locator('#progress-file').setInputFiles(selectedFile(old));
  await expect(page.locator('#progress-status')).toContainText('Retomada cancelada');
  await expect(page.locator('#xp-top')).toHaveText('10');
  await expect(page.locator('#score-summary')).toContainText('2 de 14');
});
