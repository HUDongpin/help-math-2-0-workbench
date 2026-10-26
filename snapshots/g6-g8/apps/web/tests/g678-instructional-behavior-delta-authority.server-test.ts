import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateG678InstructionalBehaviorDelta, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT} from '../lib/g678-instructional-behavior-delta-authority.server';
const load = (file: string) => JSON.parse(readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8'));
const predecessor = {...G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT, value: load(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path)};
const dual = () => load('catalog/product-bridge-calibrations/g678-alg-l11-instructional-feedback-host-score-successor-v1.fragment.json');

test('actual dual successor retains21 source runs and overrides only the two reviewed pages', () => {
  const value = dual(), runs = validateG678InstructionalBehaviorDelta(value, predecessor);
  assert.equal(runs.size, 23);
  assert.equal([...runs.values()].filter(run => run.sha256 === value.compilerRun.sha256).length, 21);
  assert.deepEqual(runs.get('shared-alg001-l11-p034'), value.p034CompilerRun);
  assert.deepEqual(runs.get('shared-alg001-l11-p044'), value.p044CompilerRun);
});

test('crossed runs, invented capabilities and inherited entry changes fail closed', () => {
  for (const change of [
    (v: any) => {v.p034CompilerRun = v.p044CompilerRun;},
    (v: any) => {v.entries[0].module = './modules/another-module';},
    (v: any) => {v.entries.find((e: any) => e.key.endsWith('p034')).runtimeContract.lessonHostCapabilities.push('audio');},
    (v: any) => {v.entries.find((e: any) => e.key.endsWith('p044')).runtimeContract.scenario = 'another-scenario';},
    (v: any) => {v.entries.reverse();},
  ]) {
    const value = dual(); change(value);
    assert.throws(() => validateG678InstructionalBehaviorDelta(value, predecessor), /BEHAVIOR_DELTA_INVALID/u);
  }
  assert.throws(() => validateG678InstructionalBehaviorDelta(dual(), undefined));
  assert.throws(() => validateG678InstructionalBehaviorDelta(dual(), {...predecessor, value: {entries: []}}));
});

test('stale wrapper/timeline cannot borrow a new member/run and declared host capability', () => {
  for (const id of ['shared-alg001-l11-p034', 'shared-alg001-l11-p044']) {
    const value = dual();
    const entry = value.entries.find((item: any) => item.key === id);
    const old = predecessor.value.entries.find((item: any) => item.key === id);
    entry.module = old.module;
    entry.moduleFile = structuredClone(old.moduleFile);
    entry.timeline = structuredClone(old.timeline);
    assert.throws(() => validateG678InstructionalBehaviorDelta(value, predecessor),
      /dual authority value differs from its exact canonical bytes/u);
  }
});

test('an altered changed-member hash or acceptance claim is not the exact reviewed dual authority', () => {
  for (const change of [(v: any) => {v.entries.at(-1).memberManifest.sha256 = '0'.repeat(64);},
    (v: any) => {v.acceptanceEffects.audioAccepted = true;}]) {
    const value = dual(); change(value);
    assert.throws(() => validateG678InstructionalBehaviorDelta(value, predecessor), /exact canonical bytes/u);
  }
});
