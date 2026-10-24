import React,{useEffect,useLayoutEffect,useRef} from 'react';
import{createPortal}from'react-dom';
import type {P009ProductView,P009MainGlossaryIntent} from './nms-l11-p009-product';
import type {P009ChoiceIntent,P009CloseIntent,P009FeedbackLinkIntent} from './nms-l11-p009-practice-host';
import type {P009NativeFrame,P009NativeLabel}from'./nms-l11-p009-native';
import {isP009NativeCurrent}from'./nms-l11-p009-native';
import {P009} from './nms-l11-p009-source-binding';
export type P009NativeIntent=P009ChoiceIntent|P009CloseIntent|P009FeedbackLinkIntent|P009MainGlossaryIntent;
const inline:React.CSSProperties={display:'inline',font:'inherit',lineHeight:'inherit',whiteSpace:'normal',color:'#0000cc',background:'transparent',border:0,padding:0,textDecoration:'underline',cursor:'pointer',minHeight:'2.75rem'};
function Label({label:l}:{label:P009NativeLabel}){return <svg x={`${l.x/800*100}%`} y={`${l.y/600*100}%`} width="1" height="1" overflow="visible"><text data-p009-native-source-text={l.characterId} data-p009-native-instance={l.instance.id} data-lesson-text-block={`source-text-${l.characterId}`} x="0" y="0" transform={`matrix(${l.linear.join(' ')} 0 0)`} style={{fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:`${l.fontSizeRem}rem`,fontWeight:l.fontWeight,fill:`rgb(${l.color.slice(0,3)})`,opacity:l.opacity}}>{l.text}</text></svg>}
function buttonBox(intent:P009ChoiceIntent){const b=intent.button.localBounds(),m=intent.button.worldMatrix();if(!b||m.b!==0||m.c!==0||m.a<=0||m.d<=0)return null;return{left:(b.xmin*m.a+m.tx)/16000*100,top:(b.ymin*m.d+m.ty)/12000*100,width:(b.xmax-b.xmin)*m.a/16000*100,height:(b.ymax-b.ymin)*m.d/12000*100};}
/** One committed native frame controls both DOM text and exact source suppression.
 * Source fraction bars, masks, shapes, images, partial reveals and clocks remain source-owned. */
export function P009NativePractice({view,blocked,labelsHost,onCommitted,onActivate}:{view:P009ProductView;blocked:boolean;labelsHost?:HTMLElement|null;onCommitted?:(frame:P009NativeFrame|null)=>void;onActivate:(intent:P009NativeIntent,trigger:HTMLElement,frame:P009NativeFrame)=>void}){
 const host=useRef<HTMLElement>(null),lastAnswer=useRef<string|null>(null),wasFeedback=useRef(false),frame=view.native;
 const ready=Boolean(frame?.snapshot.status==='ready'&&isP009NativeCurrent(frame,frame.runtime,frame.identity)&&(labelsHost===undefined||labelsHost));
 useLayoutEffect(()=>{onCommitted?.(ready?frame:null);return()=>onCommitted?.(null);},[frame,ready,onCommitted]);
 useEffect(()=>{if(wasFeedback.current&&!view.state.feedback&&view.choices.length&&lastAnswer.current){labelsHost?.querySelector<HTMLButtonElement>(`[data-p009-answer="${lastAnswer.current}"]`)?.focus();lastAnswer.current=null;}wasFeedback.current=Boolean(view.state.feedback);},[view,labelsHost]);
 if(!ready||!frame)return null;
 const activate=(intent:P009NativeIntent,trigger:HTMLElement)=>onActivate(intent,trigger,frame);
 const mainLink=(key:'Rational numbers'|'Integers',label:string)=>{const intent=view.mainGlossary.find(i=>i.sourceKey===key);return intent?<button type="button" aria-disabled={blocked || undefined} style={inline} data-p009-main-glossary={intent.entryId} onClick={e=>{if(!blocked)activate(intent,e.currentTarget);}}>{label}</button>:<span>{label}</span>};
 const labels=<>
  <svg data-p009-native-labels="true" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{frame.labels.filter(l=>!(frame.feedback&&l.characterId===40)).map(l=><Label key={l.instance.id} label={l}/>)}</svg>
  {view.choices.map(intent=>{const c=P009.choices.find(c=>c.name===intent.sourceName)!,box=buttonBox(intent);return box?<button key={c.name} type="button" disabled={blocked} aria-label={c.value==='1/3'?'1 over 3':c.value==='6/1'?'6 over 1':c.value} data-p009-answer={c.name} data-hfr-source-button={c.buttonCharacterId} className="p009-native-answer" style={{position:'absolute',left:`${box.left}%`,top:`${box.top}%`,width:`${box.width}%`,height:`${box.height}%`,font:'inherit',background:'transparent',border:'2px solid transparent',borderRadius:'.25rem',padding:0,pointerEvents:'auto',cursor:'pointer'}} onClick={e=>{lastAnswer.current=c.name;activate(intent,e.currentTarget);}}><span style={{position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'}}>{c.value}</span></button>:null;})}
 </>;
 return <><section ref={host} lang="en" data-p009-native-practice="exact-source-native-v1" data-p009-main-frame={view.state.mainFrame??undefined} data-p009-complete={String(view.state.complete)} style={{fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:'var(--lesson-text-body,1.125rem)',lineHeight:1.6,boxSizing:'border-box',padding:'1rem',background:'#fffdf8',width:'100%',minWidth:0,overflowWrap:'anywhere'}}>
  {frame.title?<h2 data-lesson-text-block="source-section-title" style={{fontFamily:'var(--lesson-font-display,"Fredoka",sans-serif)',fontSize:'var(--lesson-text-title,1.75rem)',lineHeight:1.35,margin:'0 0 .75rem',color:'rgb(16,56,156)'}}>{view.sourceTitle}</h2>:null}
  {frame.prompt?<p data-lesson-text-block="source-text-7" style={{margin:'0 0 .75rem'}}>Click the {mainLink('Rational numbers','rational number')} that is not an {mainLink('Integers','integer')}.</p>:null}
  {frame.feedback&&view.feedback?<div data-p009-source-feedback="true"><p data-lesson-text-block="source-text-48">{view.feedback.tokens.map((token,index)=>{
   if(token.kind==='text')return <span key={index}>{token.text}</span>;const intent=view.feedback!.links.find(link=>link.sourceKey===token.sourceKey)!;return <button key={index} type="button" aria-disabled={blocked || undefined} style={inline} data-p009-feedback-glossary={intent.entryId} onClick={e=>{if(!blocked)activate(intent,e.currentTarget);}}>{token.text}</button>;
  })}</p><button type="button" disabled={blocked} data-p009-wrong-close="true" style={{font:'inherit',minHeight:'2.75rem'}} onClick={e=>activate(view.feedback!.close,e.currentTarget)}>Close</button></div>:null}
 </section>{labelsHost?createPortal(labels,labelsHost):labels}<style>{'.p009-native-answer:focus-visible{outline:3px solid #10389c;outline-offset:3px;background:rgba(255,255,255,.12)!important}'}</style></>;
}
