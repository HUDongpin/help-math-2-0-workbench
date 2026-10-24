import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextActivityRequest} from '../lesson-text-contract';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {createZogXQuestionPool,drawZogXQuestion,type ZogXQuestionPool} from './g4-l4-zog-x-question-pool';

const questionFrames=game.questions.map(q=>q.frame);
const correctId=(stage:number)=>`g4-l4-zog-x-correct-${stage}`;
const wrongId='g4-l4-zog-x-wrong';
const wrongCloseId='g4-l4-zog-x-wrong-close';
const endingId='g4-l4-zog-x-ending';
/** Source clock definitions only. The page must attach the independently
 * extracted audio cues before these definitions become a runtime binding. */
export const ZOG_X_GAME_CLOCKS:readonly LessonTextActivityDefinition[]=[
 ...game.feedback.map(f=>({id:correctId(f.stage),sourceInstanceId:f.sourceInstanceId,parentLifetime:f.parentLifetime,
  frameDomain:f.frameDomain,startFrame:f.startFrame,endFrame:f.endFrame,fps:game.fps,parentFrames:questionFrames})),
 {id:wrongId,...game.wrongFeedback,endFrame:game.wrongFeedback.holdFrame,fps:game.fps,parentFrames:questionFrames},
 // The source65 overflow reports60, holds for one tick, then wraps to1.
 // It does not execute the ordinary frame60 parent.play action.
 {id:wrongCloseId,...game.wrongFeedback,startFrame:60,endFrame:60,holdEndFrame:true,fps:game.fps,parentFrames:questionFrames,
  entryFromActivity:{id:wrongId,firstFrame:game.wrongFeedback.popupFirstFrame,lastFrame:game.wrongFeedback.holdFrame}},
 {id:endingId,...game.ending,fps:game.fps,parentFrames:[game.finalFrame]},
];
export const ZOG_X_GAME_FRAME_CONTROL={frameDomain:game.frameDomain,completionFrame:game.finalFrame,
 transitions:[
  ...Array.from({length:game.readyFrame-1},(_,i)=>({fromFrame:i+1,toFrame:game.readyFrame,stopFrame:game.readyFrame})),
  ...questionFrames.map(toFrame=>({fromFrame:game.readyFrame,toFrame,stopFrame:toFrame})),
  ...questionFrames.flatMap(fromFrame=>[...questionFrames,game.finalFrame].map(toFrame=>({fromFrame,toFrame,stopFrame:toFrame}))),
 ]} as const;
interface OwnedClock {readonly id:string;readonly floor:number;readonly revision:number|null;readonly token:string|null}
interface Feedback {readonly kind:'correct'|'wrong';readonly question:number;readonly stage:number;readonly remembered:boolean}
export interface ZogXSession {
 readonly seed:number;readonly replay:number;readonly pool:ZogXQuestionPool|null;
 readonly pendingFrame:Readonly<{from:number;to:number}>|null;
 readonly directions:boolean;readonly feedback:Feedback|null;
 readonly correct:OwnedClock|null;readonly wrong:OwnedClock|null;readonly ending:OwnedClock|null;
 readonly hiddenCorrect:readonly OwnedClock[];
 readonly pendingWrongDraw:ZogXQuestionPool|null;
}
export const createZogXSession=(seed=0,replay=0):ZogXSession=>({seed:seed>>>0,replay,pool:null,pendingFrame:null,
 directions:false,feedback:null,correct:null,wrong:null,ending:null,hiddenCorrect:[],pendingWrongDraw:null});
const definition=(id:string)=>ZOG_X_GAME_CLOCKS.find(d=>d.id===id)!;
const activities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
function observed(c:OwnedClock|null,all:readonly LessonTextActivitySnapshot[]){
 if(!c)return undefined;const d=definition(c.id);
 const matches=all.filter(a=>a.id===c.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain
  &&Number.isSafeInteger(a.revision)&&a.revision>c.floor&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame
  &&(a.status==='playing'||a.status==='completed')&&(a.status!=='completed'||a.frame===d.endFrame)
  &&a.cancellationToken&&(c.revision===null||a.revision===c.revision)&&(c.token===null||a.cancellationToken===c.token));
 return matches.length===1?matches[0]:undefined;
}
function bind(c:OwnedClock|null,all:readonly LessonTextActivitySnapshot[]):OwnedClock|null {
 const a=observed(c,all);return c&&c.revision===null&&a?{...c,revision:a.revision,token:a.cancellationToken!}:c;
}
function requestClock(id:string,r:AnimationRendererProps,fromActivity?:LessonTextActivityRequest['fromActivity']):OwnedClock|null {
 const d=definition(id),floor=Math.max(-1,...activities(r).filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision));
 return r.onLessonActivityRequest?.({id,parentFrame:r.frame,...fromActivity?{fromActivity}:{}})===true?{id,floor,revision:null,token:null}:null;
}
function seek(r:AnimationRendererProps,to:number){return r.onLessonFrameRequest?.({fromFrame:r.frame,toFrame:to,stopFrame:to})===true;}
const pending=(from:number,to:number)=>from===to?null:{from,to};
function permitted(s:ZogXSession,r:AnimationRendererProps){return (r.lang==='en'||r.lang==='es')&&r.scenario==='source-static-frame'
 &&!r.entryStateSha256&&!r.paused&&(r.frameDomain??game.frameDomain)===game.frameDomain&&(r.rootFrame??game.rootFrame)===game.rootFrame
 &&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay&&(!s.pendingFrame||r.frame===s.pendingFrame.to);}

