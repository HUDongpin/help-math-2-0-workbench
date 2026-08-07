import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {link, lstat, mkdir, mkdtemp, open, readFile, rename, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  inspectReportOutputSafety,
  inspectLedgerReproducibility,
  inspectPromotionV2NativeSecurityCandidateBoundary,
  inspectReleaseLedger,
  inspectReleaseScopedProjection,
  parseArguments,
  promotionSecurityTestPlan,
  readFixedProjectFileBinding,
  renderMarkdown,
  selectAtomicRelease,
  summarizeLedgerReproducibility,
  validateOutputPrefix,
  validateWorkspaceReadinessPath,
} from "./build-lesson-promotion-security-readiness.mjs";
import {evaluateRelease} from "./build-lesson-release-ledger.mjs";

const digest = "a".repeat(64);
const execFileAsync = promisify(execFile);
const l4ReleaseId = "lesson-g05-l04-number-lines";
const l5ReleaseId = "lesson-g05-l05-add-subtract-negative-numbers";
const l4OutputPrefix = "reports/g5-l4-promotion-security-readiness";
const l5OutputPrefix = "reports/g5-l5-promotion-security-readiness";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function releaseFixture() {
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-g05-l04-number-lines",
      publicationMode: "atomic",
      expectedCounts: {members: 2, shards: 1},
      members: [
        {ordinal: 1, animationId: "page-1", assetId: `swf-${"1".repeat(64)}`},
        {ordinal: 2, animationId: "shell-1", assetId: `swf-${"2".repeat(64)}`},
      ],
    }],
  };
}

test("selectAtomicRelease selects one exact contiguous release", () => {
  const selected = selectAtomicRelease(releaseFixture(), "lesson-g05-l04-number-lines");
  assert.equal(selected.members.length, 2);
  const duplicated = releaseFixture();
  duplicated.releases.push(structuredClone(duplicated.releases[0]));
  assert.throws(
    () => selectAtomicRelease(duplicated, "lesson-g05-l04-number-lines"),
    /Expected exactly one release/,
  );
});

test("inspectReleaseLedger requires current exact source bindings", () => {
  const manifest = {path: "catalog/lesson-releases.json", bytes: 10, sha256: digest};
  const completion = {path: "catalog/completion-ledger.json", bytes: 20, sha256: "b".repeat(64)};
  const completionValue = {generatedMarker: `sha256:${"c".repeat(64)}`};
  const ledger = {
    schemaVersion: 1,
    sources: {
      lessonReleases: {...manifest},
      completionLedger: {...completion, generatedMarker: completionValue.generatedMarker},
    },
    releases: [{
      releaseId: "lesson-g05-l04-number-lines",
      strictCompleteCount: 55,
      published: true,
    }],
  };
  const current = inspectReleaseLedger({
    releaseLedger: ledger,
    releaseManifestBinding: manifest,
    completionLedgerBinding: completion,
    completionLedger: completionValue,
    releaseId: "lesson-g05-l04-number-lines",
  });
  assert.deepEqual(current, {
    bindingsCurrent: true,
    releaseRowPresent: true,
    published: true,
    strictCompleteCount: 55,
    reason: "current",
  });
  ledger.sources.lessonReleases.sha256 = "d".repeat(64);
  const stale = inspectReleaseLedger({
    releaseLedger: ledger,
    releaseManifestBinding: manifest,
    completionLedgerBinding: completion,
    completionLedger: completionValue,
    releaseId: "lesson-g05-l04-number-lines",
  });
  assert.equal(stale.bindingsCurrent, false);
  assert.equal(stale.published, false);
});

