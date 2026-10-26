#!/usr/bin/env node
/** P062 source-bound DOM page proof. Host, registry and activation are separate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readRegistryTransaction,sha256,uniquePins} from '../lib/g678-admission-proof.mjs';
import {verifyNmsL02PageProof} from '../lib/nms-l02-successor-proof.mjs';
import {extendNmsL02P061Descriptor} from '../apps/web/lib/nms-l02-p061-descriptor-extension.ts';
import {extendNmsL02P062Descriptor} from '../apps/web/lib/nms-l02-p062-descriptor-extension.ts';
import {verifyP061Predecessor} from './prepare-nms-l02-p061-admission.mjs';
import {validateP061AdmissionSemantics,validateP061ProofClosure} from '../lib/nms-l02-p061-admission-semantics.mjs';
import {buildP062DomArtifactPlan,checkP062DomArtifacts} from './prepare-nms-l02-p062-dom-artifacts-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import * as S from '../lib/nms-l02-p062-admission-semantics.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=S.P062_ADMISSION_ID,CALIBRATION=S.P062_ADMISSION_CALIBRATION;
const FREEZE=S.P062_FREEZE_PATH,FRAGMENT=S.P062_FRAGMENT_PATH;
const CANDIDATE=`work/g678-workflow/candidates/${ID}-v1.json`;
const P061_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p061-v1.json',bytes:102913,
 sha256:'7e49a257ec06811fb45174752c96f5f5acda8071ed008de31b6951d4db31a094'};
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const counts=registry=>{const entries=registry.calibrations.flatMap(row=>row.entries);
 return{total:entries.length,shared:entries.filter(entry=>entry.key.startsWith('shared-')).length};};

export function buildP062Packet({pins,artifacts,run}){
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts};
 const audio=S.P062_REVIEWED_DOM_SEAL;
 return{schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:S.P062_SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.P062_SOURCE,sourceXml:S.P062_XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${S.P062_SOURCE.sha256}`,
   stableLessonKey:'shared-nms002-l02',sourceSha256:S.P062_SOURCE.sha256,moduleCode:'NMS002',
   lessonNumber:2,globalPageOrdinal:62,sourceOccurrence:62,sectionCode:'TS',sectionPageOrdinal:8,
   complexityLane:'behavior-heavy',runtime:S.P062_RUNTIME}],entry,
  audio:{main:S.P062_MAIN_AUDIO,rawIndex:run.sourceAudio.rawIndex,
   audioReceipt:run.sourceAudio.implementationReceipt,payloads:run.sourceAudio.payloads,
   applicableFeedback:run.sourceAudio.applicableFeedback,
   productUrlPrefix:'/migration-assets/nms-l02-p062/',transportConfigured:true,
   firstFrame:9,lastFrame:828,blockCount:820,decodedSamples:1503936,
   sampleRate:22050,channels:1,sourceAlignmentAccepted:false,listeningAccepted:false,
   localeAutoPlayback:false,lessonSaSubstituted:false,emptyBlockSilenceInserted:false,
   seekTrimApplied:false},
  sourceKeyAttributeCalls:0,glossary:run.glossary,
  editorialCorrections:run.editorialCorrections,
  integrity:{scope:'single-NMS-L02-P062-source-and-implementation',completeTransitiveClosure:false,
   qualification:'Finite P062 source and maintained DOM inputs; one inherited host tool is pinned with identical bytes. The two mathematical wording repairs are qualified modern editorial deviations. No source glossary control or generated terms. Historical host association, original runtime, audio listening and acceptance are unestablished.',
   files:pins,sharedDependencies:audio.sharedDependencies},
  acceptanceEffects:Object.fromEntries(S.P062_ACCEPTANCE_KEYS.map(key=>[key,false])),
  productCalibrationPassed:false,scaleOutAuthorized:false};
}

export function buildP062AdmissionPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.P062_SOURCE_ROOT,'exact AWS source root');
 assert(!process.env.VERCEL&&!process.env.VERCEL_ENV&&process.env.NODE_ENV!=='production','local only');
 const dom=buildP062DomArtifactPlan({root});checkP062DomArtifacts(dom);
 const seal=S.P062_REVIEWED_DOM_SEAL;
 assert.deepStrictEqual(dom.runPin,seal.run,'reviewed run manifest');
 assert.deepStrictEqual(dom.memberPin,seal.member,'reviewed member manifest');
 assert.deepStrictEqual(dom.artifacts,{kind:'maintained-dom-module-v1',module:seal.module,
  timeline:seal.timeline,sourceRun:seal.run,memberManifest:seal.member},'canonical DOM artifacts');
 assert.deepStrictEqual(dom.runManifest.inputs,seal.runInputs,'all 181 reviewed run inputs');
 assert.deepStrictEqual(dom.runManifest.outputs,seal.runOutputs,'all 20 reviewed run outputs');
 assert.deepStrictEqual(dom.runManifest.sharedDependencies,seal.sharedDependencies,'four host dependencies');
 const external=S.P062_EXTERNAL_EXPECTED;
 for(const item of external){
  assert.equal(fs.realpathSync(item.root),item.root,'physical external source root');
  assert.deepStrictEqual(pinFile(item.root,item.pin.path),item.pin,'exact external source bytes');
 }
 for(const pin of [S.P062_SOURCE,S.P062_XML])assert(external.some(item=>
  item.root===S.P062_SOURCE_ROOT&&JSON.stringify(item.pin)===JSON.stringify(pin)),
  'canonical SWF and XML source binding');
 const pins=uniquePins(seal.pageInputPaths.map(relative=>pinFile(root,relative)));
 assert.deepStrictEqual(pins.map(pin=>pin.path),seal.pageInputPaths,'finite exact P062 page closure');
 for(const pin of [...seal.runInputs,...seal.runOutputs,seal.run,seal.member])
  assert.deepStrictEqual(pins.find(value=>value.path===pin.path),pin,`reviewed DOM pin ${pin.path}`);
 const packet=buildP062Packet({pins,artifacts:dom.artifacts,run:dom.runManifest});
 const freezeBytes=json(packet),freezePin=bytePin(FREEZE,freezeBytes);
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,
  freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[packet.entry]};
 S.validateP062AdmissionSemantics({...packet,freezeManifest:freezePin},fragment);
 const transaction=readRegistryTransaction(root);
 const existing=transaction.registry.calibrations.find(row=>row.calibrationId===CALIBRATION);
 if(existing)assert.deepStrictEqual(existing,fragment,'no replacement of existing P062 registration');
 assert.deepStrictEqual(counts(transaction.registry),existing?
  {total:635,shared:493}:{total:634,shared:492},'exact P061 registry predecessor');
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,fragment);
 assert.deepStrictEqual(counts(projected),{total:635,shared:493},'one P062 registry projection');
 const fragmentBytes=json(fragment),fragmentPin=bytePin(FRAGMENT,fragmentBytes);
 const files=uniquePins([...pins,freezePin,fragmentPin]);
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',hostContract:'nms-l02-source-bound-host-v1',
  animationId:ID,freeze:freezePin,packet,registration:fragment,files,external};
 S.validateP062ProofClosure(proof);
 return{root,proof,packet,fragment,projected,outputs:[{path:FREEZE,bytes:freezeBytes},
  {path:FRAGMENT,bytes:fragmentBytes},{path:CANDIDATE,bytes:json(proof)}]};
}

export function verifyP061PredecessorForP062(root,witnessPin,hostPin){
 const state=verifyP061Predecessor(root,witnessPin,hostPin);
 const proof=verifyNmsL02PageProof(root,P061_PROOF,state,
  validateP061AdmissionSemantics,validateP061ProofClosure);
 const packet=proof.packet;
 state.descriptor=extendNmsL02P061Descriptor(state.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 assert.equal(state.descriptor.productBridge.registeredAnimationCount,60,'registered P061 predecessor');
 assert.equal(state.descriptor.glossary.length,25,'no early P062 glossary extension');
 return state;
}
export function assertP062HostPageOverlap(pageFiles,hostFiles){
 const hostPins=new Map(hostFiles.map(pin=>[pin.path,pin]));
 const overlap=pageFiles.filter(pin=>hostPins.has(pin.path));
 assert.deepStrictEqual(overlap,[S.P062_INHERITED_HOST_OVERLAP],
  'only the exact inherited host tool may overlap P062 run evidence');
 assert.deepStrictEqual(hostPins.get(S.P062_INHERITED_HOST_OVERLAP.path),
  S.P062_INHERITED_HOST_OVERLAP,'inherited host tool retains identical bytes');
 return true;
}
export function verifyP062AdmissionPlan(plan,{witnessPath,hostPath}){
 assert(typeof witnessPath==='string'&&typeof hostPath==='string','explicit host and witness');
 assert.equal(hostPath,'catalog/nms-l02-admission-v1/host-v13.json','P062 requires reviewed host-v13');
 const state=verifyP061PredecessorForP062(plan.root,pinFile(plan.root,witnessPath),
  pinFile(plan.root,hostPath));
 assertP062HostPageOverlap(plan.proof.files,state.host.files);
 for(const pin of S.P062_SHARED_DEPENDENCIES)
  assert.deepStrictEqual(state.host.files.find(item=>item.path===pin.path),pin,
   `P062 shared dependency required in host-v13: ${pin.path}`);
 const descriptor=extendNmsL02P062Descriptor(state.descriptor,{
  calibrationId:plan.packet.calibrationId,sourceXml:plan.packet.sourceXml,
  source:{...plan.packet.source,path:path.join(plan.packet.sourceRoot,plan.packet.source.path)},
  selectedPage:plan.packet.selectedPages[0],freeze:plan.proof.freeze,
  sourceKeyAttributeCalls:plan.packet.sourceKeyAttributeCalls,
 });
 assert.equal(descriptor.productBridge.registeredAnimationCount,61,'one P062 descriptor projection');
 assert.equal(descriptor.glossary.length,25,'no invented glossary terms');
 return{...state,transaction:{...state.transaction,registry:plan.projected}};
}
export function prepareP062Admission(plan,boundary,{checkOnly=false}={}){
 const state=verifyP062AdmissionPlan(plan,boundary);
 if(!checkOnly){
  assert(plan.outputs.every(output=>!fs.existsSync(path.join(plan.root,output.path))),
   'immutable P062 outputs must be absent');
  for(const output of plan.outputs){
   fs.mkdirSync(path.dirname(path.join(plan.root,output.path)),{recursive:true});
   fs.writeFileSync(path.join(plan.root,output.path),output.bytes,{flag:'wx'});
  }
 }
 for(const output of plan.outputs)
  assert.deepStrictEqual(readPin(plan.root,bytePin(output.path,output.bytes)),output.bytes);
 const proof=verifyNmsL02PageProof(plan.root,pinFile(plan.root,CANDIDATE),state,
  S.validateP062AdmissionSemantics,S.validateP062ProofClosure);
 assert.deepStrictEqual(proof,plan.proof,'P062 proof reader roundtrip');
 return{status:checkOnly?'P062_ADMISSION_CHECKED':'P062_PREPARED_NOT_REGISTERED',
  proof:pinFile(plan.root,CANDIDATE),registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [mode,...args]=process.argv.slice(2);
  assert(['--dry-run','--prepare','--check'].includes(mode),'use --dry-run | --prepare | --check');
  assert(mode==='--dry-run'?args.length===0:
   args.length===4&&args[0]==='--witness'&&args[2]==='--host','explicit boundary arguments');
  const plan=buildP062AdmissionPlan();
  const result=mode==='--dry-run'?{status:'P062_DRY_RUN_NOT_REGISTERED',files:plan.proof.files.length,
   external:plan.proof.external.length,registrationEffect:'none',acceptanceEffect:'none'}:
   prepareP062Admission(plan,{witnessPath:args[1],hostPath:args[3]},{checkOnly:mode==='--check'});
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
