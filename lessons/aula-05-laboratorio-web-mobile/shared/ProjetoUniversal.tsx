/**
 * Aula 05 · Um código, duas telas · IFMA 2026.2
 * Componente React Native: também renderiza na Web por React Native Web.
 * O laboratório edita ESTE ARQUIVO COMPLETO, não apenas trechos isolados.
 * Todos os registros são fictícios e permanecem somente na sessão.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const MINIMO_CARACTERES = 5;
export const TEXTO_BOTAO = 'Registrar memória';
export const MENSAGEM_SUCESSO = 'Memória registrada nesta sessão.';

export function validarTitulo(valor: string) {
  const texto = valor.trim();
  if (texto.length < MINIMO_CARACTERES) {
    return {
      valido: false,
      texto,
      erro: `Informe pelo menos ${MINIMO_CARACTERES} caracteres.`,
    };
  }
  return { valido: true, texto, erro: '' };
}

export default function ProjetoUniversal() {
  const [titulo, setTitulo] = useState('');
  const [total, setTotal] = useState(0);
  const [ultima, setUltima] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  function registrar() {
    const resultado = validarTitulo(titulo);
    if (!resultado.valido) {
      setErro(resultado.erro);
      setSucesso('');
      return;
    }
    setTotal((atual) => atual + 1);
    setUltima(resultado.texto);
    setTitulo('');
    setErro('');
    setSucesso(MENSAGEM_SUCESSO);
  }

  return (
    <View style={styles.pagina} testID="app-universal">
      <Text style={styles.selo}>IFMA · LABORATÓRIO 05</Text>
      <Text style={styles.titulo}>Memórias do campus</Text>
      <Text style={styles.intro}>
        Um exemplo fictício para observar o mesmo componente na Web e no celular.
      </Text>

      <Text style={styles.rotulo}>Título da memória</Text>
      <TextInput
        testID="campo-titulo"
        accessibilityLabel="Título da memória"
        accessibilityHint={`Digite pelo menos ${MINIMO_CARACTERES} caracteres`}
        value={titulo}
        onChangeText={(valor) => {
          setTitulo(valor);
          setErro('');
          setSucesso('');
        }}
        placeholder="Ex.: Feira de ciências"
        style={styles.entrada}
      />
      {erro ? (
        <Text testID="erro-titulo" accessibilityRole="alert" style={styles.erro}>
          {erro}
        </Text>
      ) : null}

      <Pressable
        testID="botao-registrar"
        accessibilityRole="button"
        accessibilityLabel={TEXTO_BOTAO}
        onPress={registrar}
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

const styles = StyleSheet.create({
  pagina: { padding: 22, backgroundColor: '#ffffff', borderRadius: 16, width: '100%' },
  selo: { color: '#146c43', fontWeight: '800', fontSize: 12 },
  titulo: { color: '#163d29', fontSize: 25, fontWeight: '800', marginTop: 8 },
  intro: { color: '#485b51', fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 },
  rotulo: { color: '#243c2e', fontWeight: '700', fontSize: 14, marginBottom: 7 },
  entrada: { borderColor: '#718c79', borderWidth: 1.5, borderRadius: 9, padding: 12, minHeight: 48, fontSize: 16, color: '#142e1c' },
  erro: { color: '#a12824', fontSize: 14, marginTop: 9 },
  botao: { backgroundColor: '#096b44', borderRadius: 10, minHeight: 48, padding: 12, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  textoBotao: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  sucesso: { color: '#145635', fontSize: 14, fontWeight: '700', marginTop: 12 },
  resumo: { backgroundColor: '#edf7f1', borderRadius: 12, padding: 15, marginTop: 20 },
  resumoRotulo: { color: '#406351', fontSize: 11, fontWeight: '800' },
  contador: { color: '#0b5d38', fontSize: 35, fontWeight: '800', marginBottom: 10 },
  ultima: { color: '#173c29', fontSize: 15, marginTop: 5 },
  rodape: { color: '#5d7568', fontSize: 11, marginTop: 16 },
});
