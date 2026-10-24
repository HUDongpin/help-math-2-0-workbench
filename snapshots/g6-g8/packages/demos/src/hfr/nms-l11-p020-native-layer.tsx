import React,{useLayoutEffect,useRef} from 'react';
import{createPortal}from'react-dom';
import type {DisplayObject} from './display';
import type {P020ProductView,P020NativeIntent} from './nms-l11-p020-product';
import {isP020NativeCurrent,type P020NativeFrame,type P020NativeLabel} from './nms-l11-p020-native';
import {P020} from './nms-l11-p020-source-binding';
import {P020_NATIVE} from './nms-l11-p020-native-binding';
const screenReader:React.CSSProperties={position:'absolute',width:1,height:1,overflow:'hidden',clipPath:'inset(50%)'};
function Label({label:l}:{label:P020NativeLabel}){return <svg x={`${l.x/800*100}%`} y={`${l.y/600*100}%`} width="1" height="1" overflow="visible"><text data-p020-native-source-text={l.characterId} data-p020-native-instance={l.instance.id} data-p020-native-run={l.runIndex} data-lesson-text-block={`source-text-${l.characterId}`} x={l.glyphOffsetsTwips.map(n=>`${n/320}rem`).join(' ')} y="0" transform={`matrix(${l.linear.join(' ')} 0 0)`} style={{fontFamily:'var(--lesson-font-body,"Nunito Sans",sans-serif)',fontSize:`${l.fontSizeRem}rem`,fontWeight:l.fontWeight,whiteSpace:'pre',fill:`rgb(${l.color.slice(0,3).join(',')})`,opacity:l.color[3]/255}}>{l.text}</text></svg>}
function box(o:DisplayObject){const b=o.localBounds(),m=o.worldMatrix();if(!b)return null;const points=[[b.xmin,b.ymin],[b.xmax,b.ymin],[b.xmax,b.ymax],[b.xmin,b.ymax]].map(([x,y])=>[m.a*x+m.c*y+m.tx,m.b*x+m.d*y+m.ty]);return[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];}
const buttonStyle=(b:readonly number[]):React.CSSProperties=>({position:'absolute',left:`${b[0]/16000*100}%`,top:`${b[1]/12000*100}%`,width:`${(b[2]-b[0])/16000*100}%`,height:`${(b[3]-b[1])/12000*100}%`,font:'inherit',background:'transparent',border:'2px solid transparent',borderRadius:'.25rem',padding:0,pointerEvents:'auto',cursor:'pointer'});
/** Native glyph offsets use rem, while authored Canvas hit boxes use stage
 * percentages. Keep each modern term hit target on its exact current source
 * run/glyph span; Canvas-retained words keep their authored source target. */
