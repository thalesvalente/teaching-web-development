/** Não executar ensaios fictícios no boletim da turma. */
function executarHomologacaoMatriculasV3(){
  throw new Error('AMBIENTE_PRODUCAO: homologação preservada na cópia QA. Use verificarStatusProducaoWeb.');
}
