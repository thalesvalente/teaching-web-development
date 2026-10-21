# Aula 05 — Laboratório comentado: um código, duas telas

**IFMA Campus Itapecuru-Mirim · Desenvolvimento de Sistemas Web · 2026.2 · versão 2.0.0**

Aula prática de **transição Vue → React/React Native**, seguindo uma única aplicação completa, sem descartar as atividades anteriores. O estudante modifica `shared/ProjetoUniversal.tsx` e observa **duas instâncias reais de React Native Web no navegador**: uma em largura Web, outra em largura de celular. **A segunda não é emulador Android/iOS**; o roteiro de execução nativa está em `docs/EXPO-REAL.md`.

## Como abrir

- Portal GitHub Pages: https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/
- Visualização local: executar `python3 -m http.server 8000` nesta pasta e abrir `http://127.0.0.1:8000/`. Não funciona abrindo `index.html` diretamente como `file://`.
- Reproduzir o bundle local de dependências (Node/npm preparados): `npm ci` e `npm run build`. A versão publicada já contém o bundle, sem CDN.

## Aprendizagem guiada

**14 exercícios em 3 ciclos (até 100 XP formativos):**

| Ciclo | Exercícios | Foco | Tempo de referência |
|---|---|---|---|
| 1 — Encontre o todo | 01–04 | Executar, identificar o fluxo do estado, trocar título e dica | 21 min |
| 2 — Mude e compare | 05–10 | Limites, botão, erro, sucesso e cor | 44 min |
| 3 — Teste e explique | 11–14 | `trim`, dados inválidos, instâncias independentes e reflexão | 35 min |

**Em sala, priorize exercícios 01–08.** Exercícios 09–14 são aprofundamento e podem ser concluídos depois. Os 100 minutos representam o tempo estimado para o roteiro todo, e **não uma exigência de 100 XP em 100 minutos**. O roteiro docente distribui o encontro com tempo para orientação e fechamento.

Cada missão tem **Faça → Observe → Por quê? → Localizar no código → Testar → Avançar**, mais uma pista opcional. Os botões não entregam a solução: a pontuação depende de resultado executado no código ou de respostas conceituais verificadas. O progresso parcial pode ser exportado como JSON ou Markdown, e impresso em PDF; questões pendentes permanecem pendentes. XP **não é a nota oficial** da disciplina e não altera a avaliação E3-I1 da Aula 04.

## Código e arquivos

```
index.html                      Guia, 14 desafios e exportação de evidências
lab.js / style.css              Navegação do laboratório e feedback de cada missão
shared/ProjetoUniversal.tsx     Única fonte React Native TSX completa, comentada e editável
preview.html / preview.js       Duas instâncias React Native Web em iframe sandbox
assets/vendor.js                Runtime compilado e versionado (sem dependência de CDN)
docs/GUIA_ALUNO.md              Como navegar, localizar trechos e depurar
docs/ROTEIRO-DOCENTE.md          Sequência realista para 100 min e limites
/docs/EXPO-REAL.md              Como executar o TSX em um app Expo de verdade
docs/QA.md                     Gates e evidências previstas
```

O arquivo TSX é comentado em **sete blocos numerados**: importações; configurações; regra de negócio; estado; ação; interface; estilos. O guia seleciona o trecho real dentro do código completo. A aba `Ponte: Vue` mostra um exemplo completo e independente, **não** uma migração automática de `.vue` para `.tsx`.

## QA e segurança

- Verificação estrutural: `npm run check:logic`.
- Verificação de interface real com Chromium/Playwright: `npm run test:e2e`. Ambiente com Chromium preparado é obrigatório; a CI instala o navegador.
- Fonte editada executa em `iframe sandbox="allow-scripts"`, **sem** `allow-same-origin`. Importações didáticas permitidas: `react`, `react-native`.
- O laboratório **não** modifica `src/`, os trabalhos Vue anteriores nem o repositório de Mobile; tampouco envia código/evidências ao professor. Não cole dados pessoais nem segredos.
- Rascunhos v2 usam chave própria no armazenamento local. Caso exista código da v1, há botão para exportá-lo, sem sobrescrever automaticamente o editor v2.
- Leitura responsiva e verificações automatizadas **não equivalem à conformidade WCAG 2.2 AA integral**, que requer revisão assistiva manual.

Referências técnicas: [Expo — Web](https://docs.expo.dev/workflow/web/) e [React Native Web](https://necolas.github.io/react-native-web/docs/installation/).
