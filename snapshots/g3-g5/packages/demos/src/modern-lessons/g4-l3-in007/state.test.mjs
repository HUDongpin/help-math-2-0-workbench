import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getNativeState,keywordHostRequest,closeKeywordRequest} from './state.mjs';
const data=JSON.parse(await readFile(new URL('./source.generated.json',import.meta.url))),at=f=>getNativeState(data,f);
assert.equal(data.frameStateIndices.length,555);assert.equal(data.sourceSha256,'91c013434558ec9d6b49df67ae29106073b1a98de19099fdda26ab8d5f2d8d45');
for(let f=1;f<=555;f++){const s=at(f);assert.equal(s.frame,f);for(const a of [...s.axisLabels,...s.movingLabels,...(s.signedFlash?[s.signedFlash]:[])]){if(a.value<0)assert(a.text.startsWith('−'));}for(const n of s.fillTexts.filter(Boolean))assert(n.startsWith('−'));}
for(const f of[104,105,109])assert.equal(at(f).patternPrefix,null);assert.equal(at(110).patternPrefix,'12, 9, 6, 3, 0,');
for(const f of[252,253,256])assert.equal(at(f).axisLabels.length,0);assert.deepEqual(at(257).axisLabels.map(a=>a.value),Array.from({length:25},(_,i)=>i-12));
for(const [placed,positive,full,slot,value] of[[403,404,406,0,'−3'],[459,460,462,1,'−6'],[513,514,517,2,'−9']]){assert.equal(at(placed).source.fills[slot].alpha,0);assert(at(positive).source.fills[slot].alpha>0);assert.equal(at(full-1).fillTexts[slot],null);assert.equal(at(full).fillTexts[slot],value);}
for(const [frame,count,target] of[[285,1,9],[295,2,6],[305,3,3],[315,4,0],[388,5,-3],[434,6,-6],[488,7,-9]]){assert.equal(at(frame).arrow.jumpCount,count);assert.equal(at(frame).arrow.to,target);assert.equal(at(frame).arrow.lastJumpComplete,true);}
for(const [frames,value] of[[[395,397,399,401],-3],[[451,453,455,457],-6],[[506,508,510,512],-9]])for(const f of frames){assert.equal(at(f).signedFlash.value,value);assert.equal(at(f+1).signedFlash,null);}
for(const [key,frame]of[['Pattern',23],['Set',29],['Symbol',57],['Rule',98]]){assert.equal(keywordHostRequest(data,frame-1,key),null);const r=keywordHostRequest(data,frame,key);assert.equal(r.type,'open-keyterm');assert.equal(r.playbackDisposition,'source-stop-timeline-and-audio-until-explicit-resume');}
assert.deepEqual(closeKeywordRequest(),{type:'close-keyterm'});assert.throws(()=>at(556),RangeError);
for(const f of[286,296,306,389,451,506]){assert.equal(at(f).movingLabels.length,1);assert.equal(at(f).movingLabels[0].text,'−3');}
assert.deepEqual(at(555).fillTexts,['−3','−6','−9']);console.log('PASS555states,alpha/mask/sign boundaries,7jumps,3flashes,4minimal-keyterm requests');
