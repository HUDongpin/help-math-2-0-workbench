#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-original-runtime-environment-readiness";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);
const FLASH_PLAYER_APP = "/Applications/Adobe Animate 2021/Players/Flash Player.app";
const FLASH_PLAYER_INFO = path.join(FLASH_PLAYER_APP, "Contents", "Info.plist");
const FLASH_PLAYER_EXECUTABLE = path.join(FLASH_PLAYER_APP, "Contents", "MacOS", "Flash Player");
const ROSETTA_PACKAGE_ID = "com.apple.pkg.RosettaUpdateAuto";
const HISTORICAL_BASELINE_NAME = "adobe-flash-player-32-standalone-default.json";
const SHA256 = /^[a-f0-9]{64}$/;

const INPUTS = Object.freeze([
  {
    key: "machineSourceAudits",
    file: "reports/g4-l3-machine-source-audits.json",
    reportType: "g4-l3-machine-source-audits",
    schemaVersion: 1,
  },
  {
    key: "captureCapacityReadiness",
    file: "reports/g4-l3-capture-capacity-readiness.json",
    reportType: "g4-l3-capture-capacity-readiness",
    schemaVersion: 1,
  },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function relative(file) {
  const candidate = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes the project root`);
  return candidate;
}

function resolveProjectPath(file) {
  const absolute = path.resolve(ROOT, file);
  const candidate = path.relative(ROOT, absolute);
  invariant(candidate && !candidate.startsWith("..") && !path.isAbsolute(candidate), `${file} escapes the project root`);
  return absolute;
}

async function projectBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function externalBinding(file, label) {
  const [metadata, bytes] = await Promise.all([lstat(file), readFile(file)]);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  return {
    path: file,
    sha256: sha256(bytes),
    bytes: bytes.length,
    mode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
  };
}

async function readInput(definition) {
  const absolute = resolveProjectPath(definition.file);
  const bytes = await readFile(absolute);
  const report = JSON.parse(bytes);
  invariant(report.reportType === definition.reportType && report.schemaVersion === definition.schemaVersion,
    `${definition.key}: report identity drifted`);
  const generatorFile = report.generator?.path ?? report.generator?.file;
  invariant(typeof generatorFile === "string" && generatorFile.startsWith("scripts/") && !generatorFile.includes(".."),
    `${definition.key}: missing safe generator binding`);
  const generator = await projectBinding(resolveProjectPath(generatorFile));
  if (report.generator.sha256 !== undefined) {
    invariant(report.generator.sha256 === generator.sha256, `${definition.key}: generator hash is stale`);
  }
  if (report.generator.bytes !== undefined) {
    invariant(report.generator.bytes === generator.bytes, `${definition.key}: generator byte count is stale`);
  }
  return {
    definition,
    report,
    binding: {
      file: definition.file,
      sha256: sha256(bytes),
      bytes: bytes.length,
      reportType: report.reportType,
      schemaVersion: report.schemaVersion,
      generator,
    },
  };
}

async function plistValue(key) {
  const {stdout} = await execFileAsync("plutil", ["-extract", key, "raw", "-o", "-", FLASH_PLAYER_INFO]);
  return stdout.trim();
}

function lineValue(text, prefix) {
  const line = text.split(/\r?\n/).find((candidate) => candidate.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : null;
}

async function inspectRuntimeCandidate() {
  const [appMetadata, executable, infoPlist, executableName, bundleId, version, buildVersion, fileResult, codesignResult,
    strictVerificationResult] =
    await Promise.all([
      lstat(FLASH_PLAYER_APP),
      externalBinding(FLASH_PLAYER_EXECUTABLE, "Flash Player executable"),
      externalBinding(FLASH_PLAYER_INFO, "Flash Player Info.plist"),
      plistValue("CFBundleExecutable"),
      plistValue("CFBundleIdentifier"),
      plistValue("CFBundleShortVersionString"),
      plistValue("CFBundleVersion"),
      execFileAsync("file", ["-b", FLASH_PLAYER_EXECUTABLE]),
      execFileAsync("codesign", ["-dv", "--verbose=4", FLASH_PLAYER_APP]).catch((error) => ({
        stdout: error.stdout || "",
        stderr: error.stderr || "",
      })),
      execFileAsync("codesign", ["--verify", "--deep", "--strict", "--verbose=4", FLASH_PLAYER_APP])
        .then((result) => ({...result, exitCode: 0}))
        .catch((error) => ({stdout: error.stdout || "", stderr: error.stderr || "", exitCode: error.code ?? 1})),
    ]);
  invariant(appMetadata.isDirectory() && !appMetadata.isSymbolicLink(),
    "Flash Player candidate app must be a plain application directory");
  const codesignText = `${codesignResult.stdout || ""}\n${codesignResult.stderr || ""}`;
  const strictVerificationText = `${strictVerificationResult.stdout || ""}\n${strictVerificationResult.stderr || ""}`.trim();
  const architecture = fileResult.stdout.trim();
  const candidate = {
    status: "installed-unapproved-original-runtime-candidate",
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version,
    buildVersion,
    bundle: {
      path: FLASH_PLAYER_APP,
      bundleIdentifier: bundleId,
      executableName,
      infoPlist,
    },
    executable: {
      ...executable,
      architecture,
    },
    codeSignature: {
      identifier: lineValue(codesignText, "Identifier="),
      teamIdentifier: lineValue(codesignText, "TeamIdentifier="),
      cdHash: lineValue(codesignText, "CDHash="),
      authority: codesignText.split(/\r?\n/)
        .filter((line) => line.startsWith("Authority="))
        .map((line) => line.slice("Authority=".length)),
      timestamp: lineValue(codesignText, "Timestamp="),
      strictVerification: {
        passed: strictVerificationResult.exitCode === 0,
        exitCode: strictVerificationResult.exitCode,
        diagnosticSha256: sha256(Buffer.from(strictVerificationText)),
        disposition: strictVerificationResult.exitCode === 0
          ? "current-macos-strict-verification-passed"
          : "current-macos-strict-verification-failed",
      },
    },
    provenanceMeaning: "technical installed-runtime identity candidate only",
  };
  invariant(candidate.bundle.bundleIdentifier === "com.macromedia.Flash Player.app"
    && candidate.bundle.executableName === "Flash Player"
    && candidate.version === "32.0.0.414"
    && candidate.buildVersion === candidate.version
    && candidate.executable.sha256 === "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30"
    && candidate.executable.architecture.includes("x86_64")
    && candidate.codeSignature.identifier === "com.macromedia.Flash Player.app"
    && candidate.codeSignature.teamIdentifier === "JQ525L2MZD"
    && typeof candidate.codeSignature.strictVerification.passed === "boolean"
    && candidate.codeSignature.strictVerification.disposition
      === `current-macos-strict-verification-${candidate.codeSignature.strictVerification.passed ? "passed" : "failed"}`,
  "Installed Flash Player candidate identity drifted");
  return candidate;
}

async function inspectRosetta() {
  const {stdout} = await execFileAsync("pkgutil", ["--pkg-info", ROSETTA_PACKAGE_ID]);
  const fields = Object.fromEntries(stdout.trim().split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    return separator === -1 ? [line, ""] : [line.slice(0, separator), line.slice(separator + 1).trim()];
  }));
  invariant(fields["package-id"] === ROSETTA_PACKAGE_ID && typeof fields.version === "string" && fields.version.length > 0,
    "Rosetta package receipt is missing or malformed");
  return {
    status: "installed",
    packageId: fields["package-id"],
    version: fields.version,
    volume: fields.volume,
    location: fields.location,
    hostArchitecture: process.arch,
    requiredForCandidateArchitecture: process.arch === "arm64",
    installationIsRuntimeAuthorization: false,
  };
}

async function optionalFileBinding(file) {
  try {
    return await projectBinding(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function inspectHistoricalCandidate(machineItem) {
  const file = path.join(ROOT, "migrations", machineItem.animationId, "baseline", HISTORICAL_BASELINE_NAME);
  const binding = await optionalFileBinding(file);
  if (!binding) return null;
  const baseline = JSON.parse(await readFile(file, "utf8"));
  invariant(baseline.schemaVersion === 1 && baseline.animationId === machineItem.animationId
    && baseline.source?.swf === machineItem.source.swf.path
    && baseline.source?.swfSha256 === machineItem.source.swf.sha256
    && baseline.runtime?.stage?.width === 800 && baseline.runtime?.stage?.height === 600
    && baseline.runtime?.fps === 12 && baseline.runtime?.frameCount === machineItem.swf.header.rootFrameCount
    && Array.isArray(baseline.frames) && baseline.frames.length === baseline.runtime.frameCount,
  `${machineItem.animationId}: historical standalone baseline identity drifted`);
  const archiveRoot = resolveProjectPath(baseline.capture.archiveDirectory);
  const frames = [];
  for (let index = 0; index < baseline.frames.length; index += 1) {
    const declared = baseline.frames[index];
    const physical = await projectBinding(path.join(archiveRoot, declared.file));
    invariant(declared.frame === index + 1 && declared.sha256 === physical.sha256
      && declared.bytes === physical.bytes && declared.width === 800 && declared.height === 600,
    `${machineItem.animationId}: historical frame ${index + 1} drifted`);
    frames.push({frame: declared.frame, file: `${baseline.capture.archiveDirectory}/${declared.file}`,
      sha256: physical.sha256, bytes: physical.bytes, width: 800, height: 600});
  }
  return {
    animationId: machineItem.animationId,
    sourceSwf: {file: machineItem.source.swf.path, sha256: machineItem.source.swf.sha256},
    manifest: binding,
    declaredStatus: baseline.status,
    declaredAuthorityKind: baseline.authority?.kind,
    scenario: baseline.runtime.scenario,
    language: baseline.runtime.lang,
    frameCount: frames.length,
    frameSetSha256: sha256(Buffer.from(stableJson(frames))),
    frames,
    currentDisposition: "historical-unadopted-standalone-candidate",
    currentStrictBaselineAuthority: false,
    limitations: [
      "schema-v1 manifest has no requirementId, traceId, or canonical entry-state SHA-256",
      "standalone sequential stepping proves only selected root-frame appearance, not natural nested or interactive behavior",
      "no current capture-operator attestation, trust registry, human evidence review, owner promotion decision, or enabled canonical promotion exists",
    ],
  };
}

export async function buildOriginalRuntimeEnvironmentReadinessReport() {
  const inputs = [];
  for (const definition of INPUTS) inputs.push(await readInput(definition));
  const byKey = Object.fromEntries(inputs.map((input) => [input.definition.key, input.report]));
  const machine = byKey.machineSourceAudits;
  const capacity = byKey.captureCapacityReadiness;
  invariant(machine.summary.canonicalItems === 40 && machine.summary.activePages === 39
    && machine.summary.courseShells === 1 && machine.items.length === 40,
  "G4 L3 machine scope drifted");
  const capacityPreflightPassed = capacity.capacityModel.admission === "admit-full-lesson-capture-capacity";
  invariant(capacityPreflightPassed
    && capacity.capacityModel.remainingEvidenceSafetyMultiplier === 1.20
    && capacity.capacityModel.operationalReserveBytes === 100 * 1024 ** 3
    && capacity.capacityModel.admissionIsFidelityEvidence === false,
  "Capture capacity snapshot is insufficient, uses the wrong v2 reserve formula, or claims fidelity");

  const [runtimeCandidate, rosetta, generator] = await Promise.all([
    inspectRuntimeCandidate(),
    inspectRosetta(),
    projectBinding(GENERATOR_PATH),
  ]);
  const historicalCandidates = [];
  for (const item of machine.items) {
    const candidate = await inspectHistoricalCandidate(item);
    if (candidate) historicalCandidates.push(candidate);
  }
  invariant(historicalCandidates.length === 1
    && historicalCandidates[0].animationId === "course-g04-l03-in-009",
  "Expected exactly one current G4 L3 historical standalone baseline candidate");

  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator,
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      purpose: "installed original-runtime candidate identity and historical baseline disposition only",
    },
    sourceBindings: Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding])),
    installedRuntimeCandidate: runtimeCandidate,
    compatibilityLayer: rosetta,
    historicalCandidates,
    capacityBoundary: {
      boundSnapshotAvailableBytes: capacity.capacityModel.availableBytes,
      lowProjectionIncrementalBytes: capacity.capacityModel.scenarios.low.incrementalBytes,
      operationalReserveBytes: capacity.capacityModel.operationalReserveBytes,
      boundSnapshotAdmission: capacity.capacityModel.admission,
      boundSnapshotCapacityPreflightPassed: capacityPreflightPassed,
      remainingEvidenceSafetyMultiplier: capacity.capacityModel.remainingEvidenceSafetyMultiplier,
      minimumSafeFreeBytes: capacity.capacityModel.minimumSafeFreeBytes,
      captureExecutionAuthorizedByThisReport: false,
      bulkLessonCaptureAdmitted: false,
      boundedSessionAdmitted: false,
      liveCapacityPreflightRequiredBeforeEverySession: true,
      capacityIsFidelityEvidence: false,
    },
    executionGate: {
      state: "installed-candidate-identified-execution-not-authorized",
      installedRuntimeCandidateIdentified: true,
      candidateExecutableTechnicallyBound: true,
      candidatePassesCurrentStrictCodeSignatureVerification:
        runtimeCandidate.codeSignature.strictVerification.passed,
      runtimeApprovedByOwner: false,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedHostContextIdentified: false,
      networkContainmentPlanApproved: false,
      standaloneDirectOpenAuthorized: false,
      courseShellHostAuthorized: false,
      perItemCaptureAuthorized: false,
      bulkCaptureAuthorized: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisBuilder: false,
      launchesAnimateByThisBuilder: false,
      reason: runtimeCandidate.codeSignature.strictVerification.passed
        ? "Adobe Flash Player 32.0.0.414 is installed, hash-bound, and passes the current point-in-time macOS strict code-signature check. The bound v2 storage preflight also passes. Execution remains closed because no fixed external trust root, owner approval, named runtime operator, authorized host context, or reviewed network containment is bound; signature and storage must be rechecked immediately before every session."
        : "Adobe Flash Player 32.0.0.414 is installed and hash-bound as a technical candidate, but the current point-in-time macOS strict code-signature check fails. The bound v2 storage preflight passes. Execution remains closed because runtime trust, owner approval, named runtime operator, authorized host context, and reviewed network containment are unresolved; signature and storage must be rechecked immediately before every session.",
    },
    summary: {
      installedRuntimeCandidates: 1,
      exactExecutableHashesBound: 1,
      currentStrictCodeSignatureVerificationPassed:
        runtimeCandidate.codeSignature.strictVerification.passed,
      rosettaInstalled: true,
      historicalStandaloneCandidates: historicalCandidates.length,
      historicalStandaloneFramesReverified: historicalCandidates.reduce((sum, item) => sum + item.frameCount, 0),
      authorizedRuntimeContexts: 0,
      namedOriginalRuntimeOperators: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      strictCompletions: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      installedCandidateIdentityEstablished: true,
      runtimeApproved: false,
      historicalCandidatePromoted: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This report proves only that an Adobe Flash Player executable candidate and Rosetta receipt are present and that one historical IN009 standalone frame set still matches its schema-v1 manifest. It launches nothing and grants no runtime authorization. The historical frame set is not a current requirement/trace/entry-state baseline, natural behavior proof, review, promotion, parity, or strict completion evidence.",
    },
  };
  return validateOriginalRuntimeEnvironmentReadinessReport(report);
}

export function validateOriginalRuntimeEnvironmentReadinessReport(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "Original-runtime environment report identity drifted");
  invariant(report.scope.canonicalItems === 40 && report.scope.activePages === 39
    && report.scope.courseShells === 1 && Object.keys(report.sourceBindings).length === INPUTS.length,
  "Original-runtime environment report scope or source bindings drifted");
  for (const definition of INPUTS) {
    const binding = report.sourceBindings[definition.key];
    invariant(binding?.file === definition.file && binding.reportType === definition.reportType
      && binding.schemaVersion === definition.schemaVersion && SHA256.test(binding.sha256),
    `${definition.key}: original-runtime environment input binding drifted`);
  }
  const runtime = report.installedRuntimeCandidate;
  invariant(runtime.status === "installed-unapproved-original-runtime-candidate"
    && runtime.runtimeId === "adobe-flash-player-projector"
    && runtime.version === "32.0.0.414"
    && runtime.bundle.bundleIdentifier === "com.macromedia.Flash Player.app"
    && runtime.executable.path === FLASH_PLAYER_EXECUTABLE
    && runtime.executable.sha256 === "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30"
    && runtime.executable.architecture.includes("x86_64")
    && runtime.codeSignature.teamIdentifier === "JQ525L2MZD"
    && typeof runtime.codeSignature.strictVerification.passed === "boolean"
    && runtime.codeSignature.strictVerification.disposition
      === `current-macos-strict-verification-${runtime.codeSignature.strictVerification.passed ? "passed" : "failed"}`
    && SHA256.test(runtime.codeSignature.strictVerification.diagnosticSha256),
  "Installed original-runtime candidate identity drifted");
  invariant(report.compatibilityLayer.status === "installed"
    && report.compatibilityLayer.packageId === ROSETTA_PACKAGE_ID
    && report.compatibilityLayer.hostArchitecture === "arm64"
    && report.compatibilityLayer.installationIsRuntimeAuthorization === false,
  "Rosetta compatibility-layer disposition drifted");
  invariant(report.historicalCandidates.length === 1
    && report.historicalCandidates[0].animationId === "course-g04-l03-in-009"
    && report.historicalCandidates[0].frameCount === 10
    && report.historicalCandidates[0].currentStrictBaselineAuthority === false
    && SHA256.test(report.historicalCandidates[0].frameSetSha256),
  "Historical standalone candidate disposition drifted");
  invariant(report.capacityBoundary.boundSnapshotCapacityPreflightPassed === true
    && report.capacityBoundary.remainingEvidenceSafetyMultiplier === 1.20
    && report.capacityBoundary.operationalReserveBytes === 100 * 1024 ** 3
    && report.capacityBoundary.captureExecutionAuthorizedByThisReport === false
    && report.capacityBoundary.bulkLessonCaptureAdmitted === false
    && report.capacityBoundary.boundedSessionAdmitted === false
    && report.capacityBoundary.liveCapacityPreflightRequiredBeforeEverySession === true
    && report.capacityBoundary.capacityIsFidelityEvidence === false,
  "Original-runtime capacity boundary was promoted");
  const allowedTrueExecutionKeys = new Set([
    "installedRuntimeCandidateIdentified",
    "candidateExecutableTechnicallyBound",
    ...(runtime.codeSignature.strictVerification.passed
      ? ["candidatePassesCurrentStrictCodeSignatureVerification"]
      : []),
  ]);
  for (const [key, value] of Object.entries(report.executionGate)) {
    if (typeof value === "boolean") {
      invariant(value === allowedTrueExecutionKeys.has(key), `Original-runtime execution gate ${key} drifted`);
    }
  }
  invariant(report.executionGate.state === "installed-candidate-identified-execution-not-authorized"
    && report.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime execution state was opened");
  invariant(report.summary.installedRuntimeCandidates === 1
    && report.summary.exactExecutableHashesBound === 1
    && report.summary.currentStrictCodeSignatureVerificationPassed
      === runtime.codeSignature.strictVerification.passed
    && report.summary.rosettaInstalled === true
    && report.summary.historicalStandaloneCandidates === 1
    && report.summary.historicalStandaloneFramesReverified === 10
    && report.summary.authorizedRuntimeContexts === 0
    && report.summary.namedOriginalRuntimeOperators === 0
    && report.summary.runtimeSessionsExecuted === 0
    && report.summary.authoritativeBaselinePackagesEstablished === 0
    && report.summary.strictCompletions === 0,
  "Original-runtime environment summary drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.installedCandidateIdentityEstablished === true
    && Object.entries(report.acceptance)
      .filter(([key]) => !["acceptanceNeutral", "installedCandidateIdentityEstablished", "statement"].includes(key))
      .every(([, value]) => value === false),
  "Original-runtime environment acceptance state was promoted");
  return report;
}

export function renderMarkdown(report) {
  validateOriginalRuntimeEnvironmentReadinessReport(report);
  const runtime = report.installedRuntimeCandidate;
  const historicalRows = report.historicalCandidates.map((item) =>
    `| \`${item.animationId}\` | ${item.scenario}/${item.language} | ${item.frameCount} | \`${item.manifest.sha256}\` | ${item.currentDisposition} |`,
  ).join("\n");
  return `# G4 L3 Original-Runtime Environment Readiness\n\n`
    + `This acceptance-neutral report identifies an installed original-runtime **candidate** without launching it. It does not authorize a runtime session or promote historical captures.\n\n`
    + `## Installed candidate\n\n`
    + `- Runtime: **${runtime.name} ${runtime.version}** (\`${runtime.runtimeId}\`).\n`
    + `- Executable: \`${runtime.executable.path}\` / \`${runtime.executable.sha256}\` / ${runtime.executable.bytes.toLocaleString("en-US")} bytes / ${runtime.executable.architecture}.\n`
    + `- Code signature metadata: \`${runtime.codeSignature.identifier}\`, team \`${runtime.codeSignature.teamIdentifier}\`; current macOS strict verification: **${runtime.codeSignature.strictVerification.disposition}**.\n`
    + `- Compatibility: Rosetta receipt **installed** on ${report.compatibilityLayer.hostArchitecture}; this is not runtime authorization.\n\n`
    + `## Execution gate\n\n`
    + `- State: **${report.executionGate.state}**.\n`
    + `- Owner runtime approval: **false**; named runtime operator: **0**; authorized host context: **0**; approved network containment: **false**.\n`
    + `- Bound capacity snapshot: \`${report.capacityBoundary.boundSnapshotAdmission}\`; v2 capacity preflight **passes** using remaining evidence × 1.20 + 100 GiB. This report still grants **no execution authorization**, and every session requires a fresh snapshot.\n`
    + `- ${report.executionGate.reason}\n\n`
    + `## Historical unpromoted candidate\n\n`
    + `| Animation | Scenario/language | Frames reverified | Manifest SHA-256 | Current disposition |\n`
    + `|---|---|---:|---|---|\n${historicalRows}\n\n`
    + `The IN009 schema-v1 frame set remains useful historical evidence, but it lacks the current requirement, trace, entry-state, operator, trust, human-review, owner, and promotion bindings. It therefore leaves authoritative baseline packages at **0/40**.\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(ROOT, argv[++index] || "");
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(ROOT, argv[++index] || "");
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildOriginalRuntimeEnvironmentReadinessReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(options.jsonOutput, "utf8"),
      readFile(options.markdownOutput, "utf8"),
    ]);
    invariant(currentJson === json, `${relative(options.jsonOutput)} is stale`);
    invariant(currentMarkdown === markdown, `${relative(options.markdownOutput)} is stale`);
    process.stdout.write(`PASS ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)} are current\n`);
    return;
  }
  await Promise.all([writeFile(options.jsonOutput, json), writeFile(options.markdownOutput, markdown)]);
  process.stdout.write(`Wrote ${relative(options.jsonOutput)} and ${relative(options.markdownOutput)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
