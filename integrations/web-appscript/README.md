# Google Sheets + Apps Script — Desenvolvimento Web 2026.2

## Modelo de entrega em equipe (v1.1.1)

A Aula 05 é realizada **por equipe**. O aluno informa somente o **nome da equipe** (mínimo de 3 caracteres) e os **nomes completos, com nome e sobrenome, de todos os integrantes** (1 a 8; nenhum campo vazio, nomes duplicados ou apenas iniciais). O laboratório **não solicita matrícula nem turma**.

Um ID de equipe aleatório é criado automaticamente e guardado no arquivo JSON de continuidade. Ele serve exclusivamente para identificar o grupo em reenvios; não autentica nenhum estudante. Para evitar duas equipes cadastradas separadamente, um integrante deve enviar a atividade por equipe. Para mudar de aparelho, use **Salvar progresso / Retomar arquivo**, preservando o mesmo ID.

A [planilha de Desenvolvimento Web](https://docs.google.com/spreadsheets/d/1iLx-Tm0EFCsMxqKxbkXAuevJlCzjFAJuRyknbHYlbGM/edit) tem seis abas:

| Aba | Registro da entrega coletiva |
|---|---|
| 1º, 2º, 3º e 4º Bimestres | Uma linha por integrante, com nome, ID automático da equipe e nome do grupo |
| 3º Bimestre | A nota docente da Aula 04 E3-I1 /2,5 é preservada |
| 4º Bimestre | Os mesmos XP formativos da equipe são apresentados aos integrantes, sem conversão em nota |
| Equipes | Uma linha por grupo: todos os nomes, quantidade, XP, recibo e data |
| Auditoria | Uma linha por envio da equipe, com nomes, hashes, recibo e situação pendente de validação docente |

**XP são formativos.** Nomes digitados não provam autoria. A planilha fica privada.

## Arquivos

- [Receptor Apps Script Code.gs](Code.gs) — versão **web-entregas-1.1.1**
- [Manifesto V8](appsscript.json)
- [Formulário de equipe](../../lessons/aula-05-laboratorio-web-mobile/equipe.js)
- [Cliente de entrega](../../lessons/aula-05-laboratorio-web-mobile/entrega-appscript.js)
- [Configuração de endpoint](../../lessons/aula-05-laboratorio-web-mobile/entrega-config.js)
- [Testes de servidor](../../tests/web-entregas.test.cjs)
- [Testes de navegador](../../lessons/aula-05-laboratorio-web-mobile/tests/web-entregas.spec.mjs)

## Atualizar o projeto Google Apps Script já implantado

**Atenção:** a implantação externa anterior contém o contrato de uma pessoa por entrega (v1.0.0). O código desta versão de equipe (v1.1.1) só estará operacional depois da publicação de uma **nova versão da implantação** no editor Google. O envio online da Aula 05 permanece desativado até a homologação. O botão do formulário permanece clicável para PDF local e para informar a indisponibilidade do envio sem transmitir dados. O atalho **Gerar PDF e Enviar** exige identificação válida antes de abrir a impressão; quando a integração estiver habilitada, ele enviará **o JSON das evidências** e mostrará a confirmação somente após um recibo real. O PDF é salvo localmente pelo estudante, **não é anexado ao Google Sheets**. Quando o servidor estiver bloqueado, o atalho permite imprimir o PDF e informa claramente que o envio não ocorreu.

1. Na planilha Web, abra **Extensões → Apps Script** e configure temporariamente a propriedade de script **WEB_WEB_SUBMISSIONS_ENABLED = false**.
2. Substitua **todo o conteúdo** do arquivo Code.gs pelo receptor v1.1.1 linkado acima. Não acrescente fragmentos ao fim da versão antiga.
3. Salve e execute **prepararIntegracaoWeb**. Confira **WEB_SETUP_PASS**, **6 abas**, **14 missões**, **100 XP** e **recebimento BLOQUEADO**.
4. Clique **Deploy → Manage deployments → Edit → New version → Deploy**. Apenas salvar o arquivo não atualiza a implantação versionada.
5. Confira que a mesma URL /exec responde **web-entregas-1.1.1 — recebimento bloqueado**. O script de leitura é **scripts/probe-web-appscript.mjs**.

## Teste real após atualização — só com autorização

1. Execute o teste seguro sem escrita: **node scripts/test-web-appscript-post.mjs --dry-run**.
2. Ative temporariamente no Apps Script **WEB_WEB_SUBMISSIONS_ENABLED = true**.
3. Somente após autorização expressa, execute o script **scripts/test-web-appscript-post.mjs** com as opções **--url** (URL /exec da implantação Web) e **--confirm-write**.
4. Confira as linhas fictícias dos dois integrantes nas quatro abas bimestrais, uma linha na aba Equipes e outra na Auditoria.
5. Desative o recebimento novamente e remova somente registros fictícios após a conferência; preserve os dados e as notas reais.

A liberação para a turma exige **dois controles**: propriedade do servidor habilitada e configuração do frontend com activated:true, em outra revisão de GitHub. O servidor sempre registra recebimento **pendente de validação docente**, nunca nota oficial automática.

## Segurança e governança

O servidor valida os nomes completos, rejeita duplicações na mesma equipe, neutraliza fórmulas maliciosas e utiliza LockService para gravações concorrentes. Uma atividade é associada à equipe pelo ID automático; o mesmo grupo pode reenviar sem duplicar a linha de equipe. PDF e progresso JSON são exportados localmente sem envio automático. Não publique credenciais nem informações de alunos reais no GitHub. O compartilhamento público do Web App exige revisão de acesso e LGPD.

## Correção de homologação 1.1.1 (23/10/2026)

O receptor passou a verificar a persistência das colunas G:J da aba Equipes antes de retornar sucesso. A versão de implantação deve ser **nova**, mantendo o mesmo URL /exec. A versão pública é verificada por GET, que deverá conter `web-entregas-1.1.1`. O parser do teste HTTP passou a validar JSON escapado e o envelope completo `top.postMessage`.

**Não ativar o frontend pelo sucesso de `prepararIntegracaoWeb` ou por `doPost: Completed` isoladamente.** A equipe fictícia histórica já teve a linha Equipes reconciliada; qualquer teste POST adicional deve ter verificação da Auditoria, Equipes e quatro bimestres, sem modificar notas docentes. `activated:false` permanece até recibo real com o contrato completo e prova da implantação 1.1.1.
