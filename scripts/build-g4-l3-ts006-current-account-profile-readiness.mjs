#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, rename, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REPORT_JSON = "reports/g4-l3-ts006-current-account-profile-readiness.json";
const REPORT_MARKDOWN = "reports/g4-l3-ts006-current-account-profile-readiness.md";
const ACCOUNT_EXCEPTION = "work/g4-l3-ts006-original-runtime-authorization-intake/current-admin-account-exception-intake.json";
const PROFILE_SELECTION = "work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json";
const KIT_READINESS = "reports/g4-l3-ts006-original-runtime-session-kit-readiness.json";
const SANDBOX_EXEC = "/usr/bin/sandbox-exec";
const HASH = /^[a-f0-9]{64}$/u;

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

function absolute(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function bindFile(relativePath, {json = true} = {}) {
  const target = absolute(relativePath);
  const metadata = await lstat(target);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath} must be a regular non-linked file`);
  const bytes = await readFile(target);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...(json ? {value: JSON.parse(bytes)} : {}),
  };
}

async function bindAbsoluteFile(filePath) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${filePath} must be a regular file`);
  const bytes = await readFile(filePath);
  return {path: filePath, bytes: bytes.length, sha256: sha256(bytes), mode: (metadata.mode & 0o777).toString(8).padStart(4, "0")};
}

function sbplLiteral(value) {
  return JSON.stringify(value);
}

const NORMALIZED_SANDBOX_INPUTS = Object.freeze({
  allowedExecutable: "/__ALLOWLISTED_EXECUTABLE__",
  currentHome: "/__CURRENT_ACCOUNT_HOME__",
  userFonts: "/__CURRENT_ACCOUNT_HOME__/Library/Fonts",
  sessionRoot: "/__LANGUAGE_SESSION_ROOT__",
});

function renderSandboxProfile({
  allowedExecutable,
  currentHome,
  userFonts,
  sessionRoot,
  exactLaunchServicesLookups,
}) {
  for (const value of [allowedExecutable, currentHome, userFonts, sessionRoot]) {
    invariant(path.isAbsolute(value), `sandbox path must be absolute: ${value}`);
  }
  invariant(Array.isArray(exactLaunchServicesLookups)
    && exactLaunchServicesLookups.every((service) => ["com.apple.lsd.modifydb", "com.apple.lsd.mapdb"].includes(service))
    && new Set(exactLaunchServicesLookups).size === exactLaunchServicesLookups.length,
  "sandbox exact LaunchServices lookup set is invalid");
  return [
    "(version 1)",
    "(allow default)",
    "(deny network*)",
    "(deny appleevent-send)",
    "(deny process-exec)",
    `(allow process-exec (literal ${sbplLiteral(allowedExecutable)}))`,
    `(deny file-read* (subpath ${sbplLiteral(currentHome)}))`,
    `(allow file-read* (subpath ${sbplLiteral(userFonts)}))`,
    `(deny mach-lookup
  (require-any
    (global-name "com.apple.lsd.open")
    (global-name "com.apple.lsd.modifydb")
    (global-name-regex #"^com\\.apple\\.lsd\\.")))`,
    // Flash Player's empty-projector startup both registers its own bundle and
    // maps the LaunchServices database while AppKit initializes its window.
    // Keep host-open and every other lsd service denied while restoring only
    // those two exact startup lookups after the broad deny.
    ...exactLaunchServicesLookups.map((service) =>
      `(allow mach-lookup (global-name ${sbplLiteral(service)}))`),
    `(deny file-write*
  (require-all
    (require-not (subpath ${sbplLiteral(sessionRoot)}))
    (require-not (subpath "/private/var/folders"))
    (require-not (subpath "/private/tmp"))
    (require-not (literal "/dev/null"))))`,
    `(allow file-read* file-write* (subpath ${sbplLiteral(sessionRoot)}))`,
    "",
  ].join("\n");
}

export function renderCurrentAccountSandboxProfile(inputs) {
  return renderSandboxProfile({
    ...inputs,
    exactLaunchServicesLookups: ["com.apple.lsd.modifydb", "com.apple.lsd.mapdb"],
  });
}

