#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  open,
  readFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const migrationsRoot = path.join(projectRoot, "migrations");

export const G5_L4_SOURCE_STATIC_BINDING_IDS = Object.freeze([
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-in-009",
  "course-g05-l04-in-015",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-005",
  "course-g05-l04-ts-004",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-in-020",
  "course-g05-l04-in-012",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-in-002",
  "course-g05-l04-in-007",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-004",
  "course-g05-l04-in-018",
  "course-g05-l04-in-017",
  "course-g05-l04-in-016",
  "course-g05-l04-in-014",
  "course-g05-l04-in-013",
  "course-g05-l04-in-010",
  "course-g05-l04-in-005",
  "course-g05-l04-in-003",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-ts-008",
  "course-g05-l04-ts-007",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
  "course-g05-l04-ir-001-a662633d",
]);

const RELEASE_ID = "lesson-g05-l04-number-lines";
const SHA256 = /^[a-f0-9]{64}$/;
const COMPLETION_LEDGER = path.join(
  projectRoot,
  "catalog",
  "completion-ledger.json",
);
const LESSON_RELEASE_LEDGER = path.join(
  projectRoot,
  "catalog",
  "lesson-release-ledger.json",
);
const TRANSACTION_LOCK = path.join(
  migrationsRoot,
  ".g5-l4-source-static-workspace-bindings.lock",
);
const CANDIDATE_GENERATOR =
  "scripts/build-g5-l4-source-static-candidates.mjs";
const SAFE_ADAPTER_GENERATOR =
  "scripts/build-safe-ffdec-canvas-adapter.mjs";
const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "implementationAuthorized",
  "authoritativeOriginalRuntime",
  "naturalRuntimeReachabilityComplete",
  "frameDomainDispositionComplete",
  "bilingualVisualParityComplete",
  "audioAccepted",
  "replayParityComplete",
  "fullFrameRmseComplete",
  "behaviorComplete",
  "productQaComplete",
  "accessibilityQaComplete",
  "engineeringReviewAccepted",
  "humanVisualReviewAccepted",
  "ownerAccepted",
  "strictMigrationComplete",
  "published",
]);
const REPORT_FALSE_BOUNDARY_KEYS = Object.freeze([
  "originalRuntimeBaselineUsed",
  "canonicalFrameDomainDispositionChanged",
  "currentCanonicalFrameDomainDispositionAsserted",
  "authoritativeRuntimeFrameDomainDispositionEstablished",
  "naturalRuntimeReachabilityEstablished",
  "visualParityCompared",
  "normalizedRmseComputed",
  "spanishVisualEstablished",
  "audioAccepted",
  "humanVisualReviewPerformed",
  "ownerReviewPerformed",
  "strictCompletionClaimed",
  "publicationClaimed",
]);
const BOUND_EVIDENCE_KEYS = Object.freeze([
  "archiveDirectory",
  "assetInventory",
  "audioInventory",
  "currentJavascriptAssetManifest",
  "currentJavascriptAssetManifestSha256",
  "currentJavascriptCandidateAuthority",
  "currentJavascriptCandidateReport",
  "currentJavascriptCandidateReportSha256",
  "currentJavascriptCandidateStrictAcceptanceEffect",
  "currentJavascriptRuntimeScript",
  "currentJavascriptRuntimeScriptSha256",
  "differenceDirectory",
  "fullFrameCoverageFile",
  "keyframeCsv",
  "sourceStaticCandidateSpec",
  "sourceStaticCandidateSpecSha256",
]);
const BOUND_EVIDENCE_SHA256_KEYS = Object.freeze([
  "currentJavascriptAssetManifestSha256",
  "currentJavascriptCandidateReportSha256",
  "currentJavascriptRuntimeScriptSha256",
  "sourceStaticCandidateSpecSha256",
]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function sourceStaticFrameProfile(spec) {
  const animationId = spec.animationId;
  const frameCount = spec.timeline?.local?.frameCount;
  const blockedLocalFrameRanges =
    spec.runtimeContract?.blockedLocalFrameRanges;
  invariant(
    Number.isSafeInteger(frameCount) &&
      frameCount > 0 &&
      Array.isArray(blockedLocalFrameRanges),
    `${animationId}: source-static frame contract is incomplete`,
  );
  let previousLastFrame = 0;
  let blockedFrameCount = 0;
  for (const range of blockedLocalFrameRanges) {
    invariant(
      Number.isSafeInteger(range?.firstFrame) &&
        Number.isSafeInteger(range?.lastFrame) &&
        range.firstFrame > previousLastFrame &&
        range.firstFrame <= range.lastFrame &&
        range.lastFrame <= frameCount &&
        typeof range.reason === "string" &&
        range.reason.length > 0,
      `${animationId}: blocked local frame ranges are invalid`,
    );
    blockedFrameCount += range.lastFrame - range.firstFrame + 1;
    previousLastFrame = range.lastFrame;
  }
  const renderableFrameCount = frameCount - blockedFrameCount;
  invariant(renderableFrameCount > 0,
    `${animationId}: source-static contract blocks every local frame`);
  let lastRenderableFrame = frameCount;
  while (blockedLocalFrameRanges.some(
    ({firstFrame, lastFrame}) =>
      lastRenderableFrame >= firstFrame &&
      lastRenderableFrame <= lastFrame,
  )) {
    lastRenderableFrame -= 1;
  }
  return {
    blockedLocalFrameRanges,
    blockedFrameCount,
    renderableFrameCount,
    lastRenderableFrame,
  };
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function readOrdinaryFile(filePath, label) {
  const information = await lstat(filePath);
  invariant(information.isFile() && !information.isSymbolicLink(),
    `${label} must be an ordinary non-symlink file`);
  invariant(information.nlink === 1, `${label} must have exactly one hard link`);
  const bytes = await readFile(filePath);
  return {
    path: filePath,
    bytes,
    device: information.dev,
    inode: information.ino,
    mode: information.mode,
    mtimeMs: information.mtimeMs,
    sha256: digest(bytes),
    text: bytes.toString("utf8"),
  };
}

export async function readTransactionSnapshot(filePath, label = filePath) {
  return readOrdinaryFile(filePath, label);
}

async function readJson(filePath, label) {
  const artifact = await readOrdinaryFile(filePath, label);
  return {...artifact, value: JSON.parse(artifact.text)};
}

function projectRelativePath(filePath) {
  return portable(path.relative(projectRoot, filePath));
}

function resolveProjectRelative(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    `${label} path is missing`);
  invariant(!path.isAbsolute(relativePath),
    `${label} must be project-relative`);
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `${label} escapes the project root`,
  );
  return resolved;
}

function sameSnapshot(left, right) {
  return left.path === right.path &&
    left.device === right.device &&
    left.inode === right.inode &&
    left.mode === right.mode &&
    left.mtimeMs === right.mtimeMs &&
    left.bytes.length === right.bytes.length &&
    left.sha256 === right.sha256;
}

async function assertSnapshotCurrent(snapshot, label) {
  const current = await readOrdinaryFile(snapshot.path, label);
  invariant(sameSnapshot(current, snapshot),
    `${label} changed after preflight`);
  return current;
}

function mergeReadSet(records) {
  const byPath = new Map();
  for (const record of records) {
    const existing = byPath.get(record.path);
    if (existing) {
      invariant(
        sameSnapshot(existing.snapshot, record.snapshot),
        `${record.label} changed during preflight`,
      );
    } else {
      byPath.set(record.path, record);
    }
  }
  return [...byPath.values()];
}

async function assertReadSetCurrent(readSet) {
  for (const record of readSet) {
    await assertSnapshotCurrent(record.snapshot, record.label);
  }
}

