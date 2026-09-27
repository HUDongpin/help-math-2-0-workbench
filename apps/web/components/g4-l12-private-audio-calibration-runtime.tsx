'use client';

import {createMemoryOnlyLessonHost} from '@helpmath/demos/runtime';
import {useCallback, useEffect, useMemo, useRef, useState, type ComponentProps} from 'react';
import {G4L12CalibrationCompanion} from '@/components/g4-l12-calibration-companion';
import {G4L12PrivateKeytermCandidateDialog} from '@/components/g4-l12-private-keyterm-candidate-dialog';
import {G4L12Vb035SourceRuntime} from '@/components/g4-l12-vb035-source-runtime';
import {G4L12Vb036SourceRuntime} from '@/components/g4-l12-vb036-source-runtime';

import {
  AnimationRuntime,
  INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
  type AnimationRuntimePlaybackState,
} from '@/components/animation-runtime';
import {
  createCalibrationAudioPlayer,
  IDLE_CALIBRATION_AUDIO,
  type CalibrationAudioState,
} from '@/lib/g4-l12-calibration-audio-player';
import type {G4L12PrivateAudioCalibrationAsset} from '@/lib/g4-l12-private-audio-calibration-assets.server';
import {findG4L12PrivateKeytermCandidate} from '@/lib/g4-l12-private-keyterm-candidate';
import type {G4L12Vb036PrivateBehavior} from '@/lib/g4-l12-vb036-private-behavior.server';

type Props = ComponentProps<typeof AnimationRuntime> & {
  assets: readonly G4L12PrivateAudioCalibrationAsset[];
  privateVb036Behavior?: G4L12Vb036PrivateBehavior;
};

const VB036_AUDIO_BINDINGS = Object.freeze([
  ['course-g04-l12-vb-036-external-host-associated-01', 'external-host-associated.mp3', '60d110000e1dd02cee4cedb6222243f0df1931559ae1922a2940ad896dcddc06', 'external'],
  ['course-g04-l12-vb-036-embedded-stream-0001', 'embedded-stream-0001--sprite-51--frames-0001-0005.mp3', 'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0002', 'embedded-stream-0002--sprite-57--frames-0003-0031.mp3', '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0003', 'embedded-stream-0003--sprite-85--frames-0002-0028.mp3', 'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0004', 'embedded-stream-0004--sprite-96--frames-0002-0028.mp3', 'd7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0005', 'embedded-stream-0005--sprite-108--frames-0002-0031.mp3', 'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0006', 'embedded-stream-0006--sprite-134--frames-0002-0031.mp3', '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0007', 'embedded-stream-0007--sprite-151--frames-0002-0028.mp3', '3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0008', 'embedded-stream-0008--sprite-172--frames-0003-0033.mp3', 'c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0009', 'embedded-stream-0009--sprite-184--frames-0001-0028.mp3', 'ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0010', 'embedded-stream-0010--sprite-215--frames-0002-0026.mp3', 'ab58df41a71899ae2b62d8ca19d773161ce6017ae5741fc587da597236f922af', 'embedded'],
  ['course-g04-l12-vb-036-embedded-stream-0011', 'embedded-stream-0011--sprite-216--frames-0009-0082.mp3', '470b836a8b3a6ec206bed0e9cd965ea24e138279f591520a4c4fdee3be55fc19', 'embedded'],
] as const);
const VB036_AUDIO_BINDING_IDENTITIES = Object.freeze(VB036_AUDIO_BINDINGS.map(
  ([id, assetFile, sha256, sourceKind]) => `${id}:${assetFile}:${sha256}:${sourceKind}`,
).sort());

