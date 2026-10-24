import * as React from 'react';
/** Source shape12: six equal sectors, four selected. Native vector, not source pixels. */
export function P044HelpDiagram({language='en'}:{language?:'en'|'es'}){
  const label=language==='es'?'Cuatro de seis partes iguales del círculo están seleccionadas.':'Four of six equal parts of the circle are selected.';
  return <figure className="p044-help-diagram"><svg viewBox="0 0 240 240" role="img" aria-label={label}>
    {Array.from({length:6},(_,i)=>{
      const a=-Math.PI/2+i*Math.PI/3,b=a+Math.PI/3;
      return <path key={i} data-part={i+1} data-selected={i>=2} d={`M120 120 L${120+100*Math.cos(a)} ${120+100*Math.sin(a)} A100 100 0 0 1 ${120+100*Math.cos(b)} ${120+100*Math.sin(b)} Z`}
        fill={i>=2?'#c74285':'#fff'} stroke="#172c43" strokeWidth="1.5"/>;
    })}
  </svg><figcaption>{language==='es'?'4 de 6 partes seleccionadas':'4 of 6 parts selected'} — 4/6</figcaption></figure>;
}
