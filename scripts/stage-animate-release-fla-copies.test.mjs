import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  parseArguments,
  stageAnimateReleaseFlaCopies,
} from "./stage-animate-release-fla-copies.mjs";

const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function put(root, relative, bytes, mode) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  if (mode != null) await chmod(file, mode);
  return file;
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-release-stage-"));
  const flaA = Buffer.concat([Buffer.from("d0cf11e0a1b11ae1", "hex"), Buffer.from("fla-a")]);
  const flaB = Buffer.concat([Buffer.from("d0cf11e0a1b11ae1", "hex"), Buffer.from("fla-b")]);
  const swfA = Buffer.from("CWS-a");
  const swfB = Buffer.from("FWS-b");
  const swfOnly = Buffer.from("ZWS-only");
  const sources = [
    {path: "HELP_COURSES/ELMGR5/L4/VB/A.fla", bytes: flaA},
    {path: "HELP_COURSES/ELMGR5/L4/VB/A.swf", bytes: swfA},
    {path: "HELP_COURSES/ELMGR5/L4/IN/B.fla", bytes: flaB},
    {path: "HELP_COURSES/ELMGR5/L4/IN/B.swf", bytes: swfB},
    {path: "HELP_COURSES/ELMGR5/L4/RW/C.swf", bytes: swfOnly},
  ];
  for (const source of sources) await put(root, `${SOURCE_PREFIX}/${source.path}`, source.bytes);
  await put(root, "catalog/source-manifest.sha256", Buffer.from(
    `${sources.map((source) => `${hash(source.bytes)}  ${source.path}`).join("\n")}\n`,
  ));
  await put(root, "scripts/stage-animate-release-fla-copies.mjs", Buffer.from("fixture release generator"));

  const animations = [
    {
      animationId: "course-g05-l04-vb-002",
      assetId: `swf-${hash(swfA)}`,
      source: {path: sources[1].path, sha256: hash(swfA), bytes: swfA.length},
      pairedFla: {path: sources[0].path, sha256: hash(flaA), bytes: flaA.length},
      classification: {collection: "course", grade: 5, lesson: 4},
      flags: {shell: false},
    },
    {
      animationId: "course-g05-l04-in-002",
      assetId: `swf-${hash(swfB)}`,
      source: {path: sources[3].path, sha256: hash(swfB), bytes: swfB.length},
      pairedFla: {path: sources[2].path, sha256: hash(flaB), bytes: flaB.length},
      classification: {collection: "course", grade: 5, lesson: 4},
      flags: {shell: false},
    },
    {
      animationId: "shell-course-g05-l04-index-local",
      assetId: `swf-${hash(swfOnly)}`,
      source: {path: sources[4].path, sha256: hash(swfOnly), bytes: swfOnly.length},
      pairedFla: null,
      classification: {collection: "course", grade: 5, lesson: 4},
      flags: {shell: true},
    },
  ];
  await put(root, "catalog/animations.json", Buffer.from(stable({schemaVersion: 1, animations})));

  const members = animations.map((animation, index) => ({
    ordinal: index + 1,
    animationId: animation.animationId,
    assetId: animation.assetId,
    releaseRole: index === 2 ? "course-shell" : "active-xml-referenced-page",
    batchId: index === 1 ? "shard-b" : "shard-a",
    shardId: index === 1 ? "shard-b" : "shard-a",
    source: {path: animation.source.path, sha256: animation.source.sha256},
  }));
  const release = {
    releaseId: "lesson-fixture",
    publicationMode: "atomic",
    grade: 5,
    lesson: 4,
    titleDisplay: "Number Lines",
    expectedCounts: {activeXmlReferencedPages: 2, courseShells: 1, members: 3, shards: 2},
    shards: [
      {shardId: "shard-a", batchId: "shard-a", ordinal: 1, memberCount: 2},
      {shardId: "shard-b", batchId: "shard-b", ordinal: 2, memberCount: 1},
    ],
    members,
  };
  await put(root, "catalog/lesson-releases.json", Buffer.from(stable({schemaVersion: 1, releases: [release]})));

  for (const animation of animations) {
    const paired = animation.pairedFla;
    const source = {
      placementPath: `${SOURCE_PREFIX}/${animation.source.path}`,
      fla: paired ? `${SOURCE_PREFIX}/${paired.path}` : "",
      swf: `${SOURCE_PREFIX}/${animation.source.path}`,
      flaSha256: paired?.sha256 ?? "",
      swfSha256: animation.source.sha256,
      pairedFlaStatus: paired ? "present" : "missing",
    };
    await put(root, `migrations/${animation.animationId}/migration.json`, Buffer.from(stable({
      schemaVersion: 2,
      id: animation.animationId,
      animationId: animation.animationId,
      assetId: animation.assetId,
      source,
    })));
  }
  return {
    root,
    release,
    animations,
    flaA,
    outputRoot: path.join(root, "work", "animate", "release-read-only-fla-copies", "lesson-fixture", "all"),
  };
}

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

