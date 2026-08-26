#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_ARCHIVE = path.join(PROJECT_ROOT, "source-assets/flash/HELP MATH_ORIGINAL FILES");
const REPORT_RELATIVE = "reports/g4-l10-vb003-host-entry-antecedent.json";
const TREE_BASE_RELATIVE = "work/original-runtime-host-trees/g4-l10-vb003-ruffle-antecedent";
const DIAGNOSTIC_RELATIVE =
  "output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic/diagnostic.json";
const DIAGNOSTIC_SHA256 =
  "79f0a9f4ba9c7e019ac699e75cf395da7cf1ef1ec964531ee745bf49b480b0a7";
const PRE_SUCCESSOR_ANTECEDENT_SHA256 =
  "d7b2590d809704b6ea760f99001206b3400b724ca3882355c04c3cbd9ff7a715";
const PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE =
  `output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic/static-antecedent-${PRE_SUCCESSOR_ANTECEDENT_SHA256}.json`;

const SOURCE_RESOURCES = Object.freeze([
  {role: "lesson-shell", path: "HELP_COURSES/ELMGR4/L10/index_local.swf", bytes: 288233, sha256: "050d4181f8d679e6232871371b70aeaa02dbecb4c7e16cfbc732437307cf6072", runtime: true},
  {role: "lesson-xml", path: "HELP_COURSES/ELMGR4/L10/index.xml", bytes: 10209, sha256: "652b236f1ad46077e75accc6fe7acb091cbd0bd24b8d99fa0b1f5ffeb1a379e9", runtime: true},
  {role: "natural-entry-00-initial-ir", path: "HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf", bytes: 58342, sha256: "06c69a007c8c9cd2d5b6a928a9a67e34774b4f0cfec7892bfc7c709a91bf1e03", runtime: true},
  {role: "natural-entry-01-rw02", path: "HELP_COURSES/ELMGR4/L10/RW/L10RW02.swf", bytes: 1865169, sha256: "45b14745c04d452c71c7c7f9c99c26300a293d8d14f66afcd29a9ff590a01059", runtime: true},
  {role: "natural-entry-02-rw03", path: "HELP_COURSES/ELMGR4/L10/RW/L10RW03.swf", bytes: 1189742, sha256: "1e6a62a11fddd08c083d2a4556ff95f4fbb0e2447f442b7bdb264998dedba81e", runtime: true},
  {role: "natural-entry-03-rw04", path: "HELP_COURSES/ELMGR4/L10/RW/L10RW04.swf", bytes: 481721, sha256: "8f0fe3a78ad9757b4388e0fd1f79e5e275914e5377d5e7be184ffa1779b63f95", runtime: true},
  {role: "natural-entry-04-rw05", path: "HELP_COURSES/ELMGR4/L10/RW/L10RW05.swf", bytes: 1118195, sha256: "d613b174aa73cb79e672079b658e17ff88b7b0da257e82eb644cfe8725834b40", runtime: true},
  {role: "natural-entry-05-shell-only-vb01", path: "HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf", bytes: 58345, sha256: "3909cbf09c6bace7400687680e082007f8bc695bd16a279674a95bd266c109ec", runtime: true},
  {role: "natural-entry-06-vb02", path: "HELP_COURSES/ELMGR4/L10/VB/L10VB02.swf", bytes: 110715, sha256: "a46fa315148118d58a379a2d7b921684f5a0a210c72cae9433550e755ae42a81", runtime: true},
  {role: "natural-entry-07-target-vb003", path: "HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf", bytes: 97444, sha256: "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d", runtime: true},
  {role: "target-spanish-host-user-audio", path: "HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3", bytes: 212016, sha256: "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03", runtime: true},
  {role: "target-paired-authoring-source", path: "HELP_COURSES/ELMGR4/L10/VB/L10VB03.fla", bytes: 767488, sha256: "1eccb733544de8eb0fa718cac6a1792e2e58145c737f6170e56268fc212003f7", runtime: false},
]);

