'use strict';
/** QA isolado para Google Apps Script Web. NÃO acessa planilhas reais. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname,'../integrations/web-appscript/Code.gs'),'utf8');
const TASKS = [
  ['run',5],['map',5],['title',6],['placeholder',6],['limit',12],
  ['maximum',10],['button',7],['error',7],['success',7],['color',6],
  ['trim',8],['invalid',8],['isolation',8],['quiz',5]
];
const HEADERS = {
  '1º Bimestre':['Aluno','Matrícula','Equipe','Média /10'],
  '2º Bimestre':['Aluno','Matrícula','Equipe','Média /10'],
  '3º Bimestre':['Aluno','Matrícula','Equipe','Aula 04 E3-I1 /2,5','Média /10'],
  '4º Bimestre':['Aluno','Matrícula','Equipe','Aula 05 XP formativo /100','Média /10'],
  'Auditoria':['Aluno','Matrícula','Equipe','Atividade','Instrumento',
    'Data/hora BRT','Recebido UTC','ID entrega','SHA-256 evidência',
    'Assinatura HMAC','XP declarado /100','Nota oficial /10',
    'Situação','Rubrica/versão','JSON evidência','Chave interna',
    'Código SHA-256','Origem','Observação docente','Revisado UTC']
};
function blank(rows,n) {
  while(rows.length<n)rows.push([]);
}
class MockSheet {
  constructor(name,headers) {
    this.name=name;this.rows=[headers.slice(),[]];
    // A planilha real tem metadados em V:Y até a linha 6:
    // getLastRow é 6, embora A:T ainda não tenha nenhuma entrega.
    if(name==='Auditoria')this.rows.push([],[],[],[]);
    else this.rows[1][headers.length-1]='=IF(A2="";"";0)';
  }
  getName(){return this.name;}
  getLastRow(){return this.rows.length;}
  getRange(row,column,count=1,width=1){
    const sheet=this;
    function write(matrix){
      blank(sheet.rows,row+matrix.length-1);
      for(let i=0;i<matrix.length;i++){
        for(let k=0;k<matrix[i].length;k++) sheet.rows[row+i-1][column+k-1]=matrix[i][k];
      }
    }
    const read=()=>Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>
      sheet.rows[row+i-1]?.[column+j-1]??''));
    return {
      getDisplayValues(){return read().map(r=>r.map(v=>String(v)));},
      getValues(){return read();},
      getDisplayValue(){return String(read()[0][0]);},
      setValues(matrix){write(matrix);return this;},
      setFormulas(matrix){write(matrix);return this;},
      setValue(value){write([[value]]);return this;},
      setFormula(value){write([[value]]);return this;},
      setNumberFormat(){return this;},
      sort(rules){
        const from=row-1,to=from+count;
        const slice=sheet.rows.slice(from,to);
        slice.sort((a,b)=>{
          for(const v of rules){
            const cmp=String(a[v.column-1]||'').localeCompare(String(b[v.column-1]||''),'pt-BR');
            if(cmp)return v.ascending?cmp:-cmp;
          }
          return 0;
        });
        sheet.rows.splice(from,count,...slice);
        return this;
      }
    };
  }
}
function harness(){
  const tabs=Object.fromEntries(Object.entries(HEADERS).map(([name,headers])=>[name,new MockSheet(name,headers)]));
  const properties=new Map();
  let writes=0,locks=0;
  const book={getSheetByName:n=>tabs[n]||null,getName:()=> 'desenvolvimento-web-2026'};
  const mock={
    PropertiesService:{getScriptProperties:()=>({
      getProperty:k=>properties.get(k)||null,
      setProperty:(k,v)=>properties.set(k,v)
    })},
    SpreadsheetApp:{
      openById: id => {
        assert.equal(id,'1iLx-Tm0EFCsMxqKxbkXAuevJlCzjFAJuRyknbHYlbGM');
        return book;
      },
      flush:()=>{writes++;}
    },
    Utilities:{
      DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
      computeDigest:(algo,s)=>Array.from(crypto.createHash('sha256').update(String(s)).digest(),n=>n>127?n-256:n),
      computeHmacSha256Signature:(s,key)=>Array.from(crypto.createHmac('sha256',key).update(s).digest(),n=>n>127?n-256:n),
      getUuid:()=>crypto.randomUUID(),
      formatDate:(date,timezone,pattern)=>{
        if(pattern==='yyyyMMdd-HHmmss')return date.toISOString().replace(/\D/g,'').slice(0,8)+'-'+date.toISOString().replace(/\D/g,'').slice(8,14);
        return new Intl.DateTimeFormat('sv-SE',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',
          hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date);
      }
    },
    LockService:{getScriptLock:()=>({waitLock:(ms)=>{assert.equal(ms,20000);locks++;},releaseLock:()=>{locks--;}})},
    HtmlService:{
      XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},
      createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}})
    },
    ContentService:{
      MimeType:{TEXT:'TEXT'},
      createTextOutput:text=>({text,setMimeType(){return this;}})
    },
    Logger:{log:()=>{}}
  };
  const context=vm.createContext(mock);
  new vm.Script(source,{filename:'Code.gs'}).runInContext(context);
  const evt=evidence=>({parameter:{nonce:crypto.randomUUID(),payload:JSON.stringify({
    schema:'web-a05-submission-v1',activity:'WEB-AULA05-2026',
    identity:{name:'Ana Exemplo',enrollment:'20260001',team:'Web'},
    evidence
  })}});
  const evidence=(completed=[])=>({
    schema:'ifma-web-aula05-lab-v4',geradoEm:new Date().toISOString(),
    atividade:'Laboratório Vivo',tipo:'formativo-nao-e-nota',
    maximoXp:100,xp:TASKS.filter(([id])=>completed.includes(id)).reduce((sum,entry)=>sum+entry[1],0),
    exercicios:TASKS.map(([id,xp],i)=>({
      id,ciclo:i<4?1:i<10?2:3,titulo:id,
      estado:completed.includes(id)?'APROVADO':'PENDENTE',
      xp:completed.includes(id)?xp:0,maximoXp:xp,comentario:null
    })),
    observacao:'Ajustei o código de exemplo.',testeNativoPendente:'Testar Expo.',
    codigoFonteCompleto:"import React from 'react';\nexport default function App(){return null}"
  });
  return {ctx:context,evt,evidence,tabs,properties,writes:()=>writes,locks:()=>locks};
}
function extract(html){
  const body=typeof html==='string'?html:html?.html;
  assert.equal(typeof body,'string','HtmlService deve retornar HTML legível no mock');
  const hit=body.match(/top\.postMessage\((\{.*\}),"https:\/\/thalesvalente\.github\.io"\)/);
  assert.ok(hit,'Resposta deve usar top.postMessage');
  return JSON.parse(hit[1]);
}

test('Code.gs é JavaScript sintaticamente válido e não reutiliza outras disciplinas',()=>{
  assert.doesNotThrow(()=>new vm.Script(source));
  assert.match(source,/web-entregas-1\.0\.0/);
  assert.doesNotMatch(source,/1z5VEmScYCtfsEGg0AahY3cHE5eYO79Zj0xLMzx4iT0Y/);
  assert.doesNotMatch(source,/1aziGb9eXl5oR6Wz6dDWI7IH9bsINf9Sp7b6nmlT9XqE/);
});
test('pré-flight não grava dados reais e reconhece cinco abas',()=>{
  const h=harness();
  assert.equal(h.ctx.testarConexaoWeb(),'Diagnóstico Web: PASS');
  assert.equal(h.writes(),0);
});
test('recebimento fica bloqueado por padrão, sem falso recibo',()=>{
  const h=harness();
  assert.match(h.ctx.doGet().text,/recebimento bloqueado/);
  const output=extract(h.ctx.doPost(h.evt(h.evidence())));
  assert.equal(output.ok,false);
  assert.match(output.error,/não habilitado/);
  assert.equal(h.writes(),0);
});
test('XP são apenas relato consistente, não nota certificada',()=>{
  const h=harness();
  const value=h.evidence();
  assert.equal(h.ctx.webEvidence(value).xp,0);
  value.xp=100;
  assert.throws(()=>h.ctx.webEvidence(value),/inconsistente/);
  const all=h.evidence(TASKS.map(t=>t[0]));
  assert.equal(h.ctx.webEvidence(all).xp,100);
});
test('valida identificação individual e evita fórmula em equipe',()=>{
  const h=harness();
  assert.throws(()=>h.ctx.webIdentity({name:'Ana',enrollment:'20260001'}),/nome e sobrenome/);
  assert.throws(()=>h.ctx.webIdentity({name:'Ana Exemplo',enrollment:'1'}),/identificador/);
  assert.equal(h.ctx.webSafe('=HYPERLINK("x")').startsWith("'="),true);
});
test('envio autorizado escreve 5 abas, HMAC e preserva nota oficial',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  const received=extract(h.ctx.doPost(h.evt(h.evidence(['run','map']))));
  assert.equal(received.ok,true);
  assert.equal(received.grade,null);
  assert.equal(received.xpReported,10);
  assert.equal(received.status,'RECEBIDO_PENDENTE_VALIDACAO');
  assert.match(received.answersSha256,/^[0-9a-f]{64}$/);
  assert.match(received.codeSha256,/^[0-9a-f]{64}$/);
  assert.match(received.signature,/^[0-9a-f]{64}$/);
  assert.equal(h.properties.get('WEB_RECEIPT_HMAC_SECRET').length,64);
  for(const title of Object.keys(HEADERS).slice(0,4)){
    const sheet=h.tabs[title];
    assert.equal(sheet.rows[1][1],'20260001',title);
    assert.equal(sheet.rows[1][0],'Ana Exemplo',title);
  }
  assert.equal(h.tabs['4º Bimestre'].rows[1][3],10);
  assert.equal(h.tabs['3º Bimestre'].rows[1][3],undefined);
  assert.equal(h.tabs['Auditoria'].rows[1][12],'RECEBIDO_PENDENTE_VALIDACAO');
  assert.equal(h.tabs['Auditoria'].rows[1][11],'');
  assert.equal(h.locks(),0);
});
test('reenvio da mesma matrícula+atividade faz upsert e não altera nota da Aula 04',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  extract(h.ctx.doPost(h.evt(h.evidence(['run']))));
  h.tabs['3º Bimestre'].rows[1][3]=2.5;
  const revised=extract(h.ctx.doPost(h.evt(h.evidence(['run','map','title']))));
  assert.equal(revised.ok,true);
  assert.equal(h.tabs['4º Bimestre'].rows[1][3],16);
  assert.equal(h.tabs['3º Bimestre'].rows[1][3],2.5);
  assert.equal(h.tabs['Auditoria'].rows.slice(1).filter(row=>row[15]).length,1);
  assert.equal(h.tabs['Auditoria'].rows[1][0],'Ana Exemplo');
  assert.equal(h.tabs['Auditoria'].rows[1][10],16);
  assert.equal(h.tabs['Auditoria'].rows[1][11],'');
  assert.equal(h.writes(),2);
});
test('planilha mantém ordem alfabética e identidades distintas não são confundidas',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  let first=h.evt(h.evidence(['run']));first.parameter.payload=first.parameter.payload.replace('Ana Exemplo','Zelia Exemplo').replace('20260001','20260099');
  assert.equal(extract(h.ctx.doPost(first)).ok,true);
  assert.equal(extract(h.ctx.doPost(h.evt(h.evidence()))).ok,true);
  const rows=h.tabs['4º Bimestre'].rows;
  assert.equal(rows.length,3);
  assert.equal(rows[1][0],'Ana Exemplo');
  assert.equal(rows[2][0],'Zelia Exemplo');
  const audit=h.tabs['Auditoria'].rows.slice(1).filter(row=>row[15]);
  assert.equal(audit.length,2);
  assert.equal(audit[0][0],'Ana Exemplo');
  assert.equal(audit[1][0],'Zelia Exemplo');
});
test('payload adulterado, tamanho e versão incompatíveis são recusados',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  const damaged=h.evidence(['run']);damaged.exercicios[0].xp=2;
  assert.equal(extract(h.ctx.doPost(h.evt(damaged))).ok,false);
  const wrong=h.evidence();wrong.schema='another-v1';
  assert.equal(extract(h.ctx.doPost(h.evt(wrong))).ok,false);
  const event=h.evt(h.evidence());event.parameter.payload='x'.repeat(44001);
  assert.equal(extract(h.ctx.doPost(event)).ok,false);
  assert.equal(h.writes(),0);
});
test('retorno neutraliza HTML e registra canal/nonce da própria requisição',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  let e=h.evt(h.evidence());const nonce=e.parameter.nonce;
  const r=extract(h.ctx.doPost(e));
  assert.equal(r.channel,'web-entrega-aula05');
  assert.equal(r.nonce,nonce);
  assert.equal(h.ctx.webSafe('-1+1'),"'-1+1");
});

test('Hash do TSX preserva espaços e quebra de linha exatamente como enviados',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  const e=h.evidence(['run']);
  e.codigoFonteCompleto='  \n'+e.codigoFonteCompleto+'\n\n ';
  const receipt=extract(h.ctx.doPost(h.evt(e)));
  assert.equal(receipt.ok,true);
  const expected=crypto.createHash('sha256').update(e.codigoFonteCompleto,'utf8').digest('hex');
  assert.equal(receipt.codeSha256,expected);
  const saved=JSON.parse(h.tabs['Auditoria'].rows[1][14]);
  assert.equal(saved.codigoFonteCompleto,e.codigoFonteCompleto);
});
test('Metadados V:Y não causam lacunas na Auditoria durante dois envios',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  const first=extract(h.ctx.doPost(h.evt(h.evidence())));
  assert.equal(first.ok,true);
  const second=h.evt(h.evidence(['run']));
  const payload=JSON.parse(second.parameter.payload);
  payload.identity.name='Zelia Exemplo';
  payload.identity.enrollment='20260099';
  second.parameter.payload=JSON.stringify(payload);
  assert.equal(extract(h.ctx.doPost(second)).ok,true);
  const audit=h.tabs['Auditoria'].rows;
  assert.equal(audit.length,6,'Metadados laterais definem a linha 6, não a última entrega');
  assert.equal(audit[1][0],'Ana Exemplo');
  assert.equal(audit[2][0],'Zelia Exemplo');
  assert.equal(audit[3][0],undefined);
});
test('Auditoria com linha vazia entre entregas interrompe gravação em vez de corromper revisão',()=>{
  const h=harness();h.properties.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  h.tabs['Auditoria'].rows[1][15]='20260099|WEB-AULA05-2026';
  h.tabs['Auditoria'].rows[3][15]='20260098|WEB-AULA05-2026';
  const reply=extract(h.ctx.doPost(h.evt(h.evidence())));
  assert.equal(reply.ok,false);
  assert.match(reply.error,/Auditoria com lacunas/);
});
