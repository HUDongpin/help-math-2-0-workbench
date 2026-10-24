#!/usr/bin/env -S tsx
// First P005 typography pair only. Preparation records no technical pass;
// finalization consumes independently authored evidence for the current bytes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import type {LessonTextBinding, LessonTextInstance} from '../packages/demos/src/lesson-text-contract';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P005_TYPOGRAPHY_ID = 'shared-alg001-l12-p005';
export const P005_TYPOGRAPHY_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P005_TYPOGRAPHY_SOURCE_PATH = 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
export const P005_TYPOGRAPHY_SOURCE_SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
export const P005_TYPOGRAPHY_CATALOG_SHA = 'afad1a722a1e4c74d2ca4406375ca6e62e4f6dbd719354b86b3a23bae39a7fb5';
const ID = P005_TYPOGRAPHY_ID;
const MIGRATION = `migrations/${ID}`;
const SHAPE_SHA = '64b21d8aaaf3819405b69db395a7fea5d89e4ff7fbb702dc518f088b0ad7b808';
const TEXT_SHA = '52f9d7b49856a93e5f5be4debf0bba882237e78637519a5a690805fb56d663cc';
const ORIGINAL_RUNTIME_SHA = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';
const TITLE = 'Graphing in the Coordinate Plane: Real World Activity';
const INSTANCE = 'root:135:1:395/sprite-395:2:1:394';
const NATIVE_BINDING_PATH = 'packages/demos/src/alg-l12-p005-typography.ts';
const NATIVE_GENERATOR_PATH = 'scripts/build-g678-alg-l12-p005-typography.mjs';
const GENERATOR_PATH = 'scripts/prepare-g678-alg-l12-p005-typography-binding.mts';
const INTEGRATION_PATH = 'catalog/typography-v1/g678-integration.json';
const INVENTORY_PATH = `${MIGRATION}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`;
const ROUTE_PATH = `${MIGRATION}/evidence/TYPOGRAPHY_IMPLEMENTATION_ROUTE_2026-09-27.md`;
const GRAPHICS_PATH = `${MIGRATION}/evidence/TYPOGRAPHY_GRAPHICS_DISPOSITION_2026-09-27.md`;
export const P005_TYPOGRAPHY_BINDING_PATH = `catalog/typography-v1/g678-page-bindings/${ID}.json`;
export const P005_TYPOGRAPHY_CHECK_PATH = `catalog/typography-v1/g678-checks/${ID}.json`;
export const P005_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
] as const);
export const P005_TYPOGRAPHY_SOURCE_RISKS = Object.freeze([
  'shape-text-unclassified', 'bitmap-text-unclassified',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved',
] as const);

/** Page-specific seeds, never a P006 admission/refresh dependency. Resolved
 * normal shared imports are added below; generated registry state is qualified
 * as an external boundary rather than made a registration prerequisite. */
export const P005_TYPOGRAPHY_SEED_PATHS = Object.freeze([
  'packages/demos/src/modules/shared-alg001-l12-p005.tsx',
  'packages/demos/src/timelines/shared-alg001-l12-p005.ts',
  NATIVE_BINDING_PATH, 'packages/demos/src/alg-l12-p005-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p005-typography-asset.ts', 'packages/demos/src/alg-l12-p005-typography.css',
  'packages/demos/src/alg-l12-p005-visual-clock.ts',
  'packages/demos/tests/alg-l12-p005-typography.test.ts',
  'packages/demos/tests/alg-l12-p005-module.test.ts',
  'packages/demos/tests/alg-l12-p005-visual-clock.test.ts',
  'apps/web/components/g678-alg-l12-p005-host-lesson.tsx',
  'apps/web/lib/g678-alg-l12-p005-host.production-stub.tsx',
  'apps/web/lib/g678-alg-l12-p005-host-probe.server.ts',
  'apps/web/lib/g678-alg-l12-p005.server.ts',
  'apps/web/lib/g678-alg-l12-p005-typography.server.ts',
  'apps/web/tests/g678-alg-l12-p005.server-test.ts',
  'apps/web/tests/g678-alg-l12-p005-host-probe.server-test.ts',
  'apps/web/tests/g678-alg-l12-p005-typography.server-test.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  `apps/web/app/flash-assets/g678-local/${ID}/canvas-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  'apps/web/proxy.ts', 'apps/web/next.config.ts',
  'apps/web/lib/g678-local-only-registry.production-stub.ts',
  'scripts/build-g678-alg-l12-p005-candidate.mjs',
  'scripts/build-g678-alg-l12-p005-candidate.test.mjs',
  'scripts/build-g678-alg-l12-p005-mask-candidate.mjs',
  'scripts/build-g678-alg-l12-p005-mask-candidate.test.mjs',
  'scripts/validate-g678-alg-l12-p005-runtime.mjs',
  'scripts/validate-g678-alg-l12-p005-runtime.test.mjs',
  NATIVE_GENERATOR_PATH, 'scripts/build-g678-alg-l12-p005-typography.test.mjs',
  'scripts/check-g678-lesson-typography-v1.mjs',
  GENERATOR_PATH, 'scripts/prepare-g678-alg-l12-p005-typography-binding.test.mts',
  `${MIGRATION}/MIGRATION_BRIEF.md`, `${MIGRATION}/audit/movie.xml`,
  `${MIGRATION}/audit/source-structure.json`, `${MIGRATION}/audit/source-texts/393.txt`,
  `${MIGRATION}/audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_391/frames.html`,
  `${MIGRATION}/audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_391/canvas.js`,
  `${MIGRATION}/audit/ffdec-26.2.1-canvas-v1/frames/frames.html`,
  'migrations/shared-alg001-l12-p003/candidate-v1/adapter-spec.json',
  `${MIGRATION}/candidate-v1/adapter-spec.json`, `${MIGRATION}/candidate-v1/adapter-manifest.json`,
  `${MIGRATION}/candidate-v1/canvas-renderer.js`,
  `${MIGRATION}/candidate-v2/mask-manifest.json`, `${MIGRATION}/candidate-v2/canvas-renderer.js`,
  `${MIGRATION}/typography-v1/canvas-renderer.js`, `${MIGRATION}/typography-v1/runtime-meta.json`,
  `${MIGRATION}/typography-v1/source-evidence.json`, INVENTORY_PATH, ROUTE_PATH, GRAPHICS_PATH,
  INTEGRATION_PATH, 'docs/G678_LESSON_TYPOGRAPHY_INTEGRATION.md',
  'package.json', 'package-lock.json', 'apps/web/package.json', 'apps/web/tsconfig.json',
  'packages/demos/package.json', 'packages/demos/tsconfig.json',
] as const);

