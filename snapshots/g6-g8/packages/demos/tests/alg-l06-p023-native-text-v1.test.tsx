import assert from 'node:assert/strict';
import test from 'node:test';
import React,{isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P023NativeTextV1,P023_TEXT_STATE_SOURCE,p023TextState}
 from '../src/alg-l06-p023-native-text-v1';

const render=(frame:number,language:'en'|'es'='en')=>renderToStaticMarkup(
 <P023NativeTextV1 frame={frame} language={language} onGlossary={()=>{}}/>);
const buttons=(node:unknown):React.ReactElement[]=>{
 if(Array.isArray(node))return node.flatMap(buttons);
 if(!isValidElement(node))return [];
 return node.type==='button'?[node]:buttons((node.props as {children?:unknown}).children);
};

test('P023 native definition follows each complete source run, with EN source fallback',()=>{
 assert.doesNotMatch(render(13),/data-p023-section="definition"/);
 const milestones:Array<[number,number,string]>=[[13,14,'The '],[19,20,'domain'],
  [29,30,'function'],[39,40,' is the '],[41,42,'set'],
  [62,63,' of all the function’s '],[67,68,'inputs']];
 for(const [prior,ready,text] of milestones){
  assert.doesNotMatch(render(prior),new RegExp(`>${text}</span>`));
  assert.match(render(ready),new RegExp(`>${text}</span>`));
 }
 assert.match(render(67),/data-p023-definition-complete="false"/);
 assert.match(render(68),/data-p023-definition-complete="true"/);
 assert.match(render(20,'es'),/lang="en"/);
 assert.match(render(20,'es'),/data-p023-language-policy="source-en-fallback"/);
 assert.match(render(20),/data-p023-canvas-suppression="none"/);
});

test('P023 table and set composition wait for instance-level geometric milestones',()=>{
 assert.equal(P023_TEXT_STATE_SOURCE.inventory.textDefinitions,21);
 assert.equal(P023_TEXT_STATE_SOURCE.inventory.textRuns,29);
 assert.equal(P023_TEXT_STATE_SOURCE.inventory.spritePlacementInstances,69);
 assert.equal(P023_TEXT_STATE_SOURCE.textInstances.length,56);
 assert.doesNotMatch(render(172),/data-p023-section="source-table"/);
 assert.match(render(173),/data-p023-section="source-table"/);
 const table=p023TextState(173).table;
 assert.equal(table.available,true);
 assert.deepEqual(table.rows.map(row=>[row.input?.text,row.output?.text]),
  [['1','1'],['10','2'],['100','3']]);
 assert.equal(p023TextState(393).setNotation.allInkVisible,false);
 assert.equal(p023TextState(394).setNotation.allInkVisible,true);
 assert.equal(p023TextState(400).setNotation.available,false);
 assert.doesNotMatch(render(400),/data-p023-section="source-set-notation"/);
 assert.match(render(401),/data-p023-section="source-set-notation"/);
 const set=p023TextState(401).setNotation;
 assert.equal(set.available,true);
 assert.deepEqual(set.tokens.map(item=>item?.text),['{','1',',','10',',','100','}']);
 assert.equal(new Set(set.tokens.map(item=>item?.instanceId)).size,7);
 assert.throws(()=>p023TextState(411),/P023_TEXT_FRAME_OUT_OF_RANGE/);
});

test('P023 controls bind four source instances and return the clicked trigger',()=>{
 for(const control of P023_TEXT_STATE_SOURCE.glossaryControls){
  const prior=render(control.firstCandidateFrame-1),ready=render(control.firstCandidateFrame);
  assert.doesNotMatch(prior,new RegExp(`data-p023-glossary-key="${control.key}"`));
  assert.match(ready,new RegExp(`data-p023-glossary-key="${control.key}"`));
  assert.match(ready,new RegExp(`data-source-button-instance-id="${control.sourceButtonInstanceId}"`));
  assert.match(ready,new RegExp(`data-source-action-sha256="${control.sourceActionSha256}"`));
  assert.match(ready,new RegExp(`data-p023-source-label-instance-id="${control.sourceLabelTextInstanceId}"`));
 }
 assert.match(render(68,'es'),/Abrir glosario: Domain/);
 assert.match(render(68,'es'),/Domain glosario/);
 const invoked:Array<[string,HTMLButtonElement]>=[];
 const nodes=buttons(P023NativeTextV1({frame:68,onGlossary:(key,trigger)=>
  invoked.push([key,trigger])}));
 assert.equal(nodes.length,4);
 const domain=nodes.find(node=>(node.props as Record<string,unknown>)['data-p023-glossary-key']==='Domain');
 assert(domain);
 const trigger={focus(){}} as HTMLButtonElement;
 (domain.props as {onClick:(event:{currentTarget:HTMLButtonElement})=>void})
  .onClick({currentTarget:trigger});
 assert.deepEqual(invoked,[['Domain',trigger]]);
 assert.equal(buttons(P023NativeTextV1({frame:68})).every(node=>
  (node.props as {disabled:boolean}).disabled),true);
});
