'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationRendererProps} from '../contract';
import {
  initialP003GlossaryState,
  replayP003Glossary,
  retainedP003GlossaryButtons,
  type P003GlossaryState,
} from '../alg-l12-p003-glossary-state';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {
  P003_MODERN_HOST_CLOSE_POLICY,
  SHARED_ALG001_L12_P003_CONFIG,
  SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES,
  SHARED_ALG001_L12_P003_SOURCE,
  closeP003GlossaryForHost,
  prepareP003GlossaryRequest,
  sourceFrameForP003Host,
  syncP003HostTransport,
} from '../timelines/shared-alg001-l12-p003';

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P003_CONFIG);
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const P003_COMPANION_SUFFIX = 'p003-glossary-controls';

function P003Companion({children, targetId}: {children: React.ReactNode; targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    const validId = targetId === P003_COMPANION_SUFFIX ||
      targetId?.endsWith(`-${P003_COMPANION_SUFFIX}`);
    const element = validId && targetId ? document.getElementById(targetId) : null;
    setTarget(element?.dataset.pageInteractionCompanionHost === 'true' ? element : null);
  }, [targetId]);
  return target ? createPortal(children, target) : children;
}

function P003Renderer(props: AnimationRendererProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<P003GlossaryState>(initialP003GlossaryState());
  const [glossary, setGlossary] = useState(glossaryRef.current);
  const [canvasReady, setCanvasReady] = useState(false);
  const [requestBlocked, setRequestBlocked] = useState(false);
  const mainDomain = props.frameDomain === undefined ||
    props.frameDomain === SHARED_ALG001_L12_P003_CONFIG.mainFrameDomain;
  const sourceScenario = props.scenario === 'source-static-frame';
  const sourceFrame = sourceFrameForP003Host(glossary, props.frame);
  const visibleButtons = mainDomain && sourceScenario
    ? retainedP003GlossaryButtons(sourceFrame)
    : [];
  const controlsReady = canvasReady && Boolean(props.onLessonHostRequest) &&
    mainDomain && sourceScenario && !props.entryStateSha256 &&
    !glossary.pendingGlossary && !requestBlocked && props.lang === 'en';

  useEffect(() => {
    const reset = replayP003Glossary();
    glossaryRef.current = reset;
    setGlossary(reset);
    setRequestBlocked(false);
  }, [props.replay]);

  useEffect(() => {
    const current = glossaryRef.current;
    const next = syncP003HostTransport(current, props.frame, props.paused === true);
    if (next !== current) {
      glossaryRef.current = next;
      setGlossary(next);
    }
  }, [props.frame, props.paused]);

  useEffect(() => {
    const pending = glossary.pendingGlossary;
    if (!pending || requestBlocked || typeof document === 'undefined') return;
    const entry = SHARED_ALG001_L12_P003_GLOSSARY_ENTRIES.find(
      item => item.characterId === pending.sourceCharacterId,
    );
    if (!entry) return;
    const selector = `[role="dialog"][data-glossary-entry-id="${entry.entryId}"]` +
      `[data-source-key-attribute="${pending.term}"]`;
    let observedDialog: Element | null = null;
    let observer: MutationObserver | null = null;
    const update = () => {
      const player = hostRef.current?.closest(
        '[data-lesson-player][data-current-animation-id="shared-alg001-l12-p003"]',
      );
      const activePlayers = document.querySelectorAll(
        '[data-lesson-player][data-current-animation-id="shared-alg001-l12-p003"]',
      );
      const dialogs = document.querySelectorAll(selector);
      // The host portals its dialog to body. Only one exact P003 player and
      // one matching dialog may establish a close transition.
      if (!player || activePlayers.length !== 1) return;
      if (!observedDialog && dialogs.length === 1) {
        observedDialog = dialogs[0];
      } else if (observedDialog && !document.body.contains(observedDialog) && dialogs.length === 0) {
        observer?.disconnect();
        const closed = closeP003GlossaryForHost(glossaryRef.current);
        glossaryRef.current = closed;
        setGlossary(closed);
      }
    };
    update();
    observer = new MutationObserver(update);
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [glossary.pendingGlossary, requestBlocked]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => {
      const surface = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"][data-canvas-status]',
      );
      setCanvasReady(surface?.dataset.canvasStatus === 'ready');
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {attributeFilter: ['data-canvas-status'], attributes: true, childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.replay]);

  const requestGlossary = (characterId: number, trigger: HTMLButtonElement) => {
    if (!controlsReady || !props.onLessonHostRequest) return;
    const current = syncP003HostTransport(
      {...glossaryRef.current, frame: sourceFrame}, sourceFrame, props.paused === true,
    );
    const prepared = prepareP003GlossaryRequest(current, characterId);
    if (!prepared) return;
    glossaryRef.current = prepared.state;
    setGlossary(prepared.state);
    const decision = props.onLessonHostRequest(prepared.request, {trigger});
    setRequestBlocked(decision?.status !== 'allowed');
  };

  return (
    <div
      data-animation-id={SHARED_ALG001_L12_P003_CONFIG.animationId}
      data-audio-acceptance="pending"
      data-audio-playback="disabled"
      data-glossary-close-policy={P003_MODERN_HOST_CLOSE_POLICY}
      data-glossary-request={glossary.pendingGlossary?.term ?? undefined}
      data-glossary-transport={glossary.transport}
      data-original-runtime-parity="pending"
      data-spanish-text="english-source-fallback-translation-pending"
      ref={hostRef}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <candidate.Renderer {...props} frame={sourceFrame} state={undefined} />
      <P003Companion targetId={props.pageInteractionCompanionTargetId}>
        <div
          data-animation-id="shared-alg001-l12-p003"
          data-page-interaction-companion-suffix={P003_COMPANION_SUFFIX}
          data-page-interaction-companion-surface="shared-alg001-l12-p003-glossary"
        >
          {visibleButtons.length > 0 ? (
            <div
              aria-label={props.uiLanguage === 'es' ? 'Términos de la página' : 'Page glossary terms'}
              data-current-js-controls-ready={controlsReady ? 'true' : 'false'}
              data-source-action="DoHyperLinks"
              data-source-animation-stop="on-release"
              role="group"
              style={{display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 0'}}
            >
              {visibleButtons.map(button => (
                <button
                  data-source-character-id={button.characterId}
                  data-source-depth={button.depth}
                  data-source-key-attribute={button.term}
                  disabled={!controlsReady}
                  key={button.characterId}
                  lang="en"
                  onClick={event => requestGlossary(button.characterId, event.currentTarget)}
                  style={{minHeight: 44, padding: '8px 12px'}}
                  type="button"
                >
                  {button.term}
                </button>
              ))}
            </div>
          ) : null}
          {glossary.pendingGlossary ? (
            <p aria-live="polite" data-source-stop-frame={glossary.frame}>
              {props.uiLanguage === 'es'
                ? 'La animación se detuvo para la consulta del glosario. Al cerrar, el anfitrión restaura el estado de reproducción anterior.'
                : 'The animation stopped for the glossary request. Closing it restores the host’s prior playback state.'}
            </p>
          ) : null}
          {!glossary.pendingGlossary && glossary.transport === 'paused' ? (
            <p aria-live="polite">
              {props.uiLanguage === 'es'
                ? 'La animación sigue en pausa. Use Reproducir para continuar.'
                : 'The animation remains paused. Use Play to continue.'}
            </p>
          ) : null}
          {requestBlocked ? (
            <p role="alert">
              {props.uiLanguage === 'es'
                ? 'El anfitrión no aceptó la consulta. La animación permanece detenida.'
                : 'The host did not accept the glossary request. The animation remains stopped.'}
            </p>
          ) : null}
          <p data-source-language="en" lang="en">
            Source drawing and glossary terms are English. Spanish mathematical text and translation have not been verified.
          </p>
          <p>Audio is disabled: embedded stream and lesson-SA timing, language, and listening remain unresolved.</p>
        </div>
      </P003Companion>
    </div>
  );
}

export {SHARED_ALG001_L12_P003_SOURCE};
export const SHARED_ALG001_L12_P003_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P003_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P003_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P003_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P003_RENDERER = P003Renderer;
export const SHARED_ALG001_L12_P003_CLOSE_STATE = closeP003GlossaryForHost;

export default Object.freeze({
  ...candidate.module,
  lessonHost: Object.freeze({
    capabilities: Object.freeze(['glossary'] as const),
    legacyOperations: 'blocked' as const,
    auditStorage: 'memory-only' as const,
    storesPersonalData: false as const,
  }),
  maturity: 'private-current-js' as const,
  Renderer: P003Renderer,
});
