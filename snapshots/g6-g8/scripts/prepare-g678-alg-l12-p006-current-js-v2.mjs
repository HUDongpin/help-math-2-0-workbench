#!/usr/bin/env node

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import ts from 'typescript';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const WORKSPACE = path.resolve(path.dirname(SCRIPT), '..');
const ID = 'shared-alg001-l12-p006';
const CALIBRATION = 'g678-alg-l12-p006-current-js-v2';
export const P006_SUPERSEDED_ADMISSION = Object.freeze({
  calibrationId: 'g678-alg-l12-p006-current-js-v1',
  freeze: Object.freeze({
    path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v1.json',
    bytes: 37932, sha256: '46847b41be87fc22e2f9b1bcf566252180fc2b04a73ca94bd11978e9e42dd0c7',
  }),
  fragment: Object.freeze({
    path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v1.fragment.json',
    bytes: 1267, sha256: 'aa11119dd474a310ceeec314592a2fe69cb0e48fb7c4a4a3e3ed7532da4d44d3',
  }),
});
const MIGRATION = `migrations/${ID}`;
export const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const GLOSSARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const AUDIO_SHA = '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803';
const RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const SOURCE_CATALOG_SHA = 'ade09b22c6df92ebbef45c15154abe20e60ffff2f8328dd9e1b877b734611996';
const SOURCE_DISPOSITION_SHA = '2a2485b939b4c2fcf853afca4143c611bc30624471ab268111e0fd34387dd89b';
const SHA = /^[a-f0-9]{64}$/u;
export const P006_TYPOGRAPHY_PATHS = Object.freeze({
  binding: `catalog/typography-v1/g678-page-bindings/${ID}.json`,
  check: `catalog/typography-v1/g678-checks/${ID}.json`,
  integration: 'catalog/typography-v1/g678-integration.json',
  runtime: `${MIGRATION}/typography-v1/canvas-renderer.js`,
  runtimeMetadata: `${MIGRATION}/typography-v1/runtime-meta.json`,
  exactSuppressionManifest: `${MIGRATION}/typography-v1/adapter-manifest.json`,
  sourceDisposition: `${MIGRATION}/evidence/TYPOGRAPHY_SOURCE_2026-09-27.md`,
  generator: 'scripts/build-g678-alg-l12-p006-typography.mjs',
  sourceParser: 'scripts/lib/swf-text-source-catalog.mjs',
});
export const P006_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
export const P006_NATIVE_TYPOGRAPHY_PATHS = Object.freeze([
  `packages/demos/src/modules/${ID}.tsx`,
  'packages/demos/src/alg-l12-p006-typography.ts',
  'packages/demos/src/alg-l12-p006-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p006-typography.css',
  'packages/demos/src/alg-l12-p006-typography-asset.ts',
  P006_TYPOGRAPHY_PATHS.runtime, P006_TYPOGRAPHY_PATHS.runtimeMetadata,
  P006_TYPOGRAPHY_PATHS.exactSuppressionManifest, P006_TYPOGRAPHY_PATHS.sourceDisposition,
  P006_TYPOGRAPHY_PATHS.generator, P006_TYPOGRAPHY_PATHS.sourceParser,
]);
// Registration changes these files. Their live hashes belong in the final
// typography pair, after freeze -> registry -> dispatch generation; never here.
export const P006_EXCLUDED_FREEZE_PATHS = Object.freeze([
  'packages/demos/private-current-js-registry.json',
  'packages/demos/src/registry.generated.ts',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  P006_TYPOGRAPHY_PATHS.binding, P006_TYPOGRAPHY_PATHS.check,
]);
// Admission wiring is finalized before freeze. The later typography refresh
// must bind its current bytes and generated dispatch; it cannot reuse old pins.
export const P006_ADMISSION_WIRING_PATHS = Object.freeze([
  `packages/demos/src/timelines/${ID}.ts`,
  'scripts/prepare-g678-alg-l12-p006-current-js-v2.mjs',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.test.mts',
  'apps/web/lib/g678-alg-l12-p006-current-js.server.ts',
  'apps/web/lib/g678-current-js-extensions.server.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  'apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
  'apps/web/tests/g678-alg-l12-p006-current-js.server-test.ts',
  'apps/web/lib/g678-alg-l12-p006-host-probe.server.ts',
  'apps/web/tests/g678-alg-l12-p006-host-probe.server-test.ts',
]);
export const P006_HOST_DISCLOSURE_PINS = Object.freeze({
  prior: {bytes: 21450, sha256: '24a5297dd063a4309e8d442b496ebc80d1b259ecef422507d8e77f1e4342bc6c'},
  reviewed: {bytes: 21457, sha256: 'f29fbccee91ad080d659bb1bb22654ba64430f696a8bbecfb9a016cd6f21989f'},
});
export const P006_PROXY_SUCCESSOR_PINS = Object.freeze({
  path: 'apps/web/lib/g678-p047-proxy-host-successor.server.ts',
  prior: Object.freeze({bytes: 8119,
    sha256: '096cd4cdacd0305ae80610ccfd7203216babfddf9150703f994ce08ffb2fe6ea'}),
  reviewed: Object.freeze({bytes: 12113,
    sha256: '26c7eeb9e0f95c4e193dbd1974da678ce51969d47658dc427d06cdab6a5ee954'}),
});
export const P006_RETAINED_V1_PRODUCER_PINS = Object.freeze({
  path: 'scripts/prepare-g678-alg-l12-p006-current-js-v1.mjs',
  prior: Object.freeze({bytes: 19394,
    sha256: '347fec142b192c6bde5255e78dba2cb1180ebcc1608706ed3e69769fc1432793'}),
  reviewed: Object.freeze({bytes: 40027,
    sha256: '6a84287765216f1fe395c7d893eaa38eec0a4cee7f4ce49091c426736d30b1d6'}),
});
export const P006_ADMISSION_PATHS = Object.freeze({
  freeze: `catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  fragment: `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`,
  runtime: `work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
  candidate: `${MIGRATION}/candidate-v2/canvas-renderer.js`,
  module: `packages/demos/src/modules/${ID}.tsx`,
  timeline: `packages/demos/src/timelines/${ID}.ts`,
  host: 'apps/web/components/g678-alg-l12-p006-host-lesson.tsx',
  predecessor: 'catalog/product-bridge-calibrations/g678-alg-l12-p003-current-js-v1.json',
  registry: 'packages/demos/private-current-js-registry.json',
  sourceCatalog: 'catalog/g678-shared-catalog.v1.json',
  sourceAudit: `${MIGRATION}/MIGRATION_BRIEF.md`,
  candidateManifest: `${MIGRATION}/candidate-v2/mask-manifest.json`,
  sourceGlossary: `${MIGRATION}/audit/glossary-disposition-v1.json`,
  glossaryCatalog: 'catalog/g678-vb02-l1-family-audit-v1.json',
  embeddedMp3: `${MIGRATION}/audio-source-v1/sprite-53-source-stream.mp3`,
  embeddedReceipt: `${MIGRATION}/audio-source-v1/stream-source-receipt.json`,
});
export const PHYSICAL_SOURCE_PINS = Object.freeze({
  source: {path: 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf', bytes: 708053, sha256: SOURCE_SHA},
  sourceXml: {path: 'G6-G8-shared/ALG001/L12/index.xml', bytes: 11927,
    sha256: '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'},
  spanishAudio: {path: 'G6-G8-shared/ALG001/L12/SA/L12RW06.mp3', bytes: 214704,
    sha256: '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf'},
});
const FIXED_WORKSPACE_PINS = Object.freeze({
  [P006_ADMISSION_PATHS.predecessor]: {bytes: 5521,
    sha256: '13d8872bcbfbcf98fe7a23e5cf38782321c39f6ecd6a412827d28f87bc76fff5'},
  [P006_ADMISSION_PATHS.candidate]: {bytes: 11507597, sha256: RUNTIME_SHA},
  [P006_ADMISSION_PATHS.embeddedMp3]: {bytes: 140920, sha256: AUDIO_SHA},
  [P006_ADMISSION_PATHS.embeddedReceipt]: {bytes: 142839,
    sha256: 'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78'},
  [P006_ADMISSION_PATHS.sourceGlossary]: {bytes: 26891,
    sha256: '7c0dcbfa455ad06a1a72c4d9550d6aabd4131c4c3e498ecad50193f1d5395bab'},
  [P006_ADMISSION_PATHS.glossaryCatalog]: {bytes: 230498,
    sha256: 'e5ff597b123c3097f2784d497b5f9ba1be0a750ffbd36b36e8038ea6bcd36763'},
});
export const REQUIRED_WORKSPACE_PATHS = Object.freeze([...new Set([
  ...Object.values(P006_ADMISSION_PATHS).filter(file =>
    ![P006_ADMISSION_PATHS.freeze, P006_ADMISSION_PATHS.fragment,
      P006_ADMISSION_PATHS.runtime].includes(file)),
  ...['audio-decode', 'audio-schedule', 'audio-transport', 'spanish-audio',
    'visual-clock', 'glossary-state', 'glossary-hit', 'host-policy']
    .map(name => `packages/demos/src/alg-l12-p006-${name}.ts`),
  'packages/demos/src/generated/alg-l12-p006-hit-spec.ts',
  'packages/demos/src/source-static-canvas-candidate.tsx',
  'packages/demos/src/contract.ts',
  'packages/demos/src/runtime.ts',
  'packages/demos/src/lesson-host-contract.ts',
  'packages/demos/src/g4-l3-main-timeline-audio.generated.ts',
  'packages/demos/src/g5-l4-audio.generated.ts',
  'apps/web/components/g678-multi-page-lesson-player-v5.generated.tsx',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'apps/web/components/animation-runtime.tsx',
  'apps/web/components/private-audio-glossary-portal.tsx',
  ...['lesson-runtime-adapter', 'g678-private-playback-decision-v1',
    'g678-private-runtime-adapters-v1', 'g678-preview-entry-v1',
    'g678-private-glossary-pause-v1', 'descriptor-driven-glossary-pause',
    'whole-lesson-player-descriptor', 'whole-lesson-session',
    'load-animation-module.client'].map(name => `apps/web/lib/${name}.ts`),
  'scripts/build-g678-multi-page-lesson-player-v5.mjs',
  ...['g678-alg-l12-p006', 'g678-alg-l12-p006-audio',
    'g678-alg-l12-p006-spanish-audio', 'g678-alg-l12-p006-current-js']
    .map(name => `apps/web/lib/${name}.server.ts`),
  'apps/web/tests/g678-alg-l12-p006-current-js.server-test.ts',
  ...['canvas-renderer.js', 'source-audio', 'spanish-audio']
    .map(name => `apps/web/app/flash-assets/g678-local/${ID}/${name}/route.ts`),
  `${MIGRATION}/evidence/AUDIO_CONTINUOUS_CORRECTION_2026-09-27.md`,
  `${MIGRATION}/evidence/SA_HOST_DISPOSITION_2026-09-27.md`,
  ...P006_NATIVE_TYPOGRAPHY_PATHS,
  P006_TYPOGRAPHY_PATHS.integration,
  'apps/web/lib/g678-alg-l12-p006-typography.server.ts',
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  'apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p007/page.tsx',
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p006-admission/page.tsx',
  'apps/web/lib/g678-current-js-extensions.server.ts',
  'apps/web/lib/g678-preview-policy.ts',
  'apps/web/lib/g678-alg-l12-p006-admission-access.ts',
  'apps/web/proxy.ts',
  'apps/web/lib/g678-p047-proxy-host-successor.server.ts',
  'catalog/product-bridge-calibrations/g678-alg-l12-p006-admission-proxy-composed-successor-v1.json',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.test.mts',
  'scripts/build-g678-alg-l12-p006-typography.test.mjs',
  'package.json', 'package-lock.json', 'apps/web/package.json',
  'apps/web/tsconfig.json', 'packages/demos/package.json', 'packages/demos/tsconfig.json',
  'scripts/prepare-g678-alg-l12-p006-current-js-v2.mjs',
  'scripts/prepare-g678-alg-l12-p006-current-js-v2.test.mjs',
])].sort());

export function digest(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
function demand(value, reason) { assert(value, `P006_ADMISSION_PREPARE_INVALID: ${reason}`); }

/** Preparation may create new v2 files alongside the exact retained v1. This
 * check never edits the registry; replacing its one calibration is a separate
 * reviewed atomic transaction. */
export function validateP006RegistrationForPreparation(registry, supersededFiles) {
  demand(registry?.schemaVersion === 2 && registry.registryScope === 'private-engineering' &&
    Array.isArray(registry.calibrations), 'registry scope');
  const matches = registry.calibrations.filter(calibration =>
    calibration.entries?.some(entry => entry.key === ID));
  demand(matches.length <= 1, 'unique P006 registration');
  if (matches.length === 0) return {registered: false, supersedingExactV1: false};
  const actual = matches[0];
  if (actual.calibrationId === CALIBRATION) return {registered: true, supersedingExactV1: false};
  demand(actual.calibrationId === P006_SUPERSEDED_ADMISSION.calibrationId &&
    supersededFiles instanceof Map, 'only exact v1 may precede v2');
  for (const pin of [P006_SUPERSEDED_ADMISSION.freeze, P006_SUPERSEDED_ADMISSION.fragment])
    demand(isDeepStrictEqual(supersededFiles.get(pin.path)?.pin, pin), 'immutable superseded v1 bytes');
  const expected = JSON.parse(supersededFiles.get(P006_SUPERSEDED_ADMISSION.fragment.path).bytes.toString());
  demand(expected.calibrationId === P006_SUPERSEDED_ADMISSION.calibrationId &&
    expected.entries?.length === 1 && expected.entries[0].key === ID &&
    expected.freezeManifest === P006_SUPERSEDED_ADMISSION.freeze.path &&
    expected.freezeManifestBytes === P006_SUPERSEDED_ADMISSION.freeze.bytes &&
    expected.freezeManifestSha256 === P006_SUPERSEDED_ADMISSION.freeze.sha256 &&
    isDeepStrictEqual(actual, expected), 'exact retained v1 registry fragment');
  return {registered: true, supersedingExactV1: true};
}

function relativeFile(root, relative) {
  demand(typeof relative === 'string' && relative && !path.isAbsolute(relative) &&
    !relative.split('/').some(part => !part || part === '..' || part === '.'), 'relative file boundary');
  const file = path.join(root, relative);
  demand(file.startsWith(`${root}${path.sep}`), 'root boundary');
  return file;
}

/** A pin is accepted only for ordinary, physical, single-link, stable bytes. */
export function stableFile(root, relative, expected, io = fs) {
  const file = relativeFile(root, relative);
  demand(io.realpathSync(file) === file, `physical path: ${relative}`);
  const before = io.lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `ordinary file: ${relative}`);
  const bytes = io.readFileSync(file);
  const after = io.lstatSync(file, {bigint: true});
  demand(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key =>
    before[key] === after[key]) && BigInt(bytes.length) === after.size,
  `stable read: ${relative}`);
  const pin = {path: relative, bytes: bytes.length, sha256: digest(bytes)};
  if (expected) demand(pin.bytes === expected.bytes && pin.sha256 === expected.sha256,
    `exact source binding: ${relative}`);
  return {root, bytes, pin};
}

