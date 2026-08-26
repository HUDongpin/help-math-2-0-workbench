import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {renderCurrentAccountSandboxProfile} from "./build-g4-l3-ts006-current-account-profile-readiness.mjs";
import {
  applyDisposableProfileSelection,
  parseArguments,
  planDisposableProfileSelection,
  verifyDisposableProfileSelectionTransaction,
} from "./select-g4-l3-ts006-disposable-runtime-profiles.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const SCRIPT_PATH = path.join(path.dirname(TEST_PATH), "select-g4-l3-ts006-disposable-runtime-profiles.mjs");
const INTAKE = "work/g4-l3-ts006-original-runtime-authorization-intake";
const SELECTION = `${INTAKE}/current-session-profile-selection.json`;
const READINESS = "reports/g4-l3-ts006-current-account-profile-readiness.json";
const EXCEPTION = `${INTAKE}/current-admin-account-exception-intake.json`;
const KITS = "work/g4-l3-ts006-original-runtime-session-kits";
const PROFILE_GENERATOR = "scripts/prepare-g4-l3-ts006-disposable-runtime-profile.mjs";
const EN_OLD = "ts006-en-11111111-1111-4111-8111-111111111111";
const ES_OLD = "ts006-es-22222222-2222-4222-8222-222222222222";
const EN_NEW = "ts006-en-33333333-3333-4333-8333-333333333333";
const ES_NEW = "ts006-es-44444444-4444-4444-8444-444444444444";
const PROFILE_DIRECTORIES = [
  "runtime-profile/home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
  "runtime-profile/home/Library/Application Support/Macromedia/Flash Player",
  "runtime-profile/tmp",
  "runtime-profile/cache",
  "runtime-profile/config",
  "runtime-profile/data",
  "evidence/raw-frames",
  "evidence/raw-captures",
  "evidence/audio",
  "evidence/logs",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function neutralAcceptance() {
  return {
    acceptanceNeutral: true,
    authoritativeOriginalRuntimeTrace: false,
    baselineAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    publicRelease: false,
  };
}

async function writeProjectFile(root, relativePath, contents, mode = 0o444) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), {recursive: true, mode: 0o700});
  await writeFile(target, contents, {flag: "wx", mode});
  return target;
}

