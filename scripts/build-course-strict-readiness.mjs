#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateLessonReleases } from "./build-lesson-release-ledger.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(defaultProjectRoot, "migrations");
const defaultToolchainPath = path.join(defaultProjectRoot, "catalog", "toolchain.json");
const defaultProbeRoot = path.join(defaultProjectRoot, "work", "animate", "jsfl-cli-probes");
const defaultLessonReleasesPath = path.join(defaultProjectRoot, "catalog", "lesson-releases.json");
const canonicalCourseSourcePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const verifiedReleaseContext = Symbol("verifiedReleaseContext");

export const COURSE_STRICT_READINESS_SCHEMA_VERSION = 2;
export const COURSE_STRICT_READINESS_GENERATOR_VERSION = "1.3.0";

export const COURSE_STRICT_READINESS_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-fq-002-review",
  "course-g03-l06-ti-001",
  "course-g03-l08-re-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "shell-course-g04-l01-index-local",
]);

const PROFILE = Object.freeze({
  "course-g03-l01-ts-008": {
    risk: "critical",
    observedBehavior: [
      "72 release handlers include multiple quiz answer buttons and many glossary/hyperlink terms.",
      "Correct/wrong feedback, popup, retry-count, forced continuation, and parent playback all depend on _root/_global shell state.",
      "The SWF contains 30 DefineButton2 tags, 52 morph definitions, 1,200 nested ShowFrame tags, and extensive embedded streaming audio.",
    ],
    requiredScenarios: [
      "every test question state",
      "correct response for every question",
      "first and second incorrect responses for every question",
      "popup and every glossary/hyperlink activation",
      "completion and Replay",
    ],
  },
  "course-g03-l01-vb-004": {
    risk: "high",
    observedBehavior: [
      "16 on(release) handlers include four glossary/hyperlink terms and correct/wrong quiz feedback.",
      "Quiz flow uses _global.quizTryCount, _global.quizSection, parent playback, and _root feedback/reporting helpers.",
      "Nested timelines contain quiz stops and feedback animations; 56 morph definitions materially affect visual fidelity.",
    ],
    requiredScenarios: [
      "linear teaching sequence",
      "each of four glossary/hyperlink activations",
      "correct response",
      "first incorrect response and retry",
      "second incorrect response and forced continuation",
      "terminal and Replay",
    ],
  },
  "course-g03-l06-fq-002-review": {
    risk: "critical",
    observedBehavior: [
      "The source defines 31 question labels and randomly selects ten without replacement before generating score/result/review state.",
      "258 release handlers and 388 edit-text definitions encode a large assessment state space.",
      "Review depends on _global arrays populated by the preceding quiz; reporting builds a legacy getURL request containing student/class/lesson/result data.",
      "The catalog audio group has bilingual question/answer MP3s but is not yet mapped to exact review scenes or cue frames.",
    ],
    requiredScenarios: [
      "all Q1-Q31 question scenes under deterministic seeds",
      "all response options and correct/wrong outcomes",
      "ten-question score/result terminal states",
      "all R1-R31 review scenes populated from controlled quiz fixtures",
      "reporting-disabled completion and Replay",
    ],
  },
  "course-g03-l06-ti-001": {
    risk: "high",
    observedBehavior: [
      "A nested 142-frame sound timeline randomly selects one of two sound clips.",
      "The root timeline depends on _level0.InternalPreloader; exported component code includes scroll-bar state and input handlers.",
      "No paired FLA exists, so symbol names and authoring structure are recoverable only from the shipped SWF.",
    ],
    requiredScenarios: [
      "both random sound selections under fixed seeds",
      "all scroll/component states that are visible at runtime",
      "terminal and Replay",
    ],
  },
  "course-g03-l08-re-001": {
    risk: "critical",
    observedBehavior: [
      "Review reconstructs correct, wrong, response, question, and review arrays by splitting _global.REVIEWANS from a prior assessment.",
      "Navigation chooses review labels from _global.arrayReview and exposes a javascript:history.back() button.",
      "The SWF has no embedded or exact-associated audio, but absence cannot be accepted until authoritative runtime/FLA evidence confirms it.",
    ],
    requiredScenarios: [
      "fixture for every review label referenced by prior assessment state",
      "correct/wrong/selected-answer rendering for each review item",
      "previous/back behavior rebuilt without javascript URL execution",
      "terminal and Replay",
    ],
  },
  "course-g04-l01-ir-001": {
    risk: "high",
    observedBehavior: [
      "A nested 142-frame sound timeline randomly selects one of two sound clips.",
      "The root timeline depends on _level0.InternalPreloader; exported component code includes scroll-bar state and input handlers.",
      "Embedded streaming audio is present even though the catalog found no external MP3 association.",
    ],
    requiredScenarios: [
      "both random sound selections under fixed seeds",
      "all scroll/component states that are visible at runtime",
      "terminal and Replay",
    ],
  },
  "course-g04-l03-in-009": {
    risk: "high",
    observedBehavior: [
      "Two on(release) handlers open glossary/hyperlink terms through _root.DoHyperLinks and stop the child animation.",
      "The apparent ten-frame root shell contains 982 nested ShowFrame tags and four morph definitions.",
      "Embedded streaming audio and one external catalog-associated MP3 both require cue/language reconciliation.",
    ],
    requiredScenarios: [
      "linear teaching sequence",
      "Temperature glossary/hyperlink activation",
      "Measure glossary/hyperlink activation",
      "terminal and Replay",
    ],
  },
  "course-g04-l09-gs-002": {
    risk: "critical",
    observedBehavior: [
      "Game logic randomly draws without replacement from ten Q labels and reaches Final after eight correct selections.",
      "At least 26 release handlers implement start/repeat, popup, glossary, correct, wrong, and continuation behavior.",
      "Scoring uses _global.correctSelect, quizLabelArray, quizCorrectLabelArray, counting, and parent/root feedback helpers.",
      "Eleven edit-text definitions, 15 morph definitions, and 1,457 streaming-audio blocks raise visual and audio risk.",
    ],
    requiredScenarios: [
      "start and repeat flows",
      "all Q1-Q10 question scenes under deterministic seeds",
      "correct and wrong response for every question",
      "popup open/close and glossary activations",
      "eight-correct terminal path and Replay",
    ],
  },
  "course-g05-l13-rw-002": {
    risk: "high",
    observedBehavior: [
      "A press handler starts playback and a nested timeline stops at frame 673 before toggling _global.quizSection.",
      "The apparent ten-frame root shell contains 1,929 nested ShowFrame tags and 11 morph definitions.",
      "Embedded streaming audio and one external catalog-associated MP3 both require cue/language reconciliation.",
    ],
    requiredScenarios: [
      "initial stopped state",
      "press-to-play state",
      "quiz-section boundary at nested frames 673-674",
      "terminal and Replay",
    ],
  },
  "shell-course-g04-l01-index-local": {
    risk: "critical",
    observedBehavior: [
      "The course shell contains 600 exported scripts, 121 button definitions, 707 conditional branches, 344 unconditional branches, 165 frame labels, and drag/keyboard handlers.",
      "It loads child lesson SWFs, manages eight course sections, audio controls, glossary/calculator UI, back/next history, random state, and quiz state.",
      "Legacy candidates include SharedObject, fscommand, getURL, and loadMovie; scripts also build reporting/bookmark URLs and close-window JavaScript.",
      "The local Ruffle route intentionally denies networking and script access, so ready status covers only initial load, not original navigation behavior.",
    ],
    requiredScenarios: [
      "all eight section menus and every active lesson placement",
      "next/back/history and direct page selection",
      "English/Spanish audio controls, volume, pause, and replay",
      "glossary, calculator, popup, drag, and keyboard states",
      "quiz/reporting completion with all legacy network side effects replaced by inert fixtures",
      "terminal/close behavior rebuilt as native Next.js navigation",
    ],
  },
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(value || "");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(candidate);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function readJsonRecord(candidate, projectRoot) {
  const bytes = await readFile(candidate);
  return {
    path: portable(path.relative(projectRoot, candidate)),
    sha256: sha256Bytes(bytes),
    bytes,
    value: JSON.parse(bytes.toString("utf8")),
  };
}

function resolveProjectPath(projectRoot, workspace, candidate) {
  invariant(typeof candidate === "string" && candidate.length > 0, "evidence path is empty");
  if (path.isAbsolute(candidate)) return candidate;
  if (!candidate.includes("/") || candidate.startsWith("audit/") || candidate.startsWith("baseline/") || candidate.startsWith("evidence/")) {
    return path.join(workspace, candidate);
  }
  return path.join(projectRoot, candidate);
}

async function verifyPinnedFile({ projectRoot, workspace, candidate, expectedSha256, label }) {
  invariant(isSha256(expectedSha256), `${label}: invalid SHA-256`);
  const resolved = resolveProjectPath(projectRoot, workspace, candidate);
  const observed = await sha256File(resolved);
  invariant(observed === expectedSha256, `${label}: hash mismatch for ${candidate}`);
  return { path: candidate, sha256: observed };
}

function parsePngHeader(bytes, label) {
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `${label}: invalid PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function verifyMachineReport({ projectRoot, workspace, manifest, record }) {
  const report = record.value;
  const id = manifest.animationId;
  invariant(report.schemaVersion === 1, `${id}: unsupported machine report schema`);
  invariant(report.animationId === id, `${id}: machine report identity mismatch`);
  invariant(report.auditStatus === "partial", `${id}: machine audit must remain partial`);
  invariant(report.migrationStatusUnchanged === true, `${id}: machine report changed migration status`);
  invariant(report.source?.path === manifest.source.swf, `${id}: machine report SWF path mismatch`);
  invariant(report.source?.expectedSha256 === manifest.source.swfSha256, `${id}: machine report SWF hash mismatch`);
  invariant(report.source?.observedSha256Before === report.source.expectedSha256, `${id}: machine report pre-audit SWF hash mismatch`);
  invariant(report.source?.observedSha256After === report.source.expectedSha256, `${id}: machine report post-audit SWF hash mismatch`);
  invariant(report.source?.hashMatches === true, `${id}: machine report source verification failed`);
  await verifyPinnedFile({
    projectRoot,
    workspace,
    candidate: report.source.path,
    expectedSha256: report.source.expectedSha256,
    label: `${id}: source SWF`,
  });

  if (manifest.source.fla) {
    invariant(report.authoringSource?.path === manifest.source.fla, `${id}: machine report FLA path mismatch`);
    invariant(report.authoringSource?.expectedSha256 === manifest.source.flaSha256, `${id}: machine report FLA hash mismatch`);
    invariant(report.authoringSource?.observedSha256Before === report.authoringSource.expectedSha256, `${id}: machine report pre-audit FLA hash mismatch`);
    invariant(report.authoringSource?.observedSha256After === report.authoringSource.expectedSha256, `${id}: machine report post-audit FLA hash mismatch`);
    invariant(report.authoringSource?.hashMatches === true, `${id}: machine report FLA verification failed`);
    invariant(report.authoringSource?.inspectionStatus === "not-performed-by-this-script", `${id}: machine report may not promote authoring inspection`);
    await verifyPinnedFile({
      projectRoot,
      workspace,
      candidate: report.authoringSource.path,
      expectedSha256: report.authoringSource.expectedSha256,
      label: `${id}: source FLA`,
    });
  } else {
    invariant(report.authoringSource?.pairedFlaStatus === "missing", `${id}: machine report FLA availability mismatch`);
  }

  invariant(Array.isArray(report.outputs) && report.outputs.length > 0, `${id}: machine report outputs are missing`);
  for (const output of report.outputs) {
    const verified = await verifyPinnedFile({
      projectRoot,
      workspace,
      candidate: output.path,
      expectedSha256: output.sha256,
      label: `${id}: machine output`,
    });
    if (Number.isInteger(output.bytes)) {
      const outputStat = await stat(resolveProjectPath(projectRoot, workspace, verified.path));
      invariant(outputStat.size === output.bytes, `${id}: machine output byte count mismatch for ${output.path}`);
    }
    if (output.uncompressedSha256) {
      invariant(isSha256(output.uncompressedSha256), `${id}: invalid uncompressed output hash for ${output.path}`);
      const compressed = await readFile(resolveProjectPath(projectRoot, workspace, verified.path));
      const uncompressed = gunzipSync(compressed);
      invariant(sha256Bytes(uncompressed) === output.uncompressedSha256, `${id}: uncompressed hash mismatch for ${output.path}`);
      invariant(uncompressed.length === output.uncompressedBytes, `${id}: uncompressed byte count mismatch for ${output.path}`);
    }
  }

  const findings = report.findings;
  invariant(findings?.runtimeCrossCheck?.allMatch === true, `${id}: machine runtime cross-check failed`);
  invariant(findings.ffdecHeader?.frameRate === 12, `${id}: machine FPS is not 12`);
  invariant(findings.ffdecHeader?.frameCount >= 1, `${id}: machine root frame count is invalid`);
  return report;
}

async function verifyStructuralBaseline({ projectRoot, workspace, manifest, machine, record, allowDeclaredRasterization = false }) {
  const baseline = record.value;
  const id = manifest.animationId;
  const header = machine.findings.ffdecHeader;
  invariant(baseline.schemaVersion === 1, `${id}: unsupported structural baseline schema`);
  invariant(baseline.animationId === id, `${id}: structural baseline identity mismatch`);
  invariant(baseline.status === "structural-baseline-only", `${id}: structural baseline status was promoted`);
  invariant(baseline.source?.swf === manifest.source.swf, `${id}: structural baseline SWF path mismatch`);
  invariant(baseline.source?.swfSha256 === manifest.source.swfSha256, `${id}: structural baseline source hash mismatch`);
  invariant(baseline.runtime?.stage?.width === header.widthPx && baseline.runtime?.stage?.height === header.heightPx, `${id}: structural baseline stage mismatch`);
  invariant(baseline.runtime?.fps === header.frameRate, `${id}: structural baseline FPS mismatch`);
  invariant(baseline.runtime?.frameCount === header.frameCount, `${id}: structural baseline root frame count mismatch`);
  invariant(Array.isArray(baseline.frames) && baseline.frames.length === header.frameCount, `${id}: structural baseline coverage is incomplete`);

  let expectedRasterWidth = header.widthPx;
  let expectedRasterHeight = header.heightPx;
  const rasterization = baseline.runtime.rasterization;
  if (rasterization) {
    invariant(allowDeclaredRasterization, `${id}: declared structural rasterization is not authorized for this readiness mode`);
    invariant(rasterization?.rule === "ceil-positive-native-stage-dimensions", `${id}: structural baseline rasterization rule is missing or unsupported`);
    invariant(header.widthPx > 0 && header.heightPx > 0, `${id}: native stage dimensions must be positive`);
    expectedRasterWidth = Math.ceil(header.widthPx);
    expectedRasterHeight = Math.ceil(header.heightPx);
    invariant(
      rasterization.width === expectedRasterWidth && rasterization.height === expectedRasterHeight,
      `${id}: structural baseline rasterization dimensions mismatch`,
    );
    invariant(typeof rasterization.rationale === "string" && rasterization.rationale.length > 0, `${id}: structural baseline rasterization rationale is missing`);
  } else if (!Number.isInteger(header.widthPx) || !Number.isInteger(header.heightPx)) {
    invariant(false, `${id}: fractional native stage requires an explicitly authorized rasterization contract`);
  }

  const expectedFrames = Array.from({ length: header.frameCount }, (_, index) => index + 1);
  invariant(JSON.stringify(baseline.frames.map((frame) => frame.frame)) === JSON.stringify(expectedFrames), `${id}: structural baseline frame sequence mismatch`);
  for (const frame of baseline.frames) {
    invariant(/^[1-9][0-9]*\.png$/.test(frame.file || ""), `${id}: invalid structural frame filename`);
    const framePath = path.join(projectRoot, baseline.archive.root, frame.file);
    const bytes = await readFile(framePath);
    invariant(sha256Bytes(bytes) === frame.sha256, `${id}: structural frame hash mismatch for ${frame.file}`);
    invariant(bytes.length === frame.bytes, `${id}: structural frame byte count mismatch for ${frame.file}`);
    const dimensions = parsePngHeader(bytes, `${id}: ${frame.file}`);
    invariant(dimensions.width === frame.width && dimensions.height === frame.height, `${id}: structural frame PNG metadata mismatch for ${frame.file}`);
    invariant(frame.width === expectedRasterWidth && frame.height === expectedRasterHeight, `${id}: structural frame stage mismatch for ${frame.file}`);
  }
  return baseline;
}

async function verifyAudioReport({ projectRoot, workspace, manifest, record }) {
  const audio = record.value;
  const id = manifest.animationId;
  invariant(audio.schemaVersion === 2, `${id}: unsupported audio report schema`);
  invariant(audio.animationId === id, `${id}: audio report identity mismatch`);
  invariant(audio.migrationStatusUnchanged === true, `${id}: audio report changed migration status`);
  invariant(audio.source?.swf === manifest.source.swf, `${id}: audio report SWF path mismatch`);
  invariant(audio.source?.expectedSha256 === manifest.source.swfSha256, `${id}: audio report source hash mismatch`);
  invariant(audio.source?.observedSha256 === audio.source.expectedSha256, `${id}: audio report observed source hash mismatch`);
  invariant(audio.source?.hashMatches === true, `${id}: audio report source verification failed`);

  const inventoryPath = path.join(workspace, audio.inventory?.file || "");
  const inventoryText = await readFile(inventoryPath, "utf8");
  const inventoryRows = inventoryText.trimEnd().split(/\r?\n/).slice(1).filter(Boolean);
  invariant(inventoryRows.length === audio.inventory.rowCount, `${id}: audio inventory row count mismatch`);

  for (const item of audio.externalAudio?.exactAssociations || []) {
    invariant(item.hashMatchesCatalog === true, `${id}: external audio catalog hash mismatch`);
    invariant(item.catalogSha256 === item.observedSha256, `${id}: external audio observed hash mismatch`);
    await verifyPinnedFile({
      projectRoot,
      workspace,
      candidate: item.sourceFile,
      expectedSha256: item.observedSha256,
      label: `${id}: external audio`,
    });
  }
  const hostScript = audio.authority?.hostScript;
  if (hostScript?.sourceFile && hostScript?.sha256) {
    await verifyPinnedFile({ projectRoot, workspace, candidate: hostScript.sourceFile, expectedSha256: hostScript.sha256, label: `${id}: audio host script source` });
  }
  for (const xml of audio.authority?.xmlReferences || []) {
    await verifyPinnedFile({ projectRoot, workspace, candidate: xml.sourceFile, expectedSha256: xml.sha256, label: `${id}: audio XML authority` });
  }
  return { audio, inventoryText };
}

async function verifyProbeResult({ projectRoot, record }) {
  const probe = record.value;
  invariant(probe.schemaVersion === 1, "Animate probe: unsupported schemaVersion");
  invariant(probe.evidenceKind === "adobe-animate-jsfl-cli-probe", "Animate probe: unexpected evidenceKind");
  invariant(probe.status === "passed", "Animate probe: latest selected probe did not pass");
  invariant(probe.scope === "disposable-blank-document", "Animate probe: scope must remain disposable-blank-document");
  invariant(probe.failure == null, "Animate probe: passing result contains a failure");
  invariant(probe.command?.intentionallyOmitsQuitFlag === true, "Animate probe: invocation contract changed");

  await verifyPinnedFile({
    projectRoot,
    workspace: projectRoot,
    candidate: probe.command.executable,
    expectedSha256: probe.command.executableSha256,
    label: "Animate probe executable",
  });
  const pinned = [
    probe.scripts?.auditTemplate,
    probe.scripts?.generatedAudit,
    probe.scripts?.controller,
    probe.process?.stdout,
    probe.process?.stderr,
    probe.artifacts?.marker,
    probe.artifacts?.report,
    probe.artifacts?.png,
  ];
  for (const item of pinned) {
    invariant(item?.file && item?.sha256, "Animate probe: an internally pinned artifact is missing");
    await verifyPinnedFile({ projectRoot, workspace: projectRoot, candidate: item.file, expectedSha256: item.sha256, label: "Animate probe artifact" });
  }
  invariant(probe.process.exitCode === 0 && probe.process.timedOut === false, "Animate probe: process did not complete cleanly");
  return probe;
}

async function findPassingProbe(projectRoot, probeRoot = defaultProbeRoot) {
  let directories;
  try {
    directories = await readdir(probeRoot, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Animate probe evidence is unavailable at ${portable(path.relative(projectRoot, probeRoot))}: ${error.message}`);
  }
  const candidates = directories
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(probeRoot, entry.name, "probe-result.json"))
    .sort((left, right) => left.localeCompare(right, "en"));
  const passing = [];
  for (const candidate of candidates) {
    try {
      const record = await readJsonRecord(candidate, projectRoot);
      if (record.value.status === "passed") passing.push(record);
    } catch {
      // Invalid or incomplete probe runs are retained on disk but cannot be selected.
    }
  }
  invariant(passing.length > 0, "No passing Animate JSFL CLI probe result is available");
  return passing.at(-1);
}

