'use client';

import React, {useId} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {getCourseG04L03Rw003FrameState, type CourseG04L03Rw003FrameState, COURSE_G04_L03_RW_003_GLOSSARY_CONFIG} from '../timelines/course-g04-l03-rw-003';
import {createCourseG04L03SourceGlossaryOpenResult} from '../timelines/course-g04-l03-source-glossary-interaction';
import {G4_L3_RW003_SOURCE_DATA as GENERATED} from './generated/g4-l3-rw003-source';

type Matrix = readonly number[];
type ColorTransform = {readonly multiply?: readonly number[]; readonly add?: readonly number[]};
type Placement = {readonly instanceId: string; readonly characterId: number; readonly depth: number; readonly matrix: Matrix; readonly colorTransform?: ColorTransform; readonly sourceAlpha: number; readonly ratio: number | null; readonly clipDepth: number | null};
type SourceText = {readonly characterId: number; readonly sourceTextId: string; readonly sourceRunIds: readonly string[]; readonly sourceTagSha256: string; readonly text: string; readonly boundsTwips: {readonly left: number; readonly right: number; readonly top: number; readonly bottom: number}; readonly textMatrix: Matrix};
type SourceInstance = {readonly instanceId: string; readonly timelineId: string; readonly characterId: number; readonly depth: number; readonly firstFrame: number; readonly lastFrameExclusive: number; readonly sourceRunIds?: readonly string[]; readonly visibleRanges: readonly (readonly number[])[]; readonly states: readonly (Omit<Placement, 'instanceId' | 'characterId' | 'depth'> & {readonly firstFrame: number; readonly lastFrame: number})[]};
type PaintPath = {readonly d: string; readonly morph?: {readonly start: string; readonly end: string}; readonly fill?: string; readonly stroke?: string; readonly strokeWidth?: number; readonly fillRule: 'evenodd'};
type SourceShape = {readonly characterId: number; readonly sourceTagSha256: string; readonly role: string; readonly paths: readonly PaintPath[]};
type SourceData = {readonly sourceSha256: string; readonly frameDomain: string; readonly rootFrame: number; readonly frameCount: number; readonly fps: number; readonly rootMatrix: Matrix; readonly stage: {readonly width: number; readonly height: number}; readonly texts: readonly SourceText[]; readonly instances: readonly SourceInstance[]; readonly frames: readonly {readonly frame: number; readonly placements: readonly Placement[]; readonly visibleTextInstanceIds: readonly string[]}[]; readonly shapes: readonly SourceShape[]; readonly rootTitles: readonly {readonly characterId: number; readonly sourceTextId: string; readonly sourceRunIds: readonly string[]; readonly text: string; readonly timelineId: string; readonly instanceId: string; readonly matrix: Matrix}[]; readonly signedScalePairings: readonly {readonly value: number; readonly digitInstanceId: string; readonly minusInstanceId: string | null}[]};
const SOURCE = GENERATED as unknown as SourceData;
const ID = 'course-g04-l03-rw-003';
const VERSION = 'g04-l03-placement-003-native-thermometer-v1';
const TEXTS = new Map(SOURCE.texts.map(t => [t.characterId, t]));
const SHAPES = new Map(SOURCE.shapes.map(s => [s.characterId, s]));
const MAIN_TEXT = SOURCE.instances.filter(i => i.timelineId === SOURCE.frameDomain && TEXTS.has(i.characterId));
const scale = new Map(SOURCE.signedScalePairings.map(p => [p.digitInstanceId, p]));
const mathematicalText = (id: string, character: number, transferredSigns: ReadonlySet<string>) => {
 const pair = scale.get(id);
 return pair ? pair.value < 0 && pair.minusInstanceId && transferredSigns.has(pair.minusInstanceId) ? '−' + Math.abs(pair.value) : String(Math.abs(pair.value)) : [12, 35].includes(character) ? '−' : TEXTS.get(character)!.text;
};
const instancePath = (i: {instanceId: string; timelineId: string; depth: number; characterId: number}) => ({id: i.instanceId, path: [{timelineId: i.timelineId, depth: i.depth, generation: Number(i.instanceId.match(/generation-(\d+)$/)?.[1] ?? 1), characterId: i.characterId}]});

