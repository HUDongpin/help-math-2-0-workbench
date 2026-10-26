#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  copyFile,
  lstat,
  readFile,
  realpath,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const AUDIT = "catalog/g678-ts07-family-audit-v1.json";
const RECOVERY = "catalog/g678-ts07-l1-keyterm-recovery-v1.json";
const PREDECESSOR =
  "catalog/product-bridge-calibrations/g678-current-js-276-page-product-calibrated-registration-v1.json";
const PREDECESSOR_PROVISIONAL =
  "catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.json";
const PREDECESSOR_REGISTRY_SNAPSHOT =
  "output/playwright/g678-current-js-276-v2/private-current-js-registry.snapshot.json";
const REDUCER = "packages/demos/src/g678-ts07-assessment.ts";
const FEEDBACK_SELECTOR =
  "packages/demos/src/g678-advanced-manual/host-feedback-selector.ts";
const GLOSSARY_ADAPTER =
  "packages/demos/src/private-source-static-glossary-candidate.tsx";
const OUTPUT =
  "catalog/product-bridge-calibrations/g678-ts07-assessment-lane-routing-v1.json";
const PRODUCT_SLICE = Object.freeze(["shared-nms002-l01-p043"]);
const SHARED_DEFINITION_BLOCKED = Object.freeze([
  "shared-alg001-l02-p054",
  "shared-alg001-l11-p040",
  "shared-alg001-l12-p048",
  "shared-dat001-l01-p052",
]);
const ADVANCED_MANUAL = Object.freeze([
  "shared-alg001-l01-p052",
  "shared-geo001-l01-p055",
]);
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

async function stableFile(relativePath, {json = false} = {}) {
  const absolute = projectPath(relativePath);
  const [before, canonical] = await Promise.all([
    lstat(absolute, {bigint: true}),
    realpath(absolute),
  ]);
  invariant(canonical === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer)} : {})});
}

function descriptor(binding) {
  return Object.freeze({path: binding.path, bytes: binding.bytes,
    sha256: binding.sha256});
}

function setProjection(ids) {
  const projection = `${[...ids].sort(compareText).join("\n")}\n`;
  return Object.freeze({projection, sha256: sha256(projection)});
}

function registryIds(registry, predecessorSha256) {
  const calibration = registry.calibrations.find((candidate) =>
    candidate.calibrationId === "g678-16-page-product-calibration-v1");
  invariant(calibration?.deploymentScope === "local-only" &&
    calibration.entries.length === 276 &&
    calibration.freezeManifestSha256 === predecessorSha256,
  "276-page private registry calibration drifted");
  return new Set(calibration.entries.map((entry) => entry.key));
}

