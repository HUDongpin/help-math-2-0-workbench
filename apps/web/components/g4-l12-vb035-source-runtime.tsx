'use client';

import {useCallback, useEffect, useId, useRef, useState, useSyncExternalStore,
  type ComponentProps} from 'react';
import {createPortal} from 'react-dom';

import {AnimationRuntime} from '@/components/animation-runtime';
import {G4L12CalibrationCompanion} from '@/components/g4-l12-calibration-companion';
import {createVb035SourceState} from '@/lib/g4-l12-vb035-source-controller';
import {createVb035PcmClock, decodeVb035PrivatePcm, VB035_PCM_ASSET} from '@/lib/g4-l12-vb035-pcm-clock';
import {resolveVb035GlossaryHitRegions, VB035_DEFAULT_HOST_DICTIONARY_CANDIDATE,
  type Vb035GlossaryHitRegion} from '@/lib/g4-l12-vb035-glossary-geometry.generated';

type Clock = ReturnType<typeof createVb035PcmClock>;
type ClockSnapshot = ReturnType<Clock['snapshot']>;
type Props = ComponentProps<typeof AnimationRuntime> & {
  onBeforeGlossaryOpen: () => void;
  onInterruptionReady: (interrupt: (() => void) | null) => void;
};
const BUTTON_STYLE = {minHeight: 44, padding: '8px 12px'} as const;
const INITIAL: ClockSnapshot = {
  state: createVb035SourceState(), running: false, sounding: false, muted: false, status: 'ready',
};

export function openVb035SourceGlossaryAfterAdmission({
  clock,
  onBeforeGlossaryOpen,
  region,
}: {
  clock: Pick<Clock, 'openGlossary'>;
  onBeforeGlossaryOpen: () => void;
  region: Pick<Vb035GlossaryHitRegion, 'buttonId'>;
}) {
  onBeforeGlossaryOpen();
  clock.openGlossary(region.buttonId);
}

