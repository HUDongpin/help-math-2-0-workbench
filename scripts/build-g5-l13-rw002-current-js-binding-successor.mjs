#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const RW002_BINDING_SUCCESSOR = Object.freeze({
  jsonPath:
    "migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-01-r1.json",
  markdownPath:
    "migrations/course-g05-l13-rw-002/evidence/current-javascript-shared-runtime-binding-successor-2026-08-01-r1.md",
  predecessor: Object.freeze({
    file:
      "migrations/course-g05-l13-rw-002/evidence/source-routed-spanish-audio-product-qa.json",
    bytes: 10695,
    sha256:
      "36bde91455ac750990e50ee18ae42c2d13be24c84ee58f3284034eba09628652",
  }),
});

export const EXPECTED_RW002_BINDING_DRIFT = Object.freeze({
  productRuntime: Object.freeze({
    file: "apps/web/components/animation-runtime.tsx",
    cause:
      "authorized-g5-l4-current-js-ui-language-separation-static-wiring",
  }),
  runtimeContract: Object.freeze({
    file: "packages/demos/src/contract.ts",
    cause:
      "authorized-g5-l4-current-js-ui-language-separation-contract",
  }),
  runtimeHelpers: Object.freeze({
    file: "packages/demos/src/runtime.ts",
    cause: "causal-attribution-not-established-by-this-successor",
  }),
  productQaContractTest: Object.freeze({
    file: "packages/demos/tests/course-g05-l13-rw-002.test.ts",
    cause: "rw002-predecessor-and-successor-validation-update",
  }),
});

const ACCEPTANCE_EFFECTS = Object.freeze({
  audioAcceptance: false,
  originalRuntimeEvidence: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  publication: false,
});

