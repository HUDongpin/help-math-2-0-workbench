import assert from "node:assert/strict";
import childProcess from "node:child_process";
import {EventEmitter} from "node:events";
import {chmod, mkdtemp, mkdir, readFile, realpath, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  buildLessonAnimateExecutionCodeClosureManifest,
} from "./lesson-animate-execution-code-closure.mjs";
import {
  buildAssistedControllerJsfl,
  buildDependencyGeneratedAuditScript,
  runChild,
  validateAssistedArtifacts,
} from "./lesson-animate-authoring-audit-core.mjs";

const ROOT = await realpath(fileURLToPath(new URL("../../", import.meta.url)));
const ENTRYPOINT = "scripts/run-lesson-g4-l10-authorized-one-row-audit.mjs";
const ANIMATE =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";

function neverClosingChildFixture(t) {
  const child = new EventEmitter();
  child.pid = 424_242;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.signals = [];
  child.unrefCalls = 0;
  const activeHandle = setInterval(() => {}, 60_000);
  t.after(() => clearInterval(activeHandle));
  child.kill = (signal) => {
    child.signals.push(signal);
    return false;
  };
  child.unref = () => {
    child.unrefCalls += 1;
    activeHandle.unref();
  };
  return {child, activeHandle};
}

test("actual dedicated entrypoint builds one minimal diagnostic closure graph without generic, G5, finalize, staging, or zlib", async (t) => {
  const parent = path.join(ROOT, "work", "animate");
  await mkdir(parent, {recursive: true});
  const temporary = await mkdtemp(path.join(parent, "l10-minimal-closure-test-"));
  t.after(async () => rm(temporary, {recursive: true, force: true}));
  const helper = path.join(temporary, "diagnostic-replay-helper");
  await writeFile(helper, "#!/bin/sh\nexit 99\n");
  await chmod(helper, 0o755);
  const helperRelative = path.relative(ROOT, helper).split(path.sep).join("/");
  const manifest = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot: ROOT,
    entrypoint: ENTRYPOINT,
    toolchain: {
      aclProbe: "/bin/ls",
      nodeExecutable: process.execPath,
      processProbe: "/bin/ps",
      jsfl: "scripts/animate-audit-current-document.jsfl",
      animateExecutable: ANIMATE,
      replayLockHelper: helperRelative,
    },
  });
  assert.equal(manifest.entrypoint, ENTRYPOINT);
  assert.equal(manifest.replayLockHelperAuthority, "diagnostic-project-fixture");
  assert.deepEqual(manifest.modules.map(({file}) => file), [
    "scripts/lib/lesson-animate-authoring-audit-core.mjs",
    "scripts/lib/lesson-animate-execution-code-closure.mjs",
    "scripts/lib/lesson-animate-one-row-authorization-v2.mjs",
    "scripts/lib/lesson-animate-prebuilt-atomic-replay-lock.mjs",
    "scripts/lib/lesson-animate-production-trust.mjs",
    "scripts/probe-animate-jsfl-cli.mjs",
    ENTRYPOINT,
  ]);
  const graph = JSON.stringify(manifest.modules);
  for (const forbidden of ["run-assisted-animate-authoring-audit", "g5-", "finalize-",
    "stage-animate", "materialize-g5", "node:zlib"]) assert.doesNotMatch(graph,
    new RegExp(forbidden, "u"));
});

