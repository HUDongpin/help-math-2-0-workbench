import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lstat,mkdir,mkdtemp,readFile,readdir,realpath,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {descriptor,SOURCE_IDS} from './build-g678-alg-l11-instructional-host-score-successor.mjs';
import {ROOT,PREDECESSOR,PAGES,RUN_ROOT,FRAGMENT,OUTPUT_PATHS,pagePaths,moduleSource,timelineSource,instantiateModules,runtimeContract,compose,publishOutputs,generate}
  from './build-g678-alg-l11-two-page-companion-successor.mjs';
const read=p=>JSON.parse(readFileSync(path.join(ROOT,p)));
const previous=()=>read(PREDECESSOR.path);
function fixture(){const predecessor=previous();return{predecessor,replacements:PAGES.map(page=>{
  const old=predecessor.entries.find(e=>e.key===page.id),paths=pagePaths(page);return{...structuredClone(old),
    module:'./modules/'+path.basename(paths.module,'.tsx'),moduleFile:descriptor(paths.module,moduleSource(page)),timeline:descriptor(paths.timeline,timelineSource(page,old)),
    memberManifest:descriptor(paths.member,'{"fixture":true}\n'),proposedPresentation:{pageInteractionCompanionTargetIdSuffix:page.proposedCompanionSuffix,descriptorActivated:false}};
}),companionCompilerRun:descriptor(`${RUN_ROOT}/run-manifest.json`,'{"fixture":true}\n')};}
test('two-page composition preserves21 entries byte-equivalently and only proposes exact companion slots',()=>{
  const input=fixture(),before=structuredClone(input),result=compose(input);assert.deepEqual(input,before);assert.deepEqual(result.entries.map(e=>e.key),SOURCE_IDS);
  assert.deepEqual(result.entries.filter(e=>!PAGES.some(p=>p.id===e.key)),input.predecessor.entries.filter(e=>!PAGES.some(p=>p.id===e.key)));
  assert.equal(result.changedPlacementCount,2);assert.equal(result.newlyGeneratedPlacementCount,2);assert.equal(result.inheritedPlacementCount,21);
  assert.equal(result.newlyGeneratedVisualPayloadCount,0);assert.equal(result.registryEntriesWritten,0);assert.equal(result.candidateRegistrationQaPassed,false);
  assert.deepEqual(result.dualPredecessorFragment,PREDECESSOR);assert.deepEqual(result.companionCompilerRun,input.companionCompilerRun);
  assert.deepEqual(result.proposedCompanionDescriptors.map(d=>d.pageInteractionCompanionTargetIdSuffix),['alg-l11-p034-math-companion','alg-l11-p044-math-companion']);
  assert.ok(result.proposedCompanionDescriptors.every(d=>d.activated===false));assert.ok(Object.values(result.acceptanceEffects).every(v=>v===false));
  for(const page of PAGES)assert.deepEqual(result.entries.find(e=>e.key===page.id).runtimeContract,input.predecessor.entries.find(e=>e.key===page.id).runtimeContract);
});
test('composition rejects predecessor drift, extra source/capability/acceptance changes and descriptor activation',()=>{
  const mutations=[f=>f.predecessor.entries.reverse(),f=>{f.predecessor.productCalibrationPassed=true;},f=>{f.predecessor.entries[0].source.sha256='0'.repeat(64);},
    f=>{f.replacements[0].runtimeContract.frameCount++;},f=>{f.replacements[1].runtimeContract.lessonHostCapabilities.push('audio');},
    f=>{f.replacements[0].source.path='other.swf';},f=>{f.replacements[1].currentJavaScriptRegistered=true;},
    f=>{f.replacements[0].proposedPresentation.descriptorActivated=true;},f=>{f.replacements[1].proposedPresentation.pageInteractionCompanionTargetIdSuffix='unknown';},
    f=>{f.replacements[0].moduleFile.path='packages/demos/src/modules/old.tsx';},f=>{f.companionCompilerRun.path='work/old/run.json';},f=>f.replacements.reverse()];
  for(const mutate of mutations){const f=fixture();mutate(f);assert.throws(()=>compose(f));}
});
test('real VFS modules preserve exact source runtime metadata and unchanged practice/FQ capabilities',async()=>{
  const old=previous(),vfs=new Map();for(const page of PAGES){const paths=pagePaths(page),entry=old.entries.find(e=>e.key===page.id);
    vfs.set(path.join(ROOT,paths.module),moduleSource(page));vfs.set(path.join(ROOT,paths.timeline),timelineSource(page,entry));}
  const compiled=await instantiateModules(vfs);assert.equal(compiled.metadata.length,2);
  for(let i=0;i<2;i++){const page=PAGES[i],entry=old.entries.find(e=>e.key===page.id),metadata=compiled.metadata[i];
    assert.deepEqual(runtimeContract(metadata,entry),entry.runtimeContract);assert.deepEqual(metadata.lessonHost.capabilities,[page.capability]);
    assert.ok(compiled.dependencies.some(d=>d.path===page.candidate));assert.deepEqual(metadata.interactiveAudioAssets,[]);
    const bad=structuredClone(metadata);bad.reducedMotionFrame=1;assert.throws(()=>runtimeContract(bad,entry));
  }
  assert.ok(compiled.dependencies.some(d=>d.path==='packages/demos/src/generated/g678-alg-l11-p034-learner-math-v1.ts'));
  assert.ok(compiled.dependencies.some(d=>d.path==='packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts'));
});
test('plan only lists9 small new outputs with no visual copies or activation',async()=>{
  const plan=await generate({mode:'plan'});assert.deepEqual(plan.placementIds,PAGES.map(p=>p.id));assert.equal(plan.outputPaths.length,9);
  assert.equal(plan.registryEntriesWritten,0);assert.equal(plan.newlyGeneratedVisualPayloadCount,0);
  assert.ok(plan.outputPaths.every(p=>!p.includes('/generated/')&&!/registry|descriptor|globals\.css/.test(p)));
  for(const page of PAGES){assert.doesNotMatch(moduleSource(page),/<svg|data:image|https?:\/\/|\.mp3/);const manifest=read(page.manifest.path);
    assert.equal(manifest.validation.unitTestsPassed,7);assert.equal(manifest.validation.mountedRecordsPassed,page.mountedRecords);assert.ok(Object.values(manifest.gates).every(v=>v===false));}
});
async function temporary(t){const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'helpmath-two-companion-test-')));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
const outputs=()=>new Map(OUTPUT_PATHS.map(p=>[p,`Test fixture ${p}\n`]));
async function snapshot(root,prefix=''){const rows=[];for(const entry of await readdir(path.join(root,prefix),{withFileTypes:true})){
  const p=path.join(prefix,entry.name);if(entry.isDirectory())rows.push(...await snapshot(root,p));else{const s=await lstat(path.join(root,p),{bigint:true});
    rows.push({...descriptor(p,await readFile(path.join(root,p))),ino:String(s.ino),mode:String(s.mode),mtimeNs:String(s.mtimeNs)});}}
  return rows.sort((a,b)=>a.path.localeCompare(b.path));}