const SHA = /^[a-f0-9]{64}$/u;
export type P005TypographyPin = {path: string; bytes: number; sha256: string};
type ArtifactReference = {path: string; sha256: string; bytes?: number};
type StableFile = {bytes: Buffer; pin: P005TypographyPin; modifiedAt: number};
type RiskResolution = {kind: string; disposition: string; artifactPaths: string[]};
export type P005TechnicalTypographyEvidence = {
  schemaVersion: 1; kind: 'p005-technical-typography-evidence-v1';
  animationId: string; placementId: string;
  sourceSwfSha256: string; sourceCatalogContentSha256: string; checkedAt: string;
  checks: Record<string, 'passed'>; resolvedSourceRisks: string[];
  sourceRiskResolutions: RiskResolution[];
  languagePolicy: {en: 'source'; es: 'source-fallback'};
  artifacts: ArtifactReference[]; checkedImplementationFiles: ArtifactReference[];
};
type SourceCatalog = {
  unparsedTags: unknown[];
  textDefinitions: {characterId: number; sourceTagSha256: string; sourceTextId: string;
    runs?: {sourceTextId: string; text: string}[]}[];
  shapeDefinitions: {characterId: number; sourceTagSha256: string}[];
  timelines: {timelineId: string; declaredFrameCount: number; instances: {
    instanceId: string; depth: number; generation: number; characterId: number;
    firstFrame: number; lastFrameExclusive: number; createdByEventId: string; updates: string[];
  }[]; events: {eventId: string; matrix?: number[]; sourceTagSha256: string}[]}[];
  risks: {kind: string}[];
};
const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const sortedPins = (pins: readonly P005TypographyPin[]) => [...pins].sort((a, b) => compare(a.path, b.path));

function relativePath(value: unknown): asserts value is string {
  assert(typeof value === 'string' && value && !path.isAbsolute(value) && !value.includes('\\') &&
    !value.split('/').some(segment => !segment || segment === '.' || segment === '..'),
  'P005 reference must be an ordinary relative path');
}
function ordinaryDirectory(directory: string) {
  assert(path.isAbsolute(directory), 'P005 physical directory must be absolute');
  const stat = fs.lstatSync(directory);
  assert(stat.isDirectory() && !stat.isSymbolicLink() && fs.realpathSync(directory) === directory,
    `P005 physical directory required: ${directory}`);
}
function stableFile(root: string, relative: string): StableFile {
  relativePath(relative);
  const file = path.join(root, relative);
  const before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && fs.realpathSync(file) === file,
    `P005 ordinary file without symlinks required: ${relative}`);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file, {bigint: true});
  assert(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]) &&
    after.size === BigInt(bytes.length), `P005 input changed during read: ${relative}`);
  return {bytes, pin: {path: relative, bytes: bytes.length, sha256: hash(bytes)},
    modifiedAt: Number(after.mtimeNs) / 1_000_000};
}
function isRegistryState(relative: string) {
  return relative === 'packages/demos/private-current-js-registry.json' ||
    /^packages\/demos\/src\/registry(?:\.[^/]+)?\.generated\.[cm]?[jt]s$/u.test(relative);
}
function forbiddenReference(relative: string) {
  return relative === P005_TYPOGRAPHY_BINDING_PATH || relative === P005_TYPOGRAPHY_CHECK_PATH ||
    isRegistryState(relative);
}

/** Traverse literal local imports with the actual application TS resolution.
 * Registry state has a documented boundary; packages are bound by lock/config. */
