#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdtemp, readFile, rm, stat, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCHEMA_VERSION = 1;
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const ARCHIVE_PREFIX = "HELP_COURSES/ELMGR4/L3/";

const PATHS = Object.freeze({
  xml: `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/L3/index.xml`,
  shellSwf: `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/L3/index_local.swf`,
  courseImage: `${SOURCE_PREFIX}HELP_COURSES/ELMGR4/ELMGR4.jpg`,
  lessonKeytermsEnglish: `${SOURCE_PREFIX}HELP_KEYTERMS/KT/ELEMENTARY/XML/L3KTE01.xml`,
  lessonKeytermsSpanish: `${SOURCE_PREFIX}HELP_KEYTERMS/KT/ELEMENTARY/XML/L3KTS01.xml`,
  shellKeytermsEnglish: `${SOURCE_PREFIX}HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml`,
  shellKeytermsSpanish: `${SOURCE_PREFIX}HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml`,
  lessons: "catalog/lessons.json",
  batches: "catalog/batches.json",
  animations: "catalog/animations.json",
  assets: "catalog/assets.json",
  audioGroups: "catalog/audio-groups.json",
  unreferenced: "catalog/unreferenced.json",
  duplicates: "catalog/duplicates.json",
  ledger: "catalog/completion-ledger.json",
  releaseManifest: "catalog/lesson-releases.json",
  releaseLedger: "catalog/lesson-release-ledger.json",
  workCards: "reports/g4-l3-implementation-work-cards.json",
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  batch001Readiness: "reports/g4-l3-batch-001-specification-readiness.json",
  batch002Readiness: "reports/g4-l3-batch-002-specification-readiness.json",
  prototypeRegistry: "packages/demos/prototype-registry.json",
  generatedRegistry: "packages/demos/src/registry.generated.ts",
  registryGenerator: "packages/demos/scripts/generate-registry.mjs",
  prototypeManifest: "packages/demos/src/prototype-manifest.ts",
  shellTimeline: "packages/demos/src/timelines/shell-course-g04-l03-index-local.ts",
  shellModule: "packages/demos/src/modules/shell-course-g04-l03-index-local.tsx",
  browserProductQa: "reports/g4-l3-current-javascript-product-qa.json",
  courseRoute: "apps/web/app/[locale]/courses/[grade]/[lesson]/page.tsx",
  animationRoute: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
  animationRuntime: "apps/web/components/animation-runtime.tsx",
  catalogLibrary: "apps/web/lib/catalog.ts",
  lessonNavigationData: "apps/web/lib/g4-l3-lesson-navigation.ts",
  lessonNavigationComponent: "apps/web/components/g4-l3-lesson-navigation.tsx",
});

const DEFAULT_JSON_OUTPUT = path.join(projectRoot, "reports", "g4-l3-lesson-product-navigation-contract.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(projectRoot, "reports", "g4-l3-lesson-product-navigation-contract.md");
const HEX_64 = /^[a-f0-9]{64}$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function selectUniqueReleaseById(document, releaseId, label) {
  invariant(Array.isArray(document?.releases), `${label} releases are missing`);
  const matches = document.releases.filter((release) => release.releaseId === releaseId);
  invariant(matches.length === 1, `${label} must contain exactly one ${releaseId} row`);
  return matches[0];
}

export function validateLessonReleaseLedgerSummary(document) {
  invariant(Array.isArray(document?.releases), "Lesson release ledger releases are missing");
  const recomputed = {
    releaseCount: document.releases.length,
    publishedReleaseCount: 0,
    unpublishedReleaseCount: 0,
    memberCount: 0,
    strictCompleteMemberCount: 0,
  };
  for (const release of document.releases) {
    invariant(
      Number.isSafeInteger(release.expectedMemberCount) && release.expectedMemberCount > 0,
      `${release.releaseId ?? "unknown release"}: expectedMemberCount is invalid`,
    );
    invariant(
      Number.isSafeInteger(release.strictCompleteCount) &&
        release.strictCompleteCount >= 0 &&
        release.strictCompleteCount <= release.expectedMemberCount,
      `${release.releaseId ?? "unknown release"}: strictCompleteCount is invalid`,
    );
    invariant(typeof release.published === "boolean", `${release.releaseId ?? "unknown release"}: published is invalid`);
    recomputed.memberCount += release.expectedMemberCount;
    recomputed.strictCompleteMemberCount += release.strictCompleteCount;
    recomputed.publishedReleaseCount += release.published ? 1 : 0;
    recomputed.unpublishedReleaseCount += release.published ? 0 : 1;
  }
  invariant(
    Object.entries(recomputed).every(([key, value]) => document.summary?.[key] === value),
    "Lesson release ledger global summary differs from its release rows",
  );
  return recomputed;
}

function relative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function absolute(projectPath) {
  const resolved = path.resolve(projectRoot, projectPath);
  const rel = path.relative(projectRoot, resolved);
  invariant(rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel), `Path escapes project: ${projectPath}`);
  return resolved;
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

function normalizeLf(value) {
  return value.replace(/\r\n?/g, "\n");
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attributes[match[1]] = decodeXml(match[2]);
  return attributes;
}

function tagText(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1].trim()) : null;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r\n?|\n/).length;
}

function insideRange(index, ranges) {
  return ranges.some((range) => index >= range.start && index < range.end);
}

export function parseLessonProductXml(xml) {
  const sections = [];
  const activePages = [];
  const commentedPages = [];
  const sectionExpression = /<Section\b([^>]*)>([\s\S]*?)<\/Section>/gi;
  let activeOrdinal = 0;
  for (const sectionMatch of xml.matchAll(sectionExpression)) {
    const sectionAttributes = parseAttributes(sectionMatch[1]);
    const sectionBody = sectionMatch[2];
    const sectionStart = sectionMatch.index ?? 0;
    const bodyOffset = sectionMatch[0].indexOf(sectionBody);
    const bodyAbsoluteStart = sectionStart + bodyOffset;
    const commentRanges = [...sectionBody.matchAll(/<!--[\s\S]*?-->/g)].map((match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }));
    const activeBody = sectionBody.replace(/<!--[\s\S]*?-->/g, "");
    const titleBlock = activeBody.match(/<Title>([\s\S]*?)<\/Title>/i)?.[1] ?? "";
    const section = {
      order: sections.length + 1,
      code: sectionAttributes.SName ?? null,
      number: sectionAttributes.SNumber ? Number(sectionAttributes.SNumber) : null,
      titleEnglish: tagText(titleBlock, "English"),
      titleSpanish: tagText(titleBlock, "Spanish"),
      attributesRaw: {
        sectionButtonX: sectionAttributes.SecButtonLocX ?? null,
        sectionButtonY: sectionAttributes.SecButtonLocY ?? null,
        subtitle: sectionAttributes.SubTitle ?? null,
        startButtonX: sectionAttributes.StartButtonX ?? null,
        startButtonY: sectionAttributes.StartButtonY ?? null,
        sectionSplit: sectionAttributes.SSplit ?? null,
      },
      activePageCount: 0,
      commentedPageCount: 0,
      subPageTitles: [],
    };

    let activeSectionOrdinal = 0;
    let commentedSectionOrdinal = 0;
    for (const pageMatch of sectionBody.matchAll(/<Page\b([^>]*)>([\s\S]*?)<\/Page>/gi)) {
      const localIndex = pageMatch.index ?? 0;
      const attributes = parseAttributes(pageMatch[1]);
      const sectionRelativePath = normalizePath(decodeXml(pageMatch[2].trim()));
      const common = {
        sectionCode: section.code,
        sectionNumber: section.number,
        titleRaw: attributes.Title ?? null,
        randomAudioRaw: attributes.RandomAudio ?? null,
        backgroundTextRaw: attributes.BGText ?? null,
        navigationRaw: attributes.Navigation ?? null,
        sectionRelativePath,
        archiveRelativePath: normalizePath(`HELP_COURSES/ELMGR4/L3/${sectionRelativePath}`),
        sourceLine: lineNumberAt(xml, bodyAbsoluteStart + localIndex),
      };
      if (insideRange(localIndex, commentRanges)) {
        commentedSectionOrdinal += 1;
        commentedPages.push({...common, commentedSectionOrdinal});
      } else {
        activeOrdinal += 1;
        activeSectionOrdinal += 1;
        activePages.push({...common, globalPageOrdinal: activeOrdinal, sectionPageOrdinal: activeSectionOrdinal});
      }
    }
    for (const subPageMatch of activeBody.matchAll(/<SubPageTitle\b([^>]*)>([\s\S]*?)<\/SubPageTitle>/gi)) {
      const attributes = parseAttributes(subPageMatch[1]);
      const sectionRelativePath = normalizePath(decodeXml(subPageMatch[2].trim()));
      const originalLocalIndex = sectionBody.indexOf(subPageMatch[0]);
      section.subPageTitles.push({
        order: section.subPageTitles.length + 1,
        titleEnglishRaw: attributes.EngSubTitleName ?? null,
        titleSpanishRaw: attributes.SpanSubTitleName ?? null,
        buttonNameRaw: attributes.SubTitleButtonName ?? null,
        sectionRelativePath,
        archiveRelativePath: normalizePath(`HELP_COURSES/ELMGR4/L3/${sectionRelativePath}`),
        sourceLine: originalLocalIndex >= 0 ? lineNumberAt(xml, bodyAbsoluteStart + originalLocalIndex) : null,
      });
    }
    section.activePageCount = activeSectionOrdinal;
    section.commentedPageCount = commentedPages.filter((page) => page.sectionCode === section.code).length;
    sections.push(section);
  }

  const keytermsBlock = xml.match(/<Keyterms>([\s\S]*?)<\/Keyterms>/i)?.[1] ?? "";
  return {
    courseName: tagText(xml, "CourseName"),
    titleEnglishRaw: tagText(xml, "NewTitle1"),
    lessonNameRaw: tagText(xml, "LessonName"),
    lessonNumber: Number(tagText(xml, "LessonNumber")),
    pageRoot: normalizePath(tagText(xml, "PageRoot") ?? ""),
    courseImageRaw: normalizePath(tagText(xml, "CourseIMGName") ?? ""),
    keytermsRaw: {
      english: normalizePath(tagText(keytermsBlock, "English") ?? ""),
      spanish: normalizePath(tagText(keytermsBlock, "Spanish") ?? ""),
      diagramDirectory: normalizePath(tagText(keytermsBlock, "DigDir") ?? ""),
    },
    sections,
    activePages,
    commentedPages,
  };
}

