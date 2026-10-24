import{ALG_L07_P039_SOURCE as SOURCE,type P039SourceTerm}from'./alg-l07-p039-source-v1';
import{createFixedExitHelpQuizV1,type FixedExitHelpStateV1,type FixedExitHelpEventV1}from'./source-fixed-exit-help-quiz-v1';
export{ALG_L07_P039_SOURCE}from'./alg-l07-p039-source-v1';
export type P039Term=P039SourceTerm;export type P039Answer=1|2|3|4;export type P039FeedbackId=280|361;
export type P039State=FixedExitHelpStateV1<P039Term,P039FeedbackId>;export type P039Event=FixedExitHelpEventV1<P039Term>;
const quiz=createFixedExitHelpQuizV1<P039Term,P039FeedbackId>(SOURCE);
export const p039InitialState=quiz.initialState,p039Reduce=quiz.reduce,p039CanClose=quiz.canClose,p039CanPlay=quiz.canPlay;
export const p039Branch=(id:P039FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p039Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P039_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
