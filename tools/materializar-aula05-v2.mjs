/** Fonte canônica v2, transporte por SHA-256. Não modifica projetos estudantis. */
import { readFileSync,writeFileSync,renameSync,existsSync,lstatSync } from 'node:fs';
import { resolve,dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';
const root=resolve(import.meta.dirname,'..');
const targetRoot=resolve(root,'lessons/aula-05-laboratorio-web-mobile');
const expected='5c6478817b702414268298d90979cfa1852d89b5e5ad1492ad743b4422f9589c';
const allowed=["README.md","index.html","lab.js","preview.html","preview.js","style.css","shared/ProjetoUniversal.tsx","docs/GUIA_ALUNO.md","docs/QA.md","docs/ROTEIRO-DOCENTE.md","tests/source.test.mjs","tests/lab.spec.mjs"];
const encoded=Array.from({length:8},(_,i)=>readFileSync(resolve(root,'tools/aula05-v2-transfer/part-'+String(i+1).padStart(2,'0')+'.txt'),'ascii').trim()).join('');
if(encoded.length!==43188 || !/^[A-Za-z0-9+/]+=*$/.test(encoded))throw Error('Falha na transferência Base64.');
const compressed=Buffer.from(encoded,'base64');
if(createHash('sha256').update(compressed).digest('hex')!==expected)throw Error('SHA-256 inválido; abortado sem alterações.');
const manifest=JSON.parse(brotliDecompressSync(compressed,{maxOutputLength:512*1024}).toString('utf8'));
if(manifest.schema!==2 || JSON.stringify(Object.keys(manifest.files).sort())!==JSON.stringify([...allowed].sort()))throw Error('Manifesto de arquivos inesperado.');
for(const [path,value] of Object.entries(manifest.files)){
  if(typeof value!=='string' || Buffer.byteLength(value)>100000 || posix.isAbsolute(path) || path.includes('\\') || path.split('/').some(x=>!x||x==='..'||x==='.'))throw Error('Fonte ou caminho inválido: '+path);
  const destination=resolve(targetRoot,path);
  if(!destination.startsWith(targetRoot+'/'))throw Error('Destino externo bloqueado.');
  for(let parent=destination; parent.startsWith(targetRoot) && parent!==root;parent=dirname(parent)){
    if(existsSync(parent) && lstatSync(parent).isSymbolicLink())throw Error('Caminho simbólico bloqueado: '+path);
    if(parent===targetRoot)break;
  }
  if(!existsSync(dirname(destination)))throw Error('Diretório destino ausente: '+path);
}
for(const [path,value] of Object.entries(manifest.files)){
  const destination=resolve(targetRoot,path);
  const temp=destination+'.aula05-v2-temporary';
  if(existsSync(temp))throw Error('Arquivo temporário preexistente: '+temp);
  writeFileSync(temp,value,{encoding:'utf8',flag:'wx'});
  renameSync(temp,destination);
}
console.log('Aula05 v2 materializada: '+allowed.length+' arquivos. Nenhuma Aula 1–4 ou projeto Mobile alterado.');
