import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG05L02Ti011FrameState} from '../modules/course-g05-l02-ti-011';
import {
  G5L2Ti011ModernRenderer,
  G5L2Ti011HelpCalculation,
  G5_L2_TI011_CHOICES,
  G5_L2_TI011_DYNAMIC_COPY,
  G5_L2_TI011_FEEDBACK,
  G5_L2_TI011_FRAME_TRANSITIONS,
  G5_L2_TI011_ACTIVITIES,
  G5_L2_TI011_GLYPH,
  G5_L2_TI011_WORDS,
  G5_L2_TI011_KEY_TERMS,
  G5_L2_TI011_TEXT_BINDING,
  G5_L2_TI011_SOURCE_TITLE,
  createTi011Session,
  syncTi011Session,
  reduceTi011Session,
  ti011ActivityState,
  getTi011TeachingState,
  getG5L2Ti011TextSnapshot,
} from './g5-l2-ti011';
const root = fileURLToPath(new URL('../../../../', import.meta.url)),
  hash = (x: Buffer | string) => createHash('sha256').update(x).digest('hex'),
  json = async (p: string) => JSON.parse(await readFile(root + p, 'utf8'));
const source = (async () =>
  JSON.parse(
    gunzipSync(
      await readFile(
        root +
          'catalog/typography-v1/source-catalog/assets/7d9d0fca2dce9f4dca6d1b73a4c6d8b44138dba1f5dd278469c5f301f3e13075.json.gz',
      ),
    ).toString(),
  ))();
const scripts = (async () =>
  gunzipSync(
    await readFile(root + 'migrations/course-g05-l02-ti-011/audit/machine/ffdec-scripts.txt.gz'),
  ).toString())();
const ctx = (frame: number, extra: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame,
  frameDomain: 'sprite-228',
  rootFrame: 6,
  scenario: 'source-static-frame',
  lang: 'en',
  seed: 0,
  replay: 0,
  ...extra,
});
const feedbackActivity = (
  state: ReturnType<typeof createTi011Session>,
  frame: number,
  revision = 1,
  status: 'playing' | 'completed' = 'playing',
) => {
  const f = state.feedback!;
  const id =
    f.kind === 'correct'
      ? `correct-${f.variant}`
      : `wrong-${f.variant}-${f.phase === 'outro' ? 'outro' : 'intro'}`;
  return {
    id,
    frameDomain: `sprite-${G5_L2_TI011_FEEDBACK[f.kind].find((d) => d.variant === f.variant)!.sprite}`,
    frame,
    revision,
    status,
  };
};

test('exact source SWF/FLA custody, P1 membership and every block source ID resolve', async () => {
  const a = await source,
    bindings = await json('work/typography-v1/g5-l2-ti011/source-bindings.json');
  for (const b of bindings) assert.equal(hash(await readFile(b.path)), b.sha256);
  assert.equal(bindings[0].sha256, G5_L2_TI011_TEXT_BINDING.sourceSwfSha256);
  assert.equal(a.summary.dynamicFields, 1);
  assert.equal(a.summary.unresolvedRuns, 1);
  const ids = new Set(
    a.textDefinitions.flatMap((t: any) => [
      t.sourceTextId,
      ...(t.runs ?? []).map((r: any) => r.sourceTextId),
    ]),
  );
  for (const b of G5_L2_TI011_TEXT_BINDING.blocks) {
    for (const id of b.sourceTextIds) assert(ids.has(id), id);
    for (const id of b.sourceShapeIds ?? [])
      assert(a.shapeDefinitions.some((shape: any) => shape.characterId === id), `shape-${id}`);
  }
});

