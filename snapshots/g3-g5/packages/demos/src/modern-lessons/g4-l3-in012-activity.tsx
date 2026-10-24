'use client';
import React, {useLayoutEffect, useRef} from 'react';
import {In012Feedback} from './g4-l3-in012-feedback';
import {In012AxisArt, in012TickLeft, in012TargetLeft} from './g4-l3-in012-axis';
import {getIn012TextSnapshot, IN012_MODERN_UI_TEXT} from './g4-l3-in012-text';
import type {TextPresentationSnapshot} from '../lesson-text-contract';
import type {Dispatch} from 'react';
import {
  COURSE_G04_L03_IN_012_CARDS as CARDS,
  type CourseG04L03In012OwingDragState as State,
  type CourseG04L03In012OwingDragAction as Action,
  type CourseG04L03In012CardId as CardId,
  type CourseG04L03In012TargetId as TargetId,
} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';

const ticks = Array.from({length: 17}, (_, i) => i - 8);
const signed = (n: number) => n < 0 ? `−${-n}` : n > 0 ? `+${n}` : '0';
const terms: Record<string, string> = {position: 'en-0495-b62037868041', 'number line': 'en-0424-79116d5cfb19', owes: 'en-0451-a7f0d0283926'};
export const IN012_ACTIVITY_STYLES = `.in012-activity{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#16364a;display:grid;gap:1rem;min-width:0}.in012-activity p{margin:0;font-size:1.125rem;line-height:1.6;overflow-wrap:anywhere}.in012-cards{display:flex;flex-wrap:wrap;gap:.75rem}.in012-activity .in012-card,.in012-activity .in012-target,.in012-activity .in012-close{font:inherit;font-size:1.125rem;line-height:1.5}.in012-card,.in012-target,.in012-close{border:2px solid #526f86;border-radius:.7rem;background:#fff;color:#16364a;padding:.65rem;min-height:44px;min-width:44px}.in012-card{display:grid;min-width:8rem;touch-action:none}.in012-card[aria-pressed=true]{outline:3px solid #005a9c;outline-offset:2px;background:#e4f3ff}.in012-activity button:focus-visible,.in012-axis:focus-visible{outline:3px solid #005a9c;outline-offset:3px}.in012-activity button:disabled{opacity:.7}.in012-axis{overflow:auto;border:1px solid #718399;border-radius:.75rem;padding:1rem;overscroll-behavior:contain}.in012-axis-plane{position:relative;min-width:102rem;height:13rem}.in012-tick{position:absolute;top:9.5rem;transform:translateX(-50%);text-align:center;min-width:3rem;font-size:1.125rem;line-height:1.5;font-weight:700;font-variant-numeric:tabular-nums}.in012-target-slot{position:absolute;top:1rem;transform:translateX(-50%);width:5.5rem;min-height:7rem;display:grid;align-content:end;gap:.3rem;text-align:center}.in012-target{width:100%;overflow-wrap:anywhere}.in012-placed{display:block;font-size:1rem;line-height:1.35;overflow-wrap:anywhere}.in012-feedback{border:2px solid #526f86;border-radius:.75rem;padding:1rem;display:grid;gap:.75rem}.in012-term{font:inherit;color:#005a9c;text-decoration:underline;text-underline-offset:.15em;border:1px solid #718399;border-radius:.3rem;background:white;padding:.2rem .3rem;min-height:44px}.in012-status{min-height:1.6em}`;

