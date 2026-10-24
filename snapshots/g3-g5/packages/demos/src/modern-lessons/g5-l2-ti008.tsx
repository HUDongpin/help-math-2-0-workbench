"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnimationRendererProps, RuntimeContext } from "../contract";
import type {
  LessonTextActivityDefinition,
  LessonTextActivityRequest,
  LessonTextActivitySnapshot,
  LessonTextBinding,
  LessonTextPresentationCapability,
  TextPresentationSnapshot,
} from "../lesson-text-contract";
import type { SourceStaticCanvasFrameState } from "../source-static-canvas-candidate";
import {
  getCourseG05L02Ti008FrameState,
  normalizeCourseG05L02Ti008Frame,
} from "../modules/course-g05-l02-ti-008";
import { COURSE_G05_L02_TI_008_SOURCE } from "../timelines/course-g05-l02-ti-008";

const ID = "course-g05-l02-ti-008",
  DOMAIN = "sprite-124",
  SHA = COURSE_G05_L02_TI_008_SOURCE.swfSha256;
const ids = (character: number, count = 1) =>
  Array.from(
    { length: count },
    (_, index) => `character-${character}/run-${index}`,
  );
// Visual transcription of the preserved root shape, outside DefineText.
export const G5_L2_TI008_SOURCE_TITLE = Object.freeze({
  text: "Percents: Try It!",
  characterId: 11,
  sourceTagSha256: "b2418fbccf0764179dc614f33621208f8469b2a6daff9b503dba8fdac71c82eb",
  instanceId: "root/depth-1/generation-1",
  rootFrame: 6,
  copyAuthority: "source-outline-visual-transcription",
});
export const G5_L2_TI008_WORDS = Object.freeze([
  { text: "Drag", frame: 8 },
  { text: "and", frame: 10 },
  { text: "drop", frame: 12 },
  { text: "the", frame: 14 },
  { text: "correct", frame: 17 },
  { text: "fraction,", frame: 21 },
  { text: "decimal,", frame: 36 },
  { text: "and", frame: 45 },
  { text: "percent", frame: 48 },
  { text: "equivalents", frame: 58 },
  { text: "on", frame: 64 },
  { text: "to", frame: 65 },
  { text: "the", frame: 67 },
  { text: "table.", frame: 70 },
]);
export const G5_L2_TI008_CARDS = Object.freeze([
  {
    id: 8,
    text: "1%",
    sourceCharacter: 71,
    textCharacter: 33,
    runCount: 1,
    row: 2,
    column: 2,
    targetShape: 67,
  },
  {
    id: 6,
    text: "30%",
    sourceCharacter: 72,
    textCharacter: 35,
    runCount: 1,
    row: 0,
    column: 2,
    targetShape: null,
  },
  {
    id: 2,
    text: "2/5",
    sourceCharacter: 73,
    textCharacter: 37,
    runCount: 2,
    row: 3,
    column: 0,
    targetShape: 57,
  },
  {
    id: 3,
    text: "0.3",
    sourceCharacter: 74,
    textCharacter: 38,
    runCount: 1,
    row: 0,
    column: 1,
    targetShape: 59,
  },
  {
    id: 1,
    text: "3/25",
    sourceCharacter: 75,
    textCharacter: 40,
    runCount: 2,
    row: 1,
    column: 0,
    targetShape: 55,
  },
  {
    id: 4,
    text: "0.01",
    sourceCharacter: 76,
    textCharacter: 41,
    runCount: 1,
    row: 2,
    column: 1,
    targetShape: 61,
  },
  {
    id: 7,
    text: "12%",
    sourceCharacter: 77,
    textCharacter: 42,
    runCount: 1,
    row: 1,
    column: 2,
    targetShape: 65,
  },
  {
    id: 5,
    text: "0.4",
    sourceCharacter: 78,
    textCharacter: 43,
    runCount: 1,
    row: 3,
    column: 1,
    targetShape: 63,
  },
] as const);
export type Ti008CardId = (typeof G5_L2_TI008_CARDS)[number]["id"];
export const G5_L2_TI008_GIVENS = Object.freeze([
  {
    row: 0,
    column: 0,
    text: "3/10",
    sourceTextIds: [
      ...ids(21),
      ...ids(22),
      ...ids(23),
      ...ids(48),
      ...ids(49),
      ...ids(50),
    ],
  },
  { row: 1, column: 1, text: "0.12", sourceTextIds: ids(25) },
  { row: 2, column: 0, text: "1/100", sourceTextIds: ids(24, 2) },
  { row: 3, column: 2, text: "40%", sourceTextIds: ids(26) },
]);
export const G5_L2_TI008_TERMS = Object.freeze({
  Fraction: { entryId: "en-0241-5fbc3a8495f5", buttons: [18, 118] },
  Decimal: { entryId: "en-0134-4aa1672f260e", buttons: [19, 120] },
  Percent: { entryId: "en-0465-44ed768576d5", buttons: [20] },
  Table: { entryId: "en-0679-a690cad72cd5", buttons: [30] },
  Equivalent: { entryId: "en-0197-a58f97d67d41", buttons: [31, 119] },
  "Decimal point": { entryId: "en-0139-112030aee518", buttons: [116] },
  Express: { entryId: "en-0216-7a9f263f0b99", buttons: [117] },
  Denominator: { entryId: "en-0144-4249bdb74f0f", buttons: [121] },
  Numerator: { entryId: "en-0425-2f89a7b35e18", buttons: [122] },
});
export const G5_L2_TI008_ACTIVITIES: readonly LessonTextActivityDefinition[] =
  Object.freeze([
    {
      id: "wrong",
      sourceInstanceId: "root/animation_mc/animation/Pop1_mc",
      parentLifetime: { firstFrame: 227, lastFrameExclusive: 228 },
      frameDomain: "sprite-90",
      startFrame: 2,
      endFrame: 15,
      fps: 12,
      parentFrames: [227],
      audio: {
        source: `/lesson-typography-v1/audio/${ID}/wrong.mp3`,
        sha256:
          "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
        firstFrame: 1,
        lastFrame: 15,
        language: "shared",
        spokenLanguage: "undetermined",
      },
    },
    {
      id: "coach",
      sourceInstanceId: "root/animation_mc/animation/Coach_audio_2",
      parentLifetime: { firstFrame: 227, lastFrameExclusive: 228 },
      frameDomain: "sprite-96",
      startFrame: 2,
      endFrame: 20,
      fps: 12,
      parentFrames: [227],
      audio: {
        source: `/lesson-typography-v1/audio/${ID}/coach.mp3`,
        sha256:
          "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
        firstFrame: 2,
        lastFrame: 20,
        language: "shared",
        spokenLanguage: "undetermined",
      },
    },
    {
      id: "correct",
      sourceInstanceId: "root/animation_mc/animation/Correct_FB",
      parentLifetime: { firstFrame: 227, lastFrameExclusive: 228 },
      frameDomain: "sprite-94",
      startFrame: 2,
      endFrame: 29,
      fps: 12,
      parentFrames: [227],
    },
  ]);
