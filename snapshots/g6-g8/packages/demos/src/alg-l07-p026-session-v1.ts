import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v1';
import{ALG_L07_P026_SOURCE as S,p026InitialState,p026Reduce,p026Branch,p026CanPlay,type P026State,type P026Term}from'./alg-l07-p026-state-v1';
export type P026AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P026Clock=SourceBranchClockV1;
export type P026Spanish=SourceBranchSpanishV1;
export type P026SessionOptions=SourceBranchSessionOptionsV1<Exclude<P026AudioId,'sa'>>;
export const P026Session=createSourceBranchSessionV1<P026State,P026Term,Exclude<P026AudioId,'sa'>>({source:S,initialState:p026InitialState,reduce:p026Reduce,canPlay:p026CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p026Branch(id);}});
export type P026Session=InstanceType<typeof P026Session>;
