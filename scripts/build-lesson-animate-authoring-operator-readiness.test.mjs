import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, link, mkdir, mkdtemp, readFile, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildLessonAnimateAuthoringOperatorReadiness,
  buildRunnerCommand,
  parseAnimateProcessTable,
  parseArguments,
  validateSourceBindingShape,
} from "./build-lesson-animate-authoring-operator-readiness.mjs";
import {parseArguments as parseRunnerArguments} from "./run-assisted-animate-authoring-audit.mjs";
import {stageAnimateReleaseFlaCopies} from "./stage-animate-release-fla-copies.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function put(root, relativePath, bytes, mode = null) {
  const file = path.join(root, relativePath);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function tinyPng(width, height) {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  Buffer.from("IHDR", "ascii").copy(bytes, 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function makeFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "lesson-animate-readiness-"));
  const releaseId = "lesson-g09-l09-fixture";
  const animationId = "course-g09-l09-in-001";
  const shardId = "fixture-shard";
  const archivePrefix = "source-assets/flash/HELP MATH_ORIGINAL FILES";
  const flaRelative = "HELP_COURSES/ELMGR9/L9/IN/L9IN01.fla";
  const swfRelative = "HELP_COURSES/ELMGR9/L9/IN/L9IN01.swf";
  const fla = Buffer.concat([Buffer.from("d0cf11e0a1b11ae1", "hex"), Buffer.from("fixture-fla")]);
  const swf = Buffer.concat([Buffer.from("FWS", "ascii"), Buffer.from([6]), Buffer.from("fixture-swf")]);
  const flaSha256 = sha256(fla);
  const swfSha256 = sha256(swf);
  await put(root, `${archivePrefix}/${flaRelative}`, fla);
  await put(root, `${archivePrefix}/${swfRelative}`, swf);
  await put(root, "catalog/source-manifest.sha256",
    `${flaSha256}  ${flaRelative}\n${swfSha256}  ${swfRelative}\n`);

  const assetId = `swf-${swfSha256}`;
  await put(root, "catalog/animations.json", json({
    schemaVersion: 1,
    animations: [{
      animationId,
      assetId,
      source: {path: swfRelative, sha256: swfSha256, bytes: swf.length},
      pairedFla: {path: flaRelative, sha256: flaSha256, bytes: fla.length},
      classification: {collection: "course", grade: 9, lesson: 9},
      flags: {shell: false},
    }],
  }));
  await put(root, "catalog/lesson-releases.json", json({
    schemaVersion: 1,
    releases: [{
      releaseId,
      grade: 9,
      lesson: 9,
      titleDisplay: "Fixture",
      publicationMode: "atomic",
      expectedCounts: {activeXmlReferencedPages: 1, courseShells: 0, members: 1, shards: 1},
      shards: [{shardId, batchId: shardId, ordinal: 1, memberCount: 1}],
      members: [{
        ordinal: 1,
        animationId,
        assetId,
        releaseRole: "active-xml-referenced-page",
        batchId: shardId,
        shardId,
        source: {path: swfRelative, sha256: swfSha256},
        xmlOccurrence: 1,
      }],
    }],
  }));
  const operatorStatement = "原始运行时／Animate 的具名人工操作员是Dr. Peter Hu";
  const operatorAssignmentReceipt = "catalog/owner-authorizations/operator-assignment.json";
  await put(root, operatorAssignmentReceipt, json({
    schemaVersion: 1,
    evidenceType: "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake",
    releaseId,
    ownerStatement: {
      exactUtf8: operatorStatement,
      byteLength: Buffer.byteLength(operatorStatement),
      sha256: sha256(Buffer.from(operatorStatement)),
    },
    assigningAuthority: {
      ownerFullName: "Dr. Peter Hu",
      ownerRole: "Owner",
      externalSubjectId: null,
    },
    assignment: {
      roleId: "authorized-original-runtime-operator",
      slot: "primary",
      assigneeFullName: "Dr. Peter Hu",
      samePersonAsOwner: true,
      explicit: true,
      duties: [
        "authorized-original-runtime-human-operator",
        "adobe-animate-human-dialog-operator",
      ],
    },
    capacity: {
      minimumRequiredHoursPerWeek: 20,
      committedHoursPerWeek: null,
      status: "not-stated",
    },
    externalSignatureEnvelope: null,
    authorityBoundary: {
      assignmentUserAttested: true,
      assigneeIdentityCryptographicallyVerified: false,
      namedHumanRoleAssignmentEstablished: true,
      namedRoleSlotCountEffect: 1,
      weeklyCapacityCommitmentEstablished: false,
      backupAssignmentEstablished: false,
      runtimeHostApproved: false,
      containmentApproved: false,
      immutableSessionAuthorizationEstablished: false,
      animateGuiExecutionAuthorizedByThisReceiptAlone: false,
      originalRuntimeExecutionAuthorizedByThisReceiptAlone: false,
      actualAnimateExecutionEstablished: false,
      actualOriginalRuntimeSessionEstablished: false,
      humanReviewAccepted: false,
      ownerFidelityAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationAuthorized: false,
      strictAcceptanceEffect: "named-primary-operator-role-only",
    },
  }));
  const sourceFla = `${archivePrefix}/${flaRelative}`;
  const sourceSwf = `${archivePrefix}/${swfRelative}`;
  await put(root, `migrations/${animationId}/migration.json`, json({
    schemaVersion: 2,
    id: animationId,
    animationId,
    assetId,
    source: {
      placementPath: sourceSwf,
      swf: sourceSwf,
      swfSha256,
      fla: sourceFla,
      flaSha256,
      pairedFlaStatus: "present",
    },
  }));

  await put(root, "scripts/stage-animate-release-fla-copies.mjs", "fixture stage generator\n");
  await put(root, "scripts/run-assisted-animate-authoring-audit.mjs", "fixture assist runner\n");
  await put(root, "scripts/build-lesson-animate-authoring-operator-readiness.mjs", "fixture readiness generator\n");
  const jsfl = Buffer.from("// recursive fixture JSFL\n");
  await put(root, "scripts/animate-audit-current-document.jsfl", jsfl);

  const appRoot = path.join(root, "Applications", "Adobe Animate 2021");
  const animateBinary = path.join(
    appRoot,
    "Adobe Animate 2021.app",
    "Contents",
    "MacOS",
    "Adobe Animate 2021",
  );
  const animateBytes = Buffer.from("fixture animate executable\n");
  await put(root, path.relative(root, animateBinary), animateBytes, 0o755);
  await put(root, path.relative(root, path.resolve(path.dirname(animateBinary), "..", "Info.plist")), "fixture plist\n");
  await put(root, "catalog/toolchain.json", json({
    schemaVersion: 1,
    authoringEvidence: {
      adobeAnimateDetected: true,
      application: "Adobe Animate 2021",
      productVersion: "21.0.7",
      applicationPath: appRoot,
    },
  }));

  const probeDir = "work/animate/jsfl-cli-probes/run-fixture";
  const artifacts = {
    generatedAudit: Buffer.from("fixture generated JSFL\n"),
    controller: Buffer.from("fixture controller\n"),
    stdout: Buffer.from(""),
    stderr: Buffer.from(""),
    marker: Buffer.from(json({status: "passed"})),
    report: Buffer.from(json({schemaVersion: 2, documentName: "Untitled-1"})),
    png: tinyPng(550, 400),
  };
  const artifactPaths = {
    generatedAudit: `${probeDir}/generated.jsfl`,
    controller: `${probeDir}/controller.jsfl`,
    stdout: `${probeDir}/stdout.log`,
    stderr: `${probeDir}/stderr.log`,
    marker: `${probeDir}/controller-result.json`,
    report: `${probeDir}/Untitled-1-authoring-audit.json`,
    png: `${probeDir}/Untitled-1-frame-1.png`,
  };
  for (const [name, bytes] of Object.entries(artifacts)) await put(root, artifactPaths[name], bytes);
  const ref = (name) => ({file: artifactPaths[name], sha256: sha256(artifacts[name])});
  const probeFile = await put(root, `${probeDir}/probe-result.json`, json({
    schemaVersion: 1,
    evidenceKind: "adobe-animate-jsfl-cli-probe",
    status: "passed",
    scope: "disposable-blank-document",
    command: {
      executable: animateBinary,
      executableSha256: sha256(animateBytes),
      args: ["--run-jsfl", "-o", artifactPaths.controller],
      intentionallyOmitsQuitFlag: true,
    },
    scripts: {
      auditTemplate: {file: "scripts/animate-audit-current-document.jsfl", sha256: sha256(jsfl)},
      generatedAudit: ref("generatedAudit"),
      controller: ref("controller"),
    },
    process: {
      exitCode: 0,
      signal: null,
      timedOut: false,
      durationMs: 10,
      stdout: ref("stdout"),
      stderr: ref("stderr"),
    },
    artifacts: {
      marker: ref("marker"),
      report: {
        ...ref("report"),
        capturedAt: "fixture",
        animateVersion: "MAC 21,0,7,42652",
        documentName: "Untitled-1",
        stage: {width: 550, height: 400},
        fps: 24,
        frameCount: 1,
      },
      png: {...ref("png"), width: 550, height: 400},
    },
    failure: null,
  }));

  await stageAnimateReleaseFlaCopies({root, releaseId, check: false});
  return {
    root,
    releaseId,
    animationId,
    shardId,
    animateBinary,
    probeFile,
    operatorAssignmentReceipt,
    migrationFile: path.join(root, `migrations/${animationId}/migration.json`),
  };
}

