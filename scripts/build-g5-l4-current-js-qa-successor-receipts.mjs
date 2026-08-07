#!/usr/bin/env node

import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {access, mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  FQ_MEMBERS,
  RELEASE_ID,
  bindingFor,
  collectCurrentPackageEvidence,
  sha256,
  stableJson,
  validateFqSuccessorReceipt,
  validateWholeLessonSuccessorReceipt,
} from "./lib/g5-l4-current-js-qa-successor.mjs";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const AUTHORIZATION_PATH =
  "catalog/owner-authorizations/g5-l4-current-js-implementation-authorization-2026-07-29.json";
const FQ_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.json";
const FQ_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-2026-07-30.md";
const WHOLE_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.json";
const WHOLE_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-2026-07-30.md";

const FQ_SOURCE_PATHS = Object.freeze([
  "scripts/build-g5-l4-current-js-qa-successor-receipts.mjs",
  "scripts/lib/g5-l4-current-js-qa-successor.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp.mjs",
  "apps/web/components/descriptor-driven-whole-lesson-player.tsx",
  "apps/web/components/legacy-responsive-lesson-shell.tsx",
  "apps/web/components/animation-runtime.tsx",
  "apps/web/app/globals.css",
  "packages/demos/src/g5-l4-fq23-question-atlas-candidate.tsx",
  "packages/demos/src/timelines/course-g05-l04-fq23-question-sequence.ts",
  "packages/demos/src/timelines/course-g05-l04-fq-002.ts",
  "packages/demos/src/timelines/course-g05-l04-fq-003.ts",
  "apps/web/tests/descriptor-driven-whole-lesson-player.test.ts",
  "packages/demos/tests/course-g05-l04-fq23-question-atlas.test.ts",
]);

const WHOLE_SOURCE_PATHS = Object.freeze([
  ...FQ_SOURCE_PATHS,
  "apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts",
  "apps/web/app/[locale]/courses/[grade]/[lesson]/page.tsx",
  "apps/web/proxy.ts",
  "apps/web/next.config.ts",
  "apps/web/components/legacy-key-terms-browser.tsx",
  "apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json",
  "apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json",
  "catalog/lesson-releases.json",
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  productQaComplete: false,
  authoritativeOriginalRuntime: false,
  naturalNavigationCausalityEstablished: false,
  spanishSourceVisualParityEstablished: false,
  audioAccepted: false,
  fullFrameRmseAccepted: false,
  independentHumanVisualReviewAccepted: false,
  ownerFidelityAccepted: false,
  strictComplete: false,
  externalDeploymentAuthorized: false,
  publicReleaseAuthorized: false,
  published: false,
});

