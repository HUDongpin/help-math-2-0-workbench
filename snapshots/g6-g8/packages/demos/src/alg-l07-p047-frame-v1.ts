import {ALG_L07_P047_SOURCE as S,type P047SourceTerm,type P047Visual} from './alg-l07-p047-source-v1';
import {createFixedExitHelpFrameV2,type FixedExitTextDraftV2,type FixedExitTextValuesV2} from './source-fixed-exit-help-frame-v2';

// Order follows the written formula, not the Flash display-list depth order.
export const P047_FORMULA_TEXTS=[[100,433],[102,435],[101,434],[104,438],[105,435],[107,440],[108,441],[109,435],[111,443],[112,444],[113,445]] as const;
export function p047BarProgress(v:P047Visual,depth:number){
 const bar=v.fractionBars.find(b=>b.depth===depth&&b.alpha>0);
 if(!bar)return 0;
 return bar.characterId===S.morphBarSource.characterId
  ?(S.morphBarSource.startLength+(S.morphBarSource.endLength-S.morphBarSource.startLength)*bar.ratio/S.morphBarSource.sourceRatioDenominator)/S.morphBarSource.endLength
  :1;
}
export function p047FormulaLabel(v:P047Visual){
 const word=(depth:number)=>{const row=v.formula.find(t=>t.depth===depth&&t.alpha>0);return row?S.formulaTexts.find(t=>t.characterId===row.characterId)!.text.replace(/=/g,' equals '):'';};
 return [word(100),word(102),word(101),p047BarProgress(v,103)>0?'over':'',word(104),
  word(105),word(107),p047BarProgress(v,106)>0?'over':'',word(108),
  word(109),word(111),p047BarProgress(v,110)>0?'over':'',word(112),word(113)]
  .filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}
const extraBlocks:FixedExitTextDraftV2[]=[
 ...S.graphs.flatMap(g=>g.labels.map((l,i)=>({id:`axis-${g.name}-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const}))),
 ...[417,419].map(id=>({id:`coordinate-${id}`,sourceTextIds:[`character-${id}`],role:'label' as const})),
 ...[423,424,427,428,429,432].map(id=>({id:`change-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const})),
 ...P047_FORMULA_TEXTS.map(([depth,id])=>({id:`formula-${depth}`,sourceTextIds:[`character-${id}`],role:'body' as const})),
 ...[[103,[436,437]],[106,[439]],[110,[442]]].map(([depth,ids])=>({id:`formula-bar-${depth}`,sourceTextIds:[],sourceShapeIds:ids as number[],role:'body' as const})),
];
const built=createFixedExitHelpFrameV2<P047SourceTerm,333|415,447,P047Visual>(S,{
 page:'p047',titleSpriteId:217,helpSpriteId:214,questionNumber:9,questionText:S.question.trim(),
 questionSourceIds:[219,221,247,249,251,252,253],closeTextId:272,wrongTextId:410,extraBlocks,
 extraValues:(state,v,ready)=>{
  const values:FixedExitTextValuesV2={};
  for(const g of S.graphs)g.labels.forEach((l,i)=>{values[`axis-${g.name}-${i}`]={text:l.text,visible:ready&&(g.name==='help'?state.help:v.graphAlpha>0)};});
  for(const id of[417,419]){const row=v.coordinate.find(t=>t.characterId===id);values[`coordinate-${id}`]={text:row?.text??'',visible:ready&&Boolean(row&&row.alpha>0)};}
  for(const id of[423,424,427,428,429,432]){const row=v.changeTexts.find(t=>t.characterId===id);values[`change-${id}`]={text:row?.text??'',visible:ready&&Boolean(row&&row.alpha>0)};}
  for(const[depth,id]of P047_FORMULA_TEXTS){const row=v.formula.find(t=>t.depth===depth);values[`formula-${depth}`]={text:S.formulaTexts.find(t=>t.characterId===id)!.text,visible:ready&&Boolean(row&&row.alpha>0)};}
  for(const depth of[103,106,110])values[`formula-bar-${depth}`]={text:'/',visible:ready&&p047BarProgress(v,depth)>0};
  return values;
 },
});
export const P047_DOMAINS=built.domains,P047_MOVIE=built.movie,P047_DEFAULTS=built.defaults,P047_TEXT_BINDING=built.binding,p047View=built.view,algL07P047Frame=built.frame;
export type P047View=ReturnType<typeof p047View>;
