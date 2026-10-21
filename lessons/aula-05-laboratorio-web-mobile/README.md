# Aula 05 — Um código, duas telas (Web e Mobile)

**IFMA Campus Itapecuru-Mirim · Desenvolvimento Web · 2026.2.** Laboratório de transição entre Vue e React, com código completo, duas prévias reais React Native Web, missões de 100 XP formativos e evidências exportáveis sem bloqueio de questões.

## Abrir

Pelo GitHub Pages: `https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/`.

Para testar localmente a página: execute `python3 -m http.server 8000` nesta pasta e acesse `http://127.0.0.1:8000/` (arquivos `file://` não são suportados).

Para recompilar o fornecedor local: `npm ci && npm run build`. A página publicada carrega os scripts de seu próprio repositório e não exige CDNs.

## O que é verdadeiro e o que não é

- `shared/ProjetoUniversal.tsx` é um **componente React Native real**, completo e editável.
- As duas telas do laboratório executam essa fonte via **React Native Web no navegador**, em dois contêineres com estados independentes. Não são dois frameworks separados nem dois dispositivos reais.
- A prévia estreita representa a **largura de uma tela móvel**, **não** um Android/iOS emulado. Para executar o código nativo, consulte `docs/EXPO-REAL.md`.
- O programa **não** escreve em `src/` do projeto Vue nem modifica o repositório Mobile existente. Não existe migração automática de `.vue` para `.tsx`.
- A atribuição de XP apenas devolve feedback técnico formativo. A nota E3-I1 da Aula 4 é independente.

## Organização

```
index.html                      Aula + missão gamificada + evidências
shared/ProjetoUniversal.tsx     ÚNICA fonte real compartilhada, editada no editor
preview.html / preview.js       Web + prévia móvel em iframe sandbox (origem opaca)
lab.js / style.css              Interface do laboratório, pontuação e exportação
assets/vendor.js                Dependências empacotadas pelo CI (sem CDN)
docs/ROTEIRO-DOCENTE.md          Tempo, objetivo, decisões e avaliação formativa
docs/EXPO-REAL.md               Como executar o componente no Expo real
```

## Avaliação formativa

O sistema verifica renderização dupla (10 XP), limite 6/7 (25 XP), rótulo reutilizado (20 XP), comportamento de validação e independência (25 XP), e compreensão da diferença Web/Expo (20 XP). Pontos são ganhos por verificação, sem inventar nota oficial. Se o código mudar, as conquistas que dependem dele são invalidadas até serem retestadas. As evidências parciais podem ser impressas ou exportadas.

## Segurança

O código editado é executado dentro de `iframe sandbox="allow-scripts"`, sem `allow-same-origin` e com importações de módulos restritas a `react` e `react-native`. O laboratório não é um serviço de execução de código arbitrário para desconhecidos: não cole segredos nem códigos externos. O armazenamento local de rascunhos é opcional e pode ser apagado nas configurações do navegador.

Fontes técnicas: [Expo — Developing for web](https://docs.expo.dev/workflow/web/), [React Native Web](https://necolas.github.io/react-native-web/docs/installation/).
