#!/usr/bin/env python3
"""Gera a Aula 04 e a atividade a partir de fontes comuns, sem tocar no src/ da turma."""
from pathlib import Path
import sys, json, re, html, hashlib
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from slides import render
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
PROJECT=ROOT/'lessons/aula-02-vite-vue-componentizacao'
COURSE=PROJECT/'course'
ACTIVITY=ROOT/'lessons/aula-04-formularios-validacao'

def write(p,text):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(text,encoding='utf-8',newline='\n')
def embed(data):
    return json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
def h(s):return html.escape(str(s))
spec=json.loads((HERE/'spec.json').read_text())
ex=json.loads((HERE/'example.json').read_text())
source=(ROOT/'lessons/Aula_03_Web_v4.html').read_text()
scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',source,re.S)
vue=next(s for s in scripts if 'var Vue=function' in s and '3.5.13' in s)
assert 'Vue.js' in vue and 'MIT License' in vue
slides,notes=render(spec,ex)
assert len(notes)==28
meta={'version':spec['version'],'slideCount':28,'canvas':[1280,720],'demoRuntime':'Vue 3.5.13 (embarcado, mesmo da Aula 03)','baselinePolicy':'Nenhuma dependência do projeto da turma é alterada.','applicationDate':spec['applicationDate'],'mission':'04'}
deck=(HERE/'deck.html').read_text()
for tag,value in {'SLIDES':slides,'EXAMPLE':embed(ex),'METADATA':embed(meta),'VUE':vue,'DECKJS':(HERE/'deck.js').read_text()}.items():deck=deck.replace('@@'+tag+'@@',value)
assert '@@' not in deck
write(ROOT/'lessons/Aula_04_Web_v1.html',deck)
fields=spec['fields']
selectors='<div class="tablewrap"><table><thead><tr><th>data-testid</th><th>Elemento</th></tr></thead><tbody>'+''.join('<tr><td><code>'+h(k)+'</code></td><td>'+h(v)+'</td></tr>' for k,v in spec['selectors'].items())+'</tbody></table></div>'
rubric='<div class="tablewrap"><table><thead><tr><th>Critério</th><th>Valor</th><th>Evidência</th></tr></thead><tbody>'+''.join('<tr><td>'+h(r['name'])+'</td><td>'+str(r['points']).replace('.',',')+'</td><td>'+h(r['evidence'])+'</td></tr>' for r in spec['rubric'])+'<tr><td>Total</td><td>2,5</td><td>Código, commit e explicação individuais.</td></tr></tbody></table></div>'
tests=''.join(f'<article class="test"><h3>{tid} · {h(action)}</h3><p class="expected"><strong>Esperado:</strong> {h(expected)}</p><label for="{tid}-status">Resultado declarado</label><select name="{tid}-status" id="{tid}-status"><option value="not-run">Não executado</option><option value="pass">Passou</option><option value="fail">Falhou</option><option value="blocked">Impedido pelo ambiente</option></select><label for="{tid}-observed">Entrada usada, resultado observado e evidência</label><textarea id="{tid}-observed" name="{tid}-observed" placeholder="Descreva o que realmente aconteceu; identifique a evidência ou explique por que não executou."></textarea></article>' for tid,action,expected in spec['tests'])
refs=''.join('<a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">'+h(name)+' ↗</a>' for name,url in spec['references'][:5])
activity=(HERE/'activity.html').read_text()
for key,val in {'TITLE_MIN':fields['titulo']['min'],'TITLE_MAX':fields['titulo']['max'],'DESC_MIN':fields['descricao']['min'],'DESC_MAX':fields['descricao']['max'],'SELECTORS':selectors,'RUBRIC':rubric,'TEST_FIELDS':tests,'REFERENCES':refs,'TEACHER':h(spec['teacher']),'SPEC':embed(spec),'ACTIVITYJS':(HERE/'activity.js').read_text()}.items():activity=activity.replace('@@'+key+'@@',str(val))
assert '@@' not in activity
write(ACTIVITY/'index.html',activity)
write(COURSE/'missions/04/mission.json',json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
readme=f'''# Missão 04 — {spec['title']}

**{spec['subject']} · IFMA Campus Itapecuru-Mirim · 2026.2**  
**Atividade individual E3-I1 · valor: 2,5 pontos · versão: {spec['version']}**  
**Aplicação e prazo:** a comunicar pelo professor. Nenhuma data é presumida.

## Resultado a construir

Continue no seu projeto Vue. Acrescente um formulário para propor uma melhoria relacionada ao contexto do seu projeto. O formulário deve orientar o preenchimento, rejeitar entradas inválidas e comunicar ao App somente sugestões válidas. O App deve mostrar o total de sugestões válidas nesta sessão e os dados da última. Preserve componentes, funcionalidades e personalizações das aulas anteriores.

Trabalhe em `{spec['project']}`. Crie `{spec['studentComponent']}` e integre ao App. Não crie outro projeto nem substitua seu src/. Preserve o cabeçalho, os cartões de interesse e o rodapé. O contador de sugestões é separado do contador de interesses.

## Regras

- Título obrigatório: input, {fields['titulo']['min']}–{fields['titulo']['max']} caracteres após trim().
- Descrição obrigatória: textarea, {fields['descricao']['min']}–{fields['descricao']['max']} caracteres após trim().
- Remova espaços externos para validar e emitir; preserve espaços internos.
- Inválido: mensagens por campo, textos preservados, nenhum evento, nenhum incremento.
- Válido: evento `sugestao` com objeto `{{ titulo, descricao }}`, exatamente uma vez; pai atualiza o resumo; campos limpos e sucesso visível.
- Nova edição: apagar sucesso anterior e erro antigo do campo editado; revalidar ao submeter.
- Registrar: type=submit e form com @submit.prevent. Não duplicar em @click.
- Limpar: type=button; apagar campos e feedback sem alterar resumo.
- Enter no input envia; Enter no textarea cria linha. Labels associados, erros identificáveis sem depender apenas da cor.
- Estado apenas na sessão; sem API, banco, Router ou localStorage no app. Não afirmar que algo foi enviado ao professor.

O exemplo da biblioteca nos slides é didático e usa outras faixas. Não é a solução pronta da missão. A implementação, o commit, a ficha e a explicação são individuais, mesmo quando o tema é da equipe.

## Checkpoints

0. Execute a base da Aula 3, confira git status e git remote -v e registre o progresso revisado.
1. Conecte dois campos ao estado do novo componente.
2. Normalize e aplique regras de vazio e comprimento.
3. Oriente a correção com mensagens por campo e confirmação verdadeira.
4. Emita o objeto válido e atualize o resumo no App.
5. Execute os casos abaixo, documente o observado e registre seu incremento.

## Verificação

Mantenha `npm run dev` em um terminal. Em outro terminal na pasta do projeto:

```text
node course/runner.mjs status
node course/runner.mjs mission 04
node course/runner.mjs check 04
```

URL padrão: http://127.0.0.1:5173. Outra porta: acrescente `--url http://127.0.0.1:5174`.
Resultados: `docs/entregas/missao-04/checker-04.json`. O checker não dá nota oficial. Automação indisponível = NÃO VERIFICADO. Dependências e navegador são preparados pelo professor; nada é instalado silenciosamente. A explicação, a arquitetura e a revisão visual precisam de avaliação humana.

A primeira instalação usa `instalar-course.mjs` disponível no portal; se course/ já existe, use `node course/runner.mjs update`. O update só atualiza course/ e interrompe se houver alterações locais nessa área. Não use git pull upstream main para receber a missão.

## Contrato neutro de seletores

Acrescente data-testid aos elementos indicados. Isso não impõe nomes de variáveis, estilos ou mensagens literais.

| Seletor | Elemento |
|---|---|
'''
for k,v in spec['selectors'].items():readme+=f'| `{k}` | {v} |\n'
readme+='\nPreserve a classe `project-card` e o botão nos dois cartões da Aula 3. Os seletores de erro podem estar ausentes quando não há erro (v-if) ou conter texto vazio. O total deve conter somente o número; títulos/descrições, somente o texto do dado.\n\n## Testes\n\n| ID | Ação/entrada | Esperado |\n|---|---|---|\n'
for tid,act,expected in spec['tests']:readme+=f'| {tid} | {act} | {expected} |\n'
readme+='\nRegistre entrada, esperado, observado e evidência. Um maxlength na interface não substitui teste da regra; a automação tenta fazer o valor de fronteira chegar ao validador.\n\n## Rubrica E3-I1\n\n| Critério | Pontos | Evidência |\n|---|---:|---|\n'
for r in spec['rubric']:readme+=f'| {r["name"]} | {str(r["points"]).replace(".",",")} | {r["evidence"]} |\n'
readme+='''
**Total: 2,5 pontos.** O professor observará uma explicação e pequena alteração de regra. Checker aprovado não é nota automática nem prova isolada de autoria.

## Evidências e entrega

A ficha visual permite preencher respostas livres e exportar JSON recuperável, Markdown e PDF formal A4. Ela não executa seu fork e não envia dados a servidor. Informe um único Projeto analisado, o commit, os testes realmente executados, o uso de IA e as limitações.

Revise antes de git add, não inclua senhas, node_modules ou dados de terceiros. Confirme com o professor o canal apropriado para fichas com identificação pessoal.

```text
git status
git add .
git commit -m "feat: conclui missao 04 - formularios"
git push origin main
```

Confira o commit no seu GitHub. Guarde os resultados em docs/entregas/missao-04/ e entregue pelo canal comunicado. Exportar a ficha não significa enviá-la.

## Fontes

Plano de ensino Web v2, cronograma da Aula 4 e rubrica E3-I1; Aula 03 Web; guia origin/upstream. Os limites e cenários acima são a especificação didática desta missão.
'''
for name,url in spec['references'][:5]:readme+=f'\n- [{name}]({url})'
write(COURSE/'missions/04/README.md',readme+'\n')
write(ACTIVITY/'ATIVIDADE.md',readme+'\n')
update=(COURSE/'lib/update.mjs').read_text()
bootstrap='#!/usr/bin/env node\n// Instalador inicial — baixe do portal oficial; execute na pasta do projeto Vue.\n'+update.replace('export ','')+"\ntry { syncCourse(process.cwd(), {initial:true}); } catch (error) { console.error('INTERROMPIDO: '+error.message); process.exitCode=2; }\n"
write(ROOT/'docs/instalar-course.mjs',bootstrap)
files={}
for p in sorted(COURSE.rglob('*')):
    if p.is_file() and p.name!='manifest.json':files[p.relative_to(COURSE).as_posix()]=hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()
manifest={'schema':1,'courseId':'ifma-web','repository':'thalesvalente/teaching-web-development','version':spec['version'],'integrity':'sha256-utf8-lf','missions':[{'id':'04','title':spec['title'],'status':'disponível; checker requer ambiente preparado'}],'files':files}
write(COURSE/'manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Patch idempotente: preservar aulas e guia existentes; não recolocar Ver código.
home=ROOT/'index.html'
if home.exists():
    txt=home.read_text()
    if 'data-lesson="04"' not in txt:
        card='''\n      <article class="card" data-lesson="04">
        <span class="number">AULA 04 · ATIVIDADE INDIVIDUAL</span>
        <h2>Formulários e validação</h2>
        <p>Receber entradas, validar dados e mostrar mensagens claras. Continuidade do projeto Vue com a Missão 04.</p>
        <span class="tag">Vue · Formulários · E3-I1</span>
        <div class="actions">
          <a class="btn" href="./lessons/Aula_04_Web_v1.html">Abrir aula interativa</a>
          <a class="btn secondary" href="./lessons/aula-04-formularios-validacao/">Abrir atividade individual</a>
        </div>
      </article>\n'''
        marker='    </section>'
        start=txt.index('aria-label="Aulas"')
        end=txt.index(marker,start)
        txt=txt[:end]+card+txt[end:]
        txt=txt.replace('</style>','    .card[data-lesson="04"]{border-top-color:#916015}\n    .grid{grid-template-columns:repeat(2,minmax(0,1fr))}\n    @media(max-width:850px){.grid{grid-template-columns:1fr}}\n  </style>')
        write(home,txt)
# Arquivo de metadados sem dados pessoais dos alunos.
write(HERE/'build-info.json',json.dumps({'version':spec['version'],'slides':28,'tests':16,'runtime':'Vue 3.5.13','specSha256':hashlib.sha256((HERE/'spec.json').read_bytes()).hexdigest(),'outputs':['lessons/Aula_04_Web_v1.html','lessons/aula-04-formularios-validacao/index.html','docs/instalar-course.mjs'],'noStudentSourceChanged':True},ensure_ascii=False,indent=2)+'\n')
print('Aula 04, atividade, missão e instalador gerados. 28 slides; 16 cenários; src/ intocado.')
