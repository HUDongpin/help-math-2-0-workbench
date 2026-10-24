import {P056_NATIVE_SOURCE as N} from './generated/alg-l06-p056-native-v1';
import {P056_BEHAVIOR_SOURCE as B,type P056State} from './alg-l06-p056-state-v1';
export const P056_SOURCE_SHA256=N.sourceSha256;
export function p056SourceState(state:P056State){
 const frame=state.mainFrame;if(!Number.isSafeInteger(frame)||frame<1||frame>818)throw Error('P056_SOURCE_FRAME_RANGE');
 const ranges:Readonly<Record<string,readonly (readonly number[])[]>>=N.mainTextRanges;
 const text:Readonly<Record<string,string>>=N.texts;
 const shown=(id:number)=>(ranges[String(id)]??[]).some(([first,last])=>frame>=first&&frame<=last);
 const line=(id:number)=>({id,text:text[String(id)]});
 const box=state.stepBox,owner=state.helpVisible?288:box&&box.frame!==1?box.spriteId:305;
 // Formula details are placed only when box250 reaches frame15. The readable
 // table box likewise opens at its stable authored hold, while Canvas shows the tween.
 const boxReading=!!box&&box.frame>=15&&box.frame<=17;
 const glossary=B.glossary.filter((g,i,all)=>g.ownerSpriteId===owner&&
  (owner!==270||boxReading)&&frameFor(g.ownerSpriteId)>=g.firstFrame&&frameFor(g.ownerSpriteId)<=g.lastFrame&&
  all.findIndex(x=>x.ownerSpriteId===g.ownerSpriteId&&x.buttonId===g.buttonId&&frameFor(x.ownerSpriteId)>=x.firstFrame&&frameFor(x.ownerSpriteId)<=x.lastFrame)===i);
 function frameFor(id:number){return id===305?frame:id===288?1:box?.frame??0;}
 return {sourceSha256:N.sourceSha256,question:shown(19)?line(19):null,
  options:B.options.filter((_,i)=>shown([166,169,172,175][i])).map((o,i)=>({...o,textId:[166,169,172,175][B.options.indexOf(o)]})),
  step1:shown(183)?[line(183)]:[],step2:[226,227].filter(shown).map(line),
  calculation:(shown(234)||boxReading&&box?.spriteId===250)?[234,235,236,237,238].map(line):[],
  table:(shown(255)||boxReading&&box?.spriteId===270)?{
   intro:line(255),headers:[line(259),line(260)],rows:[[261,262],[263,264],[265,266]].map(ids=>ids.map(line)),
   conclusion:[line(256),line(257)]}:null,
  help:state.helpVisible?{paragraphs:[276,279].map(line),equations:N.helpEquationLines}:null,
  glossary,boxReading};
}
