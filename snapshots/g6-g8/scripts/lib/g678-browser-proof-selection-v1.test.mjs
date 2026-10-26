import assert from 'node:assert/strict';
import test from 'node:test';
import {selectBrowserProofRows} from './g678-browser-proof-selection-v1.mjs';

const row=id=>Object.freeze({animationId:id,proof:Object.freeze({path:`proofs/${id}.json`,bytes:10,sha256:'a'.repeat(64)})});
const admittedPages=Object.freeze([row('p001'),row('p005'),row('p006'),row('unrelated')]);

test('legacy default retains every admitted row even for one requested page',()=>{
 const rows=selectBrowserProofRows({admittedPages,animationIds:['p005']});
 assert.equal(rows,admittedPages);
 assert.equal(rows.length,4);
});

test('explicit all-admitted has exactly the legacy selection',()=>{
 assert.equal(selectBrowserProofRows({admittedPages,animationIds:['p005'],inputScope:'all-admitted'}),admittedPages);
});

test('selected-pages selects exact admitted rows in index order without mutating pins',()=>{
 const ids=['p006','p001','p005'];
 const rows=selectBrowserProofRows({admittedPages,animationIds:ids,inputScope:'selected-pages'});
 assert.deepEqual(rows.map(page=>page.animationId),['p001','p005','p006']);
 assert.deepEqual(ids,['p006','p001','p005']);
 assert.equal(rows[0],admittedPages[0]);
 assert.equal(rows[1].proof,admittedPages[1].proof);
 assert.equal(admittedPages.length,4);
});

for(const inputScope of ['all-admitted','selected-pages']) {
 test(`${inputScope} rejects unknown or old non-admitted Canvas placement`,()=>{
  assert.throws(()=>selectBrowserProofRows({admittedPages,animationIds:['p005','old-canvas-p004'],inputScope}),/must be admitted/);
 });
 test(`${inputScope} rejects duplicate requested IDs`,()=>{
  assert.throws(()=>selectBrowserProofRows({admittedPages,animationIds:['p005','p005'],inputScope}),/distinct/);
 });
 test(`${inputScope} rejects empty requested IDs`,()=>{
  assert.throws(()=>selectBrowserProofRows({admittedPages,animationIds:[],inputScope}),/distinct/);
 });
 test(`${inputScope} rejects missing or nonstring requested IDs`,()=>{
  for(const animationIds of [undefined,null,'p005',[null],[''],[5]]) {
   assert.throws(()=>selectBrowserProofRows({admittedPages,animationIds,inputScope}),/distinct/);
  }
 });
 test(`${inputScope} rejects an empty admitted index`,()=>{
  assert.throws(()=>selectBrowserProofRows({admittedPages:[],animationIds:['p005'],inputScope}),/nonempty/);
 });
}

test('scope is opt-in and unknown/null scope cannot silently fall back',()=>{
 for(const inputScope of ['selected-page','all','',null,false,{}]) {
  assert.throws(()=>selectBrowserProofRows({admittedPages,animationIds:['p005'],inputScope}),/supported browser input scope/);
 }
});

test('duplicate admitted proof rows fail instead of expanding a selected set',()=>{
 assert.throws(()=>selectBrowserProofRows({admittedPages:[row('p005'),row('p005')],animationIds:['p005'],inputScope:'selected-pages'}),/unique admitted/);
});

test('selected-pages never edits or clips the selected proof row',()=>{
 const owned={animationId:'p005',proof:{path:'proof.json',bytes:123,sha256:'b'.repeat(64)},
  ownFiles:['module','generated','data','source'],external:['swf','xml','audio']};
 const before=structuredClone(owned);
 const [after]=selectBrowserProofRows({admittedPages:[owned,row('other')],animationIds:['p005'],inputScope:'selected-pages'});
 assert.equal(after,owned);
 assert.deepEqual(after,before);
});
