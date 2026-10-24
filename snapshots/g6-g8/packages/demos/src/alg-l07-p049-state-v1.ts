import{ALG_L07_P049_SOURCE as SOURCE,type P049SourceTerm}from'./alg-l07-p049-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P049_SOURCE}from'./alg-l07-p049-source-v1';
export type P049Term=P049SourceTerm;export type P049Answer=1|2|3|4;export type P049FeedbackId=154|238;
export type P049State=FixedExitHelpStateV1<P049Term,P049FeedbackId>;export type P049Event=FixedExitHelpEventV1<P049Term>;
const quiz=createFixedExitHelpQuizV1<P049Term,P049FeedbackId>(SOURCE);
export const p049InitialState=quiz.initialState,p049Reduce=quiz.reduce,p049CanClose=quiz.canClose,p049CanPlay=quiz.canPlay;
export const p049Branch=(id:P049FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p049Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P049_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
