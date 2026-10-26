import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P019NativeTextV1} from '../src/alg-l06-p019-native-text-v1';
import {P019_TEXT_STATE_SOURCE,p019TextState} from '../src/generated/alg-l06-p019-text-state-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
  <P019NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement(node))return [];
  return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('source English reading companion only reveals complete source runs',()=>{
  assert.match(render(1,'es'),/lang="en"/);
  assert.match(render(1,'es'),/data-p019-language-policy="source-en-fallback"/);
  assert.match(render(1),/data-p019-canvas-suppression="none"/);
  assert.doesNotMatch(render(1),/data-p019-section="definition"/);
  assert.doesNotMatch(render(21),/function table is a table that shows pairs/);
  assert.match(render(57),/A <\/span><span[^>]*>function table/);
  assert.doesNotMatch(render(56),/outputs for the function\./);
  assert.match(render(74).replace(/<[^>]*>/g,''),/outputs for the function\./);
  assert.doesNotMatch(render(74,'es'),/tabla de funciones/);
});

test('table uses exact source cell instances and waits for both complete ink cells',()=>{
  assert.doesNotMatch(render(145),/data-p019-section="source-table"/);
  assert.match(render(146),/data-p019-section="source-table"/);
  for(const [frame,input,output] of [[171,'2','3'],[175,'3','5'],[178,'5','-2'],[182,'7','1']] as const){
    assert.doesNotMatch(render(frame-1),new RegExp(`data-p019-source-pair-frame="${frame}"`));
    const html=render(frame);
    assert.match(html,new RegExp(`data-p019-source-pair-frame="${frame}"`));
    const row=P019_TEXT_STATE_SOURCE.tableRows.find(item=>item.firstCompletePairFrame===frame);
    assert(row);
    assert.equal(row.inputText,input);assert.equal(row.outputText,output);
    assert.match(html,new RegExp(`data-p019-source-input-instance-id="${row.inputInstanceId}"`));
  }
  assert.equal(p019TextState(351).tableRows.filter(row=>row.available).length,4);
  assert.deepEqual(P019_TEXT_STATE_SOURCE.tableRows.map(row=>[row.inputText,row.outputText]),
    [['2','3'],['3','5'],['5','-2'],['7','1']]);
});

test('six independent source-key controls have per-instance full blue and hit gates',()=>{
  const expected=[['Function table',8,22],['Table',11,29],['Pair',10,47],
    ['Input',9,54],['Output',19,63],['Function',20,74]] as const;
  for(const [key,id,frame] of expected){
    assert.doesNotMatch(render(frame-1),new RegExp(`data-p019-glossary-key="${key}"`));
    assert.match(render(frame),new RegExp(`data-p019-glossary-key="${key}"`));
    const control=P019_TEXT_STATE_SOURCE.glossaryControls.find(c=>c.key===key);
    assert(control);assert.equal(control.sourceButtonId,id);
    assert.match(render(frame),new RegExp(`data-source-button-instance-id="${control.sourceButtonInstanceId}"`));
  }
  const called:Array<[string,HTMLButtonElement]>=[];
  const nodes=buttons(P019NativeTextV1({frame:74,onGlossary:(key,trigger)=>
    called.push([key,trigger])}));
  assert.equal(nodes.length,6);
  const pair=nodes.find(node=>(node.props as Record<string,unknown>)
    ['data-p019-glossary-key']==='Pair');
  assert(pair);
  const trigger={focus(){}} as HTMLButtonElement;
  (pair.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
    .onClick({currentTarget:trigger});
  assert.deepEqual(called,[['Pair',trigger]]);
});
