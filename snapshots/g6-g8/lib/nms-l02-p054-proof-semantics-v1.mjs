/** P054 local matching-game proof contract. Every seal is literal; importing
 * this module performs no filesystem read. Producers and the common proof
 * reader rehash the physical files and external resources. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';
import * as S from './nms-l02-p054-admission-semantics.mjs';
export * from './nms-l02-p054-admission-semantics.mjs';

export const P054_DOM_RUN=Object.freeze({path:S.P054_RUN_PATH,bytes:59551,
 sha256:'e2a7c7d03d5d0ff0a2a949a39ba4232437b70f85184d30718108211701533c3d'});
export const P054_DOM_MEMBER=Object.freeze({path:S.P054_MEMBER_PATH,bytes:21706,
 sha256:'1207b6be377e9ea7ae3e225baf33417370d2a256e1f2aac8dfea9479146fd6ec'});
export const P054_DOM_MODULE=Object.freeze({path:S.P054_MODULE_PATH,bytes:272,
 sha256:'962b72be7463676fa2e6dee9d59807d7dbeda6892c5a3923e7cdf821a76c85fe'});
export const P054_DOM_TIMELINE=Object.freeze({path:S.P054_TIMELINE_PATH,bytes:1227,
 sha256:'fe075de74abbf335c5757620df9370620d692496051a2c42587f9843c3c8139b'});
export const P054_DISPOSITION=Object.freeze({path:'output/nms-l02-p054-product-20260928/admission/source-risk-disposition-v1.json',
 bytes:3998,sha256:'f037e4a9da8ad7a74a9427395a13963f135ff5068b8ed43061bd96ade18098b2'});
export const P054_MATCHING_STATE=Object.freeze({path:'packages/demos/src/nms-l02-p054-matching-state-candidate.ts',
 bytes:3572,sha256:'49a52ed7b609afdfc7a1c268ddb96b9f271ff44b4a7fa6089bd4becaf48db496'});
export const P054_BOARD=Object.freeze({path:'packages/demos/src/nms-l02-p054-product-board-v1.tsx',
 bytes:21953,sha256:'da2dc70bc5f861b84c83580b6ff29e645bf050887535592bd80f8828306fc6d4'});
export const P054_RUNTIME_ADAPTER=Object.freeze({path:'apps/web/components/nms-l02-p054-lesson-runtime-v1.tsx',
 bytes:3692,sha256:'b7a1a44529ec4f5631f49b602d5acd5cfde50f9e6d6899bc51b0b5aa2f0719e7'});
export const P054_PRODUCT_MODULE=Object.freeze({path:'packages/demos/src/nms-l02-p054-product-module-v1.tsx',
 bytes:5295,sha256:'94388b79f7152372fe65f59522c49edc553d6e0ff79918f743a7cb54e598e142'});
export const P054_BROWSER_MAIN=Object.freeze({path:'output/nms-l02-p054-product-20260928/browser/product-candidate-v1/product-candidate-v4/result.json',
 bytes:773273,sha256:'5c87196ea2bddc176e79ab6e9ef2274e1db0da41fbe6ea8b2b6c486db8aac4dc'});
export const P054_BROWSER_PENDING_MEDIA=Object.freeze({path:'output/nms-l02-p054-product-20260928/browser/pending-media-v2/candidate-v3/result.json',
 bytes:129194,sha256:'9cedcb0185aeca079956fedad1a53004ec73c0ef7808a0564fc699cc1bc12a03'});
export const P054_AUDIO_MANIFEST_PIN=Object.freeze({path:S.P054_AUDIO_MANIFEST.path,
 bytes:70569,sha256:S.P054_AUDIO_MANIFEST.sha256});

/** Exact host-owned pins in the sealed P054 run. */
export const P054_SHARED_DEPENDENCIES=Object.freeze([
 {path:'apps/web/components/animation-runtime.tsx',bytes:57458,sha256:'c21101c76c36cc8d062f832b2392491434c8e5c1ca0dc77edd24e233e0b74829'},
 {path:'apps/web/lib/lesson-runtime-adapter.ts',bytes:759,sha256:'19447d12fb0e1deea862b1e27217d4c476a358f89175544de081f5bd10731239'},
 {path:'apps/web/tsconfig.json',bytes:3202,sha256:'738d6e2ec305b75ab64d144ab333a0539ca026a30e575ccbd0185365f041cf50'},
 {path:'lib/g678-admission-proof.mjs',bytes:8258,sha256:'d8a54b9e982dd31689b03ed502b9e81c574996c2167893336235b41cd83cf6db'},
 {path:'packages/demos/src/contract.ts',bytes:17646,sha256:'56e5fc3c1dbde872646ebbc519f8c7d8a9d6dd0d55e37e1c44f4ad1a47798180'},
 {path:'packages/demos/src/lesson-host-contract.ts',bytes:17528,sha256:'183fc9ec36c99797147ba1fb8a5132cde60254b40279ca5fc76302806098200b'},
 {path:'scripts/private-current-js-registry.mjs',bytes:7326,sha256:'6b61308caca87a41c707b83072b010ec51631cd5b65726e948137f523ef83201'},
]);
export const P054_INHERITED_HOST_OVERLAPS=Object.freeze([]);
export const P054_PAGE_SUPPORT_PATHS=Object.freeze([
 'lib/nms-l02-p054-proof-semantics-v1.mjs',
 'lib/nms-l02-p054-proof-semantics-v1.test.mjs',
 'scripts/prepare-nms-l02-p054-admission.mjs',
 'scripts/prepare-nms-l02-p054-admission.test.mjs',
]);
export const P054_REVIEWED_CORE_INPUTS=Object.freeze([
 ...Object.values(S.P054_REVIEWED_SOURCE_PINS),P054_DISPOSITION,
 P054_MATCHING_STATE,P054_BOARD,P054_RUNTIME_ADAPTER,P054_PRODUCT_MODULE,
 P054_BROWSER_MAIN,P054_BROWSER_PENDING_MEDIA,
]);
export const P054_REQUIRED_PAGE_PATHS=Object.freeze([
 P054_DOM_RUN.path,P054_DOM_MEMBER.path,P054_DOM_MODULE.path,P054_DOM_TIMELINE.path,
 ...P054_REVIEWED_CORE_INPUTS.map(item=>item.path),...P054_PAGE_SUPPORT_PATHS,
]);

