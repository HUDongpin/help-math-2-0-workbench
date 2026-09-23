import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";

import {
  READINESS_JSON,
  READINESS_MARKDOWN,
  SESSION_KIT_ROOT,
  buildSessionKitPlan,
  materializeSessionKitTreeForTesting,
  parseArguments,
  prepareSessionKits,
  replaceSessionKitReportPairForTesting,
  renderSessionKitReadinessMarkdown,
  validateSessionKitManifest,
  validateSessionKitReadiness,
} from "./prepare-g5-l4-shell-rw002-original-runtime-session-kits.mjs";

let planPromise;
function plan() {
  planPromise ||= buildSessionKitPlan();
  return planPromise;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256")
    .update(`${JSON.stringify(stable(value), null, 2)}\n`)
    .digest("hex");
}

function resignManifest(manifest) {
  const unsigned = structuredClone(manifest);
  delete unsigned.manifestFingerprintSha256;
  return {
    ...unsigned,
    manifestFingerprintSha256: fingerprint(unsigned),
  };
}

function resignReadiness(report) {
  const unsigned = structuredClone(report);
  delete unsigned.reportFingerprintSha256;
  return {
    ...unsigned,
    reportFingerprintSha256: fingerprint(unsigned),
  };
}

async function makeTreeWritable(target) {
  const metadata = await lstat(target).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (metadata === null || metadata.isSymbolicLink()) return;
  if (!metadata.isDirectory()) return;
  await chmod(target, 0o700);
  for (const name of await readdir(target)) {
    await makeTreeWritable(path.join(target, name));
  }
}

async function withTemporaryRoot(run) {
  const root = await mkdtemp(
    path.join(tmpdir(), "g5-l4-session-kit-test-"),
  );
  await Promise.all([
    mkdir(path.join(root, "work")),
    mkdir(path.join(root, "reports")),
  ]);
  try {
    return await run(root);
  } finally {
    await makeTreeWritable(root);
    await rm(root, {recursive: true, force: true});
  }
}

async function rewriteReadOnlyJson(file, mutate) {
  const directory = path.dirname(file);
  await chmod(directory, 0o700);
  await chmod(file, 0o600);
  const current = JSON.parse(await readFile(file, "utf8"));
  const next = mutate(current) ?? current;
  await writeFile(
    file,
    `${JSON.stringify(stable(next), null, 2)}\n`,
    {encoding: "utf8", flag: "w"},
  );
  await chmod(file, 0o444);
  await chmod(directory, 0o555);
}

async function replaceKitFileWithLink(root, kind) {
  const directory = path.join(root, SESSION_KIT_ROOT, "en");
  const target = path.join(directory, "OPERATOR_CARD.md");
  const outside = path.join(root, `${kind}-target.txt`);
  await writeFile(outside, await readFile(target), {flag: "wx", mode: 0o444});
  await chmod(directory, 0o700);
  await unlink(target);
  if (kind === "symlink") await symlink(outside, target);
  else await link(outside, target);
  await chmod(directory, 0o555);
  return {outside, target};
}

async function assertNoTransactionResidue(directory) {
  const names = await readdir(directory);
  assert.ok(
    names.every((name) => !name.endsWith(".tmp") && !name.endsWith(".bak")),
    `unexpected transaction debris: ${names.join(", ")}`,
  );
}

