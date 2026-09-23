#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const ANIMATION_ID = "keyterm-elementary-acute-angle";
const ARCHIVE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
const OUTPUT_RELATIVE = `${MIGRATION_ROOT}/audit/acute-angle-spanish-audio-source-forensics.json`;
const SOURCE_CATALOG_RELATIVE = "catalog/source-files.json";
const ANIMATION_CATALOG_RELATIVE = "catalog/animations.json";
const HOST_AS_RELATIVE = `${ARCHIVE_ROOT}/HELP_AS_FILES/Global_Only_One.as`;
const HOST_SWF_RELATIVE = `${ARCHIVE_ROOT}/HELP_COURSES/indexELM.swf`;
const SOURCE_SWF_RELATIVE = `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf`;
const SOURCE_FLA_RELATIVE = `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.fla`;
const ENGLISH_AUDIO_RELATIVE = `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/EAD/acute_angle.mp3`;
const EXPECTED_SPANISH_AUDIO_RELATIVE = `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3`;
const KEYTERM_SAD_DIRECTORY_RELATIVE = `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/SAD`;
const AUDIO_AUDIT_RELATIVE = `${MIGRATION_ROOT}/audit/audio-runtime-evidence.json`;
const MACHINE_AUDIT_RELATIVE = `${MIGRATION_ROOT}/audit/machine/report.json`;
const AUTHORING_AUDIT_RELATIVE = `${MIGRATION_ROOT}/audit/adobe-animate-2021-authoring-audit.json`;

const XML_SOURCES = Object.freeze([
  Object.freeze({
    path: `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml`,
    sha256: "bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749",
    expectedLine: 4,
  }),
  Object.freeze({
    path: `${ARCHIVE_ROOT}/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml`,
    sha256: "7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00",
    expectedLine: 738,
  }),
]);

const EXPECTED_HASHES = Object.freeze({
  hostActionScript: "da2e398f3f882474ebd3d59ae0670c5398beb3b67911676f43089ae545106ab8",
  hostSwf: "04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd",
  sourceSwf: "dbc56af636e5551c582977f9230be2ae530874a05c901f0cf44dd5e2d5f2a347",
  sourceFla: "f129e5a338c2d9c70d004e8473f6cb3ea7f4883f67d28ebe72607057f9ef6837",
  englishAudio: "8b150d56158690d70c8f9891a72c13fdb62719b973bf970dcdeadaed612dc97f",
});

const EXPECTED_ARCHIVE = Object.freeze({
  fileCount: 7919,
  totalBytes: 2779928841,
  mp3FileCount: 4565,
  uniqueMp3FileSha256Count: 4344,
  uniqueMp3PayloadSha256Count: 4343,
});

const EXPECTED_SEMANTIC_COURSE_IDS = Object.freeze([
  "course-g03-l09-vb-005",
  "course-g04-l12-vb-005",
  "course-g05-l13-vb-003",
  "course-g05-l13-vb-004",
  "course-g05-l13-vb-005",
  "course-g05-l13-vb-006",
]);

