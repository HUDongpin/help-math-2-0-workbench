#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, open, readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildPendingRuntimePreflight, validatePendingRuntimePreflight} from "./build-g4-l3-ts006-pending-runtime-preflight.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const PROJECTOR = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";
const HOST_ROOT = path.join(ROOT, "work/original-runtime-host-trees/course-g04-l03-ts-006/root");
const CAPTURE_TOOL = path.join(
  ROOT,
  "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture",
);
const SELECTION = path.join(ROOT, "work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json");
const TRACE_INDEX = "migrations/course-shell-pilot-trace-spec-index.json";
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) { if (!condition) throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function pretty(value) { return `${JSON.stringify(value, null, 2)}\n`; }

async function writeNew(file, contents, mode = 0o400) {
  await writeFile(file, contents, {flag: "wx", mode});
}

async function bindRegularJson(relativePath) {
  const target = path.join(ROOT, relativePath);
  const metadata = await lstat(target);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${relativePath} must be a regular non-linked file`);
  const bytes = await readFile(target);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), value: JSON.parse(bytes)};
}

async function bindAbsoluteRegularFile(filePath) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `${filePath} must be a regular non-linked file`);
  const bytes = await readFile(filePath);
  return {path: filePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function runProcess(executable, args, options = {}) {
  return await new Promise((resolve) => {
    const child = spawn(executable, args, {stdio: ["ignore", "pipe", "pipe"], ...options});
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => resolve({exitCode: null, error: error.message, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString()}));
    child.on("exit", (code, signal) => resolve({exitCode: code, signal, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString()}));
  });
}

function profileEnvironment(profileRoot) {
  const home = path.join(profileRoot, "home");
  return {
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
    HOME: home,
    CFFIXED_USER_HOME: home,
    TMPDIR: `${path.join(profileRoot, "tmp")}${path.sep}`,
    XDG_CACHE_HOME: path.join(profileRoot, "cache"),
    XDG_CONFIG_HOME: path.join(profileRoot, "config"),
    XDG_DATA_HOME: path.join(profileRoot, "data"),
    USER: process.env.USER || "peter",
    LOGNAME: process.env.LOGNAME || process.env.USER || "peter",
    LANG: "en_US.UTF-8",
    LC_ALL: "en_US.UTF-8",
  };
}

export async function buildPendingProjectorLaunchPlan({language}) {
  invariant(["en", "es"].includes(language), "--language must be en or es");
  const preflight = validatePendingRuntimePreflight(await buildPendingRuntimePreflight());
  invariant(preflight.executionGate.pendingCandidateRuntimeLaunchReady === true
    && preflight.executionGate.promotableRuntimeLaunchReady === false,
  "pending-candidate preflight is not launch-ready within its non-promotion boundary");
  const selection = JSON.parse(await readFile(SELECTION));
  const selected = selection.profiles?.find((item) => item.language === language);
  invariant(selected && HASH.test(selected.manifestSha256) && HASH.test(selected.sandboxSha256), `selected ${language} profile is missing`);
  const sessionRoot = path.join(ROOT, path.dirname(selected.manifestPath));
  const profileManifest = JSON.parse(await readFile(path.join(ROOT, selected.manifestPath)));
  invariant(profileManifest.sessionId === selected.sessionId && profileManifest.language === language
    && profileManifest.executionGate?.projectorLaunched === false
    && profileManifest.executionGate?.runtimeSessionExecuted === false
    && profileManifest.executionGate?.launchCommand === null,
  "selected disposable profile was executed, promoted, or changed");
  const profileRoot = path.join(sessionRoot, "runtime-profile");
  const sandboxPath = path.join(profileRoot, "sandbox.sb");
  invariant(sha256(await readFile(sandboxPath)) === selected.sandboxSha256, "selected sandbox policy hash drifted");
  const logsRoot = path.join(sessionRoot, "evidence/logs");
  invariant((await readdir(logsRoot)).length === 0, "selected session log directory is not empty");
  const traceIndex = await bindRegularJson(TRACE_INDEX);
  const pilot = traceIndex.value.pilots?.find((item) => item.animationId === "course-g04-l03-ts-006");
  invariant(pilot?.requirementCount === 4 && pilot.unresolvedCount === 4,
    "TS006 trace-spec index is missing or was improperly promoted");
  const languageSpecs = pilot.traceSpecs?.filter((item) => item.language === language) ?? [];
  invariant(languageSpecs.length === 2, `TS006 ${language} trace-spec index must contain root and sprite-23 requirements`);
  const selectedShellPath = path.join(HOST_ROOT, "HELP_COURSES/ELMGR4/L3/index_local.swf");
  const [selectedShell, captureTool] = await Promise.all([
    bindAbsoluteRegularFile(selectedShellPath),
    bindAbsoluteRegularFile(CAPTURE_TOOL),
  ]);
  const traceSpecifications = await Promise.all(languageSpecs.map(async (indexed) => {
    const bound = await bindRegularJson(indexed.file);
    const spec = bound.value;
    invariant(bound.sha256 === indexed.sha256
      && spec.animationId === "course-g04-l03-ts-006"
      && spec.requirementId === indexed.requirementId
      && spec.identity?.traceId === indexed.traceId
      && spec.identity?.frameDomainId === indexed.frameDomainId
      && spec.identity?.language === language
      && spec.traceSpecStatus === "unresolved"
      && spec.schedule?.status === "planned-pending-authorized-original-runtime-observation"
      && spec.schedule?.orderedSteps?.length === 9
      && spec.schedule?.executedSteps?.length === 0,
    `TS006 ${language} trace specification ${indexed.requirementId} is stale or exceeds pending-candidate authority`);
    return {
      requirementId: indexed.requirementId,
      traceId: indexed.traceId,
      frameDomainId: indexed.frameDomainId,
      scenario: indexed.scenario,
      language: indexed.language,
      seed: indexed.seed,
      traceSpecStatus: spec.traceSpecStatus,
      file: bound.path,
      bytes: bound.bytes,
      sha256: bound.sha256,
      entryStateSha256: spec.identity.entryStateSha256,
      orderedStepCount: spec.schedule.orderedSteps.length,
      executedStepCount: spec.schedule.executedSteps.length,
      expectedExecutionReport: indexed.expectedExecutionReport,
    };
  }));
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-empty-projector-launch-plan",
    status: "checked-plan-not-launched",
    animationId: "course-g04-l03-ts-006",
    language,
    sessionId: selected.sessionId,
    operator: {displayName: "Dr. Peter Hu", externalSubjectId: null, signatureEnvelope: null},
    sessionRoot,
    profileRoot,
    logsRoot,
    workingDirectory: HOST_ROOT,
    executable: PROJECTOR,
    sandboxExecutable: "/usr/bin/sandbox-exec",
    arguments: ["-f", sandboxPath, PROJECTOR],
    environment: profileEnvironment(profileRoot),
    preflight,
    traceSpecificationBindings: {
      index: {path: traceIndex.path, bytes: traceIndex.bytes, sha256: traceIndex.sha256},
      requirements: traceSpecifications,
      executionReportsPresent: false,
      authority: "pending-candidate-specification-only",
    },
    launchContract: {
      projectorStartsEmpty: true,
      commandLineSwfArgumentUsed: false,
      shellOpenedByLauncher: false,
      namedHumanMustUseFileOpen: true,
      selectedShellPath,
      selectedShell,
      captureAuthority: "pending-candidate-only",
      promotionEligible: false,
    },
    windowObservationContract: {
      captureTool,
      expectedWindow: {
        ownerName: "Flash Player",
        title: selectedShellPath,
        frameWidth: 800,
        frameHeight: 628,
        onScreen: true,
      },
      pollingIntervalMs: 500,
      machineObservationCannotAttestHumanFileOpen: true,
      runtimeSessionExecutedByObservationAlone: false,
      promotionEligible: false,
    },
  };
}

export function validatePendingProjectorLaunchPlan(plan) {
  invariant(plan.evidenceType === "g4-l3-ts006-pending-candidate-empty-projector-launch-plan"
    && plan.status === "checked-plan-not-launched"
    && ["en", "es"].includes(plan.language)
    && plan.operator?.displayName === "Dr. Peter Hu"
    && plan.operator?.signatureEnvelope === null,
  "pending Projector launch plan identity drifted");
  invariant(plan.executable === PROJECTOR && plan.sandboxExecutable === "/usr/bin/sandbox-exec"
    && plan.arguments?.length === 3 && plan.arguments[0] === "-f" && plan.arguments[2] === PROJECTOR
    && !plan.arguments.some((argument) => /\.swf$/iu.test(argument))
    && plan.launchContract?.projectorStartsEmpty === true
    && plan.launchContract?.commandLineSwfArgumentUsed === false
    && plan.launchContract?.shellOpenedByLauncher === false
    && plan.launchContract?.namedHumanMustUseFileOpen === true
    && plan.launchContract?.selectedShell?.path === plan.launchContract?.selectedShellPath
    && plan.launchContract?.selectedShell?.bytes > 0
    && HASH.test(plan.launchContract?.selectedShell?.sha256 || "")
    && plan.launchContract?.promotionEligible === false,
  "pending Projector launch plan is executable outside the empty-Projector contract");
  invariant(plan.windowObservationContract?.captureTool?.path === CAPTURE_TOOL
    && plan.windowObservationContract?.captureTool?.bytes > 0
    && HASH.test(plan.windowObservationContract?.captureTool?.sha256 || "")
    && plan.windowObservationContract?.expectedWindow?.ownerName === "Flash Player"
    && plan.windowObservationContract?.expectedWindow?.title === plan.launchContract.selectedShellPath
    && plan.windowObservationContract?.expectedWindow?.frameWidth === 800
    && plan.windowObservationContract?.expectedWindow?.frameHeight === 628
    && plan.windowObservationContract?.expectedWindow?.onScreen === true
    && plan.windowObservationContract?.machineObservationCannotAttestHumanFileOpen === true
    && plan.windowObservationContract?.runtimeSessionExecutedByObservationAlone === false
    && plan.windowObservationContract?.promotionEligible === false,
  "pending Projector launch plan lacks the exact fail-closed shell-window observation contract");
  invariant(HASH.test(plan.traceSpecificationBindings?.index?.sha256)
    && plan.traceSpecificationBindings?.requirements?.length === 2
    && plan.traceSpecificationBindings.requirements.every((item) => item.language === plan.language
      && HASH.test(item.sha256) && HASH.test(item.entryStateSha256)
      && item.traceSpecStatus === "unresolved" && item.orderedStepCount === 9 && item.executedStepCount === 0)
    && plan.traceSpecificationBindings?.executionReportsPresent === false
    && plan.traceSpecificationBindings?.authority === "pending-candidate-specification-only",
  "pending Projector launch plan lacks exact unresolved trace-spec bindings");
  return plan;
}

export function exactObservedWindow(plan, candidate) {
  const expected = plan.windowObservationContract.expectedWindow;
  return candidate?.ownerName === expected.ownerName
    && candidate?.title === expected.title
    && candidate?.frameWidth === expected.frameWidth
    && candidate?.frameHeight === expected.frameHeight
    && candidate?.onScreen === expected.onScreen
    && Number.isInteger(candidate?.windowID);
}

async function observeExactShellWindow(plan, pid, hasExited) {
  while (!hasExited()) {
    const result = await runProcess(
      plan.windowObservationContract.captureTool.path,
      ["--list", "--pid", String(pid)],
    );
    if (result.exitCode === 0) {
      let windows = [];
      try {
        windows = JSON.parse(result.stdout);
      } catch {
        windows = [];
      }
      const observed = Array.isArray(windows)
        ? windows.find((candidate) => exactObservedWindow(plan, candidate))
        : null;
      if (observed) return observed;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, plan.windowObservationContract.pollingIntervalMs));
  }
  return null;
}

async function launch(plan) {
  validatePendingProjectorLaunchPlan(plan);
  const preflightDocument = {
    ...plan.preflight,
    sessionId: plan.sessionId,
    language: plan.language,
    copiedToSessionAt: new Date().toISOString(),
  };
  const preflightBytes = Buffer.from(pretty(preflightDocument));
  await writeNew(path.join(plan.logsRoot, "preflight.json"), preflightBytes);
  const stdoutHandle = await open(path.join(plan.logsRoot, "projector.stdout.log"), "wx", 0o400);
  const stderrHandle = await open(path.join(plan.logsRoot, "projector.stderr.log"), "wx", 0o400);
  const child = spawn(plan.sandboxExecutable, plan.arguments, {
    cwd: plan.workingDirectory,
    env: plan.environment,
    detached: false,
    stdio: ["ignore", stdoutHandle.fd, stderrHandle.fd],
  });
  const startedAt = new Date().toISOString();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 1200);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code, signal) => { clearTimeout(timer); reject(new Error(`Projector exited before readiness: code=${code} signal=${signal}`)); });
  });
  const launchWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-projector-process-launch-receipt",
    status: "process-started-shell-not-opened",
    animationId: plan.animationId,
    language: plan.language,
    sessionId: plan.sessionId,
    operator: plan.operator,
    pid: child.pid,
    startedAt,
    executable: plan.executable,
    sandboxPath: plan.arguments[1],
    preflightSha256: sha256(preflightBytes),
    workingDirectory: plan.workingDirectory,
    argv: [plan.executable],
    commandLineSwfArgumentUsed: false,
    shellOpenedByLauncher: false,
    guiFileOpenObserved: false,
    traceSpecificationBindings: plan.traceSpecificationBindings,
    flashProjectorProcessStarted: true,
    runtimeSessionExecuted: false,
    captureAuthority: "pending-candidate-only",
    promotionEligible: false,
    acceptanceEffect: "none",
  };
  const launchReceipt = {...launchWithoutFingerprint, receiptFingerprintSha256: sha256(stable(launchWithoutFingerprint))};
  await writeNew(path.join(plan.logsRoot, "launch-receipt.json"), pretty(launchReceipt));
  const operatorActionWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-projector-operator-action-required",
    status: "empty-projector-process-ready-shell-window-not-yet-observed",
    animationId: plan.animationId,
    sessionId: plan.sessionId,
    language: plan.language,
    pid: child.pid,
    operator: plan.operator,
    launchReceiptSha256: sha256(Buffer.from(pretty(launchReceipt))),
    requiredAction: {
      performedByLauncher: false,
      menuPath: ["File", "Open File…"],
      selectedShell: plan.launchContract.selectedShell,
      directChildSwfForbidden: true,
      commandLineSwfArgumentForbidden: true,
    },
    machineObservationContract: plan.windowObservationContract,
    humanFileOpenObserved: false,
    runtimeSessionExecuted: false,
    promotionEligible: false,
    acceptanceEffect: "none",
  };
  const operatorAction = {
    ...operatorActionWithoutFingerprint,
    receiptFingerprintSha256: sha256(stable(operatorActionWithoutFingerprint)),
  };
  await writeNew(path.join(plan.logsRoot, "operator-action-required.json"), pretty(operatorAction));
  const lsofPre = await runProcess("/usr/sbin/lsof", ["-nP", "-a", "-p", String(child.pid), "-i"]);
  await writeNew(path.join(plan.logsRoot, "lsof-network-pre.txt"), lsofPre.stdout + lsofPre.stderr);
  const nettopHandle = await open(path.join(plan.logsRoot, "nettop.csv"), "wx", 0o400);
  const nettopErrorHandle = await open(path.join(plan.logsRoot, "nettop.stderr.log"), "wx", 0o400);
  const nettop = spawn("/usr/bin/nettop", ["-n", "-x", "-L", "0", "-p", String(child.pid)], {
    stdio: ["ignore", nettopHandle.fd, nettopErrorHandle.fd],
  });
  const nettopExit = new Promise((resolve) => nettop.once("exit", resolve));
  process.stdout.write(`${JSON.stringify({event: "PROJECTOR_STARTED", sessionId: plan.sessionId, language: plan.language, pid: child.pid, shellOpened: false, promotionEligible: false})}\n`);
  process.stdout.write(`${JSON.stringify({
    event: "OPERATOR_ACTION_REQUIRED",
    sessionId: plan.sessionId,
    pid: child.pid,
    menuPath: operatorAction.requiredAction.menuPath,
    selectedShell: operatorAction.requiredAction.selectedShell,
    machineObservationOnly: true,
    runtimeSessionExecuted: false,
  })}\n`);
  let childExited = false;
  const exitPromise = new Promise((resolve) => child.once("exit", (code, signal) => {
    childExited = true;
    resolve({code, signal});
  }));
  const observedWindow = await observeExactShellWindow(plan, child.pid, () => childExited);
  if (observedWindow) {
    const observedAt = new Date().toISOString();
    const windowReceiptWithoutFingerprint = {
      schemaVersion: 1,
      evidenceType: "g4-l3-ts006-pending-candidate-exact-shell-window-observation",
      status: "exact-shell-window-machine-observed-human-open-unattested",
      animationId: plan.animationId,
      sessionId: plan.sessionId,
      language: plan.language,
      pid: child.pid,
      observedAt,
      launchReceipt: {
        file: "launch-receipt.json",
        sha256: operatorAction.launchReceiptSha256,
      },
      selectedShell: plan.launchContract.selectedShell,
      captureTool: plan.windowObservationContract.captureTool,
      window: observedWindow,
      humanFileOpenObserved: false,
      automationFileOpenObserved: false,
      guiFileOpenMethodUnresolved: true,
      commandLineSwfArgumentUsed: false,
      runtimeSessionExecuted: false,
      captureAuthority: "pending-candidate-window-observation-only",
      promotionEligible: false,
      acceptanceEffect: "none",
    };
    const windowReceipt = {
      ...windowReceiptWithoutFingerprint,
      receiptFingerprintSha256: sha256(stable(windowReceiptWithoutFingerprint)),
    };
    await writeNew(path.join(plan.logsRoot, "shell-window-observation.json"), pretty(windowReceipt));
    process.stdout.write(`${JSON.stringify({
      event: "LESSON_SHELL_WINDOW_OBSERVED",
      sessionId: plan.sessionId,
      pid: child.pid,
      windowID: observedWindow.windowID,
      width: observedWindow.frameWidth,
      height: observedWindow.frameHeight,
      humanFileOpenAttested: false,
      runtimeSessionExecuted: false,
      promotionEligible: false,
    })}\n`);
  }
  const exit = await exitPromise;
  if (nettop.exitCode === null) nettop.kill("SIGINT");
  await Promise.race([nettopExit, new Promise((resolve) => setTimeout(resolve, 5_000))]);
  const lsofPost = await runProcess("/usr/sbin/lsof", ["-nP", "-a", "-p", String(child.pid), "-i"]);
  await writeNew(path.join(plan.logsRoot, "lsof-network-post.txt"), lsofPost.stdout + lsofPost.stderr);
  const endedAt = new Date().toISOString();
  const exitReceiptWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-projector-exit-receipt",
    sessionId: plan.sessionId,
    language: plan.language,
    pid: child.pid,
    startedAt,
    endedAt,
    exitCode: exit.code,
    exitSignal: exit.signal,
    completeExitObserved: true,
    runtimeSessionExecuted: false,
    authoritativeTraceClaimed: false,
    promotionEligible: false,
    acceptanceEffect: "none",
  };
  const exitReceipt = {...exitReceiptWithoutFingerprint, receiptFingerprintSha256: sha256(stable(exitReceiptWithoutFingerprint))};
  await writeNew(path.join(plan.logsRoot, "exit-receipt.json"), pretty(exitReceipt));
  await Promise.all([stdoutHandle.close(), stderrHandle.close(), nettopHandle.close(), nettopErrorHandle.close()]);
  process.stdout.write(`${JSON.stringify({event: "PROJECTOR_EXITED", sessionId: plan.sessionId, pid: child.pid, exit})}\n`);
}

export function parseArguments(argv) {
  const options = {mode: null, language: null};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--plan" || argument === "--launch") {
      invariant(options.mode === null, "supply exactly one of --plan or --launch");
      options.mode = argument.slice(2);
    } else if (argument === "--language") options.language = argv[++index];
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(["plan", "launch"].includes(options.mode) && ["en", "es"].includes(options.language),
    "Usage: launch-g4-l3-ts006-pending-projector.mjs (--plan|--launch) --language (en|es)");
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const plan = validatePendingProjectorLaunchPlan(await buildPendingProjectorLaunchPlan({language: options.language}));
  if (options.mode === "plan") {
    process.stdout.write(`${pretty({...plan, preflight: {reportFingerprintSha256: plan.preflight.reportFingerprintSha256}})}`);
    return;
  }
  await launch(plan);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
