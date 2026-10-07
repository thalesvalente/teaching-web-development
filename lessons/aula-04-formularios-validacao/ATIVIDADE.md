# Missão 04 — Uma sugestão que o sistema entende

**INF031 — Desenvolvimento de Sistemas Web · IFMA Campus Itapecuru-Mirim · 2026.2**  
**Atividade individual E3-I1 · valor: 2,5 pontos · versão: 1.0.0**  
**Aplicação e prazo:** a comunicar pelo professor. Nenhuma data é presumida.

## Resultado a construir

Continue no seu projeto Vue. Acrescente um formulário para propor uma melhoria relacionada ao contexto do seu projeto. O formulário deve orientar o preenchimento, rejeitar entradas inválidas e comunicar ao App somente sugestões válidas. O App deve mostrar o total de sugestões válidas nesta sessão e os dados da última. Preserve componentes, funcionalidades e personalizações das aulas anteriores.

Trabalhe em `lessons/aula-02-vite-vue-componentizacao`. Crie `src/components/SuggestionForm.vue` e integre ao App. Não crie outro projeto nem substitua seu src/. Preserve o cabeçalho, os cartões de interesse e o rodapé. O contador de sugestões é separado do contador de interesses.

## Regras

- Título obrigatório: input, 5–60 caracteres após trim().
- Descrição obrigatória: textarea, 15–300 caracteres após trim().
- Remova espaços externos para validar e emitir; preserve espaços internos.
- Inválido: mensagens por campo, textos preservados, nenhum evento, nenhum incremento.
- Válido: evento `sugestao` com objeto `{ titulo, descricao }`, exatamente uma vez; pai atualiza o resumo; campos limpos e sucesso visível.
- Nova edição: apagar sucesso anterior e erro antigo do campo editado; revalidar ao submeter.
- Registrar: type=submit e form com @submit.prevent. Não duplicar em @click.
- Limpar: type=button; apagar campos e feedback sem alterar resumo.
- Enter no input envia; Enter no textarea cria linha. Labels associados, erros identificáveis sem depender apenas da cor.
- Estado apenas na sessão; sem API, banco, Router ou localStorage no app. Não afirmar que algo foi enviado ao professor.

O exemplo da biblioteca nos slides é didático e usa outras faixas. Não é a solução pronta da missão. A implementação, o commit, a ficha e a explicação são individuais, mesmo quando o tema é da equipe.

## Checkpoints

0. Execute a base da Aula 3, confira git status e git remote -v e registre o progresso revisado.
1. Conecte dois campos ao estado do novo componente.
2. Normalize e aplique regras de vazio e comprimento.
3. Oriente a correção com mensagens por campo e confirmação verdadeira.
4. Emita o objeto válido e atualize o resumo no App.
5. Execute os casos abaixo, documente o observado e registre seu incremento.

## Verificação

Mantenha `npm run dev` em um terminal. Em outro terminal na pasta do projeto:

```text
node course/runner.mjs status
node course/runner.mjs mission 04
node course/runner.mjs check 04
```

URL padrão: http://127.0.0.1:5173. Outra porta: acrescente `--url http://127.0.0.1:5174`.
Resultados: `docs/entregas/missao-04/checker-04.json`. O checker não dá nota oficial. Automação indisponível = NÃO VERIFICADO. Dependências e navegador são preparados pelo professor; nada é instalado silenciosamente. A explicação, a arquitetura e a revisão visual precisam de avaliação humana.

A primeira instalação usa `instalar-course.mjs` disponível no portal; se course/ já existe, use `node course/runner.mjs update`. O update só atualiza course/ e interrompe se houver alterações locais nessa área. Não use git pull upstream main para receber a missão.

## Contrato neutro de seletores

Acrescente data-testid aos elementos indicados. Isso não impõe nomes de variáveis, estilos ou mensagens literais.

| Seletor | Elemento |
|---|---|
| `suggestion-form` | Elemento form do novo componente |
| `title-input` | input de título |
| `description-input` | textarea de descrição |
| `title-error` | Mensagem de erro do título (v-if ou elemento vazio) |
| `description-error` | Mensagem de erro da descrição |
| `submit-suggestion` | Botão type=submit |
| `clear-suggestion` | Botão type=button que limpa |
| `suggestion-success` | Mensagem de sucesso |
| `suggestion-total` | Elemento que contém somente o número do total de sugestões |
| `suggestion-last-title` | Elemento que apresenta somente o título da última sugestão |
| `suggestion-last-description` | Elemento que apresenta somente a descrição da última sugestão |
| `interest-total` | Elemento com somente o total de interesses da Aula 3 |

