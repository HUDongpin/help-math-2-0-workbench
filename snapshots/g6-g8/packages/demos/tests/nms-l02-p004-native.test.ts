import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P004FrameState,p004FrameAtMilliseconds,P004_STOP_SECONDS} from '../src/nms-l02-p004-timeline-v1';
import {p004TeachingState,p004TextSnapshot} from '../src/nms-l02-p004-text-v1';
import {P004_AUDIO_SOURCE as AUDIO} from '../src/nms-l02-p004-audio-source-v1';
import {p004PrepareSourcePcm} from '../src/nms-l02-p004-audio-v1';
const state=(f:number)=>getNmsL2P004FrameState(f,{seed:41,lang:'en'});const at=(f:number)=>p004TeachingState(state(f));
test('source opacity controls word fraction, numeric fraction and first calculator result',()=>{
 assert.equal(at(523).total,'');assert.equal(at(524).total,'5 donkeys');assert.equal(at(543).packs,'');assert.equal(at(544).packs,'3 are carrying packs');
 assert.equal(at(602).wordRatio,false);assert.equal(at(603).wordRatio,true);assert.equal(at(607).fraction,false);assert.equal(at(608).fraction,true);
 assert.equal(at(694).calculator,false);assert.equal(at(695).calculator,true);
 for(const[f,display,key]of[[720,'3','3'],[730,'3','/'],[737,'5','5'],[751,'0.6','=']]as const){assert.equal(at(f).calculatorDisplay,display);assert.equal(at(f).calculatorKey,key);}
 assert.equal(at(751).fractionResult,false);assert.equal(at(752).fractionResult,true);assert.equal(at(813).calculatorDisplay,'');assert.equal(at(823).fraction,false);
});
test('second demonstration keeps the question until the source decimal result is present',()=>{
 assert.equal(at(824).question,false);assert.equal(at(825).question,true);assert.equal(at(825).dividend,'');assert.equal(at(826).dividend,'2');assert.equal(at(826).divisor,'5');
 for(const[f,display,key]of[[847,'2','2'],[856,'2','/'],[863,'5','5'],[895,'0.4','=']]as const){assert.equal(at(f).calculatorDisplay,display);assert.equal(at(f).calculatorKey,key);}
 assert.equal(at(901).answer,false);assert.equal(at(902).answer,true);assert.equal(at(902).question,false);assert.equal(at(903).answer,true);
});
test('decimal movement and final percent have separate source boundaries',()=>{
 assert.equal(at(1066).conversion,false);assert.equal(at(1067).conversion,true);assert(at(1080).decimalProgress<1e-9);assert.equal(at(1080).arrows,1);assert.equal(at(1090).arrows,2);assert(!at(1080).conversionInstruction.includes('two places'));assert(at(1090).conversionInstruction.includes('two places'));assert(at(1110).conversionInstruction.includes('two places'));assert(at(1090).decimalProgress>.6&&at(1090).decimalProgress<.7);
 assert.equal(at(1096).trailingZero,false);assert.equal(at(1097).trailingZero,true);assert.equal(at(1106).leadingZero,true);assert.equal(at(1107).leadingZero,false);assert.equal(at(1137).decimalVisible,true);assert.equal(at(1138).decimalVisible,false);
 for(let f=1067;f<1145;f++){assert.equal(at(f).percent,false);assert.equal(at(f).answer,true);const snapshot=JSON.stringify(p004TextSnapshot(state(f)));assert(!snapshot.includes('= 40%'));}
 assert.equal(at(1145).percent,true);assert.equal(at(1145).conversion,false);assert.equal(at(1152).percent,true);
});
test('segmented PCM retains every post-latency sample exactly once and silent source gaps',()=>{
 const source=Float32Array.from({length:1634112},(_,i)=>(i%997+1)/997);const pcm=p004PrepareSourcePcm(source);assert.equal(pcm.length,2114963);
 const spans=[[1673,93298,185588,277213],[93298,366936,363825,637463],[366936,471474,830550,935088],[471474,1634112,951825,2114463]];
 let cursor=0,copied=0;for(const[a,b,c,d]of spans){assert(pcm.subarray(cursor,c).every(x=>x===0));assert.deepEqual(pcm.subarray(c,d),source.subarray(a,b));copied+=b!-a!;cursor=d!;}assert(pcm.subarray(cursor).every(x=>x===0));assert.equal(copied,1634112-1673);
 assert.throws(()=>p004PrepareSourcePcm(new Float32Array(1)));assert.throws(()=>p004PrepareSourcePcm(new Float32Array(1634112)));source[600]=NaN;assert.throws(()=>p004PrepareSourcePcm(source));
});
test('source stop, Replay, identities and explicit language fallback stay deterministic',()=>{
 assert.equal(P004_STOP_SECONDS,1151/12);assert.equal(AUDIO.stopSeconds,P004_STOP_SECONDS);assert.equal(p004FrameAtMilliseconds(P004_STOP_SECONDS*1000),1152);assert.equal(p004FrameAtMilliseconds(9999999),1152);
 for(const f of[1,102,524,608,720,752,826,895,902,1067,1097,1145,1152]){const en=state(f),es=getNmsL2P004FrameState(f,{seed:19,lang:'es',replay:2});assert.deepEqual(en.nodes,es.nodes);assert.deepEqual(p004TeachingState(en),p004TeachingState(es));assert.equal(p004TextSnapshot(en).status,'ready');assert.equal(p004TextSnapshot(es).status,'ready');}
 assert.equal(at(1).calculator,false);assert.equal(at(1).percent,false);assert.equal(at(1).total,'');
 for(const f of[0,1153,NaN,1.5])assert.throws(()=>state(f));
});
