'use client';
import {useEffect, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P030SourceClockV1, type P030AudioPlan, type P030Picture} from '../../../packages/demos/src/nms-l01-p030-source-clock-v1';

type Localized = Readonly<{en: string; es: string}>;
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Glossary = Readonly<{id: string; labels: Localized; definitions: Localized}>;
type Target = Readonly<{id: string; targetIndex: number; row: number; givenValue: number; value: number; bounds: Bounds}>;
type Hotspot = Readonly<{entryId: string; sourceCharacterId: number; bounds: Bounds}>;
type Practice = Readonly<{
  prompt: string;
  introMotionKeyframes: readonly number[];
  choices: readonly Readonly<{id: string; sourceIndex: number; label: string; value: number; bounds: Bounds;
    paired: boolean; permittedTargets: readonly number[]; sourceDepth: number; copies: number; occurrence: number}>[];
  targets: readonly Target[];
  help: Readonly<{buttonBounds: Bounds; firstButtonFrame: number; lastButtonFrame: number; closeBounds: Bounds;
    text: string; examples: readonly string[]; hotspots: readonly Hotspot[]}>;
  wrong: Readonly<{text: string; closeBounds: Bounds; hotspots: readonly Hotspot[]}>;
  primaryControls: readonly Readonly<{entryId: string; sourceCharacterId: number}>[];
  hotspots: readonly Readonly<{entryId: string; sourceCharacterId: number; ranges: readonly Readonly<{
    firstFrame: number; lastFrame: number; rect: Readonly<{left: number; right: number; top: number; bottom: number}>;
  }>[]}>[];
  glossary: readonly Glossary[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P030AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P030SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p030';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});

export function NmsL1P030SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P030SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [glossary, setGlossary] = useState<string | null>(null);
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<string | null>(null); glossaryRef.current = glossary;
  const glossaryTrigger = useRef<HTMLElement | null>(null), answerTrigger = useRef<HTMLElement | null>(null);
  const glossaryResume = useRef(false), previousPopup = useRef(false), previousPhase = useRef(''), previousHelp = useRef(false);
  const pointer = useRef<{id: number; index: number; startX: number; startY: number; moved: boolean; button: HTMLButtonElement} | null>(null);
  const helpTrigger = useRef<HTMLElement | null>(null);
  const language = props.uiLanguage === 'es' ? 'es' : 'en', es = language === 'es';

  useEffect(() => {
    const source = stage.current, owner = source?.closest('.lesson-shell2__learning-column'), id = props.pageInteractionCompanionTargetId;
    if (!source || !owner || !id?.endsWith('-terminal-source-v1-readable')) return;
    const resolve = () => {
      const target = document.getElementById(id);
      setCompanion(target?.parentElement === owner && target.dataset.pageInteractionCompanionHost === 'true' && !source.contains(target) ? target : null);
    };
    resolve(); const observer = new MutationObserver(resolve); observer.observe(owner, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    let active = true, ready = false, clock: P030SourceClockV1 | undefined, raf = 0, ticket = 0;
    let lastPaint = '', lastView = '', lastReport = '', completeReported = false, wantPlay = !latest.current.paused, painted = 1, runtimeFailed = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)'); let motion = media.matches; setReduced(motion);
    const motionChanged = () => { motion = media.matches; setReduced(motion); };
    media.addEventListener('change', motionChanged);
    const pause = () => { pointer.current = null; wantPlay = false; ticket++; clock?.pause(); latest.current.onRuntimePausedChange(true); };
    const start = (activation: 'automatic' | 'user') => {
      wantPlay = true;
      if (!active || !ready || !clock || glossaryRef.current) return;
      if (motion && activation === 'automatic') { pause(); return; }
      if (clock.snapshot().phase === 'ended') { clock.replay(); setGlossary(null); completeReported = false; latest.current.onReplay?.(); }
      const turn = ++ticket; latest.current.onRuntimePausedChange(false);
      void clock.play({activation, reducedMotion: motion}).then(r => { if (active && turn === ticket && !r.accepted) pause(); });
    };
    const stop = () => { pointer.current = null; active = false; ticket++; cancelAnimationFrame(raf); void clock?.close(); };
    const controls: LessonRuntimeAdapterControls = {
      setPaused: value => value ? pause() : start('user'),
      replay() {
        if (!active || !ready || !clock) return false;
        pointer.current = null; ticket++; clock.replay(); setGlossary(null); glossaryRef.current = null; glossaryResume.current = false;
        completeReported = false; start('user'); return true;
      },
      narration: action => action === 'stop' ? pause() : start('user'), stop,
    };
    controlsRef.current = controls; const disconnect = props.connectRuntimeControls(controls);
    const init = async () => {
      if (process.env.NODE_ENV === 'production' || props.animationId !== ID || props.moduleKey !== ID || props.audioEnabled !== true ||
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-113' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P030_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP030Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP030Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-113' ||
        a.CONFIG.mainFrameCount !== 450 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.choices.length !== 15 || a.PRACTICE.targets.length !== 8 || a.PRACTICE.primaryControls.length !== 3 || a.PRACTICE.glossary.length !== 5) throw Error('P030_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P030_SOURCE_CANVAS_MISSING');
      const paint = (picture: P030Picture, force = false) => {
        const target = canvas.current;
        if (!active || !target || window.HELP_MATH_CANVAS_ASSETS?.[ID] !== asset) return false;
        let frame = picture.mainFrame, interaction = picture.interaction;
        if (motion && !force && !latest.current.paused) {
          frame = [...a.PRACTICE.introMotionKeyframes].reverse().find(n => n <= frame) ?? 1;
          interaction = {...interaction, wrongFrame: interaction.wrongVisible ? 2 : 1,
            coachFrame: interaction.coachFrame > 1 ? 2 : 1, correctFrame: interaction.correctFrame > 1 ? 2 : 1};
        }
        const request = {frame, scenario: 'source-static-frame', lang: 'en', seed: 0, interaction}, key = JSON.stringify(request);
        if (key !== lastPaint) {
          const state = asset.render(target, request) as {localFrame?: number; frameDomain?: string};
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-113' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P030SourceClockV1(a.PLAN, { commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P030_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P030_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 450,
          frameDomain: 'sprite-113', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : (s.picture.mainFrame - 1) / 449,
          seekAvailable: true, stepFrames: 20, transportMode: 'visual-frame-inspector'};
        const key = JSON.stringify(report); if (key !== lastReport) { lastReport = key; latest.current.onPlaybackStateChange?.(report); }
        if (s.phase === 'ended' && !completeReported) {
          completeReported = true; if (s.allCorrect && !s.inspectionMode && !motion) latest.current.onPlaybackComplete?.();
          latest.current.onRuntimePausedChange(true);
        }
        if (s.phase === 'paused' && s.globalPaused && !latest.current.paused) latest.current.onRuntimePausedChange(true);
      };
      sync.current = draw; const loop = () => { draw(); if (active) raf = requestAnimationFrame(loop); };
      loop(); if (wantPlay) start('automatic'); else latest.current.onRuntimePausedChange(true);
    };
    void init().catch(e => { if (!active) return; pause(); void clock?.close(); setError(e instanceof Error ? e.message : String(e)); });
    return () => {
      stop(); sync.current = () => {}; media.removeEventListener('change', motionChanged); disconnect();
      if (clockRef.current === clock) clockRef.current = null; if (controlsRef.current === controls) controlsRef.current = null;
    };
  }, [props.animationId, props.moduleKey, props.audioEnabled, props.connectRuntimeControls]);
  useEffect(() => {
    const c = clockRef.current; if (!c) return;
    if (props.paused && ['playing', 'starting'].includes(c.snapshot().phase)) c.pause();
    else if (!props.paused && snapshot && c.snapshot().phase === 'paused' && !glossaryRef.current) controlsRef.current?.setPaused(false);
  }, [props.paused, Boolean(snapshot)]);
  useEffect(() => { clockRef.current?.setVolume(props.volume ?? 1); }, [props.volume]);
  useEffect(() => {
    const q = props.seekRequest, c = clockRef.current;
    if (!q || !c || !snapshot || q.requestId === lastSeek.current) return;
    lastSeek.current = q.requestId; setGlossary(null); glossaryRef.current = null; glossaryResume.current = false;
    pointer.current = null; c.inspect(q.frame); props.onRuntimePausedChange(true); sync.current();
  }, [props.seekRequest, Boolean(snapshot), props.onRuntimePausedChange]);

  const entry = practice?.glossary.find(e => e.id === glossary);
  const interaction = snapshot?.picture.interaction;
  const isPlaced = (index: number) => Boolean(interaction?.assignments.some(a => a.sourceIndex === index));
  const isFilled = (index: number) => Boolean(interaction?.assignments.some(a => a.targetIndex === index));
  const popupVisible = interaction?.wrongVisible ?? false, helpVisible = interaction?.helpVisible ?? false;
  const canAct = Boolean(interaction?.inputEnabled && !entry), selectedIndex = interaction?.selectedIndex ?? null;
  const primary = practice?.primaryControls.map(c => practice.glossary.find(e => e.id === c.entryId)!).filter(Boolean) ?? [];
  const openGlossary = (id: string, trigger: HTMLElement) => {
    if (!practice?.glossary.some(e => e.id === id) || glossaryRef.current) return;
    const c = clockRef.current; if (!c) return;
    glossaryTrigger.current = trigger; glossaryResume.current = c.snapshot().phase === 'playing' && !c.snapshot().globalPaused;
    c.pause(); pointer.current = null; props.onRuntimePausedChange(true); glossaryRef.current = id; setGlossary(id); sync.current();
  };
  const closeGlossary = () => {
    const resume = glossaryResume.current; glossaryResume.current = false;
    glossaryRef.current = null; setGlossary(null);
    if (resume) controlsRef.current?.setPaused(false);
    const target = glossaryTrigger.current; glossaryTrigger.current = null;
    requestAnimationFrame(() => { if (target?.isConnected) target.focus({preventScroll: true}); });
  };
  const closeGlossaryRef = useRef(closeGlossary); closeGlossaryRef.current = closeGlossary;
  useEffect(() => { if (entry) dialog.current?.querySelector<HTMLButtonElement>('[data-p030-dialog-close]')?.focus(); }, [entry]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const el = dialog.current; if (!el || !glossaryRef.current) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeGlossaryRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')], first = items[0], last = items.at(-1);
      if (first && last && (!el.contains(document.activeElement) || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', keydown, true); return () => document.removeEventListener('keydown', keydown, true);
  }, []);
  useEffect(() => {
    if (popupVisible && !previousPopup.current && !glossaryRef.current) {
      document.querySelector<HTMLButtonElement>('[data-p030-companion] [data-p030-close-wrong]')?.focus({preventScroll: true});
    }
    if (helpVisible && !previousHelp.current && !glossaryRef.current) {
      document.querySelector<HTMLButtonElement>('[data-p030-companion] [data-p030-close-help]')?.focus({preventScroll: true});
    }
    previousPopup.current = popupVisible; previousHelp.current = helpVisible;
    if (snapshot?.phase === 'question' && previousPhase.current !== 'question' && snapshot.attempts > 0) {
      const target = answerTrigger.current;
      if (target?.isConnected && !target.hasAttribute('disabled')) target.focus({preventScroll: true});
      else document.querySelector<HTMLButtonElement>('[data-p030-companion] [data-p030-piece]:not(:disabled)')?.focus({preventScroll: true});
    }
    previousPhase.current = snapshot?.phase ?? '';
  }, [popupVisible, helpVisible, snapshot?.phase, snapshot?.attempts]);
  const select = (index: number, trigger: HTMLElement) => {
    if (!canAct || !clockRef.current) return; answerTrigger.current = trigger;
    clockRef.current.select(index); sync.current();
  };
  const drop = (index: number, target: number | null) => {
    if (!canAct || !clockRef.current) return;
    props.onRuntimePausedChange(false);
    void clockRef.current.drop(index, target, {activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
  };
  const closeWrong = () => {
    if (!clockRef.current || glossaryRef.current) return;
    clockRef.current.closeWrong(); props.onRuntimePausedChange(false); sync.current();
  };
  const openHelp = (trigger: HTMLElement) => {
    if (!clockRef.current || glossaryRef.current) return;
    helpTrigger.current = trigger;
    if (clockRef.current.openHelp().accepted) props.onRuntimePausedChange(true);
    sync.current();
  };
  const closeHelp = () => {
    if (!clockRef.current || glossaryRef.current) return;
    void clockRef.current.closeHelp({activation: 'user', reducedMotion: reduced}).then(() => {
      const s = clockRef.current?.snapshot(); props.onRuntimePausedChange(s?.globalPaused ?? true); sync.current();
      const target = helpTrigger.current; if (target?.isConnected) target.focus({preventScroll: true});
    });
  };
  const pointerDown = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    if (!canAct || event.button !== 0 || pointer.current || !clockRef.current?.beginDrag(index).accepted) return;
    event.preventDefault(); event.currentTarget.focus({preventScroll: true}); answerTrigger.current = event.currentTarget;
    pointer.current = {id: event.pointerId, index, startX: event.clientX, startY: event.clientY, moved: false, button: event.currentTarget};
    event.currentTarget.setPointerCapture(event.pointerId); sync.current();
  };
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const p = pointer.current, box = stage.current?.getBoundingClientRect();
    if (!p || p.id !== event.pointerId || !box?.width || !box.height) return;
    const dx = event.clientX - p.startX, dy = event.clientY - p.startY;
    p.moved ||= Math.hypot(dx, dy) > 5;
    clockRef.current?.moveDrag(dx * 800 / box.width, dy * 600 / box.height); sync.current();
  };
  const pointerEnd = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const p = pointer.current, box = stage.current?.getBoundingClientRect();
    if (!p || p.id !== event.pointerId) return;
    pointer.current = null;
    if (p.button.hasPointerCapture(event.pointerId)) p.button.releasePointerCapture(event.pointerId);
    if (cancelled || !box?.width || !box.height) { clockRef.current?.cancelDrag(); sync.current(); return; }
    if (!p.moved) { clockRef.current?.cancelDrag(); select(p.index, p.button); return; }
    const x = (event.clientX - box.left) * 800 / box.width, y = (event.clientY - box.top) * 600 / box.height;
    const target = [...(practice?.targets ?? [])].reverse().find(t => x >= t.bounds.x && x <= t.bounds.x + t.bounds.width &&
      y >= t.bounds.y && y <= t.bounds.y + t.bounds.height);
    drop(p.index, target?.targetIndex ?? null);
  };
  const status = snapshot?.allCorrect ? (es ? '¡Correcto! Has completado los 8 valores absolutos.' : 'Correct! You have completed all 8 absolute values.')
    : popupVisible ? (es ? 'Inténtalo de nuevo. Cierra el mensaje para continuar.' : 'Try again. Close the message to continue.')
    : helpVisible ? (es ? 'Revisa los ejemplos y cierra la ayuda para continuar.' : 'Review the examples, then close Help to continue.')
    : canAct ? selectedIndex === null ? (es ? 'Selecciona un entero y luego la fila de su valor absoluto.' : 'Select an integer, then the row for its absolute value.')
      : (es ? `Seleccionado: ${practice?.choices.find(c => c.sourceIndex === selectedIndex)?.label}. Elige una fila.` : `Selected: ${practice?.choices.find(c => c.sourceIndex === selectedIndex)?.label}. Choose a row.`)
    : (es ? 'Escucha la explicación.' : 'Listen to the explanation.');
  const companionContent = practice && snapshot ? <section data-p030-companion style={{...boxStyle, margin: '12px auto', width: 'min(100%,700px)'}}>
    <h3 style={{margin: '0 0 8px', fontSize: 18}}>{es ? 'Valores absolutos' : 'Absolute values'}</h3>
    <p style={{margin: '0 0 10px'}}>{es ? 'Arrastra cada valor absoluto a la casilla correcta de la columna Valor absoluto. No se usarán todos los enteros.' : practice.prompt}</p>
    {reduced ? <p data-p030-reduced-note>{props.labels.reduced}</p> : null}
    <p role="status" aria-live="polite" data-p030-status>{status}</p>
    {snapshot.picture.mainFrame >= 449 ? <>
      <p data-p030-progress>{es ? 'Filas completadas' : 'Rows completed'}: {snapshot.solvedCount} / 8</p>
      <div role="group" aria-label={es ? 'Enteros disponibles' : 'Available integers'} style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
        {[...practice.choices].sort((a,b) => a.value-b.value || a.sourceIndex-b.sourceIndex).map(c => <button type="button" key={c.id} data-p030-piece={c.sourceIndex} aria-pressed={selectedIndex === c.sourceIndex}
          style={{...buttonStyle, minWidth: 54, fontSize: 21, outline: selectedIndex === c.sourceIndex ? '3px solid #0672c1' : undefined}}
          disabled={!canAct || isPlaced(c.sourceIndex)} aria-label={`${es ? 'Seleccionar' : 'Select'} ${c.label}${c.copies > 1 ? ` (${c.occurrence} ${es ? 'de' : 'of'} ${c.copies})` : ''}`}
          onClick={e => select(c.sourceIndex, e.currentTarget)}>{isPlaced(c.sourceIndex) ? '✓ ' : ''}{c.label}</button>)}
      </div>
      <p style={{marginBottom: 8}}>{es ? 'Elige la fila del valor absoluto' : 'Choose the row for the absolute value'}</p>
      <div role="group" aria-label={es ? 'Filas de enteros' : 'Integer rows'} style={{display: 'grid', gap: 8, paddingTop: 12, borderTop: '3px solid #9d26bd'}}>
        {practice.targets.map(t => <button type="button" key={t.id} data-p030-target={t.targetIndex}
          style={{...buttonStyle, minWidth: 54, fontSize: 19, textAlign: 'left'}} disabled={!canAct || selectedIndex === null || isFilled(t.targetIndex)}
          aria-label={`${es ? 'Valor absoluto de' : 'Absolute value of'} ${String(t.givenValue).replace('-', '−')}`}
          onClick={() => selectedIndex !== null && drop(selectedIndex, t.targetIndex)}>
          {es ? 'Entero' : 'Integer'}: {String(t.givenValue).replace('-', '−')} → {es ? 'Valor absoluto' : 'Absolute value'}: {isFilled(t.targetIndex) ? `✓ ${String(t.value).replace('-', '−')}` : '?'}
        </button>)}
      </div>
    </> : null}
    {popupVisible ? <div data-p030-wrong-feedback style={{marginTop: 14, padding: 12, background: '#ffffdd', color: '#17252e', borderRadius: 8}}>
      <p style={{fontSize: 18, margin: '0 0 8px'}}>{es ? 'El valor absoluto de un número es su distancia desde cero en una recta numérica. Para un número positivo, es el mismo número. Para un número negativo, es su valor positivo. Inténtalo de nuevo.' : practice.wrong.text}</p>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12}}>{practice.wrong.hotspots.map(h => <button key={h.entryId} type="button" data-p030-wrong-term={h.entryId}
        disabled={Boolean(entry)} style={buttonStyle} onClick={e => openGlossary(h.entryId, e.currentTarget)}>{practice.glossary.find(g => g.id === h.entryId)?.labels[language]}</button>)}</div>
      <button type="button" data-p030-close-wrong style={buttonStyle} disabled={Boolean(entry)} onClick={closeWrong}>{es ? 'Cerrar y volver a intentar' : 'Close and try again'}</button>
    </div> : null}
    {snapshot.picture.mainFrame >= 449 && snapshot.picture.mainFrame <= 449 ? <button type="button" data-p030-help style={{...buttonStyle, marginTop: 14}}
      disabled={!interaction?.helpEnabled || Boolean(entry)} onClick={e => openHelp(e.currentTarget)}>{es ? 'Más ayuda' : 'Need More Help'}</button> : null}
    {helpVisible ? <div data-p030-help-content style={{...boxStyle, marginTop: 14}}>
      <h4 style={{margin: '0 0 8px'}}>{es ? 'Ejemplos de valor absoluto' : 'Absolute value examples'}</h4>
      <p>{es ? 'El valor absoluto de un número es su distancia desde cero en una recta numérica. Para un número positivo, es el mismo número. Para un número negativo, es su valor positivo.' : practice.help.text}</p>
      <p>{es ? 'Ejemplos' : 'Examples'}: |1| = 1; |−1| = 1; |−12| = 12.</p>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>{practice.help.hotspots.map(h => <button key={h.entryId} type="button" data-p030-help-term={h.entryId}
        disabled={Boolean(entry)} style={buttonStyle} onClick={e => openGlossary(h.entryId, e.currentTarget)}>{practice.glossary.find(g => g.id === h.entryId)?.labels[language]}</button>)}</div>
      <button type="button" data-p030-close-help style={{...buttonStyle, marginTop: 12}} disabled={Boolean(entry)} onClick={closeHelp}>{es ? 'Cerrar ayuda' : 'Close Help'}</button>
    </div> : null}
    {snapshot.picture.mainFrame >= 2 ? <div style={{marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap'}}>{primary.map(term => <button key={term.id} type="button" data-p030-primary-term={term.id} style={buttonStyle}
      disabled={Boolean(entry)} onClick={e => openGlossary(term.id, e.currentTarget)}>{term.labels[language]}</button>)}</div> : null}
  </section> : null;
  const modal = entry ? <div style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,25,42,.48)', display: 'grid', placeItems: 'center', padding: 16}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-glossary-title`} data-p030-dialog={entry.id}
      style={{...boxStyle, width: 'min(100%,620px)', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 16px 60px #10203044'}}>
      <h3 id={`${ID}-glossary-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
      <button type="button" data-p030-dialog-close style={buttonStyle} onClick={closeGlossary}>
        {helpVisible ? (es ? 'Volver a la ayuda' : 'Back to Help') : popupVisible ? (es ? 'Volver al mensaje' : 'Back to feedback') : glossaryResume.current ? (es ? 'Cerrar y continuar' : 'Close and continue') : (es ? 'Cerrar' : 'Close')}
      </button>
    </div>
  </div> : null;
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'intro'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0} data-source-solved-count={snapshot?.solvedCount ?? 0}
    data-source-assignments={JSON.stringify(interaction?.assignments ?? [])}
    data-source-correct-answer={snapshot?.allCorrect ? 'true' : 'false'} data-source-selected-index={selectedIndex ?? ''}
    data-source-wrong-frame={interaction?.wrongFrame ?? 1} data-source-coach-frame={interaction?.coachFrame ?? 1} data-source-correct-frame={interaction?.correctFrame ?? 1}
    data-source-help-visible={helpVisible ? 'true' : 'false'} data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'}
    data-source-host-stop-frame="450" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.allCorrect && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-113" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={practice?.prompt ?? props.labels.loading}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {practice.hotspots.flatMap(h => {
          const term = practice.glossary.find(e => e.id === h.entryId); if (!term) return [];
          return h.ranges.filter(r => paintedFrame >= r.firstFrame && paintedFrame <= r.lastFrame).map(({rect: r}, occurrence) =>
            <button key={`${h.sourceCharacterId}-${occurrence}`} type="button" data-source-hotspot={h.sourceCharacterId} data-source-hotspot-occurrence={occurrence}
              aria-label={term.labels[language]} title={term.labels[language]} disabled={Boolean(entry) || helpVisible || popupVisible}
              style={hitStyle({x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top})}
              onClick={e => openGlossary(h.entryId, e.currentTarget)}/>
          );
        })}
        {paintedFrame === 449 && !helpVisible ? [...practice.choices].sort((a,b) => a.sourceDepth-b.sourceDepth).map(c => <button key={c.id} type="button" data-p030-source-piece={c.sourceIndex}
          style={{...hitStyle(c.bounds), touchAction: 'none', cursor: canAct ? 'grab' : 'default',
            outline: selectedIndex === c.sourceIndex ? '2px solid #0672c1' : undefined, visibility: isPlaced(c.sourceIndex) ? 'hidden' : 'visible'}}
          aria-label={`${es ? 'Seleccionar o arrastrar' : 'Select or drag'} ${c.label}`} aria-pressed={selectedIndex === c.sourceIndex}
          disabled={!canAct || isPlaced(c.sourceIndex)}
          onPointerDown={e => pointerDown(c.sourceIndex, e)} onPointerMove={pointerMove} onPointerUp={e => pointerEnd(e)}
          onPointerCancel={e => pointerEnd(e, true)} onLostPointerCapture={e => pointerEnd(e, true)}
          onClick={e => { if (e.detail === 0) select(c.sourceIndex, e.currentTarget); }}/>) : null}
        {paintedFrame === 449 && !helpVisible ? practice.targets.map(t => <button key={t.id} type="button" data-p030-source-target={t.targetIndex}
          style={{...hitStyle(t.bounds), outline: canAct && selectedIndex !== null ? '1px dashed #5559' : undefined}}
          aria-label={`${es ? 'Valor absoluto de' : 'Absolute value of'} ${String(t.givenValue).replace('-', '−')}`} disabled={!canAct || selectedIndex === null || isFilled(t.targetIndex)}
          onClick={() => selectedIndex !== null && drop(selectedIndex, t.targetIndex)}/>) : null}
        {paintedFrame >= 449 && paintedFrame <= 449 && !helpVisible ? <button type="button" data-p030-source-help style={hitStyle(practice.help.buttonBounds)}
          aria-label={es ? 'Más ayuda' : 'Need More Help'} disabled={!interaction?.helpEnabled || Boolean(entry)} onClick={e => openHelp(e.currentTarget)}/> : null}
        {popupVisible ? <>
          {practice.wrong.hotspots.map(h => <button type="button" key={h.entryId} data-p030-source-wrong-term={h.entryId} style={hitStyle(h.bounds)}
            aria-label={practice.glossary.find(g => g.id === h.entryId)?.labels[language]} disabled={Boolean(entry)} onClick={e => openGlossary(h.entryId, e.currentTarget)}/>)}
          <button type="button" data-p030-source-close-wrong style={hitStyle(practice.wrong.closeBounds)}
            aria-label={es ? 'Cerrar y volver a intentar' : 'Close and try again'} disabled={Boolean(entry)} onClick={closeWrong}/>
        </> : null}
        {helpVisible ? <>
          {practice.help.hotspots.map(h => <button type="button" key={h.entryId} data-p030-source-help-term={h.entryId} style={hitStyle(h.bounds)}
            aria-label={practice.glossary.find(g => g.id === h.entryId)?.labels[language]} disabled={Boolean(entry)} onClick={e => openGlossary(h.entryId, e.currentTarget)}/>)}
          <button type="button" data-p030-source-close-help style={hitStyle(practice.help.closeBounds)} aria-label={es ? 'Cerrar ayuda' : 'Close Help'}
            disabled={Boolean(entry)} onClick={closeHelp}/>
        </> : null}
      </> : null}
    </div>
    {companion ? createPortal(companionContent, companion) : companionContent}
    {modal ? createPortal(modal, document.body) : null}
    {!snapshot && !error ? <p role="status">{props.labels.loading}</p> : null}
    {error ? <p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p> : null}
  </div>;
}