const ARTIFACT_BINDINGS = Object.freeze([
  {role: "canonical-source-freeze", path: "catalog/source-freeze.json", bytes: 435, sha256: "a03a5bb4e2a0672509fa2c2b9ac9b238b697cce043ccd4c2506e8301f780b6da"},
  {role: "canonical-source-manifest", path: "catalog/source-manifest.sha256", bytes: 958064, sha256: "f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318"},
  {role: "atomic-lesson-release-catalog", path: "catalog/lesson-releases.json", bytes: 115651, sha256: "d518f812a19b6038e55bca337b7a4f4f96425dd5599f9d07c9f69c8a0a1ae1cf"},
  {role: "shell-scenario-inventory", path: "migrations/shell-course-g04-l10-index-local/audit/scenario-inventory.json", bytes: 5964702, sha256: "28dd4e2151eb2441797fa22a9a552f078800a7642a5d254716dacf325c56d7d2"},
  {role: "shell-machine-report", path: "migrations/shell-course-g04-l10-index-local/audit/machine/report.json", bytes: 97637, sha256: "54bad1012635af81672ff267986d425841ab3781d18181525ed623ea05088025"},
  {role: "shell-ffdec-scripts-gzip", path: "migrations/shell-course-g04-l10-index-local/audit/machine/ffdec-scripts.txt.gz", bytes: 25028, sha256: "a2578f54460dc61088c170be1f7bb591bda10654d1a0f53b2360665ff7cf9969", uncompressedSha256: "1bb411fb194d87c163f6f1777f8701219f30f3d58db1b39c4add2e6ed76f9f90"},
  {role: "shell-swfmill-xml-gzip", path: "migrations/shell-course-g04-l10-index-local/audit/machine/swfmill.xml.gz", bytes: 506174, sha256: "ff6c19505c04eb590b4b9e26d0767559759eb31e084adfaac22c6bedfd810b12", uncompressedSha256: "1c224cd68c73b8f3a1037b229dfb250380982e4c4f11fe2b11940855426f08cf"},
  {role: "target-scenario-inventory", path: "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json", bytes: 134836, sha256: "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a"},
  {role: "target-machine-report", path: "migrations/course-g04-l10-vb-003/audit/machine/report.json", bytes: 12311, sha256: "e49170e6c4590eea8fa71a9d72a24c8cc7aef99395154d0a36ca2c073dbce2a5"},
  {role: "target-ffdec-scripts-gzip", path: "migrations/course-g04-l10-vb-003/audit/machine/ffdec-scripts.txt.gz", bytes: 302, sha256: "12914750cdf35938ba3fb0daa07126fc8face1d932f3f3b6aa57e4e9afaf0ec6", uncompressedSha256: "76dbf37cf16ed35d1b1b3a1dcf520762234989721194eff761924c390a3c8ddf"},
  {role: "target-swfmill-xml-gzip", path: "migrations/course-g04-l10-vb-003/audit/machine/swfmill.xml.gz", bytes: 116083, sha256: "948ad43c618fedf99c23e4bc082ec0fb1d4faf5fef1274867477729854846fa3", uncompressedSha256: "987c44b6fcd9c4f02cea593f3dd8d77e542ef66a41cc1b32f7ae66162162609c"},
  {role: "target-audio-runtime-evidence", path: "migrations/course-g04-l10-vb-003/audit/audio-runtime-evidence.json", bytes: 10286, sha256: "dbcc0fdf0a53c37350639bb6212a8be6daa0f81c795eb3a093f2b67d49d05898"},
  {role: "target-audio-inventory", path: "migrations/course-g04-l10-vb-003/audio-inventory.csv", bytes: 1327, sha256: "50492491fd02782775e92544f3f0a73f23b2d3aab02aadf46de042df7a900335"},
  {role: "target-root-trace-en", path: "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-default-root-en.json", bytes: 18110, sha256: "7595b0c09079743993a1adfb1ca9a1af1cda663ce43482630362679fe4f5057e"},
  {role: "target-root-trace-es", path: "migrations/course-g04-l10-vb-003/audit/trace-specs/lesson-releases/lesson-g04-l10-perimeter-area/req-default-root-es.json", bytes: 18110, sha256: "be746206689c25275dd33af219859e240dd98a3fbbb5382dc0a9eb58c41ec76b"},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 VB003 host-entry antecedent: ${message}`);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(filePath) {
  return path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");
}

async function preserveProbeBoundAntecedent({check}) {
  const reportPath = path.join(PROJECT_ROOT, REPORT_RELATIVE);
  const archivePath = path.join(
    PROJECT_ROOT,
    PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE,
  );
  const diagnosticPath = path.join(PROJECT_ROOT, DIAGNOSTIC_RELATIVE);
  const diagnosticBytes = await readFile(diagnosticPath);
  invariant(
    sha256(diagnosticBytes) === DIAGNOSTIC_SHA256,
    `${DIAGNOSTIC_RELATIVE} changed after the contained probe`,
  );
  if (!existsSync(archivePath)) {
    invariant(
      !check,
      `${PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE} is missing`,
    );
    const reportInfo = await lstat(reportPath);
    invariant(
      reportInfo.isFile() && !reportInfo.isSymbolicLink(),
      `${REPORT_RELATIVE} is not one regular pre-successor report`,
    );
    const reportBytes = await readFile(reportPath);
    invariant(
      sha256(reportBytes) === PRE_SUCCESSOR_ANTECEDENT_SHA256,
      `${REPORT_RELATIVE} cannot be archived because its probe-bound bytes drifted`,
    );
    await mkdir(path.dirname(archivePath), {recursive: true});
    await writeFile(archivePath, reportBytes, {flag: "wx", mode: 0o444});
    await chmod(archivePath, 0o444);
  }
  const archiveInfo = await lstat(archivePath);
  invariant(
    archiveInfo.isFile() && !archiveInfo.isSymbolicLink(),
    `${PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE} is not one regular file`,
  );
  const archiveBytes = await readFile(archivePath);
  invariant(
    sha256(archiveBytes) === PRE_SUCCESSOR_ANTECEDENT_SHA256,
    `${PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE} no longer preserves the probe-bound antecedent`,
  );
  return {
    diagnostic: {
      path: DIAGNOSTIC_RELATIVE,
      bytes: diagnosticBytes.length,
      sha256: DIAGNOSTIC_SHA256,
    },
    probeBoundAntecedent: {
      originalPathAtProbeTime: REPORT_RELATIVE,
      archivePath: PRE_SUCCESSOR_ANTECEDENT_ARCHIVE_RELATIVE,
      bytes: archiveBytes.length,
      sha256: PRE_SUCCESSOR_ANTECEDENT_SHA256,
      mode: "0444",
    },
  };
}

async function bindExactFile(root, expected) {
  const absolute = path.join(root, expected.path);
  const infoBefore = await lstat(absolute);
  invariant(infoBefore.isFile() && !infoBefore.isSymbolicLink(), `${expected.path} is not one regular file`);
  const bytes = await readFile(absolute);
  const infoAfter = await lstat(absolute);
  invariant(infoAfter.dev === infoBefore.dev && infoAfter.ino === infoBefore.ino && infoAfter.size === infoBefore.size && infoAfter.mtimeMs === infoBefore.mtimeMs, `${expected.path} changed while read`);
  invariant(bytes.length === expected.bytes, `${expected.path} byte drift: ${bytes.length}`);
  invariant(sha256(bytes) === expected.sha256, `${expected.path} hash drift`);
  if (expected.uncompressedSha256) {
    invariant(sha256(gunzipSync(bytes)) === expected.uncompressedSha256, `${expected.path} uncompressed hash drift`);
  }
  return {...expected, contents: bytes};
}

export function parseScriptBundle(text) {
  const lines = text.split(/\r?\n/u);
  const records = new Map();
  let current = null;
  for (let index = 0; index < lines.length; index += 1) {
    const marker = /^===== (.+) =====$/u.exec(lines[index]);
    if (marker) {
      current = {script: marker[1], markerLine: index + 1, lines: []};
      invariant(!records.has(current.script), `duplicate FFDec script record ${current.script}`);
      records.set(current.script, current);
    } else if (current) {
      current.lines.push({line: index + 1, text: lines[index]});
    }
  }
  invariant(records.size > 0, "FFDec script bundle has no records");
  return {lines, records};
}

function findExactLine(bundle, script, exactText) {
  const record = bundle.records.get(script);
  invariant(record, `missing FFDec script ${script}`);
  const matches = record.lines.filter((entry) => entry.text === exactText);
  invariant(matches.length === 1, `${script}: expected one exact line for ${exactText}, observed ${matches.length}`);
  return {artifactId: "shell-ffdec-scripts", script, line: matches[0].line, sourceLine: exactText};
}

function findContainingLine(bundle, script, token) {
  const record = bundle.records.get(script);
  invariant(record, `missing FFDec script ${script}`);
  const matches = record.lines.filter((entry) => entry.text.includes(token));
  invariant(matches.length === 1, `${script}: expected one line containing ${token}, observed ${matches.length}`);
  return {artifactId: "shell-ffdec-scripts", script, line: matches[0].line, sourceLine: matches[0].text};
}

export function parseLessonDetails(frame35Text) {
  const match = /LessonDetails = "([^"]+)";/u.exec(frame35Text);
  invariant(match, "frame 35 has no literal LessonDetails assignment");
  const sections = match[1].split("[Details_Split]").slice(1).map((section) => {
    const fields = section.split("~");
    invariant(/^\[Section\d+Details\]$/u.test(fields[0]), `invalid LessonDetails section marker ${fields[0]}`);
    invariant(/^[A-Z]{2}$/u.test(fields[1]), `invalid LessonDetails section name ${fields[1]}`);
    return {marker: fields[0], section: fields[1], files: fields.slice(2)};
  });
  invariant(sections.length === 8, `expected 8 LessonDetails sections, observed ${sections.length}`);
  return sections;
}

export function deriveNaturalPrefix(sections, targetPath, activeXmlPaths) {
  const playlist = sections.flatMap((section) => section.files.map((file) => `${section.section}/${file}`));
  const targetIndex = playlist.indexOf(targetPath);
  invariant(targetIndex >= 0, `target ${targetPath} is absent from LessonDetails`);
  return playlist.slice(0, targetIndex + 1).map((sourcePath, index) => ({
    order: index + 1,
    nextPressCount: index,
    sourcePath,
    entryKind: index === 0 ? "shell-default-initial-load" : "DefineButton2_339-release-doPlayNextMovie",
    activeCourseXmlPage: activeXmlPaths.includes(sourcePath),
    target: sourcePath === targetPath,
  }));
}

function countBy(values, selector) {
  const counts = {};
  for (const value of values) counts[selector(value)] = (counts[selector(value)] || 0) + 1;
  return counts;
}

function runtimeTreeId(resources) {
  return sha256(Buffer.from(stableJson(resources.map(({role, path: resourcePath, bytes, sha256: digest}) => ({role, path: resourcePath, bytes, sha256: digest})))));
}

async function chmodDirectoriesReadOnly(root) {
  const directories = [];
  async function visit(directory) {
    directories.push(directory);
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.isDirectory()) await visit(path.join(directory, entry.name));
    }
  }
  await visit(root);
  for (const directory of directories.reverse()) await chmod(directory, 0o555);
}

async function verifyRuntimeTree(root, runtimeResources) {
  const rootReal = await realpath(root);
  const observed = [];
  for (const expected of runtimeResources) {
    const target = path.join(root, expected.path);
    const targetReal = await realpath(target);
    invariant(targetReal.startsWith(`${rootReal}${path.sep}`), `${expected.path} escapes runtime root`);
    const info = await lstat(target);
    invariant(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, `${expected.path} runtime copy is not one ordinary file`);
    invariant((info.mode & 0o777) === 0o444, `${expected.path} runtime copy mode is not 0444`);
    const bytes = await readFile(target);
    invariant(bytes.length === expected.bytes && sha256(bytes) === expected.sha256, `${expected.path} runtime copy drift`);
    observed.push({role: expected.role, path: expected.path, bytes: bytes.length, sha256: sha256(bytes), mode: "0444"});
  }
  return observed;
}

async function materializeRuntimeTree(runtimeResources, treeId, {check}) {
  const treeBase = path.join(PROJECT_ROOT, TREE_BASE_RELATIVE);
  const treeDirectory = path.join(treeBase, treeId);
  const root = path.join(treeDirectory, "root");
  if (!existsSync(root)) {
    invariant(!check, `runtime tree missing in --check mode: ${portable(root)}`);
    await mkdir(treeBase, {recursive: true});
    const staging = await mkdtemp(path.join(treeBase, ".staging-"));
    const stagingRoot = path.join(staging, "root");
    await mkdir(stagingRoot, {recursive: true});
    for (const resource of runtimeResources) {
      const target = path.join(stagingRoot, resource.path);
      await mkdir(path.dirname(target), {recursive: true});
      await copyFile(path.join(SOURCE_ARCHIVE, resource.path), target);
      await chmod(target, 0o444);
    }
    await chmodDirectoriesReadOnly(stagingRoot);
    await chmod(staging, 0o555);
    await rename(staging, treeDirectory);
  }
  const files = await verifyRuntimeTree(root, runtimeResources);
  return {treeId, path: portable(root), directoryMode: "0555", fileMode: "0444", regularCopiedFilesOnly: true, symbolicLinks: 0, hardLinks: 0, files};
}

function validateTraceSpec(spec, language) {
  invariant(spec.animationId === "course-g04-l10-vb-003", `${language} trace animation drift`);
  invariant(spec.requirementId === `req-default-root-${language}`, `${language} trace requirement drift`);
  invariant(spec.traceSpecStatus === "source-frame-accurate-root-ready-for-authoritative-capture", `${language} trace status drift`);
  invariant(spec.identity?.language === language && spec.identity?.frameDomainId === "root", `${language} trace identity drift`);
  invariant(spec.traceModel?.naturalPlaybackClaimed === false, `${language} trace improperly claims natural playback`);
  invariant(spec.schedule?.status === "not-required-frame-accurate-root" && spec.schedule?.orderedSteps?.length === 0, `${language} trace schedule drift`);
}

export async function buildAntecedentReport({
  check = false,
  diagnosticContinuity = null,
} = {}) {
  if (diagnosticContinuity === null) {
    diagnosticContinuity = await preserveProbeBoundAntecedent({check});
  }
  const sourceBindings = [];
  for (const resource of SOURCE_RESOURCES) sourceBindings.push(await bindExactFile(SOURCE_ARCHIVE, resource));
  const artifactBindings = [];
  for (const artifact of ARTIFACT_BINDINGS) artifactBindings.push(await bindExactFile(PROJECT_ROOT, artifact));

  const artifact = (role) => artifactBindings.find((entry) => entry.role === role);
  const shellInventory = JSON.parse(artifact("shell-scenario-inventory").contents);
  const targetInventory = JSON.parse(artifact("target-scenario-inventory").contents);
  const releaseCatalog = JSON.parse(artifact("atomic-lesson-release-catalog").contents);
  const audioEvidence = JSON.parse(artifact("target-audio-runtime-evidence").contents);
  const traceEn = JSON.parse(artifact("target-root-trace-en").contents);
  const traceEs = JSON.parse(artifact("target-root-trace-es").contents);
  validateTraceSpec(traceEn, "en");
  validateTraceSpec(traceEs, "es");

  invariant(shellInventory.animationId === "shell-course-g04-l10-index-local", "shell inventory identity drift");
  invariant(shellInventory.inventoryStatus === "static-exhaustive-runtime-unverified", "shell inventory status drift");
  invariant(shellInventory.source?.swfSha256 === SOURCE_RESOURCES[0].sha256, "shell inventory source drift");
  invariant(targetInventory.animationId === "course-g04-l10-vb-003", "target inventory identity drift");
  invariant(targetInventory.inventoryStatus === "static-exhaustive-runtime-unverified", "target inventory status drift");
  invariant(targetInventory.source?.swfSha256 === SOURCE_RESOURCES[9].sha256 && targetInventory.source?.flaSha256 === SOURCE_RESOURCES[11].sha256, "target SWF/FLA inventory drift");

  const release = releaseCatalog.releases.find((entry) => entry.releaseId === "lesson-g04-l10-perimeter-area");
  invariant(release && release.members.length === 47, "lesson release identity/member count drift");
  const targetMember = release.members.find((entry) => entry.animationId === "course-g04-l10-vb-003");
  invariant(targetMember?.ordinal === 7 && targetMember?.source?.sha256 === SOURCE_RESOURCES[9].sha256, "target release membership drift");

  const shellScriptsText = gunzipSync(artifact("shell-ffdec-scripts-gzip").contents).toString("utf8");
  const targetScriptsText = gunzipSync(artifact("target-ffdec-scripts-gzip").contents).toString("utf8");
  const shellSwfmillText = gunzipSync(artifact("shell-swfmill-xml-gzip").contents).toString("utf8");
  const shellBundle = parseScriptBundle(shellScriptsText);
  const targetBundle = parseScriptBundle(targetScriptsText);
  const frame35Record = shellBundle.records.get("frame_35/DoAction.as");
  invariant(frame35Record, "shell frame 35 script missing");
  const sections = parseLessonDetails(frame35Record.lines.map((entry) => entry.text).join("\n"));
  const activeXmlPaths = shellInventory.courseXml.sections.flatMap((section) => section.pages.map((page) => page.path));
  invariant(activeXmlPaths.length === 46 && new Set(activeXmlPaths).size === 46, "active XML page set drift");
  const rawXml = sourceBindings.find((entry) => entry.role === "lesson-xml").contents.toString("utf8");
  const rawXmlWithoutComments = rawXml.replace(/<!--[\s\S]*?-->/gu, "");
  const rawXmlPages = [...rawXmlWithoutComments.matchAll(/<Page\b[^>]*>([^<]+)<\/Page>/gu)].map((match) => match[1].trim());
  invariant(JSON.stringify(rawXmlPages) === JSON.stringify(activeXmlPaths), "raw index.xml pages no longer match scenario inventory");
  invariant(shellInventory.courseXml.bareAmpersandRepairs === 2, "index.xml ampersand-repair count drift");

  const embeddedPaths = sections.flatMap((section) => section.files.map((file) => `${section.section}/${file}`));
  invariant(embeddedPaths.length === 51 && new Set(embeddedPaths).size === 51, "embedded shell playlist drift");
  const hostOnlyPaths = embeddedPaths.filter((entry) => !activeXmlPaths.includes(entry));
  const xmlOnlyPaths = activeXmlPaths.filter((entry) => !embeddedPaths.includes(entry));
  invariant(JSON.stringify(hostOnlyPaths) === JSON.stringify(["VB/L10VB01.swf", "IN/L10IN01.swf", "TI/L10TI01.swf", "GS/L10GS01.swf", "TS/L10TS01.swf"]), "shell-only host entries drift");
  invariant(xmlOnlyPaths.length === 0, "active XML contains a page absent from LessonDetails");

  const naturalPrefix = deriveNaturalPrefix(sections, "VB/L10VB03.swf", activeXmlPaths);
  invariant(naturalPrefix.length === 8 && naturalPrefix.at(-1).nextPressCount === 7, "VB003 natural prefix drift");
  const expectedPrefix = SOURCE_RESOURCES.slice(2, 10).map((entry) => entry.path.replace("HELP_COURSES/ELMGR4/L10/", ""));
  invariant(JSON.stringify(naturalPrefix.map((entry) => entry.sourcePath)) === JSON.stringify(expectedPrefix), "runtime resource order does not match host playlist prefix");
  invariant(/<DefineShape3 objectID="335">[\s\S]{0,200}<Rectangle left="-550" right="550" top="-550" bottom="550"\/>/u.test(shellSwfmillText), "Next hit-area shape drift");
  invariant(/<PlaceObject2 replace="0" depth="1" objectID="339" name="Next">[\s\S]{0,200}<Transform scaleX="0\.7999877929687500" scaleY="0\.7999877929687500" transX="0" transY="0"\/>/u.test(shellSwfmillText), "Next button nested placement drift");
  invariant(/<PlaceObject2 replace="0" depth="259" objectID="340"[^>]*name="next_mc">[\s\S]{0,160}<Transform transX="15361" transY="11160"\/>/u.test(shellSwfmillText), "Next host placement drift");

  const sideEffects = shellInventory.dependencies.safeSideEffectPolicy;
  invariant(sideEffects.length === 37, `expected 37 shell side-effect records, observed ${sideEffects.length}`);
  const exactSideEffects = sideEffects.map((entry) => {
    const observed = shellBundle.lines[entry.evidence.line - 1]?.trim();
    invariant(observed === entry.sourceLine, `${entry.evidence.script}:${entry.evidence.line} side-effect source-line drift`);
    const record = shellBundle.records.get(entry.evidence.script);
    invariant(record?.lines.some((line) => line.line === entry.evidence.line && line.text.trim() === entry.sourceLine), `${entry.evidence.script}:${entry.evidence.line} side-effect record boundary drift`);
    return {api: entry.api, kind: entry.kind, safeFixtureMode: entry.safeFixtureMode, sourceLine: entry.sourceLine, evidence: entry.evidence, scriptId: entry.scriptId};
  });

  const staticEvidence = {
    shellUrlBaseDerivation: [
      findExactLine(shellBundle, "frame_35/DoAction.as", "tempURL = _root._url;"),
      findExactLine(shellBundle, "frame_35/DoAction.as", "_global.tempURL = splTempURL[0].substring(0,splTempURL[0].length - 1);"),
    ],
    playlist: findContainingLine(shellBundle, "frame_35/DoAction.as", "LessonDetails = \"[CourseDetails]"),
    defaultEntry: [
      findExactLine(shellBundle, "frame_49/DoAction.as", "   _global.sectionNumber = 1;"),
      findExactLine(shellBundle, "frame_49/DoAction.as", "   _global.slideNumber = 2;"),
      findExactLine(shellBundle, "frame_49/DoAction.as", "   _global.playSwfFileName = _global.tempURL + \"/IR/\" + _global.arrSection1_Details[_global.slideNumber];"),
    ],
    shellLoad: findExactLine(shellBundle, "frame_35/DoAction.as", "   _loc2_.animation_mc.loadMovie(_loc1_.playSwfFileName,1);"),
    nextControl: findExactLine(shellBundle, "DefineButton2_339/BUTTONCONDACTION on(release).as", "   _root.doPlayNextMovie();"),
    nextFunction: findExactLine(shellBundle, "frame_35/DoAction.as", "function doPlayNextMovie()"),
    targetPreloaderSignal: findExactLine(targetBundle, "frame_1/DoAction.as", "_level0.InternalPreloader.gotoAndPlay(\"jump_check\");"),
    targetRootStop: findExactLine(targetBundle, "frame_1/DoAction.as", "stop();"),
    hostPreloaderCompletion: [
      findExactLine(shellBundle, "DefineSprite_184/frame_20/DoAction.as", "   _parent.animation_mc.gotoAndPlay(\"begin\");"),
      findExactLine(shellBundle, "DefineSprite_184/frame_20/DoAction.as", "   _root.InternalPreloader.gotoAndStop(\"inactive\");"),
      findExactLine(shellBundle, "DefineSprite_184/frame_20/DoAction.as", "   _root.doCheckSpanishAudio();"),
    ],
    spanishAudioPath: [
      findExactLine(shellBundle, "frame_35/DoAction.as", "      SndFName = _global.tempURL + \"/SA/\" + SSTemFName[0] + \".mp3\";"),
      findExactLine(shellBundle, "frame_35/DoAction.as", "      _global.gSound.loadSound(SndFName,1);"),
    ],
  };

  const rootTimeline = targetInventory.timelineInventory.find((timeline) => timeline.timelineId === "root");
  const animationTimeline = targetInventory.timelineInventory.find((timeline) => timeline.timelineId === "sprite-120");
  const hostPreloader = shellInventory.timelineInventory.find((timeline) => timeline.timelineId === "sprite-184");
  invariant(rootTimeline?.frameCount === 10 && animationTimeline?.frameCount === 203, "target frame-domain facts drift");
  invariant(hostPreloader?.frameCount === 28 && JSON.stringify(hostPreloader.frameLabels) === JSON.stringify([{frame: 1, label: "inactive"}, {frame: 11, label: "jump_check"}, {frame: 20, label: "done"}]), "host preloader frame-domain facts drift");

  const embeddedStream = audioEvidence.embeddedAudio.soundStreams[0];
  const spanishExternal = audioEvidence.externalAudio.exactAssociations[0];
  invariant(audioEvidence.acceptance.releaseBoundary.strictAcceptanceEffect === "none", "audio evidence acceptance boundary drift");
  invariant(embeddedStream.context.characterId === 120 && embeddedStream.firstBlockFrame === 4 && embeddedStream.lastBlockFrame === 203, "embedded stream evidence drift");
  invariant(spanishExternal.observedSha256 === SOURCE_RESOURCES[10].sha256 && spanishExternal.languageAssessment.routingLanguage === "es", "Spanish audio evidence drift");

  const runtimeResources = SOURCE_RESOURCES.filter((entry) => entry.runtime);
  const treeId = runtimeTreeId(runtimeResources);
  const runtimeTree = await materializeRuntimeTree(runtimeResources, treeId, {check});
  const scriptBytes = await readFile(SCRIPT_PATH);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-vb003-original-host-entry-antecedent",
    status: "source-static-antecedent-materialized-ruffle-probe-not-authoritative",
    diagnosticContinuity,
    generatedBy: {path: portable(SCRIPT_PATH), sha256: sha256(scriptBytes)},
    scope: {
      releaseId: release.releaseId,
      shellAnimationId: "shell-course-g04-l10-index-local",
      targetAnimationId: "course-g04-l10-vb-003",
      purpose: "Hash-bound static original-host entry contract plus a read-only, trace-scoped local tree for a separately recorded Ruffle diagnostic.",
      originalRuntimeExecuted: false,
      ruffleExecutedByThisBuilder: false,
    },
    canonicalBindings: {
      sourceResources: sourceBindings.map(({contents, runtime, ...entry}) => ({...entry, runtimeTreeMember: runtime})),
      evidenceArtifacts: artifactBindings.map(({contents, ...entry}) => entry),
      lessonRelease: {memberCount: release.members.length, targetOrdinal: targetMember.ordinal, targetReleaseRole: targetMember.releaseRole},
    },
    exactHostContract: {
      shell: {stage: shellInventory.source.stage, fps: shellInventory.source.fps, rootFrameCount: shellInventory.source.rootFrameCount, actionScriptVersion: shellInventory.source.actionScriptVersion, pairedFlaStatus: shellInventory.source.pairedFlaStatus},
      target: {stage: targetInventory.source.stage, fps: targetInventory.source.fps, rootFrameCount: targetInventory.source.rootFrameCount, actionScriptVersion: targetInventory.source.actionScriptVersion, pairedFlaStatus: targetInventory.source.pairedFlaStatus, childAnimationFrameDomain: {timelineId: "sprite-120", frameCount: 203}},
      hostPreloaderFrameDomain: {timelineId: "sprite-184", frameCount: 28, labels: hostPreloader.frameLabels},
      xmlActivePageCount: activeXmlPaths.length,
      embeddedHostPlaylistCount: embeddedPaths.length,
      hostOnlyPaths,
      xmlOnlyPaths,
      targetNaturalPrefix: naturalPrefix,
      requiredNextReleaseCount: 7,
      sourceProvenNextControlPoint: {nativeStageX: 768.05, nativeStageY: 558, placementTwips: {x: 15361, y: 11160}, hostObjectId: 340, buttonObjectId: 339, hitShapeObjectId: 335, hitShapeBoundsTwips: {left: -550, right: 550, top: -550, bottom: 550}, nestedScale: 0.79998779296875, evidenceArtifact: "shell-swfmill-xml-gzip"},
      staticEvidence,
    },
    audioAntecedent: {
      embeddedEnglishOrUndeterminedStream: {language: "und", sourceCharacterId: embeddedStream.context.characterId, localFrameDomain: "sprite-120", headFrame: embeddedStream.headFrame, firstBlockFrame: embeddedStream.firstBlockFrame, lastBlockFrame: embeddedStream.lastBlockFrame, blockCount: embeddedStream.blockCount, durationMs: embeddedStream.durationMs, spokenLanguageEstablished: false, runtimeCueTimeEstablished: false},
      spanishHostUserTrack: {path: "HELP_COURSES/ELMGR4/L10/SA/L10VB03.mp3", sha256: spanishExternal.observedSha256, durationMs: spanishExternal.probe.durationMs, sampleRateHz: spanishExternal.probe.sampleRateHz, channels: spanishExternal.probe.channels, routingLanguage: spanishExternal.languageAssessment.routingLanguage, spokenLanguageEstablished: spanishExternal.languageAssessment.spokenLanguageEstablished, startSemantics: spanishExternal.startSemantics, authoritativeListeningComplete: false},
      hostSynchronizationComplete: false,
      humanAudioReviewComplete: false,
    },
    traceSpecificationBoundary: {
      en: {path: ARTIFACT_BINDINGS.find((entry) => entry.role === "target-root-trace-en").path, sha256: ARTIFACT_BINDINGS.find((entry) => entry.role === "target-root-trace-en").sha256, status: traceEn.traceSpecStatus, naturalPlaybackClaimed: traceEn.traceModel.naturalPlaybackClaimed, orderedStepCount: traceEn.schedule.orderedSteps.length},
      es: {path: ARTIFACT_BINDINGS.find((entry) => entry.role === "target-root-trace-es").path, sha256: ARTIFACT_BINDINGS.find((entry) => entry.role === "target-root-trace-es").sha256, status: traceEs.traceSpecStatus, naturalPlaybackClaimed: traceEs.traceModel.naturalPlaybackClaimed, orderedStepCount: traceEs.schedule.orderedSteps.length},
      relationship: "The existing en/es trace specifications cover exhaustive frame-accurate target root capture only. They do not prove the original shell entry chain or natural playback.",
    },
    sideEffectContainment: {
      policy: "deny-by-default; permit only exact loopback GETs for staged immutable resources and Ruffle runtime assets; ephemeral browser context for legacy local storage; no legacy endpoint execution",
      inventoryCount: exactSideEffects.length,
      countsByKind: countBy(exactSideEffects, (entry) => entry.kind),
      countsBySafeFixtureMode: countBy(exactSideEffects, (entry) => entry.safeFixtureMode),
      exactInventory: exactSideEffects,
      executedByBuilder: [],
    },
    runtimeTree,
    runtimeProbeContract: {
      requiredProbeScript: "scripts/probe-g4-l10-vb003-original-host-ruffle.mjs",
      server: "HTTP loopback only; exact path allowlist; GET only; no directory fallback",
      browser: "new ephemeral Chromium context; service workers blocked; downloads rejected; HTTP and WebSocket deny-by-default routing",
      ruffleConfiguration: {allowNetworking: "internal", allowScriptAccess: false, openUrlMode: "deny", autoplay: "on", unmuteOverlay: "hidden"},
      expectedInitialRequest: "/runtime/HELP_COURSES/ELMGR4/L10/IR/L10RW01.swf",
      expectedTargetRequest: "/runtime/HELP_COURSES/ELMGR4/L10/VB/L10VB03.swf",
      resultPath: "output/playwright/g4-l10-vb003-original-host-ruffle-diagnostic/diagnostic.json",
    },
    authority: {
      ruffleForensicReferenceOnly: true,
      authoritativeOriginalRuntime: false,
      originalRuntimeNaturalTrace: false,
      originalRuntimeBaseline: false,
      visualFidelity: false,
      audioFidelity: false,
      humanReview: false,
      ownerReview: false,
      strictCompletion: false,
      releaseOrPublication: false,
      strictAcceptanceEffect: "none",
    },
  };
  return report;
}

async function main() {
  const check = process.argv.slice(2).includes("--check");
  invariant(process.argv.slice(2).every((argument) => argument === "--check"), "only --check is supported");
  const diagnosticContinuity = await preserveProbeBoundAntecedent({check});
  const report = await buildAntecedentReport({check, diagnosticContinuity});
  const reportPath = path.join(PROJECT_ROOT, REPORT_RELATIVE);
  const serialized = stableJson(report);
  if (check) {
    const current = await readFile(reportPath, "utf8");
    invariant(current === serialized, `${REPORT_RELATIVE} is stale`);
    process.stdout.write(`${REPORT_RELATIVE}: current; runtime tree verified\n`);
  } else {
    await mkdir(path.dirname(reportPath), {recursive: true});
    await writeFile(reportPath, serialized, {mode: 0o644});
    process.stdout.write(`${REPORT_RELATIVE}: wrote ${Buffer.byteLength(serialized)} bytes\n`);
    process.stdout.write(`${report.runtimeTree.path}: verified ${report.runtimeTree.files.length} immutable files\n`);
  }
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