async function verifyToolchain({ projectRoot, toolchainPath, probeRoot }) {
  const toolchainRecord = await readJsonRecord(toolchainPath, projectRoot);
  const toolchain = toolchainRecord.value;
  const authoring = toolchain.authoringEvidence;
  invariant(toolchain.schemaVersion === 1, "toolchain: unsupported schemaVersion");
  invariant(authoring?.adobeAnimateDetected === true, "toolchain: Adobe Animate must be detected");
  invariant(authoring.application === "Adobe Animate 2021", "toolchain: unexpected Adobe Animate application");
  invariant(authoring.productVersion === "21.0.7", "toolchain: unexpected Adobe Animate version");
  const application = await stat(authoring.applicationPath);
  invariant(application.isDirectory(), "toolchain: Adobe Animate application path is not a directory");

  const probeRecord = await findPassingProbe(projectRoot, probeRoot);
  const probe = await verifyProbeResult({ projectRoot, record: probeRecord });
  invariant(probe.artifacts.report.animateVersion.includes("21,0,7"), "toolchain: probe Animate version does not match 21.0.7");
  return { toolchainRecord, toolchain, probeRecord, probe };
}

function interactionSignals(tagCounts) {
  const count = (name) => Number(tagCounts?.[name] || 0);
  return {
    doAction: count("DoAction"),
    doInitAction: count("DoInitAction"),
    defineButton2: count("DefineButton2"),
    eventRecords: count("events"),
    defineEditText: count("DefineEditText"),
    branchIfTrue: count("BranchIfTrue"),
    branchAlways: count("BranchAlways"),
    random: count("Random"),
    startDrag: count("StartDrag"),
    stopDrag: count("StopDrag"),
    stop: count("Stop"),
    play: count("Play"),
    gotoFrame: count("GotoFrame"),
    gotoLabel: count("GotoLabel"),
    frameLabel: count("FrameLabel"),
    defineSprite: count("DefineSprite"),
    defineMorphShape: count("DefineMorphShape"),
    defineFont2: count("DefineFont2"),
  };
}

