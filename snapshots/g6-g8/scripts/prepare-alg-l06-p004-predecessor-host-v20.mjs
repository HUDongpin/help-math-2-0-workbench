#!/usr/bin/env node
/** Compose, but do not activate, the reviewed ALG L6 predecessor successor. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,readPageProof,readRegistryTransaction,
 sha256,uniquePins} from '../lib/g678-admission-proof.mjs';

const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const OLD_INDEX={path:'catalog/g678-admission-v1/index-v19.json',bytes:2168,
 sha256:'2e34ad5416edfbf4c0cef93f3f64104c7ec9f6c833a002b83683fd9eec7fbc82'};
const OLD_HOST={path:'catalog/g678-admission-v1/host-v19.json',bytes:64545,
 sha256:'b9b2afaf08fc076d9a4905c9de6764a834e085d40036047aede8f1d821d3f0e7'};
const ACTIVATION={path:'apps/web/lib/g678-admission-activation.ts',bytes:291,
 sha256:'1f6ac98566e22db609cbbf3b55c820386045ae2a61d3038bad92c6f325d68549'};
const OUT='output/alg-l06-p004-host-successor-v2';
const CHANGES=Object.freeze([
 {path:'apps/web/app/globals.css',snapshot:`${OUT}/predecessor/globals.css`,
  currentSha256:'2847768a60fb5fcac35094351ac14dc38593fdeae1d544a56685dc06b613e679'},
 {path:'apps/web/lib/alg-l06-p003-formal-base-v1.server.ts',
  snapshot:`${OUT}/predecessor/alg-l06-p003-formal-base-v1.server.ts`,
  currentSha256:'639d66422a89490d3b9258fddad80b37c1760dfc73d20c8cd0b2a32b1bd11212'},
]);
const ADDITIONS=Object.freeze([
 'lib/g678-predecessor-membership-v1.mjs',
 'scripts/g678-predecessor-membership-v1.test.mjs',
 'apps/web/lib/alg-l06-predecessor-v2.server.ts',
 'apps/web/tests/alg-l06-predecessor-v2.server-test.ts',
 'scripts/prepare-alg-l06-p004-predecessor-host-v20.mjs',
]);
const HOST_OUTPUT='catalog/g678-admission-v1/host-v20.json';
const INDEX_OUTPUT='catalog/g678-admission-v1/index-v20.json';
const ACTIVATION_CANDIDATE=`${OUT}/candidate-activation-v20.ts`;
const RECEIPT=`${OUT}/prepared-host-v20-receipt.json`;
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytesPin=(file,bytes)=>({path:file,bytes:bytes.length,sha256:sha256(bytes)});
function writeExact(file,bytes){
 const target=path.join(ROOT,file);fs.mkdirSync(path.dirname(target),{recursive:true});
 try{fs.writeFileSync(target,bytes,{flag:'wx'});}catch(error){
  if(error?.code!=='EEXIST')throw error;
  assert.deepEqual(readPin(ROOT,bytesPin(file,bytes)),bytes,`immutable output: ${file}`);
 }
 return pinFile(ROOT,file);
}
function plan(){
 assert.deepEqual(pinFile(ROOT,OLD_INDEX.path),OLD_INDEX,'exact v19 index');
 assert.deepEqual(pinFile(ROOT,OLD_HOST.path),OLD_HOST,'exact v19 host');
 assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v19 remains active');
 const index=readJsonPin(ROOT,OLD_INDEX),oldHost=readJsonPin(ROOT,OLD_HOST);
 assert.equal(index.kind,'g678-admission-index-v1');
 assert.deepEqual(index.host,OLD_HOST);
 assert.equal(index.pages.length,7);
 assert.equal(oldHost.kind,'g678-admission-host-v1');
 assert.equal(oldHost.contract,'source-native-current-js-v1');
 assert.deepEqual(uniquePins(oldHost.files),oldHost.files);
 const oldPaths=new Map(oldHost.files.map(pin=>[pin.path,pin]));
 const pageOwned=new Set(index.pages.flatMap(page=>
  readJsonPin(ROOT,page.proof).files.map(pin=>pin.path)));
 const changed=CHANGES.map(item=>{
  const original=oldPaths.get(item.path);assert(original,`v19 host input: ${item.path}`);
  const snapshot=pinFile(ROOT,item.snapshot),current=pinFile(ROOT,item.path);
  assert.equal(snapshot.bytes,original.bytes);
  assert.equal(snapshot.sha256,original.sha256);
  assert.equal(current.sha256,item.currentSha256,`reviewed current input: ${item.path}`);
  assert.notDeepEqual(current,original);
  assert(!pageOwned.has(item.path),`page-owned change: ${item.path}`);
  return {original,current,snapshot};
 });
 const changedPaths=new Set(CHANGES.map(item=>item.path));
 for(const old of oldHost.files)if(!changedPaths.has(old.path))readPin(ROOT,old);
 const additions=ADDITIONS.map(file=>{
  assert(!oldPaths.has(file)&&!pageOwned.has(file),`new host-only input: ${file}`);
  const pin=pinFile(ROOT,file);readPin(ROOT,pin);return pin;
 });
 for(const item of changed)assert(!oldPaths.has(item.snapshot.path)&&
  !pageOwned.has(item.snapshot.path),'new source-preserving snapshot');
 const files=uniquePins([...oldHost.files.map(pin=>
  changed.find(item=>item.original.path===pin.path)?.current??pin),
  ...changed.map(item=>item.snapshot),...additions]);
 assert.equal(files.length,oldHost.files.length+changed.length+additions.length);
 const existingTransitions=oldHost.legacyInputTransitions??[];
 const legacyInputTransitions=existingTransitions.map(transition=>{
  const update=changed.find(item=>item.original.path===transition.current.path);
  if(!update)return transition;
  assert.deepEqual(transition.current,update.original);
  readPin(ROOT,transition.snapshot);
  return {...transition,current:update.current};
 });
 const css=changed.find(item=>item.original.path==='apps/web/app/globals.css');
 assert(css&&!legacyInputTransitions.some(item=>item.original.path===css.original.path));
 legacyInputTransitions.push(css);
 assert.equal(legacyInputTransitions.filter(item=>
  item.original.path==='apps/web/lib/alg-l06-p003-formal-base-v1.server.ts').length,1);
 const host={...oldHost,previous:OLD_HOST,files,legacyInputTransitions,
  successorInputTransitions:[...(oldHost.successorInputTransitions??[]),...changed]};
 const hostBytes=json(host),hostPin=bytesPin(HOST_OUTPUT,hostBytes);
 const nextIndex={...index,host:hostPin},indexBytes=json(nextIndex),
  indexPin=bytesPin(INDEX_OUTPUT,indexBytes);
 const activationBytes=Buffer.from(
  '// Reviewed split-proof activation. Generated by the admission build, not a page renderer.\n'+
  `export const G678_ADMISSION_INDEX = ${JSON.stringify(indexPin,null,2)} as const;\n`);
 const activationCandidate=bytesPin(ACTIVATION_CANDIDATE,activationBytes);
 const transaction=readRegistryTransaction(ROOT);
 const scoped=transaction.registry.calibrations.flatMap(c=>c.entries.map(e=>e.key))
  .filter(key=>key.startsWith('shared-alg001-l06-'));
 assert(scoped.includes('shared-alg001-l06-p003'));
 assert(!scoped.includes('shared-alg001-l06-p004'),'no P004 registration');
 for(const page of index.pages)readPageProof(ROOT,page.proof,host,transaction);
 const result={schemaVersion:1,kind:'alg-l06-p004-predecessor-host-successor-v20',
  status:'planned-not-active',predecessor:{index:OLD_INDEX,host:OLD_HOST,
   activation:ACTIVATION},changed,addedHostInputs:additions,
  host:hostPin,index:indexPin,activationCandidate,
  registeredP004:false,priorProofsUnchanged:index.pages.map(page=>page.proof),
  inputCount:files.length,sourceRoot:'real-physical-source-only',acceptanceEffects:'none'};
 return {result,hostBytes,indexBytes,activationBytes};
}
const mode=process.argv[2];
assert(['--plan','--prepare'].includes(mode)&&process.argv.length===3,
 'Usage: --plan | --prepare; activation is a separate reviewed step');
const {result,hostBytes,indexBytes,activationBytes}=plan();
if(mode==='--plan')console.log(JSON.stringify(result,null,2));
else{
 assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'no concurrent activation');
 const host=writeExact(HOST_OUTPUT,hostBytes),index=writeExact(INDEX_OUTPUT,indexBytes),
  candidate=writeExact(ACTIVATION_CANDIDATE,activationBytes);
 assert.deepEqual(host,result.host);assert.deepEqual(index,result.index);
 assert.deepEqual(candidate,result.activationCandidate);
 assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v19 remains active after prepare');
 const receipt=writeExact(RECEIPT,json({...result,status:'prepared-not-active'}));
 console.log(JSON.stringify({...result,status:'prepared-not-active',receipt},null,2));
}
