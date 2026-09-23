#!/usr/bin/env node

import {readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {selectLessonReleaseAuditMembers} from "./audit-pilot-swfs.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultLessonReleasePath = path.join(projectRoot, "catalog", "lesson-releases.json");
const safeIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertSafeId(value, label) {
  if (typeof value !== "string" || !safeIdPattern.test(value)) {
    throw new Error(`${label} is malformed`);
  }
}

function countedTags(value, evidence) {
  return Object.entries(value || {})
    .sort(([left], [right]) => compareText(left, right))
    .map(([tag, count]) => ({tag, count, evidence}));
}

export async function syncMachineAudits({
  migrationsRoot = path.join(projectRoot, "migrations"),
  dryRun = false,
  ids = [],
  releaseId = "",
  lessonReleasePath = defaultLessonReleasePath,
} = {}) {
  if (releaseId && ids.length) throw new Error("releaseId and explicit ids are mutually exclusive");
  if (releaseId) assertSafeId(releaseId, "Release ID");
  for (const id of ids) assertSafeId(id, "Animation ID");
  if (new Set(ids).size !== ids.length) throw new Error("Machine-audit sync animation IDs must not be repeated");

  const availableDirectories = (await readdir(migrationsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => compareText(left.name, right.name));
  const directoryByName = new Map(availableDirectories.map((entry) => [entry.name, entry]));
  let selectedIds = ids;
  let releaseMembersById = new Map();
  if (releaseId) {
    const releaseDocument = JSON.parse(await readFile(lessonReleasePath, "utf8"));
    const members = selectLessonReleaseAuditMembers(releaseDocument, {releaseId});
    selectedIds = members.map(({animationId}) => animationId);
    releaseMembersById = new Map(members.map((member) => [member.animationId, member]));
  }
  const directories = selectedIds.length
    ? selectedIds.map((id) => {
      const directory = directoryByName.get(id);
      if (!directory) throw new Error(`${id}: migration workspace is missing or is not a real directory`);
      return directory;
    })
    : availableDirectories;
  const results = [];

  for (const directory of directories) {
    const workspace = path.join(migrationsRoot, directory.name);
    const manifestPath = path.join(workspace, "migration.json");
    const reportPath = path.join(workspace, "audit", "machine", "report.json");
    let manifest;
    let report;
    try {
      [manifest, report] = await Promise.all([
        readFile(manifestPath, "utf8").then(JSON.parse),
        readFile(reportPath, "utf8").then(JSON.parse),
      ]);
    } catch (error) {
      if (error.code === "ENOENT") {
        results.push({id: directory.name, action: "no-report"});
        continue;
      }
      throw new Error(`${directory.name}: cannot read machine audit (${error.message})`);
    }

    if (manifest.animationId !== directory.name) throw new Error(`${directory.name}: workspace identity conflicts with its directory`);
    const releaseMember = releaseMembersById.get(directory.name);
    if (releaseMember) {
      if (manifest.id !== releaseMember.animationId || manifest.assetId !== releaseMember.assetId) {
        throw new Error(`${directory.name}: workspace identity conflicts with the lesson release`);
      }
      if (manifest.source?.swfSha256 !== releaseMember.source.sha256) {
        throw new Error(`${directory.name}: workspace SWF hash conflicts with the lesson release`);
      }
    }
    if (report.animationId !== manifest.animationId) throw new Error(`${directory.name}: audit animationId conflicts with migration manifest`);
    if (report.source?.expectedSha256 !== manifest.source?.swfSha256 || !report.source?.hashMatches) {
      throw new Error(`${directory.name}: audit source hash is not trustworthy`);
    }
    if (!report.findings?.runtimeCrossCheck?.allMatch) throw new Error(`${directory.name}: FFDec/swfmill runtime cross-check failed`);
    if (report.auditStatus !== "partial" || report.migrationStatusUnchanged !== true) {
      throw new Error(`${directory.name}: machine audit must remain partial and status-preserving`);
    }

    const categories = report.findings.swfmill?.categories || {};
    manifest.runtime.backgroundColor = report.findings.backgroundColor || manifest.runtime.backgroundColor;
    manifest.runtime.actionScriptVersion = report.findings.actionScriptVersion || manifest.runtime.actionScriptVersion;
    manifest.runtime.scripts = [{
      actionScriptVersion: report.findings.actionScriptVersion,
      exportedFileCount: report.findings.exportedScriptFileCount || 0,
      tagCounts: categories.scriptTags || {},
      evidence: "audit/machine/ffdec-scripts.txt.gz",
      confidence: "machine-extracted",
    }];
    manifest.toolVersions.ffdec = report.tools?.ffdec?.version || manifest.toolVersions.ffdec;
    manifest.toolVersions.swfmill = report.tools?.swfmill?.version || manifest.toolVersions.swfmill;
    manifest.audit.morphs = countedTags(categories.morphDefinitions, "audit/machine/swfmill-summary.json");
    manifest.audit.filters = countedTags(categories.filterTags, "audit/machine/swfmill-summary.json");
    manifest.audit.networkCalls = (report.findings.externalCallCandidates || []).map((candidate) => ({
      ...candidate,
      status: "candidate-not-executed",
      evidence: "audit/machine/ffdec-scripts.txt.gz",
    }));
    manifest.audit.machineEvidence = {
      status: "partial",
      report: "audit/machine/report.json",
      sourceHashVerified: true,
      runtimeCrossCheckPassed: true,
      authoringInspectionStatus: report.authoringSource?.inspectionStatus || "unknown",
      limitations: report.limitations || [],
    };

    if (!dryRun) await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    results.push({id: manifest.animationId, action: dryRun ? "would-sync" : "synced"});
  }
  return results;
}

export function parseArguments(argv) {
  const options = {ids: []};
  let lessonReleasePathExplicit = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--dry-run") options.dryRun = true;
    else if (["--migrations", "--id", "--release-id", "--lesson-releases"].includes(value)) {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) throw new Error(`${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--id") options.ids.push(next);
      else if (value === "--release-id") options.releaseId = next;
      else {
        options.lessonReleasePath = path.resolve(next);
        lessonReleasePathExplicit = true;
      }
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  if (options.releaseId && options.ids.length) throw new Error("--release-id and --id are mutually exclusive");
  if (lessonReleasePathExplicit && !options.releaseId) throw new Error("--lesson-releases requires --release-id");
  if (options.releaseId) assertSafeId(options.releaseId, "Release ID");
  for (const id of options.ids) assertSafeId(id, "Animation ID");
  if (new Set(options.ids).size !== options.ids.length) throw new Error("--id values must not be repeated");
  return options;
}

function usage() {
  return `Usage: node scripts/sync-machine-audits.mjs [options]\n\nOptions:\n  --id <animation-id>             Sync one migration workspace; repeatable\n  --release-id <release-id>       Sync the exact ordered members of one lesson release\n  --lesson-releases <file>        Lesson-release catalog (default: catalog/lesson-releases.json)\n  --migrations <directory>        Migration root (default: migrations)\n  --dry-run                       Validate and report without writing manifests\n  --help                          Show this help\n\nWithout --id or --release-id, the legacy behavior checks every migration workspace.\nThe command imports only hash-verified machine findings and never advances migration status.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const results = await syncMachineAudits(options);
  for (const result of results) console.log(`${result.action.toUpperCase()}: ${result.id}`);
  console.log(`Machine-audit sync checked ${results.length} workspace(s); no status was advanced.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
