import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import test from 'node:test';
import React from 'react';
import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import sourceModule from '../modules/course-g04-l05-in-012';
import {binding, IN012_CASES, IN012_INTERACTION_FRAME, IN012_SOURCE_EVIDENCE, IN012_SOURCE_EMPHASIS,
  G4_L5_IN012_TEXT_PRESENTATION, createIn012Interaction, nextIn012Product,
  resolveIn012Example, getSnapshot, ModernRenderer, IN012_SOURCE_KEY_TERMS, IN012_KEY_TERMS} from './g4-l5-in012';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const ctx = (frame: number, extra: Partial<RuntimeContext> = {}): RuntimeContext => ({frame,
  frameDomain: 'sprite-110', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 27, replay: 0, ...extra});
const capture = {requirementId: 'test-capture', traceId: 'test-trace', entryStateSha256: 'a'.repeat(64)};
interface SourceAsset {
  sourceSha256: string;
  textDefinitions: Array<{characterId: number; sourceTextId: string; runs: Array<{sourceTextId: string; text: string}>}>;
  timelines: Array<{timelineId: string; events: Array<{kind: string; frame: number;
    characterId?: number; depth?: number; label?: {text: string}; name?: {text: string}; matrix?: number[];
    colorTransform?: {multiply: number[]}}>}>;
}
async function source(): Promise<SourceAsset> {
  const bytes = gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${binding.sourceSwfSha256}.json.gz`));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), IN012_SOURCE_EVIDENCE.sourceCatalogContentSha256);
  return JSON.parse(bytes.toString('utf8'));
}
const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

test('page and every text reference bind to the exact current source asset', async () => {
  const asset = await source();
  assert.equal(binding.placementId, 'g04-l05-placement-029');
  assert.equal(binding.sourceSwfSha256, asset.sourceSha256);
  const ids = new Set(asset.textDefinitions.flatMap(definition => [definition.sourceTextId,
    ...definition.runs.map(run => run.sourceTextId)]));
  for (const block of binding.blocks) for (const id of block.sourceTextIds) assert.ok(ids.has(id), id);
});

test('all five source-labeled cases retain exact mathematics and source frame labels', async () => {
  const asset = await source();
  const texts = new Map(asset.textDefinitions.map(definition => [definition.characterId,
    normalizeText(definition.runs.map(run => run.text).join(''))]));
  const labels = asset.timelines.find(timeline => timeline.timelineId === 'sprite-110')!.events
    .filter(event => event.kind === 'frame-label');
  for (const example of IN012_CASES) {
    assert.equal(example.a * example.b, example.result);
    assert.equal(labels.find(label => label.label?.text === example.id)?.frame, example.frame);
    const context = ctx(example.frame, capture);
    const state = sourceModule.getFrameState(example.frame, context);
    const snapshot = getSnapshot(state, context);
    const values = new Map(snapshot.blocks.map(block => [block.id, block.text]));
    assert.equal(values.get('problem'), texts.get(example.equation));
    assert.equal(values.get('expanded'), texts.get(example.expanded));
    assert.equal(values.get('partial-products'), texts.get(example.distributed));
    assert.equal(values.get('product'), texts.get(example.answer));
    const a = Number(values.get('factor-a-tens')) * 10 + Number(values.get('factor-a-units'));
    const b = Number(values.get('factor-b-tens')) * 10 + Number(values.get('factor-b-units'));
    assert.equal(a, example.a); assert.equal(b, example.b);
    const cells = [Math.floor(a / 10) * Math.floor(b / 10), Math.floor(a / 10) * (b % 10),
      (a % 10) * Math.floor(b / 10), (a % 10) * (b % 10)];
    for (let cell = 0; cell < 4; cell++) {
      assert.equal(Number(values.get(`cell-${cell}-tens`)) * 10 + Number(values.get(`cell-${cell}-units`)), cells[cell]);
      assert.equal(snapshot.blocks.find(block => block.id === `cell-${cell}-tens`)!.visible, cells[cell]! >= 10);
    }
    assert.equal(Number(values.get('result-hundreds')) * 100 + Number(values.get('result-tens')) * 10 + Number(values.get('result-units')), example.result);
  }
});

test('live root companion title remains native and precedes the instruction through teaching and Replay', async () => {
  const asset = await source();
  const title = asset.textDefinitions.find(definition => definition.characterId === 2)!;
  const sourceText = normalizeText(title.runs.map(run => run.text).join(''));
  assert.equal(sourceText, 'Multiplication: Learn It');
  const rootPlacement = asset.timelines.find(timeline => timeline.timelineId === 'root')!.events
    .find(event => event.kind === 'place' && event.characterId === 3)!;
  assert.equal(rootPlacement.frame, 6);
  assert.equal(rootPlacement.name?.text, 'Mc_Page_Title');
  assert.deepEqual(rootPlacement.matrix, [1, 0, 0, 1, 8002, 868]);
  const textPlacement = asset.timelines.find(timeline => timeline.timelineId === 'sprite-3')!.events
    .find(event => event.kind === 'place' && event.characterId === 2)!;
  assert.equal(textPlacement.frame, 1);
  assert.deepEqual(textPlacement.matrix, [1, 0, 0, 1, -4221, -284]);
  assert.deepEqual(binding.blocks.find(block => block.id === 'root-title')?.sourceTextIds, ['character-2']);
  for (const context of [ctx(1), ctx(2), ctx(97), ctx(269), ctx(269, {replay: 1})]) {
    const dom = new JSDOM(renderToStaticMarkup(<ModernRenderer {...context} uiLanguage="es"/>));
    try {
      const document = dom.window.document;
      const titles = document.querySelectorAll('[data-lesson-text-block="root-title"]');
      assert.equal(titles.length, 1);
      assert.equal(titles[0]!.tagName, 'H2');
      assert.equal(titles[0]!.textContent, 'Multipli\u00adcation: Learn It');
      assert.equal(titles[0]!.textContent!.replace('\u00ad', ''), sourceText);
      assert.equal(titles[0]!.getAttribute('aria-label'), sourceText);
      assert.equal(titles[0]!.closest('.lesson-text-presentation__figure-viewport'), null);
      const instruction = document.querySelector('[data-lesson-text-block="instruction"]');
      if (context.frame >= 2) assert.ok(titles[0]!.compareDocumentPosition(instruction!) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      else assert.equal(instruction, null);
    } finally { dom.window.close(); }
  }
});

test('native whole-word emphasis follows all source letter pulses without hiding or duplicating the instruction', async () => {
  const asset = await source();
  const letters = new Map(asset.textDefinitions.filter(definition =>
    [...Array.from({length: 7}, (_, index) => 32 + index), ...Array.from({length: 9}, (_, index) => 54 + index)]
      .includes(definition.characterId)).map(definition => [definition.characterId, definition.runs.map(run => run.text).join('')]));
  assert.equal(letters.size, 16);
  const timeline = asset.timelines.find(item => item.timelineId === 'sprite-110')!;
  const display = new Map<number, typeof timeline.events[number]>();
  const sourceFrames = new Map(IN012_SOURCE_EMPHASIS.map(term => [term.sourceKey as string, [] as number[]]));
  const words: Record<string, string[]> = {Product: ['Product'], numbers: ['Number'],
    multiplicationproblem: ['Multiplication', 'Problem'], '': []};
  let sourceLetterPlacements = 0;
  for (let frame = 1; frame <= 273; frame++) {
    for (const event of timeline.events.filter(event => event.frame === frame)) {
      if (event.kind === 'remove') display.delete(event.depth!);
      if (event.kind === 'place' && event.characterId !== undefined) {
        display.set(event.depth!, event);
        if (letters.has(event.characterId)) sourceLetterPlacements++;
      }
    }
    const sourceWord = [...display.values()].filter(event => letters.has(event.characterId!))
      .sort((left, right) => left.matrix![4]! - right.matrix![4]!)
      .map(event => letters.get(event.characterId!)!).join('');
    assert.ok(Object.hasOwn(words, sourceWord), `unexpected source letter group at frame ${frame}: ${sourceWord}`);
    const expected = words[sourceWord]!;
    for (const key of expected) sourceFrames.get(key)!.push(frame);
    const context = ctx(frame);
    const markup = renderToStaticMarkup(<ModernRenderer {...context} onLessonHostRequest={() => {}}/>);
    const active = [...markup.matchAll(/data-in012-word="([^"]+)" data-in012-emphasized="true"/g)].map(match => match[1]);
    assert.deepEqual(active, expected, `source emphasis frame ${frame}`);
    if (frame >= 2) {
      assert.equal((markup.match(/data-lesson-text-block="instruction"/g) ?? []).length, 1);
      assert.equal((markup.match(/data-in012-word=/g) ?? []).length, 4);
    }
  }
  assert.equal(sourceLetterPlacements, 189);
  for (const term of IN012_SOURCE_EMPHASIS) assert.deepEqual(sourceFrames.get(term.sourceKey), term.frames);
  for (const frame of [96, 111, 123, 269]) {
    const context = ctx(frame, capture);
    const markup = renderToStaticMarkup(<ModernRenderer {...context}/>);
    const dom = new JSDOM(markup);
    try {
      const instruction = dom.window.document.querySelector('[data-lesson-text-block="instruction"]')!;
      assert.equal(normalizeText(instruction.textContent!), IN012_SOURCE_EVIDENCE.sourceInstruction);
      assert.equal(instruction.querySelectorAll('button').length, 0);
      const expected = IN012_SOURCE_EMPHASIS.filter(term => term.frames.some(value => value === frame)).map(term => term.sourceKey);
      assert.deepEqual([...instruction.querySelectorAll('[data-in012-emphasized="true"]')].map(node => node.getAttribute('data-in012-word')), expected);
    } finally { dom.window.close(); }
  }
});

test('instruction, zero placeholder, worked example and interaction honor source beat boundaries', async () => {
  const asset = await source();
  const timeline = asset.timelines.find(item => item.timelineId === 'sprite-110')!;
  assert.equal(timeline.events.find(event => event.kind === 'place' && event.characterId === 40)?.frame, 97);
  assert.equal(timeline.events.find(event => event.kind === 'place' && event.characterId === 67)?.frame, 269);
  for (const [frame, problem, visible] of [[1, '0 × 0 =', false], [2, '0 × 0 =', true],
    [96, '0 × 0 =', true], [97, '15 × 11 =', true], [268, '15 × 11 =', true]] as const) {
    const context = ctx(frame), snapshot = getSnapshot(sourceModule.getFrameState(frame, context), context);
    assert.equal(snapshot.blocks.find(block => block.id === 'problem')!.text, problem);
    assert.equal(snapshot.blocks.find(block => block.id === 'instruction')!.visible, visible);
  }
  assert.equal(G4_L5_IN012_TEXT_PRESENTATION.playbackEndFrameByDomain?.['sprite-110'], IN012_INTERACTION_FRAME);
  assert.equal(sourceModule.playbackEndFrameByDomain?.['sprite-110'], 273);
});

test('New Product draws every case once per pool and refills indefinitely without mutating prior state', () => {
  for (const seed of [0, 1, 27, 999, 0xffffffff]) {
    let state = createIn012Interaction(seed);
    const seen: string[] = [];
    for (let draw = 0; draw < 20; draw++) {
      seen.push(state.currentCaseId);
      assert.equal(state.remaining.length, 4 - draw % 5);
      assert.equal(state.cycle, Math.floor(draw / 5) + 1);
      const before = JSON.stringify(state);
      const next = nextIn012Product(state);
      assert.equal(JSON.stringify(state), before);
      assert.equal(next.drawCount, state.drawCount + 1);
      state = next;
    }
    for (let cycle = 0; cycle < 4; cycle++) assert.deepEqual([...seen.slice(cycle * 5, cycle * 5 + 5)].sort(), ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']);
  }
});

test('seed and Replay reset one deterministic interaction state with no global randomness', () => {
  const first = createIn012Interaction(27, 0);
  let used = first;
  for (let step = 0; step < 8; step++) used = nextIn012Product(used);
  const replayed = createIn012Interaction(27, 1);
  assert.equal(replayed.currentCaseId, first.currentCaseId);
  assert.deepEqual(replayed.remaining, first.remaining);
  assert.equal(replayed.rngState, first.rngState);
  assert.equal(replayed.drawCount, 1);
  assert.equal(replayed.replay, 1);
  assert.equal(createIn012Interaction(-1).seed, 0xffffffff);
});

test('explicit capture still selects source Q1..Q5 while live mode uses its interaction case', () => {
  let interaction = createIn012Interaction(27);
  while (interaction.currentCaseId === 'Q1') interaction = nextIn012Product(interaction);
  const liveContext = ctx(269), live = sourceModule.getFrameState(269, liveContext);
  assert.equal(resolveIn012Example(live, liveContext, interaction).id, interaction.currentCaseId);
  const captureContext = ctx(269, capture), captured = sourceModule.getFrameState(269, captureContext);
  assert.equal(resolveIn012Example(captured, captureContext, interaction).id, 'Q1');
  const markup = renderToStaticMarkup(<ModernRenderer {...captureContext}/>);
  assert.match(markup, /data-interaction-enabled="false"/);
  assert.match(markup, /<button[^>]*disabled=""/);
});

test('native text and vectors replace raster labels and only the source New Product control is added', () => {
  const markup = renderToStaticMarkup(<ModernRenderer {...ctx(269)}/>);
  assert.ok(!/<(?:canvas|img|audio|video)\b/.test(markup));
  assert.equal((markup.match(/<button\b/g) ?? []).length, 1);
  assert.match(markup, /data-interaction-enabled="true"/);
  assert.ok(!/<button[^>]*disabled/.test(markup));
  assert.match(markup, /data-lesson-text-block="new-product"/);
  assert.ok((markup.match(/<text\b/g) ?? []).length >= 11);
  assert.match(markup, /data-original-runtime-accepted="false"/);
});

test('unsupported and mismatched source/interaction state remains blocked; ES fallback is English', () => {
  const context = ctx(269), state = sourceModule.getFrameState(269, context);
  assert.equal(getSnapshot(state, ctx(269, {lang: 'es'})).status, 'blocked');
  assert.equal(getSnapshot(state, ctx(269, {rootFrame: 7})).status, 'blocked');
  assert.equal(getSnapshot(state, ctx(268)).status, 'blocked');
  assert.equal(getSnapshot(state, context, createIn012Interaction(28)).status, 'blocked');
  assert.equal(getSnapshot(state, ctx(269, {replay: 1}), createIn012Interaction(27, 0)).status, 'blocked');
  const html = renderToStaticMarkup(<ModernRenderer {...context} uiLanguage="es"/>);
  assert.match(html, /data-language-policy="source-fallback"/);
  assert.match(html, /data-spanish-translation="false"/);
  assert.ok(!html.includes('lang="es"'));
});

test('public-tool AS evidence confirms only the five-case no-replacement/refill behavior being implemented', async () => {
  const script = await readFile(`${root}work/typography-v1/source-audit/g4-l5-in012/actionscript/scripts/DefineSprite_110/frame_269/DoAction.as`, 'utf8');
  const button = await readFile(`${root}work/typography-v1/source-audit/g4-l5-in012/actionscript/scripts/DefineButton2_67/BUTTONCONDACTION on(release).as`, 'utf8');
  assert.match(script, /arryShowMc\.length <= 0/);
  assert.match(script, /random\(_global\.arryShowMc\.length\)/);
  assert.match(script, /gotoAndStop\(Question\)/);
  assert.match(script, /arryShowMc\.splice\(tempNum,1\)/);
  for (const id of ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']) assert.ok(script.includes(`"${id}~`));
  assert.match(button, /on\(release\)[\s\S]*doGetRndQuestion\(\)/);
  assert.equal(IN012_SOURCE_EVIDENCE.sourceRandomParityEstablished, false);
});

