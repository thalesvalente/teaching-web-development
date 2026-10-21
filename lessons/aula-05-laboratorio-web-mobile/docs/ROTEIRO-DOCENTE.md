# Aula 05 — Laboratório de transição Web ↔ Mobile

## Decisão arquitetural (didática)

O plano Web v2 previa, originalmente, composição e refatoração Vue com introdução ao Vue Router neste encontro. Esta aula de transição é um **replanejamento deliberado**: a versão Vue das aulas anteriores é preservada; o laboratório introduz React e um componente universal como ponte para a turma que já trabalha com Expo React Native. O ajuste deve ser registrado na documentação de ensino, conforme regras institucionais aplicáveis. A atividade é **formativa** e não substitui a nota E3-I1 da Aula 4.

## Objetivo observável

Ao término, estudante identifica arquivo completo do componente; edita uma regra; executa novamente; observa mudanças simultâneas em prévia Web e prévia de largura móvel; explica a diferença entre React DOM, React Native Web e execução Expo nativa.

## Cronograma sugerido (100 minutos)
- 0–10 min: duas prévias e requisito único; teste manual de entradas vazias, curtas e válidas
- 10–25 min: mapa de arquivos; equivalência Vue `ref/v-model` ↔ React `useState/onChangeText`
- 25–45 min: leitura guiada do arquivo completo e busca do fluxo input → validação → estado → resultado
- 45–75 min: três modificações sobre o MESMO arquivo; executar → observar → corrigir; XP formativa
- 75–90 min: discussão de teste de borda, verificação de funcionamento e independência do estado
- 90–100 min: exportar evidências parcial/total e registrar uma explicação individual

## Rubrica formativa (100 XP, não é nota)
- 10 XP — compilar e executar nos dois painéis
- 25 XP — alterar limite e comprovar casos 6/7 caracteres
- 20 XP — alterar rótulo do botão com efeito nos dois painéis
- 25 XP — comprovar bloqueio inválido, registro válido e estado independente
- 20 XP — responder corretamente duas perguntas de arquitetura

A validação de código ocorre em **iframe sandbox isolado sem acesso à origem**. Não cole senhas, tokens ou código externo. O código é executado localmente no navegador e NÃO enviado ao professor. Exportar evidência é uma ação explícita do aluno. Impressão respeita XP parcial e não exige finalizar questões. O professor deve observar a explicação, independentemente dos testes automatizados.

## Não ensinar neste encontro

Não exigir Vue Router, Expo Router, hooks avançados, servidor, banco, consumo de API, monorepo nem TypeScript avançado. O foco está no código completo e na transferência de conhecimento entre plataformas. Para Android/iOS real, consulte `docs/EXPO-REAL.md`.
