#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {checkCompletionLedger} from "./build-completion-ledger.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const DEFAULT_RELEASES_PATH = path.join(projectRoot, "catalog", "lesson-releases.json");
const DEFAULT_COMPLETION_LEDGER_PATH = path.join(projectRoot, "catalog", "completion-ledger.json");
const DEFAULT_MIGRATIONS_ROOT = path.join(projectRoot, "migrations");
const DEFAULT_OUTPUT_PATH = path.join(projectRoot, "catalog", "lesson-release-ledger.json");
const LEDGER_SCHEMA_VERSION = 1;
const GENERATOR_VERSION = "1.1.0";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GENERATED_MARKER_PATTERN = /^sha256:[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function record(value, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

function nonempty(value, label) {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
  return value;
}

function exactKeys(value, keys, label) {
  record(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  invariant(
    actual.length === expected.length && actual.every((key, index) => key === expected[index]),
    `${label} fields must be exactly: ${expected.join(", ")}`,
  );
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function projectRelative(filePath) {
  const relative = path.relative(projectRoot, filePath);
  return relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
    ? relative.split(path.sep).join("/")
    : filePath.split(path.sep).join("/");
}

async function readBoundJson(filePath, label, read = readFile) {
  const raw = await read(filePath);
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {bytes, value};
}

function validateShard(shard, release, index) {
  const label = `${release.releaseId}.shards[${index}]`;
  exactKeys(shard, [
    "shardId",
    "batchId",
    "ordinal",
    "parallelGroup",
    "memberCount",
    "developmentPrerequisites",
  ], label);
  nonempty(shard.shardId, `${label}.shardId`);
  nonempty(shard.batchId, `${label}.batchId`);
  invariant(shard.ordinal === index + 1, `${label}.ordinal must preserve one-indexed shard order`);
  nonempty(shard.parallelGroup, `${label}.parallelGroup`);
  invariant(Number.isSafeInteger(shard.memberCount) && shard.memberCount > 0, `${label}.memberCount is invalid`);
  invariant(
    Array.isArray(shard.developmentPrerequisites) && shard.developmentPrerequisites.length === 0,
    `${label}.developmentPrerequisites must be empty for parallel development`,
  );
}

function validateMember(member, release, index, shardsById) {
  const label = `${release.releaseId}.members[${index}]`;
  exactKeys(member, [
    "ordinal",
    "animationId",
    "assetId",
    "releaseRole",
    "batchId",
    "shardId",
    "source",
    "xmlOccurrence",
  ], label);
  invariant(member.ordinal === index + 1, `${label}.ordinal must preserve exact one-indexed lesson order`);
  nonempty(member.animationId, `${label}.animationId`);
  invariant(/^swf-[a-f0-9]{64}$/.test(member.assetId || ""), `${label}.assetId is malformed`);
  invariant(
    member.releaseRole === "active-xml-referenced-page" || member.releaseRole === "course-shell",
    `${label}.releaseRole is invalid`,
  );
  nonempty(member.batchId, `${label}.batchId`);
  nonempty(member.shardId, `${label}.shardId`);
  exactKeys(member.source, ["path", "sha256"], `${label}.source`);
  nonempty(member.source.path, `${label}.source.path`);
  invariant(member.source.path.toLowerCase().endsWith(".swf"), `${label}.source.path must identify a SWF`);
  invariant(SHA256_PATTERN.test(member.source.sha256 || ""), `${label}.source.sha256 is malformed`);
  invariant(member.assetId === `swf-${member.source.sha256}`, `${label}.assetId does not match source.sha256`);

  const shard = shardsById.get(member.shardId);
  invariant(shard, `${label}.shardId does not identify a declared shard`);
  invariant(member.batchId === shard.batchId, `${label}.batchId does not match its shard`);

  if (member.ordinal <= release.expectedCounts.activeXmlReferencedPages) {
    invariant(member.releaseRole === "active-xml-referenced-page", `${label} must be an active XML page`);
    invariant(member.xmlOccurrence === member.ordinal, `${label}.xmlOccurrence must equal its active XML ordinal`);
  } else {
    invariant(member.ordinal <= release.expectedCounts.members, `${label} exceeds the declared release member count`);
    invariant(member.releaseRole === "course-shell", `${label} must be the course shell`);
    invariant(member.xmlOccurrence === null, `${label}.xmlOccurrence must be null for the course shell`);
  }
}

function validateRelease(release, index) {
  const label = `lesson releases[${index}]`;
  exactKeys(release, [
    "releaseId",
    "releaseOrder",
    "releaseType",
    "publicationMode",
    "developmentMode",
    "queueId",
    "grade",
    "lesson",
    "titleDisplay",
    "domain",
    "sourceLesson",
    "expectedCounts",
    "scope",
    "shards",
    "members",
  ], label);
  nonempty(release.releaseId, `${label}.releaseId`);
  invariant(Number.isSafeInteger(release.releaseOrder) && release.releaseOrder > 0, `${label}.releaseOrder is invalid`);
  invariant(release.releaseType === "complete-lesson", `${label}.releaseType must be complete-lesson`);
  invariant(release.publicationMode === "atomic", `${label}.publicationMode must be atomic`);
  invariant(release.developmentMode === "parallel-shards", `${label}.developmentMode must be parallel-shards`);
  nonempty(release.queueId, `${label}.queueId`);
  invariant(Number.isSafeInteger(release.grade) && release.grade > 0, `${label}.grade is invalid`);
  invariant(Number.isSafeInteger(release.lesson) && release.lesson > 0, `${label}.lesson is invalid`);
  nonempty(release.titleDisplay, `${label}.titleDisplay`);
  nonempty(release.domain, `${label}.domain`);

  exactKeys(release.sourceLesson, ["path", "bytes", "sha256", "sequenceAuthority"], `${label}.sourceLesson`);
  nonempty(release.sourceLesson.path, `${label}.sourceLesson.path`);
  invariant(
    Number.isSafeInteger(release.sourceLesson.bytes) && release.sourceLesson.bytes > 0,
    `${label}.sourceLesson.bytes is invalid`,
  );
  invariant(SHA256_PATTERN.test(release.sourceLesson.sha256 || ""), `${label}.sourceLesson.sha256 is malformed`);
  invariant(
    release.sourceLesson.sequenceAuthority === "active-course-xml-global-page-order",
    `${label}.sourceLesson.sequenceAuthority is invalid`,
  );

  exactKeys(
    release.expectedCounts,
    ["activeXmlReferencedPages", "courseShells", "members", "shards"],
    `${label}.expectedCounts`,
  );
  invariant(
    Number.isSafeInteger(release.expectedCounts.activeXmlReferencedPages) &&
      release.expectedCounts.activeXmlReferencedPages > 0,
    `${label}.expectedCounts.activeXmlReferencedPages is invalid`,
  );
  invariant(
    Number.isSafeInteger(release.expectedCounts.courseShells) && release.expectedCounts.courseShells > 0,
    `${label}.expectedCounts.courseShells is invalid`,
  );
  invariant(
    Number.isSafeInteger(release.expectedCounts.members) &&
      release.expectedCounts.members ===
        release.expectedCounts.activeXmlReferencedPages + release.expectedCounts.courseShells,
    `${label}.expectedCounts.members must equal active pages plus course shells`,
  );
  invariant(
    Number.isSafeInteger(release.expectedCounts.shards) && release.expectedCounts.shards > 0,
    `${label}.expectedCounts.shards is invalid`,
  );

  exactKeys(release.scope, ["collection", "grade", "lesson", "excludeNonMembers"], `${label}.scope`);
  invariant(
    release.scope.collection === "course" &&
      release.scope.grade === release.grade &&
      release.scope.lesson === release.lesson &&
      release.scope.excludeNonMembers === true,
    `${label}.scope does not match the release identity`,
  );

  invariant(
    Array.isArray(release.shards) && release.shards.length === release.expectedCounts.shards,
    `${label}.shards must match expectedCounts.shards`,
  );
  release.shards.forEach((shard, shardIndex) => validateShard(shard, release, shardIndex));
  const shardIds = release.shards.map(({shardId}) => shardId);
  const batchIds = release.shards.map(({batchId}) => batchId);
  invariant(new Set(shardIds).size === shardIds.length, `${label}.shards contain duplicate shardId values`);
  invariant(new Set(batchIds).size === batchIds.length, `${label}.shards contain duplicate batchId values`);
  invariant(
    new Set(release.shards.map(({parallelGroup}) => parallelGroup)).size === 1,
    `${label}.shards must share one parallelGroup`,
  );
  invariant(
    release.shards.reduce((total, shard) => total + shard.memberCount, 0) === release.expectedCounts.members,
    `${label}.shard memberCount total must match expectedCounts.members`,
  );

  invariant(
    Array.isArray(release.members) && release.members.length === release.expectedCounts.members,
    `${label}.members must match expectedCounts.members`,
  );
  const shardsById = new Map(release.shards.map((shard) => [shard.shardId, shard]));
  release.members.forEach((member, memberIndex) => validateMember(member, release, memberIndex, shardsById));
  const animationIds = release.members.map(({animationId}) => animationId);
  const assetIds = release.members.map(({assetId}) => assetId);
  invariant(new Set(animationIds).size === release.expectedCounts.members, `${label}.members contain duplicate animationId values`);
  invariant(new Set(assetIds).size === release.expectedCounts.members, `${label}.members contain duplicate assetId values`);
  for (const shard of release.shards) {
    const observed = release.members.filter(({shardId}) => shardId === shard.shardId).length;
    invariant(observed === shard.memberCount, `${label}.${shard.shardId} memberCount does not match members`);
  }
}

export function validateLessonReleases(document) {
  exactKeys(document, ["schemaVersion", "releases"], "lesson release manifest");
  invariant(document.schemaVersion === 1, "lesson release manifest schemaVersion must be 1");
  invariant(Array.isArray(document.releases) && document.releases.length > 0, "lesson release manifest releases must be non-empty");
  document.releases.forEach(validateRelease);
  const releaseIds = document.releases.map(({releaseId}) => releaseId);
  const releaseOrders = document.releases.map(({releaseOrder}) => releaseOrder);
  invariant(new Set(releaseIds).size === releaseIds.length, "lesson release manifest contains duplicate releaseId values");
  invariant(new Set(releaseOrders).size === releaseOrders.length, "lesson release manifest contains duplicate releaseOrder values");
  invariant(
    releaseOrders.every((order, index) => index === 0 || releaseOrders[index - 1] < order),
    "lesson releases must be sorted by releaseOrder",
  );
  return document;
}

export function inspectStrictCompletionLedger(ledger) {
  record(ledger, "completion ledger");
  invariant(ledger.schemaVersion === 1, "completion ledger schemaVersion must be 1");
  invariant(GENERATED_MARKER_PATTERN.test(ledger.generatedMarker || ""), "completion ledger generatedMarker is malformed");
  invariant(Array.isArray(ledger.entries), "completion ledger entries must be an array");
  invariant(Array.isArray(ledger.diagnostics), "completion ledger diagnostics must be an array");
  invariant(
    record(ledger.summary, "completion ledger summary").strictComplete === ledger.entries.length,
    "completion ledger strictComplete summary does not match entries",
  );
  const entriesByAnimationId = new Map();
  for (const [index, entry] of ledger.entries.entries()) {
    const label = `completion ledger entries[${index}]`;
    record(entry, label);
    nonempty(entry.animationId, `${label}.animationId`);
    invariant(/^swf-[a-f0-9]{64}$/.test(entry.assetId || ""), `${label}.assetId is malformed`);
    invariant(!entriesByAnimationId.has(entry.animationId), `completion ledger contains duplicate ${entry.animationId}`);
    invariant(entry.validation?.mode === "strict", `${label} is not a strict validation result`);
    invariant(
      entry.validation?.generatedMarker === ledger.generatedMarker,
      `${label} is not bound to the completion ledger generatedMarker`,
    );
    entriesByAnimationId.set(entry.animationId, entry);
  }
  return {ledger, entriesByAnimationId};
}

export function evaluateRelease(release, entriesByAnimationId) {
  const members = release.members.map((member) => {
    const entry = entriesByAnimationId.get(member.animationId);
    const status = !entry
      ? "missing"
      : entry.assetId !== member.assetId
        ? "asset-mismatch"
        : "strict-complete";
    return {
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      strictComplete: status === "strict-complete",
      status,
      ledgerAssetId: entry?.assetId ?? null,
      workspace: entry?.workspace ?? null,
      manifestSha256: entry?.manifestSha256 ?? null,
    };
  });
  const strictCompleteCount = members.filter(({strictComplete}) => strictComplete).length;
  const missingCount = members.filter(({status}) => status === "missing").length;
  const assetMismatchCount = members.filter(({status}) => status === "asset-mismatch").length;
  const published =
    release.publicationMode === "atomic" &&
    strictCompleteCount === release.expectedCounts.members &&
    missingCount === 0 &&
    assetMismatchCount === 0;
  return {
    releaseId: release.releaseId,
    releaseOrder: release.releaseOrder,
    releaseType: release.releaseType,
    publicationMode: release.publicationMode,
    developmentMode: release.developmentMode,
    queueId: release.queueId,
    grade: release.grade,
    lesson: release.lesson,
    titleDisplay: release.titleDisplay,
    domain: release.domain,
    expectedMemberCount: release.expectedCounts.members,
    strictCompleteCount,
    missingCount,
    assetMismatchCount,
    published,
    status: published ? "published" : "unpublished",
    gate: {
      kind: "atomic-all-members-strict",
      requiredCount: release.expectedCounts.members,
      admittedCount: strictCompleteCount,
      open: published,
      reason: published
        ? `all ${release.expectedCounts.members} release members are exact-asset strict completion entries`
        : `${release.expectedCounts.members - strictCompleteCount} of ${release.expectedCounts.members} release members are not exact-asset strict completion entries`,
    },
    members,
  };
}

export async function generateLessonReleaseLedger({
  releasesPath = DEFAULT_RELEASES_PATH,
  completionLedgerPath = DEFAULT_COMPLETION_LEDGER_PATH,
  migrationsRoot = DEFAULT_MIGRATIONS_ROOT,
  completionLedgerCheck = checkCompletionLedger,
  read = readFile,
} = {}) {
  const resolvedReleasesPath = path.resolve(releasesPath);
  const resolvedCompletionLedgerPath = path.resolve(completionLedgerPath);
  const resolvedMigrationsRoot = path.resolve(migrationsRoot);
  const [releaseSource, completionSource, generatorBytes, completionCheck] = await Promise.all([
    readBoundJson(resolvedReleasesPath, "lesson release manifest", read),
    readBoundJson(resolvedCompletionLedgerPath, "completion ledger", read),
    read(scriptPath),
    completionLedgerCheck({
      migrationsRoot: resolvedMigrationsRoot,
      output: resolvedCompletionLedgerPath,
    }),
  ]);
  validateLessonReleases(releaseSource.value);
  invariant(completionCheck?.ok === true, `completion ledger is ${completionCheck?.reason || "not current"}`);
  if (typeof completionCheck.actual === "string") {
    invariant(
      completionCheck.actual === completionSource.bytes.toString("utf8"),
      "completion ledger checker did not validate the exact supplied bytes",
    );
  }
  if (completionCheck.ledger) {
    invariant(
      completionCheck.ledger.generatedMarker === completionSource.value.generatedMarker,
      "completion ledger checker marker does not match the supplied ledger",
    );
  }
  const {entriesByAnimationId} = inspectStrictCompletionLedger(completionSource.value);
  const releases = releaseSource.value.releases.map((release) => evaluateRelease(release, entriesByAnimationId));
  const base = {
    generator: {
      path: projectRelative(scriptPath),
      version: GENERATOR_VERSION,
      bytes: Buffer.byteLength(generatorBytes),
      sha256: sha256(generatorBytes),
    },
    sources: {
      lessonReleases: {
        path: projectRelative(resolvedReleasesPath),
        bytes: releaseSource.bytes.length,
        sha256: sha256(releaseSource.bytes),
      },
      completionLedger: {
        path: projectRelative(resolvedCompletionLedgerPath),
        bytes: completionSource.bytes.length,
        sha256: sha256(completionSource.bytes),
        generatedMarker: completionSource.value.generatedMarker,
      },
      migrationsRoot: projectRelative(resolvedMigrationsRoot),
    },
    summary: {
      releaseCount: releases.length,
      publishedReleaseCount: releases.filter(({published}) => published).length,
      unpublishedReleaseCount: releases.filter(({published}) => !published).length,
      memberCount: releases.reduce((total, release) => total + release.expectedMemberCount, 0),
      strictCompleteMemberCount: releases.reduce((total, release) => total + release.strictCompleteCount, 0),
    },
    releases,
  };
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    generatedMarker: `sha256:${sha256(stableJson({schemaVersion: LEDGER_SCHEMA_VERSION, ...base}))}`,
    ...base,
  };
}

export async function writeLessonReleaseLedger({
  output = DEFAULT_OUTPUT_PATH,
  ...options
} = {}) {
  const outputPath = path.resolve(output);
  const ledger = await generateLessonReleaseLedger(options);
  const serialized = stableJson(ledger);
  await mkdir(path.dirname(outputPath), {recursive: true});
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, serialized, {flag: "wx"});
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, {force: true});
  }
  return {ledger, outputPath, serialized};
}

