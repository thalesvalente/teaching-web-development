'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../lessons/aula-05-laboratorio-web-mobile');
test('P2: lab.js e módulos de identidade usam a mesma revisão nova de cache',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const name of ['lab.js','equipe.js','equipe-roster.js','roster-client.js','report-print.js','entrega-appscript.js']){
  const re=new RegExp('src="\\./'+name.replace('.','\\.')+'\\?v=web-mobile-ux-02"','g');
  assert.equal((html.match(re)||[]).length,1,name);
 }
 assert.ok(!html.includes('lab.js?v=20261023-qa02'));
});
test('Formulário não sobrepõe diálogo ao campo conflitante e mostra aviso docente',()=>{
 const s=fs.readFileSync(path.join(root,'entrega-appscript.js'),'utf8');
 assert.match(s,/submittedMember:member/);assert.match(s,/receipt\.teacherReviewRequired/);
 assert.match(s,/ATIVIDADE ENCERRADA/);
});
