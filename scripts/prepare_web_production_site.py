#!/usr/bin/env python3
"""Patch idempotente do site. Não publica nem chama o Google."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
r=ROOT/'lessons/aula-05-laboratorio-web-mobile'
url='https://script.google.com/macros/s/AKfycbzW5ekgFdlyayf14Pi-uX7uBygxRMr2FqJS6hrQeKxsdj-WdVcyT0JI8vuzhVyT5L_W/exec'
(r/'entrega-config.js').write_text('''/** Web somente. Fora do hostname oficial permanece em modo offline. */
(() => {
  const published=window.location.origin==='https://thalesvalente.github.io';
  window.WebEntregaConfig=Object.freeze({
    endpoint:published?'%s':'',
    activated:published,
    requiredMode:published?'PROD':null,
    activity:'WEB-AULA05-2026',
    schema:'web-a05-submission-v2'
  });
})();
'''%url)
p=r/'entrega-appscript.js';s=p.read_text()
if 'WebProductionGate?.ensureReady' not in s:
    a="schema:'web-a05-submission-v2',activity:ACTIVITY,identity,evidence"
    assert s.count(a)==1
    s=s.replace(a,"schema:'web-a05-submission-v2',activity:ACTIVITY,identity,evidence,\n      ...(config.requiredMode==='PROD'?{environment:'PROD'}:{})")
    a="    if(busy)return;\n    // Validação anterior"
    b="""    if(busy)return;
    if(activated&&config.requiredMode==='PROD'){
      busy=true;button.disabled=true;quickButton.disabled=true;
      try{
        inform('Conferindo a disponibilidade da atividade. Seus dados ainda não foram enviados.');
        if(!window.WebProductionGate?.ensureReady)throw Error('Verificação de produção indisponível. Atualize a página.');
        await window.WebProductionGate.ensureReady(config);
      }catch(error){
        inform('ENVIO NÃO REALIZADO: '+String(error?.message||'Recebimento indisponível.'),'error');
        showReceipt();return;
      }finally{busy=false;button.disabled=false;quickButton.disabled=false;}
    }
    // Validação anterior"""
    assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
p=r/'index.html';s=p.read_text().replace('web-id03-qa03','web-prod-310')
if 'production-gate.js' not in s:
    a='  <script defer src="./entrega-appscript.js?v=web-prod-310"></script>'
    assert a in s
    s=s.replace(a,'  <script defer src="./production-gate.js?v=web-prod-310"></script>\n'+a)
s=s.replace('O envio depende de homologação.','O recebimento depende da liberação pelo professor.')
s=s.replace('Recebimento online ainda não homologado. O PDF pode ser salvo localmente após identificar a equipe.','O recebimento será verificado antes do envio. O PDF pode ser salvo localmente após identificar a equipe.')
if 'Não informe CPF, senha ou dados sensíveis nas respostas.' not in s:
    s=s.replace('Os dados podem ser gravados mesmo se o recibo não chegar;','Os dados serão usados pelo professor para registrar a entrega e as notas. Não informe CPF, senha ou dados sensíveis nas respostas. Para correções, procure o professor. Os dados podem ser gravados mesmo se o recibo não chegar;')
p.write_text(s)
for p in [ROOT/'tests/web-a05-id03/frontend-cache.test.cjs',r/'tests/web-entregas.spec.mjs']:
    p.write_text(p.read_text().replace('web-id03-qa03','web-prod-310'))
p=r/'tests-live/http-qa-support.mjs';s=p.read_text()
if "'production-gate.js'" not in s:
    assert "'identity-http.css','entrega-config.js'" in s
    p.write_text(s.replace("'identity-http.css','entrega-config.js'","'identity-http.css','production-gate.js','entrega-config.js'"))
print('Production frontend prepared; hosted mode requires verified PROD backend before POST.')
