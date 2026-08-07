import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign,
  createHash,
} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertConsumedLessonAnimateOneRowAuthorizationDiagnostic,
  assertLessonAnimateReplayLockStillBoundDiagnostic,
  canonicalLessonAnimateAuthorizationJson,
  commitLessonAnimateOneRowRunClosureDiagnostic,
  consumeLessonAnimateOneRowAuthorizationDiagnostic,
  lessonAnimateFixedAuthorityRoot,
  verifyLessonAnimateOneRowAuthorizationDiagnostic,
} from "./lesson-animate-one-row-authorization.mjs";
import * as legacyAuthorizationModule from "./lesson-animate-one-row-authorization.mjs";

const NOW = Date.parse("2030-01-01T00:01:00.000Z");
const RELEASE_ID = "lesson-g04-l10-perimeter-area";

test("legacy schema-v1 authorization exports are diagnostic-only and expose no production-shaped consumer", () => {
  assert.equal(legacyAuthorizationModule.LESSON_ANIMATE_LEGACY_AUTHORIZATION_DIAGNOSTIC_ONLY, true);
  assert.equal(Object.hasOwn(legacyAuthorizationModule, "verifyLessonAnimateOneRowAuthorization"), false);
  assert.equal(Object.hasOwn(legacyAuthorizationModule, "consumeLessonAnimateOneRowAuthorization"), false);
  assert.equal(Object.hasOwn(legacyAuthorizationModule, "commitLessonAnimateOneRowRunClosure"), false);
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function put(root, relative, bytes, mode = 0o444) {
  const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes, {flag: "wx", mode});
  await chmod(file, mode);
  return file;
}

function portable(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

async function descriptor(root, file, {sourceFreezeManifestPath = null} = {}) {
  const bytes = await readFile(file);
  const information = await stat(file);
  return {
    file: path.isAbsolute(file) && !file.startsWith(`${root}${path.sep}`) ? file : portable(root, file),
    sha256: sha256(bytes),
    bytes: bytes.length,
    mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
    ...(sourceFreezeManifestPath ? {sourceFreezeManifestPath} : {}),
  };
}

function signDocument(unsigned, privateKey, publicKeySha256, signerSubjectId = "owner-peter-human") {
  const signatureBase64 = sign(
    null,
    Buffer.from(canonicalLessonAnimateAuthorizationJson(unsigned)),
    privateKey,
  ).toString("base64");
  return {
    ...unsigned,
    signature: {
      algorithm: "Ed25519",
      signerRole: "owner",
      signerSubjectId,
      ownerPublicKeySha256: publicKeySha256,
      signatureBase64,
    },
  };
}

async function putContentAddressed(root, directory, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const digest = sha256(bytes);
  const file = await put(root, path.join(directory, `${digest}.json`), bytes, 0o444);
  return {
    file,
    binding: {file: portable(root, file), sha256: digest, bytes: bytes.length, mode: "0444"},
  };
}

async function setup({operator = "Alex Rivera", subject = "operator-alex-rivera-human"} = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "l10-authoring-auth-")));
  const {privateKey, publicKey} = generateKeyPairSync("ed25519");
  const publicKeyBytes = Buffer.from(publicKey.export({type: "spki", format: "pem"}));
  const publicKeyFile = await put(root, "trust/owner-ed25519.pub", publicKeyBytes, 0o444);
  const ownerPublicKey = await descriptor(root, publicKeyFile);

  const authorityRoot = lessonAnimateFixedAuthorityRoot(root);
  await mkdir(path.join(authorityRoot, "assignments", "sha256"), {recursive: true});
  await mkdir(path.join(authorityRoot, "session-authorizations", "sha256"), {recursive: true});
  await mkdir(path.join(authorityRoot, "replay-locks"), {recursive: true, mode: 0o700});
  await chmod(path.join(authorityRoot, "replay-locks"), 0o700);

  const assignmentUnsigned = {
    schemaVersion: 1,
    evidenceKind: "lesson-g04-l10-adobe-animate-named-human-operator-assignment",
    releaseId: RELEASE_ID,
    assignment: {
      roleId: "adobe-animate-human-dialog-operator",
      slot: "primary",
      assigneeFullName: operator,
      stableSubjectId: subject,
      explicit: true,
      consentToConfirmLegacyActionScriptConversionDialog: true,
      consentToCloseWithoutSaving: true,
    },
    authorityBoundary: {
      roleAssignmentOnly: true,
      originalRuntimeBehavior: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
      acceptanceEffect: "none; named-human role assignment only",
    },
  };
  const assignment = signDocument(assignmentUnsigned, privateKey, ownerPublicKey.sha256);
  const assignmentRecord = await putContentAddressed(root,
    path.relative(root, path.join(authorityRoot, "assignments", "sha256")), assignment);

  const flaBytes = Buffer.from("fla-exact-source");
  const swfBytes = Buffer.from("FWS-swf-exact-source");
  const flaSourceFile = await put(root,
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla",
    flaBytes);
  const swfSourceFile = await put(root,
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
    swfBytes);
  const releaseFlaFile = await put(root,
    `work/animate/release-read-only-fla-copies/${RELEASE_ID}/all/files/course-g04-l10-vb-003/L10VB03.fla`,
    flaBytes);
  const assistFlaFile = await put(root,
    "work/animate/dependency-authoring-audits/course-g04-l10-vb-003/working-copy/L10VB03.fla",
    flaBytes);
  const assistSwfFile = await put(root,
    "work/animate/dependency-authoring-audits/course-g04-l10-vb-003/runtime-source/L10VB03.swf",
    swfBytes);
  const sourceBindingFile = await put(root,
    "work/animate/dependency-authoring-audits/course-g04-l10-vb-003/source-binding.json",
    Buffer.from("{\"binding\":true}\n"));
  const sourceFreezeFile = await put(root, "catalog/source-manifest.sha256",
    Buffer.from(`${sha256(flaBytes)}  HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla\n${sha256(swfBytes)}  HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf\n`));
  const runnerFile = await put(root, "scripts/run-g4-l10-authorized-animate-authoring-audit-v1.mjs",
    Buffer.from("export const runner = true;\n"), 0o644);
  const jsflFile = await put(root, "scripts/animate-audit-current-document.jsfl",
    Buffer.from("// exact jsfl\n"), 0o644);
  const animateFile = await put(root, path.join(root, "Applications/Adobe Animate 2021"),
    Buffer.from("animate executable"), 0o755);

  const stageValue = {schemaVersion: 1, releaseId: RELEASE_ID, row: "course-g04-l10-vb-003"};
  const stageRecord = await putContentAddressed(root,
    `work/animate/release-read-only-fla-copies/${RELEASE_ID}/all/manifests/sha256`, stageValue);
  const queueValue = {schemaVersion: 1, releaseId: RELEASE_ID, stagingManifest: stageRecord.binding};
  const queueRecord = await putContentAddressed(root,
    `work/animate/release-read-only-fla-copies/${RELEASE_ID}/all/operator-queues/sha256`, queueValue);

  const release = {
    releaseId: RELEASE_ID,
    publicationMode: "atomic",
    releaseOrdinal: 6,
    queueOrdinal: 3,
    releaseRole: "active-xml-referenced-page",
    shardId: "g04-l10-core",
  };
  const member = {
    animationId: "course-g04-l10-vb-003",
    assetId: `swf-${sha256(swfBytes)}`,
    fla: {
      source: await descriptor(root, flaSourceFile, {
        sourceFreezeManifestPath: "HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla",
      }),
      releaseWorkingCopy: await descriptor(root, releaseFlaFile),
      assistWorkingCopy: await descriptor(root, assistFlaFile),
    },
    swf: {
      source: await descriptor(root, swfSourceFile, {
        sourceFreezeManifestPath: "HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
      }),
      assistWorkingCopy: await descriptor(root, assistSwfFile),
    },
  };
  const bindings = {
    releasePrepareOnlyQueue: queueRecord.binding,
    releaseStagingManifest: stageRecord.binding,
    sourceFreezeManifest: await descriptor(root, sourceFreezeFile),
    assistSourceBinding: await descriptor(root, sourceBindingFile),
    runner: await descriptor(root, runnerFile),
    jsfl: await descriptor(root, jsflFile),
    animateExecutable: await descriptor(root, animateFile),
  };
  bindings.animateExecutable.file = animateFile;

  const run = {
    runId: "run-L10Auth001",
    nonce: "nonce_L10_authoring_0123456789ABCDEF_xyz",
    issuedAt: "2030-01-01T00:00:00.000Z",
    notBefore: "2030-01-01T00:00:00.000Z",
    notAfter: "2030-01-01T00:05:00.000Z",
    ttlSeconds: 300,
    oneTimeUseRequired: true,
  };
  const authorizationUnsigned = {
    schemaVersion: 1,
    authorizationType: "lesson-g04-l10-adobe-animate-one-row-one-run",
    decision: "authorize-once",
    release,
    member,
    run,
    bindings: {
      namedOperatorAssignmentReceipt: assignmentRecord.binding,
      ...bindings,
    },
    operator: {
      roleId: "adobe-animate-human-dialog-operator",
      fullName: operator,
      stableSubjectId: subject,
      allowedHumanActions: [
        "acknowledge-legacy-actionscript-conversion-dialog",
        "close-without-saving",
      ],
      automationUsed: false,
    },
    authorityBoundary: {
      roleAssignmentOnly: false,
      originalRuntimeBehavior: false,
      audioAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictAcceptance: false,
      migrationCompletion: false,
      publication: false,
      acceptanceEffect: "none; one-row authoring execution authorization only",
    },
  };
  const authorization = signDocument(authorizationUnsigned, privateKey, ownerPublicKey.sha256);
  const authorizationRecord = await putContentAddressed(root,
    path.relative(root, path.join(authorityRoot, "session-authorizations", "sha256")), authorization);
  const expected = {release, member, bindings};
  const runDirectory = path.join(root,
    "work/animate/dependency-authoring-audits/course-g04-l10-vb-003/runs", run.runId);
  await mkdir(runDirectory, {recursive: true});

  const options = {
    projectRoot: root,
    assignmentPath: assignmentRecord.file,
    authorizationPath: authorizationRecord.file,
    ownerPublicKey,
    expected,
    now: NOW,
  };
  return {
    root,
    privateKey,
    ownerPublicKey,
    assignment,
    assignmentRecord,
    authorization,
    authorizationRecord,
    expected,
    member,
    bindings,
    run,
    runDirectory,
    options,
  };
}

