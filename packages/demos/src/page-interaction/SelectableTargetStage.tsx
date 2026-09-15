'use client';

import {useEffect, useState} from 'react';

import {localized, type AnimationLanguage, type PageInteractionSpec} from './contract';
import {displayedFlashFrame} from './frame';

function copy(lang: AnimationLanguage) {
  return lang === 'es'
    ? {
        success: 'Correcto.',
        retry: 'Esa no es la respuesta. Inténtalo de nuevo.',
        hint: 'Elige una respuesta. También puedes usar el teclado.'
      }
    : {
        success: 'Correct.',
        retry: 'That is not the answer. Try again.',
        hint: 'Choose an answer. Keyboard activation works too.'
      };
}

export function SelectableTargetStage({
  captureFrame,
  interactive = true,
  lang,
  onSolved,
  replayNonce,
  spec,
  stageTargetId
}: {
  captureFrame?: number;
  interactive?: boolean;
  lang: AnimationLanguage;
  onSolved?: () => void;
  replayNonce: number;
  spec: PageInteractionSpec;
  stageTargetId: string;
}) {
  const choices = spec.choices ?? [];
  const labels = copy(lang);
  const frozen = !interactive || captureFrame != null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const solved = status === 'correct';
  const flashFrame = displayedFlashFrame(captureFrame, spec.frameCount, solved);

  useEffect(() => {
    setSelectedId(null);
    setStatus('idle');
  }, [replayNonce, spec.animationId]);

  const choose = (choiceId: string) => {
    if (frozen) return;
    const choice = choices.find((item) => item.id === choiceId);
    if (!choice) return;
    setSelectedId(choiceId);
    if (choice.correct) {
      setStatus('correct');
      onSolved?.();
      return;
    }
    setStatus('incorrect');
  };

  return (
    <div
      className="page-interaction-stage"
      data-flash-frame={String(flashFrame)}
      data-interactive={frozen ? 'false' : 'true'}
      data-interaction-kind="selectable-targets"
      data-original-flash-pointer-lifecycle-established={
        spec.pointerLifecycle.originalFlashPointerLifecycleEstablished ? 'true' : 'false'
      }
      data-page-interaction-stage-target-id={stageTargetId}
      data-solved={solved ? 'true' : 'false'}
      id={stageTargetId}
    >
      <p className="page-interaction-stage__prompt">{localized(spec.prompt, lang)}</p>
      <p className="page-interaction-stage__problem">{localized(spec.problem, lang)}</p>
      <div aria-label={localized(spec.prompt, lang)} className="page-interaction-stage__choices" role="group">
        {choices.map((choice) => (
          <button
            aria-pressed={selectedId === choice.id}
            data-choice-id={choice.id}
            data-correct={choice.correct ? 'true' : 'false'}
            disabled={frozen}
            key={choice.id}
            onClick={() => choose(choice.id)}
            type="button"
          >
            {localized(choice.label, lang)}
          </button>
        ))}
      </div>
      <p className="page-interaction-stage__hint">{labels.hint}</p>
      {status === 'correct' ? (
        <p className="page-interaction-stage__status" role="status">
          {labels.success}
        </p>
      ) : null}
      {status === 'incorrect' ? (
        <p className="page-interaction-stage__status" role="status">
          {labels.retry}
        </p>
      ) : null}
    </div>
  );
}
