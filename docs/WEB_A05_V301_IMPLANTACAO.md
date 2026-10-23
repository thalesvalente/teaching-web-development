# Web — correções 3.0.1 e implantação QA

**23/10/2026 — somente Desenvolvimento Web.** PPI e Mobile não participam desta migração.
Esta entrega prepara a V3.0.1 para QA. Não substitui o Apps Script 2.0.1 já implantado, não altera a planilha oficial e não habilita a aula pública.

## Correções desta rodada

- P2/cache: todos os módulos carregados pela Aula 05, inclusive `lab.js`, passam a usar `web-id03-qa02`. Evita combinar formulário novo com autossalvamento antigo.
- P2/replay: a pendência docente é persistida e assinada na Auditoria; a repetição do mesmo nonce conserva o aviso. Recibos 3.0.0 mantêm o algoritmo de assinatura histórico.
- Fechamento: `encerrarAula05ParaCorrecaoV3()` bloqueia a recepção global, aguarda o escritor em andamento e encerra permanentemente a Aula 05. Liberar outra atividade não reabre a anterior.
- O POST relê a flag depois de obter o lock. Uma requisição que aguardava processamento não pode usar uma autorização antiga.
- Erros de identidade mostram nome e matrícula enviados e mantêm o foco no campo conflitante; a mensagem não fica atrás de outro diálogo.
- O formulário diferencia atividade encerrada de falha de rede e conserva as respostas.
- A rotina de homologação testa os mesmos estudantes em duas equipes e volta a bloquear a recepção, inclusive em falhas.

**P1:** permanece a decisão docente de não corrigir notas enquanto houver recebimento aberto. O algoritmo não detecta toda edição manual do boletim. O risco foi aceito operacionalmente; não foi declarado corrigido. Confirme o encerramento antes de editar notas. Não remova as propriedades `WEB_NOTAS_V3_CLOSED_*` nem reabra uma atividade corrigida sem reconciliação.

## Destino exato

Planilha QA V3: https://docs.google.com/spreadsheets/d/1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE/edit

Não use a planilha QA V2 (`1N8i5...`), a original Web (`1iLx...`) nem qualquer planilha de PPI/Mobile. O código valida o ID completo da cópia V3 e aceita somente modo QA.

## Ações do professor

### 1. Criar projeto separado

Na mesma conta Google que acessa a planilha QA V3, crie um **novo** projeto Apps Script chamado `WEB-MATRICULAS-V3-QA`.
Não cole a V3 por cima da implantação 2.0.1 e não reutilize os segredos antigos.
Mantenha a edição do projeto restrita aos responsáveis.

### 2. Copiar os três arquivos

Use os arquivos desta PR em `integrations/web-appscript-v3-qa/`:

| Arquivo | Ação no editor |
|---|---|
| `Code.gs` | Substituir todo o conteúdo do `Code.gs` do projeto novo |
| `HomologacaoV3.gs` | Criar arquivo de script `HomologacaoV3` e colar o conteúdo |
| `appsscript.json` | Exibir o manifesto verdadeiro em Configurações do projeto e substituir seu conteúdo |

Não crie `appsscript.json.gs`. O manifesto declara runtime V8, serviço avançado Sheets v4 e escopo de planilhas. Confira `Sheets` na lista Serviços. Se o projeto usar um GCP padrão próprio, confira também a API Google Sheets habilitada nesse projeto. Não altere o GCP de outros scripts.

### 3. Preparar e conferir

Salve e execute, nesta ordem:

1. `prepararIntegracaoNotasV3`
2. `verificarStatusWebV3`

Autorize o acesso à planilha pelo fluxo Google. O log `WEB_V3_STATUS` precisa apresentar:

```json
{
  "version": "web-notas-3.0.1-candidata",
  "mode": "QA",
  "enabled": false,
  "spreadsheetId": "1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE",
  "homologated": false
}
```

Não é necessário digitar versão, segredo ou modo manualmente. A preparação gera o segredo no servidor e mantém o recebimento desabilitado quando a propriedade ainda não existe. Nunca compartilhe capturas de propriedades secretas.

### 4. Executar a homologação na planilha QA

