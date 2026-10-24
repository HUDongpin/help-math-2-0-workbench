import * as React from 'react';
import {p040EquationAt} from './nms-l02-p040-state-v1';
import {P040_EQUATION_TEXT} from './generated/nms-l02-p040-equation-text-v1';
export function p040EquationDescription(frame:number,language:'en'|'es'='en'){
 const pose=p040EquationAt(frame),visible=(id:number)=>pose.some(p=>p.characterId===id&&p.alpha>0);
 if(!visible(32))return '';
 const es=language==='es';
 if(visible(42))return es?'40% es igual a 40 sobre 100, igual a 0,40, igual a 0,4.':'40% equals 40 over 100, equals 0.40, equals 0.4.';
 if(visible(41))return es?'40% es igual a 40 sobre 100, igual a 0,40.':'40% equals 40 over 100, equals 0.40.';
 const numerator=pose.find(p=>p.characterId===37);
 if(numerator&&numerator.matrix[4]===2733&&numerator.matrix[5]===-373)return es?'40% es igual a 40 sobre 100.':'40% equals 40 over 100.';
 return es?'40%. Conversión de porcentaje a fracción en curso.':'40%. Percent-to-fraction conversion in progress.';
}
/** Native selectable text follows source transforms and alpha. Layout is qualified,
 * while source baseline/advance lengths keep transient mathematical objects aligned. */
export function P040Equation({frame,language='en',reducedMotion=false}:{frame:number;language?:'en'|'es';reducedMotion?:boolean}){
 const pose=p040EquationAt(frame),description=p040EquationDescription(frame,language);
 return <div role="region" tabIndex={0} aria-label={language==='es'?'Conversión de porcentaje; desplázate horizontalmente si es necesario.':'Percent conversion; scroll horizontally if needed.'} style={{maxWidth:'100%',overflowX:'auto'}} data-p040-equation-frame={frame}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="1200 -500 4700 1350" role="img" aria-label={description||undefined} aria-hidden={description?undefined:true} style={{display:'block',width:'min(100%, 36rem)',minWidth:'18rem',height:'auto',fontFamily:'var(--lesson-text-font-body,"HELP Math Nunito Sans"),sans-serif'}}>
   {pose.map(p=>{
    if(reducedMotion&&[38,39,40].includes(p.characterId))return null;
    const transform=`matrix(${p.matrix.join(' ')})`;
    if(p.characterId===34)return <path key={34} d="M3226 94 L2656 94" stroke="black" strokeWidth={20} transform={transform} opacity={p.alpha}/>;
    const text=P040_EQUATION_TEXT.find(t=>t.characterId===p.characterId);if(!text)return null;
    return <text key={p.characterId} data-source-character={p.characterId} data-lesson-text-block={[38,39,40].includes(p.characterId)?undefined:`equation-${p.characterId}`} x={text.x} y={text.baseline} transform={transform} opacity={p.alpha} fill={`rgb(${text.color.slice(0,3).join(',')})`} fontSize={text.fontHeight} textLength={text.advance} lengthAdjust="spacingAndGlyphs">{text.text}</text>;
   })}
  </svg>
 </div>;
}
