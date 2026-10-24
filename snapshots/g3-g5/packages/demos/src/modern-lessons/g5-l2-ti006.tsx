"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AnimationRendererProps, RuntimeContext } from "../contract";
import type {
  LessonTextActivityRequest,
  LessonTextActivitySnapshot,
  LessonTextBinding,
  LessonTextPresentationCapability,
  TextPresentationSnapshot,
} from "../lesson-text-contract";
import type { SourceStaticCanvasFrameState } from "../source-static-canvas-candidate";
import {
  getCourseG05L02Ti006FrameState,
  normalizeCourseG05L02Ti006Frame,
} from "../modules/course-g05-l02-ti-006";
import { COURSE_G05_L02_TI_006_SOURCE } from "../timelines/course-g05-l02-ti-006";

const ID = "course-g05-l02-ti-006",
  DOMAIN = "sprite-258",
  SHA = COURSE_G05_L02_TI_006_SOURCE.swfSha256;
const ids = (character: number, count = 1) =>
  Array.from(
    { length: count },
    (_, index) => `character-${character}/run-${index}`,
  );
// The root title is outlined shape11, outside the DefineText inventory.
// Its text is a visual transcription of the exact preserved source paths.
export const G5_L2_TI006_SOURCE_TITLE = Object.freeze({
  text: "Percents: Try It!",
  characterId: 11,
  sourceTagSha256: "e26c0e6305cb3cee7625b68997b71eef90a09a6fa943d316d0bf79d441bda5fa",
  instanceId: "root/depth-1/generation-1",
  rootFrame: 6,
  copyAuthority: "source-outline-visual-transcription",
});
export const G5_L2_TI006_WORDS = Object.freeze([
  { text: "Which", frame: 5 },
  { text: "fraction", frame: 11 },
  { text: "is", frame: 13 },
  { text: "in", frame: 16 },
  { text: "simplest", frame: 25 },
  { text: "form?", frame: 32 },
]);
export const G5_L2_TI006_CHOICES = Object.freeze([
  {
    letter: "A",
    numerator: "12",
    denominator: "16",
    button: 33,
    sourceTextIds: [...ids(19), ...ids(20), ...ids(21), ...ids(22)],
  },
  {
    letter: "B",
    numerator: "5",
    denominator: "18",
    button: 35,
    sourceTextIds: [...ids(30), ...ids(31, 2), ...ids(256), ...ids(257)],
  },
  {
    letter: "C",
    numerator: "3",
    denominator: "21",
    button: 34,
    sourceTextIds: [...ids(27), ...ids(28, 2)],
  },
  {
    letter: "D",
    numerator: "3",
    denominator: "24",
    button: 36,
    sourceTextIds: [...ids(24), ...ids(25, 2)],
  },
] as const);
export type Ti006Choice = (typeof G5_L2_TI006_CHOICES)[number]["letter"];
type FeedbackDefinition = Readonly<{
  variant: number;
  sprite: number;
  text: string;
  characters: readonly number[];
  shapes?: readonly number[];
  windows: readonly (readonly [number, number])[];
  end: number;
  popupFirst?: number;
  audioSha256: string;
  firstAudioFrame: number;
  lastAudioFrame: number;
}>;
export const G5_L2_TI006_FEEDBACK: Readonly<
  Record<"wrong" | "correct", readonly FeedbackDefinition[]>
