'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P045SourceClockV1, type P045AudioPlan, type P045Picture} from '../../../packages/demos/src/nms-l01-p045-source-clock-v1';

type Localized = Readonly<{en: string; es: string}>;
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
type Glossary = Readonly<{id: string; labels: Localized; definitions: Localized}>;
type Hotspot = Readonly<{entryId: string; sourceCharacterId: number; bounds: Bounds}>;
type Choice = Readonly<{sourceInstanceName: string; sourceCharacterId: number; letter: string; value: number; correct: boolean; bounds: Bounds}>;
type Practice = Readonly<{
 prompt: string; introMotionKeyframes: readonly number[]; choices: readonly Choice[];
 holds: readonly Readonly<{index: number; mainFrame: number; nextMainFrame: number; secondaryBounds: Bounds; secondaryAction: string}>[];
 strategies: readonly Readonly<{sourceCharacterId: number; mainFrame: number; waitFrame: number; closeBounds: Bounds}>[];
 branches: readonly Readonly<{sourceCharacterId: number; frameCount: number}>[];
 help: Readonly<{buttonBounds: Bounds; closeBounds: Bounds; text: string; example: string; equation: string; hotspots: readonly Hotspot[]}>;
 primaryControls: readonly unknown[]; glossary: readonly Glossary[];
}>;
type Attachment = Readonly<{version: 1; CONFIG: SourceStaticCanvasCandidateConfig; PLAN: P045AudioPlan;
  PRACTICE: Practice; sourceAudioPayloads: Readonly<Record<string, string>>; prepare: () => Promise<unknown>}>;
type Snapshot = ReturnType<P045SourceClockV1['snapshot']>;
const ID = 'shared-nms002-l01-p045';
const buttonStyle: CSSProperties = {minHeight: 44, padding: '8px 12px', border: '1px solid var(--line, #8797a9)',
  borderRadius: 9, background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontWeight: 600};
const boxStyle: CSSProperties = {padding: 16, border: '1px solid var(--line, #8797a9)', borderRadius: 12,
  background: 'var(--paper, white)', color: 'var(--ink, #132a40)', fontSize: 16, lineHeight: 1.5};
const hitStyle = (b: Bounds): CSSProperties => ({position: 'absolute', left: `${b.x / 8}%`, top: `${b.y / 6}%`,
  width: `${b.width / 8}%`, height: `${b.height / 6}%`, minWidth: 0, minHeight: 0, padding: 0, border: 0,
  borderRadius: 0, background: 'transparent', color: 'transparent', cursor: 'pointer'});

