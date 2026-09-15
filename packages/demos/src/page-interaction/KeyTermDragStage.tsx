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

function copy(lang: AnimationLanguage) {
  return lang === 'es'
    ? {
        bank: 'Términos clave',
        drop: 'Suelta el término aquí',
        success: 'Correcto. Todos los términos están en su lugar.',
        hint: 'Arrastra un término o selecciónalo y luego elige una casilla.'
      }
    : {
        bank: 'Key terms',
        drop: 'Drop the term here',
        success: 'Correct. Every key term is in place.',
        hint: 'Drag a term, or select it and then choose a Key Term cell.'
      };
}

export function KeyTermDragStage({
  lang,
  onSolved,
  replayNonce,
  spec,
  stageTargetId
}: {
  lang: AnimationLanguage;
  onSolved?: () => void;
  replayNonce: number;
  spec: PageInteractionSpec;
  stageTargetId: string;
}) {
  const tokens = spec.tokens ?? [];
  const targets = spec.targets ?? [];
  const labels = copy(lang);
  const [state, setState] = useState<DragDropState>(() => createDragDropState(tokens));

  useEffect(() => {
    setState(createDragDropState(spec.tokens ?? []));
  }, [replayNonce, spec.animationId, spec.tokens]);

  useEffect(() => {
    if (isDragDropSolved(state, tokens)) onSolved?.();
  }, [onSolved, state, tokens]);

  const unusedTokens = useMemo(
    () => tokens.filter((token) => state.placements[token.id] == null),
    [state.placements, tokens]
  );

  const applyDrop = (tokenId: string, targetId: string) => {
    setState((current) => placeTokenOnTarget(current, tokens, tokenId, targetId));
  };

  const onTokenDragStart = (tokenId: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', tokenId);
    event.dataTransfer.effectAllowed = 'move';
    setState((current) => ({...selectToken({...current, selectedTokenId: null}, tokenId)}));
  };

  const onTargetDrop = (targetId: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const tokenId = event.dataTransfer.getData('text/plain') || state.selectedTokenId;
    if (tokenId) applyDrop(tokenId, targetId);
  };

  const onTargetClick = (targetId: string) => {
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
      data-flash-frame="1"
      data-interaction-kind="drag-drop-key-terms"
      data-original-flash-pointer-lifecycle-established={
        spec.pointerLifecycle.originalFlashPointerLifecycleEstablished ? 'true' : 'false'
      }
      data-page-interaction-stage-target-id={stageTargetId}
      data-solved={isDragDropSolved(state, tokens) ? 'true' : 'false'}
      id={stageTargetId}
    >
      <p className="page-interaction-stage__prompt">{localized(spec.prompt, lang)}</p>
      <p className="page-interaction-stage__problem">{localized(spec.problem, lang)}</p>
      <div className="page-interaction-stage__cells">
        {targets.map((target) => {
          const occupantId = tokenOccupyingTarget(state.placements, target.id);
          const occupant = tokens.find((token) => token.id === occupantId);
          return (
            <div
              aria-label={`${localized(target.label, lang)}${occupant ? `: ${localized(occupant.label, lang)}` : ''}`}
              className="page-interaction-stage__cell"
              data-drop-target-id={target.id}
              key={target.id}
              onClick={() => onTargetClick(target.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onTargetDrop(target.id)}
              role="group"
            >
              <span>{localized(target.label, lang)}</span>
              {occupant ? (
                <strong>{localized(occupant.label, lang)}</strong>
              ) : (
                <em>{labels.drop}</em>
              )}
            </div>
          );
        })}
      </div>
      <div aria-label={labels.bank} className="page-interaction-stage__bank" role="group">
        {unusedTokens.map((token) => (
          <button
            aria-pressed={state.selectedTokenId === token.id}
            draggable="true"
            key={token.id}
            onClick={() => setState((current) => selectToken(current, token.id))}
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
