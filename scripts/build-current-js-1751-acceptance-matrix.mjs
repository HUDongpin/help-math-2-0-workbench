#!/usr/bin/env node

/**
 * Build an acceptance-neutral inventory for the Owner-approved 1,751 active
 * Grade 3–5 lesson-page occurrences.  This report is deliberately a matrix of
 * evidence availability and gate state; it never changes migration status and
 * never promotes machine evidence into fidelity, audio, human, or Owner
 * acceptance.
 *
 * Run with:
 *   node --import tsx scripts/build-current-js-1751-acceptance-matrix.mjs
 *   node --import tsx scripts/build-current-js-1751-acceptance-matrix.mjs --check
 */

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {wholeLessonCourseRegistrations} from "../apps/web/lib/whole-lesson-course-registry.ts";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const lessonsPath = "catalog/lessons.json";
const animationsPath = "catalog/animations.jsonl";
const jsonOutput = "reports/current-js-1751-acceptance-matrix.json";
const markdownOutput = "reports/current-js-1751-acceptance-matrix.md";
const EXPECTED_PAGE_COUNT = 1751;
const EXPECTED_LESSON_COUNT = 29;
const SHA256 = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function relativeProject(filePath) {
  const relative = portable(path.relative(projectRoot, filePath));
  if (!relative || relative.startsWith("../") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes project root: ${filePath}`);
  }
  return relative;
}

async function readJson(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

async function optionalJson(relativePath) {
  try {
    return (await readJson(relativePath)).value;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function parseAttribute(tag, name) {
  const match = new RegExp(`\\b${name}="([^"]*)"`, "i").exec(tag);
  return match ? match[1] : null;
}

function parseActivePageOccurrences(xmlText, lesson) {
  const activeXml = xmlText.replace(/<!--[\s\S]*?-->/g, "");
  const rows = [];
  const sectionExpression = /<Section\b([^>]*)>([\s\S]*?)<\/Section>/gi;
  let sectionMatch;
  while ((sectionMatch = sectionExpression.exec(activeXml))) {
    const sectionAttributes = sectionMatch[1];
    const sectionBody = sectionMatch[2];
    const sectionCode = parseAttribute(sectionAttributes, "SName");
    if (!sectionCode) throw new Error(`${lesson.path}: active Section has no SName`);
    const pageExpression = /<Page\b([^>]*)>([^<]+?\.swf)<\/Page>/gi;
    let pageMatch;
    let sectionOrdinal = 0;
    while ((pageMatch = pageExpression.exec(sectionBody))) {
      sectionOrdinal += 1;
      const relativePage = pageMatch[2].trim().replaceAll("\\", "/");
      const sourcePath = portable(path.posix.normalize(path.posix.join(lesson.pageRoot, relativePage)));
      rows.push({
        grade: lesson.grade,
        lesson: lesson.lesson,
        sourceXmlPath: lesson.path,
        lessonTitle: lesson.titleDisplay,
        sectionCode,
        sectionPageOrdinal: sectionOrdinal,
        sourcePath,
        title: parseAttribute(pageMatch[1], "Title"),
        randomAudio: parseAttribute(pageMatch[1], "RandomAudio") === "Yes",
      });
    }
  }
  return rows;
}

function buildCatalogMaps(animationsDocument) {
  const bySourcePath = new Map();
  for (const line of animationsDocument.trim().split("\n")) {
    if (!line.trim()) continue;
    const item = JSON.parse(line);
    const sourcePath = item.source?.path;
    if (!sourcePath) continue;
    const candidate = {
      animationId: item.animationId,
      canonicalAnimationId: item.canonicalAnimationId || item.animationId,
      assetId: item.assetId || null,
      sourceSha256: item.source?.sha256 || null,
      sourceBytes: item.source?.bytes || null,
      audioExactCount: item.audio?.exact?.length || 0,
      audioGroupCount: item.audio?.groupIds?.length || 0,
    };
    const existing = bySourcePath.get(sourcePath);
    if (!existing || item.isCanonical === true) bySourcePath.set(sourcePath, candidate);
  }
  return bySourcePath;
}

