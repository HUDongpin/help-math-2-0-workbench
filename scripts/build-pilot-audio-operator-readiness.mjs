#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, mkdir, readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  AUDIO_HUMAN_ATTESTATION,
  AUDIO_LISTENING_REVIEW_SCOPE,
  buildAudioListeningAcceptanceTemplate,
  parseAudioInventory,
} from "./audio-listening-acceptance.mjs";
import {
  buildPilotAudioSessionReadiness,
  inspectProjectorRuntime,
} from "./scaffold-audio-runtime-session-kit.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_KIT_ROOT = "work/audio-runtime-session-kits-20260724-current-v4";
const OUTPUT_JSON = "reports/pilot-audio-operator-readiness.json";
const OUTPUT_MARKDOWN = "reports/pilot-audio-operator-readiness.md";
const STRICT_REPORT = "reports/pilot-strict-acceptance.json";
const G4_L3_AUDIT = "reports/g4-l3-machine-source-audits.json";
const RUNBOOK = "docs/PILOT_ACCEPTANCE_RUNBOOK.md";
const SESSION_SCHEMA = "schemas/original-runtime-audio-listening-session.schema.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const HUMAN_ONLY_REASON_PATTERNS = Object.freeze([
  /^Audio listening acceptance status is pending, not accepted\.$/,
  /^Audio cue .+ spokenContentAndLanguage is not pass\.$/,
  /^Audio cue .+ naturalHostTraversal is not pass\.$/,
  /^Audio cue .+ startStopAndSynchronization is not pass\.$/,
  /^Audio cue .+ replayReset is not pass\.$/,
  /^Audio cue .+ has no listening\/traversal evidence\.$/,
  /^Audio listening summary\.everyCueListened must be true\.$/,
  /^Audio listening summary\.everyReachableHostStateTraversed must be true\.$/,
  /^Audio listening summary\.synchronizationAccepted must be true\.$/,
  /^Audio listening summary\.replayAccepted must be true\.$/,
  /^Audio listening review\.decision must be accepted\.$/,
  /^Audio listening review requires a structurally complete named-human identity and contact\/owner ID\.$/,
  /^Audio listening review requires a valid ISO signedAt\.$/,
]);

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function descriptor(projectRoot, relativePath) {
  const file = path.join(projectRoot, relativePath);
  const bytes = await readFile(file);
  return {path: relativePath, bytes: bytes.length, sha256: digest(bytes)};
}

function assertSafeRelativeFile(relativePath, prefix, label) {
  if (
    typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath) ||
    relativePath.includes("\\") || portable(path.normalize(relativePath)) !== relativePath ||
    relativePath === ".." || relativePath.startsWith("../") || !relativePath.startsWith(prefix)
  ) throw new Error(`${label} is outside ${prefix}: ${relativePath || "missing"}`);
}

async function verifyHashBoundFile(projectRoot, item, prefix, label) {
  assertSafeRelativeFile(item?.path || item?.file, prefix, label);
  const relativePath = item.path || item.file;
  if (!SHA256_PATTERN.test(item.sha256 || "")) throw new Error(`${label} has a malformed SHA-256`);
  const file = path.join(projectRoot, relativePath);
  const info = await stat(file);
  if (!info.isFile()) throw new Error(`${label} is not a regular file: ${relativePath}`);
  if (item.bytes !== undefined && Number(item.bytes) !== info.size) throw new Error(`${label} byte length is stale: ${relativePath}`);
  const observed = await sha256File(file);
  if (observed !== item.sha256) throw new Error(`${label} SHA-256 is stale: ${relativePath}`);
  return {path: relativePath, bytes: info.size, sha256: observed};
}

export function isHumanOnlyAudioReason(reason) {
  return HUMAN_ONLY_REASON_PATTERNS.some((pattern) => pattern.test(reason));
}