async function expectedRouting() {
  const [audit, recovery, predecessor, predecessorProvisional,
    predecessorRegistrySnapshot, reducer,
    feedbackSelector, glossaryAdapter, builder] = await Promise.all([
    stableFile(AUDIT, {json: true}),
    stableFile(RECOVERY, {json: true}),
    stableFile(PREDECESSOR, {json: true}),
    stableFile(PREDECESSOR_PROVISIONAL, {json: true}),
    stableFile(PREDECESSOR_REGISTRY_SNAPSHOT, {json: true}),
    stableFile(REDUCER),
    stableFile(FEEDBACK_SELECTOR),
    stableFile(GLOSSARY_ADAPTER),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  invariant(audit.value.scope.ts07Placements === 44 &&
    audit.value.records.length === 44 &&
    audit.value.registrationCandidatePlacementCount === 0 &&
    audit.value.behaviorShapeProjectionSha256 ===
      "fe7d86e8d86783f1954395684aec003e4de6beeda270648fde05eb91660e0c6a" &&
    Object.values(audit.value.acceptanceEffects).every((value) => value === false),
  "TS07 family audit authority drifted");
  invariant(recovery.value.eligibility.recoveredL1ReferencePlacementCount === 15 &&
    recovery.value.eligibility.exactEntryPresentPlacementCount === 13 &&
    recovery.value.eligibility.productEligiblePlacementCount === 0 &&
    recovery.value.registrationCandidatePlacementCount === 0 &&
    recovery.value.definitionConflictNormalizedKeys.length === 6 &&
    Object.values(recovery.value.acceptanceEffects).every((value) => value === false),
  "TS07 L1 recovery authority drifted");
  invariant(predecessor.value.selectedPages.length === 276 &&
    predecessor.value.registrationCandidatePlacementCount === 276 &&
    predecessor.value.deploymentScope === "local-only" &&
    Object.values(predecessor.value.acceptanceEffects).every((value) =>
      value === false),
  "276-page predecessor boundary drifted");
  invariant(predecessorProvisional.value.selectedPages.length === 276 &&
    predecessorProvisional.value.registrationCandidatePlacementCount === 276 &&
    predecessorProvisional.value.deploymentScope === "local-only",
  "276-page provisional predecessor boundary drifted");
  const registered = registryIds(predecessorRegistrySnapshot.value,
    predecessorProvisional.sha256);
  const recordMap = new Map(audit.value.records.map((record) =>
    [record.placements[0].animationId, record]));
  const exactEntryPresent = new Map(
    recovery.value.eligibility.exactEntryPresent.map((page) =>
      [page.animationId, page]),
  );
  const inactive = new Set(
    audit.value.exactClassifier.inactiveFeedbackDomains.map((domain) =>
      domain.animationId),
  );
  const definitionConflicts = new Set(
    recovery.value.definitionConflictNormalizedKeys,
  );
  const exactAndActive = [...exactEntryPresent.keys()].filter((id) =>
    !inactive.has(id)).sort(compareText);
  invariant(exactAndActive.length === 7 &&
    JSON.stringify(exactAndActive) === JSON.stringify([
      ...ADVANCED_MANUAL,
      ...SHARED_DEFINITION_BLOCKED,
      ...PRODUCT_SLICE,
    ].sort(compareText)),
  "TS07 exact-entry/active-feedback intersection drifted");
  const route = (animationId, lane, blockers) => {
    const record = recordMap.get(animationId);
    const recoveryPage = exactEntryPresent.get(animationId);
    invariant(record?.placements.length === 1 && recoveryPage &&
      !registered.has(animationId), `${animationId} route binding drifted`);
    const pageDefinitionConflicts = recoveryPage.normalizedSourceKeys.filter(
      (key) => definitionConflicts.has(key));
    return Object.freeze({
      animationId,
      stableLessonKey: record.placements[0].stableLessonKey,
      source: Object.freeze({path: record.placements[0].sourcePath,
        bytes: record.sourceBytes, sha256: record.sourceSha256}),
      lane,
      quizStopFrame: record.behavior.quizStop.frame,
      correctAnswerOrdinal: record.behavior.quiz.correctAnswerOrdinal,
      answerInstanceCount: record.behavior.quiz.answerInstances.length,
      wrongFeedbackDomainCount:
        record.behavior.quiz.wrongFeedbackDomains.length,
      rightFeedbackDomainCount:
        record.behavior.quiz.rightFeedbackDomains.length,
      inactiveFeedbackDomainCount: [
        ...record.behavior.quiz.wrongFeedbackDomains,
        ...record.behavior.quiz.rightFeedbackDomains,
      ].filter((domain) => !domain.activeAtQuizStop).length,
      glossaryTermCount: recoveryPage.normalizedSourceKeys.length,
      definitionConflictNormalizedKeys:
        Object.freeze(pageDefinitionConflicts),
      blockers: Object.freeze(blockers),
    });
  };
  const productSlice = PRODUCT_SLICE.map((id) => route(id,
    "interactive-understood-representative-product-slice", [
      "source-answer-label-and-hit-geometry-evidence-pending",
      "source-feedback-visual-and-audio-product-adapter-pending",
      "my-lesson-browser-product-calibration-pending",
    ]));
  invariant(productSlice[0].definitionConflictNormalizedKeys.length === 0 &&
    productSlice[0].inactiveFeedbackDomainCount === 0 &&
    productSlice[0].correctAnswerOrdinal === 3,
  "TS07 representative product slice drifted");
  const sharedDefinitionBlocked = SHARED_DEFINITION_BLOCKED.map((id) => route(id,
    "interactive-understood-after-content-authority", [
      "bilingual-definition-authority-unresolved",
      "representative-product-slice-not-yet-passed",
    ]));
  const advancedManual = ADVANCED_MANUAL.map((id) => route(id,
    "advanced-manual-review", [
      id === "shared-alg001-l01-p052"
        ? "fui-doinitaction-behavior-requires-source-first-implementation"
        : "help-button-and-mc-popup1-variant-requires-source-first-implementation",
      "bilingual-definition-authority-unresolved",
    ]));
  const routedIds = new Set([
    ...PRODUCT_SLICE,
    ...SHARED_DEFINITION_BLOCKED,
    ...ADVANCED_MANUAL,
  ]);
  const blocked = [...recordMap.keys()].filter((id) => !routedIds.has(id))
    .sort(compareText).map((animationId) => {
      const record = recordMap.get(animationId);
      return Object.freeze({animationId,
        stableLessonKey: record.placements[0].stableLessonKey,
        inactiveFeedbackDomainCount: [
          ...record.behavior.quiz.wrongFeedbackDomains,
          ...record.behavior.quiz.rightFeedbackDomains,
        ].filter((domain) => !domain.activeAtQuizStop).length,
        blocker: exactEntryPresent.has(animationId)
          ? "feedback-domain-inactive-at-final-quiz-stop"
          : "required-key-term-xml-or-exact-screen-key-entry-unresolved"});
    });
  invariant(blocked.length === 37 && routedIds.size === 7,
    "TS07 routed/blocked denominator drifted");
  return Object.freeze({
    schemaVersion: 1,
    artifactType: "g678-ts07-assessment-lane-routing-v1",
    routingId: "g678-ts07-assessment-lane-routing-v1",
    status: "one-page-representative-implementation-authorized-registration-blocked",
    inputs: Object.freeze({audit: descriptor(audit), recovery: descriptor(recovery),
      predecessor: descriptor(predecessor),
      predecessorProvisional: descriptor(predecessorProvisional),
      predecessorRegistrySnapshot: descriptor(predecessorRegistrySnapshot),
      reducer: descriptor(reducer), feedbackSelector: descriptor(feedbackSelector),
      glossaryAdapter: descriptor(glossaryAdapter), builder: descriptor(builder)}),
    scope: Object.freeze({ts07Placements: 44,
      representativeProductSlicePlacements: productSlice.length,
      sharedDefinitionBlockedPlacements: sharedDefinitionBlocked.length,
      advancedManualReviewPlacements: advancedManual.length,
      otherBlockedPlacements: blocked.length,
      predecessorRegisteredPlacements: 276,
      courseShellsInMigrationScope: 0}),
    exactSets: Object.freeze({
      representativeProductSlice: setProjection(PRODUCT_SLICE).sha256,
      sharedDefinitionBlocked: setProjection(SHARED_DEFINITION_BLOCKED).sha256,
      advancedManualReview: setProjection(ADVANCED_MANUAL).sha256,
      blocked: setProjection(blocked.map((page) => page.animationId)).sha256,
    }),
    representativeProductSlice: Object.freeze(productSlice),
    sharedDefinitionBlocked: Object.freeze(sharedDefinitionBlocked),
    advancedManualReview: Object.freeze(advancedManual),
    blocked: Object.freeze(blocked),
    implementationAuthorizedPlacementCount: 1,
    generatedCandidatePlacementCount: 0,
    registrationAuthorizedPlacementCount: 0,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS,
  });
}

async function writeExclusive(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function buildTs07LaneRouting({check = false} = {}) {
  const artifact = await expectedRouting();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await stableFile(OUTPUT);
    invariant(current.buffer.equals(bytes), "TS07 lane routing drifted");
  } else {
    invariant(!await lstat(projectPath(OUTPUT)).then(() => true, () => false),
      `${OUTPUT} already exists`);
    await writeExclusive(OUTPUT, bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    implementationAuthorizedPlacementCount: 1,
    generatedCandidatePlacementCount: 0,
    registrationAuthorizedPlacementCount: 0,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === "--check"),
    "usage: build-g678-ts07-lane-routing.mjs [--check]");
  buildTs07LaneRouting({check: args.includes("--check")})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
