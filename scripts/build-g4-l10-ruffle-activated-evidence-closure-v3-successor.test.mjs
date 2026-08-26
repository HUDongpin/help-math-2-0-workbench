import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  link as fsLink,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  ACCEPTANCE_EFFECT_KEYS,
  CURRENT_PACKAGE_DESCRIPTOR,
  GENERATOR_PATH,
  REPORT_JSON_PATH,
  REPORT_MARKDOWN_PATH,
  TEST_PATH,
  appendOnlyPublishPair,
  buildG4L10RuffleEvidenceClosureV3Successor,
  checksumClosure,
  computeReportFingerprint,
  descriptorClosure,
  inspectOutputPair,
  outputBytes,
  parseArguments,
  sha256,
  stableJson,
  validateSuccessorReport,
} from "./build-g4-l10-ruffle-activated-evidence-closure-v3-successor.mjs";

const thisPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(thisPath), "..");

function descriptor(relativePath, bytes) {
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function writeFixtureFile(root, relativePath, bytes, mode = 0o644) {
  const absolute = path.join(root, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes, {mode});
  await chmod(absolute, mode);
  return descriptor(relativePath, Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
}

async function snapshotFile(absolute) {
  const information = await lstat(absolute);
  const bytes = await readFile(absolute);
  return {
    dev: information.dev,
    ino: information.ino,
    mode: information.mode,
    nlink: information.nlink,
    size: information.size,
    mtimeMs: information.mtimeMs,
    ctimeMs: information.ctimeMs,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function thawDirectories(root) {
  async function visit(absolute) {
    let information;
    try {
      information = await lstat(absolute);
    } catch {
      return;
    }
    if (!information.isDirectory()) return;
    await chmod(absolute, 0o755);
    const entries = await import("node:fs/promises").then(({readdir}) => readdir(absolute, {withFileTypes: true}));
    for (const entry of entries) if (entry.isDirectory()) await visit(path.join(absolute, entry.name));
  }
  await visit(root);
}

async function buildFixture() {
  const created = await mkdtemp(path.join(os.tmpdir(), "g4-l10-ruffle-v3-successor-"));
  const root = await realpath(created);
  await mkdir(path.join(root, "reports"), {recursive: true});
  await mkdir(path.join(root, "scripts"), {recursive: true});

  await writeFixtureFile(root, GENERATOR_PATH, "fixture generator\n");
  await writeFixtureFile(root, TEST_PATH, "fixture test\n");

  const historicalPackageBytes = Buffer.from('{"name":"fixture-historical"}\n');
  const currentPackageBytes = Buffer.from('{"name":"fixture-current"}\n');
  const historicalPackageDescriptor = descriptor("package.json", historicalPackageBytes);
  const currentPackageDescriptor = await writeFixtureFile(root, "package.json", currentPackageBytes);
  const unchangedTool = await writeFixtureFile(root, "scripts/fixture-tool.mjs", "export const fixed = true;\n");
  const historicalToolFiles = [historicalPackageDescriptor, unchangedTool].sort((a, b) => a.path.localeCompare(b.path));

  const rawDirectories = new Set(["raw"]);
  const runs = [];
  const diagnostics = [];
  const before = [];
  const after = [];
  for (let ordinal = 1; ordinal <= 47; ordinal += 1) {
    const animationId = ordinal === 47
      ? "shell-course-g04-l10-fixture"
      : `course-g04-l10-fixture-${String(ordinal).padStart(3, "0")}`;
    for (const language of ["en", "es"]) {
      const memberDirectory = `raw/${String(ordinal).padStart(2, "0")}-${animationId}`;
      const runDirectory = `${memberDirectory}/${language}`;
      rawDirectories.add(memberDirectory);
      rawDirectories.add(runDirectory);
      const report = await writeFixtureFile(
        root,
        `${runDirectory}/activated-natural-playback-diagnostic.json`,
        `${stableJson({ordinal, animationId, language, forensic: true}, 2)}\n`,
        0o444,
      );
      const beforePng = await writeFixtureFile(
        root,
        `${runDirectory}/before-explicit-activation-stage.png`,
        Buffer.from(`fixture-before-${ordinal}-${language}\n`),
        0o444,
      );
      const afterPng = await writeFixtureFile(
        root,
        `${runDirectory}/activated-natural-playback-stage.png`,
        Buffer.from(`fixture-after-${ordinal}-${language}\n`),
        0o444,
      );
      diagnostics.push(report);
      before.push(beforePng);
      after.push(afterPng);
      runs.push({
        ordinal,
        animationId,
        language,
        report,
        beforeExplicitActivation: beforePng,
        afterExplicitActivationAndFixedDelay: afterPng,
      });
    }
  }
  const batch = await writeFixtureFile(root, "raw/batch.json", "fixture batch\n", 0o444);
  const artifacts = [...diagnostics, ...before, ...after];
  const artifactClosures = {
    diagnosticJson: checksumClosure(diagnostics),
    beforeExplicitActivationPng: checksumClosure(before),
    afterExplicitActivationPng: checksumClosure(after),
    allBeforeAfterPng: checksumClosure([...before, ...after]),
    allDiagnosticJsonAndPng: checksumClosure(artifacts),
  };

  const v2 = {
    schemaVersion: 2,
    reportType: "g4-l10-ruffle-activated-fixed-capture-evidence-closure-v2",
    fixedScope: {
      releaseId: "lesson-g04-l10-perimeter-area",
      runId: "l10-full-current-binding-v1-20260803",
      languages: ["en", "es"],
      memberCount: 47,
      runCount: 94,
    },
    modeFrozenRun: {
      fileCount: 283,
      directoryCount: rawDirectories.size,
      requiredFileMode: "0444",
      requiredDirectoryMode: "0555",
      exactEnumeratedFileAndDirectorySets: true,
    },
    acceptanceBoundary: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: "none",
      originalRuntimeAuthority: false,
      deterministicFrameEvidence: false,
      audioEvidence: false,
      languageStateEvidence: false,
      fidelityEvidence: false,
      rmseEvidence: false,
      currentJavascriptRenderer: false,
      humanReview: false,
      ownerReview: false,
      migrationCompletion: false,
      strictComplete: false,
      wholeLessonIntegration: false,
      publication: false,
    },
    boundInput: {batch},
    runs,
    artifactClosures,
    fixedCaptureWitness: {fixture: true, artifactClosures},
    toolBoundary: {
      files: historicalToolFiles,
      closure: checksumClosure(historicalToolFiles),
      fullBrowserRuntimeDependencyClosure: false,
      historicalServerResponseBodyClosure: false,
    },
  };
  const v2JsonBytes = Buffer.from(`${JSON.stringify(v2, null, 2)}\n`);
  const v2MarkdownBytes = Buffer.from("# Fixture V2\n");
  const v2JsonDescriptor = await writeFixtureFile(
    root,
    "reports/g4-l10-ruffle-activated-evidence-closure-v2.json",
    v2JsonBytes,
    0o444,
  );
  const v2MarkdownDescriptor = await writeFixtureFile(
    root,
    "reports/g4-l10-ruffle-activated-evidence-closure-v2.md",
    v2MarkdownBytes,
    0o444,
  );
  for (const relativeDirectory of [...rawDirectories].sort((a, b) => b.length - a.length)) {
    await chmod(path.join(root, relativeDirectory), 0o555);
  }

  const context = {
    v2JsonDescriptor,
    v2MarkdownDescriptor,
    historicalPackageDescriptor,
    currentPackageDescriptor,
    releaseId: "lesson-g04-l10-perimeter-area",
    runId: "l10-full-current-binding-v1-20260803",
    languages: ["en", "es"],
    memberCount: 47,
    runCount: 94,
    rawArtifactCount: 282,
    rawFileCount: 283,
    toolFileCount: 2,
    runTreeDirectoryCount: rawDirectories.size,
    changedToolPaths: ["package.json"],
  };
  return {
    root,
    context,
    v2,
    rawFiles: [batch, ...artifacts].sort((a, b) => a.path.localeCompare(b.path)),
    async cleanup() {
      await thawDirectories(root);
      await rm(root, {recursive: true, force: true});
    },
  };
}

async function withFixture(callback) {
  const fixture = await buildFixture();
  try {
    return await callback(fixture);
  } finally {
    await fixture.cleanup();
  }
}

function fixtureOutputs(report) {
  const bytes = outputBytes(report);
  return [
    {relativePath: REPORT_JSON_PATH, expected: bytes.json, label: "fixture V3 JSON"},
    {relativePath: REPORT_MARKDOWN_PATH, expected: bytes.markdown, label: "fixture V3 Markdown"},
  ];
}

test("builds a deterministic 47xEN/ES append-only forensic successor with every acceptance effect false", async () => {
  await withFixture(async ({root, context}) => {
    const first = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    const second = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    assert.equal(outputBytes(first.report).json, outputBytes(second.report).json);
    assert.equal(first.report.forensicRawEvidence.runCount, 94);
    assert.equal(first.report.forensicRawEvidence.rawArtifactCount, 282);
    assert.equal(first.report.forensicRawEvidence.totalRawFileCount, 283);
    assert.deepEqual(Object.keys(first.report.acceptanceEffects).sort(), [...ACCEPTANCE_EFFECT_KEYS].sort());
    assert.ok(Object.values(first.report.acceptanceEffects).every((value) => value === false));
    assert.equal(first.report.authorityBoundary.ruffleForensicReferenceOnly, true);
    assert.equal(first.report.authorityBoundary.originalRuntimeAuthority, false);
    assert.equal(first.report.verification.ruffleLaunched, false);
    assert.equal(first.report.verification.originalRuntimeLaunched, false);
    assert.equal(first.report.verification.animateLaunched, false);
  });
});

test("fails closed when the immutable V2 predecessor is stale", async () => {
  await withFixture(async ({root, context}) => {
    const target = path.join(root, context.v2JsonDescriptor.path);
    await chmod(target, 0o644);
    await writeFile(target, `${await readFile(target, "utf8")} `);
    await chmod(target, 0o444);
    await assert.rejects(
      buildG4L10RuffleEvidenceClosureV3Successor({root, context}),
      /immutable V2 JSON predecessor exact descriptor drifted/,
    );
  });
});

test("fails closed on a tampered historical raw file", async () => {
  await withFixture(async ({root, context, rawFiles}) => {
    const target = path.join(root, rawFiles[1].path);
    await chmod(target, 0o644);
    await writeFile(target, Buffer.concat([await readFile(target), Buffer.from("tamper\n")]));
    await chmod(target, 0o444);
    await assert.rejects(
      buildG4L10RuffleEvidenceClosureV3Successor({root, context}),
      /historical V2 raw file\[1\] exact descriptor drifted/,
    );
  });
});

test("fails closed when current package.json moves beyond its exact successor descriptor", async () => {
  await withFixture(async ({root, context}) => {
    await writeFile(path.join(root, "package.json"), '{"name":"later"}\n');
    await assert.rejects(
      buildG4L10RuffleEvidenceClosureV3Successor({root, context}),
      /current package\.json exact descriptor drifted/,
    );
  });
});

test("semantic validation rejects acceptance promotion even after re-fingerprinting", async () => {
  await withFixture(async ({root, context}) => {
    const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    const promoted = structuredClone(report);
    promoted.acceptanceEffects.ownerAcceptance = true;
    promoted.reportFingerprint = computeReportFingerprint(promoted);
    assert.throws(() => validateSuccessorReport(promoted, context), /ownerAcceptance must remain false/);

    const widened = structuredClone(report);
    widened.acceptanceEffects.futureApproval = false;
    widened.reportFingerprint = computeReportFingerprint(widened);
    assert.throws(() => validateSuccessorReport(widened, context), /acceptanceEffects keys drifted/);
  });
});

test("dry-run planning and exact check are byte- and metadata-write-free", async () => {
  await withFixture(async ({root, context, rawFiles}) => {
    const protectedPaths = [
      context.v2JsonDescriptor.path,
      context.v2MarkdownDescriptor.path,
      rawFiles[0].path,
      "package.json",
    ].map((relativePath) => path.join(root, relativePath));
    const before = await Promise.all(protectedPaths.map(snapshotFile));
    const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    const outputs = fixtureOutputs(report);
    const dryRun = await inspectOutputPair({root, outputs, allowAbsent: true});
    assert.equal(dryRun.state, "absent");
    assert.deepEqual(await Promise.all(protectedPaths.map(snapshotFile)), before);
    await assert.rejects(
      inspectOutputPair({root, outputs, allowAbsent: false}),
      /fixture V3 JSON is missing/,
    );

    await appendOnlyPublishPair({root, outputs});
    const outputPaths = outputs.map(({relativePath}) => path.join(root, relativePath));
    const outputBefore = await Promise.all(outputPaths.map(snapshotFile));
    const protectedBeforeCheck = await Promise.all(protectedPaths.map(snapshotFile));
    const rebuilt = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    assert.deepEqual(outputBytes(rebuilt.report), outputBytes(report));
    const checked = await inspectOutputPair({root, outputs, allowAbsent: false});
    assert.equal(checked.state, "current");
    assert.deepEqual(await Promise.all(outputPaths.map(snapshotFile)), outputBefore);
    assert.deepEqual(await Promise.all(protectedPaths.map(snapshotFile)), protectedBeforeCheck);
  });
});

test("apply creates an immutable pair once, preserves predecessors/raw bytes, and refuses stale output", async () => {
  await withFixture(async ({root, context, rawFiles}) => {
    const protectedPaths = [
      context.v2JsonDescriptor.path,
      context.v2MarkdownDescriptor.path,
      ...rawFiles.map(({path: relativePath}) => relativePath),
    ].map((relativePath) => path.join(root, relativePath));
    const protectedBefore = await Promise.all(protectedPaths.map(snapshotFile));
    const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    const outputs = fixtureOutputs(report);
    const first = await appendOnlyPublishPair({root, outputs});
    assert.deepEqual(first, {created: true, state: "current"});
    for (const {relativePath} of outputs) {
      const information = await lstat(path.join(root, relativePath));
      assert.equal(information.mode & 0o7777, 0o444);
      assert.equal(information.nlink, 1);
    }
    assert.deepEqual(await Promise.all(protectedPaths.map(snapshotFile)), protectedBefore);
    const outputPaths = outputs.map(({relativePath}) => path.join(root, relativePath));
    const outputBefore = await Promise.all(outputPaths.map(snapshotFile));
    const second = await appendOnlyPublishPair({root, outputs});
    assert.deepEqual(second, {created: false, state: "current"});
    assert.deepEqual(await Promise.all(outputPaths.map(snapshotFile)), outputBefore);

    await chmod(outputPaths[0], 0o644);
    await writeFile(outputPaths[0], "foreign stale bytes\n");
    await chmod(outputPaths[0], 0o444);
    await assert.rejects(
      appendOnlyPublishPair({root, outputs}),
      /stale and will not be overwritten or rebased/,
    );
    assert.equal(await readFile(outputPaths[0], "utf8"), "foreign stale bytes\n");
  });
});

test("a later pair-install failure rolls back the owned first output and all stages", async () => {
  await withFixture(async ({root, context}) => {
    const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
    const outputs = fixtureOutputs(report);
    await assert.rejects(
      appendOnlyPublishPair({root, outputs, injectFailureAfterLink: 1}),
      /injected failure after output link 1/,
    );
    for (const {relativePath} of outputs) {
      await assert.rejects(lstat(path.join(root, relativePath)), {code: "ENOENT"});
    }
    const reportEntries = await import("node:fs/promises").then(({readdir}) => readdir(path.join(root, "reports")));
    assert.equal(reportEntries.some((name) => name.includes(".stage-")), false);
  });
});

test("linked raw inputs and linked output targets fail closed without touching referents", async (t) => {
  await t.test("hard-linked raw input", async () => {
    await withFixture(async ({root, context, rawFiles}) => {
      await fsLink(path.join(root, rawFiles[1].path), path.join(root, "raw-hardlink-alias"));
      await assert.rejects(
        buildG4L10RuffleEvidenceClosureV3Successor({root, context}),
        /historical V2 raw file\[1\] must not be hard linked/,
      );
    });
  });
  await t.test("symlink output", async () => {
    await withFixture(async ({root, context}) => {
      const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
      const outputs = fixtureOutputs(report);
      const referent = path.join(root, "reports", "foreign-referent");
      await writeFile(referent, "foreign\n");
      await symlink("foreign-referent", path.join(root, outputs[0].relativePath));
      await assert.rejects(
        appendOnlyPublishPair({root, outputs}),
        /regular non-symlink file/,
      );
      assert.equal(await readFile(referent, "utf8"), "foreign\n");
    });
  });
  await t.test("hard-linked output", async () => {
    await withFixture(async ({root, context}) => {
      const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root, context});
      const outputs = fixtureOutputs(report);
      const referent = path.join(root, "reports", "foreign-hardlink-referent");
      await writeFile(referent, "foreign\n");
      await fsLink(referent, path.join(root, outputs[0].relativePath));
      await assert.rejects(
        appendOnlyPublishPair({root, outputs}),
        /must not be hard linked/,
      );
      assert.equal(await readFile(referent, "utf8"), "foreign\n");
    });
  });
});

test("CLI parsing exposes only explicit help, dry-run, check, or apply modes", () => {
  assert.deepEqual(parseArguments(["--help"]), {mode: "help"});
  assert.deepEqual(parseArguments(["--dry-run"]), {mode: "dry-run"});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check"});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply"});
  assert.throws(() => parseArguments([]), /exactly one/);
  assert.throws(() => parseArguments(["--apply", "--check"]), /exactly one/);
  assert.throws(() => parseArguments(["--launch"]), /unknown or unsafe option/);
});