/** Every existing source run is classified. Underscores are authored minus
 * actors: static pairs transfer their sign to the corresponding digit; dynamic
 * actors remain separate, source-positioned minus signs in their own lifetime. */
export const G4_L3_RW003_TEXT_BINDING: LessonTextBinding = {
 schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-003', animationId: ID,
 sourceSwfSha256: SOURCE.sourceSha256, template: 'complex-figure', blocks: [
  ...SOURCE.rootTitles.map((t, n) => ({id: t.instanceId, sourceTextIds: [...t.sourceRunIds], role: n ? 'heading' as const : 'title' as const, language: 'en' as const, readingOrder: n, valueSource: 'source-static' as const})),
  ...MAIN_TEXT.map((i, n) => ({id: i.instanceId, sourceTextIds: [...TEXTS.get(i.characterId)!.sourceRunIds], role: i.characterId === 16 ? 'body' as const : 'label' as const, language: 'en' as const, readingOrder: n + 10, valueSource: 'maintained-page-state' as const, instance: instancePath(i)})),
  {id: 'figure-description', sourceTextIds: [], sourceShapeIds: SOURCE.shapes.map(s => s.characterId), role: 'body', language: 'en', readingOrder: 2, valueSource: 'maintained-page-state'},
 ]
};
export const RW003_SHAPE_DISPOSITIONS = {
 maskCharacters: [1, 15, 17],
 rootBorderCharacter: 54,
 glossaryHitCharacter: 32,
 glossaryHitSourceButtons: [33, 46],
 glossaryHitPolicy: 'Source shape32 is hitTest-only in both button records, never up/over/down paint. Native named44px buttons dispatch the same typed source terms; no phantom source hit-region artwork.',
 paintOrder: 'Main source placements paint in source depth order with exact mask ancestry; root54 border follows the main actor at fixed rootframe6.',
 modernPalette: 'Exact geometry/morph endpoints/alpha/transform retained; generated source-owned opaque representative palette replaces source gradient/shading, whose original fidelity remains pending.'
} as const;
export const RW003_MATHEMATICAL_DISPOSITION = {
 staticUnderscoreCharacter: 12, dynamicUnderscoreCharacter: 35,
 staticPairs: SOURCE.signedScalePairings,
 sourceTextRetained: '_', nativeSymbol: '−',
 rule: 'Static source minus/digit pairs form signed scale labels only while both actors have the same positive alpha and mask ancestry; dynamic source minus actors preserve their exact per-instance frame, alpha, transform and removal. No string-wide underscore replacement.'
} as const;
export function getG4L3Rw003Scene(frame: number) {
 if (!Number.isInteger(frame) || frame < 1 || frame > SOURCE.frameCount) throw new RangeError('RW003 source frame outside sprite-49');
 return SOURCE.frames[frame - 1];
}
export function getG4L3Rw003FigureDescription(frame: number) {
 const scene = getG4L3Rw003Scene(frame), ids = new Set(scene.visibleTextInstanceIds), transfers = getRw003StaticSignTransfers(scene.placements);
 const ticks = SOURCE.signedScalePairings.filter(p => ids.has(p.digitInstanceId)).map(p => p.value < 0 && p.minusInstanceId && !transfers.has(p.minusInstanceId) ? Math.abs(p.value) : p.value);
 const parts = ['Thermometer.'];
 if (ticks.length) parts.push('Scale values from top to bottom: ' + ticks.map(v => v < 0 ? 'negative ' + Math.abs(v) : String(v)).join(', ') + '.');
 const labels = MAIN_TEXT.filter(i => !scale.has(i.instanceId) && ![12, 16, 35].includes(i.characterId) && ids.has(i.instanceId));
 if (labels.length) parts.push('Source-visible labels: ' + labels.map(i => mathematicalText(i.instanceId, i.characterId, transfers)).join(', ') + '.');
 return parts.join(' ');
}
export function getG4L3Rw003TextSnapshot(state: CourseG04L03Rw003FrameState, context: RuntimeContext): TextPresentationSnapshot {
 const blockers: string[] = [];
 if (state.sourceSwfSha256 !== SOURCE.sourceSha256) blockers.push('source-identity-mismatch');
 if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
 if (state.frameDomain !== SOURCE.frameDomain || (context.frameDomain ?? SOURCE.frameDomain) !== SOURCE.frameDomain) blockers.push('unsupported-frame-domain');
 if (state.rootFrame !== SOURCE.rootFrame || (context.rootFrame ?? SOURCE.rootFrame) !== SOURCE.rootFrame) blockers.push('root-frame-mismatch');
 if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
 if (state.language !== 'en' || context.lang !== 'en') blockers.push('english-source-visuals-only');
 if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > SOURCE.frameCount || state.frame !== context.frame) blockers.push('source-frame-mismatch');
 if (!Number.isInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff || state.seed !== context.seed) blockers.push('source-seed-mismatch');
 if (context.replay !== undefined && (!Number.isInteger(context.replay) || context.replay < 0)) blockers.push('invalid-replay');
 if (context.entryStateSha256) blockers.push('captured-entry-state-not-supported');
 const values = new Map<string, {text: string; visible: boolean}>();
 for (const title of SOURCE.rootTitles) values.set(title.instanceId, {text: title.text, visible: true});
 if (!blockers.length) {
  const scene = getG4L3Rw003Scene(state.frame), ids = new Set(scene.visibleTextInstanceIds), transfers = getRw003StaticSignTransfers(scene.placements);
  for (const i of MAIN_TEXT) values.set(i.instanceId, {text: mathematicalText(i.instanceId, i.characterId, transfers), visible: ids.has(i.instanceId)});
  values.set('figure-description', {text: getG4L3Rw003FigureDescription(state.frame), visible: true});
 }
 return {schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: SOURCE.sourceSha256,
  status: blockers.length ? 'blocked' : 'ready', blockers,
  identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
  suppressedInstances: [], blocks: blockers.length ? [] : G4_L3_RW003_TEXT_BINDING.blocks.map(b => ({id: b.id, role: b.role, language: b.language, readingOrder: b.readingOrder, ...values.get(b.id)!}))};
}

