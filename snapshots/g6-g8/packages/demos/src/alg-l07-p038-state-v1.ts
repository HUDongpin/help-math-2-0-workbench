import {ALG_L07_P038_SOURCE as SOURCE,type P038SourceTerm} from './alg-l07-p038-source-v1';
import {createSourceLoopingReleaseQuizV1,type SourceLoopingReleaseQuizStateV1,type SourceLoopingReleaseQuizEventV1} from './source-looping-release-quiz-v1';
export {ALG_L07_P038_SOURCE} from './alg-l07-p038-source-v1';
export type P038Term=P038SourceTerm;
export type P038Answer=1|2|3|4;
export type P038FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P038State=SourceLoopingReleaseQuizStateV1<P038Term,P038FeedbackId>;
export type P038Event=SourceLoopingReleaseQuizEventV1<P038Term>;
const quiz=createSourceLoopingReleaseQuizV1<P038Term,P038FeedbackId>(SOURCE);
export const p038InitialState=quiz.initialState,p038Reduce=quiz.reduce,p038CanClose=quiz.canClose,p038CanPlay=quiz.canPlay;
export const p038Branch=(id:P038FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p038Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P038_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
