import {ALG_L07_P050_SOURCE as S,type P050SourceTerm,type P050Visual} from './alg-l07-p050-source-v1';
import {createFixedExitHelpFrameV4,type FixedExitTextDraftV4,type FixedExitTextValuesV4} from './source-fixed-exit-help-frame-v4';
const extraBlocks:FixedExitTextDraftV4[]=[{id:'table-formula',sourceTextIds:['character-152'],role:'body'},{id:'table-heading-r',sourceTextIds:['character-154'],role:'label'},{id:'table-heading-A',sourceTextIds:['character-155'],role:'label'},...S.table.rows.flatMap(r=>[{id:`table-input-${r.input}`,sourceTextIds:[`character-${r.inputId}`],role:'body' as const},...(r.outputId?[{id:`table-output-${r.input}`,sourceTextIds:[`character-${r.outputId}`],role:'body' as const}]:[])]),...[341,342,343,344].map(id=>({id:`post-equation-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const}))];
const built=createFixedExitHelpFrameV4<P050SourceTerm,257|340,345,P050Visual>(S,{
 page:'p050',titleSpriteId:148,helpSpriteId:145,questionNumber:12,questionText:S.question,
 questionSourceIds:[150,151,174,175,176,177,178,179,180,181],closeTextId:196,wrongTextId:335,extraBlocks,
 extraValues:(_state,v,ready)=>{
  const visible=ready&&v.tableAlpha>0,values:FixedExitTextValuesV4={'table-formula':{text:S.richTexts.find(t=>t.characterId===152)!.text,visible},'table-heading-r':{text:'r',visible},'table-heading-A':{text:'A',visible}};
  for(const row of S.table.rows){values[`table-input-${row.input}`]={text:row.input,visible};if(row.output!==null)values[`table-output-${row.input}`]={text:row.output,visible};}
  for(const p of v.postEquations)values[`post-equation-${p.characterId}`]={text:S.richTexts.find(t=>t.characterId===p.characterId)!.text,visible:ready&&p.alpha>0};
  return values;
 },
});
export const P050_DOMAINS=built.domains,P050_MOVIE=built.movie,P050_DEFAULTS=built.defaults,P050_TEXT_BINDING=built.binding,p050View=built.view,algL07P050Frame=built.frame;
export type P050View=ReturnType<typeof p050View>;
