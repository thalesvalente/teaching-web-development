/* Motor didático. Os corpos de validar/enviar/registrarRecado vêm da mesma fonte dos códigos exibidos. */
(() => {
  'use strict';
  const E = JSON.parse(document.getElementById('exampleSource').textContent);
  const { createApp, ref } = Vue;
  const validar = new Function(E.rules.replaceAll('export ', '') + ';return validar')();
  const createFormState = new Function('ref', 'emit', 'validar', E.setup + ';return {assunto,mensagem,erros,sucesso,editar,limpar,enviar}');
  const createParentState = new Function('ref', E.parentSetup + ';return {total,ultimo,registrarRecado}');
  const instances = new Map();
  let demoSequence = 0;
  const formTemplate = (id, broken = '') => {
    let t = E.template.replaceAll('"assunto"', '"' + id + '-assunto"').replaceAll('"mensagem"', '"' + id + '-mensagem"');
    // Repor as expressões Vue, que não são IDs.
    t = t.replace('v-model="' + id + '-assunto"', 'v-model="assunto"').replace('v-model="' + id + '-mensagem"', 'v-model="mensagem"');
    t = t.replaceAll('ajuda-assunto', id + '-ajuda-assunto').replaceAll('erro-assunto', id + '-erro-assunto');
    t = t.replaceAll('ajuda-mensagem', id + '-ajuda-mensagem').replaceAll('erro-mensagem', id + '-erro-mensagem');
    t = t.replaceAll('<p id="' + id + '-ajuda-', '<p class="help" id="' + id + '-ajuda-');
    t = t.replaceAll('<p id="' + id + '-erro-', '<p class="error" id="' + id + '-erro-');
    t = t.replace('<button type="submit">', '<div class="buttons"><button type="submit">');
    t = t.replace('<button type="button"', '<button class="secondary" type="button"');
    t = t.replace('>Limpar</button>', '>Limpar</button></div>');
    t = t.replace('<p role="status">', '<p class="success" role="status">');
    if (broken === 'model') t = t.replace('v-model="assunto"', ':value="assunto"');
    return t;
  };
  function mountFull(el, bug = '', fixed = false) {
    const id = 'd' + (++demoSequence);
    let ruleFn = validar;
    let setupFn = createFormState;
    if (bug === 'trim' && !fixed) ruleFn = new Function(E.rules.replaceAll('export ', '').replaceAll('.trim()', '') + ';return validar')();
    if (bug === 'early' && !fixed) {
      const body = E.setup.replace("  const resultado = validar(assunto.value, mensagem.value)", "  emit('recado', { assunto: assunto.value, mensagem: mensagem.value })\n  const resultado = validar(assunto.value, mensagem.value)")
        .replace("  emit('recado', resultado.dados)\n", '');
      setupFn = new Function('ref', 'emit', 'validar', body + ';return {assunto,mensagem,erros,sucesso,editar,limpar,enviar}');
    }
    const Form = { emits: ['recado'], setup(_props, {emit}) {return setupFn(ref, emit, ruleFn);}, template: formTemplate(id, fixed ? '' : bug)};
    const app = createApp({components:{RecadoForm:Form}, setup(){return createParentState(ref)}, template:`<RecadoForm @recado="registrarRecado"/><section class="summary" aria-label="Resumo do App"><p><strong>Recados nesta sessão:</strong> <span class="demo-total">{{ total }}</span></p><p class="latest" :title="ultimo ? ultimo.assunto + ' — ' + ultimo.mensagem : ''">{{ ultimo ? ultimo.assunto + ' — ' + ultimo.mensagem : 'Nenhum recado ainda.' }}</p></section>`});
    app.mount(el); return app;
  }
  function mountSimple(el, mode) {
    const id='d'+(++demoSequence);
    let template='';
    if(mode==='input') template=`<label for="${id}">Assunto</label><input id="${id}" v-model="texto"><div class="inspector">assunto = {{ JSON.stringify(texto) }}</div><div class="demo-tools"><button type="button" @click="texto='Novos livros'">Preencher pelo estado</button><button class="secondary" type="button" @click="texto=''">Limpar</button></div><p class="note" style="margin-top:18px">Campo e estado mostram a mesma informação.</p>`;
    if(mode==='textarea') template=`<label for="${id}">Mensagem</label><textarea id="${id}" style="height:120px" v-model="texto" aria-describedby="${id}-help"></textarea><p class="help" id="${id}-help">Escreva em mais de uma linha.</p><div class="inspector">mensagem = {{ JSON.stringify(texto) }}</div><p class="note" style="margin-top:20px">Enter aqui cria uma nova linha.</p>`;
    if(mode==='submit') template=`<form @submit.prevent="contarEnvio"><label for="${id}">Assunto</label><input id="${id}" v-model="texto"><div class="buttons"><button type="submit">Registrar recado</button></div></form><div class="inspector">Tentativas: {{ tentativas }}</div><p class="note" style="margin-top:20px">Somente demonstramos o evento. Ainda não há validação nesta prévia.</p>`;
    if(mode==='trim') template=`<label for="${id}">Texto bruto</label><input id="${id}" v-model="texto"><div class="inspector">bruto: {{ JSON.stringify(texto) }}<br>trim(): {{ JSON.stringify(texto.trim()) }}<br>tamanho: {{ texto.trim().length }}</div><div class="demo-tools"><button type="button" @click="texto='     '">Só espaços</button><button class="secondary" type="button" @click="texto='  Novos  livros  '">Com espaços</button></div>`;
    if(mode==='bounds') template=`<label>Assunto: {{ texto.length }} caracteres</label><div class="demo-tools"><button v-for="n in [3,4,40,41]" :key="n" type="button" @click="texto='A'.repeat(n)">{{ n }}</button></div><div class="inspector">{{ validar(texto, 'Mais livros para a turma.').erros.assunto || 'Válido: assunto dentro da faixa.' }}</div><p class="note" style="margin-top:20px">Assunto: 4–40. Mensagem: 10–200.<br>O exemplo é da biblioteca; não confunda com a missão.</p>`;
    const app=createApp({setup(){const texto=ref(mode==='trim'?'  Livros  ':mode==='bounds'?'AAA':'');const tentativas=ref(0);function contarEnvio(){tentativas.value+=1}return {texto,tentativas,contarEnvio,validar}},template});app.mount(el);return app;
  }
  function mountBug(el){
    const selected=el.dataset.selected || 'model';
    const fixed=el.dataset.fixed==='true';
    const text={model:['O estado não recebe a digitação.', 'Digite um assunto válido e uma mensagem. A validação ainda vê o assunto vazio.'],trim:['Espaços passam pela regra.', 'Digite quatro espaços no assunto e dez na mensagem. Sem trim, eles são contados como texto.'],early:['O pai recebe antes da validação.', 'Submeta vazio. O erro aparece, mas o total aumenta indevidamente.']};
    const snippets={model:fixed?'<input v-model="assunto" />':'<input :value="assunto" />',trim:fixed?'const dados = {\n  assunto: assunto.trim(),\n  mensagem: mensagem.trim()\n}':'const dados = {\n  assunto: assunto,\n  mensagem: mensagem\n}',early:fixed?"const resultado = validar(...)\nerros.value = resultado.erros\nif (háErro) return\nemit('recado', resultado.dados)":"emit('recado', dadosBrutos)\n// Erro: enviou antes de validar.\nconst resultado = validar(...)\nif (háErro) return"};
    el.innerHTML=`<div class="bug-tabs" role="tablist" aria-label="Bugs intencionais">${['model','trim','early'].map((x,i)=>`<button type="button" role="tab" aria-selected="${x===selected}" data-bug="${x}">${i+1} · ${['Sem v-model','Sem trim','Emit antecipado'][i]}</button>`).join('')}</div><div class="bug-layout"><div class="col"><div class="bug-brief"><strong>${fixed?'CORREÇÃO APLICADA':text[selected][0]}</strong><p>${fixed?'Teste novamente o mesmo cenário. Reiniciar restaura o bug intencional.':text[selected][1]}</p></div><div class="codebox"><div class="codehead"><span>${selected==='early'?'Ordem das operações · esquema':'Trecho isolado'}</span><b>${fixed?'CORRIGIDO':'ERRO INTENCIONAL'}</b></div><pre style="font:20px/28px var(--mono);padding:14px;white-space:pre-wrap">${escapeHtml(snippets[selected])}</pre></div><div class="bug-actions"><button type="button" class="actionbtn" data-fix>Corrigir demonstração</button></div><p class="caption">O bug fica restrito a esta demonstração.</p></div><div class="form-scene"><div class="scene-head">Teste o comportamento</div><div class="demo bug-demo"></div></div></div>`;
    const child=el.querySelector('.bug-demo');const app=mountFull(child,selected,fixed);
    el.querySelectorAll('[data-bug]').forEach(b=>b.onclick=()=>{app.unmount();el.dataset.selected=b.dataset.bug;el.dataset.fixed='false';instances.set(el,mountBug(el));});
    el.querySelector('[data-fix]').onclick=()=>{app.unmount();el.dataset.fixed='true';instances.set(el,mountBug(el));};
    return {unmount(){app.unmount()}};
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function mount(el){instances.get(el)?.unmount();if(el.dataset.mode==='bugs'){instances.set(el,mountBug(el));return;}el.innerHTML='';instances.set(el,el.dataset.mode==='full'?mountFull(el):mountSimple(el,el.dataset.mode));}
  document.querySelectorAll('[data-mode]').forEach(mount);
  const slides=[...document.querySelectorAll('.slide')];let current=0;
  function show(n){current=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',String(i!==current))});document.getElementById('counter').textContent=(current+1)+' / '+slides.length;document.getElementById('progressBar').style.width=((current+1)/slides.length*100)+'%';document.getElementById('prev').disabled=current===0;document.getElementById('next').disabled=current===slides.length-1;history.replaceState(null,'','#s'+String(current+1).padStart(2,'0'));}
  window.lessonGo=show;
  const initial=location.hash.match(/^#s(\d+)$/);show(initial?Number(initial[1])-1:0);
  function scale(){document.documentElement.style.setProperty('--scale',Math.min(window.innerWidth/1280,(window.innerHeight-60)/720));}window.addEventListener('resize',scale);scale();
  const open=id=>document.getElementById(id).showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
  document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);
  document.getElementById('indexList').innerHTML=slides.map((s,i)=>`<button type="button" data-slide="${i}">${String(i+1).padStart(2,'0')} · ${escapeHtml(s.dataset.title)}</button>`).join('');
  document.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{show(Number(b.dataset.slide));document.getElementById('indexDialog').close()});document.getElementById('indexBtn').onclick=()=>open('indexDialog');
  const notes=()=>{document.getElementById('notesText').textContent=slides[current].querySelector('.speaker-notes').content.textContent;open('notesDialog')};document.getElementById('notesBtn').onclick=notes;
  function reset(){slides[current].querySelectorAll('[data-mode]').forEach(el=>{if(el.dataset.mode==='bugs'){el.dataset.fixed='false';el.dataset.selected='model'}mount(el)});slides[current].querySelectorAll('.answer').forEach(el=>el.hidden=true);slides[current].querySelectorAll('[data-answer]').forEach(b=>{b.setAttribute('aria-expanded','false');b.textContent='Ver resposta'});toast('Demonstração deste slide reiniciada.');}document.getElementById('resetBtn').onclick=reset;
  const files={'RecadoForm.vue':`<script setup>\nimport { ref } from 'vue'\nimport { validar } from './validar-recado.js'\nconst emit = defineEmits(['recado'])\n${E.setup}\n<\/script>\n\n<template>\n${E.template}\n</template>\n\n<style scoped>\nform { display: grid; gap: 8px; }\ninput, textarea, button { font: inherit; padding: 10px; }\ninput:focus-visible, textarea:focus-visible, button:focus-visible {\n  outline: 3px solid #916015; outline-offset: 2px;\n}\n[aria-invalid="true"] { border: 2px solid #a91c28; }\n</style>`, 'validar-recado.js':E.rules, 'App.vue · exemplo isolado':`<script setup>\nimport { ref } from 'vue'\nimport RecadoForm from './components/RecadoForm.vue'\n${E.parentSetup}\n<\/script>\n\n<template>\n${E.parentTemplate}\n</template>`};
  let fileName=Object.keys(files)[0];const codeTabs=document.getElementById('codeTabs');
  function setFile(key){fileName=key;document.getElementById('fullCode').textContent=files[key];codeTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.textContent===key)))}
  for(const k of Object.keys(files)){const b=document.createElement('button');b.type='button';b.textContent=k;b.onclick=()=>setFile(k);codeTabs.append(b)}setFile(fileName);
  document.querySelectorAll('[data-open-code]').forEach(b=>b.onclick=()=>{if(files[b.dataset.openCode])setFile(b.dataset.openCode);open('codeDialog')});document.getElementById('codeBtn').onclick=()=>open('codeDialog');
  function toast(s){const t=document.getElementById('toast');t.textContent=s;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',2200)}
  document.getElementById('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(files[fileName]);toast('Arquivo do exemplo copiado.')}catch{const r=document.createRange();r.selectNodeContents(document.getElementById('fullCode'));getSelection().removeAllRanges();getSelection().addRange(r);toast('Código selecionado. Use Ctrl+C.')}};
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const a=document.getElementById(b.dataset.answer);a.hidden=!a.hidden;b.setAttribute('aria-expanded',String(!a.hidden));b.textContent=a.hidden?'Ver resposta':'Ocultar'});
  async function full(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Use a opção de tela cheia do navegador.')}}document.getElementById('fullBtn').onclick=full;document.getElementById('helpBtn').onclick=()=>open('helpDialog');
  document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,a,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['arrowright','pagedown'].includes(k)){e.preventDefault();show(current+1)}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();show(current-1)}else if(k==='home'){e.preventDefault();show(0)}else if(k==='end'){e.preventDefault();show(slides.length-1)}else if(k==='i')open('indexDialog');else if(k==='n')notes();else if(k==='r')reset();else if(k==='f')full();});
  // Todas as respostas ficam disponíveis em PDF sem alterar seu estado na tela.
  window.addEventListener('beforeprint',()=>{document.querySelectorAll('[data-mode]').forEach(mount)});
})();
