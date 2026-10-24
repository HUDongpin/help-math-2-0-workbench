import{createFixedExitHelpSessionV1}from'./source-fixed-exit-help-session-v1';
import{ALG_L07_P042_SOURCE as S,type P042Term}from'./alg-l07-p042-state-v1';
export type P042AudioId=255|339|376|'sa';
export const P042Session=createFixedExitHelpSessionV1<P042Term,255|339,376>(S);
export type P042Session=InstanceType<typeof P042Session>;
export type P042SessionOptions=ConstructorParameters<typeof P042Session>[0];
export type{FixedExitClockV1 as P042Clock,FixedExitSpanishV1 as P042Spanish}from'./source-fixed-exit-help-session-v1';
