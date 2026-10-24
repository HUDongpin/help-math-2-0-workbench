/** P008 source and one-page candidate semantics. No registry or host writes. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';

export const ID='shared-alg001-l06-p008';
export const CALIBRATION='g678-alg-l06-p008-current-js-20260928-v1';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
export const MEMBER_ROOT=`work/g678-shared-page-factory/${CALIBRATION}/members/${ID}`;
export const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW07.swf',bytes:2805364,
 sha256:'6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW07.mp3',bytes:135072,
 sha256:'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3'};
export const AUDIT={path:`migrations/${ID}/audit/source-v1/source-audit-v1.json`,bytes:7960,
 sha256:'e14303e47454761f2fc17b77b7eb6afc714354d50cfbd1bd151264a516db6de2'};
export const TEXT_AUDIT={path:`migrations/${ID}/audit/text-state-v1/text-state-audit-v1.json`,bytes:7446,
 sha256:'2f5602d837edacd53a47ac3a7c7a7fe051421df4e076844c7987acf71f88e9e4'};
export const SA_AUDIT={path:`migrations/${ID}/audit/sa-host-v1/sa-host-disposition-v1.json`,bytes:8043,
 sha256:'220a687e723dc47f45997262c5311aef340dc881a97f0b274d7dfc79e3651227'};
export const AUDIO_AUDIT={path:`migrations/${ID}/audit/audio-v1/audio-source-audit-v1.json`,bytes:207323,
 sha256:'d480a9e8ffd48a5b46e03a82035c78f55369f9b5d07757cfaff6759a7df07ee4'};
export const MAIN={path:`migrations/${ID}/audit/audio-v1/continuous-source-v1.mp3`,bytes:377130,
 sha256:'ab14ce47d0f98c841213b222f27e7bc44587ba27849048ed1dd16bd41c2eabe2'};
export const SA_ASSET={...SA,path:`migrations/${ID}/audit/audio-v1/separate-sa-source-v1.mp3`};
export const CANVAS_SOURCE={path:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/canvas-renderer.js',
 bytes:19032480,sha256:'ef40a85081b1cd131e3751fbaec8242a847592247f1b1992f681dd499309c33e'};
export const CANVAS_MANIFEST={path:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/optimized-manifest.json',
 bytes:2900,sha256:'82d6997dacc6e6a7694bcca1b40909df4cbbf1af78b17921b16e011c7842353a'};
export const ARTIFACTS=Object.freeze({
 module:{path:`packages/demos/src/modules/${ID}.tsx`,bytes:1620,
  sha256:'245bded4aa69611b79761833c0a33c44f47b619106d266487f1a8cd4de16a802'},
 timeline:{path:`packages/demos/src/timelines/${ID}.ts`,bytes:1199,
  sha256:'a590284492a2e03a9023858b2c6e411b38feddc8e9a3ea3cd1cb1cf8afce0630'},
 runtime:{...CANVAS_SOURCE,path:`${MEMBER_ROOT}/canvas-renderer.js`},
});
export const ACCEPTANCE=Object.freeze({authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false});
export const RUNTIME=Object.freeze({frameDomain:'sprite-507',frameCount:938,rootFrameCount:10,
 rootBeginFrame:6,fps:12,stage:{width:800,height:600},scenario:'source-static-frame',seed:'0',
 canvasRenderer:ARTIFACTS.runtime,hostPlaybackCompletion:false});
export const CONTINUOUS=Object.freeze({audit:AUDIO_AUDIT,mp3:MAIN,streamHeadCount:1,blockCount:911,
 sampleRate:22050,decodedSamples:1670976,initialSeekSamples:1673,firstAudioBlockFrame:19,
 gapFrames:[569,570,571,572,573,574,575,576,577],negativeRawSeekFrame:568,
 syntheticSilenceForAbsentBlocks:false,twoRunPlayback:false,
 originalRuntimeAccepted:false,audioAccepted:false});
export const OPTIONAL_SPANISH=Object.freeze({source:SA,asset:SA_ASSET,trigger:'explicit-user-only',
 localeAutoplay:false,mainStreamSpliced:false,mainPausedDuringPlayback:true,
 pendingLoadCancellation:true,returnMainSupported:true,startSample:0,audioAccepted:false});

function addSourcePin(root,pin,local,external){
 const exact={path:pin.path,bytes:pin.bytes,sha256:pin.sha256};
 if(!path.isAbsolute(exact.path)){readPin(root,exact);local.push(exact);return;}
 const source=exact.path.startsWith(`${root}/`)
  ? {root,pin:{...exact,path:path.relative(root,exact.path)}}
  : exact.path.startsWith(`${SOURCE_ROOT}/`)
   ? {root:SOURCE_ROOT,pin:{...exact,path:path.relative(SOURCE_ROOT,exact.path)}}
   : {root:path.dirname(exact.path),pin:{...exact,path:path.basename(exact.path)}};
 readPin(source.root,source.pin);
 if(source.root===root)local.push(source.pin);else external.push(source);
}

/** Physical source, recovered composition, audio and maintained candidate input closure. */
export function readP008CanonicalSource(root){
 for(const pin of [SOURCE,XML,SA])readPin(SOURCE_ROOT,pin);
 for(const pin of [AUDIT,TEXT_AUDIT,SA_AUDIT,AUDIO_AUDIT,MAIN,SA_ASSET,
  CANVAS_SOURCE,CANVAS_MANIFEST,ARTIFACTS.module,ARTIFACTS.timeline])readPin(root,pin);
 const audit=readJsonPin(root,AUDIT),text=readJsonPin(root,TEXT_AUDIT),
  sa=readJsonPin(root,SA_AUDIT),audio=readJsonPin(root,AUDIO_AUDIT),
  canvas=readJsonPin(root,CANVAS_MANIFEST);
 assert.equal(audit.kind,'alg-l06-p008-source-audit-v1');assert.equal(audit.animationId,ID);
 assert.deepEqual(audit.source,{root:SOURCE_ROOT,...SOURCE});
 assert.equal(audit.catalog.globalOrdinal,8);assert.equal(audit.catalog.sectionCode,'RW');
 assert.equal(audit.catalog.sectionPageOrdinal,7);
 assert.equal(audit.header.stage.width,800);assert.equal(audit.header.stage.height,600);
 assert.equal(audit.header.fps,12);assert.equal(audit.header.rootFrameCount,10);
 assert(audit.frameDomains.some(row=>row.domainId==='sprite-507'&&row.declaredFrames===938&&row.rootReachable));
 assert.equal(audit.tagCounts.DefineButton??0,0);assert.equal(audit.tagCounts.DefineButton2??0,0);
 assert.equal(audit.audio.blockCount,911);assert.equal(audit.audio.firstBlockFrame,19);
 assert.equal(audit.audio.lastBlockFrame,938);
 assert.deepEqual(audit.audio.gapFrames,CONTINUOUS.gapFrames);
 assert.deepEqual(audit.audio.negativeSeekFrames,[568]);
 assert.deepEqual(audit.audio.embedded,{name:'source-stream-v1.mp3',bytes:MAIN.bytes,sha256:MAIN.sha256});
 assert.deepEqual(audit.audio.optionalSpanish,{...SA,status:'catalog-candidate-only'});
 assert.equal(text.kind,'alg-l06-p008-text-state-audit-v1');
 assert.equal(text.sourceSwfSha256,SOURCE.sha256);
 assert.equal(audio.kind,'alg-l06-p008-audio-source-audit-v1');
 assert.equal(audio.status,'source-and-decoder-measured-modern-candidate-not-original-runtime-or-listening');
 assert.equal(audio.source.swf.sha256,SOURCE.sha256);
 assert.equal(audio.source.separateSa.sha256,SA.sha256);
 assert.equal(audio.embedded.firstBlockFrame,19);assert.equal(audio.embedded.lastBlockFrame,938);
 assert.equal(audio.embedded.blockCount,911);
 assert.deepEqual(audio.embedded.absentBlockFrames,CONTINUOUS.gapFrames);
 assert.deepEqual(audio.embedded.extractedMp3,MAIN);
 assert.equal(audio.decode.main.sampleRate,22050);
 assert.equal(audio.decode.main.samples,CONTINUOUS.decodedSamples);
 assert.equal(sa.kind,'alg-l06-p008-separate-sa-host-disposition-v1');
 assert.equal(sa.animationId,ID);
 assert.equal(sa.status,'verified-static-host-algorithm-conditional-page-application-not-runtime-or-listening');
 assert.equal(sa.inputs.lessonXml.sha256,XML.sha256);
 assert.equal(sa.inputs.pageSwf.sha256,SOURCE.sha256);
 assert.equal(sa.inputs.separateSa.sha256,SA.sha256);
 assert(Object.values(sa.acceptanceEffects).every(value=>value===false));
 assert.equal(canvas.kind,'alg-l06-p008-bounded-bitmap-cache-diagnostic-v2');
 assert.equal(canvas.animationId,ID);
 assert(canvas.outputs.some(row=>row.name==='canvas-renderer.js'&&
  row.bytes===CANVAS_SOURCE.bytes&&row.sha256===CANVAS_SOURCE.sha256));
 const local=[AUDIT,TEXT_AUDIT,SA_AUDIT,AUDIO_AUDIT,MAIN,SA_ASSET,CANVAS_SOURCE,CANVAS_MANIFEST,
  ARTIFACTS.module,ARTIFACTS.timeline];
 const external=[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin}));
 for(const pin of [...text.inputs,...Object.values(sa.inputs)])addSourcePin(root,pin,local,external);
 addSourcePin(root,audit.catalog,local,external);
 for(const output of audit.outputs)if(output.bytes<=64*1024*1024&&
   ['source-facts-v1.json','source-text-v1.json','source-composition-v1.json',
    'source-stream-v1.json','source-stream-v1.mp3','swfmill-v1.xml.gz'].includes(output.name))
  addSourcePin(root,{...output,path:`migrations/${ID}/audit/source-v1/${output.name}`},local,external);
 const byPath=new Map();for(const item of external){const key=`${item.root}/${item.pin.path}`;
  if(byPath.has(key))assert.deepEqual(byPath.get(key),item);else byPath.set(key,item);}
 return {audit,text,sa,canvas,localInputs:uniquePins(local),external:[...byPath.values()]};
}

