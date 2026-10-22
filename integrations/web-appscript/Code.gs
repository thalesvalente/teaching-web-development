/**
 * IFMA · Desenvolvimento de Sistemas Web · 2026.2
 * Receptor de evidências do Laboratório Vivo — Aula 05.
 * V1.0.0: registro FORMATIVO; não lança nota oficial.
 *
 * Implantar em um projeto Apps Script NOVO, associado à planilha WEB.
 * O script da disciplina Mobile/PPI não deve ser alterado.
 * Publicar com WEB_WEB_SUBMISSIONS_ENABLED=false; habilitar somente
 * após homologação e definição do procedimento de identificação.
 *
 * ATENÇÃO: nome e matrícula fornecidos por formulário público NÃO
 * autenticam uma pessoa. O recebimento é PENDENTE DE VALIDAÇÃO DOCENTE.
 */
var WEB_CFG = Object.freeze({
  spreadsheetId: '1iLx-Tm0EFCsMxqKxbkXAuevJlCzjFAJuRyknbHYlbGM',
  version: 'web-entregas-1.0.0',
  activity: 'WEB-AULA05-2026',
  schema: 'ifma-web-aula05-lab-v4',
  maxPayloadChars: 44000,
  channel: 'web-entrega-aula05'
});
var WEB_TASKS = Object.freeze([
  ['run',5],['map',5],['title',6],['placeholder',6],['limit',12],
  ['maximum',10],['button',7],['error',7],['success',7],['color',6],
  ['trim',8],['invalid',8],['isolation',8],['quiz',5]
]);
var WEB_TABS = Object.freeze([
  ['1º Bimestre',['Aluno','Matrícula','Equipe','Média /10']],
  ['2º Bimestre',['Aluno','Matrícula','Equipe','Média /10']],
  ['3º Bimestre',['Aluno','Matrícula','Equipe','Aula 04 E3-I1 /2,5','Média /10']],
  ['4º Bimestre',['Aluno','Matrícula','Equipe','Aula 05 XP formativo /100','Média /10']],
  ['Auditoria',['Aluno','Matrícula','Equipe','Atividade','Instrumento',
    'Data/hora BRT','Recebido UTC','ID entrega','SHA-256 evidência',
    'Assinatura HMAC','XP declarado /100','Nota oficial /10',
    'Situação','Rubrica/versão','JSON evidência','Chave interna',
    'Código SHA-256','Origem','Observação docente','Revisado UTC']]
]);
function webFail(message) { throw new Error(message); }
function webText(value, max, label) {
  if (typeof value !== 'string' || value.length > max ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value))
    webFail('Campo inválido: ' + label);
  return value.trim();
}
function webSafe(value) {
  var str = String(value === null || value === undefined ? '' : value).trim();
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}
function webNormalized(value) {
  return String(value || '').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g,' ').toLowerCase();
}
function webIdentity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    webFail('Identificação ausente.');
  var name = webText(input.name, 100, 'nome completo');
  if (!/^[\p{L}][\p{L}\p{M} .'\-]{2,99}$/u.test(name) ||
      name.split(/\s+/).filter(Boolean).length < 2)
    webFail('Informe nome e sobrenome.');
  var enrollment = webText(input.enrollment, 30, 'matrícula');
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{4,29}$/.test(enrollment))
    webFail('Informe matrícula/identificador acadêmico válido.');
  var team = webText(input.team || '', 80, 'equipe');
  return {name:name,enrollment:enrollment,team:team};
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
  var source=webText(value.codigoFonteCompleto,30000,'arquivo TSX');
  if (!source) webFail('Código TSX ausente.');
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
function webSecret() {
  var props=PropertiesService.getScriptProperties();
  var current=props.getProperty('WEB_RECEIPT_HMAC_SECRET');
  if (current && current.length >= 48) return current;
  // Segredo apenas no servidor: jamais colocar no frontend ou no GitHub.
  var created=Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  props.setProperty('WEB_RECEIPT_HMAC_SECRET',created);
  return created;
}
function webSign(text) {
  return webHex(Utilities.computeHmacSha256Signature(String(text),webSecret()));
}
function webSpreadsheet() {
  return SpreadsheetApp.openById(WEB_CFG.spreadsheetId);
}
function webCheckHeaders(sheet, expected) {
  if (!sheet) webFail('Aba inexistente na planilha Web.');
  var actual=sheet.getRange(1,1,1,expected.length).getDisplayValues()[0];
  if (JSON.stringify(actual)!==JSON.stringify(expected))
    webFail('Cabeçalhos incompatíveis na aba '+sheet.getName()+'.');
}
function webCheckSchema(book) {
  WEB_TABS.forEach(function(tab){
    webCheckHeaders(book.getSheetByName(tab[0]),tab[1]);
  });
}
function webFindRow(sheet, enrollment, col) {
  var last=sheet.getLastRow();
  if (last<2) return 0;
  var values=sheet.getRange(2,col,last-1,1).getDisplayValues();
  for(var i=0;i<values.length;i++){
    if (String(values[i][0]).trim()===enrollment) return i+2;
  }
  return 0;
}
function webNextRow(sheet) {
  var last=sheet.getLastRow();
  if(last<2) return 2;
  // As quatro abas têm fórmula-modelo na linha 2; aproveitá-la primeiro.
  if(!String(sheet.getRange(2,1).getDisplayValue()).trim())return 2;
  return last+1;
}
function webAverageFormula(title, row) {
  if(title==='3º Bimestre')
    return '=IF(A'+row+'="";"";ROUND(N(D'+row+')*4;2))';
  return '=IF(A'+row+'="";"";0)';
}
function webRosterUpsert(book, identity, xp) {
  WEB_TABS.slice(0,4).forEach(function(tab){
    var sheet=book.getSheetByName(tab[0]);
    var row=webFindRow(sheet,identity.enrollment,2)||webNextRow(sheet);
    sheet.getRange(row,2).setNumberFormat('@');
    sheet.getRange(row,1,1,3).setValues([[webSafe(identity.name),identity.enrollment,webSafe(identity.team)]]);
    if(tab[0]==='4º Bimestre')sheet.getRange(row,4).setValue(xp);
    // A coluna Aula 04 é exclusivamente docente; não é sobrescrita.
    sheet.getRange(row,tab[1].length).setFormula(webAverageFormula(tab[0],row));
    var last=sheet.getLastRow();
    if(last>2)sheet.getRange(2,1,last-1,tab[1].length).sort([{column:1,ascending:true},{column:2,ascending:true}]);
    // Corrigir referências relativas após ordenação das linhas.
    last=sheet.getLastRow();
    if(last>2){
      var formulaRange=sheet.getRange(2,tab[1].length,last-1,1);
      var formulas=[];
      for(var r=2;r<=last;r++)formulas.push([webAverageFormula(tab[0],r)]);
      formulaRange.setFormulas(formulas);
    }
  });
}
function webAuditUpsert(book,identity,evidence,meta) {
  var sheet=book.getSheetByName('Auditoria');
  var key=identity.enrollment+'|'+WEB_CFG.activity;
  var last=sheet.getLastRow(),row=0;
  if(last>=2){
    var keys=sheet.getRange(2,16,last-1,1).getDisplayValues();
    for(var i=0;i<keys.length;i++)if(keys[i][0]===key){row=i+2;break;}
  }
  if(!row)row=webNextRow(sheet);
  sheet.getRange(row,2).setNumberFormat('@');
  // Escrever até R: preservar S/T (observação e revisão DOCENTES).
  var entry=[
    webSafe(identity.name), identity.enrollment, webSafe(identity.team),
    WEB_CFG.activity,'laboratorio-vivo-tsx',
    meta.localTime,meta.utc,meta.receiptId,meta.answersHash,meta.signature,
    evidence.xp,'','RECEBIDO_PENDENTE_VALIDACAO',
    WEB_CFG.version,JSON.stringify(evidence),key,meta.codeHash,'github-pages-web'
  ];
  sheet.getRange(row,1,1,18).setValues([entry]);
  last=sheet.getLastRow();
  if(last>2)sheet.getRange(2,1,last-1,20).sort([{column:1,ascending:true},{column:2,ascending:true}]);
}
function webStore(input, nonce) {
  var book=webSpreadsheet();
  webCheckSchema(book);
  var identity=webIdentity(input.identity);
  if(input.schema!=='web-a05-submission-v1'||input.activity!==WEB_CFG.activity)
    webFail('Atividade ou contrato incompatível.');
  var evidence=webEvidence(input.evidence);
  var canonical=JSON.stringify(evidence);
  var answersHash=webSha256(canonical);
  var codeHash=webSha256(evidence.codigoFonteCompleto);
  var now=new Date(),utc=now.toISOString();
  var receiptId='WEB-'+Utilities.formatDate(now,'UTC','yyyyMMdd-HHmmss')+'-'+nonce.slice(0,8);
  var meta={
    utc:utc,localTime:Utilities.formatDate(now,'America/Fortaleza','yyyy-MM-dd HH:mm:ss'),
    receiptId:receiptId,answersHash:answersHash,codeHash:codeHash
  };
  meta.signature=webSign([receiptId,WEB_CFG.activity,identity.enrollment,
    answersHash,evidence.xp,utc].join('|'));
  webRosterUpsert(book,identity,evidence.xp);
  webAuditUpsert(book,identity,evidence,meta);
  SpreadsheetApp.flush();
  return {
    ok:true,channel:WEB_CFG.channel,nonce:nonce,
    receiptId:receiptId,activity:WEB_CFG.activity,
    instrument:'laboratorio-vivo-tsx',receivedAt:utc,
    answersSha256:answersHash,codeSha256:codeHash,
    xpReported:evidence.xp,grade:null,signature:meta.signature,
    status:'RECEBIDO_PENDENTE_VALIDACAO',
    warning:'XP formativos declarados: não são nota nem comprovação de identidade.'
  };
}
function webReturn(result) {
  // Render HTML para formulário POST direcionado a iframe oculto.
  // String JSON serializada, neutralizando '<' e caracteres perigosos.
  var safe=JSON.stringify(result).replace(/</g,'\\u003c')
    .replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  var html='<!doctype html><html><meta charset="utf-8"><body>'+
    '<script>window.parent.postMessage('+safe+',"https://thalesvalente.github.io");<\/script>'+
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doGet() {
  var enabled=PropertiesService.getScriptProperties()
    .getProperty('WEB_WEB_SUBMISSIONS_ENABLED')==='true';
  return ContentService.createTextOutput(
    'Web — receptor ' + WEB_CFG.version + ' — recebimento ' +
    (enabled?'habilitado (sujeito a validação docente)':'bloqueado')
  ).setMimeType(ContentService.MimeType.TEXT);
}
function doPost(event) {
  var nonce='';
  try {
    if(!event || !event.parameter)webFail('Formulário ausente.');
    nonce=webText(event.parameter.nonce,90,'nonce');
    if(!/^[a-zA-Z0-9-]{12,90}$/.test(nonce))webFail('Identificador de requisição inválido.');
    var raw=event.parameter.payload;
    if(typeof raw!=='string'||raw.length>WEB_CFG.maxPayloadChars)
      webFail('Tamanho ou conteúdo de envio inválido.');
    if(PropertiesService.getScriptProperties()
       .getProperty('WEB_WEB_SUBMISSIONS_ENABLED')!=='true')
      webFail('Recebimento Web ainda não habilitado pelo professor.');
    var parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
      webFail('JSON de entrega inválido.');
    var lock=LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      return webReturn(webStore(parsed,nonce));
    } finally { lock.releaseLock(); }
  }catch(error){
    return webReturn({ok:false,channel:WEB_CFG.channel,nonce:nonce,
      error:String(error&&error.message||'Falha ao receber evidências.').slice(0,240)});
  }
}
function testarConexaoWeb() {
  var book=webSpreadsheet();
  webCheckSchema(book);
  var total=WEB_TASKS.reduce(function(n,v){return n+v[1];},0);
  if(total!==100)webFail('Catálogo de XP incompatível.');
  var sample={schema:WEB_CFG.schema,tipo:'formativo-nao-e-nota',xp:0,maximoXp:100,
    exercicios:WEB_TASKS.map(function(t){return{id:t[0],estado:'PENDENTE',xp:0,maximoXp:t[1]};}),
    observacao:'',testeNativoPendente:'',codigoFonteCompleto:'export default function App() {}'};
  if(webEvidence(sample).xp!==0)webFail('Validação formativa incompatível.');
  Logger.log('Diagnóstico Web: PASS | '+book.getName()+
    ' | 5 abas | 14 missões | POST protegido por flag.');
  return 'Diagnóstico Web: PASS';
}