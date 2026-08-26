#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, lstat, mkdir, open, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";
const SESSION_PATTERN = /^ts006-(en|es)-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;
const CANDIDATE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,191}\.pending-candidate\.json$/u;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const RECEIPT_NAME = "receipt.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isInside(parent, candidate, allowEqual = false) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return (allowEqual && relative === "") || (
    relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
  );
}

async function statIfPresent(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertNoSymlinkComponents(root, candidate, label, {allowMissingTail = false} = {}) {
  const rootAbsolute = path.resolve(root);
  const candidateAbsolute = path.resolve(candidate);
  invariant(isInside(rootAbsolute, candidateAbsolute, true), `${label}: path escapes its allowed root`);
  const relative = path.relative(rootAbsolute, candidateAbsolute);
  let cursor = rootAbsolute;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const metadata = await statIfPresent(cursor);
    if (!metadata) {
      invariant(allowMissingTail, `${label}: path component is missing`);
      return;
    }
    invariant(!metadata.isSymbolicLink(), `${label}: path contains a symbolic-link component`);
  }
}

function normalizeProjectRelative(value, label) {
  invariant(typeof value === "string" && value.length > 0, `${label}: path is required`);
  invariant(!path.isAbsolute(value), `${label}: absolute paths are not allowed`);
  invariant(!value.includes("\\") && !value.includes("\0"), `${label}: path contains a forbidden character`);
  const normalized = path.posix.normalize(value);
  invariant(normalized === value && normalized !== "." && normalized !== ".." && !normalized.startsWith("../"), `${label}: path is not a normalized project-relative path`);
  return value;
}

function validateDescriptor(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label}: binding must be an object`);
  const originalPath = normalizeProjectRelative(value.path, `${label}.path`);
  invariant(Number.isInteger(value.bytes) && value.bytes >= 0, `${label}.bytes is invalid`);
  invariant(HASH_PATTERN.test(value.sha256 || ""), `${label}.sha256 is invalid`);
  return {originalPath, bytes: value.bytes, sha256: value.sha256};
}

async function readRegular(root, candidate, label) {
  await assertNoSymlinkComponents(root, candidate, label);
  const before = await lstat(candidate, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `${label}: expected one regular, non-symlink, single-link file`);
  const bytes = await readFile(candidate);
  const after = await lstat(candidate, {bigint: true});
  invariant(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n, `${label}: file type or link count changed while reading`);
  invariant(
    before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mtimeNs === after.mtimeNs,
    `${label}: file identity changed while reading`,
  );
  return {absolutePath: candidate, bytes, byteLength: bytes.length, sha256: sha256(bytes)};
}

async function readJsonRegular(root, candidate, label) {
  const artifact = await readRegular(root, candidate, label);
  let value;
  try {
    value = JSON.parse(artifact.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  return {...artifact, value};
}

async function resolveProjectBinding(projectRoot, descriptor, label) {
  const validated = validateDescriptor({
    path: descriptor.path ?? descriptor.originalPath,
    bytes: descriptor.bytes,
    sha256: descriptor.sha256,
  }, label);
  const absolutePath = path.resolve(projectRoot, validated.originalPath);
  invariant(isInside(projectRoot, absolutePath), `${label}: path escapes the project root`);
  const artifact = await readRegular(projectRoot, absolutePath, label);
  invariant(artifact.byteLength === validated.bytes, `${label}: byte length drifted`);
  invariant(artifact.sha256 === validated.sha256, `${label}: SHA-256 drifted`);
  return {...validated, absolutePath, content: artifact.bytes};
}

function collectWholeFileBindings(value, pointer = "sessionKit.sourceBindings", output = []) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${pointer}: expected an object`);
  for (const key of Object.keys(value).sort()) {
    const child = value[key];
    const childPointer = `${pointer}.${key}`;
    invariant(child && typeof child === "object" && !Array.isArray(child), `${childPointer}: expected a binding object`);
    if (Object.hasOwn(child, "path")) {
      output.push({role: childPointer, descriptor: validateDescriptor(child, childPointer)});
    } else {
      collectWholeFileBindings(child, childPointer, output);
    }
  }
  return output;
}