export function p020AlignNativeGlossaryTargets(plane:HTMLDivElement,frame:P020NativeFrame,glossary:P020ProductView['glossary']):void{
 const p=plane.getBoundingClientRect(),sx=plane.clientWidth/p.width,sy=plane.clientHeight/p.height;
 const buttons=[...plane.querySelectorAll<HTMLButtonElement>('[data-p020-glossary-instance]')],texts=[...plane.querySelectorAll<SVGTextElement>('text[data-p020-native-instance][data-p020-native-run]')];
 for(const intent of glossary){
  const matches=buttons.filter(b=>b.getAttribute('data-p020-glossary-instance')===intent.instanceId);if(matches.length!==1)continue;const button=matches[0];
  if(intent.sourceTextPresentation==='canvas'){const authored=buttonStyle(intent.box);Object.assign(button.style,{left:authored.left,top:authored.top,width:authored.width,height:authored.height,boxSizing:'',visibility:'inherit'});continue;}
  const spec=P020_NATIVE.controls.find(c=>c.instanceId===intent.instanceId),label=spec&&frame.labels.find(l=>l.instance.id===spec.sourceTextInstanceId&&l.runIndex===spec.runIndex&&'character-'+l.characterId===spec.sourceTextId);
  if(!spec||!label||!plane.isConnected||![sx,sy].every(n=>Number.isFinite(n)&&n>0)){button.style.visibility='hidden';continue;}
  const runs=texts.filter(t=>t.getAttribute('data-p020-native-instance')===spec.sourceTextInstanceId&&t.getAttribute('data-p020-native-run')===String(spec.runIndex)&&t.getAttribute('data-p020-native-source-text')===String(label.characterId));
  if(runs.length!==1){button.style.visibility='hidden';continue;}const text=runs[0],matrix=text.getScreenCTM();
  if(!text.isConnected||!matrix||text.textContent!==label.text||text.getNumberOfChars()!==label.text.length||spec.glyphStart<0||spec.glyphEndExclusive>text.getNumberOfChars()||spec.glyphStart>=spec.glyphEndExclusive){button.style.visibility='hidden';continue;}
  const points:number[][]=[];for(let i=spec.glyphStart;i<spec.glyphEndExclusive;i++){const b=text.getExtentOfChar(i);for(const[x,y]of[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]])points.push([matrix.a*x+matrix.c*y+matrix.e,matrix.b*x+matrix.d*y+matrix.f]);}
  const left=(Math.min(...points.map(v=>v[0]))-p.left)*sx,top=(Math.min(...points.map(v=>v[1]))-p.top)*sy,width=(Math.max(...points.map(v=>v[0]))-Math.min(...points.map(v=>v[0])))*sx,height=(Math.max(...points.map(v=>v[1]))-Math.min(...points.map(v=>v[1])))*sy;
  if(![left,top,width,height].every(Number.isFinite)||width<=0||height<=0){button.style.visibility='hidden';continue;}
  Object.assign(button.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`,boxSizing:'border-box',visibility:'inherit'});
 }
}
/** The committed exact frame controls text suppression. Static runs retain authored glyph positions; the popup value is read from
 * its exact live TextField. Source fraction bars and masks stay on Canvas. */
export function P020NativeLayer({frame,view,blocked,labelsHost,onCommitted,onActivate}:{frame:P020NativeFrame|null;view:P020ProductView;blocked:boolean;labelsHost?:HTMLElement|null;onCommitted:(f:P020NativeFrame|null)=>void;onActivate:(intent:P020NativeIntent,trigger:HTMLElement,frame:P020NativeFrame)=>void}){
 const planeRef=useRef<HTMLDivElement>(null),lastAnswer=useRef<string|null>(null),hadPopup=useRef(false),ready=Boolean(frame?.snapshot.status==='ready'&&isP020NativeCurrent(frame,frame.runtime,frame.identity)&&(labelsHost===undefined||labelsHost));
 useLayoutEffect(()=>{
  const plane=planeRef.current;if(!ready||!frame||!plane)return;let disposed=false;
  const align=()=>{if(!disposed&&plane.isConnected&&isP020NativeCurrent(frame,frame.runtime,frame.identity))p020AlignNativeGlossaryTargets(plane,frame,view.glossary);};
  align();const observer=new ResizeObserver(align);observer.observe(plane);for(const text of plane.querySelectorAll('text[data-p020-native-instance][data-p020-native-run]'))observer.observe(text);
  document.fonts.addEventListener('loadingdone',align);void document.fonts.ready.then(align);
  return()=>{disposed=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',align);};
 },[frame,ready,view.glossary]);
 useLayoutEffect(()=>{onCommitted(ready?frame:null);return()=>onCommitted(null);},[frame,ready,onCommitted]);
 useLayoutEffect(()=>{if(hadPopup.current&&!view.feedback&&view.choices.length&&lastAnswer.current){labelsHost?.querySelector<HTMLButtonElement>(`[data-p020-answer="${lastAnswer.current}"]`)?.focus();lastAnswer.current=null;}hadPopup.current=Boolean(view.feedback);},[view,labelsHost]);
 if(!ready||!frame)return null;
 const activate=(intent:P020NativeIntent,e:React.MouseEvent<HTMLButtonElement>)=>{if(!blocked)onActivate(intent,e.currentTarget,frame);};
 const plane=<div ref={planeRef} lang="en" data-p020-native-plane="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <svg data-p020-native-labels="true" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{frame.labels.map(l=><Label key={`${l.instance.id}/run-${l.runIndex}`} label={l}/>)}</svg>
  {frame.dynamicText.map(value=><div key={value.instance.id} data-p020-native-dynamic-text="62" data-p020-native-instance={value.instance.id} data-lesson-text-block="source-text-62" style={{position:'absolute',left:`${value.x/800*100}%`,top:`${value.y/600*100}%`,width:`${value.widthRem}rem`,height:`${value.heightRem}rem`,transform:`matrix(${value.linear.join(',')} ,0,0)`,transformOrigin:'0 0',fontFamily:'var(--lesson-font-body,"Nunito Sans",sans-serif)',fontSize:`${value.fontSizeRem}rem`,fontWeight:400,lineHeight:value.lineHeight,color:`rgb(${value.color.slice(0,3).join(',')})`,opacity:value.color[3]/255,whiteSpace:'normal',overflowWrap:'normal',overflow:'hidden',margin:0,padding:0,pointerEvents:'none'}}>{value.text}</div>)}
  {view.glossary.map(intent=><button type="button" key={intent.instanceId} className="p020-native-control" aria-disabled={blocked} tabIndex={blocked?-1:0} data-p020-glossary-instance={intent.instanceId} data-p020-glossary={intent.entryId} data-hfr-source-button={intent.button.charId} aria-label={`${intent.label}, glossary`} style={{...buttonStyle(intent.box),visibility:intent.sourceTextPresentation==='native'?'hidden':undefined}} onClick={e=>activate(intent,e)}><span style={screenReader}>{intent.label}</span></button>)}
  {view.choices.map(intent=>{const binding=P020.choices.find(c=>c.name===intent.sourceName)!,b=box(intent.button);return b?<button type="button" key={intent.sourceName} disabled={blocked} className="p020-native-control" data-p020-answer={intent.sourceName} data-hfr-source-button={intent.button.charId} aria-label={binding.display} style={buttonStyle(b)} onClick={e=>{lastAnswer.current=intent.sourceName;activate(intent,e);}}><span style={screenReader}>{binding.display}</span></button>:null;})}
  {view.feedback&&(()=>{const intent=view.feedback.close,b=box(intent.button);return b?<button type="button" disabled={blocked} className="p020-native-control" data-p020-wrong-close="true" data-p020-dynamic-hint-field={view.feedback.sourceTextCharacterId} aria-label="Close feedback" style={buttonStyle(b)} onClick={e=>activate(intent,e)}><span style={screenReader}>Close</span></button>:null;})()}
 </div>;
 return <><section lang="en" data-p020-native-practice="exact-source-native-v1" data-p020-main-frame={view.state.mainFrame??undefined} data-p020-adapter-epoch={view.state.epoch} data-p020-feedback-name={view.state.feedback?.sourceName} data-p020-feedback-id={view.state.feedback?.sourceCharacterId} data-p020-feedback-frame={view.state.feedback?.frame} data-p020-source-activity-exited={String(view.state.sourceActivityExited)} data-p020-answered-correctly={String(view.state.answeredCorrectly)} style={{fontFamily:'var(--lesson-font-body,"Nunito Sans",sans-serif)',width:'100%',minWidth:0}}>{frame.title?<h2 data-p020-native-instance={P020_NATIVE.title.instanceId} data-p020-native-source-text={1} data-lesson-text-block="source-section-title" style={{fontFamily:'var(--lesson-font-display,"Fredoka",sans-serif)',fontSize:'var(--lesson-text-title,1.75rem)',lineHeight:1.35,margin:'0 0 .75rem',color:'#10389c'}}>{P020_NATIVE.title.text}</h2>:null}</section>{labelsHost?createPortal(plane,labelsHost):plane}<style>{'.p020-native-control:focus-visible{outline:3px solid #10389c;outline-offset:3px;background:rgba(255,255,255,.12)!important}'}</style></>;
}
