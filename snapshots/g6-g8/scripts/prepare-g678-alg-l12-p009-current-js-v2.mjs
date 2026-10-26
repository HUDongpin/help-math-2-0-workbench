#!/usr/bin/env node
// Read-only P009 Current-JS admission preparation. A finalized typography pair
// is technical input; registration, original-runtime and acceptance stay separate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import ts from 'typescript';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {collectP005TypographyImportClosure} from './prepare-g678-alg-l12-p005-typography-binding.mts';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P009_ID = 'shared-alg001-l12-p009';
export const P009_CALIBRATION = 'g678-alg-l12-p009-current-js-v2';
export const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const GLOSSARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const ID = P009_ID, CALIBRATION = P009_CALIBRATION, WORK = `migrations/${ID}`;
export const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
export const NATIVE_RUNTIME_SHA = 'a550205ed3e43df256798a6cac5668adf87bf95484c5664e49534f7de99c126d';
export const SOURCE_CATALOG_SHA = '37a2c8162c7e13a368f90bee7fa0c7a3df788ad305dc41bad6c08214e24754e6';
export const AUDIO_SHA = '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e';
const SHA = /^[a-f0-9]{64}$/u;
const PRODUCER = 'scripts/prepare-g678-alg-l12-p009-current-js-v2.mjs';
const SOURCE_INVENTORY_SHA = '362c4376b4c8bc2af9660ea197857d681c135827aae2e9afd525e70c38925938';
const SOURCE_REPORT_SHA = '1cd0aecc19a96fc4548d191ecda20666b466c64121f28b8eb45513357e82c3ec';
export const P009_ADMISSION_PATHS = Object.freeze({
  freeze: `catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  fragment: `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`,
  module: `packages/demos/src/modules/${ID}.tsx`,
  timeline: `packages/demos/src/timelines/${ID}.ts`,
  preparedRuntime: `work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
  runtime: `${WORK}/typography-v1/canvas-renderer.js`,
  metadata: `${WORK}/typography-v1/runtime-meta.json`,
  host: 'apps/web/components/g678-alg-l12-p009-host-lesson.tsx',
  reader: 'apps/web/lib/g678-alg-l12-p009-current-js-v2.server.ts',
  aggregate: 'apps/web/lib/g678-current-js-p009-successor-v2.server.ts',
  sourceCatalog: `${WORK}/audit/source-text-catalog.json`,
  sourceAudit: `${WORK}/evidence/SOURCE_AUDIT_2026-09-27.md`,
  sourceGlossary: `${WORK}/audit/source-keyterms.json`,
  sourcePlacement: `${WORK}/audit/source-placement.json`,
  embeddedMp3: `${WORK}/audit/source-stream.mp3`,
  sourceBlocks: `${WORK}/audit/source-stream-blocks.json`,
  analysis: `${WORK}/audio-analysis-v1/analysis.json`,
});
export const P009_TYPOGRAPHY_PATHS = Object.freeze({
  binding: `catalog/typography-v1/g678-page-bindings/${ID}.json`,
  check: `catalog/typography-v1/g678-checks/${ID}.json`,
  integration: 'catalog/typography-v1/g678-integration.json',
  runtime: P009_ADMISSION_PATHS.runtime,
  runtimeMetadata: P009_ADMISSION_PATHS.metadata,
  sourceInventory: `${WORK}/audit/typography-source-inventory-v1.json`,
  sourceDisposition: `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`,
});
export const P009_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
export const P009_SOURCE_RISKS = Object.freeze([
  'shape-text-unclassified', 'button-runtime-state-and-actions-not-interpreted',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved',
]);
export const P009_GLOSSARY_KEYS = Object.freeze([
  'Ordered pair', 'Pair', 'Locate', 'Point', 'Coordinate plane/Cartesian Plane',
  'Coordinate', 'X-coordinate', 'Y-coordinate',
]);
// This exact set is also used by the maintained reader; sharedInputs is a union.
export const P009_NATIVE_TYPOGRAPHY_PATHS = Object.freeze([
  'packages/demos/src/alg-l12-p009-typography.ts',
  'packages/demos/src/alg-l12-p009-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p009-typography-asset.ts',
  'packages/demos/src/alg-l12-p009-typography.css',
  'packages/demos/src/generated/alg-l12-p009-text-data.ts',
  P009_TYPOGRAPHY_PATHS.runtime, P009_TYPOGRAPHY_PATHS.runtimeMetadata,
  P009_ADMISSION_PATHS.sourceCatalog, P009_TYPOGRAPHY_PATHS.sourceInventory,
  P009_TYPOGRAPHY_PATHS.sourceDisposition,
  'scripts/build-g678-alg-l12-p009-typography.mjs',
  'scripts/build-g678-alg-l12-p009-text-data.mjs',
  'scripts/lib/swf-text-source-catalog.mjs',
]);
// Lesson availability changes when admission is wired into the product. Its
// actual bytes are required by live typography proof, never by this freeze.
export const P009_MUTABLE_INTEGRATION_PATHS = Object.freeze([
  'apps/web/lib/learning-lesson-availability.server.ts',
]);
export const P009_EXCLUDED_FREEZE_PATHS = Object.freeze([
  'packages/demos/private-current-js-registry.json',
  'packages/demos/src/registry.generated.ts',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  P009_TYPOGRAPHY_PATHS.binding, P009_TYPOGRAPHY_PATHS.check,
  P009_ADMISSION_PATHS.preparedRuntime,
  P009_ADMISSION_PATHS.freeze, P009_ADMISSION_PATHS.fragment,
  ...P009_MUTABLE_INTEGRATION_PATHS,
]);
export const P009_SUPERSEDED_ADMISSION = Object.freeze({
  calibrationId: 'g678-alg-l12-p009-current-js-v1',
  failure: 'formal-reader-required-typography-producer-absent-from-frozen-inputs',
  formalAccepted: false,
  freezeManifest: Object.freeze({path: 'catalog/product-bridge-calibrations/g678-alg-l12-p009-current-js-v1.json',
    bytes: 69313, sha256: '3fbae4ef52db4ef0a7b2e1181494e4b09ee5a1d7fcdd92108bb169766fe9d620'}),
  fragment: Object.freeze({path: 'catalog/product-bridge-calibrations/g678-alg-l12-p009-current-js-v1.fragment.json',
    bytes: 1274, sha256: 'f8a138ffa012d78d444e1427817b3344a0d8135cea56656de3516f788cd35a7d'}),
  runtime: Object.freeze({path: 'work/g678-shared-page-factory/g678-alg-l12-p009-current-js-v1/members/shared-alg001-l12-p009/canvas-renderer.js',
    bytes: 4619022, sha256: NATIVE_RUNTIME_SHA}),
});
export const P009_PREDECESSOR = Object.freeze({
  calibrationId: 'g678-alg-l12-p006-current-js-v2',
  freezeManifest: Object.freeze({path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v2.json',
    bytes: 39396, sha256: 'cee20258a4af1811c3142359a35fdc76d202537da088d9c15c3556547f6a3b33'}),
  registeredAnimationCount: 20, pageCount: 52, glossaryCount: 35,
});
export const PHYSICAL_SOURCE_PINS = Object.freeze({
  source: Object.freeze({path: 'G6-G8-shared/ALG001/L12/VB/L12VB04.swf', bytes: 165405, sha256: SOURCE_SHA}),
  sourceXml: Object.freeze({path: 'G6-G8-shared/ALG001/L12/index.xml', bytes: 11927,
    sha256: '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'}),
  spanishAudio: Object.freeze({path: 'G6-G8-shared/ALG001/L12/SA/L12VB04.mp3', bytes: 325584,
    sha256: '3ccbe37ecfabff0506ef3daafc7db4b9fd8b770f0baefd6a70efeaaa27ca6fd4'}),
});
export const P009_OPTIONAL_SA_PATHS = Object.freeze({
  report: `${WORK}/evidence/SA_HOST_DISPOSITION_2026-09-27.md`,
  analysis: 'output/p009-sa-source-20260927-v1/analysis.json',
  receipt: 'output/p009-sa-source-20260927-v1/technical-receipt.json',
  controller: 'packages/demos/src/alg-l12-p009-spanish-audio.ts',
  controllerTest: 'packages/demos/tests/alg-l12-p009-spanish-audio.test.ts',
  server: 'apps/web/lib/g678-alg-l12-p009-spanish-audio.server.ts',
  serverTest: 'apps/web/tests/g678-alg-l12-p009-spanish-audio.server-test.ts',
  route: `apps/web/app/flash-assets/g678-local/${ID}/spanish-audio.mp3/route.ts`,
});
export const P009_OPTIONAL_SA_PINS = Object.freeze({
  report: Object.freeze({path: P009_OPTIONAL_SA_PATHS.report, bytes: 13734,
    sha256: 'fe486452d84efa8ea5609aedf5e94d43cb5d80d27a3bd1a9e48eb6e5ca08e861'}),
  analysis: Object.freeze({path: P009_OPTIONAL_SA_PATHS.analysis, bytes: 14648,
    sha256: '8599f24913d1b6c39f3431d46361ce6ee725093f354456cafd09715315b276b0'}),
  receipt: Object.freeze({path: P009_OPTIONAL_SA_PATHS.receipt, bytes: 16646,
    sha256: '928be76fda517883b6b96f9d1e032543708f7a0b756f7048a6bbf2247f302cc6'}),
});
export const PHYSICAL_DICTIONARY_PINS = Object.freeze([
  Object.freeze({path: 'L1KTE01.xml', bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'}),
  Object.freeze({path: 'L1KTS01.xml', bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'}),
]);
export const ACCEPTANCE_KEYS = Object.freeze([
  'authoritativeOriginalRuntime', 'fidelityAccepted', 'audioAccepted',
  'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published',
]);
export const REQUIRED_WORKSPACE_PATHS = Object.freeze([...new Set([
  ...Object.values(P009_ADMISSION_PATHS).filter(p => ![P009_ADMISSION_PATHS.freeze, P009_ADMISSION_PATHS.fragment,
    P009_ADMISSION_PATHS.preparedRuntime].includes(p)),
  ...P009_NATIVE_TYPOGRAPHY_PATHS, P009_TYPOGRAPHY_PATHS.integration,
  ...Object.values(P009_OPTIONAL_SA_PATHS),
  P009_SUPERSEDED_ADMISSION.freezeManifest.path, P009_SUPERSEDED_ADMISSION.fragment.path,
  P009_SUPERSEDED_ADMISSION.runtime.path,
  P009_PREDECESSOR.freezeManifest.path,
  'packages/demos/src/alg-l12-p009-visual-clock.ts',
  'packages/demos/src/alg-l12-p009-glossary.ts',
  'packages/demos/src/alg-l12-p009-audio-schedule.ts',
  'packages/demos/src/alg-l12-p009-embedded-audio.ts',
  'packages/demos/src/source-static-canvas-candidate.tsx',
  'apps/web/lib/g678-alg-l12-p009-typography.server.ts',
  'apps/web/lib/g678-alg-l12-p009-glossary.server.ts',
  'apps/web/lib/g678-alg-l12-p009-source-audio.server.ts',
  'apps/web/lib/g678-alg-l12-p009-host.production-stub.tsx',
  'scripts/prepare-g678-alg-l12-p009-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p009-typography-binding.test.mts',
  'apps/web/tests/g678-alg-l12-p009-current-js-v2.server-test.ts',
  'apps/web/tests/g678-alg-l12-p009-typography.server-test.ts',
  'apps/web/tests/g678-alg-l12-p009-source-audio.server-test.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/source-audio.mp3/route.ts`,
  PRODUCER, 'scripts/prepare-g678-alg-l12-p009-current-js-v2.test.mjs',
  'package.json', 'package-lock.json', 'apps/web/package.json', 'apps/web/next.config.ts',
  'apps/web/tsconfig.json', 'packages/demos/package.json', 'packages/demos/tsconfig.json',
])].sort());

export const digest = value => createHash('sha256').update(value).digest('hex');
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sortedPins = pins => [...pins].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
function demand(value, reason) {assert(value, `P009_ADMISSION_PREPARE_INVALID: ${reason}`);}
function relativePath(relative) {
  demand(typeof relative === 'string' && relative && !path.isAbsolute(relative) && !relative.includes('\\') &&
    relative.split('/').every(p => p && p !== '..' && p !== '.'), 'ordinary workspace-relative path');
}
function physicalDirectory(root) {
  demand(path.isAbsolute(root) && fs.lstatSync(root).isDirectory() && fs.realpathSync(root) === root, 'physical directory');
}
export function stableFile(root, relative, expected, io = fs) {
  relativePath(relative); const file = path.join(root, relative);
  demand(io.realpathSync(file) === file, `physical file: ${relative}`);
  const before = io.lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `single-link ordinary file: ${relative}`);
  const bytes = io.readFileSync(file), after = io.lstatSync(file, {bigint: true});
  demand(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key => before[key] === after[key]) &&
    after.size === BigInt(bytes.length) && io.realpathSync(file) === file, `stable read: ${relative}`);
  const pin = {path: relative, bytes: bytes.length, sha256: digest(bytes)};
  if (expected) demand(isDeepStrictEqual(pin, expected), `exact file pin: ${relative}`);
  return {bytes, pin};
}
function referencesMap(references, label) {
  demand(Array.isArray(references) && references.length > 0, `${label} references`);
  const result = new Map();
  for (const pin of references) {
    relativePath(pin?.path);
    demand(SHA.test(pin.sha256 ?? '') && Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 &&
      !result.has(pin.path), `${label} exact nonduplicate pin`);
    result.set(pin.path, {path: pin.path, bytes: pin.bytes, sha256: pin.sha256});
  }
  return result;
}
function fileJson(files, relative) {
  demand(files.get(relative)?.bytes, `required document: ${relative}`);
  return JSON.parse(files.get(relative).bytes.toString('utf8'));
}
function excluded(relative) {
  return P009_EXCLUDED_FREEZE_PATHS.includes(relative) ||
    /^packages\/demos\/src\/registry(?:\.[^/]*)?\.generated\.[cm]?[jt]s$/u.test(relative) ||
    /^catalog\/typography-v1\/g678-(?:page-bindings|checks)\//u.test(relative);
}

/** Static declarations only. Never evaluate imported TS or trust comment flags. */
function sourceAst(text, name) {
  const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  demand(source.parseDiagnostics.length === 0, `syntax: ${name}`);
  return source;
}
const unwrap = value => {
  while (value && (ts.isAsExpression(value) || ts.isSatisfiesExpression(value) || ts.isParenthesizedExpression(value))) value = value.expression;
  return value;
};
function objectProperties(expression) {
  expression = unwrap(expression);
  demand(expression && ts.isObjectLiteralExpression(expression), 'static object declaration');
  const map = new Map();
  for (const property of expression.properties) {
    demand(ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      !map.has(property.name.text), 'nonduplicate ordinary object properties');
    map.set(property.name.text, property.initializer);
  }
  return map;
}
function declarationObject(source, name) {
  const declarations = source.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations])
    .filter(d => ts.isIdentifier(d.name) && d.name.text === name);
  demand(declarations.length === 1, `single declaration: ${name}`);
  const call = unwrap(declarations[0].initializer);
  demand(ts.isCallExpression(call) && call.expression.getText(source) === 'Object.freeze' && call.arguments.length === 1, `frozen declaration: ${name}`);
  return objectProperties(call.arguments[0]);
}
function literal(expression) {
  expression = unwrap(expression);
  if (expression?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression?.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (expression && ts.isStringLiteral(expression)) return expression.text;
  if (expression && ts.isNumericLiteral(expression)) return Number(expression.text);
  return undefined;
}
function propertyLiteral(map, key, expected) {demand(literal(map.get(key)) === expected, `declaration ${key}=${expected}`);}
export function validateFinalTimeline(text) {
  const ast = sourceAst(text, 'p009-timeline.ts');
  const source = declarationObject(ast, 'SHARED_ALG001_L12_P009_SOURCE');
  for (const [key, expected] of Object.entries({deploymentScope: 'local-only',
    registrationAuthority: 'private-current-js-registry', productCalibrationPassed: false,
    audioPlaybackEnabled: true, audioSchedule: 'continuous-stream-v1-modern-terminal-hold',
    sourceTerminalStop: false, spanishTextPolicy: 'english-source-fallback-translation-pending', strictAcceptanceEffect: 'none'}))
    propertyLiteral(source, key, expected);
  demand(!source.has('currentJavaScriptRegistered'), 'registration comes from actual registry, not a Boolean');
  const identity = objectProperties(source.get('source'));
  propertyLiteral(identity, 'path', PHYSICAL_SOURCE_PINS.source.path);
  demand(identity.get('sha256')?.getText(ast) === 'meta.sourceSha256', 'source SHA derives from verified metadata');
  const config = declarationObject(ast, 'SHARED_ALG001_L12_P009_CONFIG');
  for (const [key, expected] of Object.entries({animationId: ID, title: 'Reviewing Ordered Pairs', fps: 12,
    rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: 'sprite-62', mainFrameCount: 394,
    livePlaybackEndFrame: 394, playbackMode: 'once', strictCaptureIdentity: true, showEngineeringDisclosure: false,
    assetSource: `/flash-assets/g678-local/${ID}/typography-renderer.js`})) propertyLiteral(config, key, expected);
  demand(config.get('sourceSwfSha256')?.getText(ast) === 'meta.sourceSha256' &&
    config.get('assetSha256')?.getText(ast) === 'meta.runtimeSha256', 'metadata-bound native assets');
  const stage = objectProperties(config.get('stage'));
  propertyLiteral(stage, 'width', 800); propertyLiteral(stage, 'height', 600); propertyLiteral(stage, 'backgroundColor', '#b8d8f7');
  for (const key of ['companionDomains', 'blockedFrameRanges']) {
    const value = unwrap(config.get(key)); demand(ts.isArrayLiteralExpression(value) && value.elements.length === 0, `empty ${key}`);
  }
  return true;
}
export function validateCanonicalModule(text) {
  const ast = sourceAst(text, 'p009-module.tsx');
  const defaults = ast.statements.filter(ts.isExportAssignment);
  demand(defaults.length === 1, 'one canonical default export');
  const call = unwrap(defaults[0].expression);
  demand(ts.isCallExpression(call) && call.expression.getText(ast) === 'Object.freeze', 'canonical frozen default');
  const properties = call.arguments[0]?.properties;
  demand(properties && properties.length === 4 && ts.isSpreadAssignment(properties[0]) &&
    properties[0].expression.getText(ast) === 'candidate.module', 'maintained metadata factory envelope');
  const named = new Map(properties.slice(1).map(p => {
    demand(ts.isPropertyAssignment(p) && ts.isIdentifier(p.name), 'canonical native module properties'); return [p.name.text, p.initializer];
  }));
  demand(named.get('Renderer')?.getText(ast) === 'P009TypographyRenderer', 'explicit native 2x renderer');
  propertyLiteral(named, 'reducedMotionFrame', 394);
  const presentation = unwrap(named.get('textPresentation'));
  demand(ts.isCallExpression(presentation) && presentation.expression.getText(ast) === 'Object.freeze', 'native presentation envelope');
  const presentationProperties = objectProperties(presentation.arguments[0]);
  demand(presentationProperties.get('binding')?.getText(ast) === 'P009_TEXT_BINDING' &&
    presentationProperties.get('Renderer')?.getText(ast) === 'P009TypographyRenderer', 'same source-native presentation binding/renderer');
  propertyLiteral(presentationProperties, 'schemaVersion', 1);
  const imports = ast.statements.filter(ts.isImportDeclaration);
  demand(imports.some(d => d.moduleSpecifier.text === '../alg-l12-p009-typography-renderer') &&
    imports.some(d => d.moduleSpecifier.text === '../timelines/shared-alg001-l12-p009'), 'canonical source-bound imports');
  return true;
}
export function validateAudioSchedule(text) {
  const ast = sourceAst(text, 'p009-audio-schedule.ts');
  const source = declarationObject(ast, 'P009_AUDIO_SOURCE');
  for (const [key, expected] of Object.entries({sha256: AUDIO_SHA, bytes: 162890, sampleRate: 22050,
    numberOfChannels: 1, decodedSamples: 721728})) propertyLiteral(source, key, expected);
  const schedule = declarationObject(ast, 'P009_AUDIO_SCHEDULE');
  for (const [key, expected] of Object.entries({status: 'source-derived-continuous-candidate', sourceSha256: SOURCE_SHA,
    fps: 12, frameCount: 394, firstAudioFrame: 2, timelineStartSample: 1837.5, sourceStartSample: 1673,
    audioEndTimelineSample: 721892.5, terminalTimelineSample: 722137.5,
    terminalPolicy: 'modern-hold-last-authored-frame', sourceTerminalStop: false,
    originalRuntime: false, synchronizationAccepted: false, listeningAccepted: false, registered: false})) propertyLiteral(schedule, key, expected);
  demand(schedule.get('audioSha256')?.getText(ast) === 'P009_AUDIO_SOURCE.sha256' &&
    schedule.get('sourceEndSample')?.getText(ast) === 'P009_AUDIO_SOURCE.decodedSamples' &&
    schedule.get('samplesPerFrame')?.getText(ast) === 'P009_AUDIO_SOURCE.sampleRate / 12', 'source-derived natural-rate schedule');
  return true;
}
export function validateSpanishAudioSource(text) {
  const ast = sourceAst(text, 'p009-spanish-audio.ts');
  const source = declarationObject(ast, 'P009_SPANISH_AUDIO_SOURCE');
  for (const [key, expected] of Object.entries({sha256: PHYSICAL_SOURCE_PINS.spanishAudio.sha256,
    bytes: 325584, sampleRate: 48000, numberOfChannels: 1, decodedSamples: 1116288,
    decodedDurationSeconds: 23.256, url: `/flash-assets/g678-local/${ID}/spanish-audio.mp3`}))
    propertyLiteral(source, key, expected);
  return true;
}

/** Read the actual reader's declarative mandatory paths without executing it.
 * Only literal values, arrays, objects, templates and Object.freeze are allowed.
 * This cross-tool check prevents a reader seed from disappearing from a plan. */
export function readerRequiredFrozenPaths(text) {
  const ast = sourceAst(text, 'p009-current-js-v2-reader.ts'), declarations = new Map();
  for (const statement of ast.statements.filter(ts.isVariableStatement))
    for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) {
      demand(!declarations.has(declaration.name.text), 'unique reader top-level declaration');
      declarations.set(declaration.name.text, declaration.initializer);
    }
  const visiting = new Set();
  function resolve(expression) {
    expression = unwrap(expression);
    demand(expression, 'required static reader declaration');
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
    if (ts.isNumericLiteral(expression)) return Number(expression.text);
    if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (expression.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isIdentifier(expression)) {
      demand(declarations.has(expression.text) && !visiting.has(expression.text), `static reader path dependency: ${expression.text}`);
      visiting.add(expression.text);
      const value = resolve(declarations.get(expression.text)); visiting.delete(expression.text); return value;
    }
    if (ts.isTemplateExpression(expression)) {
      let value = expression.head.text;
      for (const span of expression.templateSpans) {
        const part = resolve(span.expression); demand(typeof part === 'string', 'reader path template string');
        value += part + span.literal.text;
      }
      return value;
    }
    if (ts.isCallExpression(expression)) {
      demand(expression.expression.getText(ast) === 'Object.freeze' && expression.arguments.length === 1,
        'reader paths use a static frozen declaration');
      return resolve(expression.arguments[0]);
    }
    if (ts.isArrayLiteralExpression(expression)) {
      const values = [];
      for (const element of expression.elements) {
        if (ts.isSpreadElement(element)) {
          const value = resolve(element.expression); demand(Array.isArray(value), 'reader path array spread'); values.push(...value);
        } else values.push(resolve(element));
      }
      return values;
    }
    if (ts.isObjectLiteralExpression(expression))
      return Object.fromEntries([...objectProperties(expression)].map(([key, value]) => [key, resolve(value)]));
    if (ts.isPropertyAccessExpression(expression)) {
      const value = resolve(expression.expression);
      demand(value && Object.hasOwn(value, expression.name.text), 'reader path property'); return value[expression.name.text];
    }
    demand(false, 'reader mandatory path expression is not static');
  }
  const paths = resolve(declarations.get('ALG_L12_P009_ADMISSION_INPUT_PATHS'));
  demand(Array.isArray(paths) && paths.length > 0 && new Set(paths).size === paths.length, 'actual unique reader mandatory paths');
  for (const relative of paths) relativePath(relative);
  return [...paths].sort();
}
export function validateFrozenReaderCoverage(packet, readerText) {
  const required = readerRequiredFrozenPaths(readerText);
  const frozen = referencesMap(packet.integrity.files, 'frozen reader inputs');
  for (const relative of required)
    demand(!excluded(relative) && frozen.has(relative), `actual reader-required frozen input: ${relative}`);
  for (const relative of P009_MUTABLE_INTEGRATION_PATHS)
    demand(!frozen.has(relative), `mutable integration is live-proof-only: ${relative}`);
  return required;
}

