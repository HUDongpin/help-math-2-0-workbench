#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  link,
  open,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const GENERATOR_PATH =
  "scripts/materialize-g5-l4-source-derived-keyframe-candidates.mjs";
export const RELEASE_PATH = "catalog/lesson-releases.json";
export const SOURCE_SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
export const TEMPLATE_PATH = "templates/flash-migration/keyframes.csv";
export const RECEIPT_PATH =
  "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json";
export const LOCK_PATH =
  ".g5-l4-source-derived-keyframe-candidates.lock";

const SCENARIO_INVENTORY_NAME = "audit/scenario-inventory.json";
const COVERAGE_NAME = "evidence/full-frame-coverage.json";
const MIGRATION_NAME = "migration.json";
const KEYFRAMES_NAME = "keyframes.csv";
const M1_RECEIPT_NAME =
  "audit/machine/g5-l4-m1-static-reconciliation-receipt.json";

export const KEYFRAME_HEADERS = Object.freeze([
  "frame",
  "requirement_id",
  "frame_domain_id",
  "trace_id",
  "entry_state_sha256",
  "time_ms",
  "scenario",
  "language",
  "kind",
  "expected_state",
  "trigger",
  "baseline_file",
  "baseline_sha256",
  "implementation_file",
  "implementation_sha256",
  "diff_file",
  "diff_sha256",
  "normalized_rmse",
  "timing_result",
  "visual_result",
  "evidence_source",
  "reviewer",
  "notes",
]);

const SPECIAL_MEMBER_CLASSES = Object.freeze({
  "course-g05-l04-fq-001":
    "independent-dual-sprite-product-candidate",
  "course-g05-l04-fq-002":
    "product-question-atlas-structural-candidate",
  "course-g05-l04-fq-003":
    "product-question-atlas-structural-candidate",
  "shell-course-g05-l04-index-local":
    "product-shell-structural-candidate",
});

const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "authoritativeOriginalRuntime",
  "authoritativeBaselineKeyframes",
  "runtimeReachabilityEstablished",
  "interactionCausalityEstablished",
  "audioAccepted",
  "bilingualAccepted",
  "currentJavaScriptAccepted",
  "fidelityAccepted",
  "humanVisualAccepted",
  "ownerAccepted",
  "strictComplete",
  "published",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function withFingerprint(document) {
  const receiptFingerprintSha256 = sha256(stableJson(document));
  return {
    ...document,
    receiptFingerprintSha256,
    generatedMarker: `sha256:${receiptFingerprintSha256}`,
  };
}

function descriptor(relativePath, bytes) {
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be normalized project-relative POSIX text`,
  );
  const absolutePath = path.resolve(root, relativePath);
  invariant(contained(root, absolutePath), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, absolutePath)) === relativePath,
    `${label}: path is not normalized`,
  );
  return absolutePath;
}

async function readBinding(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const rootReal = await realpath(root);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: must be an ordinary single-link file`,
  );
  invariant(
    contained(rootReal, await realpath(absolutePath)),
    `${label}: resolves outside the project root`,
  );
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.mode === after.mode &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs,
    `${label}: changed while it was read`,
  );
  return {
    absolutePath,
    relativePath,
    bytes,
    binding: descriptor(relativePath, bytes),
    identity: {
      dev: after.dev,
      ino: after.ino,
      mode: after.mode,
      size: after.size,
      mtimeMs: after.mtimeMs,
    },
  };
}

