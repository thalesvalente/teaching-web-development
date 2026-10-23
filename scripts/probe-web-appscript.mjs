#!/usr/bin/env node
/**
 * Verificação exclusivamente de LEITURA do Web App Google Apps Script.
 * Não envia POST nem modifica planilha. Aceita URL /exec explícita ou a
 * configuração do frontend já publicada em entrega-config.js.
 *
 * Uso:
 *   node scripts/probe-web-appscript.mjs --url "https://script.google.com/macros/s/AK.../exec"
 *   node scripts/probe-web-appscript.mjs --url "..." --require-enabled
 *   node scripts/probe-web-appscript.mjs  # inspeciona entrega-config.js
 */
import { readFileSync } from 'node:fs';
const configPath = new URL('../lessons/aula-05-laboratorio-web-mobile/entrega-config.js',import.meta.url);
const text=readFileSync(configPath,'utf8');
const configUrl=text.match(/endpoint:\s*'([^']*)'/)?.[1]||'';
const activated=text.match(/activated:\s*(true|false)/)?.[1]==='true';
const args=process.argv.slice(2);
const take=(name)=>{
  const index=args.indexOf(name);
  if(index<0)return null;
  if(index===args.length-1)throw Error('Falta valor para '+name);
  return args[index+1];
};
const url=take('--url')||configUrl;
const requireEnabled=args.includes('--require-enabled')||(!take('--url')&&activated);
if(!url){
  console.log('WEB_SCRIPT_PENDING: falta implantação /exec; nenhuma requisição efetuada.');
  process.exit(0);
}
if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))
  throw Error('URL inválida: use exclusivamente a implantação Google Apps Script terminada em /exec.');
const target=new URL(url);
target.searchParams.set('web_probe','1');
const response=await fetch(target,{
  redirect:'follow',
  headers:{'Cache-Control':'no-cache','User-Agent':'IFMA-Web-Integration-Check/1.0'},
  signal:AbortSignal.timeout(20000)
});
if(!response.ok)throw Error('Web App GET HTTP '+response.status+
  '. Verifique autorização e acesso público da implantação.');
const body=(await response.text()).trim();
if(!/^Web — receptor web-entregas-1\.1\.1 — recebimento (bloqueado|habilitado \(sujeito a validação docente\))$/.test(body)){
  throw Error('Resposta GET não corresponde ao Code.gs de Web 1.1.1. Pode ser versão antiga, login ou aplicação errada.');
}
const enabled=body.includes('habilitado');
if(requireEnabled&&!enabled)throw Error('Web App responde, mas recebimento está BLOQUEADO; não publique o botão ativo.');
console.log('WEB_GET_PASS | servidor='+new URL(response.url).hostname+
  ' | versão=web-entregas-1.1.1 | recebimento='+
  (enabled?'HABILITADO, somente pendente de validação docente':'BLOQUEADO')+
  ' | POST não executado | planilha não modificada');
