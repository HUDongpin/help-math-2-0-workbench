import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  P009_GLOSSARY_CLOSE_POLICY,
  P009_GLOSSARY_MAIN_FRAME_COUNT,
  P009_GLOSSARY_SOURCE_SHA256,
  P009_GLOSSARY_TERMS,
  canExplicitlyResumeP009,
  initialP009GlossaryState,
  reduceP009Glossary,
  requestP009Glossary,
} from '../src/alg-l12-p009-glossary';

interface TypographyInventory {
  sourceSha256: string;
  sourceEntryCondition: {mainFrameCount: number};
  glossaryButtons: Array<{
    characterId: number;
    sourceKeyAttribute: string;
    sourceRunId: string;
    sourceInstances: Array<{firstFrame: number}>;
    actionScriptPin: {path: string; bytes: number; sha256: string};
  }>;
  runInstanceVisibilitySummary: Array<{
    sourceTextId: string;
    firstAllInkBoundsContainedAndFullOpacityFrame: number;
  }>;
}

const inventoryBytes = readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p009/audit/typography-source-inventory-v1.json', import.meta.url,
));
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const inventory = JSON.parse(inventoryBytes.toString()) as TypographyInventory;

test('P009 keys, source runs and later modern readable frames match frozen SWF/AS evidence', () => {
  assert.equal(sha256(inventoryBytes), '362c4376b4c8bc2af9660ea197857d681c135827aae2e9afd525e70c38925938');
  assert.equal(P009_GLOSSARY_SOURCE_SHA256, inventory.sourceSha256);
  assert.equal(P009_GLOSSARY_MAIN_FRAME_COUNT, inventory.sourceEntryCondition.mainFrameCount);
  assert.equal(P009_GLOSSARY_TERMS.length, 8);
  assert.deepEqual(P009_GLOSSARY_TERMS.map(term => ({
    characterId: term.characterId, sourceKeyAttribute: term.sourceKeyAttribute,
    sourceTextId: term.sourceTextId,
  })), inventory.glossaryButtons.map(button => ({
    characterId: button.characterId, sourceKeyAttribute: button.sourceKeyAttribute,
    sourceTextId: button.sourceRunId,
  })));
  for (const term of P009_GLOSSARY_TERMS) {
    const button = inventory.glossaryButtons.find(item => item.characterId === term.characterId)!;
    const visibility = inventory.runInstanceVisibilitySummary.filter(item => item.sourceTextId === term.sourceTextId);
    assert.equal(visibility.length, 1);
    assert.equal(term.firstReadableFrame, visibility[0].firstAllInkBoundsContainedAndFullOpacityFrame);
    assert.ok(button.sourceInstances.every(instance => instance.firstFrame < term.firstReadableFrame));
    assert.ok(button.actionScriptPin.path.startsWith('migrations/shared-alg001-l12-p009/audit/actionscript/'));
    const script = readFileSync(new URL(`../../../${button.actionScriptPin.path}`, import.meta.url));
    assert.equal(script.length, button.actionScriptPin.bytes);
    assert.equal(sha256(script), button.actionScriptPin.sha256);
    assert.equal(script.toString().replaceAll('\r\n', '\n'),
      `on(release){\n   _global.KeyAttribute = "${term.sourceKeyAttribute}";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}\n`);
  }
  assert.match(P009_GLOSSARY_CLOSE_POLICY, /^stay-paused-until-explicit-resume/);
  assert.match(P009_GLOSSARY_CLOSE_POLICY, /original-parity-pending/);
});

for (const term of P009_GLOSSARY_TERMS) {
  test(`P009 ${term.sourceKeyAttribute} rejects early requests and accepts its complete-run boundary`, () => {
    const button = inventory.glossaryButtons.find(item => item.characterId === term.characterId)!;
    for (const frame of [1, ...button.sourceInstances.map(instance => instance.firstFrame), term.firstReadableFrame - 1]) {
      assert.equal(requestP009Glossary(frame, term.characterId, false), null);
    }
    for (const frame of [term.firstReadableFrame, term.firstReadableFrame + 1, 394]) {
      assert.deepEqual(requestP009Glossary(frame, term.characterId, false), {
        ...term, requestedAtFrame: frame,
      });
    }
    assert.equal(requestP009Glossary(term.firstReadableFrame, term.characterId, true), null);
  });
}

test('invalid frames, unknown/noninteger keys and malformed pending flags fail closed', () => {
  for (const frame of [0, -1, 395, 25.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(requestP009Glossary(frame, 6, false), null);
    assert.equal(canExplicitlyResumeP009(frame, false), false);
  }
  for (const key of [0, -1, 5, 10, 26, 29, 31, 34, 999, 6.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(requestP009Glossary(394, key, false), null);
  }
  for (const pending of [true, undefined, null, 0, 1, 'false']) {
    assert.equal(requestP009Glossary(25, 6, pending as boolean), null);
    assert.equal(canExplicitlyResumeP009(25, pending as boolean), false);
  }
});

test('pure pending state rejects duplicates without moving or storing the host playhead', () => {
  const initial = Object.freeze(initialP009GlossaryState());
  assert.deepEqual(Object.keys(initial), ['pending']);
  assert.equal(reduceP009Glossary(initial, {kind: 'request', frame: 24, characterId: 6}), initial);
  const opened = Object.freeze(reduceP009Glossary(initial, {kind: 'request', frame: 25, characterId: 6}));
  assert.equal(initial.pending, null);
  assert.equal(opened.pending?.requestedAtFrame, 25);
  assert.deepEqual(Object.keys(opened), ['pending']);
  for (const term of P009_GLOSSARY_TERMS) {
    assert.equal(reduceP009Glossary(opened, {kind: 'request', frame: 394, characterId: term.characterId}), opened);
  }
  assert.equal(canExplicitlyResumeP009(25, opened.pending !== null), false);
});

test('close/return, Replay and navigation clear pending without automatically resuming', () => {
  const opened = Object.freeze(reduceP009Glossary(initialP009GlossaryState(), {
    kind: 'request', frame: 212, characterId: 33,
  }));
  for (const kind of ['close', 'replay', 'navigation'] as const) {
    const cleared = reduceP009Glossary(opened, {kind});
    assert.deepEqual(cleared, {pending: null});
    assert.equal(opened.pending?.sourceKeyAttribute, 'Y-coordinate');
    assert.equal(reduceP009Glossary(cleared, {kind}), cleared);
    // The reducer emits no frame, transport or resume instruction. A separate
    // explicit host action may resume only after a nonterminal close.
    assert.deepEqual(Object.keys(cleared), ['pending']);
    assert.equal(canExplicitlyResumeP009(212, cleared.pending !== null), true);
  }
});

test('terminal glossary can open/close at 394 while every explicit resume remains blocked', () => {
  for (const term of P009_GLOSSARY_TERMS) {
    const opened = reduceP009Glossary(initialP009GlossaryState(), {
      kind: 'request', frame: 394, characterId: term.characterId,
    });
    assert.equal(opened.pending?.sourceKeyAttribute, term.sourceKeyAttribute);
    assert.equal(canExplicitlyResumeP009(394, true), false);
    const closed = reduceP009Glossary(opened, {kind: 'close'});
    assert.equal(closed.pending, null);
    assert.equal(canExplicitlyResumeP009(394, false), false);
    assert.deepEqual(reduceP009Glossary(opened, {kind: 'replay'}), initialP009GlossaryState());
    assert.deepEqual(reduceP009Glossary(opened, {kind: 'navigation'}), initialP009GlossaryState());
  }
  assert.equal(canExplicitlyResumeP009(393, false), true);
});
