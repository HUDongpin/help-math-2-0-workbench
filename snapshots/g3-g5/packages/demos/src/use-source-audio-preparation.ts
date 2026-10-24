'use client';
import {useEffect, useMemo, useState} from 'react';
import type {AudioCue} from './contract';
import type {LessonTextActivityDefinition} from './lesson-text-contract';
import {audioCueMatchesContext, isSameOriginAssetSource} from './runtime';
import {createSourceAudioMedia, type SourceAudioMedia} from './source-pcm-audio';
import {LESSON_MANUAL_NARRATION_PCM} from './generated/lesson-manual-narration-pcm';

/** Prepare source media before the existing teaching clock starts. No elapsed
 * teaching time, intervals or frame advancement live in this hook. */
export function useSourceAudioPreparation(options: {
  active: boolean; identity: string; cues?: readonly AudioCue[];
  activities?: readonly LessonTextActivityDefinition[];
  frameDomain: string; lang: 'en' | 'es'; scenario: string; seed: number;
}) {
  const cues = useMemo(() => options.active ? options.cues?.filter(cue => audioCueMatchesContext(cue, options)) ?? [] : [],
    [options.active, options.cues, options.frameDomain, options.lang, options.scenario, options.seed]);
  const activityAudio = useMemo(() => options.active ? options.activities?.flatMap(({audio}) =>
    audio && (audio.language === 'shared' || audio.language === options.lang)
      && isSameOriginAssetSource(audio.source) && /^[a-f0-9]{64}$/.test(audio.sha256)
      && LESSON_MANUAL_NARRATION_PCM[audio.sha256]
      && audio.firstFrame >= 1 && audio.lastFrame >= audio.firstFrame
      && (audio.offsetSeconds === undefined || (Number.isFinite(audio.offsetSeconds) && audio.offsetSeconds >= 0))
      ? [audio] : []) ?? [] : [], [options.active, options.activities, options.lang]);
  const required = cues.length > 0 || activityAudio.length > 0;
  const signature = `${options.identity}:${JSON.stringify([cues, activityAudio])}`;
  const [current, setCurrent] = useState<{signature: string; pool: Map<string, SourceAudioMedia>; ready: boolean; failed: boolean} | null>(null);
  useEffect(() => {
    const pool = new Map<string, SourceAudioMedia>(); let cancelled = false;
    for (const cue of cues) pool.set(cue.id, createSourceAudioMedia(cue.source, cue.sha256));
    // Keep cue-ID playback ownership unchanged. Activity controllers own their
    // separate per-instance players; these media only prepare and retain the
    // shared source context before the teaching clock is allowed to start.
    const activityPool = new Map<string, SourceAudioMedia>();
    for (const audio of activityAudio) {
      const key = `${audio.source}:${audio.sha256}`;
      if (!activityPool.has(key)) activityPool.set(key, createSourceAudioMedia(audio.source, audio.sha256));
    }
    const media = [...pool.values(), ...activityPool.values()];
    setCurrent({signature, pool, ready: false, failed: false});
    void Promise.allSettled(media.map(item => item.prepareForTimeline?.() ?? Promise.resolve())).then(results => {
      if (!cancelled) setCurrent({signature, pool, ready: true, failed: results.some(result => result.status === 'rejected')});
    });
    return () => {cancelled = true; for (const item of media) {item.pause(); item.dispose?.();}};
  }, [signature, cues, activityAudio]);
  const status = !required ? 'not-required' : current?.signature !== signature || !current.ready ? 'loading' : current.failed ? 'error' : 'ready';
  return {status, ready: !required || (current?.signature === signature && current.ready),
    pool: current?.signature === signature ? current.pool : undefined};
}
