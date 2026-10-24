"""Correções determinísticas sobre a candidata transportada; sem rede ou dados reais."""
from pathlib import Path
root=Path.cwd()
p=root/'integrations/web-appscript-production/Code.gs'
s=p.read_text()
old="    s.split(/\\s+/).length>=2 && s.split(/\\s+/).every(function(part){\n      return"
new="    s.split(/\\s+/).length>=2 && s.split(/\\s+/).every(function(part){\n      // A conjunção portuguesa e é válida em nomes completos cadastrados.\n      if(part.toLowerCase()==='e')return true;\n      return"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace('// Campos já validados por webIdentity; não exige cadastro ou conta institucional.', '// O cadastro docente é obrigatório e lido por notasHydrate_; não há login do aluno.')
old="  var seenResult=Object.create(null);\n  res.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){"
new="  var currentRoster=notasRosterIndex_(book),seenResult=Object.create(null);\n  res.rows.forEach(function(r,i){if(i>0&&r&&!notasBlank(r[0])){\n    if(!currentRoster[r[0]])notasErr('VINCULO_DOCENTE_PENDENTE',null,null,\n      'Há um resultado vinculado a matrícula não presente no cadastro atual.',\n      'O professor deve conferir manualmente os vínculos. Nenhuma matrícula ou nota foi remapeada.');"
assert s.count(old)==1;s=s.replace(old,new)
old="    notasAssert(!seenRoster[r[1]],'Matrícula duplicada no boletim.');seenRoster[r[1]]=true;"
new="    if(!currentRoster[r[1]])notasErr('VINCULO_DOCENTE_PENDENTE',null,null,\n      'Há uma matrícula no boletim que precisa de conferência cadastral docente.',\n      'O professor deve conferir os vínculos manualmente antes de reabrir as entregas.');\n    notasAssert(!seenRoster[r[1]],'Matrícula duplicada no boletim.');seenRoster[r[1]]=true;"
assert s.count(old)==1;s=s.replace(old,new)
p.write_text(s)
p=root/'tests/web-production/production.test.cjs'
s=p.read_text()+'''\n// Dados exclusivamente sintéticos; espelham regras de grafia, não pessoas reais.\ntest('nome com conjunção portuguesa e é válido sem regravar cadastro',()=>{\n  const f=fixture(),name='Nome Teste e Exemplo';\n  f.set('Alunos',2,2,name);f.set('Alunos',2,3,f.ctx.webNormalized(name));\n  const initial=roster(f),e=f.event([],f.confirmed(single(f)));\n  const d=readonly(f,()=>f.receive(e));assert.equal(d.ok,true,JSON.stringify(d));\n  assert.equal(d.members[0].name,name);assert.equal(f.receive(e).receiptId,d.receiptId);\n  assert.equal(roster(f),initial);\n});\ntest('retificação manual da chave não duplica notas nem remapeia histórico órfão',()=>{\n  const f=fixture(),first=f.event([],f.confirmed(single(f)));\n  assert.equal(f.receive(first).ok,true);\n  const oldAudit=JSON.stringify(f.state().Auditoria),batches=f.batches();\n  f.set('Alunos',2,1,'20999999.ITA9010');\n  const id={...f.identity(),members:[{enrollment:'20999999.ITA9010'}]};\n  const d=readonly(f,()=>send(f,10,f.confirmed(id)));\n  assert.equal(d.ok,false);assert.equal(d.code,'VINCULO_DOCENTE_PENDENTE');\n  assert.equal(f.batches(),batches);assert.equal(JSON.stringify(f.state().Auditoria),oldAudit);\n  assert.equal(f.state()['4º Bimestre'].cells.length,2);\n});\n'''
p.write_text(s)
print('Applied two targeted regressions')
