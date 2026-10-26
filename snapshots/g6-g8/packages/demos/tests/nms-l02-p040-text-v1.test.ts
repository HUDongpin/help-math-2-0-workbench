import test from 'node:test';import assert from 'node:assert/strict';
import{p040TextValues,p040TextSnapshot,P040_TEXT_BINDING}from'../src/nms-l02-p040-text-v1';import{p040ModuleFrame}from'../src/nms-l02-p040-frame-v1';import type{RuntimeContext}from'../src/contract';
const frame=(n:number)=>p040ModuleFrame(n,{frame:n,frameDomain:'sprite-43',lang:'en',seed:0,scenario:'source-explanation'}as RuntimeContext);
test('textvalues respectsource alphaand reveal instead ofplacementalone',()=>{
 assert.equal(p040TextValues(frame(127))['equation-32'].visible,false);assert.equal(p040TextValues(frame(128))['equation-32'].visible,true);
 assert.equal(p040TextValues(frame(380))['equation-41'].visible,false);assert.equal(p040TextValues(frame(425))['equation-42'].visible,false);assert.equal(p040TextValues(frame(440))['equation-42'].visible,true);
 assert.equal(p040TextValues(frame(46)).instruction.visible,false);assert.equal(p040TextValues(frame(102)).instruction.text,'We can express a percent as an equivalent fraction with a denominator of 100.');
 assert(!P040_TEXT_BINDING.blocks.some(b=>['equation-38','equation-39','equation-40'].includes(b.id)));
});
test('all440framesproduceboundreadysnapshots',()=>{for(let n=1;n<=440;n++)assert.equal(p040TextSnapshot(frame(n)).status,'ready');});
