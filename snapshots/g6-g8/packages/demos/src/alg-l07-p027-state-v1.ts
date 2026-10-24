import {ALG_L07_P027_SOURCE as SOURCE,type P027SourceTerm} from './alg-l07-p027-source-v1';
import {createSourceLoopingExitQuizV1,type SourceLoopingExitQuizStateV1,type SourceLoopingExitQuizEventV1} from './source-looping-exit-quiz-v1';
export {ALG_L07_P027_SOURCE} from './alg-l07-p027-source-v1';
export type P027Term=P027SourceTerm;
export type P027Answer=1|2|3|4;
export type P027FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P027State=SourceLoopingExitQuizStateV1<P027Term,P027FeedbackId>;
export type P027Event=SourceLoopingExitQuizEventV1<P027Term>;
const quiz=createSourceLoopingExitQuizV1<P027Term,P027FeedbackId>(SOURCE);
export const p027InitialState=quiz.initialState,p027Reduce=quiz.reduce,p027CanClose=quiz.canClose,p027CanPlay=quiz.canPlay;
export const p027Branch=(id:P027FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p027Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P027_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
