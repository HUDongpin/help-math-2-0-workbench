import{createFixedExitHelpSessionV1}from'./source-fixed-exit-help-session-v1';
import{ALG_L07_P045_SOURCE as S,type P045Term}from'./alg-l07-p045-state-v1';
export type P045AudioId=317|399|407|'sa';
export const P045Session=createFixedExitHelpSessionV1<P045Term,317|399,407>(S);
export type P045Session=InstanceType<typeof P045Session>;
export type P045SessionOptions=ConstructorParameters<typeof P045Session>[0];
export type{FixedExitClockV1 as P045Clock,FixedExitSpanishV1 as P045Spanish}from'./source-fixed-exit-help-session-v1';
