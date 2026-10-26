/** Identificação Web 3.2.0. Somente o professor ativa a QA no próprio formulário.
 * Nenhum endpoint é divulgado no código; uso normal do site é somente offline.
 * URL QA aprovada por fingerprint SHA-256 da implantação sintética verificada.
 */
(() => {
  'use strict';
  const published=window.location.origin==='https://thalesvalente.github.io';
  const qaRequested=published&&/(?:^\?|&)qa=1(?:&|$)/.test(String(window.location.search||''));
  const QA_SHA256='972771037d8389aea4d87e57118243f9e1264cbacf6e71c011368d1d62459c0b';
  let endpoint='';
  async function configureQa(value){
    if(!qaRequested)return false;
    const candidate=String(value||'').trim();
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(candidate))return false;
    if(endpoint)return endpoint===candidate;
    if(!window.crypto?.subtle)return false;
    const digest=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate));
    const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
    if(fingerprint!==QA_SHA256)return false;
    endpoint=candidate;return true;
  }
  window.WebEntregaConfig=Object.freeze({
    get endpoint(){return endpoint;},
    get activated(){return qaRequested&&Boolean(endpoint);},
    get qaMode(){return qaRequested&&Boolean(endpoint);},
    qaRequested,
    get requiredMode(){return endpoint?'PROD':null;},
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v3',
    requiredVersion:'web-notas-3.2.0',
    configureQa
  });
})();
