/** QA do PDF real: HTML A4, texto selecionável e nada além dos XP atuais. */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
async function open(page){
  await page.goto('/index.html');
  await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
}
async function fillRequiredTeam(page){
  await page.locator('#team-open').click();
  await page.locator('#web-team').fill('Equipe Bacuri');
  await page.locator('#web-member-0-name').fill('Marina Sousa');
  await page.locator('#team-done').click();
}
async function printNoModal(page,button){
  await page.evaluate(()=>{const d=document.getElementById('evidence-dialog');if(d.open)d.close();});
  await page.evaluate(()=>{
    window.print=()=>{window.__printCount=(window.__printCount||0)+1;};
  });
  await page.locator(button).click();
  await expect.poll(()=>page.evaluate(()=>window.__printCount||0)).toBeGreaterThan(0);
}
test('modelo A4 tem capa IFMA, identidade, 14 missões, parcial e textos sem Markdown cru',async({page})=>{
  await open(page);
  await page.locator('#mission-select').selectOption('run');
  await page.locator('#guide-check').click();
  await expect(page.locator('#xp-top')).toHaveText('5');
  await page.locator('#evidence-open').click();
  await page.locator('#team-open-evidence').click();
  await page.locator('#web-team').fill('Equipe Ipê');
  await page.locator('#web-member-0-name').fill('Ana Exemplo');
  await page.locator('#web-add-member').click();
  await page.locator('#web-member-1-name').fill('Bia Exemplo');
  await page.locator('#team-done').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.locator('#observacao').fill('Alterei o título da memória.\nComparei as prévias Web e Mobile.');
  await page.locator('#limite-real').fill('Testar no aparelho, com teclado e leitor de tela.');
  await page.locator('[data-close-dialog="evidence-dialog"]').click();
  await printNoModal(page,'#quick-pdf');
  const area=page.locator('#print-report');
  await expect(area).toHaveAttribute('data-report-state','partial');
  await expect(area).toHaveAttribute('data-report-xp','5');
  await expect(area.locator('.doc-cover')).toContainText('INSTITUTO FEDERAL DO MARANHÃO');
  await expect(area.locator('.doc-cover')).toContainText('Campus Itapecuru-Mirim');
  await expect(area.locator('.doc-cover')).toContainText('Equipe Ipê');
  await expect(area.locator('.doc-cover')).toContainText('Ana Exemplo; Bia Exemplo');
  await expect(area.locator('.doc-cover')).not.toContainText('Matrícula');
  await expect(area.locator('.doc-cover')).not.toContainText('Turma');
  await expect(area.locator('.doc-score')).toContainText('5 / 100 XP');
  await expect(area.locator('.doc-score')).toContainText('13 pendentes');
  await expect(area.locator('.doc-mission-row')).toHaveCount(14);
  await expect(area.locator('.doc-cycle-row')).toHaveCount(3);
  await expect(area.locator('.doc-ok')).toHaveCount(1);
  await expect(area.locator('.doc-pending')).toHaveCount(13);
  await expect(area.locator('.doc-answer')).toHaveCount(2);
  await expect(area.locator('.doc-unanswered')).toHaveCount(0);
  const text=await area.textContent();
  expect(text).not.toContain('**');
  expect(text).toContain('Comparei as prévias Web e Mobile.');
  expect(text).toContain('não constitui nota oficial');
  await expect(page.locator('#xp-top')).toHaveText('5');
});
test('Chromium imprime PDF A4 real com texto legível, cores e paginação',async({page})=>{
  await open(page);
  await page.locator('#mission-select').selectOption('run');
  await page.locator('#guide-check').click();
  await expect(page.locator('#xp-top')).toHaveText('5');
  await fillRequiredTeam(page);
  await printNoModal(page,'#quick-pdf');
  await page.emulateMedia({media:'print'});
  const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
  expect(pdf.subarray(0,5).toString()).toBe('%PDF-');
  const dir=join(process.cwd(),'test-artifacts');
  mkdirSync(dir,{recursive:true});
  const target=join(dir,'aula05-parcial-a4.pdf');
  writeFileSync(target,pdf);
  const info=execFileSync('pdfinfo',[target],{encoding:'utf8'});
  const content=execFileSync('pdftotext',['-layout',target,'-'],{encoding:'utf8'});
  const dimensions=info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts \(A4\)/);
  expect(dimensions,'PDF deve ser rotulado como papel A4').not.toBeNull();
  expect(Math.abs(Number(dimensions[1])-595.28)).toBeLessThan(1);
  expect(Math.abs(Number(dimensions[2])-841.89)).toBeLessThan(1);
  const pages=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]||0);
  expect(pages).toBeGreaterThanOrEqual(2);
  expect(pages).toBeLessThanOrEqual(5);
  expect(content).toContain('INSTITUTO FEDERAL DO MARANHÃO');
  expect(content).toContain('Relatório de aprendizagem');
  expect(content).toContain('Equipe Bacuri');
  expect(content).toContain('Marina Sousa');
  expect(content).toMatch(/5\s*\/\s*100\s*XP/);
  expect(content).toContain('Primeiro contato: execute o projeto');
  expect(content).toContain('Explique a ponte Web');
  expect(content).toContain('Não respondido');
  expect(content).not.toContain('**5/100**');
  // Renderizar primeira página para revisão visual posterior, sem dados reais.
  execFileSync('pdftoppm',['-f','1','-l','1','-r','125','-png','-singlefile',
    target,join(dir,'aula05-parcial-capa')],{stdio:'pipe'});
});
test('impressão deixa observações vazias, sem pontuação artificial nem envio ao Google',async({page})=>{
  await open(page);
  await fillRequiredTeam(page);
  await printNoModal(page,'#quick-pdf');
  await expect(page.locator('#print-report')).toHaveAttribute('data-report-xp','0');
  await expect(page.locator('#print-report .doc-ok')).toHaveCount(0);
  await expect(page.locator('#print-report .doc-pending')).toHaveCount(14);
  await expect(page.locator('#print-report .doc-unanswered')).toHaveCount(2);
  await expect(page.locator('#xp-top')).toHaveText('0');
  await expect(page.locator('#web-submit')).toBeEnabled();
  await expect(page.locator('#print-report')).toContainText('não comprova entrega no Google Sheets');
});
test('texto informado aparece literalmente no PDF, sem interpretar HTML ou executar scripts',async({page})=>{
  await open(page);
  await fillRequiredTeam(page);
  await page.locator('#evidence-open').click();
  const raw='<img src=x onerror="alert(1)"> Resultado fictício: á, ã, ç, 🙂.';
  await page.locator('#observacao').fill(raw);
  await page.locator('[data-close-dialog="evidence-dialog"]').click();
  await printNoModal(page,'#quick-pdf');
  const area=page.locator('#print-report');
  await expect(area.locator('.doc-answer')).toContainText(raw);
  await expect(area.locator('img,script,iframe')).toHaveCount(0);
  const before=await page.locator('#xp-top').textContent();
  await printNoModal(page,'#quick-pdf');
  await expect(area.locator('.doc-report')).toHaveCount(1);
  await expect(page.locator('#xp-top')).toHaveText(before);
});

test('não imprime PDF sem equipe e sem sobrenome: mostra alerta e foca primeiro campo inválido',async({page})=>{
  await open(page);
  await page.evaluate(()=>{window.__printCount=0;window.print=()=>window.__printCount++;});
  await page.locator('#quick-pdf').click();
  await expect(page.locator('#team-dialog')).toBeVisible();
  await expect(page.locator('#team-feedback')).toContainText('nome da equipe');
  await expect(page.locator('#web-team')).toBeFocused();
  expect(await page.evaluate(()=>window.__printCount)).toBe(0);
  await page.locator('#web-team').fill('Equipe Ipê');
  await page.locator('#web-member-0-name').fill('Ana');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-feedback')).toContainText('nome e sobrenome');
  await expect(page.locator('#web-member-0-name')).toBeFocused();
  expect(await page.evaluate(()=>window.__printCount)).toBe(0);
  await page.locator('#web-member-0-name').fill('Ana Ferreira');
  await page.locator('#team-done').click();
  await expect(page.locator('#team-dialog')).toBeHidden();
  await printNoModal(page,'#quick-pdf');
  await expect(page.locator('#print-report')).toContainText('Ana Ferreira');
  expect(await page.evaluate(()=>window.__printCount)).toBe(1);
});
