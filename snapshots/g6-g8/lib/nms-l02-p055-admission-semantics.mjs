/** Pure P055 source semantics. The admission reader separately verifies physical
 * bytes, producer closure, registry dispatch and host version. */
import assert from 'node:assert/strict';

export const P055_ADMISSION_ID='shared-nms002-l02-p055';
export const P055_ADMISSION_CALIBRATION='g678-nms-l02-p055-conditional-host-current-js-v1';
export const P055_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const pin=(path,bytes,sha256)=>Object.freeze({path,bytes,sha256});
export const P055_SOURCE=pin('G6-G8-shared/NMS002/L2/TS/L2TS02.swf',149059,
 '8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e');
export const P055_XML=pin('G6-G8-shared/NMS002/L2/index.xml',12845,
 '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61');
export const P055_RUNTIME=pin('output/nms-l02-ts-family-20260927/visual/canvas-renderer.js',930320,
 '47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d');
export const P055_TEXT_IR=pin('output/nms-l02-ts-family-20260927/visual/source-text-ir.json',106339,
 '72f14b7e998611357389f40cc1e6083ec7ea60c55d00067b3709afed6844a49a');
export const P055_MAIN_AUDIO=pin('output/nms-l02-ts-family-20260927/audio/p055-main-sprite-26.mp3',143780,
 'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b');
export const P055_AUDIO_INDEX=pin('output/nms-l02-ts-family-20260927/audio/p055-main-audio-index.json',169440,
 'c40709ff27506afed5bd084167a8b95b761fd7d8eff186ffd87fc3dfd1fb8d9c');
export const P055_GLOSSARY_CANDIDATE=pin('output/nms-l02-host-successor-20260927/glossary/p055-conditional-l1-host-bank.json',10418,
 'cfc1e81cf4da194d2d110ccd7ca879ce43950361883319a2e6bcebd135f1543f');
export const P055_GLOSSARY_PRODUCT=pin('packages/demos/src/generated/nms-l02-p055-terms-v1.ts',4326,
 'a040b5821f4eab812c04bcf47b399235350171c4d83be36bfb1b53e5fdeeb1aa');
const GLOSSARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const HOST_EXPORT_ROOT='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p009-host-source-v1/scripts/scripts';
const HOST_CAS_ROOT='/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1/objects/sha256';