function canonicalReleaseSourcePath(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath) && !relativePath.split("/").includes(".."),
    `invalid canonical release source path: ${relativePath}`,
  );
  return `${canonicalCourseSourcePrefix}/${relativePath}`;
}

async function resolveReleaseContext(options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const releaseId = options.releaseId;
  invariant(typeof releaseId === "string" && releaseId.length > 0, "--release-id requires a non-empty value");
  const releasesPath = options.lessonReleasesPath || (projectRoot === defaultProjectRoot
    ? defaultLessonReleasesPath
    : path.join(projectRoot, "catalog", "lesson-releases.json"));
  const catalogRecord = await readJsonRecord(releasesPath, projectRoot);
  validateLessonReleases(catalogRecord.value);
  const matches = catalogRecord.value.releases.filter((release) => release.releaseId === releaseId);
  invariant(matches.length === 1, matches.length === 0 ? `unknown lesson release: ${releaseId}` : `duplicate lesson release: ${releaseId}`);
  const release = matches[0];
  invariant(release.releaseType === "complete-lesson", `${releaseId}: strict-readiness requires a complete-lesson release`);
  invariant(release.publicationMode === "atomic", `${releaseId}: strict-readiness requires atomic publication`);
  invariant(release.scope?.excludeNonMembers === true, `${releaseId}: release scope must exclude non-members`);

  const sourceLessonPath = canonicalReleaseSourcePath(release.sourceLesson.path);
  const sourceLesson = await verifyPinnedFile({
    projectRoot,
    workspace: projectRoot,
    candidate: sourceLessonPath,
    expectedSha256: release.sourceLesson.sha256,
    label: `${releaseId}: source lesson`,
  });
  const sourceLessonStat = await stat(path.join(projectRoot, sourceLessonPath));
  invariant(sourceLessonStat.size === release.sourceLesson.bytes, `${releaseId}: source lesson byte count mismatch`);

  return {
    [verifiedReleaseContext]: true,
    catalogRecord,
    release,
    releaseId,
    sourceLesson: { ...sourceLesson, bytes: sourceLessonStat.size },
    membersById: new Map(release.members.map((member) => [member.animationId, member])),
  };
}

