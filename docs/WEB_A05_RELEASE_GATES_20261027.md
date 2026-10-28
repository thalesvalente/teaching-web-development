# Aula 05 — estado de liberação e rastreabilidade (27/10/2026)

**Estado (atualizado após PR #40):** `UX_PREVIEW_READY / BACKEND_320_IN_MAIN / NOTAS_PROD_NO_GO`. O código-fonte está na `main`, mas **a implantação Google Apps Script e o envio real continuam não comprovados**.

## Evidência de código e CI

- Repositório: `thalesvalente/teaching-web-development`.
- PR #38 integrada em `main` via `a42aef49aa0e941356e2e91c65e2133a4ceb9dca`: correção touch/layout, tipografia compacta e `testIgnore` na suíte oficial para executar o teste da prévia somente na configuração de porta 8766.
- Os **cinco workflows** da candidata `75b3c893fd3443af05c5f76b6f14347e767530b9` passaram (prévia, Aula 05, backend modelado, ID03 e HTTP/site com mocks). Isso não equivale a um POST real no Google.
- Prévia isolada `previews/aula05-mobile-20261027/`: `activated:false`, `qaRequested:false`, `endpoint:''`. Ação renomeada para **Gerar PDF (sem envio)**, sem expectativa de recibo ou nota.
- **Código-fonte** `integrations/web-appscript-production/Code.gs` na `main` agora é `web-notas-3.2.0` (blob `968018727c91e5daca2f74df77a146b65b717432`), integrado pela PR #40 no commit `d51ffec6a78ea5e37e34aa973f01294c89166c8c`. **Não há evidência de que este código tenha sido implantado no Google Apps Script**, nem de URL PROD 3.2 configurada no frontend.

## Leitura das planilhas (sem alteração)

- A planilha privada de produção contém **38 matrículas únicas, validadas** e nenhuma linha operacional nas abas `Resultados`, `Auditoria`, `Equipes` e `4º Bimestre` no recorte revisado.
- `Atividades!E3` ainda indica `web-a05-submission-v2`, embora a interface 3.2 espere `web-a05-submission-v3`.
- A planilha QA V3 histórica possui 2 resultados e 4 registros de auditoria, mas é referente a backend de outra versão (`web-notas-3.0.2-candidata`). Não substituir por prova de QA 3.2.0.
- Matrículas, nomes, notas e segredos da turma **não** são publicados neste arquivo.

## Gates separados

| Gate | Estado | Evidência necessária para PASS |
| --- | --- | --- |
| UX-preview | PASS automatizado | Navegação Missão/Código/Resultado, touch, legibilidade; avaliação física docente é validação adicional |
| G0 cadastro | PASS read-only | Manter vínculo docente atual; sem importação ou correção por script |
| G1–G6 código 3.2 | PASS modelado (PR #40) | CI de testes automatizados PASS no SHA da PR; não equivale a POST real |
| G7 HTTP QA 3.2 | **PENDENTE** | Projeto Apps Script QA isolado, versão 3.2, POST fictício, consulta, recibos, reenvio, nota inferior e readback após bloqueio |
| G8 implantação PROD | **Solicitada pelo docente; NÃO REALIZADA no Google** | Backup privado criado, porém acesso ao editor/implantação do Apps Script não está disponível no ambiente CHAT; contrato permanece v2 e frontend continua offline |
| G9 não mutar Alunos | PASS modelado; verificação real pendente | `Alunos!A:H` idêntico antes/depois, inclusive tentativas negadas |

**Regra:** merge de UI em `main` não autoriza alteração de `Atividades!E3`, cópia de dados reais para QA, deploy de Apps Script, ativação `WEB_NOTAS_PROD_SUBMISSIONS_ENABLED`, POST em PROD ou lançamento de nota. Nenhum recibo foi produzido por esta frente.

## Sequência mínima sem pular gates

1. Em pedido emergencial, o docente priorizou a liberação do código no GitHub; G7 real permanece pendente e não pode ser descrito como PASS.
2. PR #40 integrada após CI PASS, preservando a proteção de `Alunos`; validar a implantação externa continua obrigatório para afirmar que o envio está funcional.
3. Docente realiza backup privado e confere script/implantação PROD e propriedade HMAC; manter recebimento bloqueado.
4. No projeto Apps Script de produção correto, instalar backend 3.2.0 e publicar nova versão com o recebimento bloqueado; só então migrar `Atividades!E3` para v3, verificar GET `health enabled:false` e preparar frontend PROD usando a URL `/exec` comprovada.
5. Somente após aceitação docente explícita habilitar o recebimento, conferir o primeiro recibo e os registros em `Auditoria`, `Resultados`, boletim e média. Em falha: bloquear, não repetir envios incertos automaticamente.

Referências: [PR #38](https://github.com/thalesvalente/teaching-web-development/pull/38), [PR #40](https://github.com/thalesvalente/teaching-web-development/pull/40), [preflight histórico 3.2](https://github.com/thalesvalente/teaching-web-development/blob/main/docs/WEB_A05_320_PREFLIGHT_PRODUCAO_20261026.md).
