#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_REPORT_PATH = "reports/g4-l3-materialized-root-entry-identity-successor-v2.json";
const REPORT_PATH = "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const MARKDOWN_PATH = "reports/g4-l3-unresolved-root-entry-placement-path-audit.md";

const PYTHON_EXTRACTOR = String.raw`
import gzip
import json
import sys
import xml.etree.ElementTree as ET

source = sys.argv[1]
targets = set(json.loads(sys.argv[2]))

def local(tag):
    return tag.rsplit("}", 1)[-1]

def child(node, name):
    return next((item for item in list(node) if local(item.tag) == name), None)

with gzip.open(source, "rb") as handle:
    tree = ET.parse(handle)

header = next((item for item in tree.getroot().iter() if local(item.tag) == "Header"), None)
if header is None:
    raise RuntimeError("swfmill XML has no Header")
root_tags = child(header, "tags")
if root_tags is None:
    raise RuntimeError("swfmill XML Header has no tags")

timelines = {"root": root_tags}
object_to_timeline = {}
for node in list(root_tags):
    if local(node.tag) == "DefineSprite" and node.attrib.get("objectID"):
        object_id = node.attrib["objectID"]
        timeline_id = "sprite-" + object_id
        timelines[timeline_id] = child(node, "tags")
        object_to_timeline[object_id] = timeline_id

edges = {timeline_id: [] for timeline_id in timelines}
for timeline_id, tags in timelines.items():
    if tags is None:
        continue
    frame = 1
    for node in list(tags):
        tag = local(node.tag)
        if tag == "ShowFrame":
            frame += 1
        elif tag in ("PlaceObject", "PlaceObject2", "PlaceObject3"):
            child_timeline = object_to_timeline.get(node.attrib.get("objectID"))
            if child_timeline:
                edges[timeline_id].append({
                    "parentTimelineId": timeline_id,
                    "childTimelineId": child_timeline,
                    "parentFrame": frame,
                    "depth": node.attrib.get("depth", ""),
                    "instanceName": node.attrib.get("name", ""),
                    "tag": tag,
                })

def simple_paths(target):
    paths = []
    def visit(current, path, seen):
        if current == target:
            paths.append(path)
            return
        for edge in edges.get(current, []):
            child_timeline = edge["childTimelineId"]
            if child_timeline not in seen:
                visit(child_timeline, path + [edge], seen | {child_timeline})
    visit("root", [], {"root"})
    return paths

result = {}
for target in sorted(targets):
    result[target] = simple_paths(target)
print(json.dumps(result, sort_keys=True, separators=(",", ":")))
`;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function pretty(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    "project-relative path is required");
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`), `${relativePath} escapes the project root`);
  return absolute;
}

async function record(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytesValue = await readFile(absolute);
  return {path: relativePath, bytes: bytesValue.length, sha256: sha256(bytesValue), bytesValue};
}

function binding(fileRecord) {
  return {path: fileRecord.path, bytes: fileRecord.bytes, sha256: fileRecord.sha256};
}

function exactBinding(actual, expected, label) {
  invariant(actual.path === expected?.path && actual.bytes === expected?.bytes && actual.sha256 === expected?.sha256,
    `${label} binding drifted`);
}

export function summarizeRootEntryPaths(paths, targetTimelineId) {
  invariant(Array.isArray(paths) && paths.length > 0, `${targetTimelineId}: no root placement path was found`);
  for (const [index, placementPath] of paths.entries()) {
    invariant(Array.isArray(placementPath) && placementPath.length > 0,
      `${targetTimelineId}: path ${index + 1} is empty`);
    invariant(placementPath[0].parentTimelineId === "root",
      `${targetTimelineId}: path ${index + 1} does not begin at root`);
    invariant(placementPath.at(-1).childTimelineId === targetTimelineId,
      `${targetTimelineId}: path ${index + 1} does not end at the target`);
    for (let edgeIndex = 1; edgeIndex < placementPath.length; edgeIndex += 1) {
      invariant(placementPath[edgeIndex - 1].childTimelineId === placementPath[edgeIndex].parentTimelineId,
        `${targetTimelineId}: path ${index + 1} is discontinuous`);
    }
  }
  const rootFrames = [...new Set(paths.map((placementPath) => placementPath[0].parentFrame))]
    .sort((left, right) => left - right);
  const rootInstances = [...new Set(paths.map((placementPath) => placementPath[0].instanceName))].sort();
  invariant(rootFrames.length === 1 && Number.isSafeInteger(rootFrames[0]) && rootFrames[0] >= 1,
    `${targetTimelineId}: root placement frame is ambiguous`);
  invariant(rootInstances.length === 1 && rootInstances[0].toLowerCase() === "animation",
    `${targetTimelineId}: root placement instance is not the lesson animation host`);
  return {pathCount: paths.length, rootEntryFrame: rootFrames[0], rootInstanceName: rootInstances[0]};
}

async function extractPaths(swfmillRecord, targetTimelineIds) {
  const {stdout, stderr} = await execFileAsync("python3", [
    "-c",
    PYTHON_EXTRACTOR,
    projectPath(swfmillRecord.path),
    JSON.stringify(targetTimelineIds),
  ], {cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024});
  invariant(!stderr.trim(), `${swfmillRecord.path}: placement extractor emitted stderr`);
  return JSON.parse(stdout);
}

function unresolvedWorkspaces(sourceReport) {
  const items = sourceReport.items.filter(({unresolvedRequirements}) => unresolvedRequirements > 0);
  invariant(items.length === 7, `Expected 7 unresolved workspaces, found ${items.length}`);
  return items;
}

async function buildReport() {
  const [sourceRecord, generatorRecord] = await Promise.all([
    record(SOURCE_REPORT_PATH),
    record(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  const sourceReport = JSON.parse(sourceRecord.bytesValue);
  invariant(sourceReport.schemaVersion === 1
    && sourceReport.reportType === "g4-l3-materialized-root-entry-identity-successor-v2"
    && sourceReport.summary?.unresolvedRequirements === 34
    && sourceReport.summary?.strictCompletions === 0,
  "Root-entry v2 source report drifted or changed acceptance scope");

  const items = [];
  for (const sourceItem of unresolvedWorkspaces(sourceReport)) {
    const workspace = `migrations/${sourceItem.animationId}`;
    const scenarioPath = `${workspace}/audit/scenario-inventory.json`;
    const machineReportPath = `${workspace}/audit/machine/report.json`;
    const [scenarioRecord, machineReportRecord] = await Promise.all([
      record(scenarioPath),
      record(machineReportPath),
    ]);
    const scenario = JSON.parse(scenarioRecord.bytesValue);
    const machineReport = JSON.parse(machineReportRecord.bytesValue);
    invariant(scenario.animationId === sourceItem.animationId, `${sourceItem.animationId}: scenario identity drifted`);
    const evidence = scenario.evidenceIndex.find(({artifactId}) => artifactId === "swfmill-xml");
    invariant(evidence, `${sourceItem.animationId}: scenario lacks swfmill evidence`);
    const swfmillRecord = await record(`${workspace}/${evidence.path}`);
    invariant(swfmillRecord.sha256 === evidence.sha256,
      `${sourceItem.animationId}: scenario swfmill SHA-256 drifted`);
    const uncompressed = gunzipSync(swfmillRecord.bytesValue);
    invariant(sha256(uncompressed) === evidence.uncompressedSha256,
      `${sourceItem.animationId}: uncompressed swfmill SHA-256 drifted`);
    const machineOutput = machineReport.outputs.find(({path: outputPath}) => outputPath === evidence.path);
    invariant(machineOutput?.sha256 === swfmillRecord.sha256
      && machineOutput.uncompressedSha256 === evidence.uncompressedSha256,
    `${sourceItem.animationId}: machine report does not bind the scenario swfmill XML`);

    const targetTimelineIds = [...new Set(sourceItem.unresolved.map(({frameDomainId}) => frameDomainId))].sort();
    invariant(targetTimelineIds.length * 2 === sourceItem.unresolvedRequirements,
      `${sourceItem.animationId}: unresolved requirements are not exact EN/ES pairs`);
    const extracted = await extractPaths(swfmillRecord, targetTimelineIds);
    const domains = targetTimelineIds.map((targetTimelineId) => {
      const paths = extracted[targetTimelineId];
      const summary = summarizeRootEntryPaths(paths, targetTimelineId);
      invariant(summary.rootEntryFrame === 6,
        `${sourceItem.animationId}/${targetTimelineId}: expected the source-proven lesson entry at root frame 6`);
      const requirements = sourceItem.unresolved
        .filter(({frameDomainId}) => frameDomainId === targetTimelineId)
        .map(({requirementId}) => requirementId)
        .sort();
      invariant(requirements.length === 2
        && requirements.some((id) => id.endsWith(":en"))
        && requirements.some((id) => id.endsWith(":es")),
      `${sourceItem.animationId}/${targetTimelineId}: language requirement pair drifted`);
      return {targetTimelineId, requirements, ...summary, placementPaths: paths};
    });
    items.push({
      sequence: sourceItem.sequence,
      animationId: sourceItem.animationId,
      sourceScenarioInventory: binding(scenarioRecord),
      sourceMachineReport: binding(machineReportRecord),
      sourceSwfmillXml: {
        ...binding(swfmillRecord),
        uncompressedBytes: uncompressed.length,
        uncompressedSha256: sha256(uncompressed),
      },
      unresolvedRequirementsInspected: sourceItem.unresolvedRequirements,
      domains,
    });
  }

  const domainCount = items.reduce((sum, item) => sum + item.domains.length, 0);
  const requirementCount = items.reduce((sum, item) => sum + item.unresolvedRequirementsInspected, 0);
  const placementPathCount = items.reduce((sum, item) =>
    sum + item.domains.reduce((domainSum, domain) => domainSum + domain.pathCount, 0), 0);
  invariant(domainCount === 17 && requirementCount === 34,
    `Expected 17 domains and 34 requirements, found ${domainCount} and ${requirementCount}`);
  return {
    schemaVersion: 1,
    reportType: "g4-l3-unresolved-root-entry-placement-path-audit",
    generator: binding(generatorRecord),
    sourceRootEntrySuccessor: binding(sourceRecord),
    method: {
      parser: "Python xml.etree.ElementTree over the hash-bound gzip swfmill XML",
      pathEnumeration: "all simple PlaceObject/PlaceObject2/PlaceObject3 sprite-placement paths from root to each target",
      decisionRule: "every simple root path must begin at one identical positive root frame through the lesson animation host instance",
      limitation: "source-static placement identity only; no ActionScript execution or original-runtime observation",
    },
    items,
    summary: {
      workspaces: items.length,
      requirementsInspected: requirementCount,
      targetFrameDomains: domainCount,
      simplePlacementPaths: placementPathCount,
      uniqueSourceProvenRootEntryFrames: [6],
      sourceResolvableRequirements: requirementCount,
      ambiguousRequirements: 0,
      authoritativeRuntimeSessions: 0,
      fidelityAcceptances: 0,
      audioAcceptances: 0,
      humanDecisions: 0,
      strictCompletions: 0,
    },
    acceptance: {
      authoritativeOriginalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; source-static placement identity audit only",
  };
}

function markdown(report) {
  return `# G4 L3 unresolved root-entry placement-path audit\n\n`
    + `The hash-bound swfmill placement graph resolves all **${report.summary.requirementsInspected}** previously unresolved EN/ES requirements across **${report.summary.targetFrameDomains}** frame domains and **${report.summary.workspaces}** workspaces to root frame **6**.\n\n`
    + `The audit enumerated **${report.summary.simplePlacementPaths}** simple root-to-target placement paths. Every path begins through the lesson \`animation\` host at root frame 6; no conflicting root frame was found.\n\n`
    + `This is a source-static identity result only. Authoritative original-runtime sessions, fidelity acceptance, audio listening acceptance, human review, Owner acceptance, strict completion, and publication remain **0 / 0 / 0 / 0 / 0 / 0 / 0**.\n`;
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

export async function run({write = false} = {}) {
  const report = await buildReport();
  const reportBytes = Buffer.from(pretty(report));
  const markdownBytes = Buffer.from(markdown(report));
  if (write) {
    await atomicWrite(REPORT_PATH, reportBytes);
    await atomicWrite(MARKDOWN_PATH, markdownBytes);
  } else {
    const [existingReport, existingMarkdown] = await Promise.all([record(REPORT_PATH), record(MARKDOWN_PATH)]);
    invariant(existingReport.bytesValue.equals(reportBytes), "Root-entry placement-path report is stale");
    invariant(existingMarkdown.bytesValue.equals(markdownBytes), "Root-entry placement-path Markdown is stale");
  }
  return report;
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.sourceResolvableRequirements}/34 unresolved requirements have one source-proven root entry frame; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
