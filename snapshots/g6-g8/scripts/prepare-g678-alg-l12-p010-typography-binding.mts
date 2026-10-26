#!/usr/bin/env -S tsx
// Read-only preparation and finalization from a separately authored receipt.
// This producer neither runs the twelve technical checks nor writes catalog,
// registry, source, or acceptance state.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {collectP005TypographyImportClosure} from './prepare-g678-alg-l12-p005-typography-binding.mts';
import {collectP010TextData, P010_GEOMETRY_PATH, P010_GEOMETRY_SHA} from './build-g678-alg-l12-p010-text-data.mjs';
import {buildP010Typography} from './build-g678-alg-l12-p010-typography.mjs';
import {REQUIRED_WORKSPACE_PATHS as P010_ADMISSION_INPUT_PATHS} from './prepare-g678-alg-l12-p010-current-js-v1.mjs';
import type {LessonTextBinding} from '../packages/demos/src/lesson-text-contract';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P010_TYPOGRAPHY_ID = 'shared-alg001-l12-p010';
export const P010_TYPOGRAPHY_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P010_TYPOGRAPHY_SOURCE_PATH = 'G6-G8-shared/ALG001/L12/VB/L12VB05.swf';
export const P010_TYPOGRAPHY_SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
export const P010_TYPOGRAPHY_BINDING_PATH = `catalog/typography-v1/g678-page-bindings/${P010_TYPOGRAPHY_ID}.json`;
export const P010_TYPOGRAPHY_CHECK_PATH = `catalog/typography-v1/g678-checks/${P010_TYPOGRAPHY_ID}.json`;
export const P010_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
export const P010_TYPOGRAPHY_SOURCE_RISKS = Object.freeze([
  'shape-text-unclassified', 'button-runtime-state-and-actions-not-interpreted',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved',
]);
const ID = P010_TYPOGRAPHY_ID, WORK = `migrations/${ID}`;
const PRODUCER = 'scripts/prepare-g678-alg-l12-p010-typography-binding.mts';
const NATIVE_BINDING = 'packages/demos/src/alg-l12-p010-typography.ts';
const GENERATED_DATA = 'packages/demos/src/generated/alg-l12-p010-text-data.ts';
const INVENTORY = `${WORK}/audit/typography-source-inventory-v1.json`;
const REPORT = `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`;
const INTEGRATION = 'catalog/typography-v1/g678-integration.json';
const TITLE = 'Graphing in the Coordinate Plane: Vocabulary';
const SOURCE_INVENTORY_SHA = '02385ffeec859786153977961344386243e27aa51431e00d826bda8a2eb57931';
const SOURCE_ROLE_REPORT_SHA = 'd69867c1fae47c4c41490d9b3c9901f8eb823e5b6fad91365ba64af3ad4b93e3';
const SHA = /^[a-f0-9]{64}$/u;
const SHAPE_HASHES = Object.freeze({
  19: '2e2dda72ecbf9f6e4bc73b00e973fd1bbf8d5aec04b554276f7236f32d7ccf2f',
  25: 'f9ddc56f1f19cb175e8dcbeb5e19627b73582b2445bb635f7b389ea0c7b1c581',
  31: '83c70ee6d3a10230e318bc2028ddd7c4cf8fa0c4f9cf250cbd88596e585b9f0b',
  35: '056f9984faffe9d5893154d61c9e58cf7d27408c2aed1236458503642f5c0a2e',
  97: '678535bd90dc483cc2581ebddcab974a6068a53853b8fbce8b86cd25375c8010',
});
export const P010_TYPOGRAPHY_SEED_PATHS = Object.freeze([...new Set([
  ...P010_ADMISSION_INPUT_PATHS,
  PRODUCER, 'scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts',
  NATIVE_BINDING, GENERATED_DATA,
  'apps/web/lib/learning-lesson-availability.server.ts',
  'packages/demos/tests/alg-l12-p010-glossary.test.ts',
  'packages/demos/tests/alg-l12-p010-typography.test.ts',
  'packages/demos/tests/alg-l12-p010-embedded-audio.test.ts',
  'packages/demos/tests/alg-l12-p010-audio-schedule.test.ts',
  'scripts/build-g678-alg-l12-p010-text-data.mjs',
  'scripts/build-g678-alg-l12-p010-text-data.test.mjs',
  'scripts/build-g678-alg-l12-p010-typography.mjs',
  'scripts/build-g678-alg-l12-p010-typography.test.mjs',
  'scripts/build-g678-alg-l12-p010-source-canvas.mjs',
  'scripts/build-g678-alg-l12-p010-source-canvas.test.mjs',
  'scripts/export-g678-alg-l12-p010-canvas.mjs',
  'scripts/export-g678-alg-l12-p010-canvas.test.mjs',
  `${WORK}/audit/build-source-audit.mjs`, `${WORK}/audit/typography-build-source-inventory.py`,
  `${WORK}/audit/extract-source.mjs`, `${WORK}/audit/source-input.swf`,
  `${WORK}/audit/source-text-catalog.json`, `${WORK}/audit/extraction-receipt.json`,
  `${WORK}/audit/source-behavior.json`, `${WORK}/audit/source-placement.json`,
  `${WORK}/audit/source-toolchain.json`, `${WORK}/audit/source-keyterms.json`,
  `${WORK}/audit/source-stream-blocks.json`, `${WORK}/audit/source-stream.mp3`,
  `${WORK}/candidate-v1/canvas-renderer.js`, `${WORK}/candidate-v1/adapter-manifest.json`,
  `${WORK}/typography-v1/canvas-renderer.js`, `${WORK}/typography-v1/runtime-meta.json`,
  P010_GEOMETRY_PATH, INVENTORY, REPORT, INTEGRATION,
  `${WORK}/evidence/CURRENT_JS_IMPLEMENTATION_2026-09-27.md`,
  'package.json', 'package-lock.json', 'apps/web/package.json',
  'apps/web/tsconfig.json', 'packages/demos/tsconfig.json', 'apps/web/next.config.ts',
])].filter(relative => ![P010_TYPOGRAPHY_BINDING_PATH, P010_TYPOGRAPHY_CHECK_PATH,
  'apps/web/tests/g678-alg-l12-p010-host-probe.server-test.ts'].includes(relative)).sort());
export type P010TypographyPin = {path: string; bytes: number; sha256: string};
type Stable = {pin: P010TypographyPin; bytes: Buffer; modifiedAt: number};
type RiskResolution = {kind: string; disposition: string; artifactPaths: string[]};
export type P010TypographyEvidence = {
  schemaVersion: 1; kind: 'p010-technical-typography-evidence-v1';
  animationId: string; placementId: string; sourceSwfSha256: string;
  sourceCatalogContentSha256: string; checkedAt: string;
  checks: Record<string, 'passed'>;
  checkEvidence: Record<string, {artifactPaths: string[]; result: string}>;
  resolvedSourceRisks: string[]; sourceRiskResolutions: RiskResolution[];
  languagePolicy: {en: 'source'; es: 'source-fallback'};
  artifacts: P010TypographyPin[]; checkedImplementationFiles: P010TypographyPin[];
};
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sortedPins = (pins: readonly P010TypographyPin[]) => [...pins].sort((a, b) => compare(a.path, b.path));
const instanceId = (segments: readonly {timelineId: string; depth: number; generation: number; characterId: number}[]) =>
  segments.map(s => `${s.timelineId}:${s.depth}:${s.generation}:${s.characterId}`).join('/');

