'use client';

// Four source-specific consumers share native reading and figure behavior.
// The My Lesson host remains the only teaching/audio clock.
import React, {useId, useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {SourceChoiceText} from './source-six-question-choice';

type Term = Readonly<{keyAttribute: string; entryId: string; buttonCharacter: number; sourceInstance: string; firstSourceFrame: number; lastFrameExclusive: number}>;
type Body = Readonly<{id: string; text: string; sourceTextIds: readonly string[]; wordReveals: readonly Readonly<{text: string; frame: number}>[]; termSpans: readonly Readonly<{keyAttribute: string; firstWord: number; endWordExclusive: number}>[]}>;
type Tick = Readonly<{value: number; text: string; sourceTextIds: readonly string[]; sourceShapeIds: readonly number[]; sourceInstance: string; signInstance: string | null}>;
type Annotation = Readonly<{sourceCharacter: number; text: string; alpha: number; sourceTextIds: readonly string[]}>;
type SemanticState = Readonly<{frame: number; panelAlpha: number; axisAlpha: number; labelsAlpha: number; arrows: readonly Readonly<{direction: number; progress: number; sourceShapeId: number}>[]; scanValues: readonly number[]; spotlight: Readonly<{text: string; value: number; alpha: number; sourceTextIds: readonly string[]}> | null; zeroOutline: boolean; annotations: readonly Annotation[]}>;
export interface NumberLineVocabularyConfig {
  readonly animationId: string; readonly placementId: string; readonly sourceSwfSha256: string; readonly bindingVersion: string;
  readonly rootFrame: number; readonly frameDomain: string; readonly frameCount: number; readonly fps: number;
  readonly sourceOnlyFallbackLanguage: 'en'; readonly disposition: string;
  readonly title: Readonly<{text: string; sourceTextIds: readonly string[]}>;
  readonly bodies: readonly Body[]; readonly ticks: readonly Tick[]; readonly terms: readonly Term[];
  readonly semanticStates: readonly SemanticState[];
  readonly sourceAudio: readonly (AudioCue & {readonly sha256: string; readonly manualNarration?: false})[];
  readonly annotationTerms: readonly Readonly<{sourceCharacter: number; keyAttribute: string}>[];
  readonly modernGraph: Readonly<{width: number; height: number; originX: number; step: number; axisY: number; labelY: number; minInlineSizeRem: number}>;
}
type FrameState = (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState;
const SCENARIO = 'source-static-frame';
const KEYTERM_SOURCE = 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749';
const POSITIVE = '#164eaa', NEGATIVE = '#a82c45', NEUTRAL = '#14213d';
const tickId = (value: number) => value === 0 ? 'tick-zero' : `tick-${value < 0 ? 'negative' : 'positive'}-${Math.abs(value)}`;
const annotationId = (character: number) => `annotation-${character}`;
const normalize = (frame: number, count: number) => Math.min(count, Math.max(1, Math.trunc(Number.isFinite(frame) ? frame : 1)));
const ink = (value: number) => value < 0 ? NEGATIVE : value > 0 ? POSITIVE : NEUTRAL;

export function getNumberLineVocabularyTeachingState(config: NumberLineVocabularyConfig, requestedFrame: number): SemanticState {
  const frame = normalize(requestedFrame, config.frameCount);
  // Configuration validation requires the initial state. No interpolated clock
  // or synthetic default can replace a source sample.
  let state = config.semanticStates[0];
  if (!state || state.frame !== 1) throw new Error(`${config.animationId}: missing initial source sample`);
  for (const candidate of config.semanticStates) {
    if (candidate.frame > frame) break;
    state = candidate;
  }
  return state;
}
export function isNumberLineVocabularyTermActive(term: Term, frame: number) {
  return frame >= term.firstSourceFrame && frame < term.lastFrameExclusive;
}
function validateConfig(config: NumberLineVocabularyConfig) {
  if (config.rootFrame !== 6 || config.fps !== 12 || !Number.isInteger(config.frameCount) || config.frameCount < 1 ||
      config.semanticStates[0]?.frame !== 1 || config.semanticStates.some((state, index) =>
        state.frame > config.frameCount || index > 0 && state.frame <= config.semanticStates[index - 1].frame)) {
    throw new Error(`${config.animationId}: invalid source clock or semantic samples`);
  }
  if (config.ticks.length !== 17 || config.ticks.some((tick, index) => tick.value !== index - 8) ||
      config.bodies.some(body => body.wordReveals.length === 0 || body.wordReveals.map(word => word.text).join(' ') !== body.text ||
        body.termSpans.some(span => !config.terms.some(term => term.keyAttribute === span.keyAttribute) ||
          span.firstWord < 0 || span.endWordExclusive > body.wordReveals.length || span.firstWord >= span.endWordExclusive))) {
    throw new Error(`${config.animationId}: invalid source reading configuration`);
  }
}


const STYLE = `
.vocab-number-line{min-inline-size:0;inline-size:100%;padding:1rem;background:#fffdf7}
/* Preserve enlarged words by removing this extra mobile inline gutter.
   The retained host still provides its own reading inset. */
@media (max-width:480px){.vocab-number-line{padding-inline:0}}
.vocab-number-line .vocab-term{min-inline-size:44px;min-block-size:44px;max-inline-size:100%;padding:.15rem .1rem;border:0;border-radius:.25rem;background:transparent;color:#164eaa;font:inherit;text-decoration:underline;text-underline-offset:.15em;cursor:pointer;white-space:normal;overflow-wrap:anywhere}
.vocab-number-line .vocab-term:focus-visible{outline:3px solid #155ac1;outline-offset:2px}
.vocab-number-line .vocab-term:disabled{cursor:default}
.vocab-number-line .vocab-labels{position:absolute;inset:0;list-style:none;margin:0;padding:0;pointer-events:none}
.vocab-number-line .vocab-labels>li{position:absolute;translate:-50% -50%;white-space:nowrap;background:#fffdf7;font-size:1.125rem;line-height:1.5;padding:.05rem .15rem}
.vocab-number-line .vocab-labels>li[data-source-focus=true]{font-weight:800;border-block-end:3px solid currentColor}
.vocab-number-line .vocab-annotations{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1rem;list-style:none;margin:.5rem 0;padding:0;font-size:1.125rem;line-height:1.5}
.vocab-number-line .vocab-atomic-number{white-space:nowrap;font-variant-numeric:tabular-nums lining-nums;unicode-bidi:isolate}
.vocab-number-line .vocab-spotlight{position:absolute;translate:-50% -50%;font-size:2rem;line-height:1.5;text-align:center;margin:0;background:#fffdf7;white-space:nowrap}
`;

export function createNumberLineVocabularyPresentation(config: NumberLineVocabularyConfig, getFrameState: FrameState): LessonTextPresentationCapability<SourceStaticCanvasFrameState> & {readonly Renderer: React.ComponentType<AnimationRendererProps>} {
  validateConfig(config);
  const annotationDefinitions = [...new Map(config.semanticStates.flatMap(state => state.annotations.map(annotation => [annotation.sourceCharacter, annotation] as const))).values()];
  const spotlightIds = [...new Set(config.semanticStates.flatMap(state => state.spotlight?.sourceTextIds ?? []))];
  const spotlightValue = config.semanticStates.find(state => state.spotlight)?.spotlight?.value;
  const spotlightAnchor = spotlightValue === undefined ? undefined : {x:config.modernGraph.originX+spotlightValue*config.modernGraph.step,y:config.modernGraph.axisY-78,stageWidth:config.modernGraph.width,stageHeight:config.modernGraph.height};
  const binding: LessonTextBinding = {
    schemaVersion: 1, version: config.bindingVersion, placementId: config.placementId, animationId: config.animationId,
    sourceSwfSha256: config.sourceSwfSha256, template: 'complex-figure',
    blocks: [
      {id:'root-title',sourceTextIds:config.title.sourceTextIds,role:'title',language:'en',readingOrder:0,valueSource:'source-static'},
      ...config.bodies.map((body,index) => ({id:body.id,sourceTextIds:body.sourceTextIds,role:'body' as const,language:'en' as const,readingOrder:10+index,valueSource:'maintained-page-state' as const})),
      ...config.ticks.map((tick,index) => ({id:tickId(tick.value),sourceTextIds:tick.sourceTextIds,...(tick.sourceShapeIds.length?{sourceShapeIds:tick.sourceShapeIds}:{}),role:'label' as const,language:'en' as const,readingOrder:100+index,valueSource:'maintained-page-state' as const,anchor:{x:config.modernGraph.originX+tick.value*config.modernGraph.step,y:config.modernGraph.labelY,stageWidth:config.modernGraph.width,stageHeight:config.modernGraph.height}})),
      ...annotationDefinitions.map((annotation,index) => ({id:annotationId(annotation.sourceCharacter),sourceTextIds:annotation.sourceTextIds,role:'label' as const,language:'en' as const,readingOrder:130+index,valueSource:'maintained-page-state' as const})),
      ...(spotlightIds.length ? [{id:'source-spotlight',sourceTextIds:spotlightIds,role:'label' as const,language:'en' as const,readingOrder:140,valueSource:'maintained-page-state' as const,anchor:spotlightAnchor}] : []),
    ],
  };
  const snapshot = (state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot => {
    const blockers: string[] = [];
    if (state.animationId!==config.animationId || state.sourceSwfSha256!==config.sourceSwfSha256) blockers.push('source-identity-mismatch');
    if (state.status!=='ready') blockers.push(state.blocker??'source-state-not-ready');
    if (state.frameDomain!==config.frameDomain || (context.frameDomain??config.frameDomain)!==config.frameDomain) blockers.push('unsupported-frame-domain');
    if (state.scenario!==SCENARIO || context.scenario!==SCENARIO) blockers.push('unsupported-scenario');
    if (state.language!=='en' || context.lang!=='en') blockers.push('spanish-text-not-source-verified');
    if (state.frame!==normalize(context.frame,config.frameCount) || state.rootFrame!==config.rootFrame || (context.rootFrame!==undefined&&context.rootFrame!==config.rootFrame) || state.seed!==(Number.isSafeInteger(context.seed)?context.seed>>>0:0)) blockers.push('teaching-state-identity-mismatch');
    const teaching = getNumberLineVocabularyTeachingState(config,state.frame);
    return {schemaVersion:1,animationId:config.animationId,bindingVersion:config.bindingVersion,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
      identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
      blocks:blockers.length?[]:binding.blocks.map(block => {
        let text='',visible=false;
        if(block.id==='root-title'){text=config.title.text;visible=true;}
        const body=config.bodies.find(body=>body.id===block.id);
        if(body){text=body.wordReveals.filter(word=>state.frame>=word.frame).map(word=>word.text).join(' ');visible=Boolean(text);}
        const tick=config.ticks.find(tick=>tickId(tick.value)===block.id);
        if(tick){text=tick.text;visible=teaching.labelsAlpha>0;}
        const annotation=teaching.annotations.find(annotation=>annotationId(annotation.sourceCharacter)===block.id);
        if(annotation){text=annotation.text;visible=annotation.alpha>0;}
        if(block.id==='source-spotlight'&&teaching.spotlight){text=teaching.spotlight.text;visible=teaching.spotlight.alpha>0;}
        return{id:block.id,text,visible,role:block.role,language:block.language,readingOrder:block.readingOrder,...(block.anchor?{anchor:block.anchor}:{})};
      })};
  };
  function Renderer(props: AnimationRendererProps) {
    const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain};
    const source=props.state&&typeof props.state==='object'&&'animationId' in props.state?props.state as SourceStaticCanvasFrameState:getFrameState(props.frame,context);
    const current=snapshot(source,context),teaching=getNumberLineVocabularyTeachingState(config,source.frame),host=useRef<HTMLDivElement>(null),helpId=useId();
    const follow=useRef({replay:-1,phase:'',manual:false}),ready=current.status==='ready';
    const arrow=teaching.arrows.at(-1),focus=teaching.spotlight?.alpha?teaching.spotlight.value:(arrow?.direction===-1?teaching.scanValues.at(0):teaching.scanValues.at(-1))??(arrow?arrow.direction*4:0);
    const phase=teaching.spotlight?.alpha?'spotlight':arrow?String(arrow.direction):'origin';
    const figurePresent=teaching.panelAlpha>0||teaching.axisAlpha>0||teaching.labelsAlpha>0||teaching.arrows.length>0;
    useLayoutEffect(()=>{
      const viewport=host.current?.querySelector<HTMLElement>('.lesson-text-presentation__figure-viewport');
      if(!ready||!figurePresent||!viewport)return;
      const changed=follow.current.replay!==(props.replay??0)||follow.current.phase!==phase;
      if(changed)follow.current={replay:props.replay??0,phase,manual:false};
      let active=true;
      const apply=()=>{if(!active||follow.current.manual)return;const center=(config.modernGraph.originX+focus*config.modernGraph.step)/config.modernGraph.width;viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollWidth*center-viewport.clientWidth/2));};
      apply();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(apply);observer?.observe(viewport);const plane=viewport.firstElementChild;if(plane)observer?.observe(plane);
      if(!observer)window.addEventListener('resize',apply);document.fonts?.addEventListener('loadingdone',apply);void document.fonts?.ready.then(apply);
      return()=>{active=false;observer?.disconnect();if(!observer)window.removeEventListener('resize',apply);document.fonts?.removeEventListener('loadingdone',apply);};
    },[ready,figurePresent,phase,focus,props.replay]);
    if(!ready)return null;
    const button=(term:Term,text:string,key:string)=>!isNumberLineVocabularyTermActive(term,source.frame)?<React.Fragment key={key}>{text}</React.Fragment>:<button key={key} type="button" className="vocab-term" disabled={!props.onLessonHostRequest} data-source-keyterm={term.keyAttribute} data-source-button={term.buttonCharacter} data-keyterm-entry-id={term.entryId}
      onClick={event=>{if(!isNumberLineVocabularyTermActive(term,source.frame))return;props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'});}}>{text}</button>;
    const bodyText=(body:Body)=>{const words=body.wordReveals.filter(word=>source.frame>=word.frame),parts:React.ReactNode[]=[];for(let index=0;index<words.length;){const span=body.termSpans.find(span=>span.firstWord===index&&span.endWordExclusive<=words.length),term=span?config.terms.find(term=>term.keyAttribute===span.keyAttribute):undefined;const end=span&&term?span.endWordExclusive:index+1,text=words.slice(index,end).map(word=>word.text).join(' ');if(index)parts.push(' ');parts.push(term?button(term,text,body.id+'-'+index):text);index=end;}return parts;};
    const graph=config.modernGraph,axisExtent=8.7*graph.step;
    const retain=(event:React.SyntheticEvent)=>{if(host.current?.querySelector('.lesson-text-presentation__figure-viewport')?.contains(event.target as Node))follow.current.manual=true;};
    return <div ref={host} className="vocab-number-line" data-modern-text-page={config.animationId} data-lesson-frame={source.frame} data-lesson-replay={props.replay??0} data-flash-frame={source.frame} data-flash-frame-domain={source.frameDomain} data-flash-root-frame={source.rootFrame} data-native-source-zero-emphasis={teaching.zeroOutline} onPointerDownCapture={retain} onWheelCapture={retain}>
      <style>{STYLE}</style><div className="lesson-text-presentation lesson-text-presentation--complex-figure" lang="en"><div className="lesson-text-presentation__layout">
        <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{config.title.text}</h2>
        {config.bodies.map(body=>source.frame>=body.wordReveals[0].frame?<p key={body.id} className="lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block={body.id}>{bodyText(body)}</p>:null)}
        {figurePresent&&<figure className="lesson-text-presentation__figure" aria-label="Number line" data-native-axis-min={-8} data-native-axis-max={8}>
          <p id={helpId} lang={props.uiLanguage??props.lang}>{(props.uiLanguage??props.lang)==='es'?'Con la recta numérica enfocada, usa las flechas izquierda y derecha para desplazarte; Inicio y Fin te llevan a los extremos.':'With the number line focused, use the left and right arrow keys to scroll; Home and End move to its ends.'}</p>
          <div className="lesson-text-presentation__figure-viewport" role="group" tabIndex={0} aria-label="Number line" aria-describedby={helpId} onFocus={retain} onKeyDown={event=>{if(event.target!==event.currentTarget||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;follow.current.manual=true;const v=event.currentTarget,max=Math.max(0,v.scrollWidth-v.clientWidth);if(!max)return;event.preventDefault();v.scrollLeft=Math.max(0,Math.min(max,event.key==='Home'?0:event.key==='End'?max:v.scrollLeft+(event.key==='ArrowRight'?1:-1)*Math.max(40,v.clientWidth/5)));}}>
            <div className="lesson-text-presentation__figure-plane" style={{'--lesson-figure-min-inline-size':`${graph.minInlineSizeRem}rem`} as React.CSSProperties}><div style={{position:'relative'}}>
              <svg viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true" focusable="false" style={{display:'block',width:'100%',height:'auto'}}>
                <rect width={graph.width} height={graph.height} fill="#fffdf7" opacity={teaching.panelAlpha}/>
                <g opacity={teaching.axisAlpha}><line x1={graph.originX-axisExtent} x2={graph.originX} y1={graph.axisY} y2={graph.axisY} stroke={NEGATIVE} strokeWidth={3}/><line x1={graph.originX} x2={graph.originX+axisExtent} y1={graph.axisY} y2={graph.axisY} stroke={POSITIVE} strokeWidth={3}/>
                  {config.ticks.map(tick=><line key={tick.value} x1={graph.originX+tick.value*graph.step} x2={graph.originX+tick.value*graph.step} y1={graph.axisY-9} y2={graph.axisY+9} stroke={ink(tick.value)} strokeWidth={tick.value===0?4:2}/>)}
                  {[-1,1].map(direction=><path key={direction} d={`M ${graph.originX+direction*(axisExtent-11)} ${graph.axisY-7} L ${graph.originX+direction*axisExtent} ${graph.axisY} L ${graph.originX+direction*(axisExtent-11)} ${graph.axisY+7}`} fill="none" stroke={ink(direction)} strokeWidth={3}/>)}
                </g>
                {teaching.arrows.map(a=>{const y=graph.axisY-38,x=graph.originX+a.direction*a.progress*8*graph.step;return <g key={a.sourceShapeId} data-source-shape={a.sourceShapeId} data-source-direction={a.direction} data-source-progress={a.progress}><line x1={graph.originX} x2={x} y1={y} y2={y} stroke={ink(a.direction)} strokeWidth={3}/><circle cx={graph.originX} cy={y} r={4} fill={ink(a.direction)}/><path d={`M ${x-a.direction*10} ${y-6} L ${x} ${y} L ${x-a.direction*10} ${y+6}`} fill="none" stroke={ink(a.direction)} strokeWidth={3}/></g>;})}
              </svg>
              {teaching.labelsAlpha>0&&<ul className="vocab-labels" aria-label="Number line labels" style={{opacity:teaching.labelsAlpha}}>{config.ticks.map(tick=><li key={tick.value} id={`${helpId}-${tickId(tick.value)}`} style={{left:`${(graph.originX+tick.value*graph.step)/graph.width*100}%`,top:`${graph.labelY/graph.height*100}%`,color:ink(tick.value)}} data-source-focus={teaching.scanValues.includes(tick.value)||tick.value===0&&teaching.zeroOutline} data-lesson-text-block={tickId(tick.value)}><span className="vocab-atomic-number"><SourceChoiceText text={tick.text}/></span></li>)}</ul>}
              {/* The literal sign can disappear in the source. Retain its
                  mathematical position above the same signed baseline tick. */}
              {teaching.spotlight&&teaching.spotlight.alpha>0&&<p className="vocab-spotlight" data-lesson-text-block="source-spotlight" data-source-value={teaching.spotlight.value} data-source-literal={teaching.spotlight.text} aria-describedby={`${helpId}-${tickId(teaching.spotlight.value)}`} style={{left:`${(graph.originX+teaching.spotlight.value*graph.step)/graph.width*100}%`,top:`${(graph.axisY-78)/graph.height*100}%`,opacity:teaching.spotlight.alpha,color:ink(teaching.spotlight.value)}}><span className="vocab-atomic-number"><SourceChoiceText text={teaching.spotlight.text}/></span></p>}
            </div></div>
          </div>
        </figure>}
        {teaching.annotations.some(a=>a.alpha>0)&&<ul className="vocab-annotations">{teaching.annotations.filter(a=>a.alpha>0).map(a=>{const association=config.annotationTerms.find(t=>t.sourceCharacter===a.sourceCharacter),term=config.terms.find(t=>t.keyAttribute===association?.keyAttribute);return <li key={a.sourceCharacter} style={{opacity:a.alpha}} data-lesson-text-block={annotationId(a.sourceCharacter)}>{term?button(term,a.text,annotationId(a.sourceCharacter)):a.text}</li>;})}</ul>}

      </div></div>
    </div>;
  }
  return {schemaVersion:1,binding,Renderer,getSnapshot:snapshot,playbackMode:'once',sourceTimelineAudioCues:config.sourceAudio,reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:KEYTERM_SOURCE,entryIds:config.terms.map(term=>term.entryId)}};
}
