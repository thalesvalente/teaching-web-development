# WEB-A05 — V3.0.2: fechamento de homologação HTTP QA

Data do registro: **24/10/2026** (America/Fortaleza). Estado: **QA_HTTP_ACCEPTED_SCOPED**. Produção: **NO-GO**.

## Escopo e isolamento

- Repositório: `thalesvalente/teaching-web-development`, branch `feat/web-a05-matricula-v3-qa-20261023`, [PR #21](https://github.com/thalesvalente/teaching-web-development/pull/21), **Draft e sem merge**.
- Aplicação Web Apps Script **3.0.2 candidata — QA**, destino exclusivo `1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE`.
- Registro visual do docente em `Gerenciar implantações`: somente `WEB MATRÍCULAS 3.0.2 — QA SEGURO` ativa, implantações anteriores do mesmo projeto Web em `Archived`.
- O código do laboratório publicado no Pages, a planilha oficial, os projetos PPI e Mobile NÃO foram promovidos/alterados por esta rodada.

## Pré-condições verificadas

1. Docente concluiu rotação de segurança: `ROTACAO_QA_CONCLUIDA`, histórico assinado preservado, `enabled:false`.
2. Verificação HTTP real 3.0.2 bloqueado e RPC: [run 40058847395](https://github.com/thalesvalente/teaching-web-development/actions/runs/40058847395), Playwright **PASS**.
3. Fase `closed` preliminar, com disparo por commit controlado no GitHub: [run 40060364495](https://github.com/thalesvalente/teaching-web-development/actions/runs/40060364495), **PASS**.
4. Baseline na planilha QA: 2 alunos fictícios, 2 resultados individuais, 3 eventos na Auditoria, melhor nota/média 10,00; bimestres 1º–3º sem lançamentos QA.

## Ensaio positivo controlado

- Docente reportou `WEB_V3_LIBERACAO` com `status:QA_LIBERADO`, `mode:QA`, `enabled:true`, `production:false` às 01:00:30 BRT.
- Commit de gatilho `083bd99b6ee575e903fb866567f77d349b1f070c`: `RUN_WEB_V302_OPEN_FICTICIOS`.
- [Run 40060668509 — HTTP open](https://github.com/thalesvalente/teaching-web-development/actions/runs/40060668509): **1/1 Playwright PASS**, testes sem simulação da resposta do Google.
- Gates informados no relatório: `HTTP-01`, `HTTP-03`, `SEC-RPC`, `HTTP-04`, `HTTP-05`, `HTTP-10`, `HTTP-11`, `HTTP-07`, `HTTP-08`, `HTTP-09` — **10/10 PASS**.
- Recibo HTTP real registrado na Auditoria: `WEB-20261024-040216-85faf30539f9878e6c7eb1540bc04b81c61c4436840cafc9574c8650c14ea504`; `Equipe QA HTTP`, 24/10/2026 01:02:16 BRT, nota recebida **0/10**, situação `RECEBIDO_PENDENTE_VALIDACAO`, versão `web-notas-3.0.2-candidata`.
- A evidência não tinha XP suficiente para nota maior; `bestGrades=[10,10]` corretamente conservou os máximos individuais anteriores.
- Replay com mesmo nonce/payload não adicionou outra tentativa; nonce repetido com payload alterado foi recusado; conflitos de nome/matrícula foram rejeitados e não geraram linhas novas.
- A proteção RPC permaneceu válida: auxiliares privados não visíveis e consulta administrativa anônima de leitura negada.

## Fechamento operacional e prova HTTP final

- Docente executou `bloquearRecebimentoNotasV3` às 01:03:22 BRT, obtendo `BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO`, `enabled:false`, versão `web-notas-3.0.2-candidata`. NÃO executou `encerrarAula05ParaCorrecaoV3`.
- Marcador atualizado para `RUN_WEB_V302_CLOSED_FICTICIOS`, commit `8b451fba68a9dc57f2e1bc872e781ba0702dd0a7`.
- [Run 40060908135 — HTTP closed final](https://github.com/thalesvalente/teaching-web-development/actions/runs/40060908135): **1/1 Playwright PASS**. Relatório `web-v302-ciclo-40060908135`:
  - `HTTP-01` GET V3.0.2 bloqueado — PASS
  - `HTTP-03` origem HTTPS da aplicação — PASS
  - `SEC-RPC` fronteira administrativa e helpers privados — PASS
  - `HTTP-02` POST recusado — PASS
  - `closure=GET_E_POST_BLOQUEADOS`
  - `finalGetBlocked=true`
  - `postRealHttp=true`, **nenhum recibo aceito na fase closed**.

## Readback final da planilha QA

| Aba | Resultado |
| --- | --- |
| 4º Bimestre | **2 linhas** — Ana Teste Ficticio / `00001234`; Bruno Teste Ficticio / `00005678`; ambas nota e média **10,00** |
| Alunos | **2 matrículas** sem duplicações |
| Resultados | **2 resultados** para `WEB-AULA05-2026`, maior nota 10,00 por matrícula |
| Auditoria | **4 tentativas** no total: as 3 antigas e **1 HTTP V3.0.2**. Nenhuma nova tentativa após fechamento |
| Equipes | **3 registros** (inclui a equipe HTTP do ensaio) |
| Conflitos | **0 registros** |
| 1º/2º/3º Bimestres | **0 lançamentos** do ensaio; preservados |

Os testes de integridade e de readback foram executados via consulta direta à cópia Google Sheets QA; nenhum dado acadêmico real foi utilizado.

## Decisões / limites / veredito

**GO restrito para o ciclo HTTP do ambiente QA 3.0.2, encerrado e com recepção bloqueada.**

**NO-GO para produção e para merge/publicação.** Antes de liberar estudantes reais:
- **Decisão posterior ADR-001 (24/10/2026): identificação declarada, sem login, sem integração ao SUAP e sem validação institucional.** Estudante informa apenas nome da equipe, nome completo e matrícula; a matrícula não comprova autoria, e conflitos continuam sujeitos à conferência docente;
- revisar risco de enumeração e permissões do endpoint público, conformidade de proteção de dados e rate limiting;
- conciliar notas reais e legislação/procedimento interno de lançamento, sem inferir matrícula de registros legados;
- respeitar a decisão docente P1: **não editar notas manuais com recebimento aberto**; só corrigir após bloqueio e encerramento da atividade;
- revisar PR #20 e PR #21, QA nos navegadores/dispositivos e decidir explicitamente a promoção ao Pages.

**Atualização da decisão funcional:** [ADR-001 — Identificação declarada](./WEB_A05_ADR_001_IDENTIFICACAO_DECLARADA_20261024.md) substitui a exigência anterior de autenticação institucional. O QA 3.0.2 permanece sintético e bloqueado; uso real exige ambiente próprio e proteção dos dados, sem login do aluno.\n\nEsta homologação só comprova os gates descritos, não a capacidade de identificar autores reais nem a prontidão de produção. O workflow que abre a recepção exige ações administrativas do proprietário e não fornece garantia de bloqueio automático caso o operador não execute `bloquearRecebimentoNotasV3`.

**Política após fechamento:** não reativar a flag para repetir o ensaio; não disparar `RUN_WEB_V302_OPEN_FICTICIOS` sem nova janela autorizada, baseline e controle de bloqueio. O marcador final deve permanecer `RUN_WEB_V302_CLOSED_FICTICIOS`.