test('publisher creates only9 readonly outputs; repeated check is write-free and overwrite is refused',async t=>{
  const root=await temporary(t),content=outputs();await publishOutputs({root,outputs:content});const before=await snapshot(root);assert.equal(before.length,9);
  assert.ok(before.every(f=>(Number(f.mode)&0o222)===0));await publishOutputs({root,outputs:content,check:true});await publishOutputs({root,outputs:content,check:true});
  assert.deepEqual(await snapshot(root),before);await assert.rejects(publishOutputs({root,outputs:content}),/Exclusive output exists/);assert.deepEqual(await snapshot(root),before);
});
test('publisher preflights every path, refuses frozen/current writes and requires fragment last',async t=>{
  const root=await temporary(t),content=outputs();for(const p of['packages/demos/private-current-js-registry.json',PREDECESSOR.path,'apps/web/app/globals.css']){
    const bad=new Map(content);bad.set(p,'{}');await assert.rejects(publishOutputs({root,outputs:bad}),/nine exact new outputs/);}
  await assert.rejects(publishOutputs({root,outputs:new Map([...content].reverse())}),/authority must be last/);assert.deepEqual(await readdir(root),[]);
  await mkdir(path.dirname(path.join(root,FRAGMENT)),{recursive:true});await writeFile(path.join(root,FRAGMENT),'existing authority\n',{flag:'wx'});
  const before=await snapshot(root);await assert.rejects(publishOutputs({root,outputs:content}),/Exclusive output exists/);assert.deepEqual(await snapshot(root),before);
});
test('check rejects drift without changing previously published artifacts',async t=>{
  const root=await temporary(t),content=outputs();await publishOutputs({root,outputs:content});const before=await snapshot(root),changed=new Map(content);
  changed.set(pagePaths(PAGES[0]).module,'// mismatch\n');await assert.rejects(publishOutputs({root,outputs:changed,check:true}),/Generated output drift/);assert.deepEqual(await snapshot(root),before);
});
