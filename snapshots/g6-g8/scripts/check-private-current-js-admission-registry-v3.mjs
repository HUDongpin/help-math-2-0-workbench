#!/usr/bin/env node

// Read-only successor check for admitted maintained-DOM bindings, including the
// exact source-directions P053 branch. The frozen generator still renders dispatch.
import assert from 'node:assert/strict';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isHfrArtifactEntry, validateHfrFreezeBinding, validateHfrArtifactClosure, hfrRegistrationMetadata} from './lib/hfr-artifact-binding-v1.mjs';

import {privateCurrentJsCalibrationDeploymentScope} from './private-current-js-registry.mjs';
import {
  ordinaryFileBinding,
  renderRegistrySource,
  renderRegistryMetadataSource,
  renderLocalOnlyRegistrySource,
  renderLocalOnlyRegistryMetadataSource,
} from '../packages/demos/scripts/generate-registry.mjs';

import {validateP054AdmissionSemantics,P054_ADMISSION_ID,P054_ADMISSION_CALIBRATION}
  from '../lib/nms-l02-p054-admission-semantics.mjs';
import {validateP053AdmissionSemantics,P053_ADMISSION_ID,P053_ADMISSION_CALIBRATION}
  from '../lib/nms-l02-p053-proof-semantics-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demos = path.join(root, 'packages/demos');
const outputs = Object.freeze({
  bundled: 'packages/demos/src/registry.generated.ts',
  metadata: 'packages/demos/src/registry.metadata.generated.ts',
  localOnly: 'packages/demos/src/registry.local-only.generated.ts',
  localOnlyMetadata: 'packages/demos/src/registry.local-only.metadata.generated.ts',
});
const keyPattern = /^[a-z0-9][a-z0-9-]*$/u;
const modulePattern = /^\.\/modules\/[a-z0-9][a-z0-9-]*$/u;

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function equal(left, right) {
  try {
    assert.deepStrictEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

function confined(relativePath, label) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath) &&
    !relativePath.split('/').includes('..'), `${label} path is not relative`);
  const resolved = path.resolve(root, relativePath);
  invariant(resolved.startsWith(`${root}${path.sep}`), `${label} path escapes repository`);
  return resolved;
}

function selectedPageFor(freeze, key, label) {
  const pages = freeze?.selectedPages?.filter((page) => page?.animationId === key);
  invariant(pages?.length === 1, `${label}: selected page identity is not unique`);
  return pages[0];
}

export function validateAdmissionBinding(calibration, freeze, entry, deploymentScope) {
  const label = `${calibration.calibrationId}:${entry?.key}`;
  const selectedPage = selectedPageFor(freeze, entry?.key, label);
  invariant(entry?.maturity === 'private-current-js' &&
    selectedPage.complexityLane === entry.complexityLane,
  `${label}: entry is not selected by freeze`);
  if (isHfrArtifactEntry(entry)) {
    validateHfrFreezeBinding(calibration, freeze, entry);
    return selectedPage;
  }
  if (deploymentScope !== 'local-only') return selectedPage;

  const artifacts = entry.artifacts;
  const binding = selectedPage.runtime?.rendererBinding;
  if (artifacts.kind === 'maintained-dom-module-v1') {
    const sourceDirections = binding === undefined &&
      calibration.calibrationId === P053_ADMISSION_CALIBRATION &&
      entry.key === P053_ADMISSION_ID &&
      selectedPage.runtime?.scenario === 'source-directions-v1';
    if (sourceDirections) {
      validateP053AdmissionSemantics({...freeze, freezeManifest: {
        path: calibration.freezeManifest,
        bytes: calibration.freezeManifestBytes,
        sha256: calibration.freezeManifestSha256,
      }}, calibration);
      invariant(equal(freeze.entry,entry),
        `${label}: P053 source-directions entry/freeze binding drifted`);
    } else if (typeof binding === 'string') {
      const ordinaryDom = binding === 'maintained-dom-module-v1' &&
        selectedPage.runtime?.scenario === 'source-static-frame';
      const sourceQuiz = binding === 'maintained-dom-quiz-state-v1' &&
        selectedPage.runtime?.scenario === 'source-quiz-seeded' &&
        freeze.sourceQuiz?.bankSize === 35 &&
        freeze.sourceQuiz?.drawCount === 10 &&
        freeze.sourceQuiz?.optionCount === 4;
      const sourceMatching = binding === 'maintained-dom-matching-state-v1' &&
        calibration.calibrationId === P054_ADMISSION_CALIBRATION &&
        entry.key === P054_ADMISSION_ID &&
        selectedPage.runtime?.scenario === 'source-matching-level-1';
      if (sourceMatching) {
        validateP054AdmissionSemantics({...freeze, freezeManifest: {
          path: calibration.freezeManifest,
          bytes: calibration.freezeManifestBytes,
          sha256: calibration.freezeManifestSha256,
        }}, calibration);
      }
      invariant(ordinaryDom || sourceQuiz || sourceMatching,
        `${label}: unsupported maintained DOM renderer identity`);
      invariant(equal(freeze.entry, entry),
        `${label}: maintained DOM entry/freeze binding drifted`);
    } else {
      invariant(equal(binding, artifacts),
        `${label}: legacy maintained DOM freeze binding drifted`);
    }
  } else {
    const runtime = selectedPage.runtime?.canvasRenderer;
    invariant(runtime?.path === artifacts?.runtime?.path &&
      runtime?.bytes === artifacts.runtime.bytes &&
      runtime?.sha256 === artifacts.runtime.sha256,
    `${label}: canvas runtime freeze binding drifted`);
  }
  return selectedPage;
}

