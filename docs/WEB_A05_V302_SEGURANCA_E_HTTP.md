# Web Aula 05 — correção HTTP e segurança 3.0.2

Data local: 23/10/2026 (America/Fortaleza). Exclusivo de Web QA. PR #21 Draft, dependente da #20. Sem merge, publicação Pages ou alteração em PPI/Mobile.

## 1. Resultado executado

A falha anterior era um falso negativo do instrumento: o HTML bruto do HtmlService continha o JSON escapado, embora a mensagem real chegasse corretamente ao navegador. O diagnóstico confirmou `literalEnvelope:true`, `literalFalse:false`, `escapedMarkup:true`. A inspeção do HTML não substitui a verificação de `postMessage` com origem, canal e nonce.

Provas remotas reais, sem simular Google:
- Run 40045856927: GET bloqueado → POST nativo com `{}` → mensagem correta → GET final bloqueado. PASS.
- Run 40046143271: formulário completo da candidata, hospedado virtualmente sob a origem HTTPS esperada, contra Apps Script real bloqueado. PASS.
- Run 40046546693: nova prova negativa e inspeção passiva da superfície RPC. HTTP PASS; achado de segurança abaixo.
- Readback no Google Sheets depois dos testes: 2 estudantes, 2 resultados, 3 recibos, nota/média 10, sem novos lançamentos nos bimestres anteriores.

Backup anterior ao ensaio completo: https://docs.google.com/spreadsheets/d/1XdKXMlzPAEDhcnwkoqgytlBfIs_qGwZMzvLXV__7c2c/edit

## 2. Achado de segurança e limites da evidência

Na implantação 3.0.1, metadados enviados pelo sandbox expunham funções auxiliares e administrativas via `google.script.run`. A verificação usou somente `typeof` e um nome inexistente como controle. NÃO executou auxiliares de segredo/escrita/liberação e NÃO leu segredos. Não há evidência de uso indevido por terceiros.

O bloqueio de `doPost` sozinho não protege essas outras entradas. A candidata 3.0.2 corrige o código, mas a atualização no Google exige o proprietário autenticado.

## 3. Correções efetivamente versionadas

Commit principal: `bccef5db5531e68c43a9c2cb1c0b9eb06013a872`.
Última revisão funcional validada nesta entrega: `ff2f6231f67cbdcc7dee176ae102971a891a8e81`.

- Implementação interna em closure, sem auxiliares globais remotamente chamáveis.
- Fachadas administrativas exigem identidade ativa não vazia, igual à efetiva e ao administrador vinculado. A identidade efetiva do dono da implantação sozinha NÃO autoriza.
- Homologação também passa por autorização; helpers privados terminam em `_` ou ficam dentro da closure.
- Manifesto acrescenta somente `userinfo.email` aos escopos de Sheets existentes.
- Recepção depende de flag global e preparação de segurança. Não libera antes da rotação.
- Rotação QA preserva a chave anterior apenas para verificar recibos históricos; gera nova chave sem imprimi-la e grava READY por último. Nenhuma assinatura histórica é reescrita.
- Instrumento HTTP agora exige versão 3.0.2, auxiliares não expostos e negação anônima de uma consulta administrativa somente leitura. Não chama funções que habilitem envios, gravem dados ou devolvam segredos.
- Teste live separado da CI comum. Workflow live passou a manual-only; mudanças de código não provocam novos POSTs remotos automaticamente.
- Launcher Python antigo usa a prova de navegador em vez do predicado inválido sobre HTML bruto. O probe 3.0.1 fica como evidência histórica, não como gate da versão corrigida.

## 4. Verificação automatizada

No SHA funcional `ff2f6231f67cbdcc7dee176ae102971a891a8e81`, quatro workflows de PR terminaram `success`:
- 40048060760 — Google Sheets/Apps Script Web;
- 40048060776 — Aula 05;
- 40048060774 — matrículas/servidor: **85/85 testes Node**, sem falhas ou ignorados; frontend também aprovado;
- 40048060768 — HTTP/site com mocks e navegadores.

Os 85 testes incluem matrícula, maior nota, idempotência, assinatura, fechamento, autorização administrativa, rotação/interrupção e validadores HTTP. Não equivalem à prova remota da implantação 3.0.2, ainda pendente.

