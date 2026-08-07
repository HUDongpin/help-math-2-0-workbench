#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECT_ROOT,
  RELEASE_ID,
} from "./build-g4-l10-complete-migration-template-contract-v2.mjs";
import {
  deriveContract as deriveV4Contract,
  readSnapshot as readV4Snapshot,
} from "./build-g4-l10-complete-migration-template-contract-v4.mjs";
import { checkCompletionLedger } from "./build-completion-ledger.mjs";
import { checkLessonReleaseLedger } from "./build-lesson-release-ledger.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.md";

const V4_ARTIFACTS = Object.freeze({
  rejectedV4Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v4.mjs",
    kind: "text",
    bytes: 24180,
    sha256: "1b0c4300683014c45ee1c2bd80c4a2ef95003e9e38fc10bfb4599b68cc995341",
    mode: "0644",
  },
  rejectedV4Tests: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v4.test.mjs",
    kind: "text",
    bytes: 6174,
    sha256: "332cc3ac0bdcde1e15615b36c15024551beea9dbfc11eb190b4d5d450a1c1cdf",
    mode: "0644",
  },
  rejectedV4Json: {
    path: "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.json",
    kind: "json",
    bytes: 218067,
    sha256: "c8a64fdf766efb56ef03c936fc2e6c9fd0179f81d780ab3d1a5042c1f815f261",
    mode: "0644",
  },
  rejectedV4Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.md",
    kind: "text",
    bytes: 63980,
    sha256: "e913ac52e305769d71ffe1caefd7c873f806746edf6869a2972459c41335b9e8",
    mode: "0644",
  },
});

const CURRENT_LEDGER_EPOCH = Object.freeze({
  completionLedger: {
    path: "catalog/completion-ledger.json",
    kind: "json",
    bytes: 122550,
    sha256: "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db",
    mode: "0644",
    generatedMarker: "sha256:55d2b266cc069b128eb70a521fb8ebfc6154dcbec0116c7b205a3ec10c6a6fe5",
  },
  lessonReleaseLedger: {
    path: "catalog/lesson-release-ledger.json",
    kind: "json",
    bytes: 102724,
    sha256: "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc",
    mode: "0644",
    generatedMarker: "sha256:6557f8420099390e3167ab1e11999f92ef5203cab0e65493c950d31b45f23700",
  },
});

const AUTHORITATIVE_FRESHNESS_INPUTS = Object.freeze({
  authoritativeCompletionLedgerGenerator: {
    path: "scripts/build-completion-ledger.mjs",
    kind: "text",
    bytes: 10642,
    sha256: "922e8bf742c6916e492163b0c4787a71365d1d83177c02ad810b8f2f2fbd6ca0",
    mode: "0644",
  },
  authoritativeLessonReleaseLedgerGenerator: {
    path: "scripts/build-lesson-release-ledger.mjs",
    kind: "text",
    bytes: 22577,
    sha256: "c1881ab81ea897d3ac616abdf590644d9e773ccd47d1b810808160f153148a50",
    mode: "0644",
  },
  authoritativeMigrationValidator: {
    path: "skills/flash-to-js/scripts/validate_migration.mjs",
    kind: "text",
    bytes: 165346,
    sha256: "fdf214b3accf42d6801231bc4c6b5dd6ae9de32e7cb89f1f471ca838bc64d36d",
    mode: "0644",
  },
});

