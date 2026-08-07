import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
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
  G5_L4_REQUIRED_CONTAINMENT_CONTROL_IDS,
  G5_L4_REQUIRED_STOP_CONDITIONS,
  assertConsumedG5L4Authorization,
  assertReplayLockStillBound,
  authorizationSigningBytes,
  consumeG5L4PerSessionAuthorization,
  g5L4HostIdSha256,
  sha256,
  verifyG5L4PerSessionAuthorization,
} from "./lib/g5-l4-per-session-authorization-consumer.mjs";
import {
  prepareG5L4DisposableProfile,
} from "./prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";
import {
  G5_L4_HOST_TREE_MANIFEST_NAME,
  materializeG5L4HostTree,
  sha256Bytes,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";

const NOW = Date.parse("2030-01-01T00:05:00.000Z");
const SOURCE_PATH = "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf";
const SOURCE_SHA256 = "eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c";
const SOURCE_ABSOLUTE = path.resolve("source-assets/flash/HELP MATH_ORIGINAL FILES", SOURCE_PATH);
const ANIMATE_SOURCE_PATH = "HELP_COURSES/ELMGR5/L4/IR/L4RW01.fla";
const ANIMATE_SOURCE_SHA256 = "80a7d4b83bfd3566660c7fd9a9b4586edddffd17c473e2fcc2b1a43660a3f4c5";
const ANIMATE_SOURCE_ABSOLUTE = path.resolve(
  "source-assets/flash/HELP MATH_ORIGINAL FILES",
  ANIMATE_SOURCE_PATH,
);

async function unlockTree(root) {
  const info = await lstat(root).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (!info || !info.isDirectory() || info.isSymbolicLink()) return;
  await chmod(root, 0o755);
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const child = path.join(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) await unlockTree(child);
    else if (!entry.isSymbolicLink()) await chmod(child, 0o644);
  }
}

