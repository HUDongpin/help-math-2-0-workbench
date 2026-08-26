#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_QUARANTINE_ROOT =
  "/Volumes/WestWorld/HELP MATH Related Files/Google Drive Source Intake/2026-08-02-HELP-ELM-FINAL-Dec21-2015";
const DEFAULT_OUTPUT_RELATIVE =
  "catalog/source-promotions/g4-active-source-promotion-2026-08-02.json";
const G4_PREFIX = "HELP_COURSES/ELMGR4/";
const CANONICAL_SOURCE_ROOT_RELATIVE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES";
const HOST_SWF_CANONICAL_PATH = "HELP_COURSES/indexELM.swf";
const HOST_AUDIO_EVIDENCE_RELATIVE =
  "migrations/course-g05-l13-rw-002/audit/audio-runtime-evidence.json";
const HOST_ACTION_SCRIPT_RELATIVE =
  "migrations/course-g05-l13-rw-002/audit/original-host-entry/ffdec-scripts/frame_35/DoAction.as";
const PINNED_INTAKE_INPUT_SHA256 = Object.freeze({
  intakePlan: "ff6b31f75d246f33834af9686b035f614a27ae2bbbc30e4b5975773863a0634f",
  quarantineManifest: "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
  intakeReceipt: "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
});

const KNOWN = Object.freeze({
  activePageOccurrences: 645,
  activePageUniquePaths: 645,
  activeMissingSwf: 202,
  activeMissingSwfBytes: 66_357_314,
  pairedFla: 163,
  swfOnly: 39,
  copyFla: 143,
  copyFlaBytes: 288_004_854,
  existingFla: 20,
  lessonXmlBindings: 9,
  ordinaryAudioExpected: 183,
  ordinaryAudioExisting: 80,
  ordinaryAudioCopy: 95,
  ordinaryAudioMissing: 8,
  finalQuizUniqueLabels: 157,
  finalQuizAudioExpected: 1_570,
  finalQuizAudioExisting: 774,
  finalQuizAudioCopy: 788,
  finalQuizAudioMissing: 8,
  audioExpected: 1_753,
  audioExisting: 854,
  audioCopy: 883,
  audioCopyBytes: 80_294_405,
  audioMissing: 16,
  copyRecords: 1_228,
  copyBytes: 434_656_573,
  existingBindings: 883,
  missingDependencies: 16,
  candidateCopyRecords: 1_070,
  historicalHoldCopyRecords: 113,
  placementAliasHoldCopyRecords: 45,
});

const FQ_MARKERS = Object.freeze([
  "quizLabelArray",
  "doPlayFQQuestionAudio",
  "doPlayFQAnswerAudio",
  "EN",
  "SP",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256Text(text) {
  return sha256Bytes(Buffer.from(text, "utf8"));
}

function recordSetDigest(records) {
  const serialized = [...records]
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath))
    .map(
      ({ canonicalPath, bytes, sha256 }) =>
        `${canonicalPath}\t${bytes}\t${sha256}\n`,
    )
    .join("");
  return sha256Text(serialized);
}

function pathSetDigest(records) {
  const serialized = [...records]
    .map(({ canonicalPath }) => canonicalPath)
    .sort(compareText)
    .map((canonicalPath) => `${canonicalPath}\n`)
    .join("");
  return sha256Text(serialized);
}

function parseSourceManifest(text) {
  const records = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
      invariant(match, `Invalid source manifest line ${index + 1}`);
      invariant(!/[\r\n]/.test(match[2]), `Invalid manifest path on line ${index + 1}`);
      return { path: match[2], sha256: match[1] };
    });
  indexByPath(records, "source manifest");
  return records;
}

function renderSourceManifest(records, comparator = compareText) {
  return `${[...records]
    .sort((left, right) => comparator(left.path, right.path))
    .map(({ path: sourcePath, sha256 }) => `${sha256}  ${sourcePath}`)
    .join("\n")}\n`;
}

function buildExpectedPostManifest({ baseManifestText, sourceFiles, copyRecords }) {
  const manifestRecords = parseSourceManifest(baseManifestText);
  const manifestByPath = indexByPath(manifestRecords, "source manifest");
  const sourceByPath = indexByPath(sourceFiles, "source catalog projection");
  invariant(
    manifestRecords.length === sourceFiles.length,
    "Source manifest and catalog file counts disagree",
  );
  for (const source of sourceFiles) {
    const manifest = manifestByPath.get(source.path);
    invariant(manifest, `Source manifest lacks catalog path ${source.path}`);
    invariant(manifest.sha256 === source.sha256, `Source manifest hash drift: ${source.path}`);
  }
  const projected = sourceFiles.map(({ path: sourcePath, bytes, sha256 }) => ({
    path: sourcePath,
    bytes,
    sha256,
  }));
  for (const copy of copyRecords) {
    invariant(!sourceByPath.has(copy.canonicalPath), `Projected copy already exists: ${copy.canonicalPath}`);
    projected.push({ path: copy.canonicalPath, bytes: copy.bytes, sha256: copy.sha256 });
  }
  const freezeSerialized = renderSourceManifest(projected, (left, right) =>
    left.localeCompare(right, "en"),
  );
  const catalogSerialized = renderSourceManifest(projected, compareText);
  const recordSet = projected.map(({ path: canonicalPath, bytes, sha256 }) => ({
    canonicalPath,
    bytes,
    sha256,
  }));
  return {
    baseManifestSha256: sha256Text(baseManifestText),
    baseFileCount: sourceFiles.length,
    baseTotalBytes: sourceFiles.reduce((sum, record) => sum + record.bytes, 0),
    addedFileCount: copyRecords.length,
    addedTotalBytes: copyRecords.reduce((sum, record) => sum + record.bytes, 0),
    postFileCount: projected.length,
    postTotalBytes: projected.reduce((sum, record) => sum + record.bytes, 0),
    manifestSha256: sha256Text(freezeSerialized),
    manifestOrdering: 'path.localeCompare(otherPath, "en") as used by freeze-help-math-sources.mjs',
    checksumSetSha256: sha256Text(catalogSerialized),
    checksumSetOrdering: "Unicode code-point path order as used by build-help-math-catalog.mjs",
    recordsSha256: recordSetDigest(recordSet),
    recordsAlgorithm: "sha256(sorted path<TAB>bytes<TAB>sha256<LF>)",
    reconstruction:
      "parse the pinned base source-manifest, add every copyRecords canonicalPath/sha256, sort with the declared ordering, and serialize sha256 two spaces path LF",
  };
}

