'use client';

import {
  createMemoryOnlyLessonHost,
  type LessonHostDecision,
  type LessonHostRequest,
  type LessonHostState,
} from '@helpmath/demos/runtime';
import {useCallback, useMemo, useState} from 'react';

import {
  G4L5PrivateAnimationRuntime,
  INITIAL_G4_L5_PRIVATE_RUNTIME_STATE,
  type G4L5PrivateRuntimeState,
} from '@/components/g4-l5-private-animation-runtime';
import type {
  G4L5ProductBridgeDescriptor,
  G4L5ProductBridgeLocale,
} from '@/lib/g4-l5-product-bridge-descriptor';

const copy = Object.freeze({
  en: Object.freeze({
    privateLabel: 'Private engineering · Current-JS product bridge',
    sourceOrder: 'Source-ordered lesson map',
    unavailable: 'Outside the frozen page-only product bridge',
    replay: 'Replay page',
    previous: 'Previous candidate',
    next: 'Next candidate',
    audioUnaccepted: 'Exact source audio is available, but language and listening acceptance remain open.',
    noAudio: 'No exact page-local audio is registered for this candidate.',
    close: 'Close',
    score: 'Memory-only quiz probe',
    correct: 'correct',
    attempted: 'attempted',
  }),
  es: Object.freeze({
    privateLabel: 'Ingeniería privada · puente de producto Current-JS',
    sourceOrder: 'Mapa de la lección en orden de fuente',
    unavailable: 'Fuera del puente de producto congelado de páginas',
    replay: 'Repetir página',
    previous: 'Candidato anterior',
    next: 'Candidato siguiente',
    audioUnaccepted: 'El audio fuente exacto está disponible, pero el idioma y la aceptación auditiva siguen pendientes.',
    noAudio: 'No hay audio local exacto registrado para este candidato.',
    close: 'Cerrar',
    score: 'Prueba de cuestionario solo en memoria',
    correct: 'correcta',
    attempted: 'intentada',
  }),
});