async function setup({suffix = "000", purpose = "projector-original-runtime"} = {}) {
  const declared = await mkdtemp(path.join(os.tmpdir(), "g5-l4-auth-consumer-"));
  const root = await realpath(declared);
  const hostTreeRoot = path.join(root, "host-tree");
  await materializeG5L4HostTree({outputRoot: hostTreeRoot});
  const toolPath = path.join(root, "mock Flash Player");
  const toolBytes = Buffer.from(`mock-tool-${suffix}`);
  await writeFile(toolPath, toolBytes, {mode: 0o500});
  await chmod(toolPath, 0o500);
  const sessionId = `g5-l4-projector-session-${suffix}`;
  const profileSessionId = `g5-l4-shell-rw002-en-123e4567-e89b-12d3-a456-42661417${suffix.padStart(4, "0")}`;
  const sessionRoot = path.join(root, "session");
  const prepared = await prepareG5L4DisposableProfile({
    language: "en",
    sessionId: profileSessionId,
    sessionRoot,
    hostTreeRoot,
    projectorExecutable: toolPath,
    expectedProjectorSha256: sha256Bytes(toolBytes),
    currentHome: path.join(root, "outside-home"),
  });
  const hostManifestPath = path.join(hostTreeRoot, G5_L4_HOST_TREE_MANIFEST_NAME);
  const hostManifestBytes = await readFile(hostManifestPath);
  const hostManifest = JSON.parse(hostManifestBytes);
  const profileManifestPath = prepared.manifestPath;
  const profileManifestBytes = await readFile(profileManifestPath);
  const profileManifest = JSON.parse(profileManifestBytes);
  await mkdir(profileManifest.authorityState.replayLockRoot, {recursive: true, mode: 0o700});
  const {publicKey, privateKey} = generateKeyPairSync("ed25519");
  const publicKeyBytes = publicKey.export({type: "spki", format: "pem"});
  const ownerPublicKeyPath = path.join(root, "owner-public-key.pem");
  await writeFile(ownerPublicKeyPath, publicKeyBytes, {mode: 0o400});
  await chmod(ownerPublicKeyPath, 0o400);
  const hostIdentifier = "test-host-uuid-12345678";
  const animate = purpose === "animate-authoring";
  const sourcePath = animate ? ANIMATE_SOURCE_PATH : SOURCE_PATH;
  const sourceAbsolutePath = animate ? ANIMATE_SOURCE_ABSOLUTE : SOURCE_ABSOLUTE;
  const sourceSha256 = animate ? ANIMATE_SOURCE_SHA256 : SOURCE_SHA256;
  const containmentRoot = path.join(root, "containment-receipts");
  await mkdir(containmentRoot, {mode: 0o700});
  const containment = {};
  for (const key of [
    "approvalManifest",
    "liveNoEgressPreflight",
    "liveCapacityPreflight",
    "liveCodesignPreflight",
  ]) {
    const receiptPath = path.join(containmentRoot, `${key}.json`);
    const receiptBytes = Buffer.from(`${JSON.stringify({
      schemaVersion: 1,
      receiptType: `g5-l4-${key}`,
      sessionId,
      verified: true,
      runtimeLaunched: false,
      acceptanceEffect: "none",
    })}\n`);
    await writeFile(receiptPath, receiptBytes, {mode: 0o400});
    await chmod(receiptPath, 0o400);
    containment[key] = {path: receiptPath, sha256: sha256(receiptBytes)};
  }
  const expected = {
    purpose,
    language: animate ? null : "en",
    member: {
      ordinal: animate ? 1 : 2,
      animationId: animate ? "course-g05-l04-ir-001-a662633d" : "course-g05-l04-rw-002",
      assetId: `${animate ? "fla" : "swf"}-${sourceSha256}`,
      sourcePath,
      sourceAbsolutePath,
      sourceSha256,
    },
    host: {
      exactHostIdentifier: hostIdentifier,
      hostIdSha256: g5L4HostIdSha256(hostIdentifier),
    },
    hostTree: {
      manifestPath: hostManifestPath,
      manifestSha256: sha256(hostManifestBytes),
      fileSetSha256: hostManifest.fileSetSha256,
    },
    profile: {
      manifestPath: profileManifestPath,
      manifestSha256: sha256(profileManifestBytes),
      sessionRoot,
    },
    tool: {
      kind: animate ? "adobe-animate" : "adobe-projector",
      path: toolPath,
      sha256: sha256Bytes(toolBytes),
    },
    actionId: animate ? "animate.read-only-authoring-audit" : "projector.shell-rw002-natural-trace",
    allowedActionIds: animate ? [
      "animate.open-read-only-working-copy",
      "animate.acknowledge-legacy-warning",
      "animate.run-read-only-jsfl-audit",
      "animate.close-without-save",
      "animate.exit",
    ] : [
      "projector.empty-start",
      "projector.file-open-exact-shell",
      "shell.navigate-ir-next-rw002",
      "projector.replay",
      "projector.exit",
    ],
    ownerPublicKeyPath,
    ownerPublicKeySha256: sha256(publicKeyBytes),
    replayLockRoot: profileManifest.authorityState.replayLockRoot,
    containment,
  };
  const unsigned = {
    schemaVersion: 1,
    authorizationType: "g5-l4-hash-bound-one-time-per-session-authorization",
    decision: "authorize-once",
    session: {
      sessionId,
      releaseId: "lesson-g05-l04-number-lines",
      purpose: expected.purpose,
      language: expected.language,
      nonce: `0123456789abcdef0123456789abcdef${suffix}`,
      issuedAt: "2030-01-01T00:00:00.000Z",
      notBefore: "2030-01-01T00:00:00.000Z",
      expiresAt: "2030-01-01T00:10:00.000Z",
      ttlSeconds: 600,
      oneTimeUseRequired: true,
    },
    member: {
      ordinal: expected.member.ordinal,
      animationId: expected.member.animationId,
      assetId: expected.member.assetId,
      sourcePath: expected.member.sourcePath,
      sourceSha256: expected.member.sourceSha256,
    },
    host: {...expected.host},
    hostTree: {...expected.hostTree},
    profile: {...expected.profile},
    tool: {...expected.tool},
    operator: {
      roleId: "authorized-original-runtime-operator",
      fullName: "Dr. Peter Hu",
      externalSubjectId: "owner-operator:dr-peter-hu",
      allowedActionIds: [...expected.allowedActionIds],
    },
    action: {
      actionId: expected.actionId,
      humanOnlyActionIds: animate
        ? ["animate.acknowledge-legacy-warning"]
        : ["projector.file-open-exact-shell", "shell.navigate-ir-next-rw002", "projector.replay"],
      forbiddenActionIds: ["save-publish-export-or-convert-source", "direct-child-swf-open"],
    },
    containment: {
      controlIds: [...G5_L4_REQUIRED_CONTAINMENT_CONTROL_IDS],
      approvalManifestSha256: expected.containment.approvalManifest.sha256,
      liveNoEgressPreflightSha256: expected.containment.liveNoEgressPreflight.sha256,
      liveCapacityPreflightSha256: expected.containment.liveCapacityPreflight.sha256,
      liveCodesignPreflightSha256: expected.containment.liveCodesignPreflight.sha256,
      allApprovedAndVerified: true,
    },
    stopConditions: [...G5_L4_REQUIRED_STOP_CONDITIONS],
    authorityBoundary: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      published: false,
      acceptanceEffect: "none; execution authorization only",
    },
  };
  function signDocument(value = unsigned) {
    const document = {
      ...structuredClone(value),
      signature: {
        algorithm: "Ed25519",
        signerRole: "owner",
        signerSubjectId: "owner:dr-peter-hu",
        ownerPublicKeySha256: expected.ownerPublicKeySha256,
        signatureBase64: "pending",
      },
    };
    document.signature.signatureBase64 = sign(null, authorizationSigningBytes(document), privateKey).toString("base64");
    return document;
  }
  async function writeAuthorization(name, document) {
    const authorizationPath = path.join(root, name);
    await writeFile(authorizationPath, `${JSON.stringify(document, null, 2)}\n`, {mode: 0o400});
    await chmod(authorizationPath, 0o400);
    return authorizationPath;
  }
  return {root, hostTreeRoot, sessionRoot, expected, unsigned, signDocument, writeAuthorization};
}

