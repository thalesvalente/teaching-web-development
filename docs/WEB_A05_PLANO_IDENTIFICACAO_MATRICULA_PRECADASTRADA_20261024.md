# WEB-A05 — Plano técnico: cadastro docente e confirmação de nome por matrícula

**Versão do plano:** 1.0 · **Data:** 24/10/2026 · **Estado:** PLANEJADO, NÃO IMPLEMENTADO · **Escopo:** Desenvolvimento Web / Aula 05, sem PPI ou Mobile.

## 1. Resumo e decisão funcional

O docente forneceu relação de **38 estudantes**, com nome completo e matrícula, extraída do diário da turma. Os registros foram inseridos **somente** na aba privada `Alunos!A2:H39` do boletim de produção, preservando os identificadores originais, inclusive um prefixo divergente sinalizado ao professor. **Nenhum nome/matrícula real deve ser publicado neste repositório, no bundle JavaScript ou em artefatos de CI.**

A identificação evolui de "o estudante digita nome e matrícula" para:

1. A equipe informa **nome da equipe**.
2. Cada integrante informa **apenas sua matrícula completa**.
3. A aplicação consulta **o servidor**, apresenta o **nome cadastrado correspondente** e pede confirmação explícita. A divergência tem ação "Nome incorreto — avisar professor"; nenhuma entrega é confirmada enquanto houver integrante não conferido.
4. No envio, o backend reconsulta a aba `Alunos`, obtém os nomes autoritativos, valida matrícula/status, assina o recibo, mantém **maior nota por matrícula/atividade**, atualiza a média do bimestre e acrescenta somente as evidências autorizadas à Auditoria.
5. **Não há login, senha, e-mail, CPF, conta Google do aluno ou autenticação institucional.** A confirmação exibida é uma conferência *autodeclarada*, não prova de autoria.

**Bloqueio imediato de compatibilidade:** o Web 3.1.0 atualmente publicado exige somente dígitos (`/^\\d{1,32}$/` em `equipe.js`, `notasEnrollment` e `notasCheckIdentity`), enquanto as 38 matrículas trazem letras e pontos no formato observado `NNNNNNNN.ITANNNN`. **NÃO habilitar novos envios até atualizar e homologar ambos os lados.** Se a recepção de produção já estiver aberta, o proprietário deve executar `bloquearRecebimentoProducaoWeb` antes da migração; não fechar permanentemente a Aula 05.

## 2. Estado da planilha e política de dados

Destino autorizado: planilha **privada** `Desenvolvimento Web 2026 — Notas da Turma (Produção)`, já usada pelo receptor 3.1.0. O ID do destino continua sendo aquele configurado no `WEB_CFG` do backend. Não criar nova cópia em paralelo nem compartilhar a planilha com estudantes.

| Aba/área | Estado após pré-cadastro | Política para a implementação |
| --- | --- | --- |
| `Alunos!A2:H39` | 38 registros, 38 matrículas únicas, 38 nomes normalizados únicos | Fonte de verdade e lista permitida. Coluna A com tipo TEXTO; estado atual `VALIDADO_DOCENTE`, `Fonte docente` e UTC preenchidos; homônimo liberado = false. Preservar acentos e matrícula integral. |
| `Alunos!H19` | Observação sobre prefixo de matrícula distinto, conforme fonte | **Conferência do professor**, sem substituir prefixo por presunção; manter a chave completa até correção autorizada. |
| `4º Bimestre` | Sem linhas de alunos e sem notas de cadastro | Criar/atualizar linha por matrícula **ao primeiro envio válido**; notas vazias continuam vazias (não escrever 0 na inscrição). |
| `Resultados` | Sem entradas produzidas pelo pré-cadastro | Um resultado por matrícula + atividade, com recibo vencedor e maior nota. |
| `Auditoria` | Sem submissões produzidas pelo pré-cadastro | Append-only de tentativas efetivamente aceitas e integridade; consulta de matrícula não gera "entrega", nem log com nome em público. |
| `Atividades` | Aula 05 no 4º bimestre, habilitada no catálogo | Permanecer inalterada, além de eventual atualização controlada de contrato se necessária. |
| 1º–3º bimestres | Não modificados | Nenhuma migração automática de nomes/notas; preservar fórmulas e histórico. |

