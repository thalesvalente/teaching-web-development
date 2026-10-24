/** V3.0.2: only HTTP handlers and authenticated administrative facades are public.
 * Helpers live inside a closure; no secret, store or signature helper is a top-level RPC.
 * Do not reintroduce top-level aliases from test harnesses in this project.
 */
var WEB_V3_PRIVATE_ = (function(){
/**
 * WEB-A05-ID-03 — 3.0.2 CANDIDATA QA, NÃO IMPLANTADA.
 * SOMENTE Desenvolvimento Web. Destino fixo: NOVA CÓPIA V3 sintética.
 * SEM identificação real de estudantes, SEM servidor público habilitado.
 * Matrícula como texto; conflitos de identidade sem divulgação de terceiros.
 * Lock + UMA chamada Sheets.Spreadsheets.batchUpdate + readback.
 * A equipe não define identidade. O cadastro do aluno é global à disciplina.
 */
var WEB_CFG=Object.freeze({
  spreadsheetId:'1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE',
  version:'web-notas-3.0.2-candidata',activity:'WEB-AULA05-2026',
  schema:'ifma-web-aula05-lab-v4',channel:'web-entrega-aula05',
  origin:'https://thalesvalente.github.io',maxPayloadChars:44000,maxRows:10000
});
var WEB_TASKS=Object.freeze([
  ['run',5],['map',5],['title',6],['placeholder',6],['limit',12],
  ['maximum',10],['button',7],['error',7],['success',7],['color',6],
  ['trim',8],['invalid',8],['isolation',8],['quiz',5]
]);
var NOTAS_STATUS='RECEBIDO_PENDENTE_VALIDACAO';
var A_HEADERS=Object.freeze(['Matrícula','Nome completo','Nome normalizado','Estado de validação','Fonte docente','Atualização UTC','Homônimo liberado','Observação docente']);
var R_HEADERS=Object.freeze(['Matrícula','Atividade','Maior nota /10','Recibo vencedor','Equipe vencedora','Atualização UTC','Estado docente','Nome no registro','SHA-256 vencedor','Último recibo']);
var T_HEADERS=Object.freeze(['Equipe','Integrantes (nomes)','Quantidade','Atividade','Maior nota da equipe /10','Situação','Recibo vencedor','Enviado UTC','Chave da equipe','SHA-256 evidência','Observação docente','Revisado UTC','Recibo último envio','Último envio UTC','Matrículas JSON','Contrato']);
var AU_HEADERS=Object.freeze([
  'Equipe','ID equipe (automático)','Integrantes (nomes)','Atividade','Instrumento',
  'Data/hora BRT','Recebido UTC','ID entrega','SHA-256 evidência','Assinatura HMAC',
  'Nota recebida /10','Nota oficial /10','Situação','Rubrica/versão','JSON evidência sem XP',
  'Chave interna','Código SHA-256','Origem','Observação docente','Revisado UTC',
  'Lista de integrantes da equipe','SHA-256 armazenado','Nonce SHA-256','Requisição SHA-256',
  'Tipo registro','Integrantes JSON','Contrato','Pendência docente'
]);
var ACT_HEADERS=Object.freeze(['ID atividade','Nome','Bimestre','Cabeçalho da nota','Contrato entrada','Habilitada']);
function webFail(message) {
  var error=new Error(message);error.webPublic=true;throw error;
}

function webText(value, max, label) {
  if (typeof value !== 'string' || value.length > max ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value))
    webFail('Campo inválido: ' + label);
  return value.trim();
}
/** Não altera bytes de TSX: o SHA-256 do cliente deve bater com o servidor. */
function webCode(value) {
  if (typeof value !== 'string' || value.length > 30000 ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value))
    webFail('Campo inválido: arquivo TSX');
  if (!value.trim()) webFail('Código TSX ausente.');
  return value;
}
function webSafe(value) {
  var str = String(value === null || value === undefined ? '' : value).trim();
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}
function webNormalized(value) {
  return String(value || '').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLowerCase();
}
function webEvidence(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    webFail('Evidência ausente.');
  if (value.schema !== WEB_CFG.schema || value.tipo !== 'formativo-nao-e-nota' ||
      value.maximoXp !== 100 || !Number.isSafeInteger(value.xp))
    webFail('Versão ou pontuação de origem incompatível.');
  if (!Array.isArray(value.exercicios) || value.exercicios.length !== WEB_TASKS.length)
    webFail('Quantidade de exercícios incompatível.');
  var reported = 0, clean=[];
  WEB_TASKS.forEach(function(task,index){
    var ex=value.exercicios[index];
    if (!ex || typeof ex !== 'object' || ex.id !== task[0] ||
        ex.maximoXp !== task[1] ||
        !['APROVADO','PENDENTE'].includes(ex.estado) ||
        ex.xp !== (ex.estado === 'APROVADO' ? task[1] : 0))
      webFail('Resultado declarado inválido na missão '+(index+1)+'.');
    reported += ex.xp;
    clean.push({
      id:task[0],estado:ex.estado,xp:ex.xp,maximoXp:task[1],
      comentario: typeof ex.comentario === 'string' ? webText(ex.comentario,280,'comentário') : ''
    });
  });
  if (reported !== value.xp || reported < 0 || reported > 100)
    webFail('XP declarado inconsistente.');
  // A verificação acima valida apenas a CONSISTÊNCIA do relato; ela NÃO
  // executa o código do estudante nem comprova a autoria/nota.
  var source=webCode(value.codigoFonteCompleto); // Preserva whitespace e hash byte a byte.
  var observation=webText(value.observacao || '',2000,'observação');
  var nativeNote=webText(value.testeNativoPendente || '',1000,'teste nativo');
  return {
    schema:WEB_CFG.schema, tipo:'formativo-nao-e-nota',
    xp:reported,maximoXp:100,exercicios:clean,
    observacao:observation,testeNativoPendente:nativeNote,
    codigoFonteCompleto:source
  };
}
function webHex(bytes) {
  return bytes.map(function(b){return ('0'+(b<0?b+256:b).toString(16)).slice(-2);}).join('');
}
function webSha256(text) {
  return webHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8));
}

function notasAssert(condition, message) { if(!condition)webFail(message); }
function notasBlank(value) { return value==='' || value===null || value===undefined; }
function notasGrade(value, label) {
  notasAssert(typeof value==='number' && Number.isFinite(value) && value>=0 && value<=10,
    'Nota inválida (0 a 10): '+(label||'atividade')+'.');
  return value;
}
function notasMax(previous, received) {
  notasGrade(received);
  return notasBlank(previous)?received:Math.max(notasGrade(previous,'anterior'),received);
}
function notasMean(values) {
  var nums=values.filter(function(v){return !notasBlank(v);}).map(function(v){return notasGrade(v);});
  if(!nums.length)return '';
  return Math.round((nums.reduce(function(a,b){return a+b;},0)/nums.length+Number.EPSILON)*100)/100;
}

