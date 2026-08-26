#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const SHELL_ANIMATION_ID = "shell-course-g05-l04-index-local";
export const RW002_ANIMATION_ID = "course-g05-l04-rw-002";
export const REPORT_JSON =
  "reports/g5-l4-shell-rw002-runtime-preparation.json";
export const REPORT_MARKDOWN =
  "reports/g5-l4-shell-rw002-runtime-preparation.md";

const LANGUAGES = Object.freeze(["en", "es"]);
const HASH = /^[a-f0-9]{64}$/u;
const RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const AUTHORITY =
  "This report binds preserved static sources and current fail-closed planning artifacts, including eight acceptance-neutral machine-selected containment candidates with candidate implementations and bounded offline or diagnostic checks. It prepares two blocked candidate traces only. It records zero Owner technical approvals and zero live-session verifications, launches nothing, authorizes no runtime session, changes no canonical coverage, establishes no authoritative runtime frame-domain disposition, and establishes no fidelity or acceptance authority.";
const BLOCKERS = Object.freeze([
  Object.freeze({
    blockerId: "B01",
    status: "open",
    statement:
      "L4KTE01.xml and L4KTS01.xml remain missing; keyterm content and substitutes must not be invented.",
  }),
  Object.freeze({
    blockerId: "B02",
    status: "open",
    statement:
      "CR-02 has a materialized but incomplete read-only host-tree candidate; the missing lesson-local XML dependencies prevent technical completion.",
  }),
  Object.freeze({
    blockerId: "B03",
    status: "open",
    statement:
      "All eight containment engineering candidates are machine-selected and offline or diagnostically checked, but 0/8 have Owner technical approval or live-session verification.",
  }),
  Object.freeze({
    blockerId: "B04",
    status: "open",
    statement:
      "No immutable per-session authorization, authorized host, live operator attestation, or disposable profile is bound.",
  }),
  Object.freeze({
    blockerId: "B05",
    status: "open",
    statement:
      "Shell has 95 unresolved reachable child timelines; RW02 has two unresolved reachable child timelines, while its conservatively declared sprite-341 engineering-candidate domain still lacks authoritative runtime reachability.",
  }),
  Object.freeze({
    blockerId: "B06",
    status: "open",
    statement:
      "Natural runtime entry, terminal state, Replay target, and complete state reset have not been observed.",
  }),
  Object.freeze({
    blockerId: "B07",
    status: "open",
    statement:
      "L4RW02.mp3 is hash-bound with catalog language und; language, cue, audibility, synchronization, and Replay behavior remain unverified.",
  }),
  Object.freeze({
    blockerId: "B08",
    status: "open",
    statement:
      "No authoritative original-runtime session or frame/audio evidence exists for either language.",
  }),
]);

export const SOURCE_PINS = Object.freeze({
  shellSwf: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index_local.swf",
    lessonPath: "HELP_COURSES/ELMGR5/L4/index_local.swf",
    bytes: 658_851,
    sha256:
      "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301",
  }),
  introductionSwf: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
    lessonPath: "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
    bytes: 167_329,
    sha256:
      "14b8f7639027b324e9411c5d1e753432ed81c1fb3c23e211291c4b53f36c52dd",
  }),
  rw002Swf: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
    lessonPath: "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
    bytes: 495_690,
    sha256:
      "eaea3b8e3efe6ec9e095bb09980476577686d09c94b29439dfb07015c7abb81c",
  }),
  spanishAudioCandidate: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/SA/L4RW02.mp3",
    lessonPath: "HELP_COURSES/ELMGR5/L4/SA/L4RW02.mp3",
    bytes: 243_936,
    sha256:
      "b5e7f4cc6d36842db58edc63d96681c8eab31ccd3e109384b8194368809157de",
  }),
  courseXml: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml",
    lessonPath: "HELP_COURSES/ELMGR5/L4/index.xml",
    bytes: 11_841,
    sha256:
      "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36",
  }),
  mainScript: Object.freeze({
    path:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/AS/MainScript_New.as",
    lessonPath: "HELP_COURSES/ELMGR5/L4/AS/MainScript_New.as",
    bytes: 26_762,
    sha256:
      "390dd244881aa82f0d30c89e0e8da11cef38e1bff42be10a9ac377a882a0c0e7",
  }),
});

export const MISSING_KEYTERM_DEPENDENCIES = Object.freeze([
  Object.freeze({
    language: "en",
    declaredPath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
    physicalPath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  }),
  Object.freeze({
    language: "es",
    declaredPath: "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
    physicalPath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
  }),
]);

