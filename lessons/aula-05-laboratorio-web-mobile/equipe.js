/**
 * Aula 05 • Identificação da equipe.
 * Uma atividade formativa por grupo, com nomes e matrículas dos integrantes.
 * Apenas dados locais: nenhuma requisição de rede é efetuada neste arquivo.
 */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const STORAGE_KEY = 'ifma-web-aula05-equipe-v1';
  const MAX = 8, MIN = 1;
  const blank = () => ({name:'',enrollment:''});
  const initial = () => ({team:'',classGroup:'',members:[blank(),blank()]});
  let group = initial();
  let fromEvidence = false;
  const box = byId('web-members');
  const modal = byId('team-dialog');
  const message = byId('team-feedback');
  const fullName = name => /^[\p{L}][\p{L}\p{M} .'\-]{2,99}$/u.test(name) &&
    name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const matricula = value => /^[A-Za-z0-9][A-Za-z0-9._/-]{4,29}$/.test(value);
  const normalized = value => String(value||'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();

  function validatePartial(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Identificação da equipe inválida.');
    if (typeof data.team !== 'string' || data.team.length > 80 ||
        typeof data.classGroup !== 'string' || data.classGroup.length > 60 ||
        !Array.isArray(data.members) || data.members.length < MIN || data.members.length > MAX)
      throw Error('Equipe, turma ou quantidade de integrantes inválidos.');
    const members = data.members.map((m,i) => {
      if (!m || typeof m !== 'object' || Array.isArray(m) ||
          typeof m.name !== 'string' || m.name.length > 100 ||
          typeof m.enrollment !== 'string' || m.enrollment.length > 30)
        throw Error('Dados incorretos para o integrante '+(i+1)+'.');
      return {name:m.name.trim(),enrollment:m.enrollment.trim()};
    });
    return {team:data.team.trim(),classGroup:data.classGroup.trim(),members};
  }
  function snapshot() {
    return {team:group.team,classGroup:group.classGroup,
      members:group.members.map(m=>({...m}))};
  }
  function getIdentity() {
    const data = validatePartial(snapshot());
    if (data.team.length < 3) throw Error('Informe o nome da equipe (mínimo 3 caracteres).');
    if (data.classGroup.length < 2) throw Error('Informe a turma da equipe.');
    const seenNames=new Set(), seenIds=new Set();
    data.members.forEach((member,i) => {
      if (!fullName(member.name)) throw Error('Informe nome e sobrenome do integrante '+(i+1)+'.');
      if (!matricula(member.enrollment)) throw Error('Informe a matrícula do integrante '+(i+1)+'.');
      const id=member.enrollment.toLowerCase(), name=normalized(member.name);
      if(seenIds.has(id) || seenNames.has(name))throw Error('Integrante repetido: confira nomes e matrículas.');
      seenIds.add(id);seenNames.add(name);
    });
    return data;
  }
  function persist() {
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));}
    catch{/* Armazenamento opcional; exportação JSON continua disponível. */}
    updateSummary();
  }
  function updateSummary() {
    const populated=group.members.filter(m=>m.name.trim());
    const caption=group.team.trim() && populated.length
      ? 'Equipe '+group.team+' · '+(group.classGroup||'turma pendente')+
        ' · integrantes: '+populated.map(m=>m.name).join('; ')
      : 'Equipe ainda não identificada. Clique “Equipe e integrantes” no cabeçalho.';
    byId('web-team-summary').textContent=caption;
    byId('team-count').textContent='('+populated.length+'/'+group.members.length+' nomes)';
  }
  function field(row,index,prop,title,limit) {
    const label=document.createElement('label');
    const input=document.createElement('input');
    const id='web-member-'+index+'-'+prop;
    label.htmlFor=id;
    label.textContent=title;
    input.id=id;
    input.type='text';
    input.maxLength=limit;
    input.autocomplete='off';
    input.required=true;
    input.dataset.index=String(index);
    input.dataset.prop=prop;
    input.value=group.members[index][prop];
    input.placeholder=prop==='name'?'Nome e sobrenome':'Matrícula individual';
    row.append(label,input);
  }
  function renderRows(focusLast=false) {
    const previousFocus=document.activeElement?.id||'';
    box.replaceChildren();
    group.members.forEach((member,index) => {
      const section=document.createElement('section');
      section.className='member-row';
      section.dataset.member=String(index);
      const heading=document.createElement('div');
      heading.className='member-row-header';
      const h=document.createElement('h4');
      h.textContent='Integrante '+(index+1);
      heading.append(h);
      const remove=document.createElement('button');
      remove.type='button';
      remove.className='btn secondary';
      remove.dataset.remove=String(index);
      remove.disabled=group.members.length<=MIN;
      remove.textContent='Remover';
      remove.setAttribute('aria-label','Remover integrante '+(index+1));
      heading.append(remove);
      section.append(heading);
      const fields=document.createElement('div');
      fields.className='member-row-fields';
      field(fields,index,'name','Nome completo',100);
      field(fields,index,'enrollment','Matrícula',30);
      section.append(fields);
      box.append(section);
    });
    byId('web-add-member').disabled=group.members.length>=MAX;
    updateSummary();
    if(focusLast)byId('web-member-'+(group.members.length-1)+'-name')?.focus({preventScroll:true});
    else if(previousFocus && byId(previousFocus))byId(previousFocus).focus({preventScroll:true});
  }
  function messageText(text,ok=false) {
    message.textContent=text;
    message.dataset.kind=ok?'success':'error';
  }
  function restore(data) {
    group=validatePartial(data);
    byId('web-team').value=group.team;
    byId('web-class').value=group.classGroup;
    renderRows();
    persist();
    messageText('Identificação carregada. Revise os integrantes antes do envio.',true);
  }
  const raw=(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{return null;}})();
  try{if(raw)group=validatePartial(raw);}catch{group=initial();}
  byId('web-team').value=group.team;
  byId('web-class').value=group.classGroup;
  renderRows();

  function open(source) {
    fromEvidence=source==='evidence';
    if(fromEvidence && byId('evidence-dialog').open)byId('evidence-dialog').close();
    modal.showModal();
    byId('web-team').focus({preventScroll:true});
  }
  byId('team-open').addEventListener('click',()=>open('header'));
  byId('team-open-evidence').addEventListener('click',()=>open('evidence'));
  byId('web-team').addEventListener('input',e=>{group.team=e.target.value;persist();});
  byId('web-class').addEventListener('input',e=>{group.classGroup=e.target.value;persist();});
  box.addEventListener('input',e=>{
    const index=Number(e.target.dataset.index);
    const prop=e.target.dataset.prop;
    if(Number.isInteger(index)&&index>=0&&index<group.members.length&&['name','enrollment'].includes(prop)){
      group.members[index][prop]=e.target.value;
      persist();
    }
  });
  box.addEventListener('click',e=>{
    const remove=e.target.closest('[data-remove]');
    if(!remove||group.members.length<=MIN)return;
    const index=Number(remove.dataset.remove);
    if(!Number.isInteger(index)||index<0||index>=group.members.length)return;
    if((group.members[index].name||group.members[index].enrollment) &&
       !confirm('Remover integrante '+(index+1)+' da equipe?'))return;
    group.members.splice(index,1);
    renderRows();
    persist();
  });
  byId('web-add-member').addEventListener('click',()=>{
    if(group.members.length>=MAX)return;
    group.members.push(blank());
    renderRows(true);
    persist();
  });
  byId('team-done').addEventListener('click',()=>{
    try{
      const data=getIdentity();
      persist();
      messageText('Equipe '+data.team+' identificada com '+data.members.length+' integrante(s).',true);
      modal.close();
      if(fromEvidence)byId('evidence-dialog').showModal();
    }catch(error){
      messageText(String(error.message||error));
    }
  });
  window.WebTeam=Object.freeze({snapshot,restore,validatePartial,getIdentity,maxMembers:MAX});
})();
