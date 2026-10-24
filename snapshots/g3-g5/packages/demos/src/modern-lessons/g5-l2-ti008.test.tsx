import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RuntimeContext } from "../contract";
import type { LessonTextActivitySnapshot } from "../lesson-text-contract";
import { getCourseG05L02Ti008FrameState } from "../modules/course-g05-l02-ti-008";
import {
  G5L2Ti008ModernRenderer,
  G5_L2_TI008_TEXT_BINDING,
  G5_L2_TI008_SOURCE_TITLE,
  G5_L2_TI008_TEXT_PRESENTATION,
  G5_L2_TI008_CARDS,
  G5_L2_TI008_GIVENS,
  G5_L2_TI008_WORDS,
  G5_L2_TI008_TERMS,
  G5_L2_TI008_ACTIVITIES,
  createTi008Session,
  syncTi008Session,
  reduceTi008Session,
  ti008Activity,
  ti008CardAvailable,
  getTi008TeachingState,
  getG5L2Ti008TextSnapshot,
} from "./g5-l2-ti008";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const hash = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
const json = async (path: string) =>
  JSON.parse(await readFile(root + path, "utf8"));
const asset = (async () => {
  const summary = await json(
    "work/typography-v1/g5-l2-ti008/source-summary.json",
  );
  return JSON.parse(
    gunzipSync(await readFile(root + summary.placement.assetPath)).toString(),
  );
})();
const actions = (async () =>
  gunzipSync(
    await readFile(
      root +
        "migrations/course-g05-l02-ti-008/audit/machine/ffdec-scripts.txt.gz",
    ),
  ).toString())();
const context = (
  frame: number,
  extra: Partial<RuntimeContext> = {},
): RuntimeContext => ({
  frame,
  frameDomain: "sprite-124",
  rootFrame: 6,
  scenario: "source-static-frame",
  lang: "en",
  seed: 0,
  replay: 0,
  ...extra,
});
const activity = (
  id: "wrong" | "coach" | "correct",
  frame: number,
  status: "playing" | "completed" = "playing",
  revision = 1,
): LessonTextActivitySnapshot => {
  const definition = G5_L2_TI008_ACTIVITIES.find((d) => d.id === id)!;
  return {
    id,
    frameDomain: definition.frameDomain,
    sourceInstanceId: definition.sourceInstanceId,
    frame,
    status,
    revision,
  };
};

