# QA — Aula 05 v3: bancada sem rolagem descontextualizada

## Gates principais

- [ ] O corpo HTML não exige rolagem vertical/horizontal em 1440×800, 1280×720, 1024×768, 390×844, 360×844.
- [ ] Enunciado (Faça/Observe/Entenda), Localizar, Executar, Conferir e feedback estão no mesmo painel sempre visível; nenhum botão conduz o estudante a outra seção distante.
- [ ] Em telas estreitas, Código/Resultado alternam sem recarregar o arquivo nem perder a missão, e a missão continua no viewport.
- [ ] Os quizzes das missões 02 e 14 são respondidos **dentro do painel da missão** e os resultados aparecem junto à questão.
- [ ] Localizar marca o trecho dentro de `ProjetoUniversal.tsx` e move apenas a rolagem interna do editor.
- [ ] 14 exercícios, 3 ciclos, 100 XP, pontuação idempotente e invalidação após edição preservadas.
- [ ] Runtime React Native Web executa fonte TSX real em duas instâncias independentes; erros de compilação bloqueiam XP.
- [ ] Exportação parcial JSON, Markdown e impressão continuam disponíveis em janela sem quebrar o lugar do estudante.
- [ ] O rascunho v2 é preservado e o rascunho v1 pode ser exportado; sem perda da produção anterior.
- [ ] Acessibilidade básica: navegação por teclado, aria-live no feedback, nomes acessíveis, modal, contraste e foco visíveis.
- [ ] Iframe com `sandbox="allow-scripts"`, sem `allow-same-origin`; sem CDN no Pages; build local reproduzível.

## Testes

Execute `npm ci && npm run build && npm run check:logic && npm run test:e2e` em ambiente com Chromium/Playwright. As resoluções e fluxos acima devem ser verificados no browser real. `tests/source.test.mjs` cobre contratos estruturais; `tests/lab.spec.mjs` faz cenários E2E. No Pages, conferir HTTP 200 e hash de arquivos no CI.

## Limites explícitos

React Native Web estreito **não** é execução nativa Android/iOS. WCAG 2.2 AA requer testes assistivos manuais adicionais; Playwright, rolagem controlada e inspeção de DOM são verificações parciais. Sem teste nativo no laboratório, marcar NÃO VERIFICADO. Não publicar soluções da atividade avaliativa anterior.
