'use client';

import React, {useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {
  LessonTextActivityRequest,
  LessonTextActivitySnapshot,
  LessonTextBinding,
  LessonTextPresentationCapability,
  TextPresentationSnapshot,
} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {
  getCourseG05L02Ti011FrameState,
  normalizeCourseG05L02Ti011Frame,
} from '../modules/course-g05-l02-ti-011';
import {COURSE_G05_L02_TI_011_SOURCE} from '../timelines/course-g05-l02-ti-011';

const ID = 'course-g05-l02-ti-011',
  DOMAIN = 'sprite-228',
  SHA = COURSE_G05_L02_TI_011_SOURCE.swfSha256;
const sourceIds = (character: number, count = 1) =>
  Array.from({length: count}, (_, i) => `character-${character}/run-${i}`);
// Shape11 contains the root title as outlines, outside the DefineText inventory.
// Its wording was read from the preserved source paths; it is not decoded Unicode.
export const G5_L2_TI011_SOURCE_TITLE = Object.freeze({
  text: 'Percents: Try It!',
  characterId: 11,
  sourceTagSha256: 'e26c0e6305cb3cee7625b68997b71eef90a09a6fa943d316d0bf79d441bda5fa',
  instanceId: 'root/depth-1/generation-1',
  rootFrame: 6,
  copyAuthority: 'source-outline-visual-transcription',
});
export const G5_L2_TI011_WORDS = Object.freeze([
  {text: 'What', frame: 64},
  {text: 'is', frame: 66},
  {text: '110%', frame: 77},
  {text: 'of', frame: 92},
  {text: '70?', frame: 96},
]);
export const G5_L2_TI011_CHOICES = Object.freeze([
  {letter: 'A', value: '7.7', letterCharacter: 15, valueCharacter: 16, buttonCharacter: 27},
  {letter: 'B', value: '77', letterCharacter: 24, valueCharacter: 25, buttonCharacter: 29},
  {letter: 'C', value: '1.77', letterCharacter: 18, valueCharacter: 19, buttonCharacter: 30},
  {letter: 'D', value: '60', letterCharacter: 21, valueCharacter: 22, buttonCharacter: 28},
] as const);
export type Ti011Choice = (typeof G5_L2_TI011_CHOICES)[number]['letter'];
export const G5_L2_TI011_FEEDBACK = Object.freeze({
  wrong: Object.freeze([
    {
      variant: 1,
      sprite: 98,
      text: "That's incorrect!",
      characters: [66],
      firstVisible: 4,
      hidden: 27,
      end: 28,
      popupFirst: 14,
    },
    {
      variant: 2,
      sprite: 133,
      text: 'Incorrect!',
      characters: [126, 127],
      firstVisible: 3,
      hidden: 30,
      end: 31,
      popupFirst: 14,
    },
    {
      variant: 3,
      sprite: 109,
      text: 'Try Again!',
      characters: [105],
      firstVisible: 7,
      hidden: 26,
      end: 28,
      popupFirst: 17,
    },
  ]),
  correct: Object.freeze([
    {
      variant: 1,
      sprite: 198,
      text: 'YOU GOT IT!',
      characters: [191, 192],
      firstVisible: 13,
      hidden: 27,
      end: 27,
    },
    {
      variant: 2,
      sprite: 214,
      text: 'Correct!',
      characters: [209, 210],
      firstVisible: 12,
      hidden: 26,
      end: 28,
    },
    {
      variant: 3,
      sprite: 145,
      text: 'Excellent!',
      characters: [142, 143],
      firstVisible: 5,
      hidden: 26,
      end: 27,
    },
    {
      variant: 4,
      sprite: 226,
      text: 'Great Job!',
      characters: [220, 221],
      firstVisible: 3,
      hidden: 25,
      end: 25,
    },
  ]),
});
const AUDIO = Object.freeze([
  {
    id: 'wrong-1',
    sha256: 'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1',
    firstFrame: 2,
    lastFrame: 28,
  },
  {
    id: 'wrong-2',
    sha256: 'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1',
    firstFrame: 2,
    lastFrame: 31,
  },
  {
    id: 'wrong-3',
    sha256: 'd7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0',
    firstFrame: 2,
    lastFrame: 28,
  },
  {
    id: 'correct-1',
    sha256: '1b7f35c62c832068bd2e0e54246c591df18f08e9ff8c77527e6f3ba03650246f',
    firstFrame: 3,
    lastFrame: 27,
  },
  {
    id: 'correct-2',
    sha256: '3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7',
    firstFrame: 2,
    lastFrame: 28,
  },
  {
    id: 'correct-3',
    sha256: '18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec',
    firstFrame: 2,
    lastFrame: 27,
  },
  {
    id: 'correct-4',
    sha256: 'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8',
    firstFrame: 1,
    lastFrame: 13,
  },
]);
const audioFor = (id: string) => {
  const a = AUDIO.find((a) => a.id === id)!;
  return Object.freeze({
    ...a,
    source: `/lesson-typography-v1/audio/${ID}/${id}.${id === 'correct-4' ? 'wav' : 'mp3'}`,
    language: 'shared' as const,
    spokenLanguage: 'undetermined' as const,
  });
};
/** The popup Close button really resumes at23 before or after the source stop22.
 * Each handover is bounded to the exact currently running authored activity. */
export const G5_L2_TI011_ACTIVITIES = Object.freeze([
  ...G5_L2_TI011_FEEDBACK.wrong.flatMap((f) => [
    {
      id: `wrong-${f.variant}-intro`,
      frameDomain: `sprite-${f.sprite}`,
      startFrame: 2,
      endFrame: 22,
      fps: 12,
      parentFrames: [127],
      audio: audioFor(`wrong-${f.variant}`),
    },
    {
      id: `wrong-${f.variant}-outro`,
      frameDomain: `sprite-${f.sprite}`,
      startFrame: 23,
      endFrame: f.end,
      fps: 12,
      parentFrames: [127],
      audio: audioFor(`wrong-${f.variant}`),
      entryFromActivity: {id: `wrong-${f.variant}-intro`, firstFrame: f.popupFirst, lastFrame: 22},
    },
  ]),
  ...G5_L2_TI011_FEEDBACK.correct.map((f) => ({
    id: `correct-${f.variant}`,
    frameDomain: `sprite-${f.sprite}`,
    startFrame: 2,
    endFrame: f.end,
    fps: 12,
    parentFrames: [127],
    audio: audioFor(`correct-${f.variant}`),
  })),
]);
export const G5_L2_TI011_FRAME_TRANSITIONS = Object.freeze([
  {fromFrame: 127, toFrame: 128, stopFrame: 240},
]);
export const G5_L2_TI011_DYNAMIC_COPY = Object.freeze({
  first: '110% is greater than 100%, so the answer will be greater than 70. Try again.',
  second: '110% is greater than 100%, so the answer will be greater than 70.',
});
export const G5_L2_TI011_GLYPH = Object.freeze({
  sourceTextId: 'character-54/run-0',
  fontCharacter: 53,
  glyphIndex: 0,
  sourceCode: 61620,
  fontTagSha256: '890f93b9792436d536010c700639de3d604aefd4d1d96e880c1541e75797cca1',
  value: '×',
  unicode: 'U+00D7',
});
export const G5_L2_TI011_KEY_TERMS = Object.freeze({
  Decimal: {entryId: 'en-0134-4aa1672f260e', buttonCharacter: 56},
  'Place (noun)': {entryId: 'en-0482-61a5797fce79', buttonCharacter: 57},
  Percent: {entryId: 'en-0465-44ed768576d5', buttonCharacter: 58},
  'Whole numbers': {entryId: 'en-0749-f97ce9cc1311', buttonCharacter: 59},
});

export interface Ti011Session {
  readonly seed: number;
  readonly replay: number;
  readonly quizTryCount: number;
  readonly help: boolean;
  readonly feedback: Readonly<{
    kind: 'wrong' | 'correct';
    variant: number;
    selected: Ti011Choice;
    phase: 'intro' | 'waiting' | 'outro' | 'correct';
    activityRevisionFloor: number;
  }> | null;
  readonly pendingFromFrame: number | null;
  readonly outcome: 'correct' | 'two-wrong-continuation' | null;
}
export type Ti011Action =
  | {type: 'answer'; choice: Ti011Choice; activityRevisionFloor?: number}
  | {type: 'help' | 'close-help' | 'activity-complete'}
  | {type: 'close-feedback'; activity: LessonTextActivitySnapshot};
type ActivityRequest = LessonTextActivityRequest & {
  readonly fromActivity?: {readonly id: string; readonly revision: number};
};
export function createTi011Session(seed = 0, replay = 0): Ti011Session {
  return {
    seed: Number.isSafeInteger(seed) ? seed >>> 0 : 0,
    replay: Number.isSafeInteger(replay) ? replay : 0,
    quizTryCount: 0,
    help: false,
    feedback: null,
    pendingFromFrame: null,
    outcome: null,
  };
}
export function syncTi011Session(s: Ti011Session, c: RuntimeContext): Ti011Session {
  const identity = createTi011Session(c.seed, c.replay ?? 0);
  return s.seed !== identity.seed || s.replay !== identity.replay
    ? identity
    : s.pendingFromFrame !== null && s.pendingFromFrame !== c.frame
      ? {...s, pendingFromFrame: null}
      : s;
}
export function ti011ActivityId(s: Ti011Session) {
  const f = s.feedback;
  return !f
    ? null
    : f.kind === 'correct'
      ? `correct-${f.variant}`
      : `wrong-${f.variant}-${f.phase === 'outro' ? 'outro' : 'intro'}`;
}
export function ti011ActivityState(s: Ti011Session, a?: LessonTextActivitySnapshot) {
  const f = s.feedback,
    definition = G5_L2_TI011_ACTIVITIES.find((d) => d.id === ti011ActivityId(s)),
    feedback = f ? G5_L2_TI011_FEEDBACK[f.kind].find((d) => d.variant === f.variant) : null;
  const matched = Boolean(
    f &&
      a &&
      definition &&
      a.id === definition.id &&
      a.frameDomain === definition.frameDomain &&
      a.revision > f.activityRevisionFloor,
  );
  return {
    matched,
    definition,
    feedback,
    complete: Boolean(matched && a?.status === 'completed' && a.frame === definition?.endFrame),
    titleVisible: Boolean(
      matched && a && feedback && a.frame >= feedback.firstVisible && a.frame < feedback.hidden,
    ),
    popupVisible: Boolean(
      matched &&
        a &&
        f?.kind === 'wrong' &&
        f.phase !== 'outro' &&
        feedback &&
        'popupFirst' in feedback &&
        typeof feedback.popupFirst === 'number' &&
        a.frame >= feedback.popupFirst &&
        a.frame <= 22,
    ),
  };
}
export function reduceTi011Session(s: Ti011Session, frame: number, action: Ti011Action) {
  const no = (reason: string) => ({
    allowed: false as const,
    reason,
    nextState: s,
    frameRequest: null,
    activityRequest: null,
  });
  const yes = (
    nextState: Ti011Session,
    frameRequest: (typeof G5_L2_TI011_FRAME_TRANSITIONS)[number] | null = null,
    activityRequest: ActivityRequest | null = null,
  ) => ({allowed: true as const, reason: null, nextState, frameRequest, activityRequest});
  if (frame !== 127 || s.pendingFromFrame === 127) return no('quiz-not-available');
  if (action.type === 'help')
    return s.feedback || s.help ? no('help-not-available') : yes({...s, help: true});
  if (action.type === 'close-help') return s.help ? yes({...s, help: false}) : no('help-not-open');
  if (s.help) return no('help-open');
  if (action.type === 'answer') {
    if (s.feedback || !G5_L2_TI011_CHOICES.some((c) => c.letter === action.choice))
      return no('answer-not-available');
    const kind = action.choice === 'B' ? 'correct' : 'wrong',
      variants = G5_L2_TI011_FEEDBACK[kind],
      selected = variants[(s.seed + s.quizTryCount) % variants.length]!;
    const nextState: Ti011Session = {
      ...s,
      quizTryCount: kind === 'wrong' ? s.quizTryCount + 1 : s.quizTryCount,
      feedback: {
        kind,
        variant: selected.variant,
        selected: action.choice,
        phase: kind === 'wrong' ? 'intro' : 'correct',
        activityRevisionFloor: action.activityRevisionFloor ?? -1,
      },
    };
    return yes(nextState, null, {id: ti011ActivityId(nextState)!, parentFrame: 127});
  }
  if (!s.feedback) return no('feedback-not-open');
  if (action.type === 'close-feedback') {
    if (!ti011ActivityState(s, action.activity).popupVisible) return no('source-close-not-visible');
    const nextState: Ti011Session = {
      ...s,
      feedback: {...s.feedback, phase: 'outro', activityRevisionFloor: action.activity.revision},
    };
    return yes(nextState, null, {
      id: ti011ActivityId(nextState)!,
      parentFrame: 127,
      fromActivity: {id: action.activity.id, revision: action.activity.revision},
    });
  }
  if (action.type === 'activity-complete') {
    if (s.feedback.phase === 'intro')
      return yes({...s, feedback: {...s.feedback, phase: 'waiting'}});
    if (s.feedback.phase === 'waiting') return no('source-popup-awaits-close');
    if (s.feedback.kind === 'wrong' && s.quizTryCount === 1) return yes({...s, feedback: null});
    return yes(
      {
        ...s,
        feedback: null,
        quizTryCount: s.feedback.kind === 'wrong' ? 0 : s.quizTryCount,
        pendingFromFrame: 127,
        outcome: s.feedback.kind === 'correct' ? 'correct' : 'two-wrong-continuation',
      },
      G5_L2_TI011_FRAME_TRANSITIONS[0],
    );
  }
  return no('unknown-action');
}

const helpBlocks = [
  {id: 'help-rule', characters: [42], counts: [5], text: 'To find a percent of a whole number.'},
  {id: 'help-step1', characters: [43], counts: [3], text: 'Express the percent as a decimal.'},
  {
    id: 'help-step2',
    characters: [44],
    counts: [3],
    text: 'Multiply the whole number by the decimal.',
  },
  {
    id: 'help-step3',
    characters: [45],
    counts: [4],
    text: 'Count the total number of decimal places in the problem, and show the same number of decimal places in the answer.',
  },
  {id: 'help-example', characters: [41, 46], counts: [1, 1], text: 'Example: 120% of 30'},
  {id: 'help-conversion', characters: [47], counts: [3], text: '120% = 1.20'},
  {id: 'help-whole', characters: [48], counts: [1], text: '30'},
  {id: 'help-decimal', characters: [49], counts: [3], text: '1.2'},
  {id: 'help-times', characters: [54], counts: [1], text: '×'},
  {id: 'help-partial60', characters: [50], counts: [1], text: '60'},
  {id: 'help-partial30', characters: [51], counts: [1], text: '30'},
  // Source character52 writes an invalid equality. Keep its raw source binding,
  // but describe the authored decimal-placement process as a process, not equality.
  {
    id: 'help-working-digits',
    characters: [52],
    counts: [1],
    text: 'Working digits before decimal placement: 360.',
  },
  {
    id: 'help-product',
    characters: [52],
    counts: [3],
    text: 'Product digits: 360 → 36.0 (one decimal place).',
  },
  {
    id: 'help-decimal-placement',
    characters: [45, 49, 52],
    counts: [4, 3, 3],
    text: 'Place the decimal point one digit from the right.',
  },

  {
    id: 'help-place-count',
    characters: [48, 49, 52],
    counts: [1, 3, 3],
    text: 'Zero decimal places + one decimal place = one decimal place.',
  },
  {
    id: 'help-final-product',
    characters: [48, 54, 49, 52],
    counts: [1, 1, 3, 3],
    text: '30 × 1.2 = 36.0',
  },
];
const blocks = [
  {
    id: 'root-title',
    sourceTextIds: [],
    sourceShapeIds: [G5_L2_TI011_SOURCE_TITLE.characterId],
    role: 'title',
    readingOrder: 0,
    instance: {
      id: G5_L2_TI011_SOURCE_TITLE.instanceId,
      path: [{timelineId: 'root', depth: 1, generation: 1, characterId: 11}],
    },
  },
  {id: 'question', sourceTextIds: sourceIds(13), role: 'question', readingOrder: 1},
  ...G5_L2_TI011_CHOICES.map((c, i) => ({
    id: `choice-${c.letter}`,
    sourceTextIds: [
      ...sourceIds(c.letterCharacter),
      ...sourceIds(c.valueCharacter),
      ...(c.letter === 'B' ? sourceIds(227) : []),
    ],
    role: 'answer',
    readingOrder: 10 + i,
  })),
  ...helpBlocks.map((b, i) => ({
    id: b.id,
    sourceTextIds: b.characters.flatMap((c, j) => sourceIds(c, b.counts[j])),
    role: i === 0 || i === 4 ? 'heading' : 'body',
    readingOrder: 30 + i,
  })),
  ...(['wrong', 'correct'] as const).flatMap((kind) =>
    G5_L2_TI011_FEEDBACK[kind].map((f, index) => ({
      id: `feedback-${kind}-${f.variant}`,
      sourceTextIds: f.characters.flatMap((c) => sourceIds(c)),
      role: 'feedback',
      readingOrder: (kind === 'wrong' ? 60 : 63) + index,
    })),
  ),
  {id: 'dynamic-feedback', sourceTextIds: ['character-82'], role: 'feedback', readingOrder: 70},
];
export const G5_L2_TI011_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: 'g05-l02-placement-052-modern-text-v2',
  placementId: 'g05-l02-placement-052',
  animationId: ID,
  sourceSwfSha256: SHA,
  template: 'exercise',
  blocks: blocks.map((b) => ({
    ...b,
    role: b.role as LessonTextBinding['blocks'][number]['role'],
    language: 'en' as const,
    valueSource: 'maintained-page-state' as const,
  })),
});
export function getTi011TeachingState(rawFrame: number) {
  const frame = normalizeCourseG05L02Ti011Frame(rawFrame, DOMAIN);
  return {
    frame,
    question: G5_L2_TI011_WORDS.filter((w) => frame >= w.frame)
      .map((w) => w.text)
      .join(' '),
    choices: frame >= 122,
    allChoices: frame >= 122 && frame < 141,
    quiz: frame === 127,
    answerEmphasis: frame >= 226 && frame <= 232,
  };
}
export function getG5L2Ti011TextSnapshot(
  state: SourceStaticCanvasFrameState,
  context: RuntimeContext,
  session = createTi011Session(context.seed, context.replay ?? 0),
  activity?: LessonTextActivitySnapshot,
): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== SHA)
    blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN)
    blockers.push('unsupported-domain');
  if (state.scenario !== 'source-static-frame' || context.scenario !== 'source-static-frame')
    blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en')
    blockers.push('source-English-view-required');
  if (
    state.frame !== normalizeCourseG05L02Ti011Frame(context.frame, DOMAIN) ||
    state.rootFrame !== 6 ||
    (context.rootFrame !== undefined && context.rootFrame !== 6) ||
    state.seed !== (Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0)
  )
    blockers.push('state-identity-mismatch');
  const teaching = getTi011TeachingState(state.frame),
    s = syncTi011Session(session, context),
    feedback = ti011ActivityState(s, activity);
  return {
    schemaVersion: 1,
    animationId: ID,
    bindingVersion: G5_L2_TI011_TEXT_BINDING.version,
    sourceSwfSha256: SHA,
    status: blockers.length ? 'blocked' : 'ready',
    blockers,
    identity: {
      frame: state.frame,
      frameDomain: state.frameDomain,
      rootFrame: 6,
      scenario: state.scenario,
      language: state.language,
      seed: state.seed,
      replay: context.replay ?? 0,
    },
    suppressedInstances: [],
    blocks: blockers.length
      ? []
      : G5_L2_TI011_TEXT_BINDING.blocks.map((b) => {
          let text = '',
            visible = false;
          if (b.id === 'root-title') {
            text = G5_L2_TI011_SOURCE_TITLE.text;
            visible = true;
          } else if (b.id === 'question') {
            text = teaching.question;
            visible = Boolean(text);
          } else if (b.id.startsWith('choice-')) {
            const c = G5_L2_TI011_CHOICES.find((c) => b.id === `choice-${c.letter}`)!;
            text = `${c.letter}. ${c.value}`;
            visible = teaching.choices && (teaching.allChoices || c.letter === 'B');
          } else if (b.id.startsWith('help-')) {
            text = helpBlocks.find((h) => h.id === b.id)!.text;
            visible = s.help && teaching.quiz;
          } else if (b.id === 'dynamic-feedback') {
            text =
              s.quizTryCount === 1
                ? G5_L2_TI011_DYNAMIC_COPY.first
                : G5_L2_TI011_DYNAMIC_COPY.second;
            visible = feedback.popupVisible;
          } else if (s.feedback && b.id === `feedback-${s.feedback.kind}-${s.feedback.variant}`) {
            text = feedback.feedback?.text ?? '';
            visible = feedback.titleVisible;
          }
          return {...b, text, visible};
        }),
  };
}

