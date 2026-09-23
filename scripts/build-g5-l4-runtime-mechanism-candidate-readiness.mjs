#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile, statfs, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {
  DEFAULT_G5_L4_HOST_TREE_ROOT,
  buildG5L4HostTreePlan,
  verifyG5L4HostTree,
} from "./materialize-g5-l4-shell-rw002-read-only-host-tree.mjs";
import {
  G5_L4_MINIMUM_SESSION_FREE_BYTES,
  buildG5L4DisposableProfilePlan,
  verifyG5L4DisposableProfile,
} from "./prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs";
import {
  G5_L4_PROJECTOR_EXECUTION_DISABLED_CODE,
  parseProjectorProcessTable,
} from "./launch-g5-l4-shell-rw002-projector.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const OUTPUT_PREFIX = "reports/g5-l4-runtime-mechanism-candidate-readiness";
const PROFILE_CANDIDATES = Object.freeze([
  Object.freeze({
    language: "en",
    sessionId: "g5-l4-shell-rw002-en-20260801-0000-4000-8000-000000000003",
  }),
  Object.freeze({
    language: "es",
    sessionId: "g5-l4-shell-rw002-es-20260801-0000-4000-8000-000000000004",
  }),
]);
const SOURCE_FILES = Object.freeze([
  "scripts/build-g5-l4-runtime-mechanism-candidate-readiness.mjs",
  "scripts/build-g5-l4-runtime-mechanism-candidate-readiness.test.mjs",
  "scripts/materialize-g5-l4-shell-rw002-read-only-host-tree.mjs",
  "scripts/materialize-g5-l4-shell-rw002-read-only-host-tree.test.mjs",
  "scripts/prepare-g5-l4-shell-rw002-disposable-runtime-profile.mjs",
  "scripts/prepare-g5-l4-shell-rw002-disposable-runtime-profile.test.mjs",
  "scripts/lib/g5-l4-atomic-directory-publish.mjs",
  "scripts/native/g5-l4-atomic-directory-publish.c",
  "scripts/lib/g5-l4-per-session-authorization-consumer.mjs",
  "scripts/g5-l4-per-session-authorization-consumer.test.mjs",
  "scripts/lib/g5-l4-atomic-replay-lock.mjs",
  "scripts/native/g5-l4-atomic-replay-lock.c",
  "scripts/launch-g5-l4-shell-rw002-projector.mjs",
  "scripts/launch-g5-l4-shell-rw002-projector.test.mjs",
  "scripts/run-assisted-animate-authoring-audit.mjs",
  "scripts/run-assisted-animate-authoring-audit.test.mjs",
  "scripts/lib/g5-l4-live-observer-supervisor-candidate.mjs",
  "scripts/g5-l4-live-observer-supervisor-candidate.test.mjs",
  "reports/g5-l4-keyterms-source-gap-exception-proposal.json",
]);
const TEST_FILES = Object.freeze([
  "scripts/materialize-g5-l4-shell-rw002-read-only-host-tree.test.mjs",
  "scripts/prepare-g5-l4-shell-rw002-disposable-runtime-profile.test.mjs",
  "scripts/g5-l4-per-session-authorization-consumer.test.mjs",
  "scripts/launch-g5-l4-shell-rw002-projector.test.mjs",
  "scripts/run-assisted-animate-authoring-audit.test.mjs",
  "scripts/g5-l4-live-observer-supervisor-candidate.test.mjs",
]);
const HASH = /^[a-f0-9]{64}$/u;
const REPORT_AUTHORITY =
  "Acceptance-neutral machine diagnostic. It records selected engineering mechanisms and materialized candidates only; it is not technical Owner approval, an exact session authorization, an original-runtime session, or fidelity evidence.";
