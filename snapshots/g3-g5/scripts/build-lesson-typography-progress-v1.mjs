#!/usr/bin/env node
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {readFile, writeFile, mkdir, readdir, lstat, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {startStage, endStage} from "./lib/lesson-typography-recount-timing.mjs";
import {createTypographyArtifactResolver} from "./lib/typography-artifact-delta.mjs";
import {readTextSourceAsset, validateManifestRows} from "./build-lesson-text-source-catalog-v1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORY = "catalog/typography-v1";
const INDEX_PATH = `${DIRECTORY}/source-catalog/index.json`;
const G678_ROOT = "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation";
// Reviewed source relocation is supplied by the caller.
const G678_MANIFEST = "catalog/g678-page-only-release-manifest.v1.json";
const G678_REGISTRY = "packages/demos/private-current-js-registry.json";
const SHA = /^[a-f0-9]{64}$/;
export const REQUIRED_IMPLEMENTATION_CHECKS = Object.freeze([
  "sourceBinding", "semanticText", "mathSemantics", "timingAndReplay",
  "teachingTextDisposition", "hostIntegration",
]);
export const REQUIRED_TYPOGRAPHY_CHECKS = Object.freeze([
  ...REQUIRED_IMPLEMENTATION_CHECKS,
  "responsiveTypography", "accessibility", "bilingualPolicy", "performance",
  "lifecycle", "resourceStability",
]);
export const REQUIRED_REPRESENTATIVE_ANIMATIONS = Object.freeze([
  "course-g04-l03-in-002", "course-g04-l03-in-004", "course-g04-l03-ts-008",
  "course-g03-l01-ts-008", "course-g04-l05-in-012", "course-g05-l04-fq-001",
]);
export const REPRESENTATIVE_TYPES = Object.freeze([
  "static-text", "dynamic-text", "button-states", "bitmap-content",
  "mask-filter-blend", "unresolved-glyph", "shape-content",
  "nested-timeline", "final-quiz", "practice", "vocabulary", "dense-text",
]);
const assert = (condition, message) => {if (!condition) throw new Error(message);};
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const canonical = value => JSON.stringify(value, (_key, item) =>
  item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const unique = values => [...new Set(values)].sort();
const json = value => `${JSON.stringify(value, null, 2)}\n`;

function relativePath(root, relative) {
  assert(typeof relative === "string" && relative.length > 0 &&
    !path.isAbsolute(relative) && !relative.split(/[\\/]/).includes(".."), "unsafe artifact path");
  const absolute = path.resolve(root, relative);
  assert(absolute.startsWith(`${path.resolve(root)}${path.sep}`), "artifact path escapes root");
  return absolute;
}

const sameArtifactStat = (a, b) => ["dev", "ino", "size", "mtimeMs", "ctimeMs", "mode"].every(key => a[key] === b[key]);

async function fileFacts(root, relative, cache, captureBytes = null) {
  const absolute = relativePath(root, relative);
  const key = `${path.resolve(root)}\0${absolute}`;
  const cached = cache?.get(key);
  if (cached) {
    if (cached.error) throw cached.error;
    return {...cached.facts, path: relative};
  }
  try {
    const stat = await lstat(absolute);
    assert(stat.isFile() && !stat.isSymbolicLink(), `artifact is not an ordinary file: ${relative}`);
    const [resolvedRoot, resolvedFile] = await Promise.all([realpath(root), realpath(absolute)]);
    assert(resolvedFile.startsWith(`${resolvedRoot}${path.sep}`), `artifact symlink escaped root: ${relative}`);
    const hash = createHash("sha256");
    if (captureBytes) {
      const bytes = await readFile(absolute);
      hash.update(bytes); captureBytes(bytes);
    } else {
      for await (const chunk of createReadStream(absolute)) hash.update(chunk);
    }
    const [after, resolvedAfter] = await Promise.all([lstat(absolute), realpath(absolute)]);
    assert(sameArtifactStat(after, stat) && resolvedAfter === resolvedFile,
      `artifact changed during hash read: ${relative}`);
    const facts = {path: relative, sha256: hash.digest("hex"), bytes: stat.size};
    cache?.set(key, {root, relative, stat: after, resolvedRoot, resolvedFile, facts});
    return facts;
  } catch (error) {
    cache?.set(key, {root, relative, error});
    throw error;
  }
}

async function verifyFileSnapshots(cache) {
  for (const before of cache.values()) {
    const fresh = new Map();
    try {await fileFacts(before.root, before.relative, fresh);}
    catch (error) {
      if (!before.error) throw error;
      assert(error.code === before.error.code && error.message === before.error.message,
        `artifact changed during progress audit: ${before.relative}`);
      continue;
    }
    const after = fresh.values().next().value;
    assert(!before.error && sameArtifactStat(before.stat, after.stat) &&
      before.resolvedRoot === after.resolvedRoot && before.resolvedFile === after.resolvedFile &&
      before.facts.sha256 === after.facts.sha256 && before.facts.bytes === after.facts.bytes,
      `artifact changed during progress audit: ${before.relative}`);
  }
}

async function optionalJson(root, relative, cache) {
  try {
    const facts = cache ? await fileFacts(root, relative, cache) : null;
    const bytes = await readFile(relativePath(root, relative), "utf8");
    assert(!facts || sha256(bytes) === facts.sha256, `record changed during read: ${relative}`);
    return JSON.parse(bytes);
  }
  catch (error) {if (error.code === "ENOENT") return null; throw error;}
}

async function evidenceDirectory(root, relative) {
  const absolute = relativePath(root, relative);
  try {
    const names = (await readdir(absolute)).sort();
    const [stat, resolvedRoot, resolvedDirectory] = await Promise.all([lstat(absolute), realpath(root), realpath(absolute)]);
    return {root, relative, names, stat, resolvedRoot, resolvedDirectory};
  } catch (error) {if (error.code === "ENOENT") return {root, relative, names: [], missing: true}; throw error;}
}

async function verifyEvidenceDirectories(directories) {
  for (const before of directories) {
    const after = await evidenceDirectory(before.root, before.relative);
    assert(before.missing === after.missing && canonical(before.names) === canonical(after.names) &&
      (before.missing || (sameArtifactStat(before.stat, after.stat) &&
        before.resolvedRoot === after.resolvedRoot && before.resolvedDirectory === after.resolvedDirectory)),
      `evidence directory changed during progress audit: ${before.relative}`);
  }
}

async function scanRecords(root, relative, indexOnly = false, cache, directories) {
  let names;
  if (directories) {
    const directory = await evidenceDirectory(root, relative);
    directories.push(directory); names = directory.names;
  } else {
    try {names = await readdir(path.join(root, relative));}
    catch (error) {if (error.code === "ENOENT") return []; throw error;}
  }
  const records = [];
  for (const name of names.sort()) {
    assert(name.endsWith(".json"), `unrecognized file in evidence directory: ${relative}/${name}`);
    const recordPath = `${relative}/${name}`;
    let bytes;
    const facts = await fileFacts(root, recordPath, cache, content => {bytes = content;});
    // A prior fact keeps its original snapshot; still read and compare its bytes.
    if (bytes === undefined) {
      bytes = await readFile(path.join(root, recordPath));
      assert(sha256(bytes) === facts.sha256, `record changed during read: ${recordPath}`);
    }
    const data = JSON.parse(bytes);
    records.push({path: recordPath, sha256: facts.sha256,
      data: indexOnly && data !== null && typeof data === "object"
        ? {placementId: data.placementId} : data});
  }
  return records;
}

async function* hydrateCheckRecords(root, records, factsCache, timing) {
  for (const record of records) {
    const measurement = startStage(timing, "hydrate");
    let hydratedRecord;
    try {
      const absolute = relativePath(root, record.path);
      const snapshot = factsCache.get(`${path.resolve(root)}\0${absolute}`);
      assert(snapshot && !snapshot.error && snapshot.facts.sha256 === record.sha256,
        `check record lacks matching scan facts: ${record.path}`);
      const stat = await lstat(absolute);
      assert(stat.isFile() && !stat.isSymbolicLink(), `artifact is not an ordinary file: ${record.path}`);
      const [resolvedRoot, resolvedFile] = await Promise.all([realpath(root), realpath(absolute)]);
      assert(resolvedFile.startsWith(`${resolvedRoot}${path.sep}`), `artifact symlink escaped root: ${record.path}`);
      assert(sameArtifactStat(stat, snapshot.stat) && resolvedRoot === snapshot.resolvedRoot &&
        resolvedFile === snapshot.resolvedFile, `check record changed before hydration: ${record.path}`);
      const bytes = await readFile(absolute);
      const [after, resolvedAfter] = await Promise.all([lstat(absolute), realpath(absolute)]);
      assert(sameArtifactStat(after, stat) && resolvedAfter === resolvedFile,
        `check record changed during hydration: ${record.path}`);
      assert(bytes.length === snapshot.facts.bytes && sha256(bytes) === record.sha256,
        `check record changed during hydration: ${record.path}`);
      const data = JSON.parse(bytes);
      assert(data.placementId === record.data.placementId, `check record placement changed during hydration: ${record.path}`);
      timing?.count("hydratedRecords", 1);
      timing?.count("hydratedBytes", bytes.length);
      hydratedRecord = {path: record.path, sha256: record.sha256, data};
    } finally { endStage(timing, measurement); }
    yield hydratedRecord;
  }
}

// Resolver metadata shares the scan/reference snapshot and its final fresh audit.
async function readArtifactMetadata(root, relative, factsCache) {
  let bytes;
  const facts = await fileFacts(root, relative, factsCache, content => {bytes = content;});
  if (bytes !== undefined) return bytes;
  const absolute = relativePath(root, relative);
  const snapshot = factsCache.get(`${path.resolve(root)}\0${absolute}`);
  const [stat, resolvedRoot, resolvedFile] = await Promise.all([lstat(absolute), realpath(root), realpath(absolute)]);
  assert(stat.isFile() && !stat.isSymbolicLink() && sameArtifactStat(stat, snapshot.stat) &&
    resolvedRoot === snapshot.resolvedRoot && resolvedFile === snapshot.resolvedFile,
    `artifact metadata changed before read: ${relative}`);
  bytes = await readFile(absolute);
  const [after, resolvedAfter] = await Promise.all([lstat(absolute), realpath(absolute)]);
  assert(sameArtifactStat(after, stat) && resolvedAfter === resolvedFile &&
    bytes.length === facts.bytes && sha256(bytes) === facts.sha256,
    `artifact metadata changed during read: ${relative}`);
  return bytes;
}

function artifactResolverForChecks(root, checks, factsCache) {
  const records = new Map(checks.map(record => {
    const snapshot = factsCache.get(`${path.resolve(root)}\0${relativePath(root, record.path)}`);
    assert(snapshot && !snapshot.error && snapshot.facts.sha256 === record.sha256,
      `check record lacks matching scan facts: ${record.path}`);
    return [record.path, {...snapshot.facts, path: record.path, placementId: record.data.placementId}];
  }));
  return {records, resolver: createTypographyArtifactResolver({records,
    readBytes: relative => readArtifactMetadata(root, relative, factsCache)})};
}

function recordsByPlacement(records, placements, uniquePerPlacement = false) {
  const result = new Map();
  for (const record of records) {
    const id = record.data.placementId;
    assert(placements.has(id), `unknown evidence placement: ${id}`);
    assert(!uniquePerPlacement || !result.has(id), `duplicate binding placement: ${id}`);
    result.set(id, [...(result.get(id) ?? []), record]);
  }
  return result;
}

async function inspectReferences(root, references, factsCache, timing, collectCurrent = true, referenceCache = new Map()) {
  const measurement = startStage(timing, "references");
  timing?.count("referenceLists", 1);
  timing?.count("referenceOccurrences", Array.isArray(references) ? references.length : 0);
  try {
    const current = [], diagnostics = [];
    if (!Array.isArray(references) || references.length === 0) {
      return {valid: false, current, diagnostics: ["artifact-inventory-missing"]};
    }
    const seen = new Set(), rootKey = `${path.resolve(root)}\0`;
    for (const reference of references) {
      if (!reference || typeof reference.path !== "string" || !SHA.test(reference.sha256 ?? "")) {
        diagnostics.push("invalid-artifact-reference"); continue;
      }
      if (seen.has(reference.path)) {diagnostics.push(`duplicate-artifact:${reference.path}`); continue;}
      seen.add(reference.path);
      try {
        const key = rootKey + reference.path;
        let entry = referenceCache.get(key);
        if (!entry) {
          try { entry = {facts: await fileFacts(root, reference.path, factsCache)}; }
          catch (error) { entry = {error}; }
          referenceCache.set(key, entry);
        }
        if (entry.error) throw entry.error;
        const actual = entry.facts;
        if (collectCurrent) current.push(actual);
        if (actual.sha256 !== reference.sha256) diagnostics.push(`artifact-hash-changed:${reference.path}`);
      } catch (error) {diagnostics.push(`artifact-unavailable:${reference.path}:${error.code ?? error.message}`);}
    }
    if (collectCurrent) current.sort((a, b) => a.path.localeCompare(b.path, "en"));
    return {valid: diagnostics.length === 0, current, diagnostics};
  } finally { endStage(timing, measurement); }
}

export function typographyImplementationHash(files) {
  return sha256(canonical(files.map(({path: file, sha256: hash}) => ({path: file, sha256: hash}))
    .sort((a, b) => a.path.localeCompare(b.path, "en"))));
}

export function typographyCandidateHash({placementId, sourceSwfSha256,
  sourceCatalogContentSha256, bindingSha256, implementationHash}) {
  return sha256(canonical({placementId, sourceSwfSha256,
    sourceCatalogContentSha256, bindingSha256, implementationHash}));
}

function validTimestamp(value) {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now() + 1000;
}

export function bindingProblems(binding, placement, sourceTextIds, sourceShapes, sourceBitmaps = new Map()) {
  const problems = [];
  if (binding.schemaVersion !== 1 || typeof binding.version !== "string" || !binding.version.trim()) problems.push("binding-version-invalid");
  if (binding.animationId !== placement.animationId || binding.placementId !== placement.placementId ||
    binding.sourceSwfSha256 !== placement.sourceSha256) problems.push("binding-source-identity-mismatch");
  if (!["explanation", "exercise", "complex-figure"].includes(binding.template)) problems.push("binding-template-invalid");
  if (!Array.isArray(binding.unresolved) || binding.unresolved.some(value => typeof value !== "string")) problems.push("binding-unresolved-disposition-missing");
  if (!Array.isArray(binding.blocks) || binding.blocks.length === 0) return [...problems, "binding-blocks-missing"];
  const ids = new Set(), orders = new Set();
  for (const block of binding.blocks) {
    if (!block || typeof block.id !== "string" || ids.has(block.id)) {problems.push("binding-block-id-invalid-or-duplicate"); continue;}
    ids.add(block.id);
    if (!["en", "es"].includes(block.language) || !Number.isSafeInteger(block.readingOrder) || block.readingOrder < 0) problems.push(`binding-reading-order-invalid:${block.id}`);
    const order = `${block.language}:${block.readingOrder}`;
    if (orders.has(order)) problems.push(`binding-reading-order-duplicate:${order}`);
    orders.add(order);
    if (!["title", "heading", "body", "question", "feedback", "answer", "label"].includes(block.role)) problems.push(`binding-role-invalid:${block.id}`);
    if (!["source-static", "maintained-page-state"].includes(block.valueSource)) problems.push(`binding-value-source-invalid:${block.id}`);
    const textIds = block.sourceTextIds;
    const shapeIds = block.sourceShapeIds ?? [];
    const bitmapIds = block.sourceBitmapIds ?? [];
    if (!Array.isArray(textIds) || textIds.some(id => !sourceTextIds.has(id)) ||
      !Array.isArray(shapeIds) || !Array.isArray(bitmapIds) || (textIds.length === 0 && shapeIds.length === 0 && bitmapIds.length === 0)) {
      problems.push(`binding-source-reference-unresolved:${block.id}`);
    }
    if (Array.isArray(bitmapIds)) for (const id of bitmapIds) {
      if (!Number.isSafeInteger(id) || !sourceBitmaps.has(id)) {
        problems.push(`binding-source-bitmap-unresolved:${block.id}:${id}`); continue;
      }
      if (Array.isArray(binding.sourceRoleDecisions) && binding.sourceRoleDecisions.some(item => !item || typeof item !== "object")) {
        problems.push(`binding-source-bitmap-role-malformed:${block.id}:${id}`); continue;
      }
      const decisions = Array.isArray(binding.sourceRoleDecisions) ? binding.sourceRoleDecisions.filter(item =>
        item?.kind === "bitmap-text" && item.blockId === block.id && item.role === block.role &&
        Array.isArray(item.sourceBitmapHashes) && item.sourceBitmapHashes.some(reference => reference?.characterId === id)) : [];
      if (decisions.length !== 1) {
        problems.push(`binding-source-bitmap-role-ambiguous-or-missing:${block.id}:${id}`); continue;
      }
      const decision = decisions[0], hashes = decision.sourceBitmapHashes.filter(reference => reference?.characterId === id);
      if (decision.sourceBitmapHashes.some(ref => !ref || !Number.isSafeInteger(ref.characterId) || !/^[a-f0-9]{64}$/.test(ref.sourceTagSha256 ?? "")) ||
          hashes.length !== 1 || hashes[0].sourceTagSha256 !== sourceBitmaps.get(id) ||
          typeof decision.semanticValue !== "string" || !decision.semanticValue.trim() ||
          typeof decision.reason !== "string" || !decision.reason.trim()) {
        problems.push(`binding-source-bitmap-role-unresolved:${block.id}:${id}`); continue;
      }
      const bounds = decision.sourcePixelBounds, size = decision.decodedImageSize;
      if (!Array.isArray(size) || size.length !== 2 || !size.every(n => Number.isSafeInteger(n) && n > 0) ||
          !Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isSafeInteger) ||
          bounds[0] < 0 || bounds[1] < 0 || bounds[2] <= 0 || bounds[3] <= 0 ||
          bounds[0] + bounds[2] > size[0] || bounds[1] + bounds[3] > size[1]) {
        problems.push(`binding-source-bitmap-region-invalid:${block.id}:${id}`);
      }
      for (const key of ["decodedImageEvidence", "transcriptionEvidence"]) {
        const ref = decision[key];
        if (!ref || typeof ref.path !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256 ?? "") ||
            !Number.isSafeInteger(ref.bytes) || ref.bytes <= 0 ||
            !Array.isArray(binding.implementation?.files) || !binding.implementation.files.some(file =>
              file?.path === ref.path && file.sha256 === ref.sha256 && file.bytes === ref.bytes)) {
          problems.push(`binding-source-bitmap-evidence-unbound:${block.id}:${id}:${key}`);
        }
      }
    }
    if (Array.isArray(shapeIds)) for (const id of shapeIds) {
      if (!Number.isSafeInteger(id) || !sourceShapes.has(id)) {
        problems.push(`binding-source-shape-unresolved:${block.id}:${id}`); continue;
      }
      const decision = Array.isArray(binding.sourceRoleDecisions) && binding.sourceRoleDecisions.find(item =>
        (["outlined-text", "native-mathematical-figure"].includes(item.kind) ||
          (item.kind === "native-ui-control" && item.blockId === block.id && ["label", "feedback"].includes(block.role))) &&
        Array.isArray(item.sourceShapeIds) && item.sourceShapeIds.includes(id) &&
        item.role === block.role && typeof item.semanticValue === "string" && item.semanticValue.trim() &&
        typeof item.reason === "string" && item.reason.trim() &&
        Array.isArray(item.sourceShapeHashes) && item.sourceShapeHashes.some(reference =>
          reference.characterId === id && reference.sourceTagSha256 === sourceShapes.get(id)));
      if (!decision) problems.push(`binding-source-shape-role-unresolved:${block.id}:${id}`);
    }
  }
  return problems;
}

