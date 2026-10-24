'use client';
import React, {useEffect, useLayoutEffect, useRef, useState, useId} from 'react';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {P037_GAME_SOURCE as GAME} from './generated/nms-l02-p037-state-source-v1';
import {P037_VISUAL_SOURCE as VISUAL} from './generated/nms-l02-p037-visual-source-v1';
import {P037_XML_PAGE_TITLE} from './generated/nms-l02-p037-page-title-source-v1';
import {p037CanDrop, p037Matched, p037MatchedCount, p037Phase, type P037State, type P037TermId} from './nms-l02-p037-state-v1';
import './nms-l02-p037-practice-v1.css';
const el = React.createElement;
function Fraction({value}: {value: readonly number[]}) {
  return el('math', {xmlns: 'http://www.w3.org/1998/Math/MathML', display: 'inline', displaystyle: 'true'},
    el('mfrac', null, el('mn', null, String(value[0])), el('mn', null, String(value[1]))));
}
type Run = Readonly<{sourceTextId: string; text: string; termId: string | null}>;
function Runs({runs, enabled, onTerm}: {runs: readonly Run[]; enabled: boolean; onTerm: (id: P037TermId, node: HTMLElement) => void}) {
  return <>{runs.map(run => run.termId ? <React.Fragment key={run.sourceTextId}>
    {run.text.match(/^\s+/u)?.[0]}<button type="button" className="p037-practice__term" data-p037-term={run.termId}
      disabled={!enabled} onClick={event => onTerm(run.termId as P037TermId, event.currentTarget)}>{run.text.trim()}</button>{run.text.match(/\s+$/u)?.[0]}
  </React.Fragment> : <React.Fragment key={run.sourceTextId}>{run.text}</React.Fragment>)}</>;
}
interface Box {x: number; y: number; width: number; height: number}
interface Geometry {bank: Box; target: Box; width: number; height: number}
interface Drag {id: number; pointerId: number; node: HTMLButtonElement; startX: number; startY: number; grabX: number; grabY: number; width: number; height: number; moved: boolean; x: number; y: number}
export interface P037PracticeProps {
  readonly state: P037State;
  readonly language: 'en' | 'es';
  readonly reducedMotion?: boolean;
  readonly interactionEnabled?: boolean;
  readonly onChoose?: (id: number) => void;
  readonly onCancelSelection?: () => void;
  readonly onDrop?: (id: number, target: number | null) => void;
  readonly onClosePopup?: () => void;
  readonly onTerm: (id: P037TermId, node: HTMLElement) => void;
}
export function P037Practice({state, language, reducedMotion = false, interactionEnabled = true,
  onChoose, onCancelSelection, onDrop, onClosePopup, onTerm}: P037PracticeProps) {
  const board = useRef<HTMLDivElement>(null), bank = useRef<HTMLDivElement>(null), title = useRef<HTMLHeadingElement>(null);
  const cards = useRef(new Map<number, HTMLButtonElement>()), targets = useRef(new Map<number, HTMLButtonElement>());
  const popupTitle = useRef<HTMLHeadingElement>(null), popupWasVisible = useRef(false), lastDropCard = useRef<number | null>(null);
  const scrollRaf = useRef<number | null>(null), focusAfterCancel = useRef<HTMLButtonElement | null>(null);
  const cancelSelectionCallback = useRef(onCancelSelection); cancelSelectionCallback.current = onCancelSelection;
  const pointer = useRef<Drag | null>(null), ignoreClick = useRef({id: 0, until: 0});
  const [drag, setDrag] = useState<Drag | null>(null), [geometry, setGeometry] = useState<Geometry | null>(null);
  const popupId = useId(), svgScope = useId().replace(/[^a-z0-9_-]/gi, '');
  const removed = state.mainFrame >= GAME.removalFrame, intro = VISUAL.states[VISUAL.frames[state.mainFrame - 1]];
  const fractionalEmphasis = reducedMotion ? state.mainFrame >= 203 && state.mainFrame <= 209 : intro.fractionPulse;
  const decimalEmphasis = reducedMotion ? state.mainFrame >= 261 && state.mainFrame <= 269 : intro.decimalPulse;
  const canInteract = interactionEnabled && state.term === null;
  const termsEnabled = canInteract;
  useLayoutEffect(() => {
    const node = board.current, tray = bank.current;
    if (!node || !tray) return;
    const measure = () => {
      const source = cards.current.get(1), target = targets.current.get(1);
      if (!source || !target) return;
      const root = node.getBoundingClientRect(), to = target.getBoundingClientRect();
      const width = to.width + 'px'; if (tray.style.getPropertyValue('--p037-target-width') !== width) tray.style.setProperty('--p037-target-width', width);
      const from = source.getBoundingClientRect();
      if (!from.width || !to.width) return;
      const box = (r: DOMRect): Box => ({x: r.left - root.left - node.clientLeft, y: r.top - root.top - node.clientTop, width: r.width, height: r.height});
      const next = {bank: box(from), target: box(to), width: node.clientWidth, height: node.clientHeight};
      setGeometry(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(node); observer.observe(tray);
    const source = cards.current.get(1), target = targets.current.get(1); if (source) observer.observe(source); if (target) observer.observe(target);
    measure(); return () => observer.disconnect();
  }, [removed]);
  useEffect(() => {
    if (state.popupVisible && !popupWasVisible.current && interactionEnabled) popupTitle.current?.focus();
    if (!state.popupVisible && popupWasVisible.current && document.activeElement === document.body) {
      const candidate = lastDropCard.current === null ? null : cards.current.get(lastDropCard.current);
      if (candidate && !candidate.disabled && !removed) candidate.focus({preventScroll: true}); else title.current?.focus({preventScroll: true});
    }
    popupWasVisible.current = state.popupVisible;
  }, [state.popupVisible, interactionEnabled, removed]);
  const cancelDrag = () => {
    if (scrollRaf.current !== null) {cancelAnimationFrame(scrollRaf.current); scrollRaf.current = null;}
    const old = pointer.current; pointer.current = null; setDrag(null);
    if (old?.node.hasPointerCapture(old.pointerId)) old.node.releasePointerCapture(old.pointerId);
  };
  useEffect(() => {
    if (!state.sourcesEnabled || state.term !== null || removed || !interactionEnabled) {
      if (scrollRaf.current !== null) {cancelAnimationFrame(scrollRaf.current); scrollRaf.current = null;}
      const old = pointer.current; pointer.current = null; setDrag(null);
      if (old?.node.hasPointerCapture(old.pointerId)) old.node.releasePointerCapture(old.pointerId);
    }
  }, [state.sourcesEnabled, state.term, removed, interactionEnabled]);
  useEffect(() => () => {
    if (scrollRaf.current !== null) {cancelAnimationFrame(scrollRaf.current); scrollRaf.current = null;}
    const old = pointer.current; pointer.current = null;
    if (old?.node.hasPointerCapture(old.pointerId)) old.node.releasePointerCapture(old.pointerId);
  }, []);
  useLayoutEffect(() => {
    if (!drag && focusAfterCancel.current) {
      const node = focusAfterCancel.current; focusAfterCancel.current = null;
      if (node.isConnected && !node.disabled) node.focus({preventScroll: true});
    }
  }, [drag]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      const old = pointer.current; if (event.key !== 'Escape' || !old?.moved) return;
      event.preventDefault(); event.stopPropagation();
      ignoreClick.current = {id: old.id, until: Infinity}; focusAfterCancel.current = old.node;
      pointer.current = null; setDrag(null);
      if (scrollRaf.current !== null) {cancelAnimationFrame(scrollRaf.current); scrollRaf.current = null;}
      if (old.node.hasPointerCapture(old.pointerId)) old.node.releasePointerCapture(old.pointerId);
      cancelSelectionCallback.current?.();
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, []);
  const submit = (id: number, target: number | null) => {lastDropCard.current = id; onDrop?.(id, target);};
  const choose = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0 && ignoreClick.current.id === id && performance.now() < ignoreClick.current.until) {event.preventDefault(); return;}
    onChoose?.(id);
  };
  const start = (id: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!canInteract || !p037CanDrop(state, id) || !event.isPrimary || event.button !== 0) return;
    ignoreClick.current = {id: 0, until: 0};
    const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.focus({preventScroll: true});
    pointer.current = {id, pointerId: event.pointerId, node: event.currentTarget, startX: event.clientX, startY: event.clientY,
      grabX: event.clientX - rect.left, grabY: event.clientY - rect.top, width: rect.width, height: rect.height,
      moved: false, x: event.clientX, y: event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const scrollDrag = () => {
    scrollRaf.current = null;
    const current = pointer.current; if (!current?.moved) return;
    const edge = 64;
    const delta = current.y < edge ? -Math.ceil(Math.min(1, (edge - current.y) / edge) * 14)
      : current.y > window.innerHeight - edge ? Math.ceil(Math.min(1, (current.y - window.innerHeight + edge) / edge) * 14) : 0;
    if (!delta || (delta < 0 && window.scrollY <= 0)
      || (delta > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1)) return;
    window.scrollBy(0, delta); setDrag({...current});
    scrollRaf.current = requestAnimationFrame(scrollDrag);
  };
  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = pointer.current; if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
    if (!current.moved) onChoose?.(current.id);
    current.moved = true; current.x = event.clientX; current.y = event.clientY; setDrag({...current}); event.preventDefault();
    if (scrollRaf.current === null) scrollRaf.current = requestAnimationFrame(scrollDrag);
  };
  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = pointer.current; if (!current || current.pointerId !== event.pointerId) return;
    cancelDrag(); if (!current.moved) return;
    ignoreClick.current = {id: current.id, until: performance.now() + 50};
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-p037-target]');
    const target = element && board.current?.contains(element) ? Number(element.dataset.p037Target) : null;
    submit(current.id, target);
  };
  const ghost = geometry && intro.guide ? {
    x: geometry.bank.x + (geometry.target.x + geometry.target.width / 2 - geometry.bank.x - geometry.bank.width / 2) * intro.progress[0],
    y: geometry.bank.y + (geometry.target.y + geometry.target.height / 2 - geometry.bank.y - geometry.bank.height / 2) * intro.progress[1],
    width: geometry.bank.width, height: geometry.bank.height,
  } : null;
  const selected = GAME.cards.find(c => c.id === state.selectedCard);
  const live = selected ? (language === 'es' ? `Seleccionado ${selected.decimal}. Elige una fracción; Escape cancela.` : `Selected ${selected.decimal}. Choose a fraction; Escape cancels.`)
    : state.popupVisible ? (language === 'es' ? 'Inténtalo de nuevo. Revisa los pasos de la calculadora.' : 'Try again. Review the calculator steps.') : state.matchedMask ? (language === 'es' ? `${p037MatchedCount(state)} de 5 correspondencias correctas.` : `${p037MatchedCount(state)} of 5 matched.`) : '';
  const dragRoot = board.current?.getBoundingClientRect();
  return <section className="p037-practice lesson-text-presentation" lang="en" data-p037-main-frame={state.mainFrame}
    data-p037-phase={p037Phase(state)} data-p037-geometry={removed ? 'not-required' : geometry ? 'ready' : 'pending'}>
    <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
    <h2 ref={title} tabIndex={-1} className="p037-practice__page-title" data-lesson-xml-title={P037_XML_PAGE_TITLE.sourcePageReference}
      data-source-xml-sha256={P037_XML_PAGE_TITLE.sourceXml.sha256}>{P037_XML_PAGE_TITLE.title}</h2>
    {language === 'es' && <p lang="es" className="p037-practice__fallback">Esta página conserva el texto original en inglés. Las definiciones están disponibles en español.</p>}
    <div className="p037-practice__board" ref={board}>
      <p className="p037-practice__instruction" data-lesson-text-block="instruction"><Runs runs={VISUAL.instruction} enabled={termsEnabled} onTerm={onTerm}/></p>
      <p className="p037-practice__sr" id={popupId + '-keyboard'} lang={language}>{language === 'es'
        ? 'Arrastra un decimal, o selecciónalo con Enter o Espacio y elige una casilla. Escape cancela la selección.'
        : 'Drag a decimal, or select it with Enter or Space and choose a box. Escape cancels the selection.'}</p>
      <div className="p037-practice__layout">
        <table className="p037-practice__table" aria-label={language === 'es' ? 'Fracciones y decimales equivalentes' : 'Fractions and equivalent decimals'}>
          <colgroup><col style={{width: '36%'}}/><col style={{width: '64%'}}/></colgroup>
          <thead><tr><th scope="col" data-lesson-text-block="fraction-header">{VISUAL.fractionHeader}</th><th scope="col" data-lesson-text-block="decimal-header">{VISUAL.decimalHeader}</th></tr></thead>
          <tbody>{GAME.targets.map(target => {
            const filled = p037Matched(state, target.id), emphasized = target.id === 1 && fractionalEmphasis;
            return <tr key={target.id} data-p037-row={target.row} data-p037-target-filled={filled}>
              <th scope="row" className={emphasized ? 'p037-practice__fraction p037-practice__emphasis' : 'p037-practice__fraction'}
                data-lesson-text-block="fractions" data-p037-emphasis={emphasized ? 'fraction' : undefined}><Fraction value={target.fraction}/></th>
              <td><button type="button" className="p037-practice__target" ref={node => {if (node) targets.current.set(target.id, node); else targets.current.delete(target.id);}}
                data-p037-target={target.id} data-lesson-text-block="matched-decimals" disabled={!canInteract || !state.sourcesEnabled || removed}
                aria-label={(language === 'es' ? 'Casilla para ' : 'Box for ') + target.fraction.join('/') + (filled ? ': ' + target.decimal : '')}
                onKeyDown={event => {if (event.key === 'Escape') {event.preventDefault();onCancelSelection?.();}}}
                onClick={() => {if (state.selectedCard !== null) submit(state.selectedCard, target.id);}}>
                <span className="p037-practice__decimal">{filled ? target.decimal : '\u00a0'}</span>
              </button></td>
            </tr>;
          })}</tbody>
        </table>
        <div ref={bank} className="p037-practice__bank" data-removed={removed} aria-hidden={removed || undefined}>
          {GAME.cards.map(card => {
            const hidden = p037Matched(state, card.id) || drag?.id === card.id || (card.id === 1 && Boolean(ghost));
            return <div key={card.id} className="p037-practice__bank-cell"><button type="button" ref={node => {if (node) cards.current.set(card.id, node); else cards.current.delete(card.id);}}
              className={'p037-practice__card' + (card.id === 1 && decimalEmphasis ? ' p037-practice__emphasis' : '')}
              data-p037-card={card.id} data-lesson-text-block="decimal-bank" data-p037-emphasis={card.id === 1 && decimalEmphasis ? 'decimal' : undefined}
              disabled={!canInteract || !p037CanDrop(state, card.id) || removed} aria-pressed={state.selectedCard === card.id}
              aria-describedby={popupId + '-keyboard'} aria-hidden={hidden || undefined} style={{visibility: hidden ? 'hidden' : undefined}}
              onPointerDown={event => start(card.id, event)} onPointerMove={move} onPointerUp={release}
              onPointerCancel={() => {if (pointer.current) ignoreClick.current = {id: pointer.current.id, until: Infinity};cancelDrag();onCancelSelection?.();}}
              onKeyDown={event => {if (event.key === 'Escape') {event.preventDefault();cancelDrag();onCancelSelection?.();}}}
              onClick={event => choose(card.id, event)}><span className="p037-practice__decimal">{card.decimal}</span></button></div>;
          })}
        </div>
      </div>
      {intro.guide && <p className="p037-practice__sr" data-lesson-text-block="demonstration">Demonstration: <Fraction value={[1, 2]}/> = 0.5</p>}
      {ghost && <div className="p037-practice__guide p037-practice__card" aria-hidden="true" data-p037-guide="0.5"
        style={{left: reducedMotion ? geometry!.target.x + (geometry!.target.width - ghost.width) / 2 : ghost.x,
          top: reducedMotion ? geometry!.target.y + (geometry!.target.height - ghost.height) / 2 : ghost.y, width: ghost.width, height: ghost.height}}><span className="p037-practice__decimal">0.5</span></div>}
      {geometry && !reducedMotion && intro.pointers.map(pointer => {
        const art = VISUAL.pointerArt[String(pointer.id) as keyof typeof VISUAL.pointerArt], bounds = art.bounds;
        const scale = Math.min(geometry.bank.width / VISUAL.sourceTileSize[0], geometry.bank.height / VISUAL.sourceTileSize[1]);
        const centerX = (ghost?.x ?? geometry.bank.x) + geometry.bank.width / 2, centerY = (ghost?.y ?? geometry.bank.y) + geometry.bank.height / 2;
        const width = (bounds.right - bounds.left) * scale, height = (bounds.bottom - bounds.top) * scale;
        const left = Math.max(0, Math.min(geometry.width - width, centerX + (pointer.matrix[4] + bounds.left - intro.sourceCenter[0]) * scale));
        const top = Math.max(0, Math.min(geometry.height - height, centerY + (pointer.matrix[5] + bounds.top - intro.sourceCenter[1]) * scale));
        return <svg key={pointer.id} className="p037-practice__pointer" data-p037-pointer={pointer.id} aria-hidden="true"
          viewBox={`${bounds.left} ${bounds.top} ${bounds.right - bounds.left} ${bounds.bottom - bounds.top}`}
          style={{left, top, width, height, opacity: pointer.alpha}} dangerouslySetInnerHTML={{__html: art.body.replaceAll('nms2p37-s' + pointer.id + '-', svgScope + '-' + pointer.id + '-')}}/>;
      })}
      {drag && dragRoot && <div className="p037-practice__drag p037-practice__card" aria-hidden="true" data-p037-drag={drag.id}
        style={{left: drag.x - drag.grabX - dragRoot.left - (board.current?.clientLeft ?? 0), top: drag.y - drag.grabY - dragRoot.top - (board.current?.clientTop ?? 0), width: drag.width, height: drag.height}}>
        <span className="p037-practice__decimal">{GAME.cards.find(c => c.id === drag.id)?.decimal}</span></div>}
    </div>
    {state.successPlaying && <div className="p037-practice__success" role="status" data-p037-success-frame={state.successFrame} data-lesson-text-block="success">{VISUAL.correct}</div>}
    {state.popupVisible && <section className="p037-practice__popup" role="region" aria-labelledby={popupId + '-popup'} data-p037-popup-frame={state.popupFrame}>
      <h3 ref={popupTitle} tabIndex={-1} id={popupId + '-popup'} lang={language}>{language === 'es' ? 'Inténtalo de nuevo' : 'Try again'}</h3>
      <p data-lesson-text-block="help-definition"><Runs runs={VISUAL.help} enabled={termsEnabled} onTerm={onTerm}/></p>
      {VISUAL.steps.map((step, i) => <p key={i} data-lesson-text-block={'help-step-' + (i + 1)}>{step}</p>)}
      <button type="button" className="p037-practice__close" data-p037-popup-close data-lesson-text-block="popup-close" lang={language}
        disabled={!canInteract} onClick={onClosePopup}>{language === 'es' ? 'Cerrar' : VISUAL.close}</button>
    </section>}
    <p className="p037-practice__sr" data-p037-native-status role="status" aria-live="polite" lang={language}>{live}</p>
  </section>;
}
