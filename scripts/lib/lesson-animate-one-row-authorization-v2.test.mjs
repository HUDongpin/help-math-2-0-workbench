import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {
  createHash,
  generateKeyPairSync,
  sign as signDocumentBytes,
} from "node:crypto";
import {
  chmod,
  copyFile,
  link,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {
  buildLessonAnimateExecutionCodeClosureManifest,
  canonicalLessonAnimateExecutionCodeClosureJson,
} from "./lesson-animate-execution-code-closure.mjs";
import {
  LESSON_ANIMATE_OWNER_ROLE,
  loadLessonAnimateExternalTrustRootDiagnostic,
} from "./lesson-animate-production-trust.mjs";
import {
  LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED,
  LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
  LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
  beginLessonAnimateOneRowLaunchAttemptV2,
  canonicalLessonAnimateOneRowAuthorizationV2Json,
  claimLessonAnimateOneRowExecutionV2,
  consumeLessonAnimateOneRowAuthorizationV2,
  lessonAnimateOneRowAuthorizationV2SigningBytes,
  takeLessonAnimateOneRowExecutionContextV2,
  verifyLessonAnimateOneRowAuthorizationV2,
  verifyLessonAnimateOneRowAuthorizationV2Diagnostic,
} from "./lesson-animate-one-row-authorization-v2.mjs";

const REPOSITORY_ROOT = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
const FIXED_QUEUE_RELATIVE =
  `work/animate/release-read-only-fla-copies/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}/all/operator-queues/sha256/${LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256}.json`;
const FIXED_STAGING_RELATIVE =
  `work/animate/release-read-only-fla-copies/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}/all/manifests/sha256/${LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256}.json`;
const AUTHORITY_ROOT_RELATIVE =
  `work/animate/g4-l10-authoring-authority/${LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID}`;
const NOW = "2026-08-04T12:00:00.000Z";
const AUTHORITY_BOUNDARY = Object.freeze({
  originalRuntimeBehavior: false,
  ruffleBaseline: false,
  audioCueAcceptance: false,
  javascriptFidelity: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
  migrationCompletion: false,
  wholeLessonIntegration: false,
  publication: false,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const execFileAsync = promisify(execFile);

async function put(root, relative, bytes, mode) {
  const file = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes, {mode});
  await chmod(file, mode);
  return file;
}

async function copy(root, relative, mode) {
  const source = path.join(REPOSITORY_ROOT, ...relative.split("/"));
  const target = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(source, target);
  await chmod(target, mode);
  return target;
}

async function describe(root, relative) {
  const file = path.join(root, ...relative.split("/"));
  const [bytes, information] = await Promise.all([readFile(file), lstat(file)]);
  return {
    file: relative,
    sha256: sha256(bytes),
    bytes: bytes.length,
    mode: (information.mode & 0o7777).toString(8).padStart(4, "0"),
  };
}

function signDocument(document, privateKey, trustDocument) {
  const signature = {
    algorithm: "Ed25519",
    signerRole: "owner",
    signerSubjectId: trustDocument.owner.subjectId,
    trustRootId: trustDocument.trustRootId,
    ownerPublicKeySha256: trustDocument.owner.publicKeySha256,
    ownerKeyFingerprintSha256: trustDocument.owner.keyFingerprintSha256,
    signatureBase64: "",
  };
  const candidate = {...document, signature};
  signature.signatureBase64 = signDocumentBytes(null,
    lessonAnimateOneRowAuthorizationV2SigningBytes(candidate), privateKey).toString("base64");
  return candidate;
}

async function writeReceipt(projectRoot, kind, document) {
  const bytes = Buffer.from(canonicalLessonAnimateOneRowAuthorizationV2Json(document));
  const digest = sha256(bytes);
  const relative = `${AUTHORITY_ROOT_RELATIVE}/${kind}/sha256/${digest}.json`;
  await put(projectRoot, relative, bytes, 0o444);
  return {digest, relative, descriptor: await describe(projectRoot, relative)};
}

async function fixture(t, {
  assignmentWindow = {
    issuedAt: "2026-08-04T11:00:00.000Z",
    notBefore: "2026-08-04T11:00:00.000Z",
    notAfter: "2026-08-05T11:00:00.000Z",
    ttlSeconds: 86_400,
  },
  authorizationWindow = {
    issuedAt: "2026-08-04T11:59:30.000Z",
    notBefore: "2026-08-04T11:59:30.000Z",
    notAfter: "2026-08-04T12:01:30.000Z",
    ttlSeconds: 120,
  },
  mutateAssignmentBeforeSign = (value) => value,
  mutateAssignmentAfterSign = (value) => value,
  mutateAuthorizationBeforeSign = (value) => value,
  mutateAuthorizationAfterSign = (value) => value,
} = {}) {
  const container = await realpath(await mkdtemp(path.join(os.tmpdir(), "l10-auth-v2-")));
  t?.after(async () => rm(container, {recursive: true, force: true}));
  const projectRoot = path.join(container, "project");
  const ownerRoot = path.join(container, "owner-trust");
  const replayRoot = path.join(container, "diagnostic-replay-root");
  await mkdir(projectRoot);
  await mkdir(ownerRoot);
  await mkdir(replayRoot, {mode: 0o700});
  await chmod(replayRoot, 0o700);

  for (const [relative, mode] of [
    [FIXED_QUEUE_RELATIVE, 0o444],
    [FIXED_STAGING_RELATIVE, 0o444],
    ["catalog/lesson-releases.json", 0o644],
    ["catalog/animations.json", 0o644],
    ["catalog/source-manifest.sha256", 0o600],
  ]) await copy(projectRoot, relative, mode);
  assert.equal(sha256(await readFile(path.join(projectRoot, FIXED_QUEUE_RELATIVE))),
    LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256);
  assert.equal(sha256(await readFile(path.join(projectRoot, FIXED_STAGING_RELATIVE))),
    LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256);
  assert.equal(sha256(await readFile(path.join(projectRoot, "catalog/source-manifest.sha256"))),
    LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256);

  const queue = JSON.parse(await readFile(path.join(projectRoot, FIXED_QUEUE_RELATIVE), "utf8"));
  const staging = JSON.parse(await readFile(path.join(projectRoot, FIXED_STAGING_RELATIVE), "utf8"));
  const row = queue.queue[3];
  const stagingRow = staging.entries[3];
  assert.equal(row.queueOrdinal, 4);
  assert.equal(row.releaseOrdinal, 7);
  assert.equal(row.animationId, "course-g04-l10-vb-003");
  assert.equal(stagingRow.assetId,
    "swf-96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d");
  const sourceBindingRelative =
    `work/animate/dependency-authoring-audits/${row.animationId}/source-binding.json`;
  const assistFlaRelative =
    `work/animate/dependency-authoring-audits/${row.animationId}/working-copy/${path.posix.basename(row.sourceFla.file)}`;
  const assistSwfRelative =
    `work/animate/dependency-authoring-audits/${row.animationId}/runtime-source/${path.posix.basename(row.sourceSwf.file)}`;
  for (const [relative, mode] of [
    [row.sourceFla.file, 0o500],
    [row.sourceSwf.file, 0o500],
    [row.workingCopy.file, 0o444],
    [assistFlaRelative, 0o444],
    [assistSwfRelative, 0o444],
    [sourceBindingRelative, 0o444],
    [row.workspaceManifest.file, 0o644],
  ]) await copy(projectRoot, relative, mode);

  await put(projectRoot, "scripts/test-authorized-entry.mjs",
    "import {value} from './test-authorized-dependency.mjs';\nexport {value};\n", 0o644);
  await put(projectRoot, "scripts/test-authorized-dependency.mjs",
    "export const value = 1;\n", 0o644);
  await put(projectRoot, "tools/test-audit.jsfl", "// fixture only\n", 0o644);
  const animateExecutable = await put(projectRoot, "tools/fake-animate",
    "#!/bin/sh\nexit 99\n", 0o755);
  await put(projectRoot, "tools/fake-replay-helper",
    "#!/bin/sh\nexit 99\n", 0o755);
  const closureManifest = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot,
    entrypoint: "scripts/test-authorized-entry.mjs",
    toolchain: {
      nodeExecutable: process.execPath,
      processProbe: "/bin/ps",
      aclProbe: "/bin/ls",
      jsfl: "tools/test-audit.jsfl",
      animateExecutable,
      replayLockHelper: "tools/fake-replay-helper",
    },
  });
  const closureBytes = Buffer.from(canonicalLessonAnimateExecutionCodeClosureJson(closureManifest));
  const closureDigest = sha256(closureBytes);
  const closureRelative =
    `${AUTHORITY_ROOT_RELATIVE}/execution-code-closures/sha256/${closureDigest}.json`;
  await put(projectRoot, closureRelative, closureBytes, 0o444);

  const {publicKey, privateKey} = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({type: "spki", format: "pem"});
  const publicKeyBytes = Buffer.from(publicKeyPem, "utf8");
  const trustDocument = {
    schemaVersion: 1,
    evidenceKind: "lesson-g04-l10-animate-owner-production-trust-root",
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    trustRootId: "owner-l10-animate-v2-fixture",
    issuedAt: "2026-08-04T00:00:00.000Z",
    owner: {
      subjectId: "owner-representative-v2-001",
      displayName: "Owner Representative",
      publicKeyPem,
      publicKeySha256: sha256(publicKeyBytes),
      keyFingerprintSha256: sha256(publicKey.export({type: "spki", format: "der"})),
      role: LESSON_ANIMATE_OWNER_ROLE,
      status: "active",
      notBefore: "2026-08-04T00:00:00.000Z",
      notAfter: "2027-08-04T00:00:00.000Z",
    },
  };
  const trustRootPath = path.join(ownerRoot, "trust-root.json");
  await writeFile(trustRootPath, `${JSON.stringify(trustDocument, null, 2)}\n`, {mode: 0o400});
  await chmod(trustRootPath, 0o400);
  const trustToken = await loadLessonAnimateExternalTrustRootDiagnostic({
    projectRoot,
    ownerControlledRoot: ownerRoot,
    trustRootPath,
    now: NOW,
  });
  const trust = {
    trustRootId: trustDocument.trustRootId,
    ownerSubjectId: trustDocument.owner.subjectId,
    ownerPublicKeySha256: trustDocument.owner.publicKeySha256,
    ownerKeyFingerprintSha256: trustDocument.owner.keyFingerprintSha256,
  };

  let assignment = {
    schemaVersion: 2,
    evidenceKind: "lesson-g04-l10-adobe-animate-named-human-operator-assignment-v2",
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    trust,
    validity: assignmentWindow,
    assignment: {
      roleId: "adobe-animate-human-dialog-operator",
      slot: "primary",
      assigneeFullName: "Alexandra Rivera",
      stableSubjectId: "human-operator-alexandra-rivera-001",
      explicit: true,
      allowedHumanActions: [
        "acknowledge-legacy-actionscript-conversion-dialog",
        "close-without-saving",
      ],
      automationUsed: false,
      consent: {
        scope: "only-confirm-legacy-actionscript-conversion-dialog-and-close-without-saving",
        confirmLegacyActionScriptConversionDialog: true,
        closeWithoutSaving: true,
        savePublishExportAllowed: false,
        automationAllowed: false,
      },
    },
    authorityBoundary: {...AUTHORITY_BOUNDARY},
  };
  assignment = mutateAssignmentBeforeSign(structuredClone(assignment));
  assignment = signDocument(assignment, privateKey, trustDocument);
  assignment = mutateAssignmentAfterSign(structuredClone(assignment));
  const assignmentReceipt = await writeReceipt(projectRoot, "assignments", assignment);

  const sourceFla = await describe(projectRoot, row.sourceFla.file);
  sourceFla.sourceFreezeManifestPath = row.sourceFla.sourceFreezeManifestPath;
  const sourceSwf = await describe(projectRoot, row.sourceSwf.file);
  sourceSwf.sourceFreezeManifestPath = row.sourceSwf.sourceFreezeManifestPath;
  const bindings = {
    namedOperatorAssignmentReceipt: assignmentReceipt.descriptor,
    releasePrepareOnlyQueue: await describe(projectRoot, FIXED_QUEUE_RELATIVE),
    releaseStagingManifest: await describe(projectRoot, FIXED_STAGING_RELATIVE),
    lessonReleasesCatalog: await describe(projectRoot, "catalog/lesson-releases.json"),
    animationsCatalog: await describe(projectRoot, "catalog/animations.json"),
    sourceFreezeManifest: await describe(projectRoot, "catalog/source-manifest.sha256"),
    assistSourceBinding: await describe(projectRoot, sourceBindingRelative),
    executionCodeClosure: await describe(projectRoot, closureRelative),
  };
  let authorization = {
    schemaVersion: 2,
    authorizationType: "lesson-g04-l10-adobe-animate-one-row-one-run-v2",
    decision: "authorize-once",
    trust,
    release: {
      releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
      publicationMode: "atomic",
      releaseOrdinal: row.releaseOrdinal,
      queueOrdinal: row.queueOrdinal,
      releaseRole: stagingRow.releaseRole,
      shardId: row.shardId,
    },
    member: {
      animationId: row.animationId,
      assetId: stagingRow.assetId,
      fla: {
        source: sourceFla,
        releaseWorkingCopy: await describe(projectRoot, row.workingCopy.file),
        assistWorkingCopy: await describe(projectRoot, assistFlaRelative),
      },
      swf: {
        source: sourceSwf,
        assistWorkingCopy: await describe(projectRoot, assistSwfRelative),
      },
    },
    run: {
      runId: "run-l10-vb003-owner-0001",
      nonce: "A234567890bcdefghijklmnopqrstuvwxyz_1234567890XYZ",
      issuedAt: authorizationWindow.issuedAt,
      notBefore: authorizationWindow.notBefore,
      notAfter: authorizationWindow.notAfter,
      ttlSeconds: authorizationWindow.ttlSeconds,
      oneTimeUseRequired: true,
    },
    bindings,
    operator: {
      roleId: "adobe-animate-human-dialog-operator",
      fullName: assignment.assignment.assigneeFullName,
      stableSubjectId: assignment.assignment.stableSubjectId,
      allowedHumanActions: [
        "acknowledge-legacy-actionscript-conversion-dialog",
        "close-without-saving",
      ],
      automationUsed: false,
    },
    authorityBoundary: {...AUTHORITY_BOUNDARY},
  };
  authorization = mutateAuthorizationBeforeSign(structuredClone(authorization));
  authorization = signDocument(authorization, privateKey, trustDocument);
  authorization = mutateAuthorizationAfterSign(structuredClone(authorization));
  const authorizationReceipt = await writeReceipt(projectRoot, "session-authorizations",
    authorization);
  const verifyOptions = {
    projectRoot,
    assignmentSha256: assignmentReceipt.digest,
    authorizationSha256: authorizationReceipt.digest,
    executionCodeClosureSha256: closureDigest,
    trustToken,
    now: NOW,
  };
  return {
    container,
    projectRoot,
    ownerRoot,
    replayRoot,
    trustToken,
    privateKey,
    trustDocument,
    assignment,
    authorization,
    assignmentReceipt,
    authorizationReceipt,
    closureManifest,
    closureDigest,
    verifyOptions,
    row,
    stagingRow,
  };
}

