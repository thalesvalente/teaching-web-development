import { test, expect } from '@playwright/test';

const open = async page => {
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado', { timeout: 25000 });
  const frame = page.frameLocator('#preview');
  await expect(frame.locator('#web-root [data-testid="app-universal"]')).toBeVisible();
  await expect(frame.locator('#mobile-root [data-testid="app-universal"]')).toBeVisible();
  return frame;
};

test('fonte TSX renderiza dois aplicativos independentes, com estados e validação reais', async ({ page }) => {
  const frame = await open(page);
  const web = frame.locator('#web-root');
  const mobile = frame.locator('#mobile-root');
  await web.locator('[data-testid="campo-titulo"]').fill('abc');
  await web.locator('[data-testid="botao-registrar"]').click();
  await expect(web.locator('[data-testid="erro-titulo"]')).toBeVisible();
  await expect(web.locator('[data-testid="contador"]')).toHaveText('0');
  await web.locator('[data-testid="campo-titulo"]').fill(' Memória fictícia ');
  await web.locator('[data-testid="botao-registrar"]').click();
  await expect(web.locator('[data-testid="contador"]')).toHaveText('1');
  await expect(web.locator('[data-testid="ultima-memoria"]')).toHaveText('Memória fictícia');
  await expect(mobile.locator('[data-testid="contador"]')).toHaveText('0');
  await mobile.locator('[data-testid="campo-titulo"]').fill('Outra memória');
  await mobile.locator('[data-testid="botao-registrar"]').click();
  await expect(mobile.locator('[data-testid="contador"]')).toHaveText('1');
  await expect(web.locator('[data-testid="contador"]')).toHaveText('1');
});

test('edição real do arquivo modifica as duas prévias, testes e XP', async ({ page }) => {
  await open(page);
  const editor = page.locator('#code');
  const oldSource = await editor.inputValue();
  expect(oldSource).toContain('MINIMO_CARACTERES = 5');
  await page.locator('[data-check="run"]').click();
  await expect(page.locator('#xp-top')).toHaveText('10');
  const updated = oldSource.replace('MINIMO_CARACTERES = 5', 'MINIMO_CARACTERES = 7')
    .replace("TEXTO_BOTAO = 'Registrar memória'", "TEXTO_BOTAO = 'Salvar memória'");
  await editor.fill(updated);
  await expect(page.locator('#xp-top')).toHaveText('0');
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Executado');
  const frame = page.frameLocator('#preview');
  await expect(frame.locator('#web-root [data-testid="botao-registrar"]')).toContainText('Salvar memória');
  await expect(frame.locator('#mobile-root [data-testid="botao-registrar"]')).toContainText('Salvar memória');
  for(const m of ['run','limit','button','behavior']){
    await page.locator(`[data-check="${m}"]`).click();
    await expect(page.locator(`[data-feedback="${m}"]`)).toContainText('Concluído', { timeout: 15000 });
  }
  await expect(page.locator('#xp-top')).toHaveText('80');
  await page.locator('input[name="q1"][value="a"]').check();
  await page.locator('input[name="q2"][value="b"]').check();
  await page.locator('#check-quiz').click();
  await expect(page.locator('#xp-top')).toHaveText('100');
  await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow', '100');
});

test('erros de TSX não ganham pontos; evidência parcial é exportável', async ({ page }) => {
  await open(page);
  const editor=page.locator('#code');
  const source=await editor.inputValue();
  await editor.fill(source.replace('export default function ProjetoUniversal()', 'export default function (' ));
  await page.locator('#run').click();
  await expect(page.locator('#compiler-status')).toContainText('Erro de compilação');
  await expect(page.locator('#xp-top')).toHaveText('0');
  await page.locator('#observacao').fill('Relatório parcial sem resposta obrigatória.');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-json').click()]);
  expect(download.suggestedFilename()).toBe('Aula05_Laboratorio_Evidencia.json');
  const fs=await import('node:fs/promises');
  const payload=JSON.parse(await fs.readFile(await download.path(),'utf-8'));
  expect(payload.xp).toBe(0);
  expect(payload.missoes).toHaveLength(5);
  expect(payload.observacao).toContain('Relatório parcial');
  expect(payload.missoes.every(m => m.estado === 'PENDENTE')).toBe(true);
});

test('responsivo, sem overflow horizontal em tamanhos de tela comuns', async ({ page }) => {
  for(const width of [360,390,768,1280,1600]){
    await page.setViewportSize({width,height:900});
    await open(page);
    const metrics=await page.evaluate(() => ({scroll:document.documentElement.scrollWidth, viewport:window.innerWidth}));
    expect(metrics.scroll,`largura ${width}`).toBeLessThanOrEqual(metrics.viewport + 1);
  }
});
