#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateScenarioInventory } from "./build-course-scenario-inventories.mjs";
import {
  assertSafeReportOutput,
  writeOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";
import {
  G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES,
} from "./build-lesson-static-strict-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const GENERATOR_PATH =
  "scripts/build-lesson-coverage-trace-obligation-matrix.mjs";
export const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
export const G5_L4_SOURCE_STATIC_CANDIDATE_IDS = Object.freeze([
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-in-009",
  "course-g05-l04-in-015",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-005",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-in-020",
  "course-g05-l04-in-012",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-in-002",
  "course-g05-l04-in-007",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-004",
  "course-g05-l04-in-018",
  "course-g05-l04-in-017",
  "course-g05-l04-in-016",
  "course-g05-l04-in-014",
  "course-g05-l04-in-013",
  "course-g05-l04-in-010",
  "course-g05-l04-in-005",
  "course-g05-l04-in-003",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-ts-008",
  "course-g05-l04-ts-007",
  "course-g05-l04-ir-001-a662633d",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
]);
export const G5_L4_SOURCE_STATIC_NESTED_SOURCE_INSTANCE_IDS = Object.freeze({
  "course-g05-l04-rw-002": "Animation",
  "course-g05-l04-rw-003": "Animation",
  "course-g05-l04-rw-004": "Animation",
});
const MEMBER_INPUTS = Object.freeze({
  migrationManifest: "migration.json",
  scenarioInventory: "audit/scenario-inventory.json",
  frameDomainDisposition: "audit/frame-domain-disposition.json",
  coverageV2: "evidence/full-frame-coverage.json",
});

export const ACCEPTANCE_EFFECTS = Object.freeze({
  authoringAccepted: false,
  audioAccepted: false,
  authoritativeOriginalRuntimeAccepted: false,
  currentJavaScriptCandidate: false,
  fidelityAccepted: false,
  fullFrameComparisonAccepted: false,
  humanVisualAccepted: false,
  implementationAuthorized: false,
  independentEngineeringAccepted: false,
  ownerAccepted: false,
  published: false,
  rmseAccepted: false,
  runtimeReachabilityEstablished: false,
  strictComplete: false,
});

export const PROTECTED_MUTATIONS = Object.freeze({
  memberWorkspaceFilesWritten: false,
  canonicalCoverageWritten: false,
  canonicalKeyframesWritten: false,
  traceSpecCreated: false,
  rendererSelected: false,
  implementationStarted: false,
  guiLaunched: false,
  browserLaunched: false,
  ruffleLaunched: false,
  originalRuntimeLaunched: false,
  reviewRecorded: false,
  acceptanceAdvanced: false,
  completionLedgerChanged: false,
  publicationChanged: false,
});

export const ROUTE_POLICIES = Object.freeze({
  "child-domain-authority-entry-state-trace-v1": {
    staticAuthority:
      "structural candidate only; the disposition is not runtime reachability evidence",
    futureAuthority:
      "authorized original-runtime natural host entry, or exact authoring/source evidence reviewed under the project evidence order",
    entryStateResolution:
      "prove the complete parent placement chain, parent frame, local entry frame, language, host state, and entry-state hash before assigning an independent or composite domain",
    traceResolution:
      "create a trace obligation only after reachability, disposition, and exact entry state are evidenced; preserve every local frame when independent-required",
    namedHumanRequired:
      "yes for original-runtime operation, observation, and session attestation",
  },
  "button-authority-entry-state-trace-v1": {
    staticAuthority:
      "button definition, encoded event, hit-record, and placement candidate only",
    futureAuthority:
      "authorized original-runtime natural interaction with source-evidenced placement and event identity",
    entryStateResolution:
      "resolve the containing frame domain, exact placement, language, host state, and stage-space target before interaction",
    traceResolution:
      "record ordered pointer/keyboard events and up, over, down, hit, result, terminal, and reset states for every reachable placement",
    namedHumanRequired:
      "yes for authoritative original-runtime interaction and attestation",
  },
  "drag-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported drag handler and static bound expression candidate only",
    futureAuthority:
      "authorized original-runtime natural drag observation with exact coordinates and source identity",
    entryStateResolution:
      "resolve containing domain, placement, start position, bounds, host variables, language, and entry-state hash",
    traceResolution:
      "record press/start, ordered coordinate samples, minimum/intermediate/maximum positions, release, releaseOutside where encoded, result, and Replay/reset",
    namedHumanRequired:
      "yes for authoritative original-runtime drag operation and attestation",
  },
  "branch-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported conditional expression candidate only; reachability and feasibility are unresolved",
    futureAuthority:
      "source-evidenced fixtures plus authorized original-runtime execution of every reachable outcome",
    entryStateResolution:
      "resolve all prerequisite values, containing domain, language, host state, and entry-state hash without guessing defaults",
    traceResolution:
      "record one ordered natural trace per reachable outcome; document an evidence-backed exception for an infeasible outcome",
    namedHumanRequired:
      "yes for authoritative original-runtime execution and attestation",
  },
  "random-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported random expression and outcome-shape candidate only",
    futureAuthority:
      "source-proven random domain and authorized original-runtime observation; deterministic seeds only when evidenced",
    entryStateResolution:
      "resolve containing domain, prerequisite array/range values, language, host state, and entry-state hash",
    traceResolution:
      "record the injected or observed outcome, seed/fixture authority, ordered events, resulting states, terminal behavior, and reset for every required outcome",
    namedHumanRequired:
      "yes for authoritative original-runtime observation and attestation",
  },
  "interaction-authority-entry-state-trace-v1": {
    staticAuthority: "static scenario obligation only",
    futureAuthority:
      "source evidence plus authorized original-runtime natural reachability",
    entryStateResolution:
      "resolve containing domain, exact prerequisite state, language, host state, and entry-state hash",
    traceResolution:
      "record the complete ordered natural trace, terminal state, and Replay/reset semantics",
    namedHumanRequired:
      "yes whenever original-runtime operation, listening, visual judgment, or attestation is required",
  },
});

const ADDITIONAL_CATEGORIES = Object.freeze([
  "timelineStateCoverage",
  "handlerBehaviorGroups",
  "inputObligations",
  "correctWrongObligations",
  "labeledStateObligations",
  "glossaryAndHyperlinkObligations",
  "sectionMenuObligations",
  "courseRouteObligations",
  "sideEffectObligations",
  "dependencyFixtureObligations",
  "replayCandidates",
  "terminalCandidates",
]);

const PROFILE_VALUES = [
  {
    releaseId: "lesson-g05-l04-number-lines",
    releaseLabel: "G5 L4",
    expectedReleaseFingerprint:
      "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc",
    expectedCounts: {
      members: 55,
      activeXmlReferencedPages: 54,
      courseShells: 1,
      shards: 3,
    },
    sourceStaticCandidateIds: G5_L4_SOURCE_STATIC_CANDIDATE_IDS,
  },
  {
    releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
    releaseLabel: "G5 L5",
    expectedReleaseFingerprint:
      "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84",
    expectedCounts: {
      members: 57,
      activeXmlReferencedPages: 56,
      courseShells: 1,
      shards: 3,
    },
    sourceStaticCandidateIds: Object.freeze([]),
  },
].map((profile) =>
  Object.freeze({
    ...profile,
    expectedCounts: Object.freeze(profile.expectedCounts),
    sourceStaticCandidateIds: Object.freeze([
      ...profile.sourceStaticCandidateIds,
    ]),
    expectedRootLanguages: Object.freeze(["en", "es"]),
    expectedRootScenario: "default",
    releaseCatalogPath: RELEASE_CATALOG_PATH,
    generatorPath: GENERATOR_PATH,
    reportJsonPath: `reports/release-coverage-trace-obligations/${profile.releaseId}.json`,
    reportMarkdownPath: `reports/release-coverage-trace-obligations/${profile.releaseId}.md`,
  }),
);

export const RELEASE_PROFILES = Object.freeze(
  Object.fromEntries(
    PROFILE_VALUES.map((profile) => [profile.releaseId, profile]),
  ),
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprint(value) {
  return sha256(Buffer.from(stableJson(value)));
}

function withFingerprint(value) {
  return { ...value, artifactFingerprintSha256: fingerprint(value) };
}

export function releaseDefinitionFingerprint(release) {
  return fingerprint(release);
}

function validateFingerprint(document, label) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  invariant(
    SHA256_PATTERN.test(document.artifactFingerprintSha256 || "") &&
      document.artifactFingerprintSha256 === fingerprint(projected),
    `${label}: artifact fingerprint is invalid`,
  );
}

