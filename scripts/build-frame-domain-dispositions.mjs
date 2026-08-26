#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {COURSE_AUDIT_IDS, COURSE_PILOT_IDS} from "./build-course-scenario-inventories.mjs";
import {LEGACY_PILOT_IDS} from "./build-legacy-scenario-inventories.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
  NESTED_DECLARED_PARENT_BINDING_MODE,
  STATIC_DISPOSITION_ANIMATION_IDS,
  STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
  verifyStaticFrameDomainDispositionEvidence,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH,
  SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE,
  canonicalIndependentPairSet,
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";
import {
  preflightReleaseAuditWorkspaces,
  selectLessonReleaseAuditMembers,
} from "./audit-pilot-swfs.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultLessonReleasePath = path.join(projectRoot, "catalog", "lesson-releases.json");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const DISPOSITIONS = Object.freeze([
  "declared-frame-domain",
  "composite-child-with-parent",
  "independent-required",
  "nonvisual",
  "unresolved",
]);
export const FRAME_DOMAIN_DISPOSITION_IDS = Object.freeze([
  ...COURSE_AUDIT_IDS,
  ...LEGACY_PILOT_IDS,
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareNumericText(left, right) {
  const leftNumber = Number.parseInt(left ?? "", 10);
  const rightNumber = Number.parseInt(right ?? "", 10);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return compareText(String(left ?? ""), String(right ?? ""));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [
      key,
      stableValue(value[key]),
    ]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isContainedPath(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === ""
    || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function sameStatIdentity(left, right) {
  return JSON.stringify(statIdentity(left)) === JSON.stringify(statIdentity(right));
}

function sameStoredIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameStoredInode(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function sameDisplacedStoredIdentity(left, right) {
  return [
    "dev",
    "ino",
    "mode",
    "size",
    "mtimeNs",
    "nlink",
  ].every((key) => left?.[key] === right?.[key]);
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function assertOrdinaryAncestorTree(
  containmentRoot,
  candidate,
  label,
) {
  const resolvedRoot = path.resolve(containmentRoot);
  const resolvedCandidate = path.resolve(candidate);
  if (!isContainedPath(resolvedRoot, resolvedCandidate)) {
    throw new Error(
      `${label} must be contained by ${portable(resolvedRoot)}`,
    );
  }
  const rootInformation = await lstat(resolvedRoot, {bigint: true});
  if (
    !rootInformation.isDirectory() ||
    rootInformation.isSymbolicLink()
  ) {
    throw new Error(`${label} containment root must be a real directory`);
  }
  const realRoot = await realpath(resolvedRoot);
  let cursor = resolvedRoot;
  const relativeParent = path.relative(
    resolvedRoot,
    path.dirname(resolvedCandidate),
  );
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true});
    if (!information.isDirectory() || information.isSymbolicLink()) {
      throw new Error(
        `${label} real path must remain contained; ancestor must be a real directory`,
      );
    }
    if (!isContainedPath(realRoot, await realpath(cursor))) {
      throw new Error(`${label} ancestor escapes its containment root`);
    }
  }
  return {resolvedRoot, resolvedCandidate, realRoot};
}

async function readStableRegularFile(candidate, label, {
  containmentRoot = null,
  requireSingleLink = true,
} = {}) {
  const resolvedPath = path.resolve(candidate);
  let resolvedContainmentRoot = null;
  let realContainmentRoot = null;
  if (containmentRoot) {
    const ancestors = await assertOrdinaryAncestorTree(
      containmentRoot,
      resolvedPath,
      label,
    );
    resolvedContainmentRoot = ancestors.resolvedRoot;
    realContainmentRoot = ancestors.realRoot;
  }

  const before = await lstat(resolvedPath, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error(`${label} must be an ordinary non-symlink file`);
  }
  if (requireSingleLink && before.nlink !== 1n) {
    throw new Error(`${label} must have exactly one hard link`);
  }
  const beforeRealPath = await realpath(resolvedPath);
  if (realContainmentRoot && !isContainedPath(realContainmentRoot, beforeRealPath)) {
    throw new Error(`${label} real path must remain contained by ${portable(realContainmentRoot)}`);
  }

  const noFollow = fsConstants.O_NOFOLLOW || 0;
  const handle = await open(resolvedPath, fsConstants.O_RDONLY | noFollow);
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    if (!descriptorBefore.isFile() || (requireSingleLink && descriptorBefore.nlink !== 1n)) {
      throw new Error(`${label} changed before it could be read safely`);
    }
    if (!sameStatIdentity(before, descriptorBefore)) {
      throw new Error(`${label} changed before it could be read safely`);
    }
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    if (!sameStatIdentity(descriptorBefore, descriptorAfter)) {
      throw new Error(`${label} changed while it was being read`);
    }
  } finally {
    await handle.close();
  }

  const after = await lstat(resolvedPath, {bigint: true});
  const afterRealPath = await realpath(resolvedPath);
  if (
    !sameStatIdentity(descriptorAfter, after)
    || beforeRealPath !== afterRealPath
    || (realContainmentRoot && !isContainedPath(realContainmentRoot, afterRealPath))
  ) {
    throw new Error(`${label} changed while it was being read`);
  }
  return {
    path: resolvedPath,
    realPath: afterRealPath,
    containmentRoot: resolvedContainmentRoot,
    requireSingleLink,
    label,
    bytes,
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    stat: statIdentity(after),
  };
}

async function assertStableInputSet(snapshots) {
  const unique = new Map(
    snapshots.map((snapshot) => [snapshot.path, snapshot]),
  );
  for (const snapshot of unique.values()) {
    await assertStableFileSnapshot(
      snapshot,
      snapshot.label || snapshot.path,
      {
        containmentRoot: snapshot.containmentRoot,
        requireSingleLink: snapshot.requireSingleLink !== false,
      },
    );
  }
}

async function assertStableFileSnapshot(snapshot, label, {
  containmentRoot = null,
  requireSingleLink = true,
} = {}) {
  const current = await readStableRegularFile(snapshot.path, label, {
    containmentRoot,
    requireSingleLink,
  });
  if (
    current.realPath !== snapshot.realPath
    || current.byteLength !== snapshot.byteLength
    || current.sha256 !== snapshot.sha256
    || JSON.stringify(current.stat) !== JSON.stringify(snapshot.stat)
  ) {
    throw new Error(`${label} changed after preflight`);
  }
  return current;
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256File(candidate) {
  return createHash("sha256").update(await readFile(candidate)).digest("hex");
}

export function parseArguments(argv) {
  const options = {
    check: false,
    help: false,
    ids: [],
    lessonReleasePath: defaultLessonReleasePath,
    lessonReleasePathExplicit: false,
    migrationsRoot: defaultMigrationsRoot,
    releaseId: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--id") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--id requires a value");
      options.ids.push(value);
      index += 1;
    } else if (argument === "--migrations") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--migrations requires a value");
      options.migrationsRoot = path.resolve(value);
      index += 1;
    } else if (argument === "--release-id") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--release-id requires a value");
      options.releaseId = value;
      index += 1;
    } else if (argument === "--lesson-releases") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--lesson-releases requires a value");
      options.lessonReleasePath = path.resolve(value);
      options.lessonReleasePathExplicit = true;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (options.lessonReleasePathExplicit && !options.releaseId) {
    throw new Error("--lesson-releases requires --release-id");
  }
  return options;
}

async function resolveFrameDomainDispositionSelection(options = {}) {
  const ids = options.ids?.length ? [...options.ids] : [];
  if (new Set(ids).size !== ids.length) {
    throw new Error("Frame-domain disposition animation IDs must not be repeated");
  }
  if (
    !options.releaseId
    && options.lessonReleasePath
    && path.resolve(options.lessonReleasePath) !== defaultLessonReleasePath
  ) {
    throw new Error("--lesson-releases requires --release-id");
  }

  if (!options.releaseId) {
    const selectedIds = ids.length ? ids : [...COURSE_PILOT_IDS];
    const unknown = selectedIds.filter((id) => !FRAME_DOMAIN_DISPOSITION_IDS.includes(id));
    if (unknown.length) {
      throw new Error(
        `Unknown explicit-frame-domain pilot ID(s): ${unknown.join(", ")}; `
        + "non-pilot IDs require --release-id and exact lesson-release membership",
      );
    }
    return {
      ids: selectedIds,
      releaseBinding: null,
      releaseCatalogSnapshot: null,
      releaseInputSnapshots: [],
    };
  }
  if (!ids.length && options.allowFullReleaseSelection !== true) {
    throw new Error(
      "Selecting every release member requires internal allowFullReleaseSelection: true; CLI release selection requires at least one --id",
    );
  }

  const releaseCatalogSnapshot = await readStableRegularFile(
    path.resolve(options.lessonReleasePath || defaultLessonReleasePath),
    "Lesson-release catalog",
    {
      containmentRoot: projectRoot,
      requireSingleLink: true,
    },
  );
  let releaseDocument;
  try {
    releaseDocument = JSON.parse(releaseCatalogSnapshot.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Lesson-release catalog is not valid JSON: ${error.message}`);
  }
  const releaseMembers = selectLessonReleaseAuditMembers(releaseDocument, {
    releaseId: options.releaseId,
  });
  const matchingReleases = releaseDocument.releases.filter(
    ({releaseId}) => releaseId === options.releaseId,
  );
  if (matchingReleases.length !== 1) {
    throw new Error(`${options.releaseId}: exact lesson release is not unique`);
  }
  const selectedRelease = matchingReleases[0];
  const releaseFingerprintSha256 = sha256Bytes(
    Buffer.from(stableJson(selectedRelease)),
  );
  const orderedMemberIdentitySha256 = sha256Bytes(Buffer.from(stableJson(
    releaseMembers.map(({ordinal, animationId, assetId}) => ({
      ordinal,
      animationId,
      assetId,
    })),
  )));
  if (
    options.expectedReleaseFingerprintSha256 &&
    releaseFingerprintSha256 !==
      options.expectedReleaseFingerprintSha256
  ) {
    throw new Error(`${options.releaseId}: lesson-release fingerprint drifted`);
  }
  if (
    options.expectedOrderedMemberIdentitySha256 &&
    orderedMemberIdentitySha256 !==
      options.expectedOrderedMemberIdentitySha256
  ) {
    throw new Error(
      `${options.releaseId}: ordered release-member identity drifted`,
    );
  }
  const selectedIds = ids.length
    ? ids
    : releaseMembers.map((member) => member.animationId);
  const membersById = new Map(releaseMembers.map((member) => [member.animationId, member]));
  const missing = selectedIds.filter((id) => !membersById.has(id));
  if (missing.length) {
    throw new Error(
      `${options.releaseId}: requested frame-domain member(s) are not in the exact lesson release: ${missing.join(", ")}`,
    );
  }
  const selectedMembers = selectedIds.map((id) => membersById.get(id));
  const resolvedSourceRoot = path.resolve(options.sourceRoot || projectRoot);
  const workspacePreflight = await preflightReleaseAuditWorkspaces(
    path.resolve(options.migrationsRoot || defaultMigrationsRoot),
    selectedMembers,
    {sourceRoot: resolvedSourceRoot},
  );
  const releaseInputSnapshots = [];
  for (const {animationId, sourcePath} of workspacePreflight) {
    releaseInputSnapshots.push(
      await readStableRegularFile(
        sourcePath,
        `${animationId}: physical release source`,
        {
          containmentRoot: resolvedSourceRoot,
          requireSingleLink: true,
        },
      ),
    );
  }
  const memberBindings = Object.fromEntries(selectedMembers.map((member) => [
    member.animationId,
    {
      animationId: member.animationId,
      ordinal: member.ordinal,
      shardId: member.shardId,
      assetId: member.assetId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
    },
  ]));
  return {
    ids: selectedIds,
    releaseCatalogSnapshot,
    releaseInputSnapshots,
    releaseBinding: {
      releaseId: options.releaseId,
      ...(options.expectedReleaseFingerprintSha256 ? {
        releaseFingerprintSha256,
        orderedMemberIdentitySha256,
      } : {}),
      catalog: {
        path: portable(path.relative(projectRoot, releaseCatalogSnapshot.path)),
        bytes: releaseCatalogSnapshot.byteLength,
        sha256: releaseCatalogSnapshot.sha256,
        schemaVersion: releaseDocument.schemaVersion,
      },
      members: memberBindings,
    },
  };
}

export async function resolveFrameDomainDispositionIds(options = {}) {
  return (await resolveFrameDomainDispositionSelection(options)).ids;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256 digest`);
}

function requiredEvidence(inventory, artifactId) {
  const matches = (inventory.evidenceIndex || []).filter((item) => item.artifactId === artifactId);
  if (matches.length !== 1) {
    throw new Error(`${inventory.animationId}: scenario inventory must bind exactly one ${artifactId} artifact`);
  }
  assertSha256(matches[0].sha256, `${inventory.animationId}: ${artifactId}.sha256`);
  if (!matches[0].path) throw new Error(`${inventory.animationId}: ${artifactId}.path is missing`);
  return matches[0];
}

function sortPlacement(left, right) {
  return compareText(left.parentTimelineId, right.parentTimelineId)
    || compareNumericText(left.frame, right.frame)
    || compareNumericText(left.depth, right.depth)
    || compareText(left.instanceName, right.instanceName)
    || compareText(left.childTimelineId, right.childTimelineId);
}

function placementEdge(parentTimelineId, childTimelineId, placement) {
  return {
    parentTimelineId,
    childTimelineId,
    sourceObjectId: String(placement.objectId),
    frame: Number.parseInt(placement.frame, 10),
    depth: String(placement.depth ?? ""),
    instanceName: placement.name || "",
    tag: placement.tag || "",
    replace: placement.replace || "",
    hasClipActions: placement.hasClipActions === true,
  };
}

function buildNamedPlacementGraph(timelines) {
  const timelineByObjectId = new Map(
    timelines
      .filter((timeline) => timeline.objectId !== null && timeline.objectId !== undefined)
      .map((timeline) => [String(timeline.objectId), timeline]),
  );
  const adjacency = new Map();
  const parents = new Map();
  for (const parent of timelines) {
    for (const placement of parent.namedPlacements || []) {
      const child = timelineByObjectId.get(String(placement.objectId));
      if (!child) continue;
      const edge = placementEdge(parent.timelineId, child.timelineId, placement);
      if (!adjacency.has(parent.timelineId)) adjacency.set(parent.timelineId, []);
      if (!parents.has(child.timelineId)) parents.set(child.timelineId, []);
      adjacency.get(parent.timelineId).push(edge);
      parents.get(child.timelineId).push(edge);
    }
  }
  for (const edges of adjacency.values()) edges.sort(sortPlacement);
  for (const edges of parents.values()) edges.sort(sortPlacement);

  const paths = new Map([["root", []]]);
  const queue = ["root"];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const parentTimelineId = queue[cursor];
    for (const edge of adjacency.get(parentTimelineId) || []) {
      if (paths.has(edge.childTimelineId)) continue;
      paths.set(edge.childTimelineId, [...paths.get(parentTimelineId), edge]);
      queue.push(edge.childTimelineId);
    }
  }
  return {parents, paths};
}