const EXPECTED_SEMANTIC_AUDIO = Object.freeze(new Map([
  ["HELP_COURSES/ELMGR4/L12/SA/L12VB05.mp3", "87aed83644130421d4ea0fc7071d6a70006ef2af978712e2b261a3509bac4213"],
  ["HELP_COURSES/ELMGR5/L13/SA/L13VB03.mp3", "89959641f7c5896024892bfb0f887ba415cfabe868b3165cc2f663ef18ec73fe"],
  ["HELP_COURSES/ELMGR5/L13/SA/L13VB04.mp3", "9b6c5cfcf046bf645ad3def8ea7a8cc11e0f52d1f36eec1235714ac21ba2616c"],
  ["HELP_COURSES/ELMGR5/L13/SA/L13VB05.mp3", "fbe11921bd8871c128d5669672754a51829174f64adb740c9cf47b5fb8cb14de"],
  ["HELP_COURSES/ELMGR5/L13/SA/L13VB06.mp3", "3cd3c8dd5f6f8447c0fdebfd466c8122b788a8db759ac4497c6dfe008d2a89f7"],
]));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

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

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function bindFile(root, relativePath, expectedSha256 = null) {
  const absolute = path.join(root, relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} is not a regular file`);
  const sha256 = await sha256File(absolute);
  if (expectedSha256) invariant(sha256 === expectedSha256, `${relativePath} SHA-256 changed: ${sha256}`);
  return {path: relativePath, bytes: metadata.size, sha256};
}

async function bindJson(root, relativePath, expectedSha256 = null) {
  const binding = await bindFile(root, relativePath, expectedSha256);
  return {
    binding,
    value: JSON.parse(await readFile(path.join(root, relativePath), "utf8")),
  };
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

function syncsafeInteger(buffer, offset) {
  invariant(buffer.length >= offset + 4, "truncated ID3v2 syncsafe integer");
  const bytes = buffer.subarray(offset, offset + 4);
  invariant([...bytes].every((value) => (value & 0x80) === 0), "invalid ID3v2 syncsafe integer");
  return ((bytes[0] & 0x7f) << 21)
    | ((bytes[1] & 0x7f) << 14)
    | ((bytes[2] & 0x7f) << 7)
    | (bytes[3] & 0x7f);
}

export function stripMp3ContainerTags(buffer) {
  let start = 0;
  let end = buffer.length;
  let leadingId3v2Bytes = 0;
  let trailingId3v1Bytes = 0;
  if (buffer.length >= 10 && buffer.subarray(0, 3).toString("ascii") === "ID3") {
    const tagBodyBytes = syncsafeInteger(buffer, 6);
    const footerBytes = (buffer[5] & 0x10) === 0x10 ? 10 : 0;
    leadingId3v2Bytes = 10 + tagBodyBytes + footerBytes;
    invariant(leadingId3v2Bytes <= buffer.length, "ID3v2 tag exceeds MP3 file size");
    start = leadingId3v2Bytes;
  }
  if (end - start >= 128 && buffer.subarray(end - 128, end - 125).toString("ascii") === "TAG") {
    trailingId3v1Bytes = 128;
    end -= trailingId3v1Bytes;
  }
  invariant(end >= start, "MP3 tags overlap");
  return {
    payload: buffer.subarray(start, end),
    leadingId3v2Bytes,
    trailingId3v1Bytes,
  };
}

export function extractActionScriptFunction(source, functionName) {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\bfunction\\s+${escaped}\\s*\\(`).exec(source);
  if (!match) return null;
  const openBrace = source.indexOf("{", match.index + match[0].length);
  if (openBrace < 0) return null;
  let depth = 0;
  let quote = null;
  let escapedCharacter = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openBrace; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escapedCharacter) escapedCharacter = false;
      else if (character === "\\") escapedCharacter = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(match.index, index + 1);
    }
  }
  return null;
}

async function listFilesRecursively(root, current = root) {
  const entries = await readdir(current, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(root, absolute));
    else if (entry.isFile()) files.push(portable(path.relative(root, absolute)));
    else throw new Error(`preserved archive contains a non-file/non-directory entry: ${absolute}`);
  }
  return files;
}

function normalizedSearchText(value) {
  return value.normalize("NFD").replace(/\p{Mark}/gu, "").toLowerCase();
}

function isAcuteAngleFilenameCandidate(value) {
  return /acute|angle|angulo|agudo/.test(normalizedSearchText(path.basename(value)));
}

function groupCount(records, key) {
  return new Set(records.map((record) => record[key])).size;
}

