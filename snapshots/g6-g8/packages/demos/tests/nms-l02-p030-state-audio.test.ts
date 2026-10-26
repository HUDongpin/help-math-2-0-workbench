import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync}from'node:fs';
import {getNmsL2P030FrameState as state,p030CanOpenTerm,p030FrameAtMilliseconds,p030SourceFrameAtMilliseconds}from'../src/nms-l02-p030-timeline-v1';
import {p030PrepareSourcePcm}from'../src/nms-l02-p030-audio-v1';
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const at=(f:number)=>state(f,{seed:0,lang:'en'});
test('source teaching order resets before five tenths and keeps fraction reveal separate',()=>{
 assert.equal(at(116).teaching.shadedTenths,0);assert.equal(at(117).teaching.shadedTenths,1);
 assert.equal(at(147).teaching.decimalAlpha,0);assert(at(148).teaching.decimalAlpha>0);assert.equal(at(167).teaching.fractionAlpha,0);assert.equal(at(172).teaching.fractionAlpha,1);
 assert.equal(at(187).teaching.shadedTenths,0);
 assert.deepEqual([204,208,212,216,220].map(f=>at(f).teaching.shadedTenths),[1,2,3,4,5]);
 assert.equal(at(244).teaching.decimalAlpha,0);assert.equal(at(245).teaching.example,5);
 assert.deepEqual(Array.from({length:299},(_,i)=>i+1).filter(f=>at(f).teaching.numberBlink),[276,278,280,282,284]);
});
test('source glossary identity and modern clock are independently bounded',()=>{
 assert(!p030CanOpenTerm(at(11),'decimal'));assert(p030CanOpenTerm(at(12),'decimal'));assert(!p030CanOpenTerm(at(299),'place-value'));
 assert.equal(p030FrameAtMilliseconds(299000/12),299);assert.equal(p030SourceFrameAtMilliseconds(299000/12),1);
 assert.throws(()=>at(300));assert.throws(()=>state(1,{seed:0,lang:'en',frameDomain:'sprite-49'}));assert.equal(state(5,{seed:0,lang:'en',frameDomain:'root'}).mainFrame,null);
});
test('complete measured source PCM is preserved byte-for-byte across source gap',()=>{
 const raw=readFileSync(T+'/nms-l02-p030-behavior-source-v1/audio/measured-source-v1/sprite-67/browser-full.f32le');
 const samples=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));const prepared=p030PrepareSourcePcm(samples);
 const expected=readFileSync(T+'/nms-l02-p030-audio-segments-v1/prepared-mono-22050.f32le');assert.deepEqual(Buffer.from(prepared.buffer),expected);
 assert.equal(prepared.length,549413);assert(prepared.subarray(175664,196613).every(x=>x===0));
 const recovered=new Float32Array(508087);recovered.set(prepared.subarray(18375,175664));recovered.set(prepared.subarray(196613,547411),157289);assert.deepEqual(recovered,samples.subarray(1673));
 assert.throws(()=>p030PrepareSourcePcm(samples.subarray(1)));const invalid=samples.slice();invalid[42]=NaN;assert.throws(()=>p030PrepareSourcePcm(invalid));
});
