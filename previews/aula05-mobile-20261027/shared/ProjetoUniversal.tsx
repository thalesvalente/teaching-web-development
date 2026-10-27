/**
 * AULA 05 — LABORATÓRIO VIVO · TUTORIAL WEB ↔ MOBILE | IFMA
 * ------------------------------------------------------------
 * ESTE É O ARQUIVO COMPLETO QUE VOCÊ EDITA.
 * Em vez de copiar fragmentos de slides, siga as sete etapas
 * numeradas [01] a [07] dentro deste único arquivo.
 *
 * Web: React Native Web desenha estes componentes no navegador.
 * Mobile: Expo/React Native pode reutilizar este mesmo componente.
 * Os registros são fictícios e existem apenas na memória da tela.
 */

// [01] IMPORTAÇÕES — de onde vêm as ferramentas do componente?
// useState guarda informações que mudam enquanto o usuário interage.
import React, { useState } from 'react';
// No React Native, usamos View/Text/TextInput, e não div/p/input.
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// [02] CONFIGURAÇÕES — estes valores ficam no alto para serem encontrados.
// MISSÃO 03: altere o título e observe o resultado nas duas telas.
export const TITULO_APLICACAO = 'Memórias do campus';
// MISSÃO 04: personalize a dica que aparece dentro do campo.
export const DICA_CAMPO = 'Ex.: Feira de ciências';
// MISSÕES 05 e 06: teste os limites inferior e superior da validação.
export const MINIMO_CARACTERES = 5;
export const MAXIMO_CARACTERES = 60;
// MISSÕES 07 a 10: personalize textos e uma cor compartilhada.
export const TEXTO_BOTAO = 'Registrar memória';
export const PREFIXO_ERRO = 'Informe pelo menos';
export const MENSAGEM_SUCESSO = 'Memória registrada nesta sessão.';
export const COR_BOTAO = '#096b44';

// [03] REGRA DE NEGÓCIO — esta função não depende da tela.
// Entrada: qualquer texto digitado. Saída: {valido, texto, erro}.
// .trim() remove espaços APENAS das extremidades, não do meio.
// No Vue e no React a regra pode ser a mesma; muda a ligação à tela.
export function validarTitulo(valor: string) {
  const texto = valor.trim();
  if (texto.length < MINIMO_CARACTERES) {
    return {
      valido: false,
      texto,
      erro: `${PREFIXO_ERRO} ${MINIMO_CARACTERES} caracteres.`,
    };
  }
  if (texto.length > MAXIMO_CARACTERES) {
    return {
      valido: false,
      texto,
      erro: `Use no máximo ${MAXIMO_CARACTERES} caracteres.`,
    };
  }
  return { valido: true, texto, erro: '' };
}

