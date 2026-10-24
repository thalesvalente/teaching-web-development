# ADR-001 — Aula 05: identificação declarada, sem autenticação institucional

**Status:** ACEITA para o desenho funcional da Aula 05 em 24/10/2026, por decisão explícita do docente.  
**Escopo:** `teaching-web-development`, laboratório interativo da Aula 05, formulário **Equipe e integrantes**.  
**Vínculo:** [PR #21](https://github.com/thalesvalente/teaching-web-development/pull/21).  
**Precedência:** esta decisão substitui requisitos anteriores de exigir autenticação institucional, consulta ao SUAP ou validação prévia de matrícula contra um cadastro institucional para o aluno concluir o formulário. **Não modifica o histórico dos testes QA.**

## Contexto

O docente deseja uma entrega simples: cada equipe informa seus integrantes sem autenticação, sem integração com diretório institucional e sem exigir dados adicionais.

## Decisão

A experiência do aluno exige **somente**:
1. **Nome da equipe**, uma vez.
2. **Nome completo** de cada integrante.
3. **Matrícula** de cada integrante, inserida como texto e preservando zeros iniciais.

É permitido de **1 a 8 integrantes**. O ID técnico da equipe, nonce e hashes são gerados automaticamente, sem novos campos para estudantes. **Não exigir** login, senha, e-mail, CPF, matrícula consultada no SUAP, token, autenticação em serviço institucional, conta Google ou upload de documento de identificação. Não acrescentar etapa de verificação de identidade para a submissão.

O cadastro é **autodeclarado**: os dados informados não provam autoria nem vínculo com a instituição. A avaliação continua **recebida e pendente de validação docente**, sem transformar XP formativo em nota oficial por mera submissão.

## Validações leves que permanecem

- Nome da equipe com no mínimo 3 caracteres; nomes de integrantes com nome e sobrenome.
- Matrícula obrigatória **somente para envio online**; texto de 1 a 32 algarismos ASCII, sem impor comprimento presumido do SUAP. PDF parcial offline permite matrícula vazia.
- Conferir preenchimento, formatos e duplicidade de nomes/matrículas dentro da própria equipe.
- No servidor, prevenir conflitos com registros anteriores (mesma matrícula com nome divergente, mesmo nome com outra matrícula), sem expor dados históricos de terceiros ao solicitante; o professor decide casos legítimos de homônimos.
- Uma linha por matrícula e bimestre; maior nota por estudante/atividade independentemente de equipe, cálculo de média, recibo idempotente e registro de Auditoria das tentativas.
- Matrícula não entra no salvamento automático do navegador; exportação voluntária em PDF/JSON pode contê-la e precisa de aviso de privacidade.
- A administração do Apps Script **permanece protegida** por identidade do proprietário: eliminar autenticação do *aluno* NÃO significa liberar funções administrativas.
- Preservar botão de bloquear recebimentos e fechamento antes de correções manuais.

## Separação de ambientes e estado

**QA 3.0.2 atual:** receptor publica só em planilha sintética, valida que integrantes sejam fictícios, exige prefixo de equipe QA, e permanece com `enabled:false` após homologação HTTP. Esse receptor **não pode ser usado para dados de estudantes reais**; a decisão funcional acima não constitui autorização para remover suas proteções ou compartilhar a planilha.

**Próxima candidata para turma real:** provisionar um ambiente de produção Web separado ou devidamente isolado, com destino docente próprio, autenticação de administração, políticas básicas contra abuso/enumeração e aviso de finalidade/uso dos dados. Remover apenas a *allowlist de pessoas fictícias* nesse novo ambiente controlado, sem exigir identidade institucional. Migrar/conciliar notas somente com aprovação docente e manter os controles de integridade. Alteração de destino/ambiente exige implementação e homologação específicas — não executar por troca manual de flag.

**Não alterado:** PPI, Mobile, versões já implantadas e GitHub Pages. Não executar merge ou ativar recebimento público a partir deste ADR.

## Riscos aceitos e limites

Sem autenticação, outra pessoa pode digitar um nome ou matrícula de terceiro. Isso **não é prevenido** por regex nem por bloqueio de duplicidade. É um risco conhecido do modelo simplificado, a tratar operacionalmente pelo docente em conflitos/contestações, sem anunciar aos alunos que a identidade foi verificada.

As proteções de privacidade e integridade (não divulgar cadastros prévios, restringir administração, evitar consultas abusivas, auditabilidade, pausa do recebimento e validação docente) **não foram dispensadas**.

## Critérios de aceite testáveis

1. Abrir **Equipe e integrantes** exibe apenas campo de equipe e pares nome/matrícula.
2. Adicionar integrante adiciona exclusivamente nome completo e matrícula, até 8 pessoas.
3. Preencher nome da equipe e os pares válidos conclui identificação **sem login nem SUAP**.
4. O envio online valida esses campos e produz recibo de recebimento, não nota oficial; PDF offline aceita matrícula vazia.
5. Matrículas mantêm zeros iniciais; erros indicam integrante e campo; dados de terceiros não aparecem nas mensagens.
6. QA sintético permanece bloqueado após testes; nenhum sistema de produção é liberado por esta decisão.
7. Testes em navegador e revisão técnica da PR #21 passam após mudanças na interface.

## Decisão posterior de liberação

A obrigatoriedade de autenticação institucional/SUAP **sai dos critérios de liberação funcional** por determinação do docente. Permanecem revisão de privacidade e prevenção de abuso, implementação isolada para a turma, validação da persistência na planilha destinada ao curso, revisão das PRs #20/#21 e autorização explícita de publicação.

**Não confundir:** `QA_HTTP_ACCEPTED_SCOPED` já foi concluído com **dados fictícios**. A modalidade real simplificada ainda não foi implantada ou homologada.
