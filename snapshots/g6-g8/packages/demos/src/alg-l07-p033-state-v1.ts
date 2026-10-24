import {ALG_L07_P033_SOURCE as SOURCE,type P033SourceTerm} from './alg-l07-p033-source-v1';
import {createSourceLoopingExitQuizV1,type SourceLoopingExitQuizStateV1,type SourceLoopingExitQuizEventV1} from './source-looping-exit-quiz-v1';
export {ALG_L07_P033_SOURCE} from './alg-l07-p033-source-v1';
export type P033Term=P033SourceTerm;
export type P033Answer=1|2|3|4;
export type P033FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P033State=SourceLoopingExitQuizStateV1<P033Term,P033FeedbackId>;
export type P033Event=SourceLoopingExitQuizEventV1<P033Term>;
const quiz=createSourceLoopingExitQuizV1<P033Term,P033FeedbackId>(SOURCE);
export const p033InitialState=quiz.initialState,p033Reduce=quiz.reduce,p033CanClose=quiz.canClose,p033CanPlay=quiz.canPlay;
export const p033Branch=(id:P033FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p033Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P033_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
