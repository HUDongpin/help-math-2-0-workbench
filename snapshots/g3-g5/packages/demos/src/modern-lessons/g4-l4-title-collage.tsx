'use client';

import React,{useEffect,useRef} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {lessonTextInstanceId} from '../lesson-text-snapshot';

type Ranges=readonly (readonly number[])[];
type Instance=Readonly<{instanceId:string;characterId:number;depth:number;generation:number;role:'title'|'expression'|'graph-label';text:string;sourceRunIds:readonly string[];visibleRanges:Ranges}>;
type Path=Readonly<{d:string;fill:string;stroke:string;fillRule:string;strokeWidth:number;lineCap:string;lineJoin:string}>;
type OriginalAudio=Readonly<{
 outcome:number;sourceInstanceId:string;frameDomain:string;parentLifetime:Readonly<{firstFrame:number;lastFrameExclusive:number}>;
 parentEntryFrame:number;childEntryFrame:number;childStopFrame:number;source:string;sha256:string;
 language:'en';spokenLanguage:'undetermined';firstFrame:number;lastFrame:number;
}>;
export interface TitleCollageConfig {
 readonly animationId:string;readonly placementId:string;readonly kind:'introduction'|'final-title';readonly sourceSwfSha256:string;
 readonly frameDomain:string;readonly rootFrame:number;readonly frameCount:number;readonly fps:number;
 readonly expressionsAriaLabel?:string;
 readonly title:Readonly<{text:string;characters:readonly number[];sourceRunIds:readonly string[]}>;
 readonly instances:readonly Instance[];
 readonly graph:Readonly<{modernVisible:boolean;visibleRanges:Ranges;viewBox:readonly number[];shapes:readonly Readonly<{characterId:number;matrix:readonly number[];paths:readonly Path[]}>[];labels:readonly (Instance&Readonly<{anchor:Readonly<{x:number;y:number}>}>)[]}>;
 readonly contextDisposition:readonly Readonly<{characterId:number;sourceRunIds:readonly string[];text:string;reason:string}>[];
 readonly originalAudio:readonly OriginalAudio[];
}
const within=(frame:number,ranges:Ranges)=>ranges.some(([first,last])=>first<=frame&&frame<=last);
const nativeText=(text:string)=>text.replaceAll('–','−').trim();
const included=(c:TitleCollageConfig)=>c.instances.filter(i=>i.role!=='title'&&(i.role!=='graph-label'||c.graph.modernVisible));
const activityId=(outcome:number,frame:number)=>`title-collage-original-${outcome}-at-${frame}`;
/** React may first observe a source frame after the authored entry. Catch up
 * through the same parent/child frame relation; never restart the stream at 0. */
