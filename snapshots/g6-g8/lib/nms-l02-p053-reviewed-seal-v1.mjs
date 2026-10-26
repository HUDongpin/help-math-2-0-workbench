/** Independent P053 DOM/evidence seal. Imports do no IO; each validator call
 * reads the literal run/member pins from the caller's physical worktree. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';
import * as S from './nms-l02-p053-proof-semantics-v1.mjs';

export const P053_DOM_RUN=Object.freeze({path:S.P053_RUN_PATH,bytes:85976,
 sha256:'3f7a50c543b3d48f166d32defd717e0c7e05e4243ce456ec533322da0aa58d47'});
export const P053_DOM_MEMBER=Object.freeze({path:S.P053_MEMBER_PATH,bytes:47356,
 sha256:'e9af98aeae37a208f8adde549c7cf0b3d1c9330740dbe1e9be80a3b99006c8b8'});
export const P053_DOM_MODULE=Object.freeze({path:S.P053_MODULE_PATH,bytes:2204,
 sha256:'fe44cc220a6b47687b134c9672189a25bb10ea9837abe059b758abfab8f1b55a'});
export const P053_DOM_TIMELINE=Object.freeze({path:S.P053_TIMELINE_PATH,bytes:1213,
 sha256:'5fdb6785736de97a57c5608811789b78739df46bf07121007c8ef829adf3a447'});
export const P053_DOM_INPUT_COUNT=41;
export const P053_DOM_INPUTS_SEAL='d1582b6cc2f026d095641cb4c48b2b80c8a2f317188e03c30f19fda983f5f066';
export const P053_DOM_EXTERNAL_COUNT=135;
export const P053_DOM_EXTERNAL_SEAL='85c5867ffb56e823ed06e2e9fcd20487474e06e78d91f394e2a59746c428181a';
export const P053_SHARED_DEPENDENCIES=Object.freeze([
 {path:'apps/web/components/animation-runtime.tsx',bytes:57458,sha256:'c21101c76c36cc8d062f832b2392491434c8e5c1ca0dc77edd24e233e0b74829'},
 {path:'apps/web/lib/lesson-runtime-adapter.ts',bytes:759,sha256:'19447d12fb0e1deea862b1e27217d4c476a358f89175544de081f5bd10731239'},
 {path:'apps/web/tsconfig.json',bytes:3202,sha256:'738d6e2ec305b75ab64d144ab333a0539ca026a30e575ccbd0185365f041cf50'},
 {path:'lib/g678-admission-proof.mjs',bytes:8258,sha256:'d8a54b9e982dd31689b03ed502b9e81c574996c2167893336235b41cd83cf6db'},
 {path:'packages/demos/src/contract.ts',bytes:17646,sha256:'56e5fc3c1dbde872646ebbc519f8c7d8a9d6dd0d55e37e1c44f4ad1a47798180'},
 {path:'packages/demos/src/lesson-host-contract.ts',bytes:17528,sha256:'183fc9ec36c99797147ba1fb8a5132cde60254b40279ca5fc76302806098200b'},
 {path:'scripts/private-current-js-registry.mjs',bytes:7326,sha256:'6b61308caca87a41c707b83072b010ec51631cd5b65726e948137f523ef83201'},
]);

/** Historical product evidence and executable probes are page support, not
 * formal-route acceptance. These literal pins cannot be replaced by packet
 * claims, and a later formal browser/build needs separate fresh evidence. */
