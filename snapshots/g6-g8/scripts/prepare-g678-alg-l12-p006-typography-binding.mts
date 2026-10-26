#!/usr/bin/env -S tsx
// Source-bound candidate, or technical finalization from independently produced
// evidence. This producer never tests on behalf of the receipt author, registers
// P006, or changes any independent acceptance gate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';

import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {P006_ADMISSION_PATHS, REQUIRED_WORKSPACE_PATHS} from
  './prepare-g678-alg-l12-p006-current-js-v2.mjs';
import type {LessonTextBinding, LessonTextInstance} from '../packages/demos/src/lesson-text-contract';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
const ID = 'shared-alg001-l12-p006';
const MIGRATION = `migrations/${ID}`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH = 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const CATALOG_SHA = 'ade09b22c6df92ebbef45c15154abe20e60ffff2f8328dd9e1b877b734611996';
const ORIGINAL_RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const SHAPE_SHA = 'c12e756f774672ff8ded0cc3916ee99587d3243c138ca83839b2f61a4e1a2dbf';
const UNDERLINE_SHA = 'b67301df210b5e9ba802077935654f227285dde4570083f3bc6b71cc0df96cc2';
const PAPER_SHA = '9060ab0868b4a2ca44d5e805be99b6bca29abd8816230ef628aa09e55173f7bc';
const SOURCE_DISPOSITION_SHA = '2a2485b939b4c2fcf853afca4143c611bc30624471ab268111e0fd34387dd89b';
const TITLE = 'Graphing in the Coordinate Plane: Real World Activity';
const BINDING_PATH = `catalog/typography-v1/g678-page-bindings/${ID}.json`;
const CHECK_PATH = `catalog/typography-v1/g678-checks/${ID}.json`;
const GENERATOR_PATH = 'scripts/prepare-g678-alg-l12-p006-typography-binding.mts';
export const P006_TYPOGRAPHY_CHECKS = Object.freeze([
  'sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability',
]);
const SHA = /^[a-f0-9]{64}$/u;
const REPORT_PATH = `${MIGRATION}/evidence/TYPOGRAPHY_SOURCE_2026-09-27.md`;
const MODULE_PATH = 'packages/demos/src/alg-l12-p006-typography.ts';
const PAGE_FILES = [
  MODULE_PATH,
  'packages/demos/src/alg-l12-p006-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p006-typography.css',
  'packages/demos/src/alg-l12-p006-typography-asset.ts',
  'apps/web/lib/g678-alg-l12-p006-typography.server.ts',
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `${MIGRATION}/typography-v1/canvas-renderer.js`,
  `${MIGRATION}/typography-v1/runtime-meta.json`,
  `${MIGRATION}/typography-v1/adapter-manifest.json`,
  REPORT_PATH,
  'package.json', 'package-lock.json', 'apps/web/package.json',
  'apps/web/tsconfig.json', 'packages/demos/tsconfig.json',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p006-typography-binding.test.mts',
];
type Pin = {path: string; bytes: number; sha256: string};
type Stable = {bytes: Buffer; pin: Pin};
type ArtifactReference = {path: string; sha256: string; bytes?: number};
type RiskResolution = {kind: string; disposition: string; artifactPaths: string[]};
type TechnicalEvidence = {
  schemaVersion: 1;
  kind: 'p006-technical-typography-evidence-v1';
  animationId: string; placementId: string;
  sourceSwfSha256: string; sourceCatalogContentSha256: string;
  checkedAt: string;
  checks: Record<string, 'passed'>;
  resolvedSourceRisks: string[];
  sourceRiskResolutions: RiskResolution[];
  languagePolicy: {en: 'source'; es: 'source-fallback'};
  artifacts: ArtifactReference[];
  checkedImplementationFiles: ArtifactReference[];
};
export type P006TypographyRefreshOptions = {
  evidencePath: string;
  fromBindingSha256: string; fromCheckSha256: string;
  backupBindingPath: string; backupCheckPath: string;
};
type StructuralCatalog = {
  unparsedTags: unknown[];
  textDefinitions: {characterId: number; sourceTextId: string; runs?: {sourceTextId: string}[]}[];
  shapeDefinitions: {characterId: number; sourceTagSha256: string}[];
  timelines: {timelineId: string; instances: {depth: number; generation: number; characterId: number}[]}[];
  risks: {kind: string}[];
};
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

function relativePath(relative: unknown): asserts relative is string {
  assert(typeof relative === 'string' && relative && !path.isAbsolute(relative) &&
    !relative.split(/[\\/]/u).some(part => !part || part === '.' || part === '..'),
  'P006 typography reference must be an ordinary relative path');
}

function ordinaryDirectory(directory: string) {
  const stat = fs.lstatSync(directory);
  assert(stat.isDirectory() && !stat.isSymbolicLink() && fs.realpathSync(directory) === directory,
    `P006 typography directory must be physical: ${directory}`);
}

function stableFile(root: string, relative: string): Stable {
  relativePath(relative);
  const file = path.join(root, relative);
  assert.equal(fs.realpathSync(file), file, `P006 typography symlink boundary: ${relative}`);
  const before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink(), `P006 typography file boundary: ${relative}`);
  const bytes = fs.readFileSync(file);
  const after = fs.lstatSync(file, {bigint: true});
  assert(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]) &&
    after.size === BigInt(bytes.length), `P006 typography unstable read: ${relative}`);
  return {bytes, pin: {path: relative, bytes: bytes.length, sha256: hash(bytes)}};
}

