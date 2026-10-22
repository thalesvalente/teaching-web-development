# Desenvolvimento Web 2026.2 — Google Sheets + Apps Script (Aula 05)

## Estado e isolamento
- Planilha **exclusiva de Web**, privada: [desenvolvimento-web-2026](https://docs.google.com/spreadsheets/d/1iLx-Tm0EFCsMxqKxbkXAuevJlCzjFAJuRyknbHYlbGM/edit).
- Outras disciplinas: **não reutilizar** planilhas, endpoints, scripts nem segredos de Móveis ou PPI I.
- Fonte Apps Script: [Code.gs](Code.gs).
- Frontend: [entrega-config.js](../../lessons/aula-05-laboratorio-web-mobile/entrega-config.js) + [entrega-appscript.js](../../lessons/aula-05-laboratorio-web-mobile/entrega-appscript.js).
- **Não há endpoint Web /exec implantado nesta entrega.** O botão online fica DESABILITADO enquanto a URL estiver vazia. JSON, Markdown, impressão/PDF e XP continuam funcionando offline.

## Contrato da planilha criada e verificada
Abas:
1. **1º Bimestre**: Aluno | Matrícula | Equipe | Média /10.
2. **2º Bimestre**: idem.
3. **3º Bimestre**: Aluno | Matrícula | Equipe | **Aula 04 E3-I1 /2,5** | Média /10.
4. **4º Bimestre**: Aluno | Matrícula | Equipe | **Aula 05 XP formativo /100** | Média /10.
5. **Auditoria**: 20 colunas de matrícula, atividade, instrumento, data BRT/UTC, recibo, hashes SHA-256, HMAC, XP declarado, nota oficial, estado, rubrica, JSON, chave interna, origem e revisão docente.

**Aula 04:** E3-I1 vale até **2,5 pontos** com rubrica individual corrigida pelo professor. O formulário da Aula 05 **não modifica nem lança** nota da Aula 04. A média do 3º Bimestre é uma *referência normalizada* a 0–10 (pontos E3-I1 × 4), não substitui o fechamento institucional do bimestre.

**Aula 05:** 14 exercícios, 100 XP formativos, **SEM_NOTA_OFICIAL**. Na aba 4º Bimestre, a média oficial permanece 0 enquanto nenhuma avaliação oficial adicional estiver cadastrada; XP não a altera.

Uma matrícula ocupa uma linha por aba, em ordem alfabética. Reenviar a **mesma matrícula + atividade** atualiza sua linha, sem duplicá-la. A Auditoria conserva observações/revisões docentes em colunas separadas, e o último reenvio volta a ficar PENDENTE de validação.

## Como implantar o Apps Script (requer conta proprietária)

**Etapa 1 — projeto vinculado à planilha Web**
1. Abra a planilha Web acima (em sua conta proprietária).
2. Menu **Extensões → Apps Script**. Crie um projeto novo, por exemplo \`desenvolvimento-web-entregas-2026\`.
3. Substitua inteiramente o conteúdo de \`Code.gs\` pelo arquivo versionado deste repositório. **Não colar no projeto da PPI/Mobile.**
4. Salve. Execute \`testarConexaoWeb\` no editor; autorize o acesso à planilha. Exigir log **\`Diagnóstico Web: PASS\`**. Esse teste não grava entregas de alunos.

**Etapa 2 — configurar e implantar com POST bloqueado**
5. **Configurações do projeto → Propriedades de script:** crie \`WEB_WEB_SUBMISSIONS_ENABLED\` com valor **\`false\`**. O segredo \`WEB_RECEIPT_HMAC_SECRET\` é criado pelo servidor quando houver uma entrega real autorizada, jamais no GitHub.
6. **Implantar → Nova implantação → Aplicativo da Web.** Execute como **Você**. Inicialmente restrinja o acesso enquanto valida autorização. Em uso público via GitHub Pages, o Web App exigiria acesso externo e uma política institucional de identidade. O nome e a matrícula digitados **não autenticam** estudante algum. Para coleta apenas formativa, liberar \`Anyone\` requer decisão docente explícita, procedimento de conferência e dados tratados conforme LGPD.
7. Copie o endereço **\`https://script.google.com/macros/s/.../exec\`** desta implantação Web.
8. Atualize **somente** \`entrega-config.js\`, preenchendo \`endpoint\` com esse endereço e publicando nova revisão no GitHub Pages. Com \`endpoint:''\`, o botão fica inativo e não transmite nada.

**Etapa 3 — teste controlado, sem liberar a turma**
9. Abra a URL \`/exec\`: o GET informa a versão \`web-entregas-1.0.0\` e **recebimento bloqueado** (não é prova de POST).
10. Habilite temporariamente \`WEB_WEB_SUBMISSIONS_ENABLED=true\` **somente** durante QA autorizado com nomes fictícios \`QA Ana Exemplo\` e \`QA Bia Exemplo\` e matrículas fictícias. Verifique manualmente recibo e linhas nas abas **4º Bimestre** e **Auditoria**; compare novo envio alterado com a mesma matrícula, confirmando substituição sem duplicatas; verifique falha de POST e ausência de nota oficial.
11. Volte \`WEB_WEB_SUBMISSIONS_ENABLED=false\` até a liberação institucional. Remova apenas registros fictícios criados no QA (não mexer em estudantes reais). Se alterar o código Apps Script depois, publique **nova versão** da implantação; somente salvar não atualiza um Web App versionado.

## Política de pontuação e segurança

- O cliente pode ser manipulado: servidor confere **consistência do relato de XP**, não executa JSX/TSX nem certifica aprendizagem. Nenhum ponto informado no navegador vira nota oficial.
- A Auditoria armazena snapshot limitado (incluindo código TSX até 30 mil caracteres), SHA-256 do snapshot canonizado e SHA-256 do código.
- O HMAC do **recibo do servidor** comprova sua origem a quem detém o segredo. **Não autentica a identidade do aluno** e não é necessário expor o segredo.
- Evidência armazenada na planilha privada. Nada é enviado automaticamente; somente o botão explícito solicita POST.
- PDF/impresso gerado localmente não é enviado. Sem os bytes do PDF no backend, nenhum SHA-256 de PDF é inventado. O recibo usa **hash do JSON** e **hash do código TSX**, não hash de PDF.
- Proteções: flag bloqueada por padrão; limite de payload; campos tipados e limites; cabeçalhos conferidos; prevenção de fórmulas injetadas; LockService para concorrência; atualização idempotente; HTML de retorno neutralizado e nonce na resposta; logs sem segredos.
- Há possibilidade de falsificação de identidade e de DoS quando uma implantação \`Anyone\` estiver ligada; usar autenticação/controle de acesso antes de tratar como canal oficial de avaliação.
- Respeitar prazo de retenção, permissões docentes, recursos de correção e tratamento de dados pessoais conforme a instituição.

## Gate de aceite

| Gate | Esperado |
|---|---|
| G0 | Planilha Google Sheets privada com as cinco abas, fórmulas e cabeçalhos |
| G1 | Script versionado; 14 missões e rubrica formativa preservadas |
| G2 | \`node --test tests/web-entregas.test.cjs\` PASS |
| G3 | E2E Chromium do botão desconectado e fluxo de recibo simulado PASS |
| G4 | \`testarConexaoWeb\` no Apps Script da conta: PASS |
| G5 | GET \`/exec\` na nova implantação Web, sem autenticação enganosa |
| G6 | POST real fictício + reenvio e leitura da planilha: PASS |
| G7 | Identificação/autorização e aceite docente para ativação com estudantes |

**Sem G4–G7 concluídos, o fluxo está preparado no GitHub, mas não deve ser descrito como entrega online homologada.**
