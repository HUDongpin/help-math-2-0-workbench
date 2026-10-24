import{SourceLoopAudioSession,type SourceLoopSessionOptions,type SourceLoopClock,type SourceLoopSpanish}from'./source-loop-audio-session-v1';
import{ALG_L07_P022_SOURCE as S,p022InitialState,p022Visual,type P022Term}from'./alg-l07-p022-state-v1';
export type P022Clock=SourceLoopClock;export type P022Spanish=SourceLoopSpanish;export type P022SessionOptions=SourceLoopSessionOptions<37>;
export class P022Session extends SourceLoopAudioSession<37,P022Term>{constructor(options:P022SessionOptions){super({mainId:37,clockPlan:S.clockPlan,sa:S.sa,initialState:p022InitialState,termsAtFrame:f=>p022Visual(f).terms},options);}}
