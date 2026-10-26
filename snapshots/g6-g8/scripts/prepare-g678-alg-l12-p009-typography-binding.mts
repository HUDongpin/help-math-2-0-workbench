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
import {collectP009TextData} from './build-g678-alg-l12-p009-text-data.mjs';
import {buildP009Typography} from './build-g678-alg-l12-p009-typography.mjs';
import {REQUIRED_WORKSPACE_PATHS as P009_ADMISSION_INPUT_PATHS} from './prepare-g678-alg-l12-p009-current-js-v2.mjs';
import type {LessonTextBinding} from '../packages/demos/src/lesson-text-contract';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P009_TYPOGRAPHY_ID = 'shared-alg001-l12-p009';
export const P009_TYPOGRAPHY_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P009_TYPOGRAPHY_SOURCE_PATH = 'G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
export const P009_TYPOGRAPHY_SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
export const P009_TYPOGRAPHY_BINDING_PATH = `catalog/typography-v1/g678-page-bindings/${P009_TYPOGRAPHY_ID}.json`;
export const P009_TYPOGRAPHY_CHECK_PATH = `catalog/typography-v1/g678-checks/${P009_TYPOGRAPHY_ID}.json`;
export const P009_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
export const P009_TYPOGRAPHY_SOURCE_RISKS = Object.freeze([
  'shape-text-unclassified', 'button-runtime-state-and-actions-not-interpreted',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved',
]);
const ID = P009_TYPOGRAPHY_ID, WORK = `migrations/${ID}`;
const PRODUCER = 'scripts/prepare-g678-alg-l12-p009-typography-binding.mts';
const NATIVE_BINDING = 'packages/demos/src/alg-l12-p009-typography.ts';
const GENERATED_DATA = 'packages/demos/src/generated/alg-l12-p009-text-data.ts';
const INVENTORY = `${WORK}/audit/typography-source-inventory-v1.json`;
const REPORT = `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`;
const INTEGRATION = 'catalog/typography-v1/g678-integration.json';
const TITLE = 'Graphing in the Coordinate Plane: Vocabulary';
const SOURCE_INVENTORY_SHA = '362c4376b4c8bc2af9660ea197857d681c135827aae2e9afd525e70c38925938';
const SOURCE_ROLE_REPORT_SHA = '1cd0aecc19a96fc4548d191ecda20666b466c64121f28b8eb45513357e82c3ec';
const SHA = /^[a-f0-9]{64}$/u;
const SHAPE_HASHES = Object.freeze({
  2: 'bd8e3e7da8afb875aa8071c120ca36288c81479ce8460708d65b9dbef9669890',
  25: '064a4bd4326341cd46dd30cdc64a538bd7c5b2f0d36ee37e4ef964bc20cfa4d2',
  30: '8c34307e9dae92159d1556e76e8483a3beeedf67c311023f4ca4c53d330aa371',
  63: 'b297a472987aac7274fbe9d5bb2d11699e81c0da207c31f31c0840ddaa177a08',
});
export const P009_TYPOGRAPHY_SEED_PATHS = Object.freeze([
  ...P009_ADMISSION_INPUT_PATHS,
  PRODUCER, 'scripts/prepare-g678-alg-l12-p009-typography-binding.test.mts',
  NATIVE_BINDING, GENERATED_DATA,
  'apps/web/lib/g678-alg-l12-p009-current-js-v2.server.ts',
  'apps/web/tests/g678-alg-l12-p009-current-js-v2.server-test.ts',
  'apps/web/lib/g678-current-js-p009-successor-v2.server.ts',
  'apps/web/lib/learning-lesson-availability.server.ts',
  'scripts/prepare-g678-alg-l12-p009-current-js-v2.mjs',
  'scripts/prepare-g678-alg-l12-p009-current-js-v2.test.mjs',
  'packages/demos/src/modules/shared-alg001-l12-p009.tsx',
  'packages/demos/src/timelines/shared-alg001-l12-p009.ts',
  'packages/demos/src/alg-l12-p009-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p009-typography-asset.ts',
  'packages/demos/src/alg-l12-p009-typography.css',
  'packages/demos/src/alg-l12-p009-glossary.ts',
  'packages/demos/src/alg-l12-p009-visual-clock.ts',
  'packages/demos/src/alg-l12-p009-audio-schedule.ts',
  'packages/demos/src/alg-l12-p009-embedded-audio.ts',
  'apps/web/components/g678-alg-l12-p009-host-lesson.tsx',
  'apps/web/lib/g678-alg-l12-p009-host-probe.server.ts',
  'apps/web/lib/g678-alg-l12-p009-host.production-stub.tsx',
  'apps/web/lib/g678-alg-l12-p009-glossary.server.ts',
  'apps/web/lib/g678-alg-l12-p009-typography.server.ts',
  'apps/web/lib/g678-alg-l12-p009-source-audio.server.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/source-audio.mp3/route.ts`,
  'apps/web/tests/g678-alg-l12-p009-host-probe.server-test.ts',
  'apps/web/tests/g678-alg-l12-p009-typography.server-test.ts',
  'apps/web/tests/g678-alg-l12-p009-source-audio.server-test.ts',
  'scripts/build-g678-alg-l12-p009-text-data.mjs',
  'scripts/build-g678-alg-l12-p009-text-data.test.mjs',
  'scripts/build-g678-alg-l12-p009-typography.mjs',
  'scripts/build-g678-alg-l12-p009-typography.test.mjs',
  'scripts/build-g678-alg-l12-p009-candidate.mjs',
  'scripts/build-g678-alg-l12-p009-candidate.test.mjs',
  'scripts/export-g678-alg-l12-p009-canvas.mjs',
  'scripts/export-g678-alg-l12-p009-canvas.test.mjs',
  'scripts/analyze-g678-alg-l12-p009-stream.mjs',
  'scripts/analyze-g678-alg-l12-p009-stream.test.mjs',
  `${WORK}/audit/build-source-audit.mjs`, `${WORK}/audit/typography-build-source-inventory.py`,
  `${WORK}/audit/source-input.swf`, `${WORK}/audit/source-text-catalog.json`,
  `${WORK}/audit/extraction-receipt.json`, `${WORK}/audit/source-behavior.json`,
  `${WORK}/audit/source-placement.json`, `${WORK}/audit/source-toolchain.json`,
  `${WORK}/audit/source-keyterms.json`, `${WORK}/audit/source-stream-blocks.json`,
  `${WORK}/audit/source-stream.mp3`, `${WORK}/audio-analysis-v1/analysis.json`,
  `${WORK}/candidate-v1/canvas-renderer.js`, `${WORK}/candidate-v1/adapter-manifest.json`,
  `${WORK}/candidate-v1/adapter-spec.json`, `${WORK}/typography-v1/canvas-renderer.js`,
  `${WORK}/typography-v1/runtime-meta.json`, INVENTORY, REPORT, INTEGRATION,
  `${WORK}/evidence/SOURCE_AUDIT_2026-09-27.md`, `${WORK}/evidence/AUDIO_STREAM_ANALYSIS_2026-09-27.md`,
  'package.json', 'package-lock.json', 'apps/web/package.json',
  'apps/web/tsconfig.json', 'packages/demos/tsconfig.json', 'apps/web/next.config.ts',
]);
export type P009TypographyPin = {path: string; bytes: number; sha256: string};
type Stable = {pin: P009TypographyPin; bytes: Buffer; modifiedAt: number};
type RiskResolution = {kind: string; disposition: string; artifactPaths: string[]};
export type P009TypographyEvidence = {
  schemaVersion: 1; kind: 'p009-technical-typography-evidence-v1';
  animationId: string; placementId: string; sourceSwfSha256: string;
  sourceCatalogContentSha256: string; checkedAt: string;
  checks: Record<string, 'passed'>;
  checkEvidence: Record<string, {artifactPaths: string[]; result: string}>;
  resolvedSourceRisks: string[]; sourceRiskResolutions: RiskResolution[];
  languagePolicy: {en: 'source'; es: 'source-fallback'};
  artifacts: P009TypographyPin[]; checkedImplementationFiles: P009TypographyPin[];
};
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const jsonBytes = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sortedPins = (pins: readonly P009TypographyPin[]) => [...pins].sort((a, b) => compare(a.path, b.path));
const instanceId = (segments: readonly {timelineId: string; depth: number; generation: number; characterId: number}[]) =>
  segments.map(s => `${s.timelineId}:${s.depth}:${s.generation}:${s.characterId}`).join('/');

