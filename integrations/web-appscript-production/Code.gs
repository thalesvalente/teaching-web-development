/** V3.2.0: only HTTP handlers and authenticated administrative facades are public.
 * Helpers live inside a closure; no secret, store or signature helper is a top-level RPC.
 * Do not reintroduce top-level aliases from test harnesses in this project.
 */
var WEB_V3_PRIVATE_ = (function(){
/**
 * WEB-A05-ID-03 — 3.2.0 — PRODUÇÃO; ativação explícita do proprietário.
 * SOMENTE Desenvolvimento Web. Destino fixo: boletim novo e privado da turma.
 * Identificação declarada sem login; administração autenticada e recepção bloqueada por padrão.
 * Matrícula como texto; conflitos de identidade sem divulgação de terceiros.
 * Lock + UMA chamada Sheets.Spreadsheets.batchUpdate + readback.
 * A equipe não define identidade. O cadastro do aluno é global à disciplina.
 */
var WEB_CFG=Object.freeze({
  spreadsheetId:'1cPQD_ie3cEqt11fLXT398DPQIi5bnqkmTqfl9yk8a_Q',
  version:'web-notas-3.2.0',activity:'WEB-AULA05-2026',
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
      // A conjunção portuguesa e é válida em nomes completos cadastrados.
      if(part.toLowerCase()==='e')return true;
      return /^[\p{L}][\p{L}\p{M}'’\-]*$/u.test(part) &&
        part.split(/[-'’]/).every(function(x){return x.length>0;}) &&
        part.split(/[-'’]/).some(function(x){return (x.match(/\p{L}/gu)||[]).length>=2;});
    });
}
function notasEnrollment(value, i) {
  if(typeof value!=='string'||!value.trim())
    notasErr('MATRICULA_OBRIGATORIA',i,'enrollment','Informe a matrícula completa.','Consulte sua matrícula ou procure o professor.');
  // Canonicaliza SOMENTE a entrada de pesquisa. Alunos nunca é regravada.
  var key=value.trim().toUpperCase();
  if(!/^[0-9]{8}\.ITA[0-9]{4}$/.test(key))
    notasErr('MATRICULA_FORMATO_INVALIDO',i,'enrollment','Use a matrícula completa, com ponto, letras ITA e zeros iniciais.','Confira o documento da turma. Não use somente os últimos algarismos.');
  return key;
}

function webIdentity(input) {
  notasExactKeys_(input,['team','teamId','members']);
  var team=webText(input.team,80,'equipe'),teamId=webText(input.teamId,36,'ID técnico');
  notasAssert(team.length>=3,'Nome da equipe incompleto.');
  notasAssert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId),'Identificador técnico inválido.');
  notasAssert(Array.isArray(input.members)&&input.members.length>=1&&input.members.length<=8,'Informe entre 1 e 8 integrantes.');
  var seen=Object.create(null);
  var members=input.members.map(function(m,i){
    notasExactKeys_(m,['enrollment','confirmationToken','confirmed']);
    var key=notasEnrollment(m.enrollment,i);
    if(seen[key])notasErr('MATRICULA_DUPLICADA_EQUIPE',i,'enrollment','Matrícula repetida na equipe.','Cada integrante deve ser incluído uma única vez.');
    seen[key]=true;
    if(m.confirmed!==true||typeof m.confirmationToken!=='string'||!/^\d{13}\.[a-f0-9]{64}$/.test(m.confirmationToken))
      notasErr('CONFIRMACAO_OBRIGATORIA',i,'enrollment','Consulte a matrícula e confirme o nome exibido.','Reinicie a identificação local e consulte novamente.');
    return {enrollment:key,confirmationToken:m.confirmationToken,confirmed:true};
  });
  return {team:team,teamId:teamId,members:members};
}

function notasAverageFormula(row, count) {
  if(!count)return '=IF($A'+row+'="";"";"")';
  return '=IF($A'+row+'="";"";IF(COUNT($D'+row+':INDEX('+row+':'+row+';1;COLUMN()-1))=0;"";ROUND(AVERAGE($D'+row+':INDEX('+row+':'+row+';1;COLUMN()-1));2)))';
}
function notasConfig() {
  var p=PropertiesService.getScriptProperties();
  var id=p.getProperty('WEB_NOTAS_PROD_SPREADSHEET_ID')||WEB_CFG.spreadsheetId;
  notasAssert(id===WEB_CFG.spreadsheetId,'Destino de produção não autorizado.');
  var mode=p.getProperty('WEB_NOTAS_PROD_MODE')||'PROD';
  notasAssert(mode==='PROD','Ambiente de produção inválido.');
  return {id:id,mode:mode,enabled:p.getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')==='true'&&
    p.getProperty('WEB_NOTAS_PROD_SECURITY_READY')==='true'};
}
function notasSecret() {
  var s=PropertiesService.getScriptProperties().getProperty('WEB_NOTAS_PROD_HMAC_SECRET');
  notasAssert(typeof s==='string'&&s.length>=48,'Preparação V3 pendente.');return s;
}
function notasSign(text){return webHex(Utilities.computeHmacSha256Signature(String(text),notasSecret()));}
function notasNoXpKeys(value){return !value||typeof value!=='object'||Object.keys(value).every(function(k){return !/^(xp|maximoXp|xpReported)$/i.test(k)&&notasNoXpKeys(value[k]);});}
function notasIdentityAllowed(identity,config){
  notasAssert(config.mode==='PROD','Ambiente de produção inválido.');
  // O cadastro docente é obrigatório e lido por notasHydrate_; não há login do aluno.
  notasAssert(identity.members.length>=1&&identity.members.length<=8,'Integrantes inválidos.');
}
/** Limites de uso de melhor esforço. CacheService não é identidade nem proteção DDoS. */
function notasRateLimit_(identity){
  var cache=CacheService.getScriptCache(),minute=Math.floor(Date.now()/60000),hour=Math.floor(Date.now()/3600000);
  var keys=[['prod:global:'+minute,180,120],['prod:team:'+hour+':'+webSha256(identity.teamId),40,3600]];
  identity.members.forEach(function(m){keys.push(['prod:member:'+hour+':'+webSha256(m.enrollment),30,3600]);});
  keys.forEach(function(k){var n=Number(cache.get(k[0])||0);
    if(!Number.isFinite(n)||n>=k[1])notasErr('LIMITE_TEMPORARIO',null,null,
      'Limite temporário de tentativas. Aguarde antes de tentar novamente.','Suas respostas foram preservadas. Procure o professor se o problema persistir.');
  });
  keys.forEach(function(k){cache.put(k[0],String(Number(cache.get(k[0])||0)+1),k[2]);});
}
function notasNormalize(payload){
  notasAssert(payload&&typeof payload==='object'&&!Array.isArray(payload),'Payload inválido.');
  notasExactKeys_(payload,['operation','environment','schema','activity','identity','evidence']);
  var identity=webIdentity(payload.identity),contract=payload.schema,evidence,grade,original;
  notasAssert(typeof payload.activity==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(payload.activity),'Atividade inválida.');
  if(contract==='web-a05-submission-v3'){
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
    instrument:contract==='web-a05-submission-v3'?'laboratorio-vivo-tsx-equipe':'atividade-nota-equipe'};
}

/** Contracts reject all mutation fields, including requests from a modified browser. */
function notasExactKeys_(value,keys){
  notasAssert(value&&typeof value==='object'&&!Array.isArray(value),'Objeto inválido.');
  if(Object.keys(value).some(function(k){return keys.indexOf(k)<0;}))
    notasErr('OPERACAO_NAO_PERMITIDA',null,null,'O cadastro só pode ser editado manualmente pelo professor na planilha.','Atualize a página. Nenhuma alteração cadastral é permitida por este aplicativo.');
}
function notasRosterIndex_(book){
  var alunos=book.sheets.Alunos,unique=Object.create(null);notasHeaders(alunos,A_HEADERS);
  alunos.rows.forEach(function(row,i){
    if(i===0||!row||row.every(notasBlank))return;
    var key=row[0];
    notasAssert(typeof key==='string'&&/^[0-9]{8}\.ITA[0-9]{4}$/.test(key),'Cadastro precisa de conferência manual do professor.');
    notasAssert(typeof row[1]==='string'&&notasFullName(row[1])&&row[2]===webNormalized(row[1]),'Cadastro precisa de conferência manual do professor.');
    notasAssert(!unique[key],'Cadastro contém matrícula duplicada; solicite conferência docente.');
    notasAssert(!(alunos.formulas[i]||[]).some(Boolean),'Cadastro contém fórmula; solicite conferência docente.');
    unique[key]={row:row,index:i};
  });
  return unique;
}
function notasStudent_(index,key,i){
  var saved=index[key];
  if(!saved||saved.row[3]!=='VALIDADO_DOCENTE')
    notasErr('MATRICULA_NAO_DISPONIVEL',i,'enrollment','Matrícula não encontrada ou indisponível para esta atividade.','Confira a matrícula completa. Somente o professor pode corrigir o cadastro diretamente na planilha.');
  return saved;
}
function notasConfirmation_(saved,teamId,activity,expires){
  // Fingerprint opaque: binds the displayed record/version, not student authentication.
  var row=[];for(var i=0;i<8;i++)row.push(saved.row[i]===undefined?'':saved.row[i]);
  return String(expires)+'.'+notasSign(JSON.stringify(['roster-v1',teamId,activity,row,String(expires)]));
}
function notasHydrate_(book,n){
  var index=notasRosterIndex_(book);
  n.identity.members=n.identity.members.map(function(m,i){
    var saved=notasStudent_(index,m.enrollment,i),expires=Number(m.confirmationToken.split('.')[0]);
    if(expires<Date.now()||expires>Date.now()+20*60000||notasConfirmation_(saved,n.identity.teamId,n.activity,expires)!==m.confirmationToken)
      notasErr('CONFIRMACAO_DESATUALIZADA',i,'enrollment','A confirmação expirou ou o professor atualizou o cadastro.','Consulte a matrícula novamente e confira o nome. Nenhum cadastro foi alterado pelo sistema.');
    return {name:saved.row[1],enrollment:m.enrollment};
  });
}
function notasLookup_(payload,nonce,config){
  notasExactKeys_(payload,['operation','environment','activity','teamId','enrollment']);
  notasAssert(payload.environment==='PROD'&&typeof payload.activity==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,79}$/.test(payload.activity),'Ambiente/atividade incompatível.');
  var key=notasEnrollment(payload.enrollment,0),teamId=webText(payload.teamId,36,'ID técnico');
  notasAssert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId),'Identificador técnico inválido.');
  notasLookupLimit_(teamId,key);
  var book=notasReadBook(config,['Alunos','Atividades']),a=notasCatalog(book.sheets.Atividades)[payload.activity];
  notasAssert(a&&['web-a05-submission-v3','web-notas-submission-v3'].includes(a.contract),'Atividade indisponível.');
  notasCheckOpenV3(a,payload.activity,a.contract);
  var saved=notasStudent_(notasRosterIndex_(book),key,0),expires=Date.now()+15*60000;
  return {ok:true,channel:'web-roster-lookup-aula05',nonce:nonce,version:WEB_CFG.version,
    name:saved.row[1],enrollmentCanonical:key,confirmationToken:notasConfirmation_(saved,teamId,payload.activity,expires)};
}
function notasLookupLimit_(teamId,key){
  var cache=CacheService.getScriptCache(),minute=Math.floor(Date.now()/60000);
  var keys=[['roster:global:'+minute,120],['roster:team:'+minute+':'+webSha256(teamId),24],['roster:entry:'+minute+':'+webSha256(key),12]];
  keys.forEach(function(pair){var n=Number(cache.get(pair[0])||0);
    if(!Number.isFinite(n)||n>=pair[1])notasErr('LIMITE_TEMPORARIO',null,'enrollment','Limite temporário de consultas. Aguarde antes de tentar novamente.','Não repita consultas continuamente. Procure o professor se persistir.');});
  keys.forEach(function(pair){cache.put(pair[0],String(Number(cache.get(pair[0])||0)+1),120);});
}
/** The ONLY gateway for Sheets mutations. Unknown operations and destinations fail closed. */
function notasCommit_(book,requests,config,scope){
  notasAssert(book.id===config.id&&config.id===WEB_CFG.spreadsheetId,'Destino inválido.');
  var names=scope==='catalog'?['Atividades','1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre']:
    ['Auditoria','Equipes','Resultados','1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre'];
  var allowed=Object.create(null),blocked=book.sheets.Alunos&&book.sheets.Alunos.id;
  names.forEach(function(name){var sheet=book.sheets[name];if(sheet){notasAssert(sheet.title===name&&sheet.id!==blocked,'Destino cadastral proibido.');allowed[sheet.id]=sheet;}});
  notasAssert(Array.isArray(requests)&&requests.length>0,'Lote vazio.');
  requests.forEach(function(req){
    notasAssert(req&&Object.keys(req).length===1,'Requisição de escrita inválida.');
    var kind=Object.keys(req)[0],x=req[kind],loc;
    if(kind==='updateCells'){
      notasAssert(x&&Object.keys(x).every(function(k){return ['start','rows','fields'].includes(k);})&&x.fields==='userEnteredValue','Máscara de escrita proibida.');
      loc=x.start;notasAssert(loc&&Number.isInteger(loc.rowIndex)&&loc.rowIndex>=0&&Number.isInteger(loc.columnIndex)&&loc.columnIndex>=0,'Coordenadas explícitas obrigatórias.');
      notasAssert(Array.isArray(x.rows)&&x.rows.length>0&&x.rows.every(function(r){return Array.isArray(r.values)&&r.values.length>0;}),'Linhas inválidas.');
    }else if(scope==='catalog'&&['insertDimension','setDataValidation','repeatCell'].includes(kind)){
      loc=x.range;notasAssert(loc&&Object.keys(x).every(function(k){return ['range','inheritFromBefore','rule','cell','fields'].includes(k);}), 'Operação de catálogo inválida.');
      if(kind==='repeatCell')notasAssert(x.fields==='userEnteredValue','Máscara de catálogo proibida.');
    }else webFail('Operação de escrita não permitida.');
    notasAssert(loc&&Number.isInteger(loc.sheetId)&&allowed[loc.sheetId]&&loc.sheetId!==blocked,'Escrita cadastral proibida (INV-MAT-01).');
  });
  return Sheets.Spreadsheets.batchUpdate({requests:requests},config.id);
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
    notasAssert(['manual','web-a05-submission-v2','web-a05-submission-v3','web-notas-submission-v3'].includes(r[4])&&typeof r[5]==='boolean','Contrato/flag de atividade inválidos.');
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
  var unique=notasRosterIndex_(book),roster=book.sheets[notasActivity(book,n).title];
  n.identity.members.forEach(function(m,i){
    var saved=notasStudent_(unique,m.enrollment,i);
    if(saved.row[1]!==m.name)notasErr('CONFIRMACAO_DESATUALIZADA',i,'enrollment','Cadastro atualizado pelo professor.','Consulte e confirme novamente.');
    // Equal names with distinct pre-registered enrollments are legitimate.
    roster.rows.forEach(function(row,j){if(j>0&&row&&row[1]===m.enrollment&&row[0]!==m.name)
      notasErr('VINCULO_DOCENTE_PENDENTE',i,'enrollment','O boletim precisa de conferência docente após atualização cadastral.','Procure o professor. Nenhuma correção automática foi feita.');});
  });return unique;
}

function notasAuditSign(row){
  var data=[row[0],row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],
    row[10],row[13],row[14],row[15],row[16],row[17],row[20],row[21],row[22],row[23],row[24],row[25],row[26]];
  // Preserve a assinatura histórica 3.0.0; versões novas vinculam a pendência.
  if(row[13]!=='web-notas-3.0.0-candidata'){
    notasAssert(typeof row[27]==='boolean','Pendência assinada inválida.');data.push(row[27]);
  }
  return webHex(Utilities.computeHmacSha256Signature(JSON.stringify(data),notasSecret()));
}
function notasVerifyAudit(sheet,i){
  var r=sheet.rows[i],ev;
  notasAssert(r&&r[24]==='NOTAS_V3_PROD','Registro V3 inválido; histórico legado é somente arquivo.');
  try{ev=JSON.parse(r[14]);}catch(e){webFail('JSON armazenado inválido.');}
  notasAssert(notasNoXpKeys(ev)&&typeof r[10]==='number'&&ev.nota===r[10], 'Nota/evidência armazenada inválida.');
  notasAssert(webSha256(r[14])===r[21]&&webSha256(ev.codigoFonteCompleto||'')===r[16]&&notasAuditSign(r)===r[9],
    'Assinatura/hashes da auditoria inválidos.');
  var members;try{members=JSON.parse(r[25]);}catch(e){webFail('Integrantes da auditoria inválidos.');}
  notasAssert(Array.isArray(members)&&members.every(function(m){return typeof m.enrollment==='string'&&(/^[0-9]{8}\.ITA[0-9]{4}$/.test(m.enrollment)||(['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata','web-notas-3.0.2-candidata','web-notas-3.1.0'].includes(r[13])&&/^\d{1,32}$/.test(m.enrollment)))&&notasFullName(m.name);}),
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
    'github-pages-web','', '',names,n.storedHash,nh,n.requestHash,'NOTAS_V3_PROD',
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
  var currentRoster=notasRosterIndex_(book),seenResult=Object.create(null);
  res.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){
    if(!currentRoster[r[0]])notasErr('VINCULO_DOCENTE_PENDENTE',null,null,
      'Há um resultado vinculado a matrícula não presente no cadastro atual.',
      'O professor deve conferir manualmente os vínculos. Nenhuma matrícula ou nota foi remapeada.');
    var k=r[0]+'|'+r[1];notasAssert(!seenResult[k],'Resultado duplicado.');seenResult[k]=i;
    notasGrade(r[2]);var w=notasAuditWinner(aud,r[3],r[0],r[1]);
    notasAssert(w[10]===r[2]&&w[0]===r[4]&&w[8]===r[8], 'Resultado não corresponde ao recibo vencedor.');
  }});
  var seenRoster=Object.create(null);
  roster.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){
    notasAssert(typeof r[1]==='string'&&/^[0-9]{8}\.ITA[0-9]{4}$/.test(r[1]),'Linha sem matrícula válida: reconciliação docente.');
    if(!currentRoster[r[1]])notasErr('VINCULO_DOCENTE_PENDENTE',null,null,
      'Há uma matrícula no boletim que precisa de conferência cadastral docente.',
      'O professor deve conferir os vínculos manualmente antes de reabrir as entregas.');
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
  var nextRoster=notasNewRow(roster,[0,1,2]),nextResult=notasNewRow(res,[0,1]);
  var memberGrades=[],holds=[];
  n.identity.members.forEach(function(m,i){
    notasAssert(!!catalog[m.enrollment],'Matrícula não cadastrada; somente inclusão manual docente.');
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
  return {ok:true,channel:n.contract==='web-a05-submission-v3'?WEB_CFG.channel:'web-notas',nonce:nonce,
    receiptId:entry[7],activity:n.activity,instrument:n.instrument,receivedAt:entry[6],
    teamId:n.identity.teamId,memberCount:n.identity.members.length,answersSha256:entry[8],
    codeSha256:entry[16],storedEvidenceSha256:entry[21],signature:entry[9],grade:null,
    gradeReceived:entry[10],bestGrades:grades.map(function(x){return x.best;}),
    members:JSON.parse(entry[25]),version:WEB_CFG.version,
    status:NOTAS_STATUS,teacherReviewRequired:Boolean(plan.teacherHold),
    warning:plan.teacherHold?'Entrega recebida; avaliação docente preservada e pendente de revisão.':
      'Nota calculada a partir de evidência declarada; sujeito à conferência docente.'};
}
function notasStore(payload,nonce,config){
  notasAssert(payload&&payload.environment==='PROD','Cliente de produção não confirmado. Atualize a página.');
  var n=notasNormalize(payload);notasIdentityAllowed(n.identity,config);notasSecret();notasRateLimit_(n.identity);
  var head=notasReadBook(config,['Atividades']),a=notasCatalog(head.sheets.Atividades)[n.activity];
  notasCheckOpenV3(a,n.activity,n.contract);
  var titles=['Atividades','Auditoria','Equipes','Alunos','Resultados',a.title],before=notasReadBook(config,titles);
  var same=notasRows(before.sheets.Auditoria,22,webSha256(nonce));
  notasAssert(same.length<=1,'Nonce duplicado na auditoria.');
  if(same.length){
    var old=notasVerifyAudit(before.sheets.Auditoria,same[0]);
    if(old[23]!==n.requestHash)notasErr('DUPLICIDADE_TECNICA',null,null,'Este identificador já pertence a outro conteúdo.','Confira o recibo anterior.');
    n.identity.members=JSON.parse(old[25]);
    // Replay mantém token de confirmação expirado válido para RECUPERAR o recibo,
    // mas nunca deve atestar resultado persistido divergente da Auditoria assinada.
    // Não reescrever/conciliar Resultado, boletim ou Alunos neste caminho.
    notasCheckCatalog(before);
    notasRecordIntegrity(before,n,notasActivity(before,n));
    return notasReceipt(n,old,nonce,before,{teacherHold:old[27],replay:true});
  }
  notasHydrate_(before,n);
  var plan=notasPlan(before,n,nonce),after,rosterBefore=JSON.stringify(before.sheets.Alunos);
  if(plan.requests.length){
    // Reject bad destinations BEFORE the network-uncertainty catch.
    try{notasCommit_(before,plan.requests,config,'submission');}
    catch(e){try{after=notasReadBook(config,titles);notasVerifyWrites(after,plan);}
      catch(unconfirmed){webFail('Envio sem confirmação. Confira os recibos antes de repetir o POST.');}}
  }
  after=after||notasReadBook(config,titles);notasVerifyWrites(after,plan);
  notasAssert(JSON.stringify(after.sheets.Alunos)===rosterBefore,'Cadastro mudou durante a entrega. Consulte o professor antes de reenviar.');
  notasCheckCatalog(after);notasCheckIdentity(after,n);notasRecordIntegrity(after,n,plan.act);
  return notasReceipt(n,plan.entry,nonce,after,plan);
}

function webReturn(result){var safe=JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e')
    .replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return HtmlService.createHtmlOutput('<!doctype html><html><meta charset="utf-8"><body><script>top.postMessage('
    +safe+',"'+WEB_CFG.origin+'");</scr'+'ipt></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet(e){
  var c=notasConfig();
  if(e&&e.parameter&&e.parameter.action==='health'){
    var nonce=String(e.parameter.nonce||'');
    if(!/^[A-Za-z0-9-]{12,90}$/.test(nonce))return ContentService.createTextOutput('Requisição inválida.').setMimeType(ContentService.MimeType.TEXT);
    var active=false;
    try{if(c.enabled){var b=notasReadBook(c,['Atividades']),a=notasCatalog(b.sheets.Atividades)[WEB_CFG.activity];
      active=!!(a&&a.contract==='web-a05-submission-v3'&&a.enabled&&!PropertiesService.getScriptProperties().getProperty(notasClosedKeyV3(WEB_CFG.activity)));}}
    catch(error){active=false;}
    return webReturn({ok:true,channel:'web-status-aula05',nonce:nonce,version:WEB_CFG.version,
      mode:'PROD',enabled:active,activity:WEB_CFG.activity});
  }
  return ContentService.createTextOutput('Web '+WEB_CFG.version+' — PROD — recebimento '+
    (c.enabled?'habilitado':'bloqueado')+' — matrícula pré-cadastrada; cadastro somente leitura; notas 0–10 e maior nota')
    .setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e){var nonce='',channel=WEB_CFG.channel,held=false,lock=null;
  try{
    notasAssert(e&&e.parameter,'Requisição ausente.');nonce=webText(e.parameter.nonce,90,'nonce');
    notasAssert(/^[A-Za-z0-9-]{12,90}$/.test(nonce),'Nonce inválido.');
    var raw=e.parameter.payload;notasAssert(typeof raw==='string'&&raw.length<=WEB_CFG.maxPayloadChars,'Payload inválido.');
    var payload;try{payload=JSON.parse(raw);}catch(error){webFail('JSON inválido.');}
    notasAssert(payload&&typeof payload==='object'&&!Array.isArray(payload),'Requisição inválida.');
    if(payload.operation==='lookupStudent')channel='web-roster-lookup-aula05';
    else if(payload.operation!=='submitTeam')notasErr('OPERACAO_NAO_PERMITIDA',null,null,'Operação não permitida.','Atualize a página. O cadastro é somente leitura.');
    else if(payload.schema==='web-notas-submission-v3')channel='web-notas';
    var cfg=notasConfig();notasAssert(cfg.enabled,'Recebimento de atividades bloqueado pelo professor.');
    lock=LockService.getScriptLock();lock.waitLock(20000);held=true;
    cfg=notasConfig();notasAssert(cfg.enabled,'Recebimento de atividades bloqueado pelo professor.');
    return webReturn(payload.operation==='lookupStudent'?notasLookup_(payload,nonce,cfg):notasStore(payload,nonce,cfg));
  }catch(err){return webReturn({ok:false,channel:channel,nonce:nonce,
    code:err.publicCode||'ENVIO_SEM_CONFIRMACAO',memberIndex:Number.isInteger(err.memberIndex)?err.memberIndex:null,
    field:err.field||null,message:err.webPublic?String(err.message).slice(0,220):'Falha interna. Consulte o docente.',
    action:err.action||'Confira a situação com o professor antes de reenviar.',retryable:false});
  }finally{if(held)lock.releaseLock();}
}

function prepararIntegracaoNotasV3(){var cfg=notasConfig(),book=notasReadBook(cfg,['Atividades','Auditoria','Equipes','Alunos','Resultados']);
  notasCheckCatalog(book);var p=PropertiesService.getScriptProperties();
  if(p.getProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED')===null)p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
  if(!p.getProperty('WEB_NOTAS_PROD_HMAC_SECRET'))p.setProperty('WEB_NOTAS_PROD_HMAC_SECRET',
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
    var title=spec.bim+'º Bimestre',book=notasReadBook(c,['Atividades','Alunos',title]);
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
    notasCommit_(book,requests,c,'catalog');
    var after=notasReadBook(c,['Atividades','Alunos',title]),k=notasCatalog(after.sheets.Atividades)[spec.id],ss=after.sheets[title];
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
  return 'WEB_NOTAS_PROD_CLOSED_'+id;
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
  p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
  try{lock.waitLock(20000);held=true;
    p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
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
    var book=notasReadBook(cfg,['Atividades','Alunos']),sheet=book.sheets.Atividades,cat=notasCatalog(sheet);
    notasAssert(cat[id],'Atividade não cadastrada.');
    var rows=notasRows(sheet,0,id);notasAssert(rows.length===1,'Atividade ambígua.');
    notasAssert(sheet.columnCount>=8,'Atividades precisa de colunas G e H livres para encerramento.');
    var existing=p.getProperty(key),stamp=existing?JSON.parse(existing):{at:new Date().toISOString(),reason:reason};
    // Registra bloqueio ANTES da chamada remota: falha de rede não reabre a atividade.
    p.setProperty(key,JSON.stringify(stamp));
    var requests=[notasWrite(sheet,0,6,['Encerrada UTC','Motivo do encerramento']),
      notasWrite(sheet,rows[0],5,[false,stamp.at,stamp.reason])];
    try{notasCommit_(book,requests,cfg,'catalog');}
    catch(e){p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
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
    p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','true');
    var r={status:'QA_LIBERADO',mode:'PROD',enabled:true,production:true};
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

return Object.freeze({notasCommit_:notasCommit_,notasRosterIndex_:notasRosterIndex_,notasLookup_:notasLookup_,notasConfirmation_:notasConfirmation_,WEB_CFG:WEB_CFG,WEB_TASKS:WEB_TASKS,NOTAS_STATUS:NOTAS_STATUS,A_HEADERS:A_HEADERS,R_HEADERS:R_HEADERS,T_HEADERS:T_HEADERS,AU_HEADERS:AU_HEADERS,ACT_HEADERS:ACT_HEADERS,webFail:webFail,webText:webText,webCode:webCode,webSafe:webSafe,webNormalized:webNormalized,webEvidence:webEvidence,webHex:webHex,webSha256:webSha256,notasAssert:notasAssert,notasBlank:notasBlank,notasGrade:notasGrade,notasMax:notasMax,notasMean:notasMean,notasErr:notasErr,notasFullName:notasFullName,notasEnrollment:notasEnrollment,webIdentity:webIdentity,notasAverageFormula:notasAverageFormula,notasConfig:notasConfig,notasSecret:notasSecret,notasSign:notasSign,notasNoXpKeys:notasNoXpKeys,notasIdentityAllowed:notasIdentityAllowed,notasNormalize:notasNormalize,notasColName:notasColName,notasReadBook:notasReadBook,notasHeaders:notasHeaders,notasCatalog:notasCatalog,notasActivity:notasActivity,notasCell:notasCell,notasWrite:notasWrite,notasWriteFormula:notasWriteFormula,notasNewRow:notasNewRow,notasRows:notasRows,notasIndex:notasIndex,notasCheckCatalog:notasCheckCatalog,notasCheckIdentity:notasCheckIdentity,notasAuditSign:notasAuditSign,notasVerifyAudit:notasVerifyAudit,notasAuditEntry:notasAuditEntry,notasTeamKey:notasTeamKey,notasAuditWinner:notasAuditWinner,notasRecordIntegrity:notasRecordIntegrity,notasPlan:notasPlan,notasVerifyWrites:notasVerifyWrites,notasReceipt:notasReceipt,notasStore:notasStore,webReturn:webReturn,doGet:doGet,doPost:doPost,prepararIntegracaoNotasV3:prepararIntegracaoNotasV3,statusIntegracaoNotasV3:statusIntegracaoNotasV3,consultarConflitoDocenteV3:consultarConflitoDocenteV3,cadastrarAtividadeNotasV3:cadastrarAtividadeNotasV3,notasLegacyHoldV3:notasLegacyHoldV3,notasClosedKeyV3:notasClosedKeyV3,notasCheckOpenV3:notasCheckOpenV3,bloquearRecebimentoNotasV3:bloquearRecebimentoNotasV3,encerrarAtividadeNotasV3:encerrarAtividadeNotasV3,encerrarAula05ParaCorrecaoV3:encerrarAula05ParaCorrecaoV3,liberarRecebimentoQAWebV3:liberarRecebimentoQAWebV3,verificarStatusWebV3:verificarStatusWebV3});
})();

/** Nenhuma identidade efetiva isolada autoriza administração remota. */
function webAdminIdentityV3_(bootstrap){
  var active='',effective='';
  try{active=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
      effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();}catch(e){}
  if(!active||!effective||active!==effective)throw new Error('ADMIN_NAO_AUTORIZADO');
  var p=PropertiesService.getScriptProperties(),saved=p.getProperty('WEB_NOTAS_PROD_ADMIN_EMAIL');
  if(saved?active!==saved:!bootstrap)throw new Error('ADMIN_NAO_AUTORIZADO');
  if(!saved)p.setProperty('WEB_NOTAS_PROD_ADMIN_EMAIL',active);
}
function webAdminExecV3_(name,args){webAdminIdentityV3_(false);return WEB_V3_PRIVATE_[name].apply(null,Array.prototype.slice.call(args));}
function doGet(e){return WEB_V3_PRIVATE_.doGet(e);}
function doPost(e){return WEB_V3_PRIVATE_.doPost(e);}
function bloquearRecebimentoProducaoWeb(){return webAdminExecV3_('bloquearRecebimentoNotasV3',arguments);}
function verificarStatusProducaoWeb(){return webAdminExecV3_('verificarStatusWebV3',arguments);}
function consultarConflitoDocenteV3(){return webAdminExecV3_('consultarConflitoDocenteV3',arguments);}
function cadastrarAtividadeNotasV3(){return webAdminExecV3_('cadastrarAtividadeNotasV3',arguments);}
function encerrarAtividadeNotasV3(){return webAdminExecV3_('encerrarAtividadeNotasV3',arguments);}
function encerrarAula05ParaCorrecaoV3(){return webAdminExecV3_('encerrarAula05ParaCorrecaoV3',arguments);}
function bloquearRecebimentoNotasV3(){return bloquearRecebimentoProducaoWeb();}
/** Executar uma vez no editor do proprietário; repetir é seguro e não apaga notas. */
function ativarProducaoWeb(){
  webAdminIdentityV3_(true);
  var p=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock(),held=false;
  p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');
  p.setProperty('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
  try{
    lock.waitLock(20000);held=true;
    var api=WEB_V3_PRIVATE_,cfg=api.notasConfig();
    var book=api.notasReadBook(cfg,['Atividades','Auditoria','Equipes','Alunos','Resultados',
      '1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre']);
    api.notasHeaders(book.sheets.Auditoria,api.AU_HEADERS);api.notasHeaders(book.sheets.Equipes,api.T_HEADERS);
    api.notasHeaders(book.sheets.Alunos,api.A_HEADERS);api.notasHeaders(book.sheets.Resultados,api.R_HEADERS);
    api.notasCheckCatalog(book);api.notasRosterIndex_(book);
    var a05=api.notasCatalog(book.sheets.Atividades)[api.WEB_CFG.activity];
    if(!a05||a05.contract!=='web-a05-submission-v3')throw new Error('CONTRATO_AULA05_PENDENTE: atualizar manualmente Atividades E3 para web-a05-submission-v3 antes da ativação.');
    var hasAudit=book.sheets.Auditoria.rows.some(function(r,i){return i>0&&r&&!api.notasBlank(r[7]);});
    var key=p.getProperty('WEB_NOTAS_PROD_HMAC_SECRET');
    if(!key){if(hasAudit)throw new Error('CHAVE_AUSENTE_COM_HISTORICO: não gerar outra chave.');
      key=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
      p.setProperty('WEB_NOTAS_PROD_HMAC_SECRET',key);}
    api.notasSecret();
    book.sheets.Auditoria.rows.forEach(function(r,i){if(i>0&&r&&!api.notasBlank(r[7]))api.notasVerifyAudit(book.sheets.Auditoria,i);});
    var catalog=api.notasCatalog(book.sheets.Atividades);
    if(!Object.keys(catalog).some(function(id){return catalog[id].enabled&&!p.getProperty(api.notasClosedKeyV3(id));}))
      throw new Error('NENHUMA_ATIVIDADE_ABERTA');
    p.setProperty('WEB_NOTAS_PROD_SPREADSHEET_ID',api.WEB_CFG.spreadsheetId);
    p.setProperty('WEB_NOTAS_PROD_MODE','PROD');
    p.setProperty('WEB_NOTAS_PROD_SECURITY_READY','true');
    p.setProperty('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','true');
    var result={status:'WEB_PRODUCAO_ATIVADA',version:api.WEB_CFG.version,mode:'PROD',enabled:true,
      spreadsheetId:api.WEB_CFG.spreadsheetId,studentLogin:false};
    console.log('WEB_PRODUCAO '+JSON.stringify(result));return result;
  }finally{if(held)lock.releaseLock();}
}
