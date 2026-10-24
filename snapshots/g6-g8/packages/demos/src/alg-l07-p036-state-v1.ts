import {ALG_L07_P036_SOURCE as SOURCE,type P036SourceTerm} from './alg-l07-p036-source-v1';
import {createSourceLoopingReleaseQuizV1,type SourceLoopingReleaseQuizStateV1,type SourceLoopingReleaseQuizEventV1} from './source-looping-release-quiz-v1';
export {ALG_L07_P036_SOURCE} from './alg-l07-p036-source-v1';
export type P036Term=P036SourceTerm;
export type P036Answer=1|2|3|4;
export type P036FeedbackId=typeof SOURCE.branches[number]['spriteId'];
export type P036State=SourceLoopingReleaseQuizStateV1<P036Term,P036FeedbackId>;
export type P036Event=SourceLoopingReleaseQuizEventV1<P036Term>;
const quiz=createSourceLoopingReleaseQuizV1<P036Term,P036FeedbackId>(SOURCE);
export const p036InitialState=quiz.initialState,p036Reduce=quiz.reduce,p036CanClose=quiz.canClose,p036CanPlay=quiz.canPlay;
export const p036Branch=(id:P036FeedbackId)=>SOURCE.branches.find(b=>b.spriteId===id)!;
export function p036Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>SOURCE.mainFrameCount)throw Error('P036_MAIN_FRAME');return SOURCE.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
