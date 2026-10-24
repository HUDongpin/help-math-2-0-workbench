'use client';
import React,{useLayoutEffect,useRef} from 'react';
import {G4_L4_IN004_INTRO_CONFIG as SOURCE} from './generated/g4-l4-in004-intro-config';
import {G4_L4_IN004_NATIVE_CONFIG as QUESTION} from './generated/g4-l4-in004-native-config';

type Curve<T>=readonly (readonly [number,T])[];
type Token=Readonly<{text:string;sourceTextIds:readonly string[];alpha:Curve<number>}>;
type Text=Readonly<{characterId:number;sourceInstance:string;depth:number;text:string;tokens:readonly Token[];position:Curve<readonly number[]|null>;color:readonly number[];sourceTextIds:readonly string[]}>;
type Shape=Readonly<{character:number;matrix:readonly number[];alpha:number}>;
type Term=typeof SOURCE.terms[number];
interface IntroConfig {readonly textInstances:readonly Text[];readonly geometry:readonly {readonly depth:number;readonly states:Curve<Shape|null>}[];readonly shapes:readonly {readonly character:number;readonly paths:readonly {readonly d:string;readonly fill:string;readonly stroke:string;readonly width:number}[]}[];readonly cursor:typeof SOURCE.cursor;readonly terms:readonly Term[]}
const C:IntroConfig=SOURCE;
export function in004IntroAt<T>(curve:Curve<T>,frame:number):T|undefined {let value:T|undefined;for(const [at,v] of curve){if(at>frame)break;value=v;}return value;}
const rgba=(c:readonly number[])=>`rgba(${c[0]},${c[1]},${c[2]},${c[3]/255})`;
export function getIn004IntroState(frame:number,reducedMotion=false){
 if(!Number.isInteger(frame)||frame<1||frame>470)throw new Error('IN004 intro frame outside source domain');
 const texts=C.textInstances.map(t=>({...t,position:in004IntroAt(t.position,frame),visibleTokens:t.tokens.filter(v=>(in004IntroAt(v.alpha,frame)??0)>0)})).filter(t=>t.position&&t.visibleTokens.length);
 const byDepth=(depth:number)=>texts.find(t=>t.depth===depth);
 const groups=[{id:'minus8',depths:[43,42]},{id:'minus5',depths:[47,46]},{id:'plus5',depths:[50]},{id:'plus8',depths:[53]}].flatMap(g=>{
  const parts=g.depths.map(byDepth);if(parts.some(p=>!p))return [];
  const ordered=parts.map(p=>p!).sort((a,b)=>a.position![0]-b.position![0]);
  return [{id:g.id,text:ordered.map(p=>p.visibleTokens.map(t=>t.text).join('')).join(''),position:[ordered.reduce((n,p)=>n+p.position![0],0)/ordered.length,ordered.reduce((n,p)=>n+p.position![1],0)/ordered.length],color:rgba(ordered[0].color),sourceTextIds:ordered.flatMap(p=>p.sourceTextIds),sourceInstances:ordered.map(p=>p.sourceInstance)}];
 });
 const equation=texts.find(t=>t.characterId===37||t.characterId===48),emphasis=reducedMotion?frame>=222&&frame<235:texts.some(t=>[43,44,45].includes(t.characterId));
 return {frame,body:texts.filter(t=>t.characterId===33||t.characterId===41),groups,equation:equation?{text:equation.visibleTokens.map(t=>t.text).join(''),position:equation.position!,sourceTextIds:equation.sourceTextIds,sourceInstance:equation.sourceInstance,emphasis}:null,shapes:C.geometry.flatMap(g=>{const s=in004IntroAt(g.states,frame);return s&&s.alpha>0?[{...s,depth:g.depth}]:[];}),beginEnabled:frame===470};
}