export function G4L5ProductBridgePlayer({
  descriptor,
  locale,
}: {
  descriptor: G4L5ProductBridgeDescriptor;
  locale: G4L5ProductBridgeLocale;
}) {
  const candidates = useMemo(
    () => descriptor.pages.filter(
      (page) => page.candidate.status === 'private-current-js',
    ),
    [descriptor.pages],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [replayEpoch, setReplayEpoch] = useState(0);
  const currentPage = candidates[candidateIndex] ?? candidates[0]!;
  if (currentPage.candidate.status !== 'private-current-js') {
    throw new Error('Private G4 L5 player selected an unavailable page');
  }
  const host = useMemo(() => createMemoryOnlyLessonHost({
    releaseId: descriptor.releaseId,
    releaseMemberIds: candidates.map((page) => page.animationId),
    currentAnimationId: currentPage.animationId,
    enabledCapabilities: ['audio', 'glossary', 'fq-scoring'],
    initialLanguage: locale,
    mode: 'audit',
    releasePublished: false,
  }), [
    candidates,
    currentPage.animationId,
    descriptor.releaseId,
    locale,
  ]);
  const hostIdentity = `${currentPage.animationId}:${locale}`;
  const [hostRecord, setHostRecord] = useState<{
    identity: string;
    state: LessonHostState;
  }>(() => ({identity: hostIdentity, state: host.snapshot()}));
  const hostState = hostRecord.identity === hostIdentity
    ? hostRecord.state
    : host.snapshot();

  const runtimeIdentity = `${currentPage.animationId}:${replayEpoch}`;
  const [playbackRecord, setPlaybackRecord] = useState<{
    identity: string;
    state: G4L5PrivateRuntimeState;
  }>(() => ({
    identity: runtimeIdentity,
    state: INITIAL_G4_L5_PRIVATE_RUNTIME_STATE,
  }));
  const playback = playbackRecord.identity === runtimeIdentity
    ? playbackRecord.state
    : INITIAL_G4_L5_PRIVATE_RUNTIME_STATE;
  const updatePlayback = useCallback((state: G4L5PrivateRuntimeState) => {
    setPlaybackRecord({identity: runtimeIdentity, state});
  }, [runtimeIdentity]);

  const dispatchHostRequest = useCallback((
    request: LessonHostRequest,
  ): LessonHostDecision => {
    const decision = host.dispatch(request);
    setHostRecord({identity: hostIdentity, state: decision.state});
    return decision;
  }, [host, hostIdentity]);

  const navigate = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= candidates.length) return;
    setCandidateIndex(nextIndex);
    setReplayEpoch(0);
  };
  const replay = () => {
    setHostRecord({identity: hostIdentity, state: host.reset()});
    setReplayEpoch((value) => value + 1);
  };
  const glossaryEntry = descriptor.glossary.find(
    (entry) => entry.id === hostState.glossaryEntryId,
  );

  return (
    <section
      className="g4-l5-product-bridge"
      data-acceptance-effect="none"
      data-audio-accepted="false"
      data-calibration-id={descriptor.calibrationId}
      data-current-animation-id={currentPage.animationId}
      data-current-source-occurrence={currentPage.globalPageOrdinal}
      data-current-js-selected-count={candidates.length}
      data-descriptor-id={descriptor.descriptorId}
      data-fidelity-accepted="false"
      data-host-kind={descriptor.host.kind}
      data-legacy-course-shell-count={descriptor.course.legacyCourseShellCount}
      data-owner-accepted="false"
      data-private-modern-my-lesson="true"
      data-published="false"
      data-replay-epoch={replayEpoch}
      data-source-active-page-count={descriptor.course.activePageCount}
      data-strict-complete="false"
    >
      <header className="g4-l5-product-bridge__header">
        <div>
          <p className="g4-l5-product-bridge__eyebrow">
            {copy[locale].privateLabel}
          </p>
          <h1>Grade 4 · Lesson 5 · {descriptor.course.title}</h1>
          <p>
            {candidates.length} / {descriptor.course.activePageCount} page animations registered · legacy Flash shell 0 ·
            acceptance gates remain false
          </p>
        </div>
        <dl className="g4-l5-product-bridge__facts">
          <div><dt>Registry</dt><dd>private-current-js</dd></div>
          <div><dt>Host</dt><dd>modern My Lesson</dd></div>
          <div><dt>Storage</dt><dd>memory-only</dd></div>
        </dl>
      </header>

      <div className="g4-l5-product-bridge__layout">
        <aside
          aria-label={copy[locale].sourceOrder}
          className="g4-l5-product-bridge__rail"
        >
          <h2>{copy[locale].sourceOrder}</h2>
          <ol>
            {descriptor.pages.map((page) => {
              const selected = page.animationId === currentPage.animationId;
              const available =
                page.candidate.status === 'private-current-js';
              const nextCandidateIndex = candidates.findIndex(
                (candidate) => candidate.animationId === page.animationId,
              );
              return (
                <li key={`${page.globalPageOrdinal}:${page.animationId}`}>
                  <button
                    aria-current={selected ? 'page' : undefined}
                    aria-label={
                      `${page.globalPageOrdinal}. ${page.labels[locale].text}` +
                      (available ? '' : `. ${copy[locale].unavailable}`)
                    }
                    data-page-available={available}
                    data-source-occurrence={page.globalPageOrdinal}
                    disabled={!available}
                    onClick={() => navigate(nextCandidateIndex)}
                    title={available
                      ? page.animationId
                      : copy[locale].unavailable}
                    type="button"
                  >
                    <span>{page.globalPageOrdinal}</span>
                    <small>{page.sectionCode}</small>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="g4-l5-product-bridge__workspace">
          <div className="g4-l5-product-bridge__page-heading">
            <div>
              <p>
                {currentPage.sectionCode} · source occurrence{' '}
                {currentPage.globalPageOrdinal} / 53
              </p>
              <h2>{currentPage.labels[locale].text}</h2>
            </div>
            <div className="g4-l5-product-bridge__runtime-status">
              <span data-runtime-frame-domain={playback.frameDomain}>
                {playback.frameDomain}
              </span>
              <span data-runtime-narration={playback.narration}>
                audio: {playback.narration}
              </span>
            </div>
          </div>

          <div className="g4-l5-product-bridge__stage">
            <G4L5PrivateAnimationRuntime
              audioEnabled={currentPage.candidate.audio}
              animationId={currentPage.animationId}
              frameDomain={currentPage.candidate.frameDomain}
              key={`${currentPage.animationId}:${replayEpoch}`}
              language={locale}
              moduleKey={currentPage.candidate.moduleKey}
              onLessonHostRequest={dispatchHostRequest}
              onPlaybackStateChange={updatePlayback}
              replay={replayEpoch}
              volume={0.75}
            />
          </div>

          <div className="g4-l5-product-bridge__controls">
            <button
              disabled={candidateIndex === 0}
              onClick={() => navigate(candidateIndex - 1)}
              type="button"
            >
              ← {copy[locale].previous}
            </button>
            <button data-host-replay onClick={replay} type="button">
              ↻ {copy[locale].replay}
            </button>
            <button
              disabled={candidateIndex === candidates.length - 1}
              onClick={() => navigate(candidateIndex + 1)}
              type="button"
            >
              {copy[locale].next} →
            </button>
          </div>

          <div className="g4-l5-product-bridge__lifecycle" aria-live="polite">
            <p data-audio-lifecycle={playback.narration}>
              {currentPage.candidate.audio
                ? copy[locale].audioUnaccepted
                : copy[locale].noAudio}
            </p>
            <p data-memory-score>
              {copy[locale].score}: {hostState.fqScore.correct}{' '}
              {copy[locale].correct} / {hostState.fqScore.attempted}{' '}
              {copy[locale].attempted}
            </p>
          </div>
        </div>
      </div>

      {glossaryEntry ? (
        <div
          aria-label={glossaryEntry.labels[locale]}
          aria-modal="true"
          className="g4-l5-product-bridge__glossary"
          data-glossary-open={glossaryEntry.id}
          role="dialog"
        >
          <div>
            <p>Source-bound Key Term</p>
            <h2>{glossaryEntry.labels[locale]}</h2>
            <p>{glossaryEntry.definitions[locale]}</p>
            <code>{glossaryEntry.source[locale].sha256}</code>
            <button
              onClick={() => dispatchHostRequest({type: 'close-glossary'})}
              type="button"
            >
              {copy[locale].close}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