function relativePath(value: unknown): asserts value is string {
  assert(typeof value === 'string' && value && !path.isAbsolute(value) && !value.includes('\\') &&
    !value.split('/').some(part => !part || part === '.' || part === '..'), 'P009 ordinary relative path required');
}
function ordinaryDirectory(directory: string) {
  assert(path.isAbsolute(directory) && fs.lstatSync(directory).isDirectory() &&
    fs.realpathSync(directory) === directory, 'P009 physical directory required');
}
function stableFile(root: string, relative: string): Stable {
  relativePath(relative);
  const file = path.join(root, relative), before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    fs.realpathSync(file) === file, `P009 single-link physical file required: ${relative}`);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file, {bigint: true});
  assert(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]) &&
    after.size === BigInt(bytes.length) && fs.realpathSync(file) === file,
  `P009 changed during read: ${relative}`);
  return {pin: {path: relative, bytes: bytes.length, sha256: hash(bytes)}, bytes,
    modifiedAt: Number(after.mtimeNs) / 1_000_000};
}
function outputPath(relative: string) {
  return [P009_TYPOGRAPHY_BINDING_PATH, P009_TYPOGRAPHY_CHECK_PATH].includes(relative) ||
    relative.startsWith(`${WORK}/current-js-v`) || relative.includes(`${ID}.typography-check`);
}
function localOnly(sourceRoot: unknown) {
  assert(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'P009 typography preparation is local engineering only');
  assert.equal(sourceRoot, P009_TYPOGRAPHY_SOURCE_ROOT, 'P009 exact physical AWS source root required');
  ordinaryDirectory(P009_TYPOGRAPHY_SOURCE_ROOT);
}

/** Reuse the established literal-import resolver, then independently hash every
 * returned input and the registry boundaries without traversing other pages. */