// This is a finite, reviewed P055-only closure. Generic lesson host/session,
// controller/contract, asset server/route, proof reader and registry dispatch
// are host-owned and intentionally absent here.
export const P055_PAGE_INPUT_PATHS=Object.freeze([
 'packages/demos/src/modules/shared-nms002-l02-p055.tsx',
 'packages/demos/src/timelines/shared-nms002-l02-p055.ts',
 'packages/demos/src/nms-l02-p055-module.tsx',
 'packages/demos/src/nms-l02-p055-native-renderer.tsx',
 'packages/demos/src/nms-l02-p055-native-assets.ts',
 'packages/demos/src/nms-l02-p055-native-text.ts',
 'packages/demos/src/nms-l02-ts-pilot-text.ts',
 'packages/demos/src/generated/nms-l02-p055-native-text.json',
 'packages/demos/src/generated/nms-l02-p055-terms-v1.ts',
 'apps/web/components/nms-l02-p055-lesson-runtime.tsx',
 'apps/web/components/nms-l02-ts-pilot.tsx',
 'apps/web/components/nms-l02-ts-pilot.css',
 'apps/web/lib/nms-l02-p055-descriptor-extension.ts',
 'apps/web/tests/nms-l02-p055-descriptor-extension.test.ts',
 'apps/web/tests/nms-l02-p055-runtime-config.test.ts',
 'apps/web/tests/nms-l02-ts-pilot-text.test.ts',
 'lib/nms-l02-p055-admission-semantics.mjs',
 'lib/nms-l02-p055-admission-semantics.test.mjs',
 'scripts/prepare-nms-l02-p055-admission.mjs',
 'scripts/prepare-nms-l02-p055-admission.test.mjs',
 'scripts/prepare-nms-l02-p055-product-inputs.mjs',
 'scripts/prepare-nms-l02-p055-product-inputs.test.mjs',
 'scripts/prepare-nms-l02-ts-native-visual.mjs',
 'scripts/extract-nms-l02-ts-main-audio.mjs',
 'scripts/extract-nms-l02-ts-main-audio.test.mjs',
 'scripts/prepare-nms-l02-ts-glossary.mjs',
 'scripts/prepare-nms-l02-ts-glossary.test.mjs',
 'scripts/generate-nms-l02-p055-terms-v1.mjs',
 'scripts/generate-nms-l02-p055-terms-v1.test.mjs',
 'scripts/build-safe-ffdec-canvas-adapter.mjs',
 'scripts/lib/swf-text-source-catalog.mjs',
 'scripts/build-g678-alg-l12-glossary-pair-native-text.mjs',
 'scripts/build-g4-l3-embedded-audio-archive.mjs',
 'scripts/build-g678-alg-l12-p012-audio-source.mjs',
 'scripts/audit-g678-ts02-l1-keyterms.mjs',
 'migrations/shared-nms002-l02-p055/audit/SOURCE_INTAKE_V1.md',
 'catalog/g678-ts02-family-audit-v1.json',
 'output/nms-l02-host-successor-20260927/product/source-admission-review.json',
 'output/nms-l02-host-successor-20260927/product/native-input-receipt.json',
 'output/nms-l02-ts-family-20260927/visual/adapter-spec.json',
 'output/nms-l02-ts-family-20260927/visual/source-native-visual-receipt.json',
 'output/nms-l02-ts-family-20260927/visual/runtime-meta.json',
 'output/nms-l02-ts-family-20260927/visual/text-catalog.json',
 'output/nms-l02-ts-family-20260927/visual/source-text-ir.json',
 'output/nms-l02-ts-family-20260927/visual/canvas-renderer.js',
 'output/nms-l02-ts-family-20260927/visual/raw/movie.xml',
 'output/nms-l02-ts-family-20260927/visual/raw/ffdec/frames/canvas.js',
 'output/nms-l02-ts-family-20260927/visual/raw/ffdec/frames/frames.html',
 'output/nms-l02-ts-family-20260927/visual/raw/ffdec/sprites/DefineSprite_26/frames.html',
 ...[4,5,6,7,8,9,11,13,17,18,20,23,24].map(id=>`output/nms-l02-ts-family-20260927/visual/raw/ffdec/texts/${id}.txt`),
 'output/nms-l02-ts-family-20260927/audio/README.md',
 'output/nms-l02-ts-family-20260927/audio/p055-main-audio-index.json',
 'output/nms-l02-ts-family-20260927/audio/p055-main-sprite-26.mp3',
 'output/nms-l02-ts-family-20260927/glossary-dependency/HOST_KEYTERM_BINDING_AUDIT_2026-09-27.md',
 'output/nms-l02-ts-family-20260927/glossary-dependency/HOST_XML_KEYTERM_PRECEDENCE_2026-09-27.md',
 'output/nms-l02-host-successor-20260927/glossary/README.md',
 'output/nms-l02-host-successor-20260927/glossary/p055-conditional-l1-host-bank.json',
 'output/nms-l02-host-successor-20260927/glossary/p055-product-terms-receipt.json',
]);

