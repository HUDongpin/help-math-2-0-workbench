'use client';
import{useEffect,useId,useRef,type ReactNode}from'react';import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P019_SOURCE as S,p019Plot,type P019Input,type P019Term}from'./alg-l07-p019-state-v1';import{algL07P019Frame,type P019View}from'./alg-l07-p019-frame-v1';import'./alg-l07-p019-v1.css';
const matrix=(m:readonly number[],scale=1)=>`matrix(${m[0]*scale} ${m[1]*scale} ${m[2]*scale} ${m[3]*scale} ${m[4]} ${m[5]})`;
function Path({p}:{p:Readonly<Record<string,string>>}){return <path d={p.d} fill={p.fill} fillOpacity={p['fill-opacity']} stroke={p.stroke} strokeWidth={p['stroke-width']} strokeOpacity={p['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>;}
function GraphScroll({label,children}:{label:string;children:ReactNode}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const e=ref.current;if(e)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);},[]);return <div ref={ref} className="alg-l07-p019__scroll" role="region" tabIndex={0} aria-label={label} data-p019-graph-scroll="true">{children}</div>;}
export interface P019PresentationProps{view:P019View;disabled?:boolean;onSlide?:(input:P019Input,value:number)=>void;onTerm?:(term:P019Term,button:HTMLButtonElement)=>void;}
export function AlgL07P019Presentation({view,disabled=false,onSlide,onTerm}:P019PresentationProps){const id=useId();if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const {state,visual:v}=view,es=view.language==='es',g=S.graph,b=g.viewBox,blocked=disabled||Boolean(state.glossary)||!onSlide;
 const names={slope:es?'Pendiente':'Slope',intercept:es?'Intersección con y':'Y-intercept'};
 const node=(n:typeof v.nodes[number])=><g key={n.instanceId} clipPath={n.clipBoxes.length?`url(#${id}-${n.sourceShapeId})`:undefined} data-source-shape={n.sourceShapeId} data-source-instance-id={n.instanceId}><defs>{n.clipBoxes.map((c,i)=><clipPath key={i} id={`${id}-${n.sourceShapeId}`}><rect x={c[0]} y={c[2]} width={c[1]-c[0]} height={c[3]-c[2]}/></clipPath>)}</defs><g transform={matrix(n.matrix,20)} opacity={n.alpha}>{g.shapes.find(s=>s.sourceShapeId===n.sourceShapeId)!.paths.map((p,i)=><Path key={i} p={p}/>)}</g></g>;
 const controls=(only?:P019Input)=> <div className="alg-l07-p019__actions">{(['slope','intercept']as const).filter(k=>!only||k===only).map((key)=>{const index=key==='slope'?0:1,live=v.interactive||Boolean(only),display=live?(only?key==='slope'?'1':'0':String(state[key])):(state.demoThumbs[index]??v.demoKnobRatios[index]??.5)*20-10;return <div key={key} className="alg-l07-p019__slider-group" data-p019-slider-cue={!only&&v.sliderCue===key}>
 <label htmlFor={`${id}-${key}`} lang={live?'en':view.language}>{live?<><span data-lesson-text-block={`${key}-label`}>{key==='slope'?'slope =':'y-intercept ='}</span><output data-lesson-text-block={key} data-p019-value={key}>{display}</output></>:names[key]}</label>
 <input id={`${id}-${key}`} type="range" aria-label={names[key]} min={-10} max={10} step={.1} value={Number(display)} disabled={blocked||Boolean(only)} data-p019-slider={key} data-p019-slider-mode={live?'live':'demo-thumb-only'} onChange={e=>onSlide?.(key,e.currentTarget.valueAsNumber)}/>
 </div>;})}</div>;
 const child=view.childId;
 return <section className="alg-l07-p019 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={es} lang="en">
 {view.childOnly?<div data-p019-source-child={child}>
 {[4,6].includes(child!)?<div className="alg-l07-p019__static-track" aria-hidden="true"/>:[10,13].includes(child!)?<span className="alg-l07-p019__static-grip" aria-hidden="true">|||</span>:[11,14].includes(child!)?<div className="alg-l07-p019__static-thumb" aria-hidden="true"/>:child===50?<svg className="alg-l07-p019__static-line" viewBox="-140 -140 280 280" aria-hidden="true"><g transform="translate(19.35 19.7)">{g.shapes.find(s=>s.sourceShapeId===49)!.paths.map((p,i)=><Path p={p} key={i}/>)}</g></svg>:[91,96].includes(child!)?<output data-lesson-text-block={child===91?'slope':'intercept'}>100</output>:[93,94,98,99].includes(child!)?controls([93,94].includes(child!)?'slope':'intercept'):null}
 </div>:<>
 <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Vocabulary" language="en"/>
 <div className="alg-l07-p019__instruction">{v.paragraphs.map((text,i)=>text&&<p key={i} data-lesson-text-block={`paragraph-${i}`}>{text}</p>)}</div>
 {onTerm&&<nav className="alg-l07-p019__terms" aria-label={es?'Términos clave':'Key terms'} lang={view.language}>{v.terms.map(term=><button key={term} type="button" data-p019-term={term} disabled={disabled} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms[0].labels[view.language]}</button>)}</nav>}
 {v.graphAlpha>0&&<>
 <div className="alg-l07-p019__exercise" style={{opacity:v.graphAlpha}}>
 {v.equation&&<p className="alg-l07-p019__equation" data-p019-equation="true"><span data-lesson-text-block="equation-prefix">Equation of line: y =</span><output aria-label={names.slope} data-lesson-text-block="slope" data-p019-demo-value="slope">{view.slope}</output><span data-lesson-text-block="equation-suffix">x +</span><output aria-label={names.intercept} data-lesson-text-block="intercept" data-p019-demo-value="intercept">{view.intercept}</output></p>}
 {controls()}
 </div>
 <figure className="alg-l07-p019__figure" data-p019-graph-alpha={v.graphAlpha}><figcaption lang={view.language}>{es?'Desplaza el gráfico para ver todos los valores.':'Scroll the graph to view every value.'}</figcaption>
 <GraphScroll label={es?'Gráfico de pendiente e intersección con y':'Slope and y-intercept graph'}><div className="alg-l07-p019__plot" style={{aspectRatio:`${b[2]} / ${b[3]}`}}>
 <svg viewBox={b.join(' ')} aria-hidden="true">{v.nodes.filter(n=>n.sourceShapeId===24).map(node)}</svg>
 {g.labels.map((l,i)=><span key={l.instanceId} className="alg-l07-p019__axis" data-lesson-text-block={`axis-${i}`} data-source-text-id={l.sourceTextId} data-source-instance-id={l.instanceId} style={{opacity:v.graphAlpha,left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`}}>{l.text}</span>)}
 <svg className="alg-l07-p019__foreground" viewBox={b.join(' ')} aria-hidden="true">{v.nodes.filter(n=>n.sourceShapeId!==24).map(node)}
 {v.interactive&&<g clipPath={`url(#${id}-dynamic-clip)`}><defs><clipPath id={`${id}-dynamic-clip`}><rect x={g.dynamic.clipBox[0]} y={g.dynamic.clipBox[2]} width={g.dynamic.clipBox[1]-g.dynamic.clipBox[0]} height={g.dynamic.clipBox[3]-g.dynamic.clipBox[2]}/></clipPath></defs><polyline data-p019-dynamic-line="true" data-p019-m={state.slope} data-p019-c={state.intercept} points={p019Plot(state.slope,state.intercept).map(p=>p.join(',')).join(' ')} transform={matrix(g.dynamic.matrix,20)} fill="none" stroke={g.dynamic.lineColor} strokeWidth={g.dynamic.lineWidth} strokeLinecap="round" strokeLinejoin="round"/></g>}
 </svg>
 </div></GraphScroll></figure>
 </>}
 </>}
 </section>;
}
export function AlgL07P019Renderer(props:AnimationRendererProps){return <AlgL07P019Presentation view={algL07P019Frame(props.frame,{...props,frame:props.frame})}/>;}