function notasErr(code, memberIndex, field, message, action) {
  var e=new Error(message);e.publicCode=code;e.memberIndex=memberIndex;
  e.field=field;e.action=action||'Confira os dados e procure o professor.';e.webPublic=true;throw e;
}
function notasFullName(name) {
  if(typeof name!=='string'||name.length>100)return false;
  var s=name.trim();return s.length>=5 && /^[\p{L}\p{M}'’\-\s]+$/u.test(s) &&
    s.split(/\s+/).length>=2 && s.split(/\s+/).every(function(part){
      return /^[\p{L}][\p{L}\p{M}'’\-]*$/u.test(part) &&
        part.split(/[-'’]/).every(function(x){return x.length>0;}) &&
        part.split(/[-'’]/).some(function(x){return (x.match(/\p{L}/gu)||[]).length>=2;});
    });
}
function notasEnrollment(value, i) {
  if(typeof value!=='string'||!value.trim())
    notasErr('MATRICULA_OBRIGATORIA',i,'enrollment','Matrícula obrigatória para envio online.','Informe a matrícula institucional do integrante '+(i+1)+'.');
  var s=value.trim();
  // QA: somente caracteres numéricos ASCII, 1 a 32; NÃO afirma comprimento institucional.
  // Produção BLOQUEADA até validação do formato SUAP/autenticação.
  if(s.length>32||!/^\d+$/.test(s))
    notasErr('MATRICULA_FORMATO_INVALIDO',i,'enrollment','Matrícula deve conter somente algarismos, preservando zeros iniciais.','Confira a matrícula diretamente no SUAP.');
  return s;
}
function webIdentity(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))webFail('Identificação ausente.');
  var team=webText(input.team,80,'equipe'),teamId=webText(input.teamId,36,'ID técnico');
  notasAssert(team.length>=3,'Nome da equipe incompleto.');
  notasAssert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId),'Identificador técnico inválido.');
  notasAssert(Array.isArray(input.members)&&input.members.length>=1&&input.members.length<=8,'Informe entre 1 e 8 integrantes.');
  var seenEnrollment=Object.create(null),seenNames=Object.create(null);
  var members=input.members.map(function(m,i){
    if(!m||typeof m!=='object'||Array.isArray(m))webFail('Integrante '+(i+1)+' inválido.');
    var name=webText(m.name,100,'nome do integrante '+(i+1));
    if(!notasFullName(name))notasErr('NOME_COMPLETO_INVALIDO',i,'name','Informe nome completo e sobrenome.','Corrija o nome do integrante '+(i+1)+'.');
    var enrollment=notasEnrollment(m.enrollment,i),norm=webNormalized(name);
    if(Object.prototype.hasOwnProperty.call(seenEnrollment,enrollment))
      notasErr('MATRICULA_DUPLICADA_EQUIPE',i,'enrollment','Matrícula repetida nos integrantes '+(seenEnrollment[enrollment]+1)+' e '+(i+1)+'.','Cada integrante precisa informar sua própria matrícula.');
    if(Object.prototype.hasOwnProperty.call(seenNames,norm))
      notasErr('NOME_DUPLICADO_EQUIPE',i,'name','Nome repetido nos integrantes '+(seenNames[norm]+1)+' e '+(i+1)+'.','Confirme se os integrantes são pessoas distintas.');
    seenEnrollment[enrollment]=i;seenNames[norm]=i;
    return {name:name,enrollment:enrollment};
  });
  return {team:team,teamId:teamId,members:members};
}
function notasAverageFormula(row, count) {
  if(!count)return '=IF($A'+row+'="";"";"")';
  return '=IF($A'+row+'="";"";IF(COUNT($D'+row+':INDEX('+row+':'+row+';1;COLUMN()-1))=0;"";ROUND(AVERAGE($D'+row+':INDEX('+row+':'+row+';1;COLUMN()-1));2)))';
}
function notasConfig() {
  var p=PropertiesService.getScriptProperties();
  var id=p.getProperty('WEB_NOTAS_V3_SPREADSHEET_ID')||WEB_CFG.spreadsheetId;
  notasAssert(id===WEB_CFG.spreadsheetId,'Este receptor V3 só permite a cópia QA V3.');
  var mode=p.getProperty('WEB_NOTAS_V3_MODE')||'QA';
  notasAssert(mode==='QA','Produção V3 não autorizada.');
  return {id:id,mode:mode,enabled:p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true'&&p.getProperty('WEB_NOTAS_V3_SECURITY_READY')==='true'};
}
function notasSecret() {
  var s=PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_V3_HMAC_SECRET');
  notasAssert(typeof s==='string'&&s.length>=48,'Preparação V3 pendente.');return s;
}
function notasSign(text){return webHex(Utilities.computeHmacSha256Signature(String(text),notasSecret()));}
function notasNoXpKeys(value){return !value||typeof value!=='object'||Object.keys(value).every(function(k){return !/^(xp|maximoXp|xpReported)$/i.test(k)&&notasNoXpKeys(value[k]);});}
function notasIdentityAllowed(identity,config){
  if(config.mode!=='QA')webFail('Ambiente inválido.');
  var allowed={'ana teste ficticio':true,'bruno teste ficticio':true,'carla teste ficticio':true};
  notasAssert(/^Equipe QA(?: |$)/.test(identity.team),'QA aceita somente equipes fictícias com prefixo Equipe QA.');
  identity.members.forEach(function(m){notasAssert(allowed[webNormalized(m.name)],'QA aceita somente integrantes fictícios explicitamente autorizados.');});
}
function notasNormalize(payload){
  notasAssert(payload&&typeof payload==='object'&&!Array.isArray(payload),'Payload inválido.');
  var identity=webIdentity(payload.identity),contract=payload.schema,evidence,grade,original;
  notasAssert(typeof payload.activity==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(payload.activity),'Atividade inválida.');
  if(contract==='web-a05-submission-v2'){
    notasAssert(payload.activity===WEB_CFG.activity,'Contrato A05 exclusivo de Aula 05.');
    original=webEvidence(payload.evidence);grade=original.xp/10;
    evidence={schema:'web-notas-evidencia-v3',sourceSchema:original.schema,nota:grade,maximoNota:10,
      exercicios:original.exercicios.map(function(t){return{id:t.id,estado:t.estado,comentario:t.comentario};}),
      observacao:original.observacao,testeNativoPendente:original.testeNativoPendente,
      codigoFonteCompleto:original.codigoFonteCompleto};
  }else if(contract==='web-notas-submission-v3'){
    var x=payload.evidence;
    notasAssert(x&&typeof x==='object'&&!Array.isArray(x)&&x.schema==='web-notas-evidencia-v3'&&x.maximoNota===10&&notasNoXpKeys(x),'Contrato de notas inválido.');
    grade=notasGrade(x.nota);original=x;
    evidence={schema:'web-notas-evidencia-v3',nota:grade,maximoNota:10,
      observacao:webText(x.observacao||'',2000,'observação'),
      codigoFonteCompleto:typeof x.codigoFonteCompleto==='string'&&x.codigoFonteCompleto.length?webCode(x.codigoFonteCompleto):''};
  }else webFail('Contrato V3 não suportado.');
  notasGrade(grade);notasAssert(notasNoXpKeys(evidence),'Não persistir XP na evidência.');
  var evidenceJson=JSON.stringify(evidence),code=evidence.codigoFonteCompleto;
  return {identity:identity,contract:contract,activity:payload.activity,evidence:evidence,
    evidenceJson:evidenceJson,grade:grade,storedHash:webSha256(evidenceJson),originalHash:webSha256(JSON.stringify(original)),
    codeHash:webSha256(code),requestHash:webSha256(JSON.stringify({contract:contract,identity:identity,activity:payload.activity,evidence:evidence})),
    instrument:contract==='web-a05-submission-v2'?'laboratorio-vivo-tsx-equipe':'atividade-nota-equipe'};
}
function notasColName(index){var text='';for(var n=index+1;n>0;n=Math.floor((n-1)/26))text=String.fromCharCode(65+(n-1)%26)+text;return text;}
function notasReadBook(config,titles){
  var meta=Sheets.Spreadsheets.get(config.id,{fields:'spreadsheetId,properties(locale,timeZone),sheets(properties)'});
  var ranges=titles.map(function(t){var matches=(meta.sheets||[]).filter(function(s){return s.properties.title===t;});
    notasAssert(matches.length===1,'Aba não encontrada ou ambígua: '+t);var p=matches[0].properties;
    notasAssert(p.gridProperties.rowCount<=WEB_CFG.maxRows,'Capacidade de linhas excedida.');
    return "'"+t.replace(/'/g,"''")+"'!A1:"+notasColName(p.gridProperties.columnCount-1)+p.gridProperties.rowCount;
  });
  var raw=Sheets.Spreadsheets.get(config.id,{ranges:ranges,includeGridData:true,fields:'spreadsheetId,sheets(properties,data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue))))'});
  var sheets=Object.create(null);
  (raw.sheets||[]).forEach(function(s){var rows=[],formulas=[];
    (s.data||[]).forEach(function(g){(g.rowData||[]).forEach(function(r,i){var ri=(g.startRow||0)+i;rows[ri]=rows[ri]||[];formulas[ri]=formulas[ri]||[];
      (r.values||[]).forEach(function(c,j){var ci=(g.startColumn||0)+j,u=c.userEnteredValue||{},v=c.effectiveValue||u;
        formulas[ri][ci]=u.formulaValue||'';
        rows[ri][ci]=Object.prototype.hasOwnProperty.call(v,'numberValue')?v.numberValue:
          Object.prototype.hasOwnProperty.call(v,'boolValue')?v.boolValue:
          Object.prototype.hasOwnProperty.call(v,'errorValue')?{error:v.errorValue}:
          Object.prototype.hasOwnProperty.call(v,'stringValue')?v.stringValue:'';
      });
    });});
    sheets[s.properties.title]={title:s.properties.title,id:s.properties.sheetId,rowCount:s.properties.gridProperties.rowCount,
      columnCount:s.properties.gridProperties.columnCount,rows:rows,formulas:formulas};
  });return {id:config.id,sheets:sheets};
}
function notasHeaders(s,expected){notasAssert(s&&expected.every(function(h,i){return s.rows[0]&&s.rows[0][i]===h;}),'Cabeçalhos incompatíveis: '+(s?s.title:'aba ausente'));}
function notasCatalog(s){notasHeaders(s,ACT_HEADERS);var result=Object.create(null),used=Object.create(null);
  s.rows.slice(1).forEach(function(r){if(!r||r.every(notasBlank))return;
    notasAssert(typeof r[0]==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(r[0])&&!result[r[0]],'Atividade ambígua.');
    notasAssert(Number.isInteger(r[2])&&r[2]>=1&&r[2]<=4,'Bimestre inválido.');
    notasAssert(typeof r[3]==='string'&&r[3].endsWith(' /10')&&r[3]!=='Média /10','Cabeçalho de nota inválido.');
    notasAssert(!used[r[2]+'|'+r[3]],'Atividade duplicada.');
    notasAssert(['manual','web-a05-submission-v2','web-notas-submission-v3'].includes(r[4])&&typeof r[5]==='boolean','Contrato/flag de atividade inválidos.');
    used[r[2]+'|'+r[3]]=true;result[r[0]]={id:r[0],bim:r[2],title:r[2]+'º Bimestre',header:r[3],contract:r[4],enabled:r[5]};
  });return result;
}
function notasActivity(book,n){var a=notasCatalog(book.sheets.Atividades)[n.activity];
  notasCheckOpenV3(a,n.activity,n.contract);
  var s=book.sheets[a.title];notasHeaders(s,['Aluno','Matrícula','Equipe']);
  var h=s.rows[0],col=h.indexOf(a.header),mean=h.indexOf('Média /10');
  notasAssert(col>=3&&col<mean&&mean>=4&&h.lastIndexOf(a.header)===col&&h.lastIndexOf('Média /10')===mean,'Cabeçalhos bimestrais inválidos.');
  return Object.assign({},a,{col:col,mean:mean});
}
function notasCell(v,f){if(f)return {userEnteredValue:{formulaValue:f}};if(notasBlank(v))return{};
  if(typeof v==='number')return{userEnteredValue:{numberValue:v}};
  if(typeof v==='boolean')return{userEnteredValue:{boolValue:v}};
  notasAssert(typeof v==='string','Tipo de célula inválido.');return{userEnteredValue:{stringValue:v}};
}
function notasWrite(s,r,c,vs){return{updateCells:{start:{sheetId:s.id,rowIndex:r,columnIndex:c},rows:[{values:vs.map(function(v){return notasCell(v);})}],fields:'userEnteredValue'}};}
function notasWriteFormula(s,r,c,f){return{updateCells:{start:{sheetId:s.id,rowIndex:r,columnIndex:c},rows:[{values:[notasCell('',f)]}],fields:'userEnteredValue'}};}
function notasNewRow(s,cols){var last=0;s.rows.forEach(function(r,i){if(i>0&&r&&cols.some(function(c){return !notasBlank(r[c])||Boolean((s.formulas[i]||[])[c]);}))last=i;});
  notasAssert(last+1<s.rowCount,'Capacidade da aba atingida.');return last+1;}
function notasRows(s,c,v){var result=[];s.rows.forEach(function(r,i){if(i>0&&r&&r[c]===v)result.push(i);});return result;}
function notasIndex(a){return a.map(function(i){return i+1;});}
function notasCheckCatalog(book){notasHeaders(book.sheets.Auditoria,AU_HEADERS);notasHeaders(book.sheets.Alunos,A_HEADERS);
  notasHeaders(book.sheets.Resultados,R_HEADERS);notasHeaders(book.sheets.Equipes,T_HEADERS);notasCatalog(book.sheets.Atividades);}

function notasCheckIdentity(book,n){
  var alunos=book.sheets.Alunos, roster=book.sheets[notasActivity(book,n).title];
  var unique=Object.create(null), byName=Object.create(null);
  alunos.rows.forEach(function(row,i){
    if(i===0||!row||notasBlank(row[0]))return;
    var key=row[0],norm=row[2];
    notasAssert(typeof key==='string'&&/^\d{1,32}$/.test(key),'Matrícula armazenada não textual/inválida.');
    notasAssert(typeof norm==='string'&&norm===webNormalized(row[1]),'Nome normalizado inválido no cadastro.');
    notasAssert(!unique[key],'Matrícula duplicada no cadastro docente.');
    unique[key]={row:row,index:i};
    (byName[norm]=byName[norm]||[]).push({enrollment:key,row:row});
  });
  n.identity.members.forEach(function(m,i){
    var norm=webNormalized(m.name),saved=unique[m.enrollment];
    if(saved&&saved.row[2]!==norm)
      notasErr('MATRICULA_NOME_DIVERGENTE',i,'enrollment',
        'Esta matrícula já está associada a um nome diferente no cadastro Web.',
        'Confira nome completo e matrícula; se estiverem corretos, solicite conferência docente.');
    if(saved && !['QA_DECLARADO','VALIDADO_DOCENTE','VALIDADO_HOMONIMO'].includes(saved.row[3]))
      notasErr('IDENTIDADE_REVISAO_DOCENTE',i,'enrollment','Identificação bloqueada para revisão docente.','Procure o professor antes de reenviar.');
    var collisions=(byName[norm]||[]).filter(function(x){return x.enrollment!==m.enrollment;});
    if(collisions.length && !(saved && saved.row[6]===true &&
       collisions.every(function(x){return x.row[6]===true && x.row[3]==='VALIDADO_HOMONIMO';})))
      notasErr('NOME_MATRICULA_DIVERGENTE',i,'name',
        'Este nome já está associado a outra matrícula na disciplina Web.',
        'Confira os dados. Em caso de homônimos, solicite validação administrativa dos dois cadastros.');
    // Não associar uma nova matrícula à linha herdada de UUID, nem tratar nomes isolados como identidade.
    roster.rows.forEach(function(row,j){
      if(j===0||!row||notasBlank(row[0]))return;
      if(row[1]===m.enrollment && webNormalized(row[0])!==norm)
        notasErr('MATRICULA_NOME_DIVERGENTE',i,'name','Esta matrícula consta no boletim com nome diferente.','Solicite conferência docente.');
      if(webNormalized(row[0])===norm && row[1]!==m.enrollment && !collisions.length)
        notasErr('IDENTIDADE_LEGADA_PENDENTE',i,'enrollment',
          'O boletim contém um registro de mesmo nome sem matrícula conciliada.',
          'Não reutilize a linha anterior por nome; solicite a regularização do cadastro ao professor.');
    });
  });
  return unique;
}
function notasAuditSign(row){
  var data=[row[0],row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],
    row[10],row[13],row[14],row[15],row[16],row[17],row[20],row[21],row[22],row[23],row[24],row[25],row[26]];
  // Preserve a assinatura histórica 3.0.0; versões novas vinculam a pendência.
  if(row[13]!=='web-notas-3.0.0-candidata'){
    notasAssert(typeof row[27]==='boolean','Pendência assinada inválida.');data.push(row[27]);
  }
  var legacy=PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301');
  var historical=['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata'].includes(row[13]);
  var key=historical&&legacy?legacy:notasSecret();
  return webHex(Utilities.computeHmacSha256Signature(JSON.stringify(data),key));
}
function notasVerifyAudit(sheet,i){
  var r=sheet.rows[i],ev;
  notasAssert(r&&r[24]==='NOTAS_V3_QA','Registro V3 inválido; histórico legado é somente arquivo.');
  try{ev=JSON.parse(r[14]);}catch(e){webFail('JSON armazenado inválido.');}
  notasAssert(notasNoXpKeys(ev)&&typeof r[10]==='number'&&ev.nota===r[10], 'Nota/evidência armazenada inválida.');
  notasAssert(webSha256(r[14])===r[21]&&webSha256(ev.codigoFonteCompleto||'')===r[16]&&notasAuditSign(r)===r[9],
    'Assinatura/hashes da auditoria inválidos.');
  var members;try{members=JSON.parse(r[25]);}catch(e){webFail('Integrantes da auditoria inválidos.');}
  notasAssert(Array.isArray(members)&&members.every(function(m){return typeof m.enrollment==='string'&&/^\d+$/.test(m.enrollment)&&notasFullName(m.name);}),
    'Matrículas da auditoria inválidas.');
  notasGrade(r[10]);return r;
}
function notasAuditEntry(n,nonce){
  var date=new Date(),time=date.toISOString(),nh=webSha256(nonce),receipt='WEB-'+
    Utilities.formatDate(date,'UTC','yyyyMMdd-HHmmss')+'-'+webSha256(nh+'|'+n.requestHash);
  var names=n.identity.members.map(function(m){return m.name;}).join('; ');
  var row=[n.identity.team,n.identity.teamId,names,n.activity,n.instrument,
    Utilities.formatDate(date,'America/Fortaleza','yyyy-MM-dd HH:mm:ss'),time,receipt,n.originalHash,'',
    n.grade,'',NOTAS_STATUS,WEB_CFG.version,n.evidenceJson,n.identity.teamId+'|'+n.activity,n.codeHash,
    'github-pages-web','', '',names,n.storedHash,nh,n.requestHash,'NOTAS_V3_QA',
    JSON.stringify(n.identity.members),n.contract,false];
  row[9]=notasAuditSign(row);return row;
}
function notasTeamKey(n){return n.identity.teamId+'|'+n.activity;}
function notasAuditWinner(audit,receipt,enrollment,activity){
  var matches=[];audit.rows.forEach(function(r,i){if(i>0&&r&&r[7]===receipt)matches.push(i);});
  notasAssert(matches.length===1,'Recibo vencedor ausente/duplicado na auditoria.');
  var row=notasVerifyAudit(audit,matches[0]);
  notasAssert(row[3]===activity&&JSON.parse(row[25]).some(function(m){return m.enrollment===enrollment;}),
    'Recibo vencedor não comprova matrícula/atividade.');
  return row;
}
function notasRecordIntegrity(book,n,act){
  var aud=book.sheets.Auditoria,res=book.sheets.Resultados,roster=book.sheets[act.title];
  aud.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[7]))notasVerifyAudit(aud,i);});
  var seenResult=Object.create(null);
  res.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){
    var k=r[0]+'|'+r[1];notasAssert(!seenResult[k],'Resultado duplicado.');seenResult[k]=i;
    notasGrade(r[2]);var w=notasAuditWinner(aud,r[3],r[0],r[1]);
    notasAssert(w[10]===r[2]&&w[0]===r[4]&&w[8]===r[8], 'Resultado não corresponde ao recibo vencedor.');
  }});
  var seenRoster=Object.create(null);
  roster.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){
    notasAssert(typeof r[1]==='string'&&/^\d+$/.test(r[1]),'Linha sem matrícula válida: reconciliação docente.');
    notasAssert(!seenRoster[r[1]],'Matrícula duplicada no boletim.');seenRoster[r[1]]=true;
    var meanFormula=(roster.formulas[i]||[])[act.mean]||'';
    notasAssert(meanFormula===notasAverageFormula(i+1,act.mean-3),'Fórmula de média incompatível.');
  }});
  return seenResult;
}
function notasPlan(book,n,nonce){
  notasCheckCatalog(book);var act=notasActivity(book,n),roster=book.sheets[act.title],
    aud=book.sheets.Auditoria,teams=book.sheets.Equipes,alunos=book.sheets.Alunos,res=book.sheets.Resultados;
  var catalog=notasCheckIdentity(book,n),resultIndex=notasRecordIntegrity(book,n,act);
  var sameNonce=notasRows(aud,22,webSha256(nonce));
  notasAssert(sameNonce.length<=1,'Nonce duplicado na auditoria.');
  if(sameNonce.length){var old=notasVerifyAudit(aud,sameNonce[0]);
    if(old[23]!==n.requestHash)notasErr('DUPLICIDADE_TECNICA',null,'nonce','Este identificador foi usado para outro conteúdo.','Confira o recibo anterior; não tente reenviar às cegas.');
    return {requests:[],entry:old,replay:true,act:act,teacherHold:
      old[13]==='web-notas-3.0.0-candidata'?notasLegacyHoldV3(book,n):old[27]};
  }
  var row=notasAuditEntry(n,nonce),req=[],now=row[6],auditRow=notasNewRow(aud,[0,7,15]);
  req.push(notasWrite(aud,auditRow,0,row));
  var teamKey=notasTeamKey(n),teamRows=notasRows(teams,8,teamKey);
  notasAssert(teamRows.length<=1,'Equipe duplicada.');
  var teamRow=teamRows.length?teamRows[0]:notasNewRow(teams,[0,8]),oldTeam=teamRows.length?teams.rows[teamRow]:null;
  var bestTeam=oldTeam?oldTeam[4]:'';
  if(!oldTeam||n.grade>bestTeam){
    req.push(notasWrite(teams,teamRow,0,[n.identity.team,n.identity.members.map(function(m){return m.name;}).join('; '),
      n.identity.members.length,n.activity,n.grade,NOTAS_STATUS,row[7],row[6],teamKey,row[8]]));
    req.push(notasWrite(teams,teamRow,14,[JSON.stringify(n.identity.members),n.contract]));
  }
  req.push(notasWrite(teams,teamRow,12,[row[7],row[6]]));
  var nextStudent=notasNewRow(alunos,[0]),nextRoster=notasNewRow(roster,[0,1,2]),nextResult=notasNewRow(res,[0,1]);
  var memberGrades=[],holds=[];
  n.identity.members.forEach(function(m,i){
    if(!catalog[m.enrollment]){
      req.push(notasWrite(alunos,nextStudent++,0,[m.enrollment,m.name,webNormalized(m.name),'QA_DECLARADO','',now,false,'']));
    }
    var rr=notasRows(roster,1,m.enrollment);
    notasAssert(rr.length<=1,'Matrícula duplicada no boletim.');
    var existingResult=resultIndex[m.enrollment+'|'+n.activity],rowResult=existingResult===undefined?null:res.rows[existingResult],
      oldGrade=rowResult?rowResult[2]:'', priorReceipt=rowResult?rowResult[3]:'';
    var recentAudit=[];
    aud.rows.forEach(function(r,j){if(j>0&&r&&r[3]===n.activity){var ms=JSON.parse(r[25]);
      if(ms.some(function(x){return x.enrollment===m.enrollment;}))recentAudit.push(r);
    }});
    var docHold=(rowResult&&rowResult[6]!==NOTAS_STATUS)||recentAudit.some(function(r){return !notasBlank(r[11])||r[12]!==NOTAS_STATUS;});
    if(rr.length && rowResult){
      notasAssert(!notasBlank(oldGrade),'Boletim com matrícula, sem resultado conciliado.');
      notasAssert(roster.rows[rr[0]][act.col]>=oldGrade,'Boletim menor que resultado assinado.');
    }else if(rowResult)webFail('Resultado existente sem linha do aluno: reconciliação necessária.');
    var winner=!docHold&&(notasBlank(oldGrade)||n.grade>oldGrade),best=winner?n.grade:oldGrade;
    if(!rr.length){
      var pos=nextRoster++;req.push(notasWrite(roster,pos,0,[m.name,m.enrollment,n.identity.team]));
      req.push(notasWrite(roster,pos,act.col,[best]));
      var expected=notasAverageFormula(pos+1,act.mean-3);
      var f=(roster.formulas[pos]||[])[act.mean]||'';
      if(!f)req.push(notasWriteFormula(roster,pos,act.mean,expected));
      else notasAssert(f===expected,'Fórmula da média incompatível.');
    }else if(winner){
      req.push(notasWrite(roster,rr[0],act.col,[n.grade]));
      req.push(notasWrite(roster,rr[0],2,[n.identity.team]));
    }
    var ri=existingResult===undefined?nextResult++:existingResult;
    if(winner){
      req.push(notasWrite(res,ri,0,[m.enrollment,n.activity,n.grade,row[7],n.identity.team,now,
        rowResult?rowResult[6]:NOTAS_STATUS,m.name,row[8],row[7]]));
    }else if(rowResult){req.push(notasWrite(res,ri,9,[row[7]]));}
    else webFail('Reenvio sem resultado anterior verificável.');
    memberGrades.push({name:m.name,enrollment:m.enrollment,best:best,won:winner});holds.push(Boolean(docHold));
  });
  // Finalize a auditoria depois de calcular as pendências de todos os integrantes.
  row[27]=holds.some(Boolean);row[9]=notasAuditSign(row);
  req[0]=notasWrite(aud,auditRow,0,row);
  return {requests:req,entry:row,replay:false,act:act,members:memberGrades,teacherHold:row[27],auditRow:auditRow};
}
function notasVerifyWrites(book,plan){
  var byId=Object.create(null);Object.keys(book.sheets).forEach(function(k){byId[book.sheets[k].id]=book.sheets[k];});
  plan.requests.forEach(function(req){var u=req.updateCells;if(!u)return;var s=byId[u.start.sheetId],r=u.start.rowIndex,c=u.start.columnIndex;
    u.rows[0].values.forEach(function(cell,i){var v=cell.userEnteredValue,old=(s.rows[r]||[])[c+i];
      if(!v){notasAssert(notasBlank(old),'Escrita incompleta.');return;}
      if(v.formulaValue){notasAssert((s.formulas[r]||[])[c+i]===v.formulaValue,'Média não persistida.');return;}
      var expected=Object.prototype.hasOwnProperty.call(v,'numberValue')?v.numberValue:
        Object.prototype.hasOwnProperty.call(v,'boolValue')?v.boolValue:v.stringValue;
      notasAssert(old===expected,'Escrita incompleta.');
    });
  });
}
function notasReceipt(n,entry,nonce,book,plan){
  var grades=n.identity.members.map(function(m){var rs=notasRows(book.sheets.Resultados,0,m.enrollment).filter(function(i){return book.sheets.Resultados.rows[i][1]===n.activity;});
    notasAssert(rs.length===1,'Nota por aluno ausente.');return {best:book.sheets.Resultados.rows[rs[0]][2]};});
  return {ok:true,channel:n.contract==='web-a05-submission-v2'?WEB_CFG.channel:'web-notas',nonce:nonce,
    receiptId:entry[7],activity:n.activity,instrument:n.instrument,receivedAt:entry[6],
    teamId:n.identity.teamId,memberCount:n.identity.members.length,answersSha256:entry[8],
    codeSha256:entry[16],storedEvidenceSha256:entry[21],signature:entry[9],grade:null,
    gradeReceived:entry[10],bestGrades:grades.map(function(x){return x.best;}),
    status:NOTAS_STATUS,teacherReviewRequired:Boolean(plan.teacherHold),
    warning:plan.teacherHold?'Entrega recebida; avaliação docente preservada e pendente de revisão.':
      'Nota calculada a partir de evidência declarada; sujeito à conferência docente.'};
}
function notasStore(payload,nonce,config){
  var n=notasNormalize(payload);notasIdentityAllowed(n.identity,config);notasSecret();
  var head=notasReadBook(config,['Atividades']),a=notasCatalog(head.sheets.Atividades)[n.activity];
  notasCheckOpenV3(a,n.activity,n.contract);
  var titles=['Atividades','Auditoria','Equipes','Alunos','Resultados',a.title],before=notasReadBook(config,titles);
  var plan=notasPlan(before,n,nonce),after;
  if(plan.requests.length){
    try{Sheets.Spreadsheets.batchUpdate({requests:plan.requests},config.id);}
    catch(e){try{after=notasReadBook(config,titles);notasVerifyWrites(after,plan);}
      catch(unconfirmed){webFail('Envio sem confirmação. Confira os recibos antes de repetir o POST.');}}
  }
  after=after||notasReadBook(config,titles);notasVerifyWrites(after,plan);
  notasCheckCatalog(after);notasCheckIdentity(after,n);notasRecordIntegrity(after,n,plan.act);
  return notasReceipt(n,plan.entry,nonce,after,plan);
}
function webReturn(result){var safe=JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')
    .replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return HtmlService.createHtmlOutput('<!doctype html><html><meta charset="utf-8"><body><script>top.postMessage('
    +safe+',"'+WEB_CFG.origin+'");</scr'+'ipt></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(){var c=notasConfig();return ContentService.createTextOutput('Web '+WEB_CFG.version+
    ' — '+c.mode+' — recebimento '+(c.enabled?'habilitado QA':'bloqueado')+' — matrícula obrigatória, maior nota, média automática')
    .setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e){var nonce='',channel=WEB_CFG.channel,held=false,lock=null;
  try{
    notasAssert(e&&e.parameter,'Requisição ausente.');nonce=webText(e.parameter.nonce,90,'nonce');
    notasAssert(/^[A-Za-z0-9-]{12,90}$/.test(nonce),'Nonce inválido.');
    var raw=e.parameter.payload;notasAssert(typeof raw==='string'&&raw.length<=WEB_CFG.maxPayloadChars,'Payload inválido.');
    var cfg=notasConfig();notasAssert(cfg.enabled,'Recebimento QA V3 bloqueado.');
    var payload;try{payload=JSON.parse(raw);}catch(e){webFail('JSON inválido.');}
    if(payload.schema==='web-notas-submission-v3')channel='web-notas';
    lock=LockService.getScriptLock();lock.waitLock(20000);held=true;
    // Releitura sob lock: um POST que esperou não pode usar a flag antiga.
    cfg=notasConfig();notasAssert(cfg.enabled,'Recebimento QA V3 bloqueado.');
    return webReturn(notasStore(payload,nonce,cfg));
  }catch(err){return webReturn({ok:false,channel:channel,nonce:nonce,
    code:err.publicCode||'ENVIO_SEM_CONFIRMACAO',memberIndex:Number.isInteger(err.memberIndex)?err.memberIndex:null,
    field:err.field||null,message:err.webPublic?String(err.message).slice(0,220):'Falha interna. Consulte o docente.',
    action:err.action||'Confira a situação na Auditoria antes de reenviar.',retryable:false});
  }finally{if(held)lock.releaseLock();}
}
function prepararIntegracaoNotasV3(){var cfg=notasConfig(),book=notasReadBook(cfg,['Atividades','Auditoria','Equipes','Alunos','Resultados']);
  notasCheckCatalog(book);var p=PropertiesService.getScriptProperties();
  if(p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')===null)p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
  if(!p.getProperty('WEB_NOTAS_V3_HMAC_SECRET'))p.setProperty('WEB_NOTAS_V3_HMAC_SECRET',
    Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''));
  notasSecret();return {version:WEB_CFG.version,mode:cfg.mode,enabled:notasConfig().enabled,homologated:false};
}
function statusIntegracaoNotasV3(){var c=notasConfig(),b=notasReadBook(c,['Atividades','Auditoria','Equipes','Alunos','Resultados']);
  notasCheckCatalog(b);return {version:WEB_CFG.version,mode:c.mode,enabled:c.enabled,
    activities:Object.keys(notasCatalog(b.sheets.Atividades)),homologated:false};}
