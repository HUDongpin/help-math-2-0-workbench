import assert from "node:assert/strict";
import {link, mkdtemp, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  attachIntegrity,
  compareCaptureState,
  deriveObservedState,
  normalizePorcelainRecords,
  ordinaryFileMetadata,
  parseArguments,
  runDiagnosticCommand,
  selectSnapshotProfile,
  stableJson,
  validateSnapshot,
} from "./capture-lesson-current-state-snapshot-v1.mjs";

const ZERO = "0".repeat(64);
const ONE = "1".repeat(64);

function artifact(logicalId, artifactType = "test-artifact", file = `reports/${logicalId}.json`) {
  return {logicalId, artifactType, path: file, bytes: 10, sha256: ZERO};
}

function command({exitCode = 0, signal = null} = {}) {
  return {
    commandId: "diagnostic",
    scope: "test-scope",
    argv: ["node", "--version"],
    startedAt: "2026-07-26T12:00:00.000Z",
    endedAt: "2026-07-26T12:00:01.000Z",
    exitCode,
    signal,
    outcome: exitCode === 0 && signal === null ? "passed" : "failed",
    stdoutBytes: 1,
    stdoutSha256: ZERO,
    stderrBytes: 0,
    stderrSha256: ONE,
  };
}

function snapshotFixture({members = 55, diagnostic = command()} = {}) {
  const passed = diagnostic.outcome === "passed" ? 1 : 0;
  return attachIntegrity({
    schemaVersion: 1,
    evidenceType: "help-math-current-state-snapshot-v1",
    snapshotId: "test-snapshot",
    releaseId: "lesson-test",
    capturedAt: "2026-07-26T12:00:00.000Z",
    capturePhase: "post-scaffold-pre-authoritative-runtime",
    authority: "Diagnostic only.",
    temporalBoundary: {
      requestedBaselineDate: "2026-07-26",
      preExistingWork: ["Work already existed."],
      statement: "Not a pre-change image.",
    },
    schema: artifact("schema", "json-schema", "schemas/test.json"),
    generator: artifact("generator", "generator-script", "scripts/test.mjs"),
    repository: {
      headState: "unborn",
      headSha: null,
      branch: "codex/test",
      dirty: true,
      statusEntryCount: 2,
      trackedEntryCount: 1,
      untrackedEntryCount: 1,
      statusSha256: ZERO,
      excludedSnapshotOutputCount: 2,
      pathsWithheld: true,
    },
    tools: [
      {name: "node", version: "v24.0.0"},
      {name: "npm", version: "11.0.0"},
      {name: "git", version: "git version 2.50.0"},
    ],
    release: {
      title: "Test lesson",
      definitionSha256: ZERO,
      memberIdentitySetSha256: ONE,
      expectedMemberCount: members,
      activePageCount: members - 1,
      shellCount: 1,
      publicationMode: "atomic",
    },
    inputs: [artifact("release")],
    commands: [diagnostic],
    observedState: {
      expectedMemberCount: members,
      draftValidWorkspaceCount: members,
      implementationStartedCount: 0,
      strictCompleteCount: 0,
      published: false,
      publicRoutesOpen: false,
      authoritativeRuntimeSessionCount: 0,
      authoringAuditCount: 0,
      audioAcceptedFileCount: 0,
      ownerDecisionReceiptCount: 0,
      namedRoleAssignmentReceiptCount: 0,
      completionLedgerCurrent: false,
      releaseLedgerCurrent: false,
      diagnosticCommandCount: 1,
      passedDiagnosticCommandCount: passed,
      failedDiagnosticCommandCount: 1 - passed,
      machinePacketReadyForOwnerReview: true,
      m0ExitReady: false,
      m1Authorized: false,
    },
    knownBoundaries: ["No acceptance effect."],
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      promotionAuthorized: false,
      published: false,
    },
    privacy: {
      exportClass: "public-hash-metadata-only",
      containsRawFrames: false,
      containsRawAudio: false,
      containsPrivatePaths: false,
      containsContactInformation: false,
      containsStudentData: false,
      containsSecrets: false,
      storesCommandOutput: false,
    },
  });
}

