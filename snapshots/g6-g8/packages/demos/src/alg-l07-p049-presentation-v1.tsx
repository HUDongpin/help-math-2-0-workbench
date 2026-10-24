'use client';
import {useEffect,useRef} from 'react';
import type {AnimationRendererProps} from './contract';
import type {FixedExitPresentationPropsV1} from './source-fixed-exit-help-player-v3';
import type {FixedExitGraphV1,FixedExitVectorPathV1} from './source-fixed-exit-help-native-v1';
import {FixedExitHelpPresentationV3} from './source-fixed-exit-help-presentation-v3';
import {ALG_L07_P049_SOURCE as S,type P049SourceTerm} from './alg-l07-p049-source-v1';
import {algL07P049Frame,type P049View} from './alg-l07-p049-frame-v1';
import './alg-l07-p048-p049-v1.css';
const matrix=(m:readonly number[])=>`matrix(${m[0]*20} ${m[1]*20} ${m[2]*20} ${m[3]*20} ${m[4]} ${m[5]})`;
function Paths({paths}:{paths:readonly FixedExitVectorPathV1[]}){return <>{paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} fillOpacity={p['fill-opacity']} stroke={p.stroke} strokeWidth={p['stroke-width']} strokeOpacity={p['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>)}</>;}
function Graph({graph:g,view}:{graph:FixedExitGraphV1;view:P049View}){
 const ref=useRef<HTMLDivElement>(null),b=g.viewBox,state=view.visual.graphs.find(v=>v.name===g.name)!,parentAlpha=view.visual.answerAlpha[g.name as 'A'|'B'|'C'|'D'],relativeAlpha=(a:number)=>parentAlpha>0?Math.min(1,a/parentAlpha):0;
 useEffect(()=>{const e=ref.current;if(!e)return;const center=()=>{e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);};center();const frame=requestAnimationFrame(center);return()=>cancelAnimationFrame(frame);},[]);
 return <div ref={ref} className="alg-l07-p049__scroll" role="region" tabIndex={0} aria-label={view.language==='es'?`Gráfico ${g.name}. Desplaza para ver todos los valores.`:`Graph ${g.name}. Scroll to view all values.`} data-p049-graph-scroll={g.name}>
  <div className="alg-l07-p049__plot" data-p049-plot={g.name} style={{aspectRatio:`${b[2]} / ${b[3]}`}}>
   <svg viewBox={b.join(' ')} aria-hidden="true">{g.paths.map(p=>{const live=state.paths.find(s=>s.sourceShapeId===p.sourceShapeId)!;return <g key={p.sourceShapeId} transform={matrix(live.matrix)} opacity={relativeAlpha(live.alpha)} data-source-shape={p.sourceShapeId}><Paths paths={p.paths}/></g>;})}{state.overlays.map(o=><g key={o.depth} opacity={relativeAlpha(o.alpha)} transform={matrix(o.matrix)} data-source-shape={o.sourceShapeId} data-source-depth={o.depth}><Paths paths={S.graphOverlaySources.find(p=>p.sourceShapeId===o.sourceShapeId)!.paths}/></g>)}</svg>
   {g.labels.map(l=>{const a=state.labels.find(s=>s.depth===l.depth)!.alpha;return a>0&&<span key={l.depth} className="alg-l07-p049__axis" data-lesson-text-block={`axis-${g.name}-${l.depth}`} data-source-text-id={l.sourceTextId} style={{left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`,opacity:relativeAlpha(a)}}>{l.text}</span>;})}
  </div>
 </div>;
}
export function AlgL07P049Presentation(props:FixedExitPresentationPropsV1<P049SourceTerm,P049View>){
 const {view}=props,v=view.visual;
 return <FixedExitHelpPresentationV3 {...props} page="p049" source={S} compact={v.answerAlpha.B>0&&v.answerAlpha.A===0&&v.answerAlpha.C===0&&v.answerAlpha.D===0} move={v.bMove} answerOrder={['A','C','B','D']}
  question={<>11 Which is the <span data-source-term-flash={v.termFlash.includes('Graph')}>graph</span> of a <span data-source-term-flash={v.termFlash.includes('Nonlinear function')}>nonlinear function</span>?</>}
  renderAnswer={answer=><Graph graph={S.graphs.find(g=>g.name===answer.letter)!} view={view}/>}
 />;
}
export function AlgL07P049Renderer(props:AnimationRendererProps){return <AlgL07P049Presentation view={algL07P049Frame(props.frame,{...props,frame:props.frame})}/>;}
