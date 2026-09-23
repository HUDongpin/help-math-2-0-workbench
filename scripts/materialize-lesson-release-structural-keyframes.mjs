#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_RELEASES_PATH = "catalog/lesson-releases.json";
const DEFAULT_TEMPLATE_PATH = "templates/flash-migration/keyframes.csv";
const RELEASE_INDEX_DIRECTORY = "migrations/lesson-release-trace-spec-indexes";
const PRESERVED_SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const LOCK_BASENAME = ".lesson-release-structural-keyframes.lock";
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;

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

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort(compareText).map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertSha256(value, label) {
  invariant(SHA256.test(value || ""), `${label} must be a lowercase SHA-256`);
}

function assertSafeId(value, label) {
  invariant(SAFE_ID.test(value || ""), `${label} is not a safe catalog ID`);
}

function assertSafeSourcePath(value, label) {
  invariant(
    typeof value === "string" &&
      value.endsWith(".swf") &&
      !path.posix.isAbsolute(value) &&
      !value.includes("\\") &&
      !value.includes("\0") &&
      !value.split("/").includes("..") &&
      path.posix.normalize(value) === value,
    `${label} is not a safe catalog SWF path`,
  );
}

function resolveRelative(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0") &&
      !relativePath.split("/").includes("..") &&
      path.posix.normalize(relativePath) === relativePath,
    `${label} must be a normalized project-relative POSIX path`,
  );
  const resolved = path.resolve(root, ...relativePath.split("/"));
  invariant(contained(root, resolved), `${label} escapes the project root`);
  invariant(
    portable(path.relative(root, resolved)) === relativePath,
    `${label} is not canonical for the project root`,
  );
  return resolved;
}

async function assertDirectory(rootReal, candidate, label) {
  const info = await lstat(candidate);
  invariant(info.isDirectory() && !info.isSymbolicLink(),
    `${label} must be a real directory, not a symlink`);
  invariant(contained(rootReal, await realpath(candidate)),
    `${label} resolves outside the project root`);
}

function identityOf(info) {
  return {
    dev: info.dev,
    ino: info.ino,
    mode: info.mode,
    nlink: info.nlink,
    size: info.size,
    mtimeMs: info.mtimeMs,
  };
}

function sameIdentity(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs;
}

async function readBinding({root, rootReal, relativePath, label}) {
  const absolutePath = resolveRelative(root, relativePath, label);
  const before = await lstat(absolutePath);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label} must be an ordinary single-link file`,
  );
  invariant(contained(rootReal, await realpath(absolutePath)),
    `${label} resolves outside the project root`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  invariant(sameIdentity(identityOf(before), identityOf(after)),
    `${label} changed while it was read`);
  return {
    absolutePath,
    relativePath,
    bytes,
    sha256: sha256(bytes),
    identity: identityOf(after),
  };
}

async function verifyIdentity(binding, label) {
  const current = await lstat(binding.absolutePath);
  invariant(
    current.isFile() && !current.isSymbolicLink() && current.nlink === 1 &&
      sameIdentity(binding.identity, identityOf(current)),
    `${label} changed after preflight`,
  );
}

function parseJson(binding, label) {
  try {
    return JSON.parse(binding.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/u.test(text)
    ? `"${text.replaceAll("\"", "\"\"")}"`
    : text;
}

function renderCsv(rows) {
  return `${[KEYFRAME_HEADERS, ...rows.map((row) =>
    KEYFRAME_HEADERS.map((header) => row[header] ?? ""))]
    .map((record) => record.map(csvCell).join(","))
    .join("\n")}\n`;
}

function parseCsvRecords(value) {
  const text = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
  invariant(text.endsWith("\n"), "Structural keyframe CSV must end with a newline");
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      invariant(field.length === 0,
        "Structural keyframe CSV quote must start an empty field");
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (character === "\r") {
      invariant(text[index + 1] === "\n",
        "Structural keyframe CSV contains a bare carriage return");
    } else {
      field += character;
    }
  }
  invariant(!quoted && record.length === 0 && field.length === 0,
    "Structural keyframe CSV ended in an incomplete record");
  return records;
}

export function isPristineGeneratedStructuralRefresh(current, rendered) {
  let currentRecords;
  let renderedRecords;
  try {
    currentRecords = parseCsvRecords(current);
    renderedRecords = parseCsvRecords(rendered);
  } catch {
    return false;
  }
  if (currentRecords.length <= 1 ||
      currentRecords.length !== renderedRecords.length ||
      !sameJson(currentRecords[0], KEYFRAME_HEADERS) ||
      !sameJson(renderedRecords[0], KEYFRAME_HEADERS)) return false;
  const evidenceIndex = KEYFRAME_HEADERS.indexOf("evidence_source");
  const protectedBlankIndexes = [
    "baseline_file",
    "baseline_sha256",
    "implementation_file",
    "implementation_sha256",
    "diff_file",
    "diff_sha256",
    "normalized_rmse",
    "timing_result",
    "visual_result",
    "reviewer",
  ].map((header) => KEYFRAME_HEADERS.indexOf(header));
  let evidenceChanged = false;
  for (let rowIndex = 1; rowIndex < currentRecords.length; rowIndex += 1) {
    const currentRow = currentRecords[rowIndex];
    const renderedRow = renderedRecords[rowIndex];
    if (currentRow.length !== KEYFRAME_HEADERS.length ||
        renderedRow.length !== KEYFRAME_HEADERS.length ||
        protectedBlankIndexes.some((index) => currentRow[index] !== "")) {
      return false;
    }
    for (let column = 0; column < KEYFRAME_HEADERS.length; column += 1) {
      if (column === evidenceIndex) continue;
      if (currentRow[column] !== renderedRow[column]) return false;
    }
    const bindings = currentRow[evidenceIndex].split("; ");
    if (bindings.length !== 6 || bindings.some((binding) =>
      !/^[^;\r\n]+@sha256:[a-f0-9]{64}$/u.test(binding))) return false;
    if (currentRow[evidenceIndex] !== renderedRow[evidenceIndex]) {
      evidenceChanged = true;
    }
  }
  return evidenceChanged;
}

