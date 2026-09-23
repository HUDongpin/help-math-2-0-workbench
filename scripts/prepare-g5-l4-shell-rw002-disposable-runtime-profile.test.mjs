import assert from "node:assert/strict";
import {
  chmod,
  lstat,
  mkdtemp,
  mkdir,
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
  G5_L4_MINIMUM_SESSION_FREE_BYTES,
  G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS,
  buildG5L4DisposableProfilePlan,
  prepareG5L4DisposableProfile,
  renderG5L4SandboxProfile,
  validateG5L4DisposableProfileManifest,
  verifyG5L4DisposableProfile,
} from "./prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";
import {
  materializeG5L4HostTree,
  sha256Bytes,
  stableJson,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";

const EN_SESSION_ID = "g5-l4-shell-rw002-en-123e4567-e89b-12d3-a456-426614174000";
const ES_SESSION_ID = "g5-l4-shell-rw002-es-123e4567-e89b-12d3-a456-426614174001";

function refingerprintManifest(manifest) {
  const {manifestFingerprintSha256: ignored, ...withoutFingerprint} = manifest;
  void ignored;
  manifest.manifestFingerprintSha256 = sha256Bytes(Buffer.from(stableJson(withoutFingerprint)));
  return manifest;
}

async function fixture() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "g5-l4-profile-test-")));
  const hostTreeRoot = path.join(root, "host-tree");
  await materializeG5L4HostTree({outputRoot: hostTreeRoot});
  const projectorExecutable = path.join(root, "mock Flash Player");
  const projectorBytes = Buffer.from("mock-projector-executable");
  await writeFile(projectorExecutable, projectorBytes, {mode: 0o500});
  await chmod(projectorExecutable, 0o500);
  return {
    root,
    hostTreeRoot,
    projectorExecutable,
    expectedProjectorSha256: sha256Bytes(projectorBytes),
  };
}

async function cleanup(value) {
  async function unlock(directory) {
    const info = await lstat(directory).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (!info || !info.isDirectory() || info.isSymbolicLink()) return;
    await chmod(directory, 0o755);
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) await unlock(child);
      else if (!entry.isSymbolicLink()) await chmod(child, 0o644);
    }
  }
  await unlock(value.hostTreeRoot);
  await rm(value.root, {recursive: true, force: true});
}

test("sandbox contract denies egress, host effects, host-tree writes and both missing lesson XML names", () => {
  const replayLockRoot = "/tmp/g5-authority-state/replay-locks";
  const policy = renderG5L4SandboxProfile({
    projectorExecutable: "/Applications/Test Flash Player",
    hostTreeRoot: "/tmp/g5-host-tree",
    sessionRoot: "/tmp/g5-session",
    replayLockRoot,
    currentHome: "/Users/tester",
  });
  assert.match(policy, /^\(version 1\)\n\(deny default\)/u);
  assert.doesNotMatch(policy, /\(allow default\)/u);
  assert.match(policy, /\(deny network\*\)/);
  assert.match(policy, /\(deny appleevent-send\)/);
  assert.match(policy, /allow process-exec.*Applications\/Test Flash Player/u);
  assert.match(policy, /L4KTE01\.xml/);
  assert.match(policy, /L4KTS01\.xml/);
  assert.match(policy, /g5-host-tree/);
  assert.match(policy, /deny file-read\* file-write\*.*g5-authority-state\/replay-locks/u);
  assert.doesNotMatch(policy, /allow file-read\* \(subpath "\/tmp\/g5-host-tree"\)/u);
  assert.doesNotMatch(policy, /\(subpath "\/private\/tmp"\)/u);
  assert.doesNotMatch(policy, /\(subpath "\/private\/var\/folders"\)/u);
  assert.doesNotMatch(policy, /allow file-read\*.*Users\/tester/u);
});

