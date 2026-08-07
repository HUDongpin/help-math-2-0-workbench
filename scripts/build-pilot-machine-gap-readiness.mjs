#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, readdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_STRICT_REPORT = "reports/pilot-strict-acceptance.json";
const DEFAULT_VB004_REVIEW_PACKET = "reports/vb004-semantic-review-packet.json";
const DEFAULT_JSON_OUTPUT = "reports/pilot-machine-gap-readiness.json";
const DEFAULT_MARKDOWN_OUTPUT = "reports/pilot-machine-gap-readiness.md";

const EXPECTED_GATE_IDS = [
  "authoritative-baseline",
  "implementation-route",
  "deterministic-frame-contract",
  "full-frame-scenario-coverage",
  "rmse-thresholds",
  "english-spanish-evidence",
  "audio-hash-listening-sync",
  "replay-interaction-random",
  "product-qa",
  "engineering-review",
  "human-review",
  "owner-acceptance",
  "strict-validator",
  "regression-tests",
  "production-build",
];

const DOWNSTREAM_DEPENDENCIES = {
  "full-frame-scenario-coverage": ["authoritative-baseline", "deterministic-frame-contract"],
  "rmse-thresholds": ["authoritative-baseline", "full-frame-scenario-coverage"],
  "english-spanish-evidence": ["full-frame-scenario-coverage"],
  "replay-interaction-random": ["authoritative-baseline", "full-frame-scenario-coverage"],
  "product-qa": ["full-frame-scenario-coverage", "rmse-thresholds"],
};

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function posixRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

