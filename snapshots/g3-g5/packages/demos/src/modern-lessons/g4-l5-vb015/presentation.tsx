'use client';

import React, {useState} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot, LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../../lesson-text-contract';
import {buildLessonTextSnapshot, validateLessonTextBinding} from '../../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import source from './source.generated.json';

type Curve<T> = readonly (readonly [number, T])[];
type Label = Readonly<{id: string; character: number; text: string; sourceInstance: string; depth: number; x: number; y: number; alpha: number; runs: readonly {text: string; color: string}[]}>;
type Graphic = Readonly<{character: number; sourceInstance: string; depth: number; matrix: readonly number[]; alpha: number}>;
type Scene = Readonly<{labels: readonly Label[]; graphics: readonly Graphic[]}>;
interface Config {
  readonly animationId: string; readonly placementId: string; readonly sourceSha256: string;
  readonly title: string; readonly instruction: string; readonly multiply: string; readonly controlAlpha: Curve<number>;
  readonly main: Readonly<{frameDomain: string; frameCount: number; interactionFrame: number; rootFrame: number; fps: number}>;
  readonly activity: LessonTextActivityDefinition;
  readonly words: readonly {readonly text: string; readonly alpha: Curve<number>; readonly sourceTextIds: readonly string[]}[];
  readonly mainScenes: Curve<Scene>; readonly childScenes: Curve<Scene>;
  readonly shapes: Readonly<Record<string, {readonly paths: readonly {d: string; fill: string; stroke: string; width: number}[]}>>;
  readonly viewBox: readonly number[]; readonly inlineRem: number; readonly binding: LessonTextBinding;
}
export const VB015_CONFIG = source as unknown as Config;
validateLessonTextBinding(VB015_CONFIG.binding);
const at = <T,>(curve: Curve<T>, frame: number): T => curve.filter(([first]) => first <= frame).at(-1)![1];
const empty: Scene = {labels: [], graphics: []};

export function observeVb015Child(frame: number, activities: readonly LessonTextActivitySnapshot[], revisionFloor = -1) {
  const c = VB015_CONFIG, candidates = activities.filter(a => a.id === c.activity.id || a.sourceInstanceId === c.activity.sourceInstanceId);
  const a = candidates.length === 1 ? candidates[0] : undefined;
  const valid = Boolean(a && c.activity.parentFrames.includes(frame) && a.id === c.activity.id && a.sourceInstanceId === c.activity.sourceInstanceId &&
    a.frameDomain === c.activity.frameDomain && Number.isSafeInteger(a.revision) && a.revision > revisionFloor && Number.isInteger(a.frame) &&
    a.frame >= c.activity.startFrame && a.frame <= c.activity.endFrame && (a.status === 'playing' || (a.status === 'completed' && a.frame === c.activity.endFrame)));
  return valid ? a! : null;
}

export function getVb015Teaching(frame: number, childFrame = 1) {
  const c = VB015_CONFIG;
  frame = Number.isFinite(frame) ? Math.max(1, Math.min(c.main.frameCount, Math.floor(frame))) : 1;
  const main = at(c.mainScenes, Math.max(1, Math.min(c.main.frameCount, frame)));
  const child = frame >= c.main.interactionFrame ? at(c.childScenes, Math.max(1, Math.min(c.activity.endFrame, childFrame))) : empty;
  const words = c.words.map(w => ({...w, alpha: at(w.alpha, frame)}));
  return {main, child, labels: [...main.labels, ...child.labels], graphics: [...main.graphics, ...child.graphics], words,
    controlAlpha: at(c.controlAlpha, frame), instruction: words.filter(w => w.alpha > 0).map(w => w.text).join(' ')};
}