export function classifyPilotAudioOperatorReadiness({strictGateStatus, machineStatus, reasons, pendingTemplateCurrent, sessionFileCount, runtimeArtifactFileCount}) {
  if (strictGateStatus === "pass" && machineStatus === "not-applicable-source-bound") {
    return {
      disposition: "no-listening-required-source-bound-no-audio",
      operatorReady: false,
      strictUnblockingPotential: "already-passes-audio-gate",
      machineOnlyStrictClosurePossible: false,
    };
  }
  if (machineStatus === "prepared-partial-non-unblocking") {
    return {
      disposition: "partial-human-session-possible-but-non-unblocking",
      operatorReady: pendingTemplateCurrent && sessionFileCount === 0 && runtimeArtifactFileCount === 0,
      readinessBoundary: "unsigned-template-and-hash-bindings-only; natural host reachability and listening remain human observations",
      strictUnblockingPotential: "none-until-missing-or-inconsistent-audio-scope-is-resolved",
      machineOnlyStrictClosurePossible: false,
    };
  }
  const humanOnlyReasons = reasons.length > 0 && reasons.every(isHumanOnlyAudioReason);
  if (
    strictGateStatus === "fail" && machineStatus === "prepared-unsigned-template" && humanOnlyReasons &&
    pendingTemplateCurrent && sessionFileCount === 0 && runtimeArtifactFileCount === 0
  ) {
    return {
      disposition: "unsigned-template-ready-for-named-human-original-runtime-listening",
      operatorReady: true,
      readinessBoundary: "unsigned-template-and-hash-bindings-only; natural host reachability and listening remain human observations",
      strictUnblockingPotential: "audio-gate-can-pass-only-after-valid-human-session-evidence-and-acceptance",
      machineOnlyStrictClosurePossible: false,
    };
  }
  return {
    disposition: "blocked-before-authoritative-listening",
    operatorReady: false,
    readinessBoundary: "no authoritative listening should begin until the listed machine/evidence blockers are resolved",
    strictUnblockingPotential: "none-until-listed-machine-or-evidence-blockers-are-resolved",
    machineOnlyStrictClosurePossible: false,
  };
}

export function cueOperatorContract({animationId, cue, template}) {
  const workspace = `migrations/${animationId}`;
  return {
    cue,
    unsignedTemplate: {path: template.file, sha256: template.sha256},
    finalSessionDestination: `${workspace}/${template.intendedEvidenceFile}`,
    runtimeEvidenceDirectory: `${workspace}/evidence/audio-runtime-sessions/`,
    requiredOrderedOperationEvents: ["activate", "start", "stop-or-complete", "replay", "start"],
    requiredHumanObservations: [
      "spokenContentAndLanguage",
      "naturalHostTraversal",
      "startStopAndSynchronization",
      "replayReset",
    ],
    permittedRuntimeArtifactKinds: [
      "lossless-runtime-capture",
      "append-only-original-runtime-log",
      "audio-waveform-capture",
    ],
    naturalHostNavigationScheduleStatus: "not-specified-by-the-unsigned-kit; the named human must reach and identify this cue through the original host",
  };
}

function pendingTemplateCurrent(expected, observed) {
  return canonicalJson(expected) === canonicalJson(observed);
}

async function countFiles(directory) {
  if (!await exists(directory)) return 0;
  const entries = await readdir(directory, {withFileTypes: true});
  return entries.filter((entry) => entry.isFile()).length;
}

export function validateG4L3AudioProjection(report) {
  const files = report?.audioInventory?.files;
  if (
    report?.acceptance?.acceptanceNeutral !== true || report?.acceptance?.strictGateChanges !== 0 ||
    report?.audioInventory?.uniqueFileCount !== 143 || report?.audioInventory?.languages?.en !== 60 ||
    report?.audioInventory?.languages?.es !== 83 || report?.audioInventory?.languages?.und !== 0 ||
    report?.audioInventory?.allPhysicalHashesVerified !== true || !Array.isArray(files) || files.length !== 143 ||
    new Set(files.map(({path: file}) => file)).size !== 143
  ) throw new Error("G4 L3 audit does not carry the expected acceptance-neutral 143-file (60 en / 83 es) audio projection");
  return files;
}

