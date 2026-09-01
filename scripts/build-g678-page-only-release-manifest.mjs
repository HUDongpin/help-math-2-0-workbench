#!/usr/bin/env node

/**
 * Build the G6-G8 shared page-only release source of truth.
 *
 * This is an atomic membership plan, not a publication ledger.  It binds the
 * source XML occurrence/member set so a later registry/descriptor/release
 * implementation cannot silently invent a page or reintroduce a Flash shell.
 * Every member remains unregistered and every downstream acceptance effect is
 * explicitly false until the independent gates are completed.
 */

import {createHash} from "node:crypto";
import {access, mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const DEFAULT_CATALOG = "catalog/g678-shared-catalog.v1.json";
export const DEFAULT_MAPPING = "catalog/g678-grade-mapping.v1.json";
export const DEFAULT_OUTPUT = "catalog/g678-page-only-release-manifest.v1.json";
export const SHARD_SIZE = 25;
const SHA256 = /^[a-f0-9]{64}$/u;
const MODULE_ORDER = Object.freeze(["NMS002", "GEO001", "ALG001", "DAT001"]);
const LESSON_COUNTS = Object.freeze({NMS002: 12, GEO001: 12, ALG001: 12, DAT001: 8});
const ALL_FALSE = Object.freeze({
  canonicalSourcePromoted: false,
  currentJavaScriptRegistered: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function fail(message) {
  const error = new Error(message);
  error.name = "G678ReleaseManifestError";
  throw error;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function string(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectPath(value, label) {
  if (!value) fail(`${label} is required`);
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(PROJECT_ROOT, value);
}

function portable(value) {
  const relative = path.relative(PROJECT_ROOT, value);
  if (relative === ".." || relative.startsWith(`..${path.sep}`)) return `$EXTERNAL/${path.basename(value)}`;
  return relative.split(path.sep).join("/");
}

async function readJson(value, label) {
  const filePath = projectPath(value, label);
  let bytes;
  try {
    bytes = await readFile(filePath);
  } catch (error) {
    fail(`${label} cannot be read: ${error.message}`);
  }
  try {
    return {filePath, bytes, value: JSON.parse(bytes.toString("utf8")), sha256: sha256(bytes)};
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function lessonKey(lesson) {
  return String(lesson.stableLessonKey ?? `shared-${String(lesson.moduleCode).toLowerCase()}-l${String(lesson.lessonNumber).padStart(2, "0")}`);
}

function releaseId(lesson) {
  return `g678-${String(lesson.moduleCode).toLowerCase()}-l${String(lesson.lessonNumber).padStart(2, "0")}-page-only-v1`;
}

function expectedLessonCount(moduleCode) {
  return LESSON_COUNTS[moduleCode] ?? 0;
}

function expectedPagePlacementId(moduleCode, lessonNumber, ordinal) {
  return `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}-p${String(ordinal).padStart(3, "0")}`;
}

function buildShards(members) {
  const shards = [];
  for (let start = 0; start < members.length; start += SHARD_SIZE) {
    const chunk = members.slice(start, start + SHARD_SIZE);
    const ordinal = shards.length + 1;
    shards.push({
      shardId: `shard-${String(ordinal).padStart(2, "0")}`,
      batchId: `batch-${String(ordinal).padStart(3, "0")}`,
      ordinal,
      parallelGroup: "g678-shared-page-only",
      memberCount: chunk.length,
      memberOrdinals: chunk.map((member) => member.ordinal),
      developmentPrerequisites: ["source-audit-complete", "grade-mapping-approved", "lane-calibration-approved"],
    });
  }
  return shards;
}

function buildRelease(lesson) {
  const pages = array(lesson.pages);
  const members = pages.map((page, index) => {
    const ordinal = index + 1;
    const sourceSha256 = string(page.sourceSha256)?.toLowerCase() ?? null;
    return {
      ordinal,
      animationId: page.animationId,
      assetId: sourceSha256 && SHA256.test(sourceSha256) ? `swf-${sourceSha256}` : null,
      releaseRole: "active-xml-referenced-page",
      source: {
        path: page.sourcePath,
        sha256: sourceSha256,
      },
      sourceRootKind: page.sourceRootKind ?? "canonical-newhelp",
      variantDecision: page.variantDecision ?? "pending-source-audit",
      sectionCode: page.sectionCode,
      xmlOccurrence: page.xmlOccurrence,
      placementId: page.placementId,
      titleEnglish: page.titleEnglish ?? page.titleRaw ?? null,
      audioCandidateCount: array(page.audioCueCandidates).length,
      audioStatus: page.audioStatus ?? "candidate-index-only",
      registrationStatus: "unregistered-source-bound",
    };
  });
  const sourceXml = object(lesson.sourceXml);
  const mappingStatus = lesson.mappingStatus ?? "source-mapping-pending";
  return {
    releaseOrder: null,
    releaseId: releaseId(lesson),
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    queueId: `queue-${releaseId(lesson)}`,
    status: "source-audit-only",
    stableLessonKey: lessonKey(lesson),
    moduleCode: lesson.moduleCode,
    moduleLesson: lesson.lessonNumber,
    titleDisplay: lesson.titleEnglish ?? lesson.title ?? lesson.lessonName ?? lessonKey(lesson),
    gradeScope: "G6-G8-shared",
    mappingStatus,
    primaryGrade: lesson.primaryGrade ?? null,
    gradeTags: array(lesson.gradeTags),
    sourceLesson: {
      path: sourceXml.path ?? lesson.sourceXmlPath ?? null,
      bytes: sourceXml.bytes ?? null,
      sha256: sourceXml.sha256 ?? lesson.sourceXmlSha256 ?? null,
      sequenceAuthority: "course-xml-occurrence",
    },
    expectedCounts: {
      activeXmlReferencedPages: pages.length,
      uniquePageAnimations: new Set(members.map((member) => member.animationId)).size,
      uniqueAssetSha256: new Set(members.map((member) => member.assetId).filter(Boolean)).size,
      courseShells: 0,
      members: members.length,
      shards: Math.ceil(members.length / SHARD_SIZE),
    },
    scope: {
      collection: "g678-shared",
      grade: lesson.primaryGrade ?? null,
      gradeTags: array(lesson.gradeTags),
      moduleCode: lesson.moduleCode,
      lesson: lesson.lessonNumber,
      courseKey: lesson.courseKey ?? null,
      gradeScope: "G6-G8-shared",
      excludeNonMembers: true,
      pageOnly: true,
      legacyFlashCourseShellExcluded: true,
      modernMyLessonHostRetained: true,
    },
    shards: buildShards(members),
    members,
    acceptanceEffects: {...ALL_FALSE},
  };
}

export function buildReleaseManifest({catalog, mapping, catalogIdentity, mappingIdentity}) {
  if (catalog?.catalogKind !== "help-math-g678-shared-source-catalog") fail("catalog kind mismatch");
  const lessons = array(catalog.lessons);
  if (lessons.length !== 44) fail(`expected 44 catalog lessons, found ${lessons.length}`);
  const mappingRecords = new Map(array(mapping?.records).map((record) => [record.stableLessonKey, record]));
  const missingMappings = lessons
    .map((lesson) => lessonKey(lesson))
    .filter((key) => !mappingRecords.has(key));
  if (missingMappings.length) fail(`mapping is missing ${missingMappings.length} lesson record(s): ${missingMappings.join(", ")}`);
  const releases = lessons.map((lesson) => {
    const mappingRecord = mappingRecords.get(lessonKey(lesson));
    const mappingStatus = mappingRecord?.status === "approved"
      ? "approved"
      : mappingRecord?.status ?? lesson.mappingStatus;
    const primaryGrade = mappingRecord?.status === "approved"
      ? mappingRecord.primaryGrade ?? null
      : null;
    return buildRelease({
      ...lesson,
      mappingStatus,
      primaryGrade,
      gradeTags: mappingRecord?.status === "approved"
        ? array(mappingRecord.gradeTags)
        : [],
      courseKey: mappingRecord?.status === "approved"
        ? mappingRecord.courseKey ?? null
        : null,
    });
  });
  releases.sort((left, right) =>
    MODULE_ORDER.indexOf(left.moduleCode) - MODULE_ORDER.indexOf(right.moduleCode) ||
    left.moduleLesson - right.moduleLesson,
  );
  releases.forEach((release, index) => {
    release.releaseOrder = index + 1;
  });
  const activePageCount = releases.reduce((sum, release) => sum + release.expectedCounts.members, 0);
  if (activePageCount !== 2282) fail(`expected 2282 active members, found ${activePageCount}`);
  return {
    $schema: "../schemas/g678-page-only-release-manifest-v1.schema.json",
    schemaVersion: 1,
    artifactType: "help-math-g678-page-only-release-manifest",
    manifestId: "g678-page-only-release-manifest-v1",
    generatedAt: null,
    authority: "source-bound-engineering-plan-not-release-authority",
    sourceOfTruth: {
      catalogPath: portable(catalogIdentity.filePath),
      catalogSha256: catalogIdentity.sha256,
      mappingPath: portable(mappingIdentity.filePath),
      mappingSha256: mappingIdentity.sha256,
      scope: "canonical-active-page-only",
      legacyCourseShellExcluded: true,
      legacyDocumentsRetained: [
        "catalog/lesson-releases.json",
        "catalog/page-only-current-js-product-releases.json",
      ],
      crosswalkStatus: "g678-independent-unified-source-of-truth",
    },
    expectedCounts: {
      releases: 44,
      activeXmlReferencedPages: 2282,
      courseShells: 0,
      maxShardMembers: SHARD_SIZE,
    },
    releases,
    acceptanceEffects: {...ALL_FALSE},
  };
}

export function validateReleaseManifest(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (manifest?.artifactType !== "help-math-g678-page-only-release-manifest") errors.push("artifactType mismatch");
  const releases = array(manifest?.releases);
  if (releases.length !== 44) errors.push(`expected 44 releases, found ${releases.length}`);
  const sourceOfTruth = object(manifest?.sourceOfTruth);
  if (sourceOfTruth.scope !== "canonical-active-page-only") errors.push("sourceOfTruth scope must be canonical-active-page-only");
  if (sourceOfTruth.legacyCourseShellExcluded !== true) errors.push("sourceOfTruth must exclude legacy course shells");
  if (!SHA256.test(String(sourceOfTruth.catalogSha256 ?? "")) || !SHA256.test(String(sourceOfTruth.mappingSha256 ?? ""))) {
    errors.push("sourceOfTruth catalog/mapping hashes must be lowercase SHA-256");
  }
  const keys = new Set();
  let pages = 0;
  for (const release of releases) {
    const moduleCode = String(release?.moduleCode ?? "").toUpperCase();
    const lessonNumber = Number(release?.moduleLesson);
    const key = `${moduleCode}:${release?.moduleLesson}`;
    const expectedReleaseId = `g678-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}-page-only-v1`;
    if (keys.has(key)) errors.push(`duplicate release key ${key}`);
    keys.add(key);
    if (!Object.hasOwn(LESSON_COUNTS, moduleCode)) errors.push(`${key}: unsupported module code`);
    if (!Number.isSafeInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > expectedLessonCount(moduleCode)) {
      errors.push(`${key}: lesson number is outside the canonical module range`);
    }
    if (release?.releaseId !== expectedReleaseId) errors.push(`${key}: releaseId is not canonical`);
    if (release?.releaseOrder !== keys.size) errors.push(`${key}: releaseOrder is not contiguous`);
    const expectedStableLessonKey = `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, "0")}`;
    if (release?.stableLessonKey !== expectedStableLessonKey) errors.push(`${key}: stableLessonKey is not canonical`);
    if (release?.publicationMode !== "atomic") errors.push(`${key}: publicationMode must be atomic`);
    if (release?.status !== "source-audit-only") errors.push(`${key}: status must remain source-audit-only`);
    if (release?.expectedCounts?.courseShells !== 0) errors.push(`${key}: courseShells must be zero`);
    if (release?.scope?.collection !== "g678-shared" ||
      release?.scope?.moduleCode !== moduleCode ||
      release?.scope?.lesson !== lessonNumber ||
      release?.scope?.pageOnly !== true ||
      release?.scope?.legacyFlashCourseShellExcluded !== true ||
      release?.scope?.modernMyLessonHostRetained !== true) {
      errors.push(`${key}: page-only/module-aware scope boundary missing`);
    }
    const members = array(release?.members);
    if (release?.expectedCounts?.members !== members.length) errors.push(`${key}: member count mismatch`);
    if (release?.expectedCounts?.activeXmlReferencedPages !== members.length) errors.push(`${key}: active page count/member count mismatch`);
    const sourceLesson = object(release?.sourceLesson);
    const expectedXmlPath = `G6-G8-shared/${moduleCode}/L${lessonNumber}/index.xml`;
    if (sourceLesson.path !== expectedXmlPath) errors.push(`${key}: source XML path is not canonical/source-ordered`);
    if (!Number.isSafeInteger(sourceLesson.bytes) || sourceLesson.bytes <= 0) errors.push(`${key}: source XML byte count is missing`);
    if (!SHA256.test(String(sourceLesson.sha256 ?? ""))) errors.push(`${key}: source XML SHA-256 is missing or invalid`);
    if (release?.mappingStatus === "approved") {
      if (![6, 7, 8].includes(Number(release.primaryGrade))) errors.push(`${key}: approved mapping requires a primary grade`);
    } else if (release?.primaryGrade !== null) {
      errors.push(`${key}: non-approved mapping must keep primaryGrade null`);
    }
    pages += members.length;
    const ids = new Set();
    const sourcePaths = new Set();
    for (const [index, member] of members.entries()) {
      if (member?.ordinal !== index + 1) errors.push(`${key}: member ordinal gap at ${index + 1}`);
      if (member?.xmlOccurrence !== index + 1) errors.push(`${key}: XML occurrence gap at ${index + 1}`);
      const expectedPlacement = expectedPagePlacementId(moduleCode, lessonNumber, index + 1);
      if (member?.placementId !== expectedPlacement || member?.animationId !== expectedPlacement) {
        errors.push(`${key}: placement/animation identity drift at ordinal ${index + 1}`);
      }
      if (ids.has(member?.placementId)) errors.push(`${key}: duplicate placement ${member?.placementId}`);
      ids.add(member?.placementId);
      if (member?.registrationStatus !== "unregistered-source-bound") errors.push(`${key}: member was implicitly registered`);
      const source = object(member?.source);
      if (typeof source.path !== "string" ||
        !source.path.startsWith(`HELP_COURSES/${moduleCode}/L${lessonNumber}/`) ||
        !source.path.endsWith(".swf") ||
        source.path.includes("..") ||
        source.path.includes("\\")) errors.push(`${key}: member source path is not canonical`);
      if (sourcePaths.has(source.path)) errors.push(`${key}: duplicate member source path ${source.path}`);
      sourcePaths.add(source.path);
      if (!SHA256.test(String(source.sha256 ?? ""))) errors.push(`${key}: member source SHA-256 is missing or invalid`);
      if (member?.assetId !== `swf-${source.sha256}`) errors.push(`${key}: asset identity does not match member source SHA-256`);
      if (member?.sourceRootKind !== 'canonical') errors.push(`${key}: source root kind is not canonical`);
      if (!['canonical', 'hold-source-choice-review'].includes(String(member?.variantDecision))) errors.push(`${key}: variant decision is not explicit`);
      if (typeof member?.sectionCode !== "string" || member.sectionCode.length === 0) errors.push(`${key}: section code is missing`);
      if (!Number.isSafeInteger(member?.audioCandidateCount) || member.audioCandidateCount < 0) errors.push(`${key}: audio candidate count is invalid`);
      if (member?.audioStatus !== "candidate-index-only") errors.push(`${key}: audio status must remain candidate-index-only`);
    }
    const shards = array(release?.shards);
    if (release?.expectedCounts?.shards !== shards.length) errors.push(`${key}: shard count mismatch`);
    const shardOrdinals = [];
    for (const [shardIndex, shard] of shards.entries()) {
      const expectedShardId = `shard-${String(shardIndex + 1).padStart(2, "0")}`;
      const expectedBatchId = `batch-${String(shardIndex + 1).padStart(3, "0")}`;
      const memberOrdinals = array(shard?.memberOrdinals);
      if (shard?.shardId !== expectedShardId || shard?.batchId !== expectedBatchId || shard?.ordinal !== shardIndex + 1) {
        errors.push(`${key}: shard identity/order drift at ${shardIndex + 1}`);
      }
      if (shard?.memberCount !== memberOrdinals.length || shard.memberCount > SHARD_SIZE) {
        errors.push(`${key}: shard member count exceeds/mismatches ${SHARD_SIZE}`);
      }
      if (memberOrdinals.some((ordinal, index) => ordinal !== (shardOrdinals.length + index + 1))) {
        errors.push(`${key}: shard member ordinal coverage drift at ${shardIndex + 1}`);
      }
      shardOrdinals.push(...memberOrdinals);
    }
    if (shardOrdinals.length !== members.length || shardOrdinals.some((ordinal, index) => ordinal !== index + 1)) {
      errors.push(`${key}: shards do not cover the exact member ordinal set`);
    }
    if (release?.acceptanceEffects && stableJson(release.acceptanceEffects) !== stableJson(ALL_FALSE)) errors.push(`${key}: acceptance effects must remain false`);
  }
  if (pages !== 2282) errors.push(`expected 2282 active page members, found ${pages}`);
  if (manifest?.expectedCounts?.courseShells !== 0) errors.push("top-level courseShells must be zero");
  if (stableJson(manifest?.acceptanceEffects) !== stableJson(ALL_FALSE)) errors.push("acceptance effects must remain false");
  return errors;
}

export function parseArguments(argv) {
  const options = {catalog: DEFAULT_CATALOG, mapping: DEFAULT_MAPPING, output: DEFAULT_OUTPUT, mode: "check"};
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check" || argument === "--write") {
      if (explicitMode) fail("choose exactly one of --check or --write");
      explicitMode = true;
      options.mode = argument.slice(2);
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const key = {"--catalog": "catalog", "--mapping": "mapping", "--output": "output"}[argument];
    if (!key) fail(`unknown argument: ${argument}`);
    if (index + 1 >= argv.length) fail(`${argument} requires a value`);
    options[key] = argv[++index];
  }
  if (options.mode === "write" && !options.output) fail("--write requires --output");
  return Object.freeze(options);
}

async function publishNoReplace(filePath, bytes) {
  if (await exists(filePath)) fail(`output already exists; use --check or a new path: ${filePath}`);
  await mkdir(path.dirname(filePath), {recursive: true});
  const staging = `${filePath}.staging-${process.pid}-${Date.now()}`;
  try {
    await writeFile(staging, bytes, {encoding: "utf8", flag: "wx"});
    await rename(staging, filePath);
  } catch (error) {
    await rm(staging, {force: true}).catch(() => {});
    throw error;
  }
}

export async function run(options) {
  if (options.help) return {help: true};
  const [catalogIdentity, mappingIdentity] = await Promise.all([
    readJson(options.catalog, "catalog"),
    readJson(options.mapping, "mapping"),
  ]);
  const manifest = buildReleaseManifest({
    catalog: catalogIdentity.value,
    mapping: mappingIdentity.value,
    catalogIdentity,
    mappingIdentity,
  });
  const errors = validateReleaseManifest(manifest);
  if (errors.length) fail(errors.join("; "));
  const bytes = stableJson(manifest);
  if (options.output) {
    const outputPath = projectPath(options.output, "output");
    if (options.mode === "write") await publishNoReplace(outputPath, bytes);
    else {
      const existing = await readFile(outputPath, "utf8");
      if (existing !== bytes) fail(`release manifest drift: ${outputPath}`);
    }
  }
  return {
    status: "source-audit-only",
    output: options.output ?? null,
    releases: manifest.releases.length,
    activePageMembers: manifest.expectedCounts.activeXmlReferencedPages,
    courseShells: manifest.expectedCounts.courseShells,
    acceptanceEffects: manifest.acceptanceEffects,
  };
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedDirectly) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node scripts/build-g678-page-only-release-manifest.mjs --write --output <manifest> [--catalog <catalog>] [--mapping <mapping>]\n       node scripts/build-g678-page-only-release-manifest.mjs --check --output <manifest>");
    } else {
      console.log(stableJson(await run(options)));
    }
  } catch (error) {
    console.error(stableJson({status: "error", message: error.message}));
    process.exitCode = 1;
  }
}
