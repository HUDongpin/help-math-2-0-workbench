import React,{useEffect,useLayoutEffect,useRef} from 'react';
import{createPortal}from'react-dom';
import type {P010ProductView,P010MainGlossaryIntent} from './nms-l11-p010-product';
import type {P010ChoiceIntent,P010CloseIntent,P010FeedbackLinkIntent} from './nms-l11-p010-practice-host';
import type {P010NativeFrame,P010NativeLabel}from'./nms-l11-p010-native';
import {isP010NativeCurrent}from'./nms-l11-p010-native';
import {P010} from './nms-l11-p010-source-binding';
export type P010NativeIntent=P010ChoiceIntent|P010CloseIntent|P010FeedbackLinkIntent|P010MainGlossaryIntent;
const inline:React.CSSProperties={display:'inline',font:'inherit',lineHeight:'inherit',whiteSpace:'normal',color:'#0000cc',background:'transparent',border:0,padding:0,textDecoration:'underline',cursor:'pointer',minHeight:'2.75rem'};
function Label({label:l}:{label:P010NativeLabel}){return <svg x={`${l.x/800*100}%`} y={`${l.y/600*100}%`} width="1" height="1" overflow="visible"><text data-p010-native-source-text={l.characterId} data-p010-native-instance={l.instance.id} data-lesson-text-block={`source-text-${l.characterId}`} x="0" y="0" transform={`matrix(${l.linear.join(' ')} 0 0)`} style={{fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:`${l.fontSizeRem}rem`,fontWeight:l.fontWeight,fill:`rgb(${l.color.slice(0,3)})`,opacity:l.opacity}}>{l.text}</text></svg>}
function buttonBox(intent:P010ChoiceIntent){
 const b=intent.button.localBounds(),m=intent.button.worldMatrix();if(!b||!Object.values(m).every(Number.isFinite)||m.a*m.d-m.b*m.c===0)return null;
 const points=[[b.xmin,b.ymin],[b.xmax,b.ymin],[b.xmax,b.ymax],[b.xmin,b.ymax]].map(([x,y])=>[m.a*x+m.c*y+m.tx,m.b*x+m.d*y+m.ty]);
 const left=Math.min(...points.map(p=>p[0])),right=Math.max(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
 if(right<=left||bottom<=top)return null;
 return{left:left/16000*100,top:top/12000*100,width:(right-left)/16000*100,height:(bottom-top)/12000*100,clipPath:`polygon(${points.map(p=>`${(p[0]-left)/(right-left)*100}% ${(p[1]-top)/(bottom-top)*100}%`).join(',')})`};
}
/** One committed native frame controls both DOM text and exact source suppression.
 * Source fraction bars, masks, shapes, images, partial reveals and clocks remain source-owned. */
export function P010NativePractice({view,blocked,labelsHost,onCommitted,onActivate}:{view:P010ProductView;blocked:boolean;labelsHost?:HTMLElement|null;onCommitted?:(frame:P010NativeFrame|null)=>void;onActivate:(intent:P010NativeIntent,trigger:HTMLElement,frame:P010NativeFrame)=>void}){
 const host=useRef<HTMLElement>(null),lastAnswer=useRef<string|null>(null),wasFeedback=useRef(false),frame=view.native;
 const ready=Boolean(frame?.snapshot.status==='ready'&&isP010NativeCurrent(frame,frame.runtime,frame.identity)&&(labelsHost===undefined||labelsHost));
 useLayoutEffect(()=>{onCommitted?.(ready?frame:null);return()=>onCommitted?.(null);},[frame,ready,onCommitted]);
 useEffect(()=>{if(wasFeedback.current&&!view.state.feedback&&view.choices.length&&lastAnswer.current){labelsHost?.querySelector<HTMLButtonElement>(`[data-p010-answer="${lastAnswer.current}"]`)?.focus();lastAnswer.current=null;}wasFeedback.current=Boolean(view.state.feedback);},[view,labelsHost]);
 if(!ready||!frame)return null;
 const activate=(intent:P010NativeIntent,trigger:HTMLElement)=>onActivate(intent,trigger,frame);
 const mainLink=(key:'Rational numbers'|'Integers',label:string)=>{const intent=view.mainGlossary.find(i=>i.sourceKey===key);return intent?<button type="button" aria-disabled={blocked} style={inline} data-p010-main-glossary={intent.entryId} onClick={e=>{if(!blocked)activate(intent,e.currentTarget);}}>{label}</button>:<span>{label}</span>};
 const labels=<>
  <svg data-p010-native-labels="true" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{frame.labels.filter(l=>!(frame.feedback&&l.characterId===37)).map(l=><Label key={l.instance.id} label={l}/>)}</svg>
  {view.choices.map(intent=>{const c=P010.choices.find(c=>c.name===intent.sourceName)!,box=buttonBox(intent);return box?<button key={c.name} type="button" disabled={blocked} aria-label={c.display==='2/3'?'2 over 3':c.display==='21/7'?'21 over 7':c.display} data-p010-answer={c.name} data-hfr-source-button={c.buttonCharacterId} className="p010-native-answer" style={{position:'absolute',left:`${box.left}%`,top:`${box.top}%`,width:`${box.width}%`,height:`${box.height}%`,clipPath:box.clipPath,font:'inherit',background:'transparent',border:'2px solid transparent',borderRadius:'.25rem',padding:0,pointerEvents:'auto',cursor:'pointer'}} onClick={e=>{lastAnswer.current=c.name;activate(intent,e.currentTarget);}}><span style={{position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'}}>{c.display}</span></button>:null;})}
 </>;
 return <><section ref={host} lang="en" data-p010-native-practice="exact-source-native-v1" data-p010-main-frame={view.state.mainFrame??undefined} data-p010-adapter-epoch={view.state.epoch} data-p010-feedback-name={view.state.feedback?.sourceName} data-p010-feedback-id={view.state.feedback?.sourceCharacterId} data-p010-feedback-frame={view.state.feedback?.frame} data-p010-feedback-terminal={view.state.feedback?.sourceTerminalFrame} data-p010-retry-ordinal={view.state.lastWrongRetry?.ordinal} data-p010-retry-name={view.state.lastWrongRetry?.sourceName} data-p010-retry-id={view.state.lastWrongRetry?.sourceCharacterId} data-p010-retry-frame={view.state.lastWrongRetry?.frame} data-p010-retry-tick={view.state.lastWrongRetry?.tick} data-p010-retry-epoch={view.state.lastWrongRetry?.epoch} data-p010-complete={String(view.state.complete)} style={{fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:'var(--lesson-text-body,1.125rem)',lineHeight:1.6,boxSizing:'border-box',padding:'1rem',background:'#fffdf8',width:'100%',minWidth:0,overflowWrap:'anywhere'}}>
  {frame.title?<h2 data-lesson-text-block="source-section-title" style={{fontFamily:'var(--lesson-font-display,"Fredoka",sans-serif)',fontSize:'var(--lesson-text-title,1.75rem)',lineHeight:1.35,margin:'0 0 .75rem',color:'rgb(16,56,156)'}}>{view.sourceTitle}</h2>:null}
  {frame.prompt?<p data-lesson-text-block="source-text-7" style={{margin:'0 0 .75rem'}}>Click the {mainLink('Rational numbers','rational number')} that is an {mainLink('Integers','integer')}.</p>:null}
  {frame.feedback&&view.feedback?<div data-p010-source-feedback="true"><p data-lesson-text-block="source-text-45">{view.feedback.tokens.map((token,index)=>{
   if(token.kind==='text')return <span key={index}>{token.text}</span>;const intent=view.feedback!.links.find(link=>link.sourceKey===token.sourceKey)!;return <button key={index} type="button" aria-disabled={blocked} style={inline} data-p010-feedback-glossary={intent.entryId} onClick={e=>{if(!blocked)activate(intent,e.currentTarget);}}>{token.text}</button>;
  })}</p><button type="button" disabled={blocked} data-p010-wrong-close="true" style={{font:'inherit',minHeight:'2.75rem'}} onClick={e=>activate(view.feedback!.close,e.currentTarget)}>Close</button></div>:null}
 </section>{labelsHost?createPortal(labels,labelsHost):labels}<style>{'.p010-native-answer:focus-visible{outline:3px solid #10389c;outline-offset:3px;background:rgba(255,255,255,.12)!important}'}</style></>;
}
