import * as React from 'react';
import {P046_HELP_SVG} from './generated/nms-l02-p046-help-svg-v1';
export function P046HelpDiagram({language='en'}:{language?:'en'|'es'}){
 const prefix='p046-help-'+React.useId().replace(/[^a-zA-Z0-9_-]/g,'')+'-';
 const description=language==='es'?'Dos círculos iguales: dos de cuatro partes y una de dos partes están coloreadas de verde.':'Two equal circles: two of four parts and one of two parts are shaded green.';
 return <figure style={{width:'100%',maxWidth:'32rem',margin:'1rem auto'}}>
  <svg role="img" aria-label={description} viewBox={`0 0 ${P046_HELP_SVG.width} ${P046_HELP_SVG.height}`} style={{display:'block',width:'100%',height:'auto'}} dangerouslySetInnerHTML={{__html:P046_HELP_SVG.markup.replaceAll('__P046_HELP__',prefix)}}/>
  <figcaption style={{textAlign:'center'}}>2/4 = 1/2</figcaption>
 </figure>;
}
