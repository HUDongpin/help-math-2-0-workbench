import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";

export const CURRENT_JS_CANDIDATE_PROFILE_PATH =
  "apps/web/config/current-js-candidate-assets.v1.json";

const SHA256 = /^[a-f0-9]{64}$/u;
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (
    !relative.startsWith(`..${path.sep}`)
    && relative !== ".."
    && !path.isAbsolute(relative)
  );
}

function logicalAssetPath(value) {
  if (typeof value !== "string") return null;
  const trimmed = portable(value.trim()).replace(/^\.\//u, "");
  const publicPrefix = "public/flash-assets/";
  const routePrefix = "/flash-assets/";
  const assetPath = trimmed.startsWith(publicPrefix)
    ? trimmed.slice(publicPrefix.length)
    : trimmed.startsWith(routePrefix)
      ? trimmed.slice(routePrefix.length)
      : null;
  if (
    !assetPath
    || !assetPath.startsWith("courses/")
    || assetPath.split("/").some((segment) => (
      !SAFE_SEGMENT.test(segment) || segment === "." || segment === ".."
    ))
  ) return null;
  return {
    assetPath,
    logicalPath: `public/flash-assets/${assetPath}`,
  };
}

async function exists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function assertOrdinaryFileWithinProject(projectRoot, absolutePath,
  label) {
  const relativePath = portable(path.relative(projectRoot, absolutePath));
  invariant(
    relativePath
      && !relativePath.startsWith("../")
      && relativePath !== ".."
      && !path.isAbsolute(relativePath),
    `${label} escapes the project root: ${relativePath || absolutePath}`,
  );
  let cursor = projectRoot;
  for (const segment of relativePath.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(
      !metadata.isSymbolicLink(),
      `${label} path contains a symbolic link: ${portable(path.relative(projectRoot, cursor))}`,
    );
  }
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile(), `${label} is not an ordinary file: ${relativePath}`);
  const [realProjectRoot, realTarget] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(
    isInside(realProjectRoot, realTarget),
    `${label} resolves outside the project root: ${relativePath}`,
  );
  return {metadata, relativePath};
}