function renderHistoricalSandboxProfile(inputs, exactLaunchServicesLookups) {
  return renderSandboxProfile({...inputs, exactLaunchServicesLookups});
}

async function runProbe(executable, args, options = {}) {
  try {
    const result = await execFileAsync(executable, args, {encoding: "utf8", timeout: 10_000, ...options});
    return {exitCode: 0, stdout: result.stdout, stderr: result.stderr};
  } catch (error) {
    return {
      exitCode: Number.isInteger(error.code) ? error.code : null,
      signal: error.signal ?? null,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? error.message ?? "",
    };
  }
}

async function runSandboxProbes({currentHome, userFonts}) {
  const probeRoot = absolute("work/g4-l3-ts006-current-account-sandbox-probe");
  await mkdir(probeRoot, {recursive: true, mode: 0o700});

  const exactExecPolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/usr/bin/true", currentHome, userFonts, sessionRoot: probeRoot,
  });
  const exactExec = await runProbe(SANDBOX_EXEC, ["-p", exactExecPolicy, "/usr/bin/true"]);
  const otherExec = await runProbe(SANDBOX_EXEC, ["-p", exactExecPolicy, "/bin/test", "-d", probeRoot]);

  const networkPolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/usr/bin/ruby", currentHome, userFonts, sessionRoot: probeRoot,
  });
  const network = await runProbe(SANDBOX_EXEC, [
    "-p", networkPolicy,
    "/usr/bin/ruby", "--disable-gems", "-rsocket", "-e",
    "Socket.tcp('127.0.0.1', 9, connect_timeout: 1)",
  ]);

  const readPolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/bin/test", currentHome, userFonts, sessionRoot: probeRoot,
  });
  const privateHomeRead = await runProbe(SANDBOX_EXEC, ["-p", readPolicy, "/bin/test", "-r", path.join(currentHome, "Library/Preferences")]);
  const userFontsRead = await runProbe(SANDBOX_EXEC, ["-p", readPolicy, "/bin/test", "-r", userFonts]);

  const forbiddenWritePath = path.join(currentHome, "Library/Preferences/.codex-g4-l3-ts006-sandbox-probe");
  invariant(!(await lstat(forbiddenWritePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error))),
    "refusing to use an existing home-write probe path");
  const writePolicy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/usr/bin/touch", currentHome, userFonts, sessionRoot: probeRoot,
  });
  const privateHomeWrite = await runProbe(SANDBOX_EXEC, ["-p", writePolicy, "/usr/bin/touch", forbiddenWritePath]);
  invariant(!(await lstat(forbiddenWritePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error))),
    "sandbox unexpectedly created the forbidden home-write probe file");
  const allowedWritePath = path.join(probeRoot, `.allowed-write-${process.pid}`);
  invariant(!(await lstat(allowedWritePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error))),
    "refusing to overwrite an existing allowed-write probe path");
  const sessionRootWrite = await runProbe(SANDBOX_EXEC, ["-p", writePolicy, "/usr/bin/touch", allowedWritePath]);
  const allowedWriteMetadata = await lstat(allowedWritePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (allowedWriteMetadata) await unlink(allowedWritePath);

  const result = {
    exactAllowlistedExecutableRuns: exactExec.exitCode === 0,
    nonAllowlistedExecutableDenied: otherExec.exitCode !== 0 && /Operation not permitted|failed/u.test(otherExec.stderr),
    loopbackNetworkConnectDenied: network.exitCode !== 0 && /Operation not permitted/u.test(network.stderr),
    privateHomeReadDenied: privateHomeRead.exitCode !== 0,
    allowlistedUserFontsReadAllowed: userFontsRead.exitCode === 0,
    privateHomeWriteDenied: privateHomeWrite.exitCode !== 0 && /Operation not permitted/u.test(privateHomeWrite.stderr),
    sessionRootWriteAllowed: sessionRootWrite.exitCode === 0 && Boolean(allowedWriteMetadata?.isFile()),
    externalNetworkContactAttempted: false,
    flashProjectorLaunched: false,
  };
  invariant(Object.entries(result).every(([key, value]) => key === "externalNetworkContactAttempted" || key === "flashProjectorLaunched" ? value === false : value === true),
    `current-account sandbox probe failed: ${JSON.stringify(result)}`);
  return result;
}