export const P053_REVIEWED_EVIDENCE_PINS=Object.freeze([
 {path:'output/nms-l02-p053-product-20260928/admission/browser-evidence-applicability-v1.json',bytes:45946,sha256:'48479efa224d8396c429a217c26e1d5f01138d2b96387f4c451e610608d4f6a2'},
 {path:'output/nms-l02-p053-product-20260928/admission/source-risk-disposition-v1.json',bytes:5621,sha256:'55d88b96f84c68e4a692f8adaebd60ed15b4f000773ceea3a7ba15130a69697f'},
 {path:'output/nms-l02-p053-product-20260928/browser/pending-media-v1/candidate-a2/result.json',bytes:98146,sha256:'7928f49bf7b0b8bd66fee28bb213cb95430fefadfeb288a3b8e8f477e3be436c'},
 {path:'output/nms-l02-p053-product-20260928/browser/product-my-lesson-v1/candidate-a3/result.json',bytes:53084,sha256:'314377209a4a4c82cb957924614c692997722be45f93ccbe59f0a48bd48dc1b9'},
 {path:'output/nms-l02-p053-product-20260928/production/build-receipt-v2.json',bytes:200222,sha256:'092cc5b539b35811a2386382cb1484399cbf9933d4c4934680d8b531f92cb45e'},
 {path:'output/nms-l02-p053-product-20260928/production/product-candidate-v2-real-root.json',bytes:936185,sha256:'940a462f8c696fdbd68de1b5eed176c5f9f71af9535d2d3e469c5ff08c34e573'},
 {path:'output/nms-l02-p053-product-20260928/production/product-candidate-v2-unset.json',bytes:936181,sha256:'77bc5e0c9fdd1cf60aaacb129b0f2df5f1e1166d8185a78a76db6b575d5f09cb'},
 {path:'output/nms-l02-p053-product-20260928/production/product-v2-real-root-resume-receipt.json',bytes:1053,sha256:'269de49eb11a106e48e58db104ae972e1c7f4635dd6b615cdd14f2c59c521749'},
 {path:'output/nms-l02-p053-product-20260928/production/production-build-link-restoration-v2.json',bytes:6676,sha256:'736f0ab83311e003c83da5fdd6780193acc444e564f22b35731c9f6eb569b3c9'},
]);
export const P053_REVIEWED_PROBE_PINS=Object.freeze([
 {path:'scripts/build-and-probe-nms-l02-p053-product-v2.py',bytes:13872,sha256:'8f8c1a6a0b579aab5ddf868e374e15f3046410c606c471c5292ee77938fc8e6f'},
 {path:'scripts/check-nms-l02-p053-product-production-v2.mjs',bytes:22087,sha256:'0069fd6fa24b8b1617fd886bb6aa5cac778f67ffb737614fb11eb52909f6fff9'},
 {path:'scripts/probe-nms-l02-p053-pending-media-v1.mjs',bytes:18498,sha256:'af5db95d841cb8e8300f1b83b809aec064f1d5101e08da4ee565c5613c501e16'},
 {path:'scripts/probe-nms-l02-p053-pending-media-v1.test.mjs',bytes:1980,sha256:'b7df63f9119b639f67ca6750a7898b6e610c86d9bbe29a06f6a50ada60745f41'},
 {path:'scripts/probe-nms-l02-p053-product-my-lesson-v1.mjs',bytes:18418,sha256:'50a3454a530449c2ebdfe29433e1c546ee3549aff14c3a566cc4fd278fdb3d05'},
 {path:'scripts/resume-nms-l02-p053-product-v2-real-root.py',bytes:5074,sha256:'692170d65b04b0fa0b91714c006e6bec30b772b003facaec15b6a7f6e43b8be7'},
]);
/** Self-referential support bytes are pinned in the page proof and rehashed by
 * the common reader. Their paths, but not their own digests, are literal here. */
export const P053_PAGE_SUPPORT_PATHS=Object.freeze([
 'lib/nms-l02-p053-proof-semantics-v1.mjs',
 'lib/nms-l02-p053-proof-semantics-v1.test.mjs',
 'lib/nms-l02-p053-reviewed-seal-v1.mjs',
 'lib/nms-l02-p053-reviewed-seal-v1.test.mjs',
 'scripts/prepare-nms-l02-p053-admission.mjs',
 'scripts/prepare-nms-l02-p053-admission.test.mjs',
 ...P053_REVIEWED_EVIDENCE_PINS.map(item=>item.path),
 ...P053_REVIEWED_PROBE_PINS.map(item=>item.path),
]);

