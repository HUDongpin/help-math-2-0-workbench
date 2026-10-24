import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v2';
import{ALG_L07_P033_SOURCE as S,p033InitialState,p033Reduce,p033Branch,p033CanPlay,type P033State,type P033Term}from'./alg-l07-p033-state-v1';
export type P033AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P033Clock=SourceBranchClockV1;
export type P033Spanish=SourceBranchSpanishV1;
export type P033SessionOptions=SourceBranchSessionOptionsV1<Exclude<P033AudioId,'sa'>>;
export const P033Session=createSourceBranchSessionV1<P033State,P033Term,Exclude<P033AudioId,'sa'>>({source:S,initialState:p033InitialState,reduce:p033Reduce,canPlay:p033CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p033Branch(id);}});
export type P033Session=InstanceType<typeof P033Session>;