test("ledger reproducibility summary fails closed for stale completion and release checks", () => {
  const stale = summarizeLedgerReproducibility({
    completion: {
      ok: false,
      reason: "stale",
      ledger: {generatedMarker: `sha256:${"1".repeat(64)}`},
    },
    release: {ok: true, reason: "current"},
  });
  assert.equal(stale.allCurrent, false);
  assert.equal(stale.completionLedger.current, false);
  assert.equal(stale.releaseLedger.current, false);
  assert.equal(stale.releaseLedger.reason, "blocked-by-completion-ledger-stale");

  const completionResult = {
    ok: true,
    reason: "current",
    ledger: {generatedMarker: `sha256:${"2".repeat(64)}`},
  };
  const current = summarizeLedgerReproducibility({
    completion: completionResult,
    release: {
      ok: true,
      reason: "current",
      ledger: {generatedMarker: `sha256:${"3".repeat(64)}`},
    },
  });
  assert.equal(current.allCurrent, true);
  assert.equal(current.completionLedger.current, true);
  assert.equal(current.releaseLedger.current, true);

  const staleRelease = summarizeLedgerReproducibility({
    completion: completionResult,
    release: {ok: false, reason: "stale", ledger: {generatedMarker: null}},
  });
  assert.equal(staleRelease.allCurrent, false);
  assert.equal(staleRelease.releaseLedger.reason, "stale");

  const failedRelease = summarizeLedgerReproducibility({
    completion: completionResult,
    releaseError: new Error("synthetic release check failure"),
  });
  assert.equal(failedRelease.allCurrent, false);
  assert.match(failedRelease.releaseLedger.reason, /synthetic release check failure/);
});

test("release-scoped projection ignores unrelated diagnostics but detects target admission drift", () => {
  const release = releaseFixture().releases[0];
  const marker = `sha256:${"4".repeat(64)}`;
  const emptyCompletion = {
    schemaVersion: 1,
    generatedMarker: marker,
    summary: {strictComplete: 0},
    diagnostics: [],
    entries: [],
  };
  const emptyRow = evaluateRelease(release, new Map());
  const current = inspectReleaseScopedProjection({
    release,
    releaseLedger: {releases: [emptyRow]},
    persistedCompletionLedger: emptyCompletion,
    freshCompletionLedger: {
      ...structuredClone(emptyCompletion),
      diagnostics: [{animationId: "unrelated-animation", errorCount: 99}],
    },
  });
  assert.equal(current.current, true);
  assert.equal(current.strictCompleteCount, 0);
  assert.equal(current.missingCount, 2);

  const strictEntry = {
    animationId: "page-1",
    assetId: release.members[0].assetId,
    workspace: "migrations/page-1",
    manifestSha256: "5".repeat(64),
    validation: {mode: "strict", generatedMarker: marker},
  };
  const drifted = inspectReleaseScopedProjection({
    release,
    releaseLedger: {releases: [emptyRow]},
    persistedCompletionLedger: emptyCompletion,
    freshCompletionLedger: {
      ...structuredClone(emptyCompletion),
      summary: {strictComplete: 1},
      entries: [strictEntry],
    },
  });
  assert.equal(drifted.current, false);
  assert.equal(drifted.reason, "persisted-completion-projection-stale");
  assert.equal(drifted.strictCompleteCount, 1);
});

test("release definition digest covers the full selected release entry", () => {
  const release = releaseFixture().releases[0];
  const completion = {
    schemaVersion: 1,
    generatedMarker: `sha256:${"6".repeat(64)}`,
    summary: {strictComplete: 0},
    diagnostics: [],
    entries: [],
  };
  const releaseLedger = {releases: [evaluateRelease(release, new Map())]};
  const original = inspectReleaseScopedProjection({
    release,
    releaseLedger,
    persistedCompletionLedger: completion,
    freshCompletionLedger: completion,
  });
  const changedRelease = {...structuredClone(release), ownerVisibleNote: "full-entry-change"};
  const changed = inspectReleaseScopedProjection({
    release: changedRelease,
    releaseLedger: {releases: [evaluateRelease(changedRelease, new Map())]},
    persistedCompletionLedger: completion,
    freshCompletionLedger: completion,
  });
  assert.notEqual(original.releaseDefinitionSha256, changed.releaseDefinitionSha256);
  assert.equal(original.membershipFingerprint, changed.membershipFingerprint);
});

