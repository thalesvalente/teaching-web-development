/**
 * AULA 05 | Laboratório Vivo: tutoria conceitual e testes observáveis.
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
      do: 'Altere DICA_CAMPO no bloco [02] para “Ex.: Biblioteca escolar”. Execute; compare o exemplo dentro do campo com a regra visível abaixo.',
      observe: 'A dica aparece dentro dos dois campos quando estão vazios.',
      why: 'placeholder mostra apenas um exemplo; accessibilityHint orienta a tecnologia assistiva; o Text abaixo do campo apresenta a regra para todos.',
      hint: 'A constante é DICA_CAMPO. Você pode procurar pelo nome no editor e localizar placeholder={DICA_CAMPO}.' },
    { id: 'limit', xp: 12, name: 'Valide o limite mínimo', phase: 2, minutes: 8,
      focus: 'export const MINIMO_CARACTERES', type: 'code',
      do: 'Altere MINIMO_CARACTERES de 5 para 7. Teste um título de 6 e depois outro de 7 caracteres.',
      observe: 'Seis deve produzir erro; sete deve permitir o registro. A regra visível passa a dizer 7–60. Espaços nas pontas não contam.',
      why: 'É a mesma função validarTitulo que decide o resultado na Web e no Mobile.',
      hint: 'Modifique somente a constante. No [03], a condição texto.length < MINIMO_CARACTERES usa essa configuração.' },
    { id: 'maximum', xp: 10, name: 'Teste também o limite máximo', phase: 2, minutes: 8,
      focus: 'export const MAXIMO_CARACTERES', type: 'code',
      do: 'Altere MAXIMO_CARACTERES de 60 para 30. Faça testes com 30 e 31 caracteres.',
      observe: 'Trinta deve ser aceito; trinta e um devem mostrar erro. A regra visível passa a indicar máximo de 30.',
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
  // Tutorial da missão: conceito e teste sem deslocar o estudante da bancada.
  // Os textos são renderizados como texto, sem executar HTML externo.
  const tutorial = {
  "run": {
    "concept": "Componente é uma função que descreve a interface. O mesmo TSX pode ser renderizado duas vezes; cada instância mantém seu estado.",
    "test": "Digite “1” na Web e registre: deve aparecer erro, contador 0. Depois registre “Biblioteca” e confirme que Mobile continua em 0."
  },
  "map": {
    "concept": "useState devolve o valor atual e uma função para atualizá-lo. onChangeText chama a função na digitação; em Vue, ref/v-model cumprem papéis parecidos.",
    "test": "Localize [04] (estado) e [06] (digitação). Responda às perguntas desta missão."
  },
  "title": {
    "concept": "Uma constante nomeada evita repetir textos. O JSX lê TITULO_APLICACAO do bloco [02] para montar a tela.",
    "test": "Modifique TITULO_APLICACAO, clique Executar e confira os dois títulos."
  },
  "placeholder": {
    "concept": "Rótulo identifica. placeholder é exemplo passageiro. accessibilityHint auxilia leitores de tela. O Text abaixo do campo mostra a regra para todos.",
    "test": "Limpe o campo para ver a dica. Digite “1”: a dica some, mas a regra 5–60 permanece; o contador exibe 1."
  },
  "limit": {
    "concept": "A mesma constante MINIMO_CARACTERES alimenta a função validarTitulo e a orientação visível e acessível. O usuário não deve receber regras contraditórias.",
    "test": "Mude o mínimo para 7, execute, confira regra visível 7–60; teste “123456” (erro) e “1234567” (aceito)."
  },
  "maximum": {
    "concept": "MAXIMO_CARACTERES é o limite superior inclusivo da validação. O contador usa trim(), como a regra do bloco [03].",
    "test": "Mude o máximo para 30 e execute. Confira a regra visível e teste 30 caracteres e depois 31."
  },
  "button": {
    "concept": "TEXTO_BOTAO aparece no Pressable e em accessibilityLabel. Uma única constante controla o texto e o nome acessível.",
    "test": "Renomeie o botão; execute e confira nas duas renderizações."
  },
  "error": {
    "concept": "validarTitulo retorna uma mensagem; registrar a coloca em erro; JSX mostra o aviso só quando erro não está vazio.",
    "test": "Registre “1” para ver o erro; digite novamente e veja-o desaparecer."
  },
  "success": {
    "concept": "A confirmação depende de validação aprovada, mas não significa envio ao professor ou armazenamento permanente.",
    "test": "Tente registrar um título inválido, depois um válido; compare mensagem e contador."
  },
  "color": {
    "concept": "StyleSheet.create concentra os estilos. Um token COR_BOTAO controla a cor das duas renderizações.",
    "test": "Troque COR_BOTAO por #1f4f83; execute e compare os botões."
  },
  "trim": {
    "concept": "trim() remove espaços nas pontas antes de validar e registrar, preservando espaços internos.",
    "test": "Registre “  Memória  coletiva  ”. Confira a última memória exibida e o outro contador."
  },
  "invalid": {
    "concept": "return interrompe registrar ao falhar. onChangeText limpa o erro antigo durante a correção, sem registrar nada.",
    "test": "Tente só espaços e “abc”. Corrija, observe a mensagem desaparecer e registre um título válido."
  },
  "isolation": {
    "concept": "Compartilhar código não compartilha useState. Sincronização real de dados exigiria uma origem comum, como uma API.",
    "test": "Registre um título na Web e outro na prévia estreita; compare contadores e últimas memórias."
  },
  "quiz": {
    "concept": "React Native Web renderiza componentes no navegador; o teste em um dispositivo Android/iOS precisa de um projeto Expo compatível.",
    "test": "Responda às duas perguntas nesta missão sobre código compartilhado e teste nativo."
  }
};

  const key = 'ifma-web-aula05-lab-v4'; // Nunca sobrescreve rascunhos da versão anterior.
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
  let revealPreviewAfterExplicitRun = false;
  const nonce = 'aula05-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  // XP são conquistas históricas e cumulativas, não a nota de uma fotografia
  // instantânea do código. A validação atual é indicada no feedback separado.
  const passed = Object.fromEntries(tasks.map(task => [task.id, false]));
  const codeTaskIds = tasks.filter(task => task.type === 'code').map(task => task.id);
  let sourceRevision = 0;    // Muda apenas quando o TSX é editado/restaurado.
  let runSequence = 0;       // Evita aceitar respostas de compilações antigas.
  let reviewPending = false; // Conferência coletiva em curso.
  let reviewAfterCompile = false;
  const completedDetail = {};

  // Em vez de quatorze cartões em outra seção, há UMA missão ativa.
  // O aluno sempre lê a instrução, edita e testa na mesma bancada.
  const feedbackState = Object.fromEntries(tasks.map(t => [t.id, { kind: 'pending', text: 'Pendente · execute e confira nesta bancada.' }]));
  const select = byId('mission-select');
  const quizBank = byId('quiz-bank');

  function buildMissionIndex() {
    phases.forEach((phase, phaseIndex) => {
      const group = document.createElement('optgroup');
      group.label = phase.name;
      tasks.forEach((task, index) => {
        if (task.phase !== phaseIndex + 1) return;
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = `${String(index + 1).padStart(2, '0')} · ${task.name}`;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
  }
  buildMissionIndex();

  // Os quizzes fazem parte do próprio enunciado; NÃO é preciso procurá-los embaixo.
  const quizData = {
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
  function buildQuizBank() {
    for (const [id, questions] of Object.entries(quizData)) {
      const group = document.createElement('div');
      group.dataset.quiz = id;
      group.hidden = true;
      questions.forEach(([question, options], i) => {
        const field = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = question;
        field.append(legend);
        for (const [value, label] of options) {
          const choice = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = `${id}-q${i + 1}`;
          input.value = value;
          choice.append(input, document.createTextNode(label));
          field.append(choice);
        }
        group.append(field);
      });
      quizBank.append(group);
    }
  }
  buildQuizBank();

  function setStatus(message, error = false) {
    compilerStatus.textContent = message;
    compilerStatus.classList.toggle('error', error);
  }
  function getScore() { return tasks.reduce((sum, t) => sum + (passed[t.id] ? t.xp : 0), 0); }

  function activeTask() { return tasks[activeIndex]; }
  function updateGuide() {
    const task = activeTask();
    byId('guide-number').textContent = `MISSÃO ${String(activeIndex + 1).padStart(2, '0')} / 14 · CICLO ${task.phase} · ${activeIndex < 8 ? 'ESSENCIAL' : 'APROFUNDAMENTO'}`;
    byId('guide-time').textContent = `${task.minutes} min · +${task.xp} XP`;
    byId('guide-title').textContent = task.name;
    byId('guide-do').textContent = task.do;
    byId('guide-observe').textContent = task.observe;
    byId('guide-why').textContent = task.why;
    byId('guide-concept').textContent = tutorial[task.id].concept;
    const instruction = byId('guide-test');
    const label = document.createElement('strong');
    label.textContent = 'Teste concreto: ';
    instruction.replaceChildren(label, document.createTextNode(tutorial[task.id].test));
    byId('guide-line').textContent = `Localizar em ProjetoUniversal.tsx: ${task.focus}`;
    byId('guide-hint').textContent = task.hint;
    byId('guide-hint-box').open = false;
    byId('guide-prev').disabled = activeIndex === 0;
    byId('guide-next').disabled = activeIndex === tasks.length - 1;
    byId('mission-counter').textContent = `${String(activeIndex + 1).padStart(2, '0')} / 14`;
    select.value = task.id;
    const needsQuiz = task.type === 'quiz';
    quizBank.hidden = !needsQuiz;
    // Questões no topo do enunciado: no celular aparecem antes dos detalhes,
    // enquanto o botão de conferir permanece sempre fixo no rodapé da missão.
    if (needsQuiz) byId('guide-title').after(quizBank);
    else byId('guide-line').after(quizBank);
    quizBank.querySelectorAll('[data-quiz]').forEach(group => { group.hidden = group.dataset.quiz !== task.id; });
    byId('guide-check').textContent = needsQuiz ? 'Conferir respostas' : 'Conferir missão';
    const feedback = feedbackState[task.id];
    const guideFeedback = byId('guide-feedback');
    // O XP já ganho não some quando o aluno segue editando. Mas uma falha
    // na versão atual é mostrada claramente, sem falsa aprovação técnica.
    if (passed[task.id] && feedback.kind === 'failed') {
      guideFeedback.className = 'mission-feedback failed';
      guideFeedback.textContent = `${task.type === 'quiz' ? 'Revisar resposta atual' : 'Revisar código atual'} · +${task.xp} XP conquistados preservados. ${feedback.text}`;
    } else if (passed[task.id] && feedback.kind === 'pending' &&
               feedback.text !== 'Pendente · execute e confira nesta bancada.') {
      guideFeedback.className = 'mission-feedback pending';
      guideFeedback.textContent = `✓ +${task.xp} XP já conquistados · ${feedback.text}`;
    } else {
      guideFeedback.className = 'mission-feedback ' + (passed[task.id] ? 'success' : feedback.kind);
      guideFeedback.textContent = passed[task.id]
        ? `✓ Aprovado · +${task.xp} XP · ${completedDetail[task.id] || 'verificação concluída'}`
        : feedback.text;
    }
  }
  function setActive(target) {
    const index = typeof target === 'number' ? target : tasks.findIndex(t => t.id === target);
    if (index < 0 || index >= tasks.length) return;
    activeIndex = index;
    updateGuide();
    // Só reinicia o scroll do ENUNCIADO, não desloca toda a página.
    byId('mission-copy').scrollTop = 0;
    save();
  }
  function render() {
    const score = getScore();
    byId('xp-top').textContent = String(score);
    byId('xp-evidence').textContent = String(score);
    byId('progress-fill').style.width = score + '%';
    byId('progress').setAttribute('aria-valuenow', String(score));
    const completed = tasks.filter(t => passed[t.id]).length;
    byId('score-summary').textContent = `${completed} de ${tasks.length} exercícios concluídos`;
    byId('evidence-count').textContent = `${completed} concluídos · ${tasks.length - completed} pendentes`;
    select.querySelectorAll('option').forEach((option, index) => {
      const task = tasks.find(t => t.id === option.value);
      const number = tasks.indexOf(task) + 1;
      option.textContent = `${passed[task.id] ? '✓ ' : ''}${String(number).padStart(2, '0')} · ${task.name}`;
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
    quizBank.querySelectorAll('input[type="radio"]:checked').forEach(input => { values[input.name] = input.value; });
    return values;
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({
        code: panels.shared, answers: readAnswers(), activeTask: activeTask().id,
        note: byId('observacao').value, nativeNote: byId('limite-real').value,
        completed: tasks.filter(t => passed[t.id]).map(t => t.id),
        details: Object.fromEntries(tasks.filter(t => passed[t.id]).map(t => [t.id, completedDetail[t.id] || 'Concluído em sessão anterior'])),
      }));
    } catch { /* armazenamento opcional; a bancada funciona sem ele */ }
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* dado antigo inválido */ }
  if (saved && typeof saved === 'object') {
    // Retomar pontuação formativa previamente conferida; não equivale a nota.
    if (Array.isArray(saved.completed) && saved.completed.length <= tasks.length) {
      for (const id of saved.completed) {
        if (typeof id !== 'string' || !Object.hasOwn(passed, id)) continue;
        passed[id] = true;
        completedDetail[id] = typeof saved.details?.[id] === 'string'
          ? saved.details[id].slice(0, 250) : 'Concluído em sessão anterior';
      }
    }
    if (typeof saved.note === 'string') byId('observacao').value = saved.note;
    if (typeof saved.nativeNote === 'string') byId('limite-real').value = saved.nativeNote;
    if (saved.answers && typeof saved.answers === 'object') {
      quizBank.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = saved.answers[input.name] === input.value; });
    }
    if (typeof saved.activeTask === 'string') {
      const index = tasks.findIndex(t => t.id === saved.activeTask);
      if (index >= 0) activeIndex = index;
    }
  }
  // O tutorial V4 abre com a fonte atualizada. O código anterior continua
  // disponível para download; não é sobrescrito nem migrado sem consentimento.
  let legacy = null, legacyTag = '';
  for (const [storageKey, tag] of [['ifma-web-aula05-lab-v2', 'v3'], ['ifma-web-aula05-lab-v1', 'v1']]) {
    try {
      const prior = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (typeof prior?.code === 'string' && prior.code.length < 30000) {
        legacy = prior; legacyTag = tag; break;
      }
    } catch { /* ignorar rascunho inválido */ }
  }
  if (legacy) {
    byId('legacy-export').hidden = false;
    byId('legacy-export').textContent = 'Baixar meu código anterior';
    byId('migration-note').hidden = false;
  }
  render();

  async function loadSource() {
    try {
      const response = await fetch('./shared/ProjetoUniversal.tsx', { cache: 'no-store' });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const initial = await response.text();
      panels.shared = typeof saved?.code === 'string' && saved.code.length < 30000 ? saved.code : initial;
      window.__IFMA_LAB_INITIAL__ = initial;
      codeEditor.value = panels.shared;
      sourceLoaded = true;
      setStatus('Arquivo completo carregado. Preparando execução nas duas telas…');
      if (ready) run({ initial: true });
    } catch (error) { setStatus(`Não foi possível carregar o arquivo: ${error.message}. Use HTTP/HTTPS, não file://.`, true); }
  }
  function send(type, fields = {}) {
    if (!ready || !sourceLoaded || !frame.contentWindow) { setStatus('Código ou prévia indisponível.', true); return false; }
    frame.contentWindow.postMessage({ from: 'ifma-aula05-host', type, token: nonce, ...fields }, '*');
    return true;
  }
  function setPane(which) {
    const pane = which === 'preview' ? 'preview' : 'code';
    byId('conteudo').dataset.pane = pane;
    document.querySelectorAll('[data-pane]').forEach(button => {
      const chosen = button.dataset.pane === pane;
      button.setAttribute('aria-selected', String(chosen));
      button.tabIndex = chosen ? 0 : -1;
    });
  }
  setPane('code');
  const expandButton = byId('expand-preview');
  expandButton.addEventListener('click', () => {
    const workspace = byId('laboratorio');
    const expanded = workspace.dataset.expandedPreview !== 'true';
    workspace.dataset.expandedPreview = String(expanded);
    expandButton.setAttribute('aria-pressed', String(expanded));
    expandButton.textContent = expanded ? 'Voltar à divisão' : 'Ampliar prévias';
  });
  document.querySelectorAll('[data-pane]').forEach(button => button.addEventListener('click', () => setPane(button.dataset.pane)));
  function locate() {
    const task = activeTask();
    showFile('shared');
    if (!panels.shared) return;
    const pos = panels.shared.indexOf(task.focus);
    if (pos < 0) {
      feedbackState[task.id] = { kind: 'failed', text: 'Trecho não encontrado: reveja o nome da declaração no arquivo completo.' };
      updateGuide(); return;
    }
    const linesBefore = panels.shared.slice(0, pos).split('\n').length;
    const lineHeight = Number.parseFloat(getComputedStyle(codeEditor).lineHeight) || 21;
    setPane('code');
    byId('laboratorio').dataset.expandedPreview = 'false';
    expandButton.setAttribute('aria-pressed', 'false');
    expandButton.textContent = 'Ampliar prévias';
    codeEditor.focus({ preventScroll: true });
    codeEditor.setSelectionRange(pos, pos + task.focus.length);
    codeEditor.scrollTop = Math.max(0, (linesBefore - 6) * lineHeight);
    byId('guide-line').textContent = `↳ ProjetoUniversal.tsx · linha ${linesBefore} destacada no editor ao lado`;
  }
  // Ao editar, a compilação antiga deixa de ser a versão atual,
  // porém as missões JÁ APROVADAS continuam creditadas.
  function markCodeForReview(message) {
    for (const task of tasks) {
      if (task.type === 'quiz') continue;
      feedbackState[task.id] = { kind: 'pending', text: message ||
        'Código atualizado. Execute e confira novamente se desejar; XP conquistados continuam no histórico.' };
    }
    lastCompiled = false;
    render();
  }
  function enableChecks() { byId('guide-check').disabled = false; }
  function setReviewBusy(busy) {
    for (const id of ['review-xp', 'review-xp-dialog']) byId(id).disabled = busy;
  }
  function stopPendingChecks() {
    pending = null;
    reviewPending = false;
    enableChecks();
    setReviewBusy(false);
  }
  function run({ initial = false } = {}) {
    if (!sourceLoaded) return;
    if (activeFile !== 'shared') showFile('shared');
    panels.shared = codeEditor.value;
    stopPendingChecks();
    revealPreviewAfterExplicitRun = !initial;
    lastCompiled = false;
    const thisRun = ++runSequence;
    if (reviewAfterCompile) setReviewBusy(true);
    if (send('RUN', { source: panels.shared, revision: sourceRevision, runId: thisRun }))
      setStatus('Compilando TSX completo para as duas prévias…');
    if (!initial) save();
  }
  function showFile(which) {
    activeFile = which;
    document.querySelectorAll('[data-file]').forEach(button => {
      const chosen = button.dataset.file === which;
      button.setAttribute('aria-selected', String(chosen));
      button.tabIndex = chosen ? 0 : -1;
    });
    byId('editor-source').setAttribute('aria-labelledby', 'tab-' + which);
    codeEditor.hidden = which !== 'shared';
    readOnly.hidden = which === 'shared';
    if (which !== 'shared') readOnly.textContent = panels[which];
    fileContext.textContent = which === 'shared' ? 'Arquivo inteiro: [01] importações → [07] estilos.' :
      which === 'route' ? 'Rota completa Expo Router · importa o componente, não substitui as outras telas.' :
      'Exemplo Vue completo · compare ref/v-model com useState/onChangeText.';
    setPane('code');
  }
  function checkQuiz(id) {
    const names = [id + '-q1', id + '-q2'];
    const answers = names.map(name => quizBank.querySelector(`input[name="${name}"]:checked`)?.value || '');
    if (answers.some(value => !value)) {
      feedbackState[id] = { kind: 'pending', text: 'Responda às duas perguntas aqui mesmo para conferir. Pode deixá-las pendentes.' };
      updateGuide();return;
    }
    const ok = answers[0] === 'a' && answers[1] === 'b';
    if (ok) {
      passed[id] = true; // XP ganho é acumulativo: conferir depois não o remove.
      completedDetail[id] = id === 'map' ? 'useState guarda; onChangeText atualiza.' :
        'React Native Web renderiza no navegador; Expo permite execução em dispositivo real.';
    }
    feedbackState[id] = ok
      ? { kind: 'success', text: '✓ Você identificou a relação entre código e resultado.' }
      : { kind: 'failed', text: id === 'map' ? 'Revise [04] e onChangeText no bloco [06].' : 'Prévia móvel não é execução Android/iOS; consulte Como funciona.' };
    render(); save();
  }
  function checkTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (task.type === 'quiz') { checkQuiz(id); return; }
    if (!ready || !lastCompiled) {
      feedbackState[id] = { kind: 'failed', text: 'Primeiro clique Executar. Depois confira esta missão aqui.' };
      updateGuide(); return;
    }
    if (pending !== null || reviewPending) return;
    pending = id;
    byId('guide-check').disabled = true;
    feedbackState[id] = { kind: 'pending', text: 'Testando o código executado nas duas prévias…' };
    updateGuide();
    if (!send('CHECK', { stage: id, revision: sourceRevision, runId: runSequence })) {
      pending = null; enableChecks();
    }
  }
  // Conferência única das doze missões técnicas. Útil para recuperar XP
  // que foram zerados pelo bug anterior, quando o código final ainda atende
  // aos critérios. Somente resultados PASS ganham XP, sem tirar os anteriores.
  function setReviewStatus(message, kind = '') {
    const node = byId('review-status');
    node.textContent = message;
    node.dataset.kind = kind;
  }
  function startReview() {
    if (reviewPending || pending !== null || !lastCompiled) return;
    reviewPending = true;
    setReviewBusy(true);
    byId('guide-check').disabled = true;
    setReviewStatus('Conferindo as 12 missões técnicas no código executado. Os XP já conquistados estão protegidos.');
    if (!send('CHECK_ALL', { stages: codeTaskIds, revision: sourceRevision, runId: runSequence })) {
      stopPendingChecks();
      setReviewStatus('Não foi possível iniciar a conferência. Seus XP foram preservados.', 'failed');
    }
  }
  function reviewProgress() {
    if (reviewPending || pending !== null) return;
    if (!ready || !sourceLoaded) {
      setReviewStatus('Aguarde o carregamento do laboratório para conferir.', 'failed');
      return;
    }
    if (!lastCompiled) {
      reviewAfterCompile = true;
      setReviewStatus('Executando o TSX atual antes de conferir as missões. Os XP anteriores permanecem.');
      run({ initial: true }); // Não troca de aba nem altera os pontos.
      return;
    }
    startReview();
  }
  for (const id of ['review-xp','review-xp-dialog'])
    byId(id).addEventListener('click', reviewProgress);
  select.addEventListener('change', () => setActive(select.value));
  byId('guide-prev').addEventListener('click', () => setActive(activeIndex - 1));
  byId('guide-next').addEventListener('click', () => setActive(activeIndex + 1));
  byId('guide-locate').addEventListener('click', locate);
  byId('guide-check').addEventListener('click', () => checkTask(activeTask().id));
  byId('run').addEventListener('click', () => run());
  byId('reset').addEventListener('click', () => {
    if (!window.__IFMA_LAB_INITIAL__) return;
    if (!confirm('Restaurar o arquivo original? O código que você editou será substituído, mas as observações continuam.')) return;
    panels.shared = window.__IFMA_LAB_INITIAL__;
    codeEditor.value = panels.shared;
    sourceRevision++;
    markCodeForReview('Código original restaurado. XP anteriores preservados como histórico de aprendizagem.');
    run();
  });
  codeEditor.addEventListener('input', () => {
    panels.shared = codeEditor.value;
    sourceRevision++;
    stopPendingChecks();
    reviewAfterCompile = false;
    markCodeForReview('Arquivo editado. Execute para conferir a nova versão; XP acumulados não diminuem.');
    save();
    setStatus('Código modificado. Seus XP foram preservados. Clique Executar para testar o novo arquivo.');
  });
  codeEditor.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();run();
    }
  });
  document.querySelectorAll('[data-file]').forEach(button => button.addEventListener('click', () => showFile(button.dataset.file)));
  quizBank.querySelectorAll('input[type="radio"]').forEach(input => input.addEventListener('change', () => {
    const id = input.name.startsWith('map-') ? 'map' : 'quiz';
    // Alterar a resposta NÃO retira os XP conquistados em conferência anterior.
    // O estado atual fica pendente até uma nova conferência conceitual.
    feedbackState[id] = { kind: 'pending', text: 'Resposta alterada. Confira a resposta atual; XP já conquistados permanecem.' };
    render();save();
  }));
  byId('observacao').addEventListener('input', save);
  byId('limite-real').addEventListener('input', save);

  // O mesmo iframe permanece isolado; a bancada apenas consome resultados verificados.
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || data.from !== 'ifma-aula05') return;
    if (data.type === 'READY') { ready = true; if (sourceLoaded) run({ initial: true }); return; }
    if (data.token !== nonce) return;
    // A resposta assíncrona deve vir da VERSÃO compilada que continua aberta.
    // Editar/reexecutar durante uma conferência descarta resultados antigos.
    if (data.runId !== runSequence || data.revision !== sourceRevision) return;
    if (data.type === 'COMPILED') {
      lastCompiled = data.ok === true;
      setStatus(lastCompiled ? '✓ Executado nas duas prévias React Native Web. Estados independentes.' :
        `Erro no código: ${data.detail || 'revise o arquivo completo.'} · XP anteriores preservados.`, !lastCompiled);
      if (!lastCompiled) {
        markCodeForReview('O código atual não compilou. Corrija-o antes de novas conferências; XP conquistados não desaparecem.');
        if (reviewAfterCompile) {
          reviewAfterCompile = false;
          setReviewBusy(false);
          setReviewStatus('Não foi possível conferir: o código atual não compilou. Seus XP estão preservados.', 'failed');
        }
        save();
      }
      if (lastCompiled && reviewAfterCompile) {
        reviewAfterCompile = false;
        startReview();
      }
      if (lastCompiled && revealPreviewAfterExplicitRun && window.matchMedia('(max-width: 1040px)').matches) setPane('preview');
      revealPreviewAfterExplicitRun = false;
    } else if (data.type === 'CHECKED' && data.stage === pending) {
      const id = pending;
      stopPendingChecks();
      if (data.ok === true) {
        passed[id] = true;
        completedDetail[id] = String(data.detail || 'Critério aprovado.').slice(0, 250);
      }
      // Falha na versão atual não anula o XP acumulado por aprovação anterior.
      feedbackState[id] = data.ok === true
        ? { kind: 'success', text: `✓ Aprovado · ${data.detail}` }
        : { kind: 'failed', text: `A conferência atual falhou: ${data.detail || 'revise o código.'}` };
      render();save();
    } else if (data.type === 'CHECKED_ALL' && reviewPending) {
      stopPendingChecks();
      const results = data.results;
      if (!Array.isArray(results) || results.length !== codeTaskIds.length ||
          new Set(results.map(item => item?.stage)).size !== codeTaskIds.length ||
          results.some(item => !item || !codeTaskIds.includes(item.stage) || typeof item.ok !== 'boolean')) {
        setReviewStatus('Não foi possível validar a conferência coletiva. Os XP já conquistados permanecem.', 'failed');
        return;
      }
      const scoreBefore = getScore();
      let approvedNow = 0, notApprovedNow = 0, newlyApproved = 0;
      for (const item of results) {
        const id = item.stage;
        const current = item.ok === true;
        if (current) {
          approvedNow++;
          if (!passed[id]) newlyApproved++;
          passed[id] = true;
          completedDetail[id] = String(item.detail || 'Critério conferido.').slice(0, 250);
          feedbackState[id] = { kind: 'success', text: '✓ Conferência coletiva: ' + (item.detail || 'aprovado.') };
        } else {
          notApprovedNow++;
          feedbackState[id] = { kind: 'failed',
            text: 'A versão atual não passou: ' + String(item.detail || 'revise o critério.').slice(0, 250) };
        }
      }
      render();save();
      const gained = getScore() - scoreBefore;
      const message = `Conferência concluída: ${approvedNow}/${codeTaskIds.length} missões técnicas aprovadas no código atual; ${newlyApproved} novas conquistas (+${gained} XP). Total acumulado: ${getScore()}/100 XP. ${notApprovedNow} não passaram na versão atual. Nenhuma conquista anterior foi apagada.`;
      setReviewStatus(message, 'success');
      setStatus('✓ '+message);
    }
  });

  // Consultar componentes básicos sem criar arquivos ou exercícios adicionais.
  // O botão localiza o JSX REAL editado pelo estudante, não um fragmento inventado.
  const basicComponents = Object.freeze({
    View: {
      name: 'View · agrupa elementos',
      explanation: 'É um contêiner de interface (semelhante à ideia de uma div em HTML). Organiza título, entrada, botão e resumo.',
      observe: 'Observe que o formulário inteiro e o resumo estão agrupados em regiões nas duas prévias.',
      marker: '<View style={styles.pagina}'
    },
    Text: {
      name: 'Text · apresenta informações',
      explanation: 'Exibe textos, como o título, a regra de validação e a última memória. Não serve como campo para digitar.',
      observe: 'Altere TITULO_APLICACAO em [02], execute e veja o Text do título mudar nas duas prévias.',
      marker: '<Text style={styles.titulo}>'
    },
    TextInput: {
      name: 'TextInput · recebe texto',
      explanation: 'É o campo editável. value={titulo} lê o estado; onChangeText chama setTitulo ao digitar. O placeholder é um exemplo, não a regra.',
      observe: 'Digite algo no campo da Web e note que a prévia móvel mantém seu próprio estado.',
      marker: '<TextInput'
    },
    Pressable: {
      name: 'Pressable · recebe o toque/clique',
      explanation: 'É o elemento acionável. onPress={registrar} chama a função quando a pessoa toca ou clica; não chame registrar() na declaração.',
      observe: 'Teste um título curto e outro válido usando o botão. O mesmo onPress funciona nas duas prévias.',
      marker: '<Pressable'
    }
  });
  let selectedComponent = 'View';
  function drawComponent() {
    const info = basicComponents[selectedComponent];
    byId('component-name').textContent = info.name;
    byId('component-explanation').textContent = info.explanation;
    byId('component-fragment').textContent = info.marker;
    byId('component-observe').textContent = info.observe;
    document.querySelectorAll('[data-component]').forEach(button => {
      const selected = button.dataset.component === selectedComponent;
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  byId('component-open').addEventListener('click', () => {
    drawComponent();
    byId('component-dialog').showModal();
  });
  document.querySelectorAll('[data-component]').forEach(button => button.addEventListener('click', () => {
    selectedComponent = button.dataset.component;
    drawComponent();
  }));
  byId('component-locate').addEventListener('click', () => {
    const marker = basicComponents[selectedComponent].marker;
    showFile('shared');
    const pos = panels.shared.indexOf(marker);
    if (pos < 0) {
      byId('component-explanation').textContent =
        'Este trecho não foi encontrado no seu código atual. Confira se o componente foi alterado ou removido.';
      return;
    }
    byId('component-dialog').close();
    setPane('code');
    codeEditor.focus({ preventScroll: true });
    codeEditor.setSelectionRange(pos, pos + marker.length);
    const line = panels.shared.slice(0, pos).split('\n').length;
    codeEditor.scrollTop = Math.max(0,(line - 6) * (parseFloat(getComputedStyle(codeEditor).lineHeight) || 21));
    setStatus('Componente '+selectedComponent+' localizado no arquivo completo, linha '+line+'.');
  });

  // Ajuda e evidências são janelas auxiliares; a bancada jamais perde seu lugar.
  for (const [buttonId, dialogId] of [['help-open','help-dialog'],['evidence-open','evidence-dialog']]) {
    byId(buttonId).addEventListener('click', () => byId(dialogId).showModal());
  }
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => byId(button.dataset.closeDialog).close()));
  document.querySelectorAll('dialog.resource-dialog').forEach(dialog => {
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });

  function evidence() {
    return { schema: 'ifma-web-aula05-lab-v4', geradoEm: new Date().toISOString(),
      atividade: 'Aula 05 — Laboratório Vivo · Tutorial Web ↔ Mobile',
      tipo: 'formativo-nao-e-nota', xp: getScore(), maximoXp: TOTAL_XP,
      exercicios: tasks.map(task => ({ id: task.id, ciclo: task.phase, titulo: task.name,
        xp: passed[task.id] ? task.xp : 0, maximoXp: task.xp,
        estado: passed[task.id] ? 'APROVADO' : 'PENDENTE', comentario: completedDetail[task.id] || null })),
      observacao: byId('observacao').value, testeNativoPendente: byId('limite-real').value,
      codigoFonteCompleto: panels.shared,
      ressalvas: ['Prévia móvel = React Native Web estreito, NÃO dispositivo Android/iOS.',
        'Compartilhar componente não sincroniza dados.',
        'Os XP não constituem nota oficial.', 'Não existe envio automático ao professor.'] };
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('evidence-status').textContent = `Arquivo ${name} preparado para salvar.`;
  }
  byId('download-code').addEventListener('click', () => download('ProjetoUniversal.tsx', panels.shared, 'text/plain;charset=utf-8'));
  byId('legacy-export').addEventListener('click', () => {
    if (typeof legacy?.code === 'string') download('Aula05_Rascunho_' + legacyTag + '_Backup.tsx', legacy.code, 'text/plain;charset=utf-8');
  });
  // Arquivo de continuidade é distinto da evidência enviada ao professor:
  // contém código, missão atual, respostas e checkpoints formativos.
  function checkpoint() {
    return {
      schema: 'ifma-web-aula05-checkpoint-v1',
      savedAt: new Date().toISOString(),
      code: panels.shared,
      activeTask: activeTask().id,
      answers: readAnswers(),
      completed: tasks.filter(t => passed[t.id]).map(t => t.id),
      details: Object.fromEntries(tasks.filter(t => passed[t.id]).map(t => [t.id, completedDetail[t.id] || 'Concluído'])),
      note: byId('observacao').value,
      nativeNote: byId('limite-real').value,
      xp: getScore(),
      warning: 'XP formativos, não nota oficial. Revalidar tarefas se modificar o código.'
    };
  }
  function progressMessage(message, error = false) {
    const target = byId('progress-status');
    target.textContent = message;
    target.dataset.kind = error ? 'error' : 'success';
  }
  function exportCheckpoint() {
    save();
    download('Aula05_Continuar_Depois.json', JSON.stringify(checkpoint(), null, 2), 'application/json;charset=utf-8');
    progressMessage('Progresso exportado. Guarde o JSON para retomar neste ou em outro dispositivo.');
  }
  function restoreCheckpoint(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('JSON inválido.');
    const isCheckpoint = data.schema === 'ifma-web-aula05-checkpoint-v1';
    const isEvidence = data.schema === 'ifma-web-aula05-lab-v4';
    if (!isCheckpoint && !isEvidence) throw Error('Este arquivo não é um progresso da Aula 05.');
    const source = isCheckpoint ? data.code : data.codigoFonteCompleto;
    if (typeof source !== 'string' || !source.trim() || source.length > 30000)
      throw Error('O arquivo não contém código TSX válido.');
    const ids = isCheckpoint ? data.completed : Array.isArray(data.exercicios)
      ? data.exercicios.filter(ex => ex && ex.estado === 'APROVADO').map(ex => ex.id) : [];
    if (!Array.isArray(ids) || ids.length > tasks.length || new Set(ids).size !== ids.length ||
        ids.some(id => !Object.hasOwn(passed, id))) throw Error('Lista de exercícios inválida.');
    const answerMap = isCheckpoint ? data.answers : data.progressoTutorial?.answers;
    if (answerMap != null && (typeof answerMap !== 'object' || Array.isArray(answerMap)))
      throw Error('Respostas inválidas.');
    const answers = answerMap || {};
    // Não reconhecer XP de quiz sem suas respostas; o estudante pode refazê-lo.
    const quizValid = id => (id === 'map' || id === 'quiz') &&
      answers[id + '-q1'] === 'a' && answers[id + '-q2'] === 'b';
    const restored = ids.filter(id => !['map','quiz'].includes(id) || quizValid(id));
    const computed = restored.reduce((n,id)=>n+tasks.find(t=>t.id===id).xp,0);
    if (isCheckpoint && (!Number.isSafeInteger(data.xp) ||
        data.xp !== ids.reduce((n,id)=>n+tasks.find(t=>t.id===id).xp,0)))
      throw Error('Pontuação inconsistente no arquivo.');
    if (!confirm('Retomar o arquivo selecionado? O código e o progresso desta sessão serão substituídos.')) {
      progressMessage('Retomada cancelada. O código, as respostas e os XP atuais foram preservados.');
      return;
    }
    panels.shared = source;
    codeEditor.value = source;
    for (const task of tasks) {
      passed[task.id] = restored.includes(task.id);
      delete completedDetail[task.id];
      if (passed[task.id]) completedDetail[task.id] = 'Restaurado do JSON · XP formativo';
      feedbackState[task.id] = {kind:'pending',text:'Progresso restaurado. Execute e confira novamente se editar.'};
    }
    quizBank.querySelectorAll('input[type="radio"]').forEach(input => {
      input.checked = answers[input.name] === input.value;
    });
    byId('observacao').value = String((isCheckpoint ? data.note : data.observacao) || '').slice(0,2000);
    byId('limite-real').value = String((isCheckpoint ? data.nativeNote : data.testeNativoPendente) || '').slice(0,1000);
    const selected = isCheckpoint ? data.activeTask : data.progressoTutorial?.activeTask;
    activeIndex = Math.max(0, tasks.findIndex(t=>t.id===selected));
    showFile('shared');
    render();save();
    run({initial:true});
    progressMessage('Progresso retomado: '+computed+'/100 XP formativos. Código e respostas restaurados; quizzes sem respostas verificáveis ficam pendentes.');
  }
  const fileInput = byId('progress-file');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw Error('Arquivo excede 100 KB.');
      const raw = await file.text();
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { throw Error('Arquivo JSON malformado: sintaxe inválida.'); }
      restoreCheckpoint(parsed);
    } catch (error) {
      progressMessage('Não foi possível retomar: '+String(error.message || error), true);
    } finally { fileInput.value = ''; }
  });
  for (const id of ['save-progress','dialog-save-progress']) byId(id).addEventListener('click', exportCheckpoint);
  for (const id of ['load-progress','dialog-load-progress']) byId(id).addEventListener('click', () => fileInput.click());

  byId('export-json').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia_v4.json', JSON.stringify(evidence(), null, 2), 'application/json;charset=utf-8'));
  function reportText() {
    const data = evidence();
    const lines = ['# Aula 05 — Laboratório Vivo · Tutorial Web ↔ Mobile', '', `Gerado em: ${data.geradoEm}`,
      `XP formativos: **${data.xp}/${data.maximoXp}** (NÃO são nota).`, '', '## Exercícios'];
    data.exercicios.forEach(ex => lines.push(`- ${ex.estado}: ${ex.titulo} (${ex.xp}/${ex.maximoXp} XP)${ex.comentario ? ' — ' + ex.comentario : ''}`));
    lines.push('', '## O que modifiquei e observei', data.observacao || '(não respondido)',
      '', '## Teste em dispositivo nativo', data.testeNativoPendente || '(não respondido)',
      '', '## Limitações', ...data.ressalvas.map(text => '- ' + text),
      '', '## Arquivo completo entregue', '```tsx', data.codigoFonteCompleto, '```', '');
    return lines.join('\n');
  }
  byId('export-md').addEventListener('click', () => download('Aula05_Laboratorio_Evidencia_v4.md', reportText(), 'text/markdown;charset=utf-8'));
  // Documento A4 estruturado: a versão anterior imprimia Markdown como
  // texto plano, com bullets e asteriscos literais. Agora o HTML de impressão
  // segue a identidade das fichas do IFMA, mantendo resultados PARCIAIS.
  function printPartial() {
    try {
      const current=evidence();
      if (!window.WebLabReport?.prepare)
        throw Error('O gerador do relatório institucional não está disponível.');
      const student={
        name:byId('web-student-name')?.value || '',
        enrollment:byId('web-student-id')?.value || '',
        team:byId('web-team')?.value || ''
      };
      const summary=window.WebLabReport.prepare(byId('print-report'),current,student);
      progressMessage('Relatório A4 preparado: '+summary.xp+'/100 XP e '+
        summary.pending+' missões pendentes. Na janela do navegador, escolha “Salvar como PDF”.');
      window.print();
    } catch(error) {
      progressMessage('Não foi possível preparar o PDF: '+
        String(error?.message||'verifique os dados.'),true);
    }
  }
  for (const id of ['print','quick-pdf','dialog-pdf']) byId(id).addEventListener('click', printPartial);
  // Integração externa só pode obter o mesmo snapshot usado nos exports.
  // O Apps Script recebe evidência relatada, não um certificado de nota.
  window.WebLabEvidence = Object.freeze({ snapshot: evidence });
  loadSource();
})();
