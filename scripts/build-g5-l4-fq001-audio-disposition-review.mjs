#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const OUTPUT_JSON = "reports/g5-l4-fq001-audio-disposition-review-v1.json";
const OUTPUT_MARKDOWN = "reports/g5-l4-fq001-audio-disposition-review-v1.md";
const ANIMATION_ID = "course-g05-l04-fq-001";
const RELEASE_ID = "lesson-g05-l04-number-lines";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ01.swf";
const SOURCE_FLA =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/L4FQ01.fla";
const SOURCE_XML =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml";

const INPUTS = Object.freeze({
  migration: "migrations/course-g05-l04-fq-001/migration.json",
  audioInventory: "migrations/course-g05-l04-fq-001/audio-inventory.csv",
  audioRuntimeEvidence:
    "migrations/course-g05-l04-fq-001/audit/audio-runtime-evidence.json",
  scriptInventory:
    "migrations/course-g05-l04-fq-001/audit/script-inventory.json",
  ffdecScripts:
    "migrations/course-g05-l04-fq-001/audit/machine/ffdec-scripts.txt.gz",
  ffdecTags:
    "migrations/course-g05-l04-fq-001/audit/machine/ffdec-tags.txt.gz",
  sourceScope: "reports/g5-l4-source-scope-freeze.json",
  currentAudioCandidates: "reports/g5-l4-current-js-audio-candidates.json",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveContained(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: expected portable relative path`,
  );
  const resolved = path.resolve(root, relativePath);
  invariant(isWithin(root, resolved), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, resolved)) === relativePath,
    `${label}: path is not normalized`,
  );
  return resolved;
}

async function readOrdinaryFile(root, relativePath, label = relativePath) {
  const absolute = resolveContained(root, relativePath, label);
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const [bytes, realRoot, realFile] = await Promise.all([
    readFile(absolute),
    realpath(root),
    realpath(absolute),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const after = await lstat(absolute);
  invariant(
    after.isFile() && !after.isSymbolicLink() && after.nlink === 1 &&
      before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size,
    `${label}: changed while being read`,
  );
  return {relativePath, absolute, bytes, size: bytes.length, sha256: sha256(bytes)};
}

async function maybeReadOrdinaryFile(root, relativePath) {
  try {
    return await readOrdinaryFile(root, relativePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function descriptor(record) {
  return {path: record.relativePath, bytes: record.size, sha256: record.sha256};
}

function descriptorMatches(value, record) {
  return value?.path === record.relativePath &&
    value?.bytes === record.size && value?.sha256 === record.sha256;
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function noAudioScriptPattern(text) {
  return /\b(?:attachSound|loadSound|startSound|stopSound|SoundMixer|Audio|MP3)\b|new\s+Sound\b/i.test(
    text,
  );
}

function noAudioTagPattern(text) {
  return /\b(?:DefineSound|SoundStreamHead2?|SoundStreamBlock|StartSound2?)\b/.test(
    text,
  );
}

function validateInputs({
  migration,
  audioRuntime,
  scriptInventory,
  audioInventoryText,
  ffdecScriptsText,
  ffdecTagsText,
  sourceScope,
  currentAudio,
}) {
  invariant(
    migration?.source?.swf === SOURCE_SWF &&
      migration?.source?.swfSha256 ===
        "b56e10b76b01b6626aba5d69b176d21262dfbe4db74a94b4afe2323aeb5b3e36" &&
      migration?.source?.fla === SOURCE_FLA &&
      migration?.source?.flaSha256 ===
        "7d7934819db404845486d5fd0ea544bfcba21338d4e8a1de4006e395ffb99db3",
    "FQ001 source identity changed",
  );
  invariant(
    migration?.audio?.required === true &&
      migration?.audio?.cues?.length === 0 &&
      migration?.audio?.catalogExactAssociations?.length === 0 &&
      migration?.audio?.catalogGroupCandidates?.join("\n") ===
        "course-g05-l04-fq-audio",
    "FQ001 migration audio boundary changed",
  );
  invariant(
    audioRuntime?.schemaVersion === 2 &&
      audioRuntime?.animationId === ANIMATION_ID &&
      audioRuntime?.source?.hashMatches === true &&
      audioRuntime?.embeddedAudio?.rootTimeline?.declaredFrames === 10 &&
      audioRuntime?.embeddedAudio?.defineSounds?.length === 0 &&
      audioRuntime?.embeddedAudio?.soundStreams?.length === 0 &&
      audioRuntime?.embeddedAudio?.startSounds?.length === 0 &&
      audioRuntime?.embeddedAudio?.exportedSoundLinkages?.length === 0 &&
      audioRuntime?.externalAudio?.exactAssociations?.length === 0 &&
      audioRuntime?.externalAudio?.lessonGroupCandidates?.length === 83 &&
      audioRuntime?.actionScriptAudioOperations?.length === 0 &&
      audioRuntime?.inventory?.rowCount === 0,
    "FQ001 structural audio evidence changed",
  );
  invariant(
    scriptInventory?.animationId === ANIMATION_ID &&
      scriptInventory?.scripts?.length === 24 &&
      scriptInventory.scripts.every(
        (script) => script.externalApiOccurrences?.length === 0,
      ),
    "FQ001 script inventory changed",
  );
  invariant(
    audioInventoryText.trim() ===
      "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes",
    "FQ001 audio inventory is no longer empty",
  );
  invariant(
    !noAudioScriptPattern(ffdecScriptsText),
    "FQ001 FFDec script bundle now contains an audio operation",
  );
  invariant(
    !noAudioTagPattern(ffdecTagsText),
    "FQ001 FFDec tag bundle now contains an audio tag",
  );
  const pageMembers = (sourceScope?.members || []).filter(
    (member) => member.role === "lesson-page",
  );
  const page = pageMembers.find((member) => member.animationId === ANIMATION_ID);
  invariant(
    sourceScope?.releaseId === RELEASE_ID &&
      pageMembers.length === 54 && page?.ordinal === 52,
    "page-only G5 L4 FQ001 identity changed",
  );
  invariant(
    currentAudio?.releaseId === RELEASE_ID &&
      currentAudio?.finalQuiz?.assets?.length === 83 &&
      currentAudio?.finalQuiz?.missingPaths?.length === 97 &&
      currentAudio?.finalQuiz?.sourceControlOwnerAnimationIds?.join("\n") ===
        "course-g05-l04-fq-002\ncourse-g05-l04-fq-003" &&
      currentAudio?.finalQuiz?.unresolvedOwnerAnimationId === ANIMATION_ID,
    "current FQ ownership evidence changed",
  );
  return {page};
}

function validateSourcefulBindings(sourceRecords, audioRuntime) {
  if (!sourceRecords.swf && !sourceRecords.fla && !sourceRecords.xml) {
    return {available: false, verified: false};
  }
  invariant(
    sourceRecords.swf && sourceRecords.fla && sourceRecords.xml,
    "FQ001 private source custody is only partially mounted",
  );
  invariant(
    sourceRecords.swf.sha256 ===
      "b56e10b76b01b6626aba5d69b176d21262dfbe4db74a94b4afe2323aeb5b3e36" &&
      sourceRecords.swf.size === 23_357,
    "FQ001 SWF no longer matches the source binding",
  );
  invariant(
    sourceRecords.fla.sha256 ===
      "7d7934819db404845486d5fd0ea544bfcba21338d4e8a1de4006e395ffb99db3" &&
      sourceRecords.fla.size === 806_912,
    "FQ001 FLA no longer matches the source binding",
  );
  const xmlReference = audioRuntime.authority.xmlReferences.find(
    (reference) => reference.sourceFile === SOURCE_XML,
  );
  invariant(
    xmlReference?.sha256 === sourceRecords.xml.sha256 &&
      xmlReference?.matchedLines?.length === 1 &&
      xmlReference.matchedLines[0].lineNumber === 155 &&
      xmlReference.matchedLines[0].text ===
        '<Page Title="Introduction" RandomAudio="" BGText="" Navigation="ON">FQ/L4FQ01.swf</Page>',
    "FQ001 source XML RandomAudio binding changed",
  );
  const actualLine = sourceRecords.xml.bytes
    .toString("utf8")
    .split(/\r?\n/)[154]
    ?.trim();
  invariant(
    actualLine === xmlReference.matchedLines[0].text,
    "FQ001 source XML line 155 no longer matches the empty RandomAudio record",
  );
  return {available: true, verified: true};
}

export function validateG5L4Fq001AudioDispositionReview(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document?.artifactType ===
        "g5-l4-fq001-audio-disposition-review-input" &&
      document?.releaseId === RELEASE_ID &&
      document?.animationId === ANIMATION_ID,
    "FQ001 disposition artifact identity changed",
  );
  invariant(
    document?.status ===
      "machine-negative-evidence-complete-owner-disposition-pending" &&
      document?.recommendation?.decision ===
        "accepted-not-required-candidate" &&
      document?.recommendation?.ownerDecisionRequired === true &&
      document?.recommendation?.applied === false,
    "FQ001 disposition recommendation crossed its authority boundary",
  );
  invariant(
    document?.machineFindings?.embeddedDefineSoundCount === 0 &&
      document?.machineFindings?.embeddedSoundStreamCount === 0 &&
      document?.machineFindings?.startSoundCount === 0 &&
      document?.machineFindings?.exportedSoundLinkageCount === 0 &&
      document?.machineFindings?.actionScriptAudioOperationCount === 0 &&
      document?.machineFindings?.exactExternalAssociationCount === 0 &&
      document?.machineFindings?.sourceXmlRandomAudio === "" &&
      document?.machineFindings?.currentJsTrackCount === 0,
    "FQ001 negative evidence counts changed",
  );
  invariant(
    document?.unresolvedAuthority?.naturalOriginalRuntimeSessionCount === 0 &&
      document?.unresolvedAuthority?.ownerDecision === null &&
      document?.unresolvedAuthority?.reviewerIdentity === null &&
      document?.unresolvedAuthority?.reviewedAt === null,
    "FQ001 unresolved authority was fabricated",
  );
  invariant(
    document?.productDisposition?.audioAvailable === false &&
      document?.productDisposition?.keepFailClosed === true &&
      document?.productDisposition?.runtimeTrackCount === 0,
    "FQ001 product audio was enabled without authority",
  );
  invariant(
    document?.privateSourceRecheck?.availableAtGeneration === true &&
      document?.privateSourceRecheck?.verifiedAtGeneration === true,
    "FQ001 sourceful generation receipt changed",
  );
  invariant(
    Object.values(document.acceptanceEffects || {}).every(
      (value) => value === false,
    ),
    "FQ001 disposition changed an acceptance gate",
  );
  return document;
}

export async function buildG5L4Fq001AudioDispositionReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const inputRecords = Object.fromEntries(
    await Promise.all(
      Object.entries(INPUTS).map(async ([key, relativePath]) => [
        key,
        await readOrdinaryFile(root, relativePath),
      ]),
    ),
  );
  const generator = await readOrdinaryFile(
    root,
    portable(path.relative(root, SCRIPT_PATH)),
    "generator",
  );
  const documents = {
    migration: parseJson(inputRecords.migration),
    audioRuntime: parseJson(inputRecords.audioRuntimeEvidence),
    scriptInventory: parseJson(inputRecords.scriptInventory),
    sourceScope: parseJson(inputRecords.sourceScope),
    currentAudio: parseJson(inputRecords.currentAudioCandidates),
  };
  const ffdecScriptsText = gunzipSync(inputRecords.ffdecScripts.bytes).toString(
    "utf8",
  );
  const ffdecTagsText = gunzipSync(inputRecords.ffdecTags.bytes).toString(
    "utf8",
  );
  const {page} = validateInputs({
    ...documents,
    audioInventoryText: inputRecords.audioInventory.bytes.toString("utf8"),
    ffdecScriptsText,
    ffdecTagsText,
  });
  const [swf, fla, xml] = await Promise.all([
    maybeReadOrdinaryFile(root, SOURCE_SWF),
    maybeReadOrdinaryFile(root, SOURCE_FLA),
    maybeReadOrdinaryFile(root, SOURCE_XML),
  ]);
  const sourceful = validateSourcefulBindings(
    {swf, fla, xml},
    documents.audioRuntime,
  );
  const report = {
    schemaVersion: 1,
    artifactType: "g5-l4-fq001-audio-disposition-review-input",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    pageOrdinal: page.ordinal,
    status: "machine-negative-evidence-complete-owner-disposition-pending",
    authority: "acceptance-neutral-machine-disposition-recommendation",
    authorityBoundary:
      "This artifact establishes a current page-only machine negative-evidence recommendation. It does not prove that a person heard silence in an authorized original runtime, change migration.audio.required, accept not-required, sign for the Owner, enable FQ001 audio, establish strict completion, release the Lesson, or publish audio.",
    generator: descriptor(generator),
    sourceBindings: Object.fromEntries(
      Object.entries(inputRecords).map(([key, record]) => [key, descriptor(record)]),
    ),
    privateSourceRecheck: {
      availableAtGeneration: sourceful.available,
      verifiedAtGeneration: sourceful.verified,
      swf: {
        path: SOURCE_SWF,
        bytes: 23_357,
        sha256:
          "b56e10b76b01b6626aba5d69b176d21262dfbe4db74a94b4afe2323aeb5b3e36",
      },
      fla: {
        path: SOURCE_FLA,
        bytes: 806_912,
        sha256:
          "7d7934819db404845486d5fd0ea544bfcba21338d4e8a1de4006e395ffb99db3",
      },
      lessonXml: {
        path: SOURCE_XML,
        sha256:
          documents.audioRuntime.authority.xmlReferences[0].sha256,
        lineNumber: 155,
        exactLine:
          '<Page Title="Introduction" RandomAudio="" BGText="" Navigation="ON">FQ/L4FQ01.swf</Page>',
      },
    },
    machineFindings: {
      rootDeclaredFrameCount: 10,
      embeddedDefineSoundCount: 0,
      embeddedSoundStreamCount: 0,
      startSoundCount: 0,
      exportedSoundLinkageCount: 0,
      actionScriptCount: documents.scriptInventory.scripts.length,
      actionScriptAudioOperationCount: 0,
      ffdecScriptAudioTokenCount: 0,
      ffdecSoundTagCount: 0,
      exactExternalAssociationCount: 0,
      lessonGroupCandidateCount: 83,
      sourceControlOwnerAnimationIds:
        documents.currentAudio.finalQuiz.sourceControlOwnerAnimationIds,
      unresolvedHistoricalOwnerAnimationId: ANIMATION_ID,
      sourceXmlRandomAudio: "",
      currentJsTrackCount: 0,
      currentJsListeningProtocol:
        "blocked-no-positive-audio-trigger-evidence",
    },
    recommendation: {
      decision: "accepted-not-required-candidate",
      rationale:
        "All source-static signals for this exact page are negative: the child SWF contains no audio definitions, streams, start tags, sound linkages, or ActionScript audio operations; its XML RandomAudio field is empty; it has no exact external association; and the 83 shared FQ candidates have positive source-control ownership only in FQ002/FQ003. Retain FQ001 as unavailable unless an authorized natural original-runtime session contradicts this evidence.",
      ownerDecisionRequired: true,
      originalRuntimeContradictionReviewRequired: true,
      applied: false,
      migrationAudioRequiredChanged: false,
    },
    unresolvedAuthority: {
      naturalOriginalRuntimeSessionCount: 0,
      audibleEventObserved: null,
      reviewerIdentity: null,
      reviewedAt: null,
      ownerDecision: null,
      ownerReason: null,
      decisionRecordDescriptor: null,
    },
    productDisposition: {
      audioAvailable: false,
      keepFailClosed: true,
      runtimeTrackCount: 0,
      sharedFqAssetsAssignedToFq001: false,
      productionChangeAuthorized: false,
    },
    acceptanceEffects: {
      audioNotRequiredAccepted: false,
      currentJsAudioAccepted: false,
      naturalOriginalRuntimeReachabilityEstablished: false,
      humanListeningAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  };
  return validateG5L4Fq001AudioDispositionReview(stable(report));
}

export function renderG5L4Fq001AudioDispositionMarkdown(report) {
  validateG5L4Fq001AudioDispositionReview(report);
  const finding = report.machineFindings;
  return `# G5 L4 FQ001 audio disposition review v1

Status: **${report.status}**. This is an unsigned recommendation, not an Owner decision.

## Page-only finding

- Animation: \`${report.animationId}\`, page **${report.pageOrdinal}/54**.
- Child SWF: **${report.privateSourceRecheck.swf.bytes} bytes**, SHA-256 \`${report.privateSourceRecheck.swf.sha256}\`.
- Embedded DefineSound / SoundStream / StartSound / exported sound linkages: **${finding.embeddedDefineSoundCount}/${finding.embeddedSoundStreamCount}/${finding.startSoundCount}/${finding.exportedSoundLinkageCount}**.
- ActionScript audio operations: **${finding.actionScriptAudioOperationCount}** across ${finding.actionScriptCount} scripts.
- Exact external associations: **${finding.exactExternalAssociationCount}**.
- Source XML \`RandomAudio\`: empty string.
- Current-JS tracks assigned to FQ001: **${finding.currentJsTrackCount}**.
- Shared FQ candidates: **${finding.lessonGroupCandidateCount}**, but positive source-control owners are only \`${finding.sourceControlOwnerAnimationIds.join("\`, \`")}\`.

## Recommendation

**${report.recommendation.decision}**, pending a separate Owner decision and contradiction review.

${report.recommendation.rationale}

This generated artifact does not change \`migration.audio.required\`, does not assign any shared FQ track to FQ001, and does not accept or publish anything. FQ001 remains fail-closed and unavailable.

## Required human/Owner record

The external append-only record must name the actual reviewer, bind this artifact's exact descriptor, state whether an authorized natural original-runtime session contradicted the machine evidence, and explicitly accept or reject the not-required disposition. Until then, acceptance remains **false**.
`;
}

async function atomicWriteKnownGenerated(absolute, bytes, validateExisting) {
  await mkdir(path.dirname(absolute), {recursive: true});
  try {
    const existing = await readFile(absolute);
    validateExisting(existing);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${absolute}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, absolute);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

export async function writeG5L4Fq001AudioDispositionReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const report = await buildG5L4Fq001AudioDispositionReview({projectRoot: root});
  const markdown = renderG5L4Fq001AudioDispositionMarkdown(report);
  await atomicWriteKnownGenerated(
    resolveContained(root, OUTPUT_JSON),
    stableJson(report),
    (bytes) => validateG5L4Fq001AudioDispositionReview(JSON.parse(bytes)),
  );
  await atomicWriteKnownGenerated(
    resolveContained(root, OUTPUT_MARKDOWN),
    markdown,
    (bytes) => invariant(
      bytes.toString("utf8").startsWith("# G5 L4 FQ001 audio disposition review v1\n"),
      "refusing to replace an unrelated Markdown file",
    ),
  );
  return report;
}

export async function checkG5L4Fq001AudioDispositionReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const root = path.resolve(projectRoot);
  const [actualJson, actualMarkdown] = await Promise.all([
    readFile(resolveContained(root, OUTPUT_JSON), "utf8"),
    readFile(resolveContained(root, OUTPUT_MARKDOWN), "utf8"),
  ]);
  const actual = validateG5L4Fq001AudioDispositionReview(
    JSON.parse(actualJson),
  );
  invariant(actualJson === stableJson(actual), `${OUTPUT_JSON} is not stable`);
  invariant(
    actualMarkdown === renderG5L4Fq001AudioDispositionMarkdown(actual),
    `${OUTPUT_MARKDOWN} is stale`,
  );
  const inputRecords = Object.fromEntries(
    await Promise.all(
      Object.entries(INPUTS).map(async ([key, relativePath]) => [
        key,
        await readOrdinaryFile(root, relativePath),
      ]),
    ),
  );
  const generator = await readOrdinaryFile(
    root,
    portable(path.relative(root, SCRIPT_PATH)),
    "generator",
  );
  invariant(
    descriptorMatches(actual.generator, generator),
    "FQ001 disposition generator binding is stale",
  );
  for (const [key, record] of Object.entries(inputRecords)) {
    invariant(
      descriptorMatches(actual.sourceBindings?.[key], record),
      `FQ001 disposition ${key} binding is stale`,
    );
  }
  invariant(
    Object.keys(actual.sourceBindings || {}).length === Object.keys(INPUTS).length,
    "FQ001 disposition source binding set changed",
  );
  const [swf, fla, xml] = await Promise.all([
    maybeReadOrdinaryFile(root, SOURCE_SWF),
    maybeReadOrdinaryFile(root, SOURCE_FLA),
    maybeReadOrdinaryFile(root, SOURCE_XML),
  ]);
  const sourceful = validateSourcefulBindings(
    {swf, fla, xml},
    parseJson(inputRecords.audioRuntimeEvidence),
  );
  if (sourceful.available) {
    const expected = await buildG5L4Fq001AudioDispositionReview({
      projectRoot: root,
    });
    invariant(actualJson === stableJson(expected), `${OUTPUT_JSON} is stale`);
  }
  return actual;
}

function parseCli(argv) {
  invariant(argv.length === 1, "usage: --write | --check");
  invariant(argv[0] === "--write" || argv[0] === "--check", "usage: --write | --check");
  return argv[0];
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  try {
    const mode = parseCli(process.argv.slice(2));
    const report = mode === "--write"
      ? await writeG5L4Fq001AudioDispositionReview()
      : await checkG5L4Fq001AudioDispositionReview();
    process.stdout.write(
      `G5 L4 FQ001 audio disposition ${mode.slice(2)}: ` +
        `${report.status}; accepted=${report.acceptanceEffects.audioNotRequiredAccepted}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  }
}
