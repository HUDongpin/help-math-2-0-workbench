#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {access, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const OWNER_REVIEW_PACKET_SCHEMA_VERSION = 2;
export const OWNER_REVIEW_PACKET_GENERATOR_VERSION = "2.0.0";
export const DEFAULT_REVIEW_RUNBOOK = "docs/PILOT_ACCEPTANCE_RUNBOOK.md";
export const STRICT_GATE_IDS = Object.freeze([
  "authoritative-baseline",
  "implementation-route",
  "deterministic-frame-contract",
  "full-frame-scenario-coverage",
  "rmse-thresholds",
  "english-spanish-evidence",
  "audio-hash-listening-sync",
  "replay-interaction-random",
  "product-qa",
  "engineering-review",
  "human-review",
  "owner-acceptance",
  "strict-validator",
  "regression-tests",
  "production-build",
]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectRelative(projectRoot, filePath) {
  const relative = path.relative(projectRoot, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? portable(relative)
    : portable(path.resolve(filePath));
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function resolveProjectPath(projectRoot, value) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(projectRoot, value);
}

function evidenceLink(markdownOutput, absolutePath) {
  const relative = path.relative(path.dirname(markdownOutput), absolutePath);
  return portable(relative || path.basename(absolutePath));
}

async function inspectEvidence(projectRoot, markdownOutput, evidencePath, cache) {
  const absolutePath = resolveProjectPath(projectRoot, evidencePath);
  const cacheKey = absolutePath;
  let inspected = cache.get(cacheKey);
  if (!inspected) {
    const referenceSha256 = sha256(`HELP-MATH-EVIDENCE-REFERENCE\0${portable(absolutePath)}`);
    try {
      const metadata = await stat(absolutePath);
      if (metadata.isFile()) {
        inspected = {
          exists: true,
          kind: "file",
          sha256: await sha256File(absolutePath),
          sha256Scope: "file-content",
          referenceSha256,
          bytes: metadata.size,
          integrityNote: "sha256 covers the complete file bytes",
        };
      } else if (metadata.isDirectory()) {
        inspected = {
          exists: true,
          kind: "directory",
          sha256: null,
          sha256Scope: "not-computed-directory-content",
          referenceSha256,
          bytes: null,
          integrityNote: "directory reference only; review the hash-bound manifest/report files listed beside this archive",
        };
      } else {
        inspected = {
          exists: true,
          kind: "other",
          sha256: null,
          sha256Scope: "not-applicable",
          referenceSha256,
          bytes: null,
          integrityNote: "non-file evidence reference; no content hash was inferred",
        };
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      inspected = {
        exists: false,
        kind: "missing",
        sha256: null,
        sha256Scope: "unavailable",
        referenceSha256,
        bytes: null,
        integrityNote: "evidence path is missing; the packet does not treat it as reviewed or accepted",
      };
    }
    cache.set(cacheKey, inspected);
  }
  return {
    path: evidencePath,
    link: evidenceLink(markdownOutput, absolutePath),
    ...inspected,
  };
}

function blankDecision(role) {
  return {
    role,
    decision: null,
    reviewer: null,
    reviewedAt: null,
    evidenceScope: null,
    notes: null,
    recordDescriptor: null,
    previousRecord: null,
    immutableRecordWritten: false,
    migrationMirrorUpdated: false,
  };
}

function reviewRecordContract(animationId) {
  const workspace = `migrations/${animationId}`;
  return {
    humanVisualReview: {
      unsignedInputRoot: `${workspace}/evidence/review-inputs`,
      immutableRecordRoot: `${workspace}/evidence/reviews/human`,
      migrationMirror: `${workspace}/migration.json acceptance.humanVisualReview`,
      descriptorFields: ["path", "bytes", "sha256"],
      previousRecordField: "previousRecord",
    },
    ownerAcceptance: {
      immutableRecordRoot: `${workspace}/evidence/reviews/owner`,
      migrationMirror: `${workspace}/migration.json acceptance.ownerReview`,
      descriptorFields: ["path", "bytes", "sha256"],
      previousRecordField: "previousRecord",
    },
    appendOnlyRule: "Never overwrite a review record. A later decision creates a new immutable record whose previousRecord descriptor binds the earlier bytes.",
    manifestRule: "migration.json is a current decision mirror and record descriptor, not the signed system of record.",
  };
}

function gateStatus(pilot, gateId) {
  return pilot.gates.find((gate) => gate.id === gateId)?.status || "missing";
}

function authorityBoundary(pilot) {
  if (pilot.strictAccepted === true) {
    return {
      classification: "strict-accepted-in-source-report",
      authoritativeBaselineAdopted: true,
      candidateImplementationAccepted: true,
      reviewWarning: "Reconfirm the source report and manifest bindings before recording any new review decision.",
    };
  }
  if (gateStatus(pilot, "authoritative-baseline") === "pass") {
    return {
      classification: "authoritative-baseline-with-unaccepted-migration-candidate",
      authoritativeBaselineAdopted: true,
      candidateImplementationAccepted: false,
      reviewWarning: "A baseline gate passed, but the implementation is not strict-complete and must not be described as faithfully accepted.",
    };
  }
  return {
    classification: "candidate-or-incomplete-without-passing-authoritative-baseline-gate",
    authoritativeBaselineAdopted: false,
    candidateImplementationAccepted: false,
    reviewWarning: "Candidate captures, structural exports, or engineering QA are not an authoritative baseline or fidelity acceptance.",
  };
}

function validateStrictReport(report) {
  invariant(report?.schemaVersion === 1, "strict acceptance report schemaVersion must be 1");
  invariant(Array.isArray(report.pilots) && report.pilots.length === 16, "strict acceptance report must contain exactly 16 pilots");
  invariant(new Set(report.pilots.map((pilot) => pilot.animationId)).size === 16, "strict acceptance report pilot IDs must be unique");
  for (const pilot of report.pilots) {
    invariant(typeof pilot.animationId === "string" && pilot.animationId.length > 0, "pilot animationId is required");
    invariant(Array.isArray(pilot.gates) && pilot.gates.length === STRICT_GATE_IDS.length, `${pilot.animationId}: expected ${STRICT_GATE_IDS.length} gates`);
    const ids = pilot.gates.map((gate) => gate.id);
    invariant(JSON.stringify(ids) === JSON.stringify(STRICT_GATE_IDS), `${pilot.animationId}: strict gate order/identity differs from the review contract`);
    for (const gate of pilot.gates) {
      invariant(gate.status === "pass" || gate.status === "fail", `${pilot.animationId}/${gate.id}: gate status must be pass or fail`);
      invariant(Array.isArray(gate.evidence), `${pilot.animationId}/${gate.id}: gate evidence must be an array`);
      invariant(Array.isArray(gate.reasons), `${pilot.animationId}/${gate.id}: gate reasons must be an array`);
      invariant(Array.isArray(gate.observations), `${pilot.animationId}/${gate.id}: gate observations must be an array`);
    }
  }
  return report;
}

export async function buildPilotOwnerReviewPacket({
  projectRoot = defaultProjectRoot,
  input,
  markdownOutput,
  runbookPath = DEFAULT_REVIEW_RUNBOOK,
  generatorPath = scriptPath,
} = {}) {
  const resolvedInput = path.resolve(input || path.join(projectRoot, "reports", "pilot-strict-acceptance.json"));
  const resolvedMarkdown = path.resolve(markdownOutput || path.join(projectRoot, "reports", "pilot-owner-review-packet.md"));
  const inputBytes = await readFile(resolvedInput);
  const report = validateStrictReport(JSON.parse(inputBytes.toString("utf8")));
  const inputSha256 = sha256(inputBytes);
  const generatorSha256 = await sha256File(generatorPath);
  const evidenceCache = new Map();
  const runbook = await inspectEvidence(projectRoot, resolvedMarkdown, runbookPath, evidenceCache);
  invariant(runbook.exists && runbook.kind === "file" && runbook.sha256, `review runbook must exist as a hashable file: ${runbookPath}`);
  const pilots = [];

  for (const pilot of report.pilots) {
    const currentManifestPath = resolveProjectPath(projectRoot, path.join(pilot.workspace || `migrations/${pilot.animationId}`, "migration.json"));
    const currentManifestSha256 = await exists(currentManifestPath) ? await sha256File(currentManifestPath) : null;
    const gates = [];
    for (const gate of pilot.gates) {
      const evidence = [];
      for (const evidencePath of gate.evidence) evidence.push(await inspectEvidence(projectRoot, resolvedMarkdown, evidencePath, evidenceCache));
      gates.push({
        id: gate.id,
        label: gate.label,
        status: gate.status,
        evidence,
        reasons: [...gate.reasons],
        observations: [...gate.observations],
        reviewerDecision: blankDecision("gate-reviewer"),
      });
    }
    pilots.push({
      animationId: pilot.animationId,
      workspace: pilot.workspace,
      migrationStatus: pilot.migrationStatus,
      strictAcceptedInSourceReport: pilot.strictAccepted === true,
      passedGateCount: gates.filter((gate) => gate.status === "pass").length,
      failedGateCount: gates.filter((gate) => gate.status === "fail").length,
      manifestBinding: {
        path: projectRelative(projectRoot, currentManifestPath),
        sourceReportSha256: pilot.manifestSha256 || null,
        currentSha256: currentManifestSha256,
        current: Boolean(currentManifestSha256 && pilot.manifestSha256 === currentManifestSha256),
      },
      authorityBoundary: authorityBoundary(pilot),
      reviewRecordContract: reviewRecordContract(pilot.animationId),
      gates,
      humanVisualReview: blankDecision("named-human-visual-reviewer"),
      ownerAcceptance: blankDecision("owner-or-authorized-owner-representative"),
    });
  }

  const packet = {
    schemaVersion: OWNER_REVIEW_PACKET_SCHEMA_VERSION,
    generator: {
      path: projectRelative(projectRoot, generatorPath),
      version: OWNER_REVIEW_PACKET_GENERATOR_VERSION,
      sha256: generatorSha256,
    },
    source: {
      strictAcceptanceReport: projectRelative(projectRoot, resolvedInput),
      sha256: inputSha256,
      schemaVersion: report.schemaVersion,
      generatedMarker: report.generatedMarker || null,
      validator: report.validator || null,
    },
    reviewRunbook: runbook,
    authorityBoundary: {
      purpose: "review worksheet generated from a machine strict-gate snapshot",
      changesMigrationStatus: false,
      signsHumanReview: false,
      signsOwnerAcceptance: false,
      convertsCandidateEvidenceToAuthority: false,
      publicationEffect: "none",
      rule: "Blank fields are intentional. Generation or --check success is never a human or owner signature.",
    },
    signingInstructions: {
      prerequisite: "Follow the hash-bound review runbook. Before an accepted human decision, every machine/engineering gate other than human-review, owner-acceptance, and the review-dependent strict-validator gate must pass; every manifestBinding.current value must be true.",
      humanReview: {
        allowedDecisions: ["accepted", "rejected"],
        requiredFields: ["decision", "reviewer", "reviewedAt", "evidenceScope", "notes", "recordDescriptor"],
        scope: "Inspect every linked keyframe/full-frame diff, all outliers, language variants, interaction branches, audio findings, and known exceptions.",
        unsignedInputTarget: "migrations/<animationId>/evidence/review-inputs/human-visual-input-<sha256>.json",
        immutableRecordTarget: "migrations/<animationId>/evidence/reviews/human/human-review-<timestamp>-<sha256>.json",
        migrationMirrorTarget: "migrations/<animationId>/migration.json acceptance.humanVisualReview.record",
      },
      ownerAcceptance: {
        allowedDecisions: ["accepted", "rejected"],
        requiredFields: ["decision", "reviewer", "reviewedAt", "evidenceScope", "notes", "recordDescriptor"],
        scope: "Confirm the exact accepted scope and every unresolved exception; owner acceptance does not override a failed strict technical gate unless the gate supports a written exception.",
        immutableRecordTarget: "migrations/<animationId>/evidence/reviews/owner/owner-review-<timestamp>-<sha256>.json",
        migrationMirrorTarget: "migrations/<animationId>/migration.json acceptance.ownerReview.record",
      },
      afterSigning: "Regenerate verification receipts, strict acceptance reports, completion ledger, and this packet; run every --check command again.",
      prohibited: [
        "Do not enter Codex, an automated agent, or this generator as the human or owner reviewer.",
        "Do not mark a candidate, structural export, Ruffle run, or unexecuted Adobe fixture authoritative merely because it is linked here.",
        "Do not edit this generated packet or migration.json inline fields as the signed system of record; write a new immutable review record and mirror its exact descriptor.",
        "Do not record not-required for owner acceptance: the strict gate accepts only an explicit accepted decision by a named owner or authorized owner representative.",
        "Do not use a local-frame controller capture as proof of natural playback, interaction, audio, language, Replay, or original-host behavior.",
      ],
    },
    summary: {
      pilots: pilots.length,
      strictAcceptedInSourceReport: pilots.filter((pilot) => pilot.strictAcceptedInSourceReport).length,
      notStrictAcceptedInSourceReport: pilots.filter((pilot) => !pilot.strictAcceptedInSourceReport).length,
      manifestBindingsCurrent: pilots.filter((pilot) => pilot.manifestBinding.current).length,
      manifestBindingsStaleOrMissing: pilots.filter((pilot) => !pilot.manifestBinding.current).length,
      humanDecisionsRecordedByPacket: 0,
      ownerDecisionsRecordedByPacket: 0,
    },
    pilots,
  };
  packet.generatedMarker = `sha256:${sha256(stableJson(packet))}`;
  return packet;
}

function markdownEscape(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function markdownLink(record) {
  const hash = record.sha256 ? `SHA-256 \`${record.sha256}\`` : `reference \`${record.referenceSha256}\` (${record.sha256Scope})`;
  return `[\`${markdownEscape(record.path)}\`](<${record.link}>) — ${hash}${record.exists ? "" : " — **MISSING**"}`;
}

function blankReviewMarkdown(title, contract) {
  return [
    `### ${title}`,
    "",
    "- Decision: ☐ accepted  ☐ rejected",
    "- Reviewer（具名人员）: ______________________________",
    "- Reviewed at（ISO 日期）: ____________________________",
    "- Evidence scope: _____________________________________",
    "- Notes / exceptions: _________________________________",
    `- Immutable record root: \`${contract.immutableRecordRoot}\``,
    `- migration.json mirror: \`${contract.migrationMirror}\``,
    "- Required descriptor: `{ path, bytes, sha256 }`",
    "- Previous record（append-only history）: __________________",
    "",
    "> 本处为空白是设计要求。不得把生成器、Codex 或机器检查写成 human/owner reviewer。",
  ];
}

export function renderPilotOwnerReviewMarkdown(packet) {
  const lines = [
    "# HELP Math 16 项试点：Human + Owner 审核包",
    "",
    "> **这是一份机器生成的审核工作表，不是签署记录。** 生成成功、`--check` 通过或 gate 显示 PASS，均不代表 human review 或 owner acceptance。",
    "",
    `- Source strict report: \`${packet.source.strictAcceptanceReport}\``,
    `- Source SHA-256: \`${packet.source.sha256}\``,
    `- Packet marker: \`${packet.generatedMarker}\``,
    `- Review runbook: ${markdownLink(packet.reviewRunbook)}`,
    `- Strict accepted in source report: **${packet.summary.strictAcceptedInSourceReport}/${packet.summary.pilots}**`,
    `- Current manifest bindings: **${packet.summary.manifestBindingsCurrent}/${packet.summary.pilots}**`,
    "",
    "## 签署规则",
    "",
    `1. ${packet.signingInstructions.prerequisite}`,
    `2. Human reviewer：${packet.signingInstructions.humanReview.scope}`,
    `3. Owner：${packet.signingInstructions.ownerAcceptance.scope}`,
    `4. ${packet.signingInstructions.afterSigning}`,
    "",
    ...packet.signingInstructions.prohibited.map((item) => `- ${item}`),
    "",
    "## 总览",
    "",
    "| Animation | Migration status | Gates | Manifest binding | Authority boundary | Strict |",
    "|---|---|---:|---|---|---|",
  ];
  for (const pilot of packet.pilots) {
    lines.push(`| \`${markdownEscape(pilot.animationId)}\` | \`${markdownEscape(pilot.migrationStatus)}\` | ${pilot.passedGateCount}/15 | ${pilot.manifestBinding.current ? "CURRENT" : "STALE/MISSING"} | ${markdownEscape(pilot.authorityBoundary.classification)} | ${pilot.strictAcceptedInSourceReport ? "PASS" : "FAIL"} |`);
  }

  for (const pilot of packet.pilots) {
    lines.push(
      "",
      `## ${pilot.animationId}`,
      "",
      `- Workspace: \`${pilot.workspace}\``,
      `- Migration status: \`${pilot.migrationStatus}\``,
      `- Gates: **${pilot.passedGateCount}/15 passed; ${pilot.failedGateCount}/15 failed**`,
      `- Manifest binding: **${pilot.manifestBinding.current ? "CURRENT" : "STALE/MISSING"}** (report \`${pilot.manifestBinding.sourceReportSha256 || "missing"}\`; current \`${pilot.manifestBinding.currentSha256 || "missing"}\`)`,
      `- Authority boundary: **${pilot.authorityBoundary.classification}**`,
      `- Boundary warning: ${pilot.authorityBoundary.reviewWarning}`,
      "",
      "### Gate-by-gate checklist",
    );
    for (const gate of pilot.gates) {
      lines.push("", `#### ${gate.status === "pass" ? "☑" : "☐"} ${gate.label} (\`${gate.id}\`) — ${gate.status.toUpperCase()}`, "");
      if (gate.evidence.length) {
        lines.push("Evidence:", "", ...gate.evidence.map((record) => `- ${markdownLink(record)}`), "");
      } else lines.push("Evidence: **none listed by strict report**", "");
      if (gate.reasons.length) lines.push("Blocking reasons:", "", ...gate.reasons.map((reason) => `- ${reason}`), "");
      if (gate.observations.length) lines.push("Observations / authority limitations:", "", ...gate.observations.map((observation) => `- ${observation}`), "");
      lines.push("Reviewer gate decision: ☐ confirm evidence/status  ☐ reject/return; reviewer/date/notes: ____________________");
    }
    lines.push(
      "",
      ...blankReviewMarkdown("Named human visual review（不得代签）", pilot.reviewRecordContract.humanVisualReview),
      "",
      ...blankReviewMarkdown("Owner acceptance（不得代签）", pilot.reviewRecordContract.ownerAcceptance),
    );
  }
  return `${lines.join("\n")}\n`;
}

async function atomicWrite(filePath, contents) {
  await mkdir(path.dirname(filePath), {recursive: true});
  const temporary = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporary, contents);
  await rename(temporary, filePath);
}

export async function generatePilotOwnerReviewPacket({
  projectRoot = defaultProjectRoot,
  input = path.join(projectRoot, "reports", "pilot-strict-acceptance.json"),
  jsonOutput = path.join(projectRoot, "reports", "pilot-owner-review-packet.json"),
  markdownOutput = path.join(projectRoot, "reports", "pilot-owner-review-packet.md"),
  runbookPath = DEFAULT_REVIEW_RUNBOOK,
  check = false,
  generatorPath = scriptPath,
} = {}) {
  const resolvedJson = path.resolve(jsonOutput);
  const resolvedMarkdown = path.resolve(markdownOutput);
  const packet = await buildPilotOwnerReviewPacket({projectRoot, input, markdownOutput: resolvedMarkdown, runbookPath, generatorPath});
  const json = stableJson(packet);
  const markdown = renderPilotOwnerReviewMarkdown(packet);
  if (check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readFile(resolvedJson, "utf8").catch(() => null),
      readFile(resolvedMarkdown, "utf8").catch(() => null),
    ]);
    return {
      ok: currentJson === json && currentMarkdown === markdown,
      jsonCurrent: currentJson === json,
      markdownCurrent: currentMarkdown === markdown,
      packet,
      jsonOutput: resolvedJson,
      markdownOutput: resolvedMarkdown,
    };
  }
  await Promise.all([atomicWrite(resolvedJson, json), atomicWrite(resolvedMarkdown, markdown)]);
  return {ok: true, jsonCurrent: true, markdownCurrent: true, packet, jsonOutput: resolvedJson, markdownOutput: resolvedMarkdown};
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const options = {
    projectRoot,
    input: path.join(projectRoot, "reports", "pilot-strict-acceptance.json"),
    jsonOutput: path.join(projectRoot, "reports", "pilot-owner-review-packet.json"),
    markdownOutput: path.join(projectRoot, "reports", "pilot-owner-review-packet.md"),
    check: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--input", "--output-json", "--output-markdown"].includes(value)) {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a path`);
      if (value === "--input") options.input = path.resolve(next);
      else if (value === "--output-json") options.jsonOutput = path.resolve(next);
      else options.markdownOutput = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-pilot-owner-review-packet.mjs [--check] [--json]
    [--input <strict-report.json>] [--output-json <packet.json>]
    [--output-markdown <packet.md>]

Generates a deterministic 16-pilot human/owner review worksheet from the current
strict-acceptance report. It never signs a review or changes migration status.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const result = await generatePilotOwnerReviewPacket(options);
  const summary = {
    ok: result.ok,
    jsonCurrent: result.jsonCurrent,
    markdownCurrent: result.markdownCurrent,
    jsonOutput: projectRelative(options.projectRoot, result.jsonOutput),
    markdownOutput: projectRelative(options.projectRoot, result.markdownOutput),
    generatedMarker: result.packet.generatedMarker,
    summary: result.packet.summary,
  };
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else console.log(`${result.ok ? (options.check ? "PASS" : "Wrote") : "FAIL"}: ${summary.jsonOutput} and ${summary.markdownOutput}`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
