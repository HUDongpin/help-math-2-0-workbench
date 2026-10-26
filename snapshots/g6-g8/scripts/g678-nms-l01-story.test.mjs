import assert from 'node:assert/strict';
import test from 'node:test';
import {localOnlyAnimationModuleRegistration} from '../packages/demos/src/local-only-animation-registry-metadata.ts';
import {nmsL1P002Descriptor} from '../apps/web/lib/g678-nms-l01-p002.server.ts';
import {readNmsL1FollowupPacket,extendNmsL1FollowupDescriptor,nmsL1StoryDescriptor,NMS_L1_FOLLOWUP_IDS} from '../apps/web/lib/g678-nms-l01-story.server.ts';
import {allLearningLessons} from '../apps/web/lib/learning-lesson-availability.server.ts';
const base=nmsL1P002Descriptor(),packet=readNmsL1FollowupPacket(),registrations=NMS_L1_FOLLOWUP_IDS.map(id=>localOnlyAnimationModuleRegistration(id));
test('two exact placements extend the validated13-page predecessor without losing the existing football page',()=>{
 const d=nmsL1StoryDescriptor();assert.equal(d.pages.length,47);assert.equal(d.productBridge.registeredAnimationCount,15);assert.equal(d.course.courseShellCount,0);
 assert.deepEqual(d.pages[1],base.pages[1]);assert.deepEqual(d.glossary,base.glossary);assert.equal(d.glossary.length,23);
 for(let i=0;i<47;i++)if(![2,3].includes(i))assert.deepEqual(d.pages[i],base.pages[i]);
 assert.deepEqual(d.pages.slice(1,4).map(p=>p.animationId),['shared-nms002-l01-p002',...NMS_L1_FOLLOWUP_IDS]);
 assert.deepEqual(d.pages.slice(1,4).map(p=>p.rendererAvailability.runtimeQuery.frameDomain),['sprite-722','sprite-82','sprite-302']);
 assert(Object.values(d.productBridge.acceptanceEffects).every(v=>v===false));
});
test('wrong member order, missing registration and changed artifacts fail before partial descriptor mutation',()=>{
 const copy=structuredClone(base);
 for(const regs of [[],registrations.slice(0,1),[...registrations].reverse(),[undefined,registrations[1]],[{...registrations[0],timelineSha256:'0'.repeat(64)},registrations[1]]])assert.throws(()=>extendNmsL1FollowupDescriptor(base,packet,regs));
 assert.deepEqual(base,copy);
 for(const mutate of [b=>{b.calibrationId='unverified';},b=>{b.pages[2].globalPageOrdinal=4;},b=>{b.pages[3].source.assetId='swf-'+'0'.repeat(64);},b=>{b.productBridge.registeredAnimationCount=12;}]){const b=structuredClone(base);mutate(b);assert.throws(()=>extendNmsL1FollowupDescriptor(b,packet,registrations));}
});
test('the corrected marker is explicit and the untouched positive-five tick remains part of the source drawing',()=>{
 assert.equal(packet.members[0].sourceCorrections.length,1);assert.equal(packet.members[0].sourceCorrections[0].sha256,'5c0f3ea1c1553cf3a6512fc4decd6a7d9c632ed0c68f063f4a21599d14327d02');
 assert.equal(packet.members[0].entry.artifacts.timeline.path,'packages/demos/src/timelines/shared-nms002-l01-p003.ts');assert.equal(packet.members[0].entry.key,'shared-nms002-l01-p003');
 assert.equal(packet.members[1].sourceCorrections.length,0);
});
test('All Lessons exposes422 registered shared placements while learner publication and grade mapping stay pending',()=>{
 const cards=allLearningLessons().filter(c=>c.moduleCode);assert.equal(cards.length,44);assert.equal(cards.reduce((n,c)=>n+c.registeredPageCount,0),422);
 const l=cards.find(c=>c.stableLessonKey==='shared-nms002-l01');assert.equal(l.registeredPageCount,46);assert.equal(l.activePageCount,47);assert.equal(l.mappingStatus,'pending');assert.equal(l.grade,null);assert.equal(l.href,null);
});