async function cleanup(value) {
  await unlockTree(value.hostTreeRoot);
  await rm(value.root, {recursive: true, force: true});
}

test("valid Ed25519 authorization verifies exact member/host/tree/profile/tool hashes without consuming it", async () => {
  const value = await setup({suffix: "010"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const result = await verifyG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW});
    assert.equal(result.status, "verified-not-consumed-not-launched");
    assert.equal(result.ownerSignatureVerified, true);
    assert.equal(result.member.animationId, "course-g05-l04-rw-002");
    assert.equal(result.hostTreeManifestSha256, value.expected.hostTree.manifestSha256);
    assert.equal(result.consumed, false);
    assert.equal(result.runtimeLaunched, false);
    assert.equal(result.acceptanceEffect, "none");
    assert.deepEqual(await readdir(value.expected.replayLockRoot), []);
  } finally {
    await cleanup(value);
  }
});

test("replay authority must remain outside the runtime session and match the hash-bound profile manifest", async () => {
  const value = await setup({suffix: "019"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const runtimeWritable = structuredClone(value.expected);
    runtimeWritable.replayLockRoot = path.join(value.sessionRoot, "runtime-profile/home/replay-locks");
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath, expected: runtimeWritable, now: NOW}),
      /outside and disjoint from the runtime-writable disposable session/u,
    );

    const unboundExternal = structuredClone(value.expected);
    unboundExternal.replayLockRoot = path.join(value.root, "different-authority-state/replay-locks");
    await mkdir(unboundExternal.replayLockRoot, {recursive: true, mode: 0o700});
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath, expected: unboundExternal, now: NOW}),
      /external supervisor-only authority root/u,
    );
  } finally {
    await cleanup(value);
  }
});

test("Animate integration accepts only a consumed FLA-bound opaque token for the exact G5 L4 member", async () => {
  const value = await setup({suffix: "018", purpose: "animate-authoring"});
  try {
    const authorizationPath = await value.writeAuthorization("animate-authorization.json", value.signDocument());
    const token = await consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW});
    assert.equal(assertConsumedG5L4Authorization(token, {
      purpose: "animate-authoring",
      actionId: "animate.read-only-authoring-audit",
      animationId: "course-g05-l04-ir-001-a662633d",
      language: null,
      sourceAbsolutePath: ANIMATE_SOURCE_ABSOLUTE,
      sourceSha256: ANIMATE_SOURCE_SHA256,
      toolPath: value.expected.tool.path,
      toolSha256: value.expected.tool.sha256,
      now: NOW,
    }), token);
    assert.equal(await assertReplayLockStillBound(token), true);
    assert.equal(token.member.assetId, `fla-${ANIMATE_SOURCE_SHA256}`);
    assert.equal(token.runtimeLaunched, false);
    assert.equal(token.acceptanceEffect, "none");
  } finally {
    await cleanup(value);
  }
});

