import type {RuntimeContext} from './contract';
import {P062_CONTENT} from './alg-l07-p062-content-source-v1';
import {P062_REVIEW_SCENES} from './alg-l07-p062-review-source-v1';
import {p062InitialState,p062Random,p062SourceReview,type P062Response} from './alg-l07-p062-state-v1';
export const P062_ID='shared-alg001-l07-p062';
export const P062_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P062_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-1383',frameCount:81,rootFrame:6},{id:'sprite-16',frameCount:2,rootFrame:6}]);
export const P062_DEFAULTS=Object.freeze({'root':'source-quiz','sprite-1383':'source-quiz','sprite-16':'finish-0'});
export function algL07P062Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-1383',scenario:'source-quiz',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-1383',spec=P062_DOMAINS.find(d=>d.id===domain);
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('P062 invalid frame identity');
 const finish=/^finish-(0|[1-9]|10)$/.exec(context.scenario);
 if(domain==='sprite-16'&&!finish||domain!=='sprite-16'&&context.scenario!=='source-quiz')throw Error('P062 invalid frame scenario');
 const main=domain==='root'?1:frame,ready=domain!=='root'||frame>=6;
 // Root entry executes doGetRandomQuiz; this is script initialization, not raw static frame 1.
 const questionId=ready&&(domain==='root'||domain==='sprite-1383'&&main===1)?p062InitialState(p062Random(context.seed)(30)).currentQuestionId:main>=2&&main<=31?main-1:null;
 return{...context,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6,animationId:P062_ID,ready,question:domain==='sprite-16'?null:questionId?P062_CONTENT[questionId-1]!:null,score:finish?Number(finish[1]):null,review:domain==='sprite-1383'&&main>=34&&main<=80?P062_REVIEW_SCENES[main-34]!:null,reviewReachableFromQuiz:false as const,lessonCompleted:false as const};
}
export function p062ReviewInspection(responses:readonly P062Response[],ordinal:number){
 const state=p062SourceReview(responses,ordinal);if(state.kind==='exit')return{state,scene:null,values:{}};
 const values:Record<string,string>={CQ:String(ordinal),TQ:'10',QuestNo:`${ordinal}.`,txtResAns:'ABCD'[state.selected-1]!,txtCorAns:'ABCD'[state.correct-1]!};
 state.feedback.forEach((v,i)=>values[`TxtFeed${i+1}`]=v??'');
 return{state,scene:P062_REVIEW_SCENES[state.frame-34]!,values};
}
export type P062Frame=ReturnType<typeof algL07P062Frame>;
