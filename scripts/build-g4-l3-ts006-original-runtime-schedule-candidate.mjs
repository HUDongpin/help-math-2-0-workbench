#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const OUTPUT_JSON = "reports/g4-l3-ts006-original-runtime-schedule-candidate.json";
const OUTPUT_MARKDOWN = "reports/g4-l3-ts006-original-runtime-schedule-candidate.md";
const INPUTS = Object.freeze({
  protocol: "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json",
  firstSessionReadiness: "reports/g4-l3-first-original-runtime-session-readiness.json",
  containment: "reports/g4-l3-original-runtime-containment-readiness.json",
  capacity: "reports/g4-l3-capture-capacity-readiness.json",
  runtimeEnvironment: "reports/g4-l3-original-runtime-environment-readiness.json",
  coverage: `migrations/${ANIMATION_ID}/evidence/full-frame-coverage.json`,
  hostTree: `work/original-runtime-host-trees/${ANIMATION_ID}/root/staging-manifest.json`,
});
const HASH = /^[a-f0-9]{64}$/u;
const CONTROL_IDS = Object.freeze(["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08"]);
const STEP_IDS = Object.freeze(["P00", "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09"]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(root, relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath), `invalid project-relative path: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`), `path escapes project root: ${relativePath}`);
  return resolved;
}

async function bindFile(root, relativePath, {parseJson = true} = {}) {
  const absolute = resolveProjectPath(root, relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    ...(parseJson ? {value: JSON.parse(bytes)} : {}),
  };
}

