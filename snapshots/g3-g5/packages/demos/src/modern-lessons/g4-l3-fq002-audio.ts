import {FQ002_AUDIO_ASSETS} from './generated/g4-l3-fq002-audio';
import type {AnimationLanguage} from '../contract';

/** Source question id, never the random sequence's display number. */
export function fq002AudioAsset(questionId: number, language: AnimationLanguage, option: 'A' | 'B' | 'C' | 'D' | null = null) {
  if (!Number.isInteger(questionId) || questionId < 1 || questionId > 25) return undefined;
  return FQ002_AUDIO_ASSETS.find(asset => asset.questionNumber === questionId
    && asset.language === language && asset.option === option
    && asset.kind === (option === null ? 'question' : 'answer'));
}

/** A declared host request, still subject to the host's audio publication gate. */
export function fq002AudioRequest(input: {
  questionId: number; language: AnimationLanguage; option?: 'A' | 'B' | 'C' | 'D' | null;
  activeId?: string | null; pausedId?: string | null; enabled: boolean; ready: boolean; paused: boolean;
}) {
  if (!input.enabled || !input.ready || input.paused) return undefined;
  const asset = fq002AudioAsset(input.questionId, input.language, input.option ?? null);
  if (!asset) return undefined;
  if (input.pausedId === asset.id) return {type: 'resume-audio' as const, cueId: asset.id};
  if (input.activeId === asset.id) return {type: 'pause-audio' as const, cueId: asset.id};
  return {type: 'play-audio' as const, cueId: asset.id};
}

/** Invalidate old narration on question, language, phase, replay, or page exit. */
export function fq002AudioStopRequest(activeId: string | null | undefined,
  owner?: {questionId: number; language: AnimationLanguage}) {
  if (!activeId || !FQ002_AUDIO_ASSETS.some(asset => asset.id === activeId)) return undefined;
  if (owner && !FQ002_AUDIO_ASSETS.some(asset => asset.id === activeId
    && asset.questionNumber === owner.questionId && asset.language === owner.language)) return undefined;
  return {type: 'stop-audio' as const, cueId: activeId};
}
