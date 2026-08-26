#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-original-runtime-containment-readiness";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);
const SHA256 = /^[a-f0-9]{64}$/;

const INPUTS = Object.freeze([
  {
    key: "sourceOperationIndexV2",
    file: "reports/g4-l3-source-operation-index-v2.json",
    reportType: "g4-l3-actionscript-source-operation-index",
    schemaVersion: 2,
  },
  {
    key: "shellLegacyHostDependencyContract",
    file: "reports/g4-l3-shell-legacy-host-dependency-contract.json",
    reportType: "g4-l3-shell-legacy-host-dependency-disposition-contract",
    schemaVersion: 1,
  },
  {
    key: "originalRuntimeEnvironmentReadiness",
    file: "reports/g4-l3-original-runtime-environment-readiness.json",
    reportType: "g4-l3-original-runtime-environment-readiness",
    schemaVersion: 1,
  },
]);

const EXPECTED_API_COUNTS = Object.freeze({
  "SharedObject.getLocal": 1,
  "Sound.loadSound": 1,
  "XML.load": 2,
  fscommand: 5,
  getURL: 6,
  loadMovie: 5,
  loadVariablesNum: 3,
});

const EXPECTED_RISK_COUNTS = Object.freeze({
  "external-resource-load": 8,
  "host-control": 5,
  "local-persistent-state": 1,
  "outbound-or-script-navigation": 6,
  "outbound-post": 3,
});

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
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

