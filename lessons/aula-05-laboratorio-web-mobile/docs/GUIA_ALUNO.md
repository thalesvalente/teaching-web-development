# Guia do estudante — Aula 05 comentada

## Objetivo e contrato

Continuar pensando em **estado + eventos + validação**, agora com React Native. Um **mesmo componente TSX** executa no navegador em duas larguras diferentes. Não é preciso converter seus projetos Vue anteriores nem configurar Android para iniciar.

**Roteiro presencial recomendado:** 01–08. **Aprofundamento:** 09–14; pode ficar para outra oportunidade. Todas as questões podem ficar em branco; os XP indicam progresso formativo, **nunca a nota oficial**.

## Primeiros 5 minutos

Abra a aula pelo GitHub Pages. Clique em **Executar nas duas telas** e digite `abc` (erro) e `Feira escolar` (válido). Veja os contadores das duas interfaces. Só então clique em **Localizar no código**: o editor selecionará um trecho do **arquivo inteiro**, não um bloco solto.

## Siga o fluxo em sete blocos

- **[01] Importações:** useState vem de `react`; View, Text, TextInput e Pressable vêm de `react-native`.
- **[02] Configurações:** nomes, regras e cores num único lugar. É aqui que você faz os exercícios 03–10.
- **[03] Regra de negócio:** `validarTitulo()` normaliza, verifica mínimo e máximo e devolve `{ valido, texto, erro }`.
- **[04] Estado do componente:** cada `useState` guarda o valor de **uma instância**. Pense no `ref` visto em Vue.
- **[05] Ação:** `registrar()` chama a regra, bloqueia erros com `return` e atualiza resumo na situação válida.
- **[06] Interface:** JSX liga TextInput, onChangeText e Pressable aos estados e funções dos blocos anteriores.
- **[07] Estilos:** StyleSheet.create, compartilhado pela Web e pelo Expo quando compatível.

Ao localizar uma constante no [02], procure também sua **utilização** nos blocos [03], [05], [06] ou [07]. O objetivo é compreender a conexão.

## Como executar cada exercício

1. Leia **Faça**, **Observe** e **Por quê?** no guia junto do editor.
2. Clique em **Localizar no código**, encontre o comentário e faça uma pequena alteração.
3. Clique em **Executar nas duas telas** e observe os dois resultados. Corrija erros de compilação antes de seguir.
4. Clique em **Testar esta missão**. Se não passar, leia o feedback e a pista opcional; não é necessário apagar tudo.
5. Vá em **Próxima**. Use os cartões ao final da página para escolher outra missão sem perder o contexto.

## Erros comuns e diagnóstico

| Problema | Onde olhar | O que conferir |
|---|---|---|
| Não aparece prévia | Status abaixo do editor | Arquivo salvo? HTML aberto por HTTP/HTTPS? Houve erro TSX? |
| Campo não acompanha o texto | [04] e [06] | `value={titulo}` e `onChangeText` chamando `setTitulo` |
| Inválido incrementa contador | [05] | `return` antes dos setters de sucesso |
| Texto com espaços indevidos | [03] e [05] | `trim()` e `setUltima(resultado.texto)` |
| Alterou cor e não mudou o botão | [02] e [07] | `backgroundColor: COR_BOTAO` realmente usado no estilo |
| XP desapareceu depois de editar | Guia e status de execução | Esse XP dependia do código anterior: execute/teste novamente |
| Web e prévia móvel têm valores diferentes | [04] | São duas instâncias locais independentes; isso é esperado |

## Como entregar a evidência

No final, preencha o que foi alterado e quais comportamentos observou. Exporte **JSON** (inclui código e estados dos 14 testes), **Markdown** ou **imprima/salve em PDF A4**. As missões pendentes continuarão identificadas como pendentes; você não precisa responder tudo para exportar.

A prévia estreita usa React Native Web, não Android/iOS real. Veja `EXPO-REAL.md` para incorporar o mesmo TSX em um projeto Expo sem substituir as rotas existentes. Nunca cole tokens ou dados pessoais no editor do laboratório.

**Retomada:** ao reabrir o laboratório, o código e as respostas podem voltar do rascunho local. Reexecute o TSX e seus testes para recuperar XP técnicos; eles não são contabilizados por um resultado antigo.
