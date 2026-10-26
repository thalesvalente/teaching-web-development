/** Aula 05 3.2.0 — identificação por matrícula, nome confirmado no cadastro.
 * O site não envia dados à turma até a liberação administrativa G8.
 * Para homologação: abra a própria página com ?qa=1 e informe a URL do
 * Apps Script isolado. Não armazena, registra ou distribui a URL da QA.
 */
(() => {
  'use strict';
  const published=window.location.origin==='https://thalesvalente.github.io';
  const qaRequested=published&&/(?:^\?|&)qa=1(?:&|$)/.test(String(window.location.search||''));
  const input=qaRequested&&typeof window.prompt==='function'
    ?String(window.prompt('HOMOLOGAÇÃO QA: cole somente a URL /exec do Apps Script ISOLADO, com dados fictícios. Não use o endpoint da turma.','')||'').trim():'';
  const accepted=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(input)&&
    !input.includes('AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W');
  const qaMode=Boolean(qaRequested&&accepted);
  window.WebEntregaConfig=Object.freeze({
    endpoint:qaMode?input:'',
    activated:qaMode,
    qaMode,
    requiredMode:qaMode?'PROD':null,
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v3',
    requiredVersion:'web-notas-3.2.0'
  });
})();
