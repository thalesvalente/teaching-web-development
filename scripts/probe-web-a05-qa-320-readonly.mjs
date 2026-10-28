#!/usr/bin/env node
/**
 * QA 3.2.0: inspeção HTTP GET somente-leitura de deployment isolado.
 * Sem POST, sem nome/matrícula, sem leitura de planilha e sem alteração do Apps Script.
 * A URL está autorizada apenas como endpoint QA, por SHA-256 do frontend.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const qa='https://script.google.com/macros/s/AKfycbwyDx01cAyyuTLPeorvrPPc7Q_zNjAZrE_E_NbE38SZivPP_86Ol1_GiEp2xmZcWtI/exec';
const source=readFileSync(new URL('../lessons/aula-05-laboratorio-web-mobile/entrega-config.js',import.meta.url),'utf8');
const digest=createHash('sha256').update(qa).digest('hex');
if(!source.includes("QA_SHA256='"+digest+"'"))throw Error('QA 3.2: fingerprint diferente da URL fornecida pelo docente');
const r=await fetch(qa,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(25000),
  headers:{'User-Agent':'IFMA-A05-QA320-GET-READONLY','Cache-Control':'no-cache'}});
if(r.status!==200)throw Error('QA 3.2: resposta HTTP '+r.status);
const body=(await r.text()).replace(/\s+/g,' ').trim();
const pattern=/^Web (web-notas-[0-9.]+(?:-qa|-candidata)?) — ([A-Z]+) — recebimento (bloqueado|habilitado(?: QA)?) — /;
const match=body.match(pattern);
if(!match){
  console.error('WEB_A05_QA_GET_DIAGNOSTIC '+JSON.stringify({bytes:body.length,
    hasVersion320:body.includes('3.2.0'),
    hasQaMarker:/qa/i.test(body.slice(0,150)),
    hasBlocked:/bloqueado/i.test(body),
    looksLikeLogin:/ServiceLogin|Sign in|accounts.google.com/i.test(body)}));
  throw Error('QA 3.2: GET não reconhecido, não autoriza POST');
}
console.log('WEB_A05_QA_GET_OBSERVED '+JSON.stringify({version:match[1],mode:match[2],receiving:match[3],fingerprintVerified:true,method:'GET',postExecuted:false}));
if(!match[1].startsWith('web-notas-3.2.0')||match[3]!=='bloqueado')throw Error('QA 3.2: versão/flag inesperada. Bloqueie antes de avançar');
if(match[2]!=='QA')console.log('WEB_A05_QA_MODE_REVIEW_REQUIRED: versão QA usa modo '+match[2]+'; confirmar isolamento pelo spreadsheetId e Script Properties antes de permitir testes de escrita');
