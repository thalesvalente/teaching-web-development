# Aula 05 — Roteiro docente (laboratório comentado v2)

## Finalidade

Esta aula substitui **somente o foco do encontro 5** por uma transição controlada Vue → React, articulada à disciplina Mobile React Native + Expo. O plano original Web v2 previa composição/refatoração Vue e introdução ao Vue Router: registre o replanejamento e reconcilie seus objetivos com os próximos encontros. Não altere retrospectivamente evidências/notas da Aula 4.

## Correção pedagógica adotada

A primeira edição tinha um arquivo TSX relativamente compacto, explicações em fragmentos e **apenas cinco missões**. A edição v2 implementa:

1. **Um arquivo-fonte completo e comentado** (`ProjetoUniversal.tsx`) com sete blocos numerados e indicações cruzadas.
2. **Guia de ação junto do editor** (Faça → Observe → Por quê?), botão para localizar código, pistas progressivas e botões para avançar/voltar.
3. **Quatorze exercícios em três ciclos**, com oito tarefas nucleares e seis de extensão sem obrigatoriedade de terminar no encontro.
4. **Oito pequenas alterações de código**, três experimentos de comportamento, uma exploração inicial e duas verificações conceituais.
5. Testes automáticos do **comportamento executado** nas duas instâncias; estados independentes, não emuladores nativos.

## Plano realista de 100 minutos

| Tempo | Condução | Critério observável |
|---|---|---|
| 0–10 min | Professor demonstra duas instâncias e pergunta por que contadores não sincronizam | Alunos sabem o resultado esperado, sem sintaxe nova |
| 10–25 min | Alunos encontram os sete blocos, fazem exercícios 01–04 | Localizam useState, onChangeText, configurações e efeito imediato |
| 25–65 min | Laboratório com pares de revisão; exercícios 05–08 | Editam limites, botão e erro; compilam e testam sem apagar o arquivo |
| 65–85 min | Retomada guiada: entradas de borda, erro de compilação intencional e depuração | Explicam o return e a relação da regra com o JSX |
| 85–100 min | Exportar evidências **parciais** e explicar individualmente uma mudança | Evidência reflete apenas verificações efetivamente realizadas |

Os exercícios 09–14 são **extensão para ritmos diferentes** ou outra oportunidade. Não exigir 100 XP em 100 minutos. Se parte da turma não concluir o bloco essencial, retomar no encontro seguinte antes de introduzir rotas.

## Roteiro de intervenção ao vivo

- **Demonstrar com um único erro:** modifique uma constante e mostre ambas as prévias. Evite digitar toda a solução.
- **Perguntar antes de corrigir:** em qual arquivo e bloco está a alteração? O que deveria mudar nas duas telas?
- **Voltar ao todo:** do `setTitulo` localizar sua declaração e o componente que o usa.
- **Mostrar que código igual não significa estado sincronizado:** preencha os dois formulários com textos diferentes.
- **Ajudar quem está com dificuldade:** resolver um exercício com o estudante, não todos; permitir sucesso parcial e novo teste.
- **Estudantes avançados:** propor os desafios 09–14 e a execução nativa em Expo, com registro separado dos resultados.

## Critérios e limites

- 14 exercícios = 100 XP formativos; **não** converter XP automaticamente em nota institucional.
- A avaliação E3-I1 da Aula 4 (2,5 pontos) é outra atividade.
- O editor e as duas prévias executam TSX em React Native Web, localmente em iframe isolado. **Não** declará-las duas instalações diferentes.
- Android/iOS nativo, acessibilidade assistiva completa, tráfego de rede do laboratório e integração ao projeto Expo do aluno requerem testes manuais reais.
- A aula nunca grava em `src/` das Aulas 2–4 ou do projeto Mobile. A transição pedagógica não implica migração automática de Vue.

## Material de preparação

`README.md`, `docs/GUIA_ALUNO.md`, `docs/EXPO-REAL.md`, `docs/QA.md` e arquivo completo `shared/ProjetoUniversal.tsx`.
