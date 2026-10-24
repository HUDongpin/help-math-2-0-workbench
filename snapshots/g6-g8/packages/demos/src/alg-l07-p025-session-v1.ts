import{SourceLoopAudioSession,type SourceLoopSessionOptions,type SourceLoopClock,type SourceLoopSpanish}from'./source-loop-audio-session-v1';
import{ALG_L07_P025_SOURCE as S,p025InitialState,p025Visual,type P025Term}from'./alg-l07-p025-state-v1';
export type P025Clock=SourceLoopClock;export type P025Spanish=SourceLoopSpanish;export type P025SessionOptions=SourceLoopSessionOptions<16>;
export class P025Session extends SourceLoopAudioSession<16,P025Term>{constructor(options:P025SessionOptions){super({mainId:16,clockPlan:S.clockPlan,sa:S.sa,initialState:p025InitialState,termsAtFrame:f=>p025Visual(f).terms},options);}}