function expectedHeaderBytes() {
  return Buffer.from(`${KEYFRAME_HEADERS.join(",")}\n`, "utf8");
}

function safeRequirementId(requirementId) {
  const safe = String(requirementId || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-+/gu, "-");
  invariant(safe && safe !== "." && safe !== ".." && !safe.includes("/"),
    `requirementId cannot produce a safe filename: ${JSON.stringify(requirementId)}`);
  return safe;
}

function sourceMemberIdentity(member) {
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  };
}

function traceMemberIdentity(member) {
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  };
}

function indexedTraceMemberIdentity(member) {
  const identity = traceMemberIdentity(member);
  delete identity.animationId;
  return identity;
}

export function selectLessonRelease(catalog, {releaseId, ids = []} = {}) {
  invariant(catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "Lesson-release catalog must be schemaVersion 1 with releases");
  assertSafeId(releaseId, "Requested release ID");
  invariant(Array.isArray(ids), "Requested member IDs must be an array");
  invariant(new Set(ids).size === ids.length,
    "Requested member IDs must not repeat");
  for (const id of ids) assertSafeId(id, "Requested animation ID");

  const matches = catalog.releases.filter((item) => item?.releaseId === releaseId);
  invariant(matches.length === 1,
    matches.length ? `Lesson release ID is duplicated: ${releaseId}` :
      `Unknown lesson release: ${releaseId}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic",
    `${releaseId}: publicationMode must remain atomic`);
  invariant(
    Number.isSafeInteger(release.expectedCounts?.members) &&
      release.expectedCounts.members > 0 &&
      Array.isArray(release.members) &&
      release.members.length === release.expectedCounts.members,
    `${releaseId}: release membership is incomplete`,
  );
  invariant(
    Number.isSafeInteger(release.expectedCounts?.shards) &&
      release.expectedCounts.shards > 0 &&
      Array.isArray(release.shards) &&
      release.shards.length === release.expectedCounts.shards,
    `${releaseId}: shard definition is incomplete`,
  );
  const shardIds = new Set();
  for (const [index, shard] of release.shards.entries()) {
    assertSafeId(shard?.shardId, `${releaseId}: shard ID`);
    invariant(shard.ordinal === index + 1,
      `${releaseId}: shard ordinals must be contiguous`);
    invariant(!shardIds.has(shard.shardId),
      `${releaseId}: duplicate shard ${shard.shardId}`);
    invariant(Number.isSafeInteger(shard.memberCount) && shard.memberCount > 0,
      `${releaseId}/${shard.shardId}: invalid memberCount`);
    shardIds.add(shard.shardId);
  }
  const animationIds = new Set();
  const assetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member?.ordinal === index + 1,
      `${releaseId}: member ordinals must be contiguous`);
    assertSafeId(member.animationId, `${releaseId}: animation ID`);
    invariant(!animationIds.has(member.animationId),
      `${releaseId}: duplicate animation ID ${member.animationId}`);
    animationIds.add(member.animationId);
    assertSha256(member.source?.sha256,
      `${member.animationId}: release source SHA-256`);
    assertSafeSourcePath(member.source?.path,
      `${member.animationId}: release source path`);
    invariant(member.assetId === `swf-${member.source.sha256}`,
      `${member.animationId}: assetId does not match source SHA-256`);
    invariant(!assetIds.has(member.assetId),
      `${releaseId}: duplicate assetId ${member.assetId}`);
    assetIds.add(member.assetId);
    assertSafeId(member.shardId, `${member.animationId}: shard ID`);
    invariant(shardIds.has(member.shardId),
      `${member.animationId}: unknown shard ${member.shardId}`);
    invariant(typeof member.releaseRole === "string" && member.releaseRole,
      `${member.animationId}: releaseRole is missing`);
  }
  for (const shard of release.shards) {
    const actual = release.members.filter((member) =>
      member.shardId === shard.shardId).length;
    invariant(actual === shard.memberCount,
      `${releaseId}/${shard.shardId}: memberCount differs from membership`);
  }

  const requested = ids.length ? new Set(ids) : null;
  if (requested) {
    const missing = ids.filter((id) => !animationIds.has(id));
    invariant(!missing.length,
      `Explicit ID(s) are not verified release members: ${missing.join(", ")}`);
  }
  const members = requested
    ? release.members.filter((member) => requested.has(member.animationId))
    : [...release.members];
  const selectionIdentity = {
    releaseId,
    scope: requested ? "verified-subset" : "complete-atomic-release",
    orderedMembers: members.map(sourceMemberIdentity),
  };
  const selectionSha256 = sha256(canonicalJson(selectionIdentity));
  return {release, members, selectionIdentity, selectionSha256};
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function validateIndex({
  index,
  indexBinding,
  catalogBinding,
  catalogRelativePath,
  selection,
}) {
  const {release, members, selectionIdentity, selectionSha256} = selection;
  const releaseFingerprintSha256 = sha256(canonicalJson(release));
  const orderedMemberIdentitySha256 = sha256(canonicalJson(
    release.members.map(sourceMemberIdentity),
  ));
  invariant(
    index?.schemaVersion === 1 &&
      index.artifactType === "lesson-release-original-runtime-trace-spec-index" &&
      String(index.strictAcceptanceEffect || "").startsWith("none;") &&
      Array.isArray(index.members),
    "Trace-spec index identity or acceptance boundary is invalid",
  );
  const expectedCatalog = {
    path: catalogRelativePath,
    bytes: catalogBinding.bytes.length,
    sha256: catalogBinding.sha256,
    schemaVersion: 1,
    releaseId: release.releaseId,
    releaseFingerprintSha256,
    orderedMemberIdentitySha256,
  };
  invariant(sameJson(index.releaseCatalog, expectedCatalog),
    "Trace-spec index release-catalog binding is stale");
  invariant(
    index.releaseSelection?.releaseId === selectionIdentity.releaseId &&
      index.releaseSelection.scope === selectionIdentity.scope &&
      sameJson(index.releaseSelection.orderedMembers,
        selectionIdentity.orderedMembers) &&
      index.releaseSelection.selectionSha256 === selectionSha256 &&
      index.releaseSelection.atomicReleaseMemberCount ===
        release.expectedCounts.members &&
      index.releaseSelection.selectedMemberCount === members.length &&
      index.releaseSelection.fullAtomicReleaseSelected ===
        (selectionIdentity.scope === "complete-atomic-release"),
    "Trace-spec index release selection is stale",
  );
  invariant(index.memberCount === members.length &&
    index.members.length === members.length,
  "Trace-spec index member count differs from the verified selection");
  let requirementCount = 0;
  for (const [position, member] of members.entries()) {
    const indexed = index.members[position];
    invariant(indexed?.animationId === member.animationId &&
      sameJson(indexed.releaseMembership, indexedTraceMemberIdentity(member)) &&
      indexed.sourceSwfSha256 === member.source.sha256 &&
      Array.isArray(indexed.traceSpecs) &&
      indexed.requirementCount === indexed.traceSpecs.length,
    `${member.animationId}: trace-spec index member binding is stale`);
    requirementCount += indexed.requirementCount;
  }
  invariant(index.requirementCount === requirementCount,
    "Trace-spec index requirementCount is stale");
  return {
    indexSha256: indexBinding.sha256,
    releaseFingerprintSha256,
    orderedMemberIdentitySha256,
  };
}

function validateMigration({migration, member}) {
  const expectedSource = `${PRESERVED_SOURCE_PREFIX}${member.source.path}`;
  invariant(
    migration?.schemaVersion === 2 &&
      migration.animationId === member.animationId &&
      migration.id === member.animationId &&
      migration.assetId === member.assetId &&
      migration.status === "preserved" &&
      migration.source?.swf === expectedSource &&
      migration.source?.placementPath === expectedSource &&
      migration.source.swfSha256 === member.source.sha256 &&
      migration.baseline?.authority === "undecided" &&
      migration.acceptance?.humanVisualReview?.decision === "pending" &&
      migration.acceptance?.ownerReview?.decision === "pending",
    `${member.animationId}: migration identity or acceptance boundary drifted`,
  );
  invariant(
    Number.isFinite(migration.runtime?.stage?.width) &&
      migration.runtime.stage.width > 0 &&
      Number.isFinite(migration.runtime.stage.height) &&
      migration.runtime.stage.height > 0 &&
      Number.isFinite(migration.runtime.fps) && migration.runtime.fps > 0 &&
      Number.isSafeInteger(migration.runtime.frameCount) &&
      migration.runtime.frameCount > 0,
    `${member.animationId}: runtime metadata is invalid`,
  );
  const roots = (migration.implementation?.frameDomains || []).filter(
    (domain) => domain?.id === "root",
  );
  invariant(roots.length === 1,
    `${member.animationId}: exactly one declared root frame domain is required`);
  const root = roots[0];
  invariant(
    root.kind === "root" &&
      root.sourceTimelineId === "root" &&
      root.parentFrameDomainId === null &&
      root.frameCount === migration.runtime.frameCount,
    `${member.animationId}: declared root frame domain is inconsistent`,
  );
  invariant(
    Array.isArray(migration.localization?.languages) &&
      migration.localization.languages.includes("en") &&
      migration.localization.languages.includes("es") &&
      Array.isArray(migration.scenarios),
    `${member.animationId}: EN/ES localization or scenario declarations are missing`,
  );
  return root;
}

function validateCoverage({coverage, migration, member, root}) {
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements),
    `${member.animationId}: coverage-v2 identity is invalid`,
  );
  const requirements = coverage.requirements.filter((item) =>
    item?.frameDomainId === "root");
  invariant(requirements.length === 2,
    `${member.animationId}: exactly two root EN/ES requirements are required`);
  const byLanguage = new Map();
  for (const requirement of requirements) {
    invariant(["en", "es"].includes(requirement.language) &&
      !byLanguage.has(requirement.language),
    `${member.animationId}: root requirement languages must be exactly EN and ES`);
    assertSafeId(requirement.requirementId,
      `${member.animationId}: requirement ID`);
    invariant(typeof requirement.traceId === "string" &&
      requirement.traceId.length > 0,
    `${member.animationId}/${requirement.requirementId}: traceId is missing`);
    assertSha256(requirement.entryStateSha256,
      `${member.animationId}/${requirement.requirementId}: entry state`);
    invariant(
      requirement.scenario &&
        migration.scenarios.some(({id}) => id === requirement.scenario) &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange.lastFrame === root.frameCount &&
        requirement.baselineAuthority === "unresolved" &&
        ["blocked", "pending"].includes(requirement.status) &&
        requirement.capturedFrameCount === 0 &&
        !requirement.baselineCaptureManifest &&
        !requirement.captureManifest &&
        !requirement.metricsFile &&
        requirement.strictAcceptanceEffect === "none",
      `${member.animationId}/${requirement.requirementId}: coverage crossed the structural-only boundary`,
    );
    byLanguage.set(requirement.language, requirement);
  }
  invariant(byLanguage.has("en") && byLanguage.has("es"),
    `${member.animationId}: both root EN and ES requirements are required`);
  return [byLanguage.get("en"), byLanguage.get("es")];
}

function validateScenario({scenario, migration, member, root}) {
  invariant(
    scenario?.schemaVersion === 1 &&
      scenario.animationId === member.animationId &&
      scenario.source?.swf === migration.source.swf &&
      scenario.source.swfSha256 === member.source.sha256 &&
      sameJson(scenario.source.stage, migration.runtime.stage) &&
      scenario.source.fps === migration.runtime.fps &&
      scenario.source.rootFrameCount === root.frameCount &&
      scenario.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      scenario.migrationStatusChanged === false &&
      Array.isArray(scenario.authoritativeRuntimeEvidence) &&
      scenario.authoritativeRuntimeEvidence.length === 0 &&
      String(scenario.strictAcceptanceEffect || "").startsWith("none;"),
    `${member.animationId}: scenario inventory crossed the static-only boundary`,
  );
  const roots = (scenario.timelineInventory || []).filter((timeline) =>
    timeline?.timelineId === "root");
  invariant(roots.length === 1 && roots[0].frameCount === root.frameCount &&
    roots[0].structuralReachability === "root" &&
    Array.isArray(roots[0].controlStates) &&
    Array.isArray(roots[0].frameLabels) &&
    Array.isArray(roots[0].namedPlacements),
  `${member.animationId}: root static timeline inventory is invalid`);
  return roots[0];
}

function validateDisposition({disposition, scenarioBinding, migration, member}) {
  invariant(
    disposition?.schemaVersion === 1 &&
      disposition.animationId === member.animationId &&
      disposition.migrationStatusChanged === false &&
      disposition.generatedFrom?.scenarioInventory?.path ===
        "audit/scenario-inventory.json" &&
      disposition.generatedFrom.scenarioInventory.sha256 ===
        scenarioBinding.sha256 &&
      disposition.generatedFrom?.sourceSwf?.path === migration.source.swf &&
      disposition.generatedFrom.sourceSwf.sha256 === member.source.sha256 &&
      Array.isArray(disposition.timelines),
    `${member.animationId}: frame-domain disposition is stale`,
  );
  const rootRows = disposition.timelines.filter((timeline) =>
    timeline?.sourceTimelineId === "root" &&
    timeline.disposition === "declared-frame-domain" &&
    timeline.declaredFrameDomains?.some((domain) =>
      domain.frameDomainId === "root" &&
      domain.sourceTimelineId === "root" &&
      domain.frameCount === migration.runtime.frameCount));
  invariant(rootRows.length === 1,
    `${member.animationId}: disposition does not bind the root domain exactly once`);
}

async function validateStructuralBaseline({
  root,
  rootReal,
  baseline,
  baselineBinding,
  migration,
  member,
  inputBindings,
}) {
  const raster = {
    width: Math.ceil(migration.runtime.stage.width),
    height: Math.ceil(migration.runtime.stage.height),
  };
  invariant(
    baseline?.schemaVersion === 1 &&
      baseline.animationId === member.animationId &&
      baseline.status === "structural-baseline-only" &&
      baseline.authority?.kind === "swf-static-root-timeline-render" &&
      Array.isArray(baseline.authority.limitations) &&
      baseline.authority.limitations.length > 0 &&
      baseline.source?.swf === migration.source.swf &&
      baseline.source.swfSha256 === member.source.sha256 &&
      sameJson(baseline.runtime?.stage, migration.runtime.stage) &&
      baseline.runtime.fps === migration.runtime.fps &&
      baseline.runtime.frameCount === migration.runtime.frameCount &&
      baseline.runtime.rasterization?.rule ===
        "ceil-positive-native-stage-dimensions" &&
      baseline.runtime.rasterization.width === raster.width &&
      baseline.runtime.rasterization.height === raster.height &&
      baseline.archive?.ignoredByGit === true &&
      Array.isArray(baseline.frames) &&
      baseline.frames.length === migration.runtime.frameCount,
    `${member.animationId}: structural baseline report is invalid or overclaims authority`,
  );
  const archiveRelative = baseline.archive.root;
  const archiveAbsolute = resolveRelative(root, archiveRelative,
    `${member.animationId}: structural archive root`);
  await assertDirectory(rootReal, archiveAbsolute,
    `${member.animationId}: structural archive root`);
  const frames = [];
  for (let frame = 1; frame <= migration.runtime.frameCount; frame += 1) {
    const item = baseline.frames[frame - 1];
    invariant(item?.frame === frame && item.file === `${frame}.png` &&
      SHA256.test(item.sha256 || "") &&
      Number.isSafeInteger(item.bytes) && item.bytes > 0 &&
      item.width === raster.width && item.height === raster.height,
    `${member.animationId}: structural baseline frame ${frame} metadata is invalid`);
    const pngRelative = `${archiveRelative}/${item.file}`;
    const png = await readBinding({
      root,
      rootReal,
      relativePath: pngRelative,
      label: `${member.animationId}: structural frame ${frame}`,
    });
    invariant(png.sha256 === item.sha256 && png.bytes.length === item.bytes,
      `${member.animationId}: structural frame ${frame} bytes differ from report`);
    inputBindings.push(png);
    frames.push(item);
  }
  invariant(baselineBinding.sha256 === sha256(baselineBinding.bytes),
    `${member.animationId}: structural report hash could not be bound`);
  return frames;
}

function validateTraceSpec({
  spec,
  specBinding,
  indexedSpec,
  requirement,
  migration,
  member,
  release,
  indexBinding,
  scenarioBinding,
  dispositionBinding,
  technicalSha,
  coverageSha,
  scenarioTechnicalSha,
  releaseFingerprintSha256,
}) {
  invariant(indexedSpec.file === specBinding.relativePath &&
    indexedSpec.sha256 === specBinding.sha256,
  `${member.animationId}/${requirement.requirementId}: indexed trace-spec bytes are stale`);
  invariant(
    indexedSpec.requirementId === requirement.requirementId &&
      indexedSpec.traceId === requirement.traceId &&
      indexedSpec.frameDomainId === requirement.frameDomainId &&
      indexedSpec.scenario === requirement.scenario &&
      indexedSpec.language === requirement.language &&
      indexedSpec.seed === requirement.seed,
    `${member.animationId}/${requirement.requirementId}: indexed trace identity is stale`,
  );
  invariant(
    spec?.schemaVersion === 1 &&
      spec.artifactType === "course-pilot-original-runtime-trace-specification" &&
      spec.animationId === member.animationId &&
      spec.requirementId === requirement.requirementId &&
      spec.identity?.frameDomainId === requirement.frameDomainId &&
      spec.identity.traceId === requirement.traceId &&
      spec.identity.entryStateSha256 === requirement.entryStateSha256 &&
      spec.identity.scenario === requirement.scenario &&
      spec.identity.language === requirement.language &&
      spec.identity.seed === requirement.seed &&
      sameJson(spec.identity.requiredRange, requirement.requiredRange) &&
      spec.identity.baselineAuthorityRequirement ===
        requirement.baselineAuthorityRequirement &&
      sameJson(spec.entryState, requirement.entryState) &&
      spec.frameDomain?.id === "root" &&
      spec.frameDomain.kind === "root" &&
      spec.frameDomain.sourceTimelineId === "root" &&
      spec.frameDomain.frameCount === migration.runtime.frameCount &&
      sameJson(spec.frameDomain.nativeStage, migration.runtime.stage) &&
      spec.frameDomain.fps === migration.runtime.fps &&
      spec.executionEvidence?.status === "not-executed-by-this-generator" &&
      spec.executionEvidence.executionReport === null &&
      spec.executionEvidence.originalRuntimeCaptureManifest === null &&
      Array.isArray(spec.executionEvidence.executedSteps) &&
      spec.executionEvidence.executedSteps.length === 0 &&
      String(spec.strictAcceptanceEffect || "").startsWith("none;"),
    `${member.animationId}/${requirement.requirementId}: trace specification crossed the planning-only boundary`,
  );
  invariant(
    spec.sourceBindings?.sourceSwf?.path === migration.source.swf &&
      spec.sourceBindings.sourceSwf.sha256 === member.source.sha256 &&
      spec.sourceBindings.migrationManifest?.sha256 === technicalSha &&
      spec.sourceBindings.fullFrameCoverage?.sha256 === coverageSha &&
      spec.sourceBindings.scenarioInventory?.sha256 === scenarioTechnicalSha &&
      spec.sourceBindings.scenarioInventoryExactFile?.sha256 ===
        scenarioBinding.sha256 &&
      spec.sourceBindings.frameDomainDisposition?.sha256 ===
        dispositionBinding.sha256 &&
      spec.sourceBindings.lessonReleaseCatalog?.sha256 ===
        indexBinding.catalogSha256 &&
      spec.sourceBindings.lessonReleaseCatalog.releaseFingerprintSha256 ===
        releaseFingerprintSha256,
    `${member.animationId}/${requirement.requirementId}: trace source bindings are stale`,
  );
  invariant(
    spec.lessonReleaseMembership?.releaseId === release.releaseId &&
      spec.lessonReleaseMembership.publicationMode === "atomic" &&
      spec.lessonReleaseMembership.expectedAtomicMemberCount ===
        release.expectedCounts.members &&
      spec.lessonReleaseMembership.releaseFingerprintSha256 ===
        releaseFingerprintSha256 &&
      sameJson(spec.lessonReleaseMembership.member,
        traceMemberIdentity(member)) &&
      spec.lessonReleaseMembership.memberIdentitySha256 ===
        sha256(canonicalJson(traceMemberIdentity(member))) &&
      spec.lessonReleaseMembership.publicationAuthorized === false,
    `${member.animationId}/${requirement.requirementId}: trace release membership is stale`,
  );
}

function formatTimeMs(frame, fps) {
  return (((frame - 1) * 1000) / fps)
    .toFixed(6)
    .replace(/\.?(?:0+)$/u, "");
}

function structuralKind({frame, frameCount, reasons}) {
  if (frame === 1) return "structural-specification-initial";
  if (frame === frameCount) return "structural-specification-terminal";
  if (reasons.has("static-root-render-hash-transition") ||
    [...reasons].some((reason) => reason.startsWith("frame-label:") ||
      reason === "root-named-placement")) {
    return "structural-specification-transition";
  }
  return "structural-specification-control-state";
}

export function buildStructuralRows({
  migration,
  requirements,
  rootTimeline,
  baselineFrames,
  evidence,
}) {
  const frameCount = migration.runtime.frameCount;
  const selected = new Map();
  const add = (frame, reason) => {
    invariant(Number.isSafeInteger(frame) && frame >= 1 && frame <= frameCount,
      `${migration.animationId}: structural frame ${frame} is outside root domain`);
    if (!selected.has(frame)) selected.set(frame, new Set());
    selected.get(frame).add(reason);
  };
  add(1, "initial-one-indexed-frame");
  add(frameCount, "terminal-structural-frame");
  for (const state of rootTimeline.controlStates) {
    const frame = Number(state.frame);
    invariant(Array.isArray(state.reasons) && state.reasons.length > 0,
      `${migration.animationId}: root control state ${frame} lacks reasons`);
    for (const reason of state.reasons) add(frame, String(reason));
  }
  for (const label of rootTimeline.frameLabels) {
    add(Number(label.frame), `frame-label:${String(label.label || "")}`);
  }
  for (const placement of rootTimeline.namedPlacements) {
    add(Number(placement.frame), "root-named-placement");
  }
  for (let index = 1; index < baselineFrames.length; index += 1) {
    if (baselineFrames[index].sha256 !== baselineFrames[index - 1].sha256) {
      add(index + 1, "static-root-render-hash-transition");
    }
  }
  const frames = [...selected.keys()].sort((left, right) => left - right);
  const rows = [];
  for (const frame of frames) {
    const reasons = selected.get(frame);
    const kind = structuralKind({frame, frameCount, reasons});
    const expectedState = [
      "source-root-structural-specification-only",
      `nativeStage=${migration.runtime.stage.width}x${migration.runtime.stage.height}`,
      `rootFrame=${frame}/${frameCount}`,
      `structuralReasons=${[...reasons].sort(compareText).join("|")}`,
      "runtimeReachability=unresolved",
    ].join("; ");
    for (const requirement of requirements) {
      rows.push({
        frame: String(frame),
        requirement_id: requirement.requirementId,
        frame_domain_id: "root",
        trace_id: requirement.traceId,
        entry_state_sha256: requirement.entryStateSha256,
        time_ms: formatTimeMs(frame, migration.runtime.fps),
        scenario: requirement.scenario,
        language: requirement.language,
        kind,
        expected_state: expectedState,
        trigger:
          "source-static-root-frame-selection-only; no runtime trigger or causality claimed; strictAcceptanceEffect=none",
        baseline_file: "",
        baseline_sha256: "",
        implementation_file: "",
        implementation_sha256: "",
        diff_file: "",
        diff_sha256: "",
        normalized_rmse: "",
        timing_result: "",
        visual_result: "",
        evidence_source: [
          `audit/scenario-inventory.json@sha256:${evidence.scenarioSha256}`,
          `baseline/ffdec-root-frames.json@sha256:${evidence.baselineSha256}`,
          `evidence/full-frame-coverage.json@sha256:${evidence.coverageSha256}`,
          `${evidence.traceSpecByRequirement.get(requirement.requirementId).path}@sha256:${evidence.traceSpecByRequirement.get(requirement.requirementId).sha256}`,
          `${evidence.traceIndexPath}@sha256:${evidence.traceIndexSha256}`,
          `audit/frame-domain-disposition.json@sha256:${evidence.dispositionSha256}`,
        ].join("; "),
        reviewer: "",
        notes:
          "Source-evidenced root structural specification only. Runtime reachability and natural playback remain unresolved. EN and ES rows bind separate exact coverage identities; no language visual difference or bilingual acceptance is asserted. Audio cue content, timing, host synchronization, and Replay behavior remain unresolved. Nested keyframes are not invented. Baseline, implementation, diff, RMSE, timing, visual-result, and reviewer fields are intentionally blank. Fidelity, human review, owner acceptance, strict completion, and publication remain unresolved. strictAcceptanceEffect=none.",
      });
    }
  }
  return {rows, frames};
}

async function prepareMember({
  root,
  rootReal,
  release,
  member,
  indexedMember,
  indexBinding,
  indexRelativePath,
  templateBinding,
  releaseFingerprintSha256,
}) {
  const id = member.animationId;
  const workspaceRelative = `migrations/${id}`;
  const workspace = resolveRelative(root, workspaceRelative, `${id}: workspace`);
  await assertDirectory(rootReal, workspace, `${id}: workspace`);
  const inputBindings = [];
  const readWorkspace = async (suffix, label = suffix) => {
    const binding = await readBinding({
      root,
      rootReal,
      relativePath: `${workspaceRelative}/${suffix}`,
      label: `${id}: ${label}`,
    });
    inputBindings.push(binding);
    return binding;
  };

  const migrationBinding = await readWorkspace("migration.json");
  const coverageBinding = await readWorkspace("evidence/full-frame-coverage.json");
  const scenarioBinding = await readWorkspace("audit/scenario-inventory.json");
  const dispositionBinding = await readWorkspace("audit/frame-domain-disposition.json");
  const baselineBinding = await readWorkspace("baseline/ffdec-root-frames.json");
  const outputBinding = await readWorkspace("keyframes.csv");
  const sourceRelative = `${PRESERVED_SOURCE_PREFIX}${member.source.path}`;
  const sourceBinding = await readBinding({
    root,
    rootReal,
    relativePath: sourceRelative,
    label: `${id}: preserved SWF`,
  });
  inputBindings.push(sourceBinding);
  invariant(sourceBinding.sha256 === member.source.sha256,
    `${id}: physical preserved SWF differs from release SHA-256`);

  const migration = parseJson(migrationBinding, `${id}: migration.json`);
  const coverage = parseJson(coverageBinding, `${id}: full-frame coverage`);
  const scenario = parseJson(scenarioBinding, `${id}: scenario inventory`);
  const disposition = parseJson(dispositionBinding,
    `${id}: frame-domain disposition`);
  const baseline = parseJson(baselineBinding, `${id}: structural baseline`);
  const rootDomain = validateMigration({migration, member});
  const requirements = validateCoverage({coverage, migration, member,
    root: rootDomain});
  const rootTimeline = validateScenario({scenario, migration, member,
    root: rootDomain});
  validateDisposition({disposition, scenarioBinding, migration, member});
  const baselineFrames = await validateStructuralBaseline({
    root,
    rootReal,
    baseline,
    baselineBinding,
    migration,
    member,
    inputBindings,
  });

  const technicalSha = technicalManifestSha256(migration);
  const coverageProjectionSha = traceCoverageSha256(coverage);
  const scenarioTechnicalSha = scenarioInventorySha256(scenario);
  invariant(indexedMember.technicalBindings?.manifest?.sha256 === technicalSha &&
    indexedMember.technicalBindings.coverage?.sha256 === coverageProjectionSha &&
    indexedMember.technicalBindings.scenarioInventory?.sha256 ===
      scenarioTechnicalSha &&
    indexedMember.technicalBindings.scenarioInventoryExactFile?.sha256 ===
      scenarioBinding.sha256 &&
    indexedMember.technicalBindings.frameDomainDisposition?.sha256 ===
      dispositionBinding.sha256,
  `${id}: indexed technical bindings are stale`);

  const traceSpecByRequirement = new Map();
  for (const requirement of requirements) {
    const indexed = indexedMember.traceSpecs.filter((item) =>
      item?.requirementId === requirement.requirementId);
    invariant(indexed.length === 1,
      `${id}/${requirement.requirementId}: trace index must contain exactly one specification`);
    const expectedRelative =
      `${workspaceRelative}/audit/trace-specs/lesson-releases/${release.releaseId}/` +
      `${safeRequirementId(requirement.requirementId)}.json`;
    invariant(indexed[0].file === expectedRelative,
      `${id}/${requirement.requirementId}: trace-spec path is not canonical`);
    const specBinding = await readBinding({
      root,
      rootReal,
      relativePath: expectedRelative,
      label: `${id}/${requirement.requirementId}: trace specification`,
    });
    inputBindings.push(specBinding);
    const spec = parseJson(specBinding,
      `${id}/${requirement.requirementId}: trace specification`);
    validateTraceSpec({
      spec,
      specBinding,
      indexedSpec: indexed[0],
      requirement,
      migration,
      member,
      release,
      indexBinding: {
        ...indexBinding,
        catalogSha256: indexBinding.catalogSha256,
      },
      scenarioBinding,
      dispositionBinding,
      technicalSha,
      coverageSha: coverageProjectionSha,
      scenarioTechnicalSha,
      releaseFingerprintSha256,
    });
    traceSpecByRequirement.set(requirement.requirementId, {
      path: specBinding.relativePath,
      sha256: specBinding.sha256,
    });
  }

  const built = buildStructuralRows({
    migration,
    requirements,
    rootTimeline,
    baselineFrames,
    evidence: {
      scenarioSha256: scenarioBinding.sha256,
      baselineSha256: baselineBinding.sha256,
      coverageSha256: coverageBinding.sha256,
      traceSpecByRequirement,
      traceIndexPath: indexRelativePath,
      traceIndexSha256: indexBinding.sha256,
      dispositionSha256: dispositionBinding.sha256,
    },
  });
  const rendered = Buffer.from(renderCsv(built.rows), "utf8");
  const isCurrent = rendered.equals(outputBinding.bytes);
  const isEmptyCanonical = templateBinding.bytes.equals(outputBinding.bytes);
  const isPristineGeneratedRefresh = !isCurrent && !isEmptyCanonical &&
    isPristineGeneratedStructuralRefresh(outputBinding.bytes, rendered);
  invariant(isCurrent || isEmptyCanonical || isPristineGeneratedRefresh,
    `${id}: refusing to overwrite nonempty or adopted keyframe evidence that is not exactly current generated output`);
  return {
    animationId: id,
    outputBinding,
    inputBindings,
    rendered,
    current: isCurrent,
    pristineGeneratedRefresh: isPristineGeneratedRefresh,
    rowCount: built.rows.length,
    structuralFrames: built.frames,
    stage: migration.runtime.stage,
    fps: migration.runtime.fps,
    frameCount: migration.runtime.frameCount,
    kindCounts: Object.fromEntries([...new Set(built.rows.map(({kind}) => kind))]
      .sort(compareText)
      .map((kind) => [kind, built.rows.filter((row) => row.kind === kind).length])),
  };
}

async function commitTransaction(changes, options = {}) {
  if (!changes.length) return;
  const transactionId = randomUUID();
  const records = [];
  try {
    for (const change of changes) {
      await verifyIdentity(change.outputBinding,
        `${change.animationId}: keyframes.csv`);
      const directory = path.dirname(change.outputBinding.absolutePath);
      const basename = path.basename(change.outputBinding.absolutePath);
      const tempPath = path.join(directory, `.${basename}.${transactionId}.tmp`);
      const backupPath = path.join(directory, `.${basename}.${transactionId}.bak`);
      await writeFile(tempPath, change.rendered, {
        flag: "wx",
        mode: change.outputBinding.identity.mode & 0o777,
      });
      invariant(await sha256File(tempPath) === sha256(change.rendered),
        `${change.animationId}: staged keyframes hash mismatch`);
      records.push({change, tempPath, backupPath,
        originalMoved: false, installed: false});
    }
    let installedCount = 0;
    for (const record of records) {
      await verifyIdentity(record.change.outputBinding,
        `${record.change.animationId}: keyframes.csv`);
      await rename(record.change.outputBinding.absolutePath, record.backupPath);
      record.originalMoved = true;
      await rename(record.tempPath, record.change.outputBinding.absolutePath);
      record.installed = true;
      installedCount += 1;
      if (options.testFailAfterInstall === installedCount) {
        throw new Error(`Injected transaction failure after ${installedCount} install(s)`);
      }
    }
    for (const record of records) {
      invariant(await sha256File(record.change.outputBinding.absolutePath) ===
        sha256(record.change.rendered),
      `${record.change.animationId}: installed keyframes hash mismatch`);
    }
    for (const record of records) await unlink(record.backupPath);
  } catch (error) {
    const rollbackErrors = [];
    for (const record of [...records].reverse()) {
      try {
        if (record.installed) {
          const observed = await sha256File(record.change.outputBinding.absolutePath);
          invariant(observed === sha256(record.change.rendered),
            `${record.change.animationId}: installed output changed before rollback`);
          const rollbackTemp = `${record.tempPath}.rollback`;
          await rename(record.change.outputBinding.absolutePath, rollbackTemp);
          await rename(record.backupPath, record.change.outputBinding.absolutePath);
          record.originalMoved = false;
          await unlink(rollbackTemp);
          record.installed = false;
        } else if (record.originalMoved) {
          await rename(record.backupPath, record.change.outputBinding.absolutePath);
          record.originalMoved = false;
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${record.change.animationId}: ${rollbackError.message}`);
      }
      try {
        await unlink(record.tempPath);
      } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") {
          rollbackErrors.push(`${record.change.animationId} temp: ${cleanupError.message}`);
        }
      }
    }
    if (rollbackErrors.length) {
      throw new Error(`${error.message}; rollback errors: ${rollbackErrors.join("; ")}`);
    }
    throw error;
  }
}