test("consumer atomically locks the nonce once and returns an opaque exact-execution token", async () => {
  const value = await setup({suffix: "011"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const token = await consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW});
    assert.equal(token.consumed, true);
    assert.equal(token.runtimeLaunched, false);
    assert.equal(token.replayLockAtomicPrimitive, "openat(O_CREAT|O_EXCL|O_NOFOLLOW)");
    assert.equal(Object.keys(token).filter((key) => key === "actionId").length, 1);
    assert.equal(await assertReplayLockStillBound(token), true);
    assert.equal(assertConsumedG5L4Authorization(token, {
      purpose: "projector-original-runtime",
      actionId: "projector.shell-rw002-natural-trace",
      animationId: "course-g05-l04-rw-002",
      language: "en",
      now: NOW,
    }), token);
    assert.throws(() => assertConsumedG5L4Authorization(token, {
      purpose: "projector-original-runtime",
      actionId: "projector.shell-rw002-natural-trace",
      animationId: "course-g05-l04-rw-002",
      language: "en",
      now: NOW,
    }), /already claimed for execution/u);
    assert.throws(() => assertConsumedG5L4Authorization({...token}, {
      purpose: "projector-original-runtime",
      actionId: token.actionId,
      animationId: token.member.animationId,
      language: token.language,
    }), /opaque token/);
    await assert.rejects(
      consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW}),
      /already consumed/,
    );
  } finally {
    await cleanup(value);
  }
});

test("concurrent consumption yields exactly one winner and one replay failure", async () => {
  const value = await setup({suffix: "012"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const results = await Promise.allSettled([
      consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW}),
      consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW}),
    ]);
    assert.equal(results.filter(({status}) => status === "fulfilled").length, 1);
    assert.equal(results.filter(({status}) => status === "rejected").length, 1);
    assert.match(results.find(({status}) => status === "rejected").reason.message, /already consumed/);
  } finally {
    await cleanup(value);
  }
});

test("one consumed token has exactly one atomic execution-claim winner", async () => {
  const value = await setup({suffix: "019"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const token = await consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW});
    const claim = () => assertConsumedG5L4Authorization(token, {
      purpose: "projector-original-runtime",
      actionId: "projector.shell-rw002-natural-trace",
      animationId: "course-g05-l04-rw-002",
      language: "en",
      now: NOW,
    });
    const results = await Promise.allSettled([
      Promise.resolve().then(claim),
      Promise.resolve().then(claim),
      Promise.resolve().then(claim),
    ]);
    assert.equal(results.filter(({status}) => status === "fulfilled").length, 1);
    assert.equal(results.filter(({status}) => status === "rejected").length, 2);
    for (const result of results.filter(({status}) => status === "rejected")) {
      assert.match(result.reason.message, /already claimed for execution/u);
    }
  } finally {
    await cleanup(value);
  }
});

test("consumer rejects expired TTL, wrong member/host, incomplete stop conditions and bad signatures", async () => {
  const value = await setup({suffix: "013"});
  try {
    const valid = value.signDocument();
    const expiredPath = await value.writeAuthorization("expired.json", valid);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: expiredPath, expected: value.expected, now: Date.parse("2030-01-01T00:11:00.000Z")}),
      /not currently valid/,
    );

    const wrongMember = structuredClone(value.unsigned);
    wrongMember.member.ordinal = 3;
    const wrongMemberPath = await value.writeAuthorization("wrong-member.json", value.signDocument(wrongMember));
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: wrongMemberPath, expected: value.expected, now: NOW}),
      /exact member binding/,
    );

    const wrongHost = structuredClone(value.unsigned);
    wrongHost.host.exactHostIdentifier = "different-host-identifier";
    wrongHost.host.hostIdSha256 = g5L4HostIdSha256(wrongHost.host.exactHostIdentifier);
    const wrongHostPath = await value.writeAuthorization("wrong-host.json", value.signDocument(wrongHost));
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: wrongHostPath, expected: value.expected, now: NOW}),
      /exact host binding/,
    );

    const missingStop = structuredClone(value.unsigned);
    missingStop.stopConditions.pop();
    const missingStopPath = await value.writeAuthorization("missing-stop.json", value.signDocument(missingStop));
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: missingStopPath, expected: value.expected, now: NOW}),
      /stop-condition set/,
    );

    const unboundContainment = structuredClone(value.unsigned);
    unboundContainment.containment.approvalManifestSha256 = "a".repeat(64);
    const unboundContainmentPath = await value.writeAuthorization(
      "unbound-containment.json",
      value.signDocument(unboundContainment),
    );
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({
        authorizationPath: unboundContainmentPath,
        expected: value.expected,
        now: NOW,
      }),
      /differs from the physical expected receipt/u,
    );

    const badSignature = value.signDocument();
    badSignature.signature.signatureBase64 = Buffer.alloc(64, 7).toString("base64");
    const badSignaturePath = await value.writeAuthorization("bad-signature.json", badSignature);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: badSignaturePath, expected: value.expected, now: NOW}),
      /signature verification failed/,
    );
  } finally {
    await cleanup(value);
  }
});