test("promotion readiness CLI is release-driven and bounded", () => {
  const options = parseArguments([
    "--release-id", "lesson-g05-l04-number-lines",
    "--workspace-readiness", "reports/g5-l4-workspace-readiness.json",
    "--output-prefix", "reports/g5-l4-promotion-security-readiness",
    "--check",
  ]);
  assert.equal(options.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(options.check, true);
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id", l4ReleaseId]),
    /--workspace-readiness is required/,
  );
  assert.throws(() => parseArguments(["--release-id", "x", "--unknown"]), /Unknown option/);
  assert.equal(
    validateWorkspaceReadinessPath(
      "lesson-g05-l05-add-subtract-negative-numbers",
      "reports/g5-l5-workspace-readiness.json",
    ),
    "reports/g5-l5-workspace-readiness.json",
  );
});

test("promotion security test plan binds the Darwin V2 child candidate only to G5 L4", () => {
  const l4Plan = promotionSecurityTestPlan(l4ReleaseId);
  assert.equal(l4Plan.foundation.expectedTestCount, 209);
  assert.equal(l4Plan.expectedTestCount, 222);
  assert.deepEqual(
    l4Plan.diagnosticCandidates.map(({candidateId, reportKey, state, platform, expectedTestCount}) => ({
      candidateId,
      reportKey,
      state,
      platform,
      expectedTestCount,
    })),
    [{
      candidateId: "promotion-v2-darwin-native-security",
      reportKey: "promotionV2DarwinNativeSecurity",
      state: "diagnostic-only-engineering-candidate",
      platform: "darwin",
      expectedTestCount: 13,
    }],
  );
  assert.deepEqual(l4Plan.diagnosticCandidates[0].modules, [
    "scripts/lib/promotion-v2-native-security-candidate.mjs",
    "native/promotion-v2-darwin/PromotionV2NativeHelper.swift",
    "docs/PROMOTION_V2_NATIVE_SECURITY_CANDIDATE.md",
  ]);
  assert.deepEqual(l4Plan.diagnosticCandidates[0].suites, [
    "scripts/promotion-v2-native-security-candidate.test.mjs",
  ]);

  const l5Plan = promotionSecurityTestPlan(l5ReleaseId);
  assert.equal(l5Plan.expectedTestCount, 209);
  assert.deepEqual(l5Plan.diagnosticCandidates, []);
});

test("Promotion V2 child-candidate boundary keeps every production and acceptance effect closed", () => {
  assert.deepEqual(inspectPromotionV2NativeSecurityCandidateBoundary(), {
    state: "diagnostic-only-engineering-candidate",
    productionEnabled: false,
    executorConnected: false,
    writesEnabled: false,
    productionIntegrationPresent: false,
    authoritativeOriginalRuntimeEffect: "none",
    reviewEffect: "none",
    strictCompletionEffect: "none",
    releaseEffect: "none",
    publicationEffect: "none",
    allProductionCapabilitiesDisabled: true,
  });
});

test("promotion readiness CLI rejects unconfined or non-canonical report paths", () => {
  for (const outputPrefix of [
    "/tmp/promotion-readiness",
    "source-assets/promotion-readiness",
    "reports/../source-assets/promotion-readiness",
    "reports//promotion-readiness",
    "reports\\promotion-readiness",
    "reports/promotion-readiness.json",
  ]) {
    assert.throws(() => validateOutputPrefix(l4ReleaseId, outputPrefix));
  }

  assert.equal(validateOutputPrefix(l4ReleaseId, l4OutputPrefix), l4OutputPrefix);
  assert.equal(validateOutputPrefix(l5ReleaseId, l5OutputPrefix), l5OutputPrefix);
  assert.throws(
    () => validateOutputPrefix(l4ReleaseId, l5OutputPrefix),
    /allowlisted report prefix/,
  );
  assert.throws(
    () => validateOutputPrefix(l5ReleaseId, l4OutputPrefix),
    /allowlisted report prefix/,
  );
  assert.throws(
    () => validateOutputPrefix(l4ReleaseId, "reports/g4-l3-promotion-security-readiness"),
    /allowlisted report prefix/,
  );
  assert.throws(
    () => validateOutputPrefix(l4ReleaseId, "reports/arbitrary"),
    /allowlisted report prefix/,
  );
  assert.throws(
    () => validateOutputPrefix("lesson-g04-l03", "reports/g4-l3-promotion-security-readiness"),
    /no promotion-readiness I\/O profile is allowlisted/,
  );
  assert.throws(
    () => validateOutputPrefix("constructor", "reports/arbitrary"),
    /no promotion-readiness I\/O profile is allowlisted/,
  );

  assert.throws(
    () => validateWorkspaceReadinessPath(
      "lesson-g05-l04-number-lines",
      "private-archive/g5-l4-workspace-readiness.json",
    ),
    /allowlisted report/,
  );
  assert.throws(
    () => validateWorkspaceReadinessPath(
      "lesson-g05-l04-number-lines",
      "reports/g5-l5-workspace-readiness.json",
    ),
    /allowlisted report/,
  );
  assert.throws(
    () => validateWorkspaceReadinessPath(
      "lesson-not-allowlisted",
      "reports/g5-l4-workspace-readiness.json",
    ),
    /no promotion-readiness I\/O profile is allowlisted/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id", "lesson-g05-l04-number-lines",
      "--workspace-readiness", "private-archive/secret.json",
      "--output-prefix", "reports/g5-l4-promotion-security-readiness",
    ]),
    /allowlisted report/,
  );
});