test("builds distinct EN and ES unsigned non-runnable session kits with machine candidates only", async () => {
  const built = await plan();
  assert.deepEqual(built.kits.map(({language}) => language), ["en", "es"]);
  assert.equal(new Set(built.kits.map((kit) =>
    kit.manifest.sessionIdentity.sessionSlotId)).size, 2);
  for (const kit of built.kits) {
    const manifest = await validateSessionKitManifest(
      kit.manifest,
      kit.language,
    );
    assert.equal(manifest.status, "unsigned-empty-non-runnable");
    assert.equal(manifest.sessionIdentity.sessionId, null);
    assert.equal(manifest.sessionIdentity.immutableAuthorizationSha256, null);
    assert.equal(manifest.isolation.exactHostIdentifier, null);
    assert.equal(manifest.isolation.disposableProfileRoot, null);
    assert.ok(Object.values(manifest.executionGate).every((value) => value === false));
    assert.ok(Object.values(manifest.acceptanceEffects).every((value) => value === false));
  }
  assert.equal(built.report.summary.machineSelectedContainmentCandidates, 8);
  assert.equal(
    built.report.summary.containmentCandidateImplementationsPresent,
    8,
  );
  assert.equal(
    built.report.summary.containmentOfflineOrDiagnosticVerified,
    8,
  );
  assert.equal(built.report.summary.approvedContainmentControls, 0);
  assert.equal(built.report.summary.verifiedContainmentControls, 0);
});

test("all human, authorization, launch, observation, and attestation fields remain blank", async () => {
  const built = await plan();
  for (const kit of built.kits) {
    const authorization = JSON.parse(kit.files["AUTHORIZATION.template.json"]);
    assert.equal(authorization.owner.fullName, null);
    assert.equal(authorization.operator.fullName, null);
    assert.equal(authorization.independentVisualReviewer.fullName, null);
    assert.deepEqual(authorization.approvedControlIds, []);
    assert.equal(authorization.runtimeExecutionAuthorized, false);
    assert.equal(authorization.launchPath, null);
    assert.equal(authorization.launchCommand, null);
    assert.ok(
      authorization.containmentControls.every(
        (control) =>
          typeof control.selectedMechanism === "string" &&
          control.selectedMechanism.length > 10 &&
          control.candidateImplementationPresent === true &&
          control.offlineOrDiagnosticVerified === true &&
          control.ownerTechnicalApprovalEstablished === false &&
          control.liveSessionVerified === false &&
          control.approved === false &&
          control.verified === false &&
          control.externalReceiptOpaqueId === null,
      ),
    );

    const launch = JSON.parse(kit.files["LAUNCH_RECEIPT.template.json"]);
    assert.equal(launch.runtimeSessionExecuted, false);
    assert.equal(launch.processId, null);
    assert.equal(launch.runtimeExecutablePath, null);

    const observation = JSON.parse(
      kit.files["RUNTIME_OBSERVATION.template.json"],
    );
    assert.equal(observation.runtimeSessionExecuted, false);
    assert.deepEqual(observation.orderedEvents, []);
    assert.deepEqual(observation.capturedFrames, []);
    assert.equal(observation.observationAccepted, false);

    const attestation = JSON.parse(
      kit.files["SESSION_ATTESTATION.template.json"],
    );
    assert.equal(attestation.operator.fullName, null);
    assert.equal(attestation.independentVisualReviewer.fullName, null);
    assert.equal(attestation.operatorSignatureEnvelope, null);
    assert.equal(attestation.runtimeObservationAccepted, false);
  }
});

test("validators reject execution, identity, shared profile, and acceptance fabrication", async () => {
  const built = await plan();
  const manifest = built.kits[0].manifest;
  for (const mutate of [
    (copy) => { copy.executionGate.runnable = true; },
    (copy) => { copy.executionGate.runtimeSessionExecuted = true; },
    (copy) => { copy.sessionIdentity.sessionId = "invented"; },
    (copy) => { copy.isolation.mayShareMutableProfileWithOtherLanguage = true; },
    (copy) => { copy.acceptanceEffects.ownerAccepted = true; },
    (copy) => { copy.authorizationGranted = true; },
  ]) {
    const copy = structuredClone(manifest);
    mutate(copy);
    await assert.rejects(() => validateSessionKitManifest(copy, "en"));
  }
  const readiness = structuredClone(built.report);
  readiness.readiness.originalRuntimeExecutionReady = true;
  await assert.rejects(() => validateSessionKitReadiness(readiness));
});

