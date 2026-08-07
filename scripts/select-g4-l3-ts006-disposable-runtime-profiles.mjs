#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {renderCurrentAccountSandboxProfile} from "./build-g4-l3-ts006-current-account-profile-readiness.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE = "scripts/select-g4-l3-ts006-disposable-runtime-profiles.mjs";
const PROFILE_GENERATOR = "scripts/prepare-g4-l3-ts006-disposable-runtime-profile.mjs";
const SELECTION = "work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json";
const INTAKE_ROOT = "work/g4-l3-ts006-original-runtime-authorization-intake";
const TRANSACTION_ROOT = `${INTAKE_ROOT}/profile-selection-transactions`;
const LOCK = `${INTAKE_ROOT}/.profile-selection.lock`;
const ARTIFACT_ROOT = "artifacts/full-frame/g4-l3";
const READINESS = "reports/g4-l3-ts006-current-account-profile-readiness.json";
const EXCEPTION = `${INTAKE_ROOT}/current-admin-account-exception-intake.json`;
const SESSION_KITS = "work/g4-l3-ts006-original-runtime-session-kits";
const DEFAULT_PROJECTOR = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";
const ANIMATION_ID = "course-g04-l03-ts-006";
const HASH = /^[a-f0-9]{64}$/u;
const SESSION_ID = /^ts006-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;
const TRANSACTION_ID = /^[a-f0-9]{64}$/u;
const EXPECTED_PROFILE_DIRECTORIES = Object.freeze([
  "runtime-profile",
  "runtime-profile/home",
  "runtime-profile/home/Library",
  "runtime-profile/home/Library/Preferences",
  "runtime-profile/home/Library/Preferences/Macromedia",
  "runtime-profile/home/Library/Preferences/Macromedia/Flash Player",
  "runtime-profile/home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
  "runtime-profile/home/Library/Application Support",
  "runtime-profile/home/Library/Application Support/Macromedia",
  "runtime-profile/home/Library/Application Support/Macromedia/Flash Player",
  "runtime-profile/tmp",
  "runtime-profile/cache",
  "runtime-profile/config",
  "runtime-profile/data",
  "evidence",
  "evidence/raw-frames",
  "evidence/raw-captures",
  "evidence/audio",
  "evidence/logs",
]);
const EXPECTED_PROFILE_FILES = Object.freeze([
  "profile-manifest.json",
  "runtime-profile/sandbox.sb",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

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

function portable(value) {
  return value.split(path.sep).join("/");
}

function inside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function acceptanceNeutral(value, label) {
  invariant(value && value.acceptanceNeutral === true,
    `${label} must remain acceptance-neutral`);
  invariant(Object.entries(value).every(([key, item]) =>
    key === "acceptanceNeutral" ? item === true : item === false),
  `${label} contains an authority or acceptance claim`);
}

function fingerprinted(value, field, label) {
  const fingerprint = value?.[field];
  const without = {...value};
  delete without[field];
  invariant(HASH.test(fingerprint) && fingerprint === sha256(stable(without)),
    `${label} fingerprint drifted`);
}

async function context(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const metadata = await lstat(lexical);
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(),
    "project root must be a real non-symlink directory");
  const resolved = await realpath(lexical);
  invariant(resolved === lexical, "project root realpath differs from its lexical path");
  return {projectRoot: lexical, rootReal: resolved};
}

function resolveRelative(scope, relativePath) {
  invariant(typeof relativePath === "string"
    && relativePath.length > 0
    && !path.isAbsolute(relativePath)
    && portable(path.normalize(relativePath)) === relativePath,
  `path must be one normalized project-relative allowlisted path: ${relativePath}`);
  const target = path.resolve(scope.rootReal, relativePath);
  invariant(inside(target, scope.rootReal) && target !== scope.rootReal,
    `path escapes project root: ${relativePath}`);
  return target;
}

async function assertNoSymlinkChain(scope, relativePath, {leaf = "any"} = {}) {
  const target = resolveRelative(scope, relativePath);
  const components = path.relative(scope.rootReal, target).split(path.sep);
  let current = scope.rootReal;
  for (let index = 0; index < components.length; index += 1) {
    current = path.join(current, components[index]);
    const metadata = await lstat(current);
    invariant(!metadata.isSymbolicLink(), `${relativePath}: symlink path component is forbidden`);
    if (index < components.length - 1) {
      invariant(metadata.isDirectory(), `${relativePath}: parent component is not a directory`);
    } else if (leaf === "file") {
      invariant(metadata.isFile() && metadata.nlink === 1,
        `${relativePath}: leaf must be a regular single-link file`);
    } else if (leaf === "directory") {
      invariant(metadata.isDirectory(), `${relativePath}: leaf must be a directory`);
    }
  }
  invariant(await realpath(target) === target, `${relativePath}: realpath differs from its lexical path`);
  return target;
}

async function projectFile(scope, relativePath, {json = true} = {}) {
  const target = await assertNoSymlinkChain(scope, relativePath, {leaf: "file"});
  const bytes = await readFile(target);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    raw: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {}),
  };
}

