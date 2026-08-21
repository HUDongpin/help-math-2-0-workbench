#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR_PATH = "scripts/build-g4-l10-page-only-current-js.mjs";
const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";
const LESSONS_PATH = "catalog/lessons.json";
const PREDECESSOR_FREEZE_PATH =
  "catalog/product-bridge-calibrations/g4-l10-candidate-to-product-v33.json";
const CALIBRATION_ID = "g4-l10-page-only-current-js-46-v1";
const FREEZE_PATH =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.json`;
const PRIVATE_REGISTRY_PATH = "packages/demos/private-current-js-registry.json";
const GENERATED_DATA_PATH =
  "apps/web/lib/g4-l10-page-only-current-js.generated.ts";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  behaviorParityAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  humanAudioAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  published: false,
});

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `invalid project path: ${relativePath}`,
  );
  const absolute = path.resolve(ROOT, relativePath);
  invariant(
    absolute.startsWith(`${ROOT}${path.sep}`),
    `path escapes project: ${relativePath}`,
  );
  return absolute;
}

async function bind(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`,
  );
  const bytes = await readFile(absolute);
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function readJson(relativePath) {
  return JSON.parse((await readFile(projectPath(relativePath))).toString("utf8"));
}

async function synchronize(relativePath, bytes, check) {
  const target = projectPath(relativePath);
  if (check) {
    const current = await readFile(target).catch(() => null);
    invariant(current?.equals(bytes), `${relativePath}: generated output is stale`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function filesBelow(relativeDirectory) {
  const results = [];
  async function visit(relativePath) {
    const entries = await readdir(projectPath(relativePath), {withFileTypes: true});
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name))) {
      const child = `${relativePath}/${entry.name}`;
      invariant(!entry.isSymbolicLink(), `${child}: symlinks are forbidden`);
      if (entry.isDirectory()) await visit(child);
      else {
        invariant(entry.isFile(), `${child}: special files are forbidden`);
        results.push(child);
      }
    }
  }
  await visit(relativeDirectory);
  return results;
}

function names(animationId) {
  const parts = animationId.split("-");
  const constant = parts.map((part) => part.toUpperCase()).join("_");
  const pascal = parts.map((part) =>
    /^\d+$/.test(part)
      ? part.padStart(3, "0")
      : `${part[0].toUpperCase()}${part.slice(1)}`,
  ).join("");
  return {constant, pascal};
}

function privateModuleSource(animationId) {
  const {constant, pascal} = names(animationId);
  return `"use client";\n\n` +
    `import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";\n` +
    `import {\n  ${constant}_CONFIG,\n  ${constant}_SOURCE,\n} from "../timelines/${animationId}";\n\n` +
    `const candidate = createSourceStaticCanvasCandidate(\n  ${constant}_CONFIG,\n);\n` +
    `const privateCurrentJsModule = Object.freeze({\n  ...candidate.module,\n  maturity: "private-current-js" as const,\n});\n\n` +
    `export {${constant}_SOURCE};\n` +
    `export const ${constant}_MOVIE = candidate.movie;\n` +
    `export const ${constant}_RUNTIME = candidate.runtime;\n` +
    `export const ${constant}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${constant}_SCENARIOS = candidate.scenarios;\n` +
    `export const normalize${pascal}Frame = candidate.normalizeFrame;\n` +
    `export const get${pascal}FrameState = candidate.getFrameState;\n` +
    `export const build${pascal}CaptureAttributes =\n  candidate.buildCaptureAttributes;\n` +
    `export const ${pascal}Renderer = candidate.Renderer;\n\n` +
    `export default privateCurrentJsModule;\n`;
}

function generatedDataSource(data) {
  return Buffer.from(
    `/* Generated by ${GENERATOR_PATH}. Do not edit. */\n` +
      `export const G4_L10_PAGE_ONLY_CURRENT_JS = Object.freeze(${JSON.stringify(data, null, 2)} as const);\n`,
  );
}

function sourceLabels(section) {
  return {
    en: {
      text: section.titleEnglish,
      sourceLanguage: "en",
      sourceStatus: "exact-course-xml",
      usesEnglishFallback: false,
    },
    es: {
      text: section.titleSpanish,
      sourceLanguage: "es",
      sourceStatus: "exact-course-xml",
      usesEnglishFallback: false,
    },
  };
}

