#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {materializeG5L4SourceWorkspaces} from "./materialize-g5-l4-source-workspaces.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_PATH =
  "scripts/build-g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.mjs";
const JSON_OUTPUT =
  "reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json";
const MARKDOWN_OUTPUT =
  "reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.md";

const INPUTS = Object.freeze({
  g4CurrentJavascriptPredecessor:
    "reports/g4-l3-current-javascript-progress.json",
  g4M2Predecessor: "reports/g4-l3-m2-source-audit-readiness.json",
  g4M3Predecessor: "reports/g4-l3-m3-runtime-acquisition-readiness.json",
  g4RuntimeEnvironment:
    "reports/g4-l3-original-runtime-environment-readiness.json",
  g4RuntimeContainment:
    "reports/g4-l3-original-runtime-containment-readiness.json",
  g4FirstRuntimeSession:
    "reports/g4-l3-first-original-runtime-session-readiness.json",
  g5SourceScopePredecessor: "reports/g5-l4-source-scope-freeze.json",
  g5ContinuationPredecessor:
    "reports/g5-l4-continuation-machine-readiness-successor-2026-08-01-v7-r1.json",
  prototypeRegistry: "packages/demos/prototype-registry.json",
  completionLedger: "catalog/completion-ledger.json",
  lessonReleaseLedger: "catalog/lesson-release-ledger.json",
});

const G5_EXPECTED_DESCRIPTOR_DIFF_PATHS = Object.freeze([
  "$.generatedMarker",
  "$.inputs.animationsCatalog.bytes",
  "$.inputs.animationsCatalog.sha256",
  "$.inputs.audioGroupsCatalog.bytes",
  "$.inputs.audioGroupsCatalog.sha256",
  "$.inputs.sourceFilesCatalog.bytes",
  "$.inputs.sourceFilesCatalog.sha256",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required",
  );
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `${relativePath}: path escapes project root`,
  );
  return resolved;
}