async function cleanup(value) {
  await rm(value.root, {recursive: true, force: true});
}

function executionClaim(value, token, now = NOW) {
  return assertConsumedLessonAnimateOneRowAuthorizationDiagnostic(token, {
    animationId: value.member.animationId,
    assetId: value.member.assetId,
    runId: value.run.runId,
    sourceFlaSha256: value.member.fla.source.sha256,
    sourceSwfSha256: value.member.swf.source.sha256,
    runnerSha256: value.bindings.runner.sha256,
    jsflSha256: value.bindings.jsfl.sha256,
    animateSha256: value.bindings.animateExecutable.sha256,
    now,
  });
}

function passingOutcome(value) {
  return {
    status: "passed",
    endedAt: "2030-01-01T00:02:00.000Z",
    process: {
      launchAttempted: true,
      spawnedAnimateProcessCount: 1,
      exitCode: 0,
      signal: null,
      timedOut: false,
    },
    artifacts: {
      controllerMarkerSha256: "1".repeat(64),
      rawAuthoringReportSha256: "2".repeat(64),
      authoringPngSha256: "3".repeat(64),
      workEvidenceSha256: "4".repeat(64),
    },
    postRun: {
      sourceFlaSha256: value.member.fla.source.sha256,
      sourceSwfSha256: value.member.swf.source.sha256,
      releaseWorkingCopySha256: value.member.fla.releaseWorkingCopy.sha256,
      assistFlaWorkingCopySha256: value.member.fla.assistWorkingCopy.sha256,
      assistSwfWorkingCopySha256: value.member.swf.assistWorkingCopy.sha256,
      allWorkingCopiesReadOnly: true,
      animateProcessCountAfter: 0,
    },
    failure: null,
  };
}