function relativePath(value: unknown): asserts value is string {
  assert(typeof value === 'string' && value && !path.isAbsolute(value) && !value.includes('\\') &&
    !value.split('/').some(part => !part || part === '.' || part === '..'), 'P010 ordinary relative path required');
}
function ordinaryDirectory(directory: string) {
  assert(path.isAbsolute(directory) && fs.lstatSync(directory).isDirectory() &&
    fs.realpathSync(directory) === directory, 'P010 physical directory required');
}
function stableFile(root: string, relative: string): Stable {
  relativePath(relative);
  const file = path.join(root, relative), before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    fs.realpathSync(file) === file, `P010 single-link physical file required: ${relative}`);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file, {bigint: true});
  assert(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]) &&
    after.size === BigInt(bytes.length) && fs.realpathSync(file) === file,
  `P010 changed during read: ${relative}`);
  return {pin: {path: relative, bytes: bytes.length, sha256: hash(bytes)}, bytes,
    modifiedAt: Number(after.mtimeNs) / 1_000_000};
}
function outputPath(relative: string) {
  return [P010_TYPOGRAPHY_BINDING_PATH, P010_TYPOGRAPHY_CHECK_PATH,
    'catalog/product-bridge-calibrations/g678-alg-l12-p010-current-js-v1.json',
    'catalog/product-bridge-calibrations/g678-alg-l12-p010-current-js-v1.fragment.json',
    `work/g678-shared-page-factory/g678-alg-l12-p010-current-js-v1/members/${ID}/canvas-renderer.js`].includes(relative) ||
    relative.startsWith(`${WORK}/current-js-v`) || relative.includes(`${ID}.typography-check`);
}
function localOnly(sourceRoot: unknown) {
  assert(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'P010 typography preparation is local engineering only');
  assert.equal(sourceRoot, P010_TYPOGRAPHY_SOURCE_ROOT, 'P010 exact physical AWS source root required');
  ordinaryDirectory(P010_TYPOGRAPHY_SOURCE_ROOT);
}

/** Reuse the established literal-import resolver, then independently hash every
 * returned input and the registry boundaries without traversing other pages. */
export function collectP010TypographyImportClosure(root: string, seeds: readonly string[]) {
  for (const seed of seeds) {relativePath(seed); assert(!outputPath(seed), 'P010 output cannot be a closure seed');}
  const result = collectP005TypographyImportClosure(root, seeds);
  const files = new Map<string, Stable>();
  for (const relative of [...result.files.keys(), ...result.closure.registryStateBoundaries]) {
    assert(!outputPath(relative), `P010 output cannot become an input: ${relative}`);
    files.set(relative, stableFile(root, relative));
  }
  return {files, closure: {...result.closure,
    scope: 'P010-native-text-local-host-controller-assets-and-resolved-shared-inputs',
    qualification: 'All literal local dependencies and actual registry boundary bytes are bound. Other lesson registry branches and external package contents are outside this page inventory; manifests, lockfiles and configuration are bound. This is not whole-application or original-runtime acceptance.',
  }};
}

/** Validate current structural and native semantic coverage without executing
 * Flash actions or assigning a technical, listening, or human passed result. */
/** Preserve every source field while allowing separately reviewed role/metric
 * annotations. Array order and membership remain exact. */
function projectSource(template: any, value: any): any {
  if (Array.isArray(template)) {
    assert(Array.isArray(value) && value.length === template.length, 'P010 source array membership changed');
    return template.map((item, index) => projectSource(item, value[index]));
  }
  if (template && typeof template === 'object') {
    assert(value && typeof value === 'object', 'P010 source object missing');
    return Object.fromEntries(Object.keys(template).map(key => {
      assert(Object.hasOwn(value, key), `P010 source property missing: ${key}`);
      return [key, projectSource(template[key], value[key])];
    }));
  }
  return value;
}

export const P010_GLOSSARY_BINDING_ROWS = Object.freeze([
  [22, 4, 20, 3, 1, 1, 6, 'Point', 'Point', 17],
  [23, 6, 20, 3, 3, 0, 16, 'Geometric figures', 'Geometric figures', 40],
  [24, 8, 20, 3, 5, 0, 8, 'Position', 'Position', 58],
  [27, 14, 26, 13, 0, 0, 6, 'length', 'Length', 86],
  [28, 16, 26, 13, 0, 8, 13, 'Width', 'Width', 86],
  [29, 18, 26, 13, 2, 0, 6, 'Height', 'Height', 96],
  [33, 24, 32, 23, 1, 1, 17, 'Coordinate plane/Cartesian Plane', 'Coordinate plane/Cartesian Plane', 134],
  [34, 26, 32, 23, 3, 1, 12, 'Coordinate', 'Coordinate', 165],
  [37, 32, 36, 31, 0, 0, 12, 'Ordered pair', 'Ordered pair', 181],
  [24, 34, 36, 31, 2, 1, 9, 'Position', 'Position', 195],
] as const);
export const P010_ORDERED_PAIR_BINDINGS = Object.freeze([
  {point: 'A', pair: '(5,3)', pointCharacterId: 38, pointDepth: 81, firstFragmentCharacterId: 50,
    firstFragmentDepth: 86, secondFragmentCharacterId: 55, secondFragmentDepth: 87, calloutCharacterId: 56, calloutDepth: 88},
  {point: 'B', pair: '(-4,2)', pointCharacterId: 57, pointDepth: 90, firstFragmentCharacterId: 64,
    firstFragmentDepth: 92, secondFragmentCharacterId: 69, secondFragmentDepth: 93, calloutCharacterId: 70, calloutDepth: 94},
  {point: 'C', pair: '(-3,-5)', pointCharacterId: 71, pointDepth: 96, firstFragmentCharacterId: 75,
    firstFragmentDepth: 98, secondFragmentCharacterId: 84, secondFragmentDepth: 99, calloutCharacterId: 85, calloutDepth: 100},
  {point: 'D', pair: '(5,-3)', pointCharacterId: 86, pointDepth: 102, firstFragmentCharacterId: 50,
    firstFragmentDepth: 104, secondFragmentCharacterId: 94, secondFragmentDepth: 105, calloutCharacterId: 95, calloutDepth: 106},
]);

