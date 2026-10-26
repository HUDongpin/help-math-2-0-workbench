import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P017NativeTextV1} from '../src/alg-l06-p017-native-text-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P017NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('reflow companion follows full source glyphs while preserving Canvas words',()=>{
  assert.match(render(1,'es'),/data-p017-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p017-canvas-suppression="none"/);
  assert.doesNotMatch(render(63),/data-p017-section="definition"/);
  assert.match(render(64),/An equation of a function/);
  assert.doesNotMatch(render(78),/rule for the function/);
  assert.match(render(79),/rule for the function/);
  assert.doesNotMatch(render(131),/data-p017-section="output-variable"/);
  assert.match(render(132),/The output variable is usually by itself on the left/);
  assert.doesNotMatch(render(194),/data-p017-section="input-variable"/);
  assert.match(render(195),/The rule for the input variable is usually on the right/);
  assert.doesNotMatch(render(265),/data-p017-section="source-equation"/);
  assert.match(render(266),/y = 5x – 8/);
  assert.doesNotMatch(render(266,'es'),/Ecuación de una función/);
});

test('glossary controls appear only at source-ready gates with exact keys',()=>{
  assert.doesNotMatch(render(10),/data-p017-glossary-key/);
  assert.match(render(11),/data-p017-glossary-key="Equation"/);
  assert.match(render(20),/data-p017-glossary-key="Function"/);
  assert.doesNotMatch(render(53),/data-p017-glossary-key="Sentence"/);
  assert.match(render(54),/data-p017-glossary-key="Sentence"/);
  assert.match(render(68),/data-p017-glossary-key="Rule"/);
  assert.match(render(108),/data-p017-glossary-key="Output variable"/);
  assert.doesNotMatch(render(172),/data-p017-glossary-key="Input variable"/);
  assert.match(render(173),/data-p017-glossary-key="Input variable"/);
  assert.match(render(173),/data-source-button-visual-state="full-hit-and-blue-glyph"/);
});

test('late symbols stay separate from native prose and callbacks preserve exact key plus trigger',()=>{
  const markup=render(505);
  assert.match(markup,/data-p017-late-fragment-count="2"/);
  assert.doesNotMatch(markup,/data-source-text-id="character-38"/);
  assert.doesNotMatch(markup,/data-source-text-id="character-39"/);
  assert.match(markup,/data-p017-section="source-equation"/);
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P017NativeTextV1({frame:173,onGlossary:(key,trigger)=>
    called.push([key,trigger])}));
  assert.deepEqual(nodes.map(node=>(node.props as {'data-p017-glossary-key':string})
    ['data-p017-glossary-key']),[
    'Equation','Function','Sentence','Rule','Output variable','Input variable']);
  const trigger={focus(){}} as HTMLButtonElement;
  const last=nodes.at(-1);
  assert(last);
  (last.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Input variable',trigger]]);
});