/** Preserved source observations are separate from later browser/UI results. */
export function validateOptionalSpanishSource(files) {
  for (const pin of Object.values(P009_OPTIONAL_SA_PINS))
    demand(isDeepStrictEqual(files.get(pin.path)?.pin, pin), `exact P009 optional SA source evidence: ${pin.path}`);
  const analysis = fileJson(files, P009_OPTIONAL_SA_PATHS.analysis);
  demand(analysis.schemaVersion === 1 && analysis.kind === 'p009-optional-sa-source-observation-v1' &&
    analysis.animationId === ID && analysis.source.mainDomain === 'sprite-62' &&
    analysis.source.mainFrameCount === 394 && analysis.source.mainActionTagCount === 0 &&
    analysis.lesson.ordinal === 9 && analysis.lesson.reference === 'VB/L12VB04.swf' &&
    analysis.host.conditionalDerivedSaUrl === '<ServerRoot>/HELP_COURSES/ALG001/L12/SA/L12VB04.mp3' &&
    analysis.host.runtimeLaunchBindingEstablished === false && analysis.host.actualSpanishSettingEstablished === false,
  'P009-specific conditional source-host Spanish audio');
  for (const pin of Object.values(PHYSICAL_SOURCE_PINS))
    demand(analysis.inputs.some(input => isDeepStrictEqual(input, {...pin, path: `${SOURCE_ROOT}/${pin.path}`})),
      `source observation input: ${pin.path}`);
  demand(analysis.decode.codec === 'mp3' && analysis.decode.sampleRate === 48000 && analysis.decode.channels === 1 &&
    analysis.decode.framesPerChannel === 1116288 && analysis.decode.decodedDurationSeconds === 23.256 &&
    analysis.decode.allFinite === true && analysis.language.spokenLanguage === 'unverified' &&
    analysis.language.listeningPerformed === false &&
    Object.values(analysis.claimBoundary).every(value => value === false), 'native decode facts and independent pending gates');
  const receipt = fileJson(files, P009_OPTIONAL_SA_PATHS.receipt);
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p009-optional-sa-source-technical-receipt-v1' &&
    receipt.animationId === ID && isDeepStrictEqual(receipt.report, P009_OPTIONAL_SA_PINS.report) &&
    receipt.outputFilesExcludingThisReceipt.some(pin => isDeepStrictEqual(pin, P009_OPTIONAL_SA_PINS.analysis)) &&
    receipt.verification.exitCode === 0 && receipt.verification.result.verified === true &&
    isDeepStrictEqual(receipt.verification.result.decode, analysis.decode) &&
    receipt.observations.saBytes === PHYSICAL_SOURCE_PINS.spanishAudio.bytes &&
    receipt.observations.saSha256 === PHYSICAL_SOURCE_PINS.spanishAudio.sha256 &&
    receipt.observations.nativeSampleRate === 48000 && receipt.observations.channels === 1 &&
    receipt.observations.decodedSamples === 1116288 &&
    Object.values(receipt.claimBoundary).every(value => value === false), 'preserved native source-observation receipt');
  return true;
}