function assertAllFalse(object, label) {
  invariant(isObject(object), `${label}: object is required`);
  for (const [key, value] of Object.entries(object)) {
    invariant(value === false, `${label}.${key} must be false`);
  }
}

function projectRelativePath(relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const normalized = portable(path.normalize(relativePath));
  invariant(
    normalized === relativePath &&
      relativePath !== ".." &&
      !relativePath.startsWith("../"),
    `${label}: path must be normalized and contained`,
  );
  return relativePath;
}

function normalizeProfile(profile) {
  invariant(isObject(profile), "release profile is required");
  invariant(
    SAFE_ID.test(profile.releaseId || ""),
    "release profile ID is invalid",
  );
  invariant(
    typeof profile.releaseLabel === "string" && profile.releaseLabel.length > 0,
    "release profile label is required",
  );
  invariant(
    SHA256_PATTERN.test(profile.expectedReleaseFingerprint || ""),
    "expected release fingerprint is invalid",
  );
  const counts = profile.expectedCounts;
  invariant(
    Number.isSafeInteger(counts?.members) &&
      counts.members > 0 &&
      Number.isSafeInteger(counts.activeXmlReferencedPages) &&
      counts.activeXmlReferencedPages >= 0 &&
      Number.isSafeInteger(counts.courseShells) &&
      counts.courseShells > 0 &&
      Number.isSafeInteger(counts.shards) &&
      counts.shards > 0 &&
      counts.activeXmlReferencedPages + counts.courseShells === counts.members,
    "release profile expected counts are invalid",
  );
  invariant(
    Array.isArray(profile.expectedRootLanguages) &&
      profile.expectedRootLanguages.length > 0 &&
      new Set(profile.expectedRootLanguages).size ===
        profile.expectedRootLanguages.length &&
      profile.expectedRootLanguages.every((language) =>
        /^[a-z]{2,8}$/.test(language),
      ),
    "expected root languages are invalid",
  );
  invariant(
    typeof profile.expectedRootScenario === "string" &&
      profile.expectedRootScenario.length > 0,
    "expected root scenario is invalid",
  );
  const sourceStaticCandidateIds = profile.sourceStaticCandidateIds || [];
  invariant(
    Array.isArray(sourceStaticCandidateIds) &&
      new Set(sourceStaticCandidateIds).size ===
        sourceStaticCandidateIds.length &&
      sourceStaticCandidateIds.every((animationId) =>
        SAFE_ID.test(animationId),
      ),
    "source-static candidate IDs are invalid",
  );
  for (const [key, value] of [
    ["releaseCatalogPath", profile.releaseCatalogPath],
    ["generatorPath", profile.generatorPath],
    ["reportJsonPath", profile.reportJsonPath],
    ["reportMarkdownPath", profile.reportMarkdownPath],
  ]) {
    projectRelativePath(value, key);
  }
  invariant(
    profile.reportJsonPath.startsWith("reports/") &&
      profile.reportJsonPath.endsWith(".json") &&
      profile.reportMarkdownPath.startsWith("reports/") &&
      profile.reportMarkdownPath.endsWith(".md"),
    "report outputs must be JSON/Markdown files below reports/",
  );
  return profile;
}