export function NmsL1P045SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const clockRef = useRef<P045SourceClockV1 | null>(null), controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null), [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null), [reduced, setReduced] = useState(false), [paintedFrame, setPaintedFrame] = useState(1);
  const [companion, setCompanion] = useState<HTMLElement | null>(null), [glossary, setGlossary] = useState<string | null>(null);
  const sync = useRef<() => void>(() => {}), lastSeek = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const glossaryRef = useRef<string | null>(null); glossaryRef.current = glossary;
  const glossaryTrigger = useRef<HTMLElement | null>(null), answerTrigger = useRef<HTMLElement | null>(null);
  const glossaryResume = useRef(false), previousStrategy = useRef(false), previousPhase = useRef(''), previousHelp = useRef(false);
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
    let active = true, ready = false, clock: P045SourceClockV1 | undefined, raf = 0, ticket = 0;
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
        props.query.capture === '1' || props.query.lang !== 'en' || props.query.frameDomain !== 'sprite-290' ||
        props.query.scenario !== 'source-static-frame' || String(props.query.seed) !== '0') throw Error('P045_PRIVATE_SCOPE_MISMATCH');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP045Practice?: Attachment}) | undefined;
      if (!active) return; const a = module?.privateP045Practice;
      if (module?.key !== ID || !a || a.version !== 1 || a.CONFIG.animationId !== ID || a.CONFIG.mainFrameDomain !== 'sprite-290' ||
        a.CONFIG.mainFrameCount !== 835 || a.PLAN.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256 ||
        a.PRACTICE.choices.length !== 4 || a.PRACTICE.branches.length !== 7 || a.PRACTICE.primaryControls.length !== 0 || a.PRACTICE.glossary.length !== 2 || a.PRACTICE.help.hotspots.length !== 2 || a.PRACTICE.holds.length !== 4 || a.PRACTICE.strategies.length !== 2) throw Error('P045_REGISTERED_SOURCE_MISSING');
      setPractice(a.PRACTICE); await a.prepare(); if (!active) return;
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] & {metadata?: {sourceSwfSha256?: string}}) | undefined;
      if (!asset || asset.metadata?.sourceSwfSha256 !== a.CONFIG.sourceSwfSha256) throw Error('P045_SOURCE_CANVAS_MISSING');
      const paint = (picture: P045Picture, force = false) => {
        const target = canvas.current;
        if (!active || !target || window.HELP_MATH_CANVAS_ASSETS?.[ID] !== asset) return false;
        let frame = picture.mainFrame, interaction = picture.interaction;
        if (motion && !force && !latest.current.paused) {
          frame = [...a.PRACTICE.introMotionKeyframes].reverse().find(n => n <= frame) ?? 1;
          const strategy = a.PRACTICE.strategies.find(s => s.sourceCharacterId === interaction.strategyCharacterId);
          interaction = {...interaction, feedbackFrame: interaction.feedbackCharacterId === null ? 1 : 2,
            strategyFrame: interaction.strategyCharacterId === null ? 1 : interaction.strategyFrame === strategy?.waitFrame ? strategy.waitFrame : 1};
        }
        const request = {frame, scenario: 'source-static-frame', lang: 'en', seed: 0, interaction}, key = JSON.stringify(request);
        if (key !== lastPaint) {
          const state = asset.render(target, request) as {localFrame?: number; frameDomain?: string};
          if (state.localFrame !== frame || state.frameDomain !== 'sprite-290' || target.dataset.flashFrame !== String(frame)) return false;
          lastPaint = key; painted = frame; target.dataset.renderState = 'ready'; target.style.display = 'block';
          setPaintedFrame(frame); stage.current?.setAttribute('data-flash-frame', String(frame));
        }
        return target.isConnected && target.width === 800 && target.height === 600;
      };
      clock = new P045SourceClockV1(a.PLAN, { commitPicture: p => paint(p, true)}); clockRef.current = clock;
      const payloads = new Map(Object.entries(a.sourceAudioPayloads).map(([id, b]) => [id, Uint8Array.from(atob(b), c => c.charCodeAt(0)).buffer]));
      const result = await clock.prepare(payloads); if (!active) return;
      if (!result.accepted) throw Error(result.reason); clock.setVolume(latest.current.volume ?? 1); ready = true;
      const draw = () => {
        if (!active || !clock || runtimeFailed) return; const s = clock.snapshot();
        if (s.phase === 'failed') { runtimeFailed = true; setSnapshot(s); setError(s.failure ?? 'P045_SOURCE_FAILED'); latest.current.onRuntimePausedChange(true); void clock.close(); return; }
        if (!paint(s.picture)) { runtimeFailed = true; pause(); setError('P045_SOURCE_PAINT_FAILED'); void clock.close(); return; }
        const viewKey = JSON.stringify({...s, contextTime: null, audioSample: 0, operationSeconds: 0});
        if (viewKey !== lastView) { lastView = viewKey; setSnapshot(s); }
        const report: AnimationRuntimePlaybackState = {audioAvailable: true, frame: painted, frameCount: 832,
          frameDomain: 'sprite-290', fps: 12, narration: s.audioNodePlaying ? 'playing' : 'idle',
          playbackProgress: motion || s.inspectionMode ? null : (s.picture.mainFrame - 1) / 831,
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
  const helpVisible = interaction?.helpVisible ?? false, strategyVisible = interaction?.strategyCharacterId !== null && interaction?.strategyCharacterId !== undefined;
  const canAct = Boolean(interaction?.choicesEnabled && !entry), canContinue = Boolean(interaction?.continueEnabled && !entry);
  const hold = practice?.holds.find(h=>h.mainFrame===snapshot?.picture.mainFrame);
  const strategy = practice?.strategies.find(s=>s.sourceCharacterId===interaction?.strategyCharacterId);
  const canCloseStrategy = snapshot?.phase === 'strategy-wait' && !entry;
  const openGlossary = (id: string, trigger: HTMLElement) => {
    if (!helpVisible || snapshot?.inspectionMode || !practice?.glossary.some(e => e.id === id) || glossaryRef.current) return;
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
  useEffect(() => { if (entry) dialog.current?.querySelector<HTMLButtonElement>('[data-p045-dialog-close]')?.focus(); }, [entry]);
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
    if (canCloseStrategy && !previousStrategy.current && !glossaryRef.current) document.querySelector<HTMLButtonElement>('[data-p045-companion] [data-p045-close-strategy]')?.focus({preventScroll:true});
    if (helpVisible && !previousHelp.current && !glossaryRef.current) document.querySelector<HTMLButtonElement>('[data-p045-companion] [data-p045-close-help]')?.focus({preventScroll:true});
    if (snapshot?.phase==='teaching-hold' && previousPhase.current!=='teaching-hold') document.querySelector<HTMLButtonElement>('[data-p045-companion] [data-p045-continue]')?.focus({preventScroll:true});
    if (snapshot?.phase==='question' && previousPhase.current!=='question') {
      const target=answerTrigger.current;
      if(target?.isConnected&&!target.hasAttribute('disabled'))target.focus({preventScroll:true});
      else document.querySelector<HTMLButtonElement>('[data-p045-companion] [data-p045-choice]:not(:disabled)')?.focus({preventScroll:true});
    }
    previousStrategy.current=canCloseStrategy;previousHelp.current=helpVisible;previousPhase.current=snapshot?.phase??'';
  },[canCloseStrategy,helpVisible,snapshot?.phase]);
  const choose = (id:string,trigger:HTMLElement) => {
    if(!canAct||!clockRef.current)return;answerTrigger.current=trigger;props.onRuntimePausedChange(false);
    void clockRef.current.choose(id,{activation:'user',reducedMotion:reduced}).then(()=>sync.current());sync.current();
  };
  const teaching = (action:'continueTeaching'|'openStrategy'|'closeStrategy') => {
    if(!clockRef.current||glossaryRef.current)return;props.onRuntimePausedChange(false);
    void clockRef.current[action]({activation:'user',reducedMotion:reduced}).then(()=>sync.current());sync.current();
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
  const status = snapshot?.inspectionMode ? (es ? 'Vista de un fotograma. Usa Repetir para comenzar la actividad.' : 'Frame inspection. Use Replay to start the activity.')
    : snapshot?.phase==='ended' ? (snapshot.correctAnswer ? (es?'Correcto: Sarah ganó $90 después de los gastos.':'Correct: Sarah earned $90 after expenses.') : (es?'La respuesta es $90. Usa Repetir para volver a intentarlo.':'The answer is $90. Use Replay to try again.'))
    : helpVisible ? (es?'Revisa el ejemplo y cierra la ayuda para continuar.':'Review the example, then close Help to continue.')
    : strategyVisible ? (canCloseStrategy ? (es?'Revisa la estrategia. Cierra para continuar.':'Review the strategy. Close it to continue.') : (es?'Observa cómo se desarrolla la estrategia.':'Watch the strategy develop.'))
    : canAct ? (snapshot?.wrongAttempts ? (es?'Inténtalo de nuevo. Selecciona las ganancias después de los gastos.':'Try again. Choose the earnings after expenses.') : (es?'Selecciona las ganancias después de los gastos.':'Choose the earnings after expenses.'))
    : canContinue ? (es?'Revisa el paso y continúa cuando estés listo.':'Review the step, then continue when you are ready.')
    : (es?'Escucha la explicación.':'Listen to the explanation.');
  const companionContent=practice&&snapshot?<section data-p045-companion style={{...boxStyle,margin:'12px auto',width:'min(100%,700px)'}}>
    <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Ganancias después de los gastos':'Earnings after expenses'}</h3>
    <p style={{margin:'0 0 10px'}}>{es?'Sarah gana $25 por semana limpiando una casa. El mes pasado la limpió 4 veces y gastó $10 en la limpieza. ¿Cuánto dinero ganó después de los gastos?':practice.prompt}</p>
    {reduced?<p data-p045-reduced-note>{props.labels.reduced}</p>:null}
    <p role="status" aria-live="polite" data-p045-status>{status}</p>
    <div data-p045-teaching-steps style={{display:'grid',gap:10}}>
      {snapshot.picture.mainFrame>=389?<div><strong>1. {es?'Comprender la pregunta':'Understand the question'}</strong><p style={{margin:'4px 0'}}>{es?'¿Qué ganó Sarah después de los gastos?':'What did Sarah earn after expenses?'}</p></div>:null}
      {snapshot.picture.mainFrame>=526?<div><strong>2. {es?'Identificar la información':'Identify the information'}</strong><p style={{margin:'4px 0'}}>{es?'Cada limpieza: $25. Número de limpiezas: 4. Gastos: $10. Se necesitan las ganancias totales.':'Each cleaning: $25. Number of cleanings: 4. Expenses: $10. Find the total earnings.'}</p></div>:null}
      {snapshot.picture.mainFrame>=652||interaction?.strategyCharacterId===110?<div><strong>3. {es?'Escribir una ecuación':'Write an equation'}</strong><p data-p045-equation style={{margin:'4px 0',fontSize:20}}>$25 × 4 − $10 = $90</p></div>:null}
      {snapshot.picture.mainFrame>=774||interaction?.strategyCharacterId===146?<div><strong>4. {es?'Dibujar':'Draw a picture'}</strong><p style={{margin:'4px 0'}}>{es?'Da cuatro saltos de $25 y resta $10 de gastos.':'Make four jumps of $25, then subtract $10 in expenses.'}</p><p data-p045-number-line style={{margin:'4px 0',fontSize:19}}>0 → 25 → 50 → 75 → 100 → 90</p></div>:null}
    </div>
    {hold&&!strategyVisible?<div role="group" aria-label={es?'Controles del paso':'Step controls'} style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
      <button type="button" data-p045-continue style={buttonStyle} disabled={!canContinue} onClick={()=>teaching('continueTeaching')}>{es?'Continuar':'Continue'}</button>
      {hold.index>=2?<button type="button" data-p045-open-strategy style={buttonStyle} disabled={!interaction?.strategyEnabled||Boolean(entry)} onClick={()=>teaching('openStrategy')}>{hold.index===2?(es?'Ver la ecuación':'Show the equation'):(es?'Ver el dibujo':'Show the picture')}</button>:null}
    </div>:null}
    {strategyVisible?<button type="button" data-p045-close-strategy style={{...buttonStyle,marginTop:12}} disabled={!canCloseStrategy} onClick={()=>teaching('closeStrategy')}>{es?'Cerrar y continuar':'Close and continue'}</button>:null}
    {snapshot.picture.mainFrame>=813?<>
      <div role="group" aria-label={es?'Opciones de respuesta':'Answer choices'} style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:14}}>
        {practice.choices.map(c=><button type="button" key={c.sourceInstanceName} data-p045-choice={c.sourceInstanceName} style={{...buttonStyle,minHeight:48,fontSize:18}} disabled={!canAct} onClick={e=>choose(c.sourceInstanceName,e.currentTarget)}>{c.letter}. ${c.value}</button>)}
      </div>
      {snapshot.phase==='ended'?<p data-p045-result style={{fontSize:22,fontWeight:700}}>$25 × 4 − $10 = $90</p>:null}
      <button type="button" data-p045-help style={{...buttonStyle,marginTop:14}} disabled={!interaction?.helpEnabled||Boolean(entry)} onClick={e=>openHelp(e.currentTarget)}>{es?'Más ayuda':'Need More Help'}</button>
    </>:null}
    {helpVisible?<div data-p045-help-content style={{...boxStyle,marginTop:14}}>
      <h4 style={{margin:'0 0 8px'}}>{es?'Multiplicar y restar':'Multiply and subtract'}</h4>
      <p>{es?'Multiplica la cantidad ganada por limpieza por el número de limpiezas. Después, resta los gastos.':practice.help.text}</p>
      <p>{es?'Gerald ganó $25 al día lavando autos durante 5 días. Pagó $15 por los materiales de limpieza. ¿Cuánto ganó después de los gastos?':practice.help.example}</p>
      <p style={{fontSize:20}}>$25 × 5 − $15 = $110</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{practice.help.hotspots.map(h=><button key={h.entryId} type="button" data-p045-help-term={h.entryId} disabled={Boolean(entry)} style={buttonStyle} onClick={e=>openGlossary(h.entryId,e.currentTarget)}>{practice.glossary.find(g=>g.id===h.entryId)?.labels[language]}</button>)}</div>
      <button type="button" data-p045-close-help style={{...buttonStyle,marginTop:12}} disabled={Boolean(entry)} onClick={closeHelp}>{es?'Cerrar ayuda':'Close Help'}</button>
    </div>:null}
  </section>:null;
  const modal = entry ? <div style={{position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12,25,42,.48)', display: 'grid', placeItems: 'center', padding: 16}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-glossary-title`} data-p045-dialog={entry.id}
      style={{...boxStyle, width: 'min(100%,620px)', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 16px 60px #10203044'}}>
      <h3 id={`${ID}-glossary-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
      <button type="button" data-p045-dialog-close style={buttonStyle} onClick={closeGlossary}>
        {helpVisible ? (es ? 'Volver a la ayuda' : 'Back to Help') : glossaryResume.current ? (es ? 'Cerrar y continuar' : 'Close and continue') : (es ? 'Cerrar' : 'Close')}
      </button>
    </div>
  </div> : null;
  return <div className="runtime-shell" style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase ?? 'loading'} data-source-operation={snapshot?.operation ?? 'main'}
    data-source-failure={snapshot?.failure ?? error ?? ''} data-source-answer-attempts={snapshot?.attempts ?? 0}
    data-source-wrong-attempts={snapshot?.wrongAttempts ?? 0} data-source-choice={snapshot?.choice ?? ''}
    data-source-outcome={snapshot?.outcome ?? 'unanswered'} data-source-correct-answer={snapshot?.correctAnswer ? 'true' : 'false'}
    data-source-revealed={snapshot?.revealedAfterSecondWrong ? 'true' : 'false'}
    data-source-feedback-id={interaction?.feedbackCharacterId ?? ''} data-source-feedback-frame={interaction?.feedbackFrame ?? 1}
    data-source-strategy-id={interaction?.strategyCharacterId ?? ''} data-source-strategy-frame={interaction?.strategyFrame ?? 1}
    data-source-hold-index={interaction?.holdIndex ?? ''} data-source-visited-holds={snapshot?.visitedHolds.join(',') ?? ''} data-source-viewed-strategies={snapshot?.viewedStrategies.join(',') ?? ''}
    data-source-help-visible={helpVisible ? 'true' : 'false'} data-source-inspection={snapshot?.inspectionMode ? 'true' : 'false'}
    data-source-host-stop-frame="832" data-source-playback-mode="once"
    data-runtime-playback-complete={snapshot?.phase === 'ended' && snapshot.outcome !== 'unanswered' && !snapshot.inspectionMode && !reduced ? 'true' : 'false'}
    data-source-audio-frame={snapshot?.picture.mainFrame ?? 1} data-source-audio-domain={snapshot?.audioDomain ?? ''}
    data-source-audio-sample={snapshot?.audioSample ?? 0} data-source-alignment="candidate-not-accepted"
    data-audio-available={snapshot ? 'true' : 'false'} data-product-audio-enabled={props.audioEnabled ? 'true' : 'false'}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-runtime-volume={props.volume ?? 1} data-runtime-presentation="modern-wide">
    <div ref={stage} className="runtime-stage" style={{position: 'relative', height: 'auto', aspectRatio: '4 / 3'}} data-animation-module={ID}
      data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-290" data-runtime-scenario="source-static-frame" data-source-clock-ready={snapshot ? 'true' : 'false'}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={practice?.prompt ?? props.labels.loading}
        style={{display: snapshot ? 'block' : 'none', width: '100%', height: 'auto'}}/>
      {practice && snapshot ? <>
        {hold&&!strategyVisible?<button type="button" data-p045-source-step={hold.index} style={hitStyle(hold.secondaryBounds)} aria-label={hold.index<2?(es?'Continuar':'Continue'):hold.index===2?(es?'Ver la ecuación':'Show the equation'):(es?'Ver el dibujo':'Show the picture')} disabled={!canContinue} onClick={()=>teaching(hold.index<2?'continueTeaching':'openStrategy')}/>:null}
        {strategyVisible&&strategy?<button type="button" data-p045-source-close-strategy style={hitStyle(strategy.closeBounds)} aria-label={es?'Cerrar y continuar':'Close and continue'} disabled={!canCloseStrategy} onClick={()=>teaching('closeStrategy')}/>:null}
        {paintedFrame===813&&!helpVisible&&interaction?.feedbackCharacterId===null?<>
          {practice.choices.map(c=><button type="button" key={c.sourceInstanceName} data-p045-source-choice={c.sourceInstanceName} style={hitStyle(c.bounds)} aria-label={`${c.letter}. $${c.value}`} disabled={!canAct} onClick={e=>choose(c.sourceInstanceName,e.currentTarget)}/>)}
          <button type="button" data-p045-source-help style={hitStyle(practice.help.buttonBounds)} aria-label={es?'Más ayuda':'Need More Help'} disabled={!interaction?.helpEnabled||Boolean(entry)} onClick={e=>openHelp(e.currentTarget)}/>
        </>:null}
        {helpVisible ? <>
          {practice.help.hotspots.map(h => <button type="button" key={h.entryId} data-p045-source-help-term={h.entryId} style={hitStyle(h.bounds)}
            aria-label={practice.glossary.find(g => g.id === h.entryId)?.labels[language]} disabled={Boolean(entry)} onClick={e => openGlossary(h.entryId, e.currentTarget)}/>)}
          <button type="button" data-p045-source-close-help style={hitStyle(practice.help.closeBounds)} aria-label={es ? 'Cerrar ayuda' : 'Close Help'}
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
