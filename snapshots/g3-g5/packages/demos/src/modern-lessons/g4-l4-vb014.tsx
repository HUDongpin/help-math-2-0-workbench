'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {getCourseG04L04Vb014FrameState,CourseG04L04Vb014Renderer} from '../modules/course-g04-l04-vb-014';
import {VB014_FEEDBACK_TIMELINES,VB014_FRAME_CONTROL,createVb014Session,synchronizeVb014Session,bindVb014Children,dispatchVb014,type Vb014Card,type Vb014Target,type Vb014Session,type Vb014Action} from './g4-l4-vb014-state';
import {G4_L4_VB014_NATIVE_CONFIG} from './generated/g4-l4-vb014-native-config';

type Label=Readonly<{text:string;position:readonly number[];color:string;sourceTextIds:readonly string[];sourceInstances:readonly string[]}>;
type ShapePlacement=Readonly<{kind:'shape';character:number;matrix:readonly number[];instance:string;bounds:readonly number[]}>;
type CardFigure=Readonly<{shapes:readonly ShapePlacement[];bounds:readonly number[];label:Label}>;
export interface Vb014NativeConfig {
 readonly animationId:string;readonly placementId:string;readonly sourceSwfSha256:string;readonly frameDomain:'sprite-67';readonly rootFrame:6;readonly frameCount:171;readonly holdFrame:139;readonly fps:12;
 readonly title:string;readonly instruction:string;readonly wrong:string;readonly close:string;readonly correct:string;
 readonly alpha:readonly(readonly[number,number])[];readonly graphBounds:readonly number[];readonly widthEm:number;
 readonly axis:ShapePlacement;readonly ticks:readonly(Label&{readonly value:number})[];
 readonly cards:readonly Readonly<{id:Vb014Card;value:number;sourceSprite:number;sourceInstance:string;origin:readonly number[];snap:readonly number[]|null;intro:CardFigure;interactive:CardFigure}>[];
 readonly targets:readonly Readonly<{id:Vb014Target;bounds:readonly number[];sourceInstance:string}>[];
 readonly shapes:readonly Readonly<{character:number;paths:readonly Readonly<{d:string;fill:string;stroke:string;width:number}>[]}>[];
 readonly audio:Readonly<Record<string,readonly NonNullable<LessonTextActivityDefinition['audio']>[]>>;
 readonly closeInstance:string;readonly sourceAudio:AudioCue&{readonly sha256:string};readonly binding:LessonTextBinding;
}
const C:Vb014NativeConfig=G4_L4_VB014_NATIVE_CONFIG;
validateLessonTextBinding(C.binding);
export const VB014_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
 ...VB014_FEEDBACK_TIMELINES.map(d=>({...d,audio:C.audio[d.frameDomain.slice(7)].find(a=>a.firstFrame===d.startFrame)!})),
 {id:'vb014-close-down',sourceInstanceId:C.closeInstance,frameDomain:'sprite-54',parentLifetime:{firstFrame:139,lastFrameExclusive:140},parentFrames:[139],startFrame:1,endFrame:5,fps:12,buttonPress:{sourceButtonId:55},audio:C.audio['54'][0]},
];
const allActivities=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
export function vb014Alpha(frame:number){let value=0;for(const [at,v] of C.alpha){if(at>frame)break;value=v;}return value;}
export function vb014CardFigure(card:Vb014NativeConfig['cards'][number],frame:number,s:Vb014Session){
 const figure=frame<139?card.intro:card.interactive;
 const shift=frame<139?[0,0]:s.placed.includes(card.id)&&card.snap?card.snap:card.origin;
 return {figure,shift,bounds:[figure.bounds[0]+shift[0],figure.bounds[1]+shift[1],figure.bounds[2]+shift[0],figure.bounds[3]+shift[1]],label:[figure.label.position[0]+shift[0],figure.label.position[1]+shift[1]]};
}
export function getVb014TextSnapshot(state:SourceStaticCanvasFrameState,r:RuntimeContext,session=createVb014Session(r.seed,r.replay??0),activities:AnimationRendererProps['lessonActivities']=[]):TextPresentationSnapshot {
 const expected=getCourseG04L04Vb014FrameState(r.frame,r),s=synchronizeVb014Session(session,r,activities),alpha=vb014Alpha(state?.frame??1);
 const valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===C.animationId&&state.sourceSwfSha256===C.sourceSwfSha256
  &&state.frame===r.frame&&Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=171&&state.frameDomain===C.frameDomain&&(r.frameDomain??C.frameDomain)===C.frameDomain
  &&state.rootFrame===6&&(r.rootFrame??6)===6&&state.language==='en'&&r.lang==='en'&&state.scenario==='source-static-frame'&&r.scenario===state.scenario&&state.seed===(r.seed>>>0)&&!r.entryStateSha256);
 const final=s.children.find(c=>c.id==='vb014-final'),finalActivity=activities.find(a=>a.id==='vb014-final'&&a.sourceInstanceId==='sprite-67/depth-59/generation-1'&&a.frameDomain==='sprite-66'&&a.revision> (final?.floor??Infinity)&&a.cancellationToken&&(final?.revision===null||a.revision===final?.revision)&&(final?.token===null||a.cancellationToken===final?.token));
 const values:Record<string,{text:string;visible:boolean}>={title:{text:C.title,visible:true},instruction:{text:C.instruction,visible:alpha>0},wrong:{text:C.wrong,visible:r.frame===139&&s.wrongOpen},close:{text:C.close,visible:r.frame===139&&s.wrongOpen},correct:{text:C.correct,visible:r.frame===139&&Boolean(finalActivity?.status==='playing'&&finalActivity.frame>=2&&finalActivity.frame<25)}};
 for(const tick of C.ticks)values['tick-'+tick.value]={text:tick.text,visible:alpha>0};
 for(const card of C.cards)values['card-'+card.id]={text:(r.frame<139?card.intro:card.interactive).label.text,visible:alpha>0};
 return {schemaVersion:1,animationId:C.animationId,bindingVersion:C.binding.version,sourceSwfSha256:C.sourceSwfSha256,status:valid?'ready':'blocked',blockers:valid?[]:['exact-source-runtime-identity-mismatch'],identity:{frame:state?.frame??r.frame,frameDomain:state?.frameDomain??C.frameDomain,rootFrame:state?.rootFrame??6,scenario:r.scenario,language:r.lang,seed:r.seed,replay:r.replay??0},suppressedInstances:[],blocks:C.binding.blocks.map(b=>({id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder,text:values[b.id].text,visible:valid&&values[b.id].visible}))};
}
const CSS=`.vb014-native{inline-size:100%;min-inline-size:0;padding:.75rem;background:#fffdf7;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.vb014-native *{box-sizing:border-box}.vb014-native p{margin:.65em 0}.vb014-native h2{font-size:1.6em;line-height:1.35;overflow-wrap:normal;word-break:normal;hyphens:none}.vb014-native button{font:inherit;min-inline-size:44px;min-block-size:44px;cursor:pointer;touch-action:manipulation}.vb014-native button:disabled{cursor:default}.vb014-native button:focus-visible,.vb014-native [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}.vb014-native__port{max-inline-size:100%;overflow-x:auto;overscroll-behavior-inline:contain;padding:1rem .4rem}.vb014-native__figure{position:relative;font-size:1.125rem;line-height:1.2;margin:auto}.vb014-native__geometry{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}.vb014-native__label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;word-break:normal;overflow-wrap:normal;font-variant-numeric:tabular-nums;pointer-events:none}.vb014-native__card,.vb014-native__target{position:absolute;border:1px solid transparent;border-radius:.5rem;background:transparent;padding:0}.vb014-native__card:disabled{pointer-events:none}.vb014-native__card[aria-pressed=true]{outline:3px solid #1556a0;outline-offset:3px;background:rgba(21,86,160,.06)}.vb014-native__target{border:2px dashed #51759d}.vb014-native__target:hover:enabled{background:rgba(21,86,160,.1)}.vb014-native__feedback{padding:1rem;border:2px solid #99552e;border-radius:.6rem;background:#fff4e5}.vb014-native__correct{border-color:#296a42;background:#edf8ed}.vb014-native__close{padding:.4em 1em;border:1px solid #1556a0;background:#1556a0;color:white;border-radius:.4rem}.vb014-native__hint{font-size:1rem}.vb014-native [data-source-alpha]{transition:none!important}@media(max-width:480px){.vb014-native{padding-inline:0}.vb014-native h2{font-size:1.25rem}}`;
export function Vb014Scene({runtime:r,state,snapshot,session:s,onAction}:{runtime:AnimationRendererProps;state:SourceStaticCanvasFrameState;snapshot:TextPresentationSnapshot;session:Vb014Session;onAction:(a:Vb014Action)=>void}){
 const port=useRef<HTMLDivElement>(null),manual=useRef(false),drag=useRef<{id:Vb014Card;released:boolean}|null>(null),close=useRef<HTMLButtonElement>(null),wrongWasOpen=useRef(false);
 const frame=state.frame,alpha=vb014Alpha(frame),active=frame===139&&!r.paused&&!s.continued,locked=!active||!r.onLessonActivityRequest||!r.onLessonActivitiesRequest||!r.onLessonFrameRequest;
 const [minX,minY,width,height]=C.graphBounds,px=(x:number)=>(x-minX)/width*100+'%',py=(y:number)=>(y-minY)/height*100+'%';
 const rect=(b:readonly number[])=>({left:px(b[0]),top:py(b[1]),width:(b[2]-b[0])/width*100+'%',height:(b[3]-b[1])/height*100+'%'});
 const text=(id:string)=>snapshot.blocks.find(b=>b.id===id&&b.visible)?.text??'';
 useLayoutEffect(()=>{manual.current=false;},[r.replay]);
 useLayoutEffect(()=>{const p=port.current;if(!p||alpha<=0)return;const center=()=>{if(manual.current)return;const figure=p.firstElementChild as HTMLElement;const a=figure.getBoundingClientRect(),v=p.getBoundingClientRect();p.scrollLeft+=a.left+(C.ticks.find(t=>t.value===0)!.position[0]-minX)/width*figure.clientWidth-v.left-p.clientWidth/2;};center();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(center);observer?.observe(p);return()=>observer?.disconnect();},[alpha>0,r.replay]);
 useLayoutEffect(()=>{if(s.wrongOpen&&!wrongWasOpen.current)close.current?.focus();wrongWasOpen.current=s.wrongOpen;},[s.wrongOpen]);
 useEffect(()=>()=>{drag.current=null;},[r.replay,r.seed]);
 const paths=(p:ShapePlacement)=>C.shapes.find(x=>x.character===p.character)!.paths.map((v,i)=><path key={i} d={v.d} fill={v.fill} stroke={v.stroke} strokeWidth={v.width} strokeLinecap="round" strokeLinejoin="round"/>);
 const release=(target:Vb014Target|null)=>{if(!drag.current||locked)return;drag.current.released=true;onAction({type:'drop',card:drag.current.id,target});};
 return <section className="vb014-native" lang="en" data-modern-text-page={C.animationId} data-lesson-frame={frame} data-lesson-replay={r.replay??0} data-flash-frame-domain="sprite-67" data-flash-root-frame="6" data-vb014-placed={s.placed.join(',')} data-vb014-wrong={s.wrongOpen?'open':'closed'} data-vb014-continued={s.continued}
  onDragOver={e=>{if(drag.current&&!locked)e.preventDefault();}} onDrop={e=>{if(!drag.current)return;e.preventDefault();release(null);}}>
  <style>{CSS}</style><div className="lesson-text-presentation"><div className="lesson-text-presentation__layout">
   <h2 data-lesson-text-block="title">{text('title')}</h2>
   {alpha>0&&<><p data-lesson-text-block="instruction" data-source-alpha={alpha} style={{opacity:alpha}}>{text('instruction')}</p>
    {frame===139&&!s.continued&&<p className="vb014-native__hint">Select an arrow, then select a drop area. You can also drag the arrows.</p>}
    <div ref={port} className="vb014-native__port" role="region" aria-label="Number line from negative ten to twenty with six arrows" tabIndex={0} onPointerDown={()=>{manual.current=true;}} onWheel={()=>{manual.current=true;}} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();manual.current=true;const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*Math.max(44,p.clientWidth/2);}}>
     <div className="vb014-native__figure" data-source-alpha={alpha} style={{width:C.widthEm+'em',height:C.widthEm*height/width+'em',opacity:alpha}}>
      <svg className="vb014-native__geometry" viewBox={C.graphBounds.join(' ')} aria-hidden="true" focusable="false">
       <g data-source-shape={C.axis.character} transform={'matrix('+C.axis.matrix.join(' ')+')'}>{paths(C.axis)}</g>
       {C.cards.map(card=>{const v=vb014CardFigure(card,frame,s);return <g key={card.id} data-vb014-arrow={card.id} transform={`translate(${v.shift.join(' ')})`}>{v.figure.shapes.map((p,i)=><g key={i} data-source-shape={p.character} transform={'matrix('+p.matrix.join(' ')+')'}>{paths(p)}</g>)}</g>;})}
      </svg>
      {C.ticks.map(t=><span key={t.value} className="vb014-native__label" data-lesson-text-block={'tick-'+t.value} data-axis-value={t.value} style={{left:px(t.position[0]),top:py(t.position[1]),color:t.color}}>{text('tick-'+t.value)}</span>)}
      {frame>=139&&C.targets.map((t,i)=><button key={t.id} type="button" className="vb014-native__target" data-vb014-target={t.id} data-source-instance={t.sourceInstance} aria-label={'Number line drop area '+(i+1)} style={rect(t.bounds)} disabled={locked} onClick={()=>onAction({type:'drop',target:t.id})} onDragOver={e=>{if(drag.current&&!locked){e.preventDefault();e.stopPropagation();}}} onDrop={e=>{if(!drag.current||locked)return;e.preventDefault();e.stopPropagation();release(t.id);}}/>)}
      {C.cards.map(card=>{const v=vb014CardFigure(card,frame,s),disabled=locked||s.placed.includes(card.id);return <button key={card.id} type="button" className="vb014-native__card" data-vb014-card={card.id} data-source-instance={card.sourceInstance} aria-label={v.figure.label.text+', arrow to the '+(card.value>0?'right':'left')} aria-pressed={s.selected===card.id} style={rect(v.bounds)} disabled={disabled} draggable={!disabled} onClick={()=>onAction({type:'press',card:card.id})} onDragStart={e=>{if(disabled){e.preventDefault();return;}onAction({type:'press',card:card.id});drag.current={id:card.id,released:false};e.dataTransfer.setData('text/plain',card.id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{const d=drag.current;drag.current=null;if(d&&!d.released&&!locked)onAction({type:'drop',card:d.id,target:null});}}>
       <span className="vb014-native__label" data-lesson-text-block={'card-'+card.id} style={{left:(v.label[0]-v.bounds[0])/(v.bounds[2]-v.bounds[0])*100+'%',top:(v.label[1]-v.bounds[1])/(v.bounds[3]-v.bounds[1])*100+'%',color:v.figure.label.color}}>{text('card-'+card.id)}</span>
      </button>;})}
     </div>
    </div>
   </>}
   {text('correct')&&<div className="vb014-native__feedback vb014-native__correct" role="status"><strong data-lesson-text-block="correct">{text('correct')}</strong></div>}
   {text('wrong')&&<div className="vb014-native__feedback" role="region" aria-label="Try again"><p data-lesson-text-block="wrong">{text('wrong')}</p><LessonSourceButton ref={close} runtime={r} activityId="vb014-close-down" type="button" className="vb014-native__close" data-lesson-text-block="close" disabled={!!r.paused} onClick={()=>onAction({type:'close-wrong'})}>{text('close')}</LessonSourceButton></div>}
   {frame===171&&<button type="button" className="vb014-native__close" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button>}
  </div></div>
 </section>;
}
export function G4L4Vb014ModernRenderer(r:AnimationRendererProps){
 const context={...r,frameDomain:r.frameDomain??'sprite-67'},state=(r.state??getCourseG04L04Vb014FrameState(r.frame,context)) as SourceStaticCanvasFrameState;
 const [stored,setStored]=useState(()=>createVb014Session(r.seed,r.replay??0)),all=allActivities(r),s=synchronizeVb014Session(stored,context,all),snapshot=getVb014TextSnapshot(state,context,s,all);
 const live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
 const commit=(next:Vb014Session)=>{if(next!==live.current){live.current=next;setStored(next);}};
 useEffect(()=>{if(snapshot.status!=='ready'||r.paused||r.frame!==139)return;const bound=bindVb014Children(s,all);if(bound!==s){commit(bound);return;}commit(dispatchVb014(s,{type:'finish'},r));},[s,all,r.frame,r.paused,snapshot.status]);
 useEffect(()=>()=>{const props=runtime.current;for(const c of live.current.children){if(c.revision===null||!c.token)continue;const a=allActivities(props).find(a=>a.id===c.id&&a.revision===c.revision&&a.cancellationToken===c.token);if(a)props.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:c.token,parentFrame:props.frame});}},[r.seed,r.replay]);
 if(snapshot.status!=='ready')return <CourseG04L04Vb014Renderer {...r} state={state}/>;
 return <Vb014Scene runtime={r} state={state} session={s} snapshot={snapshot} onAction={a=>commit(dispatchVb014(live.current,a,runtime.current))}/>;
}
export const G4_L4_VB014_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:C.binding,Renderer:G4L4Vb014ModernRenderer,getSnapshot:getVb014TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-67':139},reducedMotionFrameByDomain:{'sprite-67':139},frameControl:VB014_FRAME_CONTROL,activityTimelines:VB014_ACTIVITIES,sourceTimelineAudioCues:[C.sourceAudio]};
