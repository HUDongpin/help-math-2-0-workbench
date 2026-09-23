#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

const ANIMATION_ID = "course-g03-l08-re-001";
const ARCHIVE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
const OUTPUT_RELATIVE = `${MIGRATION_ROOT}/audit/host-payload-boundary.json`;
const CHILD_SCRIPTS_RELATIVE = `${MIGRATION_ROOT}/audit/machine/ffdec-scripts.txt.gz`;
const CHILD_STRUCTURE_RELATIVE = `${MIGRATION_ROOT}/audit/machine/swfmill.xml.gz`;
const MACHINE_REPORT_RELATIVE = `${MIGRATION_ROOT}/audit/machine/report.json`;
const SOURCE_CATALOG_RELATIVE = "catalog/source-files.json";
const MISSING_REFERENCES_RELATIVE = "catalog/missing-references.json";
const UNREFERENCED_RELATIVE = "catalog/unreferenced.json";

const SOURCES = Object.freeze({
  target: Object.freeze({
    role: "target-historical-review-swf",
    catalogPath: "HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf",
    projectPath: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf`,
    bytes: 153236,
    sha256: "e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b",
  }),
  sameLessonHost: Object.freeze({
    role: "same-lesson-course-shell",
    catalogPath: "HELP_COURSES/ELMGR3/L8/index_local.swf",
    projectPath: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L8/index_local.swf`,
    bytes: 672216,
    sha256: "3c3a21c70d3d05eec2d9358f7c28e999ff811d7733fa7ed4b7bf353697e42999",
  }),
  courseXml: Object.freeze({
    role: "active-same-lesson-course-xml",
    catalogPath: "HELP_COURSES/ELMGR3/L8/index.xml",
    projectPath: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L8/index.xml`,
    bytes: 13549,
    sha256: "b3f545ec540a042e8369cc2d1d75d5ed69754ac167ca7de67947b39e5a54d72a",
  }),
  historicalFqReview: Object.freeze({
    role: "unreferenced-historical-fq-review-cross-reference-only",
    catalogPath: "HELP_COURSES/ELMGR3/L8/FQ/Review/L8FQ03.swf",
    projectPath: `${ARCHIVE_ROOT}/HELP_COURSES/ELMGR3/L8/FQ/Review/L8FQ03.swf`,
    bytes: 186870,
    sha256: "097b6faa8d1c2a449e438b53965f81d8b3a73dd444d3d60031395d2fb2dac80f",
  }),
});

const EXPECTED = Object.freeze({
  ffdecVersion: "JPEXS Free Flash Decompiler v.26.2.1",
  ffdecJarSha256: "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f",
  childScriptsSha256: "81546d70e37dee258ff2f79f4eda7da861460f50e781ea4027c249d6754209b6",
  childScriptsUncompressedSha256:
    "a8048306b6bb1dfc5a00a65876a8e9b297786d80b99b679aa367337874f8978c",
  childStructureSha256: "547b2ae4466ce60c4c6fd5290ec95953b8ddc4e02aa5e3e319229b0af5f14967",
  childStructureUncompressedSha256:
    "8c7d8c6cb7c7a00c92cd7aa6ef3b78f38226a98bb452c611b83bf044f78600e1",
  childScriptCount: 6,
  hostScriptCount: 573,
  historicalFqReviewScriptCount: 135,
});

const ACTIVE_MISSING_FQ_PATHS = Object.freeze([
  "HELP_COURSES/ELMGR3/L8/FQ/L8FQ02.swf",
  "HELP_COURSES/ELMGR3/L8/FQ/L8FQ03.swf",
]);

const CHILD_SCRIPT_PATHS = Object.freeze({
  next: "DefineButton2_75/BUTTONCONDACTION on(release).as",
  previous: "DefineButton2_80/BUTTONCONDACTION on(release).as",
  back: "DefineButton2_85/BUTTONCONDACTION on(release).as",
  spriteEntry: "DefineSprite_621/frame_1/DoAction.as",
  rootEntry: "frame_1/DoAction.as",
  rootBegin: "frame_51/DoAction.as",
});

const HOST_PAYLOAD_SEARCHES = Object.freeze([
  Object.freeze({id: "reviewans-token", query: "REVIEWANS", caseSensitive: false}),
  Object.freeze({id: "dtf-reviewans-field", query: "dtfREVIEWANS", caseSensitive: false}),
  Object.freeze({id: "target-basename", query: "L8RE01", caseSensitive: false}),
  Object.freeze({
    id: "target-exact-relative-path",
    query: "RE/L8RE01.swf",
    caseSensitive: false,
  }),
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
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

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function run(command, args, {cwd = projectRoot, timeoutMs = 180_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else {
        reject(
          new Error(
            `${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`,
          ),
        );
      }
    });
  });
}

function findOnPath(name, pathValue = process.env.PATH || "") {
  if (path.isAbsolute(name) || name.includes(path.sep)) return path.resolve(name);
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Keep looking for the explicitly requested executable.
    }
  }
  return null;
}

async function inspectFfdec(ffdecArgument) {
  const commandPath = findOnPath(ffdecArgument);
  invariant(commandPath, `FFDec executable not found: ${ffdecArgument}`);
  const launcherPath = await realpath(commandPath);
  const {stdout, stderr} = await run(commandPath, ["-help"], {timeoutMs: 30_000});
  const help = (stdout || stderr).replace(/\u001b\[[0-9;]*m/g, "");
  const version = help
    .split(/\r?\n/)
    .find((line) => line.startsWith("JPEXS Free Flash Decompiler v."));
  invariant(
    version === EXPECTED.ffdecVersion,
    `FFDec version changed: expected ${EXPECTED.ffdecVersion}, observed ${version || "unknown"}`,
  );
  const jarPath = path.join(path.dirname(launcherPath), "ffdec.jar");
  const jarSha256 = await sha256File(jarPath);
  invariant(
    jarSha256 === EXPECTED.ffdecJarSha256,
    `FFDec jar changed: expected ${EXPECTED.ffdecJarSha256}, observed ${jarSha256}`,
  );
  return {launcherPath, version, jarSha256};
}

async function listFiles(root, current = root) {
  const result = [];
  const entries = (await readdir(current, {withFileTypes: true})).sort((left, right) =>
    compareText(left.name, right.name)
  );
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...(await listFiles(root, absolute)));
    else if (entry.isFile()) {
      result.push({absolute, relativePath: portable(path.relative(root, absolute))});
    } else {
      throw new Error(`FFDec export contains unsupported entry ${absolute}`);
    }
  }
  return result;
}

export function normalizeActionScript(raw) {
  const normalized = raw.toString("utf8").replace(/\r\n?/g, "\n").replace(/\n*$/g, "");
  return `${normalized}\n`;
}

async function exportScripts({root, ffdec, source}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-re001-payload-"));
  invariant(
    path.dirname(temporaryRoot) === path.resolve(os.tmpdir()),
    `unsafe temporary FFDec root: ${temporaryRoot}`,
  );
  try {
    await run(
      ffdec.launcherPath,
      [
        "-onerror",
        "abort",
        "-export",
        "script",
        temporaryRoot,
        path.join(root, source.projectPath),
      ],
      {cwd: root},
    );
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFiles(scriptsRoot);
    const records = [];
    for (const file of files) {
      const raw = await readFile(file.absolute);
      const normalized = normalizeActionScript(raw);
      records.push({
        path: file.relativePath,
        bytes: raw.length,
        rawSha256: sha256(raw),
        normalizedBytes: Buffer.byteLength(normalized, "utf8"),
        normalizedSha256: sha256(Buffer.from(normalized, "utf8")),
        normalized,
      });
    }
    return summarizeScriptExport(records);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

function summarizeScriptExport(records) {
  const index = records.map(({normalized, ...record}) => record);
  const bodyCounts = new Map();
  for (const record of records) {
    bodyCounts.set(
      record.normalizedSha256,
      (bodyCounts.get(record.normalizedSha256) || 0) + 1,
    );
  }
  const bodyMultiset = [...bodyCounts.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([bodySha256, count]) => ({bodySha256, count}));
  return {
    records,
    summary: {
      scriptCount: records.length,
      indexHashMode: "stable-key-sorted-pretty-json-array-v1",
      indexSha256: sha256(Buffer.from(stableJson(index), "utf8")),
      normalizedBodyMultisetHashMode: "stable-key-sorted-pretty-json-array-v1",
      normalizedBodyMultisetSha256: sha256(
        Buffer.from(stableJson(bodyMultiset), "utf8"),
      ),
      normalization: "CRLF-or-CR-to-LF; remove terminal newlines; append exactly one LF",
    },
  };
}

function queryExport(records, definition) {
  const matchingFiles = [];
  let occurrenceCount = 0;
  const needle = definition.caseSensitive
    ? definition.query
    : definition.query.toLocaleLowerCase("en-US");
  for (const record of records) {
    const haystack = definition.caseSensitive
      ? record.normalized
      : record.normalized.toLocaleLowerCase("en-US");
    let cursor = 0;
    let count = 0;
    while (true) {
      const index = haystack.indexOf(needle, cursor);
      if (index < 0) break;
      count += 1;
      cursor = index + needle.length;
    }
    if (count > 0) {
      matchingFiles.push({path: record.path, occurrenceCount: count});
      occurrenceCount += count;
    }
  }
  return {
    id: definition.id,
    query: definition.query,
    caseSensitive: definition.caseSensitive,
    matchingFileCount: matchingFiles.length,
    occurrenceCount,
    matchingFiles,
  };
}

function exactRecord(exported, relativePath) {
  const matches = exported.records.filter(({path: recordPath}) => recordPath === relativePath);
  invariant(
    matches.length === 1,
    `expected exactly one FFDec script ${relativePath}; observed ${matches.length}`,
  );
  return matches[0];
}

function scriptBinding(record, requiredTokens) {
  const missingTokens = requiredTokens.filter((token) => !record.normalized.includes(token));
  return {
    path: record.path,
    rawBytes: record.bytes,
    rawSha256: record.rawSha256,
    normalizedBytes: record.normalizedBytes,
    normalizedSha256: record.normalizedSha256,
    requiredTokens,
    missingTokens,
    exact: missingTokens.length === 0,
  };
}

export function parseMachineScriptBundle(bundle) {
  const text = normalizeActionScript(bundle);
  const marker = /^===== (.+?) =====\n/gm;
  const starts = [...text.matchAll(marker)];
  const records = [];
  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index];
    const bodyStart = current.index + current[0].length;
    const bodyEnd = index + 1 < starts.length ? starts[index + 1].index : text.length;
    const normalized = normalizeActionScript(Buffer.from(text.slice(bodyStart, bodyEnd)));
    records.push({
      path: current[1],
      normalizedBytes: Buffer.byteLength(normalized, "utf8"),
      normalizedSha256: sha256(Buffer.from(normalized, "utf8")),
      normalized,
    });
  }
  invariant(records.length > 0, "machine ActionScript bundle has no section markers");
  return records;
}

function parseAttributes(attributeText) {
  const attributes = {};
  for (const match of attributeText.matchAll(/([A-Za-z_][A-Za-z0-9_:.-]*)="([^"]*)"/g)) {
    invariant(!(match[1] in attributes), `duplicate XML attribute ${match[1]}`);
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function exactTagAttributes(xml, tagName, predicate, description) {
  const matches = [...xml.matchAll(new RegExp(`<${tagName}\\s+([^>]+)>`, "g"))]
    .map((match) => parseAttributes(match[1]))
    .filter(predicate);
  invariant(matches.length === 1, `expected one ${description}; observed ${matches.length}`);
  return matches[0];
}

function parseRootDynamicFields(structureXml) {
  const definitions = [
    {objectId: "3", instanceName: "dtfSTUDENT", variableName: "STUDENT"},
    {objectId: "4", instanceName: "dtfREVIEWANS", variableName: "REVIEWANS"},
  ];
  return definitions.map((definition) => {
    const field = exactTagAttributes(
      structureXml,
      "DefineEditText",
      (attributes) => attributes.objectID === definition.objectId,
      `DefineEditText objectID ${definition.objectId}`,
    );
    const placement = exactTagAttributes(
      structureXml,
      "PlaceObject2",
      (attributes) =>
        attributes.objectID === definition.objectId &&
        attributes.name === definition.instanceName,
      `PlaceObject2 ${definition.instanceName}`,
    );
    invariant(
      field.variableName === definition.variableName,
      `${definition.instanceName} variableName changed`,
    );
    return {
      objectId: definition.objectId,
      instanceName: definition.instanceName,
      variableName: field.variableName,
      initialTextAttributePresent: Object.hasOwn(field, "initialText"),
      initialText: Object.hasOwn(field, "initialText") ? field.initialText : null,
      readOnly: field.readOnly === "1",
      placementDepth: placement.depth,
    };
  });
}

function parseSprite621Structure(structureXml) {
  const match = structureXml.match(
    /<DefineSprite\s+objectID="621"\s+frames="27">([\s\S]*?)<\/DefineSprite>/,
  );
  invariant(match, "swfmill structure no longer has sprite-621 with 27 frames");
  const frameLabels = [...match[1].matchAll(/<FrameLabel\s+label="([^"]+)"/g)]
    .map((entry) => entry[1]);
  const showFrameCount = (match[1].match(/<ShowFrame\/>/g) || []).length;
  return {sourceObjectId: "621", frameCount: 27, showFrameCount, frameLabels};
}

async function inspectFrozenSource(root, catalogByPath, definition) {
  const absolute = path.join(root, definition.projectPath);
  const archive = await realpath(path.join(root, ARCHIVE_ROOT));
  const resolved = await realpath(absolute);
  invariant(
    isInside(resolved, archive),
    `${definition.role} resolves outside the preserved archive`,
  );
  const metadata = await lstat(absolute);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${definition.role} is not a regular source file`,
  );
  invariant((metadata.mode & 0o222) === 0, `${definition.role} is writable`);
  const hash = await sha256File(absolute);
  invariant(
    metadata.size === definition.bytes,
    `${definition.role} byte count changed: expected ${definition.bytes}, observed ${metadata.size}`,
  );
  invariant(
    hash === definition.sha256,
    `${definition.role} hash changed: expected ${definition.sha256}, observed ${hash}`,
  );
  const catalogEntry = catalogByPath.get(definition.catalogPath);
  invariant(catalogEntry, `${definition.role} is missing from ${SOURCE_CATALOG_RELATIVE}`);
  invariant(
    catalogEntry.bytes === metadata.size && catalogEntry.sha256 === hash,
    `${definition.role} differs from ${SOURCE_CATALOG_RELATIVE}`,
  );
  return {
    role: definition.role,
    path: definition.projectPath,
    catalogPath: definition.catalogPath,
    bytes: metadata.size,
    sha256: hash,
    sourceMode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
    frozenCatalogBinding: "verified-current-read-only-source",
  };
}

function sourceLinesContaining(xmlText, value) {
  return xmlText.split("\n").flatMap((text, index) =>
    text.includes(value) ? [{line: index + 1, text: text.trim()}] : []
  );
}

function parseActiveCourseXml(xmlRaw) {
  const normalized = xmlRaw.toString("utf8").replace(/\r\n?/g, "\n");
  const fqSections = normalized.match(/<Section\s+SName="FQ"[\s>][\s\S]*?<\/Section>/g) || [];
  invariant(fqSections.length === 1, `expected one active FQ section; observed ${fqSections.length}`);
  const activeFqPages = [...fqSections[0].matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/g)]
    .map((match) => match[1].trim());
  const reviewSections = normalized.match(/<Section\s+SName="RE"[\s>]/g) || [];
  const targetExactPlacementCount = (
    normalized.match(/>RE\/L8RE01\.swf<\/Page>/g) || []
  ).length;
  const targetBasenameMatchCount = (normalized.match(/L8RE01\.swf/g) || []).length;
  return {
    activeFqPages,
    activeFqPageSourceLines: activeFqPages.map((page) => ({
      page,
      matches: sourceLinesContaining(normalized, page),
    })),
    reviewSectionCount: reviewSections.length,
    targetExactPlacementCount,
    targetBasenameMatchCount,
    historicalReviewExactPlacementCount: (
      normalized.match(/>FQ\/Review\/L8FQ03\.swf<\/Page>/g) || []
    ).length,
  };
}

function machineEvidenceBinding(relativePath, raw, expectedSha256, expectedUncompressedSha256) {
  const observedSha256 = sha256(raw);
  invariant(
    observedSha256 === expectedSha256,
    `${relativePath} hash changed: expected ${expectedSha256}, observed ${observedSha256}`,
  );
  const uncompressed = gunzipSync(raw);
  const uncompressedSha256 = sha256(uncompressed);
  invariant(
    uncompressedSha256 === expectedUncompressedSha256,
    `${relativePath} uncompressed hash changed`,
  );
  return {
    path: relativePath,
    sha256: observedSha256,
    uncompressedBytes: uncompressed.length,
    uncompressedSha256,
  };
}

function findCatalogMissingRecords(missingCatalog) {
  return ACTIVE_MISSING_FQ_PATHS.map((expectedPath) => {
    const matches = missingCatalog.course.filter((entry) => entry.expectedPath === expectedPath);
    invariant(
      matches.length === 1,
      `expected one missing-reference record for ${expectedPath}; observed ${matches.length}`,
    );
    const record = matches[0];
    invariant(record.exists === false && record.resolvedPath === null, `${expectedPath} is no longer missing`);
    invariant(record.occurrences.length === 1, `${expectedPath} occurrence count changed`);
    return {
      expectedPath,
      resolvedPath: record.resolvedPath,
      exists: record.exists,
      activeXmlOccurrence: record.occurrences[0].occurrence,
      activeReference: record.occurrences[0].reference,
    };
  });
}

function findHistoricalUnreferencedRecord(unreferencedCatalog) {
  const matches = unreferencedCatalog.course.filter(
    (entry) => entry.sourcePath === SOURCES.historicalFqReview.catalogPath,
  );
  invariant(
    matches.length === 1,
    `expected one unreferenced record for ${SOURCES.historicalFqReview.catalogPath}`,
  );
  const record = matches[0];
  invariant(record.flags?.unreferenced === true, "historical FQ Review is no longer unreferenced");
  invariant(record.flags?.variantKind === "review", "historical FQ Review variant kind changed");
  return record;
}

function exactBundledRecord(records, relativePath) {
  const matches = records.filter(({path: recordPath}) => recordPath === relativePath);
  invariant(
    matches.length === 1,
    `expected one bundled ActionScript ${relativePath}; observed ${matches.length}`,
  );
  return matches[0];
}

function historicalPayloadBuilder(historicalExport) {
  const seedRecord = exactRecord(
    historicalExport,
    "DefineSprite_962/frame_1/DoAction.as",
  );
  const finalRecord = exactRecord(
    historicalExport,
    "DefineSprite_135/frame_2/DoAction.as",
  );
  const seedLine = seedRecord.normalized
    .split("\n")
    .find((line) => line.includes("_global.REVIEWANS = _global.quizLabelArray"));
  const finalLine = finalRecord.normalized
    .split("\n")
    .find((line) => line.includes("_global.REVIEWANS = _global.arrayCorrectAnswer"));
  invariant(seedLine, "historical FQ Review seed REVIEWANS assignment is missing");
  invariant(finalLine, "historical FQ Review final REVIEWANS assignment is missing");
  const expectedSeed =
    '_global.REVIEWANS = _global.quizLabelArray + "SPL" + _global.revLabelArray;';
  const expectedFinal =
    '_global.REVIEWANS = _global.arrayCorrectAnswer + "SPL" + _global.arrayWrongAnswer + "SPL" + _global.arrayResponseAnswer + "SPL" + _global.REVIEWANS + "SPL" + _global.arrayAnswer + "SPL" + _global.arrayReview;';
  invariant(seedLine.trim() === expectedSeed, "historical REVIEWANS seed expression changed");
  invariant(finalLine.trim() === expectedFinal, "historical REVIEWANS final expression changed");
  return {
    seed: {
      script: scriptBinding(seedRecord, [expectedSeed]),
      expression: expectedSeed,
      segmentOrder: ["quizLabelArray", "revLabelArray"],
      segmentCount: 2,
    },
    final: {
      script: scriptBinding(finalRecord, [expectedFinal]),
      expression: expectedFinal,
      outerLiteralSplDelimiterCount: 5,
      nestedSeedSegmentCount: 2,
      derivedSegmentCount: 7,
      derivedSegmentOrder: [
        "arrayCorrectAnswer",
        "arrayWrongAnswer",
        "arrayResponseAnswer",
        "quizLabelArray",
        "revLabelArray",
        "arrayAnswer",
        "arrayReview",
      ],
    },
  };
}

export function deriveRe001HostPayloadBoundary({
  activeCourse,
  missingActiveFqSources,
  historicalUnreferenced,
  hostExport,
  historicalExport,
  childScriptRecords,
  rootDynamicFields,
  sprite621,
  generatedBy,
  sources,
  sourceCatalog,
  machineEvidence,
}) {
  const hostSearches = HOST_PAYLOAD_SEARCHES.map((definition) =>
    queryExport(hostExport.records, definition)
  );
  const child = {
    next: scriptBinding(exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.next), [
      "_global.reviewCount++;",
      "_global.reviewCount > parseInt(_global.totalQuestionsCount)",
      "_global.reviewCount = parseInt(_global.totalQuestionsCount);",
      "doGetReview();",
    ]),
    previous: scriptBinding(
      exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.previous),
      [
        "_global.reviewCount--;",
        "_global.reviewCount < 1",
        "_global.reviewCount = 1;",
        "doGetReview();",
      ],
    ),
    back: scriptBinding(exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.back), [
      'getURL("javascript:history.back()");',
    ]),
    spriteEntry: scriptBinding(
      exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.spriteEntry),
      [
        "stop();",
        "_global.REVIEWANS = _parent.dtfREVIEWANS.text;",
        'splRevAnsValue = _global.REVIEWANS.split("SPL");',
        "_global.arrayCorrectAnswer = splRevAnsValue[0].split(\",\");",
        "_global.arrayWrongAnswer = splRevAnsValue[1].split(\",\");",
        "_global.arrayResponseAnswer = splRevAnsValue[2].split(\",\");",
        "_global.quizLabelArray = splRevAnsValue[3].split(\",\");",
        "_global.revLabelArray = splRevAnsValue[4].split(\",\");",
        "_global.arrayAnswer = splRevAnsValue[5].split(\",\");",
        "_global.arrayReview = splRevAnsValue[6].split(\",\");",
        '_global.totalQuestionsCount = "10";',
        "_global.reviewCount = 0;",
        "_global.reviewCount++;",
        "doGetReview();",
      ],
    ),
    rootEntry: scriptBinding(
      exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.rootEntry),
      ["_global.REVIEWANS = dtfREVIEWANS.text;"],
    ),
    rootBegin: scriptBinding(
      exactBundledRecord(childScriptRecords, CHILD_SCRIPT_PATHS.rootBegin),
      ["stop();", "animation.gotoAndPlay(1);"],
    ),
  };
  const historicalBuilder = historicalPayloadBuilder(historicalExport);
  const qualificationIssues = [
    ...(activeCourse.reviewSectionCount === 0
      ? []
      : [`active XML contains ${activeCourse.reviewSectionCount} RE sections`]),
    ...(activeCourse.targetExactPlacementCount === 0
      ? []
      : [`active XML contains ${activeCourse.targetExactPlacementCount} target RE placements`]),
    ...(activeCourse.targetBasenameMatchCount === 0
      ? []
      : [`active XML contains ${activeCourse.targetBasenameMatchCount} target basename matches`]),
    ...(activeCourse.historicalReviewExactPlacementCount === 0
      ? []
      : ["historical FQ Review unexpectedly became an active exact placement"]),
    ...(hostExport.records.length === EXPECTED.hostScriptCount
      ? []
      : [`same-lesson host script count is ${hostExport.records.length}`]),
    ...hostSearches.flatMap((search) =>
      search.occurrenceCount === 0
        ? []
        : [`same-lesson host ${search.id} has ${search.occurrenceCount} occurrence(s)`]
    ),
    ...(historicalExport.records.length === EXPECTED.historicalFqReviewScriptCount
      ? []
      : [`historical FQ Review script count is ${historicalExport.records.length}`]),
    ...(childScriptRecords.length === EXPECTED.childScriptCount
      ? []
      : [`target machine script count is ${childScriptRecords.length}`]),
    ...Object.values(child).flatMap((record) =>
      record.missingTokens.map((token) => `${record.path} lacks ${JSON.stringify(token)}`)
    ),
    ...rootDynamicFields.flatMap((field) =>
      field.initialTextAttributePresent
        ? [`${field.instanceName} unexpectedly has initialText`]
        : []
    ),
    ...(sprite621.showFrameCount === 27 ? [] : [`sprite-621 has ${sprite621.showFrameCount} ShowFrame tags`]),
    ...(sprite621.frameLabels.length === 26 ? [] : [`sprite-621 has ${sprite621.frameLabels.length} labels`]),
    ...(missingActiveFqSources.every((entry) => entry.exists === false)
      ? []
      : ["one or more active FQ source references unexpectedly resolve"]),
    ...(historicalUnreferenced.flags?.unreferenced === true
      ? []
      : ["historical FQ Review is no longer catalogued as unreferenced"]),
  ];

  return {
    schemaVersion: 1,
    evidenceType: "re001-host-payload-boundary",
    animationId: ANIMATION_ID,
    status: qualificationIssues.length
      ? "blocked-evidence-contract-drift"
      : "host-payload-producer-unavailable-cross-reference-bounded",
    scope: "read-only-static-source-and-machine-evidence-boundary",
    generatedBy,
    sourceCatalog,
    sources,
    machineEvidence,
    activeCourseXml: {
      path: sources.courseXml.path,
      sha256: sources.courseXml.sha256,
      ...activeCourse,
      conclusion:
        "The active Grade 3 Lesson 8 XML has no RE section or L8RE01 placement. Its FQ page 2 and page 3 references are exact-path missing sources.",
    },
    activeMissingFqSources: missingActiveFqSources,
    sameLessonHostActionScript: {
      sourcePath: sources.sameLessonHost.path,
      sourceSha256: sources.sameLessonHost.sha256,
      ...hostExport.summary,
      searches: hostSearches,
      reviewAnsProducerFound: false,
      reviewAnsCarrierFound: false,
      targetLoaderBindingFound: false,
      conclusion:
        "All 573 FFDec-exported same-lesson index_local scripts were searched. No REVIEWANS/dtfREVIEWANS token or L8RE01 path binding was found.",
    },
    targetMachineContract: {
      exportedScriptCount: childScriptRecords.length,
      rootDynamicFields,
      rootFrames: {
        frame1: child.rootEntry,
        frame51: child.rootBegin,
      },
      sprite621: {
        structure: sprite621,
        entry: child.spriteEntry,
        splPayload: {
          delimiter: "SPL",
          requiredSegmentCount: 7,
          requiredSegmentIndexes: [0, 1, 2, 3, 4, 5, 6],
          segmentOrder: [
            "arrayCorrectAnswer",
            "arrayWrongAnswer",
            "arrayResponseAnswer",
            "quizLabelArray",
            "revLabelArray",
            "arrayAnswer",
            "arrayReview",
          ],
          sourcePayloadAvailable: false,
        },
        boundedReviewNavigation: {
          sourceTotalQuestionsCount: 10,
          reachableCounterLowerBound: 1,
          reachableCounterUpperBound: 10,
          next: child.next,
          previous: child.previous,
        },
        back: {
          script: child.back,
          sourceOperation: 'getURL("javascript:history.back()")',
          safeModernExecutionAuthorized: false,
        },
      },
    },
    historicalFqReviewCrossReference: {
      sourcePath: sources.historicalFqReview.path,
      sourceSha256: sources.historicalFqReview.sha256,
      activeExactPlacement: false,
      catalogUnreferenced: historicalUnreferenced.flags.unreferenced,
      catalogVariantKind: historicalUnreferenced.flags.variantKind,
      ...historicalExport.summary,
      reviewAnsSearch: queryExport(historicalExport.records, {
        id: "historical-reviewans-token",
        query: "REVIEWANS",
        caseSensitive: false,
      }),
      payloadBuilder: historicalBuilder,
      payloadTransferIntoL8RE01Observed: false,
      requirementUnlockEffect: "none",
      authority:
        "cross-reference-only; basename similarity and a structurally compatible seven-segment builder do not establish the missing active FQ runtime or target host handoff",
    },
    boundaryConclusion: {
      authoritativeReviewAnsPayloadAvailable: false,
      payloadProducerInActiveLessonEvidence: false,
      sameLessonHostCarriesPayload: false,
      activeFqPage2SourceAvailable: false,
      activeFqPage3SourceAvailable: false,
      historicalVariantMaySubstituteForMissingActiveSource: false,
      historicalPayloadTransferToTargetObserved: false,
      targetR1ThroughR10RuntimeStateResolved: false,
      targetR11ThroughR25ReachabilityResolved: false,
      previousNextNaturalExecutionObserved: false,
      legacyBackNaturalExecutionObserved: false,
      rendererScenarioUnblocked: false,
    },
    evidenceDelta: {
      requirementsAdded: 0,
      implementationFramesAdded: 0,
    },
    acceptance: {
      authoritativeOriginalRuntimeBaseline: false,
      audioAcceptance: false,
      behaviorParity: false,
      coverageAcceptance: false,
      fullFrameRmseAcceptance: false,
      humanVisualReview: false,
      migrationCompletion: false,
      migrationStatusChanged: false,
      ownerAcceptance: false,
      rendererAcceptance: false,
      strictAcceptance: false,
    },
    qualificationIssues,
    limitations: [
      "This report is a reproducible static boundary audit, not an authorized original-runtime trace.",
      "The target SWF proves that sprite-621 consumes seven SPL-delimited segments and clamps reviewCount to 1..10, but neither the payload values nor their target handoff are present in the active lesson evidence.",
      "The same-lesson index_local SWF has no REVIEWANS carrier or L8RE01 binding in all 573 exported scripts.",
      "The active FQ/L8FQ02.swf and FQ/L8FQ03.swf sources are missing. The existing FQ/Review/L8FQ03.swf is unreferenced historical cross-evidence only and cannot be substituted by basename.",
      "No renderer state, capture requirement, implementation frame, baseline, RMSE, audio, human review, owner acceptance, parity, status, or strict-completion gate changes.",
    ],
  };
}

