import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ANIMATION_ID,
  classifySideEffects,
  extractLineExcerpt,
  parseArguments,
  parseSwfHeader,
  parseSwfmillPlacementProof,
} from "./build-rw002-original-host-entry-contract.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const auditRoot = path.join(root, "migrations", ANIMATION_ID, "audit");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(auditRoot, relativePath), "utf8"));
}

function allContractExcerpts(contract) {
  return Object.values(contract.contracts).flatMap((item) => item.evidence || []);
}

test("argument parser exposes deterministic generation and check modes", () => {
  assert.deepEqual(parseArguments([]), {check: false, ffdec: "ffdec", swfmill: "swfmill", root});
  const parsed = parseArguments(["--check", "--ffdec", "/tmp/ffdec", "--swfmill", "/tmp/swfmill", "--root", "/tmp/project"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.ffdec, "/tmp/ffdec");
  assert.equal(parsed.swfmill, "/tmp/swfmill");
  assert.equal(parsed.root, "/tmp/project");
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
  assert.throws(() => parseArguments(["--ffdec"]), /requires a value/);
});

test("SWF header parser records compressed and declared sizes without conflating them", async () => {
  const host = await readFile(path.join(root, "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/index_local.swf"));
  const header = parseSwfHeader(host);
  assert.deepEqual(header, {
    signature: "CWS",
    compression: "zlib",
    swfVersion: 6,
    actualCompressedBytes: 676556,
    declaredUncompressedBytes: 950711,
    rectNBits: 15,
    stageRectTwips: {xMin: 0, xMax: 16000, yMin: 0, yMax: 12000},
    nativeStage: {width: 800, height: 600},
    rawFrameRateFixed8: 3072,
    fps: 12,
    rootFrameCount: 50,
  });
});

test("line excerpt hashing is line-ending independent but line-number exact", () => {
  const definition = {
    excerptId: "fixture",
    script: "fixture.as",
    lineStart: 2,
    lineEnd: 3,
    mustContain: ["second", "third"],
  };
  const excerpt = extractLineExcerpt(Buffer.from("first\r\nsecond\r\nthird\r\n"), definition);
  assert.equal(excerpt.text, "second\nthird\n");
  assert.equal(excerpt.excerptSha256, sha256(excerpt.text));
  assert.throws(() => extractLineExcerpt(Buffer.from("first\nsecond\n"), definition), /exceeds/);
});

test("side-effect classifier inventories every guarded API class", () => {
  const findings = classifySideEffects([{relativePath: "fixture.as", raw: Buffer.from([
    "getURL(target);",
    "loadVariablesNum(url, 0, \"POST\");",
    "fscommand(\"quit\");",
    "SharedObject.getLocal(\"x\");",
    "F_X.load(path);",
    "clip.loadMovie(path);",
    "sound.loadSound(path, 1);",
  ].join("\n"))}]);
  assert.deepEqual(findings.map(({api}) => api), [
    "getURL",
    "loadVariablesNum",
    "fscommand",
    "SharedObject.getLocal",
    "XML.load",
    "MovieClip.loadMovie",
    "Sound.loadSound",
  ]);
});

test("swfmill placement parser proves the root-50 glossary to keyterms chain", () => {
  const xml = Buffer.from(`<?xml version="1.0"?>
<swf>
  <Header>
    <tags>
      <ShowFrame/>
      <DefineSprite objectID="696" frames="1">
        <tags><ShowFrame/></tags>
      </DefineSprite>
      <DefineSprite objectID="697" frames="1">
        <tags>
          <PlaceObject2 replace="0" depth="1" objectID="696" name="keyterms" allflags1="192" allflags2="0">
          </PlaceObject2>
          <ShowFrame/>
        </tags>
      </DefineSprite>
${"      <ShowFrame/>\n".repeat(48)}      <PlaceObject2 replace="0" depth="82" objectID="697" morph="49" name="glossary" allflags1="0" allflags2="0">
      </PlaceObject2>
      <ShowFrame/>
    </tags>
  </Header>
</swf>
`);
  const proof = parseSwfmillPlacementProof(xml);
  assert.deepEqual(proof.placements.map(({timelineId, frame, depth, objectId, instanceName}) => ({timelineId, frame, depth, objectId, instanceName})), [
    {timelineId: "root", frame: 50, depth: 82, objectId: 697, instanceName: "glossary"},
    {timelineId: "sprite-697", frame: 1, depth: 1, objectId: 696, instanceName: "keyterms"},
  ]);
});

test("checked-in entry contract is source/hash/excerpt bound and makes no runtime claim", async () => {
  const contract = await loadJson("original-host-entry-contract.json");
  assert.equal(contract.animationId, ANIMATION_ID);
  assert.equal(contract.sourceHost.sha256, sha256(await readFile(path.join(root, contract.sourceHost.path))));
  assert.deepEqual(contract.sourceHost.header, parseSwfHeader(await readFile(path.join(root, contract.sourceHost.path))));
  assert.equal(contract.extractedScripts.fullExportFileCount, 570);
  assert.equal(contract.extractedScripts.selectedArtifactCount, 17);
  assert.deepEqual(contract.extractedScripts.childDependencyScans.map(({scriptCount, externalOrDynamicLoadFindingCount}) => ({scriptCount, externalOrDynamicLoadFindingCount})), [
    {scriptCount: 9, externalOrDynamicLoadFindingCount: 0},
    {scriptCount: 6, externalOrDynamicLoadFindingCount: 0},
  ]);

  for (const artifact of contract.extractedScripts.selectedArtifacts) {
    const raw = await readFile(path.join(root, artifact.path));
    assert.equal(raw.length, artifact.bytes, artifact.path);
    assert.equal(sha256(raw), artifact.sha256, artifact.path);
  }

  for (const evidence of allContractExcerpts(contract)) {
    const raw = await readFile(path.join(root, evidence.artifact));
    const rebuilt = extractLineExcerpt(raw, {
      excerptId: evidence.excerptId,
      script: evidence.artifact,
      lineStart: evidence.lineStart,
      lineEnd: evidence.lineEnd,
      mustContain: [],
    });
    assert.equal(rebuilt.text, evidence.text, evidence.excerptId);
    assert.equal(rebuilt.excerptSha256, evidence.excerptSha256, evidence.excerptId);
  }

  assert.equal(contract.authority.originalRuntimeExecutedByThisArtifact, false);
  assert.equal(contract.authority.naturalTraceFramesCapturedByThisArtifact, 0);
  assert.equal(contract.authority.audioListeningPerformedByThisArtifact, false);
  assert.equal(contract.authority.baselineAuthorityClaimed, false);
});

test("minimal tree contains only five proven files and deny list is fail closed", async () => {
  const tree = await loadJson("original-host-minimal-tree.json");
  const deny = await loadJson("original-host-side-effect-deny-list.json");
  assert.equal(tree.requiredFileCount, 5);
  assert.equal(tree.requiredTotalBytes, 6278724);
  assert.deepEqual(tree.expectedRelativeLayoutFromArchiveRoot, [
    "HELP_COURSES/ELMGR5/L13/index_local.swf",
    "HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf",
    "HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
    "HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
  ]);
  let totalBytes = 0;
  for (const source of tree.requiredFiles) {
    const raw = await readFile(path.join(root, source.path));
    assert.equal(raw.length, source.bytes, source.path);
    assert.equal(sha256(raw), source.sha256, source.path);
    totalBytes += raw.length;
  }
  assert.equal(tree.requiredTotalBytes, totalBytes);
  assert.equal(tree.validation.wholeLessonTreeRequired, false);
  assert.equal(tree.validation.automaticKeytermRequestRuntimeResultPending, true);
  assert.match(tree.minimalityConditions.join("\n"), /fresh ephemeral Flash profile/);
  assert.match(tree.minimalityConditions.join("\n"), /Do not open or interact with glossary/);
  assert.match(tree.minimalityConditions.join("\n"), /frame 1873/);
  assert.equal(deny.defaultPolicy, "deny-all-external-effects-and-dynamic-loads-except-hash-bound-local-read-allowlist");
  assert.deepEqual(deny.sourceFindings.counts, {
    "MovieClip.loadMovie": 5,
    "SharedObject.getLocal": 1,
    "Sound.loadSound": 1,
    "XML.load": 2,
    "fscommand": 5,
    "getURL": 3,
    "loadVariablesNum": 3,
  });
  assert.deepEqual(deny.localReadAllowlist.map(({sha256: hash}) => hash), tree.requiredFiles.map(({sha256: hash}) => hash));
  assert.equal(deny.authority.sandboxEnforcedByThisArtifact, false);
});

test("placement proof is bound by the entry contract and preserves the unretained XML digest", async () => {
  const contract = await loadJson("original-host-entry-contract.json");
  const proof = await loadJson("original-host-placement-proof.json");
  const proofRaw = await readFile(path.join(auditRoot, "original-host-placement-proof.json"));
  assert.equal(contract.toolchain.swfmill.structuralProof.sha256, sha256(proofRaw));
  assert.equal(proof.transientXml.sha256, "6317e85312ca48c4d2b8efd3a9dd6502684291755ae002e05596f93d0b36330b");
  assert.equal(proof.transientXml.bytes, 8306182);
  assert.deepEqual(proof.structuralChain.placements.map(({timelineId, frame, objectId, instanceName}) => ({timelineId, frame, objectId, instanceName})), [
    {timelineId: "root", frame: 50, objectId: 697, instanceName: "glossary"},
    {timelineId: "sprite-697", frame: 1, objectId: 696, instanceName: "keyterms"},
  ]);
});