async function readOptionalBinding(root, relativePath, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  try {
    return await readBinding(root, relativePath, label);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function parseJson(record, label) {
  try {
    return JSON.parse(record.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/u.test(text)
    ? `"${text.replaceAll("\"", "\"\"")}"`
    : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function parseHeader(bytes, label) {
  const firstLine = bytes.toString("utf8").replace(/\r\n/gu, "\n")
    .split("\n", 1)[0];
  const headers = firstLine.split(",");
  invariant(
    JSON.stringify(headers) === JSON.stringify(KEYFRAME_HEADERS),
    `${label}: keyframe header drifted`,
  );
  return firstLine;
}

function sourcePathForMember(member) {
  return member.source?.path ?? member.source?.swf?.path;
}

function sourceShaForMember(member) {
  return member.source?.sha256 ?? member.source?.swf?.sha256;
}

export function classifyCandidateBoundary(animationId, migration) {
  if (SPECIAL_MEMBER_CLASSES[animationId]) {
    return SPECIAL_MEMBER_CLASSES[animationId];
  }
  invariant(
    migration.implementation?.candidateState?.status ===
      "current-javascript-engineering-candidate-only" &&
      migration.implementation.candidateState.originalRuntimeBaselineUsed ===
        false &&
      migration.implementation.candidateState.strictAcceptanceEffect ===
        "none",
    `${animationId}: expected a manifest-bound source-static candidate`,
  );
  return "manifest-bound-source-static-candidate";
}

function timelineMapFor(inventory) {
  const timelines = new Map();
  for (const timeline of inventory.timelineInventory) {
    invariant(
      typeof timeline.timelineId === "string" &&
        Number.isInteger(timeline.frameCount) &&
        timeline.frameCount >= 1 &&
        Array.isArray(timeline.controlStates) &&
        Array.isArray(timeline.frameLabels) &&
        Array.isArray(timeline.namedPlacements),
      `${inventory.animationId}: malformed static timeline inventory`,
    );
    invariant(
      !timelines.has(timeline.timelineId),
      `${inventory.animationId}: duplicate timeline ${timeline.timelineId}`,
    );
    timelines.set(timeline.timelineId, timeline);
  }
  return timelines;
}

function placementGraph(timelines) {
  const graph = new Map();
  for (const timeline of timelines.values()) {
    const edges = [];
    for (const placement of timeline.namedPlacements) {
      const child = `sprite-${placement.objectId}`;
      if (!timelines.has(child)) continue;
      const frame = Number(placement.frame);
      if (!Number.isInteger(frame) || frame < 1 || frame > timeline.frameCount) {
        continue;
      }
      edges.push({
        child,
        frame,
        depth: String(placement.depth ?? ""),
        name: String(placement.name ?? ""),
        objectId: String(placement.objectId),
      });
    }
    edges.sort((left, right) =>
      left.frame - right.frame ||
      left.child.localeCompare(right.child) ||
      left.depth.localeCompare(right.depth) ||
      left.name.localeCompare(right.name));
    graph.set(timeline.timelineId, edges);
  }
  return graph;
}

function pathsFromDeclaredDomain(graph, startTimelineId) {
  const discovered = new Map([[startTimelineId, {
    distance: 0,
    anchorFrame: null,
    path: [startTimelineId],
  }]]);
  const queue = [startTimelineId];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentPath = discovered.get(current);
    for (const edge of graph.get(current) ?? []) {
      const candidate = {
        distance: currentPath.distance + 1,
        anchorFrame: currentPath.distance === 0
          ? edge.frame
          : currentPath.anchorFrame,
        path: [...currentPath.path, edge.child],
      };
      const prior = discovered.get(edge.child);
      const candidateKey = `${candidate.distance}:${String(candidate.anchorFrame)
        .padStart(9, "0")}:${candidate.path.join("/")}`;
      const priorKey = prior
        ? `${prior.distance}:${String(prior.anchorFrame)
          .padStart(9, "0")}:${prior.path.join("/")}`
        : null;
      if (!prior || candidateKey < priorKey) {
        discovered.set(edge.child, candidate);
        queue.push(edge.child);
      }
    }
  }
  return discovered;
}

function handlerContexts(handler) {
  const contexts = [];
  if (
    typeof handler.timelineContext?.timelineId === "string" &&
    Number.isInteger(handler.timelineContext.frame)
  ) {
    contexts.push({
      timelineId: handler.timelineContext.timelineId,
      frame: handler.timelineContext.frame,
      contextSource: "handler-timeline-context",
    });
  }
  for (const placement of handler.hitTarget?.placements ?? []) {
    const timelineId = placement.timelineContext?.timelineId ??
      placement.timelineId;
    const frame = Number(
      placement.timelineContext?.frame ?? placement.frame,
    );
    if (typeof timelineId === "string" && Number.isInteger(frame)) {
      contexts.push({
        timelineId,
        frame,
        contextSource: "button-placement-context",
      });
    }
  }
  const unique = new Map();
  for (const context of contexts) {
    unique.set(
      `${context.timelineId}:${context.frame}:${context.contextSource}`,
      context,
    );
  }
  return [...unique.values()].sort((left, right) =>
    left.timelineId.localeCompare(right.timelineId) ||
    left.frame - right.frame ||
    left.contextSource.localeCompare(right.contextSource));
}

function selectDeclaredAnchor({
  sourceTimelineId,
  sourceFrame,
  declaredDomains,
  pathsByDomain,
}) {
  const candidates = [];
  for (const domain of declaredDomains) {
    const pathInfo = pathsByDomain.get(domain.id)?.get(sourceTimelineId);
    if (!pathInfo) continue;
    candidates.push({
      domainId: domain.id,
      frame: pathInfo.distance === 0 ? sourceFrame : pathInfo.anchorFrame,
      distance: pathInfo.distance,
      path: pathInfo.path,
      sourceTimelineId,
      sourceFrame,
    });
  }
  candidates.sort((left, right) =>
    left.distance - right.distance ||
    Number(left.domainId === "root") - Number(right.domainId === "root") ||
    left.domainId.localeCompare(right.domainId) ||
    left.frame - right.frame ||
    left.path.join("/").localeCompare(right.path.join("/")));
  return candidates[0] ?? null;
}

function projectionGroup(groups, domainId, frame) {
  const key = `${domainId}:${String(frame).padStart(9, "0")}`;
  if (!groups.has(key)) {
    groups.set(key, {
      domainId,
      frame,
      controlStates: [],
      interactions: [],
    });
  }
  return groups.get(key);
}

function compactControlState(timeline, controlState, anchor) {
  return {
    sourceTimelineId: timeline.timelineId,
    sourceFrame: controlState.frame,
    structuralReachability: timeline.structuralReachability,
    reasons: [...new Set(controlState.reasons)].sort(),
    anchoredDirectly: anchor.distance === 0,
    declaredDomainPath: anchor.path,
  };
}

function compactInteraction(handler, context, anchor) {
  return {
    handlerId: handler.id,
    script: handler.script,
    bodySha256: handler.bodySha256,
    sourceTimelineId: context.timelineId,
    sourceFrame: context.frame,
    contextSource: context.contextSource,
    events: [...new Set(handler.event ?? [])].sort(),
    categories: [...new Set(handler.categories ?? [])].sort(),
    randomCallCount: handler.signals?.randomCalls?.length ?? 0,
    sideEffectCount: handler.signals?.sideEffects?.length ?? 0,
    transitionCount: handler.signals?.transitions?.length ?? 0,
    anchoredDirectly: anchor.distance === 0,
    declaredDomainPath: anchor.path,
  };
}

function classifyKind(group, directReasons) {
  if (group.interactions.length > 0) return "interaction";
  const reasons = new Set(directReasons);
  if (reasons.has("terminal-structural-frame")) return "structural-terminal";
  if (reasons.has("initial-one-indexed-frame")) return "structural-initial";
  if (reasons.has("script-stop-state")) return "authored-stop";
  return "static";
}

function timeMs(frame, fps) {
  const value = ((frame - 1) * 1000) / fps;
  return value.toFixed(6).replace(/\.?(?:0+)$/u, "");
}

function boundaryNote(candidateClass) {
  const common =
    "Static source-derived candidate only: the row frame is a declared pending coverage-domain structural anchor, not an observed runtime frame. The language value binds the existing pending coverage identity only; no bilingual visual or audio result is asserted. Baseline PNG, runtime authority, interaction causality, implementation capture, RMSE, human review, Owner acceptance, strict completion, and publication remain absent.";
  if ([
    "independent-dual-sprite-product-candidate",
    "product-question-atlas-structural-candidate",
    "product-shell-structural-candidate",
  ].includes(candidateClass)) {
    return `${common} Product/structural candidate boundary: nested source facts are aggregated only at a source-proven declared-domain entry anchor and do not create a canonical nested runtime domain.`;
  }
  return common;
}

function validateCoverageBoundary(animationId, migration, coverage) {
  invariant(
    coverage.schemaVersion === 2 &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length >= 2,
    `${animationId}: coverage-v2 requirements are missing`,
  );
  const manifestDomains = new Map(
    (migration.implementation?.frameDomains ?? []).map((domain) => [
      domain.id,
      domain,
    ]),
  );
  invariant(manifestDomains.has("root"), `${animationId}: root domain is missing`);
  for (const requirement of coverage.requirements) {
    const domain = manifestDomains.get(requirement.frameDomainId);
    invariant(
      domain &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === domain.frameCount &&
        ["en", "es"].includes(requirement.language) &&
        typeof requirement.requirementId === "string" &&
        typeof requirement.traceId === "string" &&
        isSha256(requirement.entryStateSha256) &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.status === "pending" &&
        requirement.capturedFrameCount === 0 &&
        requirement.baselineCaptureManifest === "" &&
        requirement.captureManifest === "" &&
        requirement.metricsFile === "",
      `${animationId}: coverage requirement crossed the pending candidate boundary`,
    );
  }
  return [...manifestDomains.values()];
}

export function buildCandidateRows({
  member,
  migration,
  coverage,
  scenarioInventory,
}) {
  const animationId = member.animationId;
  invariant(
    migration.schemaVersion === 2 &&
      migration.animationId === animationId &&
      migration.id === animationId &&
      migration.assetId === member.assetId &&
      migration.status === "preserved" &&
      migration.source?.swfSha256 === sourceShaForMember(member) &&
      migration.baseline?.authority === "undecided" &&
      migration.acceptance?.humanVisualReview?.decision === "pending" &&
      migration.acceptance?.ownerReview?.decision === "pending",
    `${animationId}: migration identity or acceptance boundary drifted`,
  );
  invariant(
    scenarioInventory.schemaVersion === 1 &&
      scenarioInventory.animationId === animationId &&
      scenarioInventory.source?.swfSha256 === sourceShaForMember(member) &&
      scenarioInventory.source?.rootFrameCount ===
        migration.runtime.frameCount &&
      scenarioInventory.source?.fps === migration.runtime.fps &&
      scenarioInventory.inventoryStatus ===
        "static-exhaustive-runtime-unverified" &&
      scenarioInventory.migrationStatusChanged === false &&
      Array.isArray(scenarioInventory.authoritativeRuntimeEvidence) &&
      scenarioInventory.authoritativeRuntimeEvidence.length === 0 &&
      Array.isArray(scenarioInventory.timelineInventory) &&
      Array.isArray(scenarioInventory.interactions?.handlers),
    `${animationId}: scenario inventory drifted or crossed runtime authority`,
  );
  const candidateClass = classifyCandidateBoundary(animationId, migration);
  const declaredDomains = validateCoverageBoundary(
    animationId,
    migration,
    coverage,
  );
  const timelines = timelineMapFor(scenarioInventory);
  for (const domain of declaredDomains) {
    const timeline = timelines.get(domain.sourceTimelineId ?? domain.id);
    invariant(
      timeline && timeline.frameCount === domain.frameCount,
      `${animationId}: declared domain ${domain.id} lacks matching static timeline`,
    );
  }
  const graph = placementGraph(timelines);
  const pathsByDomain = new Map(
    declaredDomains.map((domain) => [
      domain.id,
      pathsFromDeclaredDomain(graph, domain.sourceTimelineId ?? domain.id),
    ]),
  );
  const normalizedDeclaredDomains = declaredDomains.map((domain) => ({
    ...domain,
    sourceTimelineId: domain.sourceTimelineId ?? domain.id,
  }));
  const groups = new Map();
  let mappedControlStateCount = 0;
  let unmappedControlStateCount = 0;
  for (const timeline of timelines.values()) {
    for (const controlState of timeline.controlStates) {
      const frame = Number(controlState.frame);
      invariant(
        Number.isInteger(frame) && frame >= 1 && frame <= timeline.frameCount,
        `${animationId}: invalid control-state frame in ${timeline.timelineId}`,
      );
      const anchor = selectDeclaredAnchor({
        sourceTimelineId: timeline.timelineId,
        sourceFrame: frame,
        declaredDomains: normalizedDeclaredDomains,
        pathsByDomain,
      });
      if (!anchor) {
        unmappedControlStateCount += 1;
        continue;
      }
      projectionGroup(groups, anchor.domainId, anchor.frame).controlStates.push(
        compactControlState(timeline, controlState, anchor),
      );
      mappedControlStateCount += 1;
    }
  }

  let mappedHandlerCount = 0;
  let mappedInteractionInstanceCount = 0;
  let unmappedHandlerCount = 0;
  for (const handler of scenarioInventory.interactions.handlers) {
    const contexts = handlerContexts(handler);
    let handlerMapped = false;
    for (const context of contexts) {
      if (!timelines.has(context.timelineId)) continue;
      const anchor = selectDeclaredAnchor({
        sourceTimelineId: context.timelineId,
        sourceFrame: context.frame,
        declaredDomains: normalizedDeclaredDomains,
        pathsByDomain,
      });
      if (!anchor) continue;
      projectionGroup(groups, anchor.domainId, anchor.frame).interactions.push(
        compactInteraction(handler, context, anchor),
      );
      handlerMapped = true;
      mappedInteractionInstanceCount += 1;
    }
    if (handlerMapped) mappedHandlerCount += 1;
    else unmappedHandlerCount += 1;
  }

  const requirementByDomainLanguage = new Map();
  for (const requirement of coverage.requirements) {
    const key = `${requirement.frameDomainId}:${requirement.language}`;
    invariant(
      !requirementByDomainLanguage.has(key),
      `${animationId}: duplicate coverage identity ${key}`,
    );
    requirementByDomainLanguage.set(key, requirement);
  }

  const rows = [];
  const grouped = [...groups.values()].sort((left, right) => {
    const leftIndex = declaredDomains.findIndex(({id}) => id === left.domainId);
    const rightIndex = declaredDomains.findIndex(({id}) => id === right.domainId);
    return leftIndex - rightIndex || left.frame - right.frame;
  });
  for (const group of grouped) {
    const controlStates = group.controlStates.sort((left, right) =>
      left.sourceTimelineId.localeCompare(right.sourceTimelineId) ||
      left.sourceFrame - right.sourceFrame ||
      JSON.stringify(left.reasons).localeCompare(JSON.stringify(right.reasons)));
    const interactions = group.interactions.sort((left, right) =>
      left.handlerId.localeCompare(right.handlerId) ||
      left.sourceTimelineId.localeCompare(right.sourceTimelineId) ||
      left.sourceFrame - right.sourceFrame ||
      left.contextSource.localeCompare(right.contextSource));
    const projection = {
      animationId,
      candidateClass,
      declaredFrameDomainId: group.domainId,
      declaredAnchorFrame: group.frame,
      authority: "source-static-candidate-only-not-observed-runtime",
      controlStates,
      interactions,
    };
    const projectionSha256 = sha256(stableJson(projection));
    const directReasons = [...new Set(
      controlStates
        .filter(({anchoredDirectly}) => anchoredDirectly)
        .flatMap(({reasons}) => reasons),
    )].sort();
    const categories = [...new Set(
      interactions.flatMap(({categories: values}) => values),
    )].sort();
    const events = [...new Set(
      interactions.flatMap(({events: values}) => values),
    )].sort();
    const sourceTimelines = new Set([
      ...controlStates.map(({sourceTimelineId}) => sourceTimelineId),
      ...interactions.map(({sourceTimelineId}) => sourceTimelineId),
    ]);
    const expectedState = [
      "source-derived structural candidate",
      `directReasons=${directReasons.join("|") || "none"}`,
      `controlStates=${controlStates.length}`,
      `interactionInstances=${interactions.length}`,
      `events=${events.join("|") || "none"}`,
      `categories=${categories.join("|") || "none"}`,
      `sourceTimelineCount=${sourceTimelines.size}`,
      `projectionSha256=${projectionSha256}`,
    ].join("; ");
    for (const language of ["en", "es"]) {
      const requirement = requirementByDomainLanguage.get(
        `${group.domainId}:${language}`,
      );
      invariant(
        requirement,
        `${animationId}: missing ${group.domainId}/${language} coverage identity`,
      );
      rows.push({
        frame: String(group.frame),
        requirement_id: requirement.requirementId,
        frame_domain_id: group.domainId,
        trace_id: requirement.traceId,
        entry_state_sha256: requirement.entryStateSha256,
        time_ms: timeMs(group.frame, migration.runtime.fps),
        scenario: requirement.scenario,
        language,
        kind: classifyKind(group, directReasons),
        expected_state: expectedState,
        trigger: interactions.length > 0
          ? "static-source-interaction-obligation"
          : "static-source-control-state",
        baseline_file: "",
        baseline_sha256: "",
        implementation_file: "",
        implementation_sha256: "",
        diff_file: "",
        diff_sha256: "",
        normalized_rmse: "",
        timing_result: "pending-authoritative-original-runtime",
        visual_result: "pending-authoritative-original-runtime",
        evidence_source:
          `${member.workspacePath}/${SCENARIO_INVENTORY_NAME}#source-derived-candidate`,
        reviewer: "",
        notes: boundaryNote(candidateClass),
      });
    }
  }
  invariant(rows.length > 0, `${animationId}: no candidate rows derived`);
  for (const requirement of coverage.requirements) {
    invariant(
      rows.some((row) =>
        row.requirement_id === requirement.requirementId &&
        row.frame_domain_id === requirement.frameDomainId &&
        row.trace_id === requirement.traceId &&
        row.entry_state_sha256 === requirement.entryStateSha256 &&
        row.scenario === requirement.scenario &&
        row.language === requirement.language),
      `${animationId}: candidate rows do not cover ${requirement.requirementId}`,
    );
  }
  const csvBytes = Buffer.from(csv([
    KEYFRAME_HEADERS,
    ...rows.map((row) => KEYFRAME_HEADERS.map((header) => row[header])),
  ]));
  return {
    animationId,
    candidateClass,
    rows,
    csvBytes,
    derivation: {
      declaredDomainCount: declaredDomains.length,
      requirementCount: coverage.requirements.length,
      rowCount: rows.length,
      sourceTimelineCount: timelines.size,
      sourceControlStateCount: [...timelines.values()].reduce(
        (total, timeline) => total + timeline.controlStates.length,
        0,
      ),
      mappedControlStateCount,
      unmappedControlStateCount,
      sourceHandlerCount: scenarioInventory.interactions.handlers.length,
      mappedHandlerCount,
      unmappedHandlerCount,
      mappedInteractionInstanceCount,
      authoritativeBaselineKeyframeCount: 0,
      observedRuntimeRowCount: 0,
    },
  };
}

function validateRelease(releaseDocument, scopeDocument) {
  const release = releaseDocument.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(release, `${RELEASE_ID}: release is missing`);
  invariant(
    Array.isArray(release.members) &&
      release.members.length === 55 &&
      scopeDocument.releaseId === RELEASE_ID &&
      Array.isArray(scopeDocument.members) &&
      scopeDocument.members.length === 55,
    `${RELEASE_ID}: expected an exact 55-member release and source scope`,
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const releaseMember = release.members[index];
    const scopeMember = scopeDocument.members[index];
    invariant(
      releaseMember.ordinal === index + 1 &&
        scopeMember.ordinal === index + 1 &&
        releaseMember.animationId === scopeMember.animationId &&
        releaseMember.assetId === scopeMember.assetId &&
        sourcePathForMember(releaseMember) === sourcePathForMember(scopeMember) &&
        sourceShaForMember(releaseMember) === sourceShaForMember(scopeMember) &&
        scopeMember.workspacePath ===
          `migrations/${scopeMember.animationId}` &&
        scopeMember.strictComplete === false,
      `${RELEASE_ID}: member ${index + 1} identity drifted`,
    );
  }
  return scopeDocument.members;
}

function validateHistoricalM1Receipt(member, receipt, preimageBinding) {
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.artifactType === "g5-l4-m1-static-reconciliation-receipt" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId &&
      receipt.acceptanceEffects?.authoritativeOriginalRuntime === false &&
      receipt.acceptanceEffects?.strictComplete === false &&
      receipt.acceptanceEffects?.published === false &&
      receipt.inputs?.canonicalKeyframes?.path === preimageBinding.path &&
      receipt.inputs.canonicalKeyframes.bytes === preimageBinding.bytes &&
      receipt.inputs.canonicalKeyframes.sha256 === preimageBinding.sha256,
    `${member.animationId}: historical M1 keyframe preimage binding drifted`,
  );
}

function allFalseRecord(keys) {
  return Object.fromEntries(keys.map((key) => [key, false]));
}

export function validateSuccessorReceipt(receipt) {
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.receiptType ===
        "g5-l4-source-derived-keyframe-candidate-successor-receipt" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.scope?.memberCount === 55 &&
      receipt.scope?.managedKeyframeCsvCount === 55 &&
      receipt.scope?.g4FilesChanged === 0 &&
      receipt.scope?.assetInventoryFilesChanged === 0 &&
      Array.isArray(receipt.members) && receipt.members.length === 55 &&
      receipt.summary?.authoritativeBaselineKeyframeCount === 0 &&
      receipt.summary?.observedRuntimeRowCount === 0 &&
      ACCEPTANCE_EFFECT_KEYS.every(
        (key) => receipt.acceptanceEffects?.[key] === false,
      ) &&
      receipt.execution?.originalRuntimeSessionsExecuted === 0 &&
      receipt.execution?.guiApplicationsLaunched === 0 &&
      receipt.execution?.legacyEndpointsExecuted === 0 &&
      receipt.predecessorPolicy?.historicalM1ReceiptsRewritten === false &&
      receipt.staleCascade?.historicalArtifactsRewritten === false,
    "successor receipt crossed its candidate-only authority boundary",
  );
  const {receiptFingerprintSha256, generatedMarker, ...unsigned} = receipt;
  invariant(
    isSha256(receiptFingerprintSha256) &&
      generatedMarker === `sha256:${receiptFingerprintSha256}` &&
      sha256(stableJson(unsigned)) === receiptFingerprintSha256,
    "successor receipt fingerprint drifted",
  );
  for (const member of receipt.members) {
    invariant(
      member.output?.path ===
        `migrations/${member.animationId}/keyframes.csv` &&
        member.output.before?.sha256 !== member.output.after?.sha256 &&
        member.derivation?.authoritativeBaselineKeyframeCount === 0 &&
        member.derivation?.observedRuntimeRowCount === 0 &&
        member.derivation?.rowCount > 0,
      `${member.animationId}: successor member boundary drifted`,
    );
  }
  return true;
}

async function collectState(root) {
  const [generator, releaseRecord, scopeRecord, templateRecord] =
    await Promise.all([
      readBinding(root, GENERATOR_PATH, "generator"),
      readBinding(root, RELEASE_PATH, "lesson release catalog"),
      readBinding(root, SOURCE_SCOPE_PATH, "G5 L4 source scope"),
      readBinding(root, TEMPLATE_PATH, "keyframe template"),
    ]);
  const header = parseHeader(templateRecord.bytes, "keyframe template");
  invariant(
    templateRecord.bytes.toString("utf8") === `${header}\n`,
    "keyframe template must remain header-only",
  );
  const releaseDocument = parseJson(releaseRecord, "lesson release catalog");
  const scopeDocument = parseJson(scopeRecord, "G5 L4 source scope");
  const members = validateRelease(releaseDocument, scopeDocument);
  const memberRecords = [];
  for (const member of members) {
    const workspace = member.workspacePath;
    const paths = {
      migration: `${workspace}/${MIGRATION_NAME}`,
      coverage: `${workspace}/${COVERAGE_NAME}`,
      scenarioInventory: `${workspace}/${SCENARIO_INVENTORY_NAME}`,
      keyframes: `${workspace}/${KEYFRAMES_NAME}`,
      m1Receipt: `${workspace}/${M1_RECEIPT_NAME}`,
    };
    const [migrationRecord, coverageRecord, scenarioRecord, keyframeRecord,
      m1ReceiptRecord] = await Promise.all([
      readBinding(root, paths.migration, `${member.animationId}: migration`),
      readBinding(root, paths.coverage, `${member.animationId}: coverage`),
      readBinding(
        root,
        paths.scenarioInventory,
        `${member.animationId}: scenario inventory`,
      ),
      readBinding(root, paths.keyframes, `${member.animationId}: keyframes`),
      readBinding(root, paths.m1Receipt, `${member.animationId}: M1 receipt`),
    ]);
    const m1Receipt = parseJson(
      m1ReceiptRecord,
      `${member.animationId}: M1 receipt`,
    );
    const preimageBinding = {
      path: paths.keyframes,
      bytes: templateRecord.bytes.length,
      sha256: templateRecord.binding.sha256,
    };
    validateHistoricalM1Receipt(member, m1Receipt, preimageBinding);
    const derived = buildCandidateRows({
      member,
      migration: parseJson(migrationRecord, `${member.animationId}: migration`),
      coverage: parseJson(coverageRecord, `${member.animationId}: coverage`),
      scenarioInventory: parseJson(
        scenarioRecord,
        `${member.animationId}: scenario inventory`,
      ),
    });
    const afterBinding = descriptor(paths.keyframes, derived.csvBytes);
    invariant(
      keyframeRecord.binding.sha256 === preimageBinding.sha256 ||
        keyframeRecord.binding.sha256 === afterBinding.sha256,
      `${member.animationId}: keyframes are neither the historical preimage nor the exact successor`,
    );
    memberRecords.push({
      member,
      paths,
      migrationRecord,
      coverageRecord,
      scenarioRecord,
      keyframeRecord,
      m1ReceiptRecord,
      preimageBinding,
      afterBinding,
      derived,
    });
  }

  const classCounts = Object.fromEntries(
    [...new Set(memberRecords.map(({derived}) => derived.candidateClass))]
      .sort()
      .map((candidateClass) => [
        candidateClass,
        memberRecords.filter(
          ({derived}) => derived.candidateClass === candidateClass,
        ).length,
      ]),
  );
  invariant(
    classCounts["manifest-bound-source-static-candidate"] === 51 &&
      classCounts["independent-dual-sprite-product-candidate"] === 1 &&
      classCounts["product-question-atlas-structural-candidate"] === 2 &&
      classCounts["product-shell-structural-candidate"] === 1,
    "G5 L4 candidate classification must remain 51 + 1 + 2 + 1",
  );

  const total = (key) => memberRecords.reduce(
    (sum, record) => sum + record.derived.derivation[key],
    0,
  );
  const transactionProjection = {
    releaseId: RELEASE_ID,
    generator: generator.binding,
    releaseCatalog: releaseRecord.binding,
    sourceScope: scopeRecord.binding,
    template: templateRecord.binding,
    outputs: memberRecords.map(({member, afterBinding}) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      ...afterBinding,
    })),
  };
  const transactionId = `sha256:${sha256(stableJson(transactionProjection))}`;
  const unsignedReceipt = {
    schemaVersion: 1,
    receiptType:
      "g5-l4-source-derived-keyframe-candidate-successor-receipt",
    releaseId: RELEASE_ID,
    transactionId,
    generatedBy: {
      ...generator.binding,
      version: 1,
    },
    inputs: {
      releaseCatalog: releaseRecord.binding,
      sourceScope: scopeRecord.binding,
      canonicalHeaderTemplate: templateRecord.binding,
    },
    scope: {
      memberCount: 55,
      managedKeyframeCsvCount: 55,
      successorReceiptCount: 1,
      g4FilesChanged: 0,
      assetInventoryFilesChanged: 0,
      audioInventoryFilesChanged: 0,
      migrationManifestFilesChanged: 0,
      coverageFilesChanged: 0,
      sharedFrontendFilesChanged: 0,
    },
    boundary: {
      evidenceClass: "source-derived-static-keyframe-candidate",
      sourceBasis:
        "existing hash-bound audit/scenario-inventory.json derived from FFDec ActionScript plus swfmill timeline structure",
      rowFrameMeaning:
        "declared pending coverage-domain structural anchor only; never an observed runtime frame",
      languageMeaning:
        "existing pending coverage identity only; no bilingual appearance or audio assertion",
      fq002Fq003ShellMeaning:
        "product/structural candidate obligations aggregated at source-proven root anchors; no canonical nested runtime domain or reachability claim",
      authoritativeBaselineKeyframesEstablished: false,
      runtimeObserved: false,
    },
    candidateClassCounts: classCounts,
    members: memberRecords.map((record) => ({
      ordinal: record.member.ordinal,
      animationId: record.member.animationId,
      assetId: record.member.assetId,
      source: {
        path: sourcePathForMember(record.member),
        sha256: sourceShaForMember(record.member),
      },
      candidateClass: record.derived.candidateClass,
      inputs: {
        migrationManifest: record.migrationRecord.binding,
        fullFrameCoverage: record.coverageRecord.binding,
        staticScenarioInventory: record.scenarioRecord.binding,
        historicalM1Receipt: record.m1ReceiptRecord.binding,
      },
      output: {
        path: record.paths.keyframes,
        before: record.preimageBinding,
        after: record.afterBinding,
      },
      derivation: record.derived.derivation,
    })),
    summary: {
      rowCount: total("rowCount"),
      requirementCount: total("requirementCount"),
      sourceTimelineCount: total("sourceTimelineCount"),
      sourceControlStateCount: total("sourceControlStateCount"),
      mappedControlStateCount: total("mappedControlStateCount"),
      unmappedControlStateCount: total("unmappedControlStateCount"),
      sourceHandlerCount: total("sourceHandlerCount"),
      mappedHandlerCount: total("mappedHandlerCount"),
      unmappedHandlerCount: total("unmappedHandlerCount"),
      mappedInteractionInstanceCount: total("mappedInteractionInstanceCount"),
      authoritativeBaselineKeyframeCount: 0,
      observedRuntimeRowCount: 0,
    },
    predecessorPolicy: {
      historicalM1ReceiptCount: 55,
      historicalM1ReceiptsRewritten: false,
      historicalHeaderOnlyPreimageRetainedByHash: true,
      successorPurpose:
        "records the bounded canonical keyframes.csv transition without rewriting historical adoption evidence",
    },
    staleCascade: {
      historicalArtifactsRewritten: false,
      directCurrentConsumerNowStale: [
        "reports/g5-l4-specification-readiness.json",
        "reports/g5-l4-specification-readiness.md",
      ],
      downstreamConsumersExpectedStaleUntilSeparatelyRegenerated: [
        "reports/g5-l4-review-workflow-preparation.json",
        "reports/g5-l4-review-workflow-preparation.md",
        "reports/g5-l4-continuation-machine-readiness.json",
        "reports/g5-l4-continuation-machine-readiness.md",
      ],
      historicalWorkspaceArtifactsThatRetainHeaderOnlyBindings: [
        "audit/machine/g5-l4-m1-static-reconciliation-receipt.json",
        "audit/machine/g5-l4-pre-runtime-specification-candidate-receipt.json",
        "audit/machine/specification-inventory-readiness.json where present",
      ],
      policy:
        "Do not rewrite historical receipts. Regenerate current derived consumers only through their own reviewed successor or ordinary deterministic generator after accepting this transition.",
    },
    execution: {
      originalRuntimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
      networkRequestsExecuted: 0,
    },
    acceptanceEffects: allFalseRecord(ACCEPTANCE_EFFECT_KEYS),
    unresolved: {
      authoritativeOriginalRuntimeBaselines: true,
      naturalTraceExecution: true,
      runtimeReachabilityAndInteractionCausality: true,
      bilingualVisualAndAudioEvidence: true,
      implementationCaptureAndRmse: true,
      independentHumanReview: true,
      ownerAcceptance: true,
      strictCompletion: true,
      publication: true,
    },
  };
  const receipt = withFingerprint(unsignedReceipt);
  validateSuccessorReceipt(receipt);
  const receiptBytes = Buffer.from(stableJson(receipt));
  return {
    generator,
    releaseRecord,
    scopeRecord,
    templateRecord,
    memberRecords,
    receipt,
    receiptBytes,
    receiptBinding: descriptor(RECEIPT_PATH, receiptBytes),
    transactionId,
  };
}