export function validateP010SourceBindings(source: any, inventory: any, data: any,
  native: LessonTextBinding, title: string, meta: any, glossary: readonly any[]) {
  assert.equal(source.sourceSha256, P010_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(source.unparsedTags.length, 0);
  assert.equal(source.textDefinitions.length, 28); assert.equal(source.shapeDefinitions.length, 58);
  assert.equal(source.summary.textRuns, 52); assert.equal(source.summary.unresolvedRuns, 0);
  assert.equal(source.bitmapDefinitions.length, 0);
  assert.deepEqual([...new Set(source.risks.map((risk: any) => risk.kind))].sort(), [...P010_TYPOGRAPHY_SOURCE_RISKS].sort());
  assert.equal(inventory.kind, 'p010-native-typography-source-inventory');
  assert.equal(inventory.animationId, ID); assert.equal(inventory.sourceSha256, P010_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(inventory.textInstances.length, 53); assert.equal(inventory.shapeDefinitions.length, 58);
  assert.equal(inventory.runInstanceVisibilitySummary.length, 77);
  assert.equal(data.instances.length, 53); assert.equal(data.definitions.length, 28);
  assert.equal(data.frameCount, 465); assert.equal(data.frameDomain, 'sprite-96'); assert.equal(data.rootFrame, 6);
  assert.deepEqual(data.rootTranslationTwips, [8248, 5666]);
  assert.equal(native.schemaVersion, 1); assert.equal(native.version, 'p010-source-native-text-v1');
  assert.equal(native.template, 'complex-figure');
  assert.equal(native.animationId, ID); assert.equal(native.placementId, ID);
  assert.equal(native.sourceSwfSha256, P010_TYPOGRAPHY_SOURCE_SHA); assert.equal(title, TITLE);
  assert.equal(native.blocks.length, 54);
  const timelines = new Map(source.timelines.map((timeline: any) => [timeline.timelineId, timeline]));
  const definitions = new Map(source.textDefinitions.map((definition: any) => [definition.characterId, definition]));
  const main = timelines.get('sprite-96') as any, root = timelines.get('root') as any;
  assert.equal(main.declaredFrameCount, 465); assert.equal(root.declaredFrameCount, 10);
  const sourceInstances = main.instances.filter((row: any) => definitions.has(row.characterId));
  assert.deepEqual(data.instances.map((row: any) => [row.instanceId, row.characterId, row.depth, row.generation, row.firstFrame, row.lastFrameExclusive]),
    sourceInstances.map((row: any) => [row.instanceId, row.characterId, row.depth, row.generation, row.firstFrame, row.lastFrameExclusive]));
  for (const definition of data.definitions) {
    const original = definitions.get(definition.characterId) as any;
    assert(original); assert.equal(definition.sourceTagSha256, original.sourceTagSha256);
    assert.deepEqual(definition.matrix, original.matrix);
    assert.deepEqual(definition.runs.map((run: any) => [run.id, run.text]), original.runs.map((run: any) => [run.sourceTextId, run.text]));
  }
  const expectedTextIds = source.textDefinitions.flatMap((definition: any) => definition.runs.map((run: any) => run.sourceTextId)).sort();
  const actualTextIds = new Set<string>(), orders = new Set<number>(), blockIds = new Set<string>(), instanceIds = new Set<string>();
  for (const block of native.blocks) {
    assert(!blockIds.has(block.id) && !orders.has(block.readingOrder)); blockIds.add(block.id); orders.add(block.readingOrder);
    assert.equal(block.language, 'en'); assert.equal(block.valueSource, 'source-static');
    assert(block.instance && block.instance.path.length > 0);
    assert.equal(block.instance.id, instanceId(block.instance.path));
    assert(!instanceIds.has(block.instance.id), 'P010 duplicate native instance'); instanceIds.add(block.instance.id);
    for (const [index, segment] of block.instance.path.entries()) {
      const timeline = timelines.get(segment.timelineId) as any;
      assert(timeline?.instances.some((row: any) => row.depth === segment.depth &&
        row.generation === segment.generation && row.characterId === segment.characterId), 'P010 native source instance missing');
      if (index) assert.equal(segment.timelineId, `sprite-${block.instance.path[index - 1]!.characterId}`);
    }
    const leaf = block.instance.path.at(-1)!;
    if (leaf.characterId === 97) {
      assert.equal(block.id, 'title'); assert.equal(block.role, 'title');
      assert.deepEqual(block.sourceTextIds, []); assert.deepEqual(block.sourceShapeIds, [97]);
      assert.equal(block.instance.id, 'root:108:1:97'); assert.equal(block.readingOrder, 0);
    } else {
      assert.deepEqual(block.instance.path[0], {timelineId: 'root', depth: 1, generation: 1, characterId: 96});
      const definition = definitions.get(leaf.characterId) as any;
      assert(definition, 'P010 text block must name a source definition');
      assert.deepEqual(block.sourceTextIds, definition.runs.map((run: any) => run.sourceTextId));
      assert(!block.sourceShapeIds?.length);
      for (const id of block.sourceTextIds) actualTextIds.add(id);
      assert.equal(block.role, [20, 26, 32, 36].includes(leaf.characterId) ? 'body' : 'label');
      assert(data.instances.some((row: any) => block.id === row.instanceId && row.depth === leaf.depth &&
        row.generation === leaf.generation && row.characterId === leaf.characterId), 'P010 native block generation mismatch');
    }
  }
  assert.deepEqual([...actualTextIds].sort(), expectedTextIds);
  assert.deepEqual([...orders].sort((a, b) => a - b), Array.from({length: 54}, (_, index) => index));
  const shapeIds = new Set<number>();
  for (const shape of inventory.shapeDefinitions) {
    assert(!shapeIds.has(shape.characterId)); shapeIds.add(shape.characterId);
    assert.equal(shape.sourceTagSha256, source.shapeDefinitions.find((d: any) => d.characterId === shape.characterId)?.sourceTagSha256);
    const role = shape.characterId === 97 ? 'outlined-text' : [19, 25, 31, 35].includes(shape.characterId) ? 'glossary-underline' :
      [18, 30].includes(shape.characterId) ? 'clip-mask' : shape.characterId === 21 ? 'button-hit-region' : 'instructional-graphic';
    const disposition = {'outlined-text': 'replace-exact-root-title-instance-with-native-text',
      'glossary-underline': 'replace-exact-glossary-underlines-with-native-linked-term-decoration',
      'clip-mask': 'retain-source-mask-geometry-and-lifetimes',
      'button-hit-region': 'retain-hit-test-provenance-without-visible-hit-shape',
      'instructional-graphic': 'preserve-educational-geometry'}[role];
    assert.equal(shape.reviewRole, role); assert.equal(shape.nativeDisposition, disposition);
    if (shape.characterId in SHAPE_HASHES) assert.equal(shape.sourceTagSha256, SHAPE_HASHES[shape.characterId as keyof typeof SHAPE_HASHES]);
    assert.deepEqual(projectSource(source.shapeDefinitions.find((d: any) => d.characterId === shape.characterId), shape),
      source.shapeDefinitions.find((d: any) => d.characterId === shape.characterId));
    if (shape.characterId === 97) assert.equal(shape.visualTranscription, TITLE);
    else assert.equal(shape.visualTranscription, null, 'P010 no other shape is authored text');
  }
  assert.deepEqual([...shapeIds].sort((a, b) => a - b), source.shapeDefinitions.map((d: any) => d.characterId).sort((a: number, b: number) => a - b));
  const expectedGlossary = P010_GLOSSARY_BINDING_ROWS.map(([characterId, depth, textCharacterId, textDepth, run, spanStart, spanEnd, sourceKeyAttribute, dictionaryLookupKey, firstReadableFrame]) => ({
    instanceId: `sprite-96/depth-${depth}/generation-1`, characterId, sourceKeyAttribute, dictionaryLookupKey,
    sourceTextInstanceId: `sprite-96/depth-${textDepth}/generation-1`, sourceTextId: `character-${textCharacterId}/run-${run}`,
    spanStart, spanEnd, firstReadableFrame,
  }));
  assert.deepEqual(glossary, expectedGlossary, 'P010 exact instance, lexical span, key and whole-run eligibility required');
  assert.equal(new Set(glossary.map(term => term.instanceId)).size, 10);
  assert.equal(new Set(glossary.map(term => term.sourceKeyAttribute)).size, 9);
  for (const term of glossary) {
    const originalButton = source.buttonDefinitions.find((button: any) => button.characterId === term.characterId);
    assert(originalButton && main.instances.some((row: any) => row.instanceId === term.instanceId && row.characterId === term.characterId));
    const originalText = main.instances.find((row: any) => row.instanceId === term.sourceTextInstanceId);
    assert(originalText);
    const originalRun = (definitions.get(originalText.characterId) as any).runs.find((run: any) => run.sourceTextId === term.sourceTextId);
    assert(originalRun && Number.isSafeInteger(term.spanStart) && Number.isSafeInteger(term.spanEnd));
    assert(term.spanStart >= 0 && term.spanStart < term.spanEnd && term.spanEnd <= originalRun.text.length);
    const expectedText = term.sourceKeyAttribute === 'Point' ? 'point' : term.sourceKeyAttribute === 'Geometric figures' ? 'geometric figure' :
      term.sourceKeyAttribute === 'Position' ? 'position' : term.sourceKeyAttribute === 'Width' ? 'width' :
      term.sourceKeyAttribute === 'Height' ? 'height' : term.sourceKeyAttribute === 'Coordinate plane/Cartesian Plane' ? 'coordinate plane' :
      term.sourceKeyAttribute === 'Coordinate' ? 'coordinates' : term.sourceKeyAttribute === 'Ordered pair' ? 'ordered pair' : 'length';
    assert.equal(originalRun.text.slice(term.spanStart, term.spanEnd), expectedText);
    const visibility = inventory.runInstanceVisibilitySummary.find((row: any) => row.instanceId === term.sourceTextInstanceId && row.sourceTextId === term.sourceTextId);
    assert.equal(term.firstReadableFrame, visibility?.firstAllInkBoundsContainedAndFullOpacityFrame);
    assert.equal(term.firstReadableFrame, data.definitions.flatMap((row: any) => row.runs).find((run: any) => run.id === term.sourceTextId)?.revealFrame);
  }
  assert.deepEqual(inventory.glossaryButtons.map((row: any) => [row.characterId, row.sourceKeyAttribute]),
    [[22, 'Point'], [23, 'Geometric figures'], [24, 'Position'], [27, 'length'], [28, 'Width'], [29, 'Height'],
      [33, 'Coordinate plane/Cartesian Plane'], [34, 'Coordinate'], [37, 'Ordered pair']]);
  for (const button of inventory.glossaryButtons) {
    const original = source.buttonDefinitions.find((row: any) => row.characterId === button.characterId);
    assert(original); assert.deepEqual(projectSource(original, button), original);
  }
  for (const row of inventory.glossaryInstances) {
    assert.equal(row.sourceRunId, row.sourceTextId);
    const original = main.instances.find((instance: any) => instance.instanceId === row.instanceId);
    assert(original); assert.equal(row.sourceFirstFrame, original.firstFrame); assert.equal(row.sourceLastFrameExclusive, original.lastFrameExclusive);
    const textInstance = main.instances.find((instance: any) => instance.instanceId === row.sourceTextInstanceId);
    const definition = definitions.get(textInstance.characterId) as any;
    const sourceRun = definition.runs.find((run: any) => run.sourceTextId === row.sourceTextId);
    assert.equal(row.sourceLiteralSpan, sourceRun.text.slice(row.spanStart, row.spanEnd));
  }
  // Inventory has both IDs because a source run is distinct from a button instance.
  assert.deepEqual(inventory.glossaryInstances.map((row: any) => ({instanceId: row.instanceId, characterId: row.characterId,
    sourceKeyAttribute: row.sourceKeyAttribute, dictionaryLookupKey: row.dictionaryLookupKey, sourceTextInstanceId: row.sourceTextInstanceId,
    sourceTextId: row.sourceTextId, spanStart: row.spanStart, spanEnd: row.spanEnd, firstReadableFrame: row.firstReadableFrame})), expectedGlossary);
  const pairs = P010_ORDERED_PAIR_BINDINGS.map(row => {
    const text = (characterId: number) => (definitions.get(characterId) as any).runs.map((run: any) => run.text).join('');
    assert.equal(text(row.pointCharacterId), row.point);
    assert.equal(text(row.firstFragmentCharacterId) + text(row.secondFragmentCharacterId), row.pair);
    assert.equal(text(row.calloutCharacterId).replace(/ +/gu, ' '), `Point ${row.point} has coordinates of ${row.pair}.`);
    const sourceRows = [[row.pointCharacterId, row.pointDepth], [row.firstFragmentCharacterId, row.firstFragmentDepth],
      [row.secondFragmentCharacterId, row.secondFragmentDepth], [row.calloutCharacterId, row.calloutDepth]].map(([characterId, depth]) => {
      const found = main.instances.find((instance: any) => instance.characterId === characterId && instance.depth === depth && instance.generation === 1);
      assert(found && found.lastFrameExclusive === 466); return found;
    });
    const reviewed = inventory.orderedPairs.find((pair: any) => pair.letter === row.point);
    assert(reviewed); assert.equal(reviewed.literal, row.pair);
    assert.deepEqual(reviewed.semanticCoordinates, row.pair.slice(1, -1).split(',').map(Number));
    assert.equal(reviewed.coordinateComponents.length, 2);
    assert.equal(reviewed.reusedFirstCoordinateDefinitionRequiresInstanceIdentity, row.firstFragmentCharacterId === 50);
    assert.equal(reviewed.calloutUsesThreeDistinctRunBaselines, true);
    const components = [reviewed.letterComponent, ...reviewed.coordinateComponents, reviewed.callout];
    for (const [index, component] of components.entries()) {
      const instance = sourceRows[index];
      assert.equal(component.instanceId, instance.instanceId); assert.equal(component.characterId, instance.characterId);
      assert.equal(component.literalText, text(instance.characterId));
      assert.equal(component.firstFrame, instance.firstFrame); assert.equal(component.lastFrameExclusive, instance.lastFrameExclusive);
      const geometric = inventory.textInstances.find((item: any) => item.instanceId === instance.instanceId);
      assert.deepEqual(component.matrixTwips, geometric.firstPose.matrix);
      assert.deepEqual(component.runVisibility, inventory.runInstanceVisibilitySummary.filter((item: any) => item.instanceId === instance.instanceId));
    }
    const calloutRuns = data.definitions.find((item: any) => item.characterId === row.calloutCharacterId).runs;
    assert.equal(new Set(calloutRuns.map((run: any) => JSON.stringify(run.baselineTwips))).size, 3);
    return {...row, sourceInstances: sourceRows.map((instance: any) => ({instanceId: instance.instanceId,
      firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive}))};
  });
  assert.equal(inventory.orderedPairs.length, 4);
  assert.equal(inventory.nativeRunInstanceMetrics.length, 77);
  const point = (matrix: number[], x: number, y: number) => [matrix[0]! * x + matrix[2]! * y + matrix[4]!, matrix[1]! * x + matrix[3]! * y + matrix[5]!];
  for (const metric of inventory.nativeRunInstanceMetrics) {
    const instance = inventory.textInstances.find((row: any) => row.instanceId === metric.instanceId);
    assert(instance);
    const definition = data.definitions.find((row: any) => row.characterId === instance.characterId);
    const run = definition.runs.find((row: any) => row.id === metric.sourceTextId); assert(run);
    const visibility = inventory.runInstanceVisibilitySummary.find((row: any) => row.instanceId === metric.instanceId && row.sourceTextId === metric.sourceTextId);
    assert(visibility); assert.deepEqual(projectSource(visibility, metric), visibility);
    assert.equal(metric.literalText, run.text); assert.deepEqual(metric.baselineTwips, run.baselineTwips);
    assert.equal(metric.advanceTwips, run.advanceTwips); assert.equal(metric.fontHeightTwips, run.fontHeightTwips);
    assert.equal(metric.revealFrame, run.revealFrame); assert.equal(metric.baselineOwnedByRun, true);
    const local = point(definition.matrix, run.baselineTwips[0], run.baselineTwips[1]);
    const stage = point(instance.firstPose.matrix, local[0]!, local[1]!);
    assert.deepEqual(metric.stageBaselineAtFirstPlacementPixels, [(stage[0]! + 8248) / 20, (stage[1]! + 5666) / 20]);
  }
  assert.equal(new Set(inventory.nativeRunInstanceMetrics.map((row: any) => `${row.instanceId}/${row.sourceTextId}`)).size, 77);
  const underlines = [[19, 2, 10], [25, 12, 69], [31, 22, 113], [35, 30, 173]].map(([characterId, depth, firstFrame]) => ({
    id: `root:1:1:96/sprite-96:${depth}:1:${characterId}`, firstFrame, lastFrameExclusive: 466,
  }));
  const expectedSuppression = [...data.instances.map((row: any) => ({
    id: `root:1:1:96/sprite-96:${row.depth}:${row.generation}:${row.characterId}`,
    firstFrame: row.firstFrame, lastFrameExclusive: row.lastFrameExclusive,
  })), ...underlines, {id: 'root:108:1:97', firstFrame: 1, lastFrameExclusive: 466}].sort((a, b) => compare(a.id, b.id));
  assert.deepEqual([...meta.exactSuppressionInstances].sort((a, b) => compare(a.id, b.id)), expectedSuppression);
  assert.deepEqual(inventory.nativeSuppressionInstances.map((row: any) => ({id: row.id, firstFrame: row.firstFrame,
    lastFrameExclusive: row.lastFrameExclusive})).sort((a: any, b: any) => compare(a.id, b.id)), expectedSuppression);
  assert.equal(meta.exactSuppressionInstances.length, 58);
  assert.equal(meta.animationId, ID); assert.equal(meta.version, 'p010-source-native-text-v1');
  assert.equal(meta.sourceSha256, P010_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(meta.renderScale, 2); assert.deepEqual(meta.canvas, {width: 1600, height: 1200});
  assert.equal(meta.bitmapCount, 0); assert.equal(meta.acceptanceEffect, 'none');
  assert.equal(meta.registered, false); assert.equal(meta.audioEnabled, false);
  return {sourceRisks: [...P010_TYPOGRAPHY_SOURCE_RISKS], underlines, orderedPairs: pairs, sourceTextIds: expectedTextIds};
}

export async function buildCandidate({root = ROOT, sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT} = {}) {
  localOnly(sourceRoot); ordinaryDirectory(root);
  const sourceFile = stableFile(P010_TYPOGRAPHY_SOURCE_ROOT, P010_TYPOGRAPHY_SOURCE_PATH);
  assert.equal(sourceFile.pin.bytes, 183770); assert.equal(sourceFile.pin.sha256, P010_TYPOGRAPHY_SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(sourceFile.bytes);
  const catalogSha256 = hash(JSON.stringify(source)); // Recomputed from actual source each time.
  const files = new Map<string, Stable>();
  const read = (relative: string) => {
    const file = stableFile(root, relative); files.set(relative, file); return file;
  };
  const auditedCatalog = read(`${WORK}/audit/source-text-catalog.json`);
  assert.deepEqual(JSON.parse(auditedCatalog.bytes.toString()), source, 'P010 stored catalog differs from fresh physical source');
  assert.equal(read(`${WORK}/audit/source-input.swf`).pin.sha256, sourceFile.pin.sha256);
  const inventoryFile = read(INVENTORY), inventory = JSON.parse(inventoryFile.bytes.toString());
  assert.equal(inventoryFile.pin.sha256, SOURCE_INVENTORY_SHA, 'P010 reviewed source inventory changed');
  const geometryFile = read(P010_GEOMETRY_PATH), geometry = JSON.parse(geometryFile.bytes.toString());
  assert.equal(geometryFile.pin.sha256, P010_GEOMETRY_SHA, 'P010 immutable source geometry changed');
  for (const field of ['sourceEntryCondition', 'fontGlyphInkBounds', 'textDefinitions', 'textInstances',
    'runInstanceVisibilitySummary', 'maskDefinitions'])
    assert.deepEqual(projectSource(geometry[field], inventory[field]), geometry[field], `P010 inventory source geometry changed: ${field}`);
  assert.deepEqual(inventory.masks, geometry.maskInstances);
  for (const [key, value] of Object.entries(source.summary)) assert.equal(inventory.summary[key], value);
  assert.equal(inventory.summary.textPlacementGenerations, 53); assert.equal(inventory.summary.runInstancePairs, 77);
  assert.deepEqual(inventory.sourceGeometry, geometryFile.pin);
  const textData = collectP010TextData(sourceFile.bytes, geometry);
  const expectedDataBytes = '// Generated from the hash-bound P010 source; do not edit.\n' +
    `// Glyph/mask source geometry SHA-256: ${geometryFile.pin.sha256}\n` +
    `export const P010_TEXT_DATA = ${JSON.stringify(textData, null, 2)} as const;\n`;
  assert.equal(read(GENERATED_DATA).bytes.toString(), expectedDataBytes, 'P010 generated native data differs from actual source');
  const moduleFile = read(NATIVE_BINDING);
  const nativeModule = await import(`${pathToFileURL(path.join(root, NATIVE_BINDING)).href}?sha256=${moduleFile.pin.sha256}`) as {
    P010_TEXT_BINDING: LessonTextBinding; P010_TITLE: string;
  };
  const native = JSON.parse(JSON.stringify(nativeModule.P010_TEXT_BINDING)) as LessonTextBinding;
  const metaFile = read(`${WORK}/typography-v1/runtime-meta.json`), meta = JSON.parse(metaFile.bytes.toString());
  const glossaryFile = read('packages/demos/src/alg-l12-p010-glossary.ts');
  const glossary = await import(`${pathToFileURL(path.join(root, glossaryFile.pin.path)).href}?sha256=${glossaryFile.pin.sha256}`) as {
    P010_GLOSSARY_TERMS: readonly any[];
  };
  const sourceDetails = validateP010SourceBindings(source, inventory, textData, native, nativeModule.P010_TITLE, meta, glossary.P010_GLOSSARY_TERMS);
  const nativeRuntime = read(`${WORK}/typography-v1/canvas-renderer.js`);
  assert.equal(meta.runtimeSha256, nativeRuntime.pin.sha256); assert.equal(meta.runtimeBytes, nativeRuntime.pin.bytes);
  const original = read(`${WORK}/candidate-v1/canvas-renderer.js`);
  assert.equal(meta.sourceCandidateSha256, original.pin.sha256);
  assert.equal(meta.generatorSha256, read('scripts/build-g678-alg-l12-p010-typography.mjs').pin.sha256);
  const regenerated = buildP010Typography(original.bytes.toString(), sourceFile.bytes);
  assert.equal(regenerated.runtime, nativeRuntime.bytes.toString(), 'P010 native suppression runtime differs from reproducible generator');
  assert.equal(regenerated.placedTextCalls, meta.placedTextCalls);
  const integrationFile = read(INTEGRATION), integration = JSON.parse(integrationFile.bytes.toString());
  assert.equal(integration.kind, 'g678-lesson-typography-integration-v1');
  assert(Array.isArray(integration.sharedFiles) && integration.sharedFiles.length > 0);
  const declared = (reference: P010TypographyPin) => {
    relativePath(reference.path); assert(!outputPath(reference.path));
    assert(SHA.test(reference.sha256) && Number.isSafeInteger(reference.bytes) && reference.bytes >= 0);
    const current = read(reference.path); assert.deepEqual(current.pin, reference, `P010 declared dependency drift: ${reference.path}`);
  };
  for (const reference of integration.sharedFiles) declared(reference);
  const externalSourceFiles: P010TypographyPin[] = [];
  const referenced = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.path === 'string' && SHA.test(value.sha256 ?? '') && Number.isSafeInteger(value.bytes)) {
      if (!path.isAbsolute(value.path)) declared({path: value.path, bytes: value.bytes, sha256: value.sha256});
      else {
        const allowed = [P010_TYPOGRAPHY_SOURCE_PATH, 'G6-G8-shared/ALG001/L12/index.xml'];
        const relative = allowed.find(item => path.join(P010_TYPOGRAPHY_SOURCE_ROOT, item) === value.path);
        assert(relative, 'P010 inventory cannot broaden physical source scope');
        const external = stableFile(P010_TYPOGRAPHY_SOURCE_ROOT, relative);
        assert.equal(external.pin.bytes, value.bytes); assert.equal(external.pin.sha256, value.sha256);
        if (relative !== P010_TYPOGRAPHY_SOURCE_PATH && !externalSourceFiles.some(pin => pin.path === value.path))
          externalSourceFiles.push({...external.pin, path: value.path});
      }
    }
    for (const child of Object.values(value)) referenced(child);
  };
  referenced(inventory.inputs); referenced(inventory.generator);
  const manifest = JSON.parse(read(`${WORK}/candidate-v1/adapter-manifest.json`).bytes.toString());
  assert.equal(manifest.animationId, ID); assert.deepEqual(manifest.source,
    {path: path.join(P010_TYPOGRAPHY_SOURCE_ROOT, P010_TYPOGRAPHY_SOURCE_PATH), bytes: 183770, sha256: P010_TYPOGRAPHY_SOURCE_SHA});
  assert.equal(manifest.runtimeSha256, original.pin.sha256); assert.equal(manifest.runtimeBytes, original.pin.bytes);
  referenced(manifest.inputs); referenced(manifest.generatorDependencies); referenced(manifest.sourceIndex);
  declared(inventory.shapeClassificationSource);
  const classification = JSON.parse(files.get(inventory.shapeClassificationSource.path)!.bytes.toString());
  assert.equal(classification.animationId, ID); assert.equal(classification.definitionCount, 58);
  const classifiedShapes = new Map(classification.definitions.map((shape: any) => [shape.characterId, shape]));
  const shapeEvidence = new Map<number, P010TypographyPin[]>();
  for (const shape of inventory.shapeDefinitions) {
    assert.deepEqual(shape.classificationEvidence, classifiedShapes.get(shape.characterId), 'P010 reviewed shape classification changed');
    assert(Array.isArray(shape.classificationEvidence.evidence) && shape.classificationEvidence.evidence.length > 0);
    const references = shape.classificationEvidence.evidence.map((reference: any) => {
      relativePath(reference.path);
      const pin = {path: path.posix.join(path.posix.dirname(inventory.shapeClassificationSource.path), reference.path),
        bytes: reference.bytes, sha256: reference.sha256};
      declared(pin); return pin;
    });
    shapeEvidence.set(shape.characterId, references);
  }
  const keyterms = JSON.parse(read(`${WORK}/audit/source-keyterms.json`).bytes.toString());
  assert.equal(keyterms.animationId, ID); assert.equal(keyterms.sourceSha256, P010_TYPOGRAPHY_SOURCE_SHA);
  const dictionaryRoot = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
  ordinaryDirectory(dictionaryRoot);
  assert.equal(keyterms.sources.length, 2);
  for (const [index, sourceDocument] of keyterms.sources.entries()) {
    assert.equal(sourceDocument.path, `${dictionaryRoot}/${index === 0 ? 'L1KTE01' : 'L1KTS01'}.xml`);
    const document = stableFile(dictionaryRoot, path.basename(sourceDocument.path));
    assert.equal(document.pin.bytes, sourceDocument.bytes); assert.equal(document.pin.sha256, sourceDocument.sha256);
    externalSourceFiles.push({...document.pin, path: sourceDocument.path});
    const lines = document.bytes.toString().split(/\r?\n/u);
    for (const term of glossary.P010_GLOSSARY_TERMS) {
      const entries = sourceDocument.records.filter((row: any) => row.literalKey === term.sourceKeyAttribute);
      assert.equal(entries.length, 1); const entry = entries[0];
      assert.deepEqual(entry.lookup, {kind: term.sourceKeyAttribute === 'length' ? 'explicit-case-crosswalk' : 'exact-literal',
        from: term.sourceKeyAttribute, to: term.dictionaryLookupKey, genericCaseNormalizationAllowed: false});
      const record = lines.slice(entry.firstLine - 1, entry.lastLine).join('\n');
      assert(record.includes(`<${entry.sourceTagName} ${entry.sourceAttributes}>`), 'P010 glossary source record differs');
      assert.equal(entry.definitionSha256, hash(`${entry.definitionEn}~LNG~${entry.definitionEs}`));
      assert(record.includes(`${entry.definitionEn}~LNG~${entry.definitionEs}`), 'P010 glossary literal definition differs');
    }
  }
  const report = read(REPORT);
  assert.equal(report.pin.sha256, SOURCE_ROLE_REPORT_SHA, 'P010 reviewed source-role report changed');
  // Complete shape hashes live in the reviewed inventory. The human-readable
  // report names the roles and title; it intentionally does not duplicate them.
  for (const marker of [TITLE, P010_TYPOGRAPHY_SOURCE_SHA])
    assert(report.bytes.toString().includes(marker), `P010 source-role report marker missing: ${marker}`);
  const seeds = [...new Set([...P010_TYPOGRAPHY_SEED_PATHS, ...files.keys(),
    ...integration.sharedFiles.map((item: P010TypographyPin) => item.path)])].sort();
  const collected = collectP010TypographyImportClosure(root, seeds);
  for (const file of files.values()) assert.deepEqual(collected.files.get(file.pin.path)?.pin, file.pin,
    `P010 prepared input changed before closure: ${file.pin.path}`);
  const implementationFiles = sortedPins([...collected.files.values()].map(file => file.pin));
  const roleDecisions = inventory.shapeDefinitions.map((shape: any) => ({
    kind: shape.characterId === 97 ? 'outlined-text' : [19, 25, 31, 35].includes(shape.characterId)
      ? 'decorative-glossary-underlines' : shape.reviewRole === 'clip-mask' ? 'source-mask-geometry' :
        shape.reviewRole === 'button-hit-region' ? 'source-glossary-hit-geometry' : 'source-educational-geometry',
    role: shape.characterId === 97 ? 'title' : 'decoration',
    ...(shape.characterId === 97 ? {semanticValue: TITLE} : {}),
    sourceShapeHashes: [{characterId: shape.characterId, sourceTagSha256: shape.sourceTagSha256}],
    sourceInstanceIds: shape.sourceInstances.map((row: any) => row.instanceId),
    disposition: shape.nativeDisposition, authoredWords: shape.characterId === 97,
    evidence: [inventoryFile.pin, report.pin, files.get(inventory.shapeClassificationSource.path)!.pin, ...shapeEvidence.get(shape.characterId)!],
  }));
  const binding = {...native, sourceRelativePath: P010_TYPOGRAPHY_SOURCE_PATH,
    sourceCatalogContentSha256: catalogSha256, sourceRoleDecisions: roleDecisions,
    languagePolicy: {en: 'source', es: 'source-fallback'},
    nativeTextEvidence: {textDefinitions: 28, textRuns: 52, textPlacementGenerations: 53, runInstancePairs: 77,
      sourceTextIds: sourceDetails.sourceTextIds, exactSuppressionInstances: meta.exactSuppressionInstances,
      orderedPairs: sourceDetails.orderedPairs, underlines: sourceDetails.underlines,
      sourceGeometry: geometryFile.pin, glossaryDefinitionCount: 9, glossaryInstanceCount: 10,
      glossary: glossary.P010_GLOSSARY_TERMS, inventory: inventoryFile.pin,
      metadata: metaFile.pin, runtime: nativeRuntime.pin, originalCandidate: original.pin},
    sourceRiskEvidence: {sourceParserRisks: sourceDetails.sourceRisks,
      sourceDisposition: report.pin, sourceInventory: inventoryFile.pin,
      technicalRiskCheckRecorded: false},
    externalSourceFiles: [ {...sourceFile.pin, path: path.join(P010_TYPOGRAPHY_SOURCE_ROOT, P010_TYPOGRAPHY_SOURCE_PATH)},
      ...externalSourceFiles ],
    generator: {path: PRODUCER, version: '1.0.0', sha256: collected.files.get(PRODUCER)!.pin.sha256},
    implementation: {status: 'candidate', files: implementationFiles, closure: collected.closure},
    unresolved: [
      'All twelve technical typography results require independently authored, current hash-bound local host evidence.',
      'Native lexical glossary spans, whole-run eligibility and coordinate presentation do not establish original clipped-hit or visual parity.',
      'Registry or host changes invalidate this inventory and require a fresh candidate and receipt before finalization.',
    ],
    independentPending: ['Original Flash runtime and fidelity', 'Named audio listening and synchronization acceptance',
      'Human visual and Owner acceptance', 'Strict completion, release and publication'],
    independentAcceptance: {registered: false, originalRuntimeAccepted: false, flashFidelityAccepted: false,
      audioAccepted: false, humanReviewed: false, ownerAccepted: false, strictComplete: false, published: false},
    preparationOnly: true,
  };
  for (const pin of implementationFiles) assert.deepEqual(stableFile(root, pin.path).pin, pin, `P010 input changed during preparation: ${pin.path}`);
  assert.deepEqual(stableFile(P010_TYPOGRAPHY_SOURCE_ROOT, P010_TYPOGRAPHY_SOURCE_PATH).pin, sourceFile.pin);
  for (const pin of externalSourceFiles) {
    const base = pin.path.startsWith(`${dictionaryRoot}/`) ? dictionaryRoot : P010_TYPOGRAPHY_SOURCE_ROOT;
    assert.deepEqual({...stableFile(base, path.relative(base, pin.path)).pin, path: pin.path}, pin);
  }
  return {binding, bytes: jsonBytes(binding)};
}
export const prepareP010TypographyBinding = buildCandidate;
export type P010TypographyPreparation = Awaited<ReturnType<typeof buildCandidate>>;

/** A receipt supplies actual results, never this producer. Each of the twelve
 * results and each source-risk disposition must cite an independently saved
 * artifact; implementation code alone is not an observation artifact. */
export function validateEvidence(evidencePath: string, expected: {
  implementationFiles: readonly P010TypographyPin[]; sourceRisks: readonly string[];
  sourceCatalogContentSha256: string;
}, root = ROOT, now = Date.now()) {
  ordinaryDirectory(root); relativePath(evidencePath);
  assert(!outputPath(evidencePath) && !expected.implementationFiles.some(pin => pin.path === evidencePath), 'P010 receipt cannot be an implementation input/output');
  const receiptFile = stableFile(root, evidencePath);
  const evidence = JSON.parse(receiptFile.bytes.toString()) as P010TypographyEvidence;
  assert.equal(evidence.schemaVersion, 1); assert.equal(evidence.kind, 'p010-technical-typography-evidence-v1');
  assert.equal(evidence.animationId, ID); assert.equal(evidence.placementId, ID);
  assert.equal(evidence.sourceSwfSha256, P010_TYPOGRAPHY_SOURCE_SHA);
  assert(SHA.test(expected.sourceCatalogContentSha256));
  assert.equal(evidence.sourceCatalogContentSha256, expected.sourceCatalogContentSha256);
  const checkedAt = Date.parse(evidence.checkedAt);
  assert(typeof evidence.checkedAt === 'string' && Number.isFinite(checkedAt) && checkedAt <= now + 1000, 'P010 real nonfuture checkedAt required');
  assert.deepEqual(evidence.languagePolicy, {en: 'source', es: 'source-fallback'});
  assert.deepEqual(Object.keys(evidence.checks ?? {}).sort(), [...P010_TYPOGRAPHY_CHECKS].sort(), 'P010 exactly twelve technical checks required');
  for (const check of P010_TYPOGRAPHY_CHECKS) assert.equal(evidence.checks[check], 'passed', `P010 technical check not passed: ${check}`);
  const risks = [...new Set(expected.sourceRisks)].sort();
  assert(Array.isArray(evidence.resolvedSourceRisks));
  assert.deepEqual([...evidence.resolvedSourceRisks].sort(), risks, 'P010 every current source risk must be resolved exactly once');
  const observedFiles: Stable[] = [];
  const readReferences = (references: readonly P010TypographyPin[], label: string) => {
    assert(Array.isArray(references) && references.length > 0, `P010 nonempty ${label} required`);
    const seen = new Set<string>();
    return references.map(reference => {
      assert(reference && SHA.test(reference.sha256 ?? '') && Number.isSafeInteger(reference.bytes) && reference.bytes >= 0, 'P010 exact reference hash and size required');
      relativePath(reference.path);
      assert(!outputPath(reference.path) && reference.path !== evidencePath && !seen.has(reference.path), `P010 circular or duplicate ${label}`);
      seen.add(reference.path); const current = stableFile(root, reference.path);
      assert.deepEqual(current.pin, reference, `P010 stale ${label}: ${reference.path}`);
      observedFiles.push(current); return current.pin;
    }).sort((a, b) => compare(a.path, b.path));
  };
  const artifacts = readReferences(evidence.artifacts, 'observation artifact');
  const checked = readReferences(evidence.checkedImplementationFiles, 'checked implementation');
  assert.deepEqual(checked, sortedPins(expected.implementationFiles), 'P010 receipt must bind the entire current implementation inventory without omissions/extras');
  const inputPaths = new Set(checked.map(pin => pin.path));
  assert(artifacts.every(pin => !inputPaths.has(pin.path)), 'P010 implementation is not an independently observed result artifact');
  const artifactPaths = new Set(artifacts.map(pin => pin.path));
  const referencesArtifact = (value: {artifactPaths: string[]; result?: string; disposition?: string}, label: string) => {
    assert(value && typeof (value.result ?? value.disposition) === 'string' && (value.result ?? value.disposition)!.trim(), `P010 concrete ${label} result required`);
    assert(Array.isArray(value.artifactPaths) && value.artifactPaths.length > 0 &&
      new Set(value.artifactPaths).size === value.artifactPaths.length && value.artifactPaths.every(p => artifactPaths.has(p)), `P010 ${label} must cite checked observation artifacts`);
  };
  assert.deepEqual(Object.keys(evidence.checkEvidence ?? {}).sort(), [...P010_TYPOGRAPHY_CHECKS].sort(), 'P010 observation mapping required for every technical check');
  for (const check of P010_TYPOGRAPHY_CHECKS) referencesArtifact(evidence.checkEvidence[check]!, check);
  assert(Array.isArray(evidence.sourceRiskResolutions) && evidence.sourceRiskResolutions.length === risks.length);
  const resolved = new Set<string>();
  for (const resolution of evidence.sourceRiskResolutions) {
    assert(risks.includes(resolution.kind) && !resolved.has(resolution.kind), 'P010 exact nonduplicate source-risk disposition required');
    resolved.add(resolution.kind); referencesArtifact(resolution, resolution.kind);
  }
  for (const file of observedFiles) {
    assert(file.modifiedAt <= checkedAt + 1000, `P010 receipt predates checked file: ${file.pin.path}`);
    assert.deepEqual(stableFile(root, file.pin.path).pin, file.pin, `P010 evidence changed while validating: ${file.pin.path}`);
  }
  assert.deepEqual(stableFile(root, evidencePath).pin, receiptFile.pin);
  return {evidence, receipt: receiptFile.pin, artifacts, checkedImplementationFiles: checked};
}
export const validateP010TypographyEvidence = validateEvidence;

/** Rebuild against physical source and every current dependency before accepting
 * an independently authored receipt. This cannot finalize a stale preparation. */
export async function finalize(prepared: P010TypographyPreparation, evidencePath: string,
  options: {root?: string; sourceRoot?: string} = {}) {
  const fresh = await buildCandidate(options);
  assert(prepared.bytes.equals(jsonBytes(prepared.binding)), 'P010 preparation serialization changed');
  assert.deepEqual(prepared.binding, fresh.binding, 'P010 preparation is stale; rebuild candidate and independent receipt');
  const verified = validateEvidence(evidencePath, {
    implementationFiles: fresh.binding.implementation.files,
    sourceRisks: fresh.binding.sourceRiskEvidence.sourceParserRisks,
    sourceCatalogContentSha256: fresh.binding.sourceCatalogContentSha256,
  }, options.root ?? ROOT);
  const binding = {...fresh.binding, implementation: {...fresh.binding.implementation, status: 'implemented'},
    sourceRiskEvidence: {...fresh.binding.sourceRiskEvidence, technicalRiskCheckRecorded: true,
      technicalReceipt: verified.receipt, resolutions: verified.evidence.sourceRiskResolutions},
    unresolved: [], preparationOnly: false,
    technicalFinalization: {kind: 'p010-technical-typography-finalization-v1', checkedAt: verified.evidence.checkedAt,
      receipt: verified.receipt, scope: 'Local modern My Lesson source-bound native typography only; all independent acceptance gates remain pending.'},
  };
  const bytes = jsonBytes(binding);
  const check = {schemaVersion: 1, kind: 'g678-lesson-typography-check-v1', animationId: ID, placementId: ID,
    sourceSwfSha256: P010_TYPOGRAPHY_SOURCE_SHA, sourceCatalogContentSha256: binding.sourceCatalogContentSha256,
    bindingSha256: hash(bytes), checkedAt: verified.evidence.checkedAt, checks: verified.evidence.checks,
    checkEvidence: verified.evidence.checkEvidence, resolvedSourceRisks: verified.evidence.resolvedSourceRisks,
    sourceRiskResolutions: verified.evidence.sourceRiskResolutions, languagePolicy: verified.evidence.languagePolicy,
    artifacts: sortedPins([...verified.artifacts, verified.receipt]), checkedImplementationFiles: verified.checkedImplementationFiles,
    producer: binding.generator, receipt: verified.receipt, technicalScope: binding.technicalFinalization.scope,
    humanReviewed: false, ownerAccepted: false, originalRuntimeAccepted: false,
    audioAccepted: false, strictComplete: false, published: false,
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none',
  };
  return {binding, bytes, check, checkBytes: jsonBytes(check), verified};
}
export const finalizeP010TypographyBinding = finalize;

export async function main(argv = process.argv.slice(2)) {
  assert(argv.length === 1 && argv[0] === '--dry-run' || argv.length === 2 && argv[0] === '--evidence',
    'Usage: tsx scripts/prepare-g678-alg-l12-p010-typography-binding.mts --dry-run | --evidence <receipt-relative-path>; read-only, no --write');
  const prepared = await buildCandidate();
  const result = argv[0] === '--evidence' ? await finalize(prepared, argv[1]!) : prepared;
  process.stdout.write(`${JSON.stringify({status: argv[0] === '--evidence' ? 'FINALIZED_IN_MEMORY_NOT_WRITTEN' : 'P010_SOURCE_BOUND_CANDIDATE_NOT_WRITTEN',
    bindingPath: P010_TYPOGRAPHY_BINDING_PATH, bindingBytes: result.bytes.length,
    bindingSha256: hash(result.bytes), implementationFiles: result.binding.implementation.files.length,
    sourceCatalogContentSha256: result.binding.sourceCatalogContentSha256,
    preparationOnly: result.binding.preparationOnly, independentAcceptanceEffect: 'none'})}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;});
