import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, open, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {inflateSync} from "node:zlib";
import {PNG} from "pngjs";

import {canonicalJson, safeRequirementId, sha256Text} from "../build-course-trace-specs.mjs";
import {
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "../evidence-projections.mjs";
import {
  NATURAL_TRACE_PROOF_MODE,
  naturalOperationEventSha256,
  naturalStateRecordSha256,
  naturalTargetResolutionSha256,
} from "../prepare-natural-trace-candidate.mjs";

export const ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED = false;
export const NATURAL_EVIDENCE_MEDIA_TYPES = Object.freeze({
  json: "application/json",
  jsonl: "application/x-ndjson",
  text: "text/plain",
  png: "image/png",
  swf: "application/x-shockwave-flash",
});

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const DESCRIPTOR_TYPES = new Set(["file", "path"]);
const BASE_ROLES = new Set(["seed", "archive"]);
const MEDIA_TYPES = new Set(Object.values(NATURAL_EVIDENCE_MEDIA_TYPES));
const modulePath = fileURLToPath(import.meta.url);
const FIXED_REPOSITORY_ROOT = path.resolve(path.dirname(modulePath), "../..");
const TRACE_SPEC_INDEX_RELATIVE = "migrations/course-shell-pilot-trace-spec-index.json";
const SOURCE_FREEZE_RELATIVE = "catalog/source-freeze.json";
const SOURCE_LEDGER_RELATIVE = "catalog/source-manifest.sha256";
const CANONICAL_CONTEXTS = new WeakMap();
const READ_ONLY_RESULTS = new WeakSet();

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function exactKeys(value, expected, label) {
  const observed = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(same(observed, wanted), `${label} fields must be exactly: ${wanted.join(", ")}`);
}

function normalizedRelativePath(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
  invariant(!path.isAbsolute(value) && !value.includes("\\"), `${label} must be a portable relative path`);
  const normalized = portable(path.posix.normalize(value));
  invariant(
    normalized === value && value !== "." && value !== ".." && !value.startsWith("../") && !value.startsWith("/"),
    `${label} must be normalized and cannot escape its declared base root`,
  );
  return value;
}

/**
 * A future promotion input must never infer whether a legacy `file` or `path`
 * is project-relative. The descriptor itself declares its field type, base
 * root, byte media type, and digest.
 */
export function validateNaturalEvidenceDescriptor(value, label = "evidence descriptor") {
  invariant(isPlainObject(value), `${label} must be an object`);
  invariant(DESCRIPTOR_TYPES.has(value.descriptorType), `${label}.descriptorType must be file or path`);
  const locationField = value.descriptorType;
  const otherField = value.descriptorType === "file" ? "path" : "file";
  exactKeys(value, ["descriptorType", "baseRoot", locationField, "sha256", "mediaType"], label);
  invariant(!Object.hasOwn(value, otherField), `${label} cannot mix file and path fields`);
  invariant(typeof value.baseRoot === "string" && value.baseRoot.length > 0, `${label}.baseRoot must be explicit`);
  invariant(SHA256_PATTERN.test(value.sha256), `${label}.sha256 must be lowercase SHA-256`);
  invariant(MEDIA_TYPES.has(value.mediaType), `${label}.mediaType is unsupported`);
  return Object.freeze({
    descriptorType: value.descriptorType,
    baseRoot: value.baseRoot,
    [locationField]: normalizedRelativePath(value[locationField], `${label}.${locationField}`),
    sha256: value.sha256,
    mediaType: value.mediaType,
  });
}

function descriptorLocation(descriptor) {
  return descriptor[descriptor.descriptorType];
}

function descriptorKey(descriptor) {
  return `${descriptor.baseRoot}:${descriptor.descriptorType}:${descriptorLocation(descriptor)}`;
}

function looksLikeUntypedDescriptor(value) {
  return isPlainObject(value) && typeof value.sha256 === "string" &&
    (typeof value.file === "string" || typeof value.path === "string");
}

function decodeUtf8(bytes, label) {
  try {
    return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch (error) {
    throw new Error(`${label} is not valid UTF-8: ${error.message}`);
  }
}

function decodeJson(bytes, label) {
  try {
    return JSON.parse(decodeUtf8(bytes, label));
  } catch (error) {
    if (error.message.startsWith(`${label} is not valid UTF-8`)) throw error;
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function decodeJsonLines(bytes, label) {
  const text = decodeUtf8(bytes, label);
  invariant(text.endsWith("\n"), `${label} must end with a newline`);
  const records = [];
  let byteOffset = 0;
  for (const [index, line] of text.split("\n").slice(0, -1).entries()) {
    invariant(line.trim().length > 0, `${label} line ${index + 1} must not be empty`);
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`${label} line ${index + 1} is not valid JSON: ${error.message}`);
    }
    records.push({record, byteOffset, lineNumber: index + 1});
    byteOffset += Buffer.byteLength(`${line}\n`);
  }
  invariant(records.length > 0, `${label} must contain at least one JSON record`);
  return records;
}

function validateDeclaredMedia(descriptor, bytes, label) {
  const location = descriptorLocation(descriptor);
  const extension = path.posix.extname(location).toLowerCase();
  const expectedExtensions = new Map([
    [NATURAL_EVIDENCE_MEDIA_TYPES.json, new Set([".json"])],
    [NATURAL_EVIDENCE_MEDIA_TYPES.jsonl, new Set([".jsonl", ".ndjson"])],
    [NATURAL_EVIDENCE_MEDIA_TYPES.text, new Set([".txt", ".log", ".sh", ".sb"])],
    [NATURAL_EVIDENCE_MEDIA_TYPES.png, new Set([".png"])],
    [NATURAL_EVIDENCE_MEDIA_TYPES.swf, new Set([".swf"])],
  ]);
  invariant(expectedExtensions.get(descriptor.mediaType)?.has(extension), `${label} extension does not match declared mediaType`);
  if (descriptor.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.png) {
    invariant(bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label} has no PNG signature`);
    decodePng({bytes}, label);
  } else if (descriptor.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.swf) {
    invariant(bytes.length >= 8 && ["FWS", "CWS", "ZWS"].includes(bytes.subarray(0, 3).toString("ascii")), `${label} has no SWF signature`);
    const signature = bytes.subarray(0, 3).toString("ascii");
    const declaredLength = bytes.readUInt32LE(4);
    invariant(declaredLength >= 8, `${label} has an invalid SWF declared length`);
    let uncompressed;
    if (signature === "FWS") {
      invariant(declaredLength === bytes.length, `${label} uncompressed SWF length differs from its complete bytes`);
      uncompressed = bytes;
    }
    else if (signature === "CWS") {
      let result;
      try {
        result = inflateSync(bytes.subarray(8), {info: true});
      } catch (error) {
        throw new Error(`${label} has an invalid complete CWS stream: ${error.message}`);
      }
      const decoded = result.buffer;
      invariant(result.engine?.bytesWritten === bytes.length - 8, `${label} CWS stream has trailing or unconsumed bytes`);
      invariant(decoded.length + 8 === declaredLength, `${label} decoded CWS length differs from its header`);
      uncompressed = Buffer.concat([Buffer.from("FWS"), bytes.subarray(3, 8), decoded]);
    } else {
      throw new Error(`${label} uses ZWS compression, which this fail-closed verifier does not decode`);
    }
    const nbits = uncompressed[8] >> 3;
    invariant(nbits >= 1 && nbits <= 31, `${label} has an invalid SWF RECT bit width`);
    const rectBytes = Math.ceil((5 + 4 * nbits) / 8);
    const frameHeaderOffset = 8 + rectBytes;
    invariant(uncompressed.length >= frameHeaderOffset + 4, `${label} is missing the SWF RECT/frame header`);
    const frameRateRaw = uncompressed.readUInt16LE(frameHeaderOffset);
    const frameCount = uncompressed.readUInt16LE(frameHeaderOffset + 2);
    invariant(frameRateRaw > 0 && frameCount > 0, `${label} has an invalid SWF frame rate or root frame count`);
  } else if (descriptor.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.text) {
    const text = decodeUtf8(bytes, label);
    const trimmed = text.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        throw new Error(`${label} contains JSON bytes but is declared as text/plain`);
      } catch (error) {
        if (error.message === `${label} contains JSON bytes but is declared as text/plain`) throw error;
      }
    }
    const lines = text.endsWith("\n") ? text.split("\n").slice(0, -1) : [];
    if (lines.length > 0 && lines.every((line) => {
      if (!line.trim()) return false;
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    })) throw new Error(`${label} contains JSONL bytes but is declared as text/plain`);
  }
}

function sameStableStat(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size &&
    left.mode === right.mode && left.nlink === right.nlink && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}

async function readStableRegularFileSnapshot(candidate, label, {requireImmutable = false} = {}) {
  const flags = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0);
  let handle;
  try {
    handle = await open(candidate, flags);
  } catch (error) {
    throw new Error(`${label} cannot be opened without following links: ${error.message}`);
  }
  try {
    const before = await handle.stat({bigint: true});
    invariant(before.isFile(), `${label} must be a regular file`);
    invariant(before.nlink === 1n, `${label} must have exactly one hard link`);
    if (requireImmutable) invariant((before.mode & 0o222n) === 0n, `${label} staging file must be immutable`);
    const bytes = await handle.readFile();
    const after = await handle.stat({bigint: true});
    const named = await lstat(candidate, {bigint: true});
    invariant(sameStableStat(before, after), `${label} inode/size/metadata changed while it was read`);
    invariant(sameStableStat(after, named), `${label} path identity changed while it was read`);
    invariant(BigInt(bytes.length) === after.size, `${label} bytes do not exhaust the stable file size`);
    return {bytes, info: after};
  } finally {
    await handle.close();
  }
}

async function readStableRegularFile(candidate, label, options = {}) {
  return (await readStableRegularFileSnapshot(candidate, label, options)).bytes;
}

function directorySnapshotKey(candidate) {
  return path.resolve(candidate);
}

async function captureDirectorySnapshot(candidate, label, {requireImmutable = false} = {}) {
  const info = await lstat(candidate, {bigint: true}).catch((error) => {
    throw new Error(`${label} directory is unavailable: ${error.message}`);
  });
  invariant(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a real directory`);
  if (requireImmutable) invariant((info.mode & 0o222n) === 0n, `${label} staging directory must be immutable`);
  return {candidate: path.resolve(candidate), label, info};
}

async function rememberDirectorySnapshot(collection, candidate, label, options) {
  const key = directorySnapshotKey(candidate);
  if (!collection.has(key)) collection.set(key, await captureDirectorySnapshot(candidate, label, options));
}

async function assertDirectorySnapshotsUnchanged(collection, phase) {
  for (const snapshot of collection.values()) {
    const current = await lstat(snapshot.candidate, {bigint: true}).catch((error) => {
      throw new Error(`${snapshot.label} directory disappeared ${phase}: ${error.message}`);
    });
    invariant(current.isDirectory() && !current.isSymbolicLink(), `${snapshot.label} is no longer a real directory ${phase}`);
    invariant(sameStableStat(snapshot.info, current), `${snapshot.label} directory identity changed ${phase}`);
  }
}

async function snapshotFixedAncestorChains(root, targets, label) {
  const collection = new Map();
  const fixedRoot = path.resolve(root);
  await rememberDirectorySnapshot(collection, fixedRoot, `${label} repository root`);
  for (const target of targets) {
    const resolved = path.resolve(target);
    invariant(isInside(resolved, fixedRoot), `${label} target escapes the fixed repository root`);
    const relativeDirectory = path.relative(fixedRoot, path.dirname(resolved));
    let cursor = fixedRoot;
    for (const segment of relativeDirectory.split(path.sep).filter(Boolean)) {
      cursor = path.join(cursor, segment);
      await rememberDirectorySnapshot(collection, cursor, `${label} ancestor ${portable(path.relative(fixedRoot, cursor))}`);
    }
  }
  return collection;
}

async function validateBaseRoots(baseRoots, {requireImmutableDirectories = false, directorySnapshots = new Map()} = {}) {
  invariant(isPlainObject(baseRoots) && Object.keys(baseRoots).length > 0, "baseRoots must be a non-empty object");
  const validated = new Map();
  for (const [name, definition] of Object.entries(baseRoots)) {
    invariant(/^[a-z][a-z0-9-]*$/.test(name), `base root name ${name} is invalid`);
    invariant(isPlainObject(definition), `baseRoots.${name} must be an object`);
    exactKeys(definition, ["path", "role"], `baseRoots.${name}`);
    invariant(path.isAbsolute(definition.path), `baseRoots.${name}.path must be absolute`);
    invariant(BASE_ROLES.has(definition.role), `baseRoots.${name}.role must be seed or archive`);
    const lexicalRoot = path.resolve(definition.path);
    const info = await lstat(lexicalRoot).catch((error) => {
      throw new Error(`baseRoots.${name}.path is unavailable: ${error.message}`);
    });
    invariant(info.isDirectory() && !info.isSymbolicLink(), `baseRoots.${name}.path must be a real directory`);
    if (requireImmutableDirectories) invariant((info.mode & 0o222) === 0, `baseRoots.${name}.path staging directory must be immutable`);
    await rememberDirectorySnapshot(directorySnapshots, lexicalRoot, `baseRoots.${name}.path`, {requireImmutable: requireImmutableDirectories});
    const actualRoot = await realpath(lexicalRoot);
    validated.set(name, {name, role: definition.role, lexicalRoot, actualRoot});
  }
  const roots = [...validated.values()];
  for (let left = 0; left < roots.length; left += 1) {
    for (let right = left + 1; right < roots.length; right += 1) {
      invariant(
        !isInside(roots[left].actualRoot, roots[right].actualRoot) && !isInside(roots[right].actualRoot, roots[left].actualRoot),
        `base roots ${roots[left].name} and ${roots[right].name} overlap`,
      );
    }
  }
  return validated;
}

async function resolveDescriptor(baseRoots, descriptor, label, {directorySnapshots = new Map(), requireImmutableDirectories = false} = {}) {
  const base = baseRoots.get(descriptor.baseRoot);
  invariant(base, `${label} names unknown base root ${descriptor.baseRoot}`);
  const relative = descriptorLocation(descriptor);
  const resolved = path.resolve(base.lexicalRoot, relative);
  invariant(isInside(resolved, base.lexicalRoot), `${label} escapes base root ${descriptor.baseRoot}`);
  let cursor = base.lexicalRoot;
  const segments = relative.split("/");
  for (const [index, segment] of segments.entries()) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor).catch((error) => {
      throw new Error(`${label} is unavailable: ${error.message}`);
    });
    invariant(!info.isSymbolicLink(), `${label} contains a forbidden symbolic link`);
    if (index < segments.length - 1) {
      invariant(info.isDirectory(), `${label} has a non-directory ancestor component`);
      await rememberDirectorySnapshot(directorySnapshots, cursor, `${label} ancestor`, {requireImmutable: requireImmutableDirectories});
    }
  }
  const info = await lstat(resolved);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must resolve to a regular non-symlink file`);
  const actual = await realpath(resolved);
  invariant(isInside(actual, base.actualRoot), `${label} resolves outside base root ${descriptor.baseRoot}`);
  return {base, resolved, actual};
}

function collectDescriptors(value, {add, parentKey, cursor}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDescriptors(item, {add, parentKey, cursor: `${cursor}[${index}]`}));
    return;
  }
  if (!isPlainObject(value)) return;
  if (Object.hasOwn(value, "descriptorType")) {
    add(validateNaturalEvidenceDescriptor(value, cursor), parentKey, cursor);
    return;
  }
  if (looksLikeUntypedDescriptor(value)) {
    throw new Error(`${cursor} is an untyped file/path descriptor; descriptorType and baseRoot are required`);
  }
  for (const [key, item] of Object.entries(value)) {
    collectDescriptors(item, {add, parentKey, cursor: `${cursor}.${key}`});
  }
}

export function assertAcyclicNaturalEvidenceGraph(edges, nodeKeys = null) {
  invariant(edges instanceof Map, "evidence graph edges must be a Map");
  const nodes = new Set(nodeKeys || edges.keys());
  for (const [parent, children] of edges) {
    nodes.add(parent);
    for (const child of children) nodes.add(child);
  }
  const colors = new Map();
  const stack = [];
  const visit = (node) => {
    const color = colors.get(node) || 0;
    if (color === 1) {
      const start = stack.indexOf(node);
      throw new Error(`evidence DAG contains a cycle: ${[...stack.slice(start), node].join(" -> ")}`);
    }
    if (color === 2) return;
    colors.set(node, 1);
    stack.push(node);
    for (const child of edges.get(node) || []) visit(child);
    stack.pop();
    colors.set(node, 2);
  };
  for (const node of [...nodes].sort()) visit(node);
}

async function walkArchive(base, {requireImmutable = false, directorySnapshots = new Map()} = {}) {
  const files = [];
  async function visit(directory) {
    await rememberDirectorySnapshot(directorySnapshots, directory, `archive base ${base.name} directory`, {requireImmutable});
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const candidate = path.join(directory, entry.name);
      invariant(!entry.isSymbolicLink(), `archive base ${base.name} contains forbidden symbolic link ${portable(path.relative(base.lexicalRoot, candidate))}`);
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile()) {
        const info = await lstat(candidate, {bigint: true});
        invariant(info.isFile() && info.nlink === 1n, `archive base ${base.name} file must have exactly one hard link: ${portable(path.relative(base.lexicalRoot, candidate))}`);
        if (requireImmutable) invariant((info.mode & 0o222n) === 0n, `archive base ${base.name} file must be immutable: ${portable(path.relative(base.lexicalRoot, candidate))}`);
        files.push(await realpath(candidate));
      }
      else throw new Error(`archive base ${base.name} contains unsupported filesystem entry ${portable(path.relative(base.lexicalRoot, candidate))}`);
    }
  }
  await visit(base.lexicalRoot);
  return files.sort();
}

/**
 * Read-only, content-addressed graph verifier. Seed documents may live under a
 * `seed` base; every descriptor discovered inside any JSON or JSONL node must
 * point into an `archive` base. Every regular archived file must be reachable.
 */
export async function verifyOriginalRuntimeNaturalCandidateDag({
  baseRoots,
  seeds,
  requireCompleteArchives = true,
  requireImmutableStaging = false,
} = {}) {
  const directorySnapshots = new Map();
  const roots = await validateBaseRoots(baseRoots, {
    requireImmutableDirectories: requireImmutableStaging,
    directorySnapshots,
  });
  invariant(Array.isArray(seeds) && seeds.length > 0, "seeds must contain at least one typed descriptor");
  const queue = [];
  const declarations = new Map();
  const edges = new Map();
  const add = (raw, parentKey, label) => {
    const descriptor = validateNaturalEvidenceDescriptor(raw, label);
    const key = descriptorKey(descriptor);
    const prior = declarations.get(key);
    if (prior) {
      invariant(prior.sha256 === descriptor.sha256, `${label} conflicts with another SHA-256 for ${key}`);
      invariant(prior.mediaType === descriptor.mediaType, `${label} conflicts with another mediaType for ${key}`);
      prior.roles.add(label);
    } else {
      declarations.set(key, {...descriptor, key, roles: new Set([label])});
      queue.push(key);
    }
    if (parentKey !== null) {
      const base = roots.get(descriptor.baseRoot);
      invariant(base?.role === "archive", `${label} is an unarchived dependency; recursive evidence must use an archive base root`);
      if (!edges.has(parentKey)) edges.set(parentKey, new Set());
      edges.get(parentKey).add(key);
    }
    if (!edges.has(key)) edges.set(key, new Set());
  };
  seeds.forEach((seed, index) => add(seed, null, `seeds[${index}]`));

  const verified = new Map();
  const pathOwners = new Map();
  while (queue.length > 0) {
    const key = queue.shift();
    const declaration = declarations.get(key);
    const located = await resolveDescriptor(roots, declaration, `evidence DAG node ${key}`, {
      directorySnapshots,
      requireImmutableDirectories: requireImmutableStaging,
    });
    const priorOwner = pathOwners.get(located.actual);
    invariant(!priorOwner || priorOwner === key, `evidence DAG aliases one file through different type/base identities: ${priorOwner} and ${key}`);
    pathOwners.set(located.actual, key);
    const bytes = await readStableRegularFile(located.resolved, `evidence DAG node ${key}`, {requireImmutable: requireImmutableStaging});
    const observedSha256 = digest(bytes);
    invariant(observedSha256 === declaration.sha256, `evidence DAG SHA-256 mismatch: ${key}`);
    validateDeclaredMedia(declaration, bytes, `evidence DAG node ${key}`);
    const node = {
      ...declaration,
      roles: [...declaration.roles].sort(),
      resolved: located.resolved,
      actual: located.actual,
      baseRole: located.base.role,
      bytes,
      observedSha256,
    };
    verified.set(key, node);
    if (declaration.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.json) {
      node.json = decodeJson(bytes, `evidence DAG node ${key}`);
      collectDescriptors(node.json, {add, parentKey: key, cursor: `evidence DAG node ${key}`});
    } else if (declaration.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.jsonl) {
      node.jsonl = decodeJsonLines(bytes, `evidence DAG node ${key}`);
      for (const item of node.jsonl) {
        collectDescriptors(item.record, {add, parentKey: key, cursor: `evidence DAG node ${key} line ${item.lineNumber}`});
      }
    }
  }

  assertAcyclicNaturalEvidenceGraph(edges, verified.keys());
  if (requireCompleteArchives) {
    const reachableArchivePaths = new Set([...verified.values()]
      .filter((node) => roots.get(node.baseRoot).role === "archive")
      .map((node) => node.actual));
    for (const base of roots.values()) {
      if (base.role !== "archive") continue;
      const archivedFiles = await walkArchive(base, {requireImmutable: requireImmutableStaging, directorySnapshots});
      for (const file of archivedFiles) {
        invariant(reachableArchivePaths.has(file), `archive base ${base.name} contains an unreferenced file: ${portable(path.relative(base.actualRoot, file))}`);
      }
      for (const file of reachableArchivePaths) {
        if (isInside(file, base.actualRoot)) invariant(archivedFiles.includes(file), `evidence DAG references a missing archived file: ${file}`);
      }
    }
  }
  await assertDirectorySnapshotsUnchanged(directorySnapshots, "after complete DAG verification");
  const inventory = [...verified.values()].map((node) => ({
    key: node.key,
    descriptorType: node.descriptorType,
    baseRoot: node.baseRoot,
    relativePath: descriptorLocation(node),
    mediaType: node.mediaType,
    sha256: node.sha256,
    roles: node.roles,
  })).sort((left, right) => left.key.localeCompare(right.key));
  const edgeInventory = [...edges].flatMap(([parent, children]) => [...children].map((child) => ({parent, child})))
    .sort((left, right) => `${left.parent}\0${left.child}`.localeCompare(`${right.parent}\0${right.child}`));
  return {
    promotionEnabled: ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
    strictAcceptanceEffect: false,
    authority: requireCompleteArchives ? "diagnostic-only-complete-archive" : "diagnostic-only-incomplete-archive",
    completeArchiveClosure: requireCompleteArchives === true,
    eligibleForCombinedPromotionVerification: false,
    nodes: verified,
    edges,
    inventory,
    edgeInventory,
    dagSha256: sha256Text(canonicalJson({inventory, edges: edgeInventory})),
  };
}

function rawRecords(value, label) {
  invariant(Array.isArray(value) && value.length > 0, `${label} must be a non-empty record array`);
  return value.map((item, index) => {
    const record = isPlainObject(item) && Object.hasOwn(item, "record") ? item.record : item;
    invariant(isPlainObject(record), `${label}[${index}] must be an object record`);
    return record;
  });
}

function monotonic(record, label) {
  invariant(Number.isFinite(record.monotonicTimeMs) && record.monotonicTimeMs >= 0, `${label}.monotonicTimeMs must be non-negative and finite`);
  invariant(typeof record.occurredAt === "string" && Number.isFinite(Date.parse(record.occurredAt)), `${label}.occurredAt must be an ISO-compatible timestamp`);
  return {monotonic: record.monotonicTimeMs, wall: Date.parse(record.occurredAt)};
}

function assertStrictTimeOrder(prior, current, label) {
  invariant(current.monotonic > prior.monotonic && current.wall > prior.wall, `${label} must be strictly monotonic in both session and wall time`);
}

function commonIdentity(record) {
  return {
    animationId: record.animationId,
    requirementId: record.requirementId,
    proofMode: record.proofMode,
    sessionId: record.sessionId,
    traceSpecSha256: record.traceSpecSha256,
    sourceSwfSha256: record.sourceSwfSha256,
  };
}

function assertRecordIdentity(record, expected, label) {
  invariant(same(commonIdentity(record), expected), `${label} belongs to a different trace/session/source identity`);
}

function stateContains(observed, expected) {
  if (Array.isArray(expected)) {
    return Array.isArray(observed) && observed.length === expected.length && expected.every((item, index) => stateContains(observed[index], item));
  }
  if (isPlainObject(expected)) {
    return isPlainObject(observed) && Object.entries(expected).every(([key, value]) => Object.hasOwn(observed, key) && stateContains(observed[key], value));
  }
  return Object.is(observed, expected);
}

function checkpointsForSchedule(schedule) {
  invariant(Array.isArray(schedule?.stateCheckpoints) && schedule.stateCheckpoints.length > 0, "natural schedule must declare stateCheckpoints");
  const checkpoints = new Map();
  for (const [index, checkpoint] of schedule.stateCheckpoints.entries()) {
    invariant(isPlainObject(checkpoint), `schedule stateCheckpoint ${index + 1} must be an object`);
    const id = checkpoint.id ?? checkpoint.checkpointId;
    invariant(typeof id === "string" && id.length > 0 && !checkpoints.has(id), `schedule stateCheckpoint ${index + 1} has an invalid or duplicate id`);
    invariant(isPlainObject(checkpoint.expectedState), `schedule stateCheckpoint ${id} must declare expectedState`);
    checkpoints.set(id, {...checkpoint, id});
  }
  return checkpoints;
}

function resolveStepCheckpoint(reference, checkpoints, label) {
  invariant(isPlainObject(reference), `${label} must be an object`);
  const id = reference.checkpointId ?? reference.id;
  const checkpoint = checkpoints.get(id);
  invariant(checkpoint, `${label} does not name a current schedule checkpoint`);
  if (Object.hasOwn(reference, "expectedState")) {
    invariant(same(reference.expectedState, checkpoint.expectedState), `${label} embeds stale checkpoint semantics`);
  }
  return checkpoint;
}

/**
 * Proves that each action is bracketed by the exact observed state occurrences
 * immediately before and after it. A matching local frame or semantic state is
 * insufficient: record hash, chain sequence, event position, and timestamps
 * must all name the same occurrence in this session.
 */
export function verifyOriginalRuntimeNaturalCausality({
  schedule,
  operationRecords,
  stateRecords,
  sourceTargetRecords,
  terminalResult,
} = {}) {
  invariant(schedule?.status === "source-evidenced-executable", "natural schedule must be source-evidenced-executable");
  invariant(schedule?.terminalSemantics?.status === "source-evidenced", "natural schedule terminal semantics must be source-evidenced");
  invariant(isPlainObject(schedule.terminalSemantics.expectedState), "natural schedule must declare terminal expectedState");
  const steps = schedule.orderedSteps;
  invariant(Array.isArray(steps) && steps.length > 0, "natural schedule must contain at least one ordered action");
  const checkpoints = checkpointsForSchedule(schedule);
  steps.forEach((step, index) => {
    invariant(isPlainObject(step) && step.order === index + 1, "natural schedule orderedSteps must be contiguous and one-indexed");
    invariant(isPlainObject(step.action) && isPlainObject(step.sourceTarget), `natural schedule step ${index + 1} must declare action and sourceTarget`);
    resolveStepCheckpoint(step.preStateCheckpoint, checkpoints, `natural schedule step ${index + 1} preStateCheckpoint`);
    resolveStepCheckpoint(step.postStateCheckpoint, checkpoints, `natural schedule step ${index + 1} postStateCheckpoint`);
  });

  const operations = rawRecords(operationRecords, "operationRecords");
  const states = rawRecords(stateRecords, "stateRecords");
  const targets = rawRecords(sourceTargetRecords, "sourceTargetRecords");
  invariant(targets.length === steps.length, "source-target record count must exactly match scheduled action count");
  const identity = commonIdentity(operations[0]);
  invariant(identity.proofMode === NATURAL_TRACE_PROOF_MODE, `operationRecords must use ${NATURAL_TRACE_PROOF_MODE}`);
  for (const [key, value] of Object.entries(identity)) {
    invariant(typeof value === "string" && value.length > 0, `operationRecords[0].${key} must be bound`);
  }

  const stateByHash = new Map();
  let previousStateHash = null;
  let previousStateTime = {monotonic: -Infinity, wall: -Infinity};
  for (const [index, state] of states.entries()) {
    const label = `stateRecords[${index}]`;
    assertRecordIdentity(state, identity, label);
    invariant(state.evidenceType === "attested-natural-trace-state-snapshot", `${label} has the wrong evidenceType`);
    invariant(state.sequence === index + 1, `${label}.sequence must be contiguous and one-indexed`);
    invariant(state.previousRecordSha256 === previousStateHash, `${label} breaks the state hash chain`);
    invariant(state.recordSha256 === naturalStateRecordSha256(state), `${label}.recordSha256 is invalid`);
    invariant(!stateByHash.has(state.recordSha256), `${label}.recordSha256 is reused`);
    invariant(isPlainObject(state.observedState), `${label}.observedState must be an object`);
    invariant(state.observedStateSha256 === sha256Text(canonicalJson(state.observedState)), `${label}.observedStateSha256 is invalid`);
    const time = monotonic(state, label);
    if (index > 0) assertStrictTimeOrder(previousStateTime, time, label);
    stateByHash.set(state.recordSha256, {state, index, time});
    previousStateHash = state.recordSha256;
    previousStateTime = time;
  }

  const targetByOrder = new Map();
  let previousTargetHash = null;
  let previousTargetTime = {monotonic: -Infinity, wall: -Infinity};
  for (const [index, target] of targets.entries()) {
    const label = `sourceTargetRecords[${index}]`;
    const step = steps[index];
    assertRecordIdentity(target, identity, label);
    invariant(target.evidenceType === "attested-natural-source-target-resolution", `${label} has the wrong evidenceType`);
    invariant(target.sequence === index + 1 && target.scheduleStepOrder === step.order, `${label} is not the exact scheduled target occurrence`);
    invariant(target.previousRecordSha256 === previousTargetHash, `${label} breaks the target hash chain`);
    invariant(target.recordSha256 === naturalTargetResolutionSha256(target), `${label}.recordSha256 is invalid`);
    invariant(same(target.action, step.action), `${label}.action differs from the current schedule`);
    invariant(same(target.expectedSourceTarget, step.sourceTarget) && same(target.resolvedSourceTarget, step.sourceTarget), `${label} does not resolve the exact scheduled source target`);
    invariant(target.resolution === "resolved-exactly-to-bound-source-target", `${label}.resolution is not exact`);
    const time = monotonic(target, label);
    if (index > 0) assertStrictTimeOrder(previousTargetTime, time, label);
    targetByOrder.set(step.order, {target, index, time});
    previousTargetHash = target.recordSha256;
    previousTargetTime = time;
  }

  const operationItems = [];
  let previousEventHash = null;
  let previousEventTime = {monotonic: -Infinity, wall: -Infinity};
  for (const [index, event] of operations.entries()) {
    const label = `operationRecords[${index}]`;
    assertRecordIdentity(event, identity, label);
    invariant(event.evidenceType === "attested-natural-trace-operation", `${label} has the wrong evidenceType`);
    invariant(["frame-observation", "source-action-dispatch"].includes(event.eventKind), `${label}.eventKind is unsupported`);
    invariant(event.sequence === index + 1, `${label}.sequence must be contiguous and one-indexed`);
    invariant(event.previousEventSha256 === previousEventHash, `${label} breaks the operation hash chain`);
    invariant(event.eventSha256 === naturalOperationEventSha256(event), `${label}.eventSha256 is invalid`);
    const time = monotonic(event, label);
    if (index > 0) assertStrictTimeOrder(previousEventTime, time, label);
    operationItems.push({event, index, time});
    previousEventHash = event.eventSha256;
    previousEventTime = time;
  }

  const observationByStateHash = new Map();
  for (const item of operationItems.filter(({event}) => event.eventKind === "frame-observation")) {
    const stateItem = stateByHash.get(item.event.stateSnapshotRecordSha256);
    invariant(stateItem, `frame observation sequence ${item.event.sequence} names an unknown state occurrence`);
    invariant(!observationByStateHash.has(stateItem.state.recordSha256), `state occurrence ${stateItem.state.recordSha256} is observed more than once`);
    invariant(item.event.observedLocalFrame === stateItem.state.observedLocalFrame, `frame observation sequence ${item.event.sequence} local frame differs from its state occurrence`);
    invariant(item.event.observedRootFrame === stateItem.state.observedRootFrame, `frame observation sequence ${item.event.sequence} root frame differs from its state occurrence`);
    invariant(item.event.frameDomainId === stateItem.state.frameDomainId, `frame observation sequence ${item.event.sequence} frame domain differs from its state occurrence`);
    invariant(item.event.screenshotFile === stateItem.state.screenshotFile, `frame observation sequence ${item.event.sequence} screenshot path differs from its state occurrence`);
    invariant(item.event.screenshotSha256 === stateItem.state.screenshotSha256, `frame observation sequence ${item.event.sequence} screenshot differs from its state occurrence`);
    invariant(item.time.monotonic <= stateItem.time.monotonic && item.time.wall <= stateItem.time.wall, `frame observation sequence ${item.event.sequence} occurs after its state snapshot`);
    observationByStateHash.set(stateItem.state.recordSha256, item);
  }
  invariant(observationByStateHash.size === states.length, "every state occurrence must have exactly one operation-log frame observation");
  const stateObservationOrder = operationItems
    .filter(({event}) => event.eventKind === "frame-observation")
    .map((item) => stateByHash.get(item.event.stateSnapshotRecordSha256).state.sequence);
  invariant(same(stateObservationOrder, states.map((state) => state.sequence)), "state occurrences and operation observations are not in the same exact sequence");

  const actionItems = operationItems.filter(({event}) => event.eventKind === "source-action-dispatch");
  invariant(actionItems.length === steps.length, "operation log action count must exactly match the current schedule");
  invariant(same(actionItems.map(({event}) => event.scheduleStepOrder), steps.map((step) => step.order)), "operation log actions are not in exact scheduled order");
  const verifiedActions = [];
  const usedStateOccurrences = new Set();
  const usedTargetOccurrences = new Set();
  let priorActionInterval = null;
  for (const [index, item] of actionItems.entries()) {
    const event = item.event;
    const step = steps[index];
    const preCheckpoint = resolveStepCheckpoint(step.preStateCheckpoint, checkpoints, `step ${step.order} preStateCheckpoint`);
    const postCheckpoint = resolveStepCheckpoint(step.postStateCheckpoint, checkpoints, `step ${step.order} postStateCheckpoint`);
    const preState = stateByHash.get(event.preStateSnapshotRecordSha256);
    const postState = stateByHash.get(event.postStateSnapshotRecordSha256);
    const target = targetByOrder.get(step.order);
    invariant(preState && postState, `action ${step.order} names an unknown pre/post state occurrence`);
    invariant(target && event.sourceTargetResolutionRecordSha256 === target.target.recordSha256, `action ${step.order} names the wrong source-target occurrence`);
    invariant(event.preCheckpointId === preCheckpoint.id && event.postCheckpointId === postCheckpoint.id, `action ${step.order} checkpoint IDs differ from the current schedule`);
    invariant(same(event.action, step.action) && same(event.sourceTarget, step.sourceTarget), `action ${step.order} payload/target differs from the current schedule`);
    invariant(stateContains(preState.state.observedState, preCheckpoint.expectedState), `action ${step.order} pre-state occurrence does not satisfy its checkpoint`);
    invariant(stateContains(postState.state.observedState, postCheckpoint.expectedState), `action ${step.order} post-state occurrence does not satisfy its checkpoint`);

    const priorObservation = [...operationItems.slice(0, item.index)].reverse().find(({event: prior}) => prior.eventKind === "frame-observation");
    const nextObservation = operationItems.slice(item.index + 1).find(({event: next}) => next.eventKind === "frame-observation");
    invariant(priorObservation && nextObservation, `action ${step.order} must be bracketed by observed pre/post state occurrences`);
    invariant(priorObservation.event.stateSnapshotRecordSha256 === preState.state.recordSha256, `action ${step.order} reuses an unrelated or pre-Replay pre-state occurrence`);
    invariant(nextObservation.event.stateSnapshotRecordSha256 === postState.state.recordSha256, `action ${step.order} reuses an unrelated post-state occurrence`);
    invariant(preState.state.sequence < postState.state.sequence, `action ${step.order} pre/post state sequence is not causal`);
    invariant(
      !usedStateOccurrences.has(preState.state.recordSha256) && !usedStateOccurrences.has(postState.state.recordSha256),
      `action ${step.order} reuses a pre/post occurrence already bound to another scheduled action`,
    );
    invariant(!usedTargetOccurrences.has(target.target.recordSha256), `action ${step.order} reuses a source-target occurrence`);
    if (priorActionInterval) {
      invariant(
        priorActionInterval.postOperationIndex < priorObservation.index &&
        priorActionInterval.postStateSequence < preState.state.sequence &&
        priorActionInterval.actionSequence < event.sequence,
        `action ${step.order} overlaps or fails strict occurrence progression after action ${step.order - 1}`,
      );
    }
    invariant(
      preState.time.monotonic < target.time.monotonic && target.time.monotonic <= item.time.monotonic &&
      item.time.monotonic < nextObservation.time.monotonic && nextObservation.time.monotonic <= postState.time.monotonic &&
      preState.time.wall < target.time.wall && target.time.wall <= item.time.wall &&
      item.time.wall < nextObservation.time.wall && nextObservation.time.wall <= postState.time.wall,
      `action ${step.order} is not strictly ordered between its exact pre/post state occurrences`,
    );
    usedStateOccurrences.add(preState.state.recordSha256);
    usedStateOccurrences.add(postState.state.recordSha256);
    usedTargetOccurrences.add(target.target.recordSha256);
    priorActionInterval = {
      actionSequence: event.sequence,
      postOperationIndex: nextObservation.index,
      postStateSequence: postState.state.sequence,
    };
    verifiedActions.push({
      order: step.order,
      operationSequence: event.sequence,
      operationEventSha256: event.eventSha256,
      preStateSequence: preState.state.sequence,
      preStateRecordSha256: preState.state.recordSha256,
      postStateSequence: postState.state.sequence,
      postStateRecordSha256: postState.state.recordSha256,
      sourceTargetSequence: target.target.sequence,
      sourceTargetRecordSha256: target.target.recordSha256,
    });
  }

  invariant(isPlainObject(terminalResult), "terminalResult must be an object");
  const terminalState = stateByHash.get(terminalResult.stateSnapshotRecordSha256);
  invariant(terminalState, "terminalResult names an unknown state occurrence");
  const terminalObservation = observationByStateHash.get(terminalState.state.recordSha256);
  const lastAction = actionItems.at(-1);
  const lastOperation = operationItems.at(-1);
  const lastState = states.at(-1);
  invariant(terminalState.state.recordSha256 === lastState.recordSha256, "terminalResult must bind the final state occurrence, not an earlier/pre-Replay state");
  invariant(terminalObservation?.event.eventSha256 === lastOperation.event.eventSha256, "terminalResult must bind the final operation-log observation");
  invariant(lastOperation.event.eventKind === "frame-observation", "terminal operation must be a frame observation after all actions");
  invariant(
    terminalObservation.event.sequence > lastAction.event.sequence &&
    terminalObservation.time.monotonic > lastAction.time.monotonic && terminalState.time.monotonic > lastAction.time.monotonic &&
    terminalObservation.time.wall > lastAction.time.wall && terminalState.time.wall > lastAction.time.wall,
    "terminal occurrence must be strictly after the last scheduled action",
  );
  invariant(stateContains(terminalState.state.observedState, schedule.terminalSemantics.expectedState), "terminal state occurrence does not satisfy current terminal semantics");
  if (Object.hasOwn(terminalResult, "observedStateSha256")) {
    invariant(terminalResult.observedStateSha256 === terminalState.state.observedStateSha256, "terminalResult observedStateSha256 differs from its exact state occurrence");
  }
  if (Object.hasOwn(terminalResult, "observedState")) {
    invariant(same(terminalResult.observedState, terminalState.state.observedState), "terminalResult observedState differs from its exact state occurrence");
  }
  invariant(verifiedActions.at(-1).postStateSequence <= terminalState.state.sequence, "terminal occurrence precedes the final action post-state occurrence");

  return {
    promotionEnabled: ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
    strictAcceptanceEffect: false,
    identity,
    stateCount: states.length,
    operationCount: operations.length,
    actionCount: verifiedActions.length,
    sourceTargetCount: targets.length,
    finalStateRecordSha256: previousStateHash,
    finalOperationEventSha256: previousEventHash,
    finalSourceTargetRecordSha256: previousTargetHash,
    verifiedActions,
    terminal: {
      operationSequence: terminalObservation.event.sequence,
      stateSequence: terminalState.state.sequence,
      stateRecordSha256: terminalState.state.recordSha256,
      monotonicTimeMs: terminalState.state.monotonicTimeMs,
    },
    causalitySha256: sha256Text(canonicalJson({identity, verifiedActions, terminalStateRecordSha256: terminalState.state.recordSha256})),
  };
}

function parseJsonBytes(bytes, label) {
  return decodeJson(bytes, label);
}

function fixedRepositoryPath(relative, label) {
  const normalized = normalizedRelativePath(relative, label);
  const resolved = path.resolve(FIXED_REPOSITORY_ROOT, normalized);
  invariant(isInside(resolved, FIXED_REPOSITORY_ROOT), `${label} escapes the fixed repository root`);
  return resolved;
}

async function readRememberedFile(collection, candidate, label) {
  const snapshot = await readStableRegularFileSnapshot(candidate, label);
  collection.set(path.resolve(candidate), {
    candidate: path.resolve(candidate),
    label,
    sha256: digest(snapshot.bytes),
    info: snapshot.info,
  });
  return snapshot.bytes;
}

async function assertRememberedFilesUnchanged(collection, phase) {
  for (const snapshot of collection.values()) {
    const current = await readStableRegularFileSnapshot(snapshot.candidate, snapshot.label);
    invariant(sameStableStat(snapshot.info, current.info), `${snapshot.label} inode/metadata changed ${phase}`);
    invariant(digest(current.bytes) === snapshot.sha256, `${snapshot.label} bytes changed ${phase}`);
  }
}

function mergedDirectorySnapshots(...collections) {
  const merged = new Map();
  for (const collection of collections) {
    for (const [key, snapshot] of collection) {
      const prior = merged.get(key);
      if (prior) invariant(sameStableStat(prior.info, snapshot.info), `${snapshot.label} directory identity changed while canonical paths were discovered`);
      else merged.set(key, snapshot);
    }
  }
  return merged;
}

function canonicalFileBindings(rememberedFiles) {
  return Object.freeze([...rememberedFiles.values()]
    .map((snapshot) => Object.freeze({
      path: portable(path.relative(FIXED_REPOSITORY_ROOT, snapshot.candidate)),
      sha256: snapshot.sha256,
    }))
    .sort((left, right) => left.path.localeCompare(right.path)));
}

function canonicalSnapshotProjection(value) {
  return {
    animationId: value.animationId,
    requirementId: value.requirementId,
    proofMode: value.proofMode,
    traceSpecSha256: value.traceSpecSha256,
    sourceSwfSha256: value.sourceSwfSha256,
    scheduleSha256: value.scheduleSha256,
    terminalSemanticsSha256: value.terminalSemanticsSha256,
    candidateManifestRelative: value.candidateManifestRelative,
    candidateBaseRelative: value.candidateBaseRelative,
    archiveBaseRelative: value.archiveBaseRelative,
    fileBindings: value.fileBindings,
  };
}

function assertSameCanonicalSnapshot(expected, observed, phase) {
  invariant(
    expected.canonicalSnapshotSha256 === observed.canonicalSnapshotSha256 &&
    same(expected.canonicalSnapshot, observed.canonicalSnapshot),
    `branded canonical requirement is stale or changed ${phase}`,
  );
}

async function assertCanonicalSnapshotUnchanged(snapshot, phase) {
  await assertRememberedFilesUnchanged(snapshot.rememberedFiles, phase);
  await assertDirectorySnapshotsUnchanged(snapshot.directorySnapshots, phase);
}

function sourceLedgerEntry(bytes, sourceRelative) {
  const matches = decodeUtf8(bytes, "canonical source ledger").split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
      invariant(match, "canonical source ledger contains a malformed line");
      return {sha256: match[1], path: match[2]};
    })
    .filter((item) => item.path === sourceRelative);
  invariant(matches.length === 1, "canonical source ledger must contain exactly one source SWF entry");
  return matches[0];
}

/** Loads and retains a private, re-checkable snapshot of the fixed repository. */
async function loadCurrentCanonicalNaturalRequirementSnapshot({animationId, requirementId} = {}) {
  invariant(typeof animationId === "string" && /^[a-z0-9-]+$/.test(animationId), "animationId is invalid");
  invariant(typeof requirementId === "string" && requirementId.length > 0, "requirementId is invalid");
  const workspaceRelative = `migrations/${animationId}`;
  const manifestRelative = `${workspaceRelative}/migration.json`;
  const coverageRelative = `${workspaceRelative}/evidence/full-frame-coverage.json`;
  const scenarioRelative = `${workspaceRelative}/audit/scenario-inventory.json`;
  const initialRelatives = [
    TRACE_SPEC_INDEX_RELATIVE,
    SOURCE_FREEZE_RELATIVE,
    SOURCE_LEDGER_RELATIVE,
    manifestRelative,
    coverageRelative,
    scenarioRelative,
  ];
  const initialPaths = initialRelatives.map((relative) => fixedRepositoryPath(relative, `canonical ${relative}`));
  const directorySnapshots = await snapshotFixedAncestorChains(FIXED_REPOSITORY_ROOT, initialPaths, "canonical requirement");
  const rememberedFiles = new Map();
  const [indexBytes, freezeBytes, ledgerBytes, manifestBytes, coverageBytes, scenarioBytes] = await Promise.all(
    initialPaths.map((candidate, index) => readRememberedFile(rememberedFiles, candidate, `canonical ${initialRelatives[index]}`)),
  );
  const index = parseJsonBytes(indexBytes, "canonical trace-spec index");
  const freeze = parseJsonBytes(freezeBytes, "canonical source freeze");
  const manifest = parseJsonBytes(manifestBytes, "canonical migration manifest");
  const coverage = parseJsonBytes(coverageBytes, "canonical trace coverage");
  const scenario = parseJsonBytes(scenarioBytes, "canonical scenario inventory");
  invariant(
    freeze?.schemaVersion === 1 && freeze.canonicalRoot === "source-assets/flash/HELP MATH_ORIGINAL FILES" &&
    freeze.manifest === SOURCE_LEDGER_RELATIVE && freeze.manifestSha256 === digest(ledgerBytes) &&
    freeze.readOnlyEnforced === true && freeze.writableEntriesAfterFreeze === 0,
    "canonical source freeze/ledger binding is invalid",
  );
  invariant(manifest?.animationId === animationId && manifest?.id === animationId, "canonical migration manifest identity differs");
  invariant(coverage?.animationId === animationId && scenario?.animationId === animationId, "canonical coverage/scenario identity differs");
  const pilots = (index?.pilots || []).filter((item) => item.animationId === animationId);
  invariant(pilots.length === 1, "current trace-spec index must contain exactly one matching pilot");
  const pilot = pilots[0];
  invariant(
    pilot.technicalBindings?.manifest?.sha256 === technicalManifestSha256(manifest) &&
    pilot.technicalBindings?.coverage?.sha256 === traceCoverageSha256(coverage) &&
    pilot.technicalBindings?.scenarioInventory?.sha256 === scenarioInventorySha256(scenario),
    "current trace-spec index technical bindings are stale",
  );
  const entries = (pilot.traceSpecs || []).filter((item) => item.requirementId === requirementId);
  invariant(entries.length === 1, "current trace-spec index must contain exactly one matching requirement");
  const entry = entries[0];
  invariant(
    entry.traceModel === "stateful-natural-trace" && entry.status === "source-schedule-ready-for-authoritative-execution",
    "current requirement is not a ready natural-trace specification",
  );
  const expectedTraceDirectory = `${workspaceRelative}/audit/trace-specs/`;
  invariant(entry.file.startsWith(expectedTraceDirectory), "current trace spec is outside its fixed workspace directory");
  const traceSpecPath = fixedRepositoryPath(entry.file, "canonical trace spec");
  const sourceRelative = manifest?.catalogEvidence?.catalogSourcePath;
  invariant(typeof sourceRelative === "string" && sourceRelative.length > 0, "canonical manifest catalog source path is missing");
  const sourceProjectRelative = `${freeze.canonicalRoot}/${sourceRelative}`;
  invariant(
    manifest.source?.swf === sourceProjectRelative && manifest.source?.placementPath === sourceProjectRelative &&
    manifest.source?.swfSha256 === pilot.sourceSwfSha256,
    "canonical migration/source/index SWF binding differs",
  );
  const ledgerEntry = sourceLedgerEntry(ledgerBytes, sourceRelative);
  invariant(ledgerEntry.sha256 === pilot.sourceSwfSha256, "canonical source ledger hash differs from trace-spec index");
  const sourcePath = fixedRepositoryPath(sourceProjectRelative, "canonical preserved source SWF");
  const discoveredPaths = [traceSpecPath, sourcePath];
  const discoveredSnapshots = await snapshotFixedAncestorChains(FIXED_REPOSITORY_ROOT, discoveredPaths, "canonical discovered requirement");
  const [traceSpecBytes, sourceBytes] = await Promise.all([
    readRememberedFile(rememberedFiles, traceSpecPath, "canonical trace spec"),
    readRememberedFile(rememberedFiles, sourcePath, "canonical preserved source SWF"),
  ]);
  invariant(digest(traceSpecBytes) === entry.sha256, "canonical trace spec SHA-256 differs from current index");
  invariant(digest(sourceBytes) === ledgerEntry.sha256, "canonical preserved source SWF SHA-256 differs from source ledger");
  validateDeclaredMedia({descriptorType: "file", file: sourceProjectRelative, mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.swf}, sourceBytes, "canonical preserved source SWF");
  const spec = parseJsonBytes(traceSpecBytes, "canonical trace spec");
  invariant(spec.animationId === animationId && spec.requirementId === requirementId, "canonical trace spec identity differs");
  invariant(
    spec.traceModel?.kind === "stateful-natural-trace" && spec.traceModel?.naturalPlaybackClaimed === true &&
    spec.identity?.baselineAuthorityRequirement === "original-runtime-natural-trace" &&
    spec.schedule?.status === "source-evidenced-executable" && spec.schedule?.terminalSemantics?.status === "source-evidenced",
    "canonical trace spec natural schedule is incomplete",
  );
  await assertRememberedFilesUnchanged(rememberedFiles, "during canonical requirement load");
  await assertDirectorySnapshotsUnchanged(directorySnapshots, "during canonical requirement load");
  await assertDirectorySnapshotsUnchanged(discoveredSnapshots, "during canonical requirement load");
  const safeId = safeRequirementId(requirementId);
  const fileBindings = canonicalFileBindings(rememberedFiles);
  const directorySnapshotSet = mergedDirectorySnapshots(directorySnapshots, discoveredSnapshots);
  const metadataDraft = {
    animationId,
    requirementId,
    proofMode: NATURAL_TRACE_PROOF_MODE,
    traceSpecSha256: entry.sha256,
    sourceSwfSha256: ledgerEntry.sha256,
    scheduleSha256: sha256Text(canonicalJson(spec.schedule)),
    terminalSemanticsSha256: sha256Text(canonicalJson(spec.schedule.terminalSemantics)),
    spec,
    candidateManifestRelative: `${workspaceRelative}/evidence/pending-natural-trace-capture/${safeId}/candidate-manifest.json`,
    candidateBaseRelative: `${workspaceRelative}/evidence/pending-natural-trace-capture/${safeId}`,
    archiveBaseRelative: `artifacts/full-frame/pilot-baselines/${animationId}/${safeId}/pending-human-owner-natural-trace`,
    fileBindings,
  };
  const canonicalSnapshot = Object.freeze(canonicalSnapshotProjection(metadataDraft));
  const metadata = Object.freeze({
    ...metadataDraft,
    canonicalSnapshot,
    canonicalSnapshotSha256: sha256Text(canonicalJson(canonicalSnapshot)),
    rememberedFiles,
    directorySnapshots: directorySnapshotSet,
  });
  return metadata;
}

/**
 * Loads the current canonical requirement only from this module's fixed
 * repository. The returned object is intentionally empty: its authority is a
 * module-private WeakMap brand and none of its bindings can be copied into a
 * caller-forged context.
 */
export async function loadCurrentCanonicalNaturalRequirement(options = {}) {
  const metadata = await loadCurrentCanonicalNaturalRequirementSnapshot(options);
  const context = Object.freeze(Object.create(null));
  CANONICAL_CONTEXTS.set(context, metadata);
  return context;
}

function requireDagJsonl(dag, rawDescriptor, label) {
  const descriptor = validateNaturalEvidenceDescriptor(rawDescriptor, label);
  invariant(descriptor.mediaType === NATURAL_EVIDENCE_MEDIA_TYPES.jsonl, `${label} must declare application/x-ndjson`);
  const node = dag.nodes.get(descriptorKey(descriptor));
  invariant(node && node.sha256 === descriptor.sha256, `${label} is not in the recursively verified candidate DAG`);
  invariant(node.baseRole === "archive", `${label} must be an archived DAG node`);
  invariant(Array.isArray(node.jsonl), `${label} was not decoded as JSONL`);
  return node.jsonl;
}

function requireDagNode(dag, rawDescriptor, {label, mediaType}) {
  const descriptor = validateNaturalEvidenceDescriptor(rawDescriptor, label);
  invariant(descriptor.mediaType === mediaType, `${label} must declare ${mediaType}`);
  const node = dag.nodes.get(descriptorKey(descriptor));
  invariant(node && node.sha256 === descriptor.sha256, `${label} is not in the recursively verified candidate DAG`);
  invariant(node.baseRole === "archive", `${label} must be an archived DAG node`);
  return {descriptor, node};
}

function descriptorShaMatches(descriptor, expectedSha256, label) {
  invariant(descriptor.sha256 === expectedSha256, `${label} descriptor differs from its expected canonical SHA-256 binding`);
}

function validateTraceSpecNode(spec, canonical) {
  invariant(isPlainObject(spec), "traceSpec node must contain a JSON object");
  invariant(spec.animationId === canonical.animationId && spec.requirementId === canonical.requirementId, "traceSpec identity differs from current canonical requirement");
  invariant(
    spec.traceModel?.kind === "stateful-natural-trace" && spec.traceModel?.naturalPlaybackClaimed === true &&
    spec.identity?.baselineAuthorityRequirement === "original-runtime-natural-trace",
    "traceSpec is not a current stateful original-runtime natural-trace contract",
  );
  invariant(spec.schedule?.status === "source-evidenced-executable", "traceSpec schedule is not source-evidenced-executable");
  invariant(
    sha256Text(canonicalJson(spec.schedule)) === canonical.scheduleSha256,
    "traceSpec schedule differs from the current canonical schedule",
  );
  invariant(
    sha256Text(canonicalJson(spec.schedule.terminalSemantics)) === canonical.terminalSemanticsSha256,
    "traceSpec terminal semantics differ from the current canonical terminal semantics",
  );
  invariant(
    spec.identity?.frameDomainId === spec.frameDomain?.id &&
    spec.identity?.requiredRange?.firstFrame === 1 &&
    spec.identity?.requiredRange?.lastFrame === spec.frameDomain?.frameCount,
    "traceSpec frame-domain identity/range is incomplete",
  );
  return spec;
}

function authenticatedIdentity(canonical, sessionId) {
  return {
    animationId: canonical.animationId,
    requirementId: canonical.requirementId,
    proofMode: canonical.proofMode,
    sessionId,
    traceSpecSha256: canonical.traceSpecSha256,
    sourceSwfSha256: canonical.sourceSwfSha256,
  };
}

function validateTerminalEvidence(value, {canonical}) {
  invariant(isPlainObject(value), "terminalEvidence node must contain a JSON object");
  exactKeys(value, [
    "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256",
    "sourceSwfSha256", "scheduleSha256", "terminalSemanticsSha256", "stateSnapshotRecordSha256",
    "observedState", "observedStateSha256",
  ], "terminalEvidence");
  invariant(value.schemaVersion === 1 && value.evidenceType === "attested-natural-trace-terminal-result", "terminalEvidence has the wrong schema/evidenceType");
  invariant(typeof value.sessionId === "string" && value.sessionId.length > 0, "terminalEvidence sessionId is missing");
  invariant(same(commonIdentity(value), authenticatedIdentity(canonical, value.sessionId)), "terminalEvidence identity differs from current canonical trace/source bindings");
  invariant(value.scheduleSha256 === canonical.scheduleSha256, "terminalEvidence schedule binding is stale");
  invariant(value.terminalSemanticsSha256 === canonical.terminalSemanticsSha256, "terminalEvidence terminal-semantics binding is stale");
  invariant(SHA256_PATTERN.test(value.stateSnapshotRecordSha256), "terminalEvidence stateSnapshotRecordSha256 is invalid");
  invariant(isPlainObject(value.observedState), "terminalEvidence observedState must be an object");
  invariant(value.observedStateSha256 === sha256Text(canonicalJson(value.observedState)), "terminalEvidence observedStateSha256 is invalid");
  return value;
}

function decodePng(node, label) {
  let png;
  try {
    png = PNG.sync.read(node.bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  return png;
}

function validateAuthenticatedFrameSet(value, {dag, canonical, sessionId, spec, stateRecords}) {
  invariant(isPlainObject(value), "frameSet node must contain a JSON object");
  exactKeys(value, [
    "schemaVersion", "evidenceType", "animationId", "requirementId", "proofMode", "sessionId", "traceSpecSha256",
    "sourceSwfSha256", "frameDomainId", "traceId", "entryStateSha256", "language", "seed",
    "frameCount", "frames",
  ], "frameSet");
  invariant(value.schemaVersion === 1 && value.evidenceType === "attested-natural-trace-frame-set", "frameSet has the wrong schema/evidenceType");
  invariant(same(commonIdentity(value), authenticatedIdentity(canonical, sessionId)), "frameSet identity differs from authenticated trace/source bindings");
  invariant(
    value.frameDomainId === spec.identity.frameDomainId && value.traceId === spec.identity.traceId &&
    value.entryStateSha256 === spec.identity.entryStateSha256 && value.language === spec.identity.language &&
    String(value.seed) === String(spec.identity.seed),
    "frameSet trace/domain/language/seed identity differs from traceSpec",
  );
  invariant(
    value.frameCount === spec.frameDomain.frameCount && value.frameCount === stateRecords.length &&
    Array.isArray(value.frames) && value.frames.length === value.frameCount,
    "frameSet must exhaust the authenticated trace frame domain and state log",
  );
  const usedPngNodes = new Set();
  const frames = [];
  for (const [index, frame] of value.frames.entries()) {
    const number = index + 1;
    invariant(isPlainObject(frame), `frameSet.frames[${index}] must be an object`);
    exactKeys(frame, ["frame", "stateSnapshotRecordSha256", "screenshot"], `frameSet.frames[${index}]`);
    invariant(frame.frame === number, `frameSet.frames[${index}] is not contiguous and one-indexed`);
    const state = stateRecords[index].record ?? stateRecords[index];
    invariant(frame.stateSnapshotRecordSha256 === state.recordSha256, `frameSet frame ${number} differs from the exact state occurrence`);
    invariant(
      state.frameDomainId === spec.identity.frameDomainId && state.observedLocalFrame === number &&
      state.observedRootFrame === spec.frameDomain.parentEntryFrame &&
      state.observedState?.language === spec.identity.language && String(state.observedState?.seed) === String(spec.identity.seed),
      `frameSet frame ${number} state identity differs from the authenticated traceSpec`,
    );
    const screenshot = requireDagNode(dag, frame.screenshot, {label: `frameSet frame ${number} screenshot`, mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.png});
    const screenshotKey = descriptorKey(screenshot.descriptor);
    invariant(!usedPngNodes.has(screenshotKey), `frameSet frame ${number} reuses a PNG node`);
    usedPngNodes.add(screenshotKey);
    invariant(screenshot.descriptor.sha256 === state.screenshotSha256, `frameSet frame ${number} PNG differs from its state snapshot hash`);
    invariant(
      state.screenshotFile === descriptorLocation(screenshot.descriptor),
      `frameSet frame ${number} PNG path differs from its state snapshot path`,
    );
    const png = decodePng(screenshot.node, `frameSet frame ${number} screenshot`);
    invariant(
      png.width === spec.frameDomain.nativeStage.width && png.height === spec.frameDomain.nativeStage.height,
      `frameSet frame ${number} PNG dimensions differ from the authenticated native stage`,
    );
    frames.push({frame: number, sha256: screenshot.descriptor.sha256, stateSnapshotRecordSha256: state.recordSha256, nodeKey: screenshotKey});
  }
  return frames;
}

async function reverifyDagNodesUnchanged(dag) {
  for (const node of dag.nodes.values()) {
    const bytes = await readStableRegularFile(node.resolved, `verified DAG node ${node.key}`, {requireImmutable: true});
    invariant(digest(bytes) === node.sha256, `verified DAG node ${node.key} changed after semantic validation`);
  }
}

function validateCandidateRoot(value, canonical) {
  invariant(isPlainObject(value), "candidate-manifest root must contain a JSON object");
  exactKeys(value, [
    "schemaVersion", "evidenceType", "animationId", "requirementId", "traceSpec", "sourceSwf", "frameSet",
    "operationLog", "stateSnapshots", "sourceTargetResolutions", "terminalEvidence",
  ], "candidate-manifest root");
  invariant(value.schemaVersion === 1 && value.evidenceType === "typed-natural-promotion-candidate-root", "candidate-manifest root has the wrong schema/evidenceType");
  invariant(value.animationId === canonical.animationId && value.requirementId === canonical.requirementId, "candidate-manifest root identity differs from the branded canonical requirement");
  return value;
}

/**
 * Read-only future-promotion verifier. It accepts only an opaque context minted
 * by loadCurrentCanonicalNaturalRequirement and the one fixed candidate root.
 * The return value is explicitly non-writable and cannot be consumed as a
 * canonical promotion authority.
 */
export async function verifyOriginalRuntimeNaturalPromotionCandidate(options = {}) {
  invariant(isPlainObject(options), "combined promotion verification options must be an object");
  exactKeys(options, ["canonicalRequirement", "candidateManifest"], "combined promotion verification options");
  const brandedCanonical = CANONICAL_CONTEXTS.get(options.canonicalRequirement);
  invariant(brandedCanonical, "canonicalRequirement was not minted by the fixed current canonical loader or was already consumed");
  CANONICAL_CONTEXTS.delete(options.canonicalRequirement);
  await assertCanonicalSnapshotUnchanged(brandedCanonical, "since the canonical brand was minted");
  const canonical = await loadCurrentCanonicalNaturalRequirementSnapshot({
    animationId: brandedCanonical.animationId,
    requirementId: brandedCanonical.requirementId,
  });
  assertSameCanonicalSnapshot(brandedCanonical, canonical, "before candidate verification");
  await assertCanonicalSnapshotUnchanged(brandedCanonical, "while the current canonical snapshot was reloaded");
  invariant(options.candidateManifest === canonical.candidateManifestRelative, "candidateManifest is not the unique fixed root for this canonical requirement");
  const candidateBase = fixedRepositoryPath(canonical.candidateBaseRelative, "fixed candidate staging base");
  const archiveBase = fixedRepositoryPath(canonical.archiveBaseRelative, "fixed candidate archive base");
  const candidateManifestPath = fixedRepositoryPath(canonical.candidateManifestRelative, "fixed candidate-manifest root");
  const candidateBytes = await readStableRegularFile(candidateManifestPath, "fixed candidate-manifest root", {requireImmutable: true});
  const stagingAncestorSnapshots = await snapshotFixedAncestorChains(
    FIXED_REPOSITORY_ROOT,
    [candidateManifestPath, path.join(archiveBase, ".archive-root-anchor")],
    "fixed immutable candidate staging",
  );
  const candidateDescriptor = {
    descriptorType: "file",
    baseRoot: "candidate",
    file: "candidate-manifest.json",
    sha256: digest(candidateBytes),
    mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.json,
  };
  const dag = await verifyOriginalRuntimeNaturalCandidateDag({
    baseRoots: {
      candidate: {path: candidateBase, role: "seed"},
      archive: {path: archiveBase, role: "archive"},
    },
    seeds: [candidateDescriptor],
    requireCompleteArchives: true,
    requireImmutableStaging: true,
  });
  invariant(dag.completeArchiveClosure === true && dag.eligibleForCombinedPromotionVerification === false, "internal DAG verification did not complete its archive closure");
  const candidateNode = dag.nodes.get(descriptorKey(candidateDescriptor));
  const root = validateCandidateRoot(candidateNode?.json, canonical);
  const traceSpecDocument = requireDagNode(dag, root.traceSpec, {label: "traceSpec", mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.json});
  const sourceSwfDocument = requireDagNode(dag, root.sourceSwf, {label: "sourceSwf", mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.swf});
  const frameSetDocument = requireDagNode(dag, root.frameSet, {label: "frameSet", mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.json});
  const terminalDocument = requireDagNode(dag, root.terminalEvidence, {label: "terminalEvidence", mediaType: NATURAL_EVIDENCE_MEDIA_TYPES.json});
  descriptorShaMatches(traceSpecDocument.descriptor, canonical.traceSpecSha256, "traceSpec");
  descriptorShaMatches(sourceSwfDocument.descriptor, canonical.sourceSwfSha256, "sourceSwf");
  const spec = validateTraceSpecNode(traceSpecDocument.node.json, canonical);
  const authenticatedTerminal = validateTerminalEvidence(terminalDocument.node.json, {canonical});
  const operationDescriptor = validateNaturalEvidenceDescriptor(root.operationLog, "operationLog");
  const stateDescriptor = validateNaturalEvidenceDescriptor(root.stateSnapshots, "stateSnapshots");
  const targetDescriptor = validateNaturalEvidenceDescriptor(root.sourceTargetResolutions, "sourceTargetResolutions");
  const operationRecords = requireDagJsonl(dag, operationDescriptor, "operationLog");
  const stateRecords = requireDagJsonl(dag, stateDescriptor, "stateSnapshots");
  const sourceTargetRecords = requireDagJsonl(dag, targetDescriptor, "sourceTargetResolutions");
  const authenticatedFrames = validateAuthenticatedFrameSet(frameSetDocument.node.json, {
    dag,
    canonical,
    sessionId: authenticatedTerminal.sessionId,
    spec,
    stateRecords,
  });
  const allowedPromotionNodes = new Set([
    descriptorKey(candidateDescriptor),
    descriptorKey(traceSpecDocument.descriptor),
    descriptorKey(sourceSwfDocument.descriptor),
    descriptorKey(frameSetDocument.descriptor),
    descriptorKey(terminalDocument.descriptor),
    descriptorKey(operationDescriptor),
    descriptorKey(stateDescriptor),
    descriptorKey(targetDescriptor),
    ...authenticatedFrames.map((frame) => frame.nodeKey),
  ]);
  invariant(
    dag.nodes.size === allowedPromotionNodes.size && [...dag.nodes.keys()].every((key) => allowedPromotionNodes.has(key)),
    "candidate DAG contains a node outside the strict promotion evidence-role grammar",
  );
  const causality = verifyOriginalRuntimeNaturalCausality({
    schedule: spec.schedule,
    operationRecords,
    stateRecords,
    sourceTargetRecords,
    terminalResult: authenticatedTerminal,
  });
  invariant(same(causality.identity, authenticatedIdentity(canonical, authenticatedTerminal.sessionId)), "causality logs differ from authenticated trace/source identity");
  await reverifyDagNodesUnchanged(dag);
  await assertDirectorySnapshotsUnchanged(stagingAncestorSnapshots, "after combined candidate validation");
  await assertCanonicalSnapshotUnchanged(brandedCanonical, "during combined candidate verification");
  await assertCanonicalSnapshotUnchanged(canonical, "during combined candidate verification");
  const canonicalAfter = await loadCurrentCanonicalNaturalRequirementSnapshot({
    animationId: canonical.animationId,
    requirementId: canonical.requirementId,
  });
  assertSameCanonicalSnapshot(brandedCanonical, canonicalAfter, "after candidate verification");
  assertSameCanonicalSnapshot(canonical, canonicalAfter, "during candidate verification");
  await assertCanonicalSnapshotUnchanged(brandedCanonical, "through the final canonical reload");
  await assertCanonicalSnapshotUnchanged(canonical, "through the final canonical reload");
  await assertCanonicalSnapshotUnchanged(canonicalAfter, "after the final canonical reload");
  const result = Object.freeze({
    status: "read-only-natural-promotion-verification-pass",
    authority: "diagnostic-only-not-writer-acceptable",
    promotionEnabled: ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
    promotionWritable: false,
    strictAcceptanceEffect: false,
    frameCount: authenticatedFrames.length,
    actionCount: causality.actionCount,
    verificationSha256: sha256Text(canonicalJson({
      canonicalSnapshotSha256: canonical.canonicalSnapshotSha256,
      dagSha256: dag.dagSha256,
      causalitySha256: causality.causalitySha256,
      frames: authenticatedFrames.map(({nodeKey, ...frame}) => frame),
    })),
  });
  READ_ONLY_RESULTS.add(result);
  return result;
}
