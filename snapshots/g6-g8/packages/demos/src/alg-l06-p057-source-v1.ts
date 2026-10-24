import {P057_NATIVE_SOURCE as N} from './generated/alg-l06-p057-native-v1';
import {P057_BEHAVIOR_SOURCE as B,type P057State} from './alg-l06-p057-state-v1';
export const P057_SOURCE_SHA256=N.sourceSha256;
export function p057SourceState(state:P057State){
 const frame=state.mainFrame;if(!Number.isSafeInteger(frame)||frame<1||frame>856)throw Error('P057_SOURCE_FRAME_RANGE');
 const ranges:Readonly<Record<string,readonly (readonly number[])[]>>=N.mainTextRanges,text:Readonly<Record<string,string>>=N.texts;
 const shown=(id:number)=>(ranges[String(id)]??[]).some(([first,last])=>frame>=first&&frame<=last);
 const line=(id:number)=>({id,text:text[String(id)]});
 const box=state.stepBox,owner=state.helpVisible?295:box&&box.frame!==1?box.spriteId:312;
 const boxReading=!!box&&box.frame>=15&&box.frame<=17;
 const glossary=B.glossary.filter((g,i,all)=>g.ownerSpriteId===owner&&frameFor(g.ownerSpriteId)>=g.firstFrame&&frameFor(g.ownerSpriteId)<=g.lastFrame&&
  all.findIndex(x=>x.ownerSpriteId===g.ownerSpriteId&&x.buttonId===g.buttonId&&frameFor(x.ownerSpriteId)>=x.firstFrame&&frameFor(x.ownerSpriteId)<=x.lastFrame)===i);
 function frameFor(id:number){return id===312?frame:id===295?1:box?.frame??0;}
 return {sourceSha256:N.sourceSha256,question:shown(18)?line(18):null,
  options:B.options.filter((_,i)=>shown([163,166,169,172][i])).map(o=>({...o,textId:[163,166,169,172][B.options.indexOf(o)]})),
  table:shown(174)?{headers:[174,175].map(line),rows:[[176,177],[178,179],[180,181]].map(ids=>ids.map(line))}:null,
  step1:shown(192)?[line(192)]:[],step2:[235,236].filter(shown).map(line),
  calculation:(shown(238)||boxReading&&box?.spriteId===259)?[238,239,240,241,242,243,244,245,246,247].map(line):[],
  check:(shown(263)||boxReading&&box?.spriteId===267)?[263,264,265].map(line):[],
  help:state.helpVisible?{paragraphs:[275,276,277].map(line),table:{headers:[282,283].map(line),rows:[[284,287],[285,288],[286,289]].map(ids=>ids.map(line))},lead:line(290),equations:N.helpEquationLines,conclusion:line(294)}:null,
  glossary,boxReading};
}
