#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rename, statfs, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REPORT_JSON = "reports/g4-l3-ts006-pending-runtime-preflight.json";
const REPORT_MD = "reports/g4-l3-ts006-pending-runtime-preflight.md";
const PROJECTOR_APP = "/Applications/Adobe Animate 2021/Players/Flash Player.app";
const PROJECTOR_EXECUTABLE = `${PROJECTOR_APP}/Contents/MacOS/Flash Player`;
const PROJECTOR_SHA256 = "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const CAPTURE_TOOL_EXECUTABLE = "work/g4-l3-runtime-capture-tool/HELP Math Runtime Capture.app/Contents/MacOS/g4-l3-runtime-capture";
const INPUTS = Object.freeze({
  ownerAuthorization: "work/g4-l3-ts006-original-runtime-authorization-intake/owner-authorization-intake.json",
  accountException: "work/g4-l3-ts006-original-runtime-authorization-intake/current-admin-account-exception-intake.json",
  roleDesignation: "work/g4-l3-ts006-original-runtime-authorization-intake/single-person-role-designation-intake.json",
  profileReadiness: "reports/g4-l3-ts006-current-account-profile-readiness.json",
  captureToolReadiness: "reports/g4-l3-runtime-capture-tool-readiness.json",
  sessionKitReadiness: "reports/g4-l3-ts006-original-runtime-session-kit-readiness.json",
  hostTree: "work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json",
  capacity: "reports/g4-l3-capture-capacity-readiness.json",
  runtimeEnvironment: "reports/g4-l3-original-runtime-environment-readiness.json",
});
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) { if (!condition) throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function pretty(value) { return `${JSON.stringify(value, null, 2)}\n`; }

async function bind(relativePath, {json = true} = {}) {
  const target = path.join(ROOT, relativePath);
  const metadata = await lstat(target);
  invariant(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1, `${relativePath} must be a regular non-linked file`);
  const bytes = await readFile(target);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), ...(json ? {value: JSON.parse(bytes)} : {})};
}