export function releaseProfileForId(releaseId) {
  const profile = RELEASE_PROFILES[releaseId];
  invariant(profile, `unsupported coverage/trace release: ${releaseId}`);
  return normalizeProfile(profile);
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function readRegularProjectFile(
  root,
  relativePath,
  { json = false, label = relativePath } = {},
) {
  const projectRoot = await realpath(path.resolve(root));
  projectRelativePath(relativePath, label);
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes root`);
  const relativeParent = path.relative(projectRoot, path.dirname(absolutePath));
  const parts = relativeParent.split(path.sep).filter(Boolean);
  for (let index = 0; index <= parts.length; index += 1) {
    const ancestor = path.join(projectRoot, ...parts.slice(0, index));
    const information = await lstat(ancestor);
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory`,
    );
  }
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const realFile = await realpath(absolutePath);
  invariant(isWithin(projectRoot, realFile), `${label}: resolves outside root`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs,
    `${label}: changed while it was read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    document,
  };
}

function descriptor(binding) {
  return {
    path: binding.path,
    bytes: binding.byteCount,
    sha256: binding.sha256,
  };
}

function validateRelease(catalog, profile) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "lesson release catalog schema is invalid",
  );
  const matches = catalog.releases.filter(
    ({ releaseId }) => releaseId === profile.releaseId,
  );
  invariant(
    matches.length === 1,
    `expected exactly one release ${profile.releaseId}`,
  );
  const release = matches[0];
  const counts = profile.expectedCounts;
  invariant(
    release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.members === counts.members &&
      release.expectedCounts?.activeXmlReferencedPages ===
        counts.activeXmlReferencedPages &&
      release.expectedCounts?.courseShells === counts.courseShells &&
      release.expectedCounts?.shards === counts.shards &&
      release.members?.length === counts.members &&
      release.shards?.length === counts.shards,
    `${profile.releaseId}: release shape drifted`,
  );
  invariant(
    releaseDefinitionFingerprint(release) ===
      profile.expectedReleaseFingerprint,
    `${profile.releaseId}: release fingerprint drifted`,
  );
  const ids = new Set();
  const assets = new Set();
  const sources = new Set();
  let pages = 0;
  let shells = 0;
  for (const [index, member] of release.members.entries()) {
    invariant(
      member.ordinal === index + 1 &&
        SAFE_ID.test(member.animationId || "") &&
        !ids.has(member.animationId) &&
        typeof member.assetId === "string" &&
        member.assetId === `swf-${member.source?.sha256}` &&
        !assets.has(member.assetId) &&
        SHA256_PATTERN.test(member.source?.sha256 || "") &&
        typeof member.source?.path === "string" &&
        member.source.path.length > 0 &&
        !sources.has(member.source.path),
      `${profile.releaseId}: member ${index + 1} identity drifted`,
    );
    projectRelativePath(member.source.path, `${member.animationId}: source`);
    ids.add(member.animationId);
    assets.add(member.assetId);
    sources.add(member.source.path);
    if (member.releaseRole === "active-xml-referenced-page") pages += 1;
    else if (member.releaseRole === "course-shell") shells += 1;
    else throw new Error(`${member.animationId}: unsupported release role`);
  }
  invariant(
    pages === counts.activeXmlReferencedPages && shells === counts.courseShells,
    `${profile.releaseId}: page/shell member counts drifted`,
  );
  invariant(
    (profile.sourceStaticCandidateIds || []).every((animationId) =>
      ids.has(animationId),
    ),
    `${profile.releaseId}: source-static candidate membership drifted`,
  );
  return release;
}

function sourceStaticCandidateSelected(profile, member) {
  return (profile.sourceStaticCandidateIds || []).includes(member.animationId);
}

function sourceStaticNestedSourceInstanceId(member) {
  return (
    G5_L4_SOURCE_STATIC_NESTED_SOURCE_INSTANCE_IDS[member.animationId] ??
    "animation"
  );
}

function validateManifest(manifest, member, profile) {
  invariant(
    manifest?.schemaVersion === 2 &&
      (manifest.id || manifest.animationId) === member.animationId &&
      manifest.status === "preserved" &&
      manifest.assetId === member.assetId,
    `${member.animationId}: manifest identity/status drifted`,
  );
  invariant(
    manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf?.endsWith(member.source.path),
    `${member.animationId}: manifest source binding drifted`,
  );
  invariant(
    Number.isSafeInteger(manifest.runtime?.frameCount) &&
      manifest.runtime.frameCount > 0 &&
      Number.isFinite(manifest.runtime?.fps) &&
      manifest.runtime.fps > 0,
    `${member.animationId}: manifest root timeline facts are invalid`,
  );
  const domains = manifest.implementation?.frameDomains;
  const sourceStaticCandidate = sourceStaticCandidateSelected(profile, member);
  if (sourceStaticCandidate) {
    const root = domains?.find(({ id }) => id === "root");
    const nested = domains?.find(({ kind }) => kind === "nested");
    const candidate = manifest.implementation?.candidateState;
    const sharedCandidateProfile =
      G5_L4_SOURCE_STATIC_CANDIDATE_PROFILES[member.animationId];
    invariant(
      profile.releaseId !== "lesson-g05-l04-number-lines" ||
        Boolean(sharedCandidateProfile),
      `${member.animationId}: built-in source-static candidate profile is missing`,
    );
    const candidateProfile = sharedCandidateProfile ?? {
      frameDomainId: nested?.id,
      nestedFrameCount: nested?.frameCount,
      renderedFrameCount: candidate?.renderedFrameCount,
      blockedLocalFrameRanges: candidate?.blockedLocalFrameRanges,
      manifestBound: true,
    };
    invariant(
      candidateProfile &&
        candidateProfile.manifestBound !== false &&
        nested?.id === candidateProfile.frameDomainId &&
        nested?.frameCount === candidateProfile.nestedFrameCount,
      `${member.animationId}: source-static candidate profile drifted`,
    );
    invariant(
      Array.isArray(domains) &&
        domains.length === 2 &&
        new Set(domains.map(({ id }) => id)).size === 2 &&
        root?.kind === "root" &&
        root.sourceTimelineId === "root" &&
        root.sourceInstanceId === "root" &&
        root.parentFrameDomainId === null &&
        root.frameCount === manifest.runtime.frameCount &&
        JSON.stringify(root.scenarioIds) ===
          JSON.stringify(["root-unavailable"]) &&
        nested?.sourceTimelineId === nested.id &&
        nested.sourceInstanceId ===
          sourceStaticNestedSourceInstanceId(member) &&
        nested.parentFrameDomainId === "root" &&
        Number.isSafeInteger(nested.parentEntryFrame) &&
        nested.parentEntryFrame > 0 &&
        nested.localEntryFrame === 1 &&
        Number.isSafeInteger(nested.frameCount) &&
        nested.frameCount > 0 &&
        JSON.stringify(nested.scenarioIds) ===
          JSON.stringify(["source-static-frame"]) &&
        manifest.implementation.defaultFrameDomainId === nested.id,
      `${member.animationId}: source-static root/nested frame-domain declaration drifted`,
    );
    invariant(
      typeof manifest.implementation.rendering === "string" &&
        manifest.implementation.rendering.includes(
          "source-static Canvas engineering candidate",
        ) &&
        manifest.implementation.route === `/animations/${member.animationId}` &&
        [
          "routeFile",
          "component",
          "registryModule",
          "timelineModule",
          "testFile",
        ].every(
          (key) =>
            typeof manifest.implementation[key] === "string" &&
            manifest.implementation[key].length > 0,
        ) &&
        manifest.implementation.standalonePackage === "",
      `${member.animationId}: source-static implementation binding drifted`,
    );
    const renderedFrameCount =
      candidateProfile.renderedFrameCount ??
      candidateProfile.nestedFrameCount;
    const prefixBoundary =
      renderedFrameCount < candidateProfile.nestedFrameCount;
    invariant(
      candidate?.status === "current-javascript-engineering-candidate-only" &&
        candidate.sourceStaticFrameDomain === nested.id &&
        candidate.sourceStaticFrames?.firstFrame === 1 &&
        candidate.sourceStaticFrames?.lastFrame === nested.frameCount &&
        candidate.renderedFrameCount === renderedFrameCount &&
        (prefixBoundary
          ? candidate.sourceStaticRenderableFrames?.firstFrame === 1 &&
            candidate.sourceStaticRenderableFrames?.lastFrame ===
              renderedFrameCount &&
            candidate.sourceStaticRenderableFrames?.frameCount ===
              renderedFrameCount &&
            JSON.stringify(candidate.blockedLocalFrameRanges) ===
              JSON.stringify(candidateProfile.blockedLocalFrameRanges)
          : candidate.sourceStaticRenderableFrames === undefined &&
            candidate.blockedLocalFrameRanges === undefined) &&
        candidate.rootEnabled === false &&
        candidate.spanishEnabled === false &&
        candidate.audioEnabled === false &&
        candidate.sourceControlsEnabled === false &&
        candidate.replayParityEstablished === false &&
        candidate.originalRuntimeBaselineUsed === false &&
        candidate.rmseComputed === false &&
        candidate.humanVisualReviewPerformed === false &&
        candidate.ownerReviewPerformed === false &&
        candidate.strictAcceptanceEffect === "none",
      `${member.animationId}: source-static candidate evidence boundary drifted`,
    );
    const planning = manifest.implementation.capturePlanning;
    invariant(
      planning?.nestedFrameDomainDispositionEstablished === true &&
        planning.nestedFrameDomainDeclaredInCurrentManifest === true &&
        planning.conservativeNestedDomainRequirementsEstablished === true &&
        JSON.stringify(planning.conservativeNestedFrameDomainIds) ===
          JSON.stringify([nested.id]) &&
        planning.rootNaturalTraceExecuted === false &&
        planning.authoritativeScenarioInventoryEstablished === false &&
        planning.authoritativeRuntimeFrameDomainDispositionEstablished ===
          false &&
        planning.structuralFrameDomainPlanningClosed === false &&
        planning.runtimeReachabilityEstablished === false &&
        planning.strictAcceptanceEffect === "none",
      `${member.animationId}: source-static capture planning boundary drifted`,
    );
  } else {
    invariant(
      Array.isArray(domains) &&
        domains.length === 1 &&
        domains[0].id === "root" &&
        domains[0].kind === "root" &&
        domains[0].sourceTimelineId === "root" &&
        domains[0].frameCount === manifest.runtime.frameCount,
      `${member.animationId}: expected a root-only static declaration`,
    );
    invariant(
      manifest.implementation?.rendering === "undecided" &&
        manifest.implementation?.route === "" &&
        manifest.implementation?.routeFile === "" &&
        manifest.implementation?.component === "" &&
        manifest.implementation?.registryModule === "" &&
        manifest.implementation?.timelineModule === "" &&
        manifest.implementation?.testFile === "" &&
        manifest.implementation?.standalonePackage === "",
      `${member.animationId}: renderer or implementation artifact was selected`,
    );
  }
  for (const [name, decision] of [
    ["engineering", manifest.acceptance?.engineeringReview],
    ["human visual", manifest.acceptance?.humanVisualReview],
    ["Owner", manifest.acceptance?.ownerReview],
  ]) {
    invariant(
      decision?.decision === "pending" &&
        decision.reviewer === "" &&
        decision.reviewedAt === "",
      `${member.animationId}: ${name} acceptance was not pending`,
    );
  }
  return {
    sourceStaticCandidate,
    domains,
  };
}

function validateCoverage(
  coverage,
  member,
  manifest,
  manifestProfile,
  profile,
) {
  const expectedLanguages = profile.expectedRootLanguages;
  const expectedDomains = manifestProfile.domains;
  const expectedRequirementCount =
    expectedDomains.length * expectedLanguages.length;
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === expectedRequirementCount,
    `${member.animationId}: declared frame-domain coverage requirement count drifted`,
  );
  const domainLanguages = new Set();
  const requirements = [];
  let missingFrameCount = 0;
  let rootMissingFrameCount = 0;
  let nestedMissingFrameCount = 0;
  for (const requirement of coverage.requirements) {
    const domain = expectedDomains.find(
      ({ id }) => id === requirement.frameDomainId,
    );
    const domainLanguage = `${requirement.frameDomainId}:${requirement.language}`;
    const expectedScenario = manifestProfile.sourceStaticCandidate
      ? domain?.scenarioIds?.[0]
      : profile.expectedRootScenario;
    invariant(
      domain &&
        domain.scenarioIds?.length === 1 &&
        requirement.scenario === expectedScenario &&
        expectedLanguages.includes(requirement.language) &&
        !domainLanguages.has(domainLanguage) &&
        typeof requirement.requirementId === "string" &&
        requirement.requirementId.length > 0 &&
        typeof requirement.traceId === "string" &&
        requirement.traceId.length > 0 &&
        SHA256_PATTERN.test(requirement.entryStateSha256 || "") &&
        requirement.status === "pending" &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.capturedFrameCount === 0 &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === domain.frameCount &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === domain.frameCount &&
        requirement.missingFrames.every(
          (frame, index) => frame === index + 1,
        ) &&
        requirement.baselineCaptureManifest === "" &&
        (requirement.baselineCaptureManifestSha256 || "") === "" &&
        requirement.captureManifest === "" &&
        (requirement.captureManifestSha256 || "") === "" &&
        requirement.metricsFile === "" &&
        (requirement.metricsSha256 || "") === "",
      `${member.animationId}: coverage crossed the all-frames-pending boundary`,
    );
    if (manifestProfile.sourceStaticCandidate) {
      invariant(
        requirement.entryState?.authoritativeTraceExecuted === false &&
          requirement.entryState.frameDomainId === domain.id &&
          requirement.entryState.language === requirement.language &&
          requirement.entryState.scenario === requirement.scenario &&
          (domain.kind === "root" ||
            (requirement.entryState.runtimeReachabilityEstablished === false &&
              requirement.entryState.parentFrameDomainId ===
                domain.parentFrameDomainId &&
              requirement.entryState.sourceTimelineId ===
                domain.sourceTimelineId)),
        `${member.animationId}: source-static coverage entry-state boundary drifted`,
      );
    }
    domainLanguages.add(domainLanguage);
    missingFrameCount += requirement.missingFrames.length;
    if (domain.kind === "root") {
      rootMissingFrameCount += requirement.missingFrames.length;
    } else {
      nestedMissingFrameCount += requirement.missingFrames.length;
    }
    requirements.push({
      requirementId: requirement.requirementId,
      frameDomainId: requirement.frameDomainId,
      scenario: requirement.scenario,
      traceId: requirement.traceId,
      language: requirement.language,
      seed: requirement.seed,
      requiredRange: requirement.requiredRange,
      entryState: requirement.entryState,
      entryStateSha256: requirement.entryStateSha256,
      baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
      baselineAuthority: requirement.baselineAuthority,
      status: requirement.status,
      capturedFrameCount: 0,
      missingFrameCount: requirement.missingFrames.length,
    });
  }
  invariant(
    expectedDomains.every(({ id }) =>
      expectedLanguages.every((language) =>
        domainLanguages.has(`${id}:${language}`),
      ),
    ),
    `${member.animationId}: declared frame-domain language coverage is incomplete`,
  );
  const rootRequirementCount = requirements.filter(
    ({ frameDomainId }) => frameDomainId === "root",
  ).length;
  const nestedRequirementCount = requirements.length - rootRequirementCount;
  return {
    scope: manifestProfile.sourceStaticCandidate
      ? "declared-root-and-nested-provisional-multilingual-runtime-authority-unresolved"
      : "root-only-provisional-multilingual",
    frameDomainCount: expectedDomains.length,
    requirementCount: requirements.length,
    rootRequirementCount,
    nestedRequirementCount,
    pendingRequirementCount: requirements.length,
    missingFrameCount,
    rootMissingFrameCount,
    nestedMissingFrameCount,
    authoritativeBaselineCount: 0,
    traceSpecCount: 0,
    requirements,
  };
}

function validateScenario(document, member, releaseBinding, profile) {
  validateScenarioInventory(document);
  invariant(
    document.animationId === member.animationId &&
      document.source?.swfSha256 === member.source.sha256 &&
      document.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      document.migrationStatusChanged === false &&
      String(document.strictAcceptanceEffect || "").startsWith("none;") &&
      Array.isArray(document.coverage?.authoritativeRuntimeCoverage) &&
      document.coverage.authoritativeRuntimeCoverage.length === 0,
    `${member.animationId}: scenario inventory crossed the static-only boundary`,
  );
  const memberships = document.evidenceIndex.filter(
    ({ artifactId }) => artifactId === "lesson-release-membership",
  );
  invariant(
    memberships.length === 1 &&
      memberships[0].path === profile.releaseCatalogPath &&
      memberships[0].bytes === releaseBinding.byteCount &&
      memberships[0].sha256 === releaseBinding.sha256 &&
      memberships[0].releaseId === profile.releaseId &&
      memberships[0].expectedMemberCount === profile.expectedCounts.members &&
      memberships[0].animationId === member.animationId &&
      memberships[0].ordinal === member.ordinal &&
      memberships[0].assetId === member.assetId &&
      memberships[0].releaseRole === member.releaseRole &&
      memberships[0].sourcePath === member.source.path &&
      memberships[0].sourceSha256 === member.source.sha256,
    `${member.animationId}: scenario release binding drifted`,
  );
}

function validateFrameDomainDisposition(
  document,
  member,
  scenarioBinding,
  manifest,
  manifestProfile,
  profile,
) {
  const sourceStaticCandidate = manifestProfile.sourceStaticCandidate;
  invariant(
    document?.schemaVersion === 1 &&
      document.animationId === member.animationId &&
      (sourceStaticCandidate
        ? [
            "structurally-enumerated",
            "structurally-enumerated-dispositions-unresolved",
          ].includes(document.status)
        : document.status ===
          "structurally-enumerated-dispositions-unresolved") &&
      document.migrationStatusChanged === false &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${member.animationId}: frame-domain identity/status drifted`,
  );
  const generated = document.generatedFrom || {};
  invariant(
    generated.lessonReleaseCatalog?.releaseId === profile.releaseId &&
      generated.lessonReleaseCatalog?.member?.animationId ===
        member.animationId &&
      generated.lessonReleaseCatalog?.member?.ordinal === member.ordinal &&
      generated.lessonReleaseCatalog?.member?.assetId === member.assetId &&
      generated.lessonReleaseCatalog?.member?.sourceSha256 ===
        member.source.sha256 &&
      generated.scenarioInventory?.path === "audit/scenario-inventory.json" &&
      generated.scenarioInventory?.sha256 === scenarioBinding.sha256 &&
      generated.sourceSwf?.sha256 === member.source.sha256,
    `${member.animationId}: frame-domain input bindings drifted`,
  );
  const timelines = document.timelines;
  invariant(
    Array.isArray(timelines) &&
      timelines.length >= 1 &&
      new Set(timelines.map(({ timelineId }) => timelineId)).size ===
        timelines.length,
    `${member.animationId}: frame-domain timeline set is invalid`,
  );
  const root = timelines.find(({ timelineId }) => timelineId === "root");
  invariant(
    root?.disposition === "declared-frame-domain" &&
      root.frameCount === manifest.runtime.frameCount,
    `${member.animationId}: root frame-domain disposition drifted`,
  );
  const children = timelines.filter(({ timelineId }) => timelineId !== "root");
  let declaredChildren = [];
  let unresolvedChildren = [];
  if (sourceStaticCandidate) {
    const nestedDomain = manifestProfile.domains.find(
      ({ kind }) => kind === "nested",
    );
    const declaredChild = children.find(
      ({ timelineId }) => timelineId === nestedDomain.id,
    );
    const remainingChildren = children.filter(
      ({ timelineId }) => timelineId !== nestedDomain.id,
    );
    invariant(
      declaredChild?.sourceTimelineId === nestedDomain.sourceTimelineId &&
        declaredChild.frameCount === nestedDomain.frameCount &&
        declaredChild.structuralReachability ===
          "reachable-from-root-placement-graph" &&
        declaredChild.rootPlacement?.status === "proven-named-placement-chain" &&
        declaredChild.disposition === "declared-frame-domain" &&
        declaredChild.declaredFrameDomains?.length === 1 &&
        declaredChild.declaredFrameDomains[0].frameDomainId ===
          nestedDomain.id &&
        declaredChild.declaredFrameDomains[0].kind === "nested" &&
        declaredChild.declaredFrameDomains[0].sourceTimelineId ===
          nestedDomain.sourceTimelineId &&
        declaredChild.declaredFrameDomains[0].sourceInstanceId ===
          nestedDomain.sourceInstanceId &&
        declaredChild.declaredFrameDomains[0].parentFrameDomainId ===
          nestedDomain.parentFrameDomainId &&
        declaredChild.declaredFrameDomains[0].parentEntryFrame ===
          nestedDomain.parentEntryFrame &&
        declaredChild.declaredFrameDomains[0].localEntryFrame ===
          nestedDomain.localEntryFrame &&
        declaredChild.declaredFrameDomains[0].frameCount ===
          nestedDomain.frameCount,
      `${member.animationId}: declared nested frame-domain disposition drifted`,
    );
    invariant(
      remainingChildren.every(
        (timeline) =>
          timeline.structuralReachability ===
            "reachable-from-root-placement-graph" &&
          timeline.disposition === "unresolved" &&
          timeline.declaredFrameDomains?.length === 0 &&
          Number.isSafeInteger(timeline.frameCount) &&
          timeline.frameCount > 0,
      ),
      `${member.animationId}: an additional child domain was silently promoted`,
    );
    declaredChildren = [declaredChild];
    unresolvedChildren = remainingChildren;
    invariant(
      document.summary?.enumeratedTimelineCount === timelines.length &&
        document.summary?.dispositionCounts?.["declared-frame-domain"] === 2 &&
        document.summary?.dispositionCounts?.unresolved ===
          remainingChildren.length &&
        document.status ===
          (remainingChildren.length === 0
            ? "structurally-enumerated"
            : "structurally-enumerated-dispositions-unresolved"),
      `${member.animationId}: source-static frame-domain summary drifted`,
    );
  } else {
    invariant(
      children.every(
        (timeline) =>
          timeline.disposition === "unresolved" &&
          timeline.declaredFrameDomains?.length === 0 &&
          Number.isSafeInteger(timeline.frameCount) &&
          timeline.frameCount > 0,
      ),
      `${member.animationId}: a child domain was silently promoted`,
    );
    unresolvedChildren = children;
    invariant(
      document.summary?.enumeratedTimelineCount === timelines.length &&
        document.summary?.dispositionCounts?.["declared-frame-domain"] === 1 &&
        document.summary?.dispositionCounts?.unresolved === children.length,
      `${member.animationId}: frame-domain summary drifted`,
    );
  }
  invariant(
    Number.isSafeInteger(document.summary?.excludedNotProvenTimelineCount) &&
      document.summary.excludedNotProvenTimelineCount >= 0 &&
      Number.isSafeInteger(
        document.summary?.highRiskIndependentCandidateCount,
      ) &&
      document.summary.highRiskIndependentCandidateCount >= 0 &&
      document.summary.highRiskIndependentCandidateCount ===
        (document.summary.highRiskIndependentCandidates || []).length,
    `${member.animationId}: frame-domain summary drifted`,
  );
  return {
    children,
    declaredChildren,
    unresolvedChildren,
    excludedNotProvenTimelineCount:
      document.summary.excludedNotProvenTimelineCount,
    highRiskIndependentCandidateCount:
      document.summary.highRiskIndependentCandidateCount,
  };
}