function publicBinding(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function exactInputs(inputs) {
  const {protocol, firstSessionReadiness, containment, capacity, runtimeEnvironment, coverage, hostTree} = inputs;
  invariant(protocol.value.reportType === "g4-l3-ts006-original-runtime-session-protocol-draft"
    && protocol.value.scope?.animationId === ANIMATION_ID
    && protocol.value.summary?.languages === 2
    && protocol.value.summary?.runtimeSessionsExecuted === 0
    && protocol.value.summary?.schedulesAccepted === 0,
  "TS006 protocol is not the expected unexecuted two-language draft");
  invariant(protocol.value.proposedProtocol?.steps?.map(({stepId}) => stepId).join("|") === STEP_IDS.join("|")
    && protocol.value.proposedProtocol?.frameDomainsToDispose?.join("|") === "root|sprite-3|sprite-23"
    && protocol.value.proposedProtocol?.declaredFrameCapacityEnvelope?.framesPerLanguage === 139
    && protocol.value.proposedProtocol?.directSeekAllowed === false
    && protocol.value.proposedProtocol?.authoritativeScheduleEstablished === false,
  "TS006 protocol steps, domains, capacity, or authority boundary drifted");
  invariant(protocol.value.traceCandidates?.length === 2
    && protocol.value.traceCandidates.map(({language}) => language).join("|") === "en|es"
    && protocol.value.traceCandidates.every((candidate) => candidate.authoritativeTraceId === null
      && candidate.authoritativeRequirementIds?.length === 0
      && candidate.captureScheduleAccepted === false
      && candidate.eventScheduleAccepted === false
      && candidate.naturalExecutionProved === false
      && HASH.test(candidate.entryStateCandidateSha256)),
  "TS006 trace candidates were executed, authorized, or malformed");

  invariant(firstSessionReadiness.value.reportType === "g4-l3-first-original-runtime-session-readiness"
    && firstSessionReadiness.value.scope?.releaseId === "lesson-g04-l03-negative-numbers"
    && firstSessionReadiness.value.candidateSelection?.selectedAnimationId === ANIMATION_ID
    && firstSessionReadiness.value.operatorWorksheet?.status === "empty-authorization-template"
    && firstSessionReadiness.value.executionGate?.originalRuntimeExecutionReady === false
    && firstSessionReadiness.value.summary?.runtimeSessionsExecuted === 0,
  "First-session readiness was authorized, executed, or changed candidate");

  invariant(containment.value.reportType === "g4-l3-original-runtime-containment-readiness"
    && containment.value.containmentPlan?.controls?.map(({controlId}) => controlId).join("|") === CONTROL_IDS.join("|")
    && containment.value.containmentPlan?.controls?.every(({approved, verified, selectedMechanism}) => approved === false && verified === false && selectedMechanism === null)
    && containment.value.summary?.containmentControlsApproved === 0
    && containment.value.summary?.runtimeSessionsExecuted === 0,
  "Containment controls were approved, selected, executed, or changed");

  invariant(capacity.value.reportType === "g4-l3-capture-capacity-readiness"
    && capacity.value.capacityModel?.admission === "admit-full-lesson-capture-capacity"
    && capacity.value.capacityModel?.remainingEvidenceSafetyMultiplier === 1.2
    && capacity.value.capacityModel?.operationalReserveBytes === 100 * 1024 ** 3
    && capacity.value.acceptance?.acceptanceNeutral === true,
  "Capacity report no longer provides the required acceptance-neutral admission envelope");

  invariant(runtimeEnvironment.value.reportType === "g4-l3-original-runtime-environment-readiness"
    && runtimeEnvironment.value.summary?.currentStrictCodeSignatureVerificationPassed === true
    && runtimeEnvironment.value.summary?.runtimeSessionsExecuted === 0
    && runtimeEnvironment.value.executionGate?.originalRuntimeExecutionReady === false,
  "Runtime candidate is unbound, executed, or incorrectly authorized");

  invariant(hostTree.value.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree"
    && hostTree.value.selectedCandidate?.animationId === ANIMATION_ID
    && hostTree.value.summary?.files === 657
    && hostTree.value.summary?.bytes === 35_469_789
    && hostTree.value.acceptance?.strictMigrationComplete === false,
  "TS006 host tree is incomplete or promoted");

  invariant(coverage.value.schemaVersion === 2 && coverage.value.animationId === ANIMATION_ID
    && coverage.value.requirements?.length === 4
    && coverage.value.requirements.every(({status, baselineAuthority, baselineAuthorityRequirement}) =>
      status === "pending" && baselineAuthority === "unresolved" && baselineAuthorityRequirement === "original-runtime-natural-trace"),
  "TS006 coverage is not four unresolved natural-trace requirements");
  const identities = coverage.value.requirements.map(({requirementId, frameDomainId, scenario, language, traceId, entryStateSha256, requiredRange}) => ({requirementId, frameDomainId, scenario, language, traceId, entryStateSha256, requiredRange}));
  invariant(identities.every(({entryStateSha256, requiredRange}) => HASH.test(entryStateSha256)
    && Number.isSafeInteger(requiredRange?.firstFrame) && Number.isSafeInteger(requiredRange?.lastFrame)
    && requiredRange.firstFrame === 1 && requiredRange.lastFrame >= requiredRange.firstFrame),
  "TS006 coverage identity is incomplete");
  for (const language of ["en", "es"]) {
    const rows = identities.filter((row) => row.language === language);
    invariant(rows.length === 2
      && rows.some(({frameDomainId, requiredRange}) => frameDomainId === "root" && requiredRange.lastFrame === 10)
      && rows.some(({frameDomainId, requiredRange}) => frameDomainId === "sprite-23" && requiredRange.lastFrame === 128),
    `TS006 ${language} coverage does not contain exact root and sprite-23 obligations`);
  }
  return identities;
}

function sessionCandidate({language, ordinal, traceCandidate, identities, protocol}) {
  const coverageRequirements = identities.filter((row) => row.language === language);
  return {
    ordinal,
    language,
    status: "technical-candidate-not-approved-not-executed",
    requiredFreshMacosAccount: true,
    disposableAccount: {accountIdentifier: null, homeDirectory: null, icloudSignedIn: false, priorBrowserOrFlashStateAllowed: false},
    runtimeProcessPolicy: "one fresh Adobe Flash Player Projector process for this language only",
    hostEntryPolicy: "same-lesson staged index_local.swf natural entry only",
    directSeekPermitted: false,
    protocolTraceCandidateId: traceCandidate.protocolTraceCandidateId,
    entryStateCandidateSha256: traceCandidate.entryStateCandidateSha256,
    authoritativeTraceId: null,
    coverageRequirements,
    independentFrameDomainFrames: coverageRequirements.reduce((sum, {requiredRange}) => sum + requiredRange.lastFrame - requiredRange.firstFrame + 1, 0),
    structuralDispositionCheckpointFrames: 1,
    conservativeOriginalRuntimePngUpperBound: protocol.declaredFrameCapacityEnvelope.framesPerLanguage,
    protocolSteps: structuredClone(protocol.steps),
    requiredOutputs: structuredClone(protocol.requiredOutputs),
    audioReviewRequired: true,
    replayRequired: true,
    previousNextNavigationRequired: true,
    eventScheduleAccepted: false,
    captureScheduleAccepted: false,
    naturalExecutionProved: false,
  };
}

export async function buildTs006OriginalRuntimeScheduleCandidate({root = ROOT} = {}) {
  const entries = await Promise.all(Object.entries(INPUTS).map(async ([key, relativePath]) => [key, await bindFile(root, relativePath)]));
  const inputs = Object.fromEntries(entries);
  const identities = exactInputs(inputs);
  const protocol = inputs.protocol.value.proposedProtocol;
  const sessions = ["en", "es"].map((language, index) => sessionCandidate({
    language,
    ordinal: index + 1,
    traceCandidate: inputs.protocol.value.traceCandidates.find((candidate) => candidate.language === language),
    identities,
    protocol,
  }));
  invariant(sessions.every(({independentFrameDomainFrames, structuralDispositionCheckpointFrames, conservativeOriginalRuntimePngUpperBound}) =>
    independentFrameDomainFrames === 138 && structuralDispositionCheckpointFrames === 1 && conservativeOriginalRuntimePngUpperBound === 139),
  "TS006 schedule candidate frame accounting drifted");

  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-original-runtime-schedule-candidate",
    generator: await bindFile(root, portable(path.relative(root, SCRIPT_PATH)), {parseJson: false}).then(publicBinding),
    sourceBindings: Object.fromEntries(Object.entries(inputs).map(([key, binding]) => [key, publicBinding(binding)])),
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      animationId: ANIMATION_ID,
      languages: ["en", "es"],
      nativeStage: {width: 800, height: 600},
      fps: 12,
    },
    scheduleCandidate: {
      status: "technical-candidate-pending-owner-containment-and-operator-approval",
      authority: "reviewable machine-generated schedule candidate only",
      sessions,
      requiredControlIds: [...CONTROL_IDS],
      controlApprovalsRecorded: 0,
      namedOperatorsRecorded: 0,
      ownerApprovalsRecorded: 0,
      authorizedHostContextsRecorded: 0,
      launchCommands: [],
      runtimeSessionsExecuted: 0,
      baselinePackagesEstablished: 0,
    },
    authorizationTemplate: {
      status: "blank-not-a-decision",
      owner: {fullName: null, role: null, decision: null, decidedAt: null, signatureEnvelope: null},
      containmentApprover: {fullName: null, role: null, approvedControlIds: [], decidedAt: null, signatureEnvelope: null},
      originalRuntimeOperators: {
        en: {fullName: null, role: null, accountIdentifier: null, sessionId: null, signatureEnvelope: null},
        es: {fullName: null, role: null, accountIdentifier: null, sessionId: null, signatureEnvelope: null},
      },
      liveCapacityPreflight: {capturedAt: null, availableBytes: null, minimumRequiredBytes: null, passed: false, evidence: null},
      authorizedHostContext: null,
      selectedContainmentMechanisms: [],
      launchPath: null,
      launchCommand: null,
    },
    executionGate: {
      technicalScheduleCandidatePrepared: true,
      scheduleAcceptedByOwner: false,
      containmentControlsApproved: false,
      containmentControlsVerified: false,
      namedOperatorsBound: false,
      freshDisposableAccountsBound: false,
      authorizedHostContextBound: false,
      liveCapacityPreflightPassed: false,
      noEgressVerified: false,
      emptySharedObjectStoresVerified: false,
      originalRuntimeExecutionReady: false,
      state: "closed-pending-human-authorization-and-live-preflight",
    },
    acceptance: {
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAcceptance: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    strictAcceptanceEffect: "none; this report fixes a reviewable two-session technical candidate but records no human identity, approval, launch, runtime observation, baseline, audio review, fidelity comparison, acceptance, completion, or publication",
  };
  report.scheduleCandidateSha256 = sha256(Buffer.from(canonical(report.scheduleCandidate)));
  report.reportFingerprintSha256 = sha256(Buffer.from(canonical(report)));
  return validateTs006OriginalRuntimeScheduleCandidate(report);
}

