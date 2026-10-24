import {ALG_L07_P030_SOURCE as SOURCE,type P030SourceTerm} from './alg-l07-p030-source-v1';
import {createSourceLoopingExitQuizV1,type SourceLoopingExitQuizStateV1,type SourceLoopingExitQuizEventV1} from './source-looping-exit-quiz-v1';
export {ALG_L07_P030_SOURCE} from './alg-l07-p030-source-v1';
export type P030Term=P030SourceTerm;
export type P030Answer=1|2|3|4;
export type P030FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P030State=SourceLoopingExitQuizStateV1<P030Term,P030FeedbackId>;
export type P030Event=SourceLoopingExitQuizEventV1<P030Term>;
const quiz=createSourceLoopingExitQuizV1<P030Term,P030FeedbackId>(SOURCE);
export const p030InitialState=quiz.initialState,p030Reduce=quiz.reduce,p030CanClose=quiz.canClose,p030CanPlay=quiz.canPlay;
export const p030Branch=(id:P030FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p030Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P030_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