export function collectP005TypographyImportClosure(root: string, seeds: readonly string[],
  files = new Map<string, StableFile>()) {
  ordinaryDirectory(root);
  const config = ts.readConfigFile(path.join(root, 'apps/web/tsconfig.json'), ts.sys.readFile);
  assert(!config.error, 'P005 application TypeScript configuration cannot be read');
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.join(root, 'apps/web'));
  assert(!parsed.errors.length, 'P005 application TypeScript configuration is invalid');
  const queue = [...seeds], seen = new Set<string>(), external = new Set<string>();
  const boundaries = new Set<string>();
  const edges: {from: string; to: string; kind: 'static' | 'dynamic'}[] = [];
  const nonliteralDynamicImports: {path: string; line: number}[] = [];
  const add = (from: string, specifier: string, kind: 'static' | 'dynamic') => {
    if (specifier.startsWith('node:')) {external.add(specifier); return;}
    const resolved = ts.resolveModuleName(specifier, path.join(root, from), parsed.options, ts.sys)
      .resolvedModule?.resolvedFileName;
    let full = resolved && fs.realpathSync(resolved);
    if (specifier.startsWith('.') && /\.(?:css|json)$/u.test(specifier)) {
      const asset = path.resolve(path.dirname(path.join(root, from)), specifier);
      if (fs.existsSync(asset)) full = fs.realpathSync(asset);
    }
    if (!full || !full.startsWith(`${root}${path.sep}`) || full.includes(`${path.sep}node_modules${path.sep}`)) {
      assert(!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('@helpmath/'),
        `P005 unresolved local import: ${from}: ${specifier}`);
      external.add(specifier); return;
    }
    const relative = path.relative(root, full).split(path.sep).join('/');
    edges.push({from, to: relative, kind});
    if (isRegistryState(relative)) {boundaries.add(relative); return;}
    assert(!forbiddenReference(relative), `P005 output cannot become an implementation input: ${relative}`);
    queue.push(relative);
  };
  while (queue.length) {
    const relative = queue.shift()!;
    relativePath(relative);
    assert(!forbiddenReference(relative), `P005 output/registry cannot be a closure seed: ${relative}`);
    if (seen.has(relative)) continue;
    seen.add(relative);
    const value = files.get(relative) ?? stableFile(root, relative);
    files.set(relative, value);
    // Generated opaque source drawing bytes, JSON, CSS and fonts are hash-bound
    // assets, not maintained import code. Never execute a page/host to find deps.
    if (!/\.[cm]?[jt]sx?$/u.test(relative) || relative.startsWith('migrations/')) continue;
    const source = ts.createSourceFile(relative, value.bytes.toString('utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        add(relative, node.moduleSpecifier.text, 'static');
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!)) {
          add(relative, (node.arguments[0] as ts.StringLiteral).text, 'dynamic');
        } else nonliteralDynamicImports.push({path: relative,
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1});
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)) add(relative, node.argument.literal.text, 'static');
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return {files, closure: {
    scope: 'P005-native-title-private-host-and-resolved-shared-inputs', completeTransitiveClosure: false,
    qualification: 'Generated registry state is excluded because P005 remains unregistered. Unrelated registry branches and external packages are not a whole-application closure; package manifests and lock/config bytes remain bound.',
    localImportEdges: edges.sort((a, b) => compare(`${a.from}:${a.to}:${a.kind}`, `${b.from}:${b.to}:${b.kind}`)),
    externalImportSpecifiers: [...external].sort(),
    registryStateBoundaries: [...boundaries].sort(),
    nonliteralDynamicImports: nonliteralDynamicImports.sort((a, b) => compare(a.path, b.path) || a.line - b.line),
  }};
}

