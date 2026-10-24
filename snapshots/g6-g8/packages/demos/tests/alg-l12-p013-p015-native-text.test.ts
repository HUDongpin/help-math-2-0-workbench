import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pairTextBinding, pairTextSnapshot} from '../src/alg-l12-p013-p015-native-text';
import {PAIR_NATIVE_TEXT_DATA} from '../src/generated/alg-l12-p013-p015-native-text-data';

const context = (frame: number, frameDomain: string) => ({frame, frameDomain, rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en' as const, seed: 0, replay: 0});

test('P013 title and masked native prose follow source frames while graph labels remain Canvas', () => {
  const id = 'shared-alg001-l12-p013';
  const binding = pairTextBinding(id);
  assert.equal(binding.sourceSwfSha256, PAIR_NATIVE_TEXT_DATA.p013.source.swfSha256);
  assert.deepEqual(binding.blocks.map(block => block.role), ['title', 'body', 'body']);
  const first = pairTextSnapshot(id, context(1, 'sprite-63'));
  assert.equal(first.status, 'ready');
  assert.equal(first.title.text, 'Graphing in the Coordinate Plane: Vocabulary');
  assert.equal(first.suppressedInstances.length, 1); // outlined title only
  assert.deepEqual(first.sourceSuppressionInstanceIds, ['root/depth-68/generation-1']);
  assert.equal(first.prose[0].text, '');
  assert.equal(first.figureLabels.length, 0);
  const partial = pairTextSnapshot(id, context(20, 'sprite-63'));
  assert.match(partial.prose[0].text, /^The x-axis/);
  assert(!partial.prose[0].text.includes('four regions'));
  assert.equal(partial.suppressedInstances.length, 2);
  assert(partial.figureLabels.every(item => item.rendering === 'source-canvas-retained'));
  const middle = pairTextSnapshot(id, context(72, 'sprite-63'));
  assert.match(middle.prose[0].text, /four regions/);
  assert.equal(middle.prose[1].text, '');
  assert.equal(middle.suppressedInstances.length, 3);
  assert.deepEqual(middle.sourceSuppressionInstanceIds, [
    'root/depth-68/generation-1', 'sprite-63/depth-3/generation-1',
    'sprite-63/depth-13/generation-1']);
  const end = pairTextSnapshot(id, context(372, 'sprite-63'));
  assert.match(end.prose[1].text, /called quadrants\./);
  assert(end.figureLabels.some(item => item.role === 'quadrant-callout'));
  assert(end.prose[0].runs.some(run => run.sourceGlossaryEntryId === 'coordinate-plane'));
});

test('P015 distinct source prose, glossary spans and held graph labels survive shared binding', () => {
  const id = 'shared-alg001-l12-p015';
  const start = pairTextSnapshot(id, context(2, 'sprite-76'));
  assert.equal(start.status, 'ready');
  assert.equal(start.prose[0].visible, false);
  assert.equal(start.suppressedInstances.length, 1);
  const during = pairTextSnapshot(id, context(72, 'sprite-76'));
  assert.match(during.prose[0].text, /plot ordered pairs/);
  assert(during.prose[1].text.length > 0);
  assert.equal(during.suppressedInstances.length, 3);
  assert.deepEqual(during.sourceSuppressionInstanceIds, [
    'root/depth-129/generation-1', 'sprite-76/depth-110/generation-1',
    'sprite-76/depth-124/generation-1']);
  const end = pairTextSnapshot(id, context(474, 'sprite-76'));
  assert.equal(end.prose.map(item => item.text).join(''),
    'To plot ordered pairs means to locate and place points on a grid using x and y coordinates.');
  assert(end.prose[1].runs.some(run => run.sourceGlossaryEntryId === 'coordinate'));
  assert(end.figureLabels.some(item => item.role === 'coordinate-label' && item.text === '(7,4)'));
  assert(end.figureLabels.every(item => item.rendering === 'source-canvas-retained'));
});

test('unsupported domain, scenario and source language fail closed with no suppression', () => {
  for (const id of ['shared-alg001-l12-p013', 'shared-alg001-l12-p015'] as const) {
    const domain = id.endsWith('p013') ? 'sprite-63' : 'sprite-76';
    for (const invalid of [
      {...context(20, domain), frameDomain: 'root'},
      {...context(20, domain), scenario: 'unreviewed'},
      {...context(20, domain), lang: 'es' as const},
    ]) {
      const result = pairTextSnapshot(id, invalid);
      assert.equal(result.status, 'blocked');
      assert.deepEqual(result.suppressedInstances, []);
      assert.deepEqual(result.sourceSuppressionInstanceIds, []);
      assert.deepEqual(result.blocks, []);
    }
  }
});

test('every child frame emits exactly the active source suppression identities', () => {
  for (const [id, domain, count, source] of [
    ['shared-alg001-l12-p013', 'sprite-63', 372, PAIR_NATIVE_TEXT_DATA.p013],
    ['shared-alg001-l12-p015', 'sprite-76', 474, PAIR_NATIVE_TEXT_DATA.p015],
  ] as const) {
    const title = id.endsWith('p013') ? 'root/depth-68/generation-1' : 'root/depth-129/generation-1';
    const prose = id.endsWith('p013') ? [
      ['sprite-63/depth-3/generation-1', 2], ['sprite-63/depth-13/generation-1', 72],
    ] as const : [
      ['sprite-76/depth-110/generation-1', 3], ['sprite-76/depth-124/generation-1', 66],
    ] as const;
    assert.equal(pairTextBinding(id).sourceSwfSha256, source.source.swfSha256);
    for (let frame = 1; frame <= count; frame++) {
      const snapshot = pairTextSnapshot(id, context(frame, domain));
      assert.equal(snapshot.status, 'ready', `${id} frame ${frame}`);
      assert.deepEqual(snapshot.sourceSuppressionInstanceIds,
        [title, ...prose.filter(([, first]) => frame >= first).map(([instance]) => instance)],
        `${id} frame ${frame}`);
      assert.equal(snapshot.suppressedInstances.length, snapshot.sourceSuppressionInstanceIds.length);
    }
  }
});
