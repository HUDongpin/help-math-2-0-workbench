#!/usr/bin/env node

import {readFile, readdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function countedTags(value, evidence) {
  return Object.entries(value || {})
    .sort(([left], [right]) => compareText(left, right))
    .map(([tag, count]) => ({tag, count, evidence}));
}

export async function syncMachineAudits({
  migrationsRoot = path.join(projectRoot, "migrations"),
  dryRun = false,
} = {}) {
  const directories = (await readdir(migrationsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => compareText(left.name, right.name));
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

async function main() {
  const options = {};
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/sync-machine-audits.mjs [--dry-run] [--migrations <directory>]\n\nImports only hash-verified machine findings and never advances migration status.");
      return;
    }
    if (value === "--dry-run") options.dryRun = true;
    else if (value === "--migrations") {
      const next = process.argv[index + 1];
      if (!next) throw new Error("--migrations requires a value");
      options.migrationsRoot = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
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