function frozenDependencyPath(sessionRoot, originalPath) {
  return path.join(sessionRoot, "evidence", "frozen-bindings", "files", ...originalPath.split("/"));
}

function frozenCandidatePath(sessionRoot, candidateName) {
  return path.join(sessionRoot, "evidence", "frozen-bindings", "candidates", candidateName);
}

function receiptPath(sessionRoot) {
  return path.join(sessionRoot, "evidence", "frozen-bindings", RECEIPT_NAME);
}

function addCopy(copyMap, {originalPath, frozenPath, bytes, sha256: digest, role, content}) {
  const existing = copyMap.get(originalPath);
  if (existing) {
    invariant(existing.bytes === bytes && existing.sha256 === digest, `${originalPath}: conflicting binding descriptors`);
    invariant(existing.frozenPath === frozenPath, `${originalPath}: conflicting frozen destinations`);
    existing.roles.add(role);
    if (content) {
      invariant(!existing.content || existing.content.equals(content), `${originalPath}: conflicting source bytes`);
      existing.content ||= content;
    }
    return existing;
  }
  const entry = {originalPath, frozenPath, bytes, sha256: digest, roles: new Set([role]), content: content || null};
  copyMap.set(originalPath, entry);
  return entry;
}

async function discoverCandidates(projectRoot, sessionRoot, sessionId) {
  const directory = path.join(sessionRoot, "evidence", "pending-candidates");
  await assertNoSymlinkComponents(projectRoot, directory, `${sessionId} pending-candidate directory`);
  const metadata = await lstat(directory, {bigint: true});
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink(), `${sessionId}: pending-candidates must be a real directory`);
  const entries = await readdir(directory, {withFileTypes: true});
  const matching = entries.filter(({name}) => name.endsWith(".pending-candidate.json"));
  invariant(matching.length > 0, `${sessionId}: no pending-candidate JSON files were found`);
  invariant(matching.every((entry) => CANDIDATE_PATTERN.test(entry.name)), `${sessionId}: pending-candidate filename is unsafe`);
  invariant(matching.every((entry) => entry.isFile() && !entry.isSymbolicLink()), `${sessionId}: pending-candidate must be a regular non-symlink file`);
  return matching.map(({name}) => ({name, absolutePath: path.join(directory, name)})).sort((left, right) => left.name.localeCompare(right.name));
}

function candidateReferences(value, label) {
  invariant(value?.sourceBindings && typeof value.sourceBindings === "object", `${label}: sourceBindings are missing`);
  const references = [
    {bindingType: "session-kit", ...validateDescriptor(value.sourceBindings.sessionKit, `${label}.sourceBindings.sessionKit`)},
    {bindingType: "trace-spec-index", ...validateDescriptor(value.sourceBindings.traceSpecIndex, `${label}.sourceBindings.traceSpecIndex`)},
  ];
  invariant(Array.isArray(value.sourceBindings.traceSpecifications) && value.sourceBindings.traceSpecifications.length > 0, `${label}: traceSpecifications are missing`);
  for (const [index, specification] of value.sourceBindings.traceSpecifications.entries()) {
    invariant(typeof specification?.requirementId === "string" && specification.requirementId.length > 0, `${label}: traceSpecifications[${index}].requirementId is missing`);
    invariant(typeof specification?.traceId === "string" && specification.traceId.length > 0, `${label}: traceSpecifications[${index}].traceId is missing`);
    references.push({
      bindingType: "trace-specification",
      requirementId: specification.requirementId,
      traceId: specification.traceId,
      ...validateDescriptor(specification.traceSpec, `${label}.sourceBindings.traceSpecifications[${index}].traceSpec`),
    });
  }
  return references;
}

