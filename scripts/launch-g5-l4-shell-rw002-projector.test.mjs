import assert from "node:assert/strict";
import {chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  classifyG5L4ResourceAudit,
  launchG5L4Projector,
  parseArguments,
  parseProjectorProcessTable,
  renderG5L4LiveNoEgressProbePolicy,
  runG5L4LiveNoEgressProbe,
  validateG5L4ProjectorLaunchPlan,
  verifyG5L4FullHostTreeBinding,
} from "./launch-g5-l4-shell-rw002-projector.mjs";
import {
  G5_L4_FORBIDDEN_RUNTIME_REQUESTS,
  G5_L4_HOST_TREE_MANIFEST_NAME,
  G5_L4_TRACE_SCOPED_RESOURCES,
  materializeG5L4HostTree,
  sha256Bytes,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";
import {
  prepareG5L4DisposableProfile,
  renderG5L4SandboxProfile,
} from "./prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";

async function unlockTree(root) {
  const info = await lstat(root).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (!info || !info.isDirectory() || info.isSymbolicLink()) return;
  await chmod(root, 0o700);
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const child = path.join(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) await unlockTree(child);
    else if (!entry.isSymbolicLink()) await chmod(child, 0o600);
  }
}

function fixturePlan() {
  const executable = "/Applications/Test Flash Player";
  const allowedRead = "/private/tmp/host/HELP_COURSES/ELMGR5/L4/index_local.swf";
  const sessionWrite = "/private/tmp/session/runtime-profile/home";
  const replayLockRoot = "/private/tmp/authority-state/replay-locks";
  const policy = [
    "(version 1)",
    "(deny default)",
    "(deny network*)",
    `(allow process-exec (literal ${JSON.stringify(executable)}))`,
    `(allow file-read-data file-read-metadata (literal ${JSON.stringify(allowedRead)}))`,
    `(deny file-read* file-write* (subpath ${JSON.stringify(replayLockRoot)}))`,
    `(allow file-read* file-write* (subpath ${JSON.stringify(sessionWrite)}))`,
    "",
  ].join("\n");
  return {
    schemaVersion: 1,
    planType: "g5-l4-shell-rw002-hash-authorized-empty-projector-launch-plan",
    status: "authorization-verified-not-consumed-not-launched",
    diagnosticOnly: true,
    executionAvailable: false,
    targetAnimationId: "course-g05-l04-rw-002",
    language: "en",
    authorization: {
      ownerSignatureVerified: true,
      oneTimeUseRequired: true,
      consumed: false,
      sha256: "a".repeat(64),
    },
    executable,
    sandboxExecutable: "/usr/bin/sandbox-exec",
    arguments: ["-f", "/private/tmp/test-sandbox.sb", executable],
    launchBoundary: {
      projectorStartsEmpty: true,
      commandLineSwfArgumentUsed: false,
      shellOpenedByLauncher: false,
      directChildSwfOpenForbidden: true,
      humanFileOpenRequired: true,
      exactShellPath: "/private/tmp/host/HELP_COURSES/ELMGR5/L4/index_local.swf",
      exactShellSha256: G5_L4_TRACE_SCOPED_RESOURCES[0].sha256,
      flashRuntimeDependencyReadAllowlistComplete: false,
      runtimeRunnable: false,
    },
    observers: {
      forbiddenRequests: [...G5_L4_FORBIDDEN_RUNTIME_REQUESTS],
      exactPathBoundaryRequired: true,
      outsideHostRequestsForbidden: true,
      observerFailureIsStopCondition: true,
    },
    profileManifest: {
      sandbox: {
        policy,
        sha256: sha256Bytes(Buffer.from(policy)),
        defaultDeny: true,
        readAllowlist: [allowedRead],
        sessionOnlyWrites: [sessionWrite],
      },
      authorityState: {replayLockRoot},
    },
    executionGate: {
      livePreflightPassed: false,
      authorizationConsumed: false,
      projectorLaunched: false,
      runtimeSessionExecuted: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

test("G5 L4 launcher CLI requires an exact signed-authorization input set", () => {
  const containmentArguments = [
    "--approval-manifest", "/private/tmp/approval.json",
    "--approval-manifest-sha256", "a".repeat(64),
    "--live-no-egress-preflight", "/private/tmp/no-egress.json",
    "--live-no-egress-preflight-sha256", "b".repeat(64),
    "--live-capacity-preflight", "/private/tmp/capacity.json",
    "--live-capacity-preflight-sha256", "c".repeat(64),
    "--live-codesign-preflight", "/private/tmp/codesign.json",
    "--live-codesign-preflight-sha256", "d".repeat(64),
  ];
  assert.deepEqual(parseArguments([
    "--plan",
    "--language", "en",
    "--profile-manifest", "/private/tmp/profile.json",
    "--authorization", "/private/tmp/authorization.json",
    "--owner-public-key", "/private/tmp/owner.pem",
    "--owner-public-key-sha256", "f".repeat(64),
    ...containmentArguments,
  ]), {
    mode: "plan",
    language: "en",
    profileManifestPath: "/private/tmp/profile.json",
    authorizationPath: "/private/tmp/authorization.json",
    ownerPublicKeyPath: "/private/tmp/owner.pem",
    ownerPublicKeySha256: "f".repeat(64),
    approvalManifestPath: "/private/tmp/approval.json",
    approvalManifestSha256: "a".repeat(64),
    liveNoEgressPreflightPath: "/private/tmp/no-egress.json",
    liveNoEgressPreflightSha256: "b".repeat(64),
    liveCapacityPreflightPath: "/private/tmp/capacity.json",
    liveCapacityPreflightSha256: "c".repeat(64),
    liveCodesignPreflightPath: "/private/tmp/codesign.json",
    liveCodesignPreflightSha256: "d".repeat(64),
  });
  assert.throws(() => parseArguments([
    "--plan",
    "--language", "en",
    "--profile-manifest", "/private/tmp/profile.json",
    "--authorization", "/private/tmp/authorization.json",
    "--owner-public-key", "/private/tmp/owner.pem",
    "--owner-public-key-sha256", "f".repeat(64),
  ]), /all four physical containment receipts/u);
  assert.throws(() => parseArguments([
    "--launch",
    "--language", "en",
    "--profile-manifest", "/private/tmp/profile.json",
    "--authorization", "/private/tmp/authorization.json",
    "--owner-public-key", "/private/tmp/owner.pem",
    "--owner-public-key-sha256", "f".repeat(64),
    ...containmentArguments,
  ]), /deliberately unavailable/u);
});

test("launcher validation hard-closes unauthorized or direct-SWF plans", () => {
  const plan = fixturePlan();
  assert.equal(validateG5L4ProjectorLaunchPlan(plan), plan);
  const unauthorized = structuredClone(plan);
  unauthorized.authorization.ownerSignatureVerified = false;
  assert.throws(() => validateG5L4ProjectorLaunchPlan(unauthorized), /lacks verified/u);
  const direct = structuredClone(plan);
  direct.arguments.push("/private/tmp/L4RW02.swf");
  assert.throws(() => validateG5L4ProjectorLaunchPlan(direct), /empty sandboxed Projector/u);
});

test("diagnostic launcher cannot consume authorization or spawn Projector", async () => {
  await assert.rejects(
    launchG5L4Projector(fixturePlan()),
    (error) => error.code === "G5_L4_PROJECTOR_OBSERVER_SUPERVISOR_NOT_IMPLEMENTED"
      && /deliberately unavailable/u.test(error.message),
  );
});

test("Perl containment probe proves default-deny exact read, session-only write and network/host/tmp/replay denials", async () => {
  const plan = fixturePlan();
  const probePolicy = renderG5L4LiveNoEgressProbePolicy(plan);
  assert.match(probePolicy, /deny network\*/u);
  assert.match(probePolicy, /\/usr\/bin\/perl/u);
  assert.doesNotMatch(probePolicy, /allow process-exec.*Applications\/Test Flash Player/u);
  let calls = 0;
  const passed = await runG5L4LiveNoEgressProbe(plan, {
    runCommand: async (executable, args, options) => {
      calls += 1;
      assert.equal(executable, "/usr/bin/sandbox-exec");
      assert.equal(args[0], "-p");
      assert.equal(args[2], "/usr/bin/perl");
      assert.equal(args[3], "-MSocket");
      assert.equal(args[6], "--");
      assert.equal(options.env.LC_ALL, "C");
      assert.equal(options.env.HOME, plan.profileManifest.sandbox.sessionOnlyWrites[0]);
      return {
        exitCode: 0,
        stdout: "network_errno=1 allowed_read=1 evil_denied=1 session_write=1 global_tmp_denied=1 outside_host_denied=1 authority_write_denied=1\n",
        stderr: "",
      };
    },
  });
  assert.equal(calls, 1);
  assert.equal(passed.liveNoEgressVerified, true);
  assert.equal(passed.successfulConnectionsObserved, 0);
  assert.equal(passed.exactAllowedReadVerified, true);
  assert.equal(passed.suffixedAllowlistEscapeDenied, true);
  assert.equal(passed.sessionWriteVerified, true);
  assert.equal(passed.globalTemporaryWriteDenied, true);
  assert.equal(passed.arbitraryHostReadDenied, true);
  assert.equal(passed.replayAuthorityWriteDenied, true);
  await assert.rejects(runG5L4LiveNoEgressProbe(plan, {
    runCommand: async () => ({
      exitCode: 17,
      stdout: "network_errno=61 allowed_read=1 evil_denied=1 session_write=1 global_tmp_denied=0 outside_host_denied=1 authority_write_denied=1\n",
      stderr: "",
    }),
  }), /did not prove/u);
});

test("Darwin kernel enforces the derived Perl containment probe", {
  skip: process.platform !== "darwin",
}, async () => {
  const root = await mkdtemp("/private/tmp/g5-l4-kernel-containment-");
  try {
    const hostTreeRoot = path.join(root, "host");
    const sessionRoot = path.join(root, "session");
    const sessionWrite = path.join(sessionRoot, "runtime-profile/home");
    const replayLockRoot = path.join(root, "authority/replay-locks");
    await mkdir(hostTreeRoot, {recursive: true, mode: 0o700});
    await mkdir(sessionWrite, {recursive: true, mode: 0o700});
    await mkdir(replayLockRoot, {recursive: true, mode: 0o700});
    const allowedRead = path.join(hostTreeRoot, "allowed.dat");
    await writeFile(allowedRead, "allowed", {mode: 0o400});
    await writeFile(`${allowedRead}.evil`, "existing-unallowlisted-canary", {mode: 0o400});

    const plan = fixturePlan();
    const policy = renderG5L4SandboxProfile({
      projectorExecutable: plan.executable,
      hostTreeRoot,
      sessionRoot,
      replayLockRoot,
      allowedPaths: ["allowed.dat"],
      currentHome: "/Users/nonexistent-g5-l4-kernel-probe",
    });
    plan.profileManifest.sandbox = {
      policy,
      sha256: sha256Bytes(Buffer.from(policy)),
      defaultDeny: true,
      readAllowlist: [allowedRead],
      sessionOnlyWrites: [sessionWrite],
    };
    plan.profileManifest.authorityState = {replayLockRoot};
    plan.launchBoundary.exactShellPath = path.join(
      hostTreeRoot,
      "HELP_COURSES/ELMGR5/L4/index_local.swf",
    );

    const receipt = await runG5L4LiveNoEgressProbe(plan);
    assert.equal(receipt.liveNoEgressVerified, true);
    assert.equal(receipt.exactAllowedReadVerified, true);
    assert.equal(receipt.sessionWriteVerified, true);
    assert.equal(receipt.globalTemporaryWriteDenied, true);
    assert.equal(receipt.arbitraryHostReadDenied, true);
    assert.equal(receipt.replayAuthorityWriteDenied, true);
  } finally {
    await rm(root, {recursive: true, force: false});
  }
});

test("process and resource observers classify protected PIDs and missing XML requests", () => {
  const executable = "/Applications/Test Flash Player";
  assert.deepEqual(parseProjectorProcessTable([
    ` 35572 1 ${executable}`,
    " 91234 1 /usr/bin/other",
  ].join("\n"), executable), [{pid: 35572, command: executable}]);
  const hostTreeRoot = "/private/tmp/g5-host";
  const audit = classifyG5L4ResourceAudit([
    `open ${hostTreeRoot}/${G5_L4_TRACE_SCOPED_RESOURCES[0].path}`,
    `open ${hostTreeRoot}/${G5_L4_TRACE_SCOPED_RESOURCES[0].path}.evil`,
    `open ${hostTreeRoot}/${G5_L4_FORBIDDEN_RUNTIME_REQUESTS[0]}`,
    `open ${hostTreeRoot}/unexpected.dat`,
    "open /etc/hosts",
  ].join("\n"), {
    hostTreeRoot,
    allowedPaths: G5_L4_TRACE_SCOPED_RESOURCES.map(({path}) => path),
  });
  assert.equal(audit.forbiddenRequestCount, 1);
  assert.equal(audit.unallowlistedRequestCount, 3);
  assert.equal(audit.outsideHostRequestCount, 1);
  assert.deepEqual(audit.outsideHost, ["open /etc/hosts"]);
  assert.equal(audit.passed, false);
});

test("launcher full host-tree binding rehashes all seven exact resources before use", async () => {
  const declaredRoot = await mkdtemp(path.join(os.tmpdir(), "g5-l4-launch-host-rehash-"));
  const root = await realpath(declaredRoot);
  const hostTreeRoot = path.join(root, "host-tree");
  try {
    await materializeG5L4HostTree({outputRoot: hostTreeRoot});
    const projectorPath = path.join(root, "mock-projector");
    const projectorBytes = Buffer.from("mock-projector-for-host-rehash");
    await writeFile(projectorPath, projectorBytes, {mode: 0o500});
    await chmod(projectorPath, 0o500);
    const prepared = await prepareG5L4DisposableProfile({
      language: "en",
      sessionId: "g5-l4-shell-rw002-en-123e4567-e89b-12d3-a456-426614174001",
      sessionRoot: path.join(root, "session"),
      hostTreeRoot,
      projectorExecutable: projectorPath,
      expectedProjectorSha256: sha256Bytes(projectorBytes),
      currentHome: path.join(root, "outside-home"),
    });
    const profileManifest = JSON.parse(await readFile(prepared.manifestPath, "utf8"));
    const hostManifestPath = path.join(hostTreeRoot, G5_L4_HOST_TREE_MANIFEST_NAME);
    const hostManifestSha256 = sha256Bytes(await readFile(hostManifestPath));
    const verified = await verifyG5L4FullHostTreeBinding({profileManifest, expectedManifestSha256: hostManifestSha256});
    assert.equal(verified.verified.files, 7);

    const changedResource = path.join(hostTreeRoot, G5_L4_TRACE_SCOPED_RESOURCES[1].path);
    await chmod(changedResource, 0o600);
    await writeFile(changedResource, "tampered runtime resource");
    await chmod(changedResource, 0o444);
    await assert.rejects(
      verifyG5L4FullHostTreeBinding({profileManifest, expectedManifestSha256: hostManifestSha256}),
      /host-tree files are not 0444|staged bytes drifted|pinned host resource bytes drifted/u,
    );
  } finally {
    await unlockTree(root);
    await rm(root, {recursive: true, force: true});
  }
});
