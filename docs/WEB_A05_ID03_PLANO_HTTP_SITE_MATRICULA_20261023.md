# WEB-A05-ID03 — Plano de homologação HTTP real e refinamento da matrícula no laboratório Web

**Data:** 23/10/2026 · **Estado:** PLAN-ONLY · **Escopo:** Desenvolvimento Web, Aula 05 · **Baseline:** PR #21, HEAD `36c4898ee947b1f2dc47e6412a481a31ec9f204d`, base PR #20.  
**Decisão:** desenvolvimento/testes em QA; sem merge, sem promoção, sem estudantes ou matrículas reais, sem edição na Web oficial/PPI/Mobile.

<INSTRUCOES>
Execute PLAN → IMPLEMENT → VERIFY → REVIEW sobre a PR #21 Draft, preservando todos os gates de publicação. Use dados sintéticos, logs redigidos, commits separados por frente e testes determinísticos. Não execute HTTP POST real sem /exec V3 de QA conferido e autorização do ensaio controlado. Não execute fechamento permanente da Aula 05 antes do ensaio.
</INSTRUCOES>
<CONTEXTO>
O Apps Script V3.0.1 foi executado no Google pelo docente e registrou QA_V3_APPS_SCRIPT_PASS_SCOPED, postRealHttp=false, recebimentoFinal=BLOQUEADO. O livro QA V3 contém Ana Teste Ficticio/00001234 e Bruno Teste Ficticio/00005678, cada qual com nota e média 10 no 4º bimestre. Há 3 recibos na Auditoria (0,5; 10; 1). Não existe evidência de POST HTTP real pelo navegador.
</CONTEXTO>
<DADOS>
Planilha QA V3: https://docs.google.com/spreadsheets/d/1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE/edit
PR Draft V3: https://github.com/thalesvalente/teaching-web-development/pull/21
PR predecessora: https://github.com/thalesvalente/teaching-web-development/pull/20
Frontend: lessons/aula-05-laboratorio-web-mobile/
Receptor: integrations/web-appscript-v3-qa/Code.gs
Instrumento: integrations/web-appscript-v3-qa/HomologacaoV3.gs
Roteiro V3 existente: docs/WEB_A05_V301_IMPLANTACAO.md
`WEB_QA_V3_EXEC_URL` é variável operacional A DEFINIR, não deduzir, não usar o receptor legado.
</DADOS>
<SAIDA>
1. Alterações da UI com testes e acessibilidade; 2. ensaio real HTTP e postMessage no navegador; 3. conferência via planilha, auditoria e notas; 4. relatório de evidências, revisão e veredito GO/NO-GO para QA e separadamente para produção; 5. rollback com recebimento bloqueado.
</SAIDA>

## 0. Baseline e bloqueios

1. Confirmar PR #20 e #21 Draft sem merge e HEAD base atualizado; preservar working tree e evidências anteriores.
2. Ler a configuração real instalada: GET da URL `/exec` V3 precisa retornar `web-notas-3.0.1-candidata`, `QA` e `recebimento bloqueado` antes da janela de testes.
3. Confirmar a cópia QA por ID EXATO, o estado `WEB_NOTAS_V3_MODE=QA` e o segredo HMAC somente nas propriedades do projeto. Não exibir valores sensíveis.
4. Backup da cópia QA V3 ANTES do primeiro POST; inventário atual: 2 alunos, 2 resultados, 3 recibos na Auditoria, 2 equipes, os 3 primeiros bimestres sem lançamentos V3, nota e média 10 de Ana/Bruno.
5. Confirmar que a Aula 05 ainda está aberta para QA. Não chamar `encerrarAula05ParaCorrecaoV3`: esse encerramento é permanente e é destinado à correção docente após acabar o recebimento.
6. A URL de implantação V3 precisa ser nova e isolada; rejeitar URLs 1.1.1 e 2.0.1 e URLs de Mobile/PPI. Se GET falhar, apontar versão errada ou solicitar autenticação incompatível com o fluxo, interromper.
7. `WEB_NOTAS_V3_SUBMISSIONS_ENABLED=false` e `activated:false` são os defaults. Nenhum teste live será agendado em CI automática; só execução `workflow_dispatch` protegida/operador local após preflight.

## 1. Delta de implementação do site