test("diagnostic v2 verifies canonical owner-signed VB003 by deriving fixed queue row 4/release row 7", async (t) => {
  const input = await fixture(t);
  const token = await verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions);
  assert.equal(token.ok, true);
  assert.equal(token.diagnosticOnly, true);
  assert.equal(token.status, "diagnostic-verified-not-consumable");
  assert.equal(token.queueOrdinal, 4);
  assert.equal(token.releaseOrdinal, 7);
  assert.equal(token.animationId, "course-g04-l10-vb-003");
  assert.equal(token.assetId,
    "swf-96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d");
  assert.equal(token.operatorFullName, "Alexandra Rivera");
  assert.equal(token.acceptanceEffect, "none");
  assert.equal(Object.isFrozen(token), true);
});

test("diagnostic verified values, clones, spreads, JSON round trips, and fabricated tokens cannot consume or claim", async (t) => {
  const input = await fixture(t);
  const diagnostic = await verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions);
  for (const candidate of [diagnostic, {...diagnostic}, structuredClone(diagnostic),
    JSON.parse(JSON.stringify(diagnostic)), {ok: true, diagnosticOnly: false}]) {
    await assert.rejects(consumeLessonAnimateOneRowAuthorizationV2(candidate),
      /opaque production verified token/u);
    await assert.rejects(claimLessonAnimateOneRowExecutionV2(candidate),
      /opaque production consumed token/u);
    await assert.rejects(takeLessonAnimateOneRowExecutionContextV2(candidate),
      /opaque production claim token/u);
    await assert.rejects(beginLessonAnimateOneRowLaunchAttemptV2(candidate),
      /opaque production claim token/u);
  }
  await assert.rejects(consumeLessonAnimateOneRowAuthorizationV2(diagnostic, {helper: "/tmp/x"}),
    /exactly one opaque verified token/u);
  await assert.rejects(consumeLessonAnimateOneRowAuthorizationV2(diagnostic,
    {replayRoot: input.replayRoot}), /exactly one opaque verified token/u);
  await assert.rejects(claimLessonAnimateOneRowExecutionV2(diagnostic, {runId: diagnostic.runId}),
    /exactly one opaque consumed token/u);
  await assert.rejects(takeLessonAnimateOneRowExecutionContextV2(diagnostic, {now: NOW}),
    /exactly one opaque claim token/u);
  await assert.rejects(beginLessonAnimateOneRowLaunchAttemptV2(diagnostic, {now: NOW}),
    /exactly one opaque claim token/u);
});

