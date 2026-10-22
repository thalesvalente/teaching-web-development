# Guia do estudante — Laboratório Aula 05 v3

## Uma missão de cada vez

O laboratório é uma **bancada única**. Em vez de ler um exercício embaixo da página e voltar ao editor acima, você vê tudo junto:

- **Missão atual** — tarefa, resultado esperado, explicação, pista, execução e teste. As perguntas das missões 02 e 14 ficam aqui mesmo.
- **Código** — `shared/ProjetoUniversal.tsx` completo e comentado em sete blocos [01] a [07]. Você não recebe fragmentos soltos.
- **Resultado** — duas instâncias do **mesmo arquivo React Native TSX**, executadas pelo React Native Web.

No computador, o editor e as prévias aparecem lado a lado. No celular ou notebook estreito, use as abas **Código** e **Resultado**. O enunciado e os comandos permanecem acessíveis, sem precisar subir e descer pelo documento.

## Seu ciclo de aprendizagem

**Faça:** escolha a missão no seletor, leia o objetivo e clique **Localizar linha**. Modifique uma coisa no trecho destacado. Não é necessário reescrever o componente inteiro.

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

O roteiro possui **14 exercícios, 100 XP formativos**, mas **01–08 são o núcleo sugerido para os 100 minutos**; 09–14 são aprofundamento. XP não equivale à nota E3-I1 da Aula 4. Corrigir um erro é parte da aprendizagem; mudanças de código invalidam XP técnicos antigos até você executar e conferir novamente.

## Web x Mobile

A prévia estreita **é React Native Web no navegador**, não um Android ou iPhone emulado. As duas instâncias executam o mesmo código, mas seus estados são separados. Consulte `docs/EXPO-REAL.md` para executar esse componente em um projeto Expo no aparelho.

Seu código e suas respostas podem ser guardados no armazenamento local deste navegador, sem envio automático. Evite colar dados pessoais ou credenciais.
