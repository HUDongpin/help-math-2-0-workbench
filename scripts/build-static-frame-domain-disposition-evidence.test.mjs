import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gunzipSync, gzipSync} from "node:zlib";
import Ajv from "ajv";

import {
  G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS,
  G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS,
  INDIRECT_DECLARED_PARENT_DISQUALIFIER,
  NESTED_DECLARED_PARENT_BINDING_MODE,
  buildStaticCompositeEvidenceDocument,
  buildStaticFrameDomainDispositionEvidence,
  deriveMultiFrameScriptlessCandidateAudit,
  deriveNestedDeclaredParentScriptlessCandidateSpecs,
  parseArguments,
  parseFfdecDispositionScripts,
  parseSwfmillDispositionStructure,
} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function repeat(value, count) {
  return Array.from({length: count}, () => value).join("\n");
}

function fixture({
  soundBlockCount = 3,
  rootTranslationX = -1000,
  disposition = "composite-child-with-parent",
  parentTimelineId = "sprite-21",
  parentClipActions = false,
} = {}) {
  const animationId = "course-static-composite-fixture";
  const sourceSwfBytes = Buffer.from("static composite fixture SWF");
  const childFrameCount = 3;
  const parentFrameCount = 7;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="3">
    <size><Rectangle left="0" right="2000" top="0" bottom="2000"/></size>
    <tags>
      <DefineShape objectID="6">
        <bounds><Rectangle left="-100" right="100" top="-100" bottom="100"/></bounds>
        <styles/><shapes/>
      </DefineShape>
      <DefineSprite objectID="7" frames="3">
        <tags>
          <SoundStreamHead playbackRate="2" playbackStereo="1" compression="2"/>
          <DoAction><actions><Stop/><EndAction/></actions></DoAction>
          <PlaceObject2 replace="0" depth="1" objectID="6"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          ${repeat("<SoundStreamBlock><data>AA==</data></SoundStreamBlock>", soundBlockCount)}
          ${repeat("<ShowFrame/>", childFrameCount)}
          <DoAction><actions><Stop/><EndAction/></actions></DoAction>
          <End/>
        </tags>
      </DefineSprite>
      <DefineSprite objectID="21" frames="7">
        <tags>
          <DoAction><actions><Random/><EndAction/></actions></DoAction>
          <PlaceObject2 replace="0" depth="16" objectID="7" name="Mc_Sound_0"><transform><Transform transX="0" transY="0"/></transform>${parentClipActions ? "<clipActions><ClipActionRecords/></clipActions>" : ""}</PlaceObject2>
          ${repeat("<ShowFrame/>", 5)}
          <RemoveObject2 depth="16"/>
          ${repeat("<ShowFrame/>", 2)}
          <End/>
        </tags>
      </DefineSprite>
      <ShowFrame/>
      <PlaceObject2 replace="0" depth="1" objectID="21" name="animation"><transform><Transform transX="${rootTranslationX}" transY="1000"/></transform></PlaceObject2>
      <ShowFrame/>
      <ShowFrame/>
      <End/>
    </tags>
  </Header>
</swf>
`;
  const scripts = `===== DefineSprite_21/frame_1/DoAction.as =====
tempNum = random(2);
_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;

===== DefineSprite_21/frame_5/DoAction.as =====
eval(_global.tempRandomSoundMc).gotoAndPlay(2);

===== DefineSprite_7/frame_1/DoAction.as =====
stop();

===== DefineSprite_7/frame_3/DoAction.as =====
stop();
`;
  const swfmillGzip = gzipSync(xml);
  const scriptsGzip = gzipSync(scripts);
  const manifest = {
    animationId,
    source: {swf: "source.swf", swfSha256: digest(sourceSwfBytes)},
    runtime: {frameCount: 3},
    implementation: {
      frameDomains: [
        {id: "root", sourceTimelineId: "root", frameCount: 3},
        {id: "sprite-21", sourceTimelineId: "sprite-21", frameCount: parentFrameCount},
      ],
    },
  };
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    evidenceIndex: [
      {artifactId: "source-swf", path: "source.swf", sha256: digest(sourceSwfBytes)},
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      {
        artifactId: "swfmill-xml",
        path: "audit/machine/swfmill.xml.gz",
        sha256: digest(swfmillGzip),
        uncompressedSha256: digest(xml),
      },
      {
        artifactId: "ffdec-scripts",
        path: "audit/machine/ffdec-scripts.txt.gz",
        sha256: digest(scriptsGzip),
        uncompressedSha256: digest(scripts),
      },
    ],
    timelineInventory: [
      {timelineId: "root", objectId: null, frameCount: 3, structuralReachability: "root"},
      {timelineId: "sprite-7", objectId: "7", frameCount: childFrameCount, structuralReachability: "reachable-from-root-placement-graph"},
      {timelineId: "sprite-21", objectId: "21", frameCount: parentFrameCount, structuralReachability: "reachable-from-root-placement-graph"},
    ],
  };
  const claimSpecs = [{
    timelineId: "sprite-7",
    sourceObjectId: "7",
    frameCount: childFrameCount,
    disposition,
    parentTimelineId,
    parentSourceObjectId: "21",
    parentFrameDomainId: "sprite-21",
    parentInstanceName: "Mc_Sound_0",
    parentPlacementFrame: 1,
    parentDepth: "16",
    parentRemovalFrame: 6,
    rootInstanceName: "animation",
    rootPlacementFrame: 2,
    rootDepth: "1",
    selectorOutcome: 0,
    role: "audio-only-offstage-visual-marker",
    expectedTagCensus: {
      DoAction: 2,
      End: 1,
      PlaceObject2: 1,
      ShowFrame: childFrameCount,
      SoundStreamBlock: childFrameCount,
      SoundStreamHead: 1,
    },
  }];
  return {
    animationId,
    manifest,
    inventory,
    inventorySha256: digest(JSON.stringify(inventory)),
    sourceSwfBytes,
    swfmillGzip,
    scriptsGzip,
    claimSpecs,
  };
}

function singleFrameFixture({
  targetDoAction = false,
  targetDoInitAction = false,
  targetFfdecFrameScript = false,
  incomingClipActions = false,
  outgoingClipActions = false,
  declareTargetDomain = false,
  timelineIds = ["sprite-5"],
  expectedTimelineCount = timelineIds.length,
} = {}) {
  const animationId = "course-single-frame-structural-fixture";
  const sourceSwfBytes = Buffer.from("single-frame structural fixture SWF");
  const clipActions = "<clipActions><ClipActionRecords/></clipActions>";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="2">
    <size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size>
    <tags>
      <DefineShape objectID="4"><bounds><Rectangle left="0" right="100" top="0" bottom="100"/></bounds><styles/><shapes/></DefineShape>
      <DefineSprite objectID="5" frames="1">
        <tags>
          ${targetDoAction ? "<DoAction><actions><Stop/><EndAction/></actions></DoAction>" : ""}
          <PlaceObject2 replace="0" depth="1" objectID="4"><transform><Transform transX="0" transY="0"/></transform>${outgoingClipActions ? clipActions : ""}</PlaceObject2>
          <ShowFrame/>
          <End/>
        </tags>
      </DefineSprite>
      ${targetDoInitAction ? "<DoInitAction sprite=\"5\"><actions><EndAction/></actions></DoInitAction>" : ""}
      <PlaceObject2 replace="0" depth="1" objectID="5" name="structural"><transform><Transform transX="0" transY="0"/></transform>${incomingClipActions ? clipActions : ""}</PlaceObject2>
      <ShowFrame/>
      <ShowFrame/>
      <End/>
    </tags>
  </Header>
</swf>
`;
  const scripts = targetFfdecFrameScript
    ? "===== DefineSprite_5_Structural/frame_1/DoAction.as =====\nstop();\n"
    : "";
  const swfmillGzip = gzipSync(xml);
  const scriptsGzip = gzipSync(scripts);
  const manifest = {
    animationId,
    source: {swf: "source.swf", swfSha256: digest(sourceSwfBytes)},
    runtime: {frameCount: 2},
    implementation: {
      frameDomains: [
        {id: "root", sourceTimelineId: "root", frameCount: 2},
        ...(declareTargetDomain ? [{id: "sprite-5", sourceTimelineId: "sprite-5", frameCount: 1}] : []),
      ],
    },
  };
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    evidenceIndex: [
      {artifactId: "source-swf", path: "source.swf", sha256: digest(sourceSwfBytes)},
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: digest(swfmillGzip), uncompressedSha256: digest(xml)},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: digest(scriptsGzip), uncompressedSha256: digest(scripts)},
    ],
    timelineInventory: [
      {timelineId: "root", objectId: null, frameCount: 2, structuralReachability: "root"},
      {timelineId: "sprite-5", objectId: "5", frameCount: 1, structuralReachability: "reachable-from-root-placement-graph"},
    ],
  };
  return {
    animationId,
    manifest,
    inventory,
    inventorySha256: digest(JSON.stringify(inventory)),
    sourceSwfBytes,
    swfmillGzip,
    scriptsGzip,
    claimSpecs: [],
    singleFrameClaimSpec: {
      proofType: "single-frame-scriptless-structural-child",
      expectedTimelineCount,
      timelineIds,
    },
  };
}

