'use client';

import type {CSSProperties} from 'react';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import type {
  WholeLessonExitPromptVisualEvidence,
} from '@/lib/whole-lesson-player-descriptor';

type AuthoredStage = Readonly<{width: number; height: number}>;
type ExitHitTarget = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function percent(value: number, total: number) {
  return `${value / total * 100}%`;
}

function sourceImageStyle(
  evidence: WholeLessonExitPromptVisualEvidence,
  stage: AuthoredStage,
) {
  return {
    '--lesson-exit-source-height': percent(
      evidence.exporterCanvas.height,
      stage.height,
    ),
    '--lesson-exit-source-left': percent(
      evidence.rootCompositionOffset.x,
      stage.width,
    ),
    '--lesson-exit-source-top': percent(
      evidence.rootCompositionOffset.y,
      stage.height,
    ),
    '--lesson-exit-source-width': percent(
      evidence.exporterCanvas.width,
      stage.width,
    ),
  } as CSSProperties;
}

function sourceHitStyle(target: ExitHitTarget, stage: AuthoredStage) {
  return {
    '--lesson-exit-hit-center-x': percent(
      target.x + target.width / 2,
      stage.width,
    ),
    '--lesson-exit-hit-center-y': percent(
      target.y + target.height / 2,
      stage.height,
    ),
    '--lesson-exit-hit-height': percent(target.height, stage.height),
    '--lesson-exit-hit-width': percent(target.width, stage.width),
  } as CSSProperties;
}