test('outlined root title retains its source shape and precedes the timed question throughout the lesson', async () => {
  const a = await source;
  const shape = a.shapeDefinitions.find((s: any) => s.characterId === 11);
  assert.equal(shape.sourceTagSha256, G5_L2_TI011_SOURCE_TITLE.sourceTagSha256);
  const rootTimeline = a.timelines.find((t: any) => t.timelineId === 'root');
  const instance = rootTimeline.instances.find((i: any) => i.instanceId === G5_L2_TI011_SOURCE_TITLE.instanceId);
  assert.equal(instance.characterId, 11);
  assert.equal(instance.firstFrame, 6);
  assert.equal(instance.lastFrameExclusive, 11);
  const placement = rootTimeline.events.find((e: any) => e.eventId === instance.createdByEventId);
  assert.deepEqual(placement.matrix, [1, 0, 0, 1, 0, 0]);
  const titleBinding = G5_L2_TI011_TEXT_BINDING.blocks.find(b => b.id === 'root-title')!;
  assert.deepEqual(titleBinding.sourceTextIds, []);
  assert.deepEqual(titleBinding.sourceShapeIds, [11]);
  assert.equal(titleBinding.instance?.id, instance.instanceId);
  assert.equal(titleBinding.role, 'title');
  for (const frame of [1, 63, 64, 96, 127, 128, 226, 240]) {
    const c = ctx(frame), state = getCourseG05L02Ti011FrameState(frame, c);
    const snapshot = getG5L2Ti011TextSnapshot(state, c);
    assert.equal(snapshot.status, 'ready');
    assert.equal(snapshot.blocks[0].id, 'root-title');
    assert.equal(snapshot.blocks[0].text, 'Percents: Try It!');
    assert.equal(snapshot.blocks[0].visible, true);
    const question = snapshot.blocks.find(b => b.id === 'question')!;
    assert(snapshot.blocks[0].readingOrder < question.readingOrder);
    assert.equal(question.visible, frame >= 64);
    const markup = renderToStaticMarkup(createElement(G5L2Ti011ModernRenderer, {...c, state}));
    assert.match(markup, /<h2[^>]*data-lesson-text-block="root-title"[^>]*>Percents: Try It!<\/h2>/);
    if (frame >= 64) {
      assert.match(markup, /<h3[^>]*data-lesson-text-block="question"/);
      assert(markup.indexOf('data-lesson-text-block="root-title"') < markup.indexOf('data-lesson-text-block="question"'));
    }
  }
  const wrongRoot = ctx(127, {rootFrame: 5});
  assert.equal(getG5L2Ti011TextSnapshot(getCourseG05L02Ti011FrameState(127, wrongRoot), wrongRoot).status, 'blocked');
});

test('the one dynamic field is read-only source WrongFeed, never a invented input', async () => {
  const a = await source,
    t = a.textDefinitions.find((t: any) => t.characterId === 82);
  assert.equal(t.kind, 'dynamic-field');
  assert.equal(t.flags.readOnly, true);
  assert.equal(t.flags.html, true);
  assert.equal(t.initialText.text, '<p align="left"></p>');
  const code = await scripts;
  assert.match(code, /txtFeed\.htmlText = _global\.WrongFeed/);
  for (const copy of Object.values(G5_L2_TI011_DYNAMIC_COPY))
    assert(code.includes(`_global.WrongFeed = "${copy}";`));
  assert.doesNotMatch(code, /record-fq-score|pointsAwarded/);
  const c = ctx(127),
    markup = renderToStaticMarkup(
      createElement(G5L2Ti011ModernRenderer, {...c, state: getCourseG05L02Ti011FrameState(127, c)}),
    );
  assert.doesNotMatch(markup, /<input|<textarea|<canvas|<img|<image/);
});

test('private-use Symbol code is source-resolved as multiplication without changing P1', async () => {
  const a = await source,
    run = a.textDefinitions.find((t: any) => t.characterId === 54).runs[0];
  assert.equal(run.text, null);
  assert.equal(run.fontId, 53);
  assert.equal(run.glyphs[0].code, 61620);
  assert.equal(run.glyphs[0].index, 0);
  assert.equal(G5_L2_TI011_GLYPH.value, '×');
  assert.equal(
    a.fonts.find((f: any) => f.characterId === 53).sourceTagSha256,
    G5_L2_TI011_GLYPH.fontTagSha256,
  );
  const resolution = await json('work/typography-v1/g5-l2-ti011/symbol-glyph-resolution.json'),
    code = await readFile(
      root +
        'apps/web/public/current-js-preview-assets/courses/course-g05-l02-ti-011/canvas-renderer.js',
      'utf8',
    );
  assert.equal(hash(code), resolution.safeJavascriptSha256);
  const fn = code.slice(code.indexOf('function font53('), code.indexOf('function text54('));
  assert.equal(hash(fn), resolution.sourceGlyphFunctionSha256);
  assert(fn.includes(resolution.pathData));
  assert.equal(resolution.nativeValue, '×');
  assert.match(
    a.textDefinitions
      .find((t: any) => t.characterId === 44)
      .runs.map((r: any) => r.text)
      .join(''),
    /Multiply/,
  );
});

