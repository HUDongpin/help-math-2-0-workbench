import test from 'node:test';
import assert from 'node:assert/strict';
import {P046_INTRO_CLICK_FRAMES,p046IntroClickBetween} from '../src/nms-l02-p046-click-events-v1';
test('timeline clicks trigger once on their source frame and skip expired events',()=>{
 for(const frame of P046_INTRO_CLICK_FRAMES){assert.equal(p046IntroClickBetween(frame-1,frame),frame);assert.equal(p046IntroClickBetween(frame,frame),null);assert.equal(p046IntroClickBetween(frame-1,frame+1),null);}
 assert.equal(p046IntroClickBetween(1,205),null);assert.equal(p046IntroClickBetween(1,204),204);assert.throws(()=>p046IntroClickBetween(200,196));
});
