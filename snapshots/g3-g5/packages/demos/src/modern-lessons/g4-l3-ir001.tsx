'use client';

import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L03Ir001341242ccFrameState} from '../modules/course-g04-l03-ir-001-341242cc';
import {G4_L3_IR001_SOURCE_DATA as SOURCE} from './generated/g4-l3-ir001-source';

const ID='course-g04-l03-ir-001-341242cc',VERSION='g04-l03-placement-001-native-introduction-v1';
const within=(frame:number,ranges:readonly (readonly number[])[])=>ranges.some(([first,last])=>frame>=first&&frame<=last);
const numeric=SOURCE.instances.filter(i=>i.role!=='title');
const text=(value:string)=>value.replace(/^–\s*/,'−').trim();
const titleVisible=(frame:number)=>SOURCE.instances.some(i=>i.role==='title'&&within(frame,i.visibleRanges));
export const G4_L3_IR001_TEXT_BINDING:LessonTextBinding=Object.freeze<LessonTextBinding>({schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-001',animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',blocks:[
 {id:'title',sourceTextIds:[...SOURCE.title.sourceRunIds],role:'title',language:'en',readingOrder:0,valueSource:'source-static'},
 ...numeric.map((i,index)=>({id:i.instanceId,sourceTextIds:[...i.sourceRunIds],...(i.role==='graph-label'?{sourceShapeIds:[18,19,20]}:{}),role:'label' as const,language:'en' as const,readingOrder:index+1,valueSource:'source-static' as const,
  instance:{id:i.instanceId,path:[{timelineId:SOURCE.frameDomain,depth:i.depth,generation:Number(i.instanceId.match(/generation-(\d+)$/)![1]),characterId:i.characterId}]}})),
]});

/** Source alpha determines membership, not modern text contrast. All geometry and
 * text consume this same host frame; no local clock or source Canvas is mounted. */
export function getG4L3Ir001TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==ID||state.sourceSwfSha256!==SOURCE.sourceSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==SOURCE.frameDomain||(context.frameDomain??SOURCE.frameDomain)!==SOURCE.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==SOURCE.rootFrame||(context.rootFrame??SOURCE.rootFrame)!==SOURCE.rootFrame)blockers.push('root-frame-mismatch');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('source-language-mismatch');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>SOURCE.frameCount||state.frame!==context.frame)blockers.push('source-frame-mismatch');
 if(!Number.isInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed)blockers.push('source-seed-mismatch');
 if(context.entryStateSha256||state.entryStateSha256)blockers.push('captured-entry-state-not-supported');
 if(context.replay!==undefined&&(!Number.isInteger(context.replay)||context.replay<0))blockers.push('invalid-replay');
 const values=new Map<string,{text:string;visible:boolean}>(numeric.map(i=>[i.instanceId,{text:text(i.text),visible:within(state.frame,i.visibleRanges)}]));
 values.set('title',{text:SOURCE.title.text.trim(),visible:titleVisible(state.frame)});
 return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE.sourceSha256,status:blockers.length?'blocked':'ready',blockers,
 identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},
 suppressedInstances:[],blocks:blockers.length?[]:G4_L3_IR001_TEXT_BINDING.blocks.map(b=>({id:b.id,...values.get(b.id)!,role:b.role,language:b.language,readingOrder:b.readingOrder}))};
}

const CSS=`
.ir001-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#14213d;max-inline-size:70rem;min-inline-size:0;margin-inline:auto;display:grid;gap:1.5rem}
.ir001-modern h2{font-family:var(--lesson-font-display,var(--lesson-font-body,system-ui));font-size:2rem;line-height:1.25;margin:0;overflow-wrap:anywhere}
.ir001-modern__numbers{display:flex;flex-wrap:wrap;gap:1rem;min-block-size:4rem;align-items:center;justify-content:center}
.ir001-modern__number{display:block;font-size:1.5rem;line-height:1.3;font-weight:700;padding:.6rem 1rem;background:#fff;border:1px solid #8793a5;border-radius:.5rem;white-space:nowrap}
.ir001-modern__graph-viewport{overflow:auto;max-inline-size:100%;min-inline-size:0;border:1px solid #8793a5;border-radius:.75rem;background:#fff;overscroll-behavior-inline:contain}
.ir001-modern__graph-viewport:focus-visible{outline:3px solid #155ac1;outline-offset:-3px}
.ir001-modern__graph{display:block;inline-size:48rem;max-inline-size:none;block-size:auto}
.ir001-modern__graph text{font-family:var(--lesson-font-body,system-ui,sans-serif);fill:#14213d;font-weight:700}
.ir001-modern__values{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem;padding-inline-start:1.5rem;margin:0;font-size:1.125rem;line-height:1.6}
/* Keep source-timed number groups readable beside the narrow-screen heading. */
@media(max-width:680px){
 .ir001-modern{gap:.5rem}
 .ir001-modern h2{font-size:1.75rem}
 .ir001-modern__numbers{gap:.25rem;min-block-size:0}
 .ir001-modern__number{padding:.125rem}
}
`;

