#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  generateG4L3SourceStaticCandidate,
} from "./build-g4-l3-source-static-candidate.mjs";
import {
  SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS,
  materializeSourceStaticAutoplayEvidence,
} from "./materialize-g4-l3-source-static-autoplay-evidence.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function checkSourceStaticAutoplayCandidates({
  root = PROJECT_ROOT,
  animationId = null,
} = {}) {
  invariant(path.resolve(root) === PROJECT_ROOT,
    "candidate generator currently supports only the canonical project root");
  const items = animationId
    ? SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS.filter(
      (item) => item.animationId === animationId,
    )
    : SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS;
  invariant(items.length > 0,
    `unknown source-static autoplay animation: ${animationId}`);
  const candidateChecks = [];
  for (const item of items) {
    const result = await generateG4L3SourceStaticCandidate({
      check: true,
      specPath: item.specPath,
    });
    invariant(result.reportOutputMode === "materialized" &&
      result.autoplayEvidenceValidated === true &&
      result.strictAcceptanceEffect === "none",
    `${item.animationId}: generic candidate check skipped autoplay evidence`);
    const bytes = await readFile(path.join(root, item.reportPath));
    const report = JSON.parse(bytes.toString("utf8"));
    candidateChecks.push({
      animationId: item.animationId,
      report: {
        path: item.reportPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      },
      baseReportFingerprintSha256:
        report.autoplayEvidence.baseReportFingerprintSha256,
      materializedReportFingerprintSha256:
        report.reportFingerprintSha256,
      reportOutputMode: result.reportOutputMode,
      autoplayEvidenceValidated: result.autoplayEvidenceValidated,
    });
  }
  const materializer = await materializeSourceStaticAutoplayEvidence({
    root,
    check: true,
  });
  return {
    schemaVersion: 1,
    checkType: "g4-l3-source-static-autoplay-candidate-canonical-check",
    requestedAnimationId: animationId,
    candidateCheckCount: candidateChecks.length,
    candidateChecks,
    materializer: {
      itemCount: materializer.itemCount,
      filesWritten: materializer.filesWritten,
      sourceOperationIndex: materializer.sourceOperationIndex,
      autoplayContract: materializer.autoplayContract,
    },
    interactionEnabled: false,
    audioEnabled: false,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--animation-id") {
      invariant(argv[index + 1], "--animation-id requires a value");
      options.animationId = argv[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/check-g4-l3-source-static-autoplay-candidates.mjs [--animation-id ID]\n",
    );
    return;
  }
  process.stdout.write(stableJson(
    await checkSourceStaticAutoplayCandidates(options),
  ));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