async function writeExactTemporary(targetPath, bytes, transactionId) {
  const suffix = transactionId.replace("sha256:", "").slice(0, 16);
  const temporaryPath = `${targetPath}.keyframe-candidate-${suffix}-${randomUUID()}.tmp`;
  await writeFile(temporaryPath, bytes, {flag: "wx", mode: 0o644});
  return temporaryPath;
}

function sameIdentity(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs;
}

async function assertRecordCurrent(root, record, label) {
  const current = await readBinding(root, record.relativePath, label);
  invariant(
    current.bytes.equals(record.bytes) &&
      sameIdentity(current.identity, record.identity),
    `${label}: changed after derivation`,
  );
  return current;
}

async function assertDerivationInputsCurrent(root, state, phase) {
  for (const [label, record] of [
    ["generator", state.generator],
    ["lesson release catalog", state.releaseRecord],
    ["G5 L4 source scope", state.scopeRecord],
    ["keyframe template", state.templateRecord],
  ]) {
    await assertRecordCurrent(root, record, `${phase}: ${label}`);
  }
  for (const record of state.memberRecords) {
    for (const [label, input] of [
      ["migration", record.migrationRecord],
      ["coverage", record.coverageRecord],
      ["scenario inventory", record.scenarioRecord],
      ["historical M1 receipt", record.m1ReceiptRecord],
    ]) {
      await assertRecordCurrent(
        root,
        input,
        `${phase}: ${record.member.animationId}: ${label}`,
      );
    }
  }
}