Execute `executarHomologacaoMatriculasV3`. Ela habilita a recepção temporariamente e chama `doPost` dentro do Apps Script. **Isso é persistência real na planilha, mas não é teste HTTP pelo navegador.**

O resultado esperado é `WEB_V3_QA_RESULTADO` com `status: QA_V3_APPS_SCRIPT_PASS_SCOPED`, `attempts: 3`, `students: 2`, `bestGrade: 10`, `average: 10`, `postRealHttp: false` e `recebimentoFinal: BLOQUEADO`.

Na aba `4º Bimestre`, Ana Teste Ficticio e Bruno Teste Ficticio devem ter uma única linha cada, nota e média 10. As matrículas sintéticas são `00001234` e `00005678`; a coluna B pode estar oculta. Auditoria deve preservar as três tentativas 0,5 → 10 → 1. Os três bimestres anteriores permanecem sem novos alunos.

Se houver erro, execute `bloquearRecebimentoNotasV3`, guarde o log e não apague registros ou altere IDs para tentar fazer o teste passar. A rotina reaproveita suas identidades de QA, permitindo repetir o mesmo ensaio sem duplicar tentativas.

### 5. Criar a implantação QA bloqueada

Somente após o teste anterior passar: Implantar → Nova implantação → Aplicativo da Web. Descrição: `WEB MATRÍCULAS 3.0.1 — QA`. Executar como: sua conta. Para ensaio anônimo controlado, o acesso ao web app pode ser Qualquer pessoa, se permitido pela conta; isso NÃO exige dar edição pública ao projeto nem compartilhar a planilha.

Mantenha `WEB_NOTAS_V3_SUBMISSIONS_ENABLED=false`. Copie a nova URL `/exec` e abra-a. Deve informar versão 3.0.1, QA e recebimento bloqueado.

Envie a URL e as linhas `WEB_V3_STATUS` e `WEB_V3_QA_RESULTADO`, sem segredos. A validação HTTP e a configuração do cliente QA devem ocorrer antes de merge, publicação ou liberação aos alunos. A URL da antiga implantação 2.0.1 não serve para validar a V3.

## Quando for corrigir notas

Não execute o fechamento permanente durante os primeiros ensaios. Quando a recepção da atividade tiver terminado, execute `encerrarAula05ParaCorrecaoV3`. Só comece a editar notas depois de receber `BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO` e `ATIVIDADE_ENCERRADA_CONFIRMADA`.

O fechamento registra data/hora e motivo nas colunas G e H de `Atividades`, além da trava no projeto. A flag global pode ser liberada para futuras atividades cadastradas, mas a Aula 05 encerrada continuará recusando envios.

## Limites e promoção

- Não houve implantação V3 remota nesta entrega; a instalação é feita na conta do professor.
- A V3 atual aceita apenas equipes QA e nomes fictícios autorizados. Não use dados de alunos reais ainda.
- A regra de matrícula de 1–32 algarismos é limite técnico de QA, não confirmação do padrão oficial IFMA/SUAP.
- Antes da produção: validar cadastro/formato institucional, acesso e prevenção de consultas abusivas; executar POST HTTP real; conciliar dados antigos sem inventar matrículas; aprovar a publicação das PRs dependentes #20 e #21.
- A aula pública permanece com `activated:false`. Não basta mudar a flag do Apps Script para ativá-la.
- Somente um projeto V3 pode escrever nesta planilha; locks não coordenam projetos Google diferentes.

## Verificação reproduzível

```sh
node --test tests/web-a05-id03/*.test.cjs
cd lessons/aula-05-laboratorio-web-mobile
npm ci
npm run check:logic
npx playwright install --with-deps chromium
npm run test:e2e
```

A suíte local desta rodada aprovou 53 testes. O resultado final da CI deve ser conferido no commit publicado, não inferido dessa contagem. Os testes de navegador usam servidor emulado para respostas de entrega; não equivalem a homologação do /exec.

Referências oficiais consultadas em 23/10/2026:
- https://developers.google.com/apps-script/concepts/manifests
- https://developers.google.com/apps-script/guides/services/advanced
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/concepts/deployments