async function loadCandidateRoots(projectRoot, sessionRoot, sessionId, language) {
  const discovered = await discoverCandidates(projectRoot, sessionRoot, sessionId);
  const candidates = [];
  for (const candidate of discovered) {
    const artifact = await readJsonRegular(projectRoot, candidate.absolutePath, `${sessionId}/${candidate.name}`);
    invariant(artifact.value?.animationId === ANIMATION_ID, `${candidate.name}: animationId is not ${ANIMATION_ID}`);
    invariant(artifact.value?.sessionId === sessionId, `${candidate.name}: sessionId does not match its directory`);
    invariant(artifact.value?.language === language, `${candidate.name}: language does not match its session`);
    invariant(typeof artifact.value?.status === "string" && artifact.value.status.startsWith("pending-candidate"), `${candidate.name}: status is not pending-candidate`);
    const originalPath = portable(path.relative(projectRoot, candidate.absolutePath));
    candidates.push({
      name: candidate.name,
      originalPath,
      frozenPath: portable(path.relative(projectRoot, frozenCandidatePath(sessionRoot, candidate.name))),
      bytes: artifact.byteLength,
      sha256: artifact.sha256,
      references: candidateReferences(artifact.value, candidate.name),
      value: artifact.value,
      content: artifact.bytes,
    });
  }
  return candidates;
}

function relativeFrozenForOriginal(projectRoot, sessionRoot, originalPath) {
  return portable(path.relative(projectRoot, frozenDependencyPath(sessionRoot, originalPath)));
}

async function buildCreationPlan(projectRoot, sessionRoot, sessionId, language) {
  const candidates = await loadCandidateRoots(projectRoot, sessionRoot, sessionId, language);
  const copies = new Map();
  for (const candidate of candidates) {
    addCopy(copies, {
      originalPath: candidate.originalPath,
      frozenPath: candidate.frozenPath,
      bytes: candidate.bytes,
      sha256: candidate.sha256,
      role: `candidate:${candidate.name}`,
      content: candidate.content,
    });
    for (const reference of candidate.references) {
      const source = await resolveProjectBinding(projectRoot, reference, `${candidate.name}/${reference.bindingType}`);
      addCopy(copies, {
        originalPath: source.originalPath,
        frozenPath: relativeFrozenForOriginal(projectRoot, sessionRoot, source.originalPath),
        bytes: source.bytes,
        sha256: source.sha256,
        role: `candidate:${candidate.name}:${reference.bindingType}${reference.requirementId ? `:${reference.requirementId}` : ""}`,
        content: source.content,
      });
    }
  }

  const kitDescriptors = new Map();
  for (const candidate of candidates) {
    const kitReference = candidate.references.find(({bindingType}) => bindingType === "session-kit");
    const kitKey = kitReference.originalPath;
    if (kitDescriptors.has(kitKey)) continue;
    const kitArtifact = await resolveProjectBinding(projectRoot, kitReference, `${candidate.name}/session-kit`);
    let kit;
    try {
      kit = JSON.parse(kitArtifact.content.toString("utf8"));
    } catch (error) {
      throw new Error(`${kitReference.originalPath}: invalid session-kit JSON (${error.message})`);
    }
    invariant(kit?.animationId === ANIMATION_ID && kit?.language === language, `${kitReference.originalPath}: session-kit identity does not match the session`);
    invariant(kit?.sourceBindings && typeof kit.sourceBindings === "object", `${kitReference.originalPath}: sourceBindings are missing`);
    for (const required of ["scheduleCandidate", "sessionProtocol", "coverage"]) {
      invariant(Object.hasOwn(kit.sourceBindings, required), `${kitReference.originalPath}: sourceBindings.${required} is missing`);
    }
    kitDescriptors.set(kitKey, {kit, kitArtifact});
  }

  for (const [kitPath, {kit}] of kitDescriptors) {
    for (const binding of collectWholeFileBindings(kit.sourceBindings)) {
      const source = await resolveProjectBinding(projectRoot, binding.descriptor, `${kitPath}/${binding.role}`);
      addCopy(copies, {
        originalPath: source.originalPath,
        frozenPath: relativeFrozenForOriginal(projectRoot, sessionRoot, source.originalPath),
        bytes: source.bytes,
        sha256: source.sha256,
        role: `${kitPath}:${binding.role}`,
        content: source.content,
      });
    }
  }
  return {candidates, copies};
}

