import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v2';
import{ALG_L07_P038_SOURCE as S,p038InitialState,p038Reduce,p038Branch,p038CanPlay,type P038State,type P038Term}from'./alg-l07-p038-state-v1';
export type P038AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P038Clock=SourceBranchClockV1;
export type P038Spanish=SourceBranchSpanishV1;
export type P038SessionOptions=SourceBranchSessionOptionsV1<Exclude<P038AudioId,'sa'>>;
export const P038Session=createSourceBranchSessionV1<P038State,P038Term,Exclude<P038AudioId,'sa'>>({source:S,initialState:p038InitialState,reduce:p038Reduce,canPlay:p038CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p038Branch(id);}});
export type P038Session=InstanceType<typeof P038Session>;