const CSS = `
.g5-ti011 .g5-ti011__title{font-size:clamp(1.75rem,calc(1.4rem + 1.2cqi),2.25rem);overflow-wrap:normal;hyphens:none}.g5-ti011 .g5-ti011__question h3{font-size:1.8rem}
.g5-ti011{box-sizing:border-box;container:ti011 / inline-size;inline-size:100%;padding:clamp(8px,2vw,20px);background:#fffdf8;color:#17273c;font-family:var(--lesson-text-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6}.g5-ti011 *{box-sizing:border-box}.g5-ti011 h2,.g5-ti011 h3{font-family:var(--lesson-text-font-heading,"Fredoka",system-ui,sans-serif);font-weight:600;line-height:1.3;margin:0 0 1rem;overflow-wrap:anywhere}.g5-ti011 h2{font-size:1.8rem}.g5-ti011 h3{font-size:1.4rem}.g5-ti011 p{margin:.7em 0;overflow-wrap:anywhere}
.g5-ti011__question{padding:clamp(12px,3cqi,24px);border:1px solid #c7d8ef;border-radius:1rem;background:#f0f6ff;min-block-size:5rem}.g5-ti011__choices{padding:0;margin:1rem 0;list-style:none;display:grid;gap:.85rem;grid-template-columns:1fr}.g5-ti011__choice{display:flex;align-items:center;gap:1rem;width:100%;padding:.8rem 1rem;min-block-size:3rem;border:1px solid #9fb7d5;border-radius:.8rem;background:#fff;color:inherit;font:inherit;text-align:start}.g5-ti011__choice b{min-inline-size:2em;min-block-size:2em;display:grid;place-items:center;border-radius:50%;background:#e6eefb}.g5-ti011__choice span{font-size:1.55rem;font-weight:700;font-variant-numeric:tabular-nums}.g5-ti011__choice[data-answer-emphasis=true]{outline:3px solid #bb790b;background:#fff6d5}.g5-ti011 button:disabled{opacity:.65}.g5-ti011 button{cursor:pointer}.g5-ti011 button:focus-visible{outline:3px solid #174ea6;outline-offset:3px}
.g5-ti011__button{background:#174ea6;color:#fff;border:1px solid #174ea6;border-radius:.7rem;min-block-size:2.75rem;padding:.6rem 1rem;font:inherit;line-height:1.4}.g5-ti011__feedback{border:2px solid #b05239;border-radius:1rem;background:#fff8f5;margin-block:1rem;padding:clamp(12px,3cqi,24px)}.g5-ti011__feedback[data-kind=correct]{border-color:#227448;background:#eff8f2}.g5-ti011__dynamic{border-block-start:1px solid #d5b0a7;margin-block-start:1rem;padding-block-start:1rem}
.g5-ti011__dialog{position:relative;inset:auto;inline-size:100%;max-inline-size:100%;max-block-size:none;margin:1rem 0;padding:clamp(12px,3cqi,24px);border:1px solid #9fb7d5;border-radius:1rem;color:#17273c;background:#fffdf8;font:inherit;overflow:visible}.g5-ti011__dialog header{display:flex;justify-content:flex-end;margin-block-end:1rem}.g5-ti011__dialog ol{padding-inline-start:1.6em}.g5-ti011__dialog li+li{margin-block-start:.65em}
.g5-ti011__calculation{border:1px solid #d7dfed;border-radius:.8rem;padding:clamp(10px,3cqi,20px);background:#fff}.g5-ti011__multiply{display:grid;grid-template-columns:1.3ch 3.5ch;width:max-content;max-width:100%;margin:1rem auto;font-size:1.6rem;line-height:1.35;letter-spacing:.04em;font-variant-numeric:tabular-nums;text-align:end}.g5-ti011__multiply .wide{grid-column:1/-1}.g5-ti011__multiply .rule{border-block-end:2px solid #17273c;padding-block-end:.15em}.g5-ti011__multiply .shift{padding-inline-end:1ch}.g5-ti011__result{text-align:center;font-size:1.45rem;font-weight:700}.g5-ti011__term{color:#174ea6;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.g5-ti011 button.g5-ti011__term{font:inherit;line-height:inherit;min-block-size:44px;max-inline-size:100%;border:0;padding:0 .05em;background:transparent;text-align:inherit;overflow-wrap:anywhere}
@container ti011 (min-width:36rem){.g5-ti011__choices{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
/** Source-backed Help view shared by the learner and focused semantic tests. */
export function G5L2Ti011HelpCalculation({text}: {text: (id: string) => string}) {
  const workingDigitsId = React.useId(), placementId = React.useId();
  return (
    <section className="g5-ti011__calculation">
      <h3 data-lesson-text-block="help-example">{text('help-example')}</h3>
      <p data-lesson-text-block="help-conversion">{text('help-conversion')}</p>
      <div
        className="g5-ti011__multiply"
        role="group"
        aria-labelledby={workingDigitsId}
        aria-describedby={placementId}
      >
        <span className="wide" data-lesson-text-block="help-whole">
          {text('help-whole')}
        </span>
        <span className="rule" data-lesson-text-block="help-times">
          {text('help-times')}
        </span>
        <span className="rule" data-lesson-text-block="help-decimal">
          {text('help-decimal')}
        </span>
        <span className="wide" data-lesson-text-block="help-partial60">
          {text('help-partial60')}
        </span>
        <span className="wide shift rule" data-lesson-text-block="help-partial30">
          {text('help-partial30')}
        </span>
      </div>
      <p id={workingDigitsId} data-lesson-text-block="help-working-digits">
        {text('help-working-digits')}
      </p>
      <p className="g5-ti011__result" data-lesson-text-block="help-product">
        {text('help-product')}
      </p>
      <p id={placementId} data-lesson-text-block="help-decimal-placement">
        {text('help-decimal-placement')}
      </p>
      <p data-lesson-text-block="help-place-count">{text('help-place-count')}</p>
      <p className="g5-ti011__result" data-lesson-text-block="help-final-product">
        {text('help-final-product')}
      </p>
    </section>
  );
}

export function G5L2Ti011ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN};
  const state =
    props.state && typeof props.state === 'object' && 'sourceSwfSha256' in props.state
      ? (props.state as SourceStaticCanvasFrameState)
      : getCourseG05L02Ti011FrameState(props.frame, context);
  const [stored, setStored] = useState(() => createTi011Session(props.seed, props.replay ?? 0)),
    session = syncTi011Session(stored, context),
    snapshot = getG5L2Ti011TextSnapshot(state, context, session, props.lessonActivity),
    teaching = getTi011TeachingState(state.frame),
    activity = ti011ActivityState(session, props.lessonActivity);
  const dialog = useRef<HTMLDialogElement>(null),
    helpTrigger = useRef<HTMLButtonElement>(null),
    feedbackRegion = useRef<HTMLDivElement>(null),
    closeFeedback = useRef<HTMLButtonElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    choices = useRef<Record<string, HTMLButtonElement | null>>({}),
    consumed = useRef<string | null>(null);
  const ready =
      snapshot.status === 'ready' && !props.entryStateSha256 && state.frameDomain === DOMAIN,
    pending = session.pendingFromFrame === 127,
    answerEnabled =
      ready &&
      teaching.quiz &&
      !session.help &&
      !session.feedback &&
      !pending &&
      Boolean(props.onLessonActivityRequest),
    helpEnabled = ready && teaching.quiz && !session.help && !session.feedback && !pending;
  const text = (id: string) => snapshot.blocks.find((b) => b.id === id && b.visible)?.text ?? '';
  function dispatch(action: Ti011Action) {
    if (!ready) return false;
    const result = reduceTi011Session(
      session,
      state.frame,
      action.type === 'answer'
        ? {...action, activityRevisionFloor: props.lessonActivity?.revision ?? -1}
        : action,
    );
    if (!result.allowed) return false;
    if (result.frameRequest && props.onLessonFrameRequest?.(result.frameRequest) !== true)
      return false;
    if (result.activityRequest && props.onLessonActivityRequest?.(result.activityRequest) !== true)
      return false;
    setStored(result.nextState);
    return true;
  }
  useEffect(() => {
    if (session.help && !dialog.current?.open) dialog.current?.show();
    return () => {
      if (session.help) helpTrigger.current?.focus();
    };
  }, [session.help]);
  useEffect(() => {
    if (!session.feedback) return;
    feedbackRegion.current?.focus();
    const selected = session.feedback.selected;
    return () => {
      if (choices.current[selected]?.isConnected && !choices.current[selected]?.disabled)
        choices.current[selected]?.focus();
      else heading.current?.focus();
    };
  }, [session.feedback?.selected, Boolean(session.feedback)]);
  useEffect(() => {
    if (activity.popupVisible) closeFeedback.current?.focus();
  }, [activity.popupVisible]);
  useEffect(() => {
    if (!ready || !activity.complete || !props.lessonActivity) return;
    const token = `${session.seed}:${session.replay}:${props.lessonActivity.id}:${props.lessonActivity.revision}`;
    if (consumed.current === token) return;
    if (dispatch({type: 'activity-complete'})) consumed.current = token;
  }, [ready, activity.complete, props.lessonActivity, session]);
  if (snapshot.status !== 'ready') return null;
  const term = (name: keyof typeof G5_L2_TI011_KEY_TERMS, label: string) => {
    const entry = G5_L2_TI011_KEY_TERMS[name];
    return (
      <button
        type="button"
        className="g5-ti011__term"
        data-keyterm-entry-id={entry.entryId}
        data-source-button={entry.buttonCharacter}
        disabled={!ready || !props.onLessonHostRequest}
        onClick={(event) => {
          const decision=props.onLessonHostRequest?.(
            {
              type: 'open-keyterm',
              entryId: entry.entryId,
              sourceAnimationId: ID,
              playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
            },
            {trigger: event.currentTarget},
          );
          event.currentTarget.dataset.lessonHostResult=decision?.status??'unhandled';
          if(decision?.status==='blocked')event.currentTarget.dataset.lessonHostReason=decision.reason;
        }}
      >
        {label}
      </button>
    );
  };
  const helpCopy: Record<string, React.ReactNode> = {
    'help-rule': (
      <>
        To find a {term('Percent', 'percent')} of a {term('Whole numbers', 'whole number')}.
      </>
    ),
    'help-step1': <>Express the percent as a {term('Decimal', 'decimal')}.</>,
    'help-step2': <>Multiply the whole number by the {term('Decimal', 'decimal')}.</>,
    'help-step3': (
      <>
        Count the total number of decimal {term('Place (noun)', 'places')} in the problem, and show
        the same number of decimal places in the answer.
      </>
    ),
  };
  return (
    <section
      className="g5-ti011"
      lang="en"
      data-modern-lesson="g5-l2-ti011"
      data-source-language-disposition="source-shared-untranslated-visual"
      data-flash-frame={state.frame}
      data-flash-frame-domain={DOMAIN}
      data-flash-root-frame={6}
      data-runtime-seed={state.seed}
      data-runtime-replay={props.replay ?? 0}
      data-runtime-scenario={context.scenario}
      data-quiz-try-count={session.quizTryCount}
      data-help-state={session.help ? 'open' : 'closed'}
      data-feedback-kind={session.feedback?.kind ?? 'none'}
      data-feedback-phase={session.feedback?.phase ?? 'none'}
      data-feedback-activity-frame={props.lessonActivity?.frame ?? ''}
      data-terminal-outcome={session.outcome ?? 'none'}
    >
      <style>{CSS}</style>
      <h2
        className="g5-ti011__title"
        data-lesson-text-block="root-title"
        data-source-shape-id={G5_L2_TI011_SOURCE_TITLE.characterId}
        data-source-shape-sha256={G5_L2_TI011_SOURCE_TITLE.sourceTagSha256}
        data-native-copy-authority={G5_L2_TI011_SOURCE_TITLE.copyAuthority}
      >
        {text('root-title')}
      </h2>
      {teaching.question && (
        <div className="g5-ti011__question">
          <h3 ref={heading} tabIndex={-1} data-lesson-text-block="question">
            {text('question')}
          </h3>
        </div>
      )}
      {teaching.choices && (
        <ol className="g5-ti011__choices" aria-label="Answer choices">
          {G5_L2_TI011_CHOICES.filter((c) => teaching.allChoices || c.letter === 'B').map((c) => (
            <li key={c.letter} data-lesson-text-block={`choice-${c.letter}`}>
              {teaching.quiz ? (
                <button
                  ref={(node) => {
                    choices.current[c.letter] = node;
                  }}
                  type="button"
                  className="g5-ti011__choice"
                  aria-label={`${c.letter}. ${c.value}`}
                  disabled={!answerEnabled}
                  onClick={() => dispatch({type: 'answer', choice: c.letter})}
                >
                  <b aria-hidden="true">{c.letter}</b>
                  <span aria-hidden="true">{c.value}</span>
                </button>
              ) : (
                <div
                  className="g5-ti011__choice"
                  data-answer-emphasis={c.letter === 'B' && teaching.answerEmphasis}
                >
                  <b>{c.letter}</b>
                  <span>{c.value}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {helpEnabled && (
        <button
          ref={helpTrigger}
          type="button"
          className="g5-ti011__button"
          onClick={() => dispatch({type: 'help'})}
        >
          Need More Help
        </button>
      )}
      {session.feedback && teaching.quiz && (
        <div
          ref={feedbackRegion}
          tabIndex={-1}
          className="g5-ti011__feedback"
          data-kind={session.feedback.kind}
          role="status"
          aria-live="polite"
        >
          {activity.titleVisible && (
            <strong
              data-lesson-text-block={`feedback-${session.feedback.kind}-${session.feedback.variant}`}
            >
              {activity.feedback?.text}
            </strong>
          )}
          {activity.popupVisible && (
            <div className="g5-ti011__dynamic">
              <p
                data-lesson-text-block="dynamic-feedback"
                data-source-dynamic-field="character-82"
                data-source-value="WrongFeed"
              >
                {text('dynamic-feedback')}
              </p>
              <button
                ref={closeFeedback}
                type="button"
                className="g5-ti011__button"
                onClick={() =>
                  props.lessonActivity &&
                  dispatch({type: 'close-feedback', activity: props.lessonActivity})
                }
              >
                Close feedback
              </button>
            </div>
          )}
        </div>
      )}
      {session.help && ready && (
        <dialog
          ref={dialog}
          className="g5-ti011__dialog"
          aria-label="Finding a percent of a whole number"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              dispatch({type: 'close-help'});
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            dispatch({type: 'close-help'});
          }}
        >
          <header>
            <button
              autoFocus
              type="button"
              className="g5-ti011__button"
              onClick={() => dispatch({type: 'close-help'})}
            >
              Close
            </button>
          </header>
          <h3 data-lesson-text-block="help-rule">{helpCopy['help-rule']}</h3>
          <ol>
            {[1, 2, 3].map((i) => (
              <li key={i} data-lesson-text-block={`help-step${i}`}>
                {helpCopy[`help-step${i}`]}
              </li>
            ))}
          </ol>
          <G5L2Ti011HelpCalculation text={text} />
        </dialog>
      )}
    </section>
  );
}
export const G5_L2_TI011_TEXT_PRESENTATION = Object.freeze({
  schemaVersion: 1,
  binding: G5_L2_TI011_TEXT_BINDING,
  Renderer: G5L2Ti011ModernRenderer,
  getSnapshot: getG5L2Ti011TextSnapshot,
  playbackEndFrameByDomain: {'sprite-228': 127},
  reducedMotionFrameByDomain: {'sprite-228': 127},
  frameControl: {
    frameDomain: DOMAIN,
    completionFrame: 240,
    transitions: G5_L2_TI011_FRAME_TRANSITIONS,
  },
  activityTimelines: G5_L2_TI011_ACTIVITIES,
  sourceTimelineAudioCues: [{
    id: 'source-main', frame: 2, endFrame: 237, frameDomain: DOMAIN,
    language: 'shared', spokenLanguage: 'undetermined',
    source: '/lesson-typography-v1/audio/course-g05-l02-ti-011/main.mp3',
    sha256: 'adf4de2ce4113ca441ad1eae93cc26db27a2ef7c77e1ba307e54eaf528b83c89',
  }],
  keyTerms: {
    indexLanguage: 'en',
    sourceAssetId: 'ELKTEG4.xml',
    sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    entryIds: Object.values(G5_L2_TI011_KEY_TERMS).map((t) => t.entryId),
  },
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>);
