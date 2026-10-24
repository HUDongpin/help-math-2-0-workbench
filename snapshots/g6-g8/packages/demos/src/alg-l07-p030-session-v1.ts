import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v1';
import{ALG_L07_P030_SOURCE as S,p030InitialState,p030Reduce,p030Branch,p030CanPlay,type P030State,type P030Term}from'./alg-l07-p030-state-v1';
export type P030AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P030Clock=SourceBranchClockV1;
export type P030Spanish=SourceBranchSpanishV1;
export type P030SessionOptions=SourceBranchSessionOptionsV1<Exclude<P030AudioId,'sa'>>;
export const P030Session=createSourceBranchSessionV1<P030State,P030Term,Exclude<P030AudioId,'sa'>>({source:S,initialState:p030InitialState,reduce:p030Reduce,canPlay:p030CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p030Branch(id);}});
export type P030Session=InstanceType<typeof P030Session>;
