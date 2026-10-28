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
if(!/\bPROD_RELEASE_ENABLED=false;/.test(config))throw Error('WEB_A05_BLOCKED: gate frontend já habilitado');
const endpoint=urlMatch[1];
const nonce=randomUUID();
async function get(url) {
  const response=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(25000),
    headers:{'Cache-Control':'no-cache','User-Agent':'IFMA-WEB-A05-PROD-320-HEALTH-READONLY'}});
  if(!response.ok)throw Error('WEB_A05_BLOCKED: HTTP GET '+response.status);
  return (await response.text()).trim();
}
const text=(await get(endpoint)).replace(/\s+/g,' ');
if(!/^Web web-notas-3\.2\.0 — PROD — recebimento bloqueado — matrícula pré-cadastrada; cadastro somente leitura; notas 0–10 e maior nota$/.test(text))
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
const marker='top.postMessage(';
const start=html.indexOf(marker);
if(start<0)throw Error('WEB_A05_BLOCKED: postMessage ausente');
const jsonStart=html.indexOf('{',start+marker.length);
if(jsonStart<0||jsonStart-start>100)throw Error('WEB_A05_BLOCKED: objeto health ausente');
let jsonEnd=-1,quoted=false,escaped=false,depth=0;
for(let i=jsonStart;i<html.length&&i<jsonStart+4096;i++){
  const c=html[i];
  if(escaped){escaped=false;continue;}
  if(quoted&&c==='\\\\'){escaped=true;continue;}
  if(c==='"'){quoted=!quoted;continue;}
  if(!quoted){if(c==='{')depth++;else if(c==='}'&&--depth===0){jsonEnd=i;break;}}
}
if(jsonEnd<0)throw Error('WEB_A05_BLOCKED: JSON health incompleto');
let status;
try{status=JSON.parse(html.slice(jsonStart,jsonEnd+1));}
catch{throw Error('WEB_A05_BLOCKED: health JSON inválido');}
if(status.ok!==true||status.channel!=='web-status-aula05'||status.nonce!==nonce||
   status.version!=='web-notas-3.2.0'||status.mode!=='PROD'||
   status.activity!=='WEB-AULA05-2026'||status.enabled!==false)
  throw Error('WEB_A05_BLOCKED: health incorreto ou receptor habilitado');
console.log('WEB_A05_PROD_320_GET_HEALTH_PASS | health enabled=false validado por JSON e nonce | sem POST');
