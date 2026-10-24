'use client';
import{createElement,useEffect,useId,useRef,type ReactNode}from'react';import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L08_P013_SOURCE as S,p013CanDraw,p013CanDrag,p013CanDragIntercept,type P013Term}from'./alg-l08-p013-state-v1';import type{P013SvgNode,P013GraphicNode}from'./alg-l08-p013-source-v1';import{algL08P013Frame,type P013View}from'./alg-l08-p013-frame-v1';import'./alg-l08-p013-v1.css';
const matrix=(m:readonly number[],scale=1)=>`matrix(${m[0]*scale} ${m[1]*scale} ${m[2]*scale} ${m[3]*scale} ${m[4]} ${m[5]})`;
const shapes=new Map(S.graph.shapes.map(s=>[s.sourceShapeId,s])),bitmaps=new Map(S.graph.bitmaps.map(b=>[b.sourceBitmapId,b]));
/** Sanitized, hash-bound public-tool SVG trees: source paths, gradients and the
 * two deduplicated source bitmaps only. IDs are local to each native figure. */
function SourceSvgTree({node,prefix}:{node:P013SvgNode;prefix:string}){const props:Record<string,unknown>={};for(const[k,v]of Object.entries(node.attributes)){
 if(k==='style'){props.style=Object.fromEntries(v.split(';').filter(Boolean).map(s=>{const[k,v]=s.split(':');return[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v];}));continue;}
 const key=k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());props[key]=k==='id'?`${prefix}-${v}`:v.replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}-${id})`);
 }if(node.bitmapId!==null){props.href=bitmaps.get(node.bitmapId)!.dataUrl;props['data-source-bitmap']=node.bitmapId;}
 return createElement(node.tag,props,node.children.length?node.children.map((n,i)=><SourceSvgTree key={i} node={n} prefix={prefix}/>):undefined);
}
function GraphicScene({nodes,viewBox,label}:{nodes:readonly P013GraphicNode[];viewBox:readonly number[];label?:string}){
 const prefix=useId().replace(/:/g,''),used=[...new Set(nodes.flatMap(n=>[n.sourceShapeId,...n.clips.map(c=>c.sourceShapeId)]))],clips=new Map(nodes.flatMap(n=>n.clips.map(c=>[c.instanceId,c]as const))),colors=[...new Set(nodes.map(n=>n.colorIndex))];
 const clipId=(id:string)=>`${prefix}-clip-${id.replace(/[^a-zA-Z0-9_-]/g,'_')}`;
 return <svg viewBox={viewBox.join(' ')} aria-hidden={label?undefined:true} role={label?'img':undefined} aria-label={label} data-p013-source-graphic="true"><defs>
 {used.flatMap(id=>{const shape=shapes.get(id)!;return [...shape.defs,...shape.nodes.filter(n=>n.tag!=='path')].map((n,i)=><SourceSvgTree key={`${id}-${i}`} node={n} prefix={`${prefix}-s${id}`}/>);})}
 {colors.map(id=>{const c=S.graph.colors[id];return <filter key={id} id={`${prefix}-color-${id}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" slope={c.multiply[0]} intercept={c.add[0]}/><feFuncG type="linear" slope={c.multiply[1]} intercept={c.add[1]}/><feFuncB type="linear" slope={c.multiply[2]} intercept={c.add[2]}/></feComponentTransfer></filter>;})}
 {[...clips].map(([id,c])=><clipPath key={id} id={clipId(id)} clipPathUnits="userSpaceOnUse">{shapes.get(c.sourceShapeId)!.nodes.filter(n=>n.tag==='path'&&n.attributes.fill!=='none').map((n,i)=><path key={i} transform={matrix(c.matrix,20)} d={n.attributes.d} clipRule="evenodd"/>)}</clipPath>)}
 </defs>{nodes.map(n=>{const c=S.graph.colors[n.colorIndex],colored=c.multiply.some(v=>v!==1)||c.add.some(v=>v!==0);let graphic:ReactNode=<g transform={matrix(n.matrix,20)} opacity={n.alpha} filter={colored?`url(#${prefix}-color-${n.colorIndex})`:undefined} data-source-shape={n.sourceShapeId} data-source-instance-id={n.instanceId} data-source-color-index={n.colorIndex}>{shapes.get(n.sourceShapeId)!.nodes.filter(x=>x.tag==='path').map((x,i)=><SourceSvgTree key={i} node={x} prefix={`${prefix}-s${n.sourceShapeId}`}/>)}</g>;
 for(const clip of n.clips)graphic=<g clipPath={`url(#${clipId(clip.instanceId)})`} data-source-clip-shape={clip.sourceShapeId}>{graphic}</g>;return <g key={n.instanceId}>{graphic}</g>;})}</svg>;
}
function GraphScroll({label,children}:{label:string;children:ReactNode}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const e=ref.current;if(e)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);},[]);return <div ref={ref} className="alg-l08-p013__scroll" role="region" tabIndex={0} aria-label={label} data-p013-graph-scroll="true">{children}</div>;}
export interface P013PresentationProps{view:P013View;disabled?:boolean;feedbackCloseDisabled?:boolean;onSlide?:(x:number)=>void;onIntercept?:(x:number)=>void;onSubmit?:(button:HTMLButtonElement)=>void;onCloseFeedback?:()=>void;onTerm?:(term:P013Term,button:HTMLButtonElement)=>void;}
export function AlgL08P013Presentation({view,disabled=false,feedbackCloseDisabled=false,onSlide,onIntercept,onSubmit,onCloseFeedback,onTerm}:P013PresentationProps){const slopeLabel=useId(),interceptLabel=useId(),feedbackTitle=useId();if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const{state,visual:v}=view,es=view.language==='es',g=S.graph,b=g.viewBox,child=g.childDomains[view.childId];
 return <section className="alg-l08-p013 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={es} lang="en">
 {view.childOnly?(view.childKind==='title'?<LessonAnimationTitleV1 courseTitle="Graphing Linear Equations:" activityTitle="Vocabulary" language="en"/>:<div className="alg-l08-p013__child"><GraphicScene nodes={child.frames[view.frame-1]} viewBox={child.viewBox} label={es?'Gráfico original':'Source graphic'}/></div>):<>
 <LessonAnimationTitleV1 courseTitle="Graphing Linear Equations:" activityTitle="Vocabulary" language="en"/>
 <div className="alg-l08-p013__instruction">{v.paragraphs.map((text,i)=>text&&<p key={i} data-lesson-text-block={`paragraph-${i}`}>{text}</p>)}</div>
 {onTerm&&<nav className="alg-l08-p013__terms" aria-label={es?'Términos clave':'Key terms'} lang={view.language}>{v.terms.map(term=><button type="button" key={term} data-p013-term={term} disabled={disabled} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
 {state.popupVisible&&state.popupFrame>=2&&<section className="alg-l08-p013__feedback" role="dialog" aria-labelledby={feedbackTitle} data-p013-feedback="true"><h3 id={feedbackTitle} tabIndex={-1} data-p013-feedback-title="true">{es?'Comentarios':'Feedback'}</h3><p data-lesson-text-block="feedback">{state.wrongText}</p><button type="button" data-p013-close-feedback="true" disabled={feedbackCloseDisabled||Boolean(state.glossary)} onClick={onCloseFeedback} lang={view.language} data-lesson-text-block="close">{es?'Cerrar':'Close'}</button></section>}
 {v.graphAlpha>0&&<>
 <div className="alg-l08-p013__exercise" style={{opacity:v.graphAlpha}}>
 <p className="alg-l08-p013__equation"><span data-lesson-text-block="equation-prefix">Equation of line: y =</span><output aria-label={es?'Pendiente':'Slope'} data-p013-slope="true" data-lesson-text-block="slope">{view.slope}</output><span data-lesson-text-block="equation-suffix">x +</span><output aria-label={es?'Intersección con y':'Y-intercept'} data-p013-intercept="true" data-lesson-text-block="intercept">{view.intercept}</output></p>
 <div className="alg-l08-p013__actions">
 <div className="alg-l08-p013__slider-group" data-p013-slider-cue={v.sliderCue}><label id={slopeLabel} lang={view.language}>{es?'Pendiente':'Slope'}</label><input type="range" aria-labelledby={slopeLabel} min={-230} max={-30} step={1} aria-valuetext={view.slope} value={state.sliderX} disabled={disabled||!p013CanDrag(state)} data-p013-slider="true" onChange={e=>onSlide?.(e.currentTarget.valueAsNumber)}/></div>
 <div className="alg-l08-p013__slider-group"><label id={interceptLabel} lang={view.language}>{es?'Intersección con y':'Y-intercept'}</label><input type="range" aria-labelledby={interceptLabel} min={-10} max={185} step={1} aria-valuetext={view.intercept} value={state.interceptX} disabled={disabled||!p013CanDragIntercept(state)} data-p013-intercept-slider="true" onChange={e=>onIntercept?.(e.currentTarget.valueAsNumber)}/></div>
 {v.drawVisible&&<div className="alg-l08-p013__draw-wrap" data-p013-draw-cue={v.drawCue}><button type="button" data-p013-draw="true" data-lesson-text-block="draw" disabled={disabled||!p013CanDraw(state)||!onSubmit} onClick={e=>onSubmit?.(e.currentTarget)} lang={view.language}>{es?'Dibujar la recta':'Draw the Line'}</button></div>}
 </div></div>
 <figure className="alg-l08-p013__figure" data-p013-graph-alpha={v.graphAlpha}><figcaption lang={view.language}>{es?'Desplaza el gráfico para ver todos los valores.':'Scroll the graph to view every value.'}</figcaption>
 <GraphScroll label={es?'Gráfico de pendiente e intersección':'Slope and intercept graph'}><div className="alg-l08-p013__plot" style={{aspectRatio:`${b[2]} / ${b[3]}`}}>
 <GraphicScene nodes={v.nodes} viewBox={b}/>
 {g.labels.map((l,i)=>{const st=v.labelStyles[i],c=g.colors[st.colorIndex],gray=Math.round(c.add[0]*255);return <span key={l.instanceId} className="alg-l08-p013__axis" data-lesson-text-block={`axis-${i}`} data-source-text-id={l.sourceTextId} data-source-instance-id={l.instanceId} style={{opacity:st.alpha,color:`rgb(${gray},${gray},${gray})`,left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`}}>{l.text}</span>;})}
 </div></GraphScroll></figure>
 </>}
 </>}
 </section>;
}
export function AlgL08P013Renderer(props:AnimationRendererProps){return <AlgL08P013Presentation view={algL08P013Frame(props.frame,{...props,frame:props.frame})}/>;}
