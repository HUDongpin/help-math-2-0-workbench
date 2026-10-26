/** P053 source-directions page proof semantics. This file has no import-time IO.
 * The DOM run is not sealed yet: a proof reader must supply independently
 * reviewed run/member/artifact/page pins and rehash their physical bytes. */
import assert from 'node:assert/strict';
import path from 'node:path';

export const P053_ADMISSION_ID='shared-nms002-l02-p053';
export const P053_ADMISSION_CALIBRATION='g678-nms-l02-p053-source-directions-current-js-v1';
export const P053_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P053_SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L2/GS/L2GS02.swf',
 bytes:236774,sha256:'f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf'});
export const P053_XML=Object.freeze({path:'G6-G8-shared/NMS002/L2/index.xml',
 bytes:12845,sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'});
const AUDIT='migrations/shared-nms002-l02-p053/audit';
export const P053_SOURCE_AUDITS=Object.freeze({
 native:{path:`${AUDIT}/native-display-product-v1.json`,bytes:358217,sha256:'2c00b045bf3153ac5f6aadcc197674aca9f368354d85ffbe6bb620854c039151'},
 visual:{path:`${AUDIT}/visual-scene-v1.json`,bytes:1565440,sha256:'b22a2e71c920e425d397a0070338ef9d66e714fff31df8959d9115878fbe8ea7'},
 shape:{path:`${AUDIT}/shape-art-v1.json`,bytes:53546,sha256:'32a3896deed3819ad724c79170de6149c1e83c3dfd536974b3b42d12348b5e40'},
 stream:{path:`${AUDIT}/source-stream-product-v1.json`,bytes:2385,sha256:'5106b1751eb3e40575cb0daad40e4e40563e087fe6da536f283de799d50cc3da'},
 graph:{path:`${AUDIT}/frame-domain-static-graph-v1.json`,bytes:4685,sha256:'8ad79c29aedcb0553b571ed8f20f8f826b7a5feba15c770d2a433f27a40ff3aa'},
 host:{path:`${AUDIT}/host-navigation-resolution-v1.json`,bytes:5555,sha256:'4082197b15ee072fcbbbff594c5a92ceaf19c039964fa3d8cd58cb83a3536332'},
 audioStructure:{path:`${AUDIT}/audio-structure-v1.json`,bytes:2186,sha256:'2468bc4e992701c7fee12a5b52566dcf4653dcb965a474f2d041927c8a5d7d56'},
 gameContract:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json',bytes:12324,sha256:'6d492f48cc2df39ca1636d5f9cde8f7529493eb3770c1d47c690a3c84b8aa205'},
});
export const P053_AUDIO=Object.freeze({
 mp3:{path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-stream-product-v1/sprite-187-source-stream-v1.mp3',bytes:256230,sha256:'225177c9c27670c636ce383e0ec58e439888b14afa33427a53c14ff1ca7a4e7d'},
 rawIndex:{path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-stream-product-v1/raw-block-index-v1.json',bytes:447231,sha256:'71b102949ed66206315863a290691f1f4db1b2331ce3d0283ea90684b0ff8fa8'},
});
export const P053_MOVIE_XML=Object.freeze({
 path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-audit-rjgSPq/movie.xml',
 bytes:1262572,sha256:'058b9759e535ea6a861dd5d260a4648af146bfe1f0bcd45f9baee324be0635e1',
});
export const P053_IDENTIFIED_HOST_BINDING=Object.freeze({
 path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-source-host-binding-v1.json',
 bytes:3064,sha256:'beb92189c1c2d81e035322de426c8f0f07ae02ba03127942236a2a1ca78311f1',
});
export const P053_RUN_PATH=`work/g678-shared-page-factory/${P053_ADMISSION_CALIBRATION}/run-manifest.json`;
export const P053_MEMBER_PATH=`work/g678-shared-page-factory/${P053_ADMISSION_CALIBRATION}/members/${P053_ADMISSION_ID}/member-manifest.json`;
export const P053_MODULE_PATH=`packages/demos/src/modules/${P053_ADMISSION_ID}.tsx`;
export const P053_TIMELINE_PATH=`packages/demos/src/timelines/${P053_ADMISSION_ID}.ts`;
export const P053_FREEZE_PATH=`catalog/product-bridge-calibrations/${P053_ADMISSION_CALIBRATION}.json`;
export const P053_FRAGMENT_PATH=P053_FREEZE_PATH.replace(/\.json$/u,'.fragment.json');
export const P053_PROOF_PATH=`work/g678-workflow/candidates/${P053_ADMISSION_ID}-v1.json`;
export const P053_RUNTIME=Object.freeze({frameDomain:'sprite-187',frameCount:694,
 heldFrame:693,rootFrameCount:10,rootBeginFrame:6,fps:12,
 stage:{width:800,height:600},scenario:'source-directions-v1',seed:'0',
 hostPlaybackCompletion:false,popupCloseReceiverResolved:false,
 audioSynchronizationEstablished:false});
export const P053_ACCEPTANCE_EFFECTS=Object.freeze({authoritativeOriginalRuntime:false,
 fidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,
 ownerAccepted:false,strictComplete:false,published:false});
export const P053_POPUP_TEXT=Object.freeze({
 13:'Find the matching pairs and correct answers will reveal a picture and music.',
 16:'Click one box then find the next box that matches and click it.',
 102:'For each correct match you get 10 points added to your score.  For each incorrect match 2 points are subtracted from your score. ',
 103:'When you are ready to play, choose a level and then click Start to begin the Fractions, Decimals, and Percents Match Game. ',
});
export const P053_SHARED_DEPENDENCY_PATHS=Object.freeze([
 'apps/web/components/animation-runtime.tsx','apps/web/lib/lesson-runtime-adapter.ts',
 'apps/web/tsconfig.json','lib/g678-admission-proof.mjs','packages/demos/src/contract.ts',
 'packages/demos/src/lesson-host-contract.ts','scripts/private-current-js-registry.mjs',
]);
export const P053_REQUIRED_PAGE_PATHS=Object.freeze([
 ...Object.values(P053_SOURCE_AUDITS).map(item=>item.path),
 'apps/web/components/nms-l02-p053-lesson-runtime-v1.tsx',
 'lib/nms-l02-p053-proof-semantics-v1.mjs',
 'lib/nms-l02-p053-proof-semantics-v1.test.mjs',
 P053_RUN_PATH,P053_MEMBER_PATH,P053_MODULE_PATH,P053_TIMELINE_PATH,
 'packages/demos/src/nms-l02-p053-controller-candidate.ts',
 'packages/demos/src/nms-l02-p053-player-state-v1.ts',
 'packages/demos/src/nms-l02-p053-display-state-v1.ts',
 'packages/demos/src/nms-l02-p053-source-scene-v1.tsx',
 'packages/demos/src/nms-l02-p053-readable-directions-v1.tsx',
 'packages/demos/src/nms-l02-p053-source-audio-loader.ts',
 'packages/demos/src/nms-l02-p053-host-navigation-v1.ts',
 'packages/demos/src/generated/nms-l02-p053-display-data-v1.ts',
 'packages/demos/src/generated/nms-l02-p053-shape-art-v1.ts',
]);
const P053_DEFERRED_HOST_REQUIRED=Object.freeze([
 'apps/web/components/g678-nms-l02-p053-product-lesson-v1.generated.tsx',
 'apps/web/lib/nms-l02-p053-product-candidate.server.ts',
 'apps/web/lib/nms-l02-p053-source-audio.server.ts',
 'apps/web/lib/nms-l02-p053-game-resource-access.ts',
 'apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l02-p053/page.tsx',
]);

const same=(actual,expected,label)=>assert.deepStrictEqual(actual,expected,`NMS_L02_P053_PROOF: ${label}`);
const demand=(condition,label)=>assert(condition,`NMS_L02_P053_PROOF: ${label}`);
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const cleanRelative=value=>typeof value==='string'&&!path.isAbsolute(value)&&
 value.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!value.includes('\\');
const pin=(value,expectedPath,{allowEmpty=false}={})=>demand(value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===expectedPath&&
 Number.isSafeInteger(value.bytes)&&value.bytes>=(allowEmpty?0:1)&&value.bytes<=128*1024*1024&&
 /^[a-f0-9]{64}$/u.test(value.sha256),`bounded pin ${expectedPath}`);
function sortedPins(values,label,{allowEmpty=false}={}){
 demand(Array.isArray(values),`${label} array`);
 for(const item of values){demand(cleanRelative(item?.path),`${label} relative path`);
  pin(item,item.path,{allowEmpty});}
 same(values.map(item=>item.path),sorted([...new Set(values.map(item=>item.path))]),
  `${label} sorted unique paths`);
}
function absolutePins(values,label,{allowEmpty=false}={}){
 demand(Array.isArray(values),`${label} array`);
 for(const item of values){demand(path.isAbsolute(item?.path??''),`${label} physical path`);
  pin(item,item.path,{allowEmpty});}
 same(values.map(item=>item.path),sorted([...new Set(values.map(item=>item.path))]),
  `${label} sorted unique paths`);
}
function uniquePhysicalPins(values,label){
 demand(Array.isArray(values),`${label} array`);
 for(const item of values){demand(path.isAbsolute(item?.path??''),`${label} physical path`);pin(item,item.path);}
 demand(new Set(values.map(item=>item.path)).size===values.length,`${label} unique paths`);
}
const physicalSource=Object.freeze({...P053_SOURCE,path:path.join(P053_SOURCE_ROOT,P053_SOURCE.path)});
const physicalXml=Object.freeze({...P053_XML,path:path.join(P053_SOURCE_ROOT,P053_XML.path)});

/** The caller reads the exact audit pins above before passing their JSON. */
export function validateP053SourceInventory({native,visual,stream,host,audioStructure}){
 demand(native?.schemaVersion===1&&native.kind==='nms-l02-p053-native-display-source-ir-v1'&&
  native.animationId===P053_ADMISSION_ID,'native source audit');
 same(native.source,{physicalRoot:P053_SOURCE_ROOT,relativePath:P053_SOURCE.path,
  bytes:P053_SOURCE.bytes,sha256:P053_SOURCE.sha256,swfVersion:6,
  stagePixels:[800,600],fps:12,rootFrames:10,
  rootMainPlacement:{spriteId:187,rootFrame:6,depth:3},mainFrames:694},
  'source SWF, stage and placements');
 demand(native.extraction?.scriptPins?.length===59,'59 source AS pins');
 same(native.sourceAssociations?.directionsPopup,{spriteId:104,mainFrames:[693,694],
  depth:47,sourceTitleTextId:103,scoringTextId:102,closeButtonId:101},
  'source popup identity');
 const popup=native.domains?.find(item=>item.id==='sprite-104');
 same(popup?.frameCount,1,'one-frame popup');
 same(popup.placements.map(item=>({characterId:item.characterId,depth:item.depth,
  firstFrame:item.firstFrame,kind:item.kind})),[
  {characterId:101,depth:2,firstFrame:1,kind:'button'},
  {characterId:13,depth:10,firstFrame:1,kind:'text'},
  {characterId:102,depth:11,firstFrame:1,kind:'text'},
  {characterId:103,depth:12,firstFrame:1,kind:'text'},
  {characterId:16,depth:13,firstFrame:1,kind:'text'},
 ],'all four readable source text placements and Close button');
 const text=new Map(native.textDefinitions?.map(item=>[item.characterId,item]));
 for(const id of [13,16,102,103]){
  demand(text.get(id)?.kind==='static-text',`source popup text ${id}`);
  same(text.get(id).sourceText,P053_POPUP_TEXT[id],`exact popup source text ${id}`);
 }
 demand(visual?.schemaVersion===1&&visual.animationId===P053_ADMISSION_ID&&
  visual.source?.sha256===P053_SOURCE.sha256,'visual source audit');
 same(visual.mainFrameDomain,{id:'sprite-187',declaredFrames:694,heldFrame:693,
  heldActionTagSha256:'d12396116fd8ca67d73447927819dc614493bdad77cf78531ba3fdb7484bdbd1',
  nextDeclaredFrame:694,nextFrameAutoReachedEstablished:false},
  'held frame 693 is distinct from structural frame 694');
 demand(stream?.schema===1||stream?.schema==='nms-l02-p053-source-stream-product-v1',
  'source stream schema');
 demand(stream.animationId===P053_ADMISSION_ID&&stream.source?.sha256===P053_SOURCE.sha256,
  'source stream identity');
 same(stream.stream,{frameDomain:'sprite-187',headFrame:1,firstBlockFrame:4,
  lastBlockFrame:694,blockCount:619,declaredSamples:1135296,
  missingFrameRanges:[{first:303,last:374,count:72}],emptyPayloadFrames:[5,302],
  negativeSeekFrames:[302]},'all 619 blocks, gap, empty and signed seek');
 same(stream.externalFiles,P053_AUDIO,'independent complete MP3 and block index');
 demand(stream.decode?.fullEofDecode===true&&stream.decode.decodedSamples===1135296&&
  stream.decode.sampleRateHz===22050&&stream.limits?.audioListeningAccepted===false&&
  stream.limits.originalRuntimeAccepted===false&&stream.limits.spanishAudioSpliced===false,
  'full decode is not original synchronization or listening acceptance');
 demand(audioStructure?.schemaVersion===1&&audioStructure.animationId===P053_ADMISSION_ID&&
  audioStructure.source?.sha256===P053_SOURCE.sha256&&
  audioStructure.structuralTotals?.soundStreamBlockCount===619&&
  audioStructure.audioAccepted===false&&audioStructure.originalRuntimeAccepted===false,
  'independent source audio structure');
 demand(host?.schemaVersion===1&&host.lessonXml?.sha256===P053_XML.sha256&&
  host.dependencyClosureComplete===false&&host.originalRuntimeAccepted===false,
  'conditional host evidence');
 same(host.lessonXml.gsPagesInOrder,['GS/L2GS02.swf','GS/L2GS03.swf'],
  'ordered GS placement');
 demand(host.p053Actions?.earlyStart?.requestedBasename==='L7GS03'&&
  host.p053Actions.earlyStart.matchesCurrentGsSection===false&&
  host.p053Actions.selectLevelStart?.requestedBasename==='L2GS03'&&
  host.p053Actions.selectLevelStart.matchesCurrentGsSection===true,
  'early current-page reload versus later P054 lookup');
 return true;
}

/** Validate supplied physical, hash-checked DOM objects. No unsealed digest is
 * accepted implicitly: the caller also passes a separately reviewed pin set. */
export function validateP053DomManifests(run,member,artifacts){
 demand(run?.schemaVersion===1&&run.kind==='nms-l02-p053-maintained-dom-source-run-v1'&&
  run.animationId===P053_ADMISSION_ID&&run.sourceRoot===P053_SOURCE_ROOT&&
  run.complexityLane==='behavior-heavy','P053 source DOM run');
 same(run.source,P053_SOURCE,'run source');same(run.sourceXml,P053_XML,'run XML');
 same(run.sourceStructure,{stage:{width:800,height:600},fps:12,rootFrameCount:10,
  rootBeginFrame:6,frameDomain:'sprite-187',sourceFrameCount:694,maintainedHeldFrame:693,
  sourceFrameIntrospectionOnly:true,genericFrameCompletionAvailable:false,
  originalRuntimeParityEstablished:false},'source structural 694 versus maintained 693');
 demand(run.sourceActions?.freshScripts?.length===59&&
  run.sourceActions.earlyStartBasename==='L7GS03'&&
  run.sourceActions.lateStartBasename==='L2GS03'&&
  run.sourceActions.popupCloseReceiverResolved===false,'source actions and unresolved parent close');
 sortedPins(run.sourceActions.freshScripts,'59 freshly extracted source AS scripts',
  {allowEmpty:true});
 same(run.audio?.source,P053_AUDIO.mp3,'complete source MP3');
 same(run.audio.rawIndex,P053_AUDIO.rawIndex,'raw stream index');
 demand(run.audio.blockCount===619&&run.audio.firstBlockFrame===4&&
  run.audio.lastBlockFrame===694&&run.audio.decodedSamples===1135296&&
  run.audio.acceptedCueCount===0&&run.audio.sourceAlignmentAccepted===false&&
  run.audio.listeningAccepted===false&&run.audio.independentUserTriggeredFullMp3===true&&
  run.audio.localeAutoPlayback===false&&run.audio.spanishAudioActivated===false,
  'independent full-buffer audio, no implicit locale playback');
 demand(run.shapes?.exported===68&&run.shapes.consumed===48&&
  run.shapes.rawExports?.length===68,'source art exports');
 uniquePhysicalPins(run.shapes.rawExports,'source art');
 demand(run.sourceKeyAttributeCalls===0,'no source glossary calls');
 same(run.glossary,[],'no new glossary');
 sortedPins(run.inputs,'run inputs');
 sortedPins(run.outputs,'run outputs');
 sortedPins(run.sharedDependencies,'run shared dependencies');
 same(run.sharedDependencies.map(item=>item.path),P053_SHARED_DEPENDENCY_PATHS,
  'seven common host dependencies');
 absolutePins(run.externalEvidence,'run physical external evidence',{allowEmpty:true});
 const external=new Map(run.externalEvidence.map(item=>[item.path,item]));
 for(const item of [physicalSource,physicalXml,P053_MOVIE_XML,P053_IDENTIFIED_HOST_BINDING,
  P053_AUDIO.mp3,P053_AUDIO.rawIndex])
  same(external.get(item.path),item,`external source/resource ${item.path}`);
 for(const item of run.shapes.rawExports)
  same(external.get(item.path),item,`raw shape export ${item.path}`);
 for(const item of Object.values(P053_SOURCE_AUDITS))
  same(run.inputs.find(pin=>pin.path===item.path),item,`exact source audit ${item.path}`);
 demand(run.inputs.every(item=>!P053_SHARED_DEPENDENCY_PATHS.includes(item.path))&&
  run.deferredHostPaths?.every(item=>!run.inputs.some(pin=>pin.path===item)),
  'DOM owns neither common host nor deferred host bindings');
 for(const item of P053_DEFERRED_HOST_REQUIRED)
  demand(run.deferredHostPaths.includes(item),`deferred host boundary ${item}`);
 demand(run.behavior?.hostPlaybackCompletion===false&&
  run.behavior.browserEvidence==='separate-formal-page-proof-not-in-this-dom-run',
  'DOM run does not substitute for host/browser admission');
 for(const [key,file] of [['controller','packages/demos/src/nms-l02-p053-controller-candidate.ts'],
  ['player','packages/demos/src/nms-l02-p053-player-state-v1.ts'],
  ['scene','packages/demos/src/nms-l02-p053-source-scene-v1.tsx'],
  ['runtimeAdapter','apps/web/components/nms-l02-p053-lesson-runtime-v1.tsx'],
  ['audioLoader','packages/demos/src/nms-l02-p053-source-audio-loader.ts'],
  ['hostNavigation','packages/demos/src/nms-l02-p053-host-navigation-v1.ts']])
  same(run.behavior[key],run.inputs.find(item=>item.path===file),
   `implemented behavior ${key} pinned in DOM inputs`);
 demand(run.completeTransitiveClosure===false&&run.productCalibrationPassed===false&&
  run.scaleOutAuthorized===false,'qualified source DOM run');
 same(run.acceptanceEffects,P053_ACCEPTANCE_EFFECTS,'run acceptance remains false');
 demand(member?.schemaVersion===1&&member.kind==='nms-l02-p053-maintained-dom-member-v1'&&
  member.animationId===P053_ADMISSION_ID&&
  member.rendererBindingKind==='maintained-dom-module-v1','P053 DOM member');
 same(member.source,P053_SOURCE,'member source');same(member.sourceXml,P053_XML,'member XML');
 same(member.inputs,run.inputs,'member full input closure');
 same(member.outputs,run.outputs,'member outputs');
 same(member.externalEvidence,run.externalEvidence,'member external evidence');
 same(member.sharedDependencies,run.sharedDependencies,'member host dependencies');
 demand(member.productCalibrationPassed===false&&member.scaleOutAuthorized===false,
  'member no factory calibration');
 same(member.acceptanceEffects,P053_ACCEPTANCE_EFFECTS,'member acceptance false');
 same(Object.keys(artifacts??{}).sort(),
  ['kind','memberManifest','module','sourceRun','timeline'],'canonical DOM artifact fields');
 demand(artifacts.kind==='maintained-dom-module-v1','DOM artifact not canvas');
 for(const [key,file] of [['sourceRun',P053_RUN_PATH],['memberManifest',P053_MEMBER_PATH],
  ['module',P053_MODULE_PATH],['timeline',P053_TIMELINE_PATH]])pin(artifacts[key],file);
 same(member.sourceRun,artifacts.sourceRun,'member references reviewed run pin');
 same(member.module,artifacts.module,'member module pin');
 same(member.timeline,artifacts.timeline,'member timeline pin');
 same(run.outputs,[artifacts.module,artifacts.timeline].sort((a,b)=>a.path.localeCompare(b.path)),
  'canonical DOM outputs');
 for(const item of [artifacts.module,artifacts.timeline])
  same(run.inputs.find(pin=>pin.path===item.path),item,'canonical output input membership');
 return true;
}

/** Packet-level source contract. The later proof validator supplies a reviewed
 * DOM seal; this function alone must not be used as admission authorization. */
export function validateP053AdmissionSemantics(packet,registration){
 demand(packet?.schemaVersion===1&&packet.calibrationId===P053_ADMISSION_CALIBRATION&&
  packet.sourceRoot===P053_SOURCE_ROOT&&packet.scope==='private-engineering'&&
  packet.deploymentScope==='local-only','local P053 identity');
 same(packet.source,P053_SOURCE,'packet SWF');same(packet.sourceXml,P053_XML,'packet XML');
 same(packet.selectedPages,[{animationId:P053_ADMISSION_ID,placementId:P053_ADMISSION_ID,
  assetId:`swf-${P053_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
  sourceSha256:P053_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
  globalPageOrdinal:53,sourceOccurrence:53,sectionCode:'GS',sectionPageOrdinal:1,
  complexityLane:'behavior-heavy',runtime:P053_RUNTIME}],
  'GS1 source placement and held-frame runtime');
 const entry=packet.entry,artifacts=entry?.artifacts;
 demand(entry?.key===P053_ADMISSION_ID&&entry.module===`./modules/${P053_ADMISSION_ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy',
  'one DOM entry');
 same(Object.keys(entry).sort(),['artifacts','complexityLane','key','maturity','module'],
  'bounded entry fields');
 same(Object.keys(artifacts??{}).sort(),['kind','memberManifest','module','sourceRun','timeline'],
  'bounded DOM artifact fields');
 demand(artifacts.kind==='maintained-dom-module-v1','maintained DOM branch');
 for(const [key,file] of [['sourceRun',P053_RUN_PATH],['memberManifest',P053_MEMBER_PATH],
  ['module',P053_MODULE_PATH],['timeline',P053_TIMELINE_PATH]])pin(artifacts[key],file);
 same(packet.sourceAudits,P053_SOURCE_AUDITS,'hash-bound source audit references');
 same(packet.audio,{source:P053_AUDIO.mp3,rawIndex:P053_AUDIO.rawIndex,blockCount:619,
  firstBlockFrame:4,lastBlockFrame:694,decodedSamples:1135296,
  independentUserTriggeredFullMp3:true,localeAutoPlayback:false,spanishAudioActivated:false,
  sourceAlignmentAccepted:false,listeningAccepted:false,originalRuntimeAccepted:false},
  'independent source MP3 with unresolved playback sync');
 same(packet.behavior,{earlyStartBasename:'L7GS03',earlyStartResolution:'current-page-reload',
  lateStartBasename:'L2GS03',lateStartResolution:'P054-level-scoped-handoff',
  popupSpriteId:104,popupTextIds:[13,16,102,103],popupCloseReceiverResolved:false,
  sourceFrameCount:694,maintainedHeldFrame:693,hostPlaybackCompletion:false,
  originalHostNavigationObserved:false,originalRuntimeParityEstablished:false},
  'source directions, conditional navigation and unresolved terminal');
 same(packet.glossary,[],'no new glossary');
 demand(packet.sourceKeyAttributeCalls===0,'no source KeyAttribute');
 same(packet.acceptanceEffects,P053_ACCEPTANCE_EFFECTS,'all acceptance gates false');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false,
  'no factory calibration or scale-out');
 pin(packet.freezeManifest,P053_FREEZE_PATH);
 same(registration,{calibrationId:P053_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:P053_FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[entry]},
  'single local-only registration fragment');
 demand(packet.integrity?.scope==='single-NMS-L02-P053-source-and-implementation'&&
  packet.integrity.completeTransitiveClosure===false&&
  typeof packet.integrity.qualification==='string'&&
  ['popup-close','original-host','audio-sync','completion'].every(word=>
   packet.integrity.qualification.includes(word))&&
  Array.isArray(packet.integrity.files)&&Array.isArray(packet.integrity.sharedDependencies),
  'qualified finite page closure, no parity promotion');
 return true;
}

const externalRecord=value=>value.path.startsWith(`${P053_SOURCE_ROOT}/`)
 ? {root:P053_SOURCE_ROOT,pin:{...value,path:path.relative(P053_SOURCE_ROOT,value.path)}}
 : {root:path.dirname(value.path),pin:{...value,path:path.basename(value.path)}};

/** The reviewed seals must come from a separately reviewed source, never from
 * proof.packet itself. A final reader can bind these as literal constants
 * after DOM run/member seal and browser/producer closure review. */
export function validateP053ProofClosure(proof,reviewed){
 demand(reviewed?.runManifest&&reviewed?.memberManifest&&reviewed?.artifacts&&
  reviewed?.pageFiles&&reviewed?.externalEvidence,
  'reviewed DOM manifest and complete own/external pins required');
 demand(proof?.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract==='nms-l02-source-bound-host-v1'&&
  proof.animationId===P053_ADMISSION_ID,'single P053 page proof identity');
 pin(proof.freeze,P053_FREEZE_PATH);
 validateP053AdmissionSemantics({...proof.packet,freezeManifest:proof.freeze},proof.registration);
 validateP053DomManifests(reviewed.runManifest,reviewed.memberManifest,reviewed.artifacts);
 same(proof.packet.entry.artifacts,reviewed.artifacts,'exact reviewed DOM artifact seal');
 sortedPins(reviewed.pageFiles,'reviewed page files');
 const own=proof.packet.integrity.files;
 sortedPins(own,'page-owned closure');
 same(own,reviewed.pageFiles,'complete independently reviewed page pins');
 const byPath=new Map(own.map(item=>[item.path,item]));
 for(const required of P053_REQUIRED_PAGE_PATHS)
  demand(byPath.has(required),`required source/product input ${required}`);
 for(const item of reviewed.runManifest.inputs)
  same(byPath.get(item.path),item,`all DOM input pins retained ${item.path}`);
 for(const item of Object.values(P053_SOURCE_AUDITS))
  same(byPath.get(item.path),item,`source audit pin ${item.path}`);
 for(const item of Object.values(reviewed.artifacts))if(item?.path)
  same(byPath.get(item.path),item,`DOM artifact ${item.path}`);
 same(proof.packet.integrity.sharedDependencies,reviewed.runManifest.sharedDependencies,
  'shared host pins from reviewed run');
 for(const dep of reviewed.runManifest.sharedDependencies)
  demand(!byPath.has(dep.path),'page/host ownership separated');
 demand(!byPath.has(P053_FREEZE_PATH)&&!byPath.has(P053_FRAGMENT_PATH),
  'freeze and fragment live only in proof files');
 const expectedFiles=sorted([...own.map(item=>item.path),P053_FREEZE_PATH,P053_FRAGMENT_PATH]);
 same(proof.files?.map(item=>item.path),expectedFiles,'proof file membership');
 for(const item of proof.files)pin(item,item.path);
 const files=new Map(proof.files.map(item=>[item.path,item]));
 for(const item of own)same(files.get(item.path),item,`proof retains ${item.path}`);
 same(files.get(P053_FREEZE_PATH),proof.freeze,'freeze pin');
 absolutePins(reviewed.externalEvidence,'reviewed physical source evidence',{allowEmpty:true});
 same(reviewed.externalEvidence,reviewed.runManifest.externalEvidence,
  'exact run external source set');
 same(proof.external,reviewed.externalEvidence.map(externalRecord),
  'all external files retained with common reader roots');
 return true;
}
