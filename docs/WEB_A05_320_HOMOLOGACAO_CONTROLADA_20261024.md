# WEB-A05 3.2.0 — Homologação controlada sem liberação de produção

**Emissão:** 24/10/2026 · **Versão:** 1.0 · **Status:** PREPARADO, execução HTTP real **NÃO INICIADA**.  
**PR candidata:** #24, branch `feat/web-roster-320-readonly-20261024`.  
**Autorizações do professor nesta etapa:** bloqueio de produção, conferência dos 38 cadastros e backup privado concluídos, conforme declaração do proprietário. Não há autorização para habilitar PROD, reescrever a aba `Alunos`, fazer merge ou disponibilizar o novo fluxo aos alunos.

## 1. Preflight factual registrado

| Evidência | Observação em 24/10/2026 | Gate |
| --- | --- | --- |
| Google Sheets PROD / `Alunos` | 38 registros, 38 matrículas distintas, 38 linhas com `VALIDADO_DOCENTE`; nenhum cadastro foi editado por esta operação | G0 **PASS — leitura** |
| PROD / `Atividades` | Aula 05 ainda em `web-a05-submission-v2` na célula **E3**; não migrar antes da homologação | G8 **PENDENTE** |
| PROD / `4º Bimestre`, `Resultados`, `Auditoria` | Nenhuma linha de entrega registrada na leitura atual; baseline administrativo preservado | G0 **PASS — leitura** |
| QA 3.0.2 histórico | Só duas matrículas sintéticas do formato anterior, quatro eventos na Auditoria e contrato Aula 05 v2 | **Não serve diretamente para G7 da 3.2.0** |
| PR #24 | HEAD inicial `517f9b86966c7c093a125d425f0ab2dc12a7a601`, Draft sem merge, seis check runs `action_required` e **sem jobs**; não interpretar como PASS | CI **BLOQUEADA** |
| CI passada | Run `40119742507` PASS apenas para o SHA anterior `c671352...` em workflow push. Testes da candidata no modelo Node/Playwright não usam Google | G1–G6/G9 **evidência modelada parcial; revalidar HEAD** |
| Codex | Finding P1 de recibos históricos 3.0.x respondido com correção e regressões; comentário ainda em thread outdated/unresolved e revisão sobre HEAD final não confirmada | **PENDENTE** |

**Decisão preliminar:** GO apenas para preparar ambiente isolado; **NO-GO** para produção e para qualquer afirmação de G7/G8 concluídos.

## 2. Controles de segurança inegociáveis

1. A planilha real `Desenvolvimento Web 2026 — Notas da Turma (Produção)` é **read-only para toda automação e script que trabalhe com cadastro**; apenas o professor pode alterar manualmente `Alunos`. Nem fixtures de QA nem ferramentas de migração modificam `Alunos` da produção.
2. O ambiente de homologação deve usar **projeto Apps Script NOVO e SEPARADO** do projeto atualmente publicado, bem como **planilha QA NOVA e SEPARADA**, privativa e exclusivamente fictícia.
3. A implementação 3.2.0 contém `WEB_CFG.spreadsheetId` **fixo** e `notasCommit_` recusa qualquer `config.id` distinto do valor do código. **Alterar somente `WEB_NOTAS_PROD_SPREADSHEET_ID` nas propriedades NÃO isola o ambiente**. No projeto QA separado, o proprietário substitui **somente** o literal `WEB_CFG.spreadsheetId` pelo ID da planilha sintética antes da publicação do QA, conferindo a origem. **Nunca fazer essa substituição no projeto Apps Script de produção**.
4. A implementação só admite `mode:PROD` no contrato atual. Na instalação sintética o rótulo técnico aparecerá como `PROD`, **mas isso NÃO qualifica o ambiente como produção real**. O isolamento material é a combinação projeto Apps Script novo + URL nova + planilha QA nova + código com ID QA conferido. Não distribuir a URL de homologação aos alunos.
5. O segredo HMAC do projeto real **não deve ser copiado** para o projeto sintético. Não copiar dados reais, históricos de auditoria ou folhas privadas de frequência.
6. A aba `Alunos`, mesmo na QA, é preenchida/corrigida **exclusivamente de forma manual pelo professor, diretamente no Google Sheets**. O backend 3.2.0 **somente lê** essa aba. Nenhum importador, conector, gatilho, `onEdit` ou batch de teste grava cadastro.
7. Durante QA, só IDs e nomes **fictícios** poderão ser enviados ao endpoint. Não inserir matrícula ou nome verdadeiro em logs, URLs, payloads versionados, documentação pública, Issues ou artefatos da CI.
8. Bloqueio de retomada: **não usar** `encerrarAula05ParaCorrecaoV3`, pois encerra a atividade; usar apenas a função administrativa **`bloquearRecebimentoProducaoWeb`** no projeto QA separado para pausar os testes e preservar o projeto PROD intocado.