/** Source-controlled question seeks retain the same placed feedback instance.
 * Replay, an unrelated seek, or disappearance of a bound clock resets the game. */
export function synchronizeZogXSession(s:ZogXSession,r:RuntimeContext,all:readonly LessonTextActivitySnapshot[]=[]):ZogXSession {
 const reset=()=>createZogXSession(r.seed,r.replay??0);
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??game.frameDomain)!==game.frameDomain||(r.rootFrame??game.rootFrame)!==game.rootFrame)return reset();
 if(s.pendingFrame){if(r.frame===s.pendingFrame.from)return s;if(r.frame!==s.pendingFrame.to)return reset();}
 if(s.pool&&s.pool.frame!==r.frame)return reset();
 if(s.pendingFrame&&r.frame===game.finalFrame)return {...s,pendingFrame:null,correct:null,wrong:null,hiddenCorrect:[]};
 const owned=[...s.hiddenCorrect,s.correct,s.wrong,s.ending].filter((c):c is OwnedClock=>c!==null);
 if(owned.some(c=>c.revision!==null&&!observed(c,all)))return reset();
 const correct=bind(s.correct,all),wrong=bind(s.wrong,all),ending=bind(s.ending,all);
 return s.pendingFrame||correct!==s.correct||wrong!==s.wrong||ending!==s.ending?{...s,pendingFrame:null,correct,wrong,ending}:s;
}
function continueWrongDraw(s:ZogXSession,r:AnimationRendererProps):ZogXSession {
 const pool=s.pendingWrongDraw;if(!pool||!seek(r,pool.frame))return s;
 return {...s,pool,feedback:null,pendingWrongDraw:null,pendingFrame:pending(r.frame,pool.frame)};
}
export type ZogXHostAction={readonly type:'skip'|'start'|'repeat'|'close-directions'|'close-wrong'|'observe'}|{readonly type:'answer';readonly choice:string};
/** State commits follow host acceptance. Feedback is driven by the host's
 * source clock, including a skipped RAF crossing frame 5, never a local timer.
 * Wrong Close has two accepted host operations. If the child starts but the
 * parent seek is rejected, retain that accepted child and retry only the
 * pending parent operation; never claim the two calls were atomic. */