export const G5_L2_TI008_TRANSITIONS = Object.freeze([
  { fromFrame: 227, toFrame: 228, stopFrame: 273 },
]);
type ActivityName = "wrong" | "coach" | "correct";
export interface Ti008Session {
  readonly seed: number;
  readonly replay: number;
  readonly selected: Ti008CardId | null;
  readonly hidden: readonly Ti008CardId[];
  readonly repeatedCardPosition: "palette" | "target";
  readonly matchCount: number;
  readonly controlsEnabled: boolean;
  readonly help: boolean;
  readonly wrongVisible: boolean;
  readonly coachRevisionFloor: number | null;
  readonly correctRevisionFloor: number | null;
  readonly consumedCoachRevision: number;
  readonly consumedCorrectRevision: number;
  readonly pendingFrom: number | null;
  readonly outcome: "source-count-complete" | null;
}
export type Ti008Action =
  | { type: "select"; card: Ti008CardId }
  | { type: "cancel-selection" | "close-wrong" | "help" | "close-help" }
  | {
      type: "drop";
      card: Ti008CardId;
      target: number | null;
      coachRevisionFloor?: number;
    }
  | {
      type: "coach-complete";
      activity: LessonTextActivitySnapshot;
      correctRevisionFloor?: number;
    }
  | { type: "correct-complete"; activity: LessonTextActivitySnapshot };
