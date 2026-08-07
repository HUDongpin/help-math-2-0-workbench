import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {
  assertG4L10AnimateAuthoringV2ControlReadinessSuccessor,
  buildG4L10AnimateAuthoringV2ControlReadinessSuccessor,
  parseArguments,
  writeOrCheckSuccessorReport,
} from "./build-g4-l10-animate-authoring-v2-control-readiness-successor.mjs";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT,
  "scripts/build-g4-l10-animate-authoring-v2-control-readiness-successor.mjs");
const JSON_REPORT = path.join(ROOT,
  "reports/g4-l10-animate-authoring-v2-control-readiness-successor.json");
const MARKDOWN_REPORT = path.join(ROOT,
  "reports/g4-l10-animate-authoring-v2-control-readiness-successor.md");

function identity(info) {
  return {
    dev: info.dev.toString(),
    ino: info.ino.toString(),
    size: info.size.toString(),
    mode: info.mode.toString(),
    mtimeNs: info.mtimeNs.toString(),
    ctimeNs: info.ctimeNs.toString(),
  };
}

test("CLI exposes only deterministic normal, help, or write-free check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.deepEqual(parseArguments(["-h"]), {check: false, help: true});
  for (const argv of [
    ["--check", "--check"],
    ["--help", "--check"],
    ["--root", ROOT],
    ["--now", "2026-08-04T00:00:00.000Z"],
    ["--enable"],
  ]) assert.throws(() => parseArguments(argv),
    /only once|cannot be combined|unknown option/u);
});

test("actual successor rebuild binds exact v2 and records only blocker three as project-local satisfied", async () => {
  const result = await buildG4L10AnimateAuthoringV2ControlReadinessSuccessor({
    root: ROOT,
    persist: false,
  });
  const {report} = result;
  assert.equal(report.predecessor.json.sha256,
    "388949eea069fb112c5d05bcdc9697c4dc2a806c5c048b1182850dbe69ee4959");
  assert.equal(report.predecessor.markdown.sha256,
    "af7ad6655cf362543e8bf01ab57fdfcfc2edb7b6675c337f61a4420eb71dffc4");
  assert.equal(report.predecessor.rewritten, false);
  assert.deepEqual(report.blockers
    .filter((item) => item.projectLocalSatisfied)
    .map((item) => item.blockerId), ["kill-unconfirmed-supervisor-lifecycle"]);
  assert.deepEqual(report.blockerCounts, {
    projectLocalSatisfied: 1,
    projectLocalUnsatisfied: 5,
    satisfied: 0,
    productionSatisfied: 0,
    formalSatisfied: 0,
    productionOrFormalOpen: 6,
  });
  assert.equal(report.blockers.every((item) => item.satisfied === false
    && item.productionSatisfied === false
    && item.formalSatisfied === false), true);
  assert.deepEqual(report.focusedTestObservation.result, {
    tests: 33,
    suites: 0,
    pass: 33,
    fail: 0,
    cancelled: 0,
    skipped: 0,
    todo: 0,
  });
  assert.equal(report.nativeCapability.enabled, false);
  assert.equal(report.admission.admitted, false);
  assert.equal(report.admission.executionAuthorized, false);
  assert.equal(Object.values(report.acceptanceEffects)
    .every((value) => value === false), true);
  assertG4L10AnimateAuthoringV2ControlReadinessSuccessor(report);
});

test("successor contract rejects any production, formal, capability, receipt, or acceptance promotion", async () => {
  const baseline = (await buildG4L10AnimateAuthoringV2ControlReadinessSuccessor({
    root: ROOT,
    persist: false,
  })).report;
  for (const mutate of [
    (value) => { value.blockers[2].satisfied = true; },
    (value) => { value.blockers[2].productionSatisfied = true; },
    (value) => { value.blockers[2].formalSatisfied = true; },
    (value) => { value.blockers[0].projectLocalSatisfied = true; },
    (value) => { value.blockerCounts.projectLocalSatisfied = 2; },
    (value) => { value.nativeCapability.enabled = true; },
    (value) => { value.admission.admitted = true; },
    (value) => { value.admission.executionAuthorized = true; },
    (value) => { value.receiptInventory.runReceipts = 1; },
    (value) => { value.resultIndexAdmission.enabled = true; },
    (value) => { value.acceptanceEffects.originalRuntimeEvidence = true; },
    (value) => { value.predecessor.rewritten = true; },
    (value) => { value.predecessor.json.sha256 = "0".repeat(64); },
    (value) => { value.strictAcceptanceEffect = "advanced"; },
  ]) {
    const candidate = structuredClone(baseline);
    mutate(candidate);
    assert.throws(
      () => assertG4L10AnimateAuthoringV2ControlReadinessSuccessor(candidate),
      /blocker|capability|admission|receipt|result-index|acceptance|predecessor|strict|dual-layer/u,
    );
  }
});

test("generic exact-byte check path is write-free and rejects stale or absent output", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "g4-l10-v2-successor-check-"));
  try {
    const reports = path.join(temporary, "reports");
    const target = path.join(reports, "fixture.json");
    const expected = Buffer.from("{\"ok\":true}\n");
    await mkdir(reports);
    await writeFile(target, expected);
    const before = await stat(target, {bigint: true});
    assert.equal(await writeOrCheckSuccessorReport(temporary,
      "reports/fixture.json", expected, true), "checked");
    const after = await stat(target, {bigint: true});
    assert.deepEqual(identity(after), identity(before));
    await writeFile(target, "stale\n");
    await assert.rejects(writeOrCheckSuccessorReport(temporary,
      "reports/fixture.json", expected, true), /stale/u);
    await unlink(target);
    await assert.rejects(writeOrCheckSuccessorReport(temporary,
      "reports/fixture.json", expected, true), /ENOENT|no such file/iu);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("stored JSON and Markdown are exact builder bytes and CLI check changes neither inode nor metadata", async () => {
  const built = await buildG4L10AnimateAuthoringV2ControlReadinessSuccessor({
    root: ROOT,
    persist: false,
  });
  assert.equal((await readFile(JSON_REPORT)).equals(built.jsonBytes), true);
  assert.equal((await readFile(MARKDOWN_REPORT)).equals(built.markdownBytes), true);
  const before = await Promise.all([
    stat(JSON_REPORT, {bigint: true}),
    stat(MARKDOWN_REPORT, {bigint: true}),
  ]);
  const {stdout, stderr} = await execFileAsync(process.execPath, [SCRIPT, "--check"], {
    cwd: ROOT,
    env: {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"},
  });
  assert.match(stdout, /"status": "checked"/u);
  assert.equal(stderr, "");
  const after = await Promise.all([
    stat(JSON_REPORT, {bigint: true}),
    stat(MARKDOWN_REPORT, {bigint: true}),
  ]);
  assert.deepEqual(after.map(identity), before.map(identity));
});

test("successor builder contains no process, Git, Animate, browser, server, or Library write primitive", async () => {
  const source = await readFile(SCRIPT, "utf8");
  assert.doesNotMatch(source,
    /from "node:child_process"|\bspawn\s*\(|\bexecFile\s*\(|\bgit\s+(?:status|diff|add|commit)|--run-jsfl|\/usr\/bin\/open|writeFile\([^\n]*\/Library/u);
  assert.match(source, /LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED === false/u);
  assert.match(source, /projectLocalSatisfied: true/u);
  assert.match(source, /productionSatisfied: false/u);
  assert.match(source, /formalSatisfied: false/u);
});