export function validateTs006OriginalRuntimeScheduleCandidate(report) {
  invariant(report?.schemaVersion === 1 && report.reportType === "g4-l3-ts006-original-runtime-schedule-candidate", "TS006 schedule-candidate identity drifted");
  invariant(report.scope?.animationId === ANIMATION_ID && report.scope?.languages?.join("|") === "en|es", "TS006 schedule-candidate scope drifted");
  invariant(report.scheduleCandidate?.sessions?.length === 2
    && report.scheduleCandidate.sessions.map(({language}) => language).join("|") === "en|es"
    && report.scheduleCandidate.sessions.every((session) => session.status === "technical-candidate-not-approved-not-executed"
      && session.requiredFreshMacosAccount === true
      && session.directSeekPermitted === false
      && session.coverageRequirements?.length === 2
      && session.independentFrameDomainFrames === 138
      && session.structuralDispositionCheckpointFrames === 1
      && session.conservativeOriginalRuntimePngUpperBound === 139
      && session.authoritativeTraceId === null
      && session.captureScheduleAccepted === false
      && session.eventScheduleAccepted === false
      && session.naturalExecutionProved === false),
  "TS006 schedule-candidate sessions drifted or were promoted");
  invariant(report.scheduleCandidate.requiredControlIds?.join("|") === CONTROL_IDS.join("|")
    && report.scheduleCandidate.controlApprovalsRecorded === 0
    && report.scheduleCandidate.namedOperatorsRecorded === 0
    && report.scheduleCandidate.ownerApprovalsRecorded === 0
    && report.scheduleCandidate.launchCommands?.length === 0
    && report.scheduleCandidate.runtimeSessionsExecuted === 0
    && report.scheduleCandidate.baselinePackagesEstablished === 0,
  "TS006 schedule-candidate authorization counts drifted");
  invariant(report.authorizationTemplate?.status === "blank-not-a-decision"
    && report.authorizationTemplate.owner?.fullName === null
    && report.authorizationTemplate.owner?.decision === null
    && report.authorizationTemplate.containmentApprover?.fullName === null
    && report.authorizationTemplate.containmentApprover?.approvedControlIds?.length === 0
    && report.authorizationTemplate.originalRuntimeOperators?.en?.fullName === null
    && report.authorizationTemplate.originalRuntimeOperators?.es?.fullName === null
    && report.authorizationTemplate.launchCommand === null,
  "TS006 blank authorization template was filled or changed");
  invariant(report.executionGate?.technicalScheduleCandidatePrepared === true
    && Object.entries(report.executionGate).every(([key, value]) => key === "technicalScheduleCandidatePrepared" || key === "state" || value === false)
    && report.executionGate.originalRuntimeExecutionReady === false,
  "TS006 execution gate was opened");
  invariant(Object.values(report.acceptance || {}).every((value) => value === false), "TS006 schedule candidate contains an acceptance promotion");
  invariant(HASH.test(report.scheduleCandidateSha256)
    && report.scheduleCandidateSha256 === sha256(Buffer.from(canonical(report.scheduleCandidate))),
  "TS006 schedule-candidate digest drifted");
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  invariant(HASH.test(report.reportFingerprintSha256)
    && report.reportFingerprintSha256 === sha256(Buffer.from(canonical(projection))),
  "TS006 schedule-candidate report fingerprint drifted");
  return report;
}

