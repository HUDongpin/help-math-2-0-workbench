#!/usr/bin/env node
/** P056 finite DOM page proof. Preparation never mutates the registry or
 * historical packets. Run with node --import tsx for the pure TS projection. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,readRegistryTransaction,sha256,uniquePins} from '../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../lib/nms-l02-successor-proof.mjs';
import {validateP055AdmissionSemantics,validateP055ProofClosure} from '../lib/nms-l02-p055-admission-semantics.mjs';
import {extendNmsL02P055Descriptor} from '../apps/web/lib/nms-l02-p055-descriptor-extension.ts';
import {extendNmsL02P056Descriptor} from '../apps/web/lib/nms-l02-p056-descriptor-extension.ts';
import {buildP056DomArtifactPlan,checkP056DomArtifacts} from './prepare-nms-l02-p056-dom-artifacts-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import * as S from '../lib/nms-l02-p056-admission-semantics.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=S.P056_ADMISSION_ID,CALIBRATION=S.P056_ADMISSION_CALIBRATION;
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const CANDIDATE=`work/g678-workflow/candidates/${ID}-v1.json`;
const P055_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',bytes:41970,
 sha256:'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1'};
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});

export function buildP056Packet({pins,artifacts}){
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts};
 return {schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:S.P056_SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.P056_SOURCE,sourceXml:S.P056_XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${S.P056_SOURCE.sha256}`,
   stableLessonKey:'shared-nms002-l02',sourceSha256:S.P056_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:56,sourceOccurrence:56,sectionCode:'TS',sectionPageOrdinal:2,
   complexityLane:'behavior-heavy',runtime:S.P056_RUNTIME}],entry,
  audio:{main:S.P056_MAIN_AUDIO,
   productUrl:`/migration-assets/nms-l02-p056/main.mp3?sha256=${S.P056_MAIN_AUDIO.sha256}`,
   transportConfigured:true,firstFrame:5,lastFrame:234,blockCount:230,decodedSamples:422208,
   sampleRate:22050,channels:1,sourceAlignmentAccepted:false,listeningAccepted:false,
   localeAutoPlayback:false,lessonSaSubstituted:false},
  glossary:{candidate:S.P056_GLOSSARY_CANDIDATE,candidateSha256:S.P056_GLOSSARY_CANDIDATE.sha256,
   product:S.P056_GLOSSARY_PRODUCT,sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,originalRuntimeLookupVerified:false,
   lessonXmlDeclaredBanks:{en:'HELP_KEYTERMS/KT/XML/L2KTE01.xml',es:'HELP_KEYTERMS/KT/XML/L2KTS01.xml'},
   controlPolicy:S.P056_CONTROL_POLICY,stopPath:'animation_mc.animation',closePolicy:'remain-paused'},
  integrity:{scope:'single-NMS-L02-P056-source-and-implementation',completeTransitiveClosure:false,
   qualification:'Finite P056 source and maintained DOM inputs; shared host and registry are verified independently.',
   files:pins},
  acceptanceEffects:Object.fromEntries(S.P056_ACCEPTANCE_KEYS.map(key=>[key,false])),
  productCalibrationPassed:false,scaleOutAuthorized:false};
}
export function buildP056AdmissionPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.P056_SOURCE_ROOT,'exact source root');
 assert(!process.env.VERCEL&&!process.env.VERCEL_ENV&&process.env.NODE_ENV!=='production','local only');
 const dom=buildP056DomArtifactPlan({root});checkP056DomArtifacts(dom);
 assert.deepStrictEqual(dom.runPin,S.P056_RUN);assert.deepStrictEqual(dom.memberPin,S.P056_MEMBER);
 const external=[...S.P056_EXTERNAL_EXPECTED].sort((a,b)=>a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path));
 for(const item of external){
  assert.equal(fs.realpathSync(item.root),item.root,'physical external source root');
  assert.deepStrictEqual(pinFile(item.root,item.pin.path),item.pin,'exact external source bytes');
 }
 const pins=uniquePins(S.P056_PAGE_INPUT_PATHS.map(relative=>pinFile(root,relative)));
 for(const pin of [...dom.runManifest.inputs,...dom.runManifest.outputs,
  S.P056_MAIN_AUDIO,S.P056_GLOSSARY_CANDIDATE,S.P056_GLOSSARY_PRODUCT])
  assert.deepStrictEqual(pins.find(value=>value.path===pin.path),pin,'prepared source/product pins unchanged');
 const packet=buildP056Packet({pins,artifacts:dom.artifacts});
 const freezeBytes=json(packet),freezePin=bytePin(FREEZE,freezeBytes);
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,
  freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[packet.entry]};
 S.validateP056AdmissionSemantics({...packet,freezeManifest:freezePin},fragment);
 const transaction=readRegistryTransaction(root);
 const existing=transaction.registry.calibrations.find(row=>row.calibrationId===CALIBRATION);
 if(existing)assert.deepStrictEqual(existing,fragment,'no replacement of existing registration');
 const projected=upsertPrivateCurrentJsCalibration(transaction.registry,fragment);
 const fragmentBytes=json(fragment),fragmentPin=bytePin(FRAGMENT,fragmentBytes);
 const files=uniquePins([...pins,freezePin,fragmentPin]);
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',hostContract:'nms-l02-source-bound-host-v1',
  animationId:ID,freeze:freezePin,packet,registration:fragment,files,external};
 S.validateP056ProofClosure(proof);
 return {root,proof,packet,fragment,projected,outputs:[{path:FREEZE,bytes:freezeBytes},
  {path:FRAGMENT,bytes:fragmentBytes},{path:CANDIDATE,bytes:json(proof)}]};
}
export function verifyP056Predecessor(root,witnessPin,hostPin){
 const state=verifyNmsL02Predecessor(root,witnessPin,hostPin);
 const p055=verifyNmsL02PageProof(root,P055_PROOF,state,validateP055AdmissionSemantics,validateP055ProofClosure);
 const packet=p055.packet;
 state.descriptor=extendNmsL02P055Descriptor(state.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:p055.freeze,glossary:packet.glossary,
 });
 return state;
}
export function verifyP056AdmissionPlan(plan,{witnessPath,hostPath}){
 assert(typeof witnessPath==='string'&&typeof hostPath==='string','explicit host and witness');
 assert.equal(hostPath,'catalog/nms-l02-admission-v1/host-v6.json','P056 requires its reviewed successor host');
 const state=verifyP056Predecessor(plan.root,pinFile(plan.root,witnessPath),pinFile(plan.root,hostPath));
 const hostPaths=new Set(state.host.files.map(pin=>pin.path));
 assert(plan.proof.files.every(pin=>!hostPaths.has(pin.path)),'page and host ownership disjoint');
 const projectedDescriptor=extendNmsL02P056Descriptor(state.descriptor,{
  calibrationId:plan.packet.calibrationId,sourceXml:plan.packet.sourceXml,
  source:{...plan.packet.source,path:path.join(plan.packet.sourceRoot,plan.packet.source.path)},
  selectedPage:plan.packet.selectedPages[0],freeze:plan.proof.freeze,glossary:plan.packet.glossary,
 });
 assert.equal(projectedDescriptor.productBridge.registeredAnimationCount,56,'real predecessor projects exactly one new page');
 return {...state,transaction:{...state.transaction,registry:plan.projected}};
}
export function prepareP056Admission(plan,boundary,{checkOnly=false}={}){
 const state=verifyP056AdmissionPlan(plan,boundary);
 if(!checkOnly){
  assert(plan.outputs.every(output=>!fs.existsSync(path.join(plan.root,output.path))),'immutable outputs must be absent');
  for(const output of plan.outputs){
   fs.mkdirSync(path.dirname(path.join(plan.root,output.path)),{recursive:true});
   fs.writeFileSync(path.join(plan.root,output.path),output.bytes,{flag:'wx'});
  }
 }
 for(const output of plan.outputs)assert.deepStrictEqual(readPin(plan.root,bytePin(output.path,output.bytes)),output.bytes);
 const proof=verifyNmsL02PageProof(plan.root,pinFile(plan.root,CANDIDATE),state,
  S.validateP056AdmissionSemantics,S.validateP056ProofClosure);
 assert.deepStrictEqual(proof,plan.proof,'serialized proof roundtrip');
 return {status:checkOnly?'P056_ADMISSION_CHECKED':'P056_PREPARED_NOT_REGISTERED',
  proof:pinFile(plan.root,CANDIDATE),registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [mode,...args]=process.argv.slice(2);
  assert(['--dry-run','--prepare','--check'].includes(mode),'use --dry-run | --prepare | --check');
  assert(mode==='--dry-run'?args.length===0:
   args.length===4&&args[0]==='--witness'&&args[2]==='--host','explicit boundary arguments');
  const plan=buildP056AdmissionPlan();
  const result=mode==='--dry-run'?{status:'P056_DRY_RUN_NOT_REGISTERED',files:plan.proof.files.length,
   external:plan.proof.external.length,registrationEffect:'none',acceptanceEffect:'none'}:
   prepareP056Admission(plan,{witnessPath:args[1],hostPath:args[3]},{checkOnly:mode==='--check'});
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