async function temporaryProject(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "promotion-readiness-output-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, "reports"));
  return root;
}

test("report output safety accepts only regular single-link targets", async (t) => {
  const root = await temporaryProject(t);
  await Promise.all([
    writeFile(path.join(root, `${l4OutputPrefix}.json`), "{}\n"),
    writeFile(path.join(root, `${l4OutputPrefix}.md`), "# safe\n"),
  ]);
  const inspected = await inspectReportOutputSafety({
    root,
    releaseId: l4ReleaseId,
    outputPrefix: l4OutputPrefix,
  });
  assert.equal(inspected.length, 2);
  assert.ok(inspected.every(({stat}) => stat.isFile() && stat.nlink === 1));
});

test("report output safety rejects symlink ancestors and unsafe targets", async (t) => {
  await t.test("symlink ancestor", async (t) => {
    const root = await temporaryProject(t);
    const outside = await mkdtemp(path.join(os.tmpdir(), "promotion-readiness-outside-"));
    t.after(() => rm(outside, {recursive: true, force: true}));
    await rm(path.join(root, "reports"), {recursive: true});
    await symlink(outside, path.join(root, "reports"));
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /ancestor \d+ must not be a symbolic link/,
    );
  });

  await t.test("target symlink", async (t) => {
    const root = await temporaryProject(t);
    const outside = path.join(root, "outside.json");
    await writeFile(outside, "{}\n");
    await symlink(outside, path.join(root, `${l4OutputPrefix}.json`));
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /json report output must not be a symbolic link/,
    );
  });

  await t.test("non-regular target", async (t) => {
    const root = await temporaryProject(t);
    await mkdir(path.join(root, `${l4OutputPrefix}.json`));
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /json report output must be a regular file/,
    );
  });

  await t.test("hard-linked target", async (t) => {
    const root = await temporaryProject(t);
    const source = path.join(root, "owned.json");
    await writeFile(source, "{}\n");
    await link(source, path.join(root, `${l4OutputPrefix}.json`));
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /json report output must not be a hard link/,
    );
  });

  await t.test("missing target is rejected without creation in write mode", async (t) => {
    const root = await temporaryProject(t);
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /never creates report targets/,
    );
    await assert.rejects(lstat(path.join(root, `${l4OutputPrefix}.json`)), {code: "ENOENT"});
    await assert.rejects(lstat(path.join(root, `${l4OutputPrefix}.md`)), {code: "ENOENT"});
  });

  await t.test("FIFO target is rejected without blocking", async (t) => {
    const root = await temporaryProject(t);
    await execFileAsync("mkfifo", [path.join(root, `${l4OutputPrefix}.json`)]);
    await assert.rejects(
      inspectReportOutputSafety({root, releaseId: l4ReleaseId, outputPrefix: l4OutputPrefix}),
      /json report output must be a regular file/,
    );
  });
});

async function temporaryBindingProject(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "promotion-readiness-binding-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, "catalog"));
  return root;
}

