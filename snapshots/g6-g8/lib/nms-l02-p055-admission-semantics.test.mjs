import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
 P055_ADMISSION_CALIBRATION,P055_ADMISSION_ID,P055_SOURCE_ROOT,P055_SOURCE,P055_XML,
 P055_RUNTIME,P055_TEXT_IR,P055_MAIN_AUDIO,P055_AUDIO_INDEX,
 P055_GLOSSARY_CANDIDATE,P055_GLOSSARY_PRODUCT,P055_ACCEPTANCE_KEYS,
 P055_PAGE_INPUT_PATHS,P055_EXTERNAL_EXPECTED,
 validateP055AdmissionSemantics,validateP055ProofClosure,
} from './nms-l02-p055-admission-semantics.mjs';

const prepared={...P055_RUNTIME,path:`work/g678-shared-page-factory/${P055_ADMISSION_CALIBRATION}/members/${P055_ADMISSION_ID}/canvas-renderer.js`};
const artifact=(path)=>({path,bytes:100,sha256:'a'.repeat(64)});
const entry={key:P055_ADMISSION_ID,module:`./modules/${P055_ADMISSION_ID}`,maturity:'private-current-js',
 complexityLane:'interactive-understood',artifacts:{
  module:artifact(`packages/demos/src/modules/${P055_ADMISSION_ID}.tsx`),
  timeline:artifact(`packages/demos/src/timelines/${P055_ADMISSION_ID}.ts`),runtime:prepared}};