async function inspectSource(root, index, placement, assetEntry, cache, factsCache, sourceRoots) {
  let source = cache.get(assetEntry.assetId);
  if (!source) {
    try {
      await fileFacts(root, assetEntry.path, factsCache);
      const asset = await readTextSourceAsset(root, assetEntry);
      const textIds = new Set();
      let characters = 0;
      for (const definition of asset.textDefinitions ?? []) {
        textIds.add(definition.sourceTextId);
        for (const run of definition.runs ?? []) {
          textIds.add(run.sourceTextId); characters += (run.text ?? "").length;
        }
        if (definition.kind === "dynamic-text") characters += (definition.initialText?.text ?? "").length;
      }
      const bounds = asset.header?.stageBoundsTwips;
      const area = bounds ? (bounds.right - bounds.left) * (bounds.bottom - bounds.top) / 400 : null;
      source = {catalogCurrent: true, sourceTextIds: textIds,
        sourceShapes: new Map((asset.shapeDefinitions ?? []).map(shape => [shape.characterId, shape.sourceTagSha256])),
        sourceBitmaps: new Map((asset.bitmapDefinitions ?? []).map(bitmap => [bitmap.characterId, bitmap.sourceTagSha256])),
        summary: asset.summary ?? {},
        risks: unique((asset.risks ?? []).map(risk => risk.kind)),
        density: area > 0 ? Number((characters / area * 480000).toFixed(4)) : null,
        decodedCharacterCount: characters};
    } catch (error) {
      source = {catalogCurrent: false, sourceTextIds: new Set(), sourceShapes: new Map(), sourceBitmaps: new Map(), summary: assetEntry.summary ?? {},
        risks: unique([...(assetEntry.risks ?? []), "source-catalog-integrity-failed"]),
        density: null, decodedCharacterCount: 0, error: error.message};
    }
    cache.set(assetEntry.assetId, source);
  }
  const key = `${placement.sourcePath}\0${placement.sourceSha256}`;
  let raw = cache.get(key);
  if (!raw) {
    raw = {status: "source-unavailable", actualSha256: null, sourceRootIndex: null};
    for (let i = 0; i < index.sourceRoots.length; i++) {
      try {
        const actual = await fileFacts(sourceRoots[i], placement.sourcePath, factsCache);
        raw = {status: actual.sha256 === placement.sourceSha256 ? "verified" : "hash-mismatch",
          actualSha256: actual.sha256, sourceRootIndex: i};
        break; // Never conceal a changed first source by selecting an old alternate.
      } catch (error) {
        if (error.code === "ENOENT") continue;
        raw = {status: "source-read-failed", actualSha256: null, sourceRootIndex: i, error: error.message};
        break;
      }
    }
    cache.set(key, raw);
  }
  return {...source, raw};
}