/** SHA-256 of JSON.stringify over the 53 sorted exact sealed run.inputs pins
 * and 30 sorted exact sealed run.externalEvidence pins. These literal seals
 * cover every listed byte/hash without import-time access to the run file. */
export const P054_DOM_INPUT_COUNT=53;
export const P054_DOM_INPUTS_SEAL='9cc25e554237ad4551e483b00bfb25767353e282be7032575b93a28dc2beaf14';
export const P054_DOM_EXTERNAL_COUNT=30;
export const P054_DOM_EXTERNAL_SEAL='6b097f3f72daaa4d9b47d29502de21ae8ceace85188c920d16efbd7cab6c7cf9';

const same=(actual,expected,label)=>assert.deepStrictEqual(actual,expected,`NMS_L02_P054_PROOF: ${label}`);
const demand=(ok,label)=>assert(ok,`NMS_L02_P054_PROOF: ${label}`);
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
const seal=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pin=(value,expectedPath)=>demand(value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===expectedPath&&
 Number.isSafeInteger(value.bytes)&&value.bytes>=0&&value.bytes<=64*1024*1024&&
 /^[a-f0-9]{64}$/u.test(value.sha256),`bounded pin ${expectedPath}`);

/** Source risk is explicitly a local maintained behavior disposition. */
export function validateP054Disposition(value){
 demand(value?.schemaVersion===1&&
  value.kind==='nms-l02-p054-local-current-js-source-risk-disposition-v1'&&
  value.animationId===S.P054_ADMISSION_ID,'local P054 disposition');
 same(value.source,S.P054_SOURCE,'disposition source');
 same(value.behavior,{levelCount:2,cardsPerLevel:12,pairsPerLevel:6,
  correctDelta:10,wrongDelta:-2,scoreFloor:null,
  terminalPhase:'terminal-unresolved',hostCompletion:false,finalQuizScoring:false,
  localeAutoPlayback:false,sourceTimelineSeekAvailable:false},
 'maintained matching behavior, no host completion');
 same(value.riskCases?.map(item=>item.id),[
  'entry-level-context','feedback-clock','six-pair-terminal','repeat-dialog',
  'separate-sa-and-result-audio'], 'five bounded source risks');
 demand(value.riskCases.every(item=>item.originalRuntimeEstablished===false),
  'source risks remain unresolved');
 demand(value.mediaLifecycle?.replayAndDepartureAbortPending===true&&
  value.mediaLifecycle.staleGenerationMustNotCreateOrPlayAudio===true&&
  value.mediaLifecycle.ownedPlayersAndObjectUrlsReleased===true&&
  value.mediaLifecycle.audioListeningAccepted===false,'feedback audio lifecycle is local');
 same(value.acceptanceEffects,S.P054_ACCEPTANCE_EFFECTS,'all seven acceptance gates false');
 demand(value.productCalibrationPassed===false&&value.scaleOutAuthorized===false,
  'no factory calibration or scale-out');
 return true;
}

