#!/usr/bin/env node
/** Audit the mobile-control CSS successor, then separately activate its index. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,readPageProof,readRegistryTransaction,
  sha256,uniquePins,verifyAdmission} from '../lib/g678-admission-proof.mjs';

const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const PREVIOUS_INDEX={path:'catalog/g678-admission-v1/index-v22.json',bytes:2168,
  sha256:'5673c615be20f4126b8788ac92bcf5fedf043010ee4d34475ca026b30c7bc075'};
const PREVIOUS_HOST={path:'catalog/g678-admission-v1/host-v22.json',bytes:69795,
  sha256:'b0cf786d2b5717b2a3a1f97972f785137f1438b6ca628637656715943aef1db1'};
const ACTIVATION={path:'apps/web/lib/g678-admission-activation.ts',bytes:291,
  sha256:'5861314be36e3b0df0134da43cd079befc3f21ff08754f1f43a179f3dd33d90f'};
const CSS_PATH='apps/web/app/globals.css';
const CSS_V22={path:CSS_PATH,bytes:293300,
  sha256:'333064d6d0a3fa39ab4f0d58fd25295bde27b7a7985068ff422061f2de1e75c9'};
const CSS_V23={path:CSS_PATH,bytes:294177,
  sha256:'415d424d9262740e8db847f46596e6d40dfcb2511baab688f23967b5f074d298'};
const OUTPUT='output/alg-l06-p004-controls-host-v23';
const CSS_SNAPSHOT={path:`${OUTPUT}/predecessor/globals-v22.css`,bytes:CSS_V22.bytes,sha256:CSS_V22.sha256};
const ACTIVATION_SNAPSHOT={path:`${OUTPUT}/predecessor/g678-admission-activation-v22.ts`,
  bytes:ACTIVATION.bytes,sha256:ACTIVATION.sha256};
const PRODUCER='scripts/prepare-alg-l06-p004-controls-host-v23.mjs';
const HOST_OUTPUT='catalog/g678-admission-v1/host-v23.json';
const INDEX_OUTPUT='catalog/g678-admission-v1/index-v23.json';
const ACTIVATION_CANDIDATE=`${OUTPUT}/candidate-activation-v23.ts`;
const PREPARED_RECEIPT=`${OUTPUT}/prepared-host-v23-receipt.json`;
const ACTIVATED_RECEIPT=`${OUTPUT}/activated-host-v23-receipt.json`;
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
  assert.deepEqual(pinFile(ROOT,PREVIOUS_INDEX.path),PREVIOUS_INDEX,'exact v22 index');
  assert.deepEqual(pinFile(ROOT,PREVIOUS_HOST.path),PREVIOUS_HOST,'exact v22 host');
  assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v22 is active before preparation');
  assert.deepEqual(pinFile(ROOT,CSS_PATH),CSS_V23,'reviewed mobile-circle CSS only');
  assert.deepEqual(pinFile(ROOT,CSS_SNAPSHOT.path),CSS_SNAPSHOT,'preserved v22 CSS');
  assert.deepEqual(pinFile(ROOT,ACTIVATION_SNAPSHOT.path),ACTIVATION_SNAPSHOT,'preserved v22 activation');
  const index=readJsonPin(ROOT,PREVIOUS_INDEX),previous=readJsonPin(ROOT,PREVIOUS_HOST);
  assert.equal(index.kind,'g678-admission-index-v1');
  assert.deepEqual(index.host,PREVIOUS_HOST);
  assert.equal(index.pages.length,7,'same seven page proofs');
  assert.equal(previous.kind,'g678-admission-host-v1');
  assert.equal(previous.contract,'source-native-current-js-v1');
  assert.deepEqual(uniquePins(previous.files),previous.files,'sorted v22 host files');
  assert.deepEqual(previous.files.filter(pin=>pin.path===CSS_PATH),[CSS_V22],'exact v22 CSS input');
  const oldPaths=new Set(previous.files.map(pin=>pin.path));
  const pageOwned=new Set(index.pages.flatMap(page=>
    readJsonPin(ROOT,page.proof).files.map(pin=>pin.path)));
  assert(!pageOwned.has(CSS_PATH),'CSS is host-owned');
  for(const file of [PRODUCER,CSS_SNAPSHOT.path,ACTIVATION_SNAPSHOT.path])
    assert(!oldPaths.has(file)&&!pageOwned.has(file),`new host-only input: ${file}`);
  for(const pin of previous.files)if(pin.path!==CSS_PATH)readPin(ROOT,pin);
  const producerPin=pinFile(ROOT,PRODUCER);
  readPin(ROOT,producerPin);
  const changed={original:CSS_V22,current:CSS_V23,snapshot:CSS_SNAPSHOT};
  const files=uniquePins([...previous.files.map(pin=>pin.path===CSS_PATH?CSS_V23:pin),
    CSS_SNAPSHOT,ACTIVATION_SNAPSHOT,producerPin]);
  assert.equal(files.length,previous.files.length+3,'two predecessor snapshots and producer');
  const existing=previous.legacyInputTransitions??[];
  assert.equal(existing.filter(item=>item.original.path===CSS_PATH).length,1,
    'single legacy CSS transition');
  const legacyInputTransitions=existing.map(item=>{
    if(item.original.path!==CSS_PATH)return item;
    assert.deepEqual(item.current,CSS_V22,'legacy transition targets v22 CSS');
    readPin(ROOT,item.snapshot);
    return {...item,current:CSS_V23};
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
  assert(!scoped.includes('shared-alg001-l06-p004'),'P004 remains outside the seven prior proofs');
  for(const page of index.pages)readPageProof(ROOT,page.proof,host,transaction);
  const result={schemaVersion:1,kind:'alg-l06-p004-controls-host-successor-v23',
    status:'planned-not-active',predecessor:{index:PREVIOUS_INDEX,host:PREVIOUS_HOST,
      activation:ACTIVATION},changed,addedHostInputs:[CSS_SNAPSHOT,ACTIVATION_SNAPSHOT,producerPin],
    host:hostPin,index:indexPin,activationCandidate,
    registeredP004:false,priorProofsUnchanged:index.pages.map(page=>page.proof),
    inputCount:files.length,acceptanceEffects:'none'};
  return {result,hostBytes,indexBytes,activationBytes};
}

const mode=process.argv[2];
assert(['--plan','--prepare','--activate'].includes(mode)&&process.argv.length===3,
  'Usage: --plan | --prepare | --activate');
if(mode==='--activate'){
  const prepared=readJsonPin(ROOT,pinFile(ROOT,PREPARED_RECEIPT));
  assert.equal(prepared.status,'prepared-not-active');
  assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'activation still points to v22');
  assert.deepEqual(pinFile(ROOT,ACTIVATION_SNAPSHOT.path),ACTIVATION_SNAPSHOT,'v22 activation preserved');
  assert.deepEqual(pinFile(ROOT,CSS_PATH),CSS_V23,'v23 CSS retained');
  assert.deepEqual(pinFile(ROOT,prepared.host.path),prepared.host,'prepared host unchanged');
  assert.deepEqual(pinFile(ROOT,prepared.index.path),prepared.index,'prepared index unchanged');
  const bytes=readPin(ROOT,prepared.activationCandidate);
  const admitted=verifyAdmission(ROOT,prepared.index);
  assert.equal(Object.keys(admitted.packets).length,7,'seven unchanged prior proofs');
  const target=path.join(ROOT,ACTIVATION.path),temp=`${target}.v23-${process.pid}.tmp`;
  try{
    fs.writeFileSync(temp,bytes,{flag:'wx'});
    assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'no concurrent activation');
    fs.renameSync(temp,target);
  }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
  const activation=pinFile(ROOT,ACTIVATION.path);
  assert.equal(activation.sha256,prepared.activationCandidate.sha256);
  assert.equal(activation.bytes,prepared.activationCandidate.bytes);
  const receipt=writeExact(ACTIVATED_RECEIPT,json({...prepared,status:'activated',activation}));
  console.log(JSON.stringify({...prepared,status:'activated',activation,receipt},null,2));
}else{
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
    assert.equal(Object.keys(admitted.packets).length,7,'seven unchanged prior proofs');
    assert.deepEqual(pinFile(ROOT,ACTIVATION.path),ACTIVATION,'v22 remains active after prepare');
    const receipt=writeExact(PREPARED_RECEIPT,json({...result,status:'prepared-not-active'}));
    console.log(JSON.stringify({...result,status:'prepared-not-active',receipt},null,2));
  }
}