function physicalDirectory(root) {
  const stat = fs.lstatSync(root);
  demand(stat.isDirectory() && !stat.isSymbolicLink() && fs.realpathSync(root) === root,
    `physical directory: ${root}`);
}

export function validateFinalTimeline(text) {
  const file = ts.createSourceFile('p006-timeline.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  demand(file.parseDiagnostics.length === 0, 'final timeline syntax');
  const unwrap = expression => {
    while (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) ||
      ts.isParenthesizedExpression(expression)) expression = expression.expression;
    return expression;
  };
  const properties = expression => {
    const object = unwrap(expression);
    demand(ts.isObjectLiteralExpression(object) && object.properties.every(property =>
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))), 'static timeline object');
    const result = new Map();
    for (const property of object.properties) {
      demand(!result.has(property.name.text), `duplicate timeline property: ${property.name.text}`);
      result.set(property.name.text, property.initializer);
    }
    return result;
  };
  const declaration = name => {
    const matches = file.statements.filter(ts.isVariableStatement).flatMap(statement =>
      statement.declarationList.declarations).filter(item => ts.isIdentifier(item.name) && item.name.text === name);
    demand(matches.length === 1, `single final timeline declaration: ${name}`);
    const call = unwrap(matches[0].initializer);
    demand(ts.isCallExpression(call) && call.expression.getText(file) === 'Object.freeze' &&
      call.arguments.length === 1, `frozen final timeline declaration: ${name}`);
    return properties(call.arguments[0]);
  };
  const literal = (object, name, expected) => {
    const expression = object.get(name);
    const actual = expression && (expression.kind === ts.SyntaxKind.TrueKeyword ? true :
      expression.kind === ts.SyntaxKind.FalseKeyword ? false : ts.isStringLiteral(expression) ? expression.text :
        ts.isNumericLiteral(expression) ? Number(expression.text) : undefined);
    demand(actual === expected, `final timeline ${typeof expected === 'boolean' ? 'declaration' : 'identity'}: ${name}=${expected}`);
  };
  const source = declaration('SHARED_ALG001_L12_P006_SOURCE');
  for (const [name, expected] of [['currentJavaScriptRegistered', true], ['audioPlaybackEnabled', true],
    ['productCalibrationPassed', false], ['strictAcceptanceEffect', 'none'],
    ['spanishTextPolicy', 'english-source-fallback-translation-pending']]) literal(source, name, expected);
  demand(source.has('source'), 'final timeline source identity');
  const sourceIdentity = properties(source.get('source'));
  literal(sourceIdentity, 'path', PHYSICAL_SOURCE_PINS.source.path);
  literal(sourceIdentity, 'sha256', SOURCE_SHA);
  const config = declaration('SHARED_ALG001_L12_P006_CONFIG');
  for (const [name, expected] of [['assetSha256', RUNTIME_SHA], ['mainFrameDomain', 'sprite-53'],
    ['mainFrameCount', 342], ['rootFrameCount', 10], ['rootBeginFrame', 6], ['livePlaybackEndFrame', 342]])
    literal(config, name, expected);
}

