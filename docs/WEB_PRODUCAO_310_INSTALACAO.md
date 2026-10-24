# Desenvolvimento Web — instalação de produção 3.1.0

24/10/2026. Escopo: apenas Web/Aula 05. Identificação declarada conforme ADR-001, sem login do aluno.

## O que foi preparado

Receptor `integrations/web-appscript-production/Code.gs`, gerado a partir do núcleo QA 3.0.2 e testado separadamente. A versão QA e suas evidências permanecem no repositório. O frontend verifica modo PROD, versão 3.1.0 e disponibilidade antes de enviar dados. Fora do hostname oficial o padrão continua offline.

Planilha privada da turma: https://docs.google.com/spreadsheets/d/1cPQD_ie3cEqt11fLXT398DPQIi5bnqkmTqfl9yk8a_Q/edit

É um boletim novo, sem alunos fictícios, com matrícula visível/textual e notas 0–10. A média é escrita pelo receptor ao receber o primeiro envio de cada estudante e atualizada nas atividades seguintes. As planilhas antigas não foram apagadas ou convertidas. A cópia intermediária `1T9d5wjSBwY6eNO6sLEzjkR4jd1wPuLaSMb598NZ4FFc` foi preservada e identificada como modelo QA, não produção.

## Limite real da entrega

As integrações desta sessão não executam funções administrativas nem publicam código no Apps Script. Merge/Pages não atualizam a implantação Google. Não afirmar que as entregas de alunos já estão habilitadas antes da confirmação abaixo. A configuração atual aponta a URL existente, que deve ser atualizada para uma nova versão do código pelo proprietário.

## Ação única de instalação na conta Google

1. No mesmo projeto Web que contém a V3.0.2, substitua integralmente `Code.gs` e `HomologacaoV3.gs` pelos arquivos de `integrations/web-appscript-production/`. O segundo arquivo é uma trava: recusa executar a homologação fictícia no boletim real. Não cole ao final e não mantenha cópias de funções antigas. Não altere PPI/Mobile.
2. O manifesto `appsscript.json` fornecido mantém Sheets v4 e os mesmos escopos Sheets + userinfo.email da versão 3.0.2. Pode substituir o manifesto verdadeiro; não criar `.json.gs`.
3. Salve. No seletor, execute **ativarProducaoWeb**, na conta proprietária com acesso à nova planilha. Autorize se solicitado. A rotina valida o destino, inicializa chave PROD separada, mantém QA bloqueado, verifica o histórico e habilita somente o ambiente real. Não preencha propriedades/segredos manualmente.
4. Exija o log `WEB_PRODUCAO` com `status:WEB_PRODUCAO_ATIVADA`, `version:web-notas-3.1.0`, `mode:PROD`, `enabled:true`, `studentLogin:false` e `spreadsheetId:1cPQD_ie3cEqt11fLXT398DPQIi5bnqkmTqfl9yk8a_Q`.
5. **Implantar → Gerenciar implantações → selecionar a única implantação ativa → lápis → Versão: Nova versão → Implantar.** Mantenha a mesma URL `/exec`, execução como proprietário e acesso do web app conforme a implantação QA. As demais implantações antigas permanecem arquivadas. Não criar outro endpoint, não reativar versões inseguras.
6. Abra a URL `/exec` e confira: `Web web-notas-3.1.0 — PROD — recebimento habilitado — nome, matrícula e equipe; notas 0–10 e maior nota`.

URL da implantação a atualizar:
https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec

Aula dos alunos:
https://thalesvalente.github.io/teaching-web-development/lessons/aula-05-laboratorio-web-mobile/

Quando a versão Google estiver ativa, o site publicado deve passar sua consulta de disponibilidade e permitir envio. Antes disso, ele não transmite nomes/matrículas ao QA. Um GET ou a consulta health não certifica gravação: somente uma entrega com recibo e readback prova o caminho completo na produção. Não inserir testes fictícios no boletim real sem delimitar sua remoção/conciliação.

## Operação diária

- Receber: `ativarProducaoWeb` (idempotente, não apaga notas).
- Consultar estado: `verificarStatusProducaoWeb`.
- Pausar: `bloquearRecebimentoProducaoWeb` (o alias `bloquearRecebimentoNotasV3` também pausa produção).
- Encerrar a Aula 05 antes de corrigir: `encerrarAula05ParaCorrecaoV3`; fechamento permanente por atividade. Não usar durante a instalação.
- Não executar `liberarRecebimentoQAWebV3`, rotação QA ou homologação fictícia na produção.
- Não compartilhar a planilha ou as propriedades de script com alunos.

## Regras preservadas e limites

Nome completo/matrícula/equipe são autodeclarados e não provam autoria; não há login do aluno. Campos obrigatórios, matrícula numérica de 1–32 caracteres, zeros iniciais, conflitos de nome/matrícula, reenvios com maior nota, média por bimestre e auditoria assinada permanecem. Notas recebidas continuam pendentes de conferência docente. XP é convertido a nota e não persistido na planilha.

As limitações de CacheService são de melhor esforço, não autenticação nem proteção completa contra negação de serviço. O cache usa identificadores hash, não dados legíveis. Valores padrão: 180 tentativas/minuto no projeto, 40/equipe/hora, 30/matrícula/hora. Não reduzem a maior nota e não produzem recibo falso.

Em falha ou resultado incerto, pause, preserve o log e confira a Auditoria antes de reenviar. Não apague recibos/chaves ou faça downgrade para código QA apontando ao boletim real.
