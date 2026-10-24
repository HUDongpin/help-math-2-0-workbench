/** A stable browser run binds the actual split admission and complete input
 * closure. Any watched input edit invalidates the run, even if later reverted. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {resolveG678HistoricalEvidencePath} from '../../lib/g678-life-root-binding-v1.mjs';
import {selectBrowserProofRows} from './g678-browser-proof-selection-v1.mjs';
import {DISPATCH,REGISTRY,pinFile,readJsonPin,readPin,uniquePins,verifyAdmission,verifyLegacyPageHostPromotions,
 admissionArtifactPins,resolveLegacyPageHostInput,resolveHistoricalProjectExternal} from '../../lib/g678-admission-proof.mjs';

export const ACTIVATION='apps/web/lib/g678-admission-activation.ts';
export function activeIndexPin(root) {
 const text=readPin(root,pinFile(root,ACTIVATION)).toString();
 return JSON.parse(text.slice(text.indexOf('=')+1,text.lastIndexOf(' as const;')));
}

/** Called after real admission verification. Preserve proof pins; resolve only
 * the already-reviewed historical shared inputs into physical watch targets. */
export function proofBrowserInputs(root,host,proofs) {
 const promotions=verifyLegacyPageHostPromotions(root,host),files=[],external=new Map();
 for(const proof of proofs) {
  for(const artifact of [...admissionArtifactPins(proof.packet.entry),proof.packet.freezeManifest])
   assert(!promotions.has(artifact.path),'page artifacts cannot be promoted into the host');
  for(const pin of proof.files) {
   const transition=resolveLegacyPageHostInput(root,pin,promotions,proof.packet.entry,host,proof.packet);
   files.push(...(transition?[transition.current,transition.snapshot]:[pin]));
  }
  for(const source of proof.external)for(const item of resolveHistoricalProjectExternal(root,source,host,proof.packet)) {
   if(item.root===root){files.push(item.pin);continue;}
   // Role annotations remain in the immutable proof, not physical pin identity.
   const pin={path:item.pin.path,bytes:item.pin.bytes,sha256:item.pin.sha256};
   const key=path.join(item.root,pin.path),previous=external.get(key);
   if(previous)assert(previous.pin.bytes===pin.bytes&&previous.pin.sha256===pin.sha256,
    'conflicting external source pins');
   else external.set(key,{root:item.root,pin});
  }
 }
 return {files:uniquePins(files),external:[...external.values()]};
}