function referenceMap(references, label) {
  demand(Array.isArray(references) && references.length > 0, `${label} references`);
  const result = new Map();
  for (const reference of references) {
    relativeFile(WORKSPACE, reference?.path);
    demand(SHA.test(reference.sha256 ?? '') && Number.isSafeInteger(reference.bytes) &&
      reference.bytes >= 0 && !result.has(reference.path), `${label} unique exact pin: ${reference.path}`);
    result.set(reference.path, reference);
  }
  return result;
}
const samePin = (left, right) => left?.path === right?.path && left?.bytes === right?.bytes &&
  left?.sha256 === right?.sha256;
function fileJson(files, relative) {
  demand(files.get(relative)?.bytes, `required JSON input: ${relative}`);
  return JSON.parse(files.get(relative).bytes.toString('utf8'));
}

/** Source-native implementation plus dated technical proof, without writing
 * proof/receipt hashes into freeze. Source/native runtime and controller proof
 * stays unchanged except the exact reviewed host, proxy and producer successors;
 * final registry wiring needs fresh complete-closure evidence. */
export function validateTypographyAdmission(files, proof, now = Date.now()) {
  demand(proof?.files instanceof Map && proof?.sourceCatalog, 'required typography technical proof');
  const bindingFile = proof.files.get(P006_TYPOGRAPHY_PATHS.binding);
  const binding = fileJson(proof.files, P006_TYPOGRAPHY_PATHS.binding);
  const check = fileJson(proof.files, P006_TYPOGRAPHY_PATHS.check);
  const source = proof.sourceCatalog;
  demand(source.sourceSha256 === SOURCE_SHA && proof.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    Array.isArray(source.unparsedTags) && source.unparsedTags.length === 0, 'actual source typography catalog');
  demand(binding.schemaVersion === 1 && binding.animationId === ID && binding.placementId === ID &&
    binding.sourceSwfSha256 === SOURCE_SHA && binding.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    binding.sourceRelativePath === PHYSICAL_SOURCE_PINS.source.path && binding.preparationOnly === false &&
    Array.isArray(binding.unresolved) && binding.unresolved.length === 0, 'completed source-bound typography binding');
  demand(check.schemaVersion === 1 && check.kind === 'g678-lesson-typography-check-v1' &&
    check.animationId === ID && check.placementId === ID && check.sourceSwfSha256 === SOURCE_SHA &&
    check.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    check.bindingSha256 === digest(bindingFile.bytes), 'matching typography check/binding identity');
  demand(Number.isFinite(Date.parse(check.checkedAt)) && Date.parse(check.checkedAt) <= now + 1000,
    'valid dated typography check');
  demand(Object.keys(check.checks ?? {}).length === P006_TYPOGRAPHY_CHECKS.length &&
    P006_TYPOGRAPHY_CHECKS.every(name => check.checks[name] === 'passed'), 'all twelve typography technical checks');
  for (const document of [binding, check]) demand(document.languagePolicy?.en === 'source' &&
    document.languagePolicy?.es === 'source-fallback', 'explicit source/Spanish-fallback policy');
  for (const name of ['humanReviewed', 'ownerAccepted', 'originalRuntimeAccepted',
    'audioAccepted', 'strictComplete', 'published']) demand(check[name] === false, `independent pending gate: ${name}`);
  demand(check.currentJavaScriptRegistrationEffect === 'none' && check.strictCompletionEffect === 'none' &&
    check.publicationEffect === 'none', 'technical evidence has no independent acceptance effect');
  const artifacts = referenceMap(check.artifacts, 'technical artifact');
  for (const [relative, expected] of artifacts) demand(samePin(proof.files.get(relative)?.pin, expected),
    `technical artifact changed: ${relative}`);
  demand(check.receipt && samePin(proof.files.get(check.receipt.path)?.pin, check.receipt) &&
    samePin(artifacts.get(check.receipt.path), check.receipt), 'exact dated technical receipt');
  const receipt = fileJson(proof.files, check.receipt.path);
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p006-technical-typography-evidence-v1' &&
    receipt.animationId === ID && receipt.placementId === ID && receipt.sourceSwfSha256 === SOURCE_SHA &&
    receipt.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA && receipt.checkedAt === check.checkedAt &&
    JSON.stringify(receipt.checks) === JSON.stringify(check.checks), 'receipt/check technical agreement');
  const sourceRisks = new Set((source.risks ?? []).map(item => item.kind));
  demand(sourceRisks.size === 5 && Array.isArray(check.resolvedSourceRisks) &&
    sourceRisks.size === new Set(check.resolvedSourceRisks).size &&
    [...sourceRisks].every(risk => check.resolvedSourceRisks.includes(risk)), 'complete source-risk dispositions');
  const resolutions = new Map((check.sourceRiskResolutions ?? []).map(item => [item.kind, item]));
  for (const risk of sourceRisks) {
    const resolution = resolutions.get(risk);
    demand(resolution?.disposition?.trim() && Array.isArray(resolution.artifactPaths) &&
      resolution.artifactPaths.length > 0 && resolution.artifactPaths.every(relative => artifacts.has(relative)),
    `hash-bound source-risk disposition: ${risk}`);
  }
  const implementation = referenceMap(binding.implementation?.files, 'dated implementation');
  const checkedImplementation = referenceMap(check.checkedImplementationFiles, 'checked implementation');
  demand(implementation.size === checkedImplementation.size && [...implementation].every(([relative, pin]) =>
    samePin(checkedImplementation.get(relative), pin)), 'dated checked implementation agreement');
  for (const [relative, expected] of implementation) {
    if (P006_ADMISSION_WIRING_PATHS.includes(relative) || P006_EXCLUDED_FREEZE_PATHS.includes(relative)) continue;
    const actual = files.get(relative)?.pin ?? proof.files.get(relative)?.pin;
    if (relative === P006_ADMISSION_PATHS.host && !samePin(actual, expected)) {
      demand(expected.bytes === P006_HOST_DISCLOSURE_PINS.prior.bytes &&
        expected.sha256 === P006_HOST_DISCLOSURE_PINS.prior.sha256 &&
        actual?.bytes === P006_HOST_DISCLOSURE_PINS.reviewed.bytes &&
        actual?.sha256 === P006_HOST_DISCLOSURE_PINS.reviewed.sha256,
      'only the reviewed three host disclosure replacements are permitted');
    } else if (relative === P006_PROXY_SUCCESSOR_PINS.path && !samePin(actual, expected)) {
      demand(expected.bytes === P006_PROXY_SUCCESSOR_PINS.prior.bytes &&
        expected.sha256 === P006_PROXY_SUCCESSOR_PINS.prior.sha256 &&
        actual?.bytes === P006_PROXY_SUCCESSOR_PINS.reviewed.bytes &&
        actual?.sha256 === P006_PROXY_SUCCESSOR_PINS.reviewed.sha256,
      'only the exact reviewed P006 proxy successor resolver is permitted');
    } else if (relative === P006_RETAINED_V1_PRODUCER_PINS.path && !samePin(actual, expected)) {
      demand(expected.bytes === P006_RETAINED_V1_PRODUCER_PINS.prior.bytes &&
        expected.sha256 === P006_RETAINED_V1_PRODUCER_PINS.prior.sha256 &&
        actual?.bytes === P006_RETAINED_V1_PRODUCER_PINS.reviewed.bytes &&
        actual?.sha256 === P006_RETAINED_V1_PRODUCER_PINS.reviewed.sha256,
      'only the exact retained v1 producer is permitted');
    } else demand(samePin(actual, expected), `dated runtime/controller input changed: ${relative}`);
  }
  const integration = fileJson(files, P006_TYPOGRAPHY_PATHS.integration);
  demand(integration.kind === 'g678-lesson-typography-integration-v1' &&
    Array.isArray(integration.baselineEntries) && !integration.baselineEntries.some(entry => entry.key === ID),
  'P006 must remain outside the preexisting typography baseline');
  const shared = referenceMap(integration.sharedFiles, 'shared typography');
  const critical = new Map();
  for (const relative of [...P006_NATIVE_TYPOGRAPHY_PATHS, ...shared.keys()]) {
    const actual = files.get(relative)?.pin;
    demand(actual, `required native/shared typography input: ${relative}`);
    if (relative !== P006_TYPOGRAPHY_PATHS.generator) demand(samePin(implementation.get(relative), actual),
      `source-native typography input changed: ${relative}`);
    if (shared.has(relative)) demand(samePin(shared.get(relative), actual), `shared typography input changed: ${relative}`);
    critical.set(relative, actual);
  }
  demand(files.get(P006_TYPOGRAPHY_PATHS.sourceDisposition).pin.sha256 === SOURCE_DISPOSITION_SHA,
    'exact typography source-role disposition');
  const nativeRuntime = files.get(P006_TYPOGRAPHY_PATHS.runtime).pin;
  const meta = fileJson(files, P006_TYPOGRAPHY_PATHS.runtimeMetadata);
  const manifest = fileJson(files, P006_TYPOGRAPHY_PATHS.exactSuppressionManifest);
  for (const document of [meta, manifest]) demand(document.animationId === ID &&
    document.sourceSwfSha256 === SOURCE_SHA && document.runtimeSha256 === nativeRuntime.sha256 &&
    document.runtimeBytes === nativeRuntime.bytes, 'exact native typography runtime/meta/manifest');
  demand(manifest.kind === 'p006-exact-placement-typography-v1' &&
    manifest.originalCandidate === 'candidate-v2' && manifest.originalRuntimeSha256 === RUNTIME_SHA &&
    manifest.originalRuntimeBytes === 11507597 && manifest.globalRegistry === 'HELP_MATH_P006_TYPOGRAPHY_ASSETS',
  'original Canvas runtime and separate native adapter identity');
  demand(manifest.generator?.sha256 === files.get(P006_TYPOGRAPHY_PATHS.generator).pin.sha256 &&
    manifest.generator?.sourceParserSha256 === files.get(P006_TYPOGRAPHY_PATHS.sourceParser).pin.sha256,
  'exact native adapter generator/parser pins');
  const expectedInstances = {
    title: 'root:65:1:56/sprite-56:1:1:55',
    question: 'root:1:1:53/sprite-53:20:1:46',
    underlines: 'root:1:1:53/sprite-53:19:1:44',
    background: 'root:1:1:53/sprite-53:17:17:42',
  };
  for (const [name, id] of Object.entries(expectedInstances)) demand(manifest.evidence?.[name]?.id === id,
    `exact native suppression instance: ${name}`);
  demand(manifest.evidence?.questionRevealMask?.preserved === true &&
    manifest.drawing?.ordinaryRenderPreservesSourceWrapper === true &&
    manifest.drawing?.sourceMaskAllocationsPreserved === true &&
    manifest.drawing?.nonTextFunctionsModified === false, 'source graphics and question mask preserved');
  demand(Array.isArray(binding.blocks) && binding.blocks.length === 2 &&
    binding.blocks[0].id === 'title' && binding.blocks[0].role === 'title' &&
    binding.blocks[0].instance?.id === expectedInstances.title &&
    JSON.stringify(binding.blocks[0].sourceShapeIds) === '[55]' &&
    binding.blocks[1].id === 'question' && binding.blocks[1].role === 'question' &&
    binding.blocks[1].instance?.id === expectedInstances.question &&
    JSON.stringify(binding.blocks[1].sourceTextIds) === JSON.stringify(
      Array.from({length: 7}, (_, index) => `character-46/run-${index}`)), 'exact source-native title/question blocks');
  return {criticalFiles: [...critical.values()].sort((left, right) => left.path.localeCompare(right.path)),
    sourceCatalogContentSha256: SOURCE_CATALOG_SHA, checkedAt: check.checkedAt};
}

