import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {getGs002NewGameTransition,GS002_FRAME_CONTROL,GS002_CONTINUE_TO_GAME} from '../src/modern-lessons/g4-l3-gs002-playback';
import {lessonTextFrameRequestAllowed,validateLessonTextFrameControl} from '../src/lesson-text-frame-control';
import {Gs002IntroHost} from '../src/modern-lessons/g4-l3-gs002-intro-host';
test('GS002 exact authored New Game transitions preserve play versus stop',()=>{
  validateLessonTextFrameControl(GS002_FRAME_CONTROL,428);
  for(let f=1;f<=426;f++)assert.deepEqual(getGs002NewGameTransition(f),{fromFrame:f,toFrame:426,stopFrame:f<263?427:426});
  for(const f of [0,427,Infinity,NaN,1.5])assert.equal(getGs002NewGameTransition(f),null);
  assert.deepEqual(GS002_CONTINUE_TO_GAME,{fromFrame:426,toFrame:427,stopFrame:427});
});
test('GS002 host frame allowlist rejects capture, stale frame, wrong domain and modified stop',()=>{
  for(const e of GS002_FRAME_CONTROL.transitions){
    const current={frame:e.fromFrame,frameDomain:'sprite-321',capture:false};
    assert(lessonTextFrameRequestAllowed(GS002_FRAME_CONTROL,e,current));
    assert(!lessonTextFrameRequestAllowed(GS002_FRAME_CONTROL,e,{...current,capture:true}));
    assert(!lessonTextFrameRequestAllowed(GS002_FRAME_CONTROL,e,{...current,frame:e.fromFrame+1}));
    assert(!lessonTextFrameRequestAllowed(GS002_FRAME_CONTROL,e,{...current,frameDomain:'root'}));
    assert(!lessonTextFrameRequestAllowed(GS002_FRAME_CONTROL,{...e,stopFrame:428},current));
  }
});
test('GS002 host controls require callbacks and modern continuation is identified separately',()=>{
  const art={ship:'ship.png',virus:'virus.png'};
  const disabled=renderToStaticMarkup(<Gs002IntroHost frame={426} art={art}/>);
  assert.doesNotMatch(disabled,/<button/);
  const ready=renderToStaticMarkup(<Gs002IntroHost frame={426} art={art} onLessonFrameRequest={()=>true}/>);
  assert.match(ready,/>New Game<\/button>/);
  assert.match(ready,/data-gs002-copy-authority="modern-current-js"/);
  assert.match(ready,/>Continue to game<\/button>/);
  assert.doesNotMatch(renderToStaticMarkup(<Gs002IntroHost frame={200} art={art} onLessonFrameRequest={()=>true}/>),/Continue to game/);
});
