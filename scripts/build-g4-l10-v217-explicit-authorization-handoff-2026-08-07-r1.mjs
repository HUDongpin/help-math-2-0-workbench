#!/usr/bin/env node

import {createHash} from "node:crypto";
import {chmod, lstat, readFile, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR =
  "scripts/build-g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.mjs";
const JSON_OUTPUT =
  "reports/g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.json";
const MARKDOWN_OUTPUT =
  "reports/g4-l10-v217-explicit-authorization-handoff-2026-08-07-r1.md";

const INPUTS = Object.freeze({
  securityTarget:
    "docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md",
  reviewProtocol:
    "docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md",
  verifier: "scripts/g4-l10-native-helper-v2_17-review-verifier.mjs",
  focusedTest: "scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs",
  migrationTemplateContract:
    "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.json",
});

const EXPECTED_SECURITY_TARGET_SHA256 =
  "bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3";

const SUGGESTED_AUTHORIZATION_TEXT =
  "我明确授权为 G4 L10 native-helper v2.17 创建一个全新的 authenticated independent-review set，仅限 schema、adversarial、whole 三项独立审查；不得继承 v2.14-v2.16 的结果，不得启动 helper、Flash/Animate、原始运行时、source promotion、验收、集成、发布或公开访问。";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(ROOT, relativePath);
  invariant(resolved.startsWith(`${ROOT}${path.sep}`), `${relativePath}: path escapes root`);
  return resolved;
}