test("execution-context handoff surface is one-time async and revalidates every post-claim authority before return", async () => {
  const modulePath = fileURLToPath(new URL("./lesson-animate-one-row-authorization-v2.mjs",
    import.meta.url));
  const source = await readFile(modulePath, "utf8");
  assert.equal(source.includes("export function getLessonAnimateOneRowExecutionContextV2"),
    false);
  const start = source.indexOf(
    "export async function takeLessonAnimateOneRowExecutionContextV2(claimToken)",
  );
  const end = source.indexOf(
    "\nexport function lessonAnimateOneRowAuthorizationV2FixedPaths",
    start,
  );
  assert.ok(start >= 0 && end > start, "one-time async take export must exist");
  const handoff = source.slice(start, end);
  const latch = handoff.indexOf("claimed.handoffStarted = true;");
  const firstAwait = handoff.indexOf("await ");
  assert.ok(latch >= 0 && firstAwait > latch,
    "handoff latch must flip synchronously before the first await");
  for (const required of [
    "revalidateProductionContext(claimed.consumed.context)",
    "assertReplayLockStillBound(claimed.consumed)",
    "assertPathAbsent(runDirectory(rebound.fresh)",
    "Date.now()",
    "assertValidatedLessonAnimateExecutionCodeClosureStillBound(claimed.closureToken)",
    "sameCanonical(claimClosureContext, reboundClosureContext)",
    "sameCanonical(freshExecutionContext, claimed.executionContext)",
  ]) assert.ok(handoff.includes(required), `handoff must revalidate ${required}`);
  assert.match(handoff,
    /structuredClone\(freshExecutionContext\)/u,
    "handoff must return a deeply frozen clone instead of the WeakMap-held object");
});