function buildStructuralDefinitionSummary({
  scenario,
  manifest,
  dispositionSummary,
}) {
  invariant(
    Array.isArray(scenario.timelineInventory) &&
      scenario.timelineInventory.length >= 1,
    `${scenario.animationId}: scenario timeline inventory is missing`,
  );
  const root = scenario.timelineInventory.find(
    ({ timelineId }) => timelineId === "root",
  );
  invariant(
    root?.frameCount === manifest.runtime.frameCount,
    `${scenario.animationId}: scenario root frame count drifted`,
  );
  const nested = scenario.timelineInventory.filter(
    ({ timelineId }) => timelineId !== "root",
  );
  invariant(
    new Set(nested.map(({ timelineId }) => timelineId)).size ===
      nested.length &&
      nested.every(
        ({ frameCount }) => Number.isSafeInteger(frameCount) && frameCount > 0,
      ),
    `${scenario.animationId}: scenario nested timeline set is invalid`,
  );
  invariant(
    nested.length ===
      dispositionSummary.children.length +
        dispositionSummary.excludedNotProvenTimelineCount,
    `${scenario.animationId}: nested definitions do not reconcile to routed plus excluded dispositions`,
  );
  return {
    nestedDefinitionCount: nested.length,
    structurallyReachableUnresolvedChildCount:
      dispositionSummary.unresolvedChildren.length,
    declaredNestedFrameDomainCount: dispositionSummary.declaredChildren.length,
    runtimeAuthorityPendingDeclaredNestedCount:
      dispositionSummary.declaredChildren.length,
    excludedNotProvenTimelineCount:
      dispositionSummary.excludedNotProvenTimelineCount,
    longerThanRootCount: nested.filter(
      ({ frameCount }) => frameCount > root.frameCount,
    ).length,
    highRiskIndependentCandidateCount:
      dispositionSummary.highRiskIndependentCandidateCount,
    excludedNotProven: {
      count: dispositionSummary.excludedNotProvenTimelineCount,
      status: "static-definition-retained-root-reachability-not-proven",
      runnableRouteCreated: false,
      futureResolution:
        "retain in the definition census and prove root reachability before creating any entry-state or trace route; do not classify as dead code from absence alone",
    },
  };
}

