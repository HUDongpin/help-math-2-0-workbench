import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {P045Chart,p045ChartSectors,type P045ChartNumerator} from '../src/nms-l02-p045-chart-v1';
test('native sectors preserve the three source chart selections with equal area and complete coverage',()=>{
 const source=JSON.parse(readFileSync(new URL('../../../migrations/shared-nms002-l02-p045/audit/chart-geometry-disposition-v1.json',import.meta.url),'utf8'));
 for(const numerator of [2,3,4]as const){const sectors=p045ChartSectors(numerator);
  assert.equal(sectors.length,10);assert.equal(sectors.filter(s=>s.selected).length,numerator);
  assert.equal(source.rows[numerator-2].solidBlueSectorCount,numerator);
  for(let i=0;i<10;i++){assert.equal(sectors[i].endDegrees-sectors[i].startDegrees,36);if(i)assert.equal(sectors[i-1].endDegrees,sectors[i].startDegrees);}
  assert.equal(sectors[9].endDegrees-sectors[0].startDegrees,360);
  assert.deepEqual(sectors.filter(s=>s.selected).map(s=>s.part),numerator===2?[1,10]:numerator===3?[1,9,10]:[1,8,9,10]);
 }
 assert.throws(()=>p045ChartSectors(6 as P045ChartNumerator),/P045_CHART_QUESTION/);
});
test('read-only bilingual chart exposes equivalent descriptions without printing the answer fraction',()=>{
 for(const language of ['en','es']as const)for(const numerator of [2,3,4]as const){
  const html=renderToStaticMarkup(<P045Chart numerator={numerator} language={language}/>);
  assert.equal((html.match(/<path /g)??[]).length,10);assert.equal((html.match(/data-selected="true"/g)??[]).length,numerator);
  assert(html.includes('role="img"'));assert(html.includes(language==='es'?'partes iguales':'equal parts'));
  assert(!html.includes(`${numerator}/10`));assert(!html.includes('<button'));assert(!html.includes('<input'));
 }
});
