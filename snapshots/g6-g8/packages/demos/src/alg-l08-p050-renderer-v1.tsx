'use client';
import type {AnimationRendererProps} from './contract';
import {algL08P050Frame} from './alg-l08-p050-frame-v1';
import {AlgL08P050Presentation,P050SourceScene} from './alg-l08-p050-presentation-v1';
import {initialP050Quiz} from './alg-l08-p050-quiz-state-v1';
/** Existing reviewed presentation for question inspection; review renders its
 * source scene without inventing a learner response. Live behavior uses Player. */
export function AlgL08P050Renderer(props:AnimationRendererProps){
 const view=algL08P050Frame(props.frame,{...props,scenario:props.scenario??'source-quiz'}),state=view.question?initialP050Quiz(view.question.id-1):null;
 return <div className="p050-quiz" data-animation-id={view.animationId} data-frame-domain={view.frameDomain} data-frame={view.frame} data-source-inspection-only="true">{view.ready&&(state?<AlgL08P050Presentation state={state} owner={{epoch:0,questionId:state.currentQuestionId}} uiLanguage={view.lang} audioPolicy={{question:false,questionSpanish:false,answers:false,answersSpanish:false}} activeAudioId={null} pendingAudioId={null} disabled elapsedText="" onAnswer={()=>{}} onAudio={()=>{}} onReview={()=>{}} onNext={()=>{}} onExit={()=>{}}/>:view.review?<section lang="en"><h2>{view.review.review.prompt.text}</h2><P050SourceScene scene={view.review.review.fullReviewScene} label={view.review.review.prompt.text}/></section>:view.reviewIntro?<h2 lang="en" style={{opacity:(view.frame-28)/16,transform:`scale(${view.reviewIntro.matrix[0]})`}}>{view.reviewIntro.sourceText}</h2>:null)}</div>;
}