function projectedEvidence(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(projectedEvidence);
  if (!isObject(value)) return value;
  const allowed = [
    "artifactId",
    "script",
    "line",
    "lineStart",
    "lineEnd",
    "timelineId",
    "objectId",
    "frame",
  ];
  return Object.fromEntries(
    allowed.filter((key) => key in value).map((key) => [key, value[key]]),
  );
}

function staticProjection(item, extra = {}) {
  return {
    ...extra,
    staticFingerprintSha256: fingerprint(item),
    evidence: projectedEvidence(item.evidence),
  };
}

function scenarioCount(coverage, category) {
  if (category === "replayCandidates" || category === "terminalCandidates") {
    return coverage.replayAndTerminalObligations?.[category]?.length || 0;
  }
  return coverage[category]?.length || 0;
}

function buildObligationRoutes(children, scenarioCoverage) {
  const childDomains = children.map((timeline) => ({
    obligationId: `child-domain-${timeline.timelineId}`,
    status:
      timeline.disposition === "declared-frame-domain"
        ? "pending-authoritative-runtime-reachability-entry-state-trace"
        : "pending-authoritative-reachability-disposition-entry-state-trace",
    routePolicyId: "child-domain-authority-entry-state-trace-v1",
    sourceTimelineId: timeline.sourceTimelineId,
    sourceObjectId: timeline.sourceObjectId,
    frameCount: timeline.frameCount,
    structuralReachability: timeline.structuralReachability,
    currentDisposition: timeline.disposition,
    rootPlacementStatus: timeline.rootPlacement?.status || "unresolved",
    riskLevel: timeline.riskAssessment?.level || "unresolved",
    riskSignals: timeline.riskAssessment?.signals || [],
    staticFingerprintSha256: fingerprint(timeline),
    sourceEvidence: {
      scenarioInventoryPath:
        timeline.sourceEvidence?.scenarioInventoryPath || null,
      scenarioInventorySha256:
        timeline.sourceEvidence?.scenarioInventorySha256 || null,
      swfmillPath: timeline.sourceEvidence?.swfmillPath || null,
      swfmillSha256: timeline.sourceEvidence?.swfmillSha256 || null,
    },
  }));
  const buttons = (scenarioCoverage.buttonTargetObligations || []).map(
    (item, index) =>
      staticProjection(item, {
        obligationId: `button-target-${String(item.buttonObjectId || index + 1)}-${index + 1}`,
        status: "pending-authoritative-reachability-entry-state-trace",
        routePolicyId: "button-authority-entry-state-trace-v1",
        buttonObjectId: item.buttonObjectId || null,
        encodedEventConditionCount: item.eventsEncodedByConditions?.length || 0,
        hitRecordCount: item.hitRecords?.length || 0,
        placementCount: item.placements?.length || 0,
      }),
  );
  const drags = (scenarioCoverage.dragObligations || []).map((item, index) =>
    staticProjection(item, {
      obligationId: `drag-${item.scriptId || index + 1}-${index + 1}`,
      status: "pending-authoritative-entry-state-coordinate-trace",
      routePolicyId: "drag-authority-entry-state-trace-v1",
      scriptId: item.scriptId || null,
      script: item.script || null,
      events: item.events || [],
      requiredStates: item.requiredStates || [],
      boundEvidenceCount: item.boundEvidence?.length || 0,
    }),
  );
  const conditionalBranches = (
    scenarioCoverage.conditionalBranchObligations || []
  ).map((item, index) =>
    staticProjection(item, {
      obligationId: item.obligationId || `condition-${index + 1}`,
      status: "pending-authoritative-reachability-entry-state-outcome-traces",
      routePolicyId: "branch-authority-entry-state-trace-v1",
      condition: item.condition || null,
      requiredOutcomes: item.requiredOutcomes || [],
      feasibility: item.feasibility || "unresolved",
    }),
  );
  const random = (scenarioCoverage.randomObligations || []).map((item, index) =>
    staticProjection(item, {
      obligationId: item.obligationId || `random-${index + 1}`,
      status: "pending-source-authority-entry-state-outcome-traces",
      routePolicyId: "random-authority-entry-state-trace-v1",
      expression: item.expression || null,
      requiredOutcomes: item.requiredOutcomes ?? null,
      deterministicHarness: item.deterministicHarness || "unresolved",
    }),
  );
  const additional = ADDITIONAL_CATEGORIES.map((category) => {
    const obligationCount = scenarioCount(scenarioCoverage, category);
    return {
      category,
      obligationCount,
      status:
        obligationCount > 0
          ? "pending-authority-entry-state-trace-resolution"
          : "no-static-candidate-in-current-inventory",
      routePolicyId: "interaction-authority-entry-state-trace-v1",
    };
  });
  return {
    childDomains,
    buttons,
    drags,
    conditionalBranches,
    random,
    additional,
  };
}

function obligationCounts(routes) {
  return {
    childDomainCandidates: routes.childDomains.length,
    buttonTargetObligations: routes.buttons.length,
    dragObligations: routes.drags.length,
    conditionalBranchObligations: routes.conditionalBranches.length,
    randomObligations: routes.random.length,
    ...Object.fromEntries(
      routes.additional.map(({ category, obligationCount }) => [
        category,
        obligationCount,
      ]),
    ),
  };
}

