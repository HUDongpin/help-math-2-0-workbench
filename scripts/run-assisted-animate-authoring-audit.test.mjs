import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, link, lstat, mkdtemp, mkdir, readFile, symlink, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {
  PILOT_CAPTURE_FRAMES,
  buildAssistedControllerJsfl,
  buildDependencyGeneratedAuditScript,
  materializeDependencyLibraryShards,
  parseArguments,
  runningAnimate,
  runAssistedAudit,
  runDependencyAssistedAudit,
  stageDependencyFla,
  validateAssistedArtifacts,
} from "./run-assisted-animate-authoring-audit.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");

function pngHeader(width, height) {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png, 0);
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
  return png;
}

test("assisted Animate CLI accepts exactly one registered pilot and bounded wait", () => {
  assert.deepEqual(parseArguments(["formula-elementary-conversion-01-01", "--timeout-ms", "30000"]), {
    animationId: "formula-elementary-conversion-01-01",
    animateBinary: "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021",
    workRoot: path.resolve("work/animate/human-assisted-fla-runs"),
    workingCopyRoot: path.resolve("work/animate/read-only-fla-copies"),
    timeoutMs: 30000,
  });
  assert.equal(Object.keys(PILOT_CAPTURE_FRAMES).length, 8);
  assert.throws(() => parseArguments(["one", "two"]), /Exactly one animation-id/);
  assert.throws(() => parseArguments(["one", "--timeout-ms", "29999"]), /30000 through 1800000/);
});

test("dependency CLI is hash-pinned, work-only, and requires a named human only for a full run", () => {
  const sourceSha256 = "a".repeat(64);
  const prepared = parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", sourceSha256,
    "--capture-frame", "2",
    "--prepare-only",
  ]);
  assert.equal(prepared.mode, "dependency-fla");
  assert.equal(prepared.prepareOnly, true);
  assert.equal(prepared.captureFrame, 2);
  assert.equal(prepared.dialogOperator, null);

  const full = parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", sourceSha256,
    "--dialog-operator", "Peter Chen",
  ]);
  assert.equal(full.dialogOperator, "Peter Chen");
  const paired = parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--paired-swf", "source-assets/flash/Test.swf",
    "--paired-swf-sha256", "b".repeat(64),
    "--evidence-id", "test-paired-source",
    "--source-sha256", sourceSha256,
    "--prepare-only",
  ]);
  assert.equal(paired.evidenceSourceKind, "paired-fla-swf");
  assert.equal(paired.pairedSwfSha256, "b".repeat(64));
  assert.throws(() => parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--paired-swf", "source-assets/flash/Test.swf",
    "--evidence-id", "test-paired-source",
    "--source-sha256", sourceSha256,
    "--prepare-only",
  ]), /must be supplied together/);
  assert.throws(() => parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", sourceSha256,
  ]), /name the human/);
  assert.throws(() => parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", sourceSha256,
    "--dialog-operator", "Codex",
  ]), /not Codex or automation/);
  assert.throws(() => parseArguments([
    "pilot-id",
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", sourceSha256,
    "--dialog-operator", "Peter Chen",
  ]), /cannot be combined/);
  assert.throws(() => parseArguments([
    "--dependency-fla", "source-assets/flash/Test.fla",
    "--evidence-id", "..\/escape",
    "--source-sha256", sourceSha256,
    "--prepare-only",
  ]), /path-safe/);
});

test("assisted controller opens one read-only copy, selects the pinned frame, audits, closes without saving, and quits", () => {
  const controller = buildAssistedControllerJsfl({
    flaUri: "file:///work/Test.fla",
    auditScriptUri: "file:///work/audit.jsfl",
    outputRootUri: "file:///work/output",
    markerUri: "file:///work/output/controller-result.json",
    captureFrame: 12,
  });
  assert.match(controller, /fl\.openDocument\(flaUri\)/);
  assert.match(controller, /timeline\.currentFrame = captureFrame - 1/);
  assert.match(controller, /fl\.runScript\(auditScriptUri\)/);
  assert.match(controller, /fl\.closeDocument\(document, false\)/);
  assert.match(controller, /fl\.quit\(false\)/);
  assert.doesNotMatch(controller, /saveDocument|document\.save|publish/);
});

