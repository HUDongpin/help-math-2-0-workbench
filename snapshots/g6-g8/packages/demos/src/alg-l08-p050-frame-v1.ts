import type {RuntimeContext} from './contract';
import {P050_SOURCE as S} from './alg-l08-p050-source-v1';
export const P050_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P050_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-960',frameCount:69,rootFrame:6}]);
export const P050_DEFAULTS=Object.freeze({root:'source-quiz','sprite-960':'source-quiz'});
/** Stateless source inspection is separate from the live quiz. In particular
 * review inspection does not fabricate a response, score or feedback color. */
export function algL08P050Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-960',scenario:'source-quiz',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-960',spec=P050_DOMAINS.find(d=>d.id===domain);
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||!['en','es'].includes(context.lang)||context.scenario!=='source-quiz')throw Error('P050 invalid inspection identity');
 const main=domain==='root'?1:frame,ready=domain!=='root'||frame>=6;
 // Same first draw as the maintained P050Session; no Flash PRNG parity claim.
 const first=1+Math.floor(((Math.imul(context.seed,1664525)+1013904223)>>>0)/4294967296*24);
 const questionId=ready&&(domain==='root'||main===1)?first:main>=2&&main<=25?main-1:null;
 const reviewId=domain==='sprite-960'&&main>=45&&main<=68?main-44:null;
 return {...context,frameDomain:domain,rootFrame:domain==='root'?frame:6,animationId:S.animationId,ready,question:questionId?S.questions[questionId-1]!:null,review:reviewId?S.questions[reviewId-1]!:null,reviewIntro:domain==='sprite-960'&&main>=28&&main<=44?S.reviewIntro[main-28]!:null,emptySourceHold:domain==='sprite-960'&&[26,27,69].includes(main),lessonCompleted:false as const};
}
