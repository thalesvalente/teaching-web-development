# Aula 05 — Prévia mobile para homologação de usabilidade (sem notas)

- Endereço mantido: https://thalesvalente.github.io/teaching-web-development/previews/aula05-mobile-20261027/
- Fonte UX: PR #32 (`8229a2b198ae9f3059bce7374d42c347402dc66d`), adaptada e integrada à `main` pela PR #38 (`a42aef49aa0e941356e2e91c65e2133a4ceb9dca`).
- Esta pasta é um **snapshot estático isolado**. Não altera o laboratório oficial, Apps Script, planilhas, cadastro ou notas.
- A configuração `entrega-config.js` permanece com `endpoint:''`, `activated:false`, `qaRequested:false` e `configureQa:async()=>false`: nenhum POST de notas e nenhuma consulta de matrícula é possível nesta prévia.
- **Gerar PDF (sem envio)** somente prepara documentos locais; não constitui recibo nem entrega oficial. Testar com equipe e matrícula **fictícias**; nomes na prévia podem aparecer como *não conferidos*.
- Em celular: usar abas **Missão → Código → Resultado**. O ajuste mobile cobre viewports até 710 px ou dispositivos touch com viewport lógico ampliado. Código editável 14 px (13 px até 365 px); `Ampliar` recolhe abas de arquivos.
- Salvamento JSON, XP, PDF e recuperação opcional de código legado são locais. O arquivo antigo nunca substitui automaticamente o código corrente.
- O arquivo `preview.html` usa React Native Web em largura móvel; isso não equivale a Android/iOS nativo.
- Cache de interface: `web-mobile-layout-05` para CSS principal, lógica do laboratório e iframe; `equipe-roster.js` usa `web-mobile-offline-06` para invalidar cache do navegador; outros módulos mantêm `web-mobile-editor-03`.
- Gates para publicação: CI da prévia, HTTP 200, hashes SHA-256 do GitHub Pages e validação docente em celular físico. **Não usar esta prévia para entrega de notas.**
