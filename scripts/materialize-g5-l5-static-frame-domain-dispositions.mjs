#!/usr/bin/env node

import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildFrameDomainDispositions,
} from "./build-frame-domain-dispositions.mjs";
import {
  verifyG5L5StaticFrameDomainDispositionEvidence,
} from "./build-g5-l5-static-frame-domain-disposition-evidence.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";
const EXPECTED = Object.freeze({
  members: 57,
  declaredRoots: 57,
  composites: 696,
  unresolved: 351,
  excludedNotProven: 185,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export async function materializeG5L5StaticFrameDomainDispositions({
  projectRoot: projectRootOption = DEFAULT_PROJECT_ROOT,
  check = false,
  transactionHooks = {},
} = {}) {
  const projectRoot = path.resolve(projectRootOption);
  const migrationsRoot = path.join(projectRoot, "migrations");
  const results = await buildFrameDomainDispositions({
    releaseId: RELEASE_ID,
    lessonReleasePath: path.join(
      projectRoot,
      "catalog",
      "lesson-releases.json",
    ),
    migrationsRoot,
    allowFullReleaseSelection: true,
    expectedReleaseFingerprintSha256:
      RELEASE_FINGERPRINT_SHA256,
    expectedOrderedMemberIdentitySha256:
      ORDERED_MEMBER_IDENTITY_SHA256,
    check,
    transactionHooks,
    staticEvidenceResolver: (animationId, context) =>
      verifyG5L5StaticFrameDomainDispositionEvidence(
        animationId,
        {
          projectRoot,
          migrationsRoot: context.migrationsRoot,
        },
      ),
  });
  const totals = results.reduce((summary, {report}) => {
    summary.declaredRoots +=
      report.summary.dispositionCounts["declared-frame-domain"];
    summary.composites +=
      report.summary.dispositionCounts["composite-child-with-parent"];
    summary.unresolved +=
      report.summary.dispositionCounts.unresolved;
    summary.excludedNotProven +=
      report.summary.excludedNotProvenTimelineCount;
    return summary;
  }, {
    declaredRoots: 0,
    composites: 0,
    unresolved: 0,
    excludedNotProven: 0,
  });
  invariant(
    results.length === EXPECTED.members &&
      totals.declaredRoots === EXPECTED.declaredRoots &&
      totals.composites === EXPECTED.composites &&
      totals.unresolved === EXPECTED.unresolved &&
      totals.excludedNotProven === EXPECTED.excludedNotProven,
    "G5 L5 disposition materialization did not produce the exact 57 / 696 / 351 / 185 contract",
  );
  invariant(
    results.every(({report}) =>
      report.generatedFrom.lessonReleaseCatalog?.releaseId === RELEASE_ID &&
      report.generatedFrom.lessonReleaseCatalog
        ?.releaseFingerprintSha256 ===
          RELEASE_FINGERPRINT_SHA256 &&
      report.generatedFrom.lessonReleaseCatalog
        ?.orderedMemberIdentitySha256 ===
          ORDERED_MEMBER_IDENTITY_SHA256 &&
      report.migrationStatusChanged === false &&
      String(report.strictAcceptanceEffect || "").startsWith("none;")),
    "G5 L5 disposition materialization crossed its release or acceptance boundary",
  );
  return {results, totals};
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ["--apply", "--check"].includes(argument));
  invariant(modes.length === 1, "choose exactly one of --apply or --check");
  const unknown = argv.find((argument) =>
    !["--apply", "--check", "--help", "-h"].includes(argument));
  invariant(!unknown, `Unknown option: ${unknown}`);
  invariant(
    !argv.includes("--help") && !argv.includes("-h"),
    "--help cannot be combined with an execution mode",
  );
  return {check: modes[0] === "--check"};
}

async function main() {
  if (process.argv.slice(2).length === 1 &&
      ["--help", "-h"].includes(process.argv[2])) {
    process.stdout.write(
      "Usage: node scripts/materialize-g5-l5-static-frame-domain-dispositions.mjs --apply|--check\n",
    );
    return;
  }
  const options = parseArguments(process.argv.slice(2));
  const {results, totals} =
    await materializeG5L5StaticFrameDomainDispositions(options);
  process.stdout.write(`${JSON.stringify({
    action: options.check ? "verified" : "written",
    releaseId: RELEASE_ID,
    memberCount: results.length,
    ...totals,
    canonicalCoverageChanged: false,
    migrationManifestChanged: false,
    acceptanceEffect: "none",
  })}\n`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