> = Object.freeze({
  wrong: [
    {
      variant: 1,
      sprite: 128,
      text: "Try Again!",
      characters: [122],
      shapes: [120],
      windows: [[6, 26]],
      end: 29,
      popupFirst: 15,
      audioSha256:
        "187a32ba065a2534843eaef91e70bd2491595f9f00b9598ea15be9a843a24d3d",
      firstAudioFrame: 2,
      lastAudioFrame: 29,
    },
    {
      variant: 2,
      sprite: 84,
      text: "incorrect!",
      characters: [69, 70, 72],
      windows: [[2, 28]],
      end: 28,
      popupFirst: 14,
      audioSha256:
        "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
      firstAudioFrame: 2,
      lastAudioFrame: 27,
    },
    {
      variant: 3,
      sprite: 102,
      text: "OH! NO",
      characters: [88, 89],
      shapes: [91, 99],
      // At frames 7 and 15 the same words are outlines on the turning sign.
      // Frames 8..14 remain blank; the native text does not fill that gap.
      windows: [
        [3, 8],
        [15, 27],
      ],
      end: 27,
      popupFirst: 14,
      audioSha256:
        "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b",
      firstAudioFrame: 2,
      lastAudioFrame: 27,
    },
  ],
  correct: [
    {
      variant: 1,
      sprite: 162,
      text: "Awesome!",
      characters: [156, 157, 158],
      windows: [[12, 26]],
      end: 27,
      audioSha256:
        "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
      firstAudioFrame: 1,
      lastAudioFrame: 27,
    },
    {
      variant: 2,
      sprite: 216,
      text: "Excellent!",
      characters: [209, 210, 214],
      windows: [[12, 31]],
      end: 32,
      audioSha256:
        "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
      firstAudioFrame: 3,
      lastAudioFrame: 32,
    },
    {
      variant: 3,
      sprite: 202,
      text: "Good Job!",
      characters: [198, 199],
      windows: [[14, 28]],
      end: 28,
      audioSha256:
        "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085",
      firstAudioFrame: 2,
      lastAudioFrame: 28,
    },
    {
      variant: 4,
      sprite: 174,
      text: "Excellent!",
      characters: [171, 172],
      windows: [[5, 26]],
      end: 27,
      audioSha256:
        "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
      firstAudioFrame: 2,
      lastAudioFrame: 27,
    },
  ],
});
const audio = (kind: "wrong" | "correct", definition: FeedbackDefinition) => ({
  source: `/lesson-typography-v1/audio/${ID}/${kind}-${definition.variant}.mp3`,
  sha256: definition.audioSha256,
  firstFrame: definition.firstAudioFrame,
  lastFrame: definition.lastAudioFrame,
  language: "shared" as const,
  spokenLanguage: "undetermined" as const,
});
export const G5_L2_TI006_ACTIVITIES = Object.freeze([
  ...G5_L2_TI006_FEEDBACK.wrong.flatMap((d) => [
    {
      id: `wrong-${d.variant}-intro`,
      frameDomain: `sprite-${d.sprite}`,
      startFrame: 2,
      endFrame: 22,
      fps: 12,
      parentFrames: [35],
      audio: audio("wrong", d),
    },
    {
      id: `wrong-${d.variant}-outro`,
      frameDomain: `sprite-${d.sprite}`,
      startFrame: 23,
      endFrame: d.end,
      fps: 12,
      parentFrames: [35],
      audio: audio("wrong", d),
      entryFromActivity: {
        id: `wrong-${d.variant}-intro`,
        firstFrame: d.popupFirst!,
        lastFrame: 22,
      },
    },
  ]),
  ...G5_L2_TI006_FEEDBACK.correct.map((d) => ({
    id: `correct-${d.variant}`,
    frameDomain: `sprite-${d.sprite}`,
    startFrame: 2,
    endFrame: d.end,
    fps: 12,
    parentFrames: [35],
    audio: audio("correct", d),
  })),
]);
export const G5_L2_TI006_TRANSITIONS = Object.freeze([
  { fromFrame: 35, toFrame: 36, stopFrame: 232 },
]);
export const G5_L2_TI006_DYNAMIC = Object.freeze({
  beforeBoth:
    "Remember, when a fraction is in simplest form the only number that will divide into ",
  afterBoth: " its numerator and its denominator is 1.",
  retry: " Try again.",
});
export const G5_L2_TI006_TERMS = Object.freeze({
  Fraction: { entryId: "en-0241-5fbc3a8495f5", buttons: [16, 52] },
  "Simplest form": { entryId: "en-0627-c4f8f2d15343", buttons: [17, 50] },
  Denominator: { entryId: "en-0144-4249bdb74f0f", buttons: [49] },
  Numerator: { entryId: "en-0425-2f89a7b35e18", buttons: [51] },
});
export interface Ti006Session {
  readonly seed: number;
  readonly replay: number;
  readonly tries: number;
  readonly help: boolean;
  readonly feedback: Readonly<{
    kind: "wrong" | "correct";
    variant: number;
    selected: Ti006Choice;
    phase: "intro" | "waiting" | "outro" | "correct";
    revisionFloor: number;
  }> | null;
  readonly pendingFrom: number | null;
  readonly outcome: "correct" | "two-wrong-continuation" | null;
}
export type Ti006Action =
  | { type: "answer"; choice: Ti006Choice; revisionFloor?: number }
  | { type: "help" | "close-help" | "activity-complete" }
  | { type: "close-feedback"; activity: LessonTextActivitySnapshot };
