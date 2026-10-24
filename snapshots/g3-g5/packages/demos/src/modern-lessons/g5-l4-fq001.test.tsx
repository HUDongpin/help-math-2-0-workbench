import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";
import test from "node:test";
import React from "react";
import {JSDOM} from "jsdom";
import {renderToStaticMarkup} from "react-dom/server";
import type {RuntimeContext} from "../contract";
import {
  binding, FQ001_SOURCE_ROLE_DECISIONS, getFq001TitlePresentation,
  getSnapshot, ModernRenderer, getFq001GraphValues, getFq001NumberLineValues,
} from "./g5-l4-fq001";
import {
  COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  COURSE_G05_L04_FQ_001_MOVIE,
  COURSE_G05_L04_FQ_001_RUNTIME,
  COURSE_G05_L04_FQ_001_SCENARIO,
  getCourseG05L04Fq001FrameState,
} from "../timelines/course-g05-l04-fq-001";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const context = (frame: number, extra: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame, frameDomain: COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN, rootFrame: 6,
  scenario: COURSE_G05_L04_FQ_001_SCENARIO, lang: "en", seed: 27, replay: 0, ...extra,
});
const snapshotAt = (frame: number, extra: Partial<RuntimeContext> = {}) => {
  const ctx = context(frame, extra);
  return getSnapshot(getCourseG05L04Fq001FrameState(frame, ctx), ctx);
};

interface SourceEvent {
  frame: number;
  depth?: number;
  characterId?: number;
  colorTransform?: {multiply: number[]};
  matrix?: number[];
}
interface SourceAsset {
  sourceSha256: string;
  textDefinitions: Array<{sourceTextId: string; runs: Array<{sourceTextId: string; text: string}>}>;
  timelines: Array<{timelineId: string; events: SourceEvent[]}>;
  shapeDefinitions: Array<{characterId: number; sourceTagSha256: string}>;
}
async function readSource(): Promise<SourceAsset> {
  const filename = `${root}catalog/typography-v1/source-catalog/assets/${binding.sourceSwfSha256}.json.gz`;
  const content = gunzipSync(await readFile(filename));
  assert.equal(createHash("sha256").update(content).digest("hex"), FQ001_SOURCE_ROLE_DECISIONS.sourceCatalogContentSha256);
  return JSON.parse(content.toString("utf8"));
}

test("binding belongs to exact G5 L4 page 52 and every named source text exists", async () => {
  const source = await readSource();
  assert.equal(binding.placementId, "g05-l04-placement-052");
  assert.equal(binding.sourceSwfSha256, source.sourceSha256);
  const ids = new Set(source.textDefinitions.flatMap(definition => [definition.sourceTextId,
    ...definition.runs.map(run => run.sourceTextId)]));
  for (const block of binding.blocks) for (const id of block.sourceTextIds) assert.ok(ids.has(id), id);
  const shapes = new Set(source.shapeDefinitions.map(shape => shape.characterId));
  for (const block of binding.blocks) for (const id of block.sourceShapeIds ?? []) assert.ok(shapes.has(id));
  const zero = binding.blocks.find(block => block.id === "number-line-value-9")!;
  assert.deepEqual(zero.sourceTextIds, []);
  assert.deepEqual(zero.sourceShapeIds, [121]);
  assert.equal(new Set(binding.blocks.map(block => block.id)).size, binding.blocks.length);
  assert.ok(binding.blocks.every(block => block.language === "en"));
});

test("all 52 title states follow exact source alpha/scale updates and preserve the source hold", async () => {
  const source = await readSource();
  const timeline = source.timelines.find(item => item.timelineId === "sprite-145")!;
  const updates = timeline.events.filter(event => event.depth === 51);
  for (let frame = 1; frame <= 52; frame++) {
    const event = updates.filter(event => event.frame <= frame).at(-1)!;
    const state = getCourseG05L04Fq001FrameState(frame, context(frame));
    const title = getFq001TitlePresentation(state);
    assert.equal(title.opacity, event.colorTransform!.multiply[3]! / 256, `frame ${frame}`);
    assert.equal(title.scale, event.matrix![0], `frame ${frame}`);
    assert.equal(snapshotAt(frame).blocks.find(block => block.id === "final-quiz")!.visible, frame > 1);
  }
  assert.equal(getFq001TitlePresentation(getCourseG05L04Fq001FrameState(10, context(10))).opacity, 121 / 256);
  assert.equal(getFq001TitlePresentation(getCourseG05L04Fq001FrameState(20, context(20))).opacity, 1);
  assert.equal(COURSE_G05_L04_FQ_001_MOVIE.fps, 12);
  assert.equal(COURSE_G05_L04_FQ_001_MOVIE.frameCount, 52);
  assert.equal(COURSE_G05_L04_FQ_001_RUNTIME.frameCount, 10);
});