function validateCandidateProfile(profile) {
  invariant(
    profile?.schemaVersion === 1
      && profile.profileId === "current-js-candidate-assets-v1",
    "Current-JS candidate asset profile identity is invalid",
  );
  invariant(
    typeof profile.version === "string" && SAFE_SEGMENT.test(profile.version),
    "Current-JS candidate asset profile version is invalid",
  );
  invariant(
    Number.isSafeInteger(profile.counts?.runtime)
      && profile.counts.runtime >= 0
      && Array.isArray(profile.entries)
      && profile.entries.length === profile.counts.runtime,
    "Current-JS candidate asset profile runtime count is invalid",
  );
  invariant(
    profile.authority?.productionApproved === false
      && profile.authority?.releaseEligible === false
      && profile.authority?.published === false,
    "Current-JS candidate asset profile authority was promoted",
  );
  invariant(
    Array.isArray(profile.candidateReleaseIds)
      && new Set(profile.candidateReleaseIds).size
        === profile.candidateReleaseIds.length,
    "Current-JS candidate asset release IDs are invalid",
  );
  const releaseIds = new Set(profile.candidateReleaseIds);
  const records = new Map();
  for (const [index, entry] of profile.entries.entries()) {
    const label = `Current-JS candidate asset profile entry ${index + 1}`;
    invariant(
      typeof entry?.assetPath === "string"
        && entry.assetPath.startsWith("courses/")
        && entry.assetPath.split("/").every((segment) => (
          SAFE_SEGMENT.test(segment) && segment !== "." && segment !== ".."
        )),
      `${label} assetPath is invalid`,
    );
    invariant(
      entry.relativePath === entry.assetPath.slice("courses/".length),
      `${label} relativePath is invalid`,
    );
    invariant(entry.storageRoot === "candidate",
      `${label} storageRoot must be candidate`);
    invariant(
      typeof entry.releaseId === "string" && releaseIds.has(entry.releaseId),
      `${label} releaseId is not declared by the candidate profile`,
    );
    invariant(
      Number.isSafeInteger(entry.bytes) && entry.bytes > 0,
      `${label} bytes is invalid`,
    );
    invariant(SHA256.test(entry.sha256 || ""),
      `${label} SHA-256 is invalid`);
    invariant(!records.has(entry.assetPath),
      `${label} duplicates ${entry.assetPath}`);
    records.set(entry.assetPath, entry);
  }
  return records;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Resolve a legacy /flash-assets logical identity without restoring a public
 * mirror. Existing workbench-public files retain precedence. When that file is
 * absent, only an exact, acceptance-neutral candidate-profile record may map
 * the identity to the versioned private candidate store.
 */
export async function resolveCurrentJsCandidateAssetBinding({
  projectRoot,
  logicalPath,
  expectedBytes,
  expectedSha256,
}) {
  invariant(projectRoot, "projectRoot is required");
  const identity = logicalAssetPath(logicalPath);
  if (!identity) return null;
  const resolvedProjectRoot = path.resolve(projectRoot);
  const legacyAbsolutePath = path.resolve(
    resolvedProjectRoot,
    identity.logicalPath,
  );
  if (await exists(legacyAbsolutePath)) {
    return {
      kind: "legacy-workbench-public",
      logicalPath: identity.logicalPath,
      assetPath: identity.assetPath,
      absolutePath: legacyAbsolutePath,
      relativePath: identity.logicalPath,
      profile: null,
      record: null,
    };
  }

  const profileAbsolutePath = path.resolve(
    resolvedProjectRoot,
    CURRENT_JS_CANDIDATE_PROFILE_PATH,
  );
  const profileFile = await assertOrdinaryFileWithinProject(
    resolvedProjectRoot,
    profileAbsolutePath,
    "Current-JS candidate asset profile",
  );
  const profileBytes = await readFile(profileAbsolutePath);
  let profile;
  try {
    profile = JSON.parse(profileBytes.toString("utf8"));
  } catch (error) {
    throw new Error(
      `Current-JS candidate asset profile is not valid JSON: ${error.message}`,
    );
  }
  const records = validateCandidateProfile(profile);
  const record = records.get(identity.assetPath);
  if (!record) return null;
  invariant(
    !expectedSha256 || record.sha256 === String(expectedSha256).toLowerCase(),
    `${identity.logicalPath}: candidate profile SHA-256 does not match the declared binding`,
  );
  invariant(
    !Number.isSafeInteger(expectedBytes) || record.bytes === expectedBytes,
    `${identity.logicalPath}: candidate profile byte count does not match the declared binding`,
  );

  const storageRoot = path.resolve(
    resolvedProjectRoot,
    "apps/web/candidate-assets/flash-assets",
    profile.version,
  );
  const absolutePath = path.resolve(storageRoot, ...identity.assetPath.split("/"));
  invariant(
    absolutePath !== storageRoot && isInside(storageRoot, absolutePath),
    `${identity.logicalPath}: candidate storage path escapes its version root`,
  );
  const physical = await assertOrdinaryFileWithinProject(
    resolvedProjectRoot,
    absolutePath,
    "Current-JS candidate asset",
  );
  const bytes = await readFile(absolutePath);
  const digest = sha256(bytes);
  invariant(
    physical.metadata.size === record.bytes && bytes.length === record.bytes,
    `${identity.logicalPath}: candidate asset byte count differs from its profile`,
  );
  invariant(
    digest === record.sha256,
    `${identity.logicalPath}: candidate asset SHA-256 differs from its profile`,
  );
  return {
    kind: "candidate-profile",
    logicalPath: identity.logicalPath,
    assetPath: identity.assetPath,
    absolutePath,
    relativePath: physical.relativePath,
    profile: {
      path: CURRENT_JS_CANDIDATE_PROFILE_PATH,
      bytes: profileFile.metadata.size,
      sha256: sha256(profileBytes),
      profileId: profile.profileId,
      version: profile.version,
      authority: structuredClone(profile.authority),
    },
    record: structuredClone(record),
  };
}