function assertUniquePaths(records, label) {
  const seen = new Set();
  for (const record of records) {
    invariant(
      typeof record.canonicalPath === "string" && record.canonicalPath !== "",
      `${label} contains a record without canonicalPath`,
    );
    invariant(!seen.has(record.canonicalPath), `${label} duplicates ${record.canonicalPath}`);
    seen.add(record.canonicalPath);
  }
}

function indexByPath(records, label) {
  const result = new Map();
  for (const record of records) {
    invariant(
      record && typeof record.path === "string",
      `${label} contains a record without path`,
    );
    invariant(!result.has(record.path), `${label} duplicates ${record.path}`);
    result.set(record.path, record);
  }
  return result;
}

function indexByCanonicalPath(records, label) {
  const result = new Map();
  for (const record of records) {
    invariant(
      record && typeof record.canonicalPath === "string",
      `${label} contains a record without canonicalPath`,
    );
    invariant(
      !result.has(record.canonicalPath),
      `${label} duplicates ${record.canonicalPath}`,
    );
    result.set(record.canonicalPath, record);
  }
  return result;
}

function quarantineManifestRelative(canonicalPath) {
  invariant(
    typeof canonicalPath === "string" &&
      canonicalPath !== "" &&
      !canonicalPath.includes("\\") &&
      !canonicalPath.includes("\0") &&
      !path.posix.isAbsolute(canonicalPath) &&
      path.posix.normalize(canonicalPath) === canonicalPath &&
      canonicalPath.split("/").every((segment) => segment !== "." && segment !== ".."),
    `Path is not a normalized portable relative path: ${canonicalPath}`,
  );
  invariant(
    canonicalPath.startsWith(G4_PREFIX),
    `Path is outside the Grade 4 quarantine scope: ${canonicalPath}`,
  );
  return canonicalPath.slice(G4_PREFIX.length);
}

function quarantineRelativePath(canonicalPath) {
  return `verified/ELMGR4/${quarantineManifestRelative(canonicalPath)}`;
}

function canonicalPhysicalRelativePath(canonicalPath) {
  return `${CANONICAL_SOURCE_ROOT_RELATIVE}/${canonicalPath}`;
}

function decodeSwfStrings(bytes) {
  invariant(Buffer.isBuffer(bytes), "SWF bytes must be a Buffer");
  invariant(bytes.length >= 8, "SWF is shorter than its eight-byte header");
  const signature = bytes.subarray(0, 3).toString("ascii");
  let body;
  if (signature === "CWS") body = inflateSync(bytes.subarray(8));
  else if (signature === "FWS") body = bytes.subarray(8);
  else if (signature === "ZWS") {
    throw new Error("LZMA-compressed ZWS is unsupported by the deterministic FQ parser");
  } else {
    throw new Error(`Unsupported SWF signature: ${JSON.stringify(signature)}`);
  }
  return {
    signature,
    version: bytes[3],
    strings: body.toString("latin1").split("\0"),
  };
}

function deriveFqQuestionLabels(bytes) {
  const decoded = decodeSwfStrings(bytes);
  const strings = new Set(decoded.strings);
  const presentMarkers = FQ_MARKERS.filter((marker) => strings.has(marker));
  const optionMappings = decoded.strings
    .map((value) => /^A(\d+)Opt([1-4])$/.exec(value))
    .filter(Boolean)
    .map((match) => ({ question: Number(match[1]), correctOption: Number(match[2]) }));

  if (presentMarkers.length === 0 && optionMappings.length === 0) {
    return {
      ...decoded,
      strings: undefined,
      audioBound: false,
      markers: [],
      questionLabels: [],
      questionCount: 0,
      evidence: "no-final-quiz-audio-contract-signals",
    };
  }

  invariant(
    presentMarkers.length === FQ_MARKERS.length,
    `Partial FQ audio contract markers: ${presentMarkers.join(", ")}`,
  );
  invariant(optionMappings.length > 0, "FQ audio contract has no A<n>Opt<1-4> mappings");
  const questionNumbers = [...new Set(optionMappings.map(({ question }) => question))].sort(
    (left, right) => left - right,
  );
  const maximum = questionNumbers.at(-1);
  const expectedNumbers = Array.from({ length: maximum }, (_, index) => index + 1);
  invariant(
    JSON.stringify(questionNumbers) === JSON.stringify(expectedNumbers),
    `FQ question mappings are not contiguous Q1..Q${maximum}`,
  );
  const questionLabels = expectedNumbers.map((number) => `Q${number}`);
  invariant(
    questionLabels.every((label) => strings.has(label)),
    "FQ option mappings are not backed by matching Q<n> labels",
  );
  return {
    ...decoded,
    strings: undefined,
    audioBound: true,
    markers: [...FQ_MARKERS],
    questionLabels,
    questionCount: questionLabels.length,
    evidence: "complete-host-call-markers-plus-contiguous-quiz-label-and-option-mappings",
  };
}

function deriveOrdinarySpanishAudioPath(target) {
  const occurrence = target.occurrences?.[0];
  invariant(occurrence, `${target.expectedPath} has no course XML occurrence`);
  const sectionNumber = occurrence.section?.number;
  const pageOrdinal = occurrence.page?.ordinal;
  const eligible =
    (sectionNumber >= 2 && sectionNumber <= 6) ||
    (sectionNumber === 7 && pageOrdinal !== 1);
  if (!eligible) return null;
  const lessonMatch = /^HELP_COURSES\/ELMGR4\/(L\d+)\//.exec(target.expectedPath);
  invariant(lessonMatch, `Cannot derive lesson from ${target.expectedPath}`);
  const basename = path.posix.basename(target.expectedPath, ".swf");
  return `${G4_PREFIX}${lessonMatch[1]}/SA/${basename}.mp3`;
}

function selectGrade4ActiveMissingSwfs(missingReferences) {
  invariant(Array.isArray(missingReferences?.course), "missing-references.course is not an array");
  const selected = missingReferences.course
    .filter((record) =>
      record.occurrences?.some(
        (occurrence) =>
          occurrence.grade === 4 &&
          occurrence.sourceXmlPath?.startsWith(G4_PREFIX) &&
          occurrence.expectedPath === record.expectedPath,
      ),
    )
    .map((record) => ({
      expectedPath: record.expectedPath,
      occurrences: record.occurrences.filter((occurrence) => occurrence.grade === 4),
    }))
    .sort((left, right) => compareText(left.expectedPath, right.expectedPath));
  invariant(
    selected.every(({ expectedPath }) => expectedPath.startsWith(G4_PREFIX) && expectedPath.endsWith(".swf")),
    "Grade 4 missing-reference selection contains a non-SWF or out-of-scope path",
  );
  const paths = selected.map(({ expectedPath }) => expectedPath);
  invariant(new Set(paths).size === paths.length, "Grade 4 missing SWF selection is not unique");
  return selected;
}