test("concurrent diagnostic, cloned, spread, JSON, and fabricated handoff attempts all fail closed", async (t) => {
  const input = await fixture(t);
  const diagnostic = await verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions);
  const candidates = [diagnostic, diagnostic, {...diagnostic}, structuredClone(diagnostic),
    JSON.parse(JSON.stringify(diagnostic)), {ok: true, executionClaimed: true}];
  const outcomes = await Promise.allSettled(candidates.map((candidate) =>
    takeLessonAnimateOneRowExecutionContextV2(candidate)));
  assert.equal(outcomes.every((outcome) => outcome.status === "rejected"
    && /opaque production claim token/u.test(outcome.reason?.message || "")), true);
});

test("production verifier accepts only four exact keys and cannot receive clock, key, expected row, helper, or trust path", async (t) => {
  const input = await fixture(t);
  const production = {
    projectRoot: input.projectRoot,
    assignmentSha256: input.assignmentReceipt.digest,
    authorizationSha256: input.authorizationReceipt.digest,
    executionCodeClosureSha256: input.closureDigest,
  };
  for (const injection of [
    {now: NOW},
    {ownerPublicKey: "caller-key"},
    {expected: {queueOrdinal: 4}},
    {helper: "/tmp/caller-helper"},
    {trustToken: input.trustToken},
    {trustRootPath: path.join(input.ownerRoot, "trust-root.json")},
    {queuePath: path.join(input.projectRoot, FIXED_QUEUE_RELATIVE)},
  ]) {
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2({...production, ...injection}),
      /production verifier options keys drifted/u);
  }
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2(production),
    /exact dedicated runner process entrypoint/u);
});