/** Chamada somente no editor pelo professor autenticado. NÃO publicar via doGet/doPost. */
function consultarConflitoDocenteV3(nome,matricula){var c=notasConfig(),b=notasReadBook(c,['Alunos']);
  notasHeaders(b.sheets.Alunos,A_HEADERS);var norm=webNormalized(nome),rows=[];
  b.sheets.Alunos.rows.forEach(function(r,i){if(i>0&&r&&r[0]&&(r[0]===matricula||r[2]===norm))rows.push({
    linha:i+1,nomeCadastrado:r[1],matriculaCadastrada:r[0],estado:r[3],fonte:r[4],homonimoLiberado:r[6]===true});
  });return {entrada:{nome:nome,matricula:matricula},comparacaoPrivada:rows,publicar:false};
}

/** Cadastro administrativo de atividade (não acessível por doPost). */
function cadastrarAtividadeNotasV3(spec){
  var c=notasConfig();notasAssert(spec&&typeof spec==='object'&&Number.isInteger(spec.bim)&&spec.bim>=1&&spec.bim<=4,'Bimestre inválido.');
  var lock=LockService.getScriptLock(),held=false;
  try{lock.waitLock(20000);held=true;
    var title=spec.bim+'º Bimestre',book=notasReadBook(c,['Atividades',title]);
    var cat=notasCatalog(book.sheets.Atividades),name=webText(spec.name,100,'nome da atividade'),
      header=webText(spec.header,100,'coluna'),contract=spec.contract;
    notasAssert(typeof spec.id==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(spec.id)&&
      typeof header==='string'&&header.endsWith(' /10')&&header!=='Média /10','ID/cabeçalho inválido.');
    notasAssert(contract==='web-notas-submission-v3','Contrato genérico V3 obrigatório.');
    var cfg={id:spec.id,bim:spec.bim,title:title,header:header,contract:contract,enabled:spec.enabled===true};
    if(cat[spec.id]){var old=cat[spec.id];notasAssert(['id','bim','title','header','contract','enabled'].every(function(k){return old[k]===cfg[k];}),
      'Atividade já registrada com parâmetros diferentes.');return {status:'JA_CADASTRADA',id:spec.id};}
    var s=book.sheets[title];notasHeaders(s,['Aluno','Matrícula','Equipe']);
    var h=s.rows[0],mean=h.indexOf('Média /10');
    notasAssert(mean>=3&&h.lastIndexOf('Média /10')===mean&&!h.includes(header),'Posição da coluna inválida.');
    s.rows.forEach(function(row,i){if(i>0&&row&&!notasBlank(row[0]))
      notasAssert((s.formulas[i]||[])[mean]===notasAverageFormula(i+1,mean-3),'Fórmula manual impede alteração automática.');});
    var at=book.sheets.Atividades,ar=notasNewRow(at,[0,1,2,3,4,5]);
    var requests=[
      {insertDimension:{range:{sheetId:s.id,dimension:'COLUMNS',startIndex:mean,endIndex:mean+1},inheritFromBefore:true}},
      notasWrite(s,0,mean,[header]),
      {setDataValidation:{range:{sheetId:s.id,startRowIndex:1,endRowIndex:s.rowCount,startColumnIndex:mean,endColumnIndex:mean+1},
        rule:{condition:{type:'NUMBER_BETWEEN',values:[{userEnteredValue:'0'},{userEnteredValue:'10'}]},strict:true}}},
      {repeatCell:{range:{sheetId:s.id,startRowIndex:1,endRowIndex:s.rowCount,startColumnIndex:mean+1,endColumnIndex:mean+2},
        cell:notasCell('',notasAverageFormula(2,mean-2)),fields:'userEnteredValue'}},
      notasWrite(at,ar,0,[spec.id,name,spec.bim,header,contract,spec.enabled===true])
    ];
    Sheets.Spreadsheets.batchUpdate({requests:requests},c.id);
    var after=notasReadBook(c,['Atividades',title]),k=notasCatalog(after.sheets.Atividades)[spec.id],ss=after.sheets[title];
    notasAssert(k&&ss.rows[0][mean]===header&&ss.rows[0][mean+1]==='Média /10','Cadastro não confirmado; não repita sem verificar.');
    return {status:'CADASTRADA',id:spec.id,bimestre:spec.bim};
  }finally{if(held)lock.releaseLock();}
}