test("shared pure controller and enhanced audit preserve close-without-save and script-body/shard contracts", async () => {
  const controller = buildAssistedControllerJsfl({
    flaUri: "file:///fixed/Test.fla",
    auditScriptUri: "file:///fixed/audit.jsfl",
    outputRootUri: "file:///fixed/output",
    markerUri: "file:///fixed/output/controller-result.json",
    captureFrame: 1,
  });
  assert.match(controller, /fl\.openDocument\(flaUri\)/u);
  assert.match(controller, /fl\.closeDocument\(document, false\)/u);
  assert.match(controller, /fl\.quit\(false\)/u);
  assert.doesNotMatch(controller, /saveDocument|\.save\(|publish/u);
  const template = await readFile(path.join(ROOT,
    "scripts", "animate-audit-current-document.jsfl"), "utf8");
  const generated = buildDependencyGeneratedAuditScript(template,
    "file:///fixed/output");
  assert.match(generated, /attachedActionScript:/u);
  assert.match(generated, /actionScript: optionalString/u);
  assert.match(generated, /library-shard-manifest\.json/u);
});

test("bounded child primitive uses only an internally supplied fixed cwd/env and returns captured evidence", async () => {
  const result = await runChild("/bin/pwd", [], 30_000,
    {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"},
    {cwd: ROOT, maxOutputBytes: 4096});
  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
  assert.equal(result.outputLimitExceeded, false);
  assert.equal(result.killUnconfirmed, false);
  assert.equal(result.stdout.toString("utf8").trim(), ROOT);
});

test("kill-unconfirmed child destroys streams, unrefs its active handle, and settles once", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout"]});
  const fixture = neverClosingChildFixture(t);
  t.mock.method(childProcess, "spawn", () => fixture.child);

  const pending = runChild("/diagnostic/never-close", [], 1,
    {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"});
  t.mock.timers.tick(1);
  assert.deepEqual(fixture.child.signals, ["SIGTERM"]);
  t.mock.timers.tick(5_000);
  assert.deepEqual(fixture.child.signals, ["SIGTERM", "SIGKILL"]);
  t.mock.timers.tick(5_000);

  const result = await pending;
  assert.equal(result.timedOut, true);
  assert.equal(result.killUnconfirmed, true);
  assert.equal(result.exitCode, null);
  assert.equal(result.signal, "SIGKILL");
  assert.equal(fixture.child.stdin.destroyed, true);
  assert.equal(fixture.child.stdout.destroyed, true);
  assert.equal(fixture.child.stderr.destroyed, true);
  assert.equal(fixture.child.unrefCalls, 1);
  assert.equal(fixture.activeHandle.hasRef(), false);

  t.mock.timers.runAll();
  assert.deepEqual(fixture.child.signals, ["SIGTERM", "SIGKILL"]);
  assert.equal(fixture.child.unrefCalls, 1);
});

test("artifact validation fails closed on incomplete root and library timeline inventories", async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "l10-artifact-schema-test-"));
  t.after(async () => rm(temporary, {recursive: true, force: true}));
  const workingCopy = path.join(temporary, "Schema.fla");
  const marker = {
    status: "passed",
    captureFrame: 1,
    documentPathURI: pathToFileURL(workingCopy).href,
    animateVersion: "diagnostic-test-version",
  };
  const baseline = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    recursiveLibraryTimelineAudit: true,
    animateVersion: marker.animateVersion,
    document: {
      name: path.basename(workingCopy),
      pathURI: marker.documentPathURI,
      width: 800,
      height: 600,
      frameRate: 24,
      libraryItemCount: 1,
    },
    timeline: {currentFlashFrame: 1, frameCount: 2, layerCount: 1, layers: []},
    library: [{name: "symbol", timeline: {layers: []}}],
  };
  const cases = [
    {
      name: "missing-root-layers",
      mutate(report) { delete report.timeline.layers; },
      message: /root authoring timeline is missing its layers inventory/u,
    },
    {
      name: "root-layer-count-mismatch",
      mutate() {},
      message: /root authoring timeline layer count\/inventory mismatch/u,
    },
    {
      name: "library-count-mismatch",
      mutate(report) { report.timeline.layerCount = 0; report.document.libraryItemCount = 2; },
      message: /authoring library count\/inventory mismatch/u,
    },
    {
      name: "missing-library-timeline-layers",
      mutate(report) { report.timeline.layerCount = 0; delete report.library[0].timeline.layers; },
      message: /authoring library timeline 0 is missing its layers inventory/u,
    },
  ];
  for (const item of cases) {
    const runDir = path.join(temporary, item.name);
    await mkdir(runDir);
    const report = structuredClone(baseline);
    item.mutate(report);
    await writeFile(path.join(runDir, "controller-result.json"), JSON.stringify(marker));
    await writeFile(path.join(runDir, "Schema.fla-authoring-audit.json"), JSON.stringify(report));
    await assert.rejects(validateAssistedArtifacts({
      runDir,
      evidenceId: item.name,
      workingCopy,
      captureFrame: 1,
      requireScriptBodies: true,
    }), item.message);
  }
});
