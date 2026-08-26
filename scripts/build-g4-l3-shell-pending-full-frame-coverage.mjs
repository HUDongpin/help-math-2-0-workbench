#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {
  TECHNICAL_MANIFEST_PROJECTION,
  projectionSha256,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {applyAcceptanceNeutralImplementationCaptureOverlay} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";
import {validateRequirementCoverageGroups} from "./lib/trace-frame-selection.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const workspace = path.join(projectRoot, "migrations", animationId);
const outputPath = path.join(workspace, "evidence", "full-frame-coverage.json");
const manifestPath = path.join(workspace, "migration.json");
const shellContractPath = path.join(workspace, "audit", "source-local-current-javascript-shell-contract.json");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function bindFile(filePath) {
  const bytes = await readFile(filePath);
  return {
    path: portable(path.relative(projectRoot, filePath)),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function requirementFor({frameDomain, scenario, language}) {
  const seed = "0";
  const entryState = {
    kind: frameDomain.kind === "root"
      ? "original-shell-natural-entry"
      : "original-shell-nested-natural-entry",
    rootTimelineId: "root",
    rootEntryFrame: frameDomain.kind === "root" ? 1 : frameDomain.parentEntryFrame,
    frameDomainId: frameDomain.id,
    localEntryFrame: frameDomain.kind === "root" ? 1 : frameDomain.localEntryFrame,
    scenario,
    language,
    seed,
  };
  return {
    requirementId: `req:${frameDomain.id}:${scenario}:${language}`,
    scenario,
    frameDomainId: frameDomain.id,
    traceId: `trace:${frameDomain.id}:${scenario}:${language}:seed-0`,
    language,
    seed,
    requiredRange: {firstFrame: 1, lastFrame: frameDomain.frameCount},
    entryState,
    entryStateSha256: projectionSha256(entryState),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    blockingReason: `Original-runtime natural trace, authoritative behavioral baseline, paired full-frame capture/RMSE metrics, audio, human review, and owner acceptance remain missing. The available FFDec ${frameDomain.id} PNG is structural-only.`,
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameDomain.frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
}

export function validatePendingShellCoverage(document, manifest) {
  invariant(document.schemaVersion === 2, "Unexpected full-frame coverage schema");
  invariant(document.animationId === animationId, "Unexpected full-frame coverage animation ID");
  const root = manifest.implementation.frameDomains.find(({id}) => id === "root");
  invariant(root?.frameCount === 50, "Shell root frame-domain contract is not 50 frames");
  const frameDomains = manifest.implementation.frameDomains;
  const expectedRequirementCount = frameDomains.reduce(
    (sum, frameDomain) => sum + frameDomain.scenarioIds.length * manifest.localization.languages.length,
    0,
  );
  invariant(document.requirements.length === expectedRequirementCount, "Shell coverage requirement count is incomplete");
  validateRequirementCoverageGroups(
    document.requirements,
    Object.fromEntries(frameDomains.map(({id, frameCount}) => [id, frameCount])),
  );
  const combinations = new Set(document.requirements.map(({frameDomainId, scenario, language}) => `${frameDomainId}\0${scenario}\0${language}`));
  for (const frameDomain of frameDomains) {
    for (const scenario of frameDomain.scenarioIds) {
      for (const language of manifest.localization.languages) {
        invariant(
          combinations.has(`${frameDomain.id}\0${scenario}\0${language}`),
          `Missing ${frameDomain.id}/${scenario}/${language} requirement`,
        );
      }
    }
  }
  invariant(document.requirements.every((requirement) => {
    const frameCount = frameDomains.find(({id}) => id === requirement.frameDomainId)?.frameCount;
    const implementationCaptureStateIsValid = requirement.capturedFrameCount === 0
      ? requirement.missingFrames.length === frameCount
        && requirement.captureManifest === ""
        && requirement.captureManifestSha256 === ""
      : requirement.capturedFrameCount === frameCount
        && requirement.missingFrames.length === 0
        && requirement.captureManifest.startsWith("output/playwright/")
        && /^[a-f0-9]{64}$/.test(requirement.captureManifestSha256);
    return requirement.status === "pending"
      && requirement.baselineAuthority === "unresolved"
      && requirement.baselineCaptureManifest === ""
      && requirement.baselineCaptureManifestSha256 === ""
      && requirement.metricsFile === ""
      && requirement.metricsSha256 === ""
      && implementationCaptureStateIsValid;
  }), "Pending shell coverage contains invalid evidence state or a strict-authority claim");
  invariant(document.strictAcceptanceEffect === "none", "Pending shell coverage cannot promote strict acceptance");
  return document;
}

export async function buildPendingShellCoverage() {
  const [manifestBytes, shellContract, generator, currentCoverage] = await Promise.all([
    readFile(manifestPath),
    bindFile(shellContractPath),
    bindFile(scriptPath),
    readFile(outputPath, "utf8").then(JSON.parse).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error)),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  invariant(manifest.animationId === animationId, "Shell migration manifest identity drifted");
  const root = manifest.implementation.frameDomains.find(({id}) => id === "root");
  invariant(root?.frameCount === manifest.runtime.frameCount, "Shell root frame-domain count differs from runtime root count");
  const requirements = manifest.implementation.frameDomains.flatMap((frameDomain) =>
    frameDomain.scenarioIds.flatMap((scenario) =>
      manifest.localization.languages.map((language) => requirementFor({frameDomain, scenario, language}))
    )
  );
  const document = applyAcceptanceNeutralImplementationCaptureOverlay({
    expectedCoverage: {
    schemaVersion: 2,
    animationId,
    evidenceType: "pending-original-runtime-full-frame-requirement-contract",
    generator: {...generator, version: 1},
    sourceBindings: {
      migrationTechnicalContract: {
        path: "migrations/shell-course-g04-l03-index-local/migration.json",
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        encoding: "canonical-json-v1",
        sha256: technicalManifestSha256(manifest),
      },
      shellCurrentJavascriptContract: shellContract,
    },
    authorityStatement: "This document enumerates the exact still-missing strict full-domain requirements. It may bind non-authoritative current-JavaScript implementation captures, but contains no original-runtime baseline authority, RMSE, audio, human-review, owner-review, or acceptance evidence.",
    requirements,
    strictAcceptanceEffect: "none",
    },
    currentCoverage,
    manifest,
  });
  validatePendingShellCoverage(document, manifest);
  return document;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const document = await buildPendingShellCoverage();
  const rendered = `${JSON.stringify(document, null, 2)}\n`;
  if (options.check) {
    invariant(await readFile(outputPath, "utf8") === rendered, "G4 L3 shell pending full-frame coverage contract is stale");
    process.stdout.write("verified G4 L3 shell pending full-frame coverage contract\n");
  } else {
    await writeFile(outputPath, rendered);
    process.stdout.write("wrote G4 L3 shell pending full-frame coverage contract\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
