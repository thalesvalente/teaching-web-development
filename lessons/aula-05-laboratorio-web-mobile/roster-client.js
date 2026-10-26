/** Read-only roster lookup. No mutation operation, no roster bundled or cached locally. */
(() => {
  'use strict';
  const originOK=origin=>origin==='https://script.google.com'||
    /^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(origin)||
    /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin);
  const canonical=value=>String(value||'').trim().toUpperCase();
  async function lookup(enrollment,teamId){
    const cfg=window.WebEntregaConfig||{},key=canonical(enrollment);
    if(!/^[0-9]{8}\.ITA[0-9]{4}$/.test(key))throw Error('Informe a matrícula completa, com ponto e letras ITA.');
    if(cfg.schema!=='web-a05-submission-v3'||cfg.activated!==true||!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cfg.endpoint||''))
      throw Error('Consulta indisponível offline. Guarde o progresso e consulte quando o professor liberar a atividade.');
    if(!window.WebProductionGate?.ensureReady)throw Error('Verificação de disponibilidade ausente. Atualize a página.');
    await window.WebProductionGate.ensureReady({...cfg,requiredMode:'PROD',requiredVersion:'web-notas-3.2.0'});
    return new Promise((resolve,reject)=>{
      const nonce=crypto.randomUUID(),frame=document.createElement('iframe'),form=document.createElement('form');
      frame.hidden=true;frame.name='web-roster-'+nonce;frame.title='Consulta da matrícula informada';
      form.hidden=true;form.method='POST';form.action=cfg.endpoint;form.target=frame.name;
      const payload={operation:'lookupStudent',environment:'PROD',activity:cfg.activity,teamId,enrollment:key};
      for(const [name,value] of Object.entries({nonce,payload:JSON.stringify(payload)})){
        const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);
      }
      let done=false;
      function finish(error,data){if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',receive);frame.remove();form.remove();error?reject(error):resolve(data);}
      function receive(event){
        const d=event.data;
        if(!originOK(event.origin)||!d||d.channel!=='web-roster-lookup-aula05'||d.nonce!==nonce)return;
        if(d.ok===false){const error=Error(String(d.message||'Consulta recusada pelo servidor.'));error.code=d.code;return finish(error);}
        if(d.ok!==true||d.version!=='web-notas-3.2.0'||d.enrollmentCanonical!==key||typeof d.name!=='string'||!d.name.trim()||d.name.length>100||
          typeof d.confirmationToken!=='string'||!/^\d{13}\.[a-f0-9]{64}$/.test(d.confirmationToken)||Number(d.confirmationToken.split('.')[0])<Date.now())
          return finish(Error('Resposta de identificação incompatível. Procure o professor.'));
        finish(null,{enrollment:key,name:d.name,confirmationToken:d.confirmationToken});
      }
      const timer=setTimeout(()=>finish(Error('A consulta não foi confirmada. Nenhum cadastro foi alterado; tente novamente mais tarde.')),30000);
      window.addEventListener('message',receive);document.body.append(frame,form);
      try{form.submit();}catch(error){finish(error);}
    });
  }
  window.WebRosterClient=Object.freeze({lookup,canonical});
})();
