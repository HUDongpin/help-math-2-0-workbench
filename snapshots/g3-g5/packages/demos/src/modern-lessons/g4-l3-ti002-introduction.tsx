'use client';
import React,{useLayoutEffect,useRef,useState}from'react';
import source from'./generated/g4-l3-ti002-native-inputs.json';
import{TI002_DEFINITION_LINKS,ti002KeyTermAvailable}from'./g4-l3-ti002-keyterms';
import{Ti002NumberLine}from'./g4-l3-ti002-number-line';
import{Ti002DecreasePreview}from'./g4-l3-ti002-decrease-picture';
const text=(id:number)=>source.texts.find(t=>t.characterId===id)!.text;
const terms=[66,68,67,69,65];
const definitions=[76,71,79,83,87];
export function getTi002IntroState(frame:number){
 if(!Number.isInteger(frame)||frame<1||frame>237)throw new RangeError('TI002 intro requires frame1..237');
 return source.intro.frameIndices[frame-1].map(i=>source.intro.placementPool[i]);
}
/** Reflowed source example. Frame timing is source-bound; screen movement follows
 * live DOM anchors instead of original stage pixels. No private animation clock. */
export function Ti002Introduction({frame,paused=false,onKeyTerm}:{frame:number;paused?:boolean;onKeyTerm?:(id:number,trigger:HTMLButtonElement)=>void}){
 const placements=getTi002IntroState(frame),opacity=(id:number)=>placements.find(p=>p.characterId===id)?.opacity??0;
 const cursor=placements.find(p=>p.characterId===126),cursorShape=source.paints.staticShapes.find(s=>s.characterId===126)!;
 const negative=placements.find(p=>p.characterId===69);
 const progress=negative?(negative.matrix[4]-source.intro.example.originMatrix[4])/(source.intro.example.destinationMatrix[4]-source.intro.example.originMatrix[4]):0;
 const plane=useRef<HTMLDivElement>(null),origin=useRef<HTMLSpanElement>(null),target=useRef<HTMLSpanElement>(null);
 const[anchors,setAnchors]=useState({x:0,y:0,dx:0,dy:0,width:0,dw:0});
 useLayoutEffect(()=>{
  const measure=()=>{if(!plane.current||!origin.current||!target.current)return;const b=plane.current.getBoundingClientRect(),a=origin.current.getBoundingClientRect(),t=target.current.getBoundingClientRect();setAnchors({x:a.left-b.left,y:a.top-b.top,dx:t.left-a.left,dy:t.top-a.top,width:a.width,dw:t.width-a.width});};
  measure();const observer=new ResizeObserver(measure);if(plane.current)observer.observe(plane.current);return()=>observer.disconnect();
 },[]);
 const definition=(id:number)=>{
  const links=TI002_DEFINITION_LINKS[id]??[];
  return text(id).split(new RegExp('('+links.map(l=>l.text).join('|')+')','g')).map((part,i)=>{
   const link=links.find(l=>l.text===part);
   const button=link&&(link.button===125&&frame<23?81:link.button);
   if(!button||!onKeyTerm||!ti002KeyTermAvailable(frame,button))return <React.Fragment key={i}>{part}</React.Fragment>;
   return <button key={i} type="button" data-ti002-keyterm-button={button} aria-disabled={paused} onClick={e=>{if(!paused)onKeyTerm(button,e.currentTarget);}} style={{font:'inherit',color:'#005a9c',textDecoration:'underline',background:'white',border:'1px solid #718399',borderRadius:'.3rem',padding:'.1rem .25rem',minHeight:44}}>{part}</button>;
  });
 };
 const pictures=[<Ti002DecreasePreview/>,<Ti002NumberLine diagram="sprite-169"/>,<Ti002NumberLine diagram="sprite-182"/>,<Ti002NumberLine diagram="sprite-159"/>,<Ti002NumberLine diagram="sprite-178"/>];
 return <section className="ti002-intro" data-ti002-intro-frame={frame} lang="en">
  <style>{`.ti002-intro{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#16364a;min-width:0;container-type:inline-size}.ti002-intro h2{font-size:1.75rem;line-height:1.3}.ti002-intro p{font-size:1.125rem;line-height:1.6}.ti002-intro-scroll{overflow:auto;max-width:100%;border:1px solid #718399;border-radius:.75rem;padding:1rem}.ti002-intro-plane{position:relative;display:grid;grid-template-columns:12rem 10rem 24rem 30rem;gap:1rem;min-width:79rem;align-items:start}.ti002-intro-bank{display:grid;gap:1rem}.ti002-intro-term{display:block;font-size:1.125rem;line-height:1.5;padding:.65rem;border:2px solid #526f86;border-radius:.6rem;background:white;box-sizing:border-box;overflow-wrap:anywhere}.ti002-intro-rows{grid-column:2/5;display:grid;gap:1rem}.ti002-intro-row{display:grid;grid-template-columns:10rem 24rem 30rem;gap:1rem;align-items:center;min-height:8rem}.ti002-intro-definition{font-size:1.125rem;line-height:1.6;overflow-wrap:anywhere}.ti002-intro-slot{min-height:3rem;display:block;border:1px dashed #718399;border-radius:.6rem}.ti002-intro-heading{font-size:1rem;font-weight:700;line-height:1.5;margin-bottom:.5rem}.ti002-intro-picture{min-width:0}@media(min-width:768px){.ti002-intro p,.ti002-intro-definition{font-size:1.25rem}}@media(max-width:800px){.ti002-intro-plane{grid-template-columns:minmax(0,1fr);min-width:0}.ti002-intro-bank{grid-template-columns:repeat(auto-fit,minmax(min(7rem,100%),1fr))}.ti002-intro-bank>.ti002-intro-heading{grid-column:1/-1}.ti002-intro-rows{grid-column:auto}.ti002-intro-row{grid-template-columns:minmax(0,1fr)}.ti002-intro-slot{width:100%;box-sizing:border-box}}@container(max-width:82rem){.ti002-intro-plane{grid-template-columns:minmax(0,1fr);min-width:0}.ti002-intro-bank{grid-template-columns:repeat(auto-fit,minmax(min(7rem,100%),1fr))}.ti002-intro-bank>.ti002-intro-heading{grid-column:1/-1}.ti002-intro-rows{grid-column:auto}.ti002-intro-row{grid-template-columns:minmax(0,1fr)}.ti002-intro-slot{width:100%;box-sizing:border-box}}`}</style>
  <h2 data-ti002-source-text="54" data-lesson-text-block="text-54">{text(54)}</h2>
  <p><span data-ti002-source-text="59" data-lesson-text-block="text-59" style={{opacity:opacity(59),marginRight:".5em",fontWeight:700}} aria-hidden={opacity(59)===0}>{text(59)}</span>{' '}<span data-ti002-source-text="56" data-lesson-text-block="text-56" style={{opacity:opacity(56)}} aria-hidden={opacity(56)===0}>{text(56)}</span></p>
  <div className="ti002-intro-scroll" tabIndex={0} role="group" aria-label="Matching example. Scroll horizontally to explore the terms, definitions and pictures.">
   <div className="ti002-intro-plane" ref={plane}>
    <div className="ti002-intro-bank"><div data-lesson-text-block="text-61" className="ti002-intro-heading" style={{opacity:opacity(61)}}>{text(61)}</div>{terms.map(id=><span key={id} ref={id===69?origin:undefined} className="ti002-intro-term" data-ti002-source-text={id} data-lesson-text-block={`text-${id}`} style={{opacity:id===69?0:opacity(id)}} aria-hidden={id===69||opacity(id)===0}>{text(id)}</span>)}</div>
    <div className="ti002-intro-rows">{definitions.map((id,i)=><div className="ti002-intro-row" key={id} style={{opacity:opacity(id)}} aria-hidden={opacity(id)===0}>
     <span ref={id===71?target:undefined} className="ti002-intro-slot" aria-hidden="true"/>
     <div className="ti002-intro-definition"><div data-lesson-text-block="text-62" className="ti002-intro-heading">{text(62)}</div><span data-ti002-source-text={id} data-lesson-text-block={`text-${id}`}>{definition(id)}</span></div>
     <div className="ti002-intro-picture"><div data-lesson-text-block="text-63" className="ti002-intro-heading">{text(63)}</div>{i===0&&<div data-ti002-source-text="64" data-lesson-text-block="text-64" style={{fontSize:"1rem",lineHeight:1.5,marginBottom:".5rem"}}>{text(64)}</div>}{pictures[i]}</div>
    </div>)}</div>
    <span className="ti002-intro-term" data-ti002-demo="negative" data-lesson-text-block="text-69" data-source-progress={progress} data-source-instance={negative?.instanceId} style={{position:'absolute',left:anchors.x+anchors.dx*progress,top:anchors.y+anchors.dy*progress,width:anchors.width?anchors.width+anchors.dw*progress:'12rem',opacity:opacity(69),pointerEvents:'none'}} aria-hidden={opacity(69)===0}>{text(69)}{cursor&&negative&&<svg aria-hidden="true" data-ti002-source-cursor="126" viewBox="-423 -1231 416 650" style={{position:'absolute',left:`${(cursor.matrix[4]-negative.matrix[4]-423)/320}rem`,top:`${(cursor.matrix[5]-negative.matrix[5]-1231)/320}rem`,width:'1.3rem',height:'2.03125rem',opacity:cursor.opacity}}>{cursorShape.epochs.flatMap(e=>e.paints).map((paint,i)=><path key={i} d={paint.d} fill={`rgba(${paint.style.rgba!.slice(0,3).join(',')},${paint.style.rgba![3]/255})`} fillRule="evenodd"/>)}</svg>}</span>
   </div>
  </div>
 </section>;
}
