import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v1';
import{ALG_L07_P023_SOURCE as S,p023InitialState,p023Reduce,p023Branch,p023CanPlay,type P023State,type P023Term}from'./alg-l07-p023-state-v1';
export type P023AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P023Clock=SourceBranchClockV1;
export type P023Spanish=SourceBranchSpanishV1;
export type P023SessionOptions=SourceBranchSessionOptionsV1<Exclude<P023AudioId,'sa'>>;
export const P023Session=createSourceBranchSessionV1<P023State,P023Term,Exclude<P023AudioId,'sa'>>({source:S,initialState:p023InitialState,reduce:p023Reduce,canPlay:p023CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p023Branch(id);}});
export type P023Session=InstanceType<typeof P023Session>;
