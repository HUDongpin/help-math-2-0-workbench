#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {chromium} from "@playwright/test";
import {PNG} from "pngjs";

import {
  assertLoopbackBaseUrl as assertLegacyLoopbackBaseUrl,
  validateSourceResponse as validateLegacySourceResponse,
} from "./probe-g4-l3-ruffle-reference.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const OUTPUT_RELATIVE_ROOT = path.join(
  "output",
  "playwright",
  "lesson-ruffle-reference-diagnostics",
);
const DEFAULT_RELEASE_CATALOG = path.join(projectRoot, "catalog", "lesson-releases.json");
const DEFAULT_ANIMATION_CATALOG = path.join(projectRoot, "catalog", "animations.json");
const DEFAULT_MIGRATIONS_ROOT = path.join(projectRoot, "migrations");
const DEFAULT_SETTLE_MS = 3_500;
const DEFAULT_TIMEOUT_MS = 45_000;
const DIAGNOSTIC_VIEWPORT = Object.freeze({width: 1280, height: 1600});
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_64 = /^[a-f0-9]{64}$/;
const RUFFLE_PACKAGE_VERSION = "0.4.1";

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function portableFrom(root, value) {
  return portable(path.relative(root, value));
}

function isPathInside(root, value, {allowRoot = false} = {}) {
  const relative = path.relative(root, value);
  return (allowRoot && relative === "") || (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}

function assertSafeId(value, label) {
  invariant(typeof value === "string" && SAFE_ID.test(value), `${label} must be a lowercase hyphenated ID`);
}

function parseInteger(value, label, {allowZero = false} = {}) {
  const parsed = Number(value);
  invariant(
    Number.isInteger(parsed) && (allowZero ? parsed >= 0 : parsed > 0),
    `${label} must be ${allowZero ? "a non-negative" : "a positive"} integer`,
  );
  return parsed;
}

export function assertLoopbackBaseUrl(value) {
  return assertLegacyLoopbackBaseUrl(value);
}

export function expandLanguages(value) {
  invariant(["en", "es", "both"].includes(value), "--lang must be en, es, or both");
  return value === "both" ? ["en", "es"] : [value];
}

function resolveInputPath(value) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(projectRoot, value);
}

export function parseArguments(argv) {
  const options = {
    releaseId: "",
    ids: [],
    baseUrl: "",
    language: "both",
    settleMs: DEFAULT_SETTLE_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    releaseCatalogPath: DEFAULT_RELEASE_CATALOG,
    animationCatalogPath: DEFAULT_ANIMATION_CATALOG,
    migrationsRoot: DEFAULT_MIGRATIONS_ROOT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      options.help = true;
      continue;
    }
    const next = () => {
      const candidate = argv[++index];
      invariant(candidate && !candidate.startsWith("--"), `${value} requires a value`);
      return candidate;
    };
    if (value === "--release-id") options.releaseId = next();
    else if (value === "--id") options.ids.push(next());
    else if (value === "--base-url") options.baseUrl = assertLoopbackBaseUrl(next());
    else if (value === "--lang") options.language = next();
    else if (value === "--settle-ms") options.settleMs = parseInteger(next(), "--settle-ms", {allowZero: true});
    else if (value === "--timeout-ms") options.timeoutMs = parseInteger(next(), "--timeout-ms");
    else if (value === "--lesson-releases") options.releaseCatalogPath = resolveInputPath(next());
    else if (value === "--animations") options.animationCatalogPath = resolveInputPath(next());
    else if (value === "--migrations") options.migrationsRoot = resolveInputPath(next());
    else throw new Error(`Unknown option: ${value}`);
  }
  if (options.help) return options;
  assertSafeId(options.releaseId, "--release-id");
  invariant(options.baseUrl, "--base-url is required");
  expandLanguages(options.language);
  for (const id of options.ids) assertSafeId(id, "--id");
  invariant(new Set(options.ids).size === options.ids.length, "--id values must not be repeated");
  return options;
}

async function readPhysicalFile(filePath, label, {
  containmentRoot,
  requireSingleLink = true,
} = {}) {
  const absolute = path.resolve(filePath);
  if (containmentRoot) {
    invariant(isPathInside(path.resolve(containmentRoot), absolute, {allowRoot: false}), `${label} must stay inside its controlled root`);
  }
  let information;
  try {
    information = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${absolute}`);
    throw error;
  }
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a real regular file`);
  if (requireSingleLink) invariant(information.nlink === 1, `${label} must not be a hard-linked file`);
  const resolved = await realpath(absolute);
  invariant(resolved === absolute, `${label} must not traverse a symbolic-link parent`);
  const bytes = await readFile(absolute);
  return {
    absolute,
    bytes,
    size: bytes.length,
    sha256: sha256(bytes),
  };
}