test("argument parser requires an exact release and accepts a shard/check selection", () => {
  assert.throws(() => parseArguments([]), /release-id is required/);
  assert.throws(() => parseArguments(["--release-id", "BAD"]), /safe release ID/);
  assert.deepEqual(parseArguments([
    "--release-id", "lesson-g05-l04-number-lines",
    "--shard-id", "g05-l04-instruction",
    "--check",
  ]), {
    releaseId: "lesson-g05-l04-number-lines",
    shardId: "g05-l04-instruction",
    check: true,
    probeFile: null,
    animateBinary: "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021",
    operatorAssignmentReceipt: null,
    jsonReport: null,
    markdownReport: null,
  });
});

test("process parser admits only the exact Animate executable prefix", () => {
  const binary = "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
  const rows = parseAnimateProcessTable([
    `55 ${binary} --run-jsfl -o controller.jsfl`,
    `12 helper ${binary}`,
    `77 ${binary}-helper`,
    `44 ${binary}`,
  ].join("\n"), binary);
  assert.deepEqual(rows.map(({pid}) => pid), [44, 55]);
});

test("command template is inert until its rejected sentinel is replaced by a named human", () => {
  const entry = {
    animationId: "course-g05-l04-in-003",
    sourceFla: {file: "source-assets/example.fla", sha256: "1".repeat(64)},
    sourceSwf: {file: "source-assets/example.swf", sha256: "2".repeat(64)},
  };
  const command = buildRunnerCommand({nodeExecutable: "/bin/node", runnerFile: "scripts/runner.mjs", entry});
  assert.equal(command.prepareOnly.animateLaunches, false);
  assert.equal(command.humanAssistedRun.argvTemplate.at(-1), "none");
  assert.throws(
    () => parseRunnerArguments(command.humanAssistedRun.argvTemplate.slice(1)),
    /must name the human|named human/i,
  );
  const named = [...command.humanAssistedRun.argvTemplate.slice(1)];
  named[named.length - 1] = "Fixture Human";
  const parsed = parseRunnerArguments(named);
  assert.equal(parsed.mode, "dependency-fla");
  assert.equal(parsed.dialogOperator, "Fixture Human");
  assert.equal(parsed.evidenceSourceKind, "paired-fla-swf");
});

