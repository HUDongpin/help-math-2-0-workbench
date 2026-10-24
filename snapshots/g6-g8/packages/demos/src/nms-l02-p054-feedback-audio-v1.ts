/** Source sprite 731 uses these feedback children in both level frames. */
export const P054_FEEDBACK_AUDIO = {
  correct: {spriteId: 194, bytes: 10660,
    sha256: 'd34cad2db2f6a6be02a1efffd46ffc169a1b65730cf6f503cbae28fa7aab9fc4'},
  wrong: {spriteId: 208, bytes: 11960,
    sha256: '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77'},
} as const;

export type P054FeedbackKind = keyof typeof P054_FEEDBACK_AUDIO;

export function p054FeedbackAudioUrl(kind: P054FeedbackKind): string {
  if (!Object.hasOwn(P054_FEEDBACK_AUDIO, kind)) throw new Error('Invalid P054 feedback audio');
  const source = P054_FEEDBACK_AUDIO[kind];
  return `/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/${kind}?sha256=${source.sha256}`;
}
