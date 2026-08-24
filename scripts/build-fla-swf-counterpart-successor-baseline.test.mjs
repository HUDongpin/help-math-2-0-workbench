import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  lstat,
  link,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  BASELINE_ARTIFACT_TYPE,
  BASELINE_COMMANDS,
  BASELINE_COMPLETION_RELATIVE_PATH,
  BASELINE_GIT_EXECUTABLE_PATH,
  BASELINE_MANDATORY_SCOPE_PATHS,
  BASELINE_NODE_EXECUTABLE_PATH,
  BASELINE_NPM_CLI_PATH,
  BASELINE_NPM_FIXED_ARGS,
  BASELINE_POST_CAPTURE_EXCLUSIONS,
  BASELINE_RECEIPT_RELATIVE_PATH,
  BASELINE_SCHEMA,
  assertCommandSummaryMatchesPhysicalLogs,
  assertTrustedBaselineScopePathsCurrent,
  baselineAttemptIdentifier,
  captureImplementationBaseline,
  captureScopedOwnershipSnapshot,
  commandOutputSummary,
  filesystemEvidence,
  readImmutableArtifactBytesNoFollow,
  scopedRecordsDigest,
  successorArtifactPaths,
  toolEvidence,
  trustedCommandEnvironment,
  validateBaselineCompletionValue,
  validateImplementationBaselineReceiptValue,
} from "./build-fla-swf-counterpart-successor-baseline.mjs";

const execFile = promisify(execFileCallback);

function artifact(path, seed) {
  return {path, bytes: seed, sha256: String(seed % 10).repeat(64)};
}

function executableIdentity(executablePath, seed) {
  return {
    path: executablePath,
    realPath: executablePath,
    bytes: seed,
    sha256: String(seed % 10).repeat(64),
  };
}

