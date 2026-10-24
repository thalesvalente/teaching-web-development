/** Web somente. Fora do hostname oficial permanece em modo offline. */
(() => {
  const published=window.location.origin==='https://thalesvalente.github.io';
  window.WebEntregaConfig=Object.freeze({
    endpoint:published?'https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec':'',
    activated:published,
    requiredMode:published?'PROD':null,
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v2'
  });
})();
