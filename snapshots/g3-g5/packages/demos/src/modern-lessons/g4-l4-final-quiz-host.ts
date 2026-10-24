import type {AnimationRendererProps,RuntimeContext} from '../contract';
import {selectCourseG04L03Fq002QuestionOrder as drawTen} from '../timelines/course-g04-l03-fq-002-quiz-interaction';
import {answerQuestion,createQuizState,drawTwentyFourQuestionOrder,drawThirtyQuestionOrder,nextReview,sourceFrame,startReview,type QuizMode,type QuizOption,type QuizQuestion,type QuizState} from './g4-l4-final-quiz-state';

export interface FinalQuizHostSpec {readonly mode:QuizMode;readonly questionPoolSize?:24|30;readonly frameDomain:string;readonly frameCount:number;readonly questions:readonly QuizQuestion[]}
export interface FinalQuizHostSession {readonly seed:number;readonly replay:number;readonly quiz:QuizState|null;readonly pending:Readonly<{from:number;to:number}>|null}
export type FinalQuizAction={readonly type:'enter'}|{readonly type:'answer';readonly questionId:number;readonly option:QuizOption}|{readonly type:'review'}|{readonly type:'next'};
export const createFinalQuizHostSession=(seed=0,replay=0):FinalQuizHostSession=>({seed:seed>>>0,replay,quiz:null,pending:null});
export function finalQuizFrameControl(c:FinalQuizHostSpec){
 const q=c.questions.map(q=>q.questionFrame),review=c.questions.map(q=>q.reviewFrame);
 const edges=c.mode==='random-ten'?
  [...q.map(to=>[1,to]),...q.flatMap(from=>q.filter(to=>to!==from).map(to=>[from,to])),...q.flatMap(from=>review.map(to=>[from,to])),...review.flatMap(from=>review.filter(to=>to!==from).map(to=>[from,to]))]:
  [[1,q[0]],...q.slice(1).map((to,i)=>[q[i],to]),[q.at(-1)!,review[0]],...review.slice(1).map((to,i)=>[review[i],to])];
 return {frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:edges.map(([fromFrame,toFrame])=>({fromFrame,toFrame,stopFrame:toFrame}))};
}
export function synchronizeFinalQuizHost(c:FinalQuizHostSpec,s:FinalQuizHostSession,r:RuntimeContext):FinalQuizHostSession {
 const reset=()=>s.quiz||s.pending||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createFinalQuizHostSession(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??c.frameDomain)!==c.frameDomain)return reset();
 if(s.pending&&r.frame===s.pending.from)return s;
 if(!s.quiz)return s;
 if(r.frame!==sourceFrame(s.quiz,c.questions))return reset();
 return s.pending?{...s,pending:null}:s;
}
/** Source transitions are committed only after the existing My Lesson clock
 * accepts them. The last answer/result overlay does not change the parent frame. */
export function dispatchFinalQuizHost(c:FinalQuizHostSpec,s:FinalQuizHostSession,action:FinalQuizAction,r:AnimationRendererProps):FinalQuizHostSession {
 if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||r.paused
  ||(r.frameDomain??c.frameDomain)!==c.frameDomain||(r.rootFrame??6)!==6
  ||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(s.pending&&r.frame!==s.pending.to))return s;
 let next:QuizState;
 if(action.type==='enter'){
  if(s.quiz||r.frame!==1)return s;
  next=createQuizState(c.mode,s.seed,c.questionPoolSize===30?drawThirtyQuestionOrder:c.questionPoolSize===24?drawTwentyFourQuestionOrder:drawTen,c.questionPoolSize??25);
 }else{
  if(!s.quiz||r.frame!==sourceFrame(s.quiz,c.questions))return s;
  next=action.type==='answer'?answerQuestion(s.quiz,c.questions,action.questionId,action.option):action.type==='review'?startReview(s.quiz):nextReview(s.quiz);
  if(next===s.quiz)return s;
 }
 const to=sourceFrame(next,c.questions);
 if(to!==r.frame&&r.onLessonFrameRequest?.({fromFrame:r.frame,toFrame:to,stopFrame:to})!==true)return s;
 return {...s,quiz:next,pending:to===r.frame?null:{from:r.frame,to}};
}