function matchesCandidate(record, page) {
  return record.schemaVersion === 1 && record.placementId === page.placementId &&
    record.bindingSha256 === page.bindingSha256 &&
    record.implementationHash === page.implementationHash && record.candidateHash === page.candidateHash;
}

async function inspectPage({root, index, placement, asset, source, bindingRecord, checkRecords, reviewRecords, factsCache, timing, referenceCache, artifactResolver}) {
  const page = {...placement, sourceCatalogContentSha256: asset.contentSha256,
    sourceVerification: source.raw, sourceCatalogCurrent: source.catalogCurrent,
    structuralExtraction: asset.status, structuralRisks: source.risks,
    structuralSummary: source.summary, structuralTextDensity: source.density,
    decodedCharacterCount: source.decodedCharacterCount,
    bindingPath: bindingRecord?.path ?? null, bindingSha256: bindingRecord?.sha256 ?? null,
    implementationHash: null, candidateHash: null, bindingPresent: Boolean(bindingRecord),
    bindingCurrent: false, implementationFilesCurrent: false, implementationDeclaredStatus: null,
    implementationFiles: [], implemented: false, technicalChecksPassed: false,
    humanReviewPerformed: false, humanReviewPassed: false, spanishTranslationImplemented: false,
    languagePolicy: {en: "unavailable", es: "unavailable"},
    checkRecords: [], reviewRecords: [], unresolved: [], independentPending: [], pendingTechnicalChecks: [], status: "source-only"};
  if (!source.catalogCurrent) page.unresolved.push("source-catalog-integrity-failed");
  if (source.raw.status !== "verified") page.unresolved.push(`source-${source.raw.status}`);
  if (asset.status !== "parsed") page.unresolved.push(`structural-extraction-${asset.status}`);
  if (!bindingRecord) {
    page.unresolved.push("page-binding-missing", ...source.risks);
    if (!source.catalogCurrent || source.raw.status !== "verified") page.status = "blocked";
    return page;
  }
  const binding = bindingRecord.data;
  // Independent acceptance gates stay visible without making technical passage
  // depend on the human review that follows it. Never reinterpret unresolved.
  if (binding.independentPending !== undefined) {
    if (Array.isArray(binding.independentPending) && binding.independentPending.every(value => typeof value === "string" && value.trim())) {
      page.independentPending = unique(binding.independentPending);
    } else page.unresolved.push("binding-independent-pending-invalid");
  }
  if (binding.pendingTechnicalChecks !== undefined) {
    const allowed = REQUIRED_TYPOGRAPHY_CHECKS.filter(key => !REQUIRED_IMPLEMENTATION_CHECKS.includes(key));
    if (Array.isArray(binding.pendingTechnicalChecks) && binding.pendingTechnicalChecks.every(key => allowed.includes(key))) {
      page.pendingTechnicalChecks = unique(binding.pendingTechnicalChecks);
    } else page.unresolved.push("binding-pending-technical-checks-invalid");
  }
  const problems = bindingProblems(binding, placement, source.sourceTextIds, source.sourceShapes, source.sourceBitmaps);
  page.unresolved.push(...problems, ...(Array.isArray(binding.unresolved) ? binding.unresolved : []));
  page.bindingCurrent = problems.length === 0 && source.catalogCurrent && source.raw.status === "verified";
  page.implementationDeclaredStatus = binding.implementation?.status ?? null;
  const implementation = await inspectReferences(root, binding.implementation?.files, factsCache, timing, true, referenceCache);
  page.implementationFilesCurrent = implementation.valid && page.bindingCurrent &&
    ["candidate", "implemented"].includes(page.implementationDeclaredStatus);
  page.implementationFiles = implementation.current;
  page.unresolved.push(...implementation.diagnostics);
  page.implementationHash = typographyImplementationHash(implementation.current);
  page.candidateHash = typographyCandidateHash({placementId: placement.placementId,
    sourceSwfSha256: source.raw.actualSha256, sourceCatalogContentSha256: asset.contentSha256,
    bindingSha256: page.bindingSha256, implementationHash: page.implementationHash});

  let latestCheck = null, latestImplementation = null;
  for await (const record of hydrateCheckRecords(root, checkRecords, factsCache, timing)) {
    const leanArtifacts = record.data.schemaVersion === 2 || Object.hasOwn(record.data, "artifactDelta");
    let evidence;
    if (leanArtifacts) {
      try {
        const resolved = await artifactResolver.resolver.resolve(artifactResolver.records.get(record.path), placement.placementId);
        evidence = await inspectReferences(root, resolved, factsCache, timing, false, referenceCache);
      } catch (error) {
        evidence = {valid: false, current: [], diagnostics: [`artifact-delta-invalid:${record.path}:${error.message}`]};
      }
    } else evidence = await inspectReferences(root, record.data.artifacts, factsCache, timing, false, referenceCache);
    // Lean format validation is independent of candidate identity. A malformed
    // newest lean record must remain a failure, never revive an older pass.
    const candidateMatches = matchesCandidate(leanArtifacts ? {...record.data, schemaVersion: 1} : record.data, page);
    const isTechnical = record.data.kind === "lesson-typography-check-v1";
    const recognized = isTechnical || record.data.kind === "lesson-typography-implementation-v1";
    const current = page.implementationFilesCurrent && candidateMatches && evidence.valid &&
      recognized && validTimestamp(record.data.checkedAt);
    const allPassed = REQUIRED_TYPOGRAPHY_CHECKS.every(key => record.data.checks?.[key] === "passed");
    const resolved = record.data.resolvedSourceRisks;
    const risksResolved = Array.isArray(resolved) && source.risks.every(risk => resolved.includes(risk));
    const language = record.data.languagePolicy;
    const bilingualValid = language && ["source", "translated"].includes(language.en) &&
      ["source", "translated", "source-fallback"].includes(language.es) &&
      (!["source", "translated"].includes(language.es) || binding.blocks.some(block => block.language === "es"));
    const implementationPassed = current && risksResolved && page.unresolved.length === 0 &&
      REQUIRED_IMPLEMENTATION_CHECKS.every(key => record.data.checks?.[key] === "passed");
    const passed = isTechnical && implementationPassed && allPassed && bilingualValid && page.pendingTechnicalChecks.length === 0;
    page.checkRecords.push({path: record.path, sha256: record.sha256, current, passed,
      kind: record.data.kind, implementationPassed,
      diagnostics: evidence.diagnostics,
      candidateMatches});
    if ((recognized || leanArtifacts) && candidateMatches && validTimestamp(record.data.checkedAt) &&
      (!latestImplementation || Date.parse(record.data.checkedAt) >= Date.parse(latestImplementation.record.data.checkedAt))) {
      latestImplementation = {record, passed: implementationPassed};
    }
    if ((isTechnical || (leanArtifacts && !recognized)) && candidateMatches && validTimestamp(record.data.checkedAt) &&
      (!latestCheck || Date.parse(record.data.checkedAt) >= Date.parse(latestCheck.record.data.checkedAt))) {
      latestCheck = {record, passed};
    }
  }
  const passingCheck = latestCheck?.passed ? latestCheck.record : null;
  const passingImplementation = latestImplementation?.passed ? latestImplementation.record : null;
  page.implemented = Boolean(passingImplementation);
  page.unresolved.push(...source.risks.filter(risk => !passingImplementation?.data.resolvedSourceRisks?.includes(risk)));
  if (passingCheck) {
    page.technicalChecksPassed = page.implemented;
    page.languagePolicy = passingCheck.data.languagePolicy;
    page.spanishTranslationImplemented = page.languagePolicy.es === "translated";
  }
  let latestReview = null;
  for (const record of reviewRecords) {
    const evidence = await inspectReferences(root, record.data.artifacts, factsCache, timing, false, referenceCache);
    const reviewer = record.data.reviewer;
    const reviewerValid = typeof reviewer === "string" && reviewer.trim().length >= 3 &&
      !/^(?:unknown|tbd|pending|codex|assistant|ai|placeholder)$/i.test(reviewer.trim());
    const current = page.implementationFilesCurrent && matchesCandidate(record.data, page) && evidence.valid &&
      record.data.kind === "lesson-typography-review-v1" && reviewerValid && validTimestamp(record.data.reviewedAt);
    const performed = current && ["passed", "failed"].includes(record.data.verdict);
    const passed = performed && page.technicalChecksPassed && record.data.verdict === "passed";
    page.reviewRecords.push({path: record.path, sha256: record.sha256, current, passed,
      performed,
      reviewer: reviewerValid ? reviewer : null, reviewedAt: record.data.reviewedAt ?? null,
      candidateMatches: matchesCandidate(record.data, page), diagnostics: evidence.diagnostics});
    if (matchesCandidate(record.data, page) && validTimestamp(record.data.reviewedAt) &&
      (!latestReview || Date.parse(record.data.reviewedAt) >= Date.parse(latestReview.record.data.reviewedAt))) {
      latestReview = {record, performed, passed};
    }
  }
  page.humanReviewPerformed = latestReview?.performed === true;
  page.humanReviewPassed = latestReview?.passed === true;
  page.unresolved = unique(page.unresolved);
  page.status = page.humanReviewPassed ? "reviewed" : page.technicalChecksPassed ? "technically-verified" :
    page.implemented ? "implemented" : page.implementationFilesCurrent ? "implementation-candidate" : page.bindingCurrent ? "bound" : "blocked";
  return page;
}