export function getVb015Snapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext, childFrame = 1): TextPresentationSnapshot {
  const c = VB015_CONFIG;
  const valid = state?.status === 'ready' && state.animationId === c.animationId && state.sourceSwfSha256 === c.sourceSha256 &&
    state.frame === context.frame && Number.isInteger(context.frame) && context.frame >= 1 && context.frame <= c.main.frameCount &&
    state.frameDomain === c.main.frameDomain && (context.frameDomain ?? c.main.frameDomain) === c.main.frameDomain &&
    state.rootFrame === c.main.rootFrame && (context.rootFrame ?? c.main.rootFrame) === c.main.rootFrame &&
    state.scenario === 'source-static-frame' && context.scenario === state.scenario && context.lang === 'en' && state.language === 'en' &&
    state.seed === (context.seed >>> 0) && !context.entryStateSha256;
  const teaching = getVb015Teaching(context.frame, childFrame);
  const content: Record<string, {text: string; visible: boolean}> = Object.fromEntries(c.binding.blocks.map(b => [b.id, {text: '', visible: false}]));
  content.title = {text: c.title, visible: true};
  content.instruction = {text: teaching.instruction, visible: Boolean(teaching.instruction)};
  content.multiply = {text: c.multiply, visible: teaching.controlAlpha > 0};
  for (const label of teaching.labels) content[label.id] = {text: label.text, visible: label.alpha > 0};
  const snapshot = buildLessonTextSnapshot(c.binding, {...context, frameDomain: c.main.frameDomain, rootFrame: c.main.rootFrame}, content);
  return valid ? snapshot : {...snapshot, status: 'blocked', blockers: ['source-or-context-identity-mismatch'], blocks: [], suppressedInstances: []};
}

const CSS = `
.g4l5-vb015{box-sizing:border-box;inline-size:100%;min-inline-size:0;padding:.8rem;background:#fffdf7;font:1.125rem/1.6 var(--lesson-font-body,'Nunito Sans',sans-serif);color:#17273c}
.g4l5-vb015 *{box-sizing:border-box}.g4l5-vb015 h2{overflow-wrap:anywhere;margin:0 0 .65em;font:700 clamp(1.4rem,4cqi,2.25rem)/1.3 var(--lesson-font-display,Fredoka,sans-serif)}
.g4l5-vb015__instruction{margin:.6em 0;max-inline-size:68ch}.g4l5-vb015__word{display:inline-block;white-space:nowrap}
.g4l5-vb015__control{font:inherit;min-inline-size:44px;min-block-size:44px;padding:.45em .9em;border:2px solid #244db2;border-radius:.4rem;background:#244db2;color:#fff;cursor:pointer}
.g4l5-vb015__control:disabled{background:#e5eaf2;color:#52647a;cursor:default}.g4l5-vb015__control:focus-visible,.g4l5-vb015__scroll:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l5-vb015__scroll{overflow-x:auto;max-inline-size:100%;min-inline-size:0;padding:.4rem;border:1px solid #cbd7e5;border-radius:.65rem;background:#fff}
.g4l5-vb015__board{position:relative;font-size:1.125rem;line-height:1.25;font-variant-numeric:tabular-nums}.g4l5-vb015__board svg{position:absolute;inset:0;inline-size:100%;block-size:100%;pointer-events:none}
.g4l5-vb015__label{position:absolute;transform:translate(-50%,-50%);white-space:pre;pointer-events:none}
`;

