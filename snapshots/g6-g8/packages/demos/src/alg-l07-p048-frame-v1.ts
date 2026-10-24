import {ALG_L07_P048_SOURCE as S,type P048SourceTerm,type P048Visual} from './alg-l07-p048-source-v1';
import {createFixedExitHelpFrameV3} from './source-fixed-exit-help-frame-v3';
const built=createFixedExitHelpFrameV3<P048SourceTerm,234|317,332,P048Visual>(S,{
 page:'p048',titleSpriteId:144,helpSpriteId:141,questionNumber:10,questionText:S.question,
 questionSourceIds:[146,147,150],closeTextId:173,wrongTextId:312,extraBlocks:[],extraValues:()=>({}),
});
export const P048_DOMAINS=built.domains,P048_MOVIE=built.movie,P048_DEFAULTS=built.defaults,P048_TEXT_BINDING=built.binding,p048View=built.view,algL07P048Frame=built.frame;
export type P048View=ReturnType<typeof p048View>;
