#!/usr/bin/env node

import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_PATH =
  "reports/g4-l10-vb003-static-specification-gap-closure-v1.json";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const ANIMATION_ID = "course-g04-l10-vb-003";
const SHA256 = /^[a-f0-9]{64}$/u;

const INPUTS = Object.freeze({
  sourceSwf: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
    kind: "binary",
    sha256: "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d",
  },
  sourceFla: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla",
    kind: "binary",
    sha256: "1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7",
  },
  externalAudioMp3: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3",
    kind: "binary",
    sha256: "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03",
  },
  migration: {
    path: "migrations/course-g04-l10-vb-003/migration.json",
    kind: "json",
    sha256: "2450dd99af1806acf04ef4130f4b63001ba785db7b5ae96b3c13080d2a06a585",
  },
  brief: {
    path: "migrations/course-g04-l10-vb-003/MIGRATION_BRIEF.md",
    kind: "text",
    sha256: "9ea95188fd3c34f1d2fb019d9a9799abd69ab5d6994d284158f7b477a4b35338",
  },
  assetInventory: {
    path: "migrations/course-g04-l10-vb-003/asset-inventory.csv",
    kind: "text",
    sha256: "d6cbc6a5a4d3097dc7fdd689151f82ecb0b3f734864d8a808b860de6229ae884",
  },
  audioInventory: {
    path: "migrations/course-g04-l10-vb-003/audio-inventory.csv",
    kind: "text",
    sha256: "50492491fd02782775e92544f3f0a73f23b2d3aab02aadf46de042df7a900335",
  },
  keyframes: {
    path: "migrations/course-g04-l10-vb-003/keyframes.csv",
    kind: "text",
    sha256: "0c2a7ee1961c581011baf94d97bc56b1337355957d244da36f01fcdbb7cff39f",
  },
  coverage: {
    path: "migrations/course-g04-l10-vb-003/evidence/full-frame-coverage.json",
    kind: "json",
    sha256: "98b85bc001b4538af82ba8cb92b82e482687a3bdd68ccece50f27854095bf4e2",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json",
    kind: "json",
    sha256: "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l10-vb-003/audit/frame-domain-disposition.json",
    kind: "json",
    sha256: "d69f282c571ed3ec19228372db425f52ae0d099c6b47bf27de9d9b680f92df68",
  },
  audioRuntimeEvidence: {
    path: "migrations/course-g04-l10-vb-003/audit/audio-runtime-evidence.json",
    kind: "json",
    sha256: "dbcc0fdf0a53c37350639bb6212a8be6daa0f81c795eb3a093f2b67d49d05898",
  },
  languageAudioBinding: {
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    kind: "json",
    sha256: "ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e",
  },
  machineAudit: {
    path: "migrations/course-g04-l10-vb-003/audit/machine/report.json",
    kind: "json",
    sha256: "e49170e6c4590eea8fa71a9d72a24c8cc7aef99395154d0a36ca2c073dbce2a5",
  },
  hostEntryAntecedent: {
    path: "reports/g4-l10-vb003-host-entry-antecedent.json",
    kind: "json",
    sha256: "9c64d146c8560551beac47fd493c0a9a35135e3d4dc756363f3ac643525c595d",
  },
  glossaryContracts: {
    path: "reports/lesson-release-behavior-contracts/lesson-g04-l10-perimeter-area/host-glossary-release-contracts.json",
    kind: "json",
    sha256: "9656769b1bc0e623317a68668ccb0e22575512846d1eacb79fd322dd7487ddf7",
  },
  toolchain: {
    path: "catalog/toolchain.json",
    kind: "json",
    sha256: "07484eaf52751128f91b429b7ce1b7bb46259365c545d17c360b5d0c74c3b41f",
  },
  l10TemplateV5: {
    path: "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.json",
    kind: "json",
    sha256: "b4777628d6433241c247c1e3c4236becadd3b4b66e03585f51a81babd5fbeef9",
  },
  staticCompositeChecker: {
    path: "scripts/materialize-g4-l10-post-declaration-static-composites.mjs",
    kind: "text",
    sha256: "83254f7afd5bd3bd41886afc147ebc4c6522712d729a2069d4790cc2d5555065",
  },
  coverageChecker: {
    path: "scripts/materialize-release-source-evidenced-coverage-v2.mjs",
    kind: "text",
    sha256: "f223c8058ddf8f03860508fe476cf6d06b661449c737426dc91e833d704ad963",
  },
  traceChecker: {
    path: "scripts/build-course-trace-specs.mjs",
    kind: "text",
    sha256: "bfba7fd2430d0bf445bc6478b78d17eab5e8274b7b924be0f0513e8837b25e54",
  },
  ts007FrameDomainDisposition: {
    path: "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
    kind: "json",
    sha256: "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da",
  },
  ts008FrameDomainDisposition: {
    path: "migrations/course-g04-l10-ts-008/audit/frame-domain-disposition.json",
    kind: "json",
    sha256: "8f4f4d32b532b58711ea09237184e27b121a721af1a05d378bb894cde1e54733",
  },
  ts007Coverage: {
    path: "migrations/course-g04-l10-ts-007/evidence/full-frame-coverage.json",
    kind: "json",
    sha256: "7a0b368f1d1f222a40a6a3185cfc0842036f7967063940e0511758aac100d789",
  },
  ts008Coverage: {
    path: "migrations/course-g04-l10-ts-008/evidence/full-frame-coverage.json",
    kind: "json",
    sha256: "f00e858b4b8c5f1e589c68627a9c1a36b0c02745dfb15889aaceda0db19c7c9e",
  },
  ts007RootTrace: {
    path: "migrations/course-g04-l10-ts-007/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-default-root-en.json",
    kind: "json",
    sha256: "f7a7e7760fe8146f107a53db99fc47886199c2cadce1dfb00f3016c6f7d8fb01",
  },
});

