import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {createAdmissionPlan, loadTypographyProof, PHYSICAL_SOURCE_PINS,
  P006_ADMISSION_PATHS, P006_TYPOGRAPHY_PATHS, REQUIRED_WORKSPACE_PATHS} from
  '../../../scripts/prepare-g678-alg-l12-p006-current-js-v2.mjs';
import {getWorkspaceRoot} from '../lib/catalog';
import {algL12P003Descriptor} from '../lib/g678-alg-l12-p003.server';
import {ALG_L12_P006_CURRENT_JS_CALIBRATION, ALG_L12_P006_CURRENT_JS_FREEZE,
  ALG_L12_P006_CURRENT_JS_ID, algL12P006CurrentJsDescriptor,
  algL12P006AdmissionCandidateDescriptor,
  extendAlgL12P006CurrentJsDescriptor, readAlgL12P006CurrentJsPacket,
  type AlgL12P006CurrentJsPacket} from '../lib/g678-alg-l12-p006-current-js.server';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env: Record<string, string | undefined> = process.env;
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type Pin = {path: string; bytes: number; sha256: string};
type Registration = NonNullable<ReturnType<typeof localOnlyAnimationModuleRegistration>>;

function withLocalEnv(run: () => void) {
  const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
    'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    run();
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete env[key]; else env[key] = saved[key];
    }
  }
}

/** Builds a current input/proof fixture in an isolated temp root. Rebinding its
 * copied receipt exercises validation without changing real evidence or registry. */