/** Receipt/binding/check files deliberately remain outside frozen inputs. */
export function loadTypographyProof({sourceBytes, root = ROOT}) {
  demand(digest(sourceBytes) === SOURCE_SHA && sourceBytes.length === 165405, 'actual physical source for typography');
  const sourceCatalog = collectSwfTextSourceCatalog(sourceBytes);
  const sourceCatalogContentSha256 = digest(JSON.stringify(sourceCatalog));
  demand(sourceCatalogContentSha256 === SOURCE_CATALOG_SHA, 'fresh parsed source catalog');
  const files = new Map();
  for (const p of [P009_TYPOGRAPHY_PATHS.binding, P009_TYPOGRAPHY_PATHS.check]) files.set(p, stableFile(root, p));
  const binding = fileJson(files, P009_TYPOGRAPHY_PATHS.binding), check = fileJson(files, P009_TYPOGRAPHY_PATHS.check);
  for (const refs of [binding.implementation?.files, check.artifacts])
    for (const [relative, pin] of referencesMap(refs, 'typography proof')) {
      const value = stableFile(root, relative, pin); files.set(relative, value);
    }
  return {files, sourceCatalog, sourceCatalogContentSha256};
}
export function validateTypographyAdmission(files, proof, now = Date.now()) {
  demand(proof?.files instanceof Map && proof.sourceCatalog, 'finalized current P009 typography proof required');
  const bindingFile = proof.files.get(P009_TYPOGRAPHY_PATHS.binding);
  const binding = fileJson(proof.files, P009_TYPOGRAPHY_PATHS.binding), check = fileJson(proof.files, P009_TYPOGRAPHY_PATHS.check);
  const source = proof.sourceCatalog;
  demand(source.sourceSha256 === SOURCE_SHA && source.unparsedTags?.length === 0 &&
    proof.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA && digest(JSON.stringify(source)) === SOURCE_CATALOG_SHA,
  'actual source typography catalog');
  demand(binding.schemaVersion === 1 && binding.animationId === ID && binding.placementId === ID &&
    binding.sourceSwfSha256 === SOURCE_SHA && binding.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    binding.sourceRelativePath === PHYSICAL_SOURCE_PINS.source.path && binding.preparationOnly === false &&
    binding.implementation?.status === 'implemented' && Array.isArray(binding.unresolved) && binding.unresolved.length === 0 &&
    binding.sourceRiskEvidence?.technicalRiskCheckRecorded === true &&
    binding.technicalFinalization?.kind === 'p009-technical-typography-finalization-v1', 'finalized native P009 typography binding');
  demand(check.schemaVersion === 1 && check.kind === 'g678-lesson-typography-check-v1' &&
    check.animationId === ID && check.placementId === ID && check.sourceSwfSha256 === SOURCE_SHA &&
    check.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA && check.bindingSha256 === digest(bindingFile.bytes), 'matching finalized check');
  demand(Number.isFinite(Date.parse(check.checkedAt)) && Date.parse(check.checkedAt) <= now + 1000 &&
    check.checkedAt === binding.technicalFinalization.checkedAt, 'real nonfuture technical check date');
  demand(isDeepStrictEqual(Object.keys(check.checks ?? {}).sort(), [...P009_TYPOGRAPHY_CHECKS].sort()) &&
    P009_TYPOGRAPHY_CHECKS.every(name => check.checks[name] === 'passed'), 'twelve actual technical typography checks');
  for (const value of [binding, check]) demand(isDeepStrictEqual(value.languagePolicy, {en: 'source', es: 'source-fallback'}), 'source language/fallback policy');
  for (const key of ['humanReviewed', 'ownerAccepted', 'originalRuntimeAccepted', 'audioAccepted', 'strictComplete', 'published'])
    demand(check[key] === false, `independent pending acceptance: ${key}`);
  demand(check.currentJavaScriptRegistrationEffect === 'none' && check.strictCompletionEffect === 'none' &&
    check.publicationEffect === 'none', 'technical acceptance boundary');
  const implementation = referencesMap(binding.implementation.files, 'current implementation');
  demand(isDeepStrictEqual(sortedPins([...implementation.values()]), sortedPins([...referencesMap(check.checkedImplementationFiles, 'checked implementation').values()])),
    'check and binding complete implementation inventories agree');
  for (const [relative, pin] of implementation) demand(isDeepStrictEqual(proof.files.get(relative)?.pin, pin), `current typography implementation: ${relative}`);
  for (const relative of P009_MUTABLE_INTEGRATION_PATHS)
    demand(implementation.has(relative) && isDeepStrictEqual(proof.files.get(relative)?.pin, implementation.get(relative)),
      `current live mutable integration boundary: ${relative}`);
  const artifacts = referencesMap(check.artifacts, 'technical artifacts');
  for (const [relative, pin] of artifacts) demand(isDeepStrictEqual(proof.files.get(relative)?.pin, pin), `current technical artifact: ${relative}`);
  demand(check.receipt && isDeepStrictEqual(artifacts.get(check.receipt.path), check.receipt) &&
    isDeepStrictEqual(binding.technicalFinalization.receipt, check.receipt) &&
    isDeepStrictEqual(binding.sourceRiskEvidence.technicalReceipt, check.receipt), 'exact independently authored receipt pin');
  const receipt = fileJson(proof.files, check.receipt.path);
  demand(receipt.kind === 'p009-technical-typography-evidence-v1' && receipt.animationId === ID && receipt.placementId === ID &&
    receipt.sourceSwfSha256 === SOURCE_SHA && receipt.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    receipt.checkedAt === check.checkedAt && isDeepStrictEqual(receipt.checks, check.checks) &&
    isDeepStrictEqual(receipt.languagePolicy, check.languagePolicy) && isDeepStrictEqual(receipt.checkEvidence, check.checkEvidence) &&
    isDeepStrictEqual(sortedPins(receipt.checkedImplementationFiles), sortedPins([...implementation.values()])), 'receipt agrees with finalized check');
  const observedArtifacts = referencesMap(receipt.artifacts, 'observed result artifacts');
  demand(isDeepStrictEqual(sortedPins([...observedArtifacts.values(), check.receipt]), sortedPins([...artifacts.values()])), 'only receipt and observed result artifacts');
  demand(isDeepStrictEqual(Object.keys(check.checkEvidence ?? {}).sort(), [...P009_TYPOGRAPHY_CHECKS].sort()), 'per-check observations');
  for (const name of P009_TYPOGRAPHY_CHECKS) {
    const record = check.checkEvidence[name];
    demand(typeof record?.result === 'string' && record.result.trim() && Array.isArray(record.artifactPaths) &&
      record.artifactPaths.length && new Set(record.artifactPaths).size === record.artifactPaths.length &&
      record.artifactPaths.every(p => observedArtifacts.has(p) && !implementation.has(p)), `real observation artifact: ${name}`);
  }
  const risks = [...new Set(source.risks.map(r => r.kind))].sort();
  demand(isDeepStrictEqual(risks, [...P009_SOURCE_RISKS].sort()) &&
    isDeepStrictEqual([...check.resolvedSourceRisks].sort(), risks) &&
    isDeepStrictEqual(receipt.resolvedSourceRisks, check.resolvedSourceRisks) &&
    isDeepStrictEqual(receipt.sourceRiskResolutions, check.sourceRiskResolutions) &&
    isDeepStrictEqual(binding.sourceRiskEvidence.resolutions, check.sourceRiskResolutions), 'exact source-risk technical resolutions');
  demand(check.sourceRiskResolutions?.length === risks.length, 'four source-risk dispositions');
  const resolved = new Set();
  for (const resolution of check.sourceRiskResolutions) {
    demand(risks.includes(resolution.kind) && !resolved.has(resolution.kind) && typeof resolution.disposition === 'string' &&
      resolution.disposition.trim() && Array.isArray(resolution.artifactPaths) && resolution.artifactPaths.length &&
      resolution.artifactPaths.every(p => observedArtifacts.has(p)), 'artifact-backed unique source-risk disposition');
    resolved.add(resolution.kind);
  }
  const integration = fileJson(files, P009_TYPOGRAPHY_PATHS.integration);
  demand(integration.kind === 'g678-lesson-typography-integration-v1', 'shared typography integration');
  const shared = referencesMap(integration.sharedFiles, 'shared inputs');
  const critical = new Map();
  for (const relative of [...P009_NATIVE_TYPOGRAPHY_PATHS, ...shared.keys()]) {
    const actual = files.get(relative)?.pin;
    demand(actual && isDeepStrictEqual(implementation.get(relative), actual), `source/native/shared baseline current: ${relative}`);
    if (shared.has(relative)) demand(isDeepStrictEqual(shared.get(relative), actual), `shared typography input current: ${relative}`);
    critical.set(relative, actual);
  }
  const runtime = files.get(P009_ADMISSION_PATHS.runtime)?.pin;
  const metadata = fileJson(files, P009_ADMISSION_PATHS.metadata);
  demand(runtime?.bytes === 4619022 && runtime.sha256 === NATIVE_RUNTIME_SHA && metadata.animationId === ID &&
    metadata.sourceSha256 === SOURCE_SHA && metadata.runtimeSha256 === runtime.sha256 && metadata.runtimeBytes === runtime.bytes &&
    metadata.renderScale === 2 && metadata.canvas?.width === 1600 && metadata.canvas?.height === 1200 &&
    metadata.bitmapCount === 0 && metadata.acceptanceEffect === 'none', 'source/native runtime metadata');
  demand(files.get(P009_TYPOGRAPHY_PATHS.sourceInventory)?.pin.sha256 === SOURCE_INVENTORY_SHA &&
    files.get(P009_TYPOGRAPHY_PATHS.sourceDisposition)?.pin.sha256 === SOURCE_REPORT_SHA, 'reviewed source roles');
  const textDefinitions = new Map(source.textDefinitions.map(d => [d.characterId, d]));
  const main = source.timelines.find(t => t.timelineId === 'sprite-62');
  const sourceTextInstances = main.instances.filter(i => textDefinitions.has(i.characterId));
  demand(binding.blocks?.length === 45 && sourceTextInstances.length === 44 && metadata.exactSuppressionInstances?.length === 48,
    'all source-native text and suppression placements');
  const blockIds = new Set(), instanceIds = new Set();
  for (const block of binding.blocks) {
    demand(!blockIds.has(block.id) && block.language === 'en' && block.valueSource === 'source-static' && block.instance?.path?.length, 'unique native blocks');
    blockIds.add(block.id);
    const id = block.instance.path.map(s => `${s.timelineId}:${s.depth}:${s.generation}:${s.characterId}`).join('/');
    demand(id === block.instance.id && !instanceIds.has(id), 'exact unique native instance'); instanceIds.add(id);
    const leaf = block.instance.path.at(-1);
    if (block.id === 'title') demand(id === 'root:85:1:63' && block.role === 'title' &&
      isDeepStrictEqual(block.sourceShapeIds, [63]) && block.sourceTextIds.length === 0, 'source outlined title');
    else {
      demand(block.instance.path.length === 2 && block.instance.path[0].timelineId === 'root' &&
        block.instance.path[0].depth === 1 && block.instance.path[0].generation === 1 && block.instance.path[0].characterId === 62 &&
        leaf.timelineId === 'sprite-62' && sourceTextInstances.some(i => i.instanceId === block.id && i.depth === leaf.depth &&
          i.generation === leaf.generation && i.characterId === leaf.characterId), 'actual source text generation');
      demand(isDeepStrictEqual(block.sourceTextIds, textDefinitions.get(leaf.characterId).runs.map(r => r.sourceTextId)), 'exact source run IDs');
    }
  }
  return {criticalFiles: sortedPins([...critical.values()]), sourceCatalogContentSha256: SOURCE_CATALOG_SHA,
    excludedProofPaths: [...new Set([P009_TYPOGRAPHY_PATHS.binding, P009_TYPOGRAPHY_PATHS.check,
      ...artifacts.keys()])], implementation};
}

