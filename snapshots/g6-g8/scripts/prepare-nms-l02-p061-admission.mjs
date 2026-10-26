#!/usr/bin/env node
/** P061 source-bound DOM page proof. No registry, host, or activation mutation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readRegistryTransaction,sha256,uniquePins} from '../lib/g678-admission-proof.mjs';
import {verifyNmsL02PageProof} from '../lib/nms-l02-successor-proof.mjs';
import {extendNmsL02P060Descriptor} from '../apps/web/lib/nms-l02-p060-descriptor-extension.ts';
import {extendNmsL02P061Descriptor} from '../apps/web/lib/nms-l02-p061-descriptor-extension.ts';
import {verifyP060Predecessor} from './prepare-nms-l02-p060-admission.mjs';
import {validateP060AdmissionSemantics,validateP060ProofClosure} from '../lib/nms-l02-p060-admission-semantics.mjs';
import {buildP061DomArtifactPlan,checkP061DomArtifacts} from './prepare-nms-l02-p061-dom-artifacts-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import * as S from '../lib/nms-l02-p061-admission-semantics.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=S.P061_ADMISSION_ID,CALIBRATION=S.P061_ADMISSION_CALIBRATION;
const FREEZE=S.P061_FREEZE_PATH,FRAGMENT=S.P061_FRAGMENT_PATH;
const CANDIDATE=`work/g678-workflow/candidates/${ID}-v1.json`;
const P060_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p060-v1.json',bytes:121846,
 sha256:'7e408e17b13e5d96bef72919f9f132a4718ed9be9578663709f108496e823acd'};
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const counts=registry=>{const entries=registry.calibrations.flatMap(row=>row.entries);
 return{total:entries.length,shared:entries.filter(entry=>entry.key.startsWith('shared-')).length};};

export function buildP061Packet({pins,artifacts}){
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts};
 return{schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:S.P061_SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.P061_SOURCE,sourceXml:S.P061_XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${S.P061_SOURCE.sha256}`,
   stableLessonKey:'shared-nms002-l02',sourceSha256:S.P061_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:61,sourceOccurrence:61,sectionCode:'TS',sectionPageOrdinal:7,
   complexityLane:'behavior-heavy',runtime:S.P061_RUNTIME}],entry,
  audio:S.P061_AUDIO,glossary:S.P061_GLOSSARY,
  integrity:{scope:'single-NMS-L02-P061-source-and-implementation',completeTransitiveClosure:false,
   qualification:'Finite P061 source and maintained DOM inputs, including one byte-identical inherited host tool pinned by the frozen run; the host and registry are verified independently. Conditional identified-host L1 glossary; historical L2 lookup and original runtime parity remain unestablished.',
   files:pins,sharedDependencies:S.P061_REVIEWED_DOM_SEAL.sharedDependencies},
  acceptanceEffects:Object.fromEntries(S.P061_ACCEPTANCE_KEYS.map(key=>[key,false])),
  productCalibrationPassed:false,scaleOutAuthorized:false};
}
export function buildP061AdmissionPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.P061_SOURCE_ROOT,'exact AWS source root');
 assert(!process.env.VERCEL&&!process.env.VERCEL_ENV&&process.env.NODE_ENV!=='production','local only');
 const dom=buildP061DomArtifactPlan({root});checkP061DomArtifacts(dom);
 const seal=S.P061_REVIEWED_DOM_SEAL;
 assert.deepStrictEqual(dom.runPin,seal.run,'reviewed run manifest');
 assert.deepStrictEqual(dom.memberPin,seal.member,'reviewed member manifest');
 assert.deepStrictEqual(dom.artifacts,{kind:'maintained-dom-module-v1',module:seal.module,
  timeline:seal.timeline,sourceRun:seal.run,memberManifest:seal.member},'canonical DOM artifacts');
 assert.deepStrictEqual(dom.runManifest.inputs,seal.runInputs,'all 179 reviewed run inputs');
 assert.deepStrictEqual(dom.runManifest.outputs,seal.runOutputs,'all 22 reviewed run outputs');
 assert.deepStrictEqual(dom.runManifest.sharedDependencies,seal.sharedDependencies,'six host dependencies');
 const external=S.P061_EXTERNAL_EXPECTED;
 for(const item of external){
  assert.equal(fs.realpathSync(item.root),item.root,'physical external source root');
  assert.deepStrictEqual(pinFile(item.root,item.pin.path),item.pin,'exact external source bytes');
 }
 for(const pin of [S.P061_SOURCE,S.P061_XML])assert(external.some(item=>
  item.root===S.P061_SOURCE_ROOT&&JSON.stringify(item.pin)===JSON.stringify(pin)),
  'canonical SWF and XML source binding');
 const pins=uniquePins(seal.pageInputPaths.map(relative=>pinFile(root,relative)));
 assert.deepStrictEqual(pins.map(pin=>pin.path),seal.pageInputPaths,'finite exact P061 page closure');
 for(const pin of [...seal.runInputs,...seal.runOutputs,seal.run,seal.member])
  assert.deepStrictEqual(pins.find(value=>value.path===pin.path),pin,`reviewed DOM pin ${pin.path}`);
 const packet=buildP061Packet({pins,artifacts:dom.artifacts});
 const freezeBytes=json(packet),freezePin=bytePin(FREEZE,freezeBytes);
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,
  freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[packet.entry]};
 S.validateP061AdmissionSemantics({...packet,freezeManifest:freezePin},fragment);
 const transaction=readRegistryTransaction(root);
 const existing=transaction.registry.calibrations.find(row=>row.calibrationId===CALIBRATION);
 if(existing)assert.deepStrictEqual(existing,fragment,'no replacement of existing P061 registration');
 assert.deepStrictEqual(counts(transaction.registry),existing?
  {total:634,shared:492}:{total:633,shared:491},'exact P060 registry predecessor');
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,fragment);
 assert.deepStrictEqual(counts(projected),{total:634,shared:492},'one P061 registry projection');
 const fragmentBytes=json(fragment),fragmentPin=bytePin(FRAGMENT,fragmentBytes);
 const files=uniquePins([...pins,freezePin,fragmentPin]);
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',hostContract:'nms-l02-source-bound-host-v1',
  animationId:ID,freeze:freezePin,packet,registration:fragment,files,external};
 S.validateP061ProofClosure(proof);
 return{root,proof,packet,fragment,projected,outputs:[{path:FREEZE,bytes:freezeBytes},
  {path:FRAGMENT,bytes:fragmentBytes},{path:CANDIDATE,bytes:json(proof)}]};
}
export function verifyP061Predecessor(root,witnessPin,hostPin){
 const state=verifyP060Predecessor(root,witnessPin,hostPin);
 const proof=verifyNmsL02PageProof(root,P060_PROOF,state,validateP060AdmissionSemantics,validateP060ProofClosure);
 const packet=proof.packet;
 state.descriptor=extendNmsL02P060Descriptor(state.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 assert.equal(state.descriptor.productBridge.registeredAnimationCount,59,'registered P060 predecessor');
 return state;
}
export function assertP061HostPageOverlap(pageFiles,hostFiles){
 const hostPins=new Map(hostFiles.map(pin=>[pin.path,pin]));
 const overlap=pageFiles.filter(pin=>hostPins.has(pin.path));
 assert.deepStrictEqual(overlap,[S.P061_INHERITED_HOST_OVERLAP],
  'only the exact inherited host tool may overlap P061 run evidence');
 assert.deepStrictEqual(hostPins.get(S.P061_INHERITED_HOST_OVERLAP.path),
  S.P061_INHERITED_HOST_OVERLAP,'inherited host tool retains identical bytes');
 return true;
}
export function verifyP061AdmissionPlan(plan,{witnessPath,hostPath}){
 assert(typeof witnessPath==='string'&&typeof hostPath==='string','explicit host and witness');
 assert.equal(hostPath,'catalog/nms-l02-admission-v1/host-v11.json','P061 requires reviewed host-v11');
 const state=verifyP061Predecessor(plan.root,pinFile(plan.root,witnessPath),pinFile(plan.root,hostPath));
 assertP061HostPageOverlap(plan.proof.files,state.host.files);
 for(const pin of S.P061_REVIEWED_DOM_SEAL.sharedDependencies)
  assert.deepStrictEqual(state.host.files.find(item=>item.path===pin.path),pin,
   `P061 shared dependency required in host-v11: ${pin.path}`);
 const descriptor=extendNmsL02P061Descriptor(state.descriptor,{
  calibrationId:plan.packet.calibrationId,sourceXml:plan.packet.sourceXml,
  source:{...plan.packet.source,path:path.join(plan.packet.sourceRoot,plan.packet.source.path)},
  selectedPage:plan.packet.selectedPages[0],freeze:plan.proof.freeze,glossary:plan.packet.glossary,
 });
 assert.equal(descriptor.productBridge.registeredAnimationCount,60,'one P061 descriptor projection');
 return{...state,transaction:{...state.transaction,registry:plan.projected}};
}
export function prepareP061Admission(plan,boundary,{checkOnly=false}={}){
 const state=verifyP061AdmissionPlan(plan,boundary);
 if(!checkOnly){
  assert(plan.outputs.every(output=>!fs.existsSync(path.join(plan.root,output.path))),
   'immutable P061 outputs must be absent');
  for(const output of plan.outputs){
   fs.mkdirSync(path.dirname(path.join(plan.root,output.path)),{recursive:true});
   fs.writeFileSync(path.join(plan.root,output.path),output.bytes,{flag:'wx'});
  }
 }
 for(const output of plan.outputs)
  assert.deepStrictEqual(readPin(plan.root,bytePin(output.path,output.bytes)),output.bytes);
 const proof=verifyNmsL02PageProof(plan.root,pinFile(plan.root,CANDIDATE),state,
  S.validateP061AdmissionSemantics,S.validateP061ProofClosure);
 assert.deepStrictEqual(proof,plan.proof,'P061 proof reader roundtrip');
 return{status:checkOnly?'P061_ADMISSION_CHECKED':'P061_PREPARED_NOT_REGISTERED',
  proof:pinFile(plan.root,CANDIDATE),registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [mode,...args]=process.argv.slice(2);
  assert(['--dry-run','--prepare','--check'].includes(mode),'use --dry-run | --prepare | --check');
  assert(mode==='--dry-run'?args.length===0:
   args.length===4&&args[0]==='--witness'&&args[2]==='--host','explicit boundary arguments');
  const plan=buildP061AdmissionPlan();
  const result=mode==='--dry-run'?{status:'P061_DRY_RUN_NOT_REGISTERED',files:plan.proof.files.length,
   external:plan.proof.external.length,registrationEffect:'none',acceptanceEffect:'none'}:
   prepareP061Admission(plan,{witnessPath:args[1],hostPath:args[3]},{checkOnly:mode==='--check'});
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
