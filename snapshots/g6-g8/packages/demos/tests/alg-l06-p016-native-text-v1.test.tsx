import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P016NativeTextV1} from '../src/alg-l06-p016-native-text-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P016NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('reflow companion follows source reveal without replacing Canvas glyphs',()=>{
  assert.match(render(1,'es'),/data-p016-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p016-canvas-suppression="none"/);
  assert.doesNotMatch(render(40),/data-p016-section="definition"/);
  assert.match(render(41),/A function/);
  assert.doesNotMatch(render(71),/data-p016-glossary-key/);
  assert.match(render(72),/data-p016-glossary-key="Function"/);
  assert.doesNotMatch(render(72),/explains what happens/);
  assert.match(render(114),/explains what happens/);
  assert.doesNotMatch(render(371),/data-p016-input-heading/);
  assert.match(render(372),/Inputs/);
  assert.doesNotMatch(render(438),/data-p016-output-heading/);
  assert.match(render(439),/Output/);
  assert.doesNotMatch(render(613),/data-p016-source-equation/);
  assert.match(render(614),/1 banana split = 2 bananas/);
});

test('late transient source fragments are retained in source state, not narrated by native companion',()=>{
  const markup=render(759);
  assert.doesNotMatch(markup,/data-source-text-id="character-134"/);
  assert.doesNotMatch(markup,/data-source-text-id="character-130"/);
  assert.match(markup,/data-source-text-id="character-127"/);
  assert.match(render(815),/data-p016-source-equation/);
});

test('Function invokes exact source key and passes its trigger for host focus return',()=>{
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P016NativeTextV1({frame:72,onGlossary:(key,trigger)=>
    called.push([key,trigger])}));
  assert.equal(nodes.length,1);
  const trigger={focus(){}} as HTMLButtonElement;
  (nodes[0].props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Function',trigger]]);
  assert.match(render(72),/data-source-button-visual-state="hit-test-only-partial-mask"/);
});