export function titleCollageActivities(c:TitleCollageConfig):readonly LessonTextActivityDefinition[] {
 return c.originalAudio.flatMap(a=>Array.from({length:Math.max(0,Math.min(c.frameCount,a.parentEntryFrame+a.childStopFrame-a.childEntryFrame)-a.parentEntryFrame+1)},(_,n)=>{
  const parentFrame=a.parentEntryFrame+n;
  return{id:activityId(a.outcome,parentFrame),sourceInstanceId:a.sourceInstanceId,frameDomain:a.frameDomain,parentLifetime:a.parentLifetime,
   parentFrames:[parentFrame],startFrame:a.childEntryFrame+n,endFrame:a.childStopFrame,fps:c.fps,
   audio:{source:a.source,sha256:a.sha256,language:a.language,spokenLanguage:a.spokenLanguage,firstFrame:a.firstFrame,lastFrame:a.lastFrame}};
 }));
}
export function titleCollageAudioRequest(c:TitleCollageConfig,frame:number,seed:number) {
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(frame))return undefined;
 const audio=c.originalAudio.find(a=>a.outcome===seed%2);
 if(!audio||frame<audio.parentEntryFrame||frame>Math.min(c.frameCount,audio.parentEntryFrame+audio.childStopFrame-audio.childEntryFrame))return undefined;
 return{id:activityId(audio.outcome,frame),parentFrame:frame};
}
export function titleCollageBinding(c:TitleCollageConfig):LessonTextBinding {
 return{schemaVersion:1,version:c.placementId+'-native-title-collage-v1',placementId:c.placementId,animationId:c.animationId,sourceSwfSha256:c.sourceSwfSha256,template:c.graph.modernVisible?'complex-figure':'explanation',blocks:[
  {id:'title',sourceTextIds:[...c.title.sourceRunIds],role:'title',language:'en',readingOrder:0,valueSource:'source-static'},
  ...included(c).map((i,n)=>{
   const path=[{timelineId:c.frameDomain,depth:i.depth,generation:i.generation,characterId:i.characterId}];
   return{id:i.instanceId,sourceTextIds:[...i.sourceRunIds],...(i.role==='graph-label'?{sourceShapeIds:c.graph.shapes.map(s=>s.characterId)}:{}),role:'label' as const,language:'en' as const,readingOrder:n+1,valueSource:'source-static' as const,instance:{id:lessonTextInstanceId(path),path}};
  }),
 ]};
}
export function titleCollageSnapshot(c:TitleCollageConfig,state:SourceStaticCanvasFrameState,r:RuntimeContext):TextPresentationSnapshot {
 const blockers:string[]=[],binding=titleCollageBinding(c);
 if(state.animationId!==c.animationId||state.sourceSwfSha256!==c.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==c.frameDomain||(r.frameDomain??c.frameDomain)!==c.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==c.rootFrame||(r.rootFrame??c.rootFrame)!==c.rootFrame)blockers.push('root-frame-mismatch');
 if(state.scenario!=='source-static-frame'||r.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||r.lang!=='en')blockers.push('source-language-mismatch');
 if(!Number.isInteger(r.frame)||r.frame<1||r.frame>c.frameCount||state.frame!==r.frame)blockers.push('source-frame-mismatch');
 if(!Number.isInteger(r.seed)||r.seed<0||r.seed>0xffffffff||state.seed!==r.seed)blockers.push('source-seed-mismatch');
 if(r.entryStateSha256||state.entryStateSha256)blockers.push('captured-entry-state-not-supported');
 if(r.replay!==undefined&&(!Number.isInteger(r.replay)||r.replay<0))blockers.push('invalid-replay');
 const values=new Map(included(c).map(i=>[i.instanceId,{text:nativeText(i.text),visible:within(state.frame,i.visibleRanges)}]));
 values.set('title',{text:c.title.text,visible:c.instances.some(i=>i.role==='title'&&within(state.frame,i.visibleRanges))});
 return{schemaVersion:1,animationId:c.animationId,bindingVersion:binding.version,sourceSwfSha256:c.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:r.replay??0},suppressedInstances:[],blocks:blockers.length?[]:binding.blocks.map(b=>({id:b.id,...values.get(b.id)!,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}
const CSS=`
.title-collage{box-sizing:border-box;display:grid;gap:1rem;min-inline-size:0;max-inline-size:70rem;margin-inline:auto;color:#14213d;font-family:var(--lesson-font-body,system-ui,sans-serif)}
.title-collage h2{margin:0;overflow-wrap:normal;word-break:normal;hyphens:none}
.title-collage__expressions{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;min-inline-size:0;min-block-size:3rem}
.title-collage__expression{box-sizing:border-box;display:block;max-inline-size:100%;font-size:1.125rem;font-weight:700;line-height:1.4;padding:.375rem .5rem;border:1px solid #8793a5;border-radius:.5rem;background:#fff;white-space:nowrap}
[data-modern-text-page="course-g04-l08-fq-001"] .title-collage__expression,
[data-modern-text-page="course-g04-l09-fq-001"] .title-collage__expression{white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none}
.title-collage__port{overflow:auto;min-inline-size:0;max-inline-size:100%;border:1px solid #8793a5;border-radius:.5rem;background:#fff;overscroll-behavior-inline:contain}
.title-collage__port:focus-visible{outline:3px solid #155ac1;outline-offset:-3px}
.title-collage__graph{display:block;inline-size:48rem;max-inline-size:none;block-size:auto}
.title-collage__graph text{font-family:var(--lesson-font-body,system-ui,sans-serif);fill:#14213d;font-weight:700}
.title-collage__values{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;margin:0;padding-inline-start:1.5rem;font-size:1.125rem;line-height:1.6}
.title-collage--final{padding:1.5rem;border-radius:1rem;background:#e8f3ff;text-align:center;min-block-size:18rem;align-content:center;gap:1.5rem}
@media(max-width:680px){.title-collage__expressions{gap:.25rem}.title-collage__expression{padding:.125rem .25rem}.title-collage--final{padding:.5rem}}
@media(max-width:360px){[data-modern-text-page="course-g04-l09-ir-001"] .title-collage__expression{padding-inline:.0625rem}}
/* Reuse the course's enlarged-title gutters without shrinking the rem scale. */
@media(max-width:480px){
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .title-collage){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .title-collage)>.lesson-shell2__stage{padding-inline:2px}
}
`;
export function TitleCollageScene({c,snapshot,frame,seed,replay}:{c:TitleCollageConfig;snapshot:TextPresentationSnapshot;frame:number;seed:number;replay:number}) {
 const blocks=new Map(snapshot.blocks.map(b=>[b.id,b])),expressions=c.instances.filter(i=>i.role==='expression'&&blocks.get(i.instanceId)?.visible),graph=c.graph.modernVisible&&within(frame,c.graph.visibleRanges),vb=c.graph.viewBox;
 return <section className={'lesson-text-presentation title-collage'+(c.kind==='final-title'?' title-collage--final':'')} lang="en" data-modern-text-page={c.animationId} data-lesson-text-status="ready" data-lesson-frame={frame} data-lesson-seed={seed} data-lesson-replay={replay}>
  <style>{CSS}</style>
  {blocks.get('title')?.visible&&<h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="title">{blocks.get('title')!.text}</h2>}
  <div className="title-collage__expressions" role={expressions.length?'group':undefined} aria-label={expressions.length?(c.expressionsAriaLabel??'Addition and subtraction expressions'):undefined}>{expressions.map(i=><span key={i.instanceId} className="title-collage__expression" data-lesson-text-block={i.instanceId} data-source-instance={i.instanceId} data-source-character={i.characterId}>{blocks.get(i.instanceId)!.text}</span>)}</div>
  {graph&&<>
   <div className="title-collage__port" role="region" aria-label="Line graph. Scroll to explore." tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowRight'?1:-1)*44;}}>
    <svg className="title-collage__graph" viewBox={vb.join(' ')} role="img" aria-label="Line graph with five values in source order" focusable="false">
     {c.graph.shapes.map(s=><g key={s.characterId} data-source-shape={s.characterId} transform={'matrix('+s.matrix.join(' ')+')'}>{s.paths.map((p,n)=><path key={n} d={p.d} fill={p.fill} stroke={p.stroke} fillRule={p.fillRule as 'evenodd'|'nonzero'} strokeWidth={p.strokeWidth} strokeLinecap={p.lineCap as 'round'|'butt'|'square'} strokeLinejoin={p.lineJoin as 'round'|'miter'|'bevel'}/>)}</g>)}
     {c.graph.labels.map(l=><text key={l.instanceId} data-lesson-text-block={l.instanceId} data-source-character={l.characterId} x={l.anchor.x} y={l.anchor.y} fontSize={vb[2]*18/768} textAnchor="middle" dominantBaseline="central">{nativeText(l.text)}</text>)}
    </svg>
   </div>
   <ol className="title-collage__values" aria-label="Graph values from left to right">{c.graph.labels.map(l=><li key={l.instanceId}>{nativeText(l.text)}</li>)}</ol>
  </>}
 </section>;
}
export function createTitleCollagePresentation(c:TitleCollageConfig,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState):LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
 const activities=titleCollageActivities(c);
 function Session({props,state,snapshot}:{props:AnimationRendererProps;state:SourceStaticCanvasFrameState;snapshot:TextPresentationSnapshot}) {
  const started=useRef(false);
  useEffect(()=>{
   if(started.current||snapshot.status!=='ready'||props.paused||props.reducedMotion)return;
   const request=titleCollageAudioRequest(c,state.frame,state.seed);
   if(request&&props.onLessonActivityRequest?.(request)===true)started.current=true;
  },[snapshot.status,state.frame,state.seed,props.paused,props.reducedMotion,props.onLessonActivityRequest]);
  if(snapshot.status!=='ready')return <p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
  return <TitleCollageScene c={c} snapshot={snapshot} frame={state.frame} seed={state.seed} replay={props.replay??0}/>;
 }
 function Renderer(props:AnimationRendererProps) {
  const context={...props,frameDomain:props.frameDomain??c.frameDomain,rootFrame:props.rootFrame??c.rootFrame},state=(props.state??getFrameState(props.frame,context))as SourceStaticCanvasFrameState,snapshot=titleCollageSnapshot(c,state,context);
  // The host additionally remounts on seekRevision. A seed/Replay change also
  // resets this local guard when the renderer is used outside that host.
  return <Session key={`${props.seed}:${props.replay??0}:${context.frameDomain}:${props.lang}:${props.scenario}`} props={props} state={state} snapshot={snapshot}/>;
 }
 return{schemaVersion:1,binding:titleCollageBinding(c),Renderer,getSnapshot:(state,r)=>titleCollageSnapshot(c,state,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.frameCount},reducedMotionFrameByDomain:{[c.frameDomain]:c.frameCount},
  ...(activities.length?{frameControl:{frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:[]},activityTimelines:activities}:{})};
}
