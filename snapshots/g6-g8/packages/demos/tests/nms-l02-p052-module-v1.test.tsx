import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import candidate from '../src/modules/g678-nms-l02-percent-practice-p052';
import {getFrameState,SOURCE_SWF_SHA} from '../src/timelines/g678-nms-l02-percent-practice-p052';
import type {RuntimeContext} from '../src/contract';
const plan=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-nms002-l02-p052/audit/native-main-capture-plan-v1.json',import.meta.url),'utf8'));
function context(row:any):RuntimeContext{return {frame:row.range.first,frameDomain:'sprite-350',rootFrame:6,
 scenario:row.scenario,lang:row.language,seed:row.seed,traceId:row.id,requirementId:`req-${row.id}`,entryStateSha256:row.entryStateSha256};}
test('maintained timeline artifact is the exact pure function used by the module',()=>{
 assert.equal(getFrameState,candidate.getFrameState);
 assert.equal(SOURCE_SWF_SHA,'5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638');
 for(const row of plan.requirements){const c=context(row);assert.deepEqual(getFrameState(c.frame,c),candidate.getFrameState(c.frame,c));}
});
test('private module retains10root frames and156main frames; metadata alone does not establish registry membership',()=>{
 assert.equal(candidate.maturity,'private-current-js');assert.equal(candidate.movie.frameCount,10);
 assert.deepEqual(candidate.runtime?.frameDomains,[{id:'sprite-350',frameCount:156,rootFrame:6}]);
 assert.deepEqual(candidate.audioCues,[]);assert.equal(candidate.interactiveStops,undefined);
});
test('all160 identities flow through module state, renderer and text capability',()=>{
 for(const row of plan.requirements){const c=context(row),state=candidate.getFrameState(c.frame,c);
  assert.equal(candidate.textPresentation!.getSnapshot(state,c).status,'ready');
  const html=renderToStaticMarkup(React.createElement(candidate.Renderer,c));assert.ok(html.includes(`data-flash-trace-id="${row.id}"`));
 }
});
test('missing capture identity, root substitution, forged state and UI-language relabeling fail closed',()=>{
 const c=context(plan.requirements[0]);
 for(const change of [{traceId:undefined},{frameDomain:'root'},{rootFrame:1},{replay:1}])assert.throws(()=>candidate.getFrameState(c.frame,{...c,...change}));
 const state=candidate.getFrameState(c.frame,c);
 assert.throws(()=>candidate.textPresentation!.getSnapshot({...state,state:{...state.state,percent:75}},c),/STATE_MISMATCH/);
 assert.throws(()=>renderToStaticMarkup(React.createElement(candidate.Renderer,{...c,uiLanguage:'es'})),/UI_LANGUAGE/);
});
