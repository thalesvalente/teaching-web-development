# WEB-A05 — Plano técnico: cadastro docente e confirmação de nome por matrícula

**Versão do plano:** 1.1 · **Data:** 24/10/2026 · **Estado:** PLANEJADO, NÃO IMPLEMENTADO · **Escopo:** Desenvolvimento Web / Aula 05, sem PPI ou Mobile.

## 1. Resumo e decisão funcional

O docente forneceu relação de **38 estudantes**, com nome completo e matrícula, extraída do diário da turma. Os registros foram inseridos **somente** na aba privada `Alunos!A2:H39` do boletim de produção, preservando os identificadores originais, inclusive um prefixo divergente sinalizado ao professor. **Nenhum nome/matrícula real deve ser publicado neste repositório, no bundle JavaScript ou em artefatos de CI.**

A identificação evolui de "o estudante digita nome e matrícula" para:

1. A equipe informa **nome da equipe**.
2. Cada integrante informa **apenas sua matrícula completa**.
3. A aplicação consulta **o servidor em modo estritamente somente leitura**, apresenta o **nome cadastrado correspondente** e pede confirmação explícita. A divergência tem ação **"Nome incorreto — procurar o professor"**, sem opção de editar matrícula ou nome cadastrado; nenhuma entrega é confirmada enquanto houver integrante não conferido.
4. No envio, o backend **somente lê** a aba `Alunos`, obtém os nomes oficiais, valida matrícula/status, assina o recibo, mantém **maior nota por matrícula/atividade**, atualiza a média do bimestre e acrescenta somente as evidências autorizadas à Auditoria. **Nunca cria, altera ou exclui matrícula, nome ou qualquer outra célula do cadastro `Alunos`.**
5. **Não há login, senha, e-mail, CPF, conta Google do aluno ou autenticação institucional.** A confirmação exibida é uma conferência *autodeclarada*, não prova de autoria.
6. **Decisão do professor (obrigatória):** a única forma autorizada de inserir, corrigir, substituir ou excluir uma matrícula no cadastro é **a edição manual, feita pelo próprio professor diretamente na planilha privada**. Isso é vedado ao aluno, à interface pública, ao Apps Script (inclusive funções de administração, gatilhos e migrações), a conectores, APIs e rotinas automáticas.

**Bloqueio imediato de compatibilidade:** o Web 3.1.0 atualmente publicado exige somente dígitos (`/^\d{1,32}$/` em `equipe.js`, `notasEnrollment` e `notasCheckIdentity`), enquanto as 38 matrículas trazem letras e pontos no formato observado `NNNNNNNN.ITANNNN`. **NÃO habilitar novos envios até atualizar e homologar ambos os lados.** Se a recepção de produção já estiver aberta, o proprietário deve executar `bloquearRecebimentoProducaoWeb` antes da migração; não fechar permanentemente a Aula 05.

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

**Não usar somente os últimos quatro algarismos da matrícula.** Dois registros podem ter o mesmo sufixo e prefixos diferentes. Chave única é a cadeia completa canônica. A normalização de nomes segue `webNormalized()`, respeitando Unicode/acentos, sem homogeneizar grafia exibida. **Canonicalizar um valor digitado para pesquisa não significa corrigir a matrícula da planilha; o script não pode regravar nem normalizar os dados cadastrais.**

### Regra irrevogável de imutabilidade — cadastro exclusivamente manual