function hasExactVb036AudioBindings(
  assets: readonly G4L12PrivateAudioCalibrationAsset[],
) {
  if (assets.length !== VB036_AUDIO_BINDING_IDENTITIES.length) return false;
  const observed = assets.map(({animationId, id, assetFile, url, sha256, sourceKind}) => {
    if (animationId !== 'course-g04-l12-vb-036' ||
      url !== `/flash-assets/current-js-audio-calibration-v1/${animationId}/${assetFile}?sha256=${sha256}`) {
      return '';
    }
    return `${id}:${assetFile}:${sha256}:${sourceKind}`;
  }).sort();
  return JSON.stringify(observed) === JSON.stringify(VB036_AUDIO_BINDING_IDENTITIES);
}

type SourceHostRequestHandler = NonNullable<Props['onLessonHostRequest']>;

export function dispatchG4L12PrivateSourceHostRequest({
  context,
  interruptSource,
  openPrivateCandidate,
  onLessonHostRequest,
  request,
  stopManualAudio,
}: {
  context: Parameters<SourceHostRequestHandler>[1];
  interruptSource: () => void;
  openPrivateCandidate?: SourceHostRequestHandler;
  onLessonHostRequest?: SourceHostRequestHandler;
  request: Parameters<SourceHostRequestHandler>[0];
  stopManualAudio: () => void;
}): ReturnType<SourceHostRequestHandler> {
  if (request.type === 'open-keyterm' && request.playbackDisposition ===
    'source-stop-timeline-and-audio-until-explicit-resume') {
    stopManualAudio();
    interruptSource();
  }
  const candidateDecision = openPrivateCandidate?.(request, context);
  if (candidateDecision !== undefined) return candidateDecision;
  return onLessonHostRequest?.(request, context);
}

export function G4L12PrivateAudioCalibrationRuntime({assets, privateVb036Behavior, ...props}: Props) {
  const identity = JSON.stringify([props.animationId,
    props.audioLanguage ?? props.uiLanguage ?? props.query.lang ?? 'en', props.query,
    assets.map(({id, sha256}) => [id, sha256]), privateVb036Behavior
      ? [privateVb036Behavior.sha256, privateVb036Behavior.contractId,
          privateVb036Behavior.sourceContractFingerprintSha256]
      : null]);
  return <CalibrationSession key={identity} assets={assets}
    privateVb036Behavior={privateVb036Behavior} {...props} />;
}