function assertExactFalseRecord(value, animationId, label, keys) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${animationId}: ${label} is missing`,
  );
  invariant(
    canonicalJson(Object.keys(value).sort()) ===
      canonicalJson([...keys].sort()),
    `${animationId}: ${label} field set changed`,
  );
  for (const gate of keys) {
    invariant(value[gate] === false,
      `${animationId}: ${label} cannot satisfy ${gate}`);
  }
}

function assertAcceptanceNeutral(value, animationId, label) {
  assertExactFalseRecord(
    value,
    animationId,
    `${label} acceptance effects`,
    ACCEPTANCE_EFFECT_KEYS,
  );
}

function assertReportEvidenceBoundary(report) {
  const {animationId} = report;
  const boundary = report.evidenceBoundary;
  invariant(
    boundary && typeof boundary === "object" && !Array.isArray(boundary),
    `${animationId}: candidate report evidence boundary is missing`,
  );
  invariant(
    canonicalJson(Object.keys(boundary).sort()) === canonicalJson([
      "prebindingAntecedentUsed",
      "antecedentTargetFrameDomainDisposition",
      ...REPORT_FALSE_BOUNDARY_KEYS,
    ].sort()),
    `${animationId}: candidate report evidence-boundary field set changed`,
  );
  invariant(
    boundary.prebindingAntecedentUsed === true &&
      boundary.antecedentTargetFrameDomainDisposition === "unresolved",
    `${animationId}: candidate report antecedent boundary changed`,
  );
  for (const key of REPORT_FALSE_BOUNDARY_KEYS) {
    invariant(boundary[key] === false,
      `${animationId}: candidate report cannot satisfy ${key}`);
  }
}

function assertFileBinding(binding, artifact, expectedPath, {
  animationId,
  label,
  pathKey = "path",
  requireBytes = true,
}) {
  invariant(binding?.[pathKey] === expectedPath,
    `${animationId}: ${label} path mismatch`);
  invariant(binding.sha256 === artifact.sha256,
    `${animationId}: ${label} SHA-256 mismatch`);
  if (requireBytes) {
    invariant(binding.bytes === artifact.bytes.length,
      `${animationId}: ${label} byte count mismatch`);
  }
}

function assertSourceBinding(binding, spec, artifact, kind, animationId) {
  const mapping = {
    swf: ["swf", "swfBytes", "swfSha256"],
    associatedAudio: [
      "associatedAudio",
      "associatedAudioBytes",
      "associatedAudioSha256",
    ],
  };
  const [pathKey, bytesKey, shaKey] = mapping[kind];
  invariant(
    binding?.path === spec.source[pathKey] &&
      binding.bytes === spec.source[bytesKey] &&
      binding.sha256 === spec.source[shaKey] &&
      artifact.bytes.length === spec.source[bytesKey] &&
      artifact.sha256 === spec.source[shaKey],
    `${animationId}: ${kind} source lineage mismatch`,
  );
  if (kind === "associatedAudio") {
    const expectedKind =
      spec.source.associatedAudioKind ?? "external-file";
    invariant(
      ["external-file", "embedded-swf-stream-container"].includes(
        expectedKind,
      ) && binding.kind === expectedKind,
      `${animationId}: associated audio kind mismatch`,
    );
  }
}

function flaSourceProfile(spec, animationId = spec.animationId) {
  const source = spec.source;
  const pairedFlaStatus = source?.pairedFlaStatus ?? "present";
  invariant(
    pairedFlaStatus === "present" || pairedFlaStatus === "missing",
    `${animationId}: paired FLA status is invalid`,
  );
  if (pairedFlaStatus === "missing") {
    invariant(
      source.fla === null &&
        source.flaBytes === null &&
        source.flaSha256 === null,
      `${animationId}: missing FLA must use an exact null source tuple`,
    );
    return {pairedFlaStatus, present: false};
  }
  invariant(
    typeof source.fla === "string" &&
      source.fla.length > 0 &&
      Number.isSafeInteger(source.flaBytes) &&
      source.flaBytes > 0 &&
      SHA256.test(source.flaSha256 || ""),
    `${animationId}: present FLA source tuple is incomplete`,
  );
  return {pairedFlaStatus, present: true};
}

function assertFlaSourceBinding(
  binding,
  spec,
  artifact,
  animationId,
) {
  const profile = flaSourceProfile(spec, animationId);
  const expected = profile.present
    ? {
        pairedFlaStatus: "present",
        path: spec.source.fla,
        bytes: spec.source.flaBytes,
        sha256: spec.source.flaSha256,
        authoringAuditEstablished: false,
      }
    : {
        pairedFlaStatus: "missing",
        path: null,
        bytes: null,
        sha256: null,
        authoringAuditEstablished: false,
      };
  invariant(
    canonicalJson(binding) === canonicalJson(expected),
    `${animationId}: FLA source lineage mismatch`,
  );
  if (profile.present) {
    invariant(
      artifact &&
        artifact.bytes.length === spec.source.flaBytes &&
        artifact.sha256 === spec.source.flaSha256,
      `${animationId}: physical FLA source lineage mismatch`,
    );
  } else {
    invariant(
      artifact === null,
      `${animationId}: missing FLA cannot bind a physical artifact`,
    );
  }
}

function assertImmutableAntecedentBinding(spec, assetManifest, report) {
  const animationId = spec.animationId;
  const expectedRoot =
    `migrations/${animationId}/evidence/source-static-prebinding-antecedents`;
  invariant(
    spec.evidence?.prebindingScenarioInventory ===
      `${expectedRoot}/scenario-inventory.json` &&
    SHA256.test(
      spec.evidence?.prebindingScenarioInventorySha256 ?? "",
    ) &&
    spec.evidence?.prebindingFrameDomainDisposition ===
      `${expectedRoot}/frame-domain-disposition.json` &&
    SHA256.test(
      spec.evidence?.prebindingFrameDomainDispositionSha256 ?? "",
    ),
    `${animationId}: immutable prebinding evidence is not bound`,
  );
  invariant(
    spec.evidence.scenarioInventory === undefined &&
    spec.evidence.scenarioInventorySha256 === undefined &&
    spec.evidence.frameDomainDisposition === undefined &&
    spec.evidence.frameDomainDispositionSha256 === undefined &&
    spec.runtimeContract?.prebindingTargetFrameDomainDisposition ===
      "unresolved" &&
    spec.runtimeContract?.currentCanonicalFrameDomainDispositionAsserted ===
      false,
    `${animationId}: candidate specification still depends on mutable canonical evidence`,
  );
  invariant(
    assetManifest.inputs?.prebindingScenarioInventory?.path ===
      spec.evidence.prebindingScenarioInventory &&
    assetManifest.inputs.prebindingScenarioInventory.sha256 ===
      spec.evidence.prebindingScenarioInventorySha256 &&
    assetManifest.inputs.prebindingScenarioInventory.immutableAntecedent ===
      true &&
    assetManifest.inputs.prebindingScenarioInventory
      .currentCanonicalInventoryAsserted === false &&
    assetManifest.inputs?.prebindingFrameDomainDisposition?.path ===
      spec.evidence.prebindingFrameDomainDisposition &&
    assetManifest.inputs.prebindingFrameDomainDisposition.sha256 ===
      spec.evidence.prebindingFrameDomainDispositionSha256 &&
    assetManifest.inputs.prebindingFrameDomainDisposition
      .antecedentDispositionWasUnresolved === true &&
    assetManifest.inputs.prebindingFrameDomainDisposition.status ===
      "structurally-enumerated-dispositions-unresolved" &&
    assetManifest.inputs.prebindingFrameDomainDisposition
      .targetTimelineDisposition === "unresolved" &&
    assetManifest.inputs.prebindingFrameDomainDisposition
      .currentCanonicalDispositionAsserted === false &&
    assetManifest.inputs.prebindingFrameDomainDisposition
      .authoritativeRuntimeDispositionEstablished === false &&
    assetManifest.inputs.prebindingFrameDomainDisposition
      .strictAcceptanceEffect === "none",
    `${animationId}: generated asset manifest is not bound to immutable antecedents`,
  );
  assertReportEvidenceBoundary(report);
}

export function assertCandidateLineage({
  animationId,
  paths,
  specArtifact,
  reportArtifact,
  assetManifestArtifact,
  runtimeArtifact,
  sourceSwfArtifact,
  sourceFlaArtifact,
  associatedAudioArtifact,
  antecedentScenarioArtifact,
  antecedentDispositionArtifact,
  audioAuditArtifact,
  generatorArtifact,
  safeAdapterArtifact,
}) {
  const spec = specArtifact.value;
  const report = reportArtifact.value;
  const assetManifest = assetManifestArtifact.value;
  invariant(spec.animationId === animationId,
    `${animationId}: candidate specification selected-workspace identity mismatch`);
  invariant(report.animationId === animationId,
    `${animationId}: candidate report selected-workspace identity mismatch`);
  invariant(assetManifest.animationId === animationId,
    `${animationId}: asset manifest selected-workspace identity mismatch`);
  invariant(
    spec.classification ===
      "source-static-current-javascript-engineering-candidate-only" &&
      assetManifest.classification === spec.classification &&
      report.status === "current-javascript-engineering-candidate-only",
    `${animationId}: candidate classification or status changed`,
  );
  invariant(
    spec.output?.script === paths.runtime &&
      spec.output.manifest === paths.assetManifest &&
      spec.output.report === paths.report &&
      spec.output.globalRegistry === "HELP_MATH_CANVAS_ASSETS",
    `${animationId}: candidate output contract mismatch`,
  );
  assertFileBinding(report.specification, specArtifact, paths.spec, {
    animationId,
    label: "report specification",
  });
  assertFileBinding(assetManifest.inputs?.spec, specArtifact, paths.spec, {
    animationId,
    label: "asset-manifest specification",
  });
  assertFileBinding(
    assetManifest.inputs?.generator,
    generatorArtifact,
    CANDIDATE_GENERATOR,
    {animationId, label: "candidate generator"},
  );
  assertFileBinding(
    assetManifest.inputs?.safeAdapterGenerator,
    safeAdapterArtifact,
    SAFE_ADAPTER_GENERATOR,
    {animationId, label: "safe-adapter generator"},
  );
  invariant(assetManifest.generator === CANDIDATE_GENERATOR,
    `${animationId}: asset-manifest generator identity mismatch`);

  assertSourceBinding(
    report.source?.swf,
    spec,
    sourceSwfArtifact,
    "swf",
    animationId,
  );
  assertSourceBinding(
    assetManifest.inputs?.sourceSwf,
    spec,
    sourceSwfArtifact,
    "swf",
    animationId,
  );
  assertFlaSourceBinding(
    report.source?.fla,
    spec,
    sourceFlaArtifact,
    animationId,
  );
  assertFlaSourceBinding(
    assetManifest.inputs?.sourceFla,
    spec,
    sourceFlaArtifact,
    animationId,
  );
  assertSourceBinding(
    report.source?.associatedAudio,
    spec,
    associatedAudioArtifact,
    "associatedAudio",
    animationId,
  );
  assertSourceBinding(
    assetManifest.inputs?.associatedAudio,
    spec,
    associatedAudioArtifact,
    "associatedAudio",
    animationId,
  );
  const associatedAudioKind =
    spec.source.associatedAudioKind ?? "external-file";
  if (associatedAudioKind === "embedded-swf-stream-container") {
    invariant(
      spec.source.associatedAudio === spec.source.swf &&
        spec.source.associatedAudioBytes === spec.source.swfBytes &&
        spec.source.associatedAudioSha256 === spec.source.swfSha256 &&
        associatedAudioArtifact.path === sourceSwfArtifact.path &&
        associatedAudioArtifact.sha256 === sourceSwfArtifact.sha256 &&
        associatedAudioArtifact.bytes.length === sourceSwfArtifact.bytes.length,
      `${animationId}: embedded audio container must be the exact source SWF`,
    );
  }
  invariant(
    report.source.associatedAudio.listened === false &&
      report.source.associatedAudio.rendered === false &&
      assetManifest.inputs.associatedAudio.listened === false &&
      assetManifest.inputs.associatedAudio.rendered === false,
    `${animationId}: source authority boundary changed`,
  );

  assertFileBinding(
    assetManifest.inputs?.prebindingScenarioInventory,
    antecedentScenarioArtifact,
    spec.evidence.prebindingScenarioInventory,
    {
      animationId,
      label: "prebinding scenario antecedent",
      requireBytes: false,
    },
  );
  assertFileBinding(
    assetManifest.inputs?.prebindingFrameDomainDisposition,
    antecedentDispositionArtifact,
    spec.evidence.prebindingFrameDomainDisposition,
    {
      animationId,
      label: "prebinding disposition antecedent",
      requireBytes: false,
    },
  );
  assertFileBinding(
    assetManifest.inputs?.audioAudit,
    audioAuditArtifact,
    spec.evidence.audioAudit,
    {
      animationId,
      label: "audio audit",
      requireBytes: false,
    },
  );
  invariant(
    spec.evidence.prebindingScenarioInventorySha256 ===
      antecedentScenarioArtifact.sha256 &&
      spec.evidence.prebindingFrameDomainDispositionSha256 ===
        antecedentDispositionArtifact.sha256 &&
      spec.evidence.audioAuditSha256 === audioAuditArtifact.sha256,
    `${animationId}: specification evidence lineage mismatch`,
  );

  assertFileBinding(
    assetManifest.output,
    runtimeArtifact,
    paths.runtime,
    {
      animationId,
      label: "asset-manifest runtime output",
      pathKey: "script",
    },
  );
  assertFileBinding(
    report.renderer?.runtimeScript,
    runtimeArtifact,
    paths.runtime,
    {
      animationId,
      label: "report runtime output",
      pathKey: "script",
    },
  );
  assertFileBinding(
    report.renderer?.runtimeManifest,
    assetManifestArtifact,
    paths.assetManifest,
    {
      animationId,
      label: "report runtime manifest",
      requireBytes: false,
    },
  );
  invariant(
    canonicalJson(report.renderer.runtimeScript) ===
      canonicalJson(assetManifest.output) &&
      assetManifest.output.globalRegistry === spec.output.globalRegistry,
    `${animationId}: report and asset-manifest runtime bindings disagree`,
  );

  const timeline = assetManifest.timeline;
  const frameProfile = sourceStaticFrameProfile(spec);
  const expectedSafePrefixBoundary = spec.runtimeContract.safePrefixBoundary
    ? {
        ...spec.runtimeContract.safePrefixBoundary,
        scenarioAntecedent: {
          path: spec.evidence.prebindingScenarioInventory,
          sha256: spec.evidence.prebindingScenarioInventorySha256,
          immutable: true,
        },
        scriptInventory: {
          path: spec.evidence.boundaryScriptInventory,
          sha256: spec.evidence.boundaryScriptInventorySha256,
        },
        swfmillStructure: {
          path: spec.evidence.swfmillStructure,
          sha256: spec.evidence.swfmillStructureSha256,
        },
      }
    : undefined;
  invariant(
    assetManifest.inputs?.freshFfdecExport?.helperBytes ===
      spec.ffdecExport.helperBytes &&
      assetManifest.inputs.freshFfdecExport.helperSha256 ===
        spec.ffdecExport.helperSha256 &&
      assetManifest.inputs.freshFfdecExport.framesHtmlBytes ===
        spec.ffdecExport.framesHtmlBytes &&
      assetManifest.inputs.freshFfdecExport.framesHtmlSha256 ===
        spec.ffdecExport.framesHtmlSha256 &&
      (spec.ffdecExport.expectedFontFunctionCount === undefined ||
        (
          assetManifest.inputs.freshFfdecExport
            .expectedFontFunctionCount ===
              spec.ffdecExport.expectedFontFunctionCount &&
          assetManifest.inputs.freshFfdecExport
            .expectedFontFunctionsSha256 ===
              spec.ffdecExport.expectedFontFunctionsSha256
        )) &&
      timeline?.generatorInput?.ffdec === spec.ffdecExport.tool &&
      timeline.generatorInput.helperSha256 ===
        spec.ffdecExport.helperSha256 &&
      timeline.generatorInput.framesHtmlSha256 ===
        spec.ffdecExport.framesHtmlSha256 &&
      timeline.generatorInput.targetSpriteObjectId ===
        spec.ffdecExport.targetSpriteObjectId,
    `${animationId}: FFDec export lineage mismatch`,
  );
  invariant(
    timeline?.animationId === animationId &&
      timeline.sourceSwfSha256 === spec.source.swfSha256 &&
      timeline.fps === spec.timeline.fps &&
      canonicalJson(timeline.stage) === canonicalJson(spec.timeline.stage) &&
      canonicalJson(timeline.sourceRootTimeline) ===
        canonicalJson(spec.timeline.root) &&
      timeline.deterministicContentTimeline?.timelineId ===
        spec.timeline.local.timelineId &&
      timeline.deterministicContentTimeline.frameCount ===
        spec.timeline.local.frameCount &&
      timeline.deterministicContentTimeline.playbackMode ===
        spec.timeline.local.playbackMode &&
      canonicalJson(timeline.scenarios) ===
        canonicalJson(spec.runtimeContract.scenarios) &&
      canonicalJson(timeline.supportedLanguages) ===
        canonicalJson(spec.runtimeContract.supportedLanguages),
    `${animationId}: candidate timeline lineage mismatch`,
  );
  invariant(
    canonicalJson(assetManifest.sourceStaticFrameContract) === canonicalJson({
      sourceTimelineFirstFrame: 1,
      sourceTimelineLastFrame: spec.timeline.local.frameCount,
      renderableFrames: frameProfile.renderableFrameCount,
      blockedLocalFrameRanges: frameProfile.blockedLocalFrameRanges,
      ...(expectedSafePrefixBoundary
        ? {safePrefixBoundary: expectedSafePrefixBoundary}
        : {}),
    }) &&
      report.renderer.lastRenderableFrame ===
        frameProfile.lastRenderableFrame &&
      report.renderer.renderableFrameCount ===
        frameProfile.renderableFrameCount &&
      canonicalJson(report.renderer.blockedLocalFrameRanges) ===
        canonicalJson(frameProfile.blockedLocalFrameRanges) &&
      canonicalJson(report.renderer.safePrefixBoundary) ===
        canonicalJson(expectedSafePrefixBoundary) &&
      canonicalJson(assetManifest.inputs?.safePrefixBoundaryEvidence) ===
        canonicalJson(expectedSafePrefixBoundary),
    `${animationId}: source-static blocked-frame lineage mismatch`,
  );
  invariant(
    report.renderer.frameDomain === spec.timeline.local.timelineId &&
      report.renderer.firstFrame === 1 &&
      report.renderer.lastFrame === spec.timeline.local.frameCount &&
      report.renderer.rootFrameCount === spec.timeline.root.frameCount &&
      report.renderer.rootEnabled === false &&
      canonicalJson(report.renderer.supportedLanguages) ===
        canonicalJson(["en"]) &&
      report.renderer.audioEnabled === false &&
      report.renderer.sourceControlsEnabled === false &&
      report.browserQa?.renderedFrameCount ===
        frameProfile.renderableFrameCount &&
      report.browserQa?.blockedFrameCount === frameProfile.blockedFrameCount &&
      report.browserQa?.blockedRequestRejectionCount ===
        frameProfile.blockedFrameCount * 2 &&
      assetManifest.browserQa?.renderedFrameCount ===
        frameProfile.renderableFrameCount &&
      assetManifest.browserQa?.blockedFrameCount ===
        frameProfile.blockedFrameCount &&
      assetManifest.browserQa?.blockedRequestRejectionCount ===
        frameProfile.blockedFrameCount * 2 &&
      canonicalJson(report.browserQa) ===
        canonicalJson(assetManifest.browserQa),
    `${animationId}: report renderer or browser-QA lineage mismatch`,
  );
  assertAcceptanceNeutral(report.acceptanceEffects, animationId, "report");
  assertAcceptanceNeutral(
    assetManifest.acceptanceEffects,
    animationId,
    "asset manifest",
  );
  assertImmutableAntecedentBinding(spec, assetManifest, report);
}

function initialManifestImplementation(spec, captureContract) {
  return {
    rendering: "undecided",
    route: "",
    routeFile: "",
    component: "",
    registryModule: "",
    timelineModule: "",
    testFile: "",
    standalonePackage: "",
    defaultFrameDomainId: "root",
    frameDomains: [
      {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: spec.timeline.root.frameCount,
        scenarioIds: ["default"],
      },
    ],
    captureContract,
  };
}

export function assertInitialManifestPreimage(manifest, spec) {
  const animationId = spec.animationId;
  invariant(
    canonicalJson(manifest.scenarios) === canonicalJson([
      {
        id: "default",
        kind: "linear",
        description: "",
        reachable: true,
      },
    ]) &&
    canonicalJson(manifest.implementation) === canonicalJson(
      initialManifestImplementation(
        spec,
        manifest.implementation?.captureContract,
      ),
    ),
    `${animationId}: refusing to replace a non-initial implementation overlay`,
  );
  invariant(
    canonicalJson(manifest.evidence) === canonicalJson({
      assetInventory: "asset-inventory.csv",
      audioInventory: "audio-inventory.csv",
      keyframeCsv: "keyframes.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      differenceDirectory: "evidence/diffs",
      archiveDirectory: "",
    }),
    `${animationId}: refusing to replace non-initial evidence bindings`,
  );
  invariant(
    canonicalJson(manifest.acceptance) === canonicalJson({
      engineeringReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
      },
      humanVisualReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        scope: "all-keyframe-and-full-frame-diffs",
        record: null,
      },
      ownerReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        reason: "",
        record: null,
      },
      knownExceptions: [],
    }),
    `${animationId}: refusing to replace a manifest with review overlays`,
  );
}

export function assertBoundManifestPreimage(manifest, expected) {
  const animationId = expected.animationId;
  invariant(
    manifest?.animationId === animationId &&
      canonicalJson(manifest.scenarios) === canonicalJson(expected.scenarios) &&
      canonicalJson(manifest.implementation) ===
        canonicalJson(expected.implementation),
    `${animationId}: refusing to refresh a structurally drifted candidate binding`,
  );
  invariant(
    canonicalJson(manifest.implementation.captureContract) === canonicalJson({
      frameParameter: "frame",
      frameDomainParameter: "frameDomain",
      requirementIdParameter: "requirementId",
      traceParameter: "trace",
      entryStateSha256Parameter: "entryStateSha256",
      scenarioParameter: "scenario",
      languageParameter: "lang",
      seedParameter: "seed",
      frameAttribute: "data-flash-frame",
      animationIdAttribute: "data-animation-id",
      frameDomainAttribute: "data-flash-frame-domain",
      requirementIdAttribute: "data-flash-requirement-id",
      traceAttribute: "data-flash-trace-id",
      entryStateSha256Attribute: "data-flash-entry-state-sha256",
    }),
    `${animationId}: refusing to refresh a candidate with capture-contract drift`,
  );
  invariant(
    canonicalJson(Object.keys(manifest.evidence).sort()) ===
      canonicalJson([...BOUND_EVIDENCE_KEYS].sort()),
    `${animationId}: refusing to refresh non-candidate evidence overlays`,
  );
  for (const key of BOUND_EVIDENCE_SHA256_KEYS) {
    invariant(
      SHA256.test(manifest.evidence[key] || ""),
      `${animationId}: prior ${key} is not a SHA-256`,
    );
  }
  const priorEvidence = structuredClone(manifest.evidence);
  const nextEvidence = structuredClone(expected.evidence);
  for (const key of BOUND_EVIDENCE_SHA256_KEYS) {
    priorEvidence[key] = "<sha256>";
    nextEvidence[key] = "<sha256>";
  }
  invariant(
    canonicalJson(priorEvidence) === canonicalJson(nextEvidence),
    `${animationId}: refusing to refresh drifted candidate evidence bindings`,
  );
  invariant(
    canonicalJson(manifest.acceptance) === canonicalJson({
      engineeringReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
      },
      humanVisualReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        scope: "all-keyframe-and-full-frame-diffs",
        record: null,
      },
      ownerReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        reason: "",
        record: null,
      },
      knownExceptions: [],
    }),
    `${animationId}: refusing to refresh a candidate with review overlays`,
  );
  invariant(
    manifest.baseline?.authority === "undecided" &&
      manifest.baseline.renderer === "unresolved" &&
      manifest.baseline.route === "" &&
      manifest.baseline.routeFile === "" &&
      manifest.localization?.bilingualRequired === true &&
      canonicalJson(manifest.localization.languages) ===
        canonicalJson(["en", "es"]) &&
      manifest.audio?.required === true,
    `${animationId}: refusing to refresh a candidate across a fidelity-evidence boundary`,
  );
}

export function initialCoverage(animationId, rootFrameCount) {
  return {
    schemaVersion: 2,
    animationId,
    requirements: ["en", "es"].map((language) => {
      const entryState = {kind: "initial-load", language};
      return {
        requirementId: `req-default-root-${language}`,
        scenario: "default",
        frameDomainId: "root",
        traceId: `default-root-${language}`,
        language,
        seed: "0",
        requiredRange: {firstFrame: 1, lastFrame: rootFrameCount},
        entryState,
        entryStateSha256: digest(Buffer.from(canonicalJson(entryState))),
        baselineAuthorityRequirement: "original-runtime-frame-accurate",
        baselineAuthority: "unresolved",
        status: "pending",
        capturedFrameCount: 0,
        missingFrames:
          Array.from({length: rootFrameCount}, (_, index) => index + 1),
        baselineCaptureManifest: "",
        baselineCaptureManifestSha256: "",
        captureManifest: "",
        captureManifestSha256: "",
        metricsFile: "",
        metricsSha256: "",
      };
    }),
  };
}

export function assertInitialCoveragePreimage(coverage, spec) {
  invariant(
    canonicalJson(coverage) === canonicalJson(
      initialCoverage(spec.animationId, spec.timeline.root.frameCount),
    ),
    `${spec.animationId}: refusing to replace capture or review coverage overlays`,
  );
}

function buildImplementationBinding(manifest, spec, report, {
  releaseSequence,
  unresolvedTimelineCandidateIds,
}) {
  const animationId = manifest.animationId;
  const local = spec.timeline.local;
  const root = spec.timeline.root;
  invariant(local.timelineId === report.renderer.frameDomain,
    `${animationId}: report frame domain does not match the specification`);
  invariant(local.frameCount === report.renderer.lastFrame,
    `${animationId}: report frame count does not match the specification`);
  invariant(report.renderer.firstFrame === 1,
    `${animationId}: source-static candidate must remain one-indexed`);
  const frameProfile = sourceStaticFrameProfile(spec);
  invariant(
    report.renderer.renderableFrameCount ===
      frameProfile.renderableFrameCount &&
      report.renderer.lastRenderableFrame ===
        frameProfile.lastRenderableFrame &&
      canonicalJson(report.renderer.blockedLocalFrameRanges) ===
        canonicalJson(frameProfile.blockedLocalFrameRanges),
    `${animationId}: report blocked-frame contract does not match the specification`,
  );

  return {
    rendering:
      "source-static Canvas engineering candidate; root host entry, Spanish visuals, audio, source controls, Replay, natural runtime reachability, original-runtime parity, and strict fidelity fail closed",
    route: `/animations/${animationId}`,
    routeFile: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
    component: `packages/demos/src/modules/${animationId}.tsx`,
    registryModule: `./modules/${animationId}`,
    timelineModule: `packages/demos/src/timelines/${animationId}.ts`,
    testFile: "packages/demos/tests/course-g05-l04-source-static.test.ts",
    standalonePackage: "",
    defaultFrameDomainId: local.timelineId,
    frameDomains: [
      {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "root",
        parentFrameDomainId: null,
        frameCount: root.frameCount,
        scenarioIds: ["root-unavailable"],
        role: "root-host-entry-unavailable",
      },
      {
        id: local.timelineId,
        kind: "nested",
        sourceTimelineId: local.timelineId,
        sourceInstanceId: root.placementName,
        parentFrameDomainId: "root",
        parentEntryFrame: root.beginFrame,
        localEntryFrame: 1,
        frameCount: local.frameCount,
        scenarioIds: ["source-static-frame"],
        role: "main-teaching-animation-source-static-candidate",
      },
    ],
    captureContract: manifest.implementation.captureContract,
    capturePlanning: {
      state: "pending-authoritative-natural-trace",
      releaseId: RELEASE_ID,
      releaseSequence,
      rootRequirementRangeIsValid: true,
      rootNaturalTraceExecuted: false,
      authoritativeScenarioInventoryEstablished: false,
      nestedFrameDomainDispositionEstablished: true,
      nestedFrameDomainDeclaredInCurrentManifest: true,
      conservativeNestedDomainRequirementsEstablished: true,
      conservativeNestedFrameDomainIds: [local.timelineId],
      staticCompositeTimelineIds: [],
      sourceStaticCompositeCandidateTimelineIds: [],
      unresolvedTimelineCandidateIds,
      authoritativeRuntimeFrameDomainDispositionEstablished: false,
      structuralFrameDomainPlanningClosed: false,
      runtimeReachabilityEstablished: false,
      strictAcceptanceEffect: "none",
    },
    candidateState: {
      status: "current-javascript-engineering-candidate-only",
      report: "evidence/source-static-current-js-candidate.json",
      assetManifest:
        `public/flash-assets/courses/${animationId}/manifest.json`,
      runtimeScript:
        `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      sourceStaticFrameDomain: local.timelineId,
      sourceStaticFrames: {
        firstFrame: 1,
        lastFrame: local.frameCount,
      },
      ...(frameProfile.blockedFrameCount > 0
        ? {
            sourceStaticRenderableFrames: {
              firstFrame: 1,
              lastFrame: frameProfile.lastRenderableFrame,
              frameCount: frameProfile.renderableFrameCount,
            },
            blockedLocalFrameRanges: frameProfile.blockedLocalFrameRanges,
          }
        : {}),
      renderedFrameCount: report.browserQa.renderedFrameCount,
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      sourceControlsEnabled: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictAcceptanceEffect: "none",
    },
  };
}

