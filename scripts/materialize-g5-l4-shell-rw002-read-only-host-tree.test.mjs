import assert from "node:assert/strict";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  G5_L4_FORBIDDEN_RUNTIME_REQUESTS,
  G5_L4_HOST_TREE_MANIFEST_NAME,
  G5_L4_TRACE_SCOPED_RESOURCES,
  buildG5L4HostTreePlan,
  materializeG5L4HostTree,
  sha256Bytes,
  stableJson,
  validateG5L4HostTreeManifest,
  verifyG5L4HostTree,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";

function refingerprintManifest(manifest) {
  const {manifestFingerprintSha256: ignored, ...withoutFingerprint} = manifest;
  void ignored;
  manifest.manifestFingerprintSha256 = sha256Bytes(Buffer.from(stableJson(withoutFingerprint)));
  return manifest;
}

async function scratchDirectory(prefix) {
  return realpath(await mkdtemp(path.join(os.tmpdir(), prefix)));
}

async function unlockTree(root) {
  const info = await lstat(root).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (!info || !info.isDirectory()) return;
  await chmod(root, 0o755);
  for (const entry of await readdir(root, {withFileTypes: true})) {
    if (entry.isDirectory() && !entry.isSymbolicLink()) await unlockTree(path.join(root, entry.name));
    else if (!entry.isSymbolicLink()) await chmod(path.join(root, entry.name), 0o644);
  }
}

