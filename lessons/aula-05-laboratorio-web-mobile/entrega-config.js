/**
 * CONFIGURAÇÃO DA DISCIPLINA WEB — não reutilizar endpoint Mobile/PPI.
 * Após implantar Code.gs em Apps Script, substituir '' pela URL /exec
 * específica do projeto Web. O Web App começa com POST bloqueado.
 *
 * Atenção: o endpoint é público; nenhum segredo ou token deve ficar aqui.
 */
window.WebEntregaConfig = Object.freeze({
  endpoint: 'https://script.google.com/macros/s/AKfycbyDC9tGFBTOjZXau4m2vWQVPoYa3gZKMldc1NjAMZCUstHx0SICMG8Z4ekAWvLfnmlc/exec',
  // true somente após teste de POST real, conferência da Auditoria e
  // autorização docente: URL /exec isolada não significa recebimento ativo.
  activated: false,
  activity: 'WEB-AULA05-2026',
  schema: 'web-a05-submission-v1'
});