function fixtureReceipt() {
  const attemptRoot = "work/fla-swf-counterpart-successor-review/implementation-baseline-attempts/20260807T000000000Z-aaaaaaaaaaaa";
  const emptySummary = commandOutputSummary(Buffer.alloc(0), Buffer.alloc(0));
  const commands = BASELINE_COMMANDS.map((specification, index) => ({
    id: specification.id,
    commandText: specification.commandText,
    actualExecutable: specification.executable,
    arguments: [...specification.args],
    gateClass: specification.gateClass,
    startedAt: `2026-08-07T00:0${index}:00.000Z`,
    completedAt: `2026-08-07T00:0${index}:01.000Z`,
    exitCode: specification.gateClass === "required-targeted" ? 0 : 1,
    signal: null,
    timedOut: false,
    stdout: artifact(`${attemptRoot}/${String(index + 1).padStart(2, "0")}-${specification.id}.stdout.log`, index + 1),
    stderr: artifact(`${attemptRoot}/${String(index + 1).padStart(2, "0")}-${specification.id}.stderr.log`, index + 11),
    summary: structuredClone(emptySummary),
  }));
  const capturedPromotionArtifacts = [
    "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-universe.json",
    "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v1-invalidated.json",
    "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v1-invalidation-correction-v2.json",
    "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-universe.json",
  ].sort();
  const scopePaths = [...new Set([
    ...BASELINE_MANDATORY_SCOPE_PATHS,
    ...capturedPromotionArtifacts,
  ])].sort();
  const scopedRecords = scopePaths.map((relativePath, index) => ({
    path: relativePath,
    bytes: index,
    sha256: String(index % 10).repeat(64),
    dev: "7",
    ino: String(100 + index),
    mode: 0o444,
    nlink: 1,
    mtimeNs: String(1_000_000 + index),
  }));
  const gitPayload = {status: "", staged: "", worktree: "", untracked: ""};
  const git = {
    ...gitPayload,
    identitySha256: createHash("sha256").update(
      `${JSON.stringify(gitPayload, null, 2)}\n`,
    ).digest("hex"),
  };
  const scopedSnapshot = {
    records: scopedRecords,
    identitySha256: scopedRecordsDigest(scopedRecords),
    git,
  };
  return {
    schemaVersion: BASELINE_SCHEMA,
    artifactType: BASELINE_ARTIFACT_TYPE,
    status: "frozen-implementation-final-pre-promotion-baseline",
    capturedAt: "2026-08-07T00:00:00.000Z",
    completedAt: "2026-08-07T00:10:00.000Z",
    timing: {
      classification: "implementation-final-pre-promotion",
      preCodeMutationArtifact: false,
      preSourceOrCatalogPromotion: true,
      caveat: "fixture",
    },
    checkout: {
      projectRoot: "/Volumes/WestWorld/HELP MATH 2.0",
      branch: "codex/test",
      head: "a".repeat(40),
    },
    filesystem: {
      before: {
        volume: {
          deviceNode: "/dev/disk7s1",
          volumeName: "WestWorld",
          fileSystemPersonality: "APFS",
          bundleType: "apfs",
          containerFreeSpace: "800 GB",
        },
        freeSpace: {
          filesystem: "/dev/disk7s1",
          blocks1024: 1_000_000,
          used1024: 200_000,
          available1024: 700_000,
          capacity: "23%",
          mountedOn: "/Volumes/WestWorld",
        },
      },
      after: {
        volume: {
          deviceNode: "/dev/disk7s1",
          volumeName: "WestWorld",
          fileSystemPersonality: "APFS",
          bundleType: "apfs",
          containerFreeSpace: "799 GB",
        },
        freeSpace: {
          filesystem: "/dev/disk7s1",
          blocks1024: 1_000_000,
          used1024: 201_000,
          available1024: 699_000,
          capacity: "23%",
          mountedOn: "/Volumes/WestWorld",
        },
      },
    },
    tools: {
      node: "v24.18.0",
      nodeExecutable: executableIdentity(BASELINE_NODE_EXECUTABLE_PATH, 101),
      npm: "11.16.0",
      npmCli: executableIdentity(BASELINE_NPM_CLI_PATH, 102),
      git: "git version 2.50.1",
      gitExecutable: executableIdentity(BASELINE_GIT_EXECUTABLE_PATH, 103),
      commandEnvironment: trustedCommandEnvironment(),
      npmProjectConfiguration: {path: ".npmrc", status: "absent"},
      macOSProductVersion: "26.5.2",
      macOSBuildVersion: "25F90",
      clangPath: "/usr/bin/clang",
      clangVersion: "Apple clang version 17.0.0",
      macosSdkPath: "/Applications/Xcode.app/SDKs/MacOSX.sdk",
      python: "Python 3.13.5",
      ffmpeg: null,
      ffprobe: null,
      adobeAnimate2021: "21.0.12",
    },
    scopedOwnership: {
      definition:
        "mandatory successor scripts/tests and package/README boundaries; current profile, 17 generated catalog outputs, source-manifest and source-freeze; plus the exact pre-existing immutable successor artifacts captured before this baseline. The receipt is usable only with its post-scan immutable completion marker. Later trusted-registry, signed-ledger, plan, prepared, applied, and no-copy artifacts are self-referential exclusions validated by their own contracts.",
      mandatoryPaths: [...BASELINE_MANDATORY_SCOPE_PATHS],
      capturedPromotionArtifacts,
      postBaselineExclusions: [...BASELINE_POST_CAPTURE_EXCLUSIONS],
      stable: true,
      before: structuredClone(scopedSnapshot),
      after: structuredClone(scopedSnapshot),
    },
    commands,
    evidenceArtifacts: commands.flatMap((command) => [command.stdout, command.stderr]),
    summary: {
      requiredTargetedGatesPassed: true,
      separatelyReportedRepositoryCommands: commands
        .filter((command) => command.gateClass === "separately-reported-repository")
        .map(({id, exitCode, summary}) => ({id, exitCode, summary})),
      sourceOrCatalogMutationPerformed: false,
      failedAttemptLogsRetention: "retained; this builder never deletes baseline attempts",
    },
    reportingGate: {
      canonicalCountsReportable: false,
      promotionAuthorized: false,
      statement: "fixture cannot authorize promotion",
    },
    evidenceBoundary: {
      sourceCustodyOnly: true,
      pairReviewCompleted: false,
      javascriptImplementation: false,
      originalRuntimeFidelity: false,
      audioAcceptance: false,
      humanVisualApproval: false,
      ownerAcceptance: false,
      strictCompletion: false,
      lessonRelease: false,
      publication: false,
    },
  };
}