function normalizeDeclaredFrameDomains(manifest, timelineById, animationId) {
  const domains = manifest.implementation?.frameDomains || [];
  if (!Array.isArray(domains)) throw new Error(`${animationId}: implementation.frameDomains must be an array`);
  const seenIds = new Set();
  return domains.map((domain) => {
    if (!domain?.id || !domain.sourceTimelineId) {
      throw new Error(`${animationId}: every declared frame domain needs id and sourceTimelineId`);
    }
    if (seenIds.has(domain.id)) throw new Error(`${animationId}: duplicate frame domain ${domain.id}`);
    seenIds.add(domain.id);
    const timeline = timelineById.get(domain.sourceTimelineId);
    if (!timeline) {
      throw new Error(`${animationId}: frame domain ${domain.id} references a timeline that is not structurally root-reachable: ${domain.sourceTimelineId}`);
    }
    if (domain.frameCount !== timeline.frameCount) {
      throw new Error(`${animationId}: frame domain ${domain.id} frameCount ${domain.frameCount} does not match ${domain.sourceTimelineId} frameCount ${timeline.frameCount}`);
    }
    return {
      frameDomainId: domain.id,
      kind: domain.kind || "",
      sourceTimelineId: domain.sourceTimelineId,
      sourceInstanceId: domain.sourceInstanceId || "",
      parentFrameDomainId: domain.parentFrameDomainId ?? null,
      parentEntryFrame: domain.parentEntryFrame ?? null,
      localEntryFrame: domain.localEntryFrame ?? null,
      frameCount: domain.frameCount,
      role: domain.role || "",
    };
  }).sort((left, right) => compareText(left.frameDomainId, right.frameDomainId));
}

function rootPlacementFor(timeline, placementGraph) {
  if (timeline.timelineId === "root") {
    return {status: "root-timeline", namedPlacementPath: []};
  }
  const pathToTimeline = placementGraph.paths.get(timeline.timelineId);
  if (pathToTimeline) {
    return {
      status: "proven-named-placement-chain",
      namedPlacementPath: pathToTimeline,
    };
  }
  return {
    status: "structurally-reachable-but-named-root-path-unresolved",
    namedPlacementPath: [],
    limitation: "The scenario inventory proves root reachability from the full placement graph but retains only named placements; no complete named chain to root is present in this artifact.",
  };
}

function riskAssessment(
  timeline,
  rootTimeline,
  declaredFrameDomains,
  rootPlacement,
  staticCompositeClaim = null,
  sourceProvenIndependentClaim = null,
) {
  if (declaredFrameDomains.length) {
    return {
      level: "none",
      independentFrameDomainCandidate: false,
      signals: ["source-timeline-already-declared-as-frame-domain"],
      interpretation: "No undeclared-domain triage signal; fidelity still depends on the declared domain's required runtime and visual evidence.",
    };
  }
  if (staticCompositeClaim) {
    if (staticCompositeClaim.role === "single-frame-scriptless-structural-child") {
      return {
        level: "none",
        independentFrameDomainCandidate: false,
        signals: [
          "hash-bound-single-frame-scriptless-structural-child-proof",
          "exactly-one-source-show-frame",
          "no-frame-action-or-init-action",
          "all-exported-placements-have-no-clip-actions",
          "button-interaction-behavior-full-frame-audio-obligations-preserved",
        ],
        interpretation: "Hash-bound source structure proves that this one-frame scriptless child has no independent local playhead to validate. Its structural content, buttons, interactions, behavior, full-frame/RMSE, and audio obligations remain in the containing runtime/domain scope and are not accepted by this disposition.",
      };
    }
    if (staticCompositeClaim.role === MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE) {
      const nestedDeclaredParent =
        staticCompositeClaim.parentBindingMode
          === NESTED_DECLARED_PARENT_BINDING_MODE;
      return {
        level: "none",
        independentFrameDomainCandidate: false,
        signals: [
          "hash-bound-multi-frame-scriptless-parent-clock-proof",
          ...(nestedDeclaredParent ? [
            "complete-indirect-parent-root-path-bound-with-runtime-entry-unresolved",
          ] : []),
          "all-fresh-placement-update-removal-lifetimes-exhaustively-mapped",
          "one-indexed-local-playhead-wraps-and-explicit-placement-resets-source-proven",
          "no-child-script-init-action-clip-actions-dynamic-addressing-or-external-target-control",
          "visual-behavior-full-frame-rmse-obligations-preserved",
        ],
        interpretation: nestedDeclaredParent
          ? "Hash-bound SWF structure proves every visible instance lifetime and derives each scriptless child local frame from the exact indirectly placed declared parent clock. The parent's root entry remains unresolved. This removes only a separate child frame-domain requirement; visual, behavior, full-frame/RMSE, audio, human, and owner acceptance remain pending."
          : "Hash-bound SWF structure proves every visible instance lifetime and derives each scriptless child local frame from the already-declared parent clock. This removes only a separate frame-domain requirement; visual, behavior, full-frame/RMSE, audio, human, and owner acceptance remain pending.",
      };
    }
    return {
      level: "none",
      independentFrameDomainCandidate: false,
      signals: [
        "hash-bound-static-composite-child-proof",
        "visual-bounds-exhaustively-offstage",
        "audio-obligation-preserved",
      ],
      interpretation: "Hash-bound structure and script evidence prove that this off-stage audio child is exhaustively represented through its declared parent domain. Audio, behavior, and full-frame acceptance remain separate and pending.",
    };
  }
  if (sourceProvenIndependentClaim) {
    return {
      level: "blocking-required-domain",
      independentFrameDomainCandidate: true,
      signals: [
        "hash-bound-multi-frame-local-action-domain-proof",
        "direct-swfmill-do-action-and-ffdec-frame-script-counts-match",
        "one-indexed-script-frames-bound-inside-child-domain",
        "undeclared-required-frame-domain",
        "all-runtime-behavior-visual-audio-review-obligations-pending",
      ],
      interpretation:
        "Hash-bound SWF and FFDec evidence proves source-authored action state in this child timeline's own local frame coordinates. The child must be declared and specified as an independent frame domain before strict acceptance; this source obligation does not prove natural reachability or implementation fidelity.",
    };
  }
  const signals = ["undeclared-structurally-root-reachable-timeline"];
  if (timeline.frameCount > 1) signals.push("multiframe-local-playhead");
  if (timeline.frameCount > rootTimeline.frameCount) signals.push("local-frame-count-exceeds-root");
  if (timeline.frameCount >= 100) signals.push("local-frame-count-at-least-100");
  if ((timeline.controlStates || []).length >= 10) signals.push("at-least-10-static-control-states");
  if ((timeline.frameLabels || []).length >= 5) signals.push("at-least-5-frame-labels");
  if (rootPlacement.status === "proven-named-placement-chain" && rootPlacement.namedPlacementPath.length === 1) {
    signals.push("direct-named-root-placement");
  }
  const independentFrameDomainCandidate = timeline.frameCount > 1;
  const level = independentFrameDomainCandidate && (
    timeline.frameCount >= 100
    || (timeline.controlStates || []).length >= 10
    || (timeline.frameLabels || []).length >= 5
  ) ? "high" : "review";
  return {
    level,
    independentFrameDomainCandidate,
    signals,
    interpretation: independentFrameDomainCandidate
      ? "Static structure makes this an independent-frame-domain candidate only. Authorized natural-playback evidence is required before assigning independent-required or composite-child-with-parent."
      : "Static structure does not prove whether this one-frame MovieClip is visual, nonvisual, interactive, or fully represented by a parent domain.",
  };
}

function dispositionFor(
  declaredFrameDomains,
  staticCompositeClaim = null,
  sourceProvenIndependentClaim = null,
) {
  if (declaredFrameDomains.length) {
    return {
      disposition: "declared-frame-domain",
      basis: "The hash-bound migration manifest declares a matching source timeline and frame count in implementation.frameDomains.",
    };
  }
  if (staticCompositeClaim) {
    if (staticCompositeClaim.role === "single-frame-scriptless-structural-child") {
      return {
        disposition: "composite-child-with-parent",
        basis: "A reproducible hash-bound source audit proves this timeline is one exact ShowFrame with no frame script, DoAction, DoInitAction, clipActions, or declared independent frame domain. The claim removes only a separate local-playhead obligation; structural/button/interaction/behavior/full-frame/audio validation remains pending in containing contexts.",
      };
    }
    if (staticCompositeClaim.role === MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE) {
      const nestedDeclaredParent =
        staticCompositeClaim.parentBindingMode
          === NESTED_DECLARED_PARENT_BINDING_MODE;
      return {
        disposition: "composite-child-with-parent",
        basis: nestedDeclaredParent
          ? "A reproducible hash-bound source audit exhaustively maps every fresh placement, identity-preserving update, explicit removal, one-indexed local-frame segment, scriptless wrap, and re-placement reset to one exact indirectly placed declared parent frame domain, with no child script, DoInitAction, clipActions, dynamic addressing, or external target playhead control. The parent root-entry schedule plus all visual, behavior, full-frame/RMSE, audio, human, and owner obligations remain pending."
          : "A reproducible hash-bound source audit exhaustively maps every fresh placement, identity-preserving update, explicit removal, one-indexed local-frame segment, scriptless wrap, and re-placement reset to an already-declared parent frame domain, with no child script, DoInitAction, clipActions, dynamic addressing, or external target playhead control. Visual, behavior, full-frame/RMSE, audio, human, and owner obligations remain pending.",
      };
    }
    return {
      disposition: "composite-child-with-parent",
      basis: "A reproducible, hash-bound static audit proves the exact audio-child tag census, parent/child matrix chain, fully off-stage visual bounds, removal lifecycle, and unique ActionScript references while preserving audio, behavior, and full-frame obligations.",
    };
  }
  if (sourceProvenIndependentClaim) {
    return {
      disposition: "independent-required",
      basis:
        "A reproducible hash-bound source audit proves this undeclared multi-frame child contains direct DoAction state at exact local frames with a one-for-one FFDec frame-script export. The source therefore requires a separately declared and specified child frame domain; natural runtime, behavior, visual, audio, comparison, review, acceptance, completion, and release evidence remain pending.",
    };
  }
  return {
    disposition: "unresolved",
    basis: "Static root reachability does not prove that a MovieClip is composite-only, independently required, or nonvisual; no authoritative disposition is recorded in the bound manifest.",
  };
}

