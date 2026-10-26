import test from 'node:test';
import assert from 'node:assert/strict';
import {p046IntroFrame} from '../src/nms-l02-p046-intro-v1';
test('all intro frames resolve and practice cannot enter this accessor',()=>{
 for(let frame=1;frame<=653;frame++){const s=p046IntroFrame(frame);assert.equal(s.frame,frame);assert(s.parts>=1&&s.parts<=6);}
 for(const frame of [0,654,NaN,1.5])assert.throws(()=>p046IntroFrame(frame));
});
test('source partition clicks and selection preserve teaching sequence',()=>{
 for(const [frame,count]of [[195,1],[196,2],[198,3],[200,4],[202,5],[204,6],[234,6],[235,5],[653,5]])assert.equal(p046IntroFrame(frame).parts,count);
 assert.deepEqual(p046IntroFrame(297).selected,[]);assert.deepEqual(p046IntroFrame(298).selected,[4]);assert.equal(p046IntroFrame(235).click,'down');
});
test('typed answer and blink remain distinct source events',()=>{
 assert.equal(p046IntroFrame(470).numerator,'');assert.equal(p046IntroFrame(471).numerator,'1');assert.equal(p046IntroFrame(511).denominator,'');assert.equal(p046IntroFrame(512).denominator,'5');
 assert(p046IntroFrame(578).equivalenceEmphasis);assert(!p046IntroFrame(579).equivalenceEmphasis);assert(!p046IntroFrame(593).equivalenceEmphasis);
});
