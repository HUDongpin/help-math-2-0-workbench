#!/usr/bin/env node

/**
 * Build an immutable, acceptance-neutral review packet for the G6-G8 shared
 * source risks.  This command records every machine-observable item but never
 * selects a conflicting source, closes a dependency, assigns a reviewer, or
 * changes Current-JS/release state.
 */

import {createHash} from "node:crypto";
import {access, lstat, mkdir, readFile, readdir, rename, rm} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {parseSharedLessonXml, stableJson} from "./lib/g678-shared-catalog.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULE_CODES = new Set(["NMS002", "GEO001", "ALG001", "DAT001"]);
const ALL_FALSE = Object.freeze({
  canonicalSourcePromoted: false,
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function resolveProject(value) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(PROJECT_ROOT, value);
}

function tokenPath(value) {
  const relative = path.relative(PROJECT_ROOT, value);
  return relative.startsWith("..") ? "$EXTERNAL/" + path.basename(value) : relative.replaceAll(path.sep, "/");
}

async function exists(value) {
  try { await access(value); return true; } catch { return false; }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonl(filePath) {
  const rows = [];
  for (const line of (await readFile(filePath, "utf8")).split(/\r?\n/u)) {
    if (line.trim()) rows.push(JSON.parse(line));
  }
  return rows;
}

async function resolveSharedRoot(configured) {
  invariant(configured, "source root is required via --source-root or HELP_MATH_G678_SOURCE_ROOT");
  const root = resolveProject(configured);
  const candidate = path.join(root, "G6-G8-shared");
  return (await exists(candidate)) ? candidate : root;
}

async function findAlternateXml(root) {
  const alternate = path.join(root, "GEO001", "_alternate");
  const found = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.toLowerCase() === "index.xml" && /[/\\]L1[/\\]index\.xml$/iu.test(target)) found.push(target);
    }
  }
  if (await exists(alternate)) await visit(alternate);
  return found.sort();
}

async function writeNoReplace(filePath, bytes) {
  invariant(!(await exists(filePath)), `refusing to overwrite existing output: ${filePath}`);
  await mkdir(path.dirname(filePath), {recursive: true});
  const staging = `${filePath}.staging-${process.pid}-${Date.now()}`;
  try {
    await import("node:fs/promises").then(({writeFile}) => writeFile(staging, bytes, {flag: "wx"}));
    await rename(staging, filePath);
  } catch (error) {
    await rm(staging, {force: true}).catch(() => {});
    throw error;
  }
}

function parseArgs(argv) {
  const options = {
    sourceRoot: process.env.HELP_MATH_G678_SOURCE_ROOT ?? null,
    catalog: "catalog/g678-shared-catalog.v1.json",
    profile: "catalog/g678-shared-source-profile.v1.json",
    conflicts: null,
    dependencies: null,
    structuralReport: "work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json",
    output: null,
    mode: "check",
  };
  let explicit = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write" || arg === "--check") {
      invariant(!explicit, "choose exactly one of --write or --check");
      explicit = true; options.mode = arg.slice(2); continue;
    }
    if (arg === "--help" || arg === "-h") return {help: true};
    const key = {
      "--source-root": "sourceRoot", "--catalog": "catalog", "--profile": "profile",
      "--conflicts": "conflicts", "--dependencies": "dependencies",
      "--structural-report": "structuralReport", "--output": "output",
    }[arg];
    invariant(key, `unknown argument: ${arg}`);
    invariant(i + 1 < argv.length, `${arg} requires a value`);
    options[key] = argv[++i];
  }
  options.conflicts ??= path.join(options.sourceRoot ?? "", "conflicts.jsonl");
  options.dependencies ??= path.join(options.sourceRoot ?? "", "missing-dependencies.jsonl");
  if (options.mode === "write") invariant(options.output, "--write requires --output");
  return options;
}