export function parseArguments(args) {
  const options = {check: false, ffdec: "ffdec", root: projectRoot};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--ffdec" || value === "--root") {
      const next = args[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else options.root = path.resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

export async function buildRe001HostPayloadBoundary({
  root = projectRoot,
  ffdec: ffdecArgument = "ffdec",
  check = false,
} = {}) {
  const [
    scriptRaw,
    sourceCatalogRaw,
    missingReferencesRaw,
    unreferencedRaw,
    childScriptsRaw,
    childStructureRaw,
    machineReportRaw,
    ffdec,
  ] = await Promise.all([
    readFile(scriptPath),
    readFile(path.join(root, SOURCE_CATALOG_RELATIVE)),
    readFile(path.join(root, MISSING_REFERENCES_RELATIVE)),
    readFile(path.join(root, UNREFERENCED_RELATIVE)),
    readFile(path.join(root, CHILD_SCRIPTS_RELATIVE)),
    readFile(path.join(root, CHILD_STRUCTURE_RELATIVE)),
    readFile(path.join(root, MACHINE_REPORT_RELATIVE)),
    inspectFfdec(ffdecArgument),
  ]);

  const sourceCatalog = JSON.parse(sourceCatalogRaw);
  invariant(
    sourceCatalog.schemaVersion === 1 && Array.isArray(sourceCatalog.files),
    `${SOURCE_CATALOG_RELATIVE} schema changed`,
  );
  const catalogByPath = new Map(sourceCatalog.files.map((entry) => [entry.path, entry]));
  const sources = {};
  for (const [id, definition] of Object.entries(SOURCES)) {
    sources[id] = await inspectFrozenSource(root, catalogByPath, definition);
  }

  const activeMissingPaths = ACTIVE_MISSING_FQ_PATHS.map((catalogPath) =>
    path.join(root, ARCHIVE_ROOT, catalogPath)
  );
  const activeMissingExists = await Promise.all(activeMissingPaths.map(exists));
  invariant(
    activeMissingExists.every((value) => value === false),
    "an active missing FQ source unexpectedly exists",
  );
  for (const catalogPath of ACTIVE_MISSING_FQ_PATHS) {
    invariant(!catalogByPath.has(catalogPath), `${catalogPath} unexpectedly exists in source catalog`);
  }

  const missingReferences = JSON.parse(missingReferencesRaw);
  const unreferenced = JSON.parse(unreferencedRaw);
  const machineReport = JSON.parse(machineReportRaw);
  invariant(machineReport.animationId === ANIMATION_ID, "machine report animationId changed");
  invariant(
    machineReport.findings?.exportedScriptFileCount === EXPECTED.childScriptCount,
    "machine report child script count changed",
  );
  invariant(machineReport.source?.hashMatches === true, "machine report source hash is not verified");
  invariant(
    machineReport.source.observedSha256After === SOURCES.target.sha256,
    "machine report source hash no longer binds the target",
  );

  const childScripts = machineEvidenceBinding(
    CHILD_SCRIPTS_RELATIVE,
    childScriptsRaw,
    EXPECTED.childScriptsSha256,
    EXPECTED.childScriptsUncompressedSha256,
  );
  const childStructure = machineEvidenceBinding(
    CHILD_STRUCTURE_RELATIVE,
    childStructureRaw,
    EXPECTED.childStructureSha256,
    EXPECTED.childStructureUncompressedSha256,
  );
  const childScriptRecords = parseMachineScriptBundle(gunzipSync(childScriptsRaw));
  const structureXml = gunzipSync(childStructureRaw).toString("utf8");
  const rootDynamicFields = parseRootDynamicFields(structureXml);
  const sprite621 = parseSprite621Structure(structureXml);
  invariant(
    sprite621.frameLabels[0] === "FirstSection" &&
      sprite621.frameLabels.slice(1).every((label, index) => label === `R${index + 1}`),
    "sprite-621 frame labels no longer equal FirstSection,R1..R25",
  );

  const activeCourse = parseActiveCourseXml(
    await readFile(path.join(root, SOURCES.courseXml.projectPath)),
  );
  invariant(
    stableJson(activeCourse.activeFqPages) ===
      stableJson(["FQ/L8FQ01.swf", "FQ/L8FQ02.swf", "FQ/L8FQ03.swf"]),
    "active FQ page sequence changed",
  );
  const missingActiveFqSources = findCatalogMissingRecords(missingReferences);
  const historicalUnreferenced = findHistoricalUnreferencedRecord(unreferenced);

  const [hostExport, historicalExport] = await Promise.all([
    exportScripts({root, ffdec, source: SOURCES.sameLessonHost}),
    exportScripts({root, ffdec, source: SOURCES.historicalFqReview}),
  ]);

  const report = deriveRe001HostPayloadBoundary({
    activeCourse,
    missingActiveFqSources,
    historicalUnreferenced,
    hostExport,
    historicalExport,
    childScriptRecords,
    rootDynamicFields,
    sprite621,
    generatedBy: {
      path: "scripts/build-re001-host-payload-boundary.mjs",
      sha256: sha256(scriptRaw),
      ffdec: {
        version: ffdec.version,
        jarSha256: ffdec.jarSha256,
      },
    },
    sources,
    sourceCatalog: {
      path: SOURCE_CATALOG_RELATIVE,
      sha256: sha256(sourceCatalogRaw),
      checksumSetSha256: sourceCatalog.checksumSetSha256,
    },
    machineEvidence: {
      report: {
        path: MACHINE_REPORT_RELATIVE,
        sha256: sha256(machineReportRaw),
        sourceHashMatches: machineReport.source.hashMatches,
        exportedScriptFileCount: machineReport.findings.exportedScriptFileCount,
      },
      childScripts,
      childStructure,
      missingReferences: {
        path: MISSING_REFERENCES_RELATIVE,
        sha256: sha256(missingReferencesRaw),
      },
      unreferenced: {
        path: UNREFERENCED_RELATIVE,
        sha256: sha256(unreferencedRaw),
      },
    },
  });

  const desired = Buffer.from(stableJson(report), "utf8");
  const output = path.join(root, OUTPUT_RELATIVE);
  if (check) {
    invariant(await exists(output), `${OUTPUT_RELATIVE} is missing`);
    const observed = await readFile(output);
    invariant(
      observed.equals(desired),
      `${OUTPUT_RELATIVE} is stale; expected ${sha256(desired)}, observed ${sha256(observed)}`,
    );
  } else {
    const resolvedOutput = path.resolve(output);
    invariant(
      isInside(resolvedOutput, path.resolve(root)),
      "output must stay inside project root",
    );
    await mkdir(path.dirname(resolvedOutput), {recursive: true});
    await writeFile(resolvedOutput, desired);
  }
  return {path: OUTPUT_RELATIVE, sha256: sha256(desired), report};
}

function helpText() {
  return `Usage: node scripts/build-re001-host-payload-boundary.mjs [options]

Options:
  --check              Re-extract and verify the checked-in report without writing
  --ffdec <command>    FFDec 26.2.1 launcher (default: ffdec)
  --root <directory>   Project root (default: repository root)
  -h, --help           Show this help
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const result = await buildRe001HostPayloadBoundary(options);
  process.stdout.write(
    `${options.check ? "Verified" : "Generated"} ${result.path} sha256:${result.sha256}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