async function scanMp3Inventory(root) {
  const {binding: catalogBinding, value: catalog} = await bindJson(root, SOURCE_CATALOG_RELATIVE);
  invariant(catalog.schemaVersion === 1 && Array.isArray(catalog.files), "source catalog schema changed");
  invariant(catalog.fileCount === EXPECTED_ARCHIVE.fileCount, "source catalog file count changed");
  invariant(catalog.totalBytes === EXPECTED_ARCHIVE.totalBytes, "source catalog byte count changed");

  const catalogMp3 = catalog.files
    .filter(({extension}) => String(extension).toLowerCase() === "mp3")
    .sort((left, right) => compareText(left.path, right.path));
  invariant(catalogMp3.length === EXPECTED_ARCHIVE.mp3FileCount, "source catalog MP3 count changed");

  const archiveAbsolute = path.join(root, ARCHIVE_ROOT);
  const actualMp3Paths = (await listFilesRecursively(archiveAbsolute))
    .filter((relativePath) => relativePath.toLowerCase().endsWith(".mp3"))
    .sort(compareText);
  invariant(actualMp3Paths.length === catalogMp3.length, "actual archive MP3 count differs from catalog");
  invariant(actualMp3Paths.every((value, index) => value === catalogMp3[index].path),
    "actual archive MP3 path set differs from catalog");

  const records = [];
  for (const entry of catalogMp3) {
    const absolute = path.join(archiveAbsolute, entry.path);
    const metadata = await lstat(absolute);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${entry.path} is not a regular MP3`);
    const bytes = await readFile(absolute);
    const fileSha256 = sha256Bytes(bytes);
    invariant(bytes.length === entry.bytes, `${entry.path} byte count differs from catalog`);
    invariant(fileSha256 === entry.sha256, `${entry.path} SHA-256 differs from catalog`);
    const stripped = stripMp3ContainerTags(bytes);
    records.push({
      path: entry.path,
      bytes: bytes.length,
      fileSha256,
      payloadBytes: stripped.payload.length,
      payloadSha256: sha256Bytes(stripped.payload),
      leadingId3v2Bytes: stripped.leadingId3v2Bytes,
      trailingId3v1Bytes: stripped.trailingId3v1Bytes,
    });
  }

  const uniqueFileSha256Count = groupCount(records, "fileSha256");
  const uniquePayloadSha256Count = groupCount(records, "payloadSha256");
  invariant(uniqueFileSha256Count === EXPECTED_ARCHIVE.uniqueMp3FileSha256Count,
    "unique MP3 file SHA-256 count changed");
  invariant(uniquePayloadSha256Count === EXPECTED_ARCHIVE.uniqueMp3PayloadSha256Count,
    "unique MP3 payload SHA-256 count changed");

  const byPath = new Map(records.map((record) => [record.path, record]));
  const englishCatalogPath = ENGLISH_AUDIO_RELATIVE.slice(`${ARCHIVE_ROOT}/`.length);
  const english = byPath.get(englishCatalogPath);
  invariant(english?.fileSha256 === EXPECTED_HASHES.englishAudio, "English acute-angle MP3 binding changed");
  const englishPayloadCopies = records.filter(({payloadSha256}) => payloadSha256 === english.payloadSha256);
  invariant(englishPayloadCopies.length === 1, "English acute-angle MP3 payload is no longer unique");

  const expectedSpanishCatalogPath = EXPECTED_SPANISH_AUDIO_RELATIVE.slice(`${ARCHIVE_ROOT}/`.length);
  invariant(!byPath.has(expectedSpanishCatalogPath), "expected Spanish acute-angle MP3 is now present; rerun provenance review");
  const sameBasenameMatches = records.filter(({path: sourcePath}) =>
    path.basename(sourcePath).toLowerCase() === "acute_angle.mp3");
  const termFilenameMatches = records.filter(({path: sourcePath}) => isAcuteAngleFilenameCandidate(sourcePath));

  const indexProjection = records.map((record) => ({...record}));
  return {
    catalogBinding,
    catalogSummary: {
      fileCount: catalog.fileCount,
      totalBytes: catalog.totalBytes,
      checksumSetSha256: catalog.checksumSetSha256,
    },
    records,
    byPath,
    report: {
      archiveRoot: ARCHIVE_ROOT,
      catalog: catalogBinding,
      catalogSummary: {
        fileCount: catalog.fileCount,
        totalBytes: catalog.totalBytes,
        checksumSetSha256: catalog.checksumSetSha256,
      },
      scanCoverage: {
        catalogMp3Count: catalogMp3.length,
        actualArchiveMp3Count: actualMp3Paths.length,
        pathSetsMatchExactly: true,
        everyFileByteCountAndSha256MatchesCatalog: true,
      },
      payloadProjection: {
        schema: "path,bytes,fileSha256,payloadBytes,payloadSha256,leadingId3v2Bytes,trailingId3v1Bytes; sorted by path",
        sha256: sha256Bytes(Buffer.from(stableJson(indexProjection), "utf8")),
        tagStripping: "remove a leading ID3v2 tag using its syncsafe size and optional footer; remove a trailing 128-byte ID3v1 TAG block; hash all remaining bytes",
      },
      mp3FileCount: records.length,
      uniqueFileSha256Count,
      uniquePayloadSha256Count,
      expectedSpanishPath: {
        path: EXPECTED_SPANISH_AUDIO_RELATIVE,
        exists: false,
        authoritativeSha256Known: false,
        payloadComparisonPossible: false,
      },
      sameBasenameMatches,
      filenameTermMatches: termFilenameMatches,
      englishCounterpart: {
        ...english,
        projectPath: ENGLISH_AUDIO_RELATIVE,
        payloadCopyCount: englishPayloadCopies.length,
        languageAuthority: "legacy key-term host EAD routing only; spoken-content listening is outside this report",
      },
      inferenceBoundary: "The absent Spanish file has no authoritative byte hash. The scan can exclude named copies and prove uniqueness of present payloads, but it cannot identify an arbitrary differently encoded recording as the missing original.",
    },
  };
}

async function inspectXmlSources(root) {
  const results = [];
  for (const expected of XML_SOURCES) {
    const binding = await bindFile(root, expected.path, expected.sha256);
    const text = (await readFile(path.join(root, expected.path), "utf8")).replace(/\r\n?/g, "\n");
    const matches = text.split("\n").flatMap((line, index) =>
      /ExFileName\s*=\s*"Acute_angle\.swf"/i.test(line)
        ? [{line: index + 1, text: line.trim()}]
        : []);
    invariant(matches.length === 1, `${expected.path} acute-angle XML reference count changed`);
    invariant(matches[0].line === expected.expectedLine, `${expected.path} acute-angle XML line changed`);
    results.push({...binding, matches});
  }
  return results;
}

async function inspectHostContract(root) {
  const binding = await bindFile(root, HOST_AS_RELATIVE, EXPECTED_HASHES.hostActionScript);
  const source = (await readFile(path.join(root, HOST_AS_RELATIVE), "utf8")).replace(/\r\n?/g, "\n");
  const lines = source.split("\n");
  const spanishPathConstructions = lines.flatMap((text, index) =>
    text.includes('SndKTSFName = _global.xmlPath+"SAD/" + tempSplSndKTFName[0] + ".mp3"')
      ? [{line: index + 1, text: text.trim()}]
      : []);
  invariant(spanishPathConstructions.length === 3, "key-term SAD path construction count changed");
  const playerFunction = extractActionScriptFunction(source, "doPlayKeyTermAudio");
  invariant(playerFunction, "doPlayKeyTermAudio is missing");
  invariant(playerFunction.includes("if (strKTAudioLang == \"English\")"), "key-term language selection changed");
  invariant(playerFunction.includes("loadSound(SndKTEFName,false)"), "key-term English loadSound route changed");
  invariant(playerFunction.includes("loadSound(SndKTSFName,false)"), "key-term Spanish loadSound route changed");
  invariant(!playerFunction.includes('"SA/"') && !playerFunction.includes("L12VB05") && !playerFunction.includes("L13VB"),
    "key-term player unexpectedly contains a course-audio route");
  return {
    ...binding,
    basenameDerivation: "splKeyTerm[6].toLowerCase().split(\".\")[0]",
    xmlBasename: "Acute_angle.swf",
    derivedStem: "acute_angle",
    englishPathTemplate: "<xmlPath>/EAD/<lowercase ExFileName stem>.mp3",
    spanishPathTemplate: "<xmlPath>/SAD/<lowercase ExFileName stem>.mp3",
    derivedSpanishPath: EXPECTED_SPANISH_AUDIO_RELATIVE,
    spanishPathConstructions,
    playerFunction: {
      name: "doPlayKeyTermAudio",
      normalizedSha256: sha256Bytes(Buffer.from(`${playerFunction.replace(/\s+$/g, "")}\n`, "utf8")),
      directlySelectsEnglishAndSpanishVariables: true,
      courseSaRoutePresent: false,
      semanticCandidateBasenamePresent: false,
      aliasOrFallbackImplemented: false,
    },
  };
}

function collectNonemptySoundNames(value, location = "root", output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectNonemptySoundNames(entry, `${location}[${index}]`, output));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (key === "soundName" && typeof entry === "string" && entry.length > 0) output.push({location, soundName: entry});
      collectNonemptySoundNames(entry, `${location}.${key}`, output);
    }
  }
  return output;
}

async function inspectSourceAndAuditBindings(root) {
  const sourceSwf = await bindFile(root, SOURCE_SWF_RELATIVE, EXPECTED_HASHES.sourceSwf);
  const sourceFla = await bindFile(root, SOURCE_FLA_RELATIVE, EXPECTED_HASHES.sourceFla);
  const hostSwf = await bindFile(root, HOST_SWF_RELATIVE, EXPECTED_HASHES.hostSwf);
  const {binding: audioAuditBinding, value: audioAudit} = await bindJson(root, AUDIO_AUDIT_RELATIVE);
  invariant(audioAudit.schemaVersion === 2 && audioAudit.animationId === ANIMATION_ID, "audio audit identity changed");
  invariant(audioAudit.source?.observedSha256 === EXPECTED_HASHES.sourceSwf && audioAudit.source?.hashMatches === true,
    "audio audit source binding changed");
  invariant(audioAudit.externalAudio?.exactCount === 1 && audioAudit.externalAudio?.missingExpectedCount === 1,
    "audio audit exact/missing counts changed");
  const missing = audioAudit.externalAudio.expectedButMissing || [];
  invariant(missing.length === 1 && missing[0].sourceFile === EXPECTED_SPANISH_AUDIO_RELATIVE
    && missing[0].status === "missing-source", "audio audit missing Spanish source finding changed");
  invariant((audioAudit.embeddedAudio?.defineSounds || []).length === 0
    && (audioAudit.embeddedAudio?.soundStreams || []).length === 0
    && (audioAudit.embeddedAudio?.startSounds || []).length === 0,
  "audio audit unexpectedly reports embedded audio");

  const {binding: machineAuditBinding, value: machineAudit} = await bindJson(root, MACHINE_AUDIT_RELATIVE);
  invariant(machineAudit.schemaVersion === 1 && machineAudit.animationId === ANIMATION_ID, "machine audit identity changed");
  invariant(machineAudit.source?.expectedSha256 === EXPECTED_HASHES.sourceSwf
    && machineAudit.source?.hashMatches === true, "machine audit SWF binding changed");
  invariant(machineAudit.authoringSource?.expectedSha256 === EXPECTED_HASHES.sourceFla
    && machineAudit.authoringSource?.hashMatches === true, "machine audit FLA binding changed");
  invariant(Object.keys(machineAudit.findings?.swfmill?.categories?.soundTags || {}).length === 0,
    "SWF machine audit now contains sound tags");

  const {binding: authoringAuditBinding, value: authoringAudit} = await bindJson(root, AUTHORING_AUDIT_RELATIVE);
  invariant(authoringAudit.schemaVersion === 2 && authoringAudit.animationId === ANIMATION_ID,
    "Animate authoring audit identity changed");
  invariant(authoringAudit.source?.fla === SOURCE_FLA_RELATIVE
    && authoringAudit.source?.flaSha256 === EXPECTED_HASHES.sourceFla, "Animate authoring source binding changed");
  invariant(authoringAudit.protocol?.recursiveLibraryTimelineAuditVerified === true,
    "Animate recursive library audit is not verified");
  const library = authoringAudit.authoringAudit?.library || [];
  invariant(authoringAudit.nativeMovie?.libraryItemCount === library.length, "Animate library count changed");
  const nonemptySoundNames = collectNonemptySoundNames(authoringAudit.authoringAudit);
  invariant(nonemptySoundNames.length === 0, "Animate authoring audit now contains a sound placement");
  invariant(library.every(({itemType}) => itemType !== "sound"), "Animate library now contains a sound item");

  return {
    sources: {hostSwf, sourceSwf, sourceFla},
    machineAudioAudit: {
      ...audioAuditBinding,
      exactExternalCount: audioAudit.externalAudio.exactCount,
      expectedMissingCount: audioAudit.externalAudio.missingExpectedCount,
      expectedSpanishStatus: missing[0].status,
      embeddedDefineSoundCount: audioAudit.embeddedAudio.defineSounds.length,
      embeddedSoundStreamCount: audioAudit.embeddedAudio.soundStreams.length,
      embeddedStartSoundCount: audioAudit.embeddedAudio.startSounds.length,
      strictAudioAcceptance: audioAudit.acceptance?.strictAudioAcceptance,
    },
    swfMachineAudit: {
      ...machineAuditBinding,
      soundTagCategories: machineAudit.findings.swfmill.categories.soundTags,
      actionScriptVersion: machineAudit.findings.actionScriptVersion,
      sourceHashesMatch: true,
    },
    animateAuthoringAudit: {
      ...authoringAuditBinding,
      animateVersion: authoringAudit.animateVersion,
      recursiveLibraryTimelineAuditVerified: true,
      libraryItemCount: library.length,
      libraryItems: library.map(({name, itemType}) => ({name, itemType})),
      soundLibraryItemCount: 0,
      nonemptySoundPlacementCount: nonemptySoundNames.length,
      authorityBoundary: "FLA authoring structure only; this audit does not prove host playback or external-audio listening/synchronization.",
    },
  };
}

async function inspectSemanticCourseCandidates(root, mp3Scan) {
  const {binding, value: catalog} = await bindJson(root, ANIMATION_CATALOG_RELATIVE);
  invariant(catalog.schemaVersion === 1 && Array.isArray(catalog.animations), "animation catalog schema changed");
  const placements = catalog.animations
    .filter(({classification}) => classification?.collection === "course")
    .filter(({classification}) => /acute angle|angulo agudo/.test(normalizedSearchText([
      classification.titleRaw,
      classification.titleDisplay,
      classification.titleEnglish,
      classification.titleSpanish,
    ].filter(Boolean).join(" "))))
    .sort((left, right) => compareText(left.animationId, right.animationId));
  invariant(JSON.stringify(placements.map(({animationId}) => animationId)) === JSON.stringify(EXPECTED_SEMANTIC_COURSE_IDS),
    "semantic acute-angle course placement set changed");

  const reportPlacements = placements.map((animation) => {
    const audio = (animation.audio?.exact || []).map((candidate) => {
      const expectedHash = EXPECTED_SEMANTIC_AUDIO.get(candidate.path);
      invariant(expectedHash, `unexpected semantic-course audio candidate: ${candidate.path}`);
      const scanned = mp3Scan.byPath.get(candidate.path);
      invariant(scanned?.fileSha256 === expectedHash && candidate.sha256 === expectedHash,
        `${candidate.path} semantic candidate hash changed`);
      const byteCopyCount = mp3Scan.records.filter(({fileSha256}) => fileSha256 === scanned.fileSha256).length;
      const payloadCopyCount = mp3Scan.records.filter(({payloadSha256}) => payloadSha256 === scanned.payloadSha256).length;
      invariant(byteCopyCount === 1 && payloadCopyCount === 1, `${candidate.path} is no longer unique`);
      return {
        ...scanned,
        association: candidate.association,
        catalogLanguage: candidate.language,
        structuralLanguage: candidate.path.split("/").includes("SA") ? "es" : "und",
        byteCopyCount,
        payloadCopyCount,
        authorityStatus: "semantic-course-candidate-only",
        promotedToKeytermCue: false,
        promotionProhibitedReason: "The course host resolves this sibling SA file by the course-page basename; the key-term host instead resolves SAD/acute_angle.mp3 and contains no route to this file.",
      };
    });
    return {
      animationId: animation.animationId,
      source: {
        path: `${ARCHIVE_ROOT}/${animation.source.path}`,
        sha256: animation.source.sha256,
      },
      titleEnglish: animation.classification.titleEnglish,
      titleSpanish: animation.classification.titleSpanish,
      exactCourseAudioCandidates: audio,
      candidateStatus: audio.length ? "semantic-audio-candidate-not-promoted" : "semantic-course-placement-with-no-external-audio-candidate",
      promotedToKeytermCue: false,
    };
  });
  invariant(reportPlacements.flatMap(({exactCourseAudioCandidates}) => exactCourseAudioCandidates).length
    === EXPECTED_SEMANTIC_AUDIO.size, "semantic audio candidate count changed");
  return {
    catalog: binding,
    placementCount: reportPlacements.length,
    audioCandidateCount: EXPECTED_SEMANTIC_AUDIO.size,
    placements: reportPlacements,
    conclusion: "Title similarity identifies review candidates only. None has a legacy key-term SAD path, alias/fallback reference, matching known target hash, or provenance permitting promotion.",
  };
}

export async function buildReport({root = projectRoot} = {}) {
  const generator = await bindFile(root, portable(path.relative(root, scriptPath)));
  invariant(generator.path === "scripts/audit-acute-angle-spanish-audio-forensics.mjs",
    "generator must run from the project scripts directory");
  const xmlReferences = await inspectXmlSources(root);
  const hostContract = await inspectHostContract(root);
  const sourceAndAudits = await inspectSourceAndAuditBindings(root);
  const mp3Scan = await scanMp3Inventory(root);
  const semanticCourseCandidates = await inspectSemanticCourseCandidates(root, mp3Scan);
  const sadEntries = await readdir(path.join(root, KEYTERM_SAD_DIRECTORY_RELATIVE), {withFileTypes: true});
  invariant(sadEntries.length === 0, "key-term SAD directory is no longer empty; provenance review is required");

  return {
    schemaVersion: 1,
    artifactType: "acute-angle-spanish-audio-source-forensics",
    animationId: ANIMATION_ID,
    generator,
    scope: "deterministic-source-path-provenance-and-full-archive-mp3-payload-forensics",
    sourceMutationPerformed: false,
    migrationStatusUnchanged: true,
    acceptanceBoundary: {
      strictAcceptanceEffect: false,
      audioAcceptanceChanged: false,
      humanReviewRecorded: false,
      ownerAcceptanceRecorded: false,
      listeningEvidenceRecorded: false,
      sourceSubstitutionAuthorized: false,
    },
    xmlReferences,
    hostContract,
    sourceAndAudits,
    keytermSpanishDirectory: {
      path: KEYTERM_SAD_DIRECTORY_RELATIVE,
      exists: true,
      entryCount: sadEntries.length,
      fileCount: 0,
    },
    mp3Inventory: mp3Scan.report,
    semanticCourseCandidates,
    conclusion: {
      expectedSource: EXPECTED_SPANISH_AUDIO_RELATIVE,
      status: "missing-source",
      authoritativeSourceRecovered: false,
      authoritativeTargetSha256Known: false,
      exactAliasRecovered: false,
      semanticCandidatePromoted: false,
      strictBlocker: true,
      blocker: "The legacy key-term host requires SAD/acute_angle.mp3, but the preserved SAD directory is empty and no provenance-backed alias or embedded copy exists.",
    },
    limitations: [
      "Because the expected Spanish file is absent, there is no authoritative target byte or payload hash against which arbitrary differently named or differently encoded MP3s can be compared.",
      "Filename, catalog, exact-byte, stripped-payload, XML, host-code, SWF, and FLA evidence cannot substitute for authoritative listening or prove the spoken content of a candidate.",
      "Course SA files with related titles remain separate course assets; this report does not authorize copying, renaming, synthesizing, or accepting any of them as the key-term source.",
    ],
    nextRequiredEvidence: [
      "Obtain HELP_KEYTERMS/KT/ELEMENTARY/SAD/acute_angle.mp3 from an owner-controlled original deployment, LMS web root, delivery medium, or backup with custody/provenance metadata.",
      "Record the recovered file's SHA-256, byte count, media probe, original location, custodian, and acquisition date before staging it as a source asset.",
      "After provenance validation, perform named-human authorized original-host Spanish listening, start/stop/synchronization, completion, and Replay review; this generator cannot perform or sign that review.",
    ],
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`Usage: node scripts/audit-acute-angle-spanish-audio-forensics.mjs [--check] [--root <project-root>]\n`);
    return;
  }
  const report = await buildReport({root: options.root});
  const rendered = stableJson(report);
  const output = path.join(options.root, OUTPUT_RELATIVE);
  if (options.check) {
    let current;
    try {
      current = await readFile(output, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`${OUTPUT_RELATIVE} is missing; generate it first`);
      throw error;
    }
    invariant(current === rendered, `${OUTPUT_RELATIVE} is stale; regenerate it`);
    process.stdout.write(`${JSON.stringify({status: "current", output: OUTPUT_RELATIVE, sha256: sha256Bytes(Buffer.from(rendered))})}\n`);
    return;
  }
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, rendered);
  process.stdout.write(`${JSON.stringify({status: "generated", output: OUTPUT_RELATIVE, sha256: sha256Bytes(Buffer.from(rendered))})}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