async function materializeInterruptedBaselineFixture() {
  const fixtureParent = path.join(process.cwd(), "work");
  await mkdir(fixtureParent, {recursive: true});
  const root = await realpath(await mkdtemp(path.join(
    fixtureParent,
    "counterpart-baseline-resume-test-",
  )));
  const receipt = fixtureReceipt();
  const scopePaths = [...new Set([
    ...BASELINE_MANDATORY_SCOPE_PATHS,
    ...receipt.scopedOwnership.capturedPromotionArtifacts,
  ])].sort();
  for (const relativePath of scopePaths) {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), {recursive: true});
    await writeFile(absolutePath, `fixture:${relativePath}\n`, "utf8");
    if (receipt.scopedOwnership.capturedPromotionArtifacts.includes(relativePath)) {
      await chmod(absolutePath, 0o444);
    }
  }
  const gitEnvironment = {
    PATH: "/usr/bin:/bin",
    LANG: "C",
    LC_ALL: "C",
    GIT_AUTHOR_NAME: "Baseline Fixture",
    GIT_AUTHOR_EMAIL: "baseline-fixture@example.invalid",
    GIT_COMMITTER_NAME: "Baseline Fixture",
    GIT_COMMITTER_EMAIL: "baseline-fixture@example.invalid",
  };
  await execFile("/usr/bin/git", ["init", "-b", "codex/test"], {
    cwd: root,
    env: gitEnvironment,
  });
  await execFile("/usr/bin/git", ["add", "--", ...scopePaths], {
    cwd: root,
    env: gitEnvironment,
  });
  await execFile("/usr/bin/git", ["commit", "-m", "baseline fixture"], {
    cwd: root,
    env: gitEnvironment,
  });
  const head = (await execFile("/usr/bin/git", ["rev-parse", "HEAD"], {
    cwd: root,
    env: gitEnvironment,
  })).stdout.trim();

  const emptyLog = Buffer.alloc(0);
  const emptyLogSha256 = createHash("sha256").update(emptyLog).digest("hex");
  for (const command of receipt.commands) {
    for (const stream of [command.stdout, command.stderr]) {
      const absolutePath = path.join(root, stream.path);
      await mkdir(path.dirname(absolutePath), {recursive: true});
      await writeFile(absolutePath, emptyLog, {flag: "wx", mode: 0o444});
      await chmod(absolutePath, 0o444);
      stream.bytes = 0;
      stream.sha256 = emptyLogSha256;
    }
    command.summary = commandOutputSummary(emptyLog, emptyLog);
  }
  receipt.evidenceArtifacts = receipt.commands.flatMap((command) => [
    command.stdout,
    command.stderr,
  ]);
  receipt.summary.separatelyReportedRepositoryCommands = receipt.commands
    .filter((command) => command.gateClass === "separately-reported-repository")
    .map(({id, exitCode, summary}) => ({id, exitCode, summary}));
  receipt.checkout = {projectRoot: root, branch: "codex/test", head};
  const [filesystem, tools, scoped] = await Promise.all([
    filesystemEvidence(root),
    toolEvidence(root),
    captureScopedOwnershipSnapshot(root, {paths: scopePaths}),
  ]);
  receipt.filesystem = {before: structuredClone(filesystem), after: filesystem};
  receipt.tools = tools;
  receipt.scopedOwnership.before = structuredClone(scoped);
  receipt.scopedOwnership.after = scoped;
  validateImplementationBaselineReceiptValue(receipt);
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const receiptPath = path.join(root, BASELINE_RECEIPT_RELATIVE_PATH);
  await writeFile(receiptPath, receiptBytes, {flag: "wx", mode: 0o444});
  await chmod(receiptPath, 0o444);
  return {root, receipt, receiptBytes};
}