**INV-MAT-01 (controle normativo):** \`Alunos!A:A\` (matrícula), \`Alunos!B:B\` (nome) e, por segurança, **toda a aba \`Alunos!A:H\` são read-only para qualquer código**. Não existe operação remota nem administrativa para cadastrar, atualizar, substituir, excluir, renumerar, corrigir, mesclar, importar ou migrar matrículas por script. É proibida também a alteração por \`onEdit\`, gatilhos, automação, rotina de reconciliação ou ferramenta/conector externo. **Somente o professor, autenticado no Google Sheets e usando diretamente a interface da planilha, realiza alterações cadastrais manuais**.

- **Interface do aluno:** digitar uma matrícula ou reiniciar a identificação local **não altera o cadastro**. Nenhum botão, link, formulário de correção ou endpoint \`updateEnrollment\`, \`changeEnrollment\`, \`upsertStudent\` ou equivalente deve existir. Uma matrícula confirmada fica bloqueada no formulário durante a entrega; se foi digitada erroneamente, o aluno pode **descartar a identificação local e recomeçar**, sem persistir alteração no servidor. A opção **"Nome incorreto"** apenas instrui procurar o professor e impede o envio. Não criar solicitação pública que escreva em \`Alunos\`.
- **Apps Script:** \`lookupStudent\` e \`submitTeam\` **apenas leem** cadastro. A gravação normal é limitada às abas de notas, resultados, equipes e auditoria; copiar a matrícula existente como referência em \`Resultados\` e \`4º Bimestre\` **não autoriza modificar \`Alunos!A:A\`**. Cadastro inexistente deve produzir rejeição sem escrita, nunca criação automática.
- **Escopo de escritas:** listas explícitas de \`sheetId\` de destino para \`batchUpdate\`, excluindo \`Alunos\`. O executor deve rejeitar toda requisição de escrita que alcance o \`sheetId\` de \`Alunos\` (incluindo \`updateCells\`, \`appendCells\`, \`deleteDimension\`, \`findReplace\`, \`copyPaste\`, mudança de fórmulas ou estrutura), ainda que a chamada venha de rotina administrativa ou caminho de erro. Proteger a aba contra outros editores humanos é recomendado; **essa proteção não substitui o controle no código**, pois o Apps Script executado como proprietário poderia ter permissão de escrita.
- **Operação docente:** para corrigir uma matrícula: (1) bloquear recebimentos e aguardar solicitações em andamento; (2) fazer backup do boletim; (3) editar **manualmente** a matrícula diretamente em \`Alunos\`, mantendo texto integral; (4) conferir unicidade e validade e registrar a justificativa na **Observação docente**; (5) se houver notas anteriores, revisar manualmente os vínculos de \`4º Bimestre\`/\`Resultados\` sem reescrever recibos assinados nem criar conciliação automática; (6) só reabrir recebimento após reconciliação e verificação de integridade. Se não for possível reconciliar com segurança, **manter bloqueado** e preservar o histórico.
- **Sem correção silenciosa:** mudanças na chave, nome cadastrado ou status entre lookup e submissão invalidam a confirmação e obrigam nova consulta. Nenhum erro dá permissão ao servidor para "consertar" o cadastro.
- **Exceção observada no lote:** há um prefixo diferente em um registro. Foi mantido exatamente como a fonte informada. **Apenas o professor pode retificar esse valor, manualmente na planilha**, após conferir o documento original.

A decisão vale **inclusive para acessos e ações do assistente** a partir desta revisão: não utilizar integração Google Drive/Sheets para alterar matrículas ou demais campos da aba \`Alunos\`. O pré-cadastro dos 38 alunos, efetuado antes desta decisão, permanece preservado.

### Políticas de cadastro

- **Não implementar importador automático** (mesmo autenticado). Inclusões, exclusões e correções cadastrais são **somente ações manuais do professor na planilha**, não executadas via interface, script, API ou conector.
- Matrícula ausente no `Alunos` é recusada; **não criar cadastro automaticamente** em consulta, envio, teste, preparação, reconciliação ou qualquer função administrativa. Novo estudante entra **apenas quando o professor cadastrar manualmente diretamente na planilha**.
- Status aceito para esta turma: `VALIDADO_DOCENTE`; status de revisão/bloqueio deve impedir a entrega. Estado de conferência não equivale a login institucional.
- A partir desta mudança, homônimos com matrículas distintas e pré-cadastradas são legítimos; **não bloquear nomes iguais** se as duas matrículas existem e estão válidas. Duplicar matrícula dentro da mesma equipe continua proibido.
- O backend nunca substitui nome ou matrícula cadastrados pelo que vier do navegador. **Se e somente se o professor corrigir manualmente o nome/matrícula na planilha**, as próximas consultas refletem o registro; o aluno deve confirmar novamente. Recibos históricos permanecem imutáveis. Não reconciliar chaves de notas automaticamente após retificação.
- Não migrar dados de frequência/faltas/fotografias para este banco de notas.

## 3. Arquitetura proposta (v3.2.0 candidata)

```text
Aluno / equipe no GitHub Pages
   ├─ formulário: equipe + matrícula(s), 1–8
   ├─ POST read-only lookupStudent(enrollment, nonce)
   │       └─ Apps Script PROD → READ ONLY → Alunos (planilha PRIVADA)
   │             └─ devolve APENAS o nome da matrícula solicitada ou erro
   ├─ aluno confirma nome(s) visualmente [não é autenticação]
   └─ POST submitTeam(equipe, matrículas, evidência, nonce)
           └─ Apps Script PROD
                  ├─ verifica modo/flag/catálogo, versão e tamanho
                  ├─ LockService → leitura SOMENTE LEITURA de Alunos por matrícula COMPLETA
                  ├─ rejeita ausente/duplicada/bloqueada/mudança de cadastro, SEM CADASTRAR
                  ├─ calcula nota, compara resultado anterior e assina recibo
                  └─ batchUpdate + readback em Resultados/4º Bimestre/Auditoria
                     (JAMAIS escreve na aba Alunos)
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

