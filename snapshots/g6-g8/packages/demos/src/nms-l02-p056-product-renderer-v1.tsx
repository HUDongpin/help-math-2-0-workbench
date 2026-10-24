'use client';
import React,{useId,type CSSProperties} from 'react';
import type {AnimationRendererProps,RuntimeContext} from './contract';
import {p056SemanticSnapshot} from './nms-l02-p056-semantic-view-v1';
import {p056ProductTextContextReady,p056ProductTextSnapshotV1} from './nms-l02-p056-product-text-v1';
import {P056_DISPLAY_SOURCE} from './generated/nms-l02-p056-display-list-v1';
import {P056_SYMBOL_SOURCE} from './generated/nms-l02-p056-symbol-art-v1';
import {P056_SOURCE_BEHAVIOR} from './timelines/shared-nms002-l02-p056-source-behavior';
import {p056SourceSpriteSvg} from './timelines/shared-nms002-l02-p056-svg';

const card:CSSProperties={border:'2px solid #ad5a22',borderRadius:12,padding:'0.8rem',
  minHeight:'4.5rem',background:'#fff9f3',minWidth:0};
const question:CSSProperties={fontSize:'1.15rem',lineHeight:1.5,margin:'0.35rem 0'};
const hidden:CSSProperties={position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'};
const fade=(alpha:number):CSSProperties=>({opacity:alpha,transition:'none'});

/** Modern DOM is primary. The collapsed SVG preserves the exact source-static
 * layer projection for review; its unresolved dynamic text 11 is not invented. */
export function NmsL02P056ProductRendererV1(props:AnimationRendererProps){
  const id=useId().replace(/[^A-Za-z0-9_-]/gu,'');
  const context:RuntimeContext={frame:props.frame,frameDomain:props.frameDomain,rootFrame:props.rootFrame,
    scenario:props.scenario,lang:props.lang,seed:props.seed,replay:props.replay};
  let state:ReturnType<typeof p056SemanticSnapshot>|null=null;
  let svg='';
  let ready=false;
  try{
    if(!p056ProductTextContextReady(context)||
      P056_DISPLAY_SOURCE.animationId!==P056_SOURCE_BEHAVIOR.animationId||
      P056_DISPLAY_SOURCE.sourceSwfSha256!==P056_SOURCE_BEHAVIOR.swfSha256||
      P056_SYMBOL_SOURCE.sourceSwfSha256!==P056_SOURCE_BEHAVIOR.swfSha256||
      P056_DISPLAY_SOURCE.frameCount!==234||P056_DISPLAY_SOURCE.rootPlacement.frame!==6)
      throw Error('P056 source context or generated source identity');
    const text=p056ProductTextSnapshotV1(context);
    if(text.status!=='ready')throw Error('P056 source text snapshot');
    state=p056SemanticSnapshot(props.frame);
    svg=p056SourceSpriteSvg(props.frame,`P056Native${id}`,'native-stage');
    if(!svg.includes(`data-flash-frame="${props.frame}"`)||!svg.includes('viewBox="0 0 800 600"'))
      throw Error('P056 SVG projection identity');
    ready=true;
  }catch{/* Fail closed: the host sees data-canvas-status=error. */}
  const es=props.uiLanguage==='es';
  return <article className="nms-p056-product" lang="en" data-p056-product={P056_SOURCE_BEHAVIOR.animationId}
    data-p056-frame={ready?props.frame:undefined} data-source-frame-domain="sprite-24"
    data-source-swf-sha256={P056_SOURCE_BEHAVIOR.swfSha256}
    data-language-policy={es?'english-source-fallback':'english-source'}
    data-canvas-status={ready?'ready':'error'}
    style={{boxSizing:'border-box',maxWidth:'60rem',margin:'0 auto',padding:'clamp(0.6rem,3vw,1.5rem)',
      color:'#14283d',fontFamily:'var(--lesson-text-font-body, sans-serif)',lineHeight:1.5,minWidth:0}}>
    {es&&<p lang="es" data-spanish-translation="missing">Texto original en inglés. No hay una traducción al español verificada.</p>}
    {!ready||!state?<p role="alert">{es?'La proyección de la fuente no está disponible.':'The source projection is unavailable.'}</p>:<>
      <section aria-label="Four step plan" data-source-semantic-view="sprite-24">
        <div style={{minHeight:'5.5rem'}}>
          {state.headingAlpha>0&&<h2 data-source-text-id="12 14" aria-hidden={state.headingAlpha<1}
            style={{...fade(state.headingAlpha),fontSize:'clamp(1.35rem,3vw,1.7rem)',margin:'0 0 0.35rem'}}>
            2 <span data-source-key="Organize" style={state.highlightedTerm==='Organize'?{background:'#fbd8f5',color:'#762276'}:undefined}>Organize</span>
            {' the '}<span data-source-key="Information" style={state.highlightedTerm==='Information'?{background:'#fbd8f5',color:'#762276'}:undefined}>information</span>.
          </h2>}
          {state.haveQuestionAlpha>0&&<p data-source-text-id="20" aria-hidden={state.haveQuestionAlpha<1}
            style={{...question,...fade(state.haveQuestionAlpha)}}>What information do I have?</p>}
          {state.needQuestionAlpha>0&&<p data-source-text-id="22" aria-hidden={state.needQuestionAlpha<1}
            style={{...question,...fade(state.needQuestionAlpha)}}>What information do I need?</p>}
        </div>
        <ol style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,20rem),1fr))',
          gap:'0.65rem',listStyle:'none',margin:0,padding:0}}>
          <li style={card}><strong>1.</strong> <span data-source-text-id="9">Restate the question.</span></li>
          <li style={card}><strong>2.</strong> {state.stepTwoAlpha>0&&<span data-source-text-id="12"
            aria-hidden={state.stepTwoAlpha<1} style={fade(state.stepTwoAlpha)}>Organize the information.</span>}</li>
          <li style={card}><strong>3.</strong><span style={hidden}>No source step text on this page.</span></li>
          <li style={card}><strong>4.</strong><span style={hidden}>No source step text on this page.</span></li>
        </ol>
      </section>
      <details style={{marginTop:'1rem'}}>
        <summary>{es?'Dibujo de referencia de la fuente':'Source drawing reference'}</summary>
        <div aria-hidden="true" data-source-svg-projection="sprite-24" data-dynamic-text-11="unresolved"
          style={{maxWidth:'100%',overflow:'hidden'}} dangerouslySetInnerHTML={{__html:svg}}/>
      </details>
    </>}
  </article>;
}