test("the exact source remains SWF-only and all text and shape block IDs resolve", async () => {
  const bindings = await json(
    "work/typography-v1/g5-l2-ti008/source-bindings.json",
  );
  for (const b of bindings)
    if (b.present !== false)
      assert.equal(hash(await readFile(b.path)), b.sha256);
  assert.equal(
    bindings.find((b: any) => b.path.endsWith(".fla"))?.present,
    false,
  );
  const source = await asset;
  assert.equal(source.sourceSha256, G5_L2_TI008_TEXT_BINDING.sourceSwfSha256);
  assert.equal(source.summary.staticTextDefinitions, 44);
  assert.equal(source.summary.dynamicFields, 0);
  assert.equal(source.summary.bitmapDefinitions, 0);
  const textIds = new Set(
    source.textDefinitions.flatMap((d: any) => [
      d.sourceTextId,
      ...(d.runs ?? []).map((r: any) => r.sourceTextId),
    ]),
  );
  const shapes = new Set(
    source.shapeDefinitions.map((s: any) => s.characterId),
  );
  for (const block of G5_L2_TI008_TEXT_BINDING.blocks) {
    for (const id of block.sourceTextIds) assert(textIds.has(id), id);
    for (const id of block.sourceShapeIds ?? [])
      assert(shapes.has(id), String(id));
  }
  assert.equal(
    new Set(G5_L2_TI008_TEXT_BINDING.blocks.map((b) => b.readingOrder)).size,
    G5_L2_TI008_TEXT_BINDING.blocks.length,
  );
});
test("the outlined root title precedes instruction throughout demonstration, interaction and completion", async () => {
  const source = await asset;
  const shape = source.shapeDefinitions.find((s: any) => s.characterId === 11);
  assert.equal(shape.sourceTagSha256, G5_L2_TI008_SOURCE_TITLE.sourceTagSha256);
  assert.equal(shape.sourceTagOffset, 7078);
  const rootTimeline = source.timelines.find((t: any) => t.timelineId === "root");
  const instance = rootTimeline.instances.find((i: any) => i.instanceId === G5_L2_TI008_SOURCE_TITLE.instanceId);
  assert.equal(instance.characterId, 11);
  assert.equal(instance.firstFrame, 6);
  assert.equal(instance.lastFrameExclusive, 11);
  const placement = rootTimeline.events.find((e: any) => e.eventId === instance.createdByEventId);
  assert.equal(placement.eventId, "root/tag-7882");
  assert.deepEqual(placement.matrix, [1, 0, 0, 1, 0, 0]);
  const title = G5_L2_TI008_TEXT_BINDING.blocks[0]!;
  assert.equal(title.id, "root-title");
  assert.equal(title.role, "title");
  assert.deepEqual(title.sourceTextIds, []);
  assert.deepEqual(title.sourceShapeIds, [11]);
  assert.equal(title.instance?.id, instance.instanceId);
  assert.equal(G5_L2_TI008_TEXT_BINDING.blocks.length, 35);
  for (const frame of [1, 2, 7, 8, 70, 120, 160, 166, 200, 206, 227, 228, 273]) {
    const ctx = context(frame), state = getCourseG05L02Ti008FrameState(frame, ctx);
    const snapshot = getG5L2Ti008TextSnapshot(state, ctx);
    assert.equal(snapshot.status, "ready");
    assert.equal(snapshot.blocks[0].text, "Percents: Try It!");
    assert.equal(snapshot.blocks[0].visible, true);
    const instruction = snapshot.blocks.find((b) => b.id === "instruction")!;
    assert(snapshot.blocks[0].readingOrder < instruction.readingOrder);
    assert.equal(instruction.visible, frame >= 8);
    const markup = renderToStaticMarkup(createElement(G5L2Ti008ModernRenderer, { ...ctx, state }));
    assert.match(markup, /<h2[^>]*data-lesson-text-block="root-title"[^>]*>Percents: Try It!<\/h2>/);
    if (frame >= 8) {
      assert.match(markup, /<h3[^>]*data-lesson-text-block="instruction"/);
      assert(markup.indexOf('data-lesson-text-block="root-title"') < markup.indexOf('data-lesson-text-block="instruction"'));
    }
  }
  const ctx = context(227), state = getCourseG05L02Ti008FrameState(227, ctx);
  const help = reduceTi008Session(createTi008Session(), 227, { type: "help" }).nextState;
  assert.equal(getG5L2Ti008TextSnapshot(state, ctx, help).blocks[0].visible, true);
  const wrongRoot = context(227, { rootFrame: 5 });
  assert.equal(getG5L2Ti008TextSnapshot(getCourseG05L02Ti008FrameState(227, wrongRoot), wrongRoot).status, "blocked");
});
test("four givens and eight draggable cards are source-correct equivalent row values", () => {
  assert.deepEqual(
    G5_L2_TI008_GIVENS.map((g) => g.text),
    ["3/10", "0.12", "1/100", "40%"],
  );
  const numeric = (text: string): number =>
    text.includes("/")
      ? Number(text.split("/")[0]) / Number(text.split("/")[1])
      : text.endsWith("%")
        ? parseFloat(text) / 100
        : Number(text);
  for (const card of G5_L2_TI008_CARDS)
    assert.equal(
      numeric(card.text),
      numeric(G5_L2_TI008_GIVENS.find((g) => g.row === card.row)!.text),
    );
  assert.deepEqual(
    G5_L2_TI008_CARDS.map((c) => c.id),
    [8, 6, 2, 3, 1, 4, 7, 5],
  );
});
test("shape labels and the Symbol multiplication sign retain exact source outlines", async () => {
  const evidence = await json(
    "work/typography-v1/g5-l2-ti008/source-timing.json",
  );
  assert.equal(evidence.shapes.length, 7);
  for (const shape of evidence.shapes) {
    assert.equal(
      G5_L2_TI008_CARDS.find((c) => c.id === shape.id)?.text,
      shape.text,
    );
    for (const path of shape.paths) assert.equal(hash(path.path), path.sha256);
  }
  const symbol = await json(
    "work/typography-v1/g5-l2-ti008/symbol-glyph-resolution.json",
  );
  assert.equal(symbol.sourceCode, 61620);
  assert.equal(symbol.value, "×");
  assert.equal(hash(symbol.outline), symbol.outlineSha256);
  const source = await asset;
  assert.equal(
    source.textDefinitions.find((d: any) => d.characterId === 108).runs[0].text,
    null,
  );
});
test("instruction words, table reveal and automatic decimal demonstration follow source frames", async () => {
  const timing = await json(
    "work/typography-v1/g5-l2-ti008/source-timing.json",
  );
  assert.deepEqual(
    G5_L2_TI008_WORDS,
    timing.question.words.map(
      ({ text, frame }: { text: string; frame: number }) => ({ text, frame }),
    ),
  );
  assert.equal(getTi008TeachingState(1).tableVisible, false);
  assert.equal(getTi008TeachingState(2).tableVisible, true);
  assert.equal(getTi008TeachingState(6).cardsVisible, false);
  assert.equal(getTi008TeachingState(7).cardsVisible, true);
  assert.equal(getTi008TeachingState(159).demoVisible, false);
  assert.equal(getTi008TeachingState(160).demoProgress, 1 / 7);
  assert.equal(getTi008TeachingState(166).demoProgress, 1);
  assert.equal(getTi008TeachingState(199).demoProgress, 1);
  assert.equal(getTi008TeachingState(200).demoProgress, 6 / 7);
  assert.equal(getTi008TeachingState(206).demoVisible, false);
  for (const point of timing.demonstration.points.filter(
    (p: any) => p.frame >= 160,
  ))
    assert(
      Math.abs(
        getTi008TeachingState(point.frame).demoProgress -
          (2736 - point.yTwips) / (2736 + 1408),
      ) < 1e-9,
    );
});
test("each concurrent child has the exact source name, depth-generation and parent removal at228", async () => {
  const timing = await json(
    "work/typography-v1/g5-l2-ti008/source-timing.json",
  );
  for (const definition of G5_L2_TI008_ACTIVITIES) {
    const evidence = timing.sourceChildren.find(
      (c: any) => c.id === definition.id,
    );
    assert.equal(definition.sourceInstanceId, evidence.sourceInstanceId);
    assert.deepEqual(definition.parentLifetime, evidence.parentLifetime);
    assert.equal(evidence.removal.frame, 228);
    assert.equal(evidence.instance.firstFrame, 227);
    assert.equal(evidence.rootInstance.characterId, 124);
  }
  assert.deepEqual(
    G5_L2_TI008_ACTIVITIES.map((d) => [d.id, d.startFrame, d.endFrame]),
    [
      ["wrong", 2, 15],
      ["coach", 2, 20],
      ["correct", 2, 29],
    ],
  );
});
test("correct drops hide seven cards while the authored Scr6 remains visible at its target", async () => {
  const script = await actions;
  assert.match(script, /this\.gotoAndStop\(2\);[\s\S]{0,250}enabled = false;/);
  assert.match(script, /eval\("Scr_" \+ i\)\.enabled = true/);
  for (const card of G5_L2_TI008_CARDS) {
    const result = reduceTi008Session(createTi008Session(), 227, {
      type: "drop",
      card: card.id,
      target: card.id,
    });
    assert.equal(result.activityRequest?.id, "coach");
    assert.equal(result.nextState.matchCount, 1);
    assert.equal(result.nextState.controlsEnabled, false);
    if (card.id === 6) {
      assert.equal(result.nextState.repeatedCardPosition, "target");
      assert.deepEqual(result.nextState.hidden, []);
    } else assert.deepEqual(result.nextState.hidden, [card.id]);
  }
});
test("first correct coach ends at20 and re-enables controls independently of remaining wrong audio", () => {
  const wrong = reduceTi008Session(createTi008Session(), 227, {
    type: "drop",
    card: 8,
    target: 1,
  }).nextState;
  const closed = reduceTi008Session(wrong, 227, { type: "close-wrong" });
  assert.equal(closed.activityRequest, null);
  assert.equal(closed.nextState.controlsEnabled, true);
  assert.equal(closed.nextState.wrongVisible, false);
  const accepted = reduceTi008Session(closed.nextState, 227, {
    type: "drop",
    card: 8,
    target: 8,
  }).nextState;
  assert.equal(
    reduceTi008Session(accepted, 227, {
      type: "coach-complete",
      activity: activity("coach", 19, "completed"),
    }).allowed,
    false,
  );
  const done = reduceTi008Session(accepted, 227, {
    type: "coach-complete",
    activity: activity("coach", 20, "completed"),
  });
  assert.equal(done.nextState.controlsEnabled, true);
  assert.equal(done.activityRequest, null);
  assert.equal(
    ti008Activity(
      [activity("wrong", 10), activity("coach", 20, "completed")],
      "wrong",
    )?.frame,
    10,
  );
});
test("wrong Close is immediately available and sends no stop or replacement activity", () => {
  const wrong = reduceTi008Session(createTi008Session(), 227, {
    type: "drop",
    card: 3,
    target: null,
  });
  assert.equal(wrong.activityRequest?.id, "wrong");
  assert.equal(wrong.nextState.wrongVisible, true);
  const close = reduceTi008Session(wrong.nextState, 227, {
    type: "close-wrong",
  });
  assert.equal(close.allowed, true);
  assert.equal(close.activityRequest, null);
  assert.equal(close.frameRequest, null);
  assert.equal(close.nextState.matchCount, 0);
});
test("source count includes repeat Scr6 matches and is not silently replaced by eight unique cards", () => {
  let session = createTi008Session();
  for (let count = 1; count <= 8; count++) {
    session = reduceTi008Session(session, 227, {
      type: "drop",
      card: 6,
      target: 6,
      coachRevisionFloor: count - 1,
    }).nextState;
    const done = reduceTi008Session(session, 227, {
      type: "coach-complete",
      activity: activity("coach", 20, "completed", count),
      correctRevisionFloor: 0,
    });
    session = done.nextState;
    assert.equal(session.matchCount, count);
    assert.deepEqual(session.hidden, []);
    assert.equal(session.repeatedCardPosition, "target");
    assert.equal(done.activityRequest?.id, count === 8 ? "correct" : undefined);
  }
  assert.equal(ti008CardAvailable(session, 6), true);
  assert.equal(ti008CardAvailable(session, 8), true);
  const finish = reduceTi008Session(session, 227, {
    type: "correct-complete",
    activity: activity("correct", 29, "completed", 9),
  });
  assert.deepEqual(finish.frameRequest, {
    fromFrame: 227,
    toFrame: 228,
    stopFrame: 273,
  });
  assert.equal(finish.nextState.outcome, "source-count-complete");
});
test("moving accepted Scr6 to a wrong location returns it to its palette without subtracting the counter", () => {
  let session = reduceTi008Session(createTi008Session(), 227, {
    type: "drop",
    card: 6,
    target: 6,
  }).nextState;
  session = reduceTi008Session(session, 227, {
    type: "coach-complete",
    activity: activity("coach", 20, "completed"),
  }).nextState;
  const wrong = reduceTi008Session(session, 227, {
    type: "drop",
    card: 6,
    target: 1,
  });
  assert.equal(wrong.nextState.repeatedCardPosition, "palette");
  assert.equal(wrong.nextState.matchCount, 1);
  assert.equal(wrong.activityRequest?.id, "wrong");
});
test("eight unique matches start correct only after the eighth coach and preserve current revision identity", () => {
  let session = createTi008Session(),
    revision = 0;
  for (const card of G5_L2_TI008_CARDS) {
    session = reduceTi008Session(session, 227, {
      type: "drop",
      card: card.id,
      target: card.id,
      coachRevisionFloor: revision,
    }).nextState;
    revision++;
    const completed = reduceTi008Session(session, 227, {
      type: "coach-complete",
      activity: activity("coach", 20, "completed", revision),
    });
    session = completed.nextState;
    if (session.matchCount < 8) assert.equal(completed.activityRequest, null);
    else assert.equal(completed.activityRequest?.id, "correct");
  }
  assert.equal(session.hidden.length, 7);
  assert.equal(session.matchCount, 8);
  assert.equal(
    reduceTi008Session(session, 227, {
      type: "correct-complete",
      activity: activity("correct", 28, "completed", 9),
    }).allowed,
    false,
  );
  assert.equal(
    reduceTi008Session(session, 227, {
      type: "correct-complete",
      activity: activity("correct", 29, "completed", 9),
    }).allowed,
    true,
  );
});
test("same-instance replay cannot let a stale coach or correct snapshot finish a newer request", () => {
  let session = { ...createTi008Session(), matchCount: 7 };
  session = reduceTi008Session(session, 227, {
    type: "drop",
    card: 6,
    target: 6,
    coachRevisionFloor: 3,
  }).nextState;
  assert.equal(
    reduceTi008Session(session, 227, {
      type: "coach-complete",
      activity: activity("coach", 20, "completed", 3),
    }).allowed,
    false,
  );
  session = reduceTi008Session(session, 227, {
    type: "coach-complete",
    activity: activity("coach", 20, "completed", 4),
    correctRevisionFloor: 5,
  }).nextState;
  assert.equal(
    reduceTi008Session(session, 227, {
      type: "correct-complete",
      activity: activity("correct", 29, "completed", 5),
    }).allowed,
    false,
  );
  assert.equal(
    reduceTi008Session(session, 227, {
      type: "coach-complete",
      activity: activity("coach", 20, "completed", 4),
    }).allowed,
    false,
  );
});
test("Help adapts to source control enable/disable while close does not advance the timeline", () => {
  const opened = reduceTi008Session(createTi008Session(), 227, {
    type: "help",
  });
  assert.equal(opened.nextState.help, true);
  assert.equal(opened.nextState.controlsEnabled, false);
  assert.equal(opened.activityRequest, null);
  assert.equal(opened.frameRequest, null);
  assert.equal(
    reduceTi008Session(opened.nextState, 227, {
      type: "drop",
      card: 6,
      target: 6,
    }).allowed,
    false,
  );
  const close = reduceTi008Session(opened.nextState, 227, {
    type: "close-help",
  });
  assert.equal(close.nextState.controlsEnabled, true);
  assert.equal(close.nextState.help, false);
  assert.equal(close.frameRequest, null);
});
test("Replay and external identity changes clear counters, selected cards and pending completions", () => {
  const changed = reduceTi008Session(createTi008Session(), 227, {
    type: "drop",
    card: 6,
    target: 6,
  }).nextState;
  assert.deepEqual(
    syncTi008Session(changed, context(227, { replay: 1 })),
    createTi008Session(0, 1),
  );
  assert.deepEqual(
    syncTi008Session(changed, context(227, { seed: 9 })),
    createTi008Session(9),
  );
  assert.equal(
    reduceTi008Session(changed, 228, { type: "select", card: 6 }).allowed,
    false,
  );
});
test("three main/feedback cues bind exact source bytes; Correct_FB has no invented sound", async () => {
  const feedback = await json(
      "work/typography-v1/g5-l2-ti008/feedback-audio.json",
    ),
    main = await json("work/typography-v1/g5-l2-ti008/main-audio.json");
  assert.equal(feedback.correctFeedback.streamPresent, false);
  assert.equal(
    G5_L2_TI008_ACTIVITIES.find((a) => a.id === "correct")?.audio,
    undefined,
  );
  for (const a of feedback.assets) {
    assert.equal(hash(await readFile(root + a.path)), a.sha256);
    const definition = G5_L2_TI008_ACTIVITIES.find((d) => d.id === a.id)!;
    assert.equal(definition.audio?.sha256, a.sha256);
    assert.equal(definition.audio?.firstFrame, a.firstBlockFrame);
    assert.equal(definition.audio?.lastFrame, a.lastBlockFrame);
  }
  const cue = G5_L2_TI008_TEXT_PRESENTATION.sourceTimelineAudioCues[0]!;
  assert.equal(cue.sha256, main.asset.sha256);
  assert.equal(hash(await readFile(root + main.asset.path)), cue.sha256);
  assert.equal(cue.frame, main.asset.firstBlockFrame);
  assert.equal(cue.endFrame, main.asset.lastBlockFrame + 1);
});
test("nine glossary destinations are source-selected English entries with authored timeline stops", async () => {
  const index = await json(
      "apps/web/public/generated/g4-grade-wide-keyterms-en.json",
    ),
    script = await actions;
  assert.equal(
    index.source.sha256,
    G5_L2_TI008_TEXT_PRESENTATION.keyTerms.sourceSha256,
  );
  for (const [name, term] of Object.entries(G5_L2_TI008_TERMS)) {
    assert.equal(
      index.entries
        .find((e: any) => e.id === term.entryId)
        .titles.en.toLowerCase(),
      name.toLowerCase(),
    );
    for (const character of term.buttons) {
      const marker = `===== DefineButton2_${character}/BUTTONCONDACTION on(release).as =====`,
        start = script.indexOf(marker),
        end = script.indexOf("\n===== ", start + 1);
      assert(start >= 0);
      const body = script.slice(start, end < 0 ? undefined : end);
      assert(body.includes(`_global.KeyAttribute = "${name}"`));
      assert.match(body, /animation\.stop\(\)/);
    }
  }
});
test("native snapshots retain filled states, reject scope mismatch, and contain no Canvas, bitmap or editable text", () => {
  const ctx = context(227),
    state = getCourseG05L02Ti008FrameState(227, ctx);
  assert.equal(getG5L2Ti008TextSnapshot(state, ctx).status, "ready");
  for (const mismatch of [
    { ...ctx, lang: "es" as const },
    { ...ctx, scenario: "default" },
    { ...ctx, frameDomain: "root" },
    { ...ctx, rootFrame: 7 },
    { ...ctx, frame: 226 },
  ])
    assert.equal(getG5L2Ti008TextSnapshot(state, mismatch).status, "blocked");
  const filled = reduceTi008Session(createTi008Session(), 227, {
    type: "drop",
    card: 1,
    target: 1,
  }).nextState;
  const snapshot = getG5L2Ti008TextSnapshot(state, ctx, filled);
  assert.equal(snapshot.blocks.find((b) => b.id === "target-1")?.visible, true);
  assert.equal(snapshot.blocks.find((b) => b.id === "card-1")?.visible, false);
  const markup = renderToStaticMarkup(
    createElement(G5L2Ti008ModernRenderer, { ...ctx, state }),
  );
  assert(!/<(?:canvas|img|image|input|textarea)\b/i.test(markup));
  assert.match(markup, /data-modern-lesson="g5-l2-ti008"/);
});