test("builder contains no Ruffle, Projector, Animate, browser, server, or Git execution primitive", async () => {
  const source = await readFile(path.join(projectRoot, GENERATOR_PATH), "utf8");
  for (const forbidden of [
    /from ["']node:child_process["']/,
    /\bspawn(?:Sync)?\s*\(/,
    /\bexec(?:File|FileSync|Sync)?\s*\(/,
    /playwright\s*\./,
    /@ruffle-rs\/ruffle/,
    /\bgit\s+(?:status|diff|add|commit|checkout|restore|reset)\b/,
  ]) assert.doesNotMatch(source, forbidden);
});

test("the real repository dry-run build binds the exact current package and all historical bytes without writing reports", async () => {
  const jsonPath = path.join(projectRoot, REPORT_JSON_PATH);
  const markdownPath = path.join(projectRoot, REPORT_MARKDOWN_PATH);
  const before = await Promise.all([jsonPath, markdownPath].map(async (absolute) => {
    try {
      return await snapshotFile(absolute);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }));
  const {report} = await buildG4L10RuffleEvidenceClosureV3Successor({root: projectRoot});
  assert.deepEqual(report.packageSnapshotBinding.currentDescriptor, CURRENT_PACKAGE_DESCRIPTOR);
  assert.equal(report.forensicRawEvidence.totalRawFileCount, 283);
  assert.equal(report.toolBoundaryReconciliation.changedPaths.length, 1);
  assert.deepEqual(report.toolBoundaryReconciliation.changedPaths, ["package.json"]);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  const after = await Promise.all([jsonPath, markdownPath].map(async (absolute) => {
    try {
      return await snapshotFile(absolute);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }));
  assert.deepEqual(after, before);
});

test("raw closure helpers bind both content identity and descriptor byte counts", () => {
  const entries = [
    {path: "b", bytes: 2, sha256: "b".repeat(64)},
    {path: "a", bytes: 1, sha256: "a".repeat(64)},
  ];
  assert.equal(checksumClosure(entries).count, 2);
  assert.equal(descriptorClosure(entries).count, 2);
  assert.notEqual(checksumClosure(entries).sha256, descriptorClosure(entries).sha256);
  const changedBytes = structuredClone(entries);
  changedBytes[0].bytes = 3;
  assert.equal(checksumClosure(entries).sha256, checksumClosure(changedBytes).sha256);
  assert.notEqual(descriptorClosure(entries).sha256, descriptorClosure(changedBytes).sha256);
});
