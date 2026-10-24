import type {KeytermPlaybackDisposition} from '../../../packages/demos/src/lesson-host-contract';

export interface DescriptorGlossaryPauseSession<TSeekRequest> {
  readonly pageSessionId: string;
  readonly pausedBeforeOpen: boolean;
  readonly playbackDisposition?: KeytermPlaybackDisposition;
  readonly seekRequestBeforeOpen: TSeekRequest | null;
}

export interface DescriptorGlossaryPauseState<TSeekRequest> {
  readonly paused: boolean;
  readonly seekRequest: TSeekRequest | null;
  readonly session: DescriptorGlossaryPauseSession<TSeekRequest> | null;
}

export function transitionDescriptorGlossaryPause<TSeekRequest>({
  allowed,
  pageSessionId,
  paused,
  requestType,
  seekRequest,
  session,
  playbackDisposition,
}: {
  readonly allowed: boolean;
  readonly playbackDisposition?: KeytermPlaybackDisposition;
  readonly pageSessionId: string;
  readonly paused: boolean;
  readonly requestType: 'open-glossary' | 'close-glossary';
  readonly seekRequest: TSeekRequest | null;
  readonly session: DescriptorGlossaryPauseSession<TSeekRequest> | null;
}): DescriptorGlossaryPauseState<TSeekRequest> {
  if (!allowed) return {paused, seekRequest, session};

  if (requestType === 'open-glossary') {
    const activeSession = session?.pageSessionId === pageSessionId
      ? (playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume'
          ? {...session, playbackDisposition} : session)
      : {
          pageSessionId,
          pausedBeforeOpen: paused,
          ...(playbackDisposition ? {playbackDisposition} : {}),
          seekRequestBeforeOpen: seekRequest,
        };
    return {paused: true, seekRequest, session: activeSession};
  }

  if (!session || session.pageSessionId !== pageSessionId) {
    // A close without its page-bound opening snapshot must not resume playback.
    return {paused, seekRequest, session: null};
  }
  if (session.seekRequestBeforeOpen !== null) {
    return {
      paused: true,
      seekRequest: session.seekRequestBeforeOpen,
      session: null,
    };
  }
  return {
    paused: session.playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume' ? true : session.pausedBeforeOpen,
    seekRequest: null,
    session: null,
  };
}

export function resetDescriptorGlossaryPause<TSeekRequest>():
DescriptorGlossaryPauseState<TSeekRequest> {
  return {paused: false, seekRequest: null, session: null};
}
