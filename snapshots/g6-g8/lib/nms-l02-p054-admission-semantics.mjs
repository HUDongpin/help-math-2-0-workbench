/** P054 local Current-JS admission semantics. This module deliberately has no
 * filesystem reads: the producer and common proof reader must hash every pin.
 * A packet can describe a future DOM seal, but this module does not attest that
 * the run/member/module/timeline bytes exist or have been reviewed. */
import assert from 'node:assert/strict';

export const P054_ADMISSION_ID='shared-nms002-l02-p054';
export const P054_ADMISSION_CALIBRATION='g678-nms-l02-p054-source-matching-current-js-v1';
export const P054_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P054_SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L2/GS/L2GS03.swf',
 bytes:2077270,sha256:'06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8'});
export const P054_XML=Object.freeze({path:'G6-G8-shared/NMS002/L2/index.xml',
 bytes:12845,sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'});
export const P054_MOVIE_XML=Object.freeze({path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-source-audit-gkoof5/movie.xml',
 bytes:49837761,sha256:'2fd8146fe801e80f13c497b4bcefcf4aa050fc6d75decb448424767c56034e46'});
export const P054_RUN_PATH=`work/g678-shared-page-factory/${P054_ADMISSION_CALIBRATION}/run-manifest.json`;
export const P054_MEMBER_PATH=`work/g678-shared-page-factory/${P054_ADMISSION_CALIBRATION}/members/${P054_ADMISSION_ID}/member-manifest.json`;
export const P054_MODULE_PATH=`packages/demos/src/modules/${P054_ADMISSION_ID}.tsx`;
export const P054_TIMELINE_PATH=`packages/demos/src/timelines/${P054_ADMISSION_ID}.ts`;
export const P054_FREEZE_PATH=`catalog/product-bridge-calibrations/${P054_ADMISSION_CALIBRATION}.json`;
export const P054_FRAGMENT_PATH=P054_FREEZE_PATH.replace(/\.json$/u,'.fragment.json');
export const P054_PROOF_PATH=`work/g678-workflow/candidates/${P054_ADMISSION_ID}-v1.json`;
export const P054_ACCEPTANCE_KEYS=Object.freeze(['authoritativeOriginalRuntime','fidelityAccepted',
 'audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','published']);
export const P054_ACCEPTANCE_EFFECTS=Object.freeze(Object.fromEntries(P054_ACCEPTANCE_KEYS.map(key=>[key,false])));
export const P054_RUNTIME=Object.freeze({stage:{width:800,height:600},rootFrameCount:10,
 rootBeginFrame:6,frameDomain:'sprite-731',frameCount:5,fps:12,language:'fixed-en',
 scenario:'source-matching-level-1',seed:'0',rendererBinding:'maintained-dom-matching-state-v1',
 levelCount:2,cardsPerLevel:12,pairsPerLevel:6,sourceTimelineSeekAvailable:false,
 hostPlaybackCompletion:false,terminalOutcome:'terminal-unresolved',
 originalRuntimeParityEstablished:false});
export const P054_REVIEWED_SOURCE_PINS=Object.freeze({
 gameContract:{path:'catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json',bytes:12324,sha256:'6d492f48cc2df39ca1636d5f9cde8f7529493eb3770c1d47c690a3c84b8aa205'},
 interaction:{path:'migrations/shared-nms002-l02-p054/audit/interaction-contract-v1.json',bytes:10154,sha256:'7472962f3e1ca32219dafd000a3f9bbcc6b90865cb0ca7d7f3b79d5265cc03b4'},
 layout:{path:'migrations/shared-nms002-l02-p054/audit/card-layout-v1.json',bytes:9042,sha256:'d34c6f2b89a99f110138c07b9b108ab96afa56db294a085a68a670d2cb034863'},
 cardDisplay:{path:'migrations/shared-nms002-l02-p054/audit/card-display-list-v1.json',bytes:93561,sha256:'c2e18b123f43e16890548f4be5d38613b022c55c6e2b090cf663dd6d07c62343'},
 gameDisplay:{path:'migrations/shared-nms002-l02-p054/audit/game-display-list-v1.json',bytes:32997,sha256:'8887c62a93824e851b2b6bba3779742ba43143b5c8e38b47c49b81c04fa6c40c'},
 art:{path:'migrations/shared-nms002-l02-p054/audit/art-export-v1.json',bytes:87084,sha256:'b715b175badc1edfcdf5df81ef7c388ea7e0b2eaac99656c28c74d1762e91974'},
 audioStructure:{path:'migrations/shared-nms002-l02-p054/audit/audio-structure-v1.json',bytes:3622,sha256:'0e1b96f79f08d636bdf1aeb5650901b2e43ac091f72c3c36e594b3e3354a3871'},
 hostBinding:{path:'migrations/shared-nms002-l02-p054/audit/indexmi-host-binding-v1.json',bytes:4543,sha256:'83e502b8d081398d0f49673d4207b614183df90af2446d40b92bb79d85f00b5b'},
 disposition:{path:'output/nms-l02-p054-product-20260928/PRODUCT_BEHAVIOR_DISPOSITION_V1.md',bytes:3170,sha256:'6292691e7431ade09c63368e331a04d8c8add38fb6338f24c39e034270963990'},
});
export const P054_ART_ROOT='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-art-assets-oM5UHV';
export const P054_AUDIO_ROOT='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-audio-streams-v1';
export const P054_AUDIO_MANIFEST=Object.freeze({path:`${P054_AUDIO_ROOT}/stream-manifest-v1.json`,
 sha256:'fd31b5e1208eaf54ef3c14fd28d55d61b2fdb3fc47d7b1f41a097d7e40d2dca0'});
export const P054_FEEDBACK=Object.freeze([
 {kind:'correct',spriteId:194,startFrame:2,firstAudioBlockFrame:2,terminalFrame:27,
  audio:{path:`${P054_AUDIO_ROOT}/sprite-194-source-stream-v1.mp3`,bytes:10660,
   sha256:'d34cad2db2f6a6be02a1efffd46ffc169a1b65730cf6f503cbae28fa7aab9fc4'}},
 {kind:'wrong',spriteId:208,startFrame:2,firstAudioBlockFrame:3,terminalFrame:31,
  audio:{path:`${P054_AUDIO_ROOT}/sprite-208-source-stream-v1.mp3`,bytes:11960,
   sha256:'2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77'}},
]);

const same=(actual,expected,label)=>assert.deepStrictEqual(actual,expected,`NMS_L02_P054_ADMISSION: ${label}`);
const demand=(condition,label)=>assert(condition,`NMS_L02_P054_ADMISSION: ${label}`);
const isHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/u.test(value);
const validPin=(value,path)=>demand(value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===path&&
 Number.isSafeInteger(value.bytes)&&value.bytes>0&&value.bytes<=128*1024*1024&&
 isHash(value.sha256),`exact bounded pin ${path}`);

/** Semantic cross-check of already extracted source facts. The caller must
 * read and SHA-check each reviewed audit and external resource independently. */
export function validateP054SourceInventory({gameContract,interaction,layout,cardDisplay,
 gameDisplay,art,audioStructure,audioManifest,hostBinding}){
 demand(gameContract?.schemaVersion===1&&interaction?.schemaVersion===1&&
  layout?.schemaVersion===1&&cardDisplay?.schemaVersion===1&&gameDisplay?.schemaVersion===1&&
  art?.schemaVersion===1&&audioStructure?.schemaVersion===1&&audioManifest?.schemaVersion===1&&
  hostBinding?.schemaVersion===1,
  'source inventory schema');
 for(const item of [interaction,layout,cardDisplay,gameDisplay,art,audioStructure,
  audioManifest,hostBinding])
  same(item.animationId,P054_ADMISSION_ID,'source audit identity');
 same(gameContract.sourceRoot,P054_SOURCE_ROOT,'real AWS source root');
 same(gameContract.source.p054,{bytes:P054_SOURCE.bytes,sha256:P054_SOURCE.sha256,
  xmlSha256:P054_MOVIE_XML.sha256},'source and retained movie XML');
 same(gameContract.controller,{earlyTarget:'L7GS03',selectLevelTarget:'L2GS03',
  selectLevelFrame:693,earlierTargetReachability:'unresolved'},'two distinct entry targets');
 const matching=gameContract.matching;
 demand(matching.sourceSpriteId===731&&matching.levels===2&&matching.pairsPerLevel===6&&
  matching.cardCount===24,'two levels, twelve cards each');
 same(matching.actions,{cardHandlers:{frame2:12,frame4:12},scoreCorrect:10,scoreWrong:-2,
  correctFeedbackFrame:27,wrongFeedbackFrame:31,pairsForTerminal:6},'exact matching scoring/actions');
 demand(interaction.gameSpriteId===731&&interaction.cardHandlerCount===24&&
  interaction.cards.length===24,'24 extracted card handlers');
 same(interaction.levelInitialization.map(row=>row.sourceFrame),[2,4],
  'level entry frames');
 demand(interaction.sourceRules.scoreFloor.includes('no clamp'),
  'source score has no floor');
 same(interaction.feedback.correct.sourceSpriteId,194,'correct child sprite');
 same(interaction.feedback.correct.terminalFrame,27,'correct child terminal');
 same(interaction.feedback.wrong.sourceSpriteId,208,'wrong child sprite');
 same(interaction.feedback.wrong.terminalFrame,31,'wrong child terminal');
 demand(interaction.feedback.correct.afterSix.includes('nextFrame in feedback sprite'),
  'child nextFrame does not establish parent completion');
 same(layout.rootGameSprite,{sourceCharacterId:731,rootDepth:3,
  translationTwips:{x:8268,y:5686},translationPx:{x:413.4,y:284.3}},
  'root placement');
 same(gameDisplay.rootPlacement,{sourceFrame:6,sourceDepth:3,sourceCharacterId:731,
  translationTwips:{x:8268,y:5686}},'root frame six');
 demand(gameDisplay.controllerSpriteId===731&&gameDisplay.controllerFrameCount===5&&
  gameDisplay.frames.length===5,'five child frames');
 demand(layout.cards.length===24&&cardDisplay.cards.length===24&&
  cardDisplay.cardCount===24&&cardDisplay.cardFrameCount===5&&
  matching.cards.length===24,'all 24 source cards in each audit');
 const sourceCards=matching.cards.map(({level,placementOrder,sourceInstanceName,
  sourceCharacterId})=>({level,placementOrder,sourceInstanceName,sourceCharacterId}))
  .sort((a,b)=>a.level-b.level||a.placementOrder-b.placementOrder);
 same(layout.cards.map(({level,placementOrder,sourceInstanceName,sourceCharacterId})=>
  ({level,placementOrder,sourceInstanceName,sourceCharacterId}))
  .sort((a,b)=>a.level-b.level||a.placementOrder-b.placementOrder),sourceCards,
  'layout source card identity/order');
 const sourceCardById=new Map(sourceCards.map(card=>[`${card.level}:${card.sourceCharacterId}`,card]));
 demand(sourceCardById.size===24,'distinct level/card source identities');
 const displayedIds=new Set();
 for(const card of cardDisplay.cards){
  const key=`${card.level}:${card.sourceCharacterId}`;
  demand(!displayedIds.has(key),`unique card display ${key}`);
  displayedIds.add(key);
  const sourceCard=sourceCardById.get(key);
  demand(sourceCard?.sourceInstanceName===card.sourceInstanceName&&card.frames.length===5,
   `five source frames for card ${card.level}:${card.sourceCharacterId}`);
 }
 same(displayedIds.size,24,'all 24 distinct displayed cards');
 for(const level of [1,2]){
  const cards=matching.cards.filter(card=>card.level===level);
  demand(cards.length===12&&new Set(cards.map(card=>card.pairId)).size===6&&
   cards.every(card=>card.side===1||card.side===2),`level ${level} six pairs`);
  for(const pairId of [1,2,3,4,5,6])
   same(cards.filter(card=>card.pairId===pairId).map(card=>card.side).sort(),[1,2],
    `level ${level} pair ${pairId}`);
 }
 same(art.source,{path:`${P054_SOURCE_ROOT}/${P054_SOURCE.path}`,bytes:P054_SOURCE.bytes,
  sha256:P054_SOURCE.sha256},'art source identity');
 demand(art.sourceArtPreserved===true&&art.visualFidelityAccepted===false&&
  art.export.root===P054_ART_ROOT&&art.export.count===536&&
  art.export.items.length===536,'source art remains unaccepted');
 const artByPath=new Map(art.export.items.map(item=>[item.file,item]));
 demand(artByPath.size===536,'unique art export paths');
 for(const level of [1,2])for(let order=1;order<=12;order++){
  const shape=(level===1?108:668)+order*2;
  const item=artByPath.get(`shapes/${shape}.svg`);
  demand(item?.bytes>0&&isHash(item.sha256),`reveal ${level}/${order} shape ${shape}`);
 }
 same(audioStructure.source,art.source,'embedded audio SWF');
 same(audioManifest.sourceSwf,art.source,'decoded audio SWF');
 same(audioManifest.sourceXml,{path:P054_MOVIE_XML.path,sha256:P054_MOVIE_XML.sha256},
  'retained XML audio parse');
 for(const binding of P054_FEEDBACK){
  const stream=audioManifest.streams.find(row=>row.sourceCharacterId===binding.spriteId);
  const structure=audioStructure.embeddedStreams.find(row=>row.sourceCharacterId===binding.spriteId);
  demand(stream&&structure&&stream.frameCount===binding.terminalFrame&&
   stream.firstBlockFrame===binding.firstAudioBlockFrame&&
   stream.lastBlockFrame===binding.terminalFrame&&
   structure.firstBlockFrame===binding.firstAudioBlockFrame&&
   structure.lastBlockFrame===binding.terminalFrame&&
   structure.originalRuntimeAudible===false,
   `${binding.kind} frame/block boundary, no listening claim`);
  same(stream.encoded,binding.audio,`${binding.kind} decoded-resource pin`);
 }
 demand(audioStructure.audioAccepted===false&&audioManifest.audioAccepted===false,
  'audio remains unaccepted');
 demand(hostBinding.disposition==='exact-host-source-identified-runtime-path-unverified'&&
  hostBinding.hostSource.bytes===689006&&
  hostBinding.hostSource.sha256==='275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9'&&
  hostBinding.pageSource.sha256===P054_SOURCE.sha256&&
  hostBinding.pageSource.rootFrameCount===10&&
  hostBinding.pageSource.heldEntryFrame===6&&
  hostBinding.originalRuntimeAccepted===false,
  'identified host source does not establish original runtime binding');
 return true;
}

/** Derive the exact external page resource set from reviewed source manifests.
 * The producer must readPin each returned path before writing a page proof. */
export function p054ExpectedResourcePins(art,audioManifest){
 demand(art?.source?.sha256===P054_SOURCE.sha256&&
  art.export?.root===P054_ART_ROOT&&
  audioManifest?.sourceSwf?.sha256===P054_SOURCE.sha256,
  'resource manifests bind the source SWF');
 const byPath=new Map((art.export.items??[]).map(item=>[item.file,item]));
 demand(byPath.size===536,'536 unique art exports');
 const pins=[];
 for(const level of [1,2])for(let order=1;order<=12;order++){
  const shape=(level===1?108:668)+order*2;
  const item=byPath.get(`shapes/${shape}.svg`);
  demand(item&&Number.isSafeInteger(item.bytes)&&item.bytes>0&&isHash(item.sha256),
   `shape ${shape} from source art manifest`);
  pins.push({path:`${P054_ART_ROOT}/${item.file}`,bytes:item.bytes,sha256:item.sha256});
 }
 for(const binding of P054_FEEDBACK){
  const stream=audioManifest.streams?.find(item=>item.sourceCharacterId===binding.spriteId);
  same(stream?.encoded,binding.audio,`${binding.kind} feedback MP3`);
  pins.push(binding.audio);
 }
 return pins.sort((a,b)=>a.path.localeCompare(b.path));
}

export function validateP054ResourcePins({art,audioManifest,resourcePins}){
 demand(Array.isArray(resourcePins),'external resource pin list');
 for(const item of resourcePins)validPin(item,item.path);
 same(resourcePins,p054ExpectedResourcePins(art,audioManifest),
  '24 exact reveal SVG and two feedback MP3 source/resource pins');
 return true;
}

/** Structural packet contract. Artifact hashes and page closure still require
 * the later producer/common proof reader; this is not a proof-closure API. */
export function validateP054AdmissionSemantics(packet,registration){
 demand(packet?.schemaVersion===1&&packet.calibrationId===P054_ADMISSION_CALIBRATION&&
  packet.sourceRoot===P054_SOURCE_ROOT&&packet.scope==='private-engineering'&&
  packet.deploymentScope==='local-only','one local P054 calibration');
 same(packet.source,P054_SOURCE,'source SWF');
 same(packet.sourceXml,P054_XML,'lesson XML');
 same(packet.selectedPages,[{animationId:P054_ADMISSION_ID,placementId:P054_ADMISSION_ID,
  assetId:`swf-${P054_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
  sourceSha256:P054_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
  globalPageOrdinal:54,sourceOccurrence:54,sectionCode:'GS',sectionPageOrdinal:2,
  complexityLane:'behavior-heavy',runtime:P054_RUNTIME}],
  'GS2 source placement and unresolved five-frame child');
 const entry=packet.entry,artifacts=entry?.artifacts;
 demand(entry?.key===P054_ADMISSION_ID&&entry.module===`./modules/${P054_ADMISSION_ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy',
  'one maintained matching module');
 same(Object.keys(artifacts??{}).sort(),['kind','memberManifest','module','sourceRun','timeline'],
  'DOM artifact fields');
 demand(artifacts.kind==='maintained-dom-module-v1','real DOM artifact branch');
 for(const [key,path] of [['module',P054_MODULE_PATH],['timeline',P054_TIMELINE_PATH],
  ['sourceRun',P054_RUN_PATH],['memberManifest',P054_MEMBER_PATH]])validPin(artifacts[key],path);
 same(packet.sourceAudits,P054_REVIEWED_SOURCE_PINS,'reviewed source audit pins');
 const resources=packet.resources;
 same(Object.keys(resources??{}).sort(),['artRoot','audioManifest','audioRoot',
  'externalPins','feedback','lessonSaActivated','resultMusicActivated','revealCount'].sort(),
  'bounded resource fields');
 same({...resources,externalPins:undefined},{artRoot:P054_ART_ROOT,audioRoot:P054_AUDIO_ROOT,
  audioManifest:P054_AUDIO_MANIFEST,feedback:P054_FEEDBACK,
  revealCount:24,resultMusicActivated:false,lessonSaActivated:false,externalPins:undefined},
  'source feedback only, no result or separate SA substitution');
 demand(Array.isArray(resources.externalPins)&&resources.externalPins.length===26,
  '24 reveal SVG plus two feedback MP3 external pins');
 const expectedPaths=[...P054_FEEDBACK.map(item=>item.audio.path)];
 for(const level of [1,2])for(let order=1;order<=12;order++)
  expectedPaths.push(`${P054_ART_ROOT}/shapes/${(level===1?108:668)+order*2}.svg`);
 same(resources.externalPins.map(item=>item.path),expectedPaths.sort((a,b)=>a.localeCompare(b)),
  'sorted exact external resource paths');
 for(const item of resources.externalPins)validPin(item,item.path);
 same(packet.behavior,{levels:2,cardsPerLevel:12,pairsPerLevel:6,
  scoreCorrect:10,scoreWrong:-2,scoreFloor:'none-in-source-card-handlers',
  level1Entry:'default',level2Entry:'explicit-local-choice',
  earlierP053EntryReachabilityEstablished:false,
  correctFeedback:{spriteId:194,startFrame:2,terminalFrame:27},
  wrongFeedback:{spriteId:208,startFrame:2,terminalFrame:31},
  feedbackTiming:'source-script-based-maintained-clock-not-original-schedule',
  terminalOutcome:'terminal-unresolved',parentResultTransitionEstablished:false,
  hostPlaybackCompletion:false,sourceTimelineSeekAvailable:false,
  originalRuntimeParityEstablished:false,sourceRepeatIsReplay:false,
  feedbackAutoPlayOnMount:false,spanishAudioSubstitution:false},
  'matching behavior and unresolved terminal');
 same(packet.glossary,[],'no new glossary terms');
 demand(packet.sourceKeyAttributeCalls===0,'no source glossary call');
 same(packet.acceptanceEffects,P054_ACCEPTANCE_EFFECTS,'independent acceptance gates false');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false,
  'no calibration or scale-out');
 validPin(packet.freezeManifest,P054_FREEZE_PATH);
 same(registration,{calibrationId:P054_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:P054_FREEZE_PATH,freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,entries:[entry]},
  'single local-only registration fragment');
 demand(packet.integrity?.scope==='single-NMS-L02-P054-source-and-implementation'&&
  packet.integrity.completeTransitiveClosure===false&&
  typeof packet.integrity.qualification==='string'&&
  packet.integrity.qualification.includes('terminal-unresolved')&&
  packet.integrity.qualification.includes('L7GS03')&&
  Array.isArray(packet.integrity.files)&&Array.isArray(packet.integrity.sharedDependencies),
  'explicit qualified finite closure proposal');
 return true;
}