/** Same command topology, interpolated from the cached source morph endpoints.
 * No source script or renderer asset is executed by this native view. */
export function interpolateRw003Path(path: PaintPath, ratio: number | null) {
 if (!path.morph) return path.d;
 const start = path.morph.start, end = path.morph.end;
 const numbers = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
 if (start.replace(numbers, '#') !== end.replace(numbers, '#')) throw new Error('RW003 morph command topology mismatch');
 const a = [...start.matchAll(numbers)].map(m => Number(m[0])), b = [...end.matchAll(numbers)].map(m => Number(m[0]));
 if (a.length !== b.length) throw new Error('RW003 morph coordinate count mismatch');
 const t = Math.max(0, Math.min(65535, ratio ?? 0)) / 65535;
 if (t === 0 || t === 1) return (t === 0 ? start : end).replace(numbers, n => String(Number(n)));
 let ix = 0;
 return start.replace(numbers, () => {const n = a[ix] + (b[ix] - a[ix]) * t; ix++; return String(n);});
}
const point = (m: Matrix, x: number, y: number) => ({x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5]});
function nativeAnchor(p: Placement, t: SourceText) {
 // DefineText bounds already include TextMatrix. Applying its translation again
 // moves explanation16 and terms31/45 out of their actual source mask/geometry.
 const b = t.boundsTwips, placed = point(p.matrix, scale.has(p.instanceId) ? b.right : (b.left + b.right) / 2, (b.top + b.bottom) / 2), global = point(SOURCE.rootMatrix, placed.x, placed.y);
 return {x: global.x / 20, y: global.y / 20};
}
const clipsFor = (nodes: readonly Placement[], actor: Placement) => nodes.filter(n => n.clipDepth !== null && n.depth < actor.depth && n.clipDepth >= actor.depth);
const opacity = (p: Placement) => Math.max(0, Math.min(1, p.sourceAlpha));
/** Keep a separate source minus actor unless joining it preserves this frame's
 * alpha and clipping. The retained static five pairs satisfy this at all278
 * frames; dynamic character35 is never transferred or collapsed. */
