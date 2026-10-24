import {ALG_L07_P031_SOURCE as SOURCE,type P031SourceTerm} from './alg-l07-p031-source-v1';
import {createSourceLoopingExitQuizV1,type SourceLoopingExitQuizStateV1,type SourceLoopingExitQuizEventV1} from './source-looping-exit-quiz-v1';
export {ALG_L07_P031_SOURCE} from './alg-l07-p031-source-v1';
export type P031Term=P031SourceTerm;
export type P031Answer=1|2|3|4;
export type P031FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P031State=SourceLoopingExitQuizStateV1<P031Term,P031FeedbackId>;
export type P031Event=SourceLoopingExitQuizEventV1<P031Term>;
const quiz=createSourceLoopingExitQuizV1<P031Term,P031FeedbackId>(SOURCE);
export const p031InitialState=quiz.initialState,p031Reduce=quiz.reduce,p031CanClose=quiz.canClose,p031CanPlay=quiz.canPlay;
export const p031Branch=(id:P031FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p031Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P031_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
