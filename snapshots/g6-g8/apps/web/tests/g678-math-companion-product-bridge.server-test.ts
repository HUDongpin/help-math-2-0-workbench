import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';
import {COMPANION, PRIOR, PROPOSED_FREEZE, composeMathCompanionRegistration}
  from '../../../scripts/plan-g678-alg-l11-math-companion-registration.mjs';
import {G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT}
  from '../lib/g678-instructional-behavior-delta-authority.server';
import {G678_MATH_COMPANION_SUFFIXES} from '../lib/g678-math-companion-authority.server';

process.env.HELP_MATH_G678_CALIBRATION_PHASE = 'alg-l11-math-companion-provisional-browser-qa';
const bridge = await import('../lib/g678-calibration-product-bridge.server');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const absolute = (path: string) => new URL(`../../../${path}`, import.meta.url);
const read = (path: string) => {
  const bytes = readFileSync(absolute(path));
  return {path, bytes: bytes.length, sha256: hash(bytes), value: JSON.parse(bytes.toString('utf8'))};
};
const bind = (path: string, value: any) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  return {path, bytes: bytes.length, sha256: hash(bytes), value};
};
const descriptor = ({path, bytes, sha256}: ReturnType<typeof read>) => ({path, bytes, sha256});
const ids = Object.keys(G678_MATH_COMPANION_SUFFIXES);

// Use the real reviewed planner in memory. Neither tests nor bridge write the
// proposed V4 files, private registry, generated index, or browser evidence.
function fixture() {
  const priorFreeze = read(PRIOR.freeze.path), priorFragment = read(PRIOR.fragment.path);
  const registryPath = existsSync(absolute(PRIOR.registry.path))
    ? PRIOR.registry.path : 'packages/demos/private-current-js-registry.json';
  const priorRegistry = read(registryPath), companion = read(COMPANION.path);
  const plannerPath = 'scripts/plan-g678-alg-l11-math-companion-registration.mjs';
  const plannerBytes = readFileSync(absolute(plannerPath));
  const prepared = composeMathCompanionRegistration({priorFreeze: priorFreeze.value,
    priorFragment: priorFragment.value, priorRegistry: priorRegistry.value,
    companion: companion.value, plannerBinding: {path: plannerPath, bytes: plannerBytes.length, sha256: hash(plannerBytes)}});
  const freeze = bind(PROPOSED_FREEZE, prepared.freeze);
  const entries = new Map(prepared.fragment.calibration.entries.map((entry: any) => [entry.key, entry]));
  const registry = {hasModule: (id: string) => entries.has(id), registrationFor: (id: string) => {
    const entry = entries.get(id) as any;
    if (!entry) return undefined;
    const artifact = entry.artifacts;
    return {scope: 'private-engineering', maturity: 'private-current-js', deploymentScope: 'local-only',
      calibrationId: bridge.G678_CALIBRATION_ID, freezeManifestSha256: freeze.sha256,
      moduleSha256: artifact.module.sha256, timelineSha256: artifact.timeline.sha256,
      ...(artifact.kind === 'maintained-dom-module-v1' ? {rendererBindingKind: artifact.kind,
        memberManifestSha256: artifact.memberManifest.sha256, sourceRunSha256: artifact.sourceRun.sha256}
        : {runtimeSha256: artifact.runtime.sha256})};
  }};
  return {catalog: read(bridge.G678_SHARED_CATALOG_PATH), profile: read(bridge.G678_SHARED_PROFILE_PATH),
    freeze, registry, selectionAuthorities: freeze.value.inputs.selectionAuthorities.map((a: any) => read(a.path)),
    predecessorFileBinding: read(G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path),
    dualPredecessorFileBinding: read(G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path),
    priorFreeze, priorFragment, priorRegistry, companion, prepared};
}

test('V4 has one exact phase and filename; V2/V3 constants and arbitrary future admission are unchanged', () => {
  assert.equal(bridge.G678_CALIBRATION_FREEZE_PATH, PROPOSED_FREEZE);
  assert.equal(bridge.G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH, PROPOSED_FREEZE);
  assert.equal(bridge.G678_ALG_L11_INSTRUCTIONAL_SUCCESSOR_FREEZE_PATH,
    'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json');
  assert.equal(bridge.G678_ALG_L11_FEEDBACK_HOST_SCORE_SUCCESSOR_FREEZE_PATH, PRIOR.freeze.path);
  for (const path of [PRIOR.freeze.path, PROPOSED_FREEZE.replace('-v4.', '-v5.'), PROPOSED_FREEZE.replace('-v4.', '-v40.')]) {
    const input = fixture(); input.freeze.path = path;
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /SOURCE_BINDING_INVALID/u);
  }
});

