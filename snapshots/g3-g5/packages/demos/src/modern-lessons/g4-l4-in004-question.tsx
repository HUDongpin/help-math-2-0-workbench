'use client';
import React,{useEffect,useLayoutEffect,useRef} from 'react';
import {G4_L4_IN004_NATIVE_CONFIG as C} from './generated/g4-l4-in004-native-config';
import type {In004Action,In004Card,In004State,In004Target} from './g4-l4-in004-state';

type ShapePlacement=Readonly<{character:number;matrix:readonly number[]}>;
// This is the source-bound question view. Prelude, random frame navigation,
// feedback audio and My Lesson lifecycle are owned by the page integration.
export function In004QuestionFigure({state:s,paused=false,onAction}:{state:In004State;paused?:boolean;onAction:(action:In004Action)=>void}){
 const q=C.questions.find(q=>q.id===s.question)!;
 const port=useRef<HTMLDivElement>(null),manual=useRef(false),drag=useRef<{card:In004Card;released:boolean}|null>(null);
 const [minX,minY,width,height]=C.graphBounds;
 const px=(x:number)=>(x-minX)/width*100+'%',py=(y:number)=>(y-minY)/height*100+'%';
 const rect=(b:readonly number[])=>({left:px(b[0]),top:py(b[1]),width:(b[2]-b[0])/width*100+'%',height:(b[3]-b[1])/height*100+'%'});
 useLayoutEffect(()=>{manual.current=false;drag.current=null;},[s.seed,s.replay,s.visit,s.question]);
 useLayoutEffect(()=>{const p=port.current;if(!p)return;const center=()=>{if(manual.current)return;const figure=p.firstElementChild as HTMLElement,a=figure.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=a.left+(C.ticks.find(t=>t.value===0)!.position[0]-minX)/width*figure.clientWidth-v.left-p.clientWidth/2;};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[s.seed,s.replay,s.visit,s.question]);
 useEffect(()=>{if(paused)drag.current=null;return()=>{drag.current=null;};},[paused]);
 const paths=(p:ShapePlacement)=>C.shapes.find(v=>v.character===p.character)!.paths.map((v,i)=><path key={i} d={v.d} fill={v.fill} stroke={v.stroke} strokeWidth={v.width} strokeLinecap="round" strokeLinejoin="round"/>);
 const geometry=q.cards.map(card=>{const shift=s.positions[card.name]??card.origin;return {card,shift,bounds:[card.bounds[0]+shift[0],card.bounds[1]+shift[1],card.bounds[2]+shift[0],card.bounds[3]+shift[1]],label:[card.label.position[0]+shift[0],card.label.position[1]+shift[1]]};});
 const release=(target:In004Target|null)=>{if(!drag.current||drag.current.released||paused)return;drag.current.released=true;onAction({type:'drop',card:drag.current.card,target});};
 return <div className="in004-question" data-in004-question={q.id} data-in004-placed={s.placed.join(',')} onDragOver={e=>{if(drag.current&&!paused)e.preventDefault();}} onDrop={e=>{if(!drag.current)return;e.preventDefault();release(null);}}>
  <style>{CSS}</style>
  <p className="in004-question__equation" aria-live="polite" aria-atomic="true"><span data-in004-text="equation" data-lesson-text-block="question" data-source-text-ids={q.equation.sourceTextIds.join(' ')}>{q.equation.text}</span>{' '}<span data-in004-text="answer" data-lesson-text-block="answer" data-source-text-id={q.answerSource.sourceTextId}>{s.answer}</span></p>
  <p className="in004-question__hint">Select an arrow, then select a drop area. You can also drag the arrows.</p>
  <div ref={port} className="in004-question__port" role="region" aria-label="Number line from negative fifteen to fifteen" tabIndex={0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);}}>
   <div className="in004-question__figure" style={{width:C.widthEm+'em',height:C.widthEm*height/width+'em'}}>
    <svg className="in004-question__geometry" viewBox={C.graphBounds.join(' ')} aria-hidden="true" focusable="false">
     {C.axis.map(p=><g key={p.character} data-in004-axis-shape={p.character} transform={'matrix('+p.matrix.join(' ')+')'}>{paths(p)}</g>)}
     {geometry.map(({card,shift})=><g key={card.name} data-in004-arrow={card.name} transform={`translate(${shift.join(' ')})`}>{card.shapes.map((p,i)=><g key={i} transform={'matrix('+p.matrix.join(' ')+')'}>{paths(p)}</g>)}</g>)}
    </svg>
    {C.ticks.map(t=><span key={t.value} className="in004-question__label" data-in004-text={'tick-'+t.value} data-lesson-text-block={'tick-'+t.value} data-source-text-ids={t.sourceTextIds.join(' ')} style={{left:px(t.position[0]),top:py(t.position[1]),color:t.color}}>{t.text}</span>)}
    {q.targets.filter((_,i)=>i===0||s.secondVisible).map((t,i)=><button key={t.id} type="button" className="in004-question__target" data-in004-target={t.id} data-source-instance={t.sourceInstance} aria-label={'Number line drop area '+(i+1)} style={rect(t.bounds)} disabled={paused} onClick={()=>onAction({type:'drop',target:t.id})} onDragOver={e=>{if(drag.current&&!paused){e.preventDefault();e.stopPropagation();}}} onDrop={e=>{if(!drag.current||paused)return;e.preventDefault();e.stopPropagation();release(t.id);}}/>)}
    {geometry.map(({card,bounds,label})=>{const disabled=paused||s.placed.includes(card.name);return <button key={card.name} type="button" className="in004-question__card" data-in004-card={card.name} data-source-instance={card.sourceInstance} aria-label={card.label.text+', arrow to the '+(card.value<0?'left':'right')} aria-pressed={s.selected===card.name} style={rect(bounds)} disabled={disabled} draggable={!disabled} onClick={()=>onAction({type:'press',card:card.name})} onDragStart={e=>{if(disabled){e.preventDefault();return;}onAction({type:'press',card:card.name});drag.current={card:card.name,released:false};e.dataTransfer.setData('text/plain',card.name);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{const d=drag.current;drag.current=null;if(d&&!d.released&&!paused)onAction({type:'drop',card:d.card,target:null});}}>
     <span className="in004-question__label" data-in004-text={'card-'+card.name} data-lesson-text-block={card.name} data-source-text-ids={card.label.sourceTextIds.join(' ')} style={{left:(label[0]-bounds[0])/(bounds[2]-bounds[0])*100+'%',top:(label[1]-bounds[1])/(bounds[3]-bounds[1])*100+'%',color:card.label.color}}>{card.label.text}</span>
    </button>;})}
   </div>
  </div>
 </div>;
}
const CSS=`.in004-question{min-inline-size:0;max-inline-size:100%;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.in004-question *{box-sizing:border-box}.in004-question__equation{font-size:1.4em;font-variant-numeric:tabular-nums;white-space:nowrap}.in004-question__hint{font-size:1rem}.in004-question button{font:inherit;min-inline-size:44px;min-block-size:44px;cursor:pointer;touch-action:manipulation}.in004-question button:disabled{cursor:default}.in004-question button:focus-visible,.in004-question [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}.in004-question__port{max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;padding:1rem .4rem}.in004-question__figure{position:relative;font-size:1.125rem;line-height:1.2;margin:auto}.in004-question__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}.in004-question__label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;word-break:normal;overflow-wrap:normal;font-variant-numeric:tabular-nums;pointer-events:none}.in004-question__card,.in004-question__target{position:absolute;border:1px solid transparent;border-radius:.5rem;background:transparent;padding:0}.in004-question__card:disabled{pointer-events:none}.in004-question__card[aria-pressed=true]{outline:3px solid #1556a0;outline-offset:3px;background:rgba(21,86,160,.06)}.in004-question__target{border:2px dashed #51759d}.in004-question__target:hover:enabled{background:rgba(21,86,160,.1)}`;
