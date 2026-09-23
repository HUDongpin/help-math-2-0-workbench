#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {renderCurrentAccountSandboxProfile, validateCurrentAccountProfileReadiness} from "./build-g4-l3-ts006-current-account-profile-readiness.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_ARTIFACT_ROOT = path.join(ROOT, "artifacts/full-frame/g4-l3");
const PROJECTOR_EXECUTABLE = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";
const PROJECTOR_SHA256 = "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const READINESS = "reports/g4-l3-ts006-current-account-profile-readiness.json";
const EXACT_HISTORICAL_READINESS_SHA256S = new Set([
  // Predecessor with every LaunchServices lookup denied.
  "3a6f2618486ef9e77520c965e282977024314f26d3c0a93106b711c2be64b0be",
  // Predecessor with only com.apple.lsd.modifydb restored. The first live
  // smoke proved com.apple.lsd.mapdb is also required for AppKit window init.
  "cdde2c5224a7a9295b7874c28f58d92435f72c1e2147dd0d28dd37469a46b66b",
]);
const EXCEPTION = "work/g4-l3-ts006-original-runtime-authorization-intake/current-admin-account-exception-intake.json";
const SESSION_KITS = "work/g4-l3-ts006-original-runtime-session-kits";
const SESSION_ID = /^ts006-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readBoundFile(filePath, {json = true} = {}) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1, `${filePath} must be a regular non-linked file`);
  const bytes = await readFile(filePath);
  return {path: filePath, bytes: bytes.length, sha256: sha256(bytes), ...(json ? {value: JSON.parse(bytes)} : {})};
}

async function assertEmptyDirectory(directory, label) {
  const entries = await readdir(directory);
  invariant(entries.length === 0, `${label} must be empty`);
}

function sessionEnvironment(profileRoot) {
  const home = path.join(profileRoot, "home");
  return {
    HOME: home,
    CFFIXED_USER_HOME: home,
    TMPDIR: `${path.join(profileRoot, "tmp")}${path.sep}`,
    XDG_CACHE_HOME: path.join(profileRoot, "cache"),
    XDG_CONFIG_HOME: path.join(profileRoot, "config"),
    XDG_DATA_HOME: path.join(profileRoot, "data"),
  };
}

export function validateDisposableProfileManifest(manifest) {
  invariant(manifest.schemaVersion === 1
    && manifest.evidenceType === "g4-l3-ts006-empty-current-account-disposable-runtime-profile"
    && ["en", "es"].includes(manifest.language)
    && SESSION_ID.test(manifest.sessionId)
    && manifest.sessionId.startsWith(`ts006-${manifest.language}-`)
    && manifest.status === "empty-profile-candidate-not-authorized-not-launched",
  "disposable profile manifest identity drifted");
  invariant(manifest.accountIsolation?.mode === "same-account-separate-disposable-process-profiles"
    && manifest.accountIsolation?.additionalMacosAccountsCreated === 0
    && manifest.accountIsolation?.realUserHomeReadDefault === "deny"
    && manifest.accountIsolation?.realUserHomeWrite === "deny",
  "disposable profile account-isolation contract drifted");
  invariant(manifest.executionGate?.externalSignaturesBound === false
    && manifest.executionGate?.livePreflightPassed === false
    && manifest.executionGate?.projectorLaunched === false
    && manifest.executionGate?.runtimeSessionExecuted === false
    && manifest.executionGate?.launchCommand === null,
  "disposable profile manifest was improperly promoted or made executable");
  invariant(Object.entries(manifest.acceptance ?? {}).every(([key, value]) => key === "acceptanceNeutral" ? value === true : value === false),
    "disposable profile manifest contains an acceptance claim");
  invariant(manifest.sourceBindings?.projector?.path === PROJECTOR_EXECUTABLE,
    "disposable profile Projector path drifted");
  const sandboxPath = manifest.sandbox?.path;
  invariant(typeof sandboxPath === "string" && path.isAbsolute(sandboxPath)
    && path.basename(sandboxPath) === "sandbox.sb"
    && path.basename(path.dirname(sandboxPath)) === "runtime-profile",
  "disposable profile sandbox path drifted");
  const profileRoot = path.dirname(sandboxPath);
  const sessionRoot = path.dirname(profileRoot);
  invariant(manifest.accountIsolation?.sessionEnvironment?.HOME === path.join(profileRoot, "home"),
    "disposable profile HOME binding drifted");
  const expectedPolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: PROJECTOR_EXECUTABLE,
    currentHome: os.userInfo().homedir,
    userFonts: path.join(os.userInfo().homedir, "Library/Fonts"),
    sessionRoot,
  });
  invariant(manifest.sandbox.policy === expectedPolicy
    && manifest.sandbox.bytes === Buffer.byteLength(expectedPolicy)
    && manifest.sandbox.sha256 === sha256(expectedPolicy),
  "disposable profile sandbox policy is not the canonical exact policy");
  const {manifestFingerprintSha256, ...withoutFingerprint} = manifest;
  invariant(HASH.test(manifestFingerprintSha256) && manifestFingerprintSha256 === sha256(stable(withoutFingerprint)),
    "disposable profile manifest fingerprint drifted");
  return manifest;
}

