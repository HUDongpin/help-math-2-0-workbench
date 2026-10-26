import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {checkG678LessonTypography} from './check-g678-lesson-typography-v1.mjs';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t){
  const root=await mkdtemp(path.join(os.tmpdir(),'g678-typography-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const put=async(relative,value)=>{await mkdir(path.dirname(path.join(root,relative)),{recursive:true});const bytes=typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value);await writeFile(path.join(root,relative),bytes);return{path:relative,sha256:hash(bytes)};};
  const bits=('00110'+'000000'+'010100'+'000000'+'010100').padEnd(32,'0');
  const rect=Buffer.from(Array.from({length:4},(_,i)=>parseInt(bits.slice(i*8,i*8+8),2)));
  const raw=Buffer.concat([Buffer.from([70,87,83,8,20,0,0,0]),rect,Buffer.from([0,12,1,0,64,0,0,0])]);
  const sourceSha=hash(raw);
  await put('sources/G6-G8-shared/NMS002/L1/IR/L1IR01.swf',raw);
  const sourceRoot=await realpath(path.join(root,'sources'));
  const members=Array.from({length:2282},(_,i)=>({animationId:`shared-nms002-fixture-${i}`,placementId:`shared-nms002-fixture-${i}`,source:{sha256:sourceSha}}));
  await put('catalog/g678-page-only-release-manifest.v1.json',{releases:[{members}]});
  const shared=await put('packages/demos/src/shared-fixture.ts','// typography fixture, no production admission');
  const old=await put('packages/demos/src/modules/old.ts','// existing module fixture');
  const registry={calibrations:[{entries:[{key:members[0].animationId,artifacts:{module:old}}]}]};
  const baseline={schemaVersion:1,kind:'g678-lesson-typography-integration-v1',sharedFiles:[shared],baselineEntries:[{key:members[0].animationId,modulePath:old.path,moduleSha256:old.sha256}]};
  await put('catalog/typography-v1/g678-integration.json',baseline);
  const saveRegistry=()=>put('packages/demos/private-current-js-registry.json',registry);
  await saveRegistry();
  return{root,sourceRoot,raw,sourceSha,members,shared,registry,put,saveRegistry,run:()=>checkG678LessonTypography({root,sourceRoot})};
}
test('existing G678 registration remains a separate unassessed backlog, and shared byte drift blocks the development check',async t=>{
  const f=await fixture(t),result=await f.run();assert.equal(result.passed,true);assert.equal(result.existingTypographyBacklog,1);
  assert.equal(result.changedOrNewPages,0);assert.equal(result.humanReviewPassed,0);assert.equal(result.strictCompletionEffect,'none');
  await f.put(f.shared.path,'changed shared typography');assert.equal((await f.run()).passed,false);
});
test('new G678 modules require actual source bytes and hash-bound complete typography evidence',async t=>{
  const f=await fixture(t),member=f.members[1];const module=await f.put('packages/demos/src/modules/new.ts','// new module fixture');
  f.registry.calibrations[0].entries.push({key:member.animationId,artifacts:{module}});await f.saveRegistry();
  let result=await f.run();assert.equal(result.passed,false);assert.equal(result.changedOrNewPages,1);
  const binding={schemaVersion:1,placementId:member.placementId,animationId:member.animationId,sourceSwfSha256:f.sourceSha,
    sourceRelativePath:'G6-G8-shared/NMS002/L1/IR/L1IR01.swf',sourceCatalogContentSha256:hash(JSON.stringify(collectSwfTextSourceCatalog(f.raw))),
    blocks:[],textDisposition:'no-required-teaching-text',unresolved:[],implementation:{files:[f.shared,module]}};
  const bindingRef=await f.put(`catalog/typography-v1/g678-page-bindings/${member.placementId}.json`,binding);
  const evidence=await f.put('work/fixture-evidence.json',{fixtureOnly:true});
  const record={kind:'g678-lesson-typography-check-v1',placementId:member.placementId,bindingSha256:bindingRef.sha256,sourceSwfSha256:f.sourceSha,
    checkedAt:'2026-09-01T00:00:00Z',resolvedSourceRisks:[],languagePolicy:{en:'source',es:'source-fallback'},
    artifacts:[evidence],checks:Object.fromEntries(['sourceBinding','semanticText','mathSemantics','timingAndReplay','teachingTextDisposition','hostIntegration','responsiveTypography','accessibility','bilingualPolicy','performance','lifecycle','resourceStability'].map(key=>[key,'passed']))};
  await f.put(`catalog/typography-v1/g678-checks/${member.placementId}.json`,record);
  result=await f.run();assert.equal(result.passed,true);assert.equal(result.checkedNewOrChangedPages,1);assert.equal(result.humanReviewPassed,0);
  await f.put('sources/G6-G8-shared/NMS002/L1/IR/L1IR01.swf',Buffer.concat([f.raw,Buffer.from([0])]));
  assert.equal((await f.run()).passed,false);
});
