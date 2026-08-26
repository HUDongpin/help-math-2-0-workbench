#!/usr/bin/env node

import assert from "node:assert/strict";
import {access, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS,
  FQ_MEMBERS,
  KNOWN_REMEDIATIONS_REQUIRED,
  PACKAGE_ID,
  RELEASE_ID,
  bindingFor,
  collectV6DeepQaEvidence,
  sha256,
  stableJson,
  validateFqDeepQaSuccessor,
  validateWholeLessonDeepQaSuccessor,
} from "./lib/g5-l4-current-js-deep-qa-successor.mjs";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SCRIPT_PATH = fileURLToPath(import.meta.url);

export const FQ_RECEIPT_ID =
  "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5";
export const WHOLE_RECEIPT_ID =
  "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5";

const AUTHORIZATION_PATH =
  "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json";
const FQ_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4.json";
const FQ_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4.md";
const WHOLE_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4.json";
const WHOLE_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4.md";

const SOURCE_PATHS = Object.freeze([
  "scripts/lib/g5-l4-current-js-deep-qa-successor.mjs",
  "scripts/build-g5-l4-current-js-deep-qa-successors.mjs",
  "scripts/check-g5-l4-current-js-deep-qa-successors.mjs",
  "scripts/g5-l4-current-js-deep-qa-successor.test.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp.mjs",
]);

function bindingFromBytes(relativePath, bytes, extras = {}) {
  return {
    path: relativePath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...extras,
  };
}

async function bindingsFor(root, relativePaths) {
  const result = [];
  for (const relativePath of relativePaths) {
    result.push(await bindingFor(root, relativePath));
  }
  return result;
}

function allBooleanValuesFalse(record) {
  return Object.values(record ?? {}).every((value) => value === false);
}

async function predecessorFor(root, {receiptPath, markdownPath, receiptId}) {
  const receipt = await bindingFor(root, receiptPath);
  const markdown = await bindingFor(root, markdownPath);
  const predecessor = JSON.parse(
    await readFile(path.resolve(root, receiptPath), "utf8"),
  );
  assert.equal(predecessor.receiptId, receiptId);
  assert.equal(predecessor.releaseId, RELEASE_ID);
  assert.equal(allBooleanValuesFalse(predecessor.acceptanceEffects), true);
  assert.equal(predecessor.scopeResult?.productQaComplete, false);
  return {
    receipt,
    markdown,
    immediatePredecessor: true,
    currentAuthority: false,
    claimsCarriedForward: false,
    supersededByFreshRawEvidence: true,
  };
}