function localImportClosure(seeds: readonly string[], files: Map<string, Stable>) {
  const config = ts.readConfigFile(path.join(ROOT, 'apps/web/tsconfig.json'), ts.sys.readFile);
  assert(!config.error, 'P006 typography TypeScript configuration cannot be read');
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys,
    path.join(ROOT, 'apps/web')).options;
  const queue = [...seeds], seen = new Set<string>(), external = new Set<string>();
  const boundaries = new Map<string, {path: string; excludedLiteralImports: number}>();
  const nonliteralDynamicImports: {path: string; line: number}[] = [];
  const edges: {from: string; to: string; kind: 'static' | 'dynamic'}[] = [];
  const add = (from: string, specifier: string, kind: 'static' | 'dynamic') => {
    // The registry dispatcher can load every unrelated lesson. Keep its own
    // bytes bound, and qualify this page-specific closure instead of claiming
    // that the complete application's dynamically selected graph was audited.
    if (kind === 'dynamic' && /\/registry(?:\.[^/]*)?\.generated\.[cm]?[jt]s$/u.test(from)
        && !specifier.includes(ID)) {
      const row = boundaries.get(from) ?? {path: from, excludedLiteralImports: 0};
      row.excludedLiteralImports++;
      boundaries.set(from, row);
      return;
    }
    if (specifier.startsWith('node:')) { external.add(specifier); return; }
    const resolved = ts.resolveModuleName(specifier, path.join(ROOT, from), options, ts.sys)
      .resolvedModule?.resolvedFileName;
    let full = resolved && fs.realpathSync(resolved);
    // A CSS declaration file does not replace the CSS bytes being imported.
    if (specifier.startsWith('.') && /\.(?:css|json)$/u.test(specifier)) {
      const asset = path.resolve(path.dirname(path.join(ROOT, from)), specifier);
      if (fs.existsSync(asset)) full = fs.realpathSync(asset);
    }
    if (!full || !full.startsWith(`${ROOT}${path.sep}`) || full.includes(`${path.sep}node_modules${path.sep}`)) {
      assert(!specifier.startsWith('.') && !specifier.startsWith('@/') &&
        !specifier.startsWith('@helpmath/'), `P006 typography unresolved local import: ${from}: ${specifier}`);
      external.add(specifier);
      return;
    }
    const relative = path.relative(ROOT, full).split(path.sep).join('/');
    edges.push({from, to: relative, kind});
    queue.push(relative);
  };
  while (queue.length) {
    const relative = queue.shift()!;
    if (seen.has(relative)) continue;
    seen.add(relative);
    const value = files.get(relative) ?? stableFile(ROOT, relative);
    files.set(relative, value);
    // Generated drawing assets are source-locked opaque bytes, never parsed as
    // maintained application imports. JSON, CSS, fonts and source reports are
    // inventoried by their own hashes.
    if (!/\.[cm]?[jt]sx?$/u.test(relative) || relative.startsWith('migrations/')) continue;
    const source = ts.createSourceFile(relative, value.bytes.toString('utf8'),
      ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        add(relative, node.moduleSpecifier.text, 'static');
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!)) {
          add(relative, (node.arguments[0] as ts.StringLiteral).text, 'dynamic');
        } else {
          nonliteralDynamicImports.push({path: relative,
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1});
        }
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) &&
          ts.isStringLiteral(node.argument.literal)) {
        add(relative, node.argument.literal.text, 'static');
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return {
    scope: 'explicit-P006-page-host-and-shared-inputs-with-resolved-local-imports',
    completeTransitiveClosure: false,
    qualification: 'External packages are bound through package manifests and package-lock. Unrelated dynamic registry branches are excluded; this is a candidate critical-input inventory, not a whole-application closure or acceptance.',
    localImportEdges: edges.sort((a, b) => compare(`${a.from}:${a.to}:${a.kind}`, `${b.from}:${b.to}:${b.kind}`)),
    externalImportSpecifiers: [...external].sort(),
    dynamicRegistryBoundaries: [...boundaries.values()].sort((a, b) => compare(a.path, b.path)),
    nonliteralDynamicImports: nonliteralDynamicImports.sort((a, b) => compare(a.path, b.path) || a.line - b.line),
  };
}