| ID | Arquivo | Alteração exigida | Critério de conclusão |
|---|---|---|---|
| UI-01 | `entrega-config.js` | Substituir schema antigo `web-a05-submission-v1` por `web-a05-submission-v2`; remover URL legada da candidata e manter `activated:false`. Em QA injetar `/exec` novo apenas no runner, nunca no site público por engano. | Nenhum request vai ao receptor antigo; ativação padrão permanece falsa. |
| UI-02 | `equipe.js` | Manter `Nome completo` + `Matrícula acadêmica` por integrante (1–8); tipo `text`, `inputmode=numeric`, zeros iniciais. Consolidar a política de matrícula obrigatória a partir de `WebEntregaConfig` já carregada, sem depender de `window.WebEntrega` inicialmente indefinido. | Progresso inicial, hints, validação e submissão concordam sobre o modo online/offline. |
| UI-03 | `equipe.js` | `required`/`aria-required` e marcações de erro coerentes: matrícula é obrigatória só no POST; PDF parcial offline continua possível. Adicionar resumo de erros locais múltiplos (vazios, formatos e duplicatas), campo e integrante, sem exigir reenvio por erro. | Nome/matrícula inválidos geram erros textuais e destaque simultâneo; campos válidos não recebem falso erro. |
| UI-04 | `equipe.js` + `style.css` | Erros remotos visíveis: incluir índice do integrante, nome e matrícula informados, motivo exato e ação; `aria-invalid`, `aria-describedby`, `role=alert`, foco + `scrollIntoView`; layout 320 px até desktop e equipe de 8 pessoas. | O campo 8 permanece integralmente visível após erro, inclusive zoom 200–400%. |
| UI-05 | `entrega-appscript.js` | Confirmar contrato V3 `web-a05-submission-v2`, canal, nonce, identidade+evidência, SHA-256, assinatura no recibo, status pendente e sem nota oficial; mostrar melhores notas com associação nome/matrícula de cada integrante, evitando apenas lista de números. | Recibo confirmado só após resposta válida da implantação real; professor continua podendo revisar. |
| UI-06 | `entrega-appscript.js` + `index.html` | Melhorar estado de envio: pronto para enviar NÃO é confirmação de servidor disponível. Mensagens específicas para `ATIVIDADE_ENCERRADA`, conflitos por campo, indisponibilidade, prazo de 45 s e resultado desconhecido. Preservar dados sem sucesso falso. | Incerteza não vira recibo; botão não envia duas vezes enquanto aguarda. |
| UI-07 | `report-print.js` + `lab.js` | No PDF, exibir pares nome + matrícula se preenchidos; PDF local com matrícula vazia deve continuar válido. Advertir que matrícula/identidade podem ir no JSON baixado sob ação explícita; localStorage automático não pode guardar matrícula. | PDF e JSON coerentes; sem persistência involuntária no navegador ou telemetria. |
| UI-08 | `index.html` + `style.css` | Revisar instruções e privacidade, tamanho de toque >=24 CSS px (alvo preferível 44 px), leitura por teclado, mensagens/status e aviso sobre não compartilhar JSON com matrículas. | Testes WCAG 2.2 AA e inspeção de 320/360/390/768/1024/1440 px. |
| UI-09 | `entrega-appscript.js` | Tratar resposta de `postMessage` somente de origem GAS validada, com `channel` e `nonce`, sem aceitar wildcard; conferir origem efetiva da implantação, respostas HTML do Google, redirecionamento e recibo. Não confiar em mensagens arbitrárias. | Mensagens de origens falsas, nonce incorreto ou hash errado não geram sucesso. |
| UI-10 | Testes novos | Criar suite real `tests-live/http-real-qa.spec.mjs` separada da suite `tests/*.spec.mjs`; require configuração explícita, sem casos que gravem por padrão. | `npm run test:e2e` normal segue mock e nunca toca Google; teste live somente com autorização. |

**Nota de produto:** o campo de matrícula já existe na PR #21. Estas ações são correções complementares, principalmente configuração, coerência visual, identificação no PDF/recibo e prova por HTTP. O PDF/JSON não substitui o recibo. Não alterar 14 missões nem 100 XP formativos.

## 2. Estratégia HTTP de ponta a ponta (SEM publicar a prévia)

O Apps Script 3.0.1 usa `top.postMessage(resposta, 'https://thalesvalente.github.io')`. Playwright em `http://127.0.0.1:8765` não é origem equivalente e não deve ser usado para afirmar PASS HTTP/browser real.

**Estratégia preferida:** iniciar um `browserContext` limpo com `serviceWorkers:'block'` e interceptar exclusivamente requisições dos arquivos estáticos de `https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/`, respondendo com `route.fulfill({path:<arquivo real do checkout>})`. A navegação conserva no navegador a origem HTTPS exata do receptor, sem publicar arquivos nem acessar o Pages público para obter o código sob teste.

