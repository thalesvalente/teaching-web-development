/** Web 3.2 — only the teacher edits Alunos directly in Sheets. All UI changes are local. */
(() => {
  'use strict';
  const cfg=window.WebEntregaConfig||{};
  if(cfg.schema!=='web-a05-submission-v3')return; // isolated legacy regression fixtures only
  const $=id=>document.getElementById(id),modal=$('team-dialog'),holder=$('web-members'),MAX=8;
  const KEY='ifma-web-aula05-roster-v1',canonical=value=>String(value||'').trim().toUpperCase();
  const blank=()=>({uid:crypto.randomUUID(),enrollment:'',name:'',token:'',state:'empty',confirmed:false,error:'',revision:0});
  let group={teamId:crypto.randomUUID(),team:'',members:[blank()]},fromEvidence=false,returnFocus=null;
  const onlineEnabled=()=>cfg.activated===true&&/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cfg.endpoint||'');
  function ensureQaNotice(){
    if(!cfg.qaMode||$('qa-lab-notice'))return;
    const notice=document.createElement('p');notice.id='qa-lab-notice';notice.setAttribute('role','status');
    notice.textContent='HOMOLOGAÇÃO QA: somente matrículas fictícias. Nenhuma informação da turma deve ser enviada.';
    notice.className='roster-qa-notice';modal.querySelector('.team-panel-body')?.prepend(notice);
  }
  ensureQaNotice();
  const qaSection=$('qa-endpoint-section');
  if(qaSection&&cfg.qaRequested){
    qaSection.hidden=false;
    const urlInput=$('qa-appscript-url'),activate=$('qa-endpoint-activate'),notice=$('qa-endpoint-status');
    activate.addEventListener('click',async()=>{
      const candidate=urlInput.value;urlInput.value='';activate.disabled=true;
      try{
        if(!await cfg.configureQa(candidate)){
          notice.textContent='URL recusada. Use somente o link /exec da implantação QA 3.2.0 autorizada.';
          return;
        }
        notice.textContent='QA conectada. Informe uma matrícula fictícia e clique em Consultar matrícula.';
        urlInput.disabled=true;activate.disabled=true;
        ensureQaNotice();render();window.WebEntrega?.refreshStatus?.();
        feedback('Recebimento QA conectado somente à planilha fictícia. Consulte a matrícula e confirme o nome.');
      }catch(_){
        notice.textContent='Não foi possível validar o endereço QA. Confira o link HTTPS e tente novamente.';
      }finally{if(!onlineEnabled())activate.disabled=false;}
    });
  }
  const text=(tag,content,cls)=>{const el=document.createElement(tag);el.textContent=content;if(cls)el.className=cls;return el;};
  function feedback(value,kind=''){ $('team-feedback').textContent=value;$('team-feedback').dataset.kind=kind; }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify({teamId:group.teamId,team:group.team,count:group.members.length}));}catch{}}
  function validatePartial(obj){
    if(!obj||typeof obj!=='object'||typeof obj.team!=='string'||obj.team.length>80||
       typeof obj.teamId!=='string'||!/^[a-f0-9-]{36}$/i.test(obj.teamId)||
       !Array.isArray(obj.members)||obj.members.length<1||obj.members.length>MAX)throw Error('Rascunho de equipe inválido.');
    return {team:obj.team.trim(),teamId:obj.teamId,members:obj.members.map(m=>{
      if(!m||typeof m!=='object'||(m.enrollment!==undefined&&(typeof m.enrollment!=='string'||m.enrollment.length>32)))throw Error('Matrícula de rascunho inválida.');
      // Imported names/confirmations/proofs are never trusted, including old JSON files.
      return {enrollment:canonical(m.enrollment),name:''};
    })};
  }
  function snapshot(){return {teamId:group.teamId,team:group.team,members:group.members.map(m=>({enrollment:m.enrollment,name:m.confirmed?m.name:''}))};}
  function restore(obj){const partial=validatePartial(obj);group={...partial,members:partial.members.map(m=>({...blank(),enrollment:m.enrollment}))};render();persist();feedback('Rascunho restaurado. Consulte e confirme novamente cada matrícula.');}
  function expireConfirmations(){
    let changed=false;
    group.members.forEach(m=>{
      if(m.state==='found'&&/^\d{13}\.[a-f0-9]{64}$/.test(m.token)&&Number(m.token.split('.')[0])<=Date.now()){
        m.name='';m.token='';m.confirmed=false;m.state='expired';
        m.error='A confirmação expirou. Consulte novamente a matrícula.';
        m.revision++;changed=true;
      }
    });
    return changed;
  }
  function ready(m){return m.state==='found'&&m.confirmed&&m.name&&(/^v2\.[a-f0-9]{64}$/.test(m.token)||(/^\d{13}\.[a-f0-9]{64}$/.test(m.token)&&Number(m.token.split('.')[0])>Date.now()));}
  function issues(requireEnrollment){
    const errors=[],seen=new Map();
    if(group.team.trim().length<3)errors.push({field:'web-team',message:'Informe o nome da equipe com pelo menos 3 caracteres.'});
    group.members.forEach((m,i)=>{
      const field='web-member-'+i+'-enrollment',prefix='Integrante '+(i+1)+' — Matrícula: '+(m.enrollment||'não informada')+'. ';
      if(requireEnrollment&&!ready(m))errors.push({field,message:prefix+'Consulte a matrícula e confirme o nome exibido.'});
      if(m.enrollment&&seen.has(m.enrollment))errors.push({field,message:prefix+'Matrícula já incluída no integrante '+(seen.get(m.enrollment)+1)+'.'});
      seen.set(m.enrollment,i);
    });return errors;
  }
  function getIdentity({requireEnrollment=true}={}){
    const errors=issues(requireEnrollment);if(errors.length){const e=Error(errors.map(x=>x.message).join('\n'));e.issues=errors;throw e;}
    return {team:group.team.trim(),teamId:group.teamId,members:group.members.map(m=>({enrollment:m.enrollment,name:m.confirmed?m.name:'Nome não conferido (rascunho local)'}))};
  }
  function submissionIdentity(expected){
    const current=getIdentity();if(expected&&JSON.stringify(current)!==JSON.stringify(expected))throw Error('A identificação mudou. Confira os integrantes antes de enviar.');
    return {team:current.team,teamId:group.teamId,members:group.members.map(m=>({enrollment:m.enrollment,confirmationToken:m.token,confirmed:true}))};
  }
  function open(source){fromEvidence=source==='evidence';returnFocus=document.activeElement;if(fromEvidence&&$('evidence-dialog').open)$('evidence-dialog').close();if(!modal.open)modal.showModal();$('web-team').focus();}
  function requireIdentity(options={}){if(expireConfirmations())render();try{return getIdentity(options);}catch(error){if(!modal.open)open($('evidence-dialog').open?'evidence':'header');feedback(error.message,'error');for(const issue of error.issues||[])$(issue.field)?.setAttribute('aria-invalid','true');const target=$(error.issues?.[0]?.field);target?.focus();target?.scrollIntoView({block:'nearest'});return null;}}
  function summary(){
    const active=onlineEnabled();
    const count=group.members.filter(ready).length;
    const pct=Math.round((count+(group.team.trim().length>=3?1:0))/(group.members.length+1)*100);
    $('team-progress').setAttribute('aria-valuenow',String(pct));
    $('team-progress-fill').style.width=pct+'%';
    $('team-progress-caption').textContent=active
      ? 'Confirme o nome de cada matrícula consultada'
      : 'Prévia isolada: nenhuma matrícula pode ser consultada';
    $('team-progress-label').textContent=active?count+'/'+group.members.length+' confirmados':'Rascunho local';
    $('team-members-count').textContent=group.members.length+'/'+MAX;
    $('team-count').textContent=active?'('+count+' confirmados)':'(modo teste)';
    $('team-remaining').textContent=group.members.length>=MAX?'Limite atingido':(MAX-group.members.length)+' vagas';
    $('team-summary-title').textContent=active
      ? (pct===100?'Identificação pronta para enviar':'Identificação em andamento')
      : 'Rascunho local (sem envio)';
    const names=group.members.filter(ready).map(m=>m.name).join('; ');
    $('team-summary-copy').textContent=active
      ? (names||'O nome será mostrado após consultar a matrícula. Somente o professor altera o cadastro.')
      : 'Os nomes não podem ser consultados nesta prévia. Nenhuma matrícula será confirmada ou enviada.';
    $('web-team-summary').textContent=active
      ? (group.team?'Equipe '+group.team+' · '+count+' integrante(s) confirmado(s)'+(names?': '+names:''):'Identifique a equipe e consulte as matrículas.')
      : (group.team?'Equipe '+group.team+' · rascunho sem nomes confirmados':'Prévia isolada · nenhuma equipe enviada.');
    $('web-add-member').disabled=group.members.length>=MAX;
  }
  function render(focusId){
    holder.replaceChildren(...group.members.map((m,i)=>{
      const section=text('section','', 'member-row roster-member'),head=text('div','', 'member-row-header');
      head.append(text('span',String(i+1).padStart(2,'0'),'team-member-number'),text('h4','Integrante '+(i+1)));
      const remove=text('button','×','team-remove-member');remove.type='button';remove.disabled=group.members.length===1;
      remove.setAttribute('aria-label','Remover integrante '+(i+1)+' desta equipe local');remove.onclick=()=>{m.revision++;group.members.splice(i,1);render();persist();};
      const fields=text('div','','member-row-fields'),label=text('label','Matrícula completa · integrante '+(i+1));
      const input=document.createElement('input');input.type='text';input.inputMode='text';input.autocomplete='off';input.setAttribute('autocapitalize','characters');input.spellcheck=false;
      input.id='web-member-'+i+'-enrollment';input.maxLength=32;input.value=m.enrollment;input.readOnly=m.state==='found'||m.state==='loading';
      input.setAttribute('aria-required',String(onlineEnabled()));input.setAttribute('aria-describedby',input.id+'-hint '+input.id+'-error');label.htmlFor=input.id;
      const hint=text('small','Inclua o ponto, as letras ITA e todos os algarismos.');hint.id=input.id+'-hint';
      const error=text('small',m.error,'member-error');error.id=input.id+'-error';error.hidden=!m.error;error.setAttribute('role','status');
      if(m.error)input.setAttribute('aria-invalid','true');
      input.oninput=()=>{m.enrollment=canonical(input.value);m.name='';m.token='';m.confirmed=false;m.error='';m.state='empty';m.revision++;input.removeAttribute('aria-invalid');error.hidden=true;summary();};
      const renewing=m.state==='found';
      const lookup=text('button',m.state==='loading'?'Consultando…':renewing?'Nova consulta':m.state==='expired'?'Consultar novamente':'Consultar matrícula','btn roster-lookup');
      lookup.type='button';lookup.id='web-member-'+i+'-lookup';
      lookup.dataset.mode=renewing?'renew':'lookup';
      lookup.disabled=m.state==='loading'||!onlineEnabled();
      if(!onlineEnabled())lookup.title='Consulta de matrícula desativada nesta prévia de testes';
      lookup.onclick=()=>{
        if(renewing){
          // Nova consulta é a única forma de liberar a matrícula já confirmada.
          // Descartar a confirmação local antes de editar evita identidades antigas.
          m.name='';m.token='';m.confirmed=false;m.error='';m.state='empty';m.revision++;
          render('web-member-'+i+'-enrollment');
          feedback('Matrícula liberada para edição. Se necessário, altere-a e clique em Consultar matrícula.');
        }else lookupMember(m,i);
      };
      const result=text('p',m.name||'Nome não consultado','roster-name');result.id='web-member-'+i+'-name';result.setAttribute('role','status');result.setAttribute('aria-live','polite');
      fields.append(label,input,hint,error,lookup);
      if(m.name){
        const card=text('div','','roster-identity-card');
        card.append(text('strong','Nome cadastrado (somente leitura)','roster-identity-caption'),result);
        fields.append(card);
      }else fields.append(result);
      if(m.name){
        const note=text('p','','roster-name-advice');
        note.id='web-member-'+i+'-name-advice';note.setAttribute('role','note');
        note.append(text('strong','Nome incorreto? '),
          text('span','Não confirme. Procure o professor para corrigir o cadastro; nenhuma alteração é feita aqui.'));
        fields.append(note);
        const row=text('label','','roster-confirm'),checkbox=document.createElement('input');checkbox.type='checkbox';
        checkbox.id='web-member-'+i+'-confirm';checkbox.checked=m.confirmed;
        checkbox.onchange=()=>{m.confirmed=checkbox.checked;summary();};
        const confirmHint=text('small',/^v2\.[a-f0-9]{64}$/.test(m.token)?
          'A confirmação permanece válida nesta sessão enquanto o cadastro docente e a matrícula não forem alterados.':
          'Confirmação temporária da versão anterior: válida por 15 minutos. Após atualizar o receptor QA, consulte esta matrícula uma vez para obter a confirmação permanente.','roster-confirm-hint');
        confirmHint.id='web-member-'+i+'-confirm-hint';
        checkbox.setAttribute('aria-describedby',note.id+' '+confirmHint.id);
        row.append(checkbox,text('span','Confirmo que o nome exibido corresponde à matrícula informada.'));
        fields.append(row,confirmHint);
      }
      section.append(head,fields,remove);return section;
    }));
    $('web-team').value=group.team;summary();if(focusId){$(focusId)?.focus();$(focusId)?.scrollIntoView({block:'nearest'});}
  }
  async function lookupMember(m,i){
    m.enrollment=canonical(m.enrollment);m.error='';m.name='';m.token='';m.confirmed=false;
    if(!/^[0-9]{8}\.ITA[0-9]{4}$/.test(m.enrollment)){m.state='error';m.error='Informe a matrícula completa com ponto e letras ITA.';render('web-member-'+i+'-enrollment');return;}
    if(group.members.some(x=>x!==m&&x.enrollment===m.enrollment)){m.state='error';m.error='Esta matrícula já foi incluída em outro integrante.';render('web-member-'+i+'-enrollment');return;}
    m.state='loading';const revision=++m.revision,teamId=group.teamId;render();
    try{
      const reply=await window.WebRosterClient.lookup(m.enrollment,teamId);
      if(!group.members.includes(m)||m.revision!==revision||group.teamId!==teamId)return;
      m.name=reply.name;m.token=reply.confirmationToken;m.state='found';render('web-member-'+group.members.indexOf(m)+'-confirm');
      feedback('Nome localizado. Confira o nome e marque a confirmação.');
    }catch(error){if(!group.members.includes(m)||m.revision!==revision)return;m.state='error';m.error=String(error.message||'Consulta indisponível.');render('web-member-'+group.members.indexOf(m)+'-enrollment');feedback(m.error,'error');}
  }
  function showRemoteConflict(meta){const m=group.members[meta.memberIndex];if(m){m.confirmed=false;m.token='';m.name='';m.state='error';m.revision++;m.error=String(meta.message||'Consulte novamente a matrícula.');}render();open('evidence');feedback(String(meta.message||'Consulte o professor.'),'error');$('web-member-'+meta.memberIndex+'-enrollment')?.focus();}
  $('web-team').addEventListener('input',e=>{group.team=e.target.value;summary();persist();});
  $('team-open').addEventListener('click',()=>open('header'));$('team-open-evidence').addEventListener('click',()=>open('evidence'));
  $('web-add-member').addEventListener('click',()=>{if(group.members.length<MAX){group.members.push(blank());render('web-member-'+(group.members.length-1)+'-enrollment');persist();}});
  $('team-done').addEventListener('click',()=>{if(requireIdentity({requireEnrollment:onlineEnabled()})){persist();modal.close();}});
  modal.addEventListener('close',()=>{if(!fromEvidence)return;fromEvidence=false;if(!$('evidence-dialog').open)$('evidence-dialog').showModal();(returnFocus?.isConnected?returnFocus:$('team-open-evidence'))?.focus();});
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved.team==='string'&&/^[a-f0-9-]{36}$/i.test(saved.teamId)){group.team=saved.team.slice(0,80);group.teamId=saved.teamId;group.members=Array.from({length:Math.min(8,Math.max(1,Number(saved.count)||1))},blank);}}catch{}
  // Old localStorage could contain typed names from 3.1. Clear identity-only keys, not task progress.
  try{localStorage.removeItem('ifma-web-aula05-equipe-v3');localStorage.removeItem('ifma-web-aula05-equipe-v2');}catch{}
  render();window.WebTeam=Object.freeze({snapshot,restore,validatePartial,getIdentity,requireIdentity,showRemoteConflict,submissionIdentity,get onlineEnabled(){return onlineEnabled();},maxMembers:MAX,rosterReadOnly:true});
})();