export async function prepareP006TypographyBinding() {
  assert(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'P006 typography preparation is local engineering only');
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT, 'Exact physical AWS source root required');
  ordinaryDirectory(ROOT); ordinaryDirectory(SOURCE_ROOT);
  const raw = stableFile(SOURCE_ROOT, SOURCE_PATH);
  assert.equal(raw.pin.bytes, 708053); assert.equal(raw.pin.sha256, SOURCE_SHA);
  const source: StructuralCatalog = collectSwfTextSourceCatalog(raw.bytes);
  assert.equal(hash(JSON.stringify(source)), CATALOG_SHA);
  assert.equal(source.unparsedTags.length, 0);
  const integrationFile = stableFile(ROOT, 'catalog/typography-v1/g678-integration.json');
  const integration = JSON.parse(integrationFile.bytes.toString('utf8'));
  assert.equal(integration.kind, 'g678-lesson-typography-integration-v1');
  const report = stableFile(ROOT, REPORT_PATH);
  assert.equal(report.pin.sha256, SOURCE_DISPOSITION_SHA, 'P006 source-role disposition changed');
  const reportText = report.bytes.toString('utf8');
  for (const marker of [SOURCE_SHA, CATALOG_SHA, SHAPE_SHA, UNDERLINE_SHA, PAPER_SHA, TITLE,
    'root/depth-65/generation-1>sprite-56/depth-1/generation-1',
    'root/depth-1/generation-1>sprite-53/depth-19/generation-1',
    'root/depth-1/generation-1>sprite-53/depth-17/generation-17'])
    assert(reportText.includes(marker), `P006 typography source disposition missing: ${marker}`);
  const nativeBindingModule = stableFile(ROOT, MODULE_PATH);
  const {P006_TEXT_BINDING, P006_TITLE, P006_QUESTION_UNDERLINE_INSTANCE,
    P006_QUESTION_PAPER_INSTANCE} = await
    import(pathToFileURL(path.join(ROOT, MODULE_PATH)).href) as {
      P006_TEXT_BINDING: LessonTextBinding;
      P006_TITLE: string;
      P006_QUESTION_UNDERLINE_INSTANCE: LessonTextInstance;
      P006_QUESTION_PAPER_INSTANCE: LessonTextInstance;
    };
  assert.deepEqual(stableFile(ROOT, MODULE_PATH).pin, nativeBindingModule.pin,
    'P006 binding module changed while importing its declaration');
  assert.equal(P006_TITLE, TITLE, 'P006 native title semantics changed');
  assert.equal(P006_TEXT_BINDING.schemaVersion, 1);
  assert.equal(P006_TEXT_BINDING.animationId, ID); assert.equal(P006_TEXT_BINDING.placementId, ID);
  assert.equal(P006_TEXT_BINDING.sourceSwfSha256, SOURCE_SHA);
  assert(P006_TEXT_BINDING.blocks.length > 0 && P006_TEXT_BINDING.version);
  const definitions = new Map(source.textDefinitions.map(item => [item.characterId, item]));
  const knownTextIds = new Set(source.textDefinitions.flatMap(item =>
    [item.sourceTextId, ...(item.runs ?? []).map(run => run.sourceTextId)]));
  const timelines = new Map(source.timelines.map(item => [item.timelineId, item]));
  const shape = source.shapeDefinitions.find(item => item.characterId === 55);
  assert(shape, 'P006 outlined title shape55 is missing');
  assert.equal(shape.sourceTagSha256, SHAPE_SHA);
  const underline = source.shapeDefinitions.find(item => item.characterId === 44);
  assert(underline, 'P006 decorative glossary underline shape44 is missing');
  assert.equal(underline.sourceTagSha256, UNDERLINE_SHA);
  assert.deepEqual(P006_QUESTION_UNDERLINE_INSTANCE.path, [
    {timelineId: 'root', depth: 1, generation: 1, characterId: 53},
    {timelineId: 'sprite-53', depth: 19, generation: 1, characterId: 44},
  ], 'P006 decorative underline suppression path changed');
  assert(timelines.get('sprite-53')?.instances.some(instance =>
    instance.depth === 19 && instance.generation === 1 && instance.characterId === 44),
  'P006 decorative underline source instance changed');
  const paper = source.shapeDefinitions.find(item => item.characterId === 42);
  assert(paper, 'P006 decorative question paper shape42 is missing');
  assert.equal(paper.sourceTagSha256, PAPER_SHA);
  assert.deepEqual(P006_QUESTION_PAPER_INSTANCE.path, [
    {timelineId: 'root', depth: 1, generation: 1, characterId: 53},
    {timelineId: 'sprite-53', depth: 17, generation: 17, characterId: 42},
  ], 'P006 decorative question paper suppression path changed');
  assert(timelines.get('sprite-53')?.instances.some(instance =>
    instance.depth === 17 && instance.generation === 17 && instance.characterId === 42),
  'P006 decorative question paper source instance changed');
  const orders = new Set<string>(), ids = new Set<string>();
  for (const block of P006_TEXT_BINDING.blocks) {
    assert(block.language === 'en', 'P006 English source fallback must not invent Spanish source blocks');
    assert(!ids.has(block.id) && !orders.has(`${block.language}:${block.readingOrder}`));
    assert(Number.isSafeInteger(block.readingOrder) && block.sourceTextIds.every(id => knownTextIds.has(id)));
    ids.add(block.id); orders.add(`${block.language}:${block.readingOrder}`);
    assert(block.sourceTextIds.length || block.sourceShapeIds?.length, `Unbound P006 text block: ${block.id}`);
    if (block.sourceShapeIds?.length) assert(block.role === 'title' &&
      block.sourceShapeIds.every(id => id === 55), 'P006 outlined text decision drift');
    assert(block.instance && block.instance.path.length);
    for (const [index, segment] of block.instance.path.entries()) {
      const timeline = timelines.get(segment.timelineId);
      assert(timeline?.instances.some(instance => instance.depth === segment.depth &&
        instance.generation === segment.generation && instance.characterId === segment.characterId),
      `P006 source instance missing: ${block.instance.id}`);
      if (index) assert.equal(segment.timelineId, `sprite-${block.instance.path[index - 1]!.characterId}`);
    }
    const leaf = block.instance.path.at(-1)!;
    if (block.sourceTextIds.length) assert(definitions.has(leaf.characterId),
      `P006 source text leaf mismatch: ${block.id}`);
  }
  assert(P006_TEXT_BINDING.blocks.some(block => block.sourceShapeIds?.includes(55)),
    'P006 visible outlined title must be bound');
  const nativeRuntime = stableFile(ROOT, `${MIGRATION}/typography-v1/canvas-renderer.js`);
  const nativeMetaFile = stableFile(ROOT, `${MIGRATION}/typography-v1/runtime-meta.json`);
  const nativeManifestFile = stableFile(ROOT, `${MIGRATION}/typography-v1/adapter-manifest.json`);
  const nativeMeta = JSON.parse(nativeMetaFile.bytes.toString('utf8'));
  const nativeManifest = JSON.parse(nativeManifestFile.bytes.toString('utf8'));
  for (const document of [nativeMeta, nativeManifest]) {
    assert.equal(document.animationId, ID); assert.equal(document.sourceSwfSha256, SOURCE_SHA);
    assert.equal(document.runtimeSha256, nativeRuntime.pin.sha256);
    assert.equal(document.runtimeBytes, nativeRuntime.pin.bytes);
  }
  assert.equal(nativeManifest.kind, 'p006-exact-placement-typography-v1');
  assert.equal(nativeManifest.originalCandidate, 'candidate-v2');
  assert.equal(nativeManifest.originalRuntimeSha256, ORIGINAL_RUNTIME_SHA);
  assert.equal(nativeManifest.originalRuntimeBytes, 11507597);
  assert.equal(nativeManifest.evidence.title.sourceShapeTagSha256, SHAPE_SHA);
  assert.equal(nativeManifest.evidence.underlines.sourceShapeTagSha256, UNDERLINE_SHA);
  assert(Object.values(nativeManifest.evidence).some(value => {
    const item = value as {id?: string; sourceShapeCharacterId?: number; sourceShapeTagSha256?: string};
    return item.id === P006_QUESTION_PAPER_INSTANCE.id && item.sourceShapeCharacterId === 42 &&
      item.sourceShapeTagSha256 === PAPER_SHA;
  }), 'P006 exact decorative paper suppression evidence missing');
  assert.equal(nativeManifest.evidence.questionRevealMask.preserved, true);
  assert.deepEqual(nativeManifest.nativeOnlyResolution, {width: 800, height: 600, supportedScales: [1]});
  const files = new Map<string, Stable>();
  for (const reference of integration.sharedFiles) {
    const file = stableFile(ROOT, reference.path);
    assert.equal(file.pin.sha256, reference.sha256, `Shared typography input drift: ${reference.path}`);
    files.set(reference.path, file);
  }
  const seeds = [...new Set([...PAGE_FILES,
    ...REQUIRED_WORKSPACE_PATHS.filter((relative: string) => relative !== P006_ADMISSION_PATHS.registry),
    ...integration.sharedFiles.map((item: Pin) => item.path)])].sort();
  const closure = localImportClosure(seeds, files);
  assert.deepEqual(files.get(MODULE_PATH)?.pin, nativeBindingModule.pin,
    'P006 binding module changed before implementation inventory');
  for (const file of [report, nativeRuntime, nativeMetaFile, nativeManifestFile])
    assert.deepEqual(files.get(file.pin.path)?.pin, file.pin,
      `P006 source/native artifact changed before inventory: ${file.pin.path}`);
  const implementationFiles = [...files.values()].map(file => file.pin).sort((a, b) => compare(a.path, b.path));
  for (const forbidden of [BINDING_PATH, CHECK_PATH, P006_ADMISSION_PATHS.registry,
    P006_ADMISSION_PATHS.freeze, P006_ADMISSION_PATHS.fragment])
    assert(!files.has(forbidden), `P006 typography output/admission hash cycle: ${forbidden}`);
  const binding = {
    ...P006_TEXT_BINDING,
    sourceRelativePath: SOURCE_PATH, sourceCatalogContentSha256: CATALOG_SHA,
    sourceRoleDecisions: [
      {kind: 'outlined-text', role: 'title', semanticValue: TITLE,
        sourceShapeHashes: [{characterId: 55, sourceTagSha256: SHAPE_SHA}],
        sourceInstanceId: 'root/depth-65/generation-1>sprite-56/depth-1/generation-1',
        evidence: [report.pin]},
      {kind: 'decorative-glossary-underlines', role: 'decoration',
        sourceShapeHashes: [{characterId: 44, sourceTagSha256: UNDERLINE_SHA}],
        sourceInstanceId: 'root/depth-1/generation-1>sprite-53/depth-19/generation-1',
        disposition: 'suppressed-with-native-question-and-existing-semantic-glossary-buttons',
        authoredWords: false, mathGeometry: false, evidence: [report.pin]},
      {kind: 'decorative-question-background', role: 'decoration',
        sourceShapeHashes: [{characterId: 42, sourceTagSha256: PAPER_SHA}],
        sourceInstanceId: 'root/depth-1/generation-1>sprite-53/depth-17/generation-17',
        disposition: 'replaced-by-native-light-yellow-question-paper',
        authoredWords: false, mathGeometry: false, evidence: [report.pin]},
    ],
    languagePolicy: {en: 'source', es: 'source-fallback'},
    sourceRiskEvidence: {sourceDisposition: report.pin,
      exactSuppressionManifest: nativeManifestFile.pin, nativeRuntimeMetadata: nativeMetaFile.pin,
      sourceParserRisks: source.risks.map(risk => risk.kind),
      technicalRiskCheckRecorded: false},
    generator: {path: GENERATOR_PATH,
      version: '1.2.0', sha256: files.get(GENERATOR_PATH)!.pin.sha256},
    implementation: {status: 'candidate', files: implementationFiles, closure},
    unresolved: [
      'The native text and exact glyph suppression implementation requires independent real-host validation.',
      'The 320–1920px and 200-percent text matrix, accessibility, lifecycle, performance and resource-stability checks are not yet recorded.',
      'The G678 source-risk dispositions and all twelve technical typography checks require independently hash-bound passed evidence.',
      'Registry activation can change generated dispatch files; final evidence must bind their actual final bytes.',
    ],
    independentPending: ['Original Flash runtime and fidelity', 'Named audio listening',
      'Human visual and Owner acceptance', 'Strict completion, release and publication'],
    preparationOnly: true,
  };
  for (const file of files.values()) assert.deepEqual(stableFile(ROOT, file.pin.path).pin, file.pin,
    `P006 typography input changed during preparation: ${file.pin.path}`);
  assert.deepEqual(stableFile(SOURCE_ROOT, SOURCE_PATH).pin, raw.pin);
  assert.deepEqual(stableFile(ROOT, 'catalog/typography-v1/g678-integration.json').pin, integrationFile.pin);
  return {binding, bytes: Buffer.from(`${JSON.stringify(binding, null, 2)}\n`)};
}

