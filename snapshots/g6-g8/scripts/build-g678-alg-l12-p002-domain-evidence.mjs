#!/usr/bin/env node

// Source-only P002 evidence builder. This does not change a candidate or an acceptance gate.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

import {buildDispositionReport} from "./build-frame-domain-dispositions.mjs";
import {validateFrameDomainDisposition} from "../skills/flash-to-js/scripts/validate_migration.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(projectRoot, "migrations/shared-alg001-l12-p002");
const audit = path.join(workspace, "audit");
const sourceRoot = "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware";
const sourceSwf = path.join(sourceRoot, "G6-G8-shared/ALG001/L12/RW/L12RW02.swf");
const courseXml = path.join(sourceRoot, "G6-G8-shared/ALG001/L12/index.xml");
const xmlPath = path.join(audit, "movie.xml");
const scenarioPath = path.join(audit, "scenario-inventory.json");
const dispositionPath = path.join(audit, "frame-domain-disposition.json");
const id = "shared-alg001-l12-p002";
const sourceSha = "15e67732b739f0194087ded0748c2d23f9871363ed33388807c351f2aad6fb62";
const xmlSha = "9332ec48d2a17395e7d37c593b5336aa47bb0a821ba135fb3e350d425af19aee";
const courseXmlSha = "0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325";
const expectedFrames = new Map([["root", 10], ["sprite-43", 22], ["sprite-389", 36], ["sprite-449", 19], ["sprite-451", 36], ["sprite-454", 1951], ["sprite-458", 1]]);
const scriptFiles = [
  ["ffdec-scripts", "audit/ffdec-26.2.1-source-v1/scripts/frame_1/DoAction.as", "root", 1],
  ["ffdec-root-frame-6", "audit/ffdec-26.2.1-source-v1/scripts/frame_6/DoAction.as", "root", 6],
  ["ffdec-sprite-454-frame-1", "audit/ffdec-26.2.1-source-v1/scripts/DefineSprite_454/frame_1/DoAction.as", "sprite-454", 1],
  ["ffdec-sprite-454-frame-1951", "audit/ffdec-26.2.1-source-v1/scripts/DefineSprite_454/frame_1951/DoAction.as", "sprite-454", 1951],
];

const PYTHON_EXTRACTOR = String.raw`
import json, sys, xml.etree.ElementTree as ET
r = ET.parse(sys.argv[1]).getroot()
h = r.find('Header')
tags = h.find('tags')
sprites = {e.get('objectID'): e for e in tags if e.tag == 'DefineSprite'}
def scan(timeline_id, object_id, tag_list, declared):
    frame = 1
    placements, removals, labels, actions = [], [], [], []
    sound = {'streamHeads': 0, 'streamBlocks': 0}
    for ordinal, e in enumerate(tag_list):
        if e.tag == 'ShowFrame': frame += 1
        elif e.tag == 'FrameLabel': labels.append({'frame': frame, 'label': e.get('label', '')})
        elif e.tag in ('DoAction', 'DoInitAction'):
            actions.append({'frame': frame, 'tag': e.tag, 'tagOrdinal': ordinal})
        elif e.tag.startswith('PlaceObject'):
            transform = next((x for x in e.iter() if x.tag == 'Transform'), None)
            placements.append({'frame': frame, 'tag': e.tag, 'tagOrdinal': ordinal,
                'objectId': e.get('objectID'), 'depth': e.get('depth'),
                'name': e.get('name', ''), 'replace': e.get('replace', ''),
                'hasClipActions': any(x.tag == 'ClipActionRecord' for x in e.iter()),
                'attributes': dict(e.attrib),
                'transform': dict(transform.attrib) if transform is not None else None})
        elif e.tag in ('RemoveObject', 'RemoveObject2'):
            removals.append({'frame': frame, 'tag': e.tag, 'tagOrdinal': ordinal,
                'objectId': e.get('objectID'), 'depth': e.get('depth')})
        elif e.tag == 'SoundStreamHead': sound['streamHeads'] += 1
        elif e.tag == 'SoundStreamBlock': sound['streamBlocks'] += 1
    return {'timelineId': timeline_id, 'objectId': object_id, 'frameCount': int(declared),
        'observedShowFrameCount': frame - 1, 'placements': placements,
        'removals': removals, 'frameLabels': labels, 'actionFrames': actions,
        'soundStreamTags': sound}
timelines = [scan('root', None, tags, h.get('frames'))]
for oid, e in sorted(sprites.items(), key=lambda pair: int(pair[0])):
    timelines.append(scan('sprite-' + oid, oid, e.find('tags'), e.get('frames')))
by_object = {t['objectId']: t for t in timelines if t['objectId']}
reachable = {'root'}
queue = [timelines[0]]
for parent in queue:
    for p in parent['placements']:
        child = by_object.get(p['objectId'])
        if child and child['timelineId'] not in reachable:
            reachable.add(child['timelineId'])
            queue.append(child)
for t in timelines:
    t['structuralReachability'] = ('root' if t['timelineId'] == 'root' else
        'reachable-from-root-placement-graph' if t['timelineId'] in reachable else
        'not-proven-by-root-placement-graph')
print(json.dumps({'header': dict(h.attrib), 'timelines': timelines,
    'buttonDefinitionCount': sum(e.tag in ('DefineButton','DefineButton2') for e in tags),
    'editTextDefinitionCount': sum(e.tag == 'DefineEditText' for e in tags),
    'globalDoInitActionCount': sum(e.tag == 'DoInitAction' for e in tags)}, separators=(',',':')))
`;