/** Candidate browser observations, not an original Flash trace. */
export function validateP054BrowserEvidence(main,pending){
 demand(main?.kind==='nms-l02-p054-product-my-lesson-browser-v1'&&
  main.animationId===S.P054_ADMISSION_ID&&main.status==='technical-pass-not-acceptance'&&
  main.formal===false&&main.registeredPageCount===62&&main.renderableCount===63&&
  main.activePageCount===64&&main.inputStable===true&&
  main.browserProcessExited===true,'main EN/ES candidate');
 same(main.cleanupErrors,[],'main browser cleanup');
 demand(Array.isArray(main.cases)&&main.cases.length===2,'two main locale cases');
 for(const [index,name,locale,level] of [[0,'en-desktop-level1','en',1],
  [1,'es-mobile-reduced-level2','es',2]]){
  const item=main.cases[index];
  demand(item.name===name&&item.locale===locale&&item.level===level&&
   item.status===main.status&&item.ready===true&&item.step==='return-p054'&&
   item.errors?.length===0&&item.resourceErrors?.length===0&&
   item.contextClose==='closed',`${name} source board path`);
  const observations=item.observations;
  demand(observations?.some(row=>row.label==='wrong-feedback-end-0'&&row.score===-2)&&
   observations.some(row=>row.label==='host-replay-reset'&&row.score===0&&row.matched===0)&&
   observations.some(row=>row.label==='correct-feedback-end-6'&&
    row.phase==='terminal-unresolved'&&row.score===58&&row.matched===6)&&
   observations.some(row=>row.label==='p054-return-reset'&&row.score===0&&row.matched===0),
   `${name} scoring, unresolved terminal and Replay`);
 }
 demand(pending?.kind==='nms-l02-p054-pending-media-browser-v2'&&
  pending.status==='technical-pass-not-acceptance'&&pending.formal===false&&
  pending.inputStable===true&&pending.browserProcessExited===true,
  'pending-media EN/ES candidate');
 same(pending.cleanupErrors,[],'pending-media cleanup');
 demand(Array.isArray(pending.cases)&&pending.cases.length===2,'two pending-media locale cases');
 for(const [index,name,locale,level] of [[0,'en-level1','en',1],
  [1,'es-level2-reduced','es',2]]){
  const item=pending.cases[index];
  demand(item.name===name&&item.locale===locale&&item.level===level&&
   item.status===pending.status&&item.step==='return-ready'&&item.errors?.length===0&&
   item.contextClose==='closed'&&item.staleRelease?.length===4&&
   item.staleRelease.every(row=>row.result==='fulfilled-after-cancel')&&
   item.replayAbort?.length===2&&item.navigationAbort?.length===2&&
   [...item.replayAbort,...item.navigationAbort].every(row=>row.failure==='net::ERR_ABORTED'),
   `${name} stale-load replay/departure cleanup`);
 }
 return true;
}

function externalPhysicalPin(item){
 demand(item&&typeof item.root==='string'&&path.isAbsolute(item.root),
  'external physical root');
 const value=item.pin;
 demand(value&&typeof value.path==='string'&&!path.isAbsolute(value.path)&&
  value.path.split('/').every(part=>part&&part!=='.'&&part!=='..'),
  'bounded external relative path');
 pin(value,value.path);
 return {...value,path:path.join(item.root,value.path)};
}
const externalRecord=value=>value.path.startsWith(`${S.P054_SOURCE_ROOT}/`)
 ? {root:S.P054_SOURCE_ROOT,pin:{...value,path:path.relative(S.P054_SOURCE_ROOT,value.path)}}
 : {root:path.dirname(value.path),pin:{...value,path:path.basename(value.path)}};