/** Pure packet construction; caller must first verify every supplied physical file. */
export function createAdmissionPlan(files, sourcePins = PHYSICAL_SOURCE_PINS, typographyProof) {
  const pin = file => {
    demand(files.get(file)?.pin, `required dependency: ${file}`);
    return files.get(file).pin;
  };
  for (const [name, expected] of Object.entries(PHYSICAL_SOURCE_PINS))
    demand(JSON.stringify(sourcePins[name]) === JSON.stringify(expected), `exact ${name} pin`);
  for (const file of REQUIRED_WORKSPACE_PATHS) pin(file);
  validateFinalTimeline(files.get(P006_ADMISSION_PATHS.timeline).bytes.toString('utf8'));
  const typography = validateTypographyAdmission(files, typographyProof);
  const runtime = {...pin(P006_ADMISSION_PATHS.candidate), path: P006_ADMISSION_PATHS.runtime};
  demand(runtime.bytes === 11507597 && runtime.sha256 === RUNTIME_SHA, 'canonical v2 runtime');
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js',
    complexityLane: 'behavior-heavy', artifacts: {
      module: pin(P006_ADMISSION_PATHS.module), timeline: pin(P006_ADMISSION_PATHS.timeline), runtime}};
  const packet = {
    schemaVersion: 1, calibrationId: CALIBRATION, scope: 'private-engineering',
    sourceRoot: SOURCE_ROOT, deploymentScope: 'local-only',
    supersedes: P006_SUPERSEDED_ADMISSION,
    preparationState: {
      status: 'admission-reviewed', typographyImplementation: 'source-bound-implemented',
      activationPermitted: true,
      requiredBindingPath: P006_TYPOGRAPHY_PATHS.binding,
      requiredCheckPath: P006_TYPOGRAPHY_PATHS.check,
      requiredDevelopmentCheck: 'npm run check:typography --workspace @helpmath/demos',
      technicalEvidencePolicy: 'Unchanged source/native runtime and controller proof plus explicitly reviewed host-disclosure, proxy-resolver and retained-v1-producer successors are verified before freeze. Current v2 admission wiring is frozen separately. The explicit admission candidate collects new browser evidence; formal host admission requires a new technical receipt, refreshed pair and full current implementation closure.',
      postRegistrationTypographyCheckRequired: true,
      finalizationOrder: 'freeze -> registry -> generated dispatch -> explicit admission candidate browser -> new technical receipt -> typography refresh -> strict formal host and development-check postflight',
      reason: 'Bounded Current-JS technical admission only. Source-native teaching text is implemented; independent acceptance gates remain pending.',
    },
    nativeTypography: {
      runtime: pin(P006_TYPOGRAPHY_PATHS.runtime),
      runtimeMetadata: pin(P006_TYPOGRAPHY_PATHS.runtimeMetadata),
      exactSuppressionManifest: pin(P006_TYPOGRAPHY_PATHS.exactSuppressionManifest),
      sourceDisposition: pin(P006_TYPOGRAPHY_PATHS.sourceDisposition),
      sourceCatalogContentSha256: typography.sourceCatalogContentSha256,
      languagePolicy: {en: 'source', es: 'source-fallback'},
      criticalFiles: typography.criticalFiles,
    },
    predecessor: {calibrationId: 'g678-alg-l12-p003-current-js-v1',
      freezeManifestSha256: pin(P006_ADMISSION_PATHS.predecessor).sha256,
      registeredAnimationCount: 19},
    selectedPages: [{animationId: ID, placementId: ID, assetId: `swf-${SOURCE_SHA}`,
      stableLessonKey: 'shared-alg001-l12', sourceSha256: SOURCE_SHA,
      moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 6,
      sectionCode: 'RW', sectionPageOrdinal: 5, complexityLane: 'behavior-heavy',
      implementationLane: 'compiler-assisted-hybrid',
      laneReason: 'Source-locked composed Canvas with native source-bound title/question, exact instance suppression, maintained glossary hit/lifecycle and continuous-stream-v2 audio. Optional SA is an explicit separate host operation; original-runtime and listening acceptance remain pending.',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
        frameDomain: 'sprite-53', frameCount: 342, livePlaybackEndFrame: 342,
        language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
        audioPlaybackEnabled: true, canvasRenderer: {...runtime,
          url: `/flash-assets/g678-local/${ID}/canvas-renderer.js`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate',
        actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
        audioAcceptance: 'not-established',
        replaySemantics: 'renderer-restart-only-source-behavior-not-established',
        productVisualBehaviorComposite: 'not-established'},
    }],
    glossaryHostBoundary: {sourceButtonCount: 4,
      existingLessonEntryIds: ['coordinate', 'graph', 'equation'],
      supplementalEntryIds: ['inequality'], pageClosePolicy: 'stay-paused; original-host-parity-pending',
      allSourceButtonsMappedToEntries: true, originalHostLookupVerified: false},
    source: sourcePins.source, sourceXml: sourcePins.sourceXml,
    sourceCatalog: pin(P006_ADMISSION_PATHS.sourceCatalog),
    sourceAudit: pin(P006_ADMISSION_PATHS.sourceAudit),
    candidateManifest: pin(P006_ADMISSION_PATHS.candidateManifest),
    sourceGlossary: pin(P006_ADMISSION_PATHS.sourceGlossary),
    glossaryCatalog: pin(P006_ADMISSION_PATHS.glossaryCatalog),
    hostAdapter: pin(P006_ADMISSION_PATHS.host),
    embeddedAudio: {sourceMp3: pin(P006_ADMISSION_PATHS.embeddedMp3),
      receipt: pin(P006_ADMISSION_PATHS.embeddedReceipt), scheduleVersion: 'continuous-stream-v2',
      sourceSha256: AUDIO_SHA, sourceSampleRange: [1673, 624384], timelineStartSample: 3675,
      timelineEndSample: 626386, visualTerminalSample: 626587.5},
    optionalSpanishAudio: {source: sourcePins.spanishAudio,
      intendedRole: 'explicit-spanish-audio-control', spokenLanguageVerified: false,
      automaticLocalePlayback: false, pauseRestartPolicy: 'restart-at-zero',
      returnPolicy: 'retained-main-frame; nonterminal-only'},
    entry,
    integrity: {scope: 'critical-page-and-shared-renderer-playback-dependencies',
      completeTransitiveClosure: false,
      excludedMutableOutputs: P006_EXCLUDED_FREEZE_PATHS,
      files: [...files.values()].filter(value =>
        [...REQUIRED_WORKSPACE_PATHS, ...typography.criticalFiles.map(reference => reference.path)].includes(value.pin.path) &&
        !P006_EXCLUDED_FREEZE_PATHS.includes(value.pin.path))
        .map(value => value.pin).sort((left, right) => left.path.localeCompare(right.path))},
    acceptanceEffects: {authoritativeOriginalRuntime: false, behaviorAccepted: false,
      fidelityAccepted: false, visualFidelityAccepted: false, audioAccepted: false, humanVisualAccepted: false,
      ownerAccepted: false, strictComplete: false, releaseEligible: false,
      released: false, published: false}, productCalibrationPassed: false, scaleOutAuthorized: false,
  };
  const freezeBytes = json(packet);
  const fragment = {calibrationId: CALIBRATION, deploymentScope: 'local-only',
    freezeManifest: P006_ADMISSION_PATHS.freeze, freezeManifestBytes: freezeBytes.length,
    freezeManifestSha256: digest(freezeBytes), entries: [entry]};
  const outputs = [
    {path: P006_ADMISSION_PATHS.runtime, bytes: files.get(P006_ADMISSION_PATHS.candidate).bytes},
    {path: P006_ADMISSION_PATHS.freeze, bytes: freezeBytes},
    {path: P006_ADMISSION_PATHS.fragment, bytes: json(fragment)},
  ];
  return {packet, fragment, outputs};
}