async function runWithTestOnlyDescriptorReadRace(inputPath, raceAction, operation) {
  const probe = await open(inputPath, "r");
  const fileHandlePrototype = Object.getPrototypeOf(probe);
  await probe.close();
  const originalReadFile = fileHandlePrototype.readFile;
  let interceptionCount = 0;
  fileHandlePrototype.readFile = async function (...args) {
    interceptionCount += 1;
    await raceAction();
    return Reflect.apply(originalReadFile, this, args);
  };
  try {
    return await operation();
  } finally {
    fileHandlePrototype.readFile = originalReadFile;
    assert.equal(interceptionCount, 1, "test-only race harness must intercept exactly one descriptor read");
  }
}

test("fixed JSON binding hashes and parses one descriptor byte snapshot", async (t) => {
  const root = await temporaryBindingProject(t);
  const contents = Buffer.from('{"releaseId":"one-snapshot"}\n');
  await writeFile(path.join(root, "catalog/input.json"), contents);
  const binding = await readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true});
  assert.deepEqual(binding.value, {releaseId: "one-snapshot"});
  assert.equal(binding.bytes, contents.length);
  assert.equal(binding.sha256, createHash("sha256").update(contents).digest("hex"));
});

test("production binding export has no callable race hook, including through a case-folded WestWorld root", async (t) => {
  const builderSource = await readFile(path.join(projectRoot, "scripts/build-lesson-promotion-security-readiness.mjs"), "utf8");
  const removedHookName = ["after", "Open"].join("");
  assert.equal(builderSource.includes(removedHookName), false);
  assert.doesNotMatch(builderSource, /typeof\s+\w+\s*===\s*["']function["']/u);
  assert.equal(inspectLedgerReproducibility.length, 0);

  const caseFoldedRoot = projectRoot.toLowerCase();
  let foldedStat;
  try {
    foldedStat = await lstat(caseFoldedRoot);
  } catch (error) {
    if (error?.code === "ENOENT") {
      t.skip("current filesystem is case-sensitive; WestWorld case-fold bypass is not reproducible here");
      return;
    }
    throw error;
  }
  const canonicalStat = await lstat(projectRoot);
  assert.equal(foldedStat.dev, canonicalStat.dev);
  assert.equal(foldedStat.ino, canonicalStat.ino);

  let hookInvoked = false;
  const options = {
    root: caseFoldedRoot,
    parseJson: true,
    [removedHookName]: () => {
      hookInvoked = true;
    },
  };
  const binding = await readFixedProjectFileBinding("package.json", options);
  assert.equal(binding.value.name, "flash-conversion-html5-rebuild");
  assert.equal(hookInvoked, false);
});

test("fixed binding rejects symlinks, hardlinks, FIFOs, and sanitized missing paths", async (t) => {
  await t.test("symlink", async (t) => {
    const root = await temporaryBindingProject(t);
    await writeFile(path.join(root, "outside.json"), "{}\n");
    await symlink(path.join(root, "outside.json"), path.join(root, "catalog/input.json"));
    await assert.rejects(
      readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
      /must not be a symbolic link/,
    );
  });

  await t.test("hardlink", async (t) => {
    const root = await temporaryBindingProject(t);
    await writeFile(path.join(root, "outside.json"), "{}\n");
    await link(path.join(root, "outside.json"), path.join(root, "catalog/input.json"));
    await assert.rejects(
      readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
      /must not be a hard link/,
    );
  });

  await t.test("FIFO", async (t) => {
    const root = await temporaryBindingProject(t);
    await execFileAsync("mkfifo", [path.join(root, "catalog/input.json")]);
    await assert.rejects(
      readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
      /must be a regular file/,
    );
  });

  await t.test("missing error is path-redacted", async (t) => {
    const root = await temporaryBindingProject(t);
    await assert.rejects(
      readFixedProjectFileBinding("catalog/missing.json", {root, parseJson: true}),
      (error) => {
        assert.match(error.message, /fixed binding catalog\/missing\.json does not exist/);
        assert.equal(error.message.includes(root), false);
        return true;
      },
    );
  });
});

test("fixed binding rejects pathname A/B replacement after descriptor open", async (t) => {
  const root = await temporaryBindingProject(t);
  const input = path.join(root, "catalog/input.json");
  const replacement = path.join(root, "replacement.json");
  await writeFile(input, '{"version":"A"}\n');
  await writeFile(replacement, '{"version":"B"}\n');
  await assert.rejects(
    runWithTestOnlyDescriptorReadRace(
      input,
      async () => {
        await rename(input, path.join(root, "catalog/original.json"));
        await rename(replacement, input);
      },
      () => readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
    ),
    /pathname identity changed during access/,
  );
});

test("fixed binding rejects in-place content mutation during snapshot", async (t) => {
  const root = await temporaryBindingProject(t);
  const input = path.join(root, "catalog/input.json");
  await writeFile(input, '{"version":"A"}\n');
  await assert.rejects(
    runWithTestOnlyDescriptorReadRace(
      input,
      () => writeFile(input, '{"version":"B-with-different-size"}\n'),
      () => readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
    ),
    /content metadata changed during snapshot/,
  );
});

test("fixed binding rejects ancestor identity replacement after descriptor open", async (t) => {
  const root = await temporaryBindingProject(t);
  const catalog = path.join(root, "catalog");
  const movedCatalog = path.join(root, "catalog-old");
  await writeFile(path.join(catalog, "input.json"), '{"version":"A"}\n');
  await assert.rejects(
    runWithTestOnlyDescriptorReadRace(
      path.join(catalog, "input.json"),
      async () => {
        await rename(catalog, movedCatalog);
        await mkdir(catalog);
        await rename(path.join(movedCatalog, "input.json"), path.join(catalog, "input.json"));
      },
      () => readFixedProjectFileBinding("catalog/input.json", {root, parseJson: true}),
    ),
    /ancestor \d+ changed during access/,
  );
});

test("promotion readiness markdown preserves the acceptance boundary", () => {
  const markdown = renderMarkdown({
    releaseId: "lesson-g05-l04-number-lines",
    authority: "Acceptance-neutral test.",
    testResult: {passed: 222, tests: 222},
    productionFuses: {allClosed: true},
    release: {
      ledgerBindingsCurrent: false,
      ledgerRowPresent: false,
      strictCompleteCount: 0,
      expectedMemberCount: 55,
      published: false,
    },
    ledgerReproducibility: {
      allCurrent: false,
      completionLedger: {current: false},
      releaseLedger: {current: false},
    },
    releaseScopedProjection: {
      current: true,
      reason: "current",
      strictCompleteCount: 0,
    },
    machineFoundations: {
      durableNonceAndTransactionEntry: {
        testOnlyReferenceHarnessCoversNonceOrderingRecoveryAndCrashSemantics: true,
        productionEntryEnabled: false,
        canonicalExecutorConnected: false,
      },
      kernelAnchoredPathRaceClosure: {
        productionReady: false,
        publicNodeSurface: {pathnameFallbackPermitted: false},
      },
      evidenceReceiptIssuerFoundation: {
        externalCryptographicVerificationRequired: true,
        productionIssuerPresent: false,
        writesEnabled: false,
      },
    },
    diagnosticCandidates: {
      promotionV2DarwinNativeSecurity: {
        state: "diagnostic-only-engineering-candidate",
        testResult: {passed: 13, tests: 13},
        productionEnabled: false,
        executorConnected: false,
        writesEnabled: false,
        productionIntegrationPresent: false,
        promotionAuthority: "none",
      },
    },
    remainingProductionGates: [{code: "REAL_CANDIDATE_E2E_REQUIRED"}],
  });
  assert.match(markdown, /222\/222 passed/);
  assert.match(markdown, /Promotion V2 Darwin native-security child candidate: \*\*13\/13 passed\*\*/);
  assert.match(markdown, /state \*\*diagnostic-only-engineering-candidate\*\*/);
  assert.match(markdown, /production integrated \*\*false\*\*/);
  assert.match(markdown, /promotion authority \*\*none\*\*/);
  assert.match(markdown, /all current \*\*false\*\*/);
  assert.match(markdown, /does not authorize original-runtime execution/);
  assert.match(markdown, /strict \*\*0\/55\*\*/);
  assert.match(markdown, /production entry enabled \*\*false\*\*/);
  assert.match(markdown, /path-race closure production ready: \*\*false\*\*/);
  assert.match(markdown, /production issuer present \*\*false\*\*/);
  assert.match(markdown, /does not claim kernel-anchored path-race closure/);
});