/** Validate a separately authored technical receipt against the complete fresh
 * page input inventory. Tests may supply an isolated fixture root; the CLI always
 * uses ROOT and obtains expected inputs from the physical source preparation. */
export function validateP006TypographyEvidence(evidencePath: string, expected: {
  implementationFiles: readonly Pin[]; sourceRisks: readonly string[];
}, root = ROOT, now = Date.now()) {
  ordinaryDirectory(root);
  relativePath(evidencePath);
  assert(![BINDING_PATH, CHECK_PATH, 'packages/demos/private-current-js-registry.json'].includes(evidencePath),
    'P006 receipt cannot be a generated binding, check, or registry');
  const receipt = stableFile(root, evidencePath);
  const evidence = JSON.parse(receipt.bytes.toString('utf8')) as TechnicalEvidence;
  assert(evidence && typeof evidence === 'object', 'P006 technical evidence object required');
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.kind, 'p006-technical-typography-evidence-v1');
  assert.equal(evidence.animationId, ID); assert.equal(evidence.placementId, ID);
  assert.equal(evidence.sourceSwfSha256, SOURCE_SHA);
  assert.equal(evidence.sourceCatalogContentSha256, CATALOG_SHA);
  assert(typeof evidence.checkedAt === 'string' && Number.isFinite(Date.parse(evidence.checkedAt)) &&
    Date.parse(evidence.checkedAt) <= now + 1000, 'P006 real nonfuture checkedAt required');
  assert.deepEqual(evidence.languagePolicy, {en: 'source', es: 'source-fallback'},
    'P006 English source and explicit Spanish fallback policy required');
  assert(evidence.checks && typeof evidence.checks === 'object' && !Array.isArray(evidence.checks));
  assert.deepEqual(Object.keys(evidence.checks).sort(), [...P006_TYPOGRAPHY_CHECKS].sort(),
    'P006 receipt must contain exactly the twelve technical typography checks');
  for (const check of P006_TYPOGRAPHY_CHECKS)
    assert.equal(evidence.checks[check], 'passed', `P006 technical check not passed: ${check}`);
  const risks = [...new Set(expected.sourceRisks)].sort();
  assert(Array.isArray(evidence.resolvedSourceRisks) &&
    evidence.resolvedSourceRisks.every(risk => typeof risk === 'string'));
  assert.deepEqual([...evidence.resolvedSourceRisks].sort(), risks,
    'P006 receipt must resolve every current parser risk exactly once');
  const forbidden = new Set([BINDING_PATH, CHECK_PATH, evidencePath,
    'packages/demos/private-current-js-registry.json']);
  const readReferences = (references: ArtifactReference[], label: string) => {
    assert(Array.isArray(references) && references.length > 0, `P006 ${label} must be nonempty`);
    const seen = new Set<string>();
    return references.map(reference => {
      assert(reference && typeof reference === 'object' && SHA.test(reference.sha256 ?? ''),
        `P006 ${label} reference must have a full SHA-256`);
      relativePath(reference.path);
      assert(!forbidden.has(reference.path) && !seen.has(reference.path),
        `P006 ${label} circular or duplicate reference: ${reference.path}`);
      seen.add(reference.path);
      const current = stableFile(root, reference.path);
      assert.equal(current.pin.sha256, reference.sha256, `P006 stale ${label}: ${reference.path}`);
      if (reference.bytes !== undefined) assert.equal(reference.bytes, current.pin.bytes,
        `P006 stale ${label} size: ${reference.path}`);
      return current.pin;
    }).sort((a, b) => compare(a.path, b.path));
  };
  const artifacts = readReferences(evidence.artifacts, 'evidence artifact');
  const checked = readReferences(evidence.checkedImplementationFiles, 'checked implementation');
  assert.deepEqual(checked, [...expected.implementationFiles].sort((a, b) => compare(a.path, b.path)),
    'P006 receipt must bind all current implementation files without omissions or extras');
  assert(Array.isArray(evidence.sourceRiskResolutions) && evidence.sourceRiskResolutions.length === risks.length,
    'P006 source-risk evidence disposition required for every current risk');
  const artifactPaths = new Set(artifacts.map(artifact => artifact.path));
  const resolvedKinds = new Set<string>();
  for (const resolution of evidence.sourceRiskResolutions) {
    assert(resolution && risks.includes(resolution.kind) && !resolvedKinds.has(resolution.kind),
      'P006 source-risk disposition must name an exact current risk only once');
    resolvedKinds.add(resolution.kind);
    assert(typeof resolution.disposition === 'string' && resolution.disposition.trim(),
      `P006 source-risk disposition explanation required: ${resolution.kind}`);
    assert(Array.isArray(resolution.artifactPaths) && resolution.artifactPaths.length &&
      new Set(resolution.artifactPaths).size === resolution.artifactPaths.length &&
      resolution.artifactPaths.every(relative => artifactPaths.has(relative)),
    `P006 source-risk disposition must cite current receipt artifacts: ${resolution.kind}`);
  }
  // Re-read after the complete receipt/schema/risk validation, so even a
  // correctly shaped receipt cannot bind files that changed during validation.
  for (const pin of [...artifacts, ...checked, receipt.pin])
    assert.deepEqual(stableFile(root, pin.path).pin, pin, `P006 evidence changed during validation: ${pin.path}`);
  return {evidence, receipt: receipt.pin, artifacts, checkedImplementationFiles: checked};
}

