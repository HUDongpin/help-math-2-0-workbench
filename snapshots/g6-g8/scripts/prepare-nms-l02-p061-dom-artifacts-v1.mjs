#!/usr/bin/env node
/** P061 maintained-DOM source run/member producer. Planning has no registration effect. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p061',CALIBRATION='g678-nms-l02-p061-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`,MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`,TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS08.swf',bytes:585741,
 sha256:'4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const SA={path:'G6-G8-shared/NMS002/L2/SA/L2TS08.mp3',bytes:286944,
 sha256:'ef94daa8ed092d3c6a567bff5b3231102bb97691cbf06d0709fe5e32eccfc0f8'};
const SOURCE_AUDIT={path:'output/nms-l02-p061-source-20260927/source-audit.json',bytes:197114,
 sha256:'1fa1927e77f31138e9608d4acaab2dc66fba170022326211e5f4c159c95ae859'};
const RAW={path:'output/nms-l02-p061-source-20260927/audio-raw-index.json',bytes:774813,
 sha256:'dfe8c3c4b110f3d069fc3629b566df411ed261253f70340ae37d5d03a6ee5db2'};
const BEHAVIOR={path:'output/nms-l02-p061-behavior-20260927/source-behavior-v1.json',bytes:59718,
 sha256:'e3e52d68dbb2c901cf056a95cb073a031181c20dba7b3a7f90002652f998441e'};
const HOST={path:'output/nms-l02-p060-host-contract-20260927/host-contract-audit.json',bytes:9573,
 sha256:'dac05d6a35be8087a2162b5e94c812fd4c172f4f60d24d8d40e4b2c2be12ea32'};
const AUDIO_RECEIPT={path:'output/nms-l02-p061-audio-20260927/receipt.json',bytes:12265,
 sha256:'38625f49203fdf7d555a9798740a1ec4effb03d3f42139be9372de8d7fa2589e'};
const DISPLAY_RECEIPT={path:'output/nms-l02-p061-display-20260927/receipt.json',bytes:1229,
 sha256:'f3672350605daff441ec783c72e13e919cda1f3b3d43aa941dc2afd5ca04935d'};
const GLOSSARY={path:'output/nms-l02-p061-glossary-20260927/conditional-bank.json',bytes:19023,
 sha256:'caa939d4159a86c0452cca9f08900260b811a8ed691cc0a3e76e6e07b9ddcaba'};
const GLOSSARY_RECEIPT={path:'output/nms-l02-p061-glossary-20260927/receipt.json',bytes:1672,
 sha256:'6e806d0ab1070d4d745a886cb52a20fa76d723ebaf21c312c81cc1fd43a4d61f'};
const DISPLAY={path:'packages/demos/src/generated/nms-l02-p061-display-list-v1.ts',bytes:117096,
 sha256:'722c477ee5d55541f0edf60875324dde721fffff08c70d4b46d6067774ee67ff'};
const AUDIO={path:'packages/demos/src/generated/nms-l02-p061-audio-v1.ts',bytes:11058,
 sha256:'2ba5c50d268d0889b1e77a205d9e4679a8637897f87d0dc29db5c042000de80e'};
const TERMS={path:'packages/demos/src/generated/nms-l02-p061-terms-v1.ts',bytes:14048,
 sha256:'3151623a0e76ef184bc4008a4641ab957f95967c72623264310be5a9e3ad6f3c'};
const AUDIO_ROOT='output/nms-l02-p061-source-20260927/extraction/audio';
const DOMAINS=[87,134,146,174,188,205,226,252,284,298,315].map(id=>`sprite-${id}`);
const APPLICABLE_FEEDBACK=['sprite-134','sprite-146','sprite-174',
 'sprite-284','sprite-226','sprite-205','sprite-252'];
const MAIN_STOPS=[435,573,700,817,860,879];
const PRODUCT_TESTS=[
 'packages/demos/tests/nms-l02-p061-state-v1.test.ts',
 'packages/demos/tests/nms-l02-p061-session-v1.test.ts',
 'packages/demos/tests/nms-l02-p061-audio-v1.test.ts',
 'packages/demos/tests/nms-l02-p061-product-renderer-v1.test.tsx',
 'packages/demos/tests/nms-l02-p061-product-module-v1.test.tsx',
];
const INPUT_PATHS=[
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p061-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p061-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p061-state-v1.ts',
 'packages/demos/src/nms-l02-p061-session-v1.ts',
 'packages/demos/src/nms-l02-p061-audio-v1.ts',
 DISPLAY.path,AUDIO.path,TERMS.path,...PRODUCT_TESTS,
 'scripts/prepare-nms-l02-p061-source.mjs','scripts/prepare-nms-l02-p061-source.test.mjs',
 'scripts/build-g4-l3-embedded-audio-archive.mjs',
 'scripts/prepare-nms-l02-p061-audio-v1.mjs','scripts/prepare-nms-l02-p061-audio-v1.test.mjs',
 'scripts/prepare-nms-l02-p061-display-list-v1.mjs',
 'scripts/prepare-nms-l02-p061-display-list-v1.test.mjs',
 'scripts/prepare-nms-l02-p061-glossary-v1.mjs',
 'scripts/prepare-nms-l02-p061-glossary-v1.test.mjs',
 'scripts/prepare-nms-l02-p061-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p061-dom-artifacts-v1.test.mjs',
 SOURCE_AUDIT.path,RAW.path,'output/nms-l02-p061-source-20260927/README.md',
 BEHAVIOR.path,'output/nms-l02-p061-behavior-20260927/README.md',
 HOST.path,'output/nms-l02-p060-host-contract-20260927/README.md',
 AUDIO_RECEIPT.path,'output/nms-l02-p061-audio-20260927/README.md',
 DISPLAY_RECEIPT.path,GLOSSARY.path,GLOSSARY_RECEIPT.path,
 ...DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`),
];
const GENERATED=[MODULE,TIMELINE,DISPLAY.path,AUDIO.path,TERMS.path,SOURCE_AUDIT.path,RAW.path,
 AUDIO_RECEIPT.path,DISPLAY_RECEIPT.path,GLOSSARY.path,GLOSSARY_RECEIPT.path,
 ...DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`)];
const SHARED_DEPENDENCIES=[
 'packages/demos/src/contract.ts',
 'packages/demos/src/alg-l12-glossary-pair-audio-loader.ts',
 'packages/demos/src/source-glossary-controls.tsx',
 'packages/demos/src/source-glossary-session.ts',
 'lib/g678-admission-proof.mjs',
 'scripts/private-current-js-registry.mjs',
];
const GENERATOR_CHECKS=[
 ['scripts/prepare-nms-l02-p061-source.mjs',SOURCE_AUDIT.path],
 ['scripts/prepare-nms-l02-p061-audio-v1.mjs',AUDIO.path],
 ['scripts/prepare-nms-l02-p061-display-list-v1.mjs',DISPLAY.path],
 ['scripts/prepare-nms-l02-p061-glossary-v1.mjs',TERMS.path],
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const same=(a,b,label)=>assert.deepStrictEqual(a,b,label);
const exact=(root,pin)=>{same(pinFile(root,pin.path),pin,`exact ${pin.path}`);return readPin(root,pin);};

function readAbsolutePin(pin){
 assert(path.isAbsolute(pin.path)&&Number.isSafeInteger(pin.bytes)&&pin.bytes>=0&&
  pin.bytes<=64*1024*1024&&/^[a-f0-9]{64}$/u.test(pin.sha256),'bounded absolute pin');
 assert.equal(fs.realpathSync(pin.path),pin.path,`physical evidence ${pin.path}`);
 const before=fs.lstatSync(pin.path,{bigint:true});
 assert(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&before.size===BigInt(pin.bytes),
  `ordinary evidence ${pin.path}`);
 const bytes=fs.readFileSync(pin.path),after=fs.lstatSync(pin.path,{bigint:true});
 assert(['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'].every(key=>before[key]===after[key]),
  `stable evidence ${pin.path}`);
 assert.equal(sha256(bytes),pin.sha256,`evidence hash ${pin.path}`);
 return bytes;
}
function physicalSource(){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real G6-G8 source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory()&&!fs.lstatSync(SOURCE_ROOT).isSymbolicLink(),
  'ordinary physical source root');
 same(pinFile(SOURCE_ROOT,SOURCE.path),SOURCE,'P061 SWF');
 same(pinFile(SOURCE_ROOT,XML.path),XML,'lesson XML');
 same(pinFile(SOURCE_ROOT,SA.path),SA,'separate SA index source');
}
function sourceEvidence(root){
 physicalSource();
 const audit=JSON.parse(exact(root,SOURCE_AUDIT)),raw=JSON.parse(exact(root,RAW));
 const behavior=JSON.parse(exact(root,BEHAVIOR));
 const glossary=JSON.parse(exact(root,GLOSSARY));
 const audioReceipt=JSON.parse(exact(root,AUDIO_RECEIPT));
 const host=JSON.parse(exact(root,HOST));
 for(const pin of [DISPLAY,AUDIO,TERMS,DISPLAY_RECEIPT,GLOSSARY_RECEIPT])exact(root,pin);
 assert.equal(audit.kind,'nms-l02-p061-source-static-audit-v1');
 assert.equal(audit.animationId,ID);assert.equal(audit.sourceRoot,SOURCE_ROOT);
 same(audit.source,SOURCE,'audited SWF');same(audit.sourceXml,XML,'audited lesson XML');
 assert.equal(audit.placement.globalPageOrdinal,61);
 assert.equal(audit.placement.sectionPageOrdinal,7);
 assert.equal(audit.placement.reference,'TS/L2TS08.swf');
 assert.equal(audit.sourceStructure.rootFrames,10);
 assert.equal(audit.sourceStructure.teachingSpriteId,315);
 assert.equal(audit.sourceStructure.sprites['315'].frames,882);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.frame,6);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.attributes.depth,'3');
 same(audit.sourceStructure.rootTeachingPlacement.transform,{transX:'8247',transY:'5658'},
  'source root transform');
 same(audit.sourceStructure.teachingActionFrames,[435,573,700,817,860,861,879],
  'frame 861 reset is an action but not an authored stop');
 assert.equal(audit.sourceStructure.sprites['315'].directTagCounts.SoundStreamBlock,867);
 assert.equal(audit.extraction.files.length,141,'finite P061 extraction inventory');
 for(const pin of audit.extraction.files){
  assert(pin.path.startsWith('output/nms-l02-p061-source-20260927/extraction/'),
   'bounded P061 source extraction');readPin(root,pin);
 }
 same(audit.audio.rawIndex,RAW,'audited raw index');
 assert.equal(audit.audio.emptyBlockSilenceInserted,false);
 assert.equal(audit.audio.seekTrimApplied,false);
 assert.equal(audit.audio.originalRuntimeSynchronizationEstablished,false);
 assert.equal(audit.audio.listeningAccepted,false);
 assert.equal(audit.audio.separateLessonSa.sourceBinding,'lesson-index-only-not-spliced');
 assert(Object.values(audit.acceptanceEffects).every(value=>value===false));

 assert.equal(raw.kind,'nms-l02-p061-embedded-stream-raw-index-v1');
 assert.equal(raw.animationId,ID);same(raw.source,SOURCE,'raw audio source');
 assert.equal(raw.emptyBlockSilenceInserted,false);assert.equal(raw.seekTrimApplied,false);
 assert.equal(raw.originalRuntimeSynchronizationEstablished,false);
 assert.equal(raw.audioListeningAccepted,false);
 same(raw.streams.map(item=>item.ownerDomainId),DOMAINS,'all eleven audio domains');
 assert.equal(raw.streams.reduce((sum,item)=>sum+item.blockCount,0),1189);
 const audioPins=raw.streams.map(stream=>{
  const relative=`${AUDIO_ROOT}/${stream.ownerDomainId}.mp3`,pin=pinFile(root,relative);
  same(stream.payload,pin,`MP3 ${stream.ownerDomainId}`);
  const audited=audit.audio.streams.find(row=>row.ownerDomainId===stream.ownerDomainId);
  assert(audited);same(audited.payload,pin,'source audit audio payload');
  assert.equal(audited.decode.decodedSamples,stream.declaredSamples);
  return pin;
 });
 const main=raw.streams.find(row=>row.ownerDomainId==='sprite-315');
 assert.equal(main.blockCount,867);assert.equal(main.declaredSamples,1590336);
 same(main.blockFrameRange,{first:9,last:875,inclusive:true},'main source audio frames');
 same(main.negativeSeekBlocks,[{frame:875,seekSamples:-2178}],
  'retained signed final seek, not an accepted crop');
 same(main.emptyPayloadFrames,[10,875],'empty source blocks are not invented silence');
 assert.equal(main.payload.sha256,'62b1b094839a9716a7f68a266ea6725ae7c508123659840943be8db0ad9e467d');

 assert.equal(behavior.kind,'nms-l02-p061-static-source-behavior-audit-v1');
 assert.equal(behavior.animationId,ID);assert.equal(behavior.status,'source-audit-only');
 assert.equal(behavior.sourceDomain.mainSpriteId,315);
 assert.equal(behavior.sourceDomain.mainFrames,882);
 assert.equal(behavior.verifiedActionScripts.length,66);
 for(const script of behavior.verifiedActionScripts){
  assert(script.path.startsWith('output/nms-l02-p061-source-20260927/extraction/ffdec/scripts/')&&
   !script.path.includes('..'),'bounded verified ActionScript');
  const pin={path:script.path,bytes:script.bytes,sha256:script.sha256};
  const text=readPin(root,pin).toString().replaceAll('\r\n','\n');
  assert.equal(text,script.textUtf8,`ActionScript content ${script.path}`);
  assert(audit.extraction.files.some(item=>item.path===pin.path&&item.sha256===pin.sha256),
   'behavior script in finite source extraction');
 }
 same(behavior.mainStopTransitions.map(row=>row.frame),MAIN_STOPS,'authored stops');
 assert.equal(behavior.feedbackDomains.length,10);
 assert.equal(behavior.glossaryActions.length,6);
 assert.equal(behavior.historicalAssociation.identifiedHostL1Bank,'conditional only');
 assert.equal(behavior.historicalAssociation.originalRuntimeParityEstablished,false);
 assert(Object.values(behavior.acceptanceEffects).every(value=>value===false));
 same(behavior.source.swf,{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)},'behavior physical SWF');
 same(behavior.source.lessonIndex,{...XML,path:path.join(SOURCE_ROOT,XML.path)},
  'behavior physical lesson XML');
 same(behavior.source.sourceAudit,{...SOURCE_AUDIT,path:path.join(root,SOURCE_AUDIT.path)},
  'behavior source audit');
 same(behavior.source.rawAudioIndex,{...RAW,path:path.join(root,RAW.path)},
  'behavior raw index');
 same(behavior.source.conditionalIdentifiedHostAudit,HOST,
  'behavior P060 identified-host contract');

 assert.equal(host.kind,'nms-l02-p060-identified-host-static-contract-v1');
 assert.equal(host.host.bindingToP060Established,false);
 assert.equal(host.host.logicalPath,'NewHelpProgram/HELP_COURSES/indexMI.swf');
 assert.equal(host.glossaryIfIdentifiedHostServedP060.hostAppendedSuffix,'~English');
 assert.equal(host.glossaryIfIdentifiedHostServedP060.usesScreenkeyTermAttribute,false);
 assert.equal(glossary.kind,'nms-l02-p061-conditional-identified-host-l1-glossary-v1');
 assert.equal(glossary.animationId,ID);same(glossary.source,SOURCE,'glossary SWF');
 same(glossary.identifiedHostContractFromP060,HOST,'glossary host contract');
 assert.equal(glossary.sourceSelection,'identified-indexMI-parsed-English-label-case-insensitive');
 assert.equal(glossary.originalL2XmlResolved,false);
 assert.equal(glossary.historicalHostAssociationEstablished,false);
 assert.equal(glossary.originalRuntimeLookupVerified,false);
 assert.equal(glossary.terms.length,6);assert.equal(glossary.actions.length,6);
 assert.equal(glossary.occurrences.length,7);

 same(audioReceipt.source,SOURCE,'audio receipt SWF');
 same(audioReceipt.sourceXml,XML,'audio receipt lesson XML');
 same(audioReceipt.sourceAudit,SOURCE_AUDIT,'audio receipt audit');
 same(audioReceipt.sourceBehavior,BEHAVIOR,'audio receipt behavior');
 same(audioReceipt.rawIndex,RAW,'audio receipt raw index');
 same(audioReceipt.generated,AUDIO,'generated audio binding');
 same(audioReceipt.sourceMainStops,MAIN_STOPS,'audio authored stop windows');
 same(audioReceipt.sourceLeadFrames,[1,8],'source visual lead');
 assert.equal(audioReceipt.sourceFinalPayloadFrame,875);
 same(audioReceipt.sourceTailFrames,[876,879],'source visual tail');
 assert.equal(audioReceipt.policy.fullDecodedBufferCandidate,true);
 for(const field of ['emptyBlockSilenceInserted','seekTrimApplied',
  'originalRuntimeSynchronizationEstablished','listeningAccepted'])
  assert.equal(audioReceipt.policy[field],false,`audio policy ${field}`);
 assert.equal(audioReceipt.streams.length,11);
 for(const [index,stream] of audioReceipt.streams.entries()){
  same(stream.payload,audioPins[index],`audio receipt payload ${stream.ownerDomainId}`);
  assert.equal(stream.decodedSamples,raw.streams[index].declaredSamples);
 }
 same(audioReceipt.separateLessonSa.pin,SA,'separate SA evidence');
 assert.equal(audioReceipt.separateLessonSa.role,'index-only-not-spliced');

 const externalEvidence=uniquePins([behavior.source.swf,behavior.source.lessonIndex,
  host.host.physicalCasObject,...Object.values(host.host.exportedScriptPins),
  ...host.glossaryIfIdentifiedHostServedP060.l1BankEvidence.map(row=>row.pin)]);
 for(const pin of externalEvidence)readAbsolutePin(pin);
 return{audit,raw,behavior,glossary,audioReceipt,audioPins,externalEvidence};
}
function runGeneratorChecks(root){
 return GENERATOR_CHECKS.map(([producer,output])=>{
  const run=spawnSync(process.execPath,[path.join(root,producer),'--check'],{
   cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT},encoding:'utf8',
   timeout:240000,maxBuffer:1024*1024});
  assert.equal(run.status,0,`${producer} --check: ${String(run.stderr??run.error??'').slice(0,1500)}`);
  return{producer:pinFile(root,producer),output:pinFile(root,output),mode:'--check',exitCode:0};
 });
}
function runValidationChecks(root){
 const run=spawnSync(process.execPath,['--import','tsx','--test',...PRODUCT_TESTS],{
  cwd:root,env:process.env,encoding:'utf8',timeout:240000,maxBuffer:1024*1024});
 assert.equal(run.status,0,`P061 state/audio/native-product tests: ${String(run.stderr??run.error??'').slice(0,1500)}`);
 return[{tests:PRODUCT_TESTS.map(relative=>pinFile(root,relative)),
  mode:'node --import tsx --test',exitCode:0}];
}
function projectRegistry(root,artifacts){
 const registry=JSON.parse(readPin(root,pinFile(root,'packages/demos/private-current-js-registry.json')));
 const existing=registry.calibrations.flatMap(row=>row.entries.filter(entry=>entry.key===ID)
  .map(entry=>({calibrationId:row.calibrationId,entry})));
 if(existing.length){
  assert.equal(existing.length,1);assert.equal(existing[0].calibrationId,CALIBRATION);
  same(existing[0].entry.artifacts,artifacts,'existing P061 DOM registration exact');
  return true;
 }
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),
  entries:[{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
   complexityLane:'behavior-heavy',artifacts}]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM registry shape');
 return true;
}

export function buildP061DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
  'local engineering only');
 const source=sourceEvidence(root);
 const inputs=uniquePins([...INPUT_PATHS.map(relative=>pinFile(root,relative)),
  ...source.audit.extraction.files]);
 const sharedDependencies=uniquePins(SHARED_DEPENDENCIES.map(relative=>pinFile(root,relative)));
 assert(sharedDependencies.every(pin=>!inputs.some(item=>item.path===pin.path)),
  'page inputs and six shared dependencies disjoint');
 const outputs=uniquePins(GENERATED.map(relative=>{
  const current=inputs.find(pin=>pin.path===relative);
  assert(current,`generated output in finite input closure ${relative}`);return current;
 }));
 const generatorChecks=runGeneratorChecks(root),validationChecks=runValidationChecks(root);
 for(const check of generatorChecks){
  same(inputs.find(pin=>pin.path===check.producer.path),check.producer,'producer in own closure');
  same(outputs.find(pin=>pin.path===check.output.path),check.output,'output in own closure');
 }
 const acceptanceEffects={originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
  ownerAccepted:false,strictComplete:false,published:false};
 const runManifest={schemaVersion:1,kind:'nms-l02-p061-maintained-dom-source-run-v1',animationId:ID,
  method:'source-locked-public-tool-IR-and-maintained-DOM-state-machine',
  complexityLane:'behavior-heavy',sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   rootSpritePlacement:{characterId:315,depth:3,transXTwips:8247,transYTwips:5658},
   frameDomain:'sprite-315',frameCount:882,authoredStopFrames:MAIN_STOPS,
   sourceIntrospectionFrameRange:[1,882],productVisualFrameRange:[1,879],
   productPlaybackMode:'once',productPlaybackEndFrame:879,
   originalRuntimeParityEstablished:false},
  sourceAudit:SOURCE_AUDIT,
  sourceBehavior:{audit:BEHAVIOR,identifiedHostContract:HOST,
   externalEvidence:source.externalEvidence,
   hostSelection:'conditional-indexMI-random3-wrong-random4-right',
   historicalHostAssociationEstablished:false,originalRuntimeParityEstablished:false},
  sourceAudio:{rawIndex:RAW,implementationReceipt:AUDIO_RECEIPT,
   payloads:source.audioPins,domainCount:11,applicableFeedback:APPLICABLE_FEEDBACK,
   mainBlockCount:867,mainFirstBlockFrame:9,mainLastBlockFrame:875,
   mainDecodedSamples:1590336,wholeBufferWindows:MAIN_STOPS.length,
   sourceLeadFrames:[1,8],sourceTailFrames:[876,879],
   signedFinalSeekSamples:-2178,fullDecodedBufferCandidate:true,
   emptyBlockSilenceInserted:false,seekTrimApplied:false,separateLessonSaSpliced:false,
   originalRuntimeAlignmentEstablished:false,listeningAccepted:false},
  glossary:{candidate:GLOSSARY,receipt:GLOSSARY_RECEIPT,
   uniqueTermCount:6,buttonOccurrenceCount:7,
   sourceSelection:'identified-indexMI-parsed-English-label-case-insensitive',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false},
  generatorChecks,validationChecks,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const runBytes=json(runManifest),runPin=bytePin(RUN,runBytes);
 const module=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p061-maintained-dom-member-v1',animationId:ID,
  rendererBindingKind:'maintained-dom-module-v1',source:SOURCE,sourceXml:XML,
  sourceRun:runPin,module,timeline,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=bytePin(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin};
 assert(projectRegistry(root,artifacts),'structural registry projection');
 return{root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted:true,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP061DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  same(pinFile(plan.root,item.path),bytePin(item.path,item.bytes),'written DOM artifact');
 }
 return{status:'P061_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP061DomArtifacts(plan){
 for(const item of plan.outputs)same(readPin(plan.root,bytePin(item.path,item.bytes)),item.bytes,
  `${item.path} manifest drift`);
 return{status:'P061_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--plan','--prepare','--check'].includes(process.argv[2]),
   'use --plan, --prepare or --check');
  const plan=buildP061DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP061DomArtifacts(plan):
   process.argv[2]==='--check'?checkP061DomArtifacts(plan):
   {status:'P061_DOM_ARTIFACTS_PLAN_UNREGISTERED',artifacts:plan.artifacts,
    inputCount:plan.runManifest.inputs.length,outputCount:plan.runManifest.outputs.length,
    sharedDependencyCount:plan.runManifest.sharedDependencies.length,
    registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
