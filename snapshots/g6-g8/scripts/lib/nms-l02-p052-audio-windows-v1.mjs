import assert from 'node:assert/strict';
import {p052FrameSample} from './nms-l02-p052-audio-plan-v1.mjs';

/** Explicit native cue contract; source return frames remain separately recorded. */
export function buildP052AudioWindows(plans){
 const byId=new Map(plans.map(p=>[p.domain,p]));
 assert.equal(byId.size,6);assert.equal(plans.length,6);
 const lengths={'sprite-8':8805,'sprite-318':8805,'sprite-327':8805,'sprite-347':36562,'sprite-349':100608,'sprite-350':285666};
 for(const [id,length]of Object.entries(lengths))assert.equal(byId.get(id)?.totalSamples,length,`Unexpected source plan ${id}`);
 const windows=[];
 function add(id,domain,start,end,visualStart,visualEnd,sourceReturnFrame=null){
  assert.ok(Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&end>start&&end<=lengths[domain]);
  windows.push({id,domain,startSample:start,endSample:end,samples:end-start,sampleRate:22050,visualStart,visualEnd,sourceReturnFrame});
 }
 // Pause exactly once at the exercise stop. Resume the unplayed suffix, not a new seek.
 const seam=p052FrameSample(115);
 add('intro','sprite-350',0,seam,1,115);
 add('outro','sprite-350',seam,lengths['sprite-350'],116,156);
 add('correct','sprite-347',p052FrameSample(2),lengths['sprite-347'],2,20,20);
 const branches=[['S1',3,16,18],['S2',18,27,31],['S3',31,36,40],['S4',40,54,null]];
 for(const [label,start,callback,next]of branches)add(`wrong-${label}`,'sprite-349',p052FrameSample(start),next?p052FrameSample(next):lengths['sprite-349'],start,callback,callback);
 for(const [id,domain]of [['click','sprite-8'],['wrong-close-click','sprite-318'],['right-close-click','sprite-327']])add(id,domain,0,lengths[domain],1,5,5);
 return windows;
}

/** Seeded selection is a modern reproducibility adaptation to source random(4). */
export function p052WrongBranch(seed,attempt){
 assert.ok(Number.isSafeInteger(seed)&&seed>=0&&seed<=0xffffffff);
 assert.ok(Number.isSafeInteger(attempt)&&attempt>=0&&attempt<=0xffffffff);
 let x=(seed^Math.imul(attempt+1,0x9e3779b9))>>>0;
 x^=x<<13;x^=x>>>17;x^=x<<5;
 return `wrong-S${(x>>>0)%4+1}`;
}

/** Resume is a PCM offset within one frozen cue; never split encoded MP3 bytes. */
export function p052WindowResume(window,playedSamples){
 assert.ok(Number.isSafeInteger(window.startSample)&&Number.isSafeInteger(window.endSample));
 assert.ok(window.startSample>=0&&window.endSample>window.startSample);
 assert.ok(Number.isSafeInteger(playedSamples)&&playedSamples>=0);
 const cursor=Math.min(window.endSample,window.startSample+playedSamples);
 return {startSample:cursor,endSample:window.endSample,remainingSamples:window.endSample-cursor,ended:cursor===window.endSample};
}