function representativeTypes(page) {
  const s = page.structuralSummary, risks = page.structuralRisks, types = [];
  if (s.staticTextDefinitions > 0) types.push("static-text");
  if (s.dynamicFields > 0) types.push("dynamic-text");
  if (s.buttonStatePlacements > 0) types.push("button-states");
  if (s.bitmapDefinitions > 0) types.push("bitmap-content");
  if (risks.some(risk => /mask|filter|blend/.test(risk))) types.push("mask-filter-blend");
  if (s.unresolvedRuns > 0) types.push("unresolved-glyph");
  if (s.shapeDefinitions > 0) types.push("shape-content");
  if (s.timelines > 1) types.push("nested-timeline");
  if (/-fq-/.test(page.animationId)) types.push("final-quiz");
  if (/-ts-/.test(page.animationId)) types.push("practice");
  if (/-vb-/.test(page.animationId)) types.push("vocabulary");
  if (page.structuralTextDensity >= 1000) types.push("dense-text");
  return types;
}

export function buildRepresentativePages({pages, indexSha256, observedAt, previous = null,
  minimumCount = 24, requiredAnimations = REQUIRED_REPRESENTATIVE_ANIMATIONS}) {
  const byId = new Map(pages.map(page => [page.placementId, page]));
  assert(byId.size === pages.length, "duplicate representative placement");
  const candidates = pages.map(page => ({page, types: representativeTypes(page),
    riskScore: page.structuralRisks.length * 10 + (page.structuralSummary.unresolvedRuns ?? 0) * 100}));
  const ordered = [...candidates].sort((a, b) => b.riskScore - a.riskScore ||
    (b.page.structuralTextDensity ?? -1) - (a.page.structuralTextDensity ?? -1) ||
    a.page.placementId.localeCompare(b.page.placementId, "en"));
  const selected = new Map();
  if (previous) {
    assert(previous.kind === "lesson-typography-representatives-v1" && Array.isArray(previous.pages), "invalid frozen representatives");
    for (const row of previous.pages) {
      assert(byId.has(row.placementId) && !selected.has(row.placementId), "frozen representative missing or duplicate placement");
      selected.set(row.placementId, {reason: row.selectionReason, frozenSourceSha256: row.frozenSourceSha256});
    }
  }
  for (const animationId of requiredAnimations) {
    const match = pages.filter(page => page.animationId === animationId).sort((a, b) => a.placementId.localeCompare(b.placementId, "en"));
    assert(match.length > 0, `mandatory representative missing: ${animationId}`);
    if (previous) assert(match.some(page => selected.has(page.placementId)), `frozen set lost mandatory representative: ${animationId}`);
    else selected.set(match[0].placementId, {reason: "owner-required", frozenSourceSha256: match[0].sourceSha256});
  }
  if (!previous) {
    for (const type of REPRESENTATIVE_TYPES) {
      if ([...selected.keys()].some(id => representativeTypes(byId.get(id)).includes(type))) continue;
      const candidate = ordered.find(item => item.types.includes(type));
      if (candidate) selected.set(candidate.page.placementId, {reason: `type:${type}`, frozenSourceSha256: candidate.page.sourceSha256});
    }
    for (const {page} of ordered) {
      if (selected.size >= minimumCount) break;
      if (!selected.has(page.placementId)) selected.set(page.placementId, {reason: "risk-density-order", frozenSourceSha256: page.sourceSha256});
    }
  }
  assert(selected.size >= minimumCount, `insufficient representative placements: ${selected.size}/${minimumCount}`);
  const selectedRows = [...selected].map(([id, selected]) => {
    const page = byId.get(id);
    const currentSourceSha256 = page.sourceVerification ? page.sourceVerification.actualSha256 : page.sourceSha256;
    return {placementId: id, animationId: page.animationId, grade: page.grade, lesson: page.lesson,
      selectionReason: selected.reason, frozenSourceSha256: selected.frozenSourceSha256,
      currentSourceSha256, sourceChanged: selected.frozenSourceSha256 !== currentSourceSha256,
      types: representativeTypes(page), structuralTextDensity: page.structuralTextDensity,
      structuralRisks: page.structuralRisks, status: page.status};
  });
  const coverage = REPRESENTATIVE_TYPES.map(type => {
    const available = candidates.filter(item => item.types.includes(type)).length;
    const selectedIds = selectedRows.filter(row => row.types.includes(type)).map(row => row.placementId);
    return {type, availablePlacements: available, selectedPlacements: selectedIds,
      status: available === 0 ? "unsupported" : selectedIds.length ? "selected-for-validation" : "not-covered"};
  });
  return {schemaVersion: 1, kind: "lesson-typography-representatives-v1", observedAt,
    frozenFromIndexSha256: previous?.frozenFromIndexSha256 ?? indexSha256,
    currentIndexSha256: indexSha256, minimumCount, requiredAnimations, selectedCount: selectedRows.length,
    selectionPolicy: "mandatory IDs; missing available types; risk descending; structural density descending; placementId ascending; preserve frozen membership",
    densityMeaning: "Decoded source characters per 800x600-equivalent source stage area across all definitions; not simultaneous visible density or semantic layout classification",
    claimBoundary: {selectionIsAcceptance: false, missingTypesCanBeSubstituted: false},
    typeCoverage: coverage, pages: selectedRows};
}