function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function json(value) { return `${JSON.stringify(value, null, 2)}\n`; }
async function fileHash(p) { return hash(await readFile(p)); }
async function artifact(artifactId, absolutePath, extra = {}) {
  return {artifactId, path: absolutePath, sha256: await fileHash(absolutePath), ...extra};
}

async function build() {
  const rootInfo = await lstat(sourceRoot);
  assert.equal(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), true, "physical AWS source root is not a real directory");
  assert.equal(await fileHash(sourceSwf), sourceSha, "physical AWS source SWF drift");
  assert.equal(await fileHash(xmlPath), xmlSha, "swfmill XML drift");
  assert.equal(await fileHash(courseXml), courseXmlSha, "physical lesson XML drift");
  assert.match(await readFile(courseXml, "utf8"), /<Page Title="Page 1" RandomAudio="" BGText="">RW\/L12RW02\.swf<\/Page>/,
    "exact active P002 lesson placement is absent");
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  assert.equal(manifest.animationId, id);
  assert.equal(manifest.source.swf, sourceSwf);
  assert.equal(manifest.source.swfSha256, sourceSha);
  const parsed = spawnSync("python3", ["-c", PYTHON_EXTRACTOR, xmlPath], {
    encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
  });
  if (parsed.status !== 0) throw new Error(`source XML extraction failed: ${parsed.stderr}`);
  const structure = JSON.parse(parsed.stdout);
  assert.equal(Number(structure.header.frames), 10);
  assert.equal(Number(structure.header.framerate), 12);
  assert.equal(structure.timelines.length, expectedFrames.size, "sprite definition count drift");
  for (const timeline of structure.timelines) {
    assert.equal(timeline.frameCount, expectedFrames.get(timeline.timelineId), `${timeline.timelineId} frame count drift`);
    assert.equal(timeline.observedShowFrameCount, timeline.frameCount, `${timeline.timelineId} ShowFrame mismatch`);
    assert.notEqual(timeline.structuralReachability, "not-proven-by-root-placement-graph", `${timeline.timelineId} lost root reachability`);
  }
  assert.equal(structure.buttonDefinitionCount, 0);
  assert.equal(structure.editTextDefinitionCount, 0);
  assert.equal(structure.globalDoInitActionCount, 0);
  const byId = new Map(structure.timelines.map(t => [t.timelineId, t]));
  const edges = structure.timelines.flatMap(t => t.placements.filter(p => byId.has(`sprite-${p.objectId}`)).map(p => ({parent: t.timelineId, child: `sprite-${p.objectId}`, frame: p.frame, depth: p.depth})));
  assert.deepEqual(edges.filter(e => e.parent === "root"), [
    {parent: "root", child: "sprite-454", frame: 6, depth: "1"},
    {parent: "root", child: "sprite-458", frame: 6, depth: "147"},
  ]);
  assert.deepEqual(edges.filter(e => e.parent === "sprite-454").map(e => [e.child, e.frame]), [
    ["sprite-43", 24], ["sprite-389", 1201], ["sprite-449", 1951], ["sprite-451", 1951],
  ]);
  assert.equal(byId.get("sprite-454").soundStreamTags.streamBlocks, 1927);

  const scriptEvidence = [];
  for (const [artifactId, relative, timelineId, frame] of scriptFiles) {
    const bytes = await readFile(path.join(workspace, relative));
    scriptEvidence.push({artifactId, path: relative, sha256: hash(bytes), timelineId, frame,
      statement: bytes.toString("utf8").trim() || "empty exported action body"});
  }
  const actualActionCoords = structure.timelines.flatMap(t => t.actionFrames.map(a => `${t.timelineId}:${a.frame}:${a.tag}`)).sort();
  const expectedActionCoords = scriptEvidence.map(s => `${s.timelineId}:${s.frame}:DoAction`).sort();
  assert.deepEqual(actualActionCoords, expectedActionCoords, "XML action tags differ from four FFDec frame exports");
  const technicalSha = technicalManifestSha256(manifest);
  const evidenceIndex = [
    {artifactId: "migration-technical-contract", path: "migration.json", sha256: technicalSha,
      projection: TECHNICAL_MANIFEST_PROJECTION.id, hashMode: "canonical-json-v1",
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths]},
    await artifact("source-swf", sourceSwf),
    await artifact("swfmill-xml", xmlPath),
    await artifact("course-xml", courseXml),
    ...scriptEvidence.map(({artifactId, path: relative, sha256}) => ({artifactId, path: relative, sha256})),
  ];
  evidenceIndex[2].path = "audit/movie.xml";
  const timelines = structure.timelines.map(t => {
    const reasons = new Map();
    const add = (frame, reason) => {
      if (!reasons.has(frame)) reasons.set(frame, new Set());
      reasons.get(frame).add(reason);
    };
    add(1, "initial-one-indexed-frame"); add(t.frameCount, "terminal-structural-frame");
    for (const a of t.actionFrames) add(a.frame, `structural-action:${a.tag}`);
    for (const l of t.frameLabels) add(l.frame, `frame-label:${l.label}`);
    return {...t, frameDomain: {indexing: "one-indexed", start: 1, endInclusive: t.frameCount,
      captureRequirement: "every-frame-for-every-reachable-runtime-scenario"},
      namedPlacements: t.placements.filter(p => p.name).map(({frame, tag, objectId, depth, name, replace, hasClipActions}) => ({frame, tag, objectId, depth, name, replace, hasClipActions})),
      controlStates: [...reasons].sort((a,b) => a[0]-b[0]).map(([frame, values]) => ({frame, reasons: [...values].sort(), evidence: [{artifactId: "swfmill-xml", timelineId: t.timelineId}]})),
      evidence: {artifactId: "swfmill-xml", timelineId: t.timelineId}};
  });
  const inventory = {
    schemaVersion: 1, animationId: id, inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authorityStatement: [
      "This source-only inventory enumerates every sprite definition and every timeline reachable from the root placement graph of the exact physical AWS SWF.",
      "XML coordinates, placements, removals, script tags, and sound tag counts are structural facts; they do not establish original-runtime clock behavior or audio synchronization.",
      "No original-runtime trace, human decision, strict disposition, candidate module, or registry state is altered by this audit."
    ],
    source: {swf: sourceSwf, swfSha256: sourceSha, fla: null, flaSha256: null,
      pairedFlaStatus: "missing", stage: {width: 800, height: 600}, fps: 12,
      rootFrameCount: 10, actionScriptVersion: "AVM1"},
    courseXml: {artifact: evidenceIndex.find(e => e.artifactId === "course-xml"),
      currentPlacement: {section: "RW", page: 2, sourceRelativePath: "RW/L12RW02.swf",
        catalogTitle: "Page 1", randomAudioAttribute: "", bgTextAttribute: "",
        verification: "exact active Page element in physical lesson index.xml"}},
    evidenceIndex, authoritativeRuntimeEvidence: [],
    staticExtraction: {tool: "swfmill 0.3.6 XML plus FFDec 26.2.1 frame-script exports",
      method: "all root and DefineSprite tag lists; placement-graph closure over objectID",
      spriteDefinitionCount: structure.timelines.length - 1, reachableTimelineCount: timelines.length,
      placementEdgeCount: edges.length, placementEdges: edges, scriptEvidence,
      buttonDefinitionCount: structure.buttonDefinitionCount,
      editTextDefinitionCount: structure.editTextDefinitionCount,
      globalDoInitActionCount: structure.globalDoInitActionCount,
      sourceSupportedScenarioCandidates: [
        {id: "root-preloader", evidence: {artifactId: "ffdec-scripts"}, schedule: "pending-original-host-jump_check-resolution"},
        {id: "begin-composed-stage", evidence: {artifactId: "swfmill-xml"}, schedule: "pending-natural-root-and-nested-clock-trace"},
        {id: "main-stream-terminal", evidence: {artifactId: "ffdec-sprite-454-frame-1951"}, schedule: "pending-natural-clock-and-audio-trace"}
      ]},
    timelineInventory: timelines,
    interactions: {handlers: [], nonEventScripts: scriptEvidence,
      buttonDefinitions: [], editTexts: [], dragHandlers: [], correctHandlers: [], wrongHandlers: [],
      replayAndTerminal: {sourceStops: [{timelineId: "root", frame: 1}, {timelineId: "root", frame: 6}, {timelineId: "sprite-454", frame: 1951}],
        hostNavigation: "_level0.InternalPreloader.gotoAndPlay(jump_check) at root frame 1; target definition is external to this SWF",
        naturalReplay: "unverified"}},
    dependencies: {bindings: [{name: "_level0.InternalPreloader.jump_check", status: "external-host-unresolved", evidence: {artifactId: "ffdec-scripts"}},
      {name: "catalog lesson-SA MP3 versus embedded stream", status: "timing-language-transport-unresolved", evidence: {artifactId: "source-swf"}}],
      flashVarsCandidates: [], safeSideEffectPolicy: [], fixtureRule: "No legacy host action is executed in this source audit."},
    coverage: {acceptanceObligationsFromReadiness: [], timelineStateCoverage: timelines.map(t => ({timelineId: t.timelineId, frameCount: t.frameCount, status: "structural-only"})),
      handlerBehaviorGroups: [], buttonTargetObligations: [], inputObligations: [], dragObligations: [],
      correctWrongObligations: [], conditionalBranchObligations: [], randomObligations: [],
      labeledStateObligations: [{timelineId: "root", frame: 6, label: "begin"}],
      glossaryAndHyperlinkObligations: [], sectionMenuObligations: [], courseRouteObligations: [],
      replayAndTerminalObligations: ["root frame 1 host jump target", "root frame 6 stop", "sprite-454 frame 1951 stop", "natural replay pending"],
      sideEffectObligations: [], dependencyFixtureObligations: [], authoritativeRuntimeCoverage: [],
      minimumSetRule: "Natural traces and full-frame requirements pending; do not synthesize a frame schedule from XML coordinates."},
    conflicts: [],
    unknowns: [
      {id: "root-entry-clock", statement: "How the external InternalPreloader jump_check reaches begin and starts child 454 is unverified.", resolution: "authorized original-host natural trace", evidence: {artifactId: "ffdec-scripts"}},
      {id: "nested-playheads", statement: "Local clocks, resets, persistence, and terminal composition of 43/389/449/451/458 are unverified.", resolution: "source-supported natural traces and original-runtime observation", evidence: {artifactId: "swfmill-xml"}},
      {id: "audio-synchronization", statement: "The 1927 stream blocks and catalog lesson-SA MP3 have unresolved original playback relationship, language, and listening acceptance.", resolution: "original-host timing and named-human listening", evidence: {artifactId: "source-swf"}},
    ],
    strictAcceptanceEffect: "none; this structural inventory cannot satisfy original-runtime, fidelity, audio, human, owner, or strict-completion acceptance"
  };
  const courseSchema = JSON.parse(await readFile(path.join(projectRoot, "schemas/course-scenario-inventory.schema.json"), "utf8"));
  // The shared G6-G8 ID is outside the course/shell ID pattern. Keep that generic schema intact;
  // adapt only its ID field in this focused validation to the exact P002 identity.
  const focusedSchema = {...courseSchema, properties: {...courseSchema.properties,
    animationId: {const: id}}};
  const validate = new Ajv({allErrors: true, strict: false}).compile(focusedSchema);
  assert.equal(validate(inventory), true, JSON.stringify(validate.errors));
  const scenarioText = json(inventory);
  const report = buildDispositionReport({animationId: id, inventory,
    inventorySha256: hash(Buffer.from(scenarioText)), manifest,
    manifestSha256: technicalSha});
  return {scenarioText, dispositionText: json(report), report};
}

