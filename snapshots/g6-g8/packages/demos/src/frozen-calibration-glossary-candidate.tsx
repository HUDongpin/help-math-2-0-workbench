"use client";

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import {createSourceStaticCanvasCandidate, type SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';

export interface FrozenGlossaryControl {
  readonly sourceCharacterId: number;
  readonly sourceKeyAttribute: string;
  readonly entryId: string;
  readonly labels: Readonly<{en: string; es: string}>;
  readonly ranges: readonly Readonly<{firstFrame: number; lastFrame: number; depth: number}>[];
}

export function validateFrozenGlossaryControls(controls: readonly FrozenGlossaryControl[], frameCount: number): void {
  if (!Number.isSafeInteger(frameCount) || frameCount < 1 || controls.length === 0) throw new Error('Invalid glossary frame domain');
  const ids = new Set<number>();
  for (const control of controls) {
    if (!Number.isSafeInteger(control.sourceCharacterId) || control.sourceCharacterId < 1 || ids.has(control.sourceCharacterId) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(control.entryId) || !control.sourceKeyAttribute.trim() ||
      !control.labels.en.trim() || !control.labels.es.trim() || control.ranges.length === 0) throw new Error('Invalid glossary control');
    ids.add(control.sourceCharacterId);
    const byDepth = new Map<number, number>();
    for (const range of control.ranges) {
      if (![range.firstFrame, range.lastFrame, range.depth].every(Number.isSafeInteger) || range.firstFrame < 1 ||
        range.lastFrame < range.firstFrame || range.lastFrame > frameCount || range.depth < 1 ||
        (byDepth.get(range.depth) ?? 0) >= range.firstFrame) throw new Error('Invalid or overlapping glossary visibility range');
      byDepth.set(range.depth, range.lastFrame);
    }
  }
}

export function visibleFrozenGlossaryControls(controls: readonly FrozenGlossaryControl[], frame: number): readonly FrozenGlossaryControl[] {
  if (!Number.isSafeInteger(frame) || frame < 1) return [];
  return controls.filter(control => control.ranges.some(r => frame >= r.firstFrame && frame <= r.lastFrame));
}

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Same source Canvas with a typed host glossary and exact visible intervals. */
export function createFrozenCalibrationGlossaryCandidate(config: SourceStaticCanvasCandidateConfig, supplied: readonly FrozenGlossaryControl[]) {
  validateFrozenGlossaryControls(supplied, config.mainFrameCount);
  const controls = Object.freeze(supplied.map(c => Object.freeze({...c, labels: Object.freeze({...c.labels}),
    ranges: Object.freeze(c.ranges.map(r => Object.freeze({...r})))})));
  const base = createSourceStaticCanvasCandidate(config);
  const getFrameState = (frame: number, context: RuntimeContext) => Object.freeze({...base.getFrameState(frame, context),
    visibleGlossaryCharacterIds: Object.freeze(visibleFrozenGlossaryControls(controls, frame).map(c => c.sourceCharacterId))});

  function Renderer(props: AnimationRendererProps) {
    const host = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [blocked, setBlocked] = useState(false);
    const visible = visibleFrozenGlossaryControls(controls, props.frame);
    const activeDomain = (props.frameDomain ?? config.mainFrameDomain) === config.mainFrameDomain;
    const eligible = activeDomain && props.scenario === 'source-static-frame' && !props.entryStateSha256;
    const enabled = eligible && ready && Boolean(props.onLessonHostRequest);
    const language = props.uiLanguage ?? props.lang;

    useClientLayoutEffect(() => {
      const n = props.pageInteractionCompanionTargetId ? document.getElementById(props.pageInteractionCompanionTargetId) : null;
      setTarget(n?.dataset.pageInteractionCompanionHost === 'true' ? n : null);
    }, [props.pageInteractionCompanionTargetId]);
    useEffect(() => {
      const node = host.current;
      if (!node) return;
      const observe = () => {
        const canvas = node.querySelector<HTMLElement>('[data-canvas-status]');
        setReady(canvas?.dataset.canvasStatus === 'ready' || canvas?.dataset.canvasStatus === 'updating');
      };
      observe();
      const observer = new MutationObserver(observe);
      observer.observe(node, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-canvas-status']});
      return () => observer.disconnect();
    }, [props.replay]);
    useEffect(() => {setBlocked(false);}, [props.replay]);

    const companion = eligible && visible.length > 0 ? <section
      aria-label={language === 'es' ? 'Glosario de esta página' : 'Glossary for this page'}
      data-frozen-glossary-controls={config.animationId}
      data-source-visible-control-count={visible.length}
      data-controls-ready={enabled ? 'true' : 'false'}
      data-companion-placement={target ? 'portal' : 'inline'}
      style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 12}}>
      {visible.map(control => <button key={control.sourceCharacterId} type="button"
        data-source-character-id={control.sourceCharacterId} data-source-key-attribute={control.sourceKeyAttribute}
        disabled={!enabled} style={{minHeight: 44, padding: '8px 14px', font: '600 1rem system-ui'}}
        onClick={event => {
          if (!enabled) return;
          const decision = props.onLessonHostRequest?.({type: 'open-glossary', entryId: control.entryId}, {trigger: event.currentTarget});
          setBlocked(decision?.status !== 'allowed');
        }}>{control.labels[language]}</button>)}
      {blocked ? <p role="alert">{language === 'es' ? 'El glosario no está disponible.' : 'The glossary is unavailable.'}</p> : null}
    </section> : null;
    return <div ref={host} data-frozen-glossary-candidate={config.animationId} data-source-frame={props.frame}>
      <base.Renderer {...props} />
      {companion && target ? createPortal(companion, target) : companion}
    </div>;
  }

  const module = Object.freeze({...base.module, Renderer, getFrameState,
    lessonHost: Object.freeze({capabilities: Object.freeze(['glossary'] as const),
      legacyOperations: 'blocked' as const, auditStorage: 'memory-only' as const, storesPersonalData: false as const})});
  return Object.freeze({...base, controls, Renderer, getFrameState, module});
}
