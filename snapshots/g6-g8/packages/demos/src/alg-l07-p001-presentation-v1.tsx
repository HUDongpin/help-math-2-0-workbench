'use client';
import type {AnimationRendererProps} from './contract';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {ALG_L07_P001_SOURCE as SOURCE,algL07P001Frame,type AlgL07P001Frame} from './alg-l07-p001-state-v1';
import './alg-l07-p001-v1.css';

export function AlgL07P001Presentation({state,reducedMotion=false}:{state:AlgL07P001Frame;reducedMotion?:boolean}){
  return <section className="alg-l07-p001" data-animation-id={state.animationId} data-flash-animation-id={state.animationId}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-language={state.language} data-flash-seed={state.seed} data-flash-replay={state.replay}
    data-source-text-ids={state.sourceTextIds.join(',')} data-source-swf-sha256={SOURCE.sourceSha256}>
    <div className="alg-l07-p001__title" style={{opacity:reducedMotion?1:state.alpha,transform:reducedMotion?'none':`scale(${state.scaleX},${state.scaleY})`}}>
      <LessonAnimationTitleV1 courseTitle={SOURCE.courseTitle} activityTitle={SOURCE.activityTitle} language="en"/>
    </div>
  </section>;
}
export function AlgL07P001Renderer(props:AnimationRendererProps){
  return <AlgL07P001Presentation state={algL07P001Frame(props.frame,{...props,frame:props.frame})}/>;
}
