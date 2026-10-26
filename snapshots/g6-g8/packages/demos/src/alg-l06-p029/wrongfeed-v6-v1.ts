import {P029_SOURCE, type P029State}
  from './quiz-reducer-v1';

/**
 * Source-only successor projection; not installed in the product reducer.
 * The write and all three popup reads execute inside the pinned SWF-v6 page.
 * Case-insensitive property lookup is the SWF-v6 rule, while exact observed
 * original-runtime presentation remains a separate evidence gate.
 */
export const P029_WRONGFEED_V6_SOURCE = Object.freeze({
  swfSha256: 'cbfd012d0aff11544a252c9e2852dff30d408c634aa2a805eb0837933c3370d4',
  swfVersion: 6,
  writer: Object.freeze({
    name: '_global.Wrongfeed',
    path: 'source-export/scripts/DefineButton2_27/BUTTONCONDACTION on(release).as',
    sha256: '80053294a1776a3622920e2505194ba0b08e438c82a31bdc5bbc01fa3d003484',
  }),
  readerName: '_global.WrongFeed',
  popupByWrongBranch: Object.freeze({
    1: Object.freeze({parentSpriteId: 52, popupSpriteId: 51, visibleStart: 14, visibleEnd: 20,
      path: 'source-export/scripts/DefineSprite_51/frame_1/DoAction.as',
      sha256: '339da0ae92e066910d2af19a170d12305f2780609209769be00e48aa35d91bbc'}),
    2: Object.freeze({parentSpriteId: 98, popupSpriteId: 89, visibleStart: 16, visibleEnd: 22,
      path: 'source-export/scripts/DefineSprite_89/frame_1/DoAction.as',
      sha256: '339da0ae92e066910d2af19a170d12305f2780609209769be00e48aa35d91bbc'}),
    3: Object.freeze({parentSpriteId: 67, popupSpriteId: 63, visibleStart: 15, visibleEnd: 21,
      path: 'source-export/scripts/DefineSprite_63/frame_1/DoAction.as',
      sha256: '339da0ae92e066910d2af19a170d12305f2780609209769be00e48aa35d91bbc'}),
  }),
} as const);

/** Returns text only while the actual nested popup is in its authored visible span. */
export function p029WrongDisplayTextV6(state: P029State) {
  if (P029_SOURCE.swfSha256 !== P029_WRONGFEED_V6_SOURCE.swfSha256 ||
      P029_SOURCE.wrongWriteName !== P029_WRONGFEED_V6_SOURCE.writer.name ||
      P029_SOURCE.wrongPopupReadName !== P029_WRONGFEED_V6_SOURCE.readerName) return null;
  const feedback = state.feedback;
  if (!feedback || feedback.kind !== 'wrong' ||
      (state.phase !== 'feedback-playing' && state.phase !== 'feedback-held')) return null;
  const popup = P029_WRONGFEED_V6_SOURCE.popupByWrongBranch[
    feedback.branchIndex as keyof typeof P029_WRONGFEED_V6_SOURCE.popupByWrongBranch];
  if (!popup || feedback.spec.characterId !== popup.parentSpriteId ||
      feedback.frame < popup.visibleStart || feedback.frame > popup.visibleEnd) return null;
  const expected = state.quizTryCount === 1 ? P029_SOURCE.firstWrongText :
    state.quizTryCount >= 2 ? P029_SOURCE.laterWrongText : null;
  if (!expected || state.wrongfeedWritten !== expected) return null;
  return {
    text: expected,
    basis: 'SWF-v6 case-insensitive global-property lookup; source write/read and popup visible span',
    parityAccepted: false,
  } as const;
}
