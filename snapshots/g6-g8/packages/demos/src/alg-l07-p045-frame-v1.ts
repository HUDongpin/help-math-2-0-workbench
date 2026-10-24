import {ALG_L07_P045_SOURCE as S,type P045SourceTerm,type P045Visual} from './alg-l07-p045-source-v1';
import {createFixedExitHelpFrameV1} from './source-fixed-exit-help-frame-v1';
const built=createFixedExitHelpFrameV1<P045SourceTerm,317|399,407,P045Visual>(S,{page:'p045',titleSpriteId:230,helpSpriteId:227,questionNumber:7,questionText:'What is the y-intercept of the linear function y = −3/4 x − 2/5?',questionSourceIds:[232,233,234,235,236,237,238],closeTextId:256,wrongTextId:394,
 extraBlocks:[{id:'post-402',sourceTextIds:['character-402'],role:'body'}],
 extraValues:(_s,v,ready)=>({'post-402':{text:v.paragraphs[0],visible:ready&&v.paragraphs[0].length>0}})});
export const P045_DOMAINS=built.domains,P045_MOVIE=built.movie,P045_DEFAULTS=built.defaults,P045_TEXT_BINDING=built.binding,p045View=built.view,algL07P045Frame=built.frame;
export type P045View=ReturnType<typeof p045View>;
