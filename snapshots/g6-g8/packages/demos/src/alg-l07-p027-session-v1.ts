import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v1';
import{ALG_L07_P027_SOURCE as S,p027InitialState,p027Reduce,p027Branch,p027CanPlay,type P027State,type P027Term}from'./alg-l07-p027-state-v1';
export type P027AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P027Clock=SourceBranchClockV1;
export type P027Spanish=SourceBranchSpanishV1;
export type P027SessionOptions=SourceBranchSessionOptionsV1<Exclude<P027AudioId,'sa'>>;
export const P027Session=createSourceBranchSessionV1<P027State,P027Term,Exclude<P027AudioId,'sa'>>({source:S,initialState:p027InitialState,reduce:p027Reduce,canPlay:p027CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p027Branch(id);}});
export type P027Session=InstanceType<typeof P027Session>;