const CLAIMS = Object.freeze({
  currentBrowserQa: false,
  authoritativeOriginalRuntimeBaseline: false,
  naturalOriginalRuntimeTraversal: false,
  interactionBranchParity: false,
  bilingualVisualParity: false,
  audioParity: false,
  audioListeningAcceptance: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  engineeringAcceptance: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
  publication: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertSafeRelative(relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0"),
    `${label} must be a safe project-relative path`,
  );
  invariant(
    relativePath
      .split("/")
      .every((segment) => segment.length > 0 && segment !== "." && segment !== ".."),
    `${label} contains an unsafe path segment`,
  );
}

async function readRegularFile(root, relativePath) {
  assertSafeRelative(relativePath, relativePath);
  const absolutePath = path.join(root, ...relativePath.split("/"));
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected a regular non-symlink file`,
  );
  const bytes = await readFile(absolutePath);
  return {
    file: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    content: bytes,
  };
}

function validatePredecessorReceipt(receipt) {
  invariant(isPlainObject(receipt), "RW002 predecessor receipt must be an object");
  invariant(receipt.schemaVersion === 2, "RW002 predecessor schema changed");
  invariant(
    receipt.artifactType ===
      "source-routed-host-audio-withheld-source-shared-visual-machine-product-qa",
    "RW002 predecessor artifact type changed",
  );
  invariant(
    receipt.status ===
      "machine-product-source-shared-visual-ready-with-strict-audio-gate-still-pending",
    "RW002 predecessor status changed",
  );
  invariant(receipt.strictAcceptanceEffect === false, "RW002 predecessor strict effect changed");
  invariant(receipt.humanReviewRecorded === false, "RW002 predecessor human review changed");
  invariant(receipt.ownerReviewRecorded === false, "RW002 predecessor owner review changed");
  invariant(
    isPlainObject(receipt.claims) &&
      Object.values(receipt.claims).every((value) => value === false),
    "RW002 predecessor claims are not all false",
  );
  invariant(isPlainObject(receipt.bindings), "RW002 predecessor bindings are missing");
  for (const [role, binding] of Object.entries(receipt.bindings)) {
    invariant(isPlainObject(binding), `${role}: predecessor binding is malformed`);
    assertSafeRelative(binding.file, `${role} predecessor binding`);
    invariant(SHA256_PATTERN.test(binding.sha256), `${role}: predecessor SHA-256 is malformed`);
  }
  for (const [role, expected] of Object.entries(EXPECTED_RW002_BINDING_DRIFT)) {
    invariant(
      receipt.bindings[role]?.file === expected.file,
      `${role}: predecessor path differs from the successor allowlist`,
    );
  }
}

function assertUiLanguageSeparation(currentFiles) {
  const runtime = currentFiles.productRuntime.content.toString("utf8");
  const contract = currentFiles.runtimeContract.content.toString("utf8");
  invariant(
    runtime.includes("uiLanguage?: AnimationRendererProps['lang']") &&
      runtime.includes("uiLanguage={uiLanguage ?? playbackContext.lang}") &&
      runtime.includes("lang={playbackContext.lang}"),
    "current product runtime lacks the separate uiLanguage/source lang wiring",
  );
  invariant(
    contract.includes("readonly uiLanguage?: AnimationLanguage;") &&
      contract.includes("app-owned responsive controls and accessibility") &&
      contract.includes("never changes the source-runtime language, capture identity"),
    "current runtime contract lacks the fail-closed uiLanguage boundary",
  );
}

export function buildRw002BindingSuccessorReport({
  predecessorBinding,
  predecessorReceipt,
  currentFiles,
  generatorBinding,
}) {
  validatePredecessorReceipt(predecessorReceipt);

  const currentBindings = {};
  const changedRoles = [];
  const unchangedRoles = [];
  for (const [role, predecessor] of Object.entries(predecessorReceipt.bindings)) {
    const current = currentFiles[role];
    invariant(current, `${role}: current binding was not read`);
    invariant(current.file === predecessor.file, `${role}: current path changed`);
    const changed = current.sha256 !== predecessor.sha256;
    const expected = EXPECTED_RW002_BINDING_DRIFT[role];
    invariant(
      changed === Boolean(expected),
      changed
        ? `${role}: unexpected current binding drift`
        : `${role}: expected successor drift is absent`,
    );
    currentBindings[role] = {
      file: current.file,
      bytes: current.bytes,
      sha256: current.sha256,
      predecessorSha256: predecessor.sha256,
      relationToPredecessor: changed ? "changed" : "byte-identical",
      ...(expected ? {changeCause: expected.cause} : {}),
    };
    (changed ? changedRoles : unchangedRoles).push(role);
  }

  const expectedChangedRoles = Object.keys(EXPECTED_RW002_BINDING_DRIFT);
  invariant(
    JSON.stringify(changedRoles) === JSON.stringify(expectedChangedRoles),
    "RW002 changed-role order or membership differs from the successor contract",
  );

  return {
    schemaVersion: 1,
    artifactType: "g5-l13-rw002-current-javascript-shared-runtime-binding-successor",
    animationId: "course-g05-l13-rw-002",
    issuedOn: "2026-08-01",
    status:
      "current-javascript-bindings-reconciled-browser-observations-not-revalidated",
    authority:
      "Acceptance-neutral byte binding reconciliation plus narrowly scoped static source characterization.",
    authorityBoundary:
      "This successor preserves the predecessor receipt byte-for-byte and binds the current files. It does not inherit or relabel the predecessor browser observations, and no browser QA was executed for this successor. Static uiLanguage wiring does not prove RW002 behavior, audio, localization, original-runtime parity, fidelity, review, acceptance, strict completion, release, or publication.",
    generatedBy: {
      script: generatorBinding,
      invocation:
        "node scripts/build-g5-l13-rw002-current-js-binding-successor.mjs --build",
      deterministic: true,
    },
    predecessorReceipt: {
      ...predecessorBinding,
      retainedByteForByte: true,
      browserObservationDisposition: "historical-predecessor-bytes-only",
      browserObservationsInherited: false,
      browserObservationsCurrentForSuccessor: false,
    },
    driftSummary: {
      predecessorBindingCount: Object.keys(predecessorReceipt.bindings).length,
      changedBindingCount: changedRoles.length,
      unchangedBindingCount: unchangedRoles.length,
      changedRoles,
      unchangedRoles,
      unexpectedDriftCount: 0,
    },
    currentBindings,
    changeCharacterization: {
      authorizedG5L4StaticUiLanguageSeparation: {
        bindingRoles: ["productRuntime", "runtimeContract"],
        sourceObservation:
          "The current contract exposes an optional uiLanguage for app-owned controls/accessibility copy, while the product runtime passes playbackContext.lang separately as the source-runtime language and supplies uiLanguage independently to the renderer.",
        attributionBasis:
          "authorized G5 L4 current-JavaScript coordination scope plus exact current source bytes",
        originalRuntimeBehaviorInferred: false,
        rw002BehavioralEquivalenceEstablished: false,
      },
      runtimeHelpers: {
        bindingRole: "runtimeHelpers",
        sourceObservation: "The current bytes differ from the predecessor binding.",
        causalAttributionEstablished: false,
        browserBehaviorEstablished: false,
      },
      successorValidationTest: {
        bindingRole: "productQaContractTest",
        purpose:
          "Validate the immutable predecessor separately from this successor and the current bindings.",
        runtimeBehaviorChangedByThisFile: false,
      },
    },
    machineChecks: {
      predecessorReceiptHashVerified: true,
      predecessorAcceptanceBoundaryVerified: true,
      everyPredecessorBindingPathRead: true,
      everyNonAllowlistedBindingByteIdentical: true,
      expectedDriftRolesExactlyMatched: true,
      currentUiLanguageSeparationStaticallyObserved: true,
      browserQaExecutedForSuccessor: false,
      predecessorBrowserObservationsReusedAsCurrent: false,
    },
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    claims: {...CLAIMS},
  };
}

export function renderRw002BindingSuccessorMarkdown(report) {
  const changed = report.driftSummary.changedRoles
    .map((role) => `- \`${role}\`: \`${report.currentBindings[role].file}\``)
    .join("\n");
  return `# G5 L13 RW002 current-JavaScript binding successor\n\n` +
    `Status: **${report.status}**\n\n` +
    `The predecessor browser receipt remains immutable at \`${report.predecessorReceipt.sha256}\`. Its observations remain historical evidence for its exact old bindings only. This successor does **not** inherit, relabel, or refresh those observations, and it ran no browser QA.\n\n` +
    `## Changed bindings\n\n${changed}\n\n` +
    `The current \`productRuntime\` and \`runtimeContract\` bytes expose the authorized G5 L4 static separation between app-owned \`uiLanguage\` and source-runtime \`lang\`. This is source characterization only. The \`runtimeHelpers\` byte drift is recorded without causal attribution. The test drift is this immutable predecessor/successor validation update.\n\n` +
    `## Evidence boundary\n\n` +
    `No current RW002 browser behavior, audio correctness, Spanish equivalence, original-runtime behavior, visual fidelity, human review, Owner acceptance, strict completion, release, or publication is established. All acceptance effects remain false; \`strictAcceptanceEffect\` is \`none\`.\n`;
}

