'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import type {AnimationRendererProps} from './contract';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {ALG_L07_P046_SOURCE as S,p046CanInteract,type P046Point,type P046PointName,type P046FeedbackId,type P046Term} from './alg-l07-p046-state-v1';
import {ALG_L07_P046_VISUAL as V} from './alg-l07-p046-visual-source-v1';
import {p046MorphPath,type P046VectorPath} from './alg-l07-p046-native-v1';
import {algL07P046Frame,type P046View} from './alg-l07-p046-frame-v1';
import './alg-l07-p046-v1.css';
export interface P046PresentationProps {
 view:P046View;controlsLocked?:boolean;onNamedPoint?:(name:P046PointName)=>void;onBackgroundPoint?:(point:P046Point)=>void;onClonePoint?:(name:string)=>void;
 onSubmit?:(button:HTMLButtonElement)=>void;onCloseFeedback?:(id:P046FeedbackId)=>void;
 onTerm?:(term:P046Term,button:HTMLButtonElement)=>void;onHelp?:(button:HTMLButtonElement)=>void;onHelpClose?:()=>void;onPromptClose?:()=>void;
}
const matrix=(m:readonly number[])=>`matrix(${m[0]*20} ${m[1]*20} ${m[2]*20} ${m[3]*20} ${m[4]} ${m[5]})`;
function Paths({paths,ratio=0}:{paths:readonly P046VectorPath[];ratio?:number}){return <>{paths.map((p,i)=>{const a=p046MorphPath(p,ratio);return <path key={i} d={a.d} fill={a.fill} fillOpacity={a['fill-opacity']} stroke={a.stroke} strokeWidth={a['stroke-width']} strokeOpacity={a['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>;})}</>;}
function Terms({terms,language,onTerm}:Pick<P046PresentationProps,'onTerm'>&{terms:readonly P046Term[];language:'en'|'es'}){return onTerm&&<nav className="alg-l07-p046__terms" aria-label={language==='es'?'Términos clave':'Key terms'} lang={language}>{terms.map(t=><button key={t} type="button" data-p046-term={t} onClick={e=>onTerm(t,e.currentTarget)}>{S.terms.find(s=>s.sourceActionKey===t)!.labels[language]}</button>)}</nav>;}
function Fraction({children,highlight,numeratorHighlight}:{children?:ReactNode;highlight?:boolean;numeratorHighlight?:boolean}){return <span className="alg-l07-p046__fraction" data-highlight={highlight} role="math" aria-label="one third"><span data-lesson-text-block={numeratorHighlight?'numerator-highlight':undefined} data-highlight={numeratorHighlight}>1</span><span aria-hidden="true"/><span>3</span>{children}</span>;}
function Graph(props:P046PresentationProps){
 const {view,onNamedPoint,onBackgroundPoint,onClonePoint}=props,s=view.state,b=V.graphViewBox,hit=V.backgroundHitBounds,svg=useRef<SVGSVGElement>(null),scroll=useRef<HTMLDivElement>(null),id=useId(),interactive=p046CanInteract(s)&&!props.controlsLocked;
 const [cursor,setCursor]=useState({x:V.keyboardOrigin[0],y:V.keyboardOrigin[1]}),[cursorVisible,setCursorVisible]=useState(false);
 useEffect(()=>{setCursor({x:V.keyboardOrigin[0],y:V.keyboardOrigin[1]});setCursorVisible(false);},[s.replay]);
 useEffect(()=>{const e=scroll.current;if(!e)return;const center=()=>{if(e.clientWidth)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);};center();const f=requestAnimationFrame(center);return()=>cancelAnimationFrame(f);},[]);
 const chooseCursor=()=>{if(!svg.current||!interactive)return;const screen=svg.current.getScreenCTM();if(!screen)return;const point=new DOMPoint(cursor.x,cursor.y).matrixTransform(screen);
  const nodes=[...svg.current.querySelectorAll<SVGGElement>('g[data-p046-hit]')].reverse();
  for(const group of nodes){if(group.dataset.enabled!=='true')continue;const hit=[...group.querySelectorAll<SVGGeometryElement>('path')].some(path=>{const ctm=path.getScreenCTM();return ctm&&path.isPointInFill(point.matrixTransform(ctm.inverse()));});if(hit){const name=group.dataset.p046Hit!;if(name.startsWith('PT_'))onNamedPoint?.(name as P046PointName);else onClonePoint?.(name);return;}}
  onBackgroundPoint?.(cursor);
 };
 const pointNode=(name:string,position:P046Point,sprite:number,frame:number,enabled:boolean)=>{const parts=V.pointFrames.find(p=>p.spriteId===sprite)!.frames[frame-1];return <g key={name} data-p046-hit={name} data-enabled={enabled} transform={`translate(${position.x} ${position.y})`} style={{pointerEvents:enabled?'visiblePainted':'none'}} onClick={e=>{if(!enabled)return;e.stopPropagation();if(name.startsWith('PT_'))onNamedPoint?.(name as P046PointName);else onClonePoint?.(name);}}>{parts.map(([shape,m],i)=><g key={i} data-source-shape={shape} transform={matrix(m)}><Paths paths={V.shapeSources.find(s=>s.characterId===shape)!.paths}/></g>)}</g>;};
 return <><p className="alg-l07-p046__keyboard" id={id} lang={view.language}>{view.language==='es'?'En el gráfico: usa las flechas para mover el cursor y Enter o Espacio para elegir un punto. También puedes hacer clic o tocar.':'On the graph: use arrow keys to move the cursor and Enter or Space to choose a point. You can also click or tap.'}</p>
 <div ref={scroll} className="alg-l07-p046__scroll" tabIndex={0} role="region" aria-label={view.language==='es'?'Gráfico de coordenadas':'Coordinate graph'} aria-describedby={id} data-p046-graph-scroll="true" onKeyDown={e=>{if(!interactive)return;const step=V.keyboardStep*(e.shiftKey ? .1 : 1),delta:Record<string,number[]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};if(delta[e.key]){e.preventDefault();const [x,y]=delta[e.key];setCursorVisible(true);setCursor(p=>({x:Math.max(hit[0],Math.min(hit[1],p.x+x)),y:Math.max(hit[2],Math.min(hit[3],p.y+y))}));}else if(e.key==='Enter'||e.key===' '){e.preventDefault();setCursorVisible(true);chooseCursor();}}}>
  <div className="alg-l07-p046__plot" style={{aspectRatio:`${b[2]} / ${b[3]}`}}>
   <svg ref={svg} viewBox={b.join(' ')} aria-hidden="true" data-p046-graph="true">
    <g pointerEvents="none">{view.visual.shapes.filter(p=>p.alpha>0).map(p=><g key={p.depth} opacity={p.alpha} transform={matrix(p.matrix)} data-source-shape={p.characterId} data-source-ratio={p.ratio}><Paths paths={V.shapeSources.find(s=>s.characterId===p.characterId)!.paths} ratio={p.ratio}/></g>)}
     {s.line?.visible&&<line x1={s.line.from.x} y1={s.line.from.y} x2={s.line.to.x} y2={s.line.to.y} stroke="#0000ff" strokeWidth={60} data-p046-drawn-line="true"/>}
    </g>
    {s.mainFrame===318&&<rect data-p046-background="true" x={hit[0]} y={hit[2]} width={hit[1]-hit[0]} height={hit[3]-hit[2]} fill="transparent" pointerEvents={interactive?'all':'none'} onClick={e=>{const ctm=svg.current?.getScreenCTM();if(!ctm||!interactive)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());if(p.x>=hit[0]&&p.x<=hit[1]&&p.y>=hit[2]&&p.y<=hit[3])onBackgroundPoint?.({x:p.x,y:p.y});}}/>}
    {s.mainFrame===318&&S.points.map(p=>pointNode(p.name,p,p.characterId,s.highlighted.includes(p.name)?2:1,interactive&&!s.disabled.includes(p.name)))}
    {s.clones.map(p=>pointNode(p.name,p,79,1,p.enabled&&!s.help&&!s.prompt&&!s.glossary&&!props.controlsLocked))}
    {cursorVisible&&interactive&&<g pointerEvents="none" data-p046-cursor="true" transform={`translate(${cursor.x} ${cursor.y})`} stroke="#143f70" strokeWidth={15} fill="none"><circle r={105}/><path d="M-140 0H140M0-140V140"/></g>}
   </svg>
   {view.visual.labels.filter(p=>p.alpha>0).map(p=>{const l=V.labelSources[p.labelIndex],highlight=[272,273,287].includes(l.characterId);return <span key={p.depth} className="alg-l07-p046__axis" data-highlight={highlight} data-lesson-text-block={l.id} data-source-text-id={l.sourceTextId} style={{left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`,opacity:p.alpha}}>{l.text}</span>;})}
  </div>
 </div>
 {cursorVisible&&interactive&&<p className="alg-l07-p046__cursor-status" role="status" lang={view.language}>{view.language==='es'?'Cursor':'Cursor'}: x {Number(((cursor.x-V.keyboardOrigin[0])/V.keyboardStep).toFixed(1))}, y {Number(((V.keyboardOrigin[1]-cursor.y)/V.keyboardStep).toFixed(1))}</p>}
 </>;
}
function Overlay({title,glossary,close,children,kind}:{title:string;glossary:boolean;close:()=>void;children:ReactNode;kind:'help'|'prompt'}){
 const ref=useRef<HTMLDialogElement>(null),focus=useRef<HTMLElement|null>(null),savedScroll=useRef(0),id=useId();
 useEffect(()=>{const d=ref.current;if(!d)return;if(glossary)d.close();else{const restore=focus.current;if(!d.open)d.showModal();d.scrollTop=savedScroll.current;if(restore?.isConnected)restore.focus({preventScroll:true});else d.querySelector<HTMLButtonElement>('[data-p046-overlay-close]')?.focus();}return()=>{savedScroll.current=d.scrollTop;d.close();};},[glossary]);
 return <dialog ref={ref} className="alg-l07-p046__dialog" aria-labelledby={id} data-p046-overlay={kind} onCancel={e=>{e.preventDefault();close();}} onFocusCapture={e=>{if(e.target instanceof HTMLElement)focus.current=e.target;}}><div className="alg-l07-p046__overlay-title"><h3 id={id}>{title}</h3><button type="button" data-p046-overlay-close={kind} data-lesson-text-block="close" onClick={close}>Close</button></div>{children}</dialog>;
}
export function AlgL07P046Presentation(props:P046PresentationProps){
 const {view,onSubmit,onHelp,onHelpClose,onPromptClose,onTerm,onCloseFeedback}=props,v=view.visual,s=view.state;
 const term=(t:P046Term,text:string)=><span data-source-term-flash={v.termFlash.includes(t)}>{text}</span>;
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const helpContents=<>{V.helpTexts.map(t=><p key={t.id} data-lesson-text-block={`help-${t.id}`} data-source-text-id={t.sourceTextId}>{t.text}</p>)}<Terms terms={V.helpTerms} language={view.language} onTerm={onTerm}/></>;
 return <section className="alg-l07-p046 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Try It!" language="en"/>
  {v.questionAlpha>0&&<p className="alg-l07-p046__question" data-lesson-text-block="question" style={{opacity:v.questionAlpha,transform:`translateY(${v.questionOffset}px)`}}>8 {term('Graph','Graph')} the {term('Linear function','linear function')} <span className="alg-l07-p046__equation">y = <span data-lesson-text-block={v.slopeHighlight?'slope-highlight':undefined}><Fraction highlight={v.slopeHighlight>0} numeratorHighlight={v.numeratorHighlight>0}/></span> x <span data-lesson-text-block={v.constantHighlight?'constant-highlight':undefined} data-highlight={v.constantHighlight>0}>+ 2</span></span> using the {term('Slope','slope')} and {term('Y-intercept','y-intercept')}. On the grid, click the {term('Coordinates','coordinates')} of the y-intercept. Then use the slope to find the coordinates of another point on the line. Click the coordinates of that point as well. When you are finished click Draw the line.</p>}
  <Terms terms={v.terms} language={view.language} onTerm={onTerm}/>
  {s.mainFrame===318&&<button type="button" data-p046-help-open="true" data-lesson-text-block="help-open" disabled={props.controlsLocked||!s.helpEnabled||!p046CanInteract(s)} onClick={e=>onHelp?.(e.currentTarget)}>Need More Help</button>}
  <div className="alg-l07-p046__feedbacks">{view.feedback.map(f=><section key={`${f.spriteId}:${f.serial}`} className="alg-l07-p046__feedback" data-p046-feedback={f.spriteId} data-source-frame={f.frame} data-source-serial={f.serial} tabIndex={-1} aria-live="polite" aria-atomic="true">{f.titleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${f.spriteId}`} style={{opacity:f.titleAlpha}}>{f.title}</h3>}{f.closeVisible&&<><p data-lesson-text-block={`wrong-text-${f.spriteId}`}>{f.message}</p><button type="button" data-p046-close-feedback={f.spriteId} data-lesson-text-block="close" onClick={()=>onCloseFeedback?.(f.spriteId)}>Close</button></>}</section>)}</div>
  {v.graphVisible&&<Graph {...props}/>}
  {v.drawVisible&&<button type="button" data-p046-submit="true" data-lesson-text-block="draw" disabled={props.controlsLocked||!p046CanInteract(s)} onClick={e=>onSubmit?.(e.currentTarget)}>Draw the line</button>}
  {s.prompt&&(onPromptClose?<Overlay title="Draw the line" kind="prompt" glossary={Boolean(s.glossary)} close={onPromptClose}><p data-lesson-text-block="prompt">{s.prompt}</p></Overlay>:<section data-p046-overlay="prompt"><p data-lesson-text-block="prompt">{s.prompt}</p></section>)}
  {s.help&&(onHelpClose?<Overlay title="Need More Help" kind="help" glossary={Boolean(s.glossary)} close={onHelpClose}>{helpContents}</Overlay>:<section data-p046-overlay="help">{helpContents}</section>)}
 </section>;
}
export function AlgL07P046Renderer(props:AnimationRendererProps){return <AlgL07P046Presentation view={algL07P046Frame(props.frame,{...props,frame:props.frame})}/>;}
