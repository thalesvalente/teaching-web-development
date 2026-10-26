/**
 * Aula 05 — recebimento por matrícula, sem alterar XP no laboratório ou artefatos locais.
 * Salva JSON antes de enviar. Somente um recibo REAL do servidor pode
 * afirmar que a evidência foi RECEBIDA, ainda pendente de validação docente.
 */
(() => {
  'use strict';
  const config = window.WebEntregaConfig || {};
  const button = document.getElementById('web-submit');
  const quickButton = document.getElementById('quick-pdf');
  const status = document.getElementById('web-delivery-status');
  const ENDPOINT = () => String(config.endpoint || '');
  const ACTIVITY = 'WEB-AULA05-2026';
  const CHANNEL = 'web-entrega-aula05';
  const validEndpoint = () => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ENDPOINT());
  const activated = () => validEndpoint() && config.activated === true && ['web-a05-submission-v2','web-a05-submission-v3'].includes(config.schema) && window.WebTeam?.onlineEnabled===true;
  // HtmlService cria sandbox em hosts no formato n-...-script.googleusercontent.com.
  // Não aceitar *.googleusercontent.com genericamente. O nonce/contrato é
  // validado adicionalmente em receive(), nunca pela origem isolada.
  const validOrigin = origin => origin === 'https://script.google.com' ||
    /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin) ||
    /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin);
  if (!button || !quickButton || !status) throw Error('Controles de envio Web não encontrados.');
  let busy = false;
  // A geração do PDF continua acessível mesmo com o POST bloqueado.
  button.disabled = false;
  function refreshStatus(){
    if (!validEndpoint()) {
      status.textContent = 'Recebimento online não habilitado. No modo QA, configure o receptor fictício na identificação da equipe. PDF e JSON locais continuam disponíveis.';
    } else if (!activated()) {
      status.textContent = 'O endereço Apps Script foi cadastrado, mas o recebimento segue em homologação. Confira a configuração QA.';
    } else {
      status.textContent = 'Recebimento QA preparado. Use apenas matrículas fictícias; a disponibilidade será conferida no servidor antes de qualquer envio.';
    }
  }
  refreshStatus();
  const inform = (text, kind = '') => {
    status.textContent = text;
    status.dataset.kind = kind;
    status.setAttribute('role',kind==='error'?'alert':'status');
  };
  // Matrícula individual é obrigatória no POST. Dados antigos sem matrícula seguem válidos como rascunho offline.
  function teamIdentity() {
    if(!window.WebTeam?.getIdentity)
      throw Error('Identificação da equipe indisponível. Atualize o laboratório.');
    return window.WebTeam.getIdentity();
  }
  function bytesHash(bytes) {
    return crypto.subtle.digest('SHA-256',bytes).then(data =>
      Array.from(new Uint8Array(data)).map(n => n.toString(16).padStart(2,'0')).join(''));
  }
  function saveJson(snapshot, name) {
    const data=JSON.stringify(snapshot,null,2);
    const url=URL.createObjectURL(new Blob([data],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url; link.download=name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function post(identity, evidence, hash) {
    const nonce = crypto.randomUUID();
    const payload = JSON.stringify({
      schema:config.schema,activity:ACTIVITY,identity:config.schema==='web-a05-submission-v3'?window.WebTeam.submissionIdentity(identity):identity,evidence,
      ...(config.schema==='web-a05-submission-v3'?{operation:'submitTeam'}:{}),
      ...(config.requiredMode==='PROD'?{environment:'PROD'}:{})
    });
    if (payload.length > 44000) return Promise.reject(Error('Arquivo muito grande para entrega online; exporte e consulte o professor.'));
    return new Promise((resolve,reject) => {
      const frame = document.createElement('iframe');
      frame.hidden = true; frame.name = 'web-a05-' + nonce;
      frame.title = 'Confirmação de recebimento de evidências Web';
      const form = document.createElement('form');
      form.hidden=true; form.method='POST'; form.target=frame.name; form.action=ENDPOINT();
      for (const [key,value] of Object.entries({nonce,payload})) {
        const field = document.createElement('input');
        field.name=key; field.value=value; form.appendChild(field);
      }
      let finished=false;
      const end=(error,receipt)=>{
        if(finished)return;
        finished=true; clearTimeout(timer);
        window.removeEventListener('message',receive);
        frame.remove(); form.remove();
        error?reject(error):resolve(receipt);
      };
      const receive=event=>{
        if(!validOrigin(event.origin))return; // GAS envia do iframe interno (top.postMessage).
        const d=event.data;
        if(!d || d.channel!==CHANNEL || d.nonce!==nonce)return;
        if(d.ok===false){
          const err=Error(d.message||d.error||'Servidor recusou a entrega.');
          err.code=typeof d.code==='string'?d.code:'ERRO_RECEBIMENTO';
          err.memberIndex=Number.isInteger(d.memberIndex)?d.memberIndex:null;
          err.field=d.field==='enrollment'||d.field==='name'?d.field:null;
          err.action=typeof d.action==='string'?d.action:'Revise os dados informados.';
          return end(err);
        }
        if(config.schema==='web-a05-submission-v3'&&(d.version!=='web-notas-3.2.0'||!Array.isArray(d.members)||d.members.length!==identity.members.length||d.members.some((m,i)=>m.enrollment!==identity.members[i].enrollment||m.name!==identity.members[i].name)))
          return end(Error('Recibo com identificação incompatível. Confira a entrega com o professor.'));
        if(d.ok!==true || d.activity!==ACTIVITY || d.instrument!=='laboratorio-vivo-tsx-equipe' ||
           d.codeSha256!==hash ||
           !Number.isFinite(d.gradeReceived) || d.gradeReceived<0 || d.gradeReceived>10 ||
           d.gradeReceived!==evidence.xp/10 ||
           !Array.isArray(d.bestGrades) || d.bestGrades.length!==identity.members.length ||
           d.bestGrades.some(v=>!Number.isFinite(v)||v<0||v>10) ||
           d.teamId!==identity.teamId || d.memberCount!==identity.members.length ||
           d.grade!==null || d.status!=='RECEBIDO_PENDENTE_VALIDACAO' ||
           !/^WEB-[\w-]+$/.test(String(d.receiptId||'')) ||
           !/^[0-9a-f]{64}$/.test(String(d.answersSha256||'')) ||
           !/^[0-9a-f]{64}$/.test(String(d.signature||'')) ||
           !Number.isFinite(Date.parse(d.receivedAt)))
          return end(Error('Recibo de recebimento incompatível com a evidência.'));
        end(null,d);
      };
      const timer=setTimeout(()=>end(Error('Sem confirmação do Apps Script: confira a planilha antes de reenviar.')),45000);
      window.addEventListener('message',receive);
      document.body.append(frame,form);
      try{form.submit();}catch(error){end(error);}
    });
  }
  function showReceipt(){
    const dialog=document.getElementById('evidence-dialog');
    if(dialog && !dialog.open)dialog.showModal();
    status.focus({preventScroll:true});
  }
  function downloadTeamJson(){
    if(!window.WebLabEvidence||typeof window.WebLabEvidence.snapshot!=='function')
      throw Error('Laboratório ainda não preparado. Atualize a página.');
    const identity=window.WebTeam?.getIdentity?.({requireEnrollment:false});
    if(!identity)throw Error('Informe o nome da equipe antes de exportar o JSON.');
    const evidence=window.WebLabEvidence.snapshot();
    if(evidence.schema!=='ifma-web-aula05-lab-v4'||evidence.maximoXp!==100||
       !Array.isArray(evidence.exercicios)||evidence.exercicios.length!==14)
      throw Error('Evidências incompatíveis; confira o laboratório.');
    saveJson({identity,evidence},'WEB_Aula05_Evidencia_Equipe.json');
  }
  const downloadTeamButton=document.getElementById('download-team-json');
  downloadTeamButton?.addEventListener('click',()=>{
    try{downloadTeamJson();inform('JSON da equipe preparado. Guarde o arquivo; ele não é comprovante de entrega.','success');}
    catch(error){inform('Não foi possível baixar o JSON: '+String(error.message||error),'error');}
  });
  async function generatePdfAndSend(){
    if(busy)return;
    // Baixar o JSON no clique original, antes de quaisquer awaits ou impressão.
    try{downloadTeamJson();}catch(_){/* Botão manual permanece disponível. */}
    if(activated()&&config.requiredMode==='PROD'){
      busy=true;button.disabled=true;quickButton.disabled=true;
      try{
        inform('Conferindo a disponibilidade da atividade. Seus dados ainda não foram enviados.');
        if(!window.WebProductionGate?.ensureReady)throw Error('Verificação de produção indisponível. Atualize a página.');
        await window.WebProductionGate.ensureReady(config);
      }catch(error){
        inform('ENVIO NÃO REALIZADO: '+String(error?.message||'Recebimento indisponível.'),'error');
        showReceipt();return;
      }finally{busy=false;button.disabled=false;quickButton.disabled=false;}
    }
    // Validação anterior ao PDF, ao JSON e a qualquer solicitação de rede.
    const identity=window.WebTeam?.requireIdentity?.({requireEnrollment:activated()});
    if(!identity){
      inform('ENVIO NÃO REALIZADO: identifique a equipe, consulte cada matrícula e confirme o nome exibido. Nenhuma atividade foi enviada.','error');
      return;
    }
    if(!window.WebLabEvidence?.printPartial?.()){
      inform('ENVIO NÃO REALIZADO: não foi possível preparar o PDF. Nenhum dado foi enviado.','error');
      return;
    }
    // A geração local do PDF não representa envio nem prova que ele foi salvo.
    if(!activated()){
      inform('PDF preparado para salvar pela janela de impressão. ENVIO NÃO REALIZADO: o Apps Script da turma ainda está em homologação. Use o PDF/JSON localmente; nenhum dado foi transmitido.','error');
      showReceipt();
      return;
    }
    let submittedIdentity=identity;
    busy=true;button.disabled=true;quickButton.disabled=true;
    try{
      if(!window.WebLabEvidence || typeof window.WebLabEvidence.snapshot!=='function')
        throw Error('Laboratório ainda não preparado. Abra a aula e execute o código.');
      if(!window.crypto?.subtle || !crypto.randomUUID)
        throw Error('Envio seguro exige HTTPS/localhost e crypto disponível.');
      // Defesa adicional: revalidar imediatamente antes de fazer POST.
      const checked=teamIdentity();submittedIdentity=checked;
      const evidence=window.WebLabEvidence.snapshot();
      if(evidence.schema!=='ifma-web-aula05-lab-v4'||evidence.maximoXp!==100 ||
         !Array.isArray(evidence.exercicios) || evidence.exercicios.length!==14)
        throw Error('Evidência ou versão da atividade incompatível.');
      const code=String(evidence.codigoFonteCompleto||'');
      if(!code || code.length>30000)throw Error('Código TSX inválido ou muito longo.');
      const hash=await bytesHash(new TextEncoder().encode(code));
      // Exportação auditável antes da tentativa de envio: não é comprovante de recepção.
      inform('PDF preparado. Enviando as evidências e aguardando recibo do Apps Script...');
      showReceipt();
      const receipt=await post(checked,evidence,hash);
      inform('ENVIO CONFIRMADO! NOTA RECEBIDA — AGUARDANDO CONFERÊNCIA DOCENTE.\n'+
        'Equipe: '+checked.team+' ('+checked.members.length+' integrante(s))\n'+
        'Nomes: '+checked.members.map(m=>m.name).join('; ')+'\n'+
        'Recibo: '+receipt.receiptId+'\nRecebido UTC: '+receipt.receivedAt+
        '\nNota recebida: '+receipt.gradeReceived.toFixed(1)+'/10\n'+
        'Maiores notas individuais:\n'+checked.members.map((member,i)=>member.name+' — Matrícula: '+member.enrollment+' — '+receipt.bestGrades[i].toFixed(1)+'/10').join('\n')+'\n'+
        (receipt.teacherReviewRequired?'Aviso: '+String(receipt.warning||'Avaliação docente pendente.')+'\n':'')+
        'SHA-256 do código: '+receipt.codeSha256+
        '\nAssinatura do recibo: '+receipt.signature+
        '\nPDF: salve-o no dispositivo pela janela de impressão (não é enviado como arquivo).\n'+
        'Guarde seu JSON e o número do recibo.', 'success');
      showReceipt();
    }catch(error){
      const index=error?.memberIndex;
      const member=Number.isInteger(index)?submittedIdentity?.members?.[index]:null;
      if(member && error?.field){
        const message='ENTREGA BLOQUEADA — '+String(error.code||'IDENTIDADE_CONFLITANTE')+'\n'+
          'Integrante '+(index+1)+'\n'+
          (config.schema==='web-a05-submission-v3'?'Nome cadastrado: ':'Nome informado: ')+member.name+'\n'+
          'Matrícula informada: '+member.enrollment+'\n'+
          'Problema: '+String(error.message||'Dados inconsistentes.')+'\n'+
          'Como resolver: '+String(error.action||'Procure o professor.')+'\n'+
          'Nenhuma nota ou entrega foi confirmada.';
        inform(message,'error');
        window.WebTeam?.showRemoteConflict?.({memberIndex:index,field:error.field,
          message:error.message,action:error.action,submittedMember:member});
      }else if(error?.code==='ATIVIDADE_ENCERRADA'){
        inform('ENTREGA BLOQUEADA — ATIVIDADE ENCERRADA\n'+String(error.message)+'\n'+
          String(error.action)+'\nSuas respostas foram preservadas.','error');
        showReceipt();
      }else{
        inform('ENVIO NÃO CONFIRMADO: '+String(error?.message||'Falha de entrega.')+
          '\nConfira a Auditoria antes de tentar novamente. PDF/JSON locais não comprovam entrega.','error');
        showReceipt();
      }
    }finally{busy=false;button.disabled=false;quickButton.disabled=false;}
  }
  button.addEventListener('click',generatePdfAndSend);
  quickButton.addEventListener('click',generatePdfAndSend);
  window.WebEntrega = Object.freeze({get configurado(){return validEndpoint();},get ativado(){return activated();},refreshStatus,atividade:ACTIVITY,origemReciboPermitida:validOrigin});
})();
