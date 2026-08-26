#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const INDEX_RELATIVE = "reports/g4-l3-renderer-frame-domain-support-index.json";
const OUTPUT_RELATIVE = "reports/g4-l3-renderer-gap-closure.json";
const MARKDOWN_RELATIVE = "reports/g4-l3-renderer-gap-closure.md";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readRecord(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    document: JSON.parse(bytes.toString("utf8")),
  };
}

function binding(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function sameSet(values, expected) {
  return JSON.stringify([...new Set(values)].sort()) === JSON.stringify([...expected].sort());
}

export function classifyDomainSupport({support, probes, requirements}) {
  const outcomes = probes.map(({outcome}) => outcome);
  const blockers = probes.map(({actual}) => actual?.blocker).filter(Boolean);
  const languages = probes.map(({request}) => request?.language).filter(Boolean);

  if (support.fullyRenderable === true) {
    invariant(support.blockedCount === 0
      && support.renderableCount === support.probeCount
      && outcomes.every((outcome) => outcome === "renderable-exact"),
    `${support.frameDomain}: fully-renderable domain contains a blocked or inexact probe`);
    return "fully-renderable-current-js";
  }

  if (support.renderableCount > 0) {
    invariant(sameSet(outcomes, ["blocked-not-renderable", "renderable-exact"])
      && sameSet(blockers, ["spanish-visual-and-audio-unvalidated"])
      && sameSet(languages, ["en", "es"]),
    `${support.frameDomain}: partial renderer domain has an unsupported blocker shape`);
    return "spanish-visual-audio-evidence-gated";
  }

  if (support.frameDomain === "root") {
    invariant(sameSet(outcomes, ["blocked-not-renderable"])
      && sameSet(blockers, ["root-baseline-unavailable", "spanish-visual-and-audio-unvalidated"]),
    "root: renderer blocker shape drifted");
    return "authoritative-root-runtime-evidence-gated";
  }

  if (sameSet(outcomes, ["identity-mismatch"])) {
    invariant(sameSet(blockers, ["unsupported-runtime-request"]),
      `${support.frameDomain}: identity mismatch lacks the fail-closed runtime blocker`);
    invariant(requirements.length === 2
      && sameSet(requirements.map(({language}) => language), ["en", "es"])
      && requirements.every((requirement) => requirement.status === "pending"
        && requirement.scenario === "source-static-reachable-domain"
        && requirement.entryState?.runtimeReachabilityEstablished === false
        && requirement.baselineAuthority === "unresolved"
        && requirement.capturedFrameCount === 0),
    `${support.frameDomain}: pending natural-trace coverage contract is incomplete or promoted`);
    return "natural-trace-parent-composition-and-renderer-gated";
  }

  return "unclassified-fail-closed";
}

export function validateRendererGapClosure(report) {
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-renderer-gap-closure"
    && report.scope?.releaseId === RELEASE_ID
    && report.scope?.releaseMembers === 40
    && report.members?.length === 40,
  "renderer gap closure identity or scope drifted");
  invariant(report.summary?.declaredFrameDomains === 261
    && report.summary?.fullyRenderableFrameDomains === 36
    && report.summary?.partiallyRenderableFrameDomains === 38
    && report.summary?.nonRenderableFrameDomains === 187
    && report.summary?.notFullyRenderableFrameDomains === 225
    && report.summary?.fullyRenderableMembers === 2
    && report.summary?.renderableExactProbes === 232
    && report.summary?.blockedOrMismatchedProbes === 814
    && report.summary?.safeRendererOnlyImplementationDomainsNow === 0,
  "renderer gap closure aggregate drifted");
  invariant(report.categoryCounts?.["fully-renderable-current-js"] === 36
    && report.categoryCounts?.["spanish-visual-audio-evidence-gated"] === 38
    && report.categoryCounts?.["authoritative-root-runtime-evidence-gated"] === 38
    && report.categoryCounts?.["natural-trace-parent-composition-and-renderer-gated"] === 149
    && (report.categoryCounts?.["unclassified-fail-closed"] || 0) === 0,
  "renderer gap closure category partition drifted");
  invariant(report.decision?.safeRendererOnlyImplementationAvailable === false
    && report.decision?.nextExecutableMilestone === "authorized-ts006-en-es-original-runtime-vertical-slice",
  "renderer gap closure decision was weakened or promoted");
  invariant(Object.values(report.acceptance || {}).every((value) => value === false)
    && String(report.strictAcceptanceEffect || "").startsWith("none;"),
  "renderer gap closure contains an acceptance promotion");
  return report;
}

