/**
 * AULA 05 | Guia de missões e observação das duas prévias.
 * O código editado roda exclusivamente no iframe de origem opaca (preview.js).
 * Este arquivo organiza a aula e recebe os resultados dos testes comportamentais;
 * não interpreta manualmente o código do aluno nem atribui nota oficial.
 */
(() => {
  'use strict';

  // Cada tarefa informa: o que fazer, onde localizar, o que observar e como verificar.
  // Isso evita o antigo problema de desafios separados do arquivo completo.
  const tasks = [
    { id: 'run', xp: 5, name: 'Primeiro contato: execute o projeto', phase: 1, minutes: 4,
      focus: '// [06] INTERFACE', type: 'code',
      do: 'Clique em Executar nas duas telas. Digite um título curto e depois um válido em cada interface.',
      observe: 'O mesmo componente aparece duas vezes, mas cada instância mantém seu próprio contador.',
      why: 'Primeiro vemos o sistema completo funcionando; somente depois alteramos suas peças.',
      hint: 'Não edite código ainda. Procure a seção [06], que transforma o estado em interface.' },
    { id: 'map', xp: 5, name: 'Encontre o caminho do estado', phase: 1, minutes: 5,
      focus: '// [04] COMPONENTE', type: 'quiz',
      do: 'Leia os comentários [04], [05] e [06]. Responda quais linhas guardam o título e reagem à digitação.',
      observe: 'Campo → onChangeText → setTitulo → estado → JSX. Essa é a mesma ideia que usamos em Vue.',
      why: 'Encontrar o código antes de editá-lo impede que funções e propriedades pareçam fragmentos soltos.',
      hint: 'O par [titulo, setTitulo] vem de useState. A prop onChangeText chama setTitulo.' },
    { id: 'title', xp: 6, name: 'Dê identidade à aplicação', phase: 1, minutes: 6,
      focus: 'export const TITULO_APLICACAO', type: 'code',
      do: 'No bloco [02], substitua “Memórias do campus” por “Memórias do IFMA”. Execute novamente.',
      observe: 'O cabeçalho muda tanto no painel Web quanto no painel de largura móvel.',
      why: 'Uma constante no arquivo compartilhado controla uma mesma informação em duas interfaces.',
      hint: 'Procure TITULO_APLICACAO no bloco [02] e depois onde {TITULO_APLICACAO} aparece no [06].' },
    { id: 'placeholder', xp: 6, name: 'Oriente quem vai digitar', phase: 1, minutes: 6,
      focus: 'export const DICA_CAMPO', type: 'code',
      do: 'Troque a dica “Ex.: Feira de ciências” por outro exemplo realista fictício, como “Ex.: Biblioteca escolar”.',
      observe: 'A dica aparece dentro dos dois campos quando estão vazios.',
      why: 'A configuração no [02] chega à propriedade placeholder no JSX [06].',
      hint: 'A constante é DICA_CAMPO. Você pode procurar pelo nome no editor e localizar placeholder={DICA_CAMPO}.' },
    { id: 'limit', xp: 12, name: 'Valide o limite mínimo', phase: 2, minutes: 8,
      focus: 'export const MINIMO_CARACTERES', type: 'code',
      do: 'Altere MINIMO_CARACTERES de 5 para 7. Teste um título de 6 e depois outro de 7 caracteres.',
      observe: 'Seis deve produzir erro; sete deve permitir o registro. Espaços externos não contam.',
      why: 'É a mesma função validarTitulo que decide o resultado na Web e no Mobile.',
      hint: 'Modifique somente a constante. No [03], a condição texto.length < MINIMO_CARACTERES usa essa configuração.' },
    { id: 'maximum', xp: 10, name: 'Teste também o limite máximo', phase: 2, minutes: 8,
      focus: 'export const MAXIMO_CARACTERES', type: 'code',
      do: 'Altere MAXIMO_CARACTERES de 60 para 30. Faça testes com 30 e 31 caracteres.',
      observe: 'Trinta deve ser aceito; trinta e um devem mostrar o erro de tamanho máximo.',
      why: 'Agora você reconhece dois ramos if dentro de uma função completa.',
      hint: 'Observe no bloco [03] a segunda condição: texto.length > MAXIMO_CARACTERES.' },
    { id: 'button', xp: 7, name: 'Um botão, duas renderizações', phase: 2, minutes: 7,
      focus: 'export const TEXTO_BOTAO', type: 'code',
      do: 'Troque “Registrar memória” por “Salvar registro de memória” e execute.',
      observe: 'O texto do botão e seu rótulo acessível passam a usar o novo nome nas duas telas.',
      why: 'Configurações declaradas uma única vez podem ser usadas em vários lugares do mesmo componente.',
      hint: 'Além da constante no [02], procure TEXTO_BOTAO dentro do Pressable no [06].' },
    { id: 'error', xp: 7, name: 'Melhore a mensagem de erro', phase: 2, minutes: 7,
      focus: 'export const PREFIXO_ERRO', type: 'code',
      do: 'Substitua o prefixo “Informe pelo menos” por “Título curto: digite no mínimo”.',
      observe: 'Ao registrar poucos caracteres, ambas as telas exibem uma mensagem específica com o limite atual.',
      why: 'A regra [03] devolve o erro; a ação [05] e a interface [06] só o apresentam.',
      hint: 'A mensagem é montada no bloco [03] e renderizada onde aparece {erro} no [06].' },
    { id: 'success', xp: 7, name: 'Confirme a ação sem enganar o usuário', phase: 2, minutes: 7,
      focus: 'export const MENSAGEM_SUCESSO', type: 'code',
      do: 'Altere MENSAGEM_SUCESSO para “Registro validado nesta sessão.”; execute e envie um título válido.',
      observe: 'A confirmação aparece somente depois de registrar um título válido, nas duas telas.',
      why: 'Não existe backend nesta aula: o feedback não pode prometer envio ou armazenamento permanente.',
      hint: 'Veja em [05] quando setSucesso(MENSAGEM_SUCESSO) é chamado.' },
    { id: 'color', xp: 6, name: 'Visual compartilhado, contraste preservado', phase: 2, minutes: 7,
      focus: 'export const COR_BOTAO', type: 'code',
      do: 'Mude COR_BOTAO de “#096b44” para “#1f4f83” (azul escuro).',
      observe: 'Os botões mudam juntos e continuam legíveis com texto branco.',
      why: 'Um token de estilo no [02] é usado por StyleSheet.create no [07].',
      hint: 'Não altere cada botão separadamente: encontre backgroundColor: COR_BOTAO no bloco [07].' },
    { id: 'trim', xp: 8, name: 'Teste espaços sem alterar o programa', phase: 3, minutes: 8,
      focus: 'const texto = valor.trim()', type: 'code',
      do: 'Digite “  Memória  coletiva  ”, com dois espaços no início, entre as palavras e no fim.',
      observe: 'O resumo perde espaços externos, preserva os internos e incrementa apenas a Web.',
      why: 'Você está testando uma regra de negócio já implementada, não só olhando a sintaxe.',
      hint: 'Compare valor.trim() no [03] com setUltima(resultado.texto) no [05].' },
    { id: 'invalid', xp: 8, name: 'Depure uma entrada inválida', phase: 3, minutes: 10,
      focus: 'if (!resultado.valido)', type: 'code',
      do: 'Tente salvar apenas espaços, depois “abc”. Corrija o texto e observe quando o erro desaparece.',
      observe: 'Inválido não soma pontos ao contador; corrigir o campo remove o erro antigo.',
      why: 'O return no [05] impede que o código de sucesso execute depois da falha.',
      hint: 'Na ação registrar(), localize o return; na prop onChangeText, encontre setErro(\'\').' },
    { id: 'isolation', xp: 8, name: 'Descubra o que NÃO é compartilhado', phase: 3, minutes: 10,
      focus: 'const [total, setTotal]', type: 'code',
      do: 'Registre uma memória na Web e outra na prévia móvel. Compare os contadores e últimas memórias.',
      observe: 'O código é o mesmo, mas os estados das duas instâncias são independentes.',
      why: 'Compartilhar componentes NÃO sincroniza dados. Isso exigirá uma API comum futuramente.',
      hint: 'Veja o useState dentro do componente [04] e as duas instâncias renderizadas na prévia.' },
    { id: 'quiz', xp: 5, name: 'Explique a ponte Web → Mobile', phase: 3, minutes: 7,
      focus: '// [06] INTERFACE', type: 'quiz',
      do: 'Responda como o código TSX pode ser usado na Web e o que falta para testá-lo em um celular real.',
      observe: 'Prévia estreita no navegador não equivale a um emulador Android/iOS.',
      why: 'A tecnologia precisa ficar clara para não confundir código compartilhado com sincronização de dados.',
      hint: 'O navegador usa React Native Web. No aparelho real você precisa de um projeto Expo compatível.' },
  ];
  const phases = [
    { name: 'Ciclo 1 — Encontre o todo', objective: 'Explore o aplicativo e localize cada parte antes de editar.', time: '21 min', xp: 22 },
    { name: 'Ciclo 2 — Mude e compare', objective: 'Faça seis modificações no MESMO arquivo e observe o resultado.', time: '44 min', xp: 49 },
    { name: 'Ciclo 3 — Teste, explique e entregue', objective: 'Exercite as regras, identifique os limites e exporte evidências.', time: '35 min', xp: 29 },
  ];
  const TOTAL_XP = tasks.reduce((sum, task) => sum + task.xp, 0);
  const key = 'ifma-web-aula05-lab-v2'; // Guarda rascunho NOVO; não sobrescreve o v1.
  const byId = id => document.getElementById(id);
  const codeEditor = byId('code');
  const frame = byId('preview');
  const compilerStatus = byId('compiler-status');
  const fileContext = byId('editor-context');
  const readOnly = byId('readonly-code');

  // Mapa de arquivos reais: um editável e dois exemplos integrais somente leitura.
  const panels = { shared: '', route: `/** ROTA COMPLETA: app/lab05.tsx (Expo Router)
 * Esta rota só importa o componente. NÃO substitui outras telas.
 * O componente comum continua em shared/ProjetoUniversal.tsx.
 */
import ProjetoUniversal from '../shared/ProjetoUniversal';

export default function Lab05() {
  // A mesma rota pode ser acessada na Web e em Expo nativo.
  return <ProjetoUniversal />;
}
`, vue: `<!-- ARQUIVO VUE COMPLETO: exemplo equivalente (Aula 04)
     Um componente Vue não se converte automaticamente em React.
     Observe a correspondência entre ref/v-model e useState/onChangeText. -->
<script setup>
import { ref } from 'vue'

const titulo = ref('')    // No React: const [titulo, setTitulo] = useState('')
const total = ref(0)
const erro = ref('')

function registrar() {
  const texto = titulo.value.trim()
  if (texto.length < 5) {
    erro.value = 'Informe pelo menos 5 caracteres.'
    return
  }
  total.value += 1
  erro.value = ''
  titulo.value = ''
}
</script>

<template>
  <section>
    <label for="titulo">Título da memória</label>
    <input id="titulo" v-model="titulo" />
    <p v-if="erro" role="alert">{{ erro }}</p>
    <button type="button" @click="registrar">Registrar memória</button>
    <p>Registros: {{ total }}</p>
  </section>
</template>
` };

  let activeFile = 'shared';
  let activeIndex = 0;
  let ready = false, sourceLoaded = false, lastCompiled = false, pending = null;
  const nonce = 'aula05-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  const passed = Object.fromEntries(tasks.map(task => [task.id, false]));
  const completedDetail = {};

  function setStatus(message, error = false) {
    compilerStatus.textContent = message;
    compilerStatus.classList.toggle('error', error);
  }
  function getScore() { return tasks.reduce((sum, t) => sum + (passed[t.id] ? t.xp : 0), 0); }

  // Monta 14 cartões agrupados por roteiro (sem duplicar texto entre UI e lógica).
  function makeQuiz(id) {
    const sets = {
      map: [
        ['Qual recurso React guarda o texto durante a digitação?', [
          ['a', 'useState e seu par [valor, setValor]'],
          ['b', 'StyleSheet.create'],
          ['c', 'Uma variável global fora do componente'],
        ]],
        ['Qual propriedade chama setTitulo quando o usuário digita?', [
          ['a', 'backgroundColor'], ['b', 'onChangeText'], ['c', 'accessibilityLabel'],
        ]],
      ],
      quiz: [
        ['Por que um único TSX aparece nas duas prévias?', [
          ['a', 'React Native Web renderiza componentes compatíveis no navegador.'],
          ['b', 'O navegador se torna um Android real.'],
          ['c', 'Vue converte automaticamente para React.'],
        ]],
        ['Como executar o mesmo componente em um celular de verdade?', [
          ['a', 'Somente estreitando a janela do navegador.'],
          ['b', 'Integrando o arquivo a um projeto React Native/Expo compatível.'],
          ['c', 'Apagando todas as aulas anteriores.'],
        ]],
      ],
    };
    const fragment = document.createDocumentFragment();
    for (const [i, [question, options]] of sets[id].entries()) {
      const field = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = question;
      field.appendChild(legend);
      const name = id + '-q' + (i + 1);
      for (const [value, label] of options) {
        const choice = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = name; radio.value = value;
        choice.append(radio, document.createTextNode(' ' + label));
        field.appendChild(choice);
      }
      fragment.appendChild(field);
    }
    return fragment;
  }
  function makeCard(task, index) {
    const card = document.createElement('article');
    card.className = 'challenge-card'; card.dataset.mission = task.id;
    card.innerHTML = `<div class="challenge-header"><span class="mission-number">${String(index + 1).padStart(2, '0')}</span><span class="reward">+${task.xp} XP</span></div>`;
    const title = document.createElement('h4'); title.textContent = task.name;
    const action = document.createElement('p'); action.className = 'task-description'; action.textContent = task.do;
    const observe = document.createElement('p'); observe.className = 'task-observe';
    const strong = document.createElement('strong'); strong.textContent = 'Observe: ';
    observe.append(strong, document.createTextNode(task.observe));
    const tags = document.createElement('p'); tags.className = 'task-meta';
    tags.textContent = `${index >= 8 ? 'APROFUNDAMENTO OPCIONAL · ' : 'ROTEIRO ESSENCIAL · '}${task.minutes} min · ${task.type === 'quiz' ? 'reflexão' : 'execução'}`;
    const details = document.createElement('details'); details.className = 'task-hint';
    const summary = document.createElement('summary'); summary.textContent = 'Preciso de uma pista';
    const hint = document.createElement('p'); hint.textContent = task.hint;
    details.append(summary, hint);
    const actions = document.createElement('div'); actions.className = 'task-actions';
    const open = document.createElement('button'); open.type = 'button';
    open.className = 'action secondary task-open'; open.dataset.open = task.id;
    open.textContent = 'Abrir no editor';
    const check = document.createElement('button'); check.type = 'button';
    check.className = 'action challenge-action'; check.dataset.check = task.id;
    check.textContent = task.type === 'quiz' ? 'Conferir respostas' : 'Executar teste';
    actions.append(open, check);
    if (task.type === 'quiz') card.classList.add('quiz-card');
    card.append(title, tags, action, observe);
    if (task.type === 'quiz') card.appendChild(makeQuiz(task.id));
    card.append(details, actions);
    const feedback = document.createElement('p');
    feedback.className = 'challenge-feedback'; feedback.dataset.feedback = task.id;
    feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
    feedback.textContent = 'Pendente · 0 XP';
    card.appendChild(feedback);
    return card;
  }
  function createCards() {
    phases.forEach((phase, i) => {
      const section = document.createElement('section');
      section.className = 'chapter'; section.dataset.chapter = String(i + 1);
      const title = document.createElement('h3'); title.textContent = phase.name;
      const description = document.createElement('p'); description.className = 'chapter-description';
      description.textContent = `${phase.objective} · ${phase.time} · até ${phase.xp} XP`;
      const grid = document.createElement('div'); grid.className = 'challenge-grid';
      tasks.forEach((task, index) => { if (task.phase === i + 1) grid.appendChild(makeCard(task, index)); });
      section.append(title, description, grid);
      byId('chapter-list').appendChild(section);
    });
  }
  createCards();

  // O guia permanece junto do editor: um único local para LER, EDITAR e TESTAR.
  function updateGuide() {
    const task = tasks[activeIndex];
    byId('guide-number').textContent = `EXERCÍCIO ${String(activeIndex + 1).padStart(2, '0')} / ${tasks.length} · CICLO ${task.phase} · ${activeIndex < 8 ? 'ESSENCIAL' : 'OPCIONAL'}`;
    byId('guide-title').textContent = task.name;
    byId('guide-do').textContent = task.do;
    byId('guide-observe').textContent = task.observe;
    byId('guide-why').textContent = task.why;
    byId('guide-hint').textContent = task.hint;
    byId('guide-hint-box').open = false;
    byId('guide-time').textContent = `${task.minutes} min · ${task.xp} XP`;
    byId('guide-prev').disabled = activeIndex === 0;
    byId('guide-next').disabled = activeIndex === tasks.length - 1;
    byId('guide-check').textContent = task.type === 'quiz' ? 'Ir às perguntas da missão' : 'Testar esta missão';
    byId('guide-feedback').textContent = passed[task.id] ? `✓ Concluída · +${task.xp} XP` : 'Pendente · você pode continuar sem concluir';
    byId('guide-feedback').className = 'guide-feedback' + (passed[task.id] ? ' success' : '');
    document.querySelectorAll('.challenge-card').forEach(card => {
      card.classList.toggle('current', card.dataset.mission === task.id);
    });
  }
  function setActive(target, scroll = false) {
    const n = typeof target === 'number' ? target : tasks.findIndex(task => task.id === target);
    if (n < 0 || n >= tasks.length) return;
    activeIndex = n; updateGuide();
    if (scroll) byId('laboratorio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function locate() {
    const task = tasks[activeIndex];
    showFile('shared');
    const pos = panels.shared.indexOf(task.focus);
    if (pos < 0) { byId('guide-feedback').textContent = 'Trecho não encontrado. Verifique se a declaração original foi renomeada.'; return; }
    const linesBefore = panels.shared.slice(0, pos).split('\n').length;
    const height = Number.parseFloat(getComputedStyle(codeEditor).lineHeight) || 21;
    codeEditor.focus({ preventScroll: true });
    codeEditor.setSelectionRange(pos, pos + task.focus.length);
    codeEditor.scrollTop = Math.max(0, (linesBefore - 6) * height);
    byId('editor-source').scrollIntoView({ behavior: 'smooth', block: 'center' });
    byId('guide-line').textContent = `Arquivo shared/ProjetoUniversal.tsx · aproximadamente linha ${linesBefore} (posição atual)`;
  }

  function render() {
    const score = getScore();
    byId('xp-top').textContent = String(score);
    byId('xp-evidence').textContent = String(score);
    byId('progress-fill').style.width = score + '%';
    byId('progress').setAttribute('aria-valuenow', String(score));
    const done = tasks.filter(t => passed[t.id]).length;
    byId('score-summary').textContent = `${done} de ${tasks.length} exercícios concluídos · XP formativos, não nota oficial`;
    byId('evidence-count').textContent = `${done} exercícios concluídos · ${tasks.length - done} pendentes`;
    tasks.forEach(task => {
      const card = document.querySelector(`[data-mission="${task.id}"]`);
      const feedback = document.querySelector(`[data-feedback="${task.id}"]`);
      card.classList.toggle('passed', passed[task.id]);
      if (passed[task.id]) {
        feedback.className = 'challenge-feedback success';
        feedback.textContent = `✓ Concluído · +${task.xp} XP · ${completedDetail[task.id] || 'Verificação aprovada.'}`;
      } else if (!feedback.classList.contains('failed')) {
        feedback.className = 'challenge-feedback'; feedback.textContent = 'Pendente · 0 XP';
      }
    });
    const list = byId('evidence-list'); list.replaceChildren();
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.textContent = `${passed[task.id] ? '✓' : '○'} ${task.name}: ${passed[task.id] ? task.xp + ' XP' : 'pendente'}`;
      list.appendChild(li);
    });
    updateGuide();
  }
  function readAnswers() {
    const values = {};
    document.querySelectorAll('input[type="radio"]').forEach(input => {
      if (input.checked) values[input.name] = input.value;
    });
    return values;
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ code: panels.shared, answers: readAnswers(),
        note: byId('observacao').value, nativeNote: byId('limite-real').value }));
    } catch { /* disponibilidade de armazenamento é opcional */ }
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* rascunho inválido */ }
  if (saved && typeof saved === 'object') {
    if (typeof saved.note === 'string') byId('observacao').value = saved.note;
    if (typeof saved.nativeNote === 'string') byId('limite-real').value = saved.nativeNote;
    if (saved.answers && typeof saved.answers === 'object') {
      document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = saved.answers[input.name] === input.value;
      });
    }
  }
  // A versão anterior continua intacta no navegador. Exportação opcional.
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem('ifma-web-aula05-lab-v1') || 'null'); } catch { /* sem dados */ }
  if (typeof legacy?.code === 'string' && legacy.code.length < 30000) {
    byId('legacy-export').hidden = false;
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
      setStatus('Arquivo inteiro carregado. Preparando Web e prévia móvel…');
      if (ready) run();
    } catch (error) { setStatus(`Falha ao carregar o arquivo: ${error.message}. Abra via HTTP/HTTPS, não file://.`, true); }
  }
  function send(type, fields = {}) {
    if (!ready || !sourceLoaded || !frame.contentWindow) { setStatus('Código ou prévia indisponível.', true); return false; }
    frame.contentWindow.postMessage({ from: 'ifma-aula05-host', type, token: nonce, ...fields }, '*');
    return true;
  }
  function enableChecks() { document.querySelectorAll('[data-check]').forEach(button => button.disabled = false); }
  function invalidateCodeTasks() {
    for (const task of tasks) {
      // Entendimento conceitual não expira por editar uma variável; testes reais, sim.
      if (task.type === 'quiz') continue;
      passed[task.id] = false;
      delete completedDetail[task.id];
      document.querySelector(`[data-feedback="${task.id}"]`).className = 'challenge-feedback';
    }
    lastCompiled = false;
    render();
  }
  function run() {
    if (!sourceLoaded) return;
    if (activeFile !== 'shared') showFile('shared');
    panels.shared = codeEditor.value;
    // Evita atribuir XP de uma verificação anterior a uma compilação nova.
    pending = null; enableChecks();
    invalidateCodeTasks();
    if (send('RUN', { source: panels.shared })) setStatus('Compilando o arquivo TSX inteiro…');
    save();
  }
  function showFile(which) {
    activeFile = which;
    document.querySelectorAll('[data-file]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.file === which)));
    byId('editor-source').setAttribute('aria-labelledby', 'tab-' + which);
    codeEditor.hidden = which !== 'shared';
    readOnly.hidden = which === 'shared';
    if (which !== 'shared') readOnly.textContent = panels[which];
    fileContext.textContent = which === 'shared' ? 'Arquivo completo e editável · [01] importações até [07] estilos.' :
      which === 'route' ? 'Rota Expo Router completa; demonstra onde o componente é importado.' :
      'Exemplo Vue completo e independente para comparar o mesmo raciocínio.';
  }

  function checkQuiz(id) {
    const wanted = id === 'map' ? ['a', 'b'] : ['a', 'b'];
    const names = [id + '-q1', id + '-q2'];
    const selected = names.map(name => document.querySelector(`input[name="${name}"]:checked`)?.value || '');
    const feedback = document.querySelector(`[data-feedback="${id}"]`);
    if (selected.some(value => !value)) {
      feedback.className = 'challenge-feedback';
      feedback.textContent = 'Você pode deixar em branco. Para ganhar XP, responda às duas perguntas.';
      return;
    }
    const ok = selected.every((value, i) => value === wanted[i]);
    passed[id] = ok;
    if (ok) completedDetail[id] = id === 'map' ? 'useState armazena; onChangeText atualiza.' :
      'RNWeb renderiza na Web; Expo permite execução nativa.';
    else delete completedDetail[id];
    feedback.className = 'challenge-feedback' + (ok ? ' success' : ' failed');
    feedback.textContent = ok ? '✓ Correto: você identificou a relação entre código e resultado.' :
      id === 'map' ? 'Procure a seção [04] e a propriedade onChangeText na seção [06].' :
        'Uma prévia de largura móvel não é execução Android/iOS. Consulte o mapa de arquivos.';
    render(); save();
  }
  function checkTask(id) {
    const task = tasks.find(x => x.id === id);
    if (!task) return;
    if (task.type === 'quiz') { checkQuiz(id); return; }
    const feedback = document.querySelector(`[data-feedback="${id}"]`);
    if (!ready || !lastCompiled) {
      feedback.className = 'challenge-feedback failed';
      feedback.textContent = 'Execute o arquivo atualizado antes de testar esta missão.';
      if (tasks[activeIndex].id === id) byId('guide-feedback').textContent = feedback.textContent;
      return;
    }
    if (pending !== null) return;
    pending = id;
    document.querySelectorAll('[data-check]').forEach(button => button.disabled = true);
    feedback.className = 'challenge-feedback';
    feedback.textContent = 'Testando a aplicação executada nas duas prévias…';
    byId('guide-feedback').textContent = feedback.textContent;
    if (!send('CHECK', { stage: id })) { pending = null; enableChecks(); }
  }

  byId('run').addEventListener('click', run);
  byId('reset').addEventListener('click', () => {
    if (!window.__IFMA_LAB_INITIAL__) return;
    if (!confirm('Restaurar o exemplo completo? As alterações locais do editor serão substituídas.')) return;
    panels.shared = window.__IFMA_LAB_INITIAL__;
    codeEditor.value = panels.shared;
    run();
  });
  codeEditor.addEventListener('input', () => {
    panels.shared = codeEditor.value;
    invalidateCodeTasks(); save();
    setStatus('Código alterado. Clique em Executar nas duas telas para conferir.');
  });
  document.querySelectorAll('[data-file]').forEach(button => button.addEventListener('click', () => showFile(button.dataset.file)));
  byId('guide-prev').addEventListener('click', () => setActive(activeIndex - 1));
  byId('guide-next').addEventListener('click', () => setActive(activeIndex + 1));
  byId('guide-locate').addEventListener('click', locate);
  byId('guide-check').addEventListener('click', () => {
    const t = tasks[activeIndex];
    if (t.type === 'quiz') {
      document.querySelector(`[data-mission="${t.id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else checkTask(t.id);
  });
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    setActive(button.dataset.open, true);
  }));
  document.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => checkTask(button.dataset.check)));
  document.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', () => {
    const id = input.name.startsWith('map-') ? 'map' : 'quiz';
    passed[id] = false;
    delete completedDetail[id];
    document.querySelector(`[data-feedback="${id}"]`).className = 'challenge-feedback';
    render(); save();
  }));
  byId('observacao').addEventListener('input', save);
  byId('limite-real').addEventListener('input', save);

  // Protocolo de comunicação: validar origem da janela e nonce da execução.
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || data.from !== 'ifma-aula05') return;
    if (data.type === 'READY') { ready = true; if (sourceLoaded) run(); return; }
    if (data.token !== nonce) return;
    if (data.type === 'COMPILED') {
      lastCompiled = !!data.ok;
      setStatus(data.ok ? '✓ Executado nas duas prévias com React Native Web. Estados independentes.' :
        `Erro de compilação/execução: ${data.detail || 'revise o arquivo completo.'}`, !data.ok);
    } else if (data.type === 'CHECKED' && data.stage === pending) {
      const id = pending; pending = null; enableChecks();
      passed[id] = !!data.ok;
      if (data.ok) completedDetail[id] = data.detail;
      else delete completedDetail[id];
      const feedback = document.querySelector(`[data-feedback="${id}"]`);
      feedback.className = 'challenge-feedback' + (data.ok ? ' success' : ' failed');
      feedback.textContent = data.ok ? `✓ Aprovado · ${data.detail}` : `Revisar · ${data.detail}`;
      render(); save();
      if (!data.ok && tasks[activeIndex].id === id) {
        byId('guide-feedback').textContent = feedback.textContent;
        byId('guide-feedback').className = 'guide-feedback failed';
      }
    }
  });

  function evidence() {
    return { schema: 'ifma-web-aula05-lab-v2', geradoEm: new Date().toISOString(),
      atividade: 'Aula 05 — Um código, duas telas · versão comentada',
      tipo: 'formativo-nao-e-nota', xp: getScore(), maximoXp: TOTAL_XP,
      exercicios: tasks.map(t => ({ id: t.id, ciclo: t.phase, titulo: t.name, xp: passed[t.id] ? t.xp : 0,
        maximoXp: t.xp, estado: passed[t.id] ? 'APROVADO' : 'PENDENTE', comentario: completedDetail[t.id] || null })),
      observacao: byId('observacao').value, testeNativoPendente: byId('limite-real').value,
      codigoFonteCompleto: panels.shared,
      ressalvas: ['Prévia de largura móvel = React Native Web no navegador, NÃO Android/iOS real.',
        'O mesmo código não sincroniza estados ou dados entre dispositivos.',
        'Nenhum envio automático e nenhuma nota oficial.', 'Testes automáticos não substituem análise humana.'] };
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('evidence-status').textContent = `Arquivo ${name} preparado para salvar.`;
  }
  byId('download-code').addEventListener('click', () => download('ProjetoUniversal.tsx', panels.shared, 'text/plain;charset=utf-8'));
  byId('export-json').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia_v2.json', JSON.stringify(evidence(), null, 2), 'application/json;charset=utf-8'));
  byId('legacy-export').addEventListener('click', () => {
    if (typeof legacy?.code === 'string') download('Aula05_Rascunho_v1_Backup.tsx', legacy.code, 'text/plain;charset=utf-8');
  });
  function reportText() {
    const data = evidence();
    const lines = ['# Aula 05 — Laboratório Web ↔ Mobile', '', `Gerado em: ${data.geradoEm}`,
      `XP formativos: **${data.xp}/${data.maximoXp}** (NÃO são nota).`, '', '## Exercícios'];
    data.exercicios.forEach(ex => lines.push(`- ${ex.estado}: ${ex.titulo} (${ex.xp}/${ex.maximoXp} XP)${ex.comentario ? ' — ' + ex.comentario : ''}`));
    lines.push('', '## O que modifiquei e observei', data.observacao || '(não respondido)',
      '', '## Teste em dispositivo nativo', data.testeNativoPendente || '(não respondido)',
      '', '## Limitações', ...data.ressalvas.map(text => '- ' + text),
      '', '## Arquivo completo entregue', '```tsx', data.codigoFonteCompleto, '```', '');
    return lines.join('\n');
  }
  byId('export-md').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia_v2.md', reportText(), 'text/markdown;charset=utf-8'));
  byId('print').addEventListener('click', () => {
    byId('print-report').textContent = reportText().split('## Arquivo completo entregue')[0];
    window.print();
  });

  loadSource();
})();
