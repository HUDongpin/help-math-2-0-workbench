#!/usr/bin/env node
// Emit one HFR-converted lesson into the workbench (seam C of
// "Animations_on Modern Shell.md"). Everything written here is generated:
//
//   packages/demos/src/hfr-pages/<id>.ts       generated page logic (import path rewritten)
//   packages/demos/src/modules/<id>.ts         4-line registry wrapper with the page meta
//   packages/demos/private-current-js-registry.json   one calibration (clock: renderer)
//   catalog/product-bridge-calibrations/<calibration>.json   freeze manifest
//   apps/web/lib/hfr/<lesson>.generated.ts     course facts + release navigation binding
//   apps/web/public/hfr/<bundle>/<id>/...      page data and media (git-ignored, local only)
//
// Usage:
//   node scripts/hfr/emit-lesson.mjs \
//     --hfr-out <hfr-sample/out/nms002-l07> \
//     --release-manifest <catalog/g678-page-only-release-manifest.v1.json> \
//     --course-xml <G6-G8-shared/NMS002/L7/index.xml>
//
// Generated page modules are never edited by hand: fix the converter or the
// runtime and emit again.
import {createHash} from 'node:crypto';
import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const demosRoot = path.join(repositoryRoot, 'packages/demos');
const webRoot = path.join(repositoryRoot, 'apps/web');

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || !process.argv[index + 1]) throw new Error(`Missing --${name}`);
  return path.resolve(process.argv[index + 1]);
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const ACTIVITY_CALLS = /enableQuizButton|showRightFeed|showWrongFeed|\bnext_mc\b/u;

async function filesUnder(directory) {
  const out = [];
  for (const name of (await readdir(directory)).sort()) {
    const file = path.join(directory, name);
    if ((await stat(file)).isDirectory()) out.push(...await filesUnder(file));
    else out.push(file);
  }
  return out;
}

