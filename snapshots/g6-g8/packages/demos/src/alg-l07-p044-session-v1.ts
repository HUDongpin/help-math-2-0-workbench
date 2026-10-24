import{createFixedExitHelpSessionV1}from'./source-fixed-exit-help-session-v1';
import{ALG_L07_P044_SOURCE as S,type P044Term}from'./alg-l07-p044-state-v1';
export type P044AudioId=328|409|417|'sa';
export const P044Session=createFixedExitHelpSessionV1<P044Term,328|409,417>(S);
export type P044Session=InstanceType<typeof P044Session>;
export type P044SessionOptions=ConstructorParameters<typeof P044Session>[0];
export type{FixedExitClockV1 as P044Clock,FixedExitSpanishV1 as P044Spanish}from'./source-fixed-exit-help-session-v1';
