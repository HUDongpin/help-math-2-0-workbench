#!/usr/bin/env node

import path from "node:path";
import {realpath} from "node:fs/promises";
import {fileURLToPath} from "node:url";

import {
  claimLessonAnimateOneRowExecutionV2,
  consumeLessonAnimateOneRowAuthorizationV2,
  verifyLessonAnimateOneRowAuthorizationV2,
} from "./lib/lesson-animate-one-row-authorization-v2.mjs";
import {
  runAuthorizedLessonG4L10OneRowAudit,
} from "./lib/lesson-animate-authoring-audit-core.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function usage() {
  return [
    "Usage: node scripts/run-lesson-g4-l10-authorized-one-row-audit.mjs \\",
    "  <assignment-sha256> <authorization-sha256> <execution-code-closure-sha256>",
    "",
    "Runs exactly one owner-authorized, named-human G4 L10 Adobe Animate",
    "authoring audit. The three lowercase SHA-256 values select immutable",
    "authority receipts. No paths, keys, clocks, operators, tools, timeouts,",
    "helpers, roots, or execution hooks can be supplied by the caller.",
    "",
    "This operation records acceptance-neutral authoring evidence only. It does",
    "not grant original-runtime, Ruffle, audio, JavaScript fidelity, human",
    "review, owner acceptance, strict completion, integration, or publication.",
  ].join("\n");
}

function parseDedicatedArguments(argv) {
  invariant(Array.isArray(argv), "dedicated L10 arguments must be one array");
  if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
    return Object.freeze({help: true});
  }
  invariant(argv.length === 3,
    "exactly three receipt SHA-256 values are required; no options or injections are allowed");
  for (const [index, value] of argv.entries()) {
    invariant(typeof value === "string" && SHA256_PATTERN.test(value),
      `argument ${index + 1} must be one exact lowercase SHA-256`);
  }
  return Object.freeze({
    help: false,
    assignmentSha256: argv[0],
    authorizationSha256: argv[1],
    executionCodeClosureSha256: argv[2],
  });
}

async function main(argv = process.argv.slice(2)) {
  const parsed = parseDedicatedArguments(argv);
  if (parsed.help) {
    console.log(usage());
    return;
  }
  const verified = await verifyLessonAnimateOneRowAuthorizationV2({
    projectRoot: PROJECT_ROOT,
    assignmentSha256: parsed.assignmentSha256,
    authorizationSha256: parsed.authorizationSha256,
    executionCodeClosureSha256: parsed.executionCodeClosureSha256,
  });
  const consumed = await consumeLessonAnimateOneRowAuthorizationV2(verified);
  const claim = await claimLessonAnimateOneRowExecutionV2(consumed);
  const result = await runAuthorizedLessonG4L10OneRowAudit(claim);
  console.log(JSON.stringify({
    status: result.status,
    animationId: result.evidenceId,
    runId: result.ownerAuthorizedOneRowExecution.runId,
    runReceipt: path.relative(PROJECT_ROOT, result.resultFile).split(path.sep).join("/"),
    launchIntent: result.ownerAuthorizedOneRowExecution.launchIntent,
    migrationOrApprovalWrites: false,
    acceptanceEffect: "none",
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {
  PROJECT_ROOT,
  main,
  parseDedicatedArguments,
  usage,
};
