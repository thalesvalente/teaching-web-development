/** QA do laboratório v3: a missão, a execução e o resultado estão juntos. */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

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

test('editar invalida só XP técnicos, sem apagar respostas conceituais',async({page})=>{
  await open(page);
  await checkCode(page,'run');
  await answer(page,'map');
  await expect(page.locator('#xp-top')).toHaveText('10');
  const editor=page.locator('#code');
  await editor.fill((await editor.inputValue())+'\n// alteração sem quebrar sintaxe');
  await expect(page.locator('#xp-top')).toHaveText('5');
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

test('smartphone: missão e ações sempre próximas, sem rolagem vertical da página',async({page})=>{
  for(const width of [360,390,430]){
    await page.setViewportSize({width,height:844});
    await open(page);
    await mission(page,'limit');
    for(const id of ['#guide-title','#run','#guide-check','#mission-select','#view-code','#view-preview']){
      const r=await page.locator(id).boundingBox();
      expect(r,`Sem retângulo: ${id} em ${width}`).not.toBeNull();
      expect(r.y+r.height,`${id} fora da tela em ${width}`).toBeLessThanOrEqual(845);
    }
    const dims=await page.evaluate(()=>({scrollY:document.scrollingElement.scrollHeight,clientY:innerHeight,scrollX:document.documentElement.scrollWidth,clientX:innerWidth}));
    expect(dims.scrollY,`Rolagem vertical da página em ${width}`).toBeLessThanOrEqual(dims.clientY+1);
    expect(dims.scrollX,`Rolagem horizontal da página em ${width}`).toBeLessThanOrEqual(dims.clientX+1);
    await page.locator('#view-code').click();
    await expect(page.locator('#code-panel')).toBeVisible();
    await page.locator('#guide-locate').click();
    const selected=await page.locator('#code').evaluate(el=>el.value.slice(el.selectionStart,el.selectionEnd));
    expect(selected).toBe('export const MINIMO_CARACTERES');
    await page.locator('#view-preview').click();
    await expect(page.locator('#result-panel')).toBeVisible();
    await expect(page.locator('#guide-title')).toContainText('limite mínimo');
  }
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
  await expect(page.locator('#migration-note')).toBeVisible();
  const editor=await page.locator('#code').inputValue();
  expect(editor).toContain('testID="ajuda-titulo"');
  expect(editor).not.toContain('MINIMO_CARACTERES = 9');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#legacy-export').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Rascunho_v3_Backup.tsx');
  expect(await readFile(await download.path(),'utf8')).toBe(prior);
});


test('atalhos de PDF e salvar/retomar aparecem no cabeçalho e no diálogo',async({page})=>{
  await open(page);
  for(const id of ['save-progress','load-progress','quick-pdf']) await expect(page.locator('#'+id)).toBeVisible();
  await page.locator('#evidence-open').click();
  for(const id of ['dialog-save-progress','dialog-load-progress','dialog-pdf']) await expect(page.locator('#'+id)).toBeVisible();
  await expect(page.locator('#evidence-dialog')).toContainText('mesmo com exercícios pendentes');
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
  await page.locator('#quick-pdf').click();
  const report=await page.evaluate(()=>window.__printed);
  expect(report).toContain('5/100');
  expect(report).toContain('13 de 14');
  expect(report).toContain('PENDENTE');
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