## 3. Preparação manual da planilha QA 3.2.0 (professor)

1. No Google Sheets, abra a planilha **QA 3.0.2 já composta exclusivamente por registros fictícios**, use `Arquivo → Fazer uma cópia`, nomeie `WEB-A05 — QA ISOLADA 3.2.0 — SOMENTE FICTÍCIOS`, mantenha a nova cópia **privada**. Não copiar a planilha de produção, que contém 38 estudantes reais.
2. Na **cópia QA apenas**, o professor remove manualmente, preservando a linha de cabeçalho, os registros operacionais antigos das abas `Alunos`, `Auditoria`, `Equipes`, `Resultados` e `4º Bimestre`. Abas históricas com sufixo `_Legada_QA` são material de referência e não devem ser consideradas evidência nova; opcionalmente mantê-las isoladas, sem uso pelo código.
3. Na aba `Alunos` da **cópia QA**, cadastrar **manualmente** 3 pessoas inexistentes e fictícias (não são dados de estudantes do IFMA):
   
   | Matrícula fictícia | Nome fictício | Nome normalizado | Estado de validação | Fonte docente | Homônimo liberado |
   | --- | --- | --- | --- | --- | --- |
   | `20999999.ITA9001` | Estudante Teste Alfa | `estudante teste alfa` | `VALIDADO_DOCENTE` | `QA 3.2.0 sintético` | `FALSE` |
   | `20999999.ITA9002` | Estudante Teste Beta | `estudante teste beta` | `VALIDADO_DOCENTE` | `QA 3.2.0 sintético` | `FALSE` |
   | `20889999.ITA9001` | Estudante Teste Gama | `estudante teste gama` | `VALIDADO_DOCENTE` | `QA 3.2.0 sintético` | `FALSE` |

   Preencher `Atualização UTC` manualmente com ISO 8601, deixar `Observação docente` vazia ou `DADO FICTÍCIO` e manter a coluna de matrícula em **texto**. Os prefixos diferentes com o mesmo sufixo são intencionais para testar chave completa.
4. Na cópia QA, atualizar **manualmente somente** `Atividades!E3` para `web-a05-submission-v3` e confirmar que `Atividades!F3=TRUE`. A planilha de produção continua com contrato v2 até G7 PASS e janela G8.
5. Fazer readback na cópia QA: exatamente 3 matrículas únicas, 0 registros ativos em `Resultados`/`Auditoria`/`Equipes`/`4º Bimestre`, cabeçalhos intactos e nenhuma fórmula de cadastro. Registrar ID e link **somente em comunicação privada**, nunca em documentação pública.
6. Fazer snapshot/backup antes da primeira tentativa; conferir separadamente que o cadastro PROD continua com 38 registros.

## 4. Implantação do servidor de homologação ISOLADO (professor)