async function acquireLock(root, mode) {
  const lockPath = path.join(root, LOCK_BASENAME);
  const handle = await open(lockPath, "wx", 0o600).catch((error) => {
    if (error?.code === "EEXIST") {
      throw new Error(`Another structural-keyframe transaction holds ${LOCK_BASENAME}`);
    }
    throw error;
  });
  await handle.writeFile(`${JSON.stringify({pid: process.pid, mode})}\n`, "utf8");
  return {handle, lockPath};
}

export async function materializeLessonReleaseStructuralKeyframes(options = {}) {
  const root = path.resolve(options.projectRoot || defaultProjectRoot);
  const rootInfo = await lstat(root);
  invariant(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    "Project root must be a real directory, not a symlink");
  const rootReal = await realpath(root);
  const mode = options.mode || "dry-run";
  invariant(["dry-run", "apply", "check"].includes(mode),
    `Unknown mode: ${mode}`);
  const releaseId = options.releaseId || "";
  assertSafeId(releaseId, "Requested release ID");
  const ids = options.ids || [];
  const lock = options.skipLock ? null : await acquireLock(root, mode);
  try {
    const catalogRelativePath = options.lessonReleasesPath ||
      DEFAULT_RELEASES_PATH;
    const templateRelativePath = options.templatePath || DEFAULT_TEMPLATE_PATH;
    const migrationsRelativePath = options.migrationsPath || "migrations";
    const migrationsPath = resolveRelative(root, migrationsRelativePath,
      "Migration root");
    await assertDirectory(rootReal, migrationsPath, "Migration root");
    const catalogBinding = await readBinding({
      root,
      rootReal,
      relativePath: catalogRelativePath,
      label: "Lesson-release catalog",
    });
    const templateBinding = await readBinding({
      root,
      rootReal,
      relativePath: templateRelativePath,
      label: "Canonical keyframe template",
    });
    invariant(templateBinding.bytes.equals(expectedHeaderBytes()),
      "Canonical keyframe template header drifted");
    const catalog = parseJson(catalogBinding, "Lesson-release catalog");
    const selection = selectLessonRelease(catalog, {releaseId, ids});
    const indexSuffix = selection.selectionIdentity.scope ===
      "complete-atomic-release" ? "" : `--subset-${selection.selectionSha256}`;
    const indexRelativePath =
      `${RELEASE_INDEX_DIRECTORY}/${releaseId}${indexSuffix}.json`;
    const indexBinding = await readBinding({
      root,
      rootReal,
      relativePath: indexRelativePath,
      label: "Release trace-spec index",
    });
    const index = parseJson(indexBinding, "Release trace-spec index");
    const indexSummary = validateIndex({
      index,
      indexBinding,
      catalogBinding,
      catalogRelativePath,
      selection,
    });
    indexBinding.catalogSha256 = catalogBinding.sha256;

    const prepared = [];
    for (const [position, member] of selection.members.entries()) {
      prepared.push(await prepareMember({
        root,
        rootReal,
        release: selection.release,
        member,
        indexedMember: index.members[position],
        indexBinding,
        indexRelativePath,
        templateBinding,
        releaseFingerprintSha256: indexSummary.releaseFingerprintSha256,
      }));
    }

    const allInputs = [catalogBinding, templateBinding, indexBinding,
      ...prepared.flatMap(({inputBindings}) => inputBindings)];
    for (const binding of allInputs) {
      await verifyIdentity(binding, binding.relativePath);
    }
    const stale = prepared.filter(({current}) => !current);
    if (mode === "check") {
      invariant(!stale.length,
        `Structural keyframe specifications are stale for: ${stale.map(({animationId}) => animationId).join(", ")}`);
    } else if (mode === "apply") {
      await commitTransaction(stale, {
        testFailAfterInstall: options.testFailAfterInstall,
      });
    }

    const kindCounts = {};
    for (const member of prepared) {
      for (const [kind, count] of Object.entries(member.kindCounts)) {
        kindCounts[kind] = (kindCounts[kind] || 0) + count;
      }
    }
    return {
      status: mode === "check" ? "verified" :
        mode === "apply" ? "applied" : "planned",
      mode,
      releaseId,
      selectionScope: selection.selectionIdentity.scope,
      selectionSha256: selection.selectionSha256,
      selectedMemberCount: prepared.length,
      atomicReleaseMemberCount: selection.release.expectedCounts.members,
      currentMemberCount: prepared.length - stale.length,
      changedMemberCount: mode === "apply" ? stale.length : 0,
      wouldChangeMemberCount: stale.length,
      pristineGeneratedRefreshMemberCount: prepared.filter(
        ({pristineGeneratedRefresh}) => pristineGeneratedRefresh,
      ).length,
      rowCount: prepared.reduce((sum, member) => sum + member.rowCount, 0),
      distinctStructuralFrameCount: prepared.reduce((sum, member) =>
        sum + member.structuralFrames.length, 0),
      languageRows: {
        en: prepared.reduce((sum, member) => sum + member.rowCount / 2, 0),
        es: prepared.reduce((sum, member) => sum + member.rowCount / 2, 0),
      },
      kindCounts: Object.fromEntries(Object.entries(kindCounts)
        .sort(([left], [right]) => compareText(left, right))),
      traceSpecIndex: {
        path: indexRelativePath,
        sha256: indexBinding.sha256,
      },
      members: prepared.map((member) => ({
        animationId: member.animationId,
        output: `migrations/${member.animationId}/keyframes.csv`,
        currentBeforeOperation: member.current,
        pristineGeneratedRefresh: member.pristineGeneratedRefresh,
        rowCount: member.rowCount,
        structuralFrameCount: member.structuralFrames.length,
        structuralFrames: member.structuralFrames,
        stage: member.stage,
        fps: member.fps,
        rootFrameCount: member.frameCount,
      })),
      acceptanceBoundary: {
        structuralSpecificationOnly: true,
        runtimeReachabilityResolved: false,
        bilingualVisualDifferenceClaimed: false,
        audioAccepted: false,
        authoritativeOriginalRuntimeBaseline: false,
        fidelityAccepted: false,
        humanReviewAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
        strictAcceptanceEffect: "none",
      },
    };
  } finally {
    if (lock) {
      await lock.handle.close();
      await unlink(lock.lockPath).catch((error) => {
        if (error?.code !== "ENOENT") throw error;
      });
    }
  }
}

