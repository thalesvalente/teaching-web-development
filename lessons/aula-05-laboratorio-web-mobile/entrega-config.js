/** Identificação Web 3.2.0 — endpoint PROD 3.2 habilitado após confirmação docente e CI.
 * No Pages oficial, a aula usa o receptor PROD; outros hosts continuam offline.
 * A URL /exec é pública (não é segredo). Não armazenar HMAC, cadastro ou chaves aqui.
 * QA continua isolada por fingerprint, sem usar o receptor PROD.
 */
(() => {
  'use strict';
  const published=window.location.origin==='https://thalesvalente.github.io';
  const qaRequested=published&&/(?:^\?|&)qa=1(?:&|$)/.test(String(window.location.search||''));
  const QA_SHA256='972771037d8389aea4d87e57118243f9e1264cbacf6e71c011368d1d62459c0b';
  const PROD_ENDPOINT='https://script.google.com/macros/s/AKfycbwCaZlTbUCEw_fr6N7yQ29uyBx1RiSFM7sUX1zRnKlunUE7n8Vb5aAKMuOkpxzKVE11/exec';
  // Só o caminho canônico da Aula 05 pode transmitir. QA ?qa=1 continua isolada.
  const PROD_RELEASE_ENABLED=true;
  const canonical=/^\/teaching-web-development\/lessons\/aula-05-laboratorio-web-mobile\/(?:index\.html)?$/.test(window.location.pathname||'');
  const prodActive=published&&canonical&&!qaRequested&&PROD_RELEASE_ENABLED;
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
    get endpoint(){return prodActive?PROD_ENDPOINT:endpoint;},
    get activated(){return prodActive||(qaRequested&&Boolean(endpoint));},
    get qaMode(){return !prodActive&&qaRequested&&Boolean(endpoint);},
    qaRequested,
    get requiredMode(){return (prodActive||endpoint)?'PROD':null;},
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v3',
    requiredVersion:'web-notas-3.2.0',
    configureQa
  });
})();
