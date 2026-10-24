'use client';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import type {SourceTitleConfigV1,SourceTitleFrameV1} from './source-title-state-v1';
import './source-title-v1.css';

export function SourceTitlePresentationV1({source,state,reducedMotion=false}:{source:SourceTitleConfigV1;state:SourceTitleFrameV1;reducedMotion?:boolean}){
  return <section className="source-title-v1" data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay}
    data-source-text-ids={state.sourceTextIds.join(',')} data-source-swf-sha256={source.sourceSha256}
    style={{backgroundColor:source.backgroundColor}}>
    <div className="source-title-v1__title" style={{opacity:reducedMotion?1:state.alpha,transform:reducedMotion?'none':`scale(${state.scaleX},${state.scaleY})`}}>
      <LessonAnimationTitleV1 courseTitle={source.courseTitle} activityTitle={source.activityTitle} language="en"/>
    </div>
  </section>;
}
