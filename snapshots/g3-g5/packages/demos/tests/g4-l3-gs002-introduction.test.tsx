import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_INTRODUCTION as source,getGs002Introduction,Gs002IntroductionText} from '../src/modern-lessons/g4-l3-gs002-introduction';

test('GS002427 text states match independent source-instance lifetime queries',()=>{
  const c=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const main=c.timelines.find((t:any)=>t.timelineId==='sprite-321');
  for(const state of source.frames){
    const alive=main.instances.filter((i:any)=>i.firstFrame<=state.frame&&state.frame<i.lastFrameExclusive);
    assert.equal(state.instructionPresent,alive.some((i:any)=>i.characterId===98),`instruction${state.frame}`);
    assert.deepEqual([...state.emphasisSourceIds].sort((a,b)=>a-b),alive.filter((i:any)=>i.characterId>=103&&i.characterId<=112).map((i:any)=>i.characterId).sort((a:number,b:number)=>a-b));
    assert.deepEqual(state.symbols.map(s=>s.characterId).sort(),alive.filter((i:any)=>[102,113,123].includes(i.characterId)).map((i:any)=>i.characterId).sort());
    const instruction=alive.find((i:any)=>i.characterId===98);
    if(instruction){
      const changes=main.events.filter((e:any)=>instruction.updates.includes(e.eventId)&&e.frame<=state.frame&&e.colorTransform);
      assert.equal(state.instructionAlpha,changes.at(-1)?.colorTransform.multiply[3]/256);
    }
  }
  assert.equal(source.frames.length,427);
});

test('GS002 source emphasis is independent from sign transition and distance reveal',()=>{
  assert.equal(getGs002Introduction(90).instructionAlpha,0);
  assert(getGs002Introduction(91).instructionAlpha>0);
  assert.equal(getGs002Introduction(99).instructionAlpha,1);
  assert.equal(getGs002Introduction(104).emphasis,'positive sign');
  assert.equal(getGs002Introduction(105).emphasis,null);
  assert.equal(getGs002Introduction(133).emphasis,'negative sign');
  assert.equal(getGs002Introduction(133).symbols[0].text,'+');
  assert.equal(getGs002Introduction(137).symbols[0].text,'–');
  assert.deepEqual(getGs002Introduction(196).symbols.map(s=>s.text),['–']);
  assert.deepEqual(getGs002Introduction(197).symbols.map(s=>s.text),['–','2']);
  assert.deepEqual(getGs002Introduction(259).symbols.map(s=>s.text),getGs002Introduction(260).symbols.map(s=>s.text));
  assert.equal(getGs002Introduction(425).instructionPresent,true);
  assert.equal(getGs002Introduction(426).instructionPresent,false);
  assert.deepEqual(getGs002Introduction(427).symbols,[]);
});

test('GS002 reduced motion bridges only intra-emphasis gaps and preserves other source timing',()=>{
  for(const state of source.frames){
    const reduced=getGs002Introduction(state.frame,true);
    assert.deepEqual(reduced.symbols,state.symbols);
    assert.equal(reduced.instructionAlpha,state.instructionAlpha);
    assert.equal(reduced.emphasis,state.frame>=104&&state.frame<113?'positive sign':state.frame>=133&&state.frame<144?'negative sign':null);
  }
});

test('GS002 native text has no duplicate blinking letters, Canvas or early final instruction',()=>{
  assert.doesNotMatch(renderToStaticMarkup(<Gs002IntroductionText frame={90}/>),/Click the|<canvas/);
  const html=renderToStaticMarkup(<Gs002IntroductionText frame={104} onKeyTerm={()=>{}}/>);
  assert.equal((html.match(/positive sign/g)??[]).length,2); // one text, one emphasis attribute
  assert.equal((html.match(/data-gs002-keyterm=/g)??[]).length,2);
  assert.match(html,/data-source-text="character-102"/);
  assert.doesNotMatch(html,/<canvas|<svg|data-source-text="character-103"/);
  assert.doesNotMatch(renderToStaticMarkup(<Gs002IntroductionText frame={426}/>),/Click the|intro-symbol/);
});

test('GS002 frame queries and Replay are deterministic without local clocks',()=>{
  const before=getGs002Introduction(104);
  getGs002Introduction(427);getGs002Introduction(1);
  assert.deepEqual(getGs002Introduction(104),before);
  assert.equal(getGs002Introduction(-1).frame,1);
  assert.equal(getGs002Introduction(999).frame,427);
});