1. Criar **projeto Apps Script novo** associado à planilha QA fictícia. **Não abrir nem substituir o código da implantação real**.
2. Copiar a versão exata da `integrations/web-appscript-production/Code.gs` da PR #24 e o manifesto `appsscript.json` aplicável. No projeto QA recém-criado, mudar **apenas** `WEB_CFG.spreadsheetId` para o ID da nova planilha sintética. Manter as demais regras, contratos e nomes de funções, sem copiar propriedades/segredos do projeto real.
3. Confirmar no editor QA que o único destino literal em `WEB_CFG` é a planilha **QA fictícia**. **NÃO rodar `ativarProducaoWeb` se ainda houver ID de produção**. Se for preciso usar o arquivo `HomologacaoV3.gs`, usar somente o do pacote 3.2 compatível e verificar que não existe função que escreva cadastro; não copiar scripts legados indiscriminadamente.
4. Permitir o serviço avançado Google Sheets se solicitado, usando conta do proprietário da planilha QA. Executar `ativarProducaoWeb` **somente neste projeto QA**; a função deve validar a fonte e registrar `WEB_PRODUCAO_ATIVADA` com **ID igual ao QA**, nunca ao real. Ela habilita a recepção dentro do projeto de teste: manter URL privada, janela curta e controle docente.
5. Em `Implantar → Nova implantação → Aplicativo da Web`, selecionar execução como proprietário, acesso necessário para teste HTTP em navegador sem conta de aluno, dar nome explícito `WEB 3.2.0 — QA SINTÉTICO ISOLADO`, obter URL `/exec` **diferente da implantação real**.
6. Se aparecer URL idêntica à produção, ID da planilha real, erro de isolamento ou cabeçalhos divergentes, **ABORTAR**, executar bloqueio no projeto em questão e verificar as configurações antes de qualquer POST.

**Importante:** esta seção é um roteiro para execução futura autenticada pelo professor. **Não foi executada, não é autorização de produção e não prova que o GAS remoto está instalado.**

## 5. Matriz de ensaios HTTP reais com dados sintéticos

Ordem obrigatória; não incluir URL de QA ou dados reais em logs públicos.

| Fase | Entrada/ação QA | Esperado |
| --- | --- | --- |
| H0 — status bloqueado | Antes de ativar, `GET /exec?action=health&nonce=<UUID>` da implantação QA; receptor QA bloqueado | `enabled:false`; nenhuma alteração em todas as abas |
| H1 — status habilitado | Após ativar **QA** e implantar, verificar `GET /exec` e health | `version:web-notas-3.2.0`, destino QA confirmado pelo log privado de ativação, `enabled:true` |
| H2 — matrícula fictícia reconhecida | `lookupStudent` para `20999999.ITA9001`, ID técnico de equipe e nonce distintos | Nome correspondente, token HMAC temporário, sem escrever `Alunos`, `Auditoria`, `Resultados` |
| H3 — prefixo diferente mesmo sufixo | consultar `20889999.ITA9001` | Nome distinto do de H2; não confundir IDs |
| H4 — inexistente | consultar `20999999.ITA9999` | Rejeição segura, sem criar aluno nem listar outras matrículas |
| H5 — submissão real QA | confirmar nome(s) pela consulta, enviar evidência fictícia válida da Aula 05; receber recibo | 1 entrada de `Auditoria`, resultados/notas só das matrículas fictícias, recebimento pendente de validação docente |
| H6 — replay e integridade | reenviar **mesmo** nonce/payload; tentar mesmo nonce com payload alterado; simular erro de confirmação | Replay idempotente, mudança rejeitada, sem duplicação ou correção de cadastro |
| H7 — preservação e média | nova entrega fictícia de mesma matrícula/equipe com nota menor e maior | Apenas maior nota por atividade e média correta; nova Auditoria da tentativa válida |
| H8 — fechamento | Executar `bloquearRecebimentoProducaoWeb` **no projeto QA**, aguardar recibo de bloqueio e verificar GET/POST bloqueados | `enabled:false`, zero novos registros, hash/snapshot `Alunos!A:H` **idêntico ao inicial** |
| H9 — readback independente | Verificar somente a planilha QA, histórico e chaves | 3 cadastros fictícios inalterados, notas corretas, nenhum nome real, histórico HMAC intacto |

