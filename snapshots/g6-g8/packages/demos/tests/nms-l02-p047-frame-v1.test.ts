import test from 'node:test';
import assert from 'node:assert/strict';
import {p047ModuleFrame} from '../src/nms-l02-p047-frame-v1';
import type {RuntimeContext} from '../src/contract';
const query=(frame:number,scenario='source-inspection',frameDomain='sprite-81')=>p047ModuleFrame(frame,{frame,scenario,frameDomain,lang:'en',seed:0}as RuntimeContext);
test('source query preserves entry140 and does not invent completion beyond authored stop',()=>{
 assert.equal(query(5,'source-inspection','root').mainFrame,null);assert.equal(query(6,'source-inspection','root').mainFrame,1);assert.equal(query(139).state.phase,'intro');assert.equal(query(140).state.phase,'ready');assert.equal(query(188).state.phase,'ready');assert.equal(query(188).postStopInspection,true);
});
test('inspection recipes show source-domain help, feedback and completed four-card sequence',()=>{
 assert.equal(query(1,'help-example','sprite-35').state.helpOpen,true);assert.equal(query(2,'first-wrong','sprite-80').state.phase,'wrong-feedback');assert.equal(query(2,'first-correct','sprite-78').state.matched.length,1);assert.equal(query(2,'celebration','sprite-76').state.phase,'celebration');assert.equal(query(25,'celebration','sprite-76').state.phase,'continuation');assert.equal(query(140,'all-cards-complete').state.phase,'continuation');assert.equal(query(188,'all-cards-complete').state.phase,'complete');assert.equal(query(188,'all-cards-complete').state.matched.length,4);
});
test('wrong domains, source ranges and scenario boundaries fail closed',()=>{
 for(const frame of [0,189,1.5,NaN])assert.throws(()=>query(frame));assert.throws(()=>query(1,'help-example'));assert.throws(()=>query(139,'all-cards-complete'));assert.throws(()=>query(1,'unknown'));assert.throws(()=>query(1,'source-inspection','__proto__'));
});