export async function buildG678TypographyBacklog({root = G678_ROOT, observedAt,
  expectedCount = 2282} = {}) {
  const manifestBytes = await readFile(path.join(root, G678_MANIFEST));
  const registryBytes = await readFile(path.join(root, G678_REGISTRY));
  const manifest = JSON.parse(manifestBytes), registry = JSON.parse(registryBytes);
  const rows = manifest.releases.flatMap(release => release.members.map(member => ({...member,
    releaseId: release.releaseId, moduleCode: release.moduleCode, moduleLesson: release.moduleLesson})));
  assert(rows.length === expectedCount && new Set(rows.map(row => row.placementId)).size === rows.length,
    "G678 manifest denominator or unique placement mismatch");
  assert(rows.every(row => row.releaseRole === "active-xml-referenced-page"), "G678 contains a non-page member");
  const keys = new Set(rows.map(row => row.animationId));
  const entries = registry.calibrations.flatMap(calibration => calibration.entries.map(entry => ({...entry, calibrationId: calibration.calibrationId})))
    .filter(entry => keys.has(entry.key));
  assert(new Set(entries.map(entry => entry.key)).size === entries.length, "G678 duplicate registry animation");
  const byId = new Map(entries.map(entry => [entry.key, entry]));
  const pages = [];
  for (const row of rows) {
    const entry = byId.get(row.animationId);
    let moduleEvidence = null;
    if (entry) {
      const reference = entry.artifacts?.module;
      if (reference) {
        const result = await inspectReferences(root, [reference]);
        const declaredModule = typeof entry.module === "string" ? entry.module.replace(/^\.\//, "") : null;
        if (!declaredModule || ![".ts", ".tsx"].some(extension =>
          reference.path === `packages/demos/src/${declaredModule}${extension}`)) {
          result.valid = false;
          result.diagnostics.push("registry-module-path-mismatch");
        }
        moduleEvidence = {current: result.valid, files: result.current, diagnostics: result.diagnostics};
      } else moduleEvidence = {current: false, files: [], diagnostics: ["registry-module-hash-missing"]};
    }
    pages.push({placementId: row.placementId, animationId: row.animationId, releaseId: row.releaseId,
      moduleCode: row.moduleCode, moduleLesson: row.moduleLesson, sourceSha256: row.source.sha256,
      currentJsRegistryEntryPresent: Boolean(entry), currentJsMaturity: entry?.maturity ?? null,
      calibrationId: entry?.calibrationId ?? null, moduleEvidence,
      typographyStatus: "unassessed", typographyImplemented: false, humanReviewPassed: false});
  }
  const manifestHash = sha256(manifestBytes), registryHash = sha256(registryBytes);
  assert(sha256(await readFile(path.join(root, G678_MANIFEST))) === manifestHash &&
    sha256(await readFile(path.join(root, G678_REGISTRY))) === registryHash, "G678 state changed during read-only audit");
  const modules = unique(rows.map(row => row.moduleCode)).map(moduleCode => {
    const members = pages.filter(page => page.moduleCode === moduleCode);
    return {moduleCode, denominator: members.length,
      registryEntries: members.filter(page => page.currentJsRegistryEntryPresent).length,
      registryModuleHashesCurrent: members.filter(page => page.moduleEvidence?.current).length,
      typographyUnassessed: members.length};
  });
  const integrationPath='catalog/typography-v1/g678-integration.json';
  const integration=await optionalJson(root,integrationPath);
  let integrationEvidence=null,integrationApplied=false;
  if(integration){
    const files=await inspectReferences(root,integration.sharedFiles);
    const required=['packages/demos/src/lesson-text-contract.ts','packages/demos/src/lesson-text-presentation.tsx',
      'packages/demos/src/lesson-canvas-plane.tsx','packages/demos/src/contract.ts','packages/demos/package.json',
      'apps/web/components/animation-runtime.tsx','apps/web/app/[locale]/layout.tsx','scripts/check-g678-lesson-typography-v1.mjs'];
    const packageData=await optionalJson(root,'packages/demos/package.json');
    integrationApplied=integration.kind==='g678-lesson-typography-integration-v1'&&files.valid
      &&required.every(file=>files.current.some(reference=>reference.path===file))
      &&packageData?.exports?.['./lesson-text']==='./src/lesson-text.ts'
      &&packageData?.scripts?.['check:typography']==='node ../../scripts/check-g678-lesson-typography-v1.mjs'
      &&packageData?.scripts?.typecheck?.includes('npm run check:typography');
    integrationEvidence={...await fileFacts(root,integrationPath),sharedFilesCurrent:files.valid,
      currentFiles:files.current,diagnostics:files.diagnostics,installedAt:integration.installedAt??null,
      baselineRegisteredModules:integration.baselineEntries?.length??null,
      advancedG3HostExtensionsPorted:integration.claimBoundary?.g3HostExtensionsPorted===true};
  }
  return {schemaVersion: 1, kind: "g678-lesson-typography-backlog-v1", observedAt,
    activeWorktree: root, integrationStatus: integrationApplied?'applied-shared-presentation-and-development-checks':integration?'applied-files-require-currentness-repair':"prepared-not-applied-to-active-g678-worktree",
    integrationEvidence,
    inputs: [{path: G678_MANIFEST, sha256: manifestHash}, {path: G678_REGISTRY, sha256: registryHash}],
    claimBoundary: {readOnlySnapshot: true, registryIsRuntimeVerification: false,
      registrationIsTypographyModernization: false, activeWorktreeModified: Boolean(integration)},
    summary: {activePlacements: rows.length, lessons: manifest.releases.length,
      registryEntriesPresent: entries.length,
      registeredEntries: entries.filter(entry => entry.maturity === "private-current-js").length,
      registeredModuleHashesCurrent: pages.filter(page => page.currentJsMaturity === "private-current-js" && page.moduleEvidence?.current).length,
      withoutRegistryEntry: rows.length - entries.length, typographyUnassessed: rows.length,
      typographyImplemented: 0, humanReviewed: 0}, modules, pages};
}

export async function buildLessonTypographyProgress({root = ROOT, g678Root = G678_ROOT,
  check = false, expectedCount = 1751, expectedG678Count = 2282, representativeCount = 24,
  requiredAnimations = REQUIRED_REPRESENTATIVE_ANIMATIONS, observedAt, onProgress = () => {},
  outputScope = "all", timing = null, sourceRootBindings = null} = {}) {
  assert(["all", "g345"].includes(outputScope), "unknown typography output scope");
  // Snapshot only this run's ordinary-file facts/errors; every record still
  // applies its own expected hash, diagnostics, ordering and acceptance rules.
  const factsCache = new Map(), referenceCache = new Map(), directories = [], sourceCache = new Map(), pages = [];
  const previousProgress = await optionalJson(root, `${DIRECTORY}/progress.json`, factsCache);
  const previousRepresentatives = await optionalJson(root, `${DIRECTORY}/representative-pages.json`, factsCache);
  const generator = await fileFacts(root, "scripts/build-lesson-typography-progress-v1.mjs", factsCache);
  const stamp = observedAt ?? (check ? previousProgress?.observedAt : null) ?? new Date().toISOString();
  const indexFacts = await fileFacts(root, INDEX_PATH, factsCache);
  const indexBytes = await readFile(path.join(root, INDEX_PATH));
  const index = JSON.parse(indexBytes), indexHash = sha256(indexBytes);
  assert(indexHash === indexFacts.sha256, "text source index changed during progress audit");
  assert(index.kind === "lesson-text-source-catalog-v1" && Array.isArray(index.sourceRoots), "invalid text source index");
  let sourceRoots = index.sourceRoots;
  if (sourceRootBindings !== null) {
    assert(Array.isArray(sourceRootBindings) && sourceRootBindings.every(row => row &&
      typeof row.historical === "string" && typeof row.actual === "string"), "Invalid reviewed source root mapping");
    assert(JSON.stringify(index.sourceRoots) === JSON.stringify(sourceRootBindings.map(row => row.historical)), "Unexpected historical source roots; reviewed Life mapping required");
    for (const row of sourceRootBindings) assert(await realpath(row.actual) === row.actual, "Life source root must be a physical unchanged path");
    sourceRoots = sourceRootBindings.map(row => row.actual);
  }
  validateManifestRows(index.placements, expectedCount);
  const manifest = await fileFacts(root, index.manifest.path, factsCache);
  assert(manifest.sha256 === index.manifest.sha256, "source program manifest changed; rebuild text catalog");
  const manifestBytes = await readFile(path.join(root, index.manifest.path), "utf8");
  assert(sha256(manifestBytes) === manifest.sha256, "source program manifest changed during read");
  const manifestRows = JSON.parse(manifestBytes).rows;
  validateManifestRows(manifestRows, expectedCount);
  const manifestByPlacement = new Map(manifestRows.map(row => [row.placementId, row]));
  for (const placement of index.placements) {
    const original = manifestByPlacement.get(placement.placementId);
    assert(original && ["animationId", "sourcePath", "sourceSha256", "assetId", "grade", "lesson", "globalPageOrdinal"]
      .every(key => original[key] === placement[key]), `source index differs from program placement: ${placement.placementId}`);
  }
  if (index.generator?.inputs) {
    const generatorInputs = await inspectReferences(root, index.generator.inputs, factsCache, timing, true, referenceCache);
    assert(generatorInputs.valid, "text source generator changed; rebuild text catalog");
  }
  const assets = new Map(index.assets.map(asset => [asset.assetId, asset]));
  assert(assets.size === index.assets.length, "duplicate source assetId");
  assert(new Set(index.placements.map(row => row.assetId)).size === assets.size, "source asset inventory differs from placement membership");
  const placements = new Set(index.placements.map(row => row.placementId));
  const scanMeasurement = startStage(timing, "scan");
  let bindings, checks, reviews;
  try {
    [bindings, checks, reviews] = await Promise.all([
      scanRecords(root, `${DIRECTORY}/page-bindings`, false, factsCache, directories),
      scanRecords(root, `${DIRECTORY}/checks`, true, factsCache, directories),
      scanRecords(root, `${DIRECTORY}/reviews`, false, factsCache, directories),
    ]);
    timing?.count("scannedBindings", bindings.length);
    timing?.count("scannedChecks", checks.length);
    timing?.count("scannedReviews", reviews.length);
  } finally { endStage(timing, scanMeasurement); }
  const byBinding = recordsByPlacement(bindings, placements, true);
  const byCheck = recordsByPlacement(checks, placements);
  const byReview = recordsByPlacement(reviews, placements);
  const artifactResolver = artifactResolverForChecks(root, checks, factsCache);
  for (const placement of index.placements) {
    const asset = assets.get(placement.assetId);
    assert(asset && asset.sourceSha256 === placement.sourceSha256 && asset.path === placement.assetPath,
      `placement source index mismatch: ${placement.placementId}`);
    const source = await inspectSource(root, index, placement, asset, sourceCache, factsCache, sourceRoots);
    pages.push(await inspectPage({root, index, placement, asset, source,
      factsCache, timing, referenceCache, artifactResolver, bindingRecord: byBinding.get(placement.placementId)?.[0],
      checkRecords: byCheck.get(placement.placementId) ?? [], reviewRecords: byReview.get(placement.placementId) ?? []}));
    if (pages.length % 100 === 0) onProgress({pages: pages.length, total: index.placements.length});
  }
  const count = predicate => pages.filter(predicate).length;
  const progress = {schemaVersion: 1, kind: "lesson-typography-progress-v1", observedAt: stamp,
    inputs: {index: {path: INDEX_PATH, sha256: indexHash}, manifest, generator},
    claimBoundary: {legacyShellsIncluded: false, structuralExtractionIsModernization: false,
      registeredIsModernized: false, validReviewRecordAuthenticatesReviewerIdentity: false,
      originalRuntimeAccepted: false, audioAccepted: false, ownerAccepted: false,
      strictComplete: false, lessonPublished: false},
    requiredImplementationChecks: REQUIRED_IMPLEMENTATION_CHECKS, requiredChecks: REQUIRED_TYPOGRAPHY_CHECKS,
    summary: {activePlacements: pages.length, lessons: new Set(pages.map(page => `${page.grade}/${page.lesson}`)).size,
      uniqueSourceAssets: assets.size, sourceHashesCurrent: count(page => page.sourceVerification.status === "verified"),
      sourceCatalogCurrent: count(page => page.sourceCatalogCurrent), structuralParsed: count(page => page.structuralExtraction === "parsed"),
      bindingsPresent: count(page => page.bindingPresent), bindingsCurrent: count(page => page.bindingCurrent),
      implementationFilesCurrent: count(page => page.implementationFilesCurrent), implemented: count(page => page.implemented),
      technicalChecksPassed: count(page => page.technicalChecksPassed),
      humanReviewPerformed: count(page => page.humanReviewPerformed), humanReviewPassed: count(page => page.humanReviewPassed),
      spanishTranslationImplemented: count(page => page.spanishTranslationImplemented),
      sourceFallbackNotTranslated: count(page => page.languagePolicy.es === "source-fallback"),
      unresolvedPlacements: count(page => page.unresolved.length > 0)}, pages};
  const representatives = buildRepresentativePages({pages, indexSha256: indexHash, observedAt: stamp,
    previous: previousRepresentatives, minimumCount: representativeCount, requiredAnimations});
  const g678Measurement = startStage(timing, "g678");
  let g678;
  try {
    g678 = await buildG678TypographyBacklog({root: g678Root, observedAt: stamp, expectedCount: expectedG678Count});
  } finally { endStage(timing, g678Measurement); }
  // These are fresh full-content reads, not cache hits or stat-only validation.
  // This is a guarded frozen-input audit, not an atomic filesystem snapshot.
  const verificationMeasurement = startStage(timing, "final-verify");
  try {
    timing?.count("finalFileSnapshots", factsCache.size);
    timing?.count("finalEvidenceDirectories", directories.length);
    await verifyFileSnapshots(factsCache);
    await verifyEvidenceDirectories(directories);
    assert(sha256(await readFile(path.join(root, INDEX_PATH))) === indexHash, "text source index changed during progress audit");
  } finally { endStage(timing, verificationMeasurement); }
  const outputs = [["progress.json", progress], ["representative-pages.json", representatives], ["g678-backlog.json", g678]];
  if (!check) await mkdir(path.join(root, DIRECTORY), {recursive: true});
  for (const [name, document] of outputs) {
    if (outputScope === "g345" && name === "g678-backlog.json") continue;
    const output = path.join(root, DIRECTORY, name);
    const serializationMeasurement = startStage(timing, "serialize");
    let bytes;
    try { bytes = json(document); timing?.count("serializedDocuments", 1); }
    finally { endStage(timing, serializationMeasurement); }
    const outputMeasurement = startStage(timing, "output-io");
    try {
      if (check) assert(await readFile(output, "utf8") === bytes, `typography output stale: ${name}`);
      else await writeFile(output, bytes);
    } finally { endStage(timing, outputMeasurement); }
  }
  return {progress, representatives, g678};
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  assert(args.length <= 2 && new Set(args).size === args.length &&
    args.every(arg => ["--check", "--g345-only"].includes(arg)),
    "Usage: node scripts/build-lesson-typography-progress-v1.mjs [--check] [--g345-only]");
  buildLessonTypographyProgress({check: args.includes("--check"),
    outputScope: args.includes("--g345-only") ? "g345" : "all",
    onProgress: status => process.stderr.write(`Typography progress: ${status.pages}/${status.total} placements\n`),
  }).then(({progress, representatives, g678}) => process.stdout.write(json({
    progress: progress.summary, representatives: {selected: representatives.selectedCount,
      unsupportedTypes: representatives.typeCoverage.filter(row => row.status === "unsupported").map(row => row.type)},
    g678: g678.summary,
  }))).catch(error => {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;});
}