export function finalizeP006TypographyBinding(prepared: Awaited<ReturnType<typeof prepareP006TypographyBinding>>,
  evidencePath: string) {
  const verified = validateP006TypographyEvidence(evidencePath, {
    implementationFiles: prepared.binding.implementation.files,
    sourceRisks: prepared.binding.sourceRiskEvidence.sourceParserRisks,
  });
  const binding = {...prepared.binding,
    implementation: {...prepared.binding.implementation, status: 'implemented'},
    sourceRiskEvidence: {...prepared.binding.sourceRiskEvidence,
      technicalRiskCheckRecorded: true, technicalReceipt: verified.receipt,
      resolutions: verified.evidence.sourceRiskResolutions},
    unresolved: [], preparationOnly: false,
    technicalFinalization: {kind: 'p006-technical-typography-finalization-v1',
      checkedAt: verified.evidence.checkedAt, receipt: verified.receipt,
      scope: 'Source-bound native text on the local modern My Lesson host; independent acceptance gates remain pending.'},
  };
  const bytes = Buffer.from(`${JSON.stringify(binding, null, 2)}\n`);
  const artifacts = [...verified.artifacts, verified.receipt].sort((a, b) => compare(a.path, b.path));
  const check = {schemaVersion: 1, kind: 'g678-lesson-typography-check-v1',
    animationId: ID, placementId: ID, sourceSwfSha256: SOURCE_SHA,
    sourceCatalogContentSha256: CATALOG_SHA, bindingSha256: hash(bytes),
    checkedAt: verified.evidence.checkedAt, checks: verified.evidence.checks,
    resolvedSourceRisks: verified.evidence.resolvedSourceRisks,
    sourceRiskResolutions: verified.evidence.sourceRiskResolutions,
    languagePolicy: verified.evidence.languagePolicy, artifacts,
    checkedImplementationFiles: verified.checkedImplementationFiles,
    producer: binding.generator, receipt: verified.receipt,
    technicalScope: binding.technicalFinalization.scope,
    humanReviewed: false, ownerAccepted: false, originalRuntimeAccepted: false,
    audioAccepted: false, strictComplete: false, published: false,
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none'};
  return {binding, bytes, check, checkBytes: Buffer.from(`${JSON.stringify(check, null, 2)}\n`), verified};
}

function normalizedDeclaredPins(references: ArtifactReference[], label: string) {
  assert(Array.isArray(references) && references.length, `P006 ${label} pins required`);
  const seen = new Set<string>();
  return references.map(reference => {
    assert(reference && SHA.test(reference.sha256 ?? ''), `P006 ${label} full hash required`);
    relativePath(reference.path);
    assert(!seen.has(reference.path), `P006 ${label} duplicate pin: ${reference.path}`);
    seen.add(reference.path);
    assert(Number.isSafeInteger(reference.bytes) && reference.bytes! >= 0,
      `P006 ${label} exact byte count required: ${reference.path}`);
    return {path: reference.path, bytes: reference.bytes!, sha256: reference.sha256};
  }).sort((a, b) => compare(a.path, b.path));
}

/** Old implementation bytes are historical: source/registration wiring may now
 * have changed. We verify their declarations against the old check/receipt, but
 * never treat them as current. Historical checked artifacts must still exist at
 * their original paths with their original hashes; drift is not silently recast
 * as a new result. The Owner must preserve them before editing those files. */
export function validateP006TypographyPriorPair(options: Omit<P006TypographyRefreshOptions, 'evidencePath'>,
  sourceRisks: readonly string[], root = ROOT) {
  ordinaryDirectory(root);
  assert(SHA.test(options.fromBindingSha256) && SHA.test(options.fromCheckSha256),
    'P006 refresh requires both exact prior pair SHA-256 values');
  relativePath(options.backupBindingPath); relativePath(options.backupCheckPath);
  assert(options.backupBindingPath !== options.backupCheckPath &&
    ![BINDING_PATH, CHECK_PATH, 'packages/demos/private-current-js-registry.json'].some(relative =>
      [options.backupBindingPath, options.backupCheckPath].includes(relative)),
  'P006 prior pair must have two distinct preserved backup paths');
  const bindingFile = stableFile(root, options.backupBindingPath);
  const checkFile = stableFile(root, options.backupCheckPath);
  assert.equal(bindingFile.pin.sha256, options.fromBindingSha256, 'P006 prior binding backup hash mismatch');
  assert.equal(checkFile.pin.sha256, options.fromCheckSha256, 'P006 prior check backup hash mismatch');
  const binding = JSON.parse(bindingFile.bytes.toString('utf8')) as ReturnType<typeof finalizeP006TypographyBinding>['binding'];
  const check = JSON.parse(checkFile.bytes.toString('utf8')) as ReturnType<typeof finalizeP006TypographyBinding>['check'];
  assert(binding && check && binding.schemaVersion === 1 && check.schemaVersion === 1 &&
    binding.animationId === ID && binding.placementId === ID && check.animationId === ID && check.placementId === ID &&
    binding.sourceSwfSha256 === SOURCE_SHA && check.sourceSwfSha256 === SOURCE_SHA &&
    binding.sourceCatalogContentSha256 === CATALOG_SHA && check.sourceCatalogContentSha256 === CATALOG_SHA,
  'P006 prior finalized source and placement identity mismatch');
  assert(binding.implementation?.status === 'implemented' && binding.preparationOnly === false &&
    Array.isArray(binding.unresolved) && binding.unresolved.length === 0 &&
    binding.sourceRiskEvidence?.technicalRiskCheckRecorded === true &&
    binding.technicalFinalization?.kind === 'p006-technical-typography-finalization-v1' &&
    check.kind === 'g678-lesson-typography-check-v1' && check.bindingSha256 === bindingFile.pin.sha256,
  'P006 prior binding/check must be a consistent finalized pair');
  assert(binding.generator?.path === GENERATOR_PATH &&
    ['1.1.0', '1.2.0'].includes(binding.generator.version) && SHA.test(binding.generator.sha256 ?? ''),
  'P006 prior finalized pair belongs to another producer');
  assert.deepEqual(check.producer, binding.generator, 'P006 prior producer pins disagree');
  assert(typeof check.checkedAt === 'string' && Number.isFinite(Date.parse(check.checkedAt)) &&
    Date.parse(check.checkedAt) <= Date.now() + 1000 &&
    check.checkedAt === binding.technicalFinalization.checkedAt, 'P006 prior checkedAt mismatch');
  assert.deepEqual(Object.keys(check.checks ?? {}).sort(), [...P006_TYPOGRAPHY_CHECKS].sort());
  for (const name of P006_TYPOGRAPHY_CHECKS) assert.equal(check.checks[name], 'passed',
    `P006 prior technical check was not passed: ${name}`);
  const riskKinds = [...new Set(sourceRisks)].sort();
  assert.deepEqual([...check.resolvedSourceRisks].sort(), riskKinds, 'P006 prior source risks drifted');
  assert.deepEqual([...binding.sourceRiskEvidence.sourceParserRisks].sort(), riskKinds,
    'P006 prior binding source risks drifted');
  for (const policy of [binding.languagePolicy, check.languagePolicy])
    assert.deepEqual(policy, {en: 'source', es: 'source-fallback'}, 'P006 prior language policy mismatch');
  for (const gate of ['humanReviewed', 'ownerAccepted', 'originalRuntimeAccepted', 'audioAccepted',
    'strictComplete', 'published'] as const) assert.equal(check[gate], false,
    `P006 refresh cannot inherit an independent acceptance claim: ${gate}`);
  const oldFiles = normalizedDeclaredPins(binding.implementation.files, 'historical implementation');
  assert(oldFiles.some(pin => pin.path === GENERATOR_PATH && pin.sha256 === binding.generator.sha256),
    'P006 prior implementation omitted its own producer bytes');
  assert.deepEqual(normalizedDeclaredPins(check.checkedImplementationFiles, 'historical checked implementation'),
    oldFiles, 'P006 prior check did not bind its own implementation inventory');
  const artifacts = normalizedDeclaredPins(check.artifacts, 'historical evidence');
  for (const reference of artifacts) {
    assert(![BINDING_PATH, CHECK_PATH, 'packages/demos/private-current-js-registry.json'].includes(reference.path),
      'P006 historical evidence cannot reference mutable pair outputs or registry');
    assert.deepEqual(stableFile(root, reference.path).pin, reference,
      `P006 historical checked artifact changed: ${reference.path}`);
  }
  assert(Array.isArray(check.sourceRiskResolutions) && check.sourceRiskResolutions.length === riskKinds.length,
    'P006 prior risk dispositions are incomplete');
  const priorRiskKinds = new Set<string>(), historicalPaths = new Set(artifacts.map(pin => pin.path));
  for (const resolution of check.sourceRiskResolutions) {
    assert(resolution && riskKinds.includes(resolution.kind) && !priorRiskKinds.has(resolution.kind) &&
      typeof resolution.disposition === 'string' && resolution.disposition.trim() &&
      Array.isArray(resolution.artifactPaths) && resolution.artifactPaths.length &&
      new Set(resolution.artifactPaths).size === resolution.artifactPaths.length &&
      resolution.artifactPaths.every(relative => historicalPaths.has(relative)),
    'P006 prior risk disposition is not bound to its checked artifacts');
    priorRiskKinds.add(resolution.kind);
  }
  const previousRefresh = Reflect.get(binding, 'technicalRefresh') as {
    kind: string; priorBinding: Pin; priorCheck: Pin; checkedAt: string;
  } | undefined;
  assert.deepEqual(Reflect.get(check, 'technicalRefresh'), previousRefresh,
    'P006 prior refresh history disagrees between binding and check');
  if (previousRefresh) {
    assert(previousRefresh.kind === 'p006-technical-typography-refresh-v1' &&
      previousRefresh.checkedAt === check.checkedAt, 'P006 prior refresh history identity mismatch');
    for (const historicalPair of [previousRefresh.priorBinding, previousRefresh.priorCheck])
      assert(artifacts.some(pin => pin.path === historicalPair?.path &&
        pin.sha256 === historicalPair.sha256 && pin.bytes === historicalPair.bytes),
      'P006 prior refresh omitted a preserved pair artifact');
  }
  assert.deepEqual(check.receipt, binding.technicalFinalization.receipt, 'P006 prior receipt pins disagree');
  assert.deepEqual(check.receipt, binding.sourceRiskEvidence.technicalReceipt, 'P006 prior source-risk receipt mismatch');
  assert(artifacts.some(reference => reference.path === check.receipt.path &&
    reference.sha256 === check.receipt.sha256 && reference.bytes === check.receipt.bytes),
  'P006 prior check must include its original receipt bytes');
  const oldReceipt = JSON.parse(stableFile(root, check.receipt.path).bytes.toString('utf8')) as TechnicalEvidence;
  assert(oldReceipt.schemaVersion === 1 && oldReceipt.kind === 'p006-technical-typography-evidence-v1' &&
    oldReceipt.animationId === ID && oldReceipt.placementId === ID && oldReceipt.sourceSwfSha256 === SOURCE_SHA &&
    oldReceipt.sourceCatalogContentSha256 === CATALOG_SHA && oldReceipt.checkedAt === check.checkedAt,
  'P006 prior receipt identity mismatch');
  assert.deepEqual(oldReceipt.checks, check.checks, 'P006 prior checks do not match the original receipt');
  assert.deepEqual(oldReceipt.languagePolicy, check.languagePolicy);
  assert.deepEqual(oldReceipt.resolvedSourceRisks, check.resolvedSourceRisks);
  assert.deepEqual(oldReceipt.sourceRiskResolutions, check.sourceRiskResolutions);
  assert.deepEqual(binding.sourceRiskEvidence.resolutions, check.sourceRiskResolutions);
  assert.deepEqual(normalizedDeclaredPins(oldReceipt.checkedImplementationFiles, 'original receipt implementation'),
    oldFiles, 'P006 prior receipt did not bind its original implementation');
  for (const declared of normalizedDeclaredPins(oldReceipt.artifacts, 'original receipt artifact'))
    assert(artifacts.some(pin => pin.path === declared.path && pin.sha256 === declared.sha256 && pin.bytes === declared.bytes),
      `P006 prior check omitted a receipt artifact: ${declared.path}`);
  for (const pin of [bindingFile.pin, checkFile.pin, ...artifacts])
    assert.deepEqual(stableFile(root, pin.path).pin, pin, `P006 history changed during validation: ${pin.path}`);
  return {binding, check, bindingBackup: bindingFile.pin, checkBackup: checkFile.pin, artifacts, oldFiles};
}

export function assertP006TypographyRefreshEvidence(verified: ReturnType<typeof validateP006TypographyEvidence>,
  prior: ReturnType<typeof validateP006TypographyPriorPair>) {
  assert(verified.receipt.path !== prior.check.receipt.path && verified.receipt.sha256 !== prior.check.receipt.sha256,
    'P006 refresh requires a new receipt path and new receipt bytes');
  assert(Date.parse(verified.evidence.checkedAt) > Date.parse(prior.check.checkedAt),
    'P006 refresh requires a later real checkedAt');
  const oldArtifacts = new Set(prior.artifacts.map(pin => `${pin.path}:${pin.sha256}`));
  assert(verified.artifacts.some(pin => !oldArtifacts.has(`${pin.path}:${pin.sha256}`)),
    'P006 refresh requires new technical evidence artifacts');
  assert.notDeepEqual(verified.checkedImplementationFiles, prior.oldFiles,
    'P006 refresh requires newly checked current implementation bytes');
}

export function preserveP006TypographyRefreshArtifacts(freshArtifacts: readonly Pin[],
  currentImplementation: readonly Pin[], prior: Pick<ReturnType<typeof validateP006TypographyPriorPair>,
  'bindingBackup' | 'checkBackup' | 'artifacts'>) {
  for (const pin of [prior.bindingBackup, prior.checkBackup])
    assert(!currentImplementation.some(file => file.path === pin.path),
      `P006 historical pair backup cannot become a current implementation input: ${pin.path}`);
  for (const historical of prior.artifacts) {
    const current = currentImplementation.find(file => file.path === historical.path);
    // Source reports can be both old checked artifacts and current source
    // inputs. That legitimate overlap must retain the same exact bytes.
    if (current) assert.deepEqual(current, historical,
      `P006 overlapping historical artifact changed: ${historical.path}`);
  }
  const artifactMap = new Map<string, Pin>();
  for (const pin of [...freshArtifacts, prior.bindingBackup, prior.checkBackup, ...prior.artifacts]) {
    const previous = artifactMap.get(pin.path);
    assert(!previous || (previous.sha256 === pin.sha256 && previous.bytes === pin.bytes),
      `P006 new evidence conflicts with preserved history: ${pin.path}`);
    artifactMap.set(pin.path, pin);
  }
  return [...artifactMap.values()].sort((a, b) => compare(a.path, b.path));
}

export async function prepareP006TypographyRefresh(options: P006TypographyRefreshOptions) {
  const prepared = await prepareP006TypographyBinding();
  const prior = validateP006TypographyPriorPair(options, prepared.binding.sourceRiskEvidence.sourceParserRisks);
  const fresh = finalizeP006TypographyBinding(prepared, options.evidencePath);
  assertP006TypographyRefreshEvidence(fresh.verified, prior);
  const artifacts = preserveP006TypographyRefreshArtifacts(fresh.check.artifacts,
    fresh.binding.implementation.files, prior);
  const technicalRefresh = {kind: 'p006-technical-typography-refresh-v1',
    priorBinding: prior.bindingBackup, priorCheck: prior.checkBackup,
    priorCheckedAt: prior.check.checkedAt, checkedAt: fresh.check.checkedAt,
    preservedPriorArtifacts: prior.artifacts.length,
    currentInputPolicy: 'New receipt binds every current implementation file; prior inputs are historical only.'};
  const binding = {...fresh.binding, technicalRefresh};
  const bytes = Buffer.from(`${JSON.stringify(binding, null, 2)}\n`);
  const check = {...fresh.check, bindingSha256: hash(bytes), technicalRefresh,
    artifacts};
  return {...fresh, binding, bytes, check, checkBytes: Buffer.from(`${JSON.stringify(check, null, 2)}\n`), prior};
}

export function assertReplaceableP006Candidate(existing: Buffer) {
  const record = JSON.parse(existing.toString('utf8'));
  assert(record.schemaVersion === 1 && record.animationId === ID && record.placementId === ID &&
    record.sourceSwfSha256 === SOURCE_SHA && record.sourceCatalogContentSha256 === CATALOG_SHA &&
    record.generator?.path === GENERATOR_PATH && ['1.0.0', '1.1.0', '1.2.0'].includes(record.generator.version) &&
    SHA.test(record.generator.sha256 ?? '') && record.implementation?.status === 'candidate' &&
    record.preparationOnly === true && Array.isArray(record.unresolved) && record.unresolved.length > 0 &&
    record.sourceRiskEvidence?.technicalRiskCheckRecorded === false && !record.technicalFinalization,
  'P006 refuses to overwrite a foreign or finalized binding');
}

function parseArguments(argv: string[]) {
  const modes = new Set(['--dry-run', '--write', '--check']);
  let mode = '--dry-run', modeSeen = false, evidencePath: string | undefined, backupPath: string | undefined;
  let refresh = false;
  const refreshArguments = new Map<string, string>();
  const refreshNames = ['--from-binding-sha256', '--from-check-sha256', '--backup-binding', '--backup-check'];
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]!;
    if (modes.has(argument)) {assert(!modeSeen, 'P006 only one output mode is allowed'); mode = argument; modeSeen = true;}
    else if (argument === '--refresh') {assert(!refresh, 'Duplicate P006 refresh option'); refresh = true;}
    else if (refreshNames.includes(argument)) {
      const value = argv[++index];
      assert(typeof value === 'string' && !refreshArguments.has(argument), 'P006 refresh option missing or duplicated');
      if (argument.endsWith('-sha256')) assert(SHA.test(value), 'P006 refresh requires exact full pair hashes');
      else relativePath(value);
      refreshArguments.set(argument, value);
    }
    else if (argument === '--evidence' || argument === '--backup') {
      const value = argv[++index]; relativePath(value);
      if (argument === '--evidence') {assert(!evidencePath, 'Duplicate P006 evidence option'); evidencePath = value;}
      else {assert(!backupPath, 'Duplicate P006 backup option'); backupPath = value;}
    } else throw Error('Usage: tsx scripts/prepare-g678-alg-l12-p006-typography-binding.mts [--dry-run|--write|--check] [--evidence <receipt.json>] [--backup <prior-candidate.json>] OR --refresh [--dry-run|--write|--check] --evidence <new-receipt.json> --from-binding-sha256 <SHA256> --from-check-sha256 <SHA256> --backup-binding <preserved-binding.json> --backup-check <preserved-check.json>');
  }
  assert(!backupPath || mode === '--write', 'P006 backup is meaningful only with --write');
  assert(!refreshArguments.size || refresh, 'P006 prior pair options require explicit --refresh');
  if (refresh) assert(evidencePath && !backupPath && refreshNames.every(name => refreshArguments.has(name)),
    'P006 refresh requires new evidence and both exact pair hashes/backups; candidate --backup is incompatible');
  const refreshOptions = refresh ? {evidencePath: evidencePath!,
    fromBindingSha256: refreshArguments.get('--from-binding-sha256')!,
    fromCheckSha256: refreshArguments.get('--from-check-sha256')!,
    backupBindingPath: refreshArguments.get('--backup-binding')!,
    backupCheckPath: refreshArguments.get('--backup-check')!} : undefined;
  return {mode, evidencePath, backupPath, refreshOptions};
}