- Resolver arquivo estático por allowlist/path canônico, negar `..`, carregar somente checkout SHA aprovado. Interceptar `entrega-config.js` para configurar `endpoint=WEB_QA_V3_EXEC_URL` e `activated=true` no **ensaio isolado**, mantendo a configuração Git original desabilitada.
- NÃO mockar, interceptar para simular, nem reescrever o POST ou a resposta de `script.google.com` / `script.googleusercontent.com`. Permitir fluxo Google e verificar origem real da mensagem. Evitar logs de body (mesmo sintético); coletar ID do recibo, code, hash e status sem segredos.
- Confirmar no navegador `window.location.origin==='https://thalesvalente.github.io'`, `window.WebEntrega.ativado===true` somente no contexto QA e impressão/PDF não bloqueando o ensaio (manualmente salvar ou no Playwright tratar evento).
- Um teste de transporte HTTP adicional, com `application/x-www-form-urlencoded` contendo `nonce` e `payload`, confere redirecionamentos e HTML/JSON sem executar página. **Esse teste isolado não substitui o ensaio do navegador.**
- Separar falha de rede, conteúdo HTML de autenticação, falha na execução de `postMessage`, timeout, recibo inválido e recusa por regra de negócio; cada uma gera diagnóstico e resultado FAIL/INCONCLUSIVO, jamais sucesso por "HTTP 200" somente.
- Se a hospedagem virtual via route não reproduzir o comportamento de sandbox do Google, registrar limitação; alternativa exige prévia isolada sob o MESMO hostname `thalesvalente.github.io`, com aprovação explícita antes de publicação. Nunca alterar `WEB_CFG.origin` para `*`, nem usar `/dev` como substituto de `/exec`.

## 3. Sequência operacional controlada

### G0 — Antes de habilitar

- Confirme URL /exec V3 com GET: versão 3.0.1, QA, bloqueado.
- Execute `verificarStatusWebV3`; exija Aula 05 `enabled=true`, `closed=false` e `enabled=false` no nível global.
- Tire backup da planilha QA V3 e documente baseline numérico: 2 alunos, 2 resultados, 3 auditorias, notas 10, bimestres 1–3 sem alterações.
- Execute suite mock/estática/Chrome local e GitHub Actions de PR #21; exija verde.
- Faça POST real com flag false para conferir rejeição controlada e ZERO escrita (somente dados sintéticos).

### G1 — Janela de teste HTTP

- Sob controle do responsável, execute `liberarRecebimentoQAWebV3` e confira GET `habilitado QA`. Não editar notas nesse intervalo.
- Envie 1 submissão REAL a partir do Chrome/Playwright instrumentado: Equipe QA HTTP, Ana `00001234` e Bruno `00005678`, mesmo cadastro anterior, novo ID de equipe. Comparar `gradeReceived` com XP/10 e `bestGrades` = [10,10].
- Confirmar no servidor planilha + auditoria novo recibo `WEB-...`, HMAC/sha256 íntegros, 4º bimestre uma linha por matrícula, sem alterações nos bimestres 1–3.
- Executar conflitos CONTROLADOS em duas requisições: (a) Ana com matrícula fictícia nova, mesmo nome; (b) Carla Teste Ficticio usando `00001234` já associado a Ana. Nenhum desses erros deve criar linha nem auditoria. Resposta deve trazer código, índice, campo, explicação e ação, **sem retornar dados cadastrais de terceiros**.
- Fazer replay técnico exato do mesmo `nonce+payload` dentro da janela (via ferramenta de transporte do ensaio); recibo e assinatura idênticos, sem nova linha de Auditoria.
- Exercitar recibos inválidos/timeout com mocks ou falhas de rede deliberadas de browser **sem criar novas tentativas incertas na planilha**. Não repetir espontaneamente uma entrega com novo nonce após timeout.
- Durante todo o ensaio usar SOMENTE nomes/matrículas sintéticos fixados no backend QA. Não habilitar produção, não inserir dados reais.

### G2 — Bloqueio obrigatório e verificação final

