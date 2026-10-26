import assert from 'node:assert/strict';
import test from 'node:test';
import {p010Initial,p010Advance,p010Answer,p010CloseFeedback,p010WrongExplanation} from '../src/nms-l02-p010-timeline-v1';
import {p010ModuleFrame} from '../src/nms-l02-p010-frame-v1';
import {p010TextSnapshot} from '../src/nms-l02-p010-text-v1';
test('decimal point is the sole correct source target; wrong close completes before retry',()=>{
 const domains=new Set<string>();for(let seed=0;seed<4;seed++)for(let answer=0;answer<8;answer++){
 const held=p010Advance(p010Initial(seed),30),feedback=p010Answer(held,answer);assert.equal(feedback.outcome,answer===5?'right':'wrong');domains.add(feedback.domain);
 assert.equal(p010Answer(feedback,5),feedback);
 if(answer===5){assert.equal(p010Advance(feedback,100).mainFrame,67);assert.equal(p010Advance(feedback,100).phase,'completed');}
 else{const waiting=p010Advance(feedback,100);assert.equal(waiting.phase,'wrong-wait');assert.equal(p010CloseFeedback(feedback),feedback);const closing=p010CloseFeedback(waiting);assert.equal(closing.phase,'wrong-out');assert.equal(p010Answer(closing,5),closing);assert.equal(p010Advance(closing,100).phase,'question');}
 }assert.equal(domains.size,7);assert.match(p010WrongExplanation(3),/used between/);assert.match(p010WrongExplanation(4),/used between/);for(const i of[0,1,2,6,7])assert.match(p010WrongExplanation(i),/written between/);
});
test('frame-domain identity is exact and eight ordered character instances survive native text binding',()=>{
 for(const domain of ['sprite-root','176','__proto__','sprite-999'])assert.throws(()=>p010ModuleFrame(1,{frame:1,frameDomain:domain,scenario:'source-question',lang:'en',seed:0}));
 const state=p010ModuleFrame(31,{frame:31,frameDomain:'sprite-176',rootFrame:6,scenario:'source-question',lang:'en',seed:0});
 assert.equal(p010TextSnapshot(state).blocks.filter(b=>b.role==='answer'&&b.visible).map(b=>b.text).join(''),'1,998.75');
 assert.equal(new Set(p010TextSnapshot(state).suppressedInstances.map(i=>i.id)).size,p010TextSnapshot(state).suppressedInstances.length);
 assert.throws(()=>p010ModuleFrame(31,{frame:31,rootFrame:7,scenario:'source-question',lang:'en',seed:0}));
});

test('standalone oval helper has no teaching text, while its separate title helper contains Correct',()=>{
 for(const [domain,visible]of [['sprite-133',false],['sprite-140',true]]as const){const s=p010ModuleFrame(1,{frame:1,frameDomain:domain,scenario:'source-question',lang:'en',seed:0}),b=p010TextSnapshot(s).blocks.find(b=>b.id==='feedback-title')!;assert.equal(b.visible,visible);if(visible)assert.equal(b.text,'Correct!');}
});
