import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  PAIR_ADMISSION_CALIBRATION, PAIR_ADMISSION_ID, PAIR_MAIN_AUDIO, PAIR_NATIVE_RUNTIME,
  PAIR_OUTPUT, PAIR_RUNTIME, projectPairSource, validateGlossaryPairAdmissionSemantics,
} from './g678-glossary-pair-admission-semantics.mjs';
import {pinFile, readRegistryTransaction} from './g678-admission-proof.mjs';
import {buildPairAdmissionPacket} from '../scripts/prepare-g678-glossary-pair-admission.mjs';
import {upsertPrivateCurrentJsCalibration} from '../scripts/private-current-js-registry.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const sourceInputs = JSON.parse(fs.readFileSync(path.join(ROOT, PAIR_OUTPUT, 'source-inputs.json')));
const hostResources = JSON.parse(fs.readFileSync(path.join(ROOT, PAIR_OUTPUT, 'host-resources-v1.json')));
const clone = value => structuredClone(value);

test('P013 projection ignores unrelated P015 investigation but rejects a changed P013 button or resource', () => {
  const original = projectPairSource(sourceInputs, hostResources);
  const next = clone(sourceInputs);
  next.pages.find(p => p.animationId.endsWith('p015')).additionalGlobalReadParity = 'resolved-later';
  assert.deepEqual(projectPairSource(next, hostResources), original);
  const badSource = clone(sourceInputs);
  badSource.pages.find(p => p.animationId === PAIR_ADMISSION_ID).controls[1].action.additionalSourceReads = ['S'];
  assert.throws(() => projectPairSource(badSource, hostResources), /source button coordinate-plane/);
  const badResource = clone(hostResources);
  badResource.pages.find(p => p.animationId === PAIR_ADMISSION_ID).resources['main.mp3'].sha256 = '0'.repeat(64);
  assert.throws(() => projectPairSource(sourceInputs, badResource), /embedded stream identity/);
});

test('producer packet requires exact source controls, native asset, signed seek, local scope and pending acceptance', () => {
  const {page: sourceFacts} = projectPairSource(sourceInputs, hostResources);
  const own = [
    `packages/demos/src/modules/${PAIR_ADMISSION_ID}.tsx`,
    `packages/demos/src/timelines/${PAIR_ADMISSION_ID}.ts`,
    'apps/web/lib/g678-glossary-pair-admission.server.ts',
    `${PAIR_OUTPUT}/native-candidates/p013/runtime-meta.json`,
    `${PAIR_OUTPUT}/candidates/p013/source-audio-structure.json`,
    ...sourceFacts.sourcePins.slice(1).map(item => item.path),
    PAIR_NATIVE_RUNTIME.path, PAIR_MAIN_AUDIO.path,
  ];
  const pins = new Map(own.map(relative => [relative, pinFile(ROOT, relative)]));
  const audit = {metadata: JSON.parse(fs.readFileSync(path.join(ROOT, PAIR_OUTPUT, 'native-candidates/p013/runtime-meta.json')))};
  const {packet, entry} = buildPairAdmissionPacket({sourceFacts, pins, audit});
  const {url: runtimeUrl, ...frozenRuntime} = packet.selectedPages[0].runtime.canvasRenderer;
  assert.deepEqual(frozenRuntime, entry.artifacts.runtime,
    'actual dispatch contract compares the frozen runtime path as well as its bytes/hash');
  assert.match(runtimeUrl, /\/typography\.js\?sha256=/);
  const freezeBytes = Buffer.from(JSON.stringify(packet, null, 2) + '\n');
  const frozen = {...packet, freezeManifest: {path: `catalog/product-bridge-calibrations/${PAIR_ADMISSION_CALIBRATION}.json`,
    bytes: freezeBytes.length, sha256: createHash('sha256').update(freezeBytes).digest('hex')}};
  const registration = {calibrationId: PAIR_ADMISSION_CALIBRATION, deploymentScope: 'local-only',
    freezeManifest: frozen.freezeManifest.path, freezeManifestBytes: frozen.freezeManifest.bytes,
    freezeManifestSha256: frozen.freezeManifest.sha256, entries: [entry]};
  const currentRegistry = readRegistryTransaction(ROOT).registry;
  const projected = upsertPrivateCurrentJsCalibration(currentRegistry, registration);
  assert.deepEqual(projected.calibrations.find(item => item.calibrationId === PAIR_ADMISSION_CALIBRATION),
    registration, 'actual registry validator accepts canonical runtime path and current registry');
  const wrongRuntime = clone(registration);
  wrongRuntime.entries[0].artifacts.runtime = PAIR_NATIVE_RUNTIME;
  assert.throws(() => upsertPrivateCurrentJsCalibration(currentRegistry, wrongRuntime),
    /artifact paths are not canonical/);
  assert.equal(validateGlossaryPairAdmissionSemantics(frozen, registration), true);
  const badControl = clone(frozen); badControl.sourceFacts.controls[0].action.sourceStop = 'different';
  assert.throws(() => validateGlossaryPairAdmissionSemantics(badControl, registration), /source button x-axis/);
  const badAudio = clone(frozen); badAudio.audio.structureFacts.negativeSeekBlocks = [];
  assert.throws(() => validateGlossaryPairAdmissionSemantics(badAudio, registration), /signed seek/);
  const badAcceptance = clone(frozen); badAcceptance.acceptanceEffects.audioAccepted = true;
  assert.throws(() => validateGlossaryPairAdmissionSemantics(badAcceptance, registration), /no acceptance/);
  const badClosure = clone(frozen); badClosure.integrity.files = badClosure.integrity.files.filter(pin => pin.path !== PAIR_RUNTIME.path);
  assert.throws(() => validateGlossaryPairAdmissionSemantics(badClosure, registration), /own input/);
});
