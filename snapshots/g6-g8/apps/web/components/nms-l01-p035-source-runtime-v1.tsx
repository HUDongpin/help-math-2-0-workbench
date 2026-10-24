'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P035SourceClockV1, type P035AudioPlan, type P035Picture} from '../../../packages/demos/src/nms-l01-p035-source-clock-v1';

type Localized = Readonly<{en: string; es: string}>;
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Glossary = Readonly<{id: string; labels: Localized; definitions: Localized}>;
type Hotspot = Readonly<{entryId: string; sourceCharacterId: number; bounds: Bounds}>;
type Choice = Readonly<{sourceInstanceName: string; sourceCharacterId: number; letter: string; value: number; correct: boolean; bounds: Bounds}>;
type Practice = Readonly<{
 prompt: string; introMotionKeyframes: readonly number[]; choices: readonly Choice[];
 branches: readonly Readonly<{sourceCharacterId: number; popupCloseBounds?: Bounds; waitFrame?: number; popupEntryFrame?: number}>[];
 help: Readonly<{buttonBounds: Bounds; closeBounds: Bounds; text: string; example: string; hotspots: readonly Hotspot[]}>;
 wrongText: string; wrongRetrySuffix: string;
 primaryControls: readonly Readonly<{entryId: string; sourceCharacterId: number}>[];
 hotspots: readonly Readonly<{entryId: string; sourceCharacterId: number; ranges: readonly Readonly<{
  firstFrame: number; lastFrame: number; rect: Readonly<{left: number; right: number; top: number; bottom: number}>;
 }>[]}>[];
 glossary: readonly Glossary[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P035AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P035SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p035';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});

export function NmsL1P035SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P035SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [glossary, setGlossary] = useState<string | null>(null);
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<string | null>(null); glossaryRef.current = glossary;
  const glossaryTrigger = useRef<HTMLElement | null>(null), answerTrigger = useRef<HTMLElement | null>(null);
  const glossaryResume = useRef(false), previousPopup = useRef(false), previousPhase = useRef(''), previousHelp = useRef(false);
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
    let active = true, ready = false, clock: P035SourceClockV1 | undefined, raf = 0, ticket = 0;
    let lastPaint = '', lastView = '', lastReport = '', completeReported = false, wantPlay = !latest.current.paused, painted = 1, runtimeFailed = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)'); let motion = media.matches; setReduced(motion);
    const motionChanged = () => { motion = media.matches; setReduced(motion); };
    media.addEventListener('change', motionChanged);
    const pause = () => { wantPlay = false; ticket++; clock?.pause(); latest.current.onRuntimePausedChange(true); };
    const start = (activation: 'automatic' | 'user') => {
      wantPlay = true;
      if (!active || !ready || !clock || glossaryRef.current) return;
      if (motion && activation === 'automatic') { pause(); return; }
      if (clock.snapshot().phase === 'ended') { clock.replay(); setGlossary(null); completeReported = false; latest.current.onReplay?.(); }
      const turn = ++ticket; latest.current.onRuntimePausedChange(false);
      void clock.play({activation, reducedMotion: motion}).then(r => { if (active && turn === ticket && !r.accepted) pause(); });
    };
    const stop = () => { active = false; ticket++; cancelAnimationFrame(raf); void clock?.close(); };
    const controls: LessonRuntimeAdapterControls = {
      setPaused: value => value ? pause() : start('user'),
      replay() {
        if (!active || !ready || !clock) return false;
        ticket++; clock.replay(); setGlossary(null); glossaryRef.current = null; glossaryResume.current = false;
        completeReported = false; start('user'); return true;
      },
      narration: action => action === 'stop' ? pause() : start('user'), stop,
    };
    controlsRef.current = controls; const disconnect = props.connectRuntimeControls(controls);
    const init = async () => {
      if (process.env.NODE_ENV === 'production' || props.animationId !== ID || props.moduleKey !== ID || props.audioEnabled !== true ||
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-246' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P035_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP035Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP035Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-246' ||
        a.CONFIG.mainFrameCount !== 623 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.choices.length !== 4 || a.PRACTICE.branches.length !== 7 || a.PRACTICE.primaryControls.length !== 3 || a.PRACTICE.glossary.length !== 6 || a.PRACTICE.help.hotspots.length !== 3) throw Error('P035_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P035_SOURCE_CANVAS_MISSING');
      const paint = (picture: P035Picture, force = false) => {
        const target = canvas.current;
        if (!active || !target || window.HELP_MATH_CANVAS_ASSETS?.[ID] !== asset) return false;
        let frame = picture.mainFrame, interaction = picture.interaction;
        if (motion && !force && !latest.current.paused) {
          frame = [...a.PRACTICE.introMotionKeyframes].reverse().find(n => n <= frame) ?? 1;
          // Keep readable popup frames when motion is reduced, while native clocks continue.
          const branch = a.PRACTICE.branches.find(b => b.sourceCharacterId === interaction.feedbackCharacterId);
          interaction = {...interaction, feedbackFrame: interaction.feedbackCharacterId === null ? 1 : interaction.popupVisible ? branch?.waitFrame ?? interaction.feedbackFrame : 2};
        }
        const request = {frame, scenario: 'source-static-frame', lang: 'en', seed: 0, interaction}, key = JSON.stringify(request);
        if (key !== lastPaint) {
          const state = asset.render(target, request) as {localFrame?: number; frameDomain?: string};
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-246' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P035SourceClockV1(a.PLAN, { commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P035_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P035_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 623,
          frameDomain: 'sprite-246', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : (s.picture.mainFrame - 1) / 622,
          seekAvailable: true, stepFrames: 20, transportMode: 'visual-frame-inspector'};
        const key = JSON.stringify(report); if (key !== lastReport) { lastReport = key; latest.current.onPlaybackStateChange?.(report); }
        if (s.phase === 'ended' && !completeReported) {
          completeReported = true; if (s.outcome !== 'unanswered' && !s.inspectionMode && !motion) latest.current.onPlaybackComplete?.();
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
    c.inspect(q.frame); props.onRuntimePausedChange(true); sync.current();
  }, [props.seekRequest, Boolean(snapshot), props.onRuntimePausedChange]);

  const entry = practice?.glossary.find(e => e.id === glossary);
  const interaction = snapshot?.picture.interaction;
  const popupVisible = interaction?.popupVisible ?? false, helpVisible = interaction?.helpVisible ?? false;
  const canAct = Boolean(interaction?.choicesEnabled && !entry);
  const primary = practice?.primaryControls.map(c => practice.glossary.find(e => e.id === c.entryId)!).filter(Boolean) ?? [];
  const branch = practice?.branches.find(b => b.sourceCharacterId === interaction?.feedbackCharacterId);
  const openGlossary = (id: string, trigger: HTMLElement) => {
    if (!practice?.glossary.some(e => e.id === id) || glossaryRef.current) return;
    const c = clockRef.current; if (!c) return;
    glossaryTrigger.current = trigger; glossaryResume.current = c.snapshot().phase === 'playing' && !c.snapshot().globalPaused;
    c.pause(); props.onRuntimePausedChange(true); glossaryRef.current = id; setGlossary(id); sync.current();
  };
  const closeGlossary = () => {
    const resume = glossaryResume.current; glossaryResume.current = false;
    glossaryRef.current = null; setGlossary(null);
    if (resume) controlsRef.current?.setPaused(false);
    const target = glossaryTrigger.current; glossaryTrigger.current = null;
    requestAnimationFrame(() => { if (target?.isConnected) target.focus({preventScroll: true}); });
  };
  const closeGlossaryRef = useRef(closeGlossary); closeGlossaryRef.current = closeGlossary;
  useEffect(() => { if (entry) dialog.current?.querySelector<HTMLButtonElement>('[data-p035-dialog-close]')?.focus(); }, [entry]);
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
      document.querySelector<HTMLButtonElement>('[data-p035-companion] [data-p035-close-wrong]')?.focus({preventScroll: true});
    }
    if (helpVisible && !previousHelp.current && !glossaryRef.current) {
      document.querySelector<HTMLButtonElement>('[data-p035-companion] [data-p035-close-help]')?.focus({preventScroll: true});
    }
    previousPopup.current = popupVisible; previousHelp.current = helpVisible;
    if (snapshot?.phase === 'question' && previousPhase.current !== 'question' && snapshot.attempts > 0) {
      const target = answerTrigger.current;
      if (target?.isConnected && !target.hasAttribute('disabled')) target.focus({preventScroll: true});
      else document.querySelector<HTMLButtonElement>('[data-p035-companion] [data-p035-choice]:not(:disabled)')?.focus({preventScroll: true});
    }
    previousPhase.current = snapshot?.phase ?? '';
  }, [popupVisible, helpVisible, snapshot?.phase, snapshot?.attempts]);
  const choose = (id: string, trigger: HTMLElement) => {
    if (!canAct || !clockRef.current) return;
    answerTrigger.current = trigger; props.onRuntimePausedChange(false);
    void clockRef.current.choose(id, {activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
  };
  const closeWrong = () => {
    if (!clockRef.current || glossaryRef.current) return;
    props.onRuntimePausedChange(false);
    void clockRef.current.closeWrong({activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
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
  const status = snapshot?.phase === 'ended' ? (snapshot.correctAnswer ? (es ? 'Correcto: la temperatura era de 65 °F.' : 'Correct: the temperature was 65 °F.') : (es ? 'La solución es 65 °F. Puedes volver a intentarlo con Repetir.' : 'The solution is 65 °F. Use Replay to try again.'))
    : popupVisible ? (snapshot?.wrongAttempts === 1 ? (es ? 'Inténtalo de nuevo. Cierra el mensaje para continuar.' : 'Try again. Close the message to continue.') : (es ? 'Cierra el mensaje para ver la solución.' : 'Close the message to see the solution.'))
    : helpVisible ? (es ? 'Revisa el ejemplo y cierra la ayuda para continuar.' : 'Review the example, then close Help to continue.')
    : canAct ? (es ? 'Selecciona la temperatura a las 10:00 p. m.' : 'Choose the temperature at 10:00 PM.')
    : (es ? 'Escucha la explicación.' : 'Listen to the explanation.');
  const closeWrongLabel = snapshot?.wrongAttempts === 1 ? (es ? 'Cerrar y volver a intentar' : 'Close and try again') : (es ? 'Cerrar y ver la solución' : 'Close and see the solution');
  const wrongText = es ? 'Entre las 5:00 p. m. y las 10:00 p. m. pasan 5 horas. La temperatura baja 1 °F cada hora. Resta la disminución total de 5 °F a los 70 °F iniciales.' + (snapshot?.wrongAttempts === 1 ? ' Inténtalo de nuevo.' : '') : (practice?.wrongText ?? '') + (snapshot?.wrongAttempts === 1 ? practice?.wrongRetrySuffix ?? '' : '');
  const companionContent = practice && snapshot ? <section data-p035-companion style={{...boxStyle, margin: '12px auto', width: 'min(100%,700px)'}}>
    <h3 style={{margin: '0 0 8px', fontSize: 18}}>{es ? 'Disminución de temperatura' : 'Temperature decrease'}</h3>
    <p style={{margin: '0 0 10px'}}>{es ? 'Elinor vive en San Diego, California. Un día de junio, la temperatura era de 70 °F a las 5:00 p. m. Bajó 1 °F cada hora hasta las 10:00 p. m. ¿Cuál era la temperatura a las 10:00 p. m.?' : practice.prompt}</p>
    {reduced ? <p data-p035-reduced-note>{props.labels.reduced}</p> : null}
    <p role="status" aria-live="polite" data-p035-status>{status}</p>
    {paintedFrame >= 9 ? <div role="group" aria-label={es ? 'Vocabulario de la pregunta' : 'Question vocabulary'} style={{margin: '12px 0', display: 'flex', gap: 10, flexWrap: 'wrap'}}>
      {primary.map(term => <button key={term.id} type="button" data-p035-primary-term={term.id} style={buttonStyle}
        disabled={Boolean(entry) || helpVisible || popupVisible} onClick={e => openGlossary(term.id,e.currentTarget)}>{term.labels[language]}</button>)}
    </div> : null}
    {snapshot.picture.mainFrame >= 245 ? <>
      <div role="group" aria-label={es ? 'Opciones de respuesta' : 'Answer choices'} style={{display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10}}>
        {practice.choices.map(c => <button type="button" key={c.sourceInstanceName} data-p035-choice={c.sourceInstanceName}
          style={{...buttonStyle, minHeight: 48, fontSize: 18}} disabled={!canAct} onClick={e => choose(c.sourceInstanceName,e.currentTarget)}>
          {c.letter}. {c.value} °F
        </button>)}
      </div>
      {snapshot.phase === 'ended' ? <p data-p035-result style={{fontSize: 22, fontWeight: 700}}>5 × 1 °F = 5 °F<br/>70 °F − 5 °F = 65 °F</p> : null}
      <button type="button" data-p035-help style={{...buttonStyle, marginTop: 14}} disabled={!interaction?.helpEnabled || Boolean(entry)} onClick={e => openHelp(e.currentTarget)}>{es ? 'Más ayuda' : 'Need More Help'}</button>
    </> : null}
    {popupVisible ? <div data-p035-wrong-feedback style={{marginTop: 14, padding: 12, background: '#ffffdd', color: '#17252e', borderRadius: 8}}>
      <p style={{fontSize: 18, margin: '0 0 8px'}}>{wrongText}</p>
      <button type="button" data-p035-close-wrong style={buttonStyle} disabled={Boolean(entry)} onClick={closeWrong}>{closeWrongLabel}</button>
    </div> : null}
    {helpVisible ? <div data-p035-help-content style={{...boxStyle, marginTop: 14}}>
      <h4 style={{margin: '0 0 8px'}}>{es ? 'Multiplicar y restar' : 'Multiply and subtract'}</h4>
      <p>{es ? 'Multiplica la disminución de temperatura por hora por el número de horas. Resta esa disminución total de la temperatura inicial.' : practice.help.text}</p>
      <p>{es ? 'En Nueva York, la temperatura era de 36 °F a las 11:00 p. m. Bajó 6 °F cada hora hasta las 5:00 a. m. ¿Cuál era la temperatura a las 5:00 a. m.?' : practice.help.example}</p>
      <p>6 × 6 °F = 36 °F<br/>36 °F − 36 °F = 0 °F</p>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>{practice.help.hotspots.map(h => <button key={h.entryId} type="button" data-p035-help-term={h.entryId}
        disabled={Boolean(entry)} style={buttonStyle} onClick={e => openGlossary(h.entryId, e.currentTarget)}>{practice.glossary.find(g => g.id === h.entryId)?.labels[language]}</button>)}</div>
      <button type="button" data-p035-close-help style={{...buttonStyle, marginTop: 12}} disabled={Boolean(entry)} onClick={closeHelp}>{es ? 'Cerrar ayuda' : 'Close Help'}</button>
    </div> : null}
  </section> : null;
  const modal = entry ? <div style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,25,42,.48)', display: 'grid', placeItems: 'center', padding: 16}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-glossary-title`} data-p035-dialog={entry.id}
      style={{...boxStyle, width: 'min(100%,620px)', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 16px 60px #10203044'}}>
      <h3 id={`${ID}-glossary-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
      <button type="button" data-p035-dialog-close style={buttonStyle} onClick={closeGlossary}>
        {helpVisible ? (es ? 'Volver a la ayuda' : 'Back to Help') : popupVisible ? (es ? 'Volver al mensaje' : 'Back to feedback') : glossaryResume.current ? (es ? 'Cerrar y continuar' : 'Close and continue') : (es ? 'Cerrar' : 'Close')}
      </button>
    </div>
  </div> : null;
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'intro'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0}
    data-source-wrong-attempts={snapshot?.wrongAttempts ?? 0} data-source-choice={snapshot?.choice ?? ''}
    data-source-outcome={snapshot?.outcome ?? 'unanswered'} data-source-correct-answer={snapshot?.correctAnswer ? 'true' : 'false'}
    data-source-revealed={snapshot?.revealedAfterSecondWrong ? 'true' : 'false'}
    data-source-feedback-id={interaction?.feedbackCharacterId ?? ''} data-source-feedback-frame={interaction?.feedbackFrame ?? 1}
    data-source-help-visible={helpVisible ? 'true' : 'false'} data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'}
    data-source-host-stop-frame="623" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.outcome !== 'unanswered' && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-246" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={practice?.prompt ?? props.labels.loading}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {practice.hotspots.flatMap(h => {
          const term = practice.glossary.find(e => e.id === h.entryId); if (!term) return [];
          return h.ranges.filter(r => paintedFrame >= r.firstFrame && paintedFrame <= r.lastFrame).map(({rect: r}, occurrence) =>
            <button key={`${h.sourceCharacterId}-${occurrence}`} type="button" data-p035-primary-source-term={h.entryId} data-source-hotspot={h.sourceCharacterId} data-source-hotspot-occurrence={occurrence}
              aria-label={term.labels[language]} title={term.labels[language]} disabled={Boolean(entry) || helpVisible || popupVisible}
              style={hitStyle({x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top})}
              onClick={e => openGlossary(h.entryId, e.currentTarget)}/>
          );
        })}
        {paintedFrame === 245 && !helpVisible && interaction?.feedbackCharacterId === null ? <>
          {practice.choices.map(c => <button type="button" key={c.sourceInstanceName} data-p035-source-choice={c.sourceInstanceName}
            style={hitStyle(c.bounds)} aria-label={`${c.letter}. ${c.value} °F`}
            disabled={!canAct} onClick={e => choose(c.sourceInstanceName,e.currentTarget)}/>)}
          <button type="button" data-p035-source-help style={hitStyle(practice.help.buttonBounds)} aria-label={es ? 'Más ayuda' : 'Need More Help'} disabled={!interaction?.helpEnabled || Boolean(entry)} onClick={e => openHelp(e.currentTarget)}/>
        </> : null}
        {popupVisible && branch?.popupCloseBounds ? <button type="button" data-p035-source-close-wrong style={hitStyle(branch.popupCloseBounds)}
          aria-label={closeWrongLabel} disabled={Boolean(entry)} onClick={closeWrong}/> : null}
        {helpVisible ? <>
          {practice.help.hotspots.map(h => <button type="button" key={h.entryId} data-p035-source-help-term={h.entryId} style={hitStyle(h.bounds)}
            aria-label={practice.glossary.find(g => g.id === h.entryId)?.labels[language]} disabled={Boolean(entry)} onClick={e => openGlossary(h.entryId, e.currentTarget)}/>)}
          <button type="button" data-p035-source-close-help style={hitStyle(practice.help.closeBounds)} aria-label={es ? 'Cerrar ayuda' : 'Close Help'}
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
