#!/usr/bin/env node
/** Source-bound local P003 proof. Writes immutable evidence, never registration. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,readRegistryTransaction,readPageProof,
 verifyHostVersion,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import * as S from '../lib/alg-l06-p003-admission-semantics-v1.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OLD_INDEX={path:'catalog/g678-admission-v1/index-v15.json',bytes:1864,sha256:'4b8b4552b502e94d7b66d53e94ddf82823ef44b6da8c6bb2b8588624bc341277'};
const OLD_CONFIG_SNAPSHOT='output/nms-l02-p054-product-20260928/admission/formal-production-backup-v1-next.config.ts';
export const HOST_PATH='catalog/g678-admission-v1/host-v16.json';
export const INDEX_PATH='catalog/g678-admission-v1/index-v16.json';
export const FRAGMENT_PATH=`work/g678-workflow/candidates/${S.ID}-registration-v1.json`;
const ROUTE=`apps/web/app/[locale]/migration-status/g678-calibration/${S.ID}/continuous-v2/page.tsx`;
const RESOURCE_BASE=`apps/web/app/flash-assets/g678-local/${S.ID}`;
export const SUPPORT=[
 'lib/alg-l06-p003-admission-semantics-v1.mjs','scripts/prepare-alg-l06-p003-admission-v1.mjs',
 'apps/web/lib/alg-l06-p003-formal-admission-v1.server.ts',
 'apps/web/lib/alg-l06-p003-formal-base-v1.server.ts',
 'apps/web/lib/alg-l06-p003-descriptor-extension-v1.ts',
 'apps/web/lib/alg-l06-p003-canonical-resources-v1.server.ts',
 'apps/web/lib/g678-alg-l06-p003-probe-access.ts',
 'apps/web/lib/alg-l06-p003-continuous-source-access-v2.ts',
 'apps/web/lib/alg-l06-p003-optional-spanish-access-v1.ts',
 'apps/web/lib/alg-l06-p003-local-audio-request-v1.ts',
 'apps/web/components/g678-alg-l06-p003-continuous-runtime-v2.tsx',
 'apps/web/components/g678-alg-l06-p003-continuous-host-lesson-v2.tsx',
 'apps/web/components/g678-alg-l06-p003-host-runtime.module.css',
 'packages/demos/src/alg-l06-p003-text-v1.ts',
 ROUTE,...['canvas-renderer.js','continuous-source-v2','optional-spanish-audio-v1'].map(name=>`${RESOURCE_BASE}/${name}/route.ts`),
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const pinBytes=(file,bytes)=>({path:file,bytes:bytes.length,sha256:sha256(bytes)});
const external=pin=>pin.path.startsWith(`${S.SOURCE_ROOT}/`)?{
 root:S.SOURCE_ROOT,pin:{...pin,path:path.relative(S.SOURCE_ROOT,pin.path)}}:{
 root:path.dirname(pin.path),pin:{...pin,path:path.basename(pin.path)}};
export function buildPlan(root=ROOT){
 assert.equal(fs.realpathSync(root),root);assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.SOURCE_ROOT);
 assert(!process.env.VERCEL&&!process.env.VERCEL_ENV&&process.env.NODE_ENV!=='production');
 const {run,audit}=S.readP003CanonicalSource(root);
 const transaction=readRegistryTransaction(root),entries=transaction.registry.calibrations.flatMap(row=>row.entries);
 assert.equal(entries.length,638);assert.equal(entries.filter(row=>row.key.startsWith('shared-')).length,496);
 assert(!entries.some(row=>row.key===S.ID),'P003 not registered');
 const oldIndex=readJsonPin(root,OLD_INDEX),oldHost=readJsonPin(root,oldIndex.host);
 const changed=oldHost.files.filter(pin=>JSON.stringify(pinFile(root,pin.path))!==JSON.stringify(pin));
 assert.deepEqual(changed.map(pin=>pin.path),['apps/web/next.config.ts'],'only reviewed P053 next.config host delta');
 const snapshot=pinFile(root,OLD_CONFIG_SNAPSHOT),current=pinFile(root,'apps/web/next.config.ts');
 assert.equal(snapshot.bytes,changed[0].bytes);assert.equal(snapshot.sha256,changed[0].sha256);
 assert.equal(current.sha256,'f06f4ec73978aa9a23efe7501b5b12b9d37b46eb64f724a4df9e218361143a0d');
 const host={...oldHost,previous:oldIndex.host,
  files:uniquePins([...oldHost.files.map(pin=>pin.path===current.path?current:pin),snapshot]),
  legacyInputTransitions:[...(oldHost.legacyInputTransitions??[]),{original:changed[0],current,snapshot}]};
 const outputs=new Map([[HOST_PATH,json(host)]]),hostPin=pinBytes(HOST_PATH,outputs.get(HOST_PATH));
 const allInputs=[...run.sourcePins,...Object.values(audit.inputs)];
 const localInputs=allInputs.filter(pin=>!path.isAbsolute(pin.path)||pin.path.startsWith(`${root}/`))
  .map(pin=>({...pin,path:path.isAbsolute(pin.path)?path.relative(root,pin.path):pin.path}));
 const externals=allInputs.filter(pin=>path.isAbsolute(pin.path)&&!pin.path.startsWith(`${root}/`)).map(external);
 const seen=new Set();const sources=externals.filter(item=>{const key=`${item.root}/${item.pin.path}`;
  if(seen.has(key))return false;seen.add(key);return true;});
 for(const item of sources)readPin(item.root,item.pin);
 const integrity=uniquePins([...localInputs,...run.createdArtifacts,...run.reusedArtifacts,...run.reusedDependencies,
  S.RUN,S.MEMBER,S.AUDIT,pinFile(root,`${S.RUN_ROOT}/write-verification.json`),...SUPPORT.map(file=>pinFile(root,file))]);
 for(const pin of integrity)readPin(root,pin);
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  canonicalRun:S.RUN,canonicalMember:S.MEMBER,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:3,sourceOccurrence:3,
   sectionCode:'RW',sectionPageOrdinal:2,complexityLane:'behavior-heavy',runtime:S.RUNTIME}],
  entry:{key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:S.ARTIFACTS},
  continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  integrity:{scope:'P003-source-continuous-stream-and-optional-spanish-local-current-js',
   completeTransitiveClosure:false,qualification:'Original runtime, source audio synchronization, listening and visual fidelity are not accepted.',files:integrity},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false};
 outputs.set(S.FREEZE_PATH,json(packet));const freeze=pinBytes(S.FREEZE_PATH,outputs.get(S.FREEZE_PATH));
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',freezeManifest:freeze.path,
  freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[packet.entry]};
 outputs.set(FRAGMENT_PATH,json(registration));
 const bound={...packet,freezeManifest:freeze};S.validateP003AdmissionSemantics(bound,registration);
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,registration);
 const legacyInputs=uniquePins([...integrity,freeze,...Object.values(S.ARTIFACTS)]);
 const hostPaths=new Set(host.files.map(pin=>pin.path));
 const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,
  animationId:S.ID,packet:bound,registration,legacyInputs,
  files:legacyInputs.filter(pin=>!hostPaths.has(pin.path)),external:sources};
 outputs.set(S.PROOF_PATH,json(proof));const proofPin=pinBytes(S.PROOF_PATH,outputs.get(S.PROOF_PATH));
 const index={...oldIndex,host:hostPin,pages:[...oldIndex.pages,{animationId:S.ID,proof:proofPin}]};
 outputs.set(INDEX_PATH,json(index));
 return{root,outputs,index,proof,projected,transaction,hostPin};
}
export function operate(mode){
 assert(['--plan','--prepare','--check'].includes(mode));const plan=buildPlan();
 for(const [file,bytes] of plan.outputs){const absolute=path.join(plan.root,file);
  if(fs.existsSync(absolute))assert.deepEqual(readPin(plan.root,pinBytes(file,bytes)),bytes,'immutable existing evidence');
  else assert(mode!=='--check',`missing ${file}`);}
 if(mode==='--prepare')for(const [file,bytes] of plan.outputs){const absolute=path.join(plan.root,file);
  if(!fs.existsSync(absolute)){fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,bytes,{flag:'wx'});}}
 if(mode!=='--plan'){
  const host=verifyHostVersion(plan.root,plan.hostPin);
  for(const row of plan.index.pages)readPageProof(plan.root,row.proof,host,{...plan.transaction,registry:plan.projected});
  assert.deepEqual([...buildPlan().outputs],[...plan.outputs],'stable producer inputs');
 }
 return{status:mode==='--plan'?'planned-not-written':'prepared-not-registered',
  outputs:[...plan.outputs].map(([file,bytes])=>pinBytes(file,bytes)),
  pageFiles:plan.proof.files.length,external:plan.proof.external.length,
  preservedProofs:plan.index.pages.length-1,registrationChanged:false,acceptanceEffects:S.ACCEPTANCE};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.equal(process.argv.length,3);console.log(JSON.stringify(operate(process.argv[2])));
}
