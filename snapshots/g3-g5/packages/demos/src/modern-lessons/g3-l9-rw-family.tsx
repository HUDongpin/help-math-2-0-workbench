'use client';

import React, {useEffect, useState, type ReactNode} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {LessonCanvasPlane, type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import {buildCanvasAssetRequest, isCompleteTraceCaptureIdentity, type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {buildG3L9RwBinding, getG3L9RwSnapshot, getG3L9RwTeachingState,
  type RwFrameReader, type RwItemId, type RwPageConfiguration} from './g3-l9-rw-state';
import {G3_L9_RW_KEY_TERMS, G3_L9_RW_KEYTERM_TARGETS, g3L9RwSourceButtonId} from './g3-l9-rw-keyterms';
import {ASSIGNED_SOURCE_MAIN_AUDIO} from './generated/assigned-main-audio-v1';

const loads = new Map<string, Promise<LessonCanvasPlaneAdapter>>();
const NATIVE_STAGE = Object.freeze({width: 800, height: 600});
const registry = () => (globalThis as typeof globalThis & {
  HELP_MATH_HD_CANVAS_ASSETS?: Record<string, LessonCanvasPlaneAdapter>;
}).HELP_MATH_HD_CANVAS_ASSETS;

/** SRI and exact script provenance are required even for an already registered
 * variant. Existing variants with another digest are never silently reused. */
export function loadG3L9RwScene(config: RwPageConfiguration): Promise<LessonCanvasPlaneAdapter> {
  const request = buildCanvasAssetRequest({animationId: config.adapter.variantId,
    assetSource: config.adapter.url, assetSha256: config.adapter.sha256});
  const prior = loads.get(request.key); if (prior) return prior;
  const promise = new Promise<LessonCanvasPlaneAdapter>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-rw-scene="${config.adapter.variantId}"]`);
    const exact = existing?.src === new URL(request.src, document.baseURI).href &&
      existing.integrity === request.integrity && existing.crossOrigin === request.crossOrigin &&
      existing.dataset.rwSceneSha256 === config.adapter.sha256;
    if (existing && !exact) {reject(Error('RW scene script integrity binding changed')); return;}
    const finish = async () => {
      try {
        const adapter = registry()?.[config.adapter.variantId];
        if (!adapter || adapter.metadata.animationId !== config.animationId || adapter.metadata.sourceSwfSha256 !== config.sourceSwfSha256 ||
            typeof adapter.renderWithText !== 'function' || adapter.metadata.resolution?.nativeWidth !== 800 || adapter.metadata.resolution.nativeHeight !== 600) {
          throw Error('RW scene registered a mismatched source or surface');
        }
        await adapter.ready(); resolve(adapter);
      } catch (error) {reject(error);}
    };
    if (registry()?.[config.adapter.variantId]) {
      if (!exact) {reject(Error('RW scene has no exact loaded script provenance')); return;}
      void finish(); return;
    }
    const script = existing ?? document.createElement('script');
    script.onload = () => {
      script.onload = null;
      script.onerror = null;
      void finish();
    };
    script.onerror = () => {
      script.onload = null;
      script.onerror = null;
      reject(Error('RW scene asset could not load'));
    };
    if (!existing) {
      script.async = true; script.dataset.rwScene = config.adapter.variantId; script.dataset.rwSceneSha256 = config.adapter.sha256;
      script.integrity = request.integrity!; script.crossOrigin = request.crossOrigin; script.src = request.src;
      document.head.appendChild(script);
    }
  }).catch(error => {loads.delete(request.key); throw error;});
  loads.set(request.key, promise); return promise;
}

const STYLES = `
.rw-modern{font-family:var(--lesson-text-font-body,system-ui,sans-serif);color:#14213d;display:grid;gap:1.25rem;min-inline-size:0;container-type:inline-size;max-inline-size:78rem;margin-inline:auto}
.rw-modern h2,.rw-modern h3,.rw-modern p{margin:0}
.rw-modern__title{font-family:var(--lesson-text-font-heading,system-ui,sans-serif);font-size:clamp(1.75rem,2.1rem,2.25rem);line-height:1.2;font-weight:650}
.rw-modern__intro{font-size:1.125rem;line-height:1.6}
.rw-modern__layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(19rem,1fr);gap:1.25rem;align-items:start}
.rw-modern__scene{margin:0;min-inline-size:0;border:1px solid #cbd7e5;border-radius:.875rem;overflow:hidden;background:#fff}
.rw-modern__checklist{display:grid;gap:.75rem;min-inline-size:0}
.rw-modern__group{border:1px solid #cbd7e5;border-radius:.875rem;background:white;padding:.875rem;min-inline-size:0}
.rw-modern__examples{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin:.5rem 0 0;padding:0;list-style:none}
.rw-modern__example{min-inline-size:0;display:grid;grid-template-rows:auto 5rem;align-items:start;gap:.25rem;border:2px solid transparent;border-radius:.5rem;padding:.35rem}
.rw-modern__example[data-emphasized=true]{border-color:#155ac1;background:#edf4ff}
.rw-modern__label{font-size:1.125rem;line-height:1.45;overflow-wrap:normal}
.rw-modern .rw-modern__term{appearance:none;border:0;border-radius:.25rem;padding:0 .1rem;min-block-size:44px;min-inline-size:44px;max-inline-size:100%;font:inherit;line-height:inherit;color:#174fa5;background:transparent;cursor:pointer;text-align:start;text-decoration:underline;text-underline-offset:.15em}
.rw-modern__term:focus-visible{outline:3px solid #155ac1;outline-offset:2px}
.rw-modern__check{display:inline-block;font-size:1.25rem;font-weight:800;color:#17603b;margin-inline-end:.25rem}
.rw-modern__diagram{display:grid;place-items:center;inline-size:100%;block-size:5rem}
.rw-modern__diagram svg{display:block;inline-size:100%;block-size:100%;max-inline-size:9rem}
.rw-modern__letter{font-size:3.5rem;font-weight:800;line-height:1;color:#2059cd}
@container(max-width:58rem){.rw-modern__layout{grid-template-columns:minmax(0,1fr)}.rw-modern__checklist{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container(max-width:38rem){.rw-modern__checklist{grid-template-columns:minmax(0,1fr)}.rw-modern__title{font-size:1.75rem}}
@container(max-width:16rem){.rw-modern__examples{grid-template-columns:minmax(0,1fr)}}
`;

function GeometryExample({id, snapshot}: {readonly id: RwItemId; readonly snapshot: TextPresentationSnapshot}) {
  if (id === 'line-symmetry') return <span className="rw-modern__letter" data-lesson-text-block="symmetry-letter">
    {snapshot.blocks.find(block => block.id === 'symmetry-letter')!.text}</span>;
  const content = id === 'trapezoid' ? <polygon points="40,12 100,12 118,72 22,72" fill="#b722d0"/>
    : id === 'rhombus' ? <polygon points="48,12 108,12 72,60 12,60" fill="#62a91b"/>
    : id === 'cylinder' ? <><path d="M30 24 V66 A40 12 0 0 0 110 66 V24" fill="#b3a70d"/><ellipse cx="70" cy="24" rx="40" ry="12" fill="#eee83f"/></>
    : id === 'rectangular-prism' ? <><polygon points="18,34 98,34 98,63 18,63" fill="#e24f37"/>
      <polygon points="18,34 48,16 128,16 98,34" fill="#f1a43f"/><polygon points="98,34 128,16 128,45 98,63" fill="#923c32"/></>
    : id === 'rotational-symmetry' ? <polygon points={Array.from({length: 10}, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 5, radius = index % 2 === 0 ? 38 : 15;
      return `${70 + Math.cos(angle) * radius},${44 + Math.sin(angle) * radius}`;
    }).join(' ')} fill="#16a8ad"/>
    : <g fill="none" stroke="#2059cd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {id === 'parallel-lines' ? <><path d="M20 65 L90 15 M50 75 L120 25"/><path d="M20 65 L23 54 M20 65 L32 65 M90 15 L78 15 M90 15 L87 26 M50 75 L53 64 M50 75 L62 75 M120 25 L108 25 M120 25 L117 36"/></>
        : <><path d="M22 16 L118 72 M22 72 L118 16"/><path d="M22 16 L26 28 M22 16 L35 15 M118 72 L105 73 M118 72 L114 60 M22 72 L35 73 M22 72 L26 60 M118 16 L105 15 M118 16 L114 28"/></>}
    </g>;
  return <svg viewBox="0 0 140 88" aria-hidden="true" focusable="false">{content}</svg>;
}

export function G3L9RwNativeSurface({config, snapshot, figure, onLessonHostRequest}: {
  readonly config: RwPageConfiguration; readonly snapshot: TextPresentationSnapshot; readonly figure: ReactNode;
  readonly onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
}) {
  const blocks = Object.fromEntries(snapshot.blocks.map(block => [block.id, block]));
  const teaching = getG3L9RwTeachingState(config, snapshot.identity.frame);
  const groups = [
    {heading: 'polygons-heading', items: ['trapezoid', 'rhombus']},
    {heading: 'solids-heading', items: ['cylinder', 'rectangular-prism']},
    {heading: 'symmetry-heading', items: ['line-symmetry', 'rotational-symmetry']},
    {heading: 'lines-heading', items: ['parallel-lines', 'intersecting-lines']},
  ] as const;
  const text = (id: keyof typeof G3_L9_RW_KEYTERM_TARGETS) => {
    const target = G3_L9_RW_KEYTERM_TARGETS[id];
    if (!onLessonHostRequest) return blocks[id].text;
    return <>{target.prefix}<button type="button" className="rw-modern__term"
      data-keyterm-entry-id={target.entryId} data-source-button-id={g3L9RwSourceButtonId(config.id, target.offset)}
      onClick={event => onLessonHostRequest({type: 'open-keyterm', entryId: target.entryId,
        sourceAnimationId: config.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'},
      {trigger: event.currentTarget})}>{target.label}</button></>;
  };
  return <div className="lesson-text-presentation rw-modern" data-native-rw-checklist="true" data-native-frame={snapshot.identity.frame}>
    <style>{STYLES}</style>
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{blocks['root-title'].text}</h2>
    <h2 className="rw-modern__title" data-lesson-text-block="heading">{blocks.heading.text}</h2>
    <p className="rw-modern__intro" data-lesson-text-block="intro">{blocks.intro.text}</p>
    <div className="rw-modern__layout">
      <figure className="rw-modern__scene">{figure}</figure>
      <div className="rw-modern__checklist">
        {groups.map(group => <section key={group.heading} className="rw-modern__group" aria-labelledby={`${config.id}-${group.heading}`}>
          <h3 className="lesson-text-presentation__block lesson-text-presentation__block--heading" id={`${config.id}-${group.heading}`} data-lesson-text-block={group.heading}>{text(group.heading)}</h3>
          <ul className="rw-modern__examples">
            {group.items.map(id => <li key={id} className="rw-modern__example" data-rw-item={id}
              data-checked={blocks[`check-${id}`].visible} data-emphasized={teaching.emphasized.includes(id)}>
              <span className="rw-modern__label">
                {blocks[`check-${id}`].visible ? <span className="rw-modern__check" data-lesson-text-block={`check-${id}`}
                  role="img" aria-label={`${blocks[id].text}: found`}>{blocks[`check-${id}`].text}</span> : null}
                <span data-lesson-text-block={id}>{text(id)}</span>
              </span>
              <div className="rw-modern__diagram"><GeometryExample id={id} snapshot={snapshot}/></div>
            </li>)}
          </ul>
        </section>)}
      </div>
    </div>
  </div>;
}

export function createG3L9RwModernLesson(config: RwPageConfiguration, readFrame: RwFrameReader):
  LessonTextPresentationCapability<SourceStaticCanvasFrameState> & {readonly prepare: () => Promise<void>} {
  const binding = buildG3L9RwBinding(config);
  const getSnapshot = (state: SourceStaticCanvasFrameState, context: RuntimeContext) => getG3L9RwSnapshot(config, readFrame, state, context);
  function Renderer(props: AnimationRendererProps) {
    const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? config.domain, rootFrame: props.rootFrame ?? 6};
    const state = (props.state === undefined ? readFrame(props.frame, context) : props.state) as SourceStaticCanvasFrameState;
    const snapshot = getSnapshot(state, context);
    const [adapter, setAdapter] = useState<LessonCanvasPlaneAdapter | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      if (snapshot.status !== 'ready') return;
      let cancelled = false;
      void loadG3L9RwScene(config).then(loaded => {if (!cancelled) setAdapter(loaded);})
        .catch(() => {if (!cancelled) setFailed(true);});
      return () => {cancelled = true;};
    }, [snapshot.status]);
    const attributes = {'data-modern-lesson': config.id, 'data-presentation-status': snapshot.status === 'ready' ? 'candidate' : 'blocked',
      'data-source-swf-sha256': config.sourceSwfSha256, 'data-flash-frame': snapshot.identity.frame,
      'data-flash-frame-domain': snapshot.identity.frameDomain, 'data-flash-root-frame': snapshot.identity.rootFrame,
      'data-flash-seed': snapshot.identity.seed, 'data-flash-lang': snapshot.identity.language,
      'data-flash-scenario': snapshot.identity.scenario, 'data-replay': snapshot.identity.replay,
      'data-language-policy': props.uiLanguage === 'es' ? 'source-fallback' : 'source', 'data-spanish-translation': 'false',
      'data-original-runtime-accepted': 'false', 'data-owner-accepted': 'false', 'data-strict-migration-complete': 'false'};
    if (snapshot.status !== 'ready') return <section {...attributes} lang="en"/>;
    return <section {...attributes} lang="en">
      {failed ? <p role="status">The lesson figure could not load.</p> : adapter
        ? <LessonCanvasPlane adapter={adapter} nativeStage={NATIVE_STAGE} request={{...context, ...snapshot.identity, lang: 'en'}}
            snapshot={snapshot} renderKey={`${config.id}:${JSON.stringify(snapshot.identity)}`} figureLabel={config.texts[0].text}>
            {(committed, figure) => <G3L9RwNativeSurface config={config} snapshot={committed} figure={figure}
              onLessonHostRequest={isCompleteTraceCaptureIdentity(context) ? undefined : props.onLessonHostRequest}/>}
          </LessonCanvasPlane>
        : <p role="status">Loading lesson figure…</p>}
    </section>;
  }
  return Object.freeze({schemaVersion: 1, binding, Renderer, getSnapshot, keyTerms: G3_L9_RW_KEY_TERMS,
    sourceTimelineAudioCues: Object.freeze([ASSIGNED_SOURCE_MAIN_AUDIO[config.animationId]]),
    // The source removes its checks before the ending frame. Preserve each
    // page's last fully populated source checklist when motion is reduced.
    reducedMotionFrameByDomain: Object.freeze({[config.domain]: config.id === 'g3-l9-rw003' ? 811 : config.id === 'g3-l9-rw004' ? 649 : 1006}),
    prepare: async () => {await loadG3L9RwScene(config);}});
}