function registryMaps() {
  const byAnimationId = new Map();
  const occurrences = [];
  for (const registration of wholeLessonCourseRegistrations()) {
    const descriptor = registration.descriptor;
    for (const page of descriptor.pages) {
      occurrences.push({
        grade: descriptor.course.grade,
        lesson: descriptor.course.lesson,
        animationId: page.animationId,
        placementId: page.placementId || page.animationId,
        ordinal: page.globalPageOrdinal,
      });
      byAnimationId.set(page.animationId, (byAnimationId.get(page.animationId) || 0) + 1);
    }
  }
  return {byAnimationId, occurrences};
}

function gateDecision(manifest, key) {
  return manifest?.acceptance?.[key]?.decision || "missing";
}

function currentSwfMachineAudit(audit, sourceSha256) {
  return Boolean(
    audit &&
    audit.source?.expectedSha256 === sourceSha256 &&
    audit.source?.observedSha256Before === sourceSha256 &&
    audit.source?.observedSha256After === sourceSha256 &&
    audit.source?.hashMatches === true &&
    audit.migrationStatusUnchanged === true,
  );
}

function currentAudioMachineAudit(audit, sourceSha256) {
  return Boolean(
    audit &&
    audit.source?.expectedSha256 === sourceSha256 &&
    audit.source?.observedSha256 === sourceSha256 &&
    audit.source?.hashMatches === true &&
    audit.migrationStatusUnchanged === true,
  );
}

function rowDisposition(row) {
  if (!row.currentJsRegistered) return "unregistered-current-js";
  if (!row.workspaceExists) return "registered-without-migration-workspace";
  if (!row.swfMachineAuditCurrent) return "machine-swf-audit-missing-or-stale";
  if (!row.audioMachineAuditCurrent) return "machine-audio-audit-missing-or-stale";
  if (row.fullFrameCoverageComplete && row.humanVisualReview === "accepted" && row.audioReview === "accepted") {
    return "human-and-audio-review-pending-owner-or-strict-gates";
  }
  return "machine-evidence-present-acceptance-pending";
}