Resposta positiva restrita aos campos `ok, channel, nonce, name, enrollmentCanonical`. Não devolver `Alunos` completo, Fonte docente, atualização, observações, situação de frequência, outros estudantes ou notas. **A API não oferece edição de matrícula, nem para quem conhece a matrícula ou seu nome.** Consulta desconhecida/irregular: mensagem curta e orientação ao professor, sem lista de registros disponíveis.

**Contrato de entrega recomendado:** `web-a05-submission-v3`; enviar `identity.team`, `identity.teamId` e `identity.members:[{enrollment}]` (1–8), além da evidência formativa já existente. **Não incluir quaisquer campos de mutação cadastral, como `newEnrollment`, `oldEnrollment`, `updatedStudent` ou similares.** O servidor **resolve todos os nomes de novo** antes de gravar; `confirmed:true` no browser é apenas confirmação visual e não autoriza confiar em um nome enviado pelo cliente. Manter recepção e validação de notas existentes, HMAC, nonce, rate-limits e assinatura históricos. Replays devem preservar exatamente o recibo registrado.

**Não alterar diretamente a V3.0.2 QA já homologada.** Criar testes com catálogo sintético de matrículas **alfanuméricas** em cópia/fixture separada, sem estudantes reais.

## 4. Plano de código, ownership e ordem

