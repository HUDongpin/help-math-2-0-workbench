#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const SCRIPT_RELATIVE = "scripts/build-fq002-audio-route-resolution-candidates.mjs";

const ANIMATION_ID = "course-g03-l06-fq-002-review";
const ARCHIVE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
const OUTPUT_RELATIVE = `${MIGRATION_ROOT}/audit/fq002-audio-route-resolution-candidates.json`;
const MIGRATION_RELATIVE = `${MIGRATION_ROOT}/migration.json`;
const AUDIO_AUDIT_RELATIVE = `${MIGRATION_ROOT}/audit/audio-runtime-evidence.json`;
const VARIANT_BINDING_RELATIVE = `${MIGRATION_ROOT}/audit/fq002-review-variant-binding.json`;
const SOURCE_CATALOG_RELATIVE = "catalog/source-files.json";
const AUDIO_GROUPS_RELATIVE = "catalog/audio-groups.json";
const COURSE_XML_RELATIVE = `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L6/index.xml`;
const HOST_SWF_RELATIVE = `${ARCHIVE_ROOT}/HELP_COURSES/indexELM.swf`;
const REVIEW_SWF_CATALOG_PATH = "HELP_COURSES/ELMGR3/L6/FQ/Review/L6FQ02.swf";
const ACTIVE_SWF_CATALOG_PATH = "HELP_COURSES/ELMGR3/L6/FQ/L6FQ02.swf";
const AUDIO_GROUP_ID = "course-g03-l06-fq-audio";

const EXPECTED_LANGUAGES = Object.freeze([
  Object.freeze({language: "en", directory: "EA"}),
  Object.freeze({language: "es", directory: "SA"}),
]);
const EXPECTED_OPTIONS = Object.freeze(["A", "B", "C", "D"]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function within(root, relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, "project-relative path is required");
  invariant(!path.isAbsolute(relativePath), `absolute path is not allowed: ${relativePath}`);
  const resolvedRoot = path.resolve(root);
  const absolute = path.resolve(resolvedRoot, relativePath);
  invariant(absolute.startsWith(`${resolvedRoot}${path.sep}`), `path escapes project root: ${relativePath}`);
  return absolute;
}

async function readRegularFile(root, relativePath, {source = false} = {}) {
  const absolute = within(root, relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} is not a regular non-symlink file`);
  const resolvedRoot = await realpath(root);
  const resolved = await realpath(absolute);
  invariant(resolved.startsWith(`${resolvedRoot}${path.sep}`), `${relativePath} resolves outside the project root`);
  if (source) invariant((metadata.mode & 0o222) === 0, `${relativePath} is writable source evidence`);
  const bytes = await readFile(absolute);
  return {
    absolute,
    bytes,
    byteCount: bytes.length,
    sha256: sha256Buffer(bytes),
    mode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
  };
}

async function readJsonBinding(root, relativePath, options) {
  const binding = await readRegularFile(root, relativePath, options);
  let value;
  try {
    value = JSON.parse(binding.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${relativePath} is not valid JSON: ${error.message}`);
  }
  return {...binding, value};
}

