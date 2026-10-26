import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {P046_FIXED_WINDOWS,p046WrongWindow,p046WindowPcm} from '../src/nms-l02-p046-audio-windows-v1';
import {P046_AUDIO_PLANS} from '../src/generated/nms-l02-p046-audio-plan-v1';
import {p046PrepareSourcePcm} from '../src/nms-l02-p046-audio-pcm-v1';
test('main windows preserve continuation and stop before silent terminal tail',()=>{
 const a=P046_FIXED_WINDOWS.intro,b=P046_FIXED_WINDOWS.continuation;assert.equal(a.end,b.start);assert.equal(b.end-b.start,95550);assert.equal(P046_AUDIO_PLANS['205'].totalSamples-b.end,1303);
 const raw=readFileSync(new URL('../../../migrations/shared-nms002-l02-p046/audit/sprite-205-whole-pcm-v1.f32le',import.meta.url));const prepared=p046PrepareSourcePcm('205',new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)));
 assert(p046WindowPcm(prepared,b).some(x=>Math.abs(x)>.1));assert(prepared.subarray(b.end).every(x=>x===0));
});
test('wrong branch windows keep adjacent labels exclusive',()=>{
 const windows=[0,1,2,3].map(p046WrongWindow),pcm=new Float32Array(P046_AUDIO_PLANS['167'].totalSamples);
 for(let i=0;i<4;i++){if(i<3)assert.equal(windows[i].end,windows[i+1].start);pcm.fill(i+1,windows[i].start,windows[i].end);}
 for(let i=0;i<4;i++)assert(p046WindowPcm(pcm,windows[i]).every(x=>x===i+1));assert.throws(()=>p046WrongWindow(4));
});
test('timeline one-frame click and full button clicks remain explicit separate windows',()=>{
 assert.equal(P046_FIXED_WINDOWS['timeline-click'].end,1838);assert.equal(P046_FIXED_WINDOWS.click.end,8805);
 assert.equal(P046_FIXED_WINDOWS['click-184'].domain,'184');assert.equal(P046_FIXED_WINDOWS['click-197'].domain,'197');
 for(const window of Object.values(P046_FIXED_WINDOWS))assert(window.end<=P046_AUDIO_PLANS[window.domain].totalSamples);
 assert.throws(()=>p046WindowPcm(new Float32Array(10),P046_FIXED_WINDOWS.click));
});