Revisão Codex do núcleo `bccef5d` concluída; nenhuma nova thread técnica apareceu na consulta de fechamento. A thread P1 histórica de edição manual permanece registrada como risco aceito pelo docente, condicionado a fechar os envios antes de corrigir. O algoritmo de sobrescrita não foi apresentado como corrigido.

## 5. Passo a passo do proprietário no Google

### A. Conter versões anteriores deste projeto Web

1. Mantenha os envios bloqueados. Não execute `liberarRecebimentoQAWebV3` nem `encerrarAula05ParaCorrecaoV3`.
2. No mesmo projeto Web em que executou a homologação, abra **Implantar → Gerenciar implantações**.
3. Arquive as implantações Web antigas que permaneceriam executando código anterior. Para contenção imediata, arquive também a V3.0.1 até concluir a atualização. Arquivar a implantação não é apagar o projeto, a planilha ou o histórico.
4. Não altere projetos de PPI ou Mobile. Não exclua notas, Auditoria, segredos ou propriedades existentes.

A orientação anterior de conservar versões antigas ativas é substituída por esta contenção: versões do mesmo projeto compartilham propriedades e não podem continuar expondo as funções antigas após a rotação.

### B. Substituir os arquivos, sem duplicar funções antigas

Use os arquivos versionados em `integrations/web-appscript-v3-qa/` da revisão validada:
- `Code.gs`: substituir integralmente, não acrescentar ao final;
- `HomologacaoV3.gs`: substituir integralmente;
- `appsscript.json`: substituir o manifesto verdadeiro (não criar `.json.gs`).

Se ainda houver scripts de homologação antigos ou cópias de funções `.gs` no mesmo projeto, preserve uma cópia fora do projeto e retire os auxiliares antigos do projeto executável antes de publicar. A instalação QA prevista contém somente os dois `.gs` acima e o manifesto. Não apague outros projetos ou dados.

### C. Preparar, rotacionar e conferir

Na conta proprietária, execute no editor:
1. `prepararIntegracaoNotasV3`: autorize o novo escopo de identidade quando solicitado; a preparação bloqueia a recepção e vincula o administrador.
2. Só depois de todas as implantações anteriores estarem arquivadas/substituídas, execute `rotacionarChaveQAWebV3`.
3. Exija `WEB_V3_SEGURANCA` com `ROTACAO_QA_CONCLUIDA`, `enabled:false`, versão 3.0.2 e `historicalSignatures:PRESERVADAS`.
4. Execute `verificarStatusWebV3`: exija versão 3.0.2, QA, `enabled:false`, planilha `1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE` e Aula 05 sem encerramento permanente.

Não crie manualmente `WEB_NOTAS_V3_SECURITY_READY=true`, não apague a chave antiga nem publique screenshots de propriedades. Em caso de erro, mantenha as implantações arquivadas e preserve o log, sem tentar liberar.

### D. Publicar somente a revisão QA corrigida

Em **Gerenciar implantações**, selecione a V3 atual — inclusive em Arquivadas se necessário —, clique em **Editar**, escolha **Nova versão** e descrição `WEB MATRÍCULAS 3.0.2 — QA`. Publique apenas essa revisão corrigida. Não reative uma versão antiga sem trocar a versão.

Atualizar a mesma implantação permite conservar a URL já informada:
https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec

O GET esperado é:
```text
Web web-notas-3.0.2-candidata — QA — recebimento bloqueado — matrícula obrigatória, maior nota, média automática
```

Se a interface gerar outra URL, registre a URL nova; não deduza endereço. Não precisa repetir a homologação antiga nem recriar a planilha. Envie somente `WEB_V3_SEGURANCA`, `WEB_V3_STATUS` e o texto do GET, nunca valores secretos.

## 6. O que falta depois da atualização

O ensaio negativo 3.0.2 deve comprovar a fronteira RPC e o bloqueio. Só após esse gate, abrir temporariamente pelo administrador, testar entrega fictícia/replay/conflitos, voltar a bloquear e reler a planilha. A abertura não pode ser feita por endpoint público nem por contorno da proteção.

**Estado:** código corrigido e CI aprovada; negativo HTTP real 3.0.1 aprovado; Google ainda precisa receber 3.0.2; negativo 3.0.2/positivo HTTP/produção PENDENTES. Não declarar homologação completa, merge ou produção.

## Referências primárias

- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/reference/base/session
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/guides/properties