export function parseShellLessonDetails(script) {
  const normalized = normalizeLf(script);
  const match = normalized.match(/LessonDetails\s*=\s*"([^"]+)";/);
  invariant(match, "Shipped shell frame_35 script has no parseable LessonDetails literal");
  const raw = match[1];
  const blocks = raw.split("[Details_Split]");
  invariant(blocks.length === 9, `Shipped shell LessonDetails must contain 8 sections, found ${blocks.length - 1}`);
  const sections = blocks.slice(1).map((block, index) => {
    const fields = block.split("~");
    invariant(fields[0] === `[Section${index + 1}Details]`, `Unexpected shipped shell section marker ${fields[0]}`);
    const code = fields[1];
    return {
      order: index + 1,
      code,
      files: fields.slice(2).map((file, fileIndex) => ({
        sectionPageOrdinal: fileIndex + 1,
        basename: file,
        sectionRelativePath: `${code}/${file}`,
        archiveRelativePath: `${ARCHIVE_PREFIX}${code}/${file}`,
      })),
    };
  });
  return {
    rawSha256: sha256(raw),
    courseDetailsRaw: blocks[0],
    sections,
    pages: sections.flatMap((section) => section.files),
  };
}

async function bindFile(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function bindOptionalFile(projectPath) {
  try {
    const metadata = await lstat(absolute(projectPath));
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${projectPath} is not a regular non-symlink file`);
    return {...await bindFile(projectPath), exists: true};
  } catch (error) {
    if (error?.code === "ENOENT") return {path: projectPath, exists: false, bytes: null, sha256: null};
    throw error;
  }
}

async function readJsonBound(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {value: JSON.parse(bytes.toString("utf8")), binding: {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)}};
}

function machineScriptRecord(machineShell, scriptRelativePath) {
  const record = machineShell.scripts.files.find((item) => item.path === scriptRelativePath);
  invariant(record, `Machine shell audit is missing ${scriptRelativePath}`);
  return record;
}

async function extractShellStaticContract({machineReport, shellSwf}) {
  const shell = machineReport.items.find((item) => item.animationId === "shell-course-g04-l03-index-local");
  invariant(shell, "G4 L3 machine audit has no course shell item");
  invariant(shell.source.swf.sha256 === shellSwf.sha256, "Course-shell SWF hash drifted from machine audit");
  const ffdec = machineReport.sourceBindings.tools.ffdec;
  invariant(ffdec?.command && ffdec?.version, "Machine audit has no FFDec binding");
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "g4-l3-lesson-contract-"));
  try {
    const exportRoot = path.join(temporaryRoot, "export");
    await execFileAsync(ffdec.command, [
      "-onerror", "abort",
      "-timeout", "30",
      "-exportTimeout", "120",
      "-exportFileTimeout", "30",
      "-export", "script",
      exportRoot,
      absolute(PATHS.shellSwf),
    ], {timeout: 180_000, maxBuffer: 8 * 1024 * 1024});
    const scriptsRoot = path.join(exportRoot, "scripts");
    const requiredScriptPaths = [
      "frame_35/DoAction.as",
      "DefineButton2_252/BUTTONCONDACTION on(release).as",
      "DefineButton2_340/BUTTONCONDACTION on(release).as",
      "DefineButton2_342/BUTTONCONDACTION on(release).as",
      "frame_50/PlaceObject2_567_1/CLIPACTIONRECORD on(release).as",
    ];
    const scripts = {};
    for (const scriptRelativePath of requiredScriptPaths) {
      const text = normalizeLf(await readFile(path.join(scriptsRoot, scriptRelativePath), "utf8"));
      const bytes = Buffer.byteLength(text);
      const hash = sha256(text);
      const machine = machineScriptRecord(shell, scriptRelativePath);
      invariant(machine.bytes === bytes && machine.sha256 === hash, `${scriptRelativePath} differs from the bound machine audit`);
      scripts[scriptRelativePath] = {text, binding: {path: scriptRelativePath, bytes, sha256: hash}};
    }
    const rootScript = scripts["frame_35/DoAction.as"];
    const lessonDetails = parseShellLessonDetails(rootScript.text);
    const requiredFunctions = [
      "doPlayPreviousMovie",
      "doPlayNextMovie",
      "loadSWFMovie",
      "doSlideClick",
      "doMapClick",
      "doCheckPrevAndNext",
      "doPlaySpanishAudio",
      "doStopSpanishAudio",
    ];
    for (const name of requiredFunctions) invariant(rootScript.text.includes(`function ${name}()`), `Shell script lost ${name}()`);
    invariant(rootScript.text.includes('playSwfFileName.indexOf("FQ02")'), "Shell script lost FQ02 special navigation logic");
    invariant(rootScript.text.includes('animation_mc.animation.stop()'), "Shell script lost Spanish-audio timeline pause candidate");
    invariant(rootScript.text.includes('animation_mc.animation.play()'), "Shell script lost Spanish-audio timeline resume candidate");
    return {
      tool: ffdec,
      exportedScriptCount: shell.scripts.exportedScriptFileCount,
      rootScript: rootScript.binding,
      supportingScripts: Object.fromEntries(Object.entries(scripts).filter(([key]) => key !== "frame_35/DoAction.as").map(([key, value]) => [key, value.binding])),
      requiredFunctions,
      lessonDetails,
      staticEvidenceOnly: true,
      originalRuntimeExecutionObserved: false,
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function routePair(animationId) {
  return {
    en: `/animations/${animationId}`,
    es: `/es/animations/${animationId}`,
  };
}

function pageSpanishEvidence(page, section) {
  const exact = section.subPageTitles.find((entry) => entry.sectionRelativePath === page.sectionRelativePath);
  return exact
    ? {
        status: "exact-subpage-anchor-label",
        valueRaw: exact.titleSpanishRaw,
        sourceLine: exact.sourceLine,
        caveat: "This is a SubPageTitle anchor label, not a separately authored Page Title field.",
      }
    : {
        status: "missing-page-level-spanish-title",
        valueRaw: null,
        sourceLine: null,
        caveat: "The source Page has only an English Title attribute; do not invent a Spanish page title.",
      };
}

function batchById(batches, batchId) {
  return batches.queues.flatMap((queue) => queue.batches).find((batch) => batch.batchId === batchId);
}

function animationByPath(animations, archivePath) {
  const matches = animations.animations.filter((item) => item.source.path === archivePath);
  invariant(matches.length === 1, `${archivePath}: expected one catalog placement, found ${matches.length}`);
  return matches[0];
}

function inspectWebSources(sources) {
  const course = sources.courseRoute;
  const animation = sources.animationRoute;
  const runtime = sources.animationRuntime;
  const catalog = sources.catalogLibrary;
  const lessonData = sources.lessonNavigationData;
  const lessonComponent = sources.lessonNavigationComponent;
  invariant(course.includes("isLessonReleasePublished") && course.includes("publishedAnimations"), "Course route no longer uses the atomic lesson publication policy");
  invariant(course.includes("classification.page?.ordinal"), "Course route ordering implementation changed; refresh the product contract");
  invariant(course.includes("G4_L3_LESSON") && course.includes("G4L3LessonMap"), "Course route no longer consumes the G4 L3 lesson contract");
  invariant(animation.includes("NODE_ENV === 'production'") && animation.includes("isAnimationPublished"), "Animation route production publication check changed");
  invariant(animation.includes("G4L3LessonContextNavigation"), "Animation route lost the G4 L3 lesson-context controls");
  invariant(catalog.includes("deriveLessonReleaseStates") && catalog.includes("publishedAnimations") && catalog.includes("isAnimationPublished"), "Catalog no longer recomputes atomic lesson publication");
  invariant(runtime.includes("data-flash-frame") && runtime.includes("data-flash-frame-domain"), "Animation runtime deterministic identity contract changed");
  invariant(runtime.includes("data-replay-keyboard=\"enter-space\""), "Animation runtime Replay keyboard contract changed");
  invariant(lessonData.includes("activePageCount: 39") && lessonData.includes("strictComplete: false"), "G4 L3 lesson data contract changed");
  invariant(lessonComponent.includes("previousAnimationId") && lessonComponent.includes("nextAnimationId"), "G4 L3 previous/next controls changed");
  return {
    evidenceKind: "static-source-inspection-not-browser-evidence",
    courseRouteUsesStrictCompleteOnly: false,
    courseRouteUsesAtomicLessonPublication: true,
    courseRouteUsesOnlySectionLocalPageOrdinalForSort: false,
    courseRouteConsumesThisLessonContract: true,
    animationRouteUsesPublicationPolicyInProduction: true,
    catalogRecomputesAtomicReleaseFromBoundArtifacts: true,
    deterministicStageIdentityImplementedGenerically: true,
    genericReplayButtonImplemented: true,
    lessonPreviousNextControlsStaticallyEstablished: true,
    browserEvidence: null,
    browserVerified: false,
  };
}

function auxiliaryRelation(entry, commentedByPath, activePages) {
  const commented = commentedByPath.get(entry.sourcePath);
  let relatedActiveAnimationId = null;
  if (entry.animationId === "course-g04-l03-fq-002-review") relatedActiveAnimationId = "course-g04-l03-fq-002";
  else if (entry.animationId === "course-g04-l03-ir-001-a523089c") relatedActiveAnimationId = "course-g04-l03-ir-001-341242cc";
  else if (commented) relatedActiveAnimationId = activePages.find((page) => page.sectionCode === commented.sectionCode)?.animationId ?? null;
  return {
    animationId: entry.animationId,
    assetId: entry.assetId,
    sourcePath: entry.sourcePath,
    variantKind: entry.flags.variantKind,
    commentedXmlReference: Boolean(commented),
    commentedXmlSourceLine: commented?.sourceLine ?? null,
    relatedActiveAnimationId,
    relationshipStatus: relatedActiveAnimationId ? "placement-or-path-inferred-not-alias" : "auxiliary-no-active-alias",
    sharesBinaryWithActivePlacement: false,
    alias: false,
    activeSequenceMember: false,
  };
}

export function validateLessonProductContract(report) {
  invariant(report.schemaVersion === 1, "Unexpected lesson product contract schema");
  invariant(report.summary.activePages === 39, "G4 L3 contract must contain 39 active pages");
  invariant(report.summary.courseShells === 1, "G4 L3 contract must contain one course shell");
  invariant(report.sections.length === 8, "G4 L3 contract must contain eight sections");
  invariant(report.pages.length === 39, "G4 L3 page contract count drifted");
  invariant(report.pages.every((page, index) => page.globalPageOrdinal === index + 1), "G4 L3 active page ordinals are not contiguous");
  invariant(report.pages.every((page) => page.isCanonical && !page.alias && page.duplicateGroupSize === 1), "Active G4 L3 pages must remain distinct canonical placements");
  invariant(new Set(report.pages.map((page) => page.animationId)).size === 39, "Active G4 L3 animation IDs are not unique");
  invariant(new Set(report.pages.map((page) => page.assetId)).size === 39, "Active G4 L3 binaries are not unique");
  invariant(report.pages[0].navigation.previousAnimationId === null, "First G4 L3 page must have no previous active page");
  invariant(report.pages.at(-1).navigation.nextAnimationId === null, "Last G4 L3 page must have no next active page");
  invariant(report.pages.slice(1).every((page, index) => page.navigation.previousAnimationId === report.pages[index].animationId), "Previous-page chain drifted");
  invariant(report.pages.slice(0, -1).every((page, index) => page.navigation.nextAnimationId === report.pages[index + 1].animationId), "Next-page chain drifted");
  const fq = report.pages.filter((page) => page.sectionCode === "FQ");
  invariant(JSON.stringify(fq.map((page) => page.xmlNavigation.raw)) === JSON.stringify(["ON", "OFF", "ON"]), "FQ Navigation values must remain ON/OFF/ON");
  invariant(report.summary.explicitXmlNavigationOn === 2 && report.summary.explicitXmlNavigationOff === 1 && report.summary.unspecifiedXmlNavigation === 36, "XML navigation summary drifted");
  invariant(report.summary.exactSpanishPageAnchorLabels === 15 && report.summary.missingPageLevelSpanishTitles === 24, "Spanish page-title evidence counts drifted");
  invariant(report.shell.staticSequence.pageCount === 44, "Shipped shell static candidate must retain 44 paths");
  invariant(report.shell.staticSequence.extraComparedWithActiveXml.length === 5, "Shipped shell/static XML conflict must retain five extra paths");
  invariant(report.shell.staticSequence.missingComparedWithActiveXml.length === 0, "Shipped shell static sequence lost an active XML page");
  invariant(report.summary.commentedXmlPages === 6 && report.summary.auxiliaryOrHistoricalSources === 9, "Historical/variant counts drifted");
  invariant(report.routes.currentState.strictRegistryModules === report.publication.strictCompleteMembers, "Strict registry/release count drifted");
  invariant(report.routes.currentState.prototypeModules === report.routes.currentState.prototypeAnimationIds.length, "Current prototype count drifted");
  invariant(report.development.mode === "parallel-shards" && report.development.scaffoldGatesOpen === true, "G4 L3 parallel scaffold gates must remain explicit");
  invariant(report.development.implementationAuthorized === false, "Scaffolding must not authorize implementation");
  invariant(report.publication.mode === "atomic" && report.publication.requiredMembers === 40, "G4 L3 atomic publication scope drifted");
  invariant(report.publication.published === (report.publication.strictCompleteMembers === 40), "Atomic lesson publication is inconsistent");
  invariant(report.summary.browserVerifiedRoutes === 82, "Current-JavaScript browser route coverage must remain 82");
  invariant(report.routes.browserProductQa?.status === "pass-current-javascript-product-layer", "Current-JavaScript browser product QA is not passing");
  invariant(report.routes.browserProductQa?.authorityEffect === false, "Browser product QA cannot promote fidelity authority");
  invariant(report.routes.browserProductQa?.limitations?.runnableCourseShellModules === 1, "Course shell current-JavaScript audit projection must remain runnable");
  invariant(report.routes.browserProductQa?.limitations?.spanishGraphicRoutes === 1 && report.routes.browserProductQa?.limitations?.spanishFailClosedSemanticRoutes === 38, "Spanish route output classification drifted");
  invariant(report.pages.every((page) => page.routes.browserVerifiedCurrentJavascript === true && page.engineeringEvidence.currentJavascriptProductQaComplete === true && page.engineeringEvidence.authorityEffect === false), "All 39 current-JavaScript page routes must retain acceptance-neutral browser evidence");
  invariant(report.pages.every((page) => page.replay.mouseVerifiedCurrentJavascript && page.replay.enterVerifiedCurrentJavascript && page.replay.spaceVerifiedCurrentJavascript && !page.replay.completeStateResetVerified), "Replay product evidence boundary drifted");
  invariant(Object.entries(report.acceptance).filter(([key]) => key !== "acceptanceNeutral" && key !== "statement").every(([, value]) => value === false), "Acceptance-neutral report cannot set an acceptance flag");
}

export async function buildLessonProductContract() {
  const inputPaths = [
    PATHS.lessons,
    PATHS.batches,
    PATHS.animations,
    PATHS.assets,
    PATHS.audioGroups,
    PATHS.unreferenced,
    PATHS.duplicates,
    PATHS.ledger,
    PATHS.releaseManifest,
    PATHS.releaseLedger,
    PATHS.workCards,
    PATHS.machineAudit,
    PATHS.batch001Readiness,
    PATHS.batch002Readiness,
    PATHS.prototypeRegistry,
  ];
  const inputs = Object.fromEntries(await Promise.all(inputPaths.map(async (inputPath) => {
    const value = await readJsonBound(inputPath);
    return [inputPath, value];
  })));
  const json = (inputPath) => inputs[inputPath].value;
  const binding = (inputPath) => inputs[inputPath].binding;
  const [xmlBinding, shellSwf, courseImage, lessonKeytermsEnglish, lessonKeytermsSpanish, shellKeytermsEnglish, shellKeytermsSpanish, browserProductQaBinding, generatorBinding] = await Promise.all([
    bindFile(PATHS.xml),
    bindFile(PATHS.shellSwf),
    bindFile(PATHS.courseImage),
    bindOptionalFile(PATHS.lessonKeytermsEnglish),
    bindOptionalFile(PATHS.lessonKeytermsSpanish),
    bindOptionalFile(PATHS.shellKeytermsEnglish),
    bindOptionalFile(PATHS.shellKeytermsSpanish),
    bindOptionalFile(PATHS.browserProductQa),
    bindFile(relative(scriptPath)),
  ]);
  const xmlText = await readFile(absolute(PATHS.xml), "utf8");
  const parsed = parseLessonProductXml(xmlText);
  invariant(parsed.lessonNumber === 3 && parsed.activePages.length === 39, "Physical G4 L3 index.xml scope drifted");
  invariant(parsed.commentedPages.length === 6, "Physical G4 L3 index.xml commented-page scope drifted");

  invariant(browserProductQaBinding.exists, "G4 L3 current-JavaScript browser product QA is missing");
  const browserProductQa = JSON.parse(await readFile(absolute(PATHS.browserProductQa), "utf8"));
  invariant(browserProductQa.schemaVersion === 1 && browserProductQa.reportType === "g4-l3-current-javascript-lesson-product-qa", "G4 L3 browser product QA schema or identity is invalid");
  invariant(browserProductQa.summary?.status === "pass-current-javascript-product-layer" && browserProductQa.summary.activePages === 39, "G4 L3 browser product QA is not passing for 39 pages");
  invariant(browserProductQa.summary.uniqueRoutesVerified === 82 && browserProductQa.summary.routeVisits === 121, "G4 L3 browser product QA route scope drifted");
  invariant(browserProductQa.summary.runnableShellModules === 1, "G4 L3 browser product QA does not cover the runnable shell projection");
  invariant(browserProductQa.summary.desktopFixedFrameRoutes === 39 && browserProductQa.summary.mobileSpanishReducedMotionRoutes === 39 && browserProductQa.summary.replayMouseEnterSpaceRoutes === 39, "G4 L3 browser product QA does not cover all 39 page profiles");
  invariant(browserProductQa.summary.axeSeriousOrCriticalViolations === 0 && browserProductQa.summary.horizontalOverflowFailures === 0 && browserProductQa.summary.failureCount === 0, "G4 L3 browser product QA contains product failures");
  invariant(browserProductQa.summary.consoleErrors === 0 && browserProductQa.summary.pageErrors === 0 && browserProductQa.summary.failedRequests === 0 && browserProductQa.summary.badHttpResponses === 0, "G4 L3 browser product QA contains runtime or network failures");
  invariant(browserProductQa.summary.mobileSpanishGraphicRoutes === 1 && browserProductQa.summary.mobileSpanishFailClosedSemanticRoutes === 38, "G4 L3 Spanish route output classification drifted");
  invariant(Object.values(browserProductQa.authorityClaims ?? {}).length >= 12 && Object.values(browserProductQa.authorityClaims).every((value) => value === false), "G4 L3 browser product QA contains an authority promotion");
  invariant(browserProductQa.acceptance?.humanVisualAccepted === false && browserProductQa.acceptance?.ownerAccepted === false && browserProductQa.acceptance?.strictMigrationComplete === false && browserProductQa.acceptance?.lessonComplete === false, "G4 L3 browser product QA contains an acceptance promotion");
  invariant(browserProductQa.sourceBindings?.sourceXml?.sha256 === xmlBinding.sha256 && browserProductQa.sourceBindings.sourceXml.bytes === xmlBinding.bytes, "G4 L3 browser product QA source XML binding drifted");
  invariant(browserProductQa.sourceBindings?.lessonProductContract === undefined, "Browser product QA must not hash-bind the contract that binds it");
  for (const productBinding of Object.values(browserProductQa.sourceBindings ?? {})) {
    const physical = await bindFile(productBinding.path);
    invariant(physical.bytes === productBinding.bytes && physical.sha256 === productBinding.sha256, `${productBinding.path}: browser product QA source binding drifted`);
  }
  for (const screenshot of browserProductQa.screenshots ?? []) {
    const physical = await bindFile(screenshot.path);
    invariant(physical.bytes === screenshot.bytes && physical.sha256 === screenshot.sha256, `${screenshot.path}: browser product QA screenshot binding drifted`);
  }
  const browserProductQaPassed = true;

  const lessons = json(PATHS.lessons);
  const lessonCatalog = lessons.lessons.find((item) => item.grade === 4 && item.lesson === 3);
  invariant(lessonCatalog?.sha256 === xmlBinding.sha256 && lessonCatalog.pageReferenceCount === 39, "Lesson catalog differs from physical index.xml");
  const batches = json(PATHS.batches);
  const queue = batches.queues.find((item) => item.queueId === "release-g04-l03-negative-numbers");
  invariant(queue?.canonicalAssetCount === 40 && queue.activeXmlReferencedPageAssetCount === 39 && queue.courseShellAssetCount === 1, "G4 L3 release queue drifted");
  const batch001 = batchById(batches, "batch-001");
  const batch002 = batchById(batches, "batch-002");
  invariant(batch001?.canonicalAssetCount === 25 && batch002?.canonicalAssetCount === 15, "G4 L3 batch split drifted");
  invariant(batch001.scaffoldingPrerequisite?.kind === "none" && batch002.scaffoldingPrerequisite?.kind === "none", "G4 L3 development shards are no longer independently scaffoldable");

  const workCards = json(PATHS.workCards);
  invariant(workCards.cards.length === 40 && workCards.acceptance.strictAcceptanceEffect === false, "G4 L3 work cards are incomplete or acceptance state drifted");
  const batch001Readiness = json(PATHS.batch001Readiness);
  const batch002Readiness = json(PATHS.batch002Readiness);
  invariant(batch001Readiness.summary.finalSpecificationReady === 0 && batch001Readiness.summary.implementationAuthorized === 0, "batch-001 unexpectedly became authorized");
  invariant(batch002Readiness.summary.finalSpecificationReady === 0 && batch002Readiness.summary.implementationAuthorized === 0, "batch-002 unexpectedly became authorized");

  const animations = json(PATHS.animations);
  const ledger = json(PATHS.ledger);
  invariant(ledger.schemaVersion === 1 && /^sha256:[a-f0-9]{64}$/.test(ledger.generatedMarker) && Array.isArray(ledger.entries), "Completion ledger is malformed");
  invariant(ledger.summary?.strictComplete === ledger.entries.length, "Completion ledger strict summary drifted");
  const strictEntryByAnimationId = new Map();
  for (const entry of ledger.entries) {
    invariant(entry.validation?.mode === "strict" && entry.validation.generatedMarker === ledger.generatedMarker, `${entry.animationId}: completion entry is not bound to the current strict marker`);
    invariant(!strictEntryByAnimationId.has(entry.animationId), `Completion ledger contains duplicate ${entry.animationId}`);
    strictEntryByAnimationId.set(entry.animationId, entry);
  }

  const releaseManifest = json(PATHS.releaseManifest);
  invariant(releaseManifest.schemaVersion === 1, "Lesson release manifest schema drifted");
  const releaseDefinition = selectUniqueReleaseById(
    releaseManifest,
    "lesson-g04-l03-negative-numbers",
    "Lesson release manifest",
  );
  invariant(
    releaseDefinition.releaseId === "lesson-g04-l03-negative-numbers" &&
      releaseDefinition.publicationMode === "atomic" &&
      releaseDefinition.developmentMode === "parallel-shards" &&
      releaseDefinition.scope?.collection === "course" &&
      releaseDefinition.scope?.grade === 4 &&
      releaseDefinition.scope?.lesson === 3 &&
      releaseDefinition.scope?.excludeNonMembers === true &&
      releaseDefinition.expectedCounts?.activeXmlReferencedPages === 39 &&
      releaseDefinition.expectedCounts?.courseShells === 1 &&
      releaseDefinition.expectedCounts?.members === 40 &&
      releaseDefinition.expectedCounts?.shards === 2,
    "G4 L3 release declaration is not the exact 39-page plus shell atomic scope",
  );
  invariant(
    JSON.stringify(releaseDefinition.shards.map((shard) => [shard.batchId, shard.memberCount, shard.developmentPrerequisites])) ===
      JSON.stringify([["batch-001", 25, []], ["batch-002", 15, []]]),
    "G4 L3 release shard contract drifted",
  );
  const expectedReleaseIds = workCards.cards.map((card) => card.animationId);
  invariant(
    JSON.stringify(releaseDefinition.members.map((member) => member.animationId)) === JSON.stringify(expectedReleaseIds),
    "Lesson release order differs from the 40 source-bound work cards",
  );
  for (const [index, member] of releaseDefinition.members.entries()) {
    const card = workCards.cards[index];
    invariant(member.ordinal === index + 1 && member.assetId === card.assetId, `${member.animationId}: release ordinal or asset binding drifted`);
    invariant(member.source?.path === card.source.swf.path.slice(SOURCE_PREFIX.length) && member.source.sha256 === card.source.swf.sha256, `${member.animationId}: release source binding drifted`);
    invariant(member.releaseRole === (index < 39 ? "active-xml-referenced-page" : "course-shell"), `${member.animationId}: release role drifted`);
    invariant(member.xmlOccurrence === (index < 39 ? index + 1 : null), `${member.animationId}: release XML occurrence drifted`);
  }

  const releaseLedgerDocument = json(PATHS.releaseLedger);
  invariant(releaseLedgerDocument.schemaVersion === 1 && /^sha256:[a-f0-9]{64}$/.test(releaseLedgerDocument.generatedMarker), "Lesson release ledger is malformed");
  invariant(
    releaseLedgerDocument.sources?.lessonReleases?.path === PATHS.releaseManifest &&
      releaseLedgerDocument.sources.lessonReleases.bytes === binding(PATHS.releaseManifest).bytes &&
      releaseLedgerDocument.sources.lessonReleases.sha256 === binding(PATHS.releaseManifest).sha256 &&
      releaseLedgerDocument.sources?.completionLedger?.path === PATHS.ledger &&
      releaseLedgerDocument.sources.completionLedger.bytes === binding(PATHS.ledger).bytes &&
      releaseLedgerDocument.sources.completionLedger.sha256 === binding(PATHS.ledger).sha256 &&
      releaseLedgerDocument.sources.completionLedger.generatedMarker === ledger.generatedMarker,
    "Lesson release ledger is not bound to the exact release manifest and completion ledger",
  );
  const releaseLedgerEntry = selectUniqueReleaseById(
    releaseLedgerDocument,
    releaseDefinition.releaseId,
    "Lesson release ledger",
  );
  const recomputedReleaseMembers = releaseDefinition.members.map((member) => {
    const entry = strictEntryByAnimationId.get(member.animationId) ?? null;
    const status = !entry ? "missing" : entry.assetId === member.assetId ? "strict-complete" : "asset-mismatch";
    return {member, entry, status, strictComplete: status === "strict-complete"};
  });
  const releaseStrictCompleteMembers = recomputedReleaseMembers.filter((member) => member.strictComplete).length;
  const releaseMissingMembers = recomputedReleaseMembers.filter((member) => member.status === "missing").length;
  const releaseAssetMismatchMembers = recomputedReleaseMembers.filter((member) => member.status === "asset-mismatch").length;
  const releasePublished = releaseStrictCompleteMembers === 40 && releaseMissingMembers === 0 && releaseAssetMismatchMembers === 0;
  invariant(
    releaseLedgerEntry.publicationMode === "atomic" &&
      releaseLedgerEntry.expectedMemberCount === 40 &&
    releaseLedgerEntry.strictCompleteCount === releaseStrictCompleteMembers &&
      releaseLedgerEntry.missingCount === releaseMissingMembers &&
      releaseLedgerEntry.assetMismatchCount === releaseAssetMismatchMembers &&
      releaseLedgerEntry.published === releasePublished &&
      releaseLedgerEntry.status === (releasePublished ? "published" : "unpublished") &&
      releaseLedgerEntry.gate?.kind === "atomic-all-members-strict" &&
      releaseLedgerEntry.gate?.requiredCount === 40 &&
      releaseLedgerEntry.gate?.admittedCount === releaseStrictCompleteMembers &&
      releaseLedgerEntry.gate?.open === releasePublished,
    "Lesson release ledger counts or atomic gate differ from strict completion recomputation",
  );
  invariant(releaseLedgerEntry.members?.length === 40, "Lesson release ledger must contain 40 member witnesses");
  for (const [index, recomputed] of recomputedReleaseMembers.entries()) {
    const witness = releaseLedgerEntry.members[index];
    invariant(
      witness.ordinal === index + 1 &&
        witness.animationId === recomputed.member.animationId &&
        witness.assetId === recomputed.member.assetId &&
        witness.status === recomputed.status &&
        witness.strictComplete === recomputed.strictComplete &&
        witness.ledgerAssetId === (recomputed.entry?.assetId ?? null),
      `${recomputed.member.animationId}: release ledger witness differs from recomputation`,
    );
  }
  validateLessonReleaseLedgerSummary(releaseLedgerDocument);
  const prototypeRegistry = json(PATHS.prototypeRegistry);
  const prototypeByKey = new Map(prototypeRegistry.entries.map((entry) => [entry.key, entry]));
  const workCardBySourcePath = new Map(workCards.cards.map((card) => [card.source.swf.path.slice(SOURCE_PREFIX.length), card]));
  const sectionByCode = new Map(parsed.sections.map((section) => [section.code, section]));
  const currentModuleExistence = new Map(await Promise.all(workCards.cards.map(async (card) => {
    const modulePath = `packages/demos/src/modules/${card.animationId}.tsx`;
    const exists = await stat(absolute(modulePath)).then((metadata) => metadata.isFile()).catch((error) => {
      if (error?.code === "ENOENT") return false;
      throw error;
    });
    return [card.animationId, {path: modulePath, exists}];
  })));

  const pages = parsed.activePages.map((page, index) => {
    const animation = animationByPath(animations, page.archiveRelativePath);
    const card = workCardBySourcePath.get(page.archiveRelativePath);
    invariant(card, `${page.archiveRelativePath}: no implementation work card`);
    invariant(card.sequence === index + 1 && card.animationId === animation.animationId && card.assetId === animation.assetId, `${page.archiveRelativePath}: XML/catalog/work-card identity drift`);
    invariant(animation.references.courseXml.length === 1 && animation.references.courseXml[0].occurrence === page.globalPageOrdinal, `${animation.animationId}: active XML occurrence drifted`);
    invariant(animation.isCanonical && animation.duplicateGroupSize === 1 && animation.flags.referenced && !animation.flags.variant, `${animation.animationId}: active placement identity is no longer canonical and unique`);
    const section = sectionByCode.get(page.sectionCode);
    const previous = index > 0 ? parsed.activePages[index - 1] : null;
    const next = index < parsed.activePages.length - 1 ? parsed.activePages[index + 1] : null;
    const previousAnimation = previous ? animationByPath(animations, previous.archiveRelativePath) : null;
    const nextAnimation = next ? animationByPath(animations, next.archiveRelativePath) : null;
    const prototype = prototypeByKey.get(animation.animationId) ?? null;
    const strictLedgerEntry = strictEntryByAnimationId.get(animation.animationId) ?? null;
    const exactStrictComplete = strictLedgerEntry?.assetId === animation.assetId;
    return {
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      sectionNumber: page.sectionNumber,
      animationId: animation.animationId,
      assetId: animation.assetId,
      canonicalAnimationId: animation.canonicalAnimationId,
      isCanonical: animation.isCanonical,
      alias: !animation.isCanonical,
      duplicateGroupSize: animation.duplicateGroupSize,
      batchId: card.batch.batchId,
      source: card.source,
      runtime: card.runtime,
      labels: {
        lessonEnglish: {status: "exact-course-xml", valueRaw: parsed.titleEnglishRaw, sourceLine: 4},
        lessonSpanish: {status: "missing-lesson-level-spanish-title", valueRaw: null, sourceLine: null},
        sectionEnglish: {status: "exact-course-xml", valueRaw: section.titleEnglish},
        sectionSpanish: {status: "exact-course-xml", valueRaw: section.titleSpanish},
        pageEnglish: {status: "exact-page-title-attribute", valueRaw: page.titleRaw, sourceLine: page.sourceLine},
        pageSpanish: pageSpanishEvidence(page, section),
      },
      xmlNavigation: {
        raw: page.navigationRaw,
        status: page.navigationRaw === "ON"
          ? "explicit-on-in-course-xml"
          : page.navigationRaw === "OFF"
            ? "explicit-off-in-course-xml"
            : "unspecified-by-course-xml",
        behavioralMeaningVerifiedInOriginalRuntime: false,
      },
      navigation: {
        sourceOrderEvidence: "active-course-xml-global-page-order",
        previousAnimationId: previousAnimation?.animationId ?? null,
        previousRoutes: previousAnimation ? routePair(previousAnimation.animationId) : null,
        nextAnimationId: nextAnimation?.animationId ?? null,
        nextRoutes: nextAnimation ? routePair(nextAnimation.animationId) : null,
        courseRoutes: {en: "/courses/4/3", es: "/es/courses/4/3"},
        hrefAndRouteContractVerifiedInCurrentJavascriptBrowser: browserProductQaPassed,
        previousNextBehaviorVerifiedInBrowser: false,
        previousNextBehaviorVerifiedInOriginalRuntime: false,
      },
      replay: {
        required: true,
        expectation: "Reload/reset the current animation's complete playhead and state vector without changing its lesson placement or locale.",
        sourceCandidate: "The shipped shell has a reload-current-SWF button path, but its exact reachable identity and complete state effects still require natural runtime proof.",
        mouseVerifiedCurrentJavascript: browserProductQaPassed,
        enterVerifiedCurrentJavascript: browserProductQaPassed,
        spaceVerifiedCurrentJavascript: browserProductQaPassed,
        completeStateResetVerified: false,
      },
      routes: {
        ...routePair(animation.animationId),
        requiredRegistryKey: animation.animationId,
        requiredRegistryModule: `./modules/${animation.animationId}`,
        currentPrototypeRegistryEntry: prototype,
        currentModuleFile: currentModuleExistence.get(animation.animationId),
        strictLedgerEntry,
        productionAdmitted: releasePublished && exactStrictComplete,
        browserVerifiedCurrentJavascript: browserProductQaPassed,
        browserVerificationAuthorityEffect: false,
      },
      engineeringEvidence: {
        currentJavascriptProductQaComplete: browserProductQaPassed,
        evidencePath: PATHS.browserProductQa,
        authorityEffect: false,
      },
      audio: {
        embeddedTagCount: card.signals.embeddedAudio.tagCount,
        associatedFileCount: card.requiredWork.audio.catalogAssociation.associatedFileCount,
        associatedLanguages: card.requiredWork.audio.catalogAssociation.languages,
        allPhysicalHashesVerifiedByWorkCard: card.requiredWork.audio.catalogAssociation.allPhysicalHashesVerified,
        cueMappingEstablished: false,
        runtimeSynchronizationVerified: false,
        namedHumanListeningAccepted: false,
      },
      acceptance: {
        implementationComplete: exactStrictComplete,
        authoritativeOriginalRuntimeComplete: exactStrictComplete,
        fullFrameRmseComplete: exactStrictComplete,
        behaviorComplete: exactStrictComplete,
        productQaComplete: exactStrictComplete,
        audioAccepted: exactStrictComplete,
        humanVisualAccepted: exactStrictComplete,
        ownerAccepted: exactStrictComplete,
        strictComplete: exactStrictComplete,
      },
    };
  });

  const shellCard = workCards.cards.at(-1);
  invariant(shellCard.animationId === "shell-course-g04-l03-index-local" && shellCard.releaseRole === "course-shell", "Last G4 L3 work card is not the course shell");
  const shellStrictLedgerEntry = strictEntryByAnimationId.get(shellCard.animationId) ?? null;
  const shellStrictComplete = shellStrictLedgerEntry?.assetId === shellCard.assetId;
  const machineReport = json(PATHS.machineAudit);
  const shellStatic = await extractShellStaticContract({machineReport, shellSwf});
  const activePathSet = new Set(parsed.activePages.map((page) => page.archiveRelativePath));
  const shellPathSet = new Set(shellStatic.lessonDetails.pages.map((page) => page.archiveRelativePath));
  const extraComparedWithActiveXml = [...shellPathSet].filter((value) => !activePathSet.has(value));
  const missingComparedWithActiveXml = [...activePathSet].filter((value) => !shellPathSet.has(value));
  const commentedArchiveSet = new Set(parsed.commentedPages.map((page) => page.archiveRelativePath));

  const unreferenced = json(PATHS.unreferenced).course.filter((item) => item.sourcePath.startsWith(ARCHIVE_PREFIX) && !item.flags.shell);
  const commentedByPath = new Map(parsed.commentedPages.map((page) => [page.archiveRelativePath, page]));
  const auxiliary = unreferenced.map((entry) => auxiliaryRelation(entry, commentedByPath, pages));
  invariant(auxiliary.length === 9, `Expected 9 non-shell G4 L3 auxiliary/historical sources, found ${auxiliary.length}`);
  invariant(json(PATHS.duplicates).groups.every((group) => !group.placements.some((placement) => placement.sourcePath.startsWith(ARCHIVE_PREFIX))), "G4 L3 unexpectedly entered a byte-duplicate group");

  const webSources = {
    courseRoute: await readFile(absolute(PATHS.courseRoute), "utf8"),
    animationRoute: await readFile(absolute(PATHS.animationRoute), "utf8"),
    animationRuntime: await readFile(absolute(PATHS.animationRuntime), "utf8"),
    catalogLibrary: await readFile(absolute(PATHS.catalogLibrary), "utf8"),
    lessonNavigationData: await readFile(absolute(PATHS.lessonNavigationData), "utf8"),
    lessonNavigationComponent: await readFile(absolute(PATHS.lessonNavigationComponent), "utf8"),
  };
  const webInspection = inspectWebSources(webSources);

  const sections = parsed.sections.map((section) => {
    const sectionPages = pages.filter((page) => page.sectionCode === section.code);
    return {
      ...section,
      labels: {
        en: {status: "exact-course-xml", valueRaw: section.titleEnglish},
        es: {status: "exact-course-xml", valueRaw: section.titleSpanish},
      },
      firstActiveAnimationId: sectionPages[0].animationId,
      firstActiveRoutes: routePair(sectionPages[0].animationId),
      lastActiveAnimationId: sectionPages.at(-1).animationId,
      sectionNavigationBrowserVerifiedCurrentJavascript: browserProductQaPassed,
      sectionNavigationBrowserVerified: false,
    };
  });

  const prototypePageIds = pages.filter((page) => page.routes.currentPrototypeRegistryEntry).map((page) => page.animationId);
  const shellPrototype = prototypeByKey.get(shellCard.animationId) ?? null;
  const shellPrototypeIds = shellPrototype ? [shellCard.animationId] : [];
  const prototypeAnimationIds = [...prototypePageIds, ...shellPrototypeIds];
  const exactSpanishPageAnchorLabels = pages.filter((page) => page.labels.pageSpanish.status === "exact-subpage-anchor-label").length;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    reportType: "g4-l3-full-lesson-product-navigation-contract",
    generator: {...generatorBinding, version: 1},
    sourceBindings: {
      sourceXml: xmlBinding,
      shellSwf,
      courseImage,
      catalogs: Object.fromEntries([PATHS.lessons, PATHS.batches, PATHS.animations, PATHS.assets, PATHS.audioGroups, PATHS.unreferenced, PATHS.duplicates, PATHS.ledger, PATHS.releaseManifest, PATHS.releaseLedger].map((inputPath) => [path.basename(inputPath), binding(inputPath)])),
      workCards: binding(PATHS.workCards),
      batchReadiness: [binding(PATHS.batch001Readiness), binding(PATHS.batch002Readiness)],
      productCode: Object.fromEntries(await Promise.all([PATHS.courseRoute, PATHS.animationRoute, PATHS.animationRuntime, PATHS.catalogLibrary, PATHS.lessonNavigationData, PATHS.lessonNavigationComponent, PATHS.prototypeRegistry, PATHS.generatedRegistry, PATHS.registryGenerator, PATHS.prototypeManifest, PATHS.shellTimeline, PATHS.shellModule].map(async (inputPath) => [inputPath, await bindFile(inputPath)]))),
      machineAudit: binding(PATHS.machineAudit),
      browserProductQa: browserProductQaBinding,
    },
    summary: {
      activePages: pages.length,
      courseShells: 1,
      sectionCount: sections.length,
      commentedXmlPages: parsed.commentedPages.length,
      auxiliaryOrHistoricalSources: auxiliary.length,
      activeAliases: pages.filter((page) => page.alias).length,
      activeDuplicateBinaries: pages.length - new Set(pages.map((page) => page.assetId)).size,
      exactSpanishSectionLabels: sections.filter((section) => section.labels.es.valueRaw).length,
      exactSpanishPageAnchorLabels,
      missingPageLevelSpanishTitles: pages.length - exactSpanishPageAnchorLabels,
      explicitXmlNavigationOn: pages.filter((page) => page.xmlNavigation.raw === "ON").length,
      explicitXmlNavigationOff: pages.filter((page) => page.xmlNavigation.raw === "OFF").length,
      unspecifiedXmlNavigation: pages.filter((page) => page.xmlNavigation.raw === null).length,
      catalogAssociatedAudioPages: pages.filter((page) => page.audio.associatedFileCount > 0).length,
      uniqueCatalogAssociatedAudioFiles: workCards.summary.uniqueCatalogAssociatedAudioFiles,
      currentPrototypeModules: prototypeAnimationIds.length,
      currentPrototypePageModules: prototypePageIds.length,
      currentPrototypeShellModules: shellPrototypeIds.length,
      currentStrictModules: releaseStrictCompleteMembers,
      browserVerifiedRoutes: browserProductQa.summary.uniqueRoutesVerified,
      strictCompletePages: recomputedReleaseMembers.slice(0, 39).filter((member) => member.strictComplete).length,
      strictCompleteShells: shellStrictComplete ? 1 : 0,
    },
    development: {
      mode: "parallel-shards",
      parallelGroup: releaseDefinition.shards[0].parallelGroup,
      shards: releaseDefinition.shards.map((shard) => ({
        shardId: shard.shardId,
        batchId: shard.batchId,
        memberCount: shard.memberCount,
        scaffoldGateOpen: true,
        implementationAuthorized: false,
      })),
      scaffoldGatesOpen: true,
      implementationAuthorized: false,
      boundary: "Open scaffold gates authorize deterministic workspace preparation only; they do not establish implementation, fidelity, acceptance, or completion.",
    },
    publication: {
      releaseId: releaseDefinition.releaseId,
      mode: releaseDefinition.publicationMode,
      requiredMembers: 40,
      strictCompleteMembers: releaseStrictCompleteMembers,
      missingMembers: releaseMissingMembers,
      assetMismatchMembers: releaseAssetMismatchMembers,
      published: releasePublished,
      state: releasePublished ? "published" : "unpublished",
      completionLedgerMarker: ledger.generatedMarker,
      releaseLedgerMarker: releaseLedgerDocument.generatedMarker,
      boundary: "Public admission is all-or-none: 0/40 through 39/40 remain unpublished, and nonmember G4 L3 variants remain hidden.",
    },
    lesson: {
      grade: 4,
      lesson: 3,
      courseNameRaw: parsed.courseName,
      titleEnglishRaw: parsed.titleEnglishRaw,
      lessonNameRaw: parsed.lessonNameRaw,
      titleSpanish: {
        valueRaw: null,
        status: "missing-from-course-xml",
        policy: "Do not silently translate; a reviewed display translation and its evidence must be recorded separately.",
      },
      domain: "negative-numbers-number-line",
      pageRoot: parsed.pageRoot,
      sequenceAuthority: {
        selectedForThis39PageProductContract: "active-Page elements in physical G4 L3 index.xml",
        sourceXmlSha256: xmlBinding.sha256,
        shippedShellStaticConflictResolved: false,
        originalRuntimeBehaviorEstablished: false,
      },
      courseImage: {...courseImage, xmlValueRaw: parsed.courseImageRaw},
      keyterms: {
        courseXmlReferences: {
          en: {...lessonKeytermsEnglish, xmlValueRaw: parsed.keytermsRaw.english},
          es: {...lessonKeytermsSpanish, xmlValueRaw: parsed.keytermsRaw.spanish},
          diagramDirectoryRaw: parsed.keytermsRaw.diagramDirectory,
        },
        shippedShellStaticReferences: {
          en: shellKeytermsEnglish,
          es: shellKeytermsSpanish,
        },
        conflict: "Course XML references two absent lesson-specific XML files, while the shipped shell script references two present grade-wide XML files.",
        runtimeResolutionVerified: false,
        productDispositionAccepted: false,
      },
    },
    routes: {
      lesson: {en: "/courses/4/3", es: "/es/courses/4/3"},
      shellAnimation: routePair("shell-course-g04-l03-index-local"),
      pagePattern: {en: "/animations/[animationId]", es: "/es/animations/[animationId]"},
      registryContract: {
        requiredKeys: [...pages.map((page) => page.animationId), "shell-course-g04-l03-index-local"],
        requiredModulePattern: "./modules/<animationId>",
        perAnimationStrictAuthority: "catalog/completion-ledger.json",
        atomicLessonPublicationAuthority: "catalog/lesson-release-ledger.json",
        handWrittenCompleteStatusSufficient: false,
      },
      currentState: {
        completionLedgerEntries: ledger.entries.length,
        releaseStrictCompleteMembers,
        releasePublished,
        productionAdmittedLessonPages: releasePublished ? 39 : 0,
        productionAdmittedCourseShells: releasePublished ? 1 : 0,
        strictRegistryModules: releaseStrictCompleteMembers,
        prototypeModules: prototypeAnimationIds.length,
        prototypeAnimationIds,
        courseRoutePublished: releasePublished,
      },
      staticCodeInspection: webInspection,
      browserProductQa: {
        status: browserProductQa.summary.status,
        evidence: browserProductQaBinding,
        uniqueRoutesVerified: browserProductQa.summary.uniqueRoutesVerified,
        routeVisits: browserProductQa.summary.routeVisits,
        desktopFixedFrameRoutes: browserProductQa.summary.desktopFixedFrameRoutes,
        mobileSpanishReducedMotionRoutes: browserProductQa.summary.mobileSpanishReducedMotionRoutes,
        replayMouseEnterSpaceRoutes: browserProductQa.summary.replayMouseEnterSpaceRoutes,
        axeAudits: browserProductQa.summary.axeAudits,
        blockingAxeViolations: browserProductQa.summary.axeSeriousOrCriticalViolations,
        runtimeAndNetworkErrors: browserProductQa.summary.consoleErrors + browserProductQa.summary.pageErrors + browserProductQa.summary.failedRequests + browserProductQa.summary.badHttpResponses,
        horizontalOverflowFailures: browserProductQa.summary.horizontalOverflowFailures,
        limitations: {
          runnableCourseShellModules: browserProductQa.summary.runnableShellModules,
          spanishGraphicRoutes: browserProductQa.summary.mobileSpanishGraphicRoutes,
          spanishFailClosedSemanticRoutes: browserProductQa.summary.mobileSpanishFailClosedSemanticRoutes,
          completeReplayStateParityVerified: false,
          originalRuntimeNavigationParityVerified: false,
        },
        authorityEffect: false,
      },
      requiredChangesAfterEvidenceAndBatchGatesOpen: [
        "Validate the implemented exact lesson-order map against authoritative original-runtime navigation evidence before public admission.",
        "Review the source-exact section labels and the explicit English fallbacks for missing page-level Spanish title evidence.",
        "Capture durable browser evidence for lesson-context breadcrumbs, previous, next, course-map, section, and Replay controls at all required viewports.",
        "Keep the entire declared lesson absent until every exact member is strict-complete, then admit all 39 pages and the shell atomically.",
        "Preserve locale and lesson placement across previous/next/course navigation; define and test deterministic query retention separately from ordinary navigation.",
      ],
    },
    sections,
    pages,
    shell: {
      animationId: shellCard.animationId,
      assetId: shellCard.assetId,
      source: shellCard.source,
      runtime: shellCard.runtime,
      routes: routePair(shellCard.animationId),
      currentPrototypeRegistryEntry: shellPrototype,
      currentModuleFile: currentModuleExistence.get(shellCard.animationId),
      strictLedgerEntry: shellStrictLedgerEntry,
      productionAdmitted: releasePublished && shellStrictComplete,
      engineeringEvidence: {
        currentJavascriptStructuralProjectionExists: Boolean(shellPrototype && currentModuleExistence.get(shellCard.animationId)?.exists),
        browserProductQaComplete: browserProductQaPassed,
        sourceVisualParityEstablished: false,
        sourceNavigationParityEstablished: false,
        evidencePath: PATHS.browserProductQa,
        authorityEffect: false,
      },
      staticScriptEvidence: {
        tool: shellStatic.tool,
        exportedScriptCount: shellStatic.exportedScriptCount,
        rootScript: shellStatic.rootScript,
        supportingScripts: shellStatic.supportingScripts,
        requiredFunctions: shellStatic.requiredFunctions,
        evidenceLimit: "Static ActionScript establishes candidates and exact source text, not reachability, visual behavior, or original-runtime execution.",
      },
      staticSequence: {
        pageCount: shellStatic.lessonDetails.pages.length,
        sections: shellStatic.lessonDetails.sections,
        rawLessonDetailsSha256: shellStatic.lessonDetails.rawSha256,
        extraComparedWithActiveXml,
        missingComparedWithActiveXml,
        commentedXmlPathsIncludedByStaticShell: extraComparedWithActiveXml.filter((value) => commentedArchiveSet.has(value)),
        commentedXmlPathsExcludedByStaticShell: [...commentedArchiveSet].filter((value) => !shellPathSet.has(value)),
        conflictStatus: "unresolved",
        productContractStillUses39ActiveXmlPages: true,
      },
      navigationExpectations: {
        previous: {
          sourceCandidate: "doPlayPreviousMovie decrements the page index and crosses to the prior section; the first section clamps at its first child.",
          productExpectation: "Navigate to previousAnimationId in the 39-page active XML chain; disable at ordinal 1.",
          originalRuntimeVerified: false,
          browserVerified: false,
        },
        next: {
          sourceCandidate: "doPlayNextMovie increments the page index and crosses to the next section; the final FQ child clamps at the end.",
          productExpectation: "Navigate to nextAnimationId in the 39-page active XML chain; disable at ordinal 39.",
          originalRuntimeVerified: false,
          browserVerified: false,
        },
        replay: {
          sourceCandidate: "A release handler resets host flags/audio and reloads the current child SWF through loadSWFMovie.",
          productExpectation: "Reset the current module's complete state vector and playhead, preserve lesson placement/locale, and support mouse, Enter, and Space.",
          originalRuntimeVerified: false,
          browserVerified: false,
        },
        courseAndSectionMap: {
          sourceCandidate: "doSlideClick/doMapClick and source arrays select section/page children.",
          productExpectation: "Return to /courses/4/3 or /es/courses/4/3 and provide direct section navigation to each section's first active page.",
          originalRuntimeVerified: false,
          browserVerified: false,
        },
        finalQuizNavigation: {
          sourceXmlValues: ["ON", "OFF", "ON"],
          staticShellCandidate: "doCheckPrevAndNext contains special FQ02 hiding logic.",
          productExpectation: "Do not normalize OFF or unspecified values to ON; resolve visible-control behavior from a natural original-runtime trace.",
          originalRuntimeVerified: false,
          browserVerified: false,
        },
        spanishAudio: {
          sourceCandidate: "doPlaySpanishAudio loads SA/<child-basename>.mp3 and pauses the child timeline until sound completion or stop.",
          productExpectation: "Retain verified language, file, start/stop, pause/resume, and Replay behavior per page.",
          originalRuntimeVerified: false,
          listeningAccepted: false,
        },
      },
      acceptance: {
        implementationComplete: shellStrictComplete,
        originalRuntimeComplete: shellStrictComplete,
        navigationBehaviorComplete: shellStrictComplete,
        fullFrameRmseComplete: shellStrictComplete,
        productQaComplete: shellStrictComplete,
        humanVisualAccepted: shellStrictComplete,
        ownerAccepted: shellStrictComplete,
        strictComplete: shellStrictComplete,
      },
    },
    auxiliaryAndHistoricalSources: auxiliary,
    missingEvidenceBeforeCompleteLessonClaim: [
      {id: "atomic-release", status: releasePublished ? "complete" : "missing", required: "all 40 exact release assets in the current strict completion ledger", current: `${releaseStrictCompleteMembers}/40 strict; development scaffold gates open; atomic publication ${releasePublished ? "open" : "closed"}`},
      {id: "implementation", status: releaseStrictCompleteMembers === 40 ? "complete" : "missing", required: "40 strict JavaScript modules and registry entries", current: `${prototypeAnimationIds.length} current-JavaScript engineering prototypes (39 pages plus 1 structural shell); ${releaseStrictCompleteMembers} strict modules`},
      {id: "source-sequence-conflict", status: "missing", required: "resolve the active-XML 39-page sequence versus the shipped-shell 44-path static candidate through authoritative evidence and owner disposition", current: "unresolved"},
      {id: "authoring", status: "missing", required: "current Animate authoring audits for all 29 FLA-backed items", current: "not completed by this report"},
      {id: "original-runtime", status: "missing", required: "natural authoritative runtime traces for all reachable page, shell, branch, locale, navigation, terminal, and Replay states", current: "0/40 established"},
      {id: "frame-domains-scenarios", status: "missing", required: "final frame-domain disposition and scenario inventory for every item", current: "40/40 unresolved in work cards"},
      {id: "visual-parity", status: "missing", required: "native-size full-frame captures, exact hash pairing, RMSE/diffs, and visual inspection for all requirements", current: "0/40 complete"},
      {id: "audio", status: "missing", required: "cue mapping, duration, frame sync, Replay/reset, and named-human EN/ES listening acceptance", current: "143 catalog-associated files inventoried; no lesson-level acceptance"},
      {id: "spanish-labels", status: "missing", required: "reviewed disposition for missing lesson/page Spanish titles without silent translation", current: "lesson Spanish title absent; 24/39 pages lack exact Spanish SubPageTitle anchor evidence"},
      {id: "keyterms", status: "missing", required: "resolve missing lesson-specific versus present grade-wide keyterm XML sources and validate routes/diagrams", current: "source conflict unresolved"},
      {id: "browser-product-qa", status: "partial", required: "durable browser evidence for English/Spanish routes, exact order, previous/next/course/section/Replay controls, native/mobile layouts, accessibility, console/assets/network", current: `${browserProductQa.summary.uniqueRoutesVerified} unique current-JavaScript routes passed across ${browserProductQa.summary.routeVisits} visits; 39/39 mouse/Enter/Space Replay activations; ${browserProductQa.summary.axeSeriousOrCriticalViolations} serious/critical Axe violations; 1/1 runnable structural shell projection with source-visual parity explicitly false; Spanish page output remains ${browserProductQa.summary.mobileSpanishGraphicRoutes} graphic plus ${browserProductQa.summary.mobileSpanishFailClosedSemanticRoutes} fail-closed semantic routes`},
      {id: "human-owner", status: "missing", required: "strict human visual review and separate owner acceptance after all machine gates pass", current: "0/40"},
    ],
    acceptance: {
      acceptanceNeutral: true,
      implementationAuthorized: false,
      routeBehaviorVerified: false,
      originalRuntimeAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictProductAccepted: false,
      lessonComplete: false,
      statement: "This report is a deterministic source/order/product contract with hash-bound acceptance-neutral browser QA for the current JavaScript layer. The course shell now has a runnable 39-page structural audit projection, but its source visual parity, 44-versus-39 sequence conflict, original-runtime behavior, and navigation parity remain unresolved. The QA does not accept audio or bilingual visual parity, prove complete Replay state reset, record human/owner approval, or complete the lesson.",
    },
  };
  validateLessonProductContract(report);
  return report;
}

function cell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderLessonProductContractMarkdown(report) {
  const pageRows = report.pages.map((page) => [
    page.globalPageOrdinal,
    `${page.sectionCode}${String(page.sectionPageOrdinal).padStart(2, "0")}`,
    `\`${page.animationId}\``,
    page.labels.pageEnglish.valueRaw,
    page.labels.pageSpanish.valueRaw ?? "missing",
    page.xmlNavigation.raw ?? "unspecified",
    page.navigation.previousAnimationId ? `\`${page.navigation.previousAnimationId}\`` : "—",
    page.navigation.nextAnimationId ? `\`${page.navigation.nextAnimationId}\`` : "—",
    page.batchId,
  ].map(cell).join(" | "));
  const sectionRows = report.sections.map((section) => [
    section.order,
    section.code,
    section.labels.en.valueRaw,
    section.labels.es.valueRaw,
    section.activePageCount,
    section.commentedPageCount,
    `\`${section.firstActiveAnimationId}\``,
  ].map(cell).join(" | "));
  const historicalRows = report.auxiliaryAndHistoricalSources.map((item) => [
    `\`${item.animationId}\``,
    item.sourcePath,
    item.variantKind,
    item.commentedXmlReference ? "yes" : "no",
    item.relatedActiveAnimationId ? `\`${item.relatedActiveAnimationId}\`` : "—",
    "no",
  ].map(cell).join(" | "));
  const missingRows = report.missingEvidenceBeforeCompleteLessonClaim.map((item) =>
    [item.id, item.status, item.required, item.current].map(cell).join(" | ")
  );
  return [
    "# G4 L3 full-lesson product/navigation contract",
    "",
    "> Acceptance-neutral deterministic contract. Hash-bound current-JavaScript browser QA is recorded separately from original-runtime parity, audio acceptance, human review, owner acceptance, strict completion, and publication.",
    "",
    "## Bound scope",
    "",
    `- Source order: **${report.summary.activePages} active pages** in the physical G4 L3 \`index.xml\`.`,
    `- Product unit: **${report.summary.activePages} pages + ${report.summary.courseShells} course shell** in batch-001 (25) and batch-002 (15).`,
    `- Current strict state: **${report.summary.strictCompletePages}/39 pages** and **${report.summary.strictCompleteShells}/1 shell**.`,
    `- Current registry state: **${report.summary.currentPrototypeModules} current-JavaScript prototype**, **${report.summary.currentStrictModules} strict modules**.`,
    `- Development scaffold state: **${report.development.shards.filter((shard) => shard.scaffoldGateOpen).length}/2 shard gates open**; implementation authorization remains **${report.development.implementationAuthorized}**.`,
    `- Atomic publication state: **${report.publication.strictCompleteMembers}/40 strict**, **${report.publication.state}**.`,
    `- Browser-verified routes in this report: **${report.summary.browserVerifiedRoutes}**.`,
    "",
    "## Source conflicts that remain open",
    "",
    `- Active XML defines 39 pages. The shipped shell's static \`LessonDetails\` literal names ${report.shell.staticSequence.pageCount} paths and adds ${report.shell.staticSequence.extraComparedWithActiveXml.length} commented introduction files: ${report.shell.staticSequence.extraComparedWithActiveXml.map((value) => `\`${value}\``).join(", ")}. Static code is not runtime proof.`,
    `- The sixth commented introduction excluded by the shipped shell candidate is ${report.shell.staticSequence.commentedXmlPathsExcludedByStaticShell.map((value) => `\`${value}\``).join(", ")}.`,
    "- The course XML points to missing lesson-specific keyterm XML files; the shipped shell script points to present grade-wide keyterm XML files. The runtime/product disposition is unresolved.",
    "- The XML has no lesson-level Spanish title. Only 15 page anchors have exact Spanish `SubPageTitle` evidence; 24 active pages have no exact page-level Spanish title.",
    "",
    "## Product route contract",
    "",
    `- Course: \`${report.routes.lesson.en}\` and \`${report.routes.lesson.es}\`.`,
    `- Pages: \`${report.routes.pagePattern.en}\` and \`${report.routes.pagePattern.es}\`.`,
    `- Shell audit/player routes: \`${report.routes.shellAnimation.en}\` and \`${report.routes.shellAnimation.es}\`.`,
    "- `catalog/completion-ledger.json` admits exact individual strict results; `catalog/lesson-release-ledger.json` separately enforces all-or-none lesson publication. Source code inspection is not browser evidence.",
    `- The current course page consumes the exact 39-page lesson contract and keeps production admission behind the atomic 40-member release gate. The bound current-JavaScript QA passed ${report.routes.browserProductQa.uniqueRoutesVerified} unique routes across ${report.routes.browserProductQa.routeVisits} visits; this does not establish original-runtime parity.`,
    "",
    "## Sections and bilingual label evidence",
    "",
    "Order | Code | English | Spanish | Active pages | Commented pages | First active animation",
    "---: | --- | --- | --- | ---: | ---: | ---",
    ...sectionRows,
    "",
    "## Exact 39-page active order",
    "",
    "# | Page | animationId | English Page Title | Exact Spanish anchor | XML Navigation | Previous | Next | Batch",
    "---: | --- | --- | --- | --- | --- | --- | --- | ---",
    ...pageRows,
    "",
    "The previous/next columns are deterministic adjacency derived from active XML order. Their current-JavaScript href and route contract is browser-verified; legacy-shell execution and original-runtime behavior remain unverified.",
    "",
    "## Replay and course navigation expectations",
    "",
    "- Previous/next hrefs, route availability, section crossings, locale prefixes, and ordinal 1/39 disabled states passed current-JavaScript browser QA; original-runtime navigation remains unverified.",
    "- Replay mouse, Enter, and Space activation counters passed on all 39 current-JavaScript pages. Complete playhead/state-vector reset and original-runtime parity remain unverified.",
    "- Course/map returns to the locale-correct G4 L3 course route; each section link targets that section's first active placement.",
    "- FQ page navigation remains exactly `ON`, `OFF`, `ON`; the meaning and visible-control behavior must be observed in a natural original-runtime trace.",
    "- Static shell evidence suggests Spanish host audio pauses the child timeline and resumes it at completion; cue timing and listening remain unaccepted.",
    "",
    "## Auxiliary, historical, and commented sources",
    "",
    "animationId | Source | Catalog variant kind | Commented XML | Related active candidate | Alias",
    "--- | --- | --- | --- | --- | ---",
    ...historicalRows,
    "",
    "All are distinct canonical binaries. None is an alias for an active page, and none belongs to the 39-page active sequence.",
    "",
    "## Missing evidence before any complete-lesson claim",
    "",
    "Gate | Status | Required evidence | Current evidence",
    "--- | --- | --- | ---",
    ...missingRows,
    "",
    "## Acceptance boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON_OUTPUT, markdownOutput: DEFAULT_MARKDOWN_OUTPUT, help: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") {
      const value = argv[++index];
      if (!value) throw new Error("--json-output requires a path");
      options.jsonOutput = path.resolve(value);
    } else if (argument === "--markdown-output") {
      const value = argv[++index];
      if (!value) throw new Error("--markdown-output requires a path");
      options.markdownOutput = path.resolve(value);
    } else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option ${argument}`);
  }
  return options;
}

function assertOutput(filePath, extension) {
  invariant(path.extname(filePath) === extension, `Output must end in ${extension}`);
  const reportsRoot = path.join(projectRoot, "reports");
  const rel = path.relative(reportsRoot, filePath);
  invariant(rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel), "Output must remain inside reports/");
}

async function main(argv) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-lesson-product-contract.mjs [--check] [--json-output reports/file.json] [--markdown-output reports/file.md]\n");
    return;
  }
  assertOutput(options.jsonOutput, ".json");
  assertOutput(options.markdownOutput, ".md");
  const report = await buildLessonProductContract();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderLessonProductContractMarkdown(report);
  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(existingJson === json, "G4 L3 lesson product/navigation JSON is missing or stale");
    invariant(existingMarkdown === markdown, "G4 L3 lesson product/navigation Markdown is missing or stale");
    process.stdout.write(`PASS: deterministic G4 L3 39-page + shell product/navigation contract is current; ${report.publication.strictCompleteMembers}/40 strict, atomic publication ${report.publication.state}\n`);
    return;
  }
  await Promise.all([writeFile(options.jsonOutput, json), writeFile(options.markdownOutput, markdown)]);
  process.stdout.write("WROTE: acceptance-neutral G4 L3 39-page + shell product/navigation contract\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