/** Pure constructor: all buffers and pins are provided by verified readers. */
export function createAdmissionPlan(files, sourcePins = PHYSICAL_SOURCE_PINS, typographyProof) {
  demand(files instanceof Map && isDeepStrictEqual(sourcePins, PHYSICAL_SOURCE_PINS), 'exact physical source inventory');
  const pin = relative => {demand(files.get(relative)?.pin, `required dependency: ${relative}`); return files.get(relative).pin;};
  for (const relative of REQUIRED_WORKSPACE_PATHS) pin(relative);
  validateFinalTimeline(files.get(P009_ADMISSION_PATHS.timeline).bytes.toString());
  validateCanonicalModule(files.get(P009_ADMISSION_PATHS.module).bytes.toString());
  validateAudioSchedule(files.get('packages/demos/src/alg-l12-p009-audio-schedule.ts').bytes.toString());
  validateSpanishAudioSource(files.get(P009_OPTIONAL_SA_PATHS.controller).bytes.toString());
  validateOptionalSpanishSource(files);
  for (const pin of [P009_SUPERSEDED_ADMISSION.freezeManifest, P009_SUPERSEDED_ADMISSION.fragment,
    P009_SUPERSEDED_ADMISSION.runtime]) demand(isDeepStrictEqual(files.get(pin.path)?.pin, pin),
    `retained immutable failed v1 evidence: ${pin.path}`);
  const typography = validateTypographyAdmission(files, typographyProof);
  demand(isDeepStrictEqual(pin(P009_PREDECESSOR.freezeManifest.path), P009_PREDECESSOR.freezeManifest), 'exact retained P006 predecessor');
  const placement = fileJson(files, P009_ADMISSION_PATHS.sourcePlacement);
  demand(placement.animationId === ID && placement.placementId === ID && placement.sourceSha256 === SOURCE_SHA &&
    placement.globalOrdinal === 9 && placement.sectionCode === 'VB' && placement.sectionPageOrdinal === 3 &&
    placement.stableLessonKey === 'shared-alg001-l12', 'exact ninth source placement');
  const audio = fileJson(files, P009_ADMISSION_PATHS.analysis);
  demand(audio.kind === 'p009-embedded-stream-technical-analysis-v1' && audio.animationId === ID &&
    audio.source.sha256 === SOURCE_SHA && audio.source.fps === 12 && audio.source.mainFrameCount === 394 &&
    audio.source.blockCount === 393 && audio.source.streamHead.latencySeekSamples === 1673 &&
    audio.encoded.sha256 === AUDIO_SHA && audio.encoded.bytes === 162890 && audio.decode.pcm.samples === 721728 &&
    audio.timingSummary.firstBlockFrame === 2 && isDeepStrictEqual(audio.timingSummary.emptyPayloadFrames, [3]) &&
    audio.timingSummary.continuousHypothesis.sourceHasTerminalStopAction === false,
  'P009-specific continuous embedded stream facts');
  demand(pin(P009_ADMISSION_PATHS.embeddedMp3).bytes === 162890 && pin(P009_ADMISSION_PATHS.embeddedMp3).sha256 === AUDIO_SHA,
    'exact embedded stream bytes');
  const glossary = fileJson(files, P009_ADMISSION_PATHS.sourceGlossary);
  demand(glossary.kind === 'p009-source-literal-key-glossary-crosswalk-v1' && glossary.animationId === ID &&
    glossary.sourceSha256 === SOURCE_SHA && glossary.sources.length === 2, 'source-linked glossary');
  for (const [index, dictionary] of glossary.sources.entries()) demand(dictionary.path === `${GLOSSARY_ROOT}/${PHYSICAL_DICTIONARY_PINS[index].path}` &&
    dictionary.bytes === PHYSICAL_DICTIONARY_PINS[index].bytes && dictionary.sha256 === PHYSICAL_DICTIONARY_PINS[index].sha256 &&
    isDeepStrictEqual(dictionary.records.map(r => r.key), P009_GLOSSARY_KEYS), 'all eight exact bilingual source keys');
  const nativeRuntime = pin(P009_ADMISSION_PATHS.runtime);
  // The maintained registry requires the calibrated work path. Preserve the
  // native source exactly; this output is a copy, never a second generation.
  const runtimeBytes = files.get(P009_ADMISSION_PATHS.runtime).bytes;
  demand(runtimeBytes.length === nativeRuntime.bytes && digest(runtimeBytes) === nativeRuntime.sha256,
    'byte-identical native prepared runtime');
  const runtime = {...nativeRuntime, path: P009_ADMISSION_PATHS.preparedRuntime};
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js', complexityLane: 'interactive-understood',
    artifacts: {module: pin(P009_ADMISSION_PATHS.module), timeline: pin(P009_ADMISSION_PATHS.timeline), runtime}};
  const excludedProof = new Set(typography.excludedProofPaths);
  const integrityFiles = sortedPins([...files.values()].map(f => f.pin).filter(p => !excluded(p.path) && !excludedProof.has(p.path)));
  const packet = {schemaVersion: 1, calibrationId: CALIBRATION, scope: 'private-engineering', deploymentScope: 'local-only',
    sourceRoot: SOURCE_ROOT, predecessor: P009_PREDECESSOR, supersedes: P009_SUPERSEDED_ADMISSION,
    source: sourcePins.source, sourceXml: sourcePins.sourceXml,
    sourceCatalog: pin(P009_ADMISSION_PATHS.sourceCatalog), sourceAudit: pin(P009_ADMISSION_PATHS.sourceAudit),
    hostAdapter: pin(P009_ADMISSION_PATHS.host),
    selectedPages: [{animationId: ID, placementId: ID, assetId: `swf-${SOURCE_SHA}`, stableLessonKey: 'shared-alg001-l12',
      sourceSha256: SOURCE_SHA, moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 9,
      sectionCode: 'VB', sectionPageOrdinal: 3, complexityLane: 'interactive-understood',
      implementationLane: 'compiler-assisted-hybrid',
      laneReason: 'Source-native text and 2x vectors, exact glossary intents and one host-owned continuous audio clock; independent Flash and audio acceptance remain pending.',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6, frameDomain: 'sprite-62',
        frameCount: 394, fps: 12, livePlaybackEndFrame: 394, language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
        audioPlaybackEnabled: true, renderScale: 2, canvas: {width: 1600, height: 1200},
        canvasRenderer: {...runtime, url: `/flash-assets/g678-local/${ID}/typography-renderer.js`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate', actionScriptExecution: 'not-executed',
        naturalTraceValidation: 'not-established', audioAcceptance: 'not-established',
        replaySemantics: 'renderer-restart-only-source-behavior-not-established', productVisualBehaviorComposite: 'not-established'},
    }],
    entry, nativeTypography: {runtime: nativeRuntime, runtimeMetadata: pin(P009_ADMISSION_PATHS.metadata),
      sourceInventory: pin(P009_TYPOGRAPHY_PATHS.sourceInventory), sourceDisposition: pin(P009_TYPOGRAPHY_PATHS.sourceDisposition),
      sourceCatalogContentSha256: typography.sourceCatalogContentSha256, languagePolicy: {en: 'source', es: 'source-fallback'},
      requiredBindingPath: P009_TYPOGRAPHY_PATHS.binding, requiredCheckPath: P009_TYPOGRAPHY_PATHS.check,
      criticalFiles: typography.criticalFiles},
    embeddedAudio: {sourceMp3: pin(P009_ADMISSION_PATHS.embeddedMp3), sourceBlocks: pin(P009_ADMISSION_PATHS.sourceBlocks),
      analysis: pin(P009_ADMISSION_PATHS.analysis), scheduleVersion: 'continuous-stream-v1-modern-terminal-hold',
      sourceSampleRange: [1673, 721728], timelineStartSample: 1837.5, timelineEndSample: 721892.5,
      visualTerminalSample: 722137.5, sourceTerminalStop: false, terminalPolicy: 'modern-hold-last-authored-frame'},
    glossary: {sourceAudit: pin(P009_ADMISSION_PATHS.sourceGlossary), buttonCount: 8,
      supplementalKeys: ['Pair', 'Locate', 'X-coordinate', 'Y-coordinate'], expectedCount: 39,
      originalHostLookupVerified: false, closePolicy: 'stay-paused-until-explicit-resume; original-parity-pending'},
    optionalSpanishAudio: {source: sourcePins.spanishAudio, disposition: pin(P009_OPTIONAL_SA_PATHS.report),
      sourceHostProof: Object.fromEntries(['report', 'analysis', 'receipt'].map(key => [key, pin(P009_OPTIONAL_SA_PATHS[key])])),
      implementation: Object.fromEntries(['controller', 'controllerTest', 'server', 'serverTest', 'route']
        .map(key => [key, pin(P009_OPTIONAL_SA_PATHS[key])])),
      intendedRole: 'explicit-spanish-audio-control', automaticLocalePlayback: false,
      playbackPolicy: 'explicit-only-separate-start-from-zero', pauseRestartPolicy: 'restart-at-zero',
      mainPlaybackRetention: 'pause-and-retain-nonterminal-position',
      returnPolicy: 'retained-main-position; modern394terminal-no-auto-replay',
      nativeAudio: {sampleRate: 48000, numberOfChannels: 1, decodedSamples: 1116288},
      originalHostParityAccepted: false, synchronizationAccepted: false, listeningAccepted: false, spokenLanguageVerified: false},
    integrity: {scope: 'maintained-P009-product-source-native-and-shared-literal-import-dependencies',
      completeTransitiveClosure: false, excludedMutableOutputs: P009_EXCLUDED_FREEZE_PATHS,
      mutableBoundaryPaths: P009_MUTABLE_INTEGRATION_PATHS,
      qualification: 'Registry/dispatch, lesson availability and live typography records/results are read independently; unrelated lesson registry branches and external packages are outside this page freeze.',
      files: integrityFiles},
    preparationState: {status: 'admission-reviewed', activationPermitted: true, typographyImplementation: 'source-bound-implemented',
      requiredBindingPath: P009_TYPOGRAPHY_PATHS.binding, requiredCheckPath: P009_TYPOGRAPHY_PATHS.check,
      requiredDevelopmentCheck: 'npm run check:typography --workspace @helpmath/demos',
      postRegistrationTypographyCheckRequired: true,
      technicalEvidencePolicy: 'A current finalized native technical pair authorizes this preparation. New admission wiring is frozen separately. Actual registration changes registry/dispatch; formal admission requires a fresh complete technical pair and independent registered-host postflight.',
      finalizationOrder: 'prepare freeze and fragment -> reviewed registration -> generated dispatch -> independent registered-host checks -> preserved typography successor pair -> formal host and development check'},
    acceptanceEffects: Object.fromEntries(ACCEPTANCE_KEYS.map(key => [key, false])), productCalibrationPassed: false, scaleOutAuthorized: false,
  };
  validateFrozenReaderCoverage(packet, files.get(P009_ADMISSION_PATHS.reader).bytes.toString());
  const freezeBytes = jsonBytes(packet);
  const fragment = {calibrationId: CALIBRATION, deploymentScope: 'local-only', freezeManifest: P009_ADMISSION_PATHS.freeze,
    freezeManifestBytes: freezeBytes.length, freezeManifestSha256: digest(freezeBytes), entries: [entry]};
  return {packet, fragment, outputs: [{path: P009_ADMISSION_PATHS.preparedRuntime, bytes: Buffer.from(runtimeBytes)},
    {path: P009_ADMISSION_PATHS.freeze, bytes: freezeBytes},
    {path: P009_ADMISSION_PATHS.fragment, bytes: jsonBytes(fragment)}]};
}

