/* IFMA Aula 05: editor, preview isolado e avaliação formativa transparente. */
(() => {
  'use strict';
  const tasks = [
    { id: 'run', xp: 10, name: 'Executar e observar' },
    { id: 'limit', xp: 25, name: 'Mudar uma regra' },
    { id: 'button', xp: 20, name: 'Um texto, duas telas' },
    { id: 'behavior', xp: 25, name: 'Teste como desenvolvedor' },
    { id: 'quiz', xp: 20, name: 'Explique o que aconteceu' },
  ];
  const key = 'ifma-web-aula05-lab-v1';
  const codeEditor = document.getElementById('code');
  const frame = document.getElementById('preview');
  const compileStatus = document.getElementById('compiler-status');
  const fileContext = document.getElementById('editor-context');
  const readOnly = document.getElementById('readonly-code');
  const panels = { shared: '', route: `/** app/lab05.tsx — ROTA COMPLETA (exemplo para Expo Router)\n * Copie o componente para shared/ e mantenha suas rotas anteriores.\n */\nimport ProjetoUniversal from '../shared/ProjetoUniversal';\n\nexport default function Lab05() {\n  return <ProjetoUniversal />;\n}\n`, vue: `<!-- Ponte com a Aula 4: exemplo Vue didático, completo.\n     Este arquivo NÃO se converte automaticamente em React. -->\n<script setup>\nimport { ref } from 'vue'\nconst titulo = ref('')\nconst total = ref(0)\nconst erro = ref('')\nfunction registrar() {\n  const texto = titulo.value.trim()\n  if (texto.length < 5) {\n    erro.value = 'Informe pelo menos 5 caracteres.'\n    return\n  }\n  total.value += 1\n  erro.value = ''\n  titulo.value = ''\n}\n</script>\n\n<template>\n  <section>\n    <label for="titulo">Título da memória</label>\n    <input id="titulo" v-model="titulo" />\n    <p v-if="erro" role="alert">{{ erro }}</p>\n    <button @click="registrar">Registrar memória</button>\n    <p>Registros: {{ total }}</p>\n  </section>\n</template>\n` };
  let activeFile = 'shared';
  let ready = false, sourceLoaded = false, lastCompiled = false, pending = null;
  const nonce = 'lesson05-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  const passed = Object.fromEntries(tasks.map(t => [t.id, false]));
  let completedDetail = {};

  const byId = id => document.getElementById(id);
  function setStatus(message, error = false) {
    compileStatus.textContent = message;
    compileStatus.classList.toggle('error', error);
  }
  function getScore() { return tasks.reduce((sum, t) => sum + (passed[t.id] ? t.xp : 0), 0); }
  function render() {
    const score = getScore();
    byId('xp-top').textContent = String(score);
    byId('xp-evidence').textContent = String(score);
    byId('progress-fill').style.width = score + '%';
    byId('progress').setAttribute('aria-valuenow', String(score));
    const done = tasks.filter(t => passed[t.id]).length;
    byId('score-summary').textContent = `${done} de 5 missões concluídas · pontuação formativa, não nota oficial`;
    byId('evidence-count').textContent = `${done} ${done === 1 ? 'missão concluída' : 'missões concluídas'} · ${5 - done} pendentes`;
    for (const t of tasks) {
      const card = document.querySelector(`[data-mission="${t.id}"]`);
      const fb = document.querySelector(`[data-feedback="${t.id}"]`);
      card.classList.toggle('passed', passed[t.id]);
      if (passed[t.id]) {
        fb.className = 'challenge-feedback success';
        fb.textContent = `✓ Concluído · +${t.xp} XP · ${completedDetail[t.id] || 'Verificação aprovada.'}`;
      } else if (!fb.classList.contains('failed')) {
        fb.className = 'challenge-feedback';
        fb.textContent = 'Pendente · 0 XP';
      }
    }
    const ul = byId('evidence-list');
    ul.replaceChildren();
    for (const t of tasks) {
      const li = document.createElement('li');
      li.textContent = `${passed[t.id] ? '✓' : '○'} ${t.name}: ${passed[t.id] ? t.xp + ' XP' : 'pendente'}`;
      ul.appendChild(li);
    }
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ code: panels.shared, passed, completedDetail,
        note: byId('observacao').value, nativeNote: byId('limite-real').value,
        q1: document.querySelector('input[name="q1"]:checked')?.value || '',
        q2: document.querySelector('input[name="q2"]:checked')?.value || '' }));
    } catch { /* armazenamento opcional indisponível */ }
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* sem rascunho */ }
  if (saved && typeof saved === 'object') {
    if (typeof saved.note === 'string') byId('observacao').value = saved.note;
    if (typeof saved.nativeNote === 'string') byId('limite-real').value = saved.nativeNote;
    if (typeof saved.q1 === 'string' && saved.q1) {
      const q = document.querySelector(`input[name="q1"][value="${saved.q1}"]`);
      if (q) q.checked = true;
    }
    if (typeof saved.q2 === 'string' && saved.q2) {
      const q = document.querySelector(`input[name="q2"][value="${saved.q2}"]`);
      if (q) q.checked = true;
    }
    // Após recarregar, código precisa ser recompilado e testado: não reutilizamos XP de execução.
    if (saved.passed?.quiz === true) passed.quiz = true;
    if (typeof saved.completedDetail?.quiz === 'string') completedDetail.quiz = saved.completedDetail.quiz;
  }
  render();

  async function loadSource() {
    try {
      const response = await fetch('./shared/ProjetoUniversal.tsx', { cache: 'no-store' });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const initial = await response.text();
      panels.shared = (typeof saved?.code === 'string' && saved.code.length < 30000) ? saved.code : initial;
      window.__IFMA_LAB_INITIAL__ = initial;
      codeEditor.value = panels.shared;
      sourceLoaded = true;
      setStatus('Arquivo completo carregado. Inicializando as duas prévias…');
      if (ready) run();
    } catch (err) { setStatus(`Não foi possível ler o arquivo: ${err.message}. Abra esta aula via HTTP/HTTPS (não file://).`, true); }
  }
  function send(type, fields = {}) {
    if (!ready || !sourceLoaded || !frame.contentWindow) { setStatus('Prévia ou código ainda indisponível.', true); return false; }
    frame.contentWindow.postMessage({ from: 'ifma-aula05-host', type, token: nonce, ...fields }, '*');
    return true;
  }
  function invalidateCodeTasks() {
    for (const t of tasks.filter(x => x.id !== 'quiz')) {
      passed[t.id] = false;
      delete completedDetail[t.id];
      const fb = document.querySelector(`[data-feedback="${t.id}"]`);
      fb.className = 'challenge-feedback';
    }
    lastCompiled = false;
    render();
  }
  function run() {
    if (activeFile !== 'shared') showFile('shared');
    panels.shared = codeEditor.value;
    lastCompiled = false;
    invalidateCodeTasks();
    if (send('RUN', { source: panels.shared })) setStatus('Compilando TSX… Atualizando as duas interfaces.');
    save();
  }
  byId('run').addEventListener('click', run);
  byId('reset').addEventListener('click', () => {
    if (!window.__IFMA_LAB_INITIAL__) return;
    const permitted = confirm('Restaurar o exemplo original? Seu código editado será substituído, mas as observações continuam.');
    if (!permitted) return;
    panels.shared = window.__IFMA_LAB_INITIAL__;
    codeEditor.value = panels.shared;
    run();
  });
  codeEditor.addEventListener('input', () => { panels.shared = codeEditor.value; invalidateCodeTasks(); save(); setStatus('Código alterado. Clique em “Executar nas duas telas” para atualizar.', false); });
  function showFile(which) {
    activeFile = which;
    document.querySelectorAll('[data-file]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.file === which)));
    byId('editor-source').setAttribute('aria-labelledby', 'tab-' + which);
    codeEditor.hidden = which !== 'shared';
    readOnly.hidden = which === 'shared';
    if (which !== 'shared') readOnly.textContent = panels[which];
    fileContext.textContent = which === 'shared' ? 'Arquivo completo e editável · executar recompila este mesmo TSX nos dois painéis.' :
      which === 'route' ? 'Rota completa de integração Expo Router · leitura apenas; não apaga suas rotas existentes.' :
      'Exemplo Vue completo e independente · compare o modelo de estado, sem conversão automática.';
  }
  document.querySelectorAll('[data-file]').forEach(button => button.addEventListener('click', () => showFile(button.dataset.file)));
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || d.from !== 'ifma-aula05') return;
    if (d.type === 'READY') { ready = true; if (sourceLoaded) run(); return; }
    if (d.token !== nonce) return;
    if (d.type === 'COMPILED') {
      lastCompiled = !!d.ok;
      setStatus(d.ok ? '✓ Executado. As duas prévias usam a mesma fonte React Native Web; cada uma mantém seu estado.' : `Erro de compilação/execução: ${d.detail || 'verifique o código.'}`, !d.ok);
    } else if (d.type === 'CHECKED' && d.stage === pending) {
      const stage = pending; pending = null;
      enableChecks();
      passed[stage] = !!d.ok;
      if (d.ok) completedDetail[stage] = d.detail;
      else delete completedDetail[stage];
      const feedback = document.querySelector(`[data-feedback="${stage}"]`);
      feedback.className = `challenge-feedback ${d.ok ? 'success' : 'failed'}`;
      feedback.textContent = d.ok ? `✓ Aprovado: ${d.detail}` : `Revisar: ${d.detail}`;
      render(); save();
    }
  });
  function enableChecks() { document.querySelectorAll('[data-check]').forEach(b => b.disabled = false); }
  document.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => {
    const stage = button.dataset.check;
    if (!lastCompiled || !ready) {
      const fb = document.querySelector(`[data-feedback="${stage}"]`);
      fb.className = 'challenge-feedback failed';
      fb.textContent = 'Execute o arquivo atualizado antes de conferir esta missão.';
      return;
    }
    if (pending !== null) return;
    pending = stage;
    document.querySelectorAll('[data-check]').forEach(b => b.disabled = true);
    const feedback = document.querySelector(`[data-feedback="${stage}"]`);
    feedback.className = 'challenge-feedback';
    feedback.textContent = 'Executando teste de comportamento no sandbox…';
    if (!send('CHECK', { stage })) { pending = null; enableChecks(); }
  }));
  document.querySelectorAll('input[name="q1"],input[name="q2"]').forEach(input => input.addEventListener('change', () => {
    passed.quiz = false;
    delete completedDetail.quiz;
    document.querySelector('[data-feedback="quiz"]').className = 'challenge-feedback';
    render(); save();
  }));
  byId('check-quiz').addEventListener('click', () => {
    const q1 = document.querySelector('input[name="q1"]:checked')?.value;
    const q2 = document.querySelector('input[name="q2"]:checked')?.value;
    const feedback = document.querySelector('[data-feedback="quiz"]');
    if (!q1 || !q2) { feedback.className = 'challenge-feedback'; feedback.textContent = 'Questões em branco são permitidas; complete ambas para conferir.'; return; }
    const ok = q1 === 'a' && q2 === 'b';
    passed.quiz = ok;
    if (ok) completedDetail.quiz = 'RNW representa na Web; Expo executa no dispositivo real.';
    else delete completedDetail.quiz;
    feedback.className = `challenge-feedback ${ok ? 'success' : 'failed'}`;
    feedback.textContent = ok ? '✓ Correto: prévia responsiva não equivale a dispositivo nativo.' : 'Revise a diferença entre prévia no navegador e execução Expo no Android/iOS.';
    render(); save();
  });
  byId('observacao').addEventListener('input', save);
  byId('limite-real').addEventListener('input', save);

  function evidence() {
    const now = new Date().toISOString();
    return { schema: 'ifma-web-aula05-lab-v1', geradoEm: now, atividade: 'Aula 05 — Laboratório Web e Mobile', tipo: 'formativo-nao-e-nota', xp: getScore(), maximoXp: 100,
      missoes: tasks.map(t => ({ id: t.id, titulo: t.name, xp: passed[t.id] ? t.xp : 0, estado: passed[t.id] ? 'APROVADO' : 'PENDENTE', comentario: completedDetail[t.id] || null })),
      observacao: byId('observacao').value, testeNativoPendente: byId('limite-real').value, codigoFonteCompleto: panels.shared,
      ressalvas: ['Prévia móvel renderizada por React Native Web no navegador; não é um emulador Android/iOS.', 'Não há envio automático nem nota oficial.', 'Testes não substituem revisão humana.'] };
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('evidence-status').textContent = `Arquivo ${name} preparado para salvar.`;
  }
  byId('download-code').addEventListener('click', () => download('ProjetoUniversal.tsx', panels.shared, 'text/plain;charset=utf-8'));
  byId('export-json').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia.json', JSON.stringify(evidence(), null, 2), 'application/json;charset=utf-8'));
  function reportText() {
    const d = evidence();
    const lines = [`# Aula 05 — Laboratório Web ↔ Mobile`, '', `Emitido: ${d.geradoEm}`, `Pontuação formativa: **${d.xp}/100 XP** (não é nota oficial).`, '', '## Missões'];
    for (const m of d.missoes) lines.push(`- ${m.estado}: ${m.titulo} — ${m.xp} XP${m.comentario ? ' — '+m.comentario : ''}`);
    lines.push('', '## Observação', d.observacao || '(não preenchida)', '', '## Teste no dispositivo real', d.testeNativoPendente || '(não preenchido)', '', '## Limitações', ...d.ressalvas.map(t => '- ' + t), '', '## Código entregue (versão atual)', '```tsx', d.codigoFonteCompleto, '```', '');
    return lines.join('\n');
  }
  byId('export-md').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia.md', reportText(), 'text/markdown;charset=utf-8'));
  byId('print').addEventListener('click', () => {
    const summary = reportText().split('## Código entregue (versão atual)')[0];
    byId('print-report').textContent = summary;
    window.print();
  });
  loadSource();
})();
