#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {HFR_ARTIFACT_KIND, isHfrArtifactEntry, validateHfrArtifactClosure, hfrRegistrationMetadata, hfrRegistrationMetadataSource} from '../../../scripts/lib/hfr-artifact-binding-v1.mjs';

import {
  privateCurrentJsCalibrationDeploymentScope,
} from '../../../scripts/private-current-js-registry.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(scriptPath), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const bundledOutputPath = path.join(packageRoot, 'src/registry.generated.ts');
const metadataOutputPath = path.join(
  packageRoot,
  'src/registry.metadata.generated.ts',
);
const localOnlyOutputPath = path.join(
  packageRoot,
  'src/registry.local-only.generated.ts',
);
const localOnlyMetadataOutputPath = path.join(
  packageRoot,
  'src/registry.local-only.metadata.generated.ts',
);

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function ordinaryFileBinding(filePath, label) {
  const metadata = await lstat(filePath);
  if (
    !metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1
  ) {
    throw new Error(`${label} must be an ordinary single-link file`);
  }
  const bytes = await readFile(filePath);
  return Object.freeze({bytes: bytes.length, sha256: sha256(bytes), value: bytes});
}

function validKey(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
}

function validModule(value) {
  return typeof value === 'string' && /^\.\/modules\/[a-z0-9][a-z0-9-]*$/.test(value);
}

// Nine immutable, one-page maintained-DOM freezes encode rendererBinding as
// an absent field (P053) or a semantic string (P054-P064). Their exact entry
// and artifact pins live at the freeze top level instead.
const HISTORICAL_DOM_BINDINGS = Object.freeze({
  'g678-nms-l02-p053-source-directions-current-js-v1': {key: 'shared-nms002-l02-p053', freezeSha256: 'fbc7d175a7a732e3cef558e94b594794e26ba5dcd35e673993537da96f6f361d', runtimeBinding: null},
  'g678-nms-l02-p054-source-matching-current-js-v1': {key: 'shared-nms002-l02-p054', freezeSha256: '52ee34ef28cf39638ef23ec701cd9ab886156acfb4ed80fb2abb7369819deec2', runtimeBinding: 'maintained-dom-matching-state-v1'},
  'g678-nms-l02-p056-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p056', freezeSha256: 'b28f4489369774d46ab31c6534e297a06c81559feca55572e0350ca3ee6b6aba', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p057-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p057', freezeSha256: '21c81fd15172991bcdaad4a146d481fdacbb5be7fac32acf6d9f90a59344b7ee', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p058-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p058', freezeSha256: 'da93cfb40fd64884dcc452e9a3a250ce05fa8fded54d35c326530169a14c259d', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p060-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p060', freezeSha256: '50e165552fc754d82603fe7625774048d8061a7fbff0b8c852e0188db77a367d', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p061-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p061', freezeSha256: '6722e26c88250b87e37db6bfe472bffc239ea47fc184aebfd5ed900cee22f9a2', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p062-conditional-host-current-js-v1': {key: 'shared-nms002-l02-p062', freezeSha256: '13278fc201e90a67182d20c9a4089e92fa162e5130417254a0a282f52f90a93e', runtimeBinding: 'maintained-dom-module-v1'},
  'g678-nms-l02-p064-source-quiz-current-js-v1': {key: 'shared-nms002-l02-p064', freezeSha256: '39a1ddce599b39f0b6df58ff5b5ac5b25ac2567d192d6e2592345a717907e22b', runtimeBinding: 'maintained-dom-quiz-state-v1'},
});

export function historicalDomTopLevelBindingMatches(
  calibration, freeze, freezeBinding, selectedPage, entry,
) {
  const historical = HISTORICAL_DOM_BINDINGS[calibration.calibrationId];
  if (!historical || entry.key !== historical.key ||
      freezeBinding.sha256 !== historical.freezeSha256 ||
      freeze.selectedPages.length !== 1 ||
      selectedPage?.animationId !== entry.key ||
      !selectedPage.runtime ||
      JSON.stringify(freeze.entry) !== JSON.stringify(entry)) return false;
  return historical.runtimeBinding === null
    ? !Object.hasOwn(selectedPage.runtime, 'rendererBinding')
    : selectedPage.runtime.rendererBinding === historical.runtimeBinding;
}

async function moduleExists(specifier) {
  const base = path.join(packageRoot, 'src', specifier.slice(2));
  for (const extension of ['.tsx', '.ts']) {
    try {
      const metadata = await lstat(`${base}${extension}`);
      if (
        metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1
      ) return true;
    } catch {
      // Try the next supported TypeScript extension.
    }
  }
  return false;
}