async function readBoundJson(filePath, label, options) {
  const physical = await readPhysicalFile(filePath, label, options);
  let value;
  try {
    value = JSON.parse(physical.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return {...physical, value};
}

async function readPhysicalDirectory(directory, label, containmentRoot) {
  const absolute = path.resolve(directory);
  invariant(isPathInside(path.resolve(containmentRoot), absolute, {allowRoot: false}), `${label} must stay inside its controlled root`);
  let information;
  try {
    information = await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`${label} is missing: ${absolute}`);
    throw error;
  }
  invariant(information.isDirectory() && !information.isSymbolicLink(), `${label} must be a real directory`);
  invariant(await realpath(absolute) === absolute, `${label} must not traverse a symbolic-link parent`);
  return absolute;
}

function validateAndSelectRelease(releaseDocument, {releaseId, ids}) {
  invariant(
    releaseDocument?.schemaVersion === 1 && Array.isArray(releaseDocument.releases),
    "Lesson-release catalog must be schemaVersion 1 with a releases array",
  );
  const matches = releaseDocument.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, matches.length ? `Lesson release ID is duplicated: ${releaseId}` : `Unknown lesson release: ${releaseId}`);
  const release = matches[0];
  invariant(release.releaseType === "complete-lesson", `${releaseId}: releaseType must be complete-lesson`);
  invariant(release.publicationMode === "atomic", `${releaseId}: publicationMode must be atomic`);
  invariant(release.scope?.excludeNonMembers === true, `${releaseId}: release scope must exclude non-members`);
  invariant(Array.isArray(release.members) && release.members.length > 0, `${releaseId}: members must be a non-empty array`);
  invariant(release.expectedCounts?.members === release.members.length, `${releaseId}: expected member count does not match members`);

  const animationIds = new Set();
  const assetIds = new Set();
  let activePages = 0;
  let shells = 0;
  for (const [index, member] of release.members.entries()) {
    invariant(member?.ordinal === index + 1, `${releaseId}: member ordinals must be contiguous release order 1..${release.members.length}`);
    assertSafeId(member.animationId, `${releaseId} member animationId`);
    invariant(!animationIds.has(member.animationId), `${releaseId}: duplicate member animationId ${member.animationId}`);
    animationIds.add(member.animationId);
    invariant(typeof member.source?.path === "string" && member.source.path.endsWith(".swf"), `${member.animationId}: source path must name a SWF`);
    invariant(!path.isAbsolute(member.source.path) && !member.source.path.split("/").includes(".."), `${member.animationId}: source path is unsafe`);
    invariant(HEX_64.test(member.source.sha256 ?? ""), `${member.animationId}: source SHA-256 is malformed`);
    invariant(member.assetId === `swf-${member.source.sha256}`, `${member.animationId}: assetId does not match source SHA-256`);
    invariant(!assetIds.has(member.assetId), `${releaseId}: duplicate member assetId ${member.assetId}`);
    assetIds.add(member.assetId);
    if (member.releaseRole === "active-xml-referenced-page") activePages += 1;
    else if (member.releaseRole === "course-shell") shells += 1;
    else throw new Error(`${member.animationId}: unsupported releaseRole ${member.releaseRole}`);
  }
  invariant(release.expectedCounts.activeXmlReferencedPages === activePages, `${releaseId}: active page count does not match expectedCounts`);
  invariant(release.expectedCounts.courseShells === shells, `${releaseId}: shell count does not match expectedCounts`);

  const requested = new Set(ids);
  for (const id of requested) invariant(animationIds.has(id), `${id}: --id is not an exact member of ${releaseId}`);
  const members = ids.length ? release.members.filter((member) => requested.has(member.animationId)) : [...release.members];
  return {release, members};
}

function numericStage(value, label) {
  const width = value?.width;
  const height = value?.height;
  invariant(Number.isFinite(width) && width > 0, `${label} width must be a positive number`);
  invariant(Number.isFinite(height) && height > 0, `${label} height must be a positive number`);
  return {width, height};
}

function exactCanonicalSourceRelative(member) {
  return portable(path.join(
    "source-assets",
    "flash",
    "HELP MATH_ORIGINAL FILES",
    ...member.source.path.split("/"),
  ));
}

function catalogBinding(root, bound) {
  return {
    path: portableFrom(root, bound.absolute),
    bytes: bound.size,
    sha256: bound.sha256,
  };
}

/**
 * Build and fully validate an exact release-derived run plan without opening a
 * browser or writing output. Optional IDs are a subset selector only; the
 * returned plan always follows the release's canonical ordinal order.
 */
