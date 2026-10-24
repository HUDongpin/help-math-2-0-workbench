'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {RuntimeContext} from '../contract';
import {renderNmsL09P003CanvasCandidate,
  type NmsL09P003CanvasCandidate} from
  './shared-nms002-l09-p003-canvas-bridge';
import type {NmsL09P003ClockState} from
  './shared-nms002-l09-p003-source-clock';
import {NmsL09P003NativeText} from
  './shared-nms002-l09-p003-native-text';
import './shared-nms002-l09-p003-native-candidate.css';

type DrawResult = ReturnType<typeof renderNmsL09P003CanvasCandidate>;

/** Local candidate only. The parent supplies the source clock and a prepared,
 * hash-bound v5 asset. This component owns no playback or audio state. */
export function NmsL09P003NativeCandidate({adapter, clock, context, onResult}: {
  readonly adapter: NmsL09P003CanvasCandidate;
  readonly clock: NmsL09P003ClockState;
  readonly context: RuntimeContext;
  readonly onResult?: (result: DrawResult) => void;
}) {
  const visible = useRef<HTMLCanvasElement>(null);
  const staging = useRef<HTMLCanvasElement | null>(null);
  const [readyAdapter, setReadyAdapter] = useState<NmsL09P003CanvasCandidate | null>(null);
  const [committed, setCommitted] = useState<{
    adapter: NmsL09P003CanvasCandidate;
    key: string;
    result: DrawResult;
  } | null>(null);
  const [error, setError] = useState(false);
  const callback = useRef(onResult);
  callback.current = onResult;
  useEffect(() => {
    let cancelled = false;
    setReadyAdapter(null);
    void adapter.ready().then(() => {
      if (!cancelled) setReadyAdapter(adapter);
    }).catch(() => {if (!cancelled) setError(true);});
    return () => {cancelled = true;};
  }, [adapter]);
  const key = JSON.stringify([clock.frame, clock.revision,
    context.frame, context.frameDomain, context.rootFrame,
    context.scenario, context.lang, context.seed, context.replay]);
  useLayoutEffect(() => {
    if (readyAdapter !== adapter) return;
    try {
      const canvas = staging.current ?? document.createElement('canvas');
      if (canvas.width !== 800) canvas.width = 800;
      if (canvas.height !== 600) canvas.height = 600;
      staging.current = canvas;
      const result = renderNmsL09P003CanvasCandidate({adapter, canvas,
        clock, context});
      setCommitted({adapter, key, result});
      setError(false);
    } catch {
      setCommitted(null);
      setError(true);
    }
  }, [adapter, readyAdapter, key]);
  const current = committed?.adapter === adapter && committed.key === key
    ? committed.result : null;
  useLayoutEffect(() => {
    if (!current || !visible.current || !staging.current) return;
    const canvas = visible.current;
    if (canvas.width !== 800) canvas.width = 800;
    if (canvas.height !== 600) canvas.height = 600;
    const drawing = canvas.getContext('2d');
    if (!drawing) {setError(true); return;}
    try {
      drawing.setTransform(1, 0, 0, 1, 0, 0);
      drawing.clearRect(0, 0, 800, 600);
      drawing.drawImage(staging.current, 0, 0);
      callback.current?.(current);
    } catch {
      setError(true);
    }
  }, [current]);
  const active = readyAdapter === adapter && current && !error;
  const canvasLabel = current?.emphasisRow
    ? 'Fish-food bags beside the schedule; red circles emphasize the current group.'
    : 'Animated fish-food bags beside the feeding schedule.';
  return <section className="nms-l09-p003-candidate"
    data-animation-id="shared-nms002-l09-p003"
    data-flash-frame={active ? clock.frame : undefined}
    data-flash-frame-domain={active ? clock.frameDomain : undefined}
    data-flash-root-frame={active ? clock.rootFrame : undefined}
    data-p003-status={error ? 'error' : active ? current.status : 'loading'}
    data-p003-canvas-scale="1" data-source-alignment="unregistered-candidate">
    {error ? <p role="status">The lesson figure could not load.</p>
      : active ? <>
        {current.sourceLanguagePolicy === 'source-fallback' && <p
          className="nms-l09-p003-candidate__fallback" lang="es"
        >Texto original de la lección en inglés.</p>}
        <div className="nms-l09-p003-candidate__stage">
          {current.status === 'ready' && <NmsL09P003NativeText
            snapshot={current.snapshot} emphasisRow={current.emphasisRow}/>}
          <canvas ref={visible} width={800} height={600}
            className="nms-l09-p003-candidate__canvas"
            role="img" aria-label={canvasLabel}/>
        </div>
      </> : <p role="status">Loading lesson figure…</p>}
  </section>;
}