export function createTi006Session(seed = 0, replay = 0): Ti006Session {
  return {
    seed: Number.isSafeInteger(seed) ? seed >>> 0 : 0,
    replay: Number.isSafeInteger(replay) ? replay : 0,
    tries: 0,
    help: false,
    feedback: null,
    pendingFrom: null,
    outcome: null,
  };
}
export function syncTi006Session(
  session: Ti006Session,
  context: RuntimeContext,
): Ti006Session {
  const fresh = createTi006Session(context.seed, context.replay ?? 0);
  return session.seed !== fresh.seed || session.replay !== fresh.replay
    ? fresh
    : session.pendingFrom !== null && session.pendingFrom !== context.frame
      ? { ...session, pendingFrom: null }
      : session;
}
export function ti006ActivityId(session: Ti006Session) {
  const f = session.feedback;
  return !f
    ? null
    : f.kind === "correct"
      ? `correct-${f.variant}`
      : `wrong-${f.variant}-${f.phase === "outro" ? "outro" : "intro"}`;
}
export function getTi006ActivityState(
  session: Ti006Session,
  snapshot?: LessonTextActivitySnapshot,
) {
  const f = session.feedback,
    activity = G5_L2_TI006_ACTIVITIES.find(
      (d) => d.id === ti006ActivityId(session),
    ),
    definition = f
      ? G5_L2_TI006_FEEDBACK[f.kind].find((d) => d.variant === f.variant)
      : undefined;
  const matched = Boolean(
    f &&
    snapshot &&
    activity &&
    snapshot.id === activity.id &&
    snapshot.frameDomain === activity.frameDomain &&
    snapshot.revision > f.revisionFloor,
  );
  return {
    matched,
    definition,
    activity,
    complete: Boolean(
      matched &&
      snapshot?.status === "completed" &&
      snapshot.frame === activity?.endFrame,
    ),
    titleVisible: Boolean(
      matched &&
      snapshot &&
      definition?.windows.some(
        ([from, to]) => snapshot.frame >= from && snapshot.frame < to,
      ),
    ),
    popupVisible: Boolean(
      matched &&
      snapshot &&
      f?.kind === "wrong" &&
      f.phase !== "outro" &&
      definition?.popupFirst !== undefined &&
      snapshot.frame >= definition.popupFirst &&
      snapshot.frame <= 22,
    ),
  };
}
export function reduceTi006Session(
  session: Ti006Session,
  frame: number,
  action: Ti006Action,
) {
  const no = (reason: string) => ({
    allowed: false as const,
    reason,
    nextState: session,
    activityRequest: null,
    frameRequest: null,
  });
  const yes = (
    nextState: Ti006Session,
    activityRequest: LessonTextActivityRequest | null = null,
    frameRequest: (typeof G5_L2_TI006_TRANSITIONS)[number] | null = null,
  ) => ({
    allowed: true as const,
    reason: null,
    nextState,
    activityRequest,
    frameRequest,
  });
  if (frame !== 35 || session.pendingFrom === 35)
    return no("source-quiz-unavailable");
  if (action.type === "help")
    return session.help || session.feedback
      ? no("help-unavailable")
      : yes({ ...session, help: true });
  if (action.type === "close-help")
    return session.help
      ? yes({ ...session, help: false })
      : no("help-not-open");
  if (session.help) return no("help-open");
  if (action.type === "answer") {
    if (
      session.feedback ||
      !G5_L2_TI006_CHOICES.some((c) => c.letter === action.choice)
    )
      return no("answer-unavailable");
    const kind = action.choice === "B" ? "correct" : "wrong",
      definitions = G5_L2_TI006_FEEDBACK[kind],
      selected =
        definitions[(session.seed + session.tries) % definitions.length]!;
    const nextState: Ti006Session = {
      ...session,
      tries: kind === "wrong" ? session.tries + 1 : session.tries,
      feedback: {
        kind,
        variant: selected.variant,
        selected: action.choice,
        phase: kind === "wrong" ? "intro" : "correct",
        revisionFloor: action.revisionFloor ?? -1,
      },
    };
    return yes(nextState, { id: ti006ActivityId(nextState)!, parentFrame: 35 });
  }
  if (!session.feedback) return no("feedback-not-open");
  if (action.type === "close-feedback") {
    if (!getTi006ActivityState(session, action.activity).popupVisible)
      return no("source-close-unavailable");
    const nextState: Ti006Session = {
      ...session,
      feedback: {
        ...session.feedback,
        phase: "outro",
        revisionFloor: action.activity.revision,
      },
    };
    return yes(nextState, {
      id: ti006ActivityId(nextState)!,
      parentFrame: 35,
      fromActivity: {
        id: action.activity.id,
        revision: action.activity.revision,
      },
    });
  }
  if (action.type === "activity-complete") {
    if (session.feedback.phase === "intro")
      return yes({
        ...session,
        feedback: { ...session.feedback, phase: "waiting" },
      });
    if (session.feedback.phase === "waiting")
      return no("source-popup-awaits-close");
    if (session.feedback.kind === "wrong" && session.tries === 1)
      return yes({ ...session, feedback: null });
    return yes(
      {
        ...session,
        tries: session.feedback.kind === "wrong" ? 0 : session.tries,
        feedback: null,
        pendingFrom: 35,
        outcome:
          session.feedback.kind === "wrong"
            ? "two-wrong-continuation"
            : "correct",
      },
      null,
      G5_L2_TI006_TRANSITIONS[0]!,
    );
  }
  return no("unknown-action");
}
const helpBlocks = [
  {
    id: "help-definition",
    sourceTextIds: ids(48, 10),
    text: "A fraction is in simplest form when only the number 1 will divide both the numerator and the denominator.",
  },
  { id: "help-example", sourceTextIds: ids(47), text: "Example:" },
  {
    id: "help-simplest-fraction",
    sourceTextIds: [...ids(57), ...ids(56)],
    text: "4/5",
  },
  {
    id: "help-simplest-explanation",
    sourceTextIds: ids(54, 3),
    text: "simplest form, only 1 divides into both 4 and 5",
  },
  { id: "help-reducible-fraction", sourceTextIds: ids(58, 2), text: "4/6" },
  {
    id: "help-reducible-explanation",
    sourceTextIds: ids(55),
    text: "not simplest form because",
  },
  {
    id: "help-reduction",
    sourceTextIds: [
      ...ids(60),
      ...ids(61),
      ...ids(62),
      ...ids(63, 2),
      ...ids(64),
    ],
    text: "(4 ÷ 2)/(6 ÷ 2) = 2/3",
  },
];
export const G5_L2_TI006_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: "g05-l02-placement-047-modern-text-v2",
  placementId: "g05-l02-placement-047",
  animationId: ID,
  sourceSwfSha256: SHA,
  template: "exercise",
  blocks: [
    {
      id: "root-title",
      sourceTextIds: [],
      sourceShapeIds: [G5_L2_TI006_SOURCE_TITLE.characterId],
      role: "title",
      readingOrder: 0,
      instance: {
        id: G5_L2_TI006_SOURCE_TITLE.instanceId,
        path: [{ timelineId: "root", depth: 1, generation: 1, characterId: 11 }],
      },
    },
    {
      id: "question",
      sourceTextIds: ids(14, 5),
      role: "question",
      readingOrder: 1,
    },
    ...G5_L2_TI006_CHOICES.map((c, index) => ({
      id: `choice-${c.letter}`,
      sourceTextIds: [...c.sourceTextIds],
      role: "answer",
      readingOrder: 10 + index,
    })),
    ...helpBlocks.map((b, index) => ({
      id: b.id,
      sourceTextIds: b.sourceTextIds,
      role: index < 2 ? "heading" : "body",
      readingOrder: 30 + index,
    })),
    ...(["wrong", "correct"] as const).flatMap((kind) =>
      G5_L2_TI006_FEEDBACK[kind].map((d, index) => ({
        id: `feedback-${kind}-${d.variant}`,
        sourceTextIds: d.characters.flatMap((c) => ids(c)),
        ...(d.shapes ? { sourceShapeIds: [...d.shapes] } : {}),
        role: "feedback",
        readingOrder: (kind === "wrong" ? 60 : 63) + index,
      })),
    ),
    {
      id: "dynamic-feedback",
      sourceTextIds: ["character-74"],
      role: "feedback",
      readingOrder: 70,
    },
  ].map((b) => ({
    ...b,
    role: b.role as LessonTextBinding["blocks"][number]["role"],
    language: "en" as const,
    valueSource: "maintained-page-state" as const,
  })),
});
export function getTi006TeachingState(rawFrame: number) {
  const frame = normalizeCourseG05L02Ti006Frame(rawFrame, DOMAIN);
  return {
    frame,
    question: G5_L2_TI006_WORDS.filter((w) => frame >= w.frame)
      .map((w) => w.text)
      .join(" "),
    choices: frame >= 31,
    allChoices: frame >= 31 && frame < 87,
    quiz: frame === 35,
    numeratorEmphasis: frame >= 189 && frame < 198,
    denominatorEmphasis: frame >= 207 && frame < 216,
  };
}
export function getG5L2Ti006TextSnapshot(
  state: SourceStaticCanvasFrameState,
  context: RuntimeContext,
  stored = createTi006Session(context.seed, context.replay ?? 0),
  activity?: LessonTextActivitySnapshot,
): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== SHA)
    blockers.push("source-identity-mismatch");
  if (state.status !== "ready")
    blockers.push(state.blocker ?? "source-state-not-ready");
  if (
    state.frameDomain !== DOMAIN ||
    (context.frameDomain ?? DOMAIN) !== DOMAIN
  )
    blockers.push("source-domain-mismatch");
  if (
    state.scenario !== "source-static-frame" ||
    context.scenario !== "source-static-frame"
  )
    blockers.push("source-scenario-mismatch");
  if (state.language !== "en" || context.lang !== "en")
    blockers.push("source-English-view-required");
  if (
    state.frame !== normalizeCourseG05L02Ti006Frame(context.frame, DOMAIN) ||
    state.rootFrame !== 6 ||
    (context.rootFrame !== undefined && context.rootFrame !== 6) ||
    state.seed !== (Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0)
  )
    blockers.push("source-state-identity-mismatch");
  const session = syncTi006Session(stored, context),
    teaching = getTi006TeachingState(state.frame),
    feedback = getTi006ActivityState(session, activity);
  return {
    schemaVersion: 1,
    animationId: ID,
    bindingVersion: G5_L2_TI006_TEXT_BINDING.version,
    sourceSwfSha256: SHA,
    status: blockers.length ? "blocked" : "ready",
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
      : G5_L2_TI006_TEXT_BINDING.blocks.map((b) => {
          let text = "",
            visible = false;
          if (b.id === "root-title") {
            text = G5_L2_TI006_SOURCE_TITLE.text;
            visible = true;
          } else if (b.id === "question") {
            text = teaching.question;
            visible = Boolean(text);
          } else if (b.id.startsWith("choice-")) {
            const choice = G5_L2_TI006_CHOICES.find(
              (c) => b.id === `choice-${c.letter}`,
            )!;
            text = `${choice.letter}. ${choice.numerator}/${choice.denominator}`;
            visible =
              teaching.choices &&
              (teaching.allChoices || choice.letter === "B");
          } else if (b.id.startsWith("help-")) {
            text = helpBlocks.find((h) => h.id === b.id)!.text;
            visible = session.help && teaching.quiz;
          } else if (b.id === "dynamic-feedback") {
            text =
              G5_L2_TI006_DYNAMIC.beforeBoth +
              "both" +
              G5_L2_TI006_DYNAMIC.afterBoth +
              (session.tries === 1 ? G5_L2_TI006_DYNAMIC.retry : "");
            visible = feedback.popupVisible;
          } else if (
            session.feedback &&
            b.id ===
              `feedback-${session.feedback.kind}-${session.feedback.variant}`
          ) {
            text = feedback.definition?.text ?? "";
            visible = feedback.titleVisible;
          }
          return { ...b, text, visible };
        }),
  };
}
const CSS = `
.g5-ti006{container:ti006 / inline-size;box-sizing:border-box;inline-size:100%;padding:clamp(8px,2vw,20px);font-family:var(--lesson-text-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6;color:#17273c;background:#fffdf8}.g5-ti006 *{box-sizing:border-box}.g5-ti006 h2,.g5-ti006 h3{font-family:var(--lesson-text-font-heading,"Fredoka",system-ui,sans-serif);font-weight:600;line-height:1.3;margin:0 0 1rem;overflow-wrap:anywhere}.g5-ti006 h2{font-size:1.8rem}.g5-ti006 h3{font-size:1.45rem}.g5-ti006 p{overflow-wrap:anywhere;margin:.8em 0}.g5-ti006__question{padding:clamp(12px,3cqi,24px);border:1px solid #bdd1ec;border-radius:1rem;background:#f0f6ff}.g5-ti006__choices{display:grid;grid-template-columns:1fr;gap:.85rem;list-style:none;padding:0;margin:1rem 0}.g5-ti006__choice{display:flex;align-items:center;gap:1rem;min-block-size:4rem;inline-size:100%;border:1px solid #9fb7d5;border-radius:.8rem;padding:.8rem 1rem;background:white;color:inherit;font:inherit;text-align:start}.g5-ti006__choice>b{display:grid;place-items:center;min-inline-size:2em;min-block-size:2em;background:#e6eefb;border-radius:50%}.g5-ti006__fraction{display:inline-grid;grid-template-rows:auto auto;text-align:center;vertical-align:middle;line-height:1.2;font-variant-numeric:tabular-nums;white-space:nowrap}.g5-ti006__fraction>span{padding:.15em .25em}.g5-ti006__fraction>span:first-child{border-bottom:2px solid currentColor}.g5-ti006__choice .g5-ti006__fraction{font-size:1.6rem;font-weight:700}.g5-ti006__fraction [data-emphasis=true]{outline:3px solid #b77d12;background:#fff1c2;border-radius:.2rem}.g5-ti006 button{cursor:pointer}.g5-ti006 button:disabled{opacity:.65}.g5-ti006 button:focus-visible{outline:3px solid #174ea6;outline-offset:3px}.g5-ti006__button{font:inherit;line-height:1.4;background:#174ea6;color:white;border:1px solid #174ea6;border-radius:.7rem;min-block-size:2.75rem;padding:.6rem 1rem}.g5-ti006__feedback,.g5-ti006__dialog{padding:clamp(12px,3cqi,24px);margin:1rem 0;border:1px solid #aabed8;border-radius:1rem}.g5-ti006__feedback{background:#fff7f1;border-color:#b66543}.g5-ti006__feedback[data-kind=correct]{background:#eef8f1;border-color:#27764a}.g5-ti006__dialog{position:relative;inset:auto;inline-size:100%;max-inline-size:100%;max-block-size:none;overflow:visible;background:#fffdf8;color:inherit;font:inherit}.g5-ti006__dialog header{display:flex;justify-content:flex-end;margin-bottom:1rem}.g5-ti006__example{border:1px solid #d1dce9;border-radius:.8rem;padding:clamp(10px,3cqi,20px);margin-block:1rem}.g5-ti006__math{display:flex;flex-wrap:wrap;gap:.5em;align-items:center;font-size:1.45rem}.g5-ti006__term{font:inherit;line-height:inherit;color:#174ea6;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;border:0;background:transparent;padding:0 .04em;max-inline-size:100%;min-block-size:44px;overflow-wrap:anywhere;text-align:inherit}
.g5-ti006 .g5-ti006__title{font-size:clamp(1.75rem,calc(1.4rem + 1.2cqi),2.25rem);overflow-wrap:normal;hyphens:none}.g5-ti006 .g5-ti006__question h3{font-size:1.8rem}
.g5-ti006 [data-lesson-text-block="help-definition"]{font-size:clamp(1.125rem,calc(1rem + 1cqi),1.45rem);overflow-wrap:normal;hyphens:none}.g5-ti006__term{overflow-wrap:normal;hyphens:none}.g5-ti006__term-ending{white-space:nowrap}
@container ti006 (min-width:36rem){.g5-ti006__choices{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
function Fraction({
  numerator,
  denominator,
  numeratorEmphasis = false,
  denominatorEmphasis = false,
}: {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
  numeratorEmphasis?: boolean;
  denominatorEmphasis?: boolean;
}) {
  return (
    <span className="g5-ti006__fraction">
      <span data-emphasis={numeratorEmphasis}>{numerator}</span>
      <span data-emphasis={denominatorEmphasis}>{denominator}</span>
    </span>
  );
}
export function G5L2Ti006ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {
    ...props,
    frameDomain: props.frameDomain ?? DOMAIN,
  };
  const state =
    props.state &&
    typeof props.state === "object" &&
    "sourceSwfSha256" in props.state
      ? (props.state as SourceStaticCanvasFrameState)
      : getCourseG05L02Ti006FrameState(props.frame, context);
  const [stored, setStored] = useState(() =>
    createTi006Session(props.seed, props.replay ?? 0),
  );
  const session = syncTi006Session(stored, context),
    snapshot = getG5L2Ti006TextSnapshot(
      state,
      context,
      session,
      props.lessonActivity,
    ),
    teaching = getTi006TeachingState(state.frame),
    activity = getTi006ActivityState(session, props.lessonActivity);
  const dialog = useRef<HTMLDialogElement>(null),
    helpTrigger = useRef<HTMLButtonElement>(null),
    feedbackRegion = useRef<HTMLDivElement>(null),
    closeFeedback = useRef<HTMLButtonElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    choices = useRef<Record<string, HTMLButtonElement | null>>({}),
    consumed = useRef<string | null>(null);
  const ready = snapshot.status === "ready" && !props.entryStateSha256,
    quizAvailable = ready && teaching.quiz && session.pendingFrom !== 35;
  const canAnswer =
    quizAvailable &&
    !session.help &&
    !session.feedback &&
    Boolean(props.onLessonActivityRequest);
  const text = (id: string) =>
    snapshot.blocks.find((b) => b.id === id && b.visible)?.text ?? "";
  function dispatch(action: Ti006Action) {
    if (!ready) return false;
    const result = reduceTi006Session(
      session,
      state.frame,
      action.type === "answer"
        ? { ...action, revisionFloor: props.lessonActivity?.revision ?? -1 }
        : action,
    );
    if (!result.allowed) return false;
    if (
      result.activityRequest &&
      props.onLessonActivityRequest?.(result.activityRequest) !== true
    )
      return false;
    if (
      result.frameRequest &&
      props.onLessonFrameRequest?.(result.frameRequest) !== true
    )
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
      if (
        choices.current[selected]?.isConnected &&
        !choices.current[selected]?.disabled
      )
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
    if (consumed.current !== token && dispatch({ type: "activity-complete" }))
      consumed.current = token;
  }, [ready, activity.complete, props.lessonActivity, session]);
  if (snapshot.status !== "ready") return null;
  const term = (name: keyof typeof G5_L2_TI006_TERMS, label: string) => {
    const entry = G5_L2_TI006_TERMS[name];
    return (
      <button
        type="button"
        className="g5-ti006__term"
        data-keyterm-entry-id={entry.entryId}
        disabled={!ready || !props.onLessonHostRequest}
        onClick={(event) => {
          const decision = props.onLessonHostRequest?.(
            {
              type: "open-keyterm",
              entryId: entry.entryId,
              sourceAnimationId: ID,
              playbackDisposition:
                "source-stop-timeline-and-audio-until-explicit-resume",
            },
            { trigger: event.currentTarget },
          );
          event.currentTarget.dataset.lessonHostResult =
            decision?.status ?? "unhandled";
          if (decision?.status === "blocked")
            event.currentTarget.dataset.lessonHostReason = decision.reason;
        }}
      >
        {label}
      </button>
    );
  };
  const question = teaching.question
    .split(/(fraction|simplest form)/g)
    .map((part, index) =>
      part === "fraction" ? (
        <React.Fragment key={index}>{term("Fraction", part)}</React.Fragment>
      ) : part === "simplest form" ? (
        <React.Fragment key={index}>
          {term("Simplest form", part)}
        </React.Fragment>
      ) : (
        part
      ),
    );
  return (
    <section
      className="g5-ti006"
      lang="en"
      data-modern-lesson="g5-l2-ti006"
      data-source-language-disposition="source-shared-untranslated-visual"
      data-flash-frame={state.frame}
      data-flash-frame-domain={DOMAIN}
      data-flash-root-frame={6}
      data-runtime-seed={state.seed}
      data-runtime-replay={props.replay ?? 0}
      data-quiz-try-count={session.tries}
      data-help-state={session.help ? "open" : "closed"}
      data-feedback-kind={session.feedback?.kind ?? "none"}
      data-feedback-phase={session.feedback?.phase ?? "none"}
      data-feedback-activity-frame={props.lessonActivity?.frame ?? ""}
      data-terminal-outcome={session.outcome ?? "none"}
    >
      <style>{CSS}</style>
      <h2
        className="g5-ti006__title"
        data-lesson-text-block="root-title"
        data-source-shape-id={G5_L2_TI006_SOURCE_TITLE.characterId}
        data-source-shape-sha256={G5_L2_TI006_SOURCE_TITLE.sourceTagSha256}
        data-native-copy-authority={G5_L2_TI006_SOURCE_TITLE.copyAuthority}
      >
        {text("root-title")}
      </h2>
      {teaching.question && (
        <div className="g5-ti006__question">
          <h3 ref={heading} tabIndex={-1} data-lesson-text-block="question">
            {question}
          </h3>
        </div>
      )}
      {teaching.choices && (
        <ol className="g5-ti006__choices" aria-label="Answer choices">
          {G5_L2_TI006_CHOICES.filter(
            (c) => teaching.allChoices || c.letter === "B",
          ).map((c) => (
            <li key={c.letter} data-lesson-text-block={`choice-${c.letter}`}>
              {teaching.quiz ? (
                <button
                  ref={(node) => {
                    choices.current[c.letter] = node;
                  }}
                  type="button"
                  className="g5-ti006__choice"
                  aria-label={`${c.letter}. ${c.numerator}/${c.denominator}`}
                  disabled={!canAnswer}
                  onClick={() => dispatch({ type: "answer", choice: c.letter })}
                >
                  <b aria-hidden="true">{c.letter}</b>
                  <span aria-hidden="true">
                    <Fraction
                      numerator={c.numerator}
                      denominator={c.denominator}
                    />
                  </span>
                </button>
              ) : (
                <div
                  className="g5-ti006__choice"
                  role="math"
                  aria-label={`${c.letter}. ${c.numerator} over ${c.denominator}`}
                >
                  <b>{c.letter}</b>
                  <Fraction
                    numerator={c.numerator}
                    denominator={c.denominator}
                    numeratorEmphasis={
                      c.letter === "B" && teaching.numeratorEmphasis
                    }
                    denominatorEmphasis={
                      c.letter === "B" && teaching.denominatorEmphasis
                    }
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {quizAvailable && !session.help && !session.feedback && (
        <button
          ref={helpTrigger}
          type="button"
          className="g5-ti006__button"
          onClick={() => dispatch({ type: "help" })}
        >
          Need More Help
        </button>
      )}
      {session.feedback && teaching.quiz && (
        <div
          ref={feedbackRegion}
          tabIndex={-1}
          className="g5-ti006__feedback"
          data-kind={session.feedback.kind}
          role="status"
          aria-live="polite"
        >
          {activity.titleVisible && (
            <strong
              data-lesson-text-block={`feedback-${session.feedback.kind}-${session.feedback.variant}`}
            >
              {activity.definition?.text}
            </strong>
          )}
          {activity.popupVisible && (
            <>
              <p
                data-lesson-text-block="dynamic-feedback"
                data-source-dynamic-field="character-74"
              >
                {G5_L2_TI006_DYNAMIC.beforeBoth}
                <strong>both</strong>
                {G5_L2_TI006_DYNAMIC.afterBoth}
                {session.tries === 1 ? G5_L2_TI006_DYNAMIC.retry : ""}
              </p>
              <button
                ref={closeFeedback}
                type="button"
                className="g5-ti006__button"
                onClick={() =>
                  props.lessonActivity &&
                  dispatch({
                    type: "close-feedback",
                    activity: props.lessonActivity,
                  })
                }
              >
                Close feedback
              </button>
            </>
          )}
        </div>
      )}
      {session.help && ready && (
        <dialog
          ref={dialog}
          className="g5-ti006__dialog"
          aria-label="Fractions in simplest form"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              dispatch({ type: "close-help" });
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            dispatch({ type: "close-help" });
          }}
        >
          <header>
            <button
              autoFocus
              type="button"
              className="g5-ti006__button"
              onClick={() => dispatch({ type: "close-help" })}
            >
              Close
            </button>
          </header>
          <h3 data-lesson-text-block="help-definition">
            A {term("Fraction", "fraction")} is in{" "}
            {term("Simplest form", "simplest form")} when only the number 1 will
            divide both the {term("Numerator", "numerator")} and the{" "}
            <span className="g5-ti006__term-ending">
              {term("Denominator", "denominator")}.
            </span>
          </h3>
          <h3 data-lesson-text-block="help-example">{text("help-example")}</h3>
          <div className="g5-ti006__example">
            <div
              className="g5-ti006__math"
              role="math"
              aria-label="4 over 5"
              data-lesson-text-block="help-simplest-fraction"
            >
              <Fraction numerator="4" denominator="5" />
            </div>
            <p data-lesson-text-block="help-simplest-explanation">
              simplest form, only 1 divides into <strong>both</strong> 4 and 5
            </p>
          </div>
          <div className="g5-ti006__example">
            <div
              className="g5-ti006__math"
              role="math"
              aria-label="4 over 6"
              data-lesson-text-block="help-reducible-fraction"
            >
              <Fraction numerator="4" denominator="6" />
            </div>
            <p data-lesson-text-block="help-reducible-explanation">
              {text("help-reducible-explanation")}
            </p>
            <div
              className="g5-ti006__math"
              role="math"
              aria-label="4 divided by 2 over 6 divided by 2 equals 2 over 3"
              data-lesson-text-block="help-reduction"
            >
              <Fraction numerator="4 ÷ 2" denominator="6 ÷ 2" />
              <span>=</span>
              <Fraction numerator="2" denominator="3" />
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
export const G5_L2_TI006_TEXT_PRESENTATION = Object.freeze({
  schemaVersion: 1,
  binding: G5_L2_TI006_TEXT_BINDING,
  Renderer: G5L2Ti006ModernRenderer,
  getSnapshot: getG5L2Ti006TextSnapshot,
  playbackEndFrameByDomain: { "sprite-258": 35 },
  reducedMotionFrameByDomain: { "sprite-258": 35 },
  frameControl: {
    frameDomain: DOMAIN,
    completionFrame: 232,
    transitions: G5_L2_TI006_TRANSITIONS,
  },
  activityTimelines: G5_L2_TI006_ACTIVITIES,
  sourceTimelineAudioCues: [
    {
      id: "source-main",
      frame: 2,
      endFrame: 233,
      frameDomain: DOMAIN,
      language: "shared",
      spokenLanguage: "undetermined",
      source: `/lesson-typography-v1/audio/${ID}/main.mp3`,
      sha256:
        "4f4cec05fb83f382985a1448550a048b4990f6046dd2ff0b2cc4b44cb06f1c39",
    },
  ],
  keyTerms: {
    indexLanguage: "en",
    sourceAssetId: "ELKTEG4.xml",
    sourceSha256:
      "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
    entryIds: Object.values(G5_L2_TI006_TERMS).map((t) => t.entryId),
  },
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>);
