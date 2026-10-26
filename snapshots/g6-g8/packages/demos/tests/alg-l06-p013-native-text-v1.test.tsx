import assert from 'node:assert/strict';
import test from 'node:test';
import React, {isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P013NativeTextV1} from '../src/alg-l06-p013-native-text-v1';

const render=(frame:number,language:'en'|'es'='en',
  onGlossary?:(key:'Input'|'Output',trigger:HTMLButtonElement)=>void)=>
  renderToStaticMarkup(<P013NativeTextV1 frame={frame} language={language}
    onGlossary={onGlossary}/>);

test('reflow companion exposes formulas without inventing a source title or translation',()=>{
  const before=render(1,'es');
  assert.match(before,/data-p013-native-text="true"/);
  assert.match(before,/data-p013-language-policy="source-en-fallback"/);
  assert.match(before,/data-p013-canvas-suppression="none"/);
  assert.doesNotMatch(before,/data-p013-formulas|data-p013-term/);
  const formula=render(2);
  assert.match(formula,/F = \(9\/5\) × C \+ 32/);
  assert.match(formula,/A = l × w/);
  assert.match(formula,/data-source-text-ids="character-4 character-5"/);
});

test('readable source sentences, faded labels and distinct buttons follow frame state',()=>{
  assert.doesNotMatch(render(257),/data-p013-term/);
  assert.doesNotMatch(render(258,'en',()=>{}),/data-p013-term|data-p013-glossary-key/);
  assert.doesNotMatch(render(288),/data-source-text-ids="character-133"/);
  assert.match(render(289),/data-source-text-ids="character-133"/);
  assert.doesNotMatch(render(295,'en',()=>{}),/data-p013-sentence="Input"|data-p013-glossary-key="Input"/);
  const input=render(296,'en',()=>{});
  assert.match(input,/The number that goes in is called the input\./);
  assert.match(input,/data-p013-glossary-key="Input"/);
  assert.doesNotMatch(render(297,'en',()=>{}),/data-p013-glossary-key="Output"|data-p013-sentence="Output"/);
  assert.doesNotMatch(render(360),/data-source-text-ids="character-138"/);
  assert.match(render(361),/data-source-text-ids="character-138"/);
  assert.doesNotMatch(render(364,'en',()=>{}),/data-p013-sentence="Output"|data-p013-glossary-key="Output"/);
  const output=render(365,'en',()=>{});
  assert.match(output,/The number that comes out is called the output\./);
  assert.match(output,/data-p013-glossary-key="Output"/);
});

test('each accessible control sends its own exact glossary key and trigger',()=>{
  const requested:Array<['Input'|'Output',HTMLButtonElement]>=[];
  const onGlossary=(key:'Input'|'Output',trigger:HTMLButtonElement)=>requested.push([key,trigger]);
  const findButtons=(value:unknown):React.ReactElement[]=>{
    if(Array.isArray(value))return value.flatMap(findButtons);
    if(!isValidElement(value))return [];
    return value.type==='button'?[value]:findButtons((value.props as {children?:unknown}).children);
  };
  const input=findButtons(P013NativeTextV1({frame:296,onGlossary}));
  assert.equal(input.length,1);
  const both=findButtons(P013NativeTextV1({frame:365,language:'es',onGlossary}));
  assert.equal(both.length,2);
  const first={focus(){}} as HTMLButtonElement,second={focus(){}} as HTMLButtonElement;
  (both[0].props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:first});
  (both[1].props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:second});
  assert.deepEqual(requested,[['Input',first],['Output',second]]);
  assert.match(render(365,'es'),/disabled=""/);
});