test("profile selection is release-driven and rejects output escape", () => {
  const profile = {
    releaseId: "lesson-test",
    snapshotId: "snapshot-test",
    capturePhase: "post-scaffold",
    outputDirectory: "reports/current-state-snapshots/test",
    temporalBoundary: {
      requestedBaselineDate: "2026-07-26",
      preExistingWork: ["existing"],
      statement: "current state only",
    },
    inputArtifacts: [artifact("release")],
    diagnosticCommands: [{commandId: "one", scope: "test", argv: ["node", "--version"]}],
  };
  assert.equal(selectSnapshotProfile({schemaVersion: 1, profiles: [profile]}, "lesson-test"), profile);
  assert.throws(
    () => selectSnapshotProfile({
      schemaVersion: 1,
      profiles: [{...profile, outputDirectory: "reports/current-state-snapshots/../../escape"}],
    }, "lesson-test"),
    /normalized|escapes/,
  );
});

test("porcelain normalization withholds paths and excludes the public receipt", () => {
  const input = Buffer.from(
    " M package.json\0?? reports/current-state-snapshots/test/snapshot.json\0?? secret-looking-name.txt\0",
  );
  const result = normalizePorcelainRecords(input, ["reports/current-state-snapshots/test/snapshot.json"]);
  assert.deepEqual(result.summary, {
    dirty: true,
    statusEntryCount: 2,
    trackedEntryCount: 1,
    untrackedEntryCount: 1,
    statusSha256: result.summary.statusSha256,
  });
  assert.match(result.summary.statusSha256, /^[a-f0-9]{64}$/);
  assert.equal("records" in result.summary, false);
});

test("G4, G5 L4, and G5 L5 observed states derive member counts instead of hard-coding 55", () => {
  for (const members of [40, 55, 57]) {
    const observed = deriveObservedState({
      release: {expectedCounts: {members}},
      workspace: {summary: {draftValidationPassCount: members, implementationStartedCount: 0}},
      sourceScope: {summary: {strictCompleteCount: 0, publishedCount: 0}},
      m0: {
        machinePacket: {
          runtime: {authoritativeSessions: 0},
          authoring: {authoringAudits: 0},
          audio: {accepted: 0},
        },
        summary: {
          ownerDecisionReceiptCount: 0,
          namedRoleAssignmentReceiptCount: 0,
          machinePacketReadyForOwnerReview: true,
          m0ExitReady: false,
          m1StartAuthorized: false,
        },
      },
      commands: [
        {...command(), commandId: "check-protected-completion-ledger"},
        {...command({exitCode: 1}), commandId: "check-lesson-release-ledger"},
      ],
    });
    assert.equal(observed.expectedMemberCount, members);
    assert.equal(observed.draftValidWorkspaceCount, members);
    assert.equal(observed.completionLedgerCurrent, true);
    assert.equal(observed.releaseLedgerCurrent, false);
  }
});

test("failed diagnostics remain valid observed evidence without becoming acceptance", () => {
  const snapshot = snapshotFixture({diagnostic: command({exitCode: 7})});
  assert.equal(validateSnapshot(snapshot), snapshot);
  assert.equal(snapshot.commands[0].outcome, "failed");
  assert.equal(snapshot.observedState.failedDiagnosticCommandCount, 1);
  assert.ok(Object.values(snapshot.acceptanceEffects).every((value) => value === false));
});

test("snapshot integrity and privacy fail closed", () => {
  const tampered = snapshotFixture();
  tampered.release.title = "changed";
  assert.throws(() => validateSnapshot(tampered), /payload integrity/);

  const privatePath = snapshotFixture();
  privatePath.inputs[0].path = "/Volumes/private/source.json";
  const repaired = attachIntegrity(privatePath);
  assert.throws(() => validateSnapshot(repaired), /path is not safe|private path/);

  const accepted = snapshotFixture();
  accepted.acceptanceEffects.ownerAccepted = true;
  const resigned = attachIntegrity(accepted);
  assert.throws(() => validateSnapshot(resigned), /acceptance effects/);
});