**Não usar somente os últimos quatro algarismos da matrícula.** Dois registros podem ter o mesmo sufixo e prefixos diferentes. Chave única é a cadeia completa canônica. A normalização de nomes segue `webNormalized()`, respeitando Unicode/acentos, sem homogeneizar grafia exibida.

### Políticas de cadastro

- Importação é um procedimento **administrativo autenticado**, nunca uma função pública de inclusão de novos estudantes.
- Matrícula ausente no `Alunos` é recusada; **não criar cadastro automaticamente** em submissão. Novo aluno só entra por atualização docente da aba, com validação e auditoria do procedimento.
- Status aceito para esta turma: `VALIDADO_DOCENTE`; status de revisão/bloqueio deve impedir a entrega. Estado de conferência não equivale a login institucional.
- A partir desta mudança, homônimos com matrículas distintas e pré-cadastradas são legítimos; **não bloquear nomes iguais** se as duas matrículas existem e estão válidas. Duplicar matrícula dentro da mesma equipe continua proibido.
- O backend nunca substitui nome oficial por texto vindo do browser. Se o professor corrigir nome/ID, consultas futuras refletem o cadastro e o aluno precisa confirmar novamente; recibos anteriores permanecem imutáveis.
- Não migrar dados de frequência/faltas/fotografias para este banco de notas.

## 3. Arquitetura proposta (v3.2.0 candidata)

```text
Aluno / equipe no GitHub Pages
   ├─ formulário: equipe + matrícula(s), 1–8
   ├─ POST read-only lookupStudent(enrollment, nonce)
   │       └─ Apps Script PROD → Alunos (planilha PRIVADA)
   │             └─ devolve APENAS o nome da matrícula solicitada ou erro
   ├─ aluno confirma nome(s) visualmente [não é autenticação]
   └─ POST submitTeam(equipe, matrículas, evidência, nonce)
           └─ Apps Script PROD
                  ├─ verifica modo/flag/catálogo, versão e tamanho
                  ├─ LockService → releitura de Alunos por matrícula COMPLETA
                  ├─ rejeita ausente/duplicada/bloqueada/mudança de cadastro
                  ├─ calcula nota, compara resultado anterior e assina recibo
                  └─ batchUpdate + readback em Resultados/4º Bimestre/Auditoria
```

**Contrato recomendado para consulta (novo, ilustrativo, não funcional no 3.1.0):**

```json
{
  "operation": "lookupStudent",
  "channel": "web-roster-lookup-aula05",
  "nonce": "<identificador aleatorio>",
  "enrollment": "20249999.ITA9999"
}
```

Resposta positiva restrita aos campos `ok, channel, nonce, name, enrollmentCanonical`. Não devolver `Alunos` completo, Fonte docente, atualização, observações, situação de frequência, outros estudantes ou notas. Consulta desconhecida/irregular: mensagem curta e orientação ao professor, sem lista de registros disponíveis.

**Contrato de entrega recomendado:** `web-a05-submission-v3`; enviar `identity.team`, `identity.teamId` e `identity.members:[{enrollment}]` (1–8), além da evidência formativa já existente. O servidor **resolve todos os nomes de novo** antes de gravar; `confirmed:true` no browser é apenas confirmação visual e não autoriza confiar em um nome enviado pelo cliente. Manter recepção e validação de notas existentes, HMAC, nonce, rate-limits e assinatura históricos. Replays devem preservar exatamente o recibo registrado.

**Não alterar diretamente a V3.0.2 QA já homologada.** Criar testes com catálogo sintético de matrículas **alfanuméricas** em cópia/fixture separada, sem estudantes reais.

## 4. Plano de código, ownership e ordem

