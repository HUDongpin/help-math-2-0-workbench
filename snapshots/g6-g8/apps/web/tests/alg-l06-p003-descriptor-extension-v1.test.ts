import assert from 'node:assert/strict';
import {test} from 'node:test';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from '../lib/catalog';
import {extendAlgL6Descriptor,readAlgL6P002DecoderSuccessor,readAlgL6P002Packet}
  from '../lib/g678-alg-l06-p002.server';
import {extendAlgL6P001Descriptor,readAlgL6P001Packet}
  from '../lib/g678-alg-l06-p001.server';
import {ALG_L06_P003_ADMISSION_CALIBRATION,ALG_L06_P003_ADMISSION_ID,
  extendAlgL6P003Descriptor,type AlgL06P003DescriptorPacketView,
  type AlgL06P003RegistrationView} from '../lib/alg-l06-p003-descriptor-extension-v1';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env=process.env as Record<string,string|undefined>;
env.NODE_ENV='development';delete env.VERCEL;delete env.VERCEL_ENV;
env.HELP_MATH_G678_SOURCE_ROOT=SOURCE_ROOT;
const root=getWorkspaceRoot();
const snapshot=readJsonPin(root,{path:'output/nms-l02-host-successor-20260927/predecessor/base-witness-v3/full-base-snapshot.json',
 bytes:4124297,sha256:'c14bbcf7529ec50a84f1d1f2fe7b8603285698b680f816eba720f44182ffa7f0'}) as
 {status:string;descriptors:PageOnlyLessonPlayerDescriptor[]};
assert.equal(snapshot.status,'ready');
const original=snapshot.descriptors.filter(item=>item.course.moduleCode==='ALG001'&&item.course.lesson===6);
assert.equal(original.length,1);
const p002=readAlgL6P002Packet(root),decoder=readAlgL6P002DecoderSuccessor(root),p001=readAlgL6P001Packet(root);
const withP002=extendAlgL6Descriptor(original[0],p002,decoder,
 localOnlyAnimationModuleRegistration('shared-alg001-l06-p002'));
const base=extendAlgL6P001Descriptor(withP002,p001,
 localOnlyAnimationModuleRegistration('shared-alg001-l06-p001'));
assert.equal(base.pages.length,60);assert.equal(base.productBridge.registeredAnimationCount,19);
assert.equal(base.pages[2].rendererAvailability.kind,'unavailable');
const actualLessonKeys=readRegistryTransaction(root).registry.calibrations
 .flatMap((row:{entries:{key:string}[]})=>row.entries.map(entry=>entry.key))
 .filter((key:string)=>/^shared-alg001-l06-p\d{3}$/u.test(key)&&key!=='shared-alg001-l06-p003');
assert.equal(actualLessonKeys.length,19);
assert.deepEqual(actualLessonKeys.sort(),[...base.productBridge.selectedAnimationIds].sort());
const sha=(value:string)=>value.repeat(64);
const source={path:'G6-G8-shared/ALG001/L6/RW/L6RW03.swf',bytes:1220637,
 sha256:'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766'};
