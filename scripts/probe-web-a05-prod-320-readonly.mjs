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
// O GET /exec confirma modo e bloqueio; health usa wrapper HtmlService variável.
// Para não inventar aprovação de parsing, este gate valida apenas que a resposta
// HTTP contém os marcadores de canal, nonce e versão e não habilita envios.
if(!html.includes('web-status-aula05')||!html.includes(nonce)||
   !html.includes('web-notas-3.2.0')||!html.includes('enabled'))
  throw Error('WEB_A05_BLOCKED: health sem marcadores obrigatórios');
console.log('WEB_A05_PROD_320_HEALTH_MARKERS_PASS | conteúdo não interpretado | enabled não homologado');
console.log('WEB_A05_PROD_320_GET_PASS | GET principal bloqueado; health marcadores presentes; sem POST');
