#!/usr/bin/env node
/** P028 real-host receipt-gated candidate. No registry or activation writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,readPin,readPageProof,readRegistryTransaction,
 sha256,uniquePins,verifyHostVersion} from '../lib/g678-admission-proof.mjs';
import {preflightRegistration} from './lib/g678-registration-preflight-v1.mjs';
import {prepareAdmissionCandidate} from './lib/g678-admission-candidate-v2.mjs';
import {verifyPageHostInputBoundary} from './lib/g678-page-host-input-boundary-v1.mjs';
import * as S from '../lib/alg-l06-p028-admission-semantics-v1.mjs';
import * as H from '../lib/alg-l06-p028-host-semantics-v1.mjs';

const ROOT=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
export const CALIBRATION='g678-alg-l06-p028-current-js-20261001-v3';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=`work/g678-workflow/candidates/${S.ID}-registration-v3.json`;
export const PROOF=`work/g678-workflow/candidates/${S.ID}-proof-v3.json`;
const serialize=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const same=(a,b,message)=>assert.deepEqual(a,b,message);

/** Early source-only audit remains useful while shared-host inputs are changing. */
export function sourceStructure(){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.SOURCE_ROOT,
  'physical AWS source root must be explicit');
 const source=S.readCanonicalSource(ROOT);
 return {status:'p028-root-packet-and-source-structure-checked-host-pending',
  animationId:S.ID,binding:source.bindingPin,
  sourceEvidenceFiles:Object.keys(source.evidencePins).length,
  boundWorkspaceFiles:source.binding.files.length,
  externalSources:source.binding.external.length,
  registered:false,proofPrepared:false,
  acceptanceEffects:S.ACCEPTANCE};
}

function activeIndex(){
 const text=fs.readFileSync(path.join(ROOT,
  'apps/web/lib/g678-admission-activation.ts'),'utf8');
 const match=text.match(/=\s*(\{[\s\S]*?\})\s+as const;/);
 assert(match,'literal active index pin');
 return JSON.parse(match[1]);
}

/** Source-only preflight intentionally does not call the formal proof writer. */
export function sourceOnly(){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,S.SOURCE_ROOT,
  'physical AWS source root must be explicit');
 const source=S.readCanonicalSource(ROOT);
 same(pinFile(ROOT,S.INDEX.path),S.INDEX,'exact current index-v95');
 same(activeIndex(),S.INDEX,'active index-v95, no inferred successor');
 const index=readJsonPin(ROOT,S.INDEX),host=verifyHostVersion(ROOT,S.HOST),
  transaction=readRegistryTransaction(ROOT);
 same(index.host,S.HOST,'host-v94 predecessor');
 assert(index.pages.length===25&&index.pages.some(p=>p.animationId===
  'shared-alg001-l06-p027')&&!index.pages.some(p=>p.animationId===S.ID),
  '25 retained proofs; P028 not admitted');
 for(const prior of index.pages)readPageProof(ROOT,prior.proof,host,transaction);
 const entries=transaction.registry.calibrations.flatMap(c=>c.entries);
 assert(entries.filter(e=>e.key.startsWith('shared-')).length===515&&
  !entries.some(e=>e.key===S.ID),'real 515 shared-page registry predecessor');
 assert(!transaction.registry.calibrations.some(c=>c.calibrationId===CALIBRATION),
  'P028 calibration not already registered');
 return {status:'p028-source-only-checked-formal-host-pending',
  animationId:S.ID,source:S.SOURCE,binding:source.bindingPin,
  index:S.INDEX,host:S.HOST,registrySha256:transaction.sha256,
  sourceEvidenceFiles:Object.keys(source.evidencePins).length,
  retainedProofs:index.pages.length,registered:false,proofPrepared:false,
  acceptanceEffects:S.ACCEPTANCE,source,index,hostObject:host,transaction};
}

function writeImmutable(relative,bytes){
 const target=path.join(ROOT,relative);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 if(fs.existsSync(target))same(fs.readFileSync(target),bytes,
  `immutable P028 candidate artifact ${relative}`);
 else fs.writeFileSync(target,bytes,{flag:'wx'});
 return pinFile(ROOT,relative);
}

/** Maintained host validators must check every raw case and stable candidate.
 * validateReceipt returns {receipt,artifacts,candidates,raw,validated:true};
 * receipt names raw/stableRuns pins. validatePacket asserts the full freeze. */