function normalizeStaticCompositeClaims({
  animationId,
  staticDispositionEvidence,
  staticDispositionEvidenceSha256,
  inventory,
  inventorySha256,
  manifest,
  manifestSha256,
  allTimelineById,
  timelineById,
  domainsByTimeline,
  placementGraph,
  sourceSwfEvidence,
  swfmillEvidence,
}) {
  if (!staticDispositionEvidence) return new Map();
  assertSha256(staticDispositionEvidenceSha256, `${animationId}: static disposition evidence SHA-256`);
  const evidence = staticDispositionEvidence;
  if (evidence.schemaVersion !== 2 || evidence.evidenceType !== "static-frame-domain-disposition-evidence") {
    throw new Error(`${animationId}: unsupported static disposition evidence schema`);
  }
  if (evidence.animationId !== animationId || evidence.status !== "verified-static-composite-claims" || evidence.migrationStatusChanged !== false) {
    throw new Error(`${animationId}: static disposition evidence identity/status is invalid`);
  }
  if (!String(evidence.strictAcceptanceEffect || "").startsWith("none;")) {
    throw new Error(`${animationId}: static disposition evidence must not advance strict acceptance`);
  }
  const acceptanceEffects = evidence.acceptanceEffects || {};
  for (const key of ["buttonAccepted", "interactionAccepted", "audioAccepted", "behaviorAccepted", "fullFrameAccepted", "rmseAccepted", "humanReviewAccepted", "ownerReviewAccepted"]) {
    if (acceptanceEffects[key] !== false) throw new Error(`${animationId}: static disposition evidence cannot satisfy ${key}`);
  }
  const generated = evidence.generatedFrom || {};
  if (
    generated.sourceSwf?.path !== sourceSwfEvidence.path
    || generated.sourceSwf?.sha256 !== sourceSwfEvidence.sha256
    || generated.swfmillStructure?.path !== swfmillEvidence.path
    || generated.swfmillStructure?.sha256 !== swfmillEvidence.sha256
    || generated.scenarioInventory?.path !== "audit/scenario-inventory.json"
    || generated.scenarioInventory?.sha256 !== inventorySha256
    || generated.scenarioInventory?.schemaVersion !== inventory.schemaVersion
  ) {
    throw new Error(`${animationId}: static disposition evidence has stale source/scenario/swfmill bindings`);
  }
  const scriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  if (
    generated.ffdecScripts?.path !== scriptsEvidence.path
    || generated.ffdecScripts?.sha256 !== scriptsEvidence.sha256
    || generated.ffdecScripts?.uncompressedSha256 !== scriptsEvidence.uncompressedSha256
  ) {
    throw new Error(`${animationId}: static disposition evidence has stale FFDec script bindings`);
  }
  if (
    generated.migrationManifest?.path !== "migration.json"
    || generated.migrationManifest?.projection !== TECHNICAL_MANIFEST_PROJECTION.id
    || generated.migrationManifest?.hashMode !== "canonical-json-v1"
    || generated.migrationManifest?.sha256 !== manifestSha256
    || JSON.stringify(generated.migrationManifest?.excludedPaths) !== JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
  ) {
    throw new Error(`${animationId}: static disposition evidence has a stale migration technical binding`);
  }
  if (!Array.isArray(evidence.claims) || !evidence.claims.length) {
    throw new Error(`${animationId}: static disposition evidence has no claims`);
  }
  if (!Array.isArray(evidence.claimSetContracts) || !evidence.claimSetContracts.length) {
    throw new Error(`${animationId}: static disposition evidence has no exact claim-set contracts`);
  }
  const sortTimelineIds = (values) => [...values].sort((left, right) => (
    compareNumericText(String(left).replace(/^sprite-/, ""), String(right).replace(/^sprite-/, ""))
    || compareText(String(left), String(right))
  ));
  const contractsByProofType = new Map();
  for (const [contractIndex, contract] of evidence.claimSetContracts.entries()) {
    const label = `${animationId}: static disposition claim-set contract ${contractIndex + 1}`;
    if (![
      "audio-only-offstage-visual-marker",
      "single-frame-scriptless-structural-child",
      MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
    ].includes(contract.proofType)) {
      throw new Error(`${label} has unsupported proof type ${contract.proofType || "missing"}`);
    }
    if (contractsByProofType.has(contract.proofType)) throw new Error(`${label} duplicates proof type ${contract.proofType}`);
    const expectedIds = sortTimelineIds(contract.expectedTimelineIds || []);
    const verifiedIds = sortTimelineIds(contract.verifiedTimelineIds || []);
    const actualIds = sortTimelineIds(evidence.claims.filter(({role}) => role === contract.proofType).map(({timelineId}) => timelineId));
    if (
      contract.exactMatch !== true
      || !Number.isInteger(contract.expectedTimelineCount)
      || contract.expectedTimelineCount < 1
      || contract.expectedTimelineCount !== expectedIds.length
      || contract.verifiedTimelineCount !== verifiedIds.length
      || contract.verifiedTimelineCount !== actualIds.length
      || new Set(expectedIds).size !== expectedIds.length
      || new Set(verifiedIds).size !== verifiedIds.length
      || JSON.stringify(expectedIds) !== JSON.stringify(verifiedIds)
      || JSON.stringify(verifiedIds) !== JSON.stringify(actualIds)
    ) {
      throw new Error(`${label} does not pin one exact matching timeline ID set and count`);
    }
    contractsByProofType.set(contract.proofType, contract);
  }
  for (const role of new Set(evidence.claims.map(({role}) => role))) {
    if (!contractsByProofType.has(role)) throw new Error(`${animationId}: static disposition claims for ${role || "missing-role"} have no exact set contract`);
  }
  const claimsByTimeline = new Map();
  for (const [claimIndex, claim] of evidence.claims.entries()) {
    const label = `${animationId}: static disposition claim ${claimIndex + 1}`;
    if (claim.disposition !== "composite-child-with-parent") {
      throw new Error(`${label} uses unsupported disposition ${claim.disposition || "missing"}`);
    }
    if (![
      "audio-only-offstage-visual-marker",
      "single-frame-scriptless-structural-child",
      MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE,
    ].includes(claim.role)) {
      throw new Error(`${label} uses unsupported role ${claim.role || "missing"}`);
    }
    if (!claim.timelineId || claimsByTimeline.has(claim.timelineId)) throw new Error(`${label} timelineId is missing or duplicated`);
    const timeline = timelineById.get(claim.timelineId);
    if (!timeline || String(timeline.objectId) !== claim.sourceObjectId || timeline.frameCount !== claim.frameCount) {
      throw new Error(`${label} references the wrong child timeline/object/frame count`);
    }
    if ((domainsByTimeline.get(claim.timelineId) || []).length) {
      throw new Error(`${label} cannot classify an already declared frame domain as composite`);
    }
    if (claim.role === "audio-only-offstage-visual-marker") {
      const parentTimeline = timelineById.get(claim.parentTimelineId);
      const parentDomains = domainsByTimeline.get(claim.parentTimelineId) || [];
      if (
        !parentTimeline
        || String(parentTimeline.objectId) !== claim.parentSourceObjectId
        || !parentDomains.some((domain) => domain.frameDomainId === claim.parentFrameDomainId && domain.sourceTimelineId === claim.parentTimelineId)
      ) {
        throw new Error(`${label} references the wrong or undeclared parent timeline`);
      }
      const rootPath = placementGraph.paths.get(claim.timelineId) || [];
      if (rootPath.length !== 2 || rootPath[0].childTimelineId !== claim.parentTimelineId || rootPath[1].childTimelineId !== claim.timelineId) {
        throw new Error(`${label} does not match the scenario inventory's root-to-parent-to-child path`);
      }
      const evidencePath = claim.placementChain || [];
      if (
        evidencePath.length !== 3
        || evidencePath[0].parentTimelineId !== "root"
        || evidencePath[0].childTimelineId !== claim.parentTimelineId
        || evidencePath[1].parentTimelineId !== claim.parentTimelineId
        || evidencePath[1].childTimelineId !== claim.timelineId
        || evidencePath[2].parentTimelineId !== claim.timelineId
      ) {
        throw new Error(`${label} placement chain is unsupported or forged`);
      }
      if (
        claim.tagCensus?.exactMatch !== true
        || claim.tagCensus?.declaredFrameCount !== claim.frameCount
        || claim.tagCensus?.observedShowFrameCount !== claim.frameCount
        || claim.audioStructure?.required !== true
        || claim.audioStructure?.acceptanceSatisfied !== false
        || claim.audioStructure?.blockCount !== claim.frameCount
        || claim.audioStructure?.headCount !== 1
        || claim.audioStructure?.compressionCode !== 2
      ) {
        throw new Error(`${label} lacks the required exact MP3 SoundStream tag census`);
      }
      if (
        claim.visualBounds?.nativeStageIntersection !== false
        || claim.lifetime?.parentPlacementUpdateCount !== 0
        || claim.lifetime?.childPlacementUpdateCount !== 0
        || claim.lifetime?.clipActionCount !== 0
        || claim.scriptReferenceAudit?.unsupportedReferenceCount !== 0
        || claim.scriptReferenceAudit?.selectorPrefix?.occurrenceCount !== 1
        || claim.scriptReferenceAudit?.selectorVariable?.occurrenceCount !== 2
        || claim.scriptReferenceAudit?.directInstanceName?.occurrenceCount !== 0
      ) {
        throw new Error(`${label} lacks the required off-stage lifecycle/script proof`);
      }
      for (const obligation of ["audio", "behavior", "fullFrame"]) {
        const value = claim.preservedObligations?.[obligation];
        if (value?.required !== true || value?.satisfiedByDisposition !== false || !value?.status) {
          throw new Error(`${label} does not preserve the ${obligation} obligation`);
        }
      }
      claimsByTimeline.set(claim.timelineId, {
        evidencePath: STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
        evidenceSha256: staticDispositionEvidenceSha256,
        claimIndex,
        role: claim.role,
        parentTimelineId: claim.parentTimelineId,
        parentFrameDomainId: claim.parentFrameDomainId,
        nativeStageIntersection: false,
        audioObligation: claim.preservedObligations.audio,
        behaviorObligation: claim.preservedObligations.behavior,
        fullFrameObligation: claim.preservedObligations.fullFrame,
      });
      continue;
    }

    if (claim.role === MULTI_FRAME_PARENT_CLOCK_PROOF_TYPE) {
      const parent = claim.parentBinding || {};
      const parentIsRoot = parent.parentTimelineId === "root";
      const nestedDeclaredParent =
        parent.parentBindingMode === NESTED_DECLARED_PARENT_BINDING_MODE;
      const parentTimeline = timelineById.get(parent.parentTimelineId);
      const parentDomains = domainsByTimeline.get(parent.parentTimelineId) || [];
      const rawParentDomains = (manifest.implementation?.frameDomains || []).filter(
        ({sourceTimelineId}) => sourceTimelineId === parent.parentTimelineId,
      );
      const rootPath = placementGraph.paths.get(parent.parentTimelineId) || [];
      const retainedNamedTargetPlacements = (placementGraph.parents.get(claim.timelineId) || []).filter(({instanceName}) => instanceName);
      const parentObjectIdentityMatches = parentIsRoot
        ? parentTimeline?.objectId === null && parent.parentSourceObjectId === null
        : String(parentTimeline?.objectId) === parent.parentSourceObjectId;
      const rootBindingMatches = nestedDeclaredParent
        ? parent.rootPlacement === null
        : parentIsRoot
        ? rootPath.length === 0 && parent.rootPlacement === null
        : (
          rootPath.length === 1
          && rootPath[0].parentTimelineId === "root"
          && rootPath[0].childTimelineId === parent.parentTimelineId
          && parent.rootPlacement?.declaredSourceObjectId === parent.parentSourceObjectId
          && parent.rootPlacement?.frame === rootPath[0].frame
          && parent.rootPlacement?.depth === rootPath[0].depth
          && parent.rootPlacement?.instanceName === rootPath[0].instanceName
          && parent.rootPlacement?.hasClipActions === false
        );
      const nestedBoundaryMatches = nestedDeclaredParent
        ? (
          !parentIsRoot
          && rawParentDomains.length === 1
          && parent.parentEntryStateEstablished === false
          && Array.isArray(parent.parentRootPath)
          && parent.parentRootPath.length >= 2
          && parent.parentRootPath[0]?.parentTimelineId === "root"
          && parent.parentRootPath.at(-1)?.childTimelineId
            === parent.parentTimelineId
          && parent.parentRootPath.every((edge, index) => (
            edge
            && edge.childTimelineId === `sprite-${edge.sourceObjectId}`
            && Number.isInteger(edge.frame)
            && edge.frame > 0
            && /^\d+$/.test(edge.depth)
            && edge.tag === "PlaceObject2"
            && edge.replace === "0"
            && edge.hasClipActions === false
            && typeof edge.instanceName === "string"
            && edge.instanceName.length > 0
            && (index === 0
              || edge.parentTimelineId
                === parent.parentRootPath[index - 1].childTimelineId)
            && (placementGraph.parents.get(edge.childTimelineId) || []).length === 1
            && JSON.stringify((placementGraph.parents.get(edge.childTimelineId) || [])[0])
              === JSON.stringify(edge)
          ))
          && JSON.stringify(parent.parentRootPath) === JSON.stringify(rootPath)
          && JSON.stringify(rawParentDomains[0].sourceParentTimelineIds)
            === JSON.stringify([rootPath.at(-1)?.parentTimelineId])
          && typeof rawParentDomains[0].captureParentResolution === "string"
          && rawParentDomains[0].captureParentResolution.includes(
            "parentEntryState remains unresolved",
          )
          && rawParentDomains[0].sourceProof?.authoritativeRuntimeEntryEstablished
            === false
          && rawParentDomains[0].sourceProof?.strictAcceptanceEffect === "none"
        )
        : (
          parent.parentBindingMode === undefined
          && parent.parentEntryStateEstablished === undefined
          && parent.parentRootPath === undefined
        );
      if (
        claim.frameCount <= 1
        || timeline.structuralReachability !== "reachable-from-root-placement-graph"
        || claim.structuralReachability !== timeline.structuralReachability
        || claim.claimScope !== "local-playhead-fully-derived-from-declared-parent-clock"
        || claim.sourceBinding?.path !== sourceSwfEvidence.path
        || claim.sourceBinding?.sha256 !== sourceSwfEvidence.sha256
        || !parentTimeline
        || !parentObjectIdentityMatches
        || parentTimeline.frameCount !== parent.parentFrameCount
        || !parentDomains.some((domain) => domain.frameDomainId === parent.parentFrameDomainId && domain.sourceTimelineId === parent.parentTimelineId)
        || !rootBindingMatches
        || !nestedBoundaryMatches
        || retainedNamedTargetPlacements.length !== 0
      ) {
        throw new Error(`${label} lacks the exact source/declared-parent/root-path binding`);
      }
      if (
        claim.tagCensus?.exactMatch !== true
        || JSON.stringify(claim.tagCensus?.observed) !== JSON.stringify(claim.tagCensus?.expected)
        || claim.tagCensus?.declaredFrameCount !== claim.frameCount
        || claim.tagCensus?.observedShowFrameCount !== claim.frameCount
        || claim.tagCensus?.doActionTagCount !== 0
        || claim.tagCensus?.doInitActionTagCount !== 0
        || claim.tagCensus?.endTagCount !== 1
      ) {
        throw new Error(`${label} lacks the exact multi-frame scriptless tag census`);
      }
      const script = claim.scriptAudit || {};
      const hasExactGlobalDoInitActionSet = (
        Array.isArray(script.globalDoInitActionSpriteObjectIds)
        || Array.isArray(script.expectedGlobalDoInitActionSpriteObjectIds)
        || script.globalDoInitActionSetExactMatch !== undefined
      );
      const globalDoInitActionSpriteObjectIds = script.globalDoInitActionSpriteObjectIds || [];
      const expectedGlobalDoInitActionSpriteObjectIds = script.expectedGlobalDoInitActionSpriteObjectIds || [];
      const globalDoInitActionBindingInvalid = hasExactGlobalDoInitActionSet
        ? (
          !Array.isArray(script.globalDoInitActionSpriteObjectIds)
          || !Array.isArray(script.expectedGlobalDoInitActionSpriteObjectIds)
          || script.globalDoInitActionCount !== globalDoInitActionSpriteObjectIds.length
          || new Set(globalDoInitActionSpriteObjectIds).size !== globalDoInitActionSpriteObjectIds.length
          || new Set(expectedGlobalDoInitActionSpriteObjectIds).size !== expectedGlobalDoInitActionSpriteObjectIds.length
          || JSON.stringify(globalDoInitActionSpriteObjectIds) !== JSON.stringify(expectedGlobalDoInitActionSpriteObjectIds)
          || script.globalDoInitActionSetExactMatch !== true
        )
        : script.globalDoInitActionCount !== 0;
      if (
        script.ffdecFrameScriptCount !== 0
        || (script.ffdecFrameScripts || []).length !== 0
        || script.attributedDoInitActionCount !== 0
        || (script.attributedDoInitActions || []).length !== 0
        || globalDoInitActionBindingInvalid
        || script.namedIncomingInstanceCount !== 0
        || (script.namedIncomingInstances || []).length !== 0
        || script.dynamicAddressingReferenceCount !== 0
        || (script.dynamicAddressingReferences || []).length !== 0
        || script.externalTargetControlCount !== 0
        || (script.externalTargetControls || []).length !== 0
        || script.nonTargetPlayheadControlReferenceCount !== (script.nonTargetPlayheadControlReferences || []).length
        || !(script.nonTargetPlayheadControlReferences || []).every(({targetCandidate}) => targetCandidate === false)
        || script.scriptlessLocalTimeline !== true
      ) {
        throw new Error(`${label} lacks the no-script/init/clip/dynamic/external-target-control proof`);
      }
      const lifecycle = claim.placementLifecycleAudit || {};
      const lifetimes = Array.isArray(lifecycle.lifetimes) ? lifecycle.lifetimes : [];
      const explicitRemovalCount = lifetimes.filter(({termination}) => termination?.kind === "removal").length;
      const parentTerminalTerminationCount = lifetimes.filter(({termination}) => termination?.kind === "parent-timeline-terminal").length;
      const replacementTerminationCount = lifetimes.filter(({termination}) => termination?.kind === "replacement").length;
      const zeroWrapLifetimeCount = lifetimes.filter(({localPlayhead}) => localPlayhead?.wrapCount === 0).length;
      if (
        !Array.isArray(lifecycle.lifetimes)
        || lifetimes.length < 1
        || lifecycle.incomingPlacementCount !== lifetimes.length
        || lifecycle.explicitRemovalCount !== explicitRemovalCount
        || (lifecycle.parentTerminalTerminationCount || 0) !== parentTerminalTerminationCount
        || lifecycle.replacementTerminationCount !== replacementTerminationCount
        || explicitRemovalCount + parentTerminalTerminationCount + replacementTerminationCount !== lifetimes.length
        || (lifecycle.zeroWrapLifetimeCount || 0) !== zeroWrapLifetimeCount
        || lifecycle.clipActionCount !== 0
        || lifecycle.allInstancesFreshAtEmptyDepth !== true
        || lifecycle.allLifetimesMapped !== true
        || lifecycle.parentUpdateCount !== lifetimes.reduce((sum, lifetime) => sum + (lifetime.updates || []).length, 0)
      ) {
        throw new Error(`${label} lacks the exhaustive placement/update/termination lifetime graph`);
      }
      let totalWrapCount = 0;
      for (const [lifetimeIndex, lifetime] of lifetimes.entries()) {
        const lifetimeLabel = `${label} lifetime ${lifetimeIndex + 1}`;
        const playhead = lifetime.localPlayhead || {};
        const segments = playhead.segments || [];
        const duration = lifetime.endFrame - lifetime.startFrame + 1;
        const exactRemovalTermination = (
          lifetime.termination?.kind === "removal"
          && lifetime.termination?.frame === lifetime.endFrame + 1
          && lifetime.termination?.depth === lifetime.depth
          && lifetime.termination?.tag === "RemoveObject2"
          && lifetime.terminalAtParentEndPermittedByPinnedSpec === undefined
        );
        const exactParentTerminalTermination = (
          lifetime.termination?.kind === "parent-timeline-terminal"
          && lifetime.termination?.frame === lifetime.endFrame
          && lifetime.endFrame === parent.parentFrameCount
          && lifetime.termination?.depth === lifetime.depth
          && lifetime.termination?.tag === "End"
          && lifetime.terminalAtParentEndPermittedByPinnedSpec === true
        );
        const exactZeroWrapPolicy = playhead.wrapCount === 0
          ? playhead.zeroWrapPermittedByPinnedSpec === true && segments.length === 1
          : playhead.zeroWrapPermittedByPinnedSpec === undefined && segments.length >= 2;
        if (
          lifetime.placementOrdinal !== lifetimeIndex + 1
          || lifetime.parentTimelineId !== parent.parentTimelineId
          || lifetime.parentFrameDomainId !== parent.parentFrameDomainId
          || lifetime.sourceObjectId !== claim.sourceObjectId
          || lifetime.depthWasEmptyBeforePlacement !== true
          || lifetime.durationFrames !== duration
          || duration < 1
          || lifetime.placement?.frame !== lifetime.startFrame
          || lifetime.placement?.depth !== lifetime.depth
          || lifetime.placement?.declaredSourceObjectId !== claim.sourceObjectId
          || lifetime.placement?.replace !== "0"
          || lifetime.placement?.hasClipActions !== false
          || (!exactRemovalTermination && !exactParentTerminalTermination)
          // A RemoveObject2 may precede a fresh PlaceObject2 at the same depth
          // inside one parent frame. The source proof already resolves tag
          // order and requires depthWasEmptyBeforePlacement; retain that exact
          // same-frame boundary while rejecting a later or mismatched removal.
          || (lifetime.predecessorBoundary !== null && (
            lifetime.predecessorBoundary?.kind !== "removal"
            || lifetime.predecessorBoundary.depth !== lifetime.depth
            || lifetime.predecessorBoundary.tag !== "RemoveObject2"
            || lifetime.predecessorBoundary.frame > lifetime.startFrame
          ))
          || !(lifetime.updates || []).every((update) => (
            update.frame > lifetime.startFrame
            && update.frame <= lifetime.endFrame
            && update.depth === lifetime.depth
            && update.declaredSourceObjectId === null
            && update.preservesInstanceIdentity === true
            && update.hasClipActions === false
            && update.localFrame === ((update.frame - lifetime.startFrame) % claim.frameCount) + 1
          ))
          || playhead.indexing !== "one-indexed"
          || playhead.entryLocalFrame !== 1
          || playhead.parentFrameToLocalFrameFormula !== "((parentFrame - startFrame) % frameCount) + 1"
          || playhead.frameCount !== claim.frameCount
          || playhead.terminalLocalFrame !== ((lifetime.endFrame - lifetime.startFrame) % claim.frameCount) + 1
          || playhead.completeVisibleCycleCount !== Math.floor(duration / claim.frameCount)
          || playhead.wrapCount !== segments.length - 1
          || playhead.wrapCount < 0
          || !exactZeroWrapPolicy
          || playhead.implicitResetCount !== 0
          || playhead.explicitFreshPlacementResetCount !== 1
          || segments.length < 1
        ) {
          throw new Error(`${lifetimeLabel} does not prove its exact one-indexed lifetime/reset mapping`);
        }
        let nextParentFrame = lifetime.startFrame;
        for (const [segmentIndex, segment] of segments.entries()) {
          const segmentLength = segment.parentEndFrame - segment.parentStartFrame + 1;
          if (
            segment.kind !== (segmentIndex === 0 ? "entry" : "scriptless-wrap")
            || segment.parentStartFrame !== nextParentFrame
            || segment.parentEndFrame < segment.parentStartFrame
            || segment.localStartFrame !== 1
            || segment.localEndFrame !== segmentLength
            || segment.localEndFrame > claim.frameCount
          ) {
            throw new Error(`${lifetimeLabel} has a gap, overlap, or unsupported local playhead segment`);
          }
          nextParentFrame = segment.parentEndFrame + 1;
        }
        if (nextParentFrame !== lifetime.endFrame + 1) throw new Error(`${lifetimeLabel} does not exhaust its visible parent lifetime`);
        totalWrapCount += playhead.wrapCount;
      }
      const display = claim.internalDisplayGraph || {};
      const displayEvents = display.events || [];
      if (
        display.eventCount !== displayEvents.length
        || display.eventCount < 1
        || display.placementEventCount !== displayEvents.filter(({kind}) => kind !== "remove").length
        || display.removalEventCount !== displayEvents.filter(({kind}) => kind === "remove").length
        || display.unresolvedObjectCount !== 0
        || display.clipActionCount !== 0
        || display.allEventsHaveNoClipActions !== true
        || displayEvents.some((event) => event.hasClipActions === true)
        || claim.declaredFrameDomainAudit?.sourceTimelineDomainCount !== 0
        || claim.declaredFrameDomainAudit?.notDeclared !== true
        || (claim.declaredFrameDomainAudit?.frameDomainIds || []).length !== 0
        || claim.declaredFrameDomainAudit?.representedByParentFrameDomainId !== parent.parentFrameDomainId
        || claim.sourcePlayheadRule?.sourceGraphProvesAllWrapsAndResets !== true
        || claim.sourcePlayheadRule?.inferredLoopOrResetCount !== 0
        || claim.sourcePlayheadRule?.indexing !== "one-indexed"
      ) {
        throw new Error(`${label} lacks the exhaustive internal-display/non-declared/source-playhead proof`);
      }
      for (const obligation of ["visual", "button", "interaction", "behavior", "fullFrame", "rmse", "audio"]) {
        const value = claim.preservedObligations?.[obligation];
        if (value?.required !== true || value?.satisfiedByDisposition !== false || !value?.status) {
          throw new Error(`${label} does not preserve the ${obligation} obligation`);
        }
      }
      claimsByTimeline.set(claim.timelineId, {
        evidencePath: STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
        evidenceSha256: staticDispositionEvidenceSha256,
        claimIndex,
        role: claim.role,
        claimScope: claim.claimScope,
        parentTimelineId: parent.parentTimelineId,
        parentFrameDomainId: parent.parentFrameDomainId,
        ...(nestedDeclaredParent ? {
          parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
          parentEntryStateEstablished: false,
          parentRootPath: parent.parentRootPath.map((edge) => ({...edge})),
        } : {}),
        incomingPlacementCount: lifecycle.incomingPlacementCount,
        parentUpdateCount: lifecycle.parentUpdateCount,
        explicitRemovalCount: lifecycle.explicitRemovalCount,
        ...(parentTerminalTerminationCount > 0 ? {
          parentTerminalTerminationCount,
          replacementTerminationCount: lifecycle.replacementTerminationCount,
        } : {}),
        sourceProvenWrapCount: totalWrapCount,
        ...(zeroWrapLifetimeCount > 0 ? {zeroWrapLifetimeCount} : {}),
        visualObligation: claim.preservedObligations.visual,
        buttonObligation: claim.preservedObligations.button,
        interactionObligation: claim.preservedObligations.interaction,
        behaviorObligation: claim.preservedObligations.behavior,
        fullFrameObligation: claim.preservedObligations.fullFrame,
        rmseObligation: claim.preservedObligations.rmse,
        audioObligation: claim.preservedObligations.audio,
      });
      continue;
    }

    const placement = claim.placementAudit || {};
    const incoming = placement.incomingPlacements || [];
    const outgoing = placement.outgoingPlacements || [];
    if (
      claim.frameCount !== 1
      || timeline.structuralReachability !== "reachable-from-root-placement-graph"
      || claim.structuralReachability !== timeline.structuralReachability
      || claim.claimScope !== "independent-local-playhead-only"
      || claim.tagCensus?.declaredFrameCount !== 1
      || claim.tagCensus?.observedShowFrameCount !== 1
      || claim.tagCensus?.doActionTagCount !== 0
      || claim.tagCensus?.doInitActionTagCount !== 0
      || claim.scriptAudit?.ffdecFrameScriptCount !== 0
      || claim.scriptAudit?.attributedDoInitActionCount !== 0
      || claim.scriptAudit?.scriptless !== true
      || (claim.scriptAudit?.ffdecFrameScripts || []).length !== 0
      || (claim.scriptAudit?.attributedDoInitActions || []).length !== 0
      || claim.declaredFrameDomainAudit?.sourceTimelineDomainCount !== 0
      || claim.declaredFrameDomainAudit?.notDeclared !== true
      || (claim.declaredFrameDomainAudit?.frameDomainIds || []).length !== 0
    ) {
      throw new Error(`${label} lacks the exact one-frame scriptless/non-declared proof`);
    }
    if (
      !Array.isArray(incoming)
      || incoming.length < 1
      || !Array.isArray(outgoing)
      || placement.incomingPlacementCount !== incoming.length
      || placement.outgoingPlacementCount !== outgoing.length
      || placement.exportedPlacementCount !== incoming.length + outgoing.length
      || placement.unresolvedOutgoingObjectCount !== 0
      || placement.clipActionCount !== 0
      || placement.allExportedPlacementsHaveNoClipActions !== true
      || !incoming.every((item) => (
        item.sourceObjectId === claim.sourceObjectId
        && item.placedTimelineId === claim.timelineId
        && item.hasClipActions === false
        && allTimelineById.has(item.parentTimelineId)
      ))
      || !incoming.some((item) => timelineById.has(item.parentTimelineId))
      || !outgoing.every((item) => item.parentTimelineId === claim.timelineId && item.hasClipActions === false)
    ) {
      throw new Error(`${label} lacks the exhaustive no-clipActions exported-placement proof`);
    }
    for (const obligation of ["button", "interaction", "behavior", "fullFrame", "audio"]) {
      const value = claim.preservedObligations?.[obligation];
      if (value?.required !== true || value?.satisfiedByDisposition !== false || !value?.status) {
        throw new Error(`${label} does not preserve the ${obligation} obligation`);
      }
    }
    claimsByTimeline.set(claim.timelineId, {
      evidencePath: STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
      evidenceSha256: staticDispositionEvidenceSha256,
      claimIndex,
      role: claim.role,
      claimScope: claim.claimScope,
      parentTimelineIds: sortTimelineIds(new Set(incoming.map(({parentTimelineId}) => parentTimelineId))),
      exportedPlacementCount: placement.exportedPlacementCount,
      clipActionCount: 0,
      buttonObligation: claim.preservedObligations.button,
      interactionObligation: claim.preservedObligations.interaction,
      behaviorObligation: claim.preservedObligations.behavior,
      fullFrameObligation: claim.preservedObligations.fullFrame,
      audioObligation: claim.preservedObligations.audio,
    });
  }
  return claimsByTimeline;
}