function publicCandidate(candidate) {
  return {
    originalPath: candidate.originalPath,
    frozenPath: candidate.frozenPath,
    bytes: candidate.bytes,
    sha256: candidate.sha256,
    references: candidate.references.map(({bindingType, requirementId, traceId, originalPath, bytes, sha256: digest}) => ({
      bindingType,
      ...(requirementId ? {requirementId, traceId} : {}),
      originalPath,
      bytes,
      sha256: digest,
    })),
  };
}

function publicCopy(entry) {
  return {
    originalPath: entry.originalPath,
    frozenPath: entry.frozenPath,
    bytes: entry.bytes,
    sha256: entry.sha256,
    referencedBy: [...entry.roles].sort(),
  };
}

function makeReceipt({sessionId, language, candidates, copies}) {
  const candidateRows = candidates.map(publicCandidate);
  const copiedBindings = [...copies.values()].map(publicCopy).sort((left, right) => left.originalPath.localeCompare(right.originalPath));
  const bindingSetSha256 = sha256(Buffer.from(stableJson({candidates: candidateRows, copiedBindings}), "utf8"));
  return {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-frozen-bindings",
    status: "immutable-frozen-binding-receipt",
    animationId: ANIMATION_ID,
    sessionId,
    language,
    authority: "machine-integrity preservation only",
    authorityBoundary: "This receipt preserves the byte identity of pending candidates and their trace/session-kit dependency chain. It does not establish natural-trace execution, original-runtime baseline authority, audio acceptance, human review, owner acceptance, strict completion, or release eligibility.",
    strictAcceptanceEffect: false,
    candidates: candidateRows,
    copiedBindings,
    integrity: {
      sourceFilesVerifiedBeforeFreeze: true,
      noReplaceWrite: true,
      regularNonSymlinkSingleLinkSourcesRequired: true,
      frozenFilesMode: "0444",
      bindingSetAlgorithm: "sha256(stable-json({candidates,copiedBindings}))",
      bindingSetSha256,
    },
  };
}

async function writeExclusive(file, bytes) {
  const handle = await open(file, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL, 0o444);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(file, 0o444);
}

async function materialize(projectRoot, sessionRoot, plan, receipt) {
  const frozenRoot = path.join(sessionRoot, "evidence", "frozen-bindings");
  await assertNoSymlinkComponents(projectRoot, path.dirname(frozenRoot), "frozen-bindings parent");
  await mkdir(frozenRoot, {recursive: false, mode: 0o755});
  for (const entry of [...plan.copies.values()].sort((left, right) => left.frozenPath.localeCompare(right.frozenPath))) {
    invariant(entry.content, `${entry.originalPath}: source bytes were not loaded`);
    const destination = path.resolve(projectRoot, entry.frozenPath);
    invariant(isInside(frozenRoot, destination), `${entry.originalPath}: frozen destination escapes frozen-bindings`);
    await assertNoSymlinkComponents(frozenRoot, destination, `${entry.originalPath} frozen destination`, {allowMissingTail: true});
    await mkdir(path.dirname(destination), {recursive: true, mode: 0o755});
    const sourceTemp = entry.content;
    await writeExclusive(destination, sourceTemp);
    const frozen = await readRegular(frozenRoot, destination, `${entry.originalPath} frozen copy`);
    invariant(frozen.byteLength === entry.bytes && frozen.sha256 === entry.sha256, `${entry.originalPath}: frozen copy verification failed`);
  }
  const encoded = Buffer.from(pretty(receipt), "utf8");
  await writeExclusive(receiptPath(sessionRoot), encoded);
  return {receiptBytes: encoded.length, receiptSha256: sha256(encoded)};
}