| ID | Arquivos | Mudança necessária | Gate mínimo |
| --- | --- | --- | --- |
| BE-01 | `integrations/web-appscript-production/Code.gs` | Canonicalizar apenas **entrada de consulta** (`trim().toUpperCase()`), validar matrícula textual pelo padrão observado `^[0-9]{8}\.ITA[0-9]{4}# WEB-A05 — Plano técnico: cadastro docente e confirmação de nome por matrícula

**Versão do plano:** 1.1 · **Data:** 24/10/2026 · **Estado:** PLANEJADO, NÃO IMPLEMENTADO · **Escopo:** Desenvolvimento Web / Aula 05, sem PPI ou Mobile.

## 1. Resumo e decisão funcional

O docente forneceu relação de **38 estudantes**, com nome completo e matrícula, extraída do diário da turma. Os registros foram inseridos **somente** na aba privada `Alunos!A2:H39` do boletim de produção, preservando os identificadores originais, inclusive um prefixo divergente sinalizado ao professor. **Nenhum nome/matrícula real deve ser publicado neste repositório, no bundle JavaScript ou em artefatos de CI.**

A identificação evolui de "o estudante digita nome e matrícula" para:

1. A equipe informa **nome da equipe**.
2. Cada integrante informa **apenas sua matrícula completa**.
3. A aplicação consulta **o servidor em modo estritamente somente leitura**, apresenta o **nome cadastrado correspondente** e pede confirmação explícita. A divergência tem ação **"Nome incorreto — procurar o professor"**, sem opção de editar matrícula ou nome cadastrado; nenhuma entrega é confirmada enquanto houver integrante não conferido.
4. No envio, o backend **somente lê** a aba `Alunos`, obtém os nomes oficiais, valida matrícula/status, assina o recibo, mantém **maior nota por matrícula/atividade**, atualiza a média do bimestre e acrescenta somente as evidências autorizadas à Auditoria. **Nunca cria, altera ou exclui matrícula, nome ou qualquer outra célula do cadastro `Alunos`.**
5. **Não há login, senha, e-mail, CPF, conta Google do aluno ou autenticação institucional.** A confirmação exibida é uma conferência *autodeclarada*, não prova de autoria.
6. **Decisão do professor (obrigatória):** a única forma autorizada de inserir, corrigir, substituir ou excluir uma matrícula no cadastro é **a edição manual, feita pelo próprio professor diretamente na planilha privada**. Isso é vedado ao aluno, à interface pública, ao Apps Script (inclusive funções de administração, gatilhos e migrações), a conectores, APIs e rotinas automáticas.

**Bloqueio imediato de compatibilidade:** o Web 3.1.0 atualmente publicado exige somente dígitos (`/^\d{1,32}$/` em `equipe.js`, `notasEnrollment` e `notasCheckIdentity`), enquanto as 38 matrículas trazem letras e pontos no formato observado `NNNNNNNN.ITANNNN`. **NÃO habilitar novos envios até atualizar e homologar ambos os lados.** Se a recepção de produção já estiver aberta, o proprietário deve executar `bloquearRecebimentoProducaoWeb` antes da migração; não fechar permanentemente a Aula 05.

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

**Não usar somente os últimos quatro algarismos da matrícula.** Dois registros podem ter o mesmo sufixo e prefixos diferentes. Chave única é a cadeia completa canônica. A normalização de nomes segue `webNormalized()`, respeitando Unicode/acentos, sem homogeneizar grafia exibida. **Canonicalizar um valor digitado para pesquisa não significa corrigir a matrícula da planilha; o script não pode regravar nem normalizar os dados cadastrais.**

### Regra irrevogável de imutabilidade — cadastro exclusivamente manual

**INV-MAT-01 (controle normativo):** \`Alunos!A:A\` (matrícula), \`Alunos!B:B\` (nome) e, por segurança, **toda a aba \`Alunos!A:H\` são read-only para qualquer código**. Não existe operação remota nem administrativa para cadastrar, atualizar, substituir, excluir, renumerar, corrigir, mesclar, importar ou migrar matrículas por script. É proibida também a alteração por \`onEdit\`, gatilhos, automação, rotina de reconciliação ou ferramenta/conector externo. **Somente o professor, autenticado no Google Sheets e usando diretamente a interface da planilha, realiza alterações cadastrais manuais**.

- **Interface do aluno:** digitar uma matrícula ou reiniciar a identificação local **não altera o cadastro**. Nenhum botão, link, formulário de correção ou endpoint \`updateEnrollment\`, \`changeEnrollment\`, \`upsertStudent\` ou equivalente deve existir. Uma matrícula confirmada fica bloqueada no formulário durante a entrega; se foi digitada erroneamente, o aluno pode **descartar a identificação local e recomeçar**, sem persistir alteração no servidor. A opção **"Nome incorreto"** apenas instrui procurar o professor e impede o envio. Não criar solicitação pública que escreva em \`Alunos\`.
- **Apps Script:** \`lookupStudent\` e \`submitTeam\` **apenas leem** cadastro. A gravação normal é limitada às abas de notas, resultados, equipes e auditoria; copiar a matrícula existente como referência em \`Resultados\` e \`4º Bimestre\` **não autoriza modificar \`Alunos!A:A\`**. Cadastro inexistente deve produzir rejeição sem escrita, nunca criação automática.
- **Escopo de escritas:** listas explícitas de \`sheetId\` de destino para \`batchUpdate\`, excluindo \`Alunos\`. O executor deve rejeitar toda requisição de escrita que alcance o \`sheetId\` de \`Alunos\` (incluindo \`updateCells\`, \`appendCells\`, \`deleteDimension\`, \`findReplace\`, \`copyPaste\`, mudança de fórmulas ou estrutura), ainda que a chamada venha de rotina administrativa ou caminho de erro. Proteger a aba contra outros editores humanos é recomendado; **essa proteção não substitui o controle no código**, pois o Apps Script executado como proprietário poderia ter permissão de escrita.
- **Operação docente:** para corrigir uma matrícula: (1) bloquear recebimentos e aguardar solicitações em andamento; (2) fazer backup do boletim; (3) editar **manualmente** a matrícula diretamente em \`Alunos\`, mantendo texto integral; (4) conferir unicidade e validade e registrar a justificativa na **Observação docente**; (5) se houver notas anteriores, revisar manualmente os vínculos de \`4º Bimestre\`/\`Resultados\` sem reescrever recibos assinados nem criar conciliação automática; (6) só reabrir recebimento após reconciliação e verificação de integridade. Se não for possível reconciliar com segurança, **manter bloqueado** e preservar o histórico.
- **Sem correção silenciosa:** mudanças na chave, nome cadastrado ou status entre lookup e submissão invalidam a confirmação e obrigam nova consulta. Nenhum erro dá permissão ao servidor para "consertar" o cadastro.
- **Exceção observada no lote:** há um prefixo diferente em um registro. Foi mantido exatamente como a fonte informada. **Apenas o professor pode retificar esse valor, manualmente na planilha**, após conferir o documento original.

A decisão vale **inclusive para acessos e ações do assistente** a partir desta revisão: não utilizar integração Google Drive/Sheets para alterar matrículas ou demais campos da aba \`Alunos\`. O pré-cadastro dos 38 alunos, efetuado antes desta decisão, permanece preservado.

### Políticas de cadastro

- **Não implementar importador automático** (mesmo autenticado). Inclusões, exclusões e correções cadastrais são **somente ações manuais do professor na planilha**, não executadas via interface, script, API ou conector.
- Matrícula ausente no `Alunos` é recusada; **não criar cadastro automaticamente** em consulta, envio, teste, preparação, reconciliação ou qualquer função administrativa. Novo estudante entra **apenas quando o professor cadastrar manualmente diretamente na planilha**.
- Status aceito para esta turma: `VALIDADO_DOCENTE`; status de revisão/bloqueio deve impedir a entrega. Estado de conferência não equivale a login institucional.
- A partir desta mudança, homônimos com matrículas distintas e pré-cadastradas são legítimos; **não bloquear nomes iguais** se as duas matrículas existem e estão válidas. Duplicar matrícula dentro da mesma equipe continua proibido.
- O backend nunca substitui nome ou matrícula cadastrados pelo que vier do navegador. **Se e somente se o professor corrigir manualmente o nome/matrícula na planilha**, as próximas consultas refletem o registro; o aluno deve confirmar novamente. Recibos históricos permanecem imutáveis. Não reconciliar chaves de notas automaticamente após retificação.
- Não migrar dados de frequência/faltas/fotografias para este banco de notas.

## 3. Arquitetura proposta (v3.2.0 candidata)

```text
Aluno / equipe no GitHub Pages
   ├─ formulário: equipe + matrícula(s), 1–8
   ├─ POST read-only lookupStudent(enrollment, nonce)
   │       └─ Apps Script PROD → READ ONLY → Alunos (planilha PRIVADA)
   │             └─ devolve APENAS o nome da matrícula solicitada ou erro
   ├─ aluno confirma nome(s) visualmente [não é autenticação]
   └─ POST submitTeam(equipe, matrículas, evidência, nonce)
           └─ Apps Script PROD
                  ├─ verifica modo/flag/catálogo, versão e tamanho
                  ├─ LockService → leitura SOMENTE LEITURA de Alunos por matrícula COMPLETA
                  ├─ rejeita ausente/duplicada/bloqueada/mudança de cadastro, SEM CADASTRAR
                  ├─ calcula nota, compara resultado anterior e assina recibo
                  └─ batchUpdate + readback em Resultados/4º Bimestre/Auditoria
                     (JAMAIS escreve na aba Alunos)
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

