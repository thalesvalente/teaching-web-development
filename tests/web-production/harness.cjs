'use strict';
// Double de serviço local. NÃO conecta ao Google e NÃO é prova remota do Apps Script.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../integrations/web-appscript-production/Code.gs'),'utf8');
const SOURCE_ID='1cPQD_ie3cEqt11fLXT398DPQIi5bnqkmTqfl9yk8a_Q';
const TEAM_ID='a54a0500-2026-4000-8000-000000000001';
const TASKS=[['run',5],['map',5],['title',6],['placeholder',6],['limit',12],['maximum',10],['button',7],['error',7],['success',7],['color',6],['trim',8],['invalid',8],['isolation',8],['quiz',5]];
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(options={}){
  const p=new Map([['WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','true'],['WEB_NOTAS_PROD_HMAC_SECRET','test-only-secret-'.repeat(5)]]);
  p.set('WEB_NOTAS_PROD_ADMIN_EMAIL','owner@example.test');
  p.set('WEB_NOTAS_PROD_SECURITY_READY','true');
  const cache=new Map();
  let model={},batches=0,locks=0,reads=0,failMode='',captured=[];
  const utilities={DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
    computeDigest:(a,v)=>[...crypto.createHash('sha256').update(String(v)).digest()],
    computeHmacSha256Signature:(v,k)=>[...crypto.createHmac('sha256',k).update(String(v)).digest()],
    getUuid:()=>crypto.randomUUID(),
    formatDate:(d,t,f)=>f==='yyyyMMdd-HHmmss'?d.toISOString().replace(/\D/g,'').slice(0,8)+'-'+d.toISOString().replace(/\D/g,'').slice(8,14):
      new Intl.DateTimeFormat('sv-SE',{timeZone:t,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(d)};
  function effective(c,row,sheet){
    const v=c?.userEnteredValue||{};
    if(v.formulaValue){
      const f=v.formulaValue;
      if(f.includes('AVERAGE(')){
        const vals=sheet.cells[row]||[],col=vals.indexOf(c),name=vals[0]?.userEnteredValue?.stringValue;
        if(!name)return {stringValue:''};
        const nums=vals.slice(3,col).map(x=>x?.userEnteredValue?.numberValue).filter(x=>typeof x==='number');
        return nums.length?{numberValue:Math.round((nums.reduce((a,b)=>a+b,0)/nums.length+Number.EPSILON)*100)/100}:{stringValue:''};
      }
      return {stringValue:''};
    }
    return v;
  }
  function state(titles){return {spreadsheetId:SOURCE_ID,sheets:titles.map(t=>{
    const s=model[t];return {properties:{sheetId:s.id,title:t,gridProperties:{rowCount:s.rowCount,columnCount:s.columnCount}},
      data:[{rowData:s.cells.map((r,i)=>({values:r.map(c=>c?{userEnteredValue:c.userEnteredValue,effectiveValue:effective(c,i,s)}:{})}))}]};})};}
  function add(title,id,rows){model[title]={id,rowCount:1000,columnCount:title==='Auditoria'?28:title==='Alunos'?8:title==='Resultados'?10:title==='Equipes'?16:26,cells:rows.map(r=>r.map(v=>
    v===null||v===undefined||v===''?{}:{userEnteredValue:typeof v==='number'?{numberValue:v}:typeof v==='boolean'?{boolValue:v}:{stringValue:v}}))};}
  function shiftFormula(f,offset){return f.replace(/\$A(\d+)/g,(_,n)=>'$A'+(+n+offset)).replace(/\$D(\d+)/g,(_,n)=>'$D'+(+n+offset))
    .replace(/INDEX\((\d+):(\d+);/g,(_,a,b)=>'INDEX('+(+a+offset)+':'+(+b+offset)+';');}
  function applyBatch(body){
    batches++;captured.push(clone(body));
    if(failMode==='before')throw Error('PRIVATE_FAKE_NETWORK_ERROR');
    const next=clone(model);
    for(const req of body.requests){
      if(req.insertDimension){const d=req.insertDimension.range,s=Object.values(next).find(x=>x.id===d.sheetId);
        for(const r of s.cells)r.splice(d.startIndex,0,...Array.from({length:d.endIndex-d.startIndex},()=>({})));
        s.columnCount+=d.endIndex-d.startIndex;continue;}
      if(req.setDataValidation)continue;
      if(req.repeatCell){const x=req.repeatCell,s=Object.values(next).find(y=>y.id===x.range.sheetId);
        for(let i=x.range.startRowIndex;i<x.range.endRowIndex;i++){
          s.cells[i]??=[];
          for(let j=x.range.startColumnIndex;j<x.range.endColumnIndex;j++){
            const c=clone(x.cell);if(c.userEnteredValue?.formulaValue)c.userEnteredValue.formulaValue=shiftFormula(c.userEnteredValue.formulaValue,i-x.range.startRowIndex);
            s.cells[i][j]=c;
          }
        }continue;}
      if(!req.updateCells)throw Error('unsupported test request');
      const u=req.updateCells,s=Object.values(next).find(x=>x.id===u.start.sheetId);
      if(!s)throw Error('sheet not found');
      for(let i=0;i<u.rows.length;i++){
        let r=u.start.rowIndex+i;if(r>=s.rowCount)throw Error('out of bounds');
        s.cells[r]??=[];
        for(let j=0;j<u.rows[i].values.length;j++){
          let c=u.start.columnIndex+j;if(c>=s.columnCount)throw Error('out of bounds');
          if(failMode==='drop-team'&&s===next.Equipes&&c===6)continue;
          s.cells[r][c]=clone(u.rows[i].values[j]);
        }
      }
    }
    model=next;
    if(failMode==='after')throw Error('PRIVATE_TIMEOUT_AFTER_COMMIT');
    return {spreadsheetId:SOURCE_ID,replies:body.requests.map(()=>({}))};
  }
  const ctx=vm.createContext({console,Utilities:utilities,
    Session:{getActiveUser:()=>({getEmail:()=>options.activeEmail===undefined?'owner@example.test':options.activeEmail}),
      getEffectiveUser:()=>({getEmail:()=>options.effectiveEmail===undefined?'owner@example.test':options.effectiveEmail})},
    CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)})},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>p.has(k)?p.get(k):null,setProperty:(k,v)=>p.set(k,v)})},
    LockService:{getScriptLock:()=>({waitLock(){if(failMode==='lock')throw Error('PRIVATE_LOCK');locks++;},releaseLock(){locks--;}})},
    HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}})},
    ContentService:{MimeType:{TEXT:'text/plain'},createTextOutput:text=>({text,setMimeType(){return this;}})},
    Sheets:{Spreadsheets:{get(id,options){reads++;if(id!==SOURCE_ID)throw Error('unexpected id');
      if(failMode==='read')throw Error('PRIVATE_READ_FAILURE');
      if(!options.includeGridData)return {spreadsheetId:id,sheets:Object.entries(model).map(([title,s])=>({properties:{sheetId:s.id,title,gridProperties:{rowCount:s.rowCount,columnCount:s.columnCount}}}))};
      const titles=options.ranges.map(r=>r.match(/^'((?:[^']|'')+)'!/)[1].replace(/''/g,"'"));return state(titles);},batchUpdate:applyBatch}}
  });
  new vm.Script(source,{filename:'Code.gs'}).runInContext(ctx);
  // Test-only access to lexical helpers. NEVER copy these aliases into Apps Script.
  const internal=ctx.WEB_V3_PRIVATE_;
  if(options.exposeInternals!==false)for(const [name,value]of Object.entries(internal))if(!(name in ctx))ctx[name]=value;

  for(let n=1;n<=4;n++)add(n+'º Bimestre',100+n,[['Aluno','Matrícula','Equipe',...(n===3?['Aula 04 E3-I1 /10']:n===4?['Aula 05 /10']:[]),'Média /10']]);
  add('Auditoria',200,[Array.from(internal.AU_HEADERS)]);add('Equipes',201,[Array.from(internal.T_HEADERS)]);add('Alunos',203,[Array.from(internal.A_HEADERS)]);add('Resultados',204,[Array.from(internal.R_HEADERS)]);
  add('Atividades',202,[Array.from(internal.ACT_HEADERS),['WEB-AULA04-E3-I1-2026','Aula 04 E3-I1',3,'Aula 04 E3-I1 /10','manual',false],
    ['WEB-AULA05-2026','Aula 05',4,'Aula 05 /10','web-a05-submission-v2',true]]);
  const identity=()=>({team:'Equipe QA Alfa',teamId:TEAM_ID,members:[{name:'Ana Teste Ficticio',enrollment:'00001234'},{name:'Bruno Teste Ficticio',enrollment:'00005678'}]});
  const evidence=(approved=[])=>({schema:'ifma-web-aula05-lab-v4',tipo:'formativo-nao-e-nota',maximoXp:100,
    xp:TASKS.filter(t=>approved.includes(t[0])).reduce((a,t)=>a+t[1],0),exercicios:TASKS.map(([id,maximoXp])=>({id,maximoXp,xp:approved.includes(id)?maximoXp:0,estado:approved.includes(id)?'APROVADO':'PENDENTE',comentario:''})),
    observacao:'TESTE FICTÍCIO',testeNativoPendente:'',codigoFonteCompleto:'\n export default function App(){return null;}\n'});
  function event(approved=[],ident=identity()) {return {parameter:{nonce:crypto.randomUUID(),payload:JSON.stringify({environment:'PROD',schema:'web-a05-submission-v2',activity:'WEB-AULA05-2026',identity:ident,evidence:evidence(approved)})}};}
  function parsed(event){return JSON.parse(event.parameter.payload);}
  function receive(e){const r=ctx.doPost(e);const m=r.html.match(/top\.postMessage\((\{.*\}),"https:\/\/thalesvalente.github.io"\)/);if(!m)throw Error(r.html);return JSON.parse(m[1]);}
  function value(title,r,c){return effective(model[title].cells[r-1]?.[c-1],r-1,model[title]).numberValue??effective(model[title].cells[r-1]?.[c-1],r-1,model[title]).stringValue??effective(model[title].cells[r-1]?.[c-1],r-1,model[title]).boolValue??'';}
  function set(title,r,c,v,formula=false){model[title].cells[r-1]??=[];model[title].cells[r-1][c-1]=formula?{userEnteredValue:{formulaValue:v}}:
    v===null?{}:{userEnteredValue:typeof v==='number'?{numberValue:v}:typeof v==='boolean'?{boolValue:v}:{stringValue:v}};}
  function configureY(bim=4){const spec={id:'WEB-ATIVIDADE-Y-2026',name:'Atividade Y',bim,header:'Atividade Y /10',contract:'web-notas-submission-v3',enabled:true};return ctx.cadastrarAtividadeNotasV3(spec);}
  function eventY(grade,bim=4,ident=identity()){return {parameter:{nonce:crypto.randomUUID(),payload:JSON.stringify({environment:'PROD',schema:'web-notas-submission-v3',activity:'WEB-ATIVIDADE-Y-2026',identity:ident,evidence:{schema:'web-notas-evidencia-v3',nota:grade,maximoNota:10,observacao:'QA'}})}};}
  return {ctx,props:p,cache,identity,evidence,event,receive,parsed,set,value,configureY,eventY,
    state:()=>clone(model),snapshot:()=>JSON.stringify(model),batches:()=>batches,locks:()=>locks,reads:()=>reads,captured:()=>clone(captured),
    session:(active,effective)=>{options.activeEmail=active;options.effectiveEmail=effective;},mode:v=>{failMode=v},model:()=>model,add};
}
module.exports={fixture,TASKS,TEAM_ID,source,clone};
