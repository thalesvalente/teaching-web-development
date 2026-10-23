/**
 * Aula 05 — recebimento formativo, sem alterar XP, editor ou exports locais.
 * Salva JSON antes de enviar. Somente um recibo REAL do servidor pode
 * afirmar que a evidência foi RECEBIDA, ainda pendente de validação docente.
 */
(() => {
  'use strict';
  const config = window.WebEntregaConfig || {};
  const button = document.getElementById('web-submit');
  const status = document.getElementById('web-delivery-status');
  const ENDPOINT = String(config.endpoint || '');
  const ACTIVITY = 'WEB-AULA05-2026';
  const CHANNEL = 'web-entrega-aula05';
  const validEndpoint = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ENDPOINT);
  const activated = validEndpoint && config.activated === true;
  const validOrigin = origin => origin === 'https://script.google.com' ||
    /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin);
  if (!button || !status) throw Error('Controles de envio Web não encontrados.');
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
  function safeName(name) {
    return /^[\p{L}][\p{L}\p{M} .'\-]{2,99}$/u.test(name) &&
      name.trim().split(/\s+/).length >= 2;
  }
  function studentIdentity() {
    const name = document.getElementById('web-student-name').value.trim();
    const enrollment = document.getElementById('web-student-id').value.trim();
    const team = document.getElementById('web-team').value.trim();
    if (!safeName(name)) throw Error('Informe nome e sobrenome, sem abreviações.');
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{4,29}$/.test(enrollment))
      throw Error('Revise a matrícula / identificador acadêmico.');
    if (team.length > 80) throw Error('Equipe ou turma excede 80 caracteres.');
    return { name, enrollment, team };
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
        if(d.activity!==ACTIVITY || d.instrument!=='laboratorio-vivo-tsx' ||
           d.codeSha256!==hash || d.xpReported!==evidence.xp ||
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
  button.addEventListener('click',async()=>{
    if(busy || !activated)return;
    try{
      if(!window.WebLabEvidence || typeof window.WebLabEvidence.snapshot!=='function')
        throw Error('Laboratório ainda não preparado. Abra a aula e execute o código.');
      if(!window.crypto?.subtle || !crypto.randomUUID)
        throw Error('Envio seguro exige HTTPS/localhost e crypto disponível.');
      const identity=studentIdentity();
      const evidence=window.WebLabEvidence.snapshot();
      if(evidence.schema!=='ifma-web-aula05-lab-v4'||evidence.maximoXp!==100 ||
         !Array.isArray(evidence.exercicios) || evidence.exercicios.length!==14)
        throw Error('Evidência ou versão da atividade incompatível.');
      const code=String(evidence.codigoFonteCompleto||'');
      if(!code || code.length>30000)throw Error('Código TSX inválido ou muito longo.');
      const hash=await bytesHash(new TextEncoder().encode(code));
      // O JSON local contém o exato snapshot enviado; não inventar hash de PDF.
      saveJson({identity,evidence},'WEB_Aula05_Evidencia_Individual.json');
      inform('Download JSON iniciado. Solicitando recibo do Apps Script...');busy=true;button.disabled=true;
      const receipt=await post(identity,evidence,hash);
      inform('EVIDÊNCIA RECEBIDA — AGUARDANDO CONFERÊNCIA DOCENTE.\n'+
        'Recibo: '+receipt.receiptId+'\nRecebido UTC: '+receipt.receivedAt+
        '\nXP formativos relatados: '+receipt.xpReported+'/100 (não são nota)\n'+
        'SHA-256 do código: '+receipt.codeSha256+
        '\nAssinatura do recibo: '+receipt.signature+
        '\nGuarde seu JSON e o número do recibo.', 'success');
    }catch(error){
      inform('ENVIO NÃO CONFIRMADO: '+String(error?.message||'Falha de entrega.')+
        '\nExportar JSON/Markdown/PDF continua disponível. Não há nota automática.', 'error');
    }finally{busy=false;button.disabled=!activated;}
  });
  window.WebEntrega = Object.freeze({configurado:validEndpoint,ativado:activated,atividade:ACTIVITY});
})();