export function In004TeachingCopy({frame,onOpenKeyTerm}:{frame:number;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 const termFor=(key:string)=>C.terms.find(t=>t.keyAttribute===key);
 const termActive=(term:Term)=>term.sourceInstances.some(i=>i.firstFrame<=frame&&frame<i.lastFrameExclusive);
 // Reserve complete instruction flow while revealing only source-visible words.
 // This keeps the teaching figure steady as the source masks reveal the copy.
 const body=(t:Text)=>{
  const tokens=t.tokens,content:React.ReactNode[]=[];
  for(let i=0;i<tokens.length;i++){
   const token=tokens[i],trim=token.text.trim();let term=termFor(trim==='addition'?'Addition':trim==='subtraction'?'Subtraction':'');
   const members=[token];let suffix=token.text.slice(trim.length);
   if(trim==='number'&&tokens[i+1]?.text.trim()==='line.') {members.push(tokens[++i]);term=termFor('Number line');suffix='.';}
   const alpha=in004IntroAt(token.alpha,frame)??0;
   const allVisible=members.every(v=>(in004IntroAt(v.alpha,frame)??0)>0);
   const tokenNode=(v:Token,j:number)=>{const a=in004IntroAt(v.alpha,frame)??0;return <span key={j} aria-hidden={a===0} style={{opacity:a,visibility:a>0?'visible':'hidden'}}>{members.length>1?v.text.replace(/\.$/,''):v.text.trim()}</span>;};
   content.push(term?<React.Fragment key={i}><button type="button" className="in004-intro__term" data-source-keyterm={term.keyAttribute} data-keyterm-entry-id={term.entryId} data-source-text-ids={[...new Set(members.flatMap(v=>v.sourceTextIds))].join(' ')} aria-hidden={!allVisible} disabled={!onOpenKeyTerm||!allVisible||!termActive(term)} style={{visibility:alpha>0?'visible':'hidden'}} onClick={e=>onOpenKeyTerm?.(term!,e.currentTarget)}>{members.map(tokenNode)}</button><span aria-hidden={!allVisible} style={{visibility:allVisible?'visible':'hidden'}}>{suffix}</span></React.Fragment>:<span key={i} data-source-word={i} aria-hidden={alpha===0} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden'}}>{token.text}</span>);
  }
  return <p key={t.characterId} data-in004-intro-text={'body-'+t.characterId} data-lesson-text-block={t.characterId===33?'instruction':'dragInstruction'} data-source-instance={t.sourceInstance}>{content}</p>;
 };
 return <><style>{CSS}</style><h2 data-in004-intro-text="title" data-lesson-text-block="title" data-source-text-ids={QUESTION.copy.title.sourceTextIds.join(' ')}>{QUESTION.copy.title.text}</h2><div className="in004-intro__instructions">{C.textInstances.filter(t=>t.characterId===33||t.characterId===41).map(body)}</div></>;
}

/** Pure source-frame presentation. The host owns all timing, pause, glossary
 * requests and transition to practice; this component starts no clock/audio. */
export function In004Intro({frame,replay=0,paused=false,reducedMotion=false,onBegin,onOpenKeyTerm}:{frame:number;replay?:number;paused?:boolean;reducedMotion?:boolean;onBegin?:()=>void;onOpenKeyTerm?:(term:Term,trigger:HTMLButtonElement)=>void}){
 const s=getIn004IntroState(frame,reducedMotion),port=useRef<HTMLDivElement>(null),manual=useRef(false);
 const minX=-7200,minY=-2700,width=14800,height=6000,px=(x:number)=>(x-minX)/width*100+'%',py=(y:number)=>(y-minY)/height*100+'%';
 useLayoutEffect(()=>{manual.current=false;},[replay]);
 useLayoutEffect(()=>{const p=port.current;if(!p)return;const center=()=>{if(manual.current)return;const figure=p.firstElementChild as HTMLElement,a=figure.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=a.left+(QUESTION.ticks.find(t=>t.value===0)!.position[0]-minX)/width*figure.clientWidth-v.left-p.clientWidth/2;};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[replay]);
 const path=(shape:Shape)=>C.shapes.find(p=>p.character===shape.character)!.paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round"/>);
 return <section className="in004-intro" lang="en" data-in004-intro-frame={frame}>
  <In004TeachingCopy frame={frame} onOpenKeyTerm={onOpenKeyTerm}/>
  <div ref={port} className="in004-intro__port" role="region" aria-label="Addition example on a number line from negative fifteen to fifteen" tabIndex={0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);}}>
   <div className="in004-intro__figure" style={{width:'66em',height:66*height/width+'em'}}>
    <svg className="in004-intro__geometry" viewBox={[minX,minY,width,height].join(' ')} aria-hidden="true" focusable="false">
     {s.shapes.filter(p=>p.depth<54).map(p=><g key={p.depth} data-in004-intro-shape={p.character} data-source-depth={p.depth} transform={'matrix('+p.matrix.join(' ')+')'} opacity={p.alpha}>{p.character===C.cursor.character?<image href={C.cursor.pngDataUrl} x={C.cursor.bounds[0]} y={C.cursor.bounds[1]} width={C.cursor.bounds[2]} height={C.cursor.bounds[3]}/>:path(p)}</g>)}
    </svg>
    {QUESTION.ticks.map(t=><span key={t.value} className="in004-intro__label" data-in004-intro-text={'tick-'+t.value} data-lesson-text-block={'tick-'+t.value} data-source-text-ids={t.sourceTextIds.join(' ')} style={{left:px(t.position[0]),top:py(t.position[1]),color:t.color}}>{t.text}</span>)}
    {s.groups.map(t=><span key={t.id} className="in004-intro__label" data-in004-intro-text={'arrow-'+t.id} data-lesson-text-block={'intro-'+t.id} data-source-text-ids={t.sourceTextIds.join(' ')} style={{left:px(t.position[0]),top:py(t.position[1]),color:t.color}}>{t.text}</span>)}
    {s.equation&&<span className="in004-intro__label in004-intro__equation" data-in004-intro-text="equation" data-lesson-text-block="intro-equation" data-source-instance={s.equation.sourceInstance} data-source-emphasis={s.equation.emphasis} style={{left:px(s.equation.position[0]),top:py(s.equation.position[1])}}>{s.equation.emphasis?<><span style={{color:'rgb(255,0,255)'}}>5 + 8</span>{' ='}</>:s.equation.text}</span>}
    <button type="button" className="in004-intro__begin" data-in004-intro-text="new-problem" data-lesson-text-block="newProblem" data-source-text-ids="character-7/run-0 character-8/run-0" style={{left:px(-5161.5),top:py(-1796)}} disabled={!s.beginEnabled||paused||!onBegin} onClick={onBegin}>{QUESTION.copy.newProblem.text}</button>
    <svg className="in004-intro__geometry in004-intro__pointer" viewBox={[minX,minY,width,height].join(' ')} aria-hidden="true" focusable="false">
     {s.shapes.filter(p=>p.depth>=54).map(p=><g key={p.depth} data-in004-intro-shape={p.character} data-source-depth={p.depth} transform={'matrix('+p.matrix.join(' ')+')'} opacity={p.alpha}>{p.character===C.cursor.character?<image href={C.cursor.pngDataUrl} x={C.cursor.bounds[0]} y={C.cursor.bounds[1]} width={C.cursor.bounds[2]} height={C.cursor.bounds[3]}/>:path(p)}</g>)}
    </svg>
   </div>
  </div>
 </section>;
}
const CSS=`.in004-intro{min-inline-size:0;max-inline-size:100%;padding:.75rem;background:#fffdf7;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.in004-intro *{box-sizing:border-box}.in004-intro h2{font-size:1.6em;line-height:1.35;overflow-wrap:normal;word-break:normal;hyphens:none}.in004-intro p{margin:.65em 0}.in004-intro button{font:inherit;min-inline-size:44px;min-block-size:44px;cursor:pointer;touch-action:manipulation}.in004-intro button:disabled{cursor:default}.in004-intro button:focus-visible,.in004-intro [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}.in004-intro__term{border:0;padding:.1em .05em;background:transparent;color:#1556a0;text-decoration:underline;white-space:nowrap}.in004-intro__port{max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;padding:1rem .4rem}.in004-intro__figure{position:relative;font-size:1.125rem;line-height:1.2;margin:auto;overflow:hidden}.in004-intro__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}.in004-intro__label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;word-break:normal;overflow-wrap:normal;font-variant-numeric:tabular-nums;pointer-events:none}.in004-intro__begin{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;padding:.35em .6em;background:#1556a0;color:white;border:1px solid #1556a0;border-radius:.5rem}.in004-intro__begin:disabled{background:#dce6ef;color:#35485c}.in004-intro__instructions *{transition:none!important}@media(max-width:480px){.in004-intro{padding-inline:0}.in004-intro h2{font-size:1.25rem}}`;