export function getRw003StaticSignTransfers(nodes: readonly Placement[]) {
 const byId = new Map(nodes.map(n => [n.instanceId, n])), transferred = new Set<string>();
 for (const pair of SOURCE.signedScalePairings) {
  if (!pair.minusInstanceId) continue;
  const digit = byId.get(pair.digitInstanceId), minus = byId.get(pair.minusInstanceId);
  if (!digit || !minus || opacity(digit) <= 0 || opacity(minus) !== opacity(digit)) continue;
  if (clipsFor(nodes, digit).map(m => m.instanceId).join('|') !== clipsFor(nodes, minus).map(m => m.instanceId).join('|')) continue;
  transferred.add(pair.minusInstanceId);
 }
 return transferred;
}
function nestedClips(children: React.ReactNode, masks: readonly Placement[], prefix: string) {
 return masks.reduceRight<React.ReactNode>((node, mask) => <g key={mask.instanceId} clipPath={'url(#' + prefix + '-mask-' + mask.depth + ')'}>{node}</g>, children);
}
function SourceDiagram({nodes, prefix, frame}: {nodes: readonly Placement[]; prefix: string; frame: number}) {
 const maskNodes = nodes.filter(n => n.clipDepth !== null && SHAPES.has(n.characterId));
 const transferredSigns = getRw003StaticSignTransfers(nodes);
 const rootShapes = SOURCE.instances.filter(i => i.timelineId === 'root' && i.firstFrame <= SOURCE.rootFrame && i.lastFrameExclusive > SOURCE.rootFrame && SHAPES.has(i.characterId)).map(i => {
  const state = i.states.find(s => s.firstFrame <= SOURCE.rootFrame && s.lastFrame >= SOURCE.rootFrame)!;
  return {instanceId: i.instanceId, characterId: i.characterId, depth: i.depth, ...state};
 });
 return <svg className="rw003-diagram" viewBox={'0 0 ' + SOURCE.stage.width + ' ' + SOURCE.stage.height} role="img" aria-label={getG4L3Rw003FigureDescription(frame)} focusable="false">
  <defs>{maskNodes.map(n => <clipPath id={prefix + '-mask-' + n.depth} key={n.instanceId} clipPathUnits="userSpaceOnUse" data-source-mask={n.characterId} data-source-clip-depth={n.clipDepth!}>
   {SHAPES.get(n.characterId)!.paths.map((p, ix) => <path key={ix} transform={'scale(.05) matrix(' + SOURCE.rootMatrix.join(' ') + ') matrix(' + n.matrix.join(' ') + ')'} d={interpolateRw003Path(p, n.ratio)} fillRule={p.fillRule} clipRule={p.fillRule}/>)}
  </clipPath>)}</defs>
  {nodes.filter(n => n.clipDepth === null && opacity(n) > 0).map(n => {
   let paint: React.ReactNode = null;
   if (SHAPES.has(n.characterId)) paint = <g data-source-shape-id={n.characterId} data-source-instance={n.instanceId} data-source-shape-role={SHAPES.get(n.characterId)!.role} data-source-alpha={n.sourceAlpha} data-source-ratio={n.ratio ?? 0} data-source-color-transform={JSON.stringify(n.colorTransform)} opacity={opacity(n)} transform={'scale(.05) matrix(' + SOURCE.rootMatrix.join(' ') + ') matrix(' + n.matrix.join(' ') + ')'}>
    {SHAPES.get(n.characterId)!.paths.map((p, ix) => <path key={ix} d={interpolateRw003Path(p, n.ratio)} fill={p.fill ?? 'none'} stroke={p.stroke ?? 'none'} strokeWidth={p.strokeWidth} fillRule={p.fillRule} strokeLinecap="round" strokeLinejoin="round"/>)}
   </g>;
   else if (TEXTS.has(n.characterId) && !transferredSigns.has(n.instanceId)) {
    const t = TEXTS.get(n.characterId)!, anchor = nativeAnchor(n, t), copy = mathematicalText(n.instanceId, n.characterId, transferredSigns);
    paint = <text className={'rw003-label' + (n.characterId === 16 ? ' rw003-explanation' : '')} x={anchor.x} y={anchor.y} textAnchor={scale.has(n.instanceId) ? 'end' : 'middle'} dominantBaseline="central" fontSize={SOURCE.stage.width / 60 * 1.125}
     data-lesson-text-block={n.instanceId} data-source-character={n.characterId} data-source-instance={n.instanceId} data-source-alpha={n.sourceAlpha} data-source-matrix={n.matrix.join(' ')} data-source-text-matrix={t.textMatrix.join(' ')} data-source-transferred-minus={scale.get(n.instanceId)?.minusInstanceId && transferredSigns.has(scale.get(n.instanceId)!.minusInstanceId!) ? scale.get(n.instanceId)!.minusInstanceId : undefined} data-native-glyph-rem="1.125" opacity={opacity(n)}>{copy}</text>;
   }
   return paint ? <React.Fragment key={n.instanceId}>{nestedClips(paint, clipsFor(nodes, n), prefix)}</React.Fragment> : null;
  })}
  {rootShapes.filter(n => opacity(n) > 0).map(n => <g key={n.instanceId} data-source-shape-id={n.characterId} data-source-instance={n.instanceId} data-source-root-shape="true" data-source-shape-role={SHAPES.get(n.characterId)!.role} data-source-alpha={n.sourceAlpha} opacity={opacity(n)} transform={'scale(.05) matrix(' + n.matrix.join(' ') + ')'}>
   {SHAPES.get(n.characterId)!.paths.map((p, ix) => <path key={ix} d={interpolateRw003Path(p, n.ratio)} fill={p.fill ?? 'none'} stroke={p.stroke ?? 'none'} strokeWidth={p.strokeWidth} fillRule={p.fillRule}/>)}
  </g>)}
 </svg>;
}
const CSS = `
.rw003-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#16364a;display:grid;gap:1rem;min-inline-size:0;max-inline-size:80rem;margin-inline:auto}
.rw003-modern h2,.rw003-modern h3{font-family:var(--lesson-font-display,var(--lesson-font-body,system-ui,sans-serif));margin:0;line-height:1.3;overflow-wrap:anywhere}
.rw003-modern h2{font-size:1.75rem}.rw003-modern h3{font-size:1.25rem}
.rw003-viewport{overflow:auto;max-inline-size:100%;max-block-size:min(32rem,70vh);border:1px solid #718399;border-radius:.75rem;background:#f5f9fd;overscroll-behavior:contain}
.rw003-diagram{display:block;inline-size:60rem;max-inline-size:none;block-size:auto}
.rw003-label{font-family:var(--lesson-font-body,system-ui,sans-serif);font-weight:700;fill:#16364a;pointer-events:none;font-variant-numeric:tabular-nums}
.rw003-explanation{font-weight:400}
.rw003-terms{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;min-inline-size:0}
.rw003-modern .rw003-term{font:inherit;font-size:1.125rem;font-weight:700;color:#005a9c;background:white;border:1px solid #52738a;border-radius:.35rem;min-block-size:44px;min-inline-size:44px;padding:.3rem .65rem;text-decoration:underline;text-underline-offset:.15em}
.rw003-term:focus-visible,.rw003-viewport:focus-visible{outline:3px solid #005a9c;outline-offset:-3px}
.rw003-scroll-help{font-size:1rem;line-height:1.5;margin:0;overflow-wrap:anywhere}
`;
export function createRw003GlossaryRequest(frame: number, termId: string) {
 // English teaching source uses its exact EN index on either UI route.
 return createCourseG04L03SourceGlossaryOpenResult({config: COURSE_G04_L03_RW_003_GLOSSARY_CONFIG, frame, lang: 'en', termId});
}
export function G4L3Rw003ModernRenderer(props: AnimationRendererProps) {
 const prefix = useId().replace(/:/g, ''), context = {...props, frameDomain: props.frameDomain ?? SOURCE.frameDomain, rootFrame: props.rootFrame ?? SOURCE.rootFrame};
 const state = (props.state ?? getCourseG04L03Rw003FrameState(props.frame, context)) as CourseG04L03Rw003FrameState;
 const snapshot = getG4L3Rw003TextSnapshot(state, context);
 if (snapshot.status !== 'ready') return <p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
 const scene = getG4L3Rw003Scene(state.frame), description = snapshot.blocks.find(b => b.id === 'figure-description')!.text;
 const ui = props.uiLanguage ?? props.lang;
 const visibleTerms = COURSE_G04_L03_RW_003_GLOSSARY_CONFIG.terms.filter(t => state.frame >= t.firstFrame && state.frame <= t.lastFrame && scene.placements.some(n => n.characterId === t.characterId && opacity(n) > 0));
 return <section className="rw003-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status="ready" data-source-frame={state.frame} data-source-frame-domain={state.frameDomain} data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-source-swf-sha256={SOURCE.sourceSha256} data-lesson-replay={props.replay ?? 0} data-source-language-policy={ui === 'es' ? 'source-English-fallback' : 'source-English'}>
  <style>{CSS}</style>
  {SOURCE.rootTitles.map((t, i) => i ? <h3 key={t.instanceId} data-lesson-text-block={t.instanceId} data-source-character={t.characterId} data-source-instance={t.instanceId} data-source-matrix={t.matrix.join(' ')}>{t.text}</h3> : <h2 key={t.instanceId} data-lesson-text-block={t.instanceId} data-source-character={t.characterId} data-source-instance={t.instanceId} data-source-matrix={t.matrix.join(' ')}>{t.text}</h2>)}
  <p className="rw003-scroll-help" lang={ui}>{ui === 'es' ? 'Con el termómetro enfocado, usa las flechas para desplazarte.' : 'With the thermometer focused, use the arrow keys to scroll.'}</p>
  <div className="rw003-viewport" role="region" tabIndex={0} aria-label={description}><SourceDiagram nodes={scene.placements} prefix={prefix} frame={state.frame}/></div>
  {visibleTerms.length > 0 && <div className="rw003-terms" role="group" aria-label="Source glossary terms">{visibleTerms.map(t => <button key={t.id} type="button" className="rw003-term" data-source-button-id={t.characterId} data-source-hit-shape-id="32" data-source-term-id={t.id} data-keyterm-entry-id={t.entryIds.en} disabled={!props.onLessonHostRequest}
   onClick={e => {const result = createRw003GlossaryRequest(state.frame, t.id); if (result) props.onLessonHostRequest?.(result.request, {trigger: e.currentTarget});}}>{t.labels.en}</button>)}</div>}
 </section>;
}
export const G4_L3_RW003_TEXT_PRESENTATION: LessonTextPresentationCapability<CourseG04L03Rw003FrameState> = {
 schemaVersion: 1, binding: G4_L3_RW003_TEXT_BINDING, Renderer: G4L3Rw003ModernRenderer,
 getSnapshot: getG4L3Rw003TextSnapshot, playbackMode: 'once',
 playbackEndFrameByDomain: {'sprite-49': 278}, reducedMotionFrameByDomain: {'sprite-49': 278},
 keyTerms: {indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml', sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749', entryIds: COURSE_G04_L03_RW_003_GLOSSARY_CONFIG.terms.map(t => t.entryIds.en)}
};
