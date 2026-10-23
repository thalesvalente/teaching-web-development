# WEB-A05-ID03 — execução do plano HTTP/site (23/10/2026)

## Estado e escopo

Código implementado no commit `d7edf2d58c601d89c9d07bd62913d32864b15bdd`, PR #21 Draft, sem merge/produção. Somente Desenvolvimento Web; PPI, Mobile, Apps Script implantado e planilhas não foram alterados neste incremento. Nenhum POST real foi feito: a nova URL `/exec` V3 não foi fornecida nem localizada na busca direcionada no Drive.

## Implementado

- `entrega-config.js`: endpoint vazio, `activated:false`, contrato `web-a05-submission-v2`.
- Matrícula obrigatória determinada pela configuração carregada antes da inicialização da UI; a mesma regra orienta progresso, campos e envio. PDF local continua sem exigência de matrícula.
- Todos os erros locais exibidos juntos; identificação de integrante/nome/matrícula, erro perto do campo, `aria-describedby`, foco e rolagem até o campo. Campo válido não ganha erro indevido.
- PDF com pares nome/matrícula, preservando zeros; recibo com maior nota associada a cada estudante. PDF/JSON continuam documentos privados, não comprovantes de recebimento.
- Recibos rejeitam valores não finitos, `ok` não booleano, data inválida, nonce/canal/hash/origem incompatíveis. Nenhuma chave HMAC no frontend.
- Cache atualizado para `web-id03-qa03`, incluindo configuração. CSS incremental separado, sem redesenhar a aula.
- Suite `tests-live` separada da CI automática, hospedagem virtual dos arquivos reais sob a origem HTTPS esperada, sem simular resposta do Google.
- Gates de endpoint V3, cópia QA, autorização, fase, runId e backup. URL antiga ou `/dev` é rejeitada. Falta de precondição retorna erro, nunca PASS/skip.

## Verificação

Verificações locais: 59/59 testes Node de backend/gates PASS; 11/11 testes estruturais PASS em ambiente complementar (TypeScript 5.9 local). A instalação local do navegador bloqueou navegação por política do ambiente; isso não foi contabilizado como teste visual aprovado.

Execução canônica: workflow `QA HTTP/site Web (somente mocks)` com dependências do package-lock, Node 22 e Chromium/Firefox/WebKit. A CI e suas contagens definitivas ficam no comentário de fechamento da PR após conclusão. Não inferir PASS a partir desta documentação.

Nenhuma aprovação ampla de WCAG é inferida de testes automáticos; os testes cobrem os critérios implementados de labels, descrição de erro, foco, visibilidade e redimensionamento. Leitor de tela e dispositivos físicos continuam validação manual.

## Procedimento HTTP (somente depois do GO da candidata)

Ainda falta a URL `/exec` do projeto **WEB-MATRICULAS-V3-QA**. Não reutilizar URL 2.0.1. O livro é `1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE`.

No checkout desta candidata, em `lessons/aula-05-laboratorio-web-mobile`, instalar `npm ci` e `npx playwright install --with-deps chromium`. Configurar no ambiente do operador:

```text
WEB_QA_V3_EXEC_URL=<nova URL /exec V3, conferida>
WEB_QA_SHEET_ID=1SpL_B_fENFo0PF_-18m4wvle2p1NpbTYStFPEnM7JmE
WEB_QA_AUTHORIZATION=FICTICIOS_WEB_V3
WEB_QA_RUN_ID=<UUID novo da rodada, registrado>
WEB_QA_PHASE=blocked
```

O UUID é técnico, não é matrícula. O runner não solicita credenciais nem segredos. As fases são separadas porque a liberação/bloqueio pertencem ao professor autenticado no editor, não a endpoints públicos.

1. Confirmar `verificarStatusWebV3`, GET bloqueado e backup. Conferir baseline 2 matrículas, notas/médias 10, 3 recibos da homologação interna (ou documentar novos registros legítimos). Rodar `npx playwright test -c playwright.http.config.mjs` com `WEB_QA_PHASE=blocked`.
2. Executar `liberarRecebimentoQAWebV3` no editor. Confirmar GET habilitado QA. Definir `WEB_QA_PHASE=open` e `WEB_QA_BACKUP_CONFIRMED=true`; repetir o comando. O teste envia 1 entrega nova de Ana/Bruno e testa replay e conflitos. Usa somente dados fictícios. Não editar notas nessa janela.
3. **Mesmo se o teste falhar:** executar `bloquearRecebimentoNotasV3` e guardar `BLOQUEADO_SEM_ENVIOS_EM_ANDAMENTO`. Não repetir envio incerto com novo nonce sem conferir auditoria. Nunca executar `encerrarAula05ParaCorrecaoV3` neste ensaio.
4. Com `WEB_QA_PHASE=closed`, repetir o comando para comprovar GET+POST bloqueados.
5. Conferir diretamente Sheets: mesma matrícula em uma única linha, notas/médias 10, exatamente 1 recibo adicional para o sucesso autorizado, conflitos e replay sem registros, bimestres 1–3 preservados. A verificação HMAC é administrativa; o navegador só verifica formato/correlação.

A saída `HTTP_BROWSER_PASS_SCOPED_AGUARDA_BLOQUEIO_E_READBACK` não é aprovação integral. Só fases bloqueado/aberto/fechado + leitura da planilha + revisão autorizam GO HTTP QA. Produção continua decisão separada.

## Limites

- O runner conserva a origem HTTPS com `route.fulfill` de arquivos do checkout. Isso testa o cliente e o Google real, mas não o CDN/cache da futura publicação Pages.
- O script V3.0.1 existente continua QA. Nenhuma mudança no backend é necessária para estas alterações de UI.
- Formato institucional/autenticação, prevenção de enumeração, migração real, review e publicação #20/#21 seguem pendentes. Não tratar matrícula informada como prova de identidade.
- Não apagar histórico, limpar recibos, reabrir atividade encerrada ou divulgar matrículas reais em logs.