export function G4L12Vb035SourceRuntime(props: Props) {
  const {onInterruptionReady, onPlaybackStateChange, onPlaybackComplete} = props;
  const sourceId = useId();
  const spanish = props.uiLanguage === 'es';
  const [clock, setClock] = useState<Clock | null>(null);
  const [snapshot, setSnapshot] = useState(INITIAL);
  const [failed, setFailed] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastSeek = useRef(props.seekRequest?.requestId ?? 0);
  const lastNarration = useRef(props.narrationRequest?.requestId ?? 0);
  const completeRevision = useRef<number | null>(null);
  const subscribeSurface = useCallback((notify: () => void) => {
    const observer = new MutationObserver(notify);
    observer.observe(document.body, {childList: true, subtree: true,
      attributes: true, attributeFilter: ['data-canvas-status']});
    return () => observer.disconnect();
  }, []);
  const findSurface = useCallback(() => document.getElementById(sourceId)?.querySelector<HTMLCanvasElement>(
    'canvas[data-course-canvas="course-g04-l12-vb-035"]')?.parentElement ?? null, [sourceId]);
  const readCanvasStatus = useCallback(() => findSurface()?.closest<HTMLElement>(
    '[data-canvas-status]')?.dataset.canvasStatus ?? 'loading', [findSurface]);
  const surface = useSyncExternalStore(subscribeSurface, findSurface, () => null);
  const canvasStatus = useSyncExternalStore(subscribeSurface, readCanvasStatus, () => 'loading');
  const subscribeMotion = useCallback((notify: () => void) => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
  }, []);
  const reduced = useSyncExternalStore(subscribeMotion,
    () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const canvasReady = canvasStatus === 'ready' || canvasStatus === 'updating';

  useEffect(() => {
    const abort = new AbortController();
    let ownedClock: Clock | null = null;
    void (async () => {
      const response = await fetch(VB035_PCM_ASSET.url, {signal: abort.signal, cache: 'no-store', redirect: 'error'});
      if (!response.ok || Number(response.headers.get('content-length')) !== VB035_PCM_ASSET.bytes) {
        throw new Error('Private PCM unavailable');
      }
      const samples = await decodeVb035PrivatePcm(await response.arrayBuffer());
      if (abort.signal.aborted) return;
      ownedClock = createVb035PcmClock(new AudioContext(), samples);
      setClock(ownedClock);
      setFailed(false);
    })().catch(() => {if (!abort.signal.aborted) setFailed(true);});
    return () => {abort.abort(); ownedClock?.destroy();};
  }, [loadRevision]);

  useEffect(() => {
    if (!clock) return;
    onInterruptionReady(() => clock.pause());
    return () => onInterruptionReady(null);
  }, [clock, onInterruptionReady]);
  useEffect(() => {clock?.setVolume(props.volume ?? 1);}, [clock, props.volume]);
  useEffect(() => {
    if (!clock) return;
    if (reduced) clock.inspect(129);
    else if (props.paused || !canvasReady) clock.pause();
    else void clock.play();
  }, [clock, props.paused, reduced, canvasReady]);
  useEffect(() => {
    if (!clock) return;
    let request = 0;
    const tick = () => {
      const next = clock.snapshot();
      setSnapshot((previous) => previous.state === next.state && previous.status === next.status
        && previous.sounding === next.sounding && previous.muted === next.muted
        && previous.running === next.running ? previous : next);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [clock]);
  useEffect(() => {
    if (!clock || !props.seekRequest || props.seekRequest.requestId === lastSeek.current) return;
    lastSeek.current = props.seekRequest.requestId;
    clock.inspect(Math.max(1, Math.min(129, Math.trunc(props.seekRequest.frame))));
  }, [clock, props.seekRequest]);
  useEffect(() => {
    if (!clock || !props.narrationRequest || props.narrationRequest.requestId === lastNarration.current) return;
    lastNarration.current = props.narrationRequest.requestId;
    if (props.narrationRequest.action === 'stop') clock.mute();
    else if (!props.paused && !reduced && canvasReady) {clock.unmute(); void clock.play();}
  }, [clock, props.narrationRequest, props.paused, reduced, canvasReady]);

  const {state, running, sounding, muted, status} = snapshot;
  const inspection = state.phase === 'inspection';
  const regions = resolveVb035GlossaryHitRegions(state.frame);
  const activeTerm = VB035_DEFAULT_HOST_DICTIONARY_CANDIDATE.entries.find(
    (entry) => entry.buttonId === state.glossaryButtonId) ?? null;
  useEffect(() => {
    if (activeTerm && !dialog.current?.open) dialog.current?.showModal();
    if (!activeTerm && dialog.current?.open) dialog.current.close();
  }, [activeTerm]);
  useEffect(() => {
    onPlaybackStateChange?.({
      audioAvailable: Boolean(clock && !failed), frame: state.frame, frameCount: 129,
      frameDomain: 'sprite-35', fps: 12,
      narration: failed || status === 'blocked' ? 'blocked' : sounding ? 'playing'
        : !clock ? 'unavailable' : running && state.frame < 5 ? 'waiting' : 'interactive',
      playbackProgress: inspection ? null : (state.frame - 1) / 128,
      seekAvailable: Boolean(clock && !reduced && !activeTerm), stepFrames: 20,
      transportMode: 'visual-frame-inspector',
    });
    if (state.phase === 'complete' && completeRevision.current !== state.replayRevision) {
      completeRevision.current = state.replayRevision;
      onPlaybackComplete?.();
    }
  }, [clock, failed, state, status, sounding, running, inspection, reduced, activeTerm,
    onPlaybackStateChange, onPlaybackComplete]);

  const replay = () => {
    clock?.replay();
    props.onReplay?.();
    if (!props.paused && !reduced && canvasReady) void clock?.play();
  };
  const activate = (region: Vb035GlossaryHitRegion) => {
    if (!clock || !canvasReady || inspection || activeTerm) return;
    // This is the renderer's current source-clipped rectangle, not placement-only eligibility.
    openVb035SourceGlossaryAfterAdmission({
      clock,
      onBeforeGlossaryOpen: props.onBeforeGlossaryOpen,
      region,
    });
  };
  const closeGlossary = () => {
    clock?.closeGlossary();
    if (!props.paused && !reduced && canvasReady) void clock?.play();
  };

  return <div id={sourceId} data-vb035-source-runtime="private-continuous-pcm-v1"
    data-source-phase={state.phase} data-source-frame={state.frame}
    data-source-clock-status={status} data-source-pcm-sounding={sounding ? 'true' : 'false'}
    data-source-pcm-muted={muted ? 'true' : 'false'} data-source-latency-samples="1673"
    data-original-timing-established="false" data-audio-acceptance="pending">
    <AnimationRuntime {...props} query={{...props.query, frame: String(state.frame)}}
      paused audioEnabled={false} narrationRequest={null} seekRequest={null}
      presentation="legacy-shell" onPlaybackStateChange={undefined}
      onPlaybackComplete={undefined} onReplay={undefined} />
    {surface && canvasReady && !inspection ? createPortal(
      <div data-vb035-source-hotspots style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {regions.map((region) => <button type="button" key={region.buttonId} tabIndex={-1}
          data-source-button-id={region.buttonId} data-source-key-attribute={region.keyAttribute}
          aria-label={`Source word: ${region.keyAttribute}`} disabled={!clock || Boolean(activeTerm)}
          onClick={() => activate(region)} style={{position: 'absolute',
            left: `${region.bounds.x / 8}%`, top: `${region.bounds.y / 6}%`,
            width: `${region.bounds.width / 8}%`, height: `${region.bounds.height / 6}%`,
            padding: 0, border: 0, background: 'transparent', pointerEvents: 'auto', cursor: 'pointer'}} />)}
      </div>, surface) : null}
    <G4L12CalibrationCompanion targetId={props.pageInteractionCompanionTargetId}>
      <section aria-label={spanish ? 'Controles de la animación fuente' : 'Source animation controls'}
        data-vb035-source-controls className="runtime-toolbar" style={{display: 'grid', gap: 12, padding: 16}}>
        <p style={{margin: 0}}>{spanish
          ? 'Ingeniería privada: dibujo fuente en inglés, reloj PCM continuo y latencia declarada de 1673 muestras. La sincronización original no está aceptada.'
          : 'Private engineering: English source drawing, continuous PCM clock and the declared 1673-sample latency. Original synchronization is not accepted.'}</p>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || props.paused || reduced || !canvasReady || inspection || Boolean(activeTerm) || state.phase === 'complete'}
            onClick={() => {clock?.unmute(); void clock?.play();}}>
            {spanish ? 'Reproducir fuente' : 'Play source'}</button>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || !running}
            onClick={() => clock?.pause()}>{spanish ? 'Pausar fuente' : 'Pause source'}</button>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || reduced} onClick={replay}>{props.labels.replay}</button>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || inspection}
            onClick={() => muted ? clock?.unmute() : clock?.mute()}>
            {muted ? (spanish ? 'Activar narración fuente' : 'Unmute source narration')
              : (spanish ? 'Silenciar narración fuente' : 'Mute source narration')}</button>
          {regions.filter((region) => region.fullyRevealed).map((region) =>
            <button key={region.buttonId} type="button" style={BUTTON_STYLE}
              disabled={!clock || !canvasReady || inspection || Boolean(activeTerm)}
              onClick={() => activate(region)}>{region.keyAttribute}</button>)}
          {failed ? <button type="button" style={BUTTON_STYLE} onClick={() => setLoadRevision((value) => value + 1)}>
            {spanish ? 'Reintentar PCM' : 'Retry PCM'}</button> : null}
        </div>
        <p role="status" style={{margin: 0}}>{failed ? (spanish ? 'PCM privado no disponible.' : 'Private PCM is unavailable.')
          : reduced ? props.labels.reduced : inspection
            ? (spanish ? 'Inspección visual sin audio. Repetir vuelve al inicio.' : 'Silent visual inspection. Replay returns to the start.')
            : status === 'blocked' ? (spanish ? 'Pulsa Reproducir fuente para habilitar el audio.' : 'Use Play source to enable audio.')
              : `${state.frame} / 129 · ${state.phase}`}</p>
      </section>
    </G4L12CalibrationCompanion>
    <dialog ref={dialog} aria-labelledby={`${sourceId}-term`} data-vb035-default-dictionary-candidate
      onCancel={(event) => {event.preventDefault(); closeGlossary();}}
      style={{maxWidth: 'min(36rem, calc(100vw - 32px))', padding: 24, borderRadius: 16}}>
      <h2 id={`${sourceId}-term`}>{activeTerm?.title}</h2>
      <p lang="en">{activeTerm?.definition}</p>
      <p>{spanish ? 'Candidato del diccionario predeterminado del mismo host. La variante del entorno original no está verificada.'
        : 'Same-host default dictionary candidate. The original runtime variant is unverified.'}</p>
      <button type="button" autoFocus style={BUTTON_STYLE} onClick={closeGlossary}>
        {spanish ? 'Cerrar y continuar' : 'Close and continue'}</button>
    </dialog>
  </div>;
}
