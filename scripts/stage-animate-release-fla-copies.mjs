#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const RELEASE_OUTPUT_BASE = path.join(ROOT, "work", "animate", "release-read-only-fla-copies");
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const OLE_COMPOUND_HEADER = "d0cf11e0a1b11ae1";
const ZIP_HEADERS = new Set(["504b0304", "504b0506", "504b0708"]);
const PROTECTED_RELEASE_EXPECTATIONS = new Map([
  ["lesson-g04-l10-perimeter-area", Object.freeze({members: 47, activePages: 46, shells: 1, pairedFla: 34, swfOnly: 13})],
  ["lesson-g05-l04-number-lines", Object.freeze({members: 55, activePages: 54, shells: 1, pairedFla: 44, swfOnly: 11})],
  ["lesson-g05-l05-add-subtract-negative-numbers", Object.freeze({members: 57, activePages: 56, shells: 1, pairedFla: 49, swfOnly: 8})],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `Path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function rejectSymlinkComponents(base, candidate, label) {
  const resolvedBase = path.resolve(base);
  const resolvedCandidate = path.resolve(candidate);
  invariant(resolvedCandidate === resolvedBase || isInside(resolvedBase, resolvedCandidate),
    `${label} escapes ${resolvedBase}`);
  let cursor = resolvedBase;
  const relative = path.relative(resolvedBase, resolvedCandidate);
  for (const component of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, component);
    const information = await lstat(cursor).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (information) invariant(!information.isSymbolicLink(), `${label} contains a symbolic-link path component: ${cursor}`);
  }
}

async function regularFileIdentity(file, label) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  invariant(information.nlink === 1, `${label} must have exactly one hard link`);
  const bytes = await readFile(file);
  return {
    information,
    bytes,
    binding: {
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: (information.mode & 0o777).toString(8).padStart(4, "0"),
    },
  };
}

async function boundProjectFile(root, relativePath, label) {
  invariant(typeof relativePath === "string" && !path.isAbsolute(relativePath), `${label} path must be project-relative`);
  const file = path.resolve(root, relativePath);
  invariant(isInside(root, file), `${label} escapes the project root`);
  await rejectSymlinkComponents(root, file, label);
  const identity = await regularFileIdentity(file, label);
  return {
    file,
    bytes: identity.bytes,
    information: identity.information,
    binding: {file: relativePath.split(path.sep).join("/"), ...identity.binding},
  };
}

function parseSourceManifest(bytes) {
  const entries = new Map();
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/u).entries()) {
    if (!line) continue;
    const match = /^([0-9a-f]{64})  (.+)$/u.exec(line);
    invariant(match, `source manifest line ${index + 1} is malformed`);
    invariant(!entries.has(match[2]), `source manifest contains a duplicate path: ${match[2]}`);
    entries.set(match[2], match[1]);
  }
  return entries;
}

function verifyDeclaredIdentity(actual, declared, label) {
  invariant(declared && SHA256_PATTERN.test(declared.sha256 || ""), `${label} has no valid SHA-256 binding`);
  invariant(Number.isSafeInteger(declared.bytes) && declared.bytes > 0, `${label} has no valid byte binding`);
  invariant(actual.binding.sha256 === declared.sha256, `${label} SHA-256 is stale`);
  invariant(actual.binding.bytes === declared.bytes, `${label} byte length is stale`);
}

async function verifyCanonicalSource({root, sourceRealRoot, sourceManifest, relativePath, declared, extension, label}) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath), `${label} path must be archive-relative`);
  invariant(path.extname(relativePath).toLowerCase() === extension, `${label} has the wrong extension`);
  const projectRelative = `${SOURCE_PREFIX}/${relativePath}`;
  const file = path.resolve(root, projectRelative);
  invariant(isInside(path.join(root, SOURCE_PREFIX), file), `${label} escapes the canonical source archive`);
  await rejectSymlinkComponents(root, file, label);
  const real = await realpath(file);
  invariant(isInside(sourceRealRoot, real), `${label} resolves outside the canonical source archive`);
  const identity = await regularFileIdentity(file, label);
  verifyDeclaredIdentity(identity, declared, label);
  invariant(sourceManifest.get(relativePath) === identity.binding.sha256, `${label} source-freeze binding is missing or stale`);
  if (extension === ".swf") {
    invariant(["FWS", "CWS", "ZWS"].includes(identity.bytes.subarray(0, 3).toString("ascii")), `${label} has no valid SWF signature`);
  }
  let flaContainer = null;
  if (extension === ".fla") {
    const header8 = identity.bytes.subarray(0, 8).toString("hex");
    const header4 = identity.bytes.subarray(0, 4).toString("hex");
    flaContainer = header8 === OLE_COMPOUND_HEADER ? "legacy-ole-compound" : ZIP_HEADERS.has(header4) ? "zip-based-fla" : null;
    invariant(flaContainer, `${label} has an unrecognized FLA container`);
  }
  return {
    file,
    information: identity.information,
    bytes: identity.bytes,
    binding: {
      file: projectRelative,
      sha256: identity.binding.sha256,
      bytes: identity.binding.bytes,
      sourceFreezeManifestPath: relativePath,
      sourceFreezeBound: true,
      ...(flaContainer ? {flaContainer} : {}),
    },
  };
}

function selectedRelease({releaseDocument, releaseId, shardId}) {
  invariant(releaseDocument.schemaVersion === 1 && Array.isArray(releaseDocument.releases), "unsupported lesson-release catalog");
  const matches = releaseDocument.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, matches.length ? `duplicate releaseId: ${releaseId}` : `unknown releaseId: ${releaseId}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: release must be atomic`);
  invariant(Array.isArray(release.members) && release.members.length === release.expectedCounts?.members,
    `${releaseId}: release membership is incomplete`);
  invariant(Array.isArray(release.shards) && release.shards.length === release.expectedCounts?.shards,
    `${releaseId}: release shard declaration is incomplete`);
  const ids = new Set();
  const assets = new Set();
  for (const [index, member] of release.members.entries()) {
    invariant(member.ordinal === index + 1, `${releaseId}: member ordinals are not continuous`);
    invariant(ID_PATTERN.test(member.animationId || ""), `${releaseId}: invalid animationId at ordinal ${index + 1}`);
    invariant(!ids.has(member.animationId), `${releaseId}: duplicate animationId ${member.animationId}`);
    invariant(/^swf-[0-9a-f]{64}$/u.test(member.assetId || ""), `${member.animationId}: invalid assetId`);
    invariant(!assets.has(member.assetId), `${releaseId}: duplicate assetId ${member.assetId}`);
    invariant(["active-xml-referenced-page", "course-shell"].includes(member.releaseRole), `${member.animationId}: invalid releaseRole`);
    invariant(ID_PATTERN.test(member.shardId || ""), `${member.animationId}: invalid shardId`);
    ids.add(member.animationId);
    assets.add(member.assetId);
  }
  for (const shard of release.shards) {
    invariant(ID_PATTERN.test(shard.shardId || ""), `${releaseId}: invalid shard definition`);
    const count = release.members.filter((member) => member.shardId === shard.shardId).length;
    invariant(count === shard.memberCount, `${releaseId}: ${shard.shardId} member count is stale`);
  }
  if (shardId) invariant(release.shards.some((shard) => shard.shardId === shardId), `${releaseId}: unknown shardId ${shardId}`);
  return {
    release,
    members: shardId ? release.members.filter((member) => member.shardId === shardId) : release.members,
  };
}

function bindCatalogItems({release, members, animationDocument, shardId}) {
  invariant(animationDocument.schemaVersion === 1 && Array.isArray(animationDocument.animations), "unsupported animation catalog");
  const animations = new Map();
  for (const animation of animationDocument.animations) {
    invariant(!animations.has(animation.animationId), `animation catalog has duplicate animationId: ${animation.animationId}`);
    animations.set(animation.animationId, animation);
  }
  const allReleaseItems = release.members.map((member) => {
    const animation = animations.get(member.animationId);
    invariant(animation, `${member.animationId}: missing from animation catalog`);
    invariant(animation.assetId === member.assetId, `${member.animationId}: release/catalog assetId mismatch`);
    invariant(animation.source?.sha256 === member.source?.sha256 && animation.source?.path === member.source?.path,
      `${member.animationId}: release/catalog SWF binding mismatch`);
    invariant(member.assetId === `swf-${animation.source.sha256}`, `${member.animationId}: assetId is not bound to the SWF hash`);
    invariant(animation.classification?.collection === "course" &&
      animation.classification?.grade === release.grade &&
      animation.classification?.lesson === release.lesson,
    `${member.animationId}: catalog classification escapes the release scope`);
    const shell = member.releaseRole === "course-shell";
    invariant(Boolean(animation.flags?.shell) === shell, `${member.animationId}: shell role differs from catalog flags`);
    const pairedFla = animation.pairedFla?.path ? animation.pairedFla : null;
    return {member, animation, pairedFla};
  });
  const expected = PROTECTED_RELEASE_EXPECTATIONS.get(release.releaseId);
  if (expected) {
    const paired = allReleaseItems.filter((item) => item.pairedFla).length;
    invariant(release.expectedCounts?.members === expected.members &&
      release.expectedCounts?.activeXmlReferencedPages === expected.activePages &&
      release.expectedCounts?.courseShells === expected.shells,
    `${release.releaseId}: protected release cardinality drifted`);
    invariant(paired === expected.pairedFla && allReleaseItems.length - paired === expected.swfOnly,
      `${release.releaseId}: protected FLA/SWF disposition drifted`);
  }
  const selectedIds = new Set(members.map((member) => member.animationId));
  const selected = allReleaseItems.filter((item) => selectedIds.has(item.member.animationId));
  invariant(selected.length === members.length, `${release.releaseId}: selected release membership is incomplete`);
  if (shardId) invariant(selected.every((item) => item.member.shardId === shardId), `${release.releaseId}: cross-shard member selected`);
  return selected;
}

async function verifyWorkspace({root, item}) {
  const relativePath = `migrations/${item.member.animationId}/migration.json`;
  const document = await boundProjectFile(root, relativePath, `${item.member.animationId}: migration workspace manifest`);
  const migration = JSON.parse(document.bytes.toString("utf8"));
  const expectedSwf = `${SOURCE_PREFIX}/${item.animation.source.path}`;
  invariant(migration.schemaVersion === 2 &&
    migration.id === item.member.animationId &&
    migration.animationId === item.member.animationId &&
    migration.assetId === item.member.assetId,
  `${item.member.animationId}: workspace identity differs from the release`);
  invariant(migration.source?.placementPath === expectedSwf &&
    migration.source?.swf === expectedSwf &&
    migration.source?.swfSha256 === item.animation.source.sha256,
  `${item.member.animationId}: workspace SWF binding differs from the catalog`);
  if (item.pairedFla) {
    const expectedFla = `${SOURCE_PREFIX}/${item.pairedFla.path}`;
    invariant(migration.source?.fla === expectedFla &&
      migration.source?.flaSha256 === item.pairedFla.sha256 &&
      migration.source?.pairedFlaStatus === "present",
    `${item.member.animationId}: workspace FLA binding differs from the catalog`);
  } else {
    invariant(migration.source?.fla === "" && migration.source?.flaSha256 === "" && migration.source?.pairedFlaStatus === "missing",
      `${item.member.animationId}: workspace must retain an explicit no-FLA disposition`);
  }
  return document.binding;
}

async function stageWorkingCopy({root, outputRoot, item, sourceFla, check}) {
  const destination = path.join(outputRoot, "files", item.member.animationId, path.basename(sourceFla.file));
  await rejectSymlinkComponents(outputRoot, destination, `${item.member.animationId}: FLA working copy`);
  if (!(await exists(destination))) {
    invariant(!check, `${item.member.animationId}: FLA working copy is missing`);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(sourceFla.file, destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }
  const working = await regularFileIdentity(destination, `${item.member.animationId}: FLA working copy`);
  invariant((working.information.mode & 0o777) === 0o444, `${item.member.animationId}: FLA working copy mode is not exactly 0444`);
  invariant(!(working.information.dev === sourceFla.information.dev && working.information.ino === sourceFla.information.ino),
    `${item.member.animationId}: FLA working copy aliases the source inode`);
  invariant(working.binding.sha256 === sourceFla.binding.sha256 && working.binding.bytes === sourceFla.binding.bytes,
    `${item.member.animationId}: FLA working copy differs from the source`);
  return {
    file: portable(root, destination),
    sha256: working.binding.sha256,
    bytes: working.binding.bytes,
    mode: "0444",
    readOnly: true,
    byteIdenticalToSource: true,
    separateRegularFile: true,
  };
}

async function assertSafeOutputRoot(root, outputRoot) {
  const base = path.join(root, "work", "animate", "release-read-only-fla-copies");
  invariant(isInside(base, outputRoot), `output root must be a release-specific child of ${base}`);
  await rejectSymlinkComponents(root, outputRoot, "release staging output root");
  if (await exists(outputRoot)) {
    const information = await lstat(outputRoot);
    invariant(information.isDirectory() && !information.isSymbolicLink(), "release staging output root must be a real directory");
    const [realBase, realOutput] = await Promise.all([realpath(base), realpath(outputRoot)]);
    invariant(isInside(realBase, realOutput), "release staging output root resolves outside the release staging base");
  }
}

async function writeOnceOrCheck(file, bytes, {check, label}) {
  await rejectSymlinkComponents(path.dirname(path.dirname(path.dirname(file))), file, label);
  if (check) {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} is stale`);
  } else if (await exists(file)) {
    const existing = await readFile(file);
    invariant(existing.equals(bytes), `${label} already exists with different bytes`);
  } else {
    await mkdir(path.dirname(file), {recursive: true});
    await writeFile(file, bytes, {flag: "wx"});
    await chmod(file, 0o444);
  }
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
    `${label} must be a separate regular file`);
  invariant((information.mode & 0o777) === 0o444, `${label} mode is not exactly 0444`);
}

