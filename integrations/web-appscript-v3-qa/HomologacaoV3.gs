/** Homologação REAL no runtime Apps Script, com planilha QA. NÃO é POST HTTP. */
function executarHomologacaoMatriculasV3(){
  webAdminIdentityV3_(false);
  var WEB_CFG=WEB_V3_PRIVATE_.WEB_CFG,WEB_TASKS=WEB_V3_PRIVATE_.WEB_TASKS,webSha256=WEB_V3_PRIVATE_.webSha256,notasAssert=WEB_V3_PRIVATE_.notasAssert,notasConfig=WEB_V3_PRIVATE_.notasConfig,notasReadBook=WEB_V3_PRIVATE_.notasReadBook,notasRows=WEB_V3_PRIVATE_.notasRows;

  var cfg=notasConfig(),props=PropertiesService.getScriptProperties(),summary=null;
  notasAssert(cfg.mode==='QA'&&cfg.id===WEB_CFG.spreadsheetId,'Destino QA inválido.');
  notasAssert(!cfg.enabled,'Bloqueie primeiro o recebimento para iniciar a homologação.');
  prepararIntegracaoNotasV3();
  var run=props.getProperty('WEB_NOTAS_V3_QA_RUN');
  if(!run){run=Utilities.getUuid();props.setProperty('WEB_NOTAS_V3_QA_RUN',run);}
  var team1=run,team2=props.getProperty('WEB_NOTAS_V3_QA_TEAM2');
  if(!team2){team2=Utilities.getUuid();props.setProperty('WEB_NOTAS_V3_QA_TEAM2',team2);}
  var names=[{name:'Ana Teste Ficticio',enrollment:'00001234'},{name:'Bruno Teste Ficticio',enrollment:'00005678'}];
  var previous=JSON.stringify(notasReadBook(cfg,['1º Bimestre','2º Bimestre','3º Bimestre']));
  function event(stage,tasks,group){
    var sum=0,exercises=WEB_TASKS.map(function(t){var done=tasks.indexOf(t[0])!==-1;sum+=done?t[1]:0;
      return {id:t[0],maximoXp:t[1],xp:done?t[1]:0,estado:done?'APROVADO':'PENDENTE',comentario:''};});
    return {parameter:{nonce:'qa-v3-'+run+'-'+stage,payload:JSON.stringify({schema:'web-a05-submission-v2',activity:WEB_CFG.activity,
      identity:{team:group===1?'Equipe QA Alfa':'Equipe QA Beta',teamId:group===1?team1:team2,members:names},
      evidence:{schema:WEB_CFG.schema,tipo:'formativo-nao-e-nota',xp:sum,maximoXp:100,exercicios:exercises,
        observacao:'HOMOLOGACAO SINTETICA V3',testeNativoPendente:'',codigoFonteCompleto:'export default function App(){return null;}'}})}};
  }
  function send(e){
    var html=doPost(e).getContent(),match=html.match(/top\.postMessage\((\{[\s\S]*\}),"https:\/\/thalesvalente\.github\.io"\)/);
    notasAssert(match,'Resposta Apps Script não reconhecida.');return JSON.parse(match[1]);
  }
  function accepted(e){var r=send(e);notasAssert(r.ok, r.code||'Homologação recusada.');return r;}
  try{
    liberarRecebimentoQAWebV3();
    var low=event('primeiro',['run'],1),high=event('maior',WEB_TASKS.map(function(t){return t[0];}),2),last=event('menor',['run','map'],1);
    var a=accepted(low),b=accepted(high),c=accepted(last),retry=accepted(high);
    notasAssert(a.gradeReceived===0.5&&b.gradeReceived===10&&c.gradeReceived===1,'Notas recebidas divergentes.');
    notasAssert(c.bestGrades.every(function(g){return g===10;}),'Maior nota não preservada.');
    notasAssert(b.receiptId===retry.receiptId&&b.signature===retry.signature&&b.teacherReviewRequired===retry.teacherReviewRequired,'Retry diferente do recibo original.');
    var bad=event('conflito',['run'],1),payload=JSON.parse(bad.parameter.payload);payload.identity.members[0].enrollment='99990000';
    bad.parameter.payload=JSON.stringify(payload);
    var beforeReject=JSON.stringify(notasReadBook(cfg,['Alunos','Resultados','Auditoria','Equipes','4º Bimestre'])),err=send(bad);
    notasAssert(!err.ok&&err.code==='NOME_MATRICULA_DIVERGENTE','Conflito não detectado.');
    notasAssert(beforeReject===JSON.stringify(notasReadBook(cfg,['Alunos','Resultados','Auditoria','Equipes','4º Bimestre'])),'Conflito alterou a planilha.');
    var book=notasReadBook(cfg,['4º Bimestre','Auditoria']),roster=book.sheets['4º Bimestre'],audit=book.sheets.Auditoria;
    names.forEach(function(m){var rows=notasRows(roster,1,m.enrollment);notasAssert(rows.length===1,'Matrícula duplicada no boletim.');
      notasAssert(roster.rows[rows[0]][3]===10&&roster.rows[rows[0]][4]===10,'Nota/média incorreta.');});
    [low,high,last].forEach(function(e){notasAssert(notasRows(audit,22,webSha256(e.parameter.nonce)).length===1,'Tentativa duplicada na Auditoria.');});
    notasAssert(previous===JSON.stringify(notasReadBook(cfg,['1º Bimestre','2º Bimestre','3º Bimestre'])),'Bimestres anteriores alterados.');
    summary={status:'QA_V3_APPS_SCRIPT_PASS_SCOPED',version:WEB_CFG.version,spreadsheetId:cfg.id,
      postRealHttp:false,attempts:3,students:2,bestGrade:10,average:10,identityConflict:'REJEITADO_SEM_ESCRITA',
      otherBimesters:'PRESERVADOS',replay:'IDEMPOTENTE'};
  }finally{bloquearRecebimentoNotasV3();}
  summary.recebimentoFinal='BLOQUEADO';console.log('WEB_V3_QA_RESULTADO '+JSON.stringify(summary));return summary;
}