export function Vb015Scene({frame, childFrame = 1, replay = 0, paused = false, onMultiply}: {frame: number; childFrame?: number; replay?: number; paused?: boolean; onMultiply?: () => void}) {
  const c = VB015_CONFIG, teaching = getVb015Teaching(frame, childFrame), [left, top, width, height] = c.viewBox;
  const active = c.activity.parentFrames.includes(frame) && !paused && Boolean(onMultiply);
  return <section className="g4l5-vb015 lesson-text-presentation" data-modern-text-page={c.animationId} data-placement-id={c.placementId}
    data-source-sha={c.sourceSha256} data-frame-domain={c.main.frameDomain} data-lesson-frame={frame} data-child-frame={childFrame} data-lesson-replay={replay} lang="en">
    <style>{CSS}</style><h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="title">{c.title}</h2>
    <p className="g4l5-vb015__instruction" data-lesson-text-block="instruction" aria-hidden={!teaching.instruction || undefined}>
      {teaching.words.map((w,i) => <React.Fragment key={i}>{i > 0 ? ' ' : null}<span className="g4l5-vb015__word" data-source-text-ids={w.sourceTextIds.join(',')} aria-hidden={w.alpha <= 0 || undefined} style={{opacity:w.alpha,visibility:w.alpha>0?'visible':'hidden'}}>{w.text}</span></React.Fragment>)}
    </p>
    <button type="button" className="g4l5-vb015__control" data-source-button="25" data-lesson-text-block="multiply" aria-hidden={teaching.controlAlpha <= 0 || undefined} style={{opacity:teaching.controlAlpha,visibility:teaching.controlAlpha > 0 ? 'visible' : 'hidden'}} disabled={!active} onClick={() => {if(active)onMultiply?.();}}>{c.multiply}</button>
    <div className="g4l5-vb015__scroll" role="region" tabIndex={0} aria-label="Number line from 0 through 50; scroll to inspect both multiplication methods">
      <div className="g4l5-vb015__board" style={{width:`${c.inlineRem}rem`,height:`${c.inlineRem*height/width}rem`}}>
        <svg aria-hidden="true" viewBox={c.viewBox.join(' ')}>{teaching.graphics.filter(g=>g.alpha>0).map((g,i)=><g key={`${g.sourceInstance}-${i}`} data-source-shape={g.character} data-source-instance={g.sourceInstance} transform={`matrix(${g.matrix.join(' ')})`} opacity={g.alpha}>{c.shapes[g.character].paths.map((p,j)=><path key={j} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width}/>)}</g>)}</svg>
        {teaching.labels.filter(l=>l.alpha>0).map(l=><span key={l.id} className="g4l5-vb015__label" data-lesson-text-block={l.id} data-source-character={l.character} data-source-instance={l.sourceInstance} style={{left:`${(l.x-left)/width*100}%`,top:`${(l.y-top)/height*100}%`,opacity:l.alpha}}>{l.runs.map((r,i)=><span key={i} style={{color:r.color}}>{r.text}</span>)}</span>)}
      </div>
    </div>
  </section>;
}

export function createVb015Presentation(getSourceState: (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState,
  Fallback: React.ComponentType<AnimationRendererProps>, sourceAudio: readonly (AudioCue & {readonly sha256: string})[] = []): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  const c = VB015_CONFIG;
  function Session({props, state}: {props: AnimationRendererProps; state: SourceStaticCanvasFrameState}) {
    const [revisionFloor, setRevisionFloor] = useState<number | null>(null);
    const activities = props.lessonActivities ?? (props.lessonActivity ? [props.lessonActivity] : []);
    const observed = revisionFloor === null ? null : observeVb015Child(props.frame, activities, revisionFloor);
    const childFrame = observed?.frame ?? 1;
    return <Vb015Scene frame={state.frame} childFrame={childFrame} replay={props.replay ?? 0} paused={props.paused}
      onMultiply={props.onLessonActivityRequest ? () => {
        const floor = Math.max(-1,...activities.filter(a=>a.sourceInstanceId===c.activity.sourceInstanceId).map(a=>a.revision));
        if(props.onLessonActivityRequest?.({id:c.activity.id,parentFrame:props.frame})===true)setRevisionFloor(floor);
      } : undefined}/>;
  }
  function Renderer(props: AnimationRendererProps) {
    const context = {...props,frameDomain:props.frameDomain??c.main.frameDomain,rootFrame:props.rootFrame??c.main.rootFrame};
    const state = (props.state ?? getSourceState(props.frame,context)) as SourceStaticCanvasFrameState;
    if(getVb015Snapshot(state,context).status!=='ready')return <Fallback {...props} state={state}/>;
    return <Session key={`${context.seed}:${context.replay??0}`} props={props} state={state}/>;
  }
  return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:getVb015Snapshot,playbackMode:'once',
    playbackEndFrameByDomain:{[c.main.frameDomain]:c.main.interactionFrame},reducedMotionFrameByDomain:{[c.main.frameDomain]:c.main.interactionFrame},
    frameControl:{frameDomain:c.main.frameDomain,completionFrame:c.main.interactionFrame,transitions:[]},
    activityTimelines:[c.activity],sourceTimelineAudioCues:sourceAudio};
}