test('actual planner projection preserves375 page objects and registry entries and adds only two validated companion slots', () => {
  const input = fixture(), before = JSON.stringify(input.freeze);
  const result = bridge.buildG678PartialCalibrationSnapshot(input as never);
  assert.equal(JSON.stringify(input.freeze), before, 'bridge must not mutate planner output');
  assert.equal(result.status, 'ready'); assert.equal(result.registeredPlacementCount, 377);
  assert.equal(result.runtimeAssets.length, 354); assert.equal(result.maintainedDomRenderers.length, 23);
  assert.equal(result.descriptors.length, 44);
  const retained = (pages: any[]) => pages.filter(page => !ids.includes(page.animationId));
  assert.equal(retained(input.freeze.value.selectedPages).length, 375);
  assert.deepEqual(retained(input.freeze.value.selectedPages), retained(input.priorFreeze.value.selectedPages));
  const retainedEntries = (entries: any[]) => entries.filter(entry => !ids.includes(entry.key));
  assert.deepEqual(retainedEntries(input.prepared.fragment.calibration.entries), retainedEntries(input.priorFragment.value.calibration.entries));
  assert.deepEqual(input.prepared.nextRegistry.calibrations.filter((c: any) => c.calibrationId !== bridge.G678_CALIBRATION_ID),
    input.priorRegistry.value.calibrations.filter((c: any) => c.calibrationId !== bridge.G678_CALIBRATION_ID));
  const lesson = result.descriptors.find(d => d.pages.some(p => p.animationId === ids[0]))!;
  assert.equal(lesson.pages.length, 44); assert.equal(lesson.productBridge.registeredAnimationCount, 44);
  assert.equal(lesson.glossary?.length, 43);
  assert.deepEqual(lesson.support.lessonHostCapabilities, ['glossary', 'navigation', 'practice-feedback', 'fq-scoring']);
  for (const [id, suffix] of Object.entries(G678_MATH_COMPANION_SUFFIXES)) {
    const page = lesson.pages.find(page => page.animationId === id)!;
    assert.deepEqual(page.presentation, {pageInteractionCompanionTargetIdSuffix: suffix});
    const frozenPage = input.freeze.value.selectedPages.find((p: any) => p.animationId === id);
    assert.deepEqual(frozenPage.runtime.lessonHostCapabilities, id.endsWith('p034') ? ['practice-feedback'] : ['fq-scoring']);
  }
  assert.equal(lesson.pages.filter(page => page.presentation?.pageInteractionCompanionTargetIdSuffix.endsWith('-math-companion')).length, 2);
  assert.ok(Object.values(lesson.productBridge.acceptanceEffects).every(value => value === false));
  assert.equal(result.scaleOutAuthorized, false);
});

test('actual physical wrapper/timeline/member/run bindings match the companion authority and retain21 original runs', () => {
  const input = fixture(), result = bridge.buildG678PartialCalibrationSnapshot(input as never);
  const byId = new Map(result.maintainedDomRenderers.map(member => [member.animationId, member]));
  for (const entry of input.companion.value.entries) {
    const actual = byId.get(entry.key)!;
    assert.deepEqual(actual.module, entry.moduleFile); assert.deepEqual(actual.timeline, entry.timeline);
    assert.deepEqual(actual.memberManifest, entry.memberManifest);
    assert.deepEqual(actual.sourceRun, ids.includes(entry.key)
      ? input.companion.value.companionCompilerRun : input.companion.value.compilerRun);
    for (const artifact of [actual.module, actual.timeline, actual.memberManifest, actual.sourceRun]) {
      const location = absolute(artifact.path), metadata = lstatSync(location), bytes = readFileSync(location);
      assert.equal(metadata.isFile(), true); assert.equal(metadata.isSymbolicLink(), false); assert.equal(metadata.nlink, 1);
      assert.equal(realpathSync(location), decodeURIComponent(location.pathname));
      assert.equal(bytes.length, artifact.bytes); assert.equal(hash(bytes), artifact.sha256);
    }
  }
  assert.equal(result.maintainedDomRenderers.filter(member => member.sourceRun.sha256 === input.companion.value.companionCompilerRun.sha256).length, 2);
  assert.equal(result.maintainedDomRenderers.filter(member => member.sourceRun.sha256 === input.companion.value.compilerRun.sha256).length, 21);
});

