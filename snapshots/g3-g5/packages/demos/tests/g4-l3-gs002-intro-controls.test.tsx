import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_INTRO_CONTROLS as source,getGs002IntroControls,Gs002IntroControls} from '../src/modern-lessons/g4-l3-gs002-intro-controls';
import {Gs002IntroScene} from '../src/modern-lessons/g4-l3-gs002-intro-scene';

test('GS002 all426pointer/caret/highlight states match independent source lifetimes',()=>{
  const c=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const t=c.timelines.find((t:any)=>t.timelineId==='sprite-321');
  for(const s of source.frames){
    const alive=t.instances.filter((i:any)=>i.firstFrame<=s.frame&&s.frame<i.lastFrameExclusive);
    assert.equal(s.caret,alive.find((i:any)=>i.characterId>=114&&i.characterId<=122)?.characterId??null);
    assert.equal(s.newGameHighlight,alive.find((i:any)=>i.characterId>=125&&i.characterId<=132)?.characterId??null);
    const pointer=alive.find((i:any)=>i.characterId===100);
    const updates=pointer?t.events.filter((e:any)=>pointer.updates.includes(e.eventId)&&e.frame<=s.frame&&e.matrix):[];
    assert.deepEqual(s.pointer,updates.at(-1)?.matrix??null);
  }
});
test('GS002 source blink versus reduced-motion cues preserve appearance boundaries',()=>{
  assert.equal(getGs002IntroControls(178).caretVisible,false);
  assert.equal(getGs002IntroControls(179).caretVisible,true);
  assert.equal(getGs002IntroControls(180).caretVisible,false);
  assert.equal(getGs002IntroControls(180,true).caretVisible,true);
  assert.equal(getGs002IntroControls(196,true).caretVisible,false);
  assert.equal(getGs002IntroControls(346).highlightVisible,true);
  assert.equal(getGs002IntroControls(347).highlightVisible,false);
  assert.equal(getGs002IntroControls(347,true).highlightVisible,true);
  assert.equal(getGs002IntroControls(361,true).highlightVisible,false);
  assert.equal(getGs002IntroControls(262).controls.some(c=>c.role==='go'),true);
  assert.equal(getGs002IntroControls(263).controls.some(c=>c.role==='go'),false);
});
test('GS002 composed intro shows symbols once, live control labels and noninteractive demo',()=>{
  const html=renderToStaticMarkup(<Gs002IntroScene frame={197} art={{ship:'ship.png',virus:'virus.png'}}/>);
  assert.equal((html.match(/data-lesson-text-block="intro-symbol-123"/g)??[]).length,1);
  assert.equal((html.match(/data-lesson-text-block="intro-symbol-113"/g)??[]).length,1);
  assert.match(html,/>New Game<\/span>/);
  assert.match(html,/>Go<\/span>/);
  assert.doesNotMatch(html,/<canvas|<input|<button/);
  assert.equal((html.match(/data-lesson-text-block="intro-tick-/g)??[]).length,15);
  assert.match(renderToStaticMarkup(<Gs002IntroControls frame={346}/>),/#fff2a3/);
});