async function binding(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function absoluteBinding(filePath) {
  const bytes = await readFile(filePath);
  return {path: filePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function createProfile({
  root,
  language,
  sessionId,
  projectorExecutable,
}) {
  const sessionRelative = `artifacts/full-frame/g4-l3/${sessionId}`;
  const sessionRoot = path.join(root, sessionRelative);
  for (const directory of PROFILE_DIRECTORIES) {
    await mkdir(path.join(sessionRoot, directory), {recursive: true, mode: 0o700});
  }
  const profileRoot = path.join(sessionRoot, "runtime-profile");
  const sandboxPath = path.join(profileRoot, "sandbox.sb");
  const policy = renderCurrentAccountSandboxProfile({
    allowedExecutable: projectorExecutable,
    currentHome: os.userInfo().homedir,
    userFonts: path.join(os.userInfo().homedir, "Library/Fonts"),
    sessionRoot,
  });
  await writeFile(sandboxPath, policy, {flag: "wx", mode: 0o400});
  const [readiness, exception, kit, generator, projector] = await Promise.all([
    binding(root, READINESS),
    binding(root, EXCEPTION),
    binding(root, `${KITS}/${language}/kit-manifest.json`),
    binding(root, PROFILE_GENERATOR),
    absoluteBinding(projectorExecutable),
  ]);
  const home = path.join(profileRoot, "home");
  const withoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-empty-current-account-disposable-runtime-profile",
    status: "empty-profile-candidate-not-authorized-not-launched",
    animationId: "course-g04-l03-ts-006",
    language,
    sessionId,
    createdAt: "2026-07-26T00:00:00.000Z",
    sourceBindings: {
      readiness,
      exceptionIntake: exception,
      sessionKit: kit,
      generator,
      projector,
    },
    accountIsolation: {
      mode: "same-account-separate-disposable-process-profiles",
      accountIdentifierSha256: "a".repeat(64),
      additionalMacosAccountsCreated: 0,
      realUserHomeReadDefault: "deny",
      realUserHomeWrite: "deny",
      userFontsRead: "allow-after-separate-hash-binding",
      sessionEnvironment: {
        HOME: home,
        CFFIXED_USER_HOME: home,
        TMPDIR: `${path.join(profileRoot, "tmp")}${path.sep}`,
        XDG_CACHE_HOME: path.join(profileRoot, "cache"),
        XDG_CONFIG_HOME: path.join(profileRoot, "config"),
        XDG_DATA_HOME: path.join(profileRoot, "data"),
      },
    },
    sandbox: {
      path: sandboxPath,
      bytes: Buffer.byteLength(policy),
      sha256: sha256(policy),
      policy,
    },
    emptyState: {
      sharedObjectFiles: 0,
      disposablePreferenceFiles: 0,
      rawFrames: 0,
      rawCaptures: 0,
      audioFiles: 0,
      logFiles: 0,
    },
    executionGate: {
      externalSignaturesBound: false,
      livePreflightPassed: false,
      projectorLaunched: false,
      runtimeSessionExecuted: false,
      launchCommand: null,
    },
    acceptance: neutralAcceptance(),
  };
  const manifest = {
    ...withoutFingerprint,
    manifestFingerprintSha256: sha256(stable(withoutFingerprint)),
  };
  const manifestPath = path.join(sessionRoot, "profile-manifest.json");
  await writeFile(manifestPath, pretty(manifest), {flag: "wx", mode: 0o400});
  return {sessionRoot, manifestPath, sandboxPath};
}

async function fixture() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "ts006-profile-selection-")));
  await chmod(root, 0o700);
  const projectorExecutable = await writeProjectFile(root, "projector/Flash Player", "fixture-projector\n");
  await writeProjectFile(root, "scripts/select-g4-l3-ts006-disposable-runtime-profiles.mjs", await readFile(SCRIPT_PATH));
  await writeProjectFile(root, PROFILE_GENERATOR, "fixture profile generator\n");
  const taskThreadId = "fixture-task-thread";
  await writeProjectFile(root, EXCEPTION, pretty({
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-user-stated-current-admin-account-exception-intake",
    taskThreadId,
    decision: {
      doNotCreateAdditionalMacosAccounts: true,
      permitCurrentMacosAccountForEnEsCapture: true,
    },
    authorityBoundary: {
      runtimeExecutionAuthorizedByThisIntakeAlone: false,
      runtimeSessionExecuted: false,
      strictAcceptanceEffect: "none",
    },
  }));
  const readinessWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-current-account-disposable-profile-readiness",
    executionGate: {
      runtimeSessionsExecuted: 0,
      originalRuntimeExecutionReady: false,
    },
    acceptance: neutralAcceptance(),
  };
  await writeProjectFile(root, READINESS, pretty({
    ...readinessWithoutFingerprint,
    reportFingerprintSha256: sha256(stable(readinessWithoutFingerprint)),
  }));
  for (const language of ["en", "es"]) {
    const kitWithoutFingerprint = {
      schemaVersion: 1,
      evidenceType: "g4-l3-ts006-original-runtime-empty-session-kit",
      animationId: "course-g04-l03-ts-006",
      language,
      executionGate: {
        runtimeSessionExecuted: false,
        originalRuntimeExecutionReady: false,
      },
      acceptance: neutralAcceptance(),
    };
    await writeProjectFile(root, `${KITS}/${language}/kit-manifest.json`, pretty({
      ...kitWithoutFingerprint,
      kitFingerprintSha256: sha256(stable(kitWithoutFingerprint)),
    }));
  }
  const currentSelection = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-current-account-disposable-profile-selection",
    selectedOn: "2026-07-25",
    taskThreadId,
    profiles: [
      {
        language: "en",
        sessionId: EN_OLD,
        manifestPath: `artifacts/full-frame/g4-l3/${EN_OLD}/profile-manifest.json`,
        manifestSha256: "1".repeat(64),
        sandboxSha256: "2".repeat(64),
      },
      {
        language: "es",
        sessionId: ES_OLD,
        manifestPath: `artifacts/full-frame/g4-l3/${ES_OLD}/profile-manifest.json`,
        manifestSha256: "3".repeat(64),
        sandboxSha256: "4".repeat(64),
      },
    ],
    state: "empty-profile-candidates-not-authorized-not-launched",
    runtimeSessionsExecuted: 0,
    strictAcceptanceEffect: "none",
  };
  await writeProjectFile(root, SELECTION, pretty(currentSelection), 0o644);
  const en = await createProfile({root, language: "en", sessionId: EN_NEW, projectorExecutable});
  const es = await createProfile({root, language: "es", sessionId: ES_NEW, projectorExecutable});
  const expectedSelectionSha256 = sha256(await readFile(path.join(root, SELECTION)));
  const options = {
    projectRoot: root,
    enSessionId: EN_NEW,
    esSessionId: ES_NEW,
    expectedSelectionSha256,
    projectorExecutable,
    now: new Date("2026-07-26T12:34:56.000Z"),
  };
  return {root, projectorExecutable, expectedSelectionSha256, options, en, es};
}

