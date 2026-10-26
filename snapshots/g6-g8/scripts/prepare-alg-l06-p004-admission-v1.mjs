#!/usr/bin/env node
/** Prepare one P004 page proof on a reviewed host successor; never register or activate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPageProof,readPin,readRegistryTransaction,sha256,
  uniquePins,verifyHostVersion} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {prepareAdmissionCandidate} from './lib/g678-admission-candidate.mjs';
import * as S from '../lib/alg-l06-p004-admission-semantics-v1.mjs';

const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const PREVIOUS_INDEX={path:'catalog/g678-admission-v1/index-v23.json',bytes:2168,
  sha256:'171511a2f6397bbc20b6037b95bfced56a860c095cc1662b25c11462e512fbf0'};
const PREVIOUS_HOST={path:'catalog/g678-admission-v1/host-v23.json',bytes:70999,
  sha256:'dfbccaf86fecc22f0969c863d57f1ad6de37cacc53e6d958b0a49a08ef9b0307'};
const PREVIOUS_ACTIVATION={path:'apps/web/lib/g678-admission-activation.ts',bytes:291,
  sha256:'e1ce30e7e7a145b16db14ff0575b059101e9d96ff8d2cb9bd76bcff8cb5aac2f'};
const HOST_PATH='catalog/g678-admission-v1/host-v24.json';
const INDEX_PATH='catalog/g678-admission-v1/index-v24.json';
const FRAGMENT_PATH=`work/g678-workflow/candidates/${S.ID}-registration-v1.json`;
const BEFORE='output/alg-l06-p004-admission-v1/before';
const CHANGED_HOST_PATHS=Object.freeze([
  'apps/web/proxy.ts',
  'apps/web/lib/alg-l06-p004-local-request-v1.ts',
  'apps/web/lib/alg-l06-p004-resources-v1.server.ts',
  'apps/web/lib/alg-l06-p004-predecessor-request-v1.ts',
]);
const TYPOGRAPHY_PAIR=Object.freeze([
  `catalog/typography-v1/g678-page-bindings/${S.ID}.json`,
  `catalog/typography-v1/g678-checks/${S.ID}.json`,
]);
const FORBIDDEN_PAGE_INPUTS=new Set([
  'packages/demos/private-current-js-registry.json',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  'apps/web/lib/g678-admission-activation.ts',
  INDEX_PATH,HOST_PATH,S.PROOF_PATH,S.FREEZE_PATH,FRAGMENT_PATH,
  ...TYPOGRAPHY_PAIR,...CHANGED_HOST_PATHS,
]);
const FORMAL_ROUTE=`apps/web/app/[locale]/migration-status/g678-calibration/${S.ID}/continuous-v1/page.tsx`;
const SUPPORT=Object.freeze([
  'scripts/prepare-alg-l06-p004-admission-v1.mjs',
  'scripts/lib/g678-admission-candidate.mjs',
  'lib/alg-l06-p004-admission-semantics-v1.mjs',
  'apps/web/lib/alg-l06-p004-descriptor-extension-v1.ts',
  'apps/web/tests/alg-l06-p004-descriptor-extension-v1.server-test.ts',
  'apps/web/lib/alg-l06-p004-formal-admission-v1.server.ts',
  'apps/web/components/g678-alg-l06-p004-runtime-v1.tsx',
  'apps/web/components/g678-alg-l06-p004-runtime-v1.module.css',
  'apps/web/components/g678-alg-l06-p004-formal-host-lesson-v1.tsx',
  'apps/web/components/g678-alg-l06-p004-formal-player-v1.generated.tsx',
  'apps/web/components/g678-multi-page-lesson-player-v5.generated.tsx',
  'scripts/generate-alg-l06-p004-formal-player-v1.mjs',
  'apps/web/lib/alg-l06-p004-predecessor-resources-v1.server.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p004/canvas-v1/route.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p004/continuous-source-v1/route.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p004/optional-spanish-audio-v1/route.ts',
  FORMAL_ROUTE,
]);
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const pinBytes=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});

function writeExact(relative,bytes){
  const absolute=path.join(ROOT,relative);
  fs.mkdirSync(path.dirname(absolute),{recursive:true});
  try{fs.writeFileSync(absolute,bytes,{flag:'wx'});}catch(error){
    if(error?.code!=='EEXIST')throw error;
    assert.deepEqual(readPin(ROOT,pinBytes(relative,bytes)),bytes,`immutable output: ${relative}`);
  }
  return pinFile(ROOT,relative);
}
function normalizeExternal(items){
  const byPath=new Map();
  for(const item of items){
    assert(item&&typeof item.root==='string'&&item.pin&&
      typeof item.pin.path==='string'&&!path.isAbsolute(item.pin.path),'bounded external pin');
    const absolute=path.join(item.root,item.pin.path),prior=byPath.get(absolute);
    if(prior)assert.deepEqual(prior,item,`conflicting external source ${absolute}`);
    else byPath.set(absolute,item);
  }
  return [...byPath.values()].sort((a,b)=>
    path.join(a.root,a.pin.path).localeCompare(path.join(b.root,b.pin.path)));
}
function checkedHost(oldIndex){
  assert.deepEqual(oldIndex.host,PREVIOUS_HOST,'index names exact v23 host');
  const previous=readJsonPin(ROOT,PREVIOUS_HOST);
  assert.equal(previous.kind,'g678-admission-host-v1');
  assert.equal(previous.contract,'source-native-current-js-v1');
  assert.deepEqual(uniquePins(previous.files),previous.files,'sorted v23 host files');
  assert.equal(oldIndex.pages.length,7,'seven immutable prior proofs');
  const oldPaths=new Set(previous.files.map(pin=>pin.path));
  const pageOwned=new Set(oldIndex.pages.flatMap(page=>
    readJsonPin(ROOT,page.proof).files.map(pin=>pin.path)));
  const changes=[];
  for(const relative of CHANGED_HOST_PATHS){
    const originals=previous.files.filter(pin=>pin.path===relative);
    assert.equal(originals.length,1,`one v23 host input: ${relative}`);
    const original=originals[0],current=pinFile(ROOT,relative);
    const snapshot=pinFile(ROOT,`${BEFORE}/${relative}`);
    assert.equal(snapshot.bytes,original.bytes,`preserved original size: ${relative}`);
    assert.equal(snapshot.sha256,original.sha256,`preserved original hash: ${relative}`);
    assert.notEqual(current.sha256,original.sha256,`reviewed host byte delta: ${relative}`);
    assert(!oldPaths.has(snapshot.path)&&!pageOwned.has(snapshot.path),
      `new host-owned predecessor snapshot: ${relative}`);
    changes.push({original,current,snapshot});
  }
  const changed=new Set(CHANGED_HOST_PATHS);
  for(const pin of previous.files)if(!changed.has(pin.path))readPin(ROOT,pin);
  const existing=previous.legacyInputTransitions??[];
  const legacyInputTransitions=existing.map(item=>{
    const change=changes.find(row=>row.original.path===item.original.path);
    if(!change)return item;
    assert.deepEqual(item.current,change.original,`existing transition ends at v23: ${item.original.path}`);
    readPin(ROOT,item.snapshot);
    return {...item,current:change.current};
  });
  for(const change of changes)if(!existing.some(item=>item.original.path===change.original.path))
    legacyInputTransitions.push(change);
  assert.equal(legacyInputTransitions.filter(item=>item.original.path==='apps/web/proxy.ts').length,1,
    'one retained proxy predecessor transition');
  const successorInputTransitions=[...(previous.successorInputTransitions??[]),...changes];
  const files=uniquePins([...previous.files.map(pin=>
    changes.find(row=>row.original.path===pin.path)?.current??pin),
    ...changes.map(row=>row.snapshot)]);
  assert.equal(files.length,previous.files.length+changes.length,'four snapshots, no removed host input');
  const host={...previous,previous:PREVIOUS_HOST,files,legacyInputTransitions,
    successorInputTransitions};
  return {host,changes,oldPaths,pageOwned};
}

export function buildPlan(){
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.SOURCE_ROOT,'real source root');
  assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
    'local development preparation only');
  assert.deepEqual(pinFile(ROOT,PREVIOUS_INDEX.path),PREVIOUS_INDEX,'exact active v23 index bytes');
  assert.deepEqual(pinFile(ROOT,PREVIOUS_HOST.path),PREVIOUS_HOST,'exact v23 host bytes');
  assert.deepEqual(pinFile(ROOT,PREVIOUS_ACTIVATION.path),PREVIOUS_ACTIVATION,
    'v23 activation remains unchanged during preparation');
  const previousIndex=readJsonPin(ROOT,PREVIOUS_INDEX);
  const {host,changes}=checkedHost(previousIndex);
  const hostBytes=json(host),hostPin=pinBytes(HOST_PATH,hostBytes);
  const transaction=readRegistryTransaction(ROOT);
  const present=transaction.registry.calibrations.flatMap(row=>row.entries.map(entry=>entry.key));
  assert(!present.includes(S.ID),'P004 remains unregistered before preparation');
  assert(present.includes('shared-alg001-l06-p003'),'P003 remains registered');
  assert(!previousIndex.pages.some(page=>page.animationId===S.ID),'P004 is not in v23 index');
  for(const page of previousIndex.pages)readPageProof(ROOT,page.proof,host,transaction);

  const source=S.readP004CanonicalSource(ROOT);
  assert(source&&Array.isArray(source.localInputs)&&Array.isArray(source.external)&&
    source.glossary&&source.audit&&source.saAudit,'verified P004 canonical source closure');
  for(const required of [S.AUDIT,S.GLOSSARY,S.SA_AUDIT,S.MAIN])
    assert(source.localInputs.some(pin=>JSON.stringify(pin)===JSON.stringify(required)),
      `canonical local source pin retained: ${required.path}`);
  const sourcePins=source.localInputs.filter(pin=>!TYPOGRAPHY_PAIR.includes(pin.path));
  for(const pin of sourcePins){
    assert(!FORBIDDEN_PAGE_INPUTS.has(pin.path),`source closure excludes cyclic or transitioned ${pin.path}`);
    readPin(ROOT,pin);
  }
  for(const relative of SUPPORT){
    assert(!FORBIDDEN_PAGE_INPUTS.has(relative),`non-cyclic P004 support ${relative}`);
  }
  const supportPins=SUPPORT.map(relative=>pinFile(ROOT,relative));
  const integrity=uniquePins([...sourcePins,...Object.values(S.ARTIFACTS),...supportPins]);
  assert(!integrity.some(pin=>FORBIDDEN_PAGE_INPUTS.has(pin.path)),
    'registry, dispatch, activation, index, typography and host transitions excluded');
  for(const pin of integrity)readPin(ROOT,pin);
  const external=normalizeExternal(source.external);
  for(const pin of [S.SOURCE,S.XML,S.SA])assert(external.some(item=>
    item.root===S.SOURCE_ROOT&&JSON.stringify(item.pin)===JSON.stringify(pin)),
  `canonical physical source remains in proof.external: ${pin.path}`);
  for(const item of external)readPin(item.root,item.pin);
  const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
    scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
    selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
      sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
      globalPageOrdinal:4,sourceOccurrence:4,sectionCode:'RW',sectionPageOrdinal:3,
      complexityLane:'behavior-heavy',runtime:S.RUNTIME}],
    entry:{key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
      complexityLane:'behavior-heavy',artifacts:S.ARTIFACTS},
    continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
    integrity:{scope:'P004-source-continuous-native-text-glossary-local-current-js',
      completeTransitiveClosure:false,
      qualification:'Original runtime, source audio synchronization, listening, human review and visual fidelity remain independent.',
      files:integrity},
    acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false};
  const freezeBytes=json(packet),freeze=pinBytes(S.FREEZE_PATH,freezeBytes);
  const bound={...packet,freezeManifest:freeze};
  const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
    freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,
    freezeManifestSha256:freeze.sha256,entries:[packet.entry]};
  assert.equal(S.validateP004AdmissionSemantics(bound,registration),true);
  const projected=upsertPrivateCurrentJsCalibration(transaction.registry,registration);
  const legacyInputs=uniquePins([...integrity,...Object.values(S.ARTIFACTS),freeze,...supportPins]);
  const hostPaths=new Set(host.files.map(pin=>pin.path));
  const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,
    animationId:S.ID,packet:bound,registration,legacyInputs,
    files:legacyInputs.filter(pin=>!hostPaths.has(pin.path)),external};
  assert(S.PROOF_PATH.startsWith('work/g678-workflow/candidates/')&&
    !S.PROOF_PATH.split('/').includes('..'),'common candidate helper output boundary');
  const proofBytes=json(proof),proofPin=pinBytes(S.PROOF_PATH,proofBytes);
  const index={...previousIndex,host:hostPin,
    pages:[...previousIndex.pages,{animationId:S.ID,proof:proofPin}]};
  const outputs=new Map([[HOST_PATH,hostBytes],[S.FREEZE_PATH,freezeBytes],
    [FRAGMENT_PATH,json(registration)],[S.PROOF_PATH,proofBytes],[INDEX_PATH,json(index)]]);
  return {outputs,host,hostPin,index,proof,proofPin,bound,registration,external,
    supportPins,transaction,projected,changes};
}

export function operate(mode){
  assert(['--plan','--prepare','--check'].includes(mode),'--plan | --prepare | --check');
  const plan=buildPlan();
  for(const [relative,bytes] of plan.outputs){
    const absolute=path.join(ROOT,relative);
    if(fs.existsSync(absolute))assert.deepEqual(readPin(ROOT,pinBytes(relative,bytes)),bytes,
      `immutable prepared artifact ${relative}`);
    else assert(mode!=='--check',`missing prepared artifact ${relative}`);
  }
  if(mode==='--prepare'){
    for(const relative of [HOST_PATH,S.FREEZE_PATH,FRAGMENT_PATH])
      writeExact(relative,plan.outputs.get(relative));
    if(!fs.existsSync(path.join(ROOT,S.PROOF_PATH))){
      const result=prepareAdmissionCandidate({root:ROOT,output:S.PROOF_PATH,animationId:S.ID,
        packet:plan.bound,registration:plan.registration,
        implementationFiles:plan.supportPins,external:plan.external,hostPin:plan.hostPin,
        transaction:plan.transaction,validateSemantics:S.validateP004AdmissionSemantics});
      assert.deepEqual(result.proof,plan.proofPin,'shared helper emitted exact planned proof');
    }
    writeExact(INDEX_PATH,plan.outputs.get(INDEX_PATH));
  }
  if(mode!=='--plan'){
    const host=verifyHostVersion(ROOT,plan.hostPin);
    for(const page of plan.index.pages){
      const packet=readPageProof(ROOT,page.proof,host,{...plan.transaction,registry:plan.projected});
      if(page.animationId===S.ID)S.validateP004AdmissionSemantics(packet,plan.registration);
    }
    assert.deepEqual([...buildPlan().outputs],[...plan.outputs],
      'stable preparation inputs after roundtrip');
  }
  return {status:mode==='--plan'?'planned-not-written':'prepared-not-registered',
    outputs:[...plan.outputs].map(([relative,bytes])=>pinBytes(relative,bytes)),
    hostChanges:plan.changes,previousProofsUnchanged:plan.index.pages.slice(0,7).map(page=>page.proof),
    pageFiles:plan.proof.files.length,external:plan.external.length,
    registrationChanged:false,activationChanged:false,acceptanceEffects:S.ACCEPTANCE};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.equal(process.argv.length,3,'one CLI mode');
  console.log(JSON.stringify(operate(process.argv[2]),null,2));
}