const sourceXml={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
readPin(SOURCE_ROOT,source);readPin(SOURCE_ROOT,sourceXml);
const calibration=ALG_L06_P003_ADMISSION_CALIBRATION;
const id=ALG_L06_P003_ADMISSION_ID;
const runtime={path:`work/g678-shared-page-factory/${calibration}/members/${id}/canvas-renderer.js`,
 bytes:9063233,sha256:'87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c'};
const planned:AlgL06P003DescriptorPacketView={
 calibrationId:calibration,deploymentScope:'local-only',sourceRoot:SOURCE_ROOT,sourceXml,source,
 freezeManifest:{path:`catalog/product-bridge-calibrations/${calibration}.json`,bytes:1,sha256:sha('a')},
 selectedPages:[{animationId:id,placementId:id,sourceSha256:source.sha256,
  globalPageOrdinal:3,sourceOccurrence:3,sectionCode:'RW',sectionPageOrdinal:2,
  runtime:{frameDomain:'sprite-154',frameCount:719,rootFrameCount:10,rootBeginFrame:6,
   fps:12,stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
   canvasRenderer:runtime,hostPlaybackCompletion:false}}],
 continuousSource:{
  audit:{path:'output/alg-l06-p003-audio-alignment-20260928/continuous-v3.json',
   bytes:320688,sha256:'d3b66115dc1aa6bc61e3d375f475052d646f4f52ea50e544fa9eff4be3b273af'},
  mp3:{path:'/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt/source-stream.mp3',
   bytes:263640,sha256:'91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111'},
  streamHeadCount:1,blockCount:637,sampleRate:22050,decodedSamples:1168128,
  initialSeekSamples:1673,firstAudioBlockFrame:41,twoRunPlayback:false,
  originalRuntimeAccepted:false,audioAccepted:false},
 entry:{key:id,module:`./modules/${id}`,maturity:'private-current-js',
  artifacts:{module:{path:`packages/demos/src/modules/${id}.tsx`,bytes:1,sha256:sha('b')},
   timeline:{path:`packages/demos/src/timelines/${id}.ts`,bytes:1,sha256:sha('c')},runtime}},
 acceptanceEffects:base.productBridge.acceptanceEffects,
 productCalibrationPassed:false,scaleOutAuthorized:false,
};
/** Planned module/freeze pins are shape fixtures; neither file nor registration
 * exists yet. The source, predecessor packets, and 60-page snapshot are real. */
const registration:AlgL06P003RegistrationView={calibrationId:calibration,
 deploymentScope:'local-only',maturity:'private-current-js',
 freezeManifestSha256:planned.freezeManifest.sha256,
 moduleSha256:planned.entry.artifacts.module.sha256,
 timelineSha256:planned.entry.artifacts.timeline.sha256,
 runtimeSha256:planned.entry.artifacts.runtime.sha256};
const reject=(change:(packet:any,registry:any,predecessor:any)=>void)=>{
 const packet=structuredClone(planned),registry=structuredClone(registration),predecessor=structuredClone(base);
 change(packet,registry,predecessor);
 assert.throws(()=>extendAlgL6P003Descriptor(predecessor,packet,registry),
  /ALG_L06_P003_DESCRIPTOR_INVALID/u);
};

test('real source-ordered 19/60 predecessor gains only registered RW2',()=>{
 const next=extendAlgL6P003Descriptor(base,planned,registration);
 assert.equal(next.pages.length,60);assert.equal(next.course.courseShellCount,0);
 assert.equal(next.productBridge.registeredAnimationCount,20);
 assert.equal(next.productBridge.pageOnlyDescriptorMemberCount,60);
 assert.equal(next.pages.filter(page=>page.rendererAvailability.kind==='registered').length,20);
 for(let index=0;index<60;index++)if(index!==2)assert.equal(next.pages[index],base.pages[index]);
 assert.equal(base.pages[2].rendererAvailability.kind,'unavailable');
 assert.equal(next.pages[2].rendererAvailability.kind,'registered');
 if(next.pages[2].rendererAvailability.kind==='registered')assert.deepEqual(next.pages[2].rendererAvailability.runtimeQuery,
  {frameDomain:'sprite-154',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.equal(next.pages[2].presentation?.pageInteractionCompanionTargetIdSuffix,'p003-source-readable');
 assert.equal(next.glossary,base.glossary);assert.equal(next.support,base.support);
 assert.deepEqual(next.productBridge.acceptanceEffects,base.productBridge.acceptanceEffects);
 assert(Object.values(next.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(base.productBridge.registeredAnimationCount,19);
});

test('wrong source identity, ordinal and continuous-stream semantics fail closed',()=>{
 reject(packet=>{packet.source.sha256=sha('f');});
 reject(packet=>{packet.sourceRoot='/tmp';});
 reject(packet=>{packet.sourceXml.bytes=1;});
 reject(packet=>{packet.selectedPages[0].globalPageOrdinal=4;});
 reject(packet=>{packet.selectedPages[0].sectionPageOrdinal=1;});
 reject(packet=>{packet.selectedPages[0].runtime.frameDomain='sprite-155';});
 reject(packet=>{packet.selectedPages[0].runtime.hostPlaybackCompletion=true;});
 reject(packet=>{packet.continuousSource.streamHeadCount=2;});
 reject(packet=>{packet.continuousSource.twoRunPlayback=true;});
 reject(packet=>{packet.continuousSource.mp3.sha256=sha('f');});
 reject(packet=>{packet.acceptanceEffects.audioAccepted=true;});
 reject(packet=>{packet.freezeManifest.path='catalog/other.json';});
 reject(packet=>{packet.entry.artifacts.runtime.sha256=sha('f');});
 reject((_,registry)=>{registry.runtimeSha256=sha('f');});
 assert.throws(()=>extendAlgL6P003Descriptor(base,planned,undefined),
  /ALG_L06_P003_DESCRIPTOR_INVALID/u);
});

test('wrong predecessor count, order, links and gate fail closed',()=>{
 reject((_,__,predecessor)=>{predecessor.productBridge.registeredAnimationCount=20;});
 reject((_,__,predecessor)=>{predecessor.pages[4].animationId=id;});
 reject((_,__,predecessor)=>{predecessor.pages[1].nextPlacementId='shared-alg001-l06-p004';});
 reject((_,__,predecessor)=>{predecessor.pages[2].source.assetId='swf-'+sha('f');});
 reject((_,__,predecessor)=>{predecessor.productBridge.selectedAnimationIds.reverse();});
 reject((_,__,predecessor)=>{predecessor.productBridge.acceptanceEffects.ownerAccepted=true;});
});