async function loadMember(root, member, releaseBinding, profile) {
  const workspace = `migrations/${member.animationId}`;
  const entries = await Promise.all(
    Object.entries(MEMBER_INPUTS).map(async ([key, suffix]) => [
      key,
      await readRegularProjectFile(root, `${workspace}/${suffix}`, {
        json: true,
        label: `${member.animationId}: ${key}`,
      }),
    ]),
  );
  const bindings = Object.fromEntries(entries);
  const manifest = bindings.migrationManifest.document;
  const scenario = bindings.scenarioInventory.document;
  const manifestProfile = validateManifest(manifest, member, profile);
  validateScenario(scenario, member, releaseBinding, profile);
  const disposition = validateFrameDomainDisposition(
    bindings.frameDomainDisposition.document,
    member,
    bindings.scenarioInventory,
    manifest,
    manifestProfile,
    profile,
  );
  const coverage = validateCoverage(
    bindings.coverageV2.document,
    member,
    manifest,
    manifestProfile,
    profile,
  );
  const structural = buildStructuralDefinitionSummary({
    scenario,
    manifest,
    dispositionSummary: disposition,
  });
  const routes = buildObligationRoutes(disposition.children, scenario.coverage);
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    releaseRole: member.releaseRole,
    batchId: member.batchId,
    shardId: member.shardId,
    assetId: member.assetId,
    sourceSha256: member.source.sha256,
    sourceStaticCandidate: manifestProfile.sourceStaticCandidate,
    bindings: Object.fromEntries(
      Object.entries(bindings).map(([key, binding]) => [
        key,
        descriptor(binding),
      ]),
    ),
    rootCoverage: coverage,
    structuralDefinitions: structural,
    obligationCounts: obligationCounts(routes),
    obligationRoutes: routes,
    runtimeReachabilityEstablished: false,
    acceptanceAdvanced: false,
  };
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function buildReport({
  release,
  releaseBinding,
  generatorBinding,
  members,
  profile,
}) {
  const scenarioCategories = [
    "buttonTargetObligations",
    "dragObligations",
    "conditionalBranchObligations",
    "randomObligations",
    ...ADDITIONAL_CATEGORIES,
  ];
  const rootRequirementCount = sum(
    members,
    ({ rootCoverage }) => rootCoverage.rootRequirementCount,
  );
  const nestedRequirementCount = sum(
    members,
    ({ rootCoverage }) => rootCoverage.nestedRequirementCount,
  );
  const declaredNestedFrameDomainCount = sum(
    members,
    ({ structuralDefinitions }) =>
      structuralDefinitions.declaredNestedFrameDomainCount,
  );
  return withFingerprint({
    schemaVersion: 1,
    reportType: "lesson-release-static-coverage-trace-obligation-matrix-v1",
    releaseId: profile.releaseId,
    title: `${profile.releaseLabel} ${release.titleDisplay} — Static Coverage/Trace Obligation Matrix`,
    state: "static-obligations-routed-runtime-authority-pending",
    generatedBy: {
      ...descriptor(generatorBinding),
      deterministic: true,
    },
    outputScope: {
      reportOnly: true,
      reportPaths: [profile.reportJsonPath, profile.reportMarkdownPath],
      memberWorkspaceOutputCount: 0,
      canonicalEvidenceOutputCount: 0,
    },
    release: {
      titleDisplay: release.titleDisplay,
      publicationMode: release.publicationMode,
      memberCount: release.members.length,
      pageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
      shardCount: release.expectedCounts.shards,
      sourceStaticCandidateCount: (profile.sourceStaticCandidateIds || [])
        .length,
      fingerprintSha256: profile.expectedReleaseFingerprint,
      catalog: descriptor(releaseBinding),
    },
    currentCanonicalCoverage: {
      scope:
        nestedRequirementCount > 0
          ? "declared-root-and-nested-provisional-multilingual-runtime-authority-unresolved"
          : "root-only-provisional-multilingual",
      declaredFrameDomainCount: members.length + declaredNestedFrameDomainCount,
      requirementCount: rootRequirementCount + nestedRequirementCount,
      rootRequirementCount,
      nestedRequirementCount,
      pendingRequirementCount: sum(
        members,
        ({ rootCoverage }) => rootCoverage.pendingRequirementCount,
      ),
      missingFrameCount: sum(
        members,
        ({ rootCoverage }) => rootCoverage.missingFrameCount,
      ),
      rootMissingFrameCount: sum(
        members,
        ({ rootCoverage }) => rootCoverage.rootMissingFrameCount,
      ),
      nestedMissingFrameCount: sum(
        members,
        ({ rootCoverage }) => rootCoverage.nestedMissingFrameCount,
      ),
      authoritativeBaselineCount: 0,
      implementationCaptureCount: 0,
      fullFrameComparisonCount: 0,
      traceSpecCount: 0,
    },
    frameDomainDisposition: {
      declaredRootCount: members.length,
      nestedDefinitionCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.nestedDefinitionCount,
      ),
      unresolvedChildCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.structurallyReachableUnresolvedChildCount,
      ),
      declaredNestedFrameDomainCount,
      runtimeAuthorityPendingDeclaredNestedCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.runtimeAuthorityPendingDeclaredNestedCount,
      ),
      excludedNotProvenCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.excludedNotProvenTimelineCount,
      ),
      longerThanRootCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.longerThanRootCount,
      ),
      highRiskIndependentCandidateCount: sum(
        members,
        ({ structuralDefinitions }) =>
          structuralDefinitions.highRiskIndependentCandidateCount,
      ),
      resolvedChildCount: declaredNestedFrameDomainCount,
      runtimeAuthoritativeChildCount: 0,
    },
    scenarioStaticObligations: Object.fromEntries(
      scenarioCategories.map((category) => [
        category,
        sum(members, ({ obligationCounts: counts }) => counts[category]),
      ]),
    ),
    routePolicies: ROUTE_POLICIES,
    members,
    authorityBoundary: [
      "This report is an acceptance-neutral machine-only static obligation matrix.",
      "A declared nested frame domain is a structural workspace fact only; it does not establish authoritative original-runtime reachability, entry-state identity, visual parity, or acceptance.",
      "Every current root or declared nested frame requirement, unresolved child-domain candidate, interaction, branch, random outcome candidate, terminal state, and Replay obligation remains pending its applicable future authority and ordered trace resolution.",
      "The generator writes only its aggregate JSON/Markdown reports; it does not edit a member workspace, canonical coverage/keyframes, a trace specification, renderer, review, ledger, or publication state.",
      "Original-runtime operation/attestation, listening, visual review, independent engineering review, Owner acceptance, strict completion, and publication remain separate future gates.",
    ],
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      browsersLaunched: 0,
      legacyEndpointsExecuted: 0,
      namedHumanAttestationsRecorded: 0,
    },
    protectedMutations: PROTECTED_MUTATIONS,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

function routeArrayValues(routes) {
  return [
    routes.childDomains,
    routes.buttons,
    routes.drags,
    routes.conditionalBranches,
    routes.random,
  ];
}

