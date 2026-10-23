/**
 * IFMA · Desenvolvimento de Sistemas Web · 2026.2
 * Receptor de evidências do Laboratório Vivo — Aula 05.
 * V1.1.0: identificação da equipe por nomes, sem matrícula ou turma; registro FORMATIVO.
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
  version: 'web-entregas-1.1.0',
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
  ['1º Bimestre',['Aluno','ID equipe (automático)','Equipe','Média /10']],
  ['2º Bimestre',['Aluno','ID equipe (automático)','Equipe','Média /10']],
  ['3º Bimestre',['Aluno','ID equipe (automático)','Equipe','Aula 04 E3-I1 /2,5','Média /10']],
  ['4º Bimestre',['Aluno','ID equipe (automático)','Equipe','Aula 05 XP formativo /100','Média /10']],
  ['Auditoria',['Equipe','ID equipe (automático)','Integrantes (nomes)','Atividade','Instrumento',
    'Data/hora BRT','Recebido UTC','ID entrega','SHA-256 evidência',
    'Assinatura HMAC','XP declarado /100','Nota oficial /10',
    'Situação','Rubrica/versão','JSON evidência','Chave interna',
    'Código SHA-256','Origem','Observação docente','Revisado UTC',
    'Lista de integrantes da equipe']],
  ['Equipes',['Equipe','Integrantes (nomes)','Quantidade','Atividade',
    'XP formativo /100','Situação','Recibo','Enviado UTC',
    'Chave da equipe','SHA-256 evidência','Observação docente','Revisado UTC']]
]);
function webFail(message) { throw new Error(message); }
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
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g,' ').toLowerCase();
}
/**
 * Identificação coletiva: só nome da equipe e nomes dos integrantes.
 * teamId é gerado no browser e preservado no JSON de continuidade.
 * É uma chave de upsert, NÃO prova de identidade ou autoria.
 */