function deriveActivePageIdentity(animations, missingTargets) {
  invariant(Array.isArray(animations?.animations), "animations.animations is not an array");
  const resolvedOccurrences = animations.animations.flatMap((animation) =>
    (animation.references?.courseXml ?? [])
      .filter(
        (reference) =>
          reference.sourceXmlPath?.startsWith(G4_PREFIX) &&
          reference.expectedPath?.startsWith(G4_PREFIX),
      )
      .map((reference) => reference.expectedPath),
  );
  const missingOccurrences = missingTargets.flatMap((target) =>
    target.occurrences.map((occurrence) => occurrence.expectedPath),
  );
  const allOccurrences = [...resolvedOccurrences, ...missingOccurrences];
  return {
    occurrenceCount: allOccurrences.length,
    uniquePathCount: new Set(allOccurrences).size,
    sortedPathSetSha256: sha256Text(
      [...new Set(allOccurrences)].sort(compareText).map((value) => `${value}\n`).join(""),
    ),
  };
}

function addAudioRequirement(requirements, canonicalPath, bindingReason, requiredBy, kind) {
  const current = requirements.get(canonicalPath) ?? {
    canonicalPath,
    sourceType: "runtime-bound-audio",
    bindingReason,
    audioBindingKind: kind,
    requiredBy: new Set(),
  };
  invariant(
    current.bindingReason === bindingReason && current.audioBindingKind === kind,
    `Conflicting audio derivations for ${canonicalPath}`,
  );
  current.requiredBy.add(requiredBy);
  requirements.set(canonicalPath, current);
}

async function deriveAudioRequirements({ targets, readTargetSwf }) {
  const requirements = new Map();
  const fqTargetEvidence = [];
  for (const target of targets) {
    const occurrence = target.occurrences[0];
    invariant(
      target.occurrences.length === 1,
      `${target.expectedPath} must have exactly one active Grade 4 occurrence`,
    );
    const ordinaryPath = deriveOrdinarySpanishAudioPath(target);
    if (ordinaryPath) {
      addAudioRequirement(
        requirements,
        ordinaryPath,
        "host-spanish-page-audio-same-basename-SA",
        target.expectedPath,
        "ordinary-spanish-page",
      );
    }
    if (occurrence.section?.number !== 8) continue;
    const analysis = deriveFqQuestionLabels(await readTargetSwf(target.expectedPath));
    fqTargetEvidence.push({
      canonicalPath: target.expectedPath,
      swfSignature: analysis.signature,
      swfVersion: analysis.version,
      audioBound: analysis.audioBound,
      questionLabels: analysis.questionLabels,
      questionCount: analysis.questionCount,
      markers: analysis.markers,
      evidence: analysis.evidence,
    });
    for (const questionLabel of analysis.questionLabels) {
      for (const languageDirectory of ["EA", "SA"]) {
        for (const suffix of ["", "A", "B", "C", "D"]) {
          const lesson = /^HELP_COURSES\/ELMGR4\/(L\d+)\//.exec(target.expectedPath)?.[1];
          invariant(lesson, `Cannot derive FQ lesson from ${target.expectedPath}`);
          addAudioRequirement(
            requirements,
            `${G4_PREFIX}${lesson}/FQ/${languageDirectory}/${questionLabel}${suffix}.mp3`,
            "host-final-quiz-EA-SA-route-plus-target-quiz-label-and-four-option-contract",
            target.expectedPath,
            "final-quiz-question-answer",
          );
        }
      }
    }
  }
  const records = [...requirements.values()]
    .map((record) => ({ ...record, requiredBy: [...record.requiredBy].sort(compareText) }))
    .sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  return {
    records,
    fqTargetEvidence: fqTargetEvidence.sort((left, right) =>
      compareText(left.canonicalPath, right.canonicalPath),
    ),
  };
}

function verifyIntakeRecordAgainstManifest(intakeRecord, manifestByPath) {
  invariant(intakeRecord.conflictStatus === "none", `${intakeRecord.canonicalPath} has an intake conflict`);
  const manifest = manifestByPath.get(intakeRecord.manifestRelativePath);
  invariant(manifest, `Quarantine manifest is missing ${intakeRecord.manifestRelativePath}`);
  invariant(
    manifest.bytes === intakeRecord.bytes && manifest.sha256 === intakeRecord.sha256,
    `Intake plan and manifest disagree for ${intakeRecord.canonicalPath}`,
  );
  invariant(
    intakeRecord.manifestRelativePath === quarantineManifestRelative(intakeRecord.canonicalPath),
    `Unexpected quarantine placement for ${intakeRecord.canonicalPath}`,
  );
  return manifest;
}

function reviewDecisionFor(intakeRecord, canonicalByPath) {
  if (intakeRecord.disposition === "candidate-new-source-in-quarantine") {
    return {
      reviewDecision: "promote-in-this-transaction",
      reviewEvidence:
        "owner-authorized quarantine bytes occupy the exact active/runtime-bound canonical path and have no recorded conflict",
    };
  }
  if (intakeRecord.disposition === "hold-historical-custody-review") {
    invariant(
      intakeRecord.historicalHashMatchRefs?.length > 0,
      `${intakeRecord.canonicalPath} historical hold lacks hash-bound historical evidence`,
    );
    return {
      reviewDecision: "promote-in-this-transaction",
      reviewEvidence:
        "reviewed: owner-authorized quarantine exact bytes are required at this active/runtime-bound path; the historical duplicate is custody evidence, not a path conflict",
    };
  }
  if (intakeRecord.disposition === "hold-placement-alias-review") {
    invariant(
      intakeRecord.canonicalHashMatchPaths?.length > 0,
      `${intakeRecord.canonicalPath} alias hold has no recorded alternate canonical path`,
    );
    for (const aliasPath of intakeRecord.canonicalHashMatchPaths) {
      const alias = canonicalByPath.get(aliasPath);
      invariant(alias, `${intakeRecord.canonicalPath} alias target is absent: ${aliasPath}`);
      invariant(
        alias.sha256 === intakeRecord.sha256 && alias.bytes === intakeRecord.bytes,
        `${intakeRecord.canonicalPath} alias bytes disagree with ${aliasPath}`,
      );
    }
    return {
      reviewDecision: "promote-in-this-transaction",
      reviewEvidence:
        "reviewed: the active/runtime-bound exact placement is required and its bytes match the recorded alternate canonical placement",
    };
  }
  throw new Error(
    `${intakeRecord.canonicalPath} has unsupported copy disposition ${intakeRecord.disposition}`,
  );
}

