#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECT_ROOT,
  derivePlan as deriveV1Plan,
  readSnapshot as readV1Snapshot,
} from "./build-g4-whole-course-batch-integration-plan.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const OUTPUT_PATH =
  "catalog/batches/g4-whole-course-batch-integration-plan-v2.json";

const REJECTED_V1_INPUTS = Object.freeze({
  rejectedV1Generator: {
    path: "scripts/build-g4-whole-course-batch-integration-plan.mjs",
    kind: "text",
    sha256: "faaca0ac0c26b8affd09157b3ce841be2b4d4419685076535e67034897641f0c",
  },
  rejectedV1Tests: {
    path: "scripts/build-g4-whole-course-batch-integration-plan.test.mjs",
    kind: "text",
    sha256: "3b875bd7d9e97b3d46ed115e5b3eeb317368f8aa0b2c3f0cb80c6736fd4d09d0",
  },
  rejectedV1Json: {
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v1.json",
    kind: "json",
    sha256: "7d80bd3adbad6b7a71c3fede38455cce43454b956450ecbc3214d2b96ab27847",
  },
});

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

function fingerprint(value) {
  const projection = structuredClone(value);
  delete projection.planFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false, "Absolute path is forbidden");
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

function identity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(identity(after), identity(before), `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size, `${specification.path} size drifted`);
  const digest = sha256(bytes);
  assert.equal(digest, specification.sha256, `${specification.path} epoch drifted`);
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode: Number(before.mode & 0o777n).toString(8).padStart(4, "0"),
    statIdentity: identity(before),
  };
  record.text = bytes.toString("utf8");
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

function sum(records, field) {
  return records.reduce((total, record) => total + Number(record[field]), 0);
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const base = await readV1Snapshot(projectRoot);
  const records = { ...base.records };
  const added = await Promise.all(Object.entries(REJECTED_V1_INPUTS)
    .map(([key, specification]) => readStable(projectRoot, key, specification)));
  for (const record of added) records[record.key] = record;
  return { ...base, projectRoot: path.resolve(projectRoot), records };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const record of Object.values(snapshot.records)) {
    const reread = await readStable(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
      sha256: record.sha256,
    });
    assert.equal(reread.statIdentity, record.statIdentity,
      `${record.path} stat identity drifted`);
  }
}

export function derivePlan(snapshot) {
  const rejected = deriveV1Plan(snapshot);
  const alignment = snapshot.records.alignment.document;
  const publisher = snapshot.records.lessonPublisher.text;
  const publisherTests = snapshot.records.lessonPublisherTests.text;

  for (const requiredSourceEvidence of [
    "Strict items outside every",
    "controlled scope retain the existing individual-publication behavior.",
    "if (controllingDefinitions.length === 0) return true;",
    "return exactMember && release?.published === true;",
  ]) {
    assert.ok(publisher.includes(requiredSourceEvidence),
      `Publisher behavior evidence is absent: ${requiredSourceEvidence}`);
  }
  assert.ok(publisherTests.includes(
    "controlled nonmembers stay hidden while unrelated strict items retain individual publication"),
  "Publisher regression test for uncontrolled individual publication is absent");

  const currentJsPages = sum(rejected.lessons, "currentJsPages");
  const currentJsShells = sum(rejected.lessons, "currentJsShells");
  assert.equal(currentJsPages, 41);
  assert.equal(currentJsShells, 2);
  assert.equal(currentJsPages + currentJsShells, rejected.courseBaseline.currentJsMembers);

  const lessonSections = alignment.course.lessons.map(({ lessonNumber, sections }) => ({
    lesson: lessonNumber,
    sectionCount: sections.length,
  }));
  assert.equal(lessonSections.length, 12);
  assert.ok(lessonSections.every(({ sectionCount }) => sectionCount === 8));

  const keyTerms = alignment.keyTerms;
  const declarations = keyTerms.lessonDeclarations;
  assert.equal(declarations.length, 12);
  const declarationSummary = {
    lessonCount: declarations.length,
    englishCanonicalPresent: declarations.filter(({ englishCanonicalPresent }) =>
      englishCanonicalPresent).length,
    spanishCanonicalPresent: declarations.filter(({ spanishCanonicalPresent }) =>
      spanishCanonicalPresent).length,
    runtimeResolutionVerified: declarations.filter(({ runtimeResolutionVerified }) =>
      runtimeResolutionVerified).length,
    declarationPathsBoundByAlignment: true,
  };
  assert.deepEqual(declarationSummary, {
    lessonCount: 12,
    englishCanonicalPresent: 0,
    spanishCanonicalPresent: 0,
    runtimeResolutionVerified: 0,
    declarationPathsBoundByAlignment: true,
  });
  assert.deepEqual({
    english: keyTerms.gradeWideStaticCandidates.english.entryCount,
    spanish: keyTerms.gradeWideStaticCandidates.spanish.entryCount,
    englishRuntimeVerified:
      keyTerms.gradeWideStaticCandidates.english.runtimeResolutionVerified,
    spanishRuntimeVerified:
      keyTerms.gradeWideStaticCandidates.spanish.runtimeResolutionVerified,
    englishOwnerAccepted: keyTerms.gradeWideStaticCandidates.english.ownerAccepted,
    spanishOwnerAccepted: keyTerms.gradeWideStaticCandidates.spanish.ownerAccepted,
  }, {
    english: 761,
    spanish: 753,
    englishRuntimeVerified: false,
    spanishRuntimeVerified: false,
    englishOwnerAccepted: false,
    spanishOwnerAccepted: false,
  });

  const plan = structuredClone(rejected);
  plan.schemaVersion = 2;
  plan.successorOf = binding(snapshot.records.rejectedV1Json);
  plan.predecessorDisposition = {
    version: 1,
    status: "rejected-p1-current-platform-invariant-overstated",
    preserved: true,
    independentReview: { p0: 0, p1: 2, p2: 2 },
    finding:
      "V1 accurately denied whole-course 0-or-12 enforcement but incorrectly summarized all current publication as per-lesson-atomic-only. Undefined and otherwise uncontrolled lesson targets retain individual strict-complete publication eligibility.",
    artifacts: {
      generator: binding(snapshot.records.rejectedV1Generator),
      tests: binding(snapshot.records.rejectedV1Tests),
      json: binding(snapshot.records.rejectedV1Json),
    },
    acceptanceEffect: "none",
  };
  plan.derivedDenominators = {
    currentJsPages,
    currentJsShells,
    currentJsMembers: currentJsPages + currentJsShells,
    lessonSections,
    sectionCount: sum(lessonSections, "sectionCount"),
    derivationStatus: "computed-from-hash-bound-alignment-and-registry-coverage",
  };
  plan.blockers.keyTerms.gradeWideStaticCandidates = {
    disposition: keyTerms.gradeWideStaticCandidates.disposition,
    english: {
      entries: keyTerms.gradeWideStaticCandidates.english.entryCount,
      source: keyTerms.gradeWideStaticCandidates.english.source,
      runtimeResolutionVerified: false,
      ownerAccepted: false,
    },
    spanish: {
      entries: keyTerms.gradeWideStaticCandidates.spanish.entryCount,
      source: keyTerms.gradeWideStaticCandidates.spanish.source,
      runtimeResolutionVerified: false,
      ownerAccepted: false,
    },
    substitutesForLessonRuntimeResolution: false,
  };
  plan.blockers.keyTerms.lessonDeclarations = declarationSummary;
  plan.atomicWholeCourseIntegration.currentPlatformInvariant = {
    mode: "mixed-defined-release-atomic-and-uncontrolled-individual-publication",
    definedOrProtectedReleaseScopes: "atomic-per-lesson",
    uncontrolledStrictCompleteTargets: "individual-publication-fallback",
    grade4DefinedLessonCount: 2,
    grade4UndefinedLessonCount: 10,
    wholeCourseZeroOrTwelveEnforced: false,
  };
  plan.atomicWholeCourseIntegration.currentPlatformRisk = {
    condition:
      "Before a whole-course adapter and all 12 controlling definitions exist, a strict-complete target outside a controlled scope can remain individually publication-eligible.",
    currentStrictCompleteMembers: 0,
    currentPublishedGrade4Lessons: 0,
    currentLeakObserved: false,
    futureRiskClosed: false,
  };
  plan.atomicWholeCourseIntegration.requiredSequencing = [
    "install and validate all 12 Grade 4 controlling release definitions",
    "install and independently review the whole-course trust adapter",
    "make the adapter enforce published lesson count 0-or-12",
    "only then admit any batch that could write strict completion or publication state",
  ];
  plan.atomicWholeCourseIntegration.prepare
    .requireNoUncontrolledIndividualPublicationFallback = true;
  plan.admissionDecision.reasons = [
    ...plan.admissionDecision.reasons,
    "current publisher retains individual eligibility outside controlled scopes; ten Grade 4 lesson definitions and the 0-or-12 adapter must precede any strict-completion write",
  ];
  plan.authorityBoundary.currentPublisherBehaviorIsMixedAndHashBound = true;
  plan.authorityBoundary.undefinedGrade4LessonsMayNotReachStrictCompleteBeforeAdapter = true;
  plan.inputBindings = Object.fromEntries(Object.keys(snapshot.records).sort()
    .map((key) => [key, binding(snapshot.records[key])]));
  delete plan.planFingerprintSha256;
  plan.planFingerprintSha256 = fingerprint(plan);
  validatePlan(plan);
  return plan;
}

export function validatePlan(plan) {
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.predecessorDisposition.status,
    "rejected-p1-current-platform-invariant-overstated");
  assert.equal(plan.predecessorDisposition.preserved, true);
  assert.deepEqual(plan.derivedDenominators, {
    currentJsPages: 41,
    currentJsShells: 2,
    currentJsMembers: 43,
    lessonSections: Array.from({ length: 12 }, (_, index) => ({
      lesson: index + 1,
      sectionCount: 8,
    })),
    sectionCount: 96,
    derivationStatus: "computed-from-hash-bound-alignment-and-registry-coverage",
  });
  assert.equal(plan.blockers.keyTerms.gradeWideStaticCandidates.english.entries, 761);
  assert.equal(plan.blockers.keyTerms.gradeWideStaticCandidates.spanish.entries, 753);
  assert.equal(plan.blockers.keyTerms.gradeWideStaticCandidates
    .substitutesForLessonRuntimeResolution, false);
  assert.equal(plan.blockers.keyTerms.lessonDeclarations.lessonCount, 12);
  assert.equal(plan.blockers.keyTerms.lessonDeclarations.runtimeResolutionVerified, 0);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformInvariant.mode,
    "mixed-defined-release-atomic-and-uncontrolled-individual-publication");
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformInvariant
    .uncontrolledStrictCompleteTargets, "individual-publication-fallback");
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk.currentLeakObserved, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformEnforcesWholeCourseZeroOrTwelve,
    false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.contractVersion, 4);
  assert.equal(plan.waveMembership.uniqueLessonCount, 11);
  assert.equal(plan.waveMembership.subtotal.members, 610);
  assert.equal(Object.keys(plan.inputBindings).length, 17);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(plan.planFingerprintSha256, fingerprint(plan));
  return true;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

export async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents, `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, { flag: "wx", mode: 0o644 });
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const plan = derivePlan(snapshot);
  const output = `${JSON.stringify(plan, null, 2)}\n`;
  await assertSnapshotUnchanged(snapshot);
  const outputPath = resolveInsideRoot(projectRoot, OUTPUT_PATH);
  if (mode === "--write") {
    const disposition = await writeNoClobber(outputPath, output);
    await assertSnapshotUnchanged(snapshot);
    return { mode, plan, disposition, written: OUTPUT_PATH };
  }
  assert.equal(await readFile(outputPath, "utf8"), output,
    `${OUTPUT_PATH} is stale; preserve it and create a successor if reviewed inputs change`);
  await assertSnapshotUnchanged(snapshot);
  return { mode, plan, checked: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${OUTPUT_PATH}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