export async function checkLessonReleaseLedger({
  output = DEFAULT_OUTPUT_PATH,
  read = readFile,
  ...options
} = {}) {
  const outputPath = path.resolve(output);
  const ledger = await generateLessonReleaseLedger({...options, read});
  const expected = stableJson(ledger);
  let actual = null;
  try {
    const raw = await read(outputPath);
    actual = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {
    ok: actual === expected,
    reason: actual === null ? "missing" : actual === expected ? "current" : "stale",
    outputPath,
    ledger,
    expected,
    actual,
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    json: false,
    releasesPath: DEFAULT_RELEASES_PATH,
    completionLedgerPath: DEFAULT_COMPLETION_LEDGER_PATH,
    migrationsRoot: DEFAULT_MIGRATIONS_ROOT,
    output: DEFAULT_OUTPUT_PATH,
    help: false,
  };
  const valued = new Map([
    ["--releases", "releasesPath"],
    ["--completion-ledger", "completionLedgerPath"],
    ["--migrations", "migrationsRoot"],
    ["--output", "output"],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (valued.has(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      options[valued.get(argument)] = path.resolve(value);
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-lesson-release-ledger.mjs [--check] [--json]
    [--releases <file>] [--completion-ledger <file>]
    [--migrations <directory>] [--output <file>]

Builds a hash-bound aggregate lesson release ledger. Atomic releases remain
unpublished until every declared member is an exact-asset entry in the current
strict completion ledger.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    if (options.check) {
      const result = await checkLessonReleaseLedger(options);
      if (options.json) {
        process.stdout.write(`${JSON.stringify({
          ok: result.ok,
          reason: result.reason,
          generatedMarker: result.ledger.generatedMarker,
          summary: result.ledger.summary,
        }, null, 2)}\n`);
      } else {
        process.stdout.write(
          `${result.ok ? "PASS" : "FAIL"}: lesson release ledger is ${result.reason} at ${result.outputPath}\n`,
        );
      }
      if (!result.ok) process.exitCode = 1;
      return;
    }
    const result = await writeLessonReleaseLedger(options);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({
        output: result.outputPath,
        generatedMarker: result.ledger.generatedMarker,
        summary: result.ledger.summary,
      }, null, 2)}\n`);
    } else {
      process.stdout.write(
        `Wrote ${result.outputPath}: ${result.ledger.summary.publishedReleaseCount}/${result.ledger.summary.releaseCount} lesson releases published\n`,
      );
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