async function cleanup(root) {
  assert.match(path.basename(root), /^ts006-profile-selection-/u);
  await rm(root, {recursive: true, force: true});
}

test("dry run validates two fresh exact profiles without mutating selection", async () => {
  const input = await fixture();
  try {
    const before = await readFile(path.join(input.root, SELECTION));
    const plan = await planDisposableProfileSelection(input.options);
    assert.equal(plan.mode, "dry-run");
    assert.deepEqual(plan.profiles.map(({language, sessionId}) => ({language, sessionId})), [
      {language: "en", sessionId: EN_NEW},
      {language: "es", sessionId: ES_NEW},
    ]);
    assert.equal(plan.FlashLaunched, false);
    assert.equal(plan.runtimeAuthorityCreated, false);
    assert.equal(plan.acceptanceAuthorityCreated, false);
    assert.equal(plan.strictAcceptanceEffect, "none");
    assert.deepEqual(await readFile(path.join(input.root, SELECTION)), before);
    await assert.rejects(lstat(path.join(input.root, INTAKE, "profile-selection-transactions")), /ENOENT/u);
  } finally {
    await cleanup(input.root);
  }
});

test("apply uses CAS and writes immutable preimage plus receipt only inside the ignored intake", async () => {
  const input = await fixture();
  try {
    const applied = await applyDisposableProfileSelection(input.options);
    assert.equal(applied.mode, "verified");
    assert.equal(applied.FlashLaunched, false);
    assert.equal(applied.runtimeAuthorityCreated, false);
    assert.equal(applied.acceptanceAuthorityCreated, false);
    // The selected manifests bind the predecessor readiness report. Rebuilding
    // readiness from the new selection must not circularly invalidate the
    // immutable selection receipt.
    const readinessPath = path.join(input.root, READINESS);
    await chmod(readinessPath, 0o600);
    const regeneratedReadiness = JSON.parse(await readFile(readinessPath));
    regeneratedReadiness.regeneratedFromNewSelection = true;
    const {reportFingerprintSha256: _oldReadinessFingerprint, ...readinessWithoutFingerprint} = regeneratedReadiness;
    regeneratedReadiness.reportFingerprintSha256 = sha256(stable(readinessWithoutFingerprint));
    await writeFile(readinessPath, pretty(regeneratedReadiness));
    await chmod(readinessPath, 0o444);
    const checked = await verifyDisposableProfileSelectionTransaction({
      projectRoot: input.root,
      transactionId: applied.transactionId,
      projectorExecutable: input.projectorExecutable,
    });
    assert.equal(checked.selection.sha256, applied.selection.sha256);
    assert.equal(checked.preimage.sha256, input.expectedSelectionSha256);
    for (const item of [checked.preimage, checked.receipt]) {
      const metadata = await lstat(path.join(input.root, item.path));
      assert.equal(metadata.isFile(), true);
      assert.equal(metadata.mode & 0o222, 0);
      assert.equal(metadata.nlink, 1);
    }
    const selection = JSON.parse(await readFile(path.join(input.root, SELECTION)));
    assert.equal(selection.runtimeSessionsExecuted, 0);
    assert.equal(selection.selectionTransaction.runtimeAuthorityCreated, false);
    assert.equal(selection.selectionTransaction.acceptanceAuthorityCreated, false);
    assert.equal(Object.entries(selection.acceptance).every(([key, value]) =>
      key === "acceptanceNeutral" ? value === true : value === false), true);
    await assert.rejects(lstat(path.join(input.root, INTAKE, ".profile-selection.lock")), /ENOENT/u);
  } finally {
    await cleanup(input.root);
  }
});

test("rejects wrong CAS preimage and a concurrent selection lock", async () => {
  const input = await fixture();
  try {
    await assert.rejects(
      planDisposableProfileSelection({...input.options, expectedSelectionSha256: "f".repeat(64)}),
      /compare-and-swap preimage mismatch/u,
    );
    await writeFile(path.join(input.root, INTAKE, ".profile-selection.lock"), "existing lock\n", {flag: "wx", mode: 0o400});
    await assert.rejects(
      applyDisposableProfileSelection(input.options),
      /selection lock already exists/u,
    );
    assert.equal(sha256(await readFile(path.join(input.root, SELECTION))), input.expectedSelectionSha256);
  } finally {
    await cleanup(input.root);
  }
});