/** Controlled activity: host retains reducer, pause, feedback timers and Replay. */
export function In012Activity({state, dispatch, paused = false, onKeyTerm, snapshot, onClosePress, onCloseRelease, terminal = false}: {
  terminal?: boolean; state: State; dispatch: Dispatch<Action>; paused?: boolean; snapshot?: TextPresentationSnapshot;
  onClosePress?: (token: string) => boolean; onCloseRelease?: (token: string) => boolean;
  onKeyTerm?: (entryId: string, trigger: HTMLButtonElement) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previous = useRef(state);
  const drag = useRef<{cardId: CardId; x: number; y: number} | null>(null);
  const suppressClick = useRef<CardId | null>(null);
  useLayoutEffect(() => {
    if (state.outcome === 'wrong' && previous.current.outcome !== 'wrong') close.current?.focus();
    if (previous.current.outcome === 'wrong' && state.outcome === 'ready') {
      root.current?.querySelector<HTMLButtonElement>(`[data-card-id="${previous.current.wrongCardId}"]`)?.focus();
    }
    if (previous.current.outcome === 'correct-feedback' && state.outcome === 'ready') {
      const active = root.current?.ownerDocument.activeElement;
      if (active && (active === root.current?.ownerDocument.body || root.current?.contains(active))) {
        const next = CARDS.find(card => state.placements[card.id] === null);
        if (next) root.current?.querySelector<HTMLButtonElement>(`[data-card-id="${next.id}"]`)?.focus();
      }
    }
    previous.current = state;
    if (paused || state.locked) drag.current = null;
  }, [state, paused]);
  const textSnapshot = snapshot ?? getIn012TextSnapshot({frame:174,scenario:'source-static-frame',lang:'en',seed:0},state);
  if (textSnapshot.status !== 'ready') throw new Error('IN012 activity text snapshot blocked');
  const value = (id: string) => {const block=textSnapshot.blocks.find(b=>b.id===id);if(!block)throw new Error(`Missing IN012 block ${id}`);return block.text;};
  const disabled = paused || state.locked;
  const drop = (targetId: TargetId, cardId?: CardId) => {if (!disabled) dispatch({type: 'drop-card', targetId, cardId});};
  return <section ref={root} className="in012-activity" lang="en" data-in012-outcome={state.outcome}>
    <style>{IN012_ACTIVITY_STYLES}</style>
    <p>{(['instruction-first','instruction-second'] as const).map(id=><span key={id} data-lesson-text-block={id}>{value(id).split(/(position|number line|owes)/).map((part,i)=>terms[part]&&onKeyTerm?
      <button key={i} className="in012-term" type="button" onClick={e=>onKeyTerm(terms[part]!,e.currentTarget)}>{part}</button>:<React.Fragment key={i}>{part}</React.Fragment>)}</span>)}</p>
    {!terminal && <p data-in012-ui-text="interaction-guidance">{IN012_MODERN_UI_TEXT.guidance}</p>}
    <div className="in012-axis" tabIndex={0} role="group" aria-label="Number line from negative eight to positive eight. Scroll horizontally to explore all positions.">
      <div className="in012-axis-plane"><In012AxisArt frame={174} top="9.3rem"/>
        {ticks.map(value => <span className="in012-tick" data-number-value={value} data-lesson-text-block={`tick-${value}`} key={value} style={{left: in012TickLeft(value), top: '10.75rem'}}>{signed(value)}</span>)}
        {CARDS.map(target => {
          const placed = CARDS.find(card => state.placements[card.id] === target.targetId);
          return <div className="in012-target-slot" key={target.targetId} style={{left: in012TargetLeft(target.targetId)}}>
            {placed && <span className="in012-placed" data-placed-card={placed.id} data-lesson-text-block={`placed-${placed.id}`} style={{whiteSpace:'pre-line'}}>{value(`placed-${placed.id}`)}</span>}
            {terminal ? <span className="in012-target" data-target-id={target.targetId} data-lesson-text-block={`target-${target.targetId}`}>{value(`target-${target.targetId}`)}</span> : <button type="button" className="in012-target" data-target-id={target.targetId} data-lesson-text-block={`target-${target.targetId}`} disabled={disabled || !!placed}
              aria-label={`Position ${signed(target.signedValue)}${placed ? `, ${placed.person} placed` : ''}`}
              onClick={() => drop(target.targetId)}>{value(`target-${target.targetId}`)}</button>}
          </div>;
        })}
      </div>
    </div>
    <div className="in012-cards" aria-label="Person cards">{CARDS.filter(card => state.placements[card.id] === null).map(card =>
      <button key={card.id} type="button" className="in012-card" data-card-id={card.id} data-lesson-text-block={`card-${card.id}`} disabled={disabled}
        aria-label={card.accessibleLabel} aria-pressed={state.selectedCardId === card.id}
        onClick={() => {if (suppressClick.current === card.id) {suppressClick.current = null; return;} suppressClick.current = null; dispatch({type: 'select-card', cardId: card.id});}}
        onPointerDown={e => {if (disabled || e.button !== 0) return; suppressClick.current = null; drag.current = {cardId: card.id, x: e.clientX, y: e.clientY}; e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerCancel={() => {drag.current = null;}}
        onPointerUp={e => {
          const gesture = drag.current; drag.current = null;
          if (!gesture || disabled || Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) < 6) return;
          suppressClick.current = gesture.cardId;
          const hit = e.currentTarget.ownerDocument.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-target-id]');
          if (hit && root.current?.contains(hit)) {
            const target = CARDS.find(c => c.targetId === hit.dataset.targetId);
            if (target && !hit.matches(':disabled')) drop(target.targetId, gesture.cardId);
          }
        }}>
        <strong>{value(`card-${card.id}`).split('\n')[0]}</strong><span>{value(`card-${card.id}`).split('\n')[1]}</span>
      </button>)}</div>
    <In012Feedback onPress={onClosePress} onRelease={onCloseRelease} snapshot={textSnapshot} state={state} paused={paused} closeRef={close} onClose={() => dispatch({type: 'close-wrong'})}/>
  </section>;
}