function buildEvidenceBinding(manifest, specArtifact, reportArtifact,
  assetManifestArtifact, runtimeArtifact) {
  const animationId = manifest.animationId;
  return {
    ...manifest.evidence,
    sourceStaticCandidateSpec:
      "audit/source-static-current-js-candidate-spec.json",
    sourceStaticCandidateSpecSha256: specArtifact.sha256,
    currentJavascriptCandidateReport:
      "evidence/source-static-current-js-candidate.json",
    currentJavascriptCandidateReportSha256: reportArtifact.sha256,
    currentJavascriptAssetManifest:
      `public/flash-assets/courses/${animationId}/manifest.json`,
    currentJavascriptAssetManifestSha256: assetManifestArtifact.sha256,
    currentJavascriptRuntimeScript:
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
    currentJavascriptRuntimeScriptSha256: runtimeArtifact.sha256,
    currentJavascriptCandidateAuthority:
      "non-authoritative-current-javascript-source-static-output",
    currentJavascriptCandidateStrictAcceptanceEffect: "none",
  };
}

export function buildBoundManifest({
  selectedAnimationId,
  manifest,
  spec,
  specArtifact,
  report,
  reportArtifact,
  assetManifest,
  assetManifestArtifact,
  runtimeArtifact,
  releaseSequence,
  unresolvedTimelineCandidateIds,
}) {
  const animationId = manifest.animationId;
  const selectedId = selectedAnimationId ?? animationId;
  invariant(animationId === selectedId,
    `${selectedId}: migration manifest selected-workspace identity mismatch`);
  invariant(G5_L4_SOURCE_STATIC_BINDING_IDS.includes(animationId),
    `${animationId}: animation ID is outside the bounded G5 L4 set`);
  invariant(spec.animationId === animationId,
    `${animationId}: specification identity mismatch`);
  invariant(report.animationId === animationId,
    `${animationId}: report identity mismatch`);
  invariant(assetManifest.animationId === animationId,
    `${animationId}: asset manifest identity mismatch`);
  invariant(manifest.status === "preserved",
    `${animationId}: migration status must remain preserved`);
  invariant(spec.strictAcceptanceEffect === "none",
    `${animationId}: specification must remain acceptance-neutral`);
  invariant(report.strictAcceptanceEffect === "none",
    `${animationId}: report must remain acceptance-neutral`);
  invariant(assetManifest.strictAcceptanceEffect === "none",
    `${animationId}: asset manifest must remain acceptance-neutral`);
  assertAcceptanceNeutral(report.acceptanceEffects, animationId, "report");
  assertAcceptanceNeutral(assetManifest.acceptanceEffects, animationId,
    "asset manifest");
  assertReportEvidenceBoundary(report);
  invariant(report.renderer.runtimeScript.sha256 === runtimeArtifact.sha256,
    `${animationId}: runtime script hash does not match the candidate report`);
  invariant(report.renderer.runtimeManifest.sha256 ===
    assetManifestArtifact.sha256,
  `${animationId}: asset manifest hash does not match the candidate report`);
  invariant(SHA256.test(specArtifact.sha256) &&
    SHA256.test(reportArtifact.sha256) &&
    SHA256.test(assetManifestArtifact.sha256) &&
    SHA256.test(runtimeArtifact.sha256),
  `${animationId}: one or more candidate bindings lack a SHA-256`);

  return {
    ...manifest,
    status: "preserved",
    scenarios: [
      {
        id: "root-unavailable",
        kind: "linear",
        description:
          "Current-JavaScript diagnostic identity for the source root obligation. The root remains disabled until an authorized natural original-runtime trace establishes its behavior.",
        reachable: true,
      },
      {
        id: "source-static-frame",
        kind: "linear",
        description:
          `Current-JavaScript diagnostic identity for the source-static ${spec.timeline.local.timelineId} drawing candidate. Natural runtime reachability, Spanish visuals, audio, Replay, behavior, and fidelity remain unresolved.`,
        reachable: true,
      },
    ],
    implementation: buildImplementationBinding(manifest, spec, report, {
      releaseSequence,
      unresolvedTimelineCandidateIds,
    }),
    evidence: buildEvidenceBinding(
      manifest,
      specArtifact,
      reportArtifact,
      assetManifestArtifact,
      runtimeArtifact,
    ),
  };
}