function fixture() {
  const workspace = getWorkspaceRoot();
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'helpmath-p006-admission-test-'));
  const files = new Map<string, {bytes: Buffer; pin: Pin}>();
  for (const file of REQUIRED_WORKSPACE_PATHS as readonly string[]) {
    const bytes = readFileSync(path.join(workspace, file));
    files.set(file, {bytes, pin: {path: file, bytes: bytes.length, sha256: digest(bytes)}});
  }
  const proof = loadTypographyProof(files, {root: workspace,
    sourceBytes: readFileSync(path.join(SOURCE_ROOT, PHYSICAL_SOURCE_PINS.source.path))});
  const plan = createAdmissionPlan(files, PHYSICAL_SOURCE_PINS, proof) as {
    packet: AlgL12P006CurrentJsPacket;
    outputs: Array<{path: string; bytes: Buffer}>;
  };
  const write = (relative: string, bytes: Buffer) => {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), {recursive: true});
    writeFileSync(target, bytes);
  };
  for (const file of plan.packet.integrity.files) write(file.path, files.get(file.path)!.bytes);
  for (const output of plan.outputs) write(output.path, output.bytes);
  // The pair stays outside freeze hashes. Copy its dated receipt and artifacts
  // as immutable fixture evidence; only the fixture can be mutated by negatives.
  const bindingBytes = readFileSync(path.join(workspace, P006_TYPOGRAPHY_PATHS.binding));
  const checkBytes = readFileSync(path.join(workspace, P006_TYPOGRAPHY_PATHS.check));
  const binding = JSON.parse(bindingBytes.toString());
  const check = JSON.parse(checkBytes.toString()) as {receipt: Pin; artifacts: Pin[];
    checkedImplementationFiles: Pin[]; bindingSha256: string};
  write(P006_TYPOGRAPHY_PATHS.binding, bindingBytes);
  write(P006_TYPOGRAPHY_PATHS.check, checkBytes);
  for (const pin of [check.receipt, ...check.artifacts])
    write(pin.path, readFileSync(path.join(workspace, pin.path)));
  const implementationPins: Pin[] = binding.implementation.files.map((previous: Pin) => {
    const file = path.join(root, previous.path);
    if (!existsSync(file)) write(previous.path, readFileSync(path.join(workspace, previous.path)));
    const bytes = readFileSync(file);
    return {path: previous.path, bytes: bytes.length, sha256: digest(bytes)};
  });
  const receipt = JSON.parse(readFileSync(path.join(root, check.receipt.path)).toString());
  receipt.checkedImplementationFiles = implementationPins;
  receipt.scope = 'Isolated unit fixture with rebound copied inputs; no actual admission or acceptance effect.';
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  const receiptPin = {...check.receipt, bytes: receiptBytes.length, sha256: digest(receiptBytes)};
  write(receiptPin.path, receiptBytes);
  binding.implementation.files = implementationPins;
  binding.sourceRiskEvidence.technicalReceipt = receiptPin;
  binding.technicalFinalization.receipt = receiptPin;
  const currentBindingBytes = Buffer.from(`${JSON.stringify(binding, null, 2)}\n`);
  write(P006_TYPOGRAPHY_PATHS.binding, currentBindingBytes);
  check.receipt = receiptPin;
  check.artifacts = check.artifacts.map(pin => pin.path === receiptPin.path ? receiptPin : pin);
  check.checkedImplementationFiles = implementationPins;
  check.bindingSha256 = digest(currentBindingBytes);
  write(P006_TYPOGRAPHY_PATHS.check, Buffer.from(`${JSON.stringify(check, null, 2)}\n`));
  const registration: Registration = {
    maturity: 'private-current-js', scope: 'private-engineering', deploymentScope: 'local-only',
    calibrationId: ALG_L12_P006_CURRENT_JS_CALIBRATION,
    freezeManifestSha256: digest(plan.outputs[1]!.bytes),
    moduleSha256: plan.packet.entry.artifacts.module.sha256,
    timelineSha256: plan.packet.entry.artifacts.timeline.sha256,
    runtimeSha256: plan.packet.entry.artifacts.runtime.sha256,
  };
  return {root, packet: plan.packet, registration,
    replacePacket(packet: AlgL12P006CurrentJsPacket) {
      const bytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`);
      write(ALG_L12_P006_CURRENT_JS_FREEZE.path, bytes);
      return {...registration, freezeManifestSha256: digest(bytes)};
    },
    cleanup: () => rmSync(root, {recursive: true, force: true}),
  };
}

test('actual P006 distinguishes absent registration, stale staged proof, and current formal proof', () => {
  withLocalEnv(() => {
    const actual = localOnlyAnimationModuleRegistration(ALG_L12_P006_CURRENT_JS_ID);
    // The same test continues to verify actual source/order bindings after a later
    // separately reviewed activation. No test is skipped while admission is pending.
    if (actual?.calibrationId === ALG_L12_P006_CURRENT_JS_CALIBRATION) {
      assert.equal(actual.calibrationId, ALG_L12_P006_CURRENT_JS_CALIBRATION);
      const candidate = algL12P006AdmissionCandidateDescriptor();
      assert.deepEqual(candidate.admissionCandidateDisclosure, {status: 'engineering-staged',
        typographyGate: 'formal-current-proof-pending', officialCompletionClaim: false, acceptanceEffect: 'none'});
      assert.equal(candidate.productBridge.registeredAnimationCount, 20);
      assert.equal(candidate.source.candidateFreezeManifestSha256, actual.freezeManifestSha256);
      assert(Object.values(candidate.productBridge.acceptanceEffects).every(value => value === false));
      let descriptor;
      try {descriptor = algL12P006CurrentJsDescriptor();}
      catch (error) {
        assert.match(String(error), /ALG_L12_P006_CURRENT_JS_INVALID: current typography implementation:/u);
        assert.throws(() => readAlgL12P006CurrentJsPacket(), /current typography implementation/u);
        return;
      }
      const packet = readAlgL12P006CurrentJsPacket();
      assert.equal(descriptor.productBridge.registeredAnimationCount, 20);
      assert.equal(descriptor.source.candidateFreezeManifestSha256, actual.freezeManifestSha256);
      assert.equal(packet.source.sha256, '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6');
      assert.equal(packet.nativeTypography.runtime.sha256, '5b4b15ea0d75f77025ddbadacbc679e3355f9bf87aeedae2531ec87763e8714e');
      assert.equal(descriptor.pages[3]?.animationId, 'shared-alg001-l12-p004');
      assert.equal(descriptor.pages[3]?.rendererAvailability.kind, 'registered');
      assert.equal(descriptor.pages[4]?.rendererAvailability.kind, 'unavailable');
      assert.equal(descriptor.pages[5]?.rendererAvailability.kind, 'registered');
      assert(Object.values(descriptor.productBridge.acceptanceEffects).every(value => value === false));
    } else {
      if (actual) {
        assert.equal(actual.calibrationId, 'g678-alg-l12-p006-current-js-v1');
        assert.equal(actual.freezeManifestSha256,
          '46847b41be87fc22e2f9b1bcf566252180fc2b04a73ca94bd11978e9e42dd0c7');
      }
      assert.throws(() => readAlgL12P006CurrentJsPacket(), /actual private module registration/u);
      assert.throws(() => algL12P006CurrentJsDescriptor(), /actual private module registration/u);
      assert.throws(() => algL12P006AdmissionCandidateDescriptor(), /actual private module registration/u);
    }
  });
});

test('formal reader denies a stale shared implementation input outside the frozen native core', () => {
  withLocalEnv(() => {
    const data = fixture();
    try {
      const binding = JSON.parse(readFileSync(path.join(data.root, P006_TYPOGRAPHY_PATHS.binding)).toString()) as {
        implementation: {files: Pin[]}};
      const ordinarySharedPin = binding.implementation.files.find(pin =>
        pin.path === 'apps/web/components/site-header.tsx');
      assert(ordinarySharedPin);
      assert(!data.packet.integrity.files.some(pin => pin.path === ordinarySharedPin.path));
      assert.equal(readAlgL12P006CurrentJsPacket(data.root, data.registration).calibrationId,
        ALG_L12_P006_CURRENT_JS_CALIBRATION);
      writeFileSync(path.join(data.root, ordinarySharedPin.path), 'changed');
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration),
        /current typography implementation: apps\/web\/components\/site-header.tsx/u);
    } finally { data.cleanup(); }
  });
});

test('isolated reviewed fixture preserves every source placement and adds only P006 and audited Inequality', () => {
  withLocalEnv(() => {
    const currentRegistration = localOnlyAnimationModuleRegistration(ALG_L12_P006_CURRENT_JS_ID);
    const beforeRegistry = readFileSync(path.join(getWorkspaceRoot(), P006_ADMISSION_PATHS.registry));
    const data = fixture();
    try {
      const proposedRegistration = data.registration;
      const packet = readAlgL12P006CurrentJsPacket(data.root, proposedRegistration);
      const base = algL12P003Descriptor();
      const descriptor = extendAlgL12P006CurrentJsDescriptor(base, packet, proposedRegistration, data.root);
      assert.equal(base.pages.length, 52);
      assert.equal(base.productBridge.registeredAnimationCount, 19);
      assert.equal(base.pages[5]?.rendererAvailability.kind, 'unavailable');
      assert.equal(descriptor.pages.length, 52);
      assert.equal(descriptor.productBridge.registeredAnimationCount, 20);
      assert.equal(descriptor.productBridge.pageOnlyDescriptorMemberCount, 52);
      assert.equal(descriptor.pages[5]?.rendererAvailability.kind, 'registered');
      assert.equal(descriptor.pages[5]?.globalPageOrdinal, 6);
      assert.equal(descriptor.pages[5]?.sectionPageOrdinal, 5);
      assert.equal(descriptor.pages[5]?.previousPlacementId, 'shared-alg001-l12-p005');
      assert.equal(descriptor.pages[5]?.nextPlacementId, 'shared-alg001-l12-p007');
      assert.equal(descriptor.pages[4]?.rendererAvailability.kind, 'unavailable');
      assert.equal(base.pages[3]?.animationId, 'shared-alg001-l12-p004');
      assert.equal(base.pages[3]?.rendererAvailability.kind, 'registered');
      assert.deepEqual(descriptor.pages[3], base.pages[3]);
      assert.deepEqual(descriptor.pages.map(page => page.placementId), base.pages.map(page => page.placementId));
      assert.deepEqual(descriptor.pages.filter((_, index) => index !== 5), base.pages.filter((_, index) => index !== 5));
      assert.deepEqual(descriptor.productBridge.selectedAnimationIds.filter(id => id !== ALG_L12_P006_CURRENT_JS_ID),
        base.productBridge.selectedAnimationIds);
      assert.deepEqual(descriptor.productBridge.acceptanceEffects, base.productBridge.acceptanceEffects);
      assert.deepEqual(descriptor.glossary.slice(0, 34), base.glossary);
      assert.equal(descriptor.glossary.length, 35);
      assert.deepEqual(descriptor.glossary.slice(34).map(entry => entry.id), ['inequality']);
      const inequality = descriptor.glossary[34]!;
      assert.equal(inequality.sourceKeyAttribute, 'Inequality');
      assert.equal(inequality.labels.es, 'Desigualdad');
      for (const locale of ['en', 'es'] as const) {
        assert.match(inequality.definitions[locale], /[<>≥≤≠]/u);
        assert.doesNotMatch(inequality.definitions[locale], /&#x/u);
      }
      assert.equal(packet.embeddedAudio.scheduleVersion, 'continuous-stream-v2');
      assert.deepEqual(packet.embeddedAudio.sourceSampleRange, [1673, 624384]);
      assert.equal(packet.optionalSpanishAudio.automaticLocalePlayback, false);
      assert.equal(packet.optionalSpanishAudio.spokenLanguageVerified, false);
      assert.equal(packet.selectedPages[0]?.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
      assert.notEqual(descriptor.persistence.storageKey, base.persistence.storageKey);
      assert.equal(digest(readFileSync(path.join(data.root, packet.entry.artifacts.runtime.path))),
        'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc');
      assert.deepEqual(localOnlyAnimationModuleRegistration(ALG_L12_P006_CURRENT_JS_ID), currentRegistration);
      assert.deepEqual(readFileSync(path.join(getWorkspaceRoot(), P006_ADMISSION_PATHS.registry)), beforeRegistry);
    } finally { data.cleanup(); }
  });
});

test('isolated reader rejects substituted scope, schedule, SA autoplay, accepted gates, and missing dependency closure', () => {
  withLocalEnv(() => {
    const data = fixture();
    try {
      const cases: Array<[AlgL12P006CurrentJsPacket, RegExp]> = [
        [{...data.packet, supersedes: {...data.packet.supersedes,
          freeze: {...data.packet.supersedes.freeze, sha256: '0'.repeat(64)}}}, /exact retained v1 provenance/u],
        [{...data.packet, scope: 'strict-ledger'}, /exact sixth source placement/u],
        [{...data.packet, embeddedAudio: {...data.packet.embeddedAudio, scheduleVersion: 'two-run-gap-v1'}},
          /continuous embedded stream/u],
        [{...data.packet, optionalSpanishAudio: {...data.packet.optionalSpanishAudio, automaticLocalePlayback: true}},
          /continuous embedded stream/u],
        [{...data.packet, acceptanceEffects: {...data.packet.acceptanceEffects, audioAccepted: true}},
          /independent pending acceptance/u],
        [{...data.packet, integrity: {files: data.packet.integrity.files.filter(pin =>
          pin.path !== 'packages/demos/src/alg-l12-p006-spanish-audio.ts')}}, /dependency closure/u],
        [{...data.packet, integrity: {files: data.packet.integrity.files.filter(pin =>
          pin.path !== 'apps/web/lib/g678-alg-l12-p006-admission-access.ts')}}, /dependency closure/u],
        [{...data.packet, integrity: {files: data.packet.integrity.files.filter(pin =>
          pin.path !== 'apps/web/proxy.ts')}}, /dependency closure/u],
        [{...data.packet, integrity: {files: data.packet.integrity.files.filter(pin =>
          pin.path !== 'apps/web/lib/g678-p047-proxy-host-successor.server.ts')}}, /dependency closure/u],
        [{...data.packet, integrity: {files: data.packet.integrity.files.filter(pin =>
          pin.path !== 'catalog/product-bridge-calibrations/g678-alg-l12-p006-admission-proxy-composed-successor-v1.json')}},
        /dependency closure/u],
        [{...data.packet, nativeTypography: {...data.packet.nativeTypography,
          runtime: {...data.packet.nativeTypography.runtime, sha256: '0'.repeat(64)}}}, /source-native typography runtime/u],
        [{...data.packet, nativeTypography: {...data.packet.nativeTypography,
          criticalFiles: data.packet.nativeTypography.criticalFiles.filter(pin =>
            pin.path !== 'packages/demos/src/alg-l12-p006-typography-renderer.tsx')}},
          /complete native and shared typography input closure/u],
      ];
      for (const [packet, error] of cases) {
        const registration = data.replacePacket(packet);
        assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, registration), error);
      }
      const good = data.replacePacket(data.packet);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, {...good, deploymentScope: 'bundled'}),
        /actual private module registration/u);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, {...good,
        calibrationId: 'g678-alg-l12-p006-current-js-v1'}), /actual private module registration/u);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, {...good, freezeManifestSha256: '0'.repeat(64)}),
        /pinned bytes/u);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, {...good, moduleSha256: '0'.repeat(64)}),
        /exact sixth source placement/u);
      writeFileSync(path.join(data.root, 'packages/demos/src/alg-l12-p006-spanish-audio.ts'), 'changed');
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, good), /ordinary pinned file/u);
    } finally { data.cleanup(); }
  });
});

test('live typography pair rejects missing checks, wrong source risk, receipt substitution, and native input drift', () => {
  withLocalEnv(() => {
    const data = fixture();
    const checkFile = path.join(data.root, P006_TYPOGRAPHY_PATHS.check);
    const original = readFileSync(checkFile);
    const check = JSON.parse(original.toString());
    try {
      for (const [replacement, pattern] of [
        [{...check, checks: {...check.checks, hostIntegration: 'pending'}}, /twelve technical checks/u],
        [{...check, resolvedSourceRisks: check.resolvedSourceRisks.slice(1)}, /source-risk disposition/u],
        [{...check, receipt: {...check.receipt, sha256: '0'.repeat(64)}}, /coherent technical receipt/u],
        [{...check, bindingSha256: '0'.repeat(64)}, /twelve technical checks/u],
        [{...check, audioAccepted: true}, /twelve technical checks/u],
        [{...check, checkedAt: 'not-a-date'}, /finite typography timestamps/u],
        [{...check, checkedAt: '2000-01-01T00:00:00.000Z'}, /finite typography timestamps/u],
      ] as const) {
        writeFileSync(checkFile, `${JSON.stringify(replacement, null, 2)}\n`);
        assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration), pattern);
      }
      writeFileSync(checkFile, original);
      const bindingFile = path.join(data.root, P006_TYPOGRAPHY_PATHS.binding);
      const originalBinding = readFileSync(bindingFile);
      const binding = JSON.parse(originalBinding.toString());
      const receiptFile = path.join(data.root, check.receipt.path);
      const originalReceipt = readFileSync(receiptFile);
      const receipt = JSON.parse(originalReceipt.toString());
      const mismatchedReceipt = Buffer.from(`${JSON.stringify({...receipt,
        checkedAt: '2000-01-01T00:00:00.000Z'}, null, 2)}\n`);
      const mismatchedPin = {...check.receipt, bytes: mismatchedReceipt.length, sha256: digest(mismatchedReceipt)};
      writeFileSync(receiptFile, mismatchedReceipt);
      binding.sourceRiskEvidence.technicalReceipt = mismatchedPin;
      binding.technicalFinalization.receipt = mismatchedPin;
      const changedBinding = Buffer.from(`${JSON.stringify(binding, null, 2)}\n`);
      writeFileSync(bindingFile, changedBinding);
      writeFileSync(checkFile, `${JSON.stringify({...check, receipt: mismatchedPin,
        bindingSha256: digest(changedBinding),
        artifacts: check.artifacts.map((pin: Pin) => pin.path === mismatchedPin.path ? mismatchedPin : pin)}, null, 2)}\n`);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration),
        /matching recorded typography timestamp/u);
      writeFileSync(receiptFile, originalReceipt);
      writeFileSync(bindingFile, originalBinding);
      writeFileSync(checkFile, original);
      assert.equal(readAlgL12P006CurrentJsPacket(data.root, data.registration).preparationState.activationPermitted, true);
      writeFileSync(path.join(data.root, 'packages/demos/src/alg-l12-p006-typography-renderer.tsx'), 'changed');
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration), /ordinary pinned file/u);
    } finally { data.cleanup(); }
  });
});

test('dated and refreshed artifact shapes retain every receipt artifact and hash-check extra history', () => {
  withLocalEnv(() => {
    const data = fixture();
    const checkFile = path.join(data.root, P006_TYPOGRAPHY_PATHS.check);
    const original = readFileSync(checkFile);
    const check = JSON.parse(original.toString()) as {receipt: Pin; artifacts: Pin[]};
    const receipt = JSON.parse(readFileSync(path.join(data.root, check.receipt.path)).toString()) as {artifacts: Pin[]};
    try {
      // A real finalized pair adds its own receipt pin to the receipt's artifact
      // inventory; those arrays deliberately have different membership.
      assert(check.artifacts.some(pin => pin.path === check.receipt.path));
      assert(check.artifacts.length > receipt.artifacts.length);
      assert.equal(readAlgL12P006CurrentJsPacket(data.root, data.registration).calibrationId,
        ALG_L12_P006_CURRENT_JS_CALIBRATION);
      const history = ['binding-before-refresh.json', 'check-before-refresh.json'].map(name => {
        const relative = `output/fixture-typography-history/${name}`;
        const bytes = Buffer.from(`isolated history fixture: ${name}\n`);
        const file = path.join(data.root, relative);
        mkdirSync(path.dirname(file), {recursive: true}); writeFileSync(file, bytes);
        return {path: relative, bytes: bytes.length, sha256: digest(bytes)};
      });
      const refreshed = {...check, artifacts: [...check.artifacts, ...history]};
      writeFileSync(checkFile, `${JSON.stringify(refreshed, null, 2)}\n`);
      assert.equal(readAlgL12P006CurrentJsPacket(data.root, data.registration).calibrationId,
        ALG_L12_P006_CURRENT_JS_CALIBRATION);
      for (const omitted of [check.receipt.path, receipt.artifacts[0]!.path]) {
        writeFileSync(checkFile, `${JSON.stringify({...refreshed,
          artifacts: refreshed.artifacts.filter(pin => pin.path !== omitted)}, null, 2)}\n`);
        assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration),
          /matching recorded typography evidence/u);
      }
      writeFileSync(checkFile, `${JSON.stringify(refreshed, null, 2)}\n`);
      writeFileSync(path.join(data.root, history[0]!.path), 'changed');
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, data.registration), /ordinary pinned file/u);
    } finally { data.cleanup(); }
  });
});

test('descriptor extension rejects changed neighbor/source order, duplicate selection, and acceptance inflation', () => {
  withLocalEnv(() => {
    const data = fixture();
    try {
      const base = algL12P003Descriptor();
      const held = {...data.packet, preparationState: {...data.packet.preparationState,
        activationPermitted: false, typographyImplementation: 'pending', status: 'preparation-only'}};
      const heldRegistration = data.replacePacket(held);
      assert.throws(() => readAlgL12P006CurrentJsPacket(data.root, heldRegistration),
        /mandatory typography admission boundary/u);
      const proposedRegistration = data.replacePacket(data.packet);
      const packet = readAlgL12P006CurrentJsPacket(data.root, proposedRegistration);
      const changed = base.pages.map((page, index) => index === 5
        ? {...page, nextPlacementId: 'shared-alg001-l12-p008'} : page);
      assert.throws(() => extendAlgL12P006CurrentJsDescriptor({...base, pages: changed},
        packet, proposedRegistration, data.root), /exact source-ordered P003 predecessor/u);
      assert.throws(() => extendAlgL12P006CurrentJsDescriptor({...base,
        productBridge: {...base.productBridge, selectedAnimationIds: [...base.productBridge.selectedAnimationIds,
          base.productBridge.selectedAnimationIds[0]!]}}, packet, proposedRegistration, data.root),
      /exact source-ordered P003 predecessor/u);
      assert.throws(() => extendAlgL12P006CurrentJsDescriptor(base, {...packet,
        acceptanceEffects: {...packet.acceptanceEffects, ownerAccepted: true}}, proposedRegistration, data.root),
      /independent pending acceptance/u);
      assert.throws(() => extendAlgL12P006CurrentJsDescriptor(base, packet, undefined, data.root),
        /actual private module registration/u);
    } finally { data.cleanup(); }
  });
});

test('P006 admission descriptor remains closed in production/provider/missing opt-in environments', () => {
  for (const [key, value] of [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', SOURCE_ROOT + '/.'],
  ] as const) withLocalEnv(() => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => algL12P006CurrentJsDescriptor(), /physical local Preview only/u);
    assert.throws(() => algL12P006AdmissionCandidateDescriptor(), /physical local Preview only/u);
  });
});
