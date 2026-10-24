import {ALG_L07_P043_SOURCE as S,type P043SourceTerm,type P043Visual} from './alg-l07-p043-source-v1';
import {createFixedExitHelpFrameV1} from './source-fixed-exit-help-frame-v1';
const built=createFixedExitHelpFrameV1<P043SourceTerm,314|396,407,P043Visual>(S,{page:'p043',titleSpriteId:228,helpSpriteId:225,questionNumber:5,questionText:'What is the slope of the linear function y = −2/3 x − 1/2?',questionSourceIds:[230,231,232,233,234,235,239,240],closeTextId:253,wrongTextId:391,
 extraBlocks:[{id:'post-399',sourceTextIds:['character-399'],role:'body'},{id:'post-403',sourceTextIds:['character-403'],role:'body'}],
 extraValues:(_s,v,ready)=>Object.fromEntries([399,403].map((id,i)=>[`post-${id}`,{text:v.paragraphs[i],visible:ready&&v.paragraphs[i].length>0}]))});
export const P043_DOMAINS=built.domains,P043_MOVIE=built.movie,P043_DEFAULTS=built.defaults,P043_TEXT_BINDING=built.binding,p043View=built.view,algL07P043Frame=built.frame;
export type P043View=ReturnType<typeof p043View>;