export async function buildRw002BindingSuccessorArtifacts(root = PROJECT_ROOT) {
  const predecessorFile = await readRegularFile(
    root,
    RW002_BINDING_SUCCESSOR.predecessor.file,
  );
  invariant(
    predecessorFile.bytes === RW002_BINDING_SUCCESSOR.predecessor.bytes &&
      predecessorFile.sha256 === RW002_BINDING_SUCCESSOR.predecessor.sha256,
    "RW002 predecessor receipt byte identity changed",
  );
  const predecessorReceipt = JSON.parse(predecessorFile.content.toString("utf8"));
  validatePredecessorReceipt(predecessorReceipt);

  const currentFiles = {};
  for (const [role, binding] of Object.entries(predecessorReceipt.bindings)) {
    currentFiles[role] = await readRegularFile(root, binding.file);
  }
  assertUiLanguageSeparation(currentFiles);

  const generatorFile = await readRegularFile(
    root,
    "scripts/build-g5-l13-rw002-current-js-binding-successor.mjs",
  );
  const report = buildRw002BindingSuccessorReport({
    predecessorBinding: {
      file: predecessorFile.file,
      bytes: predecessorFile.bytes,
      sha256: predecessorFile.sha256,
    },
    predecessorReceipt,
    currentFiles,
    generatorBinding: {
      file: generatorFile.file,
      bytes: generatorFile.bytes,
      sha256: generatorFile.sha256,
    },
  });
  return {
    report,
    json: Buffer.from(stableJson(report)),
    markdown: Buffer.from(renderRw002BindingSuccessorMarkdown(report)),
  };
}

export function parseArguments(argv) {
  let mode = "check";
  for (const value of argv) {
    if (value === "--build") mode = "build";
    else if (value === "--check") mode = "check";
    else if (value === "--json") mode = "json";
    else if (value === "--help" || value === "-h") mode = "help";
    else throw new Error(`Unknown option: ${value}`);
  }
  return {mode};
}

async function outputExists(root, relativePath) {
  try {
    await lstat(path.join(root, ...relativePath.split("/")));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function buildOutputs(root, artifacts) {
  invariant(
    !(await outputExists(root, RW002_BINDING_SUCCESSOR.jsonPath)),
    `${RW002_BINDING_SUCCESSOR.jsonPath}: immutable output already exists`,
  );
  invariant(
    !(await outputExists(root, RW002_BINDING_SUCCESSOR.markdownPath)),
    `${RW002_BINDING_SUCCESSOR.markdownPath}: immutable output already exists`,
  );
  await writeFile(
    path.join(root, ...RW002_BINDING_SUCCESSOR.jsonPath.split("/")),
    artifacts.json,
    {flag: "wx"},
  );
  await writeFile(
    path.join(root, ...RW002_BINDING_SUCCESSOR.markdownPath.split("/")),
    artifacts.markdown,
    {flag: "wx"},
  );
}

async function checkOutputs(root, artifacts) {
  const json = await readRegularFile(root, RW002_BINDING_SUCCESSOR.jsonPath);
  const markdown = await readRegularFile(root, RW002_BINDING_SUCCESSOR.markdownPath);
  invariant(json.content.equals(artifacts.json), "RW002 binding successor JSON drifted");
  invariant(
    markdown.content.equals(artifacts.markdown),
    "RW002 binding successor Markdown drifted",
  );
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  if (mode === "help") {
    process.stdout.write(
      "Usage: node scripts/build-g5-l13-rw002-current-js-binding-successor.mjs [--build|--check|--json]\n",
    );
    return;
  }
  const artifacts = await buildRw002BindingSuccessorArtifacts(PROJECT_ROOT);
  if (mode === "build") {
    await buildOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write(
      `wrote ${RW002_BINDING_SUCCESSOR.jsonPath} and ${RW002_BINDING_SUCCESSOR.markdownPath}\n`,
    );
  } else if (mode === "check") {
    await checkOutputs(PROJECT_ROOT, artifacts);
    process.stdout.write("RW002 current-JavaScript binding successor: PASS\n");
  } else {
    process.stdout.write(artifacts.json);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