const PROBE_SPECS = Object.freeze([
  {
    id: "post-declaration-static-composites",
    scriptKey: "staticCompositeChecker",
    args: ["--check"],
    expected: [
      "course-g04-l10-ts-007: unchanged declaration static evidence: exact descriptor drifted",
    ],
  },
  {
    id: "release-coverage-v2",
    scriptKey: "coverageChecker",
    args: ["--release-id", RELEASE_ID, "--check"],
    expected: [
      "Stale release coverage-v2 output(s):",
      "migrations/course-g04-l10-ts-007/evidence/full-frame-coverage.json",
      "migrations/course-g04-l10-ts-008/evidence/full-frame-coverage.json",
    ],
  },
  {
    id: "release-trace-specs",
    scriptKey: "traceChecker",
    args: ["--release-id", RELEASE_ID, "--check"],
    expected: [
      "course-g04-l10-ts-007: stale trace spec req-default-root-en.json",
    ],
  },
]);

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "sourceMutation",
  "workspaceMutation",
  "authoritativeOriginalRuntimeEvidence",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

async function canonicalProjectRoot(projectRoot) {
  const lexicalRoot = path.resolve(projectRoot);
  const rootInfo = await lstat(lexicalRoot);
  assert.ok(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `Project root must be an ordinary non-symlink directory: ${lexicalRoot}`);
  const canonicalRoot = await realpath(lexicalRoot);
  assert.equal(canonicalRoot, lexicalRoot,
    `Project root resolves through a symlink: ${lexicalRoot}`);
  return canonicalRoot;
}

async function resolveExistingFileInsideRoot(projectRoot, relativePath) {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const absolute = resolveInsideRoot(projectRoot, relativePath);
  const canonicalParent = await realpath(path.dirname(absolute));
  assert.equal(canonicalParent, path.dirname(absolute),
    `Parent path resolves through a symlink: ${relativePath}`);
  assert.ok(canonicalParent === canonicalRoot ||
    canonicalParent.startsWith(`${canonicalRoot}${path.sep}`),
  `Parent path escapes canonical project root: ${relativePath}`);
  const canonicalFile = await realpath(absolute);
  assert.equal(canonicalFile, absolute,
    `File path resolves through a symlink: ${relativePath}`);
  return absolute;
}

