/** Consulta pública de prontidão, sem transmitir nome, matrícula ou evidência. */
(() => {
  'use strict';
  const validOrigin=origin=>origin==='https://script.google.com'||
    /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin)||
    /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin);
  function ensureReady(config){
    if(!config||config.requiredMode!=='PROD')return Promise.resolve();
    const endpoint=String(config.endpoint||'');
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))
      return Promise.reject(Error('Endereço de recebimento inválido. Avise o professor.'));
    return new Promise((resolve,reject)=>{
      const nonce=crypto.randomUUID(),frame=document.createElement('iframe');
      frame.title='Verificação do recebimento da atividade';
      frame.setAttribute('aria-hidden','true');
      frame.tabIndex=-1;
      // hidden/display:none pode impedir execução do HtmlService em navegadores.
      // Manter layout não interativo, fora da tela, sem expor o iframe ao usuário.
      frame.style.cssText='position:absolute;width:1px;height:1px;left:-10000px;top:0;border:0;opacity:0;pointer-events:none';
      let finished=false;
      const done=error=>{if(finished)return;finished=true;clearTimeout(timer);
        window.removeEventListener('message',receive);frame.remove();error?reject(error):resolve();};
      function receive(event){
        const d=event.data;
        if(!validOrigin(event.origin)||!d||d.channel!=='web-status-aula05'||d.nonce!==nonce)return;
        if(d.ok!==true||d.mode!=='PROD'||d.version!==(config.requiredVersion||'web-notas-3.1.0')||d.activity!==config.activity)
          return done(Error('Recebimento da turma ainda não está configurado na versão de produção. Nenhum dado foi enviado.'));
        if(d.enabled!==true)return done(Error('O professor está com o recebimento bloqueado. Guarde seu PDF/JSON e tente quando a atividade for liberada.'));
        done();
      }
      const timer=setTimeout(()=>done(Error('Recebimento indisponível ou aguardando ativação pelo professor. Nenhum nome ou matrícula foi enviado.')),12000);
      window.addEventListener('message',receive);
      frame.src=endpoint+'?action=health&nonce='+encodeURIComponent(nonce);
      document.body.appendChild(frame);
    });
  }
  window.WebProductionGate=Object.freeze({ensureReady});
})();
