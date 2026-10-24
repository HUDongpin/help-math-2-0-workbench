'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P037SourceClockV1, type P037AudioPlan, type P037Picture} from '../../../packages/demos/src/nms-l01-p037-source-clock-v1';

type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Row = Readonly<{play: number; start: number; delta: number; answer: number; correctClickIndex: number; question: string; wrongFeedback: string; expression: string}>;
type Practice = Readonly<{
  rows: readonly Row[];
  clickSites: readonly Readonly<{clickIndex: number; lineNumber: number; bounds: Bounds; sourceDrawOrderDepth: number}>[];
  introMotionKeyframes: readonly number[];
  buttons: Readonly<{start: Readonly<{bounds: Bounds}>; skip: Readonly<{bounds: Bounds}>; next: Readonly<{bounds: Bounds}>}>;
  wrong: Readonly<{closeBounds: Bounds}>;
  deviceFields: readonly Readonly<Record<string,unknown>>[];
  clipMasks: readonly Readonly<Record<string,unknown>>[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P037AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P037SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p037';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});
const spanishPlays = [
 'El corredor avanza 8 yardas.', 'Capturan al mariscal de campo: pierde 10 yardas.',
 'El mariscal de campo completa un pase y avanza 30 yardas.', 'El corredor pierde 3 yardas.',
 'El corredor avanza 15 yardas.', 'El mariscal de campo completa un pase y avanza 7 yardas.',
 'El corredor pierde 2 yardas.', 'El corredor avanza 9 yardas.',
 'Capturan al mariscal de campo: pierde 11 yardas.', 'El mariscal de campo completa un pase y avanza 21 yardas.',
 'El corredor avanza 7 yardas.', 'El corredor avanza 7 yardas.', 'El corredor pierde 4 yardas.',
 'El mariscal de campo completa un pase y avanza 6 yardas.',
];
const displayInteger = (value: number) => String(value).replace('-', '−');

export function NmsL1P037SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P037SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [selection, setSelection] = useState('0');
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0);
  const input = useRef<HTMLSelectElement>(null), closeButton = useRef<HTMLButtonElement>(null), nextButton = useRef<HTMLButtonElement>(null);
  const previousPopup = useRef(false), previousPhase = useRef(''), previousRound = useRef(-1);
  const es = props.uiLanguage === 'es';
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
    let active = true, ready = false, clock: P037SourceClockV1 | undefined, raf = 0, ticket = 0;
    let lastPaint = '', lastView = '', lastReport = '', completeReported = false, wantPlay = !latest.current.paused, painted = 1, runtimeFailed = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)'); let motion = media.matches; setReduced(motion);
    const motionChanged = () => { motion = media.matches; setReduced(motion); };
    media.addEventListener('change', motionChanged);
    const pause = () => { wantPlay = false; ticket++; clock?.pause(); latest.current.onRuntimePausedChange(true); };
    const start = (activation: 'automatic' | 'user') => {
      wantPlay = true;
      if (!active || !ready || !clock) return;
      if (motion && activation === 'automatic') { pause(); return; }
      if (clock.snapshot().phase === 'ended') { clock.replay(); completeReported = false; latest.current.onReplay?.(); }
      const turn = ++ticket; latest.current.onRuntimePausedChange(false);
      void clock.play({activation, reducedMotion: motion}).then(r => { if (active && turn === ticket && !r.accepted) pause(); });
    };
    const stop = () => { active = false; ticket++; cancelAnimationFrame(raf); void clock?.close(); };
    const controls: LessonRuntimeAdapterControls = {
      setPaused: value => value ? pause() : start('user'),
      replay() {
        if (!active || !ready || !clock) return false;
        ticket++; clock.replay(); 
        completeReported = false; start('user'); return true;
      },
      narration: action => action === 'stop' ? pause() : start('user'), stop,
    };
    controlsRef.current = controls; const disconnect = props.connectRuntimeControls(controls);
    const init = async () => {
      if (process.env.NODE_ENV === 'production' || props.animationId !== ID || props.moduleKey !== ID || props.audioEnabled !== true ||
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-636' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P037_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP037Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP037Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-636' ||
        a.CONFIG.mainFrameCount !== 601 || a.CONFIG.livePlaybackEndFrame !== 601 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.rows.length !== 14 || a.PRACTICE.clickSites.length !== 101 || a.PRACTICE.clipMasks.length !== 3 || a.PRACTICE.deviceFields.length !== 4) throw Error('P037_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P037_SOURCE_CANVAS_MISSING');
      const paint = (picture: P037Picture, force = false) => {
        const target = canvas.current;
        if (!active || !target || window.HELP_MATH_CANVAS_ASSETS?.[ID] !== asset) return false;
        let frame = picture.mainFrame, interaction = picture.interaction;
        if (motion && !force && !latest.current.paused) {
          if (frame < 596) frame = [...a.PRACTICE.introMotionKeyframes].reverse().find(n => n <= frame) ?? 1;
          interaction = {...interaction, wrongFrame: interaction.wrongFrame > 1 ? 2 : 1, arrowFrame: 1,
            counterFrame: interaction.counterFrame > 1 ? 2 : 1, endChildFrame: interaction.endChildFrame < 111 ? 1 : 111};
        }
        const request = {frame, scenario: 'source-static-frame', lang: 'en', seed: 0, interaction}, key = JSON.stringify(request);
        if (key !== lastPaint) {
          const state = asset.render(target, request) as {localFrame?: number; frameDomain?: string};
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-636' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P037SourceClockV1(a.PLAN, { commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P037_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P037_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 601,
          frameDomain: 'sprite-636', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : s.phase === 'ended' ? 1 : s.picture.mainFrame >= 597 ?
            (596 + 3 * (s.picture.interaction.endChildFrame - 1) / 110) / 600 : (s.picture.mainFrame - 1) / 600,
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
    if (props.paused && !c.snapshot().globalPaused) c.pause();
    else if (!props.paused && snapshot && c.snapshot().globalPaused) controlsRef.current?.setPaused(false);
  }, [props.paused, Boolean(snapshot)]);
  useEffect(() => { clockRef.current?.setVolume(props.volume ?? 1); }, [props.volume]);
  useEffect(() => {
    const q = props.seekRequest, c = clockRef.current;
    if (!q || !c || !snapshot || q.requestId === lastSeek.current) return;
    lastSeek.current = q.requestId; 
    c.inspect(q.frame); props.onRuntimePausedChange(true); sync.current();
  }, [props.seekRequest, Boolean(snapshot), props.onRuntimePausedChange]);

  const interaction = snapshot?.picture.interaction;
  const row = practice?.rows[interaction?.roundIndex ?? 0];
  const popupVisible = interaction?.wrongVisible ?? false;
  const canAct = interaction?.inputEnabled ?? false;
  const selectedValue = Number(selection);
  useEffect(() => {
    if (popupVisible && !previousPopup.current) closeButton.current?.focus({preventScroll: true});
    if (snapshot?.phase === 'next-wait' && previousPhase.current !== 'next-wait') nextButton.current?.focus({preventScroll: true});
    if (snapshot?.phase === 'question' && (previousPhase.current !== 'question' || previousRound.current !== interaction?.roundIndex)) {
      if (previousRound.current !== interaction?.roundIndex && row) setSelection(String(row.start));
      input.current?.focus({preventScroll: true});
      if (previousRound.current !== interaction?.roundIndex && row) { clockRef.current?.hover(row.start + 21); sync.current(); }
    }
    previousPopup.current = popupVisible; previousPhase.current = snapshot?.phase ?? ''; previousRound.current = interaction?.roundIndex ?? -1;
  }, [popupVisible, snapshot?.phase, interaction?.roundIndex, row]);
  const hover = (index: number | null) => { clockRef.current?.hover(index); sync.current(); };
  const answer = (index: number) => {
    if (!canAct || !clockRef.current) return;
    props.onRuntimePausedChange(false);
    void clockRef.current.answer(index, {activation: 'user', reducedMotion: reduced}).then(() => sync.current()); sync.current();
  };
  const startGame = () => {
    const c=clockRef.current; if (!c?.startGame().accepted) return;
    setSelection('0'); props.onRuntimePausedChange(false); sync.current();
  };
  const skip = () => { if (clockRef.current?.skipIntro().accepted) { props.onRuntimePausedChange(false); sync.current(); } };
  const nextPlay = () => { if (clockRef.current?.nextPlay().accepted) { props.onRuntimePausedChange(false); sync.current(); } };
  const closeWrong = () => {
    const c=clockRef.current; if (!c?.closeWrong().accepted) return;
    // Closing a paused feedback card preserves the global pause until the learner presses Play.
    props.onRuntimePausedChange(c.snapshot().globalPaused); sync.current();
  };
  const selectValue = (value: number) => {
    if (!canAct || !Number.isSafeInteger(value) || value < -20 || value > 80) return;
    setSelection(String(value)); hover(value + 21);
  };
  const status = snapshot?.phase === 'ended' ? (es ? '¡Has terminado las 14 jugadas!' : 'You have finished all 14 plays!')
    : popupVisible ? (es ? 'Inténtalo de nuevo. Cierra el mensaje para continuar.' : 'Try again. Close the message to continue.')
    : snapshot?.operation === 'final' ? (es ? '¡Correcto! Disfruta la celebración.' : 'Correct! Enjoy the celebration.')
    : snapshot?.phase === 'next-wait' ? (es ? '¡Correcto! Continúa con la siguiente jugada.' : 'Correct! Continue to the next play.')
    : snapshot?.operation === 'correct' ? (es ? '¡Correcto!' : 'Correct!')
    : canAct ? (es ? 'Elige la nueva posición del equipo en la recta numérica.' : 'Choose the team’s new position on the number line.')
    : snapshot?.phase === 'instructions' ? (es ? 'Pulsa Comenzar para jugar.' : 'Press Start to play.')
    : snapshot?.globalPaused ? (es ? 'Pulsa Reproducir para continuar.' : 'Press Play to continue.')
    : (es ? 'Escucha cómo se juega.' : 'Listen to how the game works.');
  const companionContent = practice && snapshot ? <section data-p037-companion style={{...boxStyle, margin: '12px auto', width: 'min(100%,700px)'}}>
    <h3 style={{margin: '0 0 8px', fontSize: 20}}>{es ? 'Fútbol con enteros positivos y negativos' : 'Positive and negative integers football'}</h3>
    <p style={{margin: '0 0 10px'}}>{es ? 'Lee cada jugada. Muévete a la derecha cuando el equipo avance yardas y a la izquierda cuando pierda yardas.' : 'Read each play. Move right when the team gains yards and left when the team loses yards.'}</p>
    {reduced ? <p data-p037-reduced-note>{props.labels.reduced}</p> : null}
    <p role="status" aria-live="polite" data-p037-status>{status}</p>
    {interaction?.skipEnabled ? <button type="button" data-p037-skip style={buttonStyle} onClick={skip}>{es ? 'Ir a las instrucciones' : 'Skip to instructions'}</button> : null}
    {snapshot.picture.mainFrame === 595 ? <button type="button" data-p037-start style={buttonStyle} disabled={!interaction?.startEnabled} onClick={startGame}>{es ? 'Comenzar' : 'Start'}</button> : null}
    {snapshot.picture.mainFrame >= 596 && row ? <>
      <p data-p037-progress>{es ? 'Jugadas completadas' : 'Plays completed'}: {snapshot.solvedCount} / 14</p>
      <ol aria-label={es ? 'Progreso de las jugadas' : 'Play progress'} style={{listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6}}>
        {practice.rows.map((r,i)=><li key={r.play} style={{display: 'grid', placeItems: 'center', minWidth: 28, minHeight: 28, borderRadius: 14,
          background: i < snapshot.solvedCount ? '#155e3e' : i === interaction?.roundIndex ? '#e5f3ff' : '#eef0f3', color: i < snapshot.solvedCount ? 'white' : '#18344a',
          border: i === interaction?.roundIndex ? '2px solid #0765a0' : '1px solid transparent'}} aria-current={i === interaction?.roundIndex ? 'step' : undefined}>
          <span aria-hidden="true">{i < snapshot.solvedCount ? '✓' : r.play}</span><span className="sr-only">{es ? 'Jugada' : 'Play'} {r.play}: {i < snapshot.solvedCount ? (es ? 'completada' : 'complete') : (es ? 'pendiente' : 'remaining')}</span>
        </li>)}
      </ol>
      {snapshot.picture.mainFrame === 596 ? <>
        <h4 style={{fontSize: 18, marginBottom: 6}}>{es ? 'Jugada' : 'Play'} {row.play} / 14</h4>
        <p data-p037-question style={{fontSize: 18}}>{es ? spanishPlays[row.play - 1] : row.question}</p>
        <p data-p037-expression style={{fontSize: 23, fontWeight: 650}}>{row.expression.replaceAll('-', '−').replaceAll('–','−')}{interaction?.correctPicture === row.play ? displayInteger(row.answer) : '?'}</p>
        <div role="group" aria-label={es ? 'Nueva posición' : 'New position'} style={{display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 8}}>
          <button type="button" data-p037-decrease style={{...buttonStyle, minWidth: 44}} aria-label={es ? 'Una yarda a la izquierda' : 'One yard left'} disabled={!canAct || selectedValue <= -20} onClick={()=>selectValue(selectedValue - 1)}>−</button>
          <label style={{display: 'grid', gap: 4, flex: '1 1 110px', maxWidth: 210}}>
            <span>{es ? 'Posición' : 'Position'}</span>
            <select ref={input} data-p037-position value={selection} disabled={!canAct} style={{...buttonStyle, width: '100%', fontSize: 20}}
              onChange={e=>selectValue(Number(e.currentTarget.value))} onFocus={()=>canAct && hover(selectedValue + 21)} onBlur={()=>canAct && hover(null)}>
              {practice.clickSites.map(p=><option key={p.clickIndex} value={p.lineNumber}>{displayInteger(p.lineNumber)}</option>)}
            </select>
          </label>
          <button type="button" data-p037-increase style={{...buttonStyle, minWidth: 44}} aria-label={es ? 'Una yarda a la derecha' : 'One yard right'} disabled={!canAct || selectedValue >= 80} onClick={()=>selectValue(selectedValue + 1)}>+</button>
          <button type="button" data-p037-answer style={{...buttonStyle, flex: '1 1 150px'}} disabled={!canAct} onClick={()=>answer(selectedValue + 21)}>{es ? 'Comprobar posición' : 'Check position'}</button>
        </div>
        <p style={{fontSize: 14, marginBottom: 0}}>{es ? 'También puedes pulsar una marca roja en la recta numérica.' : 'You can also click a red mark on the number line.'}</p>
        <button ref={nextButton} type="button" data-p037-next style={{...buttonStyle, marginTop: 14}} disabled={!interaction?.nextEnabled} onClick={nextPlay}>{es ? 'Siguiente jugada' : 'Next play'}</button>
      </> : null}
    </> : null}
    {popupVisible && row ? <div data-p037-wrong-feedback style={{marginTop: 14, padding: 12, background: '#ffffdd', color: '#17252e', borderRadius: 8}}>
      <p style={{fontSize: 18, margin: '0 0 8px'}}>{es ? `Muévete ${Math.abs(row.delta)} yardas a la ${row.delta > 0 ? 'derecha' : 'izquierda'}. Inténtalo de nuevo.` : row.wrongFeedback}</p>
      <button ref={closeButton} type="button" data-p037-close-wrong style={buttonStyle} onClick={closeWrong}>{es ? 'Cerrar y volver a intentar' : 'Close and try again'}</button>
    </div> : null}
  </section> : null;
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'intro'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0} data-source-solved-count={snapshot?.solvedCount ?? 0}
    data-source-round-index={interaction?.roundIndex ?? 0} data-source-correct-picture={interaction?.correctPicture ?? 0}
    data-source-correct-answer={snapshot?.allCorrect ? 'true' : 'false'} data-source-hover-index={interaction?.hoverIndex ?? ''}
    data-source-wrong-frame={interaction?.wrongFrame ?? 1} data-source-counter-frame={interaction?.counterFrame ?? 1} data-source-arrow-frame={interaction?.arrowFrame ?? 1}
    data-source-end-child-frame={interaction?.endChildFrame ?? 1} data-source-wrong-visible={popupVisible ? 'true' : 'false'}
    data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'} data-source-host-stop-frame="601" data-source-end-child-stop-frame="111" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.allCorrect && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-636" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es ? 'Campo de fútbol y recta numérica de menos 20 a 80' : 'Football field and number line from minus 20 to 80'}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {paintedFrame >= 82 && paintedFrame < 595 ? <button type="button" tabIndex={-1} data-p037-source-skip style={hitStyle(practice.buttons.skip.bounds)} aria-label={es ? 'Ir a las instrucciones' : 'Skip to instructions'} disabled={!interaction?.skipEnabled} onClick={skip}/> : null}
        {paintedFrame === 595 ? <button type="button" tabIndex={-1} data-p037-source-start style={hitStyle(practice.buttons.start.bounds)} aria-label={es ? 'Comenzar' : 'Start'} disabled={!interaction?.startEnabled} onClick={startGame}/> : null}
        {paintedFrame === 596 ? <>
          {practice.clickSites.map(p=><button key={p.clickIndex} type="button" tabIndex={-1} data-p037-source-site={p.clickIndex}
            style={hitStyle(p.bounds)} aria-label={`${es ? 'Posición' : 'Position'} ${displayInteger(p.lineNumber)}`} disabled={!canAct}
            onPointerEnter={()=>canAct && hover(p.clickIndex)} onPointerLeave={()=>canAct && hover(null)} onPointerCancel={()=>canAct && hover(null)}
            onClick={()=>answer(p.clickIndex)}/>)}
          <button type="button" tabIndex={-1} data-p037-source-next style={hitStyle(practice.buttons.next.bounds)} aria-label={es ? 'Siguiente jugada' : 'Next play'} disabled={!interaction?.nextEnabled} onClick={nextPlay}/>
        </> : null}
        {popupVisible ? <button type="button" tabIndex={-1} data-p037-source-close-wrong style={hitStyle(practice.wrong.closeBounds)} aria-label={es ? 'Cerrar y volver a intentar' : 'Close and try again'} onClick={closeWrong}/> : null}
      </> : null}
    </div>
    {error ? <p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p> : !snapshot ? <p role="status">{props.labels.loading}</p> : null}
    {companion ? createPortal(companionContent, companion) : companionContent}
  </div>;
}
