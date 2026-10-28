# Aula 05 — estado de liberação e rastreabilidade (27/10/2026)

**Estado:** `UX_PREVIEW_READY / NOTAS_PROD_NO_GO`. Esta é uma fotografia verificável, não uma autorização de ativação do receptor.

## Evidência de código e CI

- Repositório: `thalesvalente/teaching-web-development`.
- PR #38 integrada em `main` via `a42aef49aa0e941356e2e91c65e2133a4ceb9dca`: correção touch/layout, tipografia compacta e `testIgnore` na suíte oficial para executar o teste da prévia somente na configuração de porta 8766.
- Os **cinco workflows** da candidata `75b3c893fd3443af05c5f76b6f14347e767530b9` passaram (prévia, Aula 05, backend modelado, ID03 e HTTP/site com mocks). Isso não equivale a um POST real no Google.
- Prévia isolada `previews/aula05-mobile-20261027/`: `activated:false`, `qaRequested:false`, `endpoint:''`. Ação renomeada para **Gerar PDF (sem envio)**, sem expectativa de recibo ou nota.
- Apps Script de produção **no GitHub main** ainda é `web-notas-3.1.0`; candidata 3.2.0 está na PR #30 (`72874bccb28d23cba168896f1fac8c5c158d12f4`), não integrada/deployada.

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
| G1–G6 código 3.2 | PASS modelado (PR #30) | CI por SHA da candidata integrada; sem ativação de notas |
| G7 HTTP QA 3.2 | **PENDENTE** | Projeto Apps Script QA isolado, versão 3.2, POST fictício, consulta, recibos, reenvio, nota inferior e readback após bloqueio |
| G8 implantação PROD | **NÃO AUTORIZADA/NÃO REALIZADA** | Decisão docente específica após G7, backup privado, conferência do Apps Script real, contrato e versão, ambiente fechado e ativação controlada |
| G9 não mutar Alunos | PASS modelado; verificação real pendente | `Alunos!A:H` idêntico antes/depois, inclusive tentativas negadas |

**Regra:** merge de UI em `main` não autoriza alteração de `Atividades!E3`, cópia de dados reais para QA, deploy de Apps Script, ativação `WEB_NOTAS_PROD_SUBMISSIONS_ENABLED`, POST em PROD ou lançamento de nota. Nenhum recibo foi produzido por esta frente.

## Sequência mínima sem pular gates

1. Concluir G7 com planilha e script QA isolados, evidências reais HTTP e hashes/versionamento, sem dados da turma.
2. Revisar PR #30, decisões e CI no HEAD exato; preservar propriedade de administrador e proibição de escrita em `Alunos`.
3. Docente realiza backup privado e confere script/implantação PROD e propriedade HMAC; manter recebimento bloqueado.
4. Após decisão G8, migrar `Atividades!E3` para v3 no momento coordenado, instalar backend 3.2, verificar GET `health enabled:false`, preparar frontend de produção em PR distinta.
5. Somente após aceitação docente explícita habilitar o recebimento, conferir o primeiro recibo e os registros em `Auditoria`, `Resultados`, boletim e média. Em falha: bloquear, não repetir envios incertos automaticamente.

Referências: [PR #38](https://github.com/thalesvalente/teaching-web-development/pull/38), [PR #30](https://github.com/thalesvalente/teaching-web-development/pull/30), [preflight 3.2](https://github.com/thalesvalente/teaching-web-development/blob/feat/web-a05-320-backend-only-preprod-20261026/docs/WEB_A05_320_PREFLIGHT_PRODUCAO_20261026.md).