async function build({check = false} = {}) {
  const [releaseCatalog, lessons, predecessor, predecessorBinding,
    generatorBinding] = await Promise.all([
    readJson(RELEASE_CATALOG_PATH),
    readJson(LESSONS_PATH),
    readJson(PREDECESSOR_FREEZE_PATH),
    bind(PREDECESSOR_FREEZE_PATH),
    bind(GENERATOR_PATH),
  ]);
  const release = releaseCatalog.releases?.find(({releaseId}) =>
    releaseId === RELEASE_ID);
  const lesson = lessons.lessons?.find((candidate) =>
    candidate.grade === 4 && candidate.lesson === 10);
  const members = release?.members?.filter(({releaseRole}) =>
    releaseRole === "active-xml-referenced-page");
  invariant(
    release?.sourceLesson?.sha256 === lesson?.sha256 &&
      members?.length === 46 &&
      members.every((member, index) => member.ordinal === index + 1) &&
      lesson.pageReferenceCount === 46,
    "G4 L10 source-ordered 46-page release binding changed",
  );
  invariant(
    predecessor.calibrationId === "g4-l10-candidate-to-product-v33" &&
      predecessor.scope?.activePageCount === 46 &&
      predecessor.scope?.courseShellCount === 0 &&
      predecessor.selectedPages?.length === 18,
    "G4 L10 eighteen-page predecessor freeze changed",
  );
  const preserved = new Map(predecessor.selectedPages.map((page) => [
    page.animationId,
    page,
  ]));
  const sectionOrdinals = new Map();
  const pages = [];
  for (const member of members) {
    const manifestPath =
      `public/flash-assets/courses/${member.animationId}/manifest.json`;
    const runtimePath =
      `public/flash-assets/courses/${member.animationId}/canvas-renderer.js`;
    const [manifest, manifestBinding, runtimeBinding] = await Promise.all([
      readJson(manifestPath),
      bind(manifestPath),
      bind(runtimePath),
    ]);
    const frameDomain = manifest.timeline?.sourceStaticFrameDomain;
    invariant(
      manifest.animationId === member.animationId &&
        manifest.output?.script === runtimePath &&
        manifest.output.sha256 === runtimeBinding.sha256 &&
        manifest.output.bytes === runtimeBinding.bytes &&
        frameDomain?.timelineId &&
        Number.isSafeInteger(frameDomain.frameCount) &&
        frameDomain.frameCount > 0 &&
        manifest.timeline?.naturalRuntimeReachabilityEstablished === false &&
        manifest.strictAcceptanceEffect === "none",
      `${member.animationId}: source-static candidate boundary changed`,
    );
    const sectionCode = member.animationId.split("-")[3]?.toUpperCase();
    invariant(
      lesson.sections.some(({code}) => code === sectionCode),
      `${member.animationId}: section identity is not cataloged`,
    );
    const sectionPageOrdinal = (sectionOrdinals.get(sectionCode) ?? 0) + 1;
    sectionOrdinals.set(sectionCode, sectionPageOrdinal);
    const prior = preserved.get(member.animationId);
    pages.push(Object.freeze({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      sectionCode,
      sectionPageOrdinal,
      sourceOccurrence: member.xmlOccurrence,
      sourceSwfSha256: member.source.sha256,
      frameDomain: frameDomain.timelineId,
      frameCount: frameDomain.frameCount,
      complexityLane: prior?.complexityLane ?? "behavior-heavy",
      selectionStatus: prior
        ? "preserved-private-product-module-from-v33"
        : manifest.sourceLineageFallback
          ? "manual-source-static-fallback-private-current-js"
          : "source-static-private-current-js",
      lineageFallback: manifest.sourceLineageFallback ?? null,
      candidate: Object.freeze({
        manifest: manifestBinding,
        runtime: runtimeBinding,
      }),
    }));
  }
  invariant(
    lesson.sections.every(({code, pageReferenceCount}) =>
      sectionOrdinals.get(code) === pageReferenceCount),
    "G4 L10 section page denominator changed",
  );

  for (const page of pages) {
    const sourceDirectory = `public/flash-assets/courses/${page.animationId}`;
    for (const sourcePath of await filesBelow(sourceDirectory)) {
      const suffix = sourcePath.slice("public/".length);
      await synchronize(
        `apps/web/public/${suffix}`,
        await readFile(projectPath(sourcePath)),
        check,
      );
    }
    if (!preserved.has(page.animationId)) {
      await synchronize(
        `packages/demos/src/modules/${page.animationId}.tsx`,
        Buffer.from(privateModuleSource(page.animationId)),
        check,
      );
    }
  }

  const selectedPages = pages.map((page) => ({
    animationId: page.animationId,
    globalPageOrdinal: page.ordinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    complexityLane: page.complexityLane,
    selectionStatus: page.selectionStatus,
    source: {swfSha256: page.sourceSwfSha256},
    runtime: {
      frameDomain: page.frameDomain,
      frameCount: page.frameCount,
      playbackMode: "once",
      candidateManifest: page.candidate.manifest,
      canvasRenderer: page.candidate.runtime,
      naturalRuntimeEstablished: false,
    },
    lineageFallback: page.lineageFallback,
  }));
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    status: "page-only-private-current-js-registered-46-of-46",
    predecessor: {
      ...predecessorBinding,
      preservedPrivateProductModuleCount: preserved.size,
    },
    scope: {
      releaseId: RELEASE_ID,
      activePageCount: 46,
      courseShellCount: 0,
      selectedPageCount: 46,
      preservedBespokePageCount: preserved.size,
      sourceStaticSuccessorPageCount: 46 - preserved.size,
      manualSourceStaticFallbackCount: pages.filter(({lineageFallback}) =>
        lineageFallback).length,
    },
    inputs: {
      generator: generatorBinding,
      lessonCatalog: await bind(LESSONS_PATH),
      releaseCatalog: await bind(RELEASE_CATALOG_PATH),
    },
    selectedPages,
    modernMyLesson: {
      pageOnlyDescriptor: true,
      exactSourceOrderMemberCount: 46,
      legacyCourseShellIncluded: false,
      privateRouteOnly: true,
    },
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
  };
  const freezeBytes = jsonBytes(freeze);
  await synchronize(FREEZE_PATH, freezeBytes, check);
  const freezeSha256 = sha256(freezeBytes);

  const privateRegistry = {
    schemaVersion: 1,
    registryScope: "private-engineering",
    calibrationId: CALIBRATION_ID,
    freezeManifest: FREEZE_PATH,
    entries: pages.map((page) => ({
      key: page.animationId,
      module: `./modules/${page.animationId}`,
      maturity: "private-current-js",
      complexityLane: page.complexityLane,
    })),
  };
  await synchronize(PRIVATE_REGISTRY_PATH, jsonBytes(privateRegistry), check);

  const data = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    releaseId: RELEASE_ID,
    course: {
      grade: 4,
      lesson: 10,
      title: lesson.titleDisplay,
      sourceXmlPath: lesson.path,
      sourceXmlSha256: lesson.sha256,
      activePageCount: 46,
      courseShellCount: 0,
    },
    freeze: {path: FREEZE_PATH, sha256: freezeSha256},
    sections: lesson.sections.map((section) => ({
      order: section.number,
      code: section.code,
      activePageCount: section.pageReferenceCount,
      firstActiveAnimationId: pages.find(({sectionCode}) =>
        sectionCode === section.code).animationId,
      labels: sourceLabels(section),
    })),
    pages: pages.map((page) => ({
      ordinal: page.ordinal,
      animationId: page.animationId,
      assetId: page.assetId,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sourceOccurrence: page.sourceOccurrence,
      frameDomain: page.frameDomain,
      frameCount: page.frameCount,
      complexityLane: page.complexityLane,
      registered: true,
    })),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  await synchronize(GENERATED_DATA_PATH, generatedDataSource(data), check);
  return {
    calibrationId: CALIBRATION_ID,
    activePages: 46,
    registered: 46,
    courseShellCount: 0,
    preservedBespokePages: preserved.size,
    sourceStaticSuccessorPages: 46 - preserved.size,
    manualSourceStaticFallbackPages: pages.filter(({lineageFallback}) =>
      lineageFallback).length,
    freezePath: FREEZE_PATH,
    freezeSha256,
    check,
  };
}

const check = process.argv.slice(2).includes("--check");
const unexpected = process.argv.slice(2).filter((argument) => argument !== "--check");
invariant(unexpected.length === 0, `unknown arguments: ${unexpected.join(" ")}`);
build({check}).then((result) => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
