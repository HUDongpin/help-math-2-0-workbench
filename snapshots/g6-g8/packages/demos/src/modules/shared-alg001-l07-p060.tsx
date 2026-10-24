'use client';
import type{AnimationModule,AnimationRendererProps}from'../contract';
import{createFunctionQuestionFrames,FUNCTION_QUESTION_MOVIE as movie}from'../alg-l07-function-question-frame-v1';
import{FunctionQuestionPresentation}from'../alg-l07-function-question-presentation-v1';
import{ALG_L07_P060_SOURCE as S}from'../alg-l07-p060-source-v1';
export const frames=createFunctionQuestionFrames(S);
function Renderer(props:AnimationRendererProps){return <FunctionQuestionPresentation view={frames.frame(props.frame,{...props,frame:props.frame})}/>;}
const animationModule:AnimationModule<ReturnType<typeof frames.frame>>=Object.freeze({key:S.animationId,movie,runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-358',frameDomains:frames.domains}),maturity:'private-current-js',playbackMode:'once',reducedMotionFrame:1,scenarios:[{id:'source-question',label:'Source question'},{id:'step-3',label:'Enlarged step 3'},{id:'step-4',label:'Enlarged step 4'},{id:'help',label:'Source help'},{id:'right-feedback',label:'Source right feedback'},...['first','second'].flatMap(n=>['A','B','C','D'].filter(letter=>letter!=='B').map(letter=>({id:`wrong-${n}-${letter}`,label:`Source ${n} wrong ${letter}`})))],defaultScenarioByFrameDomain:frames.defaults,audioCues:[],Renderer,getFrameState:frames.frame});export default animationModule;
