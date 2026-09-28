import {G4_L3_FQ_AUDIO, type FinalQuizAudioPart} from '../g4-l3-fq-audio.generated';
export type {FinalQuizAudioPart};

/** The source uses its question frame minus one, never the random sequence number. */
export function getFinalQuizReadingAsset(
  questionId: number,
  part: FinalQuizAudioPart,
  language: 'en' | 'es',
) {
  if (!Number.isInteger(questionId) || questionId < 1 || questionId > 25) return null;
  return G4_L3_FQ_AUDIO.find(asset => asset.questionId === questionId
    && asset.part === part && asset.language === language) ?? null;
}