test("capture consistency rejects either input or worktree drift", async () => {
  const binding = {
    descriptor: artifact("input"),
    identity: {device: "1", inode: "2", size: "10", modifiedNs: "3", changedNs: "4"},
  };
  const repository = {
    headState: "unborn",
    headSha: null,
    branch: "codex/test",
    statusSha256: ZERO,
  };
  await compareCaptureState({
    startBindings: [binding],
    endBindings: [structuredClone(binding)],
    startRepository: repository,
    endRepository: structuredClone(repository),
  });
  const drifted = structuredClone(binding);
  drifted.identity.inode = "9";
  await assert.rejects(
    compareCaptureState({
      startBindings: [binding],
      endBindings: [drifted],
      startRepository: repository,
      endRepository: repository,
    }),
    /input drifted/,
  );
  await assert.rejects(
    compareCaptureState({
      startBindings: [binding],
      endBindings: [binding],
      startRepository: repository,
      endRepository: {...repository, statusSha256: ONE},
    }),
    /repository state drifted/,
  );
});

test("diagnostic runner preserves stdout and stderr hashes for a failed command", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "current-state-snapshot-test-"));
  try {
    const receipt = await runDiagnosticCommand({
      commandId: "intentional-failure",
      scope: "test",
      argv: ["node", "-e", "process.stdout.write('out'); process.stderr.write('err'); process.exit(7)"],
    }, 0, root);
    assert.equal(receipt.outcome, "failed");
    assert.equal(receipt.exitCode, 7);
    assert.equal(receipt.stdoutBytes, 3);
    assert.equal(receipt.stderrBytes, 3);
    assert.match(receipt.stdoutSha256, /^[a-f0-9]{64}$/);
    assert.match(receipt.stderrSha256, /^[a-f0-9]{64}$/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("ordinary-file guard rejects symlinks and hard links", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "current-state-file-guard-"));
  try {
    const source = path.join(root, "source");
    const hard = path.join(root, "hard");
    const symbolic = path.join(root, "symbolic");
    await writeFile(source, "x");
    await link(source, hard);
    await symlink(source, symbolic);
    await assert.rejects(ordinaryFileMetadata(source, "hard-linked source"), /hard-linked/);
    await assert.rejects(ordinaryFileMetadata(hard, "hard link"), /hard-linked/);
    await assert.rejects(ordinaryFileMetadata(symbolic, "symbolic link"), /ordinary file/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("CLI parsing keeps capture, check, and public-only modes separate", () => {
  assert.deepEqual(
    parseArguments(["--release-id", "lesson-test", "--check", "--public-only"]),
    {
      releaseId: "lesson-test",
      profilesPath: "catalog/current-state-snapshot-profiles.json",
      check: true,
      publicOnly: true,
      help: false,
    },
  );
  assert.throws(() => parseArguments(["--release-id", "lesson-test", "--public-only"]), /requires --check/);
});

test("schema keeps dynamic member counts and a closed top-level envelope", async () => {
  const schema = JSON.parse(await readFileFromProject("schemas/current-state-snapshot-v1.schema.json"));
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.observedState.properties.expectedMemberCount.type, "integer");
  assert.equal("const" in schema.properties.observedState.properties.expectedMemberCount, false);
  assert.ok(schema.required.includes("integrity"));
  assert.ok(schema.required.includes("release"));
});

async function readFileFromProject(relativePath) {
  return import("node:fs/promises").then(({readFile}) =>
    readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  );
}

test("stable JSON is deterministic for integrity hashing", () => {
  assert.equal(stableJson({b: 2, a: 1}), stableJson({a: 1, b: 2}));
});
