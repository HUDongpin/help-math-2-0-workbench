import{ALG_L07_P045_SOURCE as SOURCE,type P045SourceTerm}from'./alg-l07-p045-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P045_SOURCE}from'./alg-l07-p045-source-v1';
export type P045Term=P045SourceTerm;export type P045Answer=1|2|3|4;export type P045FeedbackId=317|399;
export type P045State=FixedExitHelpStateV1<P045Term,P045FeedbackId>;export type P045Event=FixedExitHelpEventV1<P045Term>;
const quiz=createFixedExitHelpQuizV1<P045Term,P045FeedbackId>(SOURCE);
export const p045InitialState=quiz.initialState,p045Reduce=quiz.reduce,p045CanClose=quiz.canClose,p045CanPlay=quiz.canPlay;
export const p045Branch=(id:P045FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p045Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P045_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