async function replaceWithBytes(
  root,
  targetPath,
  bytes,
  transactionId,
  expectedRecord = null,
) {
  const temporaryPath = await writeExactTemporary(
    targetPath,
    bytes,
    transactionId,
  );
  try {
    if (expectedRecord) {
      await assertRecordCurrent(
        root,
        expectedRecord,
        `${expectedRecord.relativePath}: compare-and-swap precondition`,
      );
    }
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function verifyManagedOutput(root, relativePath, expectedBytes, label) {
  const record = await readBinding(root, relativePath, label);
  invariant(
    record.bytes.equals(expectedBytes),
    `${label}: output bytes drifted`,
  );
  return record;
}

async function acquireLock(root, transactionId) {
  const absolutePath = resolveProjectPath(root, LOCK_PATH, "transaction lock");
  let handle;
  try {
    handle = await open(absolutePath, "wx", 0o600);
    await handle.writeFile(`${transactionId}\npid=${process.pid}\n`);
    await handle.sync();
    await handle.close();
  } catch (error) {
    await handle?.close().catch(() => {});
    if (error?.code === "EEXIST") {
      throw new Error(`${LOCK_PATH}: another materialization is active`);
    }
    throw error;
  }
  return absolutePath;
}

async function applyState(root, state) {
  const lockPath = await acquireLock(root, state.transactionId);
  const priorStates = [];
  let receiptInstalled = false;
  try {
    await assertDerivationInputsCurrent(root, state, "apply preflight");
    const existingReceipt = await readOptionalBinding(
      root,
      RECEIPT_PATH,
      "successor receipt",
    );
    if (existingReceipt) {
      invariant(
        existingReceipt.bytes.equals(state.receiptBytes),
        "successor receipt collision or stale generator/input binding",
      );
      for (const record of state.memberRecords) {
        invariant(
          record.keyframeRecord.bytes.equals(record.derived.csvBytes),
          `${record.member.animationId}: receipt exists but keyframes drifted`,
        );
      }
      return {changed: false};
    }

    for (const record of state.memberRecords) {
      priorStates.push({
        record,
        bytes: record.keyframeRecord.bytes,
      });
      if (record.keyframeRecord.bytes.equals(record.derived.csvBytes)) continue;
      invariant(
        record.keyframeRecord.binding.sha256 === record.preimageBinding.sha256,
        `${record.member.animationId}: refuses to overwrite foreign keyframes`,
      );
      await replaceWithBytes(
        root,
        record.keyframeRecord.absolutePath,
        record.derived.csvBytes,
        state.transactionId,
        record.keyframeRecord,
      );
    }
    for (const record of state.memberRecords) {
      await verifyManagedOutput(
        root,
        record.paths.keyframes,
        record.derived.csvBytes,
        `${record.member.animationId}: staged successor`,
      );
    }
    await assertDerivationInputsCurrent(
      root,
      state,
      "pre-receipt input verification",
    );
    const receiptAbsolutePath = resolveProjectPath(
      root,
      RECEIPT_PATH,
      "successor receipt",
    );
    const receiptTemporaryPath = await writeExactTemporary(
      receiptAbsolutePath,
      state.receiptBytes,
      state.transactionId,
    );
    try {
      const collision = await readOptionalBinding(
        root,
        RECEIPT_PATH,
        "successor receipt collision check",
      );
      invariant(!collision, "successor receipt appeared concurrently");
      try {
        await link(receiptTemporaryPath, receiptAbsolutePath);
      } catch (error) {
        if (error?.code === "EEXIST") {
          throw new Error("successor receipt appeared concurrently");
        }
        throw error;
      }
      receiptInstalled = true;
      await unlink(receiptTemporaryPath);
    } catch (error) {
      await unlink(receiptTemporaryPath).catch(() => {});
      throw error;
    }
    return {changed: true};
  } catch (error) {
    if (receiptInstalled) {
      await unlink(resolveProjectPath(root, RECEIPT_PATH, "receipt rollback"))
        .catch(() => {});
    }
    for (const prior of [...priorStates].reverse()) {
      const current = await readOptionalBinding(
        root,
        prior.record.paths.keyframes,
        `${prior.record.member.animationId}: rollback check`,
      );
      if (current?.bytes.equals(prior.record.derived.csvBytes)) {
        await replaceWithBytes(
          root,
          current.absolutePath,
          prior.bytes,
          state.transactionId,
          current,
        );
      }
    }
    throw error;
  } finally {
    await unlink(lockPath).catch(() => {});
  }
}

async function checkState(root, state) {
  for (const record of state.memberRecords) {
    await verifyManagedOutput(
      root,
      record.paths.keyframes,
      record.derived.csvBytes,
      `${record.member.animationId}: keyframe successor`,
    );
  }
  await verifyManagedOutput(
    root,
    RECEIPT_PATH,
    state.receiptBytes,
    "successor receipt",
  );
  return {changed: false};
}

export async function materializeG5L4SourceDerivedKeyframeCandidates({
  root = defaultProjectRoot,
  mode = "dry-run",
} = {}) {
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    `unsupported mode ${mode}`,
  );
  const resolvedRoot = path.resolve(root);
  const state = await collectState(resolvedRoot);
  let outcome = {changed: false};
  if (mode === "apply") outcome = await applyState(resolvedRoot, state);
  if (mode === "check") outcome = await checkState(resolvedRoot, state);
  return {
    mode,
    changed: outcome.changed,
    releaseId: RELEASE_ID,
    memberCount: state.memberRecords.length,
    rowCount: state.receipt.summary.rowCount,
    requirementCount: state.receipt.summary.requirementCount,
    mappedControlStateCount:
      state.receipt.summary.mappedControlStateCount,
    unmappedControlStateCount:
      state.receipt.summary.unmappedControlStateCount,
    mappedHandlerCount: state.receipt.summary.mappedHandlerCount,
    unmappedHandlerCount: state.receipt.summary.unmappedHandlerCount,
    authoritativeBaselineKeyframeCount: 0,
    observedRuntimeRowCount: 0,
    receipt: state.receiptBinding,
    acceptanceEffects: state.receipt.acceptanceEffects,
  };
}

export function parseArguments(argv) {
  let mode = "dry-run";
  let selected = false;
  for (const argument of argv) {
    const next = argument === "--dry-run"
      ? "dry-run"
      : argument === "--apply"
        ? "apply"
        : argument === "--check"
          ? "check"
          : null;
    invariant(next, `unknown option ${argument}`);
    invariant(!selected, "choose exactly one of --dry-run, --apply, or --check");
    mode = next;
    selected = true;
  }
  return {mode};
}

function usage() {
  return [
    "Usage: node scripts/materialize-g5-l4-source-derived-keyframe-candidates.mjs [--dry-run|--apply|--check]",
    "",
    "Default: --dry-run",
    "Writes only the 55 G5 L4 keyframes.csv files plus one acceptance-neutral successor receipt.",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const {mode} = parseArguments(process.argv.slice(2));
    const result = await materializeG5L4SourceDerivedKeyframeCandidates({mode});
    process.stdout.write(`${stableJson(result)}`);
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 1;
  }
}
