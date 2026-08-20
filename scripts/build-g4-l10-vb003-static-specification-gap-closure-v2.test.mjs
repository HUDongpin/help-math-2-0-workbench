import assert from "node:assert/strict";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  REPORT_JSON_PATH,
  REPORT_MD_PATH,
  deriveReport,
  parseCliArgs,
  readSnapshot,
  renderMarkdown,
  resolveSafeOutputPath,
  runCli,
  validateCleanStatus,
  validateReport,
  writeNoClobber,
} from "./build-g4-l10-vb003-static-specification-gap-closure-v2.mjs";

let snapshot;
let report;

test.before(async () => {
  snapshot = await readSnapshot(PROJECT_ROOT);
  report = deriveReport(snapshot);
});

test("derives a parse-stable exact-preimage tracked-clean successor", () => {
  assert.equal(validateReport(report, {
    predecessor: snapshot.predecessor,
    template: snapshot.template,
  }), true);
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
  assert.match(report.reportFingerprintSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.successorInputSetSha256, /^[a-f0-9]{64}$/u);
});

test("binds the immutable v1 report and revalidates all 26 v1 inputs", () => {
  assert.equal(report.successorOf.sha256,
    "7150708ad2686e95b058b1a3400fc20563779bc6d9b2114378d6f0c321a62f65");
  assert.equal(report.successorOf.reportFingerprintSha256,
    "c49edaa4b1283a6bfa698794ea4992b2bee52b9f50c611eccd4f873963a2f632");
  assert.equal(report.predecessorInputValidation.validatedCount, 26);
  assert.equal(Object.keys(report.predecessorInputValidation.inputBindings).length, 26);
  assert.equal(report.predecessorInputValidation.preimageSetSha256,
    "e472ce78ecab8658194af162c93eff1cfa7c42117dfa1851f0e78b1372cff043");
});

test("records only the actual untracked-to-tracked-clean epoch transition", () => {
  assert.equal(report.trackingEpochTransition.from.state, "untracked-directory");
  assert.equal(report.trackingEpochTransition.from.statusLine,
    "?? migrations/course-g04-l10-vb-003/");
  assert.equal(report.trackingEpochTransition.to.state,
    "tracked-clean-ordinary-file-set");
  assert.equal(report.trackingEpochTransition.to.statusOutput, "");
  assert.equal(report.workspaceIdentity.gitHeadCommit,
    "42e7f80ce70aaa3819af2f7158e15f5da5470cce");
  assert.equal(report.workspaceIdentity.workspaceTree,
    "85fdc417c416ae73185a5fbff7ddfe26fd56bda4");
});

test("matches all 37 ordinary workspace files to stage-zero index blobs", () => {
  assert.equal(report.workspaceIdentity.trackedFileCount, 37);
  assert.equal(report.workspaceIdentity.enumeratedOrdinaryFileCount, 37);
  assert.equal(report.workspaceIdentity.files.length, 37);
  assert.ok(report.workspaceIdentity.files.every((file) =>
    file.indexStage === 0 && /^[a-f0-9]{40}$/u.test(file.gitBlobSha1) &&
    /^[a-f0-9]{64}$/u.test(file.sha256)));
  assert.equal(report.workspaceIdentity.primaryByteIdentityAlgorithm, "sha256");
  assert.equal(report.workspaceIdentity.gitIndexCrossCheckAlgorithm, "git-blob-sha1");
});

test("carries forward static facts and candidate IDs without adopting them", () => {
  assert.equal(report.decision, "DO_NOT_APPLY");
  assert.equal(report.currentStaticFacts.definitions.total, 120);
  assert.equal(report.currentStaticFacts.frameDomains.unresolvedTimelineCount, 0);
  assert.equal(report.currentStaticFacts.coverage.requirementCount, 4);
  assert.equal(report.currentStaticFacts.coverage.frameIdentityCount, 426);
  assert.equal(report.currentStaticFacts.coverage.authoritativeCapturedFrameCount, 0);
  assert.deepEqual(report.candidatePlanCarryForward.proposedChangeIds, [
    "P1-A-audio-manifest-triangle",
    "P1-B-source-definition-and-host-dependency-manifest",
    "P1-C-static-placeholder-reconciliation",
    "P1-D-nested-structural-keyframe-candidates",
    "P2-brief-and-checklist-static-hygiene",
  ]);
  assert.equal(report.candidatePlanCarryForward.guardedAdopterImplementedByV2, false);
  assert.equal(report.candidatePlanCarryForward.applyAttempted, false);
});