const mode = process.argv[2] || "--check";
if (!["--check", "--write"].includes(mode)) throw new Error("Use --check or --write");
const {scenarioText, dispositionText, report} = await build();
if (mode === "--write") {
  await writeFile(scenarioPath, scenarioText, {flag: "wx"});
  await writeFile(dispositionPath, dispositionText, {flag: "wx"});
} else {
  assert.equal(await readFile(scenarioPath, "utf8"), scenarioText, "P002 scenario inventory drift");
  assert.equal(await readFile(dispositionPath, "utf8"), dispositionText, "P002 disposition drift");
}
const errors = [];
const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
const validation = await validateFrameDomainDisposition({root: workspace, manifest, errors});
assert.equal(validation.applicable, true);
assert.deepEqual(validation.unresolvedTimelineIds, ["sprite-43", "sprite-389", "sprite-449", "sprite-451", "sprite-458"]);
assert.deepEqual(errors, [
  "frame-domain disposition status is not strict-ready",
  "frame-domain disposition has 5 unresolved structurally reachable timeline(s): sprite-43, sprite-389, sprite-449, sprite-451, sprite-458",
], "unexpected canonical validator error");
console.log(`${mode}: ${report.summary.enumeratedTimelineCount} reachable timelines; ${report.summary.dispositionCounts.unresolved} unresolved; source ${sourceSha}`);
