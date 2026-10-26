import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {NmsL02P054LessonRuntimeV1,createP054LessonControls,P054_MATCHING_TOOLBAR_STATE}
 from '../components/nms-l02-p054-lesson-runtime-v1';
test('host pause/resume controls feedback; Replay requests full host epoch reset',()=>{
 const calls:string[]=[];const board={pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),
  stop:()=>calls.push('stop'),setVolume:()=>{}};
 const controls=createP054LessonControls(()=>board,()=>calls.push('paused'));
 controls.narration('play');assert.deepEqual(calls,[]);
 controls.setPaused(false);controls.setPaused(true);controls.narration('stop');
 assert.equal(controls.replay(),false);controls.stop();
 assert.deepEqual(calls,['resume','pause','pause','stop','stop','paused']);
 assert.equal(P054_MATCHING_TOOLBAR_STATE.seekAvailable,false);
 assert.equal(P054_MATCHING_TOOLBAR_STATE.audioAvailable,false);
 assert.equal(P054_MATCHING_TOOLBAR_STATE.frameDomain,'interaction-state');
});
test('only exact source matching context renders both levels without quiz scoring',()=>{
 const base={animationId:'shared-nms002-l02-p054',moduleKey:'shared-nms002-l02-p054',
  query:{frameDomain:'sprite-731',scenario:'source-matching-level-1',lang:'en'},
  uiLanguage:'es'} as unknown as LessonRuntimeAdapterProps;
 for(const level of ['1','2']){
  const html=renderToStaticMarkup(<NmsL02P054LessonRuntimeV1 {...base} query={{...base.query,scenario:`source-matching-level-${level}`}}/>);
  assert.match(html,/data-p054-runtime-status="contextual-candidate"/);
  assert.match(html,new RegExp(`data-p054-level="${level}"`));
  assert.match(html,/data-p054-score="0"/);assert.match(html,/data-p054-phase="selecting"/);
  assert.equal((html.match(/data-source-instance=/g)||[]).length,12);
  assert.doesNotMatch(html,/data-p064-host-score-gate/);
 }
 for(const query of [{...base.query,scenario:'source-matching-level-3'},{...base.query,lang:'es'},
  {...base.query,frameDomain:'root'},{...base.query,scenario:'source-quiz-seeded'}])
  assert.match(renderToStaticMarkup(<NmsL02P054LessonRuntimeV1 {...base} query={query}/>),
   /data-p054-runtime-status="blocked"/);
});