const FORBIDDEN=new Set(['packages/demos/private-current-js-registry.json',
 'packages/demos/src/registry.local-only.generated.ts',
 'packages/demos/src/registry.local-only.metadata.generated.ts',
 'apps/web/lib/g678-admission-activation.ts']);
export function validateP008AdmissionSemantics(packet,registration){
 assert.equal(packet.schemaVersion,1);assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.sourceRoot,SOURCE_ROOT);assert.equal(packet.scope,'private-engineering');
 assert.equal(packet.deploymentScope,'local-only');
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.continuousSource,CONTINUOUS);
 assert.deepEqual(packet.optionalSpanishAudio,OPTIONAL_SPANISH);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);
 assert.deepEqual(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,moduleCode:'ALG001',
  lessonNumber:6,globalPageOrdinal:8,sourceOccurrence:8,sectionCode:'RW',
  sectionPageOrdinal:7,complexityLane:'behavior-heavy',runtime:RUNTIME}]);
 assert.deepEqual(packet.entry,{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts:ARTIFACTS});
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert(Number.isSafeInteger(packet.freezeManifest.bytes)&&packet.freezeManifest.bytes>0);
 assert.match(packet.freezeManifest.sha256,/^[a-f0-9]{64}$/u);
 assert.deepEqual(registration,{calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[packet.entry]});
 assert(!('canonicalRun' in packet)&&!('canonicalMember' in packet));
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 for(const pin of [AUDIT,TEXT_AUDIT,SA_AUDIT,AUDIO_AUDIT,MAIN,SA_ASSET,CANVAS_SOURCE,
  CANVAS_MANIFEST,...Object.values(ARTIFACTS)])assert.deepEqual(evidence.get(pin.path),pin);
 for(const pin of packet.integrity.files)assert(!FORBIDDEN.has(pin.path)&&
  pin.path!==PROOF_PATH&&pin.path!==FREEZE_PATH&&
  !/^catalog\/g678-admission-v1\/(?:index|host)-v\d+\.json$/u.test(pin.path),
  `no cyclic page evidence: ${pin.path}`);
 return true;
}