| ID | Arquivos | Mudança necessária | Gate mínimo |
| --- | --- | --- | --- |
| BE-01 | `integrations/web-appscript-production/Code.gs` | Canonicalização `trim().toUpperCase()`, validação completa da matrícula textual conforme padrão observado `^[0-9]{8}\\.ITA[0-9]{4}$`; não converter em número nem comparar somente sufixos | 38 registros pré-cadastrados passam integridade; identificadores diferentes não colidem |
| BE-02 | Mesmo backend | Nova operação **read-only** de consulta por matrícula em `doPost`, com resposta `HtmlService`/nonce/canal e origem esperada; mesmo gateway de privacidade e rate-limit; leitura apenas da linha solicitada; sem cadastro/escrita | Nome certo apenas para matrícula completa; nenhuma relação nominal pública |
| BE-03 | `notasCheckIdentity`, `notasNormalize`, `notasPlan` | Rejeitar matrícula inexistente; remover autocriação de `Alunos`; hidratar nome **exclusivamente da planilha**, aceitar `VALIDADO_DOCENTE` e outros estados explicitamente permitidos; admitir homônimos com IDs diferentes | Nenhuma entrega de matrícula não cadastrada; zero overwrite indevido |
| BE-04 | `doPost`, `webReturn` e recibos | Despacho de consulta versus entrega; `web-a05-submission-v3` no PROD; replay/versionamento de assinatura; proteção contra HTML/script injection; lock e readback para escrita | Nenhum nome/nota falso no recibo ou escrita parcial |
| FE-01 | `equipe.js`, `index.html`, `style.css` | Remover input de nome editável; manter nome da equipe + matrícula; após matrícula completa, apresentar nome retornado e checkbox "Confirmo"; ação "Nome incorreto" bloqueia envio | 1–8 integrantes e foco/aria-live/feedback acessível |
| FE-02 | Novo módulo lookup + `entrega-appscript.js` | Debounce/ação explícita, loading/empty/error; protocolo de nonce/canal/origem; invalidação da confirmação ao editar matrícula; envio com IDs + evidência, sem nome confiável vindo do browser | Falha de lookup ou alteração pós-confirmação bloqueia POST |
| FE-03 | `report-print.js`, `lab.js` | PDF e JSON representam nomes retornados apenas após consulta confirmada; sem rede, PDF parcial pode mostrar matrícula e `nome não conferido`, sem inventar nomes; nunca persistir automaticamente matrícula/nome consultado | PDF parcial offline, export/import e XP intactos |
| CFG-01 | `production-gate.js`, `entrega-config.js`, `Atividades` | Versão nova `web-notas-3.2.0`; health exige PROD+3.2.0+enabled; atualizar URL somente após implantar/revalidar GAS; evolução explícita do contrato | Front 3.2 NÃO envia nada ao servidor 3.1/QA |
| QA-01 | `tests/web-production/*`, `tests/web-a05-id03/*`, Playwright | Fixtures somente fictícias que incluam ponto, letras, prefixos distintos e mesmo sufixo; isolamento de testes de produção/QA; testes de rotação/status/autorização/admin | Suítes Node/Chromium/Firefox/WebKit e regressões PASS |
| OPS-01 | Docs/CI | Procedimento de cadastro docente, backup, janela de homologação, rollback, monitoramento de recibos e fechamento antes de correções manuais | GO explícito do professor antes do merge/deploy |

### Observações técnicas importantes

- Apps Script publica os métodos `doGet` e `doPost` para web apps; a consulta deve continuar no **servidor**, não em `Alunos.json` no GitHub. Referência: https://developers.google.com/apps-script/guides/web.
- `CacheService` é **best-effort** e suas entradas podem desaparecer antes do TTL. Não é autenticação, nem proteção garantida contra scraping/DoS. Referência: https://developers.google.com/apps-script/reference/cache/cache-service. O Apps Script não fornece controle confiável por IP nativo nesse fluxo público; monitorar abuso e limitar consultas de melhor esforço, com opção de desabilitar buscas. Sem login e mostrando o nome para uma matrícula conhecida, **há risco residual de enumeração**.
- Somente matrículas completas devem acionar consulta; não consultar em cada tecla. Mensagens de erro não devem vazar outros cadastros. Nunca imprimir matrículas/nomes reais em logs de CI, links públicos, URLs/GET ou PR.
- O fato de uma pessoa confirmar um nome mostrado **não comprova que ela é dona da matrícula**. Não transformar isso em "identidade autenticada" no backend nem em nota oficial automática.
- Proteção administrativa `Session.getActiveUser()/getEffectiveUser()`, segredo HMAC, assinatura de recibos e proteção anti-injection **permanecem**. Não reintroduzir funções globais acessíveis por `google.script.run`.
- A edição manual de notas continua exigindo **bloqueio e encerramento da atividade** antes da correção; nunca reabrir uma atividade permanentemente encerrada por engano.