export async function buildReleaseProbePlan({
  root = projectRoot,
  releaseId,
  ids = [],
  baseUrl,
  language = "both",
  settleMs = DEFAULT_SETTLE_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  releaseCatalogPath = path.join(root, "catalog", "lesson-releases.json"),
  animationCatalogPath = path.join(root, "catalog", "animations.json"),
  migrationsRoot = path.join(root, "migrations"),
} = {}) {
  const resolvedRoot = path.resolve(root);
  assertSafeId(releaseId, "releaseId");
  for (const id of ids) assertSafeId(id, "animation ID");
  invariant(new Set(ids).size === ids.length, "animation IDs must not be repeated");
  const origin = assertLoopbackBaseUrl(baseUrl);
  const languages = expandLanguages(language);
  parseInteger(settleMs, "settleMs", {allowZero: true});
  parseInteger(timeoutMs, "timeoutMs");
  const outputRoot = path.join(resolvedRoot, OUTPUT_RELATIVE_ROOT);

  const [releaseCatalog, animationCatalog] = await Promise.all([
    readBoundJson(releaseCatalogPath, "lesson-release catalog", {containmentRoot: resolvedRoot}),
    readBoundJson(animationCatalogPath, "animation catalog", {containmentRoot: resolvedRoot}),
  ]);
  const {release, members} = validateAndSelectRelease(releaseCatalog.value, {releaseId, ids});
  invariant(animationCatalog.value?.schemaVersion === 1 && Array.isArray(animationCatalog.value.animations), "Animation catalog must be schemaVersion 1 with an animations array");
  const animationsById = new Map();
  for (const animation of animationCatalog.value.animations) {
    if (!animation?.animationId) continue;
    invariant(!animationsById.has(animation.animationId), `Animation catalog duplicates ${animation.animationId}`);
    animationsById.set(animation.animationId, animation);
  }
  const migrationRootAbsolute = await readPhysicalDirectory(migrationsRoot, "migration root", resolvedRoot);
  const sourceRoot = path.join(resolvedRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const ordinalWidth = String(release.members.length).length;
  const memberPlans = [];

  for (const member of members) {
    const animation = animationsById.get(member.animationId);
    invariant(animation, `${member.animationId}: animation catalog entry is missing`);
    invariant(animation.assetId === member.assetId, `${member.animationId}: animation catalog assetId conflicts with the release`);
    invariant(animation.source?.path === member.source.path, `${member.animationId}: animation catalog source path conflicts with the release`);
    invariant(animation.source?.sha256 === member.source.sha256, `${member.animationId}: animation catalog source hash conflicts with the release`);
    invariant(Number.isInteger(animation.source?.bytes) && animation.source.bytes > 0, `${member.animationId}: animation catalog source byte count is missing`);
    const catalogStage = numericStage(animation.source?.swf?.stage, `${member.animationId} animation-catalog stage`);

    const workspace = await readPhysicalDirectory(
      path.join(migrationRootAbsolute, member.animationId),
      `${member.animationId} migration workspace`,
      migrationRootAbsolute,
    );
    const [manifestBound, machineAuditBound] = await Promise.all([
      readBoundJson(path.join(workspace, "migration.json"), `${member.animationId} migration.json`, {containmentRoot: workspace}),
      readBoundJson(path.join(workspace, "audit", "machine", "report.json"), `${member.animationId} machine audit`, {containmentRoot: workspace}),
    ]);
    const manifest = manifestBound.value;
    const machineAudit = machineAuditBound.value;
    invariant(manifest.animationId === member.animationId && manifest.id === member.animationId, `${member.animationId}: workspace identity conflicts with the release`);
    invariant(manifest.assetId === member.assetId, `${member.animationId}: workspace assetId conflicts with the release`);
    invariant(manifest.source?.swfSha256 === member.source.sha256, `${member.animationId}: workspace SWF hash conflicts with the release`);
    const canonicalRelative = exactCanonicalSourceRelative(member);
    invariant(portable(manifest.source?.swf ?? "") === canonicalRelative, `${member.animationId}: workspace SWF path conflicts with the exact canonical placement`);
    invariant(portable(manifest.source?.placementPath ?? "") === canonicalRelative, `${member.animationId}: workspace placement path conflicts with the exact canonical placement`);
    const manifestStage = numericStage(manifest.runtime?.stage, `${member.animationId} workspace stage`);
    invariant(manifestStage.width === catalogStage.width && manifestStage.height === catalogStage.height, `${member.animationId}: workspace stage conflicts with the animation catalog`);

    const sourcePath = path.join(sourceRoot, ...member.source.path.split("/"));
    const source = await readPhysicalFile(sourcePath, `${member.animationId} canonical SWF source`, {
      containmentRoot: sourceRoot,
      requireSingleLink: true,
    });
    invariant(source.size === animation.source.bytes, `${member.animationId}: physical SWF byte count conflicts with the animation catalog`);
    invariant(source.sha256 === member.source.sha256, `${member.animationId}: physical SWF hash conflicts with the release`);

    invariant(machineAudit.animationId === member.animationId, `${member.animationId}: machine-audit identity conflicts with the release`);
    invariant(machineAudit.source?.path === canonicalRelative, `${member.animationId}: machine-audit source path conflicts with the canonical placement`);
    invariant(machineAudit.source?.expectedSha256 === member.source.sha256, `${member.animationId}: machine-audit expected hash conflicts with the release`);
    invariant(machineAudit.source?.observedSha256Before === member.source.sha256, `${member.animationId}: machine-audit pre-run hash is stale`);
    invariant(machineAudit.source?.observedSha256After === member.source.sha256, `${member.animationId}: machine-audit post-run hash is stale`);
    invariant(machineAudit.source?.bytesBefore === source.size && machineAudit.source?.bytesAfter === source.size, `${member.animationId}: machine-audit byte count conflicts with the physical source`);
    invariant(machineAudit.source?.hashMatches === true, `${member.animationId}: machine-audit source hash is not verified`);
    invariant(machineAudit.findings?.runtimeCrossCheck?.allMatch === true, `${member.animationId}: machine-audit stage/runtime cross-check did not pass`);
    invariant(machineAudit.auditStatus === "partial" && machineAudit.migrationStatusUnchanged === true, `${member.animationId}: machine audit must remain partial and status-preserving`);

    memberPlans.push({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      source: {
        path: canonicalRelative,
        bytes: source.size,
        sha256: source.sha256,
      },
      stage: manifestStage,
      workspace: portableFrom(resolvedRoot, workspace),
      manifest: catalogBinding(resolvedRoot, manifestBound),
      machineAudit: catalogBinding(resolvedRoot, machineAuditBound),
      outputMemberDirectory: `${String(member.ordinal).padStart(ordinalWidth, "0")}-${member.animationId}`,
    });
  }

  const releaseOutputRoot = path.join(outputRoot, releaseId);
  const runs = memberPlans.flatMap((member) => languages.map((runLanguage) => {
    const output = path.join(releaseOutputRoot, member.outputMemberDirectory, runLanguage);
    return {
      ...member,
      language: runLanguage,
      pageUrl: `${origin}${runLanguage === "es" ? "/es" : ""}/reference/${encodeURIComponent(member.animationId)}`,
      sourceUrl: `${origin}/api/reference/${encodeURIComponent(member.animationId)}`,
      output,
    };
  }));

  return {
    root: resolvedRoot,
    releaseId,
    release: {
      releaseId: release.releaseId,
      titleDisplay: release.titleDisplay ?? "",
      grade: release.grade ?? release.scope?.grade ?? null,
      lesson: release.lesson ?? release.scope?.lesson ?? null,
      publicationMode: release.publicationMode,
      totalMemberCount: release.members.length,
      selectedMemberCount: memberPlans.length,
      selection: ids.length ? "explicit-exact-release-subset" : "complete-exact-release",
    },
    baseUrl: origin,
    languages,
    settleMs,
    timeoutMs,
    outputRoot,
    releaseOutputRoot,
    catalogs: {
      lessonReleases: catalogBinding(resolvedRoot, releaseCatalog),
      animations: catalogBinding(resolvedRoot, animationCatalog),
    },
    members: memberPlans,
    runs,
  };
}

export function requestDisposition(requestUrl, method, {expectedOrigin, pageUrl, sourceUrl}) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return {allowed: false, kind: "blocked-malformed-url"};
  }
  if (method !== "GET") {
    return {
      allowed: false,
      kind: url.origin === expectedOrigin ? "blocked-local-non-get" : "blocked-external-non-get",
    };
  }
  if (url.protocol !== "http:" || url.origin !== expectedOrigin) {
    return {allowed: false, kind: "blocked-external-or-non-loopback-get"};
  }
  if (requestUrl === pageUrl) return {allowed: true, kind: "allowed-exact-page-get"};
  if (requestUrl === sourceUrl) return {allowed: true, kind: "allowed-exact-swf-api-get"};
  if (url.pathname === "/_next" || url.pathname.startsWith("/_next/")) {
    return {allowed: true, kind: "allowed-next-get"};
  }
  if (url.pathname === "/api/ruffle" || url.pathname.startsWith("/api/ruffle/")) {
    return {allowed: true, kind: "allowed-ruffle-api-get"};
  }
  return {allowed: false, kind: "blocked-local-unallowlisted-get"};
}