export async function buildMatrix() {
  const [lessonsDocument, animationsDocument] = await Promise.all([
    readJson(lessonsPath),
    readFile(path.join(projectRoot, animationsPath), "utf8"),
  ]);
  const lessons = lessonsDocument.value.lessons.filter((lesson) => lesson.grade >= 3 && lesson.grade <= 5);
  if (lessons.length !== EXPECTED_LESSON_COUNT) throw new Error(`Expected ${EXPECTED_LESSON_COUNT} G3–G5 lessons, found ${lessons.length}`);
  const catalog = buildCatalogMaps(animationsDocument);
  const registry = registryMaps();
  const rows = [];
  for (const lesson of lessons) {
    const xml = await readFile(path.join(projectRoot, "source-assets/flash/HELP MATH_ORIGINAL FILES", lesson.path), "utf8");
    const occurrences = parseActivePageOccurrences(xml, lesson);
    if (occurrences.length !== lesson.pageReferenceCount) {
      throw new Error(`${lesson.path}: parsed ${occurrences.length} active pages, catalog declares ${lesson.pageReferenceCount}`);
    }
    for (const occurrence of occurrences) {
      const catalogItem = catalog.get(occurrence.sourcePath) || null;
      const animationId = catalogItem?.canonicalAnimationId || null;
      const registered = animationId ? registry.byAnimationId.has(animationId) : false;
      const workspaceRelative = animationId ? `migrations/${animationId}` : null;
      const manifest = animationId ? await optionalJson(`${workspaceRelative}/migration.json`) : null;
      const swfAudit = animationId ? await optionalJson(`${workspaceRelative}/audit/machine/report.json`) : null;
      const audioAudit = animationId ? await optionalJson(`${workspaceRelative}/audit/audio-runtime-evidence.json`) : null;
      const captureAdoption = animationId
        ? await optionalJson(`${workspaceRelative}/evidence/current-javascript-implementation-capture-adoption.json`)
        : null;
      const fullFrameEvidence = manifest?.evidence?.fullFrameCoverageFile
        ? await optionalJson(`${workspaceRelative}/${manifest.evidence.fullFrameCoverageFile}`)
        : null;
      const fullFrame = fullFrameEvidence?.status === "complete";
      const sourceExists = Boolean(catalogItem?.sourceSha256 && SHA256.test(catalogItem.sourceSha256));
      const row = {
        ordinal: rows.length + 1,
        grade: occurrence.grade,
        lesson: occurrence.lesson,
        lessonTitle: occurrence.lessonTitle,
        sectionCode: occurrence.sectionCode,
        sectionPageOrdinal: occurrence.sectionPageOrdinal,
        sourceXmlPath: occurrence.sourceXmlPath,
        sourcePath: occurrence.sourcePath,
        title: occurrence.title,
        randomAudio: occurrence.randomAudio,
        animationId,
        assetId: catalogItem?.assetId || null,
        sourceSha256: catalogItem?.sourceSha256 || null,
        sourceBytes: catalogItem?.sourceBytes || null,
        sourceCatalogMatch: sourceExists,
        currentJsRegistered: registered,
        currentJsRegistrationCount: animationId ? registry.byAnimationId.get(animationId) || 0 : 0,
        workspaceExists: Boolean(manifest),
        swfMachineAuditCurrent: currentSwfMachineAudit(swfAudit, catalogItem?.sourceSha256),
        audioMachineAuditCurrent: currentAudioMachineAudit(audioAudit, catalogItem?.sourceSha256),
        implementationCaptureStatus: captureAdoption?.status || "missing",
        implementationCaptureRequirementCount: captureAdoption?.summary?.requirementCount || 0,
        implementationCaptureFrameCount: captureAdoption?.summary?.capturedFrameCount || 0,
        fullFrameCoverageFilePresent: Boolean(fullFrameEvidence),
        fullFrameRequirementCount: Array.isArray(fullFrameEvidence?.requirements) ? fullFrameEvidence.requirements.length : 0,
        fullFrameCoverageComplete: fullFrame,
        humanVisualReview: gateDecision(manifest, "humanVisualReview"),
        audioReview: manifest?.audio?.acceptance?.decision || gateDecision(manifest, "audioReview"),
        ownerReview: gateDecision(manifest, "ownerReview"),
        originalRuntimeAuthority: manifest?.baseline?.authority || "missing",
      };
      row.fidelityAccepted = false;
      row.audioAccepted = false;
      row.humanVisualAccepted = row.humanVisualReview === "accepted";
      row.ownerAccepted = row.ownerReview === "accepted";
      row.disposition = rowDisposition(row);
      rows.push(row);
    }
  }
  if (rows.length !== EXPECTED_PAGE_COUNT) throw new Error(`Expected ${EXPECTED_PAGE_COUNT} active page occurrences, found ${rows.length}`);
  const count = (predicate) => rows.filter(predicate).length;
  const byLesson = {};
  for (const row of rows) {
    const key = `G${row.grade}L${row.lesson}`;
    byLesson[key] ||= {pages: 0, currentJsRegistered: 0, workspace: 0, swfMachine: 0, audioMachine: 0, fullFrame: 0, human: 0, audioReview: 0, owner: 0};
    const bucket = byLesson[key];
    bucket.pages += 1;
    if (row.currentJsRegistered) bucket.currentJsRegistered += 1;
    if (row.workspaceExists) bucket.workspace += 1;
    if (row.swfMachineAuditCurrent) bucket.swfMachine += 1;
    if (row.audioMachineAuditCurrent) bucket.audioMachine += 1;
    if (row.fullFrameCoverageComplete) bucket.fullFrame += 1;
    if (row.humanVisualAccepted) bucket.human += 1;
    if (row.audioAccepted) bucket.audioReview += 1;
    if (row.ownerAccepted) bucket.owner += 1;
  }
  const summary = {
    activePageOccurrences: rows.length,
    uniqueAnimationIds: new Set(rows.map((row) => row.animationId).filter(Boolean)).size,
    currentJsRegisteredOccurrences: count((row) => row.currentJsRegistered),
    currentJsRegisteredUniqueAnimations: new Set(rows.filter((row) => row.currentJsRegistered).map((row) => row.animationId)).size,
    unregisteredOccurrences: count((row) => !row.currentJsRegistered),
    sourceCatalogMatches: count((row) => row.sourceCatalogMatch),
    migrationWorkspaces: count((row) => row.workspaceExists),
    currentSwfMachineAudits: count((row) => row.swfMachineAuditCurrent),
    currentAudioMachineAudits: count((row) => row.audioMachineAuditCurrent),
    fullFrameCoverageFiles: count((row) => row.fullFrameCoverageFilePresent),
    fullFrameCoverageRequirements: rows.reduce((sum, row) => sum + row.fullFrameRequirementCount, 0),
    currentJsRegisteredFullFrameCoverageFiles: count((row) => row.currentJsRegistered && row.fullFrameCoverageFilePresent),
    currentJsRegisteredFullFrameCoverageRequirements: rows.reduce((sum, row) => sum + (row.currentJsRegistered ? row.fullFrameRequirementCount : 0), 0),
    currentJsRegisteredWorkspaces: count((row) => row.currentJsRegistered && row.workspaceExists),
    currentJsRegisteredSwfMachineAudits: count((row) => row.currentJsRegistered && row.swfMachineAuditCurrent),
    currentJsRegisteredAudioMachineAudits: count((row) => row.currentJsRegistered && row.audioMachineAuditCurrent),
    implementationCaptureAdoptionFiles: count((row) => row.implementationCaptureStatus !== "missing"),
    implementationCaptureAdoptedRequirements: rows.reduce((sum, row) => sum + row.implementationCaptureRequirementCount, 0),
    implementationCaptureAdoptedFrames: rows.reduce((sum, row) => sum + row.implementationCaptureFrameCount, 0),
    currentJsRegisteredImplementationCaptureAdoptionFiles: count((row) => row.currentJsRegistered && row.implementationCaptureStatus !== "missing"),
    currentJsRegisteredImplementationCaptureRequirements: rows.reduce((sum, row) => sum + (row.currentJsRegistered ? row.implementationCaptureRequirementCount : 0), 0),
    currentJsRegisteredImplementationCaptureFrames: rows.reduce((sum, row) => sum + (row.currentJsRegistered ? row.implementationCaptureFrameCount : 0), 0),
    authoritativeOriginalRuntime: count((row) => row.originalRuntimeAuthority === "authoritative-standalone-runtime-baseline"),
    fullFrameCoverageComplete: count((row) => row.fullFrameCoverageComplete),
    fidelityAccepted: count((row) => row.fidelityAccepted),
    audioAccepted: count((row) => row.audioAccepted),
    humanVisualAccepted: count((row) => row.humanVisualAccepted),
    ownerAccepted: count((row) => row.ownerAccepted),
    dispositions: Object.fromEntries([...new Set(rows.map((row) => row.disposition))].sort().map((key) => [key, count((row) => row.disposition === key)])),
  };
  const source = {
    lessons: {path: lessonsPath, sha256: sha256(lessonsDocument.bytes)},
    animations: {path: animationsPath, sha256: sha256(animationsDocument)},
    scope: "Owner-approved page-only active lesson-page occurrences; legacy Flash course shells excluded",
  };
  const matrix = {
    schemaVersion: 1,
    artifactType: "current-js-1751-acceptance-matrix",
    authority: "acceptance-neutral evidence inventory; no gate or migration status changes",
    scope: {
      grades: [3, 4, 5],
      lessonCount: EXPECTED_LESSON_COUNT,
      activePageOccurrences: EXPECTED_PAGE_COUNT,
      legacyFlashCourseShellExcluded: true,
      currentJavascriptScope: "registered page renderers only; unregistered rows remain explicit blockers",
    },
    acceptanceEffects: {
      currentJavaScriptRegistration: false,
      originalRuntimeAuthority: false,
      fidelity: false,
      audio: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictCompletion: false,
      publication: false,
    },
    source,
    summary,
    byLesson,
    rows,
  };
  matrix.generatedMarker = `sha256:${sha256(stableJson(matrix))}`;
  return matrix;
}