test("keeps template and runtime gates fail-closed", () => {
  assert.equal(report.templateCurrentness.templateStable, false);
  assert.equal(report.templateCurrentness.naturalScheduleReady, 0);
  assert.equal(report.templateCurrentness.authoritativeCapturedFrames, 0);
  assert.equal(report.templateCurrentness.originalRuntimeSessions, 0);
  assert.equal(report.templateCurrentness.registeredFormalRenderers, 0);
  assert.equal(report.templateCurrentness.strictCompleteMembers, 0);
  assert.equal(report.templateCurrentness.atomicPublished, false);
});

test("forbids every mutation, runtime, review, and acceptance effect", () => {
  assert.equal(report.authorityBoundary.readOnlyRecomputation, true);
  assert.equal(report.authorityBoundary.exactPreimageBound, true);
  assert.equal(report.authorityBoundary.noClobberOutputs, true);
  for (const [key, value] of Object.entries(report.authorityBoundary)) {
    if (["readOnlyRecomputation", "exactPreimageBound", "noClobberOutputs", "rule"]
      .includes(key)) continue;
    assert.equal(value, false, key);
  }
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});

test("tampering with a tracked identity or authority flag is rejected", () => {
  const identityMutation = structuredClone(report);
  identityMutation.workspaceIdentity.files[0].sha256 = "0".repeat(64);
  assert.throws(() => validateReport(identityMutation));

  const authorityMutation = structuredClone(report);
  authorityMutation.authorityBoundary.originalRuntimeLaunched = true;
  assert.throws(() => validateReport(authorityMutation),
    /originalRuntimeLaunched/u);
});

test("scoped Git status validation rejects any staged, modified, or untracked byte", () => {
  assert.equal(validateCleanStatus(""), true);
  assert.throws(() => validateCleanStatus(
    "M  migrations/course-g04-l10-vb-003/migration.json\0",
  ), /not empty/u);
  assert.throws(() => validateCleanStatus(
    "?? migrations/course-g04-l10-vb-003/extra.json\0",
  ), /not empty/u);
});

test("CLI deliberately exposes write/check but no apply or runtime mode", () => {
  assert.equal(parseCliArgs(["--write"]), "--write");
  assert.equal(parseCliArgs(["--check"]), "--check");
  assert.throws(() => parseCliArgs(["--apply"]), /deliberately unsupported/u);
  assert.throws(() => parseCliArgs(["--launch"]), /deliberately unsupported/u);
});

test("output handling rejects final-component and parent-directory symlinks", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(tmpdir(), "g4-l10-vb003-v2-symlink-"),
  ));
  try {
    const projectRoot = path.join(temporary, "project");
    const outside = path.join(temporary, "outside");
    await mkdir(projectRoot);
    await mkdir(outside);
    const target = path.join(outside, "target.json");
    await writeFile(target, "{}\n");
    const finalSymlink = path.join(projectRoot, "report.json");
    await symlink(target, finalSymlink);
    await assert.rejects(
      writeNoClobber(finalSymlink, "{}\n"),
      /ordinary non-symlink file|resolves through a symlink/u,
    );

    const parentSymlink = path.join(projectRoot, "reports");
    await symlink(outside, parentSymlink);
    await assert.rejects(
      resolveSafeOutputPath(projectRoot, "reports/new.json"),
      /Output parent resolves through a symlink/u,
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("no-clobber accepts exact immutable bytes and rejects bytes or mode drift", async () => {
  const temporary = await realpath(await mkdtemp(
    path.join(tmpdir(), "g4-l10-vb003-v2-output-"),
  ));
  try {
    const exact = path.join(temporary, "exact.json");
    assert.equal(await writeNoClobber(exact, "exact\n"), "created");
    assert.equal(await writeNoClobber(exact, "exact\n"), "already-current");
    await assert.rejects(
      writeNoClobber(exact, "different\n"),
      /different bytes/u,
    );

    const wrongMode = path.join(temporary, "wrong-mode.json");
    await writeFile(wrongMode, "exact\n", {mode: 0o644});
    await assert.rejects(
      writeNoClobber(wrongMode, "exact\n"),
      /unexpected mode/u,
    );
    await chmod(wrongMode, 0o444);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("checked-in JSON and Markdown exactly match the live derivation", async () => {
  const expectedJson = `${JSON.stringify(report, null, 2)}\n`;
  const expectedMarkdown = renderMarkdown(report);
  assert.equal(await readFile(`${PROJECT_ROOT}/${REPORT_JSON_PATH}`, "utf8"),
    expectedJson);
  assert.equal(await readFile(`${PROJECT_ROOT}/${REPORT_MD_PATH}`, "utf8"),
    expectedMarkdown);
});

test("check mode independently revalidates the frozen successor", async () => {
  const result = await runCli(["--check"], PROJECT_ROOT);
  assert.equal(result.mode, "--check");
  assert.deepEqual(result.checked, [REPORT_JSON_PATH, REPORT_MD_PATH]);
});
