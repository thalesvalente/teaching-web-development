import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractReceipt} from '../scripts/web-receipt-parser.mjs';

const wrap = (obj,origin='https://thalesvalente.github.io') =>
  '<html><body><script>top.postMessage(' + JSON.stringify(obj) +
  ','+JSON.stringify(origin)+');</script></body></html>';

test('recibo HTML íntegro é interpretado sem executar script',()=>{
  assert.deepEqual(extractReceipt(wrap({ok:true,receiptId:'WEB-QA'})),{ok:true,receiptId:'WEB-QA'});
});
test('strings escapadas com aspas, barra invertida e chaves não truncam JSON',()=>{
  const msg='Erro "}" ao validar C:\\\\teste';
  assert.equal(extractReceipt(wrap({ok:false,error:msg})).error,msg);
});
test('quebra de linha e espaços em torno do envelope são válidos',()=>{
  const html=wrap({ok:true}).replace('top.postMessage(', 'top.postMessage ( \n').replace(',"https:', ' ,  "https:');
  assert.equal(extractReceipt(html).ok,true);
});
test('recusa origem de destino indevida',()=>{
  assert.throws(()=>extractReceipt(wrap({ok:true},'https://example.org')),/Envelope/);
});
test('recusa fragmento sem encerramento postMessage',()=>{
  assert.throws(()=>extractReceipt('<script>top.postMessage({"ok":true}'),/Envelope/);
});
test('recusa JSON truncado e sem função postMessage',()=>{
  assert.throws(()=>extractReceipt('<script>top.postMessage({"ok":true'),/incompleto/);
  assert.throws(()=>extractReceipt('<html>ok</html>'),/sem top.postMessage/);
});
test('recusa JSON malformado e valor seguido de envelope errado',()=>{
  assert.throws(()=>extractReceipt('<script>top.postMessage({"ok":true,}, "https://thalesvalente.github.io");</script>'),/ilegível/);
  assert.throws(()=>extractReceipt('<script>top.postMessage({"ok":true}, location.origin);</script>'),/Envelope/);
});