async function readCommand(executable, args) {
  const {stdout} = await execFileAsync(executable, args, {encoding: "utf8", timeout: 10_000});
  return stdout.trim();
}

async function accountExists(accountIdentifier) {
  const result = await runProbe("/usr/bin/dscl", [".", "-read", `/Users/${accountIdentifier}`]);
  return result.exitCode === 0;
}

export async function buildCurrentAccountProfileReadiness() {
  const [exception, profileSelection, kitReadiness, generator, sandboxExecutable] = await Promise.all([
    bindFile(ACCOUNT_EXCEPTION),
    bindFile(PROFILE_SELECTION),
    bindFile(KIT_READINESS),
    bindFile(path.relative(ROOT, SCRIPT_PATH), {json: false}),
    bindAbsoluteFile(SANDBOX_EXEC),
  ]);
  const decision = exception.value;
  invariant(decision.evidenceType === "g4-l3-ts006-user-stated-current-admin-account-exception-intake"
    && decision.decision?.doNotCreateAdditionalMacosAccounts === true
    && decision.decision?.permitCurrentMacosAccountForEnEsCapture === true
    && decision.authorityBoundary?.runtimeExecutionAuthorizedByThisIntakeAlone === false,
  "account exception intake is missing or improperly promoted");
  invariant(kitReadiness.value.reportType === "g4-l3-ts006-original-runtime-session-kit-readiness"
    && kitReadiness.value.readiness?.currentAdminAccountExceptionIntentRecorded === true
    && kitReadiness.value.readiness?.additionalMacosAccountsRequired === 0
    && kitReadiness.value.readiness?.runtimeSessionsExecuted === 0,
  "TS006 session-kit readiness has not adopted the current-account exception");

  const selection = profileSelection.value;
  invariant(selection.evidenceType === "g4-l3-ts006-current-account-disposable-profile-selection"
    && selection.taskThreadId === decision.taskThreadId
    && selection.profiles?.map(({language}) => language).join("|") === "en|es"
    && selection.state === "empty-profile-candidates-not-authorized-not-launched"
    && selection.runtimeSessionsExecuted === 0
    && selection.strictAcceptanceEffect === "none",
  "selected disposable profile candidates are missing or promoted");
  const preparedProfiles = await Promise.all(selection.profiles.map(async (selected) => {
    const manifestBinding = await bindFile(selected.manifestPath);
    const manifest = manifestBinding.value;
    invariant(manifestBinding.sha256 === selected.manifestSha256
      && manifest.evidenceType === "g4-l3-ts006-empty-current-account-disposable-runtime-profile"
      && manifest.language === selected.language
      && manifest.sessionId === selected.sessionId
      && manifest.status === "empty-profile-candidate-not-authorized-not-launched"
      && manifest.executionGate?.projectorLaunched === false
      && manifest.executionGate?.runtimeSessionExecuted === false
      && manifest.executionGate?.launchCommand === null
      && manifest.sandbox?.sha256 === selected.sandboxSha256,
    `selected ${selected.language} disposable profile manifest is stale or promoted`);
    const sandboxRelative = path.relative(ROOT, manifest.sandbox.path);
    const sandboxBinding = await bindFile(sandboxRelative, {json: false});
    invariant(sandboxBinding.sha256 === selected.sandboxSha256 && sandboxBinding.sha256 === manifest.sandbox.sha256,
      `selected ${selected.language} disposable profile sandbox is stale`);
    const sessionRoot = path.dirname(absolute(selected.manifestPath));
    for (const relative of [
      "runtime-profile/home/Library/Preferences/Macromedia/Flash Player/#SharedObjects",
      "evidence/raw-frames", "evidence/raw-captures", "evidence/audio", "evidence/logs",
    ]) invariant((await readdir(path.join(sessionRoot, relative))).length === 0,
      `selected ${selected.language} disposable profile is no longer empty`);
    return {
      language: selected.language,
      sessionId: selected.sessionId,
      manifest: {path: selected.manifestPath, bytes: manifestBinding.bytes, sha256: manifestBinding.sha256},
      sandbox: {path: sandboxRelative, bytes: sandboxBinding.bytes, sha256: sandboxBinding.sha256},
      projectorLaunched: false,
      runtimeSessionExecuted: false,
    };
  }));

  const user = os.userInfo();
  const expected = decision.localExecutionContext;
  invariant(user.username === expected.accountIdentifier && user.homedir === expected.homeDirectory,
    "current process is not running under the owner-approved local account candidate");
  const groups = (await readCommand("/usr/bin/id", ["-Gn", user.username])).split(/\s+/u);
  invariant(groups.includes("admin"), "current account is not the recorded administrator account candidate");
  const newAccountsAbsent = await Promise.all(["helpmath_g4l3_en", "helpmath_g4l3_es"].map(async (accountIdentifier) => ({
    accountIdentifierSha256: sha256(accountIdentifier),
    absent: !(await accountExists(accountIdentifier)),
  })));
  invariant(newAccountsAbsent.every(({absent}) => absent), "an unwanted TS006 language account exists");

  const userFonts = path.join(user.homedir, "Library/Fonts");
  const fontMetadata = await lstat(userFonts);
  invariant(fontMetadata.isDirectory() && !fontMetadata.isSymbolicLink(), "user font allowlist root must be a real directory");
  const probes = await runSandboxProbes({currentHome: user.homedir, userFonts});
  const [computerName, localHostName, osVersion, osBuild] = await Promise.all([
    readCommand("/usr/sbin/scutil", ["--get", "ComputerName"]),
    readCommand("/usr/sbin/scutil", ["--get", "LocalHostName"]),
    readCommand("/usr/bin/sw_vers", ["-productVersion"]),
    readCommand("/usr/bin/sw_vers", ["-buildVersion"]),
  ]);
  const hostIdentitySha256 = sha256(stable({computerName, localHostName, osVersion, osBuild, architecture: os.arch()}));
  const normalizedPolicy = renderCurrentAccountSandboxProfile(NORMALIZED_SANDBOX_INPUTS);

  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-current-account-disposable-profile-readiness",
    generatedOn: new Date().toISOString().slice(0, 10),
    generator: {path: generator.path, bytes: generator.bytes, sha256: generator.sha256},
    sourceBindings: {
      accountExceptionIntake: {path: exception.path, bytes: exception.bytes, sha256: exception.sha256},
      profileSelection: {path: profileSelection.path, bytes: profileSelection.bytes, sha256: profileSelection.sha256},
      sessionKitReadiness: {path: kitReadiness.path, bytes: kitReadiness.bytes, sha256: kitReadiness.sha256},
      sandboxExecutable,
    },
    scope: {
      animationId: "course-g04-l03-ts-006",
      languages: ["en", "es"],
      accountIsolationMode: expected.candidateIsolationMode,
      additionalMacosAccountsRequired: 0,
      additionalMacosAccountsCreated: 0,
    },
    currentExecutionContext: {
      accountIdentifierSha256: sha256(user.username),
      uid: user.uid,
      accountClass: expected.accountClass,
      administratorGroupPresent: true,
      homePathPublished: false,
      iCloudStateInspected: false,
      iCloudStateReason: "privacy boundary; host and process no-egress controls remain mandatory",
      hostIdentitySha256,
      osVersion,
      osBuild,
      architecture: os.arch(),
      unwantedLanguageAccounts: newAccountsAbsent,
    },
    disposableProfileContract: {
      oneFreshProfilePerLanguage: true,
      environmentVariables: ["HOME", "CFFIXED_USER_HOME", "TMPDIR", "XDG_CACHE_HOME", "XDG_CONFIG_HOME", "XDG_DATA_HOME"],
      realUserHomeReadDefault: "deny",
      realUserHomeWrite: "deny",
      userFontDirectoryRead: "allow-after-separate-hash-binding",
      network: "deny-all-at-process-boundary-plus-live-host-network-disable",
      childProcessExecution: "deny-except-exact-projector-executable",
      launchServicesHostOpenMachLookup: "deny-com.apple.lsd.open",
      launchServicesOtherMachLookups: "deny-com.apple.lsd-regex",
      launchServicesSelfRegistrationMachLookup: "allow-exact-com.apple.lsd.modifydb",
      launchServicesDatabaseMapMachLookup: "allow-exact-com.apple.lsd.mapdb",
      profileRootPattern: "artifacts/full-frame/g4-l3/<session-id>/runtime-profile",
      normalizedSandboxPolicySha256: sha256(normalizedPolicy),
      normalizedSandboxPolicy: normalizedPolicy,
    },
    preparedProfileCandidates: preparedProfiles,
    technicalProbes: probes,
    executionGate: {
      userAccountExceptionIntentRecorded: true,
      technicalSandboxCapabilitiesVerified: true,
      externalOwnerExceptionSignatureBound: false,
      namedOperatorsBound: 0,
      externalTrustRootBound: false,
      liveHostNetworkDisableVerified: false,
      emptyDisposableProfileCandidatesPrepared: preparedProfiles.length,
      liveDisposableProfilesPrepared: 0,
      livePreflightsPassed: 0,
      runtimeSessionsExecuted: 0,
      originalRuntimeExecutionReady: false,
      state: "technical-capability-proved-awaiting-external-signatures-roles-and-live-session-preflight",
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
  return {...reportWithoutFingerprint, reportFingerprintSha256: sha256(stable(reportWithoutFingerprint))};
}

export function validateCurrentAccountProfileReadiness(
  report,
  {allowExactLegacyLaunchServicesBoundary = false} = {},
) {
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-ts006-current-account-disposable-profile-readiness"
    && report.scope?.accountIsolationMode === "same-account-separate-disposable-process-profiles"
    && report.scope?.additionalMacosAccountsRequired === 0
    && report.scope?.additionalMacosAccountsCreated === 0,
  "current-account profile readiness scope drifted");
  invariant(report.technicalProbes?.exactAllowlistedExecutableRuns === true
    && report.technicalProbes?.nonAllowlistedExecutableDenied === true
    && report.technicalProbes?.loopbackNetworkConnectDenied === true
    && report.technicalProbes?.privateHomeReadDenied === true
    && report.technicalProbes?.allowlistedUserFontsReadAllowed === true
    && report.technicalProbes?.privateHomeWriteDenied === true
    && report.technicalProbes?.sessionRootWriteAllowed === true
    && report.technicalProbes?.externalNetworkContactAttempted === false
    && report.technicalProbes?.flashProjectorLaunched === false,
  "current-account sandbox capability proof failed");
  const contract = report.disposableProfileContract ?? {};
  const currentPolicy = renderCurrentAccountSandboxProfile(NORMALIZED_SANDBOX_INPUTS);
  const launchServicesBoundaryIsCurrent =
    contract.launchServicesHostOpenMachLookup === "deny-com.apple.lsd.open"
    && contract.launchServicesOtherMachLookups === "deny-com.apple.lsd-regex"
    && contract.launchServicesSelfRegistrationMachLookup === "allow-exact-com.apple.lsd.modifydb"
    && contract.launchServicesDatabaseMapMachLookup === "allow-exact-com.apple.lsd.mapdb"
    && contract.normalizedSandboxPolicy === currentPolicy
    && contract.normalizedSandboxPolicySha256 === sha256(currentPolicy);
  const historicalNoLookupPolicy = renderHistoricalSandboxProfile(NORMALIZED_SANDBOX_INPUTS, []);
  const historicalModifyDbOnlyPolicy = renderHistoricalSandboxProfile(
    NORMALIZED_SANDBOX_INPUTS,
    ["com.apple.lsd.modifydb"],
  );
  const launchServicesBoundaryIsExactHistorical = allowExactLegacyLaunchServicesBoundary && (
    (
      contract.launchServicesHostOpenMachLookup === undefined
      && contract.launchServicesOtherMachLookups === undefined
      && contract.launchServicesSelfRegistrationMachLookup === undefined
      && contract.launchServicesDatabaseMapMachLookup === undefined
      && contract.normalizedSandboxPolicy === historicalNoLookupPolicy
      && contract.normalizedSandboxPolicySha256 === sha256(historicalNoLookupPolicy)
    ) || (
      contract.launchServicesHostOpenMachLookup === "deny-com.apple.lsd.open"
      && contract.launchServicesOtherMachLookups === "deny-com.apple.lsd-regex"
      && contract.launchServicesSelfRegistrationMachLookup === "allow-exact-com.apple.lsd.modifydb"
      && contract.launchServicesDatabaseMapMachLookup === undefined
      && contract.normalizedSandboxPolicy === historicalModifyDbOnlyPolicy
      && contract.normalizedSandboxPolicySha256 === sha256(historicalModifyDbOnlyPolicy)
    )
  );
  invariant(launchServicesBoundaryIsCurrent || launchServicesBoundaryIsExactHistorical,
  "current-account LaunchServices sandbox boundary drifted");
  invariant(report.executionGate?.technicalSandboxCapabilitiesVerified === true
    && report.executionGate?.emptyDisposableProfileCandidatesPrepared === 2
    && report.executionGate?.runtimeSessionsExecuted === 0
    && report.executionGate?.originalRuntimeExecutionReady === false,
  "current-account profile readiness was improperly promoted");
  invariant(Object.entries(report.acceptance ?? {}).every(([key, value]) => key === "acceptanceNeutral" ? value === true : value === false),
    "current-account profile readiness acceptance was promoted");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(HASH.test(reportFingerprintSha256) && reportFingerprintSha256 === sha256(stable(withoutFingerprint)),
    "current-account profile readiness fingerprint drifted");
  return report;
}