function makeCopyRecord({ intakeRecord, sourceType, bindingReason, canonicalByPath, requiredBy = [] }) {
  invariant(
    !canonicalByPath.has(intakeRecord.canonicalPath),
    `Copy record already exists canonically: ${intakeRecord.canonicalPath}`,
  );
  const review = reviewDecisionFor(intakeRecord, canonicalByPath);
  return {
    canonicalPath: intakeRecord.canonicalPath,
    quarantineRelativePath: quarantineRelativePath(intakeRecord.canonicalPath),
    bytes: intakeRecord.bytes,
    sha256: intakeRecord.sha256,
    sourceType,
    priorIntakeDecision: intakeRecord.intakeDecision,
    priorDisposition: intakeRecord.disposition,
    ...review,
    bindingReason,
    requiredBy,
  };
}

function makeExistingBinding({
  canonicalRecord,
  intakeRecord,
  sourceType,
  bindingReason,
  requiredBy = [],
}) {
  invariant(intakeRecord, `Existing binding lacks quarantine counterpart: ${canonicalRecord.path}`);
  invariant(
    canonicalRecord.path === intakeRecord.canonicalPath &&
      canonicalRecord.bytes === intakeRecord.bytes &&
      canonicalRecord.sha256 === intakeRecord.sha256,
    `Existing canonical/quarantine binding mismatch: ${canonicalRecord.path}`,
  );
  return {
    canonicalPath: canonicalRecord.path,
    canonicalPhysicalRelativePath: canonicalPhysicalRelativePath(canonicalRecord.path),
    quarantineRelativePath: quarantineRelativePath(canonicalRecord.path),
    bytes: canonicalRecord.bytes,
    sha256: canonicalRecord.sha256,
    sourceType,
    reviewDecision: "retain-existing-canonical",
    bindingReason,
    requiredBy,
  };
}

function partitionAudioRequirements({ requirements, canonicalByPath, intakeByPath, manifestByPath }) {
  const copyRecords = [];
  const existingBindings = [];
  const missingDependencies = [];
  for (const requirement of requirements) {
    const canonical = canonicalByPath.get(requirement.canonicalPath);
    const intake = intakeByPath.get(requirement.canonicalPath);
    if (canonical) {
      if (intake) {
        verifyIntakeRecordAgainstManifest(intake, manifestByPath);
        invariant(
          intake.bytes === canonical.bytes && intake.sha256 === canonical.sha256,
          `Canonical/quarantine audio mismatch at ${requirement.canonicalPath}`,
        );
      }
      existingBindings.push(
        makeExistingBinding({
          canonicalRecord: canonical,
          intakeRecord: intake,
          sourceType: requirement.sourceType,
          bindingReason: requirement.bindingReason,
          requiredBy: requirement.requiredBy,
        }),
      );
    } else if (intake) {
      verifyIntakeRecordAgainstManifest(intake, manifestByPath);
      copyRecords.push(
        makeCopyRecord({
          intakeRecord: intake,
          sourceType: requirement.sourceType,
          bindingReason: requirement.bindingReason,
          canonicalByPath,
          requiredBy: requirement.requiredBy,
        }),
      );
    } else {
      missingDependencies.push({
        canonicalPath: requirement.canonicalPath,
        sourceType: requirement.sourceType,
        bindingReason: requirement.bindingReason,
        audioBindingKind: requirement.audioBindingKind,
        requiredBy: requirement.requiredBy,
        resolution: "absent-from-current-canonical-and-owner-authorized-quarantine",
      });
    }
  }
  return { copyRecords, existingBindings, missingDependencies };
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

async function verifyPhysicalRecords({ records, root, relativeField, label, concurrency = 8 }) {
  return mapConcurrent(records, concurrency, async (record) => {
    const relative = record[relativeField];
    invariant(typeof relative === "string", `${label} record lacks ${relativeField}`);
    const physicalPath = path.resolve(root, relative);
    const relativeCheck = path.relative(path.resolve(root), physicalPath);
    invariant(
      relativeCheck !== "" && !relativeCheck.startsWith("..") && !path.isAbsolute(relativeCheck),
      `${label} path escapes its root: ${relative}`,
    );
    const info = await lstat(physicalPath);
    invariant(info.isFile() && !info.isSymbolicLink(), `${label} is not a regular file: ${relative}`);
    invariant(info.size === record.bytes, `${label} byte mismatch: ${relative}`);
    const observedSha256 = await sha256File(physicalPath);
    invariant(observedSha256 === record.sha256, `${label} SHA-256 mismatch: ${relative}`);
    return { canonicalPath: record.canonicalPath, bytes: info.size, sha256: observedSha256 };
  });
}

function countsBy(records, field) {
  const result = {};
  for (const record of records) result[record[field]] = (result[record[field]] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => compareText(left, right)));
}

function bytesBySourceType(records) {
  const result = {};
  for (const record of records) result[record.sourceType] = (result[record.sourceType] ?? 0) + record.bytes;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => compareText(left, right)));
}

function summarizeRecordSet(records) {
  return {
    count: records.length,
    totalBytes: records.reduce((sum, record) => sum + record.bytes, 0),
    bySourceType: countsBy(records, "sourceType"),
    bytesBySourceType: bytesBySourceType(records),
    recordSetSha256: recordSetDigest(records),
    recordSetAlgorithm: "sha256(sorted canonicalPath<TAB>bytes<TAB>sha256<LF>)",
  };
}

