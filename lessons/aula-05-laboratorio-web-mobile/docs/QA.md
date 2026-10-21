# Plano de QA — Aula 05 v2, fonte comentada e 14 exercícios

## Gate de conteúdo e didática

- [ ] O TSX abre completo, comenta os blocos `[01]` a `[07]`, explica o fluxo input → estado → validação → UI.
- [ ] Cada exercício apresenta **Faça**, **Observe**, **Por quê?** e **pista opcional**.
- [ ] O guia permanece junto ao editor; Localizar no código seleciona o trecho real do **arquivo editável**.
- [ ] Existem 14 exercícios em 3 ciclos; 8 essenciais, 6 de extensão; somatório = 100 XP formativos.
- [ ] Cada edição pequena mostra seu impacto no mesmo TSX nas duas prévias.
- [ ] A nota oficial de Web e a modalidade nativa Expo não são afirmadas automaticamente.

## Gate funcional automatizado (Chromium + Node)

- TSX parseado via TypeScript, sem erros; exportações e comentários didáticos obrigatórios.
- Runtime React Native Web carregado localmente, sem CDN; duas renderizações independentes.
- Alterar título, dica, mínimo, máximo, botão, prefixo de erro, mensagem de sucesso e cor produz mudanças observáveis na UI e testes.
- Casos 6/7, 30/31 caracteres, espaços externos/internos, entrada inválida e estados independentes.
- Testes negativos: código TSX inválido não recebe XP; missão não pontua antes de executar; edição invalida XP técnico, sem eliminar compreensão conceitual.
- Feedback não aumenta XP ao clicar repetidamente; evidência exportável com todos os exercícios e estado PENDENTE.
- Rascunho v1 preservado e backup explícito disponível quando encontrado; v2 nunca carrega v1 automaticamente.
- Responsividade verificada com 360, 390, 768, 1280 e 1600 px; sem overflow horizontal; navegação por teclado e foco visível.
- `iframe sandbox="allow-scripts"` sem `allow-same-origin`, importações restritas a `react` e `react-native`.
- Pages: HTTP 200 + SHA-256 de código publicado; portal mantém links anteriores.

## Não verificado pelo navegador

- Execução nativa Android/iOS, integração ao app Expo específico do estudante e conectividade real do laboratório.
- WCAG 2.2 AA completa exige auditoria manual com TalkBack/VoiceOver, zoom e análise de contraste/foco; testes de overflow são apenas parte desse trabalho.
- Autoria e compreensão individual exigem explicação oral/demonstração, não apenas pontuação.

Se algum teste ou ambiente falhar, declare **NÃO VERIFICADO** ou gate FAIL, nunca aprovação presumida.
