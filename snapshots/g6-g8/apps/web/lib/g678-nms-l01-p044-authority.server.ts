import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';

export const G678_P044_ID='shared-nms002-l01-p044';
export const G678_P044_FAMILY='nms-l01-p044-prepared-instruction-maintained-dom';
export const G678_P044_SUFFIX='nms-l01-p044-readable-instruction';
// Descriptor fields describe ORIGINAL-runtime authority, not the separately
// recorded isolated current-JS traces in the frozen candidate.
export const G678_P044_DESCRIPTOR_BOUNDARY=Object.freeze({runtimeKind:'source-script-bound-product-behavior-current-js-candidate',
  actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',audioAcceptance:'not-established',
  replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established'} as const);
export const G678_P044_AUTHORITY_TYPE='g678-nms-l01-p044-prepared-current-js-fragment-v2';
export const G678_P044_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.json',bytes:2424951,sha256:'1c80050ed48b12f4f16039c3a83136781c586da4520a4108d7b6cd8e5bb9cc81'});
export const G678_P044_PREDECESSOR=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json',bytes:2415408,sha256:'cf4921508fcaff5270c2dc4a3bd2571397b9c456b0ff5c1cae46378081e71cf5'});
export const G678_P044_AUTHORITY=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v2.fragment.json',bytes:9139,sha256:'6208880d4423d19645b508106b65f53a692dcd2bebf5c98909379851d1f1c00d'});
export const G678_P044_CANDIDATE=Object.freeze({path:'catalog/g678-nms-l01-p044-prepared-candidate-v2.json',bytes:45950,sha256:'bc28727e4807babc5f9f72907c56c9aad3be00bdd5dc8817433dab453e3e27ed'});
export const G678_P044_GLOSSARY=Object.freeze({path:'catalog/g678-nms-l01-p044-source-glossary-v1.json',bytes:9939,sha256:'e6b22bae8cab1a1a5597069a852766341845e2ea5ac141983d72a9bfb45f1203'});
export const G678_P044_WITNESS=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-378-private-registry-witness-v1.json',bytes:432557,sha256:'c075c204a21c020da2cef54bec74a2e713d7eba1c4fc3d55b158e0d8a8d464e2'});
export const G678_P044_ACTIVE_REGISTRY=Object.freeze({path:'packages/demos/private-current-js-registry.json',bytes:433966,sha256:'e68a3d39213766e220795a4f0a16412e09a0e830c9978a66bcd7dd02361372cb'});
const SOURCE={path:'G6-G8-shared/NMS002/L1/TS/L1TS08.swf',bytes:657348,sha256:'8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76'};
const COMPILER={path:'work/g678-shared-page-factory/g678-nms-l01-p044-prepared-current-js-v1/run-manifest.json',bytes:37598,sha256:'a518df8595e09a0f86eee41e80d55314fc7aade8c01a1e709098ce66c0870a7c'};
const VALIDATION={path:'work/g678-shared-page-factory/g678-nms-l01-p044-prepared-current-js-v2/run-manifest.json',bytes:39998,sha256:'d86746d411941d23a65c15ffcab3165fc4f62fb0b7f5c8b41fbf75a56880e2a6'};
type Json=Record<string,unknown>;
export type P044Pin=Readonly<{path:string;bytes:number;sha256:string}>;
export type P044Binding=P044Pin&Readonly<{value:unknown}>;
const record=(v:unknown):Json=>v&&typeof v==='object'&&!Array.isArray(v)?v as Json:{};
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function requireThat(v:unknown,reason:string):asserts v{if(!v)throw Error(`G678_P044_AUTHORITY_INVALID: ${reason}`);}
function pin(v:unknown):P044Pin{const p=record(v);requireThat(typeof p.path==='string'&&Number.isSafeInteger(p.bytes)&&Number(p.bytes)>0&&typeof p.sha256==='string'&&/^[a-f0-9]{64}$/.test(p.sha256),'invalid pin');return{path:p.path,bytes:Number(p.bytes),sha256:p.sha256};}
function canonical(binding:P044Binding|undefined,expected:P044Pin,label:string){
  requireThat(binding&&exact(Object.keys(binding).sort(),['bytes','path','sha256','value'])&&exact(pin(binding),expected),`${label} binding`);
  const bytes=Buffer.from(JSON.stringify(binding.value,null,2)+'\n');requireThat(bytes.length===expected.bytes&&hash(bytes)===expected.sha256,`${label} canonical bytes`);return record(binding.value);
}
function falseGates(value:unknown,label:string){const flags=Object.values(record(value));requireThat(flags.length>0&&flags.every(v=>v===false),`${label} independent gates`);}
export function validateG678P044Authority(input:{authority:P044Binding;candidate:P044Binding|undefined;predecessor:P044Binding|undefined;freeze:P044Binding;glossary:P044Binding|undefined}){
  const authority=canonical(input.authority,G678_P044_AUTHORITY,'source authority'),candidate=canonical(input.candidate,G678_P044_CANDIDATE,'stable candidate');
  const prior=canonical(input.predecessor,G678_P044_PREDECESSOR,'378 predecessor'),freeze=canonical(input.freeze,G678_P044_FREEZE,'379 freeze'),glossary=canonical(input.glossary,G678_P044_GLOSSARY,'glossary');
  requireThat(authority.artifactType===G678_P044_AUTHORITY_TYPE&&authority.deploymentScope==='local-only'&&authority.currentJavaScriptRegisteredCount===0&&authority.exactPlacementCount===1,'exact local unregistered source scope');
  falseGates(authority.acceptanceEffects,'source');falseGates(candidate.gates,'candidate');falseGates(glossary.acceptanceEffects,'glossary');falseGates(freeze.acceptanceEffects,'freeze');
  requireThat(exact(authority.candidateManifest,G678_P044_CANDIDATE)&&exact(authority.compilerRun,VALIDATION)&&exact(candidate.predecessorRegistryWitness,G678_P044_WITNESS),'candidate lineage');
  requireThat(exact(candidate.source,SOURCE)&&exact(glossary.source,SOURCE)&&candidate.animationId===G678_P044_ID&&glossary.animationId===G678_P044_ID,'exact source identity');
  const entries=authority.entries;requireThat(Array.isArray(entries)&&entries.length===1,'single entry');const entry=record(entries[0]);
  requireThat(entry.key===G678_P044_ID&&entry.adapterFamily===G678_P044_FAMILY&&entry.module==='./modules/g678-nms-l01-prepared-current-js-p044','exact module family');
  requireThat(exact(entry.source,SOURCE)&&exact(entry.proposedPresentation,{pageInteractionCompanionTargetIdSuffix:G678_P044_SUFFIX,descriptorActivated:false}),'source presentation');
  requireThat(pin(entry.memberManifest).path===COMPILER.path.replace('/run-manifest.json',`/members/${G678_P044_ID}/member-manifest.json`),'actual compiler/member origin');
  const m=record(entry.runtimeContract),movie=record(m.movie),runtime=record(m.runtime),host=record(m.lessonHost);
  requireThat(m.key===G678_P044_ID&&movie.frameCount===10&&movie.fps===12&&exact(movie.stage,{width:800,height:600})&&runtime.defaultFrameDomain==='sprite-293'&&m.playbackEndFrame===756,'source frame domains');
  const flat={stage:movie.stage,rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-293',frameCount:759,fps:12,livePlaybackEndFrame:756,
    scenario:'nms-l01-p044-source-behavior-candidate',language:'fixed-en',seed:'0',interactiveStops:m.interactiveStops,authoredTimelineControls:[],reducedMotionFrame:756,lessonHostCapabilities:host.capabilities};
  requireThat(exact(host.capabilities,['glossary','practice-feedback'])&&Array.isArray(m.interactiveStops)&&exact(m.interactiveStops.map(s=>record(s).stopFrame),[312,449,575,697,737]),'exact host/stop contract');
  const selected=freeze.selectedPages,old=prior.selectedPages;requireThat(Array.isArray(selected)&&Array.isArray(old)&&selected.length===379&&old.length===378&&
    exact(selected.filter(p=>record(p).animationId!==G678_P044_ID),old),'all378 predecessor objects and order');
  const added=record(selected.find(p=>record(p).animationId===G678_P044_ID)),selectedRuntime=record(added.runtime),{rendererBinding,...selectedFlat}=selectedRuntime;
  requireThat(exact(selectedFlat,flat)&&added.sourceSha256===SOURCE.sha256&&added.adapterFamily===G678_P044_FAMILY&&
    exact(record(rendererBinding).sourceRun,COMPILER)&&added.productCalibrationPassed===false&&added.engineeringPreviewReady===false,'exact added renderer');
  requireThat(exact(record(freeze.inputs).p044PredecessorFreeze,G678_P044_PREDECESSOR)&&exact(record(freeze.inputs).p044PredecessorRegistry,G678_P044_WITNESS)&&
    exact((record(freeze.inputs).selectionAuthorities as unknown[]).filter(p=>record(p).path!==G678_P044_AUTHORITY.path),record(prior.inputs).selectionAuthorities)&&
    freeze.registrationCandidatePlacementCount===379&&freeze.sharedAdapterPlacementCount===365&&freeze.advancedManualPlacementCount===14&&freeze.scaleOutAuthorized===false,'successor boundary');
  const physicalFiles=candidate.physicalFiles;requireThat(Array.isArray(physicalFiles)&&physicalFiles.length===177,'explicit physical closure');
  const physical=physicalFiles.map(pin);requireThat(new Set(physical.map(p=>p.path)).size===physical.length&&!physical.some(p=>p.path===G678_P044_ACTIVE_REGISTRY.path)&&
    physical.filter(p=>exact(p,G678_P044_WITNESS)).length===1,'historical witness only, not old live registry bytes');
  const mapping=candidate.historicalInputWitnesses;requireThat(Array.isArray(mapping)&&mapping.length===1&&
    exact(record(mapping[0]).capturedInput,{...G678_P044_WITNESS,path:G678_P044_ACTIVE_REGISTRY.path})&&exact(record(mapping[0]).physicalWitness,G678_P044_WITNESS),'exact witness map');
  requireThat(Array.isArray(glossary.entries)&&exact(glossary.entries.map(e=>record(e).id),['multiplication','solve','total']),'exact three glossary entries');
  const normalizedEntry:Json&{runtimeContract:typeof flat}={...entry,runtimeContract:flat};
  return{entry:normalizedEntry,compilerRun:COMPILER,validationRun:VALIDATION,
    proposedPresentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:G678_P044_SUFFIX}),glossaryEntries:glossary.entries,
    physicalPins:Object.freeze([...new Map([...physical,G678_P044_AUTHORITY,G678_P044_CANDIDATE,G678_P044_GLOSSARY,G678_P044_PREDECESSOR,G678_P044_FREEZE,VALIDATION].map(p=>[p.path,p])).values()])};
}
export function resolveG678P044PhysicalPath(root:string,p:string){
  if(p.startsWith('G6-G8-shared/')){requireThat(p===SOURCE.path&&process.env.HELP_MATH_G678_SOURCE_ROOT,'exact source root');return path.resolve(process.env.HELP_MATH_G678_SOURCE_ROOT!,p);}
  requireThat(!p.includes('\\'),'canonical separator');
  if(p.startsWith('../')){const resolved=path.resolve(root,p),vendor=realpathSync(path.join(root,'node_modules'));requireThat(resolved.startsWith(vendor+path.sep)&&realpathSync(resolved)===resolved,'vendor-only relative escape');return resolved;}
  requireThat(path.isAbsolute(p)?path.normalize(p)===p:p.split('/').every(s=>s&&s!=='.'&&s!=='..'),'canonical path');
  // A recorded absolute root keeps its pin; only physical custody follows the reviewed Life
  // root binding. The ordinary-file, single-link, stability, byte and SHA-256 checks still apply.
  return path.isAbsolute(p)?resolveG678HistoricalEvidencePath(p,root):path.resolve(root,p);
}
export function readG678P044PhysicalPin(root:string,expected:P044Pin){const full=resolveG678P044PhysicalPath(root,expected.path),before=lstatSync(full);
  requireThat(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1&&realpathSync(full)===full,'ordinary single-linked physical file');
  const bytes=readFileSync(full),after=lstatSync(full);requireThat(['dev','ino','size','mtimeMs','ctimeMs','mode','nlink'].every(k=>before[k as keyof typeof before]===after[k as keyof typeof after])&&
    realpathSync(full)===full&&bytes.length===expected.bytes&&hash(bytes)===expected.sha256,`physical drift: ${expected.path}`);return bytes;
}
export function readG678P044FileBinding(root:string,expected:P044Pin):P044Binding{const bytes=readG678P044PhysicalPin(root,expected);return{...expected,value:JSON.parse(bytes.toString('utf8'))};}
export function validateG678P044PhysicalClosure(root:string,validated:ReturnType<typeof validateG678P044Authority>){
  for(const p of validated.physicalPins)readG678P044PhysicalPin(root,p);
  requireThat((lstatSync(path.resolve(root,G678_P044_WITNESS.path)).mode&0o222)===0,'read-only predecessor witness');
  return validated.physicalPins.map(p=>resolveG678P044PhysicalPath(root,p.path));
}