function CalibrationSession({assets, privateVb036Behavior, ...props}: Props) {
  const {animationId, narrationRequest, onPlaybackStateChange, onReplay, volume = 1} = props;
  const language = props.audioLanguage ?? props.uiLanguage ?? props.query.lang ?? 'en';
  const spanish = language === 'es';
  const disabled = props.audioEnabled !== true || props.query.capture === '1'
    || props.query.frame !== undefined || props.paused === true;
  const selectedAssets = assets.filter((asset) =>
    asset.animationId === animationId && (asset.sourceKind === 'embedded' || spanish));
  const [audioState, setAudioState] = useState<CalibrationAudioState>(IDLE_CALIBRATION_AUDIO);
  const [visualState, setVisualState] = useState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
  const playerRef = useRef<ReturnType<typeof createCalibrationAudioPlayer> | null>(null);
  const sourceInterruption = useRef<(() => void) | null>(null);
  const [privateKeytermSession, setPrivateKeytermSession] = useState<Readonly<{
    entryId: string;
    trigger: HTMLElement | null;
  }> | null>(null);
  const privateKeytermHost = useMemo(() => createMemoryOnlyLessonHost({
    releaseId: 'private-g4-l12-default-dictionary-candidate',
    releaseMemberIds: ['course-g04-l12-vb-036'],
    currentAnimationId: 'course-g04-l12-vb-036',
    enabledCapabilities: ['keyterm'],
    initialLanguage: 'en',
    mode: 'audit',
    releasePublished: false,
  }), []);
  const registerSourceInterruption = useCallback((interrupt: (() => void) | null) => {
    sourceInterruption.current = interrupt;
  }, []);
  // A request carried into a new page/language session is not a new gesture.
  const handledNarration = useRef<number | null>(narrationRequest?.requestId ?? null);
  const stop = useCallback(() => playerRef.current?.stop(), []);
  const openPrivateKeytermCandidate = useCallback<SourceHostRequestHandler>((request, context) => {
    if (request.type !== 'open-keyterm' ||
      request.sourceAnimationId !== 'course-g04-l12-vb-036' ||
      request.playbackDisposition !== 'source-stop-timeline-and-audio-until-explicit-resume' ||
      findG4L12PrivateKeytermCandidate(request.entryId) === null) return undefined;
    const decision = privateKeytermHost.dispatch(request);
    if (decision.status === 'allowed') {
      setPrivateKeytermSession(Object.freeze({
        entryId: request.entryId,
        trigger: context?.trigger ?? null,
      }));
    }
    return decision;
  }, [privateKeytermHost]);
  const closePrivateKeytermCandidate = useCallback(() => {
    privateKeytermHost.dispatch({type: 'close-keyterm'});
    setPrivateKeytermSession(null);
  }, [privateKeytermHost]);
  const dispatchSourceHostRequest = useCallback<SourceHostRequestHandler>((request, context) => {
    return dispatchG4L12PrivateSourceHostRequest({
      context,
      interruptSource: () => sourceInterruption.current?.(),
      onLessonHostRequest: props.onLessonHostRequest,
      openPrivateCandidate: openPrivateKeytermCandidate,
      request,
      stopManualAudio: stop,
    });
  }, [openPrivateKeytermCandidate, props.onLessonHostRequest, stop]);
  const privateKeytermEntry = privateKeytermSession
    ? findG4L12PrivateKeytermCandidate(privateKeytermSession.entryId)
    : null;

  useEffect(() => {
    const player = createCalibrationAudioPlayer((url) => new Audio(url), setAudioState);
    playerRef.current = player;
    return () => {
      player.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, []);
  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const play = useCallback((asset: G4L12PrivateAudioCalibrationAsset) => {
    if (!disabled && selectedAssets.includes(asset)) {
      sourceInterruption.current?.();
      playerRef.current?.play(asset, volume);
    }
  }, [disabled, selectedAssets, volume]);
  const hostTrack = selectedAssets.find(({sourceKind}) => sourceKind === 'external');
  useEffect(() => {
    const request = narrationRequest;
    if (!request || handledNarration.current === request.requestId) return;
    handledNarration.current = request.requestId;
    if (request.action === 'stop') stop();
    else if (hostTrack) play(hostTrack);
  }, [narrationRequest, hostTrack, play, stop]);

  const sounding = audioState.status === 'loading' || audioState.status === 'playing';
  const available = !disabled && selectedAssets.length > 0;
  const narration: AnimationRuntimePlaybackState['narration'] = !available
    ? 'unavailable' : sounding ? 'playing' : audioState.status === 'blocked'
      ? 'blocked' : visualState.narration === 'playing' || visualState.narration === 'blocked'
        || visualState.narration === 'waiting' || visualState.narration === 'idle'
        ? visualState.narration : hostTrack ? 'idle' : 'interactive';
  useEffect(() => {
    onPlaybackStateChange?.({...visualState, audioAvailable: available, narration});
  }, [onPlaybackStateChange, visualState, available, narration]);
  const replay = useCallback(() => {
    stop();
    onReplay?.();
  }, [stop, onReplay]);
  const sourceRuntime = animationId === 'course-g04-l12-vb-035'
    && props.moduleKey === animationId && props.query.frameDomain === 'sprite-35'
    && props.query.scenario === 'source-static-frame' && props.query.lang === 'en'
    && props.audioEnabled === true && props.query.capture !== '1' && props.query.frame === undefined;
  const sourceRuntime036 = animationId === 'course-g04-l12-vb-036'
    && props.moduleKey === animationId && props.query.frameDomain === 'sprite-216'
    && props.query.scenario === 'source-static-frame' && props.query.lang === 'en'
    && props.audioEnabled === true && props.query.capture === undefined
    && props.query.frame === undefined && hasExactVb036AudioBindings(assets)
    && privateVb036Behavior?.animationId === animationId;

  return <div data-private-audio-calibration="g4-l12-v1"
    data-calibration-audio-state={audioState.status}
    data-calibration-active-id={audioState.activeId ?? ''}
    data-calibration-audio-enabled={available ? 'true' : 'false'}
    data-audio-acceptance="pending" data-source-trigger-established="false">
    {sourceRuntime
      ? <G4L12Vb035SourceRuntime {...props} narrationRequest={spanish ? null : narrationRequest}
          onBeforeGlossaryOpen={stop}
          onInterruptionReady={registerSourceInterruption}
          paused={props.paused || sounding} onPlaybackStateChange={setVisualState} onReplay={replay} />
      : sourceRuntime036
        ? <G4L12Vb036SourceRuntime {...props} behavior={privateVb036Behavior}
            narrationRequest={spanish ? null : narrationRequest} onInterruptionReady={registerSourceInterruption}
            onLessonHostRequest={dispatchSourceHostRequest}
            paused={props.paused || sounding} onPlaybackStateChange={setVisualState} onReplay={replay} />
      : <AnimationRuntime {...props} audioEnabled={false} narrationRequest={null}
          paused={props.paused || sounding} onPlaybackStateChange={setVisualState}
          onReplay={replay} />}
    {props.audioEnabled && props.query.capture !== '1' && props.query.frame === undefined
      ? <G4L12CalibrationCompanion targetId={props.pageInteractionCompanionTargetId}>
        <section aria-label={spanish ? 'Calibración privada de audio' : 'Private audio calibration'}
          className="runtime-toolbar" style={{display: 'grid', gap: 12, padding: 16}}>
          <p style={{margin: 0}}>{spanish
            ? 'Calibración manual de archivos fuente. Idioma hablado, sincronización y activación original sin verificar. No es una aceptación de audio.'
            : 'Manual source-file calibration. Spoken language, synchronization and original triggers are unverified. This is not audio acceptance.'}</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {selectedAssets.map((asset) => <button key={asset.id} type="button"
              disabled={disabled} aria-pressed={audioState.activeId === asset.id}
              data-calibration-audio-id={asset.id} data-calibration-source-kind={asset.sourceKind}
              onClick={() => audioState.activeId === asset.id ? stop() : play(asset)}
              style={{minHeight: 44, padding: '8px 12px', maxWidth: '100%', whiteSpace: 'normal'}}>
              {asset.sourceKind === 'external'
                ? (spanish ? 'Pista asociada al control español' : 'Spanish-control associated track')
                : `${spanish ? 'Flujo' : 'Stream'} ${asset.id.split('-').at(-1)} · ${asset.ownerFrameDomain ?? 'unknown'}`}
            </button>)}
            <button type="button" onClick={stop} disabled={!sounding}
              style={{minHeight: 44, padding: '8px 12px'}}>
              {spanish ? 'Detener audio' : 'Stop audio'}
            </button>
          </div>
          <p role="status" style={{margin: 0}}>{audioState.status === 'blocked'
            ? (spanish ? 'No se pudo reproducir el archivo. Reinténtalo con el botón.'
              : 'The file could not play. Use its button to retry.')
            : audioState.status === 'loading' ? (spanish ? 'Cargando audio…' : 'Loading audio…')
              : audioState.status === 'playing' ? (spanish ? 'Reproduciendo audio.' : 'Audio playing.')
                : (spanish ? 'Audio detenido.' : 'Audio stopped.')}</p>
        </section>
      </G4L12CalibrationCompanion> : null}
    <G4L12PrivateKeytermCandidateDialog entry={privateKeytermEntry}
      onClose={closePrivateKeytermCandidate}
      returnFocusTo={privateKeytermSession?.trigger ?? null}
      uiLanguage={props.uiLanguage} />
  </div>;
}
