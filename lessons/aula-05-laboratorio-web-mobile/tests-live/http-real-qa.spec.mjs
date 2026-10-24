import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {loadLiveSettings,expectedGet,mountCandidate,QA_ORIGIN,QA_PATH,fictionalMembers,watchMessages,waitMessage,postAgain,verifyRpcBoundary} from './http-qa-support.mjs';
const settings=loadLiveSettings();
test('HTTP QA V3 — '+settings.phase+' (sem mock de Google)',async({page,context,request},testInfo)=>{
  const summary={phase:settings.phase,runId:settings.runId,postRealHttp:false,production:false,
    readback:'PENDENTE_CONFERENCIA_DOCENTE',closure:'NAO_VERIFICADO',cases:[],receipts:[]};
  const checked=(id)=>summary.cases.push({id,status:'PASS'});
  let submitted=null;
  try{
    const response=await request.get(settings.endpoint,{timeout:30000,maxRedirects:5});
    expect(response.status()).toBe(200);
    expect(expectedGet(await response.text(),settings.phase),'GET deve comprovar V3.0.2 QA e flag prevista').toBe(true);checked('HTTP-01');
    const hashes=await mountCandidate(context,settings);await watchMessages(page);
    page.on('request',req=>{if(req.url()===settings.endpoint&&req.method()==='POST')submitted=new URLSearchParams(req.postData()||'');});
    await page.goto(QA_ORIGIN+QA_PATH+'index.html');
    expect(await page.evaluate(()=>location.origin)).toBe(QA_ORIGIN);
    await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});checked('HTTP-03');
    // Validate security BEFORE any student submission, using {} and read-only status denial.
    summary.security=await verifyRpcBoundary(page,settings.endpoint);checked('SEC-RPC');
    await page.evaluate(({members,runId})=>window.WebTeam.restore({teamId:runId,team:'Equipe QA HTTP',members}),{members:fictionalMembers(),runId:settings.runId});
    await page.locator('#evidence-open').click();
    const sent=page.waitForRequest(req=>req.url()===settings.endpoint&&req.method()==='POST');
    await page.locator('#web-submit').click();await sent;summary.postRealHttp=true;
    expect(submitted?.get('nonce')).toBeTruthy();
    const form=Object.fromEntries(submitted),first=await waitMessage(page,form.nonce);
    if(settings.phase!=='open'){
      expect(first.data.ok).toBe(false);expect(first.data.message).toContain('bloqueado');
      await expect(page.locator('#web-delivery-status')).toContainText('bloqueado');
      await expect(page.locator('#web-delivery-status')).not.toContainText('ENVIO CONFIRMADO');checked('HTTP-02');
      summary.closure='GET_E_POST_BLOQUEADOS';summary.status='HTTP_BLOQUEADO_PASS_SCOPED';
    }else{
      const value=JSON.parse(form.payload),receipt=first.data;
      expect(receipt.ok).toBe(true);
      await expect(page.locator('#web-delivery-status')).toContainText('ENVIO CONFIRMADO');
      expect(receipt.gradeReceived).toBe(value.evidence.xp/10);expect(receipt.bestGrades).toEqual([10,10]);
      expect(receipt.codeSha256).toBe(createHash('sha256').update(value.evidence.codigoFonteCompleto).digest('hex'));
      expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/);expect(receipt.grade).toBeNull();checked('HTTP-04');checked('HTTP-05');
      summary.receipts.push({receiptId:receipt.receiptId,signature:receipt.signature,codeSha256:receipt.codeSha256,receivedGrade:receipt.gradeReceived,bestGrades:receipt.bestGrades,origin:first.origin});
      const replay=await postAgain(page,settings.endpoint,form);
      expect(replay.data.receiptId).toBe(receipt.receiptId);expect(replay.data.signature).toBe(receipt.signature);
      expect(replay.data.teacherReviewRequired).toBe(receipt.teacherReviewRequired);checked('HTTP-10');
      const changed=structuredClone(value);changed.evidence.observacao='QA HTTP conteúdo alterado para testar nonce';
      const rejected=await postAgain(page,settings.endpoint,{nonce:form.nonce,payload:JSON.stringify(changed)});
      expect(rejected.data.ok).toBe(false);expect(rejected.data.code).toBe('DUPLICIDADE_TECNICA');checked('HTTP-11');
      for(const [code,member] of [
        ['NOME_MATRICULA_DIVERGENTE',{name:'Ana Teste Ficticio',enrollment:'99990000'}],
        ['MATRICULA_NOME_DIVERGENTE',{name:'Carla Teste Ficticio',enrollment:'00001234'}]
      ]){
        await page.locator('[data-close-dialog="evidence-dialog"]').click();
        await page.evaluate(({member,runId})=>window.WebTeam.restore({teamId:runId,team:'Equipe QA HTTP',members:[member]}),{member,runId:settings.runId});
        await page.locator('#evidence-open').click();
        const next=page.waitForRequest(req=>req.url()===settings.endpoint&&req.method()==='POST');
        await page.locator('#web-submit').click();await next;
        const conflict=await waitMessage(page,submitted.get('nonce'));
        expect(conflict.data.ok).toBe(false);expect(conflict.data.code).toBe(code);
        await expect(page.locator('#team-dialog')).toBeVisible();
        await expect(page.locator('#team-feedback')).toContainText(member.name);await expect(page.locator('#team-feedback')).toContainText(member.enrollment);
        const field=page.locator('#web-member-0-'+conflict.data.field);await expect(field).toBeFocused();await expect(field).toHaveAttribute('aria-invalid','true');
        checked(code==='NOME_MATRICULA_DIVERGENTE'?'HTTP-07':'HTTP-08');
        await page.locator('[data-close-dialog="team-dialog"]').click();
      }
      checked('HTTP-09');summary.status='HTTP_BROWSER_PASS_SCOPED_AGUARDA_BLOQUEIO_E_READBACK';
    }
    summary.sourceHashes=hashes;
  }catch(error){summary.status='HTTP_QA_FAIL';summary.errorType=error.name;throw error;}
  finally{
    let finalFailure=null;
    if(settings.phase==='open')console.log('AÇÃO OBRIGATÓRIA: executar bloquearRecebimentoNotasV3 no editor, depois fase closed e conferir a planilha. Não repetir entrega incerta.');
    else{
      try{const r=await request.get(settings.endpoint,{timeout:30000,maxRedirects:5});
        summary.finalGetBlocked=r.status()===200&&expectedGet(await r.text(),settings.phase);
        if(!summary.finalGetBlocked)throw Error('GET_FINAL_BLOQUEADO_NAO_CONFIRMADO');
      }catch(error){finalFailure=error;summary.status='HTTP_QA_FAIL';summary.closure='NAO_CONFIRMADA';}
    }
    const report=testInfo.outputPath('http-qa-summary.json');await mkdir(path.dirname(report),{recursive:true});
    await writeFile(report,JSON.stringify(summary,null,2)+'\n');
    await testInfo.attach('http-qa-summary.json',{path:report,contentType:'application/json'});
    if(finalFailure)throw finalFailure;
  }
});
