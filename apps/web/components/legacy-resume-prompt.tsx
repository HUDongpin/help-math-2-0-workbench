'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {BookOpen, Play, RotateCcw} from 'lucide-react';

import type {
  WholeLessonResumePromptVisualEvidence,
} from '@/lib/whole-lesson-player-descriptor';

export function LegacyResumePrompt({
  evidence,
  lessonControlsRemainAvailable = false,
  locale,
  onContinue,
  onStartAtBeginning,
  resumePage,
  resumePageLabel,
  resumePageLabelLanguage,
}: {
  evidence: WholeLessonResumePromptVisualEvidence;
  lessonControlsRemainAvailable?: boolean;
  locale: 'en' | 'es';
  onContinue: () => void;
  onStartAtBeginning: () => void;
  resumePage: number;
  resumePageLabel: string;
  resumePageLabelLanguage: 'en' | 'es';
}) {
  const spanish = locale === 'es';
  const promptRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const decisionCommittedRef = useRef(false);
  const [decisionCommitted, setDecisionCommitted] = useState(false);
  const promptId = useId();
  const titleId = `${promptId}-title`;
  const descriptionId = `${promptId}-description`;
  const locationId = `${promptId}-location`;
  const noteId = `${promptId}-note`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      continueRef.current?.focus({preventScroll: true})
    );
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (lessonControlsRemainAvailable) return;
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
  }, [lessonControlsRemainAvailable]);

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
    if (lessonControlsRemainAvailable) return;
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
    aria-describedby={`${descriptionId} ${locationId} ${noteId}`}
    aria-labelledby={titleId}
    aria-modal={lessonControlsRemainAvailable ? undefined : 'true'}
    className="lesson-shell2__resume-prompt lesson-shell2__resume-prompt--modern"
    data-actionscript-executed="false"
    data-hit-target-geometry="modern-functional-equivalent"
    data-legacy-bookmark-endpoint-executed="false"
    data-local-persistence="local-device-only"
    data-lesson-controls-available={
      lessonControlsRemainAvailable ? 'true' : 'false'
    }
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
    <div
      className="lesson-shell2__resume-modern-card"
      data-visual-origin={spanish
        ? 'modern-functional-equivalent-source-spanish-absent'
        : 'modern-functional-equivalent-source-evidence-retained'}
    >
      <header className="lesson-shell2__resume-modern-header">
        <span aria-hidden="true" className="lesson-shell2__resume-modern-icon">
          <BookOpen />
        </span>
        <div>
          <span className="lesson-shell2__resume-modern-eyebrow">
            {spanish ? 'Progreso guardado en este dispositivo' : 'Saved on this device'}
          </span>
          <h2 id={titleId}>
            {spanish ? '¿Continuamos tu lección?' : 'Continue your lesson?'}
          </h2>
        </div>
      </header>

      <p className="lesson-shell2__resume-modern-lead" id={descriptionId}>
        {spanish
          ? 'Puedes retomar exactamente donde te quedaste o volver a la primera página.'
          : 'Pick up exactly where you stopped, or return to the first page.'}
      </p>

      <div className="lesson-shell2__resume-modern-location" id={locationId}>
        <span>{spanish ? 'Continuar desde' : 'Continue from'}</span>
        <strong>{spanish ? `Página ${resumePage}` : `Page ${resumePage}`}</strong>
        <small lang={resumePageLabelLanguage}>{resumePageLabel}</small>
      </div>

      <p className="lesson-shell2__resume-modern-note" id={noteId}>
        {spanish
          ? 'Empezar en la página 1 solo cambia tu ubicación. Las páginas completadas y el historial de repeticiones siguen guardados en este dispositivo.'
          : 'Starting at Page 1 changes only your place. Completed pages and replay history stay saved on this device.'}
      </p>

      <div className="lesson-shell2__resume-modern-actions">
        <button
          className="lesson-shell2__resume-modern-primary"
          data-resume-choice="continue"
          disabled={decisionCommitted}
          onClick={() => commitDecision('continue')}
          ref={continueRef}
          type="button"
        >
          <Play aria-hidden="true" />
          <span>{spanish
            ? `Continuar en la página ${resumePage}`
            : `Continue from page ${resumePage}`}</span>
        </button>
        <button
          className="lesson-shell2__resume-modern-secondary"
          data-resume-choice="beginning"
          disabled={decisionCommitted}
          onClick={() => commitDecision('beginning')}
          type="button"
        >
          <RotateCcw aria-hidden="true" />
          <span>{spanish ? 'Empezar en la página 1' : 'Start at Page 1'}</span>
        </button>
      </div>
    </div>
  </div>;
}
