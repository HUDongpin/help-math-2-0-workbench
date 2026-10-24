'use client';
import{useEffect,useRef,type ReactNode}from'react';import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L08_P011_SOURCE as S,type P011Term}from'./alg-l08-p011-state-v1';import{algL08P011Frame,type P011View}from'./alg-l08-p011-frame-v1';import'./alg-l08-p011-v1.css';
const matrix=(m:readonly number[],scale=1)=>`matrix(${m[0]*scale} ${m[1]*scale} ${m[2]*scale} ${m[3]*scale} ${m[4]} ${m[5]})`;
function Path({p}:{p:Readonly<Record<string,string>>}){return <path d={p.d} fill={p.fill} fillOpacity={p['fill-opacity']} stroke={p.stroke} strokeWidth={p['stroke-width']} strokeOpacity={p['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>;}
function GraphScroll({label,children}:{label:string;children:ReactNode}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const e=ref.current;if(e)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);},[]);return <div ref={ref} className="alg-l08-p011__scroll" role="region" tabIndex={0} aria-label={label} data-p011-graph-scroll="true">{children}</div>;}
export function p011MorphPaths(id:number,ratio:number){
 if(!Number.isFinite(ratio)||ratio<0||ratio>65535)throw Error('P011_MORPH_RATIO');
 const morph=S.graph.morphs.find(m=>m.sourceShapeId===id);if(!morph)throw Error('P011_MORPH_ID');const t=ratio/65535;
 return morph.paths.map(p=>{const out:Record<string,string>={...p.attributes,d:p.tokens.map(v=>typeof v==='string'?v:String(v[0]+(v[1]-v[0])*t)).join(' ')};for(const[key,pair]of Object.entries(p.animations)){if(key==='stroke'){const a=parseInt(pair[0].slice(1),16),b=parseInt(pair[1].slice(1),16);out[key]='#'+[16,8,0].map(shift=>Math.round(((a>>shift)&255)+(((b>>shift)&255)-((a>>shift)&255))*t).toString(16).padStart(2,'0')).join('');}else out[key]=String(Number(pair[0])+(Number(pair[1])-Number(pair[0]))*t);}return out;});
}
export interface P011PresentationProps{view:P011View;disabled?:boolean;onTerm?:(term:P011Term,button:HTMLButtonElement)=>void;}
export function AlgL08P011Presentation({view,disabled=false,onTerm}:P011PresentationProps){if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const v=view.visual,es=view.language==='es',g=S.graph,b=g.viewBox;
 return <section className="alg-l08-p011 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={es} lang="en">
 <LessonAnimationTitleV1 courseTitle="Graphing Linear Equations:" activityTitle="Vocabulary" language="en"/>
 {!view.childOnly&&<>
 <div className="alg-l08-p011__instruction">{v.paragraphs.map((text,i)=>text&&<p key={i} data-lesson-text-block={`paragraph-${i}`}>{text}</p>)}</div>
 {onTerm&&v.terms.length>0&&<nav className="alg-l08-p011__terms" aria-label={es?'Términos clave':'Key terms'} lang={view.language}>{v.terms.map(term=><button type="button" key={term} data-p011-term={term} disabled={disabled} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
 {v.graphAlpha>0&&<figure className="alg-l08-p011__figure" data-p011-graph-alpha={v.graphAlpha}><figcaption lang={view.language}>{es?'Desplaza el gráfico para ver todos los valores.':'Scroll the graph to view every value.'}</figcaption>
 <GraphScroll label={es?'Gráfico de tres pendientes positivas':'Graph of three positive slopes'}><div className="alg-l08-p011__plot" style={{aspectRatio:`${b[2]} / ${b[3]}`}}>
 <svg viewBox={b.join(' ')} aria-hidden="true">{v.nodes.map(node=><g key={node.instanceId} transform={matrix(node.matrix,20)} opacity={node.alpha} data-source-shape={node.sourceShapeId} data-source-instance-id={node.instanceId} data-source-ratio={node.ratio??undefined}>{(node.ratio===null?g.shapes.find(shape=>shape.sourceShapeId===node.sourceShapeId)!.paths:p011MorphPaths(node.sourceShapeId,node.ratio)).map((p,i)=><Path key={i} p={p}/>)}</g>)}</svg>
 {g.labels.map((l,i)=><span key={l.instanceId} className="alg-l08-p011__axis" data-lesson-text-block={`axis-${i}`} data-source-text-id={l.sourceTextId} data-source-instance-id={l.instanceId} style={{opacity:v.graphAlpha,left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`}}>{l.text}</span>)}
 {v.callouts.map(c=>c.alpha>0&&<span key={c.sourceCharacterId} className="alg-l08-p011__callout" data-lesson-text-block={`callout-${c.sourceCharacterId}`} data-source-text-id={c.sourceTextId} style={{opacity:c.alpha,left:`${(c.x-b[0])*100/b[2]}%`,top:`${(c.y-b[1])*100/b[3]}%`}}>{c.text}</span>)}
 </div></GraphScroll></figure>}
 </>}
 </section>;
}
export function AlgL08P011Renderer(props:AnimationRendererProps){return <AlgL08P011Presentation view={algL08P011Frame(props.frame,{...props,frame:props.frame})}/>;}