async function verifyPreparedTree(root, manifest) {
  const rootMetadata = await lstat(root);
  invariant(rootMetadata.isDirectory() && !rootMetadata.isSymbolicLink() && (rootMetadata.mode & 0o777) === 0o700,
    "disposable profile root must be a real 0700 directory");
  const profileRoot = path.join(root, "runtime-profile");
  const expectedDirectories = [
    profileRoot,
    path.join(profileRoot, "home"),
    path.join(profileRoot, "home/Library"),
    path.join(profileRoot, "home/Library/Preferences"),
    path.join(profileRoot, "home/Library/Preferences/Macromedia"),
    path.join(profileRoot, "home/Library/Preferences/Macromedia/Flash Player"),
    path.join(profileRoot, "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects"),
    path.join(profileRoot, "home/Library/Application Support"),
    path.join(profileRoot, "home/Library/Application Support/Macromedia"),
    path.join(profileRoot, "home/Library/Application Support/Macromedia/Flash Player"),
    path.join(profileRoot, "tmp"),
    path.join(profileRoot, "cache"),
    path.join(profileRoot, "config"),
    path.join(profileRoot, "data"),
    path.join(root, "evidence"),
    path.join(root, "evidence/raw-frames"),
    path.join(root, "evidence/raw-captures"),
    path.join(root, "evidence/audio"),
    path.join(root, "evidence/logs"),
  ];
  for (const directory of expectedDirectories) {
    const metadata = await lstat(directory);
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink() && (metadata.mode & 0o777) === 0o700,
      `${directory} must be a real 0700 directory`);
  }
  await assertEmptyDirectory(path.join(profileRoot, "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects"), "SharedObject store");
  await assertEmptyDirectory(path.join(root, "evidence/raw-frames"), "raw frame directory");
  await assertEmptyDirectory(path.join(root, "evidence/raw-captures"), "raw capture directory");
  await assertEmptyDirectory(path.join(root, "evidence/audio"), "audio evidence directory");
  await assertEmptyDirectory(path.join(root, "evidence/logs"), "log evidence directory");
  const files = (await readdir(root, {recursive: true, withFileTypes: true}))
    .filter((entry) => entry.isFile()).map((entry) => path.relative(root, path.join(entry.parentPath, entry.name))).sort();
  invariant(JSON.stringify(files) === JSON.stringify(["profile-manifest.json", "runtime-profile/sandbox.sb"]),
    `disposable profile tree contains unexpected files: ${files.join(", ")}`);
  const sandbox = await readFile(path.join(profileRoot, "sandbox.sb"), "utf8");
  invariant(sha256(sandbox) === manifest.sandbox.sha256 && sandbox === manifest.sandbox.policy,
    "disposable profile sandbox policy differs from manifest");
  validateDisposableProfileManifest(JSON.parse(await readFile(path.join(root, "profile-manifest.json"), "utf8")));
}

