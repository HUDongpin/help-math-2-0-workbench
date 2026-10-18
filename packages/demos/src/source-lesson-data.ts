import type {AudioCue, AudioTrack, InteractiveAudioAsset} from './contract';

export interface SourceQuestionAudioAsset extends InteractiveAudioAsset {
  readonly questionNumber: number;
  readonly option: string | null;
}

export interface SourceFeedbackAudioAsset extends InteractiveAudioAsset {
  readonly coverageDisposition: 'interaction-only';
  readonly trigger: string;
}

export interface RecoveredPageAudio {
  readonly cues: readonly AudioCue[];
  readonly tracks: readonly AudioTrack[];
  readonly spanishSourceHashes: readonly string[];
  readonly sharedMusicSourceHashes?: readonly string[];
  readonly interactive?: readonly (SourceQuestionAudioAsset | SourceFeedbackAudioAsset)[];
  readonly alignExistingCueFrames?: boolean;
}

/** Recovered source audio, quiz and feedback data for one lesson, keyed by animation id. */
export interface SourceLessonData {
  readonly lessonId: string;
  readonly audio: Readonly<Record<string, RecoveredPageAudio>>;
  readonly quiz: Readonly<Record<string, unknown>>;
  readonly feedback: Readonly<Record<string, unknown>>;
}

export function sourceLessonIdForKey(key: string): string | undefined {
  return /^course-(g0\d-l\d\d)-/u.exec(key)?.[1];
}

/** Throws when a lesson's data is handed to an animation from another lesson. */
export function assertSourceLessonDataFor(data: SourceLessonData, key: string): SourceLessonData {
  if (data.lessonId !== sourceLessonIdForKey(key)) {
    throw new Error(`Source lesson data ${data.lessonId} does not belong to ${key}`);
  }
  return data;
}

/** One lazily loaded chunk per lesson, so a lesson page never downloads another lesson's data. */
export const sourceLessonDataLoaders: Readonly<Record<string, () => Promise<SourceLessonData>>> = Object.freeze({
  'g03-l01': () => import('./source-lesson-data/g03-l01.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l02': () => import('./source-lesson-data/g03-l02.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l03': () => import('./source-lesson-data/g03-l03.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l04': () => import('./source-lesson-data/g03-l04.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l05': () => import('./source-lesson-data/g03-l05.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l06': () => import('./source-lesson-data/g03-l06.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l08': () => import('./source-lesson-data/g03-l08.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g03-l09': () => import('./source-lesson-data/g03-l09.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l01': () => import('./source-lesson-data/g04-l01.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l02': () => import('./source-lesson-data/g04-l02.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l03': () => import('./source-lesson-data/g04-l03.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l04': () => import('./source-lesson-data/g04-l04.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l05': () => import('./source-lesson-data/g04-l05.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l06': () => import('./source-lesson-data/g04-l06.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l07': () => import('./source-lesson-data/g04-l07.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l08': () => import('./source-lesson-data/g04-l08.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l09': () => import('./source-lesson-data/g04-l09.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l10': () => import('./source-lesson-data/g04-l10.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l11': () => import('./source-lesson-data/g04-l11.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g04-l12': () => import('./source-lesson-data/g04-l12.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l01': () => import('./source-lesson-data/g05-l01.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l02': () => import('./source-lesson-data/g05-l02.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l03': () => import('./source-lesson-data/g05-l03.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l04': () => import('./source-lesson-data/g05-l04.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l05': () => import('./source-lesson-data/g05-l05.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l06': () => import('./source-lesson-data/g05-l06.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l07': () => import('./source-lesson-data/g05-l07.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l08': () => import('./source-lesson-data/g05-l08.json').then(({default: data}) => data as unknown as SourceLessonData),
  'g05-l13': () => import('./source-lesson-data/g05-l13.json').then(({default: data}) => data as unknown as SourceLessonData),
});

export async function loadSourceLessonData(key: string): Promise<SourceLessonData | undefined> {
  const lessonId = sourceLessonIdForKey(key);
  const loader = lessonId ? sourceLessonDataLoaders[lessonId] : undefined;
  return loader ? assertSourceLessonDataFor(await loader(), key) : undefined;
}
