'use client';
import type {AnimationRendererProps} from './contract';
import {algL07P062Frame} from './alg-l07-p062-frame-v1';
import {P062QuestionView} from './alg-l07-p062-presentation-v1';
import {P062ReviewScene} from './alg-l07-p062-scene-v1';
export function AlgL07P062Renderer(props:AnimationRendererProps){
 const state=algL07P062Frame(props.frame,props);
 return <div className="alg-l07-p062" data-animation-id={state.animationId} data-frame-domain={state.frameDomain} data-frame={state.frame} data-source-review-reachable="false">{state.ready&&(state.question?<P062QuestionView question={state.question} ordinal={1} uiLanguage={state.lang} disabled/>:state.score!==null?<section className="alg-l07-p062__finish" lang="en"><h3 data-source-text-id="character-13">You have completed the quiz.</h3><p data-source-text-id="character-14 character-15">Your score is {state.score} / 10.</p><button disabled type="button">Continue</button></section>:state.review?<P062ReviewScene scene={state.review}/>:null)}</div>;
}
