import{ALG_L07_P048_SOURCE as SOURCE,type P048SourceTerm}from'./alg-l07-p048-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P048_SOURCE}from'./alg-l07-p048-source-v1';
export type P048Term=P048SourceTerm;export type P048Answer=1|2|3|4;export type P048FeedbackId=234|317;
export type P048State=FixedExitHelpStateV1<P048Term,P048FeedbackId>;export type P048Event=FixedExitHelpEventV1<P048Term>;
const quiz=createFixedExitHelpQuizV1<P048Term,P048FeedbackId>(SOURCE);
export const p048InitialState=quiz.initialState,p048Reduce=quiz.reduce,p048CanClose=quiz.canClose,p048CanPlay=quiz.canPlay;
export const p048Branch=(id:P048FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p048Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P048_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
