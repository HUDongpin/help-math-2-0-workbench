import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {p044ReadableSections,P044ReadableInstruction,P044ReadableNumberLine} from '../src/g678-nms-l01-p044-readable-instruction';
import {P044_READABLE_INSTRUCTION as SOURCE} from '../src/generated/g678-nms-l01-p044-readable-instruction-v1';
import {createP044State,reduceP044,queryP044,type P044Query} from '../src/g678-nms-l01-p044-controller';
const query=(frame:number)=>({...queryP044(createP044State()),mainFrame:frame}) as P044Query;
test('each main summary starts exactly at its source placement, not before',()=>{
  for(const [key,frame]of [['task',313],['information',450],['equation',576],['numberLine',698]] as const){assert.equal(p044ReadableSections(query(frame-1))[key],false);assert.equal(p044ReadableSections(query(frame))[key],true);}
});
test('explanation content is revealed only at exact held child frames',()=>{
  for(const [id,main,held,key]of [[106,575,15,'equation'],[139,697,49,'numberLine']] as const){
    for(const phase of ['explanation-opening','explanation-closing'] as const)assert.equal(p044ReadableSections({...query(main),phase,activeNestedFrames:[{sourceObjectId:id,frame:held}]} as P044Query)[key],false);
    assert.equal(p044ReadableSections({...query(main),phase:'explanation-held',activeNestedFrames:[{sourceObjectId:id,frame:held}]} as P044Query)[key],true);
  }
});
test('popup presents only its25-dollar example, never the jeans120 solution as help',()=>{
  const q={...query(737),phase:'popup'} as P044Query,html=renderToStaticMarkup(React.createElement(P044ReadableInstruction,{query:q}));
  assert.deepEqual(p044ReadableSections(q),{task:false,information:false,equation:false,numberLine:false,help:true});
  assert.ok(html.includes('Money Made: $25 × 5 = $125'));assert.ok(!html.includes('Total Cost ='));assert.ok(html.includes('data-jump-count="5"'));
});
test('number line uses proportional endpoints, explicit dollars, unique marker identities and no raster',()=>{
  const html=renderToStaticMarkup(React.createElement('div',null,React.createElement(P044ReadableNumberLine,{model:SOURCE.jeans}),React.createElement(P044ReadableNumberLine,{model:SOURCE.help})));
  assert.equal((html.match(/data-jump-from=/g)??[]).length,8);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const [from,to]of [[0,40],[40,80],[80,120],[100,125]])assert.ok(html.includes(`data-jump-from="${from}" data-jump-to="${to}"`));
  assert.ok(!html.includes('<image'));assert.ok(!html.includes('<canvas'));assert.ok(html.includes('$40 + $40 + $40 = $120'));
});
test('Replay removes all previously reached readable teaching solutions',()=>{
  let state=createP044State();state=reduceP044(state,{type:'main-frame',epoch:0,clockToken:0,frame:312}).state;
  state=reduceP044(state,{type:'replay',epoch:0,input:'mouse'}).state;
  assert.deepEqual(p044ReadableSections(queryP044(state)),{task:false,information:false,equation:false,numberLine:false,help:false});
});
