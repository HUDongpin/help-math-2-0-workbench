'use client';

import {useLayoutEffect, useRef, useState} from 'react';
import type {P012LessonState} from './alg-l12-p012-lesson';
import {P012_SOURCE, type P012State} from './alg-l12-p012-state';
import {p012TextSnapshot} from './alg-l12-p012-text';

export interface P012DrawingAsset {
  ready(): Promise<void>;
  renderRootFrame6(canvas: HTMLCanvasElement, request: {mainFrame: number}): unknown;
  renderInteractive(canvas: HTMLCanvasElement, state: P012State, options?: {nativeCoordinate: boolean}): unknown;
}

/** Source-vector candidate. Native teaching-text substitution is a separate
 * pending integration; this component never claims typography admission. */
export function P012Drawing({asset, state}: {readonly asset: P012DrawingAsset; readonly state: P012LessonState}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failure, setFailure] = useState(false);
  useLayoutEffect(() => {
    const target = canvas.current;
    if (!target) return;
    target.width = 800; target.height = 600;
    target.dataset.status = 'loading';
    let live = true;
    void asset.ready().then(() => {
      if (!live) return;
      if (state.phase === 'left') {
        target.getContext('2d')?.clearRect(0, 0, 800, 600);
        target.dataset.status = 'left';
      } else {
        if (state.phase === 'interaction') asset.renderInteractive(target, state.interaction, {nativeCoordinate: true});
        else asset.renderRootFrame6(target, {mainFrame: state.frame});
        target.dataset.status = 'ready';
        target.dataset.frame = String(state.frame);
      }
      setFailure(false);
    }).catch(() => {
      if (!live) return;
      target.getContext('2d')?.clearRect(0, 0, 800, 600);
      target.dataset.status = 'error'; setFailure(true);
    });
    return () => {live = false; target.width = 0; target.height = 0;};
  }, [asset, state]);
  const coordinate = p012TextSnapshot(state.frame, state.interaction.coordinateText).coordinate;
  const x = coordinate.x + (state.phase === 'interaction' ? state.interaction.bubble.x - P012_SOURCE.bubbleOrigin.x : 0);
  const y = coordinate.y + (state.phase === 'interaction' ? state.interaction.bubble.y - P012_SOURCE.bubbleOrigin.y : 0);
  return <figure className="p012-source-figure" data-flash-animation-id="shared-alg001-l12-p012"
    data-flash-frame-domain="sprite-86" data-flash-root-frame="6" data-flash-frame={state.frame}>
    <canvas ref={canvas} width={800} height={600} role="img"
      aria-label={`Coordinate plane. Spider ordered pair ${state.interaction.coordinateText}.`}/>
    {state.phase !== 'left' && !failure && <svg className="p012-coordinate-overlay" viewBox="0 0 800 600" aria-hidden="true">
      <text x={x + 34.8077} y={y + 17.355} textAnchor="middle" fontSize="17.355"
        fontFamily="system-ui, sans-serif" data-source-text-id={coordinate.sourceTextId}
        data-source-instance-id={coordinate.instanceId}>{coordinate.text}</text>
    </svg>}
    {failure && <p role="alert">The source illustration could not load. Replay cannot continue until it is available.</p>}
  </figure>;
}
