import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P018NativeTextV1} from '../src/alg-l06-p018-native-text-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P018NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('native companion is readable, source-timed, and explicitly English under es',()=>{
  assert.match(render(1,'es'),/lang="en"/);
  assert.match(render(1,'es'),/data-p018-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p018-canvas-suppression="none"/);
  assert.doesNotMatch(render(3),/data-p018-section="definition"/);
  assert.match(render(4),/data-source-fully-visible="false"/);
  assert.doesNotMatch(render(10),/To evaluate/);
  assert.match(render(11),/To <\/span><span[^>]*>evaluate/);
  assert.doesNotMatch(render(152),/data-p018-equation-text-id="22"/);
  assert.match(render(153),/D = 55T/);
  assert.doesNotMatch(render(398),/would go in 3 hours/);
  assert.match(render(399),/would go in 3 hours/);
  assert.doesNotMatch(render(456),/D = 55\(3\)/);
  assert.match(render(457),/D = 55\(3\)/);
  assert.doesNotMatch(render(545),/D = 165/);
  assert.match(render(546),/D = 165/);
  assert.doesNotMatch(render(583),/data-p018-highlight-text-id="31"/);
  assert.match(render(584),/data-p018-highlight-text-id="31"/);
  assert.doesNotMatch(render(585),/data-p018-highlight-text-id="31"/);
  assert.doesNotMatch(render(399,'es'),/Para evaluar/);
});

test('duplicate Evaluate and Function controls preserve exact source instance identities',()=>{
  assert.doesNotMatch(render(10),/data-p018-glossary-key="Evaluate"/);
  assert.match(render(11),/data-source-button-instance-id="sprite-32\/depth-4\/generation-1"/);
  assert.doesNotMatch(render(323),/data-source-button-instance-id="sprite-32\/depth-22\/generation-1"/);
  assert.match(render(324),/data-source-button-instance-id="sprite-32\/depth-22\/generation-1"/);
  assert.doesNotMatch(render(332),/data-source-button-instance-id="sprite-32\/depth-24\/generation-1"/);
  assert.match(render(333),/data-source-button-instance-id="sprite-32\/depth-24\/generation-1"/);
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P018NativeTextV1({frame:333,onGlossary:(key,trigger)=>
    called.push([key,trigger])}));
  assert.equal(nodes.length,7);
  const secondEvaluate=nodes.find(node=>(node.props as Record<string,unknown>)
    ['data-source-button-instance-id']==='sprite-32/depth-22/generation-1');
  assert(secondEvaluate);
  const trigger={focus(){}} as HTMLButtonElement;
  (secondEvaluate.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Evaluate',trigger]]);
});