function buildConflictRecords(conflicts, catalog, profile) {
  const records = conflicts
    .filter((row) => MODULE_CODES.has(String(row.normalizedPath ?? "").split("/")[0]) && row.chosenArchive === "NewHelpProgram")
    .sort((a, b) => String(a.normalizedPath).localeCompare(String(b.normalizedPath)));
  invariant(records.length === 46, `expected 46 shared conflicts, found ${records.length}`);
  const pages = catalog.lessons.flatMap((lesson) => lesson.pages.map((page) => ({lesson, page})));
  return records.map((row) => {
    const normalized = String(row.normalizedPath).replaceAll("\\", "/");
    const sourcePath = `HELP_COURSES/${normalized}`;
    const matchingPages = pages.filter(({page}) => page.sourcePath === sourcePath).map(({page}) => page);
    const placements = matchingPages.map((page) => page.placementId);
    return {
      decisionId: `g678-conflict-${normalized.toLowerCase().replaceAll("/", "-")}`,
      moduleCode: normalized.split("/")[0],
      normalizedPath: normalized,
      activePlacementIds: placements,
      canonical: {
        archive: row.chosenArchive,
        sourcePath: row.chosenSourcePath,
        sha256: row.chosenSha256,
        bytes: (Number(row.chosenBytes ?? 0) || matchingPages[0]?.sourceBytes || null),
      },
      variants: (row.variants ?? []).map((variant) => ({
        archive: variant.archive ?? null,
        sourcePath: variant.sourcePath ?? null,
        outputPath: variant.outputPath ?? null,
        sha256: variant.sha256 ?? null,
        bytes: Number(variant.bytes ?? 0) || null,
      })),
      sourceManifestSha256: profile.sourceManifestSha256,
      decisionStatus: "pending-independent-source-choice-review",
      selectedSource: null,
      reviewerId: null,
      decisionReason: null,
      canonicalPolicy: "retain-NewHelpProgram-for-custody-only; do-not-admit-variant",
      acceptanceEffects: {...ALL_FALSE},
    };
  });
}

async function buildGeoAlternateRecords(sharedRoot, catalog, profile) {
  const xmlPaths = await findAlternateXml(sharedRoot);
  invariant(xmlPaths.length === 1, `expected exactly one GEO alternate L1 XML, found ${xmlPaths.length}`);
  const xmlPath = xmlPaths[0];
  const alternateProjection = parseSharedLessonXml({
    bytes: await readFile(xmlPath),
    xmlPath: "G6-G8-shared/GEO001/L1/index.xml",
    moduleCode: "GEO001",
  });
  const canonical = catalog.lessons.find((lesson) => lesson.moduleCode === "GEO001" && lesson.lessonNumber === 1);
  invariant(canonical && canonical.pages.length === 59 && alternateProjection.pages.length === 59, "GEO alternate must contain 59 canonical-order pages");
  // References in the alternate XML are relative to its L1 directory, not
  // the enclosing `devry` directory.
  const alternateRoot = path.dirname(xmlPath);
  const records = [];
  for (let i = 0; i < alternateProjection.pages.length; i += 1) {
    const alternatePage = alternateProjection.pages[i];
    const canonicalPage = canonical.pages[i];
    const alternateAbsolute = path.resolve(alternateRoot, alternatePage.reference);
    let alternateBytes = null;
    try { alternateBytes = await readFile(alternateAbsolute); } catch {}
    const alternateSha = alternateBytes ? sha256(alternateBytes) : null;
    records.push({
      reviewId: `g678-geo001-l01-alternate-p${String(i + 1).padStart(3, "0")}`,
      stableLessonKey: "shared-geo001-l01",
      placementId: canonicalPage.placementId,
      xmlOccurrence: i + 1,
      reference: alternatePage.reference,
      canonical: {sourcePath: canonicalPage.sourcePath, sha256: canonicalPage.sourceSha256, bytes: canonicalPage.sourceBytes},
      alternate: {
        sourcePath: `$HELP_MATH_G678_SOURCE_ROOT/GEO001/_alternate/` + path.relative(alternateRoot, alternateAbsolute).replaceAll(path.sep, "/"),
        sha256: alternateSha,
        bytes: alternateBytes?.length ?? null,
      },
      byteComparison: alternateSha && canonicalPage.sourceSha256 === alternateSha ? "same-sha256" : "different-or-missing",
      sourceManifestSha256: profile.sourceManifestSha256,
      reviewStatus: "pending-source-choice-review",
      selectedSource: null,
      reviewerId: null,
      decisionReason: null,
      acceptanceEffects: {...ALL_FALSE},
    });
  }
  return {xmlPathToken: tokenPath(xmlPath), records};
}

