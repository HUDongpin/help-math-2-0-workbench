import{ALG_L07_P047_SOURCE as SOURCE,type P047SourceTerm}from'./alg-l07-p047-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P047_SOURCE}from'./alg-l07-p047-source-v1';
export type P047Term=P047SourceTerm;export type P047Answer=1|2|3|4;export type P047FeedbackId=333|415;
export type P047State=FixedExitHelpStateV1<P047Term,P047FeedbackId>;export type P047Event=FixedExitHelpEventV1<P047Term>;
const quiz=createFixedExitHelpQuizV1<P047Term,P047FeedbackId>(SOURCE);
export const p047InitialState=quiz.initialState,p047Reduce=quiz.reduce,p047CanClose=quiz.canClose,p047CanPlay=quiz.canPlay;
export const p047Branch=(id:P047FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p047Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P047_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