export function collectP009TypographyImportClosure(root: string, seeds: readonly string[]) {
  for (const seed of seeds) {relativePath(seed); assert(!outputPath(seed), 'P009 output cannot be a closure seed');}
  const result = collectP005TypographyImportClosure(root, seeds);
  const files = new Map<string, Stable>();
  for (const relative of [...result.files.keys(), ...result.closure.registryStateBoundaries]) {
    assert(!outputPath(relative), `P009 output cannot become an input: ${relative}`);
    files.set(relative, stableFile(root, relative));
  }
  return {files, closure: {...result.closure,
    scope: 'P009-native-text-local-host-controller-assets-and-resolved-shared-inputs',
    qualification: 'All literal local dependencies and actual registry boundary bytes are bound. Other lesson registry branches and external package contents are outside this page inventory; manifests, lockfiles and configuration are bound. This is not whole-application or original-runtime acceptance.',
  }};
}

/** Validate current structural and native semantic coverage without executing
 * Flash actions or assigning a technical, listening, or human passed result. */
export function validateP009SourceBindings(source: any, inventory: any, data: any,
  native: LessonTextBinding, title: string, meta: any) {
  assert.equal(source.sourceSha256, P009_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(source.unparsedTags.length, 0);
  assert.equal(source.textDefinitions.length, 16); assert.equal(source.shapeDefinitions.length, 37);
  assert.equal(source.bitmapDefinitions.length, 0);
  assert.deepEqual([...new Set(source.risks.map((risk: any) => risk.kind))].sort(), [...P009_TYPOGRAPHY_SOURCE_RISKS].sort());
  assert.equal(inventory.kind, 'p009-native-typography-source-inventory');
  assert.equal(inventory.animationId, ID); assert.equal(inventory.sourceSha256, P009_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(inventory.textInstances.length, 44); assert.equal(inventory.shapeDefinitions.length, 37);
  assert.equal(data.instances.length, 44); assert.equal(data.definitions.length, 16);
  assert.equal(native.animationId, ID); assert.equal(native.placementId, ID);
  assert.equal(native.sourceSwfSha256, P009_TYPOGRAPHY_SOURCE_SHA); assert.equal(title, TITLE);
  assert.equal(native.blocks.length, 45);
  const timelines = new Map(source.timelines.map((timeline: any) => [timeline.timelineId, timeline]));
  const definitions = new Map(source.textDefinitions.map((definition: any) => [definition.characterId, definition]));
  const expectedTextIds = new Set<string>(), actualTextIds = new Set<string>();
  const orders = new Set<number>(), blockIds = new Set<string>(), instanceIds = new Set<string>();
  const main = timelines.get('sprite-62') as any;
  assert.equal(main.declaredFrameCount, 394);
  for (const row of data.instances) {
    const definition = definitions.get(row.characterId) as any;
    assert(definition && main.instances.some((sourceInstance: any) =>
      sourceInstance.instanceId === row.instanceId && sourceInstance.characterId === row.characterId &&
      sourceInstance.firstFrame === row.firstFrame && sourceInstance.lastFrameExclusive === row.lastFrameExclusive));
    for (const run of definition.runs) expectedTextIds.add(run.sourceTextId);
  }
  for (const block of native.blocks) {
    assert(!blockIds.has(block.id) && !orders.has(block.readingOrder)); blockIds.add(block.id); orders.add(block.readingOrder);
    assert.equal(block.language, 'en'); assert.equal(block.valueSource, 'source-static');
    assert(block.instance && block.instance.path.length > 0);
    assert.equal(block.instance.id, instanceId(block.instance.path));
    assert(!instanceIds.has(block.instance.id), 'P009 duplicate native instance'); instanceIds.add(block.instance.id);
    for (const [index, segment] of block.instance.path.entries()) {
      const timeline = timelines.get(segment.timelineId) as any;
      assert(timeline?.instances.some((row: any) => row.depth === segment.depth &&
        row.generation === segment.generation && row.characterId === segment.characterId), 'P009 native source instance missing');
      if (index) assert.equal(segment.timelineId, `sprite-${block.instance.path[index - 1]!.characterId}`);
    }
    const leaf = block.instance.path.at(-1)!;
    if (leaf.characterId === 63) {
      assert.equal(block.id, 'title'); assert.equal(block.role, 'title');
      assert.deepEqual(block.sourceTextIds, []); assert.deepEqual(block.sourceShapeIds, [63]);
      assert.equal(block.instance.id, 'root:85:1:63');
    } else {
      const definition = definitions.get(leaf.characterId) as any;
      assert(definition, 'P009 text block must name a source definition');
      assert.deepEqual(block.sourceTextIds, definition.runs.map((run: any) => run.sourceTextId));
      assert(!block.sourceShapeIds?.length);
      for (const id of block.sourceTextIds) actualTextIds.add(id);
      assert.equal(block.role, [4, 26, 31, 43].includes(leaf.characterId) ? 'body' : 'label');
      assert(data.instances.some((row: any) => block.id === row.instanceId && row.depth === leaf.depth &&
        row.generation === leaf.generation && row.characterId === leaf.characterId), 'P009 native block generation mismatch');
    }
  }
  assert.deepEqual([...actualTextIds].sort(), [...expectedTextIds].sort());
  const shapeIds = new Set<number>();
  for (const shape of inventory.shapeDefinitions) {
    assert(!shapeIds.has(shape.characterId)); shapeIds.add(shape.characterId);
    assert.equal(shape.sourceTagSha256, source.shapeDefinitions.find((d: any) => d.characterId === shape.characterId)?.sourceTagSha256);
    assert(typeof shape.reviewRole === 'string' && shape.reviewRole && typeof shape.nativeDisposition === 'string' && shape.nativeDisposition);
    if (shape.characterId in SHAPE_HASHES) assert.equal(shape.sourceTagSha256, SHAPE_HASHES[shape.characterId as keyof typeof SHAPE_HASHES]);
    if (shape.characterId === 63) assert.equal(shape.visualTranscription, TITLE);
    else assert.equal(shape.visualTranscription, null, 'P009 no other shape is authored text');
  }
  assert.deepEqual([...shapeIds].sort((a, b) => a - b), source.shapeDefinitions.map((d: any) => d.characterId).sort((a: number, b: number) => a - b));
  assert.deepEqual(inventory.glossaryButtons.map((row: any) => row.characterId), [6, 7, 8, 9, 27, 28, 32, 33]);
  const flashes = data.instances.filter((row: any) => row.characterId === 60 || row.characterId === 61);
  assert.deepEqual(flashes.map((row: any) => [row.characterId, row.depth, row.generation, row.firstFrame, row.lastFrameExclusive]),
    [[60, 83, 1, 353, 354], [60, 83, 2, 355, 356], [60, 83, 3, 357, 358],
      [61, 83, 4, 383, 384], [61, 83, 5, 385, 386], [61, 83, 6, 387, 388]]);
  assert.equal(data.definitions.find((row: any) => row.characterId === 60).runs.map((r: any) => r.text).join(''), '4');
  assert.equal(data.definitions.find((row: any) => row.characterId === 61).runs.map((r: any) => r.text).join(''), '2');
  const underlines = [[2, 2, 12], [25, 14, 72], [30, 22, 142]].map(([characterId, depth, firstFrame]) => ({
    id: `root:1:1:62/sprite-62:${depth}:1:${characterId}`, firstFrame, lastFrameExclusive: 395,
  }));
  const expectedSuppression = [...data.instances.map((row: any) => ({
    id: `root:1:1:62/sprite-62:${row.depth}:${row.generation}:${row.characterId}`,
    firstFrame: row.firstFrame, lastFrameExclusive: row.lastFrameExclusive,
  })), ...underlines, {id: 'root:85:1:63', firstFrame: 1, lastFrameExclusive: 395}].sort((a, b) => compare(a.id, b.id));
  assert.deepEqual([...meta.exactSuppressionInstances].sort((a, b) => compare(a.id, b.id)), expectedSuppression);
  assert.equal(meta.exactSuppressionInstances.length, 48);
  assert.equal(meta.animationId, ID); assert.equal(meta.sourceSha256, P009_TYPOGRAPHY_SOURCE_SHA);
  assert.equal(meta.renderScale, 2); assert.deepEqual(meta.canvas, {width: 1600, height: 1200});
  assert.equal(meta.bitmapCount, 0); assert.equal(meta.acceptanceEffect, 'none');
  assert.equal(meta.registered, false); assert.equal(meta.audioEnabled, false);
  return {sourceRisks: [...P009_TYPOGRAPHY_SOURCE_RISKS], underlines, flashes,
    sourceTextIds: [...expectedTextIds].sort()};
}

export async function buildCandidate({root = ROOT, sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT} = {}) {
  localOnly(sourceRoot); ordinaryDirectory(root);
  const sourceFile = stableFile(P009_TYPOGRAPHY_SOURCE_ROOT, P009_TYPOGRAPHY_SOURCE_PATH);
  assert.equal(sourceFile.pin.bytes, 165405); assert.equal(sourceFile.pin.sha256, P009_TYPOGRAPHY_SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(sourceFile.bytes);
  const catalogSha256 = hash(JSON.stringify(source)); // Recomputed from actual source each time.
  const files = new Map<string, Stable>();
  const read = (relative: string) => {
    const file = stableFile(root, relative); files.set(relative, file); return file;
  };
  const auditedCatalog = read(`${WORK}/audit/source-text-catalog.json`);
  assert.deepEqual(JSON.parse(auditedCatalog.bytes.toString()), source, 'P009 stored catalog differs from fresh physical source');
  assert.equal(read(`${WORK}/audit/source-input.swf`).pin.sha256, sourceFile.pin.sha256);
  const inventoryFile = read(INVENTORY), inventory = JSON.parse(inventoryFile.bytes.toString());
  assert.equal(inventoryFile.pin.sha256, SOURCE_INVENTORY_SHA, 'P009 reviewed source inventory changed');
  const textData = collectP009TextData(sourceFile.bytes, inventory);
  const expectedDataBytes = '// Generated from the hash-bound P009 source; do not edit.\n' +
    `// Glyph/mask audit SHA-256: ${inventoryFile.pin.sha256}\n` +
    `export const P009_TEXT_DATA = ${JSON.stringify(textData, null, 2)} as const;\n`;
  assert.equal(read(GENERATED_DATA).bytes.toString(), expectedDataBytes, 'P009 generated native data differs from actual source');
  const moduleFile = read(NATIVE_BINDING);
  const nativeModule = await import(`${pathToFileURL(path.join(root, NATIVE_BINDING)).href}?sha256=${moduleFile.pin.sha256}`) as {
    P009_TEXT_BINDING: LessonTextBinding; P009_TITLE: string;
  };
  const native = JSON.parse(JSON.stringify(nativeModule.P009_TEXT_BINDING)) as LessonTextBinding;
  const metaFile = read(`${WORK}/typography-v1/runtime-meta.json`), meta = JSON.parse(metaFile.bytes.toString());
  const sourceDetails = validateP009SourceBindings(source, inventory, textData, native, nativeModule.P009_TITLE, meta);
  const nativeRuntime = read(`${WORK}/typography-v1/canvas-renderer.js`);
  assert.equal(meta.runtimeSha256, nativeRuntime.pin.sha256); assert.equal(meta.runtimeBytes, nativeRuntime.pin.bytes);
  const original = read(`${WORK}/candidate-v1/canvas-renderer.js`);
  assert.equal(meta.sourceCandidateSha256, original.pin.sha256);
  assert.equal(meta.generatorSha256, read('scripts/build-g678-alg-l12-p009-typography.mjs').pin.sha256);
  const regenerated = buildP009Typography(original.bytes.toString(), sourceFile.bytes);
  assert.equal(regenerated.runtime, nativeRuntime.bytes.toString(), 'P009 native suppression runtime differs from reproducible generator');
  assert.equal(regenerated.placedTextCalls, meta.placedTextCalls);
  const integrationFile = read(INTEGRATION), integration = JSON.parse(integrationFile.bytes.toString());
  assert.equal(integration.kind, 'g678-lesson-typography-integration-v1');
  assert(Array.isArray(integration.sharedFiles) && integration.sharedFiles.length > 0);
  const declared = (reference: P009TypographyPin) => {
    relativePath(reference.path); assert(!outputPath(reference.path));
    assert(SHA.test(reference.sha256) && Number.isSafeInteger(reference.bytes) && reference.bytes >= 0);
    const current = read(reference.path); assert.deepEqual(current.pin, reference, `P009 declared dependency drift: ${reference.path}`);
  };
  for (const reference of integration.sharedFiles) declared(reference);
  const externalSourceFiles: P009TypographyPin[] = [];
  const referenced = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.path === 'string' && SHA.test(value.sha256 ?? '') && Number.isSafeInteger(value.bytes)) {
      if (!path.isAbsolute(value.path)) declared({path: value.path, bytes: value.bytes, sha256: value.sha256});
      else assert.equal(value.path, path.join(P009_TYPOGRAPHY_SOURCE_ROOT, P009_TYPOGRAPHY_SOURCE_PATH), 'P009 inventory cannot broaden physical source scope');
    }
    for (const child of Object.values(value)) referenced(child);
  };
  referenced(inventory.inputs);
  const manifest = JSON.parse(read(`${WORK}/candidate-v1/adapter-manifest.json`).bytes.toString());
  assert.equal(manifest.animationId, ID); assert.deepEqual(manifest.source,
    {path: path.join(P009_TYPOGRAPHY_SOURCE_ROOT, P009_TYPOGRAPHY_SOURCE_PATH), bytes: 165405, sha256: P009_TYPOGRAPHY_SOURCE_SHA});
  assert.equal(manifest.runtimeSha256, original.pin.sha256); assert.equal(manifest.runtimeBytes, original.pin.bytes);
  referenced(manifest.inputs); referenced(manifest.generatorDependencies);
  for (const shape of inventory.shapeDefinitions) {
    declared({path: shape.preview.svg, sha256: shape.preview.svgSha256,
      bytes: stableFile(root, shape.preview.svg).pin.bytes});
    declared({path: shape.preview.preview, sha256: shape.preview.previewSha256,
      bytes: stableFile(root, shape.preview.preview).pin.bytes});
  }
  const glossaryFile = read('packages/demos/src/alg-l12-p009-glossary.ts');
  const glossary = await import(`${pathToFileURL(path.join(root, glossaryFile.pin.path)).href}?sha256=${glossaryFile.pin.sha256}`) as {
    P009_GLOSSARY_TERMS: readonly {characterId: number; sourceKeyAttribute: string; sourceTextId: string; firstReadableFrame: number}[];
  };
  assert.deepEqual(glossary.P009_GLOSSARY_TERMS.map(term => [term.characterId, term.sourceKeyAttribute, term.sourceTextId]),
    inventory.glossaryButtons.map((row: any) => [row.characterId, row.sourceKeyAttribute, row.sourceRunId]));
  for (const term of glossary.P009_GLOSSARY_TERMS) {
    assert.equal(term.firstReadableFrame, textData.definitions.flatMap((row: any) => row.runs)
      .find((run: any) => run.id === term.sourceTextId)?.revealFrame);
  }
  const keyterms = JSON.parse(read(`${WORK}/audit/source-keyterms.json`).bytes.toString());
  assert.equal(keyterms.animationId, ID); assert.equal(keyterms.sourceSha256, P009_TYPOGRAPHY_SOURCE_SHA);
  const dictionaryRoot = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
  ordinaryDirectory(dictionaryRoot);
  assert.equal(keyterms.sources.length, 2);
  for (const [index, sourceDocument] of keyterms.sources.entries()) {
    assert.equal(sourceDocument.path, `${dictionaryRoot}/${index === 0 ? 'L1KTE01' : 'L1KTS01'}.xml`);
    const document = stableFile(dictionaryRoot, path.basename(sourceDocument.path));
    assert.equal(document.pin.bytes, sourceDocument.bytes); assert.equal(document.pin.sha256, sourceDocument.sha256);
    externalSourceFiles.push({...document.pin, path: sourceDocument.path});
    const lines = document.bytes.toString().split(/\r?\n/u);
    for (const term of glossary.P009_GLOSSARY_TERMS) {
      const entries = sourceDocument.records.filter((row: any) => row.key === term.sourceKeyAttribute);
      assert.equal(entries.length, 1); const entry = entries[0];
      const record = lines.slice(entry.firstLine - 1, entry.lastLine).join('\n');
      assert(record.includes(`<${entry.sourceTagName} ${entry.sourceAttributes}>`), 'P009 glossary source record differs');
      assert.equal(entry.definitionSha256, hash(`${entry.definitionEn}~LNG~${entry.definitionEs}`));
      assert(record.includes(`${entry.definitionEn}~LNG~${entry.definitionEs}`), 'P009 glossary literal definition differs');
    }
  }
  const report = read(REPORT);
  assert.equal(report.pin.sha256, SOURCE_ROLE_REPORT_SHA, 'P009 reviewed source-role report changed');
  // Complete shape hashes live in the reviewed inventory. The human-readable
  // report names the roles and title; it intentionally does not duplicate them.
  for (const marker of [TITLE, P009_TYPOGRAPHY_SOURCE_SHA])
    assert(report.bytes.toString().includes(marker), `P009 source-role report marker missing: ${marker}`);
  const seeds = [...new Set([...P009_TYPOGRAPHY_SEED_PATHS, ...files.keys(),
    ...integration.sharedFiles.map((item: P009TypographyPin) => item.path)])].sort();
  const collected = collectP009TypographyImportClosure(root, seeds);
  for (const file of files.values()) assert.deepEqual(collected.files.get(file.pin.path)?.pin, file.pin,
    `P009 prepared input changed before closure: ${file.pin.path}`);
  const implementationFiles = sortedPins([...collected.files.values()].map(file => file.pin));
  const roleDecisions = inventory.shapeDefinitions.map((shape: any) => ({
    kind: shape.characterId === 63 ? 'outlined-text' : [2, 25, 30].includes(shape.characterId)
      ? 'decorative-glossary-underlines' : shape.reviewRole === 'rectangular-mask-only' ? 'source-mask-geometry' : 'source-educational-geometry',
    role: shape.characterId === 63 ? 'title' : 'decoration',
    ...(shape.characterId === 63 ? {semanticValue: TITLE} : {}),
    sourceShapeHashes: [{characterId: shape.characterId, sourceTagSha256: shape.sourceTagSha256}],
    sourceInstanceIds: shape.sourceInstances.map((row: any) => row.instanceId),
    disposition: shape.nativeDisposition, authoredWords: shape.characterId === 63,
    evidence: [inventoryFile.pin, report.pin,
      collected.files.get(shape.preview.svg)!.pin, collected.files.get(shape.preview.preview)!.pin],
  }));
  const binding = {...native, sourceRelativePath: P009_TYPOGRAPHY_SOURCE_PATH,
    sourceCatalogContentSha256: catalogSha256, sourceRoleDecisions: roleDecisions,
    languagePolicy: {en: 'source', es: 'source-fallback'},
    nativeTextEvidence: {textDefinitions: 16, textRuns: 32, textPlacementGenerations: 44,
      sourceTextIds: sourceDetails.sourceTextIds, exactSuppressionInstances: meta.exactSuppressionInstances,
      whiteFlash: {disposition: 'source-white-glyphs-represented-by-brief-coordinate-digit-hiding',
        instances: sourceDetails.flashes, originalRuntimeParityAccepted: false},
      glossary: glossary.P009_GLOSSARY_TERMS, inventory: inventoryFile.pin,
      metadata: metaFile.pin, runtime: nativeRuntime.pin, originalCandidate: original.pin},
    sourceRiskEvidence: {sourceParserRisks: sourceDetails.sourceRisks,
      sourceDisposition: report.pin, sourceInventory: inventoryFile.pin,
      technicalRiskCheckRecorded: false},
    externalSourceFiles: [ {...sourceFile.pin, path: path.join(P009_TYPOGRAPHY_SOURCE_ROOT, P009_TYPOGRAPHY_SOURCE_PATH)},
      ...externalSourceFiles ],
    generator: {path: PRODUCER, version: '1.0.0', sha256: collected.files.get(PRODUCER)!.pin.sha256},
    implementation: {status: 'candidate', files: implementationFiles, closure: collected.closure},
    unresolved: [
      'All twelve technical typography results require independently authored, current hash-bound local host evidence.',
      'Native glossary eligibility and source-white-flash presentation do not establish original clipped-hit or visual parity.',
      'Registry or host changes invalidate this inventory and require a fresh candidate and receipt before finalization.',
    ],
    independentPending: ['Original Flash runtime and fidelity', 'Named audio listening and synchronization acceptance',
      'Human visual and Owner acceptance', 'Strict completion, release and publication'],
    independentAcceptance: {registered: false, originalRuntimeAccepted: false, flashFidelityAccepted: false,
      audioAccepted: false, humanReviewed: false, ownerAccepted: false, strictComplete: false, published: false},
    preparationOnly: true,
  };
  for (const pin of implementationFiles) assert.deepEqual(stableFile(root, pin.path).pin, pin, `P009 input changed during preparation: ${pin.path}`);
  assert.deepEqual(stableFile(P009_TYPOGRAPHY_SOURCE_ROOT, P009_TYPOGRAPHY_SOURCE_PATH).pin, sourceFile.pin);
  for (const pin of externalSourceFiles) assert.deepEqual(
    {...stableFile(dictionaryRoot, path.basename(pin.path)).pin, path: pin.path}, pin);
  return {binding, bytes: jsonBytes(binding)};
}
export const prepareP009TypographyBinding = buildCandidate;
export type P009TypographyPreparation = Awaited<ReturnType<typeof buildCandidate>>;

/** A receipt supplies actual results, never this producer. Each of the twelve
 * results and each source-risk disposition must cite an independently saved
 * artifact; implementation code alone is not an observation artifact. */
export function validateEvidence(evidencePath: string, expected: {
  implementationFiles: readonly P009TypographyPin[]; sourceRisks: readonly string[];
  sourceCatalogContentSha256: string;
}, root = ROOT, now = Date.now()) {
  ordinaryDirectory(root); relativePath(evidencePath);
  assert(!outputPath(evidencePath) && !expected.implementationFiles.some(pin => pin.path === evidencePath), 'P009 receipt cannot be an implementation input/output');
  const receiptFile = stableFile(root, evidencePath);
  const evidence = JSON.parse(receiptFile.bytes.toString()) as P009TypographyEvidence;
  assert.equal(evidence.schemaVersion, 1); assert.equal(evidence.kind, 'p009-technical-typography-evidence-v1');
  assert.equal(evidence.animationId, ID); assert.equal(evidence.placementId, ID);
  assert.equal(evidence.sourceSwfSha256, P009_TYPOGRAPHY_SOURCE_SHA);
  assert(SHA.test(expected.sourceCatalogContentSha256));
  assert.equal(evidence.sourceCatalogContentSha256, expected.sourceCatalogContentSha256);
  const checkedAt = Date.parse(evidence.checkedAt);
  assert(typeof evidence.checkedAt === 'string' && Number.isFinite(checkedAt) && checkedAt <= now + 1000, 'P009 real nonfuture checkedAt required');
  assert.deepEqual(evidence.languagePolicy, {en: 'source', es: 'source-fallback'});
  assert.deepEqual(Object.keys(evidence.checks ?? {}).sort(), [...P009_TYPOGRAPHY_CHECKS].sort(), 'P009 exactly twelve technical checks required');
  for (const check of P009_TYPOGRAPHY_CHECKS) assert.equal(evidence.checks[check], 'passed', `P009 technical check not passed: ${check}`);
  const risks = [...new Set(expected.sourceRisks)].sort();
  assert(Array.isArray(evidence.resolvedSourceRisks));
  assert.deepEqual([...evidence.resolvedSourceRisks].sort(), risks, 'P009 every current source risk must be resolved exactly once');
  const observedFiles: Stable[] = [];
  const readReferences = (references: readonly P009TypographyPin[], label: string) => {
    assert(Array.isArray(references) && references.length > 0, `P009 nonempty ${label} required`);
    const seen = new Set<string>();
    return references.map(reference => {
      assert(reference && SHA.test(reference.sha256 ?? '') && Number.isSafeInteger(reference.bytes) && reference.bytes >= 0, 'P009 exact reference hash and size required');
      relativePath(reference.path);
      assert(!outputPath(reference.path) && reference.path !== evidencePath && !seen.has(reference.path), `P009 circular or duplicate ${label}`);
      seen.add(reference.path); const current = stableFile(root, reference.path);
      assert.deepEqual(current.pin, reference, `P009 stale ${label}: ${reference.path}`);
      observedFiles.push(current); return current.pin;
    }).sort((a, b) => compare(a.path, b.path));
  };
  const artifacts = readReferences(evidence.artifacts, 'observation artifact');
  const checked = readReferences(evidence.checkedImplementationFiles, 'checked implementation');
  assert.deepEqual(checked, sortedPins(expected.implementationFiles), 'P009 receipt must bind the entire current implementation inventory without omissions/extras');
  const inputPaths = new Set(checked.map(pin => pin.path));
  assert(artifacts.every(pin => !inputPaths.has(pin.path)), 'P009 implementation is not an independently observed result artifact');
  const artifactPaths = new Set(artifacts.map(pin => pin.path));
  const referencesArtifact = (value: {artifactPaths: string[]; result?: string; disposition?: string}, label: string) => {
    assert(value && typeof (value.result ?? value.disposition) === 'string' && (value.result ?? value.disposition)!.trim(), `P009 concrete ${label} result required`);
    assert(Array.isArray(value.artifactPaths) && value.artifactPaths.length > 0 &&
      new Set(value.artifactPaths).size === value.artifactPaths.length && value.artifactPaths.every(p => artifactPaths.has(p)), `P009 ${label} must cite checked observation artifacts`);
  };
  assert.deepEqual(Object.keys(evidence.checkEvidence ?? {}).sort(), [...P009_TYPOGRAPHY_CHECKS].sort(), 'P009 observation mapping required for every technical check');
  for (const check of P009_TYPOGRAPHY_CHECKS) referencesArtifact(evidence.checkEvidence[check]!, check);
  assert(Array.isArray(evidence.sourceRiskResolutions) && evidence.sourceRiskResolutions.length === risks.length);
  const resolved = new Set<string>();
  for (const resolution of evidence.sourceRiskResolutions) {
    assert(risks.includes(resolution.kind) && !resolved.has(resolution.kind), 'P009 exact nonduplicate source-risk disposition required');
    resolved.add(resolution.kind); referencesArtifact(resolution, resolution.kind);
  }
  for (const file of observedFiles) {
    assert(file.modifiedAt <= checkedAt + 1000, `P009 receipt predates checked file: ${file.pin.path}`);
    assert.deepEqual(stableFile(root, file.pin.path).pin, file.pin, `P009 evidence changed while validating: ${file.pin.path}`);
  }
  assert.deepEqual(stableFile(root, evidencePath).pin, receiptFile.pin);
  return {evidence, receipt: receiptFile.pin, artifacts, checkedImplementationFiles: checked};
}
export const validateP009TypographyEvidence = validateEvidence;

/** Rebuild against physical source and every current dependency before accepting
 * an independently authored receipt. This cannot finalize a stale preparation. */
export async function finalize(prepared: P009TypographyPreparation, evidencePath: string,
  options: {root?: string; sourceRoot?: string} = {}) {
  const fresh = await buildCandidate(options);
  assert(prepared.bytes.equals(jsonBytes(prepared.binding)), 'P009 preparation serialization changed');
  assert.deepEqual(prepared.binding, fresh.binding, 'P009 preparation is stale; rebuild candidate and independent receipt');
  const verified = validateEvidence(evidencePath, {
    implementationFiles: fresh.binding.implementation.files,
    sourceRisks: fresh.binding.sourceRiskEvidence.sourceParserRisks,
    sourceCatalogContentSha256: fresh.binding.sourceCatalogContentSha256,
  }, options.root ?? ROOT);
  const binding = {...fresh.binding, implementation: {...fresh.binding.implementation, status: 'implemented'},
    sourceRiskEvidence: {...fresh.binding.sourceRiskEvidence, technicalRiskCheckRecorded: true,
      technicalReceipt: verified.receipt, resolutions: verified.evidence.sourceRiskResolutions},
    unresolved: [], preparationOnly: false,
    technicalFinalization: {kind: 'p009-technical-typography-finalization-v1', checkedAt: verified.evidence.checkedAt,
      receipt: verified.receipt, scope: 'Local modern My Lesson source-bound native typography only; all independent acceptance gates remain pending.'},
  };
  const bytes = jsonBytes(binding);
  const check = {schemaVersion: 1, kind: 'g678-lesson-typography-check-v1', animationId: ID, placementId: ID,
    sourceSwfSha256: P009_TYPOGRAPHY_SOURCE_SHA, sourceCatalogContentSha256: binding.sourceCatalogContentSha256,
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
export const finalizeP009TypographyBinding = finalize;

export async function main(argv = process.argv.slice(2)) {
  assert(argv.length === 1 && argv[0] === '--dry-run' || argv.length === 2 && argv[0] === '--evidence',
    'Usage: tsx scripts/prepare-g678-alg-l12-p009-typography-binding.mts --dry-run | --evidence <receipt-relative-path>; read-only, no --write');
  const prepared = await buildCandidate();
  const result = argv[0] === '--evidence' ? await finalize(prepared, argv[1]!) : prepared;
  process.stdout.write(`${JSON.stringify({status: argv[0] === '--evidence' ? 'FINALIZED_IN_MEMORY_NOT_WRITTEN' : 'P009_SOURCE_BOUND_CANDIDATE_NOT_WRITTEN',
    bindingPath: P009_TYPOGRAPHY_BINDING_PATH, bindingBytes: result.bytes.length,
    bindingSha256: hash(result.bytes), implementationFiles: result.binding.implementation.files.length,
    sourceCatalogContentSha256: result.binding.sourceCatalogContentSha256,
    preparationOnly: result.binding.preparationOnly, independentAcceptanceEffect: 'none'})}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT)
  main().catch(error => {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;});