test("validators reject re-signed descriptor, source, nested-schema, and authority injection", async () => {
  const built = await plan();
  const manifest = built.kits[0].manifest;
  for (const mutate of [
    (copy) => {
      copy.generator.path = "/private/other-generator.mjs";
    },
    (copy) => {
      copy.generator.sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.preparationReport.path = "/private/preparation.json";
    },
    (copy) => {
      copy.preparationReport.sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.sessionIdentity.candidateFingerprintSha256 = "0".repeat(64);
    },
    (copy) => {
      copy.sourceIdentity.shell.lessonPath = "/private/index_local.swf";
    },
    (copy) => {
      copy.sourceIdentity.shell.runtimeAuthorized = true;
    },
    (copy) => {
      copy.templateFiles[0].runtimeAuthorized = true;
    },
    (copy) => {
      copy.templateFiles[0].sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.acceptanceEffects = {};
    },
  ]) {
    const copy = structuredClone(manifest);
    mutate(copy);
    await assert.rejects(
      () => validateSessionKitManifest(resignManifest(copy), "en"),
    );
  }

  for (const mutate of [
    (copy) => {
      copy.generator.path = "/private/other-generator.mjs";
    },
    (copy) => {
      copy.generator.sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.sourceBindings.runtimePreparation.sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.scope.runtimeAuthorized = true;
    },
    (copy) => {
      copy.kits[0].candidateFingerprintSha256 = "0".repeat(64);
    },
    (copy) => {
      copy.kits[0].manifestFingerprintSha256 = "0".repeat(64);
    },
    (copy) => {
      copy.kits[0].files[0].name = "launch.sh";
    },
    (copy) => {
      copy.kits[0].files[0].sha256 = "0".repeat(64);
    },
    (copy) => {
      copy.readiness.immutableSessionAuthorizationBound = true;
    },
    (copy) => {
      copy.acceptanceEffects = {};
    },
  ]) {
    const copy = structuredClone(built.report);
    mutate(copy);
    await assert.rejects(
      () => validateSessionKitReadiness(resignReadiness(copy)),
    );
  }
});

