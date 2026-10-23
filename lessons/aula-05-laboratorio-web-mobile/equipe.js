/**
 * Aula 05 · Identificação coletiva com matrícula obrigatória para entrega online.
 * Identidade individual: nome completo + matrícula textual; até 8 integrantes.
 * O ID aleatório é técnico, criado automaticamente e salvo no checkpoint;
 * não é um identificador pessoal nem autenticação de estudantes.
 */
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const KEY='ifma-web-aula05-equipe-v3';
  const LEGACY_KEY='ifma-web-aula05-equipe-v2';
  const MAX=8;
  const config=window.WebEntregaConfig||{};
  // Config já carregada: não depender da inicialização posterior de WebEntrega.
  const onlineEnabled=config.activated===true && config.schema==='web-a05-submission-v2' &&
    /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(config.endpoint||''));
  const blank=()=>({name:'',enrollment:''});
  function newId(){
    if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
    const data=new Uint8Array(16);
    crypto.getRandomValues(data);
    data[6]=(data[6]&15)|64;
    data[8]=(data[8]&63)|128;
    const h=Array.from(data,n=>n.toString(16).padStart(2,'0')).join('');
    return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');
  }
  const fresh=()=>({teamId:newId(),team:'',members:[blank()]});
  let group=fresh();
  let openedFromEvidence=false;
  let returnFocus=null;
  const modal=el('team-dialog'),holder=el('web-members'),status=el('team-feedback');
  const fullName=name=>{
    const value=String(name||'').trim();
    if(value.length<5||value.length>100||!/^[\p{L}\p{M}'’\-\s]+$/u.test(value))return false;
    const parts=value.split(/\s+/);
    return parts.length>=2 && parts.every(part=>{
      if(!/^[\p{L}][\p{L}\p{M}'’\-]*$/u.test(part))return false;
      const segments=part.split(/[-'’]/);
      // D'Ávila e O'Connor são sobrenomes completos legítimos; B-C não é.
      return segments.every(segment=>segment.length>0) &&
        segments.some(segment=>(segment.match(/\p{L}/gu)||[]).length>=2);
    });
  };
  const normalized=value=>String(value||'').trim().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLowerCase();

  function validatePartial(obj){
    if(!obj||typeof obj!=='object'||Array.isArray(obj) ||
       typeof obj.teamId!=='string' ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.teamId) ||
       typeof obj.team!=='string'||obj.team.length>80 ||
       !Array.isArray(obj.members)||obj.members.length<1||obj.members.length>MAX)
      throw Error('Identificação da equipe inválida.');
    const members=obj.members.map((member,index)=>{
      if(!member||typeof member!=='object'||Array.isArray(member)||
         typeof member.name!=='string'||member.name.length>100)
        throw Error('Nome inválido do integrante '+(index+1)+'.');
      return {name:member.name.trim(), enrollment:typeof member.enrollment==='string'?member.enrollment.trim():''};
    });
    return {teamId:obj.teamId,team:obj.team.trim(),members};
  }
  function snapshot(){
    return {teamId:group.teamId,team:group.team,
      members:group.members.map(member=>({name:member.name,enrollment:member.enrollment}))};
  }
  function collectIssues(data,{requireEnrollment=true}={}){
    const issues=[],seenNames=new Map(),seenEnrollments=new Map();
    const add=(message,fields)=>issues.push({message,fields});
    if(data.team.length<3)add('Informe o nome da equipe (mínimo 3 caracteres).',['web-team']);
    data.members.forEach((member,index)=>{
      const nameId='web-member-'+index+'-name',matId='web-member-'+index+'-enrollment';
      const who='Integrante '+(index+1)+' — Nome informado: '+(member.name||'(não informado)')+
        ' · Matrícula informada: '+(member.enrollment||'(não informada)')+'. ';
      if(!fullName(member.name))add(who+'Informe nome e sobrenome do integrante '+(index+1)+'.',[nameId]);
      const key=normalized(member.name);
      if(key && seenNames.has(key)){
        const old=seenNames.get(key);
        add(who+'Nome duplicado: integrantes '+(old+1)+' e '+(index+1)+'. Confira os nomes; homônimos precisam de conferência docente.',
          ['web-member-'+old+'-name',nameId]);
      }else if(key)seenNames.set(key,index);
      if(requireEnrollment){
        if(!member.enrollment)add(who+'Matrícula obrigatória. Informe a matrícula deste integrante.',[matId]);
        else if(!/^\d{1,32}$/.test(member.enrollment))
          add(who+'Matrícula em formato inválido. Use somente algarismos (até 32), mantendo zeros iniciais.',[matId]);
        if(member.enrollment && seenEnrollments.has(member.enrollment)){
          const old=seenEnrollments.get(member.enrollment);
          add('Matrícula repetida nos integrantes '+(old+1)+' ('+data.members[old].name+' — '+member.enrollment+
            ') e '+(index+1)+' ('+member.name+' — '+member.enrollment+'). Cada integrante deve informar a própria matrícula.',
            ['web-member-'+old+'-enrollment',matId]);
        }else if(member.enrollment)seenEnrollments.set(member.enrollment,index);
      }
    });
    return issues;
  }
  function getIdentity(options={}){
    const data=validatePartial(snapshot()),issues=collectIssues(data,options);
    if(issues.length){const error=Error(issues.map(x=>x.message).join('\n\n'));error.issues=issues;throw error;}
    return data;
  }
  function focusInvalid({issues=null,memberIndices=null,field=null,requireEnrollment=onlineEnabled}={}){
    const list=issues||collectIssues(validatePartial(snapshot()),{requireEnrollment});
    const byField=new Map();
    list.forEach(issue=>issue.fields.forEach(id=>{
      if(!byField.has(id))byField.set(id,[]);byField.get(id).push(issue.message);
    }));
    if(Array.isArray(memberIndices))memberIndices.forEach(i=>{
      if(Number.isInteger(i)&&i>=0&&i<group.members.length){
        const kinds=field?[field]:['name','enrollment'];
        kinds.forEach(kind=>byField.set('web-member-'+i+'-'+kind,['Confira o conflito descrito no resumo.']));
      }
    });
    clearValidity();
    const inputs=[el('web-team'),...holder.querySelectorAll('input')];
    let target=null;
    inputs.forEach(input=>{
      const messages=byField.get(input.id);if(!messages)return;
      input.setAttribute('aria-invalid','true');
      const hint=el(input.id+'-error');
      if(hint){hint.textContent=messages.join(' ');hint.hidden=false;}
      const descriptions=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);
      descriptions.push(hint?hint.id:'team-feedback');
      input.setAttribute('aria-describedby',[...new Set(descriptions)].join(' '));
      if(!target)target=input;
    });
    if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
  }
  function showRemoteConflict(meta){
    if(!meta||!Number.isInteger(meta.memberIndex))return;
    if(!modal.open)open(el('evidence-dialog').open?'evidence':'header');
    const member=meta.submittedMember||group.members[meta.memberIndex];
    feedback('Erro na identificação — integrante '+(meta.memberIndex+1)+'.\n'+
      (member?'Nome informado: '+member.name+'\nMatrícula informada: '+member.enrollment+'\n':'')+
      'Problema: '+String(meta.message||'Confira os dados.')+'\n'+
      'Como resolver: '+String(meta.action||'Procure o professor.'),'error');
    focusInvalid({issues:[],memberIndices:[meta.memberIndex],field:meta.field});
  }
  function summary(){
    const names=group.members.map(x=>x.name.trim()).filter(Boolean);
    const requireEnrollment=onlineEnabled;
    const ready=group.members.filter(m=>fullName(m.name)&&(!requireEnrollment||/^\d{1,32}$/.test(m.enrollment||''))).length;
    const teamValid=group.team.trim().length>=3;
    const pct=Math.round(((teamValid?1:0)+ready)/(group.members.length+1)*100);
    let complete=false;
    try{getIdentity({requireEnrollment});complete=true;}catch{/* validação completa exibida ao concluir */}
    el('team-members-count').textContent=names.length+'/'+MAX;
    el('team-remaining').textContent=group.members.length>=MAX
      ? 'Limite atingido' : (MAX-group.members.length)+' vagas restantes';
    el('team-progress').setAttribute('aria-valuenow',String(pct));
    el('team-progress-fill').style.width=pct+'%';
    el('team-progress-label').textContent=complete?'Pronto para concluir':pct===100?'Revise os integrantes':pct+'% preenchido';
    el('team-progress-caption').textContent=complete
      ? 'A equipe está identificada' : 'Complete o nome da equipe e os integrantes';
    el('team-summary-title').textContent=complete?(onlineEnabled?'Identificação pronta para enviar':'Identificação pronta para PDF local'):'Identificação em andamento';
    el('team-summary-copy').textContent=complete
      ? group.team+' · '+names.length+' integrante(s): '+names.join(', ')
      : 'Seus nomes serão incluídos no PDF e no JSON de progresso.';
    el('team-count').textContent='('+names.length+' nome'+(names.length===1?'':'s')+')';
    el('web-team-summary').textContent=group.team&&names.length
      ? 'Equipe '+group.team+' · '+names.length+' integrante(s): '+names.join('; ')
      : 'Equipe ainda não identificada. Use “Equipe e integrantes” no cabeçalho.';
  }
  function clearValidity(){
    el('web-team').removeAttribute('aria-invalid');
    holder.querySelectorAll('input[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
    [el('web-team'),...holder.querySelectorAll('input')].forEach(input=>{
      const ids=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!=='team-feedback'&&!id.endsWith('-error'));
      if(ids.length)input.setAttribute('aria-describedby',ids.join(' '));else input.removeAttribute('aria-describedby');
    });
    holder.querySelectorAll('.member-error').forEach(node=>{node.hidden=true;node.textContent='';});
  }
  function persist(){
    try{
      const safe=snapshot();
      // Nunca persistir matrículas automaticamente no armazenamento do navegador.
      safe.members=safe.members.map(member=>({name:member.name}));
      localStorage.setItem(KEY,JSON.stringify(safe));
    }catch{/* armazenamento opcional */}
    summary();
  }
  function feedback(text,kind=''){
    status.textContent=text;
    status.dataset.kind=kind;
  }
  function memberInput(index){
    const member=group.members[index];
    const article=document.createElement('section');
    article.className='member-row';
    const heading=document.createElement('div');
    heading.className='member-row-header';
    const title=document.createElement('h4');
    title.textContent='Integrante '+(index+1);
    const number=document.createElement('span');
    number.className='team-member-number';
    number.textContent=String(index+1).padStart(2,'0');
    number.setAttribute('aria-hidden','true');
    const remove=document.createElement('button');
    remove.type='button';remove.className='team-remove-member';
    remove.textContent='×';
    remove.title='Remover integrante '+(index+1);
    remove.dataset.remove=String(index);
    remove.disabled=group.members.length<=1;
    remove.setAttribute('aria-label','Remover integrante '+(index+1));
    heading.append(number,title);
    const fields=document.createElement('div');
    fields.className='member-row-fields';
    const label=document.createElement('label');
    label.textContent='Nome completo · integrante '+(index+1);
    const input=document.createElement('input');
    input.type='text';
    input.id='web-member-'+index+'-name';
    label.htmlFor=input.id;
    input.dataset.index=String(index);
    input.value=member.name;
    input.placeholder='Nome e sobrenome';
    input.autocomplete='name';
    input.maxLength=100;
    input.required=true;
    const labelMat=document.createElement('label');
    labelMat.textContent='Matrícula acadêmica · integrante '+(index+1);
    const inputMat=document.createElement('input');
    inputMat.type='text';inputMat.inputMode='numeric';inputMat.autocomplete='off';
    inputMat.id='web-member-'+index+'-enrollment';
    inputMat.dataset.index=String(index);inputMat.dataset.field='enrollment';
    inputMat.maxLength=32;inputMat.required=onlineEnabled;inputMat.setAttribute('aria-required',String(onlineEnabled));
    inputMat.value=member.enrollment||'';inputMat.placeholder='Ex.: número da matrícula';
    labelMat.htmlFor=inputMat.id;
    const help=document.createElement('small');
    help.id=inputMat.id+'-help';help.textContent='Obrigatória para envio; zeros iniciais devem ser mantidos.';
    inputMat.setAttribute('aria-describedby',help.id);
    input.dataset.field='name';
    const nameError=document.createElement('small'),matError=document.createElement('small');
    nameError.id=input.id+'-error';matError.id=inputMat.id+'-error';
    for(const error of [nameError,matError]){error.className='member-error';error.hidden=true;}
    fields.append(label,input,nameError,labelMat,inputMat,help,matError);
    article.append(heading,fields,remove);
    return article;
  }
  function render(focusLast=false){
    holder.replaceChildren(...group.members.map((_,i)=>memberInput(i)));
    el('web-add-member').disabled=group.members.length>=MAX;
    el('web-team').value=group.team;
    clearValidity();
    summary();
    if(focusLast)el('web-member-'+(group.members.length-1)+'-name')?.focus({preventScroll:true});
  }
  function restore(obj){
    const candidate=validatePartial(obj);
    group=candidate;
    render();
    persist();
    feedback('Identificação da equipe restaurada. Revise nomes e matrículas antes da entrega.','success');
  }
  let local=null;
  try{local=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'null');}catch{/* rascunho inválido */}
  try{if(local)group=validatePartial(local);}catch{group=fresh();}
  render();
  function open(source){
    openedFromEvidence=source==='evidence';
    returnFocus=openedFromEvidence?document.activeElement:null;
    if(openedFromEvidence&&el('evidence-dialog').open)el('evidence-dialog').close();
    modal.showModal();
    el('web-team').focus({preventScroll:true});
  }
  function requireIdentity(options={}){
    try{return getIdentity(options);}
    catch(error){
      if(!modal.open)open(el('evidence-dialog').open?'evidence':'header');
      feedback('Para gerar PDF e enviar: '+String(error?.message||error),'error');
      focusInvalid({issues:error.issues,requireEnrollment:options.requireEnrollment!==false});
      return null;
    }
  }
  modal.addEventListener('close',()=>{
    // Escape, fechar ×, backdrop e conclusão devolvem o foco à ação de origem
    // quando a identificação começou no diálogo de evidências.
    const restore=openedFromEvidence;
    openedFromEvidence=false;
    if(!restore)return;
    const evidence=el('evidence-dialog');
    if(!evidence.open)evidence.showModal();
    const target=returnFocus?.isConnected&&evidence.contains(returnFocus)
      ?returnFocus:el('team-open-evidence');
    returnFocus=null;
    target?.focus({preventScroll:true});
  });
  el('team-open').addEventListener('click',()=>open('header'));
  el('team-open-evidence').addEventListener('click',()=>open('evidence'));
  el('web-team').addEventListener('input',event=>{
    group.team=event.target.value;clearValidity();persist();
  });
  holder.addEventListener('input',event=>{
    const i=Number(event.target.dataset.index);
    if(Number.isInteger(i)&&i>=0&&i<group.members.length){
      const key=event.target.dataset.field==='enrollment'?'enrollment':'name';
      group.members[i][key]=event.target.value;clearValidity();persist();
    }
  });
  holder.addEventListener('click',event=>{
    const button=event.target.closest('[data-remove]');
    if(!button||group.members.length<=1)return;
    const i=Number(button.dataset.remove);
    if(!Number.isInteger(i)||i<0||i>=group.members.length)return;
    if(group.members[i].name.trim()&&!confirm('Remover este integrante da equipe?'))return;
    group.members.splice(i,1);
    render();
    persist();
  });
  el('web-add-member').addEventListener('click',()=>{
    if(group.members.length>=MAX)return;
    group.members.push(blank());
    render(true);
    persist();
  });
  el('team-done').addEventListener('click',()=>{
    try{
      const data=getIdentity({requireEnrollment:onlineEnabled});
      persist();
      clearValidity();
      feedback('Equipe '+data.team+' identificada com '+data.members.length+' integrante(s).','success');
      modal.close();
    }catch(e){feedback(String(e.message||e),'error');focusInvalid({issues:e.issues});}
  });
  window.WebTeam=Object.freeze({snapshot,restore,validatePartial,getIdentity,requireIdentity,showRemoteConflict,onlineEnabled,maxMembers:MAX});
})();
