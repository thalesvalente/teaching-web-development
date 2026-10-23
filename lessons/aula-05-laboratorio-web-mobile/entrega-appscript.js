/**
 * Aula 05 — recebimento formativo, sem alterar XP, editor ou exports locais.
 * Salva JSON antes de enviar. Somente um recibo REAL do servidor pode
 * afirmar que a evidência foi RECEBIDA, ainda pendente de validação docente.
 */
(() => {
  'use strict';
  const config = window.WebEntregaConfig || {};
  const button = document.getElementById('web-submit');
  const quickButton = document.getElementById('quick-pdf');
  const status = document.getElementById('web-delivery-status');
  const ENDPOINT = String(config.endpoint || '');
  const ACTIVITY = 'WEB-AULA05-2026';
  const CHANNEL = 'web-entrega-aula05';
  const validEndpoint = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ENDPOINT);
  const activated = validEndpoint && config.activated === true;
  const validOrigin = origin => origin === 'https://script.google.com' ||
    /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin);
  if (!button || !quickButton || !status) throw Error('Controles de envio Web não encontrados.');
  let busy = false;
  button.disabled = !activated;
  if (!validEndpoint) {
    status.textContent = 'Recebimento online ainda não configurado pelo professor. JSON, Markdown e PDF continuam disponíveis localmente.';
  } else if (!activated) {
    status.textContent = 'O endereço Apps Script foi cadastrado, mas a entrega online segue em homologação. O professor precisa validar o POST real e ativar o recebimento. Exportações locais permanecem disponíveis.';
  } else {
    status.textContent = 'Envio Web disponível. Somente o recibo retornado pelo Apps Script confirma o recebimento; XP não constituem nota oficial.';
  }
  const inform = (text, kind = '') => {
    status.textContent = text;
    status.dataset.kind = kind;
  };
  // A equipe fornece apenas seu nome e nomes dos integrantes; não há
  // campos de matrícula, turma ou dados extras no formulário.
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
      schema:'web-a05-submission-v1',activity:ACTIVITY,identity,evidence
    });
    if (payload.length > 44000) return Promise.reject(Error('Arquivo muito grande para entrega online; exporte e consulte o professor.'));
    return new Promise((resolve,reject) => {
      const frame = document.createElement('iframe');
      frame.hidden = true; frame.name = 'web-a05-' + nonce;
      frame.title = 'Confirmação de recebimento de evidências Web';
      const form = document.createElement('form');
      form.hidden=true; form.method='POST'; form.target=frame.name; form.action=ENDPOINT;
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
        if(!d.ok)return end(Error(d.error||'Servidor recusou a evidência.'));
        if(d.activity!==ACTIVITY || d.instrument!=='laboratorio-vivo-tsx-equipe' ||
           d.codeSha256!==hash || d.xpReported!==evidence.xp ||
           d.teamId!==identity.teamId || d.memberCount!==identity.members.length ||
           d.grade!==null || d.status!=='RECEBIDO_PENDENTE_VALIDACAO' ||
           !/^WEB-[\w-]+$/.test(String(d.receiptId||'')) ||
           !/^[0-9a-f]{64}$/.test(String(d.answersSha256||'')) ||
           !/^[0-9a-f]{64}$/.test(String(d.signature||'')) ||
           !d.receivedAt)
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
  async function generatePdfAndSend(){
    if(busy)return;
    // Validação anterior ao PDF, ao JSON e a qualquer solicitação de rede.
    const identity=window.WebTeam?.requireIdentity?.();
    if(!identity){
      inform('ENVIO NÃO REALIZADO: preencha o nome da equipe e o nome e sobrenome de todos os integrantes. Nenhum dado foi enviado.','error');
      return;
    }
    if(!window.WebLabEvidence?.printPartial?.()){
      inform('ENVIO NÃO REALIZADO: não foi possível preparar o PDF. Nenhum dado foi enviado.','error');
      return;
    }
    // A geração local do PDF não representa envio nem prova que ele foi salvo.
    if(!activated){
      inform('PDF preparado para salvar pela janela de impressão. ENVIO NÃO REALIZADO: o Apps Script da turma ainda está em homologação. Use o PDF/JSON localmente; nenhum dado foi transmitido.','error');
      showReceipt();
      return;
    }
    busy=true;button.disabled=true;quickButton.disabled=true;
    try{
      if(!window.WebLabEvidence || typeof window.WebLabEvidence.snapshot!=='function')
        throw Error('Laboratório ainda não preparado. Abra a aula e execute o código.');
      if(!window.crypto?.subtle || !crypto.randomUUID)
        throw Error('Envio seguro exige HTTPS/localhost e crypto disponível.');
      // Defesa adicional: revalidar imediatamente antes de fazer POST.
      const checked=teamIdentity();
      const evidence=window.WebLabEvidence.snapshot();
      if(evidence.schema!=='ifma-web-aula05-lab-v4'||evidence.maximoXp!==100 ||
         !Array.isArray(evidence.exercicios) || evidence.exercicios.length!==14)
        throw Error('Evidência ou versão da atividade incompatível.');
      const code=String(evidence.codigoFonteCompleto||'');
      if(!code || code.length>30000)throw Error('Código TSX inválido ou muito longo.');
      const hash=await bytesHash(new TextEncoder().encode(code));
      // Exportação auditável antes da tentativa de envio: não é comprovante de recepção.
      saveJson({identity:checked,evidence},'WEB_Aula05_Evidencia_Equipe.json');
      inform('PDF preparado. Enviando as evidências e aguardando recibo do Apps Script...');
      showReceipt();
      const receipt=await post(checked,evidence,hash);
      inform('ENVIO CONFIRMADO! EVIDÊNCIA RECEBIDA — AGUARDANDO CONFERÊNCIA DOCENTE.\n'+
        'Equipe: '+checked.team+' ('+checked.members.length+' integrante(s))\n'+
        'Nomes: '+checked.members.map(m=>m.name).join('; ')+'\n'+
        'Recibo: '+receipt.receiptId+'\nRecebido UTC: '+receipt.receivedAt+
        '\nXP formativos relatados: '+receipt.xpReported+'/100 (não são nota)\n'+
        'SHA-256 do código: '+receipt.codeSha256+
        '\nAssinatura do recibo: '+receipt.signature+
        '\nPDF: salve-o no dispositivo pela janela de impressão (não é enviado como arquivo).\n'+
        'Guarde seu JSON e o número do recibo.', 'success');
      showReceipt();
    }catch(error){
      inform('ENVIO NÃO CONFIRMADO: '+String(error?.message||'Falha de entrega.')+
        '\nConfira o recebimento antes de tentar novamente. PDF/JSON locais não comprovam entrega.','error');
      showReceipt();
    }finally{busy=false;button.disabled=!activated;quickButton.disabled=false;}
  }
  button.addEventListener('click',generatePdfAndSend);
  quickButton.addEventListener('click',generatePdfAndSend);
  window.WebEntrega = Object.freeze({configurado:validEndpoint,ativado:activated,atividade:ACTIVITY});
})();