async function absoluteFile(filePath, {json = false} = {}) {
  invariant(path.isAbsolute(filePath), `absolute file path required: ${filePath}`);
  const lexical = path.resolve(filePath);
  const metadata = await lstat(lexical);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${filePath}: must be a regular non-linked file`);
  invariant(await realpath(lexical) === lexical, `${filePath}: realpath differs from its lexical path`);
  const bytes = await readFile(lexical);
  return {
    path: lexical,
    bytes: bytes.length,
    sha256: sha256(bytes),
    raw: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {}),
  };
}

function validateCurrentSelection(selection) {
  invariant(selection?.schemaVersion === 1
    && selection.evidenceType === "g4-l3-ts006-current-account-disposable-profile-selection"
    && typeof selection.taskThreadId === "string"
    && selection.taskThreadId.length > 0
    && selection.profiles?.map(({language}) => language).join("|") === "en|es"
    && selection.state === "empty-profile-candidates-not-authorized-not-launched"
    && selection.runtimeSessionsExecuted === 0
    && selection.strictAcceptanceEffect === "none",
  "current disposable-profile selection is malformed or promoted");
  for (const selected of selection.profiles) {
    invariant(SESSION_ID.test(selected.sessionId)
      && selected.sessionId.startsWith(`ts006-${selected.language}-`)
      && selected.manifestPath === `${ARTIFACT_ROOT}/${selected.sessionId}/profile-manifest.json`
      && HASH.test(selected.manifestSha256)
      && HASH.test(selected.sandboxSha256),
    `current ${selected.language} profile selection is malformed`);
  }
  if (selection.acceptance !== undefined) acceptanceNeutral(selection.acceptance, "profile selection");
  if (selection.selectionFingerprintSha256 !== undefined) {
    fingerprinted(selection, "selectionFingerprintSha256", "profile selection");
  }
  return selection;
}

function assertSourceBinding(binding, actual, expectedPath, label) {
  invariant(binding?.path === expectedPath
    && binding.bytes === actual.bytes
    && binding.sha256 === actual.sha256,
  `${label} source binding is stale`);
}

async function inventoryTree(scope, sessionRelative) {
  const root = await assertNoSymlinkChain(scope, sessionRelative, {leaf: "directory"});
  const directories = [];
  const files = [];
  async function walk(directory, relative = "") {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) {
      const childRelative = portable(path.join(relative, entry.name));
      const child = path.join(directory, entry.name);
      const metadata = await lstat(child);
      invariant(!metadata.isSymbolicLink(), `${sessionRelative}/${childRelative}: symlinks are forbidden`);
      if (metadata.isDirectory()) {
        invariant((metadata.mode & 0o777) === 0o700,
          `${sessionRelative}/${childRelative}: profile directory must be mode 0700`);
        directories.push(childRelative);
        await walk(child, childRelative);
      } else {
        invariant(metadata.isFile() && metadata.nlink === 1,
          `${sessionRelative}/${childRelative}: only regular single-link files are allowed`);
        invariant((metadata.mode & 0o222) === 0,
          `${sessionRelative}/${childRelative}: profile file must be read-only`);
        files.push(childRelative);
      }
    }
  }
  const rootMetadata = await stat(root);
  invariant((rootMetadata.mode & 0o777) === 0o700, `${sessionRelative}: profile root must be mode 0700`);
  await walk(root);
  directories.sort();
  files.sort();
  invariant(stable(directories) === stable([...EXPECTED_PROFILE_DIRECTORIES].sort()),
    `${sessionRelative}: disposable profile directory allowlist drifted`);
  invariant(stable(files) === stable([...EXPECTED_PROFILE_FILES].sort()),
    `${sessionRelative}: disposable profile is used, stale, or contains unallowlisted files`);
}

async function readProfile(scope, {
  language,
  sessionId,
  currentSelection,
  projectorExecutable,
  allowCurrentlySelected = false,
  requireCurrentSourceBindings = true,
}) {
  invariant(["en", "es"].includes(language)
    && SESSION_ID.test(sessionId)
    && sessionId.startsWith(`ts006-${language}-`),
  `${language}: invalid TS006 disposable session id`);
  const previouslySelected = currentSelection.profiles.find((item) => item.language === language);
  invariant(allowCurrentlySelected || previouslySelected?.sessionId !== sessionId,
    `${language}: refusing to re-select the current profile; a fresh profile is required`);
  const sessionRelative = `${ARTIFACT_ROOT}/${sessionId}`;
  const manifestRelative = `${sessionRelative}/profile-manifest.json`;
  await inventoryTree(scope, sessionRelative);
  const [
    manifestFile,
    readinessFile,
    exceptionFile,
    kitFile,
    generatorFile,
    projectorFile,
  ] = await Promise.all([
    projectFile(scope, manifestRelative),
    projectFile(scope, READINESS),
    projectFile(scope, EXCEPTION),
    projectFile(scope, `${SESSION_KITS}/${language}/kit-manifest.json`),
    projectFile(scope, PROFILE_GENERATOR, {json: false}),
    absoluteFile(projectorExecutable),
  ]);
  const manifest = manifestFile.value;
  invariant(manifest.schemaVersion === 1
    && manifest.evidenceType === "g4-l3-ts006-empty-current-account-disposable-runtime-profile"
    && manifest.status === "empty-profile-candidate-not-authorized-not-launched"
    && manifest.animationId === ANIMATION_ID
    && manifest.language === language
    && manifest.sessionId === sessionId,
  `${language}: disposable profile manifest identity is stale`);
  invariant(manifest.executionGate?.externalSignaturesBound === false
    && manifest.executionGate?.livePreflightPassed === false
    && manifest.executionGate?.projectorLaunched === false
    && manifest.executionGate?.runtimeSessionExecuted === false
    && manifest.executionGate?.launchCommand === null,
  `${language}: disposable profile was used, launched, or promoted`);
  acceptanceNeutral(manifest.acceptance, `${language} disposable profile`);
  invariant(manifest.accountIsolation?.mode === "same-account-separate-disposable-process-profiles"
    && manifest.accountIsolation?.additionalMacosAccountsCreated === 0
    && manifest.accountIsolation?.realUserHomeReadDefault === "deny"
    && manifest.accountIsolation?.realUserHomeWrite === "deny",
  `${language}: disposable profile isolation contract drifted`);
  const expectedEmptyKeys = [
    "audioFiles",
    "disposablePreferenceFiles",
    "logFiles",
    "rawCaptures",
    "rawFrames",
    "sharedObjectFiles",
  ];
  invariant(Object.keys(manifest.emptyState ?? {}).sort().join("|") === expectedEmptyKeys.join("|")
    && Object.values(manifest.emptyState).every((value) => value === 0),
  `${language}: disposable profile empty-state declaration is stale`);
  fingerprinted(manifest, "manifestFingerprintSha256", `${language} disposable profile`);

  const readiness = readinessFile.value;
  invariant(readiness.reportType === "g4-l3-ts006-current-account-disposable-profile-readiness"
    && readiness.executionGate?.runtimeSessionsExecuted === 0
    && readiness.executionGate?.originalRuntimeExecutionReady === false,
  `${language}: bound profile-readiness input is missing or promoted`);
  acceptanceNeutral(readiness.acceptance, `${language} profile-readiness input`);
  fingerprinted(readiness, "reportFingerprintSha256", `${language} profile-readiness input`);
  const exception = exceptionFile.value;
  invariant(exception.evidenceType === "g4-l3-ts006-user-stated-current-admin-account-exception-intake"
    && exception.taskThreadId === currentSelection.taskThreadId
    && exception.decision?.doNotCreateAdditionalMacosAccounts === true
    && exception.decision?.permitCurrentMacosAccountForEnEsCapture === true
    && exception.authorityBoundary?.runtimeExecutionAuthorizedByThisIntakeAlone === false
    && exception.authorityBoundary?.runtimeSessionExecuted === false
    && exception.authorityBoundary?.strictAcceptanceEffect === "none",
  `${language}: account-exception intake is missing or promoted`);
  const kit = kitFile.value;
  invariant(kit.evidenceType === "g4-l3-ts006-original-runtime-empty-session-kit"
    && kit.animationId === ANIMATION_ID
    && kit.language === language
    && kit.executionGate?.runtimeSessionExecuted === false
    && kit.executionGate?.originalRuntimeExecutionReady === false,
  `${language}: session kit is missing, stale, or promoted`);
  acceptanceNeutral(kit.acceptance, `${language} session kit`);
  fingerprinted(kit, "kitFingerprintSha256", `${language} session kit`);
  if (requireCurrentSourceBindings) {
    assertSourceBinding(manifest.sourceBindings?.readiness, readinessFile, READINESS, `${language} readiness`);
    assertSourceBinding(manifest.sourceBindings?.exceptionIntake, exceptionFile, EXCEPTION, `${language} exception`);
    assertSourceBinding(
      manifest.sourceBindings?.sessionKit,
      kitFile,
      `${SESSION_KITS}/${language}/kit-manifest.json`,
      `${language} session kit`,
    );
    assertSourceBinding(manifest.sourceBindings?.generator, generatorFile, PROFILE_GENERATOR, `${language} profile generator`);
    assertSourceBinding(
      manifest.sourceBindings?.projector,
      projectorFile,
      path.resolve(projectorExecutable),
      `${language} Projector`,
    );
  } else {
    invariant(manifest.sourceBindings?.readiness?.path === READINESS
      && manifest.sourceBindings?.exceptionIntake?.path === EXCEPTION
      && manifest.sourceBindings?.sessionKit?.path === `${SESSION_KITS}/${language}/kit-manifest.json`
      && manifest.sourceBindings?.generator?.path === PROFILE_GENERATOR
      && manifest.sourceBindings?.projector?.path === path.resolve(projectorExecutable)
      && [
        manifest.sourceBindings.readiness,
        manifest.sourceBindings.exceptionIntake,
        manifest.sourceBindings.sessionKit,
        manifest.sourceBindings.generator,
        manifest.sourceBindings.projector,
      ].every((binding) => Number.isInteger(binding.bytes) && binding.bytes > 0 && HASH.test(binding.sha256)),
    `${language}: immutable profile source-binding descriptors are malformed`);
  }

  const sessionRoot = resolveRelative(scope, sessionRelative);
  const profileRoot = path.join(sessionRoot, "runtime-profile");
  const sandboxPath = path.join(profileRoot, "sandbox.sb");
  invariant(manifest.sandbox?.path === sandboxPath,
    `${language}: sandbox absolute path is stale`);
  const sandboxRelative = `${sessionRelative}/runtime-profile/sandbox.sb`;
  const sandboxFile = await projectFile(scope, sandboxRelative, {json: false});
  const expectedPolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: path.resolve(projectorExecutable),
    currentHome: os.userInfo().homedir,
    userFonts: path.join(os.userInfo().homedir, "Library/Fonts"),
    sessionRoot,
  });
  invariant(sandboxFile.raw.toString("utf8") === expectedPolicy
    && manifest.sandbox.policy === expectedPolicy
    && manifest.sandbox.bytes === sandboxFile.bytes
    && manifest.sandbox.sha256 === sandboxFile.sha256,
  `${language}: sandbox policy is stale or non-canonical`);
  const expectedEnvironment = {
    HOME: path.join(profileRoot, "home"),
    CFFIXED_USER_HOME: path.join(profileRoot, "home"),
    TMPDIR: `${path.join(profileRoot, "tmp")}${path.sep}`,
    XDG_CACHE_HOME: path.join(profileRoot, "cache"),
    XDG_CONFIG_HOME: path.join(profileRoot, "config"),
    XDG_DATA_HOME: path.join(profileRoot, "data"),
  };
  invariant(stable(manifest.accountIsolation.sessionEnvironment) === stable(expectedEnvironment),
    `${language}: disposable environment binding drifted`);
  return {
    language,
    sessionId,
    manifestPath: manifestRelative,
    manifestSha256: manifestFile.sha256,
    sandboxSha256: sandboxFile.sha256,
  };
}

async function buildInputs({
  projectRoot = ROOT,
  enSessionId,
  esSessionId,
  expectedSelectionSha256,
  projectorExecutable = DEFAULT_PROJECTOR,
  now = new Date(),
} = {}) {
  invariant(HASH.test(expectedSelectionSha256), "expected current selection SHA-256 is required");
  invariant(now instanceof Date && !Number.isNaN(now.valueOf()), "transaction time is invalid");
  const scope = await context(projectRoot);
  const [currentFile, writerFile] = await Promise.all([
    projectFile(scope, SELECTION),
    projectFile(scope, SCRIPT_RELATIVE, {json: false}),
  ]);
  invariant(currentFile.sha256 === expectedSelectionSha256,
    `selection compare-and-swap preimage mismatch: expected ${expectedSelectionSha256}, found ${currentFile.sha256}`);
  const currentSelection = validateCurrentSelection(currentFile.value);
  const profiles = await Promise.all([
    readProfile(scope, {
      language: "en",
      sessionId: enSessionId,
      currentSelection,
      projectorExecutable,
    }),
    readProfile(scope, {
      language: "es",
      sessionId: esSessionId,
      currentSelection,
      projectorExecutable,
    }),
  ]);
  const transactionId = sha256(stable({
    animationId: ANIMATION_ID,
    previousSelectionSha256: currentFile.sha256,
    profiles,
    writerSha256: writerFile.sha256,
  }));
  const transactionDirectory = `${TRANSACTION_ROOT}/${transactionId}`;
  const preimagePath = `${transactionDirectory}/preimage/current-session-profile-selection.json`;
  const receiptPath = `${transactionDirectory}/selection-receipt.json`;
  const selectionPendingPath = `${INTAKE_ROOT}/.current-session-profile-selection.${transactionId}.pending`;
  const receiptPendingPath = `${transactionDirectory}/.selection-receipt.pending`;
  const rollbackPendingPath = `${INTAKE_ROOT}/.current-session-profile-selection.${transactionId}.rollback`;
  const selectionWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-current-account-disposable-profile-selection",
    selectedOn: now.toISOString().slice(0, 10),
    taskThreadId: currentSelection.taskThreadId,
    profiles,
    state: "empty-profile-candidates-not-authorized-not-launched",
    runtimeSessionsExecuted: 0,
    strictAcceptanceEffect: "none",
    selectionTransaction: {
      transactionId,
      previousSelectionSha256: currentFile.sha256,
      writer: {path: writerFile.path, bytes: writerFile.bytes, sha256: writerFile.sha256},
      immutablePreimagePath: preimagePath,
      immutableReceiptPath: receiptPath,
      exactDurableWriteAllowlist: [SELECTION, preimagePath, receiptPath],
      exactDurableDirectoryAllowlist: [
        TRANSACTION_ROOT,
        transactionDirectory,
        `${transactionDirectory}/preimage`,
      ],
      exactEphemeralWriteAllowlist: [
        LOCK,
        selectionPendingPath,
        receiptPendingPath,
        rollbackPendingPath,
      ],
      authority: "profile-selection-only",
      runtimeAuthorityCreated: false,
      acceptanceAuthorityCreated: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  const selection = {
    ...selectionWithoutFingerprint,
    selectionFingerprintSha256: sha256(stable(selectionWithoutFingerprint)),
  };
  validateCurrentSelection(selection);
  const afterBytes = Buffer.from(pretty(selection));
  const receiptWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-disposable-profile-selection-cas-receipt",
    status: "profile-selection-replaced-by-fail-closed-cas",
    transactionId,
    appliedAt: now.toISOString(),
    animationId: ANIMATION_ID,
    taskThreadId: currentSelection.taskThreadId,
    writer: {path: writerFile.path, bytes: writerFile.bytes, sha256: writerFile.sha256},
    before: {
      path: SELECTION,
      bytes: currentFile.bytes,
      sha256: currentFile.sha256,
      immutablePreimagePath: preimagePath,
    },
    after: {
      path: SELECTION,
      bytes: afterBytes.length,
      sha256: sha256(afterBytes),
    },
    selectedProfiles: profiles,
    writeBoundary: {
      exactDurableFileAllowlist: [SELECTION, preimagePath, receiptPath],
      exactDurableDirectoryAllowlist: selectionWithoutFingerprint.selectionTransaction.exactDurableDirectoryAllowlist,
      exactEphemeralFileAllowlist: selectionWithoutFingerprint.selectionTransaction.exactEphemeralWriteAllowlist,
      sourceAssetsWritten: false,
      profilesCreated: 0,
      profilesDeleted: 0,
      FlashLaunched: false,
      canonicalLedgersWritten: false,
    },
    downstreamInvalidation: {
      profileReadinessMustBeRegenerated: true,
      pendingRuntimePreflightMustBeRegenerated: true,
      sessionKitsMustNotBeReusedWithoutTheirOwnCurrentCheck: true,
    },
    executionGate: {
      externalSignaturesBound: false,
      livePreflightPassed: false,
      projectorLaunched: false,
      runtimeSessionExecuted: false,
      originalRuntimeExecutionReady: false,
    },
    acceptance: selection.acceptance,
    strictAcceptanceEffect: "none",
  };
  const receipt = {
    ...receiptWithoutFingerprint,
    receiptFingerprintSha256: sha256(stable(receiptWithoutFingerprint)),
  };
  return {
    scope,
    currentFile,
    currentSelection,
    profiles,
    selection,
    afterBytes,
    receipt,
    receiptBytes: Buffer.from(pretty(receipt)),
    transactionId,
    transactionDirectory,
    preimagePath,
    receiptPath,
    selectionPendingPath,
    receiptPendingPath,
    rollbackPendingPath,
  };
}

function exactWritePath(relativePath, inputs, {ephemeral = false} = {}) {
  const allowlist = ephemeral
    ? inputs.selection.selectionTransaction.exactEphemeralWriteAllowlist
    : inputs.selection.selectionTransaction.exactDurableWriteAllowlist;
  invariant(allowlist.includes(relativePath), `write path is outside the exact allowlist: ${relativePath}`);
  return resolveRelative(inputs.scope, relativePath);
}

async function ensureRealDirectory(scope, relativePath, {create = false} = {}) {
  const target = resolveRelative(scope, relativePath);
  if (create) {
    await mkdir(target, {mode: 0o700}).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
  }
  return assertNoSymlinkChain(scope, relativePath, {leaf: "directory"});
}

async function writeNewReadonly(file, bytes) {
  const handle = await open(file, "wx", 0o400);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(file, 0o444);
}

async function casReplace({
  target,
  beforeBytes,
  afterBytes,
  temporary,
}) {
  await writeNewReadonly(temporary, afterBytes);
  try {
    const current = await readFile(target);
    invariant(current.equals(beforeBytes), "selection compare-and-swap preimage changed before replacement");
    const metadata = await lstat(target);
    invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
      "selection target ceased to be a regular single-link file");
    await rename(temporary, target);
    invariant((await readFile(target)).equals(afterBytes), "selection CAS post-write verification failed");
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function acquireLock(inputs) {
  const lockPath = exactWritePath(LOCK, inputs, {ephemeral: true});
  const handle = await open(lockPath, "wx", 0o400).catch((error) => {
    if (error.code === "EEXIST") throw new Error("profile selection lock already exists; refusing concurrent or ambiguous selection");
    throw error;
  });
  await handle.writeFile(pretty({
    transactionId: inputs.transactionId,
    expectedSelectionSha256: inputs.currentFile.sha256,
    pid: process.pid,
    authority: "lock-only-no-runtime-authority",
  }));
  await handle.sync();
  await handle.close();
  return async () => {
    await unlink(lockPath);
  };
}

export async function planDisposableProfileSelection(options = {}) {
  const inputs = await buildInputs(options);
  return {
    mode: "dry-run",
    transactionId: inputs.transactionId,
    before: {path: SELECTION, bytes: inputs.currentFile.bytes, sha256: inputs.currentFile.sha256},
    after: {path: SELECTION, bytes: inputs.afterBytes.length, sha256: sha256(inputs.afterBytes)},
    profiles: inputs.profiles,
    durableWritesThatWouldOccur: inputs.selection.selectionTransaction.exactDurableWriteAllowlist,
    FlashLaunched: false,
    runtimeAuthorityCreated: false,
    acceptanceAuthorityCreated: false,
    strictAcceptanceEffect: "none",
  };
}

export async function applyDisposableProfileSelection(options = {}) {
  const initialScope = await context(options.projectRoot ?? ROOT);
  await ensureRealDirectory(initialScope, INTAKE_ROOT);
  const current = await projectFile(initialScope, SELECTION);
  invariant(current.sha256 === options.expectedSelectionSha256,
    `selection compare-and-swap preimage mismatch: expected ${options.expectedSelectionSha256}, found ${current.sha256}`);
  const provisional = await buildInputs(options);
  const releaseLock = await acquireLock(provisional);
  let selectionWritten = false;
  let receiptCommitted = false;
  let selectionTemporary = null;
  let receiptTemporary = null;
  try {
    const inputs = await buildInputs(options);
    invariant(inputs.transactionId === provisional.transactionId,
      "profile selection inputs changed while acquiring the transaction lock");
    await ensureRealDirectory(inputs.scope, TRANSACTION_ROOT, {create: true});
    const transactionDirectory = resolveRelative(inputs.scope, inputs.transactionDirectory);
    await mkdir(transactionDirectory, {mode: 0o700});
    await mkdir(path.join(transactionDirectory, "preimage"), {mode: 0o700});
    await assertNoSymlinkChain(inputs.scope, inputs.transactionDirectory, {leaf: "directory"});
    const preimage = exactWritePath(inputs.preimagePath, inputs);
    const receipt = exactWritePath(inputs.receiptPath, inputs);
    await writeNewReadonly(preimage, inputs.currentFile.raw);
    receiptTemporary = exactWritePath(inputs.receiptPendingPath, inputs, {ephemeral: true});
    selectionTemporary = exactWritePath(inputs.selectionPendingPath, inputs, {ephemeral: true});
    await writeNewReadonly(receiptTemporary, inputs.receiptBytes);
    const target = exactWritePath(SELECTION, inputs);
    await casReplace({
      target,
      beforeBytes: inputs.currentFile.raw,
      afterBytes: inputs.afterBytes,
      temporary: selectionTemporary,
    });
    selectionWritten = true;
    // Commit the receipt with a no-replace hard-link operation inside the
    // newly created transaction directory, then remove the staged name. This
    // avoids rename-overwrite semantics for the immutable receipt.
    await link(receiptTemporary, receipt);
    receiptCommitted = true;
    await unlink(receiptTemporary);
    receiptTemporary = null;
    return verifyDisposableProfileSelectionTransaction({
      projectRoot: inputs.scope.projectRoot,
      transactionId: inputs.transactionId,
      projectorExecutable: options.projectorExecutable ?? DEFAULT_PROJECTOR,
    });
  } catch (error) {
    if (selectionWritten && !receiptCommitted) {
      const inputs = provisional;
      const target = resolveRelative(inputs.scope, SELECTION);
      const rollback = exactWritePath(inputs.rollbackPendingPath, inputs, {ephemeral: true});
      await casReplace({
        target,
        beforeBytes: inputs.afterBytes,
        afterBytes: inputs.currentFile.raw,
        temporary: rollback,
      });
    }
    throw error;
  } finally {
    for (const temporary of [selectionTemporary, receiptTemporary]) {
      if (!temporary) continue;
      await unlink(temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    await releaseLock();
  }
}

export async function verifyDisposableProfileSelectionTransaction({
  projectRoot = ROOT,
  transactionId,
  projectorExecutable = DEFAULT_PROJECTOR,
} = {}) {
  invariant(TRANSACTION_ID.test(transactionId), "transaction id must be a SHA-256 digest");
  const scope = await context(projectRoot);
  const transactionDirectory = `${TRANSACTION_ROOT}/${transactionId}`;
  const preimagePath = `${transactionDirectory}/preimage/current-session-profile-selection.json`;
  const receiptPath = `${transactionDirectory}/selection-receipt.json`;
  const [current, preimage, receiptFile] = await Promise.all([
    projectFile(scope, SELECTION),
    projectFile(scope, preimagePath),
    projectFile(scope, receiptPath),
  ]);
  const receipt = receiptFile.value;
  invariant(receipt.schemaVersion === 1
    && receipt.evidenceType === "g4-l3-ts006-disposable-profile-selection-cas-receipt"
    && receipt.status === "profile-selection-replaced-by-fail-closed-cas"
    && receipt.transactionId === transactionId
    && receipt.before?.path === SELECTION
    && receipt.before.sha256 === preimage.sha256
    && receipt.before.bytes === preimage.bytes
    && receipt.before.immutablePreimagePath === preimagePath
    && receipt.after?.path === SELECTION
    && receipt.after.sha256 === current.sha256
    && receipt.after.bytes === current.bytes
    && receipt.writeBoundary?.sourceAssetsWritten === false
    && receipt.writeBoundary?.profilesCreated === 0
    && receipt.writeBoundary?.profilesDeleted === 0
    && receipt.writeBoundary?.FlashLaunched === false
    && receipt.writeBoundary?.canonicalLedgersWritten === false
    && receipt.executionGate?.projectorLaunched === false
    && receipt.executionGate?.runtimeSessionExecuted === false
    && receipt.executionGate?.originalRuntimeExecutionReady === false
    && receipt.strictAcceptanceEffect === "none",
  "profile selection receipt is malformed, stale, or promoted");
  acceptanceNeutral(receipt.acceptance, "profile selection receipt");
  fingerprinted(receipt, "receiptFingerprintSha256", "profile selection receipt");
  const selection = validateCurrentSelection(current.value);
  invariant(selection.selectionTransaction?.transactionId === transactionId
    && selection.selectionTransaction?.previousSelectionSha256 === preimage.sha256
    && selection.selectionTransaction?.immutablePreimagePath === preimagePath
    && selection.selectionTransaction?.immutableReceiptPath === receiptPath
    && current.sha256 === receipt.after.sha256,
  "current profile selection does not bind the immutable transaction");
  invariant(stable(selection.profiles) === stable(receipt.selectedProfiles),
    "receipt and current profile selection disagree");
  invariant(stable(selection.selectionTransaction.writer) === stable(receipt.writer)
    && stable(selection.selectionTransaction.exactDurableWriteAllowlist)
      === stable(receipt.writeBoundary.exactDurableFileAllowlist)
    && stable(selection.selectionTransaction.exactDurableDirectoryAllowlist)
      === stable(receipt.writeBoundary.exactDurableDirectoryAllowlist)
    && stable(selection.selectionTransaction.exactEphemeralWriteAllowlist)
      === stable(receipt.writeBoundary.exactEphemeralFileAllowlist),
  "selection and receipt write-boundary bindings disagree");
  const recomputedTransactionId = sha256(stable({
    animationId: ANIMATION_ID,
    previousSelectionSha256: preimage.sha256,
    profiles: selection.profiles,
    writerSha256: receipt.writer.sha256,
  }));
  invariant(recomputedTransactionId === transactionId,
    "profile selection transaction identity does not bind its exact inputs");
  for (const relativePath of [preimagePath, receiptPath]) {
    const metadata = await stat(resolveRelative(scope, relativePath));
    invariant((metadata.mode & 0o222) === 0,
      `${relativePath}: immutable transaction file became writable`);
  }
  const verifiedProfiles = await Promise.all(selection.profiles.map((selected) => readProfile(scope, {
    language: selected.language,
    sessionId: selected.sessionId,
    currentSelection: selection,
    projectorExecutable,
    allowCurrentlySelected: true,
    // The profile was selected only after exact-current source checks. The
    // readiness report is then intentionally regenerated from the new
    // selection, so rechecking its old predecessor hash would create a
    // circular invalidation. The immutable manifest and selection receipt bind
    // that predecessor; post-selection checks still require current fail-closed
    // source semantics plus an exact runtime-profile control tree.
    requireCurrentSourceBindings: false,
  })));
  invariant(stable(verifiedProfiles) === stable(selection.profiles),
    "current profile manifest or sandbox bytes differ from the selected hashes");
  return {
    mode: "verified",
    transactionId,
    selection: {path: SELECTION, bytes: current.bytes, sha256: current.sha256},
    preimage: {path: preimagePath, bytes: preimage.bytes, sha256: preimage.sha256, readOnly: true},
    receipt: {path: receiptPath, bytes: receiptFile.bytes, sha256: receiptFile.sha256, readOnly: true},
    profiles: selection.profiles,
    FlashLaunched: false,
    runtimeAuthorityCreated: false,
    acceptanceAuthorityCreated: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(options.mode === undefined, "supply exactly one of --dry-run, --apply, or --check");
      options.mode = argument.slice(2);
    } else if (argument === "--en-session-id") options.enSessionId = argv[++index];
    else if (argument === "--es-session-id") options.esSessionId = argv[++index];
    else if (argument === "--expected-selection-sha256") options.expectedSelectionSha256 = argv[++index];
    else if (argument === "--transaction-id") options.transactionId = argv[++index];
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(["dry-run", "apply", "check"].includes(options.mode),
    "supply exactly one of --dry-run, --apply, or --check");
  if (options.mode === "check") {
    invariant(TRANSACTION_ID.test(options.transactionId)
      && options.enSessionId === undefined
      && options.esSessionId === undefined
      && options.expectedSelectionSha256 === undefined,
    "--check requires only --transaction-id <sha256>");
  } else {
    invariant(SESSION_ID.test(options.enSessionId)
      && options.enSessionId.startsWith("ts006-en-")
      && SESSION_ID.test(options.esSessionId)
      && options.esSessionId.startsWith("ts006-es-")
      && HASH.test(options.expectedSelectionSha256)
      && options.transactionId === undefined,
    `${options.mode} requires --en-session-id, --es-session-id, and --expected-selection-sha256`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = options.mode === "dry-run"
    ? await planDisposableProfileSelection(options)
    : options.mode === "apply"
      ? await applyDisposableProfileSelection(options)
      : await verifyDisposableProfileSelectionTransaction(options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