test("source-binding shape rejects false source or acceptance claims", () => {
  const entry = {
    animationId: "course-g05-l04-in-003",
    sourceFla: {file: "source-assets/example.fla", sha256: "1".repeat(64), bytes: 10},
    sourceSwf: {file: "source-assets/example.swf", sha256: "2".repeat(64), bytes: 20},
  };
  const valid = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-read-only-paired-fla-swf-binding",
    evidenceId: entry.animationId,
    sourceKind: "paired-fla-swf",
    acceptanceEffect: "none; work-only authoring evidence preparation",
    source: entry.sourceFla,
    workingCopy: {},
    shippedSwf: {source: entry.sourceSwf, workingCopy: {}},
    intendedAudit: {
      captureFrame: 1,
      recursiveRootAndLibraryTimelines: true,
      frameAndInstanceScriptInventory: true,
      nativeStagePng: true,
      saveOrPublishAllowed: false,
    },
    generatedBy: {file: "scripts/run-assisted-animate-authoring-audit.mjs", sha256: "3".repeat(64)},
  };
  assert.equal(validateSourceBindingShape(valid, entry), true);
  assert.throws(() => validateSourceBindingShape({...valid, acceptanceEffect: "accepted"}, entry), /acceptance authority/);
  assert.throws(() => validateSourceBindingShape({...valid, source: {...entry.sourceFla, sha256: "4".repeat(64)}}, entry),
    /FLA source binding differs/);
});