export async function stageAnimateReleaseFlaCopies({
  root = ROOT,
  releaseId,
  shardId = null,
  outputRoot = null,
  check = false,
} = {}) {
  invariant(ID_PATTERN.test(releaseId || ""), "--release-id must be a safe release ID");
  invariant(shardId == null || ID_PATTERN.test(shardId), "--shard-id must be a safe shard ID");
  const effectiveOutputRoot = outputRoot ?? path.join(
    root,
    "work",
    "animate",
    "release-read-only-fla-copies",
    releaseId,
    shardId ?? "all",
  );
  await assertSafeOutputRoot(root, effectiveOutputRoot);
  if (!check) await mkdir(effectiveOutputRoot, {recursive: true});

  const [releaseCatalog, animationCatalog, sourceFreezeManifest, generator] = await Promise.all([
    boundProjectFile(root, "catalog/lesson-releases.json", "lesson-release catalog"),
    boundProjectFile(root, "catalog/animations.json", "animation catalog"),
    boundProjectFile(root, "catalog/source-manifest.sha256", "source-freeze manifest"),
    boundProjectFile(root, "scripts/stage-animate-release-fla-copies.mjs", "release FLA staging generator"),
  ]);
  const releaseDocument = JSON.parse(releaseCatalog.bytes.toString("utf8"));
  const animationDocument = JSON.parse(animationCatalog.bytes.toString("utf8"));
  const selection = selectedRelease({releaseDocument, releaseId, shardId});
  const items = bindCatalogItems({
    release: selection.release,
    members: selection.members,
    animationDocument,
    shardId,
  });
  const sourceManifest = parseSourceManifest(sourceFreezeManifest.bytes);
  const sourceRealRoot = await realpath(path.join(root, SOURCE_PREFIX));
  const entries = [];
  const noFlaDispositions = [];

  for (const item of items) {
    const [workspace, sourceSwf] = await Promise.all([
      verifyWorkspace({root, item}),
      verifyCanonicalSource({
        root,
        sourceRealRoot,
        sourceManifest,
        relativePath: item.animation.source.path,
        declared: item.animation.source,
        extension: ".swf",
        label: `${item.member.animationId}: source SWF`,
      }),
    ]);
    if (!item.pairedFla) {
      noFlaDispositions.push(Object.freeze({
        releaseOrdinal: item.member.ordinal,
        animationId: item.member.animationId,
        assetId: item.member.assetId,
        releaseRole: item.member.releaseRole,
        shardId: item.member.shardId,
        sourceSwf: sourceSwf.binding,
        workspaceManifest: workspace,
        disposition: "swf-only-no-fla-in-catalog-or-workspace",
        authoringAuditApplicability: "not-applicable-no-fla-source",
        inferredAuthoringStructureAllowed: false,
        strictAcceptanceEffect: false,
      }));
      continue;
    }
    const sourceFla = await verifyCanonicalSource({
      root,
      sourceRealRoot,
      sourceManifest,
      relativePath: item.pairedFla.path,
      declared: item.pairedFla,
      extension: ".fla",
      label: `${item.member.animationId}: source FLA`,
    });
    const workingCopy = await stageWorkingCopy({
      root,
      outputRoot: effectiveOutputRoot,
      item,
      sourceFla,
      check,
    });
    entries.push(Object.freeze({
      releaseOrdinal: item.member.ordinal,
      animationId: item.member.animationId,
      assetId: item.member.assetId,
      releaseRole: item.member.releaseRole,
      shardId: item.member.shardId,
      sourceFla: sourceFla.binding,
      sourceSwf: sourceSwf.binding,
      workspaceManifest: workspace,
      workingCopy,
      animateAuthoringAudit: Object.freeze({
        status: "not-run",
        guiLaunchedByThisPreparation: false,
        dialogInteractionByThisPreparation: false,
        acceptanceEffect: false,
      }),
    }));
  }

  const manifest = Object.freeze({
    schemaVersion: 1,
    evidenceKind: "lesson-release-adobe-animate-prepare-only-fla-staging",
    release: Object.freeze({
      releaseId,
      grade: selection.release.grade,
      lesson: selection.release.lesson,
      titleDisplay: selection.release.titleDisplay,
      publicationMode: selection.release.publicationMode,
      shardId,
      selectedMemberCount: items.length,
      fullReleaseMemberCount: selection.release.expectedCounts.members,
    }),
    scope: "Byte-identical read-only FLA working copies, paired SWF bindings, workspace bindings, and explicit SWF-only dispositions; no GUI execution or acceptance authority",
    inputs: Object.freeze({
      lessonReleases: releaseCatalog.binding,
      animations: animationCatalog.binding,
      sourceFreezeManifest: sourceFreezeManifest.binding,
      generator: generator.binding,
    }),
    safetyContract: Object.freeze({
      prepareOnly: true,
      animateGuiLaunchAllowed: false,
      dialogInteractionAllowed: false,
      savePublishExportAllowed: false,
      sourceAssetWritesAllowed: false,
      migrationWorkspaceWritesAllowed: false,
      catalogOrLedgerWritesAllowed: false,
      reviewApprovalOrStrictWritesAllowed: false,
    }),
    summary: Object.freeze({
      selectedMembers: items.length,
      flaBackedItems: entries.length,
      swfOnlyItems: noFlaDispositions.length,
      copiesReady: entries.length,
      allCopiesReadOnly: entries.every((entry) => entry.workingCopy.readOnly),
      allCopiesByteIdentical: entries.every((entry) => entry.workingCopy.byteIdenticalToSource),
      allSourcesFreezeBound: [...entries, ...noFlaDispositions].every((entry) =>
        entry.sourceSwf.sourceFreezeBound && (!entry.sourceFla || entry.sourceFla.sourceFreezeBound)),
      allWorkspacesHashBound: [...entries, ...noFlaDispositions].every((entry) => SHA256_PATTERN.test(entry.workspaceManifest.sha256)),
      animateGuiExecutions: 0,
      dialogInteractions: 0,
      authoringAuditsCompleted: 0,
      migrationOrAcceptanceWrites: 0,
      strictAcceptanceEffect: false,
    }),
    entries: Object.freeze(entries),
    noFlaDispositions: Object.freeze(noFlaDispositions),
  });
  invariant(manifest.summary.flaBackedItems + manifest.summary.swfOnlyItems === manifest.summary.selectedMembers,
    "release FLA/SWF disposition count is inconsistent");
  const manifestBytes = Buffer.from(stableJson(manifest));
  const manifestSha256 = sha256(manifestBytes);
  const manifestFile = path.join(effectiveOutputRoot, "manifests", "sha256", `${manifestSha256}.json`);
  await writeOnceOrCheck(manifestFile, manifestBytes, {check, label: "release staging manifest"});

  const operatorQueue = Object.freeze({
    schemaVersion: 1,
    evidenceKind: "lesson-release-adobe-animate-prepare-only-operator-queue",
    release: manifest.release,
    stagingManifest: Object.freeze({
      file: portable(root, manifestFile),
      sha256: manifestSha256,
      bytes: manifestBytes.length,
      address: `sha256:${manifestSha256}`,
    }),
    authorityBoundary: Object.freeze({
      workingCopiesPrepared: true,
      animateAuthoringAudit: false,
      originalRuntimeEvidence: false,
      javascriptCandidate: false,
      humanOrOwnerReview: false,
      strictCompletion: false,
      publication: false,
    }),
    safety: Object.freeze({
      executableCommands: Object.freeze([]),
      animateGuiLaunches: 0,
      dialogInteractions: 0,
      operatorIdentityCollected: false,
      sourceOrWorkspaceWrites: 0,
    }),
    summary: Object.freeze({
      preparedFlaItems: entries.length,
      noFlaDispositions: noFlaDispositions.length,
      pendingAuthoringAudits: entries.length,
      authoringAuditsCompleted: 0,
      strictAcceptanceEffect: false,
    }),
    queue: Object.freeze(entries.map((entry, index) => Object.freeze({
      queueOrdinal: index + 1,
      releaseOrdinal: entry.releaseOrdinal,
      animationId: entry.animationId,
      shardId: entry.shardId,
      sourceFla: entry.sourceFla,
      sourceSwf: entry.sourceSwf,
      workspaceManifest: entry.workspaceManifest,
      workingCopy: entry.workingCopy,
      status: "prepared-only-authoring-audit-not-run",
      actionAuthorizedByThisQueue: "hash-and-read-only-verification-only",
    }))),
    noFlaDispositions: manifest.noFlaDispositions,
  });
  const queueBytes = Buffer.from(stableJson(operatorQueue));
  const queueSha256 = sha256(queueBytes);
  const queueFile = path.join(effectiveOutputRoot, "operator-queues", "sha256", `${queueSha256}.json`);
  await writeOnceOrCheck(queueFile, queueBytes, {check, label: "release prepare-only operator queue"});

  return {
    manifest,
    manifestFile,
    manifestSha256,
    operatorQueue,
    queueFile,
    queueSha256,
    outputRoot: effectiveOutputRoot,
  };
}

