# Web Aula 05 — correção HTTP e segurança 3.0.2

Data local: 23/10/2026 (America/Fortaleza). Exclusivo de Web QA. PR #21 Draft, dependente da #20. Sem merge, publicação Pages ou alteração em PPI/Mobile.

## Resultado executado

A falha anterior era um falso negativo do instrumento: o HTML bruto do HtmlService continha o JSON escapado, embora a mensagem real chegasse corretamente ao navegador. Diagnóstico: `literalEnvelope:true`, `literalFalse:false`, `escapedMarkup:true`. A inspeção do HTML não substitui `postMessage` com origem, canal e nonce.

Provas remotas reais, sem simular Google:
- Run 40045856927: GET bloqueado → POST nativo com `{}` → mensagem correta → GET final bloqueado. PASS.
- Run 40046143271: formulário completo da candidata na origem HTTPS esperada contra Apps Script real bloqueado. PASS.
- Run 40046546693: prova negativa e inspeção passiva RPC. HTTP PASS; achado de segurança abaixo.
- Readback posterior: 2 estudantes, 2 resultados, 3 recibos, nota/média 10, sem novos lançamentos nos bimestres anteriores.

Backup: https://docs.google.com/spreadsheets/d/1XdKXMlzPAEDhcnwkoqgytlBfIs_qGwZMzvLXV__7c2c/edit

## Achado de segurança e limites da evidência

Metadados do sandbox 3.0.1 expunham funções auxiliares e administrativas via `google.script.run`. A inspeção usou somente `typeof` e nome inexistente como controle. NÃO executou auxiliares de segredo/escrita/liberação e NÃO leu segredos. Não há evidência de uso indevido por terceiros.

Bloquear `doPost` sozinho não protege essas outras entradas. A candidata 3.0.2 corrige o código; a atualização no Google exige o proprietário autenticado.

## Correções versionadas

Commit principal: `bccef5db5531e68c43a9c2cb1c0b9eb06013a872`.
Revisão funcional validada: `ff2f6231f67cbdcc7dee176ae102971a891a8e81`.

- Implementação interna em closure, sem auxiliares globais remotamente chamáveis.
- Administração exige identidade ativa não vazia, igual à efetiva e ao administrador vinculado. A identidade efetiva do dono sozinha NÃO autoriza.
- Homologação protegida; helpers privados terminam em `_` ou ficam na closure.
- Manifesto acrescenta somente `userinfo.email` aos escopos de Sheets existentes.
- Recepção depende da flag global e da preparação de segurança; não libera antes da rotação.
- Rotação QA conserva a chave anterior apenas para verificar recibos históricos; gera chave nova sem exibir valores e grava READY por último. Não reescreve assinaturas.
- Ensaio HTTP exige 3.0.2, helpers privados e negação anônima de uma consulta administrativa somente leitura. Nunca chama secret/writer/liberação.
- Workflow live é manual-only. CI comum não grava no Google.
- Launcher Python anterior delega ao navegador. Probe 3.0.1 é diagnóstico histórico, não gate da candidata corrigida.

## Verificação

No SHA funcional `ff2f6231f67cbdcc7dee176ae102971a891a8e81`, quatro workflows de PR concluíram `success`:
- 40048060760 — Google Sheets/Apps Script;
- 40048060776 — Aula 05;
- 40048060774 — **85/85 testes Node**, sem falhas/ignorados; frontend aprovado;
- 40048060768 — HTTP/site com mocks e navegadores.

Os testes cobrem matrícula, maior nota, idempotência, assinatura, fechamento, autorização, rotação/interrupção e gates HTTP. Não equivalem à execução remota 3.0.2, ainda pendente.

Revisão Codex do núcleo `bccef5d` concluída; nenhuma nova thread técnica apareceu na consulta de fechamento. P1 histórico de edição manual permanece risco aceito pelo docente, condicionado a fechar envios antes de corrigir. Não foi declarado corrigido o algoritmo de sobrescrita.