test("diagnostic verifier also rejects caller expected/key/path/helper injection", async (t) => {
  const input = await fixture(t);
  for (const injection of [
    {expected: input.authorization.member},
    {ownerPublicKey: input.trustDocument.owner.publicKeyPem},
    {helperPath: "/tmp/fake"},
    {queuePath: FIXED_QUEUE_RELATIVE},
  ]) {
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic({
      ...input.verifyOptions,
      ...injection,
    }), /diagnostic verifier options keys drifted/u);
  }
});

test("valid owner signature cannot authorize a different or SWF-only row by caller expectation", async (t) => {
  const input = await fixture(t, {
    mutateAuthorizationBeforeSign(value) {
      value.release.queueOrdinal = 3;
      return value;
    },
  });
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
    /does not select the unique fixed FLA-backed queue row/u);
});

test("owner-signed member descriptor drift is rejected against physical source/copy derivation", async (t) => {
  const input = await fixture(t, {
    mutateAuthorizationBeforeSign(value) {
      value.member.fla.source.mode = "0444";
      return value;
    },
  });
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
    /differs from the independently derived binding/u);
});

test("assignment and authorization signature drift fail closed", async (t) => {
  await t.test("assignment", async (subtest) => {
    const input = await fixture(subtest, {
      mutateAssignmentAfterSign(value) {
        value.assignment.assigneeFullName = "Beatriz Morales";
        return value;
      },
    });
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /assignment.*signature verification failed|assignment.*operator/u);
  });
  await t.test("authorization", async (subtest) => {
    const input = await fixture(subtest, {
      mutateAuthorizationAfterSign(value) {
        value.run.runId = "run-l10-vb003-owner-tampered";
        return value;
      },
    });
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /signature verification failed/u);
  });
});