function renderMarkdown(report) {
  return `# G4 L3 renderer gap closure\n\n`
    + `The current renderer audit covers all **${report.summary.declaredFrameDomains}** declared frame domains. This is engineering evidence only.\n\n`
    + `- Fully renderable current-JavaScript domains: **${report.summary.fullyRenderableFrameDomains}**.\n`
    + `- English-renderable domains blocked pending Spanish visual/audio evidence: **${report.categoryCounts["spanish-visual-audio-evidence-gated"]}**.\n`
    + `- Root domains blocked pending authoritative original-runtime evidence: **${report.categoryCounts["authoritative-root-runtime-evidence-gated"]}**.\n`
    + `- Nested domains blocked pending natural trace, parent composition, and renderer evidence: **${report.categoryCounts["natural-trace-parent-composition-and-renderer-gated"]}**.\n`
    + `- Unclassified domains: **${report.categoryCounts["unclassified-fail-closed"] || 0}**.\n`
    + `- Safe renderer-only implementation domains available now: **${report.summary.safeRendererOnlyImplementationDomainsNow}**.\n\n`
    + `The next executable fidelity milestone remains the approved TS006 English/Spanish original-runtime vertical slice. No renderer gap is closed by guessing a parent composition, Spanish state, audio path, or natural entry. Strict completion remains **0/40** and the lesson remains unpublished.\n`;
}