test("EN and ES plans require separate profiles, fresh processes and immutable pre/postflight contracts", async () => {
  const value = await fixture();
  try {
    const common = {
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
    };
    const en = await buildG5L4DisposableProfilePlan({
      ...common,
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot: path.join(value.root, "sessions", EN_SESSION_ID),
    });
    const es = await buildG5L4DisposableProfilePlan({
      ...common,
      language: "es",
      sessionId: ES_SESSION_ID,
      sessionRoot: path.join(value.root, "sessions", ES_SESSION_ID),
    });
    assert.notEqual(en.sessionRoot, es.sessionRoot);
    assert.notEqual(en.profileRoot, es.profileRoot);
    assert.equal(en.manifest.languageIsolation.profileReuseAcrossLanguagesForbidden, true);
    assert.equal(en.manifest.preflightContract.capacity.minimumFreeBytes, G5_L4_MINIMUM_SESSION_FREE_BYTES);
    assert.deepEqual(
      en.manifest.preflightContract.processAbsence.protectedDoNotSignalPids,
      G5_L4_PROTECTED_PREEXISTING_FLASH_PIDS,
    );
    assert.equal(en.manifest.preflightContract.processAbsence.mustNotSignalExistingProcesses, true);
    assert.equal(en.manifest.preflightContract.processAbsence.protectedPidIdentityVerified, false);
    assert.equal(en.manifest.preflightContract.processAbsence.protectedPidMayBeStaleOrReused, true);
    assert.equal(en.manifest.preflightContract.network.successfulOutboundConnectionsAllowed, 0);
    assert.equal(en.manifest.sandbox.noEgressPolicyDeclared, true);
    assert.equal(en.manifest.sandbox.liveNoEgressVerified, false);
    assert.equal(en.manifest.sandbox.defaultDeny, true);
    assert.equal(en.manifest.sandbox.readAllowlist.length, 7);
    assert.equal(en.manifest.sandbox.sessionOnlyWrites.length, 5);
    assert.equal(en.manifest.sandbox.globalTemporaryWritesDenied, true);
    assert.equal(en.manifest.sandbox.arbitraryHostReadsDenied, true);
    assert.equal(en.manifest.sandbox.replayAuthorityWritesDenied, true);
    assert.equal(en.manifest.authorityState.runtimeWritable, false);
    assert.equal(en.manifest.authorityState.externalAuthorityRequired, true);
    assert.equal(en.manifest.authorityState.replayLockRoot.startsWith(en.sessionRoot), false);
    assert.equal(en.manifest.preflightContract.network.liveNoEgressVerificationRequiredImmediatelyBeforeLaunch, true);
    assert.equal(en.manifest.postflightContract.completeProjectorExitRequired, true);
    assert.equal(en.manifest.postflightContract.forbiddenRequestCountAllowed, 0);
    assert.equal(Object.values(en.manifest.acceptanceEffects).some(Boolean), false);
  } finally {
    await cleanup(value);
  }
});

test("profile materializer creates only empty 0700 stores plus 0400 manifest and sandbox", async () => {
  const value = await fixture();
  const sessionRoot = path.join(value.root, "sessions", EN_SESSION_ID);
  try {
    const options = {
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot,
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
    };
    const written = await prepareG5L4DisposableProfile(options);
    assert.equal(written.changed, 1);
    assert.equal(written.projectorLaunched, false);
    assert.equal(written.runtimeSessionExecuted, false);
    const plan = await buildG5L4DisposableProfilePlan(options);
    const verified = await verifyG5L4DisposableProfile(plan);
    assert.equal(verified.status, "verified-empty-profile-candidate-not-launched");
    const manifest = JSON.parse(await readFile(path.join(sessionRoot, "profile-manifest.json")));
    validateG5L4DisposableProfileManifest(manifest);
    assert.equal(manifest.emptyStores.sharedObjects.startsWith(sessionRoot), true);
    assert.equal(Object.hasOwn(manifest.emptyStores, "replayLocks"), false);
    await assert.rejects(lstat(manifest.authorityState.replayLockRoot), {code: "ENOENT"});
    const checked = await prepareG5L4DisposableProfile({...options, check: true});
    assert.equal(checked.changed, 0);
  } finally {
    await rm(sessionRoot, {recursive: true, force: true}).catch(() => {});
    await cleanup(value);
  }
});

test("profile verification fails closed on contamination, schema injection or promotion", async () => {
  const value = await fixture();
  const sessionRoot = path.join(value.root, "sessions", EN_SESSION_ID);
  try {
    const options = {
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot,
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
    };
    await prepareG5L4DisposableProfile(options);
    const plan = await buildG5L4DisposableProfilePlan(options);
    await writeFile(path.join(plan.manifest.emptyStores.sharedObjects, "contaminated.sol"), "state");
    await assert.rejects(verifyG5L4DisposableProfile(plan), /unexpected file|must remain empty/);
    const promoted = structuredClone(plan.manifest);
    promoted.executionGate.runtimeAuthorized = true;
    assert.throws(() => validateG5L4DisposableProfileManifest(promoted), /execution or acceptance/);
    const injected = structuredClone(plan.manifest);
    injected.runtimeExecutionAuthorized = true;
    refingerprintManifest(injected);
    assert.throws(() => validateG5L4DisposableProfileManifest(injected), /profile manifest keys drifted/);
    const emptyAcceptance = structuredClone(plan.manifest);
    emptyAcceptance.acceptanceEffects = {};
    refingerprintManifest(emptyAcceptance);
    assert.throws(
      () => validateG5L4DisposableProfileManifest(emptyAcceptance),
      /profile acceptance effects keys drifted/,
    );
    const omittedAcceptance = structuredClone(plan.manifest);
    delete omittedAcceptance.acceptanceEffects;
    refingerprintManifest(omittedAcceptance);
    assert.throws(
      () => validateG5L4DisposableProfileManifest(omittedAcceptance),
      /profile manifest keys drifted/,
    );
  } finally {
    await rm(sessionRoot, {recursive: true, force: true}).catch(() => {});
    await cleanup(value);
  }
});

