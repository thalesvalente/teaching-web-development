# Aula 05 — Laboratório Vivo · Tutorial Web ↔ Mobile · versão 4.0.0

**IFMA Campus Itapecuru-Mirim · Desenvolvimento de Sistemas Web · 2026.2**

O **Laboratório Vivo** opera como uma **bancada tutorial única**, e não uma página de cartões e seções distantes. O aluno encontra a missão atual, o código completo comentado, o botão Executar, o botão Conferir missão e os resultados no mesmo contexto visual. Desktop mostra editor e as duas prévias lado a lado; telas estreitas têm alternador Código/Resultado e preservam as instruções da missão. **O documento não exige rolagem vertical para sair do enunciado e chegar à interação.**

## Entrar

- GitHub Pages: https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/
- Em servidor local: `python3 -m http.server 8000`, na pasta da aula; abra `http://127.0.0.1:8000/`. `file://` não é suportado porque o TSX é carregado via `fetch()`.
- Reproduzir dependências: `npm ci`, depois `npm run build`. O Pages contém `assets/vendor.js` e não precisa de CDN.

## Usar a bancada (sem subir e descer na página)

1. **Escolha** o exercício no seletor da missão. Você verá um enunciado por vez.
2. Leia o **conceito-chave**, depois **Faça → Observe → Entenda** e **Teste concreto** no painel à esquerda. Nas missões teóricas, **as perguntas aparecem dentro do próprio painel**, e não em outra parte da página.
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

`npm run check:logic` valida estrutura e 14 missões. A regressão XP percorre as 14 missões e oito alterações cumulativas, exercita falha de compilação e revisão coletiva, e prova que nenhuma aprovação anterior é apagada. `npm run test:e2e` executa browser real com Playwright e verifica ausência de rolagem do documento, ações próximas à missão, quizzes contextualizados, renderização, XP, exportações, responsividade e links lógicos. Nenhum dado vai automaticamente ao professor; o TSX roda em `iframe sandbox="allow-scripts"`, de origem opaca, sem `allow-same-origin`. Não coloque senhas ou dados pessoais no editor.

A versão 4 usa uma **nova chave de rascunho**. Rascunhos v3/v1 ficam intactos no armazenamento local e, quando encontrados, aparecem por um botão **Baixar meu código anterior**. O tutorial novo não apaga nem carrega automaticamente códigos antigos que não contenham a orientação visual corrigida. Testes automatizados não substituem auditoria WCAG 2.2 AA com tecnologias assistivas.

Referências: [Expo — Web](https://docs.expo.dev/workflow/web/) e [React Native Web](https://necolas.github.io/react-native-web/docs/installation/).

## Regras claras para todos os estudantes

O exemplo que aparece *dentro* do campo é `placeholder={DICA_CAMPO}` e some quando se digita. `accessibilityLabel` fornece o nome acessível, e `accessibilityHint` é uma orientação complementar para tecnologias assistivas: **não desenha texto visível**. A regra “Digite de 5 a 60 caracteres. Espaços nas extremidades não contam.” agora aparece num `Text` permanente abaixo do campo, e **a mesma variável `orientacao` alimenta o `accessibilityHint` e o texto visível**. Um contador também exibe `titulo.trim().length`, coerente com a função `validarTitulo`.

Mude `MINIMO_CARACTERES` ou `MAXIMO_CARACTERES`, clique **Executar** e compare, no próprio laboratório, a regra abaixo de ambos os campos com a mensagem de erro ao tentar registrar. O guia da missão apresenta **conceito-chave, ação e teste concreto** antes da conferência.

A atualização é apenas didática; XP não é nota, nenhuma API sincroniza os dados e a prévia estreita não equivale a teste nativo em Android/iOS.



## PDF A4 institucional e continuidade (revisão de QA 2026-10-22)

- **Gerar PDF** abre a janela de impressão. Selecione **Destino → Salvar como PDF**. O relatório segue o padrão das fichas IFMA: cabeçalho institucional verde/vermelho, identificação opcional, XP, tabela de 14 missões, reflexões e paginação A4. A fonte vem do instantâneo formativo real; nenhum campo vazio é preenchido automaticamente.
- **Salvar progresso** baixa `Aula05_Continuar_Depois.json` com TSX, respostas, missão atual, observações, exercícios verificados e XP. **Retomar arquivo** importa esse JSON, inclusive em outro navegador/dispositivo, mediante confirmação do usuário.
- O navegador também salva um rascunho local, quando permitido. **O PDF é evidência estática**, não substitui o JSON para continuar editando. Nenhum desses botões envia dados ao Google Sheets.
- A CI executa Playwright com exportação/importação real do arquivo, sessão independente, erros/cancelamento e um PDF real extraído por Poppler (`pdfinfo`, `pdftotext`, `pdftoppm`). Dados usados no teste são fictícios.
