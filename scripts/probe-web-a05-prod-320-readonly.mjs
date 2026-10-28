#!/usr/bin/env node
/**
 * WEB-A05 3.2.0 — somente GET público de diagnóstico.
 * Nenhum POST, matrícula, nome, token, segredo ou escrita em planilhas.
 * Se o receptor estiver habilitado antes dos gates, encerra com falha.
 */
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const config=readFileSync(new URL('../lessons/aula-05-laboratorio-web-mobile/entrega-config.js',import.meta.url),'utf8');
const urlMatch=config.match(/\bPROD_ENDPOINT='(https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec)'/);
if(!urlMatch)throw Error('WEB_A05_BLOCKED: endpoint PROD não registrado exatamente no frontend');
if(!/\bPROD_RELEASE_ENABLED=true;/.test(config))throw Error('WEB_A05_INVALID: site ainda não aponta ao receptor PROD');
const endpoint=urlMatch[1];
const nonce=randomUUID();
async function get(url) {
  const response=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(25000),
    headers:{'Cache-Control':'no-cache','User-Agent':'IFMA-WEB-A05-PROD-320-HEALTH-READONLY'}});
  if(!response.ok)throw Error('WEB_A05_BLOCKED: HTTP GET '+response.status);
  return (await response.text()).trim();
}
const text=(await get(endpoint)).replace(/\s+/g,' ');
if(!/^Web web-notas-3\.2\.0 — PROD — recebimento habilitado — matrícula pré-cadastrada; cadastro somente leitura; notas 0–10 e maior nota$/.test(text))
  throw Error('WEB_A05_BLOCKED: resposta GET fora do contrato de produção bloqueada');

const health=new URL(endpoint);
health.searchParams.set('action','health');
health.searchParams.set('nonce',nonce);
const html=await get(health.toString());
// Google HtmlService envolve scripts em um documento maior; o espaço e o
// encapsulamento de top.postMessage podem variar entre implantações.
// Buscar o objeto do canal específico, nunca executar HTML/JS recebido.
// HtmlService pode escapar aspas e incluir metadados em volta do JSON.
// A resposta é tratada apenas como dados; não executar JavaScript remoto.
// O Apps Script responde com JSON embutido em HtmlService. Parsear somente
// o objeto literal, sem avaliar scripts nem depender de espaços do wrapper.
// O Google encapsula a chamada em HTML e pode reescrever a sintaxe de
// top.postMessage. Ancorar pelo canal conhecido, não pela posição do wrapper.
// Apps Script HtmlService pode serializar o JSON em string JavaScript.
// Descodificar escapes JSON apenas como dados, sem executar código remoto.
// Google HtmlService codifica o documento em JavaScript com escapes \xHH,
// inclusive chaves e aspas; decodificar como TEXTO, sem avaliar JavaScript.
const decoded=html.replace(/\\x([0-9a-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)))
  .replace(/\\u0022/gi,'"').replace(/\\+"/g,'"').replace(/&quot;/g,'"');
const objects=decoded.match(/\{[^{}]{0,4000}\}/g)||[];
let status=null;
for(const raw of objects){
  if(!raw.includes('web-status-aula05'))continue;
  try{
    const candidate=JSON.parse(raw);
    if(candidate.channel==='web-status-aula05'){status=candidate;break;}
  }catch{}
}
if(!status)throw Error('WEB_A05_BLOCKED: JSON health inválido após decodificação HtmlService');
if(status.ok!==true||status.channel!=='web-status-aula05'||status.nonce!==nonce||
   status.version!=='web-notas-3.2.0'||status.mode!=='PROD'||
   status.activity!=='WEB-AULA05-2026'||status.enabled!==true)
  throw Error('WEB_A05_BLOCKED: health incorreto ou receptor habilitado');
console.log('WEB_A05_PROD_320_GET_HEALTH_PASS | health enabled=true validado por JSON e nonce | sem POST');