function assertKnownCounts({
  activeIdentity,
  missingTargets,
  copyRecords,
  existingBindings,
  missingDependencies,
  audioRequirements,
  fqTargetEvidence,
}) {
  const copyByType = countsBy(copyRecords, "sourceType");
  const copyBytesByType = bytesBySourceType(copyRecords);
  const existingByType = countsBy(existingBindings, "sourceType");
  const dispositionCounts = countsBy(copyRecords, "priorDisposition");
  const ordinary = audioRequirements.filter(
    ({ audioBindingKind }) => audioBindingKind === "ordinary-spanish-page",
  );
  const fq = audioRequirements.filter(
    ({ audioBindingKind }) => audioBindingKind === "final-quiz-question-answer",
  );
  const existingOrdinary = existingBindings.filter(
    ({ sourceType, bindingReason }) =>
      sourceType === "runtime-bound-audio" && bindingReason.includes("spanish-page"),
  );
  const copyOrdinary = copyRecords.filter(
    ({ sourceType, bindingReason }) =>
      sourceType === "runtime-bound-audio" && bindingReason.includes("spanish-page"),
  );
  const missingOrdinary = missingDependencies.filter(
    ({ audioBindingKind }) => audioBindingKind === "ordinary-spanish-page",
  );
  const uniqueFqLabelsByLesson = new Map();
  for (const evidence of fqTargetEvidence.filter(({ audioBound }) => audioBound)) {
    const lesson = /^HELP_COURSES\/ELMGR4\/(L\d+)\//.exec(evidence.canonicalPath)?.[1];
    invariant(lesson, `Cannot derive lesson for ${evidence.canonicalPath}`);
    const labels = uniqueFqLabelsByLesson.get(lesson) ?? new Set();
    evidence.questionLabels.forEach((label) => labels.add(label));
    uniqueFqLabelsByLesson.set(lesson, labels);
  }
  const uniqueFqLabelCount = [...uniqueFqLabelsByLesson.values()].reduce(
    (sum, labels) => sum + labels.size,
    0,
  );
  const checks = [
    [activeIdentity.occurrenceCount, KNOWN.activePageOccurrences, "active page occurrences"],
    [activeIdentity.uniquePathCount, KNOWN.activePageUniquePaths, "active unique page paths"],
    [missingTargets.length, KNOWN.activeMissingSwf, "active missing SWF"],
    [copyByType["active-page-swf"], KNOWN.activeMissingSwf, "copy SWF"],
    [copyBytesByType["active-page-swf"], KNOWN.activeMissingSwfBytes, "copy SWF bytes"],
    [copyByType["same-path-fla"], KNOWN.copyFla, "copy FLA"],
    [copyBytesByType["same-path-fla"], KNOWN.copyFlaBytes, "copy FLA bytes"],
    [existingByType["same-path-fla"], KNOWN.existingFla, "existing FLA"],
    [existingByType["lesson-xml-binding"], KNOWN.lessonXmlBindings, "XML bindings"],
    [ordinary.length, KNOWN.ordinaryAudioExpected, "ordinary audio expected"],
    [existingOrdinary.length, KNOWN.ordinaryAudioExisting, "ordinary audio existing"],
    [copyOrdinary.length, KNOWN.ordinaryAudioCopy, "ordinary audio copy"],
    [missingOrdinary.length, KNOWN.ordinaryAudioMissing, "ordinary audio missing"],
    [uniqueFqLabelCount, KNOWN.finalQuizUniqueLabels, "FQ unique labels"],
    [fq.length, KNOWN.finalQuizAudioExpected, "FQ audio expected"],
    [existingByType["runtime-bound-audio"], KNOWN.audioExisting, "audio existing"],
    [copyByType["runtime-bound-audio"], KNOWN.audioCopy, "audio copy"],
    [copyBytesByType["runtime-bound-audio"], KNOWN.audioCopyBytes, "audio copy bytes"],
    [audioRequirements.length, KNOWN.audioExpected, "audio expected"],
    [missingDependencies.length, KNOWN.audioMissing, "audio missing"],
    [copyRecords.length, KNOWN.copyRecords, "copy records"],
    [copyRecords.reduce((sum, record) => sum + record.bytes, 0), KNOWN.copyBytes, "copy bytes"],
    [existingBindings.length, KNOWN.existingBindings, "existing bindings"],
    [missingDependencies.length, KNOWN.missingDependencies, "missing dependencies"],
    [dispositionCounts["candidate-new-source-in-quarantine"], KNOWN.candidateCopyRecords, "candidate copy records"],
    [dispositionCounts["hold-historical-custody-review"], KNOWN.historicalHoldCopyRecords, "historical hold copy records"],
    [dispositionCounts["hold-placement-alias-review"], KNOWN.placementAliasHoldCopyRecords, "alias hold copy records"],
  ];
  for (const [actual, expected, label] of checks) {
    invariant(actual === expected, `Known-count mismatch for ${label}: ${actual} != ${expected}`);
  }
}

async function readJsonWithEvidence(filePath, displayPath) {
  const text = await readFile(filePath, "utf8");
  return {
    value: JSON.parse(text),
    evidence: { path: displayPath, sha256: sha256Text(text), bytes: Buffer.byteLength(text) },
  };
}

