#!/usr/bin/env node

import path from "node:path";
import {fileURLToPath} from "node:url";

import {auditMigrationWithInstalledTools} from "./audit-pilot-swfs.mjs";
import {materializeG4L3WorkspaceInventories} from "./materialize-g4-l3-workspace-inventories.mjs";
import {materializeG4L3WorkspaceRuntimeAcquisition} from "./materialize-g4-l3-workspace-runtime-acquisition.mjs";
import {materializeG4L3WorkspaceSourceAudits} from "./materialize-g4-l3-workspace-source-audits.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const ANIMATION_ID = "course-g04-l03-ts-006";

export async function auditTs006Swf(options = {}) {
  const migrationRoot = path.resolve(options.migrationRoot || path.join(projectRoot, "migrations"));
  const report = await auditMigrationWithInstalledTools(
    path.join(migrationRoot, ANIMATION_ID),
    options,
  );
  const failedCommands = Object.entries(report.commands || {})
    .filter(([, command]) => command.status !== "success")
    .map(([name]) => name);
  if (failedCommands.length) {
    throw new Error(`${ANIMATION_ID}: machine extraction failed: ${failedCommands.join(", ")}`);
  }
  if (report.source?.hashMatches !== true || report.migrationStatusUnchanged !== true) {
    throw new Error(`${ANIMATION_ID}: source or migration-status invariant failed`);
  }
  // The standard auditor intentionally replaces audit/machine atomically. Restore
  // the independent G4 L3 machine-owned receipts before returning so this bounded
  // command cannot silently erase the lesson-level source/inventory/acquisition chain.
  await materializeG4L3WorkspaceSourceAudits();
  await materializeG4L3WorkspaceInventories();
  await materializeG4L3WorkspaceRuntimeAcquisition();
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const report = await auditTs006Swf();
    const bytes = report.outputs.reduce((sum, output) => sum + output.bytes, 0);
    process.stdout.write(
      `audited: ${report.animationId} (${report.outputs.length} hash-bound machine files, ${bytes} bytes; status remains ${report.auditStatus})\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