/** Read the actual immutable admission closure without validating or writing a
 * plan. The production preparer and reader-contract fixtures share these same
 * physical, stable buffers; caller-added mandatory seeds cannot hide an
 * incomplete producer closure. Mutable integration paths stay outside it. */
export function collectAdmissionInputs(root = ROOT) {
  physicalDirectory(root);
  const collected = collectP005TypographyImportClosure(root, REQUIRED_WORKSPACE_PATHS.filter(p => !excluded(p)));
  const files = new Map();
  for (const relative of collected.files.keys()) if (!excluded(relative)) files.set(relative, stableFile(root, relative));
  const integration = fileJson(files, P009_TYPOGRAPHY_PATHS.integration);
  for (const [relative, expected] of referencesMap(integration.sharedFiles, 'shared inputs')) files.set(relative, stableFile(root, relative, expected));
  return files;
}

/** Real paths, physical source and current finalized pair. Missing proof yields
 * an inactive preparation; this does not return a registerable fragment. */
export function prepareAdmission({root = ROOT, sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT} = {}) {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV, 'local engineering preparation only');
  demand(sourceRoot === SOURCE_ROOT, 'exact physical AWS source-root opt-in');
  physicalDirectory(root); physicalDirectory(sourceRoot); physicalDirectory(GLOSSARY_ROOT);
  const sourceFiles = new Map(Object.values(PHYSICAL_SOURCE_PINS).map(pin => [pin.path, stableFile(sourceRoot, pin.path, pin)]));
  const dictionaryFiles = PHYSICAL_DICTIONARY_PINS.map(pin => stableFile(GLOSSARY_ROOT, pin.path, pin));
  const missing = [P009_TYPOGRAPHY_PATHS.binding, P009_TYPOGRAPHY_PATHS.check].filter(relative => !fs.existsSync(path.join(root, relative)));
  if (missing.length) return {active: false, status: 'P009_TYPOGRAPHY_FINALIZATION_REQUIRED', missing,
    preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  let proof;
  try {proof = loadTypographyProof({sourceBytes: sourceFiles.get(PHYSICAL_SOURCE_PINS.source.path).bytes, root});}
  catch (error) {
    return {active: false, status: 'P009_TYPOGRAPHY_CURRENT_PROOF_REQUIRED',
      typographyDiagnostics: [error instanceof Error ? error.message : 'Typography proof could not be verified.'],
      preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  }
  const needed = REQUIRED_WORKSPACE_PATHS.filter(relative => !fs.existsSync(path.join(root, relative)));
  if (needed.length) return {active: false, status: 'P009_ADMISSION_WIRING_REQUIRED', missing: needed,
    preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  const files = collectAdmissionInputs(root);
  const sourceCatalog = fileJson(files, P009_ADMISSION_PATHS.sourceCatalog);
  demand(isDeepStrictEqual(sourceCatalog, proof.sourceCatalog), 'stored catalog equals fresh physical source');
  const index = sourceFiles.get(PHYSICAL_SOURCE_PINS.sourceXml.path).bytes.toString().replace(/<!--[\s\S]*?-->/gu, '');
  const pages = [...index.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)].map(match => match[1]);
  demand(pages.length === 52 && pages[8] === 'VB/L12VB04.swf' && pages[7] === 'VB/L12VB03.swf' && pages[9] === 'VB/L12VB05.swf', 'physical source XML active page order');
  const glossary = fileJson(files, P009_ADMISSION_PATHS.sourceGlossary);
  for (const [index, dictionary] of glossary.sources.entries()) {
    const lines = dictionaryFiles[index].bytes.toString().split(/\r?\n/u);
    for (const record of dictionary.records) {
      const literal = lines.slice(record.firstLine - 1, record.lastLine).join('\n');
      demand(literal.includes(`<${record.sourceTagName} ${record.sourceAttributes}>`) &&
        literal.includes(`${record.definitionEn}~LNG~${record.definitionEs}`) &&
        record.definitionSha256 === digest(`${record.definitionEn}~LNG~${record.definitionEs}`), 'physical bilingual dictionary record');
    }
  }
  const plan = createAdmissionPlan(files, PHYSICAL_SOURCE_PINS, proof);
  for (const file of [...files.values(), ...proof.files.values()]) stableFile(root, file.pin.path, file.pin);
  for (const pin of Object.values(PHYSICAL_SOURCE_PINS)) stableFile(sourceRoot, pin.path, pin);
  for (const pin of PHYSICAL_DICTIONARY_PINS) stableFile(GLOSSARY_ROOT, pin.path, pin);
  return {active: true, status: 'P009_ADMISSION_INPUTS_VERIFIED_NOT_WRITTEN', plan, files, proof};
}
export function parseArguments(argv) {
  demand(argv.length === 1 && ['--dry-run', '--check'].includes(argv[0]),
    'Usage: node scripts/prepare-g678-alg-l12-p009-current-js-v2.mjs --dry-run | --check; read-only, no --write');
  return {mode: argv[0]};
}
export function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv), prepared = prepareAdmission();
  if (!prepared.active) {process.stdout.write(`${JSON.stringify(prepared)}\n`); return prepared;}
  if (args.mode === '--check') for (const output of prepared.plan.outputs)
    demand(stableFile(ROOT, output.path).bytes.equals(output.bytes), `prepared output mismatch: ${output.path}`);
  const result = {status: args.mode === '--check' ? 'P009_ADMISSION_OUTPUTS_VERIFIED_READ_ONLY' : prepared.status,
    calibrationId: CALIBRATION, activationPermitted: true,
    outputs: prepared.plan.outputs.map(output => ({path: output.path, bytes: output.bytes.length, sha256: digest(output.bytes)})),
    integrityFiles: prepared.plan.packet.integrity.files.length, currentJavaScriptRegistrationEffect: 'none', independentAcceptanceEffect: 'none'};
  process.stdout.write(`${JSON.stringify(result)}\n`); return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