export function freezeStableBrowserCandidate({root,animationIds,inputScope='all-admitted',extraFiles=[],output}) {
 assert(animationIds.length>0&&new Set(animationIds).size===animationIds.length,'explicit distinct browser pages');
 assert(inputScope==='all-admitted'||inputScope==='selected-pages','explicit supported browser input scope');
 // Both scopes require the same complete real admission verification. The opt-in
 // only narrows page-owned inputs subsequently pinned/watched by the browser run.
 const indexPin=activeIndexPin(root),admission=verifyAdmission(root,indexPin);
 const proofRows=selectBrowserProofRows({admittedPages:admission.index.pages,animationIds,inputScope});
 const host=readJsonPin(root,admission.index.host);
 const proofs=proofRows.map(page=>readJsonPin(root,page.proof));
 const resolved=proofBrowserInputs(root,host,proofs);
 const files=uniquePins([pinFile(root,ACTIVATION),indexPin,admission.index.host,
  ...[REGISTRY,...DISPATCH].map(file=>pinFile(root,file)),...host.files,
  ...[...(host.legacyInputTransitions??[]),...(host.legacyPageHostPromotions??[]),
   ...(host.historicalRoutes??[]),
   ...(inputScope==='selected-pages'?(host.successorInputTransitions??[]):[])].map(t=>t.snapshot),
  ...proofRows.map(page=>page.proof),...resolved.files,
  ...extraFiles.map(file=>pinFile(root,file))]);
 const external=resolved.external;
 const candidate={schemaVersion:1,kind:'g678-stable-browser-candidate-v1',root,
  frozenAt:new Date().toISOString(),animationIds,index:indexPin,host:admission.index.host,
  inputScope,admissionValidationScope:'all-admitted',
  proofAnimationIds:proofRows.map(page=>page.animationId),
  inputScopeNote:inputScope==='selected-pages'
   ? 'Only the explicit animationIds have page-owned stable inputs. Complete active index, host, registry, dispatch and shared witnesses remain pinned. This is not full-catalog stability or playback evidence.'
   : 'All admitted proof inputs are pinned; requested browser scenarios remain animationIds. This is not full-catalog playback evidence.',
  registrySha256:admission.registrySha256,files,external,
  acceptanceEffects:{originalRuntime:false,fidelity:false,listening:false,human:false,owner:false,publication:false}};
 verifyStableInputs(root,candidate);
 assert(output.startsWith('work/g678-workflow/browser-candidates/')&&!output.split('/').includes('..'),'browser candidate output boundary');
 fs.mkdirSync(path.dirname(path.join(root,output)),{recursive:true});
 fs.writeFileSync(path.join(root,output),JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
 return pinFile(root,output);
}

export function verifyStableInputs(root,candidate) {
 assert(candidate.kind==='g678-stable-browser-candidate-v1'&&candidate.schemaVersion===1&&candidate.root===root,'exact browser candidate root');
 assert.deepEqual(candidate.files,uniquePins(candidate.files),'unique stable inputs');
 for(const pin of candidate.files)readPin(root,pin);
 for(const item of candidate.external)readPin(item.root,item.pin);
}

export async function runStableBrowser({root,candidatePin,receipt,command,args=[],env=process.env}) {
 const candidate=readJsonPin(root,candidatePin);
 assert(typeof command==='string'&&command.length>0&&Array.isArray(args),'explicit command argv; no shell');
 assert(receipt.startsWith('output/')&&!receipt.split('/').includes('..'),'retained browser receipt boundary');
 const inputs=[{root,pin:candidatePin},...candidate.files.map(pin=>({root,pin})),...candidate.external]
  .map(item=>({...item,root:resolveG678HistoricalEvidencePath(item.root,root)}));
 assert(!inputs.some(item=>path.join(item.root,item.pin.path)===path.join(root,receipt)),'receipt must not be a frozen input');
 const directories=new Map(),stamps=new Map();
 const stamp=file=>{
  const stat=fs.lstatSync(file,{bigint:true});
  return ['dev','ino','mode','nlink','size','mtimeNs','ctimeNs'].map(key=>String(stat[key])).join(':');
 };
 for(const item of inputs) {
  const file=path.join(item.root,item.pin.path),directory=path.dirname(file);
  if(!directories.has(directory))directories.set(directory,new Set());
  directories.get(directory).add(path.basename(file));
  stamps.set(file,stamp(file));
 }
 let child,drift=null,phase='preflight',exitCode=null,error=null;
 const watchers=[],startedAt=new Date().toISOString();
 const invalidate=message=>{if(!drift)drift=message;child?.kill('SIGTERM');};
 try {
  // Install monitors before the final preflight so changes during verification
  // are also observed. Watch directories to catch atomic replacement writes.
  for(const [directory,names] of directories) {
   const watcher=fs.watch(directory,(event,name)=>{
    // macOS may deliver an older creation event after watch installation.
    // A metadata comparison distinguishes that from any new write, including
    // a byte-identical rewrite or an edit followed by a revert.
    for(const entry of name===null?names:names.has(String(name))?[String(name)]:[]) {
     const file=path.join(directory,entry);
     try {if(stamp(file)!==stamps.get(file))invalidate(`input-${event}: ${file}`);}
     catch {invalidate(`input-${event}: ${file}`);}
    }
   });
   watcher.on('error',cause=>invalidate(`input-watch-error: ${cause.message}`));
   watchers.push(watcher);
  }
  verifyStableInputs(root,candidate);readPin(root,candidatePin);
  for(const [file,before] of stamps)assert.equal(stamp(file),before,`stable metadata: ${file}`);
  if(drift)throw Error(drift);
  phase='browser';
  child=spawn(command,args,{cwd:root,env,shell:false,stdio:'inherit'});
  exitCode=await new Promise((resolve,reject)=>{
   child.once('error',reject);child.once('exit',(code,signal)=>resolve(code??`signal:${signal}`));
  });
  phase='postflight';
  verifyStableInputs(root,candidate);readPin(root,candidatePin);
  for(const [file,before] of stamps)assert.equal(stamp(file),before,`stable metadata: ${file}`);
  // Deliver queued file events before deciding whether the run stayed stable.
  await new Promise(resolve=>setImmediate(resolve));
  if(drift)throw Error(drift);
  assert.equal(exitCode,0,'browser command must succeed');
 } catch(cause) {error=cause.message;}
 finally {for(const watcher of watchers)watcher.close();}
 const result={schemaVersion:1,kind:'g678-stable-browser-run-v1',candidate:candidatePin,
  animationIds:candidate.animationIds,host:candidate.host,registrySha256:candidate.registrySha256,
  startedAt,finishedAt:new Date().toISOString(),phase,exitCode,drift,
  status:error?'failed':'stable-command-passed',error,
  note:'Stable command execution; browser assertions and acceptance must be assessed from the linked browser artifacts.'};
 fs.mkdirSync(path.dirname(path.join(root,receipt)),{recursive:true});
 fs.writeFileSync(path.join(root,receipt),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(error)throw Object.assign(Error(error),{receipt,result});
 return result;
}
