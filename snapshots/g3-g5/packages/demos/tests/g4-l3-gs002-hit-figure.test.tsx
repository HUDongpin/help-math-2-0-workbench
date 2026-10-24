import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import data from '../src/modern-lessons/generated/g4-l3-gs002-hit.json';
import {Gs002HitFigure} from '../src/modern-lessons/g4-l3-gs002-hit-figure';

test('all35hit display states independently match source event ordering',()=>{
 const catalog=JSON.parse(gunzipSync(readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
 const timeline=catalog.timelines.find((t:any)=>t.timelineId==='sprite-69');
 for(let f=1;f<=35;f++){
  const live=new Map<number,any>();
  for(const e of timeline.events.filter((e:any)=>e.frame<=f)){
   if(e.kind==='remove')live.delete(e.depth);
   else if(e.kind==='place')live.set(e.depth,{...(e.move?live.get(e.depth):{}),...e});
  }
  const expected=[...live.values()].sort((a,b)=>a.depth-b.depth);
  assert.deepEqual(data.frames[f-1].map(n=>[n.characterId,n.matrix,n.ratio,n.instanceId]),expected.map(n=>[n.characterId,n.matrix,n.ratio??0,n.instanceId]));
  const html=renderToStaticMarkup(<Gs002HitFigure frame={f}/>);
  assert.equal((html.match(/data-source-shape=/g)??[]).length,expected.length);
  assert.doesNotMatch(html,/<canvas|<text|<image|NaN|undefined/);
 }
});
test('hit retains authored morph travel, burst and blank-tail boundaries',()=>{
 assert.deepEqual(data.frames[10].map(n=>n.characterId),[63]);
 assert.deepEqual(data.frames[11].map(n=>n.characterId),[63,64]);
 assert.deepEqual(data.frames[21].map(n=>n.characterId),[63,65]);
 assert.deepEqual(data.frames[22].map(n=>n.characterId),[63,66]);
 assert.deepEqual(data.frames[23].map(n=>n.characterId),[67]);
 assert.deepEqual(data.frames[24].map(n=>n.characterId),[68]);
 for(const f of data.frames.slice(25))assert.deepEqual(f,[]);
 assert.match(renderToStaticMarkup(<Gs002HitFigure frame={12}/>),/M-2590 140 L-2404 140/);
 assert.equal(data.morphShapes[0].decoded.lines[0].startWidthTwips,20);
});
test('reduced motion preserves static virus without shortening host activity identity',()=>{
 const html=renderToStaticMarkup(<Gs002HitFigure frame={28} reducedMotion/>);
 assert.match(html,/data-gs002-hit-frame="1"/);assert.match(html,/data-source-activity-frame="28"/);
 assert.match(html,/data-source-shape="63"/);
 for(const frame of [0,36,NaN,1.5])assert.throws(()=>renderToStaticMarkup(<Gs002HitFigure frame={frame}/>),RangeError);
});