Resposta positiva restrita aos campos `ok, channel, nonce, name, enrollmentCanonical`. Não devolver `Alunos` completo, Fonte docente, atualização, observações, situação de frequência, outros estudantes ou notas. **A API não oferece edição de matrícula, nem para quem conhece a matrícula ou seu nome.** Consulta desconhecida/irregular: mensagem curta e orientação ao professor, sem lista de registros disponíveis.

**Contrato de entrega recomendado:** `web-a05-submission-v3`; enviar `identity.team`, `identity.teamId` e `identity.members:[{enrollment}]` (1–8), além da evidência formativa já existente. **Não incluir quaisquer campos de mutação cadastral, como `newEnrollment`, `oldEnrollment`, `updatedStudent` ou similares.** O servidor **resolve todos os nomes de novo** antes de gravar; `confirmed:true` no browser é apenas confirmação visual e não autoriza confiar em um nome enviado pelo cliente. Manter recepção e validação de notas existentes, HMAC, nonce, rate-limits e assinatura históricos. Replays devem preservar exatamente o recibo registrado.

**Não alterar diretamente a V3.0.2 QA já homologada.** Criar testes com catálogo sintético de matrículas **alfanuméricas** em cópia/fixture separada, sem estudantes reais.

## 4. Plano de código, ownership e ordem