export async function resolveSafeOutputPath(projectRoot, relativePath) {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const absolute = resolveInsideRoot(projectRoot, relativePath);
  const canonicalParent = await realpath(path.dirname(absolute));
  assert.equal(canonicalParent, path.dirname(absolute),
    `Output parent resolves through a symlink: ${relativePath}`);
  assert.ok(canonicalParent === canonicalRoot ||
    canonicalParent.startsWith(`${canonicalRoot}${path.sep}`),
  `Output parent escapes canonical project root: ${relativePath}`);
  try {
    const info = await lstat(absolute);
    assert.ok(info.isFile() && !info.isSymbolicLink(),
      `Existing output must be an ordinary non-symlink file: ${relativePath}`);
    assert.equal(await realpath(absolute), absolute,
      `Existing output resolves through a symlink: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return absolute;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = await resolveExistingFileInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size,
    `${specification.path} size drifted while read`);
  const digest = sha256(bytes);
  assert.equal(digest, specification.sha256,
    `${specification.path} fixed SHA-256 epoch drifted`);
  const mode = Number(before.mode & 0o777n).toString(8).padStart(4, "0");
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode,
    statIdentity: statIdentity(before),
  };
  if (specification.kind !== "binary") record.text = bytes.toString("utf8");
  if (specification.kind === "json") record.document = JSON.parse(record.text);
  return record;
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  assert.equal(quoted, false, "CSV ended inside a quoted field");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  const [headers, ...dataRows] = rows.filter((candidate) =>
    candidate.some((value) => value.length > 0));
  assert.ok(headers?.length > 0, "CSV is empty");
  return {
    headers,
    rows: dataRows.map((values, rowIndex) => {
      assert.equal(values.length, headers.length,
        `CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}`);
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    }),
  };
}

function normalizeProbeText(value) {
  return String(value ?? "").replaceAll("\r\n", "\n").trim();
}

export function validateProbeObservation(specification, {exitCode, combined}) {
  assert.notEqual(exitCode, 0,
    `${specification.id} unexpectedly became current; this gap snapshot needs a successor`);
  for (const expected of specification.expected) {
    assert.ok(combined.includes(expected),
      `${specification.id} did not expose expected stale evidence: ${expected}`);
  }
  return true;
}

async function runProbe(projectRoot, records, specification) {
  const script = records[specification.scriptKey];
  assert.ok(script, `Missing checker binding ${specification.scriptKey}`);
  let exitCode = 0;
  let stdout = "";
  let stderr = "";
  try {
    const result = await execFile(process.execPath, [script.path, ...specification.args], {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    exitCode = Number(error?.code ?? 1);
    stdout = error?.stdout ?? "";
    stderr = error?.stderr ?? error?.message ?? "";
  }
  const combined = `${normalizeProbeText(stdout)}\n${normalizeProbeText(stderr)}`.trim();
  validateProbeObservation(specification, {exitCode, combined});
  return {
    id: specification.id,
    command: [process.execPath, script.path, ...specification.args],
    checker: binding(script),
    exitCode,
    outcome: "fail-closed-known-stale",
    expectedEvidence: specification.expected,
    normalizedDiagnostic: combined,
    acceptanceEffect: "none",
  };
}

export function validateWorkspaceTrackingOutput(output) {
  const normalized = normalizeProbeText(output);
  assert.equal(normalized, "?? migrations/course-g04-l10-vb-003/",
    "VB003 workspace Git tracking state changed; refuse this untracked-workspace gap epoch");
  return normalized;
}

async function readWorkspaceTracking(projectRoot) {
  const workspacePath = "migrations/course-g04-l10-vb-003";
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const absolute = resolveInsideRoot(projectRoot, workspacePath);
  const info = await lstat(absolute);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `${workspacePath} must be an ordinary non-symlink directory`);
  assert.equal(await realpath(absolute), absolute,
    `${workspacePath} resolves through a symlink`);
  assert.ok(absolute.startsWith(`${canonicalRoot}${path.sep}`));
  const args = [
    "status",
    "--porcelain=v1",
    "--untracked-files=normal",
    "--",
    workspacePath,
  ];
  const result = await execFile("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const statusLine = validateWorkspaceTrackingOutput(result.stdout);
  return {
    command: ["git", ...args],
    exitCode: 0,
    statusLine,
    observedState: "untracked-directory",
    claimScope: "live-git-porcelain-observation-not-git-binary-provenance",
  };
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const records = Object.fromEntries(await Promise.all(
    Object.entries(INPUTS).map(async ([key, specification]) =>
      [key, await readStable(projectRoot, key, specification)]),
  ));
  const probes = [];
  for (const specification of PROBE_SPECS) {
    probes.push(await runProbe(projectRoot, records, specification));
  }
  const workspaceTracking = await readWorkspaceTracking(projectRoot);
  return {projectRoot, records, probes, workspaceTracking};
}

function preimageSetSha256(inputBindings) {
  const payload = Object.values(inputBindings)
    .sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    .map(({path: itemPath, sha256: digest}) => `${itemPath}\0${digest}\n`)
    .join("");
  return sha256(payload);
}

function proposedNestedKeyframes(coverage) {
  const reasons = new Map([
    [1, ["initial-one-indexed-frame", "soundstream-head-frame"]],
    [3, ["glossary-button-placement", "clip-depth-placement"]],
    [4, ["first-soundstream-block"]],
    [51, ["glossary-button-placement", "clip-depth-placement"]],
    [130, ["clip-depth-placement"]],
    [203, ["last-soundstream-block", "script-stop-state", "terminal-structural-frame"]],
  ]);
  const requirements = coverage.requirements.filter(({frameDomainId}) =>
    frameDomainId === "sprite-120");
  assert.equal(requirements.length, 2,
    "Expected one EN and one ES sprite-120 coverage requirement");
  return requirements.flatMap((requirement) => [...reasons].map(([frame, frameReasons]) => ({
    frame,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    timeMs: Number((((frame - 1) / 12) * 1000).toFixed(6)),
    scenario: requirement.scenario,
    language: requirement.language,
    kind: frame === 1
      ? "structural-specification-initial"
      : frame === 203
        ? "structural-specification-terminal"
        : "structural-specification-transition",
    structuralReasons: frameReasons,
    runtimeReachability: "unresolved",
    baselineFile: null,
    baselineSha256: null,
    implementationFile: null,
    implementationSha256: null,
    diffFile: null,
    diffSha256: null,
    normalizedRmse: null,
    timingResult: null,
    visualResult: null,
    reviewer: null,
    adoptionStatus: "candidate-only-do-not-write-current-keyframes",
  })));
}

function audioCueCandidate(row) {
  return {
    id: row.cue_id,
    language: row.language,
    sourceFile: row.source_file,
    sha256: row.sha256,
    startFrame: row.start_frame === "" ? null : Number(row.start_frame),
    startFrameDomainId: row.start_frame_domain_id || null,
    startSemantics: row.start_semantics,
    durationMs: Number(row.duration_ms),
    format: row.format,
    channels: Number(row.channels),
    sampleRateHz: Number(row.sample_rate_hz),
    sourceCharacterId: row.source_character_id || null,
    authority: "static-identity-only",
    spokenLanguageVerified: false,
    runtimeReachabilityVerified: false,
    synchronizationVerified: false,
    listeningAccepted: false,
  };
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  return sha256(canonicalJson(projection));
}

export function deriveReport(snapshot) {
  const {records} = snapshot;
  const migration = records.migration.document;
  const audioEvidence = records.audioRuntimeEvidence.document;
  const machineAudit = records.machineAudit.document;
  const coverage = records.coverage.document;
  const scenario = records.scenarioInventory.document;
  const disposition = records.frameDomainDisposition.document;
  const toolchain = records.toolchain.document;
  const l10V5 = records.l10TemplateV5.document;
  const audioCsv = parseCsv(records.audioInventory.text);
  const assetCsv = parseCsv(records.assetInventory.text);
  const keyframeCsv = parseCsv(records.keyframes.text);

  assert.equal(migration.animationId, ANIMATION_ID);
  assert.equal(migration.status, "preserved");
  assert.deepEqual(migration.audio.languages, ["und"]);
  assert.deepEqual(migration.audio.cues, []);
  assert.equal(audioCsv.rows.length, 2);
  assert.deepEqual([...new Set(audioCsv.rows.map(({language}) => language))].sort(),
    ["es", "und"]);
  assert.equal(assetCsv.rows.length, 1);
  assert.equal(keyframeCsv.rows.length, 8);
  assert.ok(keyframeCsv.rows.every(({frame_domain_id: id}) => id === "root"));
  assert.equal(disposition.summary.inventoryTimelineCount, 3);
  assert.equal(disposition.summary.enumeratedTimelineCount, 3);
  assert.equal(disposition.summary.dispositionCounts.unresolved, 0);
  assert.equal(coverage.requirements.length, 4);
  assert.ok(coverage.requirements.every(({baselineAuthority}) =>
    baselineAuthority === "unresolved"));
  assert.ok(coverage.requirements.every(({capturedFrameCount}) =>
    capturedFrameCount === 0));
  assert.equal(scenario.authoritativeRuntimeEvidence.length, 0);
  assert.equal(l10V5.templateStable, false);
  assert.equal(l10V5.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(l10V5.currentFormalState.reviewAndRelease.atomicPublished, false);
  assert.equal(records.sourceSwf.sha256, migration.source.swfSha256);
  assert.equal(records.sourceFla.sha256, migration.source.flaSha256);
  assert.equal(records.externalAudioMp3.sha256,
    audioEvidence.externalAudio.exactAssociations[0].observedSha256);

  const definitionTypeCounts = machineAudit.findings.swfmill.categories;
  const definitionCounts = {
    fonts: definitionTypeCounts.fontDefinitions.DefineFont2,
    texts: machineAudit.findings.swfmill.tagCounts.DefineText,
    shapes: machineAudit.findings.swfmill.tagCounts.DefineShape +
      machineAudit.findings.swfmill.tagCounts.DefineShape3,
    buttons: machineAudit.findings.swfmill.tagCounts.DefineButton2,
    sprites: machineAudit.findings.swfmill.tagCounts.DefineSprite,
  };
  definitionCounts.total = Object.values(definitionCounts)
    .reduce((sum, value) => sum + value, 0);
  assert.deepEqual(definitionCounts,
    {fonts: 6, texts: 98, shapes: 11, buttons: 3, sprites: 2, total: 120});

  const fontCandidates = [
    {characterId: 1, name: "Bauhaus Md BT", style: "regular", glyphCount: 31},
    {characterId: 3, name: "Ensemble SSi", style: "regular", glyphCount: 18},
    {characterId: 17, name: "Stefa Display SSi", style: "regular", glyphCount: 10},
    {characterId: 40, name: "Terminus Black SSi", style: "regular", glyphCount: 1},
    {characterId: 62, name: "Arial", style: "regular", glyphCount: 2},
    {characterId: 92, name: "Bauhaus Md BT", style: "bold", glyphCount: 1},
  ];
  for (const font of fontCandidates) {
    assert.ok(records.brief.text.includes(`Character ${font.characterId}: \`${font.name}\``),
      `Brief no longer contains font character ${font.characterId}`);
  }
  const clippingCandidates = [
    {timelineId: "sprite-120", characterId: 6, frame: 3, depth: 1, clipDepth: 8},
    {timelineId: "sprite-120", characterId: 12, frame: 51, depth: 9, clipDepth: 14},
    {timelineId: "sprite-120", characterId: 42, frame: 130, depth: 15, clipDepth: 17},
  ];
  for (const clip of clippingCandidates) {
    const fragment = `character ${clip.characterId} at frame ${clip.frame}/depth ${clip.depth}/clipDepth ${clip.clipDepth}`;
    assert.ok(records.brief.text.includes(fragment),
      `Brief no longer contains clipping evidence ${fragment}`);
  }

  const externalDependencies = [
    "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")",
    "_global.KeyAttribute",
    "_root.DoHyperLinks()",
    "_root.animation_mc.animation.stop()",
    "_root.boolSendPageHLAClickRecord",
    "original lesson-shell Spanish audio play/stop controls",
  ];
  const dependencyEvidenceNeedles = [
    "_global.KeyAttribute",
    "_root.DoHyperLinks",
    "_root.animation_mc.animation",
    "_root.boolSendPageHLAClickRecord",
  ];
  for (const dependency of dependencyEvidenceNeedles) {
    assert.ok(records.brief.text.includes(dependency),
      `Brief no longer contains dependency ${dependency}`);
  }

  const audioCues = audioCsv.rows.map(audioCueCandidate);
  assert.equal(audioCues[0].sha256,
    audioEvidence.externalAudio.exactAssociations[0].observedSha256);
  assert.equal(audioCues[1].sha256, migration.source.swfSha256);
  const nestedKeyframes = proposedNestedKeyframes(coverage);
  assert.equal(nestedKeyframes.length, 12);

  const proposedChanges = [
    {
      id: "P1-A-audio-manifest-triangle",
      severity: "P1",
      current: {
        languages: migration.audio.languages,
        cues: migration.audio.cues,
      },
      proposed: {
        jsonPointers: {
          "/audio/languages": ["es", "und"],
          "/audio/cues": audioCues,
        },
      },
      evidence: ["audioInventory", "audioRuntimeEvidence", "languageAudioBinding"],
      boundary:
        "Static cue identity only. Spoken language, reachability, synchronization, listening, human review, owner review, and acceptance remain unresolved.",
    },
    {
      id: "P1-B-source-definition-and-host-dependency-manifest",
      severity: "P1",
      current: {
        assetsRequired: migration.audit.assetsRequired,
        assetsNotRequiredReason: migration.audit.assetsNotRequiredReason,
        fonts: migration.runtime.fonts,
        masks: migration.audit.masks,
        externalDependencies: migration.runtime.externalDependencies,
        canonicalAssetInventoryRows: assetCsv.rows.length,
      },
      proposed: {
        jsonPointers: {
          "/audit/assetsRequired": true,
          "/audit/assetsNotRequiredReason": "",
          "/runtime/fonts": fontCandidates,
          "/audit/masks": clippingCandidates,
          "/runtime/externalDependencies": externalDependencies,
        },
        machineArtifactCandidate: {
          path: "migrations/course-g04-l10-vb-003/audit/machine/swf-definition-inventory.csv",
          rowCount: 120,
          definitionTypeCounts: definitionCounts,
          materializedByThisReport: false,
          rule:
            "Generate from the exact gzip SWF XML/tag evidence with character ID, tag type, tag-payload SHA-256, provenance, and unresolved authoring/runtime boundary; do not hand-author 120 rows.",
        },
      },
      evidence: ["brief", "machineAudit", "scenarioInventory", "hostEntryAntecedent", "glossaryContracts"],
      boundary:
        "Candidate manifest reconciliation only; no FLA symbol name, runtime reachability, renderer transformation, or visual completeness is inferred.",
    },
    {
      id: "P1-C-static-placeholder-reconciliation",
      severity: "P1",
      current: {
        confidence: migration.confidence,
        complexity: migration.runtime.complexity,
        ruffle: migration.toolVersions.ruffle,
        browser: migration.toolVersions.browser,
        forensicReferenceVersion: migration.forensicReference.version,
        baselineViewport: migration.baseline.viewport,
        defaultScenarioDescription: migration.scenarios[0].description,
        nestedScenarioKind: migration.scenarios[1].kind,
      },
      proposed: {
        jsonPointers: {
          "/confidence": "medium",
          "/runtime/complexity": "nested-interactive-host-dependent-audio-bearing-as1-2",
          "/toolVersions/ruffle": toolchain.flashForensics.ruffle.npmVersion,
          "/toolVersions/browser": `Playwright ${toolchain.mediaAndValidation.playwright}; ${toolchain.mediaAndValidation.chromium}`,
          "/forensicReference/version": toolchain.flashForensics.ruffle.npmVersion,
          "/baseline/viewport": {width: 800, height: 600, deviceScaleFactor: 1},
          "/scenarios/0/description":
            "Source-static root frames 1-10 with structural stops at 1 and 6 and label begin at 6; natural playback remains unresolved.",
          "/scenarios/1/kind": "interactive",
        },
        retainedNestedScenarioFields: {
          reachabilityAuthority: migration.scenarios[1].reachabilityAuthority,
          authoritativeRuntimeEntryEstablished:
            migration.scenarios[1].authoritativeRuntimeEntryEstablished,
          strictAcceptanceEffect: migration.scenarios[1].strictAcceptanceEffect,
        },
      },
      evidence: ["migration", "machineAudit", "scenarioInventory", "toolchain"],
      boundary:
        "Tool and viewport metadata do not establish that a baseline exists; Ruffle remains forensic-only.",
    },
    {
      id: "P1-D-nested-structural-keyframe-candidates",
      severity: "P1",
      current: {
        rowCount: keyframeCsv.rows.length,
        frameDomains: [...new Set(keyframeCsv.rows.map((row) => row.frame_domain_id))],
      },
      proposed: {
        candidateRowCount: nestedKeyframes.length,
        rows: nestedKeyframes,
        adoptionStatus:
          "candidate-only; preserve current keyframes.csv until a guarded adopter and evidence policy authorize structural nested rows",
      },
      evidence: ["brief", "coverage", "scenarioInventory", "frameDomainDisposition"],
      boundary:
        "These are source-static frame selections, not natural traces, authoritative baseline captures, renderer frames, differences, RMSE results, or reviews.",
    },
    {
      id: "P2-brief-and-checklist-static-hygiene",
      severity: "P2",
      current: {
        briefRetainsScaffoldInstructions:
          records.brief.text.includes("Summarize object phases") &&
          records.brief.text.includes("Summarize extracted"),
        checklistCheckedCount: l10V5.currentFormalState.reviewAndRelease.checklistChecked,
        checklistTotal: l10V5.currentFormalState.reviewAndRelease.checklistTotal,
      },
      proposed: {
        briefAction:
          "Replace the two remaining scaffold instruction sentences with evidence-bound factual introductions in a future exact-preimage adopter.",
        candidateChecklistPredicates: [
          "source byte preservation",
          "source SHA-256 and provenance",
          "asset and placement identity",
          "missing-source documentation",
          "native root metadata",
          "requirement identity",
          "evidence-authority boundaries",
        ],
        checklistMutationAuthorized: false,
      },
      evidence: ["brief", "l10TemplateV5"],
      boundary:
        "No checklist box is checked by this report; external dependency, complete asset, interaction, runtime, behavior, visual, audio, review, strict, and release predicates remain open.",
    },
  ];

  const inputBindings = Object.fromEntries(Object.keys(records).sort()
    .map((key) => [key, binding(records[key])]));
  const patchProjection = {
    animationId: ANIMATION_ID,
    preimageSetSha256: preimageSetSha256(inputBindings),
    proposedChanges,
  };
  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-vb003-static-specification-gap-closure-v1",
    evidenceDate: "2026-08-04",
    status: "acceptance-neutral-static-gap-plan-do-not-apply",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    decision: "DO_NOT_APPLY",
    workspaceModified: false,
    sourceModified: false,
    rendererAdopted: false,
    authorityBoundary: {
      readOnlyRecomputation: true,
      exactPreimageBound: true,
      currentWorkspaceIsUntracked: snapshot.workspaceTracking.observedState ===
        "untracked-directory",
      workspaceTrackingObservation: snapshot.workspaceTracking,
      createsRuntimeEvidence: false,
      launchesOriginalRuntime: false,
      createsBaseline: false,
      createsRenderer: false,
      changesChecklist: false,
      changesMigrationStatus: false,
      changesLedgers: false,
      authorizesBatchAdmission: false,
      authorizesIntegrationOrPublication: false,
      rule:
        "This successor records a guarded candidate patch. A separate reviewed adopter must require the exact preimage set and must preserve all runtime, fidelity, review, and release boundaries.",
    },
    currentStaticFacts: {
      source: {
        swf: migration.source.swf,
        swfSha256: migration.source.swfSha256,
        fla: migration.source.fla,
        flaSha256: migration.source.flaSha256,
        sourceHashVerified: machineAudit.source.hashMatches,
        authoringSourceHashVerified: machineAudit.authoringSource.hashMatches,
        bindingAuthority: "direct-ordinary-file-read-and-sha256",
        externalAudioMp3Sha256: records.externalAudioMp3.sha256,
      },
      nativeRoot: {
        stage: migration.runtime.stage,
        fps: migration.runtime.fps,
        frameCount: migration.runtime.frameCount,
        durationMs: migration.runtime.durationMs,
        actionScriptVersion: migration.runtime.actionScriptVersion,
      },
      frameDomains: {
        inventoryTimelineCount: disposition.summary.inventoryTimelineCount,
        enumeratedTimelineCount: disposition.summary.enumeratedTimelineCount,
        unresolvedTimelineCount: disposition.summary.dispositionCounts.unresolved,
        declaration: migration.implementation.frameDomains,
        doNotReopenEnumeration: true,
      },
      definitions: definitionCounts,
      audio: {
        manifestLanguages: migration.audio.languages,
        inventoriedLanguages: audioEvidence.inventory.inventoriedLanguages,
        inventoryRows: audioCsv.rows.length,
        authoritativeListeningComplete:
          audioEvidence.acceptance.authoritativeListeningComplete,
        synchronizationComplete: audioEvidence.acceptance.synchronizationComplete,
        strictAudioAcceptance: audioEvidence.acceptance.strictAudioAcceptance,
      },
      coverage: {
        requirementCount: coverage.requirements.length,
        frameIdentityCount: coverage.requirements.reduce((sum, requirement) =>
          sum + requirement.requiredRange.lastFrame - requirement.requiredRange.firstFrame + 1, 0),
        authoritativeCapturedFrameCount: coverage.requirements.reduce((sum, requirement) =>
          sum + requirement.capturedFrameCount, 0),
      },
      template: {
        stable: l10V5.templateStable,
        strictCompleteMembers: l10V5.currentFormalState.reviewAndRelease.strictCompleteMembers,
        releaseMembers: l10V5.scope.memberCount,
        published: l10V5.currentFormalState.reviewAndRelease.atomicPublished,
      },
    },
    proposedChanges,
    guardedAdopterContract: {
      required: true,
      implementedByThisReport: false,
      requiredPreimageSetSha256: patchProjection.preimageSetSha256,
      candidatePatchFingerprintSha256: sha256(canonicalJson(patchProjection)),
      noClobber: true,
      revalidateAfterWrite: true,
      requiredReview: "independent exact-preimage and semantic-boundary review",
      forbiddenEffects: EFFECT_KEYS,
    },
    wholeLessonFreshnessAdvisory: {
      status: "fail-closed-stale-downstream-projections-detected",
      affectedMembers: ["course-g04-l10-ts-007", "course-g04-l10-ts-008"],
      probes: snapshot.probes,
      v5ScopeBoundary:
        "The exact v5 JSON is bound here, but this report does not treat that artifact as proof that these three separate semantic projection checks are fresh. A separately successful v5 --check cannot expand beyond the checks that v5 actually executes.",
      probeCodeBindingBoundary: {
        scope: "three-direct-checker-entrypoints-plus-selected-output-preimages",
        recursiveLocalDependenciesHashBound: false,
        completeFortySevenMemberInputClosureHashBound: false,
        packageRuntimeProvenanceBound: false,
        rule:
          "The live read-only probes establish the observed fail-closed diagnostics for this exact selected epoch; they do not claim a recursive semantic-code or complete 47-member provenance closure.",
      },
      remediationAuthorizedByThisReport: false,
      applyAttempted: false,
    },
    deferredEvidence: [
      "Named Adobe Animate 2021 FLA authoring audit on a read-only working copy",
      "Authorized original-runtime natural entry, ordered steps, targets, checkpoints, terminal state, and Replay reset vector",
      "Runtime parent entry state and parentEntryFrame semantics",
      "Authoritative EN/ES baseline execution receipts, capture manifests, and PNGs",
      "Spoken-language listening, cue reachability, start-stop-sync, and Replay audio behavior",
      "Formal renderer, route, component, registry, timeline module, and behavior tests",
      "Full-frame visual comparison, normalized RMSE, timing, responsive, accessibility, and product QA",
      "Named engineering, human visual, audio, and owner decisions",
      "Strict completion, ledger admission, atomic L10 integration, Grade 4 batch admission, and publication",
    ],
    acceptanceEffects: Object.fromEntries(EFFECT_KEYS.map((key) => [key, false])),
    inputBindings,
    preimageSetSha256: patchProjection.preimageSetSha256,
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType,
    "g4-l10-vb003-static-specification-gap-closure-v1");
  assert.equal(report.status, "acceptance-neutral-static-gap-plan-do-not-apply");
  assert.equal(report.releaseId, RELEASE_ID);
  assert.equal(report.animationId, ANIMATION_ID);
  assert.equal(report.decision, "DO_NOT_APPLY");
  assert.equal(report.workspaceModified, false);
  assert.equal(report.sourceModified, false);
  assert.equal(report.rendererAdopted, false);
  assert.equal(report.authorityBoundary.currentWorkspaceIsUntracked, true);
  assert.equal(report.authorityBoundary.workspaceTrackingObservation.statusLine,
    "?? migrations/course-g04-l10-vb-003/");
  assert.equal(report.currentStaticFacts.frameDomains.inventoryTimelineCount, 3);
  assert.equal(report.currentStaticFacts.frameDomains.enumeratedTimelineCount, 3);
  assert.equal(report.currentStaticFacts.frameDomains.unresolvedTimelineCount, 0);
  assert.equal(report.currentStaticFacts.frameDomains.doNotReopenEnumeration, true);
  assert.equal(report.currentStaticFacts.definitions.total, 120);
  assert.equal(report.currentStaticFacts.source.bindingAuthority,
    "direct-ordinary-file-read-and-sha256");
  assert.equal(report.currentStaticFacts.audio.inventoryRows, 2);
  assert.deepEqual(report.currentStaticFacts.audio.inventoriedLanguages, ["es", "und"]);
  assert.equal(report.currentStaticFacts.audio.authoritativeListeningComplete, false);
  assert.equal(report.currentStaticFacts.coverage.requirementCount, 4);
  assert.equal(report.currentStaticFacts.coverage.frameIdentityCount, 426);
  assert.equal(report.currentStaticFacts.coverage.authoritativeCapturedFrameCount, 0);
  assert.equal(report.currentStaticFacts.template.stable, false);
  assert.equal(report.currentStaticFacts.template.strictCompleteMembers, 0);
  assert.equal(report.currentStaticFacts.template.releaseMembers, 47);
  assert.equal(report.currentStaticFacts.template.published, false);
  assert.deepEqual(report.proposedChanges.map(({id}) => id), [
    "P1-A-audio-manifest-triangle",
    "P1-B-source-definition-and-host-dependency-manifest",
    "P1-C-static-placeholder-reconciliation",
    "P1-D-nested-structural-keyframe-candidates",
    "P2-brief-and-checklist-static-hygiene",
  ]);
  const nestedRows = report.proposedChanges.find(({id}) =>
    id === "P1-D-nested-structural-keyframe-candidates").proposed.rows;
  assert.equal(nestedRows.length, 12);
  assert.ok(nestedRows.every((row) => row.runtimeReachability === "unresolved"));
  assert.ok(nestedRows.every((row) => [
    row.baselineFile,
    row.baselineSha256,
    row.implementationFile,
    row.implementationSha256,
    row.diffFile,
    row.diffSha256,
    row.normalizedRmse,
    row.timingResult,
    row.visualResult,
    row.reviewer,
  ].every((value) => value === null)));
  assert.equal(report.wholeLessonFreshnessAdvisory.probes.length, 3);
  assert.ok(report.wholeLessonFreshnessAdvisory.probes.every(({exitCode}) =>
    exitCode !== 0));
  assert.ok(report.wholeLessonFreshnessAdvisory.probes.every(({outcome}) =>
    outcome === "fail-closed-known-stale"));
  assert.equal(report.wholeLessonFreshnessAdvisory.remediationAuthorizedByThisReport,
    false);
  assert.equal(report.guardedAdopterContract.implementedByThisReport, false);
  assert.ok(SHA256.test(report.guardedAdopterContract.requiredPreimageSetSha256));
  assert.ok(SHA256.test(report.guardedAdopterContract.candidatePatchFingerprintSha256));
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(Object.keys(report.inputBindings).length, Object.keys(INPUTS).length);
  assert.equal(report.preimageSetSha256,
    preimageSetSha256(report.inputBindings));
  assert.ok(SHA256.test(report.reportFingerprintSha256));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