const INPUTS = Object.freeze({
  releaseCatalog: Object.freeze({
    path: "catalog/lesson-releases.json",
    json: true,
  }),
  sourceGap: Object.freeze({
    path: "reports/g5-l4-source-gap-forensics.json",
    json: true,
  }),
  containment: Object.freeze({
    path: "reports/g5-l4-original-runtime-containment-readiness.json",
    json: true,
  }),
  shellMigration: Object.freeze({
    path: `migrations/${SHELL_ANIMATION_ID}/migration.json`,
    json: true,
  }),
  shellCoverage: Object.freeze({
    path: `migrations/${SHELL_ANIMATION_ID}/evidence/full-frame-coverage.json`,
    json: true,
  }),
  shellScenario: Object.freeze({
    path: `migrations/${SHELL_ANIMATION_ID}/audit/scenario-inventory.json`,
    json: true,
  }),
  shellFrameDomains: Object.freeze({
    path: `migrations/${SHELL_ANIMATION_ID}/audit/frame-domain-disposition.json`,
    json: true,
  }),
  rw002Migration: Object.freeze({
    path: `migrations/${RW002_ANIMATION_ID}/migration.json`,
    json: true,
  }),
  rw002Coverage: Object.freeze({
    path: `migrations/${RW002_ANIMATION_ID}/evidence/full-frame-coverage.json`,
    json: true,
  }),
  rw002Scenario: Object.freeze({
    path: `migrations/${RW002_ANIMATION_ID}/audit/scenario-inventory.json`,
    json: true,
  }),
  rw002FrameDomains: Object.freeze({
    path: `migrations/${RW002_ANIMATION_ID}/audit/frame-domain-disposition.json`,
    json: true,
  }),
  shellSwf: Object.freeze({...SOURCE_PINS.shellSwf, json: false}),
  introductionSwf: Object.freeze({
    ...SOURCE_PINS.introductionSwf,
    json: false,
  }),
  rw002Swf: Object.freeze({...SOURCE_PINS.rw002Swf, json: false}),
  spanishAudioCandidate: Object.freeze({
    ...SOURCE_PINS.spanishAudioCandidate,
    json: false,
  }),
  courseXml: Object.freeze({...SOURCE_PINS.courseXml, json: false}),
  mainScript: Object.freeze({...SOURCE_PINS.mainScript, json: false}),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(
    actual.length === wanted.length &&
      actual.every((key, index) => key === wanted[index]),
    `${label}: unexpected or missing field`,
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(Buffer.from(canonicalJson(value)));
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be portable and project-relative`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function readBinding(root, relativePath, {json = true} = {}) {
  const absolutePath = resolveProjectPath(root, relativePath, relativePath);
  let current = root;
  for (const part of relativePath.split("/")) {
    current = path.join(current, part);
    const component = await lstat(current);
    invariant(!component.isSymbolicLink(),
      `${relativePath}: symbolic-link component is forbidden`);
  }
  const rootReal = await realpath(root);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relativePath} must be an ordinary single-link file`,
  );
  invariant(
    contained(rootReal, await realpath(absolutePath)),
    `${relativePath} resolves outside the project root`,
  );
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    after.dev === before.dev &&
      after.ino === before.ino &&
      after.size === bytes.length &&
      after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1,
    `${relativePath} changed while being read`,
  );
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  if (!json) return {binding, bytes, value: null};
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${relativePath} is not valid JSON: ${error.message}`);
  }
  return {binding, bytes, value};
}

function validatePhysicalPin(key, binding) {
  const pin = SOURCE_PINS[key];
  invariant(pin, `unknown source pin: ${key}`);
  invariant(
    binding.path === pin.path &&
      binding.bytes === pin.bytes &&
      binding.sha256 === pin.sha256,
    `${key} source identity drifted`,
  );
}

function validateReleaseCatalog(value) {
  invariant(value.schemaVersion === 1, "lesson release catalog schema drifted");
  const release = value.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(release, `${RELEASE_ID} is absent from the lesson release catalog`);
  invariant(
    release.grade === 5 &&
      release.lesson === 4 &&
      release.titleDisplay === "Number Lines" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 54 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 55 &&
      release.expectedCounts?.shards === 3 &&
      release.members?.length === 55,
    "G5 L4 release scope drifted",
  );
  invariant(
    sha256(Buffer.from(canonicalJson(release))) === RELEASE_FINGERPRINT_SHA256,
    "G5 L4 full release fingerprint drifted",
  );
  const rw002 = release.members.find(
    ({animationId}) => animationId === RW002_ANIMATION_ID,
  );
  const shell = release.members.find(
    ({animationId}) => animationId === SHELL_ANIMATION_ID,
  );
  invariant(
    rw002?.ordinal === 2 &&
      rw002.xmlOccurrence === 2 &&
      rw002.releaseRole === "active-xml-referenced-page" &&
      rw002.source?.path === "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf" &&
      rw002.source?.sha256 === SOURCE_PINS.rw002Swf.sha256 &&
      rw002.assetId === `swf-${SOURCE_PINS.rw002Swf.sha256}`,
    "RW02 release identity drifted",
  );
  invariant(
    shell?.ordinal === 55 &&
      shell.xmlOccurrence === null &&
      shell.releaseRole === "course-shell" &&
      shell.source?.path === "HELP_COURSES/ELMGR5/L4/index_local.swf" &&
      shell.source?.sha256 === SOURCE_PINS.shellSwf.sha256 &&
      shell.assetId === `swf-${SOURCE_PINS.shellSwf.sha256}`,
    "G5 L4 shell release identity drifted",
  );
  return {release, rw002, shell};
}

function validateMigration(
  value,
  {
    animationId,
    sourcePath,
    sourceSha256,
    rootFrameCount,
    audioRequired,
    nestedCandidate = null,
  },
) {
  const frameDomains = value.implementation?.frameDomains;
  invariant(
    value.animationId === animationId &&
      value.source?.swf === sourcePath &&
      value.source?.swfSha256 === sourceSha256 &&
      value.source?.fla === "" &&
      value.source?.pairedFlaStatus === "missing" &&
      value.runtime?.stage?.width === 800 &&
      value.runtime?.stage?.height === 600 &&
      value.runtime?.fps === 12 &&
      value.runtime?.frameCount === rootFrameCount &&
      value.localization?.bilingualRequired === true &&
      value.localization?.languages?.join("|") === "en|es" &&
      value.baseline?.authority === "undecided" &&
      value.baseline?.renderer === "unresolved" &&
      frameDomains?.[0]?.id === "root" &&
      frameDomains[0]?.kind === "root" &&
      frameDomains[0]?.sourceTimelineId === "root" &&
      frameDomains[0]?.frameCount === rootFrameCount,
    `${animationId} migration identity or root planning boundary drifted`,
  );
  if (nestedCandidate === null) {
    invariant(
      frameDomains.length === 1,
      `${animationId} gained an unreviewed non-root frame domain`,
    );
  } else {
    const candidateState = value.implementation?.candidateState;
    const capturePlanning = value.implementation?.capturePlanning;
    invariant(
      frameDomains.length === 2 &&
        value.implementation.defaultFrameDomainId === nestedCandidate.id &&
        frameDomains[1]?.id === nestedCandidate.id &&
        frameDomains[1]?.kind === "nested" &&
        frameDomains[1]?.sourceTimelineId === nestedCandidate.id &&
        frameDomains[1]?.sourceInstanceId === nestedCandidate.sourceInstanceId &&
        frameDomains[1]?.parentFrameDomainId === "root" &&
        frameDomains[1]?.parentEntryFrame === nestedCandidate.parentEntryFrame &&
        frameDomains[1]?.localEntryFrame === 1 &&
        frameDomains[1]?.frameCount === nestedCandidate.frameCount &&
        candidateState?.status ===
          "current-javascript-engineering-candidate-only" &&
        candidateState?.sourceStaticFrameDomain === nestedCandidate.id &&
        candidateState?.sourceStaticFrames?.firstFrame === 1 &&
        candidateState?.sourceStaticFrames?.lastFrame ===
          nestedCandidate.frameCount &&
        candidateState?.renderedFrameCount === nestedCandidate.frameCount &&
        candidateState?.rootEnabled === false &&
        candidateState?.spanishEnabled === false &&
        candidateState?.audioEnabled === false &&
        candidateState?.sourceControlsEnabled === false &&
        candidateState?.replayParityEstablished === false &&
        candidateState?.originalRuntimeBaselineUsed === false &&
        candidateState?.rmseComputed === false &&
        candidateState?.humanVisualReviewPerformed === false &&
        candidateState?.ownerReviewPerformed === false &&
        candidateState?.strictAcceptanceEffect === "none" &&
        capturePlanning?.nestedFrameDomainDispositionEstablished === true &&
        capturePlanning?.nestedFrameDomainDeclaredInCurrentManifest === true &&
        capturePlanning?.conservativeNestedDomainRequirementsEstablished ===
          true &&
        capturePlanning?.conservativeNestedFrameDomainIds?.join("|") ===
          nestedCandidate.id &&
        capturePlanning?.runtimeReachabilityEstablished === false &&
        capturePlanning?.authoritativeRuntimeFrameDomainDispositionEstablished ===
          false &&
        capturePlanning?.structuralFrameDomainPlanningClosed === false &&
        capturePlanning?.strictAcceptanceEffect === "none",
      `${animationId} nested engineering-candidate boundary drifted`,
    );
  }
  invariant(
    value.audio?.required === audioRequired,
    `${animationId} audio requirement drifted`,
  );
  return value;
}

function validatePendingRequirement(
  requirement,
  {
    animationId,
    frameDomainId,
    frameCount,
    baselineAuthorityRequirement = "original-runtime-frame-accurate",
  },
) {
  invariant(
    requirement.frameDomainId === frameDomainId &&
      requirement.requiredRange?.firstFrame === 1 &&
      requirement.requiredRange?.lastFrame === frameCount &&
      requirement.entryState?.language === requirement.language &&
      requirement.baselineAuthorityRequirement ===
        baselineAuthorityRequirement &&
      requirement.baselineAuthority === "unresolved" &&
      requirement.status === "pending" &&
      requirement.capturedFrameCount === 0 &&
      requirement.missingFrames?.length === frameCount &&
      requirement.baselineCaptureManifest === "" &&
      requirement.captureManifest === "",
    `${animationId} ${frameDomainId} coverage was promoted or narrowed`,
  );
}

function validateRootOnlyCoverage(value, animationId, rootFrameCount) {
  invariant(
    value.schemaVersion === 2 &&
      value.animationId === animationId &&
      value.requirements?.length === 2 &&
      value.requirements.map(({language}) => language).join("|") === "en|es",
    `${animationId} coverage identity drifted`,
  );
  for (const requirement of value.requirements) {
    validatePendingRequirement(requirement, {
      animationId,
      frameDomainId: "root",
      frameCount: rootFrameCount,
    });
    invariant(
      requirement.entryState?.kind === "initial-load",
      `${animationId} coverage was promoted or is no longer root-only`,
    );
  }
  return value;
}

function validateRw002Coverage(value) {
  invariant(
    value.schemaVersion === 2 &&
      value.animationId === RW002_ANIMATION_ID &&
      value.requirements?.length === 4 &&
      value.requirements
        .map(({frameDomainId, language}) => `${frameDomainId}:${language}`)
        .join("|") ===
        "root:en|root:es|sprite-341:en|sprite-341:es",
    "RW02 coverage identity or conservative nested-domain set drifted",
  );
  for (const requirement of value.requirements) {
    const nested = requirement.frameDomainId === "sprite-341";
    validatePendingRequirement(requirement, {
      animationId: RW002_ANIMATION_ID,
      frameDomainId: nested ? "sprite-341" : "root",
      frameCount: nested ? 419 : 10,
      baselineAuthorityRequirement: "original-runtime-natural-trace",
    });
    invariant(
      requirement.entryState?.kind ===
        (nested
          ? "lesson-shell-natural-entry-to-nested-domain"
          : "lesson-shell-natural-entry") &&
        requirement.entryState?.releaseId === RELEASE_ID &&
        requirement.entryState?.targetAnimationId === RW002_ANIMATION_ID &&
        requirement.entryState?.targetSequence === 2 &&
        requirement.entryState?.authoritativeTraceExecuted === false &&
        requirement.entryState?.runtimeReachabilityEstablished !== true &&
        (!nested ||
          (requirement.entryState?.parentFrameDomainId === "root" &&
            requirement.entryState?.parentEntryFrameCandidate === 6 &&
            requirement.entryState?.localEntryFrameCandidate === 1 &&
            requirement.entryState?.sourceTimelineId === "sprite-341" &&
            requirement.entryState?.sourceInstanceId === "Animation")),
      "RW02 coverage entry-state boundary drifted",
    );
  }
  return value;
}

function validateFrameDomains(
  value,
  {
    animationId,
    inventoryCount,
    reachableChildren,
    declaredFrameDomains = 1,
    unresolvedChildren,
  },
) {
  invariant(
    value.schemaVersion === 1 &&
      value.animationId === animationId &&
      value.status === "structurally-enumerated-dispositions-unresolved" &&
      value.summary?.inventoryTimelineCount === inventoryCount &&
      value.summary?.reachableChildTimelineCount === reachableChildren &&
      value.summary?.dispositionCounts?.["declared-frame-domain"] ===
        declaredFrameDomains &&
      value.summary?.dispositionCounts?.unresolved === unresolvedChildren &&
      value.migrationStatusChanged === false &&
      value.strictAcceptanceEffect?.startsWith("none;"),
    `${animationId} frame-domain disposition boundary drifted`,
  );
  const root = value.timelines?.find(({timelineId}) => timelineId === "root");
  invariant(
    root?.disposition === "declared-frame-domain",
    `${animationId} root frame-domain disposition drifted`,
  );
  return value;
}

function validateScenarioInventories(shell, rw002) {
  invariant(
    shell.schemaVersion === 1 &&
      shell.animationId === SHELL_ANIMATION_ID &&
      shell.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      shell.source?.swfSha256 === SOURCE_PINS.shellSwf.sha256 &&
      shell.source?.rootFrameCount === 50 &&
      shell.courseXml?.artifact?.sha256 === SOURCE_PINS.courseXml.sha256 &&
      shell.coverage?.timelineStateCoverage?.length === 194 &&
      shell.coverage?.handlerBehaviorGroups?.length === 120 &&
      shell.coverage?.buttonTargetObligations?.length === 102 &&
      shell.coverage?.courseRouteObligations?.length === 54 &&
      shell.coverage?.replayAndTerminalObligations?.replayCandidates?.length ===
        35 &&
      shell.coverage?.dependencyFixtureObligations?.length === 228 &&
      shell.coverage?.authoritativeRuntimeCoverage?.length === 0 &&
      shell.authoritativeRuntimeEvidence?.length === 0 &&
      shell.strictAcceptanceEffect?.startsWith("none;"),
    "G5 L4 shell scenario inventory drifted or gained runtime authority",
  );
  invariant(
    rw002.schemaVersion === 1 &&
      rw002.animationId === RW002_ANIMATION_ID &&
      rw002.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      rw002.source?.swfSha256 === SOURCE_PINS.rw002Swf.sha256 &&
      rw002.source?.rootFrameCount === 10 &&
      rw002.courseXml?.artifact?.sha256 === SOURCE_PINS.courseXml.sha256 &&
      rw002.coverage?.timelineStateCoverage
        ?.map(({timelineId, frameCount}) => `${timelineId}:${frameCount}`)
        .join("|") ===
        "root:10|sprite-43:22|sprite-208:40|sprite-341:419" &&
      rw002.coverage?.courseRouteObligations?.length === 1 &&
      rw002.coverage?.courseRouteObligations?.[0]?.sourcePage?.path ===
        "RW/L4RW02.swf" &&
      rw002.coverage?.replayAndTerminalObligations?.replayCandidates?.length ===
        0 &&
      rw002.coverage?.dependencyFixtureObligations?.length === 1 &&
      rw002.coverage?.dependencyFixtureObligations?.[0]?.binding ===
        "_level0.InternalPreloader" &&
      rw002.coverage?.authoritativeRuntimeCoverage?.length === 0 &&
      rw002.authoritativeRuntimeEvidence?.length === 0 &&
      rw002.strictAcceptanceEffect?.startsWith("none;"),
    "RW02 scenario inventory drifted or gained runtime authority",
  );
}

function validateSourceGap(value) {
  invariant(
    value.schemaVersion === 1 &&
      value.reportType === "lesson-release-source-gap-forensics" &&
      value.releaseId === RELEASE_ID &&
      value.frozenRelease?.activeXmlMembers === 54 &&
      value.frozenRelease?.shellMembers === 1 &&
      value.frozenRelease?.expectedMembers === 55 &&
      value.frozenRelease?.publicationMode === "atomic" &&
      value.reconciliation?.releaseOrderExactlyMatchesActiveXml === true &&
      value.reconciliation?.lessonDetailsVsActiveXml?.status ===
        "static-difference-confirmed-runtime-reachability-unresolved" &&
      value.keytermGap?.status ===
        "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root" &&
      value.keytermGap?.declarations
        ?.map(({language, path: declaredPath, physicalPresence}) =>
          `${language}:${declaredPath}:${physicalPresence}`,
        )
        .join("|") ===
        "english:HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml:false|" +
          "spanish:HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml:false" &&
      value.acceptanceEffects?.sourceGapClosed === false &&
      value.acceptanceEffects?.authoritativeOriginalRuntime === false &&
      value.acceptanceEffects?.implementationAuthorized === false &&
      value.acceptanceEffects?.strictComplete === false &&
      value.acceptanceEffects?.published === false,
    "G5 L4 source-gap report drifted or was improperly promoted",
  );
}

function validateContainment(value) {
  const expectedAcceptanceEffectKeys = [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "behaviorAccepted",
    "fullFrameAccepted",
    "humanReviewAccepted",
    "implementationAuthorized",
    "ownerFidelityAccepted",
    "published",
    "rendererSelected",
    "rmseAccepted",
    "strictComplete",
  ];
  exactKeys(
    value.acceptanceEffects,
    expectedAcceptanceEffectKeys,
    "G5 L4 containment acceptance effects",
  );
  invariant(
    value.schemaVersion === 1 &&
      value.reportType === "g5-l4-original-runtime-containment-readiness" &&
      value.releaseId === RELEASE_ID &&
      value.identity?.grade === 5 &&
      value.identity?.lesson === 4 &&
      value.scope?.releaseMemberCount === 55 &&
      value.scope?.courseShellCount === 1 &&
      value.hostTreeCandidate?.partialHostTreeCandidate === true &&
      value.hostTreeCandidate?.readOnlyHostTreeMaterialized === true &&
      value.hostTreeCandidate?.cr02TechnicalArtifactComplete === false &&
      value.hostTreeCandidate?.missingDeclaredDependencies?.length === 2 &&
      value.containmentPlan?.controls?.length === 8 &&
      value.containmentPlan.controls.every((control, index) =>
        control.controlId === `CR-${String(index + 1).padStart(2, "0")}` &&
          control.policyApproved === true &&
          control.preparationAuthorized === true &&
          typeof control.selectedMechanism === "string" &&
          control.selectedMechanism.length > 10 &&
          control.candidateImplementationPresent === true &&
          control.offlineOrDiagnosticVerified === true &&
          control.ownerTechnicalApprovalEstablished === false &&
          control.liveSessionVerified === false &&
          control.approved === false &&
          control.verified === false) &&
      value.containmentPlan.controlsWithSelectedMechanism === 8 &&
      value.containmentPlan.candidateImplementationPresentControlCount === 8 &&
      value.containmentPlan.offlineOrDiagnosticVerifiedControlCount === 8 &&
      value.containmentPlan.ownerTechnicalApprovalControlCount === 0 &&
      value.containmentPlan.liveSessionVerifiedControlCount === 0 &&
      value.executionGate?.runnable === false &&
      value.executionGate?.originalRuntimeExecutionReady === false &&
      value.executionGate?.launchesGuiByThisBuilder === false &&
      value.executionGate?.launchesRuntimeByThisBuilder === false &&
      value.executionGate?.ownerRuntimeApprovalBound === false &&
      value.executionGate?.containmentMechanismsSelected === true &&
      value.executionGate?.candidateImplementationsPresent === true &&
      value.executionGate?.offlineOrDiagnosticChecksPassed === true &&
      value.executionGate?.ownerTechnicalApprovalsEstablished === false &&
      value.executionGate?.liveSessionVerificationEstablished === false &&
      value.executionGate?.immutableSessionAuthorizationBound === false &&
      value.executionGate?.failClosedDefaultPolicyApproved === true &&
      value.executionGate?.preparationAuthorized === true &&
      value.executionGate
        ?.unsignedPendingOwnerSignaturePackagePreparationAuthorized === true &&
      value.summary?.completeReadOnlyHostTreeCount === 0 &&
      value.summary?.runnableArtifactCount === 0 &&
      value.summary?.originalRuntimeSessionsExecuted === 0 &&
      value.summary?.ownerDefaultPolicyAuthorizationReceiptCount === 1 &&
      value.summary?.policyApprovedControlCount === 8 &&
      value.summary?.preparationAuthorizedControlCount === 8 &&
      value.summary?.containmentMechanismsSelected === 8 &&
      value.summary?.containmentCandidateImplementationsPresent === 8 &&
      value.summary?.containmentOfflineOrDiagnosticVerified === 8 &&
      value.summary?.containmentOwnerTechnicalApprovals === 0 &&
      value.summary?.containmentLiveSessionVerified === 0 &&
      Object.values(value.acceptanceEffects).every(
        (accepted) => accepted === false,
      ),
    "G5 L4 containment report drifted or was improperly promoted",
  );
  return {
    state:
      "machine-selected-candidates-offline-checked-owner-live-runtime-gates-closed",
    sourceReportFingerprintSha256:
      value.sourceBindings.runtimeMechanismCandidateReadiness
        .reportFingerprintSha256,
    controls: value.containmentPlan.controls.map((control) => ({
      controlId: control.controlId,
      selectedMechanism: control.selectedMechanism,
      candidateImplementationPresent: true,
      offlineOrDiagnosticVerified: true,
      ownerTechnicalApprovalEstablished: false,
      liveSessionVerified: false,
      approved: false,
      verified: false,
    })),
    summary: {
      mechanismsSelected: 8,
      candidateImplementationsPresent: 8,
      offlineOrDiagnosticVerified: 8,
      ownerTechnicalApprovals: 0,
      liveSessionVerified: 0,
      runnableArtifacts: 0,
      originalRuntimeSessionsExecuted: 0,
    },
    strictAcceptanceEffect:
      "none; machine-selected and offline-checked candidates are not Owner-approved, live-verified, runnable, runtime, or acceptance evidence",
  };
}

function validateStaticRoute(courseXmlBytes, mainScriptBytes) {
  const xml = courseXmlBytes.toString("utf8");
  const mainScript = mainScriptBytes.toString("utf8");
  invariant(
    /<Page[^>]*>IR\/L4RW01\.swf<\/Page>/u.test(xml) &&
      /<!--<Page[^>]*>RW\/L4RW01\.swf<\/Page>-->/u.test(xml) &&
      /<Page[^>]*>RW\/L4RW02\.swf<\/Page>/u.test(xml) &&
      xml.includes("HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml") &&
      xml.includes("HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml"),
    "course XML route or missing-keyterm declarations drifted",
  );
  invariant(
    mainScript.includes("[Section1Details]~IR~L4RW01.swf") &&
      mainScript.includes("[Section2Details]~RW~L4RW02.swf") &&
      mainScript.includes("function doPlayNextMovie()") &&
      mainScript.includes("_global.sectionNumber = 2;") &&
      mainScript.includes("_global.slideNumber = 2;") &&
      mainScript.includes(
        '_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];',
      ) &&
      mainScript.includes("function doCheckSpanishAudio()") &&
      mainScript.includes(
        '_global.playSwfFileName != _global.tempURL+"/RW/L4RW01.swf"',
      ),
    "MainScript shell-to-RW02 route or Spanish-audio condition drifted",
  );
}

async function assertMissingDependencies(root) {
  for (const dependency of MISSING_KEYTERM_DEPENDENCIES) {
    const target = resolveProjectPath(
      root,
      dependency.physicalPath,
      dependency.declaredPath,
    );
    const metadata = await lstat(target).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error),
    );
    invariant(
      metadata === null,
      `${dependency.declaredPath} now exists; stop and obtain a reviewed source-gap disposition before rebuilding`,
    );
  }
}

export function validateRuntimePreparationInputs(inputs) {
  const release = validateReleaseCatalog(inputs.releaseCatalog.value);
  validateSourceGap(inputs.sourceGap.value);
  const containmentMechanismCandidates =
    validateContainment(inputs.containment.value);

  validateMigration(inputs.shellMigration.value, {
    animationId: SHELL_ANIMATION_ID,
    sourcePath: SOURCE_PINS.shellSwf.path,
    sourceSha256: SOURCE_PINS.shellSwf.sha256,
    rootFrameCount: 50,
    audioRequired: false,
  });
  validateRootOnlyCoverage(
    inputs.shellCoverage.value,
    SHELL_ANIMATION_ID,
    50,
  );
  validateFrameDomains(inputs.shellFrameDomains.value, {
    animationId: SHELL_ANIMATION_ID,
    inventoryCount: 194,
    reachableChildren: 95,
    unresolvedChildren: 95,
  });

  validateMigration(inputs.rw002Migration.value, {
    animationId: RW002_ANIMATION_ID,
    sourcePath: SOURCE_PINS.rw002Swf.path,
    sourceSha256: SOURCE_PINS.rw002Swf.sha256,
    rootFrameCount: 10,
    audioRequired: true,
    nestedCandidate: {
      id: "sprite-341",
      sourceInstanceId: "Animation",
      parentEntryFrame: 6,
      frameCount: 419,
    },
  });
  invariant(
    inputs.rw002Migration.value.audio?.catalogExactAssociations?.length === 1 &&
      inputs.rw002Migration.value.audio.catalogExactAssociations[0]
        ?.sourceFile === SOURCE_PINS.spanishAudioCandidate.path &&
      inputs.rw002Migration.value.audio.catalogExactAssociations[0]?.sha256 ===
        SOURCE_PINS.spanishAudioCandidate.sha256 &&
      inputs.rw002Migration.value.audio.catalogExactAssociations[0]?.language ===
        "und",
    "RW02 audio candidate identity or unresolved-language boundary drifted",
  );
  validateRw002Coverage(inputs.rw002Coverage.value);
  validateFrameDomains(inputs.rw002FrameDomains.value, {
    animationId: RW002_ANIMATION_ID,
    inventoryCount: 4,
    reachableChildren: 3,
    declaredFrameDomains: 2,
    unresolvedChildren: 2,
  });
  invariant(
    inputs.rw002FrameDomains.value.timelines
      .map(({timelineId, frameCount, disposition}) =>
        `${timelineId}:${frameCount}:${disposition}`,
      )
      .join("|") ===
      "root:10:declared-frame-domain|sprite-43:22:unresolved|" +
        "sprite-208:40:unresolved|" +
        "sprite-341:419:declared-frame-domain",
    "RW02 root/nested frame-domain boundary drifted",
  );

  validateScenarioInventories(
    inputs.shellScenario.value,
    inputs.rw002Scenario.value,
  );
  validateStaticRoute(inputs.courseXml.bytes, inputs.mainScript.bytes);
  for (const key of Object.keys(SOURCE_PINS)) {
    validatePhysicalPin(key, inputs[key].binding);
  }
  return {release, containmentMechanismCandidates};
}

async function readInputs(root) {
  const entries = await Promise.all(
    Object.entries(INPUTS).map(async ([key, config]) => [
      key,
      await readBinding(root, config.path, {json: config.json}),
    ]),
  );
  const inputs = Object.fromEntries(entries);
  await assertMissingDependencies(root);
  const {release, containmentMechanismCandidates} =
    validateRuntimePreparationInputs(inputs);
  const generator = await readBinding(
    root,
    portable(path.relative(root, SCRIPT_PATH)),
    {json: false},
  );
  return {inputs, release, containmentMechanismCandidates, generator};
}

function publicBindings(inputs) {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, {binding}]) => [key, binding]),
  );
}

function buildTraceCandidate(language) {
  const spanish = language === "es";
  const candidateWithoutFingerprint = {
    schemaVersion: 1,
    candidateType: "g5-l4-shell-rw002-natural-runtime-trace-candidate",
    candidateId: `g5-l4-shell-rw002-${language}-candidate`,
    releaseId: RELEASE_ID,
    shellAnimationId: SHELL_ANIMATION_ID,
    targetAnimationId: RW002_ANIMATION_ID,
    language,
    status: "blocked-source-planning-only",
    sourceAuthority:
      "static-source-derived-runtime-unverified-no-authoritative-observation",
    sessionIsolation: {
      sessionSlotId: `g5-l4-shell-rw002-${language}-session-slot`,
      sessionId: null,
      disposableProfileRoot: null,
      mustNotShareMutableProfileWithOtherLanguage: true,
      externalAuthorizationAndLivePreflightRequired: true,
    },
    entryContract: {
      mode: "same-lesson-shell-natural-navigation",
      directChildSwfOpenPermitted: false,
      directSeekPermitted: false,
      commandLineLaunchPermittedByThisArtifact: false,
      launchPath: null,
      launchCommand: null,
      pointerCoordinates: null,
      timingDelaysMs: null,
    },
    orderedSteps: [
      {
        stepId: "P00",
        kind: "future-external-precondition",
        description:
          "Require externally signed session authorization, all eight approved and live-verified containment controls, an authorized host, and a complete read-only host tree.",
        sourcePath: null,
        eventTarget: null,
        pointerCoordinates: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P01",
        kind: "future-human-gui-open",
        description:
          "A future named operator may open only the hash-bound lesson shell through an authorized GUI session after P00 passes.",
        sourcePath: SOURCE_PINS.shellSwf.lessonPath,
        sourceSha256: SOURCE_PINS.shellSwf.sha256,
        eventTarget: null,
        pointerCoordinates: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P02",
        kind: "observe-shell-natural-start",
        description:
          "Observe, without direct child loading, whether the shell naturally starts the active XML introduction.",
        expectedStaticCandidatePath:
          SOURCE_PINS.introductionSwf.lessonPath,
        expectedStaticCandidateSha256:
          SOURCE_PINS.introductionSwf.sha256,
        eventTarget: null,
        pointerCoordinates: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P03",
        kind: "future-shell-native-next",
        description:
          "Use the shell-native Next control once and record the actual event target, state transition, attempted loads, and resulting URL; no coordinate is guessed.",
        expectedStaticTargetReference: "_root.next",
        expectedStaticTransition:
          "sectionNumber=2; slideNumber=2; RW/arrSection2_Details[2]",
        pointerCoordinates: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P04",
        kind: "observe-rw002-natural-entry",
        description:
          "Verify that the shell loads the exact RW02 source and record the InternalPreloader jump_check dependency and ordered entry-state hash chain.",
        expectedStaticCandidatePath: SOURCE_PINS.rw002Swf.lessonPath,
        expectedStaticCandidateSha256: SOURCE_PINS.rw002Swf.sha256,
        unresolvedHostDependency:
          '_level0.InternalPreloader.gotoAndPlay("jump_check")',
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P05",
        kind: "observe-root-and-active-local-playheads",
        description:
          "Record RW02 root frames and every active local playhead. The 419-frame sprite-341 domain is a conservatively declared source-static engineering candidate, while the 22- and 40-frame timelines remain unresolved. None has authoritative runtime reachability.",
        declaredRootCandidate: {timelineId: "root", firstFrame: 1, lastFrame: 10},
        declaredSourceStaticCandidateDomain: {
          timelineId: "sprite-341",
          firstFrame: 1,
          lastFrame: 419,
          parentFrameDomainId: "root",
          rootPlacementFrame: 6,
          rootPlacementInstance: "Animation",
          authoritativeRuntimeReachabilityEstablished: false,
        },
        unresolvedNestedCandidates: [
          {timelineId: "sprite-43", firstFrame: 1, lastFrame: 22},
          {timelineId: "sprite-208", firstFrame: 1, lastFrame: 40},
        ],
        fullFrameCoverageClaimed: false,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P06",
        kind: spanish
          ? "observe-spanish-host-state-and-audio"
          : "observe-english-host-state",
        description: spanish
          ? "Prove the actual Spanish host state and the SA control's load, language, audibility, cue, synchronization, and stop/replay behavior; the MP3 directory and basename do not prove its language."
          : "Prove the actual English host state and record any host audio controls or attempted audio loads without assuming Spanish controls are absent.",
        audioCandidate: spanish
          ? {
              path: SOURCE_PINS.spanishAudioCandidate.lessonPath,
              sha256: SOURCE_PINS.spanishAudioCandidate.sha256,
              catalogLanguage: "und",
              runtimeLanguageVerified: false,
            }
          : null,
        pointerCoordinates: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P07",
        kind: "required-replay-and-terminal-resolution",
        description:
          "Identify the host/runtime Replay target and prove reset of root, nested playheads, language, audio, and host state; structural last frames alone are not terminal or Replay evidence.",
        replayTarget: null,
        terminalStateHash: null,
        executed: false,
        runtimeObserved: false,
      },
      {
        stepId: "P08",
        kind: "future-postflight-only",
        description:
          "A future authorized session must prove complete process exit, zero successful legacy requests, no persistent SharedObject state, and immutable externally signed observation records.",
        executed: false,
        runtimeObserved: false,
      },
    ],
    coverageBoundary: {
      canonicalRequirementsChangedByThisCandidate: false,
      shellCompleteCoverageClaimed: false,
      rw002CompleteCoverageClaimed: false,
      conservativeNestedRequirementAlreadyPresent: true,
      authoritativeNestedTimelineDispositionClaimed: false,
      authoritativeRuntimeEvidenceClaimed: false,
      rootFrameCountsAreNotTotalLessonCoverage: true,
    },
    executionGate: {
      runnable: false,
      runtimeExecutionAuthorized: false,
      sourceScheduleReady: false,
      hostTreeComplete: false,
      missingDeclaredDependencies: 2,
      containmentControlsApproved: 0,
      containmentControlsVerified: 0,
      immutableSessionAuthorizationBound: false,
      namedLiveOperatorAttestationBound: false,
      originalRuntimeSessionExecuted: false,
    },
  };
  return {
    ...candidateWithoutFingerprint,
    candidateFingerprintSha256: fingerprint(candidateWithoutFingerprint),
  };
}

function buildReport({inputs, release, containmentMechanismCandidates, generator}) {
  const traceCandidates = LANGUAGES.map(buildTraceCandidate);
  const reportWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g5-l4-shell-rw002-runtime-preparation",
    status: "blocked-source-planning-only",
    generator: generator.binding,
    sourceBindings: publicBindings(inputs),
    scope: {
      releaseId: RELEASE_ID,
      releaseFingerprintSha256: RELEASE_FINGERPRINT_SHA256,
      releaseMemberCount: release.release.members.length,
      publicationMode: release.release.publicationMode,
      shellAnimationId: SHELL_ANIMATION_ID,
      shellOrdinal: release.shell.ordinal,
      targetAnimationId: RW002_ANIMATION_ID,
      targetOrdinal: release.rw002.ordinal,
      targetXmlOccurrence: release.rw002.xmlOccurrence,
      languages: [...LANGUAGES],
      nativeStage: {width: 800, height: 600},
      fps: 12,
      preparationOnly: true,
    },
    fixedSourceIdentity: {
      shell: SOURCE_PINS.shellSwf,
      activeIntroduction: SOURCE_PINS.introductionSwf,
      targetRw002: SOURCE_PINS.rw002Swf,
      spanishAudioCandidate: {
        ...SOURCE_PINS.spanishAudioCandidate,
        catalogLanguage: "und",
        languageVerifiedByThisReport: false,
      },
      courseXml: SOURCE_PINS.courseXml,
      mainScript: SOURCE_PINS.mainScript,
    },
    naturalPathCandidate: {
      status: "static-source-derived-runtime-unverified",
      path: [
        SOURCE_PINS.shellSwf.lessonPath,
        SOURCE_PINS.introductionSwf.lessonPath,
        "host-event:_root.next",
        SOURCE_PINS.rw002Swf.lessonPath,
      ],
      directChildSwfOpenPermitted: false,
      directSeekPermitted: false,
      runtimeReachabilityEstablished: false,
      legacyIntroductionReachabilityEstablished: false,
      releaseScopeChanged: false,
    },
    currentCoverageBoundary: {
      shell: {
        canonicalRequirementCount: 2,
        canonicalLanguages: [...LANGUAGES],
        declaredFrameDomains: [
          {frameDomainId: "root", firstFrame: 1, lastFrame: 50},
        ],
        inventoryTimelineCount: 194,
        unresolvedReachableChildTimelineCount: 95,
        completeCoverageClaimed: false,
      },
      rw002: {
        canonicalRequirementCount: 4,
        canonicalLanguages: [...LANGUAGES],
        declaredFrameDomains: [
          {frameDomainId: "root", firstFrame: 1, lastFrame: 10},
          {
            frameDomainId: "sprite-341",
            firstFrame: 1,
            lastFrame: 419,
            disposition: "declared-frame-domain",
            role: "main-teaching-animation-source-static-candidate",
            rootPlacementFrame: 6,
            rootPlacementInstance: "Animation",
            authoritativeRuntimeReachabilityEstablished: false,
          },
        ],
        unresolvedReachableTimelineCandidates: [
          {
            timelineId: "sprite-43",
            firstFrame: 1,
            lastFrame: 22,
            disposition: "unresolved",
          },
          {
            timelineId: "sprite-208",
            firstFrame: 1,
            lastFrame: 40,
            disposition: "unresolved",
          },
        ],
        sourceStaticEngineeringCandidate: {
          frameDomainId: "sprite-341",
          firstFrame: 1,
          lastFrame: 419,
          renderedFrameCount: 419,
          rootEnabled: false,
          spanishEnabled: false,
          audioEnabled: false,
          sourceControlsEnabled: false,
          originalRuntimeBaselineUsed: false,
          rmseComputed: false,
          humanVisualReviewPerformed: false,
          ownerReviewPerformed: false,
          strictAcceptanceEffect: "none",
        },
        completeCoverageClaimed: false,
      },
      canonicalCoverageFilesModified: false,
      rootFramesTreatedAsTotalCoverage: false,
    },
    missingDeclaredDependencies: MISSING_KEYTERM_DEPENDENCIES.map(
      ({language, declaredPath}) => ({
        language,
        path: declaredPath,
        physicalPresence: false,
        substitutionPermitted: false,
        blocker: true,
      }),
    ),
    containmentMechanismCandidates,
    traceCandidates,
    blockers: BLOCKERS.map((item) => ({...item})),
    executionGate: {
      machineOnlyPreparation: true,
      failClosedDefaultPolicyApproved: true,
      unsignedPendingOwnerSignaturePackagePreparationAuthorized: true,
      runnable: false,
      launchPath: null,
      launchCommand: null,
      runtimeExecutionAuthorized: false,
      sourceScheduleReady: false,
      completeReadOnlyHostTreeBound: false,
      machineSelectedContainmentCandidateCount: 8,
      containmentCandidateImplementationCount: 8,
      containmentOfflineOrDiagnosticVerifiedCount: 8,
      containmentOwnerTechnicalApprovalCount: 0,
      containmentLiveSessionVerifiedCount: 0,
      containmentApproved: false,
      immutableSessionAuthorizationBound: false,
      runtimeSessionsExecuted: 0,
      originalRuntimeExecutionReady: false,
    },
    acceptanceEffects: {
      acceptanceNeutral: true,
      canonicalCoverageChanged: false,
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      implementationAuthorized: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    authority: AUTHORITY,
  };
  return {
    ...reportWithoutFingerprint,
    reportFingerprintSha256: fingerprint(reportWithoutFingerprint),
  };
}

function validateCandidate(candidate, language) {
  invariant(
    candidate?.candidateFingerprintSha256 &&
      HASH.test(candidate.candidateFingerprintSha256) &&
      canonicalJson(candidate) === canonicalJson(buildTraceCandidate(language)),
    `${language} candidate trace schema, identity, or fail-closed boundary drifted`,
  );
}

export function validateRuntimePreparationReport(report) {
  exactKeys(report, [
    "acceptanceEffects", "authority", "blockers", "currentCoverageBoundary",
    "containmentMechanismCandidates", "executionGate", "fixedSourceIdentity", "generator",
    "missingDeclaredDependencies", "naturalPathCandidate",
    "reportFingerprintSha256", "reportType", "schemaVersion", "scope",
    "sourceBindings", "status", "traceCandidates",
  ], "runtime-preparation report");
  invariant(
    report.schemaVersion === 1 &&
      report.reportType === "g5-l4-shell-rw002-runtime-preparation" &&
      report.status === "blocked-source-planning-only" &&
      report.authority === AUTHORITY,
    "G5 L4 Shell→RW02 runtime-preparation identity or authority drifted",
  );
  exactKeys(report.generator, ["bytes", "path", "sha256"], "generator");
  invariant(
    report.generator.path ===
      "scripts/build-g5-l4-shell-rw002-runtime-preparation.mjs" &&
      Number.isSafeInteger(report.generator.bytes) &&
      report.generator.bytes > 0 &&
      HASH.test(report.generator.sha256),
    "runtime-preparation generator descriptor drifted",
  );
  exactKeys(report.sourceBindings, Object.keys(INPUTS), "source bindings");
  for (const [key, config] of Object.entries(INPUTS)) {
    const descriptor = report.sourceBindings[key];
    exactKeys(descriptor, ["bytes", "path", "sha256"], `source binding ${key}`);
    invariant(
      descriptor.path === config.path &&
        Number.isSafeInteger(descriptor.bytes) &&
        descriptor.bytes > 0 &&
        HASH.test(descriptor.sha256),
      `source binding ${key} drifted`,
    );
    if (SOURCE_PINS[key]) {
      invariant(
        descriptor.bytes === SOURCE_PINS[key].bytes &&
          descriptor.sha256 === SOURCE_PINS[key].sha256,
        `source binding ${key} no longer matches the exact pin`,
      );
    }
  }
  invariant(report.traceCandidates?.map(({language}) => language).join("|") ===
    "en|es", "runtime-preparation language candidates drifted");
  for (const language of LANGUAGES) {
    validateCandidate(
      report.traceCandidates.find((candidate) => candidate.language === language),
      language,
    );
  }
  const containmentCandidates = report.containmentMechanismCandidates;
  exactKeys(containmentCandidates, [
    "controls", "sourceReportFingerprintSha256", "state", "strictAcceptanceEffect",
    "summary",
  ], "runtime-preparation containment candidates");
  invariant(
    containmentCandidates.state ===
        "machine-selected-candidates-offline-checked-owner-live-runtime-gates-closed" &&
      HASH.test(containmentCandidates.sourceReportFingerprintSha256 || "") &&
      Array.isArray(containmentCandidates.controls) &&
      containmentCandidates.controls.length === 8 &&
      containmentCandidates.controls.every((control, index) => {
        exactKeys(control, [
          "approved", "candidateImplementationPresent", "controlId",
          "liveSessionVerified", "offlineOrDiagnosticVerified",
          "ownerTechnicalApprovalEstablished", "selectedMechanism", "verified",
        ], `runtime-preparation containment candidate ${index}`);
        return control.controlId ===
            `CR-${String(index + 1).padStart(2, "0")}` &&
          typeof control.selectedMechanism === "string" &&
          control.selectedMechanism.length > 10 &&
          control.candidateImplementationPresent === true &&
          control.offlineOrDiagnosticVerified === true &&
          control.ownerTechnicalApprovalEstablished === false &&
          control.liveSessionVerified === false &&
          control.approved === false && control.verified === false;
      }) &&
      containmentCandidates.summary?.mechanismsSelected === 8 &&
      containmentCandidates.summary.candidateImplementationsPresent === 8 &&
      containmentCandidates.summary.offlineOrDiagnosticVerified === 8 &&
      containmentCandidates.summary.ownerTechnicalApprovals === 0 &&
      containmentCandidates.summary.liveSessionVerified === 0 &&
      containmentCandidates.summary.runnableArtifacts === 0 &&
      containmentCandidates.summary.originalRuntimeSessionsExecuted === 0 &&
      containmentCandidates.strictAcceptanceEffect.startsWith("none;"),
    "runtime-preparation containment candidate boundary drifted",
  );
  exactKeys(containmentCandidates.summary, [
    "candidateImplementationsPresent", "liveSessionVerified",
    "mechanismsSelected", "offlineOrDiagnosticVerified",
    "originalRuntimeSessionsExecuted", "ownerTechnicalApprovals",
    "runnableArtifacts",
  ], "runtime-preparation containment candidate summary");
  const pseudoInputs = Object.fromEntries(
    Object.entries(report.sourceBindings).map(([key, binding]) => [
      key,
      {binding},
    ]),
  );
  const expected = buildReport({
    inputs: pseudoInputs,
    release: {
      release: {members: Array.from({length: 55}), publicationMode: "atomic"},
      shell: {ordinal: 55},
      rw002: {ordinal: 2, xmlOccurrence: 2},
    },
    generator: {binding: report.generator},
    containmentMechanismCandidates: report.containmentMechanismCandidates,
  });
  invariant(
    HASH.test(report.reportFingerprintSha256) &&
      canonicalJson(report) === canonicalJson(expected),
    "runtime-preparation report schema or fail-closed projection drifted",
  );
  return report;
}

export function renderRuntimePreparationMarkdown(report) {
  validateRuntimePreparationReport(report);
  const escapeCell = (value) =>
    String(value)
      .replaceAll("\\", "\\\\")
      .replaceAll("|", "\\|")
      .replaceAll("`", "\\`")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\r", " ")
      .replaceAll("\n", " ");
  const escapeText = (value) =>
    String(value)
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\r", " ")
      .replaceAll("\n", " ");
  const sourceRows = [
    ["Shell", report.fixedSourceIdentity.shell],
    ["Active introduction", report.fixedSourceIdentity.activeIntroduction],
    ["RW02", report.fixedSourceIdentity.targetRw002],
    ["Spanish-audio candidate", report.fixedSourceIdentity.spanishAudioCandidate],
    ["Course XML", report.fixedSourceIdentity.courseXml],
    ["MainScript", report.fixedSourceIdentity.mainScript],
  ]
    .map(
      ([label, source]) =>
        `| ${escapeCell(label)} | \`${escapeCell(source.lessonPath)}\` | \`${escapeCell(source.sha256)}\` |`,
    )
    .join("\n");
  const blockerRows = report.blockers
    .map(
      ({blockerId, statement}) =>
        `- **${escapeText(blockerId)}:** ${escapeText(statement)}`,
    )
    .join("\n");
  return `# G5 L4 Shell → RW02 Runtime Preparation\n\n`
    + `Status: **blocked-source-planning-only**. This deterministic artifact prepares separate EN and ES candidate traces. It is not a canonical trace specification, launch package, runtime authorization, baseline, or acceptance record.\n\n`
    + `Containment candidates: **8/8 machine-selected / 8/8 candidate implementations / 8/8 offline or diagnostic checks**; Owner technical approvals / live-session verifications / runnable artifacts / runtime sessions: **0 / 0 / 0 / 0**.\n\n`
    + `## Fixed source identity\n\n| Role | Lesson path | SHA-256 |\n|---|---|---|\n${sourceRows}\n\n`
    + `The route bound and prepared by this report is \`index_local.swf → IR/L4RW01.swf → host _root.next → RW/L4RW02.swf\`. This artifact does not claim that no other static or runtime route exists. Direct child-SWF opening and direct seek are forbidden by this preparation. Runtime reachability is not established.\n\n`
    + `## Coverage boundary\n\nThe Shell currently declares only root frames 1–50 while 95 reachable child timelines remain unresolved. RW02 declares root frames 1–10 plus conservative EN/ES requirements for the source-static \`sprite-341\` engineering-candidate domain at frames 1–419; \`sprite-43\` (22) and \`sprite-208\` (40) remain unresolved. This report does not promote any domain or establish runtime reachability, Spanish behavior, audio behavior, parity, or acceptance, and root frame counts are not treated as complete lesson coverage.\n\n`
    + `EN and ES use different candidate and session-slot identities. Every step remains unexecuted, no pointer coordinate or delay is guessed, and no launch path or command is present. The Spanish MP3 remains catalog language \`und\` until a named-human runtime listening session proves language, cue, audibility, synchronization, and Replay behavior.\n\n`
    + `## Open blockers\n\n${blockerRows}\n\n`
    + `## Authority boundary\n\nNo runtime session, authoritative frame or audio evidence, implementation authorization, human review, Owner acceptance, strict completion, or publication is established.\n`;
}

