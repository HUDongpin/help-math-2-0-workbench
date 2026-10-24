import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_HELP_FIGURE,Gs002Help} from '../src/modern-lessons/g4-l3-gs002-help';

test('GS002 full help retains original vector scene, arrows and fifteen real labels',()=>{
  const html=renderToStaticMarkup(<Gs002Help/>);
  assert.equal((html.match(/data-lesson-text-block="help-tick-/g)??[]).length,15);
  assert.match(html,/Positive numbers make the space coupe go up\./);
  assert.match(html,/Negative numbers make the space coupe go down\./);
  assert.match(html,/data-source-shape="161"/);
  assert.doesNotMatch(html,/<canvas|<img|data-gs002-native-board/);
  assert.match(html,/overflow-x:auto/);
  assert.match(html,/stroke="#64748b"/);
  const guides=GS002_HELP_FIGURE.epochs.flat().filter(p=>'role' in p&&p.role==='guide-lines');
  assert.equal(guides.length,1);
  assert.equal(guides[0].edgeCount,15);
  const paths=GS002_HELP_FIGURE.epochs.flat().map(p=>p.d).join(' ');
  for(const vertex of ['-7155 4080','-7155 7380','-7150 5366','-7150 6086'])assert(paths.includes(vertex));
});

test('GS002 help uses its own scaled placements, not game label coordinates',()=>{
  const catalog=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const timeline=catalog.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-164');
  for(const label of GS002_HELP_FIGURE.labels){
    const placement=timeline.events.find((e:{characterId:number})=>e.characterId===label.characterId);
    assert.deepEqual(label.sourceMatrix,placement.matrix);
    assert(label.sourceMatrix[0]<1);
    const text=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===label.characterId);
    assert.equal(label.label,text.runs.map((r:{text:string})=>r.text).join(''));
    assert.equal(label.sourceTagSha256,text.sourceTagSha256);
  }
  assert.deepEqual(GS002_HELP_FIGURE.labels.map(l=>l.value),[7,6,5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7]);
});