test("fixture release builds and checks a zero-audit queue, observes receipts without adopting them, and rejects writable staging", async () => {
  const fixture = await makeFixture();
  const beforeMigration = sha256(await readFile(fixture.migrationFile));
  const built = await buildLessonAnimateAuthoringOperatorReadiness({
    root: fixture.root,
    releaseId: fixture.releaseId,
    probeFile: fixture.probeFile,
    animateBinary: fixture.animateBinary,
    processTableText: "",
  });
  assert.equal(built.report.summary.flaBackedItems, 1);
  assert.equal(built.report.summary.pairedAssistPackagesVerified, 1);
  assert.equal(built.report.summary.authoringAuditsEstablished, 0);
  assert.equal(built.report.resultIndexBoundary.observedAttemptReceiptFiles, 0);
  assert.equal(built.report.queue[0].pairedAssistPreparation.flaWorkingCopy.mode, "0444");
  assert.equal(built.report.queue[0].pairedAssistPreparation.swfWorkingCopy.mode, "0444");
  assert.equal(built.report.processGate.state, "closed-awaiting-explicit-named-human-one-row-run");
  assert.equal(sha256(await readFile(fixture.migrationFile)), beforeMigration);

  const namedOperator = await buildLessonAnimateAuthoringOperatorReadiness({
    root: fixture.root,
    releaseId: fixture.releaseId,
    probeFile: fixture.probeFile,
    animateBinary: fixture.animateBinary,
    operatorAssignmentReceipt: fixture.operatorAssignmentReceipt,
    processTableText: "",
    persist: false,
  });
  assert.equal(namedOperator.report.schemaVersion, 2);
  assert.equal(namedOperator.report.operatorAssignment.assigneeFullName, "Dr. Peter Hu");
  assert.equal(namedOperator.report.summary.namedPrimaryOperatorRoleAssignmentsRecorded, 1);
  assert.equal(namedOperator.report.summary.actualSessionOperatorAttestationsRecorded, 0);
  assert.equal(namedOperator.report.processGate.state,
    "closed-named-operator-bound-session-execution-authorization-required");
  assert.equal(namedOperator.report.processGate.humanAssistedRunAllowedNow, false);
  assert.equal(namedOperator.report.queue[0].command.humanAssistedRun.argvTemplate.at(-1), "none");
  assert.equal(namedOperator.report.queue[0].operatorInputs.dialogOperator.namedRoleAssignee, "Dr. Peter Hu");
  assert.equal(namedOperator.report.queue[0].evidenceState.authoringAudit, false);
  const tamperedOperatorReceipt = JSON.parse(await readFile(
    path.join(fixture.root, fixture.operatorAssignmentReceipt),
    "utf8",
  ));
  tamperedOperatorReceipt.authorityBoundary.animateGuiExecutionAuthorizedByThisReceiptAlone = true;
  const tamperedOperatorPath = "catalog/owner-authorizations/operator-assignment-tampered.json";
  await put(fixture.root, tamperedOperatorPath, json(tamperedOperatorReceipt));
  await assert.rejects(
    buildLessonAnimateAuthoringOperatorReadiness({
      root: fixture.root,
      releaseId: fixture.releaseId,
      probeFile: fixture.probeFile,
      animateBinary: fixture.animateBinary,
      operatorAssignmentReceipt: tamperedOperatorPath,
      processTableText: "",
      persist: false,
    }),
    /crossed animateGuiExecutionAuthorizedByThisReceiptAlone/,
  );
  const linkedOperatorPath = path.join(
    fixture.root,
    "catalog/owner-authorizations/operator-assignment-linked.json",
  );
  await symlink(
    path.basename(fixture.operatorAssignmentReceipt),
    linkedOperatorPath,
  );
  await assert.rejects(
    buildLessonAnimateAuthoringOperatorReadiness({
      root: fixture.root,
      releaseId: fixture.releaseId,
      probeFile: fixture.probeFile,
      animateBinary: fixture.animateBinary,
      operatorAssignmentReceipt: path.relative(fixture.root, linkedOperatorPath),
      processTableText: "",
      persist: false,
    }),
    /symbolic-link path component/,
  );
  const hardSourcePath = "catalog/owner-authorizations/operator-assignment-hard-source.json";
  const hardAliasPath = "catalog/owner-authorizations/operator-assignment-hard-alias.json";
  await put(
    fixture.root,
    hardSourcePath,
    await readFile(path.join(fixture.root, fixture.operatorAssignmentReceipt)),
  );
  await link(
    path.join(fixture.root, hardSourcePath),
    path.join(fixture.root, hardAliasPath),
  );
  await assert.rejects(
    buildLessonAnimateAuthoringOperatorReadiness({
      root: fixture.root,
      releaseId: fixture.releaseId,
      probeFile: fixture.probeFile,
      animateBinary: fixture.animateBinary,
      operatorAssignmentReceipt: hardAliasPath,
      processTableText: "",
      persist: false,
    }),
    /must not be hard-linked/,
  );

  const shardBuilt = await buildLessonAnimateAuthoringOperatorReadiness({
    root: fixture.root,
    releaseId: fixture.releaseId,
    shardId: fixture.shardId,
    probeFile: fixture.probeFile,
    animateBinary: fixture.animateBinary,
    processTableText: "",
    persist: false,
  });
  assert.equal(shardBuilt.report.release.shardId, fixture.shardId);
  assert.equal(shardBuilt.report.summary.flaBackedItems, 1);
  assert.equal(shardBuilt.report.queue[0].shardId, fixture.shardId);

  const checked = await buildLessonAnimateAuthoringOperatorReadiness({
    root: fixture.root,
    releaseId: fixture.releaseId,
    probeFile: fixture.probeFile,
    animateBinary: fixture.animateBinary,
    processTableText: "",
    check: true,
  });
  assert.equal(checked.jsonIdentity.sha256, built.jsonIdentity.sha256);

  const fakeRun = path.join(
    fixture.root,
    "work/animate/dependency-authoring-audits",
    fixture.animationId,
    "runs/run-fake/assisted-run-result.json",
  );
  await put(fixture.root, path.relative(fixture.root, fakeRun), json({status: "passed"}));
  const observed = await buildLessonAnimateAuthoringOperatorReadiness({
    root: fixture.root,
    releaseId: fixture.releaseId,
    probeFile: fixture.probeFile,
    animateBinary: fixture.animateBinary,
    processTableText: "",
    check: true,
    persist: false,
  });
  assert.equal(observed.report.resultIndexBoundary.observedAttemptReceiptFiles, 1);
  assert.equal(observed.report.resultIndexBoundary.receiptsValidatedByThisReadinessBuilder, 0);
  assert.equal(observed.report.summary.authoringAuditsEstablished, 0);

  const stagedCopy = path.join(
    fixture.root,
    "work/animate/release-read-only-fla-copies",
    fixture.releaseId,
    "all/files",
    fixture.animationId,
    "L9IN01.fla",
  );
  await chmod(stagedCopy, 0o644);
  await assert.rejects(
    buildLessonAnimateAuthoringOperatorReadiness({
      root: fixture.root,
      releaseId: fixture.releaseId,
      probeFile: fixture.probeFile,
      animateBinary: fixture.animateBinary,
      processTableText: "",
      check: true,
      persist: false,
    }),
    /mode is not exactly 0444|mode must be exactly 0444/,
  );
});
