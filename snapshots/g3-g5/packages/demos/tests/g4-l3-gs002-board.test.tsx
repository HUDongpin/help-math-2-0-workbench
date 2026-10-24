import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_GAME_AXIS,Gs002GameBoard} from '../src/modern-lessons/g4-l3-gs002-board';
import {COURSE_G04_L03_GS_002_SHIP_Y,COURSE_G04_L03_GS_002_VIRUS_Y,
  createCourseG04L03Gs002InteractionState,reduceCourseG04L03Gs002Interaction} from '../src/timelines/course-g04-l03-gs-002-interaction';
const art={ship:'data:image/png;base64,c2hpcA==',virus:'data:image/png;base64,dmlydXM='};

test('GS002 axis labels and instances match source catalog independently of generated rows',()=>{
  const catalog=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const main=catalog.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-321');
  assert.equal(GS002_GAME_AXIS.rows.length,15);
  for(const row of GS002_GAME_AXIS.rows) {
    const definition=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===row.characterId);
    assert.equal(row.label,definition.runs.map((r:{text:string})=>r.text).join(''));
    assert.equal(row.sourceTagSha256,definition.sourceTagSha256);
    const place=main.events.find((e:{frame:number;characterId:number})=>e.frame===427&&e.characterId===row.characterId);
    assert.deepEqual(row.matrix,place.matrix);
    assert.equal(row.instanceId,place.instanceId);
    assert.equal(row.value,7-row.index);
    if(row.value>0)assert.doesNotMatch(row.label,/\+/);
  }
});

test('GS002 maps art centers, not registration origins, into source-authored rows',()=>{
  assert.equal(GS002_GAME_AXIS.rowBoundariesTwips.length,16);
  for(const row of GS002_GAME_AXIS.rows) {
    assert.equal(row.shipY,COURSE_G04_L03_GS_002_SHIP_Y[row.index]);
    assert.equal(row.virusY,COURSE_G04_L03_GS_002_VIRUS_Y[row.index]);
    for(const center of [row.sourceTextCenterYTwips,row.sourceShipCenterYTwips,row.sourceVirusCenterYTwips]) {
      assert(center>row.boundsYTwips[0]&&center<row.boundsYTwips[1]);
    }
  }
  // Regression: source row4 origin is above its boundary, but the ship itself is in row4.
  const row=GS002_GAME_AXIS.rows[4];
  assert(row.shipY*20<row.boundsYTwips[0]);
  assert(row.sourceShipCenterYTwips>row.boundsYTwips[0]);
});

test('GS002 renders all fifteen native labels for every ship/virus row pair',()=>{
  for(let shipIndex=0;shipIndex<15;shipIndex++)for(let virusIndex=0;virusIndex<15;virusIndex++) {
    const html=renderToStaticMarkup(<Gs002GameBoard art={art} state={{shipIndex,virusIndex,mode:'ready'}}/>);
    assert.equal((html.match(/data-lesson-text-block="game-tick-/g)??[]).length,15);
    assert.equal((html.match(/data-gs002-ship-row=/g)??[]).length,1);
    assert.equal((html.match(/data-gs002-virus-row=/g)??[]).length,1);
    assert.match(html,new RegExp(`data-gs002-ship-row="${shipIndex}"`));
    assert.match(html,new RegExp(`data-gs002-virus-row="${virusIndex}"`));
    assert.doesNotMatch(html,/<canvas/);
    assert.match(html,/font-size:1\.125rem/);
    assert.match(html,/overflow-x:auto/);
  }
});

test('GS002 movement and Replay change diagram membership using the existing reducer only',()=>{
  let state=createCourseG04L03Gs002InteractionState(0);
  state=reduceCourseG04L03Gs002Interaction(state,{type:'set-sign',sign:'+'});
  state=reduceCourseG04L03Gs002Interaction(state,{type:'set-distance',value:'7'});
  state=reduceCourseG04L03Gs002Interaction(state,{type:'submit-move'});
  for(let row=6;row>=0;row--) {
    state=reduceCourseG04L03Gs002Interaction(state,{type:'movement-step'});
    assert.match(renderToStaticMarkup(<Gs002GameBoard art={art} state={state}/>),new RegExp(`data-gs002-ship-row="${row}"`));
  }
  state=reduceCourseG04L03Gs002Interaction(state,{type:'replay'});
  assert.match(renderToStaticMarkup(<Gs002GameBoard art={art} state={state}/>),/data-gs002-ship-row="7"/);
});

test('GS002 invalid positions fail instead of silently hiding a required game object',()=>{
  for(const index of [-1,15,0.5,NaN])assert.throws(()=>renderToStaticMarkup(
    <Gs002GameBoard art={art} state={{shipIndex:index,virusIndex:0,mode:'ready'}}/>),/outside source rows/);
});

test('source hit occupies only the matched actor row while all native labels remain',()=>{
 for(const index of [0,7,14])for(const frame of [12,23,25,28]){
  const html=renderToStaticMarkup(<Gs002GameBoard art={art} state={{shipIndex:index,virusIndex:index,mode:'hit-resolving'}} hitFrame={frame}/>);
  assert.equal((html.match(/data-lesson-text-block="game-tick-/g)??[]).length,15);
  assert.equal((html.match(/data-gs002-hit-row=/g)??[]).length,1);
  assert.match(html,new RegExp(`data-gs002-hit-row="${index}"`));
  assert.match(html,new RegExp(`data-source-activity-frame="${frame}"`));
  assert.equal((html.match(/alt="Space coupe"/g)??[]).length,1);
  assert.doesNotMatch(html,/alt="Virus"/,'no duplicate resting bitmap behind burst');
  if(frame===28)assert.doesNotMatch(html,/data-source-shape=|data-gs002-row-beam=/);
 }
 for(const mode of ['ready','moving'] as const)assert.doesNotMatch(renderToStaticMarkup(
  <Gs002GameBoard art={art} state={{shipIndex:0,virusIndex:0,mode}} hitFrame={23}/>),/data-gs002-hit-row/);
 const reduced=renderToStaticMarkup(<Gs002GameBoard art={art} state={{shipIndex:7,virusIndex:7,mode:'hit-resolving'}} hitFrame={23} reducedMotion/>);
 assert.match(reduced,/data-source-shape="63"/);assert.doesNotMatch(reduced,/data-gs002-row-beam=/);
});
