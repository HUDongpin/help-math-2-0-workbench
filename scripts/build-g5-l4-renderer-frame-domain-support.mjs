#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildRendererFrameDomainSupport} from "./build-renderer-frame-domain-support.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const RELEASE_PATH = path.join(ROOT, "catalog/lesson-releases.json");
const MIGRATIONS_ROOT = path.join(ROOT, "migrations");
const SINGLE_SPRITE_INDEX_PATH = path.join(
  ROOT,
  "reports/g5-l4-source-static-renderer-frame-domain-support-index.json",
);
const INDEX_PATH = path.join(
  ROOT,
  "reports/g5-l4-renderer-frame-domain-support-index.json",
);
const CANDIDATE_REPORT_ROOT = path.join(
  ROOT,
  "reports/g5-l4-renderer-frame-domain-support",
);
const PROBE_SCRIPT_PATH = path.join(
  ROOT,
  "scripts/probe-renderer-frame-domain-support.ts",
);
const TSX_PATH = path.join(ROOT, "node_modules/.bin/tsx");

export const G5_L4_MEMBER_CLASSES = Object.freeze({
  singleSprite: "source-static-single-sprite",
  fq001: "source-static-dual-sprite-composite",
  fq002: "product-question-atlas-random-10-of-18",
  fq003: "product-question-atlas-sequential-18-of-18",
  shell: "structural-product-shell-candidate",
});

