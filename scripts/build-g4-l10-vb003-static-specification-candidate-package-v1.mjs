#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const PLAN_RELATIVE =
  "reports/g4-l10-vb003-static-specification-gap-closure-v1.json";
export const OUTPUT_DIRECTORY_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/vb003-static-specification-candidate-v1";
const SWFMILL_XML_RELATIVE =
  "migrations/course-g04-l10-vb-003/audit/machine/swfmill.xml.gz";
const PLAN_SHA256 =
  "7150708ad2686e95b058b1a3400fc20563779bc6d9b2114378d6f0c321a62f65";
const SWFMILL_XML_GZIP_SHA256 =
  "948ad43c618fedf99c23e4bc082ec0fb1d4faf5fef1274867477729854846fa3";
const SWFMILL_XML_SHA256 =
  "987c44b6fcd9c4f02cea593f3dd8d77e542ef66a41cc1b32f7ae66162162609c";
const REQUIRED_PREIMAGE_SET_SHA256 =
  "e472ce78ecab8658194af162c93eff1cfa7c42117dfa1851f0e78b1372cff043";
const REQUIRED_PATCH_FINGERPRINT_SHA256 =
  "4f2d311e007c79b867c7d8eaf660dd9c7c80b793f562ae10f607e35bc1730954";
const SHA256 = /^[a-f0-9]{64}$/u;

const OUTPUT_NAMES = Object.freeze({
  migration: "migration.candidate.json",
  nestedKeyframes: "nested-structural-keyframes.candidate.csv",
  definitionInventory: "swf-definition-inventory.candidate.csv",
  brief: "MIGRATION_BRIEF.candidate.md",
  receipt: "candidate-receipt.json",
});

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "sourceMutation",
  "canonicalWorkspaceMutation",
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

