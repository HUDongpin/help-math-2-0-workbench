import {ALG_L07_P044_SOURCE as S,type P044SourceTerm,type P044Visual} from './alg-l07-p044-source-v1';
import {createFixedExitHelpFrameV1} from './source-fixed-exit-help-frame-v1';
const labels=S.graphs[0].labels;
const built=createFixedExitHelpFrameV1<P044SourceTerm,328|409,417,P044Visual>(S,{page:'p044',titleSpriteId:231,helpSpriteId:228,questionNumber:6,questionText:'What is the y-intercept of the linear function whose graph in shown?',questionSourceIds:[233,234],closeTextId:267,wrongTextId:404,
 extraBlocks:[...labels.map((l,i)=>({id:`axis-question-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const})),...[412,413,414].map(id=>({id:`coordinate-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const}))],
 extraValues:(_s,v,ready)=>Object.fromEntries([...labels.map((l,i)=>[`axis-question-${i}`,{text:l.text,visible:ready&&v.graphAlpha>0}] as const),...[412,413,414].map(id=>{const c=v.coordinate.find(c=>c.characterId===id);return [`coordinate-${id}`,{text:c?(id===413?'−':c.text):'',visible:ready&&Boolean(c&&c.alpha!>0)}] as const;})])});
export const P044_DOMAINS=built.domains,P044_MOVIE=built.movie,P044_DEFAULTS=built.defaults,P044_TEXT_BINDING=built.binding,p044View=built.view,algL07P044Frame=built.frame;
export type P044View=ReturnType<typeof p044View>;