const FQ001_ID = "course-g05-l04-fq-001";
const FQ002_ID = "course-g05-l04-fq-002";
const FQ003_ID = "course-g05-l04-fq-003";
const SHELL_ID = "shell-course-g05-l04-index-local";
const SPECIAL_IDS = Object.freeze([FQ001_ID, FQ002_ID, FQ003_ID, SHELL_ID]);
const CANONICAL_RUNTIME_UNAVAILABLE_IDS = Object.freeze([
  FQ002_ID,
  FQ003_ID,
  SHELL_ID,
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function fileBinding(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const bytes = await readFile(absolutePath);
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: digest(bytes),
  };
}

function falseAcceptanceBoundary() {
  return {
    authoritativeOriginalRuntime: false,
    naturalRuntimeReachabilityComplete: false,
    fullFrameComparisonComplete: false,
    audioAccepted: false,
    humanVisualReviewAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    published: false,
  };
}

function manifestRendererUnbound(manifest) {
  const implementation = manifest.implementation || {};
  return implementation.rendering === "undecided"
    && implementation.route === ""
    && implementation.component === ""
    && implementation.registryModule === ""
    && implementation.timelineModule === "";
}

export function classifyG5L4ReleaseMembers(release) {
  invariant(
    release?.releaseId === RELEASE_ID
      && release.publicationMode === "atomic"
      && release.members?.length === 55,
    "G5 L4 atomic 55-member release scope drifted",
  );
  const ids = release.members.map(({animationId}) => animationId);
  invariant(new Set(ids).size === 55, "G5 L4 release member IDs are not unique");
  invariant(
    JSON.stringify(ids.slice(-4)) === JSON.stringify(SPECIAL_IDS),
    "G5 L4 FQ/Shell tail order drifted",
  );
  invariant(
    release.members.every(({ordinal}, index) => ordinal === index + 1),
    "G5 L4 release ordinals drifted",
  );
  return release.members.map((member, index) => ({
    ...member,
    memberClass: index < 51
      ? G5_L4_MEMBER_CLASSES.singleSprite
      : member.animationId === FQ001_ID
        ? G5_L4_MEMBER_CLASSES.fq001
        : member.animationId === FQ002_ID
          ? G5_L4_MEMBER_CLASSES.fq002
          : member.animationId === FQ003_ID
            ? G5_L4_MEMBER_CLASSES.fq003
            : G5_L4_MEMBER_CLASSES.shell,
    canonicalRendererRuntimeUnavailable:
      CANONICAL_RUNTIME_UNAVAILABLE_IDS.includes(member.animationId),
  }));
}

function validateSingleSpriteManifest(manifest, animationId) {
  invariant(
    manifest.animationId === animationId,
    `${animationId}: migration manifest identity drifted`,
  );
  invariant(
    typeof manifest.implementation?.registryModule === "string"
      && manifest.implementation.registryModule === `./modules/${animationId}`
      && manifest.implementation.timelineModule
        === `packages/demos/src/timelines/${animationId}.ts`,
    `${animationId}: canonical current-JavaScript module binding drifted`,
  );
  const domains = manifest.implementation.frameDomains;
  invariant(
    Array.isArray(domains)
      && domains.length === 2
      && domains[0]?.id === "root"
      && domains[0]?.frameCount === manifest.runtime?.frameCount
      && domains[0]?.scenarioIds?.length === 1
      && domains[0].scenarioIds[0] === "root-unavailable"
      && /^sprite-\d+$/.test(domains[1]?.id)
      && Number.isSafeInteger(domains[1]?.frameCount)
      && domains[1].frameCount > 1
      && domains[1]?.scenarioIds?.length === 1
      && domains[1].scenarioIds[0] === "source-static-frame",
    `${animationId}: expected one blocked root plus one source-static sprite domain`,
  );
}

export function buildCandidateProbeRequests(domains) {
  const requests = [];
  for (const domain of domains) {
    invariant(
      typeof domain.id === "string"
        && Number.isSafeInteger(domain.frameCount)
        && domain.frameCount > 0
        && typeof domain.scenario === "string",
      "G5 L4 candidate probe domain is malformed",
    );
    const frames = domain.frameCount === 1 ? [1] : [1, domain.frameCount];
    for (const language of ["en", "es"]) {
      for (const frame of frames) {
        requests.push({
          requestId: `${domain.id}::${domain.scenario}::${language}::${frame}`,
          frameDomain: domain.id,
          frame,
          scenario: domain.scenario,
          language,
          seed: 0,
        });
      }
    }
  }
  return requests;
}

async function runRegisteredProbe(animationId, requests, runner) {
  if (runner) return runner({animationId, requests});
  const temporary = await mkdtemp(path.join(tmpdir(), "g5-l4-renderer-audit-"));
  const inputPath = path.join(temporary, "probe-input.json");
  await writeFile(
    inputPath,
    `${JSON.stringify({animationId, requests})}\n`,
    "utf8",
  );
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(TSX_PATH, [PROBE_SCRIPT_PATH, inputPath], {
        cwd: ROOT,
        env: {...process.env, NO_COLOR: "1"},
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `${animationId}: G5 L4 renderer probe failed (${code}): ${stderr.trim()}`,
            ),
          );
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(
            new Error(
              `${animationId}: G5 L4 renderer probe returned invalid JSON: ${error.message}`,
            ),
          );
        }
      });
    });
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

function evaluateCandidateProbes(requests, probe, animationId) {
  invariant(
    probe.animationId === animationId
      && probe.prototypeKey === animationId
      && probe.module?.key === animationId,
    `${animationId}: registered candidate runtime identity drifted`,
  );
  invariant(
    probe.results?.length === requests.length,
    `${animationId}: candidate renderer probe count drifted`,
  );
  const rawById = new Map(probe.results.map((result) => [
    result.requestId,
    result,
  ]));
  invariant(
    rawById.size === requests.length,
    `${animationId}: candidate renderer probe IDs repeated`,
  );
  return requests.map((request) => {
    const raw = rawById.get(request.requestId);
    invariant(raw, `${animationId}: omitted ${request.requestId}`);
    const actual = raw.actual;
    const identityChecks = {
      frameDomain: actual?.frameDomain === request.frameDomain,
      frame: actual?.frame === request.frame,
      scenario: actual?.scenario === request.scenario,
      language: actual?.language === request.language,
    };
    const identityExact = Object.values(identityChecks).every(Boolean);
    const blocked = actual?.status === "blocked" || Boolean(actual?.blocker);
    const renderable = !raw.error
      && raw.moduleScenarioDeclared
      && identityExact
      && !blocked;
    return {
      request,
      moduleScenarioDeclared: raw.moduleScenarioDeclared,
      actual,
      identityChecks,
      identityExact,
      blocked,
      renderable,
      outcome: raw.error
        ? "probe-error"
        : !identityExact
          ? "identity-mismatch"
          : !raw.moduleScenarioDeclared
            ? "scenario-undeclared-by-module"
            : blocked
              ? "blocked-not-renderable"
              : "renderable-exact",
      error: raw.error,
    };
  });
}

