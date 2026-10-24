import{ALG_L07_P019_SOURCE as S}from'./alg-l07-p019-source-v1';export{ALG_L07_P019_SOURCE}from'./alg-l07-p019-source-v1';
export type P019Term=typeof S.terms[number]['sourceKeyAttribute'];export type P019Input='slope'|'intercept';
export const p019Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>232)throw Error('invalid-p019-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P019State{mainFrame:number;playing:boolean;slope:number;intercept:number;demoThumbs:readonly (number|null)[];replay:number;epoch:number;glossary:P019Term|null;left:boolean;}
export const p019InitialState=():P019State=>({mainFrame:1,playing:false,slope:1,intercept:0,demoThumbs:[null,null],replay:0,epoch:0,glossary:null,left:false});
export type P019Action={epoch:number}&({type:'play'|'pause'|'replay'|'leave'|'close-glossary'}|{type:'advance';frame:number}|{type:'slide';input:P019Input;value:number}|{type:'open-glossary';term:P019Term});
export const p019CanPlay=(s:P019State)=>!s.left&&!s.glossary&&s.mainFrame<231;
export function p019Reduce(s:P019State,a:P019Action):P019State{
 if(a.epoch!==s.epoch||s.left)return s;
 if(a.type==='replay')return{...p019InitialState(),replay:s.replay+1,epoch:s.epoch+1};
 if(a.type==='leave')return{...s,left:true,playing:false,glossary:null,demoThumbs:[null,null],epoch:s.epoch+1};
 if(a.type==='pause')return s.playing?{...s,playing:false}:s;
 if(a.type==='play')return p019CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(a.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(a.type==='open-glossary')return !s.glossary&&p019Visual(s.mainFrame).terms.includes(a.term)?{...s,glossary:a.term,playing:false}:s;
 if(a.type==='advance'){
  if(!s.playing||!Number.isSafeInteger(a.frame)||a.frame<s.mainFrame||a.frame>232)return s;
  const frame=Math.min(a.frame,231);if(frame===s.mainFrame)return s;
  const before=p019Visual(s.mainFrame),after=p019Visual(frame);return{...s,mainFrame:frame,playing:frame<231,demoThumbs:s.demoThumbs.map((v,i)=>before.demoPlacementStamps[i]===after.demoPlacementStamps[i]?v:null),...(s.mainFrame<231&&frame===231?{slope:1,intercept:0,demoThumbs:[null,null]}:{})};
 }
 if(a.type==='slide'){
  if(s.glossary||!Number.isFinite(a.value)||!['slope','intercept'].includes(a.input)||p019Visual(s.mainFrame).graphAlpha<=0)return s;
  const value=Math.round(Math.max(-10,Math.min(10,a.value))*10)/10,index=a.input==='slope'?0:1;
  if(s.mainFrame<231){const thumbs=[...s.demoThumbs];thumbs[index]=(value+10)/20;return{...s,demoThumbs:thumbs};}
  return s[a.input]===value?s:{...s,[a.input]:Object.is(value,-0)?0:value};
 }
 return s;
}
/** Preserve source 256-sample DrawPlot, including off-mask points. SVG owns clipping. */
export function p019Plot(slope:number,intercept:number){if(!Number.isFinite(slope)||!Number.isFinite(intercept)||slope<-10||slope>10||intercept<-10||intercept>10)throw Error('invalid-p019-plot');return Array.from({length:256},(_,i)=>{const x=-10+i*20/255,y=slope*x+intercept;return[i,(10-y)/(20/255)]as const;});}