test('four native glossary controls retain exact source keys and source stop semantics', async () => {
  const index = JSON.parse(await readFile(`${root}apps/web/public/generated/g4-grade-wide-keyterms-en.json`, 'utf8'));
  assert.equal(index.source.sha256, IN012_KEY_TERMS.sourceSha256);
  for (const target of IN012_SOURCE_KEY_TERMS) {
    const source = await readFile(`${root}work/typography-v1/source-audit/g4-l5-in012/actionscript/scripts/DefineButton2_${target.sourceButtonId}/BUTTONCONDACTION on(release).as`, 'utf8');
    assert.ok(source.includes(`_global.KeyAttribute = "${target.sourceKey}"`));
    assert.ok(source.includes('_root.animation_mc.animation.stop()'));
    const entry = index.entries.find((e: {id: string}) => e.id === target.entryId);
    assert.equal(entry.titles.en, target.sourceKey);
  }
  const html = renderToStaticMarkup(<ModernRenderer {...ctx(269)} onLessonHostRequest={() => {}}/>);
  assert.equal((html.match(/data-keyterm-entry-id=/g) ?? []).length, 4);
  assert.equal((html.match(/<button\b/g) ?? []).length, 5);
  const captured = renderToStaticMarkup(<ModernRenderer {...ctx(269, capture)} onLessonHostRequest={() => {}}/>);
  assert.equal((captured.match(/data-keyterm-entry-id=/g) ?? []).length, 0);
});