export function proposeFinal(receiptPin,validators,producerSupport=[]){
 const base=sourceOnly();
 assert(typeof validators?.validateReceipt==='function'&&
  typeof validators?.validatePacket==='function',
  'maintained real My Lesson receipt and packet validators required');
 assert(receiptPin?.path?.startsWith('output/playwright/alg-l06-p028-'),
  'real P028 host receipt path required');
 same(pinFile(ROOT,receiptPin.path),receiptPin,'exact host receipt bytes');
 const engineering=validators.validateReceipt(readJsonPin(ROOT,receiptPin),
  ROOT,base.source);
 assert(engineering?.validated===true,'real raw host assertions required');
 const receipt=engineering.receipt;
 same([receipt.animationId,receipt.status,receipt.bindingPin,
  receipt.indexPin,receipt.hostPin,receipt.registered,
  receipt.acceptanceEffects],
  [S.ID,'passed',base.source.bindingPin,S.INDEX,S.HOST,false,S.ACCEPTANCE],
  'source/host identity and independent gates');
 same(uniquePins(engineering.artifacts),engineering.artifacts,
  'unique sorted raw host artifact pins');
 same(uniquePins(engineering.candidates),engineering.candidates,
  'unique sorted stable browser candidate pins');
 assert(engineering.artifacts.length>0&&engineering.candidates.length>0&&
  engineering.raw&&receipt.raw&&receipt.stableRuns,
  'raw and frozen stable My Lesson runs required');
 for(const pin of engineering.artifacts){
  assert(pin.path.startsWith('output/playwright/alg-l06-p028-'),
   `bounded actual browser evidence ${pin.path}`);
  readPin(ROOT,pin);
 }
 for(const pin of engineering.candidates){
  assert(pin.path.startsWith('work/g678-workflow/browser-candidates/'),
   `bounded frozen browser candidate ${pin.path}`);
  readPin(ROOT,pin);
 }
 const source=base.source,entry={key:S.ID,module:`./modules/${S.ID}`,
  maturity:'private-current-js',complexityLane:'interactive-understood',
  artifacts:source.binding.artifacts};
 const supportPins=producerSupport.map(file=>pinFile(ROOT,file));
 const allInputs=uniquePins([source.bindingPin,...source.binding.files,
  ...Object.values(entry.artifacts),receiptPin,...engineering.artifacts,
  ...engineering.candidates,...supportPins]);
 const boundary=verifyPageHostInputBoundary(ROOT,S.HOST,allInputs);
 const integrity=boundary.pageOwned;
 const packet={schemaVersion:1,calibrationId:CALIBRATION,
  sourceRoot:S.SOURCE_ROOT,scope:'private-engineering',
  deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,
   assetId:`swf-${S.SOURCE.sha256}`,sourceSha256:S.SOURCE.sha256,
   moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:28,
   sourceOccurrence:28,sectionCode:'VB',sectionPageOrdinal:18,
   complexityLane:'interactive-understood',runtime:{frameDomain:'sprite-30',
    frameCount:134,rootFrameCount:10,rootBeginFrame:6,fps:12,
    stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
    canvasRenderer:entry.artifacts.runtime,
    terminalPolicy:'native-main-audio-eof-and-final-frame-hold',
    hostPlaybackCompletion:false}}],
  entry,...S.p028PacketSource(source),
  hostInputBoundary:{host:boundary.host,files:boundary.hostManaged},
  engineeringReceipt:receiptPin,browserRaw:receipt.raw,
  browserStableRuns:receipt.stableRuns,
  integrity:{scope:'P028-source-134-frames-real-My-Lesson-EN-ES-controls-navigation-and-HTTP',
   completeTransitiveClosure:false,
   qualification:'Current-JS local product evidence only; original-runtime fidelity, source-audio listening, human and Owner decisions remain separate.',
   files:integrity},acceptanceEffects:S.ACCEPTANCE,
  productCalibrationPassed:false,scaleOutAuthorized:false};
 const bytes=serialize(packet),freeze={path:FREEZE,bytes:bytes.length,
  sha256:sha256(bytes)},bound={...packet,freezeManifest:freeze};
 const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[entry]};
 S.validateFormalReaderSourceShape(bound,source);
 validators.validatePacket(bound,registration,ROOT,source,receiptPin,engineering);
 return {...base,engineering,packet,bound,bytes,freeze,registration,
  receiptPin,integrity};
}