function verifyReleaseMemberBinding({ id, manifest, context }) {
  const { release } = context;
  const member = context.membersById.get(id);
  invariant(member, `${id}: not a member of atomic release ${release.releaseId}`);
  const expectedSwf = canonicalReleaseSourcePath(member.source.path);
  invariant(manifest.schemaVersion === 2, `${id}: release-scoped strict-readiness requires migration schemaVersion 2`);
  invariant(manifest.id === id && manifest.animationId === id, `${id}: release/workspace identity mismatch`);
  invariant(manifest.assetId === member.assetId, `${id}: release/workspace assetId mismatch`);
  invariant(manifest.source?.placementPath === expectedSwf, `${id}: release/workspace placement path mismatch`);
  invariant(manifest.source?.swf === expectedSwf, `${id}: release/workspace SWF path mismatch`);
  invariant(manifest.source?.swfSha256 === member.source.sha256, `${id}: release/workspace SWF hash mismatch`);
  invariant(manifest.assetId === `swf-${manifest.source.swfSha256}`, `${id}: workspace assetId is not bound to the SWF hash`);
  invariant(
    manifest.classification?.collection === "course" &&
      manifest.classification.grade === release.grade &&
      manifest.classification.lesson === release.lesson,
    `${id}: workspace classification escapes atomic release scope`,
  );
  invariant((member.releaseRole === "course-shell") === id.startsWith("shell-"), `${id}: release shell role and animationId disagree`);
  return member;
}

function sumSignals(signals, names) {
  return names.reduce((total, name) => total + Number(signals[name] || 0), 0);
}

function deriveReleaseProfile({ member, context, machine, baseline, audio }) {
  const header = machine.findings.ffdecHeader;
  const signals = interactionSignals(machine.findings.swfmill.tagCounts);
  const behaviorSignalCount = Number(machine.findings.swfmill.tagCounts.DefineButton || 0) + sumSignals(signals, [
    "doAction",
    "doInitAction",
    "defineButton2",
    "eventRecords",
    "defineEditText",
    "branchIfTrue",
    "branchAlways",
    "random",
    "startDrag",
    "stopDrag",
    "stop",
    "play",
    "gotoFrame",
    "gotoLabel",
  ]);
  const externalCallCount = Array.isArray(machine.findings.externalCallCandidates) ? machine.findings.externalCallCandidates.length : 0;
  const exactExternalAudioCount = Array.isArray(audio.externalAudio?.exactAssociations) ? audio.externalAudio.exactAssociations.length : 0;
  const embeddedDefineSoundCount = Array.isArray(audio.embeddedAudio?.defineSounds) ? audio.embeddedAudio.defineSounds.length : 0;
  const embeddedStreamCount = Array.isArray(audio.embeddedAudio?.soundStreams) ? audio.embeddedAudio.soundStreams.length : 0;
  const rasterization = baseline.runtime?.rasterization;
  const fractionalNativeStage = !Number.isInteger(header.widthPx) || !Number.isInteger(header.heightPx);
  const rasterizationObservation = rasterization
    ? ` using the explicit ${rasterization.rule} PNG raster ${rasterization.width}x${rasterization.height} ${fractionalNativeStage ? "for the fractional native stage" : "for structural frame export"}`
    : "";
  const isShell = member.releaseRole === "course-shell";
  const risk = isShell || behaviorSignalCount > 0 || externalCallCount > 0 ? "critical" : "high";

  const observedBehavior = [
    `Hash-verified machine evidence reports a ${header.frameCount}-frame root timeline at ${header.frameRate} fps on the native ${header.widthPx}x${header.heightPx} stage, ${machine.findings.swfmill.tagCounts.ShowFrame || 0} nested ShowFrame tags, and ${machine.findings.exportedScriptFileCount} exported script files.`,
    `Hash-verified machine tag counts report ${behaviorSignalCount} conservative ActionScript/interaction-state signals and ${externalCallCount} external-call candidates; these counts do not identify complete runtime semantics.`,
    `Hash-verified structural baseline evidence archives ${baseline.frames.length}/${header.frameCount} root frames${rasterizationObservation}, while hash-verified audio evidence reports ${exactExternalAudioCount} exact external associations, ${embeddedDefineSoundCount} embedded DefineSound records, and ${embeddedStreamCount} embedded stream records.`,
    `Atomic release ${context.release.releaseId} binds this ${member.releaseRole} at ordinal ${member.ordinal}/${context.release.expectedCounts.members} in shard ${member.shardId}; catalog membership does not establish runtime behavior or acceptance.`,
  ];

  const requiredScenarios = [
    `root frames 1-${header.frameCount} plus every nested frame domain discovered from source-hash-bound machine, authoring, and original-runtime evidence at the native ${header.widthPx}x${header.heightPx} stage`,
    ...(behaviorSignalCount > 0
      ? [`every reachable interaction, branch, and state transition corresponding to the ${behaviorSignalCount} conservative machine signals under deterministic parent/root/global fixtures`]
      : ["authorized original-runtime confirmation that no ActionScript-controlled interaction was omitted before classifying the member as linear"]),
    ...(externalCallCount > 0
      ? [`all ${externalCallCount} external-call candidates under denied or reviewed inert replacements, with no legacy side effect executed`]
      : []),
    ...(exactExternalAudioCount + embeddedDefineSoundCount + embeddedStreamCount > 0
      ? ["every hash-bound external and embedded audio source across every host/XML-declared language and control state, with cue frames established only from authoritative runtime evidence"]
      : ["authoritative confirmation of silence or host-provided audio; zero exact associations must not be treated as proof of no runtime audio"]),
    ...(isShell
      ? [`natural host entry, sequencing, direct selection, and history traversal for all ${context.release.expectedCounts.activeXmlReferencedPages} active page members of the atomic release`]
      : []),
    "terminal state and Replay with a verified full-state reset",
  ];

  return { risk, observedBehavior, requiredScenarios, behaviorSignalCount, externalCallCount };
}

