import{ALG_L07_P050_SOURCE as SOURCE,type P050SourceTerm}from'./alg-l07-p050-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P050_SOURCE}from'./alg-l07-p050-source-v1';
export type P050Term=P050SourceTerm;export type P050Answer=1|2|3|4;export type P050FeedbackId=257|340;
export type P050State=FixedExitHelpStateV1<P050Term,P050FeedbackId>;export type P050Event=FixedExitHelpEventV1<P050Term>;
const quiz=createFixedExitHelpQuizV1<P050Term,P050FeedbackId>(SOURCE);
export const p050InitialState=quiz.initialState,p050Reduce=quiz.reduce,p050CanClose=quiz.canClose,p050CanPlay=quiz.canPlay;
export const p050Branch=(id:P050FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p050Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P050_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