| ID | Arquivos | Mudança necessária | Gate mínimo |
| --- | --- | --- | --- |
; comparar matrícula completa, sem conversão numérica e **sem normalizar ou regravar o cadastro** | 38 registros passam integridade; campo cadastral não muda em consultas nem em envios |
| BE-02 | Mesmo backend | Nova operação **somente leitura** de consulta por matrícula em `doPost`, com `HtmlService`/nonce/canal e origem esperada, rate-limit e leitura apenas da linha solicitada; **nenhum endpoint de alteração cadastral, inclusive administrativo** | Nome correto para matrícula completa; **nenhum `sheetId` de Alunos aparece em batchUpdate** |
| BE-03 | `notasCheckIdentity`, `notasNormalize`, `notasPlan` | Rejeitar matrícula ausente; **eliminar autocriação/autoatualização de toda a aba Alunos**; resolver nome somente pela leitura da planilha, validar status e admitir homônimos distintos | Zero escrita no cadastro mesmo no primeiro envio, nos conflitos e no replay |
| BE-04 | `doPost`, `webReturn` e recibos | Despacho de consulta versus entrega; `web-a05-submission-v3` no PROD; replay/versionamento de assinatura; proteção contra HTML/script injection; lock e readback para escrita | Nenhum nome/nota falso no recibo ou escrita parcial |
| FE-01 | `equipe.js`, `index.html`, `style.css` | Exibir só equipe + matrícula digitada; consulta devolve nome **não editável** e checkbox "Confirmo"; após confirmar, bloquear edição do campo local; "Nome incorreto" **somente orienta procurar professor** e bloqueia entrega, sem campo de correção cadastral | 1–8 integrantes, foco/aria-live; nenhuma operação `editar matrícula cadastrada` |
| FE-02 | Novo módulo lookup + `entrega-appscript.js` | Ação explícita de consulta, estados loading/empty/error, nonce/canal/origem; **nenhum comando de edição cadastral**; corrigir digitação só descartando identificação **local** e iniciando nova consulta, nunca alterando registro no Sheets | Qualquer troca de matrícula digitada invalida confirmação e exige nova consulta; nenhum update no cadastro |
| FE-03 | `report-print.js`, `lab.js` | PDF e JSON representam nomes retornados apenas após consulta confirmada; sem rede, PDF parcial pode mostrar matrícula e `nome não conferido`, sem inventar nomes; nunca persistir automaticamente matrícula/nome consultado | PDF parcial offline, export/import e XP intactos |
| BE-05 | `notasPlan`, `notasStore`, `doPost` e todas as funções administrativas | Implementar **write-allowlist explícita** só para `4º Bimestre`, `Resultados`, `Equipes` e `Auditoria` (e operações autorizadas de catálogo fora da identificação), com **proibição absoluta de escrita em `Alunos`**; conferir inexistência de rotas de alteração de matrícula e proteção de cadastro em erro/retry/lock | Auditoria estrutural de toda requisição `batchUpdate` e teste de imutabilidade `Alunos!A:H` antes/depois, inclusive erro |
| CFG-01 | `production-gate.js`, `entrega-config.js`, `Atividades` | Versão nova `web-notas-3.2.0`; health exige PROD+3.2.0+enabled; atualizar URL somente após implantar/revalidar GAS; evolução explícita do contrato | Front 3.2 NÃO envia nada ao servidor 3.1/QA |
| QA-01 | `tests/web-production/*`, `tests/web-a05-id03/*`, Playwright | Fixtures somente fictícias com ponto/letras/prefixos distintos/mesmo sufixo e cenários negativos **de mutação cadastral** (aluno, API, script, funções administrativas, replay, lookup, inscrição e erro) | **Zero alteração de A:H da aba Alunos** em todos os cenários; Node/Chromium/Firefox/WebKit PASS |
| OPS-01 | Docs/CI | Procedimento de cadastro docente, backup, janela de homologação, rollback, monitoramento de recibos e fechamento antes de correções manuais | GO explícito do professor antes do merge/deploy |
| OPS-02 | Planilha privada e documentação de governança | Cadastro, retificação ou exclusão de matrícula **somente pelo professor na interface Google Sheets**; registrar procedimento manual e conciliação referencial antes de reabrir recebimentos; avaliar proteção da aba contra terceiros sem impedir professor | Nenhum script, API, importador ou conector com capacidade de modificar `Alunos`; conferência de impactos em notas históricas |