test("authorization file and replay-lock root must be immutable real filesystem objects", async () => {
  const value = await setup({suffix: "014"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    await chmod(authorizationPath, 0o600);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW}),
      /must be read-only/,
    );
    await chmod(authorizationPath, 0o400);
    await chmod(value.expected.replayLockRoot, 0o755);
    await assert.rejects(
      consumeG5L4PerSessionAuthorization({authorizationPath, expected: value.expected, now: NOW}),
      /real 0700 directory/,
    );
  } finally {
    await cleanup(value);
  }
});

test("signature input rejects unpadded, base64url and non-64-byte encodings before crypto verification", async () => {
  const value = await setup({suffix: "015"});
  try {
    const valid = value.signDocument();
    const unpadded = structuredClone(valid);
    unpadded.signature.signatureBase64 = unpadded.signature.signatureBase64.replace(/==$/u, "");
    const unpaddedPath = await value.writeAuthorization("unpadded.json", unpadded);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: unpaddedPath, expected: value.expected, now: NOW}),
      /canonical padded standard base64/u,
    );

    const base64url = structuredClone(valid);
    base64url.signature.signatureBase64 = `-${base64url.signature.signatureBase64.slice(1)}`;
    const base64urlPath = await value.writeAuthorization("base64url.json", base64url);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: base64urlPath, expected: value.expected, now: NOW}),
      /canonical padded standard base64/u,
    );

    const short = structuredClone(valid);
    short.signature.signatureBase64 = Buffer.alloc(63, 1).toString("base64");
    const shortPath = await value.writeAuthorization("short-signature.json", short);
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({authorizationPath: shortPath, expected: value.expected, now: NOW}),
      /canonical padded standard base64/u,
    );
  } finally {
    await cleanup(value);
  }
});

test("authorization bytes are read from one pinned descriptor and path replacement fails closed", async () => {
  const value = await setup({suffix: "016"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const movedPath = path.join(value.root, "authorization-original.json");
    await assert.rejects(
      verifyG5L4PerSessionAuthorization({
        authorizationPath,
        expected: value.expected,
        now: NOW,
        authorizationFileOpenedHook: async () => {
          await rename(authorizationPath, movedPath);
          await writeFile(authorizationPath, "{}\n", {mode: 0o400});
          await chmod(authorizationPath, 0o400);
        },
      }),
      /path changed while its pinned descriptor was read/u,
    );
    assert.match(await readFile(movedPath, "utf8"), /g5-l4-hash-bound-one-time/u);
    assert.equal(await readFile(authorizationPath, "utf8"), "{}\n");
  } finally {
    await cleanup(value);
  }
});

test("replay-lock CAS rejects replay-root ancestor replacement without writing into the replacement", async () => {
  const value = await setup({suffix: "017"});
  try {
    const authorizationPath = await value.writeAuthorization("authorization.json", value.signDocument());
    const replayRoot = value.expected.replayLockRoot;
    const movedRoot = `${replayRoot}.moved`;
    const attackerRoot = path.join(value.root, "attacker-replay-root");
    await assert.rejects(
      consumeG5L4PerSessionAuthorization({
        authorizationPath,
        expected: value.expected,
        now: NOW,
        beforeReplayLockCommitHook: async () => {
          await rename(replayRoot, movedRoot);
          await mkdir(attackerRoot, {mode: 0o700});
          await symlink(attackerRoot, replayRoot);
        },
      }),
      /openat\(O_EXCL\) CAS failed closed|pinned replay-lock root/u,
    );
    assert.deepEqual(await readdir(attackerRoot), []);
    assert.deepEqual(await readdir(movedRoot), []);
  } finally {
    await cleanup(value);
  }
});
