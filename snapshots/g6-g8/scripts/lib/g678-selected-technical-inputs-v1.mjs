/** Selected current-input stability for technical observation; never a replacement admission. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {REGISTRY,DISPATCH,pinFile,readPin,readJsonPin,uniquePins} from '../../lib/g678-admission-proof.mjs';
import {readG678CourseRuntimeBindings} from './g678-course-runtime-bindings-v1.mjs';
import {verifyStableInputs} from './g678-stable-browser-candidate-v1.mjs';
import {expandLocalModuleClosure,verifySelectedRegistryModuleImports,isUnambiguousLoopbackHttpUrl} from '../implementation-artifact-closure.mjs';

export const LESSON='ALG001:6';
export const MANIFEST='catalog/g678-page-only-release-manifest.v1.json';
export const ASSESSOR='scripts/lib/g678-technical-assessor-v1.mjs';
export const CLI='scripts/g678-course-technical-audit.mjs';
const HFR_DISPATCH='apps/web/lib/hfr-local-animation-loader-v1.generated.ts';
const HFR_CANDIDATE_DISPATCH='apps/web/lib/hfr-local-candidates-v2.generated.ts';
const DISPATCH_LEAVES=[...DISPATCH,'packages/demos/src/registry.generated.ts',HFR_DISPATCH,HFR_CANDIDATE_DISPATCH];
const SHARED=[
 'package.json','package-lock.json','apps/web/package.json','packages/demos/package.json',
 'apps/web/next.config.ts','apps/web/tsconfig.json','apps/web/postcss.config.mjs','apps/web/proxy.ts',
 'apps/web/app/[locale]/layout.tsx','apps/web/app/[locale]/migration-status/g678-course/[module]/[lesson]/page.tsx',
 'apps/web/components/g678-alg-l06-course-player.tsx','apps/web/components/animation-runtime.tsx',
 'apps/web/lib/load-animation-module.client.ts','packages/demos/src/contract.ts',
 'catalog/animations.json','packages/demos/prototype-registry.json','packages/demos/src/prototype-manifest.ts',
 CLI,ASSESSOR,'scripts/lib/g678-selected-technical-inputs-v1.mjs','scripts/lib/g678-stable-browser-candidate-v4.mjs',
 'scripts/browser/g678-technical-observer-v1.mjs',
];
export function relativePath(root,value) {
 assert(typeof value==='string'&&value.length&&!value.includes('\\'),'explicit path');
 const relative=path.relative(root,path.resolve(root,value));
 assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'path within execution root');
 assert(relative.split('/').every(p=>p&&p!=='.'&&p!=='..'),'bounded path');
 assert(fs.realpathSync(root)===root,'physical execution root');let current=root;
 for(const part of relative.split('/')){current=path.join(current,part);if(fs.existsSync(current))assert(!fs.lstatSync(current).isSymbolicLink(),'no symlink input/output path');}
 return relative;
}
export function writeNew(root,file,value) {
 const relative=relativePath(root,file);fs.mkdirSync(path.dirname(path.join(root,relative)),{recursive:true});
 fs.writeFileSync(path.join(root,relative),JSON.stringify(value,null,2)+'\n',{flag:'wx'});return pinFile(root,relative);
}
export function lessonInventory(root,lesson=LESSON) {
 const manifestPin=pinFile(root,MANIFEST),manifest=readJsonPin(root,manifestPin);
 const members=sourceOrderedLessonMembers(manifest,lesson);
 const animationIds=members.map(m=>m.animationId),bindings=readG678CourseRuntimeBindings(root,animationIds);
 return {kind:'g678-lesson-technical-inventory-v1',lesson,manifest:manifestPin,animationIds,members,bindings,
   acceptanceEffects:{admission:false,technicalPassed:false,registeredDelta:0}};
}
export function sourceOrderedLessonMembers(manifest,lesson=LESSON) {
 const match=/^(NMS002|ALG001|GEO001|DAT001):([1-9]|1[0-2])$/.exec(lesson);
 assert(match,'one exact G6-G8 source lesson required');
 const moduleCode=match[1],lessonNumber=Number(match[2]);
 const lessons=manifest.releases.filter(r=>r.moduleCode===moduleCode&&r.moduleLesson===lessonNumber);
 assert.equal(lessons.length,1,'exact source lesson');
 const members=[...lessons[0].members].sort((a,b)=>a.ordinal-b.ordinal);
 assert(members.length>0,'nonempty active source lesson');
 assert(members.every((m,i)=>m.ordinal===i+1&&m.animationId===`shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2,'0')}-p${String(i+1).padStart(3,'0')}`),'source-ordered exact lesson identities');
 return members;
}
function retainedPins(value,out=[]) {
 if(!value||typeof value!=='object')return out;
 if(typeof value.path==='string'&&Number.isSafeInteger(value.bytes)&&typeof value.sha256==='string')out.push(value);
 else for(const child of Object.values(value))retainedPins(child,out);
 return out;
}
function normalizePin(root,pin) {
 const file=path.resolve(root,pin.path),inside=file.startsWith(root+'/');
 const atRoot=inside?root:path.dirname(file),relative=inside?path.relative(root,file):path.basename(file);
 const exact={path:relative,bytes:pin.bytes,sha256:pin.sha256};readPin(atRoot,exact);
 return inside?{local:exact}:{external:{root:atRoot,pin:exact}};
}
function selectedAssetRoutes(root,ids) {
 const base='apps/web/app/flash-assets/g678-local',result=[];
 if(!fs.existsSync(path.join(root,base)))return result;
 const visit=relative=>{for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})) {
   assert(!entry.isSymbolicLink(),'asset route tree has no symlinks');const file=relative+'/'+entry.name;
   if(entry.isDirectory())visit(file);else if(entry.isFile()&&entry.name==='route.ts')result.push(file);
 }};
 for(const entry of fs.readdirSync(path.join(root,base),{withFileTypes:true}))if(entry.isDirectory()&&(entry.name.startsWith('[')||ids.some(id=>entry.name===id||['-candidate','-registered','-formal'].some(s=>entry.name===id+s))))visit(base+'/'+entry.name);
 return result;
}
export function verifySelectedTechnicalCandidate(root,candidate) {
 assert.equal(candidate.validationScope,'selected-current-inputs-technical-v1');
 assert.equal(candidate.historicalAdmission,'not-revalidated');assert.equal(candidate.host,null);assert.equal(candidate.index,null);
 assert(candidate.acceptanceEffects?.admission===false&&candidate.acceptanceEffects?.technicalPassed===false,'stability grants no acceptance');
 assert(candidate.animationIds.length>0&&candidate.animationIds.every(id=>candidate.expectedAnimationIds.includes(id)),'selected within lesson');
 const expected=sourceOrderedLessonMembers(readJsonPin(root,pinFile(root,MANIFEST)),candidate.lesson).map(m=>m.animationId);
 assert.deepEqual(candidate.expectedAnimationIds,expected,'full source lesson denominator');
 verifyStableInputs(root,candidate);readPin(root,candidate.contracts);readPin(root,candidate.collector);readPin(root,candidate.collectionConfig);
 return candidate;
}
export async function prepareSelectedTechnicalRun({root,lesson=LESSON,animationIds,contractsPath,collectorPath,configPath,outputDirectory}) {
 const inventory=lessonInventory(root,lesson),out=relativePath(root,outputDirectory);
 assert(/^(work|output)\//.test(out),'technical run output belongs to work or output');
 assert(!fs.existsSync(path.join(root,out)),'new run output directory required');
 const requested=animationIds??inventory.animationIds;
 assert(requested.length&&new Set(requested).size===requested.length&&requested.every(id=>inventory.animationIds.includes(id)),'exact distinct selected pages');
 const sourceContracts=pinFile(root,relativePath(root,contractsPath)),bundle=readJsonPin(root,sourceContracts);
 const contracts=Array.isArray(bundle.contracts)?bundle.contracts:[bundle];
 assert(new Set(contracts.map(c=>c.animationId)).size===contracts.length&&contracts.every(c=>inventory.animationIds.includes(c.animationId)),'unique source lesson contracts');
 const collector=pinFile(root,relativePath(root,collectorPath)),collectionConfig=pinFile(root,relativePath(root,configPath));
 const config=readJsonPin(root,collectionConfig);assert(isUnambiguousLoopbackHttpUrl(config.origin),'local loopback collection origin required');
 const skipped=[],eligible=[];
 for(const id of requested) {
  const binding=inventory.bindings.rows.find(r=>r.animationId===id),contract=contracts.find(c=>c.animationId===id);
  if(binding?.status!=='ready'||!contract) {skipped.push({animationId:id,status:!contract?'not-run':'fail',reason:!contract?'source-contract-missing':binding?.error??'current binding unavailable'});continue;}
  const member=inventory.members.find(row=>row.animationId===id);
  assert.equal(contract.source?.sha256,member.source.sha256,'contract exact source hash');
  assert(binding.sourcePins.some(pin=>pin.path===contract.source.path&&pin.bytes===contract.source.bytes&&pin.sha256===contract.source.sha256),
    'contract source is the actual bound placement SWF, not a sorted XML/glossary pin');eligible.push({binding,contract});
 }
 writeNew(root,out+'/inventory.json',inventory);
 if(!eligible.length) {writeNew(root,out+'/run.json',{kind:'g678-course-technical-run-v1',lesson,expectedAnimationIds:inventory.animationIds,requestedAnimationIds:requested,skipped,attempts:[],candidate:null});return {candidate:null,skipped,outputDirectory:out};}
 const local=[inventory.manifest,sourceContracts,collector,collectionConfig],external=[];
 // Configuration names real capture tools, qualification and page parameters; pin their bytes as well.
 for(const pin of retainedPins(config)) {
  const normalized=normalizePin(root,pin);if(normalized.local)local.push(normalized.local);else external.push(normalized.external);
 }
 for(const {binding,contract} of eligible)for(const pin of [...binding.inputPins,...binding.sourcePins,...retainedPins(contract)]) {
  const normalized=normalizePin(root,pin);if(normalized.local)local.push(normalized.local);else external.push(normalized.external);
 }
 const ids=eligible.map(e=>e.contract.animationId);
 const registry=readJsonPin(root,pinFile(root,REGISTRY)),entries=registry.calibrations.flatMap(c=>c.entries).filter(e=>ids.includes(e.key));
 const dispatchEntries=entries.map(e=>({animationId:e.key,modulePath:e.artifacts.module.path}));
 await verifySelectedRegistryModuleImports(root,DISPATCH[0],dispatchEntries);
 await verifySelectedRegistryModuleImports(root,HFR_DISPATCH,entries.filter(e=>e.artifacts.kind==='generated-typescript-hfr-v1').map(e=>({animationId:e.key,modulePath:e.artifacts.module.path})));
 await verifySelectedRegistryModuleImports(root,HFR_CANDIDATE_DISPATCH,entries.filter(e=>e.artifacts.kind==='generated-typescript-hfr-v1').map(e=>({animationId:e.key,modulePath:e.artifacts.module.path}))); 
 const seeds=uniquePins([...local,...SHARED.map(file=>pinFile(root,file)),...selectedAssetRoutes(root,ids).map(file=>pinFile(root,file)),pinFile(root,REGISTRY),...DISPATCH_LEAVES.map(file=>pinFile(root,file))]);
 const expanded=await expandLocalModuleClosure(root,seeds.map(pin=>path.join(root,pin.path)),{stopAt:DISPATCH_LEAVES.map(file=>pinFile(root,file))});
 const files=uniquePins([...seeds,...[...expanded].map(file=>pinFile(root,path.relative(root,file)))]);
 const externalMap=new Map();for(const item of external){const key=path.join(item.root,item.pin.path);const previous=externalMap.get(key);if(previous)assert.deepEqual(previous,item,'same exact external pin');else externalMap.set(key,item);}
 const sources=[...externalMap.values()];
 const inputPins=uniquePins([...files,...sources.map(item=>({...item.pin,path:path.join(item.root,item.pin.path)}))]);
 const boundContracts=eligible.map(({contract})=>({...contract,inputPins}));
 const bound=writeNew(root,out+'/contracts.bound.json',{contracts:boundContracts});
 const candidate={schemaVersion:1,kind:'g678-stable-browser-candidate-v1',validationScope:'selected-current-inputs-technical-v1',root,lesson,frozenAt:new Date().toISOString(),
   expectedAnimationIds:inventory.animationIds,animationIds:ids,requestedAnimationIds:requested,index:null,host:null,historicalAdmission:'not-revalidated',registrySha256:inventory.bindings.registry.pin.sha256,
   sourceContracts,contracts:bound,collector,collectionConfig,files:uniquePins([...files,bound]),external:sources,
   acceptanceEffects:{admission:false,technicalPassed:false,registeredDelta:0,originalRuntime:false,fidelity:false,listening:false,human:false,owner:false,publication:false}};
 verifySelectedTechnicalCandidate(root,candidate);
 const candidatePin=writeNew(root,out+'/candidate.json',candidate);
 writeNew(root,out+'/run.json',{kind:'g678-course-technical-run-v1',lesson,expectedAnimationIds:inventory.animationIds,requestedAnimationIds:requested,candidate:candidatePin,skipped,attempts:[]});
 return {candidate:candidatePin,skipped,outputDirectory:out};
}
export async function loadAssessor(root) {return import(pathToFileURL(path.join(root,ASSESSOR)).href);}
export async function assessTechnicalRun({root,runDirectory}) {
 const out=relativePath(root,runDirectory),run=readJsonPin(root,pinFile(root,out+'/run.json'));
 const inventory=lessonInventory(root,run.lesson);assert.deepEqual(run.expectedAnimationIds,inventory.animationIds,'current source denominator unchanged');
 const {assessCatalog}=await loadAssessor(root);const pages=[];
 if(run.candidate) {
  const candidate=readJsonPin(root,run.candidate);verifySelectedTechnicalCandidate(root,candidate);
  const contracts=readJsonPin(root,candidate.contracts).contracts;
  for(const contract of contracts) {
   const attempt=[...(run.attempts??[])].reverse().find(a=>a.animationId===contract.animationId&&a.raw);
   let raw;
   if(attempt?.raw&&attempt.stableReceipt&&!attempt.error) {
    const stable=readJsonPin(root,attempt.stableReceipt);
    assert.equal(stable.status,'stable-command-passed','accepted attempt has stable collection');
    assert.deepEqual(stable.candidate,run.candidate,'attempt frozen candidate binding');
    assert(stable.animationIds.includes(contract.animationId),'stable run covers exact page');
    raw=readJsonPin(root,attempt.raw);
   }
   pages.push({contract,contractPin:candidate.contracts,raw});
  }
 }
 return assessCatalog({root,expectedAnimationIds:inventory.animationIds,pages});
}
export async function resumeTechnicalPlan({root,runDirectory}) {
 const out=relativePath(root,runDirectory),run=readJsonPin(root,pinFile(root,out+'/run.json'));
 assert(run.candidate,'run has no eligible frozen candidate');const candidate=readJsonPin(root,run.candidate);verifySelectedTechnicalCandidate(root,candidate);
 const assessment=await assessTechnicalRun({root,runDirectory:out});
 const completed=new Set(assessment.results.filter(result=>result.passed).map(result=>result.animationId));
 return {run,candidate,assessment,remaining:candidate.animationIds.filter(id=>!completed.has(id)),reused:[...completed],rule:'Reuse reassessed complete pages only; each incomplete page starts a new complete attempt, with no merged cells or flows.'};
}