/** Compatibilidade dos recibos 3.0.0 já existentes, sem reescrever assinaturas. */
function notasLegacyHoldV3(book,n){
  return n.identity.members.some(function(m){
    return book.sheets.Resultados.rows.some(function(r,i){return i>0&&r&&r[0]===m.enrollment&&r[1]===n.activity&&r[6]!==NOTAS_STATUS;}) ||
      book.sheets.Auditoria.rows.some(function(r,i){return i>0&&r&&r[3]===n.activity&&
        (!notasBlank(r[11])||r[12]!==NOTAS_STATUS)&&JSON.parse(r[25]).some(function(x){return x.enrollment===m.enrollment;});});
  });
}
function notasClosedKeyV3(id){
  notasAssert(typeof id==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(id),'ID de atividade inválido.');
  return 'WEB_NOTAS_V3_CLOSED_'+id;
}
function notasCheckOpenV3(activity,id,contract){
  var closed=PropertiesService.getScriptProperties().getProperty(notasClosedKeyV3(id));
  if(closed || (activity && !activity.enabled))
    notasErr('ATIVIDADE_ENCERRADA',null,null,'A atividade '+id+' está fechada para envios.',
      'O professor encerrou o recebimento. Nenhuma nova entrega foi registrada.');
  notasAssert(activity&&activity.contract===contract,'Atividade não cadastrada ou contrato incompatível.');
}
/** Administração somente no editor. Aguarda o último escritor antes de liberar correção. */
function bloquearRecebimentoNotasV3(){
  notasConfig();var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
  try{lock.waitLock(20000);held=true;
    p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
    var result={status:'BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO',enabled:false,version:WEB_CFG.version};
    console.log('WEB_V3_BLOQUEIO '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
/** Fechamento individual permanente; reativar flag global não reabre a atividade. */
function encerrarAtividadeNotasV3(id,motivo){
  var cfg=notasConfig(),key=notasClosedKeyV3(id),reason=webText(motivo,200,'motivo do encerramento');
  notasAssert(reason.length>=3,'Informe o motivo do encerramento.');
  var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  try{lock.waitLock(20000);held=true;
    var book=notasReadBook(cfg,['Atividades']),sheet=book.sheets.Atividades,cat=notasCatalog(sheet);
    notasAssert(cat[id],'Atividade não cadastrada.');
    var rows=notasRows(sheet,0,id);notasAssert(rows.length===1,'Atividade ambígua.');
    notasAssert(sheet.columnCount>=8,'Atividades precisa de colunas G e H livres para encerramento.');
    var existing=p.getProperty(key),stamp=existing?JSON.parse(existing):{at:new Date().toISOString(),reason:reason};
    // Registra bloqueio ANTES da chamada remota: falha de rede não reabre a atividade.
    p.setProperty(key,JSON.stringify(stamp));
    var requests=[notasWrite(sheet,0,6,['Encerrada UTC','Motivo do encerramento']),
      notasWrite(sheet,rows[0],5,[false,stamp.at,stamp.reason])];
    try{Sheets.Spreadsheets.batchUpdate({requests:requests},cfg.id);}
    catch(e){p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
      webFail('Bloqueio mantido; gravação de encerramento não confirmada. Execute o fechamento novamente antes de corrigir.');}
    var after=notasReadBook(cfg,['Atividades']);notasVerifyWrites(after,{requests:requests});
    var result={status:'ATIVIDADE_ENCERRADA_CONFIRMADA',activity:id,closedAt:stamp.at,enabled:false,version:WEB_CFG.version};
    console.log('WEB_V3_ENCERRAMENTO '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
function encerrarAula05ParaCorrecaoV3(){
  bloquearRecebimentoNotasV3();
  return encerrarAtividadeNotasV3(WEB_CFG.activity,'Encerramento para correção docente');
}
function liberarRecebimentoQAWebV3(){
  var cfg=notasConfig(),lock=LockService.getScriptLock(),held=false;
  try{lock.waitLock(20000);held=true;notasSecret();
    var b=notasReadBook(cfg,['Atividades']);
    var catalog=notasCatalog(b.sheets.Atividades),p=PropertiesService.getScriptProperties();
    notasAssert(Object.keys(catalog).some(function(id){return catalog[id].enabled&&!p.getProperty(notasClosedKeyV3(id));}),
      'Nenhuma atividade aberta. Não remova bloqueios de atividades já corrigidas.');
    p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','true');
    var r={status:'QA_LIBERADO',mode:'QA',enabled:true,production:false};
    console.log('WEB_V3_LIBERACAO '+JSON.stringify(r));return r;
  }finally{if(held)lock.releaseLock();}
}
function verificarStatusWebV3(){
  var r=statusIntegracaoNotasV3(),c=notasConfig(),b=notasReadBook(c,['Atividades']),cat=notasCatalog(b.sheets.Atividades);
  var p=PropertiesService.getScriptProperties();r.spreadsheetId=c.id;
  r.activityStatus=Object.keys(cat).map(function(id){return {id:id,bimestre:cat[id].bim,
    enabled:cat[id].enabled&&!p.getProperty(notasClosedKeyV3(id)),closed:!!p.getProperty(notasClosedKeyV3(id))};});
  console.log('WEB_V3_STATUS '+JSON.stringify(r));return r;
}

return Object.freeze({WEB_CFG:WEB_CFG,WEB_TASKS:WEB_TASKS,NOTAS_STATUS:NOTAS_STATUS,A_HEADERS:A_HEADERS,R_HEADERS:R_HEADERS,T_HEADERS:T_HEADERS,AU_HEADERS:AU_HEADERS,ACT_HEADERS:ACT_HEADERS,webFail:webFail,webText:webText,webCode:webCode,webSafe:webSafe,webNormalized:webNormalized,webEvidence:webEvidence,webHex:webHex,webSha256:webSha256,notasAssert:notasAssert,notasBlank:notasBlank,notasGrade:notasGrade,notasMax:notasMax,notasMean:notasMean,notasErr:notasErr,notasFullName:notasFullName,notasEnrollment:notasEnrollment,webIdentity:webIdentity,notasAverageFormula:notasAverageFormula,notasConfig:notasConfig,notasSecret:notasSecret,notasSign:notasSign,notasNoXpKeys:notasNoXpKeys,notasIdentityAllowed:notasIdentityAllowed,notasNormalize:notasNormalize,notasColName:notasColName,notasReadBook:notasReadBook,notasHeaders:notasHeaders,notasCatalog:notasCatalog,notasActivity:notasActivity,notasCell:notasCell,notasWrite:notasWrite,notasWriteFormula:notasWriteFormula,notasNewRow:notasNewRow,notasRows:notasRows,notasIndex:notasIndex,notasCheckCatalog:notasCheckCatalog,notasCheckIdentity:notasCheckIdentity,notasAuditSign:notasAuditSign,notasVerifyAudit:notasVerifyAudit,notasAuditEntry:notasAuditEntry,notasTeamKey:notasTeamKey,notasAuditWinner:notasAuditWinner,notasRecordIntegrity:notasRecordIntegrity,notasPlan:notasPlan,notasVerifyWrites:notasVerifyWrites,notasReceipt:notasReceipt,notasStore:notasStore,webReturn:webReturn,doGet:doGet,doPost:doPost,prepararIntegracaoNotasV3:prepararIntegracaoNotasV3,statusIntegracaoNotasV3:statusIntegracaoNotasV3,consultarConflitoDocenteV3:consultarConflitoDocenteV3,cadastrarAtividadeNotasV3:cadastrarAtividadeNotasV3,notasLegacyHoldV3:notasLegacyHoldV3,notasClosedKeyV3:notasClosedKeyV3,notasCheckOpenV3:notasCheckOpenV3,bloquearRecebimentoNotasV3:bloquearRecebimentoNotasV3,encerrarAtividadeNotasV3:encerrarAtividadeNotasV3,encerrarAula05ParaCorrecaoV3:encerrarAula05ParaCorrecaoV3,liberarRecebimentoQAWebV3:liberarRecebimentoQAWebV3,verificarStatusWebV3:verificarStatusWebV3});
})();

/** Effective user alone identifies the deployment owner, not the caller. Fail closed. */
function webAdminIdentityV3_(bootstrap){
  var active='',effective='';
  try{active=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
      effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();}catch(e){}
  if(!active||!effective||active!==effective)throw new Error('ADMIN_NAO_AUTORIZADO');
  var p=PropertiesService.getScriptProperties(),saved=p.getProperty('WEB_NOTAS_V3_ADMIN_EMAIL');
  if(saved?active!==saved:!bootstrap)throw new Error('ADMIN_NAO_AUTORIZADO');
  if(!saved)p.setProperty('WEB_NOTAS_V3_ADMIN_EMAIL',active);
}
function webAdminExecV3_(name,args,bootstrap){
  webAdminIdentityV3_(bootstrap===true);
  if(name==='prepararIntegracaoNotasV3')WEB_V3_PRIVATE_.bloquearRecebimentoNotasV3();
  if(name==='liberarRecebimentoQAWebV3'&&PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_V3_SECURITY_READY')!=='true')
    throw new Error('ROTACAO_QA_PENDENTE: arquive implantações anteriores e execute rotacionarChaveQAWebV3.');
  return WEB_V3_PRIVATE_[name].apply(null,Array.prototype.slice.call(args));
}
function doGet(){return WEB_V3_PRIVATE_.doGet();}
function doPost(e){return WEB_V3_PRIVATE_.doPost(e);}
function prepararIntegracaoNotasV3(){return webAdminExecV3_('prepararIntegracaoNotasV3',arguments,true);}
function statusIntegracaoNotasV3(){return webAdminExecV3_('statusIntegracaoNotasV3',arguments,false);}
function consultarConflitoDocenteV3(){return webAdminExecV3_('consultarConflitoDocenteV3',arguments,false);}
function cadastrarAtividadeNotasV3(){return webAdminExecV3_('cadastrarAtividadeNotasV3',arguments,false);}
function bloquearRecebimentoNotasV3(){return webAdminExecV3_('bloquearRecebimentoNotasV3',arguments,false);}
function encerrarAtividadeNotasV3(){return webAdminExecV3_('encerrarAtividadeNotasV3',arguments,false);}
function encerrarAula05ParaCorrecaoV3(){return webAdminExecV3_('encerrarAula05ParaCorrecaoV3',arguments,false);}
function liberarRecebimentoQAWebV3(){return webAdminExecV3_('liberarRecebimentoQAWebV3',arguments,false);}
function verificarStatusWebV3(){return webAdminExecV3_('verificarStatusWebV3',arguments,false);}

/** Run only AFTER archiving ALL older deployments of this Web script project.
 * Keeps the old QA key solely to read existing receipts; never prints either key.
 */
function rotacionarChaveQAWebV3(){
  webAdminIdentityV3_(false);
  var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  if(p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true')throw new Error('BLOQUEIE_RECEBIMENTO_ANTES');
  try{lock.waitLock(20000);held=true;
    if(p.getProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED')==='true')throw new Error('BLOQUEIE_RECEBIMENTO_ANTES');
    var c=WEB_V3_PRIVATE_.notasConfig();
    if(p.getProperty('WEB_NOTAS_V3_SECURITY_READY')==='true'){
      if(!p.getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301'))throw new Error('ESTADO_ROTACAO_INCONSISTENTE');
      return {status:'ROTACAO_QA_JA_REALIZADA',enabled:false,version:'web-notas-3.0.2-candidata'};
    }
    var book=WEB_V3_PRIVATE_.notasReadBook(c,['Auditoria']);
    book.sheets.Auditoria.rows.forEach(function(row,i){
      if(i>0&&row&&!WEB_V3_PRIVATE_.notasBlank(row[7])){
        if(!['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata'].includes(row[13]))throw new Error('ROTACAO_EXIGE_CONFERENCIA_DOCENTE');
        WEB_V3_PRIVATE_.notasVerifyAudit(book.sheets.Auditoria,i);
      }
    });
    var legacy=p.getProperty('WEB_NOTAS_V3_HMAC_LEGACY_301');
    if(!legacy){legacy=WEB_V3_PRIVATE_.notasSecret();p.setProperty('WEB_NOTAS_V3_HMAC_LEGACY_301',legacy);}
    // READY written last: interrupted rotation stays blocked and may be resumed.
    var key=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
    p.setProperty('WEB_NOTAS_V3_HMAC_SECRET',key);
    p.setProperty('WEB_NOTAS_V3_SECURITY_ROTATED_AT',new Date().toISOString());
    p.setProperty('WEB_NOTAS_V3_SECURITY_READY','true');
    var result={status:'ROTACAO_QA_CONCLUIDA',enabled:false,version:'web-notas-3.0.2-candidata',historicalSignatures:'PRESERVADAS'};
    console.log('WEB_V3_SEGURANCA '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
