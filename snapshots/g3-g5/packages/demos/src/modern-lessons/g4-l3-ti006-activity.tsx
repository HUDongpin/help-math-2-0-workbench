import React from 'react';
import type {Dispatch, RefObject} from 'react';
import {
  COURSE_G04_L03_TI_006_CARDS as cards,
  COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK,
  getCourseG04L03Ti006PlacementCount,
  type CourseG04L03Ti006NumberLineDragState,
  type CourseG04L03Ti006NumberLineDragAction,
} from '../timelines/course-g04-l03-ti-006-number-line-drag-interaction';
import {Ti006Help, TI006_HELP_DATA, type Ti006OpenTerm} from './g4-l3-ti006-help';

export interface Ti006AxisLabel {readonly value: number; readonly label: string}
interface Props {
  axis: readonly Ti006AxisLabel[];
  interaction: CourseG04L03Ti006NumberLineDragState;
  dispatch: Dispatch<CourseG04L03Ti006NumberLineDragAction>;
  helpOpen: boolean;
  onOpenHelp: () => void;
  onCloseHelp: () => void;
  onCloseWrong: () => void;
  helpButtonRef: RefObject<HTMLButtonElement | null>;
  helpCloseRef: RefObject<HTMLButtonElement | null>;
  wrongCloseRef: RefObject<HTMLButtonElement | null>;
  onKeyTerm?: Ti006OpenTerm;
}