function normalizeSourceProvenIndependentClaims({
  animationId,
  evidence,
  evidenceSha256,
  inventory,
  inventorySha256,
  manifestSha256,
  timelineById,
  domainsByTimeline,
  staticClaimsByTimeline,
  sourceSwfEvidence,
  swfmillEvidence,
  ffdecScriptsEvidence,
}) {
  if (!evidence) return new Map();
  assertSha256(
    evidenceSha256,
    `${animationId}: source-proven independent evidence SHA-256`,
  );
  validateSourceProvenIndependentEvidenceDocument(evidence, {
    animationId,
    sourceSwf: {
      path: sourceSwfEvidence.path,
      sha256: sourceSwfEvidence.sha256,
    },
    scenarioInventory: {
      path: `migrations/${animationId}/audit/scenario-inventory.json`,
      sha256: inventorySha256,
    },
    migrationTechnicalProjection: {
      path: `migrations/${animationId}/migration.json`,
      sha256: manifestSha256,
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
    },
    swfmillStructure: {
      path: swfmillEvidence.path,
      sha256: swfmillEvidence.sha256,
      uncompressedSha256: swfmillEvidence.uncompressedSha256,
    },
    ffdecScripts: {
      path: ffdecScriptsEvidence.path,
      sha256: ffdecScriptsEvidence.sha256,
      uncompressedSha256: ffdecScriptsEvidence.uncompressedSha256,
    },
  });
  const expectedAcceptedPairSet = canonicalIndependentPairSet(
    evidence.claims.map(({timelineId}) => ({animationId, timelineId})),
  );
  const expectedRejectedPairSet = canonicalIndependentPairSet(
    evidence.rejected.map(({timelineId}) => ({animationId, timelineId})),
  );
  if (
    JSON.stringify(evidence.exactPairSets.accepted)
      !== JSON.stringify(expectedAcceptedPairSet)
    || JSON.stringify(evidence.exactPairSets.rejected)
      !== JSON.stringify(expectedRejectedPairSet)
  ) {
    throw new Error(
      `${animationId}: source-proven independent accepted/rejected pair set drifted`,
    );
  }
  const remainingIds = new Set([
    ...evidence.claims.map(({timelineId}) => timelineId),
    ...evidence.rejected.map(({timelineId}) => timelineId),
  ]);
  const expectedUnresolvedIds = [...timelineById.values()]
    .filter((timeline) => (
      timeline.timelineId !== "root"
      && !(domainsByTimeline.get(timeline.timelineId) || []).length
      && !staticClaimsByTimeline.has(timeline.timelineId)
    ))
    .map(({timelineId}) => timelineId);
  if (
    remainingIds.size !== expectedUnresolvedIds.length
    || expectedUnresolvedIds.some((timelineId) => !remainingIds.has(timelineId))
  ) {
    throw new Error(
      `${animationId}: source-proven independent evidence does not exactly partition the first-wave unresolved set`,
    );
  }
  const claimsByTimeline = new Map();
  for (const [claimIndex, claim] of evidence.claims.entries()) {
    const timeline = timelineById.get(claim.timelineId);
    const label = `${animationId}/${claim.timelineId}`;
    if (
      !timeline
      || timeline.structuralReachability
        !== "reachable-from-root-placement-graph"
      || String(timeline.objectId) !== claim.sourceObjectId
      || timeline.frameCount !== claim.frameCount
      || claim.disposition !== "independent-required"
      || claim.role !== SOURCE_PROVEN_INDEPENDENT_PROOF_TYPE
      || claim.claimScope !== "separate-local-frame-action-domain-required"
      || (domainsByTimeline.get(claim.timelineId) || []).length !== 0
      || staticClaimsByTimeline.has(claim.timelineId)
    ) {
      throw new Error(`${label}: independent-required source identity drifted`);
    }
    const scriptAudit = claim.sourceProof || {};
    const scripts = scriptAudit.frameScripts || [];
    if (
      claim.frameCount <= 1
      || scriptAudit.declaredFrameCount !== claim.frameCount
      || scriptAudit.observedShowFrameCount !== claim.frameCount
      || scriptAudit.directDoActionTagCount <= 0
      || scriptAudit.directDoActionTagCount !== scripts.length
      || scriptAudit.ffdecFrameScriptCount !== scripts.length
      || scriptAudit.nonemptyFfdecFrameScriptCount <= 0
      || scriptAudit.exactDoActionToFfdecFrameScriptCount !== true
      || scriptAudit.allFrameScriptCoordinatesWithinLocalDomain !== true
      || scripts.some((script) => (
        !Number.isInteger(script.frame)
        || script.frame < 1
        || script.frame > claim.frameCount
        || !SHA256_PATTERN.test(script.bodySha256 || "")
      ))
    ) {
      throw new Error(`${label}: local-action frame-domain proof is incomplete`);
    }
    claimsByTimeline.set(claim.timelineId, {
      evidencePath: SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH,
      evidenceSha256,
      claimIndex,
      role: claim.role,
      claimScope: claim.claimScope,
      directDoActionTagCount: scriptAudit.directDoActionTagCount,
      ffdecFrameScriptCount: scriptAudit.ffdecFrameScriptCount,
      nonemptyFfdecFrameScriptCount:
        scriptAudit.nonemptyFfdecFrameScriptCount,
      frameScriptFrames: scripts.map(({frame}) => frame),
      preservedObligations: {...claim.preservedObligations},
    });
  }
  return claimsByTimeline;
}

