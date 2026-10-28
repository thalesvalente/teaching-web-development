# WEB-A05 3.2.0 — Preflight de produção (somente leitura)

**Data:** 26/10/2026  
**Situação:** **GO para engenharia isolada; NO-GO para implantação e ativação de produção** sem autorização expressa do docente.  
**Procedimento:** inspeção privada das planilhas Google Sheets pelo conector, conferência de código e histórico GitHub; nenhum POST, escrita em Google Sheets, merge ou deploy nesta etapa.

## 1. Evidência factual observada

### Planilha de produção (acesso privado)
- Identidade confirmada: **Desenvolvimento Web 2026 — Notas da Turma (Produção)**, ID iniciado por `1cPQD_` e terminado por `8a_Q`; distinta da planilha QA iniciada por `1xFjZ-`.
- Metadados: locale `pt_BR`, fuso `America/Fortaleza`, 10 abas. Planilha reportada pelo Drive como não compartilhada.
- `Alunos!A2:H39`: **38 cadastros**, 38 matrículas textuais únicas, 38 no formato `^[0-9]{8}\\.ITA[0-9]{4}$`, 38 nomes normalizados conforme `webNormalized`, 38 estados `VALIDADO_DOCENTE`, 38 valores de fonte e UTC, 38 indicadores de homônimo `FALSE`. Sem fórmulas na área e sem registros de matrícula depois da linha 55.
- Uma observação docente preexistente sobre prefixo de matrícula permanece preservada; apenas o docente decide eventual correção manual após conferir o documento original. **Não reproduzir identidade real neste repositório**.
- `Atividades`: Aula 05 4º bimestre habilitada (`F3=TRUE`), **contrato ainda em `Atividades!E3=web-a05-submission-v2`**. Aula 04 desabilitada e manual.
- `Auditoria`, `Equipes`, `Resultados` e `4º Bimestre`: cabeçalhos presentes, nenhum registro operacional no readback inicial. `4º Bimestre!D2:D4` tem validação numérica estrita de 0 a 10. Não há fórmulas pré-criadas em `4º Bimestre!E2:E1000`; o backend 3.2 constrói a fórmula da média ao registrar um aluno pela primeira vez, sujeito à sua verificação de integridade.
- A planilha real não tem aba `Conflitos`, mas esta não é dependência operacional do `Code.gs` 3.2 examinado; divergências cadastrais retornam erro e não modificam `Alunos`.
- A planilha QA 3.2 permanece fisicamente isolada, com dados exclusivamente fictícios.

### GitHub e compatibilidade
- `main`: `integrations/web-appscript-production/Code.gs` ainda é **3.1.0**, blob `29f325823e10e884da304723eb7cb24663083485`.
- Backend 3.2.0 com comprovante HMAC estável encontra-se na **PR #24 Draft**, blob `968018727c91e5daca2f74df77a146b65b717432`, revisão Codex fechada sem findings; os mesmos bytes foram validados na QA modelada por **6/6 workflows PASS** na PR QA temporária #28, já encerrada sem merge.
- A PR #24 está divergente da main (`behind` positivo) e mistura backend com versões anteriores do frontend e configuração; **é proibido fazer merge integral** como mecanismo de deploy.
- A interface 3.2.3 aprovada está na `main`; `entrega-config.js` da main mantém **`activated=false` no acesso normal**, exige `?qa=1` para configurar o receptor QA e **não contém endpoint PROD operacional**.
- Esta candidata traz **exclusivamente** o backend 3.2 e testes modelados (sem alterar a interface pública, os manifests idênticos ou planilhas). Qualquer futura publicação de frontend PROD exige uma PR específica de configuração após identificação do receptor de produção e autorização G8.

## 2. Gates

