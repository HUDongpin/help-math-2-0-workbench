#!/usr/bin/env node
/** P060 finite DOM page proof. Preparation never mutates the registry or
 * historical packets. Run with node --import tsx for the pure TS projection. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,readRegistryTransaction,sha256,uniquePins} from '../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../lib/nms-l02-successor-proof.mjs';
import {extendNmsL02P060Descriptor} from '../apps/web/lib/nms-l02-p060-descriptor-extension.ts';
import {extendNmsL02P058Descriptor} from '../apps/web/lib/nms-l02-p058-descriptor-extension.ts';
import {verifyP058Predecessor} from './prepare-nms-l02-p058-admission.mjs';
import {validateP058AdmissionSemantics,validateP058ProofClosure} from '../lib/nms-l02-p058-admission-semantics.mjs';
import {buildP060DomArtifactPlan,checkP060DomArtifacts} from './prepare-nms-l02-p060-dom-artifacts-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import * as S from '../lib/nms-l02-p060-admission-semantics.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=S.P060_ADMISSION_ID,CALIBRATION=S.P060_ADMISSION_CALIBRATION;
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const CANDIDATE=`work/g678-workflow/candidates/${ID}-v1.json`;
const P058_PROOF={"path":"work/g678-workflow/candidates/shared-nms002-l02-p058-v1.json","bytes":42710,"sha256":"3a90ce389391dc10c89f9bb3cd9c55b134502bda8639019f51b73d4ccd16dfb9"};
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const registryCounts=registry=>{
 const entries=registry.calibrations.flatMap(row=>row.entries);
 return {total:entries.length,shared:entries.filter(entry=>entry.key.startsWith('shared-')).length};
};

export function buildP060Packet({pins,artifacts}){
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts};
 return {schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:S.P060_SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.P060_SOURCE,sourceXml:S.P060_XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${S.P060_SOURCE.sha256}`,
   stableLessonKey:'shared-nms002-l02',sourceSha256:S.P060_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:60,sourceOccurrence:60,sectionCode:'TS',sectionPageOrdinal:6,
   complexityLane:'behavior-heavy',runtime:S.P060_RUNTIME}],entry,
  audio:S.P060_AUDIO,glossary:S.P060_GLOSSARY,
  integrity:{scope:'single-NMS-L02-P060-source-and-implementation',completeTransitiveClosure:false,
   qualification:'Finite P060 source and maintained DOM inputs; shared host and registry are verified independently.',
   files:pins,sharedDependencies:S.P060_SHARED_DEPENDENCIES},
  acceptanceEffects:Object.fromEntries(S.P060_ACCEPTANCE_KEYS.map(key=>[key,false])),
  productCalibrationPassed:false,scaleOutAuthorized:false};
}
export function buildP060AdmissionPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.P060_SOURCE_ROOT,'exact source root');
 assert(!process.env.VERCEL&&!process.env.VERCEL_ENV&&process.env.NODE_ENV!=='production','local only');
 const dom=buildP060DomArtifactPlan({root});checkP060DomArtifacts(dom);
 assert.deepStrictEqual(dom.runPin,S.P060_RUN);assert.deepStrictEqual(dom.memberPin,S.P060_MEMBER);
 const external=[...S.P060_EXTERNAL_EXPECTED].sort((a,b)=>a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path));
 for(const item of external){
  assert.equal(fs.realpathSync(item.root),item.root,'physical external source root');
  assert.deepStrictEqual(pinFile(item.root,item.pin.path),item.pin,'exact external source bytes');
 }
 for(const pin of [S.P060_SOURCE,S.P060_XML])
  assert(external.some(item=>item.root===S.P060_SOURCE_ROOT&&
   JSON.stringify(item.pin)===JSON.stringify(pin)),'canonical external source binding before writes');
 const pins=uniquePins(S.P060_PAGE_INPUT_PATHS.map(relative=>pinFile(root,relative)));
 for(const pin of [...dom.runManifest.inputs,...dom.runManifest.outputs,
  S.P060_MAIN_AUDIO,S.P060_RAW_AUDIO,S.P060_GLOSSARY_CANDIDATE,S.P060_GLOSSARY_RECEIPT,
  S.P060_GLOSSARY_PRODUCT,S.P060_SOURCE_AUDIT])
  assert.deepStrictEqual(pins.find(value=>value.path===pin.path),pin,'prepared source/product pins unchanged');
 assert.deepStrictEqual(dom.runManifest.inputs,S.P060_RUN_INPUTS,'all 216 immutable run inputs');
 assert.deepStrictEqual(dom.runManifest.outputs,S.P060_RUN_OUTPUTS,'immutable generated outputs');
 assert.deepStrictEqual(dom.runManifest.sharedDependencies,S.P060_SHARED_DEPENDENCIES,'host dependency boundary');
 const packet=buildP060Packet({pins,artifacts:dom.artifacts});
 const freezeBytes=json(packet),freezePin=bytePin(FREEZE,freezeBytes);
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,
  freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[packet.entry]};
 S.validateP060AdmissionSemantics({...packet,freezeManifest:freezePin},fragment);
 const transaction=readRegistryTransaction(root);
 const existing=transaction.registry.calibrations.find(row=>row.calibrationId===CALIBRATION);
 if(existing)assert.deepStrictEqual(existing,fragment,'no replacement of existing registration');
 assert.deepStrictEqual(registryCounts(transaction.registry),existing?
  {total:633,shared:491}:{total:632,shared:490},'exact P058 predecessor registry count');
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,fragment);
 assert.deepStrictEqual(registryCounts(projected),{total:633,shared:491},'one P060 registry projection');
 const fragmentBytes=json(fragment),fragmentPin=bytePin(FRAGMENT,fragmentBytes);
 const files=uniquePins([...pins,freezePin,fragmentPin]);
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',hostContract:'nms-l02-source-bound-host-v1',
  animationId:ID,freeze:freezePin,packet,registration:fragment,files,external};
 S.validateP060ProofClosure(proof);
 return {root,proof,packet,fragment,projected,outputs:[{path:FREEZE,bytes:freezeBytes},
  {path:FRAGMENT,bytes:fragmentBytes},{path:CANDIDATE,bytes:json(proof)}]};
}
export function verifyP060Predecessor(root,witnessPin,hostPin){
 const state=verifyP058Predecessor(root,witnessPin,hostPin);
 const proof=verifyNmsL02PageProof(root,P058_PROOF,state,validateP058AdmissionSemantics,validateP058ProofClosure);
 const packet=proof.packet;
 state.descriptor=extendNmsL02P058Descriptor(state.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 assert.equal(state.descriptor.productBridge.registeredAnimationCount,58,'registered P058 predecessor');
 return state;
}
export function verifyP060AdmissionPlan(plan,{witnessPath,hostPath}){
 assert(typeof witnessPath==='string'&&typeof hostPath==='string','explicit host and witness');
 assert.equal(hostPath,'catalog/nms-l02-admission-v1/host-v10.json','P060 requires its reviewed successor host');
 const state=verifyP060Predecessor(plan.root,pinFile(plan.root,witnessPath),pinFile(plan.root,hostPath));
 const hostPaths=new Set(state.host.files.map(pin=>pin.path));
 assert(plan.proof.files.every(pin=>!hostPaths.has(pin.path)),'page and host ownership disjoint');
 for(const pin of S.P060_SHARED_DEPENDENCIES)
  assert.deepStrictEqual(state.host.files.find(item=>item.path===pin.path),pin,
   `P060 shared dependency must be in host-v10: ${pin.path}`);
 const projectedDescriptor=extendNmsL02P060Descriptor(state.descriptor,{
  calibrationId:plan.packet.calibrationId,sourceXml:plan.packet.sourceXml,
  source:{...plan.packet.source,path:path.join(plan.packet.sourceRoot,plan.packet.source.path)},
  selectedPage:plan.packet.selectedPages[0],freeze:plan.proof.freeze,glossary:plan.packet.glossary,
 });
 assert.equal(projectedDescriptor.productBridge.registeredAnimationCount,59,'real predecessor projects exactly one new page');
 return {...state,transaction:{...state.transaction,registry:plan.projected}};
}
export function prepareP060Admission(plan,boundary,{checkOnly=false}={}){
 const state=verifyP060AdmissionPlan(plan,boundary);
 if(!checkOnly){
  assert(plan.outputs.every(output=>!fs.existsSync(path.join(plan.root,output.path))),'immutable outputs must be absent');
  for(const output of plan.outputs){
   fs.mkdirSync(path.dirname(path.join(plan.root,output.path)),{recursive:true});
   fs.writeFileSync(path.join(plan.root,output.path),output.bytes,{flag:'wx'});
  }
 }
 for(const output of plan.outputs)assert.deepStrictEqual(readPin(plan.root,bytePin(output.path,output.bytes)),output.bytes);
 const proof=verifyNmsL02PageProof(plan.root,pinFile(plan.root,CANDIDATE),state,
  S.validateP060AdmissionSemantics,S.validateP060ProofClosure);
 assert.deepStrictEqual(proof,plan.proof,'serialized proof roundtrip');
 return {status:checkOnly?'P060_ADMISSION_CHECKED':'P060_PREPARED_NOT_REGISTERED',
  proof:pinFile(plan.root,CANDIDATE),registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [mode,...args]=process.argv.slice(2);
  assert(['--dry-run','--prepare','--check'].includes(mode),'use --dry-run | --prepare | --check');
  assert(mode==='--dry-run'?args.length===0:
   args.length===4&&args[0]==='--witness'&&args[2]==='--host','explicit boundary arguments');
  const plan=buildP060AdmissionPlan();
  const result=mode==='--dry-run'?{status:'P060_DRY_RUN_NOT_REGISTERED',files:plan.proof.files.length,
   external:plan.proof.external.length,registrationEffect:'none',acceptanceEffect:'none'}:
   prepareP060Admission(plan,{witnessPath:args[1],hostPath:args[3]},{checkOnly:mode==='--check'});
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
