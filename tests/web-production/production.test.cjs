'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {fixture,TASKS,source}=require('./harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const roster=f=>JSON.stringify(f.state().Alunos);
const single=f=>({...f.identity(),members:[{enrollment:f.roster[0][0]}]});
function send(f,grade=0,identity=f.confirmed(single(f))){return f.receive(f.event(grade===10?TASKS.map(t=>t[0]):grade===.5?['run']:[],identity));}
function rewrite(e,change){const p=JSON.parse(e.parameter.payload);change(p);e.parameter.payload=JSON.stringify(p);return e;}
function readonly(f,fn){const before=roster(f);try{return fn();}finally{assert.equal(roster(f),before,'INV-MAT-01: cadastro mudou');assert.ok(f.captured().every(b=>b.requests.every(r=>!JSON.stringify(r).includes('"sheetId":203'))));}}
function lookupEvent(f,extra={}){return {parameter:{nonce:require('node:crypto').randomUUID(),payload:JSON.stringify({operation:'lookupStudent',environment:'PROD',activity:'WEB-AULA05-2026',teamId:f.identity().teamId,enrollment:f.roster[0][0],...extra})}};}
test('lookup exibe um único nome cadastrado, sem lista, status, notas ou escrita',()=>{const f=fixture();const d=readonly(f,()=>f.lookup(f.roster[0][0]));assert.equal(d.ok,true);assert.equal(d.name,f.roster[0][1]);assert.deepEqual(Object.keys(d).sort(),['ok','channel','nonce','version','name','enrollmentCanonical','confirmationToken'].sort());assert.equal(f.batches(),0);});
test('matrícula alfanumérica canonicaliza só entrada sem alterar fonte',()=>{const f=fixture();const d=readonly(f,()=>f.lookup('  '+f.roster[0][0].toLowerCase()+'  '));assert.equal(d.enrollmentCanonical,f.roster[0][0]);assert.equal(f.batches(),0);});
test('prefixos distintos com mesmo sufixo não colidem',()=>{const f=fixture();assert.notEqual(f.lookup(f.roster[0][0]).name,f.lookup(f.roster[2][0]).name);});
for(const id of ['', '9001', '00001234','20999999ITA9001','20999999.ITA9001x','20999999.ITA9001\nX','20999999.ITA9998'])test('entrada inexistente/inválida '+JSON.stringify(id)+' não cadastra',()=>{const f=fixture();assert.equal(readonly(f,()=>f.lookup(id)).ok,false);assert.equal(f.batches(),0);});
test('primeiro envio sem login usa nome da planilha e nunca cria Alunos',()=>{const f=fixture({activeEmail:'',effectiveEmail:'owner@example.test'});const d=readonly(f,()=>send(f,.5));assert.equal(d.ok,true);assert.equal(d.gradeReceived,.5);assert.equal(f.value('4º Bimestre',2,2),f.roster[0][0]);assert.equal(f.value('4º Bimestre',2,1),f.roster[0][1]);assert.equal(f.value('Alunos',2,4),'VALIDADO_DOCENTE');assert.equal(d.grade,null);});
test('nomes iguais em matrículas cadastradas distintas são legítimos',()=>{const f=fixture();f.set('Alunos',3,2,f.roster[0][1]);f.set('Alunos',3,3,f.ctx.webNormalized(f.roster[0][1]));const d=readonly(f,()=>f.receive(f.event([],f.confirmed())));assert.equal(d.ok,true);assert.equal(d.members.length,2);assert.equal(d.members[0].name,d.members[1].name);assert.notEqual(d.members[0].enrollment,d.members[1].enrollment);});
test('duplicar matrícula na equipe recusa sem cadastro e sem notas',()=>{const f=fixture();const id=f.confirmed(single(f));id.members.push(clone(id.members[0]));assert.equal(readonly(f,()=>send(f,0,id)).code,'MATRICULA_DUPLICADA_EQUIPE');assert.equal(f.batches(),0);});
for(const operation of ['updateEnrollment','upsertStudent','deleteStudent','importRoster','onEdit','adminUpdate',''])test('operação não autorizada '+operation+' não escreve',()=>{const f=fixture();const e=lookupEvent(f,{operation,newEnrollment:'20999999.ITA9999'});assert.equal(readonly(f,()=>f.receive(e)).code,'OPERACAO_NAO_PERMITIDA');assert.equal(f.batches(),0);});
for(const field of ['name','oldEnrollment','newEnrollment','updatedStudent'])test('payload de entrega rejeita campo cadastral '+field,()=>{const f=fixture();const e=f.event();rewrite(e,p=>p.identity.members[0][field]='IGNORAR');assert.equal(readonly(f,()=>f.receive(e)).code,'OPERACAO_NAO_PERMITIDA');assert.equal(f.batches(),0);});
test('nome, status ou metadado editado manualmente invalida confirmação anterior',()=>{for(const col of [2,4,8]){const f=fixture(),e=f.event();f.set('Alunos',2,col,col===2?'Nome Teste Corrigido':col===4?'BLOQUEADO':'conferido manualmente');if(col===2)f.set('Alunos',2,3,'nome teste corrigido');const snap=roster(f);const d=f.receive(e);assert.equal(d.ok,false);assert.equal(roster(f),snap);assert.equal(f.batches(),0);}});
test('mudança manual de matrícula exige nova consulta, sem remapeamento',()=>{const f=fixture(),e=f.event();f.set('Alunos',2,1,'20999999.ITA9010');assert.equal(readonly(f,()=>f.receive(e)).code,'MATRICULA_NAO_DISPONIVEL');assert.equal(f.batches(),0);});
test('confirmação vencida/forjada ou pertencente a outra equipe recusa',()=>{for(const mode of ['expired','forged','team','false']){const f=fixture(),id=f.confirmed(single(f));if(mode==='expired'){const b=f.ctx.notasReadBook(f.ctx.notasConfig(),['Alunos']);id.members[0].confirmationToken=f.ctx.notasConfirmation_(f.ctx.notasRosterIndex_(b)[f.roster[0][0]],id.teamId,'WEB-AULA05-2026',Date.now()-1);}if(mode==='forged')id.members[0].confirmationToken=String(Date.now()+600000)+'.'+'0'.repeat(64);if(mode==='team')id.teamId='99991111-bbbb-4444-8888-cccc11112222';if(mode==='false')id.members[0].confirmed=false;assert.equal(readonly(f,()=>send(f,0,id)).ok,false);assert.equal(f.batches(),0);}});
test('cadastro com duplicidade ou fórmula recusa sem normalização automática',()=>{for(const change of ['duplicate','formula','numeric','normal']){const f=fixture();if(change==='duplicate')f.set('Alunos',3,1,f.roster[0][0]);if(change==='formula')f.set('Alunos',2,3,'="Nome Teste"',true);if(change==='numeric')f.set('Alunos',2,1,12345);if(change==='normal')f.set('Alunos',2,3,'não normalizado');assert.equal(readonly(f,()=>f.lookup(f.roster[0][0])).ok,false);assert.equal(f.batches(),0);}});
test('maior nota por matrícula sobrevive a reenvio e troca de equipe',()=>{const f=fixture();readonly(f,()=>{assert.equal(send(f,.5).ok,true);const id=single(f);id.team='Equipe Estrela';id.teamId='99991111-bbbb-4444-8888-cccc11112222';assert.equal(send(f,10,f.confirmed(id)).ok,true);assert.equal(send(f,0).ok,true);});assert.equal(f.value('Resultados',2,3),10);assert.equal(f.value('4º Bimestre',2,5),10);assert.equal(f.state()['4º Bimestre'].cells.length,2);assert.equal(f.state().Auditoria.cells.length,4);});
test('replay mesmo nonce preserva recibo, assinatura e não duplica; alteração rejeita',()=>{const f=fixture(),e=f.event();const first=readonly(f,()=>f.receive(e)),b=f.batches();const again=readonly(f,()=>f.receive(e));assert.equal(first.ok,true);assert.equal(again.receiptId,first.receiptId);assert.equal(again.signature,first.signature);assert.equal(f.batches(),b);rewrite(e,p=>p.evidence.observacao='mudança');assert.equal(readonly(f,()=>f.receive(e)).code,'DUPLICIDADE_TECNICA');assert.equal(f.batches(),b);});
test('replay recusa resultado persistido adulterado mesmo com nonce e HMAC original válidos',()=>{const f=fixture(),e=f.event();
  const first=readonly(f,()=>f.receive(e));assert.equal(first.ok,true);
  const batches=f.batches();f.set('Resultados',2,3,9.5);
  const snapshot=f.snapshot(),d=readonly(f,()=>f.receive(e));
  assert.equal(d.ok,false,'replay de nota persistida incompatível não pode retornar sucesso');
  assert.equal(f.batches(),batches,'replay inconsistente não escreve');
  assert.equal(f.snapshot(),snapshot,'replay não reconcilia notas nem cadastro');
});
test('replay recusa nome alterado manualmente no boletim e não corrige cadastro',()=>{const f=fixture(),e=f.event();
  const first=readonly(f,()=>f.receive(e));assert.equal(first.ok,true);
  const batches=f.batches();f.set('4º Bimestre',2,1,'Outra Pessoa Ficticia');
  const snapshot=f.snapshot(),d=readonly(f,()=>f.receive(e));
  assert.equal(d.ok,false,'replay com nome de boletim divergente não pode atestar sucesso');
  assert.equal(f.batches(),batches,'nenhuma escrita em replay inconsistente');
  assert.equal(f.snapshot(),snapshot,'não reconciliar nome ou matrícula por script');
});
test('replay recusa assinatura de Auditoria alterada e não grava ou corrige Alunos',()=>{const f=fixture(),e=f.event();
  assert.equal(readonly(f,()=>f.receive(e)).ok,true);
  const before=f.batches();f.set('Auditoria',2,10,'assinatura-ficticia-corrompida');
  const snapshot=f.snapshot(),d=readonly(f,()=>f.receive(e));
  assert.equal(d.ok,false);
  assert.equal(f.batches(),before);
  assert.equal(f.snapshot(),snapshot);
});
test('replay aceito continua recuperável após expiração da confirmação',()=>{const f=fixture(),e=f.event();const d=f.receive(e);vm.runInContext('Date.now=()=>'+(Date.now()+25*60000),f.ctx);assert.equal(readonly(f,()=>f.receive(e)).receiptId,d.receiptId);});
test('atividade futura recalcula média e não cria outra matrícula',()=>{const f=fixture();assert.equal(send(f,10).ok,true);const before=roster(f);f.configureY();const id=f.confirmed(single(f),'WEB-ATIVIDADE-Y-2026');const d=f.receive(f.eventY(6,4,id));assert.equal(d.ok,true,JSON.stringify(d));assert.equal(f.value('4º Bimestre',2,6),8);assert.equal(roster(f),before);});
test('primeiros três bimestres preservados em envio Aula 05',()=>{const f=fixture(),before=f.state();send(f);const after=f.state();for(let i=1;i<4;i++)assert.deepEqual(after[i+'º Bimestre'],before[i+'º Bimestre']);});
test('evidência persistida não contém XP nem tokens de confirmação',()=>{const f=fixture();send(f,.5);const ev=f.value('Auditoria',2,15);assert.equal(/"(?:xp|maximoXp|confirmationToken)"/.test(ev),false);assert.equal(f.value('Auditoria',2,26).includes('confirmationToken'),false);});
test('equipe com fórmula é gravada como texto, sem executar fórmulas',()=>{const f=fixture(),i=single(f);i.team='=IMPORTXML("x","y")';assert.equal(send(f,.5,f.confirmed(i)).ok,true);assert.ok(f.state().Equipes.cells[1][0].userEnteredValue.stringValue);});
test('limite de consulta não grava PII nas chaves e não modifica cadastro',()=>{const f=fixture();readonly(f,()=>{for(let i=0;i<12;i++)assert.equal(f.lookup(f.roster[0][0]).ok,true);assert.equal(f.lookup(f.roster[0][0]).code,'LIMITE_TEMPORARIO');});assert.ok([...f.cache.keys()].every(k=>!f.roster.some(([id,name])=>k.includes(id)||k.includes(name))));assert.equal(f.batches(),0);});
test('limite de envios é independente da quota de consultas',()=>{const f=fixture(),id=f.confirmed(single(f));readonly(f,()=>{for(let i=0;i<30;i++)assert.equal(send(f,0,id).ok,true);const n=f.batches();assert.equal(send(f,0,id).code,'LIMITE_TEMPORARIO');assert.equal(f.batches(),n);});});
test('health revela somente status e recusa catálogo antigo',()=>{const f=fixture();const parse=()=>JSON.parse(f.ctx.doGet({parameter:{action:'health',nonce:'abcdefghijklmno'}}).html.match(/top\.postMessage\((\{.*\}),/)[1]);let d=parse();assert.equal(d.version,'web-notas-3.2.0');assert.equal(d.enabled,true);assert.deepEqual(Object.keys(d).sort(),['ok','channel','nonce','version','mode','enabled','activity'].sort());f.set('Atividades',3,5,'web-a05-submission-v2');assert.equal(parse().enabled,false);});
test('bloqueio global impede consulta e envio, sem alterar cadastro',()=>{const f=fixture(),e=f.event();f.ctx.bloquearRecebimentoProducaoWeb();assert.equal(readonly(f,()=>f.receive(e)).ok,false);assert.equal(readonly(f,()=>f.lookup(f.roster[0][0])).ok,false);assert.equal(f.batches(),0);});
test('atividade encerrada protege nota manual e matrícula',()=>{const f=fixture();send(f,.5);const e=f.event();readonly(f,()=>f.ctx.encerrarAula05ParaCorrecaoV3());f.set('4º Bimestre',2,4,8.5);assert.equal(readonly(f,()=>f.receive(e)).ok,false);assert.equal(f.value('4º Bimestre',2,4),8.5);});
test('admin anônimo é negado mesmo que implantação execute como proprietário',()=>{const f=fixture({activeEmail:'',effectiveEmail:'owner@example.test',exposeInternals:false});for(const name of ['ativarProducaoWeb','verificarStatusProducaoWeb','bloquearRecebimentoProducaoWeb'])assert.throws(()=>readonly(f,()=>f.ctx[name]()),/ADMIN_NAO_AUTORIZADO/);});
test('ativação idempotente conserva cadastro, segredo e notas',()=>{const f=fixture();f.props.set('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED','false');const a=readonly(f,()=>f.ctx.ativarProducaoWeb());assert.equal(a.enabled,true);send(f,.5);const before=f.snapshot(),key=f.props.get('WEB_NOTAS_PROD_HMAC_SECRET');readonly(f,()=>f.ctx.ativarProducaoWeb());assert.equal(f.snapshot(),before);assert.equal(f.props.get('WEB_NOTAS_PROD_HMAC_SECRET'),key);});
test('ativação com catálogo legado não altera planilha e permanece bloqueada',()=>{const f=fixture();f.set('Atividades',3,5,'web-a05-submission-v2');assert.throws(()=>readonly(f,()=>f.ctx.ativarProducaoWeb()),/CONTRATO_AULA05_PENDENTE/);assert.equal(f.props.get('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED'),'false');assert.equal(f.batches(),0);});
test('histórico sem chave recusa reativação sem substituição de assinatura',()=>{const f=fixture();send(f);f.props.delete('WEB_NOTAS_PROD_HMAC_SECRET');assert.throws(()=>readonly(f,()=>f.ctx.ativarProducaoWeb()),/CHAVE_AUSENTE_COM_HISTORICO/);assert.equal(f.props.get('WEB_NOTAS_PROD_SUBMISSIONS_ENABLED'),'false');});
test('rede falha antes da gravação mantém fonte intacta e não confirma',()=>{const f=fixture(),e=f.event();f.mode('before');assert.equal(readonly(f,()=>f.receive(e)).ok,false);});
test('timeout depois da gravação recupera por leitura sem reescrever cadastro',()=>{const f=fixture(),e=f.event();f.mode('after');assert.equal(readonly(f,()=>f.receive(e)).ok,true);});
test('erro de leitura ou lock não pode produzir escrita cadastral',()=>{for(const mode of ['lock','read']){const f=fixture(),e=f.event();f.mode(mode);assert.equal(readonly(f,()=>f.receive(e)).ok,false);assert.equal(f.locks(),0);assert.equal(f.batches(),0);}});
test('auxiliares e mutadores de matrícula não são RPC públicos',()=>{const f=fixture({exposeInternals:false});for(const name of ['notasStore','notasSecret','notasCommit_','notasLookup_','upsertStudent','updateEnrollment','onEdit'])assert.equal(f.ctx[name],undefined);});
for(const kind of ['updateCells','appendCells','findReplace','deleteDimension','copyPaste','repeatCell','insertDimension','setDataValidation','updateSheetProperties'])test('G9 bloqueia '+kind+' sobre Alunos até em escopo admin',()=>{const f=fixture(),book=f.ctx.notasReadBook(f.ctx.notasConfig(),['Alunos','Atividades','Auditoria','4º Bimestre']);let x={range:{sheetId:203,startRowIndex:1,endRowIndex:2,startColumnIndex:0,endColumnIndex:1}};if(kind==='updateCells')x={start:{sheetId:203,rowIndex:1,columnIndex:0},rows:[{values:[{userEnteredValue:{stringValue:'NEVER'}}]}],fields:'userEnteredValue'};if(kind==='repeatCell')Object.assign(x,{cell:{},fields:'userEnteredValue'});assert.throws(()=>readonly(f,()=>f.ctx.notasCommit_(book,[{[kind]:x}],f.ctx.notasConfig(),'catalog')));assert.equal(f.batches(),0);});
test('G9 fonte tem apenas um gateway Sheets, não grava aluno, não importa cadastro',()=>{assert.equal((source.match(/Sheets\.Spreadsheets\.batchUpdate\(/g)||[]).length,1);assert.equal(/notasWrite\(alunos|nextStudent|SpreadsheetApp|Sheets\.Spreadsheets\.Values\.(update|append)/.test(source),false);});

// Dados exclusivamente sintéticos; espelham regras de grafia, não pessoas reais.
test('nome com conjunção portuguesa e é válido sem regravar cadastro',()=>{
  const f=fixture(),name='Nome Teste e Exemplo';
  f.set('Alunos',2,2,name);f.set('Alunos',2,3,f.ctx.webNormalized(name));
  const initial=roster(f),e=f.event([],f.confirmed(single(f)));
  const d=readonly(f,()=>f.receive(e));assert.equal(d.ok,true,JSON.stringify(d));
  assert.equal(d.members[0].name,name);assert.equal(f.receive(e).receiptId,d.receiptId);
  assert.equal(roster(f),initial);
});
test('retificação manual da chave não duplica notas nem remapeia histórico órfão',()=>{
  const f=fixture(),first=f.event([],f.confirmed(single(f)));
  assert.equal(f.receive(first).ok,true);
  const oldAudit=JSON.stringify(f.state().Auditoria),batches=f.batches();
  f.set('Alunos',2,1,'20999999.ITA9010');
  const id={...f.identity(),members:[{enrollment:'20999999.ITA9010'}]};
  const d=readonly(f,()=>send(f,10,f.confirmed(id)));
  assert.equal(d.ok,false);assert.equal(d.code,'VINCULO_DOCENTE_PENDENTE');
  assert.equal(f.batches(),batches);assert.equal(JSON.stringify(f.state().Auditoria),oldAudit);
  assert.equal(f.state()['4º Bimestre'].cells.length,2);
});

for(const version of ['web-notas-3.0.0-candidata','web-notas-3.0.1-candidata','web-notas-3.0.2-candidata','web-notas-3.1.0']){
  test('leitura do recibo histórico '+version+' conserva matrícula numérica e assinatura',()=>{
    const f=fixture();assert.equal(send(f,.5).ok,true);
    const book=f.ctx.notasReadBook(f.ctx.notasConfig(),['Auditoria']);
    const row=book.sheets.Auditoria.rows[1];row[13]=version;
    row[25]=JSON.stringify([{name:'Nome Teste Historico',enrollment:'00009999'}]);
    row[9]=f.ctx.notasAuditSign(row);
    const before=JSON.stringify(book.sheets.Auditoria.rows),batches=f.batches();
    assert.equal(f.ctx.notasVerifyAudit(book.sheets.Auditoria,1)[13],version);
    assert.equal(JSON.stringify(book.sheets.Auditoria.rows),before);assert.equal(f.batches(),batches);
  });
}
test('matrícula numérica não pode ser introduzida em recibo novo 3.2.0',()=>{
  const f=fixture();assert.equal(send(f,.5).ok,true);
  const book=f.ctx.notasReadBook(f.ctx.notasConfig(),['Auditoria']);
  const row=book.sheets.Auditoria.rows[1];row[25]=JSON.stringify([{name:'Nome Teste Historico',enrollment:'00009999'}]);
  row[9]=f.ctx.notasAuditSign(row);
  assert.throws(()=>f.ctx.notasVerifyAudit(book.sheets.Auditoria,1),/Matrículas da auditoria inválidas/);
});

test('confirmação v2 assinada continua válida após 24h com cadastro intacto, sem nova consulta',()=>{
  const f=fixture(),ident=f.confirmed(single(f));
  const token=ident.members[0].confirmationToken,readsBefore=f.reads(),rosterBefore=roster(f);
  assert.match(token,/^v2\.[a-f0-9]{64}$/);
  const e=f.event(['run'],ident);
  vm.runInContext('Date.now=()=>'+(Date.now()+24*60*60000),f.ctx);
  const d=readonly(f,()=>f.receive(e));
  assert.equal(d.ok,true,JSON.stringify(d));
  assert.equal(d.gradeReceived,.5);
  assert.equal(roster(f),rosterBefore);
  assert.ok(f.reads()>=readsBefore);
  assert.equal(f.value('Resultados',2,3),.5);
});
test('confirmação v2 não pode ser forjada, usada em outra equipe ou reaproveitada após mudança docente',()=>{
  for(const change of ['forged','team','name','state','metadata','newMember']){
    const f=fixture(),ident=f.confirmed(single(f)),before=roster(f);
    if(change==='forged')ident.members[0].confirmationToken='v2.'+'0'.repeat(64);
    if(change==='team')ident.teamId='99991111-bbbb-4444-8888-cccc11112222';
    if(change==='name'){f.set('Alunos',2,2,'Estudante Teste Modificado');f.set('Alunos',2,3,'estudante teste modificado');}
    if(change==='state')f.set('Alunos',2,4,'BLOQUEADO');
    if(change==='metadata')f.set('Alunos',2,8,'revisao do professor');
    if(change==='newMember')ident.members.push({enrollment:f.roster[1][0],confirmationToken:'v2.'+'0'.repeat(64),confirmed:true});
    const current=roster(f),batches=f.batches();
    const d=readonly(f,()=>f.receive(f.event([],ident)));
    assert.equal(d.ok,false,change);
    assert.equal(roster(f),current);
    assert.equal(f.batches(),batches);
  }
});

// QA-CI-GATE: execução técnica isolada do protocolo de confirmação v2. Não integrar esta PR.
