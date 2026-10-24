'use client';
import * as React from 'react';
import { P043Diagram, type P043Picture } from './nms-l02-p043-diagrams-v1';
import { P043_TARGETS, type P043MatchingState, type P043Term, type P043Row } from './nms-l02-p043-matching-v1';
import { P043_GLOSSARY } from './generated/nms-l02-p043-glossary-v1';
import { P043Definition } from './nms-l02-p043-definition-v1';
import { P043CompletionFeedback } from './nms-l02-p043-completion-v1';
import type { P043CompletionDomain } from './nms-l02-p043-clock-v1';
import './nms-l02-p043-presentation-v1.css';
const terms = ['fraction', 'equivalent', 'decimal', 'percent'] as const;
const rows: readonly P043Picture[] = ['decimal', 'fraction', 'percent', 'equivalent'];
import { P043_COPY } from './nms-l02-p043-copy-v1';

type Modal = { kind: 'picture'; picture: P043Picture } | { kind: 'glossary'; id: string } | null;
export interface P043PresentationProps {
  state: P043MatchingState; frame: number; language?: 'en' | 'es'; interactive?: boolean;
  completionDomain?: P043CompletionDomain;
  onMatch: (term: P043Term, row: P043Row) => void; onCloseWrong: () => void;
  onModalChange?: (open: boolean) => void;
}
export function P043Presentation({ state, frame, language = 'en', interactive = true, completionDomain = '143', onMatch, onCloseWrong, onModalChange }: P043PresentationProps) {
  const c = P043_COPY[language], [selected, setSelected] = React.useState<P043Term | null>(null), [modal, setModal] = React.useState<Modal>(null);
  const dialog = React.useRef<HTMLDialogElement>(null), trigger = React.useRef<HTMLElement | null>(null);
  const wrong = state.phase === 'wrong-feedback', open = wrong || modal !== null;
  const enabled = interactive && state.phase === 'ready' && !modal;
  React.useEffect(() => { setSelected(null); }, [state.phase, state.replay]);
  React.useEffect(() => { setModal(null); }, [state.replay]);
  React.useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) { node.showModal(); }
    if (!open && node?.open) {
      node.close();
      const previous = trigger.current;
      if (previous?.isConnected && previous.tagName !== 'BODY' && !previous.matches(':disabled')) previous.focus();
      else node.closest('.p043-presentation')?.querySelector<HTMLButtonElement>('.p043-presentation__terms button:not(:disabled)')?.focus();
      trigger.current = null;
    }
    onModalChange?.(modal !== null);
  }, [open, modal, onModalChange]);
  const close = () => { if (wrong) onCloseWrong(); else setModal(null); };
  const submit = (term: P043Term, row: P043Row) => { if (enabled) { trigger.current = document.activeElement as HTMLElement; setSelected(null); onMatch(term, row); } };
  const openModal = (value: NonNullable<Modal>) => { trigger.current = document.activeElement as HTMLElement; setModal(value); };
  const entry = modal?.kind === 'glossary' ? P043_GLOSSARY.find(e => e.id === modal.id) : undefined;
  const demo = state.phase === 'intro' && frame >= 158 && frame <= 165;
  return <section className="p043-presentation" lang={language} data-p043-frame={frame} data-p043-phase={state.phase}>
    <p lang="en">Fractions, Decimals, and Percent Concepts: Try It!</p>
    <h2>{c.title}</h2><p>{c.instruction}</p><p>{state.phase === 'intro' ? c.wait : c.action}</p>
    {(state.phase === 'completion-feedback' || state.phase === 'complete') && <P043CompletionFeedback domain={completionDomain} language={language} />}
    {frame >= 11 && <>
      <div className="p043-presentation__terms" role="group" aria-label={c.glossary}>
        {terms.map(term => !state.matched.includes(term) && <button key={term} type="button" draggable={enabled} disabled={!enabled}
          aria-pressed={selected === term} data-demo={demo && term === 'decimal' || undefined}
          onClick={() => setSelected(selected === term ? null : term)}
          onDragStart={event => { if (!enabled) { event.preventDefault(); return; } event.dataTransfer.setData('text/plain', term); event.dataTransfer.effectAllowed = 'move'; }}>
          {c.names[term]}
        </button>)}
      </div>
      <p className="p043-presentation__selection" aria-live="polite">{selected ? `${c.selected}: ${c.names[selected]}` : '\u00a0'}</p>
      <div className="p043-presentation__rows">
        {rows.map((picture, index) => {
          const row = index + 1 as P043Row, matched = state.matched.find(term => P043_TARGETS[term] === row);
          return <article key={picture} className="p043-presentation__row" data-target-row={row} data-demo={demo && row === 1 || undefined}
            onDragOver={event => { if (enabled && !matched) event.preventDefault(); }}
            onDrop={event => { event.preventDefault(); const term = event.dataTransfer.getData('text/plain') as P043Term; if (terms.includes(term) && !matched) submit(term, row); }}>
            <div><h3>{matched ? c.names[matched] : `${index + 1}`}</h3><P043Definition text={c.definitions[index]} row={row} language={language} enabled={interactive && !wrong} onTerm={id => openModal({ kind: 'glossary', id })} />
              {!matched && <button type="button" disabled={!enabled || !selected} onClick={() => selected && submit(selected, row)}>{c.choose} {row}</button>}
              {demo && row === 1 && <p className="p043-presentation__demo">{c.names.decimal}</p>}
            </div>
            <div><P043Diagram picture={picture} language={language} />{picture !== 'decimal' && <button type="button" disabled={!interactive || wrong || frame < 223} onClick={() => openModal({ kind: 'picture', picture })}>{c.enlarge} {row}</button>}</div>
          </article>;
        })}
      </div>
      <nav className="p043-presentation__glossary" aria-label={c.glossary}>{P043_GLOSSARY.map(term => <button type="button" key={term.id} disabled={!interactive || wrong} onClick={() => openModal({ kind: 'glossary', id: term.id })}>{term.labels[language]}</button>)}</nav>
    </>}
    <p role="status">{state.phase === 'correct-feedback' ? c.correct : ''}</p>
    <dialog ref={dialog} aria-labelledby="p043-dialog-title" onCancel={event => { event.preventDefault(); close(); }}>
      <h2 id="p043-dialog-title">{wrong ? c.wrong : entry ? entry.labels[language] : c.enlarge}</h2>
      {entry && <p>{entry.definitions[language]}</p>}
      {modal?.kind === 'picture' && <P043Diagram picture={modal.picture} language={language} />}
      <button type="button" onClick={close}>{c.close}</button>
    </dialog>
  </section>;
}
