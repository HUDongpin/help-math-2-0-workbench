#!/usr/bin/env node
/** Source-locked P060 maintained-DOM run/member producer. No host or registry mutation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p060',CALIBRATION='g678-nms-l02-p060-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`,MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`,TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS07.swf',bytes:577367,
 sha256:'80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const SOURCE_AUDIT='output/nms-l02-p060-source-20260927/source-audit.json';
const SOURCE_AUDIT_SHA='ab7eea1b04c185dd118240316a83361688dc301e73d0f973cbb3add76b79ef0d';
const RAW_AUDIO='output/nms-l02-p060-source-20260927/audio-raw-index.json';
const RAW_AUDIO_SHA='5883a745fb6c5f69fc5ad8cd12cf6d94d616c3c03d0c056528a70bebf38d88ca';
const TIMING='output/nms-l02-p060-audio-policy-20260927/timing-disposition.json';
const TIMING_SHA='ae5d4c9b0248c259f54d07f06f45db95646c53c5a823ee92c8ea613b4dacf173';
const BEHAVIOR='output/nms-l02-p060-behavior-20260927/source-behavior-v1.json';
const BEHAVIOR_SHA='dc98a7606e3269c26364d3652a664e9006a712bffab5ac23cd19306871ec257c';
const BEHAVIOR_README='output/nms-l02-p060-behavior-20260927/README.md';
const BEHAVIOR_README_SHA='aad983e68a9c62011e1a45d5dec38bd17a9ffcc96cae36cc7db6f65cefa541f7';
const HOST_AUDIT='output/nms-l02-p060-host-contract-20260927/host-contract-audit.json';
const HOST_AUDIT_SHA='dac05d6a35be8087a2162b5e94c812fd4c172f4f60d24d8d40e4b2c2be12ea32';
const HOST_README='output/nms-l02-p060-host-contract-20260927/README.md';
const HOST_README_SHA='d644c1c0bcf5b4ae74fa885e777b6659d1dc4c91a2948ec8492a11930a6f7d9b';
const GLOSSARY='output/nms-l02-p060-glossary-20260927/conditional-bank.json';
const GLOSSARY_SHA='99670fe1480e3557d10bb013ae14d50d44e5a5a8f482d2f051c0c9eba8a9afaf';
const GLOSSARY_RECEIPT='output/nms-l02-p060-glossary-20260927/receipt.json';
const GLOSSARY_RECEIPT_SHA='aaf38d8aac2b36edea2d2418b9c879b24788046c109c37ef4a2bd74833aeec69';
const DISPLAY='packages/demos/src/generated/nms-l02-p060-display-list-v1.ts';
const DISPLAY_SHA='b69d88bed8d0dbdf094877942f9f025c5cc723285f4e824bd331e2ac6a839477';
const TERMS='packages/demos/src/generated/nms-l02-p060-terms-v1.ts';
const TERMS_SHA='476bd5597e35e08b32a54cd89c4ea7753466ecb9f6580fea615b4de7d2a9d7bf';
const AUDIO_ROOT='output/nms-l02-p060-source-20260927/extraction/audio';
const AUDIO_DOMAINS=['sprite-104','sprite-205','sprite-217','sprite-245','sprite-258',
 'sprite-275','sprite-296','sprite-322','sprite-354','sprite-368','sprite-391'];
const FEEDBACK_ALLOWED=['sprite-205','sprite-217','sprite-245','sprite-354','sprite-296','sprite-275','sprite-322'];
const MAIN_STOPS=[262,400,527,646,699,718];
const PRODUCT_TESTS=[
 'packages/demos/tests/nms-l02-p060-state-v1.test.ts',
 'packages/demos/tests/nms-l02-p060-session-v1.test.ts',
 'packages/demos/tests/nms-l02-p060-audio-v1.test.ts',
 'packages/demos/tests/nms-l02-p060-product-renderer-v1.test.tsx',
 'packages/demos/tests/nms-l02-p060-product-module-v1.test.tsx',
];
const INPUT_PATHS=[
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p060-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p060-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p060-state-v1.ts',
 'packages/demos/src/nms-l02-p060-session-v1.ts',
 'packages/demos/src/nms-l02-p060-audio-v1.ts',
 DISPLAY,TERMS,...PRODUCT_TESTS,
 'scripts/prepare-nms-l02-p060-source.mjs',
 'scripts/prepare-nms-l02-p060-source.test.mjs',
 'scripts/build-nms-l02-p060-display-list-v1.mjs',
 'scripts/build-nms-l02-p060-display-list-v1.test.mjs',
 'scripts/prepare-nms-l02-p060-glossary.mjs',
 'scripts/prepare-nms-l02-p060-glossary.test.mjs',
 'scripts/prepare-nms-l02-p060-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p060-dom-artifacts-v1.test.mjs',
 SOURCE_AUDIT,'output/nms-l02-p060-source-20260927/README.md',RAW_AUDIO,
 TIMING,'output/nms-l02-p060-audio-policy-20260927/README.md',
 BEHAVIOR,BEHAVIOR_README,HOST_AUDIT,HOST_README,
 GLOSSARY,GLOSSARY_RECEIPT,
 'output/nms-l02-p060-visual-20260927/visual-plan-v1.json',
 'output/nms-l02-p060-visual-20260927/README.md',
 ...AUDIO_DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`),
];
const GENERATED=[MODULE,TIMELINE,DISPLAY,TERMS,SOURCE_AUDIT,RAW_AUDIO,TIMING,
 GLOSSARY,GLOSSARY_RECEIPT,...AUDIO_DOMAINS.map(domain=>`${AUDIO_ROOT}/${domain}.mp3`)];
// Host/common contracts remain independent from this page-owned run/member.
const SHARED_DEPENDENCIES=[
 'packages/demos/src/contract.ts',
 'packages/demos/src/alg-l12-glossary-pair-audio-loader.ts',
 'packages/demos/src/source-glossary-controls.tsx',
 'packages/demos/src/source-glossary-session.ts',
 'lib/g678-admission-proof.mjs',
 'scripts/private-current-js-registry.mjs',
];
const GENERATOR_CHECKS=[
 ['scripts/prepare-nms-l02-p060-source.mjs',SOURCE_AUDIT],
 ['scripts/build-nms-l02-p060-display-list-v1.mjs',DISPLAY],
 ['scripts/prepare-nms-l02-p060-glossary.mjs',TERMS],
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const same=(a,b,label)=>assert.deepStrictEqual(a,b,label);
const expectedPin=(root,relative,sha)=>{const pin=pinFile(root,relative);assert.equal(pin.sha256,sha,relative);return pin;};
function readAbsolutePin(pin){
 assert(path.isAbsolute(pin.path)&&Number.isSafeInteger(pin.bytes)&&pin.bytes>=0&&
  pin.bytes<=64*1024*1024&&/^[a-f0-9]{64}$/u.test(pin.sha256),'bounded absolute evidence pin');
 assert.equal(fs.realpathSync(pin.path),pin.path,`physical evidence: ${pin.path}`);
 const before=fs.lstatSync(pin.path,{bigint:true});
 assert(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&before.size===BigInt(pin.bytes),
  `ordinary evidence: ${pin.path}`);
 const bytes=fs.readFileSync(pin.path),after=fs.lstatSync(pin.path,{bigint:true});
 assert(['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'].every(key=>before[key]===after[key]),
  `stable evidence: ${pin.path}`);
 assert.equal(sha256(bytes),pin.sha256,`evidence hash: ${pin.path}`);
 return bytes;
}

function verifySource(root){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real G6-G8 source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory()&&!fs.lstatSync(SOURCE_ROOT).isSymbolicLink(),
  'ordinary physical source root');
 same(pinFile(SOURCE_ROOT,SOURCE.path),SOURCE,'exact P060 SWF');
 same(pinFile(SOURCE_ROOT,XML.path),XML,'exact lesson XML');
 const auditPin=expectedPin(root,SOURCE_AUDIT,SOURCE_AUDIT_SHA),audit=readJsonPin(root,auditPin);
 assert.equal(audit.kind,'nms-l02-p060-source-static-audit-v1');
 assert.equal(audit.animationId,ID);assert.equal(audit.sourceRoot,SOURCE_ROOT);
 same(audit.source,SOURCE,'audited SWF');same(audit.sourceXml,XML,'audited XML');
 assert.equal(audit.placement.globalPageOrdinal,60);
 assert.equal(audit.placement.sectionPageOrdinal,6);
 assert.equal(audit.placement.reference,'TS/L2TS07.swf');
 assert.equal(audit.sourceStructure.rootFrames,10);
 assert.equal(audit.sourceStructure.teachingSpriteId,391);
 assert.equal(audit.sourceStructure.sprites['391'].frames,721);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.frame,6);
 assert.equal(audit.sourceStructure.rootTeachingPlacement.attributes.objectID,'391');
 assert.equal(audit.sourceStructure.rootTeachingPlacement.attributes.depth,'3');
 same(audit.sourceStructure.rootTeachingPlacement.transform,{transX:'8247',transY:'5658'},
  'main root transform');
 same(audit.sourceStructure.teachingActionFrames,[262,400,527,646,699,700,718],
  'source actions include frame 700 removal, which is not a product stop');
 assert.equal(audit.sourceStructure.sprites['391'].directTagCounts.SoundStreamBlock,703);
 assert.equal(audit.extraction.files.length,181,'finite extracted source inventory');
 for(const pin of audit.extraction.files){
  assert(pin.path.startsWith('output/nms-l02-p060-source-20260927/extraction/'),
   'bounded P060 extraction');readPin(root,pin);
 }
 same(audit.audio.rawIndex,pinFile(root,RAW_AUDIO),'audited raw audio index');
 assert.equal(audit.audio.emptyBlockSilenceInserted,false);
 assert.equal(audit.audio.seekTrimApplied,false);
 assert.equal(audit.audio.originalRuntimeSynchronizationEstablished,false);
 assert.equal(audit.audio.listeningAccepted,false);
 assert.equal(audit.audio.separateLessonSa.sourceBinding,'lesson-index-only-not-spliced');
 assert(Object.values(audit.acceptanceEffects).every(value=>value===false));

 const rawPin=expectedPin(root,RAW_AUDIO,RAW_AUDIO_SHA),raw=readJsonPin(root,rawPin);
 assert.equal(raw.kind,'nms-l02-p060-embedded-stream-raw-index-v1');
 assert.equal(raw.animationId,ID);same(raw.source,SOURCE,'audio source');
 assert.equal(raw.emptyBlockSilenceInserted,false);assert.equal(raw.seekTrimApplied,false);
 assert.equal(raw.originalRuntimeSynchronizationEstablished,false);
 assert.equal(raw.audioListeningAccepted,false);
 assert.equal(raw.streams.length,11);
 same(raw.streams.map(item=>item.ownerDomainId),AUDIO_DOMAINS,'eleven source audio domains');
 assert.equal(raw.streams.reduce((count,item)=>count+item.blockCount,0),1025);
 const auditedStreams=audit.audio.streams;
 assert.equal(auditedStreams.length,11);
 const audioPins=raw.streams.map(stream=>{
  const relative=`${AUDIO_ROOT}/${stream.ownerDomainId}.mp3`;
  same(stream.payload,pinFile(root,relative),`MP3 ${stream.ownerDomainId}`);
  const audited=auditedStreams.find(row=>row.ownerDomainId===stream.ownerDomainId);
  assert(audited);same(audited.payload,stream.payload,'source audit audio identity');
  assert.equal(audited.decode.decodedSamples,stream.declaredSamples);
  return stream.payload;
 });
 const main=raw.streams.find(stream=>stream.ownerDomainId==='sprite-391');
 assert.equal(main.blockCount,703);assert.equal(main.declaredSamples,1289088);
 assert.equal(main.payload.bytes,290940);
 assert.equal(main.payload.sha256,'78a98c5d3158f1fd41c9fd874380fe2a4a239d786e231597886a94cd1d6b67d0');

 const timingPin=expectedPin(root,TIMING,TIMING_SHA),timing=readJsonPin(root,timingPin);
 assert.equal(timing.kind,'nms-l02-p060-audio-timing-disposition-v1');
 assert.equal(timing.status,'source-static-modern-full-buffer-candidate');
 same(timing.pins.realSourceSwf,{path:path.join(SOURCE_ROOT,SOURCE.path),bytes:SOURCE.bytes,sha256:SOURCE.sha256},
  'timing physical source');
 for(const [field,relative,pin] of [['rawIndex',RAW_AUDIO,rawPin],['sourceAudit',SOURCE_AUDIT,auditPin],
   ['controllerCandidate','packages/demos/src/nms-l02-p060-audio-v1.ts',
    pinFile(root,'packages/demos/src/nms-l02-p060-audio-v1.ts')]])
  same(timing.pins[field],{...pin,path:path.join(root,relative)},`timing ${field}`);
 assert(timing.sourceCaveat.swfmillWarnings.includes('WARNING:'));
 assert.equal(timing.main.spriteId,391);
 assert.equal(timing.main.decodedSamples,1289088);
 same(timing.main.sourceBlockFrameRange,[9,711],'main source audio window');
 same(timing.main.negativeSeekBlocks,[{frame:711,seekSamples:-2158}],'signed seek retained');
 same(timing.main.segments.map(row=>row.stopFrame),MAIN_STOPS,'six authored segments');
 assert.equal(timing.main.segments[0].startSample,0);
 assert.equal(timing.main.segments.at(-1).exclusiveStopSample,1289088);
 assert(timing.main.segments.every((row,index)=>index===0||
  row.startSample===timing.main.segments[index-1].exclusiveStopSample),
  'contiguous whole-buffer segments, no lost or duplicated samples');
 assert.equal(timing.feedback.length,10);
 assert.equal(timing.unresolved.length,3);

 const glossaryPin=expectedPin(root,GLOSSARY,GLOSSARY_SHA),glossary=readJsonPin(root,glossaryPin);
 assert.equal(glossary.kind,'nms-l02-p060-conditional-identified-host-l1-glossary-v1');
 assert.equal(glossary.animationId,ID);same(glossary.source,SOURCE,'glossary source');
 assert.equal(glossary.sourceSelection,'identified-indexMI-parsed-English-label-case-insensitive');
 assert.equal(glossary.originalL2XmlResolved,false);
 assert.equal(glossary.historicalHostAssociationEstablished,false);
 assert.equal(glossary.originalRuntimeLookupVerified,false);
 assert.equal(glossary.terms.length,8);assert.equal(glossary.actions.length,8);
 assert.equal(glossary.occurrences.length,16);
 const glossaryReceiptPin=expectedPin(root,GLOSSARY_RECEIPT,GLOSSARY_RECEIPT_SHA);
 const displayPin=expectedPin(root,DISPLAY,DISPLAY_SHA),termsPin=expectedPin(root,TERMS,TERMS_SHA);
 const behaviorPin=expectedPin(root,BEHAVIOR,BEHAVIOR_SHA);
 expectedPin(root,BEHAVIOR_README,BEHAVIOR_README_SHA);
 const behavior=readJsonPin(root,behaviorPin);
 assert.equal(behavior.kind,'nms-l02-p060-static-source-behavior-audit-v1');
 assert.equal(behavior.animationId,ID);assert.equal(behavior.status,'source-audit-only');
 same(behavior.source.swf,{...SOURCE,path:path.join(SOURCE_ROOT,SOURCE.path)},'behavior physical SWF');
 same(behavior.source.lessonIndex,{...XML,path:path.join(SOURCE_ROOT,XML.path)},'behavior physical XML');
 const behaviorExternal=Object.values(behavior.source);
 for(const pin of behaviorExternal)readAbsolutePin(pin);
 assert.equal(behavior.sourceCatalogRecord.mainSpriteId,391);
 assert.equal(behavior.sourceCatalogRecord.mainFrames,721);
 assert.equal(behavior.sourceCatalogRecord.rootFrames,10);
 assert.equal(behavior.verifiedActionScripts.length,67);
 for(const script of behavior.verifiedActionScripts){
  assert(!path.isAbsolute(script.path)&&!script.path.includes('..'),'bounded P060 ActionScript');
  const relative=`output/nms-l02-p060-source-20260927/extraction/ffdec/scripts/${script.path}`;
  same(pinFile(root,relative),{path:relative,bytes:script.bytes,sha256:script.sha256},
   `verified P060 ActionScript ${script.path}`);
  // The behavior audit records normalized text; the separate byte pin above
  // still guards the retained CRLF ActionScript exactly.
  assert.equal(readPin(root,{path:relative,bytes:script.bytes,sha256:script.sha256})
   .toString('utf8').replaceAll('\r\n','\n'),script.text);
  assert(audit.extraction.files.some(item=>item.path===relative&&item.sha256===script.sha256),
   'behavior script is in finite source extraction');
 }
 same(behavior.mainStopTransitions.map(item=>item.frame),MAIN_STOPS,'source-script authored stops');
 assert.equal(behavior.feedbackDomains.length,10);
 assert.equal(behavior.glossaryActions.length,8);
 assert.equal(behavior.historicalAssociation.identifiedHostL1Bank,'conditional only');
 assert.equal(behavior.historicalAssociation.originalRuntimeParityEstablished,false);
 assert(Object.values(behavior.acceptanceEffects).every(value=>value===false));
 const hostPin=expectedPin(root,HOST_AUDIT,HOST_AUDIT_SHA);
 expectedPin(root,HOST_README,HOST_README_SHA);
 const host=readJsonPin(root,hostPin);
 assert.equal(host.kind,'nms-l02-p060-identified-host-static-contract-v1');
 assert.equal(host.status,'source-only-conditional-host-contract');
 same(host.source.swf,behavior.source.swf,'host audit SWF');
 same(host.source.lessonXml,behavior.source.lessonIndex,'host audit XML');
 same(host.source.priorStaticAudit,{...auditPin,path:path.join(root,SOURCE_AUDIT)},'host source audit');
 for(const pin of Object.values(host.source))readAbsolutePin(pin);
 assert.equal(host.host.logicalPath,'NewHelpProgram/HELP_COURSES/indexMI.swf');
 assert.equal(host.host.physicalCasObject.sha256,
  '275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9');
 readAbsolutePin(host.host.physicalCasObject);
 assert.equal(host.host.bindingToP060Established,false);
 for(const pin of Object.values(host.host.exportedScriptPins))readAbsolutePin(pin);
 assert.equal(host.feedbackSelectionIfIdentifiedHostServedP060.wrongHostExpression,'random(3)+1');
 assert.equal(host.feedbackSelectionIfIdentifiedHostServedP060.rightHostExpression,'random(4)+1');
 assert.equal(host.frame699Feedback.length,9);
 same(host.frame699Feedback.filter(row=>row.selectedByIdentifiedHostExpression)
  .map(row=>`sprite-${row.spriteId}`).sort(),[...FEEDBACK_ALLOWED].sort(),
  'seven conditional identified-host feedback choices');
 assert.equal(host.glossaryIfIdentifiedHostServedP060.pageKey,'Decimal fraction');
 assert.equal(host.glossaryIfIdentifiedHostServedP060.hostAppendedSuffix,'~English');
 assert.equal(host.glossaryIfIdentifiedHostServedP060.usesScreenkeyTermAttribute,false);
 assert.equal(host.glossaryIfIdentifiedHostServedP060.l2BankBytesEstablished,false);
 assert.equal(host.glossaryIfIdentifiedHostServedP060.historicalLookupResultEstablished,false);
 for(const row of host.glossaryIfIdentifiedHostServedP060.l1BankEvidence)readAbsolutePin(row.pin);
 same(host.glossaryIfIdentifiedHostServedP060.l1BankEvidence.map(row=>row.pin.sha256),
  [behavior.source.englishConditionalBank.sha256,behavior.source.spanishConditionalBank.sha256],
  'conditional L1 bank evidence');
 for(const clip of timing.feedback){
  const domain=`sprite-${clip.spriteId}`,stream=raw.streams.find(row=>row.ownerDomainId===domain);
  assert(stream,`timing feedback source stream ${domain}`);
  same(clip.completeMp3,stream.payload,`timing ${domain} complete MP3`);
  assert(Array.isArray(clip.terminalActionScriptPins)&&clip.terminalActionScriptPins.length>=1,
   'terminal ActionScript evidence');
  for(const pin of clip.terminalActionScriptPins){
   assert(pin.path.startsWith(path.join(root,'output/nms-l02-p060-source-20260927/extraction/ffdec/scripts/')),
    'bounded terminal ActionScript');
   readAbsolutePin(pin);
   assert(audit.extraction.files.some(item=>path.join(root,item.path)===pin.path&&item.sha256===pin.sha256),
    'timing terminal script in finite source extraction');
  }
 }
 const externalEvidence=uniquePins([...behaviorExternal,...Object.values(host.source),
  host.host.physicalCasObject,...Object.values(host.host.exportedScriptPins),
  ...host.glossaryIfIdentifiedHostServedP060.l1BankEvidence.map(row=>row.pin)]);
 return{auditPin,audit,rawPin,raw,main,audioPins,timingPin,timing,
  glossaryPin,glossaryReceiptPin,displayPin,termsPin,behaviorPin,hostPin,externalEvidence};
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
 assert.equal(run.status,0,`P060 state/audio/native-product tests: ${String(run.stderr??run.error??'').slice(0,1500)}`);
 return[{tests:PRODUCT_TESTS.map(relative=>pinFile(root,relative)),mode:'node --import tsx --test',exitCode:0}];
}
function projectRegistry(root,artifacts){
 const registry=JSON.parse(readPin(root,pinFile(root,'packages/demos/private-current-js-registry.json')));
 const old=registry.calibrations.flatMap(row=>row.entries.filter(entry=>entry.key===ID)
  .map(entry=>({calibrationId:row.calibrationId,entry})));
 if(old.length){assert.equal(old.length,1);assert.equal(old[0].calibrationId,CALIBRATION);
  same(old[0].entry.artifacts,artifacts,'existing P060 DOM registration exact');return true;}
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),
  entries:[{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
   complexityLane:'behavior-heavy',artifacts}]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM registry shape');
 return true;
}

export function buildP060DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
  'local engineering only');
 const source=verifySource(root);
 const inputs=uniquePins([...INPUT_PATHS.map(relative=>pinFile(root,relative)),...source.audit.extraction.files]);
 const sharedDependencies=uniquePins(SHARED_DEPENDENCIES.map(relative=>pinFile(root,relative)));
 assert(sharedDependencies.every(pin=>!inputs.some(item=>item.path===pin.path)),
  'page-owned and shared inputs disjoint');
 const outputs=uniquePins(GENERATED.map(relative=>{
  const current=inputs.find(pin=>pin.path===relative);
  assert(current,`generated output in finite input closure: ${relative}`);return current;
 }));
 const generatorChecks=runGeneratorChecks(root),validationChecks=runValidationChecks(root);
 for(const check of generatorChecks){
  same(inputs.find(pin=>pin.path===check.producer.path),check.producer,'checked producer in own closure');
  same(outputs.find(pin=>pin.path===check.output.path),check.output,'checked output in own closure');
 }
 const acceptanceEffects={originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
  ownerAccepted:false,strictComplete:false,published:false};
 const runManifest={schemaVersion:1,kind:'nms-l02-p060-maintained-dom-source-run-v1',animationId:ID,
  method:'source-locked-public-tool-IR-and-maintained-DOM-state-machine',
  complexityLane:'behavior-heavy',sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   rootSpritePlacement:{characterId:391,depth:3,transXTwips:8247,transYTwips:5658},
   frameDomain:'sprite-391',frameCount:721,authoredStopFrames:MAIN_STOPS,
   sourceIntrospectionFrameRange:[1,721],productVisualFrameRange:[1,718],
   productPlaybackMode:'once',productPlaybackEndFrame:718,
   originalRuntimeParityEstablished:false},
  sourceAudit:source.auditPin,
  sourceBehavior:{audit:source.behaviorPin,identifiedHostContract:source.hostPin,
   externalEvidence:source.externalEvidence,
   hostSelection:'conditional-indexMI-random3-wrong-random4-right',
   historicalHostAssociationEstablished:false,originalRuntimeParityEstablished:false},
  sourceAudio:{rawIndex:source.rawPin,timingDisposition:source.timingPin,
   payloads:source.audioPins,domainCount:11,applicableFeedback:FEEDBACK_ALLOWED,
   mainBlockCount:703,mainFirstBlockFrame:9,mainLastBlockFrame:711,
   mainDecodedSamples:1289088,wholeBufferWindows:MAIN_STOPS.length,
   emptyBlockSilenceInserted:false,seekTrimApplied:false,separateLessonSaSpliced:false,
   originalRuntimeAlignmentEstablished:false,listeningAccepted:false},
  glossary:{candidate:source.glossaryPin,receipt:source.glossaryReceiptPin,
   uniqueTermCount:8,buttonOccurrenceCount:16,
   sourceSelection:'identified-indexMI-parsed-English-label-case-insensitive',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false},
  generatorChecks,validationChecks,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const runBytes=json(runManifest),runPin=bytePin(RUN,runBytes);
 const module=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p060-maintained-dom-member-v1',animationId:ID,
  rendererBindingKind:'maintained-dom-module-v1',source:SOURCE,sourceXml:XML,
  sourceRun:runPin,module,timeline,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=bytePin(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin};
 assert(projectRegistry(root,artifacts),'structural registry projection');
 return{root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted:true,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP060DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  same(pinFile(plan.root,item.path),bytePin(item.path,item.bytes),'written DOM artifact');
 }
 return{status:'P060_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP060DomArtifacts(plan){
 for(const item of plan.outputs)same(readPin(plan.root,bytePin(item.path,item.bytes)),item.bytes,
  `${item.path} manifest drift`);
 return{status:'P060_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--dry-run','--prepare','--check'].includes(process.argv[2]),
   'use --dry-run, --prepare or --check');
  const plan=buildP060DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP060DomArtifacts(plan):
   process.argv[2]==='--check'?checkP060DomArtifacts(plan):
   {status:'P060_DOM_ARTIFACTS_DRY_RUN_UNREGISTERED',artifacts:plan.artifacts,
    inputCount:plan.runManifest.inputs.length,outputCount:plan.runManifest.outputs.length,
    registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