test("every source mathematical example is retained, including all five line-graph values", async () => {
  const source = await readSource();
  const texts = new Map(source.textDefinitions.flatMap(definition => definition.runs.map(run => [run.sourceTextId, run.text] as const)));
  const values = new Map(snapshotAt(1).blocks.map(block => [block.id, block.text]));
  assert.equal(values.get("whole-numbers-heading"), texts.get("character-126/run-0"));
  assert.equal(values.get("whole-numbers")!.replace(/\s/g, "").replace("…", "..."), texts.get("character-125/run-0"));
  assert.equal(values.get("decimal-heading"), texts.get("character-128/run-0"));
  assert.equal(values.get("decimal-value"), "0.23");
  assert.equal(values.get("fractions-heading"), texts.get("character-130/run-0"));
  assert.equal(values.get("fraction-value"), [131, 132, 133].map(id => texts.get(`character-${id}/run-0`)).join(""));
  assert.equal(values.get("graph-values"), [138, 139, 140, 141, 142].map(id => texts.get(`character-${id}/run-0`)).join(", "));
  const ticks = snapshotAt(1).blocks.filter(block => block.id.startsWith("number-line-value-")).map(block => block.text);
  assert.equal(ticks.length, 19);
  assert.deepEqual(ticks.map(text => Number(text.replace("−", "-"))), Array.from({length: 19}, (_, i) => i - 9));
  assert.ok(ticks.slice(10).every(text => text.startsWith("+")));
  for (const block of binding.blocks.filter(block => block.id.startsWith("number-line-value-"))) {
    if (block.sourceShapeIds?.length) {
      assert.equal(values.get(block.id), "0");
    } else {
      const sourceValue = texts.get(block.sourceTextIds[0]!)!.replace("–", "−");
      assert.equal(values.get(block.id), block.sourceTextIds.includes("character-122/run-0") ? `+${sourceValue}` : sourceValue);
    }
  }
});

test("the outlined zero and companion word-cloud decisions remain source-bound and explicit", async () => {
  const source = await readSource();
  const zero = source.shapeDefinitions.find(shape => shape.characterId === 121)!;
  assert.equal(zero.sourceTagSha256, FQ001_SOURCE_ROLE_DECISIONS.numberLineZero.sourceTagSha256);
  assert.equal(FQ001_SOURCE_ROLE_DECISIONS.sourceContextAlpha, 26 / 256);
  const firstFrame = source.timelines.find(item => item.timelineId === "sprite-145")!.events
    .filter(event => event.frame === 1 && event.depth !== undefined && event.depth < 50);
  assert.ok(firstFrame.length > 0 && firstFrame.every(event =>
    event.colorTransform!.multiply[3]! / 256 === FQ001_SOURCE_ROLE_DECISIONS.sourceContextAlpha));
  assert.equal(FQ001_SOURCE_ROLE_DECISIONS.companion.fixedFrame, 1);
  assert.ok(FQ001_SOURCE_ROLE_DECISIONS.companion.omittedSourceTextIds.includes("character-89"));
  const html = renderToStaticMarkup(<ModernRenderer {...context(52)}/>);
  for (const decorative of ["forte", "axiom", "f(x)=mx+b", "pendiente", "Recíproco", "gamma", "Allegro", "Quote of the Day", "Desmond Tutu"]) {
    assert.ok(!html.includes(decorative), decorative);
  }
});

test("renderer uses actual HTML/SVG text and MathML without old Canvas or new quiz controls", () => {
  const html = renderToStaticMarkup(<ModernRenderer {...context(26)}/>);
  assert.equal((html.match(/<h2\b/g) ?? []).length, 1);
  assert.match(html, />Final Quiz<\/h2>/);
  assert.match(html, /<math\b[^>]*data-lesson-text-block="fraction-value"/);
  assert.match(html, /<mfrac><mn>1<\/mn><mn>4<\/mn><\/mfrac>/);
  assert.equal((html.match(/<text\b/g) ?? []).length, 24);
  assert.ok(!/<(?:canvas|img|button|input|audio|video)\b/.test(html));
  assert.match(html, /data-original-runtime-accepted="false"/);
  assert.match(html, /data-strict-migration-complete="false"/);
  const early = renderToStaticMarkup(<ModernRenderer {...context(2)}/>);
  assert.match(early, /data-fq001-source-title-opacity="0.05078125"/);
  assert.ok(!/style="[^"]*(?:opacity:|scale\()/.test(early));
});