test("checked-in readiness report and immutable work tree are current", async () => {
  const result = await prepareSessionKits({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.changed, 0);
  const report = await validateSessionKitReadiness(result.report);
  assert.equal(report.summary.languageKitCount, 2);
  assert.equal(report.summary.runtimeSessionsExecuted, 0);
  assert.equal(report.readiness.originalRuntimeExecutionReady, false);
  assert.equal(
    await readFile(READINESS_JSON, "utf8"),
    (await plan()).reportJson,
  );
  assert.equal(
    await readFile(READINESS_MARKDOWN, "utf8"),
    renderSessionKitReadinessMarkdown(report),
  );
  for (const language of ["en", "es"]) {
    const directory = await lstat(path.join(SESSION_KIT_ROOT, language));
    assert.equal(directory.mode & 0o777, 0o555);
    for (const name of [
      "kit-manifest.json",
      "AUTHORIZATION.template.json",
      "PREFLIGHT.template.json",
      "LAUNCH_RECEIPT.template.json",
      "RUNTIME_OBSERVATION.template.json",
      "SESSION_ATTESTATION.template.json",
      "OPERATOR_CARD.md",
    ]) {
      const file = await lstat(path.join(SESSION_KIT_ROOT, language, name));
      assert.equal(file.isFile(), true);
      assert.equal(file.isSymbolicLink(), false);
      assert.equal(file.nlink, 1);
      assert.equal(file.mode & 0o777, 0o444);
    }
  }
});

test("refresh-empty-templates is idempotent in an isolated temporary root", async () => {
  await withTemporaryRoot(async (root) => {
    const first = await materializeSessionKitTreeForTesting({root});
    assert.equal(first.created, true);
    assert.equal(first.refreshed, false);

    const second = await materializeSessionKitTreeForTesting({
      root,
      refreshEmptyTemplates: true,
    });
    assert.equal(second.created, false);
    assert.equal(second.refreshed, false);
    assert.equal(second.preimage, null);
  });
});

test("refresh archives an exact stale blank preimage before installing current kits", async () => {
  await withTemporaryRoot(async (root) => {
    await materializeSessionKitTreeForTesting({root});
    const staleManifestPath = path.join(
      root,
      SESSION_KIT_ROOT,
      "en",
      "kit-manifest.json",
    );
    await rewriteReadOnlyJson(staleManifestPath, (manifest) => {
      manifest.generator.sha256 = "0".repeat(64);
      return resignManifest(manifest);
    });
    const staleBytes = await readFile(staleManifestPath);

    const result = await materializeSessionKitTreeForTesting({
      root,
      refreshEmptyTemplates: true,
    });
    assert.equal(result.created, true);
    assert.equal(result.refreshed, true);
    assert.match(
      result.preimage,
      /^work\/g5-l4-shell-rw002-original-runtime-session-kit-preimages\//u,
    );
    const archivedManifest = path.join(
      root,
      result.preimage,
      "en",
      "kit-manifest.json",
    );
    assert.deepEqual(await readFile(archivedManifest), staleBytes);
    assert.equal((await lstat(archivedManifest)).mode & 0o777, 0o444);
    assert.equal(
      await readFile(staleManifestPath, "utf8"),
      (await plan()).kits[0].files["kit-manifest.json"],
    );
  });
});

test("refresh rollback restores the stale blank tree after an injected replacement failure", async () => {
  await withTemporaryRoot(async (root) => {
    await materializeSessionKitTreeForTesting({root});
    const staleManifestPath = path.join(
      root,
      SESSION_KIT_ROOT,
      "en",
      "kit-manifest.json",
    );
    await rewriteReadOnlyJson(staleManifestPath, (manifest) => {
      manifest.generator.sha256 = "0".repeat(64);
      return resignManifest(manifest);
    });
    const staleBytes = await readFile(staleManifestPath);

    await assert.rejects(
      () => materializeSessionKitTreeForTesting({
        root,
        refreshEmptyTemplates: true,
        transactionHooks: {
          afterReplacement() {
            throw new Error("injected replacement failure");
          },
        },
      }),
      /injected replacement failure/u,
    );
    assert.deepEqual(await readFile(staleManifestPath), staleBytes);
    assert.equal((await lstat(staleManifestPath)).mode & 0o777, 0o444);

    const preimageRoot = path.join(
      root,
      "work/g5-l4-shell-rw002-original-runtime-session-kit-preimages",
    );
    const preserved = await readdir(preimageRoot);
    assert.equal(
      preserved.filter((name) => name.startsWith("failed-replacement-")).length,
      1,
    );
  });
});

test("refresh refuses a filled authorization and preserves the active tree", async () => {
  await withTemporaryRoot(async (root) => {
    await materializeSessionKitTreeForTesting({root});
    const activeRoot = path.join(root, SESSION_KIT_ROOT);
    const activeIdentity = await lstat(activeRoot);
    const authorizationPath = path.join(
      activeRoot,
      "en",
      "AUTHORIZATION.template.json",
    );
    await rewriteReadOnlyJson(authorizationPath, (authorization) => {
      authorization.runtimeExecutionAuthorized = true;
    });
    const filledBytes = await readFile(authorizationPath);

    await assert.rejects(
      () => materializeSessionKitTreeForTesting({
        root,
        refreshEmptyTemplates: true,
      }),
      /authorization template was filled/u,
    );
    assert.equal((await lstat(activeRoot)).ino, activeIdentity.ino);
    assert.deepEqual(await readFile(authorizationPath), filledBytes);
    await assert.rejects(
      () => lstat(path.join(
        root,
        "work/g5-l4-shell-rw002-original-runtime-session-kit-preimages",
      )),
      (error) => error.code === "ENOENT",
    );
  });
});

test("refresh refuses symlink and hardlink kit members without moving the tree", async () => {
  for (const kind of ["symlink", "hardlink"]) {
    await withTemporaryRoot(async (root) => {
      await materializeSessionKitTreeForTesting({root});
      const {target} = await replaceKitFileWithLink(root, kind);
      await assert.rejects(
        () => materializeSessionKitTreeForTesting({
          root,
          refreshEmptyTemplates: true,
        }),
        kind === "symlink"
          ? /symbolic-link component is forbidden/u
          : /expected one ordinary file/u,
      );
      const metadata = await lstat(target);
      if (kind === "symlink") assert.equal(metadata.isSymbolicLink(), true);
      else assert.equal(metadata.nlink, 2);
    });
  }
});

test("paired report writer restores both prior outputs after later install failure", async () => {
  await withTemporaryRoot(async (root) => {
    const entries = [
      ["reports/readiness.json", "{\"new\":true}\n"],
      ["reports/readiness.md", "# New\n"],
    ];
    const jsonPath = path.join(root, entries[0][0]);
    const markdownPath = path.join(root, entries[1][0]);
    const priorJson = "{\"prior\":true}\n";
    const priorMarkdown = "# Prior\n";
    await Promise.all([
      writeFile(jsonPath, priorJson, {flag: "wx"}),
      writeFile(markdownPath, priorMarkdown, {flag: "wx"}),
    ]);

    await assert.rejects(
      () => replaceSessionKitReportPairForTesting({
        root,
        entries,
        transactionHooks: {
          beforeInstall({index}) {
            if (index === 1) throw new Error("injected later-output failure");
          },
        },
      }),
      /injected later-output failure/u,
    );
    assert.equal(await readFile(jsonPath, "utf8"), priorJson);
    assert.equal(await readFile(markdownPath, "utf8"), priorMarkdown);
    await assertNoTransactionResidue(path.join(root, "reports"));

    await replaceSessionKitReportPairForTesting({root, entries});
    assert.equal(await readFile(jsonPath, "utf8"), entries[0][1]);
    assert.equal(await readFile(markdownPath, "utf8"), entries[1][1]);
    await assertNoTransactionResidue(path.join(root, "reports"));
  });
});

test("paired report install is no-replace and preserves a foreign target plus prior backup", async () => {
  await withTemporaryRoot(async (root) => {
    const entries = [
      ["reports/readiness.json", "{\"new\":true}\n"],
      ["reports/readiness.md", "# New\n"],
    ];
    const jsonPath = path.join(root, entries[0][0]);
    const markdownPath = path.join(root, entries[1][0]);
    const priorJson = "{\"prior\":true}\n";
    const priorMarkdown = "# Prior\n";
    const foreignMarkdown = "# Foreign concurrent bytes\n";
    await Promise.all([
      writeFile(jsonPath, priorJson, {flag: "wx"}),
      writeFile(markdownPath, priorMarkdown, {flag: "wx"}),
    ]);

    await assert.rejects(
      () => replaceSessionKitReportPairForTesting({
        root,
        entries,
        transactionHooks: {
          async beforeInstall({index}) {
            if (index !== 1) return;
            await writeFile(markdownPath, foreignMarkdown, {flag: "wx"});
          },
        },
      }),
      (error) =>
        error instanceof AggregateError &&
        /rollback was incomplete/u.test(error.message),
    );
    assert.equal(await readFile(jsonPath, "utf8"), priorJson);
    assert.equal(await readFile(markdownPath, "utf8"), foreignMarkdown);

    const reportNames = await readdir(path.join(root, "reports"));
    const retainedBackups = reportNames.filter((name) =>
      name.startsWith(".readiness.md.") && name.endsWith(".bak"));
    assert.equal(retainedBackups.length, 1);
    assert.equal(
      await readFile(path.join(root, "reports", retainedBackups[0]), "utf8"),
      priorMarkdown,
    );
  });
});

test("paired report rollback rejects a replaced backup instead of restoring foreign bytes", async () => {
  await withTemporaryRoot(async (root) => {
    const entries = [
      ["reports/readiness.json", "{\"new\":true}\n"],
      ["reports/readiness.md", "# New\n"],
    ];
    const jsonPath = path.join(root, entries[0][0]);
    const markdownPath = path.join(root, entries[1][0]);
    const priorJson = "{\"prior\":true}\n";
    const priorMarkdown = "# Prior\n";
    const foreignBackup = "# Foreign backup\n";
    await Promise.all([
      writeFile(jsonPath, priorJson, {flag: "wx"}),
      writeFile(markdownPath, priorMarkdown, {flag: "wx"}),
    ]);
    let foreignBackupPath;
    let foreignBackupIdentity;

    await assert.rejects(
      () => replaceSessionKitReportPairForTesting({
        root,
        entries,
        transactionHooks: {
          async beforeInstall({index}) {
            if (index !== 1) return;
            const names = await readdir(path.join(root, "reports"));
            const backups = names.filter((name) =>
              name.startsWith(".readiness.md.") && name.endsWith(".bak"));
            assert.equal(backups.length, 1);
            foreignBackupPath = path.join(root, "reports", backups[0]);
            await unlink(foreignBackupPath);
            await writeFile(foreignBackupPath, foreignBackup, {flag: "wx"});
            foreignBackupIdentity = await lstat(foreignBackupPath);
            throw new Error("injected replaced backup");
          },
        },
      }),
      (error) =>
        error instanceof AggregateError &&
        /rollback was incomplete/u.test(error.message),
    );
    assert.equal(await readFile(jsonPath, "utf8"), priorJson);
    await assert.rejects(
      () => lstat(markdownPath),
      (error) => error.code === "ENOENT",
    );
    assert.equal(await readFile(foreignBackupPath, "utf8"), foreignBackup);
    assert.equal(
      (await lstat(foreignBackupPath)).ino,
      foreignBackupIdentity.ino,
    );
  });
});

test("paired report rollback never unlinks a same-byte foreign replacement", async () => {
  await withTemporaryRoot(async (root) => {
    const entries = [
      ["reports/readiness.json", "{\"new\":true}\n"],
      ["reports/readiness.md", "# New\n"],
    ];
    const jsonPath = path.join(root, entries[0][0]);
    const markdownPath = path.join(root, entries[1][0]);
    const priorJson = "{\"prior\":true}\n";
    const priorMarkdown = "# Prior\n";
    await Promise.all([
      writeFile(jsonPath, priorJson, {flag: "wx"}),
      writeFile(markdownPath, priorMarkdown, {flag: "wx"}),
    ]);
    let foreignIdentity;

    await assert.rejects(
      () => replaceSessionKitReportPairForTesting({
        root,
        entries,
        transactionHooks: {
          async beforeInstall({index}) {
            if (index !== 1) return;
            await unlink(jsonPath);
            await writeFile(jsonPath, entries[0][1], {flag: "wx"});
            foreignIdentity = await lstat(jsonPath);
            throw new Error("injected same-byte foreign replacement");
          },
        },
      }),
      (error) =>
        error instanceof AggregateError &&
        /rollback was incomplete/u.test(error.message),
    );
    assert.equal(await readFile(jsonPath, "utf8"), entries[0][1]);
    assert.equal((await lstat(jsonPath)).ino, foreignIdentity.ino);
    assert.equal(await readFile(markdownPath, "utf8"), priorMarkdown);

    const reportNames = await readdir(path.join(root, "reports"));
    const retainedBackups = reportNames.filter((name) =>
      name.startsWith(".readiness.json.") && name.endsWith(".bak"));
    assert.equal(retainedBackups.length, 1);
    assert.equal(
      await readFile(path.join(root, "reports", retainedBackups[0]), "utf8"),
      priorJson,
    );
  });
});

test("CLI exposes only check/help and empty-template verification", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    refreshEmptyTemplates: false,
  });
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    refreshEmptyTemplates: false,
  });
  assert.deepEqual(parseArguments(["--refresh-empty-templates"]), {
    check: false,
    refreshEmptyTemplates: true,
  });
  assert.throws(
    () => parseArguments(["--check", "--refresh-empty-templates"]),
    /mutually exclusive/,
  );
  for (const argument of [
    "--launch", "--sign", "--approve", "--capture", "--promote",
    "--operator", "--host", "--session-id",
  ]) {
    assert.throws(() => parseArguments([argument]), /Unknown option/);
  }
});
