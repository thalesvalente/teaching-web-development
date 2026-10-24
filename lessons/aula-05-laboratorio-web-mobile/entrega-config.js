/**
 * CONFIGURAÇÃO DA DISCIPLINA WEB — não reutilizar endpoint Mobile/PPI.
 * Candidata QA: endpoint vazio e activated:false. O runner injeta a URL /exec
 * somente no contexto isolado. Publicação exige nova aprovação.
 * Atenção: o endpoint é público; nenhum segredo ou token deve ficar aqui.
 */
window.WebEntregaConfig = Object.freeze({
  endpoint: '',
  activated: false,
  activity: 'WEB-AULA05-2026',
  schema: 'web-a05-submission-v2'
});
