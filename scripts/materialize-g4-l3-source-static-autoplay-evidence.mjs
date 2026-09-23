#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE_PATH =
  "scripts/materialize-g4-l3-source-static-autoplay-evidence.mjs";
const SOURCE_OPERATION_INDEX = Object.freeze({
  path: "reports/g4-l3-source-operation-index-v2.json",
  bytes: 8_904_942,
  sha256: "2b3d3b89d61dabcbcf3f6a40d8728b0429535c254180065fea7fa594c2879f3e",
});
const AUTOPLAY_CONTRACT = Object.freeze({
  path: "packages/demos/src/g4-l3-source-static-autoplay-contract.ts",
  bytes: 5_724,
  sha256: "cc326e71495775b88a9749d0886c0266608ea574a4feb354cca48d1939acbf42",
});
const PROTECTED_PATHS = Object.freeze([
  "catalog/completion-ledger.json",
  "catalog/lesson-release-ledger.json",
  "reports/current-javascript-output-human-approval.json",
]);
const MARKDOWN_MARKER = "## Source-bound autoplay evidence";

export const SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS = Object.freeze([
  Object.freeze({animationId: "course-g04-l03-fq-003", shortId: "fq003", frameDomain: "sprite-899", firstExactStopFrame: 43, operationId: "operation-00320", sourceEventId: "source-event-0097", scriptPath: "DefineSprite_899/frame_43/DoAction.as", scriptSha256: "c71f185593d153c467266a494ebee471c04c9b64044e6cf491e0d91d739e92fd"}),
  Object.freeze({animationId: "course-g04-l03-in-004", shortId: "in004", frameDomain: "sprite-160", firstExactStopFrame: 126, operationId: "operation-00021", sourceEventId: "source-event-0013", scriptPath: "DefineSprite_160/frame_126/DoAction.as", scriptSha256: "d375f372b168662a197949278d1ab7fe08fe997af5d05a922209c8b305de07b8"}),
  Object.freeze({animationId: "course-g04-l03-in-005", shortId: "in005", frameDomain: "sprite-80", firstExactStopFrame: 144, operationId: "operation-00019", sourceEventId: "source-event-0012", scriptPath: "DefineSprite_80/frame_144/DoAction.as", scriptSha256: "d4964d2910566dc978ba6724f7f088f249b55d9db41cb76b1710496c957d9797"}),
  Object.freeze({animationId: "course-g04-l03-in-012", shortId: "in012", frameDomain: "sprite-228", firstExactStopFrame: 174, operationId: "operation-00031", sourceEventId: "source-event-0018", scriptPath: "DefineSprite_228/frame_174/DoAction.as", scriptSha256: "442a890ecb52fff0c305fb46aff2a222a4cd8215ffcb98989df3f83a34a4e482"}),
  Object.freeze({animationId: "course-g04-l03-ti-002", shortId: "ti002", frameDomain: "sprite-272", firstExactStopFrame: 238, operationId: "operation-00087", sourceEventId: "source-event-0056", scriptPath: "DefineSprite_272/frame_238/DoAction.as", scriptSha256: "a20c7614c5778af42c287536832f8f44eb40b2bcd334d888b3b5bda370cbee6a"}),
  Object.freeze({animationId: "course-g04-l03-ti-003", shortId: "ti003", frameDomain: "sprite-126", firstExactStopFrame: 139, operationId: "operation-00020", sourceEventId: "source-event-0012", scriptPath: "DefineSprite_126/frame_139/DoAction.as", scriptSha256: "442a890ecb52fff0c305fb46aff2a222a4cd8215ffcb98989df3f83a34a4e482"}),
  Object.freeze({animationId: "course-g04-l03-ti-004", shortId: "ti004", frameDomain: "sprite-274", firstExactStopFrame: 124, operationId: "operation-00048", sourceEventId: "source-event-0033", scriptPath: "DefineSprite_274/frame_124/DoAction.as", scriptSha256: "d375f372b168662a197949278d1ab7fe08fe997af5d05a922209c8b305de07b8"}),
  Object.freeze({animationId: "course-g04-l03-ti-006", shortId: "ti006", frameDomain: "sprite-269", firstExactStopFrame: 166, operationId: "operation-00042", sourceEventId: "source-event-0028", scriptPath: "DefineSprite_269/frame_166/DoAction.as", scriptSha256: "442a890ecb52fff0c305fb46aff2a222a4cd8215ffcb98989df3f83a34a4e482"}),
  Object.freeze({animationId: "course-g04-l03-ts-007", shortId: "ts007", frameDomain: "sprite-441", firstExactStopFrame: 235, operationId: "operation-00093", sourceEventId: "source-event-0055", scriptPath: "DefineSprite_441/frame_235/DoAction.as", scriptSha256: "5b0ca3a74d817856e487b89843263a9b53d94f45ef64fc0171c5ec97c99cd047"}),
  Object.freeze({animationId: "course-g04-l03-ts-008", shortId: "ts008", frameDomain: "sprite-350", firstExactStopFrame: 328, operationId: "operation-00083", sourceEventId: "source-event-0050", scriptPath: "DefineSprite_350/frame_328/DoAction.as", scriptSha256: "e90a35d6efc9f2f1619e1102d87d9c4a603cd96d880ea4580c7674036c653335"}),
  Object.freeze({animationId: "course-g04-l03-vb-003", shortId: "vb003", frameDomain: "sprite-106", firstExactStopFrame: 116, operationId: "operation-00017", sourceEventId: "source-event-0010", scriptPath: "DefineSprite_106/frame_116/DoAction.as", scriptSha256: "4675841335592af5413ad13e9710be07491544dbdd22f0b977fcee5b57b694a0"}),
  Object.freeze({animationId: "course-g04-l03-vb-007", shortId: "vb007", frameDomain: "sprite-271", firstExactStopFrame: 31, operationId: "operation-00031", sourceEventId: "source-event-0018", scriptPath: "DefineSprite_271/frame_31/DoAction.as", scriptSha256: "203a3458c782425f478fe2670e40cbe37427eba81f0cd4ff219f1788bd4a4f2a"}),
  Object.freeze({animationId: "course-g04-l03-vb-008", shortId: "vb008", frameDomain: "sprite-195", firstExactStopFrame: 29, operationId: "operation-00027", sourceEventId: "source-event-0015", scriptPath: "DefineSprite_195/frame_29/DoAction.as", scriptSha256: "2bc00faa29e8972b356d6871d291e14028d3e447382184b5e290666958d05405"}),
].map((item) => Object.freeze({
  ...item,
  specPath:
    `migrations/${item.animationId}/audit/source-static-current-js-candidate-spec.json`,
  reportPath:
    `reports/g4-l3-${item.shortId}-current-javascript-candidate.json`,
  markdownPath:
    `reports/g4-l3-${item.shortId}-current-javascript-candidate.md`,
  timelinePath:
    `packages/demos/src/timelines/${item.animationId}.ts`,
})));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(Buffer.from(stableJson(value)));
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function safeRelative(relativePath) {
  invariant(typeof relativePath === "string" &&
    relativePath.length > 0 &&
    !path.isAbsolute(relativePath) &&
    path.posix.normalize(relativePath) === relativePath &&
    !relativePath.startsWith("../") &&
    !relativePath.includes("/../") &&
    !relativePath.includes("\0"),
  `unsafe project-relative path: ${relativePath}`);
  return relativePath;
}