test("valid owner-signed assignment and exact L10 authorization verify without consuming", async () => {
  const value = await setup();
  try {
    const verified = await verifyLessonAnimateOneRowAuthorizationDiagnostic(value.options);
    assert.equal(verified.status, "verified-not-consumed-not-launched");
    assert.equal(verified.animationId, value.member.animationId);
    assert.equal(verified.ownerSignatureVerified, true);
    assert.equal(verified.consumed, false);
    assert.equal(verified.acceptanceEffect, "none");
  } finally {
    await cleanup(value);
  }
});

test("signature tampering, expiry, and automation identities fail closed", async (t) => {
  await t.test("authorization signature tampering", async () => {
    const value = await setup();
    try {
      const tampered = structuredClone(value.authorization);
      tampered.release.releaseOrdinal += 1;
      const record = await putContentAddressed(value.root,
        path.relative(value.root, path.join(lessonAnimateFixedAuthorityRoot(value.root),
          "session-authorizations", "sha256")), tampered);
      await assert.rejects(
        verifyLessonAnimateOneRowAuthorizationDiagnostic({...value.options, authorizationPath: record.file}),
        /differs from the exact expected|signature verification failed/u,
      );
    } finally {
      await cleanup(value);
    }
  });
  await t.test("expired TTL", async () => {
    const value = await setup();
    try {
      await assert.rejects(
        verifyLessonAnimateOneRowAuthorizationDiagnostic({...value.options, now: "2030-01-01T00:05:00.001Z"}),
        /not currently valid/u,
      );
    } finally {
      await cleanup(value);
    }
  });
  await t.test("automation operator token", async () => {
    const value = await setup({operator: "Alex Codex Agent", subject: "operator-codex-agent"});
    try {
      await assert.rejects(verifyLessonAnimateOneRowAuthorizationDiagnostic(value.options), /forbidden automation identity/u);
    } finally {
      await cleanup(value);
    }
  });
});

