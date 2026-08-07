import assert from "node:assert/strict";
import {createHash, generateKeyPairSync} from "node:crypto";
import {chmod, link, mkdtemp, mkdir, readFile, realpath, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LESSON_ANIMATE_OWNER_ROLE,
  LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
  assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic,
  canonicalLessonAnimateTrustJson,
  lessonAnimateLsOutputHasExtendedAclDiagnostic,
  lessonAnimateTrustContext,
  loadLessonAnimateExternalTrustRootDiagnostic,
  loadLessonAnimateProductionTrustRoot,
} from "./lesson-animate-production-trust.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function fixture({mutate = (value) => value} = {}) {
  const container = await realpath(await mkdtemp(path.join(os.tmpdir(), "l10-animate-trust-")));
  const projectRoot = path.join(container, "project");
  const ownerRoot = path.join(container, "external-owner");
  const trustRootPath = path.join(ownerRoot, "trust-root.json");
  await mkdir(projectRoot);
  await mkdir(ownerRoot);
  const {publicKey} = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({type: "spki", format: "pem"});
  const publicKeyBytes = Buffer.from(publicKeyPem, "utf8");
  const document = mutate({
    schemaVersion: 1,
    evidenceKind: "lesson-g04-l10-animate-owner-production-trust-root",
    releaseId: "lesson-g04-l10-perimeter-area",
    trustRootId: "owner-l10-animate-2026",
    issuedAt: "2026-08-03T00:00:00.000Z",
    owner: {
      subjectId: "owner-representative-001",
      displayName: "Owner Representative",
      publicKeyPem,
      publicKeySha256: sha256(publicKeyBytes),
      keyFingerprintSha256: sha256(publicKey.export({type: "spki", format: "der"})),
      role: LESSON_ANIMATE_OWNER_ROLE,
      status: "active",
      notBefore: "2026-08-03T00:00:00.000Z",
      notAfter: "2027-08-03T00:00:00.000Z",
    },
  });
  await writeFile(trustRootPath, `${JSON.stringify(document, null, 2)}\n`, {mode: 0o400});
  await chmod(trustRootPath, 0o400);
  return {container, projectRoot, ownerRoot, trustRootPath, document};
}

test("diagnostic loader pins one real external owner trust root but cannot authorize production", async () => {
  const input = await fixture();
  const trust = await loadLessonAnimateExternalTrustRootDiagnostic({
    projectRoot: input.projectRoot,
    ownerControlledRoot: input.ownerRoot,
    trustRootPath: input.trustRootPath,
    now: "2026-08-03T01:00:00.000Z",
  });
  assert.equal(trust.productionAnchor, false);
  assert.equal(trust.diagnosticOnly, true);
  assert.equal(trust.ownerSubjectId, "owner-representative-001");
  assert.equal(trust.trustRootFileSha256, sha256(await readFile(input.trustRootPath)));
  assert.throws(() => lessonAnimateTrustContext(trust), /diagnostic trust roots cannot authorize/);
  const diagnostic = lessonAnimateTrustContext(trust, {requireProduction: false});
  assert.equal(diagnostic.ownerPublicKeySha256, input.document.owner.publicKeySha256);
  assert.equal(diagnostic.productionAnchor, false);
  assert.notEqual(diagnostic.ownerPublicKeyBytes, diagnostic.ownerPublicKeyBytes.subarray(0));
});

test("production owner root and trust-root pathname are fixed outside the project", () => {
  assert.equal(LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
    "/Library/Application Support/HELP Math 2.0/lesson-animate-production-trust");
  assert.equal(LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
    `${LESSON_ANIMATE_PRODUCTION_OWNER_ROOT}/trust-root.json`);
  assert.equal(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
    `${LESSON_ANIMATE_PRODUCTION_OWNER_ROOT}/bin`);
  assert.equal(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
    `${LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT}/lesson-animate-atomic-replay-lock`);
  assert.equal(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
    `${LESSON_ANIMATE_PRODUCTION_OWNER_ROOT}/replay-locks`);
  assert.equal(path.isAbsolute(LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH), true);
});

test("production physical policy requires root ownership, read-only trust bytes, safe ancestors, and no ACL", () => {
  const physical = (pathValue, kind, {gid = 0, mode = "0755", inode = "1"} = {}) => ({
    path: pathValue,
    kind,
    device: "42",
    inode,
    links: kind === "directory" ? 2 : 1,
    bytes: kind === "directory" ? 96 : 512,
    uid: 0,
    gid,
    mode,
    mtimeNs: "1785720000000000000",
    ctimeNs: "1785720000000000000",
    hasAcl: false,
  });
  const valid = [
    physical("/Library", "directory"),
    physical("/Library/Application Support", "directory", {gid: 80, inode: "2"}),
    physical("/Library/Application Support/HELP Math 2.0", "directory", {gid: 80, inode: "3"}),
    physical(LESSON_ANIMATE_PRODUCTION_OWNER_ROOT, "directory", {gid: 80, inode: "4"}),
    physical(LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH, "document",
      {gid: 80, mode: "0444", inode: "5"}),
    physical(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT, "directory",
      {gid: 80, inode: "6"}),
    physical(LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH, "executable",
      {gid: 80, mode: "0555", inode: "7"}),
  ];
  assert.equal(assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid), true);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.path === LESSON_ANIMATE_PRODUCTION_OWNER_ROOT
      ? {...entry, uid: 501} : entry,
  )), /must be owned by root/);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.path === LESSON_ANIMATE_PRODUCTION_OWNER_ROOT
      ? {...entry, mode: "0775"} : entry,
  )), /group- or world-writable/);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.kind === "document" ? {...entry, mode: "0644"} : entry,
  )), /exactly 0444/);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.kind === "executable" ? {...entry, mode: "0755"} : entry,
  )), /helper mode must be exactly 0555/);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.path === "/Library/Application Support"
      ? {...entry, hasAcl: true} : entry,
  )), /may not carry an extended ACL/);
  assert.throws(() => assertLessonAnimateProductionTrustPhysicalPolicyDiagnostic(valid.map(
    (entry) => entry.kind === "document" ? {...entry, links: 2} : entry,
  )), /exactly one physical link/);
});