test("profile check mode refuses an absent session and language/session mismatch", async () => {
  const value = await fixture();
  try {
    await assert.rejects(buildG5L4DisposableProfilePlan({
      language: "es",
      sessionId: EN_SESSION_ID,
      sessionRoot: path.join(value.root, "missing"),
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
    }), /language-bound/);
    await mkdir(path.join(value.root, "sessions"), {recursive: true});
    await assert.rejects(prepareG5L4DisposableProfile({
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot: path.join(value.root, "sessions", "missing"),
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      check: true,
    }), /disposable profile is missing/);
  } finally {
    await cleanup(value);
  }
});

test("profile publication uses no-replace commit and preserves a concurrently created session", async () => {
  const value = await fixture();
  const sessionRoot = path.join(value.root, "sessions", EN_SESSION_ID);
  try {
    const options = {
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot,
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
      beforePublishHook: async () => {
        await mkdir(sessionRoot);
        await writeFile(path.join(sessionRoot, "owner-sentinel.txt"), "do-not-overwrite");
      },
    };
    await assert.rejects(prepareG5L4DisposableProfile(options), /RENAME_EXCL|target already exists/u);
    assert.equal(await readFile(path.join(sessionRoot, "owner-sentinel.txt"), "utf8"), "do-not-overwrite");
    assert.equal((await readdir(sessionRoot)).length, 1);
  } finally {
    await cleanup(value);
  }
});

test("profile publication rejects a symbolic-link ancestor before staging", async () => {
  const value = await fixture();
  const realParent = path.join(value.root, "real-sessions");
  const linkedParent = path.join(value.root, "linked-sessions");
  try {
    await mkdir(realParent);
    await symlink(realParent, linkedParent);
    await assert.rejects(prepareG5L4DisposableProfile({
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot: path.join(linkedParent, EN_SESSION_ID),
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
    }), /symbolic link|aliased/u);
    assert.deepEqual(await readdir(realParent), []);
  } finally {
    await cleanup(value);
  }
});

test("profile native commit rejects session-parent inode replacement after staging", async () => {
  const value = await fixture();
  const parent = path.join(value.root, "sessions-swap");
  const movedParent = path.join(value.root, "sessions-swap-moved");
  const attackerParent = path.join(value.root, "sessions-attacker");
  const sessionRoot = path.join(parent, EN_SESSION_ID);
  await mkdir(parent, {mode: 0o700});
  try {
    await assert.rejects(prepareG5L4DisposableProfile({
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot,
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
      beforePublishHook: async () => {
        await rename(parent, movedParent);
        await mkdir(attackerParent);
        await symlink(attackerParent, parent);
      },
    }), /pinned publication parent|RENAME_EXCL commit failed closed/u);
    assert.deepEqual(await readdir(attackerParent), []);
    assert.equal((await readdir(movedParent)).some((name) => name.startsWith(".g5-l4-profile-")), true);
  } finally {
    await rm(parent, {force: true}).catch(() => {});
    await rename(movedParent, parent).catch(() => {});
    await cleanup(value);
  }
});

test("profile native commit rejects a staged-leaf inode swap immediately before publication", async () => {
  const value = await fixture();
  const parent = path.join(value.root, "sessions-staged-swap");
  const sessionRoot = path.join(parent, EN_SESSION_ID);
  await mkdir(parent, {mode: 0o700});
  let movedTemporary = null;
  try {
    await assert.rejects(prepareG5L4DisposableProfile({
      language: "en",
      sessionId: EN_SESSION_ID,
      sessionRoot,
      hostTreeRoot: value.hostTreeRoot,
      projectorExecutable: value.projectorExecutable,
      expectedProjectorSha256: value.expectedProjectorSha256,
      currentHome: path.join(value.root, "home-outside-profile"),
      beforePublishHook: async ({temporary}) => {
        movedTemporary = `${temporary}.original`;
        await rename(temporary, movedTemporary);
        await mkdir(temporary, {mode: 0o700});
        await writeFile(path.join(temporary, "attacker-sentinel.txt"), "must-not-publish");
      },
    }), /staged publication source identity|RENAME_EXCL commit failed closed/u);
    await assert.rejects(lstat(sessionRoot), {code: "ENOENT"});
    assert.equal(await readFile(path.join(
      parent,
      (await readdir(parent)).find((leaf) => leaf.startsWith(".g5-l4-profile-") && !leaf.endsWith(".original")),
      "attacker-sentinel.txt",
    ), "utf8"), "must-not-publish");
    assert.equal((await lstat(movedTemporary)).isDirectory(), true);
  } finally {
    await cleanup(value);
  }
});
