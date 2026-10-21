/** Materializa fontes autorais da Aula 05 somente no diretório novo. */
import { readFileSync, mkdirSync, writeFileSync, existsSync, lstatSync } from 'node:fs';
import { resolve, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';
const root=resolve(import.meta.dirname,'..');
const lesson='lessons/aula-05-laboratorio-web-mobile';
const expected='9779b11bf2ec961d7a021c0fc751b3e5695f72383fe1a712028eb166df87b462';
const names=['README.md','docs/EXPO-REAL.md','docs/QA.md','docs/ROTEIRO-DOCENTE.md','index.html','lab.js','package.json','playwright.config.mjs','preview.html','preview.js','scripts-build.mjs','shared/ProjetoUniversal.tsx','src/vendor-entry.js','style.css','tests/lab.spec.mjs','tests/source.test.mjs','tsconfig.json'];
const encoded=Array.from({length:5},(_,i)=>readFileSync(resolve(root,'tools/aula05-source.part-'+String(i+1).padStart(2,'0')),'ascii').trim()).join('');
if(encoded.length>40000)throw Error('Carga maior do que o limite.');
const compressed=Buffer.from(encoded,'base64');
if(createHash('sha256').update(compressed).digest('hex')!==expected)throw Error('Hash incompatível; abortado.');
const decoded=brotliDecompressSync(compressed,{maxOutputLength:200000});
const manifest=JSON.parse(decoded.toString('utf8'));
if(manifest.schema!==1||JSON.stringify(Object.keys(manifest.files).sort())!==JSON.stringify([...names].sort()))throw Error('Manifesto incompatível.');
for(const [relative,content] of Object.entries(manifest.files)){
 if(typeof content!=='string'||Buffer.byteLength(content)>100000||posix.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(p=>p===''||p==='.'||p==='..')) throw Error('Caminho ou tamanho inválido.');
 const target=resolve(root,lesson,relative);
 if(!target.startsWith(resolve(root,lesson)+'/'))throw Error('Caminho externo negado.');
 if(existsSync(target))throw Error('Arquivo já existente; não sobrescrever: '+relative);
}
for(const [relative,content] of Object.entries(manifest.files)){
 const target=resolve(root,lesson,relative);
 mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,content,'utf8');
}
console.log('OK: '+names.length+' fontes materializadas em '+lesson+'; nenhum projeto estudantil alterado.');