function ledgerEntries(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 1) {
    throw new Error('catalog/completion-ledger.json must use schemaVersion 1');
  }
  if (!Array.isArray(value.entries)) throw new Error('completion ledger entries must be an array');
  return value.entries;
}

async function strictEntries() {
  const ledgerPath = path.join(repositoryRoot, 'catalog/completion-ledger.json');
  let ledger;
  try {
    ledger = await readJson(ledgerPath);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  return ledgerEntries(ledger).map((item) => ({
    key: item?.animationId,
    module: item?.registryModule,
    maturity: 'strict-complete',
    scope: 'strict-ledger',
    deploymentScope: 'bundled',
  }));
}

async function privateCurrentJsEntries() {
  const document = await readJson(
    path.join(packageRoot, 'private-current-js-registry.json'),
  );
  const calibrations = document.schemaVersion === 1 &&
      document.registryScope === 'private-engineering'
    ? [document]
    : document.schemaVersion === 2 &&
        document.registryScope === 'private-engineering' &&
        Array.isArray(document.calibrations)
      ? document.calibrations
      : null;
  if (!calibrations || calibrations.length === 0) {
    throw new Error(
      'private-current-js-registry.json must bind one or more private-engineering calibrations',
    );
  }
  const calibrationIds = new Set();
  const output = [];
  for (const calibration of calibrations) {
    if (
      typeof calibration?.calibrationId !== 'string' ||
      !calibration.calibrationId ||
      typeof calibration.freezeManifest !== 'string' ||
      !calibration.freezeManifest.startsWith(
        'catalog/product-bridge-calibrations/',
      ) ||
      !Array.isArray(calibration.entries) ||
      calibrationIds.has(calibration.calibrationId)
    ) {
      throw new Error(
        'private Current-JS calibration identity, freeze, or entries are invalid',
      );
    }
    calibrationIds.add(calibration.calibrationId);
    const deploymentScope =
      privateCurrentJsCalibrationDeploymentScope(calibration);
    const freezePath = path.join(repositoryRoot, calibration.freezeManifest);
    const freezeBinding = await ordinaryFileBinding(
      freezePath,
      `${calibration.calibrationId} freeze manifest`,
    );
    const freeze = JSON.parse(freezeBinding.value.toString('utf8'));
    if (
      freeze.schemaVersion !== 1 ||
      freeze.calibrationId !== calibration.calibrationId ||
      !Array.isArray(freeze.selectedPages) ||
      (freeze.deploymentScope ?? 'bundled') !== deploymentScope
    ) {
      throw new Error('private Current-JS registry freeze manifest is invalid');
    }
    if (
      deploymentScope === 'local-only' &&
      (
        calibration.freezeManifestBytes !== freezeBinding.bytes ||
        calibration.freezeManifestSha256 !== freezeBinding.sha256
      )
    ) {
      throw new Error(
        `${calibration.calibrationId}: local-only freeze bytes drifted`,
      );
    }
    const selected = new Map(
      freeze.selectedPages.map((page) => [
        page?.animationId,
        page,
      ]),
    );
    for (const entry of calibration.entries) {
      const selectedPage = selected.get(entry?.key);
      if (
        entry?.maturity !== 'private-current-js' ||
        selectedPage?.complexityLane !== entry?.complexityLane
      ) {
        throw new Error(
          `Private registry entry is not frozen by ${calibration.calibrationId}: ${entry?.key}`,
        );
      }
      if (deploymentScope === 'local-only') {
        const bindings = entry.artifacts;
        const expectedRuntime = selectedPage?.runtime?.canvasRenderer;
        const expectedDom = selectedPage?.runtime?.rendererBinding;
        if (isHfrArtifactEntry(entry)) {
          validateHfrArtifactClosure(repositoryRoot, calibration, entry, freeze);
        } else if (bindings.kind === 'maintained-dom-module-v1') {
          if (
            JSON.stringify(expectedDom) !== JSON.stringify(bindings) &&
            !historicalDomTopLevelBindingMatches(
              calibration, freeze, freezeBinding, selectedPage, entry,
            )
          ) {
            throw new Error(
              `${calibration.calibrationId}:${entry.key}: maintained DOM freeze binding drifted`,
            );
          }
        } else if (
          expectedRuntime?.path !== bindings.runtime.path ||
            expectedRuntime?.bytes !== bindings.runtime.bytes ||
            expectedRuntime?.sha256 !== bindings.runtime.sha256
        ) {
          throw new Error(
            `${calibration.calibrationId}:${entry.key}: runtime freeze binding drifted`,
          );
        }
        for (const [kind, binding] of Object.entries(bindings)) {
          if (kind === 'kind') continue;
          const observed = await ordinaryFileBinding(
            path.join(repositoryRoot, binding.path),
            `${calibration.calibrationId}:${entry.key}:${kind}`,
          );
          if (
            observed.bytes !== binding.bytes ||
            observed.sha256 !== binding.sha256
          ) {
            throw new Error(
              `${calibration.calibrationId}:${entry.key}:${kind} bytes drifted`,
            );
          }
        }
      }
      output.push({
        ...entry,
        scope: 'private-engineering',
        calibrationId: calibration.calibrationId,
        deploymentScope,
        ...(deploymentScope === 'local-only'
          ? {
              freezeManifestSha256: calibration.freezeManifestSha256,
              moduleSha256: entry.artifacts.module.sha256,
              ...(isHfrArtifactEntry(entry) ? hfrRegistrationMetadata(entry) : {
              timelineSha256: entry.artifacts.timeline.sha256,
              ...(entry.artifacts.kind === 'maintained-dom-module-v1'
                ? {rendererBindingKind: 'maintained-dom-module-v1',
                    memberManifestSha256:
                      entry.artifacts.memberManifest.sha256,
                    sourceRunSha256: entry.artifacts.sourceRun.sha256}
                : {runtimeSha256: entry.artifacts.runtime.sha256})}),
            }
          : {}),
      });
    }
  }
  return output;
}

function localArtifactMetadataSource(entry) {
  if (entry.rendererBindingKind === HFR_ARTIFACT_KIND) return hfrRegistrationMetadataSource(entry);
  return `, timelineSha256: '${entry.timelineSha256}'${entry.rendererBindingKind === 'maintained-dom-module-v1' ? `, rendererBindingKind: 'maintained-dom-module-v1', memberManifestSha256: '${entry.memberManifestSha256}', sourceRunSha256: '${entry.sourceRunSha256}'` : `, runtimeSha256: '${entry.runtimeSha256}'`}`;
}

export function renderRegistrySource(entries) {
  const hasHfr = entries.some(entry => entry.rendererBindingKind === HFR_ARTIFACT_KIND);
  const hasMaintainedDom = entries.some((entry) =>
    entry.rendererBindingKind === 'maintained-dom-module-v1');
  const loaderSource = (entry) => entry.scope === 'private-engineering'
    ? `  '${entry.key}': () => import('${entry.module}').then(({default: animationModule}) => Object.freeze({...animationModule, maturity: 'private-current-js' as const}))`
    : `  '${entry.key}': () => import('${entry.module}').then(({default: animationModule}) => animationModule)`;
  const registrationSource = (entry) => {
    const calibration = entry.calibrationId
      ? `, calibrationId: '${entry.calibrationId}'`
      : '';
    const bindings = entry.deploymentScope === 'local-only'
      ? `, freezeManifestSha256: '${entry.freezeManifestSha256}', moduleSha256: '${entry.moduleSha256}'${localArtifactMetadataSource(entry)}`
      : '';
    return `  '${entry.key}': Object.freeze({maturity: '${entry.maturity}', scope: '${entry.scope}', deploymentScope: '${entry.deploymentScope}'${calibration}${bindings}})`;
  };
  const bundledEntries = entries.filter(
    ({deploymentScope}) => deploymentScope === 'bundled',
  );
  const bundledLoaders = bundledEntries.map(loaderSource);
  const bundledRegistrations = bundledEntries.map(registrationSource);
  return [
    '/* This file is generated by scripts/generate-registry.mjs. Do not edit. */',
    "import type {AnimationModule} from './contract';",
    '',
    'export type AnimationModuleLoader = () => Promise<AnimationModule>;',
    "export type AnimationRegistryScope = 'prototype' | 'private-engineering' | 'strict-ledger';",
    "export type AnimationModuleDeploymentScope = 'bundled' | 'local-only';",
    'export type AnimationModuleRegistrationScope = AnimationRegistryScope;',
    'export interface AnimationModuleRegistration {',
    "  readonly maturity: AnimationModule['maturity'];",
    '  readonly scope: AnimationRegistryScope;',
    '  readonly deploymentScope: AnimationModuleDeploymentScope;',
    '  readonly calibrationId?: string;',
    '  readonly freezeManifestSha256?: string;',
    '  readonly moduleSha256?: string;',
    '  readonly timelineSha256?: string;',
    '  readonly runtimeSha256?: string;',
    ...(hasMaintainedDom || hasHfr ? [
      hasHfr ? "  readonly rendererBindingKind?: 'maintained-dom-module-v1' | 'generated-typescript-hfr-v1';" :
        "  readonly rendererBindingKind?: 'maintained-dom-module-v1';",
      '  readonly memberManifestSha256?: string;',
      '  readonly sourceRunSha256?: string;',
    ] : []),
    ...(hasHfr ? [
      '  readonly generatedModuleSha256?: string;',
      '  readonly pageDataSha256?: string;',
      '  readonly artifactClosureSha256?: string;',
    ] : []),
    '}',
    '',
    'export const animationModuleLoaders: Readonly<Record<string, AnimationModuleLoader>> = Object.freeze({',
    bundledLoaders.join(',\n'),
    '});',
    '',
    'export const animationModuleRegistrations: Readonly<Record<string, AnimationModuleRegistration>> = Object.freeze({',
    bundledRegistrations.join(',\n'),
    '});',
    '',
  ].join('\n');
}

export function renderRegistryMetadataSource(entries) {
  const registrationSource = (entry) => {
    const calibration = entry.calibrationId
      ? `, calibrationId: '${entry.calibrationId}'`
      : '';
    return `  '${entry.key}': Object.freeze({maturity: '${entry.maturity}', scope: '${entry.scope}', deploymentScope: '${entry.deploymentScope}'${calibration}})`;
  };
  const bundledEntries = entries.filter(
    ({deploymentScope}) => deploymentScope === 'bundled',
  );
  return [
    '/* This file is generated by scripts/generate-registry.mjs. Do not edit. */',
    "import type {AnimationModule} from './contract';",
    '',
    "export type AnimationRegistryScope = 'prototype' | 'private-engineering' | 'strict-ledger';",
    "export type AnimationModuleDeploymentScope = 'bundled' | 'local-only';",
    'export interface AnimationModuleRegistration {',
    "  readonly maturity: AnimationModule['maturity'];",
    '  readonly scope: AnimationRegistryScope;',
    '  readonly deploymentScope: AnimationModuleDeploymentScope;',
    '  readonly calibrationId?: string;',
    '}',
    '',
    'export const registeredAnimationKeys = Object.freeze([',
    bundledEntries.map((entry) => `  '${entry.key}'`).join(',\n'),
    '] as const);',
    '',
    'export const animationModuleRegistrations: Readonly<Record<string, AnimationModuleRegistration>> = Object.freeze({',
    bundledEntries.map(registrationSource).join(',\n'),
    '});',
    '',
  ].join('\n');
}

export function renderLocalOnlyRegistrySource(entries) {
  const localOnlyEntries = entries.filter(
    ({deploymentScope}) => deploymentScope === 'local-only',
  );
  const loaderSource = (entry) =>
    `      '${entry.key}': () => import('${entry.module}').then(({default: animationModule}) => Object.freeze({...animationModule, maturity: 'private-current-js' as const}))`;
  const registrationSource = (entry) =>
    `      '${entry.key}': Object.freeze({maturity: '${entry.maturity}', scope: '${entry.scope}', deploymentScope: 'local-only', calibrationId: '${entry.calibrationId}', freezeManifestSha256: '${entry.freezeManifestSha256}', moduleSha256: '${entry.moduleSha256}'${localArtifactMetadataSource(entry)}})`;
  return [
    '/* This file is generated by scripts/generate-registry.mjs. Do not edit. */',
    'import type {AnimationModuleLoader, AnimationModuleRegistration} from \'./registry.generated\';',
    '',
    'export const localOnlyAnimationModuleLoaders: Readonly<Record<string, AnimationModuleLoader>> =',
    "  process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1'",
    '    ? Object.freeze({})',
    '    : Object.freeze({',
    localOnlyEntries.map(loaderSource).join(',\n'),
    '      });',
    '',
    'export const localOnlyAnimationModuleRegistrations: Readonly<Record<string, AnimationModuleRegistration>> =',
    "  process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1'",
    '    ? Object.freeze({})',
    '    : Object.freeze({',
    localOnlyEntries.map(registrationSource).join(',\n'),
    '      });',
    '',
  ].join('\n');
}

export function renderLocalOnlyRegistryMetadataSource(entries) {
  const localOnlyEntries = entries.filter(
    ({deploymentScope}) => deploymentScope === 'local-only',
  );
  const registrationSource = (entry) =>
    `      '${entry.key}': Object.freeze({maturity: '${entry.maturity}', scope: '${entry.scope}', deploymentScope: 'local-only', calibrationId: '${entry.calibrationId}', freezeManifestSha256: '${entry.freezeManifestSha256}', moduleSha256: '${entry.moduleSha256}'${localArtifactMetadataSource(entry)}})`;
  return [
    '/* This file is generated by scripts/generate-registry.mjs. Do not edit. */',
    "import type {AnimationModuleRegistration} from './registry.generated';",
    '',
    'export const registeredLocalOnlyAnimationKeys: readonly string[] =',
    "  process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1'",
    '    ? Object.freeze([])',
    '    : Object.freeze([',
    localOnlyEntries.map((entry) => `      '${entry.key}'`).join(',\n'),
    '      ]);',
    '',
    'export const localOnlyAnimationModuleRegistrations: Readonly<Record<string, AnimationModuleRegistration>> =',
    "  process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1'",
    '    ? Object.freeze({})',
    '    : Object.freeze({',
    localOnlyEntries.map(registrationSource).join(',\n'),
    '      });',
    '',
  ].join('\n');
}

export async function buildRegistrySources() {
  const prototypes = await readJson(path.join(packageRoot, 'prototype-registry.json'));
  if (prototypes.schemaVersion !== 1 || !Array.isArray(prototypes.entries)) {
    throw new Error('prototype-registry.json must use schemaVersion 1 with an entries array');
  }
  const prototypeEntries = prototypes.entries.map((entry) => ({
    ...entry,
    scope: 'prototype',
    deploymentScope: 'bundled',
  }));
  const entries = [
    ...prototypeEntries,
    ...(await privateCurrentJsEntries()),
    ...(await strictEntries()),
  ].sort((a, b) =>
    String(a.key).localeCompare(String(b.key))
  );
  const seen = new Set();
  for (const entry of entries) {
    if (!validKey(entry.key)) throw new Error(`Invalid animation registry key: ${entry.key}`);
    if (!validModule(entry.module)) throw new Error(`Invalid module for ${entry.key}: ${entry.module}`);
    if (!['legacy-prototype', 'private-current-js', 'strict-complete'].includes(entry.maturity)) {
      throw new Error(`Invalid maturity for ${entry.key}: ${entry.maturity}`);
    }
    if (!['prototype', 'private-engineering', 'strict-ledger'].includes(entry.scope)) {
      throw new Error(`Invalid registry scope for ${entry.key}: ${entry.scope}`);
    }
    if (!['bundled', 'local-only'].includes(entry.deploymentScope)) {
      throw new Error(
        `Invalid registry deployment scope for ${entry.key}: ${entry.deploymentScope}`,
      );
    }
    if (entry.deploymentScope === 'local-only' && entry.scope !== 'private-engineering') {
      throw new Error(
        `Only private-engineering modules may be local-only: ${entry.key}`,
      );
    }
    if (
      entry.scope === 'private-engineering' &&
      (typeof entry.calibrationId !== 'string' || !entry.calibrationId)
    ) {
      throw new Error(`Private registry calibration is missing for ${entry.key}`);
    }
    if (seen.has(entry.key)) throw new Error(`Duplicate animation registry key: ${entry.key}`);
    seen.add(entry.key);
    if (!(await moduleExists(entry.module))) {
      throw new Error(`Registry module does not exist for ${entry.key}: ${entry.module}`);
    }
  }
  return Object.freeze({
    bundled: renderRegistrySource(entries),
    metadata: renderRegistryMetadataSource(entries),
    localOnly: renderLocalOnlyRegistrySource(entries),
    localOnlyMetadata: renderLocalOnlyRegistryMetadataSource(entries),
  });
}

export async function buildRegistrySource() {
  return (await buildRegistrySources()).bundled;
}

async function main() {
  const sources = await buildRegistrySources();
  if (process.argv.includes('--check')) {
    const [bundled, metadata, localOnly, localOnlyMetadata] = await Promise.all([
      readFile(bundledOutputPath, 'utf8').catch(() => ''),
      readFile(metadataOutputPath, 'utf8').catch(() => ''),
      readFile(localOnlyOutputPath, 'utf8').catch(() => ''),
      readFile(localOnlyMetadataOutputPath, 'utf8').catch(() => ''),
    ]);
    if (
      bundled !== sources.bundled ||
      metadata !== sources.metadata ||
      localOnly !== sources.localOnly ||
      localOnlyMetadata !== sources.localOnlyMetadata
    ) {
      throw new Error('generated registry files are stale; run npm run generate:registry --workspace @helpmath/demos');
    }
    return;
  }
  await Promise.all([
    writeFile(bundledOutputPath, sources.bundled),
    writeFile(metadataOutputPath, sources.metadata),
    writeFile(localOnlyOutputPath, sources.localOnly),
    writeFile(localOnlyMetadataOutputPath, sources.localOnlyMetadata),
  ]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