export function createTi008Session(seed = 0, replay = 0): Ti008Session {
  return {
    seed: Number.isSafeInteger(seed) ? seed >>> 0 : 0,
    replay: Number.isSafeInteger(replay) ? replay : 0,
    selected: null,
    hidden: [],
    repeatedCardPosition: "palette",
    matchCount: 0,
    controlsEnabled: true,
    help: false,
    wrongVisible: false,
    coachRevisionFloor: null,
    correctRevisionFloor: null,
    consumedCoachRevision: -1,
    consumedCorrectRevision: -1,
    pendingFrom: null,
    outcome: null,
  };
}
export function syncTi008Session(
  session: Ti008Session,
  context: RuntimeContext,
) {
  const fresh = createTi008Session(context.seed, context.replay ?? 0);
  return session.seed !== fresh.seed || session.replay !== fresh.replay
    ? fresh
    : session.pendingFrom !== null && context.frame !== session.pendingFrom
      ? { ...session, pendingFrom: null, help: false, wrongVisible: false }
      : session;
}
export function ti008Activity(
  activities: readonly LessonTextActivitySnapshot[] | undefined,
  name: ActivityName,
) {
  const definition = G5_L2_TI008_ACTIVITIES.find((d) => d.id === name)!;
  return activities?.find(
    (activity) =>
      activity.id === definition.id &&
      activity.sourceInstanceId === definition.sourceInstanceId &&
      activity.frameDomain === definition.frameDomain,
  );
}
export function ti008CardAvailable(
  session: Ti008Session,
  card: number,
): card is Ti008CardId {
  return (
    G5_L2_TI008_CARDS.some((c) => c.id === card) &&
    !session.hidden.includes(card as Ti008CardId)
  );
}
export function reduceTi008Session(
  session: Ti008Session,
  frame: number,
  action: Ti008Action,
) {
  const no = (reason: string) => ({
    allowed: false as const,
    reason,
    nextState: session,
    activityRequest: null,
    frameRequest: null,
  });
  const yes = (
    nextState: Ti008Session,
    activityRequest: LessonTextActivityRequest | null = null,
    frameRequest: (typeof G5_L2_TI008_TRANSITIONS)[number] | null = null,
  ) => ({
    allowed: true as const,
    reason: null,
    nextState,
    activityRequest,
    frameRequest,
  });
  if (frame !== 227 || session.pendingFrom === 227)
    return no("source-interaction-unavailable");
  if (action.type === "coach-complete") {
    const expected = G5_L2_TI008_ACTIVITIES[1]!;
    if (
      session.coachRevisionFloor === null ||
      action.activity.id !== "coach" ||
      action.activity.sourceInstanceId !== expected.sourceInstanceId ||
      action.activity.frameDomain !== expected.frameDomain ||
      action.activity.status !== "completed" ||
      action.activity.frame !== 20 ||
      action.activity.revision <=
        Math.max(session.coachRevisionFloor, session.consumedCoachRevision)
    )
      return no("stale-or-incomplete-coach");
    const next = {
      ...session,
      controlsEnabled: true,
      consumedCoachRevision: action.activity.revision,
    };
    return session.matchCount >= 8
      ? yes(
          { ...next, correctRevisionFloor: action.correctRevisionFloor ?? -1 },
          { id: "correct", parentFrame: 227 },
        )
      : yes(next);
  }
  if (action.type === "correct-complete") {
    const expected = G5_L2_TI008_ACTIVITIES[2]!;
    if (
      session.correctRevisionFloor === null ||
      session.matchCount < 8 ||
      action.activity.id !== "correct" ||
      action.activity.sourceInstanceId !== expected.sourceInstanceId ||
      action.activity.frameDomain !== expected.frameDomain ||
      action.activity.status !== "completed" ||
      action.activity.frame !== 29 ||
      action.activity.revision <=
        Math.max(session.correctRevisionFloor, session.consumedCorrectRevision)
    )
      return no("stale-or-incomplete-correct");
    return yes(
      {
        ...session,
        selected: null,
        help: false,
        wrongVisible: false,
        consumedCorrectRevision: action.activity.revision,
        pendingFrom: 227,
        outcome: "source-count-complete",
      },
      null,
      G5_L2_TI008_TRANSITIONS[0]!,
    );
  }
  if (action.type === "close-wrong")
    return session.wrongVisible
      ? yes({ ...session, wrongVisible: false, controlsEnabled: true })
      : no("wrong-popup-not-open");
  if (action.type === "help")
    return session.controlsEnabled && !session.help
      ? yes({ ...session, help: true, controlsEnabled: false, selected: null })
      : no("help-unavailable");
  if (action.type === "close-help")
    return session.help
      ? yes({ ...session, help: false, controlsEnabled: true })
      : no("help-not-open");
  if (!session.controlsEnabled || session.help)
    return no("source-controls-disabled");
  if (action.type === "cancel-selection")
    return yes({ ...session, selected: null });
  if (action.type === "select")
    return ti008CardAvailable(session, action.card)
      ? yes({ ...session, selected: action.card })
      : no("source-card-unavailable");
  if (action.type === "drop") {
    if (!ti008CardAvailable(session, action.card))
      return no("source-card-unavailable");
    if (action.card !== action.target)
      return yes(
        {
          ...session,
          selected: null,
          controlsEnabled: false,
          wrongVisible: true,
          repeatedCardPosition:
            action.card === 6 ? "palette" : session.repeatedCardPosition,
        },
        { id: "wrong", parentFrame: 227 },
      );
    // Source Scr_6 stays placed and is re-enabled by Coach's Enable_btn. The
    // original counter counts accepted drops, including another drop of Scr_6.
    return yes(
      {
        ...session,
        selected: null,
        controlsEnabled: false,
        matchCount: session.matchCount + 1,
        hidden:
          action.card === 6 ? session.hidden : [...session.hidden, action.card],
        repeatedCardPosition:
          action.card === 6 ? "target" : session.repeatedCardPosition,
        coachRevisionFloor: action.coachRevisionFloor ?? -1,
      },
      { id: "coach", parentFrame: 227 },
    );
  }
  return no("unknown-action");
}
const helpBlocks = [
  {
    id: "help-rule",
    sourceTextIds: ids(101, 7),
    text: "To express a fraction as a decimal:",
  },
  {
    id: "help-step1",
    sourceTextIds: ids(104, 5),
    text: "Find an equivalent fraction with a denominator of 100.",
  },
  {
    id: "help-step2",
    sourceTextIds: ids(105, 4),
    text: "Drop the denominator and use the numerator as the decimal number.",
  },
  {
    id: "help-step3",
    sourceTextIds: ids(102, 3),
    text: "Move the decimal point two places to the left.",
  },
  { id: "help-example", sourceTextIds: ids(100), text: "Example:" },
  {
    id: "help-equivalent-example",
    sourceTextIds: [
      ...ids(106, 2),
      ...ids(108),
      ...ids(109),
      ...ids(110),
      ...ids(111, 2),
      ...ids(112),
      ...ids(113),
    ],
    text: "7/25 = (7 × 4)/(25 × 4) = 28/100 = 0.28",
  },
  {
    id: "help-division-rule",
    sourceTextIds: ids(103),
    text: "You also can divide the numerator by the denominator:",
  },
  {
    id: "help-division-example",
    sourceTextIds: [...ids(115, 2), ...ids(114)],
    text: "7/25 = 7 ÷ 25 = 0.28",
  },
];
export const G5_L2_TI008_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: "g05-l02-placement-049-modern-text-v2",
  placementId: "g05-l02-placement-049",
  animationId: ID,
  sourceSwfSha256: SHA,
  template: "exercise",
  blocks: [
    {
      id: "root-title",
      sourceTextIds: [],
      sourceShapeIds: [G5_L2_TI008_SOURCE_TITLE.characterId],
      role: "title",
      readingOrder: 0,
      instance: {
        id: G5_L2_TI008_SOURCE_TITLE.instanceId,
        path: [{ timelineId: "root", depth: 1, generation: 1, characterId: 11 }],
      },
    },
    {
      id: "instruction",
      sourceTextIds: [...ids(29, 7), ...ids(45, 10)],
      role: "question",
      readingOrder: 1,
    },
    ...["Fraction", "Decimal", "Percent"].map((text, index) => ({
      id: `column-${index}`,
      sourceTextIds: ids(13 + index),
      role: "label",
      readingOrder: 10 + index,
    })),
    ...G5_L2_TI008_GIVENS.map((given, index) => ({
      id: `given-${given.row}-${given.column}`,
      sourceTextIds: given.sourceTextIds,
      role: "body",
      readingOrder: 20 + index,
    })),
    ...G5_L2_TI008_CARDS.map((card, index) => ({
      id: `card-${card.id}`,
      sourceTextIds: [
        ...ids(card.textCharacter, card.runCount),
        ...(card.id === 3 ? ids(46) : []),
      ],
      role: "answer",
      readingOrder: 30 + index,
    })),
    ...G5_L2_TI008_CARDS.map((card, index) => ({
      id: `target-${card.id}`,
      sourceTextIds: ids(card.textCharacter, card.runCount),
      ...(card.targetShape !== null
        ? { sourceShapeIds: [card.targetShape] }
        : {}),
      role: "answer",
      readingOrder: 40 + index,
    })),
    {
      id: "wrong-feedback",
      sourceTextIds: ids(89),
      role: "feedback",
      readingOrder: 50,
    },
    {
      id: "correct-feedback",
      sourceTextIds: ids(93),
      role: "feedback",
      readingOrder: 51,
    },
    ...helpBlocks.map((block, index) => ({
      id: block.id,
      sourceTextIds: block.sourceTextIds,
      role: index === 0 || index === 4 ? "heading" : "body",
      readingOrder: 60 + index,
    })),
  ].map((block) => ({
    ...block,
    role: block.role as LessonTextBinding["blocks"][number]["role"],
    language: "en" as const,
    valueSource: "maintained-page-state" as const,
  })),
});
export function getTi008TeachingState(requestedFrame: number) {
  const frame = normalizeCourseG05L02Ti008Frame(requestedFrame, DOMAIN);
  return {
    frame,
    instruction: G5_L2_TI008_WORDS.filter((word) => frame >= word.frame)
      .map((word) => word.text)
      .join(" "),
    tableVisible: frame >= 2,
    cardsVisible: frame >= 7,
    interactive: frame === 227,
    emphasis: frame >= 120 && frame < 127,
    demoVisible: frame >= 160 && frame < 206,
    demoProgress:
      frame >= 160 && frame < 166
        ? (frame - 159) / 7
        : frame >= 166 && frame < 200
          ? 1
          : frame >= 200 && frame < 206
            ? (206 - frame) / 7
            : 0,
  };
}
export function getG5L2Ti008TextSnapshot(
  state: SourceStaticCanvasFrameState,
  context: RuntimeContext,
  stored = createTi008Session(context.seed, context.replay ?? 0),
  activities: readonly LessonTextActivitySnapshot[] = [],
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
    state.frame !== normalizeCourseG05L02Ti008Frame(context.frame, DOMAIN) ||
    state.rootFrame !== 6 ||
    (context.rootFrame !== undefined && context.rootFrame !== 6) ||
    state.seed !== (Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0)
  )
    blockers.push("source-state-identity-mismatch");
  const session = syncTi008Session(stored, context),
    teaching = getTi008TeachingState(state.frame),
    correct = ti008Activity(activities, "correct");
  return {
    schemaVersion: 1,
    animationId: ID,
    bindingVersion: G5_L2_TI008_TEXT_BINDING.version,
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
      : G5_L2_TI008_TEXT_BINDING.blocks.map((block) => {
          let text = "",
            visible = false;
          if (block.id === "root-title") {
            text = G5_L2_TI008_SOURCE_TITLE.text;
            visible = state.rootFrame === G5_L2_TI008_SOURCE_TITLE.rootFrame;
          } else if (block.id === "instruction") {
            text = teaching.instruction;
            visible = Boolean(text);
          } else if (block.id.startsWith("column-")) {
            text = ["Fraction", "Decimal", "Percent"][
              Number(block.id.slice(7))
            ]!;
            visible = teaching.tableVisible;
          } else if (block.id.startsWith("given-")) {
            text = G5_L2_TI008_GIVENS.find(
              (g) => block.id === `given-${g.row}-${g.column}`,
            )!.text;
            visible = teaching.tableVisible;
          } else if (block.id.startsWith("card-")) {
            const card = G5_L2_TI008_CARDS.find(
              (c) => block.id === `card-${c.id}`,
            )!;
            text = card.text;
            visible =
              teaching.cardsVisible &&
              !session.hidden.includes(card.id) &&
              (card.id !== 6 || session.repeatedCardPosition === "palette");
          } else if (block.id.startsWith("target-")) {
            const card = G5_L2_TI008_CARDS.find(
              (c) => block.id === `target-${c.id}`,
            )!;
            text = card.text;
            visible =
              teaching.tableVisible &&
              (card.id === 6
                ? session.repeatedCardPosition === "target"
                : session.hidden.includes(card.id));
          } else if (block.id === "wrong-feedback") {
            text = "Try Again!";
            visible = teaching.interactive && session.wrongVisible;
          } else if (block.id === "correct-feedback") {
            text = "Correct!!!";
            visible =
              teaching.interactive &&
              session.correctRevisionFloor !== null &&
              Boolean(
                correct &&
                correct.revision > session.correctRevisionFloor &&
                correct.frame >= 2 &&
                correct.frame <= 29,
              );
          } else if (block.id.startsWith("help-")) {
            text = helpBlocks.find((h) => h.id === block.id)!.text;
            visible = teaching.interactive && session.help;
          }
          return { ...block, text, visible };
        }),
  };
}
function MathValue({ text }: { text: string }) {
  if (!text.includes("/")) return <span>{text}</span>;
  const [numerator, denominator] = text.split("/");
  return (
    <span
      className="g5-ti008__fraction"
      role="math"
      aria-label={`${numerator} over ${denominator}`}
    >
      <span>{numerator}</span>
      <span>{denominator}</span>
    </span>
  );
}
const CSS = `
.g5-ti008 .g5-ti008__title{font-size:clamp(1.75rem,calc(1.4rem + 1.2cqi),2.25rem);overflow-wrap:normal;hyphens:none}.g5-ti008 .g5-ti008__question h3{font-size:clamp(1.125rem,calc(1rem + 2cqi),1.65rem);overflow-wrap:normal;hyphens:none}.g5-ti008__term-run{white-space:nowrap}
.g5-ti008{box-sizing:border-box;position:relative;container:ti008 / inline-size;inline-size:100%;padding:clamp(8px,2vw,20px);font-family:var(--lesson-text-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6;color:#17273c;background:#fffdf8}.g5-ti008 *{box-sizing:border-box}.g5-ti008 h2,.g5-ti008 h3{font-family:var(--lesson-text-font-heading,"Fredoka",system-ui,sans-serif);font-weight:600;line-height:1.3;margin:0 0 1rem;overflow-wrap:anywhere}.g5-ti008 h2{font-size:1.65rem}.g5-ti008 h3{font-size:1.4rem}.g5-ti008 p{margin:.7em 0;overflow-wrap:anywhere}.g5-ti008__question{padding:clamp(12px,3cqi,24px);border:1px solid #bdd1ec;border-radius:1rem;background:#f0f6ff}.g5-ti008__table{margin:1rem 0;border:1px solid #aebed2;border-radius:.8rem;overflow:hidden}.g5-ti008__row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.g5-ti008__row+.g5-ti008__row{border-top:1px solid #bccbdd}.g5-ti008__head{background:#dfeafa;text-align:center;font-weight:700}.g5-ti008__cell{padding:.6rem;display:flex;align-items:center;justify-content:center;gap:.5em;min-block-size:5rem;min-inline-size:0;background:#fffaf1}.g5-ti008__cell+.g5-ti008__cell{border-inline-start:1px solid #bccbdd}.g5-ti008__cell-label{display:none;font-size:.9em;font-weight:700}.g5-ti008__value{font-size:1.5rem;font-weight:700;line-height:1.25;font-variant-numeric:tabular-nums}.g5-ti008__fraction{display:inline-grid;grid-template-rows:auto auto;text-align:center;white-space:nowrap;line-height:1.2;vertical-align:middle}.g5-ti008__fraction>span{padding:.12em .25em}.g5-ti008__fraction>span:first-child{border-bottom:2px solid currentColor}.g5-ti008__target{display:grid;place-items:center;min-block-size:3.5rem;inline-size:100%;font:inherit;color:inherit;background:#fff;border:2px dashed #7e9fc8;border-radius:.5rem;padding:.3rem;cursor:pointer}.g5-ti008__target[data-filled=true]{border-style:solid;border-color:#4f9269;background:#f1faf4}.g5-ti008__target[data-drag-over=true]{outline:3px solid #e5a100;background:#fff5cd}.g5-ti008__target:disabled{cursor:default}.g5-ti008__bank{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,7rem),1fr));gap:.75rem;margin:1rem 0}.g5-ti008__card{display:grid;place-items:center;inline-size:100%;min-block-size:3.5rem;font:inherit;font-size:1.4rem;font-weight:700;line-height:1.2;padding:.5rem;border:1px solid #8dabd0;border-radius:.6rem;background:#fff;color:#17273c;touch-action:none;cursor:grab;font-variant-numeric:tabular-nums;user-select:none}.g5-ti008__card[aria-pressed=true]{outline:3px solid #174ea6;background:#eaf2ff}.g5-ti008__card:disabled{cursor:default;opacity:.65}.g5-ti008 button:focus-visible{outline:3px solid #174ea6;outline-offset:3px}.g5-ti008__button{font:inherit;line-height:1.4;background:#174ea6;color:#fff;border:1px solid #174ea6;border-radius:.7rem;min-block-size:2.75rem;padding:.6rem 1rem;cursor:pointer}.g5-ti008__button:disabled{opacity:.65}.g5-ti008__feedback{padding:1rem;border:1px solid #b36744;border-radius:.8rem;background:#fff8f1;margin:1rem 0}.g5-ti008__feedback[data-correct=true]{border-color:#37804d;background:#f0faf2}.g5-ti008__dialog{position:relative;inset:auto;inline-size:100%;max-inline-size:100%;max-block-size:none;margin:1rem 0;padding:clamp(12px,3cqi,24px);border:1px solid #9fb7d5;border-radius:1rem;color:inherit;background:#fffdf8;font:inherit;overflow:visible}.g5-ti008__dialog header{display:flex;justify-content:flex-end;margin-bottom:1rem}.g5-ti008__dialog ol{padding-inline-start:1.5em}.g5-ti008__dialog li+li{margin-top:.75em}.g5-ti008__math{display:flex;flex-wrap:wrap;align-items:center;gap:.5em;font-size:1.45rem;line-height:1.4;margin:1rem 0}.g5-ti008__term{font:inherit;line-height:inherit;color:#174ea6;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;border:0;background:transparent;padding:0 .04em;max-inline-size:100%;min-block-size:44px;overflow-wrap:anywhere;text-align:inherit;cursor:pointer}.g5-ti008__ghost{position:absolute;pointer-events:none;z-index:4;transform:translate(-50%,-50%);font-size:1.4rem;font-weight:700;padding:.4rem .6rem;border:2px solid #b88212;border-radius:.5rem;background:#fff6d4;box-shadow:0 4px 12px #18364d24}.g5-ti008 [data-source-emphasis=true]{outline:3px solid #b9820e;background:#fff2c1;border-radius:.3rem}.g5-ti008__placed-card{display:grid;gap:.4rem;inline-size:100%;min-inline-size:0}.g5-ti008__guidance{font-size:1rem;color:#39516e}.g5-ti008__sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@container ti008 (max-width:32rem){.g5-ti008__head{display:none}.g5-ti008__row{grid-template-columns:1fr}.g5-ti008__cell{justify-content:space-between;min-block-size:4rem;gap:.7rem}.g5-ti008__cell+.g5-ti008__cell{border-inline-start:0;border-top:1px dashed #d4dce7}.g5-ti008__cell-label{display:block;max-inline-size:48%;overflow-wrap:normal;hyphens:none}.g5-ti008__cell .g5-ti008__value,.g5-ti008__cell .g5-ti008__target,.g5-ti008__cell .g5-ti008__placed-card{inline-size:auto;min-inline-size:40%;max-inline-size:52%}.g5-ti008__row+.g5-ti008__row{border-top:3px solid #94abc7}}
.g5-ti008 .g5-ti008__term{overflow-wrap:normal;hyphens:none}.g5-ti008 .g5-ti008__dialog{font-size:clamp(1.125rem,calc(1rem + 1cqi),1.25rem)}
@container ti008 (max-width:17rem){.g5-ti008__dialog ol{padding-inline-start:0}.g5-ti008__cell{flex-direction:column;align-items:stretch;text-align:center}.g5-ti008__cell-label,.g5-ti008__cell .g5-ti008__value,.g5-ti008__cell .g5-ti008__target,.g5-ti008__cell .g5-ti008__placed-card{max-inline-size:100%;inline-size:100%}}
`;
export function G5L2Ti008ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {
    ...props,
    frameDomain: props.frameDomain ?? DOMAIN,
  };
  const state =
    props.state &&
    typeof props.state === "object" &&
    "sourceSwfSha256" in props.state
      ? (props.state as SourceStaticCanvasFrameState)
      : getCourseG05L02Ti008FrameState(props.frame, context);
  const [stored, setStored] = useState(() =>
    createTi008Session(props.seed, props.replay ?? 0),
  );
  const session = syncTi008Session(stored, context),
    activities = props.lessonActivities ?? [],
    teaching = getTi008TeachingState(state.frame),
    snapshot = getG5L2Ti008TextSnapshot(state, context, session, activities);
  const ready = snapshot.status === "ready" && !props.entryStateSha256,
    interactive = ready && teaching.interactive && session.pendingFrom !== 227,
    enabled =
      interactive &&
      session.controlsEnabled &&
      !session.help &&
      Boolean(props.onLessonActivityRequest);
  const root = useRef<HTMLElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    helpTrigger = useRef<HTMLButtonElement>(null),
    wrongClose = useRef<HTMLButtonElement>(null),
    targetRefs = useRef<Record<number, HTMLButtonElement | null>>({}),
    cardRefs = useRef<Record<number, HTMLButtonElement | null>>({}),
    demoPalette = useRef<HTMLDivElement>(null),
    demoTarget = useRef<HTMLDivElement>(null);
  const keyboardTargetRequested = useRef(false);
  const pointer = useRef<{
    id: number;
    card: Ti008CardId;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [pointerVisual, setPointerVisual] = useState<{
      card: Ti008CardId;
      x: number;
      y: number;
      target: number | null;
    } | null>(null),
    [demoGeometry, setDemoGeometry] = useState<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    } | null>(null);
  const wrong = ti008Activity(activities, "wrong"),
    coach = ti008Activity(activities, "coach"),
    correct = ti008Activity(activities, "correct");
  const text = (id: string) =>
    snapshot.blocks.find((b) => b.id === id && b.visible)?.text ?? "";
  function dispatch(action: Ti008Action) {
    if (!ready) return false;
    const enriched: Ti008Action =
      action.type === "drop"
        ? { ...action, coachRevisionFloor: coach?.revision ?? -1 }
        : action.type === "coach-complete"
          ? { ...action, correctRevisionFloor: correct?.revision ?? -1 }
          : action;
    const result = reduceTi008Session(session, state.frame, enriched);
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
    if (keyboardTargetRequested.current && session.selected !== null) {
      keyboardTargetRequested.current = false;
      targetRefs.current[1]?.focus();
    }
  }, [session.selected]);
  useEffect(() => {
    if (coach?.status === "completed")
      dispatch({ type: "coach-complete", activity: coach });
  }, [
    coach,
    session.coachRevisionFloor,
    session.consumedCoachRevision,
    session.matchCount,
  ]);
  useEffect(() => {
    if (correct?.status === "completed")
      dispatch({ type: "correct-complete", activity: correct });
  }, [
    correct,
    session.correctRevisionFloor,
    session.consumedCorrectRevision,
    session.matchCount,
  ]);
  useEffect(() => {
    if (session.help && !dialog.current?.open) dialog.current?.show();
    return () => {
      if (session.help) helpTrigger.current?.focus();
    };
  }, [session.help]);
  useEffect(() => {
    if (session.wrongVisible) wrongClose.current?.focus();
  }, [session.wrongVisible]);
  useEffect(() => {
    pointer.current = null;
    setPointerVisual(null);
  }, [props.replay, props.seed]);
  useLayoutEffect(() => {
    const measure = () => {
      if (!root.current || !demoPalette.current || !demoTarget.current) return;
      const r = root.current.getBoundingClientRect(),
        from = demoPalette.current.getBoundingClientRect(),
        to = demoTarget.current.getBoundingClientRect();
      const next = {
        fromX: from.x + from.width / 2 - r.x,
        fromY: from.y + from.height / 2 - r.y,
        toX: to.x + to.width / 2 - r.x,
        toY: to.y + to.height / 2 - r.y,
      };
      setDemoGeometry((old) =>
        old &&
        Object.keys(next).every(
          (key) =>
            Math.abs(
              old[key as keyof typeof next] - next[key as keyof typeof next],
            ) < 0.5,
        )
          ? old
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (root.current) observer.observe(root.current);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [teaching.cardsVisible, teaching.tableVisible, teaching.demoVisible]);
  if (snapshot.status !== "ready") return null;
  const term = (name: keyof typeof G5_L2_TI008_TERMS, label: string) => {
    const entry = G5_L2_TI008_TERMS[name];
    return (
      <button
        type="button"
        className="g5-ti008__term"
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
  const instruction = teaching.instruction
    .split(/((?:fraction|decimal|percent|equivalents|table)[,.]?)/g)
    .map((part, index) => {
      const names: Record<string, keyof typeof G5_L2_TI008_TERMS> = {
        fraction: "Fraction",
        decimal: "Decimal",
        percent: "Percent",
        equivalents: "Equivalent",
        table: "Table",
      };
      const word = part.replace(/[,.]$/, "");
      return names[word] ? (
        <span className="g5-ti008__term-run" key={index}>
          {term(names[word]!, word)}{part.slice(word.length)}
        </span>
      ) : (
        part
      );
    });
  const pointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    current.moved =
      current.moved ||
      Math.hypot(event.clientX - current.x, event.clientY - current.y) > 6;
    if (!current.moved) return;
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-drop-target]");
    setPointerVisual({
      card: current.card,
      x: event.clientX - rect.x,
      y: event.clientY - rect.y,
      target: target ? Number(target.getAttribute("data-drop-target")) : null,
    });
  };
  const cardButton = (
    card: (typeof G5_L2_TI008_CARDS)[number],
    placed = false,
  ) => (
    <button
      key={card.id}
      ref={(node) => {
        cardRefs.current[card.id] = node;
      }}
      type="button"
      className="g5-ti008__card"
      data-source-card={card.id}
      data-card-placement={placed ? "target" : "palette"}
      data-source-emphasis={card.id === 3 && teaching.emphasis}
      data-lesson-text-block={placed ? `target-${card.id}` : `card-${card.id}`}
      aria-label={`${card.text}${placed ? ", placed card" : ""}`}
      aria-pressed={session.selected === card.id}
      disabled={!enabled}
      onClick={() => {
        if (pointer.current?.moved) return;
        dispatch({ type: "select", card: card.id });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dispatch({ type: "cancel-selection" });
        } else if (event.key === "ArrowDown" && enabled) {
          event.preventDefault();
          if (dispatch({ type: "select", card: card.id }))
            keyboardTargetRequested.current = true;
        }
      }}
      onPointerDown={(event) => {
        if (!enabled || event.button !== 0) return;
        pointer.current = {
          id: event.pointerId,
          card: card.id,
          x: event.clientX,
          y: event.clientY,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        dispatch({ type: "select", card: card.id });
      }}
      onPointerMove={pointerMove}
      onPointerUp={(event) => {
        const current = pointer.current;
        if (!current || current.id !== event.pointerId) return;
        if (current.moved) {
          const target = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest("[data-drop-target]");
          dispatch({
            type: "drop",
            card: current.card,
            target: target
              ? Number(target.getAttribute("data-drop-target"))
              : null,
          });
          event.preventDefault();
        }
        event.currentTarget.releasePointerCapture(event.pointerId);
        setPointerVisual(null);
        pointer.current = null;
      }}
      onPointerCancel={() => {
        pointer.current = null;
        setPointerVisual(null);
        dispatch({ type: "cancel-selection" });
      }}
    >
      <MathValue text={card.text} />
    </button>
  );
  const selectedCard = G5_L2_TI008_CARDS.find((c) => c.id === session.selected);
  return (
    <section
      ref={root}
      className="g5-ti008"
      lang="en"
      data-modern-lesson="g5-l2-ti008"
      data-source-language-disposition="source-shared-untranslated-visual"
      data-flash-frame={state.frame}
      data-flash-frame-domain={DOMAIN}
      data-flash-root-frame={6}
      data-runtime-seed={state.seed}
      data-runtime-replay={props.replay ?? 0}
      data-source-match-count={session.matchCount}
      data-source-unique-hidden-count={session.hidden.length}
      data-source-repeat-card-position={session.repeatedCardPosition}
      data-source-controls-enabled={session.controlsEnabled}
      data-source-selected-card={session.selected ?? ""}
      data-help-state={session.help ? "open" : "closed"}
      data-wrong-visible={session.wrongVisible}
      data-source-wrong-frame={wrong?.frame ?? ""}
      data-source-wrong-status={wrong?.status ?? "inactive"}
      data-source-wrong-revision={wrong?.revision ?? ""}
      data-source-coach-frame={coach?.frame ?? ""}
      data-source-coach-status={coach?.status ?? "inactive"}
      data-source-coach-revision={coach?.revision ?? ""}
      data-source-correct-frame={correct?.frame ?? ""}
      data-source-correct-status={correct?.status ?? "inactive"}
      data-source-correct-revision={correct?.revision ?? ""}
      data-terminal-outcome={session.outcome ?? "none"}
      data-source-demo-progress={teaching.demoProgress}
    >
      <style>{CSS}</style>
      <h2
        className="g5-ti008__title"
        data-lesson-text-block="root-title"
        data-source-shape-id={G5_L2_TI008_SOURCE_TITLE.characterId}
        data-source-shape-sha256={G5_L2_TI008_SOURCE_TITLE.sourceTagSha256}
        data-native-copy-authority={G5_L2_TI008_SOURCE_TITLE.copyAuthority}
      >
        {G5_L2_TI008_SOURCE_TITLE.text}
      </h2>
      {teaching.instruction && (
        <div className="g5-ti008__question">
          <h3 data-lesson-text-block="instruction">{instruction}</h3>
        </div>
      )}
      {teaching.tableVisible && (
        <div
          className="g5-ti008__table"
          role="table"
          aria-label="Fraction, decimal and percent equivalents"
        >
          <div className="g5-ti008__row g5-ti008__head" role="row">
            {(["Fraction", "Decimal", "Percent"] as const).map(
              (name, column) => (
                <div
                  role="columnheader"
                  key={name}
                  className="g5-ti008__cell"
                  data-lesson-text-block={`column-${column}`}
                >
                  {term(name, name)}
                </div>
              ),
            )}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              className="g5-ti008__row"
              role="row"
              aria-label={`Row ${row + 1}`}
              key={row}
            >
              {[0, 1, 2].map((column) => {
                const given = G5_L2_TI008_GIVENS.find(
                    (g) => g.row === row && g.column === column,
                  ),
                  card = G5_L2_TI008_CARDS.find(
                    (c) => c.row === row && c.column === column,
                  ),
                  filled =
                    card &&
                    (card.id === 6
                      ? session.repeatedCardPosition === "target"
                      : session.hidden.includes(card.id));
                return (
                  <div
                    ref={row === 0 && column === 1 ? demoTarget : undefined}
                    role="cell"
                    className="g5-ti008__cell"
                    data-drop-target={card?.id ?? 0}
                    data-table-row={row}
                    data-table-column={column}
                    key={column}
                  >
                    <span className="g5-ti008__cell-label" data-responsive-column-label={`column-${column}`}>
                      {["Fraction", "Decimal", "Percent"][column]}
                    </span>
                    {given ? (
                      <div
                        className="g5-ti008__value"
                        data-lesson-text-block={`given-${row}-${column}`}
                        data-source-emphasis={row === 0 && teaching.emphasis}
                      >
                        <MathValue text={given.text} />
                      </div>
                    ) : card?.id === 6 && filled ? (
                      <div className="g5-ti008__placed-card">{cardButton(card, true)}{session.selected !== null && <button ref={node => {targetRefs.current[6] = node;}} type="button" className="g5-ti008__target" data-source-target="6" aria-label="Row 1, Percent, selected card destination" disabled={!enabled} onClick={() => {if(session.selected !== null)dispatch({type:"drop",card:session.selected,target:6});}}><span aria-hidden="true">＋</span></button>}</div>
                    ) : (
                      <button
                        ref={(node) => {
                          if (card) targetRefs.current[card.id] = node;
                        }}
                        type="button"
                        className="g5-ti008__target"
                        data-source-target={card!.id}
                        data-filled={Boolean(filled)}
                        data-drag-over={pointerVisual?.target === card!.id}
                        aria-label={`Row ${row + 1}, ${["Fraction", "Decimal", "Percent"][column]}${filled ? `, ${card!.text}` : ""}`}
                        disabled={!enabled || session.selected === null}
                        onClick={() => {
                          if (session.selected !== null)
                            dispatch({
                              type: "drop",
                              card: session.selected,
                              target: card!.id,
                            });
                        }}
                        onKeyDown={(event) => {
                          const sequence = [1, 2, 3, 4, 5, 6, 7, 8],
                            index = sequence.indexOf(card!.id);
                          if (event.key === "Escape") {
                            event.preventDefault();
                            dispatch({ type: "cancel-selection" });
                            if (session.selected !== null)
                              cardRefs.current[session.selected]?.focus();
                          } else if (
                            event.key === "ArrowRight" ||
                            event.key === "ArrowDown" ||
                            event.key === "ArrowLeft" ||
                            event.key === "ArrowUp"
                          ) {
                            event.preventDefault();
                            targetRefs.current[
                              sequence[
                                (index +
                                  (["ArrowRight", "ArrowDown"].includes(
                                    event.key,
                                  )
                                    ? 1
                                    : 7)) %
                                  8
                              ]!
                            ]?.focus();
                          }
                        }}
                      >
                        {filled ? (
                          <span
                            className="g5-ti008__value"
                            data-lesson-text-block={`target-${card!.id}`}
                          >
                            <MathValue text={card!.text} />
                          </span>
                        ) : (
                          <span aria-hidden="true">＋</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {teaching.cardsVisible && (
        <div className="g5-ti008__bank" aria-label="Cards">
          {G5_L2_TI008_CARDS.filter(
            (card) =>
              !session.hidden.includes(card.id) &&
              (card.id !== 6 || session.repeatedCardPosition === "palette"),
          ).map((card) => (
            <div
              key={card.id}
              ref={card.id === 3 ? demoPalette : undefined}
              style={
                card.id === 3 && teaching.demoVisible
                  ? { visibility: "hidden" }
                  : undefined
              }
            >
              {teaching.interactive ? (
                cardButton(card)
              ) : (
                <div
                  className="g5-ti008__card"
                  data-lesson-text-block={`card-${card.id}`}
                  data-source-emphasis={card.id === 3 && teaching.emphasis}
                >
                  <MathValue text={card.text} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {teaching.demoVisible && demoGeometry && (
        <div
          className="g5-ti008__ghost"
          data-source-demonstration="decimal-03"
          aria-label="Example: 0.3 moves to the decimal cell for 3/10"
          style={{
            left:
              demoGeometry.fromX +
              (demoGeometry.toX - demoGeometry.fromX) * teaching.demoProgress,
            top:
              demoGeometry.fromY +
              (demoGeometry.toY - demoGeometry.fromY) * teaching.demoProgress,
          }}
        >
          0.3
        </div>
      )}
      {pointerVisual && (
        <div
          className="g5-ti008__ghost"
          aria-hidden="true"
          style={{ left: pointerVisual.x, top: pointerVisual.y }}
        >
          <MathValue
            text={
              G5_L2_TI008_CARDS.find((c) => c.id === pointerVisual.card)!.text
            }
          />
        </div>
      )}
      {interactive && (
        <p className="g5-ti008__guidance" aria-live="polite">
          {selectedCard
            ? `Selected ${selectedCard.text}. Choose its matching table cell.`
            : "Drag a card to the table, or select a card and then its matching cell."}
        </p>
      )}
      {interactive && session.controlsEnabled && !session.help && (
        <button
          ref={helpTrigger}
          type="button"
          className="g5-ti008__button"
          onClick={() => dispatch({ type: "help" })}
        >
          Need More Help
        </button>
      )}
      {interactive && session.wrongVisible && (
        <div className="g5-ti008__feedback" role="status">
          <h3 data-lesson-text-block="wrong-feedback">Try Again!</h3>
          <button
            ref={wrongClose}
            type="button"
            className="g5-ti008__button"
            onClick={() => dispatch({ type: "close-wrong" })}
          >
            Close feedback
          </button>
        </div>
      )}
      {text("correct-feedback") && (
        <div className="g5-ti008__feedback" data-correct="true" role="status">
          <h3 data-lesson-text-block="correct-feedback">Correct!!!</h3>
        </div>
      )}
      {interactive && session.help && (
        <dialog
          ref={dialog}
          className="g5-ti008__dialog"
          aria-label="Expressing a fraction as a decimal"
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
              className="g5-ti008__button"
              onClick={() => dispatch({ type: "close-help" })}
            >
              Close
            </button>
          </header>
          <h3 data-lesson-text-block="help-rule">
            To {term("Express", "express")} a {term("Fraction", "fraction")} as
            a {term("Decimal", "decimal")}:
          </h3>
          <ol>
            <li data-lesson-text-block="help-step1">
              Find an {term("Equivalent", "equivalent")} fraction with a{" "}
              {term("Denominator", "denominator")} of 100.
            </li>
            <li data-lesson-text-block="help-step2">
              Drop the denominator and use the {term("Numerator", "numerator")}{" "}
              as the decimal number.
            </li>
            <li data-lesson-text-block="help-step3">
              Move the {term("Decimal point", "decimal point")} two places to
              the left.
            </li>
          </ol>
          <h3 data-lesson-text-block="help-example">Example:</h3>
          <div
            className="g5-ti008__math"
            role="math"
            aria-label="7 over 25 equals 7 times 4 over 25 times 4 equals 28 over 100 equals 0.28"
            data-lesson-text-block="help-equivalent-example"
          >
            <MathValue text="7/25" />
            <span>=</span>
            <MathValue text="7 × 4/25 × 4" />
            <span>=</span>
            <MathValue text="28/100" />
            <span>= 0.28</span>
          </div>
          <p data-lesson-text-block="help-division-rule">
            {text("help-division-rule")}
          </p>
          <div
            className="g5-ti008__math"
            role="math"
            aria-label="7 over 25 equals 7 divided by 25 equals 0.28"
            data-lesson-text-block="help-division-example"
          >
            <MathValue text="7/25" />
            <span>= 7 ÷ 25 = 0.28</span>
          </div>
        </dialog>
      )}
    </section>
  );
}
export const G5_L2_TI008_TEXT_PRESENTATION = Object.freeze({
  schemaVersion: 1,
  binding: G5_L2_TI008_TEXT_BINDING,
  Renderer: G5L2Ti008ModernRenderer,
  getSnapshot: getG5L2Ti008TextSnapshot,
  playbackEndFrameByDomain: { "sprite-124": 227 },
  reducedMotionFrameByDomain: { "sprite-124": 227 },
  frameControl: {
    frameDomain: DOMAIN,
    completionFrame: 273,
    transitions: G5_L2_TI008_TRANSITIONS,
  },
  activityTimelines: G5_L2_TI008_ACTIVITIES,
  sourceTimelineAudioCues: [
    {
      id: "source-main",
      frame: 2,
      endFrame: 274,
      frameDomain: DOMAIN,
      language: "shared",
      spokenLanguage: "undetermined",
      source: `/lesson-typography-v1/audio/${ID}/main.mp3`,
      sha256:
        "038acaf0cd23cf38c21bd140b49e70061751b4083ed52906f575eed77843dcae",
    },
  ],
  keyTerms: {
    indexLanguage: "en",
    sourceAssetId: "ELKTEG4.xml",
    sourceSha256:
      "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
    entryIds: Object.values(G5_L2_TI008_TERMS).map((term) => term.entryId),
  },
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>);