test("CLI exposes release/shard/check controls and no GUI or acceptance controls", () => {
  const parsed = parseArguments([
    "--release-id", "lesson-fixture",
    "--shard-id", "shard-a",
    "--check",
  ]);
  assert.equal(parsed.releaseId, "lesson-fixture");
  assert.equal(parsed.shardId, "shard-a");
  assert.equal(parsed.check, true);
  for (const option of ["--launch", "--dialog-operator", "--finalize", "--approve", "--publish"]) {
    assert.throws(() => parseArguments(["--release-id", "lesson-fixture", option]), /Unknown option/);
  }
  assert.throws(() => parseArguments(["--shard-id", "shard-a"]), /--release-id is required/);
});

test("stages exact paired FLAs, records SWF-only disposition, and checks deterministic bindings", async () => {
  const context = await fixture();
  const result = await stageAnimateReleaseFlaCopies({root: context.root, releaseId: "lesson-fixture"});
  assert.deepEqual(result.manifest.summary, {
    selectedMembers: 3,
    flaBackedItems: 2,
    swfOnlyItems: 1,
    copiesReady: 2,
    allCopiesReadOnly: true,
    allCopiesByteIdentical: true,
    allSourcesFreezeBound: true,
    allWorkspacesHashBound: true,
    animateGuiExecutions: 0,
    dialogInteractions: 0,
    authoringAuditsCompleted: 0,
    migrationOrAcceptanceWrites: 0,
    strictAcceptanceEffect: false,
  });
  assert.equal(result.operatorQueue.queue.length, 2);
  assert.equal(result.operatorQueue.noFlaDispositions.length, 1);
  assert.deepEqual(result.operatorQueue.safety.executableCommands, []);
  assert.equal(result.operatorQueue.safety.operatorIdentityCollected, false);
  assert.equal(result.operatorQueue.stagingManifest.sha256, result.manifestSha256);
  assert.match(result.manifestFile, new RegExp(`${result.manifestSha256}\\.json$`, "u"));
  assert.match(result.queueFile, new RegExp(`${result.queueSha256}\\.json$`, "u"));
  for (const entry of result.manifest.entries) {
    assert.equal((await stat(path.join(context.root, entry.workingCopy.file))).mode & 0o777, 0o444);
    assert.deepEqual(await readFile(path.join(context.root, entry.workingCopy.file)), await readFile(path.join(context.root, entry.sourceFla.file)));
    assert.equal(entry.animateAuthoringAudit.status, "not-run");
  }
  await stageAnimateReleaseFlaCopies({root: context.root, releaseId: "lesson-fixture", check: true});
});