test('both separate predecessor witnesses are mandatory and neither may be a duplicate selection authority', () => {
  for (const key of ['predecessorFileBinding', 'dualPredecessorFileBinding'] as const) {
    const input = fixture();
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot({...input, [key]: undefined} as never), /V4_EXACT_COMPANION_AUTHORITY_REQUIRED/u);
    const duplicate = fixture(); duplicate.selectionAuthorities.push(duplicate[key]);
    duplicate.freeze.value.inputs.selectionAuthorities.push(descriptor(duplicate[key]));
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(duplicate as never), /V4_EXACT_COMPANION_AUTHORITY_REQUIRED/u);
    const altered = fixture(); altered[key].value = {};
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(altered as never), /BEHAVIOR_DELTA_INVALID/u);
    const alias = fixture(); alias[key].path = 'catalog/product-bridge-calibrations/copied-predecessor.json';
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(alias as never), /(?:MATH_COMPANION_AUTHORITY|BEHAVIOR_DELTA)_INVALID/u);
  }
});

test('V4 rejects the V3 authority, companion aliases, missing or duplicate companion declarations', () => {
  for (const replacement of ['dual', 'alias', 'missing', 'duplicate']) {
    const input = fixture();
    const authority = input.selectionAuthorities.find((a: any) => a.path === COMPANION.path)!;
    if (replacement === 'dual') input.selectionAuthorities = input.selectionAuthorities.map((a: any) => a === authority ? input.dualPredecessorFileBinding : a);
    if (replacement === 'alias') authority.path = 'catalog/product-bridge-calibrations/companion-alias.json';
    if (replacement === 'missing') input.selectionAuthorities = input.selectionAuthorities.filter((a: any) => a !== authority);
    if (replacement === 'duplicate') input.selectionAuthorities.push(authority);
    input.freeze.value.inputs.selectionAuthorities = input.selectionAuthorities.map(descriptor);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /(?:V4_EXACT_COMPANION_AUTHORITY_REQUIRED|MATH_COMPANION_AUTHORITY_INVALID)/u);
  }
});

test('only validated exact suffixes may enter descriptors, including rejection of swapped/missing/extra/inherited slots', () => {
  for (const mutate of [(pages: any[]) => {pages.find(p => p.animationId === ids[0]).presentation.pageInteractionCompanionTargetIdSuffix = G678_MATH_COMPANION_SUFFIXES['shared-alg001-l11-p044'];},
    (pages: any[]) => {delete pages.find(p => p.animationId === ids[1]).presentation;},
    (pages: any[]) => {pages.find(p => p.animationId === ids[0]).presentation.unreviewed = true;},
    (pages: any[]) => {pages.find(p => p.animationId === 'shared-alg001-l11-p033').presentation = {pageInteractionCompanionTargetIdSuffix: 'alg-l11-p033-math-companion'};}]) {
    const input = fixture(); mutate(input.freeze.value.selectedPages);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /COMPANION_PRESENTATION_INVALID/u);
  }
});

test('canonical companion pin rejects stale wrapper mixes, inherited changes, altered capabilities and acceptance claims', () => {
  for (const mutate of [(authority: any, prior: any) => {
    const entry = authority.entries.find((e: any) => e.key === ids[0]), old = prior.entries.find((e: any) => e.key === ids[0]);
    entry.module = old.module; entry.moduleFile = old.moduleFile; entry.timeline = old.timeline;
  }, (authority: any) => {authority.entries[0].memberManifest = authority.entries[1].memberManifest;},
  (authority: any) => {authority.companionCompilerRun = authority.p034CompilerRun;},
  (authority: any) => {authority.entries.find((e: any) => e.key === ids[1]).runtimeContract.lessonHostCapabilities.push('audio');},
  (authority: any) => {authority.entries.find((e: any) => e.key === ids[0]).proposedPresentation.descriptorActivated = true;},
  (authority: any) => {authority.productCalibrationPassed = true;}]) {
    const input = fixture(), authority = input.selectionAuthorities.find((a: any) => a.path === COMPANION.path)!;
    mutate(authority.value, input.dualPredecessorFileBinding.value);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /MATH_COMPANION_AUTHORITY_INVALID/u);
  }
});