function findPage(value, matches = []) {
  if (value && typeof value === 'object') {
    if (value.animationId === ID && value.placementId === ID) matches.push(value);
    for (const child of Object.values(value)) findPage(child, matches);
  }
  return matches;
}

/** Positive technical artifacts stay read-only inputs. They are intentionally
 * separate from files whose pins enter freeze, including indirect receipt pins. */
export function loadTypographyProof(files, {sourceBytes, root = WORKSPACE}) {
  demand(digest(sourceBytes) === SOURCE_SHA, 'exact typography physical source bytes');
  const sourceCatalog = collectSwfTextSourceCatalog(sourceBytes);
  const sourceCatalogContentSha256 = digest(JSON.stringify(sourceCatalog));
  demand(sourceCatalogContentSha256 === SOURCE_CATALOG_SHA, 'exact typography parsed source content');
  const integration = fileJson(files, P006_TYPOGRAPHY_PATHS.integration);
  for (const [relative, expected] of referenceMap(integration.sharedFiles, 'shared typography')) {
    if (!files.has(relative)) files.set(relative, stableFile(root, relative, expected));
    else demand(samePin(files.get(relative).pin, expected), `shared typography input changed: ${relative}`);
  }
  const proofFiles = new Map();
  for (const relative of [P006_TYPOGRAPHY_PATHS.binding, P006_TYPOGRAPHY_PATHS.check])
    proofFiles.set(relative, stableFile(root, relative));
  const check = fileJson(proofFiles, P006_TYPOGRAPHY_PATHS.check);
  const binding = fileJson(proofFiles, P006_TYPOGRAPHY_PATHS.binding);
  for (const references of [check.artifacts, binding.implementation?.files]) {
    for (const relative of referenceMap(references, 'dated proof input').keys())
      if (!proofFiles.has(relative)) proofFiles.set(relative, files.get(relative) ?? stableFile(root, relative));
  }
  return {files: proofFiles, sourceCatalog, sourceCatalogContentSha256};
}