### Observações técnicas importantes

- Apps Script publica os métodos `doGet` e `doPost` para web apps; a consulta deve continuar no **servidor**, não em `Alunos.json` no GitHub. Referência: https://developers.google.com/apps-script/guides/web.
- `CacheService` é **best-effort** e suas entradas podem desaparecer antes do TTL. Não é autenticação, nem proteção garantida contra scraping/DoS. Referência: https://developers.google.com/apps-script/reference/cache/cache-service. O Apps Script não fornece controle confiável por IP nativo nesse fluxo público; monitorar abuso e limitar consultas de melhor esforço, com opção de desabilitar buscas. Sem login e mostrando o nome para uma matrícula conhecida, **há risco residual de enumeração**.
- Somente matrículas completas devem acionar consulta; não consultar em cada tecla. Mensagens de erro não devem vazar outros cadastros. Nunca imprimir matrículas/nomes reais em logs de CI, links públicos, URLs/GET ou PR.
- **Proibição explícita:** não fornecer `updateEnrollment`, `deleteStudent`, `upsertStudent` ou `setStudentId` em quaisquer interfaces, nem funções administrativas/gatilhos/importadores que alterem matrícula ou qualquer célula de `Alunos`. Ações de confirmação, reporte de divergência e reconsulta são estritamente read-only.
- O fato de uma pessoa confirmar um nome mostrado **não comprova que ela é dona da matrícula**. Não transformar isso em "identidade autenticada" no backend nem em nota oficial automática.
- Proteção administrativa `Session.getActiveUser()/getEffectiveUser()`, segredo HMAC, assinatura de recibos e proteção anti-injection **permanecem**. Não reintroduzir funções globais acessíveis por `google.script.run`.
- A edição manual de notas continua exigindo **bloqueio e encerramento da atividade** antes da correção; nunca reabrir uma atividade permanentemente encerrada por engano.

## 5. Plano de homologação e gates

