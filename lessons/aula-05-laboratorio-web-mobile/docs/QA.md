# QA — Aula 05 v4: Laboratório Vivo, regra visual e tutorial contextual

## Gates principais

- [ ] O corpo HTML não exige rolagem vertical/horizontal em 1440×800, 1280×720, 1024×768, 390×844, 360×844.
- [ ] Enunciado (Faça/Observe/Entenda), Localizar, Executar, Conferir e feedback estão no mesmo painel sempre visível; nenhum botão conduz o estudante a outra seção distante.
- [ ] Em telas estreitas, Código/Resultado alternam sem recarregar o arquivo nem perder a missão, e a missão continua no viewport.
- [ ] Os quizzes das missões 02 e 14 são respondidos **dentro do painel da missão** e os resultados aparecem junto à questão.
- [ ] Localizar marca o trecho dentro de `ProjetoUniversal.tsx` e move apenas a rolagem interna do editor.
- [ ] 14 exercícios, 3 ciclos, 100 XP, pontuação idempotente e XP acumulativos preservados entre edição, execução, conferência, recarga e importação.
- [ ] Runtime React Native Web executa fonte TSX real em duas instâncias independentes; erros de compilação bloqueiam XP.
- [ ] Exportação parcial JSON, Markdown e impressão continuam disponíveis em janela sem quebrar o lugar do estudante.
- [ ] Rascunhos v3/v1 permanecem preservados sob chaves anteriores; a v4 abre com código de referência atualizado e oferece exportação explícita do backup, sem sobrescrever.
- [ ] Acessibilidade básica: navegação por teclado, aria-live no feedback, nomes acessíveis, modal, contraste e foco visíveis.
- [ ] Iframe com `sandbox="allow-scripts"`, sem `allow-same-origin`; sem CDN no Pages; build local reproduzível.

## Testes

Execute `npm ci && npm run build && npm run check:logic && npm run test:e2e` em ambiente com Chromium/Playwright. As resoluções e fluxos acima devem ser verificados no browser real. `tests/source.test.mjs` cobre contratos estruturais; `tests/lab.spec.mjs` faz cenários E2E. No Pages, conferir HTTP 200 e hash de arquivos no CI.

## Limites explícitos

React Native Web estreito **não** é execução nativa Android/iOS. WCAG 2.2 AA requer testes assistivos manuais adicionais; Playwright, rolagem controlada e inspeção de DOM são verificações parciais. Sem teste nativo no laboratório, marcar NÃO VERIFICADO. Não publicar soluções da atividade avaliativa anterior.

## Gates adicionais v4

- [ ] `accessibilityHint={orientacao}` e o `Text` visível `testID="ajuda-titulo"` exibem a mesma regra dinâmica, sem usar placeholder como instrução.
- [ ] Contador `testID="contador-caracteres"` usa `titulo.trim().length` e reage à digitação, mesmo após tentativa inválida.
- [ ] Alterar limites de 5–60 para 7–30 atualiza a instrução visual **em ambas as prévias** e preserva a validação de fronteira.
- [ ] Todas as 14 missões mostram conceito-chave e teste concreto na própria bancada, sem HTML executável vindo dos enunciados.
- [ ] Rascunho antigo disponível para download e carregamento inicial do exemplo novo, sem perda silenciosa.
- [ ] Glossário distingue rótulo, placeholder, acessibilidade, regra visível e erro; em tela estreita não surge rolagem de documento.
- [ ] E2E verifica teste de entrada inválida, ajuda permanente, correção, estados independentes, limites alterados e backup.

A auditoria WCAG 2.2 AA com tecnologias assistivas permanece pendente; o workflow comprova somente os cenários implementados.



## Gates de continuidade e diagramação A4

- [ ] O JSON de progresso contém código TSX, questão parcialmente respondida, missão ativa, notas, marcadores concluídos e XP; seu conteúdo sobrevive a recarga e importa num **segundo contexto de navegador**, sem estado compartilhado.
- [ ] Arquivos com JSON malformado, schema incompatível, IDs duplicados, XP divergentes ou código ausente são rejeitados **sem substituir o trabalho atual**; cancelar a importação também o preserva.
- [ ] O PDF de 0/100 e o PDF com pontos parciais mostram exatamente 14 missões, pontuação atual e respostas não respondidas; não alteram XP nem acionam Apps Script.
- [ ] O documento impresso é A4, tem cores IFMA verde/vermelho, cabeçalho institucional, identificação, resultados por missão e observações, sem Markdown bruto, com texto selecionável e paginação.
- [ ] Texto arbitrário digitado pelo aluno usa `textContent`, sem interpretá-lo como HTML no relatório.
- [ ] Gerar PDF pode repetir-se sem acumular cópias do relatório oculto.

Os testes automatizados não substituem inspeção visual de páginas complexas nem auditoria assistiva integral WCAG 2.2 AA.


## Gates para equipes e integrantes

- [ ] Formulário solicita somente nome da equipe e nomes completos; não há campo de matrícula ou turma.
- [ ] Inclusão e remoção de 1–8 integrantes, etiquetas acessíveis, foco e resumo atualizado.
- [ ] Nomes duplicados normalizados e nomes sem sobrenome impedem submissão, mas não impedem exportação de progresso parcial.
- [ ] JSON de continuidade conserva a equipe, os nomes e o ID técnico automático entre navegadores.
- [ ] PDF institucional e Markdown incluem a identificação da equipe sem expor matrícula.
- [ ] O receptor Apps Script 1.1.0 valida a equipe, cria uma linha por integrante nos quatro bimestres e uma linha por grupo em Equipes e Auditoria.
- [ ] Reenvio da mesma equipe não duplica a linha coletiva nem sobrescreve notas da Aula 04.
- [ ] URL /exec antiga (receptor 1.0.0) não é apresentada como compatível; receber alunos continua bloqueado até nova implantação e QA real.
