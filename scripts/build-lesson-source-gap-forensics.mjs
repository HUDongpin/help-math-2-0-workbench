#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaults = {
  releases: "catalog/lesson-releases.json",
  profiles: "catalog/lesson-release-source-gap-profiles.json",
  sourceFiles: "catalog/source-files.json",
};

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function resolveProjectPath(relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const absolute = path.resolve(projectRoot, relativePath);
  const normalized = portable(path.relative(projectRoot, absolute));
  invariant(normalized && normalized !== ".." && !normalized.startsWith("../"), `${label} escapes the project root`);
  invariant(normalized === relativePath, `${label} must be normalized as ${normalized}`);
  return absolute;
}

async function assertOrdinaryFile(absolutePath, label) {
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be an ordinary file`);
  invariant(metadata.nlink === 1, `${label} must not be hard-linked`);
}

async function fileBinding(relativePath, label) {
  const absolute = resolveProjectPath(relativePath, label);
  await assertOrdinaryFile(absolute, label);
  const bytes = await readFile(absolute);
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), value: bytes};
}

async function jsonBinding(relativePath, label) {
  const binding = await fileBinding(relativePath, label);
  return {...binding, value: JSON.parse(binding.value.toString("utf8"))};
}

function withoutValue(binding) {
  const {value, ...result} = binding;
  return result;
}

function normalizeSourceReference(value) {
  return value.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function pageTags(fragment) {
  const pages = [];
  const expression = /<Page\b([^>]*)>([^<]+)<\/Page>/gi;
  let match;
  while ((match = expression.exec(fragment)) !== null) {
    const title = /\bTitle\s*=\s*"([^"]*)"/i.exec(match[1])?.[1] ?? null;
    pages.push({path: normalizeSourceReference(match[2]), title});
  }
  return pages;
}

export function parseCourseXml(xml) {
  invariant(typeof xml === "string" && xml.length > 0, "course XML is empty");
  const comments = [...xml.matchAll(/<!--([\s\S]*?)-->/g)].map((match) => match[1]);
  const activeXml = xml.replace(/<!--[\s\S]*?-->/g, "");
  const activePages = pageTags(activeXml);
  const commentedPages = comments.flatMap(pageTags);
  const keytermsBody = /<Keyterms>([\s\S]*?)<\/Keyterms>/i.exec(activeXml)?.[1];
  invariant(keytermsBody, "course XML has no Keyterms declaration");
  const keytermXml = ["English", "Spanish"].map((language) => {
    const declaredPath = new RegExp(`<${language}>([^<]+)</${language}>`, "i").exec(keytermsBody)?.[1];
    invariant(declaredPath, `course XML has no ${language} keyterm path`);
    return {language: language.toLowerCase(), path: normalizeSourceReference(declaredPath)};
  });
  return {activePages, commentedPages, keytermXml};
}

export function extractActionScriptString(source, variableName) {
  invariant(/^[A-Za-z_][A-Za-z0-9_]*$/.test(variableName), "invalid ActionScript variable name");
  const match = new RegExp(`(?:^|\\n)${variableName}\\s*=\\s*"([^"]*)";`).exec(source);
  invariant(match, `ActionScript assignment ${variableName} was not found`);
  return match[1];
}

export function parseSectionDetails(serialized) {
  invariant(typeof serialized === "string" && serialized.length > 0, "section details are empty");
  const sections = [];
  for (const segment of serialized.split("[Details_Split]")) {
    const header = /^\[Section(\d+)Details\]~([A-Z]{2})(?:~(.*))?$/.exec(segment);
    if (!header) continue;
    const [, sectionNumber, section, body = ""] = header;
    const filenames = body.split("~").filter((value) => /\.swf$/i.test(value));
    sections.push({
      sectionNumber: Number(sectionNumber),
      section,
      paths: filenames.map((filename) => `${section}/${normalizeSourceReference(filename)}`),
    });
  }
  invariant(sections.length > 0, "no ActionScript section details were parsed");
  return sections;
}

function flattenSections(sections) {
  return sections.flatMap(({paths}) => paths);
}

