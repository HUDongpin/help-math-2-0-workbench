import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_INTRO_BOARD as source,Gs002IntroBoard,getGs002IntroBoard} from '../src/modern-lessons/g4-l3-gs002-intro-board';

test('GS002 intro actors match latest source placement independently for all426frames',()=>{
  const c=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const main=c.timelines.find((t:any)=>t.timelineId==='sprite-321');
  for(const s of source.frames)for(const actor of Object.values(s.actors)){
    const alive=main.instances.filter((i:any)=>i.characterId===actor.characterId&&i.firstFrame<=s.frame&&s.frame<i.lastFrameExclusive);
    assert.deepEqual(alive.map((i:any)=>i.depth).sort((a:number,b:number)=>a-b),actor.depths);
    for(const i of alive){
      const updates=main.events.filter((e:any)=>i.updates.includes(e.eventId)&&e.frame<=s.frame&&e.matrix);
      assert.deepEqual(updates.at(-1).matrix,actor.matrix);
    }
  }
});

test('GS002 intro retains source steps, target position and deterministic Replay',()=>{
  assert.deepEqual(source.movementFrames,[260,263]);
  assert.equal(getGs002IntroBoard(259).actors.ship.matrix[5],-147);
  assert.equal(getGs002IntroBoard(260).actors.ship.matrix[5],301);
  assert.equal(getGs002IntroBoard(262).actors.ship.matrix[5],301);
  assert.equal(getGs002IntroBoard(263).actors.ship.matrix[5],845);
  assert.equal(getGs002IntroBoard(426).actors.ship.matrix[5],845);
  assert.equal(getGs002IntroBoard(1).actors.ship.matrix[5],-147);
  assert.equal(new Set(source.frames.map(s=>s.actors.virus.centerY)).size,1);
});

test('GS002 intro has15live axis labels and one instance of each original actor',()=>{
  for(const frame of [1,104,133,137,259,260,263,426]){
    const html=renderToStaticMarkup(<Gs002IntroBoard frame={frame} art={{ship:'ship.png',virus:'virus.png'}}/>);
    assert.equal((html.match(/data-lesson-text-block="intro-tick-/g)??[]).length,15);
    assert.equal((html.match(/alt="Space coupe"/g)??[]).length,1);
    assert.equal((html.match(/alt="Virus"/g)??[]).length,1);
    assert.doesNotMatch(html,/<canvas|transition:|animation:/);
  }
});