test("rejects used, promoted, stale, and missing disposable profiles", async (t) => {
  await t.test("used profile evidence", async () => {
    const input = await fixture();
    try {
      await writeFile(path.join(input.en.sessionRoot, "evidence/logs/launch-receipt.json"), "{}\n", {flag: "wx", mode: 0o400});
      await assert.rejects(planDisposableProfileSelection(input.options), /used, stale, or contains unallowlisted files/u);
    } finally {
      await cleanup(input.root);
    }
  });
  await t.test("promoted manifest", async () => {
    const input = await fixture();
    try {
      await chmod(input.en.manifestPath, 0o600);
      const manifest = JSON.parse(await readFile(input.en.manifestPath));
      manifest.executionGate.projectorLaunched = true;
      const {manifestFingerprintSha256: _old, ...withoutFingerprint} = manifest;
      manifest.manifestFingerprintSha256 = sha256(stable(withoutFingerprint));
      await writeFile(input.en.manifestPath, pretty(manifest));
      await chmod(input.en.manifestPath, 0o400);
      await assert.rejects(planDisposableProfileSelection(input.options), /used, launched, or promoted/u);
    } finally {
      await cleanup(input.root);
    }
  });
  await t.test("stale source binding", async () => {
    const input = await fixture();
    try {
      const readinessPath = path.join(input.root, READINESS);
      await chmod(readinessPath, 0o600);
      const readiness = JSON.parse(await readFile(readinessPath));
      readiness.unboundDrift = true;
      const {reportFingerprintSha256: _old, ...withoutFingerprint} = readiness;
      readiness.reportFingerprintSha256 = sha256(stable(withoutFingerprint));
      await writeFile(readinessPath, pretty(readiness));
      await chmod(readinessPath, 0o444);
      await assert.rejects(planDisposableProfileSelection(input.options), /readiness source binding is stale/u);
    } finally {
      await cleanup(input.root);
    }
  });
  await t.test("missing profile", async () => {
    const input = await fixture();
    try {
      await assert.rejects(
        planDisposableProfileSelection({
          ...input.options,
          enSessionId: "ts006-en-55555555-5555-4555-8555-555555555555",
        }),
        /ENOENT/u,
      );
    } finally {
      await cleanup(input.root);
    }
  });
});

test("rejects symlink escape attempts in the selected profile and selection path", async (t) => {
  await t.test("sandbox symlink", async () => {
    const input = await fixture();
    try {
      await unlink(input.en.sandboxPath);
      await symlink(input.projectorExecutable, input.en.sandboxPath);
      await assert.rejects(planDisposableProfileSelection(input.options), /symlinks are forbidden/u);
    } finally {
      await cleanup(input.root);
    }
  });
  await t.test("selection symlink", async () => {
    const input = await fixture();
    try {
      const target = path.join(input.root, `${INTAKE}/selection-target.json`);
      await writeFile(target, await readFile(path.join(input.root, SELECTION)), {flag: "wx", mode: 0o444});
      await unlink(path.join(input.root, SELECTION));
      await symlink(target, path.join(input.root, SELECTION));
      await assert.rejects(planDisposableProfileSelection(input.options), /symlink path component is forbidden/u);
    } finally {
      await cleanup(input.root);
    }
  });
});

test("CLI requires an explicit non-promotion mode and exact identity arguments", () => {
  assert.deepEqual(parseArguments([
    "--dry-run",
    "--en-session-id", EN_NEW,
    "--es-session-id", ES_NEW,
    "--expected-selection-sha256", "a".repeat(64),
  ]), {
    mode: "dry-run",
    enSessionId: EN_NEW,
    esSessionId: ES_NEW,
    expectedSelectionSha256: "a".repeat(64),
  });
  assert.deepEqual(parseArguments(["--check", "--transaction-id", "b".repeat(64)]), {
    mode: "check",
    transactionId: "b".repeat(64),
  });
  assert.throws(() => parseArguments([]), /supply exactly one/u);
  assert.throws(() => parseArguments(["--apply"]), /requires --en-session-id/u);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/u);
  assert.throws(() => parseArguments(["--apply", "--dry-run"]), /exactly one/u);
});