const freeze={path:`catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.json`,bytes:1000,sha256:'b'.repeat(64)};
function fixture(){
 const packet={schemaVersion:1,calibrationId:P055_ADMISSION_CALIBRATION,sourceRoot:P055_SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:P055_SOURCE,sourceXml:P055_XML,
  selectedPages:[{animationId:P055_ADMISSION_ID,placementId:P055_ADMISSION_ID,
   assetId:`swf-${P055_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',sourceSha256:P055_SOURCE.sha256,
   moduleCode:'NMS002',lessonNumber:2,globalPageOrdinal:55,sourceOccurrence:55,
   sectionCode:'TS',sectionPageOrdinal:1,complexityLane:'interactive-understood',
   runtime:{stage:{width:800,height:600},rootFrameCount:10,rootBeginFrame:6,
    frameDomain:'sprite-26',frameCount:351,livePlaybackEndFrame:351,fps:12,
    language:'fixed-en',scenario:'source-static-frame',seed:'0',renderScale:2,
    canvas:{width:1600,height:1200},canvasRenderer:{...prepared,
     url:`/migration-assets/nms-l02-ts-pilot/typography.js?sha256=${P055_RUNTIME.sha256}`}}}],
  entry,visual:{runtime:prepared,nativeRuntime:P055_RUNTIME,textIr:P055_TEXT_IR,
   unresolvedDynamicTextCharacterIds:[11],originalRuntimeValidated:false},
  audio:{main:P055_MAIN_AUDIO,structure:P055_AUDIO_INDEX,
   structureFacts:{firstFrame:5,lastFrame:351,blockCount:347,emptyFrames:[6],
    decodedSamples:637056,sampleRate:22050,channels:1,
    sourceAlignmentAccepted:false,listeningAccepted:false}},
  glossary:{candidate:P055_GLOSSARY_CANDIDATE,candidateSha256:P055_GLOSSARY_CANDIDATE.sha256,
   product:P055_GLOSSARY_PRODUCT,sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false,
   lessonXmlDeclaredBanks:{en:'HELP_KEYTERMS/KT/XML/L2KTE01.xml',es:'HELP_KEYTERMS/KT/XML/L2KTS01.xml'},
   controls:[
    {id:'sprite-26/depth-11/generation-1',entryId:'Restate',characterId:15,firstFrame:84,lastFrameExclusive:352,sourceKeyAttribute:'Restate'},
    {id:'sprite-26/depth-13/generation-1',entryId:'Question',characterId:16,firstFrame:84,lastFrameExclusive:352,sourceKeyAttribute:'Question'},
    {id:'sprite-26/depth-18/generation-1',entryId:'Problem',characterId:22,firstFrame:145,lastFrameExclusive:352,sourceKeyAttribute:'Problem'},
   ],terms:[{id:'restate',sourceKeyAttribute:'Restate'},
    {id:'question',sourceKeyAttribute:'Question'},{id:'problem',sourceKeyAttribute:'Problem'}],
   stopPath:'animation_mc.animation',closePolicy:'remain-paused'},
  acceptanceEffects:Object.fromEntries(P055_ACCEPTANCE_KEYS.map(key=>[key,false])),
  productCalibrationPassed:false,scaleOutAuthorized:false,freezeManifest:freeze};
 const registration={calibrationId:P055_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[entry]};
 return {packet,registration};
}
const changed=(alter)=>{const pair=structuredClone(fixture());alter(pair.packet,pair.registration);return pair;};

test('P055-only packet accepts exact physical-source semantics and one local registration',()=>{
 const {packet,registration}=fixture();
 assert.equal(validateP055AdmissionSemantics(packet,registration),true);
 const live={...entry,scope:'private-engineering',calibrationId:P055_ADMISSION_CALIBRATION,
  deploymentScope:'local-only',freezeManifestSha256:freeze.sha256,
  moduleSha256:entry.artifacts.module.sha256,timelineSha256:entry.artifacts.timeline.sha256,
  runtimeSha256:entry.artifacts.runtime.sha256};
 assert.equal(validateP055AdmissionSemantics(packet,live),true);
});

test('source, XML occurrence and fixed main timeline drift fail closed',()=>{
 for(const [alter,reason] of [
  [p=>{p.source.sha256='0'.repeat(64);},/SWF source pin/],
  [p=>{p.sourceXml.sha256='0'.repeat(64);},/lesson XML pin/],
  [p=>{p.selectedPages[0].sourceOccurrence=54;},/XML occurrence/],
  [p=>{p.selectedPages[0].runtime.frameDomain='root';},/fixed English main source frame/],
  [p=>{p.selectedPages[0].runtime.rootBeginFrame=1;},/fixed English main source frame/],
  [p=>{p.selectedPages[0].runtime.canvasRenderer.url='/flash-assets/fake.js';},/actual pilot runtime URL/],
  [p=>{p.entry.artifacts.runtime.path=P055_RUNTIME.path;},/bounded pin/],
 ]){const {packet,registration}=changed(alter);
  assert.throws(()=>validateP055AdmissionSemantics(packet,registration),reason);}
});

test('conditional glossary cannot silently become recovered L2 or accepted host lookup',()=>{
 for(const [alter,reason] of [
  [p=>{p.glossary.originalL2XmlResolved=true;},/missing L2 banks/],
  [p=>{p.glossary.historicalHostAssociationEstablished=true;},/missing L2 banks/],
  [p=>{p.glossary.lessonXmlDeclaredBanks.en='HELP_KEYTERMS/KT/XML/L1KTE01.xml';},/real lesson-declared L2/],
  [p=>{p.glossary.controls[2].firstFrame=84;},/three source glossary controls/],
  [p=>{p.glossary.terms[1].sourceKeyAttribute='Different';},/three qualified term keys/],
  [p=>{p.glossary.product.sha256='0'.repeat(64);},/qualified product term data/],
 ]){const {packet,registration}=changed(alter);
  assert.throws(()=>validateP055AdmissionSemantics(packet,registration),reason);}
});

test('audio alignment, acceptance and family scale cannot be promoted by packet drift',()=>{
 for(const [alter,reason] of [
  [p=>{p.audio.structureFacts.blockCount=346;},/continuous source blocks/],
  [p=>{p.audio.structureFacts.listeningAccepted=true;},/continuous source blocks/],
  [p=>{p.acceptanceEffects.audioAccepted=true;},/no acceptance/],
  [p=>{p.productCalibrationPassed=true;},/no acceptance/],
  [p=>{p.scaleOutAuthorized=true;},/no acceptance/],
  [p=>{p.freezeManifest=undefined;},/bounded pin/],
 ]){const {packet,registration}=changed(alter);
  assert.throws(()=>validateP055AdmissionSemantics(packet,registration),reason);}
});

function proofFixture(){
 const {packet,registration}=fixture();
 delete packet.freezeManifest;
 const own=new Map(P055_PAGE_INPUT_PATHS.map(path=>[path,artifact(path)]));
 for(const required of [entry.artifacts.module,entry.artifacts.timeline,
  P055_RUNTIME,P055_TEXT_IR,P055_MAIN_AUDIO,P055_AUDIO_INDEX,
  P055_GLOSSARY_CANDIDATE,P055_GLOSSARY_PRODUCT])own.set(required.path,required);
 own.set(prepared.path,prepared);
 packet.integrity={scope:'single-NMS-L02-P055-source-and-implementation',
  completeTransitiveClosure:false,files:[...own.values()].sort((a,b)=>a.path.localeCompare(b.path))};
 const fragment=artifact(`catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.fragment.json`);
 return {schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:P055_ADMISSION_ID,
  freeze,packet,registration,
  files:[...packet.integrity.files,freeze,fragment].sort((a,b)=>a.path.localeCompare(b.path)),
  external:[...P055_EXTERNAL_EXPECTED].sort((a,b)=>
   a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path))};
}

test('P055 proof closure binds exact page-owned paths and all physical source pins',()=>{
 const proof=proofFixture();
 assert.equal(P055_PAGE_INPUT_PATHS.length,70);
 assert.equal(P055_EXTERNAL_EXPECTED.length,11);
 assert.equal(validateP055ProofClosure(proof),true);
});

test('P055 proof rejects missing glossary bank and identified host ActionScript',()=>{
 for(const suffix of ['L1KTE01.xml','frame_35/DoAction.as']){
  const proof=proofFixture();
  proof.external=proof.external.filter(item=>!item.pin.path.endsWith(suffix));
  assert.throws(()=>validateP055ProofClosure(proof),/exact eleven physical source/u);
 }
});

test('P055 proof rejects sparse or mismatched page-owned closure',()=>{
 const missing=proofFixture();
 const path='output/nms-l02-ts-family-20260927/audio/p055-main-audio-index.json';
 missing.packet.integrity.files=missing.packet.integrity.files.filter(item=>item.path!==path);
 missing.files=missing.files.filter(item=>item.path!==path);
 assert.throws(()=>validateP055ProofClosure(missing),/exact 70 page inputs/u);
 const mismatched=structuredClone(proofFixture());
 const runtimeIndex=mismatched.files.findIndex(item=>item.path===prepared.path);
 mismatched.files[runtimeIndex]={...mismatched.files[runtimeIndex],sha256:'0'.repeat(64)};
 assert.throws(()=>validateP055ProofClosure(mismatched),/proof retains own input/u);
 const duplicate=proofFixture();
 duplicate.external.push(duplicate.external[0]);
 assert.throws(()=>validateP055ProofClosure(duplicate),/exact eleven physical source/u);
});
