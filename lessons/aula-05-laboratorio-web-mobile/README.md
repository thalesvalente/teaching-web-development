# Aula 05 — Bancada de código Web ↔ Mobile · versão 3.0.0

**IFMA Campus Itapecuru-Mirim · Desenvolvimento de Sistemas Web · 2026.2**

A Aula 05 agora opera como uma **bancada única**, e não uma página de cartões e seções distantes. O aluno encontra a missão atual, o código completo comentado, o botão Executar, o botão Conferir missão e os resultados no mesmo contexto visual. Desktop mostra editor e as duas prévias lado a lado; telas estreitas têm alternador Código/Resultado e preservam as instruções da missão. **O documento não exige rolagem vertical para sair do enunciado e chegar à interação.**

## Entrar

- GitHub Pages: https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/
- Em servidor local: `python3 -m http.server 8000`, na pasta da aula; abra `http://127.0.0.1:8000/`. `file://` não é suportado porque o TSX é carregado via `fetch()`.
- Reproduzir dependências: `npm ci`, depois `npm run build`. O Pages contém `assets/vendor.js` e não precisa de CDN.

## Usar a bancada (sem subir e descer na página)

1. **Escolha** o exercício no seletor da missão. Você verá um enunciado por vez.
2. Leia **Faça → Observe → Entenda** no painel à esquerda. Nas missões teóricas, **as perguntas aparecem dentro do próprio painel**, e não em outra parte da página.
3. Clique em **Localizar linha**: o arquivo integral abre no trecho correspondente, com seleção visível, sem deslocar a página.
4. Edite o código e clique em **Executar** no mesmo painel; observe a Web e a prévia móvel. Em telas estreitas, a aba **Resultado** é ativada após compilação bem-sucedida.
5. Clique em **Conferir missão**; o feedback fica imediatamente abaixo do enunciado. Use **Anterior**, **Próxima** ou o seletor para trocar de desafio.
6. **Evidências** abre uma janela que preserva o ponto de trabalho, permite registrar observações e baixar JSON/Markdown/PDF mesmo com pendências.

## Currículo, ritmo e pontuação

14 exercícios em três ciclos: 01–04 conhecer a aplicação; 05–10 modificar e comparar; 11–14 testar, explicar e aprofundar. Total de **100 XP formativos**, sem equivalência com nota institucional. No encontro de **100 minutos, priorize 01–08**; os demais são de extensão, não devem pressionar o ritmo.

## Código completo

`shared/ProjetoUniversal.tsx` tem sete blocos comentados: [01] importações, [02] configurações, [03] validação, [04] estado, [05] ação, [06] JSX/interface, [07] estilos. As abas **Rota Expo** e **Comparar Vue** oferecem arquivos completos para consulta, sem substituir o código da turma.

O arquivo React Native é realmente executado **duas vezes via React Native Web**, em estados independentes. A visualização móvel estreita **não é emulador Android/iOS**; consulte `docs/EXPO-REAL.md` para integração real com Expo. Compartilhar componente não sincroniza dados automaticamente.

## Integridade e qualidade

`npm run check:logic` valida estrutura e 14 missões. `npm run test:e2e` executa browser real com Playwright e verifica ausência de rolagem do documento, ações próximas à missão, quizzes contextualizados, renderização, XP, exportações, responsividade e links lógicos. Nenhum dado vai automaticamente ao professor; o TSX roda em `iframe sandbox="allow-scripts"`, de origem opaca, sem `allow-same-origin`. Não coloque senhas ou dados pessoais no editor.

A versão 3 **reaproveita a chave de rascunho v2**, preservando alterações já feitas, e permite exportar o antigo rascunho v1 quando existir. Testes automatizados não substituem auditoria WCAG 2.2 AA com tecnologias assistivas.

Referências: [Expo — Web](https://docs.expo.dev/workflow/web/) e [React Native Web](https://necolas.github.io/react-native-web/docs/installation/).
