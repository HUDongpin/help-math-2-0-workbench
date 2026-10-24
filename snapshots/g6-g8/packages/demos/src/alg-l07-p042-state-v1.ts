import{ALG_L07_P042_SOURCE as SOURCE,type P042SourceTerm}from'./alg-l07-p042-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P042_SOURCE}from'./alg-l07-p042-source-v1';
export type P042Term=P042SourceTerm;export type P042Answer=1|2|3|4;export type P042FeedbackId=255|339;
export type P042State=FixedExitHelpStateV1<P042Term,P042FeedbackId>;export type P042Event=FixedExitHelpEventV1<P042Term>;
const quiz=createFixedExitHelpQuizV1<P042Term,P042FeedbackId>(SOURCE);
export const p042InitialState=quiz.initialState,p042Reduce=quiz.reduce,p042CanClose=quiz.canClose,p042CanPlay=quiz.canPlay;
export const p042Branch=(id:P042FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p042Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P042_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