async function projectPath(root, relativePath) {
  safeRelative(relativePath);
  const rootReal = await realpath(root);
  const resolved = path.resolve(rootReal, relativePath);
  invariant(path.relative(rootReal, resolved) === relativePath,
    `path escapes project root: ${relativePath}`);
  return resolved;
}

async function readBinding(root, relativePath) {
  const absolute = await projectPath(root, relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const contents = await readFile(absolute);
  return {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

function assertPinned(binding, expected, label) {
  invariant(sameBinding(binding, expected),
    `${label} differs from its pinned identity`);
  return binding;
}

function validateFingerprint(document, field, label) {
  const projected = structuredClone(document);
  delete projected[field];
  invariant(document[field] === fingerprint(projected),
    `${label} fingerprint is stale`);
}

function findBinding(report, expected, label) {
  const matches = report.integrationBindings?.filter(
    ({path: bindingPath}) => bindingPath === expected.path,
  ) ?? [];
  invariant(matches.length === 1 && sameBinding(matches[0], expected),
    `${label} integration binding is missing or stale`);
  return matches[0];
}

function exactFirstStop(indexItem, frameDomain) {
  const stops = indexItem.operations.filter((operation) =>
    operation.scope.frameDomainCandidate === frameDomain &&
    Number.isSafeInteger(operation.scope.sourceFrame) &&
    operation.operationKind === "call" &&
    operation.method === "stop" &&
    operation.canonicalTimelineMethod === "stop" &&
    operation.receiverExpression === null &&
    operation.argumentExpressions.length === 0 &&
    operation.exactExpression === "stop();")
    .sort((left, right) =>
      left.scope.sourceFrame - right.scope.sourceFrame ||
      left.operationId.localeCompare(right.operationId));
  invariant(stops.length > 0,
    `${indexItem.animationId}: exact main-domain stop() is missing`);
  return stops[0];
}

function buildEvidence({
  item,
  report,
  indexBinding,
  contractBinding,
  materializerBinding,
  timelineBinding,
  operation,
}) {
  return {
    schemaVersion: 1,
    status: "source-bound-current-javascript-autoplay-boundary-only",
    frameDomain: item.frameDomain,
    firstExactStopFrame: item.firstExactStopFrame,
    operationId: item.operationId,
    sourceEventId: item.sourceEventId,
    scriptPath: item.scriptPath,
    scriptSha256: item.scriptSha256,
    sourceOperationIndex: {
      ...publicBinding(indexBinding),
      schemaVersion: 2,
      reportType: "g4-l3-actionscript-source-operation-index",
      exactExpression: operation.exactExpression,
    },
    autoplayContract: publicBinding(contractBinding),
    implementation: {
      timeline: publicBinding(timelineBinding),
      livePlaybackEndFrame: item.firstExactStopFrame,
      normalAutoplayStopsAtFirstExactStop: true,
    },
    diagnosticDirectSeek: {
      fullDomainAddressable: true,
      firstFrame: 1,
      lastInclusive: report.timeline.main.frameCount,
      autoplayBoundaryDoesNotTruncateDirectSeek: true,
    },
    interactionEnabled: false,
    audioEnabled: false,
    authoritativeOriginalRuntimeEstablished: false,
    orderedRuntimeExecutionEstablished: false,
    replayParityEstablished: false,
    visualParityEstablished: false,
    humanReviewEstablished: false,
    ownerAcceptanceEstablished: false,
    strictCompletionEstablished: false,
    publicReleaseEstablished: false,
    strictAcceptanceEffect: "none",
    baseReportFingerprintSha256: report.reportFingerprintSha256,
    materializedBy: publicBinding(materializerBinding),
  };
}

export function validateAutoplayEvidence(
  report,
  item,
  {
    indexBinding,
    contractBinding,
    materializerBinding,
    timelineBinding,
  },
) {
  const evidence = report.autoplayEvidence;
  invariant(evidence?.schemaVersion === 1 &&
    evidence.status ===
      "source-bound-current-javascript-autoplay-boundary-only" &&
    evidence.frameDomain === item.frameDomain &&
    evidence.firstExactStopFrame === item.firstExactStopFrame &&
    evidence.operationId === item.operationId &&
    evidence.sourceEventId === item.sourceEventId &&
    evidence.scriptPath === item.scriptPath &&
    evidence.scriptSha256 === item.scriptSha256,
  `${item.animationId}: explicit autoplay source evidence is stale`);
  invariant(sameBinding(evidence.sourceOperationIndex, indexBinding) &&
    evidence.sourceOperationIndex.schemaVersion === 2 &&
    evidence.sourceOperationIndex.reportType ===
      "g4-l3-actionscript-source-operation-index" &&
    evidence.sourceOperationIndex.exactExpression === "stop();" &&
    sameBinding(evidence.autoplayContract, contractBinding) &&
    sameBinding(evidence.implementation?.timeline, timelineBinding) &&
    evidence.implementation.livePlaybackEndFrame ===
      item.firstExactStopFrame &&
    evidence.implementation.normalAutoplayStopsAtFirstExactStop === true,
  `${item.animationId}: autoplay evidence hash closure is stale`);
  invariant(evidence.diagnosticDirectSeek?.fullDomainAddressable === true &&
    evidence.diagnosticDirectSeek.firstFrame === 1 &&
    evidence.diagnosticDirectSeek.lastInclusive ===
      report.timeline.main.frameCount &&
    evidence.diagnosticDirectSeek
      .autoplayBoundaryDoesNotTruncateDirectSeek === true,
  `${item.animationId}: diagnostic direct-seek evidence is stale`);
  invariant(evidence.interactionEnabled === false &&
    evidence.audioEnabled === false &&
    evidence.authoritativeOriginalRuntimeEstablished === false &&
    evidence.orderedRuntimeExecutionEstablished === false &&
    evidence.replayParityEstablished === false &&
    evidence.visualParityEstablished === false &&
    evidence.humanReviewEstablished === false &&
    evidence.ownerAcceptanceEstablished === false &&
    evidence.strictCompletionEstablished === false &&
    evidence.publicReleaseEstablished === false &&
    evidence.strictAcceptanceEffect === "none" &&
    sameBinding(evidence.materializedBy, materializerBinding),
  `${item.animationId}: autoplay evidence crossed an authority boundary`);
  return evidence;
}

export function validateAugmentedReport(
  report,
  item,
  bindings,
) {
  invariant(report?.schemaVersion === 1 &&
    report.reportType === "current-javascript-engineering-candidate" &&
    report.animationId === item.animationId,
  `${item.animationId}: candidate report identity is invalid`);
  validateFingerprint(report, "reportFingerprintSha256",
    `${item.animationId}: augmented candidate report`);
  const evidence = validateAutoplayEvidence(
    report,
    item,
    bindings,
  );
  const base = structuredClone(report);
  delete base.autoplayEvidence;
  base.reportFingerprintSha256 =
    evidence.baseReportFingerprintSha256;
  validateFingerprint(base, "reportFingerprintSha256",
    `${item.animationId}: reconstructed base candidate report`);
  invariant(report.timeline.main.frameDomain === item.frameDomain &&
    report.timeline.main.interactionEnabled === false &&
    report.source.associatedAudio?.rendered !== true &&
    report.source.embeddedAudio?.rendered !== true &&
    Object.values(report.acceptance ?? {}).every((value) => value === false) &&
    report.strictAcceptanceEffect === "none",
  `${item.animationId}: augmented candidate authority boundary changed`);
  findBinding(report, bindings.indexBinding,
    `${item.animationId}: source-operation index`);
  findBinding(report, bindings.contractBinding,
    `${item.animationId}: autoplay contract`);
  findBinding(report, bindings.materializerBinding,
    `${item.animationId}: autoplay evidence materializer`);
  findBinding(report, bindings.timelineBinding,
    `${item.animationId}: timeline`);
  return report;
}

async function loadContext(root, item, common) {
  const [specBinding, reportBinding, markdownBinding, timelineBinding] =
    await Promise.all([
      readBinding(root, item.specPath),
      readBinding(root, item.reportPath),
      readBinding(root, item.markdownPath),
      readBinding(root, item.timelinePath),
    ]);
  const spec = JSON.parse(specBinding.contents.toString("utf8"));
  invariant(spec.animationId === item.animationId,
    `${item.animationId}: spec identity changed`);
  for (const requiredPath of [
    SOURCE_OPERATION_INDEX.path,
    AUTOPLAY_CONTRACT.path,
    SCRIPT_RELATIVE_PATH,
  ]) {
    invariant(spec.integrationBindings.filter((value) =>
      value === requiredPath).length === 1,
    `${item.animationId}: spec must bind ${requiredPath} exactly once`);
  }
  const report = JSON.parse(reportBinding.contents.toString("utf8"));
  const indexItem = common.index.items.find(
    (candidate) => candidate.animationId === item.animationId,
  );
  invariant(indexItem &&
    indexItem.source.swf.path === report.source.swf.path &&
    indexItem.source.swf.sha256 === report.source.swf.sha256 &&
    indexItem.source.swf.physicalHashVerifiedNow === true,
  `${item.animationId}: source-operation index source binding changed`);
  const operation = exactFirstStop(indexItem, item.frameDomain);
  invariant(operation.scope.sourceFrame === item.firstExactStopFrame &&
    operation.operationId === item.operationId &&
    JSON.stringify(operation.sourceEventIds) ===
      JSON.stringify([item.sourceEventId]) &&
    operation.scriptPath === item.scriptPath &&
    operation.scriptSha256 === item.scriptSha256,
  `${item.animationId}: first exact stop() identity changed`);
  const match = /\blivePlaybackEndFrame:\s*(\d+),/.exec(
    timelineBinding.contents.toString("utf8"),
  );
  invariant(Number(match?.[1]) === item.firstExactStopFrame,
    `${item.animationId}: timeline livePlaybackEndFrame changed`);
  return {
    specBinding,
    reportBinding,
    markdownBinding,
    timelineBinding,
    report,
    operation,
  };
}

export function markdownSection(evidence) {
  return `\n${MARKDOWN_MARKER}\n\n` +
    `- Frame domain: \`${evidence.frameDomain}\`.\n` +
    `- First exact source \`stop()\`: frame ${evidence.firstExactStopFrame}, ` +
      `operation \`${evidence.operationId}\`, event ` +
      `\`${evidence.sourceEventId}\`.\n` +
    `- Source script: \`${evidence.scriptPath}\` ` +
      `(\`${evidence.scriptSha256}\`).\n` +
    `- Normal autoplay stops at that frame; deterministic direct seek remains ` +
      `available for frames 1–${evidence.diagnosticDirectSeek.lastInclusive}.\n` +
    `- Interaction: disabled. Audio: disabled. Strict acceptance effect: none.\n`;
}

export function validateMaterializedOutputPair({
  actualReportBytes,
  actualMarkdownBytes,
  expectedBaseReportBytes,
  expectedBaseMarkdownBytes,
  item,
  bindings,
}) {
  const report = JSON.parse(actualReportBytes.toString("utf8"));
  validateAugmentedReport(report, item, bindings);
  const base = structuredClone(report);
  delete base.autoplayEvidence;
  base.reportFingerprintSha256 =
    report.autoplayEvidence.baseReportFingerprintSha256;
  invariant(Buffer.from(stableJson(base)).equals(expectedBaseReportBytes),
    `${item.animationId}: materialized base report differs from generator output`);
  const expectedMarkdown = Buffer.from(
    `${expectedBaseMarkdownBytes.toString("utf8").trimEnd()}\n` +
      markdownSection(report.autoplayEvidence),
  );
  invariant(actualMarkdownBytes.equals(expectedMarkdown),
    `${item.animationId}: materialized Markdown differs from generator output`);
  return report;
}

async function replaceFile(root, relativePath, expected, desired) {
  const current = await readBinding(root, relativePath);
  invariant(current.contents.equals(expected),
    `${relativePath} changed before autoplay evidence write`);
  const absolute = await projectPath(root, relativePath);
  const temporary =
    `${absolute}.autoplay-evidence-${process.pid}`;
  await writeFile(temporary, desired, {flag: "wx", mode: 0o644});
  try {
    await rename(temporary, absolute);
  } finally {
    try {
      await unlink(temporary);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const installed = await readBinding(root, relativePath);
  invariant(installed.contents.equals(desired),
    `${relativePath} autoplay evidence write verification failed`);
}

async function commonContext(root) {
  const [indexBinding, contractBinding, materializerBinding,
    ...protectedBindings] = await Promise.all([
    readBinding(root, SOURCE_OPERATION_INDEX.path),
    readBinding(root, AUTOPLAY_CONTRACT.path),
    readBinding(root, SCRIPT_RELATIVE_PATH),
    ...PROTECTED_PATHS.map((relativePath) =>
      readBinding(root, relativePath)),
  ]);
  assertPinned(indexBinding, SOURCE_OPERATION_INDEX,
    "source-operation index");
  assertPinned(contractBinding, AUTOPLAY_CONTRACT,
    "source-static autoplay contract");
  const index = JSON.parse(indexBinding.contents.toString("utf8"));
  invariant(index.schemaVersion === 2 &&
    index.reportType === "g4-l3-actionscript-source-operation-index" &&
    index.acceptance?.acceptanceNeutral === true &&
    index.acceptance?.strictAcceptanceEffect === false,
  "source-operation index authority boundary changed");
  return {
    index,
    indexBinding,
    contractBinding,
    materializerBinding,
    protectedBindings,
  };
}

async function assertProtected(root, bindings) {
  for (const expected of bindings) {
    const observed = await readBinding(root, expected.path);
    invariant(sameBinding(observed, expected),
      `protected file changed: ${expected.path}`);
  }
}

export async function materializeSourceStaticAutoplayEvidence({
  root = PROJECT_ROOT,
  check = false,
} = {}) {
  const common = await commonContext(root);
  let written = 0;
  const immutableInputs = [
    common.indexBinding,
    common.contractBinding,
    common.materializerBinding,
  ];
  for (const item of SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS) {
    const context = await loadContext(root, item, common);
    immutableInputs.push(context.specBinding, context.timelineBinding);
    const bindings = {
      indexBinding: publicBinding(common.indexBinding),
      contractBinding: publicBinding(common.contractBinding),
      materializerBinding: publicBinding(common.materializerBinding),
      timelineBinding: publicBinding(context.timelineBinding),
    };
    if (check) {
      validateAugmentedReport(context.report, item, bindings);
      const expectedMarkdown =
        context.markdownBinding.contents.toString("utf8");
      invariant(expectedMarkdown.includes(MARKDOWN_MARKER) &&
        expectedMarkdown.endsWith(
          markdownSection(context.report.autoplayEvidence),
        ),
      `${item.animationId}: autoplay evidence Markdown is stale`);
      continue;
    }
    if (context.report.autoplayEvidence !== undefined) {
      validateAugmentedReport(context.report, item, bindings);
      invariant(context.markdownBinding.contents.toString("utf8")
        .endsWith(markdownSection(context.report.autoplayEvidence)),
      `${item.animationId}: existing autoplay Markdown is stale`);
      continue;
    }
    validateFingerprint(context.report, "reportFingerprintSha256",
      `${item.animationId}: base candidate report`);
    findBinding(context.report, bindings.indexBinding,
      `${item.animationId}: source-operation index`);
    findBinding(context.report, bindings.contractBinding,
      `${item.animationId}: autoplay contract`);
    findBinding(context.report, bindings.materializerBinding,
      `${item.animationId}: autoplay evidence materializer`);
    const evidence = buildEvidence({
      item,
      report: context.report,
      ...common,
      materializerBinding: common.materializerBinding,
      timelineBinding: context.timelineBinding,
      operation: context.operation,
    });
    const augmented = structuredClone(context.report);
    delete augmented.reportFingerprintSha256;
    augmented.autoplayEvidence = evidence;
    augmented.reportFingerprintSha256 = fingerprint(augmented);
    validateAugmentedReport(augmented, item, bindings);
    const reportBytes = Buffer.from(stableJson(augmented));
    const markdownBytes = Buffer.from(
      `${context.markdownBinding.contents.toString("utf8").trimEnd()}\n` +
      markdownSection(evidence),
    );
    await replaceFile(
      root,
      item.reportPath,
      context.reportBinding.contents,
      reportBytes,
    );
    await replaceFile(
      root,
      item.markdownPath,
      context.markdownBinding.contents,
      markdownBytes,
    );
    written += 2;
  }
  await assertProtected(root, [
    ...common.protectedBindings,
    ...immutableInputs,
  ]);
  return {
    check,
    itemCount: SOURCE_STATIC_AUTOPLAY_EVIDENCE_ITEMS.length,
    filesWritten: written,
    sourceOperationIndex: publicBinding(common.indexBinding),
    autoplayContract: publicBinding(common.contractBinding),
    interactionEnabled: false,
    audioEnabled: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {check: false, root: PROJECT_ROOT};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function help() {
  return "Usage: node scripts/materialize-g4-l3-source-static-autoplay-evidence.mjs [--check] [--root PATH]\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await materializeSourceStaticAutoplayEvidence(options),
  ));
}

if (process.argv[1] &&
  path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
