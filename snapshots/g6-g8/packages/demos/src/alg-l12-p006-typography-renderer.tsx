'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import type {TextPresentationSnapshot} from './lesson-text-contract';
import {LessonTextPresentation} from './lesson-text-presentation';
import {loadP006TypographyAsset, type P006TypographyAsset} from './alg-l12-p006-typography-asset';
import {p006TextSnapshot} from './alg-l12-p006-typography';
import './alg-l12-p006-typography.css';

/** Source graphics stay at their native resolution; browser text reflows independently.
 * The existing audio transport owns all time. Resize/font changes cannot seek it. */
export function P006TypographyRenderer(props: AnimationRendererProps) {
  const [asset, setAsset] = useState<P006TypographyAsset | null>(null);
  const [error, setError] = useState(false);
  const [committed, setCommitted] = useState<TextPresentationSnapshot | null>(null);
  const [presented, setPresented] = useState<TextPresentationSnapshot | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const staging = useRef<HTMLCanvasElement | null>(null);
  const frame = props.frame;
  const replay = props.replay ?? 0;
  useEffect(() => {
    let active = true;
    void loadP006TypographyAsset().then(value => {if (active) setAsset(value);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);
  useEffect(() => () => {
    if (staging.current) {staging.current.width = 0; staging.current.height = 0;}
    staging.current = null;
  }, []);
  useLayoutEffect(() => {
    if (!asset) return;
    const request = {frame, frameDomain: props.frameDomain ?? 'sprite-53', rootFrame: props.rootFrame ?? 6,
      scenario: props.scenario, lang: props.lang, seed: props.seed, replay};
    const snapshot = p006TextSnapshot(request);
    try {
      if (snapshot.status !== 'ready') throw Error('P006 text state unavailable');
      if (!staging.current) {
        const created = document.createElement('canvas');
        created.width = 800; created.height = 600; staging.current = created;
      }
      const surface = staging.current;
      const requested = snapshot.suppressedInstances.map(instance => instance.id);
      const result = asset.renderWithText(surface, {...request, text: {suppressInstanceIds: requested}});
      const state = result.state;
      if (result.unfulfilledSuppressionIds.length || result.suppressedInstanceIds.length !== requested.length ||
        requested.some(id => !result.suppressedInstanceIds.includes(id)) ||
        (state.localFrame ?? state.frame) !== frame || state.frameDomain !== request.frameDomain ||
        state.rootFrame !== 6 || (state.language ?? state.lang) !== 'en' ||
        state.scenario !== request.scenario || state.seed !== 0) throw Error('P006 text and graphics differ');
      // Canvas and native text must commit together before paint; this effect
      // responds only to a new host frame/replay or the one asset readiness edge.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommitted(snapshot); setError(false);
    } catch {
      setCommitted(null); setError(true);
    }
  }, [asset, frame, replay, props.frameDomain, props.rootFrame, props.scenario, props.lang, props.seed]);
  useLayoutEffect(() => {
    const target = canvas.current, surface = staging.current;
    if (!target || !surface || !committed || error) return;
    try {
      const context = target.getContext('2d');
      if (!context) throw Error('P006 visible canvas unavailable');
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, 800, 600); context.drawImage(surface, 0, 0);
      // Readiness includes the visible copy, not only the offscreen render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPresented(committed);
    } catch {
      setPresented(null); setCommitted(null); setError(true);
    }
  }, [committed, error]);
  const figure = <canvas ref={canvas} width={800} height={600} role="img"
    aria-label="A bridge over a canyon in the real-world graphing activity"
    data-p006-native-figure="true" data-canvas-frame={committed?.identity.frame}
    style={{display: 'block', width: '100%', maxWidth: 800, margin: '0 auto', height: 'auto', aspectRatio: '800 / 600'}}/>;
  return <section className="p006-source-native" data-p006-typography="native-v1" data-canvas-status={error ? 'error' : committed && presented === committed ? 'ready' : 'loading'}
    data-source-bitmap-resolution="native-800x600" lang="en">
    {error ? <p role="alert">The lesson text and illustration could not load together. Reload this page to try again.</p>
      : committed ? <LessonTextPresentation snapshot={committed} template="explanation"
        figure={figure} figureReadingOrder={2} figureLabel="Graphing in the coordinate plane"/>
        : <p role="status">Loading lesson text and illustration…</p>}
    {props.uiLanguage === 'es' ? <p className="lesson-text-language-note" lang="es"
      data-lesson-text-language="en" data-spanish-translation="missing">
      Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.
    </p> : null}
  </section>;
}
