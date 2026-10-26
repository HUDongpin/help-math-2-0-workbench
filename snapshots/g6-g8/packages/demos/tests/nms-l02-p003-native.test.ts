import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P003FrameState,p003FrameAtMilliseconds,P003_STOP_SECONDS} from '../src/nms-l02-p003-timeline-v1';
import {p003TeachingState,p003TextSnapshot} from '../src/nms-l02-p003-text-v1';
import {P003_AUDIO_SOURCE} from '../src/nms-l02-p003-audio-source-v1';
const at=(frame:number)=>p003TeachingState(getNmsL2P003FrameState(frame,{seed:41,lang:'en'}));
test('fruit count, fraction and decimal reveal at the source boundaries',()=>{
 assert.equal(at(1041).summary,'');assert.equal(at(1042).summary,'1');assert.equal(at(1071).summary,'12 pieces total and 6 are bananas');
 assert.equal(at(1093).numerator,'');assert.equal(at(1094).numerator,'6 are bananas');assert.equal(at(1104).denominator,'');assert.equal(at(1105).denominator,'12 pieces of fruit');assert.equal(at(1105).ratio,true);
 for(let f=1111;f<=1147;f++){assert.equal(at(f).half,false);assert.equal(at(f).decimal,false);}
 assert.equal(at(1148).half,true);assert.equal(at(1148).decimal,true);
 assert.deepEqual(at(1152),at(1153));assert.equal(at(1319).decimal,true);
});
test('source emphasis windows target existing values without flicker or duplicate numerals',()=>{
 for(const[start,end,key]of[[1223,1229,'numerator'],[1231,1237,'denominator'],[1249,1254,'half'],[1276,1281,'decimal-whole'],[1283,1291,'decimal-fraction']]as const){
  assert.equal(at(start-1).emphasis,null);for(let f=start;f<=end;f++){assert.equal(at(f).emphasis,key);assert.equal(at(f).numerator,'6 are bananas');assert.equal(at(f).denominator,'12 pieces of fruit');assert.equal(at(f).decimal,true);}assert.equal(at(end+1).emphasis,null);
 }
});
test('terminal source stop and source PCM length agree without looping or truncating',()=>{
 assert.equal(p003FrameAtMilliseconds(0),1);assert.equal(p003FrameAtMilliseconds(P003_STOP_SECONDS*1000),1319);assert.equal(p003FrameAtMilliseconds(999999),1319);
 assert.equal(P003_AUDIO_SOURCE.stopSamples/P003_AUDIO_SOURCE.sampleRate,P003_STOP_SECONDS);assert.equal(P003_AUDIO_SOURCE.stopSamples-(P003_AUDIO_SOURCE.decodedSamples-P003_AUDIO_SOURCE.latencySamples),842);
 for(const t of[-1,NaN,Infinity])assert.throws(()=>p003FrameAtMilliseconds(t));
});
test('Replay and locale preserve deterministic source states and explicit English text',()=>{
 for(const frame of[1,1041,1042,1071,1093,1104,1111,1153,1224,1250,1277,1284,1319]){
  const en=getNmsL2P003FrameState(frame,{seed:41,lang:'en',replay:0}),es=getNmsL2P003FrameState(frame,{seed:99,lang:'es',replay:1});assert.deepEqual(es.nodes,en.nodes);assert.deepEqual(p003TeachingState(es),p003TeachingState(en));assert.equal(p003TextSnapshot(en).status,'ready');assert.equal(p003TextSnapshot(es).status,'ready');
 }
 const reset=at(1);assert.equal(reset.summary,'');assert.equal(reset.numerator,'');assert.equal(reset.ratio,false);assert.equal(reset.half,false);assert.equal(reset.decimal,false);assert.equal(reset.emphasis,null);
 for(const frame of[0,1320,1.2,NaN])assert.throws(()=>getNmsL2P003FrameState(frame,{seed:0,lang:'en'}));
});

test('explicit source zero alpha stays hidden and reset color transforms restore opacity',()=>{
 const alpha=(frame:number,id:number)=>getNmsL2P003FrameState(frame,{seed:0,lang:'en'}).nodes.find(n=>n.characterId===id&&n.domain==='326')!.color[3];
 assert.equal(alpha(1093,284),0);assert.equal(alpha(1094,284),43/256);assert.equal(alpha(1099,284),1);
 assert.equal(alpha(1104,286),0);assert.equal(alpha(1105,286),43/256);assert.equal(alpha(1110,286),1);
 assert.equal(alpha(1111,291),0);assert.equal(alpha(1147,291),0);assert.equal(alpha(1148,291),51/256);assert.equal(alpha(1152,291),1);
});
