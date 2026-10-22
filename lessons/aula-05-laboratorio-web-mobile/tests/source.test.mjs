/** Verificações estruturais da Aula 05 v3: bancada sem navegação vertical. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('shared/ProjetoUniversal.tsx');
const ui = read('lab.js');
const html = read('index.html');
const css = read('style.css');

test('código de referência continua completo, didaticamente comentado e sintaticamente válido', () => {
  const file = ts.createSourceFile('ProjetoUniversal.tsx',source,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
  assert.deepEqual(file.parseDiagnostics.map(x=>x.messageText),[]);
  for(const section of ['IMPORTAÇÕES','CONFIGURAÇÕES','REGRA DE NEGÓCIO','COMPONENTE','AÇÃO DO USUÁRIO','INTERFACE','ESTILOS']) {
    assert.ok(source.includes(section),`Bloco ausente: ${section}`);
  }
  for(let i=1;i<=7;i++) assert.match(source,new RegExp(`\\[${String(i).padStart(2,'0')}\\]`));
  for(const needle of ['useState','onChangeText','onPress','validarTitulo','export default','StyleSheet.create','MINIMO_CARACTERES','MAXIMO_CARACTERES','accessibilityLabel','testID']) assert.ok(source.includes(needle));
});

test('14 missões únicas, 3 ciclos, 100 XP e localizações que existem no código integral', () => {
  const tasks=[...ui.matchAll(/\{ id: '([\w-]+)', xp: (\d+), name: '[^']+', phase: (\d+), minutes: (\d+),/g)];
  assert.equal(tasks.length,14);
  assert.equal(new Set(tasks.map(t=>t[1])).size,14);
  assert.equal(tasks.reduce((a,t)=>a+Number(t[2]),0),100);
  assert.deepEqual(tasks.map(t=>Number(t[3])).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{}),{1:4,2:6,3:4});
  assert.equal(tasks.reduce((a,t)=>a+Number(t[4]),0),100);
  const targets=[...ui.matchAll(/focus: '([^']+)'/g)].map(x=>x[1]);
  assert.equal(targets.length,14);
  for(const target of targets) assert.ok(source.includes(target),`Seção não localizável: ${target}`);
});

test('cada instrução, ação, teste e feedback existe no mesmo painel de missão', () => {
  const aside=html.match(/<aside class="mission-panel"[\s\S]*?<\/aside>/)?.[0];
  assert.ok(aside,'Painel contextual não encontrado');
  for(const id of ['guide-do','guide-observe','guide-why','guide-line','guide-hint','guide-locate','guide-check','run','guide-feedback','mission-select','guide-prev','guide-next','quiz-bank']) {
    assert.ok(aside.includes(`id="${id}"`),`Controle ${id} está fora da missão`);
  }
  assert.doesNotMatch(html,/id="desafios"|class="challenge-grid"|id="chapter-list"/);
  assert.doesNotMatch(ui,/scrollIntoView|challenge-card|data-feedback=/);
  assert.match(css,/html,body\{[^}]*overflow:hidden/);
  assert.match(css,/\.mission-copy\{[^}]*overflow-y:auto/);
  assert.match(css,/\.source-container\{[^}]*flex:1/);
});

test('questões ficam no painel atual, e as prévias são isoladas e reais', () => {
  assert.match(ui,/quizBank\.append\(group\)/);
  assert.match(ui,/quizBank\.hidden = !needsQuiz/);
  assert.match(html,/sandbox="allow-scripts"/);
  assert.doesNotMatch(html,/allow-same-origin/);
  const preview=read('preview.js');
  assert.match(preview,/Importação não permitida/);
  assert.match(preview,/name === 'react-native'/);
  assert.match(preview,/createRoot/);
  assert.doesNotMatch(html,/https?:\/\/(?:unpkg|cdn\.jsdelivr|esm\.sh)\./);
});

test('alternância por viewport preserva duas prévias e localização de linha sem rolamento de documento', () => {
  assert.match(html,/data-pane="code"/);
  assert.match(html,/data-pane="preview"/);
  assert.match(ui,/setPane\('code'\)/);
  assert.match(ui,/setPane\('preview'\)/);
  assert.match(ui,/codeEditor\.scrollTop/);
  assert.doesNotMatch(ui,/window\.scrollTo|scrollIntoView/);
  assert.match(css,/@media\(max-width:710px\)/);
  assert.match(css,/\.lab-grid\[data-pane="preview"\] \.code-panel\{display:none\}/);
});

test('rascunho preservado e evidências parciais acessíveis por janela local', () => {
  assert.match(ui,/ifma-web-aula05-lab-v2/);
  assert.match(ui,/ifma-web-aula05-lab-v1/);
  assert.match(ui,/ifma-web-aula05-lab-v3/);
  assert.match(ui,/delete completedDetail\[task\.id\]/);
  assert.match(ui,/if \(task\.type === 'quiz'\) continue/);
  assert.match(ui,/exercicios: tasks\.map/);
  assert.match(ui,/PENDENTE/);
  assert.match(ui,/window\.print\(\)/);
  for(const id of ['export-json','export-md','print','evidence-dialog','help-dialog']) assert.ok(html.includes(`id="${id}"`));
});

test('documentação conserva orientações Expo nativo, extensão e 100 minutos de ensino', () => {
  assert.match(read('docs/EXPO-REAL.md'),/NÃO é emulador/);
  assert.match(read('docs/ROTEIRO-DOCENTE.md'),/100 minutos/);
  assert.match(read('README.md'),/14|quatorze/);
});
