#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  G5_L4_SCOPE_MARKDOWN_PATH,
  G5_L4_SCOPE_PATH,
  materializeG5L4SourceWorkspaces,
} from "./materialize-g5-l4-source-workspaces.mjs";
import {
  buildG5L4WorkspaceReadinessRefresh,
} from "./refresh-g5-l4-workspace-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function renderScopeMarkdown(scope, descriptor) {
  return Buffer.from(
    `# G5 L4 Source Scope Freeze\n\n` +
      `- Release candidate: \`${scope.releaseId}\`.\n` +
      `- Frozen members: **${scope.summary.memberCount}** (${scope.summary.pageCount} XML pages + ${scope.summary.shellCount} shell).\n` +
      `- Source models: **${scope.summary.pairedFlaSwfCount}** paired FLA/SWF; **${scope.summary.swfOnlyCount}** SWF-only.\n` +
      `- Explicit exclusions: **${scope.summary.exclusionCount}**.\n` +
      `- MP3 candidates: **${scope.summary.audioCandidateCount}** = ${scope.summary.exactPageAudioCandidateCount} exact page associations + ${scope.summary.groupedFqAudioCandidateCount} grouped FQ candidates + ${scope.summary.unmappedAudioCandidateCount} unmapped.\n` +
      `- Catalog root frames: **${scope.lesson.catalogRootFrameCount}**; this is not complete nested/interactive coverage.\n` +
      `- JSON descriptor: \`${descriptor.sha256}\` (${descriptor.bytes} bytes).\n\n` +
      `## Fail-closed blockers\n\n` +
      scope.conflicts
        .map(
          (conflict) =>
            `- \`${conflict.conflictId}\`: ${conflict.status}; strict blocker.`,
        )
        .join("\n") +
      `\n\nThis is source-scope and workspace-intake evidence only. It establishes no original-runtime authority, JavaScript fidelity, audio acceptance, human or owner decision, strict completion, or publication.\n`,
  );
}

export async function checkG5L4SourceWorkspacesCurrent({
  root = projectRoot,
} = {}) {
  const planned = await materializeG5L4SourceWorkspaces({
    root,
    migrationsRoot: path.join(root, "migrations"),
    reportsRoot: path.join(root, "reports"),
    dryRun: true,
  });
  const expectedScope = jsonBytes(planned.scope);
  const scopeDescriptor = {
    path: G5_L4_SCOPE_PATH,
    bytes: expectedScope.length,
    sha256: sha256(expectedScope),
  };
  const expectedMarkdown = renderScopeMarkdown(
    planned.scope,
    scopeDescriptor,
  );
  const [actualScope, actualMarkdown] = await Promise.all([
    readFile(path.join(root, G5_L4_SCOPE_PATH)),
    readFile(path.join(root, G5_L4_SCOPE_MARKDOWN_PATH)),
  ]);
  invariant(
    actualScope.equals(expectedScope),
    "G5 L4 source scope freeze is stale",
  );
  invariant(
    actualMarkdown.equals(expectedMarkdown),
    "G5 L4 source scope markdown is stale",
  );

  const readiness = await buildG5L4WorkspaceReadinessRefresh({
    root,
    mode: "check",
  });
  invariant(
    readiness.memberCount === 55 &&
      readiness.draftValidationPassCount === 55 &&
      readiness.strictComplete === 0 &&
      readiness.published === 0,
    "G5 L4 workspace readiness crossed its fail-closed boundary",
  );
  return {
    releaseId: planned.scope.releaseId,
    memberCount: planned.scope.summary.memberCount,
    draftValidationPassCount: readiness.draftValidationPassCount,
    implementationStarted: readiness.implementationStarted,
    strictComplete: readiness.strictComplete,
    published: readiness.published,
    scope: scopeDescriptor,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  if (process.argv.length !== 2) {
    throw new Error("This checker accepts no arguments");
  }
  const result = await checkG5L4SourceWorkspacesCurrent();
  console.log(
    `PASS: G5 L4 source scope ${result.memberCount}/55 and workspace drafts ${result.draftValidationPassCount}/55 are current; implementation candidates ${result.implementationStarted}; strict ${result.strictComplete}/55; published ${result.published}.`,
  );
}
