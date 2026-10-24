import{createFixedExitHelpSessionV1}from'./source-fixed-exit-help-session-v1';
import{ALG_L07_P047_SOURCE as S,type P047Term}from'./alg-l07-p047-state-v1';
export type P047AudioId=333|415|447|'sa';
export const P047Session=createFixedExitHelpSessionV1<P047Term,333|415,447>(S);
export type P047Session=InstanceType<typeof P047Session>;
export type P047SessionOptions=ConstructorParameters<typeof P047Session>[0];
export type{FixedExitClockV1 as P047Clock,FixedExitSpanishV1 as P047Spanish}from'./source-fixed-exit-help-session-v1';