test('complete question word reveals follow the exact source mask and preserve authored holds', async () => {
  const a = await source,
    e = await json('work/typography-v1/g5-l2-ti011/source-timing.json');
  assert.deepEqual(
    G5_L2_TI011_WORDS,
    e.question.words.map((w: any) => ({text: w.text, frame: w.frame})),
  );
  const t = a.timelines.find((t: any) => t.timelineId === 'sprite-228');
  for (const word of e.question.words) {
    const event = t.events.find((event: any) => event.depth === 1 && event.frame === word.frame);
    assert(event);
    assert(event.matrix[0] * e.question.mask.maxX + event.matrix[4] >= word.sourceInkRightTwips);
    assert.equal(getTi011TeachingState(word.frame - 1).question.includes(word.text), false);
    assert.equal(getTi011TeachingState(word.frame).question.includes(word.text), true);
  }
  assert.equal(getTi011TeachingState(58).question, '');
  assert.equal(getTi011TeachingState(96).question, 'What is 110% of 70?');
});

test('choice B=77 is correct by the exact placed source handler, not AnsBtn ordinal', async () => {
  const a = await source,
    code = await scripts;
  assert.equal(1.1 * 70, 77);
  assert.equal(G5_L2_TI011_CHOICES.find((c) => c.letter === 'B')?.value, '77');
  for (const c of G5_L2_TI011_CHOICES) {
    assert.equal(
      a.textDefinitions.find((t: any) => t.characterId === c.letterCharacter).runs[0].text,
      c.letter,
    );
    assert.equal(
      a.textDefinitions.find((t: any) => t.characterId === c.valueCharacter).runs[0].text,
      c.value,
    );
    const body =
      code
        .split(`===== DefineButton2_${c.buttonCharacter}/BUTTONCONDACTION on(release).as =====`)[1]
        ?.split('=====')[0] ?? '';
    assert.match(body, c.letter === 'B' ? /_root\.showRightFeed\(\)/ : /_global\.quizTryCount\+\+/);
    assert.equal(
      reduceTi011Session(createTi011Session(), 127, {type: 'answer', choice: c.letter}).nextState
        .feedback?.kind,
      c.letter === 'B' ? 'correct' : 'wrong',
    );
  }
  const named = a.timelines
    .find((t: any) => t.timelineId === 'sprite-228')
    .events.find((e: any) => e.name?.text === 'AnsBtn4');
  assert.equal(named.characterId, 29);
});

test('source alpha controls choices and post-feedback answer emphasis', async () => {
  const a = await source,
    t = a.timelines.find((t: any) => t.timelineId === 'sprite-228');
  const id = t.instances.find((i: any) => i.characterId === 15).instanceId;
  const events = t.events.filter((e: any) => e.instanceId === id);
  assert.equal(events.find((e: any) => e.colorTransform?.multiply[3] > 0).frame, 122);
  assert.equal(
    events.find((e: any) => e.frame > 122 && e.colorTransform?.multiply[3] === 0).frame,
    141,
  );
  assert.equal(getTi011TeachingState(121).choices, false);
  assert.equal(getTi011TeachingState(122).allChoices, true);
  assert.equal(getTi011TeachingState(141).allChoices, false);
  assert.deepEqual(
    t.instances.filter((i: any) => i.characterId === 227).map((i: any) => i.firstFrame),
    [226, 228, 230, 232],
  );
});

test('help remains hidden until source Help action and closes without advancing the parent', async () => {
  const code = await scripts;
  assert.match(
    code.split('===== DefineSprite_228/frame_127/DoAction.as =====')[1] ?? '',
    /Mc_PopUp\._visible = false/,
  );
  let s = createTi011Session();
  assert.equal(reduceTi011Session(s, 126, {type: 'help'}).allowed, false);
  s = reduceTi011Session(s, 127, {type: 'help'}).nextState;
  assert.equal(reduceTi011Session(s, 127, {type: 'answer', choice: 'B'}).allowed, false);
  const closed = reduceTi011Session(s, 127, {type: 'close-help'});
  assert.equal(closed.nextState.help, false);
  assert.equal(closed.frameRequest, null);
});