function resolveProjectPath(file) {
  const absolute = path.resolve(ROOT, file);
  const candidate = path.relative(ROOT, absolute);
  invariant(candidate && !candidate.startsWith("..") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return absolute;
}

async function projectBinding(file) {
  const bytes = await readFile(file);
  return {file: relative(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function readInput(definition) {
  const absolute = resolveProjectPath(definition.file);
  const bytes = await readFile(absolute);
  const report = JSON.parse(bytes);
  invariant(report.reportType === definition.reportType && report.schemaVersion === definition.schemaVersion,
    `${definition.key}: report identity drifted`);
  const generatorFile = report.generator?.file ?? report.generator?.path;
  invariant(typeof generatorFile === "string" && generatorFile.startsWith("scripts/") && !generatorFile.includes(".."),
    `${definition.key}: generator binding is missing or unsafe`);
  const generator = await projectBinding(resolveProjectPath(generatorFile));
  if (report.generator.sha256 !== undefined) {
    invariant(report.generator.sha256 === generator.sha256, `${definition.key}: generator hash is stale`);
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

function counts(values, key) {
  const result = {};
  for (const value of values) result[key(value)] = (result[key(value)] || 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right, "en")));
}

function riskClass(api) {
  if (api === "getURL") return "outbound-or-script-navigation";
  if (api === "loadVariablesNum") return "outbound-post";
  if (["loadMovie", "Sound.loadSound", "XML.load"].includes(api)) return "external-resource-load";
  if (api === "fscommand") return "host-control";
  if (api === "SharedObject.getLocal") return "local-persistent-state";
  throw new Error(`Unclassified external API: ${api}`);
}

function operationRecord(item, operation) {
  const record = {
    animationId: item.animationId,
    operationId: operation.operationId,
    api: operation.externalApi,
    riskClass: riskClass(operation.externalApi),
    scriptPath: operation.scriptPath,
    scriptSha256: operation.scriptSha256,
    lineNumber: operation.lineNumber,
    scope: operation.scope,
    exactExpression: operation.exactExpression,
    argumentExpressions: operation.argumentExpressions,
    sourceEventIds: operation.sourceEventIds,
    runtimeReachabilityEstablished: false,
    executionAuthorized: false,
  };
  return {...record, operationFingerprintSha256: sha256(Buffer.from(stableJson(record)))};
}

function externalOperations(item) {
  return item.operations
    .filter((operation) => operation.categories.includes("external"))
    .map((operation) => operationRecord(item, operation));
}

function shellCandidateKey(candidate) {
  return `${candidate.api}\0${candidate.source.scriptPath}\0${candidate.source.lineNumber}`;
}

function operationKey(operation) {
  return `${operation.api}\0${operation.scriptPath}\0${operation.lineNumber}`;
}

function containmentControls() {
  return [
    {
      controlId: "CR-01",
      requirement: "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-02",
      requirement: "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-03",
      requirement: "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-04",
      requirement: "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-05",
      requirement: "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-06",
      requirement: "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-07",
      requirement: "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
    {
      controlId: "CR-08",
      requirement: "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
      selectedMechanism: null,
      approved: false,
      verified: false,
    },
  ];
}

export async function buildOriginalRuntimeContainmentReadiness() {
  const inputs = [];
  for (const definition of INPUTS) inputs.push(await readInput(definition));
  const byKey = Object.fromEntries(inputs.map((input) => [input.definition.key, input.report]));
  const operationsReport = byKey.sourceOperationIndexV2;
  const shellContract = byKey.shellLegacyHostDependencyContract;
  const environment = byKey.originalRuntimeEnvironmentReadiness;

  invariant(operationsReport.summary.canonicalItems === 40
    && operationsReport.summary.exactOperationCount === 3403
    && operationsReport.summary.exactExternalCallsResolved === 23
    && operationsReport.summary.exactOperationsByCategory.external === 23
    && operationsReport.items.length === 40,
  "Source-operation external surface drifted");
  invariant(shellContract.summary.staticExactCallCount === 20
    && shellContract.acceptance.legacyEndpointExecutions === 0
    && Object.values(shellContract.acceptance.gates).every((value) => value === false),
  "Shell dependency contract drifted or was promoted");
  invariant(environment.executionGate.installedRuntimeCandidateIdentified === true
    && environment.executionGate.originalRuntimeExecutionReady === false
    && environment.capacityBoundary.boundedSessionAdmitted === false
    && environment.summary.runtimeSessionsExecuted === 0,
  "Original-runtime environment is not safely candidate-only");

  const itemRows = operationsReport.items.map((item) => {
    const operations = externalOperations(item);
    return operations.length ? {
      sequence: item.sequence,
      animationId: item.animationId,
      releaseRole: item.releaseRole,
      sourceSwf: item.source.swf,
      exactExternalOperationCount: operations.length,
      apiCounts: counts(operations, (operation) => operation.api),
      riskCounts: counts(operations, (operation) => operation.riskClass),
      operations,
      runtimeReachabilityEstablished: false,
      safeToExecuteNow: false,
    } : null;
  }).filter(Boolean);
  const allOperations = itemRows.flatMap((item) => item.operations);
  const apiCounts = counts(allOperations, (operation) => operation.api);
  const riskCounts = counts(allOperations, (operation) => operation.riskClass);
  invariant(stableJson(apiCounts) === stableJson(EXPECTED_API_COUNTS),
    "Exact external API counts drifted");
  invariant(stableJson(riskCounts) === stableJson(EXPECTED_RISK_COUNTS),
    "External side-effect risk counts drifted");
  invariant(itemRows.map((item) => item.animationId).join("|")
    === "course-g04-l03-fq-002|course-g04-l03-fq-003|shell-course-g04-l03-index-local",
  "External side-effect member set drifted");

  const shellOperations = itemRows.find((item) =>
    item.animationId === "shell-course-g04-l03-index-local").operations;
  const shellStaticCandidates = shellContract.candidates.filter((candidate) =>
    candidate.evidenceKind === "static-exact-source-call");
  invariant(shellOperations.length === 20 && shellStaticCandidates.length === 20,
    "Shell external operation count drifted");
  invariant([...shellOperations.map(operationKey)].sort().join("\n")
    === [...shellStaticCandidates.map(shellCandidateKey)].sort().join("\n"),
  "Source-operation and shell-contract external call identities disagree");

  const controls = containmentControls();
  const report = {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator: await projectBinding(GENERATOR_PATH),
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      canonicalItems: 40,
      activePages: 39,
      courseShells: 1,
      purpose: "static external-side-effect inventory and pre-execution containment requirements only",
    },
    sourceBindings: Object.fromEntries(inputs.map((input) => [input.definition.key, input.binding])),
    installedCandidateBinding: {
      runtimeId: environment.installedRuntimeCandidate.runtimeId,
      version: environment.installedRuntimeCandidate.version,
      executable: environment.installedRuntimeCandidate.executable,
      approvedForExecution: false,
    },
    staticExternalSurface: {
      classification: "exact-static-source-operations-not-runtime-reachability",
      affectedMembers: itemRows,
      exactExternalOperationCount: allOperations.length,
      apiCounts,
      riskCounts,
      networkCapableOrScriptNavigationOperations:
        riskCounts["outbound-or-script-navigation"]
        + riskCounts["outbound-post"]
        + riskCounts["external-resource-load"],
      hostControlOperations: riskCounts["host-control"],
      localPersistentStateOperations: riskCounts["local-persistent-state"],
      runtimeReachabilityEstablished: false,
    },
    containmentPlan: {
      state: "requirements-specified-controls-unselected-unapproved",
      controls,
      controlsSpecified: controls.length,
      controlsWithSelectedMechanism: 0,
      controlsApproved: 0,
      controlsVerified: 0,
      legacyEndpointAllowlist: [],
      allowedOutboundDestinations: [],
      launchCommand: null,
      runtimeProfilePath: null,
      readOnlyLessonTree: null,
      namedOriginalRuntimeOperator: null,
      authorizedHostContext: null,
      ownerApprovalReceipt: null,
    },
    executionGate: {
      state: "closed-awaiting-approved-side-effect-containment",
      exactExternalSurfaceBound: true,
      installedRuntimeCandidateBound: true,
      oneItemPerFreshProcessRequired: true,
      outboundDenyMechanismSelected: false,
      outboundDenyMechanismApproved: false,
      noEgressVerificationPassed: false,
      readOnlyLocalDependencyAllowlistBound: false,
      ephemeralRuntimeProfileBound: false,
      emptySharedObjectStoreVerified: false,
      namedOriginalRuntimeOperatorSupplied: false,
      authorizedHostContextIdentified: false,
      ownerRuntimeApprovalBound: false,
      liveCapacityPreflightPassed: false,
      originalRuntimeExecutionReady: false,
      launchesRuntimeByThisBuilder: false,
      executesLegacyEndpointsByThisBuilder: false,
      reason: "The exact 23-operation static side-effect surface is bound, but no network-deny mechanism, local dependency allowlist, ephemeral profile, named runtime operator, authorized host, owner approval, or live capacity pass is bound.",
    },
    summary: {
      canonicalItems: 40,
      affectedMembers: itemRows.length,
      exactExternalOperations: allOperations.length,
      networkCapableOrScriptNavigationOperations: 17,
      hostControlOperations: 5,
      localPersistentStateOperations: 1,
      containmentControlsSpecified: controls.length,
      containmentControlsApproved: 0,
      runtimeSessionsExecuted: 0,
      authoritativeBaselinePackagesEstablished: 0,
      strictCompletions: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      exactStaticExternalSurfaceEstablished: true,
      containmentPlanApproved: false,
      runtimeApproved: false,
      runtimeReachabilityEstablished: false,
      authoritativeOriginalRuntimeAccepted: false,
      implementationAuthorized: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      statement: "This report binds exact static ActionScript side-effect candidates and specifies fail-closed controls. It launches no runtime and executes no endpoint. Static calls do not prove reachability, and unselected controls do not constitute containment, authorization, baseline evidence, acceptance, parity, or completion.",
    },
  };
  return validateOriginalRuntimeContainmentReadiness(report);
}

export function validateOriginalRuntimeContainmentReadiness(report) {
  invariant(report.schemaVersion === 1 && report.reportType === REPORT_BASENAME,
    "Original-runtime containment report identity drifted");
  invariant(report.scope.canonicalItems === 40 && report.scope.activePages === 39
    && report.scope.courseShells === 1 && Object.keys(report.sourceBindings).length === INPUTS.length,
  "Original-runtime containment scope or bindings drifted");
  for (const definition of INPUTS) {
    const binding = report.sourceBindings[definition.key];
    invariant(binding?.file === definition.file && binding.reportType === definition.reportType
      && binding.schemaVersion === definition.schemaVersion && SHA256.test(binding.sha256)
      && binding.generator?.file.startsWith("scripts/") && SHA256.test(binding.generator.sha256),
    `${definition.key}: containment source binding drifted`);
  }
  invariant(report.installedCandidateBinding.runtimeId === "adobe-flash-player-projector"
    && report.installedCandidateBinding.version === "32.0.0.414"
    && report.installedCandidateBinding.executable.sha256
      === "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30"
    && report.installedCandidateBinding.approvedForExecution === false,
  "Containment runtime candidate binding drifted or was approved");
  const surface = report.staticExternalSurface;
  invariant(surface.affectedMembers.length === 3
    && surface.exactExternalOperationCount === 23
    && stableJson(surface.apiCounts) === stableJson(EXPECTED_API_COUNTS)
    && stableJson(surface.riskCounts) === stableJson(EXPECTED_RISK_COUNTS)
    && surface.networkCapableOrScriptNavigationOperations === 17
    && surface.hostControlOperations === 5
    && surface.localPersistentStateOperations === 1
    && surface.runtimeReachabilityEstablished === false,
  "Original-runtime static external surface drifted or was promoted");
  invariant(surface.affectedMembers.every((item) => item.runtimeReachabilityEstablished === false
    && item.safeToExecuteNow === false
    && item.operations.every((operation) => operation.runtimeReachabilityEstablished === false
      && operation.executionAuthorized === false && SHA256.test(operation.operationFingerprintSha256))),
  "Original-runtime affected-member disposition was promoted");
  invariant(report.containmentPlan.state === "requirements-specified-controls-unselected-unapproved"
    && report.containmentPlan.controls.length === 8
    && report.containmentPlan.controlsSpecified === 8
    && report.containmentPlan.controlsWithSelectedMechanism === 0
    && report.containmentPlan.controlsApproved === 0
    && report.containmentPlan.controlsVerified === 0
    && report.containmentPlan.controls.every((control) => control.selectedMechanism === null
      && control.approved === false && control.verified === false)
    && report.containmentPlan.allowedOutboundDestinations.length === 0
    && report.containmentPlan.legacyEndpointAllowlist.length === 0
    && report.containmentPlan.launchCommand === null
    && report.containmentPlan.namedOriginalRuntimeOperator === null
    && report.containmentPlan.ownerApprovalReceipt === null,
  "Original-runtime containment controls were selected or promoted");
  const allowedTrueGateKeys = new Set([
    "exactExternalSurfaceBound",
    "installedRuntimeCandidateBound",
    "oneItemPerFreshProcessRequired",
  ]);
  for (const [key, value] of Object.entries(report.executionGate)) {
    if (typeof value === "boolean") {
      invariant(value === allowedTrueGateKeys.has(key), `Original-runtime containment gate ${key} drifted`);
    }
  }
  invariant(report.executionGate.state === "closed-awaiting-approved-side-effect-containment"
    && report.executionGate.originalRuntimeExecutionReady === false,
  "Original-runtime containment execution gate opened");
  invariant(report.summary.canonicalItems === 40 && report.summary.affectedMembers === 3
    && report.summary.exactExternalOperations === 23
    && report.summary.networkCapableOrScriptNavigationOperations === 17
    && report.summary.hostControlOperations === 5
    && report.summary.localPersistentStateOperations === 1
    && report.summary.containmentControlsSpecified === 8
    && report.summary.containmentControlsApproved === 0
    && report.summary.runtimeSessionsExecuted === 0
    && report.summary.authoritativeBaselinePackagesEstablished === 0
    && report.summary.strictCompletions === 0,
  "Original-runtime containment summary drifted");
  invariant(report.acceptance.acceptanceNeutral === true
    && report.acceptance.exactStaticExternalSurfaceEstablished === true
    && Object.entries(report.acceptance)
      .filter(([key]) => !["acceptanceNeutral", "exactStaticExternalSurfaceEstablished", "statement"].includes(key))
      .every(([, value]) => value === false),
  "Original-runtime containment acceptance was promoted");
  return report;
}

export function renderMarkdown(report) {
  validateOriginalRuntimeContainmentReadiness(report);
  const itemRows = report.staticExternalSurface.affectedMembers.map((item) =>
    `| ${item.sequence} | \`${item.animationId}\` | ${item.exactExternalOperationCount} | ${Object.entries(item.apiCounts).map(([api, count]) => `${api}:${count}`).join(", ")} | closed |`,
  ).join("\n");
  const apiRows = Object.entries(report.staticExternalSurface.apiCounts)
    .map(([api, count]) => `| ${api} | ${count} |`).join("\n");
  const controlRows = report.containmentPlan.controls.map((control) =>
    `| ${control.controlId} | ${control.requirement} | unselected | false | false |`,
  ).join("\n");
  return `# G4 L3 Original-Runtime Side-Effect Containment Readiness\n\n`
    + `This acceptance-neutral report binds the exact static ActionScript side-effect surface before any original-runtime session. It launches nothing and authorizes nothing.\n\n`
    + `## Result\n\n`
    + `- Affected members: **${report.summary.affectedMembers}/40**. Exact external operations: **${report.summary.exactExternalOperations}**.\n`
    + `- Network-capable/resource/script-navigation operations: **${report.summary.networkCapableOrScriptNavigationOperations}**; host-control operations: **${report.summary.hostControlOperations}**; local persistent-state operations: **${report.summary.localPersistentStateOperations}**.\n`
    + `- Containment controls: **${report.summary.containmentControlsSpecified} specified / ${report.summary.containmentControlsApproved} approved**. Runtime sessions and authoritative baselines remain **0**.\n`
    + `- Execution state: \`${report.executionGate.state}\`.\n\n`
    + `## Exact API surface\n\n| API | Count |\n|---|---:|\n${apiRows}\n\n`
    + `## Affected members\n\n| Seq | Animation | Exact operations | APIs | Execution |\n|---:|---|---:|---|---|\n${itemRows}\n\n`
    + `Static presence does not prove runtime reachability. The remaining 37 members still require the same isolated-session controls because host-loaded dependencies and shared runtime state can introduce side effects.\n\n`
    + `## Required controls\n\n| ID | Requirement | Mechanism | Approved | Verified |\n|---|---|---|---|---|\n${controlRows}\n\n`
    + `## Acceptance boundary\n\n${report.acceptance.statement}\n`;
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") {
      invariant(index + 1 < argv.length, "--json-output requires a value");
      options.jsonOutput = path.resolve(ROOT, argv[++index]);
    } else if (argument === "--markdown-output") {
      invariant(index + 1 < argv.length, "--markdown-output requires a value");
      options.markdownOutput = path.resolve(ROOT, argv[++index]);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await buildOriginalRuntimeContainmentReadiness();
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
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
