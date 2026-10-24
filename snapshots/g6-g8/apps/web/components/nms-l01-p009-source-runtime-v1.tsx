'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P009SourceClockV1, type P009AudioPlan, type P009Branch, type P009Picture} from '../../../packages/demos/src/nms-l01-p009-source-clock-v1';

type Localized = Readonly<{en: string; es: string}>;
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Glossary = Readonly<{id: string; labels: Localized; definitions: Localized}>;
type Token = Readonly<{kind: string; text: string; entryId?: string}>;
type Practice = Readonly<{
  prompt: string;
  choices: readonly Readonly<{id: string; label: string; value: number; bounds: Bounds}>[];
  branches: readonly (P009Branch & {popupTextBounds?: Bounds; popupCloseBounds?: Bounds})[];
  wrongFeedbackTokens: readonly Token[];
  primaryControl: Readonly<{entryId: string; sourceCharacterId: number}>;
  hotspots: readonly Readonly<{entryId: string; sourceCharacterId: number; ranges: readonly Readonly<{
    firstFrame: number; lastFrame: number; rect: Readonly<{left: number; right: number; top: number; bottom: number}>;
  }>[]}>[];
  glossary: readonly Glossary[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P009AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P009SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p009';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});

export function NmsL1P009SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P009SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [glossary, setGlossary] = useState<string | null>(null);
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<string | null>(null); glossaryRef.current = glossary;
  const glossaryTrigger = useRef<HTMLElement | null>(null), answerTrigger = useRef<HTMLElement | null>(null);
  const glossaryResume = useRef(false), previousPopup = useRef(false), previousPhase = useRef('');
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
    let active = true, ready = false, clock: P009SourceClockV1 | undefined, raf = 0, ticket = 0;
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
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-197' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P009_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP009Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP009Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-197' ||
        a.CONFIG.mainFrameCount !== 79 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.choices.length !== 3 || a.PRACTICE.branches.length !== 7 || a.PRACTICE.glossary.length !== 4) throw Error('P009_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P009_SOURCE_CANVAS_MISSING');
      const paint = (picture: P009Picture, force = false) => {
        const target = canvas.current;
        if (!active || !target || window.HELP_MATH_CANVAS_ASSETS?.[ID] !== asset) return false;
        let frame = picture.mainFrame, interaction = picture.interaction;
        if (motion && !force) {
          if (frame < 39) frame = 1; else if (frame > 39 && frame < 79) frame = 39;
          if (interaction.feedbackCharacterId !== null) interaction = {...interaction,
            feedbackFrame: interaction.popupVisible ? 22 : interaction.feedbackFrame >= 23 ? 23 : 2};
        }
        const request = {frame, scenario: 'source-static-frame', lang: 'en', seed: 0, interaction}, key = JSON.stringify(request);
        if (key !== lastPaint) {
          const state = asset.render(target, request) as {localFrame?: number; frameDomain?: string};
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-197' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P009SourceClockV1(a.PLAN, {seed: 0, commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P009_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P009_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 79,
          frameDomain: 'sprite-197', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : (s.picture.mainFrame - 1) / 78,
          seekAvailable: true, stepFrames: 20, transportMode: 'visual-frame-inspector'};
        const key = JSON.stringify(report); if (key !== lastReport) { lastReport = key; latest.current.onPlaybackStateChange?.(report); }
        if (s.phase === 'ended' && !completeReported) {
          completeReported = true; if (s.correctAnswer && !s.inspectionMode && !motion) latest.current.onPlaybackComplete?.();
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
  const popupVisible = snapshot?.picture.interaction.popupVisible ?? false;
  const branch = practice?.branches.find(b => b.sourceCharacterId === snapshot?.picture.interaction.feedbackCharacterId);
  const canAct = Boolean(snapshot?.picture.interaction.choicesEnabled && !entry);
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
  useEffect(() => { if (entry) dialog.current?.querySelector<HTMLButtonElement>('[data-p009-dialog-close]')?.focus(); }, [entry]);
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
      document.querySelector<HTMLButtonElement>('[data-p009-companion] [data-p009-close-wrong]')?.focus({preventScroll: true});
    }
    previousPopup.current = popupVisible;
    if (snapshot?.phase === 'question' && previousPhase.current !== 'question' && snapshot.attempts > 0) {
      const target = answerTrigger.current; if (target?.isConnected) target.focus({preventScroll: true});
    }
    previousPhase.current = snapshot?.phase ?? '';
  }, [popupVisible, snapshot?.phase, snapshot?.attempts]);
  const choose = (id: string, trigger: HTMLElement) => {
    if (!canAct || !clockRef.current) return; answerTrigger.current = trigger;
    props.onRuntimePausedChange(false);
    void clockRef.current.choose(id, {activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
  };
  const closeWrong = () => {
    if (!clockRef.current || glossaryRef.current) return;
    props.onRuntimePausedChange(false);
    void clockRef.current.closeWrong({activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
  };
  const feedbackText = (source: boolean) => practice?.wrongFeedbackTokens.map((t, i) => t.kind === 'link'
    ? <button key={i} type="button" lang="en" data-p009-feedback-term={t.entryId} disabled={Boolean(entry)}
      style={source ? {border: 0, padding: 0, margin: 0, minHeight: 0, minWidth: 0, background: 'transparent', color: '#0000cc',
        fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer'}
        : {...buttonStyle, display: 'inline', margin: '2px 3px'}}
      onClick={e => openGlossary(t.entryId!, e.currentTarget)}>{t.text}</button> : <span key={i}>{t.text}</span>);
  const status = snapshot?.correctAnswer ? (es ? '¡Correcto! −10 es el entero opuesto de 10.' : 'Correct! −10 is the opposite integer of 10.')
    : snapshot?.phase === 'wrong-wait' ? (es ? 'Revisa la explicación y cierra el mensaje para volver a intentarlo.' : 'Review the explanation, then close the message to try again.')
    : canAct ? (es ? 'Elige el entero opuesto de 10.' : 'Choose the opposite integer of 10.')
    : (es ? 'Escucha la explicación.' : 'Listen to the explanation.');
  const primary = practice?.glossary.find(e => e.id === practice.primaryControl.entryId);
  const companionContent = practice && snapshot ? <section data-p009-companion style={{...boxStyle, margin: '12px auto', width: 'min(100%,680px)'}}>
    <h3 style={{margin: '0 0 8px', fontSize: 18}}>{es ? 'Práctica de enteros opuestos' : 'Opposite integer practice'}</h3>
    <p lang="en" style={{margin: '0 0 10px'}}>{practice.prompt}</p>
    <p role="status" aria-live="polite" data-p009-status>{status}</p>
    {snapshot.picture.mainFrame >= 39 ? <div role="group" aria-label={es ? 'Opciones de enteros' : 'Integer choices'} style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
      {[...practice.choices].sort((a, b) => a.bounds.x - b.bounds.x).map(c => <button type="button" key={c.id} data-p009-choice={c.id}
        style={{...buttonStyle, minWidth: 72, fontSize: 22}} disabled={!canAct}
        aria-label={`${es ? 'Elegir' : 'Choose'} ${c.label}`} onClick={e => choose(c.id, e.currentTarget)}>{c.label}</button>)}
    </div> : null}
    {popupVisible ? <div data-p009-feedback-text style={{marginTop: 14, padding: 12, background: '#ffffdd', color: '#17252e', borderRadius: 8}}>
      <p lang="en" style={{margin: 0}}>{feedbackText(false)}</p>
      <button type="button" data-p009-close-wrong style={{...buttonStyle, marginTop: 12}} disabled={Boolean(entry)} onClick={closeWrong}>{es ? 'Cerrar y volver a intentar' : 'Close and try again'}</button>
    </div> : null}
    {primary && snapshot.picture.mainFrame >= 9 ? <div style={{marginTop: 14}}><button type="button" data-p009-primary-term style={buttonStyle}
      disabled={Boolean(entry)} onClick={e => openGlossary(primary.id, e.currentTarget)}>{primary.labels[language]}</button></div> : null}
  </section> : null;
  const modal = entry ? <div style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,25,42,.48)', display: 'grid', placeItems: 'center', padding: 16}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-glossary-title`} data-p009-dialog={entry.id}
      style={{...boxStyle, width: 'min(100%,620px)', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 16px 60px #10203044'}}>
      <h3 id={`${ID}-glossary-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
      <button type="button" data-p009-dialog-close style={buttonStyle} onClick={closeGlossary}>
        {popupVisible ? (es ? 'Volver a la explicación' : 'Back to the explanation') : glossaryResume.current ? (es ? 'Cerrar y continuar' : 'Close and continue') : (es ? 'Cerrar' : 'Close')}
      </button>
    </div>
  </div> : null;
  const popupAlpha = reduced ? 1 : Math.max(0, Math.min(1, ((snapshot?.picture.interaction.feedbackFrame ?? 1) - 16) / 6));
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'intro'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0} data-source-correct-answer={snapshot?.correctAnswer ? 'true' : 'false'}
    data-source-feedback-domain={snapshot?.selectedBranch?.frameDomain ?? ''} data-source-feedback-frame={snapshot?.picture.interaction.feedbackFrame ?? 1}
    data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'} data-source-host-stop-frame="79" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.correctAnswer && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-197" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={practice?.prompt ?? props.labels.loading}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {practice.hotspots.flatMap(h => {
          const r = h.ranges.find(r => paintedFrame >= r.firstFrame && paintedFrame <= r.lastFrame)?.rect;
          return r && primary ? <button key={h.sourceCharacterId} type="button" data-source-hotspot={h.sourceCharacterId}
            aria-label={primary.labels[language]} title={primary.labels[language]} disabled={Boolean(entry)}
            style={hitStyle({x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top})}
            onClick={e => openGlossary(h.entryId, e.currentTarget)}/> : [];
        })}
        {paintedFrame === 39 ? practice.choices.map(c => <button key={c.id} type="button" data-p009-source-choice={c.id}
          style={hitStyle(c.bounds)} aria-label={`${es ? 'Elegir' : 'Choose'} ${c.label}`} disabled={!canAct}
          onClick={e => choose(c.id, e.currentTarget)}/>) : null}
        {popupVisible && branch?.popupTextBounds && branch.popupCloseBounds ? <>
          <svg viewBox="0 0 800 600" role="group" aria-label={es ? 'Explicación en la animación' : 'Explanation in the animation'} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: popupAlpha}}>
            <foreignObject x={branch.popupTextBounds.x} y={branch.popupTextBounds.y} width={branch.popupTextBounds.width} height={branch.popupTextBounds.height}>
              <div lang="en" data-p009-source-feedback-text style={{fontFamily: 'Arial, sans-serif', fontSize: 15.2, lineHeight: '17.23px', color: '#000', pointerEvents: 'auto'}}>{feedbackText(true)}</div>
            </foreignObject>
          </svg>
          <button type="button" data-p009-source-close style={hitStyle(branch.popupCloseBounds)} aria-label={es ? 'Cerrar y volver a intentar' : 'Close and try again'} disabled={Boolean(entry)} onClick={closeWrong}/>
        </> : null}
      </> : null}
    </div>
    {companion ? createPortal(companionContent, companion) : companionContent}
    {modal ? createPortal(modal, document.body) : null}
    {!snapshot && !error ? <p role="status">{props.labels.loading}</p> : null}
    {error ? <p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p> : null}
    {reduced ? <p>{props.labels.reduced}</p> : null}
  </div>;
}
