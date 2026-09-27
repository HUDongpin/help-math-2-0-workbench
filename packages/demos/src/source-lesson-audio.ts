import type {AnimationModule, AudioCue, AudioTrack, InteractiveAudioAsset} from './contract';
import {withSourceFeedback} from './source-feedback-adapter';
import {withSourceQuiz} from './source-quiz-adapter';
import recoveredAudio from './source-lesson-audio.generated.json';

interface RecoveredPageAudio {
  readonly cues: readonly AudioCue[];
  readonly tracks: readonly AudioTrack[];
  readonly spanishSourceHashes: readonly string[];
  readonly sharedMusicSourceHashes?: readonly string[];
  readonly interactive?: readonly (SourceQuestionAudioAsset | SourceFeedbackAudioAsset)[];
  readonly alignExistingCueFrames?: boolean;
}

export interface SourceQuestionAudioAsset extends InteractiveAudioAsset {
  readonly questionNumber: number;
  readonly option: string | null;
}

interface SourceFeedbackAudioAsset extends InteractiveAudioAsset {
  readonly coverageDisposition: 'interaction-only';
  readonly trigger: string;
}

const pages = recoveredAudio as Readonly<Record<string, RecoveredPageAudio>>;

export function sourceQuestionAudioAssets(key: string, questionNumber: number | null, language: 'en' | 'es') {
  return (pages[key]?.interactive ?? []).filter((asset): asset is SourceQuestionAudioAsset =>
    'questionNumber' in asset && asset.questionNumber === questionNumber && asset.language === language);
}

/** Add exact source audio without replacing authored interaction/cue rules. */
export function withSourceLessonAudio(module: AnimationModule): AnimationModule {
  const recovered = pages[module.key];
  if (!recovered) return withSourceFeedback(withSourceQuiz(module));
  const originalCues = module.audioCues.map((cue): AudioCue => {
    // Source intro music is language-neutral. Restrict reclassification to
    // explicitly reviewed hashes, preserving authored scenario/seed rules.
    const routedCue = cue.sha256 && recovered.sharedMusicSourceHashes?.includes(cue.sha256)
      ? {...cue, language: 'shared' as const} : cue;
    if (!recovered.alignExistingCueFrames) return routedCue;
    const source = recovered.cues.find(original => original.sha256 === cue.sha256);
    if (!source || source.frame === cue.frame) return routedCue;
    return {...routedCue, frame: source.frame, endFrame: cue.endFrame === undefined
      ? undefined : cue.endFrame + source.frame - cue.frame};
  });
  // Global_Only_One.as explicitly assigns these SA files to the Spanish host
  // action. Earlier candidates exposed some as shared, undetermined tracks.
  const originalTracks = (module.audioTracks ?? []).map((track): AudioTrack =>
    recovered.spanishSourceHashes.includes(track.sha256)
      ? {...track, language: 'es', label: 'Audio en español', visibleWhen: ['es'],
          timelineBehavior: 'pause-while-playing'}
      : track);
  const cues = recovered.cues.filter((cue) => !originalCues.some((existing) =>
    (existing.language === cue.language || existing.language === 'shared') &&
    (existing.frameDomain ?? 'root') === (cue.frameDomain ?? 'root') &&
    (!existing.scenario || existing.scenario === cue.scenario)));
  const tracks = recovered.tracks.filter((track) => !originalTracks.some((existing) =>
    existing.sha256 === track.sha256 || existing.visibleWhen.some((language) =>
      track.visibleWhen.includes(language) && (!existing.frameDomains ||
        existing.frameDomains.some((domain) => track.frameDomains?.includes(domain))))));
  return withSourceFeedback(withSourceQuiz(Object.freeze({...module, audioCues: [...originalCues, ...cues],
    audioTracks: [...originalTracks, ...tracks],
    ...(recovered.interactive?.length ? {
      interactiveAudioAssets: [...(module.interactiveAudioAssets ?? []), ...recovered.interactive],
      lessonHost: {...(module.lessonHost ?? {legacyOperations: 'blocked', auditStorage: 'memory-only', storesPersonalData: false} as const),
        capabilities: [...new Set([...(module.lessonHost?.capabilities ?? []), 'audio' as const])]},
    } : {}),
  })));
}