const same=(actual,expected,label)=>assert.deepStrictEqual(actual,expected,`P053_REVIEWED_SEAL: ${label}`);
const demand=(okay,label)=>assert(okay,`P053_REVIEWED_SEAL: ${label}`);
const seal=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const byPath=values=>new Map(values.map(item=>[item.path,item]));

export function readP053ReviewedDom(root){
 demand(path.isAbsolute(root),'physical worktree root argument');
 const run=readJsonPin(root,P053_DOM_RUN),member=readJsonPin(root,P053_DOM_MEMBER);
 same(run.inputs.length,P053_DOM_INPUT_COUNT,'41 sealed DOM inputs');
 same(seal(run.inputs),P053_DOM_INPUTS_SEAL,'complete DOM input seal');
 same(run.externalEvidence.length,P053_DOM_EXTERNAL_COUNT,'135 external pins');
 same(seal(run.externalEvidence),P053_DOM_EXTERNAL_SEAL,'complete external evidence seal');
 const artifacts={kind:'maintained-dom-module-v1',module:P053_DOM_MODULE,
  timeline:P053_DOM_TIMELINE,sourceRun:P053_DOM_RUN,memberManifest:P053_DOM_MEMBER};
 S.validateP053DomManifests(run,member,artifacts);
 same(run.sharedDependencies,P053_SHARED_DEPENDENCIES,'seven literal shared host pins');
 for(const item of [P053_DOM_MODULE,P053_DOM_TIMELINE,...run.inputs,
  ...run.sharedDependencies])readPin(root,item);
 return {run,member,artifacts};
}