function validateReport(report) {
  if (report.schemaVersion !== 1) throw new Error(`${report.animationId}: unsupported report schema`);
  const releaseCatalog = report.generatedFrom.lessonReleaseCatalog;
  if (releaseCatalog) {
    assertSha256(releaseCatalog.sha256, `${report.animationId}: lesson-release catalog SHA-256`);
    if (
      !releaseCatalog.releaseId
      || !releaseCatalog.path
      || path.isAbsolute(releaseCatalog.path)
      || releaseCatalog.path.split("/").includes("..")
      || !Number.isInteger(releaseCatalog.bytes)
      || releaseCatalog.bytes < 1
      || releaseCatalog.schemaVersion !== 1
      || releaseCatalog.bindingStatus !== "verified-exact-release-member"
      || releaseCatalog.member?.animationId !== report.animationId
      || releaseCatalog.member?.assetId !== `swf-${releaseCatalog.member?.sourceSha256}`
    ) {
      throw new Error(`${report.animationId}: lesson-release catalog binding is invalid`);
    }
  }
  const timelineIds = new Set();
  for (const timeline of report.timelines) {
    if (timelineIds.has(timeline.timelineId)) throw new Error(`${report.animationId}: duplicate timeline ${timeline.timelineId}`);
    timelineIds.add(timeline.timelineId);
    if (!DISPOSITIONS.includes(timeline.disposition)) throw new Error(`${report.animationId}: invalid disposition ${timeline.disposition}`);
    if (!Number.isInteger(timeline.frameCount) || timeline.frameCount < 1) throw new Error(`${report.animationId}: invalid frameCount for ${timeline.timelineId}`);
    if (timeline.sourceEvidence.scenarioInventorySha256 !== report.generatedFrom.scenarioInventory.sha256) {
      throw new Error(`${report.animationId}: ${timeline.timelineId} does not bind the report's scenario inventory SHA-256`);
    }
  }
  if (report.timelines[0]?.timelineId !== "root") throw new Error(`${report.animationId}: root must be the first enumerated timeline`);
  if (report.summary.enumeratedTimelineCount !== report.timelines.length) throw new Error(`${report.animationId}: enumerated timeline count is inconsistent`);
  if (report.summary.reachableChildTimelineCount !== report.timelines.length - 1) throw new Error(`${report.animationId}: reachable child timeline count is inconsistent`);
  const countSum = Object.values(report.summary.dispositionCounts).reduce((sum, count) => sum + count, 0);
  if (countSum !== report.timelines.length) throw new Error(`${report.animationId}: disposition counts are inconsistent`);
}