function readInputs() {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV && !process.env.VERCEL,
    'local engineering environment');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT, 'exact AWS source-root opt-in');
  for (const root of [WORKSPACE, SOURCE_ROOT, GLOSSARY_ROOT]) physicalDirectory(root);
  const files = new Map(REQUIRED_WORKSPACE_PATHS.map(file =>
    [file, stableFile(WORKSPACE, file, FIXED_WORKSPACE_PINS[file])]));
  const integration = fileJson(files, P006_TYPOGRAPHY_PATHS.integration);
  for (const [relative, expected] of referenceMap(integration.sharedFiles, 'shared typography'))
    if (!files.has(relative)) files.set(relative, stableFile(WORKSPACE, relative, expected));
  const external = Object.values(PHYSICAL_SOURCE_PINS).map(pin => stableFile(SOURCE_ROOT, pin.path, pin));
  for (const pin of [
    {path: 'L1KTE01.xml', bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
    {path: 'L1KTS01.xml', bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
  ]) external.push(stableFile(GLOSSARY_ROOT, pin.path, pin));
  const readJson = file => JSON.parse(files.get(file).bytes.toString('utf8'));
  const page = findPage(readJson(P006_ADMISSION_PATHS.sourceCatalog));
  demand(page.length === 1 && page[0].globalOrdinal === 6 && page[0].sectionPageOrdinal === 5 &&
    page[0].moduleCode === 'ALG001' && page[0].lessonNumber === 12 &&
    page[0].sourceSha256 === SOURCE_SHA && page[0].reference === 'RW/L12RW06.swf', 'exact catalog placement');
  const candidate = readJson(P006_ADMISSION_PATHS.candidateManifest);
  demand(candidate.animationId === ID && candidate.sourceSha256 === SOURCE_SHA &&
    candidate.runtimeSha256 === RUNTIME_SHA && candidate.runtimeBytes === 11507597 &&
    candidate.registered === false && candidate.originalRuntimeVerified === false &&
    candidate.audioAccepted === false && candidate.strictComplete === false, 'candidate identity/gates');
  const receipt = readJson(P006_ADMISSION_PATHS.embeddedReceipt);
  demand(receipt.animationId === ID && receipt.sourceSwf?.sha256 === SOURCE_SHA &&
    receipt.extraction?.sha256 === AUDIO_SHA && receipt.extraction?.bytes === 140920, 'embedded receipt');
  validateFinalTimeline(files.get(P006_ADMISSION_PATHS.timeline).bytes.toString('utf8'));
  const registry = readJson(P006_ADMISSION_PATHS.registry);
  demand(registry.schemaVersion === 2 && registry.registryScope === 'private-engineering' &&
    Array.isArray(registry.calibrations), 'registry scope');
  const predecessor = registry.calibrations.filter(value =>
    value.calibrationId === 'g678-alg-l12-p003-current-js-v1');
  demand(predecessor.length === 1 && predecessor[0].deploymentScope === 'local-only' &&
    predecessor[0].freezeManifestSha256 === FIXED_WORKSPACE_PINS[P006_ADMISSION_PATHS.predecessor].sha256,
  'registered P003 predecessor');
  const keys = registry.calibrations.flatMap(value => value.entries.map(entry => entry.key));
  demand(new Set(keys).size === keys.length, 'unique registry placements');
  const lesson = keys.filter(key => key.startsWith('shared-alg001-l12-'));
  demand(lesson.length === (keys.includes(ID) ? 20 : 19) &&
    !keys.includes('shared-alg001-l12-p005'), 'unchanged 19-page predecessor');
  const typographyProof = loadTypographyProof(files, {sourceBytes: external[0].bytes});
  const supersededFiles = new Map();
  if (registry.calibrations.some(value => value.calibrationId === P006_SUPERSEDED_ADMISSION.calibrationId)) {
    for (const pin of [P006_SUPERSEDED_ADMISSION.freeze, P006_SUPERSEDED_ADMISSION.fragment])
      supersededFiles.set(pin.path, stableFile(WORKSPACE, pin.path, pin));
  }
  const registration = validateP006RegistrationForPreparation(registry, supersededFiles);
  return {files, external, typographyProof, supersededFiles, ...registration};
}

export function parseArguments(argv) {
  demand(argv.length <= 1 && (argv.length === 0 ||
    ['--dry-run', '--check', '--write'].includes(argv[0])),
  'Usage: node scripts/prepare-g678-alg-l12-p006-current-js-v2.mjs [--dry-run|--check|--write]');
  return argv[0] ?? '--dry-run';
}

function reverify(inputs) {
  for (const file of [...inputs.files.values(), ...inputs.external,
    ...inputs.typographyProof.files.values(), ...inputs.supersededFiles.values()])
    stableFile(file.root, file.pin.path, file.pin);
}

export function main(argv = process.argv.slice(2)) {
  const mode = parseArguments(argv);
  const inputs = readInputs();
  const plan = createAdmissionPlan(inputs.files, PHYSICAL_SOURCE_PINS, inputs.typographyProof);
  const exists = plan.outputs.map(output => fs.existsSync(relativeFile(WORKSPACE, output.path)));
  demand(exists.every(Boolean) || exists.every(value => !value), 'partial output set; preserve and inspect it');
  if (mode === '--write') {
    demand((!inputs.registered || inputs.supersedingExactV1) && exists.every(value => !value),
      'never overwrite/rewrite an existing v2 admission; only exact v1 may precede it');
    reverify(inputs);
    const created = [];
    try {
      for (const output of plan.outputs) {
        const file = relativeFile(WORKSPACE, output.path);
        fs.mkdirSync(path.dirname(file), {recursive: true});
        physicalDirectory(path.dirname(file));
        fs.writeFileSync(file, output.bytes, {flag: 'wx', mode: 0o644});
        created.push(file);
      }
      reverify(inputs);
    } catch (error) {
      // Remove only files this invocation created. Sources and earlier artifacts are untouched.
      for (const file of created.reverse()) fs.unlinkSync(file);
      throw error;
    }
  } else if (mode === '--check' && exists.every(Boolean)) {
    for (const output of plan.outputs) stableFile(WORKSPACE, output.path,
      {bytes: output.bytes.length, sha256: digest(output.bytes)});
  }
  reverify(inputs);
  const report = {mode, status: mode === '--write' ? 'ADMISSION_PREPARED_NOT_REGISTERED' :
    mode === '--check' && exists.every(Boolean) ? 'EXACT_ADMISSION_OUTPUTS_VERIFIED' : 'INPUTS_VERIFIED_NOT_WRITTEN',
  animationId: ID, registryAlreadyContainsPlacement: inputs.registered,
  supersedingExactV1: inputs.supersedingExactV1,
  outputs: plan.outputs.map(output => ({path: output.path,
    bytes: output.bytes.length, sha256: digest(output.bytes)})),
  preparationState: plan.packet.preparationState,
  acceptanceEffects: plan.packet.acceptanceEffects};
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
