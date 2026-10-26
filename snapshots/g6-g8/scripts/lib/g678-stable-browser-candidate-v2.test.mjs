import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {pinFile} from '../../lib/g678-admission-proof.mjs';
import {runStableBrowser} from './g678-stable-browser-candidate-v2.mjs';

async function scenario(change){
 const temporary=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'g678-recursive-watch-')));
 const root=path.join(temporary,'workspace'),external=path.join(temporary,'source'),physical=path.join(root,'alias');
 for(const dir of[root,external,physical,path.join(root,'nested')])fs.mkdirSync(dir,{recursive:true});
 const local=path.join(root,'nested/input.txt'),source=path.join(external,'source.txt'),target=path.join(physical,'target.txt');
 for(const file of[local,source,target])fs.writeFileSync(file,'frozen');
 const candidate={kind:'g678-stable-browser-candidate-v1',schemaVersion:1,root,animationIds:['test'],host:null,registrySha256:'fixture',files:['alias/target.txt','nested/input.txt'].map(n=>pinFile(root,n)),external:[{root:external,pin:pinFile(external,'source.txt')}]};
 const name='candidate.json';fs.writeFileSync(path.join(root,name),JSON.stringify(candidate));
 const actions={
  stable:'',
  reverted:`fs.writeFileSync(${JSON.stringify(local)},'changed');fs.writeFileSync(${JSON.stringify(local)},'frozen');`,
  replaced:`fs.writeFileSync(${JSON.stringify(local+'.new')},'frozen');fs.renameSync(${JSON.stringify(local+'.new')},${JSON.stringify(local)});`,
  external:`fs.writeFileSync(${JSON.stringify(source)},'changed');`,
  ancestorRename:`fs.renameSync(${JSON.stringify(physical)},${JSON.stringify(physical+'.old')});fs.mkdirSync(${JSON.stringify(physical)});fs.writeFileSync(${JSON.stringify(target)},'frozen');`,
  parentSwap:`fs.renameSync(${JSON.stringify(physical)},${JSON.stringify(physical+'.old')});fs.symlinkSync(${JSON.stringify(external)},${JSON.stringify(path.join(root,'alias'))},'dir');`,
 };
 try{
  const execution=runStableBrowser({root,candidatePin:pinFile(root,name),receipt:'output/result.json',command:process.execPath,args:['--input-type=module','-e',`import fs from'node:fs';setTimeout(()=>{${actions[change]}},120);setTimeout(()=>{},900);`]});
  if(change==='stable'){
   const result=await execution;assert.equal(result.status,'stable-command-passed');assert.equal(result.drift,null);assert.equal(result.watch.roots.length,2);
  }else{
   await assert.rejects(execution);const result=JSON.parse(fs.readFileSync(path.join(root,'output/result.json')));assert.equal(result.status,'failed');assert(result.drift?.startsWith('input-change:'),'native watch observes mutation');
  }
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
for(const change of['stable','reverted','replaced','external','ancestorRename','parentSwap'])test('recursive stability watch: '+change,()=>scenario(change));