async function bind(relativePath, parseJson = false) {
  const resolved = absolute(relativePath);
  const metadata = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath}: ordinary file required`);
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const bytes = await readFile(resolved);
  return {
    descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    value: parseJson ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

export async function buildV217ExplicitAuthorizationHandoff() {
  const [generator, ...inputEntries] = await Promise.all([
    bind(GENERATOR),
    ...Object.entries(INPUTS).map(async ([key, relativePath]) => [
      key,
      await bind(relativePath, key === "migrationTemplateContract"),
    ]),
  ]);
  const inputs = Object.fromEntries(inputEntries);
  invariant(
    inputs.securityTarget.descriptor.sha256 === EXPECTED_SECURITY_TARGET_SHA256,
    "v2.17 security target differs from the protocol-bound SHA-256",
  );
  const contract = inputs.migrationTemplateContract.value;
  invariant(
    contract.schemaVersion === 13 &&
      contract.status === "fail-closed-template-not-stable" &&
      contract.templateStable === false,
    "G4 L10 v13 template boundary changed",
  );
  invariant(
    contract.currentFormalState?.requirements?.total === 520 &&
      contract.currentFormalState?.requirements?.rootReady === 94 &&
      contract.currentFormalState?.requirements?.unresolvedNested === 426 &&
      contract.currentFormalState?.requirements?.naturalScheduleReady === 0 &&
      contract.currentFormalState?.frameObligations?.authoritativeCaptured === 0 &&
      contract.currentFormalState?.frameObligations?.total === 44488,
    "G4 L10 v13 requirement boundary changed",
  );
  invariant(
    contract.authorityBoundary?.mayLaunchOriginalRuntime === false &&
      contract.authorityBoundary?.mayImplementOrTestProductionHelper === false &&
      Object.values(contract.acceptanceEffects ?? {}).every(
        (value) => value === false,
      ),
    "G4 L10 v13 authority boundary changed",
  );

  return {
    schemaVersion: 1,
    artifactType: "g4-l10-v2-17-explicit-authorization-handoff",
    issuedOn: "2026-08-07",
    status:
      "authoring-validated-awaiting-new-explicit-user-authorization-no-review-set-created",
    generator: generator.descriptor,
    fixedAuthoringInputs: Object.fromEntries(
      Object.entries(inputs).map(([key, input]) => [key, input.descriptor]),
    ),
    authoringValidation: {
      securityTargetHashMatchesProtocol: true,
      focusedTestCommand:
        "node --test scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs",
      focusedTestObservedOn20260807: {
        tests: 25,
        passed: 25,
        failed: 0,
        authorityEffect: "none",
      },
      v13ContractCheckCommand:
        "node scripts/build-g4-l10-complete-migration-template-contract-v13.mjs --check",
      v13ContractCurrent: true,
    },
    migrationBoundary: {
      requirements: 520,
      rootReady: 94,
      unresolvedNested: 426,
      naturalScheduleReady: 0,
      authoritativeFrames: 0,
      requiredAuthoritativeFrames: 44488,
      templateStable: false,
    },
    futureReviewSet: {
      reviewSetCreatedByThisHandoff: false,
      reviewerTasksCreatedByThisHandoff: 0,
      taskIdsAssigned: false,
      reviewerNoncesAssigned: false,
      outputLeavesAssigned: false,
      authorizationTurnBound: false,
      requiredOrderedScopes: ["schema", "adversarial", "whole"],
      reviewerTasksMustBeDistinct: true,
      reviewResultsInheritedFromPriorVersions: false,
      sameReviewSetRetryAllowed: false,
    },
    requiredUserHandoff: {
      suggestedAuthorizationText: SUGGESTED_AUTHORIZATION_TEXT,
      suggestedAuthorizationTextSha256: sha256(
        Buffer.from(SUGGESTED_AUTHORIZATION_TEXT, "utf8"),
      ),
      warning:
        "The text stored here is a template only. It becomes authorization only if the user sends a new explicit instruction that can be bound to its real source task and authorization turn.",
    },
    postReviewBoundary: {
      qualifyingCountsRequiredPerScope: {P0: 0, P1: 0, P2: 0},
      qualifyingReviewActivatesRuntimeAutomatically: false,
      laterRuntimeSessionStillRequiresExactReceiptGatedAuthorization: true,
      keyTermsIncluded: false,
      missingMp3Included: false,
      polynomialSwfIncluded: false,
      sourcePromotionIncluded: false,
      acceptanceIncluded: false,
      releaseIncluded: false,
      publicationIncluded: false,
    },
    authorityEffects: {
      createReviewSet: false,
      createReviewerTasks: false,
      permissionTransition: false,
      helperImplementation: false,
      helperExecution: false,
      originalRuntimeCapture: false,
      sourcePromotion: false,
      audioAcceptance: false,
      humanAcceptance: false,
      ownerAcceptance: false,
      strictCompletion: false,
      integration: false,
      release: false,
      publication: false,
    },
  };
}

function renderMarkdown(report) {
  return `# G4 L10 native-helper v2.17 explicit-authorization handoff r1\n\n` +
    `Status: **${report.status}**.\n\n` +
    `## Authoring validation\n\n` +
    `- Security target SHA-256 matches the protocol: \`${report.fixedAuthoringInputs.securityTarget.sha256}\`.\n` +
    `- Focused negative-vector suite observed: 25/25 passed, authority effect none.\n` +
    `- L10 v13 remains fail closed: 520 requirements, 94 root-ready, 426 unresolved nested, 0 natural-schedule-ready, and 0/44,488 authoritative frames.\n\n` +
    `## Explicit authorization still required\n\n` +
    `No review set, reviewer task, task ID, nonce, output leaf, or authorization-turn binding is created here. A future user instruction must freshly authorize exactly three ordered independent scopes: \`schema\`, \`adversarial\`, and \`whole\`.\n\n` +
    `Suggested text (template only; this file is not authorization):\n\n` +
    `> ${report.requiredUserHandoff.suggestedAuthorizationText}\n\n` +
    `Even a 0/0/0 review result will not automatically authorize helper execution, original-runtime capture, source promotion, acceptance, release, or publication.\n`;
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(argv.length === 1 && allowed.has(argv[0]), "choose exactly one explicit mode");
  return argv[0].slice(2);
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
    invariant(actualMarkdown?.equals(markdownBytes), `${MARKDOWN_OUTPUT} is stale or missing`);
    process.stdout.write("v2.17 explicit-authorization handoff: PASS\n");
    return;
  }
  invariant(mode === "write-no-clobber", `unsupported mode: ${mode}`);
  invariant(!(await readIfPresent(JSON_OUTPUT)), `${JSON_OUTPUT} already exists`);
  invariant(!(await readIfPresent(MARKDOWN_OUTPUT)), `${MARKDOWN_OUTPUT} already exists`);
  let jsonWritten = false;
  try {
    await writeFile(absolute(JSON_OUTPUT), jsonBytes, {flag: "wx", mode: 0o444});
    jsonWritten = true;
    await writeFile(absolute(MARKDOWN_OUTPUT), markdownBytes, {flag: "wx", mode: 0o444});
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

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildV217ExplicitAuthorizationHandoff()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
