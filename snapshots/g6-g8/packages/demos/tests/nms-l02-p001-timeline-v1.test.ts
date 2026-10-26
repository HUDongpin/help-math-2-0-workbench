import assert from 'node:assert/strict';import {test} from 'node:test';
import {NMS_L02_P001_IR as IR} from '../src/generated/nms-l02-p001-source-ir-v1';
import {getNmsL2P001FrameState,p001FrameAtMilliseconds} from '../src/nms-l02-p001-timeline-v1';
import {p001TextSnapshot} from '../src/nms-l02-p001-text-v1';
test('136 source frames retain source identity, complete native math and immutable transforms',()=>{
 assert.equal(IR.frames.length,136);assert.equal(IR.texts.length,15);assert.equal(IR.shapes.length,8);assert.ok(Object.isFrozen(IR.frames[0]![0]!.matrix));
 for(let frame=1;frame<=136;frame++){const en=getNmsL2P001FrameState(frame,{seed:0,lang:'en'}),es=getNmsL2P001FrameState(frame,{seed:17,replay:2,lang:'es'});assert.deepEqual(en.nodes,es.nodes);assert.equal(en.rootFrame,6);assert.equal(en.mainFrame,frame);for(const state of [en,es]){const snapshot=p001TextSnapshot(state);assert.equal(snapshot.status,'ready');const visible=snapshot.blocks.filter(b=>b.visible);if(state.visibleTextIds.includes(109))assert.ok(visible.some(b=>b.text==='3, 3.0, 3.0 × 10², π, √2'));if(state.visibleTextIds.includes(87)){assert.ok([88,89,91,93].every(id=>state.visibleTextIds.includes(id)));assert.ok(visible.some(b=>b.text==='1/2, 1/5, 1 2/3'));}}}
 const first=getNmsL2P001FrameState(1,{seed:0,lang:'en'}).nodes.find(n=>n.characterId===96)!;
 // Independent FFDec place(text96) values composed with root translation8248/20,5666/20.
 assert.equal(first.matrix[0],.8619842529296875);assert.equal(first.matrix[1],-.459625244140625);assert.equal(first.matrix[2],.45965576171875);assert.ok(Math.abs(first.matrix[4]-80.95)<1e-9);assert.ok(Math.abs(first.matrix[5]-137.55)<1e-9);
});
test('pre-entry root, standalone loop and explicit host hold remain distinct',()=>{
 for(let frame=1;frame<=5;frame++){const s=getNmsL2P001FrameState(frame,{frameDomain:'root',seed:0,lang:'en'});assert.equal(s.nodes.length,0);assert.equal(p001TextSnapshot(s).blocks.filter(b=>b.visible).length,0);}
 assert.equal(p001FrameAtMilliseconds(0),1);const duration=136*1000/12;assert.equal(p001FrameAtMilliseconds(duration-.001),136);assert.equal(p001FrameAtMilliseconds(duration+.001),1);assert.equal(p001FrameAtMilliseconds(duration+.001,'hold'),136);
 for(const frame of [0,137,1.5,NaN])assert.throws(()=>getNmsL2P001FrameState(frame,{seed:0,lang:'en'}));for(const ms of [-1,Infinity,NaN])assert.throws(()=>p001FrameAtMilliseconds(ms));
 assert.throws(()=>getNmsL2P001FrameState(1,{frameDomain:'sprite-112',seed:0,lang:'en'}));
 assert.equal(IR.texts.find(t=>t.characterId===109)!.glyphs.filter(g=>g.fontId===108)[0]!.text,'π');
});
