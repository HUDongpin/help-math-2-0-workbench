import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createAlgL11ASpecialInstructionalVisualCandidate,createAlgL11ASpecialVisualState,
  reduceAlgL11ASpecialVisual,resolveAlgL11ASpecialFeedbackFrame,visibleAlgL11ASpecialGlossary,
  type AlgL11ASpecialVisualConfig} from '../src/g678-alg-l11-a-special-instructional-visuals';
import type {AlgL11ASourceVectorBundle} from '../src/g678-alg-l11-tranche-a-source-vector-stage';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const config=(p:string):AlgL11ASpecialVisualConfig=>JSON.parse(readFileSync(path.join(root,
  `work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2/shared-alg001-l11-p${p}/interaction-config.json`),'utf8'));
const bundle=(p:string):AlgL11ASourceVectorBundle=>JSON.parse(readFileSync(path.join(root,
  `work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v4/shared-alg001-l11-p${p}.json`),'utf8'));

test('p006 three physical source placements operate independently, including both Opt_2 depths',()=>{
  const c=config('006');assert.deepEqual(c.answers!.map(a=>a.depth),[6,24,26]);
  assert.equal(c.answers![0].label,'x ≥ 5');
  const initial=createAlgL11ASpecialVisualState(c,24);
  for(const answer of c.answers!){
    const next=reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:answer.id,hostAllowed:true});
    assert.equal(next.phase,answer.correct?'right-feedback':'wrong-feedback');assert.equal(next.feedbackFrame,2);
    assert.equal(next.selectedHit,answer.id);
    assert.equal(reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:answer.id,hostAllowed:false}),initial);
  }
  assert.throws(()=>reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:'Opt_2',hostAllowed:true}),/Unknown/);
});

test('right feedback completes at20 while wrong feedback waits for its real Close control',()=>{
  const c=config('006'),initial=createAlgL11ASpecialVisualState(c,24);
  const right=reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:c.answers![0].id,hostAllowed:true});
  const wrong=reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:c.answers![1].id,hostAllowed:true});
  assert.equal(reduceAlgL11ASpecialVisual(c,right,{type:'feedback-frame',frame:19}).phase,'right-feedback');
  assert.equal(reduceAlgL11ASpecialVisual(c,right,{type:'feedback-frame',frame:20}).phase,'right-complete');
  assert.equal(reduceAlgL11ASpecialVisual(c,wrong,{type:'close-wrong',hostAllowed:true}),wrong);
  const at20=reduceAlgL11ASpecialVisual(c,wrong,{type:'feedback-frame',frame:20});
  assert.equal(at20.phase,'wrong-feedback');
  assert.equal(reduceAlgL11ASpecialVisual(c,at20,{type:'close-wrong',hostAllowed:false}),at20);
  assert.deepEqual(reduceAlgL11ASpecialVisual(c,at20,{type:'close-wrong',hostAllowed:true}),initial);
  assert.throws(()=>reduceAlgL11ASpecialVisual(c,right,{type:'feedback-frame',frame:21}),/invalid/);
});

test('feedback uses a queryable12fps clock and Replay resets the complete state',()=>{
  const c=config('006');assert.equal(resolveAlgL11ASpecialFeedbackFrame(2,0),2);
  assert.equal(resolveAlgL11ASpecialFeedbackFrame(2,250),5);
  assert.equal(resolveAlgL11ASpecialFeedbackFrame(10,250),13);
  assert.equal(resolveAlgL11ASpecialFeedbackFrame(2,9999),20);
  assert.throws(()=>resolveAlgL11ASpecialFeedbackFrame(1,1),/Invalid/);
  const initial=createAlgL11ASpecialVisualState(c,24);
  const wrong=reduceAlgL11ASpecialVisual(c,initial,{type:'choose',hitId:c.answers![2].id,hostAllowed:true});
  assert.deepEqual(reduceAlgL11ASpecialVisual(c,wrong,{type:'observe',frame:1}),
    {phase:'teaching',mainFrame:1,feedbackFrame:1,selectedHit:null});
});

test('source p006 scene and accessible names retain ≥ and both distinct wrong expressions',()=>{
  const {Renderer,module}=createAlgL11ASpecialInstructionalVisualCandidate(config('006'),bundle('006'));
  const html=renderToStaticMarkup(<Renderer frame={24} frameDomain="sprite-50" scenario="source-static-frame" lang="en" seed={1} paused={false}/>);
  for(const id of ['Opt_1-depth-6','Opt_2-depth-24','Opt_2-depth-26'])assert.match(html,new RegExp(`data-source-control-id="${id}"`));
  assert.match(html,/aria-label="x ≥ 5"/);assert.match(html,/aria-label="10y⁵"/);assert.match(html,/aria-label="x \+ 10 = 15"/);
  assert.equal(module.interactiveStops?.[0].stopFrame,24);assert.equal(module.interactiveStops?.[0].resumeFrame,25);
  assert.equal(module.reducedMotionFrame,24,'Reduced motion must retain the source question, not stop before it');
  assert.equal(module.authoredTimelineControls,undefined);
  assert.doesNotMatch(html,/Random source branch|Play S1|Source vector option/);
});

test('p009/p010 use all825 teaching frames and do not fabricate dormant two-try controls',()=>{
  let total=0;
  for(const p of ['009','010']){
    const c=config(p),b=bundle(p),candidate=createAlgL11ASpecialInstructionalVisualCandidate(c,b);
    total+=c.frameCount;assert.equal(c.dormantFeedbackDisposition?.localStartInvocationCount,0);
    assert.equal(c.dormantFeedbackDisposition?.sourceEntryReachableFromLocalButtons,false);
    assert.deepEqual(candidate.module.interactiveStops,[]);
    assert.equal(candidate.module.reducedMotionFrame,c.frameCount,'Reduced motion must expose the complete worked teaching state');
    const state=createAlgL11ASpecialVisualState(c,24);
    assert.equal(reduceAlgL11ASpecialVisual(c,state,{type:'choose',hitId:'invented',hostAllowed:true}),state);
    const html=renderToStaticMarkup(<candidate.Renderer frame={c.frameCount} frameDomain={`sprite-${c.mainObjectId}`}
      scenario="source-static-frame" lang="en" seed={1} paused={false}/>);
    assert.match(html,new RegExp(`data-source-vector-frame="${c.frameCount}"`));
    assert.doesNotMatch(html,/aria-label="Close explanation"|Need more help|two-try-phase|data-source-control-id="Opt_/);
  }
  assert.equal(total,825);
});

test('proven source glossary controls cover active frames and resolve exact source definitions',()=>{
  for(const p of ['006','009','010']){
    const c=config(p);
    for(const control of c.glossaryControls){
      assert.ok(c.glossaryEntries.some(e=>e.id===control.entryId&&e.key===control.sourceKey));
      assert.ok(visibleAlgL11ASpecialGlossary(c,control.firstFrame!).includes(control));
      assert.ok(!visibleAlgL11ASpecialGlossary(c,control.lastFrame!+1).includes(control));
    }
  }
  const p006=config('006');assert.equal(p006.feedback!.wrong.glossaryControls.length,5);
  assert.ok(p006.glossaryEntries.some(e=>e.id==='greater-than'&&e.definitions.en.length>10));
  assert.ok(config('009').glossaryEntries.some(e=>e.id==='solve'&&e.definitions.en.length>10));
});

test('candidate rejects mismatched source bundle instead of displaying unrelated source content',()=>{
  assert.throws(()=>createAlgL11ASpecialInstructionalVisualCandidate(config('006'),bundle('009')),/mismatch/);
});
