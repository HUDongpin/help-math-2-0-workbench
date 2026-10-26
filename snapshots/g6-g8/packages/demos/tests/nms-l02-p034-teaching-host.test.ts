import test from 'node:test';import assert from 'node:assert/strict';
import {p034Teaching,p034Digits,p034Readable} from '../src/nms-l02-p034-teaching-v1';
import {p034Initial,p034Advance,p034SetValue,P034_ID} from '../src/nms-l02-p034-state-v1';
import {createP034TermHost,p034SourceTerm} from '../src/nms-l02-p034-term-host-v1';
test('source units and fractional digits do not reveal later values',()=>{
 const at=(frame:number)=>p034Advance(p034Initial(),frame-1);
 assert.deepEqual(p034Digits(at(3)),[null,null,null]);assert.deepEqual(p034Digits(at(4)),['0',null,null]);assert.deepEqual(p034Digits(at(99)),['0','0','1']);assert.deepEqual(p034Digits(at(110)),['0','1','2']);assert.deepEqual(p034Digits(at(167)),['0','1','5']);assert.deepEqual(p034Digits(at(394)),['0',null,null]);assert.deepEqual(p034Digits(at(395)),['0','1','5']);assert.deepEqual(p034Digits(p034SetValue(p034Advance(p034Initial(),395),100)),['1','0','0']);
 assert.equal(p034Readable(p034Teaching(at(291)).runs),'');assert.equal(p034Readable(p034Teaching(at(334)).runs),'Use your mouse to click and drag the slider to shade squares in the  ');assert(p034Readable(p034Teaching(at(365)).runs).endsWith('decimal grid to make different decimals. '));
});
test('term host accepts only the exact visible source Decimal request',()=>{
 const host=createP034TermHost(),request={type:'open-keyterm' as const,entryId:'decimal',sourceAnimationId:P034_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};const early=p034Advance(p034Initial(),337),ready=p034Advance(p034Initial(),338);assert.equal(host.dispatch(request,early).status,'blocked');assert.equal(host.dispatch(request,ready).status,'allowed');assert.equal(host.dispatch({type:'close-keyterm'},ready).status,'allowed');assert.equal(host.dispatch({...request,entryId:'hundredth'},ready).status,'blocked');assert.equal(host.dispatch({...request,sourceAnimationId:'shared-nms002-l02-p033'},ready).status,'blocked');assert(p034SourceTerm('decimal')?.definitions.es);assert.equal(p034SourceTerm('__proto__'),undefined);
});