## 5. Plano de homologação e gates

| Gate | Prova | Critério |
| --- | --- | --- |
| G0 — Cadastro | Readback privado `Alunos!A1:H39` | 38 matrículas únicas de texto, 38 nomes normalizados consistentes, dado original preservado; nenhuma linha extra nos bimestres |
| G1 — API lookup | Matrícula sintética cadastrada / inexistente / status bloqueado | Nome correto só para matrícula existente; desconhecida não revela lista; nenhum POST de nota |
| G2 — Identidade | Matrícula com letras/pontos, zeros iniciais, mesmo sufixo/outro prefixo, homônimos | Comparação pela chave completa; homônimos válidos, duplicidade de matrícula recusada |
| G3 — UI | 320/360/390/768/1024/1440 px, 200–400% zoom, teclado e leitor de tela | Só matrícula editável por integrante; nome retornado e confirmação explícita, sem clipping |
| G4 — Resiliência | Nome alterado após consulta, timeout, offline, reload, consulta abusiva, falha HtmlService | Recusar submissão sem reconfirmação; sem sucesso falso, sem armazenamento involuntário |
| G5 — Notas | 1º envio, reenvio nota maior/menor, mudança de equipe, 1–8 integrantes, replay, rejeições | Um estudante por matrícula/atividade, maior nota e média corretas, Auditoria sem duplicação |
| G6 — Segurança | Cross-origin/postMessage, nonce incorreto, XSS em nome, RPC privado, assinatura adulterada | NUNCA aceitar falso recibo, nunca listar/registrar roster publicamente |
| G7 — Google QA | Ensaio HTTP real apenas em base sintética; bloqueio posterior e readback | PASS com recibos assinados e zero alterações no boletim real |
| G8 — Deploy | Pausar recepção PROD → backup → publicar GAS 3.2 → saúde PROD 3.2 → publicar frontend → smoke sem PII → acompanhar primeira entrega genuína | Sem intervalo com frontend/backend incompatíveis, recepção novamente bloqueável |

**GO para liberar a turma somente após G0–G8 PASS** e revisão independente dos diffs. Não abrir temporariamente PROD 3.1 para testar matrículas alfanuméricas. Se falhar, usar `bloquearRecebimentoProducaoWeb`, reverter a configuração frontend para modo offline, preservando o cadastro e a Auditoria.

## 6. Definição de pronto, decisões e próximos passos

- **Concluído nesta solicitação:** pré-cadastro administrativo dos 38 estudantes na aba `Alunos` do boletim privado; matrícula original e acentos preservados; anotação de um prefixo diferente sem corrigi-lo; nenhuma nota criada.
- **Planejado, ainda não executado:** BE-01–BE-04, FE-01–FE-03, CFG-01, QA-01, OPS-01. A instalação atual 3.1.0 **ainda não é compatível** com o lote de matrículas informado.
- **Decisão consolidada:** o aluno digita **nome da equipe + matrícula de cada integrante**, e confirma o nome que o servidor retorna, sem login. Em divergência, entrega suspensa até conferência do professor.
- **Próxima missão recomendada:** implementar backend+client+testes em branch própria, executar revisão Codex e depois homologar na planilha sintética; instalar no Apps Script do proprietário em uma janela controlada, sem expor dados da turma no GitHub.

**Não contém nome ou matrícula real de estudante. Não implica liberação de envios.**