- Execute `bloquearRecebimentoNotasV3` (NÃO `encerrarAula05ParaCorrecaoV3`).
- Exija log `BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO` e GET /exec com `recebimento bloqueado`.
- Tente novamente POST sintético com flag false e exija zero escrita.
- Leia de novo `4º Bimestre`, `Alunos`, `Resultados`, `Auditoria`, `Equipes` e 1º–3º bimestres. Contagens esperadas = baseline + APENAS sucessos autorizados; as duas matrículas seguem com nota/média 10. Não limpar auditoria nem falsificar identidades.
- Conferir o original Web, PPI/Mobile e GitHub Pages sem mudança. Documentar veredito do ensaio e manter PR Draft.

## 4. Matriz QA testável (entradas e resultado esperado)

| Caso | Camada | Ação / dado | Critério PASS |
|---|---|---|---|
| HTTP-01 | Transporte | GET /exec com flag false | QA + 3.0.1 + bloqueado |
| HTTP-02 | Transporte | POST com flag false | Erro controlado, zero escrita |
| HTTP-03 | Browser real | Navegar com origem HTTPS virtual da candidata | `location.origin` exata, sem baixar site público |
| HTTP-04 | Browser real | Enviar Ana/Bruno e equipe nova | POST nativo, recibo real + Auditoria +1 |
| HTTP-05 | Integridade | Conferir SHA do TSX, nonce, canal e receiptId | Hash e campos compatíveis, não apenas HTTP 200 |
| HTTP-06 | Planilha | Reenvio em outra equipe | Mesma matrícula = uma linha; média e melhor nota 10 |
| HTTP-07 | Servidor | Nome Ana com matrícula distinta | `NOME_MATRICULA_DIVERGENTE`, zero escrita |
| HTTP-08 | Servidor | Nome Carla com matrícula 00001234 | `MATRICULA_NOME_DIVERGENTE`, zero escrita |
| HTTP-09 | Browser | Conflito remoto | Nome/matrícula informados visíveis, foco e campo marcados, sem expor cadastro anterior |
| HTTP-10 | Transporte | Replay mesmo nonce+payload | Mesmo recibo/assinatura, zero linha adicional |
| HTTP-11 | Servidor | Mesmo nonce, payload diferente | Rejeição `DUPLICIDADE_TECNICA` |
| HTTP-12 | Resiliência | Interromper resposta após eventual commit (simulação controlada) | Interface "não confirmado", não promete nota; consulta auditoria antes de retry |
| HTTP-13 | Segurança | Origem falsa/mensagem com nonce ou hash adulterado | Nunca exibir confirmação |
| HTTP-14 | Fechamento | Flag global false com solicitação em espera | Nenhuma escrita após confirmação de bloqueio |
| HTTP-15 | Finalização | GET + POST bloqueado ao fim | Estado fechado globalmente e zero novo registro |
| WEB-01 | Formulário | Matrícula vazia ao enviar online | Impede POST, indica integrante e campo |
| WEB-02 | Formulário | Matrícula com letras ou 33 dígitos | Impede POST, explica regra técnica |
| WEB-03 | Formulário | Mesmo número em 2 integrantes | Ambos campos marcados, índice e nomes |
| WEB-04 | Formulário | Dois nomes iguais com matrículas diferentes | Rejeita até conferência; exceção homônimo só administrativa |
| WEB-05 | Formulário | Zeros iniciais, colar, teclado virtual | Conserva string exata, sem conversão numérica |
| WEB-06 | UI | Erros locais múltiplos em integrantes diferentes | Todos visíveis numa tentativa, foco no primeiro |
| WEB-07 | UI | 8 integrantes, erro do último, 320 e 1440px | Campo totalmente visível; teclado/aria-live funcionando |
| WEB-08 | UX | Página online carregada com matrícula vazia | Progresso NÃO sinaliza identificação pronta |
| WEB-09 | UX | PDF parcial offline sem matrícula | PDF correto; nenhuma requisição HTTP |
| WEB-10 | UX | PDF com matrícula informada | Mostrar pares nome/matrícula com aviso de privacidade |
| WEB-11 | Privacidade | Autossalvar e recarregar | Nenhuma matrícula em localStorage; exibir necessidade de preencher novamente |
| WEB-12 | Privacidade | Baixar JSON sob escolha explícita | Identidade preservada; aviso de não compartilhar |
| WEB-13 | Recibo | Mesmo grupo, maior nota prévia 10 | Valores 10 associados a nomes e matrículas; nota recebida ≠ nota oficial |
| WEB-14 | A11y | WCAG 2.2 AA / zoom 200–400% | 3.3.1, 3.3.2, 3.3.3, 4.1.3 e foco/navegação; sem sobreposição |
| WEB-15 | Compatibilidade | Chromium/Firefox/WebKit, mobile 320–390, tablet 768, desktop 1440 | Sem clipping, sem perda de foco/progresso/XP; registrar limitações do sandbox |
| WEB-16 | Regressão | 14 missões, 100 XP, PDF A4, import/export | Não mudar cálculo de XP, etapas nem impressão parcial |

