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
  assert.match(ui,/ifma-web-aula05-lab-v4/);
  assert.match(ui,/function markCodeForReview/);
  assert.doesNotMatch(ui,/passed\[task\.id\]\s*=\s*false/);
  assert.match(ui,/function startReview/);
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


test('regra visual e accessibilityHint reutilizam literalmente a mesma orientação dinâmica', () => {
  assert.match(source, /const orientacao = `Digite de \$\{MINIMO_CARACTERES\} a \$\{MAXIMO_CARACTERES\} caracteres/);
  assert.match(source, /accessibilityHint=\{orientacao\}/);
  assert.match(source, /testID="ajuda-titulo"[\s\S]*?\{orientacao\}/);
  assert.match(source, /testID="contador-caracteres"[\s\S]*?titulo\.trim\(\)\.length/);
  assert.match(source, /placeholder=\{DICA_CAMPO\}/);
  assert.match(source, /ajudaCampo: \{/);
});

test('Laboratório Vivo contextualiza conceitos, ações e testes sem descartar rascunhos', () => {
  assert.match(html, /Laboratório Vivo/);
  for (const id of ['guide-concept', 'guide-test', 'migration-note']) assert.ok(html.includes('id="' + id + '"'));
  assert.match(ui, /const tutorial = \{/);
  assert.match(ui, /ifma-web-aula05-lab-v4/);
  assert.match(ui, /ifma-web-aula05-lab-v2/);
  assert.match(ui, /Baixar meu código anterior/);
  assert.match(html, /accessibilityHint/);
  assert.match(css, /\.key-concept\{/);
  assert.match(css, /\.mission-test\{/);
  assert.match(css, /\.glossary\{/);
});

test('XP acumulativos sobrevivem à edição, ao rerun e à reprovação posterior', () => {
  const preview = read('preview.js');
  for (const token of ['reviewPending','sourceRevision','runSequence','CHECKED_ALL']) {
    assert.ok(ui.includes(token), 'Mecanismo de progresso ausente: ' + token);
  }
  assert.match(ui, /if \(data\.ok === true\) \{\s*passed\[id\] = true/);
  assert.doesNotMatch(ui, /passed\[id\]\s*=\s*!!data\.ok/);
  assert.match(ui, /XP conquistados não desaparecem/);
  assert.match(preview, /const codeStages = Object\.freeze/);
  assert.match(preview, /msg\.type === 'CHECK_ALL'/);
  for(const id of ['review-xp','review-xp-dialog','review-status']) {
    assert.ok(html.includes('id="' + id + '"'), 'Controle de progresso ausente: ' + id);
  }
});


test('Aula 05 exige matrícula no envio e preserva PDF local com nomes',()=>{
  const teamJs=read('equipe.js');
  const delivery=read('entrega-appscript.js');
  const pdf=read('report-print.js');
  for(const id of ['web-team','web-members','web-add-member','team-open','team-dialog']) {
    assert.ok(html.includes('id="'+id+'"'), 'Campo coletivo ausente: '+id);
  }
  assert.doesNotMatch(html,/id="web-student-id"|id="web-class"/);
  assert.match(teamJs,/function getIdentity\(options=/);
  assert.match(teamJs,/teamId:newId\(\)/);
  assert.match(teamJs,/MAX=8/);
  assert.match(delivery,/web-a05-submission-v2/);\n  assert.match(teamJs,/member\.enrollment/);\n  assert.match(teamJs,/web-member-.*-enrollment/);\n  assert.match(html,/Matrícula|matrícula/);
  assert.match(delivery,/teamIdentity\(\)/);
  assert.match(delivery,/laboratorio-vivo-tsx-equipe/);
  assert.match(html,/id="quick-pdf"[^>]*>Gerar PDF e Enviar/);
  assert.match(html,/id="web-submit"[^>]*>\s*Gerar PDF e Enviar/);
  assert.match(ui,/requireIdentity/);
  assert.match(ui,/READY_ACK/);
  assert.match(read('preview.js'),/announceReady/);
  assert.match(teamJs,/requireIdentity/);
  assert.match(delivery,/ENVIO CONFIRMADO/);
  assert.match(ui,/team: window\.WebTeam\?\.snapshot\(\)/);
  assert.match(ui,/WebTeam\?\.restore\(savedTeam\)/);
  assert.match(pdf,/Integrantes \(nomes\)/);
  assert.doesNotMatch(pdf,/infoRow\(metadata,'Matrícula'/);
});
