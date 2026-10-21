/* Executa código didático exclusivamente no iframe sandbox (origem opaca). */
(() => {
  'use strict';
  const sender = window.parent;
  let token = '';
  let generation = 0;
  let app = null;
  let webRoot = null;
  let mobileRoot = null;
  const { React, ReactDOMClient, RNWeb, Babel } = window.LabVendor || {};

  const post = (type, details = {}) => sender.postMessage({ from: 'ifma-aula05', type, token, ...details }, '*');
  function compile(source) {
    if (!Babel || !React || !RNWeb || !ReactDOMClient) throw Error('Dependências do laboratório indisponíveis.');
    if (typeof source !== 'string' || source.length > 30000) throw Error('O arquivo precisa ter até 30 mil caracteres.');
    const transpiled = Babel.transform(source, {
      filename: 'ProjetoUniversal.tsx',
      presets: [['typescript', { isTSX: true, allExtensions: true }], ['react', { runtime: 'classic' }]],
      plugins: ['transform-modules-commonjs'],
      comments: false,
    }).code;
    const exports = {};
    const module = { exports };
    const onlyCourseModules = (name) => {
      if (name === 'react') return React;
      if (name === 'react-native') return RNWeb;
      throw Error(`Importação não permitida neste laboratório: ${String(name)}`);
    };
    const execute = new Function('module', 'exports', 'require', transpiled);
    execute(module, exports, onlyCourseModules);
    if (typeof module.exports.default !== 'function') throw Error('O arquivo precisa exportar um componente React padrão.');
    if (typeof module.exports.validarTitulo !== 'function') throw Error('A função validarTitulo deve continuar exportada.');
    return module.exports;
  }
  function detachRoots() {
    if (webRoot) { webRoot.unmount(); webRoot = null; }
    if (mobileRoot) { mobileRoot.unmount(); mobileRoot = null; }
  }
  const pause = (ms = 70) => new Promise(resolve => setTimeout(resolve, ms));
  async function mount() {
    detachRoots();
    webRoot = ReactDOMClient.createRoot(document.getElementById('web-root'));
    mobileRoot = ReactDOMClient.createRoot(document.getElementById('mobile-root'));
    webRoot.render(React.createElement(app.default));
    mobileRoot.render(React.createElement(app.default));
    await pause(100);
  }
  const testId = (root, id) => document.querySelector(`#${root} [data-testid="${id}"]`);
  function getButtonText(root) {
    return testId(root, 'botao-registrar')?.textContent?.trim() ?? '';
  }
  async function typeText(root, value) {
    const el = testId(root, 'campo-titulo');
    if (!el) throw Error('Campo de título não localizado no componente.');
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input');
    if (!input) throw Error('Campo não é um input editável.');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await pause();
  }
  async function press(root) {
    const btn = testId(root, 'botao-registrar');
    if (!btn) throw Error('Botão de registro não localizado.');
    btn.click();
    await pause();
  }
  function count(root) {
    const el = testId(root, 'contador');
    if (!el) throw Error('Contador de registros não localizado.');
    return el.textContent.trim();
  }
  async function check(stage) {
    if (!app) throw Error('Primeiro, execute o arquivo.');
    if (stage === 'run') {
      return { ok: !!testId('web-root', 'app-universal') && !!testId('mobile-root', 'app-universal'), detail: 'Mesmo componente renderizado nas duas prévias.' };
    }
    if (stage === 'limit') {
      const test = app.validarTitulo;
      const ok = app.MINIMO_CARACTERES === 7 && test(' abcdef ').valido === false && test(' abcdefg ').valido === true && test(' abcdefg ').texto === 'abcdefg' && test('   ').valido === false;
      return { ok, detail: ok ? 'Limite 7, bordas 6/7 e normalização aprovados.' : 'Altere MINIMO_CARACTERES para 7 e mantenha a função de validação correta.' };
    }
    if (stage === 'button') {
      const text = app.TEXTO_BOTAO?.trim();
      const ok = typeof text === 'string' && text.length >= 8 && text !== 'Registrar memória' && getButtonText('web-root') === text && getButtonText('mobile-root') === text;
      return { ok, detail: ok ? 'O texto editado chegou às duas interfaces.' : 'Altere TEXTO_BOTAO; confira se o novo texto aparece nas duas prévias.' };
    }
    if (stage === 'behavior') {
      try {
        await mount();
        if (count('web-root') !== '0' || count('mobile-root') !== '0') return { ok: false, detail: 'Contadores iniciais devem ser zero.' };
        await typeText('web-root', 'abc');
        await press('web-root');
        if (count('web-root') !== '0' || !testId('web-root', 'erro-titulo')) return { ok: false, detail: 'Entrada curta precisa ser rejeitada, com mensagem de erro.' };
        await typeText('web-root', ' abcdefgh ');
        await press('web-root');
        if (count('web-root') !== '1' || count('mobile-root') !== '0') return { ok: false, detail: 'Verifique registro válido e estados independentes entre as prévias.' };
        if (testId('web-root', 'ultima-memoria')?.textContent.trim() !== 'abcdefgh') return { ok: false, detail: 'A última memória precisa usar o título normalizado.' };
        if (!testId('web-root', 'mensagem-sucesso')) return { ok: false, detail: 'O registro válido precisa apresentar confirmação.' };
        return { ok: true, detail: 'Inválido bloqueado; válido registrado; Web e móvel mantêm estados independentes.' };
      } finally { await mount(); }
    }
    throw Error('Desafio desconhecido.');
  }
  window.addEventListener('message', async (event) => {
    if (event.source !== sender) return;
    const msg = event.data;
    if (!msg || msg.from !== 'ifma-aula05-host' || typeof msg.token !== 'string' || msg.token.length > 100) return;
    token = msg.token;
    const id = ++generation;
    try {
      if (msg.type === 'RUN') {
        app = null;
        detachRoots();
        app = compile(msg.source);
        await mount();
        if (id === generation) post('COMPILED', { ok: true });
      } else if (msg.type === 'CHECK') {
        const result = await check(msg.stage);
        if (id === generation) post('CHECKED', { stage: msg.stage, ...result });
      }
    } catch (error) {
      if (id === generation) post(msg.type === 'CHECK' ? 'CHECKED' : 'COMPILED', { stage: msg.stage, ok: false, detail: String(error?.message || error).slice(0, 450) });
    }
  });
  post('READY');
})();
