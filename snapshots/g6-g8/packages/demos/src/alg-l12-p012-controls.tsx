'use client';

import {useEffect, useRef} from 'react';
import {P012_TEXT_DATA} from './generated/alg-l12-p012-text-data';
import {P012_CONTROL_TEXT} from './alg-l12-p012-text';
import type {P012Action, P012Button, P012State} from './alg-l12-p012-state';

const text = (characterId: number) => {
  const definition = P012_TEXT_DATA.definitions.find(item => item.characterId === characterId);
  if (!definition || !('runs' in definition)) throw new Error(`Missing P012 source text ${characterId}`);
  return definition.runs.map(run => run.text).join('');
};

export interface P012ControlsProps {
  readonly state: P012State;
  readonly dispatch: (action: P012Action) => void;
  readonly disabled?: boolean;
}

/** Native controls for the source interaction, with cancelled-pointer recovery.
 * UI language does not translate source instructional labels or select audio. */
export function P012Controls({state, dispatch, disabled = false}: P012ControlsProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const popupWasVisible = useRef(false);
  const activePointer = useRef<{id: number; element: HTMLButtonElement} | null>(null);
  useEffect(() => {
    if (state.popup.visible) closeButton.current?.focus();
    else if (popupWasVisible.current) lastTrigger.current?.focus();
    popupWasVisible.current = state.popup.visible;
  }, [state.popup.visible]);

  const activate = (button: P012Button, element: HTMLButtonElement) => {
    lastTrigger.current = element;
    dispatch({kind: 'press', button});
    dispatch({kind: 'release', button});
  };
  return <section className="p012-controls" lang="en" aria-label="Move the spider">
    <output className="p012-coordinate" aria-live="polite" aria-atomic="true"
      aria-label="Spider ordered pair" data-source-text-id="character-34">
      {state.coordinateText}
    </output>
    <div className="p012-direction-controls">
      {(Object.keys(P012_CONTROL_TEXT) as P012Button[]).map(button => {
        const label = P012_CONTROL_TEXT[button];
        // Press reserves one control; disabling that DOM button would swallow
        // its pointerup/release and strand the source state.
        const blocked = disabled || state.paused || state.popup.visible ||
          (!state.controlsEnabled && state.pressed?.button !== button);
        return <button key={button} type="button" disabled={blocked}
          data-source-control={button} data-source-text-id={label.sourceTextId}
          data-source-instance-id={label.instanceId}
          aria-label={label.text.replace(/(left)(\d)/, '$1 $2')}
          onPointerDown={event => {
            if (event.button !== 0 || activePointer.current !== null) return;
            activePointer.current = {id: event.pointerId, element: event.currentTarget};
            lastTrigger.current = event.currentTarget;
            event.currentTarget.setPointerCapture(event.pointerId);
            dispatch({kind: 'press', button});
          }}
          onPointerUp={event => {
            if (activePointer.current?.id !== event.pointerId || activePointer.current.element !== event.currentTarget) return;
            activePointer.current = null;
            const bounds = event.currentTarget.getBoundingClientRect();
            // Captured pointerup also arrives after dragging outside. The SWF
            // has on(release), not on(releaseOutside), so cancel that gesture.
            if (event.clientX < bounds.left || event.clientX >= bounds.right ||
                event.clientY < bounds.top || event.clientY >= bounds.bottom) dispatch({kind: 'cancel-press'});
            else dispatch({kind: 'release', button});
          }}
          onPointerCancel={event => {if (activePointer.current?.element === event.currentTarget) {
            activePointer.current = null; dispatch({kind: 'cancel-press'});
          }}}
          onLostPointerCapture={event => {if (activePointer.current?.element === event.currentTarget) {
            activePointer.current = null; dispatch({kind: 'cancel-press'});
          }}}
          onBlur={event => {if (activePointer.current?.element === event.currentTarget) {
            activePointer.current = null; dispatch({kind: 'cancel-press'});
          }}}
          onClick={event => {
            // Native keyboard/assistive activation has detail 0. Pointer clicks
            // already emitted the source press/release pair above.
            if (event.detail === 0) activate(button, event.currentTarget);
          }}>
          {label.text}
        </button>;
      })}
    </div>
    {state.popup.visible && <div className="p012-feedback" role="alert"
      data-source-sprite="74" data-source-frame="2">
      <p data-source-text-id="character-73/run-0">{text(73)}</p>
      <button ref={closeButton} type="button" data-source-text-id="character-66/run-0"
        onClick={() => dispatch({kind: 'close-popup'})}>{text(66)}</button>
    </div>}
  </section>;
}