function parseArguments(argv) {
  const result = {mode: null, smokePath: null, date: null, revision: 1};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--write" || argument === "--check") {
      assert.equal(result.mode, null, "choose exactly one mode");
      result.mode = argument.slice(2);
    } else if (argument === "--smoke") {
      result.smokePath = argv[++index];
    } else if (argument === "--date") {
      result.date = argv[++index];
    } else if (argument === "--revision") {
      result.revision = Number.parseInt(argv[++index], 10);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  assert.ok(result.mode, "use --write or --check");
  assert.match(result.smokePath ?? "", /^reports\/[A-Za-z0-9._/-]+\.json$/);
  assert.match(result.date ?? "", /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(Number.isSafeInteger(result.revision), true);
  assert.equal(result.revision >= 1, true);
  return result;
}

function bindingFromBytes(relativePath, bytes, extras = {}) {
  return {
    path: relativePath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...extras,
  };
}

async function bindingsFor(root, paths) {
  const bindings = [];
  for (const relativePath of paths) {
    bindings.push(await bindingFor(root, relativePath));
  }
  return bindings;
}

function parseNodeTestSummary(output, command) {
  const normalized = output.replace(/\u001b\[[0-9;]*m/g, "");
  const readCount = (label) => {
    const match = normalized.match(new RegExp(`(?:^|\\n)[^\\n]*${label}\\s+(\\d+)`));
    if (!match) throw new Error(`${command}: missing ${label} summary`);
    return Number.parseInt(match[1], 10);
  };
  return {
    tests: readCount("tests"),
    passed: readCount("pass"),
    failed: readCount("fail"),
  };
}

function runFocusedTest(root, {command, args, expectedPass}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: {...process.env, NO_COLOR: "1"},
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${output}`);
  }
  const summary = parseNodeTestSummary(output, `${command} ${args.join(" ")}`);
  assert.deepEqual(summary, {
    tests: expectedPass,
    passed: expectedPass,
    failed: 0,
  });
  return {
    command: `${command} ${args.join(" ")}`,
    passed: summary.passed,
    failed: summary.failed,
    evidenceClass: "same-generator-process-focused-unit-test",
  };
}

function runFocusedTests(root) {
  return [
    runFocusedTest(root, {
      command: "npm",
      args: [
        "--workspace", "packages/demos", "exec", "--", "tsx", "--test",
        "tests/course-g05-l04-fq23-question-atlas.test.ts",
      ],
      expectedPass: 10,
    }),
    runFocusedTest(root, {
      command: "npm",
      args: [
        "--workspace", "apps/web", "exec", "--", "tsx", "--test",
        "tests/descriptor-driven-whole-lesson-player.test.ts",
      ],
      expectedPass: 2,
    }),
  ];
}

function fqMarkdown({receiptId, packageId, smokePath, date}) {
  return `# G5 L4 FQ002/FQ003 current-JavaScript QA successor\n\n` +
    `Receipt: \`${receiptId}\`  \n` +
    `Evidence assembled: **${date}**\n\n` +
    `## Fresh result\n\n` +
    `A fresh-unzipped \`${packageId}\` package smoke traversed all 54 English ` +
    `and 54 Spanish page candidates. On FQ002 and FQ003 it selected and ` +
    `submitted an answer, advanced from Question 1 to Question 2, and used ` +
    `Replay to return to Question 1. The bound smoke report is \`${smokePath}\`.\n\n` +
    `Focused deterministic tests passed 10/10 for the FQ model/renderer and ` +
    `2/2 for the lesson-player contract.\n\n` +
    `## Predecessor boundary\n\n` +
    `The 2026-07-30 receipt is retained as dated predecessor evidence. Its ` +
    `full-score, review, and detailed browser observations are **not carried ` +
    `forward** as fresh observations by this successor.\n\n` +
    `## Evidence boundary\n\n` +
    `This is current-JavaScript private-preview evidence only. It is not ` +
    `authoritative original-runtime evidence, a Flash/Animate comparison, ` +
    `Spanish source-visual parity, audio acceptance, full-frame RMSE, ` +
    `independent human review, Owner fidelity acceptance, strict completion, ` +
    `deployment authority, public-release authority, or publication. ` +
    `\`productQaComplete\` remains false.\n`;
}

function wholeMarkdown({receiptId, packageId, smokePath, date}) {
  return `# G5 L4 current-JavaScript whole-lesson QA successor\n\n` +
    `Receipt: \`${receiptId}\`  \n` +
    `Evidence assembled: **${date}**\n\n` +
    `## Fresh result\n\n` +
    `The fresh-unzipped \`${packageId}\` smoke bound at \`${smokePath}\` ` +
    `loaded **54/54 English** and **54/54 Spanish** current-JavaScript pages, ` +
    `verified 761 English-index and 753 Spanish-index combined glossary ` +
    `entries, exercised the bounded FQ002/FQ003 submit-and-Replay flow, and ` +
    `found no console errors, page errors, failed requests, bad HTTP ` +
    `responses, or external requests. The 390 px Spanish viewport had no ` +
    `horizontal overflow.\n\n` +
    `## Deliberately unclaimed\n\n` +
    `This smoke did not freshly reperform the predecessor receipt's exact ` +
    `release-order comparison, course-map interaction, Key Terms ` +
    `Escape/focus-return interaction, or exhaustive score/review flows. Those ` +
    `dated claims are not carried forward.\n\n` +
    `## Evidence boundary\n\n` +
    `This successor is acceptance-neutral current-JavaScript private-preview ` +
    `evidence. It does not establish original-runtime behavior, Flash/Animate ` +
    `fidelity, Spanish source-visual parity, audio acceptance, full-frame ` +
    `RMSE, independent human review, Owner fidelity acceptance, strict ` +
    `completion, deployment authority, public-release authority, or ` +
    `publication. G5 L4 remains strict **0/55** and unpublished.\n`;
}

export async function buildSuccessorReceipts({
  root = ROOT,
  smokePath,
  date,
  revision = 1,
}) {
  const collected = await collectCurrentPackageEvidence({root, smokePath});
  const focusedTests = runFocusedTests(root);
  const authorizationBinding = await bindingFor(root, AUTHORIZATION_PATH, {
    strictAcceptanceEffect: "none",
  });
  const authorization = JSON.parse(
    await readFile(path.resolve(root, AUTHORIZATION_PATH), "utf8"),
  );
  assert.equal(authorization.authorization.currentJsProductQaAuthorized, true);
  assert.equal(
    authorization.authorization.privateControlledCeoPreviewPreparationAuthorized,
    true,
  );
  assert.equal(authorization.authorization.externalDeploymentAuthorized, false);
  assert.equal(authorization.authorization.publicReleaseAuthorized, false);
  assert.equal(authorization.authorization.strictCompletionEstablished, false);
  assert.equal(authorization.authorization.publicationAuthorized, false);

  assert.equal(Number.isSafeInteger(revision) && revision >= 1, true);
  const revisionSuffix = revision === 1 ? "" : `-r${revision}`;
  const fqReceiptId =
    `g5-l4-current-js-fq23-companion-qa-successor-${date}${revisionSuffix}`;
  const fqJsonPath = `reports/${fqReceiptId}.json`;
  const fqMarkdownPath = `reports/${fqReceiptId}.md`;
  const fqMarkdownBytes = Buffer.from(fqMarkdown({
    receiptId: fqReceiptId,
    packageId: collected.smoke.packageId,
    smokePath,
    date,
  }));
  const fqPredecessor = {
    receipt: await bindingFor(root, FQ_PREDECESSOR_PATH),
    markdown: await bindingFor(root, FQ_PREDECESSOR_MARKDOWN_PATH),
    currentAuthority: false,
    claimsCarriedForward: false,
  };
  const fqArtifacts = [
    bindingFromBytes(fqMarkdownPath, fqMarkdownBytes, {
      role: "human-readable-successor-boundary",
    }),
    ...collected.screenshots.map((binding) => ({
      ...binding,
      role: "fresh-unzip-current-javascript-browser-observation",
    })),
  ];
  const fqReceipt = {
    schemaVersion: 2,
    evidenceType:
      "g5-l4-current-js-fq23-companion-fresh-package-qa-successor-receipt",
    receiptId: fqReceiptId,
    releaseId: RELEASE_ID,
    evidenceAssembledOn: date,
    authority:
      "Acceptance-neutral current-JavaScript fresh-package QA for the private controlled CEO preview only. No original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: collected.smoke.packageId,
      members: FQ_MEMBERS,
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    authorizationBinding,
    packageEvidence: collected.evidence,
    predecessorEvidence: fqPredecessor,
    freshBrowserObservations: {
      fqFlows: collected.smoke.fqFlows,
      consoleErrorCount: collected.smoke.consoleErrors.length,
      pageErrorCount: collected.smoke.pageErrors.length,
      failedRequestCount: collected.smoke.failedRequests.length,
      badHttpResponseCount: collected.smoke.badHttpResponses.length,
      externalRequestCount: collected.smoke.externalRequests.length,
    },
    focusedTests,
    scopeResult: {
      currentJavascriptFq23FreshPackageQaPassed: true,
      answerSelectionSubmitAndReplayResetPassed: true,
      focusedDeterministicTestsPassed: true,
      fullScoreAndReviewFlowFreshlyReperformed: false,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
    },
    sourceBindings: await bindingsFor(root, FQ_SOURCE_PATHS),
    artifacts: fqArtifacts,
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The fresh browser smoke advances one submitted answer per FQ member and resets with Replay; it does not freshly traverse every question, score, or review state.",
      "The 2026-07-30 detailed browser receipt is retained only as dated predecessor evidence and none of its claims are promoted as current by this successor.",
      "No original runtime, Flash/Animate comparison, Spanish source-visual parity, audio, RMSE, independent human review, Owner fidelity review, strict validation, deployment, release, or publication was performed or accepted.",
    ],
  };
  validateFqSuccessorReceipt(fqReceipt);
  const fqJsonBytes = Buffer.from(stableJson(fqReceipt));

  const wholeReceiptId =
    `g5-l4-current-js-whole-lesson-product-qa-successor-${date}${revisionSuffix}`;
  const wholeJsonPath = `reports/${wholeReceiptId}.json`;
  const wholeMarkdownPath = `reports/${wholeReceiptId}.md`;
  const wholeMarkdownBytes = Buffer.from(wholeMarkdown({
    receiptId: wholeReceiptId,
    packageId: collected.smoke.packageId,
    smokePath,
    date,
  }));
  const wholePredecessor = {
    receipt: await bindingFor(root, WHOLE_PREDECESSOR_PATH),
    markdown: await bindingFor(root, WHOLE_PREDECESSOR_MARKDOWN_PATH),
    currentAuthority: false,
    claimsCarriedForward: false,
  };
  const wholeReceipt = {
    schemaVersion: 2,
    evidenceType:
      "g5-l4-current-js-whole-lesson-fresh-package-qa-successor-receipt",
    receiptId: wholeReceiptId,
    releaseId: RELEASE_ID,
    evidenceAssembledOn: date,
    authority:
      "Acceptance-neutral current-JavaScript fresh-package QA for the loopback-only controlled CEO preview. No original-runtime, fidelity, human, Owner, strict, release, deployment, or publication authority.",
    scope: {
      networkBoundary: "loopback-only-local-preview",
      previewClass: "private-controlled-ceo-preview",
      packageId: collected.smoke.packageId,
      releaseMembers: 55,
      activePages: 54,
      courseShells: 1,
      g4L3Port3216Touched: false,
      externalDeploymentPerformed: false,
    },
    authorizationBinding,
    packageEvidence: collected.evidence,
    predecessorEvidence: wholePredecessor,
    childReceipts: [bindingFromBytes(fqJsonPath, fqJsonBytes, {
      role: "fresh-package-fq23-current-javascript-successor",
    })],
    freshBrowserObservations: {
      englishPagesReady: collected.smoke.englishPagesReady,
      spanishPagesReady: collected.smoke.spanishPagesReady,
      reducedMotionContextApplied: true,
      glossaryCounts: collected.smoke.glossaryCounts,
      fqFlows: collected.smoke.fqFlows,
      spanishMobile: collected.smoke.spanishMobile,
      consoleErrorCount: collected.smoke.consoleErrors.length,
      pageErrorCount: collected.smoke.pageErrors.length,
      failedRequestCount: collected.smoke.failedRequests.length,
      badHttpResponseCount: collected.smoke.badHttpResponses.length,
      externalRequestCount: collected.smoke.externalRequests.length,
      packagePrivacyScanPassed: collected.smoke.privacyScan.status === "pass",
    },
    focusedTests,
    scopeResult: {
      currentJavascriptFreshPackageWholeLessonQaPassed: true,
      englishAndSpanish54PageReadinessPassed: true,
      fqSubmitAndReplaySmokePassed: true,
      combinedGlossaryCountPassed: true,
      spanishMobileNoHorizontalOverflowPassed: true,
      consolePageNetworkBoundaryPassed: true,
      packagePrivacyScanPassed: true,
      exactReleaseOrderFreshlyEstablished: false,
      courseMapInteractionFreshlyReperformed: false,
      keyTermsEscapeFocusFreshlyReperformed: false,
      predecessorClaimsCarriedForward: false,
      productQaComplete: false,
    },
    sourceBindings: await bindingsFor(root, WHOLE_SOURCE_PATHS),
    artifacts: [
      bindingFromBytes(wholeMarkdownPath, wholeMarkdownBytes, {
        role: "human-readable-successor-boundary",
      }),
      ...collected.screenshots.map((binding) => ({
        ...binding,
        role: "fresh-unzip-current-javascript-browser-observation",
      })),
    ],
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    limitations: [
      "The fresh smoke proves 54 ready unique picker options per locale but does not independently compare the option order with the canonical release declaration.",
      "Course-map interaction, Key Terms Escape/focus return, and exhaustive FQ score/review flows were not freshly reperformed and predecessor claims are not carried forward.",
      "Spanish page renderers remain fixed-English source visuals; shell localization and glossary data do not establish Spanish source-visual parity.",
      "No original runtime, Flash/Animate comparison, audio, RMSE, independent human review, Owner fidelity review, strict validation, deployment, release, or publication was performed or accepted.",
    ],
  };
  validateWholeLessonSuccessorReceipt(wholeReceipt);
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

async function writeNewArtifacts(root, outputs) {
  const entries = [
    [outputs.fq.markdownPath, outputs.fq.markdownBytes],
    [outputs.fq.jsonPath, outputs.fq.jsonBytes],
    [outputs.whole.markdownPath, outputs.whole.markdownBytes],
    [outputs.whole.jsonPath, outputs.whole.jsonBytes],
  ];
  for (const [relativePath] of entries) {
    if (await exists(path.resolve(root, relativePath))) {
      throw new Error(
        `${relativePath} already exists; immutable successors are never overwritten`,
      );
    }
  }
  await mkdir(path.resolve(root, "reports"), {recursive: true});
  for (const [relativePath, bytes] of entries) {
    await writeFile(path.resolve(root, relativePath), bytes, {flag: "wx"});
  }
}

async function checkArtifacts(root, outputs) {
  for (const item of [outputs.fq, outputs.whole]) {
    for (const [relativePath, expected] of [
      [item.markdownPath, item.markdownBytes],
      [item.jsonPath, item.jsonBytes],
    ]) {
      const actual = await readFile(path.resolve(root, relativePath));
      assert.equal(actual.equals(expected), true, `${relativePath}: drift`);
    }
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const outputs = await buildSuccessorReceipts({
    root: ROOT,
    smokePath: options.smokePath,
    date: options.date,
    revision: options.revision,
  });
  if (options.mode === "write") await writeNewArtifacts(ROOT, outputs);
  else await checkArtifacts(ROOT, outputs);
  process.stdout.write(`${stableJson({
    status: options.mode === "write" ? "written" : "current",
    packageSmoke: options.smokePath,
    fqReceipt: outputs.fq.jsonPath,
    wholeLessonReceipt: outputs.whole.jsonPath,
    authority: "current-javascript-private-preview-only",
    strictAcceptanceEffect: "none",
  })}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
