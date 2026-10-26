import test from 'node:test';
import assert from 'node:assert/strict';
import {P047_INTRO_RANGES} from '../src/generated/nms-l02-p047-intro-state-v1';
import {p047IntroState} from '../src/nms-l02-p047-intro-v1';
test('all140 source frames are covered exactly once and only140 enables practice',()=>{
 for(let frame=1;frame<=140;frame++){assert.equal(P047_INTRO_RANGES.filter(r=>r.firstFrame<=frame&&frame<=r.lastFrame).length,1);assert.equal(p047IntroState(frame).interactive,frame===140);}
 for(const frame of [0,141,2.5,NaN,Infinity])assert.throws(()=>p047IntroState(frame),/FRAME/);
});
test('number line changes at54, worked fraction moves57–64 and persists at practice',()=>{
 const line=(frame:number)=>p047IntroState(frame).geometry.filter(x=>x.role.endsWith('number-line')).map(x=>x.characterId);
 assert.deepEqual(line(53),[18]);assert.deepEqual(line(54),[53]);
 const fraction=(frame:number)=>p047IntroState(frame).texts.find(x=>x.characterId===40)!;
 assert.notDeepEqual(fraction(57).matrix,fraction(64).matrix);assert.deepEqual(fraction(64).matrix,fraction(140).matrix);
 assert.equal(p047IntroState(117).geometry.some(x=>x.characterId===54),true);assert.equal(p047IntroState(118).geometry.some(x=>x.characterId===54),false);
});
