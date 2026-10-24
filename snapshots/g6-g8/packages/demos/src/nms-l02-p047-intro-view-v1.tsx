import * as React from 'react';
import {p047IntroState} from './nms-l02-p047-intro-v1';
import {P047Fraction} from './nms-l02-p047-number-line-v1';
import {P047Instruction} from './nms-l02-p047-instruction-v1';
import {P047_COPY} from './nms-l02-p047-copy-v1';
import {P047_SOURCE_TEXT} from './generated/nms-l02-p047-text-v1';
/** Native clearance arc preserves source frame endpoints while avoiding enlarged-label overlap. */
export const p047IntroLift=(frame:number)=>frame>57&&frame<64?4*Math.sin(Math.PI*(frame-57)/7):0;
const fractionIds=new Set([40,41,42,43,55]);
const horizontal=(x:number)=>Math.max(5.5556,Math.min(94.4444,5.5556+(x+5975)/11472*88.8888));
/** Source frame/movement sequence in a responsive native layout. Source twips
 * determine progress; rem-based vertical spacing preserves readable fractions.
 */
export function P047IntroView({frame,language='en',reducedMotion=false,onModalChange,interactive=true}:{frame:number;language?:'en'|'es';reducedMotion?:boolean;onModalChange?:(open:boolean)=>void;interactive?:boolean}){
 const s=p047IntroState(frame),copy=P047_COPY[language];
 const sourceLine=s.geometry.find(g=>g.characterId===18||g.characterId===53);
 const fractions=s.texts.filter(t=>fractionIds.has(t.characterId)&&t.alpha>0);
 const pointer=s.geometry.find(g=>g.characterId===54&&g.alpha>0);
 const worked=s.texts.find(t=>t.characterId===40);
 const workedTop=worked?Math.max(1,1+Math.max(0,Math.min(1,(worked.matrix[5]+1220)/3038))*7-p047IntroLift(frame)):1;
 const emphasis=s.texts.find(t=>[56,57,58].includes(t.characterId)&&t.alpha>0);
 const term=emphasis?(language==='es'?({56:'fracción',57:'posición',58:'recta numérica'} as Record<number,string>)[emphasis.characterId]:P047_SOURCE_TEXT[String(emphasis.characterId) as '56'|'57'|'58'].runs.map(r=>r.text).join('')):null;
 return <section className="p047-activity" lang={language} data-p047-intro-frame={frame}>
  <h2>{copy.question}</h2>{frame>=8&&<><P047Instruction text={copy.instruction} language={language} enabled={interactive} onModalChange={onModalChange}/><p>{copy.guidance}</p></>}<p>{copy.watch}</p>
  <div className="p047-intro-board" aria-label={language==='es'?'Demostración de fracciones en la recta numérica':'Demonstration of fractions on the number line'}>
   {sourceLine&&sourceLine.alpha>0&&<div className="p047-line-grid p047-intro-line" style={{opacity:reducedMotion?1:sourceLine.alpha}} aria-hidden="true">
    {Array.from({length:9},(_,i)=><div className="p047-line-mark" key={i}><span className="p047-tick"/><span>{i===0?'0':i===8?'1':'\u00a0'}</span></div>)}
   </div>}
   {fractions.map(t=>{const value=P047_SOURCE_TEXT[String(t.characterId)as '40'|'41'|'42'|'43'|'55'];const x=t.characterId===40&&frame>=57&&reducedMotion?2546:t.matrix[4];const y=t.characterId===40&&frame>=57&&reducedMotion?-1220:t.matrix[5];return <div key={t.depth} className="p047-intro-fraction" data-source-text={t.characterId} data-p047-stationary={!(t.characterId===40&&frame>=57)||undefined} data-p047-slot={Math.round((t.matrix[4]+4251)/2020)} style={{left:horizontal(x)+'%',top:Math.max(1,1+Math.max(0,Math.min(1,(y+1220)/3038))*7-(t.characterId===40&&!reducedMotion?p047IntroLift(frame):0))+'em',opacity:reducedMotion?1:t.alpha}}><P047Fraction numerator={Number(value.runs[0].text)} denominator={Number(value.runs[1].text)}/></div>;})}
   {pointer&&!reducedMotion&&<span aria-hidden="true" className="p047-intro-pointer" style={{left:horizontal(pointer.matrix[4])+'%',top:(frame>=57&&frame<=64?workedTop+2.8:Math.max(1,3+Math.max(0,Math.min(1,(pointer.matrix[5]+818)/5203))*7-p047IntroLift(frame)))+'em'}}/>}
  </div>
  <p className="p047-term-cue" aria-hidden="true">{reducedMotion?null:term}</p>
 </section>;
}