export function validateP053ReviewedEvidence(root){
 const evidence=new Map(P053_REVIEWED_EVIDENCE_PINS.map(item=>
  [item.path,readJsonPin(root,item)]));
 const exact=relative=>{demand(evidence.has(relative),`reviewed evidence ${relative}`);
  return evidence.get(relative);};
 const output='output/nms-l02-p053-product-20260928/';
 for(const item of P053_REVIEWED_PROBE_PINS)readPin(root,item);
 const risk=exact(`${output}admission/source-risk-disposition-v1.json`);
 demand(risk?.schemaVersion===1&&
  risk.kind==='nms-l02-p053-local-current-js-source-risk-disposition-v1'&&
  risk.animationId===S.P053_ADMISSION_ID,'local source risk');
 same(risk.source,S.P053_SOURCE,'risk source SWF');
 same(risk.behavior,{frameDomain:'sprite-187',declaredFrameCount:694,
  maintainedHeldFrame:693,rootBeginFrame:6,nominalFps:12,
  hostPlaybackCompletion:false,popupCloseReceiverResolved:false,
  localeAutoPlayback:false,sourceTimelineSeekAvailable:false,glossaryAdditions:0},
  'maintained behavior remains qualified');
 same(risk.riskCases.map(item=>item.id),[
  'earlier-start-target','later-level-start','held-frame-and-completion',
  'popup-close','source-text-and-mobile-reflow','independent-source-narration'],
  'six source risks');
 demand(risk.riskCases.every(item=>item.originalRuntimeEstablished===false)&&
  risk.mediaLifecycle?.audioListeningAccepted===false&&
  risk.productCalibrationPassed===false&&risk.scaleOutAuthorized===false,
  'source risk remains open');
 same(risk.acceptanceEffects,S.P053_ACCEPTANCE_EFFECTS,'risk grants no acceptance');
 const browser=exact(`${output}browser/product-my-lesson-v1/candidate-a3/result.json`);
 demand(browser.kind==='nms-l02-p053-product-my-lesson-browser-v1'&&
  browser.animationId===S.P053_ADMISSION_ID&&browser.registeredCount===63&&
  browser.renderableCount===64&&browser.activePageCount===64&&
  browser.inputsStable===true&&browser.browserClosed===true&&browser.failure===null,
  'historical unregistered EN/ES product candidate');
 same(browser.cases.map(item=>[item.name,item.locale,item.step]),
  [['en-desktop','en','complete'],['es-mobile','es','complete']],
  'two local product cases');
 for(const item of browser.cases)demand(item.errors?.length===0&&
  item.snapshots?.some(row=>row.label==='natural-modern-clock-hold'&&row.frame===693&&
   row.playing==='false'),`${item.name} maintained hold and no console errors`);
 const pending=exact(`${output}browser/pending-media-v1/candidate-a2/result.json`);
 demand(pending.kind==='nms-l02-p053-pending-narration-browser-v1'&&
  pending.status==='technical-pass-not-acceptance'&&pending.inputStable===true&&
  pending.browserProcessExited===true&&pending.cleanupErrors?.length===0&&
  pending.cases?.length===8&&pending.cases.every(item=>item.step==='complete'&&
   item.errors?.length===0),'historical pending audio cancellation');
 const applicability=exact(`${output}admission/browser-evidence-applicability-v1.json`);
 demand(applicability.kind==='nms-l02-p053-browser-evidence-applicability-v1'&&
  applicability.classification==='reusable-for-unchanged-product-behavior'&&
  applicability.acceptanceEffect==='none'&&applicability.records?.length===2&&
  applicability.claimsNotEstablished.includes('formal admission route'),
  'historical browser reuse does not cover formal route');
 const build=exact(`${output}production/build-receipt-v2.json`);
 demand(build.kind==='nms-l02-p053-local-production-build-v1'&&
  build.exitCode===0&&build.inputsStable===true&&build.configRestored===true,
  'successful isolated product build and restored config');
 for(const mode of ['product-candidate-v2-unset.json','product-candidate-v2-real-root.json']){
  const result=exact(`${output}production/${mode}`);
  demand(result.kind==='nms-l02-p053-local-production-negative-v1'&&
   result.status==='technical-pass-not-deployment'&&result.expectedCases===2240&&
   result.results?.length===2240&&result.results.every(item=>item.pass===true)&&
   result.errors?.length===0&&result.inputStable===true&&
   result.bundleScan?.matches?.length===0,`${mode} 2240 denials and no bundle leak`);
 }
 const resume=exact(`${output}production/product-v2-real-root-resume-receipt.json`);
 demand(resume.kind==='nms-l02-p053-real-root-resume-v1'&&resume.inputsStable===true&&
  resume.configStable===true&&resume.oldBuildIdsStable===true&&resume.restored===true&&
  resume.serverExited===true&&resume.failure===null&&resume.acceptanceEffect==='none',
  'separate real-root resume restored all older bindings');
 const restoration=exact(`${output}production/production-build-link-restoration-v2.json`);
 demand(restoration.restored===true&&restoration.buildSucceeded===true&&
  restoration.failure==='Owned production port must be free'&&
  restoration.linkRestorationFailure===null&&
  restoration.configurationCleanupFailure===null,
  'build succeeded; port check failed then later resume passed');
 return true;
}

/** This is the one-argument common-reader closure adapter after binding root.
 * It never treats proof.packet as an authority for DOM or evidence digests. */
export function validateP053ReviewedProofClosure(root,proof){
 const {run,member,artifacts}=readP053ReviewedDom(root);
 validateP053ReviewedEvidence(root);
 demand(Array.isArray(proof?.files),'page proof file inventory');
 const files=byPath(proof.files);
 demand(files.size===proof.files.length,'no duplicate proof file paths');
 for(const item of [...P053_REVIEWED_EVIDENCE_PINS,...P053_REVIEWED_PROBE_PINS])
  same(files.get(item.path),item,`literal reviewed evidence/probe ${item.path}`);
 const support=P053_PAGE_SUPPORT_PATHS.map(item=>{
  const found=files.get(item);demand(found,`page support ${item}`);return found;
 });
 const pageFiles=uniquePins([...run.inputs,...run.outputs,P053_DOM_RUN,
  P053_DOM_MEMBER,...support]);
 same(proof.packet?.integrity?.files,pageFiles,'reviewed finite page membership');
 return S.validateP053ProofClosure(proof,{runManifest:run,memberManifest:member,
  artifacts,pageFiles,externalEvidence:run.externalEvidence});
}
