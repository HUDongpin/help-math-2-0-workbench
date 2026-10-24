import{ALG_L07_P043_SOURCE as SOURCE,type P043SourceTerm}from'./alg-l07-p043-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P043_SOURCE}from'./alg-l07-p043-source-v1';
export type P043Term=P043SourceTerm;export type P043Answer=1|2|3|4;export type P043FeedbackId=314|396;
export type P043State=FixedExitHelpStateV1<P043Term,P043FeedbackId>;export type P043Event=FixedExitHelpEventV1<P043Term>;
const quiz=createFixedExitHelpQuizV1<P043Term,P043FeedbackId>(SOURCE);
export const p043InitialState=quiz.initialState,p043Reduce=quiz.reduce,p043CanClose=quiz.canClose,p043CanPlay=quiz.canPlay;
export const p043Branch=(id:P043FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p043Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P043_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