// [04] COMPONENTE — cada tela Web/Mobile cria SUA PRÓPRIA instância.
export default function ProjetoUniversal() {
  // No Vue vimos: const titulo = ref('') e titulo.value = texto.
  // Em React, useState devolve [valor atual, função que atualiza].
  const [titulo, setTitulo] = useState('');
  // Os dois contadores NÃO são sincronizados: não há API nesta aula.
  const [total, setTotal] = useState(0);
  const [ultima, setUltima] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // ORIENTAÇÃO COMPREENSÍVEL PARA TODOS:
  // placeholder={DICA_CAMPO} mostra um EXEMPLO apenas com o campo vazio.
  // accessibilityHint={orientacao} informa a regra à tecnologia assistiva,
  // mas não desenha um texto na tela. Por isso, exibimos a MESMA regra em
  // um <Text> visível. Mudar MINIMO/MAXIMO no bloco [02] atualiza ambos.
  const orientacao = `Digite de ${MINIMO_CARACTERES} a ${MAXIMO_CARACTERES} caracteres. Espaços nas extremidades não contam.`;

  // [05] AÇÃO DO USUÁRIO — Pressable chama registrar() com onPress.
  // 1. Lê o estado; 2. valida; 3. se inválido, PARA com return.
  // 4. Se válido, atualiza contador, última memória e feedback.
  function registrar() {
    const resultado = validarTitulo(titulo);
    if (!resultado.valido) {
      setErro(resultado.erro);
      setSucesso('');
      return; // Sem isso, um título inválido também seria registrado!
    }
    setTotal((atual) => atual + 1);
    setUltima(resultado.texto); // Já normalizado pela função pura.
    setTitulo('');             // Limpa o TextInput porque value={titulo}.
    setErro('');
    setSucesso(MENSAGEM_SUCESSO);
  }

  // [06] INTERFACE — o mesmo JSX é renderizado no navegador e no Expo.
  // Siga o fluxo: TextInput → setTitulo → titulo → validarTitulo
  // → registrar → setTotal/setErro → JSX redesenhado por React.
  return (
    <View style={styles.pagina} testID="app-universal">
      <Text style={styles.selo}>IFMA · LABORATÓRIO 05</Text>
      <Text style={styles.titulo}>{TITULO_APLICACAO}</Text>
      <Text style={styles.intro}>
        Um exemplo fictício para observar o mesmo componente na Web e no celular.
      </Text>

      <Text style={styles.rotulo}>Título da memória</Text>
      {/* Rótulo visível ≠ placeholder ≠ accessibilityHint: cada um tem uma função. */}
      <TextInput
        testID="campo-titulo"
        accessibilityLabel="Título da memória"
        accessibilityHint={orientacao}
        value={titulo} // O campo mostra exatamente o valor do estado React.
        onChangeText={(valor) => {
          setTitulo(valor);  // Atualiza o estado a cada digitação.
          setErro('');       // Corrigir o campo remove a mensagem antiga.
          setSucesso('');    // Novo texto já não é um registro concluído.
        }}
        placeholder={DICA_CAMPO}
        style={styles.entrada}
      />
      {/* Regra sempre visível e idêntica ao accessibilityHint.
          Diferentemente do placeholder, ela permanece após digitar. */}
      <Text testID="ajuda-titulo" style={styles.ajudaCampo}>
        {orientacao}
      </Text>
      {/* Este contador usa o mesmo trim() da regra de validação [03]. */}
      <Text testID="contador-caracteres" style={styles.contadorCampo}>
        Caracteres considerados: {titulo.trim().length}
      </Text>
      {erro ? (
        <Text testID="erro-titulo" accessibilityRole="alert" style={styles.erro}>
          {erro}
        </Text>
      ) : null}

      <Pressable
        testID="botao-registrar"
        accessibilityRole="button"
        accessibilityLabel={TEXTO_BOTAO}
        onPress={registrar} // Referência: NÃO escreva registrar() aqui.
        style={styles.botao}
      >
        <Text style={styles.textoBotao}>{TEXTO_BOTAO}</Text>
      </Pressable>

      {sucesso ? (
        <Text testID="mensagem-sucesso" accessibilityRole="alert" style={styles.sucesso}>
          {sucesso}
        </Text>
      ) : null}

      <View style={styles.resumo}>
        <Text style={styles.resumoRotulo}>REGISTROS NESTA SESSÃO</Text>
        <Text testID="contador" style={styles.contador}>{total}</Text>
        <Text style={styles.resumoRotulo}>ÚLTIMA MEMÓRIA</Text>
        <Text testID="ultima-memoria" style={styles.ultima}>
          {ultima || 'Nenhuma memória registrada'}
        </Text>
      </View>
      <Text style={styles.rodape}>Sem servidor · sem dados pessoais · sem envio ao professor</Text>
    </View>
  );
}

// [07] ESTILOS — StyleSheet.create organiza a apresentação da tela.
// Em React Native, não usamos CSS como no Vue. A propriedade é em camelCase.
// MISSÃO 10: altere COR_BOTAO no bloco [02]; este estilo será atualizado.
const styles = StyleSheet.create({
  pagina: { padding: 22, backgroundColor: '#ffffff', borderRadius: 16, width: '100%' },
  selo: { color: '#146c43', fontWeight: '800', fontSize: 12 },
  titulo: { color: '#163d29', fontSize: 25, fontWeight: '800', marginTop: 8 },
  intro: { color: '#485b51', fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },
  rotulo: { color: '#243c2e', fontWeight: '700', fontSize: 14, marginBottom: 7 },
  entrada: { borderColor: '#718c79', borderWidth: 1.5, borderRadius: 9, padding: 12, minHeight: 48, fontSize: 16, color: '#142e1c' },
  ajudaCampo: { color: '#3b5c4b', fontSize: 12, lineHeight: 18, marginTop: 7 },
  contadorCampo: { color: '#155b3d', fontWeight: '700', fontSize: 12, marginTop: 4 },
  erro: { color: '#a12824', fontSize: 14, marginTop: 8 },
  botao: { backgroundColor: COR_BOTAO, borderRadius: 10, minHeight: 48, padding: 12, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  textoBotao: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  sucesso: { color: '#145635', fontSize: 14, fontWeight: '700', marginTop: 12 },
  resumo: { backgroundColor: '#edf7f1', borderRadius: 12, padding: 15, marginTop: 20 },
  resumoRotulo: { color: '#406351', fontSize: 11, fontWeight: '800' },
  contador: { color: '#0b5d38', fontSize: 35, fontWeight: '800', marginBottom: 10 },
  ultima: { color: '#173c29', fontSize: 15, marginTop: 5 },
  rodape: { color: '#5d7568', fontSize: 11, marginTop: 16 },
});