export const P055_EXTERNAL_EXPECTED=Object.freeze([
 {root:P055_SOURCE_ROOT,pin:P055_SOURCE},
 {root:P055_SOURCE_ROOT,pin:P055_XML},
 {root:P055_SOURCE_ROOT,pin:{path:'G6-G8-shared/NMS002/L2/SA/L2TS02.mp3',bytes:288288,
   sha256:'148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576'}},
 {root:GLOSSARY_ROOT,pin:{path:'L1KTE01.xml',bytes:345838,
   sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'}},
 {root:GLOSSARY_ROOT,pin:{path:'L1KTS01.xml',bytes:344456,
   sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'}},
 {root:HOST_CAS_ROOT,pin:{path:'27/275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9',bytes:689006,
   sha256:'275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9'}},
 {root:HOST_EXPORT_ROOT,pin:{path:'frame_2/DoAction.as',bytes:14489,
   sha256:'3e0dd52444cfa5daa05a771aa4c00172a498192e634c6bef5a8815a02f51ce8a'}},
 {root:HOST_EXPORT_ROOT,pin:{path:'frame_35/DoAction.as',bytes:104008,
   sha256:'380cd6581859d0ba9814833f1102b08282198713cf30b5230ce2da76c3e27a74'}},
 {root:HOST_EXPORT_ROOT,pin:{path:'frame_49/DoAction.as',bytes:1918,
   sha256:'713f73c05dba1a9cd080b2a58b9cbfff277f6b5d5aa38136947c5a9013702ba6'}},
 {root:HOST_EXPORT_ROOT,pin:{path:'frame_50/DoAction.as',bytes:1622,
   sha256:'d267b54cf74f3aae4167e8bcbc1f803df3228630869d089dee53abbd3b162483'}},
 {root:HOST_EXPORT_ROOT,pin:{path:'DefineSprite_1359/frame_1/DoAction.as',bytes:244,
   sha256:'e06625dce24fe8a8ad23df66060a52c600e989db31d4493d4480396428476485'}},
]);


export const P055_ACCEPTANCE_KEYS=Object.freeze([
 'authoritativeOriginalRuntime','fidelityAccepted','audioAccepted',
 'humanVisualAccepted','ownerAccepted','strictComplete','published',
]);
const controls=Object.freeze([
 {id:'sprite-26/depth-11/generation-1',entryId:'Restate',characterId:15,firstFrame:84,lastFrameExclusive:352,sourceKeyAttribute:'Restate'},
 {id:'sprite-26/depth-13/generation-1',entryId:'Question',characterId:16,firstFrame:84,lastFrameExclusive:352,sourceKeyAttribute:'Question'},
 {id:'sprite-26/depth-18/generation-1',entryId:'Problem',characterId:22,firstFrame:145,lastFrameExclusive:352,sourceKeyAttribute:'Problem'},
]);
const terms=Object.freeze([
 {id:'restate',sourceKeyAttribute:'Restate'},
 {id:'question',sourceKeyAttribute:'Question'},
 {id:'problem',sourceKeyAttribute:'Problem'},
]);
const fail=reason=>`NMS_L02_P055_ADMISSION: ${reason}`;
const demand=(value,reason)=>assert(value,fail(reason));
const same=(value,expected,reason)=>assert.deepStrictEqual(value,expected,fail(reason));
const SHA=/^[a-f0-9]{64}$/;
function validPin(value,expectedPath){
 demand(value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===expectedPath&&
  Number.isSafeInteger(value.bytes)&&value.bytes>0&&value.bytes<=64*1024*1024&&SHA.test(value.sha256),
  `bounded pin ${expectedPath}`);
}
function samePreparedRuntime(value){
 validPin(value,`work/g678-shared-page-factory/${P055_ADMISSION_CALIBRATION}/members/${P055_ADMISSION_ID}/canvas-renderer.js`);
 same([value.bytes,value.sha256],[P055_RUNTIME.bytes,P055_RUNTIME.sha256],'prepared native runtime byte identity');
}

/** Fragment and flattened live registration share the same page semantics. */
export function validateP055AdmissionSemantics(packet,registration){
 demand(packet?.schemaVersion===1&&packet.calibrationId===P055_ADMISSION_CALIBRATION&&
  packet.sourceRoot===P055_SOURCE_ROOT&&packet.scope==='private-engineering'&&
  packet.deploymentScope==='local-only','exact P055 local scope');
 same(packet.source,P055_SOURCE,'SWF source pin');
 same(packet.sourceXml,P055_XML,'lesson XML pin');
 demand(Array.isArray(packet.selectedPages)&&packet.selectedPages.length===1,'one selected page');
 const page=packet.selectedPages[0],runtime=page?.runtime;
 same([page.animationId,page.placementId,page.assetId,page.stableLessonKey,page.sourceSha256,
  page.moduleCode,page.lessonNumber,page.globalPageOrdinal,page.sourceOccurrence,
  page.sectionCode,page.sectionPageOrdinal,page.complexityLane],
 [P055_ADMISSION_ID,P055_ADMISSION_ID,`swf-${P055_SOURCE.sha256}`,'shared-nms002-l02',
  P055_SOURCE.sha256,'NMS002',2,55,55,'TS',1,'interactive-understood'],
 'exact NMS L02 TS1 placement and XML occurrence');
 same({stage:runtime?.stage,rootFrameCount:runtime?.rootFrameCount,rootBeginFrame:runtime?.rootBeginFrame,
  frameDomain:runtime?.frameDomain,frameCount:runtime?.frameCount,
  livePlaybackEndFrame:runtime?.livePlaybackEndFrame,fps:runtime?.fps,
  language:runtime?.language,scenario:runtime?.scenario,seed:runtime?.seed,
  renderScale:runtime?.renderScale,canvas:runtime?.canvas},
 {stage:{width:800,height:600},rootFrameCount:10,rootBeginFrame:6,
  frameDomain:'sprite-26',frameCount:351,livePlaybackEndFrame:351,fps:12,
  language:'fixed-en',scenario:'source-static-frame',seed:'0',renderScale:2,
  canvas:{width:1600,height:1200}},'fixed English main source frame domain');
 samePreparedRuntime(runtime?.canvasRenderer&&(({url,...pin})=>pin)(runtime.canvasRenderer));
 same(runtime.canvasRenderer.url,
  `/migration-assets/nms-l02-ts-pilot/typography.js?sha256=${P055_RUNTIME.sha256}`,
  'actual pilot runtime URL');
 const entry=packet.entry,artifacts=entry?.artifacts;
 demand(entry?.key===P055_ADMISSION_ID&&entry.module===`./modules/${P055_ADMISSION_ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='interactive-understood'&&
  artifacts&&Object.keys(artifacts).sort().join(',')==='module,runtime,timeline',
  'single canonical P055 module');
 validPin(artifacts.module,`packages/demos/src/modules/${P055_ADMISSION_ID}.tsx`);
 validPin(artifacts.timeline,`packages/demos/src/timelines/${P055_ADMISSION_ID}.ts`);
 samePreparedRuntime(artifacts.runtime);
 same(packet.visual?.runtime,artifacts.runtime,'visual prepared runtime');
 same(packet.visual?.nativeRuntime,P055_RUNTIME,'native source runtime');
 same(packet.visual?.textIr,P055_TEXT_IR,'native text IR');
 same(packet.visual?.unresolvedDynamicTextCharacterIds,[11],'unresolved dynamic source field retained');
 same(packet.visual?.originalRuntimeValidated,false,'no original runtime claim');
 same(packet.audio?.main,P055_MAIN_AUDIO,'embedded main stream');
 same(packet.audio?.structure,P055_AUDIO_INDEX,'embedded stream structure');
 same(packet.audio?.structureFacts,{firstFrame:5,lastFrame:351,blockCount:347,
  emptyFrames:[6],decodedSamples:637056,sampleRate:22050,channels:1,
  sourceAlignmentAccepted:false,listeningAccepted:false},
 'continuous source blocks and unaccepted alignment/listening');
 const glossary=packet.glossary;
 same(glossary?.candidate,P055_GLOSSARY_CANDIDATE,'conditional identified-host candidate');
 same(glossary?.candidateSha256,P055_GLOSSARY_CANDIDATE.sha256,'conditional candidate SHA');
 same(glossary?.product,P055_GLOSSARY_PRODUCT,'qualified product term data');
 same(glossary?.sourceSelection,'identified-indexMI-export-literal-L1-bank-path','conditional L1 selection');
 same([glossary?.originalL2XmlResolved,glossary?.historicalHostAssociationEstablished,
  glossary?.originalRuntimeLookupVerified],[false,false,false],
 'missing L2 banks and unverified original host association');
 same(glossary?.lessonXmlDeclaredBanks,{en:'HELP_KEYTERMS/KT/XML/L2KTE01.xml',
  es:'HELP_KEYTERMS/KT/XML/L2KTS01.xml'},'real lesson-declared L2 references');
 same(glossary?.controls,controls,'three source glossary controls and frames');
 same(glossary?.terms,terms,'three qualified term keys');
 same(glossary?.stopPath,'animation_mc.animation','source stop target');
 same(glossary?.closePolicy,'remain-paused','qualified close behavior');
 same(Object.keys(packet.acceptanceEffects??{}).sort(),[...P055_ACCEPTANCE_KEYS].sort(),
  'independent acceptance keys');
 demand(Object.values(packet.acceptanceEffects).every(value=>value===false)&&
  packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false,
  'no acceptance or family scale-out');
 validPin(packet.freezeManifest,
  `catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.json`);
 demand(registration?.calibrationId===P055_ADMISSION_CALIBRATION&&
  registration.deploymentScope==='local-only'&&
  registration.freezeManifestSha256===packet.freezeManifest?.sha256,
  'registration freeze binding');
 if(Array.isArray(registration.entries)){
  same(registration.entries,[entry],'one-entry registration fragment');
  same(registration.freezeManifest,
   `catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.json`,'fragment freeze path');
  same(registration.freezeManifestBytes,packet.freezeManifest?.bytes,'fragment freeze bytes');
 }else{
  demand(registration.maturity==='private-current-js'&&registration.scope==='private-engineering'&&
   registration.moduleSha256===artifacts.module.sha256&&
   registration.timelineSha256===artifacts.timeline.sha256&&
   registration.runtimeSha256===artifacts.runtime.sha256,
   'live registration identity');
 }
 return true;
}

/** The P055 proof has one finite, page-owned closure. The generic proof reader
 * verifies these pins against physical bytes after this exact membership check.
 * Host code and generated registry dispatch belong to separate authorities. */
export function validateP055ProofClosure(proof){
 demand(proof?.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract==='nms-l02-source-bound-host-v1'&&
  proof.animationId===P055_ADMISSION_ID,'exact P055 proof identity');
 const packet=proof.packet;
 demand(packet?.integrity?.scope==='single-NMS-L02-P055-source-and-implementation'&&
  packet.integrity.completeTransitiveClosure===false&&
  Array.isArray(packet.integrity.files),'finite page-owned integrity closure');
 const own=packet.integrity.files;
 const canonical=`work/g678-shared-page-factory/${P055_ADMISSION_CALIBRATION}/members/${P055_ADMISSION_ID}/canvas-renderer.js`;
 const ownPaths=[...P055_PAGE_INPUT_PATHS,canonical].sort((a,b)=>a.localeCompare(b));
 same(own.map(value=>value.path),ownPaths,'exact 70 page inputs and canonical runtime');
 for(const item of own)validPin(item,item.path);
 const byPath=new Map(own.map(item=>[item.path,item]));
 for(const required of [packet.entry?.artifacts?.module,packet.entry?.artifacts?.timeline,
  packet.entry?.artifacts?.runtime,packet.visual?.nativeRuntime,packet.visual?.textIr,
  packet.audio?.main,packet.audio?.structure,packet.glossary?.candidate,
  packet.glossary?.product]){
  demand(required&&byPath.has(required.path),'resource belongs to page-owned closure');
  same(byPath.get(required.path),required,`exact own resource ${required.path}`);
 }
 same(byPath.get(canonical),packet.selectedPages?.[0]?.runtime?.canvasRenderer&&
  (({url,...value})=>value)(packet.selectedPages[0].runtime.canvasRenderer),
  'served canonical runtime is the owned runtime');
 const freeze=`catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.json`;
 const fragment=`catalog/product-bridge-calibrations/${P055_ADMISSION_CALIBRATION}.fragment.json`;
 validPin(proof.freeze,freeze);
 const files=proof.files;
 demand(Array.isArray(files),'page proof files');
 same(files.map(value=>value.path),[...ownPaths,freeze,fragment].sort((a,b)=>a.localeCompare(b)),
  'exact proof files including freeze and registration fragment');
 for(const item of files)validPin(item,item.path);
 const fileByPath=new Map(files.map(item=>[item.path,item]));
 for(const item of own)same(fileByPath.get(item.path),item,`proof retains own input ${item.path}`);
 same(fileByPath.get(freeze),proof.freeze,'proof retains exact frozen packet');
 same(proof.external,[...P055_EXTERNAL_EXPECTED].sort((a,b)=>
  a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path)),
  'exact eleven physical source and identified-host pins');
 validateP055AdmissionSemantics({...packet,freezeManifest:proof.freeze},proof.registration);
 return true;
}
