import {P020_AUDIO_ASSETS} from './generated/alg-l06-p020-audio-plan-v1';
export {P020_AUDIO_ASSETS, P020_SA_ASSET} from './generated/alg-l06-p020-audio-plan-v1';
export type P020AudioId = typeof P020_AUDIO_ASSETS[number]['id'];

export const P020_AUDIO_DISPOSITION = Object.freeze({
  fps: 12, quizStopFrame: 58, mainResumeFrame: 59,
  mainDomain: 'sprite-162', feedbackDomains: 7,
  feedbackStreamsConcatenated: false, separateSaSpliced: false,
  localeStartsAudio: false, syntheticSilenceAdded: false,
  sprite94NegativeSeekSemanticsResolved: false,
  frameMapping: 'first-source-block-seek-modern-candidate',
  originalHostBindingObserved: false, originalRuntimeAccepted: false,
  listeningAccepted: false, audioAccepted: false,
});

/** Domain-local, one-indexed frame position. Each decoder remains independent;
 * the source quiz stop at 58 is owned by the stateful clock. This first-block
 * seek projection is a modern candidate, not an old Flash sync claim. */
export function p020AudioSlice(id: P020AudioId, framePosition: number) {
  const asset = P020_AUDIO_ASSETS.find(item => item.id === id);
  const audioEnd = asset
    ? asset.firstBlockFrame + (asset.decodedSamples - asset.initialSeekSamples) /
      asset.sampleRate * P020_AUDIO_DISPOSITION.fps
    : 0;
  if (!asset || !Number.isFinite(framePosition) || framePosition < 1 ||
      framePosition > Math.max(asset.lastVisualFrame, audioEnd))
    throw Error('P020_INVALID_DOMAIN_AUDIO_POSITION');
  const secondsFromFirst = (framePosition - asset.firstBlockFrame) /
    P020_AUDIO_DISPOSITION.fps;
  const firstDecodedSample = asset.initialSeekSamples +
    Math.max(0, secondsFromFirst) * asset.sampleRate;
  if (firstDecodedSample >= asset.decodedSamples) return null;
  return {asset, firstDecodedSample,
    delaySeconds: Math.max(0, -secondsFromFirst),
    durationSeconds: (asset.decodedSamples - firstDecodedSample) / asset.sampleRate};
}