export function parseArguments(argv) {
  const options = {check: false, releaseId: null, shardId: null, outputRoot: null};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--release-id") options.releaseId = argv[++index] || invariant(false, "--release-id requires a value");
    else if (value === "--shard-id") options.shardId = argv[++index] || invariant(false, "--shard-id requires a value");
    else if (value === "--output") options.outputRoot = path.resolve(argv[++index] || invariant(false, "--output requires a path"));
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(options.help || options.releaseId, "--release-id is required");
  invariant(options.releaseId || !options.shardId, "--shard-id requires --release-id");
  return options;
}

function help() {
  return [
    "Usage: node scripts/stage-animate-release-fla-copies.mjs --release-id <id> [options]",
    "",
    "Stages exact release-catalog FLA sources as byte-identical 0444 work-only copies,",
    "binds their shipped SWFs and migration workspaces, records SWF-only dispositions,",
    "and writes content-addressed preparation manifests. This command never launches Animate.",
    "",
    "Options:",
    "  --release-id <id>   Exact catalog/lesson-releases.json releaseId",
    "  --shard-id <id>     Optional exact release shard",
    "  --output <dir>      Release-specific child under work/animate/release-read-only-fla-copies/",
    "  --check             Verify sources, workspaces, copies, manifest, and queue without writing",
    "  -h, --help          Show this help",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await stageAnimateReleaseFlaCopies(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "prepared",
    releaseId: result.manifest.release.releaseId,
    shardId: result.manifest.release.shardId,
    summary: result.manifest.summary,
    manifest: {file: portable(ROOT, result.manifestFile), sha256: result.manifestSha256},
    operatorQueue: {file: portable(ROOT, result.queueFile), sha256: result.queueSha256},
    animateLaunched: false,
    dialogInteraction: false,
    authoringAuditCompleted: false,
    strictAcceptanceEffect: false,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
