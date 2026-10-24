'use client';

import React, {useEffect, useState} from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {ALG_L06_P001_GLYPHS} from '../alg-l06-p001-glyph-paths';
import {ALG_L06_P001_SOURCE, sourceTitleState} from '../alg-l06-p001-title-state';
import {P001TitleView} from '../alg-l06-p001-title-view';

const DOMAIN = 'sprite-142';
const SCENARIO = 'source-static-frame';
type Glyphs = readonly [string, string];

function exact(frame: number, context: RuntimeContext) {
  if (context.frame !== frame || context.frameDomain !== DOMAIN ||
      context.rootFrame !== ALG_L06_P001_SOURCE.rootEntryFrame ||
      context.scenario !== SCENARIO || (context.lang !== 'en' && context.lang !== 'es') || context.seed !== 0) {
    throw new Error('P001 requires the exact nested source context');
  }
}

function getFrameState(frame: number, context: RuntimeContext) {
  exact(frame, context);
  return Object.freeze({...sourceTitleState(frame), frameDomain: DOMAIN,
    scenario: SCENARIO, language: context.lang});
}

async function glyphDataUrls(): Promise<Glyphs> {
  const values = await Promise.all(ALG_L06_P001_GLYPHS.map(async glyph => {
    const response = await fetch(glyph.href, {cache: 'no-store'});
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/svg+xml')) {
      throw new Error('P001 glyph unavailable');
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
      .map(value => value.toString(16).padStart(2, '0')).join('');
    if (digest !== glyph.sha256) throw new Error('P001 glyph hash mismatch');
    return `data:image/svg+xml;base64,${btoa(String.fromCharCode(...bytes))}`;
  }));
  return values as unknown as Glyphs;
}

function Renderer(props: AnimationRendererProps) {
  exact(props.frame, {frame: props.frame, frameDomain: props.frameDomain,
    rootFrame: props.rootFrame, scenario: props.scenario, lang: props.lang,
    seed: props.seed});
  // The course host enables audio for the lesson. This page has no admitted stream.
  const [glyphs, setGlyphs] = useState<Glyphs | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void glyphDataUrls().then(value => {if (active) setGlyphs(value);})
      .catch(() => {if (active) setFailed(true);});
    return () => {active = false;};
  }, []);
  if (failed) return <p role="status">Source title glyphs could not load.</p>;
  if (!glyphs) return <p role="status">Loading source title…</p>;
  return <P001TitleView frame={props.frame}
    uiLanguage={props.uiLanguage ?? props.lang} textAssetHrefs={glyphs} registered/>;
}

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}),
  fps: 12, frameCount: 10, durationMs: 10000 / 12});

/** Silent page-renderer candidate; original audio remains a separate open gate. */
const animationModule: AnimationModule<ReturnType<typeof getFrameState>> = Object.freeze({
  key: ALG_L06_P001_SOURCE.animationId,
  movie,
  runtime: Object.freeze({...movie, defaultFrameDomain: DOMAIN,
    frameDomains: Object.freeze([{id: 'root', frameCount: 10},
      {id: DOMAIN, frameCount: ALG_L06_P001_SOURCE.frameCount,
        rootFrame: ALG_L06_P001_SOURCE.rootEntryFrame}])}),
  maturity: 'private-current-js',
  playbackMode: 'once',
  playbackEndFrameByDomain: Object.freeze({root: ALG_L06_P001_SOURCE.rootEntryFrame,
    [DOMAIN]: ALG_L06_P001_SOURCE.frameCount}),
  reducedMotionFrame: 133,
  scenarios: Object.freeze([{id: SCENARIO, label: 'Source frame'}]),
  defaultScenarioByFrameDomain: Object.freeze({[DOMAIN]: SCENARIO}),
  audioCues: Object.freeze([]),
  Renderer,
  getFrameState,
});

export default animationModule;