export function dispatchZogX(s:ZogXSession,a:ZogXHostAction,r:AnimationRendererProps):ZogXSession {
 if(!permitted(s,r))return s;
 if(a.type==='skip'){
  if(s.pool||s.directions||r.frame<1||r.frame>=game.readyFrame||!seek(r,game.readyFrame))return s;
  return {...s,pendingFrame:pending(r.frame,game.readyFrame)};
 }
 if(a.type==='start'){
  if(s.pool||s.directions||r.frame!==game.readyFrame)return s;
  const pool=drawZogXQuestion(createZogXQuestionPool(s.seed));if(!seek(r,pool.frame))return s;
  return {...s,pool,pendingFrame:pending(r.frame,pool.frame)};
 }
 if(a.type==='repeat'){
  if(s.directions||r.frame<game.readyFrame||r.frame>=game.finalFrame)return s;
  return {...s,directions:true};
 }
 if(a.type==='close-directions')return s.directions?{...s,directions:false}:s;
 if(!s.pool||s.pool.frame!==r.frame)return s;
 if(a.type==='close-wrong'){
  const intent=zogXWrongCloseIntent(s,r);if(!intent)return s;
  const wrong=requestClock(wrongCloseId,r,{id:intent.fromActivity.id,revision:intent.fromActivity.revision});if(!wrong)return s;
  return continueWrongDraw({...s,wrong,pendingWrongDraw:intent.nextPool},r);
 }
 if(a.type==='observe'&&s.pendingWrongDraw)return continueWrongDraw(s,r);
 if(a.type==='answer'){
  if(s.feedback||s.directions||!s.pool.quizSection)return s;
  const q=game.questions.find(q=>q.id===s.pool!.question),answer=q?.answers.find(x=>x.id===a.choice);if(!q||!answer)return s;
  const stage=s.pool.correctSelect+1;
  const child=requestClock(answer.correct?correctId(stage):wrongId,r);if(!child)return s;
  return {...s,pool:answer.correct?{...s.pool,correctSelect:stage}:s.pool,
   correct:answer.correct?child:s.correct,wrong:answer.correct?s.wrong:child,
   hiddenCorrect:answer.correct&&s.correct?[...s.hiddenCorrect,s.correct]:s.hiddenCorrect,
   feedback:{kind:answer.correct?'correct':'wrong',question:q.id,stage,remembered:false}};
 }
 // An ending MovieClip starts on placement at main frame 602, while the main
 // timeline remains stopped. It owns a distinct clock through source frame112.
 if(r.frame===game.finalFrame){
  if(s.ending)return s;const ending=requestClock(endingId,r);return ending?{...s,ending}:s;
 }
 if(s.feedback?.kind!=='correct')return s;
 const f=game.feedback[s.feedback.stage-1]!,clock=observed(s.correct,activities(r));if(!clock)return s;
 if(!s.feedback.remembered&&clock.frame>=f.rememberCorrectFrame){
  let pool:ZogXQuestionPool={...s.pool,correctQuestions:[...s.pool.correctQuestions,s.feedback.question]};
  if(f.drawNextAtFrame!==null){pool=drawZogXQuestion(pool);if(!seek(r,pool.frame))return s;}
  return {...s,pool,feedback:{...s.feedback,remembered:true},pendingFrame:pending(r.frame,pool.frame)};
 }
 if(!s.feedback.remembered||clock.status!=='completed'||clock.frame!==f.endFrame)return s;
 if(s.feedback.stage<game.requiredCorrect)return {...s,feedback:null};
 if(!seek(r,game.finalFrame))return s;
 // The eighth feedback enters Final directly: it does not invoke the random
 // draw function again or increment the displayed question count to nine.
 return {...s,pool:{...s.pool,frame:game.finalFrame,quizSection:false},feedback:null,
  pendingFrame:pending(r.frame,game.finalFrame)};
}

/** Prepare the two authored effects without consuming the pool. The isolated
 * SWF6 probe supports this native projection, not Adobe/original-page fidelity. */
export function zogXWrongCloseIntent(s:ZogXSession,r:AnimationRendererProps){
 if(!permitted(s,r)||s.directions||s.feedback?.kind!=='wrong'||s.wrong?.id!==wrongId||!s.pool||s.pool.frame!==r.frame)return null;
 const clock=observed(s.wrong,activities(r));if(!clock||clock.frame<game.wrongFeedback.popupFirstFrame)return null;
 return {sourceButtonId:game.wrongFeedback.closeButtonId,fromActivity:clock,
  childGotoAndPlay:game.wrongFeedback.closeRequestedFrame,nextPool:drawZogXQuestion(s.pool),
  projection:'hold-source60-one-tick-then-wrap1-without-frame60-actions' as const};
}
export function zogXOwnedActivities(s:ZogXSession,all:readonly LessonTextActivitySnapshot[]){return [...s.hiddenCorrect,s.correct,s.wrong,s.ending].flatMap(c=>{const a=observed(c,all);return a?[a]:[];});}
export function zogXGameView(s:ZogXSession,r:AnimationRendererProps){
 const correct=observed(s.correct,activities(r)),wrong=observed(s.wrong,activities(r)),ending=observed(s.ending,activities(r));
 const wrongFrame=wrong?.id===wrongCloseId&&wrong.status==='completed'?1:wrong?.frame??null;
 return {question:s.pool?.frame===r.frame?game.questions.find(q=>q.id===s.pool?.question):undefined,number:s.pool?.totalQuizCount??0,
  answersEnabled:Boolean(permitted(s,r)&&s.pool?.frame===r.frame&&s.pool.quizSection&&!s.feedback&&!s.directions),
  correctStage:s.correct?Number(s.correct.id.split('-').at(-1)):s.pool&&r.frame<game.finalFrame?1:null,
  correctFrame:correct?.frame??(s.pool&&r.frame<game.finalFrame?2:null),
  wrongFrame,wrongPopup:wrongFrame!==null&&wrongFrame>=game.wrongFeedback.popupFirstFrame,
  wrongCloseEnabled:permitted(s,r)&&wrong?.id===wrongId&&wrongFrame!==null&&wrongFrame>=game.wrongFeedback.popupFirstFrame&&!s.directions,
  endingFrame:ending?.frame??(s.pool?.frame===game.finalFrame&&r.frame===game.finalFrame?1:null),
  endingComplete:ending?.status==='completed'&&ending.frame===game.ending.endFrame};
}