**Critério de conformidade:** mínimo 100% PASS nos cenários HTTP críticos e nas regressões obrigatórias; qualquer falha de integração, dado acadêmico alterado indevidamente, perda de matrícula/nota, resposta falsa ou recebimento ainda aberto = NO-GO. Casos não executáveis por infraestrutura serão INCONCLUSIVOS, jamais PASS presumido.

## 5. Entregáveis, owners e evidências

| Frente | Dono técnico proposto | Entregável |
|---|---|---|
| Configuração/UI | Engenharia Web | Patch `entrega-config.js`, `equipe.js`, `index.html`, `style.css`, `report-print.js`, `entrega-appscript.js` com acessibilidade e privacidade |
| Testes isolados | QA navegador | Testes estruturais, Playwright mock, testes de 8 integrantes/responsividade, execução Chrome/Firefox/WebKit sem POST real |
| HTTP real | Integração | Runner `tests-live` com rota virtual HTTPS, GET/POST real, nonce, recibo, erros e evidências sanitizadas |
| Segurança | Revisor independente | Origem, mensagens, confidencialidade de matrículas, controle de implantação/recepção, HMAC e proteção contra enumeração |
| Docente/Google | Operação autorizada | URL /exec QA e permissão temporária, `liberarRecebimentoQAWebV3` → teste → `bloquearRecebimentoNotasV3`, conferência/backup |
| Governança | Coordenação | QA report com HEAD/SHA, versão GAS, URL QA com identificador parcial, recibos, diferenças de contagem, CI, findings, GO/NO-GO |

Os testes automáticos de PR não devem escrever Google Sheets. A execução real usa data/horário, baseline, resultado de cada caso, hashes e logs SEM corpo dos formulários nem segredos. Evidências visuais podem ser publicadas no PR apenas com matrículas sintéticas e sem informações pessoais reais.

## 6. Trade-offs e liberação

- A origem virtual com Playwright usa o **código real da branch e o HTTP real**, mas não testa o cache/CDN do GitHub Pages já publicado. O último smoke na URL pública fica para um gate pós-aprovação, inicialmente com `activated:false`.
- `application/x-www-form-urlencoded` e o iframe HTML são necessários pela arquitetura atual; não substituir por `fetch` CORS sem um projeto/mudança formal.
- O formulário coleta matrícula como texto, mas **não autentica matrícula**; QA somente fictício. Produção depende de mecanismo de identidade/roster institucional, prevenção contra enumeração e autorização docente.
- Conflitos públicos exibem os dados fornecidos na submissão, nunca o nome/matrícula pré-existentes de terceiros. A comparação completa é exclusivamente administrativa.
- Uma nota manual pode ser sobrescrita se o professor corrigir com recepção aberta. O P1 foi aceito pelo professor **sob fechamento prévio**. Não alterar nota com envios ativos e não executar fechamento permanente até que o ciclo de entregas termine.
- Não reexecutar a homologação inicial para apagar/recriar notas; novas tentativas QA aumentam legitimamente a Auditoria. Snapshot comparativo, sem deleção de histórico.
- A PR #21 depende da #20; não mesclar nenhuma antes do GO técnico e autorização explícita de produção.

## 7. Gates formais

| Gate | Condição | Se falhar |
|---|---|---|
| G0 Baseline | PRs Draft, QA Sheet e Apps Script 3.0.1 confirmado, flag false | Bloquear |
| G1 Frontend | Delta implementado e regressões mock/estática 100% PASS | Corrigir, não executar HTTP |
| G2 HTTP QA | GET/POST real, recibo íntegro, erros específicos e zero gravações indevidas | Bloquear e investigar |
| G3 Readback | Mesmas 2 matrículas, notas/médias 10, Auditoria cresce apenas por sucesso | NO-GO |
| G4 Contenção | Flag false com prova GET, sem solicitações em voo | NO-GO |
| G5 Produção | Autenticação institucional, privacidade, revisão, PR #20/#21, smoke Pages e aceite docente | Permanecer Draft |

**Estado deste documento:** somente planejamento técnico. Não certifica HTTP real, não muda flags de Google, não mescla PRs e não publica site.
