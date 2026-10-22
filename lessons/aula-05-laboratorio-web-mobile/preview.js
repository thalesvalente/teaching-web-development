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
  // Cada missão inspeciona o CÓDIGO EXECUTADO e/ou a resposta da interface.
  // Os testes com interação remontam as duas instâncias para não alterar
  // os campos que o estudante está usando na prévia.
  async function check(stage) {
    if (!app) throw Error('Primeiro, execute o arquivo.');
    const web = 'web-root', mobile = 'mobile-root';
    if (stage === 'run') {
      const ok = !!testId(web, 'app-universal') && !!testId(mobile, 'app-universal');
      return { ok, detail: ok ? 'O arquivo TSX gerou as duas interfaces.' : 'Confirme as duas interfaces e tente executar novamente.' };
    }
    if (stage === 'title') {
      const title = app.TITULO_APLICACAO?.trim();
      const ok = typeof title === 'string' && title.length >= 8 && title !== 'Memórias do campus' &&
        [web, mobile].every(root => [...document.querySelectorAll(`#${root} [data-testid="app-universal"] *`)].some(el => el.textContent?.trim() === title));
      return { ok, detail: ok ? 'Título atualizado nas duas renderizações.' : 'Edite TITULO_APLICACAO e confira o título Web e móvel.' };
    }
    if (stage === 'placeholder') {
      const hint = app.DICA_CAMPO?.trim();
      const ok = typeof hint === 'string' && hint.length >= 8 && hint !== 'Ex.: Feira de ciências' &&
        [web, mobile].every(root => testId(root, 'campo-titulo')?.getAttribute('placeholder') === hint);
      return { ok, detail: ok ? 'A dica foi atualizada nos dois campos.' : 'Edite DICA_CAMPO e confira o placeholder de ambos.' };
    }
    if (stage === 'limit') {
      const fn = app.validarTitulo;
      const ok = app.MINIMO_CARACTERES === 7 && fn(' abcdef ').valido === false && fn(' abcdefg ').valido === true &&
        fn(' abcdefg ').texto === 'abcdefg' && fn('   ').valido === false;
      return { ok, detail: ok ? 'Bordas 6/7 e remoção de espaços aprovadas.' : 'Use MINIMO_CARACTERES = 7 e mantenha validarTitulo funcionando.' };
    }
    if (stage === 'maximum') {
      const fn = app.validarTitulo;
      const ok = app.MAXIMO_CARACTERES === 30 && fn('a'.repeat(30)).valido === true &&
        fn('a'.repeat(31)).valido === false && fn('a'.repeat(31)).erro.includes('30');
      return { ok, detail: ok ? 'Bordas 30/31 caracteres verificadas.' : 'Altere MAXIMO_CARACTERES para 30 e preserve a regra superior em validarTitulo.' };
    }
    if (stage === 'button') {
      const txt = app.TEXTO_BOTAO?.trim();
      const ok = typeof txt === 'string' && txt.length >= 8 && txt !== 'Registrar memória' &&
        getButtonText(web) === txt && getButtonText(mobile) === txt;
      return { ok, detail: ok ? 'O botão foi renomeado em ambas as prévias.' : 'Altere TEXTO_BOTAO; confira as duas prévias.' };
    }
    if (stage === 'error') {
      const txt = app.PREFIXO_ERRO?.trim();
      const invalid = app.validarTitulo('abc');
      const okPrefix = typeof txt === 'string' && txt.length >= 12 && txt !== 'Informe pelo menos' &&
        invalid.valido === false && invalid.erro.startsWith(txt) && invalid.erro.includes(String(app.MINIMO_CARACTERES));
      if (!okPrefix) return { ok: false, detail: 'Personalize PREFIXO_ERRO e mantenha o número mínimo na mensagem.' };
      try {
        await mount();
        for (const root of [web, mobile]) {
          await typeText(root, 'abc'); await press(root);
          if (testId(root, 'erro-titulo')?.textContent.trim() !== invalid.erro) {
            return { ok: false, detail: 'O erro da função deve aparecer em ambas as interfaces.' };
          }
        }
        return { ok: true, detail: 'Mensagem nova ligada à validação real das duas telas.' };
      } finally { await mount(); }
    }
    if (stage === 'success') {
      const message = app.MENSAGEM_SUCESSO?.trim();
      if (typeof message !== 'string' || message.length < 12 || message === 'Memória registrada nesta sessão.')
        return { ok: false, detail: 'Personalize MENSAGEM_SUCESSO mantendo uma confirmação clara.' };
      try {
        await mount();
        for (const root of [web, mobile]) {
          await typeText(root, 'Memória de teste'); await press(root);
          if (testId(root, 'mensagem-sucesso')?.textContent.trim() !== message) {
            return { ok: false, detail: 'O texto de sucesso precisa surgir nas duas interfaces após registro válido.' };
          }
        }
        return { ok: true, detail: 'Feedback de sucesso atualizado e testado nas duas telas.' };
      } finally { await mount(); }
    }
    if (stage === 'color') {
      if (app.COR_BOTAO !== '#1f4f83') return { ok: false, detail: 'Experimente COR_BOTAO = "#1f4f83" (azul de contraste adequado).' };
      const ok = [web, mobile].every(root => {
        const element = testId(root, 'botao-registrar');
        return element && /rgb\(31,\s*79,\s*131\)/.test(getComputedStyle(element).backgroundColor);
      });
      return { ok, detail: ok ? 'A cor nova chegou aos dois botões.' : 'Garanta que styles.botao usa backgroundColor: COR_BOTAO.' };
    }
    if (stage === 'trim') {
      try {
        await mount();
        await typeText(web, '  Memória  coletiva  '); await press(web);
        const ok = count(web) === '1' &&
          testId(web, 'ultima-memoria')?.textContent.trim() === 'Memória  coletiva' &&
          count(mobile) === '0';
        return { ok, detail: ok ? 'Espaços externos removidos, internos preservados.' : 'Use resultado.texto ao registrar; mantenha os espaços entre palavras.' };
      } finally { await mount(); }
    }
    if (stage === 'invalid') {
      try {
        await mount();
        await typeText(web, '        '); await press(web);
        const space = count(web) === '0' && !!testId(web, 'erro-titulo');
        await typeText(web, 'abc'); await press(web);
        const short = count(web) === '0' && !!testId(web, 'erro-titulo') && !testId(web, 'mensagem-sucesso');
        await typeText(web, 'Memória válida');
        const cleared = !testId(web, 'erro-titulo');
        return { ok: !!(space && short && cleared), detail: space && short && cleared ?
          'Espaços e título curto bloqueados; erro antigo apagado ao corrigir.' :
          'Verifique bloqueio de entradas inválidas e remoção do erro ao digitar.' };
      } finally { await mount(); }
    }
    if (stage === 'isolation') {
      try {
        await mount();
        await typeText(web, 'Primeira memória'); await press(web);
        if (count(web) !== '1' || count(mobile) !== '0')
          return { ok: false, detail: 'Registrar na Web não deve incrementar o móvel.' };
        await typeText(mobile, 'Segunda memória'); await press(mobile);
        const ok = count(web) === '1' && count(mobile) === '1' &&
          testId(web, 'ultima-memoria')?.textContent.trim() === 'Primeira memória' &&
          testId(mobile, 'ultima-memoria')?.textContent.trim() === 'Segunda memória';
        return { ok, detail: ok ? 'Mesmo código, duas instâncias independentes; nenhuma sincronização automática.' :
          'Contadores e última memória devem permanecer distintos nas duas instâncias.' };
      } finally { await mount(); }
    }
    throw Error('Exercício de código desconhecido.');
  }
  // Mesmos 12 testes comportamentais usados por "Conferir missão".
  // CHECK_ALL apenas os executa em sequência: NÃO concede XP por si só;
  // a página principal só credita cada sucesso efetivamente confirmado.
  const codeStages = Object.freeze([
    'run','title','placeholder','limit','maximum','button',
    'error','success','color','trim','invalid','isolation'
  ]);
  window.addEventListener('message', async (event) => {
    if (event.source !== sender) return;
    const msg = event.data;
    if (!msg || msg.from !== 'ifma-aula05-host' || typeof msg.token !== 'string' || msg.token.length > 100 ||
        !Number.isSafeInteger(msg.revision) || msg.revision < 0 ||
        !Number.isSafeInteger(msg.runId) || msg.runId < 1) return;
    token = msg.token;
    const id = ++generation;
    const version = { revision: msg.revision, runId: msg.runId };
    try {
      if (msg.type === 'RUN') {
        app = null;
        detachRoots();
        app = compile(msg.source);
        await mount();
        if (id === generation) post('COMPILED', { ok: true, ...version });
      } else if (msg.type === 'CHECK') {
        if (!codeStages.includes(msg.stage)) throw Error('Missão técnica desconhecida.');
        const result = await check(msg.stage);
        if (id === generation) post('CHECKED', { stage: msg.stage, ...result, ...version });
      } else if (msg.type === 'CHECK_ALL') {
        if (!Array.isArray(msg.stages) || msg.stages.length !== codeStages.length ||
            new Set(msg.stages).size !== codeStages.length ||
            msg.stages.some(stage => !codeStages.includes(stage)))
          throw Error('Lista de missões técnicas incompatível.');
        const results = [];
        for (const stage of msg.stages) {
          if (id !== generation) return; // Uma nova compilação cancelou a revisão.
          try {
            const result = await check(stage);
            results.push({ stage, ok: result.ok === true, detail: String(result.detail || '').slice(0,450) });
          } catch(error) {
            results.push({ stage, ok: false, detail: String(error?.message || error).slice(0,450) });
          }
        }
        if (id === generation) post('CHECKED_ALL', { results, ...version });
      }
    } catch (error) {
      if (id !== generation) return;
      const type = msg.type === 'CHECK_ALL' ? 'CHECKED_ALL' :
        msg.type === 'CHECK' ? 'CHECKED' : 'COMPILED';
      post(type, { stage: msg.stage, ok: false, ...version,
        detail: String(error?.message || error).slice(0,450) });
    }
  });
  post('READY');
})();