test('wrong dynamic feedback depends on the source retry count and waits at child22', () => {
  let s = reduceTi011Session(createTi011Session(), 127, {type: 'answer', choice: 'A'}).nextState;
  assert.equal(s.quizTryCount, 1);
  let a = feedbackActivity(s, 14);
  const snap = getG5L2Ti011TextSnapshot(
    getCourseG05L02Ti011FrameState(127, ctx(127)),
    ctx(127),
    s,
    a,
  );
  assert.equal(
    snap.blocks.find((b) => b.id === 'dynamic-feedback')?.text,
    G5_L2_TI011_DYNAMIC_COPY.first,
  );
  assert.equal(snap.blocks.find((b) => b.id === 'dynamic-feedback')?.visible, true);
  s = reduceTi011Session(s, 127, {type: 'activity-complete'}).nextState;
  assert.equal(s.feedback?.phase, 'waiting');
  assert.equal(reduceTi011Session(s, 127, {type: 'activity-complete'}).allowed, false);
  assert.equal(s.quizTryCount, 1);
});

test('every wrong variant admits source early Close only at its real popup frames and binds the revision', async () => {
  const a = await source,
    code = await scripts;
  for (const f of G5_L2_TI011_FEEDBACK.wrong) {
    let s = reduceTi011Session(createTi011Session(f.variant - 1), 127, {
      type: 'answer',
      choice: 'A',
    }).nextState;
    const tl = a.timelines.find((t: any) => t.timelineId === `sprite-${f.sprite}`),
      popup = tl.instances.find((i: any) => i.characterId === 89),
      events = tl.events.filter((e: any) => e.instanceId === popup.instanceId);
    assert.equal(events.find((e: any) => e.colorTransform?.multiply[3] > 0).frame, f.popupFirst);
    assert.match(
      code
        .split(`===== DefineSprite_${f.sprite}/frame_22/DoAction.as =====`)[1]
        ?.split('=====')[0] ?? '',
      /stop\(\)/,
    );
    assert.equal(
      reduceTi011Session(s, 127, {
        type: 'close-feedback',
        activity: feedbackActivity(s, f.popupFirst - 1),
      }).allowed,
      false,
    );
    const close = reduceTi011Session(s, 127, {
      type: 'close-feedback',
      activity: feedbackActivity(s, f.popupFirst),
    });
    assert.equal(close.allowed, true);
    assert.deepEqual(close.activityRequest, {
      id: `wrong-${f.variant}-outro`,
      parentFrame: 127,
      fromActivity: {id: `wrong-${f.variant}-intro`, revision: 1},
    });
    assert.equal(close.nextState.feedback?.phase, 'outro');
    assert.equal(
      reduceTi011Session(close.nextState, 127, {
        type: 'close-feedback',
        activity: feedbackActivity(close.nextState, 23, 2),
      }).allowed,
      false,
    );
  }
  assert.match(
    code
      .split('===== DefineButton2_88/BUTTONCONDACTION on(release).as =====')[1]
      ?.split('=====')[0] ?? '',
    /_parent\.gotoAndPlay\(23\)/,
  );
});

test('first wrong retries only after outro; second wrong advances with source counter reset', () => {
  let s = reduceTi011Session(createTi011Session(), 127, {type: 'answer', choice: 'A'}).nextState;
  s = reduceTi011Session(s, 127, {
    type: 'close-feedback',
    activity: feedbackActivity(s, 14),
  }).nextState;
  let done = reduceTi011Session(s, 127, {type: 'activity-complete'});
  assert.equal(done.nextState.quizTryCount, 1);
  assert.equal(done.frameRequest, null);
  s = reduceTi011Session(done.nextState, 127, {type: 'answer', choice: 'D'}).nextState;
  assert.equal(s.quizTryCount, 2);
  const snap = getG5L2Ti011TextSnapshot(
    getCourseG05L02Ti011FrameState(127, ctx(127)),
    ctx(127),
    s,
    feedbackActivity(s, 14, 2),
  );
  assert.equal(
    snap.blocks.find((b) => b.id === 'dynamic-feedback')?.text,
    G5_L2_TI011_DYNAMIC_COPY.second,
  );
  s = reduceTi011Session(s, 127, {
    type: 'close-feedback',
    activity: feedbackActivity(s, 22, 2),
  }).nextState;
  done = reduceTi011Session(s, 127, {type: 'activity-complete'});
  assert.deepEqual(done.frameRequest, G5_L2_TI011_FRAME_TRANSITIONS[0]);
  assert.equal(done.nextState.quizTryCount, 0);
  assert.equal(done.nextState.outcome, 'two-wrong-continuation');
});