async function readArtifact(root, relativePath, label) {
  const absolutePath = path.resolve(root, relativePath);
  invariant(
    absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`),
    `${label} resolves outside the project root`,
  );
  const bytes = await readFile(absolutePath);
  return {
    path: posixRelative(root, absolutePath),
    bytes,
    sha256: sha256(bytes),
    value: JSON.parse(bytes.toString("utf8")),
  };
}

async function isDirectory(filePath) {
  try {
    return (await stat(filePath)).isDirectory();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function listQaArtifacts(root, workspace) {
  const evidenceDirectory = path.resolve(root, workspace, "evidence");
  invariant(
    evidenceDirectory.startsWith(`${root}${path.sep}`),
    `${workspace}: evidence directory resolves outside the project root`,
  );
  if (!(await isDirectory(evidenceDirectory))) {
    return {
      evidenceDirectoryExists: false,
      canonicalBehaviorQaExists: false,
      canonicalProductQaExists: false,
      nonCanonicalQaRecords: [],
    };
  }
  const qaFiles = (await readdir(evidenceDirectory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && /qa\.json$/i.test(entry.name))
    .map((entry) => posixRelative(root, path.join(evidenceDirectory, entry.name)))
    .sort();
  const behaviorPath = `${workspace}/evidence/behavior-qa.json`;
  const productPath = `${workspace}/evidence/product-qa.json`;
  return {
    evidenceDirectoryExists: true,
    canonicalBehaviorQaExists: qaFiles.includes(behaviorPath),
    canonicalProductQaExists: qaFiles.includes(productPath),
    nonCanonicalQaRecords: qaFiles.filter((item) => item !== behaviorPath && item !== productPath),
  };
}

function failed(gatesById, gateId) {
  return gatesById.get(gateId)?.status !== "pass";
}

function result(gate, closureClass, dependencies, reason, machineClosableNow = false) {
  return {
    gateId: gate.id,
    status: gate.status,
    closureClass,
    machineClosableNow,
    dependencies,
    reason,
  };
}

export function classifyGate({gate, gatesById, vb004ReviewPending}) {
  invariant(gate && EXPECTED_GATE_IDS.includes(gate.id), `Unsupported pilot gate ${gate?.id ?? "(missing)"}`);
  if (gate.status === "pass") {
    return result(gate, "passed", [], "The strict report already proves this gate.");
  }
  invariant(gate.status === "fail", `${gate.id}: unsupported status ${gate.status}`);

  if (gate.id === "authoritative-baseline") {
    return result(
      gate,
      "original-runtime-authority-required",
      ["named-human-original-runtime-session"],
      "Current JavaScript output and static SWF/FLA audits cannot create authoritative original-runtime frame evidence.",
    );
  }
  if (gate.id === "audio-hash-listening-sync") {
    return result(
      gate,
      "audio-listening-authority-required",
      ["named-human-listening-and-natural-host-traversal"],
      "Hashes and cue inventories are machine-checkable, but listening, language, natural traversal, synchronization, and Replay acceptance are not.",
    );
  }
  if (gate.id === "engineering-review") {
    return result(
      gate,
      "review-record-required",
      ["dated-named-engineering-review"],
      "The gate requires an accepted named engineering review record; this report is not an acceptance record.",
    );
  }
  if (gate.id === "human-review") {
    return result(
      gate,
      "human-visual-authority-required",
      ["named-human-hash-bound-visual-review"],
      "Automation cannot perform or sign the required visual review.",
    );
  }
  if (gate.id === "owner-acceptance") {
    return result(
      gate,
      "owner-authority-required",
      ["owner-hash-bound-acceptance"],
      "Automation cannot infer or sign owner acceptance.",
    );
  }

  if (gate.id === "implementation-route") {
    const evidenceConstrained = gate.reasons.some((item) =>
      /renderer frame-domain support|blocked|unavailable|not fully renderable/i.test(item),
    );
    if (evidenceConstrained) {
      return result(
        gate,
        "behavior-specification-evidence-required",
        ["source-evidenced-or-original-runtime-behavior"],
        "The route exists, but one or more pure renderer states are deliberately blocked; synthesizing them would violate the fidelity boundary.",
      );
    }
    return result(
      gate,
      "machine-closable-now",
      [],
      "The strict report exposes only implementation artifacts or routing defects and no authority-bound reason.",
      true,
    );
  }

  if (gate.id === "deterministic-frame-contract") {
    const evidenceConstrained = failed(gatesById, "implementation-route") || gate.reasons.some((item) =>
      /unresolved structurally reachable|blocked|unavailable|not fully renderable/i.test(item),
    );
    if (evidenceConstrained) {
      return result(
        gate,
        "behavior-specification-evidence-required",
        ["source-evidenced-or-original-runtime-behavior", "fully-renderable-pure-state-contract"],
        "Deterministic capture cannot safely cover unresolved or deliberately blocked frame domains.",
      );
    }
    return result(
      gate,
      "machine-closable-now",
      [],
      "The implementation is renderable and the remaining deterministic capture contract is machine-owned.",
      true,
    );
  }

  if (Object.hasOwn(DOWNSTREAM_DEPENDENCIES, gate.id)) {
    const unmet = DOWNSTREAM_DEPENDENCIES[gate.id].filter((item) => failed(gatesById, item));
    if (unmet.length > 0) {
      return result(
        gate,
        "downstream-prerequisite-blocked",
        unmet,
        `This gate cannot close before ${unmet.join(", ")} passes; preparatory current-JavaScript QA is not strict acceptance.`,
      );
    }
    return result(
      gate,
      "machine-closable-now",
      [],
      "All modeled authority prerequisites pass; the remaining comparison or QA work is machine-owned.",
      true,
    );
  }

  if (gate.id === "strict-validator") {
    const unmet = EXPECTED_GATE_IDS.filter((item) => item !== "strict-validator" && failed(gatesById, item));
    return result(
      gate,
      unmet.length ? "downstream-prerequisite-blocked" : "machine-closable-now",
      unmet,
      unmet.length
        ? "Strict validation is a downstream closure check and cannot replace its failed evidence gates."
        : "Every evidence gate passes; running the strict validator is machine-owned.",
      unmet.length === 0,
    );
  }

  if (gate.id === "regression-tests") {
    if (vb004ReviewPending) {
      return result(
        gate,
        "protected-review-pin-blocked",
        ["fresh-explicit-vb004-semantic-decision"],
        "The shared full-suite receipt is non-zero while the protected VB004 semantic/scenario binding awaits an explicit named-human decision; automation must not refresh that pin.",
      );
    }
    return result(
      gate,
      "machine-closable-now",
      [],
      "No protected review pin is pending; running and recording the required test suites is machine-owned.",
      true,
    );
  }

  if (gate.id === "production-build") {
    return result(
      gate,
      "machine-closable-now",
      [],
      "Running and recording the production build is machine-owned.",
      true,
    );
  }

  // A new gate must never be silently labeled machine-solvable.
  return result(
    gate,
    "unclassified-fail-closed",
    [],
    "No reviewed closure policy exists for this failing gate.",
  );
}

function summarizeClassifications(pilots) {
  const counts = {};
  for (const pilot of pilots) {
    for (const gate of pilot.gateReadiness) counts[gate.closureClass] = (counts[gate.closureClass] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

export async function buildReport({root = projectRoot} = {}) {
  const resolvedRoot = path.resolve(root);
  const strict = await readArtifact(resolvedRoot, DEFAULT_STRICT_REPORT, "pilot strict report");
  const vb004 = await readArtifact(resolvedRoot, DEFAULT_VB004_REVIEW_PACKET, "VB004 semantic review packet");

  invariant(strict.value.schemaVersion >= 1, "Pilot strict report schema is missing");
  invariant(Array.isArray(strict.value.pilots) && strict.value.pilots.length === 16, "Expected exactly 16 pilots");
  invariant(
    JSON.stringify(strict.value.gateDefinitions.map(({id}) => id)) === JSON.stringify(EXPECTED_GATE_IDS),
    "Pilot strict gate definition order changed; review this classifier before regenerating",
  );
  invariant(vb004.value.animationId === "course-g03-l01-vb-004", "VB004 review packet identity changed");

  const vb004ReviewPending =
    vb004.value.summary?.readyForHumanSemanticDecision === true &&
    vb004.value.summary?.approvalRecorded === false &&
    vb004.value.approvalRequest?.status === "pending-explicit-named-human-semantic-decision";

  const pilots = [];
  for (const pilot of strict.value.pilots) {
    invariant(await isDirectory(path.resolve(resolvedRoot, pilot.workspace)), `${pilot.animationId}: workspace is missing`);
    const manifest = await readArtifact(resolvedRoot, `${pilot.workspace}/migration.json`, `${pilot.animationId} migration manifest`);
    invariant(manifest.value.animationId === pilot.animationId, `${pilot.animationId}: manifest identity mismatch`);
    invariant(manifest.sha256 === pilot.manifestSha256, `${pilot.animationId}: strict report manifest binding is stale`);
    invariant(Array.isArray(pilot.gates) && pilot.gates.length === EXPECTED_GATE_IDS.length, `${pilot.animationId}: gate count changed`);
    const gatesById = new Map(pilot.gates.map((gate) => [gate.id, gate]));
    invariant(gatesById.size === EXPECTED_GATE_IDS.length, `${pilot.animationId}: duplicate or missing gate`);
    const gateReadiness = pilot.gates.map((gate) => classifyGate({gate, gatesById, vb004ReviewPending}));
    const qa = await listQaArtifacts(resolvedRoot, pilot.workspace);
    pilots.push({
      animationId: pilot.animationId,
      workspace: pilot.workspace,
      migrationStatus: pilot.migrationStatus,
      manifestSha256: manifest.sha256,
      strictAccepted: pilot.strictAccepted,
      passedGateCount: pilot.passedGateCount,
      failedGateCount: pilot.failedGateCount,
      workspaceInspection: {
        workspaceExists: true,
        manifestIdentityMatches: true,
        manifestSha256MatchesStrictReport: true,
        ...qa,
      },
      gateReadiness,
      machineClosableFailingGateIds: gateReadiness
        .filter((gate) => gate.status === "fail" && gate.machineClosableNow)
        .map((gate) => gate.gateId),
    });
  }

  const gateCells = pilots.flatMap(({gateReadiness}) => gateReadiness);
  const passedGateCells = gateCells.filter(({status}) => status === "pass").length;
  const failedGateCells = gateCells.filter(({status}) => status === "fail").length;
  const machineClosableGateCells = gateCells.filter(({status, machineClosableNow}) => status === "fail" && machineClosableNow).length;
  const canonicalProductQaPilots = pilots.filter(({workspaceInspection}) => workspaceInspection.canonicalProductQaExists).length;
  const canonicalBehaviorQaPilots = pilots.filter(({workspaceInspection}) => workspaceInspection.canonicalBehaviorQaExists).length;
  const nonCanonicalQaRecords = pilots.reduce((sum, pilot) => sum + pilot.workspaceInspection.nonCanonicalQaRecords.length, 0);

  invariant(passedGateCells === strict.value.summary.passedGates, "Strict report passed-gate summary is internally inconsistent");
  invariant(failedGateCells === strict.value.summary.failedGates, "Strict report failed-gate summary is internally inconsistent");

  return {
    schemaVersion: 1,
    generatedMarker: "deterministic-from-current-pilot-strict-report-and-workspaces",
    generator: posixRelative(resolvedRoot, scriptPath),
    source: {
      strictReport: {path: strict.path, sha256: strict.sha256},
      protectedVb004ReviewPacket: {
        path: vb004.path,
        sha256: vb004.sha256,
        pendingExplicitNamedHumanDecision: vb004ReviewPending,
        reviewScopeSha256: vb004.value.reviewScopeSha256,
      },
    },
    authorityBoundary: {
      changesMigrationStatus: false,
      changesStrictStatus: false,
      changesAcceptanceRecords: false,
      changesCurrentJavascriptApproval: false,
      changesProtectedVb004Pins: false,
      claimsOriginalRuntimeAuthority: false,
      claimsAudioListening: false,
      claimsHumanOrOwnerAcceptance: false,
      rule: "Machine preparation, current-JavaScript QA, or a green generator check never substitutes for original-runtime, listening, human, owner, or strict acceptance evidence.",
    },
    summary: {
      pilotCount: pilots.length,
      workspacesInspected: pilots.length,
      manifestBindingsCurrent: pilots.every(({workspaceInspection}) => workspaceInspection.manifestSha256MatchesStrictReport),
      gateCells: gateCells.length,
      passedGateCells,
      failedGateCells,
      machineClosableFailingGateCellsNow: machineClosableGateCells,
      machineClosablePilotCountNow: pilots.filter(({machineClosableFailingGateIds}) => machineClosableFailingGateIds.length > 0).length,
      productionBuildPassPilots: pilots.filter(({gateReadiness}) => gateReadiness.find(({gateId}) => gateId === "production-build")?.status === "pass").length,
      implementationRoutePassPilots: pilots.filter(({gateReadiness}) => gateReadiness.find(({gateId}) => gateId === "implementation-route")?.status === "pass").length,
      deterministicFrameContractPassPilots: pilots.filter(({gateReadiness}) => gateReadiness.find(({gateId}) => gateId === "deterministic-frame-contract")?.status === "pass").length,
      canonicalProductQaPilots,
      canonicalBehaviorQaPilots,
      nonCanonicalQaRecords,
      classificationCounts: summarizeClassifications(pilots),
    },
    decision: {
      disposition: machineClosableGateCells === 0
        ? "no-safe-machine-only-strict-gate-closure-currently-proven"
        : "safe-machine-only-gate-closure-candidates-exist",
      nextMachineBoundary:
        "Keep implementations, deterministic capture tooling, and QA receipts current, but do not promote any strict gate until its modeled authority prerequisites and protected review inputs are current.",
      currentHighestValuePreparation:
        "Use this hash-bound inventory as the handoff queue: first satisfy the named-human original-runtime and VB004 protected-review prerequisites, then rerun machine capture, RMSE, QA, validator, tests, and build in dependency order.",
    },
    pilots,
  };
}

export function validateReport(report) {
  invariant(report?.schemaVersion === 1, "Unsupported machine-gap readiness schema");
  invariant(report.authorityBoundary?.changesMigrationStatus === false, "Report must not change migration status");
  invariant(report.authorityBoundary?.changesStrictStatus === false, "Report must not change strict status");
  invariant(report.authorityBoundary?.changesAcceptanceRecords === false, "Report must not change acceptance records");
  invariant(report.authorityBoundary?.changesProtectedVb004Pins === false, "Report must not change protected VB004 pins");
  invariant(report.authorityBoundary?.claimsHumanOrOwnerAcceptance === false, "Report must not claim human/owner acceptance");
  invariant(report.summary?.pilotCount === 16 && report.pilots?.length === 16, "Report must cover all 16 pilots");
  invariant(report.summary?.workspacesInspected === 16, "Report must inspect all 16 workspaces");
  invariant(report.summary?.gateCells === 240, "Report must classify all 240 pilot gate cells");
  invariant(
    report.summary.passedGateCells + report.summary.failedGateCells === report.summary.gateCells,
    "Gate cell counts do not reconcile",
  );
  const ids = new Set(report.pilots.map(({animationId}) => animationId));
  invariant(ids.size === 16, "Pilot identities must be unique");
  for (const pilot of report.pilots) {
    invariant(pilot.workspaceInspection?.manifestSha256MatchesStrictReport === true, `${pilot.animationId}: manifest binding not current`);
    invariant(pilot.gateReadiness?.length === 15, `${pilot.animationId}: not all gates classified`);
    invariant(
      pilot.gateReadiness.every((gate) => typeof gate.machineClosableNow === "boolean"),
      `${pilot.animationId}: incomplete closure classification`,
    );
  }
  return report;
}

export function renderMarkdown(report) {
  validateReport(report);
  const lines = [
    "# Pilot machine-gap readiness",
    "",
    `Source strict report: \`${report.source.strictReport.path}\` (SHA-256 \`${report.source.strictReport.sha256}\`).`,
    "",
    "This is a deterministic preparation inventory, not an acceptance record. It does not alter migration status, strict status, current-JavaScript approval, protected VB004 pins, or any human/owner/audio decision.",
    "",
    "## Current result",
    "",
    `- ${report.summary.workspacesInspected}/16 workspaces inspected; all manifest hashes match the strict report.`,
    `- ${report.summary.passedGateCells}/${report.summary.gateCells} strict gate cells already pass; ${report.summary.failedGateCells} fail.`,
    `- Machine-only failing gate cells proven safely closable now: **${report.summary.machineClosableFailingGateCellsNow}**.`,
    `- Build: ${report.summary.productionBuildPassPilots}/16; implementation route: ${report.summary.implementationRoutePassPilots}/16; deterministic contract: ${report.summary.deterministicFrameContractPassPilots}/16.`,
    `- Canonical product-QA files exist for ${report.summary.canonicalProductQaPilots}/16 and canonical behavior-QA files for ${report.summary.canonicalBehaviorQaPilots}/16, but those files cannot bypass missing authoritative trace/metrics evidence.`,
    "",
    `Disposition: \`${report.decision.disposition}\`.`,
    "",
    "## Per-pilot readiness",
    "",
    "| Pilot | Pass/fail | Route | Deterministic | Product QA file | Machine-closable failures now |",
    "|---|---:|---|---|---|---|",
  ];
  for (const pilot of report.pilots) {
    const gate = (id) => pilot.gateReadiness.find((item) => item.gateId === id)?.status;
    lines.push(
      `| \`${pilot.animationId}\` | ${pilot.passedGateCount}/${pilot.failedGateCount} | ${gate("implementation-route")} | ${gate("deterministic-frame-contract")} | ${pilot.workspaceInspection.canonicalProductQaExists ? "yes" : "no"} | ${pilot.machineClosableFailingGateIds.length ? pilot.machineClosableFailingGateIds.map((item) => `\`${item}\``).join(", ") : "none"} |`,
    );
  }
  lines.push(
    "",
    "## Why the queue is fail-closed",
    "",
    "- Authoritative baseline, audio listening, human visual review, and owner acceptance require their named authorities.",
    "- The four incomplete renderer routes and six incomplete deterministic contracts contain deliberately blocked or unresolved frame domains; generating plausible states would not be faithful migration.",
    "- Full-frame, RMSE, bilingual, interaction, product-QA, and strict-validator failures are downstream of those missing prerequisites.",
    "- Regression receipts remain non-zero while the protected VB004 semantic/scenario binding awaits a fresh explicit named-human decision; this report does not refresh that pin.",
    "",
    "After the authority prerequisites are supplied, machine capture, RMSE, QA, validator, test, and build work can resume in dependency order. Current-JavaScript evidence must remain labeled non-authoritative until then.",
    "",
  );
  return lines.join("\n");
}

export function parseArguments(argv) {
  const options = {
    root: projectRoot,
    check: false,
    json: false,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    markdownOutput: DEFAULT_MARKDOWN_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--root") options.root = path.resolve(argv[++index]);
    else if (argument === "--json-output") options.jsonOutput = argv[++index];
    else if (argument === "--markdown-output") options.markdownOutput = argv[++index];
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-pilot-machine-gap-readiness.mjs [options]\n\n` +
    `  --check                  Verify checked-in JSON and Markdown are current\n` +
    `  --json                   Print the generated JSON report\n` +
    `  --root <path>            Override the project root\n` +
    `  --json-output <path>     Override the JSON output path relative to root\n` +
    `  --markdown-output <path> Override the Markdown output path relative to root\n`;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const root = path.resolve(options.root);
  const report = validateReport(await buildReport({root}));
  const jsonText = `${JSON.stringify(report, null, 2)}\n`;
  const markdownText = renderMarkdown(report);
  const jsonPath = path.resolve(root, options.jsonOutput);
  const markdownPath = path.resolve(root, options.markdownOutput);

  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([
      readFile(jsonPath, "utf8"),
      readFile(markdownPath, "utf8"),
    ]);
    invariant(existingJson === jsonText, `${posixRelative(root, jsonPath)} is stale`);
    invariant(existingMarkdown === markdownText, `${posixRelative(root, markdownPath)} is stale`);
  } else {
    await Promise.all([
      writeFile(jsonPath, jsonText),
      writeFile(markdownPath, markdownText),
    ]);
  }

  if (options.json) process.stdout.write(jsonText);
  else process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${posixRelative(root, jsonPath)} and ${posixRelative(root, markdownPath)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