test("baseline receipt requires all fixed commands while permitting separately reported failures", () => {
  const receipt = fixtureReceipt();
  assert.equal(validateImplementationBaselineReceiptValue(receipt), receipt);
  assert.equal(receipt.commands.find(({id}) => id === "verify-workbench").exitCode, 1);
  assert.equal(receipt.commands.find(({id}) => id === "full-repository-tests").exitCode, 1);
});

test("baseline attempt identifiers contain exactly twelve lowercase hexadecimal UUID characters", () => {
  assert.equal(
    baselineAttemptIdentifier(
      "2026-08-07T20:39:08.681Z",
      "3e4833a9-67bd-4abc-8123-abcdef012345",
    ),
    "20260807T203908681Z-3e4833a967bd",
  );
  assert.throws(
    () => baselineAttemptIdentifier(
      "2026-08-07T20:39:08.681Z",
      "not-a-uuid",
    ),
    /not canonical hexadecimal UUID material/u,
  );
});

test("baseline completion marker is exact-key and binds the immutable receipt", () => {
  const marker = {
    schemaVersion:
      "help-math-fla-swf-counterpart-successor-implementation-baseline-completion/v1",
    artifactType:
      "help-math-fla-swf-counterpart-successor-implementation-baseline-completion",
    status: "baseline-post-publication-scan-complete",
    completedAt: "2026-08-07T00:11:00.000Z",
    receipt: {
      path: "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json",
      bytes: 12,
      sha256: "a".repeat(64),
    },
    capturedPromotionArtifactsSha256: "b".repeat(64),
  };
  assert.equal(validateBaselineCompletionValue(marker), marker);
  assert.equal(BASELINE_POST_CAPTURE_EXCLUSIONS.includes(
    BASELINE_COMPLETION_RELATIVE_PATH,
  ), true);
  const tampered = structuredClone(marker);
  tampered.unreviewed = true;
  assert.throws(() => validateBaselineCompletionValue(tampered), /keys changed/u);
});

