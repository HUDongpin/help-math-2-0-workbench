import{ALG_L07_P044_SOURCE as SOURCE,type P044SourceTerm}from'./alg-l07-p044-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P044_SOURCE}from'./alg-l07-p044-source-v1';
export type P044Term=P044SourceTerm;export type P044Answer=1|2|3|4;export type P044FeedbackId=328|409;
export type P044State=FixedExitHelpStateV1<P044Term,P044FeedbackId>;export type P044Event=FixedExitHelpEventV1<P044Term>;
const quiz=createFixedExitHelpQuizV1<P044Term,P044FeedbackId>(SOURCE);
export const p044InitialState=quiz.initialState,p044Reduce=quiz.reduce,p044CanClose=quiz.canClose,p044CanPlay=quiz.canPlay;
export const p044Branch=(id:P044FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p044Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P044_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