function buildDependencyReview(catalog, dependencyRows, profile) {
  const holds = catalog.lessons.flatMap((lesson) => lesson.dependencyHolds.map((hold) => ({...hold, stableLessonKey: lesson.stableLessonKey})));
  invariant(holds.length === 92, `expected 92 dependency holds, found ${holds.length}`);
  const unique = new Map();
  for (const hold of holds) {
    const key = `${hold.reference}\u0000${hold.status}`;
    const item = unique.get(key) ?? {reference: hold.reference, status: hold.status, occurrences: 0, lessons: new Set(), sourceRows: []};
    item.occurrences += 1; item.lessons.add(hold.stableLessonKey); item.sourceRows.push(hold.sourcePath); unique.set(key, item);
  }
  const refs = [...unique.values()].map((item) => ({
    reference: item.reference,
    status: item.status,
    occurrences: item.occurrences,
    stableLessonKeys: [...item.lessons].sort(),
    sourceRows: [...new Set(item.sourceRows)].sort(),
    closureStatus: String(item.reference).startsWith("HELP_KEYTERMS/") ? "blocked-missing-keyterm-source" : "blocked-commented-source-anomaly",
    resolvedSource: null,
    reviewerId: null,
  })).sort((a, b) => a.reference.localeCompare(b.reference));
  return {
    holdCount: holds.length,
    uniqueReferenceCount: refs.length,
    uniqueReferences: refs,
    keytermHoldCount: holds.filter((hold) => String(hold.reference).startsWith("HELP_KEYTERMS/")).length,
    commentedAnomalyHoldCount: holds.filter((hold) => !String(hold.reference).startsWith("HELP_KEYTERMS/")).length,
    aliasHolds: [{
      reference: "IN/L2IN22.swf",
      sourceLesson: "shared-nms002-l12",
      resolutionObserved: "resolved-by-unique-course-basename",
      resolvedCanonicalPath: "HELP_COURSES/NMS002/L2/IN/L2IN22.swf",
      closureStatus: "blocked-cross-lesson-alias-review",
      selectedSource: null,
      reviewerId: null,
    }],
    dependencyManifestRowCountObserved: dependencyRows.filter((row) => MODULE_CODES.has(row.courseCode)).length,
    sourceManifestSha256: profile.sourceManifestSha256,
    status: "blocked-pending-dependency-closure-review",
  };
}