function compareText(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes project root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, relativePath, expected = {}) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${relativePath}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${relativePath}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${relativePath}`);
  assert.equal(BigInt(bytes.length), before.size,
    `Input size drifted while read: ${relativePath}`);
  const digest = sha256(bytes);
  if (expected.sha256) assert.equal(digest, expected.sha256,
    `Input SHA-256 drifted: ${relativePath}`);
  if (expected.bytes !== undefined) assert.equal(bytes.length, expected.bytes,
    `Input byte count drifted: ${relativePath}`);
  if (expected.mode) assert.equal(modeString(before), expected.mode,
    `Input mode drifted: ${relativePath}`);
  return {
    path: relativePath,
    absolute,
    bytes,
    byteCount: bytes.length,
    sha256: digest,
    mode: modeString(before),
    statIdentity: statIdentity(before),
  };
}

function preimageSetSha256(bindings) {
  const payload = Object.values(bindings)
    .sort((left, right) => compareText(left.path, right.path))
    .map(({path: itemPath, sha256: digest}) => `${itemPath}\0${digest}\n`)
    .join("");
  return sha256(payload);
}

function outputBinding(fileName, contents) {
  const bytes = Buffer.from(contents, "utf8");
  return {fileName, bytes: bytes.length, sha256: sha256(bytes), mode: "0444"};
}

function csvField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsv(headers, rows) {
  return `${[
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvField(row[header])).join(",")),
  ].join("\n")}\n`;
}

function change(report, id) {
  const record = report.proposedChanges.find((candidate) => candidate.id === id);
  assert.ok(record, `Plan is missing proposed change ${id}`);
  return record;
}

function setJsonPointer(document, pointer, value) {
  assert.ok(pointer.startsWith("/"), `Invalid JSON pointer: ${pointer}`);
  const parts = pointer.slice(1).split("/").map((part) =>
    part.replaceAll("~1", "/").replaceAll("~0", "~"));
  let cursor = document;
  for (const part of parts.slice(0, -1)) {
    assert.ok(cursor && typeof cursor === "object" && part in cursor,
      `JSON pointer parent is missing: ${pointer}`);
    cursor = cursor[part];
  }
  const leaf = parts.at(-1);
  assert.ok(cursor && typeof cursor === "object" && leaf in cursor,
    `JSON pointer leaf is missing: ${pointer}`);
  cursor[leaf] = structuredClone(value);
}

export function buildMigrationCandidate(currentMigration, report) {
  const candidate = structuredClone(currentMigration);
  for (const id of [
    "P1-A-audio-manifest-triangle",
    "P1-B-source-definition-and-host-dependency-manifest",
    "P1-C-static-placeholder-reconciliation",
  ]) {
    const pointers = change(report, id).proposed.jsonPointers;
    for (const [pointer, value] of Object.entries(pointers)) {
      setJsonPointer(candidate, pointer, value);
    }
  }
  assert.equal(candidate.animationId, "course-g04-l10-vb-003");
  assert.equal(candidate.status, "preserved");
  assert.equal(candidate.baseline.authority, "undecided");
  assert.equal(candidate.baseline.renderer, "unresolved");
  assert.equal(candidate.implementation.route, "");
  assert.equal(candidate.implementation.component, "");
  assert.equal(candidate.acceptance.engineeringReview.decision, "pending");
  assert.equal(candidate.acceptance.humanVisualReview.decision, "pending");
  assert.equal(candidate.acceptance.ownerReview.decision, "pending");
  assert.deepEqual(candidate.audio.languages, ["es", "und"]);
  assert.equal(candidate.audio.cues.length, 2);
  assert.ok(candidate.audio.cues.every((cue) =>
    cue.authority === "static-identity-only" &&
    cue.spokenLanguageVerified === false &&
    cue.runtimeReachabilityVerified === false &&
    cue.synchronizationVerified === false &&
    cue.listeningAccepted === false));
  return candidate;
}

export function renderNestedKeyframeCandidates(report) {
  const rows = change(report,
    "P1-D-nested-structural-keyframe-candidates").proposed.rows;
  assert.equal(rows.length, 12);
  assert.ok(rows.every((row) => row.runtimeReachability === "unresolved"));
  assert.ok(rows.every((row) => [
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
  const headers = [
    "frame",
    "requirement_id",
    "frame_domain_id",
    "trace_id",
    "entry_state_sha256",
    "time_ms",
    "scenario",
    "language",
    "kind",
    "structural_reasons_json",
    "runtime_reachability",
    "baseline_file",
    "baseline_sha256",
    "implementation_file",
    "implementation_sha256",
    "diff_file",
    "diff_sha256",
    "normalized_rmse",
    "timing_result",
    "visual_result",
    "reviewer",
    "adoption_status",
  ];
  return renderCsv(headers, rows.map((row) => ({
    frame: row.frame,
    requirement_id: row.requirementId,
    frame_domain_id: row.frameDomainId,
    trace_id: row.traceId,
    entry_state_sha256: row.entryStateSha256,
    time_ms: row.timeMs,
    scenario: row.scenario,
    language: row.language,
    kind: row.kind,
    structural_reasons_json: JSON.stringify(row.structuralReasons),
    runtime_reachability: row.runtimeReachability,
    baseline_file: row.baselineFile,
    baseline_sha256: row.baselineSha256,
    implementation_file: row.implementationFile,
    implementation_sha256: row.implementationSha256,
    diff_file: row.diffFile,
    diff_sha256: row.diffSha256,
    normalized_rmse: row.normalizedRmse,
    timing_result: row.timingResult,
    visual_result: row.visualResult,
    reviewer: row.reviewer,
    adoption_status: row.adoptionStatus,
  })));
}

export function extractDefinitionInventory(xmlBytes, sourceBinding = {}) {
  const xml = Buffer.isBuffer(xmlBytes) ? xmlBytes.toString("utf8") : String(xmlBytes);
  const tokenPattern = /<\/?(?:DefineFont2|DefineText|DefineShape3?|DefineButton2|DefineSprite)\b[^>]*>/gu;
  const stack = [];
  const definitions = [];
  for (const match of xml.matchAll(tokenPattern)) {
    const token = match[0];
    const closing = token.startsWith("</");
    const tag = token.match(/^<\/?([A-Za-z0-9]+)/u)?.[1];
    assert.ok(tag, `Unable to parse target XML tag: ${token}`);
    if (!closing) {
      const idText = token.match(/\bobjectID="([0-9]+)"/u)?.[1];
      assert.ok(idText, `${tag} is missing objectID`);
      const opened = {tag, objectId: Number(idText), start: match.index};
      if (token.endsWith("/>")) {
        const element = token;
        definitions.push({
          ...opened,
          elementBytes: Buffer.byteLength(element, "utf8"),
          elementSha256: sha256(element),
        });
      } else {
        stack.push(opened);
      }
    } else {
      const opened = stack.pop();
      assert.ok(opened, `Unexpected closing tag ${tag}`);
      assert.equal(opened.tag, tag,
        `Target definition nesting mismatch: expected ${opened.tag}, observed ${tag}`);
      const element = xml.slice(opened.start, match.index + token.length);
      definitions.push({
        ...opened,
        elementBytes: Buffer.byteLength(element, "utf8"),
        elementSha256: sha256(element),
      });
    }
  }
  assert.equal(stack.length, 0, "Unclosed target definition tags remain");
  definitions.sort((left, right) => left.objectId - right.objectId ||
    compareText(left.tag, right.tag));
  assert.equal(new Set(definitions.map(({objectId}) => objectId)).size,
    definitions.length, "Definition object IDs are not unique");
  const counts = Object.fromEntries([
    "DefineFont2",
    "DefineText",
    "DefineShape",
    "DefineShape3",
    "DefineButton2",
    "DefineSprite",
  ].map((tag) => [tag, definitions.filter((row) => row.tag === tag).length]));
  return {
    definitions,
    counts,
    csv: renderCsv([
      "object_id",
      "tag_type",
      "element_bytes",
      "element_sha256",
      "source_artifact",
      "source_artifact_sha256",
      "source_uncompressed_sha256",
      "projection",
      "runtime_reachability",
      "renderer_adoption",
      "acceptance_effect",
    ], definitions.map((row) => ({
      object_id: row.objectId,
      tag_type: row.tag,
      element_bytes: row.elementBytes,
      element_sha256: row.elementSha256,
      source_artifact: sourceBinding.path ?? SWFMILL_XML_RELATIVE,
      source_artifact_sha256: sourceBinding.sha256 ?? "",
      source_uncompressed_sha256: sourceBinding.uncompressedSha256 ?? "",
      projection: "exact-decompressed-swfmill-xml-element-v1",
      runtime_reachability: "unresolved",
      renderer_adoption: "none",
      acceptance_effect: "none",
    }))),
  };
}

function replaceExactlyOnce(text, needle, replacement) {
  const first = text.indexOf(needle);
  assert.notEqual(first, -1, `Brief source sentence is missing: ${needle}`);
  assert.equal(text.indexOf(needle, first + needle.length), -1,
    `Brief source sentence is duplicated: ${needle}`);
  return `${text.slice(0, first)}${replacement}${text.slice(first + needle.length)}`;
}

export function buildBriefCandidate(currentBrief) {
  const phaseScaffold =
    "Summarize object phases, one-indexed frame windows, transforms, alpha, depth, text/count changes, audio cues, and interaction transitions. Keep the full frame list in `keyframes.csv`.";
  const assetScaffold =
    "Summarize extracted, converted, redrawn, and generated assets. Record each item in `asset-inventory.csv`, including source character/symbol IDs and transformation notes.";
  let candidate = replaceExactlyOnce(currentBrief, phaseScaffold,
    "Static source evidence establishes root frames 1–10 and one separately declared 203-frame `sprite-120` domain. The companion candidate package records 12 EN/ES structural nested-frame rows; natural entry, timing, interaction causality, baseline capture, and acceptance remain unresolved.");
  candidate = replaceExactlyOnce(candidate, assetScaffold,
    "The exact decompressed swfmill XML contains 120 object-ID definitions: 6 fonts, 98 texts, 11 shapes, 3 buttons, and 2 sprites. The companion candidate inventory hashes every complete definition element; it does not infer FLA library names, runtime reachability, renderer transformations, or acceptance.");
  return candidate;
}

function validatePlan(plan) {
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.reportType,
    "g4-l10-vb003-static-specification-gap-closure-v1");
  assert.equal(plan.status, "acceptance-neutral-static-gap-plan-do-not-apply");
  assert.equal(plan.decision, "DO_NOT_APPLY");
  assert.equal(plan.animationId, "course-g04-l10-vb-003");
  assert.equal(plan.workspaceModified, false);
  assert.equal(plan.rendererAdopted, false);
  assert.equal(plan.guardedAdopterContract.required, true);
  assert.equal(plan.guardedAdopterContract.implementedByThisReport, false);
  assert.equal(plan.guardedAdopterContract.noClobber, true);
  assert.equal(plan.preimageSetSha256, REQUIRED_PREIMAGE_SET_SHA256);
  assert.equal(plan.guardedAdopterContract.requiredPreimageSetSha256,
    REQUIRED_PREIMAGE_SET_SHA256);
  assert.equal(plan.guardedAdopterContract.candidatePatchFingerprintSha256,
    REQUIRED_PATCH_FINGERPRINT_SHA256);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.ok(plan.wholeLessonFreshnessAdvisory.applyAttempted === false);
  assert.equal(preimageSetSha256(plan.inputBindings), REQUIRED_PREIMAGE_SET_SHA256);
}

async function assertInputBindingsCurrent(root, plan) {
  const bindings = {};
  for (const [key, expected] of Object.entries(plan.inputBindings)) {
    const record = await stableRead(root, expected.path, expected);
    bindings[key] = {
      path: record.path,
      bytes: record.byteCount,
      sha256: record.sha256,
      mode: record.mode,
    };
  }
  assert.deepEqual(bindings, plan.inputBindings,
    "Plan input bindings changed while building candidate package");
  assert.equal(preimageSetSha256(bindings), REQUIRED_PREIMAGE_SET_SHA256);
  return bindings;
}

function buildReceipt({planBinding, xmlBinding, outputs, definitionInventory}) {
  const outputBindings = Object.fromEntries(Object.entries(outputs)
    .sort(([left], [right]) => compareText(left, right))
    .map(([key, value]) => [key, outputBinding(OUTPUT_NAMES[key], value)]));
  const outputSetPayload = Object.values(outputBindings)
    .sort((left, right) => compareText(left.fileName, right.fileName))
    .map(({fileName, sha256: digest}) => `${fileName}\0${digest}\n`).join("");
  const receipt = {
    schemaVersion: 1,
    artifactType: "g4-l10-vb003-static-specification-candidate-package-v1",
    status: "acceptance-neutral-candidate-not-adopted",
    decision: "DO_NOT_APPLY",
    releaseId: "lesson-g04-l10-perimeter-area",
    animationId: "course-g04-l10-vb-003",
    outputDirectory: OUTPUT_DIRECTORY_RELATIVE,
    sourcePlan: planBinding,
    guardedAdopterContract: {
      requiredPreimageSetSha256: REQUIRED_PREIMAGE_SET_SHA256,
      candidatePatchFingerprintSha256: REQUIRED_PATCH_FINGERPRINT_SHA256,
      noClobberPublication: true,
      canonicalWorkspaceFilesChanged: false,
      packageIsAdopter: false,
      packageIsSpecificationAcceptance: false,
      independentReviewRequiredBeforeAnyFutureAdopter: true,
    },
    definitionProjection: {
      source: xmlBinding,
      uncompressedBytes: 842555,
      uncompressedSha256: SWFMILL_XML_SHA256,
      rowCount: definitionInventory.definitions.length,
      tagCounts: definitionInventory.counts,
      identity: "object ID plus exact decompressed XML element SHA-256",
      runtimeReachabilityEstablished: false,
    },
    nestedStructuralKeyframes: {
      rowCount: 12,
      languages: ["en", "es"],
      frameDomainId: "sprite-120",
      runtimeReachabilityEstablished: false,
      baselineCaptured: false,
    },
    outputs: outputBindings,
    outputSetSha256: sha256(outputSetPayload),
    authorityBoundary: {
      productionHelperImplemented: false,
      protectedInstallationPerformed: false,
      originalRuntimeLaunched: false,
      currentMigrationJsonChanged: false,
      currentKeyframesCsvChanged: false,
      currentBriefChanged: false,
      currentChecklistChanged: false,
      currentLedgersChanged: false,
      applySupported: false,
      recoverSupported: false,
      deleteOrCleanupSupported: false,
    },
    acceptanceEffects: Object.fromEntries(EFFECT_KEYS.map((key) => [key, false])),
    futureAction:
      "Independently review this exact package and any separate guarded adopter before changing canonical VB003 workspace files.",
  };
  receipt.receiptFingerprintSha256 = sha256(canonicalJson(receipt));
  return receipt;
}

export function validateCandidatePackage(candidatePackage) {
  const {receipt, outputs, definitionInventory, migrationCandidate} = candidatePackage;
  assert.equal(receipt.status, "acceptance-neutral-candidate-not-adopted");
  assert.equal(receipt.decision, "DO_NOT_APPLY");
  assert.equal(receipt.definitionProjection.rowCount, 120);
  assert.deepEqual(receipt.definitionProjection.tagCounts, {
    DefineFont2: 6,
    DefineText: 98,
    DefineShape: 4,
    DefineShape3: 7,
    DefineButton2: 3,
    DefineSprite: 2,
  });
  assert.equal(definitionInventory.definitions.length, 120);
  assert.equal(migrationCandidate.status, "preserved");
  assert.equal(migrationCandidate.baseline.authority, "undecided");
  assert.equal(migrationCandidate.implementation.route, "");
  assert.ok(Object.values(receipt.acceptanceEffects).every((value) => value === false));
  assert.ok(Object.values(receipt.authorityBoundary).every((value) => value === false));
  for (const [key, contents] of Object.entries(outputs)) {
    const binding = receipt.outputs[key];
    assert.equal(binding.fileName, OUTPUT_NAMES[key]);
    assert.equal(binding.bytes, Buffer.byteLength(contents, "utf8"));
    assert.equal(binding.sha256, sha256(contents));
    assert.equal(binding.mode, "0444");
  }
  const fingerprint = receipt.receiptFingerprintSha256;
  const projection = structuredClone(receipt);
  delete projection.receiptFingerprintSha256;
  assert.equal(fingerprint, sha256(canonicalJson(projection)));
  assert.ok(SHA256.test(fingerprint));
  return true;
}

export async function buildCandidatePackage(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const planRecord = await stableRead(root, PLAN_RELATIVE, {sha256: PLAN_SHA256});
  const plan = JSON.parse(planRecord.bytes.toString("utf8"));
  validatePlan(plan);
  await assertInputBindingsCurrent(root, plan);
  const xmlGzipRecord = await stableRead(root, SWFMILL_XML_RELATIVE, {
    sha256: SWFMILL_XML_GZIP_SHA256,
    bytes: 116083,
    mode: "0644",
  });
  const xmlBytes = gunzipSync(xmlGzipRecord.bytes);
  assert.equal(xmlBytes.length, 842555);
  assert.equal(sha256(xmlBytes), SWFMILL_XML_SHA256);
  const definitionInventory = extractDefinitionInventory(xmlBytes, {
    path: SWFMILL_XML_RELATIVE,
    sha256: SWFMILL_XML_GZIP_SHA256,
    uncompressedSha256: SWFMILL_XML_SHA256,
  });
  const migrationBinding = plan.inputBindings.migration;
  const briefBinding = plan.inputBindings.brief;
  const migrationRecord = await stableRead(root, migrationBinding.path, migrationBinding);
  const briefRecord = await stableRead(root, briefBinding.path, briefBinding);
  const migrationCandidate = buildMigrationCandidate(
    JSON.parse(migrationRecord.bytes.toString("utf8")), plan);
  const outputs = {
    migration: `${JSON.stringify(migrationCandidate, null, 2)}\n`,
    nestedKeyframes: renderNestedKeyframeCandidates(plan),
    definitionInventory: definitionInventory.csv,
    brief: buildBriefCandidate(briefRecord.bytes.toString("utf8")),
  };
  const planBinding = {
    path: PLAN_RELATIVE,
    bytes: planRecord.byteCount,
    sha256: planRecord.sha256,
    mode: planRecord.mode,
  };
  const xmlBinding = {
    path: SWFMILL_XML_RELATIVE,
    bytes: xmlGzipRecord.byteCount,
    sha256: xmlGzipRecord.sha256,
    mode: xmlGzipRecord.mode,
  };
  const receipt = buildReceipt({
    planBinding,
    xmlBinding,
    outputs,
    definitionInventory,
  });
  const candidatePackage = {
    root,
    plan,
    migrationCandidate,
    definitionInventory,
    outputs,
    receipt,
  };
  validateCandidatePackage(candidatePackage);
  return candidatePackage;
}

async function assertCandidateInputsCurrent(candidatePackage) {
  await stableRead(candidatePackage.root, PLAN_RELATIVE, {sha256: PLAN_SHA256});
  await assertInputBindingsCurrent(candidatePackage.root, candidatePackage.plan);
  await stableRead(candidatePackage.root, SWFMILL_XML_RELATIVE, {
    sha256: SWFMILL_XML_GZIP_SHA256,
    bytes: 116083,
    mode: "0644",
  });
}

async function outputDirectory(root) {
  const absolute = resolveInside(root, OUTPUT_DIRECTORY_RELATIVE);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  return absolute;
}

export async function publishPackageDirectoryNoClobber(
  candidatePackage,
  {beforeReceipt = async () => {}} = {},
) {
  const target = await outputDirectory(candidatePackage.root);
  try {
    await mkdir(target, {mode: 0o700});
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`Candidate directory already exists; refusing overwrite: ${target}`);
    }
    throw error;
  }
  const documents = {
    ...candidatePackage.outputs,
    receipt: `${JSON.stringify(candidatePackage.receipt, null, 2)}\n`,
  };
  for (const key of [
    "migration",
    "nestedKeyframes",
    "definitionInventory",
    "brief",
  ]) {
    const filePath = path.join(target, OUTPUT_NAMES[key]);
    await writeFile(filePath, documents[key], {flag: "wx", mode: 0o600});
    await chmod(filePath, 0o444);
  }
  await beforeReceipt();
  const receiptPath = path.join(target, OUTPUT_NAMES.receipt);
  await writeFile(receiptPath, documents.receipt, {flag: "wx", mode: 0o600});
  await chmod(receiptPath, 0o444);
  await chmod(target, 0o555);
  return checkPackage(candidatePackage);
}

export async function writePackageNoClobber(candidatePackage) {
  await assertCandidateInputsCurrent(candidatePackage);
  const result = await publishPackageDirectoryNoClobber(candidatePackage, {
    beforeReceipt: async () => assertCandidateInputsCurrent(candidatePackage),
  });
  await assertCandidateInputsCurrent(candidatePackage);
  return result;
}

export async function checkPackage(candidatePackage) {
  const target = await outputDirectory(candidatePackage.root);
  const directoryInfo = await lstat(target);
  assert.ok(directoryInfo.isDirectory() && !directoryInfo.isSymbolicLink(),
    "Candidate package path must be an ordinary directory");
  assert.equal(await realpath(target), target,
    "Candidate package directory resolves through a symlink");
  assert.equal(modeString(directoryInfo), "0555",
    "Candidate package directory mode drifted");
  const expectedNames = Object.values(OUTPUT_NAMES).sort(compareText);
  const observedNames = (await readdir(target)).sort(compareText);
  assert.deepEqual(observedNames, expectedNames,
    "Candidate package contains missing or foreign entries");
  const documents = {
    ...candidatePackage.outputs,
    receipt: `${JSON.stringify(candidatePackage.receipt, null, 2)}\n`,
  };
  for (const key of Object.keys(OUTPUT_NAMES)) {
    const relative = path.join(OUTPUT_DIRECTORY_RELATIVE, OUTPUT_NAMES[key]);
    const expected = Buffer.from(documents[key], "utf8");
    const record = await stableRead(candidatePackage.root, relative, {
      sha256: sha256(expected),
      bytes: expected.length,
      mode: "0444",
    });
    assert.deepEqual(record.bytes, expected,
      `Candidate output bytes drifted: ${relative}`);
  }
  return {
    disposition: "checked",
    outputDirectory: OUTPUT_DIRECTORY_RELATIVE,
    outputCount: expectedNames.length,
    definitionCount: candidatePackage.definitionInventory.definitions.length,
    nestedKeyframeCount: 12,
    receiptFingerprintSha256:
      candidatePackage.receipt.receiptFingerprintSha256,
    acceptanceEffect: false,
  };
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(
  argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT,
) {
  const mode = parseArguments(argv);
  const candidatePackage = await buildCandidatePackage(projectRoot);
  if (mode === "--write-no-clobber") {
    return writePackageNoClobber(candidatePackage);
  }
  if (mode === "--check") return checkPackage(candidatePackage);
  return {
    disposition: "dry-run",
    outputDirectory: OUTPUT_DIRECTORY_RELATIVE,
    outputCount: Object.keys(OUTPUT_NAMES).length,
    definitionCount: candidatePackage.definitionInventory.definitions.length,
    nestedKeyframeCount: 12,
    receiptFingerprintSha256:
      candidatePackage.receipt.receiptFingerprintSha256,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
