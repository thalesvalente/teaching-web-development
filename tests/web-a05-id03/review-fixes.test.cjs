'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,TASKS}=require('./harness-v3.cjs');
const full=TASKS.map(t=>t[0]),id='WEB-AULA05-2026';
const ok=(f,e)=>{const r=f.receive(e);assert.equal(r.ok,true,JSON.stringify(r));return r;};
const denied=(f,e,code)=>{const s=f.snapshot(),b=f.batches(),r=f.receive(e);assert.equal(r.ok,false);if(code)assert.equal(r.code,code);assert.equal(f.snapshot(),s);assert.equal(f.batches(),b);return r;};
test('P2: replay preserva pendência docente e aviso assinado',()=>{
 const f=fixture();ok(f,f.event(['run']));f.set('Resultados',2,7,'VALIDADO_DOCENTE');
 const e=f.event(full),r=ok(f,e),before=f.snapshot(),count=f.batches(),again=ok(f,e);
 assert.equal(r.teacherReviewRequired,true);assert.equal(again.teacherReviewRequired,true);
 assert.equal(again.warning,r.warning);assert.equal(again.receiptId,r.receiptId);assert.equal(again.signature,r.signature);
 assert.equal(f.value('Auditoria',3,28),true);assert.equal(f.batches(),count);assert.equal(f.snapshot(),before);
});
test('P2: pendência permanece no replay mesmo após liberação posterior do parecer',()=>{
 const f=fixture();ok(f,f.event(['run']));f.set('Resultados',2,7,'VALIDADO_DOCENTE');const e=f.event(full);ok(f,e);
 f.set('Resultados',2,7,f.ctx.NOTAS_STATUS);assert.equal(ok(f,e).teacherReviewRequired,true);
});
test('P2: alterar pendência assinada é detectado',()=>{
 const f=fixture();const e=f.event();ok(f,e);f.set('Auditoria',2,28,true);denied(f,e);
});
test('Recibos 3.0.0 legados mantêm assinatura e aviso por releitura conservadora',()=>{
 const f=fixture(),e=f.event(['run']);ok(f,e);f.set('Auditoria',2,14,'web-notas-3.0.0-candidata');f.set('Auditoria',2,28,null);
 const row=Array.from({length:28},(_,i)=>f.value('Auditoria',2,i+1));f.set('Auditoria',2,10,f.ctx.notasAuditSign(row));
 f.set('Resultados',2,7,'VALIDADO_DOCENTE');const before=f.snapshot();assert.equal(ok(f,e).teacherReviewRequired,true);assert.equal(f.snapshot(),before);
});
test('Fechamento da atividade bloqueia POST, replay e preserva nota manual',()=>{
 const f=fixture(),e=f.event(['run']);ok(f,e);const closed=f.ctx.encerrarAtividadeNotasV3(id,'Correção docente');
 assert.equal(closed.status,'ATIVIDADE_ENCERRADA_CONFIRMADA');assert.equal(f.value('Atividades',3,6),false);
 f.set('4º Bimestre',2,4,8.5);denied(f,f.event(full),'ATIVIDADE_ENCERRADA');denied(f,e,'ATIVIDADE_ENCERRADA');
 assert.equal(f.value('4º Bimestre',2,4),8.5);assert.equal(f.locks(),0);
});
test('Nova atividade aberta não reabre atividade corrigida',()=>{
 const f=fixture();ok(f,f.event());f.configureY();f.ctx.encerrarAtividadeNotasV3(id,'Correção docente');
 f.set('4º Bimestre',2,4,8.5);f.ctx.liberarRecebimentoQAWebV3();ok(f,f.eventY(6));
 denied(f,f.event(full),'ATIVIDADE_ENCERRADA');assert.equal(f.value('4º Bimestre',2,4),8.5);assert.equal(f.value('4º Bimestre',2,6),7.25);
});
test('Marcar Habilitada=true manualmente não remove fechamento permanente',()=>{
 const f=fixture();f.ctx.encerrarAtividadeNotasV3(id,'Correção docente');f.set('Atividades',3,6,true);denied(f,f.event(),'ATIVIDADE_ENCERRADA');
});
test('Fechamento repetido conserva timestamp e motivo inicial',()=>{
 const f=fixture(),a=f.ctx.encerrarAtividadeNotasV3(id,'Correção inicial'),stamp=f.value('Atividades',3,7);
 const b=f.ctx.encerrarAtividadeNotasV3(id,'Segunda chamada');assert.equal(a.closedAt,b.closedAt);assert.equal(f.value('Atividades',3,7),stamp);assert.equal(f.value('Atividades',3,8),'Correção inicial');
});
test('Falha de gravação do fechamento bloqueia globalmente e preserva tombstone',()=>{
 const f=fixture();f.mode('before');assert.throws(()=>f.ctx.encerrarAtividadeNotasV3(id,'Correção docente'),/Bloqueio mantido/);
 assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');assert.ok(f.props.get('WEB_NOTAS_V3_CLOSED_'+id));
 f.mode('');f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','true');denied(f,f.event(),'ATIVIDADE_ENCERRADA');
 assert.equal(f.ctx.encerrarAtividadeNotasV3(id,'Correção docente').status,'ATIVIDADE_ENCERRADA_CONFIRMADA');
});
test('Bloqueio global é relido após obtenção do lock',()=>{
 const f=fixture(),old=f.ctx.LockService.getScriptLock;f.ctx.LockService.getScriptLock=()=>{
   const lock=old();return{waitLock(t){lock.waitLock(t);f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');},releaseLock(){lock.releaseLock();}};
 };
 denied(f,f.event());assert.equal(f.locks(),0);
});
test('Bloqueio para correção drena o escritor e não toca nas notas',()=>{
 const f=fixture();ok(f,f.event(['run']));const snapshot=f.snapshot();assert.equal(f.ctx.bloquearRecebimentoNotasV3().status,'BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO');
 assert.equal(f.snapshot(),snapshot);denied(f,f.event(full));assert.equal(f.locks(),0);
});
test('Timeout aguardando bloqueio mantém flag false, sem prometer drenagem',()=>{
 const f=fixture();f.mode('lock');assert.throws(()=>f.ctx.bloquearRecebimentoNotasV3());assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');
});
test('Sem atividades abertas não se libera recepção QA',()=>{
 const f=fixture();f.ctx.encerrarAula05ParaCorrecaoV3();assert.throws(()=>f.ctx.liberarRecebimentoQAWebV3(),/Nenhuma atividade aberta/);
 assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');
});
test('Fechamento não altera bimestres, resultados ou auditoria de entregas',()=>{
 const f=fixture();ok(f,f.event());const before=f.state();f.ctx.encerrarAula05ParaCorrecaoV3();const after=f.state();
 for(const name of ['1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre','Resultados','Auditoria','Alunos','Equipes'])assert.deepEqual(after[name],before[name]);
});
test('Sobrenome abreviado também é recusado diretamente no servidor',()=>{
 const f=fixture();const raw=f.identity();raw.members[0].name='Ana B';assert.throws(()=>f.ctx.webIdentity(raw),/nome completo/);
 raw.members[0].name="João D'Ávila";assert.equal(f.ctx.webIdentity(raw).members[0].name,"João D'Ávila");
});
test('Instrumento de homologação usa mesma matrícula entre equipes, conflito sem escrita e bloqueio final',()=>{
 const f=fixture(),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../integrations/web-appscript-v3-qa/HomologacaoV3.gs'),'utf8'),f.ctx);
 const original=f.ctx.doPost;f.ctx.doPost=e=>{const r=original(e);return{getContent:()=>r.html};};
 f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');const r=f.ctx.executarHomologacaoMatriculasV3();
 assert.equal(r.status,'QA_V3_APPS_SCRIPT_PASS_SCOPED');assert.equal(r.postRealHttp,false);assert.equal(r.recebimentoFinal,'BLOQUEADO');
 assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');const saved=f.snapshot();
 f.ctx.executarHomologacaoMatriculasV3();assert.equal(f.snapshot(),saved,'rodada repetida não duplica');
});
test('Instrumento deixa recepção bloqueada também quando há erro',()=>{
 const f=fixture(),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../integrations/web-appscript-v3-qa/HomologacaoV3.gs'),'utf8'),f.ctx);
 f.ctx.doPost=()=>{throw Error('falha controlada');};f.props.set('WEB_NOTAS_V3_SUBMISSIONS_ENABLED','false');
 assert.throws(()=>f.ctx.executarHomologacaoMatriculasV3(),/falha controlada/);assert.equal(f.props.get('WEB_NOTAS_V3_SUBMISSIONS_ENABLED'),'false');
});