## Passo a passo do proprietário

### 1. Arquivar implantações anteriores somente deste projeto Web

Mantenha recebimento bloqueado. Não execute `liberarRecebimentoQAWebV3` nem `encerrarAula05ParaCorrecaoV3`.

No projeto Web da homologação, **Implantar → Gerenciar implantações → selecionar cada implantação antiga → Arquivar**. Inclua a 3.0.1. Não exclua projeto, planilha, dados ou propriedades. Não altere PPI/Mobile.

A orientação anterior de conservar versões antigas ativas fica substituída: versões do mesmo projeto compartilham propriedades e não podem continuar expondo funções anteriores depois da rotação. Arquivar preserva o registro da implantação.

### 2. Substituir os três arquivos

Fontes em `integrations/web-appscript-v3-qa/` da revisão validada:
- `Code.gs`: substituir integralmente;
- `HomologacaoV3.gs`: substituir integralmente;
- `appsscript.json`: substituir o manifesto verdadeiro, não criar `.json.gs`.

Não acrescente o código ao final. Scripts antigos de homologação/funções duplicadas no mesmo projeto precisam ser preservados fora dele e retirados do projeto executável antes de publicar. A instalação QA prevista contém os dois `.gs` fornecidos e o manifesto. Não apague outros projetos.

### 3. Preparar e rotacionar no editor autenticado

Na conta proprietária:
1. Execute `prepararIntegracaoNotasV3`; autorize a permissão de identidade solicitada. Isso bloqueia a recepção e vincula o administrador.
2. Com TODAS as implantações anteriores arquivadas, execute `rotacionarChaveQAWebV3`.
3. Exija `WEB_V3_SEGURANCA` com `status:ROTACAO_QA_CONCLUIDA`, `enabled:false`, versão 3.0.2 e `historicalSignatures:PRESERVADAS`.
4. Execute `verificarStatusWebV3`: versão 3.0.2, QA, `enabled:false`, planilha `1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE`, Aula 05 sem encerramento permanente.

Não marque `WEB_NOTAS_V3_SECURITY_READY=true` manualmente, não apague chaves e não compartilhe valores secretos. Se houver erro, mantenha as implantações arquivadas e preserve o log.

### 4. Criar implantação nova somente da 3.0.2

Depois de salvar os arquivos e concluir a preparação, use **Implantar → Nova implantação → Aplicativo da Web**. Descrição `WEB MATRÍCULAS 3.0.2 — QA`; executar como proprietário. Para o ensaio anônimo QA, acesso `Qualquer pessoa`, se a conta permitir; a planilha e o editor não precisam ser compartilhados.

**Não reative a implantação arquivada com versão anterior.** Criar uma implantação nova evita esse intervalo inseguro após a troca da chave. A atualização de uma implantação ativa pode manter sua URL, mas esse NÃO é o procedimento de contenção escolhido aqui.

Copie a nova URL `/exec`; ela substitui a URL 3.0.1 anteriormente fornecida. O GET esperado:
```text
Web web-notas-3.0.2-candidata — QA — recebimento bloqueado — matrícula obrigatória, maior nota, média automática
```

Não recrie a planilha nem repita a homologação antiga. Compartilhe a nova URL, `WEB_V3_SEGURANCA`, `WEB_V3_STATUS` e o GET, nunca segredos.

## Próxima etapa e veredito

Ainda é necessário: negativo HTTP 3.0.2 com fronteira RPC → abertura temporária autenticada → entrega fictícia/replay/conflitos → bloqueio → readback. O workflow/runner precisa receber a nova URL antes de rodar; URL antiga é somente evidência histórica.

**Estado:** código corrigido e CI aprovada; negativo HTTP real 3.0.1 aprovado; instalação Google 3.0.2, negativo 3.0.2, positivo HTTP e produção PENDENTES. Não declarar homologação integral ou merge.

## Referências primárias

- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/reference/base/session
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/guides/properties