test("trust owner subject, PEM hash, SPKI fingerprint, and trustRootId are all signed bindings", async (t) => {
  for (const field of ["ownerSubjectId", "ownerPublicKeySha256",
    "ownerKeyFingerprintSha256", "trustRootId"]) {
    await t.test(field, async (subtest) => {
      const input = await fixture(subtest, {
        mutateAuthorizationBeforeSign(value) {
          value.trust[field] = field.includes("Sha256") ? "0".repeat(64) : "different-owner-root";
          return value;
        },
      });
      await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
        /differs from the fixed loaded trust root/u);
    });
  }
});

test("assignment requires a named primary human, explicit two-action consent, and no hidden or automation identity", async (t) => {
  for (const [name, mutate] of [
    ["automation", (value) => { value.assignment.assigneeFullName = "Codex Agent"; }],
    ["n-a", (value) => { value.assignment.assigneeFullName = "N/A"; }],
    ["hidden", (value) => { value.assignment.assigneeFullName = "Alex\u200b Rivera"; }],
    ["not-primary", (value) => { value.assignment.slot = "backup"; }],
    ["save", (value) => { value.assignment.consent.savePublishExportAllowed = true; }],
    ["third-action", (value) => { value.assignment.allowedHumanActions.push("save"); }],
  ]) {
    await t.test(name, async (subtest) => {
      const input = await fixture(subtest, {
        mutateAssignmentBeforeSign(value) {
          mutate(value);
          return value;
        },
      });
      await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
        /assignment/u);
    });
  }
});

