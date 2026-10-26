#!/usr/bin/env node
// Read-only P010 Current-JS admission preparation. A finalized typography pair
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
export const P010_ID = 'shared-alg001-l12-p010';
export const P010_CALIBRATION = 'g678-alg-l12-p010-current-js-v1';
export const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const GLOSSARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const ID = P010_ID, CALIBRATION = P010_CALIBRATION, WORK = `migrations/${ID}`;
export const SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
export const NATIVE_RUNTIME_SHA = '399967229775a6898473461b470901a6e1f416c96734795314b92773d5f98bdb';
export const SOURCE_CATALOG_SHA = '6e79191570fcb30d21907d3b541710a9bec4d85e5bc4a966d615e0d5e48d8942';
export const AUDIO_SHA = '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f';
const SHA = /^[a-f0-9]{64}$/u;
const PRODUCER = 'scripts/prepare-g678-alg-l12-p010-current-js-v1.mjs';
const SOURCE_INVENTORY_SHA = '02385ffeec859786153977961344386243e27aa51431e00d826bda8a2eb57931';
const SOURCE_REPORT_SHA = 'd69867c1fae47c4c41490d9b3c9901f8eb823e5b6fad91365ba64af3ad4b93e3';
export const P010_ADMISSION_PATHS = Object.freeze({
  freeze: `catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  fragment: `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`,
  module: `packages/demos/src/modules/${ID}.tsx`,
  timeline: `packages/demos/src/timelines/${ID}.ts`,
  preparedRuntime: `work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`,
  runtime: `${WORK}/typography-v1/canvas-renderer.js`,
  metadata: `${WORK}/typography-v1/runtime-meta.json`,
  host: 'apps/web/components/g678-alg-l12-p010-host-lesson.tsx',
  reader: 'apps/web/lib/g678-alg-l12-p010-current-js-v1.server.ts',
  aggregate: 'apps/web/lib/g678-current-js-p010-successor-v1.server.ts',
  sourceCatalog: `${WORK}/audit/source-text-catalog.json`,
  sourceAudit: `${WORK}/evidence/SOURCE_AUDIT_2026-09-27.md`,
  implementationDisposition: `${WORK}/evidence/CURRENT_JS_IMPLEMENTATION_2026-09-27.md`,
  sourceGlossary: `${WORK}/audit/source-keyterms.json`,
  sourcePlacement: `${WORK}/audit/source-placement.json`,
  embeddedMp3: `${WORK}/audit/source-stream.mp3`,
  sourceBlocks: `${WORK}/audit/source-stream-blocks.json`,
  analysis: 'output/p010-browser-native-decode-20260927-v1/browser-native-result.json',
});
export const P010_TYPOGRAPHY_PATHS = Object.freeze({
  binding: `catalog/typography-v1/g678-page-bindings/${ID}.json`,
  check: `catalog/typography-v1/g678-checks/${ID}.json`,
  integration: 'catalog/typography-v1/g678-integration.json',
  runtime: P010_ADMISSION_PATHS.runtime,
  runtimeMetadata: P010_ADMISSION_PATHS.metadata,
  sourceInventory: `${WORK}/audit/typography-source-inventory-v1.json`,
  sourceDisposition: `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`,
});
export const P010_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
export const P010_SOURCE_RISKS = Object.freeze([
  'shape-text-unclassified', 'button-runtime-state-and-actions-not-interpreted',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved',
]);
export const P010_GLOSSARY_KEYS = Object.freeze([
  'Point', 'Geometric figures', 'Position', 'length', 'Width', 'Height',
  'Coordinate plane/Cartesian Plane', 'Coordinate', 'Ordered pair',
]);
// This exact set is also used by the maintained reader; sharedInputs is a union.
export const P010_NATIVE_TYPOGRAPHY_PATHS = Object.freeze([
  'packages/demos/src/alg-l12-p010-typography.ts',
  'packages/demos/src/alg-l12-p010-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p010-typography-asset.ts',
  'packages/demos/src/alg-l12-p010-typography.css',
  'packages/demos/src/generated/alg-l12-p010-text-data.ts',
  P010_TYPOGRAPHY_PATHS.runtime, P010_TYPOGRAPHY_PATHS.runtimeMetadata,
  P010_ADMISSION_PATHS.sourceCatalog, P010_TYPOGRAPHY_PATHS.sourceInventory,
  P010_TYPOGRAPHY_PATHS.sourceDisposition,
  'scripts/build-g678-alg-l12-p010-typography.mjs',
  'scripts/build-g678-alg-l12-p010-text-data.mjs',
  'scripts/lib/swf-text-source-catalog.mjs',
]);
// Lesson availability changes when admission is wired into the product. Its
// actual bytes are required by live typography proof, never by this freeze.
export const P010_MUTABLE_INTEGRATION_PATHS = Object.freeze([
  'apps/web/lib/learning-lesson-availability.server.ts',
]);
export const P010_EXCLUDED_FREEZE_PATHS = Object.freeze([
  'packages/demos/private-current-js-registry.json',
  'packages/demos/src/registry.generated.ts',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts',
  P010_TYPOGRAPHY_PATHS.binding, P010_TYPOGRAPHY_PATHS.check,
  P010_ADMISSION_PATHS.preparedRuntime,
  P010_ADMISSION_PATHS.freeze, P010_ADMISSION_PATHS.fragment,
  ...P010_MUTABLE_INTEGRATION_PATHS,
]);
export const P010_PREDECESSOR = Object.freeze({
  calibrationId: 'g678-alg-l12-p009-current-js-v2',
  freezeManifest: Object.freeze({path: 'catalog/product-bridge-calibrations/g678-alg-l12-p009-current-js-v2.json',
    bytes: 64242, sha256: '249038ba1944983fdbb4ef24b570946223ff6d4a2bf394178e22382df9fa6c64'}),
  registeredAnimationCount: 21, pageCount: 52, glossaryCount: 39,
});
export const PHYSICAL_SOURCE_PINS = Object.freeze({
  source: Object.freeze({path: 'G6-G8-shared/ALG001/L12/VB/L12VB05.swf', bytes: 183770, sha256: SOURCE_SHA}),
  sourceXml: Object.freeze({path: 'G6-G8-shared/ALG001/L12/index.xml', bytes: 11927,
    sha256: '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'}),
  spanishAudio: Object.freeze({path: 'G6-G8-shared/ALG001/L12/SA/L12VB05.mp3', bytes: 215376,
    sha256: '685174141928210d8190f02a778f28db993dfb3f8a7576852264e539ed8b4644'}),
});
export const P010_OPTIONAL_SA_PATHS = Object.freeze({
  report: 'output/p010-sa-host-disposition-20260927-v1/SA_HOST_DISPOSITION_2026-09-27.md',
  analysis: 'output/p010-browser-native-decode-20260927-v1/browser-native-result.json',
  receipt: 'output/p010-sa-host-disposition-20260927-v1/source-receipt.json',
  controller: 'packages/demos/src/alg-l12-p010-spanish-audio.ts',
  controllerTest: 'packages/demos/tests/alg-l12-p010-spanish-audio.test.ts',
  server: 'apps/web/lib/g678-alg-l12-p010-spanish-audio.server.ts',
  serverTest: 'apps/web/tests/g678-alg-l12-p010-assets.server-test.ts',
  route: `apps/web/app/flash-assets/g678-local/${ID}/spanish-audio.mp3/route.ts`,
});
export const P010_OPTIONAL_SA_PINS = Object.freeze({
  report: Object.freeze({path: P010_OPTIONAL_SA_PATHS.report, bytes: 12811,
    sha256: '8fac333536efd5f164ed980083f8c056b6a7668a3a100f768371ed85b57d710d'}),
  analysis: Object.freeze({path: P010_OPTIONAL_SA_PATHS.analysis, bytes: 5102,
    sha256: 'f051dc2ba559b8ffb66b99025c2aa222bf32905848d1ac3a0db2ca87f9520ce8'}),
  receipt: Object.freeze({path: P010_OPTIONAL_SA_PATHS.receipt, bytes: 17563,
    sha256: '52b7feebfe5382408a6a1c970e09028e368231025af60d9b9dde86448311a26c'}),
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
  ...Object.values(P010_ADMISSION_PATHS).filter(p => ![P010_ADMISSION_PATHS.freeze, P010_ADMISSION_PATHS.fragment,
    P010_ADMISSION_PATHS.preparedRuntime].includes(p)),
  ...P010_NATIVE_TYPOGRAPHY_PATHS, P010_TYPOGRAPHY_PATHS.integration,
  ...Object.values(P010_OPTIONAL_SA_PATHS),
  P010_PREDECESSOR.freezeManifest.path,
  'packages/demos/src/alg-l12-p010-glossary.ts',
  'packages/demos/src/alg-l12-p010-audio-schedule.ts',
  'packages/demos/src/alg-l12-p010-embedded-audio.ts',
  'packages/demos/src/source-static-canvas-candidate.tsx',
  'apps/web/lib/g678-alg-l12-p010-typography.server.ts',
  'apps/web/lib/g678-alg-l12-p010-glossary.server.ts',
  'apps/web/lib/g678-alg-l12-p010-source-audio.server.ts',
  'apps/web/lib/g678-alg-l12-p010-host.production-stub.tsx',
  'scripts/prepare-g678-alg-l12-p010-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts',
  'apps/web/tests/g678-alg-l12-p010-current-js-v1.server-test.ts',
  'apps/web/tests/g678-alg-l12-p010-assets.server-test.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/source-audio.mp3/route.ts`,
  PRODUCER, 'scripts/prepare-g678-alg-l12-p010-current-js-v1.test.mjs',
  'package.json', 'package-lock.json', 'apps/web/package.json', 'apps/web/next.config.ts',
  'apps/web/tsconfig.json', 'packages/demos/package.json', 'packages/demos/tsconfig.json',
])].sort());

