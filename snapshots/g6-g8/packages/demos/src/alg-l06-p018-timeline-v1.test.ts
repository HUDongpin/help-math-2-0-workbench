import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {P018_TIMELINE,p018TimelineState} from './alg-l06-p018-timeline-v1';
test('P018 maintained table binds every exact source button instance and label',()=>{
 const b=fs.readFileSync(new URL('../../../output/alg-l06-p018-source-audit-v1/time-resolved-audit-v2.json',import.meta.url));
 assert.equal(createHash('sha256').update(b).digest('hex'),P018_TIMELINE.sourceAuditSha256);
 const a=JSON.parse(b.toString());
 assert.equal(P018_TIMELINE.sourceSwfSha256,a.source.sha256);
 assert.deepEqual(P018_TIMELINE.glossaryInstances,a.buttons.flatMap((button:any)=>button.instances.map((i:any)=>({key:button.keyAttribute,buttonId:button.characterId,instanceId:i.instanceId,sourceActionSha256:button.actionSha256,sourcePlacementTagSha256:i.sourcePlacementTagSha256,label:i.sourceLabelBinding,availableSpans:i.sourceReadyIntervals.map((x:any)=>[x.firstFrame,x.lastFrame])}))));
});
test('P018 second Evaluate/Function retain separate reveal gates despite first instances remaining ready',()=>{
 const instances=(f:number,key:string)=>p018TimelineState(f).glossaryInstances.filter(x=>x.key===key);
 assert.deepEqual(instances(323,'Evaluate').map(x=>x.available),[true,false]);
 assert.deepEqual(instances(324,'Evaluate').map(x=>x.available),[true,true]);
 assert.deepEqual(instances(332,'Function').map(x=>x.available),[true,false]);
 assert.deepEqual(instances(333,'Function').map(x=>x.available),[true,true]);
 assert(instances(333,'Function')[1].label.textId===27);
 assert.equal(p018TimelineState(42).glossary.Substitute,false);
 assert.equal(p018TimelineState(43).glossary.Substitute,true);
 assert.equal(p018TimelineState(64).glossary['Input variable'],false);
 assert.equal(p018TimelineState(65).glossary['Input variable'],true);
 assert.equal(p018TimelineState(101).glossary.Result,false);
 assert.equal(p018TimelineState(102).glossary.Result,true);
 for(const f of [0,649,1.5,NaN,Infinity])assert.throws(()=>p018TimelineState(f),/P018_FRAME_OUT_OF_RANGE/);
 assert(p018TimelineState(648).glossaryInstances.every(x=>x.available));
});