test('correct variants complete at source frames and stale snapshots never acknowledge a new session', async () => {
  const a = await source,
    code = await scripts;
  for (const f of G5_L2_TI011_FEEDBACK.correct) {
    const s = reduceTi011Session(createTi011Session(f.variant - 1), 127, {
      type: 'answer',
      choice: 'B',
      activityRevisionFloor: 3,
    }).nextState;
    const snap = feedbackActivity(s, f.end, 4, 'completed');
    assert.equal(ti011ActivityState(s, snap).complete, true);
    assert.equal(ti011ActivityState(s, {...snap, revision: 3}).complete, false);
    assert.equal(ti011ActivityState(s, {...snap, frameDomain: 'bad'}).complete, false);
    assert.equal(
      a.timelines.find((t: any) => t.timelineId === `sprite-${f.sprite}`).declaredFrameCount,
      f.end,
    );
    assert.match(
      code
        .split(`===== DefineSprite_${f.sprite}/frame_${f.end}/DoAction.as =====`)[1]
        ?.split('=====')[0] ?? '',
      /_parent\.play\(\)/,
    );
    assert.equal(
      reduceTi011Session(s, 127, {type: 'activity-complete'}).nextState.outcome,
      'correct',
    );
    assert.deepEqual(
      syncTi011Session(s, ctx(1, {seed: f.variant - 1, replay: 1})),
      createTi011Session(f.variant - 1, 1),
    );
  }
});

test('ten activity segments preserve seven exact shared source assets and source offsets', async () => {
  const r = await json('work/typography-v1/g5-l2-ti011/feedback-audio.json');
  assert.equal(G5_L2_TI011_ACTIVITIES.length, 10);
  for (const d of G5_L2_TI011_ACTIVITIES) {
    const id = d.id.replace(/-(intro|outro)$/, ''),
      a = r.assets.find((a: any) => a.id === id);
    assert.equal(d.audio.sha256, a.sha256);
    assert.equal(hash(await readFile(root + a.path)), a.sha256);
    assert.equal(d.audio.firstFrame, a.firstBlockFrame);
    assert.equal(d.audio.lastFrame, a.lastBlockFrame);
    assert.equal(d.audio.language, 'shared');
    if (d.id.endsWith('-intro')) assert.equal(d.endFrame, 22);
    if (d.id.endsWith('-outro')) {
      assert.equal(d.startFrame, 23);
      assert('entryFromActivity' in d && d.entryFromActivity && typeof d.entryFromActivity === 'object');
      assert('lastFrame' in d.entryFromActivity);
      assert.equal(d.entryFromActivity.lastFrame, 22);
    }
  }
});