test("Replay restores the source frame-one title reveal without losing persistent examples", () => {
  const start = snapshotAt(1), end = snapshotAt(52), replay = snapshotAt(1, {replay: 4});
  assert.equal(start.blocks.find(block => block.id === "final-quiz")!.visible, false);
  assert.equal(end.blocks.find(block => block.id === "final-quiz")!.visible, true);
  assert.deepEqual(replay.blocks, start.blocks);
  assert.equal(replay.identity.replay, 4);
  assert.equal(replay.identity.seed, start.identity.seed);
  let replayCalls = 0;
  renderToStaticMarkup(<ModernRenderer {...context(52)} onReplay={() => {replayCalls++;}}/>);
  assert.equal(replayCalls, 0);
});

test("the old ES prohibition remains; existing English-source fallback never claims translation", () => {
  const blocked = snapshotAt(26, {lang: "es"});
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blocks.length, 0);
  assert.ok(blocked.blockers.includes("spanish-disabled"));
  const html = renderToStaticMarkup(<ModernRenderer {...context(26)} uiLanguage="es"/>);
  assert.match(html, /data-language-policy="source-fallback"/);
  assert.match(html, /data-spanish-translation="false"/);
  assert.ok(!html.includes('lang="es"'));
  assert.ok(html.includes("Final Quiz"));
});

test("unsupported frame/domain and mismatched state identity never display modern words", () => {
  for (const frame of [0, 53, NaN]) assert.equal(snapshotAt(frame).status, "blocked");
  for (const frameDomain of ["root", "sprite-100", "unknown"]) {
    assert.equal(snapshotAt(10, {frameDomain}).status, "blocked");
  }
  const state = getCourseG05L04Fq001FrameState(10, context(10));
  assert.equal(getSnapshot(state, context(11)).status, "blocked");
  assert.equal(getSnapshot(state, context(10, {rootFrame: 7})).status, "blocked");
  assert.equal(getSnapshot({...state, sourceSwfSha256: "0".repeat(64)}, context(10)).status, "blocked");
  assert.ok(!renderToStaticMarkup(<ModernRenderer {...context(10, {lang: "es"})}/>).includes("Final Quiz"));
  assert.match(renderToStaticMarkup(<ModernRenderer {...context(52)} state={state}/>), /data-presentation-status="blocked"/);
  assert.match(renderToStaticMarkup(<ModernRenderer {...context(52)} state={null}/>), /data-presentation-status="blocked"/);
  const supplied = getCourseG05L04Fq001FrameState(52, context(52));
  assert.match(renderToStaticMarkup(<ModernRenderer {...context(52)} state={supplied}/>), />Final Quiz<\/h2>/);
});

test("paused and reduced-motion renders stay a pure function of the existing frame", () => {
  const ordinary = renderToStaticMarkup(<ModernRenderer {...context(10)}/>);
  const controlled = renderToStaticMarkup(<ModernRenderer {...context(10)} paused reducedMotion audioEnabled/>);
  assert.equal(controlled, ordinary);
  const ctx = Object.freeze(context(10));
  const state = Object.freeze(getCourseG05L04Fq001FrameState(10, ctx));
  const before = JSON.stringify({ctx, state});
  getSnapshot(state, ctx);
  assert.equal(JSON.stringify({ctx, state}), before);
});