async function authorizationFor(root) {
  const binding = await bindingFor(root, AUTHORIZATION_PATH, {
    strictAcceptanceEffect: "none",
  });
  const record = JSON.parse(
    await readFile(path.resolve(root, AUTHORIZATION_PATH), "utf8"),
  );
  assert.equal(record.authorization.currentJsProductQaAuthorized, true);
  assert.equal(
    record.authorization.privateControlledCeoPreviewPreparationAuthorized,
    true,
  );
  for (const key of [
    "externalDeploymentAuthorized",
    "publicReleaseAuthorized",
    "originalRuntimeEvidenceEstablished",
    "independentHumanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) assert.equal(record.authorization[key], false, `authorization.${key}`);
  return binding;
}

function remediationMarkdown() {
  return KNOWN_REMEDIATIONS_REQUIRED.map((item) => `- ${item}`).join("\n");
}

function fqMarkdown({rawReportPath, sourceDrift}) {
  return `# G5 L4 FQ002/FQ003 current-JavaScript deep-QA successor\n\n` +
    `Receipt: \`${FQ_RECEIPT_ID}\`  \n` +
    `Evidence assembled: **2026-08-01**\n\n` +
    `## Fresh result\n\n` +
    `The hash-bound fresh-unzipped \`${PACKAGE_ID}\` raw run at ` +
    `\`${rawReportPath}\` freshly passed the FQ full traversal, score/review, ` +
    `and Replay interaction observations. Exact 54-page release order was freshly ` +
    `established in both locales. These claims come from the r4 raw run, not ` +
    `from the r4 predecessor.\n\n` +
    `## Failed raw attempt boundary\n\n` +
    `The immutable r1 raw attempt stopped before deep assertions because its ` +
    `Replay probe searched for the wrong local-storage key prefix. r1 is ` +
    `bound as a failed attempt only; no r1 observations or claims are carried ` +
    `forward. The r2 raw attempt then completed its matrices but retained ` +
    `runner-classification failures around Map focus and a navigation-aborted ` +
    `renderer request; it is also bound with no claims carried forward. The ` +
    `r3 attempt then retained one transient VB004 mobile layout sample and an ` +
    `aborted Spanish Key Terms reference request. It too has no current ` +
    `authority and carries no claim forward. The fresh claims above come ` +
    `exclusively from r4.\n\n` +
    `## Source observation boundary\n\n` +
    `\`sourceCurrentAtObservation=false\`. ${sourceDrift} The browser subject ` +
    `was the immutable v6 fresh-unzip runtime, not current workspace source.\n\n` +
    `## Known current-JavaScript remediations\n\n` +
    `${remediationMarkdown()}\n\n` +
    `## Acceptance boundary\n\n` +
    `This is bounded current-JavaScript private-preview evidence. ` +
    `\`productQaComplete=false\` and \`migrationQaComplete=false\`. It does ` +
    `not establish original-runtime behavior, Flash/Animate fidelity, Spanish ` +
    `source-visual parity, audio acceptance, RMSE acceptance, human or Owner ` +
    `acceptance, strict completion, deployment, release, or publication.\n`;
}

function wholeMarkdown({rawReportPath, sourceDrift}) {
  return `# G5 L4 current-JavaScript whole-lesson deep-QA successor\n\n` +
    `Receipt: \`${WHOLE_RECEIPT_ID}\`  \n` +
    `Evidence assembled: **2026-08-01**\n\n` +
    `## Fresh result\n\n` +
    `The raw fresh-unzip run at \`${rawReportPath}\` freshly established exact ` +
    `release order and passed **648/648 layout**, **648/648 identity**, and ` +
    `**648/648 overflow** observations; **108/108 reduced-motion rows** with ` +
    `**324/324 samples**; and **324/324 Replay mouse/Enter/Space ` +
    `activations**. Course Map, Key Terms, full FQ flow, and cross-locale ` +
    `persistence were freshly exercised. Different-page Map focus passed, ` +
    `while same-page Map reselection lost focus and remains a remediation. ` +
    `v6 per-page direct URLs remain ` +
    `unavailable and are not claimed.\n\n` +
    `## Failed raw attempt boundary\n\n` +
    `The immutable r1 raw attempt stopped before assertion aggregation when ` +
    `the Replay probe searched for the wrong local-storage key prefix. r1 is ` +
    `retained as a failed-attempt binding with no current authority and no ` +
    `claims carried forward. The r2 attempt completed the matrices but ` +
    `retained runner-classification failures around Map focus and a ` +
    `navigation-aborted renderer request; it too is bound with no claims ` +
    `carried forward. The r3 attempt retained one transient VB004 mobile ` +
    `layout sample and an aborted Spanish Key Terms reference request, so it ` +
    `also remains a non-authoritative failed attempt. This receipt derives ` +
    `fresh observations only from r4.\n\n` +
    `## Source observation boundary\n\n` +
    `\`sourceCurrentAtObservation=false\`. ${sourceDrift} The QA server used ` +
    `the hash-bound immutable v6 fresh-unzip runtime; the workspace drift did ` +
    `not alter the ZIP or make current source the runtime under observation.\n\n` +
    `## Known current-JavaScript remediations\n\n` +
    `${remediationMarkdown()}\n\n` +
    `## Acceptance boundary\n\n` +
    `The r4 JSON and Markdown are bound only as the immediate predecessor; ` +
    `their observations are not carried forward. This r5 is ` +
    `acceptance-neutral current-JavaScript private-preview evidence. ` +
    `\`productQaComplete=false\`, \`migrationQaComplete=false\`, strict ` +
    `completion remains **0/55**, and the lesson remains unpublished. No ` +
    `original-runtime, fidelity, audio, RMSE, human, Owner, release, ` +
    `deployment, or publication gate is changed.\n`;
}

function artifactBindings(markdownPath, markdownBytes, rawArtifacts) {
  return [
    bindingFromBytes(markdownPath, markdownBytes, {
      role: "human-readable-r5-deep-qa-successor-boundary",
    }),
    ...rawArtifacts.map((binding) => ({
      ...binding,
      role: "bound-raw-v6-deep-qa-browser-artifact",
    })),
  ];
}

export async function buildDeepQaSuccessorReceipts({root = ROOT} = {}) {
  const collected = await collectV6DeepQaEvidence({root});
  const authorizationBinding = await authorizationFor(root);
  const sourceBindings = await bindingsFor(root, SOURCE_PATHS);
  const fqPredecessor = await predecessorFor(root, {
    receiptPath: FQ_PREDECESSOR_PATH,
    markdownPath: FQ_PREDECESSOR_MARKDOWN_PATH,
    receiptId:
      "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r4",
  });
  const wholePredecessor = await predecessorFor(root, {
    receiptPath: WHOLE_PREDECESSOR_PATH,
    markdownPath: WHOLE_PREDECESSOR_MARKDOWN_PATH,
    receiptId:
      "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r4",
  });

  const fqJsonPath = `reports/${FQ_RECEIPT_ID}.json`;
  const fqMarkdownPath = `reports/${FQ_RECEIPT_ID}.md`;
  const fqMarkdownBytes = Buffer.from(fqMarkdown({
    rawReportPath: collected.rawDeepQaEvidence.report.path,
    sourceDrift: collected.packageEvidence.sourceDrift.explanation,
  }));
  const fqReceipt = {
    schemaVersion: 3,
    evidenceType:
      "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt",
    receiptId: FQ_RECEIPT_ID,
    releaseId: RELEASE_ID,
    status: "observed-current-javascript-deep-qa-remediations-required",
    evidenceAssembledOn: "2026-08-01",
    authority:
      "Acceptance-neutral current-JavaScript v6 fresh-unzip deep QA for the private controlled CEO preview only. No original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: PACKAGE_ID,
      members: FQ_MEMBERS,
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    authorizationBinding,
    packageEvidence: collected.packageEvidence,
    predecessorEvidence: fqPredecessor,
    rawDeepQaEvidence: collected.rawDeepQaEvidence,
    scopeResult: {
      currentJavascriptFq23DeepQaFreshlyPerformed: true,
      deepQaFreshlyPerformed: true,
      exactReleaseOrderFreshlyEstablished: true,
      fqInteractionFreshlyReperformed: true,
      fullScoreAndReviewFlowFreshlyReperformed: true,
      predecessorClaimsCarriedForward: false,
      currentJavascriptDeepProductQaMachineWorkExhausted: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    knownRemediationsRequired: [...KNOWN_REMEDIATIONS_REQUIRED],
    sourceBindings,
    artifacts: artifactBindings(
      fqMarkdownPath,
      fqMarkdownBytes,
      collected.rawDeepQaEvidence.artifactBindings,
    ),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The immutable v6 package is the runtime observed; sourceCurrentAtObservation is false because a later G4 v3.1 build added 96 bytes to apps/web/tsconfig.json.",
      "The immutable r1 raw attempt failed before assertion aggregation because of an incorrect Replay storage-key lookup; no r1 claim is carried forward.",
      "The immutable r2 raw attempt remained failed because of Map-focus classification and a navigation-aborted renderer request; no r2 claim is carried forward.",
      "The immutable r3 raw attempt remained failed because of one transient VB004 mobile layout sample and an aborted Spanish Key Terms reference request; no r3 claim is carried forward.",
      "Four current-JavaScript UI/accessibility remediations remain required and productQaComplete plus migrationQaComplete remain false.",
      "No original runtime, Flash/Animate comparison, Spanish source-visual parity, audio, RMSE, independent human review, Owner fidelity review, strict validation, deployment, release, or publication was performed or accepted.",
    ],
  };
  validateFqDeepQaSuccessor(fqReceipt);
  const fqJsonBytes = Buffer.from(stableJson(fqReceipt));

  const wholeJsonPath = `reports/${WHOLE_RECEIPT_ID}.json`;
  const wholeMarkdownPath = `reports/${WHOLE_RECEIPT_ID}.md`;
  const wholeMarkdownBytes = Buffer.from(wholeMarkdown({
    rawReportPath: collected.rawDeepQaEvidence.report.path,
    sourceDrift: collected.packageEvidence.sourceDrift.explanation,
  }));
  const wholeReceipt = {
    schemaVersion: 3,
    evidenceType:
      "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
    receiptId: WHOLE_RECEIPT_ID,
    releaseId: RELEASE_ID,
    status: "observed-current-javascript-deep-qa-remediations-required",
    evidenceAssembledOn: "2026-08-01",
    authority:
      "Acceptance-neutral current-JavaScript v6 fresh-unzip deep product QA for the loopback-only controlled CEO preview. No original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: PACKAGE_ID,
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    authorizationBinding,
    packageEvidence: collected.packageEvidence,
    predecessorEvidence: wholePredecessor,
    childReceipts: [bindingFromBytes(fqJsonPath, fqJsonBytes, {
      role: "r5-fq23-deep-qa-successor",
    })],
    rawDeepQaEvidence: collected.rawDeepQaEvidence,
    scopeResult: {
      deepQaFreshlyPerformed: true,
      exactReleaseOrderFreshlyEstablished: true,
      layoutAssertionsFreshlyPassed: true,
      identityAssertionsFreshlyPassed: true,
      overflowAssertionsFreshlyPassed: true,
      reducedMotionAssertionsFreshlyPassed: true,
      replayAssertionsFreshlyPassed: true,
      courseMapInteractionFreshlyReperformed: true,
      mapDifferentPageFocusPassed: true,
      mapSamePageReselectFocusPassed: false,
      keyTermsInteractionFreshlyReperformed: true,
      fqInteractionFreshlyReperformed: true,
      crossLocalePersistenceFreshlyReperformed: true,
      perPageDirectUrlAvailable: false,
      predecessorClaimsCarriedForward: false,
      currentJavascriptDeepProductQaMachineWorkExhausted: false,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    knownRemediationsRequired: [...KNOWN_REMEDIATIONS_REQUIRED],
    sourceBindings,
    artifacts: artifactBindings(
      wholeMarkdownPath,
      wholeMarkdownBytes,
      collected.rawDeepQaEvidence.artifactBindings,
    ),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The immutable v6 package is the runtime observed; sourceCurrentAtObservation is false because a later G4 v3.1 build added 96 bytes to apps/web/tsconfig.json.",
      "The immutable r1 raw attempt failed before assertion aggregation because of an incorrect Replay storage-key lookup; no r1 claim is carried forward.",
      "The immutable r2 raw attempt remained failed because of Map-focus classification and a navigation-aborted renderer request; no r2 claim is carried forward.",
      "The immutable r3 raw attempt remained failed because of one transient VB004 mobile layout sample and an aborted Spanish Key Terms reference request; no r3 claim is carried forward.",
      "v6 has course-level URLs but no per-page direct URLs; that absent feature is not promoted by deep QA.",
      "Four current-JavaScript UI/accessibility remediations remain required and productQaComplete plus migrationQaComplete remain false.",
      "No original runtime, Flash/Animate comparison, Spanish source-visual parity, audio, RMSE, independent human review, Owner fidelity review, strict validation, deployment, release, or publication was performed or accepted.",
    ],
  };
  validateWholeLessonDeepQaSuccessor(wholeReceipt);
  const wholeJsonBytes = Buffer.from(stableJson(wholeReceipt));

  return {
    fq: {
      jsonPath: fqJsonPath,
      jsonBytes: fqJsonBytes,
      markdownPath: fqMarkdownPath,
      markdownBytes: fqMarkdownBytes,
    },
    whole: {
      jsonPath: wholeJsonPath,
      jsonBytes: wholeJsonBytes,
      markdownPath: wholeMarkdownPath,
      markdownBytes: wholeMarkdownBytes,
    },
  };
}

async function exists(absolutePath) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeCreateExclusiveArtifacts(root, outputs) {
  const entries = [
    [outputs.fq.markdownPath, outputs.fq.markdownBytes],
    [outputs.fq.jsonPath, outputs.fq.jsonBytes],
    [outputs.whole.markdownPath, outputs.whole.markdownBytes],
    [outputs.whole.jsonPath, outputs.whole.jsonBytes],
  ];
  for (const [relativePath] of entries) {
    if (await exists(path.resolve(root, relativePath))) {
      throw new Error(
        `${relativePath} already exists; immutable r5 successors are never overwritten`,
      );
    }
  }
  await mkdir(path.resolve(root, "reports"), {recursive: true});
  for (const [relativePath, bytes] of entries) {
    await writeFile(path.resolve(root, relativePath), bytes, {flag: "wx"});
  }
}

function parseArguments(argv) {
  if (argv.length === 1 && argv[0] === "--write") return;
  throw new Error("Use --write. Outputs are fixed, create-exclusive r5 paths.");
}

async function main() {
  parseArguments(process.argv.slice(2));
  const outputs = await buildDeepQaSuccessorReceipts({root: ROOT});
  await writeCreateExclusiveArtifacts(ROOT, outputs);
  process.stdout.write(stableJson({
    status: "written-create-exclusive",
    packageId: PACKAGE_ID,
    sourceCurrentAtObservation: false,
    fqReceipt: outputs.fq.jsonPath,
    wholeLessonReceipt: outputs.whole.jsonPath,
    productQaComplete: false,
    migrationQaComplete: false,
    strictAcceptanceEffect: "none",
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
