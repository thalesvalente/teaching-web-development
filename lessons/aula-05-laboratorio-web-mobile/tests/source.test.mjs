/** Testes estruturais: requisitos verificáveis da Aula 05 comentada (v2). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('shared/ProjetoUniversal.tsx');
const ui = read('lab.js');
const html = read('index.html');

test('fonte TSX completa e comentada possui sete blocos e nenhum erro sintático', () => {
  const file = ts.createSourceFile('ProjetoUniversal.tsx', source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  assert.deepEqual(file.parseDiagnostics.map(x => x.messageText), []);
  for (const section of ['IMPORTAÇÕES','CONFIGURAÇÕES','REGRA DE NEGÓCIO','COMPONENTE','AÇÃO DO USUÁRIO','INTERFACE','ESTILOS']) {
    assert.ok(source.includes(section), `Bloco didático ausente: ${section}`);
  }
  for (let i=1; i<=7; i++) assert.match(source, new RegExp(`\\[${String(i).padStart(2, '0')}\\]`));
  for (const needle of ['useState','onChangeText','onPress','validarTitulo','export default','StyleSheet.create','MINIMO_CARACTERES','MAXIMO_CARACTERES','accessibilityLabel','testID']) {
    assert.ok(source.includes(needle), `Recurso esperado ausente: ${needle}`);
  }
});

test('14 missões únicas, sete seções de código localizáveis, 3 ciclos e 100 XP', () => {
  const entries = [...ui.matchAll(/\{ id: '([\w-]+)', xp: (\d+), name: '[^']+', phase: (\d+), minutes: (\d+),/g)];
  assert.equal(entries.length, 14);
  assert.equal(new Set(entries.map(x => x[1])).size, 14);
  assert.equal(entries.reduce((sum,x)=>sum+Number(x[2]),0), 100);
  assert.deepEqual(entries.map(x=>Number(x[3])).reduce((a,p)=>(a[p]=(a[p]||0)+1,a),{}),{1:4,2:6,3:4});
  assert.equal(entries.reduce((sum,x)=>sum+Number(x[4]),0),100);
  assert.ok(ui.includes('index >= 8 ?'), 'Oito essenciais e seis optativos');
  const focuses = [...ui.matchAll(/focus: '([^']+)'/g)].map(x=>x[1]);
  assert.equal(focuses.length,14);
  for(const target of focuses) assert.ok(source.includes(target), `Guia não consegue localizar: ${target}`);
  for(const needle of ['guide-locate','guide-next','guide-prev','guide-hint','guide-check','guide-feedback']) assert.ok(html.includes(`id="${needle}`));
});

test('origem opaca, importações controladas e saída formativa sem envio automático', () => {
  assert.match(html, /sandbox="allow-scripts"/);
  assert.doesNotMatch(html, /allow-same-origin/);
  const preview = read('preview.js');
  assert.match(preview, /Importação não permitida/);
  assert.match(preview, /name === 'react-native'/);
  assert.doesNotMatch(html, /https?:\/\/(?:unpkg|cdn\.jsdelivr|esm\.sh)\./);
  assert.match(ui,/formativo-nao-e-nota/);
  assert.match(ui,/testeNativoPendente/);
  assert.match(html,/emulador nativo/);
  assert.match(read('docs/EXPO-REAL.md'), /NÃO é emulador/);
});

test('exportação parcial, rascunho v2 separado do v1 e pontuação invalidada por edição', () => {
  assert.match(ui,/ifma-web-aula05-lab-v2/);
  assert.match(ui,/ifma-web-aula05-lab-v1/);
  assert.match(ui,/delete completedDetail\[task\.id\]/);
  assert.match(ui,/if \(task\.type === 'quiz'\) continue/);
  assert.match(ui,/codigoFonteCompleto/);
  assert.match(ui,/exercicios: tasks\.map/);
  assert.match(ui,/PENDENTE/);
  assert.match(ui,/window\.print\(\)/);
  assert.match(html,/id="export-json"/);
  assert.match(html,/id="export-md"/);
  assert.match(html,/id="print"/);
});

test('docs pedagógicos explicam arquivo inteiro, ritmo e distinção Web versus Mobile', () => {
  const guide = read('docs/GUIA_ALUNO.md');
  const teacher = read('docs/ROTEIRO-DOCENTE.md');
  assert.match(guide,/14/);
  assert.match(guide,/\[01\]/);
  assert.match(teacher,/100 minutos/);
  assert.match(teacher,/opcional|extensão/i);
  assert.match(teacher,/avaliação E3-I1/);
  assert.match(read('README.md'), /14|quatorze/);
});
