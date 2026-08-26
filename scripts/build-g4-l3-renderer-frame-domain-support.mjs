#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildRendererFrameDomainSupport} from "./build-renderer-frame-domain-support.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_PATH = path.join(ROOT, "catalog/lesson-releases.json");
const INDEX_PATH = path.join(ROOT, "reports/g4-l3-renderer-frame-domain-support-index.json");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateG4L3RendererIndex(index, expectedIds) {
  invariant(index.schemaVersion === 1
    && index.evidenceType === "course-shell-pilot-renderer-frame-domain-support-index"
    && index.scope === "explicit-animation-id-selection"
    && index.pilotCount === 40
    && index.reports?.length === 40
    && index.strictAcceptanceEffect?.startsWith("none"),
  "G4 L3 renderer frame-domain index identity or authority drifted");
  invariant(JSON.stringify(index.reports.map(({animationId}) => animationId)) === JSON.stringify(expectedIds),
    "G4 L3 renderer index order or membership drifted");
  const declaredDomains = index.reports.reduce((sum, report) => sum + report.declaredFrameDomainCount, 0);
  const probes = index.reports.reduce((sum, report) => sum + report.probeCount, 0);
  const renderable = index.reports.reduce((sum, report) => sum + report.renderableCount, 0);
  const blocked = index.reports.reduce((sum, report) => sum + report.blockedCount, 0);
  invariant(declaredDomains === 261
    && probes === index.totalProbeCount
    && renderable === index.totalRenderableCount
    && blocked === index.totalBlockedCount
    && renderable + blocked <= probes,
  "G4 L3 renderer frame-domain aggregate drifted");
  return {declaredDomains, probes, renderable, blocked};
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function buildG4L3RendererSupport({check = false} = {}) {
  const releases = JSON.parse(await readFile(RELEASE_PATH, "utf8"));
  const release = releases.releases?.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted");
  const ids = release.members.map(({animationId}) => animationId);
  const result = await buildRendererFrameDomainSupport({ids, indexPath: INDEX_PATH, check});
  const summary = validateG4L3RendererIndex(result.index, ids);
  return {...result, summary};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildG4L3RendererSupport(parseArguments(process.argv.slice(2))).then((result) => {
    process.stdout.write(`${result.action}: G4 L3 renderer support ${result.index.fullyRenderablePilotCount}/40 members fully renderable; ${result.summary.renderable}/${result.summary.probes} probes renderable; strict acceptance effect none.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