async function verifyG4L3AudioProjection({projectRoot, report}) {
  const files = validateG4L3AudioProjection(report);
  for (const [index, item] of files.entries()) {
    if (item.physicalHashVerified !== true) throw new Error(`G4 L3 audio file ${index + 1} is not marked physically verified`);
    await verifyHashBoundFile(projectRoot, item, "source-assets/flash/HELP MATH_ORIGINAL FILES/", `G4 L3 audio file ${index + 1}`);
  }
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function readinessMarkdown(report) {
  const pilotRows = report.pilots.map((pilot) => {
    const notes = [...pilot.technicalBlockers, ...pilot.machineNotes];
    return `| \`${pilot.animationId}\` | ${pilot.strictAudioGate} | ${pilot.operator.disposition} | ${pilot.cueCount} | ${markdownEscape(notes.length ? notes.join("; ") : "—")} |`;
  });
  const detailSections = report.pilots.map((pilot) => {
    const lines = [
      `### \`${pilot.animationId}\``,
      "",
      `- Disposition: \`${pilot.operator.disposition}\`.`,
      `- Strict audio gate: \`${pilot.strictAudioGate}\`; machine-only strict closure: \`false\`.`,
    ];
    if (pilot.authoritativeHost) lines.push(`- Exact original host: \`${pilot.authoritativeHost.path}\` (${pilot.authoritativeHost.sha256}).`);
    if (pilot.kit) lines.push(`- Unsigned kit: \`${pilot.kit.path}\` (${pilot.kit.manifestSha256}).`);
    if (pilot.technicalBlockers.length) lines.push(`- Retained blockers: ${pilot.technicalBlockers.join("; ")}`);
    if (pilot.machineNotes.length) lines.push(`- Machine disposition note: ${pilot.machineNotes.join("; ")}`);
    if (pilot.machineAuditRequirementsStillPending.length) {
      lines.push("- Original-runtime requirements still pending:", ...pilot.machineAuditRequirementsStillPending.map((item) => `  - ${item}`));
    }
    if (pilot.cues.length) {
      lines.push(
        "",
        "| Cue | Lang | Duration | Start semantics | Source SHA-256 | Final session destination |",
        "|---|---:|---:|---|---|---|",
        ...pilot.cues.map(({cue, finalSessionDestination}) =>
          `| \`${cue.cueId}\` | ${cue.language} | ${cue.durationMs} ms | ${cue.startSemantics} | \`${cue.sha256}\` | \`${finalSessionDestination}\` |`),
      );
    }
    return lines.join("\n");
  });
  return `# Pilot audio original-runtime operator readiness

Status: **acceptance-neutral; no listening or human decision recorded**

This report re-verifies the current 16-pilot machine audio projection, every untouched v4 unsigned session kit, the bound Adobe Projector executable, and the physically hash-verified G4 L3 audio catalog. It does not say that anyone listened to audio.

## Current result

- Strict audio gate: ${report.summary.strictAudioPassCount}/16 pass only because two pilots have source-bound no-audio negative proof.
- Fully scoped unsigned kits prepared for a named-human session attempt: ${report.summary.fullyScopedUnsignedKitPilotCount} pilots / ${report.summary.fullyScopedUnsignedKitCueCount} cues.
- Partial, non-unblocking kit: ${report.summary.partialNonUnblockingPilotCount} pilot / ${report.summary.partialNonUnblockingCueCount} cue.
- Blocked before listening: ${report.summary.blockedBeforeListeningPilotCount} pilot.
- Machine-only audio strict closures available now: **0**.

| Pilot | Audio gate | Operator disposition | Cues | Technical blockers / machine notes |
|---|---:|---|---:|---|
${pilotRows.join("\n")}

## Human-only execution contract

For each pilot marked \`unsigned-template-ready-for-named-human-original-runtime-listening\`, the named human operator must:

1. Re-run the exact v4 kit check command below, then use the hash-bound Adobe Flash Player Projector and exact original host listed for that pilot. Do not use the JavaScript rewrite as the listening source.
2. Reach every cue through the original host's natural controls and personally listen. For each cue, record monotonic \`activate → start → stop-or-complete → replay → start\` events and decide spoken content/language, natural host traversal, synchronization, and Replay reset from direct observation.
3. Place the completed session and all allowed runtime artifacts under the listed \`migrations/<id>/evidence/audio-*\` destinations. Do **not** edit the files inside the v4 kit: they must remain exact unsigned templates so \`--check\` stays meaningful.
4. Replace template-only placeholders with actual values, choose either \`stop\` or \`complete\`, build the SHA-256 event chain, bind the final runtime-toolchain receipt, and ensure the final session conforms to \`${report.bindings.originalRuntimeSessionSchema.path}\` (including removing template-only properties not admitted by the final schema).
5. Within each pilot, use the same real named-human identity in every cue session and its acceptance record. Only after every declared cue and reachable host state has actually passed may that person set the acceptance summary/decision and use the exact attestation and scope shown in the runbook.

\`\`\`bash
${report.exactKitCheckCommand}
\`\`\`

The partial acute-angle English session may be performed, but it cannot pass strict audio while the Spanish source and cue projection remain unresolved. The FQ02 Review pilot has no valid cue inventory or kit; do not start listening for it yet.

## Scope boundary for the G4 L3 lesson audio

The G4 L3 static audit physically re-hashes ${report.g4L3AudioScope.uniqueFileCount} catalog-associated MP3 files (${report.g4L3AudioScope.languages.en} en / ${report.g4L3AudioScope.languages.es} es). This proves file identity only. It does not establish cue mapping, start frames, reachability, listening, synchronization, or Replay for the future 39-page lesson. Exactly ${report.g4L3AudioScope.overlapWithPilotExternalCueCount} file overlaps the current pilot external-cue set; the 143-file lesson catalog must not be reported as 143 accepted pilot cues.

## Per-pilot operator cards

${detailSections.join("\n\n")}
`;
}

async function materialize({projectRoot, relativePath, content, check}) {
  const file = path.join(projectRoot, relativePath);
  if (check) {
    if (!await exists(file)) throw new Error(`${relativePath} is missing`);
    if (await readFile(file, "utf8") !== content) throw new Error(`${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, content);
}

export async function buildPilotAudioOperatorReadiness({
  projectRoot = PROJECT_ROOT,
  kitRootRelative = DEFAULT_KIT_ROOT,
  check = false,
} = {}) {
  assertSafeRelativeFile(`${portable(kitRootRelative)}/sentinel`, "work/audio-runtime-session-kits", "audio kit root");
  const kitRoot = path.join(projectRoot, kitRootRelative);
  const runtime = await inspectProjectorRuntime();
  const readiness = await buildPilotAudioSessionReadiness({projectRoot, outputRoot: kitRoot, runtime, check: true});
  const [strictBytes, g4Bytes] = await Promise.all([
    readFile(path.join(projectRoot, STRICT_REPORT)),
    readFile(path.join(projectRoot, G4_L3_AUDIT)),
  ]);
  const strict = JSON.parse(strictBytes.toString("utf8"));
  const g4 = JSON.parse(g4Bytes.toString("utf8"));
  await verifyG4L3AudioProjection({projectRoot, report: g4});
  if (strict?.summary?.pilots !== 16 || readiness.report.summary.pilotCount !== 16) throw new Error("pilot reports do not contain exactly 16 pilots");
  const strictById = new Map(strict.pilots.map((pilot) => [pilot.animationId, pilot]));
  const g4Paths = new Set(g4.audioInventory.files.map(({path: file}) => file));
  const pilotExternalCuePaths = new Set();
  const pilots = [];

  for (const item of readiness.report.pilots) {
    const strictPilot = strictById.get(item.animationId);
    if (!strictPilot) throw new Error(`${item.animationId}: absent from strict report`);
    const strictGate = strictPilot.gates.find(({id}) => id === "audio-hash-listening-sync");
    if (!strictGate) throw new Error(`${item.animationId}: strict audio gate is absent`);
    const workspaceRelative = `migrations/${item.animationId}`;
    const workspace = path.join(projectRoot, workspaceRelative);
    const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
    const inventoryText = await readFile(path.join(workspace, manifest.audio?.inventoryFile || "audio-inventory.csv"), "utf8");
    const inventoryRows = parseAudioInventory(inventoryText).rows;
    for (const row of inventoryRows) if (row.source_file !== manifest.source.swf) pilotExternalCuePaths.add(row.source_file);

    let acceptance = null;
    let acceptanceBinding = null;
    let templateIsCurrent = manifest.audio?.required !== true;
    const acceptancePath = path.join(workspace, "evidence", "audio-listening-acceptance.json");
    if (await exists(acceptancePath)) {
      const acceptanceBytes = await readFile(acceptancePath);
      acceptance = JSON.parse(acceptanceBytes.toString("utf8"));
      acceptanceBinding = {
        path: `${workspaceRelative}/evidence/audio-listening-acceptance.json`,
        bytes: acceptanceBytes.length,
        sha256: digest(acceptanceBytes),
        status: acceptance.status,
      };
      if (manifest.audio?.required === true) {
        templateIsCurrent = pendingTemplateCurrent(await buildAudioListeningAcceptanceTemplate({workspace}), acceptance);
      }
    }
    const sessionFileCount = await countFiles(path.join(workspace, "evidence", "audio-listening-sessions"));
    const runtimeArtifactFileCount = await countFiles(path.join(workspace, "evidence", "audio-runtime-sessions"));
    const operator = classifyPilotAudioOperatorReadiness({
      strictGateStatus: strictGate.status,
      machineStatus: item.status,
      reasons: strictGate.reasons || [],
      pendingTemplateCurrent: templateIsCurrent,
      sessionFileCount,
      runtimeArtifactFileCount,
    });

    let kit = null;
    let authoritativeHost = null;
    let cues = [];
    let machineAuditRequirementsStillPending = [];
    if (item.kit) {
      const kitManifestRelative = `${item.kit.path}/kit-manifest.json`;
      const kitManifestBytes = await readFile(path.join(projectRoot, kitManifestRelative));
      if (digest(kitManifestBytes) !== item.kit.manifestSha256) throw new Error(`${item.animationId}: kit manifest hash differs from readiness report`);
      const kitManifest = JSON.parse(kitManifestBytes.toString("utf8"));
      if (kitManifest.status !== "unsigned-template-only" || kitManifest.strictAcceptanceEffect !== "none" || kitManifest.humanOrOwnerAcceptanceRecorded !== false) {
        throw new Error(`${item.animationId}: kit is not acceptance-neutral`);
      }
      kit = {path: item.kit.path, manifestSha256: item.kit.manifestSha256, runtime: kitManifest.runtime};
      authoritativeHost = {path: kitManifest.bindings.authoritativeHost.file, sha256: kitManifest.bindings.authoritativeHost.sha256};
      machineAuditRequirementsStillPending = kitManifest.machineAuditRequirementsStillPending || [];
      cues = kitManifest.cues.map((cue) => {
        const template = kitManifest.templates.listeningSessions.find((candidate) => candidate.cueId === cue.cueId && candidate.language === cue.language);
        if (!template) throw new Error(`${item.animationId}: no unsigned session template for ${cue.cueId}/${cue.language}`);
        return cueOperatorContract({animationId: item.animationId, cue, template: {...template, file: `${item.kit.path}/${template.file}`}});
      });
    }
    const machineNotes = item.status === "not-applicable-source-bound" ? (item.reasons || []) : [];
    const technicalBlockers = [
      ...(item.status === "not-applicable-source-bound" ? [] : (item.reasons || [])),
      ...((strictGate.reasons || []).filter((reason) => !isHumanOnlyAudioReason(reason))),
      ...(!templateIsCurrent && manifest.audio?.required === true ? ["audio listening acceptance is absent or not the exact current unsigned pending template"] : []),
      ...(sessionFileCount || runtimeArtifactFileCount ? [`migration already contains ${sessionFileCount} session file(s) and ${runtimeArtifactFileCount} runtime artifact file(s); validate rather than scaffold over them`] : []),
    ];
    pilots.push({
      animationId: item.animationId,
      manifestSha256: strictPilot.manifestSha256,
      strictAudioGate: strictGate.status,
      machineReadiness: item.status,
      cueCount: item.cueCount,
      acceptance: acceptanceBinding,
      currentMigrationEvidence: {sessionFileCount, runtimeArtifactFileCount},
      pendingAcceptanceTemplateCurrent: templateIsCurrent,
      operator,
      technicalBlockers: [...new Set(technicalBlockers)],
      machineNotes,
      machineAuditRequirementsStillPending,
      kit,
      authoritativeHost,
      cues,
    });
  }

  const fullyReady = pilots.filter(({operator}) => operator.disposition === "unsigned-template-ready-for-named-human-original-runtime-listening");
  const partial = pilots.filter(({operator}) => operator.disposition === "partial-human-session-possible-but-non-unblocking");
  const blocked = pilots.filter(({operator}) => operator.disposition === "blocked-before-authoritative-listening");
  const overlap = [...pilotExternalCuePaths].filter((file) => g4Paths.has(file)).sort();
  const report = {
    schemaVersion: 1,
    reportType: "pilot-original-runtime-audio-operator-readiness",
    generatedMarker: "deterministic-no-wall-clock",
    status: "acceptance-neutral",
    acceptanceEffect: "none",
    statements: {
      audioPlayedOrListenedByGenerator: false,
      originalRuntimeLaunchedByGenerator: false,
      humanIdentityOrDecisionRecorded: false,
      ownerDecisionRecorded: false,
      migrationStatusOrStrictLedgerChanged: false,
      machineOnlyStrictAudioClosureCount: 0,
    },
    bindings: {
      generator: await descriptor(projectRoot, portable(path.relative(projectRoot, SCRIPT_PATH))),
      strictReport: {path: STRICT_REPORT, bytes: strictBytes.length, sha256: digest(strictBytes)},
      unsignedKitReadiness: await descriptor(projectRoot, `${kitRootRelative}/readiness-report.json`),
      g4L3StaticAudioAudit: {path: G4_L3_AUDIT, bytes: g4Bytes.length, sha256: digest(g4Bytes)},
      pilotAcceptanceRunbook: await descriptor(projectRoot, RUNBOOK),
      originalRuntimeSessionSchema: await descriptor(projectRoot, SESSION_SCHEMA),
    },
    exactKitCheckCommand: `node scripts/scaffold-audio-runtime-session-kit.mjs --check --readiness-report --output ${kitRootRelative} --include-acute-english --id formula-elementary-conversion-01-01 --id formula-elementary-conversion-01-02 --id formula-elementary-conversion-01-03 --id formula-elementary-conversion-01-04 --id keyterm-elementary-acute-angle --id course-g03-l01-vb-004 --id course-g04-l01-ir-001 --id course-g03-l06-ti-001 --id course-g04-l03-in-009 --id course-g04-l09-gs-002 --id course-g05-l13-rw-002 --id course-g03-l01-ts-008 --id shell-course-g04-l01-index-local`,
    runtime: readiness.report.runtime,
    requiredHumanAttestation: AUDIO_HUMAN_ATTESTATION,
    requiredHumanScope: AUDIO_LISTENING_REVIEW_SCOPE,
    summary: {
      pilotCount: pilots.length,
      strictAudioPassCount: pilots.filter(({strictAudioGate}) => strictAudioGate === "pass").length,
      fullyScopedUnsignedKitPilotCount: fullyReady.length,
      fullyScopedUnsignedKitCueCount: fullyReady.reduce((sum, {cueCount}) => sum + cueCount, 0),
      partialNonUnblockingPilotCount: partial.length,
      partialNonUnblockingCueCount: partial.reduce((sum, {cueCount}) => sum + cueCount, 0),
      blockedBeforeListeningPilotCount: blocked.length,
      sourceBoundNoAudioPilotCount: pilots.filter(({operator}) => operator.disposition === "no-listening-required-source-bound-no-audio").length,
      machineOnlyStrictAudioClosureCount: 0,
      parsedPilotCueCount: pilots.reduce((sum, {cueCount}) => sum + cueCount, 0),
      parsedPilotExternalCueCount: pilotExternalCuePaths.size,
      parsedPilotEmbeddedCueCount: pilots.reduce((sum, pilot) => sum + pilot.cues.filter(({cue}) => cue.sourceFile.endsWith(".swf")).length, 0),
    },
    g4L3AudioScope: {
      uniqueFileCount: g4.audioInventory.uniqueFileCount,
      languages: g4.audioInventory.languages,
      allPhysicalHashesReverified: true,
      overlapWithPilotExternalCueCount: overlap.length,
      overlapWithPilotExternalCuePaths: overlap,
      authorityLimit: "file-identity-only; no cue mapping, timing, reachability, listening, synchronization, replay, or acceptance",
    },
    pilots,
  };
  if (
    report.summary.pilotCount !== 16 || report.summary.strictAudioPassCount !== 2 ||
    report.summary.fullyScopedUnsignedKitPilotCount !== 12 || report.summary.fullyScopedUnsignedKitCueCount !== 70 ||
    report.summary.partialNonUnblockingPilotCount !== 1 || report.summary.partialNonUnblockingCueCount !== 1 ||
    report.summary.blockedBeforeListeningPilotCount !== 1 || report.summary.sourceBoundNoAudioPilotCount !== 2 ||
    report.summary.parsedPilotCueCount !== 71 || report.summary.parsedPilotExternalCueCount !== 14 ||
    report.summary.parsedPilotEmbeddedCueCount !== 57 || overlap.length !== 1
  ) throw new Error("current pilot/G4 L3 audio readiness totals differ from the reviewed acceptance-neutral contract");

  const jsonContent = json(report);
  const markdownContent = readinessMarkdown(report);
  await materialize({projectRoot, relativePath: OUTPUT_JSON, content: jsonContent, check});
  await materialize({projectRoot, relativePath: OUTPUT_MARKDOWN, content: markdownContent, check});
  return report;
}

function parseArguments(argv) {
  const options = {check: false, kitRootRelative: DEFAULT_KIT_ROOT};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--check") options.check = true;
    else if (argv[index] === "--kit-root") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error("--kit-root requires a project-relative work/ path");
      options.kitRootRelative = portable(value);
    } else if (["--help", "-h"].includes(argv[index])) options.help = true;
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-pilot-audio-operator-readiness.mjs [--check] [--kit-root <work/...>]\n\n` +
    "Re-hashes current pilot audio evidence, untouched unsigned kits, Projector, and G4 L3 MP3s. " +
    "Writes reports only and never launches or plays audio, records a human/owner decision, or changes migration/strict state.\n";
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(usage());
  else buildPilotAudioOperatorReadiness(options).then((report) => {
    process.stdout.write(`${options.check ? "verified" : "wrote"}: ${OUTPUT_JSON}\n`);
    process.stdout.write(`unsigned-kits=${report.summary.fullyScopedUnsignedKitPilotCount}, cues=${report.summary.fullyScopedUnsignedKitCueCount}, machine-only-closures=0\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