Preserve a classe `project-card` e o botão nos dois cartões da Aula 3. Os seletores de erro podem estar ausentes quando não há erro (v-if) ou conter texto vazio. O total deve conter somente o número; títulos/descrições, somente o texto do dado.

## Testes

| ID | Ação/entrada | Esperado |
|---|---|---|
| T01 | Submeter título e descrição vazios. | Dois erros, nenhum registro e total inalterado. |
| T02 | Submeter somente espaços nos dois campos. | Tratar como vazio; não registrar. |
| T03 | Título com 4, 5, 60 e 61 caracteres; descrição válida. | Rejeitar 4 e 61; aceitar 5 e 60. |
| T04 | Descrição com 14, 15, 300 e 301 caracteres; título válido. | Rejeitar 14 e 301; aceitar 15 e 300. |
| T05 | Registrar textos com espaços externos e internos. | Remover espaços externos; preservar os internos nos dados recebidos. |
| T06 | Título inválido e descrição válida; depois inverter. | Erro só no campo inválido; preservar os dois textos. |
| T07 | Corrigir um campo após erro; submeter novamente. | Apagar o erro antigo do campo editado; confirmar um registro válido. |
| T08 | Registrar por clique e depois por Enter no input. | Um incremento por submissão, sem recarregamento. |
| T09 | Pressionar Enter no textarea. | Inserir uma quebra de linha; não registrar. |
| T10 | Limpar durante preenchimento ou após erros/sucesso. | Campos e mensagens vazios; resumo do App preservado. |
| T11 | Registrar válido e clicar novamente após a limpeza. | Não duplicar; a segunda tentativa vazia não incrementa. |
| T12 | Registrar duas sugestões diferentes. | Total 2 e última sugestão igual ao segundo envio. |
| T13 | Usar dois cartões de interesse antes/depois de registrar. | Estados independentes, bloqueio por cartão e resumo de interesses preservados. |
| T14 | Usar Tab, rótulos, mensagens e foco. | Associação label/campo/erro correta; operação por teclado; foco perceptível. |
| T15 | Recarregar o aplicativo. | Estado da sessão reiniciado, sem persistência. |
| T16 | Executar o build no ambiente preparado. | Build concluído; indisponibilidade do ambiente é NÃO VERIFICADO, não aprovação. |

Registre entrada, esperado, observado e evidência. Um maxlength na interface não substitui teste da regra; a automação tenta fazer o valor de fronteira chegar ao validador.

## Rubrica E3-I1

| Critério | Pontos | Evidência |
|---|---:|---|
| Funcionamento e atendimento ao enunciado | 1 | Formulário integrado, registro válido, resumo e funcionalidades anteriores preservadas. |
| Organização e legibilidade | 0,5 | Componente separado, responsabilidades claras e código compreensível. |
| Validação e tratamento de entradas | 0,5 | Vazio, espaços, limites e mensagens por campo tratados corretamente. |
| Explicação individual | 0,5 | Explica o fluxo e demonstra uma pequena alteração de regra. |

**Total: 2,5 pontos.** O professor observará uma explicação e pequena alteração de regra. Checker aprovado não é nota automática nem prova isolada de autoria.

## Evidências e entrega

A ficha visual permite preencher respostas livres e exportar JSON recuperável, Markdown e PDF formal A4. Ela não executa seu fork e não envia dados a servidor. Informe um único Projeto analisado, o commit, os testes realmente executados, o uso de IA e as limitações.

Revise antes de git add, não inclua senhas, node_modules ou dados de terceiros. Confirme com o professor o canal apropriado para fichas com identificação pessoal.

```text
git status
git add .
git commit -m "feat: conclui missao 04 - formularios"
git push origin main
```

Confira o commit no seu GitHub. Guarde os resultados em docs/entregas/missao-04/ e entregue pelo canal comunicado. Exportar a ficha não significa enviá-la.

## Fontes

Plano de ensino Web v2, cronograma da Aula 4 e rubrica E3-I1; Aula 03 Web; guia origin/upstream. Os limites e cenários acima são a especificação didática desta missão.

- [Vue: Form Input Bindings](https://vuejs.org/guide/essentials/forms.html)
- [Vue: Event Handling](https://vuejs.org/guide/essentials/event-handling.html)
- [Vue: Component Events](https://vuejs.org/guide/components/events.html)
- [W3C WAI: User Notification](https://www.w3.org/WAI/tutorials/forms/notifications/)
- [W3C WAI: Validating Input](https://www.w3.org/WAI/tutorials/forms/validation/)