test("assignment and authorization validity windows are bounded and enforced with diagnostic clock only", async (t) => {
  await t.test("assignment expired", async (subtest) => {
    const input = await fixture(subtest, {assignmentWindow: {
      issuedAt: "2026-08-03T10:00:00.000Z",
      notBefore: "2026-08-03T10:00:00.000Z",
      notAfter: "2026-08-03T11:00:00.000Z",
      ttlSeconds: 3_600,
    }});
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /assignment.validity is not currently valid/u);
  });
  await t.test("authorization expired", async (subtest) => {
    const input = await fixture(subtest, {authorizationWindow: {
      issuedAt: "2026-08-04T11:57:00.000Z",
      notBefore: "2026-08-04T11:57:00.000Z",
      notAfter: "2026-08-04T11:59:00.000Z",
      ttlSeconds: 120,
    }});
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /authorization.run is not currently valid/u);
  });
  await t.test("authorization below 30 seconds", async (subtest) => {
    const input = await fixture(subtest, {authorizationWindow: {
      issuedAt: "2026-08-04T12:00:00.000Z",
      notBefore: "2026-08-04T12:00:00.000Z",
      notAfter: "2026-08-04T12:00:29.000Z",
      ttlSeconds: 29,
    }});
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /outside its bounded validity window/u);
  });
  await t.test("authorization above 900 seconds", async (subtest) => {
    const input = await fixture(subtest, {authorizationWindow: {
      issuedAt: "2026-08-04T12:00:00.000Z",
      notBefore: "2026-08-04T12:00:00.000Z",
      notAfter: "2026-08-04T12:15:01.000Z",
      ttlSeconds: 901,
    }});
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /outside its bounded validity window/u);
  });
});

test("all-false acceptance boundary is exact and cannot advance current JS, fidelity, review, strict, or publication gates", async (t) => {
  const input = await fixture(t, {
    mutateAuthorizationBeforeSign(value) {
      value.authorityBoundary.javascriptFidelity = true;
      return value;
    },
  });
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
    /javascriptFidelity must remain false/u);
});

test("canonical receipts reject formatting drift and physical hardlink aliasing", async (t) => {
  await t.test("canonical formatting", async (subtest) => {
    const input = await fixture(subtest);
    const noncanonical = Buffer.from(`${JSON.stringify(input.authorization)}\n`);
    const digest = sha256(noncanonical);
    const relative = `${AUTHORITY_ROOT_RELATIVE}/session-authorizations/sha256/${digest}.json`;
    await put(input.projectRoot, relative, noncanonical, 0o444);
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic({
      ...input.verifyOptions,
      authorizationSha256: digest,
    }), /not exact canonical JSON/u);
  });
  await t.test("hardlinked assignment", async (subtest) => {
    const input = await fixture(subtest);
    const assignmentFile = path.join(input.projectRoot, input.assignmentReceipt.relative);
    await link(assignmentFile, `${assignmentFile}.second-link`);
    await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
      /single-link file/u);
  });
});