/** Install the actual browser-context HTTP and WebSocket enforcement layer. */
export async function installPlaywrightNetworkGuard(context, policy) {
  const requests = [];
  const blockedRequests = [];
  const blockedWebSockets = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const record = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      ...requestDisposition(request.url(), request.method(), policy),
    };
    requests.push(record);
    if (record.allowed) await route.continue();
    else {
      blockedRequests.push(record);
      await route.abort("blockedbyclient");
    }
  });
  await context.routeWebSocket("**/*", async (webSocket) => {
    const record = {url: webSocket.url(), kind: "blocked-websocket", allowed: false};
    blockedWebSockets.push(record);
    await webSocket.close({code: 1008, reason: "Ruffle diagnostic network policy"});
  });
  return {requests, blockedRequests, blockedWebSockets};
}

/**
 * Attach both fulfillment and rejection handlers synchronously. This prevents
 * a context/page close from becoming an unhandled rejection while a preceding
 * navigation or geometry error is being propagated. The rejected outcome
 * still retains the original error and must be unwrapped by the caller.
 */
export function waitForSourceResponseSettled(page, sourceUrl, timeoutMs) {
  return page.waitForResponse(
    (response) => response.url() === sourceUrl && response.request().method() === "GET",
    {timeout: timeoutMs},
  ).then(
    (response) => ({status: "fulfilled", response}),
    (error) => ({status: "rejected", error}),
  );
}

export function unwrapSourceResponseOutcome(outcome) {
  if (outcome.status === "rejected") throw outcome.error;
  invariant(outcome.status === "fulfilled" && outcome.response, "Source-response wait produced a malformed outcome");
  return outcome.response;
}

async function validatePlaywrightSourceResponse(response, expected) {
  const body = await response.body();
  const headers = await response.allHeaders();
  const webResponse = new Response(body, {status: response.status(), headers});
  return validateLegacySourceResponse(webResponse, {
    expectedSha256: expected.sha256,
    expectedBytes: expected.bytes,
  });
}