export function renderMarkdown(matrix) {
  const lines = [
    "# HELP Math 2.0 — Current-JS 1,751 页验收矩阵",
    "",
    "> This generated report is acceptance-neutral. Machine evidence does not establish original-runtime fidelity, audio acceptance, human visual review, Owner acceptance, strict completion, or publication.",
    "",
    `- Matrix marker: \`${matrix.generatedMarker}\``,
    `- Active page occurrences: **${matrix.summary.activePageOccurrences}**`,
    `- Current-JS registered occurrences: **${matrix.summary.currentJsRegisteredOccurrences}**`,
    `- Current-JS registered unique animations: **${matrix.summary.currentJsRegisteredUniqueAnimations}**`,
    `- Unregistered occurrences: **${matrix.summary.unregisteredOccurrences}**`,
    `- Current SWF machine audits: **${matrix.summary.currentSwfMachineAudits}**`,
    `- Current audio machine audits: **${matrix.summary.currentAudioMachineAudits}**`,
    `- Current-JS registered rows with current SWF/audio machine audits: **${matrix.summary.currentJsRegisteredSwfMachineAudits}/${matrix.summary.currentJsRegisteredAudioMachineAudits}**`,
    `- Current-JS registered implementation captures adopted: **${matrix.summary.currentJsRegisteredImplementationCaptureAdoptionFiles} files / ${matrix.summary.currentJsRegisteredImplementationCaptureRequirements} requirements / ${matrix.summary.currentJsRegisteredImplementationCaptureFrames} frames** (non-authoritative)`,
    `- Full-frame coverage files/declared requirements: **${matrix.summary.fullFrameCoverageFiles}/${matrix.summary.fullFrameCoverageRequirements}** (none complete)`,
    `- Current-JS registered full-frame coverage files/declared requirements: **${matrix.summary.currentJsRegisteredFullFrameCoverageFiles}/${matrix.summary.currentJsRegisteredFullFrameCoverageRequirements}** (none complete)`,
    `- Full-frame complete: **${matrix.summary.fullFrameCoverageComplete}**`,
    `- Fidelity accepted: **${matrix.summary.fidelityAccepted}**`,
    `- Audio accepted: **${matrix.summary.audioAccepted}**`,
    `- Human visual accepted: **${matrix.summary.humanVisualAccepted}**`,
    `- Owner accepted: **${matrix.summary.ownerAccepted}**`,
    "",
    "## Per-lesson counts",
    "",
    "| Lesson | Pages | Current-JS | Workspace | SWF machine | Audio machine | Full-frame | Human | Audio review | Owner |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const [lesson, counts] of Object.entries(matrix.byLesson)) {
    lines.push(`| ${lesson} | ${counts.pages} | ${counts.currentJsRegistered} | ${counts.workspace} | ${counts.swfMachine} | ${counts.audioMachine} | ${counts.fullFrame} | ${counts.human} | ${counts.audioReview} | ${counts.owner} |`);
  }
  lines.push("", "## Gate interpretation", "", "The JSON file contains one row per source-ordered active page occurrence, including source path/hash, registry binding, workspace and machine-evidence state, and acceptance decisions. A row with `machine-evidence-present-acceptance-pending` is not fidelity-complete; it still requires authoritative original-runtime evidence, formal comparison, listening/interaction review, and named human/Owner decisions under the project runbook.", "");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const check = process.argv.includes("--check");
  const matrix = await buildMatrix();
  const json = stableJson(matrix);
  const markdown = renderMarkdown(matrix);
  const [currentJson, currentMarkdown] = await Promise.all([
    readFile(path.join(projectRoot, jsonOutput), "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(projectRoot, markdownOutput), "utf8").catch((error) => error.code === "ENOENT" ? null : Promise.reject(error)),
  ]);
  if (check) {
    if (currentJson !== json || currentMarkdown !== markdown) throw new Error("Current-JS 1,751 acceptance matrix is stale; rerun without --check");
    console.log(`CHECK ${jsonOutput}`);
    console.log(`CHECK ${markdownOutput}`);
    console.log(JSON.stringify(matrix.summary));
    return;
  }
  await writeFile(path.join(projectRoot, jsonOutput), json, {encoding: "utf8"});
  await writeFile(path.join(projectRoot, markdownOutput), markdown, {encoding: "utf8"});
  console.log(`WROTE ${jsonOutput}`);
  console.log(`WROTE ${markdownOutput}`);
  console.log(JSON.stringify(matrix.summary));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
