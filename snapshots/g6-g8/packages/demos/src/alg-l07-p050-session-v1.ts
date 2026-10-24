import{createFixedExitHelpSessionV1}from'./source-fixed-exit-help-session-v1';
import{ALG_L07_P050_SOURCE as S,type P050Term}from'./alg-l07-p050-state-v1';
export type P050AudioId=257|340|345|'sa';
export const P050Session=createFixedExitHelpSessionV1<P050Term,257|340,345>(S);
export type P050Session=InstanceType<typeof P050Session>;
export type P050SessionOptions=ConstructorParameters<typeof P050Session>[0];
export type{FixedExitClockV1 as P050Clock,FixedExitSpanishV1 as P050Spanish}from'./source-fixed-exit-help-session-v1';
