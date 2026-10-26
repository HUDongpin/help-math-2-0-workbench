'use client';
import React from 'react';
import type {AnimationModule,AnimationRendererProps} from '../contract';
import {P060QuizPlayer} from '../alg-l06-p060-player-v1';
import type {P060State} from '../alg-l06-p060-state-v1';
import {P060_TIMELINE,getP060InitialFrameState} from '../timelines/shared-alg001-l06-context-v3-p060';
export const P060_QUIZ_STOP = Object.freeze({id:'p060-final-quiz',frameDomain:'sprite-973',stopFrame:1,resumeFrame:2,
  resolution:'explicit-source-control-finished' as const,completionDisposition:'blocked-while-unresolved' as const,
  rendererStateOnResume:'preserve' as const,requiresHostInteractiveStop:true as const,strictAcceptanceEffect:'none' as const});
function P060NativeRenderer(props:AnimationRendererProps) {
  // The exact My Lesson adapter supplies its volume and scoped media loader.
  if(props.audioEnabled===true)return <p role="alert">The quiz is unavailable in this view.</p>;
  return <P060QuizPlayer key={`${props.seed}:${props.replay??0}`} seed={props.seed} uiLanguage={props.uiLanguage??props.lang}
    paused={props.paused} audioEnabled={false} readAudio={async()=>{throw Error('P060_SCOPED_AUDIO_ADAPTER_REQUIRED');}}
    onReplay={props.onReplay} onComplete={()=>props.onInteractiveStopResolved?.({stopId:P060_QUIZ_STOP.id,frameDomain:'sprite-973',
      resolution:P060_QUIZ_STOP.resolution,source:'maintained-source-derived-interaction'})}/>;
}
const movie=Object.freeze({stage:P060_TIMELINE.stage,fps:12,frameCount:10,durationMs:10000/12});
const animationModule:AnimationModule<P060State> & {privateAlgL06P060:Readonly<{version:1;sourceSwfSha256:string;questionCount:24;sessionQuestionCount:10;sourceAudioFiles:240}>}=Object.freeze({
  key:P060_TIMELINE.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-973',
    frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-973',frameCount:69,rootFrame:6}])}),
  maturity:'private-current-js',playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:6,'sprite-973':1}),reducedMotionFrame:1,
  interactiveStops:Object.freeze([P060_QUIZ_STOP]),scenarios:Object.freeze([{id:'source-quiz',label:'Maintained source quiz initial session'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-quiz','sprite-973':'source-quiz'}),audioCues:Object.freeze([]),
  Renderer:P060NativeRenderer,getFrameState:getP060InitialFrameState,
  privateAlgL06P060:Object.freeze({version:1,sourceSwfSha256:P060_TIMELINE.sourceSwfSha256,questionCount:24,sessionQuestionCount:10,sourceAudioFiles:240}),
});
export default animationModule;