/** Promote the reviewed draft first. This call writes only page-owned candidate
 * artifacts and invokes the actual V2 producer and production writer preflight. */
export async function prepareFinal(receiptPin,validators,producerSupport){
 const proposal=proposeFinal(receiptPin,validators,producerSupport);
 writeImmutable(FREEZE,proposal.bytes);
 writeImmutable(FRAGMENT,serialize(proposal.registration));
 same(readPin(ROOT,proposal.freeze),proposal.bytes,'frozen producer bytes');
 const writer=await preflightRegistration({root:ROOT,
  fragment:proposal.registration,transaction:proposal.transaction,exact:true});
 same(writer.registration,proposal.registration,'real writer exact registration');
 if(!fs.existsSync(path.join(ROOT,PROOF)))
  await prepareAdmissionCandidate({root:ROOT,output:PROOF,
   animationId:S.ID,packet:proposal.bound,
   registration:proposal.registration,
   implementationFiles:uniquePins([receiptPin,...producerSupport.map(file=>
    pinFile(ROOT,file)),...proposal.engineering.artifacts,
    ...proposal.engineering.candidates]).filter(pin=>
    !proposal.packet.hostInputBoundary.files.some(shared=>shared.path===pin.path)),
   external:proposal.source.external,hostPin:S.HOST,
   transaction:proposal.transaction,
   validateSemantics:(packet,registration)=>
    validators.validatePacket(packet,registration,ROOT,proposal.source,
     receiptPin,proposal.engineering)});
 const projected={...proposal.transaction,
  registry:{...proposal.transaction.registry,
   calibrations:[...proposal.transaction.registry.calibrations,
    proposal.registration]}};
 const proof=pinFile(ROOT,PROOF);
 readPageProof(ROOT,proof,proposal.hostObject,projected);
 return {status:'P028-candidate-roundtrip-passed-not-registered',
  proof,freeze:proposal.freeze,fragment:pinFile(ROOT,FRAGMENT),
  writer:writer.status,registered:false,activationChanged:false};
}

export const SUPPORT=[
 'apps/web/lib/alg-l06-p028-candidate-binding-v1.ts',
 'lib/alg-l06-p028-admission-semantics-v1.mjs',
 'lib/alg-l06-p028-admission-semantics-v1.test.mjs',
 'lib/alg-l06-p028-host-semantics-v1.mjs',
 'lib/alg-l06-p028-host-semantics-v1.test.mjs',
 'scripts/prepare-alg-l06-p028-admission-v1.mjs',
 'scripts/activate-alg-l06-p028-admission-v1.mjs',
 'scripts/lib/g678-admission-candidate-v2.mjs',
 'scripts/lib/g678-registration-preflight-v1.mjs',
 'scripts/lib/g678-page-host-input-boundary-v1.mjs',
 'scripts/lib/g678-page-host-input-boundary-v1.test.mjs',
 'scripts/lib/g678-p028-final-boundary-v1.test.mjs',
 'output/playwright/alg-l06-p028-candidate-host-v3/prepare-engineering-receipt-v1.mjs',
 'output/alg-l06-p028-native-reading-repair-v1/native-reading.test.mjs',
 'output/alg-l06-p028-native-reading-repair-v1/repair-receipt-v1.json'];
export const VALIDATORS={validateReceipt:H.validateEngineeringReceipt,
 validatePacket:H.validateFinalPacket};

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [,,mode,receiptPath,receiptBytes,receiptSha]=process.argv;
 assert(['--source-structure','--source-only','--plan','--prepare'].includes(mode),'P028 producer mode');
 const receipt=receiptPath?{path:receiptPath,bytes:Number(receiptBytes),sha256:receiptSha}:undefined;
 let result;
 if(mode==='--source-structure'||mode==='--source-only'){
  const {source,index,hostObject,transaction,...report}=mode==='--source-structure'?sourceStructure():sourceOnly();result=report;
 }else if(mode==='--plan'){
  const proposal=proposeFinal(receipt,VALIDATORS,SUPPORT);
  result={status:'p028-real-host-proposal-not-written',freeze:proposal.freeze,
   sourceAndBrowserInputs:proposal.integrity.length,registered:false,proofPrepared:false};
 }else result=await prepareFinal(receipt,VALIDATORS,SUPPORT);
 console.log(JSON.stringify(result,null,2));
}
