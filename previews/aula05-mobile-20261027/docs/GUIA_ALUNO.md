# Guia do estudante — Laboratório Vivo · Tutorial Aula 05 v4

## Uma missão de cada vez

O laboratório é uma **bancada única**. Em vez de ler um exercício embaixo da página e voltar ao editor acima, você vê tudo junto:

- **Missão atual** — tarefa, resultado esperado, explicação, pista, execução e teste. As perguntas das missões 02 e 14 ficam aqui mesmo.
- **Código** — `shared/ProjetoUniversal.tsx` completo e comentado em sete blocos [01] a [07]. Você não recebe fragmentos soltos.
- **Resultado** — duas instâncias do **mesmo arquivo React Native TSX**, executadas pelo React Native Web.

No computador, o editor e as prévias aparecem lado a lado. No celular ou notebook estreito, use as abas **Código** e **Resultado**. O enunciado e os comandos permanecem acessíveis, sem precisar subir e descer pelo documento.

## Seu ciclo de aprendizagem

**Compreenda:** leia o **Conceito-chave de agora** e o **Teste concreto** da missão, sem sair da bancada. Depois, **Faça:** escolha a missão no seletor, leia o objetivo e clique **Localizar linha**. Modifique uma coisa no trecho destacado. Não é necessário reescrever o componente inteiro.

**Execute:** clique **Executar**, no próprio painel da missão. Alterações só mudam o resultado depois da execução. O status informa se houve erro de TSX.

**Observe:** veja como o comportamento Web e a prévia de largura móvel reagem. Em telas pequenas, Resultado abre automaticamente após execução válida. Experimente os casos descritos na missão.

**Confira:** clique **Conferir missão**. A aplicação testa o código efetivamente executado; o retorno é mostrado no painel da tarefa. Se falhar, abra a pista, corrija e execute novamente. Não é obrigatório terminar todas as tarefas.

**Registre:** a qualquer momento, clique **Evidências** (canto superior). Registre sua observação e exporte JSON, Markdown ou imprima em PDF, inclusive com exercícios pendentes.

## Sete seções conectadas

| Seção do mesmo arquivo | Papel | Relação |
|---|---|---|
| [01] IMPORTAÇÕES | React e componentes React Native | Fornece recursos utilizados nos demais blocos |
| [02] CONFIGURAÇÕES | Nomes, limites e cor | Valores reutilizados na regra, interface e estilo |
| [03] REGRA DE NEGÓCIO | `validarTitulo()` | `trim()`, limites, mensagem e retorno |
| [04] COMPONENTE | `useState()` | Cada instância guarda seus dados |
| [05] AÇÃO DO USUÁRIO | `registrar()` | Usa validação para bloquear/aceitar |
| [06] INTERFACE | `TextInput`, `onChangeText`, `Pressable` | Mostra estado e aciona registro |
| [07] ESTILOS | `StyleSheet.create()` | Apresentação nas duas renderizações |

No painel de edição, a aba **Comparar Vue** mostra o exemplo Vue integral; a aba **Rota Expo** mostra como importar esse mesmo TSX. Vue não é convertido automaticamente.

## Ritmo e XP

O roteiro possui **14 exercícios, 100 XP formativos**, mas **01–08 são o núcleo sugerido para os 100 minutos**; 09–14 são aprofundamento. XP não equivale à nota E3-I1 da Aula 4. Corrigir um erro é parte da aprendizagem. **Os XP conquistados são acumulativos**: modificar ou executar o código não retira pontos ganhos em missões anteriores. Se um teste do código atual falhar, o laboratório mostra o que precisa ser revisto, sem apagar a conquista histórica. O botão **Conferir progresso** reexecuta as verificações técnicas em conjunto e pode recuperar XP que ainda não foram registrados, sem visitar missão por missão.

## Web x Mobile

A prévia estreita **é React Native Web no navegador**, não um Android ou iPhone emulado. As duas instâncias executam o mesmo código, mas seus estados são separados. Consulte `docs/EXPO-REAL.md` para executar esse componente em um projeto Expo no aparelho.

Seu código e suas respostas podem ser guardados no armazenamento local deste navegador, sem envio automático. Evite colar dados pessoais ou credenciais.

## Entenda as cinco informações em torno do TextInput

| No código | O que faz | O que você vê |
|---|---|---|
| `<Text>Título da memória</Text>` | Rótulo visual | Título acima do campo |
| `accessibilityLabel` | Nome acessível | Não desenha outro rótulo |
| `placeholder={DICA_CAMPO}` | Exemplo de preenchimento | Só dentro do campo vazio |
| `accessibilityHint={orientacao}` | Orientação complementar para tecnologias assistivas | Não aparece automaticamente como texto |
| `<Text>{orientacao}</Text>` | Regra permanente de preenchimento | Ex.: “Digite de 5 a 60 caracteres ...” |
| `<Text>{titulo.trim().length}</Text>` | Contador de caracteres considerados | Atualiza a cada digitação |
| `erro ? <Text>...</Text> : null` | Feedback após tentativa inválida | Aparece apenas quando necessário |

**Pratique:** digite `1` e clique no botão. Depois digite `Biblioteca` e repita. Mude o mínimo de 5 para 7 no bloco [02], execute e compare a regra visível, o contador e a validação. O mesmo comportamento aparece nas duas renderizações, mas cada uma tem estado independente.

## Seu rascunho das versões anteriores

O tutorial v4 inicia com o código atualizado para todos verem a regra visual. Se você havia editado código na versão anterior, seu rascunho **não é apagado**; use o botão **Baixar meu código anterior**, quando disponível, para fazer cópia e comparar. A atualização não copia automaticamente alterações antigas para o exemplo novo.



## Salvar agora e continuar depois

1. No cabeçalho do laboratório, clique **Salvar progresso** e guarde o arquivo `Aula05_Continuar_Depois.json`.
2. Volte quando quiser, neste computador ou em outro, e clique **Retomar arquivo**; escolha o JSON e confirme a substituição do progresso da sessão atual.
3. Confira o código, as respostas, a missão em andamento e os XP formativos restaurados. Missões não concluídas permanecem pendentes. Se você editar o código novamente, execute e confira as missões técnicas alteradas.
4. Para imprimir um comprovante de tudo que fez até agora, clique **Gerar PDF**; na janela do navegador, selecione **Salvar como PDF**. O documento A4 tem capa do IFMA e tabela das 14 missões, inclusive pendências. **Não use o PDF para tentar retomar o editor.**

A exportação é local. Nenhuma nota oficial ou entrega ao professor é registrada por salvar o JSON ou PDF.


## Identificação da equipe

A atividade é feita em equipe. No cabeçalho, clique **Equipe e integrantes**, escreva o nome da equipe, preencha o nome e sobrenome de cada integrante e use **+ Adicionar integrante** quando necessário. Não informe matrícula nem turma. Se precisar corrigir a lista, use **Remover** ou edite os nomes.

Clique **Concluir identificação da equipe**. Os integrantes constarão no relatório PDF A4, nas evidências e no arquivo **Salvar progresso**. Ao usar **Retomar arquivo** em outro aparelho, os nomes e o vínculo automático da mesma equipe também serão restaurados. Somente uma pessoa da equipe deve enviar as evidências ao professor, para evitar entregas duplicadas.

Os XP representam a atividade da equipe e não correspondem automaticamente à nota individual. A publicação para o Google Sheets depende da liberação do professor; exportar JSON ou PDF continua sendo local.
