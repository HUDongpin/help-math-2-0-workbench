#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  rm,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS,
  AUTHORITY_BOUNDARY,
  FQ_MARKDOWN_PATH,
  FQ_MEMBERS,
  FQ_PREDECESSOR_MARKDOWN_PATH,
  FQ_PREDECESSOR_PATH,
  FQ_RECEIPT_ID,
  FQ_RECEIPT_PATH,
  PACKAGE_ID,
  RAW_REPORT_PATH,
  RELEASE_ID,
  RESOLVED_REMEDIATIONS,
  WHOLE_MARKDOWN_PATH,
  WHOLE_PREDECESSOR_MARKDOWN_PATH,
  WHOLE_PREDECESSOR_PATH,
  WHOLE_RECEIPT_ID,
  WHOLE_RECEIPT_PATH,
  bindingFor,
  collectV7DeepQaEvidence,
  freshV7ResolutionFromRaw,
  sha256,
  stableJson,
  validateFqDeepQaSuccessorV7,
  validateWholeLessonDeepQaSuccessorV7,
} from "./lib/g5-l4-current-js-deep-qa-successor-v7.mjs";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SCRIPT_PATH = fileURLToPath(import.meta.url);

const AUTHORIZATION_PATH =
  "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json";

export const SOURCE_PATHS = Object.freeze([
  "scripts/lib/g5-l4-current-js-deep-qa-successor-v7.mjs",
  "scripts/build-g5-l4-current-js-deep-qa-successors-v7.mjs",
  "scripts/check-g5-l4-current-js-deep-qa-successors-v7.mjs",
  "scripts/g5-l4-current-js-deep-qa-successor-v7.test.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp-v7.mjs",
  "scripts/qa-g5-l4-v7-deep-product.mjs",
  "scripts/qa-g5-l4-v7-deep-product.test.mjs",
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
  const bindings = [];
  for (const relativePath of relativePaths) {
    bindings.push(await bindingFor(root, relativePath));
  }
  return bindings;
}

function allBooleanValuesFalse(record) {
  return record && Object.keys(record).length > 0 &&
    Object.values(record).every((value) =>
      typeof value === "boolean" && value === false
    );
}

async function predecessorFor(root, {receiptPath, markdownPath, receiptId}) {
  const receipt = await bindingFor(root, receiptPath);
  const markdown = await bindingFor(root, markdownPath);
  const predecessor = JSON.parse(
    await readFile(path.resolve(root, receiptPath), "utf8"),
  );
  assert.equal(predecessor.receiptId, receiptId);
  assert.equal(predecessor.releaseId, RELEASE_ID);
  assert.equal(
    predecessor.status,
    "observed-current-javascript-deep-qa-remediations-required",
  );
  assert.equal(allBooleanValuesFalse(predecessor.acceptanceEffects), true);
  assert.equal(predecessor.packageEvidence?.sourceCurrentAtObservation, false);
  if (receiptId.includes("whole-lesson-product")) {
    assert.equal(predecessor.scopeResult?.mapSamePageReselectFocusPassed, false);
  } else {
    assert.equal(
      predecessor.knownRemediationsRequired?.some((finding) =>
        `${finding}`.toLowerCase().includes("map") &&
        `${finding}`.toLowerCase().includes("focus")
      ),
      true,
    );
  }
  assert.equal(predecessor.scopeResult?.productQaComplete, false);
  assert.equal(predecessor.scopeResult?.migrationQaComplete, false);
  return {
    receipt,
    markdown,
    immediatePredecessor: true,
    currentAuthority: false,
    claimsCarriedForward: false,
    supersededByFreshV7RawR1: true,
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

function resolutionsMarkdown() {
  return RESOLVED_REMEDIATIONS.map(({id, predecessorFinding}) =>
    `- \`${id}\`: fresh v7 resolved — ${predecessorFinding}`
  ).join("\n");
}

function fqMarkdown() {
  return `# G5 L4 FQ002/FQ003 current-JavaScript deep-QA successor r6

Receipt: \`${FQ_RECEIPT_ID}\`  
Evidence assembled: **2026-08-01**

## Fresh v7 result

The fixed raw input \`${RAW_REPORT_PATH}\` is the passing v7 r2 fresh-unzip successor run. It freshly established current source-snapshot equality, exact 54-page release order, FQ002/FQ003 traversal, scoring/review flow, Replay behavior, and the bounded current-JavaScript product matrix.

The r5 receipt is bound only as the immediate predecessor. Its observations and four unresolved findings are not carried forward as current evidence.

## Four predecessor findings

${resolutionsMarkdown()}

The fourth result includes four fresh support contexts in which same-current-page Course Map reselection focused the page H1. Different-page focus also passed.

## Evidence boundary

This r6 is acceptance-neutral current-JavaScript machine product QA. \`acceptanceNeutral=true\` and \`strictAcceptanceEffect=none\` are recorded outside \`acceptanceEffects\`; every value inside \`acceptanceEffects\` remains boolean \`false\`. It does not establish original-runtime behavior, Flash/Animate fidelity, Spanish source-visual parity, audio or RMSE acceptance, independent human or Owner acceptance, strict completion, external deployment, release, or publication.
`;
}

function wholeMarkdown() {
  return `# G5 L4 current-JavaScript whole-lesson deep-QA successor r6

Receipt: \`${WHOLE_RECEIPT_ID}\`  
Evidence assembled: **2026-08-01**

## Fresh v7 result

The fixed raw input \`${RAW_REPORT_PATH}\` freshly passed from the hash-bound v7 ZIP with a current source snapshot: **648/648 layout**, **648/648 identity**, **648/648 overflow**, **108/108 reduced-motion observations**, **324/324 reduced-motion samples**, and **324/324 Replay mouse/Enter/Space activations**. Course Map, Key Terms, FQ flows, cross-locale persistence, and all four v7 remediation checks passed.

Same-current-page and different-page Course Map selection focused the page H1 in all four fresh support contexts. The r5 predecessor is retained as history only and contributes no current claim.

## Four predecessor findings

${resolutionsMarkdown()}

## Evidence boundary

The bounded current-JavaScript deep-product machine work is exhausted for this v7 raw run, but \`productQaComplete=false\`, \`migrationQaComplete=false\`, strict completion remains **0/55**, and the lesson remains unpublished. All acceptance-effect values remain boolean \`false\`; acceptance neutrality and strict effect \`none\` remain separate authority-boundary fields. No original-runtime, fidelity, audio, RMSE, human, Owner, deployment, release, or publication gate changes.
`;
}

function artifactBindings(kind, markdownPath, markdownBytes, rawArtifacts) {
  return [
    bindingFromBytes(markdownPath, markdownBytes, {
      role: kind === "fq23-companion"
        ? "human-readable-r6-fq23-companion-deep-qa-successor-boundary"
        : "human-readable-r6-whole-lesson-product-deep-qa-successor-boundary",
    }),
    ...rawArtifacts.map((binding) => ({
      ...binding,
      role: "bound-raw-v7-r1-deep-qa-browser-artifact",
    })),
  ];
}

function commonScopeResult() {
  return {
    deepQaFreshlyPerformed: true,
    currentJavascriptDeepProductQaMachineWorkExhausted: true,
    sourceSnapshotCurrent: true,
    allFourPredecessorFindingsFreshV7Resolved: true,
    mapSamePageReselectFocusPassed: true,
    productQaComplete: false,
    migrationQaComplete: false,
    strictComplete: false,
    published: false,
  };
}

export async function buildDeepQaSuccessorReceiptsV7({root = ROOT} = {}) {
  const collected = await collectV7DeepQaEvidence({root});
  const authorizationBinding = await authorizationFor(root);
  const sourceBindings = await bindingsFor(root, SOURCE_PATHS);
  const fqPredecessor = await predecessorFor(root, {
    receiptPath: FQ_PREDECESSOR_PATH,
    markdownPath: FQ_PREDECESSOR_MARKDOWN_PATH,
    receiptId:
      "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5",
  });
  const wholePredecessor = await predecessorFor(root, {
    receiptPath: WHOLE_PREDECESSOR_PATH,
    markdownPath: WHOLE_PREDECESSOR_MARKDOWN_PATH,
    receiptId:
      "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5",
  });
  const resolvedRemediations = freshV7ResolutionFromRaw(collected.raw);

  const fqMarkdownBytes = Buffer.from(fqMarkdown());
  const fqReceipt = {
    schemaVersion: 4,
    evidenceType:
      "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt",
    receiptId: FQ_RECEIPT_ID,
    releaseId: RELEASE_ID,
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    evidenceAssembledOn: "2026-08-01",
    authority:
      "Acceptance-neutral current-JavaScript v7 fresh-unzip deep QA only; no original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    authorityBoundary: {...AUTHORITY_BOUNDARY},
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
    resolvedRemediations,
    scopeResult: {
      ...commonScopeResult(),
      currentJavascriptFq23DeepQaFreshlyPerformed: true,
      exactReleaseOrderFreshlyEstablished: true,
      fqInteractionFreshlyReperformed: true,
      fullScoreAndReviewFlowFreshlyReperformed: true,
      predecessorClaimsCarriedForward: false,
    },
    sourceBindings,
    artifacts: artifactBindings(
      "fq23-companion",
      FQ_MARKDOWN_PATH,
      fqMarkdownBytes,
      collected.rawDeepQaEvidence.artifactBindings,
    ),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The passing subject is the hash-bound immutable v7 fresh-unzip runtime; current workspace source was not served directly.",
      "The four r5 findings are resolved only for the fresh v7 current-JavaScript machine observations and do not establish Flash/source fidelity.",
      "VB004 Spanish localization is app-owned UI while the source-runtime language remains English; Spanish source-visual parity remains unestablished.",
      "v7 retains its explicit absent per-page direct-URL boundary.",
      "No original-runtime, audio, RMSE, independent human, Owner, strict, deployment, release, or publication acceptance is promoted.",
    ],
  };
  validateFqDeepQaSuccessorV7(fqReceipt);
  const fqJsonBytes = Buffer.from(stableJson(fqReceipt));

  const wholeMarkdownBytes = Buffer.from(wholeMarkdown());
  const wholeReceipt = {
    schemaVersion: 4,
    evidenceType:
      "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
    receiptId: WHOLE_RECEIPT_ID,
    releaseId: RELEASE_ID,
    packageId: PACKAGE_ID,
    status: "pass-current-javascript-deep-product-qa",
    evidenceAssembledOn: "2026-08-01",
    authority:
      "Acceptance-neutral current-JavaScript v7 fresh-unzip deep product QA for the loopback-only controlled preview; no original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    authorityBoundary: {...AUTHORITY_BOUNDARY},
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
    childReceipts: [bindingFromBytes(FQ_RECEIPT_PATH, fqJsonBytes, {
      role: "r6-fq23-deep-qa-successor",
    })],
    rawDeepQaEvidence: collected.rawDeepQaEvidence,
    resolvedRemediations,
    scopeResult: {
      ...commonScopeResult(),
      exactReleaseOrderFreshlyEstablished: true,
      layoutAssertionsFreshlyPassed: true,
      identityAssertionsFreshlyPassed: true,
      overflowAssertionsFreshlyPassed: true,
      reducedMotionAssertionsFreshlyPassed: true,
      replayAssertionsFreshlyPassed: true,
      courseMapInteractionFreshlyReperformed: true,
      mapDifferentPageFocusPassed: true,
      keyTermsInteractionFreshlyReperformed: true,
      fqInteractionFreshlyReperformed: true,
      crossLocalePersistenceFreshlyReperformed: true,
      perPageDirectUrlAvailable: false,
      predecessorClaimsCarriedForward: false,
    },
    sourceBindings,
    artifacts: artifactBindings(
      "whole-lesson-product",
      WHOLE_MARKDOWN_PATH,
      wholeMarkdownBytes,
      collected.rawDeepQaEvidence.artifactBindings,
    ),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The passing subject is the hash-bound immutable v7 fresh-unzip runtime, with package and current source snapshots equal throughout raw QA and at r6 assembly.",
      "The r5 predecessor remains a non-authoritative historical binding; no predecessor claim is carried forward.",
      "The four predecessor findings are freshly resolved only within current-JavaScript v7 product QA.",
      "v7 has course-level URLs but no per-page direct URLs; that absent feature is not promoted.",
      "No original-runtime, Flash/Animate fidelity, Spanish source-visual parity, audio, RMSE, independent human, Owner, strict, deployment, release, or publication acceptance is established.",
    ],
  };
  validateWholeLessonDeepQaSuccessorV7(wholeReceipt);
  const wholeJsonBytes = Buffer.from(stableJson(wholeReceipt));

  return {
    fq: {
      jsonPath: FQ_RECEIPT_PATH,
      jsonBytes: fqJsonBytes,
      markdownPath: FQ_MARKDOWN_PATH,
      markdownBytes: fqMarkdownBytes,
    },
    whole: {
      jsonPath: WHOLE_RECEIPT_PATH,
      jsonBytes: wholeJsonBytes,
      markdownPath: WHOLE_MARKDOWN_PATH,
      markdownBytes: wholeMarkdownBytes,
    },
  };
}

async function exists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function outputEntries(outputs) {
  const entries = [
    {
      kind: "fq23-companion",
      type: "markdown",
      relativePath: outputs.fq.markdownPath,
      expectedPath: FQ_MARKDOWN_PATH,
      bytes: outputs.fq.markdownBytes,
    },
    {
      kind: "fq23-companion",
      type: "json",
      relativePath: outputs.fq.jsonPath,
      expectedPath: FQ_RECEIPT_PATH,
      bytes: outputs.fq.jsonBytes,
    },
    {
      kind: "whole-lesson-product",
      type: "markdown",
      relativePath: outputs.whole.markdownPath,
      expectedPath: WHOLE_MARKDOWN_PATH,
      bytes: outputs.whole.markdownBytes,
    },
    {
      kind: "whole-lesson-product",
      type: "json",
      relativePath: outputs.whole.jsonPath,
      expectedPath: WHOLE_RECEIPT_PATH,
      bytes: outputs.whole.jsonBytes,
    },
  ];
  for (const entry of entries) {
    assert.equal(entry.relativePath, entry.expectedPath);
    assert.equal(Buffer.isBuffer(entry.bytes), true);
    assert.equal(entry.bytes.length > 0, true);
  }
  const fqReceipt = JSON.parse(outputs.fq.jsonBytes.toString("utf8"));
  const wholeReceipt = JSON.parse(outputs.whole.jsonBytes.toString("utf8"));
  validateFqDeepQaSuccessorV7(fqReceipt);
  validateWholeLessonDeepQaSuccessorV7(wholeReceipt);
  for (const [kind, receipt, markdownPath, markdownBytes] of [
    ["fq23-companion", fqReceipt, FQ_MARKDOWN_PATH, outputs.fq.markdownBytes],
    [
      "whole-lesson-product",
      wholeReceipt,
      WHOLE_MARKDOWN_PATH,
      outputs.whole.markdownBytes,
    ],
  ]) {
    const matches = receipt.artifacts.filter(({path: artifactPath}) =>
      artifactPath === markdownPath
    );
    assert.equal(matches.length, 1, `${kind}: Markdown binding count`);
    assert.equal(matches[0].bytes, markdownBytes.length, `${kind}: Markdown bytes`);
    assert.equal(matches[0].sha256, sha256(markdownBytes), `${kind}: Markdown hash`);
  }
  return entries;
}

async function writeSyncedExclusive(absolutePath, bytes) {
  let handle = null;
  try {
    handle = await open(absolutePath, "wx", 0o444);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
  } catch (error) {
    if (handle) {
      try {
        await handle.close();
      } catch {}
    }
    try {
      await unlink(absolutePath);
    } catch (unlinkError) {
      if (unlinkError?.code !== "ENOENT") {
        throw new AggregateError(
          [error, unlinkError],
          `${absolutePath}: exclusive write and cleanup both failed`,
        );
      }
    }
    throw error;
  }
}

export async function writeCreateExclusiveArtifactsV7(
  root,
  outputs,
  {publishFailureAt = null} = {},
) {
  const workspaceRoot = path.resolve(root);
  const entries = outputEntries(outputs);
  assert.equal(
    publishFailureAt === null ||
      (Number.isSafeInteger(publishFailureAt) &&
        publishFailureAt >= 1 && publishFailureAt <= entries.length),
    true,
  );
  for (const {relativePath} of entries) {
    if (await exists(path.resolve(workspaceRoot, relativePath))) {
      throw new Error(
        `${relativePath} already exists; immutable r6 successors are never overwritten`,
      );
    }
  }
  const stageRoot = await mkdtemp(
    path.join(workspaceRoot, ".g5-l4-r6-successor-stage-"),
  );
  assert.equal(path.dirname(stageRoot), workspaceRoot);
  assert.equal(
    path.basename(stageRoot).startsWith(".g5-l4-r6-successor-stage-"),
    true,
  );
  const staged = [];
  const created = [];
  const reportsRoot = path.resolve(workspaceRoot, "reports");
  let reportsRootCreated = false;
  try {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const stagedPath = path.join(
        stageRoot,
        `${String(index + 1).padStart(2, "0")}-${path.basename(entry.relativePath)}`,
      );
      await writeSyncedExclusive(stagedPath, entry.bytes);
      const verified = await readFile(stagedPath);
      assert.equal(verified.equals(entry.bytes), true, `${entry.relativePath}: staged drift`);
      staged.push({...entry, stagedPath});
    }
    for (const {relativePath} of entries) {
      if (await exists(path.resolve(workspaceRoot, relativePath))) {
        throw new Error(
          `${relativePath} appeared before create-exclusive publication`,
        );
      }
    }
    if (!(await exists(reportsRoot))) {
      await mkdir(reportsRoot, {recursive: false});
      reportsRootCreated = true;
    }
    for (let index = 0; index < staged.length; index += 1) {
      const entry = staged[index];
      if (publishFailureAt === index + 1) {
        throw new Error(`Injected r6 publication failure at step ${index + 1}`);
      }
      const target = path.resolve(workspaceRoot, entry.relativePath);
      await writeSyncedExclusive(target, await readFile(entry.stagedPath));
      created.push(target);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const target of created.reverse()) {
      try {
        await unlink(target);
      } catch (unlinkError) {
        if (unlinkError?.code !== "ENOENT") rollbackErrors.push(unlinkError);
      }
    }
    if (reportsRootCreated) {
      try {
        await rmdir(reportsRoot);
      } catch (removeError) {
        if (!["ENOENT", "ENOTEMPTY"].includes(removeError?.code)) {
          rollbackErrors.push(removeError);
        }
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "r6 publication failed and rollback was incomplete",
      );
    }
    throw error;
  } finally {
    await rm(stageRoot, {recursive: true, force: true});
  }
}

export function parseArguments(argv) {
  if (argv.length === 1 && argv[0] === "--write") return "write";
  throw new Error("Use --write. Outputs are fixed, create-exclusive r6 paths.");
}

async function main() {
  parseArguments(process.argv.slice(2));
  const outputs = await buildDeepQaSuccessorReceiptsV7({root: ROOT});
  await writeCreateExclusiveArtifactsV7(ROOT, outputs);
  process.stdout.write(stableJson({
    status: "written-create-exclusive",
    packageId: PACKAGE_ID,
    rawInput: RAW_REPORT_PATH,
    sourceCurrentAtObservation: true,
    sourceCurrentAtSuccessorAssembly: true,
    allFourPredecessorFindingsFreshV7Resolved: true,
    mapSamePageReselectFocusPassed: true,
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
