import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GS002_COPY,Gs002Instructions,Gs002GameStatus,Gs002FeedbackText,Gs002IntroStatus} from '../src/modern-lessons/g4-l3-gs002-copy';
import {createCourseG04L03Gs002InteractionState,reduceCourseG04L03Gs002Interaction,COURSE_G04_L03_GS_002_FEEDBACK} from '../src/timelines/course-g04-l03-gs-002-interaction';

test('GS002 popup text exactly matches independent source catalog definitions',()=>{
  const catalog=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../../catalog/typography-v1/source-catalog/assets/d1786d2ed78cdea13793ae7a61196c97bfb7fa6b8658af0035c1c47bbfb0bf29.json.gz',import.meta.url))).toString());
  const timer=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===77);
  const score=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===83);
  assert.equal(GS002_COPY.introStatus.timerInitialText,timer.initialText.text);
  assert.equal(GS002_COPY.introStatus.timerSourceTagSha256,timer.sourceTagSha256);
  assert.equal(GS002_COPY.introStatus.scoreSourceTagSha256,score.sourceTagSha256);
  assert.equal(score.initialText,null);
  const main=catalog.timelines.find((t:{timelineId:string})=>t.timelineId==='sprite-321');
  for(let frame=1;frame<=426;frame++)for(const id of [71,72,73,74,78,90])
    assert(main.instances.some((i:{characterId:number;firstFrame:number;lastFrameExclusive:number})=>
      i.characterId===id&&i.firstFrame<=frame&&frame<i.lastFrameExclusive));
  for(const block of [GS002_COPY.title,GS002_COPY.introHelpLabel,...GS002_COPY.instructions,...GS002_COPY.help,GS002_COPY.introInstruction,...Object.values(GS002_COPY.labels)]) {
    const definition=catalog.textDefinitions.find((t:{characterId:number})=>t.characterId===block.characterId);
    assert.equal(block.text,definition.runs.map((r:{text:string})=>r.text).join(''));
    assert.equal(block.sourceTagSha256,definition.sourceTagSha256);
  }
});

test('GS002 instruction and help surfaces remain distinct real text, not images',()=>{
  const instructions=renderToStaticMarkup(<Gs002Instructions kind="instructions" onKeyTerm={()=>{}}/>);
  const help=renderToStaticMarkup(<Gs002Instructions kind="help"/>);
  assert.match(instructions,/Then click the box/);
  assert.match(instructions,/Click the New Game button/);
  assert.equal((instructions.match(/data-gs002-keyterm=/g)??[]).length,2);
  assert.match(help,/Positive numbers make the space coupe go up\./);
  assert.match(help,/Negative numbers make the space coupe go down\./);
  assert.doesNotMatch(help,/Click the New Game/);
  assert.doesNotMatch(instructions+help,/<canvas|<img|font-size:\d+px/);
  assert.match(instructions,/lang="en"/);
});

test('GS002 dictionary entries are exact source-linked local entries',()=>{
  const dictionary=JSON.parse(fs.readFileSync(new URL('../../../apps/web/public/generated/g4-grade-wide-keyterms-en.json',import.meta.url),'utf8'));
  for(const [title,id] of Object.entries(GS002_COPY.keyTerms)) {
    assert.equal(dictionary.entries.find((e:{id:string})=>e.id===id).titles.en,title);
  }
});

test('GS002 status reads existing reducer state, including time, score and Replay',()=>{
  let state=createCourseG04L03Gs002InteractionState(0);
  let markup=renderToStaticMarkup(<Gs002GameStatus state={state}/>);
  assert.match(markup,/00:04:00/);
  state=reduceCourseG04L03Gs002Interaction(state,{type:'advance-time',elapsedMs:1000});
  markup=renderToStaticMarkup(<Gs002GameStatus state={state}/>);
  assert.match(markup,/00:03:59/);
  state=reduceCourseG04L03Gs002Interaction(state,{type:'set-sign',sign:'+'});
  state=reduceCourseG04L03Gs002Interaction(state,{type:'set-distance',value:'7'});
  state=reduceCourseG04L03Gs002Interaction(state,{type:'submit-move'});
  for(let i=0;i<7;i++)state=reduceCourseG04L03Gs002Interaction(state,{type:'movement-step'});
  assert.equal(state.score,1);
  assert.match(renderToStaticMarkup(<Gs002GameStatus state={state}/>),/character-83[^>]*>1<\/dd>/);
  state=reduceCourseG04L03Gs002Interaction(state,{type:'replay'});
  assert.equal(state.score,0);
  assert.equal(state.timerDisplay,'00:04:00');
});

test('GS002 modern feedback never acquires a false source text binding',()=>{
  for(const text of GS002_COPY.feedback) {
    assert.match(renderToStaticMarkup(<Gs002FeedbackText text={text}/>),/data-gs002-copy-authority="source-script"/);
  }
  const zero=renderToStaticMarkup(<Gs002FeedbackText text={COURSE_G04_L03_GS_002_FEEDBACK.zeroDistance}/>);
  assert.match(zero,/data-gs002-copy-authority="modern-current-js"/);
  assert.doesNotMatch(zero,/data-source-text=/);
});

test('GS002 introduction status preserves source zero-time but never invents an external score',()=>{
  for(let frame=1;frame<=426;frame++){
    const markup=renderToStaticMarkup(<Gs002IntroStatus frame={frame}/>);
    assert.match(markup,/00:00:00/);
    assert.match(markup,/aria-label="Score not initialized"/);
    assert.match(markup,/data-source-value-authority="unresolved-external-global"/);
    assert.doesNotMatch(markup,/00:04:00|data-source-text="character-83"/);
  }
  for(const frame of [0,427,428,NaN,Infinity,1.5])assert.equal(renderToStaticMarkup(<Gs002IntroStatus frame={frame}/>),'');
});