test('all page glossary IDs match the exact English source index and page-authored stop handlers', async () => {
  const d = await json('apps/web/public/generated/g4-grade-wide-keyterms-en.json'),
    code = await scripts;
  assert.equal(d.source.sha256, 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749');
  for (const [name, t] of Object.entries(G5_L2_TI011_KEY_TERMS)) {
    const entry = d.entries.find((e: any) => e.id === t.entryId);
    assert.equal(entry.titles.en.toLowerCase(), name.toLowerCase());
    const body =
      code
        .split(`===== DefineButton2_${t.buttonCharacter}/BUTTONCONDACTION on(release).as =====`)[1]
        ?.split('=====')[0] ?? '';
    assert(body.includes(`_global.KeyAttribute = "${name}";`));
    assert.match(body, /_root\.animation_mc\.animation\.stop\(\)/);
  }
});

test('source-scope, runtime language, state and capture mismatches remain blocked', () => {
  const c = ctx(127),
    s = getCourseG05L02Ti011FrameState(127, c);
  assert.equal(getG5L2Ti011TextSnapshot(s, c).status, 'ready');
  assert.equal(getG5L2Ti011TextSnapshot({...s, sourceSwfSha256: 'bad'}, c).status, 'blocked');
  assert.equal(getG5L2Ti011TextSnapshot(s, ctx(126)).status, 'blocked');
  assert.equal(getG5L2Ti011TextSnapshot(s, ctx(127, {lang: 'es'})).status, 'blocked');
  assert.equal(
    getG5L2Ti011TextSnapshot(s, ctx(127, {scenario: 'wrong-natural-trace'})).status,
    'blocked',
  );
});


test('Help separates source digit placement from value equality while preserving raw provenance', async () => {
  const a = await source;
  const rawProduct = a.textDefinitions.find((t: any) => t.characterId === 52);
  assert.equal(rawProduct.sourceTagSha256, 'c701eb826d5f34dc3b2d43a988c1151058584680a3d1af59198b1dca74d32ce1');
  assert.match(rawProduct.runs.map((r: any) => r.text ?? '').join(''), /360\s*=\s*36\.0/);
  assert(rawProduct.runs.flatMap((r: any) => r.glyphs).some((g: any) => g.code === 61 && g.unicode === '='));

  const c = ctx(127), state = getCourseG05L02Ti011FrameState(127, c);
  const opened = reduceTi011Session(createTi011Session(), 127, {type: 'help'}).nextState;
  const snapshot = getG5L2Ti011TextSnapshot(state, c, opened);
  const copy = (id: string) => snapshot.blocks.find(b => b.id === id && b.visible)?.text ?? '';
  const whole = Number(copy('help-whole')), decimalText = copy('help-decimal');
  const decimalPlaces = decimalText.split('.')[1].length;
  const digitMultiplier = Number(decimalText.replace('.', ''));
  const writtenDigits = whole * digitMultiplier, expectedProduct = writtenDigits / 10 ** decimalPlaces;
  assert.equal(writtenDigits, 360);
  assert.equal(expectedProduct, 120 * whole / 100);
  assert.equal(expectedProduct, 36);
  assert.notEqual(writtenDigits, expectedProduct);
  const transformation = copy('help-product').match(/(\d+)\s*→\s*(\d+\.\d+)/);
  assert(transformation);
  assert.equal(Number(transformation[1]), writtenDigits);
  assert.equal(Number(transformation[2]), expectedProduct);
  const equation = copy('help-final-product').match(/^(\d+)\s*×\s*(\d+\.\d+)\s*=\s*(\d+\.\d+)$/);
  assert(equation);
  assert.equal(Number(equation[1]), whole);
  assert.equal(Number(equation[2]), Number(decimalText));
  assert.equal(Number(equation[3]), expectedProduct);
  assert.doesNotMatch(snapshot.blocks.map(b => b.text).join(' '), /360\s*=\s*36\.0/);

  const ids = ['help-working-digits', 'help-decimal-placement', 'help-final-product'];
  for (const id of ids) {
    const block = snapshot.blocks.find(b => b.id === id);
    assert(block?.visible);
    const binding = G5_L2_TI011_TEXT_BINDING.blocks.find(b => b.id === id);
    assert(binding && binding.sourceTextIds.length > 0);
    assert(binding.sourceTextIds.every(sourceId => /character-(45|48|49|52|54)\//.test(sourceId)));
  }
  const closed = reduceTi011Session(opened, 127, {type: 'close-help'});
  assert.equal(closed.frameRequest, null);
  const afterClose = getG5L2Ti011TextSnapshot(state, c, closed.nextState);
  assert(ids.every(id => afterClose.blocks.find(b => b.id === id)?.visible === false));
});

test('learner Help visibly labels working digits and exposes the same process to assistive technology', () => {
  const c = ctx(127), state = getCourseG05L02Ti011FrameState(127, c);
  const opened = reduceTi011Session(createTi011Session(), 127, {type: 'help'}).nextState;
  const snapshot = getG5L2Ti011TextSnapshot(state, c, opened);
  const copy = (id: string) => snapshot.blocks.find(b => b.id === id && b.visible)?.text ?? '';
  const markup = renderToStaticMarkup(createElement(G5L2Ti011HelpCalculation, {text: copy}));
  assert.doesNotMatch(markup, /360\s*=\s*36\.0/);
  assert.doesNotMatch(markup, /<span[^>]*aria-hidden="true"[^>]*>\s*360\s*<\/span>/);
  const working = markup.match(/<p id="([^"]+)" data-lesson-text-block="help-working-digits">([^<]+)<\/p>/);
  const placement = markup.match(/<p id="([^"]+)" data-lesson-text-block="help-decimal-placement">([^<]+)<\/p>/);
  assert(working && placement);
  assert.match(working[2], /working digits.*decimal placement.*360/i);
  assert.match(placement[2], /decimal point.*one digit.*right/i);
  assert(markup.includes(`aria-labelledby="${working[1]}"`));
  assert(markup.includes(`aria-describedby="${placement[1]}"`));
  assert(markup.includes('role="group"'));
  for (const id of ['help-product', 'help-final-product']) {
    const rendered = markup.match(new RegExp(`data-lesson-text-block="${id}">([^<]+)</p>`));
    assert(rendered);
    assert.equal(rendered[1], copy(id));
  }
  const finalNumbers = copy('help-final-product').match(/\d+(?:\.\d+)?/g)?.map(Number);
  assert(finalNumbers && finalNumbers.length === 3);
  assert.equal(finalNumbers[0] * finalNumbers[1], finalNumbers[2]);
  assert.equal(finalNumbers[2], 36);
});