export function LegacyExitPrompt({
  authoredStage,
  evidence,
  id,
  locale,
  onCancel,
  onConfirmExit,
}: {
  authoredStage: AuthoredStage;
  evidence?: WholeLessonExitPromptVisualEvidence;
  id: string;
  locale: 'en' | 'es';
  onCancel: () => void;
  onConfirmExit: () => void;
}) {
  const spanish = locale === 'es';
  const promptRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const decisionCommittedRef = useRef(false);
  const [decisionCommitted, setDecisionCommitted] = useState(false);
  const [sourceAssetStatus, setSourceAssetStatus] =
    useState<'loading' | 'ready' | 'error'>('loading');
  const useSourceVisual = Boolean(
    evidence && !spanish && sourceAssetStatus !== 'error',
  );
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      cancelRef.current?.focus()
    );
    return () => window.cancelAnimationFrame(frame);
  }, [useSourceVisual]);

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const priorBodyOverflow = body.style.overflow;
    const priorBodyOverscroll = body.style.overscrollBehavior;
    const priorRootOverflow = root.style.overflow;
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    root.style.overflow = 'hidden';

    const keepFocusInDecision = (event: FocusEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        promptRef.current &&
        !promptRef.current.contains(target)
      ) {
        cancelRef.current?.focus();
      }
    };
    document.addEventListener('focusin', keepFocusInDecision, true);
    return () => {
      document.removeEventListener('focusin', keepFocusInDecision, true);
      body.style.overflow = priorBodyOverflow;
      body.style.overscrollBehavior = priorBodyOverscroll;
      root.style.overflow = priorRootOverflow;
    };
  }, []);

  const commitDecision = (decision: 'exit' | 'stay') => {
    if (decisionCommittedRef.current) return;
    decisionCommittedRef.current = true;
    setDecisionCommitted(true);
    if (decision === 'exit') onConfirmExit();
    else onCancel();
  };

  const trapDecisionFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      commitDecision('stay');
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...(promptRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-exit-choice]',
    ) ?? [])];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <div
    aria-describedby={descriptionId}
    aria-labelledby={titleId}
    aria-modal="true"
    className={[
      'lesson-shell2__exit-prompt',
      useSourceVisual
        ? 'lesson-shell2__exit-prompt--source-en'
        : 'lesson-shell2__exit-prompt--modern',
    ].join(' ')}
    data-actionscript-executed="false"
    data-exit-functional-authority="modern-app-local-functional-equivalent"
    data-external-legacy-endpoint-executed="false"
    data-legacy-bookmark-url-executed="false"
    data-legacy-report-url-executed="false"
    data-legacy-window-close-executed="false"
    data-source-animation-id={evidence?.sourceAnimationId}
    data-source-asset-sha256={evidence?.assetSha256}
    data-source-asset-status={evidence ? sourceAssetStatus : 'not-supplied'}
    data-source-character-id={evidence?.sourceCharacterId}
    data-source-frame={evidence?.localFrame}
    data-source-instance-name={evidence?.sourceInstanceName}
    data-source-manifest-sha256={evidence?.manifestSha256}
    data-source-button-character-ids={evidence
      ? `${evidence.sourceButtonCharacterIds.yes},${evidence.sourceButtonCharacterIds.no}`
      : undefined}
    data-source-root-depth={evidence?.rootDepth}
    data-source-root-frame={evidence?.rootFrame}
    data-source-root-offset-x={evidence?.rootCompositionOffset.x}
    data-source-root-offset-y={evidence?.rootCompositionOffset.y}
    data-source-runtime-authority={evidence?.runtimeAuthority ?? 'unresolved'}
    data-source-spanish-translation-supplied="false"
    data-source-swf-sha256={evidence?.sourceSwfSha256}
    data-visual-origin={useSourceVisual
      ? 'source-exact-static-visual-modern-interaction'
      : spanish
        ? 'modern-functional-equivalent-source-spanish-absent'
        : evidence
          ? 'modern-fallback-source-asset-error'
          : 'modern-functional-equivalent-source-evidence-not-supplied'}
    id={id}
    onKeyDown={trapDecisionFocus}
    ref={promptRef}
    role="dialog"
  >
    <h2 className="sr-only" id={titleId}>
      {spanish ? 'Confirmar salida de la lección' : 'Confirm lesson exit'}
    </h2>
    <p className="sr-only" id={descriptionId}>
      {spanish
        ? 'Confirma si quieres salir de esta lección y volver a la biblioteca. No mantiene la lección abierta.'
        : `${evidence?.sourceEnglishText ?? 'Exit this lesson and return to the library?'} Yes returns to the local course library. No keeps this lesson open.`}
    </p>

    {useSourceVisual && evidence
      ? <>
          {/* This is the exact transparent FFDec frame-2 export from the
              hash-bound quit sprite. CSS variables preserve its authored
              800 x 600 root placement; no legacy ActionScript is executed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            className="lesson-shell2__exit-source-image"
            draggable={false}
            height={evidence.exporterCanvas.height}
            onError={() => setSourceAssetStatus('error')}
            onLoad={(event) => {
              setSourceAssetStatus(
                event.currentTarget.naturalWidth ===
                    evidence.exporterCanvas.width &&
                  event.currentTarget.naturalHeight ===
                    evidence.exporterCanvas.height
                  ? 'ready'
                  : 'error',
              );
            }}
            src={`${evidence.asset}?sha256=${evidence.assetSha256}`}
            style={sourceImageStyle(evidence, authoredStage)}
            width={evidence.exporterCanvas.width}
          />
          <button
            aria-label="Yes — exit this lesson and return to the library"
            className="lesson-shell2__exit-source-hit"
            data-exit-choice="exit"
            data-source-button-character-id={
              evidence.sourceButtonCharacterIds.yes
            }
            disabled={decisionCommitted}
            onClick={() => commitDecision('exit')}
            style={sourceHitStyle(evidence.hitTargets.yes, authoredStage)}
            type="button"
          >
            <span className="sr-only">Yes</span>
          </button>
          <button
            aria-label="No — stay in this lesson"
            className="lesson-shell2__exit-source-hit"
            data-exit-choice="stay"
            data-source-button-character-id={
              evidence.sourceButtonCharacterIds.no
            }
            disabled={decisionCommitted}
            onClick={() => commitDecision('stay')}
            ref={cancelRef}
            style={sourceHitStyle(evidence.hitTargets.no, authoredStage)}
            type="button"
          >
            <span className="sr-only">No</span>
          </button>
        </>
      : <div className="lesson-shell2__exit-modern-card">
          <p>{spanish
            ? '¿Seguro que quieres salir de esta lección y volver a la biblioteca?'
            : evidence?.sourceEnglishText ??
              'Exit this lesson and return to the library?'}</p>
          <small>{spanish
            ? 'La fuente no incluye una versión visual en español; esta es una traducción local moderna.'
            : evidence
              ? 'The source image could not be displayed, so this safe local fallback is shown.'
              : 'This lesson has no source-bound Exit visual, so a safe local fallback is shown.'}</small>
          <div>
            <button
              data-exit-choice="exit"
              disabled={decisionCommitted}
              onClick={() => commitDecision('exit')}
              type="button"
            >
              {spanish ? 'Sí, salir' : 'Yes, exit'}
            </button>
            <button
              data-exit-choice="stay"
              disabled={decisionCommitted}
              onClick={() => commitDecision('stay')}
              ref={cancelRef}
              type="button"
            >
              {spanish ? 'No, permanecer' : 'No, stay'}
            </button>
          </div>
        </div>}
  </div>;
}
