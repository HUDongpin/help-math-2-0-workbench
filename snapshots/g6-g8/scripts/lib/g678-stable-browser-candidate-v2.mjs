/** Recursive native watches keep the same fail-closed, exact-file contract
 * without allocating one FSEvents stream per historical evidence directory. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {readJsonPin,readPin} from '../../lib/g678-admission-proof.mjs';
import {verifyStableInputs} from './g678-stable-browser-candidate-v1.mjs';
export {freezeStableBrowserCandidate} from './g678-stable-browser-candidate-v1.mjs';

const within=(file,directory)=>file===directory||file.startsWith(directory+path.sep);
const stamp=file=>{
 const stat=fs.lstatSync(file,{bigint:true});
 return [fs.realpathSync(file),...['dev','ino','mode','nlink','size','mtimeNs','ctimeNs'].map(k=>String(stat[k]))].join(':');
};

export async function runStableBrowser({root,candidatePin,receipt,command,args=[],env=process.env}){
 const candidate=readJsonPin(root,candidatePin);
 assert(typeof command==='string'&&command.length>0&&Array.isArray(args),'explicit command argv; no shell');
 assert(receipt.startsWith('output/')&&!receipt.split('/').includes('..'),'retained browser receipt boundary');
 const inputs=[{root,pin:candidatePin},...candidate.files.map(pin=>({root,pin})),...candidate.external];
 assert(!inputs.some(i=>path.join(i.root,i.pin.path)===path.join(root,receipt)),'receipt must not be a frozen input');
 const entries=inputs.map(i=>{const file=path.join(i.root,i.pin.path);return{file,before:stamp(file),declaredRoot:i.root};});
 // The shared reader already requires physical paths, rejecting symlink inputs.
 // Watching each declared root recursively also catches replacement of parents.
 const possible=[...new Set(entries.map(e=>e.declaredRoot))].sort((a,b)=>a.length-b.length);
 const roots=[];for(const dir of possible)if(!roots.some(r=>within(dir,r)))roots.push(dir);
 let child,drift=null,phase='preflight',exitCode=null,error=null;
 const watchers=[],startedAt=new Date().toISOString();
 const invalidate=message=>{if(!drift)drift=message;child?.kill('SIGTERM');};
 const verifyStamp=e=>{try{if(stamp(e.file)!==e.before)invalidate(`input-change: ${e.file}`);}catch{invalidate(`input-change: ${e.file}`);}};
 try{
  for(const directory of roots){
   const relevant=entries.filter(e=>within(e.file,directory));
   const watcher=fs.watch(directory,{recursive:true},(event,name)=>{
    const changed=name===null?null:path.join(directory,String(name));
    for(const e of relevant)if(changed===null||within(e.file,changed))verifyStamp(e);
   });
   watcher.on('error',cause=>invalidate(`input-watch-error: ${cause.message}`));watchers.push(watcher);
  }
  verifyStableInputs(root,candidate);readPin(root,candidatePin);
  for(const e of entries)assert.equal(stamp(e.file),e.before,`stable metadata: ${e.file}`);
  // Deliver errors from watch setup before a browser command can be started.
  await new Promise(resolve=>setImmediate(resolve));if(drift)throw Error(drift);
  phase='browser';child=spawn(command,args,{cwd:root,env,shell:false,stdio:'inherit'});
  exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve(code??`signal:${signal}`));});
  phase='postflight';verifyStableInputs(root,candidate);readPin(root,candidatePin);
  for(const e of entries)assert.equal(stamp(e.file),e.before,`stable metadata: ${e.file}`);
  await new Promise(resolve=>setImmediate(resolve));if(drift)throw Error(drift);
  assert.equal(exitCode,0,'browser command must succeed');
 }catch(cause){error=cause.message;}finally{for(const watcher of watchers)watcher.close();}
 const result={schemaVersion:1,kind:'g678-stable-browser-run-v2',candidate:candidatePin,animationIds:candidate.animationIds,host:candidate.host,registrySha256:candidate.registrySha256,startedAt,finishedAt:new Date().toISOString(),phase,exitCode,drift,status:error?'failed':'stable-command-passed',error,watch:{mode:'recursive-native-exact-file-filter',roots,inputs:entries.length},note:'Exact source hashes and metadata reverified; browser assertions and acceptance remain separate.'};
 fs.mkdirSync(path.dirname(path.join(root,receipt)),{recursive:true});fs.writeFileSync(path.join(root,receipt),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(error)throw Object.assign(Error(error),{receipt,result});return result;
}
