# WEB-A05 — endpoint PROD 3.2.0 preparado (28/10/2026)

Estado: `ENDPOINT_PROD_STAGED / SUBMISSIONS_DISABLED / NO_MERGE_UNTIL_GATES`.

## Evidência fornecida pelo docente

Endpoint Web App PROD instalado no Google:
`https://script.google.com/macros/s/AKfycbwCaZlTbUCEw_fr6N7yQ29uyBx1RiSFM7sUX1zRnKlunUE7n8Vb5aAKMuOkpxzKVE11/exec`

A resposta GET informada pelo docente foi:

> Web web-notas-3.2.0 — PROD — recebimento bloqueado — matrícula pré-cadastrada; cadastro somente leitura; notas 0–10 e maior nota

Este GET confirma versão, modo e bloqueio informados, **não** prova GET health autenticado por nonce, POST, gravação, assinatura ou recibo. Nenhum teste que escreva na produção foi realizado nesta frente.

## Alteração proposta — escopo estrito

- Registra URL PROD exclusivamente em `lessons/aula-05-laboratorio-web-mobile/entrega-config.js`.
- `PROD_RELEASE_ENABLED=false` mantém comportamento normal offline, `activated=false`, `endpoint=''` e PDF/JSON locais disponíveis.
- O modo `?qa=1` e o fingerprint QA existente permanecem isolados.
- Adiciona teste estrutural para URL exata e release gate desligado.
- Sem alterações Google Sheets, Apps Script, fontes `Alunos`, PPI ou Mobile.

## Gates antes de liberar a turma

1. Conferir no projeto Apps Script PROD a URL da implantação, owner, manifesto, propriedades e `web-notas-3.2.0`. Não publicar HMAC ou nomes/matrículas no GitHub.
2. Manter `WEB_NOTAS_PROD_SUBMISSIONS_ENABLED=false`. O docente migra manualmente **apenas** `Atividades!E3` de `web-a05-submission-v2` para `web-a05-submission-v3`, após backup confirmado; `F3=TRUE`.
3. Concluir testes HTTP QA V3.2 com cópia isolada e identidades fictícias: consulta, confirmação, envio, recibo, maior nota, replay, bloqueio e ausência de escrita em `Alunos`.
4. Com o receptor PROD **ainda bloqueado**, verificar `GET ?action=health&nonce=<UUID>` e exigir `version=web-notas-3.2.0`, `mode=PROD`, `activity=WEB-AULA05-2026`, `enabled=false`.
5. Revisar o PR, aguardar workflows PASS e decisão explícita do docente. Publicar mudança do frontend para PROD somente em janela coordenada.
6. Executar `ativarProducaoWeb` no editor PROD sob autorização docente. Verificar health `enabled=true`. Habilitar `PROD_RELEASE_ENABLED=true` **em commit e PR próprios**, ajustando os testes conforme a nova decisão.
7. Com consentimento e dados da turma, acompanhar a primeira submissão legítima; conferir recibo autêntico, `Auditoria`, `Resultados`, `Equipes`, `4º Bimestre`, média e `Alunos!A:H` sem alterações. Não criar aluno de teste na planilha real.
8. Falha/recibo incerto: `bloquearRecebimentoProducaoWeb`, preservar JSON/PDF e verificar a auditoria antes de novo POST.

**Não executar** `executarHomologacaoMatriculasV3` na produção. Não migrar código QA 3.0.2, não expor chave HMAC e não alterar a identidade cadastrada.

## Handoff

Produção: `WEB-A05-320-PRODUCAO` (informado pelo docente).

Fonte: `integrations/web-appscript-production/Code.gs` da `main`.

Status de aceite: `CANDIDATE_READY_FOR_QA / PROD_SUBMISSION_NOT_ENABLED`.