function sourceAuthoringState(manifest) {
  if (!manifest.source.fla) {
    return {
      required: false,
      status: "not-applicable-fla-missing",
      comprehensiveCurrentContract: false,
      strictAcceptanceEffect: false,
      blocker: "No paired FLA exists. Animate/JSFL availability cannot restore absent authoring source; shipped SWF evidence and an authorized original-runtime capture remain necessary.",
    };
  }
  return {
    required: true,
    status: "not-complete-legacy-conversion-dialog",
    comprehensiveCurrentContract: false,
    strictAcceptanceEffect: false,
    blocker: "Adobe Animate 2021 is installed and its disposable-document JSFL probe passes, but the legacy ActionScript conversion dialog prevents an unattended, hash-bound per-file FLA audit. Tool availability and a blank-document probe do not clear this migration gate.",
  };
}

function authoringDocumentPath(pathUri, id) {
  invariant(typeof pathUri === "string" && pathUri.startsWith("file:"), `${id}: Animate authoring document pathURI is invalid`);
  try {
    return fileURLToPath(pathUri).replace(/^\/Macintosh HD(?=\/)/, "");
  } catch (error) {
    throw new Error(`${id}: Animate authoring document pathURI is invalid: ${error.message}`);
  }
}

function verifyRecursiveAuthoringShape(authoringAudit, id) {
  invariant(authoringAudit.recursiveLibraryTimelineAudit === true, `${id}: Animate audit predates the recursive library-timeline contract`);
  const timelines = [authoringAudit.timeline];
  for (const item of authoringAudit.library || []) if (item.timeline) timelines.push(item.timeline);
  invariant(timelines.length >= 1, `${id}: Animate recursive timeline inventory is empty`);
  for (const timeline of timelines) {
    invariant(Array.isArray(timeline?.layers), `${id}: Animate recursive authoring timeline is missing layers`);
    for (const layer of timeline.layers) {
      invariant(Array.isArray(layer.keyframes), `${id}: Animate recursive authoring layer is missing keyframes`);
      for (const frame of layer.keyframes) {
        invariant(Array.isArray(frame.elements), `${id}: Animate recursive authoring keyframe is missing elements`);
      }
    }
  }
}