async function readBinding(relativePath, {parseJson = true} = {}) {
  const resolved = absolute(relativePath);
  const metadata = await lstat(resolved);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected ordinary non-symlink file`,
  );
  const physical = await stat(resolved);
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const bytes = await readFile(resolved);
  return {
    descriptor: {
      path: portable(relativePath),
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    value: parseJson ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

async function assertDescriptorCurrent(descriptor, label) {
  invariant(descriptor && typeof descriptor.path === "string", `${label}: path missing`);
  invariant(Number.isSafeInteger(descriptor.bytes), `${label}: byte count missing`);
  invariant(/^[a-f0-9]{64}$/.test(descriptor.sha256 ?? ""), `${label}: SHA-256 missing`);
  const observed = await readBinding(descriptor.path, {parseJson: false});
  invariant(
    observed.descriptor.bytes === descriptor.bytes &&
      observed.descriptor.sha256 === descriptor.sha256,
    `${label}: declared file binding is stale`,
  );
}

function collectDiffs(left, right, currentPath = "$", output = []) {
  if (Object.is(left, right)) return output;
  const leftObject = left !== null && typeof left === "object";
  const rightObject = right !== null && typeof right === "object";
  if (!leftObject || !rightObject) {
    output.push({path: currentPath, predecessor: left, current: right});
    return output;
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  for (const key of keys) {
    collectDiffs(left[key], right[key], `${currentPath}.${key}`, output);
  }
  return output;
}

function releaseById(ledger, releaseId) {
  const matches = (ledger.releases ?? []).filter(
    (release) => release.releaseId === releaseId,
  );
  invariant(matches.length === 1, `${releaseId}: expected exactly one release ledger row`);
  return matches[0];
}

function summarizeRelease(release, expectedMembers) {
  invariant(release.expectedMemberCount === expectedMembers, `${release.releaseId}: expected member count drifted`);
  invariant(release.members?.length === expectedMembers, `${release.releaseId}: member set drifted`);
  invariant(release.strictCompleteCount === 0, `${release.releaseId}: strict count changed`);
  invariant(release.status === "unpublished" && release.published === false, `${release.releaseId}: publication boundary opened`);
  return {
    releaseId: release.releaseId,
    expectedMembers,
    observedMembers: release.members.length,
    strictCompleteMembers: release.strictCompleteCount,
    status: release.status,
    published: release.published,
  };
}

export async function buildStrictGapCurrentnessSuccessor() {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(async ([key, relativePath]) => [
      key,
      await readBinding(relativePath),
    ]),
  );
  const bound = Object.fromEntries(entries);
  const generator = await readBinding(GENERATOR_PATH, {parseJson: false});

  const g4Predecessor = bound.g4CurrentJavascriptPredecessor.value;
  invariant(
    g4Predecessor.reportType ===
      "g4-l3-current-javascript-progress-acceptance-neutral" &&
      g4Predecessor.summary?.activePages === 39 &&
      g4Predecessor.summary?.currentJavaScriptModules === 39 &&
      g4Predecessor.summary?.strictCompletePages === 0,
    "G4 L3 current-JavaScript predecessor crossed its declared boundary",
  );
  invariant(g4Predecessor.pages?.length === 39, "G4 L3 predecessor page set drifted");

  const registryByKey = new Map(
    (bound.prototypeRegistry.value.entries ?? []).map((entry) => [entry.key, entry]),
  );
  const ledgerByAnimationId = new Map(
    (bound.completionLedger.value.diagnostics ?? []).map((entry) => [
      entry.animationId,
      entry,
    ]),
  );
  invariant(
    bound.completionLedger.value.summary?.strictComplete === 0,
    "completion ledger strict count is no longer zero",
  );

  const g4LedgerDeltas = [];
  const g4ModuleDeltas = [];
  for (const page of g4Predecessor.pages) {
    const currentRegistryEntry = registryByKey.get(page.animationId) ?? null;
    invariant(
      stableJson(currentRegistryEntry) ===
        stableJson(page.currentJavaScript?.registryEntry),
      `${page.animationId}: relevant prototype registry entry changed`,
    );
    const predecessorModule = page.currentJavaScript?.module;
    invariant(predecessorModule?.path, `${page.animationId}: predecessor module missing`);
    const currentModule = await readBinding(predecessorModule.path, {
      parseJson: false,
    });
    g4ModuleDeltas.push({
      animationId: page.animationId,
      path: predecessorModule.path,
      predecessor: {
        bytes: predecessorModule.bytes,
        sha256: predecessorModule.sha256,
      },
      current: {
        bytes: currentModule.descriptor.bytes,
        sha256: currentModule.descriptor.sha256,
      },
      changed:
        predecessorModule.bytes !== currentModule.descriptor.bytes ||
        predecessorModule.sha256 !== currentModule.descriptor.sha256,
    });
    for (const output of page.currentJavaScript?.candidateOutputs ?? []) {
      await assertDescriptorCurrent(
        output,
        `${page.animationId}: ${output.kind ?? "candidate output"}`,
      );
    }
    await assertDescriptorCurrent(page.source?.swf, `${page.animationId}: source SWF`);

    const predecessorDiagnostic = page.strict?.ledgerDiagnostic;
    const currentDiagnostic = ledgerByAnimationId.get(page.animationId);
    invariant(predecessorDiagnostic && currentDiagnostic, `${page.animationId}: ledger diagnostic missing`);
    invariant(
      currentDiagnostic.status === predecessorDiagnostic.status &&
        currentDiagnostic.status === "preserved",
      `${page.animationId}: strict ledger status changed`,
    );
    invariant(
      currentDiagnostic.manifestSha256 === predecessorDiagnostic.manifestSha256,
      `${page.animationId}: migration manifest identity changed`,
    );
    invariant(
      Number.isSafeInteger(currentDiagnostic.errorCount) &&
        currentDiagnostic.errorCount >= predecessorDiagnostic.errorCount,
      `${page.animationId}: ledger error count regressed unexpectedly`,
    );
    g4LedgerDeltas.push({
      animationId: page.animationId,
      status: currentDiagnostic.status,
      manifestSha256: currentDiagnostic.manifestSha256,
      predecessorErrorCount: predecessorDiagnostic.errorCount,
      currentErrorCount: currentDiagnostic.errorCount,
      delta: currentDiagnostic.errorCount - predecessorDiagnostic.errorCount,
    });
  }
  invariant(
    g4LedgerDeltas.every((entry) => entry.delta > 0),
    "expected every G4 L3 predecessor ledger diagnostic to expose current validator drift",
  );

  const g4M2 = bound.g4M2Predecessor.value;
  const g4M3 = bound.g4M3Predecessor.value;
  const g4Environment = bound.g4RuntimeEnvironment.value;
  const g4Containment = bound.g4RuntimeContainment.value;
  const g4FirstSession = bound.g4FirstRuntimeSession.value;
  invariant(g4M2.summary?.canonicalMembers === 40, "G4 L3 M2 scope is not 40");
  invariant(g4M3.summary?.canonicalItems === 40, "G4 L3 M3 scope is not 40");
  invariant(
    g4Environment.summary?.runtimeSessionsExecuted === 0 &&
      g4Environment.executionGate?.originalRuntimeExecutionReady === false,
    "G4 L3 runtime environment boundary changed",
  );
  invariant(
    g4Containment.summary?.runtimeSessionsExecuted === 0 &&
      g4Containment.executionGate?.originalRuntimeExecutionReady === false,
    "G4 L3 containment boundary changed",
  );
  invariant(
    g4FirstSession.summary?.runtimeSessionsExecuted === 0 &&
      g4FirstSession.executionGate?.originalRuntimeExecutionReady === false,
    "G4 L3 first-session boundary changed",
  );

  const g5Planned = await materializeG5L4SourceWorkspaces({
    root: ROOT,
    migrationsRoot: path.join(ROOT, "migrations"),
    reportsRoot: path.join(ROOT, "reports"),
    dryRun: true,
  });
  const g5Predecessor = bound.g5SourceScopePredecessor.value;
  const g5Diffs = collectDiffs(g5Predecessor, g5Planned.scope);
  invariant(
    stableJson(g5Diffs.map((entry) => entry.path).sort()) ===
      stableJson([...G5_EXPECTED_DESCRIPTOR_DIFF_PATHS].sort()),
    "G5 L4 source-scope drift exceeded the seven reviewed descriptor fields",
  );
  invariant(
    g5Planned.scope.summary?.memberCount === 55 &&
      g5Planned.scope.summary?.strictCompleteCount === 0 &&
      g5Planned.scope.summary?.publishedCount === 0,
    "G5 L4 current logical scope crossed its 55/0/0 boundary",
  );

  const g5Continuation = bound.g5ContinuationPredecessor.value;
  invariant(
    g5Continuation.reportType ===
      "g5-l4-continuation-machine-readiness-v7-successor" &&
      g5Continuation.staticSpecificationMachinePreparationExhausted === true &&
      g5Continuation.acceptanceEffects?.strictComplete === false &&
      g5Continuation.acceptanceEffects?.publicReleaseAuthorized === false,
    "G5 L4 continuation predecessor crossed its acceptance-neutral boundary",
  );

  const g4Release = summarizeRelease(
    releaseById(bound.lessonReleaseLedger.value, "lesson-g04-l03-negative-numbers"),
    40,
  );
  const g5Release = summarizeRelease(
    releaseById(bound.lessonReleaseLedger.value, "lesson-g05-l04-number-lines"),
    55,
  );
  invariant(
    bound.lessonReleaseLedger.value.summary?.strictCompleteMemberCount === 0 &&
      bound.lessonReleaseLedger.value.summary?.publishedReleaseCount === 0,
    "global lesson release ledger boundary opened",
  );

  const currentG5ScopeBytes = Buffer.from(stableJson(g5Planned.scope));
  const sourceBindings = Object.fromEntries(
    Object.entries(bound).map(([key, entry]) => [key, entry.descriptor]),
  );
  return {
    schemaVersion: 1,
    reportType: "g4-l3-g5-l4-strict-gap-currentness-successor",
    issuedOn: "2026-08-07",
    status:
      "current-by-successor-validation-original-runtime-human-owner-strict-and-publication-closed",
    generator: generator.descriptor,
    sourceBindings,
    currentProjectionBindings: {
      g5SourceScope: {
        path: "virtual:materialize-g5-l4-source-workspaces-dry-run",
        bytes: currentG5ScopeBytes.length,
        sha256: sha256(currentG5ScopeBytes),
      },
    },
    g4Lesson3: {
      release: g4Release,
      currentJavascript: {
        activePages: 39,
        boundModules: 39,
        relevantRegistryEntriesUnchanged: 39,
        currentModuleFilesPresent: g4ModuleDeltas.length,
        modulesChangedSincePredecessor: g4ModuleDeltas.filter(
          (entry) => entry.changed,
        ).length,
        moduleDeltas: g4ModuleDeltas.filter((entry) => entry.changed),
        sourceAndCandidateOutputBindingsCurrent: 39,
        predecessorReportCurrent: false,
        predecessorStaleness:
          "global prototype-registry and completion-ledger descriptors changed; relevant registry entries and migration manifest hashes remain unchanged, while current module byte drift is explicitly rebound below",
      },
      ledgerDiagnostics: {
        memberCount: g4LedgerDeltas.length,
        preservedStatusCount: g4LedgerDeltas.filter(
          (entry) => entry.status === "preserved",
        ).length,
        unchangedManifestHashCount: 39,
        membersWithHigherCurrentValidatorErrorCount: g4LedgerDeltas.filter(
          (entry) => entry.delta > 0,
        ).length,
        deltas: g4LedgerDeltas,
      },
      planningCurrentness: {
        m2PredecessorCurrent: false,
        m2Reason:
          "upstream machine-source-audit animations catalog binding is stale",
        m3PredecessorCurrent: false,
        m3Reason: "lesson runtime-acquisition contract is stale",
        runtimeEnvironmentCheckCurrent: true,
        runtimeContainmentCheckCurrent: true,
        firstRuntimeSessionCheckCurrent: true,
      },
      runtimeBoundary: {
        installedCandidateBound: true,
        runtimeSessionsExecuted: 0,
        namedOperatorsBound: 0,
        containmentControlsApproved: 0,
        originalRuntimeExecutionReady: false,
        authoritativeBaselinePackages: 0,
      },
    },
    g5Lesson4: {
      release: g5Release,
      sourceScope: {
        memberCount: g5Planned.scope.summary.memberCount,
        pairedFlaSwfCount: g5Planned.scope.summary.pairedFlaSwfCount,
        swfOnlyCount: g5Planned.scope.summary.swfOnlyCount,
        predecessorReportCurrent: false,
        logicalScopeChanged: false,
        descriptorOnlyDiffCount: g5Diffs.length,
        descriptorOnlyDiffs: g5Diffs,
      },
      machinePreparation: {
        predecessorStaticSpecificationMachinePreparationExhausted: true,
        predecessorCurrentnessInherited: false,
        currentLegacyCheckChainGreen: false,
        staleSurfaces: [
          "source-scope freeze and 55 workspace bindings",
          "Owner blockers 2-4 release-manifest descriptor binding",
          "specification-readiness report",
          "shell/RW002 runtime-preparation report",
          "empty original-runtime session-kit readiness chain",
        ],
        safeAutomaticAcceptancePromotionAvailable: false,
      },
      runtimeBoundary: {
        runtimeSessionsExecuted: 0,
        authoritativeBaselines: 0,
        missingDeclaredDependencies: ["L4KTE01.xml", "L4KTS01.xml"],
        originalRuntimeExecutionReady: false,
      },
    },
    nextAuthorizedWork: {
      immutableSuccessorDagRequired: true,
      overwritePredecessorsAuthorized: false,
      originalRuntimeRequiresExactSessionAuthorization: true,
      humanVisualReviewRequiresNamedHuman: true,
      ownerAcceptanceRequiresOwnerOrAuthorizedRepresentative: true,
      publicationRequiresStrictCompleteAllMembersAndExternalTrustAdapter: true,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      naturalTraceEstablished: false,
      fullFrameRmseAccepted: false,
      audioAccepted: false,
      interactionAccepted: false,
      replayAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicReleaseAuthorized: false,
      published: false,
    },
  };
}

function renderMarkdown(report) {
  return `# G4 L3 / G5 L4 Strict-gap Currentness Successor r1\n\n` +
    `Status: **${report.status}**.\n\n` +
    `## Current result\n\n` +
    `- G4 L3: 40 release members, 39/39 page modules remain byte-bound, strict 0/40, unpublished.\n` +
    `- G5 L4: 55 logical members remain unchanged, strict 0/55, unpublished.\n` +
    `- Global completion ledger: strict 0. Global release ledger: published 0.\n\n` +
    `## Why old checks are red\n\n` +
    `- G4 L3 current-JavaScript predecessor binds older whole-registry and whole-ledger bytes. Its 39 relevant registry entries and all 39 migration manifest hashes are unchanged; changed module bytes are explicitly rebound, and every current validator error count is higher. M2 and M3 also retain stale upstream descriptors.\n` +
    `- G5 L4 source scope differs from its predecessor in exactly seven descriptor fields: the marker and bytes/SHA-256 values for animations, source-files, and audio-groups catalogs. The 55-member logical scope is unchanged. Downstream legacy reports still bind the old descriptor DAG.\n\n` +
    `## Authority boundary\n\n` +
    `This successor is a machine currentness and gap report only. It launches no Flash or Animate runtime, records no natural trace, accepts no audio or RMSE result, supplies no human or Owner signature, grants no strict completion, and authorizes no public release. Older reports remain preserved and must be superseded through a reviewed successor DAG rather than overwritten.\n`;
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function emit(mode, report) {
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  if (mode === "json") {
    process.stdout.write(jsonBytes);
    return;
  }
  if (mode === "check") {
    const [actualJson, actualMarkdown] = await Promise.all([
      readIfPresent(JSON_OUTPUT),
      readIfPresent(MARKDOWN_OUTPUT),
    ]);
    invariant(actualJson?.equals(jsonBytes), `${JSON_OUTPUT} is stale or missing`);
    invariant(
      actualMarkdown?.equals(markdownBytes),
      `${MARKDOWN_OUTPUT} is stale or missing`,
    );
    process.stdout.write("strict-gap currentness successor: PASS\n");
    return;
  }
  invariant(mode === "write-no-clobber", `unsupported mode: ${mode}`);
  invariant(!(await readIfPresent(JSON_OUTPUT)), `${JSON_OUTPUT} already exists`);
  invariant(
    !(await readIfPresent(MARKDOWN_OUTPUT)),
    `${MARKDOWN_OUTPUT} already exists`,
  );
  let jsonWritten = false;
  try {
    await writeFile(absolute(JSON_OUTPUT), jsonBytes, {flag: "wx", mode: 0o444});
    jsonWritten = true;
    await writeFile(absolute(MARKDOWN_OUTPUT), markdownBytes, {
      flag: "wx",
      mode: 0o444,
    });
    await Promise.all([
      chmod(absolute(JSON_OUTPUT), 0o444),
      chmod(absolute(MARKDOWN_OUTPUT), 0o444),
    ]);
  } catch (error) {
    if (jsonWritten) await unlink(absolute(JSON_OUTPUT)).catch(() => {});
    throw error;
  }
  process.stdout.write(`wrote ${JSON_OUTPUT} and ${MARKDOWN_OUTPUT}\n`);
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(argv.length === 1 && allowed.has(argv[0]), "choose exactly one of --json, --check, or --write-no-clobber");
  return argv[0].slice(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildStrictGapCurrentnessSuccessor()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