export function buildDispositionReport({
  animationId,
  inventory,
  inventorySha256,
  manifest,
  manifestSha256,
  releaseBinding = null,
  staticDispositionEvidence = null,
  staticDispositionEvidenceSha256 = null,
  independentDispositionEvidence = null,
  independentDispositionEvidenceSha256 = null,
}) {
  if (inventory.animationId !== animationId) throw new Error(`${animationId}: scenario inventory animationId mismatch`);
  if (manifest.animationId !== animationId) throw new Error(`${animationId}: migration manifest animationId mismatch`);
  assertSha256(inventorySha256, `${animationId}: scenario inventory SHA-256`);
  assertSha256(manifestSha256, `${animationId}: migration technical projection SHA-256`);

  const manifestEvidence = requiredEvidence(inventory, "migration-technical-contract");
  if (
    manifestEvidence.path !== "migration.json" ||
    manifestEvidence.projection !== TECHNICAL_MANIFEST_PROJECTION.id ||
    manifestEvidence.hashMode !== "canonical-json-v1" ||
    JSON.stringify(manifestEvidence.excludedPaths) !== JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths)
  ) {
    throw new Error(`${animationId}: scenario inventory migration technical contract descriptor is invalid`);
  }
  if (manifestEvidence.sha256 !== manifestSha256) {
    throw new Error(`${animationId}: migration technical projection is stale against scenario inventory (${manifestEvidence.sha256} != ${manifestSha256})`);
  }
  const swfmillEvidence = requiredEvidence(inventory, "swfmill-xml");
  const ffdecScriptsEvidence = requiredEvidence(inventory, "ffdec-scripts");
  const sourceSwfEvidence = requiredEvidence(inventory, "source-swf");
  const allTimelines = inventory.timelineInventory || [];
  const reachableTimelines = allTimelines.filter((timeline) => (
    timeline.structuralReachability === "root"
    || timeline.structuralReachability === "reachable-from-root-placement-graph"
  ));
  reachableTimelines.sort((left, right) => {
    if (left.timelineId === "root") return -1;
    if (right.timelineId === "root") return 1;
    return compareNumericText(left.objectId, right.objectId) || compareText(left.timelineId, right.timelineId);
  });
  if (reachableTimelines.filter((timeline) => timeline.timelineId === "root").length !== 1) {
    throw new Error(`${animationId}: scenario inventory must contain exactly one root timeline`);
  }
  const timelineById = new Map(reachableTimelines.map((timeline) => [timeline.timelineId, timeline]));
  const allTimelineById = new Map(allTimelines.map((timeline) => [timeline.timelineId, timeline]));
  const rootTimeline = timelineById.get("root");
  if (manifest.runtime?.frameCount !== rootTimeline.frameCount) {
    throw new Error(`${animationId}: manifest runtime.frameCount does not match the scenario root timeline`);
  }
  const declaredDomains = normalizeDeclaredFrameDomains(manifest, timelineById, animationId);
  const domainsByTimeline = new Map();
  for (const domain of declaredDomains) {
    if (!domainsByTimeline.has(domain.sourceTimelineId)) domainsByTimeline.set(domain.sourceTimelineId, []);
    domainsByTimeline.get(domain.sourceTimelineId).push(domain);
  }
  const placementGraph = buildNamedPlacementGraph(reachableTimelines);
  const staticClaimsByTimeline = normalizeStaticCompositeClaims({
    animationId,
    staticDispositionEvidence,
    staticDispositionEvidenceSha256,
    inventory,
    inventorySha256,
    manifest,
    manifestSha256,
    allTimelineById,
    timelineById,
    domainsByTimeline,
    placementGraph,
    sourceSwfEvidence,
    swfmillEvidence,
  });
  const sourceProvenIndependentClaimsByTimeline =
    normalizeSourceProvenIndependentClaims({
      animationId,
      evidence: independentDispositionEvidence,
      evidenceSha256: independentDispositionEvidenceSha256,
      inventory,
      inventorySha256,
      manifestSha256,
      timelineById,
      domainsByTimeline,
      staticClaimsByTimeline,
      sourceSwfEvidence,
      swfmillEvidence,
      ffdecScriptsEvidence,
    });
  const timelines = reachableTimelines.map((timeline) => {
    const timelineDomains = domainsByTimeline.get(timeline.timelineId) || [];
    const rootPlacement = rootPlacementFor(timeline, placementGraph);
    const staticCompositeClaim = staticClaimsByTimeline.get(timeline.timelineId) || null;
    const sourceProvenIndependentClaim =
      sourceProvenIndependentClaimsByTimeline.get(timeline.timelineId) || null;
    const disposition = dispositionFor(
      timelineDomains,
      staticCompositeClaim,
      sourceProvenIndependentClaim,
    );
    return {
      timelineId: timeline.timelineId,
      sourceTimelineId: timeline.timelineId,
      sourceObjectId: timeline.objectId === null ? null : String(timeline.objectId),
      frameCount: timeline.frameCount,
      structuralReachability: timeline.structuralReachability,
      rootPlacement,
      knownNamedParentPlacements: placementGraph.parents.get(timeline.timelineId) || [],
      declaredFrameDomains: timelineDomains,
      disposition: disposition.disposition,
      dispositionBasis: disposition.basis,
      ...(staticCompositeClaim ? {staticCompositeEvidence: staticCompositeClaim} : {}),
      ...(sourceProvenIndependentClaim ? {
        sourceProvenIndependentEvidence: sourceProvenIndependentClaim,
      } : {}),
      riskAssessment: riskAssessment(
        timeline,
        rootTimeline,
        timelineDomains,
        rootPlacement,
        staticCompositeClaim,
        sourceProvenIndependentClaim,
      ),
      staticSignals: {
        controlStateCount: (timeline.controlStates || []).length,
        frameLabelCount: (timeline.frameLabels || []).length,
        namedChildPlacementCount: (timeline.namedPlacements || []).length,
      },
      sourceEvidence: {
        scenarioInventoryPath: "audit/scenario-inventory.json",
        scenarioInventorySha256: inventorySha256,
        swfmillArtifactId: swfmillEvidence.artifactId,
        swfmillPath: swfmillEvidence.path,
        swfmillSha256: swfmillEvidence.sha256,
      },
    };
  });
  const dispositionCounts = Object.fromEntries(DISPOSITIONS.map((disposition) => [disposition, 0]));
  for (const timeline of timelines) dispositionCounts[timeline.disposition] += 1;
  const highRiskCandidates = timelines
    .filter((timeline) => timeline.riskAssessment.level === "high")
    .map((timeline) => ({
      timelineId: timeline.timelineId,
      sourceObjectId: timeline.sourceObjectId,
      frameCount: timeline.frameCount,
      rootPlacementStatus: timeline.rootPlacement.status,
      signals: timeline.riskAssessment.signals,
    }))
    .sort((left, right) => right.frameCount - left.frameCount || compareNumericText(left.sourceObjectId, right.sourceObjectId));

  const report = {
    schemaVersion: 1,
    animationId,
    status: dispositionCounts.unresolved > 0
      ? "structurally-enumerated-dispositions-unresolved"
      : "structurally-enumerated",
    migrationStatusChanged: false,
    authorityStatement: [
      "This audit deterministically enumerates the root timeline and every child timeline that the hash-bound scenario inventory marks reachable from the root placement graph.",
      "A declared frame domain is reported only when the scenario inventory's bound migration technical projection matches the current technical contract and implementation.frameDomains names the same source timeline with the same frame count.",
      sourceProvenIndependentClaimsByTimeline.size
        ? "Static placement reachability, duration, labels, or an unbound action signal alone are triage, not a disposition proof. Only the exact checked composite or local-action evidence contracts named here may resolve an undeclared timeline; every unsupported classification remains unresolved."
        : "Static placement reachability, duration, labels, and action states are triage signals, not proof that an undeclared timeline is composite-only, independently required, or nonvisual; unsupported classifications remain unresolved.",
      "Named root-placement paths include only placement names retained by scenario-inventory.json. Missing named paths do not negate its full-graph structural-reachability result.",
      ...(staticClaimsByTimeline.size ? ["Evidence-backed composite claims are accepted only from a reproducible checked artifact whose source, scenario inventory, machine structure, scripts, matrices, bounds, and obligations all verify."] : []),
      ...(sourceProvenIndependentClaimsByTimeline.size ? ["Evidence-backed independent-required claims are assigned only when exact local multi-frame DoAction tags and one-for-one FFDec sprite frame-script exports prove an undeclared source-local action domain. This stricter result creates work and grants no acceptance."] : []),
    ],
    dispositionDefinitions: {
      "declared-frame-domain": "The bound manifest explicitly declares this source timeline as a frame domain with a matching frame count.",
      "composite-child-with-parent": staticClaimsByTimeline.size
        ? "A reproducible hash-bound source audit proves that the child's local state is exhaustively represented inside a declared parent domain while all non-frame-domain obligations remain pending."
        : "Reserved for a future evidence-backed conclusion that the child's local state is exhaustively represented inside a declared parent domain; never inferred here from placement alone.",
      "independent-required": sourceProvenIndependentClaimsByTimeline.size
        ? "A reproducible hash-bound source audit proves source-authored action state at exact frames in the undeclared child timeline's own local coordinates; the child must be declared and specified as a separate frame domain before strict acceptance."
        : "Reserved for a future authoritative-runtime or authoring-evidence conclusion that this undeclared local playhead requires its own frame domain.",
      nonvisual: "Reserved for a future asset/script/authoring audit proving that the timeline has no visual or interaction-state contribution.",
      unresolved: "Current evidence does not support one of the other dispositions without guessing.",
    },
    generatedFrom: {
      ...(releaseBinding ? {
        lessonReleaseCatalog: {
          releaseId: releaseBinding.releaseId,
          path: releaseBinding.catalog.path,
          bytes: releaseBinding.catalog.bytes,
          sha256: releaseBinding.catalog.sha256,
          schemaVersion: releaseBinding.catalog.schemaVersion,
          ...(releaseBinding.releaseFingerprintSha256 ? {
            releaseFingerprintSha256:
              releaseBinding.releaseFingerprintSha256,
            orderedMemberIdentitySha256:
              releaseBinding.orderedMemberIdentitySha256,
          } : {}),
          member: releaseBinding.members[animationId],
          bindingStatus: "verified-exact-release-member",
        },
      } : {}),
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        sha256: inventorySha256,
        schemaVersion: inventory.schemaVersion,
        inventoryStatus: inventory.inventoryStatus,
      },
      migrationManifest: {
        path: manifestEvidence.path,
        hashMode: "canonical-json-v1",
        technicalProjection: TECHNICAL_MANIFEST_PROJECTION.id,
        technicalProjectionSha256: manifestSha256,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
        bindingStatus: "verified",
      },
      sourceSwf: {
        path: sourceSwfEvidence.path,
        sha256: sourceSwfEvidence.sha256,
      },
      swfmillStructure: {
        path: swfmillEvidence.path,
        sha256: swfmillEvidence.sha256,
      },
      ...(staticDispositionEvidence ? {
        staticDispositionEvidence: {
          path: STATIC_DISPOSITION_EVIDENCE_RELATIVE_PATH,
          sha256: staticDispositionEvidenceSha256,
          schemaVersion: staticDispositionEvidence.schemaVersion,
          status: staticDispositionEvidence.status,
          claimCount: staticDispositionEvidence.claims.length,
          bindingStatus: "verified-and-rebuilt",
        },
      } : {}),
      ...(independentDispositionEvidence ? {
        sourceProvenIndependentDispositionEvidence: {
          path: SOURCE_PROVEN_INDEPENDENT_EVIDENCE_RELATIVE_PATH,
          sha256: independentDispositionEvidenceSha256,
          schemaVersion: independentDispositionEvidence.schemaVersion,
          status: independentDispositionEvidence.status,
          claimCount: independentDispositionEvidence.claims.length,
          rejectedCount: independentDispositionEvidence.rejected.length,
          bindingStatus: "verified-source-obligation",
        },
      } : {}),
    },
    summary: {
      inventoryTimelineCount: allTimelines.length,
      enumeratedTimelineCount: timelines.length,
      reachableChildTimelineCount: timelines.length - 1,
      excludedNotProvenTimelineCount: allTimelines.length - timelines.length,
      dispositionCounts,
      highRiskIndependentCandidateCount: highRiskCandidates.length,
      highRiskIndependentCandidates: highRiskCandidates,
    },
    timelines,
    strictAcceptanceEffect: "none; this structural audit does not advance migration status or satisfy authoritative runtime, full-frame RMSE, audio, behavior, human-review, or owner-acceptance gates",
  };
  validateReport(report);
  return report;
}