function assertActiveRefreshPair(prior: ReturnType<typeof validateP006TypographyPriorPair>) {
  const binding = stableFile(ROOT, BINDING_PATH), check = stableFile(ROOT, CHECK_PATH);
  assert(binding.pin.sha256 === prior.bindingBackup.sha256 && binding.pin.bytes === prior.bindingBackup.bytes &&
    check.pin.sha256 === prior.checkBackup.sha256 && check.pin.bytes === prior.checkBackup.bytes,
  'P006 active finalized pair does not match the explicitly preserved prior pair');
  return {binding, check};
}

/** Stage both new records before touching the active pair. A publication error
 * restores only this operation's exact new bytes from the verified old backups;
 * unexpected concurrent bytes are never overwritten during rollback. */
function writeP006TypographyRefresh(result: Awaited<ReturnType<typeof prepareP006TypographyRefresh>>) {
  const old = assertActiveRefreshPair(result.prior);
  for (const pin of [...result.binding.implementation.files, ...result.check.artifacts])
    assert.deepEqual(stableFile(ROOT, pin.path).pin, pin, `P006 refresh input drift before write: ${pin.path}`);
  const stages = [
    {output: BINDING_PATH, bytes: result.bytes, old: old.binding.bytes, replaced: false},
    {output: CHECK_PATH, bytes: result.checkBytes, old: old.check.bytes, replaced: false},
  ];
  const temporary: string[] = [];
  const stageFile = (relative: string, bytes: Buffer) => {
    const descriptor = fs.openSync(path.join(ROOT, relative), 'wx');
    temporary.push(relative);
    try {fs.writeFileSync(descriptor, bytes);} finally {fs.closeSync(descriptor);}
  };
  try {
    for (const stage of stages) {
      ordinaryDirectory(path.dirname(path.join(ROOT, stage.output)));
      const next = `${stage.output}.refresh-next-${process.pid}`;
      stageFile(next, stage.bytes);
    }
    for (const pin of [...result.binding.implementation.files, ...result.check.artifacts])
      assert.deepEqual(stableFile(ROOT, pin.path).pin, pin, `P006 refresh input changed during staging: ${pin.path}`);
    assertActiveRefreshPair(result.prior);
    for (const stage of stages) {
      fs.renameSync(path.join(ROOT, `${stage.output}.refresh-next-${process.pid}`), path.join(ROOT, stage.output));
      stage.replaced = true;
    }
    for (const stage of stages) assert(stableFile(ROOT, stage.output).bytes.equals(stage.bytes),
      `P006 refreshed output verification failed: ${stage.output}`);
  } catch (error) {
    for (const stage of [...stages].reverse()) if (stage.replaced) {
      assert(stableFile(ROOT, stage.output).bytes.equals(stage.bytes),
        `P006 refuses to roll back unexpected concurrent bytes: ${stage.output}`);
      const restore = `${stage.output}.refresh-restore-${process.pid}`;
      stageFile(restore, stage.old);
      fs.renameSync(path.join(ROOT, restore), path.join(ROOT, stage.output));
    }
    throw error;
  } finally {
    for (const relative of temporary) if (fs.existsSync(path.join(ROOT, relative)))
      fs.unlinkSync(path.join(ROOT, relative));
  }
}

