import {P058_NATIVE_SOURCE as N} from './generated/alg-l06-p058-native-v1';
import {P058_BEHAVIOR_SOURCE as B,type P058State} from './alg-l06-p058-state-v1';
export const P058_SOURCE_SHA256=N.sourceSha256;
export function p058SourceState(state:P058State){
 const frame=state.mainFrame;if(!Number.isSafeInteger(frame)||frame<1||frame>951)throw Error('P058_SOURCE_FRAME_RANGE');
 const ranges:Readonly<Record<string,readonly (readonly number[])[]>>=N.mainTextRanges,text:Readonly<Record<string,string>>=N.texts;
 const shown=(id:number)=>(ranges[String(id)]??[]).some(([first,last])=>frame>=first&&frame<=last);
 const line=(id:number)=>({id,text:text[String(id)]});
 const box=state.stepBox,owner=state.helpVisible?268:box&&box.frame!==1?box.spriteId:285;
 const boxReading=!!box&&box.frame>=15&&box.frame<=17;
 function frameFor(id:number){return id===285?frame:id===268?1:box?.frame??0;}
 const glossary=B.glossary.filter((g,i,all)=>g.ownerSpriteId===owner&&frameFor(g.ownerSpriteId)>=g.firstFrame&&frameFor(g.ownerSpriteId)<=g.lastFrame&&
  all.findIndex(x=>x.ownerSpriteId===g.ownerSpriteId&&x.buttonId===g.buttonId&&frameFor(x.ownerSpriteId)>=x.firstFrame&&frameFor(x.ownerSpriteId)<=x.lastFrame)===i);
 return {sourceSha256:N.sourceSha256,question:shown(17)?line(17):null,
  options:B.options.filter((_,i)=>shown([146,149,152,155][i])).map(o=>({...o,textId:[146,149,152,155][B.options.indexOf(o)]})),
  graph:shown(157)?N.graph:null,
  step1:shown(178)?[line(178)]:[],step2:[220,221].filter(shown).map(line),
  stages:(shown(223)||boxReading&&box?.spriteId===242)?[223,224,225,226,227,228,229,230].map(line):[],
  check:(shown(246)||boxReading&&box?.spriteId===252)?[246,247,248,249,250].map(line):[],
  help:state.helpVisible?[259,261,262,263,264,265,266].map(line):null,glossary,boxReading};
}