async function readOptionalJsonRecord(candidate, projectRoot) {
  try {
    return await readJsonRecord(candidate, projectRoot);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function verifyPerFileFlaAuthoringAudit({ projectRoot, workspace, manifest, header }) {
  const id = manifest.animationId;
  const fallback = sourceAuthoringState(manifest);
  if (!manifest.source.fla) return { state: fallback, evidence: [] };

  const auditPath = path.join(workspace, "audit", "adobe-animate-2021-authoring-audit.json");
  const auditRecord = await readOptionalJsonRecord(auditPath, projectRoot);
  if (!auditRecord) return { state: fallback, evidence: [] };

  const audit = auditRecord.value;
  invariant(audit.schemaVersion === 1 || audit.schemaVersion === 2, `${id}: unsupported Animate authoring audit schema`);
  invariant(audit.evidenceKind === "adobe-animate-2021-cold-start-authoring-audit", `${id}: unexpected Animate authoring evidence kind`);
  invariant(audit.animationId === id, `${id}: Animate authoring audit identity mismatch`);
  invariant(audit.source?.fla === manifest.source.fla, `${id}: Animate authoring FLA path mismatch`);
  invariant(audit.source?.flaSha256 === manifest.source.flaSha256, `${id}: Animate authoring FLA hash mismatch`);
  invariant(audit.protocol?.coldStartPerFla === true, `${id}: Animate authoring cold-start protocol is missing`);
  invariant(audit.protocol?.openedWithoutSaving === true, `${id}: Animate authoring no-save protocol is missing`);
  invariant(audit.protocol?.originalSourceHashVerified === true, `${id}: Animate authoring source verification is missing`);
  invariant(typeof audit.animateVersion === "string" && /21[.,]0[.,]7/.test(audit.animateVersion), `${id}: Animate authoring version is not 21.0.7`);

  const native = audit.nativeMovie;
  invariant(native?.width === header.widthPx && native?.height === header.heightPx, `${id}: Animate authoring stage differs from shipped SWF`);
  invariant(native?.fps === header.frameRate, `${id}: Animate authoring FPS differs from shipped SWF`);
  invariant(native?.frameCount === header.frameCount, `${id}: Animate authoring root frame count differs from shipped SWF`);
  if (manifest.runtime) {
    invariant(native.width === manifest.runtime.stage?.width && native.height === manifest.runtime.stage?.height, `${id}: Animate authoring stage differs from migration manifest`);
    invariant(native.fps === manifest.runtime.fps, `${id}: Animate authoring FPS differs from migration manifest`);
    invariant(native.frameCount === manifest.runtime.frameCount, `${id}: Animate authoring root frame count differs from migration manifest`);
  }

  const embedded = audit.authoringAudit;
  invariant(embedded?.schemaVersion === 1, `${id}: unsupported embedded Animate authoring audit schema`);
  invariant(embedded.evidenceKind === "adobe-animate-authoring-audit", `${id}: embedded Animate authoring audit is missing`);
  invariant(embedded.document?.name === path.basename(manifest.source.fla), `${id}: embedded Animate authoring document name mismatch`);
  invariant(path.basename(authoringDocumentPath(embedded.document?.pathURI, id)) === embedded.document.name, `${id}: embedded Animate authoring document path mismatch`);
  invariant(embedded.document.width === native.width && embedded.document.height === native.height, `${id}: embedded Animate authoring stage mismatch`);
  invariant(embedded.document.frameRate === native.fps, `${id}: embedded Animate authoring FPS mismatch`);
  invariant(embedded.timeline?.frameCount === native.frameCount, `${id}: embedded Animate authoring root frame count mismatch`);
  invariant(embedded.timeline?.layerCount === native.rootLayerCount, `${id}: embedded Animate root layer count mismatch`);
  invariant(embedded.document.libraryItemCount === native.libraryItemCount, `${id}: embedded Animate library item count mismatch`);
  invariant(isSha256(audit.rawAuditSha256), `${id}: embedded Animate raw-audit hash is invalid`);
  invariant(sha256Bytes(Buffer.from(JSON.stringify(embedded))) === audit.rawAuditSha256, `${id}: embedded Animate raw-audit hash mismatch`);

  const flashFrame = audit.capturedAuthoringFrame?.flashFrame;
  invariant(Number.isInteger(flashFrame) && flashFrame >= 1 && flashFrame <= native.frameCount, `${id}: Animate captured authoring frame is invalid`);
  invariant(embedded.timeline.currentFlashFrame === flashFrame, `${id}: Animate captured authoring frame differs from embedded audit`);
  const expectedFramePath = `audit/adobe-animate-2021-authoring-frame-${String(flashFrame).padStart(4, "0")}.png`;
  invariant(audit.capturedAuthoringFrame.file === expectedFramePath, `${id}: Animate authoring frame path is not canonical`);
  const frameBytes = await readFile(path.join(workspace, expectedFramePath));
  invariant(sha256Bytes(frameBytes) === audit.capturedAuthoringFrame.sha256, `${id}: Animate authoring frame hash mismatch`);
  const frameDimensions = parsePngHeader(frameBytes, `${id}: Animate authoring frame`);
  invariant(frameDimensions.width === native.width && frameDimensions.height === native.height, `${id}: Animate authoring frame is not native stage size`);

  const commonEvidence = [
    { id: "animate-authoring-audit", path: "audit/adobe-animate-2021-authoring-audit.json", sha256: auditRecord.sha256 },
    { id: "animate-authoring-frame", path: expectedFramePath, sha256: audit.capturedAuthoringFrame.sha256 },
  ];
  const commonState = {
    required: true,
    report: { path: "audit/adobe-animate-2021-authoring-audit.json", sha256: auditRecord.sha256 },
    canonicalSchemaVersion: audit.schemaVersion,
    animateVersion: audit.animateVersion,
    capturedAt: audit.capturedAt,
    nativeMetadataMatchesShippedSwf: true,
    capturedAuthoringFrame: {
      path: expectedFramePath,
      sha256: audit.capturedAuthoringFrame.sha256,
      flashFrame,
      ...frameDimensions,
    },
    strictAcceptanceEffect: false,
    limitations: audit.limitations,
  };

  if (audit.schemaVersion === 1) {
    return {
      state: {
        ...commonState,
        status: "legacy-partial-authoring-audit-refresh-required",
        comprehensiveCurrentContract: false,
        blocker: "The hash-valid schema-v1 Animate audit is shallow and predates the recursive element, current-JSFL, and read-only working-copy bindings. Refresh it with the documented schema-v2 workflow before clearing the authoring gate.",
      },
      evidence: commonEvidence,
    };
  }

  const protocol = audit.protocol;
  invariant(protocol.readOnlyWorkingCopyRequired === true, `${id}: Animate schema-v2 read-only working-copy requirement is missing`);
  invariant(protocol.readOnlyWorkingCopyPathVerified === true, `${id}: Animate schema-v2 working-copy path verification is missing`);
  invariant(protocol.readOnlyWorkingCopyHashVerifiedAtFinalize === true, `${id}: Animate schema-v2 working-copy hash verification is missing`);
  invariant(protocol.readOnlyWorkingCopyPermissionsVerifiedAtFinalize === true, `${id}: Animate schema-v2 working-copy permissions verification is missing`);
  invariant(protocol.recursiveLibraryTimelineAuditRequired === true, `${id}: Animate schema-v2 recursive audit requirement is missing`);
  invariant(protocol.recursiveLibraryTimelineAuditVerified === true, `${id}: Animate schema-v2 recursive audit verification is missing`);
  verifyRecursiveAuthoringShape(embedded, id);

  invariant(audit.auditScript?.file === "scripts/animate-audit-current-document.jsfl", `${id}: Animate schema-v2 audit script path mismatch`);
  const scriptPin = await verifyPinnedFile({
    projectRoot,
    workspace,
    candidate: audit.auditScript.file,
    expectedSha256: audit.auditScript.sha256,
    label: `${id}: Animate schema-v2 audit script`,
  });

  const expectedWorkingCopy = path.join(projectRoot, "work", "animate", "read-only-fla-copies", id, path.basename(manifest.source.fla));
  const expectedWorkingCopyPath = portable(path.relative(projectRoot, expectedWorkingCopy));
  const workingCopy = audit.source.workingCopy;
  invariant(workingCopy?.path === expectedWorkingCopyPath, `${id}: Animate schema-v2 working-copy path mismatch`);
  invariant(workingCopy.sha256 === manifest.source.flaSha256, `${id}: Animate schema-v2 working-copy hash differs from source FLA`);
  invariant(workingCopy.readOnlyAtFinalize === true, `${id}: Animate schema-v2 working copy was not read-only at finalization`);
  invariant(workingCopy.byteIdenticalToSourceAtFinalize === true, `${id}: Animate schema-v2 working copy was not byte-identical at finalization`);
  await verifyPinnedFile({
    projectRoot,
    workspace,
    candidate: workingCopy.path,
    expectedSha256: workingCopy.sha256,
    label: `${id}: Animate schema-v2 working copy`,
  });
  const workingCopyStat = await stat(expectedWorkingCopy);
  invariant(workingCopyStat.size === workingCopy.bytes, `${id}: Animate schema-v2 working-copy byte count mismatch`);
  invariant((workingCopyStat.mode & 0o222) === 0, `${id}: Animate schema-v2 working copy is currently writable`);
  invariant(path.resolve(authoringDocumentPath(embedded.document.pathURI, id)) === path.resolve(expectedWorkingCopy), `${id}: embedded Animate audit was not captured from the pinned working copy`);
  invariant(audit.capturedAuthoringFrame.width === frameDimensions.width && audit.capturedAuthoringFrame.height === frameDimensions.height, `${id}: Animate schema-v2 authoring frame metadata mismatch`);

  return {
    state: {
      ...commonState,
      status: "verified-current-recursive-authoring-audit",
      comprehensiveCurrentContract: true,
      blocker: null,
      auditScript: scriptPin,
      workingCopy: {
        path: workingCopy.path,
        sha256: workingCopy.sha256,
        bytes: workingCopy.bytes,
        readOnly: true,
        byteIdenticalToSource: true,
      },
      recursiveLibraryTimelineAuditVerified: true,
    },
    evidence: [
      commonEvidence[0],
      { id: "animate-authoring-audit-script", path: scriptPin.path, sha256: scriptPin.sha256 },
      { id: "animate-authoring-working-copy", path: workingCopy.path, sha256: workingCopy.sha256 },
      commonEvidence[1],
    ],
  };
}

async function verifyOutputEvidence(report, { projectRoot, workspace }) {
  invariant(Array.isArray(report.evidence) && report.evidence.length >= 1, `${report.animationId}: readiness evidence is missing`);
  const seen = new Set();
  for (const evidence of report.evidence) {
    invariant(typeof evidence.id === "string" && evidence.id.length > 0, `${report.animationId}: readiness evidence id is missing`);
    invariant(!seen.has(evidence.id), `${report.animationId}: duplicate readiness evidence id ${evidence.id}`);
    seen.add(evidence.id);
    await verifyPinnedFile({ projectRoot, workspace, candidate: evidence.path, expectedSha256: evidence.sha256, label: `${report.animationId}: readiness evidence ${evidence.id}` });
  }
  return true;
}

export async function buildCourseStrictReadiness(id, options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const migrationsRoot = options.migrationsRoot || path.join(projectRoot, "migrations");
  const toolchainPath = options.toolchainPath || path.join(projectRoot, "catalog", "toolchain.json");
  const probeRoot = options.probeRoot || path.join(projectRoot, "work", "animate", "jsfl-cli-probes");
  const releaseContext = options.releaseContext || (options.releaseId ? await resolveReleaseContext(options) : null);
  if (releaseContext) {
    invariant(releaseContext[verifiedReleaseContext] === true, `${id}: unverified lesson release context`);
    invariant(!options.releaseId || options.releaseId === releaseContext.releaseId, `${id}: lesson release context mismatch`);
    invariant(releaseContext.membersById.has(id), `${id}: not a member of atomic release ${releaseContext.releaseId}`);
  } else {
    invariant(COURSE_STRICT_READINESS_IDS.includes(id), `unknown course/shell readiness id: ${id}`);
  }
  const workspace = path.join(migrationsRoot, id);

  const [manifestRecord, machineRecord, baselineRecord, audioRecord, tools] = await Promise.all([
    readJsonRecord(path.join(workspace, "migration.json"), projectRoot),
    readJsonRecord(path.join(workspace, "audit", "machine", "report.json"), projectRoot),
    readJsonRecord(path.join(workspace, "baseline", "ffdec-root-frames.json"), projectRoot),
    readJsonRecord(path.join(workspace, "audit", "audio-runtime-evidence.json"), projectRoot),
    verifyToolchain({ projectRoot, toolchainPath, probeRoot }),
  ]);
  const manifest = manifestRecord.value;
  invariant(manifest.animationId === id, `${id}: manifest identity mismatch`);
  invariant(manifest.source?.swf && isSha256(manifest.source.swfSha256), `${id}: manifest source is invalid`);
  const releaseMember = releaseContext ? verifyReleaseMemberBinding({ id, manifest, context: releaseContext }) : null;

  const machine = await verifyMachineReport({ projectRoot, workspace, manifest, record: machineRecord });
  const baseline = await verifyStructuralBaseline({
    projectRoot,
    workspace,
    manifest,
    machine,
    record: baselineRecord,
    allowDeclaredRasterization: Boolean(releaseContext),
  });
  const { audio, inventoryText } = await verifyAudioReport({ projectRoot, workspace, manifest, record: audioRecord });
  const header = machine.findings.ffdecHeader;
  const swfmill = machine.findings.swfmill;
  const authoring = await verifyPerFileFlaAuthoringAudit({ projectRoot, workspace, manifest, header });
  const authoringState = authoring.state;
  const audioInventoryPath = path.join(workspace, audio.inventory.file);
  const audioInventorySha256 = sha256Bytes(Buffer.from(inventoryText));
  const isShell = id.startsWith("shell-");
  const profile = releaseContext
    ? deriveReleaseProfile({ member: releaseMember, context: releaseContext, machine, baseline, audio })
    : PROFILE[id];

  const reason = releaseContext
    ? `The exact atomic-release binding and hash-verified machine, structural-frame, and audio evidence are verified for this member, but they do not provide a source-hash-bound authorized original-runtime traversal of all ${profile.behaviorSignalCount} conservative behavior signals, ${profile.externalCallCount} external-call candidates, frame domains, language/audio states, terminal behavior, and Replay.`
    : isShell
      ? "The shell depends on course XML, child SWFs, Flash globals, history, storage, reporting, and original runtime state. Installed Animate and a blank-document JSFL probe do not provide that per-file/host-context evidence."
      : authoringState.required && !authoringState.comprehensiveCurrentContract
        ? authoringState.blocker
        : authoringState.comprehensiveCurrentContract
          ? "The current recursive, hash-bound FLA authoring audit is verified, but it does not prove original-runtime interaction branches, bilingual audio synchronization, terminal behavior, or Replay."
          : "The FLA is missing and no source-hash-bound authorized original-runtime traversal covers the nested teaching timeline and all interaction states. Installed Animate and a blank-document JSFL probe cannot replace the missing authoring source.";
  const authoringBlocker = authoringState.comprehensiveCurrentContract
    ? null
    : authoringState.required
      ? authoringState.blocker
      : "Paired FLA is missing; authoring structure cannot be recovered from tool availability alone.";

  const evidence = [
    { id: "source-swf", path: manifest.source.swf, sha256: manifest.source.swfSha256 },
    ...(manifest.source.fla ? [{ id: "source-fla", path: manifest.source.fla, sha256: manifest.source.flaSha256 }] : []),
    { id: "machine-report", path: "audit/machine/report.json", sha256: machineRecord.sha256 },
    ...machine.outputs.map((output, index) => ({ id: `machine-output-${String(index + 1).padStart(2, "0")}`, path: output.path, sha256: output.sha256 })),
    { id: "structural-root-baseline", path: "baseline/ffdec-root-frames.json", sha256: baselineRecord.sha256 },
    { id: "audio-runtime-evidence", path: "audit/audio-runtime-evidence.json", sha256: audioRecord.sha256 },
    { id: "audio-inventory", path: portable(path.relative(workspace, audioInventoryPath)), sha256: audioInventorySha256 },
    { id: "toolchain", path: tools.toolchainRecord.path, sha256: tools.toolchainRecord.sha256 },
    { id: "animate-jsfl-cli-probe", path: tools.probeRecord.path, sha256: tools.probeRecord.sha256 },
    ...authoring.evidence,
    ...(releaseContext ? [
      { id: "lesson-release-catalog", path: releaseContext.catalogRecord.path, sha256: releaseContext.catalogRecord.sha256 },
      { id: "lesson-source-xml", path: releaseContext.sourceLesson.path, sha256: releaseContext.sourceLesson.sha256 },
    ] : []),
  ];

  const report = {
    schemaVersion: COURSE_STRICT_READINESS_SCHEMA_VERSION,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: "scripts/build-course-strict-readiness.mjs",
      version: COURSE_STRICT_READINESS_GENERATOR_VERSION,
      deterministic: true,
    },
    animationId: id,
    ...(releaseContext ? {
      releaseScope: {
        catalog: {
          path: releaseContext.catalogRecord.path,
          sha256: releaseContext.catalogRecord.sha256,
          schemaVersion: releaseContext.catalogRecord.value.schemaVersion,
        },
        releaseId: releaseContext.release.releaseId,
        releaseType: releaseContext.release.releaseType,
        publicationMode: releaseContext.release.publicationMode,
        exactMembershipVerified: true,
        expectedMemberCount: releaseContext.release.expectedCounts.members,
        sourceLesson: releaseContext.sourceLesson,
        member: {
          ordinal: releaseMember.ordinal,
          animationId: releaseMember.animationId,
          assetId: releaseMember.assetId,
          releaseRole: releaseMember.releaseRole,
          shardId: releaseMember.shardId,
          source: releaseMember.source,
        },
        profileKind: "machine-derived-conservative-generic",
        strictAcceptanceEffect: false,
      },
    } : {}),
    assessedOn: tools.toolchain.recordedOn,
    migrationStatusChanged: false,
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: profile.risk,
      reason,
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      sourceHashVerified: true,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      flaAvailability: manifest.source.fla ? "present" : "missing",
      authoringInspection: authoringState.status,
    },
    toolReadiness: {
      catalogToolchain: {
        path: tools.toolchainRecord.path,
        sha256: tools.toolchainRecord.sha256,
      },
      adobeAnimate: {
        installed: true,
        application: tools.toolchain.authoringEvidence.application,
        productVersion: tools.toolchain.authoringEvidence.productVersion,
        applicationPath: tools.toolchain.authoringEvidence.applicationPath,
      },
      jsflCliProbe: {
        status: "passed",
        scope: tools.probe.scope,
        animateVersion: tools.probe.artifacts.report.animateVersion,
        executableSha256: tools.probe.command.executableSha256,
        result: { path: tools.probeRecord.path, sha256: tools.probeRecord.sha256 },
        allInternalPathSha256PinsVerified: true,
        limitations: tools.probe.limitations,
      },
      perFileFlaAuthoringAudit: authoringState,
    },
    machineAudit: {
      auditStatus: machine.auditStatus,
      stage: { width: header.widthPx, height: header.heightPx },
      fps: header.frameRate,
      rootFrameCount: header.frameCount,
      rootTimelineDurationMs: (header.frameCount * 1000) / header.frameRate,
      swfVersion: header.version,
      actionScriptVersion: swfmill.actionScriptVersion,
      exportedScriptFileCount: machine.findings.exportedScriptFileCount,
      nestedShowFrameTagCount: swfmill.tagCounts.ShowFrame || 0,
      interactionSignals: interactionSignals(swfmill.tagCounts),
      externalCallCandidates: machine.findings.externalCallCandidates,
      observedBehaviorFromExtractedScripts: profile.observedBehavior,
      report: { path: "audit/machine/report.json", sha256: machineRecord.sha256 },
      allReportOutputPinsVerified: true,
    },
    audioAudit: {
      status: audio.acceptance.strictAudioAcceptance,
      report: { path: "audit/audio-runtime-evidence.json", sha256: audioRecord.sha256 },
      inventory: {
        path: audio.inventory.file,
        sha256: audioInventorySha256,
        rowCount: audio.inventory.rowCount,
      },
      structuralAuditComplete: audio.acceptance.structurallyAudited,
      authoritativeListeningComplete: audio.acceptance.authoritativeListeningComplete,
      hostStateTraversalComplete: audio.acceptance.hostStateTraversalComplete,
      synchronizationComplete: audio.acceptance.synchronizationComplete,
      acceptanceRequirements: audio.acceptance.requirements,
    },
    baselineReadiness: {
      ffdecStructuralRootFrameExport: {
        status: baseline.status,
        report: { path: "baseline/ffdec-root-frames.json", sha256: baselineRecord.sha256 },
        archive: baseline.archive.root,
        frames: baseline.frames.length,
        ...(releaseContext && baseline.runtime?.rasterization ? {
          nativeStage: { width: header.widthPx, height: header.heightPx },
          rasterization: baseline.runtime.rasterization,
        } : {}),
        dimensionsVerified: true,
        everyArchivedFrameHashVerified: true,
      },
      authoritativeRuntimeBaseline: {
        status: "blocked",
        reason: "No source-hash-bound authorized original-runtime natural-entry traversal covers every required root/nested frame domain, branch, language, audio state, terminal state, and Replay reset.",
      },
      limitation: "FFDec static root-frame export does not execute ActionScript or nested runtime branches. Ruffle and candidate renderers are forensic/engineering references, not authoritative fidelity baselines.",
    },
    branchCaptureReadiness: {
      status: "partial-reference-only",
      requiredScenarioInventory: profile.requiredScenarios,
      missing: [
        "source-hash-bound authorized original-runtime natural-entry capture",
        "deterministic parent/root/global fixture with denied legacy side effects",
        "exact interaction hit targets and complete state-transition map",
        "authoritative bilingual audio cue/listening/synchronization evidence",
        "terminal and Replay full-state reset evidence",
      ],
    },
    strictGateBlockers: [
      ...(authoringBlocker ? [authoringBlocker] : []),
      "No authoritative native-stage runtime baseline covers every required frame domain, reachable scenario, branch, and language.",
      "A declared implementation route or engineering candidate does not establish full-frame parity; canonical captures, per-frame RMSE, diff review, and accepted exceptions remain incomplete.",
      "Audio acceptance remains pending: listening, host-state traversal, language/content, synchronization, and controls are not signed off.",
      "Accessibility, responsive, console/network product QA, human visual review, engineering review, and owner acceptance remain pending.",
    ],
    executableNextActions: [
      ...(authoringState.required && !authoringState.comprehensiveCurrentContract ? ["Use the documented human-assisted, read-only Animate workflow to acknowledge the legacy conversion warning and finalize a hash-bound per-file FLA audit without saving the converted document."] : []),
      "Capture the exact SWF in an authorized original runtime with an inert, source-derived host fixture and complete natural-entry traces for every declared frame domain.",
      releaseContext
        ? `Map every machine-indicated interaction/branch to deterministic fixtures and capture every reachable state at the native ${header.widthPx}x${header.heightPx} stage without inferring semantics from tag counts.`
        : "Map every interaction/scoring/random branch to deterministic fixtures and capture every reachable state at the native 800x600 stage.",
      "Complete bilingual audio mapping, authoritative listening, start semantics, synchronization, controls, and Replay checks without inventing cue frames.",
      "Run implementation full-frame comparisons, inspect every diff/outlier, and obtain named human and owner decisions before any status promotion.",
    ],
    evidence,
    review: {
      humanReviewer: null,
      engineeringReviewer: null,
      ownerReviewer: null,
      decision: "pending",
    },
  };

  await verifyOutputEvidence(report, { projectRoot, workspace });
  return report;
}

