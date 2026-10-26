import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {PNG} from 'pngjs';
import {fixture} from './g678-technical-assessor-fixture-v1.mjs';
import {assessPage} from './g678-technical-assessor-v1.mjs';
const directory = path.dirname(fileURLToPath(import.meta.url));
function setup(t) {
  const root = fs.mkdtempSync(path.join(directory, '.blank-test-')); t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const f = fixture(root), png = new PNG({width: 20, height: 20}); png.data.fill(255);
  const pin = f.put('source-transparent-initial.png', PNG.sync.write(png));
  f.contract.layout.expectedBlankStates = {initial: {sourcePin: f.contract.source, reason: 'Synthetic source has zero alpha at its initial frame; later source content remains required.'}};
  f.contract.contentAssertions = f.contract.contentAssertions.filter(a => a.stateId !== 'initial');
  for (const c of f.raw.cells) {
    for (const sample of c.documents[0].samples) Object.assign(sample.render, {commitId: `${c.cellId}:${sample.sequence}`, commitSequence: sample.sequence,
      committedAtMs: sample.atMs, sourceFrame: sample.source.frame, sourceFrameDomain: sample.source.frameDomain, sourceTick: sample.source.tick});
    for (const shot of c.screenshots.filter(s => s.stateId === 'initial')) shot.pin = pin;
  }
  f.saveContract();
  for (const s of f.raw.supplements.filter(s => s.stateId === 'initial')) for (const shot of s.screenshots) shot.pin = pin;
  return f;
}
function rejected(f, code) {const result = assessPage(f); assert.notEqual(result.status, 'pass'); assert.ok(result.issues.some(i => i.code === code), JSON.stringify(result.issues));}
test('source-defined transparent initial state passes only with exact source/state and real successful commit in all cells and supplements', t => {
  const f = setup(t), result = assessPage(f); assert.equal(result.status, 'pass', JSON.stringify(result.issues));
  assert.equal(result.cellResults.length, 6); assert.equal(result.supplementResults.length, 84);
});
test('generic allowedBlank flag cannot excuse missing initial rendering', t => {
  const f = setup(t); delete f.contract.layout.expectedBlankStates; f.contract.layout.allowedBlank = true; f.saveContract();
  rejected(f, 'stage-image-blank-or-insufficient');
});
test('another file pin cannot authorize a source-blank initial frame', t => {
  const f = setup(t); f.contract.layout.expectedBlankStates.initial.sourcePin = f.contract.inputPins[1]; f.saveContract();
  rejected(f, 'source-blank-exception-must-bind-exact-initial-source');
});
test('a terminal or arbitrary state cannot borrow the initial-only exception', t => {
  const f = setup(t); f.contract.layout.expectedBlankStates.terminal = f.contract.layout.expectedBlankStates.initial; f.saveContract();
  rejected(f, 'source-blank-exception-must-bind-exact-initial-source');
});
test('blank source requires an explicit source-backed reason and frame/domain predicate', t => {
  const f = setup(t); f.contract.layout.expectedBlankStates.initial.reason = ''; f.saveContract();
  rejected(f, 'source-blank-exception-must-bind-exact-initial-source');
  f.contract.layout.expectedBlankStates.initial.reason = 'Synthetic alpha zero'; delete f.contract.terminal.initialState['source.frame']; f.saveContract();
  rejected(f, 'source-blank-initial-frame-predicate-required');
});
test('parent frame/source state without a real committed surface cannot pass an expected blank', t => {
  const f = setup(t); delete f.raw.cells[0].documents[0].samples[0].render.commitId;
  rejected(f, 'expected-blank-initial-real-commit-required');
});
test('a commit for another frame cannot justify the blank image', t => {
  const f = setup(t); f.raw.cells[0].documents[0].samples[0].render.sourceFrame = 99;
  rejected(f, 'expected-blank-initial-real-commit-required');
});
test('a source-defined blank initial image must actually be blank, not a colored error placeholder', t => {
  const f = setup(t); f.raw.cells[0].screenshots[0].pin = f.raw.cells[0].screenshots[1].pin;
  rejected(f, 'source-blank-initial-has-unexpected-drawing');
});
test('later blank teaching states still fail their normal image and content gates', t => {
  const f = setup(t); f.raw.cells[0].screenshots[2].pin = f.raw.cells[0].screenshots[0].pin;
  rejected(f, 'stage-image-blank-or-insufficient');
});
test('supplemental blank observations require the same real commit, not a flag', t => {
  const f = setup(t), s = f.raw.supplements.find(s => s.stateId === 'initial'); delete s.layoutChecks[0].sample.render.commitId;
  rejected(f, 'expected-blank-initial-real-commit-required');
});
test('intentional initial transparency does not excuse missing source object or mask evidence elsewhere', t => {
  const f = setup(t); f.contract.contentAssertions.push({id: 'real-terminal-source-object', stateId: 'terminal', selector: 'canvas', method: 'rendered-object',
    surfaceKind: 'canvas', objectId: 'source-42', expectedState: {sourceCharacterId: 42}, sourcePin: f.contract.source}); f.saveContract();
  rejected(f, 'required-source-content-not-observed');
});