test("optional shard selection retains release ordinals without cross-shard copies", async () => {
  const context = await fixture();
  const result = await stageAnimateReleaseFlaCopies({
    root: context.root,
    releaseId: "lesson-fixture",
    shardId: "shard-a",
  });
  assert.equal(result.manifest.summary.selectedMembers, 2);
  assert.equal(result.manifest.summary.flaBackedItems, 1);
  assert.equal(result.manifest.summary.swfOnlyItems, 1);
  assert.deepEqual(result.manifest.entries.map((entry) => entry.releaseOrdinal), [1]);
  assert.deepEqual(result.manifest.noFlaDispositions.map((entry) => entry.releaseOrdinal), [3]);
});

test("check mode rejects writable or changed working copies", async () => {
  const context = await fixture();
  const result = await stageAnimateReleaseFlaCopies({root: context.root, releaseId: "lesson-fixture"});
  const copy = path.join(context.root, result.manifest.entries[0].workingCopy.file);
  await chmod(copy, 0o644);
  await assert.rejects(
    stageAnimateReleaseFlaCopies({root: context.root, releaseId: "lesson-fixture", check: true}),
    /working copy mode is not exactly 0444/,
  );
  await writeFile(copy, "changed");
  await chmod(copy, 0o444);
  await assert.rejects(
    stageAnimateReleaseFlaCopies({root: context.root, releaseId: "lesson-fixture", check: true}),
    /working copy differs from the source/,
  );
});

test("stale workspace bindings and source symlinks fail before staging", async () => {
  const workspaceContext = await fixture();
  const workspaceFile = path.join(workspaceContext.root, "migrations/course-g05-l04-vb-002/migration.json");
  const migration = JSON.parse(await readFile(workspaceFile, "utf8"));
  migration.source.flaSha256 = "0".repeat(64);
  await writeFile(workspaceFile, stable(migration));
  await assert.rejects(
    stageAnimateReleaseFlaCopies({root: workspaceContext.root, releaseId: "lesson-fixture"}),
    /workspace FLA binding differs from the catalog/,
  );

  const linkContext = await fixture();
  const source = path.join(linkContext.root, SOURCE_PREFIX, "HELP_COURSES/ELMGR5/L4/VB/A.fla");
  const target = `${source}.real`;
  await rename(source, target);
  await symlink(target, source);
  await assert.rejects(
    stageAnimateReleaseFlaCopies({root: linkContext.root, releaseId: "lesson-fixture"}),
    /symbolic-link path component|regular non-symbolic-link/,
  );
});

test("output escapes and symbolic-link output roots fail closed", async () => {
  const escapeContext = await fixture();
  await assert.rejects(
    stageAnimateReleaseFlaCopies({
      root: escapeContext.root,
      releaseId: "lesson-fixture",
      outputRoot: path.join(escapeContext.root, "outside"),
    }),
    /output root must be a release-specific child/,
  );

  const linkContext = await fixture();
  const base = path.join(linkContext.root, "work", "animate", "release-read-only-fla-copies");
  await mkdir(base, {recursive: true});
  const outside = path.join(linkContext.root, "outside");
  await mkdir(outside);
  await symlink(outside, path.join(base, "lesson-fixture"));
  await assert.rejects(
    stageAnimateReleaseFlaCopies({root: linkContext.root, releaseId: "lesson-fixture"}),
    /symbolic-link path component/,
  );
});

test("implementation has no process-launch or Animate automation dependency", async () => {
  const file = fileURLToPath(new URL("./stage-animate-release-fla-copies.mjs", import.meta.url));
  const source = await readFile(file, "utf8");
  assert.doesNotMatch(source, /node:child_process|from\s+["']child_process["']|\bspawn\s*\(|\bexecFile\s*\(/u);
  assert.doesNotMatch(source, /--run-jsfl|--dialog-operator/u);
  assert.match(source, /animateGuiLaunchAllowed: false/u);
  assert.match(source, /authoringAuditsCompleted: 0/u);
  assert.match(
    source,
    /lesson-g05-l05-add-subtract-negative-numbers[\s\S]+members: 57[\s\S]+activePages: 56[\s\S]+pairedFla: 49[\s\S]+swfOnly: 8/u,
  );
});
