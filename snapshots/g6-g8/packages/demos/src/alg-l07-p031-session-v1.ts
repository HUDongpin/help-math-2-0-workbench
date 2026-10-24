import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v2';
import{ALG_L07_P031_SOURCE as S,p031InitialState,p031Reduce,p031Branch,p031CanPlay,type P031State,type P031Term}from'./alg-l07-p031-state-v1';
export type P031AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P031Clock=SourceBranchClockV1;
export type P031Spanish=SourceBranchSpanishV1;
export type P031SessionOptions=SourceBranchSessionOptionsV1<Exclude<P031AudioId,'sa'>>;
export const P031Session=createSourceBranchSessionV1<P031State,P031Term,Exclude<P031AudioId,'sa'>>({source:S,initialState:p031InitialState,reduce:p031Reduce,canPlay:p031CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p031Branch(id);}});
export type P031Session=InstanceType<typeof P031Session>;
