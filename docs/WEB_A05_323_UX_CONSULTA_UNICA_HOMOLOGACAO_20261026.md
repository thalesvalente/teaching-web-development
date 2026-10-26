# WEB-A05 — UX da consulta única de matrícula (3.2.3)

**Data:** 26/10/2026  
**Escopo:** exclusivamente frontend da Aula 05, testes E2E e documentação de homologação.  
**Estado:** candidata para validação; este documento não autoriza publicação, ativação de produção, merge da PR #24 ou alteração de `Alunos`.

## Requisitos de aceitação

- **UX-01 — Um botão por integrante:** o controle inicial é **Consultar matrícula**; após um nome encontrado, o mesmo controle passa a **Nova consulta**. Não existem botões independentes "Reiniciar identificação local" ou "Nome incorreto — procurar o professor".
- **UX-02 — Aviso estático:** quando há nome consultado, exibir **Nome incorreto? Não confirme. Procure o professor para corrigir o cadastro; nenhuma alteração é feita aqui.** O aviso é texto acessível, não executa ação e não altera o cadastro.
- **UX-03 — Nova consulta:** ao acionar o único controle no estado confirmado, descartar nome, token e confirmação locais; preservar o valor da matrícula para edição, remover estado de nome consultado e devolver foco ao campo. Até nova consulta e confirmação, o envio permanece bloqueado.
- **UX-04 — Confirmação explícita:** após a consulta, o nome permanece **somente leitura** e a caixa começa desmarcada. Comprovantes `v2.<HMAC>` mantêm a validade da sessão; comprovantes temporários antigos preservam sua regra de expiração.
- **UX-05 — Erro remoto:** conflito cadastral limpa o nome e a confirmação exibidos, mantém a matrícula para nova consulta e não cria nem altera registros em `Alunos`.
- **UX-06 — Consistência visual:** controle primário verde-escuro com texto branco, variante de nova consulta em verde-claro, bordas arredondadas coerentes com `Concluir identificação`, alvo de toque >=44 px, foco visível e reflow em 320 px.

## Matriz de testes

| Caso | Ação | Resultado esperado |
|---|---|---|
| SITE-V3-08 | Consultar matrícula fictícia válida, confirmar e escolher **Nova consulta** | Uma única ação; aviso estático; nome/token/checkbox descartados; matrícula preservada e editável; nova consulta e confirmação necessárias |
| SITE-V3-09 | Exercitar consulta em largura de 320 px e navegar por teclado | Paleta e contraste AA; mínimo de 44 px; sem extrapolar o contêiner; foco de 3 px |
| SITE-V3-10 | Simular conflito cadastral remoto | Nome anterior e confirmação deixam de aparecer; consulta volta a ficar disponível |
| Regressões SITE-V3-01–07 | Consulta, cadastro ausente, identidade persistente na sessão, download de JSON e modo QA isolado | Sem mudança no contrato de servidor, no registro de notas ou em `Alunos` |
| QA manual — 1 | Abrir a ficha em desktop e smartphone, informar matrícula fictícia e consultar | Nome não editável, um botão, nota de orientação, confirmação necessária |
| QA manual — 2 | Após confirmação, escolher Nova consulta, alterar matrícula e consultar | Campo mantém foco, valida formato e duplicidade, obtém nome atualizado |
| QA manual — 3 | Confirmar, fechar e reabrir a ficha sem recarregar | Confirmação preservada, sem reconsulta forçada por tempo com comprovante v2 |

## Gates para homologação e eventual publicação

- [ ] JS analisado e diff estritamente restrito a frontend, CSS, testes e este documento.
- [ ] Testes E2E e workflows de CI finalizados com sucesso **por SHA**.
- [ ] Revisão independente do mesmo SHA sem findings acionáveis.
- [ ] Teste manual com dados **somente fictícios** na planilha QA isolada, usando `?qa=1`.
- [ ] Não habilitar `endpoint` de produção, não mudar `Code.gs`, `Alunos` ou a planilha real por esta PR.
- [ ] No modo normal, `activated=false` e `endpoint=""`; URL e token QA jamais versionados.

**Plano de retorno:** se a interface falhar em homologação, manter a PR isolada e preservar a versão publicada até reparação/CI; nenhum ajuste cadastral ou de backend é necessário.
