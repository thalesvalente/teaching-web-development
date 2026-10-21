# Ponte para execução nativa — Aula 05

O laboratório HTML mostra **duas renderizações reais de React Native Web**, uma larga e outra estreita, usando a mesma fonte TSX. A área estreita NÃO é emulador Android/iOS. Para executar de fato no dispositivo, use um projeto Expo compatível com a baseline de Mobile.

1. No seu projeto Expo existente (sem apagar arquivos anteriores), crie `components/ProjetoUniversal.tsx` com o código completo de `shared/ProjetoUniversal.tsx`.
2. Crie uma nova rota didática `app/lab05.tsx` que apenas importe e renderize `ProjetoUniversal` (preserve a rota `app/index.tsx` anterior):

```tsx
import ProjetoUniversal from '../components/ProjetoUniversal';
export default function Lab05() { return <ProjetoUniversal />; }
```

3. Inicie a aplicação com `npx expo start`. No celular, abra a rota `/lab05` no app conforme a navegação disponível; no navegador, teste `npx expo start --web`. Se a rota não for exposta automaticamente, consulte o professor antes de alterar o layout de navegação.
4. O código que compartilha lógica e aparência é **o mesmo componente TSX**. Botões e entradas tornam-se componentes nativos quando executados no Android/iOS; no browser, React Native Web os representa no DOM. Recursos nativos específicos precisam de adaptações.

**Não copie os imports de `react-native-web` para o aplicativo Expo**: o arquivo original importa de `react-native`, e o Expo escolhe o renderizador por plataforma.

## Limites e evidências
- Sem backend e sem persistência. Contador reinicia ao recarregar o app.
- As memórias apresentadas são fictícias.
- O laboratório Web não instala e nem altera dependências dos projetos anteriores.
- A turma não precisa converter todas as Aulas 1–4 neste encontro.

Fontes: https://docs.expo.dev/workflow/web/ e https://necolas.github.io/react-native-web/docs/installation/.