async function readJson(relativePath, label) {
  return JSON.parse((await ordinaryFileBinding(confined(relativePath, label), label))
    .value.toString('utf8'));
}

async function strictEntries() {
  let ledger;
  try {
    ledger = await readJson('catalog/completion-ledger.json', 'completion ledger');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  invariant(ledger?.schemaVersion === 1 && Array.isArray(ledger.entries),
    'completion ledger must use schemaVersion 1');
  return ledger.entries.map((item) => ({
    key: item?.animationId, module: item?.registryModule,
    maturity: 'strict-complete', scope: 'strict-ledger',
    deploymentScope: 'bundled',
  }));
}

async function privateEntries(registryOverride=null) {
  const document = registryOverride ?? await readJson('packages/demos/private-current-js-registry.json',
    'private Current-JS registry');
  const calibrations = document?.schemaVersion === 1 &&
    document.registryScope === 'private-engineering'
    ? [document]
    : document?.schemaVersion === 2 &&
      document.registryScope === 'private-engineering' &&
      Array.isArray(document.calibrations)
      ? document.calibrations : null;
  invariant(calibrations?.length > 0,
    'private Current-JS registry calibrations are invalid');
  const seenCalibrations = new Set();
  const entries = [];
  for (const calibration of calibrations) {
    invariant(typeof calibration?.calibrationId === 'string' &&
      calibration.calibrationId.length > 0 &&
      typeof calibration.freezeManifest === 'string' &&
      calibration.freezeManifest.startsWith('catalog/product-bridge-calibrations/') &&
      Array.isArray(calibration.entries) &&
      !seenCalibrations.has(calibration.calibrationId),
    'private Current-JS calibration identity, freeze, or entries are invalid');
    seenCalibrations.add(calibration.calibrationId);
    const deploymentScope = privateCurrentJsCalibrationDeploymentScope(calibration);
    const freezeBinding = await ordinaryFileBinding(
      confined(calibration.freezeManifest, calibration.calibrationId),
      `${calibration.calibrationId} freeze manifest`);
    const freeze = JSON.parse(freezeBinding.value.toString('utf8'));
    invariant(freeze.schemaVersion === 1 &&
      freeze.calibrationId === calibration.calibrationId &&
      Array.isArray(freeze.selectedPages) &&
      (freeze.deploymentScope ?? 'bundled') === deploymentScope,
    `${calibration.calibrationId}: freeze manifest is invalid`);
    if (deploymentScope === 'local-only') {
      invariant(calibration.freezeManifestBytes === freezeBinding.bytes &&
        calibration.freezeManifestSha256 === freezeBinding.sha256,
      `${calibration.calibrationId}: freeze manifest bytes drifted`);
    }
    for (const entry of calibration.entries) {
      validateAdmissionBinding(calibration, freeze, entry, deploymentScope);
      if (deploymentScope === 'local-only') {
        if (isHfrArtifactEntry(entry)) validateHfrArtifactClosure(root, calibration, entry, freeze);
        for (const [kind, artifact] of Object.entries(entry.artifacts)) {
          if (kind === 'kind') continue;
          const observed = await ordinaryFileBinding(
            confined(artifact.path, `${calibration.calibrationId}:${entry.key}:${kind}`),
            `${calibration.calibrationId}:${entry.key}:${kind}`);
          invariant(observed.bytes === artifact.bytes &&
            observed.sha256 === artifact.sha256,
          `${calibration.calibrationId}:${entry.key}:${kind} bytes drifted`);
        }
      }
      entries.push({
        ...entry, scope: 'private-engineering',
        calibrationId: calibration.calibrationId, deploymentScope,
        ...(deploymentScope === 'local-only' ? {
          freezeManifestSha256: calibration.freezeManifestSha256,
          moduleSha256: entry.artifacts.module.sha256,
          ...(isHfrArtifactEntry(entry) ? hfrRegistrationMetadata(entry) : {
          timelineSha256: entry.artifacts.timeline.sha256,
          ...(entry.artifacts.kind === 'maintained-dom-module-v1' ? {
            rendererBindingKind: 'maintained-dom-module-v1',
            memberManifestSha256: entry.artifacts.memberManifest.sha256,
            sourceRunSha256: entry.artifacts.sourceRun.sha256,
          } : {runtimeSha256: entry.artifacts.runtime.sha256})}),
        } : {}),
      });
    }
  }
  return entries;
}

async function validateModule(entry) {
  const moduleBase = path.join(demos, 'src', entry.module.slice(2));
  for (const extension of ['.tsx', '.ts']) {
    try {
      const metadata = await lstat(`${moduleBase}${extension}`);
      if (metadata.isFile() && !metadata.isSymbolicLink() &&
        metadata.nlink === 1) return;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Registry module does not exist for ${entry.key}: ${entry.module}`);
}

export async function checkPrivateCurrentJsAdmissionRegistry({registryOverride=null,
  localDispatchOverride=null}={}) {
  invariant((registryOverride===null)===(localDispatchOverride===null),
    'projected registry and local dispatch must be supplied together');
  if(localDispatchOverride!==null)
    invariant(Object.keys(localDispatchOverride).sort().join(',')==='localOnly,localOnlyMetadata',
      'projected local dispatch has exact two outputs');
  const prototypes = await readJson('packages/demos/prototype-registry.json',
    'prototype registry');
  invariant(prototypes.schemaVersion === 1 && Array.isArray(prototypes.entries),
    'prototype registry must use schemaVersion 1');
  const entries = [
    ...prototypes.entries.map((entry) => ({...entry, scope: 'prototype',
      deploymentScope: 'bundled'})),
    ...(await privateEntries(registryOverride)), ...(await strictEntries()),
  ].sort((a, b) => String(a.key).localeCompare(String(b.key)));
  const keys = new Set();
  for (const entry of entries) {
    invariant(keyPattern.test(entry.key), `Invalid animation registry key: ${entry.key}`);
    invariant(modulePattern.test(entry.module), `Invalid module for ${entry.key}: ${entry.module}`);
    invariant(['legacy-prototype', 'private-current-js', 'strict-complete']
      .includes(entry.maturity), `Invalid maturity for ${entry.key}`);
    invariant(['prototype', 'private-engineering', 'strict-ledger']
      .includes(entry.scope), `Invalid scope for ${entry.key}`);
    invariant(['bundled', 'local-only'].includes(entry.deploymentScope),
      `Invalid deployment scope for ${entry.key}`);
    invariant(entry.deploymentScope !== 'local-only' ||
      entry.scope === 'private-engineering',
    `Only private-engineering modules may be local-only: ${entry.key}`);
    invariant(entry.scope !== 'private-engineering' || entry.calibrationId,
      `Private calibration missing for ${entry.key}`);
    invariant(!keys.has(entry.key), `Duplicate animation registry key: ${entry.key}`);
    keys.add(entry.key);
    await validateModule(entry);
  }
  const expected = {
    bundled: renderRegistrySource(entries),
    metadata: renderRegistryMetadataSource(entries),
    localOnly: renderLocalOnlyRegistrySource(entries),
    localOnlyMetadata: renderLocalOnlyRegistryMetadataSource(entries),
  };
  for (const [name, relativePath] of Object.entries(outputs)) {
    const actual = localDispatchOverride?.[name] ??
      await readFile(confined(relativePath, name), 'utf8');
    invariant(actual === expected[name], `${relativePath} differs from registry inputs`);
  }
  return Object.freeze({entries: entries.length,
    privateEntries: entries.filter((entry) => entry.scope === 'private-engineering').length,
    outputs: Object.keys(outputs).length});
}

if (process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPrivateCurrentJsAdmissionRegistry().then((result) => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