function pendingRequirement({
  animationId,
  domain,
  language,
  releaseSequence,
  rootFrameCount,
}) {
  const root = domain.id === "root";
  const scenario = root ? "root-unavailable" : "source-static-frame";
  const entryState = root
    ? {
      authoritativeTraceExecuted: false,
      frameDomainId: "root",
      kind: "lesson-shell-natural-entry",
      language,
      releaseId: RELEASE_ID,
      rootEntryFrame: 1,
      scenario,
      seed: "0",
      sourceScenarioCandidateId: "root-natural-entry-and-playback",
      targetAnimationId: animationId,
      targetSequence: releaseSequence,
    }
    : {
      authoritativeTraceExecuted: false,
      frameDomainId: domain.id,
      kind: "lesson-shell-natural-entry-to-nested-domain",
      language,
      localEntryFrameCandidate: domain.localEntryFrame,
      parentEntryFrameCandidate: domain.parentEntryFrame,
      parentFrameDomainId: domain.parentFrameDomainId,
      releaseId: RELEASE_ID,
      rootEntryFrame: domain.parentEntryFrame,
      runtimeReachabilityEstablished: false,
      scenario,
      seed: "0",
      sourceInstanceId: domain.sourceInstanceId,
      sourceScenarioCandidateId: "root-natural-entry-and-playback",
      sourceTimelineId: domain.sourceTimelineId,
      targetAnimationId: animationId,
      targetSequence: releaseSequence,
    };
  const frameCount = root ? rootFrameCount : domain.frameCount;
  return {
    requirementId:
      `req:${domain.id}:lesson-shell-natural-entry:${language}`,
    scenario,
    frameDomainId: domain.id,
    traceId:
      `trace:${domain.id}:lesson-shell-natural-entry:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState,
    entryStateSha256: digest(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    planningAuthority: root
      ? "source-bound-candidate-only-not-executed-original-runtime-evidence"
      : "conservative-source-bound-domain-candidate-not-executed-original-runtime-evidence",
  };
}

export function buildBoundCoverage({
  manifest,
  releaseSequence,
  unresolvedTimelineCandidateIds,
}) {
  const root = manifest.implementation.frameDomains.find(
    (domain) => domain.id === "root",
  );
  const nested = manifest.implementation.frameDomains.find(
    (domain) => domain.id !== "root",
  );
  invariant(root && nested,
    `${manifest.animationId}: bound root and nested domains are required`);
  const blockedLocalFrameRanges =
    manifest.implementation.candidateState?.blockedLocalFrameRanges ?? [];
  const partialCandidateLimitation = blockedLocalFrameRanges.length > 0
    ? [
        `The current-JavaScript candidate renders only frames 1..${manifest.implementation.candidateState.sourceStaticRenderableFrames.lastFrame}; source frames ${blockedLocalFrameRanges.map(({firstFrame, lastFrame}) => `${firstFrame}..${lastFrame}`).join(", ")} fail closed because their causal behavior remains unresolved.`,
      ]
    : [];
  const requirements = [
    ...["en", "es"].map((language) => pendingRequirement({
      animationId: manifest.animationId,
      domain: root,
      language,
      releaseSequence,
      rootFrameCount: root.frameCount,
    })),
    ...["en", "es"].map((language) => pendingRequirement({
      animationId: manifest.animationId,
      domain: nested,
      language,
      releaseSequence,
      rootFrameCount: root.frameCount,
    })),
  ];
  return {
    schemaVersion: 2,
    animationId: manifest.animationId,
    planningState:
      "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime",
    requirements,
    limitations: [
      "All four requirements are pending natural-trace obligations, not proof that the trace, scenario inventory, baseline, audio, review, or acceptance exists.",
      `The ${nested.id} EN/ES requirements conservatively preserve the ${nested.frameCount}-frame source-static drawing obligation identified by hash-bound SWF structure and current-JavaScript candidate evidence; runtime reachability and entry state remain unresolved until an authorized natural trace executes.`,
      ...partialCandidateLimitation,
      `The ${unresolvedTimelineCandidateIds.length} additional structurally reachable timeline(s) remain unresolved, not composite or independent dispositions; stronger source proof or authoritative execution is still required.`,
      "The root-unavailable and source-static-frame scenario IDs bind the current-JavaScript diagnostic interface only. They do not establish original-runtime scenario names or reachability.",
      "No requirement in this planning document changes migration status, strict acceptance, human review, Owner acceptance, or publication.",
    ],
  };
}

export function parseArguments(argv) {
  const options = {
    mode: "dry-run",
    ids: [...G5_L4_SOURCE_STATIC_BINDING_IDS],
  };
  let explicitIds = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      invariant(options.mode === "dry-run",
        "--apply cannot be combined with another mode");
      options.mode = "apply";
    } else if (argument === "--check") {
      invariant(options.mode === "dry-run",
        "--check cannot be combined with another mode");
      options.mode = "check";
    } else if (argument === "--id") {
      const value = argv[++index];
      invariant(value, "--id requires a value");
      invariant(G5_L4_SOURCE_STATIC_BINDING_IDS.includes(value),
        `unsupported animation ID: ${value}`);
      if (!explicitIds) {
        options.ids = [];
        explicitIds = true;
      }
      invariant(!options.ids.includes(value), `duplicate --id: ${value}`);
      options.ids.push(value);
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function exactReleaseMember(releaseCatalog, {
  animationId,
  manifest,
  sourceSwfArtifact,
  spec,
}) {
  const releases = releaseCatalog.releases?.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(releases?.length === 1,
    "G5 L4 release catalog must contain exactly one lesson record");
  const [release] = releases;
  invariant(
    release?.publicationMode === "atomic" &&
      release.releaseType === "complete-lesson" &&
      release.expectedCounts?.members === 55 &&
      release.members?.length === 55,
    "G5 L4 release catalog must contain the exact 55-member lesson");
  invariant(release.members.every(
    ({ordinal}, index) => ordinal === index + 1,
  ), "G5 L4 release ordinals must be contiguous");
  invariant(
    new Set(release.members.map(({animationId: id}) => id)).size === 55,
    "G5 L4 release members must have unique animation IDs",
  );
  const members = release.members.filter(
    (candidate) => candidate.animationId === animationId,
  );
  invariant(members.length === 1,
    `${animationId}: exact G5 L4 release member is not unique`);
  const [member] = members;
  const expectedPlacedSource =
    `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`;
  const flaProfile = flaSourceProfile(spec, animationId);
  invariant(
    member.assetId === `swf-${member.source.sha256}` &&
    member.source.sha256 === spec.source.swfSha256 &&
    member.source.sha256 === manifest.source.swfSha256 &&
    member.assetId === manifest.assetId &&
    spec.source.swf === expectedPlacedSource &&
    manifest.source.swf === expectedPlacedSource &&
    manifest.source.placementPath === expectedPlacedSource &&
    sourceSwfArtifact.sha256 === member.source.sha256 &&
    sourceSwfArtifact.bytes.length === spec.source.swfBytes,
    `${animationId}: release, manifest, specification, and physical SWF binding disagree`,
  );
  invariant(
    flaProfile.present
      ? manifest.source.pairedFlaStatus === "present" &&
          manifest.source.fla === spec.source.fla &&
          manifest.source.flaSha256 === spec.source.flaSha256
      : manifest.source.pairedFlaStatus === "missing" &&
          manifest.source.fla === "" &&
          manifest.source.flaSha256 === "",
    `${animationId}: migration manifest FLA availability drifted`,
  );
  return member;
}

async function prepare(animationId, releaseCatalog) {
  const workspace = path.join(migrationsRoot, animationId);
  const paths = {
    manifest: path.join(workspace, "migration.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    frameDomainDisposition: path.join(
      workspace,
      "audit",
      "frame-domain-disposition.json",
    ),
    spec: path.join(workspace, "audit",
      "source-static-current-js-candidate-spec.json"),
    report: path.join(workspace, "evidence",
      "source-static-current-js-candidate.json"),
    assetManifest: path.join(projectRoot, "public", "flash-assets", "courses",
      animationId, "manifest.json"),
    runtime: path.join(projectRoot, "public", "flash-assets", "courses",
      animationId, "canvas-renderer.js"),
  };
  const relativePaths = Object.fromEntries(
    Object.entries(paths).map(([key, filePath]) => [
      key,
      projectRelativePath(filePath),
    ]),
  );
  const [manifestArtifact, coverageArtifact, dispositionArtifact, specArtifact,
    reportArtifact, assetManifestArtifact, runtimeArtifact] = await Promise.all([
    readJson(paths.manifest, `${animationId}: migration manifest`),
    readJson(paths.coverage, `${animationId}: full-frame coverage`),
    readJson(
      paths.frameDomainDisposition,
      `${animationId}: frame-domain disposition`,
    ),
    readJson(paths.spec, `${animationId}: candidate specification`),
    readJson(paths.report, `${animationId}: candidate report`),
    readJson(paths.assetManifest, `${animationId}: asset manifest`),
    readOrdinaryFile(paths.runtime, `${animationId}: runtime script`),
  ]);
  invariant(
    manifestArtifact.value.animationId === animationId &&
      coverageArtifact.value.schemaVersion === 2 &&
      coverageArtifact.value.animationId === animationId &&
      dispositionArtifact.value.animationId === animationId &&
      specArtifact.value.animationId === animationId &&
      reportArtifact.value.animationId === animationId &&
      assetManifestArtifact.value.animationId === animationId,
    `${animationId}: selected-workspace artifact identity drifted`,
  );
  assertImmutableAntecedentBinding(
    specArtifact.value,
    assetManifestArtifact.value,
    reportArtifact.value,
  );
  invariant(
    specArtifact.value.evidence.audioAudit ===
      `migrations/${animationId}/audit/audio-runtime-evidence.json`,
    `${animationId}: audio-audit path drifted`,
  );
  const flaProfile = flaSourceProfile(specArtifact.value, animationId);
  const dynamicPaths = {
    sourceSwf: resolveProjectRelative(
      specArtifact.value.source.swf,
      `${animationId}: source SWF`,
    ),
    sourceFla: flaProfile.present
      ? resolveProjectRelative(
          specArtifact.value.source.fla,
          `${animationId}: source FLA`,
        )
      : null,
    associatedAudio: resolveProjectRelative(
      specArtifact.value.source.associatedAudio,
      `${animationId}: associated audio`,
    ),
    antecedentScenario: resolveProjectRelative(
      specArtifact.value.evidence.prebindingScenarioInventory,
      `${animationId}: prebinding scenario antecedent`,
    ),
    antecedentDisposition: resolveProjectRelative(
      specArtifact.value.evidence.prebindingFrameDomainDisposition,
      `${animationId}: prebinding disposition antecedent`,
    ),
    audioAudit: resolveProjectRelative(
      specArtifact.value.evidence.audioAudit,
      `${animationId}: audio audit`,
    ),
    generator: resolveProjectRelative(
      CANDIDATE_GENERATOR,
      `${animationId}: candidate generator`,
    ),
    safeAdapter: resolveProjectRelative(
      SAFE_ADAPTER_GENERATOR,
      `${animationId}: safe-adapter generator`,
    ),
  };
  const [
    sourceSwfArtifact,
    sourceFlaArtifact,
    associatedAudioArtifact,
    antecedentScenarioArtifact,
    antecedentDispositionArtifact,
    audioAuditArtifact,
    generatorArtifact,
    safeAdapterArtifact,
  ] = await Promise.all([
    readOrdinaryFile(
      dynamicPaths.sourceSwf,
      `${animationId}: physical source SWF`,
    ),
    flaProfile.present
      ? readOrdinaryFile(
          dynamicPaths.sourceFla,
          `${animationId}: physical source FLA`,
        )
      : Promise.resolve(null),
    readOrdinaryFile(
      dynamicPaths.associatedAudio,
      `${animationId}: physical associated audio`,
    ),
    readJson(
      dynamicPaths.antecedentScenario,
      `${animationId}: immutable scenario antecedent`,
    ),
    readJson(
      dynamicPaths.antecedentDisposition,
      `${animationId}: immutable disposition antecedent`,
    ),
    readJson(
      dynamicPaths.audioAudit,
      `${animationId}: audio audit`,
    ),
    readOrdinaryFile(
      dynamicPaths.generator,
      `${animationId}: candidate generator`,
    ),
    readOrdinaryFile(
      dynamicPaths.safeAdapter,
      `${animationId}: safe-adapter generator`,
    ),
  ]);
  invariant(
    antecedentScenarioArtifact.value.animationId === animationId &&
      antecedentDispositionArtifact.value.animationId === animationId &&
      audioAuditArtifact.value.animationId === animationId,
    `${animationId}: selected-workspace evidence identity drifted`,
  );
  const candidateFrameDomain =
    specArtifact.value.timeline.local.timelineId;
  const antecedentRoot = antecedentDispositionArtifact.value.timelines?.filter(
    ({timelineId}) => timelineId === "root",
  );
  const antecedentTarget =
    antecedentDispositionArtifact.value.timelines?.filter(
      ({timelineId}) => timelineId === candidateFrameDomain,
    );
  invariant(
    antecedentDispositionArtifact.value.status ===
      "structurally-enumerated-dispositions-unresolved" &&
      antecedentDispositionArtifact.value.generatedFrom?.scenarioInventory
        ?.sha256 === antecedentScenarioArtifact.sha256 &&
      antecedentRoot?.length === 1 &&
      antecedentRoot[0].frameCount ===
        specArtifact.value.timeline.root.frameCount &&
      antecedentRoot[0].disposition === "declared-frame-domain" &&
      antecedentTarget?.length === 1 &&
      antecedentTarget[0].frameCount ===
        specArtifact.value.timeline.local.frameCount &&
      antecedentTarget[0].disposition === "unresolved" &&
      antecedentScenarioArtifact.value.source?.swfSha256 ===
        specArtifact.value.source.swfSha256 &&
      (flaProfile.present
        ? antecedentScenarioArtifact.value.source?.pairedFlaStatus ===
            "present" &&
          antecedentScenarioArtifact.value.source.fla ===
            specArtifact.value.source.fla &&
          antecedentScenarioArtifact.value.source.flaSha256 ===
            specArtifact.value.source.flaSha256
        : antecedentScenarioArtifact.value.source?.pairedFlaStatus ===
            "missing" &&
          antecedentScenarioArtifact.value.source.fla === null &&
          antecedentScenarioArtifact.value.source.flaSha256 === null) &&
      antecedentScenarioArtifact.value.source?.fps ===
        specArtifact.value.timeline.fps &&
      antecedentScenarioArtifact.value.source?.rootFrameCount ===
        specArtifact.value.timeline.root.frameCount,
    `${animationId}: immutable prebinding antecedent content drifted`,
  );
  assertCandidateLineage({
    animationId,
    paths: relativePaths,
    specArtifact,
    reportArtifact,
    assetManifestArtifact,
    runtimeArtifact,
    sourceSwfArtifact,
    sourceFlaArtifact,
    associatedAudioArtifact,
    antecedentScenarioArtifact,
    antecedentDispositionArtifact,
    audioAuditArtifact,
    generatorArtifact,
    safeAdapterArtifact,
  });
  const mainFrameDomain = candidateFrameDomain;
  const rootDisposition = dispositionArtifact.value.timelines?.filter(
    ({timelineId}) => timelineId === "root",
  );
  const targetDisposition = dispositionArtifact.value.timelines?.filter(
    ({timelineId}) => timelineId === mainFrameDomain,
  );
  invariant(
    rootDisposition?.length === 1 &&
      rootDisposition[0].frameCount ===
        specArtifact.value.timeline.root.frameCount &&
      rootDisposition[0].disposition === "declared-frame-domain" &&
      targetDisposition?.length === 1 &&
      targetDisposition[0].frameCount ===
        specArtifact.value.timeline.local.frameCount &&
      ["unresolved", "declared-frame-domain"].includes(
        targetDisposition[0].disposition,
      ),
    `${animationId}: live root or target frame-domain disposition drifted`,
  );
  const unresolvedTimelineCandidateIds = (
    dispositionArtifact.value.timelines ?? []
  )
    .filter(({timelineId, disposition}) =>
      disposition === "unresolved" && timelineId !== mainFrameDomain)
    .map(({timelineId}) => timelineId);
  invariant(new Set(unresolvedTimelineCandidateIds).size ===
    unresolvedTimelineCandidateIds.length,
  `${animationId}: unresolved timeline candidates are duplicated`);
  const releaseMember = exactReleaseMember(releaseCatalog, {
    animationId,
    manifest: manifestArtifact.value,
    sourceSwfArtifact,
    spec: specArtifact.value,
  });
  const releaseSequence = releaseMember.ordinal;
  const expected = buildBoundManifest({
    selectedAnimationId: animationId,
    manifest: manifestArtifact.value,
    spec: specArtifact.value,
    specArtifact,
    report: reportArtifact.value,
    reportArtifact,
    assetManifest: assetManifestArtifact.value,
    assetManifestArtifact,
    runtimeArtifact,
    releaseSequence,
    unresolvedTimelineCandidateIds,
  });
  const expectedCoverage = buildBoundCoverage({
    manifest: expected,
    releaseSequence,
    unresolvedTimelineCandidateIds,
  });
  const renderedManifest = `${JSON.stringify(expected, null, 2)}\n`;
  const renderedCoverage = `${JSON.stringify(expectedCoverage, null, 2)}\n`;
  if (manifestArtifact.text !== renderedManifest) {
    if (
      manifestArtifact.value.implementation?.candidateState?.status ===
        "current-javascript-engineering-candidate-only"
    ) {
      assertBoundManifestPreimage(manifestArtifact.value, expected);
    } else {
      assertInitialManifestPreimage(
        manifestArtifact.value,
        specArtifact.value,
      );
    }
  }
  if (coverageArtifact.text !== renderedCoverage) {
    assertInitialCoveragePreimage(
      coverageArtifact.value,
      specArtifact.value,
    );
  }
  return {
    animationId,
    readSet: [
      {
        label: `${animationId}: frame-domain disposition`,
        path: dispositionArtifact.path,
        snapshot: dispositionArtifact,
      },
      {
        label: `${animationId}: candidate specification`,
        path: specArtifact.path,
        snapshot: specArtifact,
      },
      {
        label: `${animationId}: candidate report`,
        path: reportArtifact.path,
        snapshot: reportArtifact,
      },
      {
        label: `${animationId}: asset manifest`,
        path: assetManifestArtifact.path,
        snapshot: assetManifestArtifact,
      },
      {
        label: `${animationId}: runtime script`,
        path: runtimeArtifact.path,
        snapshot: runtimeArtifact,
      },
      {
        label: `${animationId}: physical source SWF`,
        path: sourceSwfArtifact.path,
        snapshot: sourceSwfArtifact,
      },
      ...(sourceFlaArtifact
        ? [{
            label: `${animationId}: physical source FLA`,
            path: sourceFlaArtifact.path,
            snapshot: sourceFlaArtifact,
          }]
        : []),
      {
        label: `${animationId}: physical associated audio`,
        path: associatedAudioArtifact.path,
        snapshot: associatedAudioArtifact,
      },
      {
        label: `${animationId}: immutable scenario antecedent`,
        path: antecedentScenarioArtifact.path,
        snapshot: antecedentScenarioArtifact,
      },
      {
        label: `${animationId}: immutable disposition antecedent`,
        path: antecedentDispositionArtifact.path,
        snapshot: antecedentDispositionArtifact,
      },
      {
        label: `${animationId}: audio audit`,
        path: audioAuditArtifact.path,
        snapshot: audioAuditArtifact,
      },
      {
        label: "candidate generator",
        path: generatorArtifact.path,
        snapshot: generatorArtifact,
      },
      {
        label: "safe-adapter generator",
        path: safeAdapterArtifact.path,
        snapshot: safeAdapterArtifact,
      },
    ],
    outputs: [
      {
        path: paths.manifest,
        before: manifestArtifact,
        rendered: renderedManifest,
      },
      {
        path: paths.coverage,
        before: coverageArtifact,
        rendered: renderedCoverage,
      },
    ],
  };
}

async function removeOwnedNode(filePath, identity, label) {
  try {
    const current = await lstat(filePath);
    invariant(
      current.dev === identity.device && current.ino === identity.inode,
      `${label} was replaced; refusing cleanup`,
    );
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function acquireTransactionLock(lockPath, transaction) {
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        `G5 L4 workspace-binding transaction lock is active or residual: ${lockPath}`,
      );
    }
    throw error;
  }
  const createdInformation = await handle.stat();
  const createdIdentity = {
    device: createdInformation.dev,
    inode: createdInformation.ino,
  };
  const owner = Buffer.from(`${JSON.stringify({
    schemaVersion: 1,
    operation: "g5-l4-source-static-workspace-binding",
    transaction,
    pid: process.pid,
  }, null, 2)}\n`);
  try {
    await handle.writeFile(owner);
    await handle.sync();
    const information = await handle.stat();
    return {
      path: lockPath,
      handle,
      device: information.dev,
      inode: information.ino,
      sha256: digest(owner),
    };
  } catch (error) {
    const cleanupErrors = [];
    await handle.close().catch((cleanupError) => {
      cleanupErrors.push(cleanupError);
    });
    await removeOwnedNode(
      lockPath,
      createdIdentity,
      "failed G5 L4 workspace-binding transaction lock",
    ).catch((cleanupError) => {
      cleanupErrors.push(cleanupError);
    });
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "G5 L4 workspace-binding lock acquisition failed and cleanup was incomplete",
      );
    }
    throw error;
  }
}

async function releaseTransactionLock(lock) {
  await lock.handle.close();
  const current = await readOrdinaryFile(
    lock.path,
    "G5 L4 workspace-binding transaction lock",
  );
  invariant(
    current.device === lock.device &&
      current.inode === lock.inode &&
      current.sha256 === lock.sha256,
    "refusing to remove a replaced G5 L4 workspace-binding transaction lock",
  );
  await unlink(lock.path);
}

async function removeOwnedTemporary(filePath, snapshot, label) {
  try {
    const current = await readOrdinaryFile(filePath, label);
    invariant(
      sameSnapshot(current, snapshot),
      `${label} was replaced; refusing cleanup`,
    );
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function stageTemporary(filePath, bytes, label, mode = 0o644) {
  const handle = await open(filePath, "wx", mode);
  const information = await handle.stat();
  const identity = {
    device: information.dev,
    inode: information.ino,
  };
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    const snapshot = await readOrdinaryFile(filePath, label);
    invariant(
      snapshot.device === identity.device &&
        snapshot.inode === identity.inode &&
        snapshot.bytes.equals(bytes),
      `${label} bytes or identity changed while staging`,
    );
    return snapshot;
  } catch (error) {
    const cleanupErrors = [];
    await handle.close().catch((cleanupError) => {
      if (cleanupError?.code !== "EBADF") cleanupErrors.push(cleanupError);
    });
    await removeOwnedNode(filePath, identity, label).catch((cleanupError) => {
      cleanupErrors.push(cleanupError);
    });
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        `${label} failed and cleanup was incomplete`,
      );
    }
    throw error;
  }
}

async function rollbackInstalledOutput(output, transaction, hooks) {
  if (hooks.beforeRollback) await hooks.beforeRollback({output});
  await assertSnapshotCurrent(
    output.installedSnapshot,
    `${output.animationId}: installed binding rollback ownership`,
  );
  const rollback =
    `${output.path}.rollback-${process.pid}-${transaction}`;
  const rollbackSnapshot = await stageTemporary(
    rollback,
    output.before.bytes,
    `${output.animationId}: binding rollback staging`,
    output.before.mode & 0o777,
  );
  try {
    await assertSnapshotCurrent(
      output.installedSnapshot,
      `${output.animationId}: installed binding before rollback`,
    );
    await rename(rollback, output.path);
    const restored = await readOrdinaryFile(
      output.path,
      `${output.animationId}: restored binding`,
    );
    invariant(
      restored.sha256 === output.before.sha256 &&
        restored.bytes.equals(output.before.bytes) &&
        restored.mode === output.before.mode,
      `${output.animationId}: binding rollback postcondition failed`,
    );
  } finally {
    await removeOwnedTemporary(
      rollback,
      rollbackSnapshot,
      `${output.animationId}: unused binding rollback staging`,
    );
  }
}

export async function applyBindingTransaction({
  prepared,
  readSet,
  lockPath = TRANSACTION_LOCK,
  hooks = {},
}) {
  const transaction = randomUUID();
  const allOutputs = prepared.flatMap((item) =>
    item.outputs.map((output) => ({
      ...output,
      animationId: item.animationId,
    })));
  const outputs = allOutputs
    .filter((output) => output.before.text !== output.rendered)
    .map((output) => ({
      ...output,
      renderedBytes: Buffer.from(output.rendered),
      renderedSha256: digest(Buffer.from(output.rendered)),
      temporary:
        `${output.path}.tmp-${process.pid}-${transaction}`,
    }));
  const noOpOutputs = allOutputs.filter(
    (output) => output.before.text === output.rendered,
  );
  invariant(
    new Set(allOutputs.map(({path: outputPath}) => outputPath)).size ===
      allOutputs.length,
    "G5 L4 workspace-binding transaction contains duplicate outputs",
  );
  const lock = await acquireTransactionLock(lockPath, transaction);
  const installed = [];
  const staged = [];
  let result;
  let primaryError = null;
  try {
    await assertReadSetCurrent(readSet);
    for (const output of allOutputs) {
      await assertSnapshotCurrent(
        output.before,
        `${output.animationId}: binding output transaction preimage`,
      );
    }
    if (hooks.afterLock) await hooks.afterLock({transaction, outputs});
    for (const output of outputs) {
      output.temporarySnapshot = await stageTemporary(
        output.temporary,
        output.renderedBytes,
        `${output.animationId}: binding output staging`,
        output.before.mode & 0o777,
      );
      staged.push(output);
    }
    await assertReadSetCurrent(readSet);
    for (let index = 0; index < outputs.length; index += 1) {
      const output = outputs[index];
      if (hooks.beforeInstall) {
        await hooks.beforeInstall({index, output, transaction});
      }
      await assertReadSetCurrent(readSet);
      await assertSnapshotCurrent(
        output.before,
        `${output.animationId}: binding target before commit`,
      );
      await rename(output.temporary, output.path);
      output.installedSnapshot = await readOrdinaryFile(
        output.path,
        `${output.animationId}: installed binding`,
      );
      invariant(
        output.installedSnapshot.sha256 === output.renderedSha256 &&
          output.installedSnapshot.bytes.equals(output.renderedBytes) &&
          output.installedSnapshot.mode === output.before.mode,
        `${output.animationId}: installed binding postimage mismatch`,
      );
      installed.push(output);
      if (hooks.afterInstall) {
        await hooks.afterInstall({index, output, transaction});
      }
    }
    if (hooks.beforePostcondition) {
      await hooks.beforePostcondition({transaction, outputs});
    }
    await assertReadSetCurrent(readSet);
    for (const output of installed) {
      await assertSnapshotCurrent(
        output.installedSnapshot,
        `${output.animationId}: installed binding postcondition`,
      );
    }
    for (const output of noOpOutputs) {
      await assertSnapshotCurrent(
        output.before,
        `${output.animationId}: no-op binding postcondition`,
      );
    }
    result = {
      transaction,
      changedOutputCount: outputs.length,
      noOpOutputCount: allOutputs.length - outputs.length,
    };
  } catch (error) {
    const rollbackErrors = [];
    for (const output of [...installed].reverse()) {
      try {
        await rollbackInstalledOutput(output, transaction, hooks);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length) {
      primaryError = new AggregateError(
        [error, ...rollbackErrors],
        "G5 L4 source-static workspace binding failed and rollback was incomplete",
      );
    } else {
      primaryError = error;
    }
  }
  const cleanupErrors = [];
  for (const output of staged) {
    try {
      await removeOwnedTemporary(
        output.temporary,
        output.temporarySnapshot,
        `${output.animationId}: unused binding output staging`,
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  try {
    await releaseTransactionLock(lock);
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (primaryError && cleanupErrors.length) {
    throw new AggregateError(
      [primaryError, ...cleanupErrors],
      "G5 L4 workspace-binding transaction failed and cleanup was incomplete",
    );
  }
  if (primaryError) throw primaryError;
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      "G5 L4 workspace-binding transaction cleanup failed",
    );
  }
  return result;
}

export async function materialize(options = parseArguments([])) {
  const [releaseCatalog, completionLedgerBefore, releaseLedgerBefore] =
    await Promise.all([
      readJson(
        path.join(projectRoot, "catalog", "lesson-releases.json"),
        "G5 L4 lesson-release catalog",
      ),
      readOrdinaryFile(COMPLETION_LEDGER, "completion ledger preimage"),
      readOrdinaryFile(LESSON_RELEASE_LEDGER, "lesson-release ledger preimage"),
    ]);
  const prepared = [];
  for (const animationId of options.ids) {
    prepared.push(await prepare(animationId, releaseCatalog.value));
  }
  const readSet = mergeReadSet([
    {
      label: "G5 L4 lesson-release catalog",
      path: releaseCatalog.path,
      snapshot: releaseCatalog,
    },
    {
      label: "completion ledger",
      path: completionLedgerBefore.path,
      snapshot: completionLedgerBefore,
    },
    {
      label: "lesson-release ledger",
      path: releaseLedgerBefore.path,
      snapshot: releaseLedgerBefore,
    },
    ...prepared.flatMap((item) => item.readSet),
  ]);
  let transactionResult = {
    changedOutputCount: prepared.flatMap(({outputs}) => outputs)
      .filter((output) => output.before.text !== output.rendered).length,
    noOpOutputCount: prepared.flatMap(({outputs}) => outputs)
      .filter((output) => output.before.text === output.rendered).length,
  };
  if (options.mode === "check") {
    for (const item of prepared) {
      for (const output of item.outputs) {
        invariant(output.before.text === output.rendered,
          `${item.animationId}: source-static workspace binding is stale`);
        await assertSnapshotCurrent(
          output.before,
          `${item.animationId}: checked binding output`,
        );
      }
    }
    await assertReadSetCurrent(readSet);
  } else if (options.mode === "apply") {
    transactionResult = await applyBindingTransaction({
      prepared,
      readSet,
    });
  } else {
    await assertReadSetCurrent(readSet);
  }
  return {
    schemaVersion: 1,
    operation: options.mode,
    releaseId: RELEASE_ID,
    memberCount: prepared.length,
    members: prepared.map((item) => ({
      animationId: item.animationId,
      outputs: item.outputs.map((output) => ({
        path: portable(path.relative(projectRoot, output.path)),
        changed: output.before.text !== output.rendered,
      })),
    })),
    migrationStatusChanged: false,
    acceptanceEffectsChanged: false,
    ledgersChanged: false,
    transaction: {
      lockProtected: options.mode === "apply",
      changedOutputCount: transactionResult.changedOutputCount,
      noOpOutputCount: transactionResult.noOpOutputCount,
      readSetCount: readSet.length,
    },
    ledgerSha256: {
      completion: completionLedgerBefore.sha256,
      lessonRelease: releaseLedgerBefore.sha256,
    },
    strictAcceptanceEffect: "none",
  };
}

function usage() {
  return [
    "Usage: node scripts/materialize-g5-l4-source-static-workspace-bindings.mjs [options]",
    "",
    "Options:",
    "  --apply      Bind the allowlisted candidates with lock, CAS, and safe rollback",
    "  --check      Verify the checked-in bindings",
    "  --id <id>    Select one bounded candidate; repeatable",
    "  --help       Show this help",
    "",
    "Default is a read-only dry run. The command preserves migration status,",
    "acceptance records, ledgers, source assets, and every strict gate.",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else process.stdout.write(`${JSON.stringify(await materialize(options), null, 2)}\n`);
}
