import React from 'react';
import {P048_COPY} from './nms-l02-p048-copy-v1';
import {P048PointerView} from './nms-l02-p048-pointer-view-v1';
import {P048GlossaryTerm} from './nms-l02-p048-glossary-v1';
import {p048Intro} from './nms-l02-p048-intro-v1';
import {P048HundredGrid} from './nms-l02-p048-grid-v1';
import {p048Decimal} from './nms-l02-p048-practice-v1';
/** Native draft for the source demonstration. Pointer/glossary cue integration is pending. */
export function P048IntroView({frame,language='en',reducedMotion=false,onModalChange,interactive=true}:{frame:number;interactive?:boolean;onModalChange?:(open:boolean)=>void;language?:'en'|'es';reducedMotion?:boolean}){
 const root=React.useRef<HTMLElement>(null);
 const state=p048Intro(frame,reducedMotion),es=language==='es';
 const alpha=(id:number)=>state.objects.find(o=>o.characterId===id)?.displayAlpha??0;
 const lines=P048_COPY[language].instructionLines;
 const renderLine=(line:string,index:number)=>{
  const words=index===0?[{word:es?'colorear':'shade',cue:407,term:null},{word:es?'cuadrados':'squares',cue:408,term:'square' as const}]:index===1?[{word:es?'decimales':'decimal',cue:409,term:'decimal' as const}]:[];
  const matches=words.map(w=>({...w,at:line.indexOf(w.word)})).filter(w=>w.at>=0).sort((a,b)=>a.at-b.at);
  const parts:React.ReactNode[]=[];let cursor=0;
  for(const match of matches){parts.push(line.slice(cursor,match.at));const text=<span data-p048-cue={match.cue} className={alpha(match.cue)>0?'p048-cue-active':undefined}>{match.word}</span>;parts.push(match.term?<P048GlossaryTerm key={match.word} term={match.term} language={language} onModalChange={onModalChange} disabled={!interactive||alpha([159,163,165][index]!)===0}>{text}</P048GlossaryTerm>:<React.Fragment key={match.word}>{text}</React.Fragment>);cursor=match.at+match.word.length;}
  parts.push(line.slice(cursor));return parts;
 };
 const questionAlpha=Math.max(alpha(169),alpha(177)),gridAlpha=alpha(168),sliderAlpha=Math.max(alpha(172),alpha(173));
 const handle=state.objects.find(o=>o.characterId===173),x=handle?.matrix[4]??-6323;
 // Map the authored demonstration handle's recorded travel onto the native track.
 const position=Math.max(0,Math.min(75,(x+6323)/(6323-2917)*75));
 return <section ref={root} className="p048-intro" lang={language} data-p048-intro-frame={frame}>
  <h2>{es?'Pregunta 6':'Question 6'}</h2>
  <p>{lines.map((line,i)=><span key={i} style={{opacity:alpha([159,163,165][i]!)}} aria-hidden={alpha([159,163,165][i]!)===0}>{renderLine(line,i)}{' '}</span>)}</p>
  <h3 style={{opacity:questionAlpha}} aria-hidden={questionAlpha===0}>{es?'Crea el decimal 0.75.':'Create the decimal 0.75.'}</h3>
  <div style={{opacity:gridAlpha}} aria-hidden={gridAlpha===0}><P048HundredGrid value={state.hundredths??0} language={language}/><p className="p048-demo-value">{p048Decimal(state.hundredths??0)}</p></div>
  <div className="p048-demo-track" style={{opacity:sliderAlpha}} aria-hidden="true"><span style={{left:`${position}%`}}/></div>
  <div className="p048-input-actions" aria-hidden="true"><button data-p048-check disabled style={{opacity:Math.max(alpha(174),alpha(175),alpha(412))}}><span className={alpha(412)>0?'p048-cue-active':undefined}>{es?'Comprobar respuesta':'Check Answer'}</span></button><button disabled style={{opacity:alpha(178)}}>{es?'Restablecer':'Reset'}</button></div>
 <P048PointerView frame={frame} position={position} reducedMotion={reducedMotion} root={root}/>
 </section>;
}
