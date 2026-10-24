'use client';

import React, {useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {
  COURSE_G04_L03_IN_003_SOURCE,
  getCourseG04L03In003FrameState,
  normalizeCourseG04L03In003Frame,
  type CourseG04L03In003FrameState,
} from '../timelines/course-g04-l03-in-003';
import {G4_L3_IN003_SOURCE_DATA as SOURCE} from './g4-l3-in003-source.generated';

const ANIMATION_ID = 'course-g04-l03-in-003';
const DOMAIN = 'sprite-84';
const SCENARIO = 'source-static-frame';
const BINDING_VERSION = 'g04-l03-placement-014-modern-text-v1';
const GRAPH = Object.freeze({width:1056,height:210,originX:528,step:48,axisY:127,labelY:162,directionY:67,directionLabelY:33});
const NEGATIVE_INK = '#a82c45', POSITIVE_INK = '#164eaa', NEUTRAL_INK = '#14213d';
type Interval = readonly [number, number];
const inside = (frame:number, range:Interval) => frame >= range[0] && frame < range[1];
const during = (frame:number, ranges:readonly Interval[]) => ranges.some(range => inside(frame,range));
const signedText = (value:number) => value < 0 ? `−${-value}` : String(value);
const tickId = (value:number) => value === 0 ? 'tick-zero' : `tick-${value < 0 ? 'negative' : 'positive'}-${Math.abs(value)}`;
function alphaAt(frame:number, states:readonly (readonly [number,number])[]) {
  let value=0;for(const row of states){if(row[0]>frame)break;value=row[1];}return value;
}
const anchor = (value:number,y:number=GRAPH.labelY) => ({x:GRAPH.originX+value*GRAPH.step,y,stageWidth:GRAPH.width,stageHeight:GRAPH.height});

export const G4_L3_IN003_TEXT_BINDING = Object.freeze({
  schemaVersion:1,version:BINDING_VERSION,placementId:'g04-l03-placement-014',animationId:ANIMATION_ID,
  sourceSwfSha256:COURSE_G04_L03_IN_003_SOURCE.swfSha256,template:'complex-figure',
  blocks:[
    {id:'counting-value',sourceTextIds:[...new Set(SOURCE.counters.flatMap(row=>row.sourceTextIds))],sourceShapeIds:[61],role:'label',language:'en',readingOrder:0,valueSource:'maintained-page-state'},
    ...SOURCE.directions.map(row=>({id:row.semantic,sourceTextIds:[row.textSourceId],sourceShapeIds:[row.morphShapeId,row.arrowheadShapeId,row.completeLineShapeId],role:'label' as const,language:'en' as const,readingOrder:row.semantic==='decrease'?10:11,valueSource:'maintained-page-state' as const,anchor:anchor(row.semantic==='decrease'?-5:5,GRAPH.directionLabelY)})),
    ...SOURCE.axis.ticks.map((row,index)=>({id:tickId(row.value),sourceTextIds:[row.sourceTextId],sourceShapeIds:row.shapeIds,role:'label' as const,language:'en' as const,readingOrder:100+index,valueSource:'maintained-page-state' as const,anchor:anchor(row.value)})),
    ...SOURCE.comparisons.map((row,index)=>({id:index===0?'positive-comparison':'negative-comparison',sourceTextIds:row.sourceTextIds,sourceShapeIds:row.shapeIds,role:'body' as const,language:'en' as const,readingOrder:index===0?201:200,valueSource:'maintained-page-state' as const})),
  ],
} satisfies LessonTextBinding);

/** All values and reveal intervals use one-based source frames. The generated
 * map keeps the actual source −3 anomaly; only the separately recorded native
 * correction changes its axis target to −4 on frames 255, 257 and 259.
 * Source alpha and counter size remain inspectable. Readable native text uses
 * full contrast from the first nonzero-alpha frame and a constant rem size.
 */
export function getG4L3In003TeachingState(requestedFrame:number) {
  const frame = normalizeCourseG04L03In003Frame(requestedFrame,DOMAIN);
  const counterSource = SOURCE.counters.find(row=>during(frame,row.visibleIntervals));
  const sourceHighlights = SOURCE.highlights.filter(row=>during(frame,row.visibleIntervals));
  const correction = SOURCE.mathematicalCorrection.frames.some(value=>value===frame);
  const highlights = sourceHighlights.map(row=>({
    instanceId:row.instanceId,sourceCharacterId:row.sourceCharacterId,role:row.role,
    sourceSignedValues:row.sourceSignedValues,
    signedValues:correction && row.sourceCharacterId===67 && row.role==='negative-counting'
      ? [SOURCE.mathematicalCorrection.highlightedAxisValue] : [...row.sourceSignedValues],
    corrected:correction && row.sourceCharacterId===67 && row.role==='negative-counting',
  }));
  const directions = SOURCE.directions.map(row=>({
    id:row.semantic,visible:frame>=row.growthRange[0],
    extent:frame>=row.completeFrom?1:alphaAt(frame,row.sourceRatioStates)/65535,
    labelVisible:inside(frame,row.labelVisible),sourceLabelAlpha:alphaAt(frame,row.labelAlphaStates),
  }));
  const comparisons = SOURCE.comparisons.map((row,index)=>({
    id:index===0?'positive-comparison':'negative-comparison',text:row.text,
    visible:inside(frame,row.visible),sourceAlpha:alphaAt(frame,row.sourceAlphaStates),
    // The comparison phase flashes its operands on the number line.
    // Source placements do not flash the comparison expression itself.
    axisEmphasized:during(frame,row.emphasisIntervals),
  }));
  const counter = counterSource ? {
    value:counterSource.signedValue,text:signedText(counterSource.signedValue),instanceId:counterSource.instanceId,
    sourceTextIds:counterSource.sourceTextIds,sourceMinusShapeId:counterSource.minusShapeId,
    sourceFontHeightTwips:counterSource.sourceFontHeightTwips,sourceAlpha:alphaAt(frame,counterSource.sourceAlphaStates),
  } : null;
  const phase = frame>=SOURCE.stableFinalState.firstFrame?'final'
    : comparisons[1].visible?'negative-comparison':comparisons[0].visible?'positive-comparison'
    : frame>=227?'negative-counting':frame>=112?'positive-counting'
    : directions[1].visible?'decrease':directions[0].visible?'increase':'axis';
  return Object.freeze({frame,phase,axisVisible:inside(frame,SOURCE.axis.baseVisible),
    sourceAxisAlpha:alphaAt(frame,SOURCE.axis.sourceAlphaMultipliersByFrame)/256,
    tickValues:inside(frame,SOURCE.axis.baseVisible)?SOURCE.axis.ticks.map(row=>row.value):[],
    directions,counter,highlights,axisHighlightedValues:[...new Set(highlights.flatMap(row=>row.signedValues))],comparisons,
    mathematicalCorrectionApplied:highlights.some(row=>row.corrected),
  });
}

function isSourceFrameState(value:unknown): value is CourseG04L03In003FrameState {
  return typeof value==='object' && value!==null
    && 'frame' in value && typeof value.frame==='number' && Number.isFinite(value.frame)
    && 'frameDomain' in value && (value.frameDomain==='sprite-84'||value.frameDomain==='root')
    && 'rootFrame' in value && typeof value.rootFrame==='number'
    && 'exportFrame' in value && (typeof value.exportFrame==='number'||value.exportFrame===null)
    && 'rootState' in value && (value.rootState==='authoritative-root-runtime-unavailable'||value.rootState==='stopped-at-begin-while-child-static-frame-is-inspected')
    && 'scenario' in value && (value.scenario==='source-static-frame'||value.scenario==='root-unavailable')
    && 'language' in value && (value.language==='en'||value.language==='es')
    && 'seed' in value && typeof value.seed==='number' && Number.isSafeInteger(value.seed)
    && 'status' in value && (value.status==='ready'||value.status==='blocked')
    && 'blocker' in value && (value.blocker===null||typeof value.blocker==='string')
    && 'sourceStaticVisualReady' in value && typeof value.sourceStaticVisualReady==='boolean'
    && 'naturalRuntimeEstablished' in value && value.naturalRuntimeEstablished===false
    && 'audioRendered' in value && value.audioRendered===false
    && 'sourceSwfSha256' in value && typeof value.sourceSwfSha256==='string';
}

export function getG4L3In003TextSnapshot(state:unknown,context:RuntimeContext):TextPresentationSnapshot {
  const blockers:string[]=[];
  const valid = isSourceFrameState(state);
  if(!valid)blockers.push('malformed-source-state');
  const source = valid?state:getCourseG04L03In003FrameState(context.frame,context);
  if(source.sourceSwfSha256!==SOURCE.sourceSwfSha256)blockers.push('source-identity-mismatch');
  if(source.status!=='ready'||!source.sourceStaticVisualReady||source.blocker!==null)blockers.push(source.blocker??'source-state-not-ready');
  if(source.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
  if(source.scenario!==SCENARIO||context.scenario!==SCENARIO)blockers.push('unsupported-scenario');
  if(source.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
  if(source.frame!==normalizeCourseG04L03In003Frame(context.frame,DOMAIN)
    || source.exportFrame!==source.frame-1 || source.rootFrame!==6 || (context.rootFrame!==undefined&&context.rootFrame!==6)
    || source.rootState!=='stopped-at-begin-while-child-static-frame-is-inspected'
    || source.seed!==(Number.isSafeInteger(context.seed)?context.seed>>>0:0))blockers.push('teaching-state-identity-mismatch');
  const teaching=getG4L3In003TeachingState(source.frame);
  return {schemaVersion:1,animationId:ANIMATION_ID,bindingVersion:BINDING_VERSION,sourceSwfSha256:SOURCE.sourceSwfSha256,
    status:blockers.length?'blocked':'ready',blockers,
    identity:{frame:source.frame,frameDomain:source.frameDomain,rootFrame:source.rootFrame,scenario:source.scenario,language:source.language,seed:source.seed,replay:context.replay??0},
    // This capability replaces the complete plane; it does not suppress Canvas
    // drawing instances and must not manufacture instance-suppression evidence.
    suppressedInstances:[],
    blocks:blockers.length?[]:G4_L3_IN003_TEXT_BINDING.blocks.map(binding=>{
      let text='',visible=false;
      if(binding.id==='counting-value'){text=teaching.counter?.text??'';visible=teaching.counter!==null;}
      else if(binding.id==='increase'||binding.id==='decrease'){
        const row=teaching.directions.find(row=>row.id===binding.id);text=binding.id;visible=row?.labelVisible??false;
      }else if(binding.id.endsWith('-comparison')){
        const row=teaching.comparisons.find(row=>row.id===binding.id);text=row?.text??'';visible=row?.visible??false;
      }else{
        const row=SOURCE.axis.ticks.find(row=>tickId(row.value)===binding.id);text=row?signedText(row.value):'';visible=teaching.axisVisible;
      }
      return {id:binding.id,text,visible,role:binding.role,language:binding.language,readingOrder:binding.readingOrder,...('anchor' in binding?{anchor:binding.anchor}:{})};
    }),
  };
}

type TeachingState=ReturnType<typeof getG4L3In003TeachingState>;
function NumberLine({teaching}:{readonly teaching:TeachingState}) {
  const {originX,axisY,step}=GRAPH;
  return <svg viewBox={`0 0 ${GRAPH.width} ${GRAPH.height}`} aria-hidden="true" focusable="false" style={{display:'block',width:'100%',height:'auto'}}>
    <rect width={GRAPH.width} height={GRAPH.height} fill="#fffdf7"/>
    <line x1={24} y1={axisY} x2={GRAPH.width-24} y2={axisY} stroke={NEUTRAL_INK} strokeWidth={3}/>
    <path d={`M 35 ${axisY-7} L 24 ${axisY} L 35 ${axisY+7} M ${GRAPH.width-35} ${axisY-7} L ${GRAPH.width-24} ${axisY} L ${GRAPH.width-35} ${axisY+7}`} fill="none" stroke={NEUTRAL_INK} strokeWidth={3}/>
    {teaching.tickValues.map(value=><line key={value} data-in003-tick={value} x1={originX+value*step} x2={originX+value*step} y1={axisY-10} y2={axisY+10} stroke={value<0?NEGATIVE_INK:value>0?POSITIVE_INK:NEUTRAL_INK} strokeWidth={value===0?4:2}/>)}
    {teaching.directions.filter(row=>row.visible).map(row=>{
      const sign=row.id==='decrease'?-1:1;
      const start=originX+sign*8,tip=originX+sign*(8+row.extent*480),y=GRAPH.directionY;
      return <g key={row.id} data-in003-direction={row.id} data-source-morph-progress={row.extent}>
        <line x1={start} y1={y} x2={tip} y2={y} stroke={NEUTRAL_INK} strokeWidth={3}/>
        <path d={`M ${tip-sign*10} ${y-6} L ${tip} ${y} L ${tip-sign*10} ${y+6}`} stroke={NEUTRAL_INK} strokeWidth={3} fill="none"/>
      </g>;
    })}
  </svg>;
}
const STYLES=`
.in003-modern{min-inline-size:0;inline-size:100%;padding:1rem;background:#fffdf7;color:${NEUTRAL_INK}}
.in003-modern .in003-native-labels{position:absolute;inset:0;list-style:none;padding:0;margin:0;pointer-events:none}
.in003-modern .in003-native-labels>li{position:absolute;translate:-50% -50%;margin:0;padding:0;white-space:nowrap;font:600 1.125rem/1.4 var(--lesson-font-body,system-ui)}
.in003-modern [data-lesson-text-block^="tick-negative"]{color:${NEGATIVE_INK}}
.in003-modern [data-lesson-text-block^="tick-positive"]{color:${POSITIVE_INK}}
.in003-modern .in003-native-labels .lesson-figure-text-layer__label{border:2px solid transparent;border-radius:.25rem;padding:.05rem .1rem}
.in003-modern .in003-native-labels [data-in003-highlight="true"]{border-color:currentColor;font-weight:800;background:#fff}
.in003-modern .lesson-text-presentation__label-list{list-style:none;padding:0;gap:.5rem 1rem}
.in003-modern .lesson-text-presentation__label-list>li{min-inline-size:2rem;text-align:center}
.in003-modern .in003-counter-slot{min-block-size:3.5rem;text-align:center}
.in003-modern .in003-counter{margin:0;font:700 2rem/1.5 var(--lesson-font-body,system-ui)}
.in003-modern .in003-comparisons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
.in003-modern .in003-comparison{margin:0;text-align:center;font:700 1.5rem/1.6 var(--lesson-font-body,system-ui);border:2px solid transparent;border-radius:.4rem;padding:.4rem;overflow-wrap:anywhere}
.in003-modern .in003-comparison[data-lesson-text-block="negative-comparison"]{color:${NEGATIVE_INK};grid-column:1}
.in003-modern .in003-comparison[data-lesson-text-block="positive-comparison"]{color:${POSITIVE_INK};grid-column:2}
@container lesson-text (max-width:28rem){.in003-modern .in003-comparisons{grid-template-columns:minmax(0,1fr)}.in003-modern .in003-comparisons .in003-comparison{grid-column:1}}
@container lesson-text (min-width:66rem){.in003-modern .lesson-text-presentation__label-list{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;padding:0;margin:0;gap:0}}
`;

export function G4L3In003ModernRenderer(props:AnimationRendererProps) {
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??DOMAIN};
  const source = props.state===undefined?getCourseG04L03In003FrameState(props.frame,context):props.state;
  const snapshot=getG4L3In003TextSnapshot(source,context);
  const teaching=getG4L3In003TeachingState(snapshot.identity.frame);
  const host=useRef<HTMLDivElement>(null);
  const follow=useRef({phase:'',replay:-1,manual:false});
  const ready=snapshot.status==='ready';
  useLayoutEffect(()=>{
    if(!ready||!teaching.axisVisible)return;
    const viewport=host.current?.querySelector<HTMLElement>('.lesson-text-presentation__figure-viewport');
    if(!viewport||viewport.scrollWidth<=viewport.clientWidth)return;
    const newPhase=follow.current.phase!==teaching.phase||follow.current.replay!==(props.replay??0);
    if(newPhase)follow.current={phase:teaching.phase,replay:props.replay??0,manual:false};
    if(follow.current.manual)return;
    const value=teaching.counter?.value??(teaching.phase==='positive-comparison'?9:teaching.phase==='negative-comparison'?-9:teaching.phase==='increase'?5:teaching.phase==='decrease'?-5:0);
    const label=viewport.querySelector<HTMLElement>(`[data-lesson-text-block="${tickId(value)}"]`);
    if(!label)return;
    const viewBox=viewport.getBoundingClientRect(),box=label.getBoundingClientRect();
    if(newPhase)viewport.scrollLeft+=box.left+box.width/2-(viewBox.left+viewBox.width/2);
    else if(box.left<viewBox.left+12)viewport.scrollLeft-=viewBox.left+12-box.left;
    else if(box.right>viewBox.right-12)viewport.scrollLeft+=box.right-viewBox.right+12;
    // Only a source beat or Replay changes the viewport; no new frame clock.
    // User navigation remains in control until the next authored teaching phase.
  },[ready,teaching.axisVisible,teaching.phase,teaching.counter?.value,props.replay]);
  const retainUserViewport=(event:React.SyntheticEvent)=>{
    if(host.current?.querySelector('.lesson-text-presentation__figure-viewport')?.contains(event.target as Node))follow.current.manual=true;
  };
  if(!ready)return null;
  const labels=snapshot.blocks.filter(block=>block.visible&&block.anchor).sort((left,right)=>left.readingOrder-right.readingOrder);
  const counter=snapshot.blocks.find(block=>block.id==='counting-value');
  const comparisons=snapshot.blocks.filter(block=>block.visible&&block.id.endsWith('-comparison')).sort((left,right)=>left.readingOrder-right.readingOrder);
  return <div ref={host} className="in003-modern" data-modern-lesson="g4-l3-in003" data-in003-phase={teaching.phase}
    data-flash-frame={snapshot.identity.frame} data-flash-frame-domain={snapshot.identity.frameDomain} data-flash-root-frame={snapshot.identity.rootFrame}
    data-runtime-scenario={snapshot.identity.scenario} data-runtime-seed={snapshot.identity.seed} data-runtime-replay={snapshot.identity.replay}
    data-in003-correction={teaching.mathematicalCorrectionApplied?'minus-four-highlight':undefined}
    onPointerDownCapture={retainUserViewport} onWheelCapture={retainUserViewport}
    onKeyDownCapture={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))retainUserViewport(event);}}>
    <style>{STYLES}</style>
    <div className="lesson-text-presentation lesson-text-presentation--complex-figure" lang="en"><div className="lesson-text-presentation__layout">
      <div className="in003-counter-slot">{counter?.visible&&<p className="in003-counter" data-lesson-text-block="counting-value" data-in003-counter-value={teaching.counter?.value}>{counter.text}</p>}</div>
      {teaching.axisVisible&&<figure className="lesson-text-presentation__figure" aria-label="Number line">
        <div className="lesson-text-presentation__figure-viewport" role="group" tabIndex={0} aria-label="Number line">
          <div className="lesson-text-presentation__figure-plane" style={{'--lesson-figure-min-inline-size':'66rem'} as React.CSSProperties}>
            <div style={{position:'relative'}}><NumberLine teaching={teaching}/>
              <ol className="in003-native-labels" role="list" aria-label="Number line labels">
                {labels.map(block=>{
                  const value=SOURCE.axis.ticks.find(row=>tickId(row.value)===block.id)?.value;
                  return <li key={block.id} lang={block.language} style={{left:`${block.anchor!.x/block.anchor!.stageWidth*100}%`,top:`${block.anchor!.y/block.anchor!.stageHeight*100}%`}}>
                    <span className="lesson-figure-text-layer__label" data-lesson-text-block={block.id} data-in003-highlight={value!==undefined&&teaching.axisHighlightedValues.some(highlight=>highlight===value)?'true':'false'}>{block.text}</span>
                  </li>;
                })}
              </ol>
            </div>
          </div>
        </div>
      </figure>}
      {labels.length>0&&<div className="lesson-text-presentation__controls" aria-hidden="true"><ul className="lesson-text-presentation__label-list">
        {labels.map(block=><li key={block.id} data-lesson-readable-block={block.id}>{block.text}</li>)}
      </ul></div>}
      {comparisons.length>0&&<div className="in003-comparisons">{comparisons.map(block=><p key={block.id} className="in003-comparison" data-lesson-text-block={block.id}>{block.text}</p>)}</div>}
    </div></div>
  </div>;
}

export const G4_L3_IN003_SOURCE_AUDIO_CUES=Object.freeze(G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ANIMATION_ID].audioCues.map(cue=>{
  if(!cue.sha256)throw new Error('Source main audio cue lacks its original hash');
  return Object.freeze({...cue,sha256:cue.sha256});
}));
export const G4_L3_IN003_TEXT_PRESENTATION=Object.freeze({
  schemaVersion:1,binding:G4_L3_IN003_TEXT_BINDING,Renderer:G4L3In003ModernRenderer,getSnapshot:getG4L3In003TextSnapshot,
  sourceTimelineAudioCues:G4_L3_IN003_SOURCE_AUDIO_CUES,reducedMotionFrameByDomain:{'sprite-84':472},
} satisfies LessonTextPresentationCapability<CourseG04L03In003FrameState>);