test("baseline capture resumes a receipt-only crash and an exact nlink-2 completion", async () => {
  const fixture = await materializeInterruptedBaselineFixture();
  try {
    const receiptSha256 = createHash("sha256").update(fixture.receiptBytes).digest("hex");
    const resumed = await captureImplementationBaseline({root: fixture.root});
    assert.equal(resumed.status,
      "implementation-final-pre-promotion-baseline-resumed-and-frozen");
    assert.deepEqual(resumed.receipt, {
      path: BASELINE_RECEIPT_RELATIVE_PATH,
      bytes: fixture.receiptBytes.length,
      sha256: receiptSha256,
    });
    const completionPath = path.join(fixture.root, BASELINE_COMPLETION_RELATIVE_PATH);
    const preparingAlias = path.join(
      path.dirname(completionPath),
      `.${path.basename(completionPath)}.fixture.preparing`,
    );
    await link(completionPath, preparingAlias);
    assert.equal(Number((await lstat(completionPath, {bigint: true})).nlink), 2);
    const reconciled = await captureImplementationBaseline({root: fixture.root});
    assert.equal(reconciled.status,
      "implementation-final-pre-promotion-baseline-resumed-and-frozen");
    assert.equal(Number((await lstat(completionPath, {bigint: true})).nlink), 1);
    await assert.rejects(lstat(preparingAlias), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("baseline receipt rejects a required gate failure and output-closure tamper", () => {
  const gateFailure = fixtureReceipt();
  gateFailure.commands.find(({id}) => id === "verify-sources").exitCode = 1;
  assert.throws(
    () => validateImplementationBaselineReceiptValue(gateFailure),
    /Required targeted baseline command failed/,
  );

  const outputTamper = fixtureReceipt();
  outputTamper.evidenceArtifacts[0] = artifact("work/baseline/replaced.log", 99);
  assert.throws(
    () => validateImplementationBaselineReceiptValue(outputTamper),
    /output-artifact closure changed/,
  );
});

test("baseline receipt rejects missing tools/free-space, executable drift, and a self-declared scope", () => {
  const missingTools = fixtureReceipt();
  delete missingTools.tools;
  assert.throws(
    () => validateImplementationBaselineReceiptValue(missingTools),
    /keys changed/u,
  );

  const missingFreeSpace = fixtureReceipt();
  delete missingFreeSpace.filesystem.after.freeSpace;
  assert.throws(
    () => validateImplementationBaselineReceiptValue(missingFreeSpace),
    /filesystem\.after keys changed/u,
  );

  const executableDrift = fixtureReceipt();
  executableDrift.commands[0].actualExecutable = "/bin/false";
  executableDrift.commands[0].arguments = ["--never-executed"];
  assert.throws(
    () => validateImplementationBaselineReceiptValue(executableDrift),
    /command\[0\] contract changed/u,
  );

  const arbitraryScope = fixtureReceipt();
  arbitraryScope.scopedOwnership.mandatoryPaths = ["scope/forged.txt"];
  assert.throws(
    () => validateImplementationBaselineReceiptValue(arbitraryScope),
    /scope definition changed/u,
  );
  assert.throws(
    () => assertTrustedBaselineScopePathsCurrent(
      ["scope/forged.txt"],
      [...BASELINE_MANDATORY_SCOPE_PATHS],
    ),
    /trusted mandatory\/dynamic scope contract/u,
  );
});

test("baseline command summary must be recomputed from physical stdout/stderr bytes", () => {
  const stdout = Buffer.from("ℹ tests 12\nℹ pass 12\nℹ fail 0\n", "utf8");
  const stderr = Buffer.alloc(0);
  const exact = commandOutputSummary(stdout, stderr);
  assert.equal(assertCommandSummaryMatchesPhysicalLogs(
    exact, stdout, stderr, "fixture command",
  ), true);
  const forged = structuredClone(exact);
  forged.nodeTestSummary.pass = 999;
  assert.throws(
    () => assertCommandSummaryMatchesPhysicalLogs(
      forged, stdout, stderr, "fixture command",
    ),
    /differs from physical logs/u,
  );
});

test("baseline capture rejects injectable runners and every command uses an absolute executable", async () => {
  let invoked = false;
  await assert.rejects(
    captureImplementationBaseline({
      runCommand: async () => {
        invoked = true;
        return null;
      },
    }),
    /capture options are unsupported/u,
  );
  assert.equal(invoked, false);
  for (const command of BASELINE_COMMANDS) {
    assert.equal(path.isAbsolute(command.executable), true);
    if (command.commandText.startsWith("npm ")) {
      assert.equal(command.executable, BASELINE_NODE_EXECUTABLE_PATH);
      assert.equal(command.args[0], BASELINE_NPM_CLI_PATH);
    }
  }
});

test("tool evidence ignores a PATH-shadowed npm and binds executable bytes", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "counterpart-baseline-tools-"));
  const originalPath = process.env.PATH;
  try {
    const forgedNpm = path.join(temporaryRoot, "npm");
    await writeFile(forgedNpm, "#!/bin/sh\necho 0.0.0-forged\n", {mode: 0o755});
    await chmod(forgedNpm, 0o755);
    process.env.PATH = `${temporaryRoot}${path.delimiter}${originalPath ?? ""}`;
    const tools = await toolEvidence(process.cwd());
    assert.notEqual(tools.npm, "0.0.0-forged");
    assert.equal(tools.nodeExecutable.path, BASELINE_NODE_EXECUTABLE_PATH);
    assert.equal(tools.npmCli.path, BASELINE_NPM_CLI_PATH);
    assert.equal(tools.gitExecutable.path, BASELINE_GIT_EXECUTABLE_PATH);
    assert.equal(tools.nodeExecutable.sha256,
      createHash("sha256").update(await readFile(BASELINE_NODE_EXECUTABLE_PATH)).digest("hex"));
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline npm gates ignore an ambient forged script shell and user configuration", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-npm-shell-"),
  ));
  const forgedMarker = path.join(temporaryRoot, "forged-shell-ran");
  const forgedShell = path.join(temporaryRoot, "forged-shell.sh");
  const ambientBefore = {
    lower: process.env.npm_config_script_shell,
    upper: process.env.NPM_CONFIG_SCRIPT_SHELL,
    gitDir: process.env.GIT_DIR,
  };
  try {
    await writeFile(forgedShell, `#!/bin/sh\ntouch '${forgedMarker}'\nexit 0\n`, {mode: 0o755});
    await chmod(forgedShell, 0o755);
    await writeFile(path.join(temporaryRoot, "package.json"), `${JSON.stringify({
      private: true,
      scripts: {probe: "node -e \"process.stdout.write('real-shell')\""},
    }, null, 2)}\n`, "utf8");
    process.env.npm_config_script_shell = forgedShell;
    process.env.NPM_CONFIG_SCRIPT_SHELL = forgedShell;
    process.env.GIT_DIR = path.join(temporaryRoot, "forged-git-dir");
    const result = await execFile(
      BASELINE_NODE_EXECUTABLE_PATH,
      [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "run", "probe"],
      {
        cwd: temporaryRoot,
        env: trustedCommandEnvironment(),
        encoding: "utf8",
      },
    );
    assert.match(result.stdout, /real-shell/u);
    await assert.rejects(lstat(forgedMarker), {code: "ENOENT"});
    assert.deepEqual(Object.keys(trustedCommandEnvironment()).sort(), [
      "LANG", "LC_ALL", "PATH", "TMPDIR",
    ]);

    const nodeOptionsMarker = path.join(temporaryRoot, "forged-node-options-ran");
    const injectedModule = path.join(temporaryRoot, "injected.cjs");
    await writeFile(injectedModule, [
      "require('node:fs').writeFileSync(",
      `  ${JSON.stringify(nodeOptionsMarker)},`,
      "  'ambient project npm config executed',",
      ");",
      "",
    ].join("\n"), "utf8");
    await writeFile(path.join(temporaryRoot, ".npmrc"),
      `node-options=--require=${injectedModule}\n`, "utf8");
    await execFile(
      BASELINE_NODE_EXECUTABLE_PATH,
      [BASELINE_NPM_CLI_PATH, ...BASELINE_NPM_FIXED_ARGS, "run", "probe"],
      {
        cwd: temporaryRoot,
        env: trustedCommandEnvironment(),
        encoding: "utf8",
      },
    );
    await assert.rejects(lstat(nodeOptionsMarker), {code: "ENOENT"});
    await assert.rejects(
      toolEvidence(temporaryRoot),
      /project-root \.npmrc to be absent/u,
    );
  } finally {
    for (const [key, value] of [
      ["npm_config_script_shell", ambientBefore.lower],
      ["NPM_CONFIG_SCRIPT_SHELL", ambientBefore.upper],
      ["GIT_DIR", ambientBefore.gitDir],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline successor artifact scan rejects a prefixed symlink", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-artifact-"),
  ));
  try {
    const directory = path.join(temporaryRoot, "catalog/source-promotions");
    await mkdir(directory, {recursive: true});
    const target = path.join(temporaryRoot, "target.json");
    await writeFile(target, "{}\n", "utf8");
    await symlink(
      target,
      path.join(directory, "fla-swf-counterpart-successor-2026-08-07-forged.json"),
    );
    await assert.rejects(
      successorArtifactPaths(temporaryRoot),
      /not a real regular file/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline capture rejects future plan/applied artifacts while currentness may exclude real files", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-future-"),
  ));
  try {
    const directory = path.join(temporaryRoot, "catalog/source-promotions");
    await mkdir(directory, {recursive: true});
    const appliedPath = path.join(
      directory,
      "fla-swf-counterpart-successor-2026-08-07-v2-applied.json",
    );
    await writeFile(appliedPath, "{}\n", "utf8");
    await assert.rejects(
      successorArtifactPaths(temporaryRoot),
      /forbidden in this baseline phase/u,
    );
    assert.deepEqual(
      await successorArtifactPaths(temporaryRoot, {
        allowedPostBaselineExactPaths: [
          "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-applied.json",
        ],
      }),
      [],
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline phase exclusions allow only the immutable receipt immediately after publication", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-phase-"),
  ));
  try {
    const directory = path.join(temporaryRoot, "catalog/source-promotions");
    await mkdir(directory, {recursive: true});
    const receipt = path.join(
      directory,
      "fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json",
    );
    const applied = path.join(
      directory,
      "fla-swf-counterpart-successor-2026-08-07-v2-applied.json",
    );
    await writeFile(receipt, "{}\n", "utf8");
    assert.deepEqual(await successorArtifactPaths(temporaryRoot, {
      allowedPostBaselineExactPaths: [
        "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json",
      ],
    }), []);
    await writeFile(applied, "{}\n", "utf8");
    await assert.rejects(
      successorArtifactPaths(temporaryRoot, {
        allowedPostBaselineExactPaths: [
          "catalog/source-promotions/fla-swf-counterpart-successor-2026-08-07-v2-implementation-baseline.json",
        ],
      }),
      /forbidden in this baseline phase/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline scope and immutable logs reject symbolic-link ancestors", async () => {
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-ancestor-"),
  ));
  try {
    const realScope = path.join(temporaryRoot, "real-scope");
    await mkdir(realScope);
    await writeFile(path.join(realScope, "file.mjs"), "safe\n", "utf8");
    await symlink(realScope, path.join(temporaryRoot, "scope"));
    await assert.rejects(
      captureScopedOwnershipSnapshot(temporaryRoot, {paths: ["scope/file.mjs"]}),
      /traverses a symbolic link/u,
    );

    const realAttempt = path.join(temporaryRoot, "real-attempt");
    await mkdir(realAttempt);
    const logBytes = Buffer.from("log\n", "utf8");
    await writeFile(path.join(realAttempt, "stdout.log"), logBytes, {mode: 0o444});
    await chmod(path.join(realAttempt, "stdout.log"), 0o444);
    await symlink(realAttempt, path.join(temporaryRoot, "attempt"));
    await assert.rejects(
      readImmutableArtifactBytesNoFollow(temporaryRoot, {
        path: "attempt/stdout.log",
        bytes: logBytes.length,
        sha256: createHash("sha256").update(logBytes).digest("hex"),
      }, "fixture attempt log"),
      /traverses a symbolic link/u,
    );
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test("baseline successor scans reject a caller-supplied symbolic-link root", async () => {
  const parent = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "counterpart-baseline-root-alias-"),
  ));
  try {
    const realRoot = path.join(parent, "real-root");
    await mkdir(path.join(realRoot, "catalog/source-promotions"), {recursive: true});
    const aliasRoot = path.join(parent, "alias-root");
    await symlink(realRoot, aliasRoot);
    await assert.rejects(
      successorArtifactPaths(aliasRoot),
      /root is not a real directory|root resolves through a symbolic-link alias/u,
    );
  } finally {
    await rm(parent, {recursive: true, force: true});
  }
});

test("baseline output summary retains final node-test counts and known ambient markers", () => {
  const summary = commandOutputSummary(Buffer.from([
    "ℹ tests 11",
    "ℹ pass 11",
    "ℹ fail 0",
    "completion ledger catalog/completion-ledger.json is stale",
    "/Volumes/WestWorld/HELP_OnlineKeyTerms_XML is unavailable",
    "trace specification is out of date",
    "ℹ tests 4392",
    "ℹ pass 3815",
    "ℹ fail 570",
    "ℹ skipped 7",
  ].join("\n")), Buffer.alloc(0));
  assert.deepEqual(summary.nodeTestSummary, {
    tests: 4392,
    pass: 3815,
    fail: 570,
    skipped: 7,
  });
  assert.deepEqual(summary.markers, {
    staleCompletionLedger: true,
    missingExternalOnlineKeyTermsXml: true,
    staleTraceSpecification: true,
  });
});