| Gate | Prova | Critério |
| --- | --- | --- |
| G0 — Cadastro | Readback privado `Alunos!A1:H39` | 38 matrículas textuais únicas, nomes normalizados corretos, dado original preservado; **hash lógico do cadastro como referência de imutabilidade**, sem novas notas |
| G1 — API lookup | Matrícula sintética cadastrada / inexistente / status bloqueado | Nome correto só para matrícula existente; desconhecida não revela lista; nenhum POST de nota |
| G2 — Identidade | Matrícula com letras/pontos, zeros iniciais, mesmo sufixo/outro prefixo, homônimos | Comparação pela chave completa; homônimos válidos, duplicidade de matrícula recusada |
| G3 — UI | 320/360/390/768/1024/1440 px, 200–400% zoom, teclado e leitor de tela | Matrícula **somente como entrada para identificação**, nome retornado read-only, confirmação explícita, **sem função de editar cadastro**, sem clipping |
| G4 — Resiliência | Professor altera cadastro diretamente entre consulta/envio, timeout, offline, reload, consulta abusiva, falha HtmlService | Recusar submissão com cadastro divergente sem reescrever registro; exigir nova confirmação; sem sucesso falso nem armazenamento involuntário |
| G5 — Notas | 1º envio, reenvio nota maior/menor, mudança de equipe, 1–8 integrantes, replay, rejeições | Um estudante por matrícula/atividade, maior nota e média corretas, Auditoria sem duplicação |
| G6 — Segurança | Cross-origin/postMessage, nonce incorreto, XSS em nome, RPC privado, assinatura adulterada | NUNCA aceitar falso recibo, nunca listar/registrar roster publicamente |
| G7 — Google QA | Ensaio HTTP real apenas em base sintética; bloqueio posterior e readback | PASS com recibos assinados e zero alterações no boletim real |
| G8 — Deploy | Pausar recepção PROD → backup → publicar GAS 3.2 → saúde PROD 3.2 → publicar frontend → smoke sem PII → acompanhar primeira entrega genuína | Sem intervalo com frontend/backend incompatíveis, recepção novamente bloqueável |

| G9 — Matrícula imutável | Testar consulta válida/inexistente, inclusão, envio, reenvio, conflito, erro parcial, replay, funções admin e payloads maliciosos; comparar snapshot/fingerprint de `Alunos!A:H` antes/depois e analisar destinos de todas as requisições de escrita | **100% sem mudança no cadastro por qualquer API/Apps Script/controle público.** Somente alteração manual direta do professor é permitida; qualquer mutação automatizada = **NO-GO** |

**GO para liberar a turma somente após G0–G9 PASS** e revisão independente dos diffs. Não abrir temporariamente PROD 3.1 para testar matrículas alfanuméricas. Se falhar, usar `bloquearRecebimentoProducaoWeb`, reverter a configuração frontend para modo offline, preservando o cadastro e a Auditoria.

## 6. Definição de pronto, decisões e próximos passos

- **Concluído nesta solicitação:** pré-cadastro administrativo dos 38 estudantes na aba `Alunos` do boletim privado; matrícula original e acentos preservados; anotação de um prefixo diferente sem corrigi-lo; nenhuma nota criada.
- **Planejado, ainda não executado:** BE-01–BE-05, FE-01–FE-03, CFG-01, QA-01, OPS-01–OPS-02. A instalação atual 3.1.0 **ainda não é compatível** com o lote de matrículas informado.
- **Decisão consolidada:** o aluno digita **nome da equipe + matrícula de cada integrante** somente para buscar identificação, confirma o nome retornado, sem login. **Somente o professor pode alterar matrícula, manualmente na aba Alunos; a interface, scripts, conectores e APIs são estritamente impedidos de fazê-lo.** Em divergência, entrega suspensa até conferência do professor.
- **Próxima missão recomendada:** implementar backend+client+testes em branch própria, executar revisão Codex e depois homologar na planilha sintética; instalar no Apps Script do proprietário em uma janela controlada, sem expor dados da turma no GitHub.

**Não contém nome ou matrícula real de estudante. Não implica liberação de envios.**