async function validateOutputParent(outputPath, migrationsRoot, animationId) {
  const resolvedRoot = path.resolve(migrationsRoot);
  const resolvedOutput = path.resolve(outputPath);
  if (!isContainedPath(resolvedRoot, resolvedOutput)) {
    throw new Error(`${animationId}: frame-domain disposition output escapes the migration root`);
  }
  if (path.basename(resolvedOutput) !== "frame-domain-disposition.json") {
    throw new Error(`${animationId}: refusing an unexpected frame-domain disposition output name`);
  }
  await assertOrdinaryAncestorTree(
    resolvedRoot,
    resolvedOutput,
    `${animationId}: frame-domain disposition output`,
  );
  const outputParent = path.dirname(resolvedOutput);
  const parentInfo = await lstat(outputParent, {bigint: true});
  if (!parentInfo.isDirectory() || parentInfo.isSymbolicLink()) {
    throw new Error(`${animationId}: audit output parent must be a real directory`);
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(resolvedRoot),
    realpath(outputParent),
  ]);
  if (!isContainedPath(realRoot, realParent)) {
    throw new Error(`${animationId}: audit output parent real path escapes the migration root`);
  }
  return {
    outputPath: resolvedOutput,
    outputParent,
    realRoot,
    outputParentIdentity: {
      dev: String(parentInfo.dev),
      ino: String(parentInfo.ino),
      mode: String(parentInfo.mode),
    },
  };
}

async function captureOutputTarget(outputPath, migrationsRoot, animationId) {
  const output = await validateOutputParent(outputPath, migrationsRoot, animationId);
  const information = await lstatOrNull(output.outputPath);
  if (!information) {
    return {
      ...output,
      exists: false,
      bytes: null,
      byteLength: 0,
      sha256: "",
      stat: null,
    };
  }
  if (!information.isFile() || information.isSymbolicLink()) {
    throw new Error(`${animationId}: frame-domain disposition output must be an ordinary non-symlink file`);
  }
  if (information.nlink !== 1n) {
    throw new Error(`${animationId}: frame-domain disposition output must have exactly one hard link`);
  }
  const snapshot = await readStableRegularFile(
    output.outputPath,
    `${animationId}: frame-domain disposition output`,
    {
      containmentRoot: migrationsRoot,
      requireSingleLink: true,
    },
  );
  return {
    ...output,
    exists: true,
    bytes: snapshot.bytes,
    byteLength: snapshot.byteLength,
    sha256: snapshot.sha256,
    stat: snapshot.stat,
    realPath: snapshot.realPath,
  };
}

function outputStateMatches(expected, observed) {
  return expected.exists === observed.exists
    && JSON.stringify(expected.outputParentIdentity)
      === JSON.stringify(observed.outputParentIdentity)
    && (!expected.exists || (
      expected.realPath === observed.realPath
      && expected.byteLength === observed.byteLength
      && expected.sha256 === observed.sha256
      && JSON.stringify(expected.stat) === JSON.stringify(observed.stat)
    ));
}

async function assertOutputParentIdentity(transaction, migrationsRoot) {
  const current = await validateOutputParent(
    transaction.outputPath,
    migrationsRoot,
    transaction.animationId,
  );
  if (
    JSON.stringify(current.outputParentIdentity)
      !== JSON.stringify(transaction.original.outputParentIdentity)
  ) {
    throw new Error(
      `${transaction.animationId}: frame-domain disposition output parent changed after preflight`,
    );
  }
}

async function assertOutputTargetUnchanged(transaction, migrationsRoot) {
  const current = await captureOutputTarget(
    transaction.outputPath,
    migrationsRoot,
    transaction.animationId,
  );
  if (!outputStateMatches(transaction.original, current)) {
    throw new Error(`${transaction.animationId}: frame-domain disposition output changed after preflight`);
  }
}

async function exclusiveWriteFile(
  candidate,
  bytes,
  mode = 0o600,
  onCreate = () => {},
) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    onCreate(statIdentity(await handle.stat({bigint: true})));
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function unlinkIfPresent(candidate) {
  try {
    await unlink(candidate);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function unlinkOwnedIfPresent(candidate, expectedIdentity, label) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  if (
    !information.isFile()
    || information.isSymbolicLink()
    || !sameStoredInode(statIdentity(information), expectedIdentity)
  ) {
    throw new Error(`${label}: refusing to remove a foreign transaction file`);
  }
  await unlink(candidate);
}

async function rmdirIfPresent(candidate) {
  try {
    await rmdir(candidate);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function writeTransactionJournal(transaction, phase) {
  transaction.phase = phase;
  const journal = {
    schemaVersion: 1,
    transactionId: transaction.transactionId,
    animationId: transaction.animationId,
    output: portable(path.relative(projectRoot, transaction.outputPath)),
    original: {
      existed: transaction.original.exists,
      bytes: transaction.original.byteLength,
      sha256: transaction.original.sha256,
    },
    replacement: {
      bytes: transaction.renderedBytes.length,
      sha256: transaction.renderedSha256,
    },
    phase,
  };
  await writeFile(
    transaction.journalPath,
    `${JSON.stringify(journal, null, 2)}\n`,
    {
      encoding: "utf8",
      flag: transaction.journalCreated ? "w" : "wx",
      mode: 0o600,
    },
  );
  transaction.journalCreated = true;
}

async function cleanupTransactionArtifacts(transaction, {keepJournal = false} = {}) {
  await unlinkOwnedIfPresent(
    transaction.stagePath,
    transaction.stageStat || transaction.stageOwnerStat,
    `${transaction.animationId}: staged disposition cleanup`,
  );
  await unlinkOwnedIfPresent(
    transaction.backupPath,
    transaction.displacedStat,
    `${transaction.animationId}: displaced disposition cleanup`,
  );
  if (!keepJournal) {
    await unlinkIfPresent(transaction.journalPath);
    await rmdirIfPresent(transaction.transactionDirectory);
  }
}

async function prepareDispositionTransaction(entry, migrationsRoot, batchId) {
  const original = await captureOutputTarget(entry.outputPath, migrationsRoot, entry.animationId);
  const nonce = randomBytes(16).toString("hex");
  const transactionId = `${batchId}-${nonce}`;
  const baseName = path.basename(original.outputPath);
  const stagePath = path.join(original.outputParent, `.${baseName}.${transactionId}.stage`);
  const transactionDirectory = path.join(
    original.outputParent,
    `.${baseName}.${transactionId}.transaction`,
  );
  await mkdir(transactionDirectory, {mode: 0o700});
  const transaction = {
    ...entry,
    transactionId,
    original,
    renderedBytes: Buffer.from(entry.rendered, "utf8"),
    renderedSha256: createHash("sha256").update(entry.rendered, "utf8").digest("hex"),
    stagePath,
    transactionDirectory,
    backupPath: path.join(transactionDirectory, "original"),
    journalPath: path.join(transactionDirectory, "journal.json"),
    journalCreated: false,
    phase: "preparing",
  };
  try {
    await exclusiveWriteFile(
      stagePath,
      transaction.renderedBytes,
      0o644,
      (identity) => {
        transaction.stageOwnerStat = identity;
      },
    );
    const staged = await readStableRegularFile(
      stagePath,
      `${entry.animationId}: staged frame-domain disposition`,
      {
        containmentRoot: original.outputParent,
        requireSingleLink: true,
      },
    );
    if (staged.sha256 !== transaction.renderedSha256 || staged.byteLength !== transaction.renderedBytes.length) {
      throw new Error(`${entry.animationId}: staged frame-domain disposition failed its byte identity check`);
    }
    transaction.stageStat = staged.stat;
    await writeTransactionJournal(transaction, "staged");
    return transaction;
  } catch (error) {
    try {
      await cleanupTransactionArtifacts(transaction);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `${entry.animationId}: disposition staging failed and cleanup was incomplete`,
      );
    }
    throw error;
  }
}

async function verifyCommittedReplacement(transaction, migrationsRoot) {
  const current = await captureOutputTarget(
    transaction.outputPath,
    migrationsRoot,
    transaction.animationId,
  );
  if (
    !current.exists
    || current.byteLength !== transaction.renderedBytes.length
    || current.sha256 !== transaction.renderedSha256
    || !sameStoredInode(
      current.stat,
      transaction.installedStat || transaction.stageStat,
    )
    || (
      transaction.installedStat
      && !sameStoredIdentity(current.stat, transaction.installedStat)
    )
  ) {
    throw new Error(`${transaction.animationId}: committed frame-domain disposition failed its byte identity check`);
  }
  return current;
}

async function rollbackDispositionTransaction(transaction, migrationsRoot) {
  await assertOutputParentIdentity(transaction, migrationsRoot);
  if (transaction.original.exists) {
    if (
      transaction.phase === "original-moved"
      || transaction.phase === "target-linked"
      || transaction.phase === "committed"
    ) {
      const backup = await readStableRegularFile(
        transaction.backupPath,
        `${transaction.animationId}: rollback original`,
        {
          containmentRoot: transaction.transactionDirectory,
          requireSingleLink: true,
        },
      );
      if (
        backup.byteLength !== transaction.original.byteLength
        || backup.sha256 !== transaction.original.sha256
        || !sameStoredIdentity(
          backup.stat,
          transaction.displacedStat,
        )
      ) {
        throw new Error(`${transaction.animationId}: rollback original no longer matches preflight`);
      }
      const current = await lstatOrNull(transaction.outputPath);
      if (transaction.phase === "target-linked") {
        if (!current) {
          throw new Error(`${transaction.animationId}: linked output disappeared before rollback`);
        }
        const [target, stage] = await Promise.all([
          readStableRegularFile(
            transaction.outputPath,
            `${transaction.animationId}: linked rollback target`,
            {containmentRoot: migrationsRoot, requireSingleLink: false},
          ),
          readStableRegularFile(
            transaction.stagePath,
            `${transaction.animationId}: linked rollback stage`,
            {
              containmentRoot: transaction.original.outputParent,
              requireSingleLink: false,
            },
          ),
        ]);
        if (
          target.stat.dev !== stage.stat.dev
          || target.stat.ino !== stage.stat.ino
          || target.sha256 !== transaction.renderedSha256
          || stage.sha256 !== transaction.renderedSha256
        ) {
          throw new Error(`${transaction.animationId}: linked rollback target is no longer the staged replacement`);
        }
        await unlink(transaction.outputPath);
      } else if (transaction.phase === "committed") {
        if (!current) {
          throw new Error(`${transaction.animationId}: committed output disappeared before rollback`);
        }
        await verifyCommittedReplacement(transaction, migrationsRoot);
        await unlink(transaction.outputPath);
      } else if (current) {
        throw new Error(`${transaction.animationId}: output reappeared before rollback`);
      }
      await assertOutputParentIdentity(transaction, migrationsRoot);
      await link(transaction.backupPath, transaction.outputPath);
      await unlink(transaction.backupPath);
    }
  } else if (transaction.phase === "target-linked" || transaction.phase === "committed") {
    if (transaction.phase === "target-linked") {
      const [target, stage] = await Promise.all([
        readStableRegularFile(
          transaction.outputPath,
          `${transaction.animationId}: linked rollback target`,
          {containmentRoot: migrationsRoot, requireSingleLink: false},
        ),
        readStableRegularFile(
          transaction.stagePath,
          `${transaction.animationId}: linked rollback stage`,
          {containmentRoot: transaction.original.outputParent, requireSingleLink: false},
        ),
      ]);
      if (
        target.stat.dev !== stage.stat.dev
        || target.stat.ino !== stage.stat.ino
        || target.sha256 !== transaction.renderedSha256
        || stage.sha256 !== transaction.renderedSha256
      ) {
        throw new Error(`${transaction.animationId}: linked rollback target is no longer the staged replacement`);
      }
    } else {
      await verifyCommittedReplacement(transaction, migrationsRoot);
    }
    await unlink(transaction.outputPath);
  }
  await writeTransactionJournal(transaction, "rolled-back");
}

async function rollbackDispositionBatch(transactions, migrationsRoot, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      await rollbackDispositionTransaction(transaction, migrationsRoot);
      await cleanupTransactionArtifacts(transaction);
    } catch (error) {
      rollbackErrors.push(error);
      await writeTransactionJournal(transaction, "rollback-failed").catch(() => {});
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      `Frame-domain disposition batch failed and ${rollbackErrors.length} rollback(s) also failed`,
    );
  }
  throw originalError;
}

