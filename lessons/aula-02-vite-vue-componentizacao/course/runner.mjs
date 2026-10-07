#!/usr/bin/env node
/** IFMA Web — orientador de missões. Não corrige código do estudante. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCourse, PROJECT } from './lib/update.mjs';
const course=path.dirname(fileURLToPath(import.meta.url));
const project=path.dirname(course);
const manifest=JSON.parse(fs.readFileSync(path.join(course,'manifest.json'),'utf8'));
const [command='help',id,...args]=process.argv.slice(2);
function help(){console.log(`IFMA Web • pacote ${manifest.version}\nProjeto: ${PROJECT}\n\nstatus          lista missões disponíveis\nmission 04      abre o enunciado no terminal\ncheck 04        verifica o app local (mantenha Vite aberto)\nupdate          atualiza apenas course/\n\nExemplo de porta: check 04 --url http://127.0.0.1:5174\nO checker não dá nota oficial. Não existe checker 03 neste pacote.`);}
try{
  if(command==='status'){console.log(`IFMA Web • pacote ${manifest.version}`);for(const m of manifest.missions)console.log(`${m.id} — ${m.title} (${m.status})`);console.log('Pré-requisito: conferir manualmente os cartões, props e eventos da Aula 3.');}
  else if(command==='mission'){if(!manifest.missions.some(m=>m.id===id))throw Error('Missão não disponível. Use status.');console.log(fs.readFileSync(path.join(course,'missions',id,'README.md'),'utf8'));}
  else if(command==='update'){if(id)throw Error('update não recebe argumentos.');syncCourse(project);}
  else if(command==='check'){if(id!=='04')throw Error('Este pacote contém somente checker 04.');const {run}=await import('./checkers/04.mjs');const result=await run(project,args);process.exitCode=result.exitCode;}
  else if(command==='help')help();else {help();process.exitCode=2;}
}catch(error){console.error('\nINTERROMPIDO: '+error.message+'\nNão use reset --hard, pull geral ou restauração sem orientação.');process.exitCode=2;}