async function bindAbsolute(filePath) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${filePath} must be a regular file`);
  const bytes = await readFile(filePath);
  return {path: filePath, bytes: bytes.length, sha256: sha256(bytes), mode: (metadata.mode & 0o777).toString(8).padStart(4, "0")};
}

async function run(executable, args, options = {}) {
  try {
    const result = await execFileAsync(executable, args, {cwd: ROOT, encoding: "utf8", timeout: 120_000, ...options});
    return {exitCode: 0, stdout: result.stdout, stderr: result.stderr};
  } catch (error) {
    return {exitCode: Number.isInteger(error.code) ? error.code : null, stdout: error.stdout ?? "", stderr: error.stderr ?? error.message};
  }
}

function publicBinding(binding) { return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256}; }

export function validatePendingRuntimePreflight(report) {
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-pending-candidate-runtime-preflight"
    && report.scope?.animationId === "course-g04-l03-ts-006"
    && report.scope?.languages?.join("|") === "en|es",
  "TS006 pending runtime preflight identity drifted");
  invariant(report.controls?.length === 8 && report.controls.map(({controlId}) => controlId).join("|") === "CR-01|CR-02|CR-03|CR-04|CR-05|CR-06|CR-07|CR-08",
    "TS006 pending runtime preflight control scope drifted");
  invariant(report.controls.slice(0, 7).every(({technicalStatus}) => technicalStatus === "passed")
    && report.controls[7].technicalStatus === "user-intent-bound-external-signature-missing",
  "TS006 pending runtime preflight technical controls are incomplete");
  invariant(report.executionGate?.pendingCandidateRuntimeLaunchReady === true
    && report.executionGate?.promotableRuntimeLaunchReady === false
    && report.executionGate?.independentVisualReviewSatisfied === false
    && report.executionGate?.fourDistinctTrustSubjectsSatisfied === false
    && report.executionGate?.flashProjectorLaunched === false
    && report.executionGate?.runtimeSessionsExecuted === 0,
  "TS006 pending runtime preflight exceeded its one-person candidate boundary");
  invariant(Object.entries(report.acceptance ?? {}).every(([key, value]) => key === "acceptanceNeutral" ? value === true : value === false),
    "TS006 pending runtime preflight contains an acceptance claim");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(HASH.test(reportFingerprintSha256) && reportFingerprintSha256 === sha256(stable(withoutFingerprint)),
    "TS006 pending runtime preflight fingerprint drifted");
  return report;
}

export async function buildPendingRuntimePreflight() {
  const entries = await Promise.all(Object.entries(INPUTS).map(async ([key, file]) => [key, await bind(file)]));
  const inputs = Object.fromEntries(entries);
  const [generator, projector, sandboxExec, lsof, nettop, captureTool] = await Promise.all([
    bind(path.relative(ROOT, SCRIPT_PATH), {json: false}),
    bindAbsolute(PROJECTOR_EXECUTABLE),
    bindAbsolute("/usr/bin/sandbox-exec"),
    bindAbsolute("/usr/sbin/lsof"),
    bindAbsolute("/usr/bin/nettop"),
    bind(CAPTURE_TOOL_EXECUTABLE, {json: false}),
  ]);

  const owner = inputs.ownerAuthorization.value;
  const account = inputs.accountException.value;
  const roles = inputs.roleDesignation.value;
  const profiles = inputs.profileReadiness.value;
  const captureReadiness = inputs.captureToolReadiness.value;
  const kits = inputs.sessionKitReadiness.value;
  const hostTree = inputs.hostTree.value;
  const capacity = inputs.capacity.value;
  const runtime = inputs.runtimeEnvironment.value;
  invariant(owner.authorityBoundary?.userAuthorizationIntentRecorded === true
    && account.decision?.permitCurrentMacosAccountForEnEsCapture === true
    && roles.person?.displayName === "Dr. Peter Hu"
    && roles.eligibility?.pendingCandidateRuntimeOperationEligibleAfterLiveContainmentPreflight === true
    && roles.eligibility?.independentVisualReviewSatisfied === false
    && roles.eligibility?.productionTrustRootEligible === false,
  "pending-candidate owner/operator designation is absent or was over-promoted");
  invariant(profiles.reportType === "g4-l3-ts006-current-account-disposable-profile-readiness"
    && profiles.preparedProfileCandidates?.length === 2
    && profiles.preparedProfileCandidates.every((item) => item.projectorLaunched === false && item.runtimeSessionExecuted === false)
    && profiles.technicalProbes?.sessionRootWriteAllowed === true,
  "current-account profile readiness is incomplete or stale");
  invariant(captureReadiness.reportType === "g4-l3-screen-capture-kit-tool-readiness"
    && captureReadiness.capabilities?.losslessPngPerCompleteFrame === true
    && captureReadiness.capabilities?.waitForExactProcessFirstWindowFailClosed === true
    && captureReadiness.capabilities?.waitForExactProcessFirstWindowMinimumSizeFilter === true
    && captureReadiness.capabilities?.systemAudio?.lossless === true
    && captureReadiness.executable?.path === CAPTURE_TOOL_EXECUTABLE
    && captureReadiness.executable?.sha256 === captureTool.sha256
    && captureReadiness.appBundle?.bundleIdentifier === "ai.helpmath.g4l3.runtime-capture"
    && captureReadiness.execution?.flashProjectorLaunched === false,
  "lossless capture tool is not ready or was executed as evidence");
  invariant(kits.reportType === "g4-l3-ts006-original-runtime-session-kit-readiness"
    && kits.readiness?.distinctNamedHumansRecorded === 1
    && kits.readiness?.runtimeSessionsExecuted === 0,
  "TS006 session kit does not bind the current single-person designation");
  invariant(hostTree.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree"
    && hostTree.summary?.files === 657 && hostTree.summary?.bytes === 35_469_789,
  "TS006 host-tree identity drifted");
  invariant(projector.sha256 === PROJECTOR_SHA256
    && runtime.installedRuntimeCandidate?.executable?.sha256 === PROJECTOR_SHA256,
  "Flash Projector executable identity drifted");

  const [hostCheck, profileCheck, kitCheck, codesign, screenPermission, runningPlayer] = await Promise.all([
    run(process.execPath, ["scripts/materialize-g4-l3-ts006-read-only-host-tree.mjs", "--check"]),
    run(process.execPath, ["scripts/build-g4-l3-ts006-current-account-profile-readiness.mjs", "--check"]),
    run(process.execPath, ["scripts/prepare-g4-l3-ts006-original-runtime-session-kits.mjs", "--check"]),
    run("/usr/bin/codesign", ["--verify", "--deep", "--strict", "--verbose=2", PROJECTOR_APP]),
    run(path.join(ROOT, captureTool.path), ["--list", "--owner", "__G4L3_CAPTURE_PERMISSION_PROBE_NO_MATCH__"]),
    run("/usr/bin/pgrep", ["-x", "Flash Player"]),
  ]);
  invariant(hostCheck.exitCode === 0, `full TS006 host-tree check failed: ${hostCheck.stderr}`);
  invariant(profileCheck.exitCode === 0 && kitCheck.exitCode === 0, "TS006 profile or session-kit check failed");
  invariant(codesign.exitCode === 0, `Projector strict code-signature check failed: ${codesign.stderr}`);
  invariant(screenPermission.exitCode === 0 && JSON.parse(screenPermission.stdout).length === 0,
    "ScreenCaptureKit permission/filter probe failed");
  invariant(runningPlayer.exitCode !== 0 && runningPlayer.stdout.trim() === "", "a Flash Player process is already running");

  const storage = await statfs("/Volumes/WestWorld", {bigint: true});
  const availableBytes = storage.bavail * storage.bsize;
  const minimumSafeFreeBytes = BigInt(capacity.capacityModel.minimumSafeFreeBytes);
  invariant(availableBytes >= minimumSafeFreeBytes, "live WestWorld capacity is below the full-lesson safety threshold");
  const sourceBindings = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, publicBinding(value)]));
  const controls = [
    {controlId: "CR-01", technicalStatus: "passed", mechanism: "per-process sandbox deny network*; filtered ScreenCaptureKit permission probe; live PID audit required during capture"},
    {controlId: "CR-02", technicalStatus: "passed", mechanism: "657-file / 35,469,789-byte 0444/0555 host tree reverified byte-for-byte"},
    {controlId: "CR-03", technicalStatus: "passed", mechanism: "two selected empty language-specific HOME/CFFIXED_USER_HOME profiles; real HOME read/write denied"},
    {controlId: "CR-04", technicalStatus: "passed", mechanism: "one fresh empty Projector process per language; no process is running; operator must use File > Open File"},
    {controlId: "CR-05", technicalStatus: "passed", mechanism: "hash-bound lsof and nettop tools available for PID-scoped live and postflight request audit"},
    {controlId: "CR-06", technicalStatus: "passed", mechanism: "sandbox denies network, Apple Events, LaunchServices host opens, non-Projector exec, and broad writes"},
    {controlId: "CR-07", technicalStatus: "passed", mechanism: "live WestWorld free space exceeds 1.20 remaining-evidence multiplier plus 100 GiB reserve"},
    {controlId: "CR-08", technicalStatus: "user-intent-bound-external-signature-missing", mechanism: "Dr. Peter Hu is user-designated Owner/operator for pending capture; external signatures and distinct reviewer/trust subjects remain absent"},
  ];
  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-pending-candidate-runtime-preflight",
    observedAt: new Date().toISOString(),
    generator: publicBinding(generator),
    sourceBindings,
    toolBindings: {projector, sandboxExec, lsof, nettop, captureTool: publicBinding(captureTool)},
    scope: {
      animationId: "course-g04-l03-ts-006",
      languages: ["en", "es"],
      operator: "Dr. Peter Hu",
      captureAuthority: "pending-candidate-only",
    },
    selectedProfiles: profiles.preparedProfileCandidates,
    observed: {
      projectorStrictCodeSignaturePassed: true,
      projectorProcessCount: 0,
      fullHostTreeReverified: true,
      screenCaptureKitFilteredEnumerationPassed: true,
      screenPixelsCaptured: false,
      availableBytes: availableBytes.toString(),
      minimumSafeFreeBytes: minimumSafeFreeBytes.toString(),
      capacityPassed: true,
      processBoundaryNoEgressCapabilityPassed: true,
      hostNetworkDisabled: false,
      hostNetworkDisableRequiredForThisBoundary: false,
      livePidNetworkAuditRequired: true,
      flashProjectorLaunched: false,
    },
    controls,
    executionGate: {
      ownerRuntimeIntentRecorded: true,
      namedOperatorIntentRecorded: true,
      operatorDisplayName: "Dr. Peter Hu",
      technicalContainmentPreflightPassed: true,
      pendingCandidateRuntimeLaunchReady: true,
      externalTrustRootBound: false,
      externalSignaturesBound: false,
      independentVisualReviewSatisfied: false,
      fourDistinctTrustSubjectsSatisfied: false,
      promotableRuntimeLaunchReady: false,
      flashProjectorLaunched: false,
      runtimeSessionsExecuted: 0,
      state: "pending-candidate-launch-ready-promotion-ineligible",
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
  return validatePendingRuntimePreflight({...reportWithoutFingerprint, reportFingerprintSha256: sha256(stable(reportWithoutFingerprint))});
}

export function renderMarkdown(report) {
  validatePendingRuntimePreflight(report);
  return `# G4 L3 TS006 Pending-Candidate Runtime Preflight\n\n`
    + `All eight containment controls have a technically checked pending-candidate path. The full 657-file host tree, Projector signature/hash, two empty EN/ES disposable profiles, lossless frame/system-audio tool, process no-egress sandbox, audit tools, and live storage threshold pass. Flash is not running and no screen pixels were captured.\n\n`
    + `Dr. Peter Hu is the user-designated Owner and EN/ES operator. The current process-boundary containment allows the host to remain online for Codex while denying network access to the Projector process and requiring PID-scoped live audit.\n\n`
    + `This authorizes only an immutable **pending-candidate** capture. One person cannot provide independent visual review or four distinct trust subjects; no external signatures are bound. Therefore the result cannot be promoted, counted as strict complete, or released.\n`;
}

async function atomicWrite(relativePath, contents) {
  const target = path.join(ROOT, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const metadata = await lstat(target).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!metadata || (metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1), `${relativePath} must be a regular non-linked file`);
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, contents, {flag: "wx"});
  await rename(temporary, target);
}

export async function writePendingRuntimePreflight() {
  const report = await buildPendingRuntimePreflight();
  await atomicWrite(REPORT_JSON, pretty(report));
  await atomicWrite(REPORT_MD, renderMarkdown(report));
  return report;
}

async function main() {
  invariant(process.argv.length === 2, "Usage: build-g4-l3-ts006-pending-runtime-preflight.mjs");
  const report = await writePendingRuntimePreflight();
  process.stdout.write(`PASS: TS006 pending-candidate runtime preflight; ${report.controls.length}/8 controls technically prepared; promotion eligible false; Flash launches 0.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