test('local lattice viewport preserves all five source cases and early teaching beats without duplicate labels', async () => {
  const asset = await source();
  const texts = new Map(asset.textDefinitions.map(definition => [definition.characterId,
    normalizeText(definition.runs.map(run => run.text).join(''))]));
  const positions = [
    ['factor-b-tens', 35, 12], ['factor-b-units', 65, 12],
    ['factor-a-tens', 89, 36], ['factor-a-units', 89, 60],
    ['result-hundreds', 11, 60], ['result-tens', 35, 84], ['result-units', 65, 84],
    ...[0, 1, 2, 3].flatMap(index => [
      [`cell-${index}-tens`, 30 + index % 2 * 30, 32 + Math.floor(index / 2) * 24],
      [`cell-${index}-units`, 40 + index % 2 * 30, 40 + Math.floor(index / 2) * 24],
    ]),
  ] as const;
  const contexts = [ctx(1), ctx(2), ctx(97), ctx(269),
    ...IN012_CASES.map(example => ctx(example.frame, capture)), ctx(269, {replay: 1})];
  for (const context of contexts) {
    const state = sourceModule.getFrameState(context.frame, context);
    const interaction = createIn012Interaction(context.seed!, context.replay ?? 0);
    const snapshot = getSnapshot(state, context, interaction);
    const blocks = new Map(snapshot.blocks.map(block => [block.id, block]));
    const example = resolveIn012Example(state, context, interaction);
    if (context.frame >= 269) assert.equal(blocks.get('problem')!.text, texts.get(example.equation));
    const dom = new JSDOM(renderToStaticMarkup(<ModernRenderer {...context} uiLanguage="es" onLessonHostRequest={() => {}}/>));
    try {
      const document = dom.window.document;
      const viewports = document.querySelectorAll('.lesson-text-presentation__figure-viewport');
      assert.equal(viewports.length, 1, `one local viewport at ${context.frame}/${context.replay}`);
      const viewport = viewports[0]!;
      assert.equal(viewport.getAttribute('tabindex'), '0');
      assert.equal(viewport.getAttribute('role'), 'group');
      assert.equal(viewport.getAttribute('aria-label'), blocks.get('problem')!.text);
      const plane = viewport.querySelector('.lesson-text-presentation__figure-plane')!;
      assert.ok(plane);
      assert.equal((plane as HTMLElement).style.getPropertyValue('--lesson-figure-min-inline-size'), '24rem');
      const lattice = plane.querySelector('svg[data-in012-lattice="true"]')!;
      assert.ok(lattice);
      assert.equal(plane.querySelectorAll('svg').length, 1, 'empty wrapper snapshot adds no second text layer');
      assert.equal(plane.querySelectorAll('.lesson-text-presentation__label-list').length, 0);
      assert.equal(lattice.getAttribute('aria-label'), blocks.get('problem')!.text);
      const expected = positions.filter(([id]) => blocks.get(String(id))!.visible).map(([id, x, y]) => ({
        id: String(id), text: blocks.get(String(id))!.text, x: `${x}%`, y: `${y}%`,
      }));
      const labels = [...lattice.querySelectorAll('text')];
      assert.deepEqual(labels.map(node => ({id: node.getAttribute('data-lesson-text-block'), text: node.textContent,
        x: node.getAttribute('x'), y: node.getAttribute('y')})), expected);
      for (const label of labels) {
        assert.equal(label.getAttribute('text-anchor'), 'middle');
        assert.equal(label.getAttribute('dominant-baseline'), 'central');
        assert.equal((label as SVGElement).style.fontSize, '1.125rem');
        assert.equal(document.querySelectorAll(`[data-lesson-text-block="${label.getAttribute('data-lesson-text-block')}"]`).length, 1);
      }
      assert.equal(lattice.querySelectorAll('line').length, 6);
      assert.equal(lattice.querySelector('rect')!.getAttribute('width'), '60%');
      assert.equal(lattice.querySelector('rect')!.getAttribute('height'), '48%');
      for (const id of ['problem', 'expanded', 'partial-products', 'product', 'new-product']) {
        const nodes = document.querySelectorAll(`[data-lesson-text-block="${id}"]`);
        assert.equal(nodes.length, 1);
        assert.equal(nodes[0]!.closest('.lesson-text-presentation__figure-viewport'), null, `${id} remains outside local scroller`);
      }
      for (const glossary of document.querySelectorAll('[data-keyterm-entry-id]')) assert.equal(glossary.closest('.lesson-text-presentation__figure-viewport'), null);
      const host = document.querySelector('[data-modern-lesson="g4-l5-in012"]')!;
      assert.equal(host.getAttribute('data-draw-count'), '1');
      assert.equal(host.getAttribute('data-cycle'), '1');
      assert.equal(host.getAttribute('data-remaining-case-count'), '4');
      assert.equal(host.getAttribute('data-language-policy'), 'source-fallback');
    } finally { dom.window.close(); }
  }
});
