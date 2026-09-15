'use client';

import {useEffect, useMemo, useState, type DragEvent} from 'react';

import {localized, type AnimationLanguage, type PageInteractionSpec} from './contract';
import {
  createDragDropState,
  isDragDropSolved,
  placeTokenOnTarget,
  selectToken,
  tokenOccupyingTarget,
  type DragDropState
} from './drag-drop';
import {displayedFlashFrame} from './frame';

function copy(lang: AnimationLanguage) {
  return lang === 'es'
    ? {
        bank: 'Términos clave',
        drop: 'Suelta el término aquí',
        success: 'Correcto. Todos los términos están en su lugar.',
        hint: 'Arrastra un término o selecciónalo y luego activa una casilla.',
        place: (token: string, cell: string) => `Colocar ${token} en ${cell}`
      }
    : {
        bank: 'Key terms',
        drop: 'Drop the term here',
        success: 'Correct. Every key term is in place.',
        hint: 'Drag a term, or select it and then activate a Key Term cell.',
        place: (token: string, cell: string) => `Place ${token} on ${cell}`
      };
}

export function KeyTermDragStage({
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
  const tokens = spec.tokens ?? [];
  const targets = spec.targets ?? [];
  const labels = copy(lang);
  const frozen = !interactive || captureFrame != null;
  const [state, setState] = useState<DragDropState>(() => createDragDropState(tokens));
  const solved = isDragDropSolved(state, tokens);
  const flashFrame = displayedFlashFrame(captureFrame, spec.frameCount, solved);

  useEffect(() => {
    setState(createDragDropState(spec.tokens ?? []));
  }, [replayNonce, spec.animationId, spec.tokens]);

  useEffect(() => {
    if (solved && !frozen) onSolved?.();
  }, [frozen, onSolved, solved]);

  const unusedTokens = useMemo(
    () => tokens.filter((token) => state.placements[token.id] == null),
    [state.placements, tokens]
  );
  const selectedToken = tokens.find((token) => token.id === state.selectedTokenId);

  const applyDrop = (tokenId: string, targetId: string) => {
    if (frozen) return;
    setState((current) => placeTokenOnTarget(current, tokens, tokenId, targetId));
  };

  const onTokenDragStart = (tokenId: string) => (event: DragEvent<HTMLButtonElement>) => {
    if (frozen) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/plain', tokenId);
    event.dataTransfer.effectAllowed = 'move';
    setState((current) => ({...selectToken({...current, selectedTokenId: null}, tokenId)}));
  };

  const onTargetDrop = (targetId: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (frozen) return;
    const tokenId = event.dataTransfer.getData('text/plain') || state.selectedTokenId;
    if (tokenId) applyDrop(tokenId, targetId);
  };

  const onTargetActivate = (targetId: string) => {
    if (frozen) return;
    if (state.selectedTokenId) {
      applyDrop(state.selectedTokenId, targetId);
      return;
    }
    const occupant = tokenOccupyingTarget(state.placements, targetId);
    if (occupant) setState((current) => selectToken(current, occupant));
  };

  return (
    <div
      className="page-interaction-stage"
      data-flash-frame={String(flashFrame)}
      data-interactive={frozen ? 'false' : 'true'}
      data-interaction-kind="drag-drop-key-terms"
      data-original-flash-pointer-lifecycle-established={
        spec.pointerLifecycle.originalFlashPointerLifecycleEstablished ? 'true' : 'false'
      }
      data-page-interaction-stage-target-id={stageTargetId}
      data-solved={solved ? 'true' : 'false'}
      id={stageTargetId}
    >
      <p className="page-interaction-stage__prompt">{localized(spec.prompt, lang)}</p>
      <p className="page-interaction-stage__problem">{localized(spec.problem, lang)}</p>
      <div className="page-interaction-stage__cells">
        {targets.map((target) => {
          const occupantId = tokenOccupyingTarget(state.placements, target.id);
          const occupant = tokens.find((token) => token.id === occupantId);
          const cellLabel = localized(target.label, lang);
          const occupantLabel = occupant ? localized(occupant.label, lang) : undefined;
          const selectedLabel = selectedToken ? localized(selectedToken.label, lang) : undefined;
          const ariaLabel = occupantLabel
            ? `${cellLabel}: ${occupantLabel}`
            : selectedLabel
              ? labels.place(selectedLabel, cellLabel)
              : cellLabel;
          return (
            <button
              aria-label={ariaLabel}
              className="page-interaction-stage__cell"
              data-drop-target-id={target.id}
              disabled={frozen}
              key={target.id}
              onClick={() => onTargetActivate(target.id)}
              onDragOver={(event) => {
                if (!frozen) event.preventDefault();
              }}
              onDrop={onTargetDrop(target.id)}
              type="button"
            >
              <span>{cellLabel}</span>
              {occupant ? <strong>{occupantLabel}</strong> : <em>{labels.drop}</em>}
            </button>
          );
        })}
      </div>
      <div aria-label={labels.bank} className="page-interaction-stage__bank" role="group">
        {unusedTokens.map((token) => (
          <button
            aria-pressed={state.selectedTokenId === token.id}
            disabled={frozen}
            draggable={!frozen}
            key={token.id}
            onClick={() => {
              if (!frozen) setState((current) => selectToken(current, token.id));
            }}
            onDragStart={onTokenDragStart(token.id)}
            type="button"
          >
            {localized(token.label, lang)}
          </button>
        ))}
      </div>
      <p className="page-interaction-stage__hint">{labels.hint}</p>
      {state.feedback === 'correct' ? (
        <p className="page-interaction-stage__status" role="status">
          {labels.success}
        </p>
      ) : null}
    </div>
  );
}
