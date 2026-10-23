#!/usr/bin/env node
/**
 * Smoke POST REAL para desenvolvimento-web-2026.
 * Inerte por padrão: --dry-run não faz rede; --confirm-write + --url /exec
 * são OBRIGATÓRIOS para escrever um registro FICTÍCIO na planilha.
 * Um recebimento válido não equivale à identidade ou nota certificada.
 */
import { createHash, randomUUID } from 'node:crypto';
import { extractReceipt } from './web-receipt-parser.mjs';
const stages=[
  ['run',5],['map',5],['title',6],['placeholder',6],['limit',12],
  ['maximum',10],['button',7],['error',7],['success',7],['color',6],
  ['trim',8],['invalid',8],['isolation',8],['quiz',5]
];
const activity='WEB-AULA05-2026';
const args=process.argv.slice(2);
const value=(key)=>{
  const i=args.indexOf(key);
  if(i<0)return null;
  if(i===args.length-1)throw Error('Falta valor para '+key);
  return args[i+1];
};
const url=value('--url');
const dryRun=args.includes('--dry-run');
const authorized=args.includes('--confirm-write');
const identity=Object.freeze({
  teamId:'fa4e2212-5141-4f1e-9b45-35e772dcc2c0',
  team:'Equipe QA FICTICIA',
  members:[{name:'Ana Teste Ficticio'},{name:'Bruno Teste Ficticio'}]
});
const evidence={
  schema:'ifma-web-aula05-lab-v4',
  tipo:'formativo-nao-e-nota',
  xp:0,
  maximoXp:100,
  exercicios:stages.map(([id,xp])=>({id,estado:'PENDENTE',xp:0,maximoXp:xp})),
  observacao:'QA EXCLUSIVAMENTE FICTICIO: validar recepcao, hashes e reenvio.',
  testeNativoPendente:'Nao testado em dispositivo real.',
  codigoFonteCompleto:'// QA FICTICIO. NAO EXECUTAR COMO ATIVIDADE DE ALUNO.\nexport default function App(){return null;}'
};
if(stages.reduce((s,t)=>s+t[1],0)!==100)throw Error('Catálogo de XP inconsistente.');
const payload={
  schema:'web-a05-submission-v1',
  activity,
  identity,
  evidence
};
const serialized=JSON.stringify(payload);
if(serialized.length>44000)throw Error('Fixture excedeu o contrato Apps Script.');
if(dryRun){
  console.log('WEB_QA_DRY_RUN_PASS | 14 missões | 0/100 XP | esquema WEB-AULA05-2026 | zero requisições | zero escrita');
  process.exit(0);
}
if(!authorized)throw Error('Operação de escrita DESAUTORIZADA: use --dry-run ou inclua explicitamente --confirm-write.');
if(!url||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))
  throw Error('Forneça --url https://script.google.com/macros/s/<deployment-id>/exec (Web App próprio de Web).');

const nonce=randomUUID();
const request=new URLSearchParams({nonce,payload:serialized});
const response=await fetch(url,{
  method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
  body:request.toString(),
  redirect:'follow',
  signal:AbortSignal.timeout(45000)
});
if(!response.ok)throw Error('POST HTTP '+response.status+'. Conferir acesso do Web App.');

const html=await response.text();
const urlinfo=new URL(response.url);
const normalized=html.replace(/https?:\/\/[^\s"'<>()]+/g,'[URL]');
const title=html.match(/<title[^>]*>([^<]{0,150})<\/title>/i)?.[1]||'';
const tags=[...html.matchAll(/<iframe\b/gi)].length;
const markers=[...html.matchAll(/top\.postMessage/gi)].length;
const csp=['frame-ancestors','X-Frame-Options','Error','Google','script.googleusercontent.com'].map(k=>[k,html.includes(k)]);
console.log('WEB_RESPONSE_SHAPE',JSON.stringify({
  status:response.status,host:urlinfo.hostname,ct:response.headers.get('content-type'),
  bytes:html.length,title,iframes:tags,postMessages:markers,markers:csp,
  snippet:normalized.slice(0,450)
}));
console.log('WEB_RESPONSE_BODY_TAIL',normalized.slice(-260));
if(markers){
  try{console.log('WEB_RESPONSE_PARSER',JSON.stringify({ok:extractReceipt(html)?.ok===true,error:extractReceipt(html)?.error?.slice(0,120)||null}));}
  catch(e){console.log('WEB_RESPONSE_PARSER_FAIL',String(e.message));}
}
console.log('No success is asserted; inspect Auditoria and Equipes before another POST.');