function candidateDefinitions(animationId) {
  if (animationId === FQ001_ID) {
    return {
      memberClass: G5_L4_MEMBER_CLASSES.fq001,
      bindingClass: "manifest-candidate-maturity-hash-bound",
      canonicalRendererRuntimeUnavailable: false,
      domains: [
        {
          id: "root",
          frameCount: 10,
          scenario: "root-unavailable",
          candidateRole: "canonical-source-root-disabled",
          independentlyAddressable: true,
        },
        {
          id: "sprite-145",
          frameCount: 52,
          scenario: "source-static-composite-prefix",
          candidateRole: "primary-source-static-sprite",
          independentlyAddressable: true,
        },
        {
          id: "sprite-100",
          frameCount: 1,
          scenario: "sprite-100-standalone-unavailable",
          candidateRole: "fixed-frame-composite-companion",
          independentlyAddressable: false,
        },
      ],
      evidenceFiles: [
        `migrations/${animationId}/evidence/dual-sprite-composite-current-js-candidate.json`,
        `migrations/${animationId}/audit/dual-sprite-composite-current-js-candidate-spec.json`,
        `public/flash-assets/courses/${animationId}/manifest.json`,
        `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
        `packages/demos/src/modules/${animationId}.tsx`,
        `packages/demos/src/timelines/${animationId}.ts`,
      ],
    };
  }
  invariant(
    animationId === FQ002_ID || animationId === FQ003_ID,
    `${animationId}: no G5 L4 product-candidate definition`,
  );
  return {
    memberClass: animationId === FQ002_ID
      ? G5_L4_MEMBER_CLASSES.fq002
      : G5_L4_MEMBER_CLASSES.fq003,
    bindingClass: "product-runtime-binding-only-outside-canonical-migration-fields",
    canonicalRendererRuntimeUnavailable: true,
    domains: [
      {
        id: "root",
        frameCount: 10,
        scenario: "root-unavailable",
        candidateRole: "canonical-source-root-disabled",
        independentlyAddressable: true,
      },
      {
        id: "sprite-694-question-atlas",
        frameCount: 18,
        scenario: "source-static-question-atlas-inspection",
        candidateRole: "derived-product-question-atlas",
        independentlyAddressable: true,
      },
    ],
    evidenceFiles: [
      `migrations/${animationId}/evidence/question-atlas-current-js-candidate.json`,
      `migrations/${animationId}/audit/question-atlas-current-js-candidate-spec.json`,
      `public/flash-assets/courses/${animationId}/manifest.json`,
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
      `packages/demos/src/modules/${animationId}.tsx`,
      `packages/demos/src/timelines/${animationId}.ts`,
      "packages/demos/src/g5-l4-fq23-question-atlas-candidate.tsx",
      "packages/demos/src/timelines/course-g05-l04-fq23-question-sequence.ts",
    ],
  };
}

async function buildRegisteredCandidateReport({
  member,
  manifest,
  probeRunner,
}) {
  const definition = candidateDefinitions(member.animationId);
  invariant(
    manifestRendererUnbound(manifest),
    `${member.animationId}: canonical migration renderer fields unexpectedly became bound`,
  );
  if (member.animationId === FQ001_ID) {
    const maturity = manifest.implementation?.candidateMaturity;
    invariant(
      maturity?.candidateKind === "dual-sprite-composite-prefix"
        && maturity.publicComposite?.frameDomain === "sprite-145"
        && maturity.publicComposite?.lastFrame === 52
        && maturity.publicComposite?.fixedCompanionFrameDomain === "sprite-100"
        && maturity.publicComposite?.fixedCompanionFrame === 1
        && maturity.canonicalFrameDomainsChanged === false
        && maturity.strictAcceptanceEffect === "none",
      "G5 L4 FQ001 candidate-maturity dual-sprite boundary drifted",
    );
  } else {
    const candidate = await readJson(
      path.join(
        ROOT,
        `migrations/${member.animationId}/evidence/question-atlas-current-js-candidate.json`,
      ),
    );
    invariant(
      candidate.animationId === member.animationId
        && candidate.engineeringCandidateOnly === true
        && candidate.questionAtlas?.frameDomain
          === "sprite-694-question-atlas"
        && candidate.questionAtlas?.frameCount === 18
        && candidate.strictAcceptanceEffect === "none",
      `${member.animationId}: product question-atlas evidence boundary drifted`,
    );
  }
  const requests = buildCandidateProbeRequests(definition.domains);
  const probe = await runRegisteredProbe(
    member.animationId,
    requests,
    probeRunner,
  );
  const probes = evaluateCandidateProbes(
    requests,
    probe,
    member.animationId,
  );
  const generatedFrom = [];
  for (const relativePath of [
    `migrations/${member.animationId}/migration.json`,
    ...definition.evidenceFiles,
    "packages/demos/src/prototype-manifest.ts",
    "packages/demos/src/animation-registry.ts",
    "scripts/probe-renderer-frame-domain-support.ts",
    "scripts/build-g5-l4-renderer-frame-domain-support.mjs",
  ]) {
    generatedFrom.push(await fileBinding(relativePath));
  }
  const report = {
    schemaVersion: 1,
    evidenceType: "g5-l4-candidate-renderer-frame-domain-support-audit",
    releaseId: RELEASE_ID,
    releaseOrdinal: member.ordinal,
    animationId: member.animationId,
    memberClass: definition.memberClass,
    status: "current-javascript-candidate-audit-incomplete",
    runtimeBinding: {
      bindingClass: definition.bindingClass,
      canonicalMigrationRendererFieldsBound: false,
      registeredCandidateRuntimePresent: true,
      canonicalRendererRuntimeUnavailable:
        definition.canonicalRendererRuntimeUnavailable,
      canonicalManifestFrameDomainsChanged: false,
    },
    authorityStatement: [
      "This deterministic machine audit calls the registered current-JavaScript candidate module's pure getFrameState function.",
      "FQ001 sprite-100 is a fixed composite companion and is intentionally blocked as a standalone request.",
      "FQ002 and FQ003 expose a derived product question atlas only; the atlas is not promoted into the canonical migration renderer fields or a source runtime frame domain.",
      "Blocked root, Spanish, behavior, audio, natural-runtime, and Replay states remain blocked and are never counted as renderable.",
    ],
    candidateDomains: definition.domains,
    loadedRuntime: {
      prototypeKey: probe.prototypeKey,
      prototypeRuntime: probe.prototypeRuntime,
      moduleKey: probe.module.key,
      moduleMaturity: probe.module.maturity,
      moduleScenarioIds: probe.module.scenarios,
    },
    summary: {
      candidateDomainCount: definition.domains.length,
      probeCount: probes.length,
      exactIdentityCount: probes.filter(({identityExact}) => identityExact).length,
      renderableCount: probes.filter(({renderable}) => renderable).length,
      blockedCount: probes.filter(({blocked}) => blocked).length,
      fullyRenderable: probes.length > 0
        && probes.every(({renderable}) => renderable),
    },
    probes,
    generatedFrom,
    acceptanceBoundary: falseAcceptanceBoundary(),
    strictAcceptanceEffect:
      "none; candidate frame addressability does not establish original-runtime authority, fidelity, acceptance, strict completion, or publication",
  };
  return report;
}

async function buildShellStructuralReport(member, manifest) {
  invariant(
    member.animationId === SHELL_ID
      && manifestRendererUnbound(manifest)
      && manifest.runtime?.frameCount === 50,
    "G5 L4 Shell canonical renderer boundary drifted",
  );
  const rootManifestPath =
    `public/flash-assets/courses/${SHELL_ID}/root-frames/manifest.json`;
  const controlsManifestPath =
    `public/flash-assets/courses/${SHELL_ID}/control-assets/manifest.json`;
  const dispositionPath =
    `migrations/${SHELL_ID}/audit/frame-domain-disposition.json`;
  const rootManifest = await readJson(path.join(ROOT, rootManifestPath));
  const controlsManifest = await readJson(path.join(ROOT, controlsManifestPath));
  const disposition = await readJson(path.join(ROOT, dispositionPath));
  invariant(
    rootManifest.animationId === SHELL_ID
      && rootManifest.frames?.length === 50
      && rootManifest.strictAcceptanceEffect === "none"
      && controlsManifest.animationId === SHELL_ID
      && controlsManifest.assets?.length === 14
      && controlsManifest.strictAcceptanceEffect === "none"
      && disposition.animationId === SHELL_ID
      && disposition.summary?.dispositionCounts?.unresolved === 95,
    "G5 L4 Shell structural candidate evidence drifted",
  );
  const generatedFrom = [];
  for (const relativePath of [
    `migrations/${SHELL_ID}/migration.json`,
    dispositionPath,
    rootManifestPath,
    controlsManifestPath,
    "apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts",
    "scripts/build-g5-l4-renderer-frame-domain-support.mjs",
  ]) {
    generatedFrom.push(await fileBinding(relativePath));
  }
  return {
    schemaVersion: 1,
    evidenceType: "g5-l4-structural-product-shell-renderer-audit",
    releaseId: RELEASE_ID,
    releaseOrdinal: member.ordinal,
    animationId: SHELL_ID,
    memberClass: G5_L4_MEMBER_CLASSES.shell,
    status: "no-registered-canonical-renderer-runtime",
    runtimeBinding: {
      bindingClass: "structural-product-candidate-no-registered-runtime",
      canonicalMigrationRendererFieldsBound: false,
      registeredCandidateRuntimePresent: false,
      canonicalRendererRuntimeUnavailable: true,
      canonicalManifestFrameDomainsChanged: false,
    },
    authorityStatement: [
      "The Shell product candidate uses hash-bound FFDec root-frame exports, control assets, and a descriptor-driven lesson shell.",
      "Static root-frame exports are structural/product evidence, not calls to a pure renderer and not authoritative original-runtime execution.",
      "No renderer module, pure timeline, candidate frame-domain probe, canonical runtime binding, or strict acceptance is fabricated for the Shell.",
    ],
    structuralProductCandidate: {
      rootStaticExportFrameCount: rootManifest.frames.length,
      controlAssetCount: controlsManifest.assets.length,
      sourceFrameDomainDisposition: {
        declaredFrameDomainCount:
          disposition.summary.dispositionCounts["declared-frame-domain"],
        unresolvedTimelineCount:
          disposition.summary.dispositionCounts.unresolved,
      },
      rendererAddressableFrameDomainCount: 0,
      rendererProbeCount: 0,
    },
    summary: {
      candidateDomainCount: 0,
      probeCount: 0,
      exactIdentityCount: 0,
      renderableCount: 0,
      blockedCount: 0,
      fullyRenderable: false,
    },
    probes: [],
    generatedFrom,
    acceptanceBoundary: falseAcceptanceBoundary(),
    strictAcceptanceEffect:
      "none; structural Shell assets and product composition do not establish a canonical renderer runtime, original-runtime authority, fidelity, acceptance, strict completion, or publication",
  };
}

async function writeOrCheck(filePath, value, check) {
  const rendered = `${JSON.stringify(value, null, 2)}\n`;
  if (check) {
    let current;
    try {
      current = await readFile(filePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw new Error(
          `${portable(path.relative(ROOT, filePath))}: G5 L4 renderer audit is missing`,
        );
      }
      throw error;
    }
    invariant(
      current === rendered,
      `${portable(path.relative(ROOT, filePath))}: G5 L4 renderer audit is stale`,
    );
  } else {
    await mkdir(path.dirname(filePath), {recursive: true});
    await writeFile(filePath, rendered, "utf8");
  }
  return {
    path: portable(path.relative(ROOT, filePath)),
    sha256: digest(rendered),
  };
}

function validateSingleSpriteIndex(index, expectedIds) {
  invariant(
    index.schemaVersion === 1
      && index.evidenceType
        === "course-shell-pilot-renderer-frame-domain-support-index"
      && index.scope === "explicit-animation-id-selection"
      && index.pilotCount === 51
      && index.reports?.length === 51
      && JSON.stringify(index.reports.map(({animationId}) => animationId))
        === JSON.stringify(expectedIds),
    "G5 L4 51-member single-sprite renderer index scope drifted",
  );
  invariant(
    index.reports.every((report) => (
      report.declaredFrameDomainCount === 2
        && report.probeCount === 8
        && (
          (
            report.renderableCount === 2
              && report.blockedCount === 6
          )
            || (
              report.renderableCount === 1
                && report.blockedCount === 7
            )
        )
        && report.status === "renderer-frame-domain-support-incomplete"
    ))
      && index.totalProbeCount === 408
      && index.reports.filter(({renderableCount}) => renderableCount === 2)
        .length === 20
      && index.reports.filter(({renderableCount}) => renderableCount === 1)
        .length === 31
      && index.totalRenderableCount === 71
      && index.totalBlockedCount === 337
      && index.fullyRenderablePilotCount === 0,
    "G5 L4 single-sprite renderer probe aggregate drifted",
  );
}

export function validateG5L4RendererIndex(index, expectedIds) {
  invariant(
    index.schemaVersion === 1
      && index.evidenceType
        === "g5-l4-release-renderer-frame-domain-support-index"
      && index.releaseId === RELEASE_ID
      && index.scope === "all-55-release-members"
      && index.status === "renderer-frame-domain-support-incomplete"
      && index.memberCount === 55
      && index.members?.length === 55
      && JSON.stringify(index.members.map(({animationId}) => animationId))
        === JSON.stringify(expectedIds),
    "G5 L4 55-member renderer index identity or scope drifted",
  );
  invariant(
    index.classCounts?.[G5_L4_MEMBER_CLASSES.singleSprite] === 51
      && index.classCounts?.[G5_L4_MEMBER_CLASSES.fq001] === 1
      && index.classCounts?.[G5_L4_MEMBER_CLASSES.fq002] === 1
      && index.classCounts?.[G5_L4_MEMBER_CLASSES.fq003] === 1
      && index.classCounts?.[G5_L4_MEMBER_CLASSES.shell] === 1,
    "G5 L4 renderer member classification drifted",
  );
  invariant(
    index.summary?.canonicalMigrationRendererBindingCount === 51
      && index.summary?.candidateMaturityRendererBindingCount === 1
      && index.summary?.productOnlyRendererBindingCount === 2
      && index.summary?.structuralOnlyMemberCount === 1
      && index.summary?.deterministicPureRendererAuditedMemberCount === 54
      && index.summary?.singleSpriteEndpointProfiles?.full === 20
      && index.summary?.singleSpriteEndpointProfiles?.safePrefix === 31
      && index.summary?.canonicalRendererRuntimeUnavailableCount === 3
      && JSON.stringify(
        index.summary.canonicalRendererRuntimeUnavailableMembers,
      ) === JSON.stringify(CANONICAL_RUNTIME_UNAVAILABLE_IDS)
      && index.summary?.probeCount === 434
      && index.summary?.renderableCount === 77
      && index.summary?.blockedCount === 357
      && index.summary?.fullyRenderableMemberCount === 0,
    "G5 L4 renderer aggregate or no-fabrication boundary drifted",
  );
  invariant(
    Object.values(index.acceptanceBoundary || {}).every(
      (value) => value === false,
    )
      && index.strictAcceptanceEffect?.startsWith("none;"),
    "G5 L4 renderer audit acquired an acceptance or publication effect",
  );
  return index.summary;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export async function buildG5L4RendererSupport({
  check = false,
  canonicalBuilder = buildRendererFrameDomainSupport,
  probeRunner,
} = {}) {
  const releases = await readJson(RELEASE_PATH);
  const release = releases.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  const classified = classifyG5L4ReleaseMembers(release);
  const manifests = new Map();
  for (const member of classified) {
    const manifest = await readJson(
      path.join(MIGRATIONS_ROOT, member.animationId, "migration.json"),
    );
    invariant(
      manifest.status !== "complete"
        && manifest.acceptance?.ownerReview?.decision !== "accepted",
      `${member.animationId}: current task boundary expects strict/owner acceptance to remain false`,
    );
    manifests.set(member.animationId, manifest);
  }

  const singleMembers = classified.slice(0, 51);
  for (const member of singleMembers) {
    validateSingleSpriteManifest(
      manifests.get(member.animationId),
      member.animationId,
    );
  }
  const singleResult = await canonicalBuilder({
    ids: singleMembers.map(({animationId}) => animationId),
    indexPath: SINGLE_SPRITE_INDEX_PATH,
    check,
  });
  validateSingleSpriteIndex(
    singleResult.index,
    singleMembers.map(({animationId}) => animationId),
  );

  const specialReports = new Map();
  for (const member of classified.slice(51, 54)) {
    const report = await buildRegisteredCandidateReport({
      member,
      manifest: manifests.get(member.animationId),
      probeRunner,
    });
    const binding = await writeOrCheck(
      path.join(CANDIDATE_REPORT_ROOT, `${member.animationId}.json`),
      report,
      check,
    );
    specialReports.set(member.animationId, {report, binding});
  }
  const shellMember = classified[54];
  const shellReport = await buildShellStructuralReport(
    shellMember,
    manifests.get(SHELL_ID),
  );
  const shellBinding = await writeOrCheck(
    path.join(CANDIDATE_REPORT_ROOT, `${SHELL_ID}.json`),
    shellReport,
    check,
  );
  specialReports.set(SHELL_ID, {
    report: shellReport,
    binding: shellBinding,
  });

  const singleById = new Map(
    singleResult.results.map((result) => [result.animationId, result]),
  );
  const members = classified.map((member) => {
    if (member.memberClass === G5_L4_MEMBER_CLASSES.singleSprite) {
      const result = singleById.get(member.animationId);
      invariant(result, `${member.animationId}: single-sprite audit omitted`);
      return {
        ordinal: member.ordinal,
        animationId: member.animationId,
        memberClass: member.memberClass,
        runtimeBindingClass: "manifest-implementation-hash-bound",
        canonicalRendererRuntimeUnavailable: false,
        audit: {
          path: portable(path.relative(ROOT, result.outputPath)),
          sha256: result.reportSha256,
          evidenceType: result.report.evidenceType,
          status: result.report.status,
        },
        probeCount: result.report.summary.probeCount,
        renderableCount: result.report.summary.renderableCount,
        blockedCount: result.report.summary.blockedCount,
        fullyRenderable: false,
      };
    }
    const special = specialReports.get(member.animationId);
    invariant(special, `${member.animationId}: special renderer audit omitted`);
    return {
      ordinal: member.ordinal,
      animationId: member.animationId,
      memberClass: member.memberClass,
      runtimeBindingClass: special.report.runtimeBinding.bindingClass,
      canonicalRendererRuntimeUnavailable:
        special.report.runtimeBinding.canonicalRendererRuntimeUnavailable,
      audit: {
        ...special.binding,
        evidenceType: special.report.evidenceType,
        status: special.report.status,
      },
      probeCount: special.report.summary.probeCount,
      renderableCount: special.report.summary.renderableCount,
      blockedCount: special.report.summary.blockedCount,
      fullyRenderable: false,
    };
  });
  const classCounts = Object.fromEntries(
    Object.values(G5_L4_MEMBER_CLASSES).map((memberClass) => [
      memberClass,
      members.filter((member) => member.memberClass === memberClass).length,
    ]),
  );
  const index = {
    schemaVersion: 1,
    evidenceType: "g5-l4-release-renderer-frame-domain-support-index",
    releaseId: RELEASE_ID,
    scope: "all-55-release-members",
    status: "renderer-frame-domain-support-incomplete",
    memberCount: members.length,
    classCounts,
    generatedFrom: {
      releaseDeclaration: await fileBinding(
        "catalog/lesson-releases.json",
      ),
      singleSpriteIndex: await fileBinding(
        "reports/g5-l4-source-static-renderer-frame-domain-support-index.json",
      ),
      builder: await fileBinding(
        "scripts/build-g5-l4-renderer-frame-domain-support.mjs",
      ),
    },
    summary: {
      canonicalMigrationRendererBindingCount: 51,
      candidateMaturityRendererBindingCount: 1,
      productOnlyRendererBindingCount: 2,
      structuralOnlyMemberCount: 1,
      deterministicPureRendererAuditedMemberCount: 54,
      singleSpriteEndpointProfiles: {
        full: singleResult.index.reports.filter(
          ({renderableCount}) => renderableCount === 2,
        ).length,
        safePrefix: singleResult.index.reports.filter(
          ({renderableCount}) => renderableCount === 1,
        ).length,
      },
      canonicalRendererRuntimeUnavailableCount: 3,
      canonicalRendererRuntimeUnavailableMembers:
        CANONICAL_RUNTIME_UNAVAILABLE_IDS,
      probeCount: members.reduce(
        (sum, member) => sum + member.probeCount,
        0,
      ),
      renderableCount: members.reduce(
        (sum, member) => sum + member.renderableCount,
        0,
      ),
      blockedCount: members.reduce(
        (sum, member) => sum + member.blockedCount,
        0,
      ),
      fullyRenderableMemberCount: members.filter(
        ({fullyRenderable}) => fullyRenderable,
      ).length,
    },
    members,
    acceptanceBoundary: falseAcceptanceBoundary(),
    strictAcceptanceEffect:
      "none; this complete release-scope engineering audit does not establish original-runtime authority, fidelity, human or owner acceptance, strict completion, or publication",
  };
  validateG5L4RendererIndex(
    index,
    classified.map(({animationId}) => animationId),
  );
  await writeOrCheck(INDEX_PATH, index, check);
  return {
    action: check ? "verified" : "written",
    index,
    indexPath: INDEX_PATH,
    singleResult,
    specialReports,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildG5L4RendererSupport(parseArguments(process.argv.slice(2))).then(
    (result) => {
      process.stdout.write(
        `${result.action}: G5 L4 renderer frame-domain audit covers `
          + `${result.index.memberCount}/55 members; `
          + `${result.index.summary.renderableCount}/`
          + `${result.index.summary.probeCount} pure-state probes renderable; `
          + "3 canonical renderer runtimes remain unavailable; "
          + "strict acceptance effect none.\n",
      );
    },
  ).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
