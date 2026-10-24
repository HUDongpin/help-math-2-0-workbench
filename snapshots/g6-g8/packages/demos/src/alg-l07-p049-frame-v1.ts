import {ALG_L07_P049_SOURCE as S,type P049SourceTerm,type P049Visual} from './alg-l07-p049-source-v1';
import {createFixedExitHelpFrameV3,type FixedExitTextDraftV3,type FixedExitTextValuesV3} from './source-fixed-exit-help-frame-v3';
const extraBlocks:FixedExitTextDraftV3[]=S.graphs.flatMap(g=>g.labels.map(l=>({id:`axis-${g.name}-${l.depth}`,sourceTextIds:[l.sourceTextId],role:'label' as const})));
const built=createFixedExitHelpFrameV3<P049SourceTerm,154|238,243,P049Visual>(S,{
 page:'p049',titleSpriteId:53,helpSpriteId:50,questionNumber:11,questionText:S.question,
 questionSourceIds:[56,57,61,62],closeTextId:93,wrongTextId:233,extraBlocks,
 extraValues:(_state,v,ready)=>{
  const values:FixedExitTextValuesV3={};
  for(const g of S.graphs)for(const l of g.labels){const a=v.graphs.find(t=>t.name===g.name)!.labels.find(t=>t.depth===l.depth)!.alpha;values[`axis-${g.name}-${l.depth}`]={text:l.text,visible:ready&&a>0&&v.answerAlpha[g.name as 'A'|'B'|'C'|'D']>0};}
  return values;
 },
});
export const P049_DOMAINS=built.domains,P049_MOVIE=built.movie,P049_DEFAULTS=built.defaults,P049_TEXT_BINDING=built.binding,p049View=built.view,algL07P049Frame=built.frame;
export type P049View=ReturnType<typeof p049View>;
