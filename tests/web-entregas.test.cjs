'use strict';
/** QA de backend Google Apps Script 1.1.0 — inteiramente mockado; nenhum POST real. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../integrations/web-appscript/Code.gs'),'utf8');
const ID='c58b7ae0-8538-4e66-9c3d-6db56e239f4e';
const ID2='c58b7ae0-8538-4e66-9c3d-6db56e239f4f';
const TASKS=[
  ['run',5],['map',5],['title',6],['placeholder',6],['limit',12],
  ['maximum',10],['button',7],['error',7],['success',7],['color',6],
  ['trim',8],['invalid',8],['isolation',8],['quiz',5]
];
const HEADERS={
  '1º Bimestre':['Aluno','ID equipe (automático)','Equipe','Média /10'],
  '2º Bimestre':['Aluno','ID equipe (automático)','Equipe','Média /10'],
  '3º Bimestre':['Aluno','ID equipe (automático)','Equipe','Aula 04 E3-I1 /2,5','Média /10'],
  '4º Bimestre':['Aluno','ID equipe (automático)','Equipe','Aula 05 XP formativo /100','Média /10'],
  'Auditoria':['Equipe','ID equipe (automático)','Integrantes (nomes)','Atividade','Instrumento',
    'Data/hora BRT','Recebido UTC','ID entrega','SHA-256 evidência','Assinatura HMAC',
    'XP declarado /100','Nota oficial /10','Situação','Rubrica/versão','JSON evidência',
    'Chave interna','Código SHA-256','Origem','Observação docente','Revisado UTC',
    'Lista de integrantes da equipe'],
  'Equipes':['Equipe','Integrantes (nomes)','Quantidade','Atividade',
    'XP formativo /100','Situação','Recibo','Enviado UTC','Chave da equipe',
    'SHA-256 evidência','Observação docente','Revisado UTC']
};
function ensureRows(rows,count){while(rows.length<count)rows.push([]);}
class Sheet {
  constructor(name,headers){
    this.name=name;this.rows=[headers.slice(),[]];
    if(name==='Auditoria')this.rows.push([],[],[],[]);
    else if(name!=='Equipes')this.rows[1][headers.length-1]='=IF(A2="";"";0)';
  }
  getName(){return this.name;}
  getLastRow(){return this.rows.length;}
  getRange(row,col,height=1,width=1){
    const sheet=this;
    const read=()=>Array.from({length:height},(_,i)=>Array.from(
      {length:width},(_,j)=>sheet.rows[row+i-1]?.[col+j-1]??''));
    const write=matrix=>{
      ensureRows(sheet.rows,row+matrix.length-1);
      for(let i=0;i<matrix.length;i++)
        for(let j=0;j<matrix[i].length;j++)
          sheet.rows[row+i-1][col+j-1]=matrix[i][j];
    };
    return {
      getDisplayValues:()=>read().map(r=>r.map(String)),
      getDisplayValue:()=>String(read()[0][0]),
      getValues:read,
      setValues(matrix){write(matrix);return this;},
      setFormulas(matrix){write(matrix);return this;},
      setValue(value){write([[value]]);return this;},
      setFormula(value){write([[value]]);return this;},
      setNumberFormat(){return this;},
      sort(rules){
        const slice=sheet.rows.slice(row-1,row+height-1);
        slice.sort((a,b)=>{
          for(const rule of rules){
            const diff=String(a[rule.column-1]||'').localeCompare(
              String(b[rule.column-1]||''),'pt-BR');
            if(diff)return rule.ascending?diff:-diff;
          }
          return 0;
        });
        sheet.rows.splice(row-1,height,...slice);
        return this;
      }
    };
  }
}
function fixture(){
  const tabs=Object.fromEntries(Object.entries(HEADERS).map(([name,headers])=>
    [name,new Sheet(name,headers)]));
  const props=new Map();
  const book={getSheetByName:name=>tabs[name]||null,getName:()=>'desenvolvimento-web-2026'};
  let flushes=0,locks=0;
  const fake={
    PropertiesService:{getScriptProperties:()=>({
      getProperty:key=>props.get(key)||null,
      setProperty:(key,value)=>props.set(key,value)
    })},
    SpreadsheetApp:{
      openById:key=>{
        assert.equal(key,'1iLx-Tm0EFCsMxqKxbkXAuevJlCzjFAJuRyknbHYlbGM');
        return book;
      },
      flush:()=>{flushes++;}
    },
    Utilities:{
      DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
      computeDigest:(algo,s)=>Array.from(
        crypto.createHash('sha256').update(String(s)).digest(),n=>n>127?n-256:n),
      computeHmacSha256Signature:(s,key)=>Array.from(
        crypto.createHmac('sha256',key).update(s).digest(),n=>n>127?n-256:n),
      getUuid:()=>crypto.randomUUID(),
      formatDate:(date,tz,pattern)=>pattern==='yyyyMMdd-HHmmss'
        ?date.toISOString().replace(/\D/g,'').slice(0,8)+'-'+
         date.toISOString().replace(/\D/g,'').slice(8,14)
        :new Intl.DateTimeFormat('sv-SE',{timeZone:tz,year:'numeric',month:'2-digit',
          day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date)
    },
    LockService:{getScriptLock:()=>({
      waitLock:ms=>{assert.equal(ms,20000);locks++;},
      releaseLock:()=>{locks--;}
    })},
    HtmlService:{
      XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},
      createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}})
    },
    ContentService:{MimeType:{TEXT:'TEXT'},createTextOutput:text=>({text,setMimeType(){return this;}})},
    Logger:{log:()=>{}}
  };
  const ctx=vm.createContext(fake);
  new vm.Script(source,{filename:'Code.gs'}).runInContext(ctx);
  const identity=(teamId=ID,members=['Ana Exemplo','Bia Exemplo'],team='Equipe Ipê')=>({
    teamId,team,members:members.map(name=>({name}))
  });
  const evidence=(approved=[])=>({
    schema:'ifma-web-aula05-lab-v4',tipo:'formativo-nao-e-nota',maximoXp:100,
    xp:TASKS.filter(t=>approved.includes(t[0])).reduce((n,t)=>n+t[1],0),
    exercicios:TASKS.map(([id,maximoXp])=>({
      id,estado:approved.includes(id)?'APROVADO':'PENDENTE',
      xp:approved.includes(id)?maximoXp:0,maximoXp
    })),
    observacao:'Testes com dados fictícios.',testeNativoPendente:'',
    codigoFonteCompleto:'  \nexport default function App(){return null;}\n'
  });
  const evt=(e=evidence(),ident=identity())=>({parameter:{
    nonce:crypto.randomUUID(),
    payload:JSON.stringify({schema:'web-a05-submission-v1',
      activity:'WEB-AULA05-2026',identity:ident,evidence:e})
  }});
  const records=(tab,keyCol)=>tabs[tab].rows.slice(1).filter(row=>String(row[keyCol]||'').trim());
  return {ctx,tabs,props,identity,evidence,evt,records,
    flushes:()=>flushes,locks:()=>locks};
}
function receipt(response){
  const html=typeof response==='string'?response:response?.html;
  assert.equal(typeof html,'string');
  const match=html.match(/top\.postMessage\((\{.*\}),"https:\/\/thalesvalente\.github\.io"\)/);
  assert.ok(match,'Recibo deve ter top.postMessage');
  return JSON.parse(match[1]);
}
function enabled(f){f.props.set('WEB_WEB_SUBMISSIONS_ENABLED','true');}
test('Code.gs V8 1.1.0 valida contrato de 6 abas sem scripts Mobile/PPI',()=>{
  assert.doesNotThrow(()=>new vm.Script(source));
  assert.match(source,/web-entregas-1\.1\.0/);
  assert.equal(Object.keys(HEADERS).length,6);
  assert.doesNotMatch(source,/1z5VEmScYCtfsEGg0AahY3cHE5eYO79Zj0xLMzx4iT0Y/);
});
test('prepararIntegracaoWeb confere seis abas, é idempotente e começa bloqueado',()=>{
  const f=fixture();
  assert.match(f.ctx.prepararIntegracaoWeb(),/WEB_SETUP_PASS/);
  assert.match(f.ctx.prepararIntegracaoWeb(),/6 abas/);
  assert.equal(f.props.get('WEB_WEB_SUBMISSIONS_ENABLED'),'false');
  assert.equal(f.flushes(),0);
  assert.equal(f.ctx.testarConexaoWeb(),'Diagnóstico Web: PASS');
  assert.equal(f.flushes(),0);
});
test('doPost bloqueado por padrão não grava linha e devolve erro do servidor',()=>{
  const f=fixture(),r=receipt(f.ctx.doPost(f.evt()));
  assert.equal(r.ok,false);
  assert.match(r.error,/não habilitado/);
  assert.equal(f.flushes(),0);
});
test('identificação aceita somente equipe e nomes completos sem matrícula ou turma',()=>{
  const f=fixture();
  const group=f.ctx.webIdentity(f.identity());
  assert.equal(group.team,'Equipe Ipê');
  assert.equal(group.members.length,2);
  assert.ok(!('enrollment' in group));
  assert.ok(!('classGroup' in group));
  assert.throws(()=>f.ctx.webIdentity({team:'Ipê',members:[{name:'Ana Exemplo'}]}),/identificador/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['Ana'])),/nome e sobrenome/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['Ana B'])),/nome e sobrenome/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['Ana B-C'])),/nome e sobrenome/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['A-B C-D'])),/nome e sobrenome/);
  assert.equal(f.ctx.webIdentity(f.identity(ID,['Ana de Souza'])).members[0].name,'Ana de Souza');
  assert.equal(f.ctx.webIdentity(f.identity(ID,["João D'Ávila"])).members[0].name,"João D'Ávila");
  assert.equal(f.ctx.webIdentity(f.identity(ID,["Ana O'Connor"])).members[0].name,"Ana O'Connor");
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['Ana C-D'])),/nome e sobrenome/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,["Ana O'Connor","Ana O’Connor"])),/repetido/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,['Ana Exemplo','Ána  Exemplo'])),/repetido/);
  assert.throws(()=>f.ctx.webIdentity(f.identity(ID,Array.from({length:9},(_,i)=>'Integrante Número '+i))),/oito/);
  assert.equal(f.ctx.webSafe('=HYPERLINK("x")').startsWith("'="),true);
});
test('XP relatados são consistentes e não constituem nota',()=>{
  const f=fixture(),e=f.evidence();
  assert.equal(f.ctx.webEvidence(e).xp,0);
  e.xp=10;assert.throws(()=>f.ctx.webEvidence(e),/inconsistente/);
  assert.equal(f.ctx.webEvidence(f.evidence(TASKS.map(t=>t[0]))).xp,100);
});
test('uma entrega grava 2 integrantes em 4 bimestres, uma Equipes e uma Auditoria',()=>{
  const f=fixture();enabled(f);
  const r=receipt(f.ctx.doPost(f.evt(f.evidence(['run','map']))));
  assert.equal(r.ok,true);
  assert.equal(r.xpReported,10);
  assert.equal(r.grade,null);
  assert.equal(r.teamId,ID);
  assert.equal(r.memberCount,2);
  assert.equal(r.instrument,'laboratorio-vivo-tsx-equipe');
  assert.equal(r.status,'RECEBIDO_PENDENTE_VALIDACAO');
  assert.match(r.signature,/^[0-9a-f]{64}$/);
  assert.match(r.codeSha256,/^[0-9a-f]{64}$/);
  for(const tab of Object.keys(HEADERS).slice(0,4)){
    const members=f.records(tab,1);
    assert.equal(members.length,2,tab);
    assert.deepEqual(members.map(row=>row[0]),['Ana Exemplo','Bia Exemplo']);
    assert.ok(members.every(row=>row[1]===ID && row[2]==='Equipe Ipê'));
  }
  const members=f.records('4º Bimestre',1);
  assert.ok(members.every(row=>row[3]===10));
  assert.ok(f.records('3º Bimestre',1).every(row=>row[3]===undefined));
  const audit=f.records('Auditoria',15);
  assert.equal(audit.length,1);
  assert.equal(audit[0][0],'Equipe Ipê');
  assert.equal(audit[0][2],'Ana Exemplo; Bia Exemplo');
  assert.equal(audit[0][20],'Ana Exemplo; Bia Exemplo');
  assert.equal(audit[0][11],'');
  const team=f.records('Equipes',8);
  assert.equal(team.length,1);
  assert.equal(team[0][0],'Equipe Ipê');
  assert.equal(team[0][1],'Ana Exemplo; Bia Exemplo');
  assert.equal(team[0][2],2);
  assert.equal(team[0][4],10);
  assert.equal(f.locks(),0);
});
test('reenvio da mesma equipe é idempotente e preserva nota e revisão docente',()=>{
  const f=fixture();enabled(f);
  assert.equal(receipt(f.ctx.doPost(f.evt(f.evidence(['run'])))).ok,true);
  const grades=f.records('3º Bimestre',1);
  grades[0][3]=2.5; // editar a referência ao array original, como professor
  const audit=f.records('Auditoria',15);
  audit[0][18]='Observação do professor';
  const team=f.records('Equipes',8);
  team[0][10]='Revisão da equipe';
  const r=receipt(f.ctx.doPost(f.evt(f.evidence(['run','map','title']))));
  assert.equal(r.ok,true);
  assert.equal(r.xpReported,16);
  assert.equal(f.records('Equipes',8).length,1);
  assert.equal(f.records('Auditoria',15).length,1);
  assert.equal(f.records('4º Bimestre',1).length,2);
  assert.ok(f.records('4º Bimestre',1).every(row=>row[3]===16));
  assert.equal(f.records('3º Bimestre',1)[0][3],2.5);
  assert.equal(f.records('Auditoria',15)[0][18],'Observação do professor');
  assert.equal(f.records('Equipes',8)[0][10],'Revisão da equipe');
  assert.equal(f.flushes(),4); // read-after-write da aba Equipes em cada POST
});
test('equipes distintas com um mesmo nome não se confundem por causa do ID automático',()=>{
  const f=fixture();enabled(f);
  const first=f.identity(ID,['Ana Exemplo','Bia Exemplo'],'Equipe Ipê');
  const second=f.identity(ID2,['Ana Exemplo','Caio Exemplo'],'Equipe Cedro');
  assert.equal(receipt(f.ctx.doPost(f.evt(f.evidence(['run']),first))).ok,true);
  assert.equal(receipt(f.ctx.doPost(f.evt(f.evidence(['run']),second))).ok,true);
  assert.equal(f.records('Equipes',8).length,2);
  assert.equal(f.records('Auditoria',15).length,2);
  assert.equal(f.records('4º Bimestre',1).length,4);
  assert.deepEqual(f.records('4º Bimestre',1).map(row=>row[0]),
    ['Ana Exemplo','Ana Exemplo','Bia Exemplo','Caio Exemplo']);
});
test('hash do TSX preserva bytes de espaços e quebras de linha',()=>{
  const f=fixture();enabled(f);const e=f.evidence();
  const r=receipt(f.ctx.doPost(f.evt(e)));
  assert.equal(r.codeSha256,crypto.createHash('sha256')
    .update(e.codigoFonteCompleto,'utf8').digest('hex'));
  assert.equal(JSON.parse(f.records('Auditoria',15)[0][14]).codigoFonteCompleto,e.codigoFonteCompleto);
});
test('entradas adulteradas e tamanho excessivo são recusados sem criar linhas',()=>{
  const f=fixture();enabled(f);
  const invalid=f.evidence(['run']);invalid.exercicios[0].xp=20;
  assert.equal(receipt(f.ctx.doPost(f.evt(invalid))).ok,false);
  const bad=f.evt();bad.parameter.payload='x'.repeat(44001);
  assert.equal(receipt(f.ctx.doPost(bad)).ok,false);
  assert.equal(f.flushes(),0);
});
test('Auditoria com lacunas rejeita gravação, sem misturar equipes',()=>{
  const f=fixture();enabled(f);
  f.tabs.Auditoria.rows[1][15]='LEGADO|WEB-AULA05-2026';
  f.tabs.Auditoria.rows[3][15]='OUTRO|WEB-AULA05-2026';
  const r=receipt(f.ctx.doPost(f.evt()));
  assert.equal(r.ok,false);
  assert.match(r.error,/Auditoria com lacunas/);
});
test('preparação do script só ativa recepção quando docente a habilita',()=>{
  const f=fixture();
  assert.match(f.ctx.prepararIntegracaoWeb(),/recebimento BLOQUEADO/);
  f.props.set('WEB_WEB_SUBMISSIONS_ENABLED','true');
  assert.match(f.ctx.prepararIntegracaoWeb(),/recebimento HABILITADO/);
  f.props.set('WEB_WEB_SUBMISSIONS_ENABLED','liberar');
  assert.throws(()=>f.ctx.prepararIntegracaoWeb(),/literalmente true ou false/);
});
test('script vinculado a outra planilha é rejeitado antes de receber dados',()=>{
  const f=fixture();
  f.ctx.SpreadsheetApp.getActiveSpreadsheet=()=>({getId:()=> 'OUTRA-PLANILHA'});
  assert.throws(()=>f.ctx.prepararIntegracaoWeb(),/planilha errada/);
  assert.equal(f.props.get('WEB_WEB_SUBMISSIONS_ENABLED'),undefined);
});
test('diagnóstico da integração é somente leitura',()=>{
  const f=fixture();
  assert.match(f.ctx.statusIntegracaoWeb(),/WEB_STATUS_OK/);
  assert.match(f.ctx.statusIntegracaoWeb(),/recebimento BLOQUEADO/);
  assert.equal(f.flushes(),0);
});
test('manifesto Apps Script usa V8 e fuso Fortaleza',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,
    '../integrations/web-appscript/appsscript.json'),'utf8'));
  assert.equal(manifest.runtimeVersion,'V8');
  assert.equal(manifest.timeZone,'America/Fortaleza');
});
