import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P021NativeTextV1} from '../src/alg-l06-p021-native-text-v1';
import {P021_TEXT_STATE_SOURCE} from '../src/generated/alg-l06-p021-text-state-v1';
const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P021NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('P021 native companion keeps source English and does not spoil definition or pair stages',()=>{
  assert.match(render(1,'es'),/lang="en"/);
  assert.match(render(1,'es'),/data-p021-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p021-canvas-suppression="none"/);
  assert.doesNotMatch(render(71),/data-p021-section="definition"/);
  assert.match(render(72),/data-p021-section="definition"/);
  assert.match(render(91).replace(/<[^>]*>/g,''),/outputs for the functions\./);
  assert.doesNotMatch(render(177),/data-p021-section="source-example"/);
  assert.match(render(178),/data-p021-section="source-example"/);
  assert.doesNotMatch(render(203),/data-p021-section="source-table"/);
  assert.match(render(204),/data-p021-section="source-table"/);
  assert.doesNotMatch(render(345),/data-p021-ordered-pair-ordinal="1"/);
  assert.match(render(346),/data-p021-ordered-pair-ordinal="1"/);
  assert.doesNotMatch(render(375),/data-p021-ordered-pair-ordinal="4"/);
  assert.match(render(376),/data-p021-ordered-pair-ordinal="4"/);
  assert.doesNotMatch(render(376,'es'),/Conjunto de valores/);
});

test('P021 native controls have exact source instance attributes and callback trigger',()=>{
  for(const control of P021_TEXT_STATE_SOURCE.glossaryControls){
    const prior=render(control.firstCandidateFrame-1);
    const ready=render(control.firstCandidateFrame);
    assert.doesNotMatch(prior,new RegExp(`data-p021-glossary-key="${control.key}"`));
    assert.match(ready,new RegExp(`data-p021-glossary-key="${control.key}"`));
    assert.match(ready,new RegExp(`data-source-button-instance-id="${control.sourceButtonInstanceId}"`));
    assert.match(ready,new RegExp(`data-source-action-sha256="${control.sourceActionSha256}"`));
  }
  const invoked:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P021NativeTextV1({frame:77,onGlossary:(key,trigger)=>
    invoked.push([key,trigger])}));
  assert.equal(nodes.length,6);
  const ordered=nodes.find(node=>(node.props as Record<string,unknown>)
    ['data-p021-glossary-key']==='Ordered pair');
  assert(ordered);
  const trigger={focus(){}} as HTMLButtonElement;
  (ordered.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(invoked,[['Ordered pair',trigger]]);
  assert.equal(buttons(P021NativeTextV1({frame:77})).every(node=>
    (node.props as {disabled:boolean}).disabled),true);
});