test('frozen registration cannot cross a source run, borrow old wrappers, alter runtime or add audio', () => {
  for (const mutate of [(page: any, input: ReturnType<typeof fixture>) => {page.runtime.rendererBinding.sourceRun = input.companion.value.p034CompilerRun;},
    (page: any, input: ReturnType<typeof fixture>) => {page.runtime.rendererBinding.module = input.priorFreeze.value.selectedPages.find((p: any) => p.animationId === ids[0]).runtime.rendererBinding.module;},
    (page: any) => {page.runtime.lessonHostCapabilities.push('audio');},
    (page: any) => {page.runtime.interactiveStops[0].rendererStateOnResume = 'reset';},
    (page: any) => {page.runtime.scenario = 'forged';}]) {
    const input = fixture(); mutate(input.freeze.value.selectedPages.find((p: any) => p.animationId === ids[0]), input);
    assert.throws(() => bridge.buildG678PartialCalibrationSnapshot(input as never), /REGISTRATION_INVALID/u);
  }
});

test('cache fingerprint includes companion plus separate99f/902f once without adding selection authorities', () => {
  const input = fixture(), dependencies = bridge.g678CalibrationFingerprintDependencies(input.freeze.value);
  for (const file of [COMPANION.path, G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path])
    assert.equal(dependencies.filter(path => path === file).length, 1);
  assert.ok(dependencies.includes(PROPOSED_FREEZE));
  for (const file of [G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.path, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT.path]) {
    assert.ok(bridge.g678CalibrationFingerprintDependencies().includes(file));
    assert.equal(input.selectionAuthorities.some((a: any) => a.path === file), false);
  }
});

test('actual V4 filesystem loader admits its exact registry or rejects the exact378 successor without borrowing its registration', () => {
  const actualFreeze = read(bridge.G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH);
  const actualRegistry = read('packages/demos/private-current-js-registry.json');
  const calibration = actualRegistry.value.calibrations.find((c: any) => c.calibrationId === bridge.G678_CALIBRATION_ID);
  const snapshot = bridge.g678PartialCalibrationSnapshot();
  if (calibration.freezeManifest !== actualFreeze.path) {
    // Keep this actual filesystem regression after the one-page successor:
    // the forced V4 loader must reject378 metadata, not fake historical state
    // or skip the test. The dedicated378 suite verifies that live snapshot.
    assert.equal(calibration.freezeManifest, bridge.G678_NMS_L01_P042_COMPANION_FREEZE_PATH);
    const successor = read(bridge.G678_NMS_L01_P042_COMPANION_FREEZE_PATH);
    assert.equal(calibration.freezeManifestSha256, successor.sha256);
    const witness = read('catalog/product-bridge-calibrations/g678-math-companion-v4-private-current-js-registry-witness-v1.json');
    assert.deepEqual(descriptor(actualFreeze), {
      path: bridge.G678_ALG_L11_MATH_COMPANION_SUCCESSOR_FREEZE_PATH, bytes: 2408370,
      sha256: '4633c4a3853e44ff1cd58184cf154acc6edc7e2e96ed936c72ce2decc006d358',
    });
    assert.equal(witness.bytes, 431148);
    assert.equal(witness.sha256, 'dbb6093d6e36041a99474530c16d76541cfef608fc25a309cdcd8befc0b173c8');
    assert.deepEqual(successor.value.inputs.p042PredecessorFreeze, descriptor(actualFreeze));
    assert.deepEqual(successor.value.inputs.p042PredecessorRegistry, descriptor(witness));
    for (const binding of [actualFreeze, witness]) {
      const location = absolute(binding.path), metadata = lstatSync(location);
      assert.equal(metadata.isFile(), true); assert.equal(metadata.isSymbolicLink(), false);
      assert.equal(metadata.nlink, 1); assert.equal(metadata.mode & 0o222, 0);
      assert.equal(realpathSync(location), decodeURIComponent(location.pathname));
    }
    assert.equal(snapshot.status, 'invalid'); assert.equal(snapshot.error, 'G678_CALIBRATION_REGISTRATION_INVALID');
    assert.equal(snapshot.registeredPlacementCount, 0); assert.deepEqual(snapshot.descriptors, []);
    return;
  }
  assert.equal(calibration.freezeManifestSha256, actualFreeze.sha256);
  assert.equal(snapshot.status, 'ready', snapshot.error ?? 'Actual V4 filesystem snapshot must be ready');
  assert.equal(snapshot.error, null); assert.equal(snapshot.registeredPlacementCount, 377);
  assert.equal(snapshot.descriptors.length, 44); assert.equal(snapshot.maintainedDomRenderers.length, 23);
  for (const [id, suffix] of Object.entries(G678_MATH_COMPANION_SUFFIXES)) {
    const lesson = bridge.findG678PartialCalibrationDescriptor(id)!;
    assert.ok(lesson, `Real filesystem descriptor missing: ${id}`);
    assert.equal(lesson.pages.find(page => page.animationId === id)?.presentation?.pageInteractionCompanionTargetIdSuffix, suffix);
  }
});