test("graph HTML list and SVG retain independent source placement order at entry, terminal and Replay", async () => {
  const source = await readSource();
  const placements = source.timelines.find(timeline => timeline.timelineId === "sprite-145")!.events
    .filter(event => event.frame === 1 && event.depth! >= 45 && event.depth! <= 49);
  assert.equal(placements.length, 5);
  const sourceOrder = [...placements].sort((left, right) => left.matrix![4]! - right.matrix![4]!);
  assert.deepEqual(sourceOrder.map(event => event.characterId), [138, 139, 140, 141, 142]);
  const runs = new Map(source.textDefinitions.flatMap(definition => definition.runs.map(run => [run.sourceTextId, run.text] as const)));
  const expected = sourceOrder.map(event => {
    const sourceTextId = `character-${event.characterId}/run-0`;
    assert.ok(runs.has(sourceTextId));
    return {sourceTextId, text: runs.get(sourceTextId)!};
  });
  for (const [frame, replay, uiLanguage] of [[1, 0, "en"], [2, 0, "en"], [52, 0, "en"], [1, 4, "es"]] as const) {
    const ctx = context(frame, {replay});
    const snapshot = snapshotAt(frame, {replay});
    assert.deepEqual(getFq001GraphValues(snapshot), expected);
    const dom = new JSDOM(renderToStaticMarkup(<ModernRenderer {...ctx} uiLanguage={uiLanguage}/>));
    try {
      const document = dom.window.document;
      const lists = document.querySelectorAll('ol[data-fq001-graph-values="true"]');
      assert.equal(lists.length, 1, `one value list at ${frame}/${replay}`);
      const list = lists[0]!;
      assert.equal(list.closest('.lesson-text-presentation__figure-viewport'), null,
        "the readable values must stay outside the horizontally scrolling figure");
      const items = [...list.children];
      assert(items.every(item => item.tagName === "LI"));
      assert.deepEqual(items.map(item => ({sourceTextId: item.getAttribute('data-source-text-id'), text: item.textContent})), expected,
        "no missing, duplicate, sorted or invented graph values");
      assert.equal(new Set(items.map(item => item.getAttribute('data-source-text-id'))).size, 5);
      const graph = document.querySelector('svg[data-fq001-source-graph="true"]')!;
      assert.ok(graph);
      const svgValues = [...graph.querySelectorAll('text')];
      assert.deepEqual(svgValues.map(node => node.textContent), expected.map(row => row.text));
      const points = [...graph.querySelectorAll('circle')];
      const lines = [...graph.querySelectorAll('line')];
      assert.equal(points.length, expected.length, "one point per source value");
      assert.equal(lines.length, 6, "two axes and four source-ordered connecting segments");
      svgValues.forEach((label, index) => {
        const point = points[index]!;
        assert.equal(label.getAttribute('x'), point.getAttribute('cx'),
          "each source label remains anchored to its own point");
        assert.equal(label.getAttribute('text-anchor'), 'middle');
        const labelY = label.getAttribute('y')!;
        const pointY = point.getAttribute('cy')!;
        assert.match(labelY, /^-?\d+(?:\.\d+)?%$/);
        assert.match(pointY, /^-?\d+(?:\.\d+)?%$/);
        assert(parseFloat(labelY) < parseFloat(pointY),
          "labels remain above their associated points; browser measurements establish glyph clearance");
        if (index > 0) {
          const segment = lines[index + 1]!;
          assert.deepEqual(
            ['x1', 'y1', 'x2', 'y2'].map(name => segment.getAttribute(name)),
            [points[index - 1]!.getAttribute('cx'), points[index - 1]!.getAttribute('cy'),
              point.getAttribute('cx'), point.getAttribute('cy')],
            "source-ordered connecting segments remain attached to the unchanged point sequence");
        }
      });
      assert(svgValues.every((node, index) => index === 0 ||
        parseFloat(node.getAttribute('x')!) > parseFloat(svgValues[index - 1]!.getAttribute('x')!)),
      "SVG positions retain the same authored left-to-right ordering");
      assert.ok(graph.compareDocumentPosition(list) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.equal(document.querySelectorAll('h2').length, frame === 1 ? 0 : 1);
      assert.equal(document.querySelector('[data-modern-lesson="g5-l4-fq001"]')!.getAttribute('data-replay'), String(replay));
      assert.equal(document.querySelector('[data-modern-lesson="g5-l4-fq001"]')!.getAttribute('data-flash-seed'), String(ctx.seed));
      assert.equal(list.closest('[hidden], [aria-hidden="true"]'), null);
    } finally {
      dom.window.close();
    }
  }
});

test("graph value extraction rejects missing, duplicate, hidden or incomplete snapshot rows", () => {
  const original = snapshotAt(52);
  const graph = original.blocks.find(block => block.id === "graph-values")!;
  const without = original.blocks.filter(block => block.id !== "graph-values");
  for (const blocks of [without, [...original.blocks, graph],
    [...without, {...graph, visible: false}],
    [...without, {...graph, text: "412, 498, 389, 602"}],
    [...without, {...graph, text: "412, 498, 389, 602, 537, 900"}],
    [...without, {...graph, text: "412, 498, , 602, 537"}]]) {
    assert.throws(() => getFq001GraphValues({...original, blocks}));
  }
  assert.deepEqual(getFq001GraphValues(original).map(row => row.text), graph.text.split(", "));
});


test("number-line HTML alternative preserves independently extracted composite source IDs and order", async () => {
  const source = await readSource();
  const runs = new Map(source.textDefinitions.flatMap(definition => definition.runs.map(run => [run.sourceTextId, run.text] as const)));
  const events = source.timelines.find(item => item.timelineId === "sprite-145")!.events.filter(event => event.frame === 1);
  const numbers = events.filter(event => event.characterId! >= 103 && event.characterId! <= 120)
    .sort((a, b) => a.matrix![4]! - b.matrix![4]!);
  assert.equal(numbers.length, 18);
  const plusSigns = events.filter(event => event.characterId === 122).sort((a, b) => a.matrix![4]! - b.matrix![4]!);
  assert.equal(plusSigns.length, 9);
  assert.equal(runs.get("character-122/run-0"), "+");
  assert.equal(events.filter(event => event.characterId === 121).length, 1);
  assert.equal(source.shapeDefinitions.find(shape => shape.characterId === 121)!.sourceTagSha256,
    FQ001_SOURCE_ROLE_DECISIONS.numberLineZero.sourceTagSha256);
  const numbered = numbers.map((event, index) => {
    const sourceTextId = `character-${event.characterId}/run-0`;
    const text = runs.get(sourceTextId)!.replace("–", "−");
    if (index >= 9) assert(plusSigns[index - 9]!.matrix![4]! < event.matrix![4]!, "authored plus precedes its positive number");
    return {text: index < 9 ? text : `+${text}`,
      sourceTextIds: index < 9 ? [sourceTextId] : [sourceTextId, "character-122/run-0"], sourceShapeIds: [] as number[]};
  });
  const expected = [...numbered.slice(0, 9), {text: "0", sourceTextIds: [], sourceShapeIds: [121]}, ...numbered.slice(9)]
    .map((row, index) => ({id: `number-line-value-${index}`, ...row}));
  for (const [frame, replay, language] of [[1, 0, "en"], [2, 0, "en"], [52, 0, "en"], [1, 4, "es"]] as const) {
    const ctx = context(frame, {replay});
    const result = getFq001NumberLineValues(snapshotAt(frame, {replay}));
    assert.deepEqual(result, expected);
    assert(Object.isFrozen(result));
    assert(result.every(row => Object.isFrozen(row) && Object.isFrozen(row.sourceTextIds) && Object.isFrozen(row.sourceShapeIds)));
    const dom = new JSDOM(renderToStaticMarkup(<ModernRenderer {...ctx} uiLanguage={language}/>));
    try {
      const document = dom.window.document;
      const lists = document.querySelectorAll('ol[data-fq001-number-line-values="true"]');
      assert.equal(lists.length, 1);
      const list = lists[0]!;
      assert.equal(list.closest('.lesson-text-presentation__figure-viewport, .lesson-text-presentation__figure-plane'), null);
      assert.equal(list.getAttribute("lang"), "en");
      assert.deepEqual([...list.children].map(node => {
        assert.equal(node.tagName, "LI");
        return {id: node.getAttribute("data-number-line-block-id"), text: node.textContent,
          sourceTextIds: JSON.parse(node.getAttribute("data-source-text-ids")!),
          sourceShapeIds: JSON.parse(node.getAttribute("data-source-shape-ids")!)};
      }), expected);
      const svg = document.querySelector('svg[data-fq001-number-line="true"]')!;
      assert.deepEqual([...svg.querySelectorAll("text")].map(node => ({id: node.getAttribute("data-lesson-text-block"), text: node.textContent})),
        expected.map(({id, text}) => ({id, text})));
      assert(svg.compareDocumentPosition(list) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.equal(list.querySelectorAll("[data-lesson-text-block]").length, 0, "HTML alternative does not duplicate native source block markers");
      assert.equal(document.querySelectorAll("svg text").length, 24);
      assert.equal(document.querySelector('[data-modern-lesson="g5-l4-fq001"]')!.getAttribute("data-language-policy"), language === "es" ? "source-fallback" : "source");
      assert.equal(document.querySelectorAll("h2").length, frame === 1 ? 0 : 1);
    } finally { dom.window.close(); }
  }
});

test("number-line extraction rejects corrupt source instance membership instead of repairing it", () => {
  const original = snapshotAt(52);
  const rows = original.blocks.filter(block => block.id.startsWith("number-line-value-"));
  const others = original.blocks.filter(block => !block.id.startsWith("number-line-value-"));
  for (const corrupted of [rows.slice(1), [...rows, rows[0]!], [...rows].reverse(),
    rows.map((row, index) => index === 4 ? {...row, text: " "} : row),
    rows.map((row, index) => index === 9 ? {...row, visible: false} : row),
    rows.map((row, index) => index === 1 ? {...row, id: rows[0]!.id} : row)]) {
    assert.throws(() => getFq001NumberLineValues({...original, blocks: [...others, ...corrupted]}));
  }
  assert.throws(() => getFq001NumberLineValues({...original, status: "blocked"} as typeof original));
});