export function parseArguments(argumentsList) {
  const options = {check: false, root: projectRoot};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--root") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error("--root requires a value");
      options.root = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-fq002-audio-route-resolution-candidates.mjs [--check] [--root <project-root>]

Builds one deterministic, acceptance-neutral report for the two source-evidenced
FQ002 audio URL candidates. It hashes source bytes but never plays audio, admits
a route, promotes a cue, or changes migration/strict/review/approval state.`;
}

export function expectedFqAudioPaths(baseDirectory) {
  const normalizedBase = portable(baseDirectory).replace(/\/$/, "");
  const rows = [];
  for (const {language, directory} of EXPECTED_LANGUAGES) {
    for (let questionNumber = 1; questionNumber <= 31; questionNumber += 1) {
      const variants = [{kind: "question", option: null, basename: `Q${questionNumber}.mp3`}]
        .concat(EXPECTED_OPTIONS.map((option) => ({kind: "answer", option, basename: `Q${questionNumber}${option}.mp3`})));
      for (const variant of variants) {
        rows.push({
          expectedPathId: `fq-q${String(questionNumber).padStart(2, "0")}-${variant.kind}${variant.option ? `-${variant.option.toLowerCase()}` : ""}-${language}`,
          language,
          languageDirectory: directory,
          questionNumber,
          kind: variant.kind,
          option: variant.option,
          path: `${normalizedBase}/${directory}/${variant.basename}`,
        });
      }
    }
  }
  invariant(rows.length === 310, `expected FQ path matrix is ${rows.length}, not 310`);
  return rows;
}

export function deriveRouteMatrix({routeId, baseDirectory, sourceByPath, groupByPath}) {
  const expected = expectedFqAudioPaths(baseDirectory);
  const expectedSet = new Set(expected.map(({path: candidatePath}) => candidatePath));
  const relevantPrefix = `${portable(baseDirectory).replace(/\/$/, "")}/`;
  const relevantGroup = [...groupByPath.values()]
    .filter(({path: candidatePath}) => candidatePath.startsWith(relevantPrefix))
    .sort((left, right) => compareText(left.path, right.path));
  for (const group of relevantGroup) {
    const catalog = sourceByPath.get(group.path);
    invariant(catalog && catalog.sha256 === group.sha256 && Number(catalog.bytes) === Number(group.bytes),
      `${routeId}: unmatched or expected audio-group candidate differs from the source catalog (${group.path})`);
  }

  const expectedPaths = expected.map((row) => {
    const catalog = sourceByPath.get(row.path) || null;
    const group = groupByPath.get(row.path) || null;
    invariant(Boolean(catalog) === Boolean(group), `${routeId}: catalog/audio-group presence differs for ${row.path}`);
    if (catalog) {
      invariant(catalog.extension === "mp3", `${routeId}: expected audio path is not cataloged as MP3 (${row.path})`);
      invariant(catalog.sha256 === group.sha256 && Number(catalog.bytes) === Number(group.bytes),
        `${routeId}: catalog/audio-group hash or byte count differs for ${row.path}`);
    }
    return {
      ...row,
      status: catalog ? "hash-bound-path-candidate-not-promoted" : "missing-source",
      cuePromoted: false,
      source: catalog ? {sha256: catalog.sha256, bytes: catalog.bytes} : null,
    };
  });

  const unmatchedCandidates = relevantGroup
    .filter(({path: candidatePath}) => !expectedSet.has(candidatePath))
    .map(({path: candidatePath, sha256, bytes, language}) => ({
      path: candidatePath,
      sha256,
      bytes,
      language,
      status: "unmatched-group-candidate-not-promoted",
      cuePromoted: false,
      reason: "The basename is not emitted by the source-bound Qn/Qn[A-D].mp3 host URL algorithm.",
    }));
  const present = expectedPaths.filter(({status}) => status === "hash-bound-path-candidate-not-promoted");
  const missing = expectedPaths.filter(({status}) => status === "missing-source");
  const languageSummary = EXPECTED_LANGUAGES.map(({language}) => {
    const languageRows = expectedPaths.filter((row) => row.language === language);
    return {
      language,
      expected: languageRows.length,
      presentCandidates: languageRows.filter(({status}) => status === "hash-bound-path-candidate-not-promoted").length,
      missingSources: languageRows.filter(({status}) => status === "missing-source").length,
      unmatchedCandidates: unmatchedCandidates.filter((row) => row.language === language).length,
    };
  });
  const identityProjection = (rows) => rows.map((row) => ({
    path: row.path,
    status: row.status,
    sha256: row.source?.sha256 || null,
    bytes: row.source?.bytes || null,
  }));
  return {
    routeId,
    baseDirectory: portable(baseDirectory).replace(/\/$/, ""),
    expectedPathCount: expectedPaths.length,
    canonicalPathCandidateCount: present.length,
    missingSourceCount: missing.length,
    unmatchedCandidateCount: unmatchedCandidates.length,
    groupCandidateCount: relevantGroup.length,
    languageSummary,
    expectedPathDispositionSha256: sha256Buffer(Buffer.from(stableJson(identityProjection(expectedPaths)), "utf8")),
    canonicalCandidateSetSha256: sha256Buffer(Buffer.from(stableJson(identityProjection(present)), "utf8")),
    missingPathSetSha256: sha256Buffer(Buffer.from(stableJson(missing.map(({path: candidatePath}) => candidatePath)), "utf8")),
    expectedPaths,
    unmatchedCandidates,
  };
}

async function verifySourceRecord(root, record) {
  const relativePath = `${ARCHIVE_ROOT}/${record.path}`;
  const binding = await readRegularFile(root, relativePath, {source: true});
  invariant(binding.byteCount === Number(record.bytes), `${record.path} byte count differs from catalog`);
  invariant(binding.sha256 === record.sha256, `${record.path} SHA-256 differs from catalog`);
  return {path: relativePath, sha256: binding.sha256, bytes: binding.byteCount, mode: binding.mode};
}

async function verifyMissingSource(root, catalogPath) {
  const relativePath = `${ARCHIVE_ROOT}/${catalogPath}`;
  const absolute = within(root, relativePath);
  const archiveResolved = await realpath(within(root, ARCHIVE_ROOT));
  let ancestor = path.dirname(absolute);
  let ancestorResolved = null;
  while (!ancestorResolved) {
    try {
      ancestorResolved = await realpath(ancestor);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(ancestor);
      invariant(parent !== ancestor, `no existing ancestor for missing path: ${catalogPath}`);
      ancestor = parent;
    }
  }
  invariant(ancestorResolved === archiveResolved || ancestorResolved.startsWith(`${archiveResolved}${path.sep}`),
    `missing-path parent escapes archive: ${catalogPath}`);
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`path represented as missing now exists: ${catalogPath}`);
}

function manifestAudioProjection(manifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    animationId: manifest.animationId,
    source: {
      swf: manifest.source?.swf,
      swfSha256: manifest.source?.swfSha256,
      placementPath: manifest.source?.placementPath,
    },
    classification: {
      collection: manifest.classification?.collection,
      grade: manifest.classification?.grade,
      lesson: manifest.classification?.lesson,
      section: manifest.classification?.section,
      page: manifest.classification?.page,
    },
    localization: {
      bilingualRequired: manifest.localization?.bilingualRequired,
      languages: manifest.localization?.languages,
    },
    audio: {
      required: manifest.audio?.required,
      languages: manifest.audio?.languages,
      catalogExactAssociations: manifest.audio?.catalogExactAssociations,
      catalogGroupCandidates: manifest.audio?.catalogGroupCandidates,
      cues: manifest.audio?.cues,
      inventoryFile: manifest.audio?.inventoryFile,
    },
  };
}

function sourceEntry(sourceByPath, catalogPath) {
  const record = sourceByPath.get(catalogPath);
  invariant(record, `source catalog is missing ${catalogPath}`);
  return record;
}

function exactSource(variantBinding, id) {
  const matches = (variantBinding.sources || []).filter((source) => source.id === id);
  invariant(matches.length === 1, `variant binding expected exactly one ${id} source`);
  return matches[0];
}

export async function buildReport({root = projectRoot} = {}) {
  const [
    migrationBinding,
    audioAuditBinding,
    variantBindingFile,
    sourceCatalogBinding,
    audioGroupsBinding,
    courseXmlBinding,
    hostSwfBinding,
    generatorBinding,
  ] = await Promise.all([
    readJsonBinding(root, MIGRATION_RELATIVE),
    readJsonBinding(root, AUDIO_AUDIT_RELATIVE),
    readJsonBinding(root, VARIANT_BINDING_RELATIVE),
    readJsonBinding(root, SOURCE_CATALOG_RELATIVE),
    readJsonBinding(root, AUDIO_GROUPS_RELATIVE),
    readRegularFile(root, COURSE_XML_RELATIVE, {source: true}),
    readRegularFile(root, HOST_SWF_RELATIVE, {source: true}),
    readRegularFile(root, SCRIPT_RELATIVE),
  ]);
  const manifest = migrationBinding.value;
  const audioAudit = audioAuditBinding.value;
  const variantBinding = variantBindingFile.value;
  const sourceCatalog = sourceCatalogBinding.value;
  const audioGroups = audioGroupsBinding.value;

  invariant(manifest.animationId === ANIMATION_ID, "migration animationId changed");
  invariant(manifest.source?.swf?.endsWith(`/${REVIEW_SWF_CATALOG_PATH}`), "migration no longer selects the Review SWF");
  invariant(manifest.audio?.required === true && manifest.audio?.catalogGroupCandidates?.length === 1 &&
    manifest.audio.catalogGroupCandidates[0] === AUDIO_GROUP_ID && manifest.audio?.cues?.length === 0,
  "migration audio candidate boundary changed");
  invariant(manifest.localization?.bilingualRequired === true &&
    JSON.stringify(manifest.localization.languages) === JSON.stringify(["en", "es"]),
  "migration bilingual requirement changed");
  invariant(sourceCatalog.schemaVersion === 1 && sourceCatalog.fileCount === 7919 && Array.isArray(sourceCatalog.files),
    "source-files catalog schema/scope changed");
  invariant(audioGroups.schemaVersion === 1 && Array.isArray(audioGroups.groups), "audio-groups catalog schema changed");

  const sourceByPath = new Map();
  for (const record of sourceCatalog.files) {
    invariant(!sourceByPath.has(record.path), `duplicate source catalog path: ${record.path}`);
    sourceByPath.set(record.path, record);
  }
  const groupMatches = audioGroups.groups.filter(({groupId}) => groupId === AUDIO_GROUP_ID);
  invariant(groupMatches.length === 1, `expected exactly one ${AUDIO_GROUP_ID} group`);
  const audioGroup = groupMatches[0];
  invariant(audioGroup.files?.length === 129, `audio group expected 129 files, observed ${audioGroup.files?.length ?? "missing"}`);
  const groupByPath = new Map();
  for (const record of audioGroup.files) {
    invariant(!groupByPath.has(record.path), `duplicate audio-group path: ${record.path}`);
    const catalog = sourceByPath.get(record.path);
    invariant(catalog && catalog.sha256 === record.sha256 && Number(catalog.bytes) === Number(record.bytes),
      `audio-group record differs from source catalog: ${record.path}`);
    invariant(record.language === (record.path.includes("/EA/") ? "en" : record.path.includes("/SA/") ? "es" : null),
      `audio-group language/path mismatch: ${record.path}`);
    groupByPath.set(record.path, record);
  }

  const activeSource = sourceEntry(sourceByPath, ACTIVE_SWF_CATALOG_PATH);
  const reviewSource = sourceEntry(sourceByPath, REVIEW_SWF_CATALOG_PATH);
  invariant(manifest.source.swfSha256 === reviewSource.sha256, "migration Review SWF hash differs from source catalog");
  const [activeSourceBinding, reviewSourceBinding] = await Promise.all([
    verifySourceRecord(root, activeSource),
    verifySourceRecord(root, reviewSource),
  ]);
  invariant(hostSwfBinding.sha256 === audioAudit.authority?.hostScript?.sha256,
    "host SWF bytes differ from the audio audit binding");
  invariant(courseXmlBinding.sha256 === variantBinding.courseXml?.sha256,
    "course XML bytes differ from the variant binding");
  invariant(variantBinding.bindingStatus === "source-variant-relationship-proven-runtime-host-unresolved",
    "variant binding no longer preserves the unresolved host boundary");
  invariant(variantBinding.strictAcceptanceEffect?.startsWith("none;"), "variant binding claims strict acceptance effect");
  const boundActive = exactSource(variantBinding, "active-course-placement");
  const boundReview = exactSource(variantBinding, "review-pilot-source");
  invariant(boundActive.sha256 === activeSource.sha256 && boundReview.sha256 === reviewSource.sha256,
    "variant binding source hashes differ from the frozen catalog");
  invariant(variantBinding.courseXml?.activeBasenameMatches?.length === 1 &&
    variantBinding.courseXml.activeBasenameMatches[0].text.includes(">FQ/L6FQ02.swf</Page>") &&
    variantBinding.courseXml.reviewExactPlacementCount === 0,
  "variant binding active/Review XML placement facts changed");
  const variantGenerator = await readRegularFile(root, variantBinding.generator?.path || "");
  invariant(variantGenerator.sha256 === variantBinding.generator?.sha256, "variant-binding generator hash is stale");

  invariant(audioAudit.schemaVersion === 2 && audioAudit.animationId === ANIMATION_ID,
    "audio audit schema or animationId changed");
  invariant(audioAudit.source?.observedSha256 === reviewSource.sha256 && audioAudit.source?.hashMatches === true,
    "audio audit no longer binds the selected Review SWF");
  invariant(audioAudit.inventory?.rowCount === 0 && audioAudit.externalAudio?.exactCount === 0 &&
    audioAudit.externalAudio?.candidateOnlyCount === 129 && audioAudit.externalAudio?.missingExpectedCount === 182,
  "audio audit cue/candidate/missing boundary changed");
  invariant(audioAudit.acceptance?.authoritativeListeningComplete === false &&
    audioAudit.acceptance?.hostStateTraversalComplete === false &&
    audioAudit.acceptance?.synchronizationComplete === false &&
    audioAudit.acceptance?.strictAudioAcceptance === "pending",
  "audio audit authority boundary changed");
  const auditGenerator = await readRegularFile(root, audioAudit.generatedBy);

  const activeMatrix = deriveRouteMatrix({
    routeId: "active-course-xml-url",
    baseDirectory: "HELP_COURSES/ELMGR3/L6/FQ",
    sourceByPath,
    groupByPath,
  });
  const reviewMatrix = deriveRouteMatrix({
    routeId: "preserved-review-url",
    baseDirectory: "HELP_COURSES/ELMGR3/L6/FQ/Review",
    sourceByPath,
    groupByPath,
  });
  invariant(activeMatrix.canonicalPathCandidateCount === 128 && activeMatrix.missingSourceCount === 182 &&
    activeMatrix.unmatchedCandidateCount === 1 && activeMatrix.groupCandidateCount === 129,
  "active FQ route no longer reconciles 128 canonical + 1 anomaly = 129 candidates and 182 missing");
  invariant(activeMatrix.unmatchedCandidates[0]?.path === "HELP_COURSES/ELMGR3/L6/FQ/EA/Q20B_.mp3",
    "active FQ unmatched candidate is no longer Q20B_.mp3");
  invariant(reviewMatrix.canonicalPathCandidateCount === 0 && reviewMatrix.missingSourceCount === 310 &&
    reviewMatrix.unmatchedCandidateCount === 0 && reviewMatrix.groupCandidateCount === 0,
  "preserved Review route no longer resolves to 0 present / 310 missing");

  const auditMatrix = audioAudit.externalAudio.sourceDerivedExpectedUrlMatrix;
  invariant(auditMatrix?.summary?.expectedPathCount === 310 && auditMatrix.summary.exactPathPresentCount === 128 &&
    auditMatrix.summary.missingSourceCount === 182 && auditMatrix.summary.unmatchedCandidateAnomalyCount === 1,
  "audio audit source-derived active-route summary changed");
  const auditExpected = new Map((auditMatrix.expectedPaths || []).map((row) => [portable(row.sourceFile).replace(`${ARCHIVE_ROOT}/`, ""), row]));
  invariant(auditExpected.size === 310, "audio audit active-route expected path set is incomplete");
  for (const row of activeMatrix.expectedPaths) {
    const audited = auditExpected.get(row.path);
    invariant(audited, `audio audit omits active-route path ${row.path}`);
    const expectedStatus = row.source ? "exact-path-present-candidate-not-promoted" : "missing-source";
    invariant(audited.status === expectedStatus && audited.cuePromoted === false,
      `audio audit disposition differs for ${row.path}`);
    if (row.source) invariant(audited.observed?.sha256 === row.source.sha256 && Number(audited.observed?.bytes) === Number(row.source.bytes),
      `audio audit candidate bytes differ for ${row.path}`);
  }

  const verifiedGroupSources = [];
  for (const record of [...groupByPath.values()].sort((left, right) => compareText(left.path, right.path))) {
    verifiedGroupSources.push(await verifySourceRecord(root, record));
  }
  const distinctMissing = new Set([
    ...activeMatrix.expectedPaths.filter(({source}) => !source).map(({path: candidatePath}) => candidatePath),
    ...reviewMatrix.expectedPaths.filter(({source}) => !source).map(({path: candidatePath}) => candidatePath),
  ]);
  for (const missingPath of [...distinctMissing].sort(compareText)) await verifyMissingSource(root, missingPath);

  const manifestProjection = manifestAudioProjection(manifest);
  const routeCandidates = [
    {
      routeId: reviewMatrix.routeId,
      loadedSwfPath: REVIEW_SWF_CATALOG_PATH,
      selectedPilotBinarySha256: reviewSource.sha256,
      pathBinaryMatchesSelectedPilot: true,
      activeCourseXmlExactPlacement: false,
      routeAdmitted: false,
      cuePromotionPerformed: false,
      disposition: "selected-pilot-path-has-no-source-proven-active-host-placement-and-no-audio-files",
      nonAdmissionReasons: [
        "The frozen active course XML never names FQ/Review/L6FQ02.swf, so no authoritative historical host entry or _global.playSwfFileName is proven for this route.",
        "The source-bound host algorithm would request Review/EA and Review/SA, where all 310 canonical files are absent.",
      ],
      matrix: reviewMatrix,
    },
    {
      routeId: activeMatrix.routeId,
      loadedSwfPath: ACTIVE_SWF_CATALOG_PATH,
      selectedPilotBinarySha256: reviewSource.sha256,
      binaryAtFrozenPathSha256: activeSource.sha256,
      pathBinaryMatchesSelectedPilot: false,
      activeCourseXmlExactPlacement: true,
      routeAdmitted: false,
      cuePromotionPerformed: false,
      disposition: "active-xml-path-binds-a-distinct-binary-and-review-byte-deployment-provenance-is-absent",
      nonAdmissionReasons: [
        "The frozen active XML names FQ/L6FQ02.swf, but the frozen binary at that path has a different SHA-256 from the selected Review pilot.",
        "No archive/deployment evidence proves that the exact Review SHA-256 was historically served at the active URL.",
        "Even under this unresolved route, only 128 canonical paths are present, 182 are missing, and Q20B_.mp3 is not emitted by the host naming algorithm.",
      ],
      matrix: activeMatrix,
    },
  ];

  return {
    schemaVersion: 1,
    artifactType: "help-math-fq002-audio-route-resolution-candidates",
    animationId: ANIMATION_ID,
    status: "machine-route-matrices-complete-historical-route-unresolved",
    scope: "deterministic-read-only-path-byte-and-source-provenance-candidate-manifest",
    authorityStatement: [
      "This report proves the complete file/path consequences of the two source-evidenced FQ002 load URLs and re-hashes every one of the 129 preserved lesson-group MP3 candidates.",
      "It does not prove which URL historically served the selected Review bytes, runtime reachability, spoken content, language by listening, activation timing, synchronization, or Replay behavior.",
      "Neither route is admitted and no candidate is promoted to an audio cue, listening record, strict gate, human review, owner acceptance, or completion evidence.",
    ],
    generator: {
      path: SCRIPT_RELATIVE,
      sha256: generatorBinding.sha256,
      serialization: "recursive-key-sorted-pretty-json-with-terminal-lf-v1",
    },
    bindings: {
      migrationAudioProjection: {
        path: MIGRATION_RELATIVE,
        projection: manifestProjection,
        projectionSha256: sha256Buffer(Buffer.from(stableJson(manifestProjection), "utf8")),
        excludedAuthorityFields: ["status", "review", "acceptance", "qa"],
      },
      audioAudit: {
        path: AUDIO_AUDIT_RELATIVE,
        sha256: audioAuditBinding.sha256,
        generatorPath: audioAudit.generatedBy,
        generatorSha256: auditGenerator.sha256,
      },
      variantBinding: {
        path: VARIANT_BINDING_RELATIVE,
        sha256: variantBindingFile.sha256,
        generatorPath: variantBinding.generator.path,
        generatorSha256: variantGenerator.sha256,
      },
      sourceCatalog: {
        path: SOURCE_CATALOG_RELATIVE,
        sha256: sourceCatalogBinding.sha256,
        schemaVersion: sourceCatalog.schemaVersion,
        fileCount: sourceCatalog.fileCount,
        totalBytes: sourceCatalog.totalBytes,
        checksumSetSha256: sourceCatalog.checksumSetSha256,
      },
      audioGroupsCatalog: {
        path: AUDIO_GROUPS_RELATIVE,
        sha256: audioGroupsBinding.sha256,
        groupId: AUDIO_GROUP_ID,
        groupFileCount: audioGroup.files.length,
        groupProjectionSha256: sha256Buffer(Buffer.from(stableJson(audioGroup), "utf8")),
      },
      courseXml: {path: COURSE_XML_RELATIVE, sha256: courseXmlBinding.sha256, bytes: courseXmlBinding.byteCount},
      hostSwf: {path: HOST_SWF_RELATIVE, sha256: hostSwfBinding.sha256, bytes: hostSwfBinding.byteCount},
      selectedReviewSwf: reviewSourceBinding,
      activeCourseSwf: activeSourceBinding,
    },
    sourceVerification: {
      audioPlaybackPerformed: false,
      metadataProbePerformedByThisGenerator: false,
      groupSourceFileCount: verifiedGroupSources.length,
      groupSourceFilesRehashed: verifiedGroupSources.length,
      groupSourceBytes: verifiedGroupSources.reduce((sum, record) => sum + record.bytes, 0),
      groupSourceSetSha256: sha256Buffer(Buffer.from(stableJson(verifiedGroupSources.map(({path: sourcePath, sha256, bytes}) => ({path: sourcePath, sha256, bytes}))), "utf8")),
      distinctMissingPathsCheckedOnDisk: distinctMissing.size,
    },
    candidateReconciliation: {
      catalogAudioGroupCandidateCount: audioGroup.files.length,
      canonicalActiveRouteCandidateCount: activeMatrix.canonicalPathCandidateCount,
      unmatchedActiveRouteCandidateCount: activeMatrix.unmatchedCandidateCount,
      equation: "128 canonical active-route candidates + 1 unmatched Q20B_.mp3 candidate = 129 catalog audio-group candidates",
      reconciled: activeMatrix.canonicalPathCandidateCount + activeMatrix.unmatchedCandidateCount === audioGroup.files.length,
      cueCountPromoted: 0,
    },
    routeResolution: {
      admittedRouteId: null,
      admittedRouteCount: 0,
      machineResolution: "both deterministic path matrices complete; historical selected-binary deployment URL remains unproven",
      routeCandidates,
    },
    remainingBlockers: [
      "Source or owner archive provenance must bind the exact selected Review SWF SHA-256 to its historical deployed URL and host/configuration values; this report cannot choose a route.",
      "If the active URL is later proven, 182 canonical files remain missing and Q20B_.mp3 remains unmatched; no synthesized or renamed substitute may be silently introduced.",
      "If the preserved Review URL is later proven, all 310 canonical Review/EA and Review/SA files remain missing.",
      "Any path-eligible files still require authorized natural host traversal plus named-human English/Spanish listening, activation, duration, synchronization, stop/pause, and Replay review before cue or strict adoption.",
    ],
    authorityEffects: {
      audioInventoryChanged: false,
      migrationStatusChanged: false,
      strictReportChanged: false,
      completionLedgerChanged: false,
      humanReviewChanged: false,
      ownerReviewChanged: false,
      currentJavascriptApprovalChanged: false,
      strictAcceptanceEffect: "none",
    },
  };
}

export async function writeOrCheck({root = projectRoot, check = false} = {}) {
  const output = within(root, OUTPUT_RELATIVE);
  const content = stableJson(await buildReport({root}));
  if (check) {
    const existing = await readFile(output, "utf8").catch(() => null);
    invariant(existing === content, `${OUTPUT_RELATIVE} is missing or stale; rerun without --check`);
    return {mode: "CHECK", output: OUTPUT_RELATIVE, sha256: sha256Buffer(Buffer.from(content, "utf8"))};
  }
  await mkdir(path.dirname(output), {recursive: true});
  const existingMetadata = await lstat(output).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!existingMetadata || (existingMetadata.isFile() && !existingMetadata.isSymbolicLink()), `${OUTPUT_RELATIVE} is not a regular file`);
  await writeFile(output, content, "utf8");
  return {mode: "WRITE", output: OUTPUT_RELATIVE, sha256: sha256Buffer(Buffer.from(content, "utf8"))};
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const result = await writeOrCheck(options);
    console.log(`${result.mode} ${result.output} sha256=${result.sha256}`);
    console.log("FQ002 audio routes: 0 admitted; cues: 0 promoted; migration/strict/review/approval state unchanged.");
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