function serialize(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

async function atomicWrite(candidate, contents) {
  await mkdir(path.dirname(candidate), { recursive: true });
  const temporary = `${candidate}.tmp-${process.pid}`;
  await writeFile(temporary, contents);
  await rename(temporary, candidate);
}

export async function buildAllCourseStrictReadiness(options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const migrationsRoot = options.migrationsRoot || path.join(projectRoot, "migrations");
  const check = options.check === true;
  if (options.releaseId) {
    const releaseContext = await resolveReleaseContext({ ...options, projectRoot });
    const prepared = [];
    for (const member of releaseContext.release.members) {
      const report = await buildCourseStrictReadiness(member.animationId, {
        ...options,
        projectRoot,
        migrationsRoot,
        releaseContext,
      });
      const outputPath = path.join(migrationsRoot, member.animationId, "audit", "strict-readiness.json");
      prepared.push({
        id: member.animationId,
        report,
        outputPath,
        expected: serialize(report),
      });
    }

    if (check) {
      for (const item of prepared) {
        const observed = await readFile(item.outputPath, "utf8");
        invariant(observed === item.expected, `${item.id}: audit/strict-readiness.json is stale; run node scripts/build-course-strict-readiness.mjs --release-id ${releaseContext.releaseId}`);
      }
    } else {
      for (const item of prepared) await atomicWrite(item.outputPath, item.expected);
    }
    return prepared.map(({ id, report, outputPath }) => ({
      id,
      status: report.conclusion.strictAcceptanceReady ? "ready" : "blocked",
      output: portable(path.relative(projectRoot, outputPath)),
    }));
  }

  const results = [];
  for (const id of COURSE_STRICT_READINESS_IDS) {
    results.push(await materializeCourseStrictReadiness(id, { ...options, projectRoot, migrationsRoot, check }));
  }
  return results;
}

export async function materializeCourseStrictReadiness(id, options = {}) {
  const projectRoot = options.projectRoot || defaultProjectRoot;
  const migrationsRoot = options.migrationsRoot || path.join(projectRoot, "migrations");
  const report = await buildCourseStrictReadiness(id, { ...options, projectRoot, migrationsRoot });
  const outputPath = path.join(migrationsRoot, id, "audit", "strict-readiness.json");
  const expected = serialize(report);
  if (options.check === true) {
    const observed = await readFile(outputPath, "utf8");
    invariant(observed === expected, `${id}: audit/strict-readiness.json is stale; run node scripts/build-course-strict-readiness.mjs`);
  } else {
    await atomicWrite(outputPath, expected);
  }
  return { id, status: report.conclusion.strictAcceptanceReady ? "ready" : "blocked", output: portable(path.relative(projectRoot, outputPath)) };
}

function parseArgs(argv) {
  const options = { check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--release-id") {
      invariant(options.releaseId === undefined, "--release-id may be provided only once");
      options.releaseId = argv[++index] || "";
      invariant(options.releaseId.length > 0, "--release-id requires a value");
    }
    else if (value === "--lesson-releases") {
      const candidate = argv[++index] || "";
      invariant(candidate.length > 0, "--lesson-releases requires a path");
      options.lessonReleasesPath = path.resolve(candidate);
    }
    else if (value === "--project-root") options.projectRoot = path.resolve(argv[++index] || "");
    else if (value === "--migrations-root") options.migrationsRoot = path.resolve(argv[++index] || "");
    else if (value === "--toolchain") options.toolchainPath = path.resolve(argv[++index] || "");
    else if (value === "--probe-root") options.probeRoot = path.resolve(argv[++index] || "");
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-course-strict-readiness.mjs [--check] [--release-id <id>] [options]",
    "",
    "Without --release-id, builds the legacy ten course/shell readiness records.",
    "With --release-id, builds every exact member of one validated atomic lesson",
    "release using conservative generic profiles derived only from verified",
    "release membership, source, machine-audit, structural-frame, audio, toolchain,",
    "and disposable Animate JSFL probe evidence. The result is fail-closed and",
    "never changes migration status or grants human/owner acceptance.",
    "",
    "Options:",
    "  --check                    Verify reports are current without writing",
    "  --release-id <id>          Select every exact member of one atomic release",
    "  --lesson-releases <path>   Override catalog/lesson-releases.json",
    "  --project-root <path>      Override repository root",
    "  --migrations-root <path>   Override migrations root",
    "  --toolchain <path>         Override catalog/toolchain.json",
    "  --probe-root <path>        Override work/animate/jsfl-cli-probes",
    "  -h, --help                 Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const results = await buildAllCourseStrictReadiness(options);
  console.log(JSON.stringify({ check: options.check, generatorVersion: COURSE_STRICT_READINESS_GENERATOR_VERSION, count: results.length, ready: results.filter((item) => item.status === "ready").length, blocked: results.filter((item) => item.status === "blocked").length, results }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { findPassingProbe, parseArgs, serialize, verifyProbeResult };
