import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { resolve } from 'node:path';

const get = name => readFileSync(resolve(name),'utf8');
test('arquivo universal completo parseia como TSX', () => {
  const source=get('shared/ProjetoUniversal.tsx');
  const tree=ts.createSourceFile('ProjetoUniversal.tsx',source,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
  assert.equal(tree.parseDiagnostics.length,0);
  for(const part of ['useState','onChangeText','onPress','validarTitulo','export default','StyleSheet.create','MINIMO_CARACTERES']) assert.ok(source.includes(part));
});
test('sandbox separa a origem do código editado da aplicação principal', () => {
  const host=get('index.html');
  assert.match(host,/sandbox="allow-scripts"/);
  assert.doesNotMatch(host,/allow-same-origin/);
  assert.match(get('preview.js'),/Importação não permitida/);
});
test('cinco missões, pontuação 100 XP e distinção da nota', () => {
  const source=get('lab.js');
  const points=[...source.matchAll(/xp: (\d+), name:/g)].map(x=>Number(x[1]));
  assert.deepEqual(points,[10,25,20,25,20]);
  assert.equal(points.reduce((s,x)=>s+x,0),100);
  assert.match(get('index.html'),/não nota oficial/);
  assert.match(get('docs/EXPO-REAL.md'),/NÃO é emulador/);
});
