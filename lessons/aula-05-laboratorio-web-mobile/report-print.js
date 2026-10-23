/**
 * Aula 05 — documento A4 da evidência formativa.
 * Identidade institucional do IFMA compatível com fichas de Mobile/PPI:
 * verde #006b3c, vermelho #d71920, capa, resultado, rubrica e rodapé.
 * DOM-only: todo conteúdo fornecido pelo estudante usa textContent.
 * O relatório é para imprimir/salvar como PDF; não envia dados à rede.
 */
(() => {
  'use strict';
  const EXPECTED_SCHEMA='ifma-web-aula05-lab-v4';
  const CYCLES=Object.freeze([
    'Ciclo 1 — Conhecer o aplicativo',
    'Ciclo 2 — Modificar e comparar',
    'Ciclo 3 — Testar e explicar'
  ]);
  function add(parent,tag,cls,text) {
    const node=parent.ownerDocument.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined&&text!==null)node.textContent=String(text);
    parent.appendChild(node);
    return node;
  }
  function infoRow(parent,label,value) {
    const row=add(parent,'div','doc-info-row');
    add(row,'dt','doc-info-label',label);
    add(row,'dd','doc-info-value',value);
    return row;
  }
  function safeText(text,fallback='Não informado') {
    if(typeof text!=='string')return fallback;
    const value=text.trim();
    return value?value:fallback;
  }
  function prepare(root,snapshot,identity={},date=new Date()) {
    if(!root||typeof root.replaceChildren!=='function')
      throw Error('Área de impressão indisponível.');
    if(!snapshot||snapshot.schema!==EXPECTED_SCHEMA||
       !Array.isArray(snapshot.exercicios)||snapshot.exercicios.length!==14||
       !Number.isInteger(snapshot.xp)||snapshot.maximoXp!==100||
       snapshot.xp<0||snapshot.xp>100)
      throw Error('Pontuação ou estrutura do relatório incompatível.');
    const total=snapshot.exercicios.length;
    const done=snapshot.exercicios.filter(item=>item.estado==='APROVADO').length;
    const pending=total-done;
    const sum=snapshot.exercicios.reduce((acc,item)=>acc+(Number(item.xp)||0),0);
    if(sum!==snapshot.xp)throw Error('Pontuação do relatório inconsistente.');
    const localeDate=date instanceof Date&&!Number.isNaN(date.getTime())?date:new Date();
    const when=new Intl.DateTimeFormat('pt-BR',{
      dateStyle:'short',timeStyle:'short',timeZone:'America/Fortaleza'
    }).format(localeDate);
    const article=root.ownerDocument.createElement('article');
    article.className='doc-report';
    article.setAttribute('aria-label','Relatório de aprendizagem da equipe — Aula 05');
    // Capa institucional — mesma identidade das fichas existentes.
    const cover=add(article,'header','doc-cover');
    add(cover,'div','doc-top-rule');
    const identityLine=add(cover,'div','doc-institution-row');
    add(identityLine,'div','doc-wordmark','IFMA');
    const institution=add(identityLine,'div','doc-institution');
    add(institution,'strong',null,'INSTITUTO FEDERAL DO MARANHÃO');
    add(institution,'span',null,'Campus Itapecuru-Mirim');
    add(institution,'span','doc-course','Técnico em Informática Integrado ao Ensino Médio');
    add(institution,'span','doc-discipline','INF031 — Desenvolvimento de Sistemas Web');
    const edition=add(identityLine,'div','doc-edition');
    add(edition,'span',null,'AULA 05');
    add(edition,'strong',null,'2026.2');
    add(cover,'p','doc-eyebrow','REGISTRO INDIVIDUAL DE APRENDIZAGEM  |  AULA 05');
    add(cover,'h1',null,'Relatório de aprendizagem');
    add(cover,'p','doc-subtitle','Laboratório Vivo — Tutorial Web e Mobile');
    add(cover,'p','doc-status',pending?'RELATÓRIO PARCIAL':'RELATÓRIO CONCLUÍDO');
    const metadata=add(cover,'dl','doc-metadata');
    const members=Array.isArray(identity.members)
      ? identity.members.map(m=>typeof m==='string'?m:m?.name).filter(v=>typeof v==='string'&&v.trim())
      : [];
    infoRow(metadata,'Equipe',safeText(identity.team,'Não informada'));
    infoRow(metadata,'Integrantes (nomes)',members.length?members.join('; '):'Não informados');
    infoRow(metadata,'Quantidade de integrantes',members.length||'Não informada');
    infoRow(metadata,'Docente','Prof. Dr. Thales Levi Azevedo Valente');
    infoRow(metadata,'Emissão (BRT)',when);
    const control=add(cover,'div','doc-control');
    add(control,'p',null,'Controle documental: WEB-A05-LV-2026');
    add(control,'p',null,'Versão do relatório: 1.0.0');
    add(control,'p',null,'Natureza: registro de equipe; progresso formativo declarado e testado localmente.');
    // Progresso formativo — não é nota acadêmica.
    const score=add(article,'section','doc-score');
    add(score,'p','doc-score-label','RESULTADO FORMATIVO DO LABORATÓRIO');
    const scoreLine=add(score,'div','doc-score-line');
    const big=add(scoreLine,'strong','doc-score-number',snapshot.xp+' / 100 XP');
    big.setAttribute('data-report-xp',String(snapshot.xp));
    const details=add(scoreLine,'div','doc-score-summary');
    add(details,'span',null,done+' de '+total+' missões concluídas');
    add(details,'span',null,pending+' pendentes');
    const track=add(score,'div','doc-score-track');
    track.setAttribute('aria-label','XP formativos: '+snapshot.xp+' de 100');
    const fill=add(track,'div','doc-score-fill');
    fill.style.width=snapshot.xp+'%';
    add(score,'p','doc-score-note',
      'Pontuação de acompanhamento, não constitui nota oficial. '+
      'Questões e missões pendentes permanecem com zero ponto, sem reduzir o máximo de 100 XP.');
    // Quadro por ciclo com status e pontos presentes no instante da geração.
    const section=add(article,'section','doc-section doc-missions-section');
    add(section,'h2',null,'1. Situação das missões');
    add(section,'p','doc-section-lead',
      'Registro do progresso observado no momento da geração. '+
      'A exportação não preenche exercícios nem atribui pontos adicionais.');
    const table=add(section,'table','doc-missions');
    table.setAttribute('aria-label','Resultados das 14 missões');
    const thead=add(table,'thead');
    const row=add(thead,'tr');
    for(const label of ['Nº','Missão','Situação','XP']) {
      const th=add(row,'th',null,label);th.setAttribute('scope','col');
    }
    const tbody=add(table,'tbody');
    snapshot.exercicios.forEach((item,index)=>{
      if(index===0||item.ciclo!==snapshot.exercicios[index-1].ciclo) {
        const phase=add(tbody,'tr','doc-cycle-row');
        const header=add(phase,'th',null,CYCLES[Number(item.ciclo)-1]||('Ciclo '+item.ciclo));
        header.colSpan=4;header.setAttribute('scope','colgroup');
      }
      const tr=add(tbody,'tr','doc-mission-row');
      add(tr,'td','doc-col-index',String(index+1).padStart(2,'0'));
      add(tr,'td','doc-col-title',safeText(item.titulo,'Missão sem título'));
      const statusCell=add(tr,'td','doc-col-status');
      add(statusCell,'span',item.estado==='APROVADO'?'doc-ok':'doc-pending',
        item.estado==='APROVADO'?'Concluída':'Pendente');
      add(tr,'td','doc-col-xp',String(item.xp)+' / '+String(item.maximoXp));
    });
    const finalRow=add(tbody,'tr','doc-total');
    const caption=add(finalRow,'th',null,'Total formativo');
    caption.colSpan=3;
    add(finalRow,'td',null,snapshot.xp+' / 100');
    // Reflexões preservam quebras de linha e perguntas em branco.
    const reflections=add(article,'section','doc-section doc-reflections');
    add(reflections,'h2',null,'2. Reflexões e evidências');
    const fields=[
      ['O que mudou no código e o que aconteceu nas duas prévias?',snapshot.observacao],
      ['O que ainda deve ser testado em um celular real?',snapshot.testeNativoPendente]
    ];
    fields.forEach(([label,text])=>{
      const field=add(reflections,'div','doc-field');
      add(field,'h3',null,label);
      const missing=typeof text!=='string'||!text.trim();
      const p=add(field,'p',missing?'doc-unanswered':'doc-answer',safeText(text,'Não respondido'));
      p.setAttribute('data-answer-status',missing?'pending':'answered');
    });
    const limits=add(article,'section','doc-section doc-limits');
    add(limits,'h2',null,'3. Condições do registro');
    const notes=add(limits,'ul');
    for(const text of [
      'A prévia de largura móvel é executada por React Native Web, não por Android/iOS nativo.',
      'Compartilhar código entre as duas prévias não sincroniza seus estados.',
      'Os XP refletem verificações formativas locais e não equivalem a nota institucional.',
      'O relatório foi gerado localmente. Salvar PDF não comprova entrega no Google Sheets.'
    ])add(notes,'li',null,text);
    const end=add(article,'footer','doc-end');
    add(end,'p',null,'IFMA · Desenvolvimento Web · Aula 05 · 2026.2');
    add(end,'p',null,'Documento gerado no Laboratório Vivo em '+when+' (BRT).');
    root.replaceChildren(article);
    root.setAttribute('data-report-state',pending?'partial':'complete');
    root.setAttribute('data-report-xp',String(snapshot.xp));
    return {xp:snapshot.xp,total,done,pending};
  }
  window.WebLabReport=Object.freeze({prepare,version:'1.0.0'});
})();