async function commitDispositionBatch(prepared, migrationsRoot, hooks = {}, guard = async () => {}) {
  const batchId = `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const [index, entry] of prepared.entries()) {
      const transaction = await prepareDispositionTransaction(
        entry,
        migrationsRoot,
        batchId,
      );
      transactions.push(transaction);
      await hooks.afterStage?.({
        index,
        animationId: transaction.animationId,
        outputPath: transaction.outputPath,
        stagePath: transaction.stagePath,
      });
    }
    await guard();
    for (const transaction of transactions) {
      await assertOutputTargetUnchanged(transaction, migrationsRoot);
    }

    for (const [index, transaction] of transactions.entries()) {
      await guard();
      await assertOutputTargetUnchanged(transaction, migrationsRoot);
      await hooks.beforeCommit?.({
        index,
        animationId: transaction.animationId,
        outputPath: transaction.outputPath,
      });
      await guard();
      await assertOutputTargetUnchanged(transaction, migrationsRoot);
      await writeTransactionJournal(transaction, "commit-started");
      if (transaction.original.exists) {
        await rename(transaction.outputPath, transaction.backupPath);
        await writeTransactionJournal(transaction, "original-moved");
        const displaced = await readStableRegularFile(
          transaction.backupPath,
          `${transaction.animationId}: displaced frame-domain disposition`,
          {
            containmentRoot: transaction.transactionDirectory,
            requireSingleLink: true,
          },
        );
        if (
          displaced.byteLength !== transaction.original.byteLength
          || displaced.sha256 !== transaction.original.sha256
          || !sameDisplacedStoredIdentity(
            displaced.stat,
            transaction.original.stat,
          )
        ) {
          throw new Error(`${transaction.animationId}: displaced frame-domain disposition failed compare-and-swap verification`);
        }
        transaction.displacedStat = displaced.stat;
      }
      await hooks.beforeInstall?.({
        index,
        animationId: transaction.animationId,
        outputPath: transaction.outputPath,
      });
      await assertOutputParentIdentity(transaction, migrationsRoot);
      const staged = await readStableRegularFile(
        transaction.stagePath,
        `${transaction.animationId}: pre-link staged frame-domain disposition`,
        {
          containmentRoot: transaction.original.outputParent,
          requireSingleLink: true,
        },
      );
      if (
        staged.sha256 !== transaction.renderedSha256
        || staged.byteLength !== transaction.renderedBytes.length
        || !sameStoredIdentity(staged.stat, transaction.stageStat)
      ) {
        throw new Error(
          `${transaction.animationId}: staged frame-domain disposition changed before install`,
        );
      }
      await link(transaction.stagePath, transaction.outputPath);
      await writeTransactionJournal(transaction, "target-linked");
      await unlink(transaction.stagePath);
      await writeTransactionJournal(transaction, "committed");
      const committed = await verifyCommittedReplacement(
        transaction,
        migrationsRoot,
      );
      transaction.installedStat = committed.stat;
      await hooks.afterCommit?.({
        index,
        animationId: transaction.animationId,
        outputPath: transaction.outputPath,
      });
    }
    await guard();
    for (const transaction of transactions) {
      await assertOutputParentIdentity(transaction, migrationsRoot);
      await verifyCommittedReplacement(transaction, migrationsRoot);
    }
  } catch (error) {
    await rollbackDispositionBatch(transactions, migrationsRoot, error);
  }

  const cleanupErrors = [];
  try {
    await hooks.beforeCleanup?.({transactions});
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const transaction of transactions) {
    try {
      await cleanupTransactionArtifacts(transaction);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `Frame-domain disposition batch committed, but ${cleanupErrors.length} transaction artifact cleanup(s) failed`,
    );
  }
}

export async function buildFrameDomainDispositions(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const selection = await resolveFrameDomainDispositionSelection({...options, migrationsRoot});
  const ids = selection.ids;
  const prepared = [];
  for (const animationId of ids) {
    const workspace = path.join(migrationsRoot, animationId);
    const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
    const manifestPath = path.join(workspace, "migration.json");
    if (!(await lstatOrNull(inventoryPath))) {
      throw new Error(`${animationId}: scenario inventory is missing`);
    }
    if (!(await lstatOrNull(manifestPath))) {
      throw new Error(`${animationId}: migration manifest is missing`);
    }
    let inventorySnapshot;
    let manifestSnapshot;
    try {
      [inventorySnapshot, manifestSnapshot] = await Promise.all([
        readStableRegularFile(
          inventoryPath,
          `${animationId}: scenario inventory`,
          {
            containmentRoot: migrationsRoot,
            requireSingleLink: true,
          },
        ),
        readStableRegularFile(
          manifestPath,
          `${animationId}: migration manifest`,
          {
            containmentRoot: migrationsRoot,
            requireSingleLink: true,
          },
        ),
      ]);
    } catch (error) {
      throw error;
    }
    const inventoryText = inventorySnapshot.bytes.toString("utf8");
    const manifestText = manifestSnapshot.bytes.toString("utf8");
    const inventorySha256 = inventorySnapshot.sha256;
    const manifest = JSON.parse(manifestText);
    const manifestSha256 = technicalManifestSha256(manifest);
    const staticEvidence = options.staticEvidenceResolver
      ? await options.staticEvidenceResolver(animationId, {
        migrationsRoot,
        releaseBinding: selection.releaseBinding,
      })
      : (
        STATIC_DISPOSITION_ANIMATION_IDS.includes(animationId)
          ? await verifyStaticFrameDomainDispositionEvidence(
            animationId,
            {migrationsRoot},
          )
          : null
      );
    const staticEvidenceSnapshot = staticEvidence
      ? await readStableRegularFile(
        staticEvidence.outputPath,
        `${animationId}: static frame-domain disposition evidence`,
        {
          containmentRoot: migrationsRoot,
          requireSingleLink: true,
        },
      )
      : null;
    if (
      staticEvidenceSnapshot &&
      (staticEvidenceSnapshot.sha256 !== staticEvidence.sha256 ||
        staticEvidenceSnapshot.bytes.toString("utf8") !==
          staticEvidence.rendered)
    ) {
      throw new Error(
        `${animationId}: static disposition evidence changed during preflight`,
      );
    }
    const independentEvidence = options.independentDispositionEvidenceResolver
      ? await options.independentDispositionEvidenceResolver(animationId, {
        migrationsRoot,
        releaseBinding: selection.releaseBinding,
      })
      : null;
    const independentEvidenceSnapshot = independentEvidence
      ? await readStableRegularFile(
        independentEvidence.outputPath,
        `${animationId}: source-proven independent frame-domain evidence`,
        {
          containmentRoot: migrationsRoot,
          requireSingleLink: true,
        },
      )
      : null;
    if (
      independentEvidenceSnapshot
      && (
        independentEvidenceSnapshot.sha256 !== independentEvidence.sha256
        || independentEvidenceSnapshot.bytes.toString("utf8")
          !== independentEvidence.rendered
      )
    ) {
      throw new Error(
        `${animationId}: source-proven independent evidence changed during preflight`,
      );
    }
    const report = buildDispositionReport({
      animationId,
      inventory: JSON.parse(inventoryText),
      inventorySha256,
      manifest,
      manifestSha256,
      releaseBinding: selection.releaseBinding,
      staticDispositionEvidence: staticEvidence?.document || null,
      staticDispositionEvidenceSha256: staticEvidence?.sha256 || null,
      independentDispositionEvidence:
        independentEvidence?.document || null,
      independentDispositionEvidenceSha256:
        independentEvidence?.sha256 || null,
    });
    const outputPath = path.join(workspace, "audit", "frame-domain-disposition.json");
    const rendered = `${JSON.stringify(report, null, 2)}\n`;
    prepared.push({
      animationId,
      outputPath,
      rendered,
      report,
      inputSnapshots: [
        inventorySnapshot,
        manifestSnapshot,
        ...(staticEvidenceSnapshot ? [staticEvidenceSnapshot] : []),
        ...(independentEvidenceSnapshot
          ? [independentEvidenceSnapshot]
          : []),
      ],
    });
  }

  const allInputSnapshots = [
    ...(selection.releaseCatalogSnapshot
      ? [selection.releaseCatalogSnapshot]
      : []),
    ...(selection.releaseInputSnapshots || []),
    ...prepared.flatMap(({inputSnapshots = []}) => inputSnapshots),
  ];
  const verifyAllInputGuards = () =>
    assertStableInputSet(allInputSnapshots);
  await verifyAllInputGuards();

  const results = [];
  if (options.check) {
    for (const {animationId, outputPath, rendered, report} of prepared) {
      await verifyAllInputGuards();
      const existing = await captureOutputTarget(outputPath, migrationsRoot, animationId);
      if (!existing.exists) throw new Error(`${animationId}: frame-domain disposition audit is missing`);
      if (existing.bytes.toString("utf8") !== rendered) {
        throw new Error(`${animationId}: frame-domain disposition audit is stale`);
      }
      results.push({animationId, action: "verified", output: portable(path.relative(projectRoot, outputPath)), report});
    }
  } else {
    await commitDispositionBatch(
      prepared,
      migrationsRoot,
      options.transactionHooks || {},
      verifyAllInputGuards,
    );
    for (const {animationId, outputPath, report} of prepared) {
      results.push({animationId, action: "written", output: portable(path.relative(projectRoot, outputPath)), report});
    }
  }
  return results;
}

function usage() {
  return `Usage: node scripts/build-frame-domain-dispositions.mjs [options]\n\nOptions:\n  --id <animation-id>       Generate one supported legacy pilot, or one verified release member; repeatable\n  --release-id <release-id> Bind every --id to one exact release; release mode requires at least one --id\n  --lesson-releases <file>  Project-contained, single-link lesson-release catalog (default: catalog/lesson-releases.json)\n  --migrations <directory>  Migration root (default: migrations)\n  --check                   Verify checked-in audits without writing\n  --help                    Show this help\n\nUse build-lesson-release-frame-domain-dispositions.mjs for an explicit full-release\noperation. Before any output is written, every selected member is verified against\nthe exact byte/hash-bound catalog, workspace identity, source path, asset ID, and\nphysical SWF SHA-256. Batch writes use exclusive same-directory staging,\ncompare-and-swap rechecks, and rollback journals; symlink and hard-link targets\nare refused. The command retains only audit/frame-domain-disposition.json after\nsuccess. It does not change migration status, reviews, manifests, coverage, or\npreserved sources.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const results = await buildFrameDomainDispositions(options);
    for (const result of results) {
      process.stdout.write(`${result.action}: ${result.animationId} -> ${result.output} (${result.report.summary.reachableChildTimelineCount} reachable children, ${result.report.summary.dispositionCounts["composite-child-with-parent"]} evidence-backed composite, ${result.report.summary.dispositionCounts.unresolved} unresolved)\n`);
    }
  }
}
