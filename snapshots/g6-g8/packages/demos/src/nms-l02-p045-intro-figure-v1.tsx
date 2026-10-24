import * as React from 'react';
import {P045_INTRO_ASSETS} from './generated/nms-l02-p045-intro-assets-v1';
import {p045IntroFrame} from './nms-l02-p045-intro-v1';
/** Only whitelisted generated source SVG markup enters this component. */
export function P045IntroFigure({frame,language='en',reducedMotion=false}:{frame:number;language?:'en'|'es';reducedMotion?:boolean}){
  const id='p045-'+React.useId().replace(/[^a-zA-Z0-9_-]/g,'');const state=p045IntroFrame(frame);
  if(state.shapeId===null||state.alpha<=0)return null;
  const asset=P045_INTRO_ASSETS[String(state.shapeId) as keyof typeof P045_INTRO_ASSETS];
  const description=language==='es'?'Gráfico circular de la demostración; cada parte representa un décimo.':'Demonstration pie chart; each part represents one tenth.';
  return <figure data-p045-intro-shape={state.shapeId} style={{width:'100%',maxWidth:'20rem',margin:'1rem auto',opacity:reducedMotion?1:state.alpha}}>
    <svg role="img" aria-label={description} viewBox={`0 0 ${asset.width} ${asset.height}`}
      style={{display:'block',width:'100%',height:'auto'}} dangerouslySetInnerHTML={{__html:asset.markup.replaceAll('__P045_PREFIX__',id)}}/>
    {state.unitLabel&&<figcaption style={{textAlign:'center'}}>{state.unitLabel}</figcaption>}
  </figure>;
}
