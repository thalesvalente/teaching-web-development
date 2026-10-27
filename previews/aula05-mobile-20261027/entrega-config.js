/** PRÉVIA ISOLADA de usabilidade — sem receptor de notas, sem consulta de matrícula.
 * O contrato de produção NÃO é habilitado neste snapshot estático.
 * Source UX: 421c4cd673c6eed79e09d7b7273899450c5e9b69.
 */
(() => {
  'use strict';
  window.WebEntregaConfig=Object.freeze({
    endpoint:'',
    activated:false,
    qaMode:false,
    qaRequested:false,
    requiredMode:null,
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v3',
    requiredVersion:'web-notas-3.2.0',
    configureQa:async()=>false
  });
})();