# Aula 05 — Roteiro docente: Laboratório Vivo Web ↔ Mobile v4

## Mudança de metodologia

A página anterior dividia aprendizagem em três grandes seções: contextualização, editor, cartões com exercícios. A ação indicada em um cartão ficava em outra posição da página, forçando a turma a subir e descer para testar. **No Laboratório Vivo v4, a missão, conceito-chave, teste concreto, código e prévia compõem um único posto de trabalho**, com uma missão ativa de cada vez. Testes e quizzes são resolvidos no painel da própria tarefa.

Preservamos as **14 missões e 100 XP formativos**, o código React Native TSX comentado e a execução Web/visualização estreita. Não mudamos o contrato de avaliação E3-I1 da Aula 4 e não substituímos o repositório Mobile nem o Vue anterior.

## Aplicação nos 100 minutos

| Tempo | Método | Evidência |
|---|---|---|
| 0–10 min | Abrir a bancada, executar o projeto e demonstrar onde ficam instrução, código e resultado | Aluno identifica os três locais sem rolagem de documento |
| 10–25 min | Exercícios 01–04; localizar [04]/[06], alterar título/dica e executar | Explica `useState`, `onChangeText` e os efeitos nas prévias |
| 25–65 min | Exercícios 05–08 individualmente; professor intervém pelo método perguntar → localizar → testar | Regras mínimo/máximo, botão e feedback compreendidos |
| 65–85 min | Troca de hipóteses em dupla e um caso de erro (retorno da compilação visível sob as prévias) | Estudante encontra a linha que causou erro e corrige |
| 85–100 min | Exportar evidências parciais e explicar uma mudança individualmente | Evidência fiel ao que foi realizado, sem exigir 100 XP |

Os exercícios 09–14 são extensão para outro momento. Não transformar pontuação formativa em cobrança de finalização integral no encontro.

## Como intervir

1. **Não navegue pela página** procurando o exercício: selecione a missão pelo número no painel à esquerda.
2. Peça ao estudante para ler **Faça → Observe → Entenda** e estimar a resposta esperada antes de modificar.
3. Use **Localizar linha** para mostrar o ponto no **arquivo completo**, mantendo o enunciado visível.
4. Após **Executar**, compare as duas instâncias e pergunte se compartilhar o componente sincroniza dados (não sincroniza).
5. Ao clicar **Conferir missão**, analise o feedback ao lado da tarefa e peça explicação antes de seguir.
6. Abra **Evidências** somente no fechamento; a janela pode ser fechada para retornar ao mesmo exercício.

## Validação e limites

- Desktop deve apresentar missão, Executar, Conferir, código e resultado **dentro de 1440×800**, sem scroll de documento.
- Em 1024 px ou celular, apenas o editor/resultado alternam: o painel contextual é preservado e o aluno não precisa buscar a tarefa em outro endereço da página.
- XP são formativos, não a avaliação E3-I1.
- Prévia móvel estreita não equivale a React Native em Android/iOS real; validar com Expo em aparelho quando disponível.
- Revisão automatizada Chromium/Node não certifica WCAG 2.2 AA; revisar zoom, navegação assistiva e foco.
- Alteração da stack/scope curricular da Aula 5 exige registro de replanejamento conforme regras do curso, sem desconsiderar a trajetória Vue já feita.

## Microintervenção sobre `TextInput`, dica e acessibilidade (5–8 minutos)

Abra a missão 04. Peça que um estudante identifique primeiro o **rótulo** (“Título da memória”), depois o **exemplo** (placeholder). Pergunte: “Onde a regra de 5 a 60 aparece quando o aluno já está digitando?” Agora há um `Text` **sempre visível** abaixo do campo. Explique que `accessibilityHint` oferece orientação à tecnologia assistiva, mas não substitui a instrução para quem lê a tela.

Em seguida, no bloco [02], modifique `MINIMO_CARACTERES` para 7 e execute. Aponte a mesma variável `orientacao` no `accessibilityHint` e no `Text` visual. Solicite um caso de seis caracteres (rejeitado) e outro de sete (aceito). Finalmente, mostre que cada instância Web e prévia móvel mantém estado próprio.

Esta microintervenção não cria uma prova extra: é diagnóstico formativo e observação do modelo mental. Preserve o ritmo original da aula e não exija 100 XP num único encontro.

## Atualização sem perda de trabalhos

O laboratório v4 inicia com um exemplo corrigido; não substitui automaticamente um TSX salvo no navegador na versão anterior. Havendo código anterior, aparece a opção de **baixar backup**. Oriente que o estudante compare e reaplique apenas suas próprias alterações, sem fazer sobrescrita automática.



## Entrega coletiva e nomes dos integrantes

Organize as missões em equipe, mantendo a experimentação e o feedback formativo. Uma pessoa registra no botão **Equipe e integrantes** apenas o nome da equipe e os nomes completos dos participantes. Não exigir matrícula ou turma. O laboratório aceita até oito integrantes e permite salvar/retomar a lista no JSON junto do TSX e dos XP.

Na entrega coletiva há uma linha por integrante em cada bimestre da planilha Web, um registro da equipe e outro na Auditoria. Os XP não são nota; nenhuma pontuação da Aula 04 será alterada automaticamente. A identidade declarada exige conferência do docente. Evite que integrantes enviem o mesmo trabalho a partir de JSONs diferentes: escolha um responsável por acionar o envio final.
