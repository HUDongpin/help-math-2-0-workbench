import React,{useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import {Gs002IntroScene} from './g4-l3-gs002-intro-scene';
import {getGs002NewGameTransition,GS002_CONTINUE_TO_GAME} from './g4-l3-gs002-playback';

type Props=Pick<AnimationRendererProps,'frame'|'reducedMotion'|'onLessonFrameRequest'|'onLessonHostRequest'> & {
  art:{ship:string;virus:string};
};
/** No local playback override: a rejected host request leaves the source frame unchanged. */
export function Gs002IntroHost({frame,reducedMotion,art,onLessonFrameRequest,onLessonHostRequest}:Props){
  const [rejectedFrame,setRejectedFrame]=useState<number|null>(null);
  const request=(edge:ReturnType<typeof getGs002NewGameTransition>)=>{
    if(!edge||!onLessonFrameRequest)return;
    setRejectedFrame(onLessonFrameRequest(edge)?null:frame);
  };
  return <div data-gs002-intro-host="true">
    <Gs002IntroScene frame={frame} reducedMotion={reducedMotion} art={art}
      onNewGame={onLessonFrameRequest?()=>request(getGs002NewGameTransition(frame)):undefined}
      onKeyTerm={onLessonHostRequest?(entryId,trigger)=>onLessonHostRequest({type:'open-keyterm',entryId,
        sourceAnimationId:'course-g04-l03-gs-002',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},
        {trigger,keyTermIndexLanguage:'en'}):undefined}/>
    {frame===426&&onLessonFrameRequest?<div data-gs002-copy-authority="modern-current-js" style={{marginTop:'1rem'}}>
      <button type="button" onClick={()=>request(GS002_CONTINUE_TO_GAME)}
        style={{font:'inherit',minHeight:44,padding:'.5rem 1rem',maxWidth:'100%'}}>Continue to game</button>
    </div>:null}
    {rejectedFrame===frame?<p role="status">The lesson could not change frames. Try again when playback is available.</p>:null}
  </div>;
}