function unique(values) {
  return [...new Set(values)];
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

function occurrenceLines(source, expression) {
  return source.split(/\r?\n/).flatMap((line, index) => expression.test(line) ? [index + 1] : []);
}

function pathQualifiedSwfReferences(source) {
  return unique([...source.matchAll(/\b([A-Z]{2}\/L\d+[A-Z]{2}\d{2}\.swf)\b/g)].map((match) => match[1])).sort();
}

function basenameCollisions(paths) {
  const grouped = new Map();
  for (const sourcePath of unique(paths)) {
    const basename = path.posix.basename(sourcePath);
    const entries = grouped.get(basename) ?? [];
    entries.push(sourcePath);
    grouped.set(basename, entries);
  }
  return [...grouped.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([basename, entries]) => ({basename, paths: entries.sort()}))
    .sort((left, right) => left.basename.localeCompare(right.basename));
}

function selectRelease(manifest, releaseId) {
  invariant(manifest?.schemaVersion === 1 && Array.isArray(manifest.releases), "release manifest is malformed");
  const matches = manifest.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, `expected exactly one release ${releaseId}, found ${matches.length}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: publication must remain atomic`);
  invariant(release.sourceLesson?.path && release.sourceLesson?.sha256, `${releaseId}: source lesson binding is missing`);
  invariant(release.members?.length === release.expectedCounts?.members, `${releaseId}: release membership is incomplete`);
  return release;
}

function selectProfile(catalog, releaseId) {
  invariant(catalog?.schemaVersion === 1 && Array.isArray(catalog.profiles), "source-gap profile catalog is malformed");
  const matches = catalog.profiles.filter((profile) => profile?.releaseId === releaseId);
  invariant(matches.length === 1, `expected exactly one source-gap profile for ${releaseId}, found ${matches.length}`);
  const profile = matches[0];
  invariant(profile.physicalSourceRoot && profile.mainScriptPath && profile.sourceScopeFreezePath, `${releaseId}: source-gap profile is incomplete`);
  return profile;
}

function findCatalogRecord(sourceCatalog, sourcePath, label) {
  invariant(sourceCatalog?.schemaVersion === 1 && Array.isArray(sourceCatalog.files), "source catalog is malformed");
  const matches = sourceCatalog.files.filter((entry) => entry.path === sourcePath);
  invariant(matches.length === 1, `${label}: expected one source catalog record for ${sourcePath}, found ${matches.length}`);
  return matches[0];
}

async function bindPreservedSource(profile, sourceCatalog, sourcePath, label, expectedSha256 = null) {
  const catalogRecord = findCatalogRecord(sourceCatalog, sourcePath, label);
  const relativePhysicalPath = `${profile.physicalSourceRoot}/${sourcePath}`;
  const physical = await fileBinding(relativePhysicalPath, label);
  invariant(physical.sha256 === catalogRecord.sha256 && physical.bytes === catalogRecord.bytes, `${label}: physical source drifted from catalog`);
  if (expectedSha256) invariant(physical.sha256 === expectedSha256, `${label}: physical source drifted from release binding`);
  return {archivePath: sourcePath, physicalPath: relativePhysicalPath, bytes: physical.bytes, sha256: physical.sha256};
}