async function checkFrozen(projectRoot, sessionRoot, sessionId, language) {
  const frozenRoot = path.join(sessionRoot, "evidence", "frozen-bindings");
  await assertNoSymlinkComponents(projectRoot, frozenRoot, `${sessionId} frozen-bindings`);
  const receiptArtifact = await readJsonRegular(frozenRoot, receiptPath(sessionRoot), `${sessionId} frozen receipt`);
  const receipt = receiptArtifact.value;
  invariant(receipt?.sessionId === sessionId && receipt?.language === language && receipt?.animationId === ANIMATION_ID, `${sessionId}: frozen receipt identity is invalid`);
  invariant(receipt?.status === "immutable-frozen-binding-receipt" && receipt?.strictAcceptanceEffect === false, `${sessionId}: frozen receipt status or authority boundary is invalid`);

  const candidates = await loadCandidateRoots(projectRoot, sessionRoot, sessionId, language);
  const copies = new Map();
  for (const candidate of candidates) {
    addCopy(copies, {
      originalPath: candidate.originalPath,
      frozenPath: candidate.frozenPath,
      bytes: candidate.bytes,
      sha256: candidate.sha256,
      role: `candidate:${candidate.name}`,
    });
    for (const reference of candidate.references) {
      addCopy(copies, {
        originalPath: reference.originalPath,
        frozenPath: relativeFrozenForOriginal(projectRoot, sessionRoot, reference.originalPath),
        bytes: reference.bytes,
        sha256: reference.sha256,
        role: `candidate:${candidate.name}:${reference.bindingType}${reference.requirementId ? `:${reference.requirementId}` : ""}`,
      });
    }
  }

  const seenKits = new Set();
  for (const candidate of candidates) {
    const kitReference = candidate.references.find(({bindingType}) => bindingType === "session-kit");
    if (seenKits.has(kitReference.originalPath)) continue;
    seenKits.add(kitReference.originalPath);
    const frozenKitPath = frozenDependencyPath(sessionRoot, kitReference.originalPath);
    const frozenKit = await readJsonRegular(frozenRoot, frozenKitPath, `${kitReference.originalPath} frozen session-kit`);
    invariant(frozenKit.byteLength === kitReference.bytes && frozenKit.sha256 === kitReference.sha256, `${kitReference.originalPath}: frozen session-kit bytes or SHA-256 drifted`);
    invariant(frozenKit.value?.animationId === ANIMATION_ID && frozenKit.value?.language === language, `${kitReference.originalPath}: frozen session-kit identity is invalid`);
    invariant(frozenKit.value?.sourceBindings && typeof frozenKit.value.sourceBindings === "object", `${kitReference.originalPath}: frozen sourceBindings are missing`);
    for (const required of ["scheduleCandidate", "sessionProtocol", "coverage"]) {
      invariant(Object.hasOwn(frozenKit.value.sourceBindings, required), `${kitReference.originalPath}: frozen sourceBindings.${required} is missing`);
    }
    for (const binding of collectWholeFileBindings(frozenKit.value.sourceBindings)) {
      addCopy(copies, {
        originalPath: binding.descriptor.originalPath,
        frozenPath: relativeFrozenForOriginal(projectRoot, sessionRoot, binding.descriptor.originalPath),
        bytes: binding.descriptor.bytes,
        sha256: binding.descriptor.sha256,
        role: `${kitReference.originalPath}:${binding.role}`,
      });
    }
  }

  const expectedReceipt = makeReceipt({sessionId, language, candidates, copies});
  invariant(stableJson(receipt) === stableJson(expectedReceipt), `${sessionId}: receipt content is incomplete, non-deterministic, or drifted`);

  for (const entry of copies.values()) {
    const destination = path.resolve(projectRoot, entry.frozenPath);
    invariant(isInside(frozenRoot, destination), `${entry.originalPath}: frozen destination escapes frozen-bindings`);
    const frozen = await readRegular(frozenRoot, destination, `${entry.originalPath} frozen copy`);
    invariant(frozen.byteLength === entry.bytes && frozen.sha256 === entry.sha256, `${entry.originalPath}: frozen copy bytes or SHA-256 drifted`);
    const mode = Number((await lstat(destination, {bigint: true})).mode & 0o777n);
    invariant(mode === 0o444, `${entry.originalPath}: frozen copy mode is not 0444`);
  }

  const bindingSetSha256 = expectedReceipt.integrity.bindingSetSha256;
  const receiptMode = Number((await lstat(receiptPath(sessionRoot), {bigint: true})).mode & 0o777n);
  invariant(receiptMode === 0o444, `${sessionId}: receipt mode is not 0444`);
  return {
    sessionId,
    language,
    candidateCount: candidates.length,
    copiedBindingCount: receipt.copiedBindings.length,
    receipt: portable(path.relative(projectRoot, receiptPath(sessionRoot))),
    receiptBytes: receiptArtifact.byteLength,
    receiptSha256: receiptArtifact.sha256,
    bindingSetSha256,
    check: "pass",
  };
}

