#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {scaffoldPilotMigrations} from "./scaffold-pilot-migrations.mjs";
import {syncMigrationsFromCatalog} from "./sync-migrations-from-catalog.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L4_RELEASE_ID = "lesson-g05-l04-number-lines";
export const G5_L4_SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
export const G5_L4_LESSON_PREFIX = "HELP_COURSES/ELMGR5/L4/";
export const G5_L4_SCOPE_PATH = "reports/g5-l4-source-scope-freeze.json";
export const G5_L4_SCOPE_MARKDOWN_PATH = "reports/g5-l4-source-scope-freeze.md";
export const G5_L4_READINESS_PATH = "reports/g5-l4-workspace-readiness.json";
export const G5_L4_READINESS_MARKDOWN_PATH = "reports/g5-l4-workspace-readiness.md";
export const G5_L4_BINDING_PATH = "audit/machine/g5-l4-source-scope-binding.json";

const COURSE_XML_PATH = `${G5_L4_LESSON_PREFIX}index.xml`;
const MAIN_SCRIPT_PATH = `${G5_L4_LESSON_PREFIX}AS/MainScript_New.as`;
const KEYTERM_PATHS = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
]);
const INPUT_PATHS = Object.freeze({
  lessons: "catalog/lessons.json",
  animations: "catalog/animations.json",
  sourceFiles: "catalog/source-files.json",
  audioGroups: "catalog/audio-groups.json",
});
const SHARDS = Object.freeze([
  {shardId: "g05-l04-host-language", sections: ["IR", "RW", "VB"], includesShell: true, expectedCount: 15},
  {shardId: "g05-l04-instruction", sections: ["IN"], includesShell: false, expectedCount: 21},
  {shardId: "g05-l04-practice-assessment", sections: ["TI", "GS", "TS", "FQ"], includesShell: false, expectedCount: 19},
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

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function describeFile(absolutePath, relativePath) {
  const bytes = await readFile(absolutePath);
  return {path: relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes)};
}

function descriptorFromCatalog(entry) {
  return {path: entry.path, bytes: entry.bytes, sha256: entry.sha256};
}

function shardForMember(section, shell) {
  const matches = SHARDS.filter((shard) => shell ? shard.includesShell : shard.sections.includes(section));
  invariant(matches.length === 1, `G5 L4 member has ambiguous shard assignment: ${section || "shell"}`);
  return matches[0].shardId;
}

function catalogAnimationSource(animation) {
  const swf = animation.source?.swf;
  invariant(animation.source?.path && animation.source?.sha256 && Number.isInteger(animation.source?.bytes), `${animation.animationId}: incomplete SWF catalog source`);
  invariant(swf?.status === "parsed", `${animation.animationId}: SWF catalog metadata is not parsed`);
  return {
    swf: descriptorFromCatalog(animation.source),
    fla: animation.pairedFla ? descriptorFromCatalog(animation.pairedFla) : null,
    sourceModel: animation.pairedFla ? "paired-fla-and-shipped-swf" : "shipped-swf-only",
    swfMetadata: {
      signature: swf.signature,
      version: swf.version,
      stage: {width: swf.stage?.width, height: swf.stage?.height},
      fps: swf.fps,
      rootFrameCount: swf.frameCount,
      durationMs: swf.durationMs,
    },
  };
}

function exactCourseXmlOccurrence(animation) {
  const matches = (animation.references?.courseXml || []).filter((reference) => reference.sourceXmlPath === COURSE_XML_PATH);
  invariant(matches.length === 1 && Number.isInteger(matches[0].occurrence), `${animation.animationId}: expected one exact course XML occurrence`);
  return matches[0].occurrence;
}

function buildMember(animation, ordinal, shell = false) {
  const section = shell ? null : animation.classification?.section?.code;
  const pageOrdinal = shell ? null : animation.classification?.page?.ordinal;
  invariant(shell || (typeof section === "string" && Number.isInteger(pageOrdinal)), `${animation.animationId}: incomplete active-page classification`);
  return {
    ordinal,
    animationId: animation.animationId,
    assetId: animation.assetId,
    role: shell ? "lesson-shell" : "lesson-page",
    shardId: shardForMember(section, shell),
    section,
    sectionPageOrdinal: pageOrdinal,
    source: catalogAnimationSource(animation),
    title: {
      english: animation.classification?.titleEnglish || animation.classification?.titleDisplay || "",
      spanish: animation.classification?.titleSpanish || null,
      spanishDisposition: animation.classification?.titleSpanish
        ? "source-title-present"
        : "source-title-missing-use-source-faithful-english-fallback-pending-reviewed-localization",
    },
    audioCatalog: {
      exact: (animation.audio?.exact || []).map(descriptorFromCatalog),
      groupIds: [...(animation.audio?.groupIds || [])].sort(compareText),
      runtimeCueDisposition: "unresolved",
    },
    workspacePath: `migrations/${animation.animationId}`,
    strictComplete: false,
  };
}

function sourceFilename(relativePath) {
  return relativePath.slice(relativePath.lastIndexOf("/") + 1);
}

export function buildG5L4ScopeFromCatalogs({
  lessonsCatalog,
  animationsCatalog,
  sourceFilesCatalog,
  audioGroupsCatalog,
  inputDescriptors = {},
  courseXmlText = "",
  mainScriptText = "",
} = {}) {
  invariant(Array.isArray(lessonsCatalog?.lessons), "Lesson catalog is malformed");
  invariant(Array.isArray(animationsCatalog?.animations), "Animation catalog is malformed");
  invariant(Array.isArray(sourceFilesCatalog?.files), "Source-file catalog is malformed");
  invariant(Array.isArray(audioGroupsCatalog?.groups), "Audio-group catalog is malformed");

  const lessonMatches = lessonsCatalog.lessons.filter((lesson) => lesson.grade === 5 && lesson.lesson === 4);
  invariant(lessonMatches.length === 1, `Expected one G5 L4 lesson record, found ${lessonMatches.length}`);
  const lesson = lessonMatches[0];
  invariant(lesson.path === COURSE_XML_PATH, `Unexpected G5 L4 course XML path: ${lesson.path}`);
  invariant(lesson.sha256 === "b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36", "G5 L4 course XML hash changed; a new reviewed freeze is required");
  invariant(lesson.pageReferenceCount === 54 && lesson.sectionCount === 8, "G5 L4 lesson catalog shape changed");

  const lessonAnimations = animationsCatalog.animations
    .filter((animation) => animation.source?.path?.startsWith(G5_L4_LESSON_PREFIX))
    .sort((left, right) => compareText(left.animationId, right.animationId));
  const pageAnimations = lessonAnimations.filter((animation) => animation.flags?.referenced === true);
  const shellAnimations = lessonAnimations.filter((animation) => animation.flags?.shell === true);
  invariant(pageAnimations.length === 54, `Expected 54 active G5 L4 pages, found ${pageAnimations.length}`);
  invariant(shellAnimations.length === 1, `Expected one G5 L4 shell, found ${shellAnimations.length}`);
  invariant(shellAnimations[0].source.sha256 === "7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301", "G5 L4 shell hash changed; a new reviewed freeze is required");

  const orderedPages = pageAnimations
    .map((animation) => ({animation, occurrence: exactCourseXmlOccurrence(animation)}))
    .sort((left, right) => left.occurrence - right.occurrence);
  invariant(orderedPages.every(({occurrence}, index) => occurrence === index + 1), "G5 L4 active XML occurrences are not the exact sequence 1..54");
  const members = [
    ...orderedPages.map(({animation, occurrence}) => buildMember(animation, occurrence)),
    buildMember(shellAnimations[0], 55, true),
  ];
  invariant(new Set(members.map(({animationId}) => animationId)).size === 55, "G5 L4 member animation IDs are not unique");
  invariant(new Set(members.map(({assetId}) => assetId)).size === 55, "G5 L4 member asset IDs are not unique");

  const exclusions = lessonAnimations
    .filter((animation) => !pageAnimations.includes(animation) && !shellAnimations.includes(animation))
    .map((animation) => ({
      animationId: animation.animationId,
      canonicalAnimationId: animation.canonicalAnimationId,
      assetId: animation.assetId,
      source: catalogAnimationSource(animation),
      variantKind: animation.flags?.variantKind || "unclassified-unreferenced",
      activeCourseXmlReferenceCount: (animation.references?.courseXml || []).length,
      mainScriptFilenameReference: mainScriptText.includes(sourceFilename(animation.source.path)),
      disposition: "excluded-from-frozen-release-scope-pending-authorized-shell-reachability-review",
      strictAcceptanceEffect: "none",
    }));
  invariant(exclusions.length === 10, `Expected 10 G5 L4 exclusions, found ${exclusions.length}`);

  if (courseXmlText) {
    const activeXml = courseXmlText.replace(/<!--[\s\S]*?-->/g, "");
    const xmlPagePaths = [...activeXml.matchAll(/<Page\b[^>]*>([^<]+\.swf)<\/Page>/g)]
      .map((match) => `${G5_L4_LESSON_PREFIX}${match[1].trim()}`);
    invariant(xmlPagePaths.length === 54, `Physical G5 L4 XML contains ${xmlPagePaths.length} active Page elements instead of 54`);
    invariant(xmlPagePaths.every((sourcePath, index) => sourcePath === members[index].source.swf.path), "Physical G5 L4 XML page order differs from the animation catalog occurrences");
    invariant(KEYTERM_PATHS.every((keytermPath) => courseXmlText.includes(keytermPath)), "Physical G5 L4 XML no longer declares the expected keyterm paths");
  }

  const sourceFileByPath = new Map(sourceFilesCatalog.files.map((entry) => [entry.path, entry]));
  const audioCandidates = sourceFilesCatalog.files
    .filter((entry) => entry.path.startsWith(G5_L4_LESSON_PREFIX) && entry.extension?.toLowerCase() === "mp3")
    .map((entry) => ({...descriptorFromCatalog(entry), catalogLanguage: "unresolved", runtimeCueDisposition: "unresolved"}))
    .sort((left, right) => compareText(left.path, right.path));
  invariant(audioCandidates.length === 135, `Expected 135 G5 L4 MP3 candidates, found ${audioCandidates.length}`);

  const exactAudioPaths = new Set(members.flatMap((member) => member.audioCatalog.exact.map(({path: audioPath}) => audioPath)));
  const groupIds = [...new Set(members.flatMap((member) => member.audioCatalog.groupIds))].sort(compareText);
  const audioGroupById = new Map(audioGroupsCatalog.groups.map((group) => [group.groupId, group]));
  const groupAudio = groupIds.flatMap((groupId) => {
    const group = audioGroupById.get(groupId);
    invariant(group, `Missing declared G5 L4 audio group ${groupId}`);
    return group.files.map((entry) => ({groupId, ...descriptorFromCatalog(entry), catalogLanguage: entry.language || "unresolved"}));
  });
  const groupAudioPaths = new Set(groupAudio.map(({path: audioPath}) => audioPath));
  const unmappedAudio = audioCandidates.filter(({path: audioPath}) => !exactAudioPaths.has(audioPath) && !groupAudioPaths.has(audioPath));
  invariant(exactAudioPaths.size === 50, `Expected 50 exact page MP3 associations, found ${exactAudioPaths.size}`);
  invariant(groupAudioPaths.size === 83, `Expected 83 grouped FQ MP3 candidates, found ${groupAudioPaths.size}`);
  invariant(unmappedAudio.length === 2, `Expected two unmapped G5 L4 MP3 candidates, found ${unmappedAudio.length}`);
  invariant(unmappedAudio.map(({path: audioPath}) => audioPath).join("\n") === [
    `${G5_L4_LESSON_PREFIX}SA/GR5_L4_TS_Q1_SpA.mp3`,
    `${G5_L4_LESSON_PREFIX}SA/GR5_L4_TS_Q1_SpC.mp3`,
  ].join("\n"), "The unmapped G5 L4 audio candidate set changed");
  invariant(audioCandidates.every(({path: audioPath}) => sourceFileByPath.has(audioPath)), "Audio candidate is missing from the source-file catalog");

  const mainScriptEntry = sourceFileByPath.get(MAIN_SCRIPT_PATH);
  invariant(mainScriptEntry, `Missing source catalog entry ${MAIN_SCRIPT_PATH}`);
  const pairedCount = members.filter((member) => member.source.fla).length;
  const swfOnlyCount = members.length - pairedCount;
  const rootFrameCount = members.reduce((total, member) => total + member.source.swfMetadata.rootFrameCount, 0);
  invariant(pairedCount === 44 && swfOnlyCount === 11, `Expected 44 paired and 11 SWF-only members, found ${pairedCount}/${swfOnlyCount}`);
  invariant(rootFrameCount === 590, `Expected 590 catalog root frames, found ${rootFrameCount}`);
  for (const shard of SHARDS) {
    invariant(members.filter((member) => member.shardId === shard.shardId).length === shard.expectedCount, `${shard.shardId}: member count changed`);
  }

  const scope = {
    schemaVersion: 1,
    reportType: "g5-l4-source-scope-freeze",
    releaseId: G5_L4_RELEASE_ID,
    evidenceState: "catalog-and-physical-source-scope-candidate-fail-closed",
    generator: inputDescriptors.generator || null,
    inputs: {
      lessonsCatalog: inputDescriptors.lessons || null,
      animationsCatalog: inputDescriptors.animations || null,
      sourceFilesCatalog: inputDescriptors.sourceFiles || null,
      audioGroupsCatalog: inputDescriptors.audioGroups || null,
      courseXml: descriptorFromCatalog(lesson),
      mainScript: descriptorFromCatalog(mainScriptEntry),
    },
    lesson: {
      grade: 5,
      lesson: 4,
      courseName: lesson.courseName,
      title: lesson.titleDisplay,
      domain: lesson.domain,
      nativeStage: {width: 800, height: 600},
      fps: 12,
      catalogRootFrameCount: rootFrameCount,
      catalogRootFrameBoundary: "root-timelines-only-not-complete-reachable-domain-coverage",
    },
    summary: {
      pageCount: 54,
      shellCount: 1,
      memberCount: 55,
      pairedFlaSwfCount: pairedCount,
      swfOnlyCount,
      exclusionCount: exclusions.length,
      audioCandidateCount: audioCandidates.length,
      exactPageAudioCandidateCount: exactAudioPaths.size,
      groupedFqAudioCandidateCount: groupAudioPaths.size,
      unmappedAudioCandidateCount: unmappedAudio.length,
      missingSpanishPageTitleCount: members.filter((member) => member.role === "lesson-page" && !member.title.spanish).length,
      missingSpanishTitleIncludingShellCount: members.filter((member) => !member.title.spanish).length,
      draftWorkspaceTargetCount: 55,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    shards: SHARDS.map((shard) => ({
      ...shard,
      memberOrdinals: members.filter((member) => member.shardId === shard.shardId).map(({ordinal}) => ordinal),
      publicationEffect: "none-independent-development-only",
    })),
    members,
    exclusions,
    conflicts: [
      {
        conflictId: "active-course-xml-versus-legacy-main-script-page-set",
        status: "unresolved",
        strictBlocker: true,
        facts: {
          activeCourseXmlPageCount: 54,
          mainScriptPath: MAIN_SCRIPT_PATH,
          excludedMainScriptFilenameReferences: exclusions.filter(({mainScriptFilenameReference}) => mainScriptFilenameReference).map(({animationId}) => animationId),
        },
        requiredDisposition: "authorized-original-shell-natural-navigation-must-confirm-the-reachable-page-set-before-release-scope-may-change",
      },
      {
        conflictId: "missing-lesson-keyterm-localization-xml",
        status: "missing",
        strictBlocker: true,
        declaredBy: COURSE_XML_PATH,
        missingPaths: KEYTERM_PATHS,
        requiredDisposition: "recover-and-hash-bind-the-dependencies-or-record-a-validator-supported-reviewed-exception-without-inventing-content",
      },
      {
        conflictId: "audio-runtime-language-cue-and-listening-disposition",
        status: "unresolved",
        strictBlocker: true,
        candidateCount: audioCandidates.length,
        exactPageAssociationCount: exactAudioPaths.size,
        groupedFqCandidateCount: groupAudioPaths.size,
        unmappedPaths: unmappedAudio.map(({path: audioPath}) => audioPath),
        requiredDisposition: "audit-every-cue-language-timing-host-dependency-and-replay-behavior-then-complete-named-human-original-runtime-listening-where-required",
      },
    ],
    audioCandidateDisposition: {
      status: "candidate-only-unheard-runtime-cues-unresolved",
      candidates: audioCandidates,
      groupedCandidates: groupAudio,
      exactPageAssociationPaths: [...exactAudioPaths].sort(compareText),
      unmappedCandidates: unmappedAudio,
      machineFactsEstablishAudibleCorrectness: false,
      audioAccepted: false,
    },
    localizationDisposition: {
      sourceSpanishTitleMissingAnimationIds: members.filter((member) => !member.title.spanish).map(({animationId}) => animationId),
      defaultFallback: "retain-source-English-title-do-not-invent-Spanish",
      localizationAccepted: false,
    },
    acceptanceEffects: {
      authoringAuditComplete: false,
      reachableFrameDomainsComplete: false,
      authoritativeOriginalRuntime: false,
      currentJavaScriptCandidate: false,
      fullFrameComparison: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  scope.generatedMarker = `sha256:${sha256Bytes(jsonBytes({
    releaseId: scope.releaseId,
    inputs: scope.inputs,
    members: scope.members,
    exclusions: scope.exclusions,
    conflicts: scope.conflicts,
    audioCandidateDisposition: scope.audioCandidateDisposition,
  }))}`;
  return scope;
}

async function loadScopeInputs(root = projectRoot) {
  const entries = await Promise.all(Object.entries(INPUT_PATHS).map(async ([key, relativePath]) => {
    const absolutePath = path.join(root, relativePath);
    const bytes = await readFile(absolutePath);
    return [key, JSON.parse(bytes), {path: relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes)}];
  }));
  const documents = Object.fromEntries(entries.map(([key, document]) => [key, document]));
  const inputDescriptors = Object.fromEntries(entries.map(([key, , descriptor]) => [key, descriptor]));
  inputDescriptors.generator = await describeFile(scriptPath, path.relative(root, scriptPath));
  const courseXmlText = await readFile(path.join(root, G5_L4_SOURCE_ROOT, COURSE_XML_PATH), "utf8");
  const mainScriptText = await readFile(path.join(root, G5_L4_SOURCE_ROOT, MAIN_SCRIPT_PATH), "utf8");
  return {
    lessonsCatalog: documents.lessons,
    animationsCatalog: documents.animations,
    sourceFilesCatalog: documents.sourceFiles,
    audioGroupsCatalog: documents.audioGroups,
    inputDescriptors,
    courseXmlText,
    mainScriptText,
  };
}

async function verifyDescriptorAtSourceRoot(root, descriptor) {
  const absolutePath = path.join(root, G5_L4_SOURCE_ROOT, descriptor.path);
  const observed = await describeFile(absolutePath, descriptor.path);
  invariant(observed.bytes === descriptor.bytes && observed.sha256 === descriptor.sha256, `${descriptor.path}: physical source differs from the catalog descriptor`);
}

async function pathExists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function verifyPhysicalScope(root, scope) {
  const descriptors = [
    scope.inputs.courseXml,
    scope.inputs.mainScript,
    ...scope.members.flatMap((member) => [member.source.swf, member.source.fla].filter(Boolean)),
    ...scope.exclusions.flatMap((exclusion) => [exclusion.source.swf, exclusion.source.fla].filter(Boolean)),
    ...scope.audioCandidateDisposition.candidates,
  ];
  const unique = new Map(descriptors.map((descriptor) => [descriptor.path, descriptor]));
  for (const descriptor of unique.values()) await verifyDescriptorAtSourceRoot(root, descriptor);
  for (const keytermPath of KEYTERM_PATHS) {
    invariant(!(await pathExists(path.join(root, G5_L4_SOURCE_ROOT, keytermPath))), `${keytermPath}: dependency is now present; review and version the source-scope disposition instead of preserving the missing-source blocker`);
  }
  scope.physicalSourceVerification = {
    checkedFileCount: unique.size,
    allCatalogDescriptorsMatch: true,
    sourceAssetsModified: false,
    missingDeclaredKeytermPathsConfirmed: [...KEYTERM_PATHS],
  };
}

function scopeMarkdown(scope, descriptor) {
  return `# G5 L4 Source Scope Freeze\n\n` +
    `- Release candidate: \`${scope.releaseId}\`.\n` +
    `- Frozen members: **${scope.summary.memberCount}** (${scope.summary.pageCount} XML pages + ${scope.summary.shellCount} shell).\n` +
    `- Source models: **${scope.summary.pairedFlaSwfCount}** paired FLA/SWF; **${scope.summary.swfOnlyCount}** SWF-only.\n` +
    `- Explicit exclusions: **${scope.summary.exclusionCount}**.\n` +
    `- MP3 candidates: **${scope.summary.audioCandidateCount}** = ${scope.summary.exactPageAudioCandidateCount} exact page associations + ${scope.summary.groupedFqAudioCandidateCount} grouped FQ candidates + ${scope.summary.unmappedAudioCandidateCount} unmapped.\n` +
    `- Catalog root frames: **${scope.lesson.catalogRootFrameCount}**; this is not complete nested/interactive coverage.\n` +
    `- JSON descriptor: \`${descriptor.sha256}\` (${descriptor.bytes} bytes).\n\n` +
    `## Fail-closed blockers\n\n` +
    scope.conflicts.map((conflict) => `- \`${conflict.conflictId}\`: ${conflict.status}; strict blocker.`).join("\n") +
    `\n\nThis is source-scope and workspace-intake evidence only. It establishes no original-runtime authority, JavaScript fidelity, audio acceptance, human or owner decision, strict completion, or publication.\n`;
}

function workspaceBinding(member, scopeDescriptor) {
  return {
    schemaVersion: 1,
    artifactType: "g5-l4-source-scope-binding",
    releaseId: G5_L4_RELEASE_ID,
    scope: scopeDescriptor,
    member: {
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      role: member.role,
      shardId: member.shardId,
      section: member.section,
      sectionPageOrdinal: member.sectionPageOrdinal,
      source: member.source,
    },
    disposition: {
      sourceIdentity: "physically-hash-verified-and-catalog-bound",
      authoringStructure: member.source.fla ? "pending-read-only-animate-audit" : "unavailable-swf-only-do-not-invent",
      runtimeReachability: "unresolved",
      nestedFrameDomains: "unresolved",
      audio: "candidate-only-unheard-runtime-cues-unresolved",
      localization: member.title.spanishDisposition,
    },
    acceptanceEffects: {
      draftWorkspaceShapeOnly: true,
      authoritativeOriginalRuntime: false,
      currentJavaScriptCandidate: false,
      fullFrameComparison: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
}

async function checkText(absolutePath, expected, label) {
  let actual;
  try {
    actual = await readFile(absolutePath);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`${label} is missing: ${absolutePath}`);
    throw error;
  }
  invariant(actual.equals(expected), `${label} is stale: ${absolutePath}`);
}

async function runDraftValidator(workspacePath) {
  try {
    const {stdout, stderr} = await execFileAsync(process.execPath, [
      path.join(projectRoot, "skills/flash-to-js/scripts/validate_migration.mjs"),
      workspacePath,
      "--allow-draft",
    ], {cwd: projectRoot, maxBuffer: 4 * 1024 * 1024});
    invariant(`${stdout}\n${stderr}`.includes("PASS: draft validation"), `${workspacePath}: draft validator did not report PASS`);
    return {mode: "allow-draft", passed: true, acceptanceEffect: "portable-schema-and-intake-shape-only"};
  } catch (error) {
    throw new Error(`${workspacePath}: draft validation failed (${error.stderr || error.stdout || error.message})`);
  }
}

async function mapLimited(items, limit, callback) {
  const output = [];
  for (let index = 0; index < items.length; index += limit) {
    output.push(...await Promise.all(items.slice(index, index + limit).map(callback)));
  }
  return output;
}

async function inspectWorkspace(root, migrationsRoot, member, scopeDescriptor, {checkBinding = true} = {}) {
  const workspacePath = path.join(migrationsRoot, member.animationId);
  const manifestPath = path.join(workspacePath, "migration.json");
  const manifestBytes = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  invariant(manifest.id === member.animationId && manifest.animationId === member.animationId, `${member.animationId}: workspace identity mismatch`);
  invariant(manifest.assetId === member.assetId, `${member.animationId}: workspace asset identity mismatch`);
  invariant(manifest.source?.swfSha256 === member.source.swf.sha256, `${member.animationId}: workspace SWF hash mismatch`);
  invariant(manifest.source?.flaSha256 === (member.source.fla?.sha256 || ""), `${member.animationId}: workspace FLA hash mismatch`);
  invariant(manifest.source?.pairedFlaStatus === (member.source.fla ? "present" : "missing"), `${member.animationId}: workspace paired-FLA disposition mismatch`);
  invariant(manifest.catalogEvidence?.animationId === member.animationId, `${member.animationId}: catalog evidence was not imported`);
  invariant(manifest.classification?.status !== "unresolved", `${member.animationId}: catalog classification remains unresolved`);
  invariant((manifest.audio?.catalogExactAssociations || []).length === member.audioCatalog.exact.length, `${member.animationId}: exact audio association count mismatch`);
  invariant(JSON.stringify(manifest.audio?.catalogGroupCandidates || []) === JSON.stringify(member.audioCatalog.groupIds), `${member.animationId}: audio group candidates mismatch`);

  const expectedBinding = jsonBytes(workspaceBinding(member, scopeDescriptor));
  const bindingAbsolutePath = path.join(workspacePath, G5_L4_BINDING_PATH);
  if (checkBinding) await checkText(bindingAbsolutePath, expectedBinding, `${member.animationId} source-scope binding`);
  const bindingDescriptor = {path: `${member.workspacePath}/${G5_L4_BINDING_PATH}`, bytes: expectedBinding.length, sha256: sha256Bytes(expectedBinding)};
  const validation = await runDraftValidator(workspacePath);
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    shardId: member.shardId,
    sourceModel: member.source.sourceModel,
    workspacePath: member.workspacePath,
    manifest: {path: `${member.workspacePath}/migration.json`, bytes: manifestBytes.length, sha256: sha256Bytes(manifestBytes)},
    sourceScopeBinding: bindingDescriptor,
    draftValidation: validation,
    implementationStatus: "not-started",
    strictComplete: false,
  };
}

function readinessReport(scopeDescriptor, workspaces) {
  return {
    schemaVersion: 1,
    reportType: "g5-l4-workspace-readiness",
    releaseId: G5_L4_RELEASE_ID,
    scope: scopeDescriptor,
    summary: {
      expectedWorkspaceCount: 55,
      presentWorkspaceCount: workspaces.length,
      draftValidationPassCount: workspaces.filter((workspace) => workspace.draftValidation.passed).length,
      pairedWorkspaceCount: workspaces.filter((workspace) => workspace.sourceModel === "paired-fla-and-shipped-swf").length,
      swfOnlyWorkspaceCount: workspaces.filter((workspace) => workspace.sourceModel === "shipped-swf-only").length,
      implementationStartedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    workspaces,
    blockers: [
      "active-course-xml-versus-legacy-main-script-page-set",
      "missing-lesson-keyterm-localization-xml",
      "audio-runtime-language-cue-and-listening-disposition",
      "root-reachable-frame-domain-audit-not-complete",
      "authoritative-original-runtime-evidence-not-present",
      "human-and-owner-decisions-not-present",
    ],
    acceptanceEffects: {
      workspaceIntakeReady: workspaces.length === 55 && workspaces.every((workspace) => workspace.draftValidation.passed),
      authoringAuditComplete: false,
      strictComplete: false,
      published: false,
    },
  };
}

function readinessMarkdown(report, descriptor) {
  return `# G5 L4 Workspace Readiness\n\n` +
    `- Canonical workspaces present: **${report.summary.presentWorkspaceCount}/${report.summary.expectedWorkspaceCount}**.\n` +
    `- Draft validation: **${report.summary.draftValidationPassCount}/${report.summary.expectedWorkspaceCount}**.\n` +
    `- Paired FLA/SWF: **${report.summary.pairedWorkspaceCount}**; SWF-only: **${report.summary.swfOnlyWorkspaceCount}**.\n` +
    `- Implementation / strict / published: **0 / 0 / 0**.\n` +
    `- JSON descriptor: \`${descriptor.sha256}\` (${descriptor.bytes} bytes).\n\n` +
    `Draft validation proves only portable workspace schema and intake shape. Every authoring, runtime, nested-domain, JavaScript, RMSE, audio, human, owner, strict-completion, and publication gate remains closed.\n`;
}

function pilotsForScope(scope, root) {
  return scope.members.map((member) => ({
    id: member.animationId,
    swf: path.join(root, G5_L4_SOURCE_ROOT, member.source.swf.path),
    ...(member.source.fla ? {fla: path.join(root, G5_L4_SOURCE_ROOT, member.source.fla.path)} : {}),
  }));
}

export async function materializeG5L4SourceWorkspaces({
  root = projectRoot,
  migrationsRoot = path.join(root, "migrations"),
  reportsRoot = path.join(root, "reports"),
  dryRun = false,
  check = false,
} = {}) {
  invariant(!(dryRun && check), "Choose at most one of --dry-run and --check");
  const scope = buildG5L4ScopeFromCatalogs(await loadScopeInputs(root));
  await verifyPhysicalScope(root, scope);
  const scopeBytes = jsonBytes(scope);
  const scopeDescriptor = {path: G5_L4_SCOPE_PATH, bytes: scopeBytes.length, sha256: sha256Bytes(scopeBytes)};
  const scopeMarkdownBytes = Buffer.from(scopeMarkdown(scope, scopeDescriptor));
  const pilots = pilotsForScope(scope, root);

  if (dryRun) {
    const planned = await scaffoldPilotMigrations({pilots, output: migrationsRoot, dryRun: true});
    return {mode: "dry-run", scope, scopeDescriptor, planned, readiness: null};
  }

  if (check) {
    await checkText(path.join(root, G5_L4_SCOPE_PATH), scopeBytes, "G5 L4 source scope freeze");
    await checkText(path.join(root, G5_L4_SCOPE_MARKDOWN_PATH), scopeMarkdownBytes, "G5 L4 source scope markdown");
  } else {
    await scaffoldPilotMigrations({pilots, output: migrationsRoot});
    await syncMigrationsFromCatalog({
      catalogPath: path.join(root, INPUT_PATHS.animations),
      migrationsRoot,
      animationIds: scope.members.map(({animationId}) => animationId),
    });
    await mkdir(reportsRoot, {recursive: true});
    await writeFile(path.join(root, G5_L4_SCOPE_PATH), scopeBytes);
    await writeFile(path.join(root, G5_L4_SCOPE_MARKDOWN_PATH), scopeMarkdownBytes);
    for (const member of scope.members) {
      const bindingPath = path.join(migrationsRoot, member.animationId, G5_L4_BINDING_PATH);
      await mkdir(path.dirname(bindingPath), {recursive: true});
      await writeFile(bindingPath, jsonBytes(workspaceBinding(member, scopeDescriptor)));
    }
  }

  const workspaces = await mapLimited(scope.members, 8, (member) => inspectWorkspace(root, migrationsRoot, member, scopeDescriptor));
  const readiness = readinessReport(scopeDescriptor, workspaces);
  invariant(readiness.summary.presentWorkspaceCount === 55 && readiness.summary.draftValidationPassCount === 55, "G5 L4 workspace readiness is incomplete");
  invariant(readiness.summary.pairedWorkspaceCount === 44 && readiness.summary.swfOnlyWorkspaceCount === 11, "G5 L4 workspace source models changed");
  const readinessBytes = jsonBytes(readiness);
  const readinessDescriptor = {path: G5_L4_READINESS_PATH, bytes: readinessBytes.length, sha256: sha256Bytes(readinessBytes)};
  const readinessMarkdownBytes = Buffer.from(readinessMarkdown(readiness, readinessDescriptor));
  if (check) {
    await checkText(path.join(root, G5_L4_READINESS_PATH), readinessBytes, "G5 L4 workspace readiness");
    await checkText(path.join(root, G5_L4_READINESS_MARKDOWN_PATH), readinessMarkdownBytes, "G5 L4 workspace readiness markdown");
  } else {
    await writeFile(path.join(root, G5_L4_READINESS_PATH), readinessBytes);
    await writeFile(path.join(root, G5_L4_READINESS_MARKDOWN_PATH), readinessMarkdownBytes);
  }
  return {mode: check ? "check" : "write", scope, scopeDescriptor, readiness, readinessDescriptor};
}

function usage() {
  return `Usage:\n  node scripts/materialize-g5-l4-source-workspaces.mjs [--dry-run | --check]\n\n` +
    `Freezes the exact 54 active XML pages plus one lesson shell, records ten\n` +
    `exclusions and fail-closed source/audio conflicts, and materializes or checks\n` +
    `55 canonical draft workspaces. It never edits source-assets, implements a\n` +
    `renderer, creates runtime authority, records human decisions, or publishes.`;
}

async function main() {
  const options = {};
  for (const argument of process.argv.slice(2)) {
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      return;
    }
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  const result = await materializeG5L4SourceWorkspaces(options);
  if (result.mode === "dry-run") {
    const creates = result.planned.filter(({action}) => action === "create").length;
    console.log(`DRY RUN: ${result.scope.summary.memberCount} members verified; ${creates} workspaces would be created; ${result.scope.summary.exclusionCount} exclusions and ${result.scope.summary.audioCandidateCount} MP3 candidates remain fail-closed.`);
    return;
  }
  console.log(`${result.mode === "check" ? "PASS" : "MATERIALIZED"}: G5 L4 source scope ${result.scope.summary.memberCount}/55; draft workspaces ${result.readiness.summary.draftValidationPassCount}/55; strict 0/55; published 0/1.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
