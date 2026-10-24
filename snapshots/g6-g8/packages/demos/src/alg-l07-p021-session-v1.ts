import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v1';
import{ALG_L07_P021_SOURCE as S,p021InitialState,p021Reduce,p021Branch,p021CanPlay,type P021State,type P021Term}from'./alg-l07-p021-state-v1';
export type P021AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P021Clock=SourceBranchClockV1;
export type P021Spanish=SourceBranchSpanishV1;
export type P021SessionOptions=SourceBranchSessionOptionsV1<Exclude<P021AudioId,'sa'>>;
export const P021Session=createSourceBranchSessionV1<P021State,P021Term,Exclude<P021AudioId,'sa'>>({source:S,initialState:p021InitialState,reduce:p021Reduce,canPlay:p021CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p021Branch(id);}});
export type P021Session=InstanceType<typeof P021Session>;