export function renderMarkdown(report) {
  const rows = report.scheduleCandidate.sessions.map((session) =>
    `| ${session.ordinal} | ${session.language.toUpperCase()} | ${session.coverageRequirements.map(({requirementId}) => `\`${requirementId}\``).join("<br>")} | ${session.independentFrameDomainFrames} + ${session.structuralDispositionCheckpointFrames} checkpoint | pending |`,
  ).join("\n");
  return `# G4 L3 TS006 Original-Runtime Schedule Candidate\n\n`
    + `This is a non-executable, acceptance-neutral candidate for human review. It does not authorize Flash Player launch or establish an authoritative trace.\n\n`
    + `| Session | Language | Coverage requirements | Conservative frame envelope | Authorization |\n|---:|---|---|---:|---|\n${rows}\n\n`
    + `- Required controls: **${report.scheduleCandidate.requiredControlIds.join(", ")}**; approved: **0/8**.\n`
    + `- Process isolation: one fresh Projector process and one fresh disposable macOS account per language.\n`
    + `- Natural entry: staged same-lesson \`index_local.swf\` only; direct seek is prohibited for primary evidence.\n`
    + `- Owner decisions / named operators / runtime sessions / authoritative baselines: **0 / 0 / 0 / 0**.\n`
    + `- Technical schedule digest: \`${report.scheduleCandidateSha256}\`.\n\n`
    + `The authorization template remains blank. A named owner, containment approver, and named EN/ES operators must bind immutable signed envelopes plus a live capacity/no-egress/empty-SharedObject preflight before any execution can be considered authorized.\n`;
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildTs006OriginalRuntimeScheduleCandidate();
  const json = pretty(report);
  const markdown = renderMarkdown(report);
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(resolveProjectPath(ROOT, OUTPUT_JSON), "utf8"),
      readFile(resolveProjectPath(ROOT, OUTPUT_MARKDOWN), "utf8"),
    ]);
    invariant(currentJson === json, `${OUTPUT_JSON} is stale`);
    invariant(currentMarkdown === markdown, `${OUTPUT_MARKDOWN} is stale`);
    process.stdout.write(`PASS ${OUTPUT_JSON} and ${OUTPUT_MARKDOWN} are current; execution closed\n`);
    return;
  }
  await Promise.all([
    atomicWrite(resolveProjectPath(ROOT, OUTPUT_JSON), Buffer.from(json)),
    atomicWrite(resolveProjectPath(ROOT, OUTPUT_MARKDOWN), Buffer.from(markdown)),
  ]);
  process.stdout.write(`WROTE TS006 two-session technical schedule candidate; 0 approvals, 0 runtime sessions\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