function webIdentity(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))
    webFail('Identificação da equipe ausente.');
  var team=webText(input.team,80,'nome da equipe');
  if(team.length<3)webFail('Informe nome da equipe com pelo menos três caracteres.');
  var teamId=webText(input.teamId,36,'identificador da equipe');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId))
    webFail('Código automático da equipe inválido. Salve e recarregue o progresso.');
  if(!Array.isArray(input.members)||input.members.length<1||input.members.length>8)
    webFail('Informe de um a oito integrantes da equipe.');
  var seen={},members=input.members.map(function(member,index){
    if(!member||typeof member!=='object'||Array.isArray(member))
      webFail('Integrante inválido '+(index+1)+'.');
    var name=webText(member.name,100,'nome do integrante');
    if(!/^[\p{L}][\p{L}\p{M} .'\-]{2,99}$/u.test(name)||
       name.split(/\s+/).filter(Boolean).length<2)
      webFail('Informe nome e sobrenome do integrante '+(index+1)+'.');
    var key=webNormalized(name);
    if(seen[key])webFail('Integrante repetido: '+name+'.');
    seen[key]=true;
    return {name:name};
  });
  return {team:team,teamId:teamId,members:members};
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
/**
 * Uma linha por integrante nas abas bimestrais, identificada pelo nome
 * normalizado + ID automático da equipe. Nenhuma matrícula é coletada.
 * O identificador é de equipe (não pessoal) e viaja no checkpoint JSON.
 */
function webMemberRow(sheet,teamId,name) {
  var last=sheet.getLastRow();
  if(last<2)return 0;
  var rows=sheet.getRange(2,1,last-1,3).getDisplayValues();
  var normalized=webNormalized(name);
  for(var i=0;i<rows.length;i++) {
    if(String(rows[i][1]||'').trim()===teamId &&
       webNormalized(rows[i][0])===normalized)return i+2;
  }
  return 0;
}
function webRosterUpsert(book,identity,xp) {
  WEB_TABS.slice(0,4).forEach(function(tab){
    var sheet=book.getSheetByName(tab[0]);
    identity.members.forEach(function(member){
      var row=webMemberRow(sheet,identity.teamId,member.name)||webNextRow(sheet);
      sheet.getRange(row,2).setNumberFormat('@');
      sheet.getRange(row,1,1,3).setValues([
        [webSafe(member.name),identity.teamId,webSafe(identity.team)]
      ]);
      if(tab[0]==='4º Bimestre')sheet.getRange(row,4).setValue(xp);
      // A nota E3-I1 da Aula 04 é exclusivamente docente.
      sheet.getRange(row,tab[1].length).setFormula(webAverageFormula(tab[0],row));
    });
    var last=sheet.getLastRow();
    if(last>2) {
      sheet.getRange(2,1,last-1,tab[1].length)
        .sort([{column:1,ascending:true},{column:2,ascending:true}]);
      var formulas=[];
      for(var r=2;r<=last;r++)formulas.push([webAverageFormula(tab[0],r)]);
      sheet.getRange(2,tab[1].length,last-1,1).setFormulas(formulas);
    }
  });
}
function webAuditUpsert(book,identity,evidence,meta) {
  var sheet=book.getSheetByName('Auditoria');
  var key=identity.enrollment+'|'+WEB_CFG.activity;
  // getLastRow() inclui metadados permanentes nas colunas V:Y (linhas 1–6).
  // Nunca ordenar linhas vazias A:T somente porque esses metadados existem.
  var last=sheet.getLastRow(),row=0,occupied=0;
  if(last>=2){
    var keys=sheet.getRange(2,16,last-1,1).getDisplayValues();
    for(var i=0;i<keys.length;i++){
      var current=String(keys[i][0]||'').trim();
      if(!current) continue;
      if(i!==occupied) webFail('Auditoria com lacunas: revise as linhas antes de receber novas entregas.');
      occupied++;
      if(current===key) row=i+2;
    }
  }
  if(!row) row=2+occupied;
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
  // Somente linhas com chave de entrega são classificadas.
  // S/T seguem cada estudante; metadados V:Y ficam inalterados.
  var records=occupied+(row===occupied+2?1:0);
  if(records>1)sheet.getRange(2,1,records,20).sort([{column:1,ascending:true},{column:2,ascending:true}]);
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
    '<script>top.postMessage('+safe+',"https://thalesvalente.github.io");</scr'+'ipt>'+
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
/**
 * Executar UMA VEZ no editor Apps Script aberto por Extensões → Apps Script
 * da planilha de Desenvolvimento Web. Não escreve dados de alunos.
 * Cria somente a flag deny-by-default quando ainda não existir.
 * Não publica o Web App, não ativa recebimento e não divulga credenciais.
 */
function prepararIntegracaoWeb() {
  var book=webSpreadsheet();
  webCheckSchema(book);
  // Evita colar o Code.gs por engano na planilha Mobile/PPI.
  var active=typeof SpreadsheetApp.getActiveSpreadsheet==='function'
    ? SpreadsheetApp.getActiveSpreadsheet() : null;
  if(active && typeof active.getId==='function' &&
     active.getId()!==WEB_CFG.spreadsheetId)
    webFail('Script vinculado à planilha errada. Abra Extensões → Apps Script na planilha de Web.');

  var props=PropertiesService.getScriptProperties();
  var flag=props.getProperty('WEB_WEB_SUBMISSIONS_ENABLED');
  if(flag===null || flag==='') {
    props.setProperty('WEB_WEB_SUBMISSIONS_ENABLED','false');
    flag='false';
  } else if(flag!=='false' && flag!=='true') {
    webFail('WEB_WEB_SUBMISSIONS_ENABLED deve ser literalmente true ou false.');
  }
  var sum=WEB_TASKS.reduce(function(total,t){return total+t[1];},0);
  if(sum!==100)webFail('Catálogo de XP Web não soma 100.');
  var result='WEB_SETUP_PASS | planilha '+book.getName()+
    ' | '+WEB_TABS.length+' abas | '+WEB_TASKS.length+' missões | '+sum+
    ' XP formativos | recebimento '+(flag==='true'?'HABILITADO':'BLOQUEADO')+
    ' | publicação /exec ainda exige implantação explícita';
  Logger.log(result);
  return result;
}

/**
 * Diagnóstico de leitura: não habilita POST e não grava entregas.
 * Pode ser executado a qualquer momento pelo docente no Apps Script.
 */
function statusIntegracaoWeb() {
  var book=webSpreadsheet();
  webCheckSchema(book);
  var active=PropertiesService.getScriptProperties()
    .getProperty('WEB_WEB_SUBMISSIONS_ENABLED')==='true';
  var result='WEB_STATUS_OK | versão '+WEB_CFG.version+
    ' | planilha '+book.getName()+
    ' | recebimento '+(active?'HABILITADO':'BLOQUEADO')+
    ' | atividade '+WEB_CFG.activity+' | XP não são nota';
  Logger.log(result);
  return result;
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