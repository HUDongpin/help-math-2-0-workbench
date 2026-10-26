'use client';
import {useEffect, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P027SourceClockV1, type P027AudioPlan, type P027Picture} from '../../../packages/demos/src/nms-l01-p027-source-clock-v1';

type Localized = Readonly<{en: string; es: string}>;
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Glossary = Readonly<{id: string; labels: Localized; definitions: Localized}>;
type Practice = Readonly<{
  prompt: string;
  choices: readonly Readonly<{id: string; sourceIndex: number; labels: Localized; bounds: Bounds;
    target: Readonly<{id: string; row: number; labels: Localized; bounds: Bounds}>}>[];
  pictures: readonly Readonly<{index: number; sourceCharacterId: number; bounds: Bounds; expandedBounds: Bounds; labels: Localized; firstFrame: number; lastFrame: number}>[];
  introMotionKeyframes: readonly number[];
  wrong: Readonly<{text: string; closeBounds: Bounds}>;
  primaryControls: readonly Readonly<{entryId: string; sourceCharacterId: number}>[];
  hotspots: readonly Readonly<{entryId: string; sourceCharacterId: number; ranges: readonly Readonly<{
    firstFrame: number; lastFrame: number; rect: Readonly<{left: number; right: number; top: number; bottom: number}>;
  }>[]}>[];
  glossary: readonly Glossary[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P027AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P027SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p027';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});

export function NmsL1P027SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P027SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [glossary, setGlossary] = useState<string | null>(null);
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<string | null>(null); glossaryRef.current = glossary;
  const glossaryTrigger = useRef<HTMLElement | null>(null), answerTrigger = useRef<HTMLElement | null>(null);
  const glossaryResume = useRef(false), previousPopup = useRef(false), previousPhase = useRef('');
  const pointer = useRef<{id: number; index: number; startX: number; startY: number; moved: boolean; button: HTMLButtonElement} | null>(null);
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
    let active = true, ready = false, clock: P027SourceClockV1 | undefined, raf = 0, ticket = 0;
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
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-344' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P027_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP027Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP027Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-344' ||
        a.CONFIG.mainFrameCount !== 357 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.choices.length !== 4 || a.PRACTICE.primaryControls.length !== 8 || a.PRACTICE.glossary.length !== 8 || a.PRACTICE.pictures.length !== 4) throw Error('P027_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P027_SOURCE_CANVAS_MISSING');
      const paint = (picture: P027Picture, force = false) => {
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
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-344' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P027SourceClockV1(a.PLAN, { commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P027_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P027_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 357,
          frameDomain: 'sprite-344', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : (s.picture.mainFrame - 1) / 356,
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
  const popupVisible = interaction?.wrongVisible ?? false;
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
  useEffect(() => { if (entry) dialog.current?.querySelector<HTMLButtonElement>('[data-p027-dialog-close]')?.focus(); }, [entry]);
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
      document.querySelector<HTMLButtonElement>('[data-p027-companion] [data-p027-close-wrong]')?.focus({preventScroll: true});
    }
    previousPopup.current = popupVisible;
    if (snapshot?.phase === 'question' && previousPhase.current !== 'question' && snapshot.attempts > 0) {
      const target = answerTrigger.current;
      if (target?.isConnected && !target.hasAttribute('disabled')) target.focus({preventScroll: true});
      else document.querySelector<HTMLButtonElement>('[data-p027-companion] [data-p027-piece]:not(:disabled)')?.focus({preventScroll: true});
    }
    previousPhase.current = snapshot?.phase ?? '';
  }, [popupVisible, snapshot?.phase, snapshot?.attempts]);
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
  const changePicture = (index: number, expanded: boolean) => {
    if (!clockRef.current || glossaryRef.current) return;
    clockRef.current.setPictureExpanded(index, expanded); sync.current();
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
    const target = practice?.choices.find(c => x >= c.target.bounds.x && x <= c.target.bounds.x + c.target.bounds.width &&
      y >= c.target.bounds.y && y <= c.target.bounds.y + c.target.bounds.height);
    drop(p.index, target?.sourceIndex ?? null);
  };

  const selected = practice?.choices.find(c => c.sourceIndex === selectedIndex);
  const canPicture = Boolean(snapshot && snapshot.picture.mainFrame >= 330 && !['failed', 'closed'].includes(snapshot.phase) && !entry);
  const status = snapshot?.allCorrect ? (es ? '¡Correcto! Has relacionado los 4 términos.' : 'Correct! You have matched all 4 terms.')
    : popupVisible ? (es ? 'Inténtalo de nuevo. Cierra el mensaje para continuar.' : 'Try again. Close the message to continue.')
    : canAct ? selectedIndex === null ? (es ? 'Selecciona un término y luego su definición.' : 'Select a term, then its definition.')
      : (es ? `Seleccionado: ${selected?.labels.es}. Elige su definición.` : `Selected: ${selected?.labels.en}. Choose its definition.`)
    : (es ? 'Escucha la explicación.' : 'Listen to the explanation.');
  const companionContent = practice && snapshot ? <section data-p027-companion style={{...boxStyle, margin: '12px auto', width: 'min(100%,760px)'}}>
    <h3 style={{margin: '0 0 8px', fontSize: 19}}>{es ? 'Relaciona los términos' : 'Match the terms'}</h3>
    <p style={{margin: '0 0 10px'}}>{es ? 'Relaciona los términos con las definiciones y las imágenes más adecuadas. Algunas definiciones pueden admitir más de una respuesta; elige la mejor. Arrastra un término o selecciónalo y luego elige su definición.' : practice.prompt}</p>
    <p role="status" aria-live="polite" data-p027-status>{status}</p>
    {reduced ? <p data-p027-reduced-note>{props.labels.reduced}</p> : null}
    {snapshot.picture.mainFrame >= 330 ? <>
      <p data-p027-progress>{es ? 'Términos relacionados' : 'Terms matched'}: {snapshot.solvedCount} / 4</p>
      <div role="group" aria-label={es ? 'Términos para relacionar' : 'Terms to match'} style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
        {practice.choices.map(c => <button type="button" key={c.id} data-p027-piece={c.sourceIndex} aria-pressed={selectedIndex === c.sourceIndex}
          style={{...buttonStyle, fontSize: 18, outline: selectedIndex === c.sourceIndex ? '3px solid #0672c1' : undefined}}
          disabled={!canAct || interaction?.solvedIndices.includes(c.sourceIndex)} aria-label={`${es ? 'Seleccionar' : 'Select'} ${c.labels[language]}`}
          onClick={e => select(c.sourceIndex, e.currentTarget)}>{interaction?.solvedIndices.includes(c.sourceIndex) ? '✓ ' : ''}{c.labels[language]}</button>)}
      </div>
      <p style={{marginBottom: 8}}>{es ? 'Elige una definición' : 'Choose a definition'}</p>
      <div role="group" aria-label={es ? 'Definiciones' : 'Definitions'} style={{display: 'grid', gap: 10}}>
        {[...practice.choices].sort((a, b) => a.target.row - b.target.row).map(c => <button type="button" key={c.id} data-p027-target={c.sourceIndex}
          style={{...buttonStyle, width: '100%', textAlign: 'left', fontSize: 17, lineHeight: 1.5}} disabled={!canAct || selectedIndex === null}
          aria-label={`${es ? 'Definición' : 'Definition'} ${c.target.row}: ${c.target.labels[language]}`}
          onClick={() => selectedIndex !== null && drop(selectedIndex, c.sourceIndex)}>
          <strong>{c.target.row}. </strong>{c.target.labels[language]}
          {interaction?.solvedIndices.includes(c.sourceIndex) ? <span style={{display: 'block', marginTop: 4}}>✓ {c.labels[language]}</span> : null}
        </button>)}
      </div>
      <div style={{marginTop: 18}}>
        <h4 style={{margin: '0 0 8px'}}>{es ? 'Explora las imágenes' : 'Explore the pictures'}</h4>
        <div role="group" aria-label={es ? 'Imágenes de la pregunta' : 'Question pictures'} style={{display: 'grid', gap: 8}}>
          {practice.pictures.map(p => {
            const expanded = interaction?.expandedPictures.includes(p.index) ?? false;
            return <button type="button" key={p.index} data-p027-picture={p.index} aria-pressed={expanded} style={{...buttonStyle, textAlign: 'left', fontSize: 17}}
              disabled={!canPicture} onClick={() => changePicture(p.index, !expanded)}>
              {p.index}. {p.labels[language]} — {expanded ? (es ? 'Reducir' : 'Collapse') : (es ? 'Ampliar' : 'Enlarge')}
            </button>;
          })}
        </div>
      </div>
    </> : null}
    {popupVisible ? <div data-p027-wrong-feedback style={{marginTop: 14, padding: 12, background: '#ffffdd', color: '#17252e', borderRadius: 8}}>
      <p style={{fontSize: 23, margin: '0 0 8px'}}>{es ? '¡Inténtalo de nuevo!' : practice.wrong.text}</p>
      <button type="button" data-p027-close-wrong style={buttonStyle} disabled={Boolean(entry)} onClick={closeWrong}>{es ? 'Cerrar y volver a intentar' : 'Close and try again'}</button>
    </div> : null}
    {snapshot.picture.mainFrame >= 2 ? <div style={{marginTop: 16}}>
      <h4 style={{margin: '0 0 8px'}}>{es ? 'Vocabulario' : 'Vocabulary'}</h4>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>{primary.map(term => <button key={term.id} type="button" data-p027-primary-term={term.id} style={buttonStyle}
        disabled={Boolean(entry)} onClick={e => openGlossary(term.id, e.currentTarget)}>{term.labels[language]}</button>)}</div>
    </div> : null}
  </section> : null;
  const modal = entry ? <div style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,25,42,.48)', display: 'grid', placeItems: 'center', padding: 16}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-glossary-title`} data-p027-dialog={entry.id}
      style={{...boxStyle, width: 'min(100%,620px)', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 16px 60px #10203044'}}>
      <h3 id={`${ID}-glossary-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
      <button type="button" data-p027-dialog-close style={buttonStyle} onClick={closeGlossary}>
        {glossaryResume.current ? (es ? 'Cerrar y continuar' : 'Close and continue') : (es ? 'Cerrar' : 'Close')}
      </button>
    </div>
  </div> : null;
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'intro'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0} data-source-solved-count={snapshot?.solvedCount ?? 0}
    data-source-correct-answer={snapshot?.allCorrect ? 'true' : 'false'} data-source-selected-index={selectedIndex ?? ''}
    data-source-wrong-frame={interaction?.wrongFrame ?? 1} data-source-coach-frame={interaction?.coachFrame ?? 1} data-source-correct-frame={interaction?.correctFrame ?? 1}
    data-source-expanded-pictures={interaction?.expandedPictures.join(',') ?? ''} data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'}
    data-source-host-stop-frame="357" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.allCorrect && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-344" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={practice?.prompt ?? props.labels.loading}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {practice.hotspots.flatMap(h => {
          const r = h.ranges.find(r => paintedFrame >= r.firstFrame && paintedFrame <= r.lastFrame)?.rect;
          const term = practice.glossary.find(e => e.id === h.entryId);
          return r && term ? <button key={h.sourceCharacterId} type="button" data-source-hotspot={h.sourceCharacterId}
            aria-label={term.labels[language]} title={term.labels[language]} disabled={Boolean(entry) || popupVisible}
            style={hitStyle({x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top})}
            onClick={e => openGlossary(h.entryId, e.currentTarget)}/> : [];
        })}
        {paintedFrame === 330 ? practice.choices.map(c => <button key={c.id} type="button" data-p027-source-piece={c.sourceIndex}
          style={{...hitStyle(c.bounds), touchAction: 'none', cursor: canAct ? 'grab' : 'default',
            outline: selectedIndex === c.sourceIndex ? '2px solid #0672c1' : undefined, visibility: interaction?.solvedIndices.includes(c.sourceIndex) ? 'hidden' : 'visible'}}
          aria-label={`${es ? 'Seleccionar o arrastrar' : 'Select or drag'} ${c.labels[language]}`} aria-pressed={selectedIndex === c.sourceIndex}
          disabled={!canAct || interaction?.solvedIndices.includes(c.sourceIndex)}
          onPointerDown={e => pointerDown(c.sourceIndex, e)} onPointerMove={pointerMove} onPointerUp={e => pointerEnd(e)}
          onPointerCancel={e => pointerEnd(e, true)} onLostPointerCapture={e => pointerEnd(e, true)}
          onClick={e => { if (e.detail === 0) select(c.sourceIndex, e.currentTarget); }}/>) : null}
        {paintedFrame === 330 ? practice.choices.map(c => <button key={c.target.id} type="button" data-p027-source-target={c.sourceIndex}
          style={{...hitStyle(c.target.bounds), outline: canAct && selectedIndex !== null ? '1px dashed #5559' : undefined}}
          aria-label={`${es ? 'Definición' : 'Definition'} ${c.target.row}: ${c.target.labels[language]}`} disabled={!canAct || selectedIndex === null}
          onClick={() => selectedIndex !== null && drop(selectedIndex, c.sourceIndex)}/>) : null}
        {paintedFrame >= 330 ? practice.pictures.map(p => {
          const expanded = interaction?.expandedPictures.includes(p.index) ?? false;
          return <button type="button" key={p.index} data-p027-source-picture={p.index} aria-label={`${es ? 'Ampliar' : 'Enlarge'} ${p.labels[language]}`}
            aria-pressed={expanded} disabled={!canPicture || popupVisible} style={{...hitStyle(expanded ? p.expandedBounds : p.bounds), zIndex: 2}}
            onClick={() => changePicture(p.index, true)} onPointerLeave={e => {if (e.pointerType !== 'touch') changePicture(p.index, false);}}/>;
        }) : null}
        {popupVisible ? <button type="button" data-p027-source-close-wrong style={{...hitStyle(practice.wrong.closeBounds), zIndex: 3}}
          aria-label={es ? 'Cerrar y volver a intentar' : 'Close and try again'} disabled={Boolean(entry)} onClick={closeWrong}/> : null}
      </> : null}
    </div>
    {companion ? createPortal(companionContent, companion) : companionContent}
    {modal ? createPortal(modal, document.body) : null}
    {!snapshot && !error ? <p role="status">{props.labels.loading}</p> : null}
    {error ? <p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p> : null}
  </div>;
}