export async function readPinnedRuffleNetworkingBoundary({root = projectRoot} = {}) {
  const packagePath = path.join(root, "node_modules", "@ruffle-rs", "ruffle", "package.json");
  const sourceMapPath = path.join(root, "node_modules", "@ruffle-rs", "ruffle", "ruffle.js.map");
  const lockPath = path.join(root, "package-lock.json");
  const referencePlayerPath = path.join(root, "apps", "web", "components", "reference-player.tsx");
  const [packageBound, sourceMapBound, lockBound, referencePlayer] = await Promise.all([
    readBoundJson(packagePath, "installed Ruffle package metadata", {containmentRoot: root, requireSingleLink: false}),
    readBoundJson(sourceMapPath, "installed Ruffle local source map", {containmentRoot: root, requireSingleLink: false}),
    readBoundJson(lockPath, "npm lockfile", {containmentRoot: root}),
    readPhysicalFile(referencePlayerPath, "reference-player source", {containmentRoot: root}),
  ]);
  invariant(packageBound.value.version === RUFFLE_PACKAGE_VERSION, `Installed Ruffle version must be ${RUFFLE_PACKAGE_VERSION}`);
  invariant(
    lockBound.value?.packages?.["node_modules/@ruffle-rs/ruffle"]?.version === RUFFLE_PACKAGE_VERSION,
    `package-lock.json must pin Ruffle ${RUFFLE_PACKAGE_VERSION}`,
  );
  const sources = sourceMapBound.value.sources;
  const contents = sourceMapBound.value.sourcesContent;
  invariant(Array.isArray(sources) && Array.isArray(contents) && sources.length === contents.length, "Ruffle source map lacks aligned local sourcesContent");
  const sourceIndex = sources.findIndex((source) => typeof source === "string" && source.endsWith("/core/dist/public/config/load-options.js"));
  invariant(sourceIndex >= 0 && typeof contents[sourceIndex] === "string", "Ruffle source map lacks the NetworkingAccessMode local source");
  const lines = contents[sourceIndex].split("\n");
  const noneLine = lines.findIndex((line) => line.includes('NetworkingAccessMode["None"] = "none"'));
  const unimplementedLine = lines.findIndex((line) => line.includes("This mode is not implemented yet."));
  invariant(noneLine >= 0 && unimplementedLine >= 0 && unimplementedLine < noneLine, "Ruffle local source no longer documents NetworkingAccessMode.None as unimplemented");
  const referenceText = referencePlayer.bytes.toString("utf8");
  invariant(/allowNetworking:\s*['"]none['"]/.test(referenceText), "Reference player no longer requests allowNetworking: none");
  invariant(/allowScriptAccess:\s*false/.test(referenceText), "Reference player no longer disables script access");
  invariant(/openUrlMode:\s*['"]deny['"]/.test(referenceText), "Reference player no longer denies open-URL behavior");
  return {
    rufflePackageVersion: RUFFLE_PACKAGE_VERSION,
    lockfilePinnedVersionVerified: true,
    configuredPlayerDefenseInDepth: {
      allowNetworking: "none",
      allowScriptAccess: false,
      openUrlMode: "deny",
      source: {
        path: portableFrom(root, referencePlayer.absolute),
        bytes: referencePlayer.size,
        sha256: referencePlayer.sha256,
      },
    },
    localSourceDocumentation: {
      sourceMap: {
        path: portableFrom(root, sourceMapBound.absolute),
        bytes: sourceMapBound.size,
        sha256: sourceMapBound.sha256,
      },
      embeddedSource: sources[sourceIndex],
      unimplementedStatementLine: unimplementedLine + 1,
      noneEnumLine: noneLine + 1,
      statement: "Pinned Ruffle 0.4.1 documents NetworkingAccessMode.None in its local source as not implemented.",
    },
    enforcement: {
      authority: "Playwright BrowserContext request and WebSocket routing",
      statement: "Because NetworkingAccessMode.None is documented as not implemented in pinned Ruffle 0.4.1, the browser-context route interception is the network enforcement boundary for this diagnostic.",
      httpPolicy: "Allow only exact page GET, exact SWF API GET, same-origin /_next GET, and same-origin /api/ruffle GET; abort and record every other HTTP request.",
      webSocketPolicy: "Abort and record every WebSocket connection before any server connection is made.",
    },
  };
}

async function ensureControlledOutputDirectory(root, directory) {
  const outputRoot = path.join(root, OUTPUT_RELATIVE_ROOT);
  invariant(isPathInside(outputRoot, directory, {allowRoot: false}), "Diagnostic output escaped the controlled lesson Ruffle root");
  await mkdir(directory, {recursive: true});
  const resolved = await realpath(directory);
  invariant(resolved === directory, "Diagnostic output path traverses a symbolic link");
}

async function assertReplaceableOutput(filePath) {
  try {
    const information = await lstat(filePath);
    invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1, `Refusing to overwrite unsafe diagnostic output: ${filePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeJsonOutput(filePath, value) {
  await assertReplaceableOutput(filePath);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runOneProbe(browser, plan, run, networkingBoundary, probeBinding) {
  await ensureControlledOutputDirectory(plan.root, run.output);
  const screenshotPath = path.join(run.output, "diagnostic-stage.png");
  const reportPath = path.join(run.output, "diagnostic.json");
  await assertReplaceableOutput(screenshotPath);
  const context = await browser.newContext({
    viewport: DIAGNOSTIC_VIEWPORT,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
  });
  const guard = await installPlaywrightNetworkGuard(context, {
    expectedOrigin: plan.baseUrl,
    pageUrl: run.pageUrl,
    sourceUrl: run.sourceUrl,
  });
  const page = await context.newPage();
  const responses = [];
  const consoleMessages = [];
  const pageErrors = [];
  page.on("response", (response) => {
    responses.push({
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
      disposition: requestDisposition(response.url(), response.request().method(), {
        expectedOrigin: plan.baseUrl,
        pageUrl: run.pageUrl,
        sourceUrl: run.sourceUrl,
      }).kind,
    });
  });
  page.on("console", (message) => consoleMessages.push({type: message.type(), text: message.text()}));
  page.on("pageerror", (error) => pageErrors.push(error.message));

  let sourceResponseOutcomePromise;
  try {
    sourceResponseOutcomePromise = waitForSourceResponseSettled(page, run.sourceUrl, plan.timeoutMs);
    const navigation = await page.goto(run.pageUrl, {waitUntil: "domcontentloaded", timeout: plan.timeoutMs});
    invariant(navigation?.status() === 200, `${run.animationId}/${run.language}: reference page returned HTTP ${navigation?.status() ?? "no response"}`);
    const sourceResponse = unwrapSourceResponseOutcome(await sourceResponseOutcomePromise);
    const sourceDiagnostic = await validatePlaywrightSourceResponse(sourceResponse, run.source);
    const forensicText = run.language === "es" ? "Ruffle es una referencia forense" : "Ruffle is a forensic reference";
    await page.getByText(forensicText, {exact: false}).waitFor({state: "visible", timeout: plan.timeoutMs});
    const stage = page.locator(".reference-stage");
    await stage.waitFor({state: "visible", timeout: plan.timeoutMs});
    await page.locator("ruffle-player").waitFor({state: "attached", timeout: plan.timeoutMs});
    await page.locator('.reference-stage[aria-busy="false"]').waitFor({state: "attached", timeout: plan.timeoutMs});
    await stage.evaluate((element, dimensions) => {
      element.style.width = `${dimensions.width}px`;
      element.style.height = `${dimensions.height}px`;
      element.style.maxWidth = "none";
      element.style.aspectRatio = "auto";
      element.style.boxSizing = "content-box";
    }, run.stage);
    if (plan.settleMs > 0) await page.waitForTimeout(plan.settleMs);
    const playerState = await page.locator("ruffle-player").evaluate((player) => {
      const shadow = player.shadowRoot;
      const canvases = shadow
        ? [...shadow.querySelectorAll("canvas")].map((canvas) => ({width: canvas.width, height: canvas.height}))
        : [];
      return {
        tagName: player.tagName.toLowerCase(),
        shadowRootVisibleToProbe: Boolean(shadow),
        canvasCount: canvases.length,
        canvases,
        ariaLabel: player.getAttribute("aria-label"),
      };
    });
    const host = page.locator(".reference-player-host");
    const player = page.locator("ruffle-player");
    let box = await host.boundingBox();
    invariant(box, `${run.animationId}/${run.language}: reference host has no bounding box`);
    const requiredViewportHeight = Math.ceil(box.y + box.height + 100);
    if (requiredViewportHeight > DIAGNOSTIC_VIEWPORT.height) {
      invariant(requiredViewportHeight <= 3_000, `${run.animationId}/${run.language}: reference host cannot be contained in the diagnostic viewport without scrolling`);
      await page.setViewportSize({width: DIAGNOSTIC_VIEWPORT.width, height: requiredViewportHeight});
      box = await host.boundingBox();
      invariant(box, `${run.animationId}/${run.language}: reference host disappeared after viewport expansion`);
    }
    const [stageBox, playerBox, siteHeaderBox, viewportState] = await Promise.all([
      stage.boundingBox(),
      player.boundingBox(),
      page.locator(".site-header").count().then((count) => count ? page.locator(".site-header").boundingBox() : null),
      page.evaluate(() => ({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      })),
    ]);
    invariant(stageBox && playerBox, `${run.animationId}/${run.language}: stage or Ruffle-player geometry is unavailable`);
    invariant(viewportState.scrollX === 0 && viewportState.scrollY === 0, `${run.animationId}/${run.language}: diagnostic page scrolled before capture`);
    invariant(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewportState.innerWidth && box.y + box.height <= viewportState.innerHeight, `${run.animationId}/${run.language}: reference host is not fully visible in the no-scroll diagnostic viewport`);
    const headerBottom = siteHeaderBox ? siteHeaderBox.y + siteHeaderBox.height : 0;
    invariant(box.y >= headerBottom, `${run.animationId}/${run.language}: sticky site header overlaps the Ruffle capture rectangle`);
    invariant(Math.abs(box.width - run.stage.width) <= 0.05, `${run.animationId}/${run.language}: host width drifted from native stage ${run.stage.width} to ${box.width}`);
    invariant(Math.abs(box.height - run.stage.height) <= 0.05, `${run.animationId}/${run.language}: host height drifted from native stage ${run.stage.height} to ${box.height}`);
    invariant(Math.abs(playerBox.x - box.x) <= 0.05 && Math.abs(playerBox.y - box.y) <= 0.05, `${run.animationId}/${run.language}: Ruffle player origin drifted from the host`);
    invariant(Math.abs(playerBox.width - box.width) <= 0.05 && Math.abs(playerBox.height - box.height) <= 0.05, `${run.animationId}/${run.language}: Ruffle player dimensions drifted from the host`);
    const geometry = {
      viewport: viewportState,
      stage: stageBox,
      host: box,
      player: playerBox,
      stickySiteHeader: siteHeaderBox,
      stickyHeaderBottom: headerBottom,
      hostFullyVisibleWithoutScroll: true,
      stickyHeaderOverlap: false,
      captureRectangleRole: "reference-player-host-only",
    };
    const rasterWidth = Math.ceil(run.stage.width);
    const rasterHeight = Math.ceil(run.stage.height);
    await page.screenshot({
      path: screenshotPath,
      animations: "disabled",
      caret: "hide",
      clip: {
        x: Math.floor(box.x),
        y: Math.floor(box.y),
        width: rasterWidth,
        height: rasterHeight,
      },
    });
    invariant(guard.requests.some((request) => request.url === run.sourceUrl && request.method === "GET" && request.allowed), `${run.animationId}/${run.language}: Ruffle did not request the exact SWF API URL`);
    invariant(guard.requests.some((request) => request.url === `${plan.baseUrl}/api/ruffle/ruffle.js` && request.method === "GET" && request.allowed), `${run.animationId}/${run.language}: page did not request the local Ruffle loader`);

    const screenshotBytes = await readFile(screenshotPath);
    const png = PNG.sync.read(screenshotBytes);
    invariant(png.width === rasterWidth && png.height === rasterHeight, `${run.animationId}/${run.language}: diagnostic PNG dimensions drifted`);
    const result = {
      schemaVersion: 1,
      reportType: "lesson-release-ruffle-local-route-load-diagnostic",
      generatedAt: new Date().toISOString(),
      releaseId: plan.releaseId,
      releaseOrdinal: run.ordinal,
      animationId: run.animationId,
      assetId: run.assetId,
      releaseRole: run.releaseRole,
      language: run.language,
      baseUrl: plan.baseUrl,
      pageUrl: run.pageUrl,
      sourceUrl: run.sourceUrl,
      status: guard.blockedRequests.length || guard.blockedWebSockets.length
        ? "passed-forensic-route-load-with-blocked-network-attempts"
        : "passed-forensic-route-load",
      probe: probeBinding,
      exactReleaseBinding: {
        lessonReleases: plan.catalogs.lessonReleases,
        animations: plan.catalogs.animations,
        workspace: run.workspace,
        manifest: run.manifest,
        machineAudit: run.machineAudit,
        source: run.source,
        nativeStage: run.stage,
        physicalSourceHashPathBytesAndStageVerifiedBeforeBrowser: true,
      },
      sourceDiagnostic,
      pageDiagnostic: {
        status: navigation.status(),
        forensicOnlyBoundaryVisible: true,
        ruffleLoadPromiseResolved: true,
        playerState,
        fixedDelayAfterLoadMs: plan.settleMs,
        nativeSourceStage: run.stage,
        rasterDiagnosticDimensions: {width: rasterWidth, height: rasterHeight},
        geometry,
        exactSourceFrameObserved: null,
        deterministicFrameSelectionSupported: false,
        scenarioSelectionSupported: false,
        languageFlashVarSelectionSupported: false,
        languageBoundary: "The language value selects only the localized reference route. It does not prove a SWF language state, FlashVar, bilingual behavior, or audio cue binding.",
      },
      networkDiagnostic: {
        enforcement: "real-playwright-browser-context-route-interception",
        expectedOrigin: plan.baseUrl,
        allowlist: [
          "exact reference page GET",
          "exact hash-bound SWF API GET",
          "same-origin /_next GET",
          "same-origin /api/ruffle GET",
        ],
        everyOtherHttpRequestAbortedAndRecorded: true,
        everyWebSocketAbortedAndRecorded: true,
        blockedRequestsReachedServer: false,
        requests: guard.requests,
        blockedRequests: guard.blockedRequests,
        blockedWebSockets: guard.blockedWebSockets,
        responses,
      },
      ruffleNetworkingBoundary: networkingBoundary,
      browserDiagnostic: {
        product: "Playwright Chromium",
        version: browser.version(),
        viewport: {...geometry.viewport, deviceScaleFactor: 1},
        consoleMessages,
        pageErrors,
        messagesAreRecordedDiagnosticsNotAcceptance: true,
      },
      screenshot: {
        path: portableFrom(plan.root, screenshotPath),
        bytes: screenshotBytes.length,
        sha256: sha256(screenshotBytes),
        width: png.width,
        height: png.height,
        role: "nondeterministic-natural-playback-route-load-diagnostic-only",
        sourceFrameBinding: null,
        requirementTraceEntryStateBinding: null,
      },
      acceptance: {
        acceptanceNeutral: true,
        strictAcceptanceEffect: false,
        statement: "This is a forensic-only Ruffle route-load diagnostic. It proves the exact release/workspace/source binding checked here, exact local SWF API response bytes, localized route loading, enforced browser request containment, and a native-stage-sized nondeterministic PNG after a fixed delay. It is not an authoritative original-runtime baseline, deterministic frame evidence, full-frame/RMSE evidence, bilingual or audio proof, interaction causality, human or owner review, current-JavaScript implementation, fidelity, strict completion, or publication readiness.",
      },
    };
    await writeJsonOutput(reportPath, result);
    return {result, reportPath};
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    normalized.diagnosticContext = {
      networkDiagnostic: {
        enforcement: "real-playwright-browser-context-route-interception",
        requests: guard.requests,
        blockedRequests: guard.blockedRequests,
        blockedWebSockets: guard.blockedWebSockets,
        blockedRequestsReachedServer: false,
      },
      responses,
      consoleMessages,
      pageErrors,
    };
    throw normalized;
  } finally {
    await context.close();
    if (sourceResponseOutcomePromise) await sourceResponseOutcomePromise;
  }
}

export async function runReleaseProbeBatch(options) {
  const plan = await buildReleaseProbePlan(options);
  const [networkingBoundary, probeFile] = await Promise.all([
    readPinnedRuffleNetworkingBoundary({root: plan.root}),
    readPhysicalFile(scriptPath, "lesson-release Ruffle diagnostic tool", {containmentRoot: plan.root}),
  ]);
  const probeBinding = {
    path: portableFrom(plan.root, probeFile.absolute),
    bytes: probeFile.size,
    sha256: probeFile.sha256,
  };
  await ensureControlledOutputDirectory(plan.root, plan.releaseOutputRoot);
  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const run of plan.runs) {
      try {
        const completed = await runOneProbe(browser, plan, run, networkingBoundary, probeBinding);
        results.push({
          ordinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: completed.result.status,
          report: portableFrom(plan.root, completed.reportPath),
        });
      } catch (error) {
        await ensureControlledOutputDirectory(plan.root, run.output);
        const failurePath = path.join(run.output, "diagnostic-failure.json");
        await writeJsonOutput(failurePath, {
          schemaVersion: 1,
          reportType: "lesson-release-ruffle-local-route-load-diagnostic-failure",
          generatedAt: new Date().toISOString(),
          releaseId: plan.releaseId,
          releaseOrdinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: "failed-closed",
          error: error instanceof Error ? error.message : String(error),
          probe: probeBinding,
          diagnosticContext: error instanceof Error && error.diagnosticContext
            ? error.diagnosticContext
            : null,
          acceptance: {
            acceptanceNeutral: true,
            strictAcceptanceEffect: false,
          },
        });
        results.push({
          ordinal: run.ordinal,
          animationId: run.animationId,
          language: run.language,
          status: "failed-closed",
          report: portableFrom(plan.root, failurePath),
        });
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => result.status === "failed-closed");
  const batchPath = path.join(plan.releaseOutputRoot, "batch-diagnostic.json");
  const batch = {
    schemaVersion: 1,
    reportType: "lesson-release-ruffle-local-route-load-diagnostic-batch",
    generatedAt: new Date().toISOString(),
    release: plan.release,
    languages: plan.languages,
    baseUrl: plan.baseUrl,
    catalogs: plan.catalogs,
    probe: probeBinding,
    runCount: results.length,
    passedCount: results.length - failures.length,
    failedCount: failures.length,
    runs: results,
    ruffleNetworkingBoundary: networkingBoundary,
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: false,
      statement: "Every run in this batch is a forensic-only, acceptance-neutral Ruffle route-load diagnostic. The batch cannot create original-runtime authority, fidelity, audio acceptance, human review, owner review, strict completion, or lesson publication.",
    },
  };
  await writeJsonOutput(batchPath, batch);
  if (failures.length) {
    const error = new Error(`${failures.length}/${results.length} Ruffle diagnostic run(s) failed closed; see ${portableFrom(plan.root, batchPath)}`);
    error.batch = batch;
    throw error;
  }
  return {plan, batch, batchPath};
}

function usage() {
  return `Usage: node scripts/probe-lesson-release-ruffle-reference.mjs --release-id <id> --base-url <loopback-origin> [options]\n\nOptions:\n  --release-id <id>             Exact atomic lesson release (required)\n  --id <animation-id>           Exact release-member subset; repeatable\n  --base-url <origin>           Plain-HTTP loopback origin (required)\n  --lang <en|es|both>           Localized route(s), default: both\n  --settle-ms <milliseconds>    Fixed post-load diagnostic delay, default: ${DEFAULT_SETTLE_MS}\n  --timeout-ms <milliseconds>   Per-navigation/load timeout, default: ${DEFAULT_TIMEOUT_MS}\n  --lesson-releases <file>      Release catalog, default: catalog/lesson-releases.json\n  --animations <file>           Animation catalog, default: catalog/animations.json\n  --migrations <directory>      Migration root, default: migrations\n  --help                        Show this help\n\nOutputs are restricted to output/playwright/lesson-ruffle-reference-diagnostics/<release-id>/. IDs are always executed in release ordinal order. Ruffle remains a forensic, nondeterministic, acceptance-neutral reference; this tool does not produce authoritative original-runtime or strict fidelity evidence.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const {batch, batchPath} = await runReleaseProbeBatch(options);
  console.log(`PASS ${batch.passedCount}/${batch.runCount}: ${portableFrom(projectRoot, batchPath)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
