#!/usr/bin/env node
/**
 * Smoke POST REAL para desenvolvimento-web-2026.
 * Inerte por padrão: --dry-run não faz rede; --confirm-write + --url /exec
 * são OBRIGATÓRIOS para escrever um registro FICTÍCIO na planilha.
 * Um recebimento válido não equivale à identidade ou nota certificada.
 */
import { createHash, randomUUID } from 'node:crypto';
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
// Resposta HtmlService: o script pode vir com espaços/escape de aspas.
// Extrair apenas o argumento JSON de top.postMessage, sem executar HTML.
function extractReceipt(html){
  const marker=/top\.postMessage\s*\(/g;
  const match=marker.exec(html);
  if(!match)throw Error('Resposta sem top.postMessage; consulte Auditoria antes de repetir POST.');
  let at=match.index+match[0].length,depth=0,quoted=false,escape=false;
  for(let i=at;i<html.length;i++){
    const ch=html[i];
    if(quoted){if(escape)escape=false;else if(ch==='\\\\')escape=true;else if(ch==='"')quoted=false;continue;}
    if(ch==='"'){quoted=true;continue;}
    if(ch==='{')depth++;
    if(ch==='}'){
      depth--;
      if(depth===0){
        const raw=html.slice(at,i+1);
        try{return JSON.parse(raw);}
        catch{throw Error('JSON de recibo ilegível; conferir Auditoria antes de repetir POST.');}
      }
    }
  }
  throw Error('Objeto de recibo incompleto; conferir Auditoria antes de repetir POST.');
}
const receipt=extractReceipt(html);
if(receipt.ok===false)throw Error('Apps Script recusou QA: '+String(receipt.error||'erro sem detalhe'));
const sha=createHash('sha256').update(evidence.codigoFonteCompleto,'utf8').digest('hex');
if(receipt.ok!==true||receipt.channel!=='web-entrega-aula05'||
  receipt.nonce!==nonce||receipt.activity!==activity||
  receipt.instrument!=='laboratorio-vivo-tsx-equipe'||receipt.codeSha256!==sha||
  receipt.xpReported!==0||receipt.grade!==null||
  receipt.teamId!==identity.teamId||receipt.memberCount!==identity.members.length||
  receipt.status!=='RECEBIDO_PENDENTE_VALIDACAO'||
  !/^[0-9a-f]{64}$/.test(String(receipt.answersSha256||''))||
  !/^[0-9a-f]{64}$/.test(String(receipt.signature||''))||
  !/^WEB-[\w-]+$/.test(String(receipt.receiptId||'')))
  throw Error('Resposta sem contrato íntegro de recibo. Verifique a planilha; não presuma recebimento.');
console.log('WEB_QA_POST_PASS | id='+receipt.receiptId+
  ' | equipe ficticia='+identity.team+' | membros='+identity.members.length+
  ' | recebido='+receipt.receivedAt+
  ' | 0/100 XP | SEM NOTA | SHA-256 do código='+sha);
console.log('CONFERIR: aba Equipes, quatro bimestres (dois integrantes) e Auditoria; depois retirar SOMENTE registros da equipe QA fictícia. NÃO apagar dados reais.');
