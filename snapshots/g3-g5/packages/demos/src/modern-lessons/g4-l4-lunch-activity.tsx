'use client';
import React, {useEffect, useState, type ReactNode} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {LessonCanvasPlane, type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import {buildCanvasAssetRequest, isCompleteTraceCaptureIdentity, type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getLunchActivitySnapshot, type LunchActivityConfig, type LunchActivityFrameReader} from './g4-l4-lunch-activity-state';

const loads = new Map<string, Promise<LessonCanvasPlaneAdapter>>();
const NATIVE_STAGE = Object.freeze({width: 800, height: 600});
const registry = () => (globalThis as typeof globalThis & {
  HELP_MATH_HD_CANVAS_ASSETS?: Record<string, LessonCanvasPlaneAdapter>;
}).HELP_MATH_HD_CANVAS_ASSETS;

export function loadLunchActivityScene(config: Pick<LunchActivityConfig, 'animationId' | 'sourceSwfSha256' | 'adapter'>): Promise<LessonCanvasPlaneAdapter> {
  const request = buildCanvasAssetRequest({animationId: config.adapter.variantId,
    assetSource: config.adapter.url, assetSha256: config.adapter.sha256});
  const cached = loads.get(request.key); if (cached) return cached;
  const promise = new Promise<LessonCanvasPlaneAdapter>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-lunch-activity-scene="${config.adapter.variantId}"]`);
    const exact = existing?.src === new URL(request.src, document.baseURI).href &&
      existing.integrity === request.integrity && existing.crossOrigin === request.crossOrigin &&
      existing.dataset.lunchActivitySha256 === config.adapter.sha256;
    if (existing && !exact) {reject(Error('Lunch activity scene integrity binding changed')); return;}
    const finish = async () => {
      try {
        const adapter = registry()?.[config.adapter.variantId];
        if (!adapter || adapter.metadata.animationId !== config.animationId || adapter.metadata.sourceSwfSha256 !== config.sourceSwfSha256 ||
          typeof adapter.renderWithText !== 'function' || adapter.metadata.resolution?.nativeWidth !== 800 || adapter.metadata.resolution.nativeHeight !== 600) {
          throw Error('Lunch activity scene registered a mismatched source or surface');
        }
        await adapter.ready(); resolve(adapter);
      } catch (error) {reject(error);}
    };
    if (registry()?.[config.adapter.variantId]) {
      if (!exact) {reject(Error('Lunch activity scene has no exact loaded script provenance')); return;}
      void finish(); return;
    }
    const script = existing ?? document.createElement('script');
    script.onload = () => {script.onload = null; script.onerror = null; void finish();};
    script.onerror = () => {script.onload = null; script.onerror = null; reject(Error('Lunch activity scene asset could not load'));};
    if (!existing) {
      script.async = true; script.dataset.lunchActivityScene = config.adapter.variantId; script.dataset.lunchActivitySha256 = config.adapter.sha256;
      script.integrity = request.integrity!; script.crossOrigin = request.crossOrigin; script.src = request.src;
      document.head.appendChild(script);
    }
  }).catch(error => {loads.delete(request.key); throw error;});
  loads.set(request.key, promise); return promise;
}

const STYLES = `
.lunch-activity{display:grid;gap:1.25rem;min-inline-size:0;max-inline-size:84rem;margin-inline:auto;color:#14213d;font-family:var(--lesson-text-font-body,system-ui,sans-serif)}
.lunch-activity h2,.lunch-activity h3,.lunch-activity p{margin:0}
.lunch-activity h2{overflow-wrap:anywhere;word-break:normal;hyphens:auto;letter-spacing:-.01em;font-weight:500}
@container lesson-text (max-width:12rem){.lunch-activity h2{font-variation-settings:"wdth" 75}}
.lunch-activity__layout{display:grid;gap:1.25rem;align-items:start;min-inline-size:0;font-size:var(--lesson-text-body-size);line-height:1.6}
.lunch-activity__scene{margin:0;min-inline-size:0;border:1px solid #cad6e4;border-radius:.75rem;overflow:hidden;background:white}
.lunch-activity__money{padding:.35rem .75rem;color:#173a26;background:#e8f4e9;font-size:1.125em;font-weight:650;font-variant-numeric:tabular-nums}
.lunch-activity__menu{inline-size:100%;table-layout:auto;border-collapse:separate;border-spacing:0;min-inline-size:0;background:#fff;border:1px solid #cad6e4;border-radius:.75rem;padding:.5rem .8rem}
.lunch-activity__menu caption{text-align:start;font:650 1.5rem/1.3 var(--lesson-text-font-heading,system-ui,sans-serif);padding:0 0 .75rem}
.lunch-activity__menu th,.lunch-activity__menu td{padding:.4rem .15rem;border-bottom:1px solid #dce3eb;vertical-align:top}
.lunch-activity__menu th{text-align:start;font-weight:450;overflow-wrap:normal;word-break:normal}
.lunch-activity__menu td{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums;padding-inline-start:.85rem}
.lunch-activity__menu tr:last-child th,.lunch-activity__menu tr:last-child td{border:0}
.lunch-activity__question{border:1px solid #bdab5d;border-radius:.75rem;background:#fff5c2;padding:1rem;font-size:var(--lesson-text-body-size);line-height:1.6}
.lunch-activity__words{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .35em}
.lunch-activity__word,.lunch-activity__term{min-block-size:44px;display:inline-flex;align-items:baseline;flex-wrap:wrap;gap:0 .35em;max-inline-size:100%}
.lunch-activity__term{min-inline-size:44px;appearance:none;border:0;border-radius:.2rem;padding:0;font:inherit;line-height:inherit;color:inherit;background:transparent;text-align:start}
button.lunch-activity__term{cursor:pointer;color:#164b8a;text-decoration:underline;text-underline-offset:.15em}
.lunch-activity__term:focus-visible{outline:3px solid #1457b0;outline-offset:3px}
.lunch-activity__word-piece{white-space:nowrap}
@container lesson-text (min-width:48rem){.lunch-activity__layout,.lunch-activity__question{--lesson-text-body-size:1.25rem}}
@container lesson-text (min-width:54rem){.lunch-activity__layout{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}}
@container lesson-text (max-width:18rem){.lunch-activity__menu tr,.lunch-activity__menu th,.lunch-activity__menu td{display:block}.lunch-activity__menu th{border-bottom:0;padding-bottom:0}.lunch-activity__menu td{text-align:start;padding-top:0;padding-inline-start:.15rem}.lunch-activity__question{padding:.65rem}}
`;

export function LunchActivitySurface({config, snapshot, figure, onLessonHostRequest}: {
  readonly config: LunchActivityConfig; readonly snapshot: TextPresentationSnapshot; readonly figure: ReactNode;
  readonly onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
}) {
  const blocks = Object.fromEntries(snapshot.blocks.map(b => [b.id, b]));
  const frame = snapshot.identity.frame;
  const word = (index: number) => {
    const w = config.words[index], b = blocks[w.id];
    return <span key={w.id} className="lunch-activity__word-piece" data-lesson-text-block={w.id}
      aria-hidden={!b.visible || undefined} style={{visibility: b.visible ? 'visible' : 'hidden'}}>{b.text}{index < config.words.length - 1 ? ' ' : null}</span>;
  };
  return <div className="lesson-text-presentation lunch-activity" data-native-lunch-activity="true" data-native-frame={frame}>
    <style>{STYLES}</style>
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block={config.title.id}>{blocks[config.title.id].text}</h2>
    <div className="lunch-activity__layout">
      <figure className="lunch-activity__scene">{figure}
        {blocks[config.money.id].visible ? <figcaption className="lunch-activity__money" data-lesson-text-block={config.money.id}
          data-source-bitmap-id={config.money.sourceBitmapId}>{blocks[config.money.id].text}</figcaption> : null}
      </figure>
      <table className="lunch-activity__menu">
        <caption data-lesson-text-block={config.menuTitle.id}>{blocks[config.menuTitle.id].text}</caption>
        <tbody>{config.menu.map(row => <tr key={row.id}>
          <th scope="row" data-lesson-text-block={row.foodId}>{blocks[row.foodId].text}</th>
          <td data-lesson-text-block={row.priceId}>{blocks[row.priceId].text}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {frame >= config.questionPanel.firstFrame ? <div className="lunch-activity__question">
      <p className="lunch-activity__words">{config.words.map((w, i) => {
        const term = config.terms.find(t => t.wordIndexes.includes(i));
        if (term && term.wordIndexes[0] !== i) return null;
        if (!term) return <span className="lunch-activity__word" key={w.id}>{word(i)}</span>;
        const children = term.wordIndexes.map(word);
        return frame >= term.visibleFrom && onLessonHostRequest ? <button key={w.id} type="button"
          className="lunch-activity__term" data-source-button-id={term.sourceButtonId} data-keyterm-entry-id={term.entryId}
          onClick={event => onLessonHostRequest({type: 'open-keyterm', entryId: term.entryId,
            sourceAnimationId: config.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'},
          {trigger: event.currentTarget})}>{children}</button>
          : <span className="lunch-activity__term" key={w.id}>{children}</span>;
      })}</p>
    </div> : null}
  </div>;
}

export function createLunchActivityPresentation(config: LunchActivityConfig, readFrame: LunchActivityFrameReader):
  LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  const getSnapshot = (state: SourceStaticCanvasFrameState, context: RuntimeContext) => getLunchActivitySnapshot(config, readFrame, state, context);
  function Renderer(props: AnimationRendererProps) {
    const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? config.frameDomain, rootFrame: props.rootFrame ?? config.rootFrame};
    const state = (props.state === undefined ? readFrame(props.frame, context) : props.state) as SourceStaticCanvasFrameState;
    const snapshot = getSnapshot(state, context);
    const [adapter, setAdapter] = useState<LessonCanvasPlaneAdapter | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      if (snapshot.status !== 'ready') return;
      let cancelled = false;
      void loadLunchActivityScene(config).then(a => {if (!cancelled) setAdapter(a);}).catch(() => {if (!cancelled) setFailed(true);});
      return () => {cancelled = true;};
    }, [snapshot.status]);
    const attributes = {'data-modern-lesson': 'g4-l4-rw004', 'data-presentation-status': snapshot.status === 'ready' ? 'candidate' : 'blocked',
      'data-source-swf-sha256': config.sourceSwfSha256, 'data-flash-frame': snapshot.identity.frame,
      'data-flash-frame-domain': snapshot.identity.frameDomain, 'data-flash-root-frame': snapshot.identity.rootFrame,
      'data-flash-seed': snapshot.identity.seed, 'data-flash-lang': snapshot.identity.language,
      'data-flash-scenario': snapshot.identity.scenario, 'data-replay': snapshot.identity.replay,
      'data-language-policy': props.uiLanguage === 'es' ? 'source-fallback' : 'source', 'data-spanish-translation': 'false',
      'data-original-runtime-accepted': 'false', 'data-owner-accepted': 'false', 'data-strict-migration-complete': 'false'};
    if (snapshot.status !== 'ready') return <section {...attributes} lang="en"/>;
    return <section {...attributes} lang="en">{failed ? <p role="status">The lesson figure could not load.</p> : adapter
      ? <LessonCanvasPlane adapter={adapter} nativeStage={NATIVE_STAGE} sourceBitmapBound={true}
          request={{...context, ...snapshot.identity, lang: 'en'}} snapshot={snapshot}
          renderKey={`${config.animationId}:${JSON.stringify(snapshot.identity)}`} figureLabel="Lunch scene">
          {(committed, figure) => <LunchActivitySurface config={config} snapshot={committed} figure={figure}
            onLessonHostRequest={isCompleteTraceCaptureIdentity(context) ? undefined : props.onLessonHostRequest}/>}
        </LessonCanvasPlane> : <p role="status">Loading lesson figure…</p>}</section>;
  }
  return Object.freeze({schemaVersion: 1, binding: config.binding, Renderer, getSnapshot, playbackMode: 'once',
    playbackEndFrameByDomain: Object.freeze({[config.frameDomain]: config.frameCount}),
    reducedMotionFrameByDomain: Object.freeze({[config.frameDomain]: config.frameCount}),
    sourceTimelineAudioCues: config.sourceAudio, keyTerms: config.keyTerms,
    prepare: async () => {await loadLunchActivityScene(config);}});
}