async function missingPhysicalRecord(profile, sourceCatalog, declared) {
  const exactCatalogMatches = sourceCatalog.files.filter((entry) => entry.path === declared.path)
    .map(({path: sourcePath, bytes, sha256: digest}) => ({path: sourcePath, bytes, sha256: digest}));
  const basename = path.posix.basename(declared.path);
  const basenameCatalogMatches = sourceCatalog.files.filter((entry) => path.posix.basename(entry.path) === basename)
    .map(({path: sourcePath, bytes, sha256: digest}) => ({path: sourcePath, bytes, sha256: digest}));
  let physicalPresence = false;
  try {
    await lstat(resolveProjectPath(`${profile.physicalSourceRoot}/${declared.path}`, `${declared.language} keyterm XML`));
    physicalPresence = true;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {...declared, physicalPresence, exactCatalogMatches, basenameCatalogMatches};
}

function validateExpected(profile, derived) {
  const expected = profile.expected ?? {};
  for (const [field, actual] of Object.entries(derived)) {
    invariant(Number.isSafeInteger(expected[field]), `${profile.releaseId}: expected.${field} is missing`);
    invariant(expected[field] === actual, `${profile.releaseId}: ${field} drifted; expected ${expected[field]}, observed ${actual}`);
  }
}

export async function buildReport({
  releaseId,
  releaseManifestPath = defaults.releases,
  profilesPath = defaults.profiles,
  sourceFilesPath = defaults.sourceFiles,
} = {}) {
  invariant(/^[a-z0-9][a-z0-9-]{2,127}$/.test(releaseId || ""), "--release-id must be a lowercase portable identifier");
  const [releaseBinding, profilesBinding, sourceFilesBinding, generatorBinding] = await Promise.all([
    jsonBinding(releaseManifestPath, "release manifest"),
    jsonBinding(profilesPath, "source-gap profiles"),
    jsonBinding(sourceFilesPath, "source catalog"),
    fileBinding(portable(path.relative(projectRoot, scriptPath)), "generator"),
  ]);
  const release = selectRelease(releaseBinding.value, releaseId);
  const profile = selectProfile(profilesBinding.value, releaseId);
  const [scopeBinding, shellIndexBinding, courseXmlBinding, mainScriptBinding] = await Promise.all([
    jsonBinding(profile.sourceScopeFreezePath, "source-scope freeze"),
    fileBinding(profile.shellScriptIndexPath, "shell FFDec script index"),
    bindPreservedSource(profile, sourceFilesBinding.value, release.sourceLesson.path, "course XML", release.sourceLesson.sha256),
    bindPreservedSource(profile, sourceFilesBinding.value, profile.mainScriptPath, "MainScript_New.as"),
  ]);
  invariant(scopeBinding.value?.releaseId === releaseId, `${releaseId}: source-scope freeze belongs to another release`);
  const pageConflict = scopeBinding.value.conflicts?.find(({conflictId}) => conflictId === "active-course-xml-versus-legacy-main-script-page-set");
  const keytermConflict = scopeBinding.value.conflicts?.find(({conflictId}) => conflictId === "missing-lesson-keyterm-localization-xml");
  invariant(pageConflict?.strictBlocker === true && pageConflict?.status === "unresolved", `${releaseId}: page-set conflict is no longer fail-closed`);
  invariant(keytermConflict?.strictBlocker === true && keytermConflict?.status === "missing", `${releaseId}: keyterm conflict is no longer fail-closed`);

  const xmlText = (await readFile(resolveProjectPath(courseXmlBinding.physicalPath, "course XML"), "utf8"));
  const scriptText = (await readFile(resolveProjectPath(mainScriptBinding.physicalPath, "MainScript_New.as"), "utf8"));
  const shellIndexText = shellIndexBinding.value.toString("utf8");
  const parsedXml = parseCourseXml(xmlText);
  const lessonDetails = parseSectionDetails(extractActionScriptString(scriptText, "LessonDetails"));
  const randomAudioDetails = parseSectionDetails(extractActionScriptString(scriptText, "RandomAudioDetails"));
  const backgroundTextDetails = parseSectionDetails(extractActionScriptString(scriptText, "BGTextDetails"));
  const lessonDetailPaths = flattenSections(lessonDetails);
  const activePaths = parsedXml.activePages.map(({path: sourcePath}) => sourcePath);
  const commentedPaths = parsedXml.commentedPages.map(({path: sourcePath}) => sourcePath);
  const lessonPrefix = `${path.posix.dirname(release.sourceLesson.path)}/`;
  const releaseActivePaths = release.members
    .filter(({releaseRole}) => releaseRole === "active-xml-referenced-page")
    .map(({source}) => {
      invariant(source.path.startsWith(lessonPrefix), `${source.path}: active release member is outside the lesson source root`);
      return source.path.slice(lessonPrefix.length);
    });
  invariant(JSON.stringify(activePaths) === JSON.stringify(releaseActivePaths), `${releaseId}: release membership/order drifted from active XML`);

  const lessonDetailExtras = difference(lessonDetailPaths, activePaths);
  const activeMissingFromLessonDetails = difference(activePaths, lessonDetailPaths);
  const pathQualifiedReferences = pathQualifiedSwfReferences(scriptText);
  const missingKeyterms = await Promise.all(parsedXml.keytermXml.map((declared) => missingPhysicalRecord(profile, sourceFilesBinding.value, declared)));
  const missingKeytermCount = missingKeyterms.filter((entry) => !entry.physicalPresence && entry.exactCatalogMatches.length === 0).length;
  validateExpected(profile, {
    activeXmlPages: activePaths.length,
    mainScriptLessonDetailPages: lessonDetailPaths.length,
    commentedLegacyIntroductionPages: commentedPaths.length,
    mainScriptLessonDetailExtras: lessonDetailExtras.length,
    declaredKeytermXmlFiles: parsedXml.keytermXml.length,
    missingDeclaredKeytermXmlFiles: missingKeytermCount,
  });
  invariant(new Set(activePaths).size === activePaths.length, `${releaseId}: active XML contains duplicate page paths`);
  invariant(activeMissingFromLessonDetails.length === 0, `${releaseId}: MainScript LessonDetails lost active XML pages`);
  invariant(missingKeytermCount === parsedXml.keytermXml.length, `${releaseId}: a declared keyterm file now exists and requires reviewed re-disposition`);

  const collisions = basenameCollisions([...activePaths, ...commentedPaths]);
  const missingKeytermBasenames = missingKeyterms.map(({path: sourcePath}) => path.posix.basename(sourcePath));
  const missingKeytermLabel = missingKeytermBasenames.length === 1
    ? missingKeytermBasenames[0]
    : `${missingKeytermBasenames.slice(0, -1).join(", ")} and ${missingKeytermBasenames.at(-1)}`;
  return {
    schemaVersion: 1,
    reportType: "lesson-release-source-gap-forensics",
    releaseId,
    evidenceState: "static-source-forensics-only-runtime-and-content-gaps-fail-closed",
    authority: "This report reconciles preserved static sources. It cannot establish runtime reachability, recover missing content, change release scope, or grant implementation or acceptance authority.",
    generator: withoutValue(generatorBinding),
    inputs: {
      releaseManifest: withoutValue(releaseBinding),
      sourceGapProfiles: withoutValue(profilesBinding),
      sourceCatalog: withoutValue(sourceFilesBinding),
      sourceScopeFreeze: withoutValue(scopeBinding),
      courseXml: courseXmlBinding,
      mainScript: mainScriptBinding,
      shellFfdecScriptIndex: withoutValue(shellIndexBinding),
    },
    frozenRelease: {
      publicationMode: release.publicationMode,
      expectedMembers: release.expectedCounts.members,
      activeXmlMembers: releaseActivePaths.length,
      shellMembers: release.members.filter(({releaseRole}) => releaseRole === "course-shell").length,
      membershipChangedByThisReport: false,
    },
    courseXml: {
      activePageCount: activePaths.length,
      activePages: parsedXml.activePages.map((page, index) => ({ordinal: index + 1, ...page})),
      commentedLegacyPageCount: commentedPaths.length,
      commentedLegacyPages: parsedXml.commentedPages,
      declaredKeytermXml: parsedXml.keytermXml,
    },
    mainScript: {
      lessonDetails: {pageCount: lessonDetailPaths.length, sections: lessonDetails},
      randomAudioDetails: {pageCount: flattenSections(randomAudioDetails).length, sections: randomAudioDetails},
      backgroundTextDetails: {pageCount: flattenSections(backgroundTextDetails).length, sections: backgroundTextDetails},
      pathQualifiedSwfReferences,
      glossaryUiReferenceLines: occurrenceLines(scriptText, /glossary/i),
    },
    reconciliation: {
      releaseOrderExactlyMatchesActiveXml: true,
      lessonDetailsVsActiveXml: {
        status: "static-difference-confirmed-runtime-reachability-unresolved",
        extraCount: lessonDetailExtras.length,
        extras: lessonDetailExtras,
        missingCount: activeMissingFromLessonDetails.length,
        missing: activeMissingFromLessonDetails,
      },
      commentedLegacyPages: {
        paths: commentedPaths,
        presentInLessonDetails: commentedPaths.filter((sourcePath) => lessonDetailPaths.includes(sourcePath)),
        absentFromLessonDetails: commentedPaths.filter((sourcePath) => !lessonDetailPaths.includes(sourcePath)),
        pathQualifiedMainScriptReferences: commentedPaths.filter((sourcePath) => pathQualifiedReferences.includes(sourcePath)),
      },
      basenameCollisions: collisions,
      requiredDisposition: "Use authorized original-shell natural navigation to determine student reachability. Any scope change requires a reviewed new release-manifest version; never silently mutate this release.",
    },
    keytermGap: {
      status: "declared-dependencies-missing-from-current-preserved-source-catalog-and-physical-source-root",
      declarations: missingKeyterms,
      staticHostSignals: {
        mainScriptGlossaryReferenceLines: occurrenceLines(scriptText, /glossary/i),
        shellScriptIndexKeytermsReferenceLines: occurrenceLines(shellIndexText, /keyterms/i),
        interpretation: "UI/script symbols show a potential host dependency only; they do not prove successful file loading, runtime reachability, language content, or an acceptable substitute.",
      },
      requiredDisposition: "Recover and hash-bind both declared XML files, or record a validator-supported reviewed exception without inventing English or Spanish keyterm content.",
    },
    blockers: [
      "Authorized original-shell natural navigation has not established whether legacy introduction pages are student-reachable.",
      `${missingKeytermLabel} are absent from the current source catalog and physical preserved source root; their content must not be invented.`,
      "Static ActionScript and FFDec symbol references cannot replace original-runtime behavior, network/file-load observation, bilingual review, or Owner disposition.",
    ],
    acceptanceEffects: {
      sourceGapClosed: false,
      releaseScopeChanged: false,
      implementationAuthorized: false,
      authoritativeOriginalRuntime: false,
      strictComplete: false,
      published: false,
    },
  };
}

export function renderMarkdown(report) {
  const extraRows = report.reconciliation.lessonDetailsVsActiveXml.extras.map((value) => `- \`${value}\``).join("\n");
  const commentedRows = report.reconciliation.commentedLegacyPages.paths.map((value) => {
    const inDetails = report.reconciliation.commentedLegacyPages.presentInLessonDetails.includes(value) ? "yes" : "no";
    const pathRef = report.reconciliation.commentedLegacyPages.pathQualifiedMainScriptReferences.includes(value) ? "yes" : "no";
    return `| \`${value}\` | ${inDetails} | ${pathRef} |`;
  }).join("\n");
  const keytermRows = report.keytermGap.declarations.map((entry) =>
    `| ${entry.language} | \`${entry.path}\` | ${entry.physicalPresence ? "present" : "missing"} | ${entry.exactCatalogMatches.length} | ${entry.basenameCatalogMatches.length} |`,
  ).join("\n");
  return `# ${report.releaseId} source-gap forensics\n\n` +
    `> ${report.authority}\n\n` +
    `## Page-set reconciliation\n\n` +
    `- Active XML pages: **${report.courseXml.activePageCount}**; frozen release order matches exactly.\n` +
    `- \`MainScript_New.as\` \`LessonDetails\` pages: **${report.mainScript.lessonDetails.pageCount}**.\n` +
    `- Extra in \`LessonDetails\`: **${report.reconciliation.lessonDetailsVsActiveXml.extraCount}**; missing from \`LessonDetails\`: **${report.reconciliation.lessonDetailsVsActiveXml.missingCount}**.\n` +
    `- Commented legacy XML pages: **${report.courseXml.commentedLegacyPageCount}**.\n\n` +
    `Extras are static source differences, not proof of student reachability:\n\n${extraRows}\n\n` +
    `| Commented XML path | In LessonDetails | Path-qualified AS reference |\n|---|---|---|\n${commentedRows}\n\n` +
    `${report.reconciliation.requiredDisposition}\n\n` +
    `## Missing keyterm XML\n\n` +
    `| Language | Declared path | Physical | Exact catalog matches | Basename matches |\n|---|---|---|---:|---:|\n${keytermRows}\n\n` +
    `MainScript glossary signal lines: ${report.keytermGap.staticHostSignals.mainScriptGlossaryReferenceLines.join(", ") || "none"}; shell FFDec keyterms signal lines: ${report.keytermGap.staticHostSignals.shellScriptIndexKeytermsReferenceLines.join(", ") || "none"}. These are dependency signals only.\n\n` +
    `## Blockers\n\n${report.blockers.map((blocker) => `- ${blocker}`).join("\n")}\n\n` +
    `No release member, source, migration acceptance field, protected ledger, route, or publication state was changed. Strict remains **0/${report.frozenRelease.expectedMembers}** and published remains **false**.\n`;
}

function outputPaths(prefix) {
  invariant(typeof prefix === "string" && prefix.startsWith("reports/"), "--output-prefix must stay below reports/");
  invariant(!prefix.endsWith(".json") && !prefix.endsWith(".md"), "--output-prefix must omit an extension");
  const absolutePrefix = resolveProjectPath(prefix, "output prefix");
  return {json: `${absolutePrefix}.json`, markdown: `${absolutePrefix}.md`};
}

async function assertSafeOutput(file) {
  try {
    const metadata = await lstat(file);
    invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${portable(path.relative(projectRoot, file))}: output must be an ordinary file`);
    invariant(metadata.nlink === 1, `${portable(path.relative(projectRoot, file))}: output must not be hard-linked`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function atomicWrite(file, bytes) {
  await assertSafeOutput(file);
  await mkdir(path.dirname(file), {recursive: true});
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function writeOrCheck({report, outputPrefix, check}) {
  const outputs = outputPaths(outputPrefix);
  const expectedJson = stableJson(report);
  const expectedMarkdown = renderMarkdown(report);
  if (check) {
    const [actualJson, actualMarkdown] = await Promise.all([readFile(outputs.json, "utf8"), readFile(outputs.markdown, "utf8")]);
    invariant(actualJson === expectedJson, `${portable(path.relative(projectRoot, outputs.json))} is stale`);
    invariant(actualMarkdown === expectedMarkdown, `${portable(path.relative(projectRoot, outputs.markdown))} is stale`);
    return "checked";
  }
  await Promise.all([atomicWrite(outputs.json, expectedJson), atomicWrite(outputs.markdown, expectedMarkdown)]);
  return "written";
}

export function parseArguments(argv) {
  const options = {...defaults, releaseId: null, outputPrefix: null, check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const value = argv[index + 1];
    invariant(value && !value.startsWith("--"), `${argument} requires a value`);
    if (argument === "--release-id") options.releaseId = value;
    else if (argument === "--releases") options.releases = value;
    else if (argument === "--profiles") options.profiles = value;
    else if (argument === "--source-files") options.sourceFiles = value;
    else if (argument === "--output-prefix") options.outputPrefix = value;
    else throw new Error(`unknown option: ${argument}`);
    index += 1;
  }
  if (options.help) {
    return {
      releaseId: options.releaseId,
      releaseManifestPath: options.releases,
      profilesPath: options.profiles,
      sourceFilesPath: options.sourceFiles,
      outputPrefix: options.outputPrefix,
      check: options.check,
      help: true,
    };
  }
  invariant(options.releaseId, "--release-id is required");
  invariant(options.outputPrefix, "--output-prefix is required");
  outputPaths(options.outputPrefix);
  return {
    releaseId: options.releaseId,
    releaseManifestPath: options.releases,
    profilesPath: options.profiles,
    sourceFilesPath: options.sourceFiles,
    outputPrefix: options.outputPrefix,
    check: options.check,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-lesson-source-gap-forensics.mjs --release-id <id> --output-prefix <reports/prefix> [--releases <file>] [--profiles <file>] [--source-files <file>] [--check]\n");
    return;
  }
  const report = await buildReport(options);
  const status = await writeOrCheck({report, outputPrefix: options.outputPrefix, check: options.check});
  process.stdout.write(`${status === "checked" ? "PASS" : "WROTE"}: ${report.courseXml.activePageCount} active XML pages; ${report.reconciliation.lessonDetailsVsActiveXml.extraCount} static LessonDetails extras; ${report.keytermGap.declarations.length} missing keyterm declarations; 0 acceptance authority\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
