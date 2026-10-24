import {P047SourceGraphV1} from './alg-l06-p047-source-graph-v1';
import React, {useEffect, useRef, useState} from 'react';
import binding from '../../../migrations/shared-alg001-l06-p047/native-v1/native-bindings-v1.json';
import {P047_SOURCE, type P047Event, type P047Id, type P047State,
  type P047Transition} from './alg-l06-p047-state-v1';

export const P047_NATIVE_SHA256 = 'f59f4072720004ed23d4e1ffe0275f7d80c314aa003722bb3d7df85e694f8d61';
if (binding.sourceSwfSha256 !== P047_SOURCE.swfSha256 ||
    binding.sourceModelSha256 !== P047_SOURCE.modelSha256)
  throw new Error('P047_NATIVE_SOURCE_MISMATCH');

export type P047NativeProps = {
  state: P047State;
  language?: 'en' | 'es';
  onEvent?: (event: P047Event) => P047Transition;
};
type Gesture = {pointerId: number; id: P047Id; token: number; epoch: number;
  x: number; y: number; moved: boolean};

/** Native quiz surface only. The full teaching timeline, audio and host live
 * outside this component and must be integrated before product admission. */
export function P047NativeQuizV1({state, language = 'en', onEvent}: P047NativeProps) {
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{x: number; y: number; value: string} | null>(null);
  const enabled = !!onEvent && state.phase === 'quiz' && !state.nmhVisible &&
    !state.glossary && !state.spanishSelected && !state.suspended;
  useEffect(() => {
    if (!enabled) {gesture.current = null; setGhost(null);}
  }, [enabled, state.epoch]);
  const send = (event: Omit<P047Event, 'epoch'> | Record<string, unknown>) =>
    onEvent?.({...event, epoch: state.epoch} as P047Event);
  const cancel = (pointerId: number) => {
    const active = gesture.current;
    if (!active || active.pointerId !== pointerId) return;
    gesture.current = null; setGhost(null);
    onEvent?.({type: 'cancel-drag', token: active.token, epoch: active.epoch});
  };
  // Source objects persist at208 after the right coach calls parent.play();
  // their removal belongs to the following main frame209.
  if (state.mainFrame !== 208 || !['quiz', 'explanation'].includes(state.phase)) return null;
  const helpTerms = binding.glossary.filter(row => row.spriteId === 92);
  return <section data-p047-native-quiz data-source-swf-sha256={P047_SOURCE.swfSha256}
    data-p047-epoch={state.epoch} aria-label={language === 'es' ? 'Tabla de función' : 'Function table'}
    style={{fontFamily: 'var(--lesson-font-family, system-ui)', lineHeight: 1.5, minWidth: 0}}>
    <style>{`[data-p047-native-quiz] button{font:inherit;min-height:2.75rem;border:1px solid #64748b;border-radius:.4rem;background:#fff;color:#172554;padding:.4rem .75rem;max-width:100%}
[data-p047-native-quiz] button:disabled{color:#475569;background:#f1f5f9}
[data-p047-native-quiz] button:focus-visible{outline:3px solid #124eab;outline-offset:3px}
[data-p047-native-quiz] td,[data-p047-native-quiz] th{border:1px solid #94a3b8;padding:.5rem;text-align:center;overflow-wrap:anywhere}
[data-p047-native-quiz] [data-p047-target]{width:100%;min-width:3rem;background:#eff6ff}
[data-p047-native-quiz] [aria-pressed=true]{background:#dbeafe;border:2px solid #1d4ed8}`}</style>
    <p lang="en" data-source-text-id={binding.question.textId}>{binding.question.text}</p>
    <P047SourceGraphV1 language={language}/>
    <p>{language === 'es' ? 'Con el teclado: selecciona un valor y luego su casilla.'
      : 'Keyboard: select a value, then select its box.'}</p>
    <div role="group" aria-label={language === 'es' ? 'Valores' : 'Values'}
      style={{display: 'flex', flexWrap: 'wrap', gap: '.65rem', marginBottom: '1rem'}}>
      {binding.bank.map(item => {
        const id = item.id as P047Id;
        return <button key={id} type="button" data-p047-source={id}
          data-source-text-id={item.textId}
          aria-label={item.value==='6' ? `${language==='es'?'6, tarjeta':'6, card'} ${id===1?1:2}` : undefined} aria-pressed={state.selection?.id === id}
          disabled={!enabled || !!state.placements[id]} style={{touchAction: 'none'}}
          onClick={event => {
            const suppress = suppressClick.current && event.detail > 0;
            suppressClick.current = false;
            if (suppress) return;
            send({type: 'pick', id});
          }}
          onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary || gesture.current) return;
            suppressClick.current = false;
            const result = send({type: 'pick', id});
            const selection = result?.state.selection;
            if (!result?.accepted || !selection) return;
            gesture.current = {pointerId: event.pointerId, id, token: selection.token,
              epoch: result.state.epoch, x: event.clientX, y: event.clientY, moved: false};
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const active = gesture.current;
            if (!active || active.pointerId !== event.pointerId) return;
            if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 4) active.moved = true;
            if (active.moved) setGhost({x: event.clientX, y: event.clientY, value: item.value});
          }}
          onPointerUp={event => {
            const active = gesture.current;
            if (!active || active.pointerId !== event.pointerId) return;
            gesture.current = null; setGhost(null); suppressClick.current = true;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            if (!active.moved) return; // Tap picks; the following target tap places.
            const target = event.currentTarget.ownerDocument.elementFromPoint(event.clientX, event.clientY)
              ?.closest<HTMLElement>('[data-p047-target]');
            const ownRoot = event.currentTarget.closest('[data-p047-native-quiz]');
            const idValue = target && ownRoot?.contains(target) ? Number(target.dataset.p047Target) : null;
            const targetId = idValue !== null && Number.isInteger(idValue) && idValue >= 1 && idValue <= 5
              ? idValue as P047Id : null;
            onEvent?.({type: 'drop', id: active.id, target: targetId, token: active.token, epoch: active.epoch});
          }}
          onPointerCancel={event => cancel(event.pointerId)}
          onLostPointerCapture={event => cancel(event.pointerId)}>{item.value}</button>;
      })}
    </div>
    <table style={{borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', maxWidth: '34rem'}}>
      <thead><tr><th scope="col" lang="en" data-source-text-id={binding.inputLabel.textId}>{binding.inputLabel.text}</th>
        <th scope="col" lang="en" data-source-text-id={binding.outputLabel.textId}>{binding.outputLabel.text}</th></tr></thead>
      <tbody>{binding.rows.map((row, index) => <tr key={row.id}>
        {(['input', 'output'] as const).map(column => <td key={column}>
          {column !== row.missing ? <span data-source-text-id={row.givenTextId}>{row.given}</span>
            : state.targets[row.id as P047Id] ? <span data-p047-placed={row.id} data-source-card={state.targets[row.id as P047Id]} data-source-text-id={row.answerTextId}>{row.answer}</span>
              : <button type="button" data-p047-target={row.id}
                aria-label={`${column === 'input' ? (language === 'es' ? 'Entrada' : 'Input') : (language === 'es' ? 'Salida' : 'Output')}, ${language === 'es' ? 'fila' : 'row'} ${index + 1}`}
                disabled={!enabled || !state.selection}
                onClick={() => {
                  if (state.selection) send({type: 'drop', id: state.selection.id,
                    target: row.id as P047Id, token: state.selection.token});
                }}>□</button>}
        </td>)}
      </tr>)}</tbody>
    </table>
    <p role="status" aria-live="polite">{state.tryAgainVisible ? <span lang="en" data-source-text-id={binding.retry.textId}>{binding.retry.text}</span>
      : `${state.quizDragCount} / 5`}</p>
    {state.selection && <button type="button" onClick={() => send({type: 'cancel-drag', token: state.selection!.token})}>
      {language === 'es' ? 'Cancelar selección' : 'Cancel selection'}</button>}
    <button type="button" disabled={!enabled} onClick={() => send({type: 'open-nmh'})}>
      {language === 'es' ? 'Necesito más ayuda' : 'Need More Help'}</button>
    {state.nmhVisible && <aside aria-label={language === 'es' ? 'Ayuda' : 'Help'}
      style={{background: '#f8fafc', border: '1px solid #94a3b8', padding: '1rem', marginTop: '1rem'}}>
      {binding.help.map(block => <p key={block.textId} lang="en" data-source-text-id={block.textId}>{block.text}</p>)}
      <div role="group" aria-label={language === 'es' ? 'Términos' : 'Terms'} style={{display: 'flex', flexWrap: 'wrap', gap: '.5rem'}}>
        {helpTerms.map(term => <button key={term.buttonId} type="button" disabled={!onEvent || !!state.glossary || state.spanishSelected}
          data-source-button-id={term.buttonId} onClick={() => send({type: 'glossary', buttonId: term.buttonId})}>{term.term}</button>)}
      </div>
      <button type="button" disabled={!onEvent || !!state.glossary || state.spanishSelected}
        onClick={() => send({type: 'close-nmh'})}>{language === 'es' ? 'Cerrar' : 'Close'}</button>
    </aside>}
    {ghost && <span aria-hidden="true" style={{position: 'fixed', pointerEvents: 'none', zIndex: 100,
      left: ghost.x + 14, top: ghost.y + 14, background: '#dbeafe', color: '#172554', padding: '.4rem .8rem',
      border: '2px solid #1d4ed8', borderRadius: '.4rem', fontSize: '1.25rem'}}>{ghost.value}</span>}
  </section>;
}