test("read-only authority receipts reject extended ACL authority", {
  skip: process.platform !== "darwin" && "Darwin ACL syntax is required",
}, async (t) => {
  const input = await fixture(t);
  const authorizationFile = path.join(input.projectRoot,
    ...input.authorizationReceipt.relative.split("/"));
  await execFileAsync("/bin/chmod", ["+a", "everyone deny write", authorizationFile], {
    env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
  });
  const {stdout} = await execFileAsync("/bin/ls", ["-ldeO", authorizationFile], {
    encoding: "utf8",
    env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
  });
  assert.equal(stdout.split(/\r?\n/u).some((line) => /^\s*[0-9]+:\s/u.test(line))
    || stdout.trimStart().split(/\s+/u)[0].endsWith("+"), true,
  "fixture must carry an extended ACL before verification");
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
    /one-row authorization v2 may not carry an extended ACL/u);
});

test("fixed queue/staging/catalog/source-freeze and source-binding drift fail closed", async (t) => {
  const input = await fixture(t);
  const sourceBinding = input.authorization.bindings.assistSourceBinding.file;
  const sourceBindingFile = path.join(input.projectRoot, ...sourceBinding.split("/"));
  await chmod(sourceBindingFile, 0o644);
  await assert.rejects(verifyLessonAnimateOneRowAuthorizationV2Diagnostic(input.verifyOptions),
    /source binding mode must be exactly 0444/u);
});

test("fixed production replay root is external and immutable by the v2 API", () => {
  assert.equal(LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT,
    "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust/replay-locks");
  assert.equal(path.isAbsolute(LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT), true);
  assert.equal(path.relative(REPOSITORY_ROOT,
    LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_REPLAY_ROOT).startsWith(".."), true);
  assert.equal(LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
    "scripts/run-lesson-g4-l10-authorized-one-row-audit.mjs");
  assert.equal(LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED, false,
    "production must remain closed pending a fixed root-owned native launcher capability");
});

test("launch-attempt transition is one-time before-await and revalidates every authority; production branch is intentionally unexecutable", async () => {
  const modulePath = fileURLToPath(new URL("./lesson-animate-one-row-authorization-v2.mjs",
    import.meta.url));
  const source = await readFile(modulePath, "utf8");
  const start = source.indexOf(
    "export async function beginLessonAnimateOneRowLaunchAttemptV2(claimToken)",
  );
  const end = source.indexOf(
    "\nexport function lessonAnimateOneRowAuthorizationV2FixedPaths",
    start,
  );
  assert.ok(start >= 0 && end > start);
  const transition = source.slice(start, end);
  const latch = transition.indexOf("claimed.launchAttemptStarted = true;");
  const firstAwait = transition.indexOf("await ");
  assert.ok(latch >= 0 && firstAwait > latch,
    "launch-attempt latch must flip synchronously before the first await");
  for (const required of [
    "revalidateProductionContext(claimed.consumed.context)",
    "assertReplayLockStillBound(claimed.consumed)",
    "Date.now()",
    "assertValidatedLessonAnimateExecutionCodeClosureStillBound(claimed.closureToken)",
    "sameCanonical(claimClosureContext, reboundClosureContext)",
    "sameCanonical(freshExecutionContext, claimed.executionContext)",
  ]) assert.ok(transition.includes(required), `launch transition must revalidate ${required}`);
  assert.match(source,
    /LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = false/u);
  assert.match(source, /L10_AA_NATIVE_LAUNCH_CAPABILITY_UNAVAILABLE/u);
});

test("signing bytes and canonical JSON are deterministic and exclude only the signature", async (t) => {
  const input = await fixture(t);
  const canonical = canonicalLessonAnimateOneRowAuthorizationV2Json(input.authorization);
  assert.equal(canonical, canonicalLessonAnimateOneRowAuthorizationV2Json(
    structuredClone(input.authorization)));
  const {signature, ...unsigned} = input.authorization;
  assert.equal(lessonAnimateOneRowAuthorizationV2SigningBytes(input.authorization).toString("utf8"),
    canonicalLessonAnimateOneRowAuthorizationV2Json(unsigned));
  assert.equal(signature.algorithm, "Ed25519");
});