export const digest = value => createHash('sha256').update(value).digest('hex');
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sortedPins = pins => [...pins].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
function demand(value, reason) {assert(value, `P010_ADMISSION_PREPARE_INVALID: ${reason}`);}
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
  return P010_EXCLUDED_FREEZE_PATHS.includes(relative) ||
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
  const ast = sourceAst(text, 'p010-timeline.ts');
  const source = declarationObject(ast, 'SHARED_ALG001_L12_P010_SOURCE');
  for (const [key, expected] of Object.entries({deploymentScope: 'local-only',
    registrationAuthority: 'private-current-js-registry', productCalibrationPassed: false,
    audioPlaybackEnabled: true, audioSchedule: 'full-native-buffer-modern-full-frame-terminal',
    sourceTerminalStop: false, spanishTextPolicy: 'english-source-fallback-translation-pending', strictAcceptanceEffect: 'none'}))
    propertyLiteral(source, key, expected);
  demand(!source.has('currentJavaScriptRegistered'), 'registration comes from actual registry, not a Boolean');
  const identity = objectProperties(source.get('source'));
  propertyLiteral(identity, 'path', PHYSICAL_SOURCE_PINS.source.path);
  demand(identity.get('sha256')?.getText(ast) === 'meta.sourceSha256', 'source SHA derives from verified metadata');
  const config = declarationObject(ast, 'SHARED_ALG001_L12_P010_CONFIG');
  for (const [key, expected] of Object.entries({animationId: ID, title: 'Plotting Points', fps: 12,
    rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: 'sprite-96', mainFrameCount: 465,
    livePlaybackEndFrame: 465, playbackMode: 'once', strictCaptureIdentity: true, showEngineeringDisclosure: false,
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
  const ast = sourceAst(text, 'p010-module.tsx');
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
  demand(named.get('Renderer')?.getText(ast) === 'P010TypographyRenderer', 'explicit native 2x renderer');
  propertyLiteral(named, 'reducedMotionFrame', 465);
  const presentation = unwrap(named.get('textPresentation'));
  demand(ts.isCallExpression(presentation) && presentation.expression.getText(ast) === 'Object.freeze', 'native presentation envelope');
  const presentationProperties = objectProperties(presentation.arguments[0]);
  demand(presentationProperties.get('binding')?.getText(ast) === 'P010_TEXT_BINDING' &&
    presentationProperties.get('Renderer')?.getText(ast) === 'P010TypographyRenderer', 'same source-native presentation binding/renderer');
  propertyLiteral(presentationProperties, 'schemaVersion', 1);
  const imports = ast.statements.filter(ts.isImportDeclaration);
  demand(imports.some(d => d.moduleSpecifier.text === '../alg-l12-p010-typography-renderer') &&
    imports.some(d => d.moduleSpecifier.text === '../timelines/shared-alg001-l12-p010'), 'canonical source-bound imports');
  return true;
}
export function validateAudioSchedule(text) {
  const ast = sourceAst(text, 'p010-audio-schedule.ts');
  const source = declarationObject(ast, 'P010_AUDIO_SOURCE');
  for (const [key, expected] of Object.entries({sha256: AUDIO_SHA, bytes: 189020, sampleRate: 22050,
    numberOfChannels: 1, decodedSamples: 837504})) propertyLiteral(source, key, expected);
  const schedule = declarationObject(ast, 'P010_AUDIO_SCHEDULE');
  for (const [key, expected] of Object.entries({status: 'source-bound-full-buffer-modern-candidate', sourceSha256: SOURCE_SHA,
    fps: 12, frameCount: 465, firstAudioFrame: 10, timelineStartSample: 16537.5, sourceStartSample: 0,
    audioEndTimelineSample: 854041.5, terminalTimelineSample: 854437.5,
    terminalPolicy: 'modern-hold-last-authored-frame-through-full-frame-span', sourceTerminalStop: false,
    sourceHeadLatencySeekSamples: 1673, initialLatencyTrimApplied: false, perBlockSeekReclockingApplied: false,
    originalRuntime: false, synchronizationAccepted: false, listeningAccepted: false, registered: false})) propertyLiteral(schedule, key, expected);
  demand(schedule.get('audioSha256')?.getText(ast) === 'P010_AUDIO_SOURCE.sha256' &&
    schedule.get('sourceEndSample')?.getText(ast) === 'P010_AUDIO_SOURCE.decodedSamples' &&
    schedule.get('samplesPerFrame')?.getText(ast) === 'P010_AUDIO_SOURCE.sampleRate / 12', 'source-derived natural-rate schedule');
  return true;
}
export function validateSpanishAudioSource(text) {
  const ast = sourceAst(text, 'p010-spanish-audio.ts');
  const source = declarationObject(ast, 'P010_SPANISH_AUDIO_SOURCE');
  for (const [key, expected] of Object.entries({sha256: PHYSICAL_SOURCE_PINS.spanishAudio.sha256,
    bytes: 215376, sampleRate: 48000, numberOfChannels: 1, decodedSamples: 738432,
    decodedDurationSeconds: 15.384, url: `/flash-assets/g678-local/${ID}/spanish-audio.mp3`}))
    propertyLiteral(source, key, expected);
  return true;
}

/** Read the actual reader's declarative mandatory paths without executing it.
 * Only literal values, arrays, objects, templates and Object.freeze are allowed.
 * This cross-tool check prevents a reader seed from disappearing from a plan. */
export function readerRequiredFrozenPaths(text) {
  const ast = sourceAst(text, 'p010-current-js-v1-reader.ts'), declarations = new Map();
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
  const paths = resolve(declarations.get('ALG_L12_P010_ADMISSION_INPUT_PATHS'));
  demand(Array.isArray(paths) && paths.length > 0 && new Set(paths).size === paths.length, 'actual unique reader mandatory paths');
  for (const relative of paths) relativePath(relative);
  return [...paths].sort();
}
export function validateFrozenReaderCoverage(packet, readerText) {
  const required = readerRequiredFrozenPaths(readerText);
  const frozen = referencesMap(packet.integrity.files, 'frozen reader inputs');
  for (const relative of required)
    demand(!excluded(relative) && frozen.has(relative), `actual reader-required frozen input: ${relative}`);
  for (const relative of P010_MUTABLE_INTEGRATION_PATHS)
    demand(!frozen.has(relative), `mutable integration is live-proof-only: ${relative}`);
  return required;
}

/** Preserved source observations are separate from later browser/UI results. */
export function validateOptionalSpanishSource(files) {
  for (const pin of Object.values(P010_OPTIONAL_SA_PINS))
    demand(isDeepStrictEqual(files.get(pin.path)?.pin, pin), `exact P010 optional SA source evidence: ${pin.path}`);
  const analysis = fileJson(files, P010_OPTIONAL_SA_PATHS.analysis);
  const decode = analysis.audit?.decodes?.find(row => row.name === 'sidecar');
  demand(analysis.audit?.kind === 'p010-native-browser-decode-measurement-v1' && analysis.audit.status === 'passed' &&
    decode?.actualContextRate === 48000 && decode.bufferSampleRate === 48000 && decode.numberOfChannels === 1 &&
    decode.length === 738432 && decode.duration === 15.384 && decode.verifiedSourceBytes === 215376 &&
    decode.verifiedSourceSha256 === PHYSICAL_SOURCE_PINS.spanishAudio.sha256 && decode.nativeDecodeAudioData === true &&
    decode.sourceNodeCreatedForDecode === false && analysis.sourceNodeStarts === 0 && analysis.actualBrowserMeasured === true,
    'P010 native sidecar browser decode without playback acceptance');
  const receipt = fileJson(files, P010_OPTIONAL_SA_PATHS.receipt);
  const host = receipt.staticConditionalApplication;
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p010-source-only-sa-host-disposition-v1' &&
    receipt.animationId === ID && receipt.sourceInputs?.length === 22 && receipt.allInputsRecheckedBeforeSeal === true &&
    receipt.activeXmlBinding?.activePageIndex === 10 && receipt.activeXmlBinding.pageInSection === 4 &&
    receipt.activeXmlBinding.pagePath === 'VB/L12VB05.swf' &&
    host?.derivedSaUrlSymbolic === '<ServerRoot>/HELP_COURSES/ALG001/L12/SA/L12VB05.mp3' &&
    host.modernLocaleAutoplayProved === false && host.actualFlagsObserved === false &&
    host.externalLessonDetailsAssociationVerified === false &&
    receipt.sourceTransport?.completionAtFrame465RequestsMainPlay === false &&
    receipt.sourceTransport.completionAtFrame464WithQuizFalseRequestsMainPlay === true &&
    receipt.independentTerminalHostGuard?.p010ConditionalTerminalFrame === 465 &&
    receipt.independentTerminalHostGuard.embeddedAudioDrainPolicyProved === false &&
    Object.values(receipt.acceptanceEffects).every(value => value === false), 'conditional P010 source-host evidence');
  for (const pin of Object.values(PHYSICAL_SOURCE_PINS))
    demand(receipt.sourceInputs.some(input => input.path === `${SOURCE_ROOT}/${pin.path}` &&
      input.bytes === pin.bytes && input.sha256 === pin.sha256), `source-host exact input: ${pin.path}`);

  return true;
}

/** Receipt/binding/check files deliberately remain outside frozen inputs. */
export function loadTypographyProof({sourceBytes, root = ROOT}) {
  demand(digest(sourceBytes) === SOURCE_SHA && sourceBytes.length === 183770, 'actual physical source for typography');
  const sourceCatalog = collectSwfTextSourceCatalog(sourceBytes);
  const sourceCatalogContentSha256 = digest(JSON.stringify(sourceCatalog));
  demand(sourceCatalogContentSha256 === SOURCE_CATALOG_SHA, 'fresh parsed source catalog');
  const files = new Map();
  for (const p of [P010_TYPOGRAPHY_PATHS.binding, P010_TYPOGRAPHY_PATHS.check]) files.set(p, stableFile(root, p));
  const binding = fileJson(files, P010_TYPOGRAPHY_PATHS.binding), check = fileJson(files, P010_TYPOGRAPHY_PATHS.check);
  for (const refs of [binding.implementation?.files, check.artifacts])
    for (const [relative, pin] of referencesMap(refs, 'typography proof')) {
      const value = stableFile(root, relative, pin); files.set(relative, value);
    }
  return {files, sourceCatalog, sourceCatalogContentSha256};
}
export function validateTypographyAdmission(files, proof, now = Date.now()) {
  demand(proof?.files instanceof Map && proof.sourceCatalog, 'finalized current P010 typography proof required');
  const bindingFile = proof.files.get(P010_TYPOGRAPHY_PATHS.binding);
  const binding = fileJson(proof.files, P010_TYPOGRAPHY_PATHS.binding), check = fileJson(proof.files, P010_TYPOGRAPHY_PATHS.check);
  const source = proof.sourceCatalog;
  demand(source.sourceSha256 === SOURCE_SHA && source.unparsedTags?.length === 0 &&
    proof.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA && digest(JSON.stringify(source)) === SOURCE_CATALOG_SHA,
  'actual source typography catalog');
  demand(binding.schemaVersion === 1 && binding.version === 'p010-source-native-text-v1' && binding.animationId === ID && binding.placementId === ID &&
    binding.sourceSwfSha256 === SOURCE_SHA && binding.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    binding.sourceRelativePath === PHYSICAL_SOURCE_PINS.source.path && binding.preparationOnly === false &&
    binding.implementation?.status === 'implemented' && Array.isArray(binding.unresolved) && binding.unresolved.length === 0 &&
    binding.sourceRiskEvidence?.technicalRiskCheckRecorded === true &&
    binding.technicalFinalization?.kind === 'p010-technical-typography-finalization-v1', 'finalized native P010 typography binding');
  demand(isDeepStrictEqual(Object.keys(binding.independentAcceptance ?? {}).sort(),
    ['registered', 'originalRuntimeAccepted', 'flashFidelityAccepted', 'audioAccepted', 'humanReviewed',
      'ownerAccepted', 'strictComplete', 'published'].sort()) &&
    Object.values(binding.independentAcceptance).every(value => value === false), 'independent pending binding acceptance');
  demand(check.schemaVersion === 1 && check.kind === 'g678-lesson-typography-check-v1' &&
    check.animationId === ID && check.placementId === ID && check.sourceSwfSha256 === SOURCE_SHA &&
    check.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA && check.bindingSha256 === digest(bindingFile.bytes), 'matching finalized check');
  demand(Number.isFinite(Date.parse(check.checkedAt)) && Date.parse(check.checkedAt) <= now + 1000 &&
    check.checkedAt === binding.technicalFinalization.checkedAt, 'real nonfuture technical check date');
  demand(isDeepStrictEqual(Object.keys(check.checks ?? {}).sort(), [...P010_TYPOGRAPHY_CHECKS].sort()) &&
    P010_TYPOGRAPHY_CHECKS.every(name => check.checks[name] === 'passed'), 'twelve actual technical typography checks');
  for (const value of [binding, check]) demand(isDeepStrictEqual(value.languagePolicy, {en: 'source', es: 'source-fallback'}), 'source language/fallback policy');
  for (const key of ['humanReviewed', 'ownerAccepted', 'originalRuntimeAccepted', 'audioAccepted', 'strictComplete', 'published'])
    demand(check[key] === false, `independent pending acceptance: ${key}`);
  demand(check.currentJavaScriptRegistrationEffect === 'none' && check.strictCompletionEffect === 'none' &&
    check.publicationEffect === 'none', 'technical acceptance boundary');
  const implementation = referencesMap(binding.implementation.files, 'current implementation');
  demand(isDeepStrictEqual(sortedPins([...implementation.values()]), sortedPins([...referencesMap(check.checkedImplementationFiles, 'checked implementation').values()])),
    'check and binding complete implementation inventories agree');
  for (const [relative, pin] of implementation) demand(isDeepStrictEqual(proof.files.get(relative)?.pin, pin), `current typography implementation: ${relative}`);
  for (const relative of P010_MUTABLE_INTEGRATION_PATHS)
    demand(implementation.has(relative) && isDeepStrictEqual(proof.files.get(relative)?.pin, implementation.get(relative)),
      `current live mutable integration boundary: ${relative}`);
  const artifacts = referencesMap(check.artifacts, 'technical artifacts');
  for (const [relative, pin] of artifacts) demand(isDeepStrictEqual(proof.files.get(relative)?.pin, pin), `current technical artifact: ${relative}`);
  demand(check.receipt && isDeepStrictEqual(artifacts.get(check.receipt.path), check.receipt) &&
    isDeepStrictEqual(binding.technicalFinalization.receipt, check.receipt) &&
    isDeepStrictEqual(binding.sourceRiskEvidence.technicalReceipt, check.receipt), 'exact independently authored receipt pin');
  const receipt = fileJson(proof.files, check.receipt.path);
  demand(receipt.kind === 'p010-technical-typography-evidence-v1' && receipt.animationId === ID && receipt.placementId === ID &&
    receipt.sourceSwfSha256 === SOURCE_SHA && receipt.sourceCatalogContentSha256 === SOURCE_CATALOG_SHA &&
    receipt.checkedAt === check.checkedAt && isDeepStrictEqual(receipt.checks, check.checks) &&
    isDeepStrictEqual(receipt.languagePolicy, check.languagePolicy) && isDeepStrictEqual(receipt.checkEvidence, check.checkEvidence) &&
    isDeepStrictEqual(sortedPins(receipt.checkedImplementationFiles), sortedPins([...implementation.values()])), 'receipt agrees with finalized check');
  const observedArtifacts = referencesMap(receipt.artifacts, 'observed result artifacts');
  demand(isDeepStrictEqual(sortedPins([...observedArtifacts.values(), check.receipt]), sortedPins([...artifacts.values()])), 'only receipt and observed result artifacts');
  demand(isDeepStrictEqual(Object.keys(check.checkEvidence ?? {}).sort(), [...P010_TYPOGRAPHY_CHECKS].sort()), 'per-check observations');
  for (const name of P010_TYPOGRAPHY_CHECKS) {
    const record = check.checkEvidence[name];
    demand(typeof record?.result === 'string' && record.result.trim() && Array.isArray(record.artifactPaths) &&
      record.artifactPaths.length && new Set(record.artifactPaths).size === record.artifactPaths.length &&
      record.artifactPaths.every(p => observedArtifacts.has(p) && !implementation.has(p)), `real observation artifact: ${name}`);
  }
  const risks = [...new Set(source.risks.map(r => r.kind))].sort();
  demand(isDeepStrictEqual(risks, [...P010_SOURCE_RISKS].sort()) &&
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
  const integration = fileJson(files, P010_TYPOGRAPHY_PATHS.integration);
  demand(integration.kind === 'g678-lesson-typography-integration-v1', 'shared typography integration');
  const shared = referencesMap(integration.sharedFiles, 'shared inputs');
  const critical = new Map();
  for (const relative of [...P010_NATIVE_TYPOGRAPHY_PATHS, ...shared.keys()]) {
    const actual = files.get(relative)?.pin;
    demand(actual && isDeepStrictEqual(implementation.get(relative), actual), `source/native/shared baseline current: ${relative}`);
    if (shared.has(relative)) demand(isDeepStrictEqual(shared.get(relative), actual), `shared typography input current: ${relative}`);
    critical.set(relative, actual);
  }
  const runtime = files.get(P010_ADMISSION_PATHS.runtime)?.pin;
  const metadata = fileJson(files, P010_ADMISSION_PATHS.metadata);
  demand(runtime?.bytes === 6324535 && runtime.sha256 === NATIVE_RUNTIME_SHA && metadata.animationId === ID &&
    metadata.sourceSha256 === SOURCE_SHA && metadata.runtimeSha256 === runtime.sha256 && metadata.runtimeBytes === runtime.bytes &&
    metadata.renderScale === 2 && metadata.canvas?.width === 1600 && metadata.canvas?.height === 1200 &&
    metadata.bitmapCount === 0 && metadata.acceptanceEffect === 'none', 'source/native runtime metadata');
  demand(files.get(P010_TYPOGRAPHY_PATHS.sourceInventory)?.pin.sha256 === SOURCE_INVENTORY_SHA &&
    files.get(P010_TYPOGRAPHY_PATHS.sourceDisposition)?.pin.sha256 === SOURCE_REPORT_SHA, 'reviewed source roles');
  const textDefinitions = new Map(source.textDefinitions.map(d => [d.characterId, d]));
  const main = source.timelines.find(t => t.timelineId === 'sprite-96');
  const sourceTextInstances = main.instances.filter(i => textDefinitions.has(i.characterId));
  demand(binding.blocks?.length === 54 && sourceTextInstances.length === 53 && metadata.exactSuppressionInstances?.length === 58,
    'all source-native text and suppression placements');
  const blockIds = new Set(), instanceIds = new Set();
  for (const block of binding.blocks) {
    demand(!blockIds.has(block.id) && block.language === 'en' && block.valueSource === 'source-static' && block.instance?.path?.length, 'unique native blocks');
    blockIds.add(block.id);
    const id = block.instance.path.map(s => `${s.timelineId}:${s.depth}:${s.generation}:${s.characterId}`).join('/');
    demand(id === block.instance.id && !instanceIds.has(id), 'exact unique native instance'); instanceIds.add(id);
    const leaf = block.instance.path.at(-1);
    if (block.id === 'title') demand(id === 'root:108:1:97' && block.role === 'title' &&
      isDeepStrictEqual(block.sourceShapeIds, [97]) && block.sourceTextIds.length === 0, 'source outlined title');
    else {
      demand(block.instance.path.length === 2 && block.instance.path[0].timelineId === 'root' &&
        block.instance.path[0].depth === 1 && block.instance.path[0].generation === 1 && block.instance.path[0].characterId === 96 &&
        leaf.timelineId === 'sprite-96' && sourceTextInstances.some(i => i.instanceId === block.id && i.depth === leaf.depth &&
          i.generation === leaf.generation && i.characterId === leaf.characterId), 'actual source text generation');
      demand(isDeepStrictEqual(block.sourceTextIds, textDefinitions.get(leaf.characterId).runs.map(r => r.sourceTextId)), 'exact source run IDs');
    }
  }
  return {criticalFiles: sortedPins([...critical.values()]), sourceCatalogContentSha256: SOURCE_CATALOG_SHA,
    excludedProofPaths: [...new Set([P010_TYPOGRAPHY_PATHS.binding, P010_TYPOGRAPHY_PATHS.check,
      ...artifacts.keys()])], implementation};
}

/** Pure constructor: all buffers and pins are provided by verified readers. */
export function createAdmissionPlan(files, sourcePins = PHYSICAL_SOURCE_PINS, typographyProof) {
  demand(files instanceof Map && isDeepStrictEqual(sourcePins, PHYSICAL_SOURCE_PINS), 'exact physical source inventory');
  const pin = relative => {demand(files.get(relative)?.pin, `required dependency: ${relative}`); return files.get(relative).pin;};
  for (const relative of REQUIRED_WORKSPACE_PATHS) pin(relative);
  validateFinalTimeline(files.get(P010_ADMISSION_PATHS.timeline).bytes.toString());
  validateCanonicalModule(files.get(P010_ADMISSION_PATHS.module).bytes.toString());
  validateAudioSchedule(files.get('packages/demos/src/alg-l12-p010-audio-schedule.ts').bytes.toString());
  validateSpanishAudioSource(files.get(P010_OPTIONAL_SA_PATHS.controller).bytes.toString());
  validateOptionalSpanishSource(files);
  const typography = validateTypographyAdmission(files, typographyProof);
  demand(isDeepStrictEqual(pin(P010_PREDECESSOR.freezeManifest.path), P010_PREDECESSOR.freezeManifest), 'exact retained P009 predecessor');
  const placementRecord = fileJson(files, P010_ADMISSION_PATHS.sourcePlacement);
  const placement = placementRecord.placement;
  demand(placementRecord.kind === 'p010-exact-source-placement-audit-v1' && placementRecord.oneIndexedOrdinal === 10 &&
    placement?.animationId === ID && placement.placementId === ID && placement.sourceSha256 === SOURCE_SHA &&
    placement.globalOrdinal === 10 && placement.sectionCode === 'VB' && placement.sectionPageOrdinal === 4 &&
    placement.stableLessonKey === 'shared-alg001-l12', 'exact tenth source placement');
  const audio = fileJson(files, P010_ADMISSION_PATHS.analysis);
  const embedded = audio.audit?.decodes?.find(row => row.name === 'embedded');
  const blocks = fileJson(files, P010_ADMISSION_PATHS.sourceBlocks);
  demand(audio.audit?.kind === 'p010-native-browser-decode-measurement-v1' && audio.audit.status === 'passed' &&
    embedded?.actualContextRate === 22050 && embedded.bufferSampleRate === 22050 && embedded.length === 837504 &&
    embedded.numberOfChannels === 1 && embedded.verifiedSourceBytes === 189020 && embedded.verifiedSourceSha256 === AUDIO_SHA &&
    embedded.nativeDecodeAudioData === true && audio.actualBrowserMeasured === true &&
    blocks.animationId === ID && blocks.sourceSha256 === SOURCE_SHA && blocks.streamHead.latencySeekSamples === 1673 &&
    blocks.stream.blockCount === 456 && blocks.stream.firstBlockFrame === 10 && blocks.stream.lastBlockFrame === 465 &&
    isDeepStrictEqual(blocks.stream.emptyPayloadFrames, [11]) && blocks.stream.sha256 === AUDIO_SHA,
    'P010 native decode and authored stream blocks; no inferred 1673-sample trim');
  demand(pin(P010_ADMISSION_PATHS.embeddedMp3).bytes === 189020 && pin(P010_ADMISSION_PATHS.embeddedMp3).sha256 === AUDIO_SHA,
    'exact embedded stream bytes');
  const glossary = fileJson(files, P010_ADMISSION_PATHS.sourceGlossary);
  demand(glossary.kind === 'p010-source-literal-key-glossary-crosswalk-v1' && glossary.animationId === ID &&
    glossary.sourceSha256 === SOURCE_SHA && glossary.sources.length === 2, 'source-linked glossary');
  for (const [index, dictionary] of glossary.sources.entries()) demand(dictionary.path === `${GLOSSARY_ROOT}/${PHYSICAL_DICTIONARY_PINS[index].path}` &&
    dictionary.bytes === PHYSICAL_DICTIONARY_PINS[index].bytes && dictionary.sha256 === PHYSICAL_DICTIONARY_PINS[index].sha256 &&
    isDeepStrictEqual(dictionary.records.map(r => r.literalKey), P010_GLOSSARY_KEYS), 'all nine exact bilingual source keys');
  demand(isDeepStrictEqual(glossary.explicitCaseCrosswalks, [{from: 'length', to: 'Length'}]),
    'only the source-reviewed length casing crosswalk');
  const nativeRuntime = pin(P010_ADMISSION_PATHS.runtime);
  // The maintained registry requires the calibrated work path. Preserve the
  // native source exactly; this output is a copy, never a second generation.
  const runtimeBytes = files.get(P010_ADMISSION_PATHS.runtime).bytes;
  demand(runtimeBytes.length === nativeRuntime.bytes && digest(runtimeBytes) === nativeRuntime.sha256,
    'byte-identical native prepared runtime');
  const runtime = {...nativeRuntime, path: P010_ADMISSION_PATHS.preparedRuntime};
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js', complexityLane: 'interactive-understood',
    artifacts: {module: pin(P010_ADMISSION_PATHS.module), timeline: pin(P010_ADMISSION_PATHS.timeline), runtime}};
  const excludedProof = new Set(typography.excludedProofPaths);
  const integrityFiles = sortedPins([...files.values()].map(f => f.pin).filter(p => !excluded(p.path) && !excludedProof.has(p.path)));
  const packet = {schemaVersion: 1, calibrationId: CALIBRATION, scope: 'private-engineering', deploymentScope: 'local-only',
    sourceRoot: SOURCE_ROOT, predecessor: P010_PREDECESSOR,
    source: sourcePins.source, sourceXml: sourcePins.sourceXml,
    sourceCatalog: pin(P010_ADMISSION_PATHS.sourceCatalog), sourceAudit: pin(P010_ADMISSION_PATHS.sourceAudit),
    hostAdapter: pin(P010_ADMISSION_PATHS.host),
    selectedPages: [{animationId: ID, placementId: ID, assetId: `swf-${SOURCE_SHA}`, stableLessonKey: 'shared-alg001-l12',
      sourceSha256: SOURCE_SHA, moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 10,
      sectionCode: 'VB', sectionPageOrdinal: 4, complexityLane: 'interactive-understood',
      implementationLane: 'compiler-assisted-hybrid',
      laneReason: 'Source-native text and 2x vectors, exact glossary intents and one host-owned continuous audio clock; independent Flash and audio acceptance remain pending.',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6, frameDomain: 'sprite-96',
        frameCount: 465, fps: 12, livePlaybackEndFrame: 465, language: 'fixed-en', scenario: 'source-static-frame', seed: '0',
        audioPlaybackEnabled: true, renderScale: 2, canvas: {width: 1600, height: 1200},
        canvasRenderer: {...runtime, url: `/flash-assets/g678-local/${ID}/typography-renderer.js`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate', actionScriptExecution: 'not-executed',
        naturalTraceValidation: 'not-established', audioAcceptance: 'not-established',
        replaySemantics: 'renderer-restart-only-source-behavior-not-established', productVisualBehaviorComposite: 'not-established'},
    }],
    entry, nativeTypography: {runtime: nativeRuntime, runtimeMetadata: pin(P010_ADMISSION_PATHS.metadata),
      sourceInventory: pin(P010_TYPOGRAPHY_PATHS.sourceInventory), sourceDisposition: pin(P010_TYPOGRAPHY_PATHS.sourceDisposition),
      sourceCatalogContentSha256: typography.sourceCatalogContentSha256, languagePolicy: {en: 'source', es: 'source-fallback'},
      requiredBindingPath: P010_TYPOGRAPHY_PATHS.binding, requiredCheckPath: P010_TYPOGRAPHY_PATHS.check,
      criticalFiles: typography.criticalFiles},
    embeddedAudio: {sourceMp3: pin(P010_ADMISSION_PATHS.embeddedMp3), sourceBlocks: pin(P010_ADMISSION_PATHS.sourceBlocks),
      analysis: pin(P010_ADMISSION_PATHS.analysis), scheduleVersion: 'full-native-buffer-modern-full-frame-terminal',
      sourceSampleRange: [0, 837504], timelineStartSample: 16537.5, timelineEndSample: 854041.5,
      visualTerminalSample: 854437.5, sourceTerminalStop: false, terminalPolicy: 'modern-hold-last-authored-frame-through-full-frame-span'},
    glossary: {sourceAudit: pin(P010_ADMISSION_PATHS.sourceGlossary), buttonCount: 10,
      supplementalKeys: ['Geometric figures', 'Position', 'length', 'Width', 'Height'], expectedCount: 44,
      originalHostLookupVerified: false, closePolicy: 'stay-paused-until-explicit-resume; original-parity-pending'},
    optionalSpanishAudio: {source: sourcePins.spanishAudio, disposition: pin(P010_OPTIONAL_SA_PATHS.report),
      sourceHostProof: Object.fromEntries(['report', 'analysis', 'receipt'].map(key => [key, pin(P010_OPTIONAL_SA_PATHS[key])])),
      implementation: Object.fromEntries(['controller', 'controllerTest', 'server', 'serverTest', 'route']
        .map(key => [key, pin(P010_OPTIONAL_SA_PATHS[key])])),
      intendedRole: 'explicit-spanish-audio-control', automaticLocalePlayback: false,
      playbackPolicy: 'explicit-only-separate-start-from-zero', pauseRestartPolicy: 'restart-at-zero',
      mainPlaybackRetention: 'pause-and-retain-nonterminal-position',
      returnPolicy: 'retained-main-position; modern465terminal-no-auto-replay',
      nativeAudio: {sampleRate: 48000, numberOfChannels: 1, decodedSamples: 738432},
      originalHostParityAccepted: false, synchronizationAccepted: false, listeningAccepted: false, spokenLanguageVerified: false},
    integrity: {scope: 'maintained-P010-product-source-native-and-shared-literal-import-dependencies',
      completeTransitiveClosure: false, excludedMutableOutputs: P010_EXCLUDED_FREEZE_PATHS,
      mutableBoundaryPaths: P010_MUTABLE_INTEGRATION_PATHS,
      qualification: 'Registry/dispatch, lesson availability and live typography records/results are read independently; unrelated lesson registry branches and external packages are outside this page freeze.',
      files: integrityFiles},
    preparationState: {status: 'admission-reviewed', activationPermitted: true, typographyImplementation: 'source-bound-implemented',
      requiredBindingPath: P010_TYPOGRAPHY_PATHS.binding, requiredCheckPath: P010_TYPOGRAPHY_PATHS.check,
      requiredDevelopmentCheck: 'npm run check:typography --workspace @helpmath/demos',
      postRegistrationTypographyCheckRequired: true,
      technicalEvidencePolicy: 'A current finalized native technical pair authorizes this preparation. New admission wiring is frozen separately. Actual registration changes registry/dispatch; formal admission requires a fresh complete technical pair and independent registered-host postflight.',
      finalizationOrder: 'prepare freeze and fragment -> reviewed registration -> generated dispatch -> independent registered-host checks -> preserved typography successor pair -> formal host and development check'},
    acceptanceEffects: Object.fromEntries(ACCEPTANCE_KEYS.map(key => [key, false])), productCalibrationPassed: false, scaleOutAuthorized: false,
  };
  validateFrozenReaderCoverage(packet, files.get(P010_ADMISSION_PATHS.reader).bytes.toString());
  const freezeBytes = jsonBytes(packet);
  const fragment = {calibrationId: CALIBRATION, deploymentScope: 'local-only', freezeManifest: P010_ADMISSION_PATHS.freeze,
    freezeManifestBytes: freezeBytes.length, freezeManifestSha256: digest(freezeBytes), entries: [entry]};
  return {packet, fragment, outputs: [{path: P010_ADMISSION_PATHS.preparedRuntime, bytes: Buffer.from(runtimeBytes)},
    {path: P010_ADMISSION_PATHS.freeze, bytes: freezeBytes},
    {path: P010_ADMISSION_PATHS.fragment, bytes: jsonBytes(fragment)}]};
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
  const integration = fileJson(files, P010_TYPOGRAPHY_PATHS.integration);
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
  const missing = [P010_TYPOGRAPHY_PATHS.binding, P010_TYPOGRAPHY_PATHS.check].filter(relative => !fs.existsSync(path.join(root, relative)));
  if (missing.length) return {active: false, status: 'P010_TYPOGRAPHY_FINALIZATION_REQUIRED', missing,
    preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  let proof;
  try {proof = loadTypographyProof({sourceBytes: sourceFiles.get(PHYSICAL_SOURCE_PINS.source.path).bytes, root});}
  catch (error) {
    return {active: false, status: 'P010_TYPOGRAPHY_CURRENT_PROOF_REQUIRED',
      typographyDiagnostics: [error instanceof Error ? error.message : 'Typography proof could not be verified.'],
      preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  }
  const needed = REQUIRED_WORKSPACE_PATHS.filter(relative => !fs.existsSync(path.join(root, relative)));
  if (needed.length) return {active: false, status: 'P010_ADMISSION_WIRING_REQUIRED', missing: needed,
    preparationState: {status: 'inactive', activationPermitted: false}, independentAcceptanceEffect: 'none'};
  const files = collectAdmissionInputs(root);
  const sourceCatalog = fileJson(files, P010_ADMISSION_PATHS.sourceCatalog);
  demand(isDeepStrictEqual(sourceCatalog, proof.sourceCatalog), 'stored catalog equals fresh physical source');
  const index = sourceFiles.get(PHYSICAL_SOURCE_PINS.sourceXml.path).bytes.toString().replace(/<!--[\s\S]*?-->/gu, '');
  const pages = [...index.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)].map(match => match[1]);
  demand(pages.length === 52 && pages[9] === 'VB/L12VB05.swf' && pages[8] === 'VB/L12VB04.swf' && pages[10] === 'VB/L12VB06.swf', 'physical source XML active page order');
  const glossary = fileJson(files, P010_ADMISSION_PATHS.sourceGlossary);
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
  const hostReceipt = fileJson(files, P010_OPTIONAL_SA_PATHS.receipt);
  for (const input of hostReceipt.sourceInputs) {
    demand(path.isAbsolute(input.path), 'physical source-host proof input');
    stableFile(path.dirname(input.path), path.basename(input.path),
      {path: path.basename(input.path), bytes: input.bytes, sha256: input.sha256});
  }
  for (const file of [...files.values(), ...proof.files.values()]) stableFile(root, file.pin.path, file.pin);
  for (const pin of Object.values(PHYSICAL_SOURCE_PINS)) stableFile(sourceRoot, pin.path, pin);
  for (const pin of PHYSICAL_DICTIONARY_PINS) stableFile(GLOSSARY_ROOT, pin.path, pin);
  return {active: true, status: 'P010_ADMISSION_INPUTS_VERIFIED_NOT_WRITTEN', plan, files, proof};
}
export function parseArguments(argv) {
  demand(argv.length === 1 && ['--dry-run', '--check'].includes(argv[0]),
    'Usage: node scripts/prepare-g678-alg-l12-p010-current-js-v1.mjs --dry-run | --check; read-only, no --write');
  return {mode: argv[0]};
}
export function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv), prepared = prepareAdmission();
  if (!prepared.active) {process.stdout.write(`${JSON.stringify(prepared)}\n`); return prepared;}
  if (args.mode === '--check') for (const output of prepared.plan.outputs)
    demand(stableFile(ROOT, output.path).bytes.equals(output.bytes), `prepared output mismatch: ${output.path}`);
  const result = {status: args.mode === '--check' ? 'P010_ADMISSION_OUTPUTS_VERIFIED_READ_ONLY' : prepared.status,
    calibrationId: CALIBRATION, activationPermitted: true,
    outputs: prepared.plan.outputs.map(output => ({path: output.path, bytes: output.bytes.length, sha256: digest(output.bytes)})),
    integrityFiles: prepared.plan.packet.integrity.files.length, currentJavaScriptRegistrationEffect: 'none', independentAcceptanceEffect: 'none'};
  process.stdout.write(`${JSON.stringify(result)}\n`); return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
