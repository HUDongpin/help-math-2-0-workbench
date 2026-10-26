import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {P047_AUDIO_PLANS as plans,P047_MAIN_BOUNDARIES as main} from '../src/generated/nms-l02-p047-audio-plan-v1';
import {P047_FIXED_WINDOWS as fixed,P047_WRONG_WINDOWS as wrong} from '../src/generated/nms-l02-p047-audio-windows-v1';
test('all plans bind complete encoded source and bounded prepared PCM windows',()=>{
 for(const [domain,p]of Object.entries(plans)){const raw=readFileSync(new URL(`../../../migrations/shared-nms002-l02-p047/audit/sprite-${domain}-source-stream-v1.mp3`,import.meta.url));assert.equal(raw.length,p.inputBytes);assert.equal(createHash('sha256').update(raw).digest('hex'),p.inputSha256);assert.equal(p.segments.at(-1)!.sourceEnd,p.decodedSamples);assert.equal(p.segments.at(-1)!.outputEnd,p.totalSamples);}
 for(const w of [...Object.values(fixed),...wrong]){assert(w.start<w.end);assert(w.end<=plans[w.domain].totalSamples);}
 assert.equal(fixed.intro.end,fixed.continuation.start);// 139 and 187 frame intervals land at .5 samples; the generator uses nearest, ties to even.
 assert.equal(main.practiceBoundary,255412);assert.equal(main.terminalBoundary,343612);assert.equal(main.fullEnd-main.terminalBoundary,1220);
});
test('only measured silent wrong tail is omitted; other branches retain their full tails',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/source-feedback-tail-audit-v1.json',import.meta.url),'utf8'));
 const pcm=readFileSync(new URL('../../../migrations/shared-nms002-l02-p047/audit/sprite-80-source-pcm-v1.f32le',import.meta.url));
 const tail=audit.rows.find((r:{domain:string})=>r.domain==='sprite-80').tails[0];for(let i=tail.sourceStart;i<tail.sourceEnd;i++)assert.equal(pcm.readFloatLE(i*4),0);
 assert.equal(wrong[0].end,wrong[0].authoredReturn);for(const w of wrong.slice(1)){assert.equal(w.end,w.fullBranchEnd);assert(w.end>w.authoredReturn);}
 assert.equal(fixed['correct-feedback'].end,plans['78'].totalSamples);
});

test('half-sample frame coordinates use nearest, ties to even across feedback windows',()=>{
 assert.deepEqual(wrong.map(w=>[w.start,w.authoredReturn,w.fullBranchEnd]),[[3675,27562,31238],[31238,47775,55125],[55125,64312,71662],[71662,97388,100608]]);
 assert.equal(fixed['correct-feedback'].start,1838);
});