test("dependency generated audit retains the pilot template and adds recursive frame/instance script bodies", async () => {
  const template = await readFile(path.resolve("scripts/animate-audit-current-document.jsfl"), "utf8");
  const generated = buildDependencyGeneratedAuditScript(template, "file:///tmp/dependency-audit");
  assert.doesNotThrow(() => new Function(generated));
  assert.match(generated, /var OUTPUT_ROOT = "file:\/\/\/tmp\/dependency-audit";/);
  assert.match(generated, /attachedActionScript: optionalString/);
  assert.match(generated, /attachedActionScriptLength:/);
  assert.match(generated, /actionScript: optionalString\(safeProperty\(frame, "actionScript"\)\)/);
  assert.match(generated, /var itemName = optionalString\(safeProperty\(item, "name"\)\)/);
  assert.match(generated, /var itemType = optionalString\(safeProperty\(item, "itemType"\)\)/);
  assert.match(generated, /if \(itemType === "font"\)/);
  assert.match(generated, /inspectionLimitation: "metadata-only: Animate 2021 can abort/);
  assert.match(generated, /name: itemName/);
  assert.match(generated, /var itemTimeline = safeProperty\(item, "timeline"\)/);
  assert.doesNotMatch(generated, /optionalString\(item\.linkageClassName\)/);
  assert.match(generated, /librarySharded: true/);
  assert.match(generated, /adobe-animate-library-item-shards/);
  assert.match(generated, /library-item-/);
  assert.match(generated, /animate-audit-progress\.txt/);
  assert.match(generated, /"starting " \+ libraryIndex/);
  assert.equal((generated.match(/attachedActionScript:/g) || []).length, 1);
  assert.equal((generated.match(/actionScript: optionalString\(safeProperty\(frame/g) || []).length, 1);
});

test("dependency library shards are hash-bound and materialized without changing their raw files", async () => {
  const runDir = await mkdtemp(path.join(os.tmpdir(), "animate-sharded-library-"));
  const reportFile = path.join(runDir, "Test.fla-authoring-audit.json");
  const reportBytes = Buffer.from(JSON.stringify({
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    document: {libraryItemCount: 2},
    library: [],
    librarySharded: true,
    libraryShardManifestFile: "library-shard-manifest.json",
  }));
  await writeFile(reportFile, reportBytes);
  await writeFile(path.join(runDir, "library-shard-manifest.json"), JSON.stringify({
    schemaVersion: 1,
    evidenceKind: "adobe-animate-library-item-shards",
    expectedLibraryItemCount: 2,
    items: [
      {index: 0, file: "library-item-000000.json"},
      {index: 1, file: "library-item-000001.json"},
    ],
  }));
  await writeFile(path.join(runDir, "library-item-000000.json"), JSON.stringify({index: 0, name: "first"}));
  await writeFile(path.join(runDir, "library-item-000001.json"), JSON.stringify({index: 1, name: "second"}));

  const result = await materializeDependencyLibraryShards({
    runDir,
    reportFile,
    reportBytes,
    identity: "test-sharded-library",
  });
  assert.equal(result.materialized, true);
  assert.deepEqual(result.report.library.map(({index, name}) => ({index, name})), [
    {index: 0, name: "first"},
    {index: 1, name: "second"},
  ]);
  assert.equal(result.report.libraryMaterialization.shards.length, 2);
  assert.equal(result.report.libraryMaterialization.method, "node-hash-bound-library-item-shards");
  assert.deepEqual(JSON.parse(await readFile(path.join(runDir, "library-item-000000.json"), "utf8")), {index: 0, name: "first"});
  assert.deepEqual(JSON.parse(await readFile(path.join(runDir, "Test.fla-authoring-audit-sharded-head.json"), "utf8")),
    JSON.parse(reportBytes.toString("utf8")));
});

test("assisted artifact validation binds exact staged path, recursive elements, frame, and native PNG", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-assisted-artifacts-"));
  const workingCopy = path.join(root, "Test.fla");
  await writeFile(workingCopy, "fla");
  await writeFile(path.join(root, "controller-result.json"), JSON.stringify({
    status: "passed",
    animateVersion: "MAC 21,0,7,42652",
    documentName: "Test.fla",
    documentPathURI: pathToFileURL(workingCopy).href,
    captureFrame: 12,
    message: "ok",
  }));
  await writeFile(path.join(root, "Test.fla-authoring-audit.json"), JSON.stringify({
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    recursiveLibraryTimelineAudit: true,
    animateVersion: "MAC 21,0,7,42652",
    capturedAt: "today",
    document: {name: "Test.fla", pathURI: pathToFileURL(workingCopy).href, width: 800, height: 600, frameRate: 12, libraryItemCount: 1},
    timeline: {currentFlashFrame: 12, frameCount: 20, layerCount: 1, layers: [{keyframes: [{elements: []}]}]},
    library: [{timeline: {layers: [{keyframes: [{elements: [{elementType: "instance"}]}]}]}}],
  }));
  await writeFile(path.join(root, "Test.fla-frame-12.png"), pngHeader(800, 600));
  const result = await validateAssistedArtifacts({runDir: root, animationId: "test", workingCopy, captureFrame: 12});
  assert.deepEqual({width: result.png.width, height: result.png.height}, {width: 800, height: 600});

  const report = path.join(root, "Test.fla-authoring-audit.json");
  await writeFile(report, JSON.stringify({
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    recursiveLibraryTimelineAudit: true,
    animateVersion: "MAC 21,0,7,42652",
    document: {name: "Test.fla", pathURI: pathToFileURL(workingCopy).href, width: 800, height: 600, frameRate: 12, libraryItemCount: 0},
    timeline: {currentFlashFrame: 12, frameCount: 20, layerCount: 1, layers: [{keyframes: [{}]}]},
    library: [],
  }));
  await assert.rejects(
    validateAssistedArtifacts({runDir: root, animationId: "test", workingCopy, captureFrame: 12}),
    /authoring keyframe is missing elements/,
  );
});

async function dependencyFixture({paired = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-dependency-stage-"));
  const sourceRelative = "source-assets/flash/archive/Test.fla";
  const sourceFile = path.join(root, sourceRelative);
  const sourceBytes = Buffer.from("legacy-fla-only-dependency-bytes");
  const swfRelative = "source-assets/flash/archive/Test.swf";
  const swfFile = path.join(root, swfRelative);
  const swfBytes = Buffer.from("FWS\u0009paired-shipped-swf-bytes");
  await mkdir(path.dirname(sourceFile), {recursive: true});
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await writeFile(sourceFile, sourceBytes);
  if (paired) await writeFile(swfFile, swfBytes);
  await writeFile(
    path.join(root, "scripts", "run-assisted-animate-authoring-audit.mjs"),
    await readFile(path.resolve("scripts/run-assisted-animate-authoring-audit.mjs")),
  );
  await writeFile(
    path.join(root, "scripts", "animate-audit-current-document.jsfl"),
    await readFile(path.resolve("scripts/animate-audit-current-document.jsfl")),
  );
  const argumentsList = [
    "--dependency-fla", sourceRelative,
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", hash(sourceBytes),
    "--capture-frame", "1",
    "--prepare-only",
  ];
  if (paired) argumentsList.splice(2, 0,
    "--paired-swf", swfRelative,
    "--paired-swf-sha256", hash(swfBytes));
  const options = parseArguments(argumentsList);
  return {root, sourceFile, sourceBytes, swfFile, swfBytes, options};
}

test("dependency prepare-only stages and re-verifies an exact 0444 work-only copy without migration writes", async () => {
  const fixture = await dependencyFixture();
  const first = await stageDependencyFla(fixture.options, {root: fixture.root});
  assert.equal(first.entry.source.sha256, hash(fixture.sourceBytes));
  assert.equal(first.entry.workingCopy.sha256, hash(fixture.sourceBytes));
  assert.equal(first.entry.workingCopy.mode, "0444");
  assert.equal((await lstat(first.workingCopy)).mode & 0o222, 0);
  assert.deepEqual(await readFile(first.workingCopy), fixture.sourceBytes);
  assert.equal(first.binding.disposition, "created");
  assert.equal(await readFile(path.join(fixture.root, "migrations"), {encoding: "utf8"}).catch((error) => error.code), "ENOENT");

  const second = await stageDependencyFla(fixture.options, {root: fixture.root});
  assert.equal(second.binding.disposition, "verified-existing");
  assert.equal(second.binding.sha256, first.binding.sha256);

  await chmod(second.binding.file, 0o644);
  const historicalBinding = JSON.parse(await readFile(second.binding.file, "utf8"));
  historicalBinding.generatedBy.sha256 = "1".repeat(64);
  const historicalBytes = Buffer.from(`${JSON.stringify(historicalBinding, null, 2)}\n`);
  await writeFile(second.binding.file, historicalBytes);
  await chmod(second.binding.file, 0o444);
  const historical = await stageDependencyFla(fixture.options, {root: fixture.root});
  assert.equal(historical.binding.disposition, "verified-existing-historical-generator");
  assert.equal(historical.binding.sha256, hash(historicalBytes));
  assert.deepEqual(await readFile(historical.binding.file), historicalBytes);
});

test("paired prepare-only binds and stages both FLA and shipped SWF without claiming runtime corroboration", async () => {
  const fixture = await dependencyFixture({paired: true});
  const staged = await stageDependencyFla(fixture.options, {root: fixture.root});
  assert.equal(staged.entry.source.sha256, hash(fixture.sourceBytes));
  assert.equal(staged.entry.shippedSwf.source.sha256, hash(fixture.swfBytes));
  assert.equal(staged.entry.shippedSwf.workingCopy.sha256, hash(fixture.swfBytes));
  assert.equal(staged.entry.shippedSwf.workingCopy.mode, "0444");
  assert.equal(staged.entry.workingCopy.separateRegularFile, true);
  assert.equal(staged.entry.shippedSwf.workingCopy.separateRegularFile, true);
  assert.equal((await lstat(staged.stagedSwf)).mode & 0o222, 0);
  assert.equal((await lstat(staged.binding.file)).mode & 0o777, 0o444);
  assert.equal(staged.binding.readOnly, true);
  assert.deepEqual(await readFile(staged.stagedSwf), fixture.swfBytes);
  const binding = JSON.parse(await readFile(staged.binding.file, "utf8"));
  assert.equal(binding.evidenceKind, "adobe-animate-read-only-paired-fla-swf-binding");
  assert.equal(binding.sourceKind, "paired-fla-swf");
  assert.equal(binding.acceptanceEffect, "none; work-only authoring evidence preparation");
  const verified = await stageDependencyFla(fixture.options, {root: fixture.root});
  assert.equal(verified.binding.disposition, "verified-existing");
  assert.equal(verified.binding.sha256, staged.binding.sha256);
  assert.equal(await readFile(path.join(fixture.root, "migrations"), {encoding: "utf8"}).catch((error) => error.code), "ENOENT");
});

test("dependency staging rejects wrong hashes, sources outside source-assets, symlinks, and writable staged copies", async () => {
  const wrongHash = await dependencyFixture();
  await assert.rejects(
    stageDependencyFla({...wrongHash.options, sourceSha256: "0".repeat(64)}, {root: wrongHash.root}),
    /source FLA hash mismatch/,
  );

  const outside = await dependencyFixture();
  const outsideFile = path.join(outside.root, "outside.fla");
  await writeFile(outsideFile, outside.sourceBytes);
  await assert.rejects(
    stageDependencyFla({...outside.options, dependencyFla: outsideFile}, {root: outside.root}),
    /must be under source-assets/,
  );

  const linked = await dependencyFixture();
  const realFile = path.join(linked.root, "real.fla");
  await writeFile(realFile, linked.sourceBytes);
  await writeFile(linked.sourceFile, "replacement");
  await import("node:fs/promises").then(({unlink}) => unlink(linked.sourceFile));
  await symlink(realFile, linked.sourceFile);
  await assert.rejects(stageDependencyFla(linked.options, {root: linked.root}), /non-symbolic-link/);

  const writable = await dependencyFixture();
  const staged = await stageDependencyFla(writable.options, {root: writable.root});
  await chmod(staged.workingCopy, 0o644);
  await assert.rejects(stageDependencyFla(writable.options, {root: writable.root}), /working copy is writable/);

  const hardlinked = await dependencyFixture();
  const hardlinkedStaged = await stageDependencyFla(hardlinked.options, {root: hardlinked.root});
  await unlink(hardlinkedStaged.workingCopy);
  await link(hardlinked.sourceFile, hardlinkedStaged.workingCopy);
  await chmod(hardlinkedStaged.workingCopy, 0o444);
  await assert.rejects(
    stageDependencyFla(hardlinked.options, {root: hardlinked.root}),
    /exactly one hard link|aliases the source FLA inode/,
  );
});

test("G5 L4 managed execution remains blocked before process probes when the dialog operator is Dr. Peter Hu", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g5-l4-fail-closed-"));
  const options = parseArguments([
    "--dependency-fla", "source-assets/flash/ELMGR5/L4/IR/IR01.fla",
    "--evidence-id", "course-g05-l04-ir-001-a662633d",
    "--source-sha256", "a".repeat(64),
    "--dialog-operator", "Dr. Peter Hu",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  let processProbes = 0;
  let processLaunches = 0;
  await assert.rejects(
    runDependencyAssistedAudit(options, {
      root,
      findRunning: async () => {
        processProbes += 1;
        return [];
      },
      runProcess: async () => {
        processLaunches += 1;
        throw new Error("Animate must not launch");
      },
    }),
    {message: "必须先实现并验证 hash-bound per-session authorization"},
  );
  assert.equal(processProbes, 0);
  assert.equal(processLaunches, 0);
  assert.equal(
    await lstat(path.join(root, "work", "animate", "dependency-authoring-audits"))
      .then(() => "present", (error) => error.code),
    "ENOENT",
  );
});

test("G4 L10 full dependency execution is reserved for the dedicated authorized runner before probes or writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g4-l10-generic-block-"));
  const options = parseArguments([
    "--dependency-fla", "source-assets/flash/ELMGR4/L10/IR/IR01.fla",
    "--evidence-id", "course-g04-l10-ir-001",
    "--source-sha256", "a".repeat(64),
    "--dialog-operator", "Peter Chen",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  let processProbes = 0;
  let processLaunches = 0;
  await assert.rejects(
    runDependencyAssistedAudit(options, {
      root,
      findRunning: async () => {
        processProbes += 1;
        return [];
      },
      runProcess: async () => {
        processLaunches += 1;
        throw new Error("Animate must not launch");
      },
    }),
    {message: "G4 L10 full Animate execution requires the dedicated owner-authorized one-row runner"},
  );
  assert.equal(processProbes, 0);
  assert.equal(processLaunches, 0);
  assert.equal(
    await lstat(path.join(root, "work", "animate", "dependency-authoring-audits"))
      .then(() => "present", (error) => error.code),
    "ENOENT",
  );
});

test("G4 L10 generic guard rejects source-path and exact-hash aliases before probes or writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g4-l10-alias-block-"));
  const canonicalRoot = path.join(root,
    "source-assets", "flash", "HELP MATH_ORIGINAL FILES", "HELP_COURSES", "ELMGR4", "L10");
  const absoluteFla = path.join(canonicalRoot, "VB", "L10VB03.fla");
  const canonicalSwf = path.join(canonicalRoot, "VB", "L10VB03.swf");
  const normalizedFla = path.join(root, "source-assets", "flash", "alias", "..",
    "HELP MATH_ORIGINAL FILES", "HELP_COURSES", "ELMGR4", "L10", "VB", "L10VB03.fla");
  const cases = [
    {dependencyFla: absoluteFla, sourceSha256: "a".repeat(64)},
    {dependencyFla: normalizedFla, sourceSha256: "a".repeat(64)},
    {dependencyFla: "source-assets/flash/elsewhere/Alias.fla", sourceSha256:
      "6c4261ad96af697f605d979f326db72617a139fbfa4b60474c6a211e7615059b"},
    {dependencyFla: "source-assets/flash/elsewhere/Alias.fla", sourceSha256: "a".repeat(64),
      pairedSwf: canonicalSwf, pairedSwfSha256: "b".repeat(64)},
    {dependencyFla: "source-assets/flash/elsewhere/Alias.fla", sourceSha256: "a".repeat(64),
      pairedSwf: "source-assets/flash/elsewhere/Alias.swf",
      pairedSwfSha256: "06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03"},
  ];
  for (const [index, item] of cases.entries()) {
    const options = {
      mode: "dependency-fla",
      evidenceSourceKind: item.pairedSwf ? "paired-fla-swf" : "fla-only",
      dependencyFla: item.dependencyFla,
      pairedSwf: item.pairedSwf || null,
      pairedSwfSha256: item.pairedSwfSha256 || null,
      evidenceId: `unrelated-safe-id-${index}`,
      sourceSha256: item.sourceSha256,
      captureFrame: 1,
      dialogOperator: "Peter Chen",
      prepareOnly: false,
      animateBinary: path.join(root, "animate-must-not-be-accessed"),
      timeoutMs: 30_000,
    };
    let processProbes = 0;
    let processLaunches = 0;
    await assert.rejects(runDependencyAssistedAudit(options, {
      root,
      findRunning: async () => {
        processProbes += 1;
        return [];
      },
      runProcess: async () => {
        processLaunches += 1;
        throw new Error("Animate must not launch");
      },
    }), {message: "G4 L10 full Animate execution requires the dedicated owner-authorized one-row runner"});
    assert.equal(processProbes, 0);
    assert.equal(processLaunches, 0);
  }
  assert.equal(
    await lstat(path.join(root, "work", "animate", "dependency-authoring-audits"))
      .then(() => "present", (error) => error.code),
    "ENOENT",
  );
});