async function buildPromotionPlan({
  projectRoot = defaultProjectRoot,
  quarantineRoot = DEFAULT_QUARANTINE_ROOT,
  enforceKnownCounts = true,
} = {}) {
  const projectInput = (relative) => path.join(projectRoot, relative);
  const quarantineInput = (relative) => path.join(quarantineRoot, relative);
  const inputSpecs = {
    sourceCatalog: ["catalog/source-files.json", projectInput("catalog/source-files.json")],
    animationsCatalog: ["catalog/animations.json", projectInput("catalog/animations.json")],
    lessonsCatalog: ["catalog/lessons.json", projectInput("catalog/lessons.json")],
    missingReferences: ["catalog/missing-references.json", projectInput("catalog/missing-references.json")],
    intakePlan: ["manifests/elmgr4-intake-plan.json", quarantineInput("manifests/elmgr4-intake-plan.json")],
    quarantineManifest: ["manifests/elmgr4-files.json", quarantineInput("manifests/elmgr4-files.json")],
    intakeReceipt: ["manifests/intake-receipt.json", quarantineInput("manifests/intake-receipt.json")],
    hostAudioEvidence: [HOST_AUDIO_EVIDENCE_RELATIVE, projectInput(HOST_AUDIO_EVIDENCE_RELATIVE)],
  };
  const loadedEntries = await Promise.all(
    Object.entries(inputSpecs).map(async ([key, [display, physical]]) => [
      key,
      await readJsonWithEvidence(physical, display),
    ]),
  );
  const loaded = Object.fromEntries(loadedEntries);
  for (const [key, expectedSha256] of Object.entries(PINNED_INTAKE_INPUT_SHA256)) {
    invariant(
      loaded[key].evidence.sha256 === expectedSha256,
      `Pinned intake input SHA-256 drift for ${loaded[key].evidence.path}`,
    );
  }
  const sourceCatalog = loaded.sourceCatalog.value;
  const animationsCatalog = loaded.animationsCatalog.value;
  const lessonsCatalog = loaded.lessonsCatalog.value;
  const missingReferences = loaded.missingReferences.value;
  const intakePlan = loaded.intakePlan.value;
  const quarantineManifest = loaded.quarantineManifest.value;
  const intakeReceipt = loaded.intakeReceipt.value;
  const hostAudioEvidence = loaded.hostAudioEvidence.value;
  const sourceManifestPath = projectInput("catalog/source-manifest.sha256");
  const sourceManifestText = await readFile(sourceManifestPath, "utf8");
  const sourceManifestEvidence = {
    path: "catalog/source-manifest.sha256",
    sha256: sha256Text(sourceManifestText),
    bytes: Buffer.byteLength(sourceManifestText),
  };

  invariant(sourceCatalog.schemaVersion === 1, "Unsupported source catalog schema");
  invariant(
    intakePlan.mode === "hash-manifest-plan-only-no-source-mutation",
    "Intake artifact is not the expected hash-manifest plan-only artifact",
  );
  invariant(intakeReceipt.authority === "owner-authorized-google-drive-download", "Intake authority is not owner-authorized");
  invariant(intakeReceipt.acceptanceEffect?.sourcePromoted === false, "Intake receipt already claims source promotion");
  invariant(
    intakeReceipt.grade4?.manifestSha256 === loaded.quarantineManifest.evidence.sha256,
    "Receipt does not pin the current Grade 4 manifest",
  );
  invariant(
    intakeReceipt.grade4?.intakePlanSha256 === loaded.intakePlan.evidence.sha256,
    "Receipt does not pin the current Grade 4 intake plan",
  );
  invariant(
    quarantineManifest.checksumSetSha256 === intakeReceipt.grade4?.manifestChecksumSetSha256 ||
      quarantineManifest.checksumSetSha256 ===
        intakeReceipt.archives?.find(({ scope }) => scope === "HELP_COURSES/ELMGR4")?.checksumSetSha256,
    "Receipt does not pin the Grade 4 checksum set",
  );

  const canonicalByPath = indexByPath(sourceCatalog.files, "source catalog");
  const intakeByPath = indexByCanonicalPath(intakePlan.records, "Grade 4 intake plan");
  const manifestByPath = indexByPath(quarantineManifest.files, "Grade 4 quarantine manifest");
  const missingTargets = selectGrade4ActiveMissingSwfs(missingReferences);
  const activeIdentity = deriveActivePageIdentity(animationsCatalog, missingTargets);
  const lessonOccurrenceCount = lessonsCatalog.lessons
    .filter(({ grade }) => grade === 4)
    .reduce((sum, lesson) => sum + lesson.pageReferenceCount, 0);
  invariant(
    lessonOccurrenceCount === activeIdentity.occurrenceCount,
    "Lessons catalog and resolved/missing occurrence reconstruction disagree",
  );

  const copyRecords = [];
  const existingBindings = [];
  const targetIntakeByPath = new Map();
  for (const target of missingTargets) {
    const intake = intakeByPath.get(target.expectedPath);
    invariant(intake, `Quarantine intake plan lacks active SWF ${target.expectedPath}`);
    verifyIntakeRecordAgainstManifest(intake, manifestByPath);
    invariant(!canonicalByPath.has(target.expectedPath), `Active missing SWF is already canonical: ${target.expectedPath}`);
    targetIntakeByPath.set(target.expectedPath, intake);
    copyRecords.push(
      makeCopyRecord({
        intakeRecord: intake,
        sourceType: "active-page-swf",
        bindingReason: "active-page-swf-referenced-by-canonical-lesson-xml",
        canonicalByPath,
        requiredBy: target.occurrences.map(({ sourceXmlPath }) => sourceXmlPath).sort(compareText),
      }),
    );
  }

  let pairedFlaCount = 0;
  for (const target of missingTargets) {
    const flaPath = target.expectedPath.replace(/\.swf$/i, ".fla");
    const intake = intakeByPath.get(flaPath);
    if (!intake) continue;
    pairedFlaCount += 1;
    verifyIntakeRecordAgainstManifest(intake, manifestByPath);
    const canonical = canonicalByPath.get(flaPath);
    if (canonical) {
      invariant(
        canonical.bytes === intake.bytes && canonical.sha256 === intake.sha256,
        `Canonical paired FLA differs from quarantine: ${flaPath}`,
      );
      existingBindings.push(
        makeExistingBinding({
          canonicalRecord: canonical,
          intakeRecord: intake,
          sourceType: "same-path-fla",
          bindingReason: "same-canonical-path-stem-authoring-source-for-active-page-swf",
          requiredBy: [target.expectedPath],
        }),
      );
    } else {
      copyRecords.push(
        makeCopyRecord({
          intakeRecord: intake,
          sourceType: "same-path-fla",
          bindingReason: "same-canonical-path-stem-authoring-source-for-active-page-swf",
          canonicalByPath,
          requiredBy: [target.expectedPath],
        }),
      );
    }
  }
  invariant(pairedFlaCount === KNOWN.pairedFla, `Paired FLA mismatch: ${pairedFlaCount}`);
  invariant(missingTargets.length - pairedFlaCount === KNOWN.swfOnly, "SWF-only count mismatch");

  const xmlPaths = [...new Set(missingTargets.flatMap((target) => target.occurrences.map(({ sourceXmlPath }) => sourceXmlPath)))].sort(compareText);
  for (const xmlPath of xmlPaths) {
    const canonical = canonicalByPath.get(xmlPath);
    const intake = intakeByPath.get(xmlPath);
    invariant(canonical && intake, `XML binding is absent from canonical or quarantine: ${xmlPath}`);
    verifyIntakeRecordAgainstManifest(intake, manifestByPath);
    invariant(
      canonical.bytes === intake.bytes && canonical.sha256 === intake.sha256,
      `Canonical/quarantine XML mismatch: ${xmlPath}`,
    );
    existingBindings.push(
      makeExistingBinding({
        canonicalRecord: canonical,
        intakeRecord: intake,
        sourceType: "lesson-xml-binding",
        bindingReason: "canonical-lesson-xml-binds-active-page-swf",
        requiredBy: missingTargets
          .filter((target) => target.occurrences.some((occurrence) => occurrence.sourceXmlPath === xmlPath))
          .map(({ expectedPath }) => expectedPath)
          .sort(compareText),
      }),
    );
  }

  const { records: audioRequirements, fqTargetEvidence } = await deriveAudioRequirements({
    targets: missingTargets,
    readTargetSwf: async (canonicalPath) => {
      const intake = targetIntakeByPath.get(canonicalPath);
      invariant(intake, `FQ target is not an active missing SWF: ${canonicalPath}`);
      const bytes = await readFile(path.join(quarantineRoot, quarantineRelativePath(canonicalPath)));
      invariant(bytes.length === intake.bytes, `FQ target byte mismatch: ${canonicalPath}`);
      invariant(sha256Bytes(bytes) === intake.sha256, `FQ target SHA-256 mismatch: ${canonicalPath}`);
      return bytes;
    },
  });
  const audioPartitions = partitionAudioRequirements({
    requirements: audioRequirements,
    canonicalByPath,
    intakeByPath,
    manifestByPath,
  });
  copyRecords.push(...audioPartitions.copyRecords);
  existingBindings.push(...audioPartitions.existingBindings);
  const missingDependencies = audioPartitions.missingDependencies;

  copyRecords.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  existingBindings.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  missingDependencies.sort((left, right) => compareText(left.canonicalPath, right.canonicalPath));
  assertUniquePaths(copyRecords, "copyRecords");
  assertUniquePaths(existingBindings, "existingBindings");
  assertUniquePaths(missingDependencies, "missingDependencies");
  const copyPaths = new Set(copyRecords.map(({ canonicalPath }) => canonicalPath));
  const existingPaths = new Set(existingBindings.map(({ canonicalPath }) => canonicalPath));
  invariant(
    [...copyPaths].every((value) => !existingPaths.has(value)),
    "copyRecords and existingBindings overlap",
  );

  await Promise.all([
    verifyPhysicalRecords({
      records: copyRecords,
      root: quarantineRoot,
      relativeField: "quarantineRelativePath",
      label: "quarantine copy source",
    }),
    verifyPhysicalRecords({
      records: existingBindings,
      root: projectRoot,
      relativeField: "canonicalPhysicalRelativePath",
      label: "existing canonical binding",
    }),
    verifyPhysicalRecords({
      records: existingBindings,
      root: quarantineRoot,
      relativeField: "quarantineRelativePath",
      label: "quarantine counterpart for existing binding",
    }),
  ]);

  const hostSwf = canonicalByPath.get(HOST_SWF_CANONICAL_PATH);
  invariant(hostSwf, `Canonical catalog lacks ${HOST_SWF_CANONICAL_PATH}`);
  invariant(
    hostAudioEvidence.authority?.hostScript?.sourceFile ===
      canonicalPhysicalRelativePath(HOST_SWF_CANONICAL_PATH) &&
      hostAudioEvidence.authority.hostScript.sha256 === hostSwf.sha256,
    "Host audio evidence does not bind the canonical indexELM.swf",
  );
  invariant(
    hostAudioEvidence.authority.hostScript.conventions?.courseSpanishPage?.verified === true &&
      hostAudioEvidence.authority.hostScript.conventions?.finalQuiz?.verified === true,
    "Host audio conventions are not verified in the pinned audit",
  );
  await verifyPhysicalRecords({
    records: [
      {
        canonicalPath: hostSwf.path,
        canonicalPhysicalRelativePath: canonicalPhysicalRelativePath(hostSwf.path),
        bytes: hostSwf.bytes,
        sha256: hostSwf.sha256,
      },
    ],
    root: projectRoot,
    relativeField: "canonicalPhysicalRelativePath",
    label: "host SWF authority",
  });
  const hostActionText = await readFile(projectInput(HOST_ACTION_SCRIPT_RELATIVE), "utf8");
  for (const fragment of [
    "function doPlaySpanishAudio()",
    "_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7 && _global.slideNumber != 2",
    '_global.tempURL + "/SA/" + SSTemFName[0] + ".mp3"',
  ]) {
    invariant(hostActionText.includes(fragment), `Host ActionScript is missing required fragment: ${fragment}`);
  }

  if (enforceKnownCounts) {
    assertKnownCounts({
      activeIdentity,
      missingTargets,
      copyRecords,
      existingBindings,
      missingDependencies,
      audioRequirements,
      fqTargetEvidence,
    });
  }

  const copySummary = summarizeRecordSet(copyRecords);
  const existingSummary = summarizeRecordSet(existingBindings);
  const expectedPostManifest = buildExpectedPostManifest({
    baseManifestText: sourceManifestText,
    sourceFiles: sourceCatalog.files,
    copyRecords,
  });
  invariant(expectedPostManifest.postFileCount === 9_147, "Projected post-source file count mismatch");
  invariant(
    expectedPostManifest.postTotalBytes === 3_214_585_414,
    "Projected post-source byte total mismatch",
  );
  const missingSummary = {
    count: missingDependencies.length,
    pathSetSha256: pathSetDigest(missingDependencies),
    pathSetAlgorithm: "sha256(sorted canonicalPath<LF>)",
    byAudioBindingKind: countsBy(missingDependencies, "audioBindingKind"),
  };
  return {
    schemaVersion: 1,
    artifactType: "help-math-g4-active-source-promotion-plan",
    planDate: "2026-08-02",
    mode: "plan-only-no-source-mutation",
    scope: {
      grade: 4,
      selection:
        "canonical lesson-XML active page SWFs currently missing at exact canonical path, their same-path FLA sources, and source-derived reachable audio/XML bindings",
      explicitlyExcluded:
        "all Grade 4 quarantine rows not reached from this active-source dependency closure, including unbound ActionScript and whole-directory audio selection",
    },
    inputs: {
      ...Object.fromEntries(
        Object.entries(loaded).map(([key, record]) => [key, record.evidence]),
      ),
      sourceManifest: sourceManifestEvidence,
      hostActionScript: {
        path: HOST_ACTION_SCRIPT_RELATIVE,
        bytes: Buffer.byteLength(hostActionText),
        sha256: sha256Text(hostActionText),
      },
      hostSwf: {
        path: canonicalPhysicalRelativePath(hostSwf.path),
        bytes: hostSwf.bytes,
        sha256: hostSwf.sha256,
      },
    },
    evidenceBoundary: {
      sourcePromotionOnly: true,
      sourceDerivedReachabilityIsRuntimePlaybackProof: false,
      audioLanguageContentVerified: false,
      audioSynchronizationVerified: false,
      flashFidelityEffect: "none",
      javascriptImplementationEffect: "none",
      humanOrOwnerAcceptanceEffect: "none",
      strictCompletionEffect: "none",
      publicationEffect: "none",
      missingDependencyEffect:
        "The 16 absent MP3 paths remain explicit source gaps and audio-fidelity blockers; they are not invented or silently omitted from the expected closure.",
    },
    derivation: {
      activePages: activeIdentity,
      activeMissingSwf: {
        count: missingTargets.length,
        occurrenceCount: missingTargets.reduce((sum, target) => sum + target.occurrences.length, 0),
        pathSetSha256: sha256Text(missingTargets.map(({ expectedPath }) => `${expectedPath}\n`).join("")),
        pathSetAlgorithm: "sha256(sorted canonicalPath<LF>)",
      },
      pairedAuthoringSources: {
        samePathFlaCount: pairedFlaCount,
        swfOnlyCount: missingTargets.length - pairedFlaCount,
      },
      lessonXml: {
        boundLessonCount: xmlPaths.length,
        canonicalExactCount: xmlPaths.length,
        newCopyCount: 0,
      },
      audio: {
        authority:
          "pinned indexELM.swf host AVM1 route plus target SWF static quiz contract strings; source-derived reachable, not observed playback",
        ordinarySpanishPage: {
          route:
            "sections 2-6 and section 7 except host slide 2; sibling SA/<loaded-SWF-basename>.mp3",
          expectedCount: audioRequirements.filter(({ audioBindingKind }) => audioBindingKind === "ordinary-spanish-page").length,
        },
        finalQuiz: {
          route: "EN->EA and SP->SA; Q<n>.mp3 and Q<n>A-D.mp3",
          targetEvidence: fqTargetEvidence,
          distinctExpectedCount: audioRequirements.filter(({ audioBindingKind }) => audioBindingKind === "final-quiz-question-answer").length,
        },
        totalDistinctExpectedCount: audioRequirements.length,
      },
    },
    transaction: {
      copyTransactionReady: true,
      copyTransactionConflictCount: 0,
      allPreReviewHoldsResolvedInThisPlan: true,
      sourceDependencyClosureComplete: missingDependencies.length === 0,
      missingInputsOutsideCopyTransaction: missingDependencies.length,
      reviewPolicy:
        "Pre-review historical/alias holds are promoted only because this owner-authorized review proves exact active/runtime placement, byte identity, and no conflict; priorDisposition remains on every record.",
      expectedPostManifest,
    },
    summary: {
      copyRecords: copySummary,
      existingBindings: existingSummary,
      missingDependencies: missingSummary,
      copyByPriorDisposition: countsBy(copyRecords, "priorDisposition"),
      exactKnownCountsEnforced: enforceKnownCounts,
    },
    copyRecords,
    existingBindings,
    missingDependencies,
  };
}