test("authorization bytes are pinned and path replacement is rejected", async () => {
  const value = await setup();
  try {
    const moved = `${value.authorizationRecord.file}.moved`;
    await assert.rejects(
      verifyLessonAnimateOneRowAuthorizationDiagnostic({
        ...value.options,
        authorizationFileOpenedHook: async () => {
          await rename(value.authorizationRecord.file, moved);
          await writeFile(value.authorizationRecord.file, "{}\n", {mode: 0o444});
          await chmod(value.authorizationRecord.file, 0o444);
        },
      }),
      /path changed while its pinned descriptor was read/u,
    );
    assert.match(await readFile(moved, "utf8"), /one-row-one-run/u);
  } finally {
    await cleanup(value);
  }
});

test("native replay lock has one concurrent winner and opaque token has one execution claim", {
  skip: process.platform !== "darwin",
}, async () => {
  const value = await setup();
  try {
    const results = await Promise.allSettled([
      consumeLessonAnimateOneRowAuthorizationDiagnostic(value.options),
      consumeLessonAnimateOneRowAuthorizationDiagnostic(value.options),
    ]);
    assert.equal(results.filter(({status}) => status === "fulfilled").length, 1);
    assert.equal(results.filter(({status}) => status === "rejected").length, 1);
    assert.match(results.find(({status}) => status === "rejected").reason.message, /already consumed/u);
    const token = results.find(({status}) => status === "fulfilled").value;
    assert.equal(token.replayLockAtomicPrimitive, "openat(O_CREAT|O_EXCL|O_NOFOLLOW)");
    assert.equal(await assertLessonAnimateReplayLockStillBoundDiagnostic(token), true);
    assert.equal(executionClaim(value, token), token);
    assert.throws(() => executionClaim(value, token), /already has an execution claim/u);
    assert.throws(() => executionClaim(value, {...token}), /opaque token/u);
  } finally {
    await cleanup(value);
  }
});

test("post-run closure is immutable, single-winner, and keeps every acceptance authority false", {
  skip: process.platform !== "darwin",
}, async () => {
  const value = await setup();
  try {
    const token = await consumeLessonAnimateOneRowAuthorizationDiagnostic(value.options);
    executionClaim(value, token);
    const results = await Promise.allSettled([
      commitLessonAnimateOneRowRunClosureDiagnostic(token, passingOutcome(value)),
      commitLessonAnimateOneRowRunClosureDiagnostic(token, passingOutcome(value)),
    ]);
    assert.equal(results.filter(({status}) => status === "fulfilled").length, 1);
    assert.equal(results.filter(({status}) => status === "rejected").length, 1);
    const closure = results.find(({status}) => status === "fulfilled").value;
    assert.equal(closure.mode, "0400");
    assert.equal(closure.acceptanceEffect, "none");
    for (const [key, field] of Object.entries(closure.authorityBoundary)) {
      if (key !== "acceptanceEffect" && key !== "roleAssignmentOnly") assert.equal(field, false, key);
    }
    assert.equal(closure.authorityBoundary.roleAssignmentOnly, false);
    assert.match(closure.authorityBoundary.acceptanceEffect, /^none;/u);
    const physical = await stat(closure.file);
    assert.equal((physical.mode & 0o777).toString(8), "400");
    const document = JSON.parse(await readFile(closure.file, "utf8"));
    assert.equal(document.authorizationSha256, token.authorizationSha256);
    assert.equal(document.replayLock.sha256, token.replayLockSha256);
  } finally {
    await cleanup(value);
  }
});

test("a failed post-consumption closure attempt never rolls the nonce back", {
  skip: process.platform !== "darwin",
}, async () => {
  const value = await setup();
  try {
    const token = await consumeLessonAnimateOneRowAuthorizationDiagnostic(value.options);
    executionClaim(value, token);
    const invalid = passingOutcome(value);
    invalid.status = "failed";
    invalid.failure = "bounded run failed";
    await assert.rejects(commitLessonAnimateOneRowRunClosureDiagnostic(token, invalid),
      /failed or interrupted closure may not claim accepted artifacts/u);
    assert.equal(await assertLessonAnimateReplayLockStillBoundDiagnostic(token), true);
    await assert.rejects(consumeLessonAnimateOneRowAuthorizationDiagnostic(value.options), /already consumed/u);
  } finally {
    await cleanup(value);
  }
});