export async function prepareDisposableRuntimeProfile({
  projectRoot = ROOT,
  artifactRoot = DEFAULT_ARTIFACT_ROOT,
  language,
  sessionId,
} = {}) {
  invariant(["en", "es"].includes(language), "--language must be en or es");
  invariant(SESSION_ID.test(sessionId) && sessionId.startsWith(`ts006-${language}-`),
    `session id must match ts006-${language}-<uuid>`);
  const [readinessBinding, exceptionBinding, kitBinding, projectorBinding, generatorBinding] = await Promise.all([
    readBoundFile(path.join(projectRoot, READINESS)),
    readBoundFile(path.join(projectRoot, EXCEPTION)),
    readBoundFile(path.join(projectRoot, SESSION_KITS, language, "kit-manifest.json")),
    readBoundFile(PROJECTOR_EXECUTABLE, {json: false}),
    readBoundFile(SCRIPT_PATH, {json: false}),
  ]);
  const readiness = validateCurrentAccountProfileReadiness(readinessBinding.value, {
    // One exact historical readiness report predates the narrowly scoped
    // LaunchServices self-registration allowance. It is accepted only as the
    // immutable input needed to rotate into fresh profiles whose policy and
    // subsequent readiness report carry the corrected boundary.
    allowExactLegacyLaunchServicesBoundary:
      EXACT_HISTORICAL_READINESS_SHA256S.has(readinessBinding.sha256),
  });
  const exception = exceptionBinding.value;
  const kit = kitBinding.value;
  invariant(exception.localExecutionContext?.accountIdentifier === os.userInfo().username
    && exception.localExecutionContext?.homeDirectory === os.userInfo().homedir
    && exception.decision?.doNotCreateAdditionalMacosAccounts === true,
  "current account differs from the owner-requested exception intake");
  invariant(kit.animationId === "course-g04-l03-ts-006" && kit.language === language
    && kit.accountIsolationCandidate?.mode === "same-account-separate-disposable-process-profiles"
    && kit.executionGate?.runtimeSessionExecuted === false,
  "language session kit is missing, stale, or promoted");
  invariant(projectorBinding.sha256 === PROJECTOR_SHA256, "Flash Projector executable hash drifted");

  await mkdir(artifactRoot, {recursive: true, mode: 0o700});
  const artifactReal = await realpath(artifactRoot);
  const finalRoot = path.join(artifactRoot, sessionId);
  invariant(!(await lstat(finalRoot).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error))),
    "refusing to overwrite an existing disposable session profile");
  const temporary = await mkdtemp(path.join(artifactRoot, `.ts006-${language}-profile-`));
  await chmod(temporary, 0o700);
  const profileRoot = path.join(temporary, "runtime-profile");
  const directories = [
    "home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
    "home/Library/Application Support/Macromedia/Flash Player",
    "tmp", "cache", "config", "data",
  ];
  for (const directory of directories) await mkdir(path.join(profileRoot, directory), {recursive: true, mode: 0o700});
  for (const directory of ["raw-frames", "raw-captures", "audio", "logs"]) await mkdir(path.join(temporary, "evidence", directory), {recursive: true, mode: 0o700});
  const finalProfileRoot = path.join(finalRoot, "runtime-profile");
  const environment = sessionEnvironment(finalProfileRoot);
  const policy = renderCurrentAccountSandboxProfile({
    allowedExecutable: PROJECTOR_EXECUTABLE,
    currentHome: os.userInfo().homedir,
    userFonts: path.join(os.userInfo().homedir, "Library/Fonts"),
    sessionRoot: finalRoot,
  });
  await writeFile(path.join(profileRoot, "sandbox.sb"), policy, {flag: "wx", mode: 0o400});
  const manifestWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-empty-current-account-disposable-runtime-profile",
    status: "empty-profile-candidate-not-authorized-not-launched",
    animationId: "course-g04-l03-ts-006",
    language,
    sessionId,
    createdAt: new Date().toISOString(),
    sourceBindings: {
      readiness: {path: READINESS, bytes: readinessBinding.bytes, sha256: readinessBinding.sha256},
      exceptionIntake: {path: EXCEPTION, bytes: exceptionBinding.bytes, sha256: exceptionBinding.sha256},
      sessionKit: {path: path.join(SESSION_KITS, language, "kit-manifest.json"), bytes: kitBinding.bytes, sha256: kitBinding.sha256},
      generator: {path: path.relative(projectRoot, SCRIPT_PATH), bytes: generatorBinding.bytes, sha256: generatorBinding.sha256},
      projector: {path: PROJECTOR_EXECUTABLE, bytes: projectorBinding.bytes, sha256: projectorBinding.sha256},
    },
    accountIsolation: {
      mode: "same-account-separate-disposable-process-profiles",
      accountIdentifierSha256: readiness.currentExecutionContext.accountIdentifierSha256,
      additionalMacosAccountsCreated: 0,
      realUserHomeReadDefault: "deny",
      realUserHomeWrite: "deny",
      userFontsRead: "allow-after-separate-hash-binding",
      sessionEnvironment: environment,
    },
    sandbox: {path: path.join(finalProfileRoot, "sandbox.sb"), bytes: Buffer.byteLength(policy), sha256: sha256(policy), policy},
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
  const manifest = {...manifestWithoutFingerprint, manifestFingerprintSha256: sha256(stable(manifestWithoutFingerprint))};
  validateDisposableProfileManifest(manifest);
  await writeFile(path.join(temporary, "profile-manifest.json"), pretty(manifest), {flag: "wx", mode: 0o400});
  await rename(temporary, finalRoot);
  invariant((await realpath(finalRoot)).startsWith(`${artifactReal}${path.sep}`), "prepared session root escapes the artifact root");
  await verifyPreparedTree(finalRoot, manifest);
  return {sessionId, language, path: finalRoot, manifest};
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--language") options.language = argv[++index];
    else if (argument === "--session-id") options.sessionId = argv[++index];
    else if (argument === "--new-session-id") options.newSessionId = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(options.language, "--language is required");
  invariant(Boolean(options.sessionId) !== Boolean(options.newSessionId), "supply exactly one of --session-id or --new-session-id");
  if (options.newSessionId) options.sessionId = `ts006-${options.language}-${randomUUID()}`;
  delete options.newSessionId;
  return options;
}

async function main() {
  const result = await prepareDisposableRuntimeProfile(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify({sessionId: result.sessionId, language: result.language, path: result.path, projectorLaunched: false, acceptanceEffect: "none"})}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
