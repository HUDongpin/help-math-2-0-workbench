'use client';
import React,{useId,useLayoutEffect,useRef,useState} from 'react';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {p036Teaching,p036Readable,p036Emphasis,P036_SOURCE_ART,P036_SOURCE_IMAGES,P036_STATIC_KEYS,type P036Run,type P036Pose} from './nms-l02-p036-teaching-v1';
import type{P036SessionState,P036TermId}from'./nms-l02-p036-state-v1';
import './nms-l02-p036-explanation-v1.css';
import {P036_XML_PAGE_TITLE} from './generated/nms-l02-p036-page-title-source-v1';
import {P036_CARD_BOUNDS} from './generated/nms-l02-p036-layout-source-v1';
const el=React.createElement;
function Fraction({n,d,top=false,bottom=false}:{n:number;d:number;top?:boolean;bottom?:boolean}){return el('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true'},el('mfrac',null,el('mn',{className:top?'p036-explanation__emphasized':undefined},String(n)),el('mn',{className:bottom?'p036-explanation__emphasized':undefined},String(d))));}
function SourceRuns({runs,disabled,onTerm,divideFraction=0}:{runs:readonly P036Run[];disabled:boolean;divideFraction?:number;onTerm:(term:P036TermId,node:HTMLButtonElement)=>void}){
 const displayed=runs.map(r=>{const at=r.text.indexOf('(   )');return r.sourceTextId.startsWith('character-35/')&&at>=0?{...r,text:r.text.slice(0,at+1)+'÷'+r.text.slice(at+4),fractions:[...r.fractions.slice(0,at+1),divideFraction,...r.fractions.slice(at+4)]}:r;});
 return <>{displayed.map(r=>r.fractions.every(v=>v===1)?r.termId?<React.Fragment key={r.sourceTextId}>{r.text.match(/^\s+/u)?.[0]}<button type="button" className="p036-explanation__term" data-p036-term={r.termId} disabled={disabled} onClick={e=>onTerm(r.termId!,e.currentTarget)}>{r.text.trim()}</button>{r.text.match(/\s+$/u)?.[0]}</React.Fragment>:<span key={r.sourceTextId}>{r.text}</span>:<span key={r.sourceTextId}><span className="p036-explanation__sr">{p036Readable([r])}</span><span aria-hidden="true">{[...r.text].map((c,i)=><span className="p036-explanation__glyph" key={i} style={{clipPath:`inset(0 ${(1-r.fractions[i])*100}% 0 0)`}}>{c}</span>)}</span></span>)}</>;
}
function ImageDefinitions(){return <defs>{P036_SOURCE_IMAGES.map(i=><image key={i.id} id={i.id} width={i.width} height={i.height} href={i.uri}/>)}</defs>;}
function SourceDrawing({pose}:{pose:P036Pose}){const id=String(pose.characterId);if(!Object.hasOwn(P036_SOURCE_ART,id))return null;const art=P036_SOURCE_ART[id as keyof typeof P036_SOURCE_ART];return <g opacity={pose.color[3]} transform={'matrix('+pose.matrix.join(' ')+')'} dangerouslySetInnerHTML={{__html:art.body}}/>;}
const nearest=(n:number,values:readonly number[])=>values.reduce((best,v,i)=>Math.abs(v-n)<Math.abs(values[best]-n)?i:best,0);
export interface P036ExplanationProps{readonly state:P036SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;readonly interactionEnabled?:boolean;readonly onTerm:(term:P036TermId,node:HTMLButtonElement)=>void;}
export function P036Explanation({state,language='en',reducedMotion=false,interactionEnabled=true,onTerm}:P036ExplanationProps){
 const t=p036Teaching(state.mainFrame),emphasis=p036Emphasis(state.mainFrame,reducedMotion),clipId=useId().replaceAll(':','')+'-train',intro=t.introPoses.some(p=>[5,7,24,25].includes(p.characterId)&&p.color[3]>0),title=t.introPoses.find(p=>p.characterId===10),pointer=t.pointer;
 const pointerKey=pointer?P036_STATIC_KEYS.find(k=>{const x=pointer.matrix[4]-11.95,y=pointer.matrix[5]-14.8;return x>=k.bounds[0]&&x<=k.bounds[2]&&y>=k.bounds[1]&&y<=k.bounds[3]})?.label:null;
 const textProbe=useRef<HTMLSpanElement|null>(null),[largeText,setLargeText]=useState(false);
 useLayoutEffect(()=>{const node=textProbe.current;if(!node)return;const update=()=>setLargeText(node.getBoundingClientRect().width>18.01);update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect();},[]);
 const keyArea=useRef<HTMLDivElement|null>(null),[geometry,setGeometry]=useState<{xs:number[];ys:number[];width:number}|null>(null);
 useLayoutEffect(()=>{const node=keyArea.current;if(!node)return;const measure=()=>{const base=node.getBoundingClientRect(),find=(label:string)=>[...node.querySelectorAll<HTMLElement>('[data-p036-static-key]')].find(n=>n.dataset.p036StaticKey===label)!.getBoundingClientRect();setGeometry({xs:['1','2','3','÷'].map(k=>{const r=find(k);return r.left+r.width/2-base.left}),ys:['M+','1','4','7','0','%'].map(k=>{const r=find(k);return r.top+r.height/2-base.top}),width:find('1').width*23.95/31.9});};measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();},[t.calculatorPresent]);
 const map=(value:number,source:number[],target:number[])=>{let i=0;while(i<source.length-2&&value>source[i+1])i++;return target[i]+(value-source[i])/(source[i+1]-source[i])*(target[i+1]-target[i]);};
 const pointerX=pointer&&geometry?map(pointer.matrix[4]-11.95,[157.8,195.8,233.3,270.85],geometry.xs):0,pointerY=pointer&&geometry?map(pointer.matrix[5]-14.8,[7.8,30.05,55.8,81.8,109.8,138.15],geometry.ys):0;
 return <section className="p036-explanation lesson-text-presentation" lang="en" data-p036-frame={state.mainFrame} data-p036-phase={state.phase}>
  <span ref={textProbe} className="p036-explanation__text-probe" aria-hidden="true"/>
  <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
  <h2 className="p036-explanation__page-title" data-lesson-xml-title={P036_XML_PAGE_TITLE.sourcePageReference} data-source-xml-sha256={P036_XML_PAGE_TITLE.sourceXml.sha256}>{P036_XML_PAGE_TITLE.title}</h2>
  {language==='es'&&<p lang="es">Esta página conserva el título y el texto originales en inglés. Las definiciones están disponibles en español.</p>}
  {intro&&<figure className="p036-explanation__train" data-large-text={largeText}>
   <figcaption data-lesson-text-block="train-title" style={{opacity:title?.color[3]??0}} aria-hidden={!title||title.color[3]===0||undefined}>Fractions to Decimals Express</figcaption>
   <svg viewBox="-350.4 -25 706.2 215.8" aria-hidden="true"><ImageDefinitions/><defs><clipPath id={clipId}><rect x="-350.4" y="-197.3" width="706.2" height="388.1"/></clipPath></defs><g clipPath={`url(#${clipId})`}>{t.introPoses.filter(p=>[5,7,24,25].includes(p.characterId)).map(p=><SourceDrawing key={p.depth} pose={reducedMotion&&p.characterId===7?{...p,matrix:[1,0,0,1,27.6,24.5]}:p}/>)}{t.introCards.map(c=>{if(!c.panel)return null;const r=P036_CARD_BOUNDS[String(c.panel.characterId) as keyof typeof P036_CARD_BOUNDS];return <g key={c.id} className="p036-explanation__overlay" opacity={c.panel.color[3]} transform={'matrix('+c.panel.matrix.join(' ')+')'} aria-hidden="true"><rect {...r} fill="#ffce26" stroke="#9f6109" strokeWidth="1"/><foreignObject {...r}><div className="p036-explanation__overlay-pair"><Fraction n={c.fraction[0]} d={c.fraction[1]}/><span>{c.decimal}</span></div></foreignObject></g>})}</g></svg>
   <div className="p036-explanation__pairs" data-lesson-text-block="train-pairs">{t.introCards.map(c=>{const alpha=c.panel?.color[3]??0;return <div key={c.id} data-p036-card={c.id} data-p036-card-alpha={alpha} className="p036-explanation__pair" style={{opacity:alpha}} aria-hidden={alpha===0||undefined}><Fraction n={c.fraction[0]} d={c.fraction[1]}/><span>↔</span><span>{c.decimal}</span></div>})}</div>
  </figure>}
  <div className="p036-explanation__instructions">{[29,34,35,37,38].map(id=>{const runs=t.runs.filter(r=>r.sourceTextId.startsWith('character-'+id+'/'));return runs.length?<p key={id} data-lesson-text-block={'instruction-'+id}><SourceRuns runs={runs} disabled={!interactionEnabled||state.term!==null} onTerm={onTerm} divideFraction={t.divisionInstructionSymbol?Math.max(0,Math.min(1,(Math.min(t.divisionInstructionSymbol.mask[2],t.divisionInstructionSymbol.bounds[2])-Math.max(t.divisionInstructionSymbol.mask[0],t.divisionInstructionSymbol.bounds[0]))/(t.divisionInstructionSymbol.bounds[2]-t.divisionInstructionSymbol.bounds[0]))):0}/></p>:null})}</div>
  {t.calculatorPresent&&<div className="p036-explanation__demonstration">
   <div className="p036-explanation__example" data-lesson-text-block="example"><Fraction n={3} d={4} top={emphasis.numerator} bottom={emphasis.denominator}/><span style={{opacity:t.resultAlpha}} aria-hidden={t.resultAlpha===0||undefined} data-p036-result-alpha={t.resultAlpha}>= 0.75</span></div>
   <figure className="p036-explanation__calculator" aria-label={language==='es'?'Demostración de calculadora':'Calculator demonstration'}>
    <figcaption data-lesson-text-block="calculator-title">CALCULATOR <span aria-hidden="true">⊗</span></figcaption>
    <output className={emphasis.result?'p036-explanation__display p036-explanation__display--emphasis':'p036-explanation__display'} data-lesson-text-block="calculator-display" data-p036-display={t.display} aria-label={(language==='es'?'Pantalla: ':'Display: ')+t.display}>{t.display||'\u00a0'}</output>
    {pointer&&<p className="p036-explanation__sr">{pointerKey?(language==='es'?'El puntero señala ':'The pointer is over ')+pointerKey:(language==='es'?'El puntero se mueve hacia la calculadora.':'The pointer is moving toward the calculator.')}</p>}
    <div className="p036-explanation__key-area" ref={keyArea}><div className="p036-explanation__keys" data-lesson-text-block="calculator-keys" aria-hidden="true">{P036_STATIC_KEYS.map(k=><span key={k.label} data-p036-static-key={k.label} className={k.backgroundCharacterId===73?'p036-explanation__memory-key':''} style={{gridColumn:nearest(k.matrix[4],[157.8,195.8,233.3,270.85])+1,gridRow:nearest(k.matrix[5],[7.8,30.05,55.8,81.8,109.8,138.15])+1}}>{k.label}</span>)}</div>
     {pointer&&geometry&&!reducedMotion&&<svg className="p036-explanation__pointer" viewBox="-11.95 -14.8 23.95 29.3" aria-hidden="true" data-p036-pointer="source" style={{left:pointerX,top:pointerY,width:geometry.width}}><ImageDefinitions/><g dangerouslySetInnerHTML={{__html:P036_SOURCE_ART['81'].body}}/></svg>}
    </div>
   </figure>
  </div>}
 </section>;
}