export function validateP054ProofClosure(proof){
 demand(proof?.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract==='nms-l02-source-bound-host-v1'&&
  proof.animationId===S.P054_ADMISSION_ID,'single local P054 proof identity');
 pin(proof.freeze,S.P054_FREEZE_PATH);
 S.validateP054AdmissionSemantics({...proof.packet,freezeManifest:proof.freeze},proof.registration);
 const artifacts=proof.packet.entry.artifacts;
 same(artifacts,{kind:'maintained-dom-module-v1',module:P054_DOM_MODULE,
  timeline:P054_DOM_TIMELINE,memberManifest:P054_DOM_MEMBER,sourceRun:P054_DOM_RUN},
 'exact sealed run/member/module/timeline');
 const own=proof.packet.integrity.files;
 demand(Array.isArray(own),'page-owned closure');
 same(own.map(item=>item.path),sorted([...new Set(own.map(item=>item.path))]),
  'sorted unique page-owned closure');
 for(const item of own)pin(item,item.path);
 const byPath=new Map(own.map(item=>[item.path,item]));
 for(const required of P054_REQUIRED_PAGE_PATHS)
  demand(byPath.has(required),`required page input ${required}`);
 for(const reviewed of P054_REVIEWED_CORE_INPUTS)
  same(byPath.get(reviewed.path),reviewed,`exact reviewed source/product/browser pin ${reviewed.path}`);
 for(const reviewed of [P054_DOM_RUN,P054_DOM_MEMBER,P054_DOM_MODULE,P054_DOM_TIMELINE])
  same(byPath.get(reviewed.path),reviewed,`exact DOM artifact ${reviewed.path}`);
 const domInputs=own.filter(item=>!P054_PAGE_SUPPORT_PATHS.includes(item.path)&&
  item.path!==S.P054_RUN_PATH&&item.path!==S.P054_MEMBER_PATH);
 same(domInputs.length,P054_DOM_INPUT_COUNT,'all 53 sealed DOM inputs');
 same(seal(domInputs),P054_DOM_INPUTS_SEAL,'exact sealed 53-input DOM closure');
 same(own.length,P054_DOM_INPUT_COUNT+P054_PAGE_SUPPORT_PATHS.length+2,
  'no hidden or missing page-owned file');
 same(proof.packet.integrity.sharedDependencies,P054_SHARED_DEPENDENCIES,
  'seven exact shared host dependencies');
 for(const dep of P054_SHARED_DEPENDENCIES){
  pin(dep,dep.path);demand(!byPath.has(dep.path),'page/host dependency disjoint');
 }
 same(proof.files.map(item=>item.path),
  sorted([...own.map(item=>item.path),S.P054_FREEZE_PATH,S.P054_FRAGMENT_PATH]),
  'proof freeze, fragment and own files');
 for(const item of proof.files)pin(item,item.path);
 const files=new Map(proof.files.map(item=>[item.path,item]));
 for(const item of own)same(files.get(item.path),item,`proof retains ${item.path}`);
 same(files.get(S.P054_FREEZE_PATH),proof.freeze,'freeze bytes pinned');
 const physical=proof.external?.map(externalPhysicalPin);
 demand(Array.isArray(physical)&&physical.length===P054_DOM_EXTERNAL_COUNT,
  '30 physical source and resource pins');
 same(physical.map(item=>item.path),sorted(physical.map(item=>item.path)),
  'sorted external source/resource pins');
 same(seal(physical),P054_DOM_EXTERNAL_SEAL,'30 exact sealed DOM external pins');
 const expected=[
  {...S.P054_SOURCE,path:path.join(S.P054_SOURCE_ROOT,S.P054_SOURCE.path)},
  {...S.P054_XML,path:path.join(S.P054_SOURCE_ROOT,S.P054_XML.path)},
  S.P054_MOVIE_XML,P054_AUDIO_MANIFEST_PIN,...proof.packet.resources.externalPins,
 ].sort((a,b)=>a.path.localeCompare(b.path));
 same(physical,expected,'source SWF/XML, retained movie, audio manifest, 24 SVG and two MP3');
 same(proof.external,expected.map(externalRecord),
  'physical roots and relative common-reader paths');
 return true;
}