export async function buildRendererGapClosure({check = false} = {}) {
  const [releaseRecord, indexRecord, generatorBytes] = await Promise.all([
    readRecord(RELEASE_RELATIVE),
    readRecord(INDEX_RELATIVE),
    readFile(SCRIPT_PATH),
  ]);
  const release = releaseRecord.document.releases?.find(({releaseId}) => releaseId === RELEASE_ID);
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted");
  const index = indexRecord.document;
  invariant(index.pilotCount === 40 && index.reports?.length === 40,
    "G4 L3 renderer support index scope drifted");
  const reportById = new Map(index.reports.map((item) => [item.animationId, item]));
  invariant(reportById.size === 40, "G4 L3 renderer support index contains duplicate members");

  const members = [];
  const categoryCounts = Object.create(null);
  let renderableExactProbes = 0;
  let blockedOrMismatchedProbes = 0;
  for (const member of release.members) {
    const indexed = reportById.get(member.animationId);
    invariant(indexed, `${member.animationId}: renderer report is absent from the index`);
    const [rendererRecord, manifestRecord, coverageRecord] = await Promise.all([
      readRecord(indexed.path),
      readRecord(`migrations/${member.animationId}/migration.json`),
      readRecord(`migrations/${member.animationId}/evidence/full-frame-coverage.json`),
    ]);
    invariant(rendererRecord.sha256 === indexed.sha256
      && rendererRecord.document.animationId === member.animationId
      && manifestRecord.document.animationId === member.animationId
      && coverageRecord.document.animationId === member.animationId,
    `${member.animationId}: renderer, manifest, or coverage binding drifted`);
    const renderer = rendererRecord.document;
    const domains = renderer.domainSupport.map((support) => {
      const probes = renderer.probes.filter(({request}) => request.frameDomain === support.frameDomain);
      const requirements = coverageRecord.document.requirements.filter(({frameDomainId}) => frameDomainId === support.frameDomain);
      invariant(probes.length === support.probeCount, `${member.animationId}/${support.frameDomain}: probe count drifted`);
      const category = classifyDomainSupport({support, probes, requirements});
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      renderableExactProbes += probes.filter(({outcome}) => outcome === "renderable-exact").length;
      blockedOrMismatchedProbes += probes.filter(({outcome}) => outcome !== "renderable-exact").length;
      return {
        frameDomain: support.frameDomain,
        frameCount: support.frameCount,
        category,
        probeCount: support.probeCount,
        renderableCount: support.renderableCount,
        blockedCount: support.blockedCount,
        requirementIds: requirements.map(({requirementId}) => requirementId),
        requiredNextEvidence:
          category === "fully-renderable-current-js" ? "authoritative-baseline-and-acceptance-chain"
            : category === "spanish-visual-audio-evidence-gated" ? "authorized-spanish-natural-trace-and-audio-listening-evidence"
              : category === "authoritative-root-runtime-evidence-gated" ? "authorized-natural-root-runtime-trace"
                : "authorized-natural-trace-parent-composition-and-source-bound-renderer",
      };
    });
    members.push({
      sequence: member.ordinal,
      animationId: member.animationId,
      rendererReport: binding(rendererRecord),
      migrationManifest: binding(manifestRecord),
      fullFrameCoverage: binding(coverageRecord),
      declaredFrameDomains: domains.length,
      fullyRenderableFrameDomains: domains.filter(({category}) => category === "fully-renderable-current-js").length,
      domains,
    });
  }

  const allDomains = members.flatMap(({domains}) => domains);
  const fullyRenderableFrameDomains = categoryCounts["fully-renderable-current-js"] || 0;
  const partiallyRenderableFrameDomains = categoryCounts["spanish-visual-audio-evidence-gated"] || 0;
  const nonRenderableFrameDomains = allDomains.length - fullyRenderableFrameDomains - partiallyRenderableFrameDomains;
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-renderer-gap-closure",
    generatedBy: {
      script: portable(path.relative(ROOT, SCRIPT_PATH)),
      bytes: generatorBytes.length,
      sha256: sha256(generatorBytes),
      deterministic: true,
    },
    scope: {releaseId: RELEASE_ID, releaseMembers: 40, publicationMode: "atomic"},
    bindings: {lessonRelease: binding(releaseRecord), rendererSupportIndex: binding(indexRecord)},
    summary: {
      declaredFrameDomains: allDomains.length,
      fullyRenderableFrameDomains,
      partiallyRenderableFrameDomains,
      nonRenderableFrameDomains,
      notFullyRenderableFrameDomains: allDomains.length - fullyRenderableFrameDomains,
      fullyRenderableMembers: members.filter(({declaredFrameDomains, fullyRenderableFrameDomains: count}) => count === declaredFrameDomains).length,
      renderableExactProbes,
      blockedOrMismatchedProbes,
      safeRendererOnlyImplementationDomainsNow: 0,
    },
    categoryCounts,
    decision: {
      safeRendererOnlyImplementationAvailable: false,
      reason: "Every not-fully-renderable domain is gated by authoritative root runtime evidence, Spanish visual/audio evidence, or natural-trace parent-composition evidence. Treating any one as a plain adapter/registry task would invent source behavior or composition.",
      nextExecutableMilestone: "authorized-ts006-en-es-original-runtime-vertical-slice",
      runtimeLaunchAuthorized: false,
    },
    members,
    acceptance: {
      authoritativeRuntimeAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; this report partitions current renderer gaps without rendering, launching a runtime, changing coverage status, or advancing acceptance",
  };
  validateRendererGapClosure(report);
  const rendered = pretty(report);
  const markdown = renderMarkdown(report);
  const outputPath = path.join(ROOT, OUTPUT_RELATIVE);
  const markdownPath = path.join(ROOT, MARKDOWN_RELATIVE);
  if (check) {
    invariant(await exists(outputPath) && await readFile(outputPath, "utf8") === rendered,
      `${OUTPUT_RELATIVE} is stale or missing`);
    invariant(await exists(markdownPath) && await readFile(markdownPath, "utf8") === markdown,
      `${MARKDOWN_RELATIVE} is stale or missing`);
    return {action: "verified", report};
  }
  await writeFile(outputPath, rendered, "utf8");
  await writeFile(markdownPath, markdown, "utf8");
  return {action: "written", report};
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildRendererGapClosure(parseArguments(process.argv.slice(2))).then(({action, report}) => {
    process.stdout.write(`${action}: ${report.summary.fullyRenderableFrameDomains}/${report.summary.declaredFrameDomains} frame domains fully renderable; ${report.summary.safeRendererOnlyImplementationDomainsNow} safe renderer-only gaps; strict acceptance effect none.\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
