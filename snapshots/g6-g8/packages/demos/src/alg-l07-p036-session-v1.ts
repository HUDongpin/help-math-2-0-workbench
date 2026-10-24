import{createSourceBranchSessionV1,type SourceBranchSessionOptionsV1,type SourceBranchClockV1,type SourceBranchSpanishV1}from'./source-branch-audio-session-v2';
import{ALG_L07_P036_SOURCE as S,p036InitialState,p036Reduce,p036Branch,p036CanPlay,type P036State,type P036Term}from'./alg-l07-p036-state-v1';
export type P036AudioId=typeof S.clocks[number]['spriteId']|'sa';
export type P036Clock=SourceBranchClockV1;
export type P036Spanish=SourceBranchSpanishV1;
export type P036SessionOptions=SourceBranchSessionOptionsV1<Exclude<P036AudioId,'sa'>>;
export const P036Session=createSourceBranchSessionV1<P036State,P036Term,Exclude<P036AudioId,'sa'>>({source:S,initialState:p036InitialState,reduce:p036Reduce,canPlay:p036CanPlay,branch:id=>{if(id===S.mainSpriteId)throw Error('MAIN_IS_NOT_FEEDBACK');return p036Branch(id);}});
export type P036Session=InstanceType<typeof P036Session>;