test("production loader rejects a caller-selected clock before consulting the fixed anchor", async () => {
  const input = await fixture();
  await assert.rejects(loadLessonAnimateProductionTrustRoot({
    projectRoot: input.projectRoot,
    now: "2026-08-03T01:00:00.000Z",
  }), (error) => error?.code === "L10_AA_PRODUCTION_TRUST_ANCHOR_UNAVAILABLE"
    && /loader options keys drifted/u.test(error.message));
});

test("trust-root canonical JSON is deterministic", () => {
  assert.equal(canonicalLessonAnimateTrustJson({z: 1, a: {d: 2, b: 3}}),
    '{"a":{"b":3,"d":2},"z":1}');
});

test("Darwin ACL probe distinguishes numbered ACL rows from a bare xattr marker", () => {
  assert.equal(lessonAnimateLsOutputHasExtendedAclDiagnostic(
    "-r--r--r--  1 root  wheel  - 42 Aug  3 00:00 trust-root.json\n",
  ), false);
  assert.equal(lessonAnimateLsOutputHasExtendedAclDiagnostic(
    "-r--r--r--@ 1 root  wheel  - 42 Aug  3 00:00 trust-root.json\n"
      + "\tcom.apple.provenance\t11\n",
  ), false);
  assert.equal(lessonAnimateLsOutputHasExtendedAclDiagnostic(
    "-r--r--r--+ 1 root  wheel  - 42 Aug  3 00:00 trust-root.json\n",
  ), true);
  assert.equal(lessonAnimateLsOutputHasExtendedAclDiagnostic(
    "-r--r--r--@ 1 root  wheel  - 42 Aug  3 00:00 trust-root.json\n"
      + " 0: group:everyone deny write\n",
  ), true);
});

test("project-local, symlinked, hardlinked, writable, and malformed trust roots fail closed", async (t) => {
  await t.test("project local", async () => {
    const input = await fixture();
    const local = path.join(input.projectRoot, "trust-root.json");
    await writeFile(local, await readFile(input.trustRootPath), {mode: 0o400});
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.projectRoot,
      trustRootPath: local,
      now: "2026-08-03T01:00:00.000Z",
    }), /disjoint trees/);
  });

  await t.test("symlink", async () => {
    const input = await fixture();
    const realFile = path.join(input.ownerRoot, "real.json");
    await writeFile(realFile, await readFile(input.trustRootPath), {mode: 0o400});
    const linked = path.join(input.ownerRoot, "linked.json");
    await symlink(realFile, linked);
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.ownerRoot,
      trustRootPath: linked,
      now: "2026-08-03T01:00:00.000Z",
    }), /real non-redirected paths|symbolic/);
  });

  await t.test("hardlink", async () => {
    const input = await fixture();
    await link(input.trustRootPath, path.join(input.ownerRoot, "second-link.json"));
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.ownerRoot,
      trustRootPath: input.trustRootPath,
      now: "2026-08-03T01:00:00.000Z",
    }), /ordinary non-linked/);
  });

  await t.test("writable", async () => {
    const input = await fixture();
    await chmod(input.trustRootPath, 0o422);
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.ownerRoot,
      trustRootPath: input.trustRootPath,
      now: "2026-08-03T01:00:00.000Z",
    }), /group- or world-writable/);
  });

  await t.test("fingerprint", async () => {
    const input = await fixture({mutate: (document) => ({
      ...document,
      owner: {...document.owner, keyFingerprintSha256: "0".repeat(64)},
    })});
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.ownerRoot,
      trustRootPath: input.trustRootPath,
      now: "2026-08-03T01:00:00.000Z",
    }), /fingerprint differs/);
  });

  await t.test("expired", async () => {
    const input = await fixture({mutate: (document) => ({
      ...document,
      owner: {...document.owner, notAfter: "2026-08-03T00:30:00.000Z"},
    })});
    await assert.rejects(loadLessonAnimateExternalTrustRootDiagnostic({
      projectRoot: input.projectRoot,
      ownerControlledRoot: input.ownerRoot,
      trustRootPath: input.trustRootPath,
      now: "2026-08-03T01:00:00.000Z",
    }), /expired/);
  });
});
