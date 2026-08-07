'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import type {
  WholeLessonResumePromptVisualEvidence,
} from '@/lib/whole-lesson-player-descriptor';

export function LegacyResumePrompt({
  evidence,
  locale,
  onContinue,
  onStartAtBeginning,
  resumePage,
  resumePageLabel,
}: {
  evidence: WholeLessonResumePromptVisualEvidence;
  locale: 'en' | 'es';
  onContinue: () => void;
  onStartAtBeginning: () => void;
  resumePage: number;
  resumePageLabel: string;
}) {
  const spanish = locale === 'es';
  const promptRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const decisionCommittedRef = useRef(false);
  const [decisionCommitted, setDecisionCommitted] = useState(false);
  const [sourceAssetStatus, setSourceAssetStatus] =
    useState<'loading' | 'ready' | 'error'>('loading');
  const useSourceVisual = !spanish && sourceAssetStatus !== 'error';
  const titleId = 'legacy-resume-prompt-title';
  const descriptionId = 'legacy-resume-prompt-description';

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      continueRef.current?.focus()
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
        continueRef.current?.focus();
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

  const commitDecision = (decision: 'continue' | 'beginning') => {
    if (decisionCommittedRef.current) return;
    decisionCommittedRef.current = true;
    setDecisionCommitted(true);
    if (decision === 'continue') onContinue();
    else onStartAtBeginning();
  };

  const trapDecisionFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // The source prompt requires an explicit Yes/No decision. Escape does
      // not silently choose a branch.
      event.preventDefault();
      continueRef.current?.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...(promptRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-resume-choice]',
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
      'lesson-shell2__resume-prompt',
      useSourceVisual
        ? 'lesson-shell2__resume-prompt--source-en'
        : 'lesson-shell2__resume-prompt--modern',
    ].join(' ')}
    data-actionscript-executed="false"
    data-hit-target-geometry={
      useSourceVisual
        ? 'image-aligned-modern-touch-target-original-bounds-not-derived'
        : 'modern-functional-equivalent'
    }
    data-legacy-bookmark-endpoint-executed="false"
    data-local-persistence="local-device-only"
    data-resume-functional-authority="modern-local-functional-equivalent"
    data-source-animation-id={evidence.sourceAnimationId}
    data-source-asset-sha256={evidence.assetSha256}
    data-source-character-id={evidence.sourceCharacterId}
    data-source-frame={evidence.localFrame}
    data-source-instance-name={evidence.sourceInstanceName}
    data-source-manifest-sha256={evidence.manifestSha256}
    data-source-root-offset-x={evidence.rootCompositionOffset.x}
    data-source-root-offset-y={evidence.rootCompositionOffset.y}
    data-source-root-frame={evidence.rootFrame}
    data-source-runtime-authority={evidence.runtimeAuthority}
    data-source-spanish-translation-supplied="false"
    onKeyDown={trapDecisionFocus}
    ref={promptRef}
    role="dialog"
  >
    <h2 className="sr-only" id={titleId}>
      {spanish ? 'Continuar la lección' : 'Resume lesson'}
    </h2>
    <p className="sr-only" id={descriptionId}>
      {spanish
        ? `Hay progreso guardado en este navegador. Puedes continuar en la página ${resumePage}, ${resumePageLabel}, o comenzar desde la primera página sin borrar el historial de revisión.`
        : `${evidence.sourceEnglishText} The saved local position is page ${resumePage}, ${resumePageLabel}. Starting at the beginning keeps local review history.`}
    </p>

    {useSourceVisual
      ? <>
          {/* This image is the exact transparent FFDec frame-2 export. Its
              root composition offset is encoded in responsive CSS so the
              dialog remains at its source 800 × 600 placement. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            className="lesson-shell2__resume-source-image"
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
            width={evidence.exporterCanvas.width}
          />
          <button
            aria-label={`Yes — continue at page ${resumePage}: ${resumePageLabel}`}
            className="lesson-shell2__resume-source-hit lesson-shell2__resume-source-hit--yes"
            data-resume-choice="continue"
            disabled={decisionCommitted}
            onClick={() => commitDecision('continue')}
            ref={continueRef}
            type="button"
          >
            <span className="sr-only">Yes</span>
          </button>
          <button
            aria-label="No — start at the beginning of the lesson"
            className="lesson-shell2__resume-source-hit lesson-shell2__resume-source-hit--no"
            data-resume-choice="beginning"
            disabled={decisionCommitted}
            onClick={() => commitDecision('beginning')}
            type="button"
          >
            <span className="sr-only">No</span>
          </button>
        </>
      : <div
          className="lesson-shell2__resume-modern-card"
          data-visual-origin={spanish
            ? 'modern-functional-equivalent-source-spanish-absent'
            : 'modern-fallback-source-asset-error'}
        >
          <p>{spanish
            ? '¿Quieres volver al lugar donde dejaste la lección?'
            : 'Do you want to return to where you stopped in the lesson?'}</p>
          <small>{spanish
            ? `Posición guardada: página ${resumePage}, ${resumePageLabel}. La fuente no incluye una versión visual en español.`
            : `Saved position: page ${resumePage}, ${resumePageLabel}. The source image could not be displayed, so this safe local fallback is shown.`}</small>
          <div>
            <button
              data-resume-choice="continue"
              disabled={decisionCommitted}
              onClick={() => commitDecision('continue')}
              ref={continueRef}
              type="button"
            >
              {spanish ? 'Sí, continuar' : 'Yes, continue'}
            </button>
            <button
              data-resume-choice="beginning"
              disabled={decisionCommitted}
              onClick={() => commitDecision('beginning')}
              type="button"
            >
              {spanish ? 'No, comenzar desde el inicio' : 'No, start at the beginning'}
            </button>
          </div>
        </div>}
  </div>;
}
