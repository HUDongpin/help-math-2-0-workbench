import * as React from 'react';
import {P045_HELP_SVG} from './generated/nms-l02-p045-help-svg-v1';
/** Source sprite30, shape22 and text21/25/26: four of six, source orange fill. */
export function P045HelpDiagram({language='en'}:{language?:'en'|'es'}){
 const label=language==='es'?'Cuatro de seis partes iguales del círculo están coloreadas.':'Four of six equal parts of the circle are shaded.';
 return <figure style={{width:'100%',maxWidth:'18rem',margin:'1rem auto'}}>
  <svg role="img" aria-label={label} viewBox={`0 0 ${P045_HELP_SVG.width} ${P045_HELP_SVG.height}`} style={{display:'block',width:'100%',height:'auto'}} dangerouslySetInnerHTML={{__html:P045_HELP_SVG.markup}}/>
  <figcaption style={{textAlign:'center',overflowWrap:'anywhere'}}>{language==='es'?'4 partes seleccionadas de 6':'4 selected parts out of 6'} — 4/6</figcaption>
 </figure>;
}