export async function prepareP005TypographyBinding({root = ROOT,
  sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT} = {}) {
  assert(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'P005 typography preparation is local engineering only');
  assert.equal(sourceRoot, P005_TYPOGRAPHY_SOURCE_ROOT, 'Exact physical AWS source root required');
  ordinaryDirectory(root); ordinaryDirectory(sourceRoot!);
  const sourceFile = path.join(sourceRoot!, P005_TYPOGRAPHY_SOURCE_PATH);
  assert.equal(fs.lstatSync(sourceFile).nlink, 1, 'P005 source must be a single-link file');
  const raw = stableFile(sourceRoot!, P005_TYPOGRAPHY_SOURCE_PATH);
  assert.equal(raw.pin.bytes, 1950595); assert.equal(raw.pin.sha256, P005_TYPOGRAPHY_SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(raw.bytes) as SourceCatalog;
  assert.equal(hash(JSON.stringify(source)), P005_TYPOGRAPHY_CATALOG_SHA);
  assert.equal(source.unparsedTags.length, 0, 'P005 source tags must be structurally parsed');
  const sourceRisks = [...new Set(source.risks.map(risk => risk.kind))].sort();
  assert.deepEqual(sourceRisks, [...P005_TYPOGRAPHY_SOURCE_RISKS].sort(), 'P005 source-risk set changed');
  const definition = source.textDefinitions.find(item => item.characterId === 393);
  assert.equal(definition?.sourceTagSha256, TEXT_SHA);
  assert.deepEqual(definition?.runs?.map(run => run.text), [TITLE]);
  assert.equal(source.shapeDefinitions.find(item => item.characterId === 394)?.sourceTagSha256, SHAPE_SHA);
  const timelines = new Map(source.timelines.map(item => [item.timelineId, item]));
  assert.deepEqual(['root', 'sprite-391', 'sprite-395'].map(id => timelines.get(id)?.declaredFrameCount), [10, 968, 1]);
  const files = new Map<string, StableFile>();
  const load = (relative: string) => {const value = stableFile(root, relative); files.set(relative, value); return value;};
  const integrationFile = load(INTEGRATION_PATH), integration = JSON.parse(integrationFile.bytes.toString('utf8'));
  assert.equal(integration.kind, 'g678-lesson-typography-integration-v1');
  assert(Array.isArray(integration.sharedFiles) && integration.sharedFiles.length, 'P005 shared typography inputs required');
  for (const reference of integration.sharedFiles) {
    assert(SHA.test(reference.sha256 ?? '') && !files.has(reference.path), 'P005 duplicate/invalid shared typography pin');
    const current = load(reference.path);
    assert.equal(current.pin.sha256, reference.sha256, `Shared typography input drift: ${reference.path}`);
    if (reference.bytes !== undefined) assert.equal(current.pin.bytes, reference.bytes);
  }
  const inventory = load(INVENTORY_PATH), route = load(ROUTE_PATH), graphics = load(GRAPHICS_PATH);
  assert.equal(inventory.pin.sha256, 'fcd22cd2c013477c1517c4c9905c1d8e117cfd013086007d57f16b3950f7c33e',
    'P005 independently reviewed source-title inventory changed');
  assert.equal(route.pin.sha256, '8049474fa798d65edcbabc0c97cdbd6b7c2cfabc2042a9e42b3cbc1088e2b1d1',
    'P005 independently reviewed implementation route changed');
  for (const marker of [P005_TYPOGRAPHY_SOURCE_SHA, P005_TYPOGRAPHY_CATALOG_SHA, SHAPE_SHA, TEXT_SHA,
    INSTANCE, TITLE, 'offstage']) assert(inventory.bytes.toString('utf8').includes(marker),
      `P005 source title inventory missing: ${marker}`);
  for (const marker of [P005_TYPOGRAPHY_SOURCE_SHA, P005_TYPOGRAPHY_CATALOG_SHA, SHAPE_SHA, INSTANCE])
    assert(route.bytes.toString('utf8').includes(marker), `P005 route report missing: ${marker}`);
  const nativeBindingFile = load(NATIVE_BINDING_PATH);
  const native = await import(pathToFileURL(path.join(root, NATIVE_BINDING_PATH)).href) as {
    P005_TEXT_BINDING: LessonTextBinding; P005_TITLE: string; P005_TITLE_INSTANCE: LessonTextInstance;
  };
  assert.deepEqual(stableFile(root, NATIVE_BINDING_PATH).pin, nativeBindingFile.pin,
    'P005 binding module changed while reading its declaration');
  const expectedPath = [
    {timelineId: 'root', depth: 135, generation: 1, characterId: 395},
    {timelineId: 'sprite-395', depth: 2, generation: 1, characterId: 394},
  ];
  assert.equal(native.P005_TITLE, TITLE); assert.equal(native.P005_TITLE_INSTANCE.id, INSTANCE);
  assert.deepEqual(native.P005_TITLE_INSTANCE.path, expectedPath);
  const nativeBinding = native.P005_TEXT_BINDING;
  assert.equal(nativeBinding.schemaVersion, 1); assert.equal(nativeBinding.version, 'p005-source-native-text-v1');
  assert.equal(nativeBinding.animationId, ID); assert.equal(nativeBinding.placementId, ID);
  assert.equal(nativeBinding.sourceSwfSha256, P005_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(nativeBinding.template, 'explanation');
  assert.deepEqual(nativeBinding.blocks, [{id: 'title', sourceTextIds: [], sourceShapeIds: [394],
    role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static', instance: native.P005_TITLE_INSTANCE}],
  'P005 title-only binding must not promote the offstage text sibling or invent other text');
  for (const segment of expectedPath) assert(timelines.get(segment.timelineId)?.instances.some(instance =>
    instance.depth === segment.depth && instance.generation === segment.generation && instance.characterId === segment.characterId),
  'P005 exact visible-title instance missing from source');
  const original = load(`${MIGRATION}/candidate-v2/canvas-renderer.js`);
  assert.equal(original.pin.bytes, 19449678); assert.equal(original.pin.sha256, ORIGINAL_RUNTIME_SHA);
  const runtime = load(`${MIGRATION}/typography-v1/canvas-renderer.js`);
  const metaFile = load(`${MIGRATION}/typography-v1/runtime-meta.json`);
  const manifestFile = load(`${MIGRATION}/typography-v1/source-evidence.json`);
  const meta = JSON.parse(metaFile.bytes.toString('utf8')), manifest = JSON.parse(manifestFile.bytes.toString('utf8'));
  for (const document of [meta, manifest]) {
    assert.equal(document.animationId, ID); assert.equal(document.sourceSwfSha256, P005_TYPOGRAPHY_SOURCE_SHA);
    assert.equal(document.runtimeSha256, runtime.pin.sha256); assert.equal(document.runtimeBytes, runtime.pin.bytes);
  }
  assert.equal(manifest.kind, 'p005-exact-title-typography-v1'); assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.originalCandidate, 'candidate-v2'); assert.equal(manifest.originalRuntimeSha256, original.pin.sha256);
  assert.equal(manifest.originalRuntimeBytes, original.pin.bytes);
  assert.equal(manifest.globalRegistry, 'HELP_MATH_P005_TYPOGRAPHY_ASSETS');
  assert.deepEqual(manifest.nativeOnlyResolution, {width: 800, height: 600, supportedScales: [1]});
  assert.equal(manifest.evidence.title.id, INSTANCE);
  assert.equal(manifest.evidence.title.sourceShapeCharacterId, 394);
  assert.equal(manifest.evidence.title.sourceShapeTagSha256, SHAPE_SHA);
  assert.deepEqual(manifest.evidence.title.publicFrames, [1, 968]);
  assert.equal(manifest.evidence.text393.sourceTextCharacterId, 393);
  assert.equal(manifest.evidence.text393.sourceTextTagSha256, TEXT_SHA);
  assert.equal(manifest.evidence.text393.sourceDecodedText, TITLE);
  assert.equal(manifest.evidence.text393.suppressed, false);
  assert.equal(manifest.evidence.text393.semanticSubstitutionAsserted, false);
  assert.deepEqual(manifest.evidence.context, {frameDomain: 'sprite-391', rootFrame: 6,
    frameRange: [1, 968], scenario: 'source-static-frame', lang: 'en', seed: 0});
  assert.deepEqual(manifest.evidence.sourceMasks, {characterIds: [1, 203], preserved: true});
  assert.deepEqual(manifest.instrumentedSites, {title: 1});
  assert.deepEqual(manifest.drawing, {ordinaryRenderPreservesSourceWrapper: true,
    textRenderUsesHostOwnedDetachedSurface: true, sourceMaskAllocationsPreserved: true, nonTitleFunctionsModified: false});
  assert(Object.values(manifest.claimBoundary).every(value => value === false), 'P005 native generator cannot assert acceptance');
  const nativeGenerator = load(NATIVE_GENERATOR_PATH), parser = load('scripts/lib/swf-text-source-catalog.mjs');
  assert.equal(manifest.generator?.sha256, nativeGenerator.pin.sha256, 'P005 native generator bytes differ from its source evidence');
  assert.equal(manifest.generator?.sourceParserSha256, parser.pin.sha256, 'P005 native source parser bytes changed');
  const seeds = [...new Set([...P005_TYPOGRAPHY_SEED_PATHS,
    ...integration.sharedFiles.map((item: ArtifactReference) => item.path)])].sort();
  const {closure} = collectP005TypographyImportClosure(root, seeds, files);
  const implementationFiles = sortedPins([...files.values()].map(file => file.pin));
  const binding = {...nativeBinding,
    sourceRelativePath: P005_TYPOGRAPHY_SOURCE_PATH, sourceCatalogContentSha256: P005_TYPOGRAPHY_CATALOG_SHA,
    sourceRoleDecisions: [
      {kind: 'outlined-text', role: 'title', semanticValue: TITLE,
        sourceShapeHashes: [{characterId: 394, sourceTagSha256: SHAPE_SHA}], sourceInstanceId: INSTANCE,
        corroboratingSourceTextIds: ['character-393/run-0'], evidence: [inventory.pin]},
      {kind: 'offstage-semantic-text', role: 'source-evidence', characterId: 393,
        sourceTextIds: ['character-393/run-0'], sourceTextTagSha256: TEXT_SHA,
        sourceInstanceId: 'root:135:1:395/sprite-395:1:1:393',
        disposition: 'Preserve the offstage sibling; suppress only the reviewed visible outlined title.',
        suppressed: false, evidence: [inventory.pin]},
    ],
    languagePolicy: {en: 'source' as const, es: 'source-fallback' as const},
    sourceRiskEvidence: {sourceDisposition: inventory.pin, graphicsDisposition: graphics.pin, implementationRoute: route.pin,
      exactSuppressionManifest: manifestFile.pin, nativeRuntimeMetadata: metaFile.pin,
      sourceParserRisks: sourceRisks, technicalRiskCheckRecorded: false},
    generator: {path: GENERATOR_PATH, version: '1.0.0', sha256: files.get(GENERATOR_PATH)!.pin.sha256},
    implementation: {status: 'candidate', files: implementationFiles, closure},
    unresolved: [
      'The complete other-shape/morph and bitmap semantic disposition requires independently checked artifacts.',
      'Native title/graphics atomic presentation, real My Lesson controls, responsive/accessibility and lifecycle checks are not yet recorded.',
      'All four source risks and all twelve technical typography checks require a fresh independent receipt binding every current implementation file.',
    ],
    independentPending: ['Original Flash runtime and fidelity', 'Audio synchronization and named listening',
      'Human visual and Owner acceptance', 'Current-JS registration', 'Strict completion, release and publication'],
    preparationOnly: true,
  };
  for (const file of files.values()) assert.deepEqual(stableFile(root, file.pin.path).pin, file.pin,
    `P005 typography input changed during preparation: ${file.pin.path}`);
  assert.deepEqual(stableFile(sourceRoot!, P005_TYPOGRAPHY_SOURCE_PATH).pin, raw.pin,
    'P005 physical source changed during preparation');
  return {root, sourceRoot: sourceRoot!, sourcePin: raw.pin, binding, bytes: jsonBytes(binding),
    checkedAfter: Math.max(...[...files.values()].map(file => file.modifiedAt))};
}

export function validateP005TypographyEvidence(evidencePath: string, expected: {
  implementationFiles: readonly P005TypographyPin[]; sourceRisks: readonly string[]; checkedAfter?: number;
}, root = ROOT, now = Date.now()) {
  ordinaryDirectory(root); relativePath(evidencePath);
  assert(!forbiddenReference(evidencePath), 'P005 receipt cannot be an output or registry');
  const receipt = stableFile(root, evidencePath), evidence = JSON.parse(receipt.bytes.toString('utf8')) as P005TechnicalTypographyEvidence;
  assert(evidence && typeof evidence === 'object', 'P005 technical evidence object required');
  assert.equal(evidence.schemaVersion, 1); assert.equal(evidence.kind, 'p005-technical-typography-evidence-v1');
  assert.equal(evidence.animationId, ID); assert.equal(evidence.placementId, ID);
  assert.equal(evidence.sourceSwfSha256, P005_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(evidence.sourceCatalogContentSha256, P005_TYPOGRAPHY_CATALOG_SHA);
  const checkedAt = Date.parse(evidence.checkedAt);
  assert(typeof evidence.checkedAt === 'string' && Number.isFinite(checkedAt) && checkedAt <= now + 1000,
    'P005 real nonfuture checkedAt required');
  if (expected.checkedAfter !== undefined) assert(Number.isFinite(expected.checkedAfter) && checkedAt + 1000 >= expected.checkedAfter,
    'P005 fresh receipt must follow the current implementation inputs');
  assert.deepEqual(evidence.languagePolicy, {en: 'source', es: 'source-fallback'}, 'P005 explicit English source/Spanish fallback required');
  assert(evidence.checks && typeof evidence.checks === 'object' && !Array.isArray(evidence.checks));
  assert.deepEqual(Object.keys(evidence.checks).sort(), [...P005_TYPOGRAPHY_CHECKS].sort(), 'P005 receipt requires exactly twelve technical checks');
  for (const check of P005_TYPOGRAPHY_CHECKS) assert.equal(evidence.checks[check], 'passed', `P005 technical check not passed: ${check}`);
  const risks = [...new Set(expected.sourceRisks)].sort();
  assert.deepEqual(risks, [...P005_TYPOGRAPHY_SOURCE_RISKS].sort(), 'P005 expected source risks must be the exact current four');
  assert(Array.isArray(evidence.resolvedSourceRisks) && evidence.resolvedSourceRisks.every(risk => typeof risk === 'string'));
  assert.deepEqual([...evidence.resolvedSourceRisks].sort(), risks, 'P005 receipt must resolve every current source risk exactly once');
  const readReferences = (references: ArtifactReference[], label: string) => {
    assert(Array.isArray(references) && references.length > 0, `P005 ${label} references required`);
    const seen = new Set<string>();
    return sortedPins(references.map(reference => {
      assert(reference && typeof reference === 'object' && SHA.test(reference.sha256 ?? ''), `P005 full ${label} SHA-256 required`);
      relativePath(reference.path);
      assert(!forbiddenReference(reference.path) && reference.path !== evidencePath && !seen.has(reference.path),
        `P005 circular or duplicate ${label} reference: ${reference.path}`);
      seen.add(reference.path);
      const current = stableFile(root, reference.path);
      assert.equal(current.pin.sha256, reference.sha256, `P005 stale ${label}: ${reference.path}`);
      if (reference.bytes !== undefined) assert.equal(reference.bytes, current.pin.bytes, `P005 stale ${label} size: ${reference.path}`);
      return current.pin;
    }));
  };
  const artifacts = readReferences(evidence.artifacts, 'evidence artifact');
  const checked = readReferences(evidence.checkedImplementationFiles, 'checked implementation');
  assert.deepEqual(checked, sortedPins(expected.implementationFiles), 'P005 receipt must bind all current implementation files without omissions or extras');
  assert(Array.isArray(evidence.sourceRiskResolutions) && evidence.sourceRiskResolutions.length === risks.length,
    'P005 actual artifact disposition required for every source risk');
  const artifactPaths = new Set(artifacts.map(pin => pin.path)), resolvedKinds = new Set<string>(), riskKinds = new Set<string>(risks);
  for (const resolution of evidence.sourceRiskResolutions) {
    assert(resolution && riskKinds.has(resolution.kind) && !resolvedKinds.has(resolution.kind), 'P005 exact unique source-risk kind required');
    resolvedKinds.add(resolution.kind);
    assert(typeof resolution.disposition === 'string' && resolution.disposition.trim(), `P005 source-risk explanation required: ${resolution.kind}`);
    assert(Array.isArray(resolution.artifactPaths) && resolution.artifactPaths.length &&
      new Set(resolution.artifactPaths).size === resolution.artifactPaths.length &&
      resolution.artifactPaths.every(relative => artifactPaths.has(relative)),
    `P005 source-risk resolution must cite actual current receipt artifacts: ${resolution.kind}`);
  }
  for (const pin of [...artifacts, ...checked, receipt.pin]) assert.deepEqual(stableFile(root, pin.path).pin, pin,
    `P005 evidence changed during validation: ${pin.path}`);
  return {evidence, receipt: receipt.pin, artifacts, checkedImplementationFiles: checked};
}

export type P005TypographyPreparation = Awaited<ReturnType<typeof prepareP005TypographyBinding>>;
export function finalizeP005TypographyBinding(prepared: P005TypographyPreparation, evidencePath: string) {
  const verified = validateP005TypographyEvidence(evidencePath, {
    implementationFiles: prepared.binding.implementation.files,
    sourceRisks: prepared.binding.sourceRiskEvidence.sourceParserRisks, checkedAfter: prepared.checkedAfter,
  }, prepared.root);
  const binding = {...prepared.binding, implementation: {...prepared.binding.implementation, status: 'implemented'},
    sourceRiskEvidence: {...prepared.binding.sourceRiskEvidence, technicalRiskCheckRecorded: true,
      technicalReceipt: verified.receipt, resolutions: verified.evidence.sourceRiskResolutions},
    unresolved: [], preparationOnly: false,
    technicalFinalization: {kind: 'p005-technical-typography-finalization-v1', checkedAt: verified.evidence.checkedAt,
      receipt: verified.receipt, scope: 'Source-bound P005 native title and retained graphics on the local modern My Lesson host; independent acceptance gates remain pending.'}};
  const bytes = jsonBytes(binding);
  const check = {schemaVersion: 1, kind: 'g678-lesson-typography-check-v1', animationId: ID, placementId: ID,
    sourceSwfSha256: P005_TYPOGRAPHY_SOURCE_SHA, sourceCatalogContentSha256: P005_TYPOGRAPHY_CATALOG_SHA,
    bindingSha256: hash(bytes), checkedAt: verified.evidence.checkedAt, checks: verified.evidence.checks,
    resolvedSourceRisks: verified.evidence.resolvedSourceRisks, sourceRiskResolutions: verified.evidence.sourceRiskResolutions,
    languagePolicy: verified.evidence.languagePolicy, artifacts: sortedPins([...verified.artifacts, verified.receipt]),
    checkedImplementationFiles: verified.checkedImplementationFiles, producer: binding.generator, receipt: verified.receipt,
    technicalScope: binding.technicalFinalization.scope, humanReviewed: false, ownerAccepted: false,
    originalRuntimeAccepted: false, audioAccepted: false, strictComplete: false, published: false,
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none'};
  return {binding, bytes, check, checkBytes: jsonBytes(check), verified};
}
export type P005TypographyFinalization = ReturnType<typeof finalizeP005TypographyBinding>;

function demandAbsent(root: string, relative: string) {
  try {fs.lstatSync(path.join(root, relative));} catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw Error(`P005 first pair refuses any existing output: ${relative}`);
}
function verifyCurrentPins(root: string, pins: readonly P005TypographyPin[]) {
  for (const pin of pins) assert.deepEqual(stableFile(root, pin.path).pin, pin, `P005 input changed before publication: ${pin.path}`);
}

/** Exclusive first publication only. If the second creation or final recheck
 * fails, remove only this call's still-byte-identical newly created outputs. */
export function writeP005TypographyPair(result: P005TypographyFinalization, root = ROOT) {
  ordinaryDirectory(root);
  assert(result.binding.preparationOnly === false && result.binding.implementation.status === 'implemented' &&
    result.check.kind === 'g678-lesson-typography-check-v1' && result.check.bindingSha256 === hash(result.bytes),
  'P005 write requires a finalized matching pair');
  assert(result.bytes.equals(jsonBytes(result.binding)) && result.checkBytes.equals(jsonBytes(result.check)),
    'P005 serialized pair differs from its validated records');
  demandAbsent(root, P005_TYPOGRAPHY_BINDING_PATH); demandAbsent(root, P005_TYPOGRAPHY_CHECK_PATH);
  const inputs = [...result.binding.implementation.files, ...result.check.artifacts];
  verifyCurrentPins(root, inputs);
  const outputs = [{path: P005_TYPOGRAPHY_BINDING_PATH, bytes: result.bytes},
    {path: P005_TYPOGRAPHY_CHECK_PATH, bytes: result.checkBytes}];
  for (const output of outputs) {
    let directory = root;
    for (const segment of path.dirname(output.path).split('/')) {
      directory = path.join(directory, segment);
      try {fs.mkdirSync(directory);} catch (error) {if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;}
      ordinaryDirectory(directory);
    }
  }
  const created: {path: string; bytes: Buffer; dev: bigint; ino: bigint}[] = [];
  try {
    for (const output of outputs) {
      const fd = fs.openSync(path.join(root, output.path), 'wx');
      try {
        const identity = fs.fstatSync(fd, {bigint: true});
        created.push({...output, dev: identity.dev, ino: identity.ino});
        fs.writeFileSync(fd, output.bytes); fs.fsyncSync(fd);
      } finally {fs.closeSync(fd);}
    }
    verifyCurrentPins(root, inputs);
    for (const output of outputs) assert(stableFile(root, output.path).bytes.equals(output.bytes), 'P005 new pair verification failed');
  } catch (error) {
    for (const output of [...created].reverse()) {
      const file = path.join(root, output.path), stat = fs.lstatSync(file, {bigint: true});
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.dev === output.dev && stat.ino === output.ino &&
        fs.readFileSync(file).equals(output.bytes), 'P005 rollback refuses an externally changed output');
      fs.unlinkSync(file);
    }
    throw error;
  }
}

export function checkP005TypographyPair(prepared: P005TypographyPreparation, evidencePath?: string) {
  const storedCheck = stableFile(prepared.root, P005_TYPOGRAPHY_CHECK_PATH);
  const record = JSON.parse(storedCheck.bytes.toString('utf8'));
  assert.equal(record.kind, 'g678-lesson-typography-check-v1'); assert.equal(record.placementId, ID);
  const receiptPath = evidencePath ?? record.receipt?.path;
  relativePath(receiptPath);
  const result = finalizeP005TypographyBinding(prepared, receiptPath);
  assert(stableFile(prepared.root, P005_TYPOGRAPHY_BINDING_PATH).bytes.equals(result.bytes), 'P005 typography binding drift');
  assert(storedCheck.bytes.equals(result.checkBytes), 'P005 typography check record drift');
  return result;
}

export function parseP005TypographyArguments(argv: readonly string[]) {
  let mode: '--dry-run' | '--write' | '--check' = '--dry-run';
  let selectedMode = false, prepare = false, evidencePath: string | undefined;
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--prepare') {assert(!prepare, 'Duplicate P005 --prepare'); prepare = true;}
    else if (['--dry-run', '--write', '--check'].includes(argument)) {
      assert(!selectedMode, 'Select one P005 output mode'); selectedMode = true; mode = argument as '--dry-run' | '--write' | '--check';
    } else if (argument === '--evidence') {
      assert(evidencePath === undefined, 'Duplicate P005 evidence option');
      const value = argv[++index]; relativePath(value); evidencePath = value;
    } else throw Error('Usage: prepare-g678-alg-l12-p005-typography-binding.mts [--prepare] [--dry-run] OR [--evidence <receipt.json>] (--dry-run | --write | --check)');
  }
  assert(!prepare || mode === '--dry-run' && !evidencePath, 'P005 --prepare is candidate-only and cannot write/check/finalize');
  assert(mode !== '--write' || evidencePath, 'P005 --write requires actual independent evidence; no candidate output write');
  if (evidencePath) assert(!forbiddenReference(evidencePath), 'P005 evidence path cannot be an output or registry');
  return {mode, evidencePath};
}

export async function main(argv = process.argv.slice(2)) {
  const {mode, evidencePath} = parseP005TypographyArguments(argv);
  const prepared = await prepareP005TypographyBinding();
  const finalized = mode === '--check' ? checkP005TypographyPair(prepared, evidencePath)
    : evidencePath ? finalizeP005TypographyBinding(prepared, evidencePath) : undefined;
  const result = finalized ?? prepared;
  if (mode === '--write') {
    assert(finalized, 'P005 technical evidence required before publication');
    assert.deepEqual(stableFile(prepared.sourceRoot, P005_TYPOGRAPHY_SOURCE_PATH).pin, prepared.sourcePin,
      'P005 physical source changed before publication');
    writeP005TypographyPair(finalized);
  }
  const prefix = finalized ? 'TECHNICAL_FINALIZATION' : 'CANDIDATE_BINDING';
  const report = {status: `${prefix}_${mode === '--write' ? 'WRITTEN' : mode === '--check' ? 'EXACT' : 'INPUTS_VERIFIED_NOT_WRITTEN'}`,
    mode, output: {path: P005_TYPOGRAPHY_BINDING_PATH, bytes: result.bytes.length, sha256: hash(result.bytes)},
    ...(finalized ? {check: {path: P005_TYPOGRAPHY_CHECK_PATH, bytes: finalized.checkBytes.length, sha256: hash(finalized.checkBytes)},
      receipt: finalized.verified.receipt} : {}),
    ...(argv.includes('--prepare') ? {candidateBinding: result.binding} : {}), blocks: result.binding.blocks.length,
    implementationFiles: result.binding.implementation.files.length, unresolved: result.binding.unresolved,
    technicalTypographyPassed: Boolean(finalized), technicalPassRecorded: Boolean(finalized && mode !== '--dry-run'),
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none'};
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {process.stderr.write(`${error.message}\n`); process.exitCode = 1;});
