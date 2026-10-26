import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P022NativeTextV1} from '../src/alg-l06-p022-native-text-v1';
import {P022_TEXT_STATE_SOURCE,p022TextState} from '../src/generated/alg-l06-p022-text-state-v1';
const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P022NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('P022 native reading waits for complete source sentences, steps and ordered pair',()=>{
  assert.match(render(1,'es'),/lang="en"/);
  assert.match(render(1,'es'),/data-p022-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p022-canvas-suppression="none"/);
  assert.doesNotMatch(render(70),/data-p022-section="definition"/);
  assert.match(render(71),/data-p022-section="definition"/);
  assert.doesNotMatch(render(109),/data-source-text-id="character-14"/);
  assert.match(render(110),/data-source-text-id="character-14"/);
  for(const [prior,ready,id] of [[243,244,47],[272,273,48],[300,301,49]]){
    assert.doesNotMatch(render(prior),new RegExp(`data-p022-step-source-id="${id}"`));
    assert.match(render(ready),new RegExp(`data-p022-step-source-id="${id}"`));
  }
  assert.match(render(304),/data-p022-step-source-id="49"/);
  assert.doesNotMatch(render(360),/data-p022-section="source-ordered-pair"/);
  assert.match(render(361),/data-p022-section="source-ordered-pair"/);
  assert.match(render(422),/\(2, –3\)/);
  assert.equal(p022TextState(360).orderedPair.available,false);
  assert.equal(p022TextState(361).orderedPair.available,true);
  assert.throws(()=>p022TextState(423),/P022_TEXT_FRAME_OUT_OF_RANGE/);
});

test('P022 native controls bind each source instance and return clicked trigger',()=>{
  for(const control of P022_TEXT_STATE_SOURCE.glossaryControls){
    const prior=render(control.firstCandidateFrame-1),ready=render(control.firstCandidateFrame);
    assert.doesNotMatch(prior,new RegExp(`data-p022-glossary-key="${control.key}"`));
    assert.match(ready,new RegExp(`data-p022-glossary-key="${control.key}"`));
    assert.match(ready,new RegExp(`data-source-button-instance-id="${control.sourceButtonInstanceId}"`));
    assert.match(ready,new RegExp(`data-source-action-sha256="${control.sourceActionSha256}"`));
    assert.match(ready,new RegExp(`data-p022-source-label-instance-id="${control.sourceLabelTextInstanceId}"`));
    assert.match(ready,new RegExp(`data-p022-source-label-text-id="${control.sourceLabelTextId}"`));
    assert.match(ready,new RegExp(`data-p022-source-label-segment="${control.sourceLabelSegment}"`));
  }
  const invoked:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P022NativeTextV1({frame:99,onGlossary:(key,trigger)=>
    invoked.push([key,trigger])}));
  assert.equal(nodes.length,6);
  const graph=nodes.find(node=>(node.props as Record<string,unknown>)['data-p022-glossary-key']==='Graph');
  assert(graph);
  const trigger={focus(){}} as HTMLButtonElement;
  (graph.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(invoked,[['Graph',trigger]]);
  assert.equal(buttons(P022NativeTextV1({frame:99})).every(node=>
    (node.props as {disabled:boolean}).disabled),true);
});