/** Uses the maintained drag reducer. Layout changes never replace teaching state. */
export function Ti006Activity({axis, interaction, dispatch, helpOpen, onOpenHelp, onCloseHelp,
  onCloseWrong, helpButtonRef, helpCloseRef, wrongCloseRef, onKeyTerm}: Props) {
  const locked = interaction.locked || helpOpen;
  const selected = cards.find(c => c.id === interaction.selectedCardId);
  const count = getCourseG04L03Ti006PlacementCount(interaction);
  return <section lang="en" data-ti006-native-question="true" data-interaction-outcome={interaction.outcome}
    data-placed-count={count} data-selected-card={interaction.selectedCardId ?? ''}
    style={{fontFamily: 'var(--lesson-font-body)', fontSize: 'var(--ti006-prose-size,1.125rem)',
      lineHeight: 1.6, color: '#172033', display: 'grid', gap: '1rem', minWidth: 0, padding: '1rem',
      borderRadius: 12, background: '#e9f7ff'}}>
    <style>{`
      [data-ti006-native-question] button {font:inherit;line-height:1.6;min-height:2.75rem;border:2px solid #224b8e;border-radius:.5rem;background:white;color:#172033;padding:.4rem .65rem}
      [data-ti006-native-question] button:focus-visible {outline:3px solid #153d8a;outline-offset:3px}
      [data-ti006-native-question] button:disabled {cursor:default;opacity:.65}
      [data-ti006-native-question] button[aria-pressed=true] {background:#ffdd29;box-shadow:inset 0 0 0 2px #172033}
      .ti006-cards {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));gap:.75rem}
      .ti006-cards button {display:grid;place-content:center}
    `}</style>
    <p data-modern-assistive="interaction-instructions" style={{margin: 0}}>Drag a card, or select a card and then choose a position.</p>
    <div className="ti006-cards" role="group" aria-label="People and amounts of money">
      {cards.map((c, i) => interaction.placements[c.id] ? null : <button key={c.id} type="button"
        data-ti006-focus-control={`card-${c.id}`} data-lesson-text-block={`card-${i+1}`} data-source-text={181+i}
        aria-label={`Select ${c.accessibleLabel} to move`} aria-pressed={interaction.selectedCardId === c.id}
        disabled={locked} draggable={!locked} onClick={() => dispatch({type: 'select-card', cardId: c.id})}
        onDragStart={event => {if (locked) {event.preventDefault(); return;} event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', c.id); dispatch({type: 'select-card', cardId: c.id});}}>
        <strong>{c.name}</strong><span>{c.relationship} {c.amountText}</span>
      </button>)}
    </div>
    <p aria-live="polite" data-modern-assistive="selection-status" style={{margin: 0}}>
      {selected ? `Selected: ${selected.accessibleLabel}. Choose a position.` : `${count} of 5 cards placed.`}
    </p>
    <div tabIndex={0} role="group" aria-label="Number line from negative eight to positive eight. Scroll horizontally to reach each position."
      style={{overflowX: 'auto', maxWidth: '100%', padding: '.5rem 0'}}>
      <div data-ti006-question-axis="true" style={{position: 'relative', width: '58rem', height: '13rem'}}>
        <svg aria-hidden="true" viewBox="0 0 928 80" preserveAspectRatio="none"
          style={{position: 'absolute', top: '6.5rem', left: 0, width: '100%', height: '5rem'}}>
          <path d="M 20 35 H 908 M 30 27 L 20 35 L 30 43 M 898 27 L 908 35 L 898 43" fill="none" stroke="#172033" strokeWidth="2"/>
          {axis.map((t, i) => <path key={t.value} d={`M ${64+i*50} 23 V 47`} stroke="#172033" strokeWidth="2"/>)}
        </svg>
        {axis.map((t, i) => <span key={t.value} data-lesson-text-block={`axis-${t.value}`}
          style={{position: 'absolute', top: '9.6rem', left: `${(64+i*50)/928*100}%`, transform: 'translateX(-50%)',
            fontSize: '1.125rem', fontWeight: t.value === 0 ? 800 : 600}}>{t.label}</span>)}
        {cards.map(c => {
          const i = axis.findIndex(t => t.value === c.numericValue);
          const placed = cards.find(item => interaction.placements[item.id] === c.targetId);
          return <div key={c.targetId} style={{position: 'absolute', top: '.25rem', left: `${(64+i*50)/928*100}%`, transform: 'translateX(-50%)', width: '5.9rem', textAlign: 'center'}}>
            <button type="button" data-ti006-focus-control={`target-${c.targetId}`} aria-label={`Position ${c.numericValue < 0 ? 'negative' : 'positive'} ${Math.abs(c.numericValue)}`}
              disabled={locked || Boolean(placed)} style={{width: '100%', minHeight: '5.5rem', padding: '.25rem'}}
              onClick={() => dispatch({type: 'drop-card', targetId: c.targetId})}
              onDragOver={event => {if (!locked && !placed) {event.preventDefault(); event.dataTransfer.dropEffect = 'move';}}}
              onDrop={event => {event.preventDefault(); if (locked || placed) return;
                const dragged = cards.find(item => item.id === event.dataTransfer.getData('text/plain'));
                dispatch(dragged ? {type: 'drop-card', cardId: dragged.id, targetId: c.targetId} : {type: 'drop-card', targetId: c.targetId});}}>
              {placed ? <span data-lesson-text-block={`card-${cards.indexOf(placed)+1}`}><strong>{placed.name}</strong><br/>{placed.relationship} {placed.amountText}<span aria-label="placed"> ✓</span></span>
                : <span>{axis[i]?.label}</span>}
            </button>
            <span aria-hidden="true" style={{display: 'block', height: '2rem', borderLeft: '2px solid #172033', marginLeft: '50%'}}/>
          </div>;
        })}
      </div>
    </div>
    <button type="button" data-ti006-focus-control="help" data-lesson-text-block="help-button" disabled={interaction.locked || helpOpen}
      ref={helpButtonRef} onClick={onOpenHelp} style={{justifySelf: 'start'}}>Need More Help</button>
    {helpOpen ? <section role="dialog" aria-label="Need More Help" data-host-hyperlinks={onKeyTerm ? 'source-bound' : 'safe-disabled'}
      style={{padding: '1rem', border: '2px solid #224b8e', borderRadius: 12, background: '#fffde9', minWidth: 0}}>
      <Ti006Help onKeyTerm={onKeyTerm}/>
      <button type="button" data-ti006-focus-control="close-help" data-lesson-text-block="close-help" ref={helpCloseRef} onClick={onCloseHelp}>Close</button>
    </section> : null}
    {interaction.outcome === 'wrong' ? <section role="alertdialog" aria-label="Incorrect placement feedback"
      data-source-copy="source-static-221-host-assignment-unresolved" style={{background: '#fffde9', border: '2px solid #224b8e', borderRadius: 12, padding: '1rem'}}>
      <p data-lesson-text-block="wrong-feedback" style={{marginTop: 0}}>{TI006_HELP_DATA.wrongFeedback.text}</p>
      <button type="button" data-ti006-focus-control="close-wrong" data-lesson-text-block="close-wrong" ref={wrongCloseRef} onClick={onCloseWrong}>Close</button>
    </section> : null}
    {interaction.outcome === 'correct-feedback' ? <p role="status" data-modern-assistive="correct-feedback" style={{margin: 0}}>Correct!</p> : null}
    {interaction.outcome === 'complete' ? <p role="status" data-lesson-text-block="completion" style={{fontWeight: 800, margin: 0}}>{COURSE_G04_L03_TI_006_COMPLETION_FEEDBACK}</p> : null}
  </section>;
}