test("G4 L10 generic pilot execution is rejected before binary access", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g4-l10-pilot-block-"));
  const options = parseArguments([
    "course-g04-l10-ir-001",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  await assert.rejects(
    runAssistedAudit(options, {root, performStageCheck: false}),
    {message: "G4 L10 full Animate execution requires the dedicated owner-authorized one-row runner"},
  );
});

test("Animate lifecycle probe ignores poisoned PATH and executes fixed /bin/ps with a fixed environment", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-ps-path-poison-"));
  const marker = path.join(root, "poisoned-ps-ran");
  const fakePs = path.join(root, "ps");
  await writeFile(fakePs, `#!/bin/sh\ntouch ${JSON.stringify(marker)}\nexit 91\n`);
  await chmod(fakePs, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${root}:/usr/bin:/bin`;
  try {
    const active = await runningAnimate(path.join(root, "not-a-real-animate-binary"));
    assert.deepEqual(active, []);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  }
  assert.equal(await lstat(marker).then(() => "present", (error) => error.code), "ENOENT");
});

test("G5 L4 managed pilot animation execution is rejected before binary access", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g5-l4-pilot-fail-closed-"));
  const options = parseArguments([
    "course-g05-l04-rw-002",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  await assert.rejects(
    runAssistedAudit(options, {root, performStageCheck: false}),
    {message: "必须先实现并验证 hash-bound per-session authorization"},
  );
});

test("G5 L4 managed execution rejects a forged serializable authorization token before process probes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g5-l4-forged-token-"));
  const options = parseArguments([
    "--dependency-fla", "source-assets/flash/ELMGR5/L4/IR/IR01.fla",
    "--evidence-id", "course-g05-l04-ir-001-a662633d",
    "--source-sha256", "a".repeat(64),
    "--dialog-operator", "Dr. Peter Hu",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  let probes = 0;
  await assert.rejects(runDependencyAssistedAudit(options, {
    root,
    authorizationToken: {
      consumed: true,
      purpose: "animate-authoring",
      actionId: "animate.read-only-authoring-audit",
      member: {animationId: "course-g05-l04-ir-001-a662633d"},
      language: null,
    },
    findRunning: async () => {
      probes += 1;
      return [];
    },
  }), /opaque token/u);
  assert.equal(probes, 0);
});

test("dependency wrapper delegates before the one-time protected execution claim", () => {
  assert.match(
    runAssistedAudit.toString(),
    /if \(options\.mode === "dependency-fla"\) \{\s*return runDependencyAssistedAudit\(options, \{root, authorizationToken\}\);\s*\}\s*const protectedAuthorization = await authorizeProtectedG5ReleaseExecution/u,
  );
});

test("G5 L5 managed execution remains blocked before process probes when the dialog operator is Dr. Peter Hu", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g5-l5-fail-closed-"));
  const options = parseArguments([
    "--dependency-fla", "source-assets/flash/ELMGR5/L5/IR/IR01.fla",
    "--evidence-id", "course-g05-l05-ir-001-664ab764",
    "--source-sha256", "a".repeat(64),
    "--dialog-operator", "Dr. Peter Hu",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  let processProbes = 0;
  let processLaunches = 0;
  await assert.rejects(
    runDependencyAssistedAudit(options, {
      root,
      findRunning: async () => {
        processProbes += 1;
        return [];
      },
      runProcess: async () => {
        processLaunches += 1;
        throw new Error("Animate must not launch");
      },
    }),
    {message: "必须先实现并验证 hash-bound per-session authorization"},
  );
  assert.equal(processProbes, 0);
  assert.equal(processLaunches, 0);
  assert.equal(
    await lstat(path.join(root, "work", "animate", "dependency-authoring-audits"))
      .then(() => "present", (error) => error.code),
    "ENOENT",
  );
});

test("G5 L5 managed pilot animation execution is rejected before binary access", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-g5-l5-pilot-fail-closed-"));
  const options = parseArguments([
    "course-g05-l05-rw-002",
    "--animate-binary", path.join(root, "animate-must-not-be-accessed"),
  ]);
  await assert.rejects(
    runAssistedAudit(options, {root, performStageCheck: false}),
    {message: "必须先实现并验证 hash-bound per-session authorization"},
  );
});

test("paired full runner cold-starts one mocked Animate process and writes only work evidence", async () => {
  const fixture = await dependencyFixture({paired: true});
  const animateBinary = path.join(fixture.root, "bin", "animate");
  await mkdir(path.dirname(animateBinary), {recursive: true});
  await writeFile(animateBinary, "mock Animate executable");
  await chmod(animateBinary, 0o755);
  const options = parseArguments([
    "--dependency-fla", path.relative(fixture.root, fixture.sourceFile),
    "--paired-swf", path.relative(fixture.root, fixture.swfFile),
    "--paired-swf-sha256", hash(fixture.swfBytes),
    "--evidence-id", "test-fla-only-dependency",
    "--source-sha256", hash(fixture.sourceBytes),
    "--capture-frame", "1",
    "--dialog-operator", "Peter Chen",
    "--animate-binary", animateBinary,
    "--timeout-ms", "30000",
  ]);
  let runningChecks = 0;
  let processRuns = 0;
  const expectedWorkingCopy = path.join(
    fixture.root,
    "work", "animate", "dependency-authoring-audits", "test-fla-only-dependency", "working-copy", "Test.fla",
  );
  const result = await runDependencyAssistedAudit(options, {
    root: fixture.root,
    findRunning: async () => {
      runningChecks += 1;
      return [];
    },
    runProcess: async (binary, args, timeoutMs) => {
      processRuns += 1;
      assert.equal(binary, animateBinary);
      assert.deepEqual(args.slice(0, 2), ["--run-jsfl", "-o"]);
      assert.equal(timeoutMs, 30000);
      const runDir = path.dirname(args[2]);
      await writeFile(path.join(runDir, "controller-result.json"), JSON.stringify({
        status: "passed",
        animateVersion: "MAC 21,0,7,42652",
        documentName: "Test.fla",
        documentPathURI: pathToFileURL(expectedWorkingCopy).href,
        captureFrame: 1,
        message: "ok",
      }));
      await writeFile(path.join(runDir, "Test.fla-authoring-audit.json"), JSON.stringify({
        schemaVersion: 1,
        evidenceKind: "adobe-animate-authoring-audit",
        recursiveLibraryTimelineAudit: true,
        animateVersion: "MAC 21,0,7,42652",
        capturedAt: "mock capture",
        document: {
          name: "Test.fla",
          pathURI: pathToFileURL(expectedWorkingCopy).href,
          width: 800,
          height: 600,
          frameRate: 12,
          backgroundColor: "#ffffff",
          libraryItemCount: 1,
        },
        timeline: {
          currentFlashFrame: 1,
          frameCount: 2,
          layerCount: 1,
          layers: [{keyframes: [{
            actionScript: "stop();",
            actionScriptLength: 7,
            elements: [{attachedActionScript: null, attachedActionScriptLength: 0}],
          }]}],
        },
        library: [{timeline: {layers: [{keyframes: [{
          actionScript: null,
          actionScriptLength: 0,
          elements: [{attachedActionScript: "on(release){}", attachedActionScriptLength: 13}],
        }]}]}}],
      }));
      await writeFile(path.join(runDir, "Test.fla-frame-1.png"), pngHeader(800, 600));
      return {
        exitCode: 0,
        signal: null,
        timedOut: false,
        durationMs: 10,
        stdout: Buffer.from("mock stdout"),
        stderr: Buffer.alloc(0),
      };
    },
  });
  assert.equal(runningChecks, 1);
  assert.equal(processRuns, 1);
  assert.equal(result.status, "passed");
  assert.equal(result.humanActionBoundary.designatedOperator, "Peter Chen");
  assert.equal(result.command.spawnedAnimateProcessCount, 1);
  assert.equal(result.migrationOrApprovalWrites, false);
  const workEvidence = JSON.parse(await readFile(path.join(fixture.root, result.workEvidence.file), "utf8"));
  assert.equal(workEvidence.humanDialogBoundary.operatorNameIsNotReviewOrApproval, true);
  assert.equal(workEvidence.writeBoundary.workOnly, true);
  assert.equal(workEvidence.sourceBinding.source.sha256, hash(fixture.sourceBytes));
  assert.equal(workEvidence.evidenceKind, "adobe-animate-paired-fla-swf-authoring-audit");
  assert.equal(workEvidence.shippedSwfBinding.source.sha256, hash(fixture.swfBytes));
  assert.equal(workEvidence.shippedSwfBinding.executedByThisAuthoringAudit, false);
  assert.match(workEvidence.limitations.join(" "), /neither executes it nor proves FLA\/SWF/);
  assert.equal(await readFile(path.join(fixture.root, "migrations"), {encoding: "utf8"}).catch((error) => error.code), "ENOENT");
  assert.deepEqual(await readFile(fixture.sourceFile), fixture.sourceBytes);
  assert.equal((await lstat(expectedWorkingCopy)).mode & 0o222, 0);
});
