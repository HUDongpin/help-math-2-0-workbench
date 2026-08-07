import {createHash} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function writeAcceptedNoAudioEvidence(workspace, manifest) {
  const machineEvidence = {};
  for (const [id, file] of Object.entries({
    swfmillSummary: "audit/machine/swfmill-summary.json",
    swfmillXml: "audit/machine/swfmill.xml.gz",
    ffdecScripts: "audit/machine/ffdec-scripts.txt.gz",
    ffdecTags: "audit/machine/ffdec-tags.txt.gz",
  })) {
    const bytes = Buffer.from(`${id} strict no-audio fixture\n`);
    await mkdir(path.dirname(path.join(workspace, file)), {recursive: true});
    await writeFile(path.join(workspace, file), bytes);
    machineEvidence[id] = {file, sha256: digest(bytes)};
  }
  const checks = [
    "source-swf-hash", "swf-audio-tags", "parsed-audio-structures", "actionscript-audio-operations",
    "catalog-audio-associations", "basename-mp3", "keyterm-xml-placement", "catalog-placement",
  ].map((id) => ({id, passed: true}));
  const audit = {
    schemaVersion: 2,
    animationId: manifest.animationId,
    migrationStatusBefore: null,
    migrationStatusBinding: "excluded-from-structural-audio-evidence",
    migrationStatusUnchanged: true,
    source: {swf: manifest.source.swf, expectedSha256: manifest.source.swfSha256, observedSha256: manifest.source.swfSha256, hashMatches: true},
    externalAudio: {exactAssociations: [], lessonGroupCandidates: [], expectedButMissing: [], missingExpectedCount: 0},
    embeddedAudio: {defineSounds: [], soundStreams: []},
    actionScriptAudioOperations: [],
    inventory: {file: "audio-inventory.csv", rowCount: 0},
    strictNoAudioAssessment: {
      eligible: true,
      decision: "accepted-not-required",
      scope: "shipped-SWF-and-preserved-host-placement-audio-reachability",
      checks,
      source: {swf: manifest.source.swf, expectedSha256: manifest.source.swfSha256, observedSha256: manifest.source.swfSha256},
      machineEvidence,
      archiveAssociationEvidence: {},
    },
    acceptance: {structurallyAudited: true, strictAudioAcceptance: "accepted-not-required"},
  };
  await mkdir(path.join(workspace, "audit"), {recursive: true});
  await writeFile(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${JSON.stringify(audit, null, 2)}\n`);
}