test("G5 L4 host-tree plan binds only the trace-scoped shell, IR, RW02, audio and canonical glossary masters", async () => {
  const scratch = await scratchDirectory("g5-l4-host-plan-");
  try {
    const plan = await buildG5L4HostTreePlan({outputRoot: path.join(scratch, "root")});
    assert.equal(plan.manifest.files.length, 7);
    assert.equal(plan.manifest.summary.bytes, 2_330_896);
    assert.deepEqual(plan.manifest.files.map(({path: file}) => file),
      G5_L4_TRACE_SCOPED_RESOURCES.map(({path: file}) => file));
    assert.deepEqual(plan.manifest.requestPolicy.forbiddenRequests, G5_L4_FORBIDDEN_RUNTIME_REQUESTS);
    assert.equal(plan.manifest.requestPolicy.renameOrSubstituteMissingLessonXml, false);
    assert.equal(plan.manifest.sourceGapException.exactLessonXmlStillMissing, true);
    assert.equal(plan.manifest.sourceGapException.strictSourceGapClosed, false);
    assert.equal(plan.manifest.staticRequestEvidence.missingLessonXmlLiteralCounts.L4KTE01, 0);
    assert.equal(plan.manifest.staticRequestEvidence.missingLessonXmlLiteralCounts.L4KTS01, 0);
    assert.equal(plan.manifest.staticRequestEvidence.canonicalMasterLiteralCounts.ELKTEG4, 2);
    assert.equal(plan.manifest.staticRequestEvidence.canonicalMasterLiteralCounts.ELKTSG4, 1);
    assert.equal(Object.values(plan.manifest.acceptanceEffects).some(Boolean), false);
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
});

test("materializer creates and rechecks an exact 0444/0555 no-link allowlist without launching anything", async () => {
  const scratch = await scratchDirectory("g5-l4-host-tree-");
  const outputRoot = path.join(scratch, "root");
  try {
    const written = await materializeG5L4HostTree({outputRoot});
    assert.equal(written.changed, 1);
    assert.equal(written.runtimeSessionsExecuted, 0);
    assert.equal(written.acceptanceEffect, "none");
    const plan = await buildG5L4HostTreePlan({outputRoot});
    const verified = await verifyG5L4HostTree(plan);
    assert.equal(verified.files, 7);
    assert.equal((await lstat(outputRoot)).mode & 0o777, 0o555);
    assert.equal((await lstat(path.join(outputRoot, G5_L4_HOST_TREE_MANIFEST_NAME))).mode & 0o777, 0o444);
    for (const resource of G5_L4_TRACE_SCOPED_RESOURCES) {
      const info = await lstat(path.join(outputRoot, resource.path));
      assert.equal(info.isFile(), true);
      assert.equal(info.isSymbolicLink(), false);
      assert.equal(info.nlink, 1);
      assert.equal(info.mode & 0o777, 0o444);
    }
    const second = await materializeG5L4HostTree({outputRoot, check: true});
    assert.equal(second.changed, 0);
  } finally {
    await unlockTree(outputRoot);
    await rm(scratch, {recursive: true, force: true});
  }
});

test("host-tree verification rejects unallowlisted files and symbolic links", async () => {
  const scratch = await scratchDirectory("g5-l4-host-reject-");
  const outputRoot = path.join(scratch, "root");
  try {
    await materializeG5L4HostTree({outputRoot});
    const plan = await buildG5L4HostTreePlan({outputRoot});
    await chmod(outputRoot, 0o755);
    await writeFile(path.join(outputRoot, "unexpected.txt"), "unexpected");
    await chmod(outputRoot, 0o555);
    await assert.rejects(verifyG5L4HostTree(plan), /missing or unallowlisted file/);
    await chmod(outputRoot, 0o755);
    await rm(path.join(outputRoot, "unexpected.txt"));
    const lessonRoot = path.join(outputRoot, "HELP_COURSES/ELMGR5/L4");
    await chmod(lessonRoot, 0o755);
    await symlink("index_local.swf", path.join(lessonRoot, "alias.swf"));
    await chmod(lessonRoot, 0o555);
    await chmod(outputRoot, 0o555);
    await assert.rejects(verifyG5L4HostTree(plan), /symbolic links are forbidden/);
  } finally {
    await unlockTree(outputRoot);
    await rm(scratch, {recursive: true, force: true});
  }
});

test("manifest validation rejects schema injection, missing acceptance, renamed XML or promotion", async () => {
  const scratch = await scratchDirectory("g5-l4-host-manifest-");
  try {
    const plan = await buildG5L4HostTreePlan({outputRoot: path.join(scratch, "root")});
    const renamed = structuredClone(plan.manifest);
    renamed.requestPolicy.renameOrSubstituteMissingLessonXml = true;
    assert.throws(() => validateG5L4HostTreeManifest(renamed), /request policy drifted/);
    const promoted = structuredClone(plan.manifest);
    promoted.acceptanceEffects.authoritativeOriginalRuntime = true;
    assert.throws(() => validateG5L4HostTreeManifest(promoted), /execution or acceptance/);
    const injected = structuredClone(plan.manifest);
    injected.runtimeExecutionAuthorized = true;
    refingerprintManifest(injected);
    assert.throws(() => validateG5L4HostTreeManifest(injected), /manifest keys drifted/);
    const emptyAcceptance = structuredClone(plan.manifest);
    emptyAcceptance.acceptanceEffects = {};
    refingerprintManifest(emptyAcceptance);
    assert.throws(() => validateG5L4HostTreeManifest(emptyAcceptance), /acceptance effects keys drifted/);
    const omittedAcceptance = structuredClone(plan.manifest);
    delete omittedAcceptance.acceptanceEffects;
    refingerprintManifest(omittedAcceptance);
    assert.throws(() => validateG5L4HostTreeManifest(omittedAcceptance), /manifest keys drifted/);
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
});

test("check mode fails closed when the fixed candidate is absent", async () => {
  const scratch = await scratchDirectory("g5-l4-host-missing-");
  try {
    await assert.rejects(
      materializeG5L4HostTree({outputRoot: path.join(scratch, "missing"), check: true}),
      /host tree is missing/,
    );
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
});

test("host-tree publication uses no-replace commit and preserves a concurrently created target", async () => {
  const scratch = await scratchDirectory("g5-l4-host-cas-");
  const outputRoot = path.join(scratch, "root");
  try {
    await assert.rejects(
      materializeG5L4HostTree({
        outputRoot,
        beforePublishHook: async () => {
          await mkdir(outputRoot);
          await writeFile(path.join(outputRoot, "owner-sentinel.txt"), "do-not-overwrite");
        },
      }),
      /RENAME_EXCL|target already exists/u,
    );
    assert.equal(await readFile(path.join(outputRoot, "owner-sentinel.txt"), "utf8"), "do-not-overwrite");
    assert.equal((await readdir(outputRoot)).length, 1);
  } finally {
    await unlockTree(scratch);
    await rm(scratch, {recursive: true, force: true});
  }
});

test("host-tree publication rejects a symbolic-link ancestor before staging", async () => {
  const scratch = await scratchDirectory("g5-l4-host-symlink-parent-");
  const realParent = path.join(scratch, "real-parent");
  const linkedParent = path.join(scratch, "linked-parent");
  try {
    await mkdir(realParent);
    await symlink(realParent, linkedParent);
    await assert.rejects(
      materializeG5L4HostTree({outputRoot: path.join(linkedParent, "root")}),
      /symbolic link|aliased/u,
    );
    assert.deepEqual(await readdir(realParent), []);
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
});

test("host-tree native commit rejects publication-parent inode replacement after staging", async () => {
  const scratch = await scratchDirectory("g5-l4-host-parent-swap-");
  const parent = path.join(scratch, "publication");
  const movedParent = path.join(scratch, "publication-moved");
  const attackerParent = path.join(scratch, "attacker");
  const outputRoot = path.join(parent, "root");
  await mkdir(parent, {mode: 0o700});
  try {
    await assert.rejects(materializeG5L4HostTree({
      outputRoot,
      beforePublishHook: async () => {
        await rename(parent, movedParent);
        await mkdir(attackerParent);
        await symlink(attackerParent, parent);
      },
    }), /pinned publication parent|RENAME_EXCL commit failed closed/u);
    assert.deepEqual(await readdir(attackerParent), []);
    assert.equal((await readdir(movedParent)).some((name) => name.startsWith(".g5-l4-shell-rw002-stage-")), true);
  } finally {
    await rm(parent, {force: true}).catch(() => {});
    await rename(movedParent, parent).catch(() => {});
    await unlockTree(scratch);
    await rm(scratch, {recursive: true, force: true});
  }
});
