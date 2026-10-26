#!/usr/bin/env node
// New23 local-only wrappers. Never updates the registry, bridge, old377, or sources.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {access,lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {build as esbuild} from 'esbuild';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const RUN_ID='g678-alg-l11-instructional-successor-current-js-v1';
export const RUN_ROOT=`work/g678-shared-page-factory/${RUN_ID}`;
export const FRAGMENT=`catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const PREFIX='g678-alg-l11-instructional-successor';
const IDS=[6,8,9,10,11,14,19,20,21,25,26,27,28,29,30,31,32,33,34,40,41,42,44]
 .map(n=>`shared-alg001-l11-p${String(n).padStart(3,'0')}`);
const A=new Set([6,8,9,10,11,14,19,20,21,25]),SPECIAL=new Set([6,9,10]),D=new Set([33,34,44]);
const OLD_FRAGMENTS=['interactive10-tranche-c','behavior10-tranche-b','advanced3-tranche-d']
 .map(name=>`catalog/product-bridge-calibrations/g678-alg-l11-${name}-current-js-v1.fragment.json`);
const FALSE_EFFECTS=Object.freeze({currentJavaScriptRegistered:false,registrationCandidate:false,productCalibrationPassed:false,
 browserCalibrationPassed:false,engineeringPreviewReady:false,behaviorAccepted:false,authoritativeOriginalRuntime:false,
 visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,
 releaseEligible:false,released:false,published:false});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const descriptor=(file,bytes)=>({path:file,bytes:Buffer.byteLength(bytes),sha256:sha(bytes)});
async function bound(file){
 const absolute=path.isAbsolute(file)?file:path.join(ROOT,file),info=await lstat(absolute);
 assert.ok(info.isFile()&&!info.isSymbolicLink(),`Not regular file: ${file}`);
 const bytes=await readFile(absolute);return {binding:descriptor(file,bytes),bytes,value:file.endsWith('.json')?JSON.parse(bytes):null};
}
function adapter(n){return A.has(n)?'alg-l11-interactive10-tranche-c-maintained-dom':
 D.has(n)?'advanced-manual-alg-l11-tranche-d-maintained-dom':'alg-l11-behavior10-tranche-b-maintained-dom';}
export function outputPaths(id){const suffix=id.slice(-4),base=`${PREFIX}-${suffix}`;
 return {module:`packages/demos/src/modules/${base}.tsx`,timeline:`packages/demos/src/timelines/${base}.ts`,
  data:`packages/demos/src/generated/${PREFIX}-data-${suffix}.ts`,member:`${RUN_ROOT}/members/${id}/member-manifest.json`};}
function relativeImport(from,to){let value=path.relative(path.dirname(from),to).replace(/\.(?:ts|tsx)$/,'');return value.startsWith('.')?value:`./${value}`;}
function dataType(n){if(SPECIAL.has(n))return '{vector:AlgL11ASourceVectorBundle;config:AlgL11ASpecialVisualConfig}';
 if(A.has(n))return '{vector:AlgL11ASourceVectorBundle}';
 return '{vector:AlgL11BVectorBundle;explanations?:AlgL11BExplanationBundle;glossary:AlgL11BSourceGlossaryConfig}';}
function dataImports(n){if(A.has(n))return `import type {AlgL11ASourceVectorBundle} from "../g678-alg-l11-tranche-a-source-vector-stage";\n`+
 (SPECIAL.has(n)?'import type {AlgL11ASpecialVisualConfig} from "../g678-alg-l11-a-special-instructional-visuals";\n':'');
 return 'import type {AlgL11BVectorBundle,AlgL11BExplanationBundle,AlgL11BSourceGlossaryConfig} from "../g678-alg-l11-b-instructional-visuals";\n';}
export function moduleSource(id,paths){const n=Number(id.slice(-3));let body;
 if(D.has(n)){
  const source=n===33?'../g678-alg-l11-p033-instructional-candidate':'../g678-alg-l11-tranche-d-instructional-candidates';
  body=`import {G678_ALG_L11_D_INSTRUCTIONAL_P${id.slice(-3)}_MODULE as candidate} from ${JSON.stringify(source)};\n`;
 }else{
  body=`import {DATA} from ${JSON.stringify(relativeImport(paths.module,paths.data))};\n`;
  if(SPECIAL.has(n))body+='import {createAlgL11ASpecialInstructionalVisualCandidate} from "../g678-alg-l11-a-special-instructional-visuals";\n'+
   'const candidate=createAlgL11ASpecialInstructionalVisualCandidate(DATA.config,DATA.vector).module;\n';
  else if(A.has(n))body+='import {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES,type AlgL11Interactive10ChoicePage} from "../g678-alg-l11-interactive10-tranche-c-core";\n'+
   'import {createAlgL11AChoiceInstructionalModule} from "../g678-alg-l11-a-choice-instructional-visuals";\n'+
   `const config=G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.find(p=>p.animationId===${JSON.stringify(id)});\n`+
   'if(!config||config.sourceContract.kind!=="choice-feedback-practice")throw Error("Source A choice config missing");\n'+
   'const candidate=createAlgL11AChoiceInstructionalModule(config as AlgL11Interactive10ChoicePage,DATA.vector);\n';
  else body+='import {G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES} from "../g678-alg-l11-behavior10-tranche-b-state";\n'+
   'import {createAlgL11BInstructionalVisualCandidate} from "../g678-alg-l11-b-instructional-visuals";\n'+
   `const config=G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.find(p=>p.animationId===${JSON.stringify(id)});\n`+
   'if(!config)throw Error("Source B behavior config missing");\n'+
   'const candidate=createAlgL11BInstructionalVisualCandidate(config,DATA.vector,DATA.explanations,DATA.glossary).module;\n';
 }
 return '"use client";\n// Generated by scripts/build-g678-alg-l11-instructional-successor-current-js.mjs; do not edit.\n'+body+
  `import {SOURCE_TIMELINE} from ${JSON.stringify(relativeImport(paths.module,paths.timeline))};\n`+
  'if(candidate.key!==SOURCE_TIMELINE.animationId||candidate.maturity!=="private-current-js"||SOURCE_TIMELINE.currentJavaScriptRegistered!==false)throw Error("Source visual successor identity drift");\n'+
  'export {SOURCE_TIMELINE};\nexport const CURRENT_JAVASCRIPT_REGISTERED=false as const;\nexport const DOM_RENDERER_IMPLEMENTED=true as const;\nexport default candidate;\n';
}
async function inputsFor(id){const n=Number(id.slice(-3)),files={};
 if(A.has(n)){
  files.vector=`work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v${SPECIAL.has(n)?4:6}/${id}.json`;
  if(SPECIAL.has(n))files.config=`work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2/${id}/interaction-config.json`;
 }else if(!D.has(n)){
  files.vector=`work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v${n>=40?4:3}/${id}/vector-bundle.json`;
  files.glossary=`work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1/${id}.json`;
  if(n>=40)files.explanations=`work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/${id}/explanation-bundle.json`;
 }
 const data={},bindings=[];
 for(const [key,file]of Object.entries(files)){const value=await bound(file);data[key]=value.value;bindings.push(value.binding);}
 return {data,bindings};
}
async function verifyMounted(file){
 const value=await bound(file),e=value.value;
 assert.ok(e&&String(e.status).includes('passed')&&!String(e.status).startsWith('failed'),`Mounted evidence not passed: ${file}`);
 const records=e.records??e.cases;
 assert.ok(Array.isArray(records)&&records.length>0&&records.every(r=>r.status==='passed'),`Incomplete mounted cases: ${file}`);
 assert.ok(e.inputsUnchanged===true||e.inputsUnchanged===undefined&&
  e.artifactType==='d-instructional-mounted-candidate-runtime-qa',`Mounted inputs changed or status unsupported: ${file}`);
 assert.ok(Array.isArray(e.inputs),`Mounted source bindings missing: ${file}`);
 for(const input of e.inputs){assert.deepEqual((await bound(input.path)).binding,input,`Mounted source drift: ${input.path}`);}
 const group={
  'g678-alg-l11-a7-mounted-runtime-qa-v1':{ids:IDS.filter(id=>A.has(Number(id.slice(-3)))&&!SPECIAL.has(Number(id.slice(-3)))),count:9},
  'g678-alg-l11-a-special-mounted-runtime-qa-v1':{ids:IDS.filter(id=>SPECIAL.has(Number(id.slice(-3)))),count:6},
  'g678-alg-l11-b10-mounted-runtime-qa-v1':{ids:IDS.filter(id=>!A.has(Number(id.slice(-3)))&&!D.has(Number(id.slice(-3)))),count:14},
  'd-instructional-mounted-candidate-runtime-qa':{ids:IDS.filter(id=>D.has(Number(id.slice(-3)))),count:30},
 }[e.artifactType];
 assert.ok(group,`Unknown mounted evidence schema: ${e.artifactType}`);
 assert.deepEqual([...new Set(records.map(r=>r.animationId??r.id))].sort(),group.ids.sort());
 assert.equal(records.length,group.count);assert.ok(records.every(r=>(r.errors??[]).length===0&&(r.requests??[]).length===0));
 const artifacts=[];function walk(node){if(!node||typeof node!=='object')return;
  if(typeof node.path==='string'&&Number.isInteger(node.bytes)&&/^[a-f0-9]{64}$/.test(node.sha256??''))artifacts.push(node);
  else for(const value of Object.values(node))walk(value);}
 walk(records);for(const artifact of artifacts)assert.deepEqual((await bound(artifact.path)).binding,artifact,`Mounted artifact drift: ${artifact.path}`);
 return {binding:value.binding,artifactType:e.artifactType};
}
async function compiledMetadata(vfs){
 const entry=IDS.map((id,i)=>`import m${i} from ${JSON.stringify(path.join(ROOT,outputPaths(id).module))};`).join('\n')+
  '\nmodule.exports.metadata=['+IDS.map((id,i)=>`{key:m${i}.key,maturity:m${i}.maturity,movie:m${i}.movie,runtime:m${i}.runtime,`+
   `interactiveStops:m${i}.interactiveStops??[],authoredTimelineControls:m${i}.authoredTimelineControls??[],`+
   `defaultScenarioByFrameDomain:m${i}.defaultScenarioByFrameDomain,scenarios:m${i}.scenarios,`+
   `reducedMotionFrame:m${i}.reducedMotionFrame,lessonHost:m${i}.lessonHost,playbackEndFrameByDomain:m${i}.playbackEndFrameByDomain}`).join(',')+'];\n';
 const result=await esbuild({stdin:{contents:entry,resolveDir:ROOT,loader:'js'},bundle:true,write:false,platform:'node',format:'cjs',
  jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  plugins:[{name:'exclusive-source-visual-vfs',setup(b){
   b.onResolve({filter:/.*/},args=>{const abs=path.isAbsolute(args.path)?args.path:path.resolve(args.resolveDir,args.path);
    const found=[abs,abs+'.ts',abs+'.tsx'].find(p=>vfs.has(p));if(found)return {path:found,namespace:'source-visual-vfs'};});
   b.onLoad({filter:/.*/,namespace:'source-visual-vfs'},args=>({contents:vfs.get(args.path),loader:'tsx',resolveDir:path.dirname(args.path)}));
  }}]});
 const exports={};const context={module:{exports},exports,console};
 new Script(result.outputFiles[0].text,{filename:'source-visual-metadata-audit.cjs'}).runInNewContext(context,{timeout:15000});
 const metadata=JSON.parse(JSON.stringify(context.module.exports.metadata));
 assert.deepEqual(metadata.map(m=>m.key),IDS);assert.ok(metadata.every(m=>m.maturity==='private-current-js'));
 const dependencies=[];
 for(const file of Object.keys(result.metafile.inputs).sort()){
  if(file==='<stdin>'||file.startsWith('source-visual-vfs:'))continue;
  dependencies.push((await bound(path.isAbsolute(file)?file:path.relative(ROOT,path.resolve(ROOT,file)))).binding);
 }
 return {metadata,dependencies,bundledMetadataAudit:{bytes:result.outputFiles[0].contents.length,sha256:sha(result.outputFiles[0].contents)}};
}

export async function generate({mode='plan',mounted=[],receipts=[]}={}){
 assert.ok(['plan','write','check'].includes(mode));
 if(mode==='plan')return {runId:RUN_ID,fragment:FRAGMENT,artifactType:'g678-alg-l11-instructional-successor-current-js-fragment-v1',
  placementIds:IDS,outputs:IDS.map(outputPaths),requiredMountedGroups:['A7','A-special3','B10','D3'],
  generationWriteExecuted:false,registryEntriesWritten:0};
 assert.equal(mounted.length,4,'Provide four final mounted evidence files via repeated --mounted flags');
 assert.ok(receipts.length>=2,'Provide final source successor receipts including B and D via --receipt');
 const verifiedMounted=[];for(const file of mounted)verifiedMounted.push(await verifyMounted(file));
 assert.equal(new Set(verifiedMounted.map(e=>e.artifactType)).size,4,'Mounted evidence groups must be unique');
 const mountedBindings=verifiedMounted.map(e=>e.binding);
 const receiptBindings=[];for(const file of receipts)receiptBindings.push((await bound(file)).binding);
 const old=new Map(),predecessors=[];
 for(const file of OLD_FRAGMENTS){const f=await bound(file);predecessors.push(f.binding);for(const entry of f.value.entries){assert.ok(!old.has(entry.key));old.set(entry.key,entry);}}
 assert.deepEqual([...old.keys()].sort(),[...IDS].sort());
 const outputs=new Map(),vfs=new Map(),selection=[];
 for(const id of IDS){
  const previous=old.get(id),n=Number(id.slice(-3)),paths=outputPaths(id),{data,bindings}=await inputsFor(id);
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot),'Source root required');
  const sourcePath=path.join(sourceRoot,previous.source.path),info=await lstat(sourcePath),bytes=await readFile(sourcePath);
  assert.ok(info.isFile()&&!info.isSymbolicLink()&&(info.mode&0o222)===0,'Source must be preserved read-only');
  assert.equal(bytes.length,previous.source.bytes);assert.equal(sha(bytes),previous.source.sha256);
  if(data.vector){assert.equal(data.vector.animationId,id);assert.equal(data.vector.source.sha256,previous.source.sha256);assert.equal(data.vector.frameCount,previous.mainTimeline.frameCount);}
  const timeline={schemaVersion:1,animationId:id,source:previous.source,mainTimeline:previous.mainTimeline,
   adapterFamily:adapter(n),instructionalInputs:bindings,domRendererImplemented:true,currentJavaScriptImplemented:true,
   currentJavaScriptRegistered:false,productCalibrationPassed:false,browserProductCalibrationPassed:false,acceptanceEffects:FALSE_EFFECTS};
  outputs.set(paths.timeline,'// Generated source binding; do not hand-edit.\nexport const SOURCE_TIMELINE = '+JSON.stringify(timeline,null,2)+' as const;\n');
  if(!D.has(n))outputs.set(paths.data,'// Generated private source-vector/config data; do not hand-edit.\n'+dataImports(n)+
    'export const DATA = '+JSON.stringify(data)+' as unknown as '+dataType(n)+';\n');
  outputs.set(paths.module,moduleSource(id,paths));
  selection.push({id,n,paths,previous,bindings});
 }
 for(const [file,content]of outputs)vfs.set(path.join(ROOT,file),content);
 const compiled=await compiledMetadata(vfs);
 const entries=[];
 for(const s of selection){
  const metadata=compiled.metadata.find(m=>m.key===s.id);
  const domain=metadata.runtime.frameDomains.find(d=>d.id===s.previous.mainTimeline.frameDomain);
  assert.equal(domain.frameCount,s.previous.mainTimeline.frameCount,`${s.id}: source frame domain drift`);
  const runtimeContract={stage:metadata.runtime.stage??metadata.movie.stage,rootFrameCount:metadata.movie.frameCount,
   rootBeginFrame:domain.rootFrame??s.previous.mainTimeline.rootFrame??6,frameDomain:domain.id,frameCount:domain.frameCount,
   fps:domain.fps??metadata.movie.fps,livePlaybackEndFrame:metadata.playbackEndFrameByDomain?.[domain.id]??domain.frameCount,
   scenario:metadata.defaultScenarioByFrameDomain?.[domain.id]??metadata.scenarios?.[0]?.id,language:'fixed-en',seed:'0',
   interactiveStops:metadata.interactiveStops,authoredTimelineControls:metadata.authoredTimelineControls,
   reducedMotionFrame:metadata.reducedMotionFrame,lessonHostCapabilities:metadata.lessonHost?.capabilities??[]};
  assert.ok(runtimeContract.scenario&&runtimeContract.rootFrameCount===10&&runtimeContract.rootBeginFrame===6,
   `${s.id}: source runtime contract incomplete`);
  const timeline=descriptor(s.paths.timeline,outputs.get(s.paths.timeline)),moduleFile=descriptor(s.paths.module,outputs.get(s.paths.module));
  const dataFile=outputs.has(s.paths.data)?descriptor(s.paths.data,outputs.get(s.paths.data)):null;
  const member={schemaVersion:1,artifactType:'g678-alg-l11-instructional-successor-generated-member-v1',runId:RUN_ID,
   animationId:s.id,source:s.previous.source,mainTimeline:s.previous.mainTimeline,adapterFamily:adapter(s.n),
   runtime:metadata.runtime,runtimeContract,interactiveStops:metadata.interactiveStops,authoredTimelineControls:metadata.authoredTimelineControls,
   reducedMotionFrame:metadata.reducedMotionFrame,lessonHost:metadata.lessonHost,playbackEndFrameByDomain:metadata.playbackEndFrameByDomain,
   candidateModuleMaturity:'private-current-js',timeline,moduleFile,privateData:dataFile,instructionalInputs:s.bindings,
   currentJavaScriptImplemented:true,domRendererImplemented:true,registrationCandidate:false,currentJavaScriptRegistered:false,
   productCalibrationPassed:false,browserProductCalibrationPassed:false,wholeLessonEngineeringPreviewReady:false,
   scaleOutAuthorized:false,releaseAuthorized:false,published:false,acceptanceEffects:FALSE_EFFECTS};
  outputs.set(s.paths.member,json(member));
  entries.push({key:s.id,module:`./modules/${path.basename(s.paths.module,'.tsx')}`,maturity:'private-current-js',deploymentScope:'local-only',
   adapterFamily:adapter(s.n),source:s.previous.source,mainTimeline:s.previous.mainTimeline,runtimeContract,timeline,moduleFile,
   memberManifest:descriptor(s.paths.member,outputs.get(s.paths.member)),privateData:dataFile,
   currentJavaScriptImplemented:true,domRendererImplemented:true,registrationCandidate:false,currentJavaScriptRegistered:false,
   productCalibrationPassed:false,browserProductCalibrationPassed:false,wholeLessonEngineeringPreviewReady:false,acceptanceEffects:FALSE_EFFECTS});
 }
 const inventory=[...outputs].sort(([a],[b])=>a.localeCompare(b)).map(([file,content])=>descriptor(file,content));
 const inventoryPath=`${RUN_ROOT}/output-inventory.json`;outputs.set(inventoryPath,json({schemaVersion:1,files:inventory,
  checksumSetSha256:sha(json(inventory)),fileCount:inventory.length,totalBytes:inventory.reduce((n,f)=>n+f.bytes,0)}));
 const runPath=`${RUN_ROOT}/run-manifest.json`,builder=(await bound(path.relative(ROOT,fileURLToPath(import.meta.url)))).binding;
 const run={schemaVersion:1,artifactType:'g678-alg-l11-instructional-successor-compiler-run-v1',runId:RUN_ID,status:'generated-unregistered-local-source-visual-successor',
  builder,predecessorFragments:predecessors,mountedEvidence:mountedBindings,sourceSuccessorReceipts:receiptBindings,
  codeDependencyClosure:compiled.dependencies,bundledMetadataAudit:compiled.bundledMetadataAudit,outputInventory:descriptor(inventoryPath,outputs.get(inventoryPath)),
  exactPlacementCount:23,generatedPlacementCount:23,placementIds:IDS,registryEntriesWritten:0,acceptanceEffects:FALSE_EFFECTS};
 outputs.set(runPath,json(run));
 const fragment={schemaVersion:1,artifactType:'g678-alg-l11-instructional-successor-current-js-fragment-v1',runId:RUN_ID,
  compilerRun:descriptor(runPath,outputs.get(runPath)),deploymentScope:'local-only',exactPlacementCount:23,generatedPlacementCount:23,
  currentJavaScriptImplementedPlacementCount:23,domRendererImplementedCount:23,entries,registryEntriesWritten:0,
  registrationCandidatePlacementCount:0,currentJavaScriptRegisteredCount:0,wholeLessonEngineeringPreviewCount:0,
  productCalibrationPassed:false,browserProductCalibrationPassed:false,scaleOutAuthorized:false,acceptancePassed:false,
  releaseAuthorized:false,published:false,acceptanceEffects:FALSE_EFFECTS};
 outputs.set(FRAGMENT,json(fragment));
 if(mode==='check'){
  for(const [file,content]of outputs)assert.equal(await readFile(path.join(ROOT,file),'utf8'),content,`Generated output drift: ${file}`);
 }else{
  for(const file of outputs.keys()){let exists=false;try{await access(path.join(ROOT,file));exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,`Exclusive output exists: ${file}`);}
  // Publish fragment last; incomplete retained outputs never become authority.
  for(const [file,content]of outputs){await mkdir(path.dirname(path.join(ROOT,file)),{recursive:true});await writeFile(path.join(ROOT,file),content,{flag:'wx',mode:0o444});}
 }
 return {mode,fragment:descriptor(FRAGMENT,outputs.get(FRAGMENT)),compilerRun:descriptor(runPath,outputs.get(runPath)),
  outputs:outputs.size,registered:false,registryEntriesWritten:0,productCalibrationPassed:false};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),mounted=[],receipts=[];let mode='plan';
 for(let i=0;i<args.length;i++){if(args[i]==='--write')mode='write';else if(args[i]==='--check')mode='check';
  else if(args[i]==='--plan')mode='plan';else if(args[i]==='--mounted')mounted.push(args[++i]);else if(args[i]==='--receipt')receipts.push(args[++i]);else throw Error(`Unknown option ${args[i]}`);}
 generate({mode,mounted,receipts}).then(result=>console.log(json(result))).catch(error=>{console.error(error.stack);process.exitCode=1;});
}
