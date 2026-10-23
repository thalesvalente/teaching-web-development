/**
 * Extrai o recibo do HTML do HtmlService sem executar scripts.
 * Garante JSON balanceado, escapes e o destino de postMessage completo.
 */
export function extractReceipt(html){
  if(typeof html!=='string')throw Error('HTML de resposta inválido.');
  const marker=/\btop\.postMessage\s*\(/g;
  const match=marker.exec(html);
  if(!match)throw Error('Resposta sem top.postMessage; consultar Auditoria antes de repetir POST.');
  const start=marker.lastIndex;
  let depth=0,quoted=false,escaped=false,end=-1;
  for(let i=start;i<html.length;i++){
    const ch=html[i];
    if(quoted){
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch==='"')quoted=false;
      continue;
    }
    if(ch==='"'){quoted=true;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0){end=i+1;break;}
      if(depth<0)break;
    }
  }
  if(end<0 || quoted)throw Error('JSON de recibo incompleto; conferir Auditoria antes de repetir POST.');
  const tail=html.slice(end);
  if(!/^\s*,\s*"https:\/\/thalesvalente\.github\.io"\s*\)\s*;?/.test(tail))
    throw Error('Envelope postMessage inválido: destino ou fechamento incompatível.');
  try{return JSON.parse(html.slice(start,end));}
  catch{throw Error('JSON de recibo ilegível; conferir Auditoria antes de repetir POST.');}
}