function serializePlan(plan) {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

async function writeFileAtomic(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const suffix = sha256Text(content).slice(0, 16);
  const temporaryPath = `${filePath}.${process.pid}.${suffix}.tmp`;
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") error.cleanupError = cleanupError.message;
    }
    throw error;
  }
}

function parseArgs(argv) {
  const options = {
    mode: null,
    outputRelative: DEFAULT_OUTPUT_RELATIVE,
    projectRoot: defaultProjectRoot,
    quarantineRoot: DEFAULT_QUARANTINE_ROOT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--write" || argument === "--check") {
      invariant(!options.mode, "Choose exactly one of --write or --check");
      options.mode = argument.slice(2);
    } else if (["--output", "--project-root", "--quarantine-root"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      if (argument === "--output") options.outputRelative = value;
      else if (argument === "--project-root") options.projectRoot = path.resolve(value);
      else options.quarantineRoot = path.resolve(value);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g4-active-source-promotion-plan.mjs --write
  node scripts/build-g4-active-source-promotion-plan.mjs --check

Options:
  --output <repo-relative-path>  Override the dated plan path.
  --project-root <path>         Override the HELP Math checkout (tests only).
  --quarantine-root <path>      Override the frozen Drive intake root.

The builder rehashes every copy source and existing binding. It writes only the
JSON plan; it never copies, deletes, or modifies canonical source assets.`;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return;
  }
  invariant(options.mode, "Choose exactly one of --write or --check");
  const outputPath = path.resolve(options.projectRoot, options.outputRelative);
  const relative = path.relative(options.projectRoot, outputPath);
  invariant(
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative),
    "Plan output must remain inside the project root",
  );
  const plan = await buildPromotionPlan({
    projectRoot: options.projectRoot,
    quarantineRoot: options.quarantineRoot,
  });
  const serialized = serializePlan(plan);
  if (options.mode === "write") {
    await writeFileAtomic(outputPath, serialized);
  } else {
    const current = await readFile(outputPath, "utf8");
    invariant(current === serialized, `Promotion plan is stale: ${options.outputRelative}`);
  }
  console.log(
    JSON.stringify(
      {
        mode: options.mode,
        output: options.outputRelative,
        copyRecords: plan.summary.copyRecords.count,
        copyBytes: plan.summary.copyRecords.totalBytes,
        existingBindings: plan.summary.existingBindings.count,
        missingDependencies: plan.summary.missingDependencies.count,
        copyRecordSetSha256: plan.summary.copyRecords.recordSetSha256,
      },
      null,
      2,
    ),
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;
if (isMain) {
  main().catch((error) => {
    console.error(`Grade 4 active-source promotion plan failed: ${error.message}`);
    process.exitCode = 1;
  });
}

export {
  KNOWN,
  buildPromotionPlan,
  buildExpectedPostManifest,
  decodeSwfStrings,
  deriveActivePageIdentity,
  deriveAudioRequirements,
  deriveFqQuestionLabels,
  deriveOrdinarySpanishAudioPath,
  makeCopyRecord,
  partitionAudioRequirements,
  pathSetDigest,
  parseSourceManifest,
  recordSetDigest,
  reviewDecisionFor,
  selectGrade4ActiveMissingSwfs,
  serializePlan,
  renderSourceManifest,
  verifyIntakeRecordAgainstManifest,
  writeFileAtomic,
};