export function parseArguments(argumentsList) {
  const options = {
    mode: "dry-run",
    releaseId: "",
    ids: [],
    json: false,
  };
  let explicitMode = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (["--apply", "--check", "--dry-run"].includes(value)) {
      invariant(!explicitMode,
        "Choose exactly one of --apply, --check, or --dry-run");
      explicitMode = true;
      options.mode = value.slice(2);
    } else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--release-id", "--id", "--lesson-releases",
      "--migrations", "--template"].includes(value)) {
      const next = argumentsList[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a value`);
      if (value === "--release-id") {
        invariant(!options.releaseId, "--release-id may be supplied once");
        options.releaseId = next;
      } else if (value === "--id") options.ids.push(next);
      else if (value === "--lesson-releases") options.lessonReleasesPath = next;
      else if (value === "--migrations") options.migrationsPath = next;
      else options.templatePath = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.help) invariant(options.releaseId, "--release-id is required");
  return options;
}

function helpText() {
  return `Usage:
  node scripts/materialize-lesson-release-structural-keyframes.mjs --release-id <release> [--id <verified-member>]... [--dry-run|--apply|--check] [--json]

This acceptance-neutral materializer writes only keyframes.csv. It selects
source-evidenced root structural frames for the exact EN/ES coverage and trace
identities. It does not create an original-runtime baseline, audio decision,
fidelity result, reviewer decision, strict completion, or publication state.
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      const result = await materializeLessonReleaseStructuralKeyframes(options);
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        process.stdout.write(
          `${result.status}: ${result.releaseId}; ${result.selectedMemberCount} member(s), ${result.rowCount} structural keyframe row(s), strictAcceptanceEffect=none\n`,
        );
      }
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
