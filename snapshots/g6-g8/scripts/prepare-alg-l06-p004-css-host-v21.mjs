#!/usr/bin/env node
/** Prepare the CSS-only G678 admission host successor without activating it. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,readPageProof,readRegistryTransaction,
  sha256,uniquePins,verifyAdmission} from '../lib/g678-admission-proof.mjs';

const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const PREVIOUS_INDEX={path:'catalog/g678-admission-v1/index-v20.json',bytes:2168,
  sha256:'c4bed88b1829662d7658434dd94230575edadb979f8c57ffa6ba74453439e08c'};
const PREVIOUS_HOST={path:'catalog/g678-admission-v1/host-v20.json',bytes:67736,
  sha256:'7e2c6cc25666569375dfe53ba00112ac2e656cba4fa25a29378e0eebaa596be7'};
const ACTIVATION={path:'apps/web/lib/g678-admission-activation.ts',bytes:291,
  sha256:'f939c4a748a49982fc20e3cfcc5876e198fa5e5a4a99e9021b952300765a1139'};
const CSS_PATH='apps/web/app/globals.css';
const CSS_V20={path:CSS_PATH,bytes:293259,
  sha256:'2847768a60fb5fcac35094351ac14dc38593fdeae1d544a56685dc06b613e679'};
const CSS_V21={path:CSS_PATH,bytes:293300,
  sha256:'333064d6d0a3fa39ab4f0d58fd25295bde27b7a7985068ff422061f2de1e75c9'};
const CSS_V20_SNAPSHOT={path:'output/alg-l06-p004-host-successor-v3/predecessor/globals-v20.css',
  bytes:CSS_V20.bytes,sha256:CSS_V20.sha256};
const PRODUCER='scripts/prepare-alg-l06-p004-css-host-v21.mjs';
const OUTPUT='output/alg-l06-p004-host-successor-v3';
const HOST_OUTPUT='catalog/g678-admission-v1/host-v21.json';
const INDEX_OUTPUT='catalog/g678-admission-v1/index-v21.json';
const ACTIVATION_CANDIDATE=`${OUTPUT}/candidate-activation-v21.ts`;
const RECEIPT=`${OUTPUT}/prepared-host-v21-receipt.json`;
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytesPin=(file,bytes)=>({path:file,bytes:bytes.length,sha256:sha256(bytes)});

function writeExact(file,bytes){
  const target=path.join(ROOT,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  try{fs.writeFileSync(target,bytes,{flag:'wx'});}catch(error){
    if(error?.code!=='EEXIST')throw error;
    assert.deepEqual(readPin(ROOT,bytesPin(file,bytes)),bytes,`immutable output: ${file}`);
  }
  return pinFile(ROOT,file);
}

function plan(){
  assert.deepEqual(pinFile(ROOT,PREVIOUS_INDEX.path),PREVIOUS_INDEX,'exact v20 index');
  assert.deepEqual(pinFile(ROOT,PREVIOUS_HOST.path),PREVIOUS_HOST,'exact v20 host');
  assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v20 remains active');
  assert.deepEqual(pinFile(ROOT,CSS_PATH),CSS_V21,'reviewed v21 CSS');
  assert.deepEqual(pinFile(ROOT,CSS_V20_SNAPSHOT.path),CSS_V20_SNAPSHOT,'preserved v20 CSS');
  const index=readJsonPin(ROOT,PREVIOUS_INDEX);
  const previous=readJsonPin(ROOT,PREVIOUS_HOST);
  assert.equal(index.kind,'g678-admission-index-v1');
  assert.deepEqual(index.host,PREVIOUS_HOST);
  assert.equal(index.pages.length,7,'same seven page proofs');
  assert.equal(previous.kind,'g678-admission-host-v1');
  assert.equal(previous.contract,'source-native-current-js-v1');
  assert.deepEqual(uniquePins(previous.files),previous.files,'sorted v20 host files');
  const oldCss=previous.files.filter(pin=>pin.path===CSS_PATH);
  assert.deepEqual(oldCss,[CSS_V20],'exact v20 CSS input');
  const oldPaths=new Set(previous.files.map(pin=>pin.path));
  const pageOwned=new Set(index.pages.flatMap(page=>
    readJsonPin(ROOT,page.proof).files.map(pin=>pin.path)));
  assert(!pageOwned.has(CSS_PATH),'CSS is host-owned');
  for(const file of [PRODUCER,CSS_V20_SNAPSHOT.path])
    assert(!oldPaths.has(file)&&!pageOwned.has(file),`new host-only input: ${file}`);
  // No other v20 input may drift. The predecessor snapshot remains readable.
  for(const pin of previous.files)if(pin.path!==CSS_PATH)readPin(ROOT,pin);
  const producerPin=pinFile(ROOT,PRODUCER);
  readPin(ROOT,producerPin);
  const changed={original:CSS_V20,current:CSS_V21,snapshot:CSS_V20_SNAPSHOT};
  const files=uniquePins([...previous.files.map(pin=>pin.path===CSS_PATH?CSS_V21:pin),
    CSS_V20_SNAPSHOT,producerPin]);
  assert.equal(files.length,previous.files.length+2,'CSS snapshot and producer only');
  const existing=previous.legacyInputTransitions??[];
  assert.equal(existing.filter(item=>item.original.path===CSS_PATH).length,1,
    'single legacy CSS transition');
  const legacyInputTransitions=existing.map(item=>{
    if(item.original.path!==CSS_PATH)return item;
    assert.deepEqual(item.current,CSS_V20,'legacy transition targets v20 CSS');
    readPin(ROOT,item.snapshot);
    return {...item,current:CSS_V21};
  });
  const host={...previous,previous:PREVIOUS_HOST,files,legacyInputTransitions,
    successorInputTransitions:[...(previous.successorInputTransitions??[]),changed]};
  const hostBytes=json(host),hostPin=bytesPin(HOST_OUTPUT,hostBytes);
  const nextIndex={...index,host:hostPin};
  const indexBytes=json(nextIndex),indexPin=bytesPin(INDEX_OUTPUT,indexBytes);
  const activationBytes=Buffer.from(
    '// Reviewed split-proof activation. Generated by the admission build, not a page renderer.\n'+
    `export const G678_ADMISSION_INDEX = ${JSON.stringify(indexPin,null,2)} as const;\n`);
  const activationCandidate=bytesPin(ACTIVATION_CANDIDATE,activationBytes);
  const transaction=readRegistryTransaction(ROOT);
  const scoped=transaction.registry.calibrations.flatMap(c=>c.entries.map(e=>e.key))
    .filter(key=>key.startsWith('shared-alg001-l06-'));
  assert(scoped.includes('shared-alg001-l06-p003'),'P003 registered');
  assert(!scoped.includes('shared-alg001-l06-p004'),'P004 remains unregistered');
  for(const page of index.pages)readPageProof(ROOT,page.proof,host,transaction);
  const result={schemaVersion:1,kind:'alg-l06-p004-css-host-successor-v21',
    status:'planned-not-active',predecessor:{index:PREVIOUS_INDEX,host:PREVIOUS_HOST,
      activation:ACTIVATION},changed,addedHostInputs:[CSS_V20_SNAPSHOT,producerPin],
    host:hostPin,index:indexPin,activationCandidate,
    registeredP004:false,priorProofsUnchanged:index.pages.map(page=>page.proof),
    inputCount:files.length,acceptanceEffects:'none'};
  return {result,hostBytes,indexBytes,activationBytes};
}

const mode=process.argv[2];
assert(['--plan','--prepare'].includes(mode)&&process.argv.length===3,
  'Usage: --plan | --prepare; activation is a separate reviewed step');
const {result,hostBytes,indexBytes,activationBytes}=plan();
if(mode==='--plan')console.log(JSON.stringify(result,null,2));
else{
  assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'no concurrent activation');
  const host=writeExact(HOST_OUTPUT,hostBytes);
  const index=writeExact(INDEX_OUTPUT,indexBytes);
  const candidate=writeExact(ACTIVATION_CANDIDATE,activationBytes);
  assert.deepEqual(host,result.host);
  assert.deepEqual(index,result.index);
  assert.deepEqual(candidate,result.activationCandidate);
  const admitted=verifyAdmission(ROOT,index);
  assert.equal(Object.keys(admitted.packets).length,7,'seven unchanged admitted pages');
  assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v20 remains active after prepare');
  const receipt=writeExact(RECEIPT,json({...result,status:'prepared-not-active'}));
  console.log(JSON.stringify({...result,status:'prepared-not-active',receipt},null,2));
}
