import{SourceLoopAudioSession,type SourceLoopSessionOptions,type SourceLoopClock,type SourceLoopSpanish}from'./source-loop-audio-session-v1';
import{ALG_L07_P032_SOURCE as S,p032InitialState,p032Visual,type P032Term}from'./alg-l07-p032-state-v1';
export type P032Clock=SourceLoopClock;export type P032Spanish=SourceLoopSpanish;export type P032SessionOptions=SourceLoopSessionOptions<19>;
export class P032Session extends SourceLoopAudioSession<19,P032Term>{constructor(options:P032SessionOptions){super({mainId:19,clockPlan:S.clockPlan,sa:S.sa,initialState:p032InitialState,termsAtFrame:f=>p032Visual(f).terms},options);}}