export function validateReleaseCoverageTraceObligationReport(
  document,
  { profile: rawProfile, release },
) {
  const profile = normalizeProfile(rawProfile);
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType ===
        "lesson-release-static-coverage-trace-obligation-matrix-v1" &&
      document.releaseId === profile.releaseId &&
      document.state ===
        "static-obligations-routed-runtime-authority-pending" &&
      document.release?.memberCount === profile.expectedCounts.members &&
      document.release?.pageCount ===
        profile.expectedCounts.activeXmlReferencedPages &&
      document.release?.shellCount === profile.expectedCounts.courseShells &&
      document.release?.shardCount === profile.expectedCounts.shards &&
      document.release?.sourceStaticCandidateCount ===
        (profile.sourceStaticCandidateIds || []).length &&
      document.release?.fingerprintSha256 ===
        profile.expectedReleaseFingerprint,
    "coverage/trace report identity or release binding drifted",
  );
  invariant(
    document.outputScope?.reportOnly === true &&
      JSON.stringify(document.outputScope.reportPaths) ===
        JSON.stringify([profile.reportJsonPath, profile.reportMarkdownPath]) &&
      document.outputScope.memberWorkspaceOutputCount === 0 &&
      document.outputScope.canonicalEvidenceOutputCount === 0,
    "coverage/trace report crossed the report-only boundary",
  );
  invariant(
    Array.isArray(document.members) &&
      document.members.length === profile.expectedCounts.members &&
      release.members.length === document.members.length,
    "coverage/trace member matrix is incomplete",
  );
  for (const [index, row] of document.members.entries()) {
    const member = release.members[index];
    const sourceStaticCandidate = sourceStaticCandidateSelected(
      profile,
      member,
    );
    const expectedRequirementCount =
      profile.expectedRootLanguages.length * (sourceStaticCandidate ? 2 : 1);
    const expectedScope = sourceStaticCandidate
      ? "declared-root-and-nested-provisional-multilingual-runtime-authority-unresolved"
      : "root-only-provisional-multilingual";
    invariant(
      row.ordinal === member.ordinal &&
        row.animationId === member.animationId &&
        row.assetId === member.assetId &&
        row.sourceSha256 === member.source.sha256 &&
        row.releaseRole === member.releaseRole &&
        row.shardId === member.shardId &&
        row.sourceStaticCandidate === sourceStaticCandidate &&
        row.rootCoverage?.scope === expectedScope &&
        row.rootCoverage.requirementCount === expectedRequirementCount &&
        row.rootCoverage.frameDomainCount === (sourceStaticCandidate ? 2 : 1) &&
        row.rootCoverage.rootRequirementCount ===
          profile.expectedRootLanguages.length &&
        row.rootCoverage.nestedRequirementCount ===
          (sourceStaticCandidate ? profile.expectedRootLanguages.length : 0) &&
        row.rootCoverage.pendingRequirementCount ===
          row.rootCoverage.requirementCount &&
        row.rootCoverage.authoritativeBaselineCount === 0 &&
        row.rootCoverage.traceSpecCount === 0 &&
        row.rootCoverage.requirements.every(
          (requirement) =>
            requirement.status === "pending" &&
            requirement.baselineAuthority === "unresolved" &&
            requirement.capturedFrameCount === 0 &&
            requirement.missingFrameCount > 0,
        ) &&
        row.runtimeReachabilityEstablished === false &&
        row.acceptanceAdvanced === false,
      `${member.animationId}: member report crossed its pending boundary`,
    );
    invariant(
      row.structuralDefinitions.nestedDefinitionCount ===
        row.structuralDefinitions.structurallyReachableUnresolvedChildCount +
          row.structuralDefinitions.declaredNestedFrameDomainCount +
          row.structuralDefinitions.excludedNotProvenTimelineCount &&
        row.structuralDefinitions.runtimeAuthorityPendingDeclaredNestedCount ===
          row.structuralDefinitions.declaredNestedFrameDomainCount &&
        row.structuralDefinitions.declaredNestedFrameDomainCount ===
          (sourceStaticCandidate ? 1 : 0) &&
        row.structuralDefinitions.excludedNotProven.runnableRouteCreated ===
          false &&
        row.obligationCounts.childDomainCandidates ===
          row.obligationRoutes.childDomains.length &&
        row.obligationCounts.buttonTargetObligations ===
          row.obligationRoutes.buttons.length &&
        row.obligationCounts.dragObligations ===
          row.obligationRoutes.drags.length &&
        row.obligationCounts.conditionalBranchObligations ===
          row.obligationRoutes.conditionalBranches.length &&
        row.obligationCounts.randomObligations ===
          row.obligationRoutes.random.length,
      `${member.animationId}: obligation routing counts drifted`,
    );
    invariant(
      routeArrayValues(row.obligationRoutes)
        .flat()
        .every(({ status }) => status.startsWith("pending-")) &&
        row.obligationRoutes.additional.every(
          ({ status }) =>
            status.startsWith("pending-") ||
            status === "no-static-candidate-in-current-inventory",
        ),
      `${member.animationId}: a routed obligation was promoted`,
    );
  }
  const aggregate = document.currentCanonicalCoverage;
  const aggregateRootRequirementCount = sum(
    document.members,
    ({ rootCoverage }) => rootCoverage.rootRequirementCount,
  );
  const aggregateNestedRequirementCount = sum(
    document.members,
    ({ rootCoverage }) => rootCoverage.nestedRequirementCount,
  );
  invariant(
    aggregate.requirementCount ===
      sum(
        document.members,
        ({ rootCoverage }) => rootCoverage.requirementCount,
      ) &&
      aggregate.rootRequirementCount === aggregateRootRequirementCount &&
      aggregate.nestedRequirementCount === aggregateNestedRequirementCount &&
      aggregate.requirementCount ===
        aggregateRootRequirementCount + aggregateNestedRequirementCount &&
      aggregate.declaredFrameDomainCount ===
        sum(
          document.members,
          ({ rootCoverage }) => rootCoverage.frameDomainCount,
        ) &&
      aggregate.scope ===
        (aggregateNestedRequirementCount > 0
          ? "declared-root-and-nested-provisional-multilingual-runtime-authority-unresolved"
          : "root-only-provisional-multilingual") &&
      aggregate.pendingRequirementCount === aggregate.requirementCount &&
      aggregate.missingFrameCount ===
        sum(
          document.members,
          ({ rootCoverage }) => rootCoverage.missingFrameCount,
        ) &&
      aggregate.rootMissingFrameCount ===
        sum(
          document.members,
          ({ rootCoverage }) => rootCoverage.rootMissingFrameCount,
        ) &&
      aggregate.nestedMissingFrameCount ===
        sum(
          document.members,
          ({ rootCoverage }) => rootCoverage.nestedMissingFrameCount,
        ) &&
      aggregate.missingFrameCount ===
        aggregate.rootMissingFrameCount + aggregate.nestedMissingFrameCount &&
      aggregate.authoritativeBaselineCount === 0 &&
      aggregate.implementationCaptureCount === 0 &&
      aggregate.fullFrameComparisonCount === 0 &&
      aggregate.traceSpecCount === 0,
    "aggregate root coverage crossed the pending boundary",
  );
  invariant(
    document.frameDomainDisposition.declaredRootCount ===
      document.members.length &&
      document.frameDomainDisposition.declaredNestedFrameDomainCount ===
        sum(
          document.members,
          ({ structuralDefinitions }) =>
            structuralDefinitions.declaredNestedFrameDomainCount,
        ) &&
      document.frameDomainDisposition
        .runtimeAuthorityPendingDeclaredNestedCount ===
        document.frameDomainDisposition.declaredNestedFrameDomainCount &&
      document.frameDomainDisposition.unresolvedChildCount ===
        sum(
          document.members,
          ({ structuralDefinitions }) =>
            structuralDefinitions.structurallyReachableUnresolvedChildCount,
        ) &&
      document.frameDomainDisposition.resolvedChildCount ===
        document.frameDomainDisposition.declaredNestedFrameDomainCount &&
      document.frameDomainDisposition.runtimeAuthoritativeChildCount === 0,
    "aggregate frame-domain disposition crossed the unresolved boundary",
  );
  assertAllFalse(document.protectedMutations, "report protectedMutations");
  assertAllFalse(document.acceptanceEffects, "report acceptanceEffects");
  invariant(
    document.execution?.runtimeSessionsExecuted === 0 &&
      document.execution?.guiApplicationsLaunched === 0 &&
      document.execution?.browsersLaunched === 0 &&
      document.execution?.legacyEndpointsExecuted === 0 &&
      document.execution?.namedHumanAttestationsRecorded === 0,
    "coverage/trace report records forbidden execution",
  );
  validateFingerprint(document, "coverage/trace report");
  return true;
}