**G9 exige tanto** verificação estrutural do gateway de escrita no código quanto comparação exata da aba `Alunos` pré/pós-ensaio. Tentativa ou dúvida de escrita cadastral implica **NO-GO**, não regularização automática.

## 6. G0–G9: status e critérios para autorização

| Gate | Status em 24/10/2026 | Próxima evidência |
| --- | --- | --- |
| G0 — cadastro real íntegro | **PASS (leitura)**: 38 válidos, únicos e planilha privada | Snapshot e eventual readback após QA |
| G1 — lookup correto | **PASS modelado anterior; CI HEAD bloqueada** | CI HEAD + H2/H3/H4 reais só com fictícios |
| G2 — matrícula completa e homônimos | **PASS modelado anterior; CI HEAD bloqueada** | CI HEAD + H3 |
| G3 — interface, acessibilidade, responsividade | **PASS parcial modelado/local anterior; CI HEAD bloqueada** | Playwright Chromium/Firefox/WebKit do HEAD + inspeção WCAG manual |
| G4 — resiliência e alterações manuais | **PASS modelado anterior; CI HEAD bloqueada** | CI HEAD + confirmação expirada/ausente em QA |
| G5 — notas, maior nota, média, replay | **PASS modelado anterior; CI HEAD bloqueada** | CI HEAD + H5/H6/H7 |
| G6 — segurança e anti-enumeração | **PASS parcial modelado (limites best-effort), sem prova de robustez contra scraping** | Codex HEAD + revisão privacidade + comportamento H4/H6 |
| G7 — Apps Script HTTP real em QA isolada | **NÃO EXECUTADO** | H0–H9, logs sanitizados, planilha QA readback |
| G8 — ativação/implantação em produção | **NÃO AUTORIZADO** | Após G7, decisão docente específica, mudança manual Atividades E3, GAS real e frontend |
| G9 — matrícula imutável | **PASS modelado anterior; CI HEAD bloqueada** | CI HEAD e snapshot de `Alunos!A:H` QA, nenhum código escreve cadastro |

**Atualização obrigatória:** reexecutar os workflows do HEAD da PR #24. Os seis runs `action_required` foram disparados por `github-actions[bot]` e não possuem jobs; para que contem como gate, precisam ser executados com aprovação normal da plataforma. Se continuarem nesse estado, o proprietário deve usar o botão **Approve and run**, quando oferecido no GitHub Actions. Nenhuma substituição de gate por afirmação sem logs.

## 7. Critérios de encerramento da homologação (somente QA)

- Todos os workflows relevantes no SHA candidato final: **SUCCESS** com testes realmente executados.
- Revisão Codex sobre esse SHA: findings críticos resolvidos, sem presumir aprovação de versão antiga.
- H0–H9: comprovados por chamadas reais à **URL QA isolada**, sem usar planilha da turma.
- Snapshot da aba `Alunos` da QA: exatamente igual no início e no final, **sem importação/retificação por script**.
- Planilha produção: 38 cadastros íntegros; contrato v2, nenhum registro de QA, recepção bloqueada.
- Projeto Apps Script QA: receptor novamente bloqueado; segredos separados, sem usar endpoint real.
- Evidências em documentação/PR: apenas SHAs, run IDs, quantidades, estados, carimbos de tempo e resultados, sem relações nominais.

**Veredito até atingir tudo isso: QA PREPARADA / G7-G8 NO-GO.** A próxima solicitação do docente pode autorizar a implantação controlada; a presente tarefa **não** a autoriza.
