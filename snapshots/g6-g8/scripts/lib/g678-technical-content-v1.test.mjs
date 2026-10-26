import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {PNG} from 'pngjs';
import {fixture} from './g678-technical-assessor-fixture-v1.mjs';
import {assessPage, assessCatalog} from './g678-technical-assessor-v1.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
function setup(t) {const root = fs.mkdtempSync(path.join(directory, '.content-test-')); t.after(() => fs.rmSync(root, {recursive: true, force: true})); return fixture(root);}
function assertIssue(f, code) {const result = assessPage(f); assert.notEqual(result.status, 'pass'); assert.ok(result.issues.some(i => i.code === code), JSON.stringify(result.issues));}
function sourceObject(f, surfaceKind = 'canvas') {
  const assertion = {id: 'source-chart', stateId: 'terminal', selector: '[data-source-chart]', method: 'rendered-object', surfaceKind,
    objectId: 'root/chart:42', expectedState: {sourceCharacterId: 42, instancePath: 'root/chart', label: 'x'}, sourcePin: f.contract.source};
  f.contract.contentAssertions = [assertion];
  for (const c of f.raw.cells) for (const sample of c.documents[0].samples) Object.assign(sample.render, {commitId: `${c.cellId}:${sample.sequence}`, commitSequence: sample.sequence});
  const check = (sample, imagePin) => ({assertionId: assertion.id, stateId: assertion.stateId, selector: assertion.selector,
    method: 'rendered-object', surfaceKind, objectId: assertion.objectId, observation: 'committed-render-object', objectState: {...assertion.expectedState},
    sampleSequence: sample.sequence, surfaceId: sample.render.surfaceId, playerId: sample.identity.playerId, commitId: sample.render.commitId,
    rect: {left: 20, top: 100, right: 20 + 20 / sample.viewport.dpr, bottom: 100 + 20 / sample.viewport.dpr, width: 20 / sample.viewport.dpr, height: 20 / sample.viewport.dpr},
    computed: {display: 'block', visibility: 'visible', opacity: 1}, clippedPixels: 0, obscuredPixels: 0,
    screenshot: {scope: 'content-object', objectId: assertion.objectId, sampleSequence: sample.sequence, surfaceId: sample.render.surfaceId, pin: imagePin}});
  for (const c of f.raw.cells) c.contentChecks = [check(c.documents[0].samples[2], c.screenshots[0].pin)];
  f.saveContract();
  for (const s of f.raw.supplements) s.contentChecks = s.stateId === 'terminal' ? [check(s.layoutChecks[0].sample, s.screenshots[0].pin)] : [];
  return f;
}

test('nonblank stage and caller passed cannot replace missing source content inventory', t => {
  const f = setup(t); f.contract.contentAssertions = []; f.raw.passed = true; f.saveContract();
  assertIssue(f, 'nonempty-unique-source-content-inventory-required');
  assert.equal(assessCatalog({expectedAnimationIds: [f.contract.animationId], pages: [f], root: f.root}).exitCode, 1);
});
test('duplicate source content requirements cannot manufacture coverage', t => {
  const f = setup(t); f.contract.contentAssertions.push({...f.contract.contentAssertions[0]}); f.saveContract();
  assertIssue(f, 'nonempty-unique-source-content-inventory-required');
});
for (const surfaceKind of ['canvas', 'svg', 'dom']) test(`${surfaceKind} source objects bind actual committed state, measured bounds, and retained crop`, t => {
  const f = sourceObject(setup(t), surfaceKind), result = assessPage(f);
  assert.equal(result.status, 'pass', JSON.stringify(result.issues));
});
test('object evidence cannot be declared by text-only innerText checks', t => {
  const f = sourceObject(setup(t)); f.raw.cells[0].contentChecks[0].method = 'innerText';
  assertIssue(f, 'required-source-content-mismatch-or-hidden');
});
test('wrong source object or placeholder pixels do not satisfy the source object contract', t => {
  const f = sourceObject(setup(t)); f.raw.cells[0].contentChecks[0].objectState.sourceCharacterId = 999;
  assertIssue(f, 'source-object-or-committed-render-binding-mismatch');
});
test('a stale commit or neighboring surface cannot supply current object content', t => {
  const f = sourceObject(setup(t)); f.raw.cells[0].contentChecks[0].commitId = 'old';
  assertIssue(f, 'source-object-or-committed-render-binding-mismatch');
});
test('a graphic crop must show actual nonblank pixels in its measured region', t => {
  const f = sourceObject(setup(t)), png = new PNG({width: 20, height: 20}); png.data.fill(255);
  f.raw.cells[0].contentChecks[0].screenshot.pin = f.put('blank-object.png', PNG.sync.write(png));
  assertIssue(f, 'source-content-object-image-blank-or-wrong-region');
});
test('a stage screenshot cannot substitute the inspected source object crop', t => {
  const f = sourceObject(setup(t)); f.raw.cells[0].contentChecks[0].screenshot.scope = 'stage';
  assertIssue(f, 'source-content-object-image-unbound');
});
test('content-object visibility and clipping are checked independently of stage layout', t => {
  const f = sourceObject(setup(t)); f.raw.cells[0].contentChecks[0].clippedPixels = 1;
  assertIssue(f, 'source-content-object-clipped-or-obscured');
});
test('supplement object evidence cannot borrow another source commit or skip a page-specific object', t => {
  const f = sourceObject(setup(t)), supplemental = f.raw.supplements.find(s => s.stateId === 'terminal');
  supplemental.contentChecks[0].objectState = {sourceCharacterId: 999};
  assertIssue(f, 'source-object-or-committed-render-binding-mismatch');
});
test('SVG text uses the real SVG namespace and measured visible text rather than innerText assumptions', t => {
  const f = setup(t); for (const a of f.contract.contentAssertions) a.method = 'svg-text';
  for (const c of f.raw.cells) for (const check of c.contentChecks) Object.assign(check, {method: 'svg-text', namespaceURI: 'http://www.w3.org/2000/svg'});
  f.saveContract(); for (const s of f.raw.supplements) for (const check of s.contentChecks) Object.assign(check, {method: 'svg-text', namespaceURI: 'http://www.w3.org/2000/svg'});
  assert.equal(assessPage(f).status, 'pass'); f.raw.cells[0].contentChecks[0].namespaceURI = 'http://www.w3.org/1999/xhtml';
  assertIssue(f, 'required-source-content-mismatch-or-hidden');
});
test('object assertions need an executable source object predicate, not a description alone', t => {
  const f = sourceObject(setup(t)); f.contract.contentAssertions[0].expectedState = {}; f.saveContract();
  assertIssue(f, 'source-content-assertion-invalid');
});
