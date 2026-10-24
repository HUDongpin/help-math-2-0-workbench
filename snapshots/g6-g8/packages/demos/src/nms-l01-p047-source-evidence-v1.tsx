'use client';
import React, {useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {createP047SourceCanvas} from './generated/nms-l01-p047-source-canvas-v4';

/** Deterministic structural drawing surface, separate from the native lesson
 * player. It executes no ActionScript, timer, audio, navigation or report. */
export function P047SourceEvidenceRenderer(props: AnimationRendererProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const adapter = useRef<ReturnType<typeof createP047SourceCanvas> | null>(null);
  const [ready, setReady] = useState(false), [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!canvas.current) return;
    const source = createP047SourceCanvas(canvas.current); adapter.current = source;
    void source.ready().then(() => { if (active) setReady(true); }).catch(() => { if (active) setFailure('Source images could not be prepared.'); });
    return () => { active = false; if (adapter.current === source) adapter.current = null; };
  }, []);
  useEffect(() => {
    if (!ready || !canvas.current || !adapter.current) return;
    const domain = props.frameDomain ?? 'sprite-1024', root = domain === 'root';
    try {
      if (!Number.isInteger(props.frame) || props.frame < 1 || props.frame > (root ? 10 : 74)
        || !['root', 'sprite-1024'].includes(domain) || props.lang !== 'en') throw Error('Unsupported source frame identity.');
      const frame = root ? 1 : props.frame;
      const selected = /^source-review-[ABCD]$/.test(props.scenario) ? props.scenario.slice(-1) : undefined;
      if (frame >= 47 && frame <= 73 && !selected) throw Error('A review capture requires its explicit selected-answer scenario.');
      const ctx = canvas.current.getContext('2d'); if (!ctx) throw Error('Canvas is unavailable.');
      if (root && props.frame < 6) { ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,800,600); }
      else adapter.current.render({mainFrame: frame, ordinal: 1, selected});
      setFailure(null);
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Source capture failed.'); }
  }, [ready, props.frame, props.frameDomain, props.scenario, props.lang]);
  return <div data-animation-id="shared-nms002-l01-p047" data-flash-frame={props.frame}
    data-flash-frame-domain={props.frameDomain ?? 'sprite-1024'} data-flash-root-frame={props.frameDomain === 'root' ? props.frame : props.rootFrame ?? 6}
    data-flash-scenario={props.scenario} data-flash-lang={props.lang} data-flash-seed={props.seed}
    data-flash-requirement-id={props.requirementId} data-flash-trace-id={props.traceId} data-flash-entry-state-sha256={props.entryStateSha256}
    data-render-state={failure ? 'blocked' : ready ? 'ready' : 'loading'} data-source-device-font-fallback="Arial">
    {failure && <p role="alert">{failure}</p>}
    <canvas ref={canvas} width={800} height={600} aria-label="Source drawing reference for the positive and negative numbers final quiz"
      style={{display: failure ? 'none' : 'block', width: '100%', height: 'auto'}}/>
  </div>;
}