function multiFrameFixture({
  targetDoAction = false,
  targetDoInitAction = false,
  targetFfdecFrameScript = false,
  incomingClipActions = false,
  dynamicAddressing = false,
  declareTargetDomain = false,
  secondRemovalFrame = 12,
  terminalSecond = false,
  expectedTerminalFrame = 12,
  targetFrameCount = 3,
  allowZeroWrap = false,
  nestedDeclaredParent = false,
  namedIncomingInstance = false,
  timelineIds = ["sprite-5"],
  expectedTimelineCount = timelineIds.length,
} = {}) {
  const animationId = "course-multi-frame-scriptless-fixture";
  const sourceSwfBytes = Buffer.from("multi-frame scriptless fixture SWF");
  const clipActions = "<clipActions><ClipActionRecords/></clipActions>";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="2">
    <size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size>
    <tags>
      <DefineShape objectID="1"><bounds><Rectangle left="0" right="100" top="0" bottom="100"/></bounds><styles/><shapes/></DefineShape>
      <DefineShape objectID="2"><bounds><Rectangle left="0" right="200" top="0" bottom="200"/></bounds><styles/><shapes/></DefineShape>
      <DefineShape objectID="3"><bounds><Rectangle left="0" right="300" top="0" bottom="300"/></bounds><styles/><shapes/></DefineShape>
      <DefineSprite objectID="5" frames="${targetFrameCount}">
        <tags>
          ${targetDoAction ? "<DoAction><actions><Stop/><EndAction/></actions></DoAction>" : ""}
          <PlaceObject2 replace="0" depth="1" objectID="1"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <ShowFrame/>
          <PlaceObject2 replace="1" depth="1" objectID="2"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <ShowFrame/>
          <PlaceObject2 replace="1" depth="1" objectID="3"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <ShowFrame/>
          ${repeat("<ShowFrame/>", targetFrameCount - 3)}
          <End/>
        </tags>
      </DefineSprite>
      ${targetDoInitAction ? "<DoInitAction sprite=\"5\"><actions><EndAction/></actions></DoInitAction>" : ""}
      <DefineSprite objectID="7" frames="12">
        <tags>
          <PlaceObject2 replace="0" depth="2" objectID="5"${namedIncomingInstance ? " name=\"namedChild\"" : ""}><transform><Transform transX="100" transY="200"/></transform>${incomingClipActions ? clipActions : ""}</PlaceObject2>
          <ShowFrame/>
          <PlaceObject2 replace="1" depth="2"><transform><Transform transX="120" transY="220"/></transform></PlaceObject2>
          ${repeat("<ShowFrame/>", 3)}
          <RemoveObject2 depth="2"/>
          ${repeat("<ShowFrame/>", 2)}
          <PlaceObject2 replace="0" depth="2" objectID="5"><transform><Transform transX="300" transY="400"/></transform></PlaceObject2>
          ${repeat("<ShowFrame/>", 5)}
          ${terminalSecond ? "" : "<RemoveObject2 depth=\"2\"/>"}
          <ShowFrame/>
          <End/>
        </tags>
      </DefineSprite>
      ${nestedDeclaredParent ? `<DefineSprite objectID="9" frames="2">
        <tags>
          <PlaceObject2 replace="0" depth="1" objectID="7" name="indirectParent"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <ShowFrame/>
          <ShowFrame/>
          <End/>
        </tags>
      </DefineSprite>` : ""}
      <PlaceObject2 replace="0" depth="1" objectID="${nestedDeclaredParent ? "9" : "7"}" name="animation"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
      <ShowFrame/>
      <ShowFrame/>
      <End/>
    </tags>
  </Header>
</swf>
`;
  const scripts = [
    targetFfdecFrameScript ? "===== DefineSprite_5/frame_1/DoAction.as =====\nstop();\n" : "",
    dynamicAddressing ? "===== frame_1/DoAction.as =====\neval(\"child\").gotoAndPlay(2);\n" : "",
  ].join("");
  const swfmillGzip = gzipSync(xml);
  const scriptsGzip = gzipSync(scripts);
  const manifest = {
    animationId,
    source: {swf: "source.swf", swfSha256: digest(sourceSwfBytes)},
    runtime: {frameCount: 2},
    implementation: {
      frameDomains: [
        {id: "root", sourceTimelineId: "root", frameCount: 2},
        {
          id: "sprite-7",
          ...(nestedDeclaredParent ? {
            kind: "nested",
            parentFrameDomainId: "root",
            sourceParentTimelineIds: ["sprite-9"],
            captureParentResolution: "root is the nearest universally declared containing capture domain; sourceParentTimelineIds preserve the exact direct source parents and parentEntryState remains unresolved",
            sourceProof: {
              authoritativeRuntimeEntryEstablished: false,
              strictAcceptanceEffect: "none",
            },
          } : {}),
          sourceTimelineId: "sprite-7",
          frameCount: 12,
        },
        ...(nestedDeclaredParent ? [{
          id: "sprite-9",
          kind: "nested",
          sourceTimelineId: "sprite-9",
          parentFrameDomainId: "root",
          frameCount: 2,
        }] : []),
        ...(declareTargetDomain ? [{id: "sprite-5", sourceTimelineId: "sprite-5", frameCount: targetFrameCount}] : []),
      ],
    },
  };
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    evidenceIndex: [
      {artifactId: "source-swf", path: "source.swf", sha256: digest(sourceSwfBytes)},
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: digest(swfmillGzip), uncompressedSha256: digest(xml)},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: digest(scriptsGzip), uncompressedSha256: digest(scripts)},
    ],
    timelineInventory: [
      {timelineId: "root", objectId: null, frameCount: 2, structuralReachability: "root"},
      {timelineId: "sprite-5", objectId: "5", frameCount: targetFrameCount, structuralReachability: "reachable-from-root-placement-graph"},
      {timelineId: "sprite-7", objectId: "7", frameCount: 12, structuralReachability: "reachable-from-root-placement-graph"},
      ...(nestedDeclaredParent ? [{
        timelineId: "sprite-9",
        objectId: "9",
        frameCount: 2,
        structuralReachability: "reachable-from-root-placement-graph",
      }] : []),
    ],
  };
  return {
    animationId,
    manifest,
    inventory,
    inventorySha256: digest(JSON.stringify(inventory)),
    sourceSwfBytes,
    swfmillGzip,
    scriptsGzip,
    claimSpecs: [],
    multiFrameClaimSpec: {
      proofType: "multi-frame-scriptless-parent-clock-composite-child",
      expectedTimelineCount,
      parentTimelineId: "sprite-7",
      parentSourceObjectId: "7",
      parentFrameDomainId: "sprite-7",
      parentFrameCount: 12,
      ...(nestedDeclaredParent ? {
        parentBindingMode: NESTED_DECLARED_PARENT_BINDING_MODE,
        parentEntryStateEstablished: false,
        parentRootPath: [
          {
            parentTimelineId: "root",
            childTimelineId: "sprite-9",
            sourceObjectId: "9",
            frame: 1,
            depth: "1",
            instanceName: "animation",
            tag: "PlaceObject2",
            replace: "0",
            hasClipActions: false,
          },
          {
            parentTimelineId: "sprite-9",
            childTimelineId: "sprite-7",
            sourceObjectId: "7",
            frame: 1,
            depth: "1",
            instanceName: "indirectParent",
            tag: "PlaceObject2",
            replace: "0",
            hasClipActions: false,
          },
        ],
      } : {
        rootPlacementFrame: 1,
        rootDepth: "1",
        rootInstanceName: "animation",
      }),
      timelines: timelineIds.map((timelineId) => ({
        timelineId,
        sourceObjectId: timelineId.replace("sprite-", ""),
        frameCount: targetFrameCount,
        expectedTagCensus: {End: 1, PlaceObject2: 3, ShowFrame: targetFrameCount},
        placements: [
          {
            frame: 1,
            depth: "2",
            removalFrame: 5,
            updateFrames: [2],
            ...(allowZeroWrap ? {allowZeroWrap: true} : {}),
          },
          {
            frame: 7,
            depth: "2",
            ...(terminalSecond
              ? {termination: {kind: "parent-timeline-terminal", frame: expectedTerminalFrame}}
              : {removalFrame: secondRemovalFrame}),
            updateFrames: [],
            ...(allowZeroWrap ? {allowZeroWrap: true} : {}),
          },
        ],
      })),
    },
  };
}

function nestedDeclaredParentFixtureWithDerivedSpec(options = {}) {
  const value = multiFrameFixture({
    ...options,
    nestedDeclaredParent: true,
  });
  const structure = parseSwfmillDispositionStructure(
    gunzipSync(value.swfmillGzip).toString("utf8"),
  );
  const scripts = parseFfdecDispositionScripts(
    gunzipSync(value.scriptsGzip).toString("utf8"),
  );
  const candidateAudit = deriveMultiFrameScriptlessCandidateAudit({
    animationId: value.animationId,
    structure,
    scripts,
    inventory: value.inventory,
    manifest: value.manifest,
  });
  value.multiFrameClaimSpec = deriveNestedDeclaredParentScriptlessCandidateSpecs({
    animationId: value.animationId,
    candidateAudit,
    manifest: value.manifest,
    structure,
    selectedTimelineIds: ["sprite-5"],
  });
  return {value, candidateAudit};
}

function rootParentMultiFrameFixture({
  targetDoInitAction = false,
  globalDoInitActionDrift = false,
  targetFfdecFrameScript = false,
  incomingClipActions = false,
  dynamicAddressing = false,
  expectedRemovalFrame = 43,
  expectedUpdateFrames = Array.from({length: 34}, (_, index) => index + 9),
} = {}) {
  const animationId = "formula-root-parent-multi-frame-fixture";
  const sourceSwfBytes = Buffer.from("root parent multi-frame fixture SWF");
  const clipActions = "<clipActions><ClipActionRecords/></clipActions>";
  const updates = Array.from({length: 34}, (_, index) => `
      <PlaceObject2 replace="1" depth="11"><transform><Transform transX="0" transY="${index + 1}"/></transform></PlaceObject2>
      <ShowFrame/>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="67">
    <size><Rectangle left="0" right="15600" top="0" bottom="7580"/></size>
    <tags>
      <DefineShape objectID="153"><bounds><Rectangle left="0" right="100" top="0" bottom="100"/></bounds><styles/><shapes/></DefineShape>
      <DefineShape objectID="154"><bounds><Rectangle left="0" right="100" top="0" bottom="100"/></bounds><styles/><shapes/></DefineShape>
      <DefineShape objectID="155"><bounds><Rectangle left="0" right="100" top="0" bottom="100"/></bounds><styles/><shapes/></DefineShape>
      <DefineSprite objectID="156" frames="3">
        <tags>
          <PlaceObject2 replace="0" depth="1" objectID="153"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <ShowFrame/>
          <PlaceObject2 replace="1" depth="1" objectID="154"/>
          <ShowFrame/>
          <PlaceObject2 replace="1" depth="1" objectID="155"/>
          <ShowFrame/>
          <End/>
        </tags>
      </DefineSprite>
      <DoInitAction sprite="21"><actions><EndAction/></actions></DoInitAction>
      <DoInitAction sprite="22"><actions><EndAction/></actions></DoInitAction>
      ${targetDoInitAction ? "<DoInitAction sprite=\"156\"><actions><EndAction/></actions></DoInitAction>" : ""}
      ${globalDoInitActionDrift ? "<DoInitAction sprite=\"23\"><actions><EndAction/></actions></DoInitAction>" : ""}
      ${repeat("<ShowFrame/>", 7)}
      <PlaceObject2 replace="0" depth="11" objectID="156"><transform><Transform transX="1696" transY="4679"/></transform>${incomingClipActions ? clipActions : ""}</PlaceObject2>
      <ShowFrame/>
      ${updates}
      <RemoveObject2 depth="11"/>
      ${repeat("<ShowFrame/>", 25)}
      <End/>
    </tags>
  </Header>
</swf>
`;
  const scripts = [
    "===== Replay/frame_67/DoAction.as =====\ngotoAndPlay(1);\n",
    targetFfdecFrameScript ? "===== DefineSprite_156/frame_1/DoAction.as =====\nstop();\n" : "",
    dynamicAddressing ? "===== frame_1/DoAction.as =====\neval(\"child\").gotoAndPlay(2);\n" : "",
  ].join("");
  const swfmillGzip = gzipSync(xml);
  const scriptsGzip = gzipSync(scripts);
  const manifest = {
    animationId,
    source: {swf: "source.swf", swfSha256: digest(sourceSwfBytes)},
    runtime: {frameCount: 67},
    implementation: {
      frameDomains: [
        {id: "root", sourceTimelineId: "root", frameCount: 67},
      ],
    },
  };
  const manifestSha256 = technicalManifestSha256(manifest);
  const inventory = {
    schemaVersion: 1,
    animationId,
    evidenceIndex: [
      {artifactId: "source-swf", path: "source.swf", sha256: digest(sourceSwfBytes)},
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: manifestSha256,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        hashMode: "canonical-json-v1",
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: digest(swfmillGzip), uncompressedSha256: digest(xml)},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: digest(scriptsGzip), uncompressedSha256: digest(scripts)},
    ],
    timelineInventory: [
      {timelineId: "root", objectId: null, frameCount: 67, structuralReachability: "root"},
      {timelineId: "sprite-156", objectId: "156", frameCount: 3, structuralReachability: "reachable-from-root-placement-graph"},
    ],
  };
  return {
    animationId,
    manifest,
    inventory,
    inventorySha256: digest(JSON.stringify(inventory)),
    sourceSwfBytes,
    swfmillGzip,
    scriptsGzip,
    claimSpecs: [],
    multiFrameClaimSpec: {
      proofType: "multi-frame-scriptless-parent-clock-composite-child",
      expectedTimelineCount: 1,
      parentTimelineId: "root",
      parentSourceObjectId: null,
      parentFrameDomainId: "root",
      parentFrameCount: 67,
      expectedGlobalDoInitActionSpriteObjectIds: ["21", "22"],
      timelines: [{
        timelineId: "sprite-156",
        sourceObjectId: "156",
        frameCount: 3,
        expectedTagCensus: {End: 1, PlaceObject2: 3, ShowFrame: 3},
        placements: [{
          frame: 8,
          depth: "11",
          removalFrame: expectedRemovalFrame,
          updateFrames: expectedUpdateFrames,
        }],
      }],
    },
  };
}

test("parses bounded static disposition evidence arguments", () => {
  const options = parseArguments(["--check", "--id", "course-g03-l06-ti-001", "--migrations", "migrations"]);
  assert.equal(options.check, true);
  assert.deepEqual(options.ids, ["course-g03-l06-ti-001"]);
  assert.equal(options.migrationsRoot.endsWith("/migrations"), true);
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("derives an off-stage audio child only as composite-with-parent and preserves every acceptance obligation", () => {
  const document = buildStaticCompositeEvidenceDocument(fixture());
  assert.equal(document.claims.length, 1);
  const [claim] = document.claims;
  assert.equal(claim.disposition, "composite-child-with-parent");
  assert.equal(claim.visualBounds.nativeStageIntersection, false);
  assert.equal(claim.audioStructure.blockCount, 3);
  assert.equal(claim.scriptReferenceAudit.selectorPrefix.occurrenceCount, 1);
  assert.equal(claim.scriptReferenceAudit.selectorVariable.occurrenceCount, 2);
  for (const obligation of Object.values(claim.preservedObligations)) {
    assert.equal(obligation.required, true);
    assert.equal(obligation.satisfiedByDisposition, false);
  }
  assert.deepEqual(Object.values(document.acceptanceEffects), [false, false, false, false, false, false, false, false]);
});

test("derives only the exact pinned one-frame scriptless structural-child set", () => {
  const document = buildStaticCompositeEvidenceDocument(singleFrameFixture());
  assert.equal(document.schemaVersion, 2);
  assert.deepEqual(document.claimSetContracts, [{
    proofType: "single-frame-scriptless-structural-child",
    expectedTimelineCount: 1,
    expectedTimelineIds: ["sprite-5"],
    verifiedTimelineCount: 1,
    verifiedTimelineIds: ["sprite-5"],
    exactMatch: true,
  }]);
  const [claim] = document.claims;
  assert.equal(claim.role, "single-frame-scriptless-structural-child");
  assert.equal(claim.claimScope, "independent-local-playhead-only");
  assert.equal(claim.tagCensus.observedShowFrameCount, 1);
  assert.equal(claim.scriptAudit.scriptless, true);
  assert.equal(claim.placementAudit.incomingPlacementCount, 1);
  assert.equal(claim.placementAudit.outgoingPlacementCount, 1);
  assert.equal(claim.placementAudit.clipActionCount, 0);
  assert.equal(claim.declaredFrameDomainAudit.notDeclared, true);
  assert.deepEqual(Object.keys(claim.preservedObligations), ["button", "interaction", "behavior", "fullFrame", "audio"]);
  for (const obligation of Object.values(claim.preservedObligations)) {
    assert.equal(obligation.required, true);
    assert.equal(obligation.satisfiedByDisposition, false);
  }
});

test("single-frame structural proof fails closed on scripts, init actions, clipActions, declared domains, and set drift", () => {
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({targetDoAction: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({targetDoInitAction: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({targetFfdecFrameScript: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({incomingClipActions: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({outgoingClipActions: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({declareTargetDomain: true})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({timelineIds: ["sprite-99"]})), /exact timeline set mismatch/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(singleFrameFixture({expectedTimelineCount: 2})), /pinned single-frame timeline count differs/);
});

test("derives every multi-frame scriptless child placement from the declared parent clock without accepting fidelity", () => {
  const document = buildStaticCompositeEvidenceDocument(multiFrameFixture());
  assert.equal(document.schemaVersion, 2);
  assert.deepEqual(document.claimSetContracts, [{
    proofType: "multi-frame-scriptless-parent-clock-composite-child",
    expectedTimelineCount: 1,
    expectedTimelineIds: ["sprite-5"],
    verifiedTimelineCount: 1,
    verifiedTimelineIds: ["sprite-5"],
    exactMatch: true,
  }]);
  const [claim] = document.claims;
  assert.equal(claim.role, "multi-frame-scriptless-parent-clock-composite-child");
  assert.equal(claim.sourceBinding.sha256, document.generatedFrom.sourceSwf.sha256);
  assert.equal(claim.placementLifecycleAudit.incomingPlacementCount, 2);
  assert.equal(claim.placementLifecycleAudit.parentUpdateCount, 1);
  assert.equal(claim.placementLifecycleAudit.explicitRemovalCount, 2);
  assert.deepEqual(claim.placementLifecycleAudit.lifetimes.map(({startFrame, endFrame, localPlayhead}) => ({
    startFrame,
    endFrame,
    wrapCount: localPlayhead.wrapCount,
    terminalLocalFrame: localPlayhead.terminalLocalFrame,
  })), [
    {startFrame: 1, endFrame: 4, wrapCount: 1, terminalLocalFrame: 1},
    {startFrame: 7, endFrame: 11, wrapCount: 1, terminalLocalFrame: 2},
  ]);
  assert.equal(claim.scriptAudit.externalTargetControlCount, 0);
  assert.equal(claim.sourcePlayheadRule.inferredLoopOrResetCount, 0);
  for (const obligation of ["visual", "behavior", "fullFrame", "rmse"]) {
    assert.equal(claim.preservedObligations[obligation].satisfiedByDisposition, false);
  }
});

test("multi-frame parent-clock proof fails closed on scripts, init, clipActions, dynamic control, domains, graph drift, and set drift", () => {
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({targetDoAction: true})), /exact tag census drifted/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({targetDoInitAction: true})), /global DoInitAction sprite object ID set/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({targetFfdecFrameScript: true})), /FFDec frame script prevents/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({incomingClipActions: true})), /has clipActions/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({dynamicAddressing: true})), /dynamic MovieClip addressing/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({declareTargetDomain: true})), /exhaustive undeclared reachable multi-frame partition/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({secondRemovalFrame: 11})), /termination kind\/frame\/depth drifted/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({timelineIds: ["sprite-99"]})), /scenario inventory must contain the timeline exactly once|exhaustive undeclared reachable multi-frame partition/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(multiFrameFixture({expectedTimelineCount: 2})), /pinned multi-frame timeline count differs/);
});

test("nested declared-parent proof preserves the generic direct-root rejection and binds only the parent-local clock", async () => {
  const {value, candidateAudit} = nestedDeclaredParentFixtureWithDerivedSpec();
  const inspection = candidateAudit.inspections.find(
    ({timelineId}) => timelineId === "sprite-5",
  );
  assert.equal(inspection.eligible, false);
  assert.deepEqual(inspection.disqualifiers, [
    INDIRECT_DECLARED_PARENT_DISQUALIFIER,
  ]);
  assert.deepEqual(candidateAudit.candidateSpecs, []);

  const document = buildStaticCompositeEvidenceDocument(value);
  assert.deepEqual(document.claimSetContracts, [{
    proofType: "multi-frame-scriptless-parent-clock-composite-child",
    expectedTimelineCount: 1,
    expectedTimelineIds: ["sprite-5"],
    verifiedTimelineCount: 1,
    verifiedTimelineIds: ["sprite-5"],
    exactMatch: true,
  }]);
  const [claim] = document.claims;
  assert.equal(claim.role, "multi-frame-scriptless-parent-clock-composite-child");
  assert.equal(claim.parentBinding.parentTimelineId, "sprite-7");
  assert.equal(claim.parentBinding.parentFrameCount, 12);
  assert.equal(claim.parentBinding.rootPlacement, null);
  assert.equal(
    claim.parentBinding.parentBindingMode,
    NESTED_DECLARED_PARENT_BINDING_MODE,
  );
  assert.equal(claim.parentBinding.parentEntryStateEstablished, false);
  assert.deepEqual(claim.parentBinding.parentRootPath, [
    {
      parentTimelineId: "root",
      childTimelineId: "sprite-9",
      sourceObjectId: "9",
      frame: 1,
      depth: "1",
      instanceName: "animation",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
    {
      parentTimelineId: "sprite-9",
      childTimelineId: "sprite-7",
      sourceObjectId: "7",
      frame: 1,
      depth: "1",
      instanceName: "indirectParent",
      tag: "PlaceObject2",
      replace: "0",
      hasClipActions: false,
    },
  ]);
  assert(Object.values(document.acceptanceEffects).every((value) => value === false));
  assert.match(document.strictAcceptanceEffect, /^none;/);
  const schema = JSON.parse(await readFile(
    path.join(projectRoot, "schemas", "static-frame-domain-disposition-evidence.schema.json"),
    "utf8",
  ));
  const validate = new Ajv({allErrors: true}).compile(schema);
  assert.equal(validate(document), true, JSON.stringify(validate.errors));

  const legacy = structuredClone(value);
  delete legacy.multiFrameClaimSpec[0].parentBindingMode;
  delete legacy.multiFrameClaimSpec[0].parentEntryStateEstablished;
  delete legacy.multiFrameClaimSpec[0].parentRootPath;
  legacy.multiFrameClaimSpec[0].rootPlacementFrame = 1;
  legacy.multiFrameClaimSpec[0].rootDepth = "1";
  legacy.multiFrameClaimSpec[0].rootInstanceName = "animation";
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(legacy),
    /root-to-multi-frame-parent: expected exactly one placement, found 0/,
  );
});

test("nested declared-parent proof rejects dynamic, named, scripted, clip, lifetime, graph, and root-path drift", () => {
  for (const [options, pattern] of [
    [{dynamicAddressing: true}, /requires exactly the indirect declared-parent disqualifier/],
    [{namedIncomingInstance: true}, /requires exactly the indirect declared-parent disqualifier/],
    [{targetDoAction: true}, /requires exactly the indirect declared-parent disqualifier/],
    [{targetDoInitAction: true}, /requires exactly the indirect declared-parent disqualifier/],
    [{targetFfdecFrameScript: true}, /requires exactly the indirect declared-parent disqualifier/],
    [{incomingClipActions: true}, /requires exactly the indirect declared-parent disqualifier/],
  ]) {
    assert.throws(
      () => nestedDeclaredParentFixtureWithDerivedSpec(options),
      pattern,
    );
  }

  const lifetime = nestedDeclaredParentFixtureWithDerivedSpec().value;
  lifetime.multiFrameClaimSpec[0].timelines[0].placements[1].termination.frame = 11;
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(lifetime),
    /termination kind\/frame\/depth drifted/,
  );

  const graph = nestedDeclaredParentFixtureWithDerivedSpec().value;
  graph.multiFrameClaimSpec[0].timelines[0].expectedTagCensus.PlaceObject2 = 4;
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(graph),
    /exact tag census drifted/,
  );

  const boundary = nestedDeclaredParentFixtureWithDerivedSpec().value;
  boundary.multiFrameClaimSpec[0].parentRootPath[1].sourceObjectId = "999";
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(boundary),
    /nested declared-parent root path edge 2 is invalid/,
  );

  const entryState = nestedDeclaredParentFixtureWithDerivedSpec().value;
  entryState.multiFrameClaimSpec[0].parentEntryStateEstablished = true;
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(entryState),
    /must preserve unresolved parent entry state/,
  );
});

test("parent-clock proof admits exact parent-terminal and zero-wrap lifetimes only through explicit pinned contracts", () => {
  const document = buildStaticCompositeEvidenceDocument(multiFrameFixture({
    terminalSecond: true,
    targetFrameCount: 6,
    allowZeroWrap: true,
  }));
  const [claim] = document.claims;
  assert.equal(claim.placementLifecycleAudit.explicitRemovalCount, 1);
  assert.equal(claim.placementLifecycleAudit.parentTerminalTerminationCount, 1);
  assert.equal(claim.placementLifecycleAudit.replacementTerminationCount, 0);
  assert.equal(claim.placementLifecycleAudit.zeroWrapLifetimeCount, 2);
  assert.deepEqual(
    claim.placementLifecycleAudit.lifetimes.map((lifetime) => ({
      kind: lifetime.termination.kind,
      terminationFrame: lifetime.termination.frame,
      terminalPermit: lifetime.terminalAtParentEndPermittedByPinnedSpec || false,
      wrapCount: lifetime.localPlayhead.wrapCount,
      zeroWrapPermit: lifetime.localPlayhead.zeroWrapPermittedByPinnedSpec,
      segmentCount: lifetime.localPlayhead.segments.length,
    })),
    [
      {
        kind: "removal",
        terminationFrame: 5,
        terminalPermit: false,
        wrapCount: 0,
        zeroWrapPermit: true,
        segmentCount: 1,
      },
      {
        kind: "parent-timeline-terminal",
        terminationFrame: 12,
        terminalPermit: true,
        wrapCount: 0,
        zeroWrapPermit: true,
        segmentCount: 1,
      },
    ],
  );
  assert.deepEqual(Object.values(document.acceptanceEffects), [false, false, false, false, false, false, false, false]);
});

test("parent-clock proof rejects implicit zero-wrap, overbroad zero-wrap, and inexact parent-terminal contracts", () => {
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(multiFrameFixture({terminalSecond: true, targetFrameCount: 6})),
    /zero-wrap lifetime lacks an explicit pinned allowance/,
  );
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(multiFrameFixture({allowZeroWrap: true})),
    /zero-wrap allowance is overbroad/,
  );
  assert.throws(
    () => buildStaticCompositeEvidenceDocument(multiFrameFixture({
      terminalSecond: true,
      targetFrameCount: 6,
      allowZeroWrap: true,
      expectedTerminalFrame: 11,
    })),
    /parent-terminal contract must equal the exact parent terminal frame/,
  );
});

test("derives a root-parent multi-frame child from an exact init/action and placement lifetime", () => {
  const document = buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture());
  const [claim] = document.claims;
  assert.equal(claim.parentBinding.parentTimelineId, "root");
  assert.equal(claim.parentBinding.parentSourceObjectId, null);
  assert.equal(claim.parentBinding.rootPlacement, null);
  assert.deepEqual(claim.scriptAudit.globalDoInitActionSpriteObjectIds, ["21", "22"]);
  assert.deepEqual(claim.scriptAudit.expectedGlobalDoInitActionSpriteObjectIds, ["21", "22"]);
  assert.equal(claim.scriptAudit.globalDoInitActionSetExactMatch, true);
  assert.equal(claim.placementLifecycleAudit.parentUpdateCount, 34);
  assert.deepEqual(
    claim.placementLifecycleAudit.lifetimes.map(({startFrame, endFrame, localPlayhead}) => ({
      startFrame,
      endFrame,
      completeVisibleCycleCount: localPlayhead.completeVisibleCycleCount,
      wrapCount: localPlayhead.wrapCount,
      terminalLocalFrame: localPlayhead.terminalLocalFrame,
    })),
    [{startFrame: 8, endFrame: 42, completeVisibleCycleCount: 11, wrapCount: 11, terminalLocalFrame: 2}],
  );
  for (const obligation of Object.values(claim.preservedObligations)) {
    assert.equal(obligation.satisfiedByDisposition, false);
  }
});

test("root-parent multi-frame proof rejects target/global init, script, clip, dynamic, update, and removal drift", () => {
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({targetDoInitAction: true})), /global DoInitAction sprite object ID set/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({globalDoInitActionDrift: true})), /global DoInitAction sprite object ID set/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({targetFfdecFrameScript: true})), /FFDec frame script prevents/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({incomingClipActions: true})), /has clipActions/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({dynamicAddressing: true})), /dynamic MovieClip addressing/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({expectedUpdateFrames: [9]})), /parent update graph drifted/);
  assert.throws(() => buildStaticCompositeEvidenceDocument(rootParentMultiFrameFixture({expectedRemovalFrame: 42})), /termination kind\/frame\/depth drifted/);
});

test("rejects a stale machine-evidence hash", () => {
  const current = fixture();
  current.inventory.evidenceIndex.find(({artifactId}) => artifactId === "swfmill-xml").sha256 = digest("stale");
  assert.throws(() => buildStaticCompositeEvidenceDocument(current), /swfmill compressed SHA-256 is stale/);
});

test("rejects a wrong parent or timeline", () => {
  const current = fixture({parentTimelineId: "sprite-99"});
  assert.throws(() => buildStaticCompositeEvidenceDocument(current), /parent frame domain must name the proven parent timeline|parent timeline identity is wrong or missing/);
});

test("rejects audio-child placement, removal-lifetime, and clipActions drift", () => {
  const wrongDepth = fixture();
  wrongDepth.claimSpecs[0].parentDepth = "999";
  assert.throws(() => buildStaticCompositeEvidenceDocument(wrongDepth), /parent-to-child: expected exactly one placement/);

  const wrongRemoval = fixture();
  wrongRemoval.claimSpecs[0].parentRemovalFrame = 7;
  assert.throws(() => buildStaticCompositeEvidenceDocument(wrongRemoval), /removal frame 6 does not match 7/);

  assert.throws(() => buildStaticCompositeEvidenceDocument(fixture({parentClipActions: true})), /parent-to-child placement has clip actions/);
});

test("rejects missing SoundStreamBlock evidence", () => {
  const current = fixture({soundBlockCount: 2});
  assert.throws(() => buildStaticCompositeEvidenceDocument(current), /unsupported tag census|SoundStreamBlock count/);
});

test("rejects a visual marker whose composed bounds intersect the native stage", () => {
  const current = fixture({rootTranslationX: 1000});
  assert.throws(() => buildStaticCompositeEvidenceDocument(current), /composed visual bounds intersect the native stage/);
});

test("rejects forged or unsupported disposition values", () => {
  const current = fixture({disposition: "nonvisual"});
  assert.throws(() => buildStaticCompositeEvidenceDocument(current), /unsupported static disposition nonvisual/);
});

test("all checked-in static evidence is reproducible and conforms to the strict schema", async () => {
  const results = await buildStaticFrameDomainDispositionEvidence({check: true});
  const expectedCounts = new Map([
    ["course-g03-l01-ts-008", 6],
    ["course-g03-l01-vb-004", 3],
    ["course-g03-l06-fq-002-review", 250],
    ["course-g03-l06-ti-001", 2],
    ["course-g03-l08-re-001", 100],
    ["course-g04-l01-ir-001", 4],
    ["course-g04-l03-in-009", 4],
    ["course-g04-l03-ts-006", 1],
    ["course-g04-l09-gs-002", 12],
    ["course-g05-l13-rw-002", 4],
    ["formula-elementary-conversion-01-01", 2],
    ["formula-elementary-conversion-01-02", 2],
    ["formula-elementary-conversion-01-03", 2],
    ["formula-elementary-conversion-01-04", 3],
    ["shell-course-g04-l01-index-local", 80],
    ["shell-course-g04-l03-index-local", 56],
    ...Object.entries(G4_L3_REVIEWED_SINGLE_FRAME_SCRIPTLESS_CLAIM_SPECS)
      .map(([animationId, spec]) => [animationId, spec.expectedTimelineCount]),
  ]);
  for (const [animationId, specs] of Object.entries(G4_L3_REVIEWED_MULTI_FRAME_SCRIPTLESS_CLAIM_SPECS)) {
    expectedCounts.set(animationId, (expectedCounts.get(animationId) || 0) + specs.reduce((sum, spec) => sum + spec.expectedTimelineCount, 0));
  }
  const expected = [...expectedCounts].sort(([left], [right]) => left.localeCompare(right));
  assert.deepEqual(results.map(({document}) => [document.animationId, document.claims.length]), expected);
  assert.equal(results.every(({action}) => action === "verified"), true);
  const schema = JSON.parse(await readFile(path.join(projectRoot, "schemas", "static-frame-domain-disposition-evidence.schema.json"), "utf8"));
  const validate = new Ajv({allErrors: true}).compile(schema);
  for (const result of results) assert.equal(validate(result.document), true, JSON.stringify(validate.errors));

  const ir = results.find(({document}) => document.animationId === "course-g04-l01-ir-001").document;
  const irAudioClaims = ir.claims.filter(({role}) => role === "audio-only-offstage-visual-marker");
  assert.deepEqual(irAudioClaims.map(({timelineId}) => timelineId), ["sprite-7", "sprite-8"]);
  assert.deepEqual(irAudioClaims.map(({parentTimelineId}) => parentTimelineId), ["sprite-58", "sprite-58"]);
  assert.deepEqual(irAudioClaims.map(({lifetime}) => lifetime), [
    {parentPlacementFrame: 1, parentRemovalFrame: 137, parentPlacementUpdateCount: 0, childPlacementUpdateCount: 0, clipActionCount: 0},
    {parentPlacementFrame: 1, parentRemovalFrame: 137, parentPlacementUpdateCount: 0, childPlacementUpdateCount: 0, clipActionCount: 0},
  ]);
  assert.equal(irAudioClaims.every(({visualBounds}) => visualBounds.nativeStageIntersection === false), true);

  for (const id of [
    "formula-elementary-conversion-01-01",
    "formula-elementary-conversion-01-02",
    "formula-elementary-conversion-01-03",
    "formula-elementary-conversion-01-04",
  ]) {
    const document = results.find(({document: item}) => item.animationId === id).document;
    const singleFrameClaims = document.claims.filter(({role}) => role === "single-frame-scriptless-structural-child");
    assert.deepEqual(singleFrameClaims.map(({timelineId}) => timelineId), ["sprite-131", "sprite-134"]);
    assert.equal(singleFrameClaims.every(({claimScope}) => claimScope === "independent-local-playhead-only"), true);
    assert.equal(document.claims.every(({preservedObligations}) => (
      Object.values(preservedObligations).every(({satisfiedByDisposition}) => satisfiedByDisposition === false)
    )), true);
  }
  const conversion04 = results.find(({document}) => document.animationId === "formula-elementary-conversion-01-04").document;
  const sprite156 = conversion04.claims.find(({timelineId}) => timelineId === "sprite-156");
  assert.equal(sprite156.role, "multi-frame-scriptless-parent-clock-composite-child");
  assert.equal(sprite156.parentBinding.parentTimelineId, "root");
  assert.equal(sprite156.placementLifecycleAudit.parentUpdateCount, 34);
  assert.equal(sprite156.scriptAudit.globalDoInitActionCount, 21);

  const in009 = results.find(({document}) => document.animationId === "course-g04-l03-in-009").document;
  const in009MultiFrame = in009.claims.filter(({role}) => role === "multi-frame-scriptless-parent-clock-composite-child");
  assert.deepEqual(in009MultiFrame.map(({timelineId}) => timelineId), ["sprite-123", "sprite-146", "sprite-150"]);
  assert.deepEqual(in009MultiFrame.map(({placementLifecycleAudit}) => ({
    incoming: placementLifecycleAudit.incomingPlacementCount,
    removals: placementLifecycleAudit.explicitRemovalCount,
    terminals: placementLifecycleAudit.parentTerminalTerminationCount,
    replacements: placementLifecycleAudit.replacementTerminationCount,
    zeroWraps: placementLifecycleAudit.zeroWrapLifetimeCount,
  })), [
    {incoming: 2, removals: 1, terminals: 1, replacements: 0, zeroWraps: 1},
    {incoming: 2, removals: 1, terminals: 1, replacements: 0, zeroWraps: 1},
    {incoming: 3, removals: 2, terminals: 1, replacements: 0, zeroWraps: 3},
  ]);
  assert.equal(in009MultiFrame.every(({parentBinding}) => parentBinding.parentTimelineId === "sprite-200"), true);
  assert.equal(in009MultiFrame.every(({preservedObligations}) => (
    Object.values(preservedObligations).every(({satisfiedByDisposition}) => satisfiedByDisposition === false)
  )), true);

  const ts006 = results.find(({document}) => document.animationId === "course-g04-l03-ts-006").document;
  assert.deepEqual(ts006.claims.map(({timelineId, role, claimScope}) => ({timelineId, role, claimScope})), [{
    timelineId: "sprite-3",
    role: "single-frame-scriptless-structural-child",
    claimScope: "independent-local-playhead-only",
  }]);
  assert.equal(Object.values(ts006.claims[0].preservedObligations)
    .every(({satisfiedByDisposition}) => satisfiedByDisposition === false), true);

  const shellG4L3 = results.find(({document}) => document.animationId === "shell-course-g04-l03-index-local").document;
  assert.equal(shellG4L3.claims.length, 56);
  assert.equal(shellG4L3.claims.every(({role}) => role === "single-frame-scriptless-structural-child"), true);
  assert.equal(shellG4L3.claims.every(({claimScope}) => claimScope === "independent-local-playhead-only"), true);
  assert.deepEqual(
    shellG4L3.claims.map(({timelineId}) => timelineId),
    [
      "sprite-86", "sprite-107", "sprite-109", "sprite-113", "sprite-115", "sprite-117", "sprite-138", "sprite-170",
      "sprite-174", "sprite-178", "sprite-182", "sprite-184", "sprite-188", "sprite-190", "sprite-197", "sprite-235",
      "sprite-241", "sprite-265", "sprite-566", "sprite-567", "sprite-584", "sprite-596", "sprite-601", "sprite-602",
      "sprite-609", "sprite-611", "sprite-689", "sprite-691", "sprite-694", "sprite-696", "sprite-700", "sprite-799",
      "sprite-818", "sprite-832", "sprite-843", "sprite-853", "sprite-866", "sprite-874", "sprite-883", "sprite-891",
      "sprite-898", "sprite-905", "sprite-912", "sprite-919", "sprite-926", "sprite-933", "sprite-940", "sprite-949",
      "sprite-957", "sprite-964", "sprite-971", "sprite-978", "sprite-988", "sprite-996", "sprite-1003", "sprite-1010",
    ],
  );
  assert.equal(shellG4L3.claims.every(({preservedObligations}) => (
    Object.values(preservedObligations).every(({satisfiedByDisposition}) => satisfiedByDisposition === false)
  )), true);
});
