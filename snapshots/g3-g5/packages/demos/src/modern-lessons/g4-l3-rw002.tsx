"use client";

import React, {useId} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import {createSourceStaticCanvasCandidate,type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {COURSE_G04_L03_RW_002_CONFIG} from '../timelines/course-g04-l03-rw-002';
import {createCourseG04L03SourceGlossaryOpenResult,type CourseG04L03SourceGlossaryConfig} from '../timelines/course-g04-l03-source-glossary-interaction';
// The runtime retains full-audit references and uses exact source bitmap assets.
// Candidate registration and source preparation do not establish admission.
import {G4_L3_RW002_SOURCE_DATA as GENERATED,rw002InstancesAtFrame} from './generated/g4-l3-rw002-source';
import {Rw002ShapePaints,interpolateRw002Path,rw002CssColor,type Rw002Shape,type Rw002Bitmap,type Rw002Matrix,type Rw002ColorTransform} from './g4-l3-rw002-source-paints';

type Bounds={readonly left:number;readonly right:number;readonly top:number;readonly bottom:number};
type TextRun={readonly sourceTextId:string;readonly text:string;readonly colorRgba:readonly number[];readonly yOffsetTwips:number;readonly xOffsetTwips:number|null;readonly fontHeightTwips:number};
type SourceText={readonly characterId:number;readonly sourceRunIds:readonly string[];readonly sourceTagSha256:string;readonly text:string;readonly boundsTwips:Bounds;readonly textMatrix:Rw002Matrix;readonly runs:readonly TextRun[];readonly role:string;readonly nativeReadableRequired:boolean};
export type Rw002Placement={readonly instanceId:string;readonly characterId:number;readonly depth:number;readonly matrix:Rw002Matrix;readonly colorTransform:Rw002ColorTransform;readonly sourceAlpha:number;readonly ratio:number;readonly clipDepth:number|null;readonly maskInstanceIds:readonly string[]};
type SourceInstance={readonly instanceId:string;readonly timelineId:string;readonly characterId:number;readonly depth:number;readonly generation:number;readonly firstFrame:number;readonly lastFrameExclusive:number;readonly positiveAlphaRanges:readonly (readonly number[])[]};
type SourceTerm={readonly buttonId:number;readonly id:string;readonly sourceKeyAttribute:string;readonly entryIds:Readonly<Record<'en'|'es',string>>;readonly sourceInstanceId:string;readonly sourceDepth:number;readonly sourceMatrix:Rw002Matrix;readonly sourceMaskInstanceIds:readonly string[];readonly sourceHitShapeId:number};
type SourceData={readonly sourceSha256:string;readonly frameDomain:string;readonly frameCount:number;readonly rootFrame:number;readonly fps:number;readonly rootMatrix:Rw002Matrix;readonly stage:{readonly width:number;readonly height:number};readonly texts:readonly SourceText[];readonly shapes:readonly Rw002Shape[];readonly bitmaps:readonly Rw002Bitmap[];readonly instances:readonly SourceInstance[];readonly rootTitles:readonly (SourceText & {readonly instanceId:string;readonly timelineId:string;readonly sourceStageMatrix:Rw002Matrix;readonly sourceStageBoundsPx:Bounds})[];readonly signedLinePairings:readonly {readonly value:number;readonly digitInstanceId:string;readonly minusInstanceId:string|null}[];readonly minusGlyphInk:{readonly inkCharacterBoundsTwips:Bounds};readonly glossary:{readonly firstFrame:number;readonly lastFrame:number;readonly terms:readonly SourceTerm[]};readonly table:{readonly sourceUnit:string;readonly rows:readonly {readonly state:string;readonly stateCharacter:number;readonly highest:number;readonly highestCharacter:number;readonly lowest:number;readonly lowestCharacter:number}[]};readonly allOriginalRisksResolved:false};
const SOURCE=GENERATED as unknown as SourceData;
const ID='course-g04-l03-rw-002',VERSION='g04-l03-placement-002-native-world-v1';
const TEXTS=new Map(SOURCE.texts.map(t=>[t.characterId,t]));
const SHAPES=new Map(SOURCE.shapes.map(s=>[s.characterId,s]));
const BITMAPS=new Map(SOURCE.bitmaps.map(b=>[b.characterId,b]));
const TEXT_INSTANCES=SOURCE.instances.filter(i=>TEXTS.has(i.characterId));
const STATE=createSourceStaticCanvasCandidate(COURSE_G04_L03_RW_002_CONFIG);
export const getRw002NativeFrameState=STATE.getFrameState;
const point=(m:Rw002Matrix,x:number,y:number)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
const instancePath=(i:SourceInstance)=>({id:i.instanceId,path:[{timelineId:i.timelineId,depth:i.depth,generation:i.generation,characterId:i.characterId}]});
const nativeCopy=(t:SourceText)=>t.characterId===400?'−':t.text;
export const RW002_NATIVE_DISPOSITIONS={
 sourceFrameDomain:'sprite-421',mainFrameCount:1289,rootFrame:6,companionFrame:1,
 independentMinusCharacter:400,independentFinalMinusCount:8,signTransfer:false,
 nativeMinusDisposition:'Each 400 becomes one Unicode minus at its own source glyph-ink anchor; its digit, alpha, matrix, lifetime and masks remain separate. Complete signed temperature strings105..109/123 stay source-exact.',
 offstageMetadata:[365,422],visibleCompanionTitle:424,tableUnit:'°F',captionActors:[91,92],
 glossaryHitShape:376,glossaryButtons:[377,378,379],glossaryDepths:[101,103,105],
 displayListClip:'Direct path children; source evenodd silhouettes; source depth intervals preserved.',
 internalPaintClip:'Source bitmap/radial-overlay ctx.clip() remains nonzero; direct linear fill has no internal clip.',
 originalMorphFidelityEstablished:false,originalGradientBitmapSamplingEstablished:false,originalMaskRuntimeEstablished:false,
 originalGlossaryScopeResolved:false,originalCloseAutoResumeEstablished:false,SpanishPageTranslationEstablished:false,
 audioImplementationEstablished:false,listeningAccepted:false,humanAccepted:false,OwnerAccepted:false,strictComplete:false,publication:false,
} as const;
export const G4_L3_RW002_TEXT_BINDING:LessonTextBinding={schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-002',animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',blocks:[
 ...TEXT_INSTANCES.map((i,n)=>({id:i.instanceId,sourceTextIds:[...TEXTS.get(i.characterId)!.sourceRunIds],role:i.characterId===424?'title' as const:i.characterId===422?'heading' as const:i.characterId===375?'body' as const:'label' as const,language:'en' as const,readingOrder:n+1,valueSource:'maintained-page-state' as const,instance:instancePath(i)})),
 ...SOURCE.texts.filter(t=>!TEXT_INSTANCES.some(i=>i.characterId===t.characterId)).map((t,n)=>({id:'definition-'+t.characterId,sourceTextIds:[...t.sourceRunIds],role:'label' as const,language:'en' as const,readingOrder:TEXT_INSTANCES.length+n+1,valueSource:'source-static' as const})),
 {id:'figure-description',sourceTextIds:[],sourceShapeIds:SOURCE.shapes.map(s=>s.characterId),sourceBitmapIds:SOURCE.bitmaps.map(b=>b.characterId),role:'body',language:'en',readingOrder:0,valueSource:'maintained-page-state'},
]};
export function getRw002NativeScene(frame:number):readonly Rw002Placement[]{return rw002InstancesAtFrame(frame);}
const alpha=(p:Rw002Placement)=>{
 if(p.colorTransform.divisor!==256||p.colorTransform.add[3]!==0||p.sourceAlpha!==p.colorTransform.multiply[3]/256||p.sourceAlpha<0||p.sourceAlpha>1)throw new Error('RW002 actor alpha contract changed');
 return p.sourceAlpha;
};
const masksFor=(nodes:readonly Rw002Placement[],p:Rw002Placement)=>nodes.filter(m=>m.clipDepth!==null&&m.depth<p.depth&&p.depth<=m.clipDepth);
function clipped(children:React.ReactNode,masks:readonly Rw002Placement[],prefix:string){return masks.reduceRight<React.ReactNode>((n,m)=><g key={m.instanceId} clipPath={'url(#'+prefix+'-mask-'+m.depth+')'}>{n}</g>,children);}
/** These three own source hit/mask symbols are single closed rectangles.
 * Reject a changed silhouette instead of treating any path bounds as a mask. */
function sourceRectangle(characterId:number,m:Rw002Matrix):Bounds {
 const s=SHAPES.get(characterId);if(!s||s.paths.length!==1||s.paths[0].morph||/[QZ]/.test(s.paths[0].d)||m[1]!==0||m[2]!==0||m[0]<=0||m[3]<=0)throw new Error('RW002 rectangular source hit contract changed');
 const d=s.paths[0].d,values=d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);if(values.length!==10)throw new Error('RW002 hit/mask path is not its retained rectangle');
 const pts=Array.from({length:5},(_,k)=>[values[k*2],values[k*2+1]]),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 if(pts[0].join()!==pts[4].join()||new Set(pts.slice(0,4).map(p=>p.join())).size!==4||new Set(xs).size!==2||new Set(ys).size!==2)throw new Error('RW002 hit/mask rectangle topology changed');
 const a=point(m,Math.min(...xs),Math.min(...ys)),b=point(m,Math.max(...xs),Math.max(...ys));return {left:a.x,right:b.x,top:a.y,bottom:b.y};
}
export function rw002SourceHitIntersection(nodes:readonly Rw002Placement[],term:SourceTerm):Bounds|null {
 const actor=nodes.find(p=>p.instanceId===term.sourceInstanceId&&p.characterId===term.buttonId&&p.depth===term.sourceDepth);if(!actor||alpha(actor)<=0)return null;
 let r=sourceRectangle(term.sourceHitShapeId,actor.matrix);
 const masks=masksFor(nodes,actor);
 if(masks.map(m=>m.instanceId).join('|')!==term.sourceMaskInstanceIds.join('|'))throw new Error('RW002 glossary mask ownership changed');
 for(const mask of masks){const b=sourceRectangle(mask.characterId,mask.matrix);r={left:Math.max(r.left,b.left),right:Math.min(r.right,b.right),top:Math.max(r.top,b.top),bottom:Math.min(r.bottom,b.bottom)};}
 return r.right>r.left&&r.bottom>r.top?r:null;
}
const HIT_BOUNDS=sourceRectangle(376,[1,0,0,1,0,0]);
export const RW002_GLOSSARY_CONFIG:CourseG04L03SourceGlossaryConfig={animationId:ID,frameDomain:'sprite-421',sourceAction:'DoHyperLinks',sourceStopTarget:'_root.animation_mc.animation.stop()',glossaryAuthority:'grade-wide-shell-keyterms-static-candidate',glossarySourceDisposition:'unresolved-lesson-vs-grade-wide',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume',terms:SOURCE.glossary.terms.map(t=>({id:t.id,keyAttribute:t.sourceKeyAttribute,characterId:t.buttonId,firstFrame:SOURCE.glossary.firstFrame,lastFrame:SOURCE.glossary.lastFrame,depth:t.sourceDepth,sourceBounds:HIT_BOUNDS,entryIds:t.entryIds,labels:{en:t.sourceKeyAttribute,es:t.sourceKeyAttribute}}))};
export function createRw002GlossaryRequest(frame:number,termId:string){
 if(!Number.isInteger(frame)||frame<1||frame>1289)return null;
 const term=SOURCE.glossary.terms.find(t=>t.id===termId);if(!term||!rw002SourceHitIntersection(getRw002NativeScene(frame),term))return null;
 return createCourseG04L03SourceGlossaryOpenResult({config:RW002_GLOSSARY_CONFIG,frame,lang:'en',termId});
}
export function getRw002FigureDescription(frame:number){
 const nodes=getRw002NativeScene(frame),ids=new Set(nodes.filter(p=>alpha(p)>0).map(p=>p.instanceId)),parts=['Negative numbers: your world.'];
 const table=nodes.filter(p=>alpha(p)>0&&p.characterId>=90&&p.characterId<=109);
 if(table.length){parts.push('Extreme temperatures in the United States. Recorded temperatures are in degrees Fahrenheit.');for(const r of SOURCE.table.rows)if(table.some(p=>p.characterId===r.stateCharacter)){const values:string[]=[];if(table.some(p=>p.characterId===r.highestCharacter))values.push('highest '+r.highest+' degrees Fahrenheit');if(table.some(p=>p.characterId===r.lowestCharacter))values.push('lowest '+r.lowest+' degrees Fahrenheit');if(values.length)parts.push(r.state+': '+values.join('; ')+'.');}}
 const pairs=SOURCE.signedLinePairings.filter(p=>ids.has(p.digitInstanceId));
 if(pairs.length)parts.push('Source number-line values: '+pairs.map(p=>p.value<0&&(!p.minusInstanceId||!ids.has(p.minusInstanceId))?Math.abs(p.value):p.value).join(', ')+'.');
 const explanation=nodes.find(p=>p.characterId===375&&alpha(p)>0);if(explanation)parts.push(TEXTS.get(375)!.text+'.');
 return parts.join(' ');
}
export function getRw002TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==ID||state.sourceSwfSha256!==SOURCE.sourceSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!=='sprite-421'||(context.frameDomain??'sprite-421')!=='sprite-421')blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==6||(context.rootFrame??6)!==6)blockers.push('root-frame-mismatch');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('English-source-visuals-only');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>1289||state.frame!==context.frame)blockers.push('source-frame-mismatch');
 if(!Number.isInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed)blockers.push('source-seed-mismatch');
 if(context.replay!==undefined&&(!Number.isInteger(context.replay)||context.replay<0))blockers.push('invalid-replay');
 if(context.entryStateSha256)blockers.push('captured-entry-state-not-supported');
 const values=new Map<string,{text:string;visible:boolean}>();
 if(!blockers.length){const live=new Set(getRw002NativeScene(state.frame).filter(p=>alpha(p)>0).map(p=>p.instanceId));for(const i of TEXT_INSTANCES){const t=TEXTS.get(i.characterId)!;values.set(i.instanceId,{text:nativeCopy(t),visible:t.nativeReadableRequired&&(i.characterId===424||i.timelineId==='sprite-421'&&live.has(i.instanceId))});}for(const t of SOURCE.texts)values.set('definition-'+t.characterId,{text:nativeCopy(t),visible:false});values.set('figure-description',{text:getRw002FigureDescription(state.frame),visible:true});}
 return {schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE.sourceSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:G4_L3_RW002_TEXT_BINDING.blocks.map(b=>({...b,...values.get(b.id)!}))};
}
// Modern native glyphs live on one rem-sized scroll plane. Source matrices
// position/direction and mask reveal stay exact; font fit awaits real browser.
const PLANE_REM=100,GLYPH_REM=1.125;
export function rw002NativeTextAnchor(p:Rw002Placement,t:SourceText){
 const negative=SOURCE.signedLinePairings.some(pair=>pair.value<0&&pair.digitInstanceId===p.instanceId),multiline=new Set(t.runs.map(r=>r.yOffsetTwips)).size>1;
 const b=t.characterId===400?SOURCE.minusGlyphInk.inkCharacterBoundsTwips:t.boundsTwips;
 const x=t.characterId===400?b.right:negative||multiline?b.left:(b.left+b.right)/2,y=(b.top+b.bottom)/2;
 const local=point(p.matrix,x,y),global=point(SOURCE.rootMatrix,local.x,local.y);
 return {x:global.x/20,y:global.y/20,align:t.characterId===400?'end' as const:negative||multiline?'start' as const:'middle' as const,angle:Math.atan2(p.matrix[1],p.matrix[0])*180/Math.PI};
}
function SourceTextPaint({actor,definition}:{actor:Rw002Placement;definition:SourceText}){
 const a=rw002NativeTextAnchor(actor,definition),baselines=definition.runs.map(r=>r.yOffsetTwips);
 if(!baselines.every(Number.isFinite))throw new Error('RW002 resolved source run baseline missing');
 const multiline=new Set(baselines).size>1,meanBaseline=(Math.min(...baselines)+Math.max(...baselines))/2;
 if(multiline&&(actor.matrix[1]!==0||actor.matrix[2]!==0||definition.runs.some(r=>r.xOffsetTwips!==null&&r.xOffsetTwips!==0)))throw new Error('RW002 source multiline header placement changed');
 // Own94/95 have two left-aligned lines, baselines180/380 and an x reset0.
 // Their baked TextMatrix translation remains in bounds, never reapplied.
 // Own375 has three color runs at one baseline300 and continues inline.
 return <text x={a.x} y={a.y} textAnchor={a.align} dominantBaseline="central" transform={a.angle?'rotate('+a.angle+' '+a.x+' '+a.y+')':undefined} fontSize={SOURCE.stage.width/PLANE_REM*GLYPH_REM} className="rw002-label" opacity={alpha(actor)} data-lesson-text-block={actor.instanceId} data-source-character={actor.characterId} data-source-instance={actor.instanceId} data-source-matrix={actor.matrix.join(' ')} data-source-text-matrix={definition.textMatrix.join(' ')} data-source-color-transform={JSON.stringify(actor.colorTransform)} data-source-alpha={actor.sourceAlpha} data-native-glyph-rem={GLYPH_REM} data-native-minus-disposition={actor.characterId===400?'independent-source-ink-anchor':undefined}>
  {definition.runs.map(r=><tspan key={r.sourceTextId} data-source-run-id={r.sourceTextId} data-source-run-baseline-twips={r.yOffsetTwips} x={multiline?a.x:undefined} y={multiline?a.y+actor.matrix[3]*(r.yOffsetTwips-meanBaseline)/20:undefined} fill={rw002CssColor({kind:'static-rgba',rgba:[r.colorRgba[0],r.colorRgba[1],r.colorRgba[2],r.colorRgba[3]/255]},actor.ratio,actor.colorTransform)}>{actor.characterId===400?'−':r.text}</tspan>)}
 </text>;
}
function SourceDiagram({nodes,prefix,frame}:{nodes:readonly Rw002Placement[];prefix:string;frame:number}){
 const masks=nodes.filter(p=>p.clipDepth!==null),root=rw002InstancesAtFrame(6,'root');
 return <svg className="rw002-diagram" viewBox={'0 0 '+SOURCE.stage.width+' '+SOURCE.stage.height} role="img" aria-label={getRw002FigureDescription(frame)} focusable="false"><defs>
  {masks.map(m=><clipPath key={m.instanceId} id={prefix+'-mask-'+m.depth} clipPathUnits="userSpaceOnUse" data-source-mask={m.characterId} data-source-clip-depth={m.clipDepth!}>{SHAPES.get(m.characterId)!.paths.map((p,k)=><path key={k} d={interpolateRw002Path(p,m.ratio)} transform={'scale(.05) matrix('+SOURCE.rootMatrix.join(' ')+') matrix('+m.matrix.join(' ')+')'} fillRule={p.fillRule} clipRule={p.clipRule}/>)}</clipPath>)}
 </defs>{nodes.filter(p=>p.clipDepth===null&&alpha(p)>0).map(p=>{
  let paint:React.ReactNode=null;
  const shape=SHAPES.get(p.characterId),text=TEXTS.get(p.characterId);
  if(shape)paint=<g data-source-shape-id={p.characterId} data-source-instance={p.instanceId} data-source-shape-role={shape.role} data-source-depth={p.depth} data-source-matrix={p.matrix.join(' ')} data-source-ratio={p.ratio} data-source-alpha={p.sourceAlpha} data-source-color-transform={JSON.stringify(p.colorTransform)} opacity={alpha(p)} transform={'scale(.05) matrix('+SOURCE.rootMatrix.join(' ')+') matrix('+p.matrix.join(' ')+')'}><Rw002ShapePaints shape={shape} ratio={p.ratio} idPrefix={prefix+'-d'+p.depth} colorTransform={p.colorTransform} bitmaps={BITMAPS}/></g>;
  else if(text?.nativeReadableRequired)paint=<SourceTextPaint actor={p} definition={text}/>;
  else if(!text && !SOURCE.glossary.terms.some(t=>t.buttonId===p.characterId))throw new Error('Unprojected RW002 main source actor'+p.characterId);
  return paint?<React.Fragment key={p.instanceId}>{clipped(paint,masksFor(nodes,p),prefix)}</React.Fragment>:null;
 })}{root.filter(p=>SHAPES.has(p.characterId)&&alpha(p)>0).map(p=><g key={p.instanceId} data-source-root-shape={p.characterId} data-source-instance={p.instanceId} data-source-alpha={p.sourceAlpha} opacity={alpha(p)} transform={'scale(.05) matrix('+p.matrix.join(' ')+')'}><Rw002ShapePaints shape={SHAPES.get(p.characterId)!} ratio={p.ratio} idPrefix={prefix+'-root'+p.depth} colorTransform={p.colorTransform} bitmaps={BITMAPS}/></g>)}</svg>;
}
const CSS=`
.rw002-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);display:grid;gap:1rem;min-inline-size:0;max-inline-size:100rem;margin-inline:auto;color:#16364a}
.rw002-modern h2{font-family:var(--lesson-font-display,var(--lesson-font-body,system-ui,sans-serif));font-size:1.75rem;line-height:1.3;margin:0;padding:.5rem .75rem;background:rgb(54,107,231);color:rgb(255,255,255);border-radius:.35rem;overflow-wrap:anywhere}
.rw002-viewport{overflow:auto;max-inline-size:100%;max-block-size:min(38rem,75vh);border:1px solid #718399;border-radius:.75rem;background:#b8d8f7;overscroll-behavior:contain}
.rw002-diagram{display:block;inline-size:100rem;max-inline-size:none;block-size:auto}
.rw002-label{font-family:var(--lesson-font-body,system-ui,sans-serif);font-weight:700;font-variant-numeric:tabular-nums;white-space:pre;pointer-events:none}
.rw002-modern .rw002-term{font:inherit;font-size:1.125rem;font-weight:700;min-inline-size:44px;min-block-size:44px;padding:.3rem .65rem;color:#005a9c;background:white;border:1px solid #52738a;border-radius:.35rem;text-decoration:underline;text-underline-offset:.15em}
.rw002-terms{display:flex;flex-wrap:wrap;gap:.75rem;min-inline-size:0;align-items:center}
.rw002-term:focus-visible,.rw002-viewport:focus-visible{outline:3px solid #005a9c;outline-offset:-3px}
.rw002-scroll-help{font-size:1rem;line-height:1.5;margin:0;overflow-wrap:anywhere}
`;
export function G4L3Rw002ModernRenderer(props:AnimationRendererProps){
 const prefix='rw002-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),context={...props,frameDomain:props.frameDomain??'sprite-421',rootFrame:props.rootFrame??6};
 const state=(props.state??getRw002NativeFrameState(props.frame,context)) as SourceStaticCanvasFrameState,snapshot=getRw002TextSnapshot(state,context);
 if(snapshot.status!=='ready')return <p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
 const nodes=getRw002NativeScene(state.frame),ui=props.uiLanguage??props.lang,heading=SOURCE.rootTitles.find(t=>t.characterId===424)!;
 const terms=SOURCE.glossary.terms.filter(t=>createRw002GlossaryRequest(state.frame,t.id));
 return <section className="rw002-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status="ready" data-source-swf-sha256={SOURCE.sourceSha256} data-source-frame={state.frame} data-source-frame-domain={state.frameDomain} data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-lesson-replay={props.replay??0} data-source-language-policy={ui==='es'?'source-English-fallback':'source-English'}>
  <style>{CSS}</style><h2 data-source-character="424" data-lesson-text-block={heading.instanceId} data-source-instance={heading.instanceId} data-source-combined-matrix={heading.sourceStageMatrix.join(' ')}>{heading.text}</h2>
  <p className="rw002-scroll-help" lang={ui}>{ui==='es'?'Con la ilustración enfocada, usa las flechas para desplazarte.':'With the illustration focused, use the arrow keys to scroll.'}</p>
  <div className="rw002-viewport" role="region" tabIndex={0} aria-label={getRw002FigureDescription(state.frame)}><SourceDiagram nodes={nodes} prefix={prefix} frame={state.frame}/></div>
  {terms.length>0&&<div className="rw002-terms" role="group" aria-label="Source glossary terms">{terms.map(t=><button key={t.id} type="button" className="rw002-term" data-source-term-id={t.id} data-source-button-id={t.buttonId} data-source-instance={t.sourceInstanceId} data-source-depth={t.sourceDepth} data-source-hit-shape-id={t.sourceHitShapeId} data-source-hit-intersection={JSON.stringify(rw002SourceHitIntersection(nodes,t))} data-source-mask-instances={t.sourceMaskInstanceIds.join('|')} data-keyterm-entry-id={t.entryIds.en} disabled={!props.onLessonHostRequest} onClick={e=>{const result=createRw002GlossaryRequest(state.frame,t.id);if(result)props.onLessonHostRequest?.(result.request,{trigger:e.currentTarget});}}>{t.sourceKeyAttribute}</button>)}</div>}
 </section>;
}
export const G4_L3_RW002_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:G4_L3_RW002_TEXT_BINDING,Renderer:G4L3Rw002ModernRenderer,getSnapshot:getRw002TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-421':1289},reducedMotionFrameByDomain:{'sprite-421':1289},keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:SOURCE.glossary.terms.map(t=>t.entryIds.en)}};