const LEGACY_LEDGER_KEYS = Object.freeze([
  "completionLedger",
  "lessonReleaseLedger",
]);

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "authoritativeOriginalRuntimeEvidence",
  "ruffleBaselineAuthority",
  "currentJavascriptBaselineAuthority",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
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

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function kindForV4Record(key, relativePath) {
  if (key.startsWith("candidate:runtime-asset:") ||
      key.endsWith(":source-swf") || key.endsWith(":source-fla")) return "binary";
  if (relativePath.endsWith(".json")) return "json";
  return "text";
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(statIdentity(after), statIdentity(before),
    `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size,
    `${specification.path} size drifted while read`);
  const digest = sha256(bytes);
  const mode = Number(before.mode & 0o777n).toString(8).padStart(4, "0");
  if (Number.isInteger(specification.bytes)) {
    assert.equal(bytes.length, specification.bytes,
      `${specification.path} fixed byte count drifted`);
  }
  if (specification.sha256) {
    assert.equal(digest, specification.sha256,
      `${specification.path} fixed SHA-256 epoch drifted`);
  }
  if (specification.mode) {
    assert.equal(mode, specification.mode, `${specification.path} mode drifted`);
  }
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

function utf8Compare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function parseCandidateSource(source) {
  const candidateBlock = source.match(/const candidates = \[([\s\S]*?)\] as const;/u)?.[1];
  assert.ok(candidateBlock, "Candidate array is absent");
  const candidateIds = [...candidateBlock.matchAll(/\bid:\s*"([^"]+)"/gu)]
    .map((match) => match[1]);
  const frameCounts = [...candidateBlock.matchAll(/\bframeCount:\s*(\d+)/gu)]
    .map((match) => Number(match[1]));
  const modules = [...source.matchAll(/from "\.\.\/src\/modules\/([^"]+)"/gu)]
    .map((match) => `packages/demos/src/modules/${match[1]}.tsx`);
  const timelines = [...source.matchAll(/from "\.\.\/src\/timelines\/([^"]+)"/gu)]
    .map((match) => `packages/demos/src/timelines/${match[1]}.ts`);
  assert.equal(candidateIds.length, 24);
  assert.equal(new Set(candidateIds).size, 24);
  assert.equal(frameCounts.length, 24);
  assert.equal(modules.length, 24);
  assert.equal(timelines.length, 24);
  return { candidateIds, frameCounts, modules, timelines };
}

async function expectPreservedV4ReaderRejection(projectRoot, legacyReader, oldBindings) {
  try {
    await legacyReader(projectRoot);
  } catch (error) {
    const message = String(error?.message ?? error);
    assert.match(message,
      /catalog\/(?:completion-ledger|lesson-release-ledger)\.json SHA-256 epoch drifted/u,
      "Preserved v4 reader failed for a non-ledger reason");
    const key = message.includes("lesson-release-ledger")
      ? "lessonReleaseLedger"
      : "completionLedger";
    const expected = String(error?.expected ?? "");
    const actual = String(error?.actual ?? "");
    assert.equal(expected, oldBindings[key].sha256,
      "Preserved v4 reader did not expose its old ledger digest");
    assert.equal(actual, CURRENT_LEDGER_EPOCH[key].sha256,
      "Preserved v4 reader did not reject the current lawful ledger epoch");
    return {
      outcome: "fail-closed-as-expected",
      failureClass: "fixed-ledger-sha256-epoch-drift",
      observedFailureAcceptedFromConcurrentReadSet: true,
      mismatches: Object.fromEntries(LEGACY_LEDGER_KEYS.map((ledgerKey) => [ledgerKey, {
        path: CURRENT_LEDGER_EPOCH[ledgerKey].path,
        v4ExpectedSha256: oldBindings[ledgerKey].sha256,
        currentActualSha256: CURRENT_LEDGER_EPOCH[ledgerKey].sha256,
      }])),
      rule:
        "The preserved reader loads fixed inputs concurrently, so either stale ledger may surface first; v5 records the deterministic two-ledger mismatch set rather than race-dependent first-failure text.",
      acceptanceEffect: "none",
    };
  }
  assert.fail("Preserved v4 reader unexpectedly accepted the successor ledger epoch");
}

function hydrateV4Snapshot(projectRoot, records) {
  const release = records.lessonReleases.document.releases.find(
    (item) => item.releaseId === RELEASE_ID,
  );
  assert.ok(release, `Missing release ${RELEASE_ID}`);
  const candidateModuleKeys = Object.keys(records)
    .filter((key) => key.startsWith("candidate:module:"))
    .sort();
  const candidateTimelineKeys = Object.keys(records)
    .filter((key) => key.startsWith("candidate:timeline:"))
    .sort();
  const candidateFullCodeKeys = Object.keys(records)
    .filter((key) => key.startsWith("candidate:module:") ||
      key.startsWith("candidate:timeline:") ||
      key.startsWith("candidate:transitive:"))
    .sort((left, right) => utf8Compare(records[left].path, records[right].path));
  const candidateRuntimeAssetKeys = Object.keys(records)
    .filter((key) => key.startsWith("candidate:runtime-asset:"))
    .sort();
  const memberRecordKeys = Object.keys(records)
    .filter((key) => key.startsWith("member:"));
  assert.equal(Object.keys(records).length, 375, "Preserved v4 binding count drifted");
  assert.equal(memberRecordKeys.length, 269);
  assert.equal(candidateModuleKeys.length, 24);
  assert.equal(candidateTimelineKeys.length, 24);
  assert.equal(candidateFullCodeKeys.length, 53);
  assert.equal(candidateRuntimeAssetKeys.length, 24);
  return {
    projectRoot: path.resolve(projectRoot),
    records,
    releaseMemberIds: release.members.map(({ animationId }) => animationId),
    memberRecordKeys,
    candidateModuleKeys,
    candidateTimelineKeys,
    candidateSource: parseCandidateSource(records.engineeringCandidateTest.text),
    candidateFullCodeKeys,
    candidateRuntimeAssetKeys,
  };
}

async function runAuthoritativeLedgerChecks(projectRoot, completionChecker, releaseChecker) {
  const migrationsRoot = path.join(projectRoot, "migrations");
  const completionLedgerPath = path.join(projectRoot, CURRENT_LEDGER_EPOCH.completionLedger.path);
  const lessonReleaseLedgerPath = path.join(projectRoot,
    CURRENT_LEDGER_EPOCH.lessonReleaseLedger.path);
  const completionCheck = await completionChecker({
    migrationsRoot,
    output: completionLedgerPath,
  });
  assert.equal(completionCheck?.ok, true,
    `Authoritative completion ledger is ${completionCheck?.reason ?? "not current"}`);
  assert.equal(completionCheck.reason, "current");
  assert.equal(completionCheck.actual, completionCheck.expected,
    "Authoritative completion checker did not prove exact byte equality");

  const releaseCheck = await releaseChecker({
    releasesPath: path.join(projectRoot, "catalog/lesson-releases.json"),
    completionLedgerPath,
    migrationsRoot,
    output: lessonReleaseLedgerPath,
    completionLedgerCheck: async () => completionCheck,
  });
  assert.equal(releaseCheck?.ok, true,
    `Authoritative lesson release ledger is ${releaseCheck?.reason ?? "not current"}`);
  assert.equal(releaseCheck.reason, "current");
  assert.equal(releaseCheck.actual, releaseCheck.expected,
    "Authoritative lesson release checker did not prove exact byte equality");
  return { completionCheck, releaseCheck };
}

function summarizeLedgerCurrentness(checks, v4Snapshot) {
  const completionRecord = v4Snapshot.records.completionLedger;
  const releaseRecord = v4Snapshot.records.lessonReleaseLedger;
  const lessonReleases = v4Snapshot.records.lessonReleases.document;
  const { completionCheck, releaseCheck } = checks;
  assert.equal(completionCheck.actual, completionRecord.text,
    "Completion checker did not validate the exact bound bytes");
  assert.equal(releaseCheck.actual, releaseRecord.text,
    "Release checker did not validate the exact bound bytes");
  assert.deepEqual(completionCheck.ledger, completionRecord.document,
    "Completion checker document differs from exact bound bytes");
  assert.deepEqual(releaseCheck.ledger, releaseRecord.document,
    "Release checker document differs from exact bound bytes");

  const grade4Releases = lessonReleases.releases.filter(({ grade }) => grade === 4);
  const grade4Ids = new Set(grade4Releases.flatMap(({ members }) =>
    members.map(({ animationId }) => animationId)));
  const l10Definition = lessonReleases.releases.find(({ releaseId }) =>
    releaseId === RELEASE_ID);
  const l10Ids = new Set(l10Definition.members.map(({ animationId }) => animationId));
  const l10State = releaseCheck.ledger.releases.find(({ releaseId }) =>
    releaseId === RELEASE_ID);
  assert.ok(l10State, `Missing ${RELEASE_ID} from authoritative release ledger`);

  return {
    proofKind: "authoritative-generator-recomputation-and-exact-byte-equality",
    completion: {
      checkerExport: "checkCompletionLedger",
      ok: completionCheck.ok,
      reason: completionCheck.reason,
      actualEqualsExpected: completionCheck.actual === completionCheck.expected,
      expectedBytes: Buffer.byteLength(completionCheck.expected),
      expectedSha256: sha256(completionCheck.expected),
      actualBytes: Buffer.byteLength(completionCheck.actual),
      actualSha256: sha256(completionCheck.actual),
      generatedMarker: completionCheck.ledger.generatedMarker,
      migrationDirectories: completionCheck.ledger.summary.migrationDirectories,
      strictComplete: completionCheck.ledger.summary.strictComplete,
      grade4StrictComplete: completionCheck.ledger.entries.filter(({ animationId }) =>
        grade4Ids.has(animationId)).length,
      l10StrictComplete: completionCheck.ledger.entries.filter(({ animationId }) =>
        l10Ids.has(animationId)).length,
    },
    release: {
      checkerExport: "checkLessonReleaseLedger",
      ok: releaseCheck.ok,
      reason: releaseCheck.reason,
      actualEqualsExpected: releaseCheck.actual === releaseCheck.expected,
      expectedBytes: Buffer.byteLength(releaseCheck.expected),
      expectedSha256: sha256(releaseCheck.expected),
      actualBytes: Buffer.byteLength(releaseCheck.actual),
      actualSha256: sha256(releaseCheck.actual),
      generatedMarker: releaseCheck.ledger.generatedMarker,
      releaseCount: releaseCheck.ledger.summary.releaseCount,
      publishedReleaseCount: releaseCheck.ledger.summary.publishedReleaseCount,
      grade4ReleaseCount: releaseCheck.ledger.releases.filter(({ grade }) => grade === 4).length,
      grade4PublishedReleaseCount: releaseCheck.ledger.releases.filter(
        ({ grade, published }) => grade === 4 && published).length,
      l10: {
        releaseId: l10State.releaseId,
        expectedMemberCount: l10State.expectedMemberCount,
        strictCompleteCount: l10State.strictCompleteCount,
        missingCount: l10State.missingCount,
        assetMismatchCount: l10State.assetMismatchCount,
        published: l10State.published,
        status: l10State.status,
      },
    },
  };
}

export async function readSnapshot(projectRoot = PROJECT_ROOT, {
  legacyReader = readV4Snapshot,
  completionChecker = checkCompletionLedger,
  releaseChecker = checkLessonReleaseLedger,
} = {}) {
  const v4ArtifactRecords = await Promise.all(Object.entries(V4_ARTIFACTS)
    .map(([key, specification]) => readStable(projectRoot, key, specification)));
  const v4Artifacts = Object.fromEntries(v4ArtifactRecords.map((record) =>
    [record.key, record]));
  const v4Document = v4Artifacts.rejectedV4Json.document;
  assert.equal(v4Document.schemaVersion, 4);
  assert.equal(v4Document.templateStable, false);
  assert.equal(v4Document.reportFingerprintSha256,
    "cd63a93da061a02b4bba0c8cde7db7d34c6524c2997ef9f0f983c74e7a740dcb");
  assert.equal(Object.keys(v4Document.inputBindings).length, 375);

  const legacyReaderRejection = await expectPreservedV4ReaderRejection(
    projectRoot,
    legacyReader,
    v4Document.inputBindings,
  );

  const v4RecordList = await Promise.all(Object.entries(v4Document.inputBindings)
    .map(([key, oldBinding]) => {
      const currentLedger = CURRENT_LEDGER_EPOCH[key];
      if (currentLedger) {
        assert.equal(oldBinding.path, currentLedger.path);
        assert.notEqual(oldBinding.sha256, currentLedger.sha256,
          `${currentLedger.path} did not advance beyond v4`);
      }
      return readStable(projectRoot, key, currentLedger ?? {
        ...oldBinding,
        kind: kindForV4Record(key, oldBinding.path),
      });
    }));
  const v4Records = Object.fromEntries(v4RecordList.map((record) => [record.key, record]));
  const v4CurrentSnapshot = hydrateV4Snapshot(projectRoot, v4Records);

  const additionalRecordsList = await Promise.all(
    Object.entries(AUTHORITATIVE_FRESHNESS_INPUTS)
      .map(([key, specification]) => readStable(projectRoot, key, specification)),
  );
  const additionalRecords = Object.fromEntries(additionalRecordsList.map((record) =>
    [record.key, record]));
  const checks = await runAuthoritativeLedgerChecks(
    projectRoot,
    completionChecker,
    releaseChecker,
  );
  const ledgerCurrentness = summarizeLedgerCurrentness(checks, v4CurrentSnapshot);
  const records = { ...v4Records, ...v4Artifacts, ...additionalRecords };
  assert.equal(Object.keys(records).length, 382);
  return {
    projectRoot: path.resolve(projectRoot),
    records,
    v4CurrentSnapshot,
    v4Document,
    legacyReaderRejection,
    ledgerCurrentness,
  };
}

export function validateLedgerCurrentness(snapshot) {
  const completion = snapshot.ledgerCurrentness.completion;
  const release = snapshot.ledgerCurrentness.release;
  const completionRecord = snapshot.v4CurrentSnapshot.records.completionLedger;
  const releaseRecord = snapshot.v4CurrentSnapshot.records.lessonReleaseLedger;
  assert.equal(snapshot.ledgerCurrentness.proofKind,
    "authoritative-generator-recomputation-and-exact-byte-equality");
  for (const [label, proof, record, epoch] of [
    ["completion", completion, completionRecord, CURRENT_LEDGER_EPOCH.completionLedger],
    ["release", release, releaseRecord, CURRENT_LEDGER_EPOCH.lessonReleaseLedger],
  ]) {
    assert.equal(proof.ok, true, `${label} ledger authoritative check failed`);
    assert.equal(proof.reason, "current", `${label} ledger is stale`);
    assert.equal(proof.actualEqualsExpected, true,
      `${label} ledger expected/actual bytes differ`);
    assert.equal(proof.actualBytes, epoch.bytes, `${label} ledger actual bytes drifted`);
    assert.equal(proof.expectedBytes, epoch.bytes, `${label} ledger expected bytes drifted`);
    assert.equal(proof.actualSha256, epoch.sha256, `${label} ledger actual SHA-256 drifted`);
    assert.equal(proof.expectedSha256, epoch.sha256,
      `${label} ledger expected SHA-256 drifted`);
    assert.equal(proof.generatedMarker, epoch.generatedMarker,
      `${label} ledger generated marker drifted`);
    assert.equal(record.bytes, epoch.bytes, `${label} bound bytes drifted`);
    assert.equal(record.sha256, epoch.sha256, `${label} bound SHA-256 drifted`);
  }
  assert.equal(completion.strictComplete, 0);
  assert.equal(completion.grade4StrictComplete, 0);
  assert.equal(completion.l10StrictComplete, 0);
  assert.equal(release.publishedReleaseCount, 0);
  assert.equal(release.grade4PublishedReleaseCount, 0);
  assert.equal(release.l10.expectedMemberCount, 47);
  assert.equal(release.l10.strictCompleteCount, 0);
  assert.equal(release.l10.published, false);
  assert.equal(release.l10.status, "unpublished");
  return true;
}

async function assertBoundRecordsUnchanged(snapshot) {
  await Promise.all(Object.values(snapshot.records).map(async (record) => {
    const reread = await readStable(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
    });
    assert.equal(reread.statIdentity, record.statIdentity,
      `${record.path} stat identity drifted`);
    assert.equal(reread.bytes, record.bytes, `${record.path} bytes drifted`);
    assert.equal(reread.sha256, record.sha256, `${record.path} SHA-256 drifted`);
    assert.equal(reread.mode, record.mode, `${record.path} mode drifted`);
  }));
}

export async function assertSnapshotUnchanged(snapshot, {
  completionChecker = checkCompletionLedger,
  releaseChecker = checkLessonReleaseLedger,
} = {}) {
  await assertBoundRecordsUnchanged(snapshot);
  const checks = await runAuthoritativeLedgerChecks(
    snapshot.projectRoot,
    completionChecker,
    releaseChecker,
  );
  const currentness = summarizeLedgerCurrentness(checks, snapshot.v4CurrentSnapshot);
  assert.deepEqual(currentness, snapshot.ledgerCurrentness,
    "Authoritative ledger currentness changed after snapshot");
}

export function deriveContract(snapshot) {
  validateLedgerCurrentness(snapshot);
  const inherited = deriveV4Contract(snapshot.v4CurrentSnapshot);
  assert.equal(inherited.schemaVersion, 4);
  assert.equal(inherited.templateStable, false);
  assert.equal(inherited.inputBindings.completionLedger.sha256,
    CURRENT_LEDGER_EPOCH.completionLedger.sha256);
  assert.equal(inherited.inputBindings.lessonReleaseLedger.sha256,
    CURRENT_LEDGER_EPOCH.lessonReleaseLedger.sha256);

  const report = structuredClone(inherited);
  report.schemaVersion = 5;
  report.status = "fail-closed-template-not-stable";
  report.templateStable = false;
  report.successorOf = binding(snapshot.records.rejectedV4Json);
  report.predecessorDisposition = {
    v4: {
      status: "rejected-superseded-authoritative-ledger-freshness-not-gated",
      preserved: true,
      predecessorEpochWasValidOnlyForItsFixedBytes: true,
      finding:
        "V4 fixed the completion and lesson-release ledger bytes but did not call their authoritative generator currentness functions; later lawful generator rebuilds therefore made its fixed ledger epoch stale without changing any v4 artifact.",
      legacyReaderReuse: snapshot.legacyReaderRejection,
      deriveReuse: {
        export: "deriveContract",
        module: V4_ARTIFACTS.rejectedV4Generator.path,
        outcome: "reused-on-rehydrated-375-binding-current-ledger-successor-snapshot",
        inheritedSchemaVersion: inherited.schemaVersion,
        acceptanceEffect: "none",
      },
      formerLedgerBindings: {
        completion: snapshot.v4Document.inputBindings.completionLedger,
        lessonRelease: snapshot.v4Document.inputBindings.lessonReleaseLedger,
      },
      currentLedgerBindings: {
        completion: binding(snapshot.records.completionLedger),
        lessonRelease: binding(snapshot.records.lessonReleaseLedger),
      },
      artifacts: {
        generator: binding(snapshot.records.rejectedV4Generator),
        tests: binding(snapshot.records.rejectedV4Tests),
        json: binding(snapshot.records.rejectedV4Json),
        markdown: binding(snapshot.records.rejectedV4Markdown),
      },
      acceptanceEffect: "none",
    },
    ...inherited.predecessorDisposition,
  };
  report.evidenceEpochClosure.rule =
    "V5 preserves v4 and its fixed old ledger epoch, records the expected v4 reader rejection, rehydrates all 375 v4 bindings with only the two lawfully rebuilt ledgers replaced, reuses v4 deriveContract, and independently proves both current ledgers by authoritative generator recomputation plus exact byte equality. This creates no migration or acceptance evidence.";
  report.currentLedgerFreshness = {
    status: "current-authoritative-generator-proven",
    completionLedger: binding(snapshot.records.completionLedger),
    lessonReleaseLedger: binding(snapshot.records.lessonReleaseLedger),
    authoritativeFunctions: {
      completion: {
        module: binding(snapshot.records.authoritativeCompletionLedgerGenerator),
        export: snapshot.ledgerCurrentness.completion.checkerExport,
      },
      lessonRelease: {
        module: binding(snapshot.records.authoritativeLessonReleaseLedgerGenerator),
        export: snapshot.ledgerCurrentness.release.checkerExport,
      },
      strictValidator: binding(snapshot.records.authoritativeMigrationValidator),
    },
    codeBindingBoundary: {
      scope: "direct-entrypoints-only-not-transitive-semantic-code-closure",
      recursiveLocalDependenciesHashBound: false,
      packageRuntimeProvenanceBound: false,
      liveAuthoritativeFunctionsExecuted: true,
      rule:
        "The three direct hashes identify the invoked entrypoints. Live recomputation proves the checked-in ledgers match the functions executed in this run; v5 does not claim a complete recursive validator/generator/package-runtime provenance closure.",
      acceptanceEffect: "none",
    },
    proof: snapshot.ledgerCurrentness,
    rule:
      "Exact file hashes alone are insufficient: current means the authoritative functions regenerated identical bytes from current migrations, release definitions, and the strict validator during this read-only run.",
    acceptanceEffect: "none",
  };
  report.currentFormalState.reviewAndRelease.strictCompleteMembers = 0;
  report.currentFormalState.reviewAndRelease.atomicPublished = false;
  report.downstreamTransactionBoundary.decision = "DO_NOT_APPLY";
  report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign = {
    candidatePath: "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md",
    status: "optional-evolving-design-outside-v5-exact-input-closure",
    exactContractBound: false,
    implementationSourceBound: false,
    helperBinaryBound: false,
    protectedInstallReceiptBound: false,
    p0ClosureEffect: false,
    acceptanceEffect: "none",
    rule:
      "The optional design document is not required to prove ledger currentness and is intentionally outside this exact v5 closure while it evolves under separate review. V5 binds no helper design approval, source, binary, policy, build receipt, protected installation, or execution authority.",
  };
  report.automationBoundary.templateBatchAdmissionAllowed = false;
  report.automationBoundary.remainingGrade4LessonBatchStartAllowed = false;
  report.automationBoundary.wholeCourseIntegrationAllowed = false;
  report.acceptanceEffects = Object.fromEntries(EFFECT_KEYS.map((key) => [key, false]));
  report.inputBindings = Object.fromEntries(Object.keys(snapshot.records).sort()
    .map((key) => [key, binding(snapshot.records[key])]));
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 5);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.successorOf.sha256, V4_ARTIFACTS.rejectedV4Json.sha256);
  assert.equal(report.predecessorDisposition.v4.status,
    "rejected-superseded-authoritative-ledger-freshness-not-gated");
  assert.equal(report.predecessorDisposition.v4.preserved, true);
  assert.equal(report.predecessorDisposition.v4.artifacts.generator.sha256,
    V4_ARTIFACTS.rejectedV4Generator.sha256);
  assert.equal(report.predecessorDisposition.v4.artifacts.tests.sha256,
    V4_ARTIFACTS.rejectedV4Tests.sha256);
  assert.equal(report.predecessorDisposition.v4.artifacts.json.sha256,
    V4_ARTIFACTS.rejectedV4Json.sha256);
  assert.equal(report.predecessorDisposition.v4.artifacts.markdown.sha256,
    V4_ARTIFACTS.rejectedV4Markdown.sha256);
  assert.equal(report.predecessorDisposition.v4.legacyReaderReuse.outcome,
    "fail-closed-as-expected");
  assert.equal(report.currentLedgerFreshness.status,
    "current-authoritative-generator-proven");
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.scope,
    "direct-entrypoints-only-not-transitive-semantic-code-closure");
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.recursiveLocalDependenciesHashBound,
    false);
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.packageRuntimeProvenanceBound,
    false);
  assert.equal(report.currentLedgerFreshness.codeBindingBoundary.liveAuthoritativeFunctionsExecuted,
    true);
  assert.equal(report.currentLedgerFreshness.completionLedger.sha256,
    CURRENT_LEDGER_EPOCH.completionLedger.sha256);
  assert.equal(report.currentLedgerFreshness.lessonReleaseLedger.sha256,
    CURRENT_LEDGER_EPOCH.lessonReleaseLedger.sha256);
  assert.equal(report.currentLedgerFreshness.proof.completion.strictComplete, 0);
  assert.equal(report.currentLedgerFreshness.proof.completion.grade4StrictComplete, 0);
  assert.equal(report.currentLedgerFreshness.proof.completion.l10StrictComplete, 0);
  assert.equal(report.currentLedgerFreshness.proof.release.publishedReleaseCount, 0);
  assert.equal(report.currentLedgerFreshness.proof.release.grade4PublishedReleaseCount, 0);
  assert.equal(report.currentLedgerFreshness.proof.release.l10.strictCompleteCount, 0);
  assert.equal(report.currentLedgerFreshness.proof.release.l10.published, false);
  assert.equal(report.currentLedgerFreshness.proof.release.l10.status, "unpublished");
  assert.equal(report.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.atomicPublished, false);
  assert.equal(report.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount, 53);
  assert.equal(report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount, 24);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.exactContractBound,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.p0ClosureEffect,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.implementationSourceBound,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.helperBinaryBound,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.protectedInstallReceiptBound,
    false);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.equal(report.gates.filter(({ satisfied }) => satisfied).length, 1);
  assert.ok(report.gates.every(({ acceptanceEffect }) => acceptanceEffect === "none"));
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(Object.keys(report.inputBindings).length, 382);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const proof = report.currentLedgerFreshness.proof;
  const bindings = Object.values(report.inputBindings).map((item) =>
    `| \`${item.path}\` | ${item.bytes} | \`${item.sha256}\` | \`${item.mode}\` |`,
  ).join("\n");
  return `# Grade 4 Lesson 10 complete-migration template contract v5

Evidence date: **${report.evidenceDate}**  
Status: **${report.status}**  
Template stable: **${report.templateStable}**  
Fingerprint: \`${report.reportFingerprintSha256}\`

## Outcome

V5 preserves v4 byte-for-byte and rejects/supersedes it only as a currentness contract. V4 bound fixed completion/release ledger bytes but did not invoke the authoritative generator functions. Those ledgers were later lawfully regenerated. The preserved v4 reader therefore correctly fails closed on its old epoch, while v5 rehydrates the same 375-binding semantic snapshot, replaces only those two ledger bindings, and reuses v4 \`deriveContract\`.

This successor proves currentness, not completion. Template stability is **false**. L10 remains **0/47 strict-complete** and **unpublished**. Every acceptance, integration, and publication effect remains false; downstream remains **DO_NOT_APPLY**.

## Preserved v4 artifacts

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Generator | ${report.predecessorDisposition.v4.artifacts.generator.bytes} | \`${report.predecessorDisposition.v4.artifacts.generator.sha256}\` |
| Tests | ${report.predecessorDisposition.v4.artifacts.tests.bytes} | \`${report.predecessorDisposition.v4.artifacts.tests.sha256}\` |
| JSON | ${report.predecessorDisposition.v4.artifacts.json.bytes} | \`${report.predecessorDisposition.v4.artifacts.json.sha256}\` |
| Markdown | ${report.predecessorDisposition.v4.artifacts.markdown.bytes} | \`${report.predecessorDisposition.v4.artifacts.markdown.sha256}\` |

The v4 reader was reused and produced the expected fail-closed ledger-epoch rejection. Its derive function was then reused on the exact rehydrated v4 closure with the two authoritative-current successor ledgers. No v1-v4 file was rewritten or deleted.

## Authoritative ledger freshness

| Ledger | Checker result | Exact bytes | SHA-256 | Relevant strict/published state |
|---|---|---:|---|---|
| Completion | ${proof.completion.reason}; expected = actual | ${proof.completion.actualBytes} | \`${proof.completion.actualSha256}\` | repository ${proof.completion.strictComplete}; Grade 4 ${proof.completion.grade4StrictComplete}; L10 ${proof.completion.l10StrictComplete} |
| Lesson release | ${proof.release.reason}; expected = actual | ${proof.release.actualBytes} | \`${proof.release.actualSha256}\` | published ${proof.release.publishedReleaseCount}; Grade 4 published ${proof.release.grade4PublishedReleaseCount}; L10 ${proof.release.l10.strictCompleteCount}/${proof.release.l10.expectedMemberCount}, ${proof.release.l10.status} |

The proof is generator-derived, not a JSON-shape or fixed-hash assertion: \`checkCompletionLedger\` reran the canonical strict validator across ${proof.completion.migrationDirectories} migration directories, and \`checkLessonReleaseLedger\` regenerated the release projection while verifying the exact supplied completion-ledger bytes and marker.

The three recorded code hashes bind the invoked checker/validator **direct entrypoints only**. They are not a recursive semantic-code or package-runtime provenance closure. The currentness claim rests on the live authoritative functions actually executed plus exact expected/actual ledger bytes; it does not claim that every transitive validator or runtime dependency is separately hash-bound by v5.

## Native-helper v2 design boundary

The optional design document at \`${report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.candidatePath}\` is deliberately outside v5's exact input closure while it evolves under separate review. V5 binds no design approval, implementation source, helper binary, policy, reproducible build receipt, protected-install receipt, or execution authority. The optional design closes no P0 here, changes no acceptance gate, and does not alter **DO_NOT_APPLY**.

## Formal state retained from v4

- L10 release denominator: 47 members; 520 bilingual requirements; 44,488 frame obligations.
- Authoritative original-runtime frames: 0; RMSE results: 0; checklist checks: 0.
- Recursive local candidate-code closure: ${report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount} files.
- Digest-declared runtime assets: ${report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount} files with zero recorded digest mismatch.
- Source custody remains the only satisfied gate, with source-custody-only effect.
- Grade 4 course audio closure still has 16 SHA-unresolved MP3s; L10 has 0 of those 16.

## Bound inputs

| Path | Bytes | SHA-256 | Mode |
|---|---:|---|---:|
${bindings}
`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    "Expected --write or --check");
  return args[0];
}

export async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents,
      `${absolute} exists with different bytes; refusing overwrite`);
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
  const report = deriveContract(snapshot);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  await assertSnapshotUnchanged(snapshot);
  const jsonPath = resolveInsideRoot(projectRoot, REPORT_JSON);
  const markdownPath = resolveInsideRoot(projectRoot, REPORT_MARKDOWN);
  if (mode === "--write") {
    const dispositions = [
      await writeNoClobber(jsonPath, json),
      await writeNoClobber(markdownPath, markdown),
    ];
    await assertBoundRecordsUnchanged(snapshot);
    return { mode, report, written: [REPORT_JSON, REPORT_MARKDOWN], dispositions };
  }
  assert.equal(await readFile(jsonPath, "utf8"), json, `${REPORT_JSON} is stale`);
  assert.equal(await readFile(markdownPath, "utf8"), markdown,
    `${REPORT_MARKDOWN} is stale`);
  await assertBoundRecordsUnchanged(snapshot);
  return { mode, report, checked: [REPORT_JSON, REPORT_MARKDOWN] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(
      `${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_JSON} and ${REPORT_MARKDOWN}\n`,
    );
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