export async function main(argv = process.argv.slice(2)) {
  const {mode, evidencePath, backupPath, refreshOptions} = parseArguments(argv);
  const refreshed = refreshOptions ? await prepareP006TypographyRefresh(refreshOptions) : undefined;
  const prepared = refreshed ? undefined : await prepareP006TypographyBinding();
  const finalized = refreshed ?? (evidencePath ? finalizeP006TypographyBinding(prepared!, evidencePath) : undefined);
  const result = finalized ?? prepared!;
  const output = path.join(ROOT, BINDING_PATH);
  const prior = fs.existsSync(output) ? stableFile(ROOT, BINDING_PATH) : undefined;
  if (refreshed && mode !== '--check') assertActiveRefreshPair(refreshed.prior);
  if (mode === '--write' && refreshed) writeP006TypographyRefresh(refreshed);
  else if (mode === '--write') {
    // All identity, hash and overwrite checks precede the first mutation.
    assert(!fs.existsSync(path.join(ROOT, CHECK_PATH)), 'P006 refuses to overwrite an existing technical check');
    if (prior) {
      assertReplaceableP006Candidate(prior.bytes);
      assert(backupPath, 'P006 replacing its own candidate requires an explicit --backup path');
    }
    if (backupPath) {
      assert(prior, 'P006 backup requires an existing candidate');
      assert(![BINDING_PATH, CHECK_PATH, evidencePath].includes(backupPath) &&
        !result.binding.implementation.files.some(file => file.path === backupPath) &&
        !finalized?.check.artifacts.some(file => file.path === backupPath), 'P006 backup cannot replace an input or output');
      assert(!fs.existsSync(path.join(ROOT, backupPath)), 'P006 backup must be a new file');
    }
    // Every input is re-read before even the backup/directory mutations.
    for (const pin of result.binding.implementation.files)
      assert.deepEqual(stableFile(ROOT, pin.path).pin, pin, `P006 input changed before write: ${pin.path}`);
    if (finalized) for (const pin of finalized.check.artifacts)
      assert.deepEqual(stableFile(ROOT, pin.path).pin, pin, `P006 artifact changed before write: ${pin.path}`);
    if (prior) assert.deepEqual(stableFile(ROOT, BINDING_PATH).pin, prior.pin,
      'P006 prior candidate changed before replacement');
    const makeParent = (relative: string) => {
      let parent = ROOT;
      for (const segment of path.dirname(relative).split(path.sep)) {
        if (segment === '.') continue;
        parent = path.join(parent, segment);
        if (!fs.existsSync(parent)) fs.mkdirSync(parent);
        ordinaryDirectory(parent);
      }
    };
    makeParent(BINDING_PATH);
    if (finalized) makeParent(CHECK_PATH);
    if (backupPath) {makeParent(backupPath); fs.writeFileSync(path.join(ROOT, backupPath), prior!.bytes, {flag: 'wx'});}
    if (prior) {
      const nextPath = `${BINDING_PATH}.next-${process.pid}`;
      fs.writeFileSync(path.join(ROOT, nextPath), result.bytes, {flag: 'wx'});
      fs.renameSync(path.join(ROOT, nextPath), output);
    } else fs.writeFileSync(output, result.bytes, {flag: 'wx'});
    if (finalized) fs.writeFileSync(path.join(ROOT, CHECK_PATH), finalized.checkBytes, {flag: 'wx'});
  } else if (mode === '--check') {
    assert(prior?.bytes.equals(result.bytes), 'P006 typography binding drift');
    if (finalized) assert(stableFile(ROOT, CHECK_PATH).bytes.equals(finalized.checkBytes),
      'P006 technical check record drift');
  }
  const prefix = refreshed ? 'TECHNICAL_REFRESH' : finalized ? 'TECHNICAL_FINALIZATION' : 'CANDIDATE_BINDING';
  const report = {status: `${prefix}_${mode === '--write' ? 'WRITTEN' : mode === '--check' ? 'EXACT' : 'INPUTS_VERIFIED'}`, mode,
    output: {path: BINDING_PATH, bytes: result.bytes.length, sha256: hash(result.bytes)},
    ...(finalized ? {check: {path: CHECK_PATH, bytes: finalized.checkBytes.length, sha256: hash(finalized.checkBytes)},
      receipt: finalized.verified.receipt} : {}),
    ...(backupPath && prior ? {priorBindingBackup: {...prior.pin, path: backupPath}} : {}),
    ...(refreshed ? {preservedPriorPair: {binding: refreshed.prior.bindingBackup, check: refreshed.prior.checkBackup},
      preservedPriorArtifacts: refreshed.prior.artifacts.length} : {}),
    blocks: result.binding.blocks.length, implementationFiles: result.binding.implementation.files.length,
    unresolved: result.binding.unresolved, technicalTypographyPassed: Boolean(finalized),
    technicalPassRecorded: Boolean(finalized && mode !== '--dry-run'),
    currentJavaScriptRegistrationEffect: 'none', strictCompletionEffect: 'none', publicationEffect: 'none'};
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  main().catch(error => {process.stderr.write(`${error.message}\n`); process.exitCode = 1;});
}