export function renderMarkdown(report) {
  validateCurrentAccountProfileReadiness(report);
  return `# G4 L3 TS006 Current-Account Disposable-Profile Readiness\n\n`
    + `The owner requested that capture continue under the current macOS administrator account and that no additional account be created. The EN and ES sessions remain separate and require a new disposable process profile for each language.\n\n`
    + `## Verified technical capability\n\n`
    + `The current host can run an exact allowlisted executable while the same sandbox policy denies non-allowlisted process execution, loopback network connections, private HOME reads, private HOME writes, LaunchServices host-open requests, and every non-startup LaunchServices lookup. The exact \`com.apple.lsd.modifydb\` and \`com.apple.lsd.mapdb\` lookups are separately allowed only so the empty Projector can register its own bundle, map the LaunchServices database, and complete AppKit window initialization. The separately allowlisted user-font directory remains readable for fidelity after its own hash binding. No external network contact was attempted and Flash Player was not launched.\n\n`
    + `Two unique empty profile candidates are now prepared: one for EN and one for ES. Their manifests and sandbox policies are hash-bound; their SharedObject, frame, audio, and log directories are empty. They remain non-executable candidates until the live gate closes.\n\n`
    + `## Remaining live gate\n\n`
    + `This is capability evidence, not a live session preflight. External owner signature for the exception, named EN/ES operators, external trust root, independent visual reviewer, release custodian, language-specific disposable profile creation, host network disable, and same-session checks are still missing. Original-runtime execution readiness is **false**.\n\n`
    + `## Acceptance boundary\n\n`
    + `No runtime session, baseline, audio review, visual review, owner acceptance, strict completion, or publication is established.\n`;
}

async function atomicWrite(relativePath, contents) {
  const target = absolute(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const metadata = await lstat(target).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || (metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1),
    `${relativePath} must be a regular non-linked file`);
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, contents, {flag: "wx"});
  await rename(temporary, target);
}

export async function writeCurrentAccountProfileReadiness({check = false} = {}) {
  const report = validateCurrentAccountProfileReadiness(await buildCurrentAccountProfileReadiness());
  const json = pretty(report);
  const markdown = renderMarkdown(report);
  if (check) {
    invariant(await readFile(absolute(REPORT_JSON), "utf8") === json, `${REPORT_JSON} is stale`);
    invariant(await readFile(absolute(REPORT_MARKDOWN), "utf8") === markdown, `${REPORT_MARKDOWN} is stale`);
    return {action: "verified", report};
  }
  await atomicWrite(REPORT_JSON, json);
  await atomicWrite(REPORT_MARKDOWN, markdown);
  return {action: "written", report};
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const result = await writeCurrentAccountProfileReadiness(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${result.action}: current-account sandbox capability verified; 0 new accounts; 0 Flash launches; original-runtime execution ready false.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
