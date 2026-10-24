# WEB-A05-ID03 — execução HTTP/site: estado atualizado

**O roteiro operacional vigente é [WEB_A05_V302_SEGURANCA_E_HTTP.md](WEB_A05_V302_SEGURANCA_E_HTTP.md).** A edição inicial deste documento, preservada no histórico Git, dizia que faltava a URL V3. Esse bloqueio já foi resolvido; não solicite novamente a URL e não reutilize as antigas instruções de liberação 3.0.1.

## Concluído

- Formulário com nome/matrícula, erros específicos por campo, PDF parcial, notas por matrícula e privacidade no navegador implementados na PR #21 Draft.
- O endpoint V3 informado pelo docente foi consultado e recebeu testes HTTP reais com o recebimento bloqueado.
- Runs 40045856927 e 40046143271 comprovaram resposta real no Chromium, inclusive pelo formulário da candidata, sem mock do Google.
- O antigo FAIL do Python foi corrigido: JSON escapado no HTML bruto não indica ausência de mensagem. O launcher agora delega à verificação do navegador.
- Conferência da planilha QA manteve 2 estudantes, nota/média 10 e 3 recibos; nenhum dado real foi enviado.
- A inspeção passiva dos metadados RPC revelou auxiliares e funções administrativas expostos na versão 3.0.1. Não foram executados esses auxiliares nem lidos segredos.
- Candidata 3.0.2 corrigida no commit `bccef5db5531e68c43a9c2cb1c0b9eb06013a872`; CI da revisão funcional `ff2f6231f67cbdcc7dee176ae102971a891a8e81` com quatro workflows aprovados, incluindo 85/85 testes de backend/segurança/validadores.

## Gate atual

**NÃO habilitar a versão 3.0.1.** O proprietário precisa arquivar as implantações anteriores do projeto Web, substituir Code.gs/HomologacaoV3.gs/appsscript.json, preparar a identidade administrativa e rotacionar a chave QA com preservação dos recibos. Em seguida publicar a versão 3.0.2 bloqueada, preferencialmente atualizando a implantação V3 já conhecida.

O teste live exige GET 3.0.2, auxiliares privados e negação anônima da consulta administrativa somente leitura antes de enviar qualquer identificação fictícia. O workflow HTTP é somente manual; a CI normal continua sem gravações Google.

## Fases posteriores

1. `blocked`: mensagem real de rejeição e fronteira RPC; GET final bloqueado.
2. `open`: somente após ação autenticada do proprietário e backup confirmado; uma entrega nova, replay e dois conflitos sintéticos.
3. `closed`: proprietário bloqueia e o ensaio confirma GET/POST bloqueados.
4. Readback da planilha e revisão. Não apagar histórico nem repetir entrega incerta com novo nonce.

O SHA/recibos dos ensaios devem constar no relatório. PASS de transporte bloqueado não é homologação positiva, e CI verde não é produção.

**PPI, Mobile, planilha Web oficial e GitHub Pages permanecem fora do escopo de alteração. PRs #20/#21 continuam Draft, sem merge.**