export function renderMarkdown(report, jsonSha256) {
  const coverage = report.currentCanonicalCoverage;
  const lines = [
    `# ${report.title}`,
    "",
    `Release: \`${report.releaseId}\`  `,
    `Atomic members: **${report.release.memberCount}** (${report.release.pageCount} pages + ${report.release.shellCount} shell)  `,
    `Release fingerprint: \`${report.release.fingerprintSha256}\`  `,
    `JSON report SHA-256: \`${jsonSha256}\``,
    "",
    "## Current fail-closed baseline",
    "",
    `- Canonical coverage-v2 contains **${coverage.requirementCount}** requirements: ${coverage.rootRequirementCount} root and ${coverage.nestedRequirementCount} declared nested.`,
    `- All **${coverage.pendingRequirementCount}** requirements remain pending and baseline authority remains unresolved; **${coverage.missingFrameCount}** observations are missing (${coverage.rootMissingFrameCount} root + ${coverage.nestedMissingFrameCount} nested).`,
    `- Frame-domain disposition retains **${report.frameDomainDisposition.declaredRootCount}** declared roots, **${report.frameDomainDisposition.declaredNestedFrameDomainCount}** structurally declared nested domains whose runtime authority remains pending, and **${report.frameDomainDisposition.unresolvedChildCount}** unresolved child dispositions.`,
    `- Static inventory retains **${report.frameDomainDisposition.nestedDefinitionCount}** nested definitions: ${report.frameDomainDisposition.declaredNestedFrameDomainCount} declared nested, ${report.frameDomainDisposition.unresolvedChildCount} unresolved routed candidates, and ${report.frameDomainDisposition.excludedNotProvenCount} definitions whose root reachability is not proven.`,
    "- Authoritative baselines, implementation captures, comparisons, trace specifications, runtime sessions, reviews, strict completions, and publications remain zero.",
    "",
    "## Static obligation totals",
    "",
    "| Category | Count |",
    "|---|---:|",
    `| Declared nested domains, runtime authority pending | ${report.frameDomainDisposition.runtimeAuthorityPendingDeclaredNestedCount} |`,
    `| Unresolved child-domain dispositions | ${report.frameDomainDisposition.unresolvedChildCount} |`,
    `| Button targets | ${report.scenarioStaticObligations.buttonTargetObligations} |`,
    `| Drag obligations | ${report.scenarioStaticObligations.dragObligations} |`,
    `| Conditional branches | ${report.scenarioStaticObligations.conditionalBranchObligations} |`,
    `| Random obligations | ${report.scenarioStaticObligations.randomObligations} |`,
    "",
    "Every listed item remains pending future authority, exact entry-state identity, and ordered trace resolution. Static extraction is not runtime reachability evidence.",
    "",
    "## Per-member matrix",
    "",
    "| # | Member | Role | Source-static | Root req. | Nested req. | Missing | Nested definitions | Declared nested | Unresolved child | Excluded | Longer | High risk | Button | Drag | Branch | Random |",
    "|---:|---|---|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...report.members.map(
      (row) =>
        `| ${row.ordinal} | \`${row.animationId}\` | ${row.releaseRole} | ${row.sourceStaticCandidate ? "yes" : "no"} | ${row.rootCoverage.rootRequirementCount} | ${row.rootCoverage.nestedRequirementCount} | ${row.rootCoverage.missingFrameCount} | ${row.structuralDefinitions.nestedDefinitionCount} | ${row.structuralDefinitions.declaredNestedFrameDomainCount} | ${row.structuralDefinitions.structurallyReachableUnresolvedChildCount} | ${row.structuralDefinitions.excludedNotProvenTimelineCount} | ${row.structuralDefinitions.longerThanRootCount} | ${row.structuralDefinitions.highRiskIndependentCandidateCount} | ${row.obligationCounts.buttonTargetObligations} | ${row.obligationCounts.dragObligations} | ${row.obligationCounts.conditionalBranchObligations} | ${row.obligationCounts.randomObligations} |`,
    ),
    "",
    "## Authority boundary",
    "",
    "- This generator writes only the aggregate JSON and Markdown reports; it does not create per-member workspace plans.",
    "- It does not edit canonical coverage/keyframes, create trace specifications, select a renderer, start implementation, launch a browser/GUI/runtime, record review, advance acceptance, modify a ledger, or publish.",
    "- No original-runtime operation or attestation is recorded here. Audio, Spanish parity, RMSE/full-frame comparison, visual review, independent engineering review, Owner acceptance, strict validation, and atomic publication remain independent and unsatisfied.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export async function buildLessonCoverageTraceObligationMatrix(options = {}) {
  const root = await realpath(
    path.resolve(options.projectRoot || defaultProjectRoot),
  );
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be dry-run, apply, or check",
  );
  const profile = normalizeProfile(
    options.profile || releaseProfileForId(options.releaseId),
  );
  if (options.releaseId) {
    invariant(
      options.releaseId === profile.releaseId,
      "release ID differs from the selected profile",
    );
  }
  const [releaseBinding, generatorBinding] = await Promise.all([
    readRegularProjectFile(root, profile.releaseCatalogPath, {
      json: true,
      label: "lesson release catalog",
    }),
    readRegularProjectFile(root, profile.generatorPath, {
      label: "coverage/trace report generator",
    }),
  ]);
  const release = validateRelease(releaseBinding.document, profile);
  const members = [];
  for (const member of release.members) {
    members.push(await loadMember(root, member, releaseBinding, profile));
  }
  const report = buildReport({
    release,
    releaseBinding,
    generatorBinding,
    members,
    profile,
  });
  validateReleaseCoverageTraceObligationReport(report, { profile, release });
  const jsonText = stableJson(report);
  const markdownText = renderMarkdown(report, sha256(Buffer.from(jsonText)));
  const jsonOutput = path.resolve(root, profile.reportJsonPath);
  const markdownOutput = path.resolve(root, profile.reportMarkdownPath);
  await Promise.all([
    assertSafeReportOutput(jsonOutput, {
      root,
      extension: ".json",
    }),
    assertSafeReportOutput(markdownOutput, {
      root,
      extension: ".md",
    }),
  ]);
  if (mode === "apply") {
    await writeOrCheckReport(jsonOutput, jsonText, {
      root,
      extension: ".json",
    });
    await writeOrCheckReport(markdownOutput, markdownText, {
      root,
      extension: ".md",
    });
  } else if (mode === "check") {
    await writeOrCheckReport(jsonOutput, jsonText, {
      root,
      extension: ".json",
      check: true,
    });
    await writeOrCheckReport(markdownOutput, markdownText, {
      root,
      extension: ".md",
      check: true,
    });
  }
  return {
    action:
      mode === "apply" ? "written" : mode === "check" ? "verified" : "planned",
    releaseId: profile.releaseId,
    releaseFingerprintSha256: profile.expectedReleaseFingerprint,
    memberCount: members.length,
    outputCount: 2,
    workspaceOutputCount: 0,
    canonicalRequirementCount: report.currentCanonicalCoverage.requirementCount,
    rootOnlyRequirementCount:
      report.currentCanonicalCoverage.rootRequirementCount,
    nestedRequirementCount:
      report.currentCanonicalCoverage.nestedRequirementCount,
    pendingRequirementCount:
      report.currentCanonicalCoverage.pendingRequirementCount,
    missingFrameCount: report.currentCanonicalCoverage.missingFrameCount,
    unresolvedChildDomainCount:
      report.frameDomainDisposition.unresolvedChildCount,
    declaredNestedFrameDomainCount:
      report.frameDomainDisposition.declaredNestedFrameDomainCount,
    nestedDefinitionCount: report.frameDomainDisposition.nestedDefinitionCount,
    excludedNotProvenDefinitionCount:
      report.frameDomainDisposition.excludedNotProvenCount,
    branchObligationCount:
      report.scenarioStaticObligations.conditionalBranchObligations,
    randomObligationCount: report.scenarioStaticObligations.randomObligations,
    canonicalCoverageWritten: false,
    canonicalKeyframesWritten: false,
    traceSpecsCreated: 0,
    rendererSelected: false,
    guiApplicationsLaunched: 0,
    originalRuntimeSessionsExecuted: 0,
    acceptanceAdvanced: false,
    outputs: [
      {
        path: profile.reportJsonPath,
        bytes: Buffer.byteLength(jsonText),
        sha256: sha256(Buffer.from(jsonText)),
      },
      {
        path: profile.reportMarkdownPath,
        bytes: Buffer.byteLength(markdownText),
        sha256: sha256(Buffer.from(markdownText)),
      },
    ],
  };
}

export function parseArguments(argv) {
  invariant(Array.isArray(argv), "arguments must be an array");
  let releaseId = null;
  let mode = "dry-run";
  let explicitMode = null;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      invariant(!help, "help option may be supplied only once");
      help = true;
      continue;
    }
    if (argument === "--release-id") {
      invariant(releaseId === null, "--release-id may be supplied only once");
      releaseId = argv[index + 1] || null;
      invariant(
        releaseId && !releaseId.startsWith("--"),
        "--release-id requires a value",
      );
      index += 1;
      continue;
    }
    const candidate =
      argument === "--dry-run"
        ? "dry-run"
        : argument === "--apply"
          ? "apply"
          : argument === "--check"
            ? "check"
            : null;
    invariant(candidate, `unknown option: ${argument}`);
    invariant(
      explicitMode === null,
      "choose at most one of --dry-run, --apply, or --check",
    );
    explicitMode = candidate;
    mode = candidate;
  }
  invariant(
    !help || (releaseId === null && explicitMode === null),
    "--help cannot be combined with other options",
  );
  if (!help) {
    invariant(releaseId !== null, "--release-id is required");
    releaseProfileForId(releaseId);
  }
  return { releaseId, mode, help };
}

function usage() {
  return `Usage:
  node scripts/build-lesson-coverage-trace-obligation-matrix.mjs \\
    --release-id <release-id> [--dry-run|--apply|--check]

Default mode is --dry-run. The release profile pins exact atomic membership
and its release fingerprint. --apply may write only the two aggregate files
under reports/release-coverage-trace-obligations/. No mode writes a member
workspace, canonical coverage/keyframes, a trace specification, renderer,
review, ledger, or publication state, and no mode launches a GUI or runtime.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await buildLessonCoverageTraceObligationMatrix(options);
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