| Gate | Evidência / estado | Decisão |
|---|---|---|
| G0 — cadastro real | 38 válidos, únicos, validados e fonte privada preservada | **PASS (somente leitura)**; confirmar manualmente observação existente sobre prefixo |
| G1–G6 — engenharia | Backend 3.2 e interfaces passaram por CI modelada; integração precisa de validação da candidata seletiva | **PASS modelado / CI seletiva pendente** |
| G7 — HTTP real, QA | Consulta válida/inexistente/duplicada, PDF, JSON e duas entregas QA foram demonstradas; maior nota 0 → 1,6 confirmada em readback. Restam evidências completas do protocolo estrito (prefixo distinto, replay idempotente, nota inferior, bloqueio QA e snapshot A:H antes/depois) | **PARCIAL** |
| G8 — produção | Apps Script real, versão implantada, endpoint real, propriedades, autorização docente e mudança do catálogo ainda não conciliados | **NO-GO** |
| G9 — imutabilidade | Código/testes proíbem `batchUpdate` em `Alunos`, sem fórmula ou alteração verificada na leitura real | **PASS modelado / verificação operacional após deploy exigida** |

**Não confundir:** logs ou código chamados `mode:PROD` na cópia QA não provam implantação real de produção. Nem o texto `homologated:false` isoladamente comprova reprovação; a homologação deve ser documentada por evidências HTTP, recibos e readbacks.

## 3. Roteiro mínimo de G8 (SOMENTE após autorização explícita)

1. **Reconciliar QA:** executar bloqueio apenas no Apps Script QA ao encerrar os ensaios; preservar os 2 recibos e todas as matrículas fictícias; completar/verificar as evidências G7 faltantes. Não criar outro POST desnecessariamente.
2. **Preflight do receptor real pelo proprietário:** identificar projeto Apps Script **de produção**, URL `/exec` existente, administrador e versão ativa; executar `verificarStatusProducaoWeb` sem registrar segredos. Se recepção real estiver habilitada, usar `bloquearRecebimentoProducaoWeb` no projeto correto **antes** de qualquer alteração. Nunca confundir URL QA e PROD.
3. **Backup manual privado:** o docente realiza cópia fechada e datada do boletim real; confere o registro com observação de prefixo, sem corrigir por presunção. Preservar `Alunos!A:H`, histórico e Script Properties; nunca exportar nomes/matrículas para GitHub ou CI.
4. **Publicação backend controlada:** aprovar a candidata **somente backend** por SHA e revisar manifesto. No Apps Script de produção existente, atualizar `Code.gs` exato sem mudar `WEB_CFG.spreadsheetId` (deve continuar apontando para a planilha real). Preservar o segredo HMAC atual e propriedades de administração; **não** copiar o projeto QA nem o segredo da QA.
5. **Migração mínima de contrato com recepção bloqueada:** o docente altera **apenas** `Atividades!E3` de `web-a05-submission-v2` para `web-a05-submission-v3`. Conferir `F3=TRUE`. Não modificar `Alunos`, `Auditoria` ou notas.
6. **Nova versão da implantação PROD existente:** revisar `Execute as: owner`, política de acesso do receptor, serviço avançado Sheets v4, permissões e URL do app; manter o recebimento bloqueado. GET `health` deve mostrar `version:web-notas-3.2.0` e `enabled:false`.
7. **Configuração frontend PROD separada:** preparar PR independente para substituir a configuração normal offline por endpoint PROD verificado; **não** reutilizar URL QA, `?qa=1`, nem colocar matrícula ou roster no frontend. Publicação coordenada com backend após autorização.
8. **Autorização final:** docente ratifica ID de destino, versão/código e URLs, backup, contratos, preflights, owner e janela de lançamento. Somente então é legítima a ativação `ativarProducaoWeb` **no projeto PROD**, testes de health e acompanhamento do primeiro recibo genuíno.
9. **Pós-verificação:** recibo autêntico, vínculo por matrícula completa, `Resultados`/boletim, média, preservação de `Alunos` e histórico; monitorar registros e possíveis erros. Falha -> **bloquear recepção**, não fazer retry automático e não restaurar schema antigo com recibos novos sem reconciliação.

## 4. Autoridade e limites
- A única pessoa autorizada a cadastrar/retificar/excluir dados de `Alunos` é o professor, editando diretamente o Google Sheets (INV-MAT-01).
- Nenhum comando Apps Script de ativação, merge do backend, deploy nem alteração do catálogo da turma foi autorizado por este preflight.
- Não repetir a revisão geral da PR #24, não publicar fonte de dados pessoais, não inferir projeto/URL de produção a partir da QA.
- **Progresso seguro deste trabalho:** candidata isolada + testes + checklist; estado permanece `NO_GO_PROD_ACTIVATION` até aprovação G7–G9 e decisão docente.