async function assertSnapshotCurrent(snapshot) {
  for (const [key, specification] of Object.entries(INPUTS)) {
    const current = await readStable(snapshot.projectRoot, key, specification);
    assert.deepEqual(binding(current), binding(snapshot.records[key]),
      `${specification.path} changed after snapshot`);
  }
  const probes = [];
  for (const specification of PROBE_SPECS) {
    probes.push(await runProbe(snapshot.projectRoot, snapshot.records, specification));
  }
  assert.deepEqual(probes, snapshot.probes,
    "L10 whole-lesson freshness probe results changed during report generation");
  assert.deepEqual(await readWorkspaceTracking(snapshot.projectRoot),
    snapshot.workspaceTracking,
  "VB003 workspace Git tracking state changed during report generation");
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    "Expected --write or --check; --apply is deliberately unsupported");
  return args[0];
}

export async function writeNoClobber(absolute, contents) {
  try {
    const before = await lstat(absolute, {bigint: true});
    assert.ok(before.isFile() && !before.isSymbolicLink(),
      `${absolute} must be an ordinary non-symlink file`);
    assert.equal(await realpath(absolute), absolute,
      `${absolute} resolves through a symlink`);
    const current = await readFile(absolute, "utf8");
    const after = await lstat(absolute, {bigint: true});
    assert.equal(statIdentity(after), statIdentity(before),
      `${absolute} changed while checking no-clobber output`);
    assert.equal(current, contents,
      `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, {flag: "wx", mode: 0o644});
  const written = await lstat(absolute);
  assert.ok(written.isFile() && !written.isSymbolicLink(),
    `${absolute} write did not create an ordinary non-symlink file`);
  assert.equal(await realpath(absolute), absolute,
    `${absolute} written output resolves through a symlink`);
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  const contents = `${JSON.stringify(report, null, 2)}\n`;
  await assertSnapshotCurrent(snapshot);
  const output = await resolveSafeOutputPath(projectRoot, REPORT_PATH);
  if (mode === "--write") {
    const disposition = await writeNoClobber(output, contents);
    assert.equal(await resolveSafeOutputPath(projectRoot, REPORT_PATH), output);
    await assertSnapshotCurrent(snapshot);
    return {mode, report, disposition};
  }
  assert.equal(await readFile(output, "utf8"), contents,
    `${REPORT_PATH} is stale`);
  assert.equal(await resolveSafeOutputPath(projectRoot, REPORT_PATH), output);
  await assertSnapshotCurrent(snapshot);
  return {mode, report, checked: REPORT_PATH};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(
      `${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_PATH}\n`,
    );
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