async function buildPacket(options) {
  const profile = await readJson(resolveProject(options.profile));
  const catalog = await readJson(resolveProject(options.catalog));
  const conflicts = await readJsonl(resolveProject(options.conflicts));
  const dependencyRows = await readJsonl(resolveProject(options.dependencies));
  const sharedRoot = await resolveSharedRoot(options.sourceRoot);
  const conflictRecords = buildConflictRecords(conflicts, catalog, profile);
  const geo = await buildGeoAlternateRecords(sharedRoot, catalog, profile);
  const dependencyReview = buildDependencyReview(catalog, dependencyRows, profile);
  const structuralPath = resolveProject(options.structuralReport);
  const structural = await exists(structuralPath) ? await readJson(structuralPath) : null;
  const calibrationPlacements = (structural?.placements ?? []).map((placement) => ({
    placementId: placement.placementId,
    moduleCode: placement.moduleCode,
    lessonNumber: placement.lessonNumber,
    ordinal: placement.ordinal,
    selectionRole: placement.selectionRole,
    source: {
      catalogPath: placement.source?.catalogPath ?? null,
      sha256: placement.source?.sha256 ?? null,
      bytes: placement.source?.bytes ?? null,
    },
    preliminaryLaneHint: {
      lane: placement.laneHint?.lane ?? null,
      confidence: placement.laneHint?.confidence ?? null,
      reasons: placement.laneHint?.reasons ?? [],
      generationEligible: placement.laneHint?.generationEligible ?? false,
      scaleOutAuthorized: placement.laneHint?.scaleOutAuthorized ?? false,
    },
    behaviorFirstReview: {
      status: "pending-independent-behavior-review",
      reviewerId: null,
      originalRuntimeTraceId: null,
      maintainedAdapterPath: null,
      decision: null,
    },
    acceptanceEffects: {...ALL_FALSE},
  }));
  const audio = {
    pageCandidatePages: catalog.audit.audioCandidatePages,
    groupedFqEaCandidates: catalog.audit.audioGroupedCandidateCount,
    noSameNameCandidatePages: 149,
    multipleSameNameCandidatePages: 55,
    bindings: ["FQ/EA", "FQ/SA", "lesson-SA"],
    status: "candidate-index-only",
    requiredHumanListening: true,
    languageAndCueSemantics: "pending-authorized-original-runtime",
    acceptanceEffects: {...ALL_FALSE},
  };
  return {
    $schema: "../schemas/g678-review-packet-v1.schema.json",
    schemaVersion: 1,
    artifactType: "help-math-g678-review-packet",
    packetId: "g678-review-packet-v1-20260901",
    generatedAt: null,
    source: {
      profileId: profile.profileId,
      sourceManifestSha256: profile.sourceManifestSha256,
      catalogPath: tokenPath(resolveProject(options.catalog)),
      sourceRootToken: "$HELP_MATH_G678_SOURCE_ROOT",
      canonicalArchive: "NewHelpProgram",
    },
    conflicts: {
      expectedCount: 46,
      records: conflictRecords,
      completedDecisionCount: 0,
      status: "blocked-pending-independent-source-choice-review",
    },
    geoAlternate: {
      expectedLessonCount: 1,
      expectedActivePageCount: 59,
      xmlPath: geo.xmlPathToken,
      differingShaCount: geo.records.filter((record) => record.byteComparison !== "same-sha256").length,
      records: geo.records,
      completedDecisionCount: 0,
      status: "blocked-pending-source-choice-review",
      denominatorEffect: "not-additive; not a 45th lesson; canonical 59 placements retained",
    },
    dependencies: dependencyReview,
    audio,
    licenseBoundary: {
      tools: [
        {name: "FFDec/JPEXS", license: "GPL-3.0-only", status: "review-required-before-product-bundle"},
        {name: "swfmill", license: "GPL-2.0-or-later", status: "review-required-before-product-bundle"},
        {name: "Next2D", license: "MIT", status: "structural-cross-check-only"},
        {name: "OpenFL", license: "MIT", status: "structural-cross-check-only"},
      ],
      productBundleAdmission: "blocked-pending-reviewed-license-boundary",
      reviewerId: null,
    },
    calibration: {
      expectedPageCount: 16,
      structuralReportPath: structural ? tokenPath(structuralPath) : null,
      structuralStatus: structural?.status ?? "missing",
      structuralOnly: structural?.summary?.structuralOnly ?? true,
      auditedPlacementCount: structural?.summary?.auditedPlacementCount ?? 0,
      placements: calibrationPlacements,
      currentJavaScriptRegisteredCount: 0,
      manualReviewCompleted: false,
      behaviorFirstEvidenceStatus: "not-performed-by-automation",
      scaleOutDecision: "NO-GO-scale-out",
      reason: "Structural audit classified all 16 sentinels conservatively; no maintained adapter, original-runtime trace, or independent manual behavior review is present.",
      acceptanceEffects: {...ALL_FALSE},
    },
    overallStatus: "blocked-at-external-human-authority-gates",
    acceptanceEffects: {...ALL_FALSE},
    limitations: [
      "This packet is a machine-generated review queue, not a source-choice decision, CCSS authority receipt, audio acceptance, human review, Owner acceptance, or release ledger.",
      "No generated JavaScript renderer, registry entry, descriptor, navigation entry, or learner href is created by this command.",
      "Automation, Codex, and CI cannot fill reviewerId, selectedSource, resolvedSource, or approval fields.",
    ],
  };
}

export async function run(options) {
  const packet = await buildPacket(options);
  const bytes = stableJson(packet);
  const output = options.output ? resolveProject(options.output) : null;
  if (output && options.mode === "write") await writeNoReplace(output, bytes);
  if (output && options.mode === "check") invariant((await readFile(output, "utf8")) === bytes, `review packet drift: ${output}`);
  return {status: packet.overallStatus, output: options.output ?? null, summary: {conflicts: packet.conflicts.records.length, geoAlternatePages: packet.geoAlternate.records.length, dependencyHolds: packet.dependencies.holdCount, audioGroupedFqEaCandidates: packet.audio.groupedFqEaCandidates}};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log("Usage: node scripts/build-g678-review-packet.mjs --write --source-root <root> --output <file>");
    else console.log(stableJson(await run(options)));
  } catch (error) {
    console.error(stableJson({status: "error", message: error.message}));
    process.exitCode = 1;
  }
}
