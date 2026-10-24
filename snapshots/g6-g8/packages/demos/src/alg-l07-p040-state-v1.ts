import{ALG_L07_P040_SOURCE as SOURCE,type P040SourceTerm}from'./alg-l07-p040-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P040_SOURCE}from'./alg-l07-p040-source-v1';
export type P040Term=P040SourceTerm;export type P040Answer=1|2|3|4;export type P040FeedbackId=237|319;
export type P040State=FixedExitHelpStateV1<P040Term,P040FeedbackId>;export type P040Event=FixedExitHelpEventV1<P040Term>;
const quiz=createFixedExitHelpQuizV1<P040Term,P040FeedbackId>(SOURCE);
export const p040InitialState=quiz.initialState,p040Reduce=quiz.reduce,p040CanClose=quiz.canClose,p040CanPlay=quiz.canPlay;
export const p040Branch=(id:P040FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p040Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P040_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