async function replaceOutputPair(root, entries) {
  const transactionId = `${process.pid}-${randomUUID()}`;
  const states = [];
  let committed = false;
  try {
    for (const [relativePath, contents] of entries) {
      const output = resolveProjectPath(root, relativePath, relativePath);
      const parentRelative = portable(path.relative(root, path.dirname(output)));
      const parent = resolveProjectPath(
        root,
        parentRelative,
        `${relativePath} parent`,
      );
      const parentMetadata = await lstat(parent);
      invariant(
        parentMetadata.isDirectory() && !parentMetadata.isSymbolicLink(),
        `${relativePath} parent must be an ordinary directory`,
      );
      let current = root;
      for (const part of parentRelative.split("/")) {
        current = path.join(current, part);
        const component = await lstat(current);
        invariant(
          component.isDirectory() && !component.isSymbolicLink(),
          `${relativePath} parent contains a non-directory or symbolic link`,
        );
      }
      const rootReal = await realpath(root);
      invariant(
        contained(rootReal, await realpath(parent)),
        `${relativePath} parent escapes project root`,
      );
      const existing = await lstat(output).catch((error) =>
        error.code === "ENOENT" ? null : Promise.reject(error),
      );
      invariant(
        existing === null ||
          (existing.isFile() &&
            !existing.isSymbolicLink() &&
            existing.nlink === 1),
        `${relativePath} must be absent or an ordinary single-link file`,
      );
      const temporary = path.join(
        parent,
        `.${path.basename(output)}.${transactionId}.tmp`,
      );
      const backup = path.join(
        parent,
        `.${path.basename(output)}.${transactionId}.bak`,
      );
      await writeFile(temporary, contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
      states.push({
        output,
        temporary,
        backup,
        hadExisting: Boolean(existing),
        backedUp: false,
        installed: false,
      });
    }
    for (const state of states) {
      if (state.hadExisting) {
        await rename(state.output, state.backup);
        state.backedUp = true;
      }
    }
    for (const state of states) {
      await rename(state.temporary, state.output);
      state.installed = true;
    }
    committed = true;
    await Promise.all(
      states
        .filter((state) => state.backedUp)
        .map((state) => unlink(state.backup)),
    );
  } catch (error) {
    if (!committed) {
      for (const state of [...states].reverse()) {
        if (state.installed) await unlink(state.output).catch(() => {});
        if (state.backedUp) {
          await rename(state.backup, state.output).catch(() => {});
        }
      }
    }
    throw error;
  } finally {
    await Promise.all(
      states.flatMap((state) => [
        unlink(state.temporary).catch(() => {}),
        unlink(state.backup).catch(() => {}),
      ]),
    );
  }
}

export async function buildRuntimePreparation({root = ROOT} = {}) {
  const current = await readInputs(root);
  const report = validateRuntimePreparationReport(buildReport(current));
  return {
    report,
    json: canonicalJson(report),
    markdown: renderRuntimePreparationMarkdown(report),
  };
}

export async function writeRuntimePreparation({
  root = ROOT,
  check = false,
} = {}) {
  const built = await buildRuntimePreparation({root});
  if (check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readBinding(root, REPORT_JSON, {json: false}),
      readBinding(root, REPORT_MARKDOWN, {json: false}),
    ]);
    invariant(
      currentJson.bytes.toString("utf8") === built.json,
      `${REPORT_JSON} is stale`,
    );
    invariant(
      currentMarkdown.bytes.toString("utf8") === built.markdown,
      `${REPORT_MARKDOWN} is stale`,
    );
    return {action: "verified", changed: 0, report: built.report};
  }
  await replaceOutputPair(root, [
    [REPORT_JSON, built.json],
    [REPORT_MARKDOWN, built.markdown],
  ]);
  return {action: "written", changed: 2, report: built.report};
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/build-g5-l4-shell-rw002-runtime-preparation.mjs [--check]",
    "",
    "Writes or verifies blocked, source-bound EN/ES Shell→RW02 trace preparation reports.",
    "It never launches, signs, approves, captures, promotes, changes coverage, or authorizes runtime execution.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await writeRuntimePreparation(options);
  process.stdout.write(
    `${result.action}: G5 L4 Shell→RW02 EN/ES preparation; 8 blockers; 0 launches; 0 runtime sessions; acceptance effect none.\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