export async function freezePendingCandidateBindings({root = DEFAULT_PROJECT_ROOT, sessionId, check = false} = {}) {
  invariant(SESSION_PATTERN.test(sessionId || ""), `Invalid TS006 session ID: ${sessionId || "(missing)"}`);
  const language = sessionId.match(SESSION_PATTERN)[1];
  const projectRoot = await realpath(path.resolve(root));
  const artifactRoot = path.join(projectRoot, "artifacts", "full-frame", "g4-l3");
  await assertNoSymlinkComponents(projectRoot, artifactRoot, "G4 L3 artifact root");
  const sessionRoot = path.join(artifactRoot, sessionId);
  await assertNoSymlinkComponents(artifactRoot, sessionRoot, `${sessionId} session root`);
  const sessionMetadata = await lstat(sessionRoot, {bigint: true});
  invariant(sessionMetadata.isDirectory() && !sessionMetadata.isSymbolicLink(), `${sessionId}: session root must be a real directory`);
  if (check) return checkFrozen(projectRoot, sessionRoot, sessionId, language);

  const plan = await buildCreationPlan(projectRoot, sessionRoot, sessionId, language);
  const receipt = makeReceipt({sessionId, language, candidates: plan.candidates, copies: plan.copies});
  const written = await materialize(projectRoot, sessionRoot, plan, receipt);
  return {
    sessionId,
    language,
    candidateCount: plan.candidates.length,
    copiedBindingCount: plan.copies.size,
    receipt: portable(path.relative(projectRoot, receiptPath(sessionRoot))),
    ...written,
    bindingSetSha256: receipt.integrity.bindingSetSha256,
    check: "not-requested",
  };
}

function parseArguments(argv) {
  const sessions = [];
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") check = true;
    else if (argument === "--session") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--session requires a value");
      sessions.push(value);
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  invariant(sessions.length > 0, "At least one --session is required");
  invariant(new Set(sessions).size === sessions.length, "Duplicate --session values are not allowed");
  return {sessions, check};
}

async function main() {
  const {sessions, check} = parseArguments(process.argv.slice(2));
  const results = [];
  for (const sessionId of sessions) results.push(await freezePendingCandidateBindings({sessionId, check}));
  console.log(JSON.stringify({schemaVersion: 1, check, results}, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