async function main() {
  const hfrOut = argument('hfr-out');
  const manifestPath = argument('release-manifest');
  const courseXmlPath = argument('course-xml');

  const lesson = await readJson(path.join(hfrOut, 'lesson.json'));
  const verification = await readJson(path.join(hfrOut, 'verification.json'));
  if (lesson.schema !== 'hfr-lesson/1') throw new Error('Unexpected HFR lesson schema');
  const moduleCode = String(lesson.module).toUpperCase();
  const moduleSlug = moduleCode.toLowerCase();
  const lessonNumber = Number(lesson.lesson);
  const lessonSlug = `${moduleSlug}-l${String(lessonNumber).padStart(2, '0')}`;
  const courseKey = `shared-${lessonSlug}`;
  const calibrationId = `hfr-${lessonSlug}-v1`;

  // Independent authority: the release manifest built from the course XML.
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  const release = manifest.releases.find((entry) =>
    entry.moduleCode === moduleCode && entry.moduleLesson === lessonNumber);
  if (!release) throw new Error(`No release for ${moduleCode} L${lessonNumber}`);
  const courseXmlSha256 = sha256(await readFile(courseXmlPath));
  if (courseXmlSha256 !== release.sourceLesson.sha256) {
    throw new Error('Course XML does not match the release manifest');
  }
  const members = release.members;
  if (members.length !== lesson.pages.length) throw new Error('Page count differs from the release');

  const verified = new Map(verification.pages.map((page) => [page.id, page]));
  const pagesByFile = Object.fromEntries(lesson.pages.map((page) => [String(page.file).toUpperCase(), page.animationId]));

  // Clean previous output for this lesson.
  const pagesDir = path.join(demosRoot, 'src/hfr-pages');
  const modulesDir = path.join(demosRoot, 'src/modules');
  const publicDir = path.join(webRoot, 'public/hfr');
  await mkdir(pagesDir, {recursive: true});
  for (const page of lesson.pages) {
    await rm(path.join(pagesDir, `${page.animationId}.ts`), {force: true});
    await rm(path.join(modulesDir, `${page.animationId}.ts`), {force: true});
  }

  const coursePages = [];
  const selectedPages = [];
  const entries = [];
  const sectionOrdinals = new Map();
  for (const [index, page] of lesson.pages.entries()) {
    const member = members[index];
    if (member.animationId !== page.animationId || member.source.sha256 !== page.sha256) {
      throw new Error(`Page ${index + 1} differs from the release manifest`);
    }
    const check = verified.get(page.animationId);
    if (!check?.same) throw new Error(`${page.animationId} has no passing T0b equivalence record`);
    const sourceDir = path.join(hfrOut, page.dir);
    const dataFile = path.join(sourceDir, `${page.animationId}.data.json`);
    const dataBytes = await readFile(dataFile);
    const data = JSON.parse(dataBytes);
    const tsSource = await readFile(path.join(sourceDir, `${page.animationId}.ts`), 'utf8');

    // Content-addressed bundle: page data plus every media file.
    const mediaDir = path.join(sourceDir, 'media');
    const mediaFiles = await filesUnder(mediaDir).catch(() => []);
    const bundleHash = createHash('sha256').update(dataBytes);
    for (const file of mediaFiles) {
      bundleHash.update(path.relative(mediaDir, file)).update(sha256(await readFile(file)));
    }
    const bundle = bundleHash.digest('hex').slice(0, 20);
    const targetDir = path.join(publicDir, bundle, page.animationId);
    await rm(targetDir, {recursive: true, force: true});
    await mkdir(targetDir, {recursive: true});
    await cp(dataFile, path.join(targetDir, `${page.animationId}.data.json`));
    if (mediaFiles.length) await cp(mediaDir, path.join(targetDir, 'media'), {recursive: true});

    const longest = [...data.streams].sort((a, b) => b.samples - a.samples)[0];
    const progressTimeline = longest?.timeline ?? 0;
    const progressFrameCount = progressTimeline === 0
      ? data.root.frameCount
      : data.dictionary[progressTimeline]?.frameCount ?? data.root.frameCount;
    const sectionPageOrdinal = (sectionOrdinals.get(page.sectionCode) ?? 0) + 1;
    sectionOrdinals.set(page.sectionCode, sectionPageOrdinal);
    const meta = {
      key: page.animationId,
      lessonKey: courseKey,
      dataUrl: `/hfr/${bundle}/${page.animationId}/${page.animationId}.data.json`,
      sourceSha256: page.sha256,
      compiler: data.compiler,
      stage: {width: data.stage.width, height: data.stage.height, fps: data.stage.fps},
      progressTimeline,
      progressFrameCount: Math.max(1, progressFrameCount),
      completionMode: ACTIVITY_CALLS.test(tsSource) ? 'activity' : 'timeline',
      lessonPagesByFile: pagesByFile,
      previousKey: lesson.pages[index - 1]?.animationId ?? null,
      nextKey: lesson.pages[index + 1]?.animationId ?? null,
      hasSpanishNarration: Boolean(data.spanishAudio),
    };

    const pageSource = tsSource.replace(
      /from "(?:\.\.\/)+runtime\/types";/u,
      'from "../hfr/types";',
    );
    if (pageSource === tsSource) throw new Error(`${page.animationId}: runtime import not found`);
    await writeFile(path.join(pagesDir, `${page.animationId}.ts`), pageSource);
    await writeFile(path.join(modulesDir, `${page.animationId}.ts`), [
      `// Generated by scripts/hfr/emit-lesson.mjs from ${data.compiler}. Do not edit.`,
      "import {createHfrAnimationModule} from '../hfr/module';",
      `import page from '../hfr-pages/${page.animationId}';`,
      '',
      `export default createHfrAnimationModule(${JSON.stringify(meta, null, 2)}, page);`,
      '',
    ].join('\n'));

    entries.push({
      key: page.animationId,
      module: `./modules/${page.animationId}`,
      maturity: 'private-current-js',
      complexityLane: 'hfr-translated-actionscript',
      clock: 'renderer',
    });
    selectedPages.push({
      animationId: page.animationId,
      complexityLane: 'hfr-translated-actionscript',
      sourceSha256: page.sha256,
      bundle,
      t0bEquivalence: {same: true, controls: check.clicks, shellCalls: check.hostCalls, ticks: check.ticks},
    });
    coursePages.push({
      animationId: page.animationId,
      placementId: member.placementId ?? page.animationId,
      assetId: member.assetId,
      sourceOccurrence: member.xmlOccurrence,
      ordinal: page.ordinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal,
      titleEnglish: page.titleEnglish ?? page.file,
      file: page.file,
    });
  }

  const sectionOrder = [...new Set(coursePages.map((page) => page.sectionCode))];
  const sections = sectionOrder.map((code, index) => ({
    order: index + 1,
    code,
    activePageCount: coursePages.filter((page) => page.sectionCode === code).length,
    firstActiveAnimationId: coursePages.find((page) => page.sectionCode === code).animationId,
    titleEnglish: lesson.sections[code]?.en ?? code,
    titleSpanish: lesson.sections[code]?.es ?? null,
  }));

  // Freeze manifest and registry calibration.
  const freezePath = path.join(repositoryRoot, 'catalog/product-bridge-calibrations', `${calibrationId}.json`);
  const freeze = {
    schemaVersion: 1,
    calibrationId,
    kind: 'hfr-translated-actionscript',
    compiler: lesson.compiler,
    courseKey,
    moduleCode,
    lesson: lessonNumber,
    sourceLesson: release.sourceLesson,
    releaseManifest: {path: 'catalog/g678-page-only-release-manifest.v1.json', releaseId: release.releaseId, sha256: sha256(manifestBytes)},
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    selectedPages,
  };
  const freezeText = `${JSON.stringify(freeze, null, 2)}\n`;
  await writeFile(freezePath, freezeText);

  const registryPath = path.join(demosRoot, 'private-current-js-registry.json');
  const registry = await readJson(registryPath);
  registry.calibrations = registry.calibrations.filter((entry) => entry.calibrationId !== calibrationId);
  registry.calibrations.push({
    calibrationId,
    freezeManifest: `catalog/product-bridge-calibrations/${calibrationId}.json`,
    entries,
  });
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  // Course facts for the descriptor, and the release navigation binding.
  const generated = {
    calibrationId,
    releaseId: `hfr-${lessonSlug}-local-preview-v1`,
    courseKey,
    moduleCode,
    lesson: lessonNumber,
    title: lesson.lessonTitle,
    sourceXmlPath: release.sourceLesson.path,
    sourceXmlSha256: courseXmlSha256,
    freeze: {path: `catalog/product-bridge-calibrations/${calibrationId}.json`, sha256: sha256(freezeText)},
    sections,
    pages: coursePages,
  };
  const navigation = {
    releaseManifestReleaseId: release.releaseId,
    members: members.map((member) => ({
      animationId: member.animationId,
      placementId: member.placementId ?? member.animationId,
      assetId: member.assetId,
      ordinal: member.ordinal,
      sectionCode: member.sectionCode,
      sourceOccurrence: member.xmlOccurrence,
    })),
  };
  const constName = lessonSlug.replace(/-/gu, '_').toUpperCase();
  await mkdir(path.join(webRoot, 'lib/hfr'), {recursive: true});
  await writeFile(path.join(webRoot, `lib/hfr/${lessonSlug}.generated.ts`), [
    '/* This file is generated by scripts/hfr/emit-lesson.mjs. Do not edit. */',
    '',
    `export const HFR_${constName}_COURSE = ${JSON.stringify(generated, null, 2)} as const;`,
    '',
    '/** Release order from the course-XML release manifest (independent of the HFR outline). */',
    `export const HFR_${constName}_RELEASE_NAVIGATION = ${JSON.stringify(navigation, null, 2)} as const;`,
    '',
  ].join('\n'));

  process.stdout.write(`emitted ${coursePages.length} pages of ${courseKey} (${calibrationId})\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