export function G4L3Ir001ModernRenderer(props:AnimationRendererProps){
 const context={...props,frameDomain:props.frameDomain??SOURCE.frameDomain,rootFrame:props.rootFrame??SOURCE.rootFrame};
 const state=(props.state??getCourseG04L03Ir001341242ccFrameState(props.frame,context)) as SourceStaticCanvasFrameState;
 const snapshot=getG4L3Ir001TextSnapshot(state,context);
 if(snapshot.status!=='ready')return <p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
 const blocks=new Map(snapshot.blocks.map(b=>[b.id,b])),negatives=SOURCE.instances.filter(i=>i.role==='negative'&&blocks.get(i.instanceId)?.visible);
 const graph=within(state.frame,SOURCE.graph.visibleRanges),viewBox=SOURCE.graph.viewBox;
 // A 48rem local viewport keeps these native SVG labels at 18px for root16 and
 // 36px for root32, independently of the host's 800x600 source stage scaling.
 const labelSize=viewBox[2]*18/768;
 return <section className="ir001-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status="ready" data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={props.replay??0}>
  <style>{CSS}</style>
  {blocks.get('title')?.visible&&<h2 data-lesson-text-block="title">{blocks.get('title')!.text}</h2>}
  <div className="ir001-modern__numbers" role={negatives.length?'group':undefined} aria-label={negatives.length?'Negative numbers':undefined}>{negatives.map(i=><span key={i.instanceId} className="ir001-modern__number" data-lesson-text-block={i.instanceId} data-source-instance={i.instanceId} data-source-character={i.characterId}>{blocks.get(i.instanceId)!.text}</span>)}</div>
  {graph&&<>
   <div className="ir001-modern__graph-viewport" role="region" tabIndex={0} aria-label="Line graph. Scroll to explore.">
    <svg className="ir001-modern__graph" viewBox={viewBox.join(' ')} role="img" aria-label="Line graph with five values in source order" focusable="false">
     {SOURCE.graph.shapes.map(shape=><g key={shape.characterId} data-source-shape={shape.characterId} transform={`matrix(${shape.matrix.join(' ')})`}>{shape.paths.map((p,index)=><path key={index} d={p.d} fill={p.fill??'none'} fillRule={p.fillRule as 'evenodd'|'nonzero'|undefined} stroke={p.stroke??'none'} strokeWidth={p.strokeWidth} strokeLinecap={p.lineCap as 'round'|'butt'|'square'|undefined} strokeLinejoin={p.lineJoin as 'round'|'miter'|'bevel'|undefined}/>)}</g>)}
     {SOURCE.graph.labels.map(label=><text key={label.instanceId} data-lesson-text-block={label.instanceId} data-source-character={label.characterId} x={label.anchor.x} y={label.anchor.y} fontSize={labelSize} textAnchor="middle" dominantBaseline="central">{text(label.text)}</text>)}
    </svg>
   </div>
   <ol className="ir001-modern__values" aria-label="Graph values from left to right">{SOURCE.graph.labels.map(label=><li key={label.instanceId}>{text(label.text)}</li>)}</ol>
  </>}
 </section>;
}

export const G4_L3_IR001_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>=Object.freeze({schemaVersion:1,binding:G4_L3_IR001_TEXT_BINDING,Renderer:G4L3Ir001ModernRenderer,getSnapshot:getG4L3Ir001TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-27':136},reducedMotionFrameByDomain:{'sprite-27':136},
});
