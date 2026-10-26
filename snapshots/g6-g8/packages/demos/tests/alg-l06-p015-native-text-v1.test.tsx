import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P015NativeTextV1} from '../src/alg-l06-p015-native-text-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P015NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('native reading companion reveals source English concepts only after source masks settle',()=>{
  assert.match(render(1,'es'),/data-p015-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p015-canvas-suppression="none"/);
  assert.doesNotMatch(render(134),/data-p015-machine-label/);
  assert.match(render(135),/data-p015-machine-label="true"/);
  assert.doesNotMatch(render(135),/<h2/);
  assert.doesNotMatch(render(248),/data-p015-sentence="definition"/);
  assert.match(render(249),/A function is a special relation/);
  assert.doesNotMatch(render(331),/data-p015-sentence="rule"/);
  assert.match(render(332),/A function can also be a rule/);
  assert.doesNotMatch(render(391),/data-p015-sentence="unique-output"/);
  assert.match(render(392),/Each input must have only one output/);
});

test('six glossary controls gate by the whole source hit and invoke exact key',()=>{
  for(const [key,frame] of [['Function',172],['Relation',191],['Value',215],
    ['Rule',302],['Input',317],['Output',332]] as const){
    assert.doesNotMatch(render(frame-1),new RegExp(`data-p015-glossary-key="${key}"`));
    assert.match(render(frame),new RegExp(`data-p015-glossary-key="${key}"`));
  }
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P015NativeTextV1({frame:332,onGlossary:(key,trigger)=>
    called.push([key,trigger])}));
  const output=nodes.find(node=>(node.props as {'data-p015-glossary-key'?:string})
    ['data-p015-glossary-key']==='Output');
  assert(output);
  const trigger={focus(){}} as HTMLButtonElement;
  (output.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Output',trigger]]);
});

test('native companion reflows without a fixed-width answer or glossary grid',()=>{
  const markup=render(392);
  assert.match(markup,/flex-wrap:wrap/);
  assert.match(markup,/max-width:100%/);
  assert.doesNotMatch(markup,/minmax\(8\.5em|width:272px/);
});