const EXPECTED_CONTROL_CANDIDATE_FLAGS = Object.freeze([
  true, true, true, true, true, true, true, true,
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`G5 L4 runtime-mechanism readiness: ${message}`);
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function relativeProfileRoot(projectRoot, sessionId) {
  return path.join(projectRoot, "work/original-runtime-profile-candidates", sessionId);
}

async function fileDescriptor(projectRoot, relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function runFocusedTests(projectRoot) {
  const childEnvironment = {...process.env};
  delete childEnvironment.NODE_TEST_CONTEXT;
  const {stdout, stderr} = await execFile(process.execPath, ["--test", ...TEST_FILES], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
    env: childEnvironment,
  });
  const combined = `${stdout}\n${stderr}`;
  const number = (label) => Number(combined.match(new RegExp(`(?:ℹ|#) ${label} (\\d+)`, "u"))?.[1]);
  const result = {
    runner: "node --test",
    nodeVersion: process.version,
    tests: number("tests"),
    passed: number("pass"),
    failed: number("fail"),
    cancelled: number("cancelled"),
    skipped: number("skipped"),
    todo: number("todo"),
  };
  invariant(
    Number.isInteger(result.tests) && result.tests >= 60 && result.passed === result.tests &&
      result.failed === 0 && result.cancelled === 0,
    `focused tests did not pass: ${combined.slice(-4000)}`,
  );
  return result;
}

function diagnosticProbePolicy(profileManifest) {
  const projectorRule = `(allow process-exec (literal ${JSON.stringify(profileManifest.projector.path)}))`;
  const perlRule = `(allow process-exec (literal ${JSON.stringify("/usr/bin/perl")}))`;
  invariant(profileManifest.sandbox.policy.includes(projectorRule), "sandbox lacks exact Projector rule");
  invariant(profileManifest.sandbox.policy.startsWith("(version 1)\n(deny default)\n")
    && profileManifest.sandbox.defaultDeny === true,
  "diagnostic probe requires the exact default-deny sandbox candidate");
  const perlRuntimeRules = [
    `(allow file-read* (literal ${JSON.stringify("/usr/bin/perl")})`,
    `  (subpath ${JSON.stringify("/System/Library/Perl")})`,
    `  (subpath ${JSON.stringify("/System/Library/Frameworks")})`,
    `  (subpath ${JSON.stringify("/usr/lib")})`,
    `  (subpath ${JSON.stringify("/Library/Perl")}))`,
    `(allow file-read-data (literal ${JSON.stringify("/")}))`,
    `(allow file-read* file-write* (literal ${JSON.stringify("/dev/null")}))`,
    "(allow sysctl-read)",
    "(allow mach-lookup (global-name \"com.apple.system.opendirectoryd.libinfo\"))",
  ].join("\n");
  const policy = profileManifest.sandbox.policy.replace(
    projectorRule,
    `${perlRule}\n${perlRuntimeRules}`,
  );
  invariant(policy !== profileManifest.sandbox.policy && !policy.includes(projectorRule),
    "cannot derive the default-deny diagnostic probe policy");
  return policy;
}

async function liveMachineDiagnostics(profileManifest) {
  const [codesign, processTable, capacity] = await Promise.all([
    execFile("/usr/bin/codesign", ["--verify", "--deep", "--strict", profileManifest.projector.path], {
      encoding: "utf8",
      timeout: 30_000,
    }),
    execFile("/bin/ps", ["-axo", "pid=,ppid=,command="], {
      encoding: "utf8",
      timeout: 30_000,
    }),
    statfs(profileManifest.sessionRoot),
  ]);
  invariant((codesign.stdout || "") === "", "codesign emitted unexpected stdout");
  const probePolicy = diagnosticProbePolicy(profileManifest);
  const probe = await execFile("/usr/bin/sandbox-exec", [
    "-p", probePolicy, "/usr/bin/perl", "-MSocket", "-e",
    "socket(S,PF_INET,SOCK_STREAM,getprotobyname('tcp'));$r=connect(S,sockaddr_in(9,inet_aton('127.0.0.1')));print 0+$!,qq{\\n};exit((!$r&&((0+$!)==1||(0+$!)==13))?0:17);",
  ], {
    encoding: "utf8",
    timeout: 30_000,
    env: {
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      HOME: profileManifest.sandbox.sessionOnlyWrites[0],
      TMPDIR: `${profileManifest.sandbox.sessionOnlyWrites[0]}${path.sep}`,
      LANG: "C",
      LC_ALL: "C",
    },
  });
  const denialErrno = Number(probe.stdout.trim());
  invariant([1, 13].includes(denialErrno), "sandbox diagnostic did not deny loopback connect");
  const freeBytes = Number(capacity.bavail) * Number(capacity.bsize);
  invariant(Number.isSafeInteger(freeBytes) && freeBytes >= G5_L4_MINIMUM_SESSION_FREE_BYTES,
    "current capacity is below the diagnostic floor");
  const existingFlashProcesses = parseProjectorProcessTable(processTable.stdout, profileManifest.projector.path);
  invariant(existingFlashProcesses.length >= 1,
    "the known pre-existing Projector blocker is no longer present; rebuild the execution-gate disposition");
  return {
    codesignVerified: true,
    sandboxPolicySha256: profileManifest.sandbox.sha256,
    sandboxLoopbackConnectDenied: true,
    sandboxLoopbackDenialErrno: denialErrno,
    capacity: {
      minimumFreeBytes: G5_L4_MINIMUM_SESSION_FREE_BYTES,
      sufficientAtReportBuild: true,
      immediateSessionPreflightSatisfied: false,
    },
    knownPreexistingProjectorObserved: true,
    minimumKnownPreexistingProjectors: 1,
    freshProcessAbsencePassed: existingFlashProcesses.length === 0,
    exactHostSessionAuthorizationVerified: false,
    projectorLaunched: false,
    runtimeSessionExecuted: false,
  };
}

export function validateG5L4RuntimeMechanismCandidateReadiness(report) {
  assertExactKeys(report, [
    "schemaVersion", "reportType", "releaseId", "status", "authority", "sourceBindings",
    "materializedCandidates", "machineDiagnostics", "focusedTestResult", "controls", "summary",
    "executionGate", "acceptanceEffects", "strictAcceptanceEffect", "reportFingerprintSha256",
  ], "runtime-mechanism report");
  invariant(report.schemaVersion === 1
    && report.reportType === "g5-l4-runtime-mechanism-candidate-readiness"
    && report.releaseId === "lesson-g05-l04-number-lines"
    && report.status === "candidate-mechanisms-materialized-runtime-execution-closed",
  "report identity drifted");
  invariant(report.authority === REPORT_AUTHORITY, "report authority boundary drifted");
  invariant(Array.isArray(report.sourceBindings) && report.sourceBindings.length === SOURCE_FILES.length,
    "source binding count drifted");
  for (const [index, descriptor] of report.sourceBindings.entries()) {
    assertExactKeys(descriptor, ["path", "bytes", "sha256"], "source binding");
    invariant(descriptor.path === SOURCE_FILES[index] && descriptor.bytes > 0
      && HASH.test(descriptor.sha256 || ""), "source binding descriptor drifted");
  }
  invariant(new Set(report.sourceBindings.map(({path: sourcePath}) => sourcePath)).size === SOURCE_FILES.length,
    "source binding paths must be unique");
  assertExactKeys(report.materializedCandidates, ["hostTree", "profiles"], "materialized candidates");
  assertExactKeys(report.materializedCandidates.hostTree, [
    "path", "manifestSha256", "fileSetSha256", "files", "bytes", "runtimeSessionsExecuted",
  ], "host-tree candidate");
  invariant(report.materializedCandidates.hostTree.path ===
      "work/original-runtime-host-trees/g5-l4-shell-rw002/root"
    && HASH.test(report.materializedCandidates.hostTree.manifestSha256 || "")
    && HASH.test(report.materializedCandidates.hostTree.fileSetSha256 || "")
    && report.materializedCandidates.hostTree.files === 7
    && report.materializedCandidates.hostTree.bytes > 0
    && report.materializedCandidates.hostTree.runtimeSessionsExecuted === 0,
  "host-tree candidate boundary drifted");
  invariant(Array.isArray(report.materializedCandidates.profiles)
    && report.materializedCandidates.profiles.length === 2, "profile candidate count drifted");
  for (const [index, profile] of report.materializedCandidates.profiles.entries()) {
    assertExactKeys(profile, [
      "language", "sessionId", "path", "manifestSha256", "sandboxSha256",
      "projectorLaunched", "runtimeSessionExecuted",
    ], "profile candidate");
    const expected = PROFILE_CANDIDATES[index];
    invariant(profile.language === expected.language
      && profile.sessionId === expected.sessionId
      && profile.path === `work/original-runtime-profile-candidates/${expected.sessionId}`
      && HASH.test(profile.manifestSha256 || "") && HASH.test(profile.sandboxSha256 || "")
      && profile.projectorLaunched === false && profile.runtimeSessionExecuted === false,
      "profile candidate improperly claims execution");
  }
  assertExactKeys(report.machineDiagnostics, [
    "codesignVerified", "sandboxPolicySha256", "sandboxLoopbackConnectDenied",
    "sandboxLoopbackDenialErrno", "capacity", "knownPreexistingProjectorObserved",
    "minimumKnownPreexistingProjectors",
    "freshProcessAbsencePassed", "exactHostSessionAuthorizationVerified", "projectorLaunched",
    "runtimeSessionExecuted",
  ], "machine diagnostics");
  assertExactKeys(report.machineDiagnostics.capacity, [
    "minimumFreeBytes", "sufficientAtReportBuild", "immediateSessionPreflightSatisfied",
  ], "capacity diagnostic");
  assertExactKeys(report.focusedTestResult, [
    "runner", "nodeVersion", "tests", "passed", "failed", "cancelled", "skipped", "todo",
  ], "focused test result");
  invariant(Array.isArray(report.controls) && report.controls.length === 8
    && report.controls.map(({controlId}) => controlId).join(",") ===
      "CR-01,CR-02,CR-03,CR-04,CR-05,CR-06,CR-07,CR-08",
  "containment control set drifted");
  for (const [index, control] of report.controls.entries()) {
    assertExactKeys(control, [
      "controlId", "selectedMechanism", "candidateImplementationPresent",
      "offlineOrDiagnosticVerified", "ownerTechnicalApprovalEstablished",
      "liveSessionVerified", "remainingLimit",
    ], `${control.controlId} control`);
    invariant(typeof control.selectedMechanism === "string" && control.selectedMechanism.length > 10
      && typeof control.remainingLimit === "string" && control.remainingLimit.length > 10
      && control.candidateImplementationPresent === EXPECTED_CONTROL_CANDIDATE_FLAGS[index]
      && control.offlineOrDiagnosticVerified === EXPECTED_CONTROL_CANDIDATE_FLAGS[index]
      && control.ownerTechnicalApprovalEstablished === false && control.liveSessionVerified === false,
    `${control.controlId} improperly claims approval or live verification`);
  }
  assertExactKeys(report.summary, [
    "controlsSpecified", "mechanismsSelected", "candidateImplementationsPresent",
    "offlineOrDiagnosticVerified", "ownerTechnicalApprovals", "liveSessionVerified",
    "materializedReadOnlyHostTrees", "materializedEmptyProfiles", "originalRuntimeSessionsExecuted",
  ], "report summary");
  invariant(report.summary.controlsSpecified === 8 && report.summary.mechanismsSelected === 8
    && report.summary.candidateImplementationsPresent === 8
    && report.summary.offlineOrDiagnosticVerified === 8
    && report.summary.ownerTechnicalApprovals === 0
    && report.summary.liveSessionVerified === 0
    && report.summary.materializedReadOnlyHostTrees === 1
    && report.summary.materializedEmptyProfiles === 2
    && report.summary.originalRuntimeSessionsExecuted === 0,
  "report summary drifted");
  invariant(report.summary.candidateImplementationsPresent ===
      report.controls.filter(({candidateImplementationPresent}) => candidateImplementationPresent).length
    && report.summary.offlineOrDiagnosticVerified ===
      report.controls.filter(({offlineOrDiagnosticVerified}) => offlineOrDiagnosticVerified).length
    && report.summary.ownerTechnicalApprovals ===
      report.controls.filter(({ownerTechnicalApprovalEstablished}) => ownerTechnicalApprovalEstablished).length
    && report.summary.liveSessionVerified ===
      report.controls.filter(({liveSessionVerified}) => liveSessionVerified).length,
  "control/summary cross-count drifted");
  invariant(report.machineDiagnostics.codesignVerified === true
    && HASH.test(report.machineDiagnostics.sandboxPolicySha256 || "")
    && report.machineDiagnostics.sandboxLoopbackConnectDenied === true
    && [1, 13].includes(report.machineDiagnostics.sandboxLoopbackDenialErrno)
    && report.machineDiagnostics.capacity.minimumFreeBytes === G5_L4_MINIMUM_SESSION_FREE_BYTES
    && report.machineDiagnostics.capacity.sufficientAtReportBuild === true
    && report.machineDiagnostics.capacity.immediateSessionPreflightSatisfied === false
    && report.machineDiagnostics.freshProcessAbsencePassed === false
    && report.machineDiagnostics.knownPreexistingProjectorObserved === true
    && report.machineDiagnostics.minimumKnownPreexistingProjectors === 1
    && report.machineDiagnostics.exactHostSessionAuthorizationVerified === false
    && report.machineDiagnostics.projectorLaunched === false
    && report.machineDiagnostics.runtimeSessionExecuted === false,
  "machine diagnostic boundary drifted");
  invariant(report.focusedTestResult.tests >= 60
    && report.focusedTestResult.passed === report.focusedTestResult.tests
    && report.focusedTestResult.failed === 0 && report.focusedTestResult.cancelled === 0
    && report.focusedTestResult.skipped === 0 && report.focusedTestResult.todo === 0
    && report.focusedTestResult.runner === "node --test"
    && typeof report.focusedTestResult.nodeVersion === "string",
  "focused test result drifted");
  assertExactKeys(report.executionGate, [
    "productionLauncherEnabled", "liveObserverSupervisorImplemented", "ownerKeyConfigured",
    "immutableExactSessionAuthorizationPresent", "freshProjectorAbsencePassed", "runnable",
  ], "execution gate");
  assertExactKeys(report.acceptanceEffects, [
    "authoritativeOriginalRuntime", "audioAccepted", "humanVisualAccepted",
    "ownerFidelityAccepted", "strictComplete", "published",
  ], "acceptance effects");
  invariant(Object.values(report.executionGate).every((value) => value === false)
    && Object.values(report.acceptanceEffects).every((value) => value === false)
    && report.strictAcceptanceEffect.startsWith("none;"),
  "report improperly claims execution or acceptance");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(HASH.test(reportFingerprintSha256 || "")
    && reportFingerprintSha256 === sha256(Buffer.from(stableJson(withoutFingerprint))),
  "report fingerprint drifted");
  return report;
}

export async function buildG5L4RuntimeMechanismCandidateReadiness({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const hostTreeRoot = path.resolve(projectRoot, path.relative(DEFAULT_PROJECT_ROOT, DEFAULT_G5_L4_HOST_TREE_ROOT));
  const hostPlan = await buildG5L4HostTreePlan({projectRoot, outputRoot: hostTreeRoot});
  const hostVerified = await verifyG5L4HostTree(hostPlan);
  const profiles = [];
  for (const candidate of PROFILE_CANDIDATES) {
    const sessionRoot = relativeProfileRoot(projectRoot, candidate.sessionId);
    const plan = await buildG5L4DisposableProfilePlan({
      projectRoot,
      language: candidate.language,
      sessionId: candidate.sessionId,
      sessionRoot,
      hostTreeRoot,
    });
    const verified = await verifyG5L4DisposableProfile(plan);
    profiles.push({plan, verified});
  }
  const [sourceBindings, focusedTestResult, machineDiagnostics] = await Promise.all([
    Promise.all(SOURCE_FILES.map((file) => fileDescriptor(projectRoot, file))),
    runFocusedTests(projectRoot),
    liveMachineDiagnostics(profiles[0].plan.manifest),
  ]);
  const controls = [
    {
      controlId: "CR-01",
      selectedMechanism: "sandbox-exec deny-network policy plus a hash-bound loopback denial diagnostic",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "The diagnostic is not a whole-session observer and cannot prove zero egress for a Projector process.",
    },
    {
      controlId: "CR-02",
      selectedMechanism: "0444/0555 exact-allowlist trace-scoped host tree published with pinned-parent RENAME_EXCL",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "The two lesson-local XML files remain missing; grade-wide masters retain their original names and any missing-file request must abort.",
    },
    {
      controlId: "CR-03",
      selectedMechanism: "separate EN/ES same-account empty runtime profiles with 0700 stores and no-replace publication",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "Same-account profiles are weaker than a disposable OS account or VM and have not hosted a runtime process.",
    },
    {
      controlId: "CR-04",
      selectedMechanism: "fresh empty-Projector launch plan plus an import-free offline attach/monitor/drain/classify state-machine candidate",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "The pure classifier cannot attach observers or launch a process; a production live supervisor is absent, the existing Flash PID fails fresh-process preflight, and launch is hard-disabled.",
    },
    {
      controlId: "CR-05",
      selectedMechanism: "exact-PID and exact-path offline classifier for planned fs_usage, nettop, and lsof request/network evidence",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "Synthetic classification tests pass, but no live supervisor proves attachment, abort, complete drain, or collection of genuine observer output.",
    },
    {
      controlId: "CR-06",
      selectedMechanism: "sandbox policy denying network, Apple events, unallowlisted execution, host-tree writes, and missing-XML reads",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "Static policy and a loopback diagnostic do not prove absence of every Flash host effect during a real session.",
    },
    {
      controlId: "CR-07",
      selectedMechanism: "statfs capacity floor of four GiB checked before any authorization consumption",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "Current capacity is sufficient, but the required immediately-before-session preflight has not occurred.",
    },
    {
      controlId: "CR-08",
      selectedMechanism: "exact-host/member/tree/profile/tool Ed25519 authorization with canonical signature and atomic one-time replay lock",
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      remainingLimit: "No external Owner key, subject ID, exact signed session authorization, or approved containment manifest is configured.",
    },
  ];
  const base = {
    schemaVersion: 1,
    reportType: "g5-l4-runtime-mechanism-candidate-readiness",
    releaseId: "lesson-g05-l04-number-lines",
    status: "candidate-mechanisms-materialized-runtime-execution-closed",
    authority: REPORT_AUTHORITY,
    sourceBindings,
    materializedCandidates: {
      hostTree: {
        path: path.relative(projectRoot, hostTreeRoot),
        manifestSha256: hostVerified.manifestSha256,
        fileSetSha256: hostVerified.fileSetSha256,
        files: hostVerified.files,
        bytes: hostVerified.bytes,
        runtimeSessionsExecuted: 0,
      },
      profiles: profiles.map(({plan, verified}) => ({
        language: verified.language,
        sessionId: verified.sessionId,
        path: path.relative(projectRoot, plan.sessionRoot),
        manifestSha256: verified.manifestSha256,
        sandboxSha256: verified.sandboxSha256,
        projectorLaunched: false,
        runtimeSessionExecuted: false,
      })),
    },
    machineDiagnostics,
    focusedTestResult,
    controls,
    summary: {
      controlsSpecified: 8,
      mechanismsSelected: 8,
      candidateImplementationsPresent: controls.filter(({candidateImplementationPresent}) => candidateImplementationPresent).length,
      offlineOrDiagnosticVerified: controls.filter(({offlineOrDiagnosticVerified}) => offlineOrDiagnosticVerified).length,
      ownerTechnicalApprovals: 0,
      liveSessionVerified: 0,
      materializedReadOnlyHostTrees: 1,
      materializedEmptyProfiles: 2,
      originalRuntimeSessionsExecuted: 0,
    },
    executionGate: {
      productionLauncherEnabled: false,
      liveObserverSupervisorImplemented: false,
      ownerKeyConfigured: false,
      immutableExactSessionAuthorizationPresent: false,
      freshProjectorAbsencePassed: false,
      runnable: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect:
      `none; ${G5_L4_PROJECTOR_EXECUTION_DISABLED_CODE} remains active and no runtime or acceptance gate changed`,
  };
  const report = {...base, reportFingerprintSha256: sha256(Buffer.from(stableJson(base)))};
  validateG5L4RuntimeMechanismCandidateReadiness(report);
  return report;
}

export function renderMarkdown(report) {
  validateG5L4RuntimeMechanismCandidateReadiness(report);
  return `# G5 L4 runtime-mechanism candidate readiness\n\n`
    + `> ${report.authority}\n\n`
    + `Status: **${report.status}**.\n\n`
    + `- Mechanisms selected: **${report.summary.mechanismsSelected}/8**.\n`
    + `- Candidate implementations present / offline or diagnostic checks: **${report.summary.candidateImplementationsPresent}/8 / ${report.summary.offlineOrDiagnosticVerified}/8**.\n`
    + `- Materialized host trees / empty profiles: **1 / 2**.\n`
    + `- Focused tests: **${report.focusedTestResult.passed}/${report.focusedTestResult.tests} passed**.\n`
    + `- At least one pre-existing Flash Projector was observed; fresh-process gate: **false**.\n`
    + `- Runtime sessions / authoritative baselines / strict completions / publications: **0 / 0 / 0 / 0**.\n\n`
    + `## Controls\n\n`
    + report.controls.map((control) =>
      `- **${control.controlId}** — selected; candidate implementation ${control.candidateImplementationPresent ? "present" : "incomplete"}; `
      + `live-session verified false. ${control.remainingLimit}`,
    ).join("\n")
    + `\n\nStrict acceptance effect: **none**. Projector launch remains deliberately disabled.\n`;
}

export async function writeG5L4RuntimeMechanismCandidateReadiness({
  projectRoot = DEFAULT_PROJECT_ROOT,
  check = false,
} = {}) {
  const report = await buildG5L4RuntimeMechanismCandidateReadiness({projectRoot});
  const jsonPath = path.join(projectRoot, `${OUTPUT_PREFIX}.json`);
  const markdownPath = path.join(projectRoot, `${OUTPUT_PREFIX}.md`);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([
      readFile(jsonPath, "utf8"),
      readFile(markdownPath, "utf8"),
    ]);
    invariant(actualJson === json, `${OUTPUT_PREFIX}.json is stale`);
    invariant(actualMarkdown === markdown, `${OUTPUT_PREFIX}.md is stale`);
    return {status: "current", reportFingerprintSha256: report.reportFingerprintSha256};
  }
  await Promise.all([writeFile(jsonPath, json), writeFile(markdownPath, markdown)]);
  return {status: "written", reportFingerprintSha256: report.reportFingerprintSha256};
}

function parseArguments(argv) {
  const options = {check: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node scripts/build-g5-l4-runtime-mechanism-candidate-readiness.mjs [--check]\n");
    return;
  }
  process.stdout.write(stableJson(await writeG5L4RuntimeMechanismCandidateReadiness(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
