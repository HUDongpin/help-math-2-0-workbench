import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {readAlgL10PairPacket,readAlgL10PairBinding,extendAlgL10PairDescriptor,ALG_L10_PAIR_IDS,ALG_L10_PAIR_CALIBRATION,ALG_L10_PAIR_FREEZE} from '../apps/web/lib/g678-alg-l10-pair.server.ts';
import {g678PartialCalibrationSnapshot} from '../apps/web/lib/g678-calibration-product-bridge.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
import {selectG678PrivateRuntimeAdapter} from '../apps/web/lib/g678-private-runtime-adapters-v1.ts';
const root=path.resolve(import.meta.dirname,'..'),packet=readAlgL10PairPacket(root),snapshot=g678PartialCalibrationSnapshot();assert.equal(snapshot.status,'ready');
const base=snapshot.descriptors.find(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===10);
const registrations=packet.entries.map(entry=>({maturity:'private-current-js',deploymentScope:'local-only',calibrationId:ALG_L10_PAIR_CALIBRATION,freezeManifestSha256:ALG_L10_PAIR_FREEZE.sha256,moduleSha256:entry.artifacts.module.sha256,timelineSha256:entry.artifacts.timeline.sha256,runtimeSha256:entry.artifacts.runtime.sha256}));
test('both adjacent occurrences join the same source-ordered lesson without altering any other page or acceptance gate',()=>{
 const d=extendAlgL10PairDescriptor(base,packet,registrations);assert.equal(d.pages.length,52);assert.equal(d.productBridge.registeredAnimationCount,base.productBridge.registeredAnimationCount+2);
 assert.equal(d.pages[4].nextPlacementId,ALG_L10_PAIR_IDS[1]);assert.equal(d.pages[5].previousPlacementId,ALG_L10_PAIR_IDS[0]);
 assert.deepEqual(d.pages.slice(4,6).map(p=>p.rendererAvailability.runtimeQuery.frameDomain),['sprite-128','sprite-78']);
 d.pages.forEach((p,i)=>{if(i!==4&&i!==5)assert.deepEqual(p,base.pages[i]);});
 assert.deepEqual(d.productBridge.selectedAnimationIds,d.pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId));
 assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));assert.equal(d.course.courseShellCount,0);
});
test('missing, mixed-candidate and altered registrations reject the whole pair',()=>{
 for(const changed of [registrations.slice(0,1),[registrations[0],undefined],[{...registrations[0],deploymentScope:'bundled'},registrations[1]],
  [registrations[0],{...registrations[1],calibrationId:'other'}],[registrations[0],{...registrations[1],moduleSha256:'0'.repeat(64)}]])assert.throws(()=>extendAlgL10PairDescriptor(base,packet,changed),/ALG_L10_PAIR_INVALID/);
 const changed=structuredClone(base);changed.pages[5].source.assetId='swf-'+'0'.repeat(64);assert.throws(()=>extendAlgL10PairDescriptor(changed,packet,registrations),/exact unavailable source placements/);
});
test('the host dispatches only the matching page adapter and rejects ambiguous bindings',()=>{
 const a={animationId:ALG_L10_PAIR_IDS[0],audioEnabled:true,Component:()=>null},b={animationId:ALG_L10_PAIR_IDS[1],audioEnabled:true,Component:()=>null};
 assert.equal(selectG678PrivateRuntimeAdapter(a.animationId,undefined,[a,b]),a);assert.equal(selectG678PrivateRuntimeAdapter(b.animationId,undefined,[a,b]),b);
 assert.equal(selectG678PrivateRuntimeAdapter('shared-alg001-l10-p007',undefined,[a,b]),undefined);assert.equal(selectG678PrivateRuntimeAdapter(a.animationId,a),a);
 assert.throws(()=>selectG678PrivateRuntimeAdapter(a.animationId,a,[a,b]),/duplicate/);
 assert.throws(()=>selectG678PrivateRuntimeAdapter(a.animationId,undefined,[{...a,animationId:''}]),/empty/);
});
test('changed drawing bytes fail before the paired asset can be served',async()=>{
 const temp=await realpath(await mkdtemp(path.join(os.tmpdir(),'helpmath-paired-binding-')));
 try{const binding=packet.entries[1].artifacts.runtime,p=path.join(temp,binding.path),bytes=await readFile(path.join(root,binding.path));await mkdir(path.dirname(p),{recursive:true});await writeFile(p,bytes);assert(readAlgL10PairBinding(temp,binding).equals(bytes));bytes[100]^=1;await writeFile(p,bytes);assert.throws(()=>readAlgL10PairBinding(temp,binding),/source hash/);}finally{await rm(temp,{recursive:true,force:true});}
});
test('the two exact streams retain distinct source delays and lengths',()=>{
 assert.deepEqual(packet.members.map(m=>[m.audioPlan.frameDomain,m.audioPlan.audioFirstFrame,m.audioPlan.lastFrame]),[['sprite-128',13,1304],['sprite-78',10,1106]]);
 assert.notEqual(packet.members[0].audioPlan.decoder.sourceSha256,packet.members[1].audioPlan.decoder.sourceSha256);
});
test('All Lessons reflects 422 pages and keeps both additions in the same unpublished shared lesson',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((s,c)=>s+c.registeredPageCount,0),422);
 const l=cards.find(c=>c.stableLessonKey==='shared-alg001-l10');assert.equal(l.registeredPageCount,base.productBridge.registeredAnimationCount+2);assert.equal(l.activePageCount,52);assert.equal(l.href,null);assert.equal(l.grade,null);assert.equal(l.mappingStatus,'pending');
});
